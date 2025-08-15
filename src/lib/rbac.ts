import { auditLogger, AuditAction, AuditLevel } from './audit'

// 권한 정의
export enum Permission {
  // 재고 관리
  STOCK_READ = 'stock:read',
  STOCK_WRITE = 'stock:write',
  STOCK_DELETE = 'stock:delete',
  STOCK_ADJUSTMENT = 'stock:adjustment',
  STOCK_DISPOSAL = 'stock:disposal',
  
  // 사용자 관리
  USER_READ = 'user:read',
  USER_WRITE = 'user:write',
  USER_DELETE = 'user:delete',
  USER_ROLE_MANAGE = 'user:role_manage',
  
  // 시스템 관리
  SYSTEM_CONFIG = 'system:config',
  SYSTEM_BACKUP = 'system:backup',
  SYSTEM_MAINTENANCE = 'system:maintenance',
  
  // 감사 및 모니터링
  AUDIT_READ = 'audit:read',
  AUDIT_EXPORT = 'audit:export',
  MONITORING_VIEW = 'monitoring:view',
  
  // 보고서
  REPORT_VIEW = 'report:view',
  REPORT_EXPORT = 'report:export',
  REPORT_SCHEDULE = 'report:schedule'
}

// 역할 정의
export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  SUPERVISOR = 'supervisor',
  USER = 'user',
  VIEWER = 'viewer'
}

// 역할별 권한 매핑
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    // 모든 권한
    ...Object.values(Permission)
  ],
  
  [Role.MANAGER]: [
    // 재고 관리 (폐기 제외)
    Permission.STOCK_READ,
    Permission.STOCK_WRITE,
    Permission.STOCK_ADJUSTMENT,
    
    // 사용자 관리 (삭제 제외)
    Permission.USER_READ,
    Permission.USER_WRITE,
    
    // 감사 및 모니터링
    Permission.AUDIT_READ,
    Permission.MONITORING_VIEW,
    
    // 보고서
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT
  ],
  
  [Role.SUPERVISOR]: [
    // 재고 관리 (읽기, 쓰기)
    Permission.STOCK_READ,
    Permission.STOCK_WRITE,
    
    // 사용자 읽기
    Permission.USER_READ,
    
    // 기본 모니터링
    Permission.MONITORING_VIEW,
    
    // 보고서 보기
    Permission.REPORT_VIEW
  ],
  
  [Role.USER]: [
    // 재고 읽기
    Permission.STOCK_READ,
    
    // 기본 보고서 보기
    Permission.REPORT_VIEW
  ],
  
  [Role.VIEWER]: [
    // 읽기 전용
    Permission.STOCK_READ,
    Permission.REPORT_VIEW
  ]
}

// 권한 그룹 정의
export const PERMISSION_GROUPS = {
  STOCK_MANAGEMENT: [
    Permission.STOCK_READ,
    Permission.STOCK_WRITE,
    Permission.STOCK_DELETE,
    Permission.STOCK_ADJUSTMENT,
    Permission.STOCK_DISPOSAL
  ],
  
  USER_MANAGEMENT: [
    Permission.USER_READ,
    Permission.USER_WRITE,
    Permission.USER_DELETE,
    Permission.USER_ROLE_MANAGE
  ],
  
  SYSTEM_ADMINISTRATION: [
    Permission.SYSTEM_CONFIG,
    Permission.SYSTEM_BACKUP,
    Permission.SYSTEM_MAINTENANCE
  ],
  
  AUDIT_MONITORING: [
    Permission.AUDIT_READ,
    Permission.AUDIT_EXPORT,
    Permission.MONITORING_VIEW
  ],
  
  REPORTING: [
    Permission.REPORT_VIEW,
    Permission.REPORT_EXPORT,
    Permission.REPORT_SCHEDULE
  ]
}

// RBAC 매니저 클래스
export class RBACManager {
  private static instance: RBACManager
  
  private constructor() {}
  
  static getInstance(): RBACManager {
    if (!RBACManager.instance) {
      RBACManager.instance = new RBACManager()
    }
    return RBACManager.instance
  }
  
  /**
   * 사용자가 특정 권한을 가지고 있는지 확인
   */
  hasPermission(userRole: Role | string, permission: Permission): boolean {
    const role = this.normalizeRole(userRole)
    const permissions = ROLE_PERMISSIONS[role] || []
    return permissions.includes(permission)
  }
  
  /**
   * 사용자가 여러 권한을 모두 가지고 있는지 확인
   */
  hasAllPermissions(userRole: Role | string, permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(userRole, permission))
  }
  
  /**
   * 사용자가 여러 권한 중 하나라도 가지고 있는지 확인
   */
  hasAnyPermission(userRole: Role | string, permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(userRole, permission))
  }
  
  /**
   * 사용자의 모든 권한 조회
   */
  getUserPermissions(userRole: Role | string): Permission[] {
    const role = this.normalizeRole(userRole)
    return [...(ROLE_PERMISSIONS[role] || [])]
  }
  
  /**
   * 역할별 권한 조회
   */
  getRolePermissions(role: Role | string): Permission[] {
    const normalizedRole = this.normalizeRole(role)
    return [...(ROLE_PERMISSIONS[normalizedRole] || [])]
  }
  
  /**
   * 권한 그룹별 권한 조회
   */
  getPermissionGroup(groupName: keyof typeof PERMISSION_GROUPS): Permission[] {
    return [...PERMISSION_GROUPS[groupName]]
  }
  
  /**
   * 역할 우선순위 확인 (높은 역할이 더 많은 권한)
   */
  hasHigherRole(userRole: Role | string, requiredRole: Role | string): boolean {
    const roleHierarchy = {
      [Role.ADMIN]: 5,
      [Role.MANAGER]: 4,
      [Role.SUPERVISOR]: 3,
      [Role.USER]: 2,
      [Role.VIEWER]: 1
    }
    
    const userLevel = roleHierarchy[this.normalizeRole(userRole)] || 0
    const requiredLevel = roleHierarchy[this.normalizeRole(requiredRole)] || 0
    
    return userLevel >= requiredLevel
  }
  
  /**
   * 역할 정규화
   */
  private normalizeRole(role: string): Role {
    const normalizedRole = role.toLowerCase() as Role
    return Object.values(Role).includes(normalizedRole) ? normalizedRole : Role.VIEWER
  }
  
  /**
   * 권한 검증 및 감사 로그
   */
  async validatePermissionWithAudit(
    userId: string,
    username: string,
    userRole: string,
    permission: Permission,
    resourceType?: string,
    resourceId?: string,
    context?: Record<string, unknown>
  ): Promise<boolean> {
    const hasPermission = this.hasPermission(userRole, permission)
    
    if (!hasPermission) {
      // 권한 거부 감사 로그
      await auditLogger.logAuthorization(
        AuditAction.PERMISSION_DENIED,
        userId,
        username,
        userRole,
        {
          permission,
          resourceType,
          resourceId,
          context,
          timestamp: new Date().toISOString()
        },
        AuditLevel.WARNING
      )
    }
    
    return hasPermission
  }
  
  /**
   * 역할 변경 감사 로그
   */
  async logRoleChange(
    adminUserId: string,
    adminUsername: string,
    adminRole: string,
    targetUserId: string,
    targetUsername: string,
    oldRole: string,
    newRole: string,
    reason?: string
  ): Promise<void> {
    await auditLogger.logAuthorization(
      AuditAction.ROLE_CHANGE,
      adminUserId,
      adminUsername,
      adminRole,
      {
        targetUserId,
        targetUsername,
        oldRole,
        newRole,
        reason,
        changeType: 'role_modification',
        timestamp: new Date().toISOString()
      },
      AuditLevel.CRITICAL
    )
  }
  
  /**
   * 권한 부여 감사 로그
   */
  async logPermissionGrant(
    adminUserId: string,
    adminUsername: string,
    adminRole: string,
    targetUserId: string,
    targetUsername: string,
    permission: Permission,
    reason?: string
  ): Promise<void> {
    await auditLogger.logAuthorization(
      AuditAction.ACCESS_GRANTED,
      adminUserId,
      adminUsername,
      adminRole,
      {
        targetUserId,
        targetUsername,
        permission,
        reason,
        grantType: 'permission_grant',
        timestamp: new Date().toISOString()
      },
      AuditLevel.INFO
    )
  }
  
  /**
   * 권한 철회 감사 로그
   */
  async logPermissionRevoke(
    adminUserId: string,
    adminUsername: string,
    adminRole: string,
    targetUserId: string,
    targetUsername: string,
    permission: Permission,
    reason?: string
  ): Promise<void> {
    await auditLogger.logAuthorization(
      AuditAction.ACCESS_REVOKED,
      adminUserId,
      adminUsername,
      adminRole,
      {
        targetUserId,
        targetUsername,
        permission,
        reason,
        revokeType: 'permission_revoke',
        timestamp: new Date().toISOString()
      },
      AuditLevel.WARNING
    )
  }
}

// 전역 인스턴스
export const rbacManager = RBACManager.getInstance()

// 편의 함수들
export const hasPermission = rbacManager.hasPermission.bind(rbacManager)
export const hasAllPermissions = rbacManager.hasAllPermissions.bind(rbacManager)
export const hasAnyPermission = rbacManager.hasAnyPermission.bind(rbacManager)
export const getUserPermissions = rbacManager.getUserPermissions.bind(rbacManager)
export const hasHigherRole = rbacManager.hasHigherRole.bind(rbacManager)

// 권한 검증 데코레이터
export function requirePermission(_permission: Permission) {
  return function <T extends (...args: unknown[]) => unknown>(target: T): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      // 권한 검증 로직은 컴포넌트 레벨에서 처리
      return target(...args)
    }) as T
  }
}

// 역할 검증 데코레이터
export function requireRole(_role: Role) {
  return function <T extends (...args: unknown[]) => unknown>(target: T): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
      // 역할 검증 로직은 컴포넌트 레벨에서 처리
      return target(...args)
    }) as T
  }
}
