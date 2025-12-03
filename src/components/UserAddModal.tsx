'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { User, Lock, Building, Briefcase, Mail } from 'lucide-react'

interface UserAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function UserAddModal({ isOpen, onClose, onSuccess }: UserAddModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    department: '전기팀',
    position: '사원',
    level: '1'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.username || !formData.password || !formData.name) {
      alert('사용자명, 비밀번호, 이름은 필수입니다')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        let errorMsg = data.error || '사용자 생성 실패'
        
        // 비밀번호 보안 기준 에러인 경우 상세 안내
        if (data.details && Array.isArray(data.details)) {
          errorMsg = '비밀번호 보안 기준:\n\n' + data.details.join('\n')
        }
        
        throw new Error(errorMsg)
      }

      alert('새 사용자가 추가되었습니다')
      setFormData({
        username: '',
        password: '',
        name: '',
        email: '',
        department: '전기팀',
        position: '사원',
        level: '1'
      })
      onSuccess()
      onClose()
    } catch (error) {
      console.error('사용자 추가 오류:', error)
      alert(`사용자 추가 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" />
            새 사용자 추가
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* 사용자명 */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-semibold">
              <User className="inline h-4 w-4 mr-1" />
              사용자명 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
              placeholder="로그인 ID"
              className="h-11"
              required
            />
          </div>

          {/* 비밀번호 */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-semibold">
              <Lock className="inline h-4 w-4 mr-1" />
              비밀번호 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="비밀번호 (4자 이상)"
              className="h-11"
              required
            />
            <p className="text-xs text-gray-500">✓ 최소 4자 이상 (숫자 또는 영문)</p>
          </div>

          {/* 이름 */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold">
              이름 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="실명"
              className="h-11"
              required
            />
          </div>

          {/* 이메일 */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold">
              <Mail className="inline h-4 w-4 mr-1" />
              이메일
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="email@example.com"
              className="h-11"
            />
          </div>

          {/* 부서 & 직책 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="department" className="text-sm font-semibold">
                <Building className="inline h-4 w-4 mr-1" />
                부서
              </Label>
              <Select value={formData.department} onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="전기팀">전기팀</SelectItem>
                  <SelectItem value="AS">AS</SelectItem>
                  <SelectItem value="기계">기계</SelectItem>
                  <SelectItem value="구매">구매</SelectItem>
                  <SelectItem value="영업">영업</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position" className="text-sm font-semibold">
                <Briefcase className="inline h-4 w-4 mr-1" />
                직책
              </Label>
              <Select value={formData.position} onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="사원">사원</SelectItem>
                  <SelectItem value="대리">대리</SelectItem>
                  <SelectItem value="과장">과장</SelectItem>
                  <SelectItem value="차장">차장</SelectItem>
                  <SelectItem value="부장">부장</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 권한 레벨 */}
          <div className="space-y-2">
            <Label htmlFor="level" className="text-sm font-semibold">
              권한 레벨
            </Label>
            <Select value={formData.level} onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="1">Level 1 - 기본</SelectItem>
                <SelectItem value="2">Level 2 - 일반</SelectItem>
                <SelectItem value="3">Level 3 - 담당</SelectItem>
                <SelectItem value="4">Level 4 - 관리</SelectItem>
                <SelectItem value="5">Level 5 - 최고관리자</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              ℹ️ 권한 레벨에 따라 메뉴 접근 권한이 자동으로 설정됩니다.
            </p>
          </div>
        </form>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? '추가 중...' : '추가'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

