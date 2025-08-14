'use client'

/*
 * 재고 테이블 전체 구조 (13개 컬럼)
 * Tag NO. / 위치 / 품명 / 규격 / 재질 / 단위 / 전분기 재고 / 입고수량 / 불출수량 / 최종재고 / 실수량 / 불출내용 / 비고
 * 
 * 메인 화면에는 6개 컬럼만 표시
 * 위치 / 품명 / 규격 / 재질 / 단위 / 최종재고
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type CurrentStock, type Item, type StockOut, type User as UserType, mockItems, mockCurrentStock } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { formatCurrency, getStockStatusColor } from '@/lib/utils'
import { Package, TrendingUp, AlertTriangle, ArrowDown, ArrowUp, Search, History, Clock, User, Trash2, Edit, Database, Settings, Upload, Shield, ArrowLeft, FileText } from 'lucide-react'
import StockInModal from '@/components/StockInModal'
import StockOutModal from '@/components/StockOutModal'
import SearchModal from '@/components/SearchModal'
import StockHistoryModal from '@/components/StockHistoryModal'
import RentalModal from '@/components/RentalModal'
import BulkStockOutModal from '@/components/BulkStockOutModal'
import LoginModal from '@/components/LoginModal'
import UserManagementModal from '@/components/UserManagementModal'
import DisposalModal from '@/components/DisposalModal'
import DisposalListModal from '@/components/DisposalListModal'
import StockInListModal from '@/components/StockInListModal'
import StockOutListModal from '@/components/StockOutListModal'
import HistoryModal from '@/components/HistoryModal'
import CSVUploadModal from '@/components/CSVUploadModal'
import PermissionManagementModal from '@/components/PermissionManagementModal'

export default function StockManagementPage() {
  const router = useRouter()
  const [stockItems, setStockItems] = useState<CurrentStock[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // 모달 상태
  const [stockInModalOpen, setStockInModalOpen] = useState(false)
  const [stockOutModalOpen, setStockOutModalOpen] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)
  const [rentalModalOpen, setRentalModalOpen] = useState(false)
  const [bulkStockOutModalOpen, setBulkStockOutModalOpen] = useState(false)
  const [selectedStockOutItem, setSelectedStockOutItem] = useState<string | null>(null)
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<CurrentStock | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredStockItems, setFilteredStockItems] = useState<CurrentStock[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [sortField, setSortField] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [isAdmin, setIsAdmin] = useState(false) // 관리자 권한 상태
  const [currentUser, setCurrentUser] = useState<{ username: string; name: string; role: string } | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false) // 초기에는 로그인 모달을 숨김
  const [showUserManagementModal, setShowUserManagementModal] = useState(false)
  const [disposalModalOpen, setDisposalModalOpen] = useState(false)
  const [disposalListModalOpen, setDisposalListModalOpen] = useState(false)
  const [stockInListModalOpen, setStockInListModalOpen] = useState(false)
  const [stockOutListModalOpen, setStockOutListModalOpen] = useState(false)
  const [csvUploadModalOpen, setCsvUploadModalOpen] = useState(false)
  const [permissionManagementModalOpen, setPermissionManagementModalOpen] = useState(false)

  // 재고 데이터 로드
  const loadStockData = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('current_stock')
        .select('*')
        .order('name')

      if (error) throw error
      setStockItems(data || [])
    } catch (err) {
      console.error('재고 데이터 로드 오류:', err)
      // 데이터베이스 연결 실패 시 임시 데이터 사용
      console.log('임시 재고 데이터를 사용합니다.')
      setStockItems(mockCurrentStock)
      setError(null) // 에러 상태 해제
    } finally {
      setLoading(false)
    }
  }

  // 품목 데이터 로드
  const loadItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('name')

      if (error) throw error
      setItems(data || [])
    } catch (err) {
      console.error('품목 데이터 로드 오류:', err)
      // 데이터베이스 연결 실패 시 임시 데이터 사용
      console.log('임시 데이터를 사용합니다.')
      setItems(mockItems)
    }
  }

  useEffect(() => {
    loadStockData()
    loadItems()
    
    // 로그인 상태 확인
    const checkLoginStatus = () => {
      // 먼저 localStorage에서 로그인 정보 확인 (우선순위 높음)
      const savedUser = localStorage.getItem('currentUser')
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser)
          setCurrentUser(userData)
          setIsAdmin(userData.role === '관리자')
          console.log('localStorage에서 사용자 정보 로드:', userData)
          return // localStorage에 정보가 있으면 URL 파라미터는 무시
        } catch (error) {
          console.error('저장된 사용자 정보 파싱 오류:', error)
          localStorage.removeItem('currentUser') // 잘못된 데이터 제거
        }
      }
      
      // localStorage에 정보가 없을 때만 URL 파라미터 확인
      const urlParams = new URLSearchParams(window.location.search)
      const userRole = urlParams.get('role')
      const username = urlParams.get('user')
      
      if (userRole && username) {
        let userData: { username: string; name: string; role: string }
        
        if (userRole === 'admin') {
          userData = { username: username, name: '관리자', role: '관리자' }
          setIsAdmin(true)
        } else if (userRole === 'electric') {
          userData = { username: username, name: '전기팀', role: '전기팀' }
          setIsAdmin(false)
        } else {
          userData = { username: username, name: username, role: '사용자' }
          setIsAdmin(false)
        }
        
        setCurrentUser(userData)
        
        // URL 파라미터로 받은 정보도 localStorage에 저장
        localStorage.setItem('currentUser', JSON.stringify(userData))
        console.log('URL 파라미터에서 사용자 정보 로드:', userData)
      }
    }
    
    checkLoginStatus()
  }, [])

  // CSV 업로드 완료
  const handleCSVUploadComplete = () => {
    loadStockData()
    loadItems()
  }

  // 입고 저장 - 비활성화
  const handleSaveStockIn = async (stockInData: any) => {
    alert('로그인이 필요한 기능입니다.')
  }

  // 출고 저장 - 비활성화
  const handleSaveStockOut = async (stockOutData: any) => {
    alert('로그인이 필요한 기능입니다.')
  }

  // 검색에서 출고 처리 - 비활성화
  const handleSearchStockOut = (itemId: string) => {
    alert('로그인이 필요한 기능입니다.')
  }

  // 이력 보기
  const handleViewHistory = (item: CurrentStock) => {
    setSelectedHistoryItem(item)
    setHistoryModalOpen(true)
  }

  const handleRental = (itemId: string) => {
    alert('로그인이 필요한 기능입니다.')
  }

  // 검색 기능 - 품명, 규격, 분류에서만 검색
  const handleSearch = () => {
    if (searchTerm.trim()) {
      const filtered = stockItems.filter(item => 
        // 품명에서 검색
        (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        // 규격에서 검색
        (item.specification?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        // 분류(카테고리)에서 검색
        (item.category?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
      setFilteredStockItems(filtered)
    } else {
      setFilteredStockItems([])
    }
  }

  const handleClearSearch = () => {
    setSearchTerm('')
    setFilteredStockItems([])
  }

  // 정렬 함수
  const sortItems = (items: CurrentStock[]) => {
    return [...items].sort((a, b) => {
      let aValue: any = a[sortField as keyof CurrentStock]
      let bValue: any = b[sortField as keyof CurrentStock]
      
      // null/undefined 처리
      if (aValue === null || aValue === undefined) aValue = ''
      if (bValue === null || bValue === undefined) bValue = ''
      
      // 문자열 비교
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue, 'ko')
        return sortDirection === 'asc' ? comparison : -comparison
      }
      
      // 숫자 비교
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }
      
      return 0
    })
  }

  // 표시할 아이템 결정 (검색 + 정렬)
  const baseItems = searchTerm.trim() && filteredStockItems.length > 0 ? filteredStockItems : stockItems
  const displayItems = sortItems(baseItems)

  // 체크박스 관련 함수들 - 비활성화
  const handleSelectItem = (itemId: string) => {
    // 체크박스 선택 비활성화
  }

  const handleSelectAll = () => {
    // 전체 선택 비활성화
  }

  const handleBulkStockOut = () => {
    alert('로그인이 필요한 기능입니다.')
  }

  const handleBulkStockOutSave = async (stockOuts: Omit<StockOut, 'id' | 'issued_at'>[]) => {
    alert('로그인이 필요한 기능입니다.')
  }

  // 정렬 처리 함수
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // 정렬 아이콘 표시 함수
  const getSortIcon = (field: string) => {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? '↑' : '↓'
  }

  // 관리자 전용 기능들 - 비활성화
  const handleDispose = () => {
    alert('로그인이 필요한 기능입니다.')
  }

  const handleDisposalComplete = () => {
    // 비활성화
  }

  const handleDisposalList = () => {
    alert('로그인이 필요한 기능입니다.')
  }

  const handleDelete = () => {
    alert('로그인이 필요한 기능입니다.')
  }

  const handleEditBaseData = () => {
    alert('로그인이 필요한 기능입니다.')
  }

  // 사용자 권한 체크 함수
  const checkUserPermission = (menuKey: string): boolean => {
    if (!currentUser) return false
    if (currentUser.role === '관리자') return true
    
    // 일반 사용자 권한 설정 (예시)
    const userPermissions = {
      'dashboard': true,
      'stock_status': true,
      'inbound_management': true,
      'outbound_management_1': true,
      'outbound_management_2': false,
      'permission_management': false,
      'system_management': false,
      'user_management': false
    }
    
    return userPermissions[menuKey as keyof typeof userPermissions] || false
  }

  // 로그인 처리
  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    try {
      // 기본 관리자 계정 확인
      if (username === 'admin' && password === 'admin') {
        const userData = { username: 'admin', name: '관리자', role: '관리자' }
        setCurrentUser(userData)
        setIsAdmin(true)
        setShowLoginModal(false)
        // 로컬 스토리지에 저장
        localStorage.setItem('currentUser', JSON.stringify(userData))
        return true
      }

      // 전기팀 계정 확인
      if (username === 'electric' && password === 'electric') {
        const userData = { username: 'electric', name: '전기팀', role: '전기팀' }
        setCurrentUser(userData)
        setIsAdmin(false)
        setShowLoginModal(false)
        // 로컬 스토리지에 저장
        localStorage.setItem('currentUser', JSON.stringify(userData))
        return true
      }

      // 실제 데이터베이스에서 사용자 확인
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single()

      if (error || !data) {
        return false
      }

      // 데이터베이스에서 가져온 역할 설정
      let userRole = '사용자'
      if (data.role === 'admin' || data.is_admin) {
        userRole = '관리자'
        setIsAdmin(true)
      } else if (data.role === 'electric' || data.department === '전기팀') {
        userRole = '전기팀'
        setIsAdmin(false)
      } else {
        setIsAdmin(false)
      }

      const userData = { username: data.username, name: data.name, role: userRole }
      setCurrentUser(userData)
      setShowLoginModal(false)
      // 로컬 스토리지에 저장
      localStorage.setItem('currentUser', JSON.stringify(userData))
      return true
    } catch (error) {
      console.error('로그인 오류:', error)
      return false
    }
  }

  const handleLogout = () => {
    setCurrentUser(null)
    setIsAdmin(false)
    setShowLoginModal(false) // 로그아웃 후 로그인 모달 숨김
    // 로컬 스토리지 정리
    localStorage.removeItem('currentUser')
    // 다른 모달들도 모두 닫기
    setStockInModalOpen(false)
    setStockOutModalOpen(false)
    setBulkStockOutModalOpen(false)
    setRentalModalOpen(false)
    setSearchModalOpen(false)
    setHistoryModalOpen(false)
    setShowUserManagementModal(false)
    setDisposalModalOpen(false)
    setDisposalListModalOpen(false)
    setStockInListModalOpen(false)
    setStockOutListModalOpen(false)
    setCsvUploadModalOpen(false)
    setPermissionManagementModalOpen(false)
    // 선택된 항목들 초기화
    setSelectedItems(new Set())
    // 검색 초기화
    setSearchTerm('')
    setFilteredStockItems([])
  }

  // 통계 계산
  const totalItems = stockItems.length
  const totalValue = stockItems.reduce((sum, item) => sum + item.total_amount, 0)
  const lowStockItems = stockItems.filter(item => item.stock_status === 'low_stock').length
  const totalQuantity = stockItems.reduce((sum, item) => sum + (item.current_quantity || 0), 0)

  const handleStockInList = () => {
    alert('로그인이 필요한 기능입니다.')
  }

  const handleStockOutList = () => {
    alert('로그인이 필요한 기능입니다.')
  }

  const handleHistory = () => {
    setHistoryModalOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">재고 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">오류 발생</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadStockData}>다시 시도</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-900">유네코레일 전기팀 자재관리 시스템</h1>
            </div>
            
            {/* 우측: 로그인/사용자 정보 및 메인으로 돌아가기 */}
            <div className="flex items-center space-x-4">
              {/* 메인으로 돌아가기 버튼 */}
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>메인으로</span>
              </Button>
              
              {/* 로그인/사용자 정보 */}
              {currentUser ? (
                <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-300">
                  <User className="h-4 w-4 text-gray-600" />
                  <span className="text-sm text-gray-700 font-medium">
                    {currentUser.name}님 반갑습니다. ({currentUser.role})
                  </span>
                  {isAdmin && (
                    <Button
                      size="sm"
                      onClick={() => setShowUserManagementModal(true)}
                      variant="outline"
                      className="ml-2 px-2 py-1 text-xs"
                    >
                      <Settings className="h-3 w-3 mr-1" />
                      회원관리
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleLogout}
                    variant="outline"
                    className="px-2 py-1 text-xs text-red-600 border-red-300 hover:bg-red-50"
                  >
                    로그아웃
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 ml-4 pl-4 border-l border-gray-300">
                  <Button
                    size="sm"
                    onClick={() => setShowLoginModal(true)}
                    variant="outline"
                    className="px-3 py-2 text-sm bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                  >
                    <User className="h-4 w-4 mr-1" />
                    로그인
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 통계 카드 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">총 품목 수</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalItems}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">총 재고 수량</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalQuantity}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600">부족 재고</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{lowStockItems}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 권한별 메뉴 버튼 */}
        {currentUser && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                🚀 바로가기
              </h3>
              <p className="text-sm text-blue-700">
                {currentUser.name}님의 권한에 맞는 메뉴입니다
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* 관리자 권한 */}
              {currentUser.role === '관리자' && (
                <>
                  <Button
                    onClick={() => router.push('/manual-management')}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📚</div>
                      <div className="text-xs font-medium">메뉴얼 관리</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => router.push('/stock-management')}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📦</div>
                      <div className="text-xs font-medium">재고관리</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => router.push('/sop')}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📋</div>
                      <div className="text-xs font-medium">SOP</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => router.push('/work-diary')}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📝</div>
                      <div className="text-xs font-medium">업무일지</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setShowUserManagementModal(true)}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">👥</div>
                      <div className="text-xs font-medium">회원관리</div>
                    </div>
                  </Button>
                </>
              )}
              
              {/* 전기팀 권한 */}
              {currentUser.role === '전기팀' && (
                <>
                  <Button
                    onClick={() => router.push('/manual-management')}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📚</div>
                      <div className="text-xs font-medium">메뉴얼 관리</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => router.push('/stock-management')}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📦</div>
                      <div className="text-xs font-medium">재고관리</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => router.push('/sop')}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📋</div>
                      <div className="text-xs font-medium">SOP</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => router.push('/work-diary')}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📝</div>
                      <div className="text-xs font-medium">업무일지</div>
                    </div>
                  </Button>
                </>
              )}
              
              {/* 그 외 사용자 권한 */}
              {currentUser.role !== '관리자' && currentUser.role !== '전기팀' && (
                <>
                  <Button
                    onClick={() => router.push('/stock-management')}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📦</div>
                      <div className="text-xs font-medium">재고관리</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => router.push('/work-diary')}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📝</div>
                      <div className="text-xs font-medium">업무일지</div>
                    </div>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* 재고 관리 기능 버튼들 */}
        {currentUser && (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                📦 바로가기
              </h3>
              <p className="text-sm text-gray-600">
                {currentUser.name}님의 권한에 맞는 기능입니다
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {/* 관리자 권한 - 모든 버튼 */}
              {currentUser.role === '관리자' && (
                <>
                  <Button
                    onClick={() => setStockInModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📥</div>
                      <div className="text-xs font-medium">입고</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setStockOutModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📤</div>
                      <div className="text-xs font-medium">출고</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setCsvUploadModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📊</div>
                      <div className="text-xs font-medium">CSV 업로드</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setSearchModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">🔍</div>
                      <div className="text-xs font-medium">검색</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setHistoryModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📋</div>
                      <div className="text-xs font-medium">이력관리</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setDisposalModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">🗑️</div>
                      <div className="text-xs font-medium">폐기</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setStockInListModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📥📋</div>
                      <div className="text-xs font-medium">입고이력</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setStockOutListModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-pink-300 text-pink-700 hover:bg-pink-50 hover:border-pink-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📤📋</div>
                      <div className="text-xs font-medium">출고이력</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => router.push('/stock-closing')}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-yellow-300 text-yellow-700 hover:bg-yellow-50 hover:border-yellow-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📅</div>
                      <div className="text-xs font-medium">마감</div>
                    </div>
                  </Button>
                </>
              )}
              
              {/* 전기팀 권한 - 입고, 출고, 현황, 검색 */}
              {currentUser.role === '전기팀' && (
                <>
                  <Button
                    onClick={() => setStockInModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📥</div>
                      <div className="text-xs font-medium">입고</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setStockOutModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📤</div>
                      <div className="text-xs font-medium">출고</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setHistoryModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📋</div>
                      <div className="text-xs font-medium">현황</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setSearchModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">🔍</div>
                      <div className="text-xs font-medium">검색</div>
                    </div>
                  </Button>
                </>
              )}
              
              {/* 그 외 사용자 권한 - 출고, 현황, 검색 */}
              {currentUser.role !== '관리자' && currentUser.role !== '전기팀' && (
                <>
                  <Button
                    onClick={() => setStockOutModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-red-300 text-red-700 hover:bg-red-50 hover:border-red-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📤</div>
                      <div className="text-xs font-medium">출고</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setHistoryModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">📋</div>
                      <div className="text-xs font-medium">현황</div>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={() => setSearchModalOpen(true)}
                    variant="outline"
                    size="sm"
                    className="h-16 bg-white border-purple-300 text-purple-700 hover:bg-purple-50 hover:border-purple-400"
                  >
                    <div className="text-center">
                      <div className="text-lg mb-1">🔍</div>
                      <div className="text-xs font-medium">검색</div>
                    </div>
                  </Button>
                </>
              )}
            </div>
          </div>
        )}

        {/* 로그인 안내 메시지 */}
        {!currentUser && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-yellow-900 mb-2">
                  🔒 로그인이 필요한 기능
                </h3>
                <p className="text-sm text-yellow-700 mb-3">
                  현재 재고 검색만 가능합니다. 입고, 출고, 이력관리 등 모든 기능을 이용하려면 로그인이 필요합니다.
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowLoginModal(true)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <User className="h-4 w-4 mr-2" />
                  로그인하기
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 검색 결과 표시 */}
        {searchTerm && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-start space-x-3">
                <Search className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 mt-0.5 sm:mt-0" />
                <div>
                  <p className="text-xs sm:text-sm font-medium text-blue-900">
                    검색 결과: <span className="font-bold">{filteredStockItems.length}</span>개
                  </p>
                  <p className="text-xs text-blue-700">
                    검색어: <span className="font-medium">"{searchTerm}"</span> 
                    (품명, 규격, 분류에서 검색)
                  </p>
                  {filteredStockItems.length > 0 && (
                    <div className="mt-2 text-xs text-blue-600">
                      총 수량: {filteredStockItems.reduce((sum, item) => sum + (item.current_quantity || 0), 0).toLocaleString()}개 | 
                      총 금액: {formatCurrency(filteredStockItems.reduce((sum, item) => sum + (item.total_amount || 0), 0))}
                    </div>
                  )}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearSearch}
                className="px-3 py-2 text-blue-600 border-blue-300 hover:bg-blue-100 text-xs sm:text-sm"
              >
                검색 해제
              </Button>
            </div>
          </div>
        )}

        {/* 재고 목록 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">전체 재고 현황</h2>
              
              {/* 검색창과 검색 버튼만 표시 */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <input
                    type="text"
                    placeholder="품명, 규격, 분류로 검색..."
                    value={searchTerm}
                    onChange={(e) => {
                      const value = e.target.value
                      setSearchTerm(value)
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full sm:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={handleSearch}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm"
                >
                  <Search className="h-4 w-4 mr-1" />
                  검색
                </Button>
                {searchTerm && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleClearSearch}
                    className="px-3 py-2"
                  >
                    해제
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    위치
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    품명
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    규격
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    재질
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    단위
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    최종재고
                  </th>
                  <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
                    작업
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {displayItems.length > 0 ? (
                  displayItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{item.location || '-'}</div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                        <div>
                          <div className="text-xs sm:text-sm font-medium text-gray-900">{item.name}</div>
                        </div>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {item.specification || '-'}
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {item.material || '-'}
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        {item.unit || '-'}
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        <span className="font-medium text-blue-600">{item.current_quantity || 0}</span>
                      </td>
                      <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewHistory(item)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                            title="재고 이력 보기"
                          >
                            <History className="h-3 w-3 sm:h-4 sm:w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? (
                        <div className="space-y-2">
                          <div className="text-lg font-medium text-gray-700">
                            검색 결과가 없습니다
                          </div>
                          <div className="text-sm text-gray-500">
                            검색어: <span className="font-medium text-gray-700">"{searchTerm}"</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            위치, 품명, 규격, 재질에서 검색됩니다
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-lg font-medium text-gray-700">
                            재고 데이터가 없습니다
                          </div>
                          <div className="text-sm text-gray-500">
                            입고 데이터를 추가해주세요
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 이력 조회 버튼들 - 로그인 후에만 활성화 */}
      {currentUser && (
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-6 mb-4 px-4">
          <Button onClick={handleHistory} variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
            <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            통합 이력
          </Button>
          <Button onClick={handleStockInList} variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
            <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            입고 이력
          </Button>
          <Button onClick={handleStockOutList} variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
            <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            출고 이력
          </Button>
          <Button 
            onClick={() => router.push('/work-diary')} 
            variant="outline" 
            size="sm" 
            className="w-full sm:w-auto text-xs sm:text-sm bg-green-50 border-green-200 text-green-700 hover:bg-green-100 hover:border-green-300"
          >
            <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            업무일지 작성
          </Button>
          {isAdmin && (
            <Button onClick={handleDisposalList} variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
              폐기 이력
            </Button>
          )}
        </div>
      )}

      {/* 모달들 */}
      <StockInModal
        isOpen={stockInModalOpen}
        onClose={() => setStockInModalOpen(false)}
        items={items}
        onSave={handleSaveStockIn}
      />
      
      <StockOutModal
        isOpen={stockOutModalOpen}
        onClose={() => setStockOutModalOpen(false)}
        stockItems={stockItems}
        onSave={handleSaveStockOut}
      />

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        stockItems={stockItems}
        onStockOut={handleSearchStockOut}
      />

      <StockHistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        itemId={selectedHistoryItem?.id || ''}
      />

      <RentalModal
        isOpen={rentalModalOpen}
        onClose={() => setRentalModalOpen(false)}
        stockItems={stockItems}
        onRental={handleRental}
      />

      <BulkStockOutModal
        isOpen={bulkStockOutModalOpen}
        onClose={() => setBulkStockOutModalOpen(false)}
        selectedItems={displayItems.filter(item => selectedItems.has(item.id))}
        onSave={handleBulkStockOutSave}
      />
      
      {/* 로그인 모달 */}
      <LoginModal
        isOpen={showLoginModal}
        onLogin={handleLogin}
        onClose={() => setShowLoginModal(false)}
      />
      
      {/* 회원관리 모달 */}
      <UserManagementModal
        isOpen={showUserManagementModal}
        onClose={() => setShowUserManagementModal(false)}
      />

      {/* 폐기 모달 */}
      <DisposalModal
        isOpen={disposalModalOpen}
        onClose={() => setDisposalModalOpen(false)}
        selectedItemIds={Array.from(selectedItems)}
        onDisposalComplete={handleDisposalComplete}
      />

      {/* 폐기 리스트 모달 */}
      <DisposalListModal
        isOpen={disposalListModalOpen}
        onClose={() => setDisposalListModalOpen(false)}
      />

      {/* 입고 리스트 모달 */}
      <StockInListModal
        isOpen={stockInListModalOpen}
        onClose={() => setStockInListModalOpen(false)}
      />

      {/* 출고 리스트 모달 */}
      <StockOutListModal
        isOpen={stockOutListModalOpen}
        onClose={() => setStockOutListModalOpen(false)}
      />

      {/* 통합 이력 모달 */}
      <HistoryModal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
      />

      {/* CSV 업로드 모달 */}
      <CSVUploadModal
        isOpen={csvUploadModalOpen}
        onClose={() => setCsvUploadModalOpen(false)}
        onUploadComplete={handleCSVUploadComplete}
      />

      {/* 권한관리 모달 */}
      <PermissionManagementModal
        isOpen={permissionManagementModalOpen}
        onClose={() => setPermissionManagementModalOpen(false)}
      />
    </div>
  )
}
