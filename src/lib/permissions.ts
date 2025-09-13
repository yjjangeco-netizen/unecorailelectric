import type { PermissionType } from './types';

export class PermissionManager {
  static hasPermission(userPermissions: PermissionType[], requiredPermission: PermissionType): boolean {
    return userPermissions.includes(requiredPermission);
  }

  static isAdmin(userPermissions: PermissionType[]): boolean {
    return userPermissions.includes('administrator');
  }

  static hasLevel(userPermissions: PermissionType[], requiredLevel: number): boolean {
    const levelMap: Record<PermissionType, number> = {
      'level1': 1, 'level2': 2, 'level3': 3, 'level4': 4, 'level5': 5, 'administrator': 6
    };
    const userMaxLevel = Math.max(...userPermissions.map(p => levelMap[p]));
    return userMaxLevel >= requiredLevel;
  }

  static canAccessFeature(userPermissions: PermissionType[], feature: string): boolean {
    const featurePermissions: Record<string, PermissionType[]> = {
      // 전체재고 권한
      'stock-view': ['administrator', 'level5', 'level4', 'level3', 'level2'],
      'stock-in': ['administrator', 'level5', 'level4', 'level3'],
      'stock-out': ['administrator', 'level5', 'level4', 'level3'],
      'stock-edit': ['administrator', 'level5', 'level4', 'level3'],
      'stock-delete': ['administrator', 'level5', 'level4'],
      'stock-close': ['administrator', 'level5'],
      
      // 업무도구 권한
      'work-diary': ['administrator', 'level5', 'level4', 'level3'],
      'sop': ['administrator', 'level5', 'level4', 'level3'],
      'schedule': ['administrator', 'level5', 'level4', 'level3'],
      
      // 사용자관리 권한
      'user-management': ['administrator', 'level5'],
      
      // 기존 호환성 유지
      'user-management': ['administrator', 'level5'],
      'stock-management': ['administrator', 'level5', 'level4', 'level3', 'level2'],
      'stock-adjustment': ['administrator', 'level5', 'level4'],
      'disposal': ['administrator', 'level5', 'level4'],
      'audit-logs': ['administrator', 'level5', 'level4'],
      'system-settings': ['administrator'],
      'work-tools': ['administrator', 'level5', 'level4', 'level3'],
      'manual-management': ['administrator', 'level5', 'level4', 'level3']
    };
    const requiredPermissions = featurePermissions[feature] || [];
    return requiredPermissions.some(permission => this.hasPermission(userPermissions, permission));
  }

  // 특정 기능에 대한 세부 권한 확인 (새로운 매트릭스 기준)
  static canView(userPermissions: PermissionType[]): boolean {
    // LEVEL 2 이상: 전체재고 조회 가능
    return this.hasLevel(userPermissions, 2) || this.isAdmin(userPermissions);
  }

  static canCreate(userPermissions: PermissionType[]): boolean {
    // LEVEL 3 이상: 입고/출고 가능
    return this.hasLevel(userPermissions, 3) || this.isAdmin(userPermissions);
  }

  static canEdit(userPermissions: PermissionType[]): boolean {
    // LEVEL 3 이상: 수정 가능
    return this.hasLevel(userPermissions, 3) || this.isAdmin(userPermissions);
  }

  static canDelete(userPermissions: PermissionType[]): boolean {
    // LEVEL 4 이상: 삭제 가능
    return this.hasLevel(userPermissions, 4) || this.isAdmin(userPermissions);
  }

  static canClose(userPermissions: PermissionType[]): boolean {
    // LEVEL 5 이상: 마감 가능
    return this.hasLevel(userPermissions, 5) || this.isAdmin(userPermissions);
  }

  static canManageUsers(userPermissions: PermissionType[]): boolean {
    // LEVEL 5 이상: 사용자관리 가능
    return this.hasLevel(userPermissions, 5) || this.isAdmin(userPermissions);
  }

  static canAccessWorkTools(userPermissions: PermissionType[]): boolean {
    // LEVEL 3 이상: 업무도구 접근 가능
    return this.hasLevel(userPermissions, 3) || this.isAdmin(userPermissions);
  }
}
