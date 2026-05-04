# Script para verificar realms no Keycloak

$keycloakUrl = "http://localhost:8080"
$adminUser = "admin"
$adminPass = "admin"

Write-Host "Verificando realms no Keycloak..." -ForegroundColor Cyan

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
    
    # 2. Listar realms
    Write-Host "2. Listando realms..." -ForegroundColor Yellow
    
    $headers = @{
        Authorization = "Bearer $accessToken"
        "Content-Type" = "application/json"
    }
    
    $realms = Invoke-RestMethod -Uri "$keycloakUrl/admin/realms" -Method GET -Headers $headers
    
    Write-Host "Realms encontrados:" -ForegroundColor Cyan
    foreach ($realm in $realms) {
        Write-Host "  - $($realm.realm) (enabled: $($realm.enabled))" -ForegroundColor White
    }
    
    # 3. Verificar se crash-game existe
    $crashGameRealm = $realms | Where-Object { $_.realm -eq "crash-game" }
    if ($crashGameRealm) {
        Write-Host "✅ Realm 'crash-game' encontrado!" -ForegroundColor Green
        Write-Host "   Enabled: $($crashGameRealm.enabled)" -ForegroundColor White
        Write-Host "   Display Name: $($crashGameRealm.displayName)" -ForegroundColor White
    } else {
        Write-Host "❌ Realm 'crash-game' NÃO encontrado!" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
}