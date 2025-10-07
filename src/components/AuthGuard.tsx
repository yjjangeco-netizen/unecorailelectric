'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'

interface AuthGuardProps {
  children: React.ReactNode
  requiredLevel?: number | string
  requiredPermissions?: string[]
  fallbackUrl?: string
  showLoading?: boolean
}

export default function AuthGuard({
  children,
  requiredLevel,
  requiredPermissions = [],
  fallbackUrl = '/',
  showLoading = true
}: AuthGuardProps) {
  const { user, isAuthenticated, loading: authLoading } = useUser()
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        // 1. 기본 인증 체크
        if (authLoading) {
          return // 아직 로딩 중
        }

        if (!isAuthenticated || !user) {
          console.log('AuthGuard: 인증되지 않은 사용자, 리다이렉트')
          router.push(fallbackUrl)
          return
        }

        // 2. 레벨 체크
        if (requiredLevel) {
          const userLevel = user.level || '1'
          const isAdministrator = userLevel === 'administrator' || userLevel === 'Administrator' || user.id === 'admin'
          
          if (!isAdministrator) {
            const levelNum = typeof userLevel === 'number' ? userLevel : parseInt(userLevel)
            const requiredLevelNum = typeof requiredLevel === 'number' ? requiredLevel : parseInt(requiredLevel)
            
            if (levelNum < requiredLevelNum) {
              console.log(`AuthGuard: 권한 부족 - 사용자 레벨: ${levelNum}, 필요 레벨: ${requiredLevelNum}`)
              router.push(fallbackUrl)
              return
            }
          }
        }

        // 3. 권한 체크
        if (requiredPermissions.length > 0) {
          const userPermissions = user.permissions || []
          const isAdministrator = user.level === 'administrator' || user.level === 'Administrator' || user.id === 'admin'
          const hasAllPermissions = requiredPermissions.every(permission => 
            userPermissions.includes(permission) || isAdministrator
          )
          
          if (!hasAllPermissions) {
            console.log(`AuthGuard: 권한 부족 - 필요 권한: ${requiredPermissions.join(', ')}`)
            router.push(fallbackUrl)
            return
          }
        }

        // 4. 쿠키 기반 추가 검증
        const authToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('auth-token='))
          ?.split('=')[1]

        if (!authToken) {
          console.log('AuthGuard: 쿠키에 인증 토큰 없음, 리다이렉트')
          router.push(fallbackUrl)
          return
        }

        // 5. 토큰 유효성 검증
        try {
          const tokenData = JSON.parse(atob(authToken))
          const tokenAge = Date.now() - tokenData.timestamp
          const maxAge = 7 * 24 * 60 * 60 * 1000 // 7일

          if (tokenAge > maxAge) {
            console.log('AuthGuard: 인증 토큰 만료, 리다이렉트')
            router.push(fallbackUrl)
            return
          }

          if (tokenData.id !== user.id || tokenData.username !== user.username) {
            console.log('AuthGuard: 토큰과 사용자 정보 불일치, 리다이렉트')
            router.push(fallbackUrl)
            return
          }
        } catch (error) {
          console.log('AuthGuard: 토큰 파싱 오류, 리다이렉트')
          router.push(fallbackUrl)
          return
        }

        console.log('AuthGuard: 인증 및 권한 확인 완료')
        setIsAuthorized(true)
      } catch (error) {
        console.error('AuthGuard: 인증 체크 오류:', error)
        router.push(fallbackUrl)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuthorization()
  }, [authLoading, isAuthenticated, user, requiredLevel, requiredPermissions, router, fallbackUrl])

  // 로딩 중이거나 인증 체크 중
  if (authLoading || checkingAuth) {
    if (!showLoading) return null
    
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">인증 확인 중...</p>
        </div>
      </div>
    )
  }

  // 인증되지 않았거나 권한이 없는 경우
  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
