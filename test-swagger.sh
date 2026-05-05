#!/bin/bash

echo "🧪 Testando Swagger nos serviços..."
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para testar endpoint
test_endpoint() {
    local url=$1
    local name=$2
    
    echo -n "Testando $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ OK${NC} (HTTP $response)"
        return 0
    else
        echo -e "${RED}❌ FALHOU${NC} (HTTP $response)"
        return 1
    fi
}

# Testar se serviços estão rodando
echo "📡 Verificando se os serviços estão rodando..."
echo ""

test_endpoint "http://localhost:4001/health" "Game Service Health"
test_endpoint "http://localhost:4002/health" "Wallet Service Health"

echo ""
echo "📚 Verificando Swagger UI..."
echo ""

# Testar Swagger
test_endpoint "http://localhost:4001/api" "Game Service Swagger"
test_endpoint "http://localhost:4002/api" "Wallet Service Swagger"

echo ""
echo "📋 Testando endpoints da API..."
echo ""

test_endpoint "http://localhost:4001/rounds/current" "GET /rounds/current"
test_endpoint "http://localhost:4001/rounds/history" "GET /rounds/history"

echo ""
echo "🎯 URLs do Swagger:"
echo ""
echo "  Game Service:   http://localhost:4001/api"
echo "  Wallet Service: http://localhost:4002/api"
echo ""
echo "  Via Kong:"
echo "  Game Service:   http://localhost:8000/games/api"
echo "  Wallet Service: http://localhost:8000/wallets/api"
echo ""
