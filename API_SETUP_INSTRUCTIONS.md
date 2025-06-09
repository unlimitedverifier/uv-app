# Email Verification API Setup Instructions

## Overview

This system provides a robust email verification API that integrates with your Next.js app. It includes:

- **Flask API Server** - Handles email verification with SMTP validation
- **Next.js Integration** - Manages API keys and subscription checks
- **Neon Database** - Stores API keys and user data
- **Redis** - Handles rate limiting and usage tracking
- **Update.dev Integration** - Subscription management

## 1. Database Setup

### Create Neon Database Tables

Run this SQL command in your Neon database console:

```sql
-- API Keys table for the email verification service
CREATE TABLE IF NOT EXISTS api_keys (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    key VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys (key);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys (user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys (is_active);
```

### Using curl to setup the database:

```bash
# Replace with your actual Neon connection string
export NEON_CONNECTION_STRING="postgresql://uv-api_owner:npg_7RP3jveWAUuf@ep-mute-violet-a5j5rrd6-pooler.us-east-2.aws.neon.tech/uv-api?sslmode=require"

# Create the table
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"query": "CREATE TABLE IF NOT EXISTS api_keys (id SERIAL PRIMARY KEY, user_id UUID NOT NULL, key VARCHAR(255) UNIQUE NOT NULL, name VARCHAR(100), is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP);"}' \
  "$NEON_CONNECTION_STRING"
```

## 2. Environment Variables

Add these to your `.env.local` file:

```env
# New Neon Database for API System
API_SYSTEM_NEON_CONNECTION_STRING="postgresql://uv-api_owner:npg_7RP3jveWAUuf@ep-mute-violet-a5j5rrd6-pooler.us-east-2.aws.neon.tech/uv-api?sslmode=require"

# Your Next.js app URL (for subscription checks)
NEXTJS_APP_URL="http://localhost:3000"

# Redis for rate limiting (you can use your existing Railway Redis)
REDIS_API_USAGE_URL="redis://default:PvpyKDPNNDYXOULHOgBZZpNIWzWANuey@mainline.proxy.rlwy.net:39947"
```

## 3. Flask API Server Setup

### Install Dependencies

```bash
pip install flask psycopg2-binary redis dnspython requests
```

### Run the Flask Server

```bash
# Set environment variables
export API_SYSTEM_NEON_CONNECTION_STRING="postgresql://uv-api_owner:npg_7RP3jveWAUuf@ep-mute-violet-a5j5rrd6-pooler.us-east-2.aws.neon.tech/uv-api?sslmode=require"
export NEXTJS_APP_URL="http://localhost:3000"
export REDIS_API_USAGE_URL="redis://default:PvpyKDPNNDYXOULHOgBZZpNIWzWANuey@mainline.proxy.rlwy.net:39947"
export PORT=8080

# Run the server
python email-verification-api.py
```

The API will be available at `http://localhost:8080` or `https://api.unlimitedverifier.com:8080`

## 4. Next.js App Updates

The following routes are now available in your Next.js app:

- `/protected/api-keys` - Manage API keys
- `/api/api-keys` - API key CRUD operations
- `/api/check-subscription/[userId]` - Check subscription status

## 5. Using the API

### Create an API Key

1. Go to `/protected/api-keys` in your Next.js app
2. Click "Create API Key"
3. Give it a name and save the generated key

### Make API Requests

#### Email Verification

```bash
curl -X POST https://api.unlimitedverifier.com/email_verification \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your_api_key_here" \
  -d '{
    "emails": [
      "test@example.com",
      "invalid@fake-domain.com",
      "user@gmail.com"
    ]
  }'
```

#### Check Usage

```bash
curl -X GET https://api.unlimitedverifier.com/api/usage \
  -H "X-API-Key: your_api_key_here"
```

#### Health Check

```bash
curl -X GET https://api.unlimitedverifier.com/health
```

## 6. API Response Format

### Email Verification Response

```json
{
  "results": [
    {
      "email": "test@example.com",
      "category": "Good",
      "valid": "Valid",
      "catch_all": "No"
    },
    {
      "email": "invalid@fake-domain.com",
      "category": "Bad",
      "valid": "Invalid",
      "catch_all": "Unknown"
    }
  ],
  "execution_time": "2.45 seconds",
  "usage": {
    "remaining_quota": 9997,
    "reset_at": "2024-01-16 00:00:00"
  }
}
```

### Usage Check Response

```json
{
  "user_id": "4261ac09-3816-4a0e-a978-c6e1596e8c32",
  "daily_limit": 10000,
  "remaining_quota": 9997,
  "used_quota": 3,
  "reset_at": "2024-01-16 00:00:00",
  "reset_in_minutes": 1440
}
```

## 7. Email Categories

- **Good**: Valid email that is not a catch-all address
- **Risky**: Valid email but is a catch-all address, or has validation warnings
- **Bad**: Invalid email address

## 8. Rate Limits and Quotas

- **Maximum per request**: 500 emails
- **Daily limit**: 10,000 emails per account
- **Reset time**: Daily at midnight UTC
- **Subscription required**: Active subscription needed for API access

## 9. Error Codes

- `401` - Invalid or missing API key
- `403` - No active subscription
- `413` - Too many emails in request (>500)
- `429` - Rate limit exceeded
- `500` - Internal server error

## 10. Production Deployment

### For the Flask API:

1. Use a production WSGI server like Gunicorn:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:8080 email-verification-api:app
   ```

2. Set up proper environment variables
3. Configure SSL/TLS certificates
4. Use a reverse proxy like Nginx
5. Monitor with logging and health checks

### For Next.js Integration:

1. Update `NEXTJS_APP_URL` to your production domain
2. Ensure all API routes are accessible
3. Configure proper CORS if needed
4. Test subscription integration

## 11. Testing

### Test API Key Creation

```bash
# Test creating an API key (requires authentication in your Next.js app)
curl -X POST http://localhost:3000/api/api-keys \
  -H "Content-Type: application/json" \
  -H "Cookie: your_session_cookie" \
  -d '{"name": "Test Key"}'
```

### Test Subscription Check

```bash
# Test subscription check
curl -X GET "http://localhost:3000/api/check-subscription/4261ac09-3816-4a0e-a978-c6e1596e8c32"
```

### Test Email Verification

```bash
# Test with a valid API key
curl -X POST http://localhost:8080/email_verification \
  -H "Content-Type: application/json" \
  -H "X-API-Key: uv_your_generated_api_key" \
  -d '{"emails": ["test@gmail.com"]}'
```

## 12. Monitoring and Maintenance

- Monitor Redis for rate limiting data
- Check Neon database for API key usage
- Monitor Flask API logs for errors
- Track subscription status integration
- Set up alerts for high error rates

This completes the email verification API setup. The system is now ready for production use with proper authentication, rate limiting, and subscription management. 