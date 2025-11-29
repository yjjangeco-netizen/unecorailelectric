import { useState, useEffect } from 'react';
import type { User, PermissionType } from '../lib/types';
import { UserService } from '../lib/userService';
import { PermissionManager } from '../lib/permissions';
import { databaseAuth } from '../lib/databaseAuth';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 로그인 함수
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('로그인 시도:', username);
      
      const user = await UserService.login(username, password);
      if (user) {
        console.log('로그인 성공:', user.username);
        console.log('사용자 정보:', user);
        setUser(user);
        
        // 데이터베이스 권한 관리에 세션 설정
        try {
          await databaseAuth.setUserSession(user.id);
        } catch (dbError) {
          console.warn('데이터베이스 세션 설정 실패:', dbError);
          // 데이터베이스 세션 설정 실패는 치명적이지 않음
        }
        
        // localStorage에 사용자 정보 저장
        localStorage.setItem('user', JSON.stringify(user));
        
        // 쿠키에 인증 토큰 저장 (보안 강화)
        const authToken = btoa(JSON.stringify({ id: user.id, username: user.username, timestamp: Date.now() }));
        document.cookie = `auth-token=${authToken}; path=/; max-age=${7 * 24 * 60 * 60}; secure; samesite=strict`;
        
        console.log('사용자 상태 업데이트 완료, isAuthenticated:', !!user);
        return true;
      } else {
        setError('사용자명 또는 비밀번호가 올바르지 않습니다.');
        return false;
      }
    } catch (err) {
      console.error('로그인 오류:', err);
      const errorMessage = err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃 함수
  const logout = () => {
    try {
      setUser(null);
      setError(null);
      setLoading(false);
      
      // 데이터베이스 세션 정리
      databaseAuth.cleanupSession().catch(console.error);
      
      // localStorage에서 사용자 정보 제거
      localStorage.removeItem('user');
      
      // 쿠키에서 인증 토큰 제거
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch (error) {
      console.error('로그아웃 처리 중 오류:', error);
      // 오류가 있어도 상태는 초기화
      setUser(null);
      setError(null);
      setLoading(false);
      localStorage.removeItem('user');
    }
  };

  // 권한 확인 함수들
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    
    // admin 사용자는 모든 권한 허용
    if (user.id === 'admin' || user.username === 'admin' || user.level === 'admin' || user.level === 'administrator') {
      console.log(`admin 사용자 권한 확인: ${permission} - 모든 권한 허용`);
      return true;
    }
    
    // RPC 함수 호출 대신 로컬에서 권한 확인
    const requiredLevel = parseInt(permission.replace('level', ''));
    const userLevel = typeof user.level === 'number' ? user.level : 1; // 기본값 1
    const hasAccess = userLevel >= requiredLevel;
    
    console.log(`권한 확인: 사용자 레벨 ${userLevel}, 필요 레벨 ${requiredLevel}, 접근 가능: ${hasAccess}`);
    
    return hasAccess;
  };

  const isAdmin = (): boolean => {
    if (!user) return false;
    // Modified: permissions가 없을 때 level을 기반으로 생성
    const userPermissions = user.permissions || UserService.mapLevelToPermissions(String(user.level));
    return PermissionManager.isAdmin(userPermissions as PermissionType[]);
  };

  const hasLevel = (level: number): boolean => {
    if (!user) return false;
    // Modified: permissions가 없을 때 level을 기반으로 생성
    const userPermissions = user.permissions || UserService.mapLevelToPermissions(String(user.level));
    return PermissionManager.hasLevel(userPermissions as PermissionType[], level);
  };

  const canAccessFeature = (feature: string): boolean => {
    if (!user) return false;
    // Modified: permissions가 없을 때 level을 기반으로 생성
    const userPermissions = user.permissions || UserService.mapLevelToPermissions(String(user.level));
    return PermissionManager.canAccessFeature(userPermissions as PermissionType[], feature);
  };

  // Modified: 수정 권한 확인 함수 추가
  const canEdit = (): boolean => {
    if (!user) return false;
    // Modified: permissions가 없을 때 level을 기반으로 생성
    const userPermissions = user.permissions || UserService.mapLevelToPermissions(String(user.level));
    return PermissionManager.canEdit(userPermissions as PermissionType[]);
  };

  // Modified: 수정 권한 확인 함수 (데이터베이스 권한 포함)
  const canEditWithDbPermission = async (): Promise<boolean> => {
    if (!user) return false;
    
    // admin 사용자는 모든 권한 허용
    if (user.id === 'admin' || user.username === 'admin' || user.level === 'admin' || user.level === 'administrator') {
      console.log('admin 사용자 수정 권한 확인: 모든 권한 허용');
      return true;
    }
    
    // level3 이상 권한 확인 (새로운 매트릭스 기준)
    const userPermissions = user.permissions || UserService.mapLevelToPermissions(String(user.level));
    if (PermissionManager.hasLevel(userPermissions, 3)) {
      console.log('level3 이상 사용자 수정 권한 확인: 수정 권한 허용');
      return true;
    }
    
    console.log('수정 권한 확인: 수정 권한 없음');
    return false;
  };

  // 데이터베이스 권한 확인 함수들
  const checkDbPermission = async (requiredPermission: string = 'level1'): Promise<boolean> => {
    if (!user) return false;
    
    // admin 사용자는 모든 권한 허용
    if (user.id === 'admin' || user.username === 'admin' || user.level === 'admin' || user.level === 'administrator') {
      console.log(`admin 사용자 DB 권한 확인: ${requiredPermission} - 모든 권한 허용`);
      return true;
    }
    
    // RPC 함수 호출 대신 로컬에서 권한 확인
    const requiredLevel = parseInt(requiredPermission.replace('level', ''));
    const userLevel = typeof user.level === 'number' ? user.level : 1; // 기본값 1
    const hasAccess = userLevel >= requiredLevel;
    
    console.log(`권한 확인: 사용자 레벨 ${userLevel}, 필요 레벨 ${requiredLevel}, 접근 가능: ${hasAccess}`);
    
    return hasAccess;
  };

  const checkDbDepartmentAccess = async (requiredDepartment: string = '전기팀'): Promise<boolean> => {
    if (!user) return false;
    return await databaseAuth.checkDepartmentAccess(requiredDepartment);
  };

  const checkDbSelfAccess = async (targetUserId: string): Promise<boolean> => {
    if (!user) return false;
    return await databaseAuth.checkSelfAccess(targetUserId);
  };

  // 권한 기반 데이터베이스 작업 실행
  const executeWithDbPermission = async <T>(
    operation: () => Promise<T>,
    requiredPermission: string = 'level1',
    fallbackValue?: T
  ): Promise<T> => {
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }
    return await databaseAuth.executeWithPermission(operation, requiredPermission, fallbackValue);
  };

  const executeWithDbDepartmentAccess = async <T>(
    operation: () => Promise<T>,
    requiredDepartment: string = '전기팀',
    fallbackValue?: T
  ): Promise<T> => {
    if (!user) {
      throw new Error('로그인이 필요합니다.');
    }
    return await databaseAuth.executeWithDepartmentAccess(operation, requiredDepartment, fallbackValue);
  };

  // 초기 로딩 시 localStorage에서 사용자 정보 복원
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const userData: User = JSON.parse(storedUser);
          console.log('localStorage에서 사용자 정보 복원:', userData);
          setUser(userData);
          console.log('사용자 상태 설정 완료:', userData);
        } else {
          console.log('localStorage에 사용자 정보 없음');
        }
      } catch (err) {
        console.error('사용자 정보 로드 중 오류:', err);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    // localStorage에서 사용자 정보 로드
    loadUserFromStorage();
  }, []);

  return {
    user,
    loading,
    error,
    login,
    logout,
    hasPermission,
    isAdmin,
    hasLevel,
    canAccessFeature,
    // Modified: 수정 권한 확인 함수들 추가
    canEdit,
    canEditWithDbPermission,
    // 데이터베이스 권한 관련 함수들
    checkDbPermission,
    checkDbDepartmentAccess,
    checkDbSelfAccess,
    executeWithDbPermission,
    executeWithDbDepartmentAccess,
    // 인증 상태 - 더 엄격한 체크
    isAuthenticated: !!(user && user.id && user.username),
  };
}
