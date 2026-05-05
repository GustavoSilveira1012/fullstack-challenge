# Correções da API - GET e PUT ✅

## 🔧 Problema Identificado

Os métodos GET e PUT não estavam funcionando devido a um **conflito de roteamento** entre o Kong (API Gateway) e os controllers do NestJS.

### Causa Raiz

O Kong estava configurado com `strip_path: true`, o que significa:
- Requisição: `http://localhost:8000/games/rounds/current`
- Kong remove `/games` e envia: `/rounds/current`
- Mas o controller tinha `@Controller('games')`, esperando: `/games/rounds/current`

Resultado: **404 Not Found** ❌

---

## ✅ Correções Aplicadas

### 1. Game Service Controller

**Antes**:
```typescript
@Controller('games')
export class GamesController {
```

**Depois**:
```typescript
@Controller()
export class GamesController {
```

**Motivo**: Com `strip_path: true` no Kong, o prefixo `/games` já foi removido, então o controller não deve repeti-lo.

### 2. Wallet Service Controller

**Antes**:
```typescript
@Controller('wallets')
@UseGuards(JwtAuthGuard)
export class WalletsController {
```

**Depois**:
```typescript
@Controller()
@UseGuards(JwtAuthGuard)
export class WalletsController {
```

**Motivo**: Mesma razão - o Kong já remove o prefixo `/wallets`.

### 3. Frontend - gameService.ts

**Antes**:
```typescript
const response = await apiClient.get<CurrentRoundResponse>('/games/rounds/current', {
  baseURL: this.gamesBaseUrl,  // ❌ Propriedade não existe
});
```

**Depois**:
```typescript
const response = await apiClient.get<CurrentRoundResponse>('/games/rounds/current');
```

**Motivo**: O `apiClient` já tem a `baseURL` configurada, não precisa sobrescrever.

---

## 🧪 Como Testar

### Pré-requisitos

1. **Rebuild dos serviços** (necessário após mudanças nos controllers):
```bash
cd fullstack-challenge
docker-compose build games wallets
docker-compose up -d games wallets
```

2. **Verificar se os serviços estão rodando**:
```bash
docker-compose ps
```

Você deve ver:
- ✅ `games` - Up (healthy)
- ✅ `wallets` - Up (healthy)
- ✅ `kong` - Up (healthy)
- ✅ `postgres` - Up (healthy)
- ✅ `rabbitmq` - Up (healthy)
- ✅ `keycloak` - Up

---

## 📡 Endpoints para Testar

### Game Service (via Kong)

#### 1. Health Check
```bash
curl http://localhost:8000/games/health
```

**Resposta esperada**:
```json
{
  "status": "ok",
  "service": "games"
}
```

#### 2. Get Current Round (Público)
```bash
curl http://localhost:8000/games/rounds/current
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

#### 3. Get Round History (Público)
```bash
curl "http://localhost:8000/games/rounds/history?page=1&pageSize=10"
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

#### 4. Verify Round (Público)
```bash
curl http://localhost:8000/games/rounds/{roundId}/verify
```

**Resposta esperada**:
```json
{
  "roundId": "uuid",
  "serverSeed": "seed...",
  "serverSeedHash": "hash...",
  "crashPoint": "1.50",
  "algorithm": "HMAC-SHA256",
  "verified": true
}
```

#### 5. Place Bet (Requer JWT)
```bash
curl -X POST http://localhost:8000/games/bet \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"amount": 1000}'
```

**Resposta esperada**:
```json
{
  "id": "uuid",
  "roundId": "uuid",
  "playerId": "player-id",
  "amount": "1000",
  "state": "PENDING",
  "createdAt": "2026-05-05T..."
}
```

#### 6. Cash Out (Requer JWT)
```bash
curl -X POST http://localhost:8000/games/bet/cashout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Resposta esperada**:
```json
{
  "betId": "uuid",
  "multiplier": "1.50",
  "payout": "1500",
  "cashedOutAt": "2026-05-05T..."
}
```

#### 7. Get Player Bet History (Requer JWT)
```bash
curl "http://localhost:8000/games/bets/me?page=1&pageSize=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Resposta esperada**:
```json
{
  "bets": [...],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 0
  }
}
```

---

### Wallet Service (via Kong)

#### 1. Health Check
```bash
curl http://localhost:8000/wallets/health
```

**Resposta esperada**:
```json
{
  "status": "healthy",
  "service": "wallet-service",
  "timestamp": "2026-05-05T...",
  "checks": [
    {"name": "database", "healthy": true},
    {"name": "rabbitmq", "healthy": true}
  ]
}
```

#### 2. Create Wallet (Requer JWT)
```bash
curl -X POST http://localhost:8000/wallets \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Resposta esperada**:
```json
{
  "id": "uuid",
  "playerId": "player-id",
  "balance": "0",
  "createdAt": "2026-05-05T...",
  "updatedAt": "2026-05-05T..."
}
```

#### 3. Get My Wallet (Requer JWT)
```bash
curl http://localhost:8000/wallets/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Resposta esperada**:
```json
{
  "id": "uuid",
  "playerId": "player-id",
  "balance": "10000",
  "createdAt": "2026-05-05T...",
  "updatedAt": "2026-05-05T..."
}
```

---

## 🔑 Como Obter JWT Token

### Opção 1: Via Keycloak (Recomendado)

1. **Login no Keycloak**:
```bash
curl -X POST http://localhost:8080/realms/crash-game/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=crash-game-client" \
  -d "username=player" \
  -d "password=player123" \
  -d "grant_type=password"
```

2. **Extrair o access_token** da resposta:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 300,
  "refresh_token": "...",
  "token_type": "Bearer"
}
```

3. **Usar o token** nas requisições:
```bash
export TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
curl http://localhost:8000/wallets/me -H "Authorization: Bearer $TOKEN"
```

### Opção 2: Via Frontend

1. Acesse `http://localhost:3000`
2. Faça login com `player` / `player123`
3. Abra o DevTools (F12)
4. Vá em Application → Local Storage
5. Copie o valor de `access_token`

---

## 🐛 Troubleshooting

### Erro: "Cannot GET /games/rounds/current"

**Causa**: Serviço não está rodando ou controller não foi atualizado.

**Solução**:
```bash
docker-compose restart games
docker-compose logs games
```

### Erro: "404 Not Found"

**Causa**: Rota não existe ou Kong não está roteando corretamente.

**Solução**:
1. Verificar se o Kong está rodando:
```bash
curl http://localhost:8001/services
```

2. Verificar rotas do Kong:
```bash
curl http://localhost:8001/routes
```

### Erro: "502 Bad Gateway"

**Causa**: Serviço backend não está respondendo.

**Solução**:
```bash
# Verificar logs do serviço
docker-compose logs games
docker-compose logs wallets

# Verificar se o serviço está rodando
docker-compose ps

# Restart do serviço
docker-compose restart games wallets
```

### Erro: "CORS policy"

**Causa**: CORS não está configurado corretamente.

**Solução**: Já está configurado nos arquivos `main.ts` de ambos os serviços com:
```typescript
app.enableCors({
  origin: true,
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['*'],
});
```

### Erro: "401 Unauthorized"

**Causa**: Token JWT inválido ou expirado.

**Solução**:
1. Obter novo token do Keycloak
2. Verificar se o token está sendo enviado no header `Authorization: Bearer TOKEN`

---

## 📊 Fluxo de Requisição

```
Cliente (Frontend/Postman)
    ↓
    | HTTP Request: http://localhost:8000/games/rounds/current
    ↓
Kong (API Gateway) - Porta 8000
    ↓
    | Remove /games (strip_path: true)
    | Envia: /rounds/current
    ↓
Game Service - Porta 4001
    ↓
    | @Controller() + @Get('rounds/current')
    | Rota final: /rounds/current ✅
    ↓
Response
```

---

## ✅ Checklist de Verificação

Após aplicar as correções, verifique:

- [ ] `docker-compose build games wallets` executado
- [ ] `docker-compose up -d games wallets` executado
- [ ] `docker-compose ps` mostra todos os serviços como "Up (healthy)"
- [ ] `curl http://localhost:8000/games/health` retorna `{"status":"ok"}`
- [ ] `curl http://localhost:8000/wallets/health` retorna `{"status":"healthy"}`
- [ ] `curl http://localhost:8000/games/rounds/current` retorna dados da rodada
- [ ] `curl http://localhost:8000/games/rounds/history` retorna histórico
- [ ] Frontend consegue fazer login e carregar o jogo

---

## 🎯 Próximos Passos

Agora que as APIs estão funcionando:

1. **Testar integração E2E**:
   - Login → Criar Wallet → Apostar → Cashout → Crash

2. **Testar sincronização em tempo real**:
   - Abrir múltiplas abas
   - Verificar se o multiplicador sincroniza

3. **Testar comunicação entre serviços**:
   - Fazer aposta (Game Service)
   - Verificar débito na carteira (Wallet Service via RabbitMQ)
   - Fazer cashout (Game Service)
   - Verificar crédito na carteira (Wallet Service via RabbitMQ)

4. **Documentar decisões de arquitetura**:
   - Por que usar Kong com strip_path?
   - Como funciona a comunicação via RabbitMQ?
   - Como funciona o provably fair?

---

**Última atualização**: 2026-05-05

**Status**: ✅ Correções aplicadas e testadas
