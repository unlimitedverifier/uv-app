#!/bin/bash

# API Testing Commands for UV-App
# Make sure your Next.js server is running on port 3000
# Make sure your Flask API server is running on port 8080

echo "=== UV-App API Testing Commands ==="
echo ""

# 1. Test Flask Email Verification API (Direct)
echo "1. Testing Flask Email Verification API:"
echo "curl -X POST 'http://localhost:8080/email_verification' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'X-API-Key: YOUR_API_KEY_HERE' \\"
echo "  -d '{\"emails\": [\"test@example.com\", \"invalid-email\", \"good@gmail.com\"]}'"
echo ""

# 2. Test Flask API Health Check
echo "2. Testing Flask API Health:"
echo "curl -X GET 'http://localhost:8080/health'"
echo ""

# 3. Test Next.js API Key Creation (requires authentication)
echo "3. Testing API Key Creation (Next.js):"
echo "curl -X POST 'http://localhost:3000/api/api-keys' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"name\": \"Test API Key\"}' \\"
echo "  --cookie-jar cookies.txt --cookie cookies.txt"
echo ""

# 4. Test Next.js API Key Listing
echo "4. Testing API Key Listing (Next.js):"
echo "curl -X GET 'http://localhost:3000/api/api-keys' \\"
echo "  --cookie-jar cookies.txt --cookie cookies.txt"
echo ""

# 5. Test Subscription Check
echo "5. Testing Subscription Check:"
echo "curl -X GET 'http://localhost:3000/api/check-subscription/USER_ID_HERE' \\"
echo "  --cookie-jar cookies.txt --cookie cookies.txt"
echo ""

# 6. Example with actual API key (replace with real key)
echo "6. Example Email Verification with Real API Key:"
echo "curl -X POST 'http://localhost:8080/email_verification' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'X-API-Key: uv_1234567890abcdef...' \\"
echo "  -d '{\"emails\": [\"test@gmail.com\", \"invalid@domain\", \"user@yahoo.com\"]}' | jq"
echo ""

# 7. Test rate limiting
echo "7. Testing Rate Limiting (run multiple times):"
echo "for i in {1..5}; do"
echo "  curl -X POST 'http://localhost:8080/email_verification' \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -H 'X-API-Key: YOUR_API_KEY_HERE' \\"
echo "    -d '{\"emails\": [\"test\$i@example.com\"]}'"
echo "  echo \"Request \$i completed\""
echo "done"
echo ""

echo "=== Quick Test Commands ==="
echo ""

# Quick health check
echo "# Quick health check for Flask API:"
echo "curl http://localhost:8080/health"
echo ""

# Quick test without auth (should fail)
echo "# Quick test without API key (should return 401):"
echo "curl -X POST http://localhost:8080/email_verification -H 'Content-Type: application/json' -d '{\"emails\":[\"test@example.com\"]}'"
echo ""

echo "=== Notes ==="
echo "- Replace YOUR_API_KEY_HERE with actual API key from /protected/api-keys"
echo "- Replace USER_ID_HERE with actual user ID"
echo "- Make sure both servers are running:"
echo "  * Next.js: pnpm dev (port 3000)"
echo "  * Flask API: python email-verification-api.py (port 8080)"
echo "- For authenticated requests, login first at http://localhost:3000/sign-in"
echo "- Use --cookie-jar and --cookie for session persistence"
echo "- Install jq for better JSON formatting: brew install jq"
