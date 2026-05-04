import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  sanitizeHtml,
  sanitizeText,
  sanitizeFormInput,
  sanitizeNumericInput,
  sanitizeUrl,
  sanitizeCss,
  rateLimiter,
  CSRFProtection,
  validateInput,
  generateCSPHeader,
} from '../security';

describe('Security Utilities', () => {
  beforeEach(() => {
    // Clear rate limiter before each test
    rateLimiter.clear();
    // Clear CSRF token
    CSRFProtection.clearToken();
  });

  describe('sanitizeHtml', () => {
    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("xss")</script>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('<p>Hello</p>');
    });

    it('should remove event handlers', () => {
      const input = '<div onclick="alert(\'xss\')">Click me</div>';
      const result = sanitizeHtml(input);
      expect(result).not.toContain('onclick');
    });

    it('should handle empty input', () => {
      expect(sanitizeHtml('')).toBe('');
      expect(sanitizeHtml(null as any)).toBe('');
      expect(sanitizeHtml(undefined as any)).toBe('');
    });
  });

  describe('sanitizeText', () => {
    it('should escape HTML entities', () => {
      const input = '<script>alert("xss")</script>';
      const result = sanitizeText(input);
      expect(result).not.toContain('<script>');
    });

    it('should preserve plain text', () => {
      const input = 'Hello World';
      const result = sanitizeText(input);
      expect(result).toBe('Hello World');
    });
  });

  describe('sanitizeFormInput', () => {
    it('should remove dangerous content', () => {
      const input = 'Hello<script>alert("xss")</script>World';
      const result = sanitizeFormInput(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('HelloWorld');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert("xss")';
      const result = sanitizeFormInput(input);
      expect(result).not.toContain('javascript:');
    });
  });

  describe('sanitizeNumericInput', () => {
    it('should parse valid numbers', () => {
      expect(sanitizeNumericInput('123')).toBe(123);
      expect(sanitizeNumericInput('123.45')).toBe(123.45);
      expect(sanitizeNumericInput(456)).toBe(456);
    });

    it('should handle invalid input', () => {
      expect(sanitizeNumericInput('abc')).toBeNull();
      expect(sanitizeNumericInput('')).toBeNull();
      expect(sanitizeNumericInput(null)).toBeNull();
    });

    it('should respect min/max constraints', () => {
      expect(sanitizeNumericInput('50', { min: 100 })).toBeNull();
      expect(sanitizeNumericInput('200', { max: 100 })).toBeNull();
      expect(sanitizeNumericInput('150', { min: 100, max: 200 })).toBe(150);
    });

    it('should handle decimal restrictions', () => {
      expect(sanitizeNumericInput('123.45', { allowDecimals: false })).toBe(12345);
    });

    it('should handle negative number restrictions', () => {
      expect(sanitizeNumericInput('-123', { allowNegative: false })).toBe(123);
      expect(sanitizeNumericInput('-123', { allowNegative: true })).toBe(-123);
    });
  });

  describe('sanitizeUrl', () => {
    it('should allow safe URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
      expect(sanitizeUrl('/relative/path')).toBe('/relative/path');
    });

    it('should block dangerous protocols', () => {
      expect(sanitizeUrl('javascript:alert("xss")')).toBeNull();
      expect(sanitizeUrl('data:text/html,<script>alert("xss")</script>')).toBeNull();
      expect(sanitizeUrl('vbscript:alert("xss")')).toBeNull();
    });

    it('should handle invalid input', () => {
      expect(sanitizeUrl('')).toBeNull();
      expect(sanitizeUrl(null as any)).toBeNull();
    });
  });

  describe('sanitizeCss', () => {
    it('should allow safe CSS', () => {
      const input = 'color: red; background: blue;';
      const result = sanitizeCss(input);
      expect(result).toBe(input);
    });

    it('should block dangerous CSS', () => {
      expect(sanitizeCss('expression(alert("xss"))')).toBe('');
      expect(sanitizeCss('javascript:alert("xss")')).toBe('');
      expect(sanitizeCss('behavior: url(xss.htc)')).toBe('');
    });
  });

  describe('RateLimiter', () => {
    it('should allow requests within limit', () => {
      rateLimiter.setLimit('test', 5, 1000);
      
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.isAllowed('test')).toBe(true);
      }
    });

    it('should block requests over limit', () => {
      rateLimiter.setLimit('test', 2, 1000);
      
      expect(rateLimiter.isAllowed('test')).toBe(true);
      expect(rateLimiter.isAllowed('test')).toBe(true);
      expect(rateLimiter.isAllowed('test')).toBe(false);
    });

    it('should reset after time window', async () => {
      rateLimiter.setLimit('test', 1, 100); // 100ms window
      
      expect(rateLimiter.isAllowed('test')).toBe(true);
      expect(rateLimiter.isAllowed('test')).toBe(false);
      
      // Wait for window to reset
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(rateLimiter.isAllowed('test')).toBe(true);
    });

    it('should track remaining requests', () => {
      rateLimiter.setLimit('test', 3, 1000);
      
      expect(rateLimiter.getRemaining('test')).toBe(3);
      rateLimiter.isAllowed('test');
      expect(rateLimiter.getRemaining('test')).toBe(2);
    });

    it('should calculate time until reset', () => {
      rateLimiter.setLimit('test', 1, 1000);
      
      rateLimiter.isAllowed('test'); // Use up the limit
      const timeUntilReset = rateLimiter.getTimeUntilReset('test');
      
      expect(timeUntilReset).toBeGreaterThan(0);
      expect(timeUntilReset).toBeLessThanOrEqual(1000);
    });
  });

  describe('CSRFProtection', () => {
    it('should generate valid tokens', () => {
      const token = CSRFProtection.generateToken();
      expect(token).toBeDefined();
      expect(token.length).toBe(64); // 32 bytes * 2 (hex)
    });

    it('should validate tokens correctly', () => {
      const token = CSRFProtection.generateToken();
      expect(CSRFProtection.validateToken(token)).toBe(true);
      expect(CSRFProtection.validateToken('invalid')).toBe(false);
    });

    it('should persist tokens in session storage', () => {
      const mockSessionStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      };
      
      Object.defineProperty(window, 'sessionStorage', {
        value: mockSessionStorage,
        writable: true,
      });

      CSRFProtection.generateToken();
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('csrf-token', expect.any(String));
    });
  });

  describe('validateInput', () => {
    describe('email', () => {
      it('should validate correct emails', () => {
        expect(validateInput.email('test@example.com')).toBe(true);
        expect(validateInput.email('user.name+tag@domain.co.uk')).toBe(true);
      });

      it('should reject invalid emails', () => {
        expect(validateInput.email('invalid')).toBe(false);
        expect(validateInput.email('test@')).toBe(false);
        expect(validateInput.email('@example.com')).toBe(false);
      });
    });

    describe('betAmount', () => {
      it('should validate correct bet amounts', () => {
        const result = validateInput.betAmount('10.00');
        expect(result.isValid).toBe(true);
        expect(result.sanitized).toBe(1000); // 10.00 * 100 centavos
      });

      it('should reject amounts below minimum', () => {
        const result = validateInput.betAmount('0.50');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Minimum bet');
      });

      it('should reject amounts above maximum', () => {
        const result = validateInput.betAmount('2000.00');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Maximum bet');
      });

      it('should handle invalid formats', () => {
        const result = validateInput.betAmount('abc');
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Invalid amount');
      });
    });

    describe('playerId', () => {
      it('should validate correct UUIDs', () => {
        expect(validateInput.playerId('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
      });

      it('should reject invalid UUIDs', () => {
        expect(validateInput.playerId('invalid-uuid')).toBe(false);
        expect(validateInput.playerId('123')).toBe(false);
      });
    });
  });

  describe('generateCSPHeader', () => {
    it('should generate valid CSP header', () => {
      const csp = generateCSPHeader();
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain("object-src 'none'");
      expect(csp).toContain("base-uri 'self'");
    });

    it('should include all required directives', () => {
      const csp = generateCSPHeader();
      const requiredDirectives = [
        'default-src',
        'script-src',
        'style-src',
        'img-src',
        'font-src',
        'connect-src',
        'media-src',
        'object-src',
        'base-uri',
        'form-action',
        'frame-ancestors',
      ];

      requiredDirectives.forEach(directive => {
        expect(csp).toContain(directive);
      });
    });
  });
});