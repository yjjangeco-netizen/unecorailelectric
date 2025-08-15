import { validateStockIn } from '@/lib/schemas'

describe('schemas', () => {
  test('validateStockIn accepts a valid payload', () => {
    const ok = validateStockIn({
      itemName: '육각 볼트',
      quantity: 10,
      unitPrice: 1200,
      notes: '포장 단위 100개'
    });
    expect(ok.itemName).toBe('육각 볼트');
    expect(ok.quantity).toBe(10);
  });

  test('validateStockIn rejects invalid payload', () => {
    expect(() => validateStockIn({
      itemName: '',
      quantity: -1,
      unitPrice: -5
    } as unknown)).toThrow();
  });
});
