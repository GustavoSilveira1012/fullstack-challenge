import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
// import { register as registerSW } from './utils/serviceWorker';
// import { applyCSP } from './utils/security';
// import { initializeSecurity } from './utils/securityMiddleware';
// import { initSentry } from './config/sentry';

// Temporarily disable security and monitoring for debugging
console.log('Starting app in debug mode - security features disabled');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
