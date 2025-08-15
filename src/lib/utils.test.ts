import { formatCurrency, formatDate, safeParseInt } from '@/lib/utils'

describe('utils', () => {
  test('formatCurrency returns Korean Won currency string', () => {
    const s = formatCurrency(123456);
    expect(typeof s).toBe('string');
    expect(s).toMatch(/[₩￦]/); // won symbol
  });

  test('formatDate returns human-readable date', () => {
    const s = formatDate('2025-01-02');
    expect(s).not.toBe('날짜 오류');
  });

  test('safeParseInt handles invalid inputs with default', () => {
    expect(safeParseInt('42', 0)).toBe(42);
    expect(safeParseInt('abc' as any, 7)).toBe(7);
  });
});
