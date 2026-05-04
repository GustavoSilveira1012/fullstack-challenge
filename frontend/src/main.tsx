import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { register as registerSW } from './utils/serviceWorker';
import { applyCSP } from './utils/security';
import { initializeSecurity } from './utils/securityMiddleware';

// Apply Content Security Policy
// Requirement 3.2.4: Implement Content Security Policy headers
applyCSP();

// Initialize security middleware
// Requirement 3.2.1, 3.2.2, 3.2.3, 3.2.4: Comprehensive security implementation
initializeSecurity();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Register service worker for performance optimization
if (import.meta.env.PROD) {
  registerSW({
    onSuccess: () => {
      console.log('App is cached and ready for offline use');
    },
    onUpdate: () => {
      console.log('New content is available; please refresh');
    },
    onOfflineReady: () => {
      console.log('App is ready to work offline');
    },
    onNeedRefresh: () => {
      // Could show a toast notification here
      console.log('New version available, please refresh');
    },
  });
}
