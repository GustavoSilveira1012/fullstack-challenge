/**
 * Security middleware for additional client-side protection
 * Requirement 3.2.1, 3.2.2, 3.2.3, 3.2.4: Comprehensive security implementation
 */

import { sanitizeText, rateLimiter, CSRFProtection } from './security';

/**
 * Initialize security middleware
 */
export const initializeSecurity = (): void => {
  // Initialize CSRF protection
  CSRFProtection.generateToken();
  
  // Set up security event listeners
  setupSecurityEventListeners();
  
  // Initialize rate limiters with appropriate limits
  setupRateLimits();
  
  // Set up security monitoring
  setupSecurityMonitoring();
  
  console.log('[Security] Security middleware initialized');
};

/**
 * Set up security event listeners
 */
const setupSecurityEventListeners = (): void => {
  // Prevent right-click context menu in production (optional)
  if (import.meta.env.PROD) {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
  }
  
  // Prevent F12 and other developer tools shortcuts in production (optional)
  if (import.meta.env.PROD) {
    document.addEventListener('keydown', (e) => {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
      }
    });
  }
  
  // Monitor for potential XSS attempts
  window.addEventListener('error', (event) => {
    const error = event.error;
    if (error && error.message) {
      const message = sanitizeText(error.message.toLowerCase());
      
      // Check for common XSS patterns
      const xssPatterns = [
        'script',
        'javascript:',
        'onerror',
        'onload',
        'eval(',
        'document.cookie',
        'document.write',
      ];
      
      for (const pattern of xssPatterns) {
        if (message.includes(pattern)) {
          console.warn('[Security] Potential XSS attempt detected:', pattern);
          // Could send to monitoring service here
          break;
        }
      }
    }
  });
  
  // Monitor for console access attempts
  let devtools = { open: false, orientation: null };
  const threshold = 160;
  
  setInterval(() => {
    if (
      window.outerHeight - window.innerHeight > threshold ||
      window.outerWidth - window.innerWidth > threshold
    ) {
      if (!devtools.open) {
        devtools.open = true;
        console.warn('[Security] Developer tools opened');
      }
    } else {
      devtools.open = false;
    }
  }, 500);
};

/**
 * Set up rate limits for different operations
 */
const setupRateLimits = (): void => {
  // Betting operations - 1 per second
  rateLimiter.setLimit('bet-placement', 1, 1000);
  
  // Cash out operations - 1 per second
  rateLimiter.setLimit('cash-out', 1, 1000);
  
  // API calls - 10 per second
  rateLimiter.setLimit('api-calls', 10, 1000);
  
  // WebSocket messages - 5 per second
  rateLimiter.setLimit('websocket-messages', 5, 1000);
  
  // Form submissions - 3 per 10 seconds
  rateLimiter.setLimit('form-submission', 3, 10000);
  
  // Login attempts - 5 per minute
  rateLimiter.setLimit('login-attempts', 5, 60000);
};

/**
 * Set up security monitoring
 */
const setupSecurityMonitoring = (): void => {
  // Monitor for suspicious activity patterns
  let suspiciousActivityCount = 0;
  const maxSuspiciousActivity = 10;
  
  // Monitor rapid successive API calls
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    const url = args[0] as string;
    
    // Check if this looks like an attack pattern
    if (typeof url === 'string') {
      const suspiciousPatterns = [
        'javascript:',
        'data:text/html',
        '<script',
        'eval(',
        'document.cookie',
      ];
      
      for (const pattern of suspiciousPatterns) {
        if (url.includes(pattern)) {
          suspiciousActivityCount++;
          console.warn('[Security] Suspicious fetch attempt:', pattern);
          
          if (suspiciousActivityCount >= maxSuspiciousActivity) {
            console.error('[Security] Too many suspicious activities detected');
            // Could implement additional security measures here
          }
          
          throw new Error('Blocked suspicious request');
        }
      }
    }
    
    return originalFetch.apply(this, args);
  };
  
  // Monitor for DOM manipulation attempts
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Check for suspicious script tags
            if (element.tagName === 'SCRIPT') {
              const src = element.getAttribute('src');
              const content = element.textContent;
              
              if (src && !src.startsWith(window.location.origin)) {
                console.warn('[Security] External script injection attempt:', src);
                element.remove();
              }
              
              if (content && content.includes('eval(')) {
                console.warn('[Security] Suspicious script content detected');
                element.remove();
              }
            }
            
            // Check for suspicious iframes
            if (element.tagName === 'IFRAME') {
              const src = element.getAttribute('src');
              if (src && !src.startsWith(window.location.origin)) {
                console.warn('[Security] External iframe injection attempt:', src);
                element.remove();
              }
            }
          }
        });
      }
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

/**
 * Validate session integrity
 */
export const validateSession = (): boolean => {
  try {
    // Check if CSRF token exists and is valid
    const csrfToken = CSRFProtection.getToken();
    if (!csrfToken || csrfToken.length < 32) {
      console.warn('[Security] Invalid CSRF token');
      return false;
    }
    
    // Check if session storage is accessible
    try {
      sessionStorage.setItem('security-test', 'test');
      sessionStorage.removeItem('security-test');
    } catch (error) {
      console.warn('[Security] Session storage not accessible');
      return false;
    }
    
    // Check if local storage is accessible
    try {
      localStorage.setItem('security-test', 'test');
      localStorage.removeItem('security-test');
    } catch (error) {
      console.warn('[Security] Local storage not accessible');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[Security] Session validation failed:', error);
    return false;
  }
};

/**
 * Clean up security resources
 */
export const cleanupSecurity = (): void => {
  // Clear rate limiter data
  rateLimiter.clear();
  
  // Clear CSRF token
  CSRFProtection.clearToken();
  
  console.log('[Security] Security cleanup completed');
};

/**
 * Security health check
 */
export const securityHealthCheck = (): {
  status: 'healthy' | 'warning' | 'critical';
  issues: string[];
} => {
  const issues: string[] = [];
  
  // Check HTTPS in production
  if (import.meta.env.PROD && window.location.protocol !== 'https:') {
    issues.push('Not using HTTPS in production');
  }
  
  // Check CSP
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (!cspMeta) {
    issues.push('Content Security Policy not found');
  }
  
  // Check for mixed content
  if (window.location.protocol === 'https:') {
    const insecureElements = document.querySelectorAll('[src^="http:"], [href^="http:"]');
    if (insecureElements.length > 0) {
      issues.push(`Found ${insecureElements.length} insecure resources`);
    }
  }
  
  // Check session integrity
  if (!validateSession()) {
    issues.push('Session integrity check failed');
  }
  
  // Determine status
  let status: 'healthy' | 'warning' | 'critical' = 'healthy';
  if (issues.length > 0) {
    status = issues.some(issue => 
      issue.includes('HTTPS') || 
      issue.includes('Session integrity')
    ) ? 'critical' : 'warning';
  }
  
  return { status, issues };
};

/**
 * Report security metrics
 */
export const getSecurityMetrics = () => {
  return {
    rateLimits: {
      betPlacement: rateLimiter.getRemaining('bet-placement'),
      apiCalls: rateLimiter.getRemaining('api-calls'),
      webSocketMessages: rateLimiter.getRemaining('websocket-messages'),
    },
    csrf: {
      tokenExists: !!CSRFProtection.getToken(),
    },
    session: {
      isValid: validateSession(),
    },
    healthCheck: securityHealthCheck(),
  };
};