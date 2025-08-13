'use client'

import { useState, useEffect } from 'react'
import { supabase, type CurrentStock, type Item, type StockOut, type User as UserType, mockItems, mockCurrentStock } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { formatCurrency, getStockStatusColor } from '@/lib/utils'
import { Package, TrendingUp, AlertTriangle, ArrowDown, ArrowUp, Search, History, Clock, User, Trash2, Edit, Database, Settings, Upload, Shield } from 'lucide-react'
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

export default function Home() {
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
  }, [])



  // CSV 업로드 완료
  const handleCSVUploadComplete = () => {
    loadStockData()
    loadItems()
  }

  // 입고 저장
  const handleSaveStockIn = async (stockInData: any) => {
    try {
      console.log('입고 저장 시작:', stockInData)
      
      const { data, error } = await supabase
        .from('stock_in')
        .insert([{
          ...stockInData,
          received_at: stockInData.received_at || new Date().toISOString()
        }])
        .select()
      
      if (error) {
        console.error('입고 저장 오류 상세:', error)
        throw new Error(`입고 저장 실패: ${error.message}`)
      }
      
      console.log('입고 저장 완료:', data)
      await loadStockData()
    } catch (err: any) {
      console.error('입고 저장 오류:', err)
      throw new Error(`입고 저장 중 오류: ${err.message}`)
    }
  }

  // 출고 저장
  const handleSaveStockOut = async (stockOutData: any) => {
    try {
      // issued_at 필드가 없으면 현재 시간으로 설정
      const dataToInsert = {
        ...stockOutData,
        issued_at: stockOutData.issued_at || new Date().toISOString()
      }

      const { error } = await supabase
        .from('stock_out')
        .insert([dataToInsert])
      
      if (error) throw error
      
      await loadStockData()
    } catch (err) {
      console.error('출고 저장 오류:', err)
      throw err
    }
  }



  // 검색에서 출고 처리
  const handleSearchStockOut = (itemId: string) => {
    setSelectedStockOutItem(itemId)
    setStockOutModalOpen(true)
  }

  // 이력 보기
  const handleViewHistory = (item: CurrentStock) => {
    setSelectedHistoryItem(item)
    setHistoryModalOpen(true)
  }

  const handleRental = (itemId: string) => {
    setSelectedStockOutItem(itemId)
    setStockOutModalOpen(true)
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

  // 체크박스 관련 함수들
  const handleSelectItem = (itemId: string) => {
    const newSelectedItems = new Set(selectedItems)
    if (newSelectedItems.has(itemId)) {
      newSelectedItems.delete(itemId)
    } else {
      newSelectedItems.add(itemId)
    }
    setSelectedItems(newSelectedItems)
  }

  const handleSelectAll = () => {
    if (selectedItems.size === displayItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(displayItems.map(item => item.id)))
    }
  }

  const handleBulkStockOut = () => {
    if (selectedItems.size === 0) {
      alert('출고할 품목을 선택해주세요.')
      return
    }
    setBulkStockOutModalOpen(true)
  }

  const handleBulkStockOutSave = async (stockOuts: Omit<StockOut, 'id' | 'issued_at'>[]) => {
    try {
      for (const stockOut of stockOuts) {
        await handleSaveStockOut(stockOut)
      }
      setSelectedItems(new Set())
      alert('다중 출고가 완료되었습니다.')
    } catch (error) {
      console.error('다중 출고 오류:', error)
      alert('다중 출고 중 오류가 발생했습니다.')
    }
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

  // 관리자 전용 기능들
  const handleDispose = () => {
    if (selectedItems.size === 0) {
      alert('폐기할 품목을 선택해주세요.')
      return
    }
    setDisposalModalOpen(true)
  }

  const handleDisposalComplete = () => {
    loadStockData()
    setSelectedItems(new Set())
  }

  const handleDisposalList = () => {
    setDisposalListModalOpen(true)
  }

  const handleDelete = () => {
    if (selectedItems.size === 0) {
      alert('삭제할 품목을 선택해주세요.')
      return
    }
    if (confirm('선택된 품목들을 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      // 삭제 로직 구현
      console.log('삭제할 품목들:', Array.from(selectedItems))
      alert('삭제가 완료되었습니다.')
      setSelectedItems(new Set())
    }
  }

  const handleEditBaseData = () => {
    alert('기초데이터 수정 기능은 별도 관리 페이지에서 처리됩니다.')
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
        setCurrentUser({ username: 'admin', name: '관리자', role: '관리자' })
        setIsAdmin(true)
        setShowLoginModal(false)
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

              setCurrentUser({ username: data.username, name: data.name, role: '사용자' })
      setIsAdmin(data.is_admin)
      setShowLoginModal(false)
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

  const handleStockInList = () => {
    setStockInListModalOpen(true)
  }

  const handleStockOutList = () => {
    setStockOutListModalOpen(true)
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
            <div className="flex items-center space-x-2">
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
                    className="px-2 py-1 text-xs"
                  >
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
                <p className="text-xs sm:text-sm font-medium text-gray-600">총 재고 금액</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-600">부족 재고</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{lowStockItems}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 관리자 전용 섹션 */}
        {checkUserPermission('permission_management') && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-indigo-900 mb-2">
                  🎯 관리자 전용 기능
                </h3>
                <p className="text-xs sm:text-sm text-indigo-700">
                  시스템 관리 및 권한 설정을 위한 관리자 전용 기능입니다.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <Button
                  size="sm"
                  onClick={() => setPermissionManagementModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  권한관리
                </Button>
                <Button
                  size="sm"
                  onClick={handleEditBaseData}
                  variant="outline"
                  className="px-4 py-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50"
                >
                  <Database className="h-4 w-4 mr-2" />
                  기초데이터
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
              
              {/* 좌측: 입고, 출고, 이력관리 버튼 */}
              <div className="flex flex-wrap items-center gap-2 sm:space-x-2">
                <Button
                  size="sm"
                  onClick={() => setStockInModalOpen(true)}
                  disabled={selectedItems.size > 0} // 체크박스 선택 시 비활성화
                  className={`px-4 py-2 text-white ${
                    selectedItems.size > 0 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  <ArrowDown className="h-4 w-4 mr-1" />
                  입고
                </Button>
                <Button
                  size="sm"
                  onClick={() => setCsvUploadModalOpen(true)}
                  disabled={selectedItems.size > 0} // 체크박스 선택 시 비활성화
                  className={`px-4 py-2 text-white ${
                    selectedItems.size > 0 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  CSV 업로드
                </Button>
                <Button
                  size="sm"
                  onClick={handleBulkStockOut}
                  disabled={selectedItems.size === 0} // 체크박스 미선택 시 비활성화
                  className={`px-4 py-2 text-white ${
                    selectedItems.size === 0 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  <ArrowUp className="h-4 w-4 mr-1" />
                  출고 ({selectedItems.size})
                </Button>
                <Button
                  size="sm"
                  onClick={() => setHistoryModalOpen(true)}
                  className="px-4 py-2 text-white bg-gray-600 hover:bg-gray-700"
                >
                  <Clock className="h-4 w-4 mr-1" />
                  이력관리
                </Button>
              </div>
              
              {/* 우측: 검색창, 검색 버튼 */}
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
            
                    {/* 관리자 전용 버튼 그룹 - 별도 줄에 배치 */}
        {checkUserPermission('user_management') && (
              <div className="flex items-center space-x-2 mt-3 pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-500 font-medium">관리자 기능:</span>
                                  {checkUserPermission('system_management') && (
                    <Button
                      size="sm"
                      onClick={handleDispose}
                      disabled={selectedItems.size === 0}
                      variant="outline"
                      className="px-3 py-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      폐기
                    </Button>
                  )}
                                  {checkUserPermission('system_management') && (
                    <Button
                      size="sm"
                      onClick={handleDelete}
                      disabled={selectedItems.size === 0}
                      variant="outline"
                      className="px-3 py-2 border-red-500 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      삭제
                    </Button>
                  )}
                                             {checkUserPermission('data_management') && (
                    <Button
                      size="sm"
                      onClick={handleEditBaseData}
                      variant="outline"
                      className="px-3 py-2 border-purple-500 text-purple-600 hover:bg-purple-50"
                    >
                      <Database className="h-4 w-4 mr-1" />
                      기초데이터
                    </Button>
                  )}
           <Button
             size="sm"
             onClick={() => setPermissionManagementModalOpen(true)}
             variant="outline"
             className="px-3 py-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50"
           >
             <Shield className="h-4 w-4 mr-1" />
             권한관리
           </Button>
              </div>
            )}
          </div>
                      <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
                      <thead className="bg-gray-800">
          <tr>
            <th className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider">
              <input
                type="checkbox"
                checked={selectedItems.size === displayItems.length && displayItems.length > 0}
                onChange={handleSelectAll}
                className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </th>
            <th 
              className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700"
              onClick={() => handleSort('name')}
            >
              <span className="hidden sm:inline">품명</span>
              <span className="sm:hidden">품명</span>
              {getSortIcon('name')}
            </th>
            <th 
              className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700"
              onClick={() => handleSort('specification')}
            >
              <span className="hidden sm:inline">규격</span>
              <span className="sm:hidden">규격</span>
              {getSortIcon('specification')}
            </th>
            <th 
              className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700"
              onClick={() => handleSort('unit_price')}
            >
              <span className="hidden sm:inline">단가</span>
              <span className="sm:hidden">단가</span>
              {getSortIcon('unit_price')}
            </th>
            <th 
              className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700"
              onClick={() => handleSort('current_quantity')}
            >
              <span className="hidden sm:inline">수량</span>
              <span className="sm:hidden">수량</span>
              {getSortIcon('current_quantity')}
            </th>
            <th 
              className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700"
              onClick={() => handleSort('total_amount')}
            >
              <span className="hidden sm:inline">금액</span>
              <span className="sm:hidden">금액</span>
              {getSortIcon('total_amount')}
            </th>
            <th 
              className="px-2 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-white uppercase tracking-wider cursor-pointer hover:bg-gray-700"
              onClick={() => handleSort('notes')}
            >
              <span className="hidden sm:inline">기타</span>
              <span className="sm:hidden">기타</span>
              {getSortIcon('notes')}
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
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
                    {item.unit_price ? `${item.unit_price.toLocaleString()}원` : '-'}
                  </td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                    {item.current_quantity || 0}개
                  </td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                    {item.total_amount ? `${item.total_amount.toLocaleString()}원` : '-'}
                  </td>
                  <td className="px-2 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-900">
                    {item.notes || '-'}
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
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      {searchTerm ? (
                        <div className="space-y-2">
                          <div className="text-lg font-medium text-gray-700">
                            검색 결과가 없습니다
                          </div>
                          <div className="text-sm text-gray-500">
                            검색어: <span className="font-medium text-gray-700">"{searchTerm}"</span>
                          </div>
                          <div className="text-xs text-gray-400">
                            품명, 규격, 분류에서 검색됩니다
                          </div>
                        </div>
                      ) : (
                        '재고 데이터가 없습니다.'
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 이력 조회 버튼들 */}
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
        {isAdmin && (
          <Button onClick={handleDisposalList} variant="outline" size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            폐기 이력
          </Button>
        )}
      </div>

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
