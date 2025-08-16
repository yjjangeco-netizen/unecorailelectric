import { useState, useEffect } from 'react'
import { CookieAuthManager, RBACManager } from '@/lib/auth'

// 사용자 타입 정의
interface User {
  id: string
  name: string
  email: string
  role: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { isValid, user: authUser } = await CookieAuthManager.validateSession()
        if (isValid && authUser) {
          // authUser의 타입을 User 타입에 맞게 변환
          const user: User = {
            id: authUser.id,
            name: authUser.username || authUser.email || 'Unknown',
            email: authUser.email || '',
            role: authUser.role
          }
          setUser(user)
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('인증 상태 확인 오류:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const result = await CookieAuthManager.login(username, password)
      if (result.success && result.user) {
        // result.user의 타입을 User 타입에 맞게 변환
        const user: User = {
          id: result.user.id,
          name: result.user.username || result.user.email || 'Unknown',
          email: result.user.email || '',
          role: result.user.role
        }
        setUser(user)
        return { success: true }
      }
      return { success: false, error: '로그인 실패' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '로그인 실패' }
    }
  }

  const logout = async () => {
    try {
      await CookieAuthManager.logout()
      setUser(null)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : '로그아웃 실패' }
    }
  }

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    hasPermission: (permission: string) => user ? RBACManager.hasPermission(user.role, permission) : false,
    canRender: (feature: string) => user ? RBACManager.canRender(user.role, feature) : false
  }
}
