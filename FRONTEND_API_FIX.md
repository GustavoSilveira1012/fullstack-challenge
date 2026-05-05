# Correção - Frontend Acessando APIs Diretamente ❌→✅

## 🐛 Problema Identificado

O frontend estava tentando acessar **diretamente** as portas dos serviços ao invés de usar o Kong (API Gateway):

### Erros no Console:
```
GET http://localhost:4002/wallets/me net::ERR_CONNECTION_REFUSED
GET http://localhost:4001/games/rounds/current net::ERR_CONNECTION_REFUSED
```

### Causa Raiz:
As variáveis de ambiente do frontend estavam configuradas com as portas diretas dos serviços:
- `VITE_API_URL=http://localhost:4001` ❌ (porta do Game Service)
- `VITE_WALLET_API_URL=http://localhost:4002` ❌ (porta do Wallet Service)

Mas os serviços **não estão expostos diretamente** - eles só são acessíveis através do Kong na porta 8000.

---

## ✅ Solução Aplicada

### 1. Corrigido `.env.development`

**Antes**:
```env
VITE_API_URL=http://localhost:4001
VITE_WALLET_API_URL=http://localhost:4002
VITE_WS_URL=ws://localhost:4001
```

**Depois**:
```env
VITE_API_URL=http://localhost:8000
VITE_WALLET_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

### 2. Corrigido `.env.example`

Atualizado para refletir a configuração correta via Kong.

---

## 🚀 Como Aplicar a Correção

### Opção 1: Desenvolvimento Local (npm run dev)

Se você está rodando o frontend localmente com `npm run dev`:

```bash
# 1. Parar o servidor (Ctrl+C)

# 2. Reiniciar o servidor
cd fullstack-challenge/frontend
npm run dev
```

**Importante**: O Vite carrega as variáveis de ambiente apenas no **início**. Você **DEVE** reiniciar o servidor para que as mudanças tenham efeito.

### Opção 2: Docker

Se você está rodando via Docker:

```bash
cd fullstack-challenge

# Rebuild do frontend
docker-compose build frontend

# Restart do frontend
docker-compose up -d frontend
```

---

## 🧪 Testar a Correção

Após reiniciar o frontend, abra o DevTools (F12) e verifique a aba **Network**:

### Antes (Errado) ❌:
```
GET http://localhost:4001/games/rounds/current - ERR_CONNECTION_REFUSED
GET http://localhost:4002/wallets/me - ERR_CONNECTION_REFUSED
```

### Depois (Correto) ✅:
```
GET http://localhost:8000/games/rounds/current - 200 OK
GET http://localhost:8000/wallets/me - 200 OK (ou 401 se não autenticado)
```

---

## 📊 Arquitetura Correta

```
Frontend (localhost:3000 ou 5173)
    ↓
    | HTTP: http://localhost:8000/games/*
    | HTTP: http://localhost:8000/wallets/*
    | WS: ws://localhost:8000/games/ws
    ↓
Kong API Gateway (localhost:8000)
    ↓
    | /games/* → games:4001
    | /wallets/* → wallets:4002
    ↓
Game Service (4001) + Wallet Service (4002)
```

**Importante**: O frontend **NUNCA** deve acessar diretamente as portas 4001 ou 4002. Sempre use a porta 8000 (Kong).

---

## 🔍 Verificar Configuração

### 1. Verificar variáveis de ambiente carregadas

No console do browser (F12), execute:

```javascript
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('Wallet API URL:', import.meta.env.VITE_WALLET_API_URL);
console.log('WS URL:', import.meta.env.VITE_WS_URL);
```

**Resultado esperado**:
```
API URL: http://localhost:8000
Wallet API URL: http://localhost:8000
WS URL: ws://localhost:8000
```

### 2. Verificar requisições no Network

1. Abra DevTools (F12)
2. Vá na aba **Network**
3. Recarregue a página
4. Verifique se as requisições estão indo para `localhost:8000`

---

## 🐛 Troubleshooting

### Problema: Ainda aparece erro "ERR_CONNECTION_REFUSED"

**Causa**: Servidor não foi reiniciado ou variáveis não foram carregadas.

**Solução**:
1. **Pare completamente** o servidor (Ctrl+C)
2. **Limpe o cache** do Vite: `rm -rf node_modules/.vite`
3. **Reinicie**: `npm run dev`
4. **Force refresh** no browser (Ctrl+Shift+R)

### Problema: Requisições ainda vão para 4001/4002

**Causa**: Browser está usando cache ou variáveis antigas.

**Solução**:
1. **Hard refresh** no browser (Ctrl+Shift+R)
2. **Limpar cache** do browser
3. **Abrir em aba anônima** para testar

### Problema: "404 Not Found" no Kong

**Causa**: Kong não está roteando corretamente ou serviços não estão rodando.

**Solução**:
```bash
# Verificar se Kong está rodando
curl http://localhost:8001/services

# Verificar se serviços estão rodando
docker-compose ps

# Ver logs do Kong
docker-compose logs kong

# Restart do Kong
docker-compose restart kong
```

### Problema: CORS errors

**Causa**: Kong ou serviços não estão configurados para aceitar requisições do frontend.

**Solução**: Já está configurado! Os serviços têm CORS habilitado em `main.ts`:
```typescript
app.enableCors({
  origin: true,
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['*'],
});
```

---

## ✅ Checklist de Verificação

Após aplicar a correção:

- [ ] `.env.development` atualizado com `VITE_API_URL=http://localhost:8000`
- [ ] `.env.development` atualizado com `VITE_WALLET_API_URL=http://localhost:8000`
- [ ] `.env.development` atualizado com `VITE_WS_URL=ws://localhost:8000`
- [ ] Servidor frontend reiniciado (Ctrl+C + npm run dev)
- [ ] Browser com hard refresh (Ctrl+Shift+R)
- [ ] DevTools Network mostra requisições para `localhost:8000`
- [ ] Não há mais erros "ERR_CONNECTION_REFUSED"
- [ ] APIs respondem (200 OK ou 401 Unauthorized)

---

## 📝 Resumo

### O que estava errado:
- Frontend tentando acessar `localhost:4001` e `localhost:4002` diretamente
- Essas portas não estão expostas/acessíveis

### O que foi corrigido:
- Frontend agora acessa `localhost:8000` (Kong)
- Kong roteia para os serviços corretos

### O que você precisa fazer:
1. **Reiniciar o servidor frontend** (Ctrl+C + npm run dev)
2. **Hard refresh no browser** (Ctrl+Shift+R)
3. **Verificar no DevTools** que as requisições vão para porta 8000

---

**Última atualização**: 2026-05-05

**Status**: ✅ Correção aplicada, aguardando restart do frontend
