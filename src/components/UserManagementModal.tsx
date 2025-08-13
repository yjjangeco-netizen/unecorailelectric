'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { User, UserPlus, Edit, Trash2, Users, UserCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { User as UserType, UserGroup } from '@/lib/supabase'

interface UserManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

interface UserWithGroups extends UserType {
  groups?: UserGroup[]
}

export default function UserManagementModal({ isOpen, onClose }: UserManagementModalProps) {
  const [users, setUsers] = useState<UserWithGroups[]>([])
  const [groups, setGroups] = useState<UserGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'users' | 'groups'>('users')

  // 사용자 관리 상태
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserType | null>(null)
  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    name: '',
    department: '',
    position: '',
    phone: '',
    is_admin: false
  })

  // 그룹 관리 상태
  const [showGroupForm, setShowGroupForm] = useState(false)
  const [editingGroup, setEditingGroup] = useState<UserGroup | null>(null)
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: ''
  })

  // 사용자 그룹 관리 상태
  const [showUserGroupForm, setShowUserGroupForm] = useState(false)
  const [selectedUserForGroup, setSelectedUserForGroup] = useState<UserType | null>(null)
  const [userGroupForm, setUserGroupForm] = useState({
    selectedGroups: [] as string[]
  })

  useEffect(() => {
    if (isOpen) {
      loadUsers()
      loadGroups()
    }
  }, [isOpen])

  const loadUsers = async () => {
    try {
      // 사용자와 그룹 정보를 함께 로드
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (usersError) throw usersError

      // 각 사용자의 그룹 정보를 로드
      const usersWithGroups = await Promise.all(
        (usersData || []).map(async (user) => {
          const { data: userGroups, error: groupError } = await supabase
            .from('user_group_members')
            .select(`
              group_id,
              user_groups (
                id,
                name,
                description
              )
            `)
            .eq('user_id', user.id)

          if (groupError) {
            console.error('사용자 그룹 로드 오류:', groupError)
            return { ...user, groups: [] }
          }

          const groups = userGroups?.map(ug => ug.user_groups).filter(Boolean) || []
          return { ...user, groups }
        })
      )

      setUsers(usersWithGroups)
    } catch (error) {
      console.error('사용자 로드 오류:', error)
    }
  }

  const loadGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('user_groups')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setGroups(data || [])
    } catch (error) {
      console.error('그룹 로드 오류:', error)
    }
  }

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingUser) {
        // 사용자 수정
        const { error } = await supabase
          .from('users')
          .update({
            username: userForm.username,
            password: userForm.password,
            name: userForm.name,
            department: userForm.department,
            position: userForm.position,
            phone: userForm.phone,
            is_admin: userForm.is_admin,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingUser.id)

        if (error) throw error
      } else {
        // 새 사용자 추가
        const { data, error } = await supabase
          .from('users')
          .insert([{
            username: userForm.username,
            password: userForm.password,
            name: userForm.name,
            department: userForm.department,
            position: userForm.position,
            phone: userForm.phone,
            is_admin: userForm.is_admin
          }])
          .select()

        if (error) throw error

        // 새 사용자를 Normal 그룹에 자동 추가
        if (data && data[0]) {
          const normalGroup = groups.find(g => g.name === 'Normal')
          if (normalGroup) {
            await supabase
              .from('user_group_members')
              .insert([{
                user_id: data[0].id,
                group_id: normalGroup.id
              }])
          }
        }
      }

      await loadUsers()
      resetUserForm()
    } catch (error) {
      console.error('사용자 저장 오류:', error)
      alert('사용자 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (editingGroup) {
        // 그룹 수정
        const { error } = await supabase
          .from('user_groups')
          .update({
            name: groupForm.name,
            description: groupForm.description
          })
          .eq('id', editingGroup.id)

        if (error) throw error
      } else {
        // 새 그룹 추가
        const { error } = await supabase
          .from('user_groups')
          .insert([{
            name: groupForm.name,
            description: groupForm.description
          }])

        if (error) throw error
      }

      await loadGroups()
      resetGroupForm()
    } catch (error) {
      console.error('그룹 저장 오류:', error)
      alert('그룹 저장 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('이 사용자를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) throw error
      await loadUsers()
    } catch (error) {
      console.error('사용자 삭제 오류:', error)
      alert('사용자 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('이 그룹을 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('user_groups')
        .delete()
        .eq('id', groupId)

      if (error) throw error
      await loadGroups()
    } catch (error) {
      console.error('그룹 삭제 오류:', error)
      alert('그룹 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleUserGroupAssignment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserForGroup) return

    setLoading(true)

    try {
      // 기존 그룹 멤버십 삭제
      await supabase
        .from('user_group_members')
        .delete()
        .eq('user_id', selectedUserForGroup.id)

      // 새 그룹 멤버십 추가
      if (userGroupForm.selectedGroups.length > 0) {
        const groupMemberships = userGroupForm.selectedGroups.map(groupId => ({
          user_id: selectedUserForGroup.id,
          group_id: groupId
        }))

        const { error } = await supabase
          .from('user_group_members')
          .insert(groupMemberships)

        if (error) throw error
      }

      await loadUsers()
      setShowUserGroupForm(false)
      setSelectedUserForGroup(null)
      setUserGroupForm({ selectedGroups: [] })
    } catch (error) {
      console.error('그룹 할당 오류:', error)
      alert('그룹 할당 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const resetUserForm = () => {
    setUserForm({
      username: '',
      password: '',
      name: '',
      department: '',
      position: '',
      phone: '',
      is_admin: false
    })
    setEditingUser(null)
    setShowUserForm(false)
  }

  const resetGroupForm = () => {
    setGroupForm({
      name: '',
      description: ''
    })
    setEditingGroup(null)
    setShowGroupForm(false)
  }

  const handleEditUser = (user: UserType) => {
    setEditingUser(user)
    setUserForm({
      username: user.username,
      password: user.password,
      name: user.name,
      department: user.department,
      position: user.position,
      phone: user.phone,
      is_admin: user.is_admin
    })
    setShowUserForm(true)
  }

  const handleEditGroup = (group: UserGroup) => {
    setEditingGroup(group)
    setGroupForm({
      name: group.name,
      description: group.description
    })
    setShowGroupForm(true)
  }

  const handleAssignGroups = (user: UserType) => {
    setSelectedUserForGroup(user)
    setUserGroupForm({
      selectedGroups: user.groups?.map(g => g.id) || []
    })
    setShowUserGroupForm(true)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>회원 관리</DialogTitle>
          <DialogDescription>
            사용자와 그룹을 관리할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        {/* 탭 네비게이션 */}
        <div className="flex space-x-1 border-b border-gray-200">
          <button
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === 'users'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('users')}
          >
            <Users className="h-4 w-4 inline mr-2" />
            사용자 관리
          </button>
          <button
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              activeTab === 'groups'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setActiveTab('groups')}
          >
            <UserPlus className="h-4 w-4 inline mr-2" />
            그룹 관리
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* 사용자 목록 */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">사용자 목록</h3>
              <Button onClick={() => setShowUserForm(true)} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                새 사용자
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">아이디</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">부서</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">직책</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">전화번호</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">관리자</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">그룹</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.username}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.is_admin ? '예' : '아니오'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-wrap gap-1">
                          {user.groups?.map(group => (
                            <span key={group.id} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {group.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="수정"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleAssignGroups(user)}
                            className="text-green-600 hover:text-green-900"
                            title="그룹 할당"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-900"
                            title="삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 사용자 추가/수정 폼 */}
            {showUserForm && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-md font-medium mb-4">
                  {editingUser ? '사용자 수정' : '새 사용자 추가'}
                </h4>
                <form onSubmit={handleSaveUser} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">아이디 *</label>
                      <input
                        type="text"
                        required
                        value={userForm.username}
                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 *</label>
                      <input
                        type="password"
                        required
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                      <input
                        type="text"
                        required
                        value={userForm.name}
                        onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">부서</label>
                      <input
                        type="text"
                        value={userForm.department}
                        onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">직책</label>
                      <input
                        type="text"
                        value={userForm.position}
                        onChange={(e) => setUserForm({ ...userForm, position: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                      <input
                        type="text"
                        value={userForm.phone}
                        onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_admin"
                      checked={userForm.is_admin}
                      onChange={(e) => setUserForm({ ...userForm, is_admin: e.target.checked })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="is_admin" className="text-sm font-medium text-gray-700">
                      관리자 권한
                    </label>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={resetUserForm}>
                      취소
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? '저장 중...' : '저장'}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* 사용자 그룹 할당 폼 */}
            {showUserGroupForm && selectedUserForGroup && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-md font-medium mb-4">
                  {selectedUserForGroup.name}님의 그룹 할당
                </h4>
                <form onSubmit={handleUserGroupAssignment} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">할당할 그룹 선택</label>
                    <div className="space-y-2">
                      {groups.map((group) => (
                        <label key={group.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={userGroupForm.selectedGroups.includes(group.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setUserGroupForm({
                                  ...userGroupForm,
                                  selectedGroups: [...userGroupForm.selectedGroups, group.id]
                                })
                              } else {
                                setUserGroupForm({
                                  ...userGroupForm,
                                  selectedGroups: userGroupForm.selectedGroups.filter(id => id !== group.id)
                                })
                              }
                            }}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="text-sm text-gray-700">{group.name}</span>
                          <span className="text-xs text-gray-500">({group.description})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowUserGroupForm(false)
                        setSelectedUserForGroup(null)
                        setUserGroupForm({ selectedGroups: [] })
                      }}
                    >
                      취소
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? '저장 중...' : '그룹 할당'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="space-y-4">
            {/* 그룹 목록 */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">그룹 목록</h3>
              <Button onClick={() => setShowGroupForm(true)} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                새 그룹
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">그룹명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">설명</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">생성일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작업</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groups.map((group) => (
                    <tr key={group.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {group.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {group.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(group.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditGroup(group)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteGroup(group.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 그룹 추가/수정 폼 */}
            {showGroupForm && (
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-md font-medium mb-4">
                  {editingGroup ? '그룹 수정' : '새 그룹 추가'}
                </h4>
                <form onSubmit={handleSaveGroup} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">그룹명 *</label>
                    <input
                      type="text"
                      required
                      value={groupForm.name}
                      onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                    <textarea
                      value={groupForm.description}
                      onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={resetGroupForm}>
                      취소
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? '저장 중...' : '저장'}
                    </Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 