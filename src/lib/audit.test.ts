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
    expect(AuditAction.STOCK_IN).toBe('stock_in')
    expect(AuditAction.STOCK_OUT).toBe('stock_out')
    expect(AuditAction.STOCK_ADJUSTMENT).toBe('stock_adjustment')
    expect(AuditAction.STOCK_DISPOSAL).toBe('stock_disposal')
  })

  test('AuditAction authentication operations', () => {
    expect(AuditAction.LOGIN).toBe('login')
    expect(AuditAction.LOGOUT).toBe('logout')
    expect(AuditAction.LOGIN_FAILED).toBe('login_failed')
    expect(AuditAction.PERMISSION_DENIED).toBe('permission_denied')
  })
});
