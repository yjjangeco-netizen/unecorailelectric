'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Save, User, Building, Briefcase, Shield } from 'lucide-react'
import type { User } from '@/lib/types'

interface UserEditModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedUser: User) => void
}

export default function UserEditModal({ user, isOpen, onClose, onSave }: UserEditModalProps) {
  const [formData, setFormData] = useState<Partial<User>>({})
  const [loading, setLoading] = useState(false)
  const [originalData, setOriginalData] = useState<Partial<User>>({})

  useEffect(() => {
    if (user) {
      const initialData = {
        name: user.name || '',
        department: user.department || '',
        position: user.position || '',
        level: user.level || '1',
        is_active: user.is_active
      }
      setFormData(initialData)
      setOriginalData(initialData)
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    try {
      const updatedUser = { ...user, ...formData }
      await onSave(updatedUser)
      onClose()
    } catch (error) {
      console.error('사용자 수정 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof User, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">사용자 정보 수정</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {/* 이름 */}
          <div>
            <label className="block text-sm mb-1">이름</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${
                formData.name !== originalData.name ? 'text-blue-600' : 'text-gray-900'
              }`}
              required
            />
          </div>

          {/* 부서 */}
          <div>
            <label className="block text-sm mb-1">부서</label>
            <select
              value={formData.department || ''}
              onChange={(e) => handleChange('department', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${
                formData.department !== originalData.department ? 'text-blue-600' : 'text-gray-900'
              }`}
            >
              <option value="전기팀">전기팀</option>
              <option value="AS">AS</option>
              <option value="기계">기계</option>
              <option value="구매">구매</option>
              <option value="영업">영업</option>
            </select>
          </div>

          {/* 직책 */}
          <div>
            <label className="block text-sm mb-1">직책</label>
            <select
              value={formData.position || ''}
              onChange={(e) => handleChange('position', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${
                formData.position !== originalData.position ? 'text-blue-600' : 'text-gray-900'
              }`}
            >
              <option value="사원">사원</option>
              <option value="대리">대리</option>
              <option value="과장">과장</option>
              <option value="차장">차장</option>
              <option value="부장">부장</option>
            </select>
          </div>

          {/* 권한 레벨 */}
          <div>
            <label className="block text-sm mb-1">권한 레벨</label>
            <select
              value={formData.level || '1'}
              onChange={(e) => handleChange('level', e.target.value)}
              className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${
                formData.level !== originalData.level ? 'text-blue-600' : 'text-gray-900'
              }`}
            >
              <option value="1">Level 1</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* 활성 상태 */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active || false}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              className="h-4 w-4"
            />
            <label className={`text-sm ${
              formData.is_active !== originalData.is_active ? 'text-blue-600' : 'text-gray-900'
            }`}>계정 활성화</label>
          </div>

          {/* 버튼 */}
          <div className="flex items-center justify-end space-x-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {loading ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
