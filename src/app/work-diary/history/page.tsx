'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatDate } from '@/lib/utils'
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, CheckCircle, MessageSquare, Lock, Eye, Unlock, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface WorkDiary {
  id: number
  workDate: string
  workContent: string
  workType: string
  workSubType: string
  customProjectName: string
  projectId: number | null
  isConfirmed: boolean
  adminComment: string
  project: {
    project_name: string
    project_number: string
  } | null
  user?: {
    name: string
    level: string
    department: string
  }
}

export default function WorkDiaryHistoryPage() {
  const { user, isAuthenticated, loading: authLoading } = useUser()
  const router = useRouter()

  const [diaries, setDiaries] = useState<WorkDiary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  
  // Admin Filter
  const [filterUserId, setFilterUserId] = useState('all')
  const [users, setUsers] = useState<{ id: string, name: string }[]>([])

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [editingDiary, setEditingDiary] = useState<WorkDiary | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editWorkType, setEditWorkType] = useState('')
  const [editWorkSubType, setEditWorkSubType] = useState('')

  // Comment Modal State
  const [isCommentOpen, setIsCommentOpen] = useState(false)
  const [commentingDiary, setCommentingDiary] = useState<WorkDiary | null>(null)
  const [adminComment, setAdminComment] = useState('')

  // Detail Modal State
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<WorkDiary[]>([])

  const isLevel5OrAdmin = user?.level === '5' || user?.level?.toLowerCase() === 'administrator'

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (user) {
      fetchDiaries()
      if (isLevel5OrAdmin) {
        fetchUsers()
      }
    }
  }, [user, page, startDate, endDate, filterUserId])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: {
          'x-user-id': user?.id || '',
          'x-user-level': user?.level || ''
        }
      })
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
  }

  const fetchDiaries = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: '100', // Increase limit to fetch more for grouping
        userLevel: user?.level || '1',
      })

      if (!isLevel5OrAdmin) {
        queryParams.append('userId', user?.id || '')
      } else if (filterUserId !== 'all') {
        queryParams.append('userId', filterUserId)
      }

      if (startDate) queryParams.append('startDate', startDate)
      if (endDate) queryParams.append('endDate', endDate)

      const response = await fetch(`/api/work-diary?${queryParams.toString()}`, {
        cache: 'no-store',
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
          'x-user-id': user?.id || '',
          'x-user-level': user?.level || ''
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDiaries(data.data)
        setTotalPages(data.totalPages)
        setTotalCount(data.total)
      }
    } catch (error) {
      console.error('Failed to fetch diaries:', error)
    } finally {
      setLoading(false)
    }
  }

  // Group diaries by date and user
  const groupedDiaries = diaries.reduce((acc, diary) => {
    const key = `${diary.workDate}-${diary.user?.name || 'unknown'}`
    if (!acc[key]) {
      acc[key] = []
    }
    acc[key].push(diary)
    return acc
  }, {} as Record<string, WorkDiary[]>)

  const sortedGroups = Object.values(groupedDiaries).sort((a, b) => {
    return new Date(b[0].workDate).getTime() - new Date(a[0].workDate).getTime()
  })

  // Filter groups by search term
  const filteredGroups = sortedGroups.filter(group => {
    return group.some(diary => 
      (diary.workContent?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (diary.project?.project_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (diary.project?.project_number?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (diary.customProjectName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (diary.user?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )
  })

  const handleDelete = async (id: number) => {
    if (!confirm('정말로 이 업무일지를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/work-diary/${id}`, {
        method: 'DELETE',
        headers: {
            'x-user-id': user?.id || '',
            'x-user-level': user?.level || ''
        }
      })

      if (response.ok) {
        alert('삭제되었습니다.')
        fetchDiaries()
        // Update selected group if open
        if (isDetailOpen) {
            const updatedGroup = selectedGroup.filter(d => d.id !== id)
            if (updatedGroup.length === 0) {
                setIsDetailOpen(false)
            } else {
                setSelectedGroup(updatedGroup)
            }
        }
      } else {
        const errorData = await response.json()
        alert(`삭제 실패: ${errorData.error}`)
      }
    } catch (error) {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const openEditModal = (diary: WorkDiary) => {
    setEditingDiary(diary)
    setEditContent(diary.workContent)
    setEditWorkType(diary.workType)
    setEditWorkSubType(diary.workSubType)
    setIsEditOpen(true)
  }

  const handleUpdate = async () => {
    if (!editingDiary) return

    try {
      const response = await fetch(`/api/work-diary/${editingDiary.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-level': user?.level || ''
        },
        body: JSON.stringify({
          workContent: editContent,
          workType: editWorkType,
          workSubType: editWorkSubType,
        }),
      })

      if (response.ok) {
        alert('수정되었습니다.')
        setIsEditOpen(false)
        fetchDiaries()
        // Update detail view if open
        if (isDetailOpen) {
            const updatedGroup = selectedGroup.map(d => 
                d.id === editingDiary.id ? {
                    ...d,
                    workContent: editContent,
                    workType: editWorkType,
                    workSubType: editWorkSubType
                } : d
            )
            setSelectedGroup(updatedGroup)
        }
      } else {
        const errorData = await response.json()
        alert(`수정 실패: ${errorData.error}`)
      }
    } catch (error) {
      alert('수정 중 오류가 발생했습니다.')
    }
  }

  const handleToggleConfirm = async (diary: WorkDiary) => {
    try {
      const newStatus = !diary.isConfirmed
      const response = await fetch(`/api/work-diary/${diary.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user?.id || '',
          'x-user-level': user?.level || ''
        },
        body: JSON.stringify({
          isConfirmed: newStatus
        }),
      })

      if (response.ok) {
        fetchDiaries()
        if (isDetailOpen) {
            const updatedGroup = selectedGroup.map(d => 
                d.id === diary.id ? { ...d, isConfirmed: newStatus } : d
            )
            setSelectedGroup(updatedGroup)
        }
      } else {
        const errorData = await response.json()
        alert(`상태 변경 실패: ${errorData.error}`)
      }
    } catch (error) {
      alert('오류가 발생했습니다.')
    }
  }

  const handleToggleConfirmGroup = async (group: WorkDiary[]) => {
    try {
      const allConfirmed = group.every(d => d.isConfirmed)
      const newStatus = !allConfirmed
      
      // Optimistic update
      setDiaries(prev => prev.map(d => 
        group.some(g => g.id === d.id) ? { ...d, isConfirmed: newStatus } : d
      ))

      // Update all items in the group
      const promises = group.map(diary => 
        fetch(`/api/work-diary/${diary.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.id || '',
            'x-user-level': user?.level || ''
          },
          body: JSON.stringify({
            isConfirmed: newStatus
          }),
        })
      )

      await Promise.all(promises)
      fetchDiaries() // Re-fetch to ensure sync
      
      // Update detail view if open
      if (isDetailOpen) {
          const updatedGroup = selectedGroup.map(d => 
              group.some(g => g.id === d.id) ? { ...d, isConfirmed: newStatus } : d
          )
          setSelectedGroup(updatedGroup)
      }
    } catch (error) {
      alert('오류가 발생했습니다.')
      fetchDiaries() // Revert on error
    }
  }

  const openCommentModalForGroup = (group: WorkDiary[]) => {
    setCommentingDiary(group[0])
    setAdminComment(group[0].adminComment || '')
    setCommentingGroup(group)
    setIsCommentOpen(true)
  }

  const [commentingGroup, setCommentingGroup] = useState<WorkDiary[] | null>(null)

  const openCommentModal = (diary: WorkDiary) => {
    setCommentingDiary(diary)
    setCommentingGroup(null)
    setAdminComment(diary.adminComment || '')
    setIsCommentOpen(true)
  }

  const handleSaveComment = async () => {
    if (!commentingDiary && !commentingGroup) return

    try {
      const targets = commentingGroup || [commentingDiary!]
      
      // Optimistic update
      setDiaries(prev => prev.map(d => 
        targets.some(t => t.id === d.id) ? { ...d, adminComment: adminComment } : d
      ))

      const promises = targets.map(diary => 
        fetch(`/api/work-diary/${diary.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user?.id || '',
            'x-user-level': user?.level || ''
          },
          body: JSON.stringify({
            adminComment: adminComment
          }),
        })
      )

      await Promise.all(promises)

      alert('코멘트가 저장되었습니다.')
      setIsCommentOpen(false)
      fetchDiaries() // Re-fetch to ensure sync
      
      if (isDetailOpen) {
          const updatedGroup = selectedGroup.map(d => 
              targets.some(t => t.id === d.id) ? { ...d, adminComment: adminComment } : d
          )
          setSelectedGroup(updatedGroup)
      }
    } catch (error) {
      alert('오류가 발생했습니다.')
      fetchDiaries() // Revert on error
    }
  }

  const openDetailModal = (group: WorkDiary[]) => {
    setSelectedGroup(group)
    setIsDetailOpen(true)
  }

  if (authLoading || !isAuthenticated) return null

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">업무일지 작성 내역</h1>
          <Button variant="outline" size="sm" onClick={fetchDiaries} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>검색 및 필터</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>시작일</Label>
                <Input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>종료일</Label>
                <Input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                />
              </div>

              {isLevel5OrAdmin && (
                <div className="space-y-2">
                  <Label>사용자 필터</Label>
                  <Select value={filterUserId} onValueChange={setFilterUserId}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="전체 사용자" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 사용자</SelectItem>
                      {users.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2 md:col-span-1">
                <Label>검색어 (내용, 프로젝트명, 작성자)</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input 
                    placeholder="검색어를 입력하세요..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">상태</TableHead>
                  <TableHead className="w-[120px]">날짜</TableHead>
                  {isLevel5OrAdmin && <TableHead className="w-[100px]">작성자</TableHead>}
                  <TableHead className="w-[200px]">프로젝트</TableHead>
                  <TableHead className="w-[100px]">유형</TableHead>
                  <TableHead>내용 (요약)</TableHead>
                  <TableHead className="w-[140px] text-right">관리</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={isLevel5OrAdmin ? 7 : 6} className="text-center py-8">
                      로딩 중...
                    </TableCell>
                  </TableRow>
                ) : filteredGroups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isLevel5OrAdmin ? 7 : 6} className="text-center py-8 text-gray-500">
                      작성된 업무일지가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGroups.map((group, index) => {
                    const mainEntry = group[0]
                    const count = group.length
                    const isAllConfirmed = group.every(d => d.isConfirmed)
                    const commentCount = group.filter(d => d.adminComment).length
                    
                    return (
                      <TableRow 
                          key={`${mainEntry.workDate}-${mainEntry.user?.name}-${index}`} 
                          className={`cursor-pointer hover:bg-gray-50 ${isAllConfirmed ? 'bg-gray-50/50' : ''}`}
                          onClick={() => openDetailModal(group)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {isAllConfirmed ? (
                            <div className="flex items-center text-green-600" title="모두 확정됨">
                              <Lock className="w-4 h-4" />
                            </div>
                          ) : (
                            <div className="flex items-center text-gray-400" title="작성중 (일부 미확정)">
                              <Unlock className="w-4 h-4" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{formatDate(mainEntry.workDate)}</TableCell>
                        {isLevel5OrAdmin && (
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{mainEntry.user?.name}</span>
                            </div>
                          </TableCell>
                        )}
                        <TableCell>
                          {mainEntry.project ? (
                            <div className="flex flex-col">
                              <span className="font-medium truncate max-w-[180px]">
                                {mainEntry.project.project_name}
                                {count > 1 && <span className="text-gray-500 ml-1">외 {count - 1}건</span>}
                              </span>
                              <span className="text-xs text-gray-500">[{mainEntry.project.project_number}]</span>
                            </div>
                          ) : (
                            <span className="text-gray-600 truncate max-w-[180px]">
                                {mainEntry.customProjectName || '기타'}
                                {count > 1 && <span className="text-gray-500 ml-1">외 {count - 1}건</span>}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-sm">{mainEntry.workType}</span>
                            {mainEntry.workSubType && (
                              <span className="text-xs text-gray-500">{mainEntry.workSubType}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                              <span className="truncate max-w-[300px] block text-gray-600">
                                  {mainEntry.workContent}
                                  {count > 1 && <span className="text-gray-500 ml-1">외</span>}
                              </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end space-x-1">
                            {isLevel5OrAdmin && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => { e.stopPropagation(); handleToggleConfirmGroup(group); }}
                                  className={`h-8 w-8 ${isAllConfirmed ? 'text-green-600 hover:text-green-700' : 'text-gray-400 hover:text-green-600'}`}
                                  title={isAllConfirmed ? "전체 확정 취소" : "전체 확정"}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => { e.stopPropagation(); openCommentModalForGroup(group); }}
                                  className={`h-8 w-8 relative ${commentCount > 0 ? 'text-blue-600 hover:text-blue-700' : 'text-gray-400 hover:text-blue-600'}`}
                                  title="전체 코멘트 작성"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                  {commentCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold px-1 rounded-full min-w-[14px] h-[14px] flex items-center justify-center">
                                      {commentCount}
                                    </span>
                                  )}
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => { e.stopPropagation(); openDetailModal(group); }}
                              className="h-8 w-8 text-gray-600 hover:text-blue-600"
                              title="상세보기 및 수정"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Pagination */}
        <div className="flex justify-center items-center space-x-4 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            이전
          </Button>
          <span className="text-sm text-gray-600">
            {page} / {totalPages} 페이지
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            다음
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Detail Modal */}

      {/* Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-[800px] bg-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
                업무일지 상세 ({selectedGroup.length}건)
            </DialogTitle>
            <DialogDescription>
                {selectedGroup.length > 0 && (
                    <>
                        {formatDate(selectedGroup[0].workDate)} - {selectedGroup[0].user?.name}
                    </>
                )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {selectedGroup.map((diary, index) => (
                <div key={diary.id} className="border rounded-lg p-4 bg-gray-50 relative">
                    <div className="absolute top-4 right-4 flex gap-2">
                        {isLevel5OrAdmin && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleToggleConfirm(diary)}
                                    className={`h-6 w-6 ${diary.isConfirmed ? 'text-green-600' : 'text-gray-400'}`}
                                    title={diary.isConfirmed ? "확정 취소" : "확정"}
                                >
                                    <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => openCommentModal(diary)}
                                    className="h-6 w-6 text-blue-600"
                                    title="코멘트"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                        {!diary.isConfirmed && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditModal(diary)}
                                className="h-6 w-6 text-gray-600"
                                title="수정"
                            >
                                <Edit className="h-4 w-4" />
                            </Button>
                        )}
                        {(!diary.isConfirmed || isLevel5OrAdmin) && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(diary.id)}
                                className="h-6 w-6 text-red-600"
                                title="삭제"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pr-20">
                        <div>
                            <Label className="text-xs text-gray-500">프로젝트</Label>
                            <div className="font-medium mt-1">
                                {diary.project ? (
                                    <>
                                        <div>{diary.project.project_name}</div>
                                        <div className="text-sm text-gray-500">[{diary.project.project_number}]</div>
                                    </>
                                ) : (
                                    <div>{diary.customProjectName || '기타'}</div>
                                )}
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs text-gray-500">작업 유형</Label>
                            <div className="font-medium mt-1">
                                {diary.workType} 
                                {diary.workSubType && <span className="text-gray-500"> / {diary.workSubType}</span>}
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <Label className="text-xs text-gray-500">업무 내용</Label>
                        <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                            {diary.workContent}
                        </div>
                    </div>

                    {diary.adminComment && (
                        <div className="mt-4 bg-blue-50 p-3 rounded-md border border-blue-100">
                            <Label className="text-xs text-blue-600 font-bold flex items-center gap-1">
                                <MessageSquare className="w-3 h-3" /> 관리자 코멘트
                            </Label>
                            <div className="mt-1 text-sm text-blue-900 whitespace-pre-wrap">
                                {diary.adminComment}
                            </div>
                        </div>
                    )}
                </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="default" onClick={() => setIsDetailOpen(false)}>닫기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white">
          <DialogHeader>
            <DialogTitle>업무일지 수정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>작업 유형</Label>
                <Select value={editWorkType} onValueChange={setEditWorkType}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {['신규', '보완', 'AS', 'SS', 'OV', '기타'].map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>세부 유형</Label>
                <Select value={editWorkSubType} onValueChange={setEditWorkSubType}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-white">
                    {['내근', '출장', '외근', '전화'].map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>업무 내용</Label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[150px] bg-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>취소</Button>
            <Button onClick={handleUpdate} className="bg-blue-600 hover:bg-blue-700 text-white">저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Comment Modal */}
      <Dialog open={isCommentOpen} onOpenChange={setIsCommentOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white">
          <DialogHeader>
            <DialogTitle>관리자 코멘트 작성</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>코멘트 내용</Label>
              <Textarea
                value={adminComment}
                onChange={(e) => setAdminComment(e.target.value)}
                placeholder="업무일지에 대한 피드백이나 코멘트를 입력하세요."
                className="min-h-[150px] bg-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCommentOpen(false)}>취소</Button>
            <Button onClick={handleSaveComment} className="bg-blue-600 hover:bg-blue-700 text-white">저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
