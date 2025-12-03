'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { CalendarIcon, Download, FileText, Users, Filter } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface User {
  id: string
  name: string
  department?: string
  position?: string
}

interface WorkDiaryReportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WorkDiaryReportModal({ isOpen, onClose }: WorkDiaryReportModalProps) {
  const { user } = useUser()
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
    reportType: 'project', // 'project' | 'date' | 'user'
  })
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isAllSelected, setIsAllSelected] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showUserList, setShowUserList] = useState(false)

  // 사용자 목록 로드 함수
  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'x-user-level': user?.level?.toString() || '1',
          'x-user-id': user?.id || ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('사용자 목록 응답:', data)
        // API가 { users: [...] } 형식으로 반환
        setUsers(data.users || data || [])
      } else {
        console.error('사용자 목록 로드 실패:', response.status)
        setUsers([])
      }
    } catch (error) {
      console.error('사용자 목록 로드 실패:', error)
      setUsers([])
    }
  }, [user?.level, user?.id])

  // 모달이 열릴 때 사용자 목록 로드
  useEffect(() => {
    if (isOpen) {
      loadUsers()
      
      // 기본 날짜 설정 (이번 달)
      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
      
      setFormData({
        startDate: format(firstDay, 'yyyy-MM-dd'),
        endDate: format(lastDay, 'yyyy-MM-dd'),
        reportType: 'project'
      })
      
      setShowUserList(false)
    }
  }, [isOpen, loadUsers])

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId)
      } else {
        return [...prev, userId]
      }
    })
    setIsAllSelected(false)
  }

  const handleAllToggle = () => {
    if (isAllSelected) {
      setSelectedUsers([])
      setIsAllSelected(false)
    } else {
      setSelectedUsers(users?.map(u => u.id) || [])
      setIsAllSelected(true)
    }
  }

  const handleGenerate = async () => {
    if (!formData.startDate || !formData.endDate) {
      alert('기간을 선택해주세요')
      return
    }

    if (selectedUsers.length === 0) {
      alert('부서원을 선택해주세요')
      return
    }

    setIsGenerating(true)
    try {
      const params = new URLSearchParams({
        startDate: formData.startDate,
        endDate: formData.endDate,
        reportType: formData.reportType,
        userIds: selectedUsers.join(',')
      })

      const response = await fetch(`/api/work-diary/report?${params}`, {
        headers: {
          'x-user-level': user?.level?.toString() || '1',
          'x-user-id': user?.id || ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('보고서 데이터:', data)
        
        // PDF 생성 또는 프린트 다이얼로그 열기
        window.print()
      } else {
        throw new Error('보고서 생성 실패')
      }
    } catch (error) {
      console.error('보고서 생성 실패:', error)
      alert('보고서 생성 중 오류가 발생했습니다')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-white" />
            </div>
            업무일지 보고서 출력
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* 기간 선택 */}
          <div className="space-y-3">
            <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-blue-600" />
              출력 기간
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">시작일</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="h-11 border-gray-300"
                />
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-600">종료일</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="h-11 border-gray-300"
                />
              </div>
            </div>
          </div>

          {/* 부서원 선택 */}
          <div className="space-y-3">
            <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              부서원 선택
            </Label>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowUserList(!showUserList)}
              className="w-full justify-between h-11 border-2 hover:border-purple-400 transition-colors"
            >
              <span className="text-sm">
                {selectedUsers.length === 0 
                  ? '부서원을 선택하세요' 
                  : `${selectedUsers.length}명 선택됨`}
              </span>
              <Filter className="h-4 w-4 text-gray-500" />
            </Button>

            {showUserList && (
              <div className="border-2 border-purple-100 rounded-xl p-4 bg-purple-50/30 space-y-3">
                {/* 전체 선택 */}
                <label className="flex items-center gap-3 p-3 bg-white rounded-lg border-2 border-purple-200 cursor-pointer hover:bg-purple-50 transition-colors">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleAllToggle}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-bold text-gray-900 flex-1">
                    전체 선택
                  </span>
                  <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-2 py-1 rounded">
                    {users?.length || 0}명
                  </span>
                </label>

                {/* 개별 선택 */}
                <div className="grid grid-cols-1 gap-2 max-h-[240px] overflow-y-auto">
                  {users && users.length > 0 ? users.map(u => (
                    <label
                      key={u.id}
                      className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-purple-300 hover:bg-purple-50/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedUsers.includes(u.id)}
                        onCheckedChange={() => handleUserToggle(u.id)}
                        className="w-4 h-4"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 truncate">{u.name}</div>
                        {(u.department || u.position) && (
                          <div className="text-xs text-gray-500 truncate">
                            {u.department} {u.position}
                          </div>
                        )}
                      </div>
                    </label>
                  )) : (
                    <div className="text-center py-6 text-sm text-gray-500">
                      사용자 목록을 불러오는 중...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 출력 기준 */}
          <div className="space-y-3">
            <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-600" />
              출력 기준
            </Label>
            <Select
              value={formData.reportType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, reportType: value }))}
            >
              <SelectTrigger className="h-11 border-2 border-gray-300 hover:border-green-400 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="project">
                  <div className="flex items-center gap-2 py-1">
                    <span className="text-lg">📁</span>
                    <span className="font-medium">프로젝트별로 출력</span>
                  </div>
                </SelectItem>
                <SelectItem value="date">
                  <div className="flex items-center gap-2 py-1">
                    <span className="text-lg">📅</span>
                    <span className="font-medium">날짜별로 출력</span>
                  </div>
                </SelectItem>
                <SelectItem value="user">
                  <div className="flex items-center gap-2 py-1">
                    <span className="text-lg">👤</span>
                    <span className="font-medium">사용자별로 출력</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="border-t pt-4 gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isGenerating}
            className="flex-1 h-12 font-semibold"
          >
            취소
          </Button>
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating || selectedUsers.length === 0}
            className="flex-1 h-12 font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {isGenerating ? (
              '생성 중...'
            ) : (
              <>
                <Download className="h-5 w-5 mr-2" />
                보고서 출력
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
