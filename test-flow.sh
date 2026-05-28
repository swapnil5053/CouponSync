#!/bin/bash
set -e

echo "=== COMPLETE COUPON FLOW TEST ==="
echo ""

# Register & Login
echo "1. Creating test user..."
REGISTER=$(curl -sS -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Flow Test","email":"flowtest'$(date +%s)'@test.com","password":"Test@123456"}')

TOKEN=$(echo $REGISTER | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
USER_ID=$(echo $REGISTER | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

echo "✅ User created - ID: $USER_ID"

# Get campaigns
echo ""
echo "2. Getting active campaigns..."
CAMPAIGNS=$(curl -sS "http://localhost:5001/api/campaigns?status=active" \
  -H "Authorization: Bearer $TOKEN")

CAMPAIGN_ID=$(echo $CAMPAIGNS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "✅ Found campaign ID: $CAMPAIGN_ID"

# Generate coupon
echo ""
echo "3. Claiming coupon..."
COUPON=$(curl -sS -X POST http://localhost:5001/api/coupons/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"campaign_id\":$CAMPAIGN_ID,\"count\":1,\"user_id\":$USER_ID}")

echo "$COUPON" | python3 -m json.tool 2>/dev/null || echo "$COUPON"

CODE=$(echo $COUPON | grep -o '"code":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$CODE" ]; then
  echo ""
  echo "🎉 SUCCESS! Coupon Code: $CODE"
else
  echo ""
  echo "❌ FAILED to generate coupon"
  exit 1
fi
