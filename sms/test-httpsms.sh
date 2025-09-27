#!/bin/bash

# HTTPSMS End-to-End Test Script
# Usage: ./test-httpsms.sh [ngrok-url]

# Default to localhost if no ngrok URL provided
BASE_URL=${1:-"http://localhost:3000"}

echo "🧪 Testing HTTPSMS Agent at: $BASE_URL"
echo "=================================================="

# Test 1: Server Health
echo "📍 Test 1: Server Health Check"
curl -s "$BASE_URL/health" | jq '.' || echo "❌ Health check failed"
echo ""

# Test 2: HTTPSMS Connection Test
echo "📍 Test 2: HTTPSMS Connection Test"
curl -s "$BASE_URL/httpsms/test" | jq '.' || echo "❌ HTTPSMS connection test failed"
echo ""

# Test 3: Balance Command
echo "📍 Test 3: Balance Command"
curl -s -X POST "$BASE_URL/sms" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+1234567890",
    "content": "balance"
  }' | jq '.' || echo "❌ Balance command failed"
echo ""

# Test 4: Send Command
echo "📍 Test 4: Send Command"
curl -s -X POST "$BASE_URL/sms" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+1234567890",
    "content": "send 25.50 to +1555123456"
  }' | jq '.' || echo "❌ Send command failed"
echo ""

# Test 5: Help Command
echo "📍 Test 5: Help Command"
curl -s -X POST "$BASE_URL/sms" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+1234567890",
    "content": "help"
  }' | jq '.' || echo "❌ Help command failed"
echo ""

# Test 6: Invalid Command
echo "📍 Test 6: Invalid Command"
curl -s -X POST "$BASE_URL/sms" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+1234567890",
    "content": "invalid_command"
  }' | jq '.' || echo "❌ Invalid command test failed"
echo ""

echo "✅ All tests completed!"
echo ""
echo "💡 To test with ngrok:"
echo "   1. Start ngrok: ngrok http 3000"
echo "   2. Run: ./test-httpsms.sh https://your-ngrok-url.ngrok.io"
echo ""
echo "📱 To test SMS sending:"
echo "   npm run test:sms -- +91XXXXXXXXXX"
