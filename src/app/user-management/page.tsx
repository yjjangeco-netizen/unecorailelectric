'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import CommonHeader from '@/components/CommonHeader'
import UserEditModal from '@/components/UserEditModal'
import { Package, User, Plus, Edit, Trash2, Search } from 'lucide-react'
import type { User as UserType, PositionType, DepartmentType, PermissionType } from '@/lib/types'

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; level: string } | null>(null)

  // 사용자 목록 로드
  useEffect(() => {
    loadUsers()
    // 로그인 상태 확인 - user 키로 저장된 정보 사용
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        console.log('사용자 관리 페이지 사용자 정보:', userData)
        setCurrentUser({
          id: userData.id || userData.username,
          name: userData.name,
          level: userData.level || '1'
        })
      } catch (error) {
        console.error('사용자 정보 파싱 오류:', error)
      }
    }
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('사용자 목록 로드 시작...')
      
      const response = await fetch('/api/users')
      console.log('API 응답 상태:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('API 오류 응답:', errorText)
        throw new Error(`사용자 목록을 가져오는데 실패했습니다. (${response.status})`)
      }
      
      const data = await response.json()
      console.log('API 응답 데이터:', data)
      console.log('사용자 수:', data.users?.length || 0)
      
      setUsers(data.users || [])
    } catch (error) {
      console.error('사용자 목록 로드 오류:', error)
      setError(error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: UserType) => {
    setEditingUser(user)
    setShowEditModal(true)
  }

  const handleDeleteUser = async (user: UserType) => {
    if (confirm(`사용자 "${user.name}"을(를) 삭제하시겠습니까?`)) {
      try {
        const response = await fetch(`/api/users?id=${user.id}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          alert('사용자가 성공적으로 삭제되었습니다.')
          loadUsers() // 목록 새로고침
        } else {
          const errorData = await response.json()
          alert(`삭제 실패: ${errorData.error}`)
        }
      } catch (error) {
        console.error('사용자 삭제 오류:', error)
        alert('사용자 삭제 중 오류가 발생했습니다.')
      }
    }
  }

  const handleSaveUser = async (updatedUser: UserType) => {
    try {
      setLoading(true)
      
      // API 호출로 사용자 정보 업데이트
      const response = await fetch(`/api/users`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: updatedUser.id,
          name: updatedUser.name,
          department: updatedUser.department,
          position: updatedUser.position,
          level: updatedUser.level,
          is_active: updatedUser.is_active
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API 응답 오류:', response.status, errorData)
        throw new Error(`사용자 정보 업데이트에 실패했습니다. (${response.status})`)
      }

      const result = await response.json()
      console.log('사용자 정보 업데이트 성공:', result)
      
      // 성공 메시지 표시
      alert('사용자 정보가 성공적으로 업데이트되었습니다.')
      
      // 사용자 목록을 다시 로드하여 최신 데이터 반영
      await loadUsers()
      
      setShowEditModal(false)
      setEditingUser(null)
    } catch (error) {
      console.error('사용자 정보 업데이트 오류:', error)
      alert('사용자 정보 업데이트에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTestUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/add-test-users', {
        method: 'POST'
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`테스트 사용자 추가 실패: ${errorText}`)
      }

      const data = await response.json()
      console.log('테스트 사용자 추가 결과:', data)
      
      // 목록 새로고침
      await loadUsers()
    } catch (error) {
      console.error('테스트 사용자 추가 오류:', error)
      setError(error instanceof Error ? error.message : '테스트 사용자 추가 실패')
    } finally {
      setLoading(false)
    }
  }

  // 검색 필터링
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.department?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (user.position?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 공통 헤더 추가 */}
      <CommonHeader
        currentUser={currentUser}
        isAdmin={currentUser?.level === 'administrator' || currentUser?.level === '5'}
        title="회원관리"
        showBackButton={true}
        backUrl="/dashboard"
      />
      
      <div className="max-w-6xl mx-auto p-6">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">회원관리</h1>
            </div>
            <Button 
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              새 사용자 추가
            </Button>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="이름, ID, 부서, 직책으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <Button variant="outline" onClick={loadUsers} className="mr-2">
              새로고침
            </Button>
            <Button 
              onClick={handleAddTestUsers}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              테스트 사용자 추가
            </Button>
          </div>
        </div>

        {/* 사용자 목록 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">사용자 목록</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">사용자 정보를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">오류가 발생했습니다</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button 
                onClick={loadUsers}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                다시 시도
              </Button>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">사용자를 찾을 수 없습니다</h3>
              <p className="text-gray-600 mb-4">데이터베이스에 사용자 데이터가 없거나 권한이 없습니다.</p>
              <Button 
                onClick={loadUsers}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                새로고침
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">ID</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">이름</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">부서</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">직책</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">이메일</th>
                                         <th className="text-left py-3 px-4 font-medium text-gray-700">권한</th>
                     <th className="text-left py-3 px-4 font-medium text-gray-700">작업</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{user.id}</td>
                                             <td className="py-3 px-4 font-medium text-gray-900">{user.name}</td>
                                             <td className="py-3 px-4 font-medium text-gray-900">{user.department}</td>
                       <td className="py-3 px-4 font-medium text-gray-900">{user.position}</td>
                      <td className="py-3 px-4 text-gray-600">{user.username || '-'}</td>
                                             <td className="py-3 px-4 font-medium text-gray-900">{user.level}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 border-blue-300 hover:bg-blue-50"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            수정
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            삭제
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">사용자를 찾을 수 없습니다.</p>
            </div>
          )}
        </div>
      </div>

      {/* 사용자 수정 모달 */}
      <UserEditModal
        user={editingUser}
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditingUser(null)
        }}
        onSave={handleSaveUser}
      />
    </div>
  )
}
