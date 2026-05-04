Write-Host "Testando Keycloak..." -ForegroundColor Cyan

# Testar se o realm existe
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/realms/crash-game" -UseBasicParsing
    Write-Host "Realm crash-game existe e responde" -ForegroundColor Green
} catch {
    Write-Host "Erro ao acessar realm: $($_.Exception.Message)" -ForegroundColor Red
}

# Testar endpoint de descoberta
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/realms/crash-game/.well-known/openid_configuration" -UseBasicParsing
    Write-Host "Endpoint de descoberta funciona" -ForegroundColor Green
} catch {
    Write-Host "Erro no endpoint de descoberta: $($_.Exception.Message)" -ForegroundColor Red
}