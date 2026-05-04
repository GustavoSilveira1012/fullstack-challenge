# Script para criar/recriar o realm crash-game

$keycloakUrl = "http://localhost:8080"
$adminUser = "admin"
$adminPass = "admin"

Write-Host "Criando realm crash-game..." -ForegroundColor Cyan

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
    
    # 2. Headers para requisições
    $headers = @{
        Authorization = "Bearer $accessToken"
        "Content-Type" = "application/json"
    }
    
    # 3. Deletar realm se existir
    Write-Host "2. Deletando realm existente (se houver)..." -ForegroundColor Yellow
    try {
        Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/crash-game" -Method DELETE -Headers $headers
        Write-Host "✅ Realm existente deletado" -ForegroundColor Green
    } catch {
        Write-Host "ℹ️ Realm não existia ou erro ao deletar" -ForegroundColor Gray
    }
    
    # 4. Criar novo realm
    Write-Host "3. Criando novo realm..." -ForegroundColor Yellow
    
    $realmConfig = @{
        realm = "crash-game"
        enabled = $true
        displayName = "Crash Game"
        registrationAllowed = $false
        loginWithEmailAllowed = $true
        duplicateEmailsAllowed = $false
        accessTokenLifespan = 3600
        sslRequired = "none"
    } | ConvertTo-Json -Depth 10
    
    Invoke-RestMethod -Uri "$keycloakUrl/admin/realms" -Method POST -Headers $headers -Body $realmConfig
    Write-Host "✅ Realm criado com sucesso" -ForegroundColor Green
    
    # 5. Criar cliente
    Write-Host "4. Criando cliente..." -ForegroundColor Yellow
    
    $clientConfig = @{
        clientId = "crash-game-client"
        name = "Crash Game Frontend"
        enabled = $true
        publicClient = $true
        standardFlowEnabled = $true
        directAccessGrantsEnabled = $true
        protocol = "openid-connect"
        redirectUris = @(
            "http://localhost:3000/*",
            "http://localhost:5173/*",
            "http://localhost:5174/*",
            "http://localhost:5175/*",
            "http://localhost:5176/*",
            "http://localhost:*/auth/callback"
        )
        webOrigins = @(
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:5174",
            "http://localhost:5175",
            "http://localhost:5176",
            "http://localhost:*"
        )
        attributes = @{
            "pkce.code.challenge.method" = "S256"
        }
    } | ConvertTo-Json -Depth 10
    
    Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/crash-game/clients" -Method POST -Headers $headers -Body $clientConfig
    Write-Host "✅ Cliente criado com sucesso" -ForegroundColor Green
    
    # 6. Criar usuário
    Write-Host "5. Criando usuário..." -ForegroundColor Yellow
    
    $userConfig = @{
        username = "player"
        email = "player@crash-game.dev"
        firstName = "Test"
        lastName = "Player"
        enabled = $true
        emailVerified = $true
        credentials = @(
            @{
                type = "password"
                value = "player123"
                temporary = $false
            }
        )
    } | ConvertTo-Json -Depth 10
    
    Invoke-RestMethod -Uri "$keycloakUrl/admin/realms/crash-game/users" -Method POST -Headers $headers -Body $userConfig
    Write-Host "✅ Usuário criado com sucesso" -ForegroundColor Green
    
    Write-Host "🎉 Realm crash-game configurado com sucesso!" -ForegroundColor Green
    Write-Host "Credenciais: player / player123" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Erro: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Detalhes do erro" -ForegroundColor Red
}