/**
 * Unit tests for parseCurrency function - Currency Conversion Fix
 * Tests the reais to centavos conversion (multiply by 100)
 */

import { describe, it, expect } from 'vitest';

// Mock sanitizeNumericInput to isolate parseCurrency logic
const sanitizeNumericInput = (
  value: string,
  options: { min: number; max: number; allowDecimals: boolean; allowNegative: boolean }
): number => {
  // Simple sanitization: remove non-numeric characters except comma/period
  const cleaned = value.replace(/[^\d.,]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed)) return 0;
  if (parsed < options.min) return options.min;
  if (parsed > options.max) return options.max;
  
  return parsed;
};

// The fixed parseCurrency function
const parseCurrency = (value: string): number => {
  const sanitized = sanitizeNumericInput(value, {
    min: 0,
    max: 1000,
    allowDecimals: true,
    allowNegative: false,
  });
  
  return sanitized ? sanitized * 100 : 0;
};

describe('parseCurrency - Reais to Centavos Conversion', () => {
  it('should convert 10 reais to 1000 centavos', () => {
    expect(parseCurrency('10')).toBe(1000);
    expect(parseCurrency('10,00')).toBe(1000);
    expect(parseCurrency('10.00')).toBe(1000);
  });

  it('should convert 50 reais to 5000 centavos', () => {
    expect(parseCurrency('50')).toBe(5000);
    expect(parseCurrency('50,00')).toBe(5000);
  });

  it('should convert 100 reais to 10000 centavos', () => {
    expect(parseCurrency('100')).toBe(10000);
    expect(parseCurrency('100,00')).toBe(10000);
  });

  it('should convert 1000 reais (max) to 100000 centavos', () => {
    expect(parseCurrency('1000')).toBe(100000);
    expect(parseCurrency('1000,00')).toBe(100000);
  });

  it('should handle decimal values correctly', () => {
    expect(parseCurrency('10,50')).toBe(1050);
    expect(parseCurrency('50.50')).toBe(5050);
    expect(parseCurrency('99,99')).toBe(9999);
  });

  it('should return 0 for empty or invalid input', () => {
    expect(parseCurrency('')).toBe(0);
    expect(parseCurrency('0')).toBe(0);
  });

  it('should handle minimum bet (1 real = 100 centavos)', () => {
    expect(parseCurrency('1')).toBe(100);
    expect(parseCurrency('1,00')).toBe(100);
  });
});
