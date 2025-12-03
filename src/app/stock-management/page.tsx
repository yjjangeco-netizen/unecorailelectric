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
  Edit,
  Printer
} from "lucide-react"
import StockStatistics from '@/components/stock/StockStatistics'
import AuthGuard from '@/components/AuthGuard'
import DisposalModal from '@/components/DisposalModal'
import StockInModal from '@/components/StockInModal'
import StockOutModal from '@/components/StockOutModal'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'
import ClosingModal from '@/components/ClosingModal'



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
  // Force recompile check
  const { user, loading: authLoading, isAuthenticated, logout } = useUser()
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
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [closingModalOpen, setClosingModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingItem, setEditingItem] = useState<StockItem | null>(null)

  // Check auth status and redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [authLoading, isAuthenticated, router])

  // Load stock data from DB
  useEffect(() => {
    if (!isAuthenticated) return

    const loadStockData = async () => {
      setIsLoading(true)
      try {
        const { data: stockData, error } = await supabase
          .from('items')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error loading stock data:', error)
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
            category: item.category || 'General',
            unit: 'ea',
            minStock: item.min_stock || 0,
            maxStock: item.max_stock || 100,
            supplier: item.maker || '',
            unitPrice: item.unit_price || 0,
            lastUpdated: item.updated_at || new Date().toISOString().split('T')[0],
            notes: item.note || ''
          }))

          console.log('Loaded stock data:', convertedData)
          setStockItems(convertedData)
          setFilteredItems(convertedData)
        } else {
          console.log('No stock data in DB')
          setStockItems([])
          setFilteredItems([])
        }
      } catch (error) {
        console.error('Exception loading stock data:', error)
        setStockItems([])
        setFilteredItems([])
      } finally {
        setIsLoading(false)
      }
    }

    // Load last closing date
    const savedLastClosingDate = localStorage.getItem('lastClosingDate')
    if (savedLastClosingDate) {
      setLastClosingDate(savedLastClosingDate)
    } else {
      const today = new Date()
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      setLastClosingDate(formattedDate)
      localStorage.setItem('lastClosingDate', formattedDate)
    }

    loadStockData()
  }, [isAuthenticated])

  // Search and Filter
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
  }, [searchTerm, stockItems, sortBy, sortOrder])

  // Refresh data
  const refreshStockData = useCallback(async () => {
    console.log('Refreshing stock data')
    setIsLoading(true)
    try {
      const { data: stockData, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error refreshing data:', error)
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
          category: item.category || 'General',
          unit: 'ea',
          minStock: item.min_stock || 0,
          maxStock: item.max_stock || 100,
          supplier: item.maker || '',
          unitPrice: item.unit_price || 0,
          lastUpdated: item.updated_at || new Date().toISOString().split('T')[0],
          notes: item.note || ''
        }))

        console.log('Refreshed data:', convertedData)
        setStockItems(convertedData)
      }
    } catch (error) {
      console.error('Exception refreshing data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Event Handlers
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

  const handleBulkDelete = () => {
    if (selectedItems.length === 0) return
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    setIsDeleting(true)
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .in('id', selectedItems)

      if (error) {
        console.error('Delete error:', error)
        alert(`Error deleting: ${error.message}`)
        return
      }

      setStockItems(prev => prev.filter(item => !selectedItems.includes(item.id)))
      setSelectedItems([])
      setDeleteModalOpen(false)

      // alert(`${selectedItems.length} items deleted successfully.`)
    } catch (error) {
      console.error('Delete exception:', error)
      alert('Exception during delete.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleStockOutSave = async (data: any) => {
    setIsLoading(true)
    try {
      const promises = selectedItems.map(async (itemId) => {
        const response = await fetch('/api/stock/transaction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'out',
            itemId: itemId,
            quantity: data.requestQuantity,
            reason: data.project || 'Stock Out',
            note: data.notes,
            userLevel: userLevel // Pass userLevel
          })
        })
        
        if (!response.ok) {
           const err = await response.json()
           throw new Error(err.error || 'Failed to stock out')
        }
        return response.json()
      })

      await Promise.all(promises)
      
      alert('Stock out processed successfully')
      setStockOutModalOpen(false)
      setSelectedItems([])
      refreshStockData()
    } catch (error) {
      console.error('Stock out error:', error)
      alert(`Error processing stock out: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEditItem = (item: StockItem) => {
    setEditingItem(item)
    setIsEditMode(true)
    setStockInModalOpen(true)
  }

  const handleClosing = () => {
    setClosingModalOpen(true)
  }

  const handleClosingSave = async (closingDate: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/stock/closing-process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          closingDate: closingDate,
          closedBy: user?.name || 'Unknown'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Closing API failed')
      }

      const result = await response.json()
      console.log('Closing result:', result)

      const today = new Date()
      const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')} ${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`
      setLastClosingDate(formattedDate)
      localStorage.setItem('lastClosingDate', formattedDate)

      refreshStockData()
      setSelectedItems([])
      setClosingModalOpen(false)

      alert(`Closing processed for ${result.processedItems || stockItems.length} items.`)
    } catch (error) {
      console.error('Closing error:', error)
      alert(`Error processing closing: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Utilities
  // Utilities
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'text-emerald-700 bg-emerald-50 border border-emerald-100'
      case 'used-new': return 'text-blue-700 bg-blue-50 border border-blue-100'
      case 'used-used': return 'text-amber-700 bg-amber-50 border border-amber-100'
      case 'broken': return 'text-rose-700 bg-rose-50 border border-rose-100'
      default: return 'text-slate-600 bg-slate-50 border border-slate-100'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return '신품'
      case 'used-new': return '중고(신품급)'
      case 'used-used': return '중고'
      case 'broken': return '고장'
      default: return '미확인'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <CheckCircle className="h-3.5 w-3.5" />
      case 'used-new': return <Package className="h-3.5 w-3.5" />
      case 'used-used': return <AlertTriangle className="h-3.5 w-3.5" />
      case 'broken': return <XCircle className="h-3.5 w-3.5" />
      default: return null
    }
  }

  const statistics = {
    totalItems: stockItems.length,
    totalQuantity: stockItems.reduce((sum, item) => sum + item.currentStock, 0),
    lowStockItems: stockItems.filter(item => item.currentStock <= item.minStock).length,
    totalValue: stockItems.reduce((sum, item) => sum + (item.currentStock * 10000), 0)
  }

  const categories = Array.from(new Set(stockItems.map(item => item.category)))
  const locations = Array.from(new Set(stockItems.map(item => item.location)))
  const suppliers = Array.from(new Set(stockItems.map(item => item.supplier)))

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

  const userLevel = String(user?.level || '1')
  const levelNum = parseInt(userLevel) || 1
  const isAdmin = userLevel?.toLowerCase() === 'administrator' || userLevel === 'admin'

  // 레벨별 재고관리 권한
  // LEVEL1 - 조회만
  // LEVEL2 - 조회, 입고, 출고
  // LEVEL3 - 조회, 입고, 출고
  // LEVEL4 - 조회, 입고, 출고
  // LEVEL5 - 조회, 입고, 출고, 삭제
  // ADMIN - 전체
  
  // 개별 권한이 명시적으로 true면 허용, 아니면 레벨 기반으로 판단
  const canStockIn = user?.stock_in === true || (levelNum >= 2 || isAdmin)
  const canStockOut = user?.stock_out === true || (levelNum >= 2 || isAdmin)
  const canDisposal = user?.stock_disposal === true || (levelNum >= 5 || isAdmin)
  
  // Advanced permissions
  const canDelete = levelNum >= 5 || isAdmin
  const canClosing = levelNum >= 5 || isAdmin
  const canEdit = levelNum >= 5 || isAdmin
  
  // Report viewing permission - 레벨 4 이상 (개별 권한 무시)
  const canReport = levelNum >= 4 || isAdmin



  const canSelect = canStockIn || canStockOut || canDisposal


  // Button classes
  // Button classes
  const stockOutClass = selectedItems.length === 0 
    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow transition-all'
  
  const disposalClass = selectedItems.length === 0 
    ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200' 
    : 'bg-slate-700 hover:bg-slate-800 text-white shadow-sm hover:shadow transition-all'
  
  const deleteClass = selectedItems.length === 0 
    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow transition-all opacity-50 cursor-not-allowed' 
    : 'bg-rose-600 hover:bg-rose-700 text-white shadow-sm hover:shadow transition-all'

  return (
    <div className="min-h-screen bg-white">
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f4f5f7]">
        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto space-y-6">
            
            {/* Removed duplicate StockStatistics */}

            {/* Gradient Banner Header */}


            {/* Statistics Cards - Full Width Row */}
            <div className="mb-8">
               <StockStatistics {...statistics} userLevel={userLevel} />
            </div>

            {/* Main Content: Stock List (Card Style) */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden">
              <div className="px-8 py-6 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">재고 품목</h2>
                  <p className="text-gray-500 text-sm mt-1">재고 품목을 관리하고 추적하세요</p>
                </div>
              </div>

              {/* Action Buttons & Search/Filter Row */}
              <div className="px-8 py-4 bg-white border-b border-gray-100 flex flex-col lg:flex-row items-center justify-between gap-4">
                {/* Left: Action Buttons */}
                <div className="flex flex-wrap gap-3 w-full lg:w-auto">
                  {canStockIn && (
                    <Button
                      onClick={() => {
                        setEditingItem(null)
                        setIsEditMode(false)
                        setStockInModalOpen(true)
                      }}
                      className="h-10 px-4 text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-200 rounded-xl transition-all"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      입고
                    </Button>
                  )}

                  {canStockOut && (
                    <Button
                      onClick={() => setStockOutModalOpen(true)}
                      disabled={selectedItems.length === 0}
                      className={`h-10 px-4 text-sm font-semibold shadow-md rounded-xl transition-all ${
                        selectedItems.length === 0 
                          ? 'bg-gray-100 text-gray-400' 
                          : 'bg-violet-500 hover:bg-violet-600 text-white shadow-violet-200'
                      }`}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      출고
                    </Button>
                  )}

                  {canDisposal && (
                    <Button
                      onClick={() => setDisposalModalOpen(true)}
                      disabled={selectedItems.length === 0}
                      className={`h-10 px-4 text-sm font-semibold shadow-md rounded-xl transition-all ${
                        selectedItems.length === 0 
                          ? 'bg-gray-100 text-gray-400' 
                          : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-200'
                      }`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      폐기
                    </Button>
                  )}
                  
                  {canDelete && (
                    <Button
                      onClick={handleBulkDelete}
                      disabled={selectedItems.length === 0}
                      className={`h-10 px-4 text-sm font-semibold shadow-md rounded-xl transition-all ${
                        selectedItems.length === 0 
                          ? 'bg-gray-100 text-gray-400' 
                          : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-200'
                      }`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      삭제
                    </Button>
                  )}

                  {isAdmin && (
                    <Button
                      onClick={handleClosing}
                      className="h-10 px-4 text-sm font-semibold bg-gray-800 hover:bg-gray-900 text-white shadow-md shadow-gray-300 rounded-xl transition-all"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      마감
                    </Button>
                  )}

                  {canReport && (
                    <Button
                      onClick={() => window.open('/stock-management/history', '_blank')}
                      className="h-10 px-4 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-300 rounded-xl transition-all"
                    >
                      <Printer className="w-4 h-4 mr-2" />
                      입출고리스트
                    </Button>
                  )}
                </div>

                {/* Right: Search & Filters */}
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto items-center">
                   <div className="relative w-full sm:w-64">
                     <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                     <Input 
                       placeholder="검색..." 
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="pl-10 bg-white border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                     />
                   </div>

                </div>
              </div>



              <div className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                      <TableHead className="w-[50px] py-4">
                        <Checkbox 
                          checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                          onCheckedChange={handleSelectAll}
                          className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                      </TableHead>
                      <TableHead className="py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleSort('name')}>제품정보</TableHead>
                      <TableHead className="py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleSort('category')}>카테고리</TableHead>
                      <TableHead className="py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleSort('location')}>위치</TableHead>
                      <TableHead className="py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right cursor-pointer hover:text-gray-700" onClick={() => handleSort('currentStock')}>재고</TableHead>
                      <TableHead className="py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700" onClick={() => handleSort('status')}>상태</TableHead>
                      <TableHead className="py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                          <div className="flex flex-col items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                            데이터 로딩 중...
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center text-gray-500">
                          검색 조건에 맞는 품목이 없습니다.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-blue-50/30 transition-colors border-b border-gray-50 last:border-0 group">
                          <TableCell className="py-4">
                            <Checkbox 
                              checked={selectedItems.includes(item.id)}
                              onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                              className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{item.name}</span>
                              <span className="text-xs text-gray-500 mt-0.5">{item.specification}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                              {item.category}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 text-sm text-gray-600">{item.location}</TableCell>
                          <TableCell className="py-4 text-right">
                            <div className={`font-mono font-medium ${item.currentStock <= item.minStock ? "text-rose-600" : "text-gray-900"}`}>
                              {item.currentStock.toLocaleString()}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium shadow-sm ${getStatusColor(item.status)}`}>
                              {getStatusIcon(item.status)}
                              <span className="ml-1.5">{getStatusText(item.status)}</span>
                            </span>
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            {canEdit && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleEditItem(item)}
                                className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <StockInModal
        isOpen={stockInModalOpen}
        onClose={handleStockInModalClose}
        onSave={handleStockInModalSave}
        isEditMode={isEditMode}
        editItem={editingItem}
      />
      
      <StockOutModal
        isOpen={stockOutModalOpen}
        onClose={() => setStockOutModalOpen(false)}
        onSave={handleStockOutSave}
        selectedItems={stockItems.filter(item => selectedItems.includes(item.id)).map(item => ({
          id: item.id,
          product: item.name,
          spec: item.specification,
          current_quantity: item.currentStock,
          closing_quantity: item.closingQuantity,
          unit_price: item.unitPrice,
          location: item.location
        }))}
      />

      <DisposalModal
        isOpen={disposalModalOpen}
        onClose={() => setDisposalModalOpen(false)}
        selectedItems={selectedItems}
        stockItems={stockItems}
        onSuccess={() => {
          refreshStockData()
          setSelectedItems([])
        }}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        itemCount={selectedItems.length}
        isDeleting={isDeleting}
      />

      <ClosingModal
        isOpen={closingModalOpen}
        onClose={() => setClosingModalOpen(false)}
        onSave={handleClosingSave}
        stockItems={stockItems}
      />
    </div>
  )
}
