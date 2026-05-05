import DOMPurify from 'dompurify';

/**
 * Security utilities for input sanitization and validation
 * Requirement 3.2.2: Validate all user input to prevent XSS attacks
 */

/**
 * Configuration for DOMPurify sanitization
 */
const SANITIZE_CONFIG = {
  // Allow only safe HTML tags and attributes
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span'],
  ALLOWED_ATTR: ['class'],
  // Remove all scripts and event handlers
  FORBID_TAGS: ['script', 'object', 'embed', 'form', 'input'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
  // Keep content safe
  KEEP_CONTENT: false,
  // Return DOM instead of string for better performance
  RETURN_DOM: false,
  // Return trusted types if supported
  RETURN_TRUSTED_TYPE: true,
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html - Raw HTML string to sanitize
 * @returns Sanitized HTML string safe for rendering
 */
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
};

/**
 * Sanitize plain text input to prevent XSS
 * Escapes HTML entities and removes potentially dangerous characters
 * @param text - Raw text input to sanitize
 * @returns Sanitized text safe for display
 */
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Remove any HTML tags and escape entities
  return DOMPurify.sanitize(text, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
};

/**
 * Sanitize user input for form fields
 * Removes dangerous characters while preserving valid input
 * @param input - Raw form input to sanitize
 * @returns Sanitized input safe for processing
 */
export const sanitizeFormInput = (input: string): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove script tags, event handlers, and other dangerous content
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, '');

  // Use DOMPurify for additional sanitization
  sanitized = DOMPurify.sanitize(sanitized, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });

  return sanitized.trim();
};

/**
 * Validate and sanitize numeric input
 * @param input - Raw numeric input
 * @param options - Validation options
 * @returns Sanitized numeric value or null if invalid
 */
export const sanitizeNumericInput = (
  input: string | number,
  options: {
    min?: number;
    max?: number;
    allowDecimals?: boolean;
    allowNegative?: boolean;
  } = {}
): number | null => {
  const { min, max, allowDecimals = true, allowNegative = false } = options;

  if (input === null || input === undefined || input === '') {
    return null;
  }

  // Convert to string and sanitize
  const sanitized = sanitizeText(String(input));
  
  // Remove non-numeric characters (except decimal point and minus sign)
  let cleaned = sanitized.replace(/[^\d.-]/g, '');

  // Handle decimal points
  if (!allowDecimals) {
    cleaned = cleaned.replace(/\./g, '');
  } else {
    // Allow only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
  }

  // Handle negative numbers
  if (!allowNegative) {
    cleaned = cleaned.replace(/-/g, '');
  } else {
    // Allow only one minus sign at the beginning
    const minusCount = (cleaned.match(/-/g) || []).length;
    if (minusCount > 1 || (cleaned.includes('-') && !cleaned.startsWith('-'))) {
      cleaned = cleaned.replace(/-/g, '');
    }
  }

  const numValue = parseFloat(cleaned);

  // Check if it's a valid number
  if (isNaN(numValue)) {
    return null;
  }

  // Apply min/max constraints
  if (min !== undefined && numValue < min) {
    return null;
  }
  if (max !== undefined && numValue > max) {
    return null;
  }

  return numValue;
};

/**
 * Sanitize URL to prevent XSS and ensure it's safe
 * @param url - Raw URL to sanitize
 * @returns Sanitized URL or null if invalid/unsafe
 */
export const sanitizeUrl = (url: string): string | null => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const sanitized = sanitizeText(url.trim());

  // Check for dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
  const lowerUrl = sanitized.toLowerCase();
  
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      return null;
    }
  }

  // Allow only HTTP, HTTPS, and relative URLs
  if (sanitized.startsWith('//') || 
      sanitized.startsWith('http://') || 
      sanitized.startsWith('https://') ||
      sanitized.startsWith('/') ||
      !sanitized.includes(':')) {
    return sanitized;
  }

  return null;
};

/**
 * Sanitize CSS values to prevent CSS injection attacks
 * @param css - Raw CSS value to sanitize
 * @returns Sanitized CSS value or empty string if unsafe
 */
export const sanitizeCss = (css: string): string => {
  if (!css || typeof css !== 'string') {
    return '';
  }

  // Remove dangerous CSS functions and properties
  const dangerous = [
    'expression',
    'javascript:',
    'vbscript:',
    'data:',
    '@import',
    'behavior:',
    '-moz-binding',
  ];

  let sanitized = css.toLowerCase();
  
  for (const danger of dangerous) {
    if (sanitized.includes(danger)) {
      return '';
    }
  }

  return DOMPurify.sanitize(css, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
};

/**
 * Rate limiting utility for client-side request throttling
 * Requirement 3.2.4: Implement rate limiting on client side
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private limits: Map<string, { count: number; window: number }> = new Map();

  /**
   * Set rate limit for a specific key
   * @param key - Identifier for the rate limit (e.g., 'bet-placement', 'api-calls')
   * @param count - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds
   */
  setLimit(key: string, count: number, windowMs: number): void {
    this.limits.set(key, { count, window: windowMs });
  }

  /**
   * Check if request is allowed under rate limit
   * @param key - Rate limit identifier
   * @returns true if request is allowed, false if rate limited
   */
  isAllowed(key: string): boolean {
    const limit = this.limits.get(key);
    if (!limit) {
      return true; // No limit set, allow request
    }

    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < limit.window);
    
    // Check if we're under the limit
    if (validRequests.length >= limit.count) {
      return false;
    }

    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  /**
   * Get remaining requests for a key
   * @param key - Rate limit identifier
   * @returns Number of remaining requests
   */
  getRemaining(key: string): number {
    const limit = this.limits.get(key);
    if (!limit) {
      return Infinity;
    }

    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(time => now - time < limit.window);
    
    return Math.max(0, limit.count - validRequests.length);
  }

  /**
   * Get time until next request is allowed
   * @param key - Rate limit identifier
   * @returns Milliseconds until next request is allowed, or 0 if allowed now
   */
  getTimeUntilReset(key: string): number {
    const limit = this.limits.get(key);
    if (!limit) {
      return 0;
    }

    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    if (requests.length < limit.count) {
      return 0;
    }

    const oldestRequest = Math.min(...requests);
    return Math.max(0, limit.window - (now - oldestRequest));
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.requests.clear();
  }

  /**
   * Clear rate limit data for a specific key
   * @param key - Rate limit identifier to clear
   */
  clearKey(key: string): void {
    this.requests.delete(key);
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();

// Set default rate limits
rateLimiter.setLimit('bet-placement', 1, 1000); // 1 bet per second
rateLimiter.setLimit('api-calls', 10, 1000); // 10 API calls per second
rateLimiter.setLimit('websocket-messages', 5, 1000); // 5 WebSocket messages per second

/**
 * CSRF token utilities
 * Requirement 3.2.3: Implement CSRF protection
 */
export class CSRFProtection {
  private static token: string | null = null;

  /**
   * Generate a new CSRF token
   * @returns Generated CSRF token
   */
  static generateToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    const token = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    this.token = token;
    
    // Store in sessionStorage for persistence across page reloads
    sessionStorage.setItem('csrf-token', token);
    
    return token;
  }

  /**
   * Get current CSRF token
   * @returns Current CSRF token or generates new one if none exists
   */
  static getToken(): string {
    if (!this.token) {
      // Try to get from sessionStorage first
      const stored = sessionStorage.getItem('csrf-token');
      if (stored) {
        this.token = stored;
        return stored;
      }
      
      // Generate new token if none exists
      return this.generateToken();
    }
    
    return this.token;
  }

  /**
   * Validate CSRF token
   * @param token - Token to validate
   * @returns true if token is valid
   */
  static validateToken(token: string): boolean {
    const currentToken = this.getToken();
    return token === currentToken;
  }

  /**
   * Clear CSRF token
   */
  static clearToken(): void {
    this.token = null;
    sessionStorage.removeItem('csrf-token');
  }
}

/**
 * Content Security Policy utilities
 * Requirement 3.2.4: Implement Content Security Policy headers
 */
export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'", // Required for Vite in development
    'https://cdn.jsdelivr.net', // For external libraries if needed
  ],
  'style-src': [
    "'self'",
    "'unsafe-inline'", // Required for CSS-in-JS and Tailwind
  ],
  'img-src': [
    "'self'",
    'data:', // For base64 images
    'https:', // For external images
  ],
  'font-src': [
    "'self'",
    'data:', // For base64 fonts
  ],
  'connect-src': [
    "'self'",
    'ws:', // For WebSocket connections in development
    'wss:', // For secure WebSocket connections
    'http://localhost:*',
    import.meta.env.VITE_API_URL || 'http://localhost:4001',
    import.meta.env.VITE_WALLET_API_URL || 'http://localhost:4002',
    import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080',
  ],
  'media-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'frame-ancestors': ["'none'"],
};

/**
 * Generate CSP header value
 * @returns CSP header value string
 */
export const generateCSPHeader = (): string => {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
};

/**
 * Apply CSP meta tag to document head
 */
export const applyCSP = (): void => {
  // Remove existing CSP meta tag if present
  const existing = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (existing) {
    existing.remove();
  }

  // Create new CSP meta tag
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = generateCSPHeader();
  document.head.appendChild(meta);
};

/**
 * Security validation for user inputs
 */
export const validateInput = {
  /**
   * Validate email format
   */
  email: (email: string): boolean => {
    const sanitized = sanitizeText(email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(sanitized);
  },

  /**
   * Validate bet amount
   */
  betAmount: (amount: string | number): { isValid: boolean; sanitized: number | null; error?: string } => {
    const sanitized = sanitizeNumericInput(amount, {
      min: 0, // Don't enforce min/max in sanitization, check separately
      max: Infinity,
      allowDecimals: true,
      allowNegative: false,
    });

    if (sanitized === null) {
      return {
        isValid: false,
        sanitized: null,
        error: 'Invalid amount format',
      };
    }

    if (sanitized < 100) {
      return {
        isValid: false,
        sanitized,
        error: 'Minimum bet is R$ 1.00',
      };
    }

    if (sanitized > 100000) {
      return {
        isValid: false,
        sanitized,
        error: 'Maximum bet is R$ 1.000,00',
      };
    }

    return {
      isValid: true,
      sanitized,
    };
  },

  /**
   * Validate player ID format
   */
  playerId: (id: string): boolean => {
    const sanitized = sanitizeText(id);
    // UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(sanitized);
  },
};