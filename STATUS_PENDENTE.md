# Status do Projeto - Crash Game 🎮

## ✅ O que JÁ está implementado

### Backend

#### Game Service (100% Completo) ✅
- ✅ **Domain Layer**: Entidades (Round, Bet), Value Objects (Money, Multiplier, etc.), Domain Services (ProvablyFair, Multiplier)
- ✅ **Application Layer**: 9 Use Cases completos, DTOs, RoundEngine
- ✅ **Infrastructure Layer**: Repositórios Prisma, RabbitMQ Publisher/Consumer
- ✅ **Presentation Layer**: REST Controllers, WebSocket Gateway, JWT Auth Guard
- ✅ **Testes**: 296 testes (unitários + property-based) passando
- ✅ **Provably Fair**: Algoritmo HMAC-SHA256 com verificação
- ✅ **Precisão Monetária**: BigInt para valores monetários
- ✅ **Dockerfile**: Configurado e funcional

#### Wallet Service (95% Completo) ✅
- ✅ **Domain Layer**: Entidade Wallet, Value Objects (Money, WalletId, PlayerId), Domain Events
- ✅ **Application Layer**: 5 Use Cases completos, DTOs
- ✅ **Infrastructure Layer**: Repositório Prisma, RabbitMQ Publisher/Consumer
- ✅ **Presentation Layer**: REST Controllers (parcial), JWT Auth Guard, Error Handling
- ✅ **Testes**: Unitários, property-based e integração
- ✅ **Precisão Monetária**: BigInt para valores monetários
- ✅ **Dockerfile**: Configurado e funcional
- ⚠️ **Pendente**: Task 16 (REST Controllers) - falta finalizar testes E2E

### Frontend (70% Completo) ⚠️
- ✅ **Setup**: Vite + React + TypeScript configurado
- ✅ **Styling**: TailwindCSS v4 configurado com tema dark
- ✅ **State Management**: Zustand stores criados (auth, game, wallet, ui)
- ✅ **Build**: Otimização de produção configurada
- ✅ **Dockerfile**: Criado e funcional
- ⚠️ **Pendente**: Implementação dos componentes e páginas (Tasks 2-10)

### Infraestrutura ✅
- ✅ **Docker Compose**: Configurado com todos os serviços
- ✅ **PostgreSQL**: Databases `games` e `wallets` configurados
- ✅ **RabbitMQ**: Configurado e funcional
- ✅ **Keycloak**: Realm `crash-game` importado automaticamente
- ✅ **Kong**: API Gateway configurado com rotas

---

## ❌ O que FALTA implementar

### 1. Wallet Service - Finalizar Task 16 (REST Controllers)

**Status**: 95% completo, falta apenas finalizar testes E2E

**O que falta**:
- [ ] 16.3 - Completar testes E2E do WalletsController
- [ ] 16.4 - Completar testes E2E do HealthController

**Estimativa**: 1-2 horas

**Prioridade**: MÉDIA (testes já existem, só precisam ser finalizados)

---

### 2. Frontend - Implementação Completa (Tasks 2-10)

**Status**: 30% completo (apenas setup e configuração)

#### Task 2: API Client & Services Setup ❌
- [ ] 2.1 - Criar API client com Axios e interceptors
- [ ] 2.2 - Implementar serviço de autenticação (Keycloak OIDC)
- [ ] 2.3 - Implementar serviço de games (REST endpoints)
- [ ] 2.4 - Implementar serviço de wallet (REST endpoints)
- [ ] 2.5 - Implementar tratamento de erros e retry logic

**Estimativa**: 4-6 horas

#### Task 3: WebSocket Service Implementation ❌
- [ ] 3.1 - Criar WebSocket client com reconexão automática
- [ ] 3.2 - Implementar event handlers para eventos do jogo
- [ ] 3.3 - Implementar sincronização de estado em tempo real
- [ ] 3.4 - Implementar heartbeat e detecção de desconexão

**Estimativa**: 3-4 horas

#### Task 4: State Management (Zustand Stores) ⚠️
- [x] 4.1 - authStore (já criado, precisa integrar com Keycloak)
- [x] 4.2 - gameStore (já criado, precisa integrar com WebSocket)
- [x] 4.3 - walletStore (já criado, precisa integrar com API)
- [x] 4.4 - uiStore (já criado, funcional)
- [ ] 4.5 - Integrar stores com serviços e WebSocket

**Estimativa**: 2-3 horas

#### Task 5: Custom Hooks Implementation ❌
- [ ] 5.1 - useAuth (login, logout, token refresh)
- [ ] 5.2 - useGame (estado do jogo, apostas, cashout)
- [ ] 5.3 - useWallet (saldo, transações)
- [ ] 5.4 - useWebSocket (conexão, eventos)
- [ ] 5.5 - useNotifications (toast notifications)

**Estimativa**: 3-4 horas

#### Task 6: UI Components (shadcn/ui) ❌
- [ ] 6.1 - Instalar e configurar shadcn/ui
- [ ] 6.2 - Criar componentes base (Button, Input, Card, etc.)
- [ ] 6.3 - Criar componentes de layout (Header, Sidebar, etc.)
- [ ] 6.4 - Criar componentes de feedback (Toast, Loading, Error)

**Estimativa**: 4-5 horas

#### Task 7: Game Components ❌
- [ ] 7.1 - CrashGraph (gráfico animado do multiplicador)
- [ ] 7.2 - BetControls (input de aposta, botões)
- [ ] 7.3 - BetsList (lista de apostas em tempo real)
- [ ] 7.4 - RoundHistory (histórico de crash points)
- [ ] 7.5 - PlayerInfo (saldo, username)
- [ ] 7.6 - BettingTimer (countdown da fase de apostas)

**Estimativa**: 8-10 horas

#### Task 8: Pages Implementation ❌
- [ ] 8.1 - LoginPage (redirect para Keycloak)
- [ ] 8.2 - GamePage (página principal do jogo)
- [ ] 8.3 - CallbackPage (callback do Keycloak)
- [ ] 8.4 - NotFoundPage (404)

**Estimativa**: 3-4 horas

#### Task 9: Animations & Effects ❌
- [ ] 9.1 - Animação da curva do multiplicador
- [ ] 9.2 - Animação de crash
- [ ] 9.3 - Animação de cashout
- [ ] 9.4 - Efeitos sonoros (bet, cashout, crash)
- [ ] 9.5 - Feedback visual (loading states, transitions)

**Estimativa**: 4-6 horas

#### Task 10: Testing & Optimization ❌
- [ ] 10.1 - Testes unitários dos componentes
- [ ] 10.2 - Testes de integração
- [ ] 10.3 - Testes E2E com Playwright (opcional)
- [ ] 10.4 - Otimização de performance (60 FPS)
- [ ] 10.5 - Acessibilidade (WCAG)
- [ ] 10.6 - Responsividade (mobile/desktop)

**Estimativa**: 6-8 horas

**Total Frontend**: 37-50 horas

---

### 3. Integração End-to-End ❌

**O que falta**:
- [ ] Testar fluxo completo: Login → Criar Wallet → Apostar → Cashout → Crash
- [ ] Testar sincronização em tempo real (múltiplas abas)
- [ ] Testar comunicação entre Game Service e Wallet Service via RabbitMQ
- [ ] Testar autenticação JWT em todos os endpoints
- [ ] Verificar precisão monetária em todo o fluxo
- [ ] Testar tratamento de erros (saldo insuficiente, aposta dupla, etc.)

**Estimativa**: 4-6 horas

---

### 4. Documentação ❌

**O que falta**:
- [ ] Atualizar README.md com instruções completas
- [ ] Documentar decisões de arquitetura
- [ ] Documentar trade-offs e limitações
- [ ] Criar guia de desenvolvimento local
- [ ] Documentar API com Swagger/OpenAPI
- [ ] Criar diagrama de arquitetura atualizado
- [ ] Documentar eventos WebSocket e payloads

**Estimativa**: 3-4 horas

---

### 5. Itens Bônus (Opcionais) ⭐

Estes itens não são obrigatórios, mas diferenciam candidatos excepcionais:

- [ ] **Outbox/Inbox transacional** - Garantia de at-least-once delivery
- [ ] **Auto cashout** - Multiplicador alvo para saque automático
- [ ] **Auto bet** - Apostas automáticas com estratégia
- [ ] **Observabilidade** - OpenTelemetry + Prometheus + Grafana
- [ ] **Seed determinística para testes E2E**
- [ ] **Efeitos sonoros** - Feedback de áudio
- [ ] **Leaderboard** - Top jogadores por lucro
- [ ] **CI pipeline** - GitHub Actions
- [ ] **Playwright** - Testes E2E no browser
- [ ] **Rate limiting** - Via Kong ou aplicação
- [ ] **Storybook** - Biblioteca de componentes
- [ ] **Fórmula da curva na UI** - Transparência

**Estimativa**: 20-40 horas (dependendo dos itens escolhidos)

---

## 📊 Resumo de Prioridades

### CRÍTICO (Eliminatórios) 🔴
1. **Frontend - Tasks 2-9** (35-45 horas)
   - Sem isso, o jogo não funciona
   - Requisito eliminatório: "Gameplay funciona"

2. **Integração End-to-End** (4-6 horas)
   - Requisito eliminatório: "Sincronização em tempo real"
   - Requisito eliminatório: "Dois serviços comunicando via RabbitMQ"

### IMPORTANTE (Pontuação) 🟡
3. **Documentação** (3-4 horas)
   - Requisito de entrega: "README com instruções e decisões"
   - Peso: 10% (Histórico Git + Documentação)

4. **Frontend - Task 10 (Testing)** (6-8 horas)
   - Requisito eliminatório: "Testes existem"
   - Peso: 20% (Testes)

### OPCIONAL (Diferencial) 🟢
5. **Wallet Service - Task 16.3/16.4** (1-2 horas)
   - Testes já existem, só precisam ser finalizados
   - Não é eliminatório (testes unitários já cobrem)

6. **Itens Bônus** (20-40 horas)
   - Diferenciam candidatos excepcionais
   - Não são obrigatórios

---

## ⏱️ Estimativa Total

### Mínimo Viável (Eliminatórios)
- Frontend Tasks 2-9: **35-45 horas**
- Integração E2E: **4-6 horas**
- Documentação: **3-4 horas**
- **TOTAL: 42-55 horas**

### Completo (Com testes e polish)
- Mínimo Viável: **42-55 horas**
- Frontend Task 10: **6-8 horas**
- Wallet Service Task 16: **1-2 horas**
- **TOTAL: 49-65 horas**

### Excepcional (Com bônus)
- Completo: **49-65 horas**
- Itens Bônus selecionados: **10-20 horas**
- **TOTAL: 59-85 horas**

---

## 🎯 Recomendação de Execução

### Fase 1: MVP Funcional (42-55h)
1. Frontend Tasks 2-5 (Serviços, WebSocket, Stores, Hooks)
2. Frontend Tasks 6-7 (Componentes UI e Game)
3. Frontend Task 8 (Páginas)
4. Frontend Task 9 (Animações)
5. Integração E2E
6. Documentação básica

### Fase 2: Polish e Testes (7-10h)
1. Frontend Task 10 (Testing)
2. Wallet Service Task 16 (finalizar testes E2E)
3. Documentação completa

### Fase 3: Diferenciais (10-20h) - Opcional
1. Escolher 2-3 itens bônus mais impactantes
2. Implementar com qualidade
3. Documentar decisões

---

## 📝 Notas Importantes

### O que NÃO precisa ser feito
- ❌ Refatorar Game Service (já está completo e testado)
- ❌ Refatorar Wallet Service (apenas finalizar Task 16)
- ❌ Modificar infraestrutura (Docker, Kong, Keycloak já funcionam)
- ❌ Criar novos serviços (apenas Game e Wallet são necessários)

### Pontos de Atenção
- ⚠️ **Precisão Monetária**: Frontend deve usar centavos (inteiros) em toda comunicação com backend
- ⚠️ **WebSocket**: Apenas server → client (push). Ações do jogador via REST.
- ⚠️ **Autenticação**: JWT do Keycloak deve ser validado em todos os endpoints protegidos
- ⚠️ **Sincronização**: Múltiplas abas devem mostrar o mesmo estado em tempo real
- ⚠️ **Performance**: Animações devem rodar a 60 FPS

### Critérios Eliminatórios (DEVEM passar)
- ✅ `bun run docker:up` sobe tudo sem passos manuais
- ⚠️ Gameplay funciona (apostar → multiplicador → cashout/crash → liquidação)
- ✅ Dois serviços separados comunicando via RabbitMQ
- ⚠️ Sincronização em tempo real (múltiplas abas mostram o mesmo estado)
- ✅ Precisão monetária (sem ponto flutuante, saldo nunca negativo)
- ✅ Autenticação via Keycloak — backend valida JWTs
- ⚠️ Testes existem (unitários + E2E)

**Legenda**: ✅ Completo | ⚠️ Pendente

---

## 🚀 Próximos Passos Sugeridos

1. **Criar spec para o Frontend** (se quiser usar metodologia spec-driven)
2. **Implementar Frontend Tasks 2-5** (fundação: serviços, WebSocket, stores, hooks)
3. **Implementar Frontend Tasks 6-7** (componentes visuais)
4. **Implementar Frontend Tasks 8-9** (páginas e animações)
5. **Testar integração E2E**
6. **Documentar tudo**
7. **Finalizar testes** (se houver tempo)
8. **Adicionar bônus** (se houver tempo)

---

**Última atualização**: 2026-05-05
