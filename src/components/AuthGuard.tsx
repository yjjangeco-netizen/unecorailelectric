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
          console.log('AuthGuard: 인증되지 않은 사용자, 리다이렉트', { isAuthenticated, user, authLoading })
          // Check localStorage directly to see if it's a sync issue
          const stored = localStorage.getItem('user')
          console.log('AuthGuard: localStorage check:', stored)
          
          router.push(`${fallbackUrl}?source=authguard&reason=unauthorized`)
        }



        // 2. 레벨 체크
        if (requiredLevel) {
          const userLevel = user.level
          const isAdministrator = String(userLevel).toLowerCase() === 'administrator' || user.id === 'admin'
          
          // 관리자는 모든 페이지 접근 가능
          if (!isAdministrator) {
            const requiredLevelNum = typeof requiredLevel === 'string' ? parseInt(requiredLevel) : requiredLevel
            const userLevelNum = typeof userLevel === 'string' ? parseInt(userLevel) : userLevel
            
            // 사용자 레벨이 요구 레벨보다 낮으면 접근 불가
            if (isNaN(userLevelNum) || userLevelNum < requiredLevelNum) {
              console.log(`AuthGuard: 레벨 부족 - 요구 레벨: ${requiredLevel}, 사용자 레벨: ${userLevel}`)
              
              // 레벨 1, 2 사용자는 재고관리로, 레벨 3 이상은 대시보드로
              if (userLevelNum <= 2) {
                router.push('/stock-management')
              } else {
                router.push('/dashboard')
              }
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

        // 4. 쿠키 기반 추가 검증 (일시 비활성화: localhost 환경 호환성)
        /*
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
        */

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
  // 인증되지 않았거나 권한이 없는 경우
  if (!isAuthorized) {
    return null
  }

  return <>{children}</>
}
