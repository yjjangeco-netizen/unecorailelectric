'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Search, Save, User, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface PermissionManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

interface User {
  id: string
  username: string
  name: string
  role: string
}

interface MenuPermission {
  id: string
  menu_name: string
  menu_key: string
  access_permission: boolean
}

const MENU_ITEMS: MenuPermission[] = [
  { id: '1', menu_name: 'Dashboard', menu_key: 'dashboard', access_permission: false },
  { id: '2', menu_name: '사용자관리', menu_key: 'user_management', access_permission: false },
  { id: '3', menu_name: '입고관리', menu_key: 'inbound_management', access_permission: false },
  { id: '4', menu_name: '출고관리Ⅰ', menu_key: 'outbound_management_1', access_permission: false },
  { id: '5', menu_name: '재고현황', menu_key: 'stock_status', access_permission: false },
  { id: '6', menu_name: '자료관리', menu_key: 'data_management', access_permission: false },
  { id: '7', menu_name: '자재관리', menu_key: 'material_management', access_permission: false },
  { id: '8', menu_name: '입출고내역', menu_key: 'inout_history', access_permission: false },
  { id: '9', menu_name: '출고관리 Ⅱ', menu_key: 'outbound_management_2', access_permission: false },
  { id: '10', menu_name: '권한관리', menu_key: 'permission_management', access_permission: false },
  { id: '11', menu_name: '시스템관리', menu_key: 'system_management', access_permission: false }
]

export default function PermissionManagementModal({ isOpen, onClose }: PermissionManagementModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userPermissions, setUserPermissions] = useState<MenuPermission[]>([])
  const [searchName, setSearchName] = useState('')
  const [searchId, setSearchId] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // 사용자 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadUsers()
    }
  }, [isOpen])

  // 검색 필터링
  useEffect(() => {
    const filtered = users.filter(user => 
      user.name.toLowerCase().includes(searchName.toLowerCase()) &&
      user.username.toLowerCase().includes(searchId.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [users, searchName, searchId])

  const loadUsers = async () => {
    try {
      setLoading(true)
      // 실제 데이터베이스에서 사용자 정보를 가져오는 로직
      // 임시로 mock 데이터 사용
      const mockUsers: User[] = [
        { id: '1', username: 'A220907', name: '강다훈', role: '사용자' },
        { id: '2', username: 'A220906', name: '이민지', role: '사용자' },
        { id: '3', username: 'A220905', name: '정용상', role: '사용자' },
        { id: '4', username: 'A220904', name: '박은영', role: '사용자' },
        { id: '5', username: 'A220903', name: '최민정', role: '사용자' },
        { id: '6', username: 'A220902', name: '박기준', role: '사용자' },
        { id: '7', username: 'A220901', name: '김선우', role: '관리자' }
      ]
      setUsers(mockUsers)
      setFilteredUsers(mockUsers)
    } catch (error) {
      console.error('사용자 목록 로드 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUserSelect = async (user: User) => {
    setSelectedUser(user)
    // 사용자 권한 로드
    await loadUserPermissions(user.id)
  }

  const loadUserPermissions = async (userId: string) => {
    try {
      // 실제 데이터베이스에서 사용자 권한을 가져오는 로직
      // 임시로 mock 데이터 사용
      const mockPermissions = MENU_ITEMS.map(menu => ({
        ...menu,
        access_permission: Math.random() > 0.5 // 랜덤 권한 설정
      }))
      setUserPermissions(mockPermissions)
    } catch (error) {
      console.error('사용자 권한 로드 오류:', error)
    }
  }

  const handlePermissionChange = (menuId: string, checked: boolean) => {
    setUserPermissions(prev => 
      prev.map(menu => 
        menu.id === menuId 
          ? { ...menu, access_permission: checked }
          : menu
      )
    )
  }

  const handleSavePermissions = async () => {
    if (!selectedUser) return

    try {
      setSaving(true)
      // 실제 데이터베이스에 권한 저장하는 로직
      console.log('권한 저장:', selectedUser.username, userPermissions)
      
      // 성공 메시지 표시
      alert('권한이 성공적으로 저장되었습니다.')
    } catch (error) {
      console.error('권한 저장 오류:', error)
      alert('권한 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-gray-900">
            권한관리
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-full space-x-6">
          {/* 왼쪽 패널: 사용자 목록 */}
          <div className="w-1/2 space-y-4">
            {/* 검색 필터 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  성명
                </label>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  placeholder="성명으로 검색"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  아이디
                </label>
                <input
                  type="text"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  placeholder="아이디로 검색"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* 사용자 목록 테이블 */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      아이디
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                      성명
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user, index) => (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedUser?.id === user.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                      onClick={() => handleUserSelect(user)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="radio"
                          name="selectedUser"
                          checked={selectedUser?.id === user.id}
                          onChange={() => handleUserSelect(user)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {user.username}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {user.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 오른쪽 패널: 권한관리 상세정보 */}
          <div className="w-1/2 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              권한관리 상세정보
            </h3>
            
            {selectedUser ? (
              <div className="space-y-4">
                {/* 선택된 사용자 정보 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">
                        {selectedUser.name} ({selectedUser.username})
                      </p>
                      <p className="text-xs text-blue-700">
                        등급: {selectedUser.role}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 권한 설정 테이블 */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          #
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          메뉴명
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                          접근권한
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userPermissions.map((menu) => (
                        <tr key={menu.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {menu.id}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {menu.menu_name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={menu.access_permission}
                              onChange={(e) => handlePermissionChange(menu.id, e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 저장 버튼 */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleSavePermissions}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        권한 저장
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>사용자를 선택하여 권한을 관리하세요</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 