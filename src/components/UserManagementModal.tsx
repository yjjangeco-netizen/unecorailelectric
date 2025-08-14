'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { User, Plus, Edit, Trash2 } from 'lucide-react'

interface UserManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UserManagementModal({ isOpen, onClose }: UserManagementModalProps) {
  const [users] = useState([
    { id: '1', username: 'admin', name: '관리자', role: '관리자', department: '전기팀' },
    { id: '2', username: 'electric', name: '전기팀', role: '전기팀', department: '전기팀' },
    { id: '3', username: 'user1', name: '일반사용자', role: '사용자', department: '전기팀' }
  ])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="h-5 w-5 text-blue-600" />
            <span>회원 관리</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 사용자 목록 */}
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 uppercase">사용자ID</th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 uppercase">이름</th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 uppercase">권한</th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 uppercase">부서</th>
                  <th className="border border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 uppercase">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id}>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{user.username}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{user.name}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{user.role}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">{user.department}</td>
                    <td className="border border-gray-300 px-3 py-2 text-sm">
                      <div className="flex space-x-1">
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3 mr-1" />
                          편집
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600">
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

          {/* 새 사용자 추가 버튼 */}
          <div className="flex justify-center">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              새 사용자 추가
            </Button>
          </div>

          {/* 닫기 버튼 */}
          <div className="flex justify-end">
            <Button onClick={onClose} variant="outline">
              닫기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 