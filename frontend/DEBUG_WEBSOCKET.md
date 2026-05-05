# Debug do WebSocket - Multiplicador Crashando em 1.00x

## Problema
O jogo está crashando sempre em 1.00x, indicando que:
1. O backend está crashando muito cedo, OU
2. O frontend não está recebendo os updates do multiplicador

## Como Debugar

### Passo 1: Abrir Console do Navegador
1. Pressione **F12** no navegador
2. Vá para a aba **Console**
3. Limpe o console (ícone 🚫 ou Ctrl+L)

### Passo 2: Iniciar um Round
1. Coloque uma aposta
2. Aguarde o round iniciar
3. Observe os logs no console

### Passo 3: Analisar os Logs

#### Logs Esperados (CORRETO):
```
[WebSocket] Connected
[WebSocket] ROUND_STATE_CHANGE received: { state: 'RUNNING', roundId: '...' }
[WebSocket] MULTIPLIER_UPDATE received: { multiplier: 1.00, timestamp: ... }
[GameStore] Multiplier updated: 1.00 -> 1.00
[WebSocket] MULTIPLIER_UPDATE received: { multiplier: 1.05, timestamp: ... }
[GameStore] Multiplier updated: 1.00 -> 1.05
[WebSocket] MULTIPLIER_UPDATE received: { multiplier: 1.10, timestamp: ... }
[GameStore] Multiplier updated: 1.05 -> 1.10
[WebSocket] MULTIPLIER_UPDATE received: { multiplier: 1.15, timestamp: ... }
[GameStore] Multiplier updated: 1.10 -> 1.15
...
[WebSocket] ROUND_CRASHED received: { crashPoint: 2.45, roundId: '...' }
[GameStore] Multiplier updated: 2.40 -> 2.45
```

#### Logs Problemáticos (ERRADO):

**Problema 1: Não recebe MULTIPLIER_UPDATE**
```
[WebSocket] Connected
[WebSocket] ROUND_STATE_CHANGE received: { state: 'RUNNING', roundId: '...' }
[WebSocket] ROUND_CRASHED received: { crashPoint: 1.00, roundId: '...' }
```
**Causa**: Backend não está enviando updates de multiplicador

**Problema 2: Recebe valores inválidos**
```
[WebSocket] MULTIPLIER_UPDATE received: { multiplier: NaN, timestamp: ... }
[WebSocket] Invalid multiplier received: NaN
```
**Causa**: Backend está enviando valores inválidos

**Problema 3: Multiplier volta para 1.0**
```
[GameStore] Multiplier updated: 1.50 -> 1.00
[GameStore] Multiplier updated: 1.00 -> 1.20
[GameStore] Multiplier updated: 1.20 -> 1.00
```
**Causa**: Backend está enviando valores antigos ou resetando

### Passo 4: Verificar Mensagens do WebSocket

Se não aparecer nenhum log, verifique:

1. **WebSocket está conectado?**
```
[WebSocket] Connected
```
Se não aparecer, o WebSocket não conectou.

2. **Está recebendo mensagens?**
```
[WebSocket] Received: { type: '...', ... }
```
Se não aparecer, o backend não está enviando mensagens.

3. **URL do WebSocket está correta?**
Deve ser: `ws://localhost:8000/games`

## Soluções Baseadas nos Logs

### Se não recebe MULTIPLIER_UPDATE:
**Problema**: Backend não está enviando updates
**Solução**: Verificar o backend (serviço de games)

### Se recebe valores < 1.0:
**Problema**: Backend está calculando multiplicador errado
**Solução**: Verificar cálculo do multiplicador no backend

### Se crashPoint sempre é 1.00:
**Problema**: Backend está crashando imediatamente
**Solução**: Verificar algoritmo Provably Fair no backend

### Se multiplier oscila:
**Problema**: Backend está enviando valores antigos
**Solução**: Verificar timestamp das mensagens no backend

## Comandos Úteis no Console

### Ver estado atual do jogo:
```javascript
// No console do navegador
window.__GAME_STATE__ = {
  multiplier: useGameStore.getState().currentMultiplier,
  roundState: useGameStore.getState().roundState,
  playerBet: useGameStore.getState().playerBet
};
console.log(window.__GAME_STATE__);
```

### Forçar multiplicador (TESTE):
```javascript
// No console do navegador
useGameStore.getState().setMultiplier(5.50);
```

### Ver conexão WebSocket:
```javascript
// No console do navegador
console.log('WebSocket connected:', websocketService.isConnected());
```

## Próximos Passos

1. ✅ **Abra o console** (F12)
2. ✅ **Inicie um round**
3. ✅ **Copie TODOS os logs** que aparecerem
4. ✅ **Envie os logs** para análise

Com os logs, podemos identificar exatamente onde está o problema:
- Frontend não recebendo mensagens?
- Backend enviando valores errados?
- WebSocket desconectando?

## Teste Rápido

Execute este código no console do navegador:
```javascript
// Teste 1: WebSocket conectado?
console.log('WebSocket:', websocketService.isConnected() ? '✅ Conectado' : '❌ Desconectado');

// Teste 2: Estado atual
const state = useGameStore.getState();
console.log('Estado:', {
  multiplier: state.currentMultiplier,
  roundState: state.roundState,
  hasPlayerBet: !!state.playerBet
});

// Teste 3: Forçar update
console.log('Forçando multiplier para 3.50...');
state.setMultiplier(3.50);
console.log('Novo multiplier:', useGameStore.getState().currentMultiplier);
```

Se o teste 3 funcionar (multiplier muda para 3.50), o problema é no WebSocket/Backend.
Se não funcionar, o problema é no frontend.
