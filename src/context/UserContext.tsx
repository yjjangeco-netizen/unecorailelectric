'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User, PermissionType } from '@/lib/types'
import { UserService } from '@/lib/userService'
import { PermissionManager } from '@/lib/permissions'
import { databaseAuth } from '@/lib/databaseAuth'

interface UserContextType {
  user: User | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
  hasPermission: (permission: string) => boolean
  isAdmin: () => boolean
  hasLevel: (level: number) => boolean
  canAccessFeature: (feature: string) => boolean
  canEdit: () => boolean
  canEditWithDbPermission: () => Promise<boolean>
  checkDbPermission: (requiredPermission?: string) => Promise<boolean>
  checkDbDepartmentAccess: (requiredDepartment?: string) => Promise<boolean>
  checkDbSelfAccess: (targetUserId: string) => Promise<boolean>
  executeWithDbPermission: <T>(operation: () => Promise<T>, requiredPermission?: string, fallbackValue?: T) => Promise<T>
  executeWithDbDepartmentAccess: <T>(operation: () => Promise<T>, requiredDepartment?: string, fallbackValue?: T) => Promise<T>
  isAuthenticated: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 초기 로딩 시 localStorage에서 사용자 정보 복원
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          const userData: User = JSON.parse(storedUser)
          console.log('UserContext: localStorage에서 사용자 정보 복원:', userData)
          setUser(userData)
        } else {
          console.log('UserContext: localStorage에 사용자 정보 없음, 쿠키 세션 확인 시도...')
          try {
            const response = await fetch('/api/auth/me')
            if (response.ok) {
              const data = await response.json()
              console.log('UserContext: 쿠키 세션에서 사용자 정보 복원 성공:', data.user)
              setUser(data.user)
              localStorage.setItem('user', JSON.stringify(data.user))
            } else {
              console.log('UserContext: 쿠키 세션 확인 실패:', response.status)
            }
          } catch (apiError) {
            console.error('UserContext: 세션 확인 API 호출 오류:', apiError)
          }
        }
      } catch (err) {
        console.error('UserContext: 사용자 정보 로드 중 오류:', err)
        localStorage.removeItem('user')
      } finally {
        setLoading(false)
      }
    }

    loadUserFromStorage()
  }, [])

  // 로그인 함수
  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('UserContext: 로그인 시도:', username)
      
      const user = await UserService.login(username, password)
      if (user) {
        console.log('UserContext: 로그인 성공:', user.username)
        setUser(user)
        
        // 데이터베이스 권한 관리에 세션 설정
        try {
          await databaseAuth.setUserSession(user.id)
        } catch (dbError) {
          console.warn('UserContext: 데이터베이스 세션 설정 실패:', dbError)
        }
        
        // localStorage에 사용자 정보 저장
        localStorage.setItem('user', JSON.stringify(user))
        
        return true
      } else {
        setError('사용자명 또는 비밀번호가 올바르지 않습니다.')
        return false
      }
    } catch (err) {
      console.error('UserContext: 로그인 오류:', err)
      const errorMessage = err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다.'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  // 로그아웃 함수
  const logout = useCallback(async () => {
    try {
      // 1. 상태 초기화
      setUser(null)
      setError(null)
      setLoading(false)
      
      // 2. 로컬 스토리지 및 쿠키 정리
      localStorage.removeItem('user')
      document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
      
      // 3. 서버 세션 정리 (비동기 시도하되 기다리지 않음 또는 에러 무시)
      try {
        await databaseAuth.cleanupSession()
      } catch (e) {
        console.warn('세션 정리 중 오류 (무시됨):', e)
      }

      // 4. 로그인 페이지로 강제 이동 (replace를 사용하여 뒤로가기 방지)
      window.location.replace('/login')
    } catch (error) {
      console.error('UserContext: 로그아웃 처리 중 치명적 오류:', error)
      // 오류 발생 시에도 강제 이동 시도
      window.location.replace('/login')
    }
  }, [])

  // 권한 확인 함수들 (useUser.ts에서 가져옴)
  const hasPermission = useCallback((permission: string): boolean => {
    if (!user) return false
    if (user.id === 'admin' || user.username === 'admin' || user.level === 'admin' || user.level === 'administrator') return true
    
    const requiredLevel = parseInt(permission.replace('level', ''))
    const userLevel = typeof user.level === 'number' ? user.level : 1
    return userLevel >= requiredLevel
  }, [user])

  const isAdmin = useCallback((): boolean => {
    if (!user) return false
    const userPermissions = user.permissions || UserService.mapLevelToPermissions(String(user.level))
    return PermissionManager.isAdmin(userPermissions as PermissionType[])
  }, [user])

  const hasLevel = useCallback((level: number): boolean => {
    if (!user) return false
    const userPermissions = user.permissions || UserService.mapLevelToPermissions(String(user.level))
    return PermissionManager.hasLevel(userPermissions as PermissionType[], level)
  }, [user])

  const canAccessFeature = useCallback((feature: string): boolean => {
    if (!user) return false
    const userPermissions = user.permissions || UserService.mapLevelToPermissions(String(user.level))
    return PermissionManager.canAccessFeature(userPermissions as PermissionType[], feature)
  }, [user])

  const canEdit = useCallback((): boolean => {
    if (!user) return false
    const userPermissions = user.permissions || UserService.mapLevelToPermissions(String(user.level))
    return PermissionManager.canEdit(userPermissions as PermissionType[])
  }, [user])

  const canEditWithDbPermission = useCallback(async (): Promise<boolean> => {
    if (!user) return false
    if (user.id === 'admin' || user.username === 'admin' || user.level === 'admin' || user.level === 'administrator') return true
    
    const userPermissions = user.permissions || UserService.mapLevelToPermissions(String(user.level))
    return PermissionManager.hasLevel(userPermissions, 3)
  }, [user])

  const checkDbPermission = useCallback(async (requiredPermission: string = 'level1'): Promise<boolean> => {
    if (!user) return false
    if (user.id === 'admin' || user.username === 'admin' || user.level === 'admin' || user.level === 'administrator') return true
    
    const requiredLevel = parseInt(requiredPermission.replace('level', ''))
    const userLevel = typeof user.level === 'number' ? user.level : 1
    return userLevel >= requiredLevel
  }, [user])

  const checkDbDepartmentAccess = useCallback(async (requiredDepartment: string = '전기팀'): Promise<boolean> => {
    if (!user) return false
    return await databaseAuth.checkDepartmentAccess(requiredDepartment)
  }, [user])

  const checkDbSelfAccess = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!user) return false
    return await databaseAuth.checkSelfAccess(targetUserId)
  }, [user])

  const executeWithDbPermission = useCallback(async <T extends unknown>(
    operation: () => Promise<T>,
    requiredPermission: string = 'level1',
    fallbackValue?: T
  ): Promise<T> => {
    if (!user) throw new Error('로그인이 필요합니다.')
    return await databaseAuth.executeWithPermission(operation, requiredPermission, fallbackValue)
  }, [user])

  const executeWithDbDepartmentAccess = useCallback(async <T extends unknown>(
    operation: () => Promise<T>,
    requiredDepartment: string = '전기팀',
    fallbackValue?: T
  ): Promise<T> => {
    if (!user) throw new Error('로그인이 필요합니다.')
    return await databaseAuth.executeWithDepartmentAccess(operation, requiredDepartment, fallbackValue)
  }, [user])

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    hasPermission,
    isAdmin,
    hasLevel,
    canAccessFeature,
    canEdit,
    canEditWithDbPermission,
    checkDbPermission,
    checkDbDepartmentAccess,
    checkDbSelfAccess,
    executeWithDbPermission,
    executeWithDbDepartmentAccess,
    isAuthenticated: !!(user && user.id && user.username),
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUserContext() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider')
  }
  return context
}
