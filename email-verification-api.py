from flask import Flask, request, jsonify
import smtplib
import dns.resolver
import random
import string
import time
import requests
from concurrent.futures import ThreadPoolExecutor
from dns.exception import DNSException
import logging
from functools import lru_cache
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import datetime
import os

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)

# Constants
SMTP_TIMEOUT = 60
SCRIPT_TIMEOUT = 20000
WORKER_THREADS = 50
DAILY_EMAIL_LIMIT = 10000  # 10k emails per day limit
REDIS_EXPIRY = 24 * 60 * 60  # 24 hours in seconds 
MAX_EMAILS_PER_REQUEST = 500

# Database connection details - Updated to use new Neon database
DATABASE_URL = os.getenv('API_SYSTEM_NEON_CONNECTION_STRING', 
    "postgresql://uv-api_owner:npg_7RP3jveWAUuf@ep-mute-violet-a5j5rrd6-pooler.us-east-2.aws.neon.tech/uv-api?sslmode=require")

# Your Next.js app URL for subscription checks
NEXTJS_APP_URL = os.getenv('NEXTJS_APP_URL', 'https://uv-app-iota.vercel.app')

# Redis connection for API usage tracking
REDIS_API_USAGE_URL = os.getenv('REDIS_API_USAGE_URL', 
    "redis://default:PvpyKDPNNDYXOULHOgBZZpNIWzWANuey@mainline.proxy.rlwy.net:39947")

# Initialize ThreadPoolExecutor
executor = ThreadPoolExecutor(max_workers=WORKER_THREADS)

# Initialize Redis client with connection pool and error handling
try:
    redis_client = redis.from_url(REDIS_API_USAGE_URL, decode_responses=True)
    # Test the connection
    redis_client.ping()
    app.logger.info("Redis connection successful")
except Exception as e:
    app.logger.error(f"Redis connection failed: {e}")
    # Fallback to a dummy implementation that won't block the application
    class DummyRedis:
        def exists(self, key): return False
        def get(self, key): return "0"
        def set(self, key, value, ex=None): pass
        def ttl(self, key): return 900  # 15 minutes in seconds
    redis_client = DummyRedis()
    app.logger.warning("Using dummy Redis client - rate limiting will not be enforced")

# Database connection
def get_db_connection():
    try:
        conn = psycopg2.connect(
            DATABASE_URL,
            cursor_factory=RealDictCursor
        )
        return conn
    except Exception as e:
        app.logger.error(f"Error connecting to database: {e}")
        return None

# Check and update user's API usage
def check_api_usage(user_id, requested_emails_count):
    """
    Check if user has enough quota left and update their usage.
    Returns (can_proceed, remaining_quota, error_message)
    """
    if not user_id:
        return False, 0, "User ID is missing"
    
    try:
        # Redis key for user's usage
        usage_key = f"api_usage:{user_id}"
        
        # Check if user has an existing usage record
        if redis_client.exists(usage_key):
            # Get current usage
            current_usage_str = redis_client.get(usage_key)
            try:
                current_usage = int(current_usage_str) if current_usage_str else 0
            except (TypeError, ValueError):
                app.logger.error(f"Invalid usage value in Redis: {current_usage_str}")
                current_usage = 0
                
            remaining = DAILY_EMAIL_LIMIT - current_usage
            
            # Check if user has enough quota left
            if requested_emails_count > remaining:
                return False, remaining, "Daily email verification limit exceeded"
            
            # Update usage
            new_usage = current_usage + requested_emails_count
            # Get the current TTL before updating
            ttl = redis_client.ttl(usage_key)
            # Only set with expiry if the key doesn't exist or has no expiry
            if ttl <= 0:
                redis_client.set(usage_key, str(new_usage), ex=REDIS_EXPIRY)
            else:
                # Update the value but preserve the existing TTL
                redis_client.set(usage_key, str(new_usage))
                # Restore the previous TTL
                redis_client.expire(usage_key, ttl)
            
            remaining = DAILY_EMAIL_LIMIT - new_usage
            
            app.logger.info(f"Updated usage for user {user_id}: {new_usage}/{DAILY_EMAIL_LIMIT}")
            return True, remaining, None
        else:
            # First usage of the day
            if requested_emails_count > DAILY_EMAIL_LIMIT:
                return False, DAILY_EMAIL_LIMIT, "Requested emails exceed daily limit"
            
            # Set initial usage
            redis_client.set(usage_key, str(requested_emails_count), ex=REDIS_EXPIRY)
            remaining = DAILY_EMAIL_LIMIT - requested_emails_count
            
            app.logger.info(f"Created new usage record for user {user_id}: {requested_emails_count}/{DAILY_EMAIL_LIMIT}")
            return True, remaining, None
    
    except Exception as e:
        app.logger.error(f"Error checking API usage: {e}")
        # If Redis fails, allow the request but log the error
        return True, DAILY_EMAIL_LIMIT, f"Error tracking usage: {str(e)}"

# Get user's remaining quota
def get_remaining_quota(user_id):
    """
    Get user's remaining email verification quota
    Returns (remaining_quota, reset_time)
    """
    if not user_id:
        return 0, None
    
    try:
        # Redis key for user's usage
        usage_key = f"api_usage:{user_id}"
        
        # Check if user has an existing usage record
        if redis_client.exists(usage_key):
            # Get current usage and TTL
            current_usage = int(redis_client.get(usage_key))
            ttl = redis_client.ttl(usage_key)
            
            # Calculate reset time
            reset_time = datetime.datetime.now() + datetime.timedelta(seconds=ttl)
            
            return DAILY_EMAIL_LIMIT - current_usage, reset_time
        else:
            # No usage record means full quota
            return DAILY_EMAIL_LIMIT, None
    
    except Exception as e:
        app.logger.error(f"Error getting remaining quota: {e}")
        return 0, None

# Check if user has an active subscription via Next.js API
def check_subscription_status(user_id):
    if not user_id:
        return False, "User ID is missing"
    
    try:
        # Call your Next.js API to check subscription
        response = requests.get(
            f"{NEXTJS_APP_URL}/api/check-subscription/{user_id}",
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            has_subscription = data.get('hasSubscription', False)
            
            if not has_subscription:
                return False, "No active subscription found"
            
            return True, None
        else:
            app.logger.error(f"Subscription check failed with status {response.status_code}: {response.text}")
            return False, f"Subscription check failed: {response.status_code}"
    
    except requests.exceptions.RequestException as e:
        app.logger.error(f"Error checking subscription via API: {e}")
        return False, f"Error checking subscription: {str(e)}"
    except Exception as e:
        app.logger.error(f"Unexpected error checking subscription: {e}")
        return False, f"Error checking subscription: {str(e)}"

# Validate API key
def validate_api_key(api_key):
    if not api_key:
        return None, "API key is missing"
    
    # Connect to database
    conn = get_db_connection()
    if not conn:
        return None, "Database connection error"
    
    cur = conn.cursor()
    
    try:
        # Check if API key exists in database
        cur.execute("SELECT * FROM api_keys WHERE key = %s AND is_active = true", (api_key,))
        key_record = cur.fetchone()
        
        if not key_record:
            return None, "Invalid API key"
        
        # Update last_used timestamp
        cur.execute(
            "UPDATE api_keys SET last_used = CURRENT_TIMESTAMP WHERE id = %s",
            (key_record["id"],)
        )
        conn.commit()
        
        # Return user_id for potential further use
        return key_record["user_id"], None
    except Exception as e:
        conn.rollback()
        app.logger.error(f"Error validating API key: {e}")
        return None, f"Error validating API key: {str(e)}"
    finally:
        cur.close()
        conn.close()

# Caching MX records to reduce DNS lookups
@lru_cache(maxsize=1024)
def get_mx_record(domain):
    resolver = dns.resolver.Resolver()
    resolver.lifetime = SMTP_TIMEOUT
    try:
        mx_records = resolver.resolve(domain, 'MX')
        return str(mx_records[0].exchange)
    except dns.resolver.NoAnswer:
        app.logger.error(f"No MX records found for {domain}")
    except dns.resolver.NXDOMAIN:
        app.logger.error(f"Domain does not exist: {domain}")
    except DNSException as e:
        app.logger.error(f"DNS query failed for {domain}: {e}")
    return None

def is_catch_all(mx_record, domain):
    try:
        with smtplib.SMTP(mx_record, 25, timeout=SMTP_TIMEOUT) as server:
            server.set_debuglevel(0)
            server.ehlo()
            server.mail('radam@paidclient.com')
            random_address = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10)) + '@' + domain
            code, _ = server.rcpt(random_address)
            return code == 250
    except Exception as e:
        app.logger.error(f"Catch-all check failed for {domain}: {e}")
        return False

def smtp_handshake(mx_record, email):
    try:
        with smtplib.SMTP(mx_record, 25, timeout=SMTP_TIMEOUT) as server:
            server.set_debuglevel(0)
            server.ehlo()
            server.mail('radam@paidclient.com')
            code, message = server.rcpt(email)
            if code == 250:
                return True, None
            else:
                error_message = message.decode('utf-8') if message else 'Unknown error'
                return False, error_message
    except smtplib.SMTPServerDisconnected:
        return False, "SMTP server disconnected unexpectedly"
    except smtplib.SMTPResponseException as e:
        error_message = f"{e.smtp_code}, {e.smtp_error.decode('utf-8')}"
        return False, error_message
    except Exception as e:
        return False, f"SMTP handshake failed: {str(e)}"

def categorize_email(is_valid, is_catch_all, error=None):
    """
    Categorize email verification results:
    - Good: Valid email that is not a catch-all address
    - Risky: Valid email but is a catch-all address, or has errors
    - Bad: Invalid email address
    """
    if error or not is_valid:
        return 'Risky' if is_valid else 'Bad'
    return 'Good' if is_valid and not is_catch_all else 'Risky'

def check_timeout(start_time):
    if time.time() - start_time > SCRIPT_TIMEOUT:
        raise Exception("Script execution exceeded time limit")

def process_single_email(email):
    result = {
        "email": email,
        "category": "Bad",
        "valid": "Invalid",
        "catch_all": "Unknown"
    }

    domain = email.split('@')[-1]
    mx_record = get_mx_record(domain)
    if not mx_record:
        # Log the detailed error but don't include it in the response
        app.logger.error(f"No MX records found for {domain}")
        return result

    is_valid, error_message = smtp_handshake(mx_record, email)
    catch_all_status = is_catch_all(mx_record, domain) if is_valid else False

    # Log the detailed error for debugging
    if error_message:
        app.logger.info(f"Email validation error for {email}: {error_message}")

    result.update({
        "category": categorize_email(is_valid, catch_all_status, error=error_message),
        "valid": "Valid" if is_valid else "Invalid",
        "catch_all": "Yes" if catch_all_status else "No"
    })

    return result

@app.route('/email_verification', methods=['POST'])
def verify_emails():
    start_time = time.time()
    try:
        # Get API key from header
        api_key = request.headers.get('X-API-Key')
        user_id, error = validate_api_key(api_key)
        
        if error:
            return jsonify({"error": error}), 401
            
        # Check if user has an active subscription via Next.js API
        has_subscription, sub_error = check_subscription_status(user_id)
        if not has_subscription:
            app.logger.warning(f"Subscription check failed for user {user_id}: {sub_error}")
            return jsonify({
                "error": "Subscription required", 
                "message": "Your subscription is not active. Please renew your subscription to continue using this service."
            }), 403

        request_json = request.get_json()
        if not request_json or 'emails' not in request_json:
            return jsonify({"error": "No email addresses provided"}), 400

        emails = request_json['emails']
        email_count = len(emails)
        
        # Check if the number of emails exceeds the maximum allowed
        if email_count > MAX_EMAILS_PER_REQUEST:
            app.logger.warning(f"User {user_id} attempted to verify {email_count} emails, exceeding the limit of {MAX_EMAILS_PER_REQUEST}")
            return jsonify({
                "error": "Request entity too large",
                "message": f"Maximum of {MAX_EMAILS_PER_REQUEST} emails allowed per request. You sent {email_count} emails.",
                "max_emails_per_request": MAX_EMAILS_PER_REQUEST
            }), 413
        
        # Check API usage limits
        can_proceed, remaining, usage_error = check_api_usage(user_id, email_count)
        if not can_proceed:
            app.logger.warning(f"Rate limit exceeded for user {user_id}: {usage_error}")
            return jsonify({
                "error": "Rate limit exceeded",
                "message": usage_error,
                "remaining_quota": remaining,
                "reset_in_minutes": int(REDIS_EXPIRY / 60)
            }), 429

        future_results = [executor.submit(process_single_email, email) for email in emails]
        results = []
        for future in future_results:
            try:
                result = future.result()
                results.append(result)
            except Exception as e:
                app.logger.error(f"Error in thread execution: {e}")
                results.append({
                    "email": "unknown",
                    "category": "Risky",
                    "valid": "Unknown",
                    "catch_all": "Unknown"
                })

        end_time = time.time()
        total_time = end_time - start_time
        app.logger.info(f"Email verification completed in {total_time:.2f} seconds")
        
        # Get updated remaining quota
        remaining_quota, reset_time = get_remaining_quota(user_id)
        reset_time_str = reset_time.strftime("%Y-%m-%d %H:%M:%S") if reset_time else None
        
        return jsonify({
            "results": results,
            "execution_time": f"{total_time:.2f} seconds",
            "usage": {
                "remaining_quota": remaining_quota,
                "reset_at": reset_time_str
            }
        })
    except Exception as e:
        app.logger.error(f"Unhandled exception during email verification: {e}")
        return jsonify({"error": "An unexpected error occurred during email verification", "details": str(e)}), 500

# Endpoint to check user's API usage
@app.route('/api/usage', methods=['GET'])
def check_usage():
    try:
        # Get API key from header
        api_key = request.headers.get('X-API-Key')
        user_id, error = validate_api_key(api_key)
        
        if error:
            return jsonify({"error": error}), 401
        
        # Get remaining quota
        remaining_quota, reset_time = get_remaining_quota(user_id)
        reset_time_str = reset_time.strftime("%Y-%m-%d %H:%M:%S") if reset_time else None
        
        return jsonify({
            "user_id": user_id,
            "daily_limit": DAILY_EMAIL_LIMIT,
            "remaining_quota": remaining_quota,
            "used_quota": DAILY_EMAIL_LIMIT - remaining_quota,
            "reset_at": reset_time_str,
            "reset_in_minutes": int(REDIS_EXPIRY / 60) if reset_time else 0
        })
    except Exception as e:
        app.logger.error(f"Error checking usage: {e}")
        return jsonify({"error": "An error occurred while checking usage", "details": str(e)}), 500

# Public health check endpoint (no API key required)
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "timestamp": datetime.datetime.now().isoformat()})

@app.errorhandler(Exception)
def handle_general_exception(error):
    app.logger.error(f"Unhandled exception: {error}")
    return jsonify({"error": "An unexpected error occurred", "details": str(error)}), 500

if __name__ == "__main__":
    # Use environment variable for port, default to 8080
    port = int(os.getenv('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=False) 