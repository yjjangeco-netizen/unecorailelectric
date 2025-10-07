'use client'

import { useCallback } from 'react'
import { useUser } from './useUser'

interface AccessLogData {
  action: 'login' | 'logout' | 'page_view' | 'button_click' | 'form_submit' | 'file_download' | 'file_upload'
  page: string
  details?: string
  ipAddress?: string
  userAgent?: string
}

export function useAccessLog() {
  const { user } = useUser()

  const logAccess = useCallback(async (logData: AccessLogData) => {
    if (!user) return

    try {
      // IP 주소 가져오기 (클라이언트에서는 추정치)
      const ipAddress = logData.ipAddress || 'unknown'
      const userAgent = logData.userAgent || navigator.userAgent

      await fetch('/api/access-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          username: user.name,
          userLevel: user.level,
          action: logData.action,
          page: logData.page,
          details: logData.details,
          ipAddress,
          userAgent,
        }),
      })
    } catch (error) {
      console.error('접속 로그 기록 실패:', error)
    }
  }, [user])

  const logPageView = useCallback((page: string, details?: string) => {
    logAccess({
      action: 'page_view',
      page,
      details,
    })
  }, [logAccess])

  const logButtonClick = useCallback((page: string, buttonName: string, details?: string) => {
    logAccess({
      action: 'button_click',
      page,
      details: `${buttonName}${details ? ` - ${details}` : ''}`,
    })
  }, [logAccess])

  const logFormSubmit = useCallback((page: string, formName: string, details?: string) => {
    logAccess({
      action: 'form_submit',
      page,
      details: `${formName}${details ? ` - ${details}` : ''}`,
    })
  }, [logAccess])

  const logFileDownload = useCallback((page: string, fileName: string, details?: string) => {
    logAccess({
      action: 'file_download',
      page,
      details: `${fileName}${details ? ` - ${details}` : ''}`,
    })
  }, [logAccess])

  const logFileUpload = useCallback((page: string, fileName: string, details?: string) => {
    logAccess({
      action: 'file_upload',
      page,
      details: `${fileName}${details ? ` - ${details}` : ''}`,
    })
  }, [logAccess])

  return {
    logAccess,
    logPageView,
    logButtonClick,
    logFormSubmit,
    logFileDownload,
    logFileUpload,
  }
}
