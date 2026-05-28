#!/bin/bash

echo "=== Testing Coupon Generation ==="

# Step 1: Login as customer
echo "1. Logging in as customer..."
LOGIN_RESPONSE=$(curl -sS -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Logged in successfully"
echo "Token: ${TOKEN:0:20}..."

# Step 2: Get active campaigns
echo ""
echo "2. Getting active campaigns..."
CAMPAIGNS=$(curl -sS -X GET "http://localhost:5001/api/campaigns?status=active" \
  -H "Authorization: Bearer $TOKEN")

CAMPAIGN_ID=$(echo $CAMPAIGNS | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$CAMPAIGN_ID" ]; then
  echo "❌ No active campaigns found"
  echo "Response: $CAMPAIGNS"
  exit 1
fi

echo "✅ Found campaign ID: $CAMPAIGN_ID"

# Step 3: Generate coupon
echo ""
echo "3. Generating coupon for campaign $CAMPAIGN_ID..."
COUPON_RESPONSE=$(curl -sS -X POST http://localhost:5001/api/coupons/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"campaign_id\":$CAMPAIGN_ID,\"count\":1,\"user_id\":1}")

echo "Response: $COUPON_RESPONSE"

COUPON_CODE=$(echo $COUPON_RESPONSE | grep -o '"code":"[^"]*"' | cut -d'"' -f4)

if [ -z "$COUPON_CODE" ]; then
  echo "❌ Failed to generate coupon"
  exit 1
fi

echo ""
echo "✅ SUCCESS! Generated coupon code: $COUPON_CODE"
