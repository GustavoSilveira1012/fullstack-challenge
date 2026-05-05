# Script PowerShell para testar Swagger

Write-Host "🧪 Testando Swagger nos serviços..." -ForegroundColor Cyan
Write-Host ""

function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Name
    )
    
    Write-Host "Testando $Name... " -NoNewline
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ OK" -ForegroundColor Green -NoNewline
            Write-Host " (HTTP $($response.StatusCode))"
            return $true
        }
    }
    catch {
        Write-Host "❌ FALHOU" -ForegroundColor Red -NoNewline
        Write-Host " ($($_.Exception.Message))"
        return $false
    }
}

# Testar se serviços estão rodando
Write-Host "📡 Verificando se os serviços estão rodando..." -ForegroundColor Yellow
Write-Host ""

Test-Endpoint -Url "http://localhost:4001/health" -Name "Game Service Health"
Test-Endpoint -Url "http://localhost:4002/health" -Name "Wallet Service Health"

Write-Host ""
Write-Host "📚 Verificando Swagger UI..." -ForegroundColor Yellow
Write-Host ""

# Testar Swagger
$gameSwagger = Test-Endpoint -Url "http://localhost:4001/api" -Name "Game Service Swagger"
$walletSwagger = Test-Endpoint -Url "http://localhost:4002/api" -Name "Wallet Service Swagger"

Write-Host ""
Write-Host "📋 Testando endpoints da API..." -ForegroundColor Yellow
Write-Host ""

Test-Endpoint -Url "http://localhost:4001/rounds/current" -Name "GET /rounds/current"
Test-Endpoint -Url "http://localhost:4001/rounds/history" -Name "GET /rounds/history"

Write-Host ""
Write-Host "🎯 URLs do Swagger:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Game Service:   http://localhost:4001/api"
Write-Host "  Wallet Service: http://localhost:4002/api"
Write-Host ""
Write-Host "  Via Kong:"
Write-Host "  Game Service:   http://localhost:8000/games/api"
Write-Host "  Wallet Service: http://localhost:8000/wallets/api"
Write-Host ""

if ($gameSwagger -and $walletSwagger) {
    Write-Host "✅ Swagger está funcionando em ambos os serviços!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Swagger não está funcionando. Execute:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  cd services/games && bun install"
    Write-Host "  cd services/wallets && bun install"
    Write-Host "  bun run docker:up"
    Write-Host ""
}
