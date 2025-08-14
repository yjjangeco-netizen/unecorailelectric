'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Building2, Calendar, ArrowLeft, Plus, Edit, Trash2, User, Clock, ExternalLink, Link, Unlink } from 'lucide-react'

interface WorkDiaryEntry {
  id: string
  date: string
  userId: string
  userName: string
  content: string
  createdAt: string
  updatedAt: string
  googleCalendarEventId?: string
  googleCalendarLink?: string
}

function WorkDiaryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [diaryEntries, setDiaryEntries] = useState<WorkDiaryEntry[]>([])
  const [showDiaryForm, setShowDiaryForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState<WorkDiaryEntry | null>(null)
  const [formContent, setFormContent] = useState('')
  const [userRole, setUserRole] = useState<string>('user')
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [googleCalendarEnabled, setGoogleCalendarEnabled] = useState(false)
  const [googleAccessToken, setGoogleAccessToken] = useState<string>('')
  const [showGoogleAuth, setShowGoogleAuth] = useState(false)

  useEffect(() => {
    // URL 파라미터에서 사용자 정보 가져오기
    const role = searchParams.get('role') || 'user'
    const userId = searchParams.get('user') || 'guest'
    setUserRole(role)
    setCurrentUserId(userId)
    
    // 샘플 데이터 로드
    loadSampleData()
  }, [searchParams])

  // 샘플 데이터 로드
  const loadSampleData = () => {
    const sampleEntries: WorkDiaryEntry[] = [
      {
        id: '1',
        date: '2024-01-15',
        userId: 'admin',
        userName: '관리자',
        content: '전기 설비 점검 및 유지보수 작업 수행. 주요 장비 상태 양호함.',
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T09:00:00Z',
        googleCalendarEventId: 'google_event_1',
        googleCalendarLink: 'https://calendar.google.com/event?eid=google_event_1'
      },
      {
        id: '2',
        date: '2024-01-15',
        userId: 'user1',
        userName: '김철수',
        content: '일일 안전 점검 완료. 이상사항 없음.',
        createdAt: '2024-01-15T08:30:00Z',
        updatedAt: '2024-01-15T08:30:00Z'
      },
      {
        id: '3',
        date: '2024-01-14',
        userId: 'manager1',
        userName: '이영희',
        content: '월간 설비 점검 계획 수립 및 팀원 배치 완료.',
        createdAt: '2024-01-14T17:00:00Z',
        updatedAt: '2024-01-14T17:00:00Z'
      }
    ]
    setDiaryEntries(sampleEntries)
  }

  // 달력 생성
  const generateCalendar = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const calendar = []
    const currentDateObj = new Date(startDate)
    
    while (currentDateObj <= lastDay || currentDateObj.getDay() !== 0) {
      calendar.push(new Date(currentDateObj))
      currentDateObj.setDate(currentDateObj.getDate() + 1)
    }
    
    return calendar
  }

  // 날짜 더블클릭 처리
  const handleDateDoubleClick = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    setSelectedDate(dateString)
    setShowDiaryForm(true)
    setFormContent('')
    setEditingEntry(null)
  }

  // 기존 일지 편집
  const handleEditEntry = (entry: WorkDiaryEntry) => {
    setEditingEntry(entry)
    setFormContent(entry.content)
    setShowDiaryForm(true)
  }

  // 일지 저장
  const handleSaveDiary = () => {
    if (!selectedDate || !formContent.trim()) return

    if (editingEntry) {
      // 기존 일지 수정
      const updatedEntries = diaryEntries.map(entry => 
        entry.id === editingEntry.id 
          ? { ...entry, content: formContent, updatedAt: new Date().toISOString() }
          : entry
      )
      setDiaryEntries(updatedEntries)
    } else {
      // 새 일지 작성
      const newEntry: WorkDiaryEntry = {
        id: Date.now().toString(),
        date: selectedDate,
        userId: currentUserId,
        userName: currentUserId === 'admin' ? '관리자' : currentUserId,
        content: formContent,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      setDiaryEntries([...diaryEntries, newEntry])
    }

    setShowDiaryForm(false)
    setSelectedDate(null)
    setFormContent('')
    setEditingEntry(null)
  }

  // Google Calendar 연동 토글
  const toggleGoogleCalendar = () => {
    if (googleCalendarEnabled) {
      setGoogleCalendarEnabled(false)
      setGoogleAccessToken('')
    } else {
      setShowGoogleAuth(true)
    }
  }

  // Google OAuth 인증 처리 (실제 구현에서는 OAuth 플로우 필요)
  const handleGoogleAuth = () => {
    // 실제 구현에서는 Google OAuth 2.0 플로우를 구현해야 합니다
    // 현재는 데모용으로 가상의 토큰을 생성합니다
    const mockToken = 'mock_google_access_token_' + Date.now()
    setGoogleAccessToken(mockToken)
    setGoogleCalendarEnabled(true)
    setShowGoogleAuth(false)
    
    alert('Google Calendar 연동이 활성화되었습니다! (데모 모드)')
  }

  // Google Calendar에 일지 동기화
  const syncToGoogleCalendar = async (entry: WorkDiaryEntry) => {
    if (!googleCalendarEnabled || !googleAccessToken) {
      alert('Google Calendar 연동을 먼저 활성화해주세요.')
      return
    }

    try {
      // 실제 구현에서는 Google Calendar API를 호출합니다
      const mockEventId = 'google_event_' + Date.now()
      const mockLink = `https://calendar.google.com/event?eid=${mockEventId}`
      
      const updatedEntry = {
        ...entry,
        googleCalendarEventId: mockEventId,
        googleCalendarLink: mockLink
      }
      
      const updatedEntries = diaryEntries.map(e => 
        e.id === entry.id ? updatedEntry : e
      )
      setDiaryEntries(updatedEntries)
      
      alert('Google Calendar에 동기화되었습니다!')
    } catch (error) {
      alert('Google Calendar 동기화에 실패했습니다.')
      console.error('Google Calendar 동기화 오류:', error)
    }
  }

  // Google Calendar에서 일지 동기화 해제
  const unsyncFromGoogleCalendar = async (entry: WorkDiaryEntry) => {
    if (!entry.googleCalendarEventId) return

    try {
      // 실제 구현에서는 Google Calendar API를 호출하여 이벤트를 삭제합니다
      const updatedEntry = {
        ...entry,
        googleCalendarEventId: undefined,
        googleCalendarLink: undefined
      }
      
      const updatedEntries = diaryEntries.map(e => 
        e.id === entry.id ? updatedEntry : e
      )
      setDiaryEntries(updatedEntries)
      
      alert('Google Calendar 동기화가 해제되었습니다.')
    } catch (error) {
      alert('Google Calendar 동기화 해제에 실패했습니다.')
      console.error('Google Calendar 동기화 해제 오류:', error)
    }
  }

  // 일지 삭제
  const handleDeleteEntry = (entryId: string) => {
    if (confirm('정말로 이 일지를 삭제하시겠습니까?')) {
      const entry = diaryEntries.find(e => e.id === entryId)
      if (entry?.googleCalendarEventId) {
        // Google Calendar에서도 이벤트 삭제
        unsyncFromGoogleCalendar(entry)
      }
      setDiaryEntries(diaryEntries.filter(entry => entry.id !== entryId))
    }
  }

  // 특정 날짜의 일지 가져오기
  const getEntriesForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0]
    if (userRole === 'admin') {
      return diaryEntries.filter(entry => entry.date === dateString)
    } else {
      return diaryEntries.filter(entry => entry.date === dateString && entry.userId === currentUserId)
    }
  }

  // 이전/다음 월 이동
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const calendar = generateCalendar()
  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
  const dayNames = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">유네코레일 전기파트</h1>
                <p className="text-sm text-gray-600">업무일지 관리 시스템</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {currentUserId}님 ({userRole === 'admin' ? '관리자' : '사용자'})
              </span>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>메인으로 돌아가기</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">업무일지 작성</h2>
          <p className="text-lg text-gray-600">
            날짜를 더블클릭하여 업무일지를 작성하세요
          </p>
        </div>

        {/* 달력 네비게이션 및 Google Calendar 연동 */}
        <div className="flex items-center justify-between mb-6">
          <Button onClick={goToPreviousMonth} variant="outline">
            ← 이전 달
          </Button>
          <h3 className="text-xl font-semibold text-gray-900">
            {currentDate.getFullYear()}년 {monthNames[currentDate.getMonth()]}
          </h3>
          <div className="flex items-center space-x-2">
            <Button
              onClick={toggleGoogleCalendar}
              variant={googleCalendarEnabled ? "outline" : "default"}
              className={googleCalendarEnabled ? "text-green-600 border-green-600" : ""}
            >
              {googleCalendarEnabled ? (
                <>
                  <Unlink className="h-4 w-4 mr-2" />
                  Google Calendar 연동 해제
                </>
              ) : (
                <>
                  <Link className="h-4 w-4 mr-2" />
                  Google Calendar 연동
                </>
              )}
            </Button>
            <Button onClick={goToNextMonth} variant="outline">
              다음 달 →
            </Button>
          </div>
        </div>

        {/* 달력 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center py-2 font-medium text-gray-700">
                {day}
              </div>
            ))}
          </div>

          {/* 달력 그리드 */}
          <div className="grid grid-cols-7 gap-1">
            {calendar.map((date, index) => {
              const isCurrentMonth = date.getMonth() === currentDate.getMonth()
              const isToday = date.toDateString() === new Date().toDateString()
              const entries = getEntriesForDate(date)
              const hasEntries = entries.length > 0

              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !isCurrentMonth ? 'bg-gray-100 text-gray-400' : 'bg-white'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  onDoubleClick={() => isCurrentMonth && handleDateDoubleClick(date)}
                >
                  <div className="text-sm font-medium mb-1">
                    {date.getDate()}
                  </div>
                  
                  {/* 일지 내용 미리보기 */}
                  {hasEntries && (
                    <div className="space-y-1">
                      {entries.slice(0, 2).map(entry => (
                        <div
                          key={entry.id}
                          className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate"
                          title={entry.content}
                        >
                          {entry.userName}: {entry.content.substring(0, 20)}...
                        </div>
                      ))}
                      {entries.length > 2 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{entries.length - 2}개 더
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Google OAuth 인증 모달 */}
        {showGoogleAuth && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Google Calendar 연동
                  </h3>
                  <p className="text-sm text-gray-600">
                    업무일지를 Google Calendar와 동기화하여<br />
                    모바일 앱과 다른 기기에서도 확인할 수 있습니다.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start space-x-2">
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
                        <span className="text-white text-xs font-bold">i</span>
                      </div>
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">연동 기능:</p>
                        <ul className="list-disc list-inside space-y-1 text-xs">
                          <li>업무일지를 Google Calendar 이벤트로 변환</li>
                          <li>모바일 앱과 실시간 동기화</li>
                          <li>이메일 및 팝업 알림 설정</li>
                          <li>다른 기기에서도 일정 확인 가능</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button
                      onClick={() => setShowGoogleAuth(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      취소
                    </Button>
                    <Button
                      onClick={handleGoogleAuth}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Link className="h-4 w-4 mr-2" />
                      연동 시작
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 일지 작성/편집 모달 */}
        {showDiaryForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {editingEntry ? '일지 수정' : '새 일지 작성'}
                  </h3>
                  <Button
                    onClick={() => setShowDiaryForm(false)}
                    variant="outline"
                    size="sm"
                  >
                    ✕
                  </Button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    날짜
                  </label>
                  <div className="text-lg font-medium text-gray-900">
                    {selectedDate}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    업무 내용
                  </label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="오늘 수행한 업무 내용을 상세히 작성해주세요..."
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    onClick={() => setShowDiaryForm(false)}
                    variant="outline"
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleSaveDiary}
                    disabled={!formContent.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {editingEntry ? '수정' : '저장'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Google Calendar 연동 상태 */}
        {googleCalendarEnabled && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">
                  Google Calendar 연동 활성화됨
                </span>
              </div>
              <div className="text-xs text-green-600">
                업무일지가 자동으로 Google Calendar와 동기화됩니다
              </div>
            </div>
          </div>
        )}

        {/* 일지 목록 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">최근 업무일지</h3>
          <div className="space-y-4">
            {diaryEntries
              .filter(entry => userRole === 'admin' || entry.userId === currentUserId)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 10)
              .map(entry => (
                <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {entry.userName}
                        </span>
                        <span className="text-xs text-gray-500">
                          {entry.date}
                        </span>
                        {entry.updatedAt !== entry.createdAt && (
                          <span className="text-xs text-orange-600">(수정됨)</span>
                        )}
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
                    </div>
                    
                                         {(userRole === 'admin' || entry.userId === currentUserId) && (
                       <div className="flex space-x-2 ml-4">
                         {/* Google Calendar 연동 버튼 */}
                         {googleCalendarEnabled && (
                           <Button
                             onClick={() => entry.googleCalendarEventId 
                               ? unsyncFromGoogleCalendar(entry)
                               : syncToGoogleCalendar(entry)
                             }
                             variant="outline"
                             size="sm"
                             className={entry.googleCalendarEventId 
                               ? "text-orange-600 border-orange-300 hover:bg-orange-50" 
                               : "text-green-600 border-green-300 hover:bg-green-50"
                             }
                           >
                             {entry.googleCalendarEventId ? (
                               <>
                                 <Unlink className="h-3 w-3 mr-1" />
                                 연동 해제
                               </>
                             ) : (
                               <>
                                 <Link className="h-3 w-3 mr-1" />
                                 Google 연동
                               </>
                             )}
                           </Button>
                         )}
                         
                         {/* Google Calendar 링크 */}
                         {entry.googleCalendarLink && (
                           <Button
                             onClick={() => window.open(entry.googleCalendarLink, '_blank')}
                             variant="outline"
                             size="sm"
                             className="text-blue-600 border-blue-300 hover:bg-blue-50"
                           >
                             <ExternalLink className="h-3 w-3 mr-1" />
                             Calendar
                           </Button>
                         )}
                         
                         <Button
                           onClick={() => handleEditEntry(entry)}
                           variant="outline"
                           size="sm"
                         >
                           <Edit className="h-3 w-3 mr-1" />
                           수정
                         </Button>
                         <Button
                           onClick={() => handleDeleteEntry(entry.id)}
                           variant="outline"
                           size="sm"
                           className="text-red-600 border-red-300 hover:bg-red-50"
                         >
                           <Trash2 className="h-3 w-3 mr-1" />
                           삭제
                         </Button>
                       </div>
                     )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function WorkDiaryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WorkDiaryContent />
    </Suspense>
  )
} 