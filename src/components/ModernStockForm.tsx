'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Package, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Save, 
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  MapPin,
  Tag,
  Users,
  Clock
} from 'lucide-react'

interface StockItem {
  id: string
  name: string
  specification: string
  category: string
  location: string
  currentStock: number
  minStock: number
  maxStock: number
  unit: string
  supplier: string
  status: 'new' | 'used-new' | 'used-used' | 'broken'
  lastUpdated: string
  notes: string
}

interface StockTransaction {
  id: string
  itemId: string
  type: 'in' | 'out' | 'adjustment'
  quantity: number
  reason: string
  user: string
  date: string
  notes: string
}

interface ModernStockFormProps {
  onSubmit: (data: any) => void
  initialData?: StockItem
  mode: 'create' | 'edit' | 'transaction'
}

export default function ModernStockForm({ 
  onSubmit, 
  initialData,
  mode = 'create' 
}: ModernStockFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    specification: '',
    category: '',
    location: '',
    currentStock: 0,
    minStock: 0,
    maxStock: 0,
    unit: '개',
    supplier: '',
    status: 'new' as 'new' | 'used-new' | 'used-used' | 'broken',
    notes: ''
  })

  const [transactionData, setTransactionData] = useState({
    type: 'in' as const,
    quantity: 0,
    reason: '',
    user: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  })

  const [errors, setErrors] = useState<{
    name?: string
    category?: string
    minStock?: string
    maxStock?: string
    quantity?: string
    reason?: string
  }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 초기 데이터 설정
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        specification: initialData.specification,
        category: initialData.category,
        location: initialData.location,
        currentStock: initialData.currentStock,
        minStock: initialData.minStock,
        maxStock: initialData.maxStock,
        unit: initialData.unit,
        supplier: initialData.supplier,
        status: initialData.status as 'new' | 'used-new' | 'used-used' | 'broken',
        notes: initialData.notes
      })
    }
  }, [initialData])

  // 유효성 검사
  const validateForm = () => {
    const newErrors: {
      name?: string
      category?: string
      minStock?: string
      maxStock?: string
      quantity?: string
      reason?: string
    } = {}

    if (!formData.name.trim()) {
      newErrors.name = '품목명은 필수입니다.'
    }

    if (!formData.category) {
      newErrors.category = '카테고리는 필수입니다.'
    }

    if (formData.minStock < 0) {
      newErrors.minStock = '최소 재고는 0 이상이어야 합니다.'
    }

    if (formData.maxStock < formData.minStock) {
      newErrors.maxStock = '최대 재고는 최소 재고보다 커야 합니다.'
    }

    if (mode === 'transaction') {
      if (transactionData.quantity <= 0) {
        newErrors.quantity = '수량은 0보다 커야 합니다.'
      }
      if (!transactionData.reason.trim()) {
        newErrors.reason = '사유는 필수입니다.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const data = mode === 'transaction' 
        ? { ...formData, transaction: transactionData }
        : formData
      
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 재고 상태 계산
  const getStockStatus = (current: number, min: number, max: number) => {
    if (current <= min) return 'low'
    if (current >= max) return 'high'
    return 'normal'
  }

  const stockStatus = getStockStatus(formData.currentStock, formData.minStock, formData.maxStock)

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl mb-4">
          <Package className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {mode === 'create' ? '새 재고 등록' : 
           mode === 'edit' ? '재고 수정' : '재고 입출고'}
        </h1>
        <p className="text-gray-600">
          {mode === 'create' ? '새로운 재고 항목을 등록하세요' :
           mode === 'edit' ? '재고 정보를 수정하세요' : '재고 입출고를 기록하세요'}
        </p>
      </div>

      {/* 재고 상태 알림 */}
      {mode === 'edit' && (
        <Alert className={stockStatus === 'low' ? 'border-red-200 bg-red-50' : 
                          stockStatus === 'high' ? 'border-yellow-200 bg-yellow-50' : 
                          'border-green-200 bg-green-50'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {stockStatus === 'low' ? '재고가 부족합니다. 주문을 고려하세요.' :
             stockStatus === 'high' ? '재고가 충분합니다.' :
             '재고 상태가 정상입니다.'}
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 기본 정보 카드 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              기본 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">품목명 *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="품목명을 입력하세요"
                  className="mt-1"
                  disabled={mode === 'transaction'}
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>
              <div>
                <Label htmlFor="specification">규격/사양</Label>
                <Input
                  id="specification"
                  value={formData.specification}
                  onChange={(e) => setFormData(prev => ({ ...prev, specification: e.target.value }))}
                  placeholder="규격 또는 사양을 입력하세요"
                  className="mt-1"
                  disabled={mode === 'transaction'}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category">카테고리 *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                  disabled={mode === 'transaction'}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="전자부품">전자부품</SelectItem>
                    <SelectItem value="기계부품">기계부품</SelectItem>
                    <SelectItem value="소모품">소모품</SelectItem>
                    <SelectItem value="도구">도구</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
              </div>
              <div>
                <Label htmlFor="unit">단위</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                  disabled={mode === 'transaction'}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="단위 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="개">개</SelectItem>
                    <SelectItem value="EA">EA</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="m">m</SelectItem>
                    <SelectItem value="세트">세트</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status">상태</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                  disabled={mode === 'transaction'}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">신품</SelectItem>
                    <SelectItem value="used-new">중고-양호</SelectItem>
                    <SelectItem value="used-used">중고-보통</SelectItem>
                    <SelectItem value="broken">불량품</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 재고 정보 카드 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              재고 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="currentStock">현재 재고</Label>
                <Input
                  id="currentStock"
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentStock: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                  disabled={mode === 'transaction'}
                />
              </div>
              <div>
                <Label htmlFor="minStock">최소 재고</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, minStock: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                  disabled={mode === 'transaction'}
                />
                {errors.minStock && <p className="text-red-500 text-sm mt-1">{errors.minStock}</p>}
              </div>
              <div>
                <Label htmlFor="maxStock">최대 재고</Label>
                <Input
                  id="maxStock"
                  type="number"
                  value={formData.maxStock}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxStock: parseInt(e.target.value) || 0 }))}
                  className="mt-1"
                  disabled={mode === 'transaction'}
                />
                {errors.maxStock && <p className="text-red-500 text-sm mt-1">{errors.maxStock}</p>}
              </div>
            </div>

            {/* 재고 상태 표시 */}
            {mode === 'edit' && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">재고 상태</span>
                  <Badge variant={stockStatus === 'low' ? 'destructive' : 
                                 stockStatus === 'high' ? 'secondary' : 'default'}>
                    {stockStatus === 'low' ? '부족' : 
                     stockStatus === 'high' ? '충분' : '정상'}
                  </Badge>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${
                      stockStatus === 'low' ? 'bg-red-500' : 
                      stockStatus === 'high' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, (formData.currentStock / Math.max(formData.maxStock, 1)) * 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 입출고 정보 (transaction 모드일 때만) */}
        {mode === 'transaction' && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                입출고 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">구분</Label>
                  <Select
                    value={transactionData.type}
                    onValueChange={(value: any) => setTransactionData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="구분 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">입고</SelectItem>
                      <SelectItem value="out">출고</SelectItem>
                      <SelectItem value="adjustment">조정</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="quantity">수량 *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={transactionData.quantity}
                    onChange={(e) => setTransactionData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                    className="mt-1"
                  />
                  {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="reason">사유 *</Label>
                <Input
                  id="reason"
                  value={transactionData.reason}
                  onChange={(e) => setTransactionData(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="입출고 사유를 입력하세요"
                  className="mt-1"
                />
                {errors.reason && <p className="text-red-500 text-sm mt-1">{errors.reason}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="user">담당자</Label>
                  <Input
                    id="user"
                    value={transactionData.user}
                    onChange={(e) => setTransactionData(prev => ({ ...prev, user: e.target.value }))}
                    placeholder="담당자명을 입력하세요"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="date">일자</Label>
                  <Input
                    id="date"
                    type="date"
                    value={transactionData.date}
                    onChange={(e) => setTransactionData(prev => ({ ...prev, date: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 위치 및 공급업체 정보 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              위치 및 공급업체
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location">보관 위치</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="보관 위치를 입력하세요"
                  className="mt-1"
                  disabled={mode === 'transaction'}
                />
              </div>
              <div>
                <Label htmlFor="supplier">공급업체</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  placeholder="공급업체명을 입력하세요"
                  className="mt-1"
                  disabled={mode === 'transaction'}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 메모 */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>메모</CardTitle>
            <CardDescription>추가적인 사항이나 특이사항을 기록하세요</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={mode === 'transaction' ? transactionData.notes : formData.notes}
              onChange={(e) => mode === 'transaction' 
                ? setTransactionData(prev => ({ ...prev, notes: e.target.value }))
                : setFormData(prev => ({ ...prev, notes: e.target.value }))
              }
              placeholder="특이사항이나 추가 메모를 입력하세요"
              className="min-h-[100px]"
            />
          </CardContent>
        </Card>

        {/* 제출 버튼 */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" size="lg">
            취소
          </Button>
          <Button 
            type="submit" 
            size="lg" 
            className="bg-gradient-to-r from-green-600 to-blue-600"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                처리 중...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {mode === 'create' ? '등록하기' : 
                 mode === 'edit' ? '수정하기' : '입출고 기록'}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
