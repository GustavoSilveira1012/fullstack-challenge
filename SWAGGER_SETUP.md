# 📚 Swagger/OpenAPI - Configuração

## ✅ Swagger foi adicionado ao projeto!

### 🚀 Como instalar e usar:

#### 1. **Instalar dependências**

```bash
# Game Service
cd services/games
bun install

# Wallet Service  
cd services/wallets
bun install
```

#### 2. **Iniciar os serviços**

```bash
# Na raiz do projeto
bun run docker:up
```

#### 3. **Acessar Swagger UI**

Após os serviços subirem (aguarde ~60 segundos):

- **Game Service**: http://localhost:4001/api
- **Wallet Service**: http://localhost:4002/api

Ou via Kong (API Gateway):
- **Game Service**: http://localhost:8000/games/api
- **Wallet Service**: http://localhost:8000/wallets/api

---

## 📖 O que foi configurado:

### Game Service (`services/games/src/main.ts`)

```typescript
const config = new DocumentBuilder()
  .setTitle('Crash Game - Game Service API')
  .setDescription('API for managing game rounds, bets, and provably fair verification')
  .setVersion('1.0')
  .addTag('games', 'Game rounds and gameplay')
  .addTag('bets', 'Player bets and cash outs')
  .addTag('verification', 'Provably fair verification')
  .addBearerAuth(...)
  .build();
```

### Wallet Service (`services/wallets/src/main.ts`)

```typescript
const config = new DocumentBuilder()
  .setTitle('Crash Game - Wallet Service API')
  .setDescription('API for managing player wallets and balances')
  .setVersion('1.0')
  .addTag('wallets', 'Player wallet management')
  .addBearerAuth(...)
  .build();
```

---

## 🔐 Autenticação no Swagger

Para testar endpoints protegidos:

1. Faça login no frontend: http://localhost:3000
2. Copie o token JWT do localStorage
3. No Swagger UI, clique em "Authorize"
4. Cole o token no campo "Value"
5. Clique em "Authorize" e depois "Close"

Agora você pode testar endpoints protegidos!

---

## 📋 Endpoints Documentados

### Game Service

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/health` | Não | Health check |
| GET | `/rounds/current` | Não | Rodada atual |
| GET | `/rounds/history` | Não | Histórico de rodadas |
| GET | `/rounds/:id/verify` | Não | Verificação provably fair |
| GET | `/bets/me` | Sim | Histórico de apostas do jogador |
| POST | `/bet` | Sim | Fazer aposta |
| POST | `/bet/cashout` | Sim | Sacar aposta |

### Wallet Service

| Método | Endpoint | Auth | Descrição |
|--------|----------|------|-----------|
| GET | `/health` | Não | Health check |
| POST | `/wallets` | Sim | Criar carteira |
| GET | `/wallets/me` | Sim | Obter carteira e saldo |

---

## 🎨 Customizações

O Swagger UI foi customizado com:

- ✅ Título personalizado para cada serviço
- ✅ Topbar removida (visual mais limpo)
- ✅ Autorização persistente (não precisa reautenticar a cada refresh)
- ✅ Tags e operações ordenadas alfabeticamente
- ✅ Suporte a Bearer JWT

---

## 🐛 Troubleshooting

### Swagger não carrega?

1. Verifique se o serviço está rodando:
   ```bash
   curl http://localhost:4001/health
   curl http://localhost:4002/health
   ```

2. Verifique os logs:
   ```bash
   docker-compose logs games
   docker-compose logs wallets
   ```

3. Reinstale dependências:
   ```bash
   cd services/games && bun install
   cd services/wallets && bun install
   ```

### Endpoints não aparecem?

Certifique-se de que os controllers têm os decorators `@ApiTags()` e `@ApiOperation()`.

---

## ✅ Checklist

- [x] `@nestjs/swagger` instalado em ambos os serviços
- [x] Swagger configurado no `main.ts`
- [x] Controllers com decorators `@ApiTags()`
- [x] Bearer Auth configurado
- [x] UI customizada
- [x] Documentação completa

---

## 📚 Referências

- [NestJS Swagger Documentation](https://docs.nestjs.com/openapi/introduction)
- [Swagger UI Configuration](https://swagger.io/docs/open-source-tools/swagger-ui/usage/configuration/)
