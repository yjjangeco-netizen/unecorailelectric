import { Role, Permission, RBACManager } from '@/lib/rbac'

describe('rbac', () => {
  let rbacManager: RBACManager

  beforeEach(() => {
    rbacManager = RBACManager.getInstance()
  })

  test('Role enum values', () => {
    expect(Role.ADMIN).toBe('admin')
    expect(Role.MANAGER).toBe('manager')
    expect(Role.USER).toBe('user')
    expect(Role.VIEWER).toBe('viewer')
  })

  test('Permission enum values', () => {
    expect(Permission.STOCK_READ).toBe('stock:read')
    expect(Permission.STOCK_WRITE).toBe('stock:write')
    expect(Permission.STOCK_DELETE).toBe('stock:delete')
    expect(Permission.USER_READ).toBe('user:read')
  })

  test('ADMIN has comprehensive permissions', () => {
    expect(rbacManager.hasPermission(Role.ADMIN, Permission.STOCK_READ)).toBe(true)
    expect(rbacManager.hasPermission(Role.ADMIN, Permission.STOCK_WRITE)).toBe(true)
    expect(rbacManager.hasPermission(Role.ADMIN, Permission.STOCK_DELETE)).toBe(true)
    expect(rbacManager.hasPermission(Role.ADMIN, Permission.USER_READ)).toBe(true)
  })

  test('VIEWER has read-only permissions', () => {
    expect(rbacManager.hasPermission(Role.VIEWER, Permission.STOCK_READ)).toBe(true)
    expect(rbacManager.hasPermission(Role.VIEWER, Permission.STOCK_WRITE)).toBe(false)
    expect(rbacManager.hasPermission(Role.VIEWER, Permission.STOCK_DELETE)).toBe(false)
    expect(rbacManager.hasPermission(Role.VIEWER, Permission.USER_READ)).toBe(false)
  })

  test('USER has limited stock permissions', () => {
    expect(rbacManager.hasPermission(Role.USER, Permission.STOCK_READ)).toBe(true)
    expect(rbacManager.hasPermission(Role.USER, Permission.STOCK_WRITE)).toBe(false) // USER는 write 권한 없음
    expect(rbacManager.hasPermission(Role.USER, Permission.STOCK_DELETE)).toBe(false)
    expect(rbacManager.hasPermission(Role.USER, Permission.USER_READ)).toBe(false)
  })

  test('role normalization', () => {
    expect(rbacManager.hasPermission('ADMIN', Permission.STOCK_READ)).toBe(true)
    expect(rbacManager.hasPermission('admin', Permission.STOCK_READ)).toBe(true)
    expect(rbacManager.hasPermission('unknown', Permission.STOCK_READ)).toBe(true) // defaults to VIEWER
  })
});
