#!/bin/bash

# Script de teste das APIs do Crash Game
# Testa os endpoints GET e PUT dos serviços Games e Wallets

echo "🧪 Testando APIs do Crash Game..."
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local url=$2
    local description=$3
    local headers=$4
    local data=$5
    
    echo -n "Testing $description... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" $headers "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X $method $headers -d "$data" "$url")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}✅ OK ($http_code)${NC}"
        echo "   Response: $(echo $body | jq -c '.' 2>/dev/null || echo $body)"
    else
        echo -e "${RED}❌ FAIL ($http_code)${NC}"
        echo "   Response: $body"
    fi
    echo ""
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📡 GAME SERVICE - Public Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Game Service - Health Check
test_endpoint "GET" "http://localhost:8000/games/health" "Health Check" ""

# Game Service - Get Current Round
test_endpoint "GET" "http://localhost:8000/games/rounds/current" "Get Current Round" ""

# Game Service - Get Round History
test_endpoint "GET" "http://localhost:8000/games/rounds/history?page=1&pageSize=5" "Get Round History" ""

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "💰 WALLET SERVICE - Public Endpoints"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wallet Service - Health Check
test_endpoint "GET" "http://localhost:8000/wallets/health" "Health Check" ""

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 Testing Protected Endpoints (Requires JWT)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Tentar obter token do Keycloak
echo "Obtaining JWT token from Keycloak..."
TOKEN_RESPONSE=$(curl -s -X POST http://localhost:8080/realms/crash-game/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=crash-game-client" \
  -d "username=player" \
  -d "password=player123" \
  -d "grant_type=password")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token' 2>/dev/null)

if [ "$ACCESS_TOKEN" != "null" ] && [ ! -z "$ACCESS_TOKEN" ]; then
    echo -e "${GREEN}✅ Token obtained successfully${NC}"
    echo ""
    
    # Wallet Service - Create Wallet
    test_endpoint "POST" "http://localhost:8000/wallets" "Create Wallet" "-H 'Authorization: Bearer $ACCESS_TOKEN' -H 'Content-Type: application/json'" ""
    
    # Wallet Service - Get My Wallet
    test_endpoint "GET" "http://localhost:8000/wallets/me" "Get My Wallet" "-H 'Authorization: Bearer $ACCESS_TOKEN'"
    
    # Game Service - Place Bet
    test_endpoint "POST" "http://localhost:8000/games/bet" "Place Bet" "-H 'Authorization: Bearer $ACCESS_TOKEN' -H 'Content-Type: application/json'" '{"amount": 1000}'
    
    # Game Service - Get Player Bet History
    test_endpoint "GET" "http://localhost:8000/games/bets/me?page=1&pageSize=5" "Get Player Bet History" "-H 'Authorization: Bearer $ACCESS_TOKEN'"
    
else
    echo -e "${RED}❌ Failed to obtain JWT token${NC}"
    echo "   Make sure Keycloak is running and the user 'player' exists"
    echo "   Response: $TOKEN_RESPONSE"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Test completed!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
