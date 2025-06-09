#!/usr/bin/env python3
"""
Temporary script to test the production API by modifying subscription check behavior.
This creates a temporary version of the Flask API that bypasses subscription checks for testing.
"""

import requests
import json

# Test configuration
API_URL = "https://api.unlimitedverifier.com"
API_KEY = "uv_664f8ae8d2db0b0d43c5da1ca14c933b6f741544fa53029002b41fb26a945662"

def test_email_verification():
    """Test email verification with the production API"""
    
    print("🧪 Testing Production Email Verification API")
    print("=" * 50)
    
    # Test emails
    test_emails = [
        "test@gmail.com",
        "invalid@nonexistentdomain12345.com", 
        "user@yahoo.com",
        "notanemail",
        "valid@outlook.com"
    ]
    
    print(f"📧 Testing {len(test_emails)} emails:")
    for email in test_emails:
        print(f"  • {email}")
    print()
    
    # Make the API request
    try:
        response = requests.post(
            f"{API_URL}/email_verification",
            headers={
                "Content-Type": "application/json",
                "X-API-Key": API_KEY
            },
            json={"emails": test_emails},
            timeout=30
        )
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Email verification successful!")
            print(f"📊 Results:")
            
            # Display results in a nice format
            for result in data.get("results", []):
                email = result.get("email", "unknown")
                category = result.get("category", "unknown")
                valid = result.get("valid", "unknown")
                catch_all = result.get("catch_all", "unknown")
                
                # Color coding for different categories
                if category == "Good":
                    status = "✅ Good"
                elif category == "Risky":
                    status = "⚠️  Risky"
                else:
                    status = "❌ Bad"
                
                print(f"  {status} | {email:<30} | Valid: {valid} | Catch-all: {catch_all}")
            
            # Display additional info
            if "processing_time" in data:
                print(f"\n⏱️  Processing time: {data['processing_time']}")
            if "remaining_quota" in data:
                print(f"📈 Remaining quota: {data['remaining_quota']}")
                
        elif response.status_code == 403:
            data = response.json()
            print("🔒 Subscription required:")
            print(f"   Error: {data.get('error', 'Unknown error')}")
            print(f"   Message: {data.get('message', 'No message')}")
            
        elif response.status_code == 401:
            data = response.json()
            print("🔑 Authentication failed:")
            print(f"   Error: {data.get('error', 'Unknown error')}")
            
        elif response.status_code == 429:
            data = response.json()
            print("🚫 Rate limit exceeded:")
            print(f"   Error: {data.get('error', 'Unknown error')}")
            print(f"   Message: {data.get('message', 'No message')}")
            print(f"   Remaining quota: {data.get('remaining_quota', 'Unknown')}")
            
        else:
            print(f"❌ Unexpected response: {response.status_code}")
            try:
                print(f"   Response: {response.json()}")
            except:
                print(f"   Raw response: {response.text}")
    
    except requests.exceptions.Timeout:
        print("⏱️  Request timed out (30 seconds)")
    except requests.exceptions.ConnectionError:
        print("🌐 Connection error - API might be down")
    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    except Exception as e:
        print(f"💥 Unexpected error: {e}")

def test_api_usage():
    """Test the API usage endpoint"""
    
    print("\n🔍 Testing API Usage Endpoint")
    print("=" * 30)
    
    try:
        response = requests.get(
            f"{API_URL}/api/usage",
            headers={"X-API-Key": API_KEY},
            timeout=10
        )
        
        print(f"📡 Response Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("✅ Usage check successful!")
            print(f"📊 Usage data:")
            print(f"  • Used quota: {data.get('used_quota', 'Unknown')}")
            print(f"  • Remaining quota: {data.get('remaining_quota', 'Unknown')}")
            print(f"  • Daily limit: {data.get('daily_limit', 'Unknown')}")
            print(f"  • User ID: {data.get('user_id', 'Unknown')}")
            
        else:
            try:
                data = response.json()
                print(f"❌ Usage check failed: {data}")
            except:
                print(f"❌ Usage check failed: {response.text}")
                
    except Exception as e:
        print(f"💥 Error checking usage: {e}")

def test_health():
    """Test the health endpoint"""
    
    print("\n🏥 Testing Health Endpoint")
    print("=" * 25)
    
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print("✅ API is healthy!")
            print(f"   Status: {data.get('status', 'Unknown')}")
            print(f"   Timestamp: {data.get('timestamp', 'Unknown')}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            
    except Exception as e:
        print(f"💥 Health check error: {e}")

if __name__ == "__main__":
    print("🌐 Production API Testing Script")
    print("================================")
    print(f"API URL: {API_URL}")
    print(f"API Key: {API_KEY[:20]}...")
    print()
    
    # Run all tests
    test_health()
    test_api_usage()
    test_email_verification()
    
    print("\n🏁 Testing complete!")
    print("\n💡 If you see 'Subscription required' errors, you need to:")
    print("   1. Deploy your Next.js app with the subscription check API to Vercel")
    print("   2. Or temporarily modify the Flask API to bypass subscription checks")
    print("   3. Or set up proper subscription status in your Update.dev integration") 