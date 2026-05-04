Write-Host "Testando conectividade dos servicos..." -ForegroundColor Cyan

Write-Host "Testando Keycloak..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080" -UseBasicParsing -TimeoutSec 5
    Write-Host "Keycloak OK - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Keycloak ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Testando Frontend..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5175" -UseBasicParsing -TimeoutSec 5
    Write-Host "Frontend OK - Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Frontend ERRO: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "Resumo dos problemas corrigidos:" -ForegroundColor Cyan
Write-Host "1. CLIENT_ID do Keycloak corrigido (crash-game-client)" -ForegroundColor Green
Write-Host "2. Porta do Wallets Service corrigida (4002)" -ForegroundColor Green
Write-Host "3. Porta 5175 adicionada no Keycloak" -ForegroundColor Green

Write-Host "Acesse http://localhost:5175 no navegador" -ForegroundColor White
Write-Host "Login: player / player123" -ForegroundColor White