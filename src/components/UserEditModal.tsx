'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
// import { Checkbox } from '@/components/ui/checkbox'
import { X, Save, User as UserIcon, Building, Briefcase, Shield, Home, Calendar, Package2, Users, Settings, FileText, BarChart3 } from 'lucide-react'
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

  // 메뉴 옵션 정의
  const menuOptions = [
    { key: 'stock_view', label: '재고 조회', icon: Package2 },
    { key: 'stock_in', label: '재고 입고', icon: Package2 },
    { key: 'stock_out', label: '재고 출고', icon: Package2 },
    { key: 'stock_disposal', label: '재고 폐기', icon: Package2 },
    { key: 'work_tools', label: '업무도구', icon: Settings },
    { key: 'daily_log', label: '업무일지', icon: Calendar },
    { key: 'work_manual', label: '메뉴얼 관리', icon: FileText },
    { key: 'sop', label: 'SOP', icon: FileText },
    { key: 'user_management', label: '회원관리', icon: Users },
  ]

  // 레벨별 기본 권한 설정
  const getDefaultPermissionsByLevel = (level: string) => {
    const permissions: { [key: string]: boolean } = {
      stock_view: false,
      stock_in: false,
      stock_out: false,
      stock_disposal: false,
      work_tools: false,
      daily_log: false,
      work_manual: false,
      sop: false,
      user_management: false,
    }

    switch (level) {
      case '1':
        // Level 1: 기본 조회 권한만
        permissions.stock_view = true
        permissions.daily_log = true
        break
      case '2':
        // Level 2: Level 1 + 업무도구
        permissions.stock_view = true
        permissions.daily_log = true
        permissions.work_tools = true
        break
      case '3':
        // Level 3: Level 2 + 재고 입출고
        permissions.stock_view = true
        permissions.stock_in = true
        permissions.stock_out = true
        permissions.daily_log = true
        permissions.work_tools = true
        break
      case '4':
        // Level 4: Level 3 + 메뉴얼 관리
        permissions.stock_view = true
        permissions.stock_in = true
        permissions.stock_out = true
        permissions.stock_disposal = true
        permissions.daily_log = true
        permissions.work_tools = true
        permissions.work_manual = true
        break
      case '5':
        // Level 5: Level 4 + SOP
        permissions.stock_view = true
        permissions.stock_in = true
        permissions.stock_out = true
        permissions.stock_disposal = true
        permissions.daily_log = true
        permissions.work_tools = true
        permissions.work_manual = true
        permissions.sop = true
        break
      case 'admin':
        // Admin: 모든 권한
        Object.keys(permissions).forEach(key => {
          permissions[key] = true
        })
        break
    }

    return permissions
  }

  useEffect(() => {
    if (user) {
      const level = user.level || '1'
      const defaultPermissions = getDefaultPermissionsByLevel(level)
      
      const initialData = {
        name: user.name || '',
        department: user.department || '',
        position: user.position || '',
        level: level,
        is_active: user.is_active,
        // 기존 권한이 있으면 유지, 없으면 레벨별 기본값 사용
        stock_view: user.stock_view !== undefined ? user.stock_view : defaultPermissions.stock_view,
        stock_in: user.stock_in !== undefined ? user.stock_in : defaultPermissions.stock_in,
        stock_out: user.stock_out !== undefined ? user.stock_out : defaultPermissions.stock_out,
        stock_disposal: user.stock_disposal !== undefined ? user.stock_disposal : defaultPermissions.stock_disposal,
        work_tools: user.work_tools !== undefined ? user.work_tools : defaultPermissions.work_tools,
        daily_log: user.daily_log !== undefined ? user.daily_log : defaultPermissions.daily_log,
        work_manual: user.work_manual !== undefined ? user.work_manual : defaultPermissions.work_manual,
        sop: user.sop !== undefined ? user.sop : defaultPermissions.sop,
        user_management: user.user_management !== undefined ? user.user_management : defaultPermissions.user_management,
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
    if (field === 'level') {
      // 레벨이 변경되면 해당 레벨의 기본 권한으로 업데이트
      const defaultPermissions = getDefaultPermissionsByLevel(value)
      setFormData(prev => ({ 
        ...prev, 
        [field]: value,
        ...defaultPermissions
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  if (!isOpen || !user) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
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
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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

          {/* 메뉴 권한 설정 */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900">메뉴 권한 설정</h3>
              <div className="text-xs text-gray-500">
                레벨 {formData.level} 권한 기준
              </div>
            </div>
            {/* 레벨별 권한 안내 */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-xs font-medium text-blue-900 mb-2">레벨별 기본 권한</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <div>• Level 1: 재고 조회, 업무일지</div>
                <div>• Level 2: Level 1 + 업무도구</div>
                <div>• Level 3: Level 2 + 재고 입출고</div>
                <div>• Level 4: Level 3 + 재고 폐기, 메뉴얼 관리</div>
                <div>• Level 5: Level 4 + SOP</div>
                <div>• Admin: 모든 권한</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {menuOptions.map((option) => {
                const Icon = option.icon
                const isChecked = formData[option.key as keyof User] as boolean || false
                const isDefaultForLevel = getDefaultPermissionsByLevel(formData.level || '1')[option.key]
                return (
                  <div key={option.key} className={`flex items-center space-x-2 p-2 rounded ${
                    isDefaultForLevel ? 'bg-green-50' : ''
                  }`}>
                    <input
                      type="checkbox"
                      id={option.key}
                      checked={isChecked}
                      onChange={(e) => handleChange(option.key as keyof User, e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={option.key} className="flex items-center space-x-1 text-sm text-gray-700">
                      <Icon className="h-4 w-4" />
                      <span>{option.label}</span>
                      {isDefaultForLevel && (
                        <span className="text-xs text-green-600 ml-1">(기본)</span>
                      )}
                    </label>
                  </div>
                )
              })}
            </div>
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
