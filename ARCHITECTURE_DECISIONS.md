# Decisões de Arquitetura e Trade-offs 🏗️

## Visão Geral

Este documento detalha as principais decisões arquiteturais tomadas durante o desenvolvimento do Crash Game, justificativas e trade-offs considerados.

---

## 1. Arquitetura de Microserviços

### Decisão

Separação em dois bounded contexts independentes: **Game Service** e **Wallet Service**.

### Justificativa

- **Separação de responsabilidades**: Lógica de jogo e gestão financeira são domínios distintos
- **Escalabilidade independente**: Wallet pode escalar diferentemente do Game
- **Resiliência**: Falha em um serviço não derruba o outro
- **Desenvolvimento paralelo**: Times podem trabalhar independentemente

### Trade-offs

✅ **Prós**:

- Melhor organização do código
- Facilita manutenção e evolução
- Permite deploy independente

❌ **Contras**:

- Maior complexidade operacional
- Necessidade de comunicação assíncrona
- Eventual consistency entre serviços

---

## 2. Comunicação Assíncrona via RabbitMQ

### Decisão

Uso de **RabbitMQ** para comunicação entre Game Service e Wallet Service.

### Justificativa

- **Desacoplamento**: Serviços não precisam conhecer uns aos outros
- **Resiliência**: Mensagens persistidas garantem entrega
- **Escalabilidade**: Fila absorve picos de carga
- **Auditoria**: Histórico de eventos para debugging

### Eventos Implementados

```typescript
// Game → Wallet
- BetPlacedEvent: Debita valor da aposta
- BetCashedOutEvent: Credita ganhos do cash out
- BetLostEvent: Registra perda (sem operação financeira)

// Wallet → Game
- WalletDebitedEvent: Confirma débito bem-sucedido
- WalletCreditedEvent: Confirma crédito bem-sucedido
- WalletOperationFailedEvent: Notifica falha (saldo insuficiente, etc.)
```

### Trade-offs

✅ **Prós**:

- Alta disponibilidade
- Retry automático
- Dead letter queue para falhas

❌ **Contras**:

- Eventual consistency
- Complexidade de debugging
- Necessidade de idempotência

---

## 3. Precisão Monetária com Centavos

### Decisão

Todos os valores monetários são armazenados e processados em **centavos** (inteiros) usando `BIGINT`.

### Justificativa

- **Precisão absoluta**: Evita erros de arredondamento de ponto flutuante
- **Conformidade**: Padrão da indústria financeira
- **Segurança**: Impossível ter valores negativos não intencionais

### Implementação

```typescript
// Value Object Money
class Money {
  private readonly centavos: bigint;
  
  // Sempre trabalha com inteiros
  add(other: Money): Money
  subtract(other: Money): Money
  multiplyBy(multiplier: number): Money
}
```

### Trade-offs

✅ **Prós**:

- Zero erros de arredondamento
- Auditoria precisa
- Conformidade regulatória

❌ **Contras**:

- Conversão necessária para exibição
- Cuidado com overflow em operações

---

## 4. Provably Fair com HMAC-SHA256

### Decisão

Implementação de algoritmo **provably fair** usando HMAC-SHA256 para geração determinística do crash point.

### Justificativa

- **Transparência**: Jogadores podem verificar resultados
- **Confiança**: Prova criptográfica de que não houve manipulação
- **Conformidade**: Requisito regulatório em muitas jurisdições

### Algoritmo

```typescript
1. Gerar server seed aleatório (256 bits)
2. Hash do server seed é revelado antes da rodada
3. Crash point = f(HMAC-SHA256(serverSeed, clientSeed))
4. Após rodada, server seed é revelado para verificação
```

### Trade-offs

✅ **Prós**:

- Verificável por qualquer jogador
- Impossível manipular após apostas
- Transparência total

❌ **Contras**:

- Complexidade adicional
- Necessidade de educação do usuário
- Armazenamento de seeds históricos

---

## 5. WebSocket para Tempo Real

### Decisão

**Socket.IO** para comunicação em tempo real do servidor para clientes.

### Justificativa

- **Baixa latência**: Essencial para experiência de jogo
- **Push server-side**: Servidor controla sincronização
- **Fallback automático**: Socket.IO usa polling se WebSocket falhar
- **Rooms**: Facilita broadcast para grupos de jogadores

### Eventos WebSocket

```typescript
// Server → Client
- round:betting: Nova rodada iniciada
- round:started: Multiplicador começou a subir
- multiplier:update: Atualização do multiplicador (100ms)
- round:crashed: Rodada terminou
- bet:placed: Alguém apostou
- bet:cashedout: Alguém sacou
```

### Trade-offs

✅ **Prós**:

- Experiência fluida
- Sincronização em tempo real
- Baixo overhead

❌ **Contras**:

- Complexidade de escala horizontal
- Necessidade de sticky sessions ou Redis adapter
- Gerenciamento de reconexões

---

## 6. DDD (Domain-Driven Design)

### Decisão

Arquitetura em camadas seguindo princípios de **DDD**.

### Estrutura

```
src/
├── domain/          # Entidades, Value Objects, Regras de Negócio
├── application/     # Use Cases, Orquestração
├── infrastructure/  # Persistência, Mensageria, Externos
└── presentation/    # Controllers, DTOs, WebSocket Gateways
```

### Justificativa

- **Separação de responsabilidades**: Cada camada tem papel claro
- **Testabilidade**: Domínio isolado de infraestrutura
- **Manutenibilidade**: Mudanças em infra não afetam domínio
- **Expressividade**: Código reflete linguagem do negócio

### Trade-offs

✅ **Prós**:

- Código organizado e limpo
- Fácil de testar
- Evolução sustentável

❌ **Contras**:

- Mais arquivos e abstrações
- Curva de aprendizado
- Pode ser overkill para projetos simples

---

## 7. Crash Point Mínimo de 1.50x

### Decisão

O crash point mínimo foi configurado para **1.50x** (50% de lucro garantido).

### Justificativa

- **Experiência do jogador**: Elimina frustração de crashes instantâneos
- **Retenção**: Jogadores têm sempre uma chance real de lucro
- **Balanceamento**: Mantém house edge de 3% mas com melhor UX

### Implementação

```typescript
// ProvablyFairService
const finalValue = Math.max(1.50, Math.min(rounded, 100.0));
```

### Trade-offs

✅ **Prós**:

- Melhor experiência do jogador
- Reduz reclamações
- Aumenta engajamento

❌ **Contras**:

- Reduz variabilidade do jogo
- Pode afetar house edge esperado
- Jogadores podem ter expectativas mais altas

---

## 8. Frontend com React + Vite

### Decisão

**Vite + React** para o frontend ao invés de Next.js ou TanStack Start.

### Justificativa

- **Performance**: Vite é extremamente rápido
- **Simplicidade**: Não precisamos de SSR para um jogo
- **Controle**: Mais controle sobre build e otimizações
- **Tamanho**: Bundle menor para aplicação SPA

### Trade-offs

✅ **Prós**:

- Build instantâneo
- HMR ultra-rápido
- Bundle otimizado

❌ **Contras**:

- Sem SSR (não é necessário para jogo)
- SEO limitado (não é prioridade)

---

## 9. Zustand para Estado Global

### Decisão

**Zustand** para gerenciamento de estado do cliente.

### Justificativa

- **Simplicidade**: API minimalista e intuitiva
- **Performance**: Re-renders otimizados
- **TypeScript**: Excelente suporte a tipos
- **Tamanho**: Apenas 1KB

### Trade-offs

✅ **Prós**:

- Fácil de aprender
- Menos boilerplate que Redux
- Performance excelente

❌ **Contras**:

- Menos recursos que Redux
- Comunidade menor

---

## 10. Property-Based Testing

### Decisão

Uso de **fast-check** para testes baseados em propriedades.

### Justificativa

- **Cobertura**: Testa milhares de casos automaticamente
- **Confiança**: Encontra edge cases que testes unitários perdem
- **Documentação**: Propriedades documentam invariantes do sistema

### Exemplos

```typescript
// Propriedade: Payout nunca pode ser negativo
fc.assert(
  fc.property(
    fc.integer({ min: 100, max: 100000 }),
    fc.float({ min: 1.0, max: 100.0 }),
    (amount, multiplier) => {
      const payout = calculatePayout(amount, multiplier);
      expect(payout).toBeGreaterThanOrEqual(0);
    }
  )
);
```

### Trade-offs

✅ **Prós**:

- Encontra bugs obscuros
- Maior confiança no código
- Documenta invariantes

❌ **Contras**:

- Testes mais lentos
- Curva de aprendizado
- Pode gerar falsos positivos

---

## 11. Kong como API Gateway

### Decisão

**Kong** para roteamento e gerenciamento de APIs.

### Justificativa

- **Centralização**: Ponto único de entrada
- **Segurança**: Rate limiting, autenticação
- **Observabilidade**: Logs e métricas centralizados
- **Flexibilidade**: Plugins para funcionalidades adicionais

### Trade-offs

✅ **Prós**:

- Desacoplamento de serviços
- Fácil adicionar novos serviços
- Rate limiting out-of-the-box

❌ **Contras**:

- Ponto único de falha
- Latência adicional
- Complexidade operacional

---

## 12. Keycloak para Autenticação

### Decisão

**Keycloak** como Identity Provider (IdP).

### Justificativa

- **Open source**: Sem custos de licença
- **OIDC compliant**: Padrão da indústria
- **Flexível**: Suporta múltiplos fluxos de autenticação
- **Self-hosted**: Controle total dos dados

### Trade-offs

✅ **Prós**:

- Gratuito e open source
- Altamente configurável
- Suporta federação

❌ **Contras**:

- Complexo de configurar
- Requer manutenção
- UI não é a mais moderna

---

## Melhorias Futuras 🚀

### Curto Prazo

1. **Outbox Pattern**: Garantir exactly-once delivery de eventos
2. **Circuit Breaker**: Proteção contra falhas em cascata
3. **Observabilidade**: OpenTelemetry + Prometheus + Grafana
4. **Auto Cashout**: Permitir jogadores definirem multiplicador alvo

### Médio Prazo

1. **Horizontal Scaling**: Redis adapter para Socket.IO
2. **CQRS**: Separar leitura e escrita para melhor performance
3. **Event Sourcing**: Histórico completo de eventos
4. **Leaderboard**: Ranking de jogadores

### Longo Prazo

1. **Multi-tenancy**: Suporte a múltiplos operadores
2. **Internacionalização**: Suporte a múltiplos idiomas
3. **Mobile App**: React Native
4. **Machine Learning**: Detecção de padrões suspeitos

---

## Conclusão

As decisões arquiteturais foram tomadas priorizando:

1. **Confiabilidade**: Sistema robusto e resiliente
2. **Escalabilidade**: Preparado para crescimento
3. **Manutenibilidade**: Código limpo e organizado
4. **Experiência do Usuário**: Performance e usabilidade

Cada trade-off foi cuidadosamente considerado no contexto de um sistema de iGaming em produção.
