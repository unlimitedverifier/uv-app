#!/bin/bash

# Test script to run after Vercel deployment
echo "🧪 Post-Deployment API Testing"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
VERCEL_URL="https://uv-app-iota.vercel.app"
PRODUCTION_API_URL="https://api.unlimitedverifier.com"
API_KEY="uv_664f8ae8d2db0b0d43c5da1ca14c933b6f741544fa53029002b41fb26a945662"
USER_ID="4261ac09-3816-4a0e-a978-c6e1596e8c32"

echo -e "${BLUE}Configuration:${NC}"
echo "Vercel URL: $VERCEL_URL"
echo "Production API: $PRODUCTION_API_URL"
echo "User ID: $USER_ID"
echo "API Key: ${API_KEY:0:20}..."
echo ""

# Test 1: Subscription Check Endpoint
echo -e "${YELLOW}Test 1: Subscription Check Endpoint${NC}"
echo "Testing: $VERCEL_URL/api/check-subscription/$USER_ID"

response_code=$(curl -s -o /tmp/subscription_response.json -w "%{http_code}" "$VERCEL_URL/api/check-subscription/$USER_ID")

echo "Response Code: $response_code"

if [[ $response_code == "200" ]]; then
    echo -e "${GREEN}✅ Subscription endpoint is working!${NC}"
    echo "Response:"
    cat /tmp/subscription_response.json | jq '.' 2>/dev/null || cat /tmp/subscription_response.json
elif [[ $response_code == "404" ]]; then
    echo -e "${RED}❌ Subscription endpoint still returns 404${NC}"
    echo "Response:"
    cat /tmp/subscription_response.json
elif [[ $response_code == "401" || $response_code == "403" ]]; then
    echo -e "${YELLOW}⚠️  Authentication required (expected if not logged in)${NC}"
    echo "Response:"
    cat /tmp/subscription_response.json
else
    echo -e "${RED}❌ Unexpected response code: $response_code${NC}"
    echo "Response:"
    cat /tmp/subscription_response.json
fi
echo ""

# Test 2: Production Email Verification API
echo -e "${YELLOW}Test 2: Production Email Verification API${NC}"
echo "Testing: $PRODUCTION_API_URL/email_verification"

response=$(curl -s \
    -X POST "$PRODUCTION_API_URL/email_verification" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" \
    -d '{"emails": ["test@gmail.com"]}')

if [[ $response == *"Subscription required"* ]]; then
    echo -e "${YELLOW}⚠️  Still getting subscription required error${NC}"
    echo "This means the Flask API is trying to check subscription but it's failing"
    echo "Response: $response"
elif [[ $response == *"results"* ]]; then
    echo -e "${GREEN}✅ Email verification working! Subscription check passed!${NC}"
    echo "Response: $response" | jq '.' 2>/dev/null || echo "Response: $response"
elif [[ $response == *"Error checking subscription"* ]]; then
    echo -e "${YELLOW}⚠️  Subscription check endpoint found but returning error${NC}"
    echo "Response: $response"
else
    echo -e "${RED}❌ Unexpected response from email verification${NC}"
    echo "Response: $response"
fi
echo ""

# Test 3: Direct subscription check for debugging
echo -e "${YELLOW}Test 3: Direct Subscription Check (No Auth)${NC}"
echo "Testing subscription endpoint without authentication..."

response=$(curl -s "$VERCEL_URL/api/check-subscription/$USER_ID")
echo "Response without auth: $response"
echo ""

# Summary
echo -e "${BLUE}📋 Test Summary:${NC}"
if [[ $response_code == "200" ]] || [[ $response_code == "401" ]] || [[ $response_code == "403" ]]; then
    echo "✅ Subscription endpoint deployed successfully"
else
    echo "❌ Subscription endpoint has issues"
fi

echo ""
echo -e "${GREEN}🎯 Next Steps:${NC}"
echo "1. If subscription endpoint is working (200/401/403), your Flask API should now be able to verify subscriptions"
echo "2. If you're still getting 'Subscription required', check your Update.dev integration"
echo "3. The Flask API at $PRODUCTION_API_URL should now work with proper subscription checking"
echo ""

# Cleanup
rm -f /tmp/subscription_response.json 