'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useUser } from '@/hooks/useUser'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Search,
  Filter,
  Plus,
  Download,
  MoreHorizontal,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Package,
  Trash2,
  Edit
} from "lucide-react"
import CommonHeader from '@/components/CommonHeader'
import StockStatistics from '@/components/stock/StockStatistics'
import AuthGuard from '@/components/AuthGuard'
import DisposalModal from '@/components/DisposalModal'
import StockInModal from '@/components/StockInModal'
import StockOutModal from '@/components/StockOutModal'

interface FilterOptions {
  category: string
  status: string
  location: string
  supplier: string
}

export interface StockItem {
  id: string
  name: string
  specification: string
  location: string
  deadline: string
  inbound: number
  outbound: number
  currentStock: number
  closingQuantity: number
  status: string
  category: string
  unit: string
  minStock: number
  maxStock: number
  supplier: string
  unitPrice: number
  lastUpdated: string
  notes: string
}

export default function StockManagementPage() {
  const router = useRouter()
  const { user, loading: authLoading, isAuthenticated, logout } = useUser()
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    category: '',
    status: '',
    location: '',
    supplier: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState<string>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showUserManagement, setShowUserManagement] = useState(false)
  const [lastClosingDate, setLastClosingDate] = useState<string>('')
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [filteredItems, setFilteredItems] = useState<StockItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [stockInModalOpen, setStockInModalOpen] = useState(false)
  const [stockOutModalOpen, setStockOutModalOpen] = useState(false)
  const [disposalModalOpen, setDisposalModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingItem, setEditingItem] = useState<StockItem | null>(null)

  // 인증 상태 확인 및 리다이렉트
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [authLoading, isAuthenticated, router])

  // 실제 데이터베이스에서 재고 데이터 로드
  useEffect(() => {
    if (!isAuthenticated) return // 인증되지 않은 경우 데이터 로드하지 않음

    const loadStockData = async () => {
      setIsLoading(true)
      try {
        const { data: stockData, error } = await supabase
          .from('items')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('재고 데이터 로드 오류:', error)
          setStockItems([])
          setFilteredItems([])
          return
        }

        if (stockData && stockData.length > 0) {
          const convertedData: StockItem[] = stockData.map((item: any) => ({
            id: item.id?.toString() || '',
            name: item.name || item.product || '',
            specification: item.specification || item.spec || '',
            location: item.location || '',
            deadline: item.deadline || new Date().toISOString().split('T')[0],
            inbound: item.stock_in || item.stock_in_quantity || 0,
            outbound: item.stock_out || item.stock_out_quantity || 0,
            currentStock: item.current_quantity || item.total_qunty || 0,
            closingQuantity: item.closing_quantity || 0,
            status: item.stock_status || 'new',
            category: item.category || '일반',
            unit: '개',
            minStock: item.min_stock || 0,
            maxStock: item.max_stock || 100,
            supplier: item.maker || '',
            unitPrice: item.unit_price || 0,
            lastUpdated: item.updated_at || new Date().toISOString().split('T')[0],
            notes: item.note || ''
          }))

          console.log('DB에서 로드된 재고 데이터:', convertedData)
          setStockItems(convertedData)
          setFilteredItems(convertedData)
        } else {
          console.log('DB에 재고 데이터가 없음, 빈 목록 표시')
          setStockItems([])
          setFilteredItems([])
        }
      } catch (error) {
        console.error('재고 데이터 로드 중 예외 발생:', error)
        setStockItems([])
        setFilteredItems([])
      } finally {
        setIsLoading(false)
      }
    }

    // 마지막 마감일 로드
    const savedLastClosingDate = localStorage.getItem('lastClosingDate')
    if (savedLastClosingDate) {
      setLastClosingDate(savedLastClosingDate)
    } else {
      const today = new Date()
      const formattedDate = `${today.getFullYear()}년 ${String(today.getMonth() + 1).padStart(2, '0')}월 ${String(today.getDate()).padStart(2, '0')}일`
      setLastClosingDate(formattedDate)
      localStorage.setItem('lastClosingDate', formattedDate)
    }

    loadStockData()
  }, [isAuthenticated])

  // 샘플 데이터 로드 (사용하지 않음 - DB 데이터만 사용)
  // const loadSampleData = async () => {
  //   console.log('샘플 데이터 로드 시작')
  //   await new Promise(resolve => setTimeout(resolve, 1000))
  //   
  //   const sampleData: StockItem[] = [
  //     {
  //       id: '1',
  //       name: '전선 2.0SQ',
  //       specification: '2.0SQ x 100m',
  //       location: '창고A-01',
  //       deadline: '2024-12-31',
  //       inbound: 50,
  //       outbound: 20,
  //       currentStock: 30,
  //       closingQuantity: 0,
  //       status: 'new',
  //       category: '전선류',
  //       unit: '롤',
  //       minStock: 10,
  //       maxStock: 100,
  //       supplier: '대한전선',
  //       lastUpdated: '2024-01-15',
  //       notes: '고품질 동전선'
  //     },
  //     {
  //       id: '2',
  //       name: '케이블 타이',
  //       specification: '100mm',
  //       location: '창고B-03',
  //       deadline: '2024-11-30',
  //       inbound: 200,
  //       outbound: 150,
  //       currentStock: 50,
  //       closingQuantity: 0,
  //       status: 'used-new',
  //       category: '부자재',
  //       unit: '개',
  //       minStock: 100,
  //       maxStock: 500,
  //       supplier: '한국케이블',
  //       lastUpdated: '2024-01-14',
  //       notes: '내열성 우수'
  //     }
  //   ]
  //   setStockItems(sampleData)
  //   setFilteredItems(sampleData)
  //   setIsLoading(false)
  // }

  // 검색 및 필터링
  useEffect(() => {
    let filtered = stockItems

    if (searchTerm.trim()) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.specification.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterOptions.category) {
      filtered = filtered.filter(item => item.category === filterOptions.category)
    }

    if (filterOptions.status) {
      filtered = filtered.filter(item =>
        ['new', 'used-new', 'used-used', 'broken'].includes(item.status) &&
        item.status === filterOptions.status
      )
    }

    if (filterOptions.location) {
      filtered = filtered.filter(item => item.location === filterOptions.location)
    }

    if (filterOptions.supplier) {
      filtered = filtered.filter(item => item.supplier === filterOptions.supplier)
    }

    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof StockItem]
      let bValue: any = b[sortBy as keyof StockItem]

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredItems(filtered)
  }, [searchTerm, stockItems, filterOptions, sortBy, sortOrder])

  // 데이터 새로고침 함수
  const refreshStockData = useCallback(async () => {
    console.log('재고 데이터 새로고침 시작')
    setIsLoading(true)
    try {
      const { data: stockData, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('재고 데이터 새로고침 오류:', error)
        return
      }

      if (stockData && stockData.length > 0) {
        const convertedData: StockItem[] = stockData.map((item: any) => ({
          id: item.id?.toString() || '',
          name: item.name || item.product || '',
          specification: item.specification || item.spec || '',
          location: item.location || '',
          deadline: item.deadline || new Date().toISOString().split('T')[0],
          inbound: item.stock_in || item.stock_in_quantity || 0,
          outbound: item.stock_out || item.stock_out_quantity || 0,
          currentStock: item.current_quantity || item.total_qunty || 0,
          closingQuantity: item.closing_quantity || 0,
          status: item.stock_status || 'new',
          category: item.category || '일반',
          unit: '개',
          minStock: item.min_stock || 0,
          maxStock: item.max_stock || 100,
          supplier: item.maker || '',
          unitPrice: item.unit_price || 0,
          lastUpdated: item.updated_at || new Date().toISOString().split('T')[0],
          notes: item.note || ''
        }))

        console.log('새로고침된 재고 데이터:', convertedData)
        setStockItems(convertedData)
        // filteredItems는 useEffect에서 자동으로 업데이트됨
      }
    } catch (error) {
      console.error('재고 데이터 새로고침 중 예외 발생:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 이벤트 핸들러들
  const handleSort = useCallback((field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }, [sortBy, sortOrder])

  const handleStockInModalClose = useCallback(() => {
    setStockInModalOpen(false)
    setEditingItem(null)
    setIsEditMode(false)
  }, [])

  const handleStockInModalSave = useCallback(() => {
    setStockInModalOpen(false)
    setEditingItem(null)
    setIsEditMode(false)
    refreshStockData()
  }, [refreshStockData])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(filteredItems.map(item => item.id))
    } else {
      setSelectedItems([])
    }
  }

  const handleSelectItem = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, id])
    } else {
      setSelectedItems(prev => prev.filter(item => item !== id))
    }
  }

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return

    if (confirm(`선택된 ${selectedItems.length}개 품목을 삭제하시겠습니까?`)) {
      setIsLoading(true)
      try {
        // 데이터베이스에서 실제 삭제
        const { error } = await supabase
          .from('items')
          .delete()
          .in('id', selectedItems)

        if (error) {
          console.error('삭제 오류:', error)
          alert(`삭제 중 오류가 발생했습니다: ${error.message}`)
          return
        }

        // 로컬 상태 업데이트
        setStockItems(prev => prev.filter(item => !selectedItems.includes(item.id)))
        setSelectedItems([])

        alert(`${selectedItems.length}개 품목이 성공적으로 삭제되었습니다.`)
      } catch (error) {
        console.error('삭제 처리 오류:', error)
        alert('삭제 처리 중 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleEditItem = (item: StockItem) => {
    setEditingItem(item)
    setIsEditMode(true)
    setStockInModalOpen(true)
  }

  const handleClosing = async () => {
    const confirmMessage = `전체 재고를 마감 처리하시겠습니까?\n\n마감 후:\n- 모든 품목의 현재 재고가 마감 수량으로 설정됩니다\n- 모든 품목의 입고/출고 수량이 0으로 초기화됩니다\n- 마감 이력이 자동으로 저장됩니다\n\n이 작업은 되돌릴 수 없습니다.`

    if (!confirm(confirmMessage)) {
      return
    }

    setIsLoading(true)
    try {
      // 1. 마감 이력 저장을 위한 API 호출
      const response = await fetch('/api/stock/closing-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          closingDate: new Date().toISOString().split('T')[0], // YYYY-MM-DD 형식
          closedBy: user?.name || 'Unknown'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '마감 처리 API 호출 실패')
      }

      const result = await response.json()
      console.log('마감 처리 결과:', result)

      // 2. 로컬 상태 업데이트
      const today = new Date()
      const formattedDate = `${today.getFullYear()}년 ${String(today.getMonth() + 1).padStart(2, '0')}월 ${String(today.getDate()).padStart(2, '0')}일 ${String(today.getHours()).padStart(2, '0')}시 ${String(today.getMinutes()).padStart(2, '0')}분`
      setLastClosingDate(formattedDate)
      localStorage.setItem('lastClosingDate', formattedDate)

      // 3. 데이터 새로고침
      refreshStockData()
      setSelectedItems([])

      alert(`전체 ${result.processedItems || stockItems.length}개 품목의 마감 처리가 완료되었습니다.\n마감 이력이 저장되었습니다.`)
    } catch (error) {
      console.error('마감 처리 오류:', error)
      alert(`마감 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 유틸리티 함수들
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-green-600 bg-green-100'
      case 'used-new': return 'text-blue-600 bg-blue-100'
      case 'used-used': return 'text-yellow-600 bg-yellow-100'
      case 'broken': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return '신품'
      case 'used-new': return '중고-신품급'
      case 'used-used': return '중고-사용급'
      case 'broken': return '불량'
      default: return '알 수 없음'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <CheckCircle className="h-4 w-4" />
      case 'used-new': return <Package className="h-4 w-4" />
      case 'used-used': return <AlertTriangle className="h-4 w-4" />
      case 'broken': return <XCircle className="h-4 w-4" />
      default: return null
    }
  }

  // 통계 데이터 계산
  const statistics = {
    totalItems: stockItems.length,
    totalQuantity: stockItems.reduce((sum, item) => sum + item.currentStock, 0),
    lowStockItems: stockItems.filter(item => item.currentStock <= item.minStock).length,
    totalValue: stockItems.reduce((sum, item) => sum + (item.currentStock * 10000), 0)
  }

  // 고유 값들 추출
  const categories = Array.from(new Set(stockItems.map(item => item.category)))
  const locations = Array.from(new Set(stockItems.map(item => item.location)))
  const suppliers = Array.from(new Set(stockItems.map(item => item.supplier)))

  // 로딩 중이거나 인증되지 않은 경우 로딩 화면 표시
  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  // 사용자 레벨 확인
  const userLevel = String(user?.level || '1')
  const isLevel1 = userLevel === '1'
  const isLevel2 = userLevel === '2'
  const isLevel3 = userLevel === '3'
  const isLevel4 = userLevel === '4'
  const isLevel5 = userLevel === '5'
  const isAdmin = userLevel?.toLowerCase() === 'administrator' || userLevel === 'admin'

  // 권한 설정 (User Request)
  // level1(전체) : 재고 검색만 가능
  // level2(사원) : 재고 검색만 가능
  // level3(CS) : 재고 검색만 가능
  // level4(전기팀) : 재고 검색 및 출고가능
  // level5(부서장) : 재고 검색, 출고, 폐기 가능
  // admin(관리자) : 전체 권한

  const canReadOnly = isLevel1 || isLevel2 || isLevel3
  const canStockOut = isLevel4 || isLevel5 || isAdmin
  const canDisposal = isLevel5 || isAdmin
  const canStockIn = isAdmin
  const canEdit = isAdmin
  const canDelete = isAdmin

  // 체크박스 선택 가능 여부 (출고나 폐기 권한이 있으면 선택 가능)
  const canSelect = canStockOut || canDisposal

  return (
    <AuthGuard requiredLevel={1}>
      <div className="min-h-screen bg-white">
        {/* 공통 헤더 */}
        <CommonHeader
          currentUser={user ? { ...user, level: String(user.level) } : null}
          isAdmin={isAdmin}
          title="재고 관리"
          backUrl="/"
          onShowUserManagement={() => setShowUserManagement(true)}
          onLogout={logout}
          onShowLoginModal={() => router.push('/')}
        />

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* 통계 카드 */}
          <StockStatistics {...statistics} userLevel={userLevel} />

          {/* 재고 목록 헤더 */}
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h2 className="text-lg font-semibold text-gray-900">전체 재고 현황</h2>

                  {/* 읽기 전용 메시지 표시 */}
                  {canReadOnly && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-blue-700 font-medium">읽기 전용 모드</span>
                    </div>
                  )}

                  <div className="flex gap-3 items-center">
                    {/* 입고 버튼 (Admin only) */}
                    {canStockIn && (
                      <Button
                        onClick={() => {
                          setEditingItem(null)
                          setIsEditMode(false)
                          setStockInModalOpen(true)
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        📥 입고
                      </Button>
                    )}

                    {/* 출고 버튼 (Level 4+) */}
                    {canStockOut && (
                      <Button
                        onClick={() => setStockOutModalOpen(true)}
                        disabled={selectedItems.length === 0}
                        className={`${selectedItems.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                      >
                        📤 출고
                      </Button>
                    )}

                    {/* 폐기 버튼 (Level 5+) */}
                    {canDisposal && (
                      <Button
                        onClick={() => setDisposalModalOpen(true)}
                        disabled={selectedItems.length === 0}
                        className={`${selectedItems.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-800'}`}
                      >
                        🗑️ 폐기
                      </Button>
                    )}

                    {/* 마감 버튼 (Admin only) */}
                    {isAdmin && (
                      <Button
                        onClick={handleClosing}
                        className="bg-yellow-600 hover:bg-yellow-700"
                      >
                        📅 마감
                      </Button>
                    )}

                    {/* 삭제 버튼 (Admin only) */}
                    {canDelete && (
                      <Button
                        onClick={handleBulkDelete}
                        disabled={selectedItems.length === 0}
                        className={`${selectedItems.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                      >
                        ❌ 삭제
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <input
                      type="text"
                      placeholder="품목명, 규격, 위치, 카테고리, 공급업체로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <Button
                    onClick={() => { }}
                    className="bg-blue-600 hover:bg-blue-700 px-6"
                  >
                    검색
                  </Button>
                  <Button
                    onClick={refreshStockData}
                    className="bg-gray-600 hover:bg-gray-700 px-4"
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>

            {/* 마지막 마감일 표시 */}
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-end">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-800">마지막 마감일:</span>
                  <span className="text-sm text-gray-600">{lastClosingDate || '없음'}</span>
                </div>
              </div>
            </div>

            {/* 액션 바 - 선택 가능할 때만 표시 */}
            {canSelect && (
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {selectedItems.length > 0 && (
                      <span className="text-sm text-gray-600">
                        {selectedItems.length}개 선택됨
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {/* 선택 삭제 버튼 (Admin only) */}
                    {selectedItems.length > 0 && canDelete && (
                      <Button
                        onClick={handleBulkDelete}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        선택 삭제
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 테이블 헤더 및 본문 스크롤 컨테이너 */}
            <div className="overflow-x-auto">
              <div className="min-w-[1800px]">
                {/* 테이블 헤더 */}
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="grid grid-cols-[40px_2fr_1.5fr_1fr_1fr_1fr_0.8fr_0.8fr_0.8fr_0.8fr_1fr_1fr_0.8fr_1.5fr_40px] gap-4 text-sm font-medium text-gray-700">
                    {/* 선택 권한이 있을 때만 체크박스 헤더 표시 */}
                    <div className="col-span-1">{canSelect ? '선택' : ''}</div>
                    <div>품목</div>
                    <div>규격</div>
                    <div>카테고리</div>
                    <div>공급업체</div>
                    <div>위치</div>
                    <div>마감</div>
                    <div>입고</div>
                    <div>출고</div>
                    <div>재고</div>
                    <div>단가</div>
                    <div>총액</div>
                    <div>상태</div>
                    <div>비고</div>
                    {/* 수정 권한이 있을 때만 수정 헤더 표시 */}
                    <div>{canEdit ? '수정' : ''}</div>
                  </div>
                </div>

                {/* 재고 테이블 */}
                <div className="divide-y divide-gray-200">
                  {isLoading ? (
                    <div className="p-6 text-center">
                      <RefreshCw className="h-8 w-8 mx-auto mb-4 animate-spin text-blue-600" />
                      <p className="text-gray-600">재고 데이터를 불러오는 중...</p>
                    </div>
                  ) : filteredItems.length > 0 ? (
                    filteredItems.map((item) => (
                      <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
                        <div className="grid grid-cols-[40px_2fr_1.5fr_1fr_1fr_1fr_0.8fr_0.8fr_0.8fr_0.8fr_1fr_1fr_0.8fr_1.5fr_40px] gap-4 items-center">
                          {/* 선택 권한이 있을 때만 체크박스 표시 */}
                          <div className="col-span-1">
                            {canSelect && (
                              <input
                                type="checkbox"
                                checked={selectedItems.includes(item.id)}
                                onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{item.name}</div>
                          </div>
                          <div className="text-sm text-gray-600">{item.specification}</div>
                          <div className="text-sm text-gray-600">{item.category}</div>
                          <div className="text-sm text-gray-600">{item.supplier}</div>
                          <div className="text-sm text-gray-600">{item.location}</div>
                          <div className="text-sm text-gray-600">{item.closingQuantity}</div>
                          <div className="text-sm text-green-600 font-medium">{item.inbound}</div>
                          <div className="text-sm text-red-600 font-medium">{item.outbound}</div>
                          <div className="text-sm font-medium text-gray-900">{item.currentStock}</div>
                          <div className="text-sm text-gray-600">{item.unitPrice.toLocaleString()}원</div>
                          <div className="text-sm font-medium text-gray-900">{(item.currentStock * item.unitPrice).toLocaleString()}원</div>
                          <div>
                            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                              {getStatusIcon(item.status)}
                              {getStatusText(item.status)}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 truncate" title={item.notes}>{item.notes}</div>
                          {/* 수정 권한이 있을 때만 수정 버튼 표시 */}
                          <div>
                            {canEdit && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditItem(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      {stockItems.length === 0 ? (
                        <>
                          <p>재고 데이터가 없습니다</p>
                          <p className="text-sm">새로운 품목을 추가해보세요</p>
                        </>
                      ) : (
                        <>
                          <p>검색 결과가 없습니다</p>
                          <p className="text-sm">다른 검색어를 시도해보세요</p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 입고 모달 */}
        <StockInModal
          isOpen={stockInModalOpen}
          onClose={handleStockInModalClose}
          onSave={handleStockInModalSave}
          isEditMode={isEditMode}
          editItem={editingItem}
        />

        {/* 출고 모달 */}
        <StockOutModal
          isOpen={stockOutModalOpen}
          onClose={() => setStockOutModalOpen(false)}
          onSave={async (formData) => {
            try {
              for (const selectedItem of stockItems.filter(item => selectedItems.includes(item.id))) {
                const currentStock = selectedItem.currentStock
                const newStockOut = (selectedItem.outbound || 0) + formData.requestQuantity
                const newCurrentQuantity = Math.max(currentStock - formData.requestQuantity, 0)

                const { error: updateError } = await (supabase as any)
                  .from('items')
                  .update({
                    current_quantity: newCurrentQuantity,
                    stock_out: newStockOut,
                    closing_quantity: newCurrentQuantity,
                    updated_at: new Date().toISOString()
                  })
                  .eq('id', selectedItem.id)

                if (updateError) {
                  console.error('출고 처리 오류:', updateError)
                  alert(`출고 처리 중 오류가 발생했습니다: ${updateError.message}`)
                  return
                }
              }

              setStockOutModalOpen(false)
              refreshStockData()
              alert('출고 처리가 완료되었습니다.')
            } catch (error) {
              console.error('출고 처리 오류:', error)
              alert('출고 처리 중 오류가 발생했습니다.')
            }
          }}
          selectedItems={stockItems
            .filter(item => selectedItems.includes(item.id))
            .map(item => ({
              id: item.id,
              product: item.name,
              spec: item.specification,
              current_quantity: item.currentStock,
              closing_quantity: item.currentStock,
              unit_price: 10000,
              location: item.location
            }))}
        />

        {/* 폐기 모달 */}
        <DisposalModal
          isOpen={disposalModalOpen}
          onClose={() => setDisposalModalOpen(false)}
          selectedItems={selectedItems}
          stockItems={stockItems}
          onSuccess={refreshStockData}
        />
      </div>
    </AuthGuard>
  )
}


