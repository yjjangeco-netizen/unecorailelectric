'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logError } from '@/lib/utils'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅
    logError('ErrorBoundary 에러 발생', error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'ErrorBoundary'
    })

    // 상태 업데이트
    this.setState({
      error,
      errorInfo
    })

    // 부모 컴포넌트에 에러 전달
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 있으면 사용
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 기본 에러 UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            
            <h1 className="text-lg font-semibold text-gray-900 mb-2">
              예상치 못한 오류가 발생했습니다
            </h1>
            
            <p className="text-sm text-gray-600 mb-6">
              애플리케이션에서 문제가 발생했습니다. 
              다시 시도하거나 메인 페이지로 돌아가주세요.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                  개발자 정보 (클릭하여 확장)
                </summary>
                <div className="bg-gray-100 rounded p-3 text-xs font-mono text-gray-800 overflow-auto max-h-40">
                  <div className="mb-2">
                    <strong>에러:</strong> {this.state.error.toString()}
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>컴포넌트 스택:</strong>
                      <pre className="whitespace-pre-wrap mt-1">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleRetry}
                className="flex items-center justify-center gap-2"
                variant="outline"
              >
                <RefreshCw className="h-4 w-4" />
                다시 시도
              </Button>
              
              <Button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2"
              >
                <Home className="h-4 w-4" />
                메인으로
              </Button>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                문제가 지속되면 관리자에게 문의하세요.
                <br />
                오류 ID: {this.state.error?.name || 'UNKNOWN'}
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 함수형 컴포넌트용 에러 바운더리
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback} {...(onError && { onError })}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

// 특정 에러 타입별 처리
export function handleSpecificError(error: Error): string {
  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return '네트워크 연결을 확인해주세요.'
  }
  
  if (error.name === 'TypeError' && error.message.includes('Cannot read')) {
    return '데이터를 불러오는 중 오류가 발생했습니다.'
  }
  
  if (error.message.includes('authentication')) {
    return '로그인이 필요합니다. 다시 로그인해주세요.'
  }
  
  if (error.message.includes('permission') || error.message.includes('unauthorized')) {
    return '이 작업을 수행할 권한이 없습니다.'
  }
  
  if (error.message.includes('validation')) {
    return '입력 데이터가 올바르지 않습니다.'
  }
  
  return '알 수 없는 오류가 발생했습니다.'
}

// 에러 복구 전략
export function getErrorRecoveryStrategy(error: Error): {
  action: string
  description: string
  buttonText: string
} {
  if (error.name === 'NetworkError') {
    return {
      action: 'retry',
      description: '네트워크 연결을 확인하고 다시 시도해주세요.',
      buttonText: '다시 시도'
    }
  }
  
  if (error.message.includes('authentication')) {
    return {
      action: 'redirect',
      description: '로그인 페이지로 이동합니다.',
      buttonText: '로그인하기'
    }
  }
  
  if (error.message.includes('permission')) {
    return {
      action: 'redirect',
      description: '메인 페이지로 돌아갑니다.',
      buttonText: '메인으로'
    }
  }
  
  return {
    action: 'retry',
    description: '잠시 후 다시 시도해주세요.',
    buttonText: '다시 시도'
  }
}
