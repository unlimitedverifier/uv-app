#!/bin/bash

echo "🚀 Deploy and Test Script for UV-App"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: TypeScript Check${NC}"
echo "Running TypeScript compilation check..."
if npx tsc --noEmit; then
    echo -e "${GREEN}✅ TypeScript check passed${NC}"
else
    echo -e "${RED}❌ TypeScript errors found. Please fix before deploying.${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}Step 2: Build Check${NC}"
echo "Running Next.js build to verify everything compiles..."
if npm run build; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed. Please fix errors before deploying.${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}Step 3: Deployment Instructions${NC}"
echo "Now you can deploy to Vercel using one of these methods:"
echo ""
echo "🔹 Method 1: Git Push (if connected to GitHub)"
echo "   git add ."
echo "   git commit -m \"Fix subscription API route for Next.js 15\""
echo "   git push origin main"
echo ""
echo "🔹 Method 2: Vercel CLI"
echo "   npx vercel --prod"
echo ""
echo "🔹 Method 3: Vercel Dashboard"
echo "   - Go to vercel.com/dashboard"
echo "   - Find your project"
echo "   - Click 'Redeploy' with latest commit"
echo ""

echo -e "${BLUE}Step 4: Test Commands (run after deployment)${NC}"
echo ""
echo "Once deployed, test the subscription API with:"
echo ""
echo "# Test subscription check endpoint"
echo "curl 'https://your-app.vercel.app/api/check-subscription/4261ac09-3816-4a0e-a978-c6e1596e8c32'"
echo ""
echo "# Test production email verification API"
echo "curl -X POST 'https://api.unlimitedverifier.com/email_verification' \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -H 'X-API-Key: uv_664f8ae8d2db0b0d43c5da1ca14c933b6f741544fa53029002b41fb26a945662' \\"
echo "  -d '{\"emails\": [\"test@gmail.com\"]}'"
echo ""

echo -e "${GREEN}🎉 Ready for deployment!${NC}"
echo ""
echo -e "${YELLOW}📝 What was fixed:${NC}"
echo "- Updated params type from { userId: string } to Promise<{ userId: string }>"
echo "- Added await when destructuring params"
echo "- Compatible with Next.js 15 App Router"
echo "" 