import { describe, it, expect } from 'vitest';
import { formatCurrency, parseCurrency, maskPhone } from './format';

describe('formatCurrency', () => {
  it('should format BRL', () => {
    expect(formatCurrency(1000)).toBe('R$ 1.000,00');
  });

  it('should format zero', () => {
    expect(formatCurrency(0)).toBe('R$ 0,00');
  });
});

describe('parseCurrency', () => {
  it('should parse R$ string', () => {
    expect(parseCurrency('R$ 1.000,50')).toBe(1000.5);
  });

  it('should throw for invalid string', () => {
    expect(() => parseCurrency('abc')).toThrow();
  });
});

describe('maskPhone', () => {
  it('should mask with DDD', () => {
    expect(maskPhone('11999999999')).toBe('(11) 99999-9999');
  });

  it('should handle partial input', () => {
    expect(maskPhone('11')).toBe('(11) ');
  });
});
