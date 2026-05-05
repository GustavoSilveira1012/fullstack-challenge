// Service Worker completamente desabilitado
console.log('[SW] Service worker disabled');

// Não interceptar nenhuma requisição
self.addEventListener('fetch', (event) => {
  // Deixar todas as requisições passarem normalmente
  return;
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});