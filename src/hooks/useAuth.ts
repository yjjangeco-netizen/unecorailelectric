import { useState, useEffect } from 'react'
import { CookieAuthManager, RBACManager } from '@/lib/auth'

export function useAuth() {
  const [user, setUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { isValid, user: authUser } = await CookieAuthManager.validateSession()
        setUser(isValid ? authUser : null)
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
      if (result.success) {
        setUser(result.user)
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
