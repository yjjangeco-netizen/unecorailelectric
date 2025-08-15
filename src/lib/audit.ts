import { createBrowserSupabaseClient } from './supabase'
import { logError } from './utils'

// 감사 로그 레벨
export enum AuditLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// 감사 로그 카테고리
export enum AuditCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  STOCK_MANAGEMENT = 'stock_management',
  USER_MANAGEMENT = 'user_management',
  SYSTEM_OPERATION = 'system_operation',
  DATA_ACCESS = 'data_access',
  CONFIGURATION_CHANGE = 'configuration_change'
}

// 감사 로그 액션
export enum AuditAction {
  // 인증 관련
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  PASSWORD_CHANGE = 'password_change',
  SESSION_EXPIRED = 'session_expired',
  
  // 권한 관련
  PERMISSION_DENIED = 'permission_denied',
  ROLE_CHANGE = 'role_change',
  ACCESS_GRANTED = 'access_granted',
  ACCESS_REVOKED = 'access_revoked',
  
  // 재고 관리
  STOCK_IN = 'stock_in',
  STOCK_OUT = 'stock_out',
  STOCK_ADJUSTMENT = 'stock_adjustment',
  STOCK_DISPOSAL = 'stock_disposal',
  STOCK_TRANSFER = 'stock_transfer',
  
  // 사용자 관리
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_ACTIVATED = 'user_activated',
  USER_DEACTIVATED = 'user_deactivated',
  
  // 시스템 운영
  BACKUP_CREATED = 'backup_created',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  CONFIGURATION_CHANGED = 'configuration_changed',
  ERROR_OCCURRED = 'error_occurred',
  CLOSING_COMPLETE = 'closing_complete',
  CLOSING_ROLLBACK = 'closing_rollback'
}

// 감사 로그 인터페이스
export interface AuditLogEntry {
  id?: string
  timestamp: string
  user_id: string
  username: string
  user_role: string
  ip_address: string
  user_agent: string
  category: AuditCategory
  action: AuditAction
  level: AuditLevel
  resource_type?: string
  resource_id?: string
  details: Record<string, unknown>
  metadata?: Record<string, unknown>
  session_id?: string
  request_id?: string
}

// 감사 로그 매니저
export class AuditLogger {
  private static instance: AuditLogger
  private supabase = createBrowserSupabaseClient()
  
  private constructor() {}
  
  static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger()
    }
    return AuditLogger.instance
  }
  
  /**
   * 감사 로그 기록
   */
  async log(entry: Omit<AuditLogEntry, 'timestamp' | 'ip_address' | 'user_agent'>): Promise<void> {
    try {
      const fullEntry: AuditLogEntry = {
        ...entry,
        timestamp: new Date().toISOString(),
        ip_address: await this.getClientIP(),
        user_agent: this.getUserAgent()
      }
      
      // Supabase에 로그 저장
      const { error } = await this.supabase
        .from('audit_logs')
        .insert(fullEntry)
      
      if (error) {
        throw new Error(`감사 로그 저장 실패: ${error.message}`)
      }
      
      // 중요도가 높은 로그는 콘솔에도 출력
      if (entry.level === AuditLevel.ERROR || entry.level === AuditLevel.CRITICAL) {
        console.error('🔴 감사 로그 (Critical):', {
          action: entry.action,
          user: entry.username,
          details: entry.details
        })
      }
      
    } catch (error) {
      // 감사 로그 실패 시에도 에러 로깅
      logError('감사 로그 기록 실패', error, { auditEntry: entry })
    }
  }
  
  /**
   * 인증 관련 로그
   */
  async logAuthentication(
    action: AuditAction,
    userId: string,
    username: string,
    userRole: string,
    details: Record<string, unknown> = {},
    level: AuditLevel = AuditLevel.INFO
  ): Promise<void> {
    await this.log({
      user_id: userId,
      username,
      user_role: userRole,
      category: AuditCategory.AUTHENTICATION,
      action,
      level,
      details,
      session_id: details.sessionId,
      request_id: details.requestId
    })
  }
  
  /**
   * 재고 관리 관련 로그
   */
  async logStockOperation(
    action: AuditAction,
    userId: string,
    username: string,
    userRole: string,
    resourceType: string,
    resourceId: string,
    details: Record<string, unknown> = {},
    level: AuditLevel = AuditLevel.INFO
  ): Promise<void> {
    await this.log({
      user_id: userId,
      username,
      user_role: userRole,
      category: AuditCategory.STOCK_MANAGEMENT,
      action,
      level,
      resource_type: resourceType,
      resource_id: resourceId,
      details,
      session_id: details.sessionId,
      request_id: details.requestId
    })
  }
  
  /**
   * 권한 관련 로그
   */
  async logAuthorization(
    action: AuditAction,
    userId: string,
    username: string,
    userRole: string,
    details: Record<string, unknown> = {},
    level: AuditLevel = AuditLevel.WARNING
  ): Promise<void> {
    await this.log({
      user_id: userId,
      username,
      user_role: userRole,
      category: AuditCategory.AUTHORIZATION,
      action,
      level,
      details,
      session_id: details.sessionId,
      request_id: details.requestId
    })
  }
  
  /**
   * 시스템 운영 관련 로그
   */
  async logSystemOperation(
    action: AuditAction,
    userId: string,
    username: string,
    userRole: string,
    details: Record<string, unknown> = {},
    level: AuditLevel = AuditLevel.INFO
  ): Promise<void> {
    await this.log({
      user_id: userId,
      username,
      user_role: userRole,
      category: AuditCategory.SYSTEM_OPERATION,
      action,
      level,
      details,
      session_id: details.sessionId,
      request_id: details.requestId
    })
  }
  
  /**
   * 클라이언트 IP 주소 가져오기
   */
  private async getClientIP(): Promise<string> {
    try {
      // 외부 서비스로 IP 확인 (프록시 환경 대응)
      const response = await fetch('https://api.ipify.org?format=json')
      const data = await response.json()
      return data.ip || 'unknown'
    } catch (error) {
      return 'unknown'
    }
  }
  
  /**
   * 사용자 에이전트 가져오기
   */
  private getUserAgent(): string {
    if (typeof window !== 'undefined') {
      return window.navigator.userAgent || 'unknown'
    }
    return 'unknown'
  }
  
  /**
   * 감사 로그 조회 (관리자용)
   */
  async getAuditLogs(
    filters: {
      startDate?: string
      endDate?: string
      category?: AuditCategory
      action?: AuditAction
      userId?: string
      level?: AuditLevel
      limit?: number
      offset?: number
    } = {}
  ): Promise<{ data: AuditLogEntry[]; count: number; error?: string }> {
    try {
      let query = this.supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('timestamp', { ascending: false })
      
      // 필터 적용
      if (filters.startDate) {
        query = query.gte('timestamp', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('timestamp', filters.endDate)
      }
      if (filters.category) {
        query = query.eq('category', filters.category)
      }
      if (filters.action) {
        query = query.eq('action', filters.action)
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId)
      }
      if (filters.level) {
        query = query.eq('level', filters.level)
      }
      
      // 페이지네이션
      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 100) - 1)
      }
      
      const { data, error, count } = await query
      
      if (error) {
        throw new Error(`감사 로그 조회 실패: ${error.message}`)
      }
      
      return {
        data: data || [],
        count: count || 0
      }
      
    } catch (error) {
      logError('감사 로그 조회 실패', error, { filters })
      return {
        data: [],
        count: 0,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      }
    }
  }
  
  /**
   * 감사 로그 내보내기 (CSV)
   */
  async exportAuditLogs(
    filters: {
      startDate?: string
      endDate?: string
      category?: AuditCategory
      action?: AuditAction
      userId?: string
      level?: AuditLevel
    } = {}
  ): Promise<string> {
    try {
      const { data } = await this.getAuditLogs({ ...filters, limit: 10000 })
      
      if (data.length === 0) {
        return ''
      }
      
      // CSV 헤더
      const headers = [
        'Timestamp',
        'User ID',
        'Username',
        'User Role',
        'IP Address',
        'Category',
        'Action',
        'Level',
        'Resource Type',
        'Resource ID',
        'Details',
        'Metadata'
      ]
      
      // CSV 데이터
      const csvRows = [
        headers.join(','),
        ...data.map(entry => [
          entry.timestamp,
          entry.user_id,
          entry.username,
          entry.user_role,
          entry.ip_address,
          entry.category,
          entry.action,
          entry.level,
          entry.resource_type || '',
          entry.resource_id || '',
          JSON.stringify(entry.details),
          JSON.stringify(entry.metadata || {})
        ].join(','))
      ]
      
      return csvRows.join('\n')
      
    } catch (error) {
      logError('감사 로그 내보내기 실패', error, { filters })
      throw error
    }
  }
}

// 전역 인스턴스
export const auditLogger = AuditLogger.getInstance()

// 서버사이드 전용 인스턴스 (API 라우트에서 사용)
export const serverAuditLogger = AuditLogger.getInstance()

// 편의 함수들
export const logAuth = auditLogger.logAuthentication.bind(auditLogger)
export const logStock = auditLogger.logStockOperation.bind(auditLogger)
export const logAuthz = auditLogger.logAuthorization.bind(auditLogger)
export const logSystem = auditLogger.logSystemOperation.bind(auditLogger)
