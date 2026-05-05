# Arquitetura e Decisões Técnicas - Crash Game

## Visão Geral

Este documento descreve as decisões de arquitetura, trade-offs e justificativas técnicas do projeto Crash Game.

---

## Arquitetura Geral

### Bounded Contexts (DDD)

O sistema é dividido em dois bounded contexts independentes:

1. **Game Service** - Responsável pelo ciclo de vida das rodadas, apostas e lógica do jogo
2. **Wallet Service** - Responsável pela carteira dos jogadores e operações monetárias

**Justificativa**: Separação de responsabilidades permite escalabilidade independente e manutenção mais fácil. Cada serviço pode evoluir sem afetar o outro.

### Comunicação Assíncrona

**Decisão**: RabbitMQ para comunicação entre serviços

**Justificativa**:
- **Desacoplamento**: Serviços não precisam conhecer uns aos outros
- **Resiliência**: Mensagens são persistidas e reprocessadas em caso de falha
- **Escalabilidade**: Fácil adicionar consumers para processar mais mensagens
- **Auditoria**: Todas as operações monetárias são rastreáveis via eventos

**Trade-offs**:
- ✅ Maior resiliência e desacoplamento
- ❌ Complexidade adicional (eventual consistency)
- ❌ Latência ligeiramente maior que chamadas síncronas

### Eventos de Domínio

**Eventos principais**:

**Game Service → Wallet Service**:
- `BetPlaced` - Quando uma aposta é feita (debita saldo)
- `BetCashedOut` - Quando jogador faz cash out (credita ganhos)
- `RoundCrashed` - Quando rodada termina (processa apostas perdidas)

**Wallet Service → Game Service**:
- `WalletDebited` - Confirmação de débito
- `WalletCredited` - Confirmação de crédito
- `InsufficientBalance` - Erro de saldo insuficiente

**Justificativa**: Event-driven architecture garante consistência eventual e permite auditoria completa.

---

## Provably Fair Algorithm

### Implementação

**Algoritmo escolhido**: Hash-based provably fair com SHA-256

**Fluxo**:
1. Servidor gera seed aleatório (256-bit)
2. Hash SHA-256 do seed é mostrado aos jogadores ANTES da rodada
3. Crash point é calculado deterministicamente a partir do seed
4. Após o crash, seed é revelado para verificação

**Fórmula do Crash Point**:
```typescript
// Pega primeiros 8 caracteres do seed (32 bits)
const hex = serverSeed.substring(0, 8);
const intValue = parseInt(hex, 16);

// Normaliza para 0-1
const normalized = intValue / 0x100000000;

// Aplica house edge (1%)
const houseEdge = 0.01;

// Calcula crash point (distribuição exponencial)
const crashPoint = (99 / (1 - normalized)) * (1 - houseEdge);
```

**Justificativa**:
- ✅ Verificável independentemente por qualquer jogador
- ✅ Impossível manipular após mostrar o hash
- ✅ Distribuição exponencial favorece crashes baixos (realista)
- ✅ House edge transparente (1%)

**Trade-offs**:
- ✅ Transparência total
- ❌ Seed deve ser gerado com criptografia segura (crypto.randomBytes)
- ❌ Requer armazenamento de seeds históricos

### Crash Point Mínimo: 1.50x

**Decisão de Design**: O sistema garante que o crash point nunca será inferior a **1.50x**.

**Justificativa**:
1. **Experiência do Jogador**: Elimina a frustração de crashes instantâneos ou muito baixos (1.00x - 1.49x)
2. **Lucro Mínimo Garantido**: Jogadores sempre têm pelo menos 50% de lucro potencial em cada rodada
3. **Tempo de Jogo**: Garante mínimo de 5 segundos de gameplay, permitindo decisões conscientes
4. **Retenção**: Jogadores tendem a permanecer mais tempo quando sentem que têm chances reais

**Implementação**:
```typescript
// Em ProvablyFairService.calculateCrashPoint()
const finalValue = Math.max(1.50, Math.min(rounded, 100.0));
```

**Impacto no House Edge**:
- O house edge de 3% é mantido na distribuição acima de 1.50x
- Crashes entre 1.00x e 1.49x são redistribuídos para valores mais altos
- Isso torna o jogo mais generoso, mas ainda lucrativo para a casa

**Trade-offs**:
- ✅ Melhor experiência do jogador
- ✅ Maior retenção e engajamento
- ✅ Elimina sensação de "jogo injusto"
- ❌ Reduz ligeiramente a margem de lucro da casa
- ❌ Pode criar expectativas mais altas nos jogadores

**Alternativas Consideradas**:
- **1.01x**: Muito baixo, ainda frustrante
- **1.20x**: Melhor que 1.01x, mas ainda pode parecer injusto
- **2.00x**: Muito generoso, impacta significativamente o house edge
- **1.50x** (escolhido): Equilíbrio ideal entre experiência e lucratividade

---

## Precisão Monetária

### Decisão: Centavos como Inteiros

**Implementação**:
- Todos os valores monetários são armazenados como **centavos inteiros** (BIGINT)
- **NUNCA** usar ponto flutuante para dinheiro
- Conversão: R$ 10,00 = 10000 centavos

**Justificativa**:
- ✅ Elimina erros de arredondamento de ponto flutuante
- ✅ Precisão perfeita em operações matemáticas
- ✅ Padrão da indústria financeira

**Exemplo de problema evitado**:
```javascript
// ❌ ERRADO - Ponto flutuante
0.1 + 0.2 === 0.3 // false! (0.30000000000000004)

// ✅ CORRETO - Inteiros
10 + 20 === 30 // true
```

### Value Object: Money

```typescript
class Money {
  private readonly centavos: bigint;
  
  static fromCentavos(value: bigint): Result<Money, Error> {
    if (value < 0n) {
      return { ok: false, error: new Error('Negative amount') };
    }
    return { ok: true, value: new Money(value) };
  }
  
  add(other: Money): Money {
    return new Money(this.centavos + other.centavos);
  }
}
```

**Justificativa**: Encapsula lógica monetária e garante invariantes (nunca negativo).

---

## WebSocket Real-Time

### Decisão: WebSocket para Push, REST para Actions

**Arquitetura**:
- **WebSocket**: Servidor → Cliente (eventos em tempo real)
- **REST**: Cliente → Servidor (ações do jogador)

**Eventos WebSocket**:
- `MULTIPLIER_UPDATE` - Atualização do multiplicador (60 FPS)
- `ROUND_STATE_CHANGE` - Mudança de fase (BETTING → RUNNING → CRASHED)
- `ROUND_CRASHED` - Rodada terminou
- `BET_CONFIRMED` - Aposta confirmada
- `BET_CASHED_OUT` - Cash out confirmado

**Justificativa**:
- ✅ WebSocket ideal para streaming de dados (multiplicador)
- ✅ REST mais simples para ações (apostar, cash out)
- ✅ Separação clara de responsabilidades
- ✅ Fácil adicionar autenticação em REST (JWT)

**Trade-offs**:
- ✅ Melhor performance para real-time
- ❌ Dois protocolos para gerenciar
- ❌ WebSocket requer reconexão automática

### Sincronização do Multiplicador

**Decisão**: Interpolação no cliente

**Implementação**:
```typescript
// Servidor envia multiplicador a cada 100ms
// Cliente interpola entre valores para 60 FPS suave

const interpolate = (start, end, progress) => {
  return start + (end - start) * progress;
};
```

**Justificativa**:
- ✅ Reduz carga no servidor (menos mensagens)
- ✅ Animação suave no cliente (60 FPS)
- ✅ Menor uso de banda

**Trade-offs**:
- ✅ Performance otimizada
- ❌ Pequena latência visual (aceitável)

---

## Autenticação e Autorização

### Decisão: Keycloak (OAuth2/OIDC)

**Fluxo**:
1. Frontend redireciona para Keycloak
2. Usuário faz login
3. Keycloak retorna authorization code
4. Frontend troca code por access token
5. Token JWT é enviado em todas as requisições

**Justificativa**:
- ✅ Padrão da indústria (OAuth2/OIDC)
- ✅ Não precisamos implementar autenticação
- ✅ Suporta MFA, SSO, etc.
- ✅ Tokens JWT são stateless

**Validação no Backend**:
```typescript
// Valida assinatura JWT com chave pública do Keycloak
const decoded = jwt.verify(token, publicKey);
const playerId = decoded.sub; // Subject = player ID
```

**Trade-offs**:
- ✅ Segurança robusta
- ✅ Fácil adicionar providers (Google, Facebook)
- ❌ Dependência externa (Keycloak)
- ❌ Complexidade inicial de setup

---

## Banco de Dados

### Decisão: PostgreSQL 18

**Justificativa**:
- ✅ ACID compliant (transações seguras)
- ✅ Suporte a BIGINT para valores monetários
- ✅ JSON support para dados flexíveis
- ✅ Performance excelente
- ✅ Open source

### Schema Design

**Game Service**:
```sql
CREATE TABLE rounds (
  id UUID PRIMARY KEY,
  server_seed VARCHAR(64) NOT NULL,
  server_seed_hash VARCHAR(64) NOT NULL,
  crash_point NUMERIC(10,2) NOT NULL,
  state VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL,
  started_at TIMESTAMP,
  crashed_at TIMESTAMP,
  finished_at TIMESTAMP,
  version INT NOT NULL DEFAULT 1
);

CREATE TABLE bets (
  id UUID PRIMARY KEY,
  round_id UUID NOT NULL REFERENCES rounds(id),
  player_id UUID NOT NULL,
  amount BIGINT NOT NULL, -- centavos
  state VARCHAR(20) NOT NULL,
  cash_out_multiplier NUMERIC(10,2),
  payout BIGINT, -- centavos
  created_at TIMESTAMP NOT NULL,
  version INT NOT NULL DEFAULT 1
);
```

**Wallet Service**:
```sql
CREATE TABLE wallets (
  id UUID PRIMARY KEY,
  player_id UUID NOT NULL UNIQUE,
  balance BIGINT NOT NULL DEFAULT 0, -- centavos
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  wallet_id UUID NOT NULL REFERENCES wallets(id),
  type VARCHAR(20) NOT NULL, -- DEBIT, CREDIT
  amount BIGINT NOT NULL, -- centavos
  balance_after BIGINT NOT NULL,
  reference_id UUID, -- bet_id ou round_id
  created_at TIMESTAMP NOT NULL
);
```

**Justificativa**:
- ✅ BIGINT para valores monetários (precisão)
- ✅ UUID para IDs (distribuído, sem colisão)
- ✅ Timestamps para auditoria
- ✅ Version para optimistic locking
- ✅ Transactions table para auditoria completa

---

## API Gateway (Kong)

### Decisão: Kong para roteamento e CORS

**Configuração**:
```yaml
services:
  - name: games
    url: http://games:4001
    routes:
      - name: games-route
        paths: [/games]
        
  - name: wallets
    url: http://wallets:4002
    routes:
      - name: wallets-route
        paths: [/wallets]
```

**Justificativa**:
- ✅ Ponto único de entrada
- ✅ CORS configurado centralmente
- ✅ Rate limiting (futuro)
- ✅ Logging centralizado
- ✅ Load balancing (futuro)

**Trade-offs**:
- ✅ Simplifica frontend (uma URL)
- ❌ Ponto único de falha (mitigado com health checks)
- ❌ Latência adicional (mínima)

---

## Frontend

### Decisão: Vite + React + TypeScript

**Justificativa**:
- ✅ Vite: Build extremamente rápido (HMR instantâneo)
- ✅ React: Ecossistema maduro, fácil contratar devs
- ✅ TypeScript: Type safety, menos bugs

### State Management

**Decisão**: Zustand para client state, TanStack Query para server state

**Zustand** (client state):
```typescript
// Estado local (UI, preferências)
const useUIStore = create((set) => ({
  theme: 'dark',
  soundEnabled: true,
  toggleSound: () => set((state) => ({ 
    soundEnabled: !state.soundEnabled 
  })),
}));
```

**TanStack Query** (server state):
```typescript
// Cache de dados do servidor
const { data, isLoading } = useQuery({
  queryKey: ['wallet'],
  queryFn: () => walletService.getBalance(),
  refetchInterval: 5000, // Atualiza a cada 5s
});
```

**Justificativa**:
- ✅ Zustand: Simples, sem boilerplate
- ✅ TanStack Query: Cache automático, refetch, loading states
- ✅ Separação clara: client vs server state

**Trade-offs**:
- ✅ Menos código, mais produtividade
- ❌ Duas bibliotecas para aprender

### Styling

**Decisão**: Tailwind CSS v4

**Justificativa**:
- ✅ Utility-first: Rápido para prototipar
- ✅ Dark mode built-in
- ✅ Responsivo fácil
- ✅ Sem CSS global (scoped)

---

## Testes

### Estratégia de Testes

**Unitários** (Domain Layer):
- Entidades (Round, Bet, Wallet)
- Value Objects (Money, PlayerId)
- Provably Fair algorithm
- **Cobertura alvo**: 90%+

**E2E** (API Layer):
- Fluxos completos (apostar → cash out → saldo atualizado)
- Cenários de erro (saldo insuficiente, aposta dupla)
- **Cobertura alvo**: Happy path + principais erros

**Frontend**:
- Componentes críticos (BetForm, CashOutButton)
- Hooks (useWallet, useGameLogic)
- **Cobertura alvo**: 70%+

**Justificativa**:
- ✅ Unitários: Rápidos, testam lógica de negócio
- ✅ E2E: Garantem integração funciona
- ✅ Frontend: Garantem UI funciona

---

## Observabilidade (Futuro)

### Métricas Importantes

**Game Service**:
- RTP (Return to Player) - % de retorno aos jogadores
- Crash point médio
- Apostas por rodada
- Latência de WebSocket

**Wallet Service**:
- Volume de transações
- Saldo total em circulação
- Latência de operações

**Implementação sugerida**:
- OpenTelemetry para traces
- Prometheus para métricas
- Grafana para dashboards

---

## Escalabilidade

### Horizontal Scaling

**Game Service**:
- ✅ Stateless (exceto WebSocket connections)
- ✅ Pode rodar múltiplas instâncias
- ⚠️ Game Engine deve ser singleton (apenas uma instância gerando rodadas)

**Wallet Service**:
- ✅ Stateless
- ✅ Pode rodar múltiplas instâncias
- ✅ Transações garantem consistência

**RabbitMQ**:
- ✅ Clustering para alta disponibilidade
- ✅ Múltiplos consumers para throughput

**PostgreSQL**:
- ✅ Read replicas para leitura
- ✅ Connection pooling (PgBouncer)

---

## Segurança

### Medidas Implementadas

1. **Autenticação**: JWT tokens validados em cada requisição
2. **Autorização**: Player só pode apostar/cash out suas próprias apostas
3. **Input Validation**: Todos os inputs são validados (min/max, tipos)
4. **SQL Injection**: ORM (Prisma) previne SQL injection
5. **CORS**: Configurado no Kong para permitir apenas origens confiáveis
6. **Rate Limiting**: (Futuro) Prevenir abuse

### Vulnerabilidades Mitigadas

- ✅ SQL Injection (ORM)
- ✅ XSS (React escapa HTML automaticamente)
- ✅ CSRF (Tokens JWT stateless)
- ✅ Replay attacks (Timestamps em eventos)

---

## Trade-offs e Limitações

### Consistência Eventual

**Trade-off**: Comunicação assíncrona via RabbitMQ

**Impacto**:
- Débito na carteira pode levar alguns ms para refletir
- Em caso de falha, mensagens são reprocessadas (idempotência necessária)

**Mitigação**:
- UI mostra loading states
- Optimistic updates no frontend
- Retry automático de mensagens

### WebSocket Reconnection

**Trade-off**: WebSocket pode desconectar

**Impacto**:
- Jogador pode perder atualizações de multiplicador
- Pode não ver quando rodada crashou

**Mitigação**:
- Reconexão automática
- Fetch estado atual ao reconectar
- Mostrar indicador de conexão

### Provably Fair Verification

**Trade-off**: Seed deve ser armazenado indefinidamente

**Impacto**:
- Crescimento do banco de dados
- Custo de armazenamento

**Mitigação**:
- Arquivar seeds antigos (> 30 dias) em cold storage
- Comprimir dados históricos

---

## Decisões Futuras

### Outbox Pattern

**Problema**: Garantir que eventos sejam publicados atomicamente com mudanças no banco

**Solução**:
```typescript
// Transação atômica
await prisma.$transaction([
  prisma.wallet.update({ ... }),
  prisma.outbox.create({ event: 'WalletDebited', ... })
]);

// Worker separado publica eventos do outbox
```

**Benefício**: Exactly-once delivery garantido

### Auto Cash Out

**Feature**: Jogador define multiplicador alvo

**Implementação**:
```typescript
interface AutoCashOut {
  playerId: string;
  targetMultiplier: number;
  enabled: boolean;
}

// Game engine verifica auto cash outs a cada tick
if (currentMultiplier >= autoCashOut.targetMultiplier) {
  await cashOut(autoCashOut.playerId);
}
```

### Leaderboard

**Feature**: Top jogadores por lucro

**Implementação**:
```sql
-- Materialized view atualizada periodicamente
CREATE MATERIALIZED VIEW leaderboard AS
SELECT 
  player_id,
  SUM(CASE WHEN payout > 0 THEN payout - amount ELSE -amount END) as profit
FROM bets
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY player_id
ORDER BY profit DESC
LIMIT 100;
```

---

## Conclusão

Este projeto demonstra:

✅ **DDD**: Bounded contexts, agregados, value objects
✅ **Event-Driven**: Comunicação assíncrona resiliente
✅ **Provably Fair**: Transparência e verificabilidade
✅ **Precisão Monetária**: Sem erros de arredondamento
✅ **Real-Time**: WebSocket para experiência fluida
✅ **Segurança**: Autenticação, validação, auditoria
✅ **Escalabilidade**: Arquitetura preparada para crescer

**Próximos passos**:
1. Implementar Outbox pattern
2. Adicionar observabilidade (OpenTelemetry)
3. Testes de carga (k6)
4. CI/CD pipeline
5. Kubernetes deployment
