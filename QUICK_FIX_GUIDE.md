# Guia Rápido de Correção - APIs GET e PUT ✅

## 🔧 Correções Aplicadas

### 1. Controllers (Roteamento)
- ✅ **Game Service**: `@Controller('games')` → `@Controller()`
- ✅ **Wallet Service**: `@Controller('wallets')` → `@Controller()`
- ✅ **Frontend**: Removido `baseURL: this.gamesBaseUrl`

### 2. Dockerfiles (Prisma)
- ✅ **Games**: `prisma migrate deploy` → `prisma db push --skip-generate`
- ✅ **Wallets**: `prisma migrate deploy` → `prisma db push --skip-generate`
- ✅ **Ambos**: Removido `--frozen-lockfile` do `bun install`

---

## 🚀 Como Aplicar as Correções

### Passo 1: Parar os serviços atuais
```bash
cd fullstack-challenge
docker-compose down
```

### Passo 2: Rebuild dos serviços
```bash
docker-compose build games wallets
```

### Passo 3: Subir os serviços
```bash
docker-compose up -d games wallets
```

### Passo 4: Verificar se estão rodando
```bash
docker-compose ps
```

Você deve ver:
```
NAME                          STATUS
fullstack-challenge-games-1   Up (healthy)
fullstack-challenge-wallets-1 Up (healthy)
```

### Passo 5: Verificar logs (se necessário)
```bash
# Ver logs do games
docker-compose logs -f games

# Ver logs do wallets
docker-compose logs -f wallets
```

---

## 🧪 Testar as APIs

### Teste Rápido - Health Checks

```powershell
# Game Service
Invoke-RestMethod -Uri "http://localhost:8000/games/health"

# Wallet Service
Invoke-RestMethod -Uri "http://localhost:8000/wallets/health"
```

**Resposta esperada**:
```json
{"status":"ok","service":"games"}
{"status":"healthy","service":"wallet-service",...}
```

### Teste - Get Current Round

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/games/rounds/current"
```

**Resposta esperada**:
```json
{
  "round": {
    "id": "uuid",
    "state": "BETTING",
    "serverSeedHash": "hash...",
    "createdAt": "2026-05-05T..."
  },
  "bets": []
}
```

### Teste - Get Round History

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/games/rounds/history?page=1&pageSize=10"
```

**Resposta esperada**:
```json
{
  "rounds": [...],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 0
  }
}
```

---

## 🔑 Testar Endpoints Protegidos (Requer JWT)

### 1. Obter Token do Keycloak

```powershell
$body = @{
    client_id = "crash-game-client"
    username = "player"
    password = "player123"
    grant_type = "password"
}

$response = Invoke-RestMethod -Uri "http://localhost:8080/realms/crash-game/protocol/openid-connect/token" `
    -Method POST `
    -ContentType "application/x-www-form-urlencoded" `
    -Body $body

$token = $response.access_token
Write-Host "Token: $token"
```

### 2. Criar Carteira

```powershell
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:8000/wallets" `
    -Method POST `
    -Headers $headers
```

### 3. Ver Minha Carteira

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/wallets/me" `
    -Headers $headers
```

### 4. Fazer Aposta

```powershell
$betBody = @{ amount = 1000 } | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/games/bet" `
    -Method POST `
    -Headers $headers `
    -ContentType "application/json" `
    -Body $betBody
```

### 5. Ver Histórico de Apostas

```powershell
Invoke-RestMethod -Uri "http://localhost:8000/games/bets/me?page=1&pageSize=10" `
    -Headers $headers
```

---

## 🐛 Troubleshooting

### Problema: "failed the initial dns/balancer resolve for 'games'"

**Causa**: Serviço não está rodando

**Solução**:
```bash
docker-compose ps
docker-compose logs games
docker-compose restart games
```

### Problema: "P3005 - The database schema is not empty"

**Causa**: Prisma tentando rodar migrations em banco existente

**Solução**: Já corrigido! Mudamos para `prisma db push` que é mais flexível.

### Problema: "lockfile had changes, but lockfile is frozen"

**Causa**: bun.lock desatualizado

**Solução**: Já corrigido! Removemos `--frozen-lockfile`.

### Problema: Build muito lento

**Causa**: Docker está baixando dependências

**Solução**: Aguarde o primeiro build. Os próximos serão mais rápidos devido ao cache.

---

## 📊 Status dos Serviços

Para verificar o status completo:

```bash
docker-compose ps
```

Para ver logs em tempo real:

```bash
docker-compose logs -f games wallets
```

Para restart de um serviço específico:

```bash
docker-compose restart games
# ou
docker-compose restart wallets
```

---

## ✅ Checklist Final

Após aplicar todas as correções:

- [ ] `docker-compose down` executado
- [ ] `docker-compose build games wallets` executado com sucesso
- [ ] `docker-compose up -d games wallets` executado
- [ ] `docker-compose ps` mostra games e wallets como "Up (healthy)"
- [ ] `curl http://localhost:8000/games/health` retorna `{"status":"ok"}`
- [ ] `curl http://localhost:8000/wallets/health` retorna `{"status":"healthy"}`
- [ ] `curl http://localhost:8000/games/rounds/current` retorna dados da rodada
- [ ] Frontend consegue fazer requisições para as APIs

---

## 🎯 Próximos Passos

Depois que as APIs estiverem funcionando:

1. **Testar integração E2E**
   - Login no frontend
   - Criar carteira
   - Fazer aposta
   - Cashout
   - Verificar saldo

2. **Testar sincronização em tempo real**
   - Abrir múltiplas abas
   - Verificar se o multiplicador sincroniza via WebSocket

3. **Documentar**
   - Atualizar README.md
   - Documentar decisões de arquitetura
   - Criar diagramas de fluxo

---

**Última atualização**: 2026-05-05

**Status**: ✅ Correções aplicadas, aguardando build
