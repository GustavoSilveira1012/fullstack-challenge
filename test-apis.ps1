# Script de teste das APIs do Crash Game
# Testa os endpoints GET e PUT dos serviços Games e Wallets

Write-Host "🧪 Testando APIs do Crash Game..." -ForegroundColor Cyan
Write-Host ""

function Test-Endpoint {
    param(
        [string]$Method,
        [string]$Url,
        [string]$Description,
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    Write-Host "Testing $Description... " -NoNewline
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            ErrorAction = 'Stop'
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = 'application/json'
        }
        
        $response = Invoke-RestMethod @params
        $statusCode = 200
        
        Write-Host "✅ OK ($statusCode)" -ForegroundColor Green
        Write-Host "   Response: $($response | ConvertTo-Json -Compress -Depth 3)" -ForegroundColor Gray
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "❌ FAIL ($statusCode)" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
    }
    
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "📡 GAME SERVICE - Public Endpoints" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

# Game Service - Health Check
Test-Endpoint -Method "GET" -Url "http://localhost:8000/games/health" -Description "Health Check"

# Game Service - Get Current Round
Test-Endpoint -Method "GET" -Url "http://localhost:8000/games/rounds/current" -Description "Get Current Round"

# Game Service - Get Round History
Test-Endpoint -Method "GET" -Url "http://localhost:8000/games/rounds/history?page=1&pageSize=5" -Description "Get Round History"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "💰 WALLET SERVICE - Public Endpoints" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

# Wallet Service - Health Check
Test-Endpoint -Method "GET" -Url "http://localhost:8000/wallets/health" -Description "Health Check"

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "🔐 Testing Protected Endpoints (Requires JWT)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host ""

# Tentar obter token do Keycloak
Write-Host "Obtaining JWT token from Keycloak..." -ForegroundColor Cyan

try {
    $tokenBody = @{
        client_id = "crash-game-client"
        username = "player"
        password = "player123"
        grant_type = "password"
    }
    
    $tokenResponse = Invoke-RestMethod -Uri "http://localhost:8080/realms/crash-game/protocol/openid-connect/token" `
        -Method POST `
        -ContentType "application/x-www-form-urlencoded" `
        -Body $tokenBody `
        -ErrorAction Stop
    
    $accessToken = $tokenResponse.access_token
    
    Write-Host "✅ Token obtained successfully" -ForegroundColor Green
    Write-Host ""
    
    $authHeaders = @{
        "Authorization" = "Bearer $accessToken"
    }
    
    # Wallet Service - Create Wallet
    Test-Endpoint -Method "POST" -Url "http://localhost:8000/wallets" -Description "Create Wallet" -Headers $authHeaders
    
    # Wallet Service - Get My Wallet
    Test-Endpoint -Method "GET" -Url "http://localhost:8000/wallets/me" -Description "Get My Wallet" -Headers $authHeaders
    
    # Game Service - Place Bet
    $betBody = @{ amount = 1000 } | ConvertTo-Json
    Test-Endpoint -Method "POST" -Url "http://localhost:8000/games/bet" -Description "Place Bet" -Headers $authHeaders -Body $betBody
    
    # Game Service - Get Player Bet History
    Test-Endpoint -Method "GET" -Url "http://localhost:8000/games/bets/me?page=1&pageSize=5" -Description "Get Player Bet History" -Headers $authHeaders
}
catch {
    Write-Host "❌ Failed to obtain JWT token" -ForegroundColor Red
    Write-Host "   Make sure Keycloak is running and the user player exists" -ForegroundColor Gray
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
Write-Host "✅ Test completed!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow
