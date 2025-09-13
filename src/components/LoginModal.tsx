'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { User, Lock } from 'lucide-react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onLogin: (username: string, password: string) => Promise<boolean>
}

export default function LoginModal({ isOpen, onClose, onLogin }: LoginModalProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const success = await onLogin(username, password)
      if (success) {
        setUsername('')
        setPassword('')
        setError('')
        onClose()
      } else {
        setError('로그인에 실패했습니다. 사용자명과 비밀번호를 확인해주세요.')
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" aria-describedby="login-description">
        <DialogHeader>
          <DialogTitle className="text-center">로그인</DialogTitle>
          <p id="login-description" className="text-sm text-gray-600 text-center">
            시스템에 로그인하여 재고 관리 기능을 사용하세요.
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 사용자명 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              사용자 ID
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="사용자 ID를 입력하세요"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* 비밀번호 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          {/* 버튼 그룹 */}
          <div className="flex space-x-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? '로그인 중...' : '로그인'}
            </Button>
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              취소
            </Button>
          </div>
        </form>

        {/* 테스트 계정 안내 */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700 text-center">
            <strong>테스트 계정:</strong><br />
            관리자: admin / admin<br />
            전기팀: electric / electric
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
} 