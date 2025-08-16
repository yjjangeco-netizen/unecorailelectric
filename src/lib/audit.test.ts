import { AuditLevel, AuditCategory, AuditAction } from '@/lib/audit'

describe('audit', () => {
  test('AuditLevel enum values', () => {
    expect(AuditLevel.INFO).toBe('info')
    expect(AuditLevel.WARNING).toBe('warning')
    expect(AuditLevel.ERROR).toBe('error')
    expect(AuditLevel.CRITICAL).toBe('critical')
  })

  test('AuditCategory enum values', () => {
    expect(AuditCategory.AUTHENTICATION).toBe('authentication')
    expect(AuditCategory.AUTHORIZATION).toBe('authorization')
    expect(AuditCategory.STOCK_MANAGEMENT).toBe('stock_management')
    expect(AuditCategory.USER_MANAGEMENT).toBe('user_management')
  })

  test('AuditAction stock operations', () => {
    expect(AuditAction.STOCK_IN).toBe('STOCK_IN')
    expect(AuditAction.STOCK_OUT).toBe('STOCK_OUT')
    expect(AuditAction.STOCK_ADJUSTMENT).toBe('STOCK_ADJUSTMENT')
    expect(AuditAction.STOCK_DISPOSAL).toBe('STOCK_DISPOSAL')
  })

  test('AuditAction authentication operations', () => {
    expect(AuditAction.LOGIN).toBe('LOGIN')
    expect(AuditAction.LOGOUT).toBe('LOGOUT')
    expect(AuditAction.LOGIN_FAILED).toBe('LOGIN_FAILED')
    expect(AuditAction.PERMISSION_DENIED).toBe('PERMISSION_DENIED')
  })
});
