import { supabase } from './supabaseClient'
import { logError } from './utils'

/**
 * 데이터베이스 권한 관리를 위한 클래스
 * RLS 정책과 연동하여 사용자 권한을 검증합니다.
 */
export class DatabaseAuthManager {
  private static instance: DatabaseAuthManager
  private currentUserId: string | null = null
  private sessionId: string | null = null

  private constructor() {
    this.sessionId = this.generateSessionId()
  }

  public static getInstance(): DatabaseAuthManager {
    if (!DatabaseAuthManager.instance) {
      DatabaseAuthManager.instance = new DatabaseAuthManager()
    }
    return DatabaseAuthManager.instance
  }

  /**
   * 고유한 세션 ID 생성
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 사용자 로그인 시 세션 설정
   */
  async setUserSession(userId: string): Promise<void> {
    try {
      this.currentUserId = userId
      
      // 데이터베이스에 세션 사용자 ID 설정
      const { error } = await supabase.rpc('set_session_user', {
        session_id: this.sessionId,
        user_id: userId
      })

      if (error) {
        logError('세션 사용자 ID 설정 실패', error)
        throw new Error(`세션 설정 실패: ${error.message}`)
      }

      console.log(`사용자 세션이 설정되었습니다: ${userId}`)
    } catch (error) {
      logError('사용자 세션 설정 오류', error)
      throw error
    }
  }

  /**
   * 세션 사용자 ID 조회
   */
  async getSessionUser(): Promise<string | null> {
    if (!this.sessionId) {
      return null
    }

    try {
      const { data, error } = await supabase.rpc('get_session_user', {
        session_id: this.sessionId
      })

      if (error) {
        logError('세션 사용자 ID 조회 실패', error)
        return null
      }

      this.currentUserId = data
      return data
    } catch (error) {
      logError('세션 사용자 ID 조회 오류', error)
      return null
    }
  }

  /**
   * 현재 사용자 ID 반환
   */
  getCurrentUserId(): string | null {
    return this.currentUserId
  }

  /**
   * 사용자 권한 확인
   */
  async checkUserPermission(
    requiredPermission: string = 'level1'
  ): Promise<boolean> {
    if (!this.currentUserId) {
      return false
    }

    try {
      const { data, error } = await supabase.rpc('check_user_permission', {
        user_id: this.currentUserId,
        required_permission: requiredPermission
      })

      if (error) {
        logError('사용자 권한 확인 실패', error)
        return false
      }

      return data === true
    } catch (error) {
      logError('사용자 권한 확인 오류', error)
      return false
    }
  }

  /**
   * 부서별 접근 권한 확인
   */
  async checkDepartmentAccess(
    requiredDepartment: string = '전기팀'
  ): Promise<boolean> {
    if (!this.currentUserId) {
      return false
    }

    try {
      const { data, error } = await supabase.rpc('check_department_access', {
        user_id: this.currentUserId,
        required_department: requiredDepartment
      })

      if (error) {
        logError('부서별 접근 권한 확인 실패', error)
        return false
      }

      return data === true
    } catch (error) {
      logError('부서별 접근 권한 확인 오류', error)
      return false
    }
  }

  /**
   * 본인 데이터 접근 권한 확인
   */
  async checkSelfAccess(targetUserId: string): Promise<boolean> {
    if (!this.currentUserId) {
      return false
    }

    try {
      const { data, error } = await supabase.rpc('check_self_access', {
        user_id: this.currentUserId,
        target_user_id: targetUserId
      })

      if (error) {
        logError('본인 데이터 접근 권한 확인 실패', error)
        return false
      }

      return data === true
    } catch (error) {
      logError('본인 데이터 접근 권한 확인 오류', error)
      return false
    }
  }

  /**
   * 세션 정리
   */
  async cleanupSession(): Promise<void> {
    try {
      this.currentUserId = null
      this.sessionId = this.generateSessionId()
      
      console.log('사용자 세션이 정리되었습니다.')
    } catch (error) {
      logError('세션 정리 오류', error)
    }
  }

  /**
   * 권한 기반 데이터베이스 작업 실행
   */
  async executeWithPermission<T>(
    operation: () => Promise<T>,
    requiredPermission: string = 'level1',
    fallbackValue?: T
  ): Promise<T> {
    try {
      const hasPermission = await this.checkUserPermission(requiredPermission)
      
      if (!hasPermission) {
        logError('권한 부족', {
          required: requiredPermission,
          userId: this.currentUserId
        })
        
        if (fallbackValue !== undefined) {
          return fallbackValue
        }
        
        throw new Error(`권한이 부족합니다: ${requiredPermission} 필요`)
      }

      return await operation()
    } catch (error) {
      logError('권한 기반 작업 실행 오류', error)
      throw error
    }
  }

  /**
   * 부서별 접근 제어 작업 실행
   */
  async executeWithDepartmentAccess<T>(
    operation: () => Promise<T>,
    requiredDepartment: string = '전기팀',
    fallbackValue?: T
  ): Promise<T> {
    try {
      const hasAccess = await this.checkDepartmentAccess(requiredDepartment)
      
      if (!hasAccess) {
        logError('부서별 접근 권한 부족', {
          required: requiredDepartment,
          userId: this.currentUserId
        })
        
        if (fallbackValue !== undefined) {
          return fallbackValue
        }
        
        throw new Error(`부서별 접근 권한이 부족합니다: ${requiredDepartment} 필요`)
      }

      return await operation()
    } catch (error) {
      logError('부서별 접근 제어 작업 실행 오류', error)
      throw error
    }
  }
}

// 싱글톤 인스턴스 내보내기
export const databaseAuth = DatabaseAuthManager.getInstance()
