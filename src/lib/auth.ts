import { supabase } from './supabaseClient'
import { logError } from './utils'
import { auditLogger, AuditAction, AuditLevel } from './audit'

// 쿠키 기반 세션 관리 (클라이언트 사이드)
export class CookieAuthManager {
  private static readonly SESSION_COOKIE = 'une_session'
  private static readonly REFRESH_COOKIE = 'une_refresh'
  private static readonly MAX_AGE = 60 * 60 * 24 * 7 // 7일

  // 쿠키 설정 (클라이언트 사이드)
  private static setCookie(name: string, value: string, maxAge: number) {
    if (typeof document !== 'undefined') {
      document.cookie = `${name}=${value}; max-age=${maxAge}; path=/; SameSite=Lax`
    }
  }

  // 쿠키 제거 (클라이언트 사이드)
  private static clearCookie(name: string) {
    if (typeof document !== 'undefined') {
      document.cookie = `${name}=; max-age=0; path=/`
    }
  }

  // 세션 쿠키 설정
  private static setSessionCookie(accessToken: string, refreshToken: string) {
    this.setCookie(this.SESSION_COOKIE, accessToken, this.MAX_AGE)
    this.setCookie(this.REFRESH_COOKIE, refreshToken, this.MAX_AGE)
  }

  // 세션 쿠키 제거
  private static clearSessionCookies() {
    this.clearCookie(this.SESSION_COOKIE)
    this.clearCookie(this.REFRESH_COOKIE)
  }

  // 로그인 처리
  static async login(username: string, password: string) {
    try {
      // Supabase Auth를 통한 로그인
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password: password
      })

      if (error) {
        throw new Error(`로그인 실패: ${error.message}`)
      }

      if (data.user && data.session) {
        // 세션 쿠키 설정
        this.setSessionCookie(data.session.access_token, data.session.refresh_token)
        
        const userRole = await this.getUserRole(data.user.id)
        
        // 성공적인 로그인 감사 로그
        await auditLogger.logAuthentication(
          AuditAction.LOGIN,
          data.user.id,
          username,
          userRole,
          {
            sessionId: data.session.access_token,
            loginMethod: 'password',
            success: true
          },
          AuditLevel.INFO
        )
        
        return {
          success: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            username: username,
            role: userRole
          }
        }
      }

      throw new Error('로그인 응답이 올바르지 않습니다')
    } catch (error) {
      logError('쿠키 로그인 오류', error)
      throw error
    }
  }

  // 로그아웃 처리
  static async logout() {
    try {
      // Supabase 세션 종료
      await supabase.auth.signOut()
      
      // 쿠키 제거
      this.clearSessionCookies()
      
      // 로그아웃 감사 로그
      await auditLogger.logAuthentication(
        AuditAction.LOGOUT,
        'unknown', // 로그아웃 시에는 사용자 ID를 알 수 없음
        'unknown',
        'unknown',
        {
          logoutMethod: 'session_clear',
          success: true
        },
        AuditLevel.INFO
      )
      
      return { success: true }
    } catch (error) {
      logError('쿠키 로그아웃 오류', error)
      // 에러가 있어도 쿠키는 제거
      this.clearSessionCookies()
      throw error
    }
  }

  // 세션 유효성 검증
  static async validateSession() {
    try {
      // 현재 세션 확인
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session) {
        return { isValid: false, user: null }
      }

      // 사용자 정보 가져오기
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        return { isValid: false, user: null }
      }

      const userRole = await this.getUserRole(user.id)
      
      return {
        isValid: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.email?.split('@')[0] || 'unknown',
          role: userRole
        }
      }
    } catch (error) {
      logError('세션 검증 오류', error)
      return { isValid: false, user: null }
    }
  }

  // 사용자 역할 가져오기
  private static async getUserRole(userId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (error || !data) {
        return 'user' // 기본 역할
      }

      return data.role || 'user'
    } catch (error) {
      logError('사용자 역할 조회 오류', error)
      return 'user' // 기본 역할
    }
  }
}

// 권한 기반 접근 제어 (RBAC)
export class RBACManager {
  private static readonly ROLE_PERMISSIONS = {
    admin: [
      'stock:read', 'stock:write', 'stock:delete',
      'user:read', 'user:write', 'user:delete',
      'audit:read', 'system:admin'
    ],
    manager: [
      'stock:read', 'stock:write',
      'user:read', 'user:write'
    ],
    user: [
      'stock:read'
    ]
  }

  // 권한 확인
  static hasPermission(userRole: string, permission: string): boolean {
    const permissions = this.ROLE_PERMISSIONS[userRole as keyof typeof this.ROLE_PERMISSIONS] || []
    return permissions.includes(permission)
  }

  // 역할별 UI 렌더링 제어
  static canRender(userRole: string, feature: string): boolean {
    const featurePermissions = {
      'user-management': 'user:write',
      'stock-adjustment': 'stock:write',
      'disposal': 'stock:write',
      'audit-logs': 'audit:read',
      'system-settings': 'system:admin'
    }

    const requiredPermission = featurePermissions[feature as keyof typeof featurePermissions]
    return requiredPermission ? this.hasPermission(userRole, requiredPermission) : false
  }
}
