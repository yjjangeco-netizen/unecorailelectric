'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { logError } from '@/lib/utils'
import { Loader2, Shield, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RequireAuthProps {
  children: React.ReactNode
  requiredPermissions?: string[]
  requiredRole?: 'admin' | 'manager' | 'user'
  fallback?: React.ReactNode
  redirectTo?: string
  showUnauthorizedMessage?: boolean
}

export default function RequireAuth({
  children,
  requiredPermissions = [],
  requiredRole,
  fallback,
  redirectTo = '/',
  showUnauthorizedMessage = true
}: RequireAuthProps) {
  const { user, loading, isAuthenticated, hasPermission } = useAuth()
  const router = useRouter()
  const [accessDenied, setAccessDenied] = useState(false)

  useEffect(() => {
    if (!loading) {
      // 인증되지 않은 경우
      if (!isAuthenticated) {
        logError('인증 필요', new Error('로그인이 필요합니다'), { 
          path: window.location.pathname,
          user: null 
        })
        router.push(redirectTo)
        return
      }

      // 역할 기반 접근 제어
      if (requiredRole && user?.role) {
        const roleHierarchy = { admin: 3, manager: 2, user: 1 }
        const userRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0
        const requiredRoleLevel = roleHierarchy[requiredRole] || 0

        if (userRoleLevel < requiredRoleLevel) {
          logError('권한 부족', new Error(`역할 권한이 부족합니다. 필요: ${requiredRole}, 현재: ${user.role}`), {
            path: window.location.pathname,
            user: user,
            requiredRole,
            currentRole: user.role
          })
          setAccessDenied(true)
          return
        }
      }

      // 권한 기반 접근 제어
      if (requiredPermissions.length > 0) {
        const hasAllPermissions = requiredPermissions.every(permission => 
          hasPermission(permission)
        )

        if (!hasAllPermissions) {
          logError('권한 부족', new Error(`필요한 권한이 부족합니다: ${requiredPermissions.join(', ')}`), {
            path: window.location.pathname,
            user: user,
            requiredPermissions,
            userPermissions: user?.role
          })
          setAccessDenied(true)
          return
        }
      }

      // 모든 검증 통과
      setAccessDenied(false)
    }
  }, [loading, isAuthenticated, user, requiredPermissions, requiredRole, hasPermission, router, redirectTo])

  // 로딩 중
  if (loading) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">인증 상태를 확인하는 중...</p>
        </div>
      </div>
    )
  }

  // 인증되지 않은 경우
  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">접근 제한됨</h2>
          <p className="text-gray-600 mb-4">이 페이지에 접근하려면 로그인이 필요합니다.</p>
          <Button onClick={() => router.push('/')}>
            로그인 페이지로 이동
          </Button>
        </div>
      </div>
    )
  }

  // 권한 부족
  if (accessDenied) {
    if (showUnauthorizedMessage) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">권한 부족</h2>
            <p className="text-gray-600 mb-4">
              이 페이지에 접근할 권한이 없습니다.
              {requiredRole && (
                <span className="block mt-2">
                  필요 권한: <span className="font-semibold">{requiredRole}</span>
                  <br />
                  현재 권한: <span className="font-semibold">{user?.role}</span>
                </span>
              )}
            </p>
            <div className="space-y-2">
              <Button onClick={() => router.push('/')} variant="outline" className="w-full">
                메인으로 돌아가기
              </Button>
              <Button onClick={() => router.back()} className="w-full">
                이전 페이지로
              </Button>
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  // 모든 검증 통과 - 자식 컴포넌트 렌더링
  return <>{children}</>
}

// 고차 컴포넌트 (HOC) 형태
export function withAuth<T extends object>(
  Component: React.ComponentType<T>,
  options: Omit<RequireAuthProps, 'children'> = {}
) {
  return function AuthenticatedComponent(props: T) {
    return (
      <RequireAuth {...options}>
        <Component {...props} />
      </RequireAuth>
    )
  }
}

// 역할별 접근 제어 래퍼
export function withRole<T extends object>(
  Component: React.ComponentType<T>,
  requiredRole: 'admin' | 'manager' | 'user'
) {
  return withAuth(Component, { requiredRole })
}

// 권한별 접근 제어 래퍼
export function withPermission<T extends object>(
  Component: React.ComponentType<T>,
  requiredPermissions: string[]
) {
  return withAuth(Component, { requiredPermissions })
}

// 관리자 전용 컴포넌트
export function AdminOnly<T extends object>(Component: React.ComponentType<T>) {
  return withRole(Component, 'admin')
}

// 관리자/매니저 전용 컴포넌트
export function ManagerOnly<T extends object>(Component: React.ComponentType<T>) {
  return withRole(Component, 'manager')
}

// 인증된 사용자 전용 컴포넌트
export function AuthenticatedOnly<T extends object>(Component: React.ComponentType<T>) {
  return withAuth(Component)
}
