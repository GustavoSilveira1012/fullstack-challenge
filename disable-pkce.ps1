# Script para desabilitar PKCE no cliente Keycloak

$keycloakUrl = "http://localhost:8080"
$realm = "crash-game"
$clientId = "crash-game-client"
$adminUser = "admin"
$adminPass = "admin"

Write-Host "Desabilitando PKCE no cliente..." -ForegroundColor Cyan

try {
    # 1. Obter token de acesso do admin
    $tokenBody = @{
        username = $adminUser
        password = $adminPass
        grant_type = "password"
        client_id = "admin-cli"
    }
    
    $tokenResponse = Invoke-RestMethod -Uri "$keycloakUrl/realms/master/protocol/openid-connect/token" -Method POST -Body $tokenBody -ContentType "application/x-www-form-urlencoded"
    $accessToken = $tokenResponse.access_token
    
    # 2. Headers para requisições
    $headers = @{
        Authorization = "Bearer $accessToken"
        "Content-Type" = "application/json"
    }
    
    # 3. Obter informações do cliente atual
    $clients = Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/clients" -Method GET -Headers $headers
    $client = $clients | Where-Object { $_.clientId -eq $clientId }
    
    if (-not $client) {
        Write-Host "Cliente não encontrado" -ForegroundColor Red
        exit 1
    }
    
    # 4. Remover atributos PKCE
    if ($client.attributes) {
        $client.attributes.Remove("pkce.code.challenge.method")
    }
    
    # 5. Atualizar cliente
    $clientJson = $client | ConvertTo-Json -Depth 10
    Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/$realm/clients/$($client.id)" -Method PUT -Headers $headers -Body $clientJson
    
    Write-Host "PKCE desabilitado com sucesso!" -ForegroundColor Green
    
} catch {
    Write-Host "Erro: $($_.Exception.Message)" -ForegroundColor Red
}