'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { CalendarIcon, Sparkles, Users, Filter, Loader2 } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { format } from 'date-fns'

interface User {
  id: string
  name: string
  department?: string
  position?: string
}

interface WorkDiarySummaryModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function WorkDiarySummaryModal({ isOpen, onClose }: WorkDiarySummaryModalProps) {
  const { user } = useUser()
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: ''
  })
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isAllSelected, setIsAllSelected] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showUserList, setShowUserList] = useState(false)
  const [summary, setSummary] = useState<any>(null)

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
        setUsers(data.users || data || [])
      } else {
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
        endDate: format(lastDay, 'yyyy-MM-dd')
      })
      
      setShowUserList(false)
      setSummary(null)
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

  const handleAnalyze = async () => {
    if (!formData.startDate || !formData.endDate) {
      alert('기간을 선택해주세요')
      return
    }

    if (selectedUsers.length === 0) {
      alert('부서원을 선택해주세요')
      return
    }

    setIsAnalyzing(true)
    try {
      const params = new URLSearchParams({
        startDate: formData.startDate,
        endDate: formData.endDate,
        userIds: selectedUsers.join(',')
      })

      const response = await fetch(`/api/work-diary/ai-summary?${params}`, {
        headers: {
          'x-user-level': user?.level?.toString() || '1',
          'x-user-id': user?.id || ''
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      } else {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || 'AI 분석 실패')
      }
    } catch (error) {
      console.error('AI 분석 실패:', error)
      alert(`AI 분석 중 오류가 발생했습니다: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            AI 업무일지 요약 분석
          </DialogTitle>
        </DialogHeader>

        {!summary ? (
          <div className="space-y-6 py-4">
            {/* 기간 선택 */}
            <div className="space-y-3">
              <Label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-blue-600" />
                분석 기간
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

            {/* 안내 메시지 */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold text-purple-900 mb-2 text-sm">🤖 AI 분석 안내</p>
                  <ul className="space-y-1.5 text-sm text-purple-800">
                    <li>• 선택한 기간의 업무일지를 AI가 분석합니다</li>
                    <li>• 업무 투입 시간, 난이도, 개선점을 제시합니다</li>
                    <li>• 분석에는 약 10~30초가 소요됩니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // 분석 결과 표시
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: summary.analysis }} />
          </div>
        )}

        <DialogFooter className="border-t pt-4 gap-2">
          {!summary ? (
            <>
              <Button 
                variant="outline" 
                onClick={onClose}
                disabled={isAnalyzing}
                className="flex-1 h-12 font-semibold"
              >
                취소
              </Button>
              <Button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || selectedUsers.length === 0}
                className="flex-1 h-12 font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    AI 분석 중...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    AI 분석 시작
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => setSummary(null)}
                className="flex-1 h-12 font-semibold"
              >
                다시 분석
              </Button>
              <Button 
                onClick={onClose}
                className="flex-1 h-12 font-semibold bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              >
                닫기
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

