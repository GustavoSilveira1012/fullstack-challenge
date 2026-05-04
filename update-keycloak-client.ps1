# Script para atualizar o cliente Keycloak via API REST

$keycloakUrl = "http://localhost:8080"
$realm = "crash-game"
$clientId = "crash-game-client"
$adminUser = "admin"
$adminPass = "admin"

Write-Host "Atualizando cliente Keycloak..." -ForegroundColor Cyan

try {
    # 1. Obter token de acesso do admin
    Write-Host "1. Obtendo token de acesso..." -ForegroundColor Yellow
    
    $tokenBody = @{
        username = $adminUser
        password = $adminPass
        grant_type = "password"
        client_id = "admin-cli"
    }
    
    $tokenResponse = Invoke-RestMethod -Uri "$keycloakUrl/realms/master/protocol/openid-connect/token" -Method POST -Body $tokenBody -ContentType "application/x-www-form-urlencoded"
    $accessToken = $tokenResponse.access_token
    
    Write-Host "✅ Token obtido com sucesso" -ForegroundColor Green
    
    # 2. Obter informações do cliente atual
    Write-Host "2. Obtendo informações do cliente..." -ForegroundColor Yellow
    
    $headers = @{
        Authorization = "Bearer $accessToken"
        "Content-Type" = "application/json"
    }
    
    $clients = Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/clients" -Method GET -Headers $headers
    $client = $clients | Where-Object { $_.clientId -eq $clientId }
    
    if (-not $client) {
        Write-Host "❌ Cliente não encontrado" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Cliente encontrado: $($client.id)" -ForegroundColor Green
    
    # 3. Atualizar URLs de redirecionamento
    Write-Host "3. Atualizando URLs de redirecionamento..." -ForegroundColor Yellow
    
    $client.redirectUris = @(
        "http://localhost:3000/*",
        "http://localhost:5173/*",
        "http://localhost:5174/*", 
        "http://localhost:5175/*",
        "http://localhost:5176/*",
        "http://localhost:*/auth/callback"
    )
    
    $client.webOrigins = @(
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175", 
        "http://localhost:5176",
        "http://localhost:*"
    )
    
    # 4. Enviar atualização
    $clientJson = $client | ConvertTo-Json -Depth 10
    
    Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/clients/$($client.id)" -Method PUT -Headers $headers -Body $clientJson
    
    Write-Host "✅ Cliente atualizado com sucesso!" -ForegroundColor Green
    Write-Host "URLs de redirecionamento:" -ForegroundColor Cyan
    $client.redirectUris | ForEach-Object { Write-Host "  - $_" -ForegroundColor White }
    
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Detalhes: $($_.Exception)" -ForegroundColor Red
}