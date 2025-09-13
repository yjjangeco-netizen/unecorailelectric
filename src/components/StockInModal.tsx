'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Package, Plus, Upload, FileSpreadsheet, Save } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/hooks/useUser'

// 엄격한 타입 정의
interface StockInFormData {
  product: string // 품목명 (필수)
  spec: string // 규격 (필수)
  location: string // 위치 (필수)
  quantity: string // 수량 (필수)
  maker: string // 제조사
  unitPrice: string // 단가
  purpose: string // 용도
  note: string // 비고
  stockStatus: 'new' | 'used-new' | 'used-used' | 'broken' | '' // 품목 상태 (빈 문자열 허용, 데이터베이스 기준)
  stockInDate: string // 입고일
}

// 품목 상태 매핑 함수 (데이터베이스 기준)
const mapItemConditionToStockStatus = (condition: 'new' | 'used-new' | 'used-used' | 'broken' | ''): string => {
  switch (condition) {
    case 'new': return '신품'
    case 'used-new': return '중고신품'
    case 'used-used': return '중고사용품'
    case 'broken': return '불량품'
    case '': return '미선택'
    default: return '미선택'
  }
}

interface ExcelStockInData {
  product: string // 품목명 (필수)
  spec: string // 규격 (필수)
  location: string // 위치 (필수)
  quantity: number // 수량 (필수)
  maker: string // 제조사
  unitPrice: number // 단가
  purpose: string // 용도
  note: string // 비고
  stockStatus: 'new' | 'used-new' | 'used-used' | 'broken' | '' // 품목 상태 (빈 문자열 허용, 데이터베이스 기준)
  stockInDate: string // 입고일
  closingQuantity: number // 마감수량 (새로 추가)
  stockIn: number // 입고수량 (새로 추가)
  stockOut: number // 출고수량 (새로 추가)
}

interface ExistingStockItem {
  id: string
  product: string
  spec: string
  currentQuantity: number
  notes: string
}

interface StockInModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  existingStock?: ExistingStockItem[] // 기존 재고 데이터
  isEditMode?: boolean // 수정 모드 여부
  editItem?: any // 수정할 아이템 데이터
}

export default function StockInModal({ isOpen, onClose, onSave, existingStock: _existingStock = [], isEditMode = false, editItem }: StockInModalProps) {
  const { user, isAuthenticated, executeWithDbPermission, checkDbPermission, canEdit } = useUser()
  // 수정 모드에서는 탭 없음
  const [activeTab, setActiveTab] = useState<'manual' | 'excel'>('manual')
  
  // 디버깅: props 확인
  console.log('StockInModal props:', { isOpen, isEditMode, editItem })
  const [formData, setFormData] = useState({
    product: '', // 품목명 (필수)
    spec: '', // 규격 (필수)
    location: '', // 위치 (필수)
    quantity: '', // 입고수량 (필수)
    maker: '', // 제조사
    unitPrice: '', // 단가 (선택)
    purpose: '재고관리', // 용도 (기본값)
    note: '', // 비고
    stockStatus: 'new' as 'new' | 'used-new' | 'used-used' | 'broken' | '', // 품목 상태 (사용자가 선택해야 함, 데이터베이스 기준)
    stockInDate: new Date().toISOString().split('T')[0] || '' // 오늘 날짜를 기본값으로
  })
  
  // 수정 모드용 추가 필드
  const [editFormData, setEditFormData] = useState({
    stockInQuantity: '', // 입고수량
    stockOutQuantity: '', // 출고수량
    disposalQuantity: '', // 폐기수량
    closingQuantity: '', // 마감수량
    currentQuantity: '' // 현재고 (계산값)
  })
  
  // 수정된 필드 추적
  const [modifiedFields, setModifiedFields] = useState({
    stockInQuantity: false,
    stockOutQuantity: false,
    product: false,
    spec: false,
    location: false,
    maker: false,
    unitPrice: false,
    stockStatus: false,
    note: false
  })
  
  // 에러 상태 추적
  const [fieldErrors, setFieldErrors] = useState({
    product: false,
    spec: false,
    location: false,
    stockStatus: false,
    stockInQuantity: false,
    stockOutQuantity: false
  })
  
  // 현재고 계산 함수: 현재고 = 마감수량 + 입고수량 - 출고수량
  const calculateCurrentQuantity = (closing: number, stockIn: number, stockOut: number) => {
    return closing + stockIn - stockOut
  }
  
  // 현재고 자동 계산 제거 - 수정 모드에서는 현재고 필드를 표시하지 않음

  // 수정 모드일 때 기존 데이터로 폼 초기화
  useEffect(() => {
    if (isEditMode && editItem && isOpen) {
      console.log('수정 모드 초기화 - editItem:', editItem)
      setFormData({
        product: editItem.name || editItem.product || '',
        spec: editItem.specification || editItem.spec || '',
        location: editItem.location || '',
        quantity: '', // 입고수량은 별도 입력
        maker: editItem.supplier || editItem.maker || '',
        unitPrice: editItem.unit_price?.toString() || '',
        purpose: editItem.purpose || '재고관리',
        note: editItem.notes || editItem.note || '',
        stockStatus: (editItem.status || editItem.stock_status || 'new') as 'new' | 'used-new' | 'used-used' | 'broken' | '',
        stockInDate: new Date().toISOString().split('T')[0] || ''
      })
      
      // 수정 모드용 필드 초기화
      console.log('editItem 전체 데이터:', JSON.stringify(editItem, null, 2))
      console.log('inbound 값:', editItem.inbound)
      console.log('outbound 값:', editItem.outbound)
      console.log('closingQuantity 값:', editItem.closingQuantity)
      console.log('currentStock 값:', editItem.currentStock)
      
      setEditFormData({
        stockInQuantity: editItem.inbound?.toString() || '0',
        stockOutQuantity: editItem.outbound?.toString() || '0',
        disposalQuantity: '0', // 폐기수량은 사용하지 않음
        closingQuantity: editItem.closingQuantity?.toString() || '0',
        currentQuantity: editItem.currentStock?.toString() || '0'
      })
      
      console.log('설정된 editFormData:', {
        stockInQuantity: editItem.inbound?.toString() || '0',
        stockOutQuantity: editItem.outbound?.toString() || '0',
        closingQuantity: editItem.closingQuantity?.toString() || '0'
      })
    } else if (!isEditMode && isOpen) {
      // 입고 모드일 때 폼 초기화
      setFormData({
        product: '',
        spec: '',
        location: '',
        quantity: '',
        maker: '',
        unitPrice: '',
        purpose: '재고관리',
        note: '',
        stockStatus: 'new' as 'new' | 'used-new' | 'used-used' | 'broken' | '',
        stockInDate: new Date().toISOString().split('T')[0] || ''
      })
    }
  }, [isEditMode, editItem, isOpen])

  // editFormData 변경 감지
  useEffect(() => {
    console.log('editFormData 변경됨:', editFormData)
  }, [editFormData])
  const [excelData, setExcelData] = useState<ExcelStockInData[]>([])
  const [isProcessingExcel, setIsProcessingExcel] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // 중복 확인 팝업 상태
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateItem, setDuplicateItem] = useState<ExistingStockItem | null>(null)
  const [pendingStockInData, setPendingStockInData] = useState<any>(null)

  // 중복 재고 확인 - 동일한 품목+규격도 별도로 입고 가능
  const checkDuplicateStock = (_product: string, _spec: string): ExistingStockItem | null => {
    // 동일한 품목+규격도 별도로 입고 가능하도록 null 반환
    // 각각의 입고는 독립적으로 처리됨
    return null
  }

  // 품목상태 표시용 함수 추가 (통일된 함수 사용)
  const getStockStatusDisplayText = (status: 'new' | 'used-new' | 'used-used' | 'broken' | string): string => {
    // 디버깅: 상태값 확인
    console.log('=== getStockStatusDisplayText 디버깅 ===');
    console.log('입력된 status:', status);
    console.log('status 타입:', typeof status);
    console.log('=== 디버깅 끝 ===');
    
    if (status === '') return '미선택'
    if (status === 'new') return '신품'
    if (status === 'used-new') return '중고신품'
    if (status === 'used-used') return '중고사용품'
    if (status === 'broken') return '불량품'
    
    // 유효하지 않은 상태값은 '알 수 없음' 반환
    console.warn(`유효하지 않은 status: "${status}", "알 수 없음" 반환`);
    return '알 수 없음'
  }

  // 수정 모드에서 재고 항목 업데이트 함수
  const updateStockItem = async (data: any): Promise<void> => {
    if (!editItem?.id) {
      throw new Error('수정할 항목의 ID를 찾을 수 없습니다.')
    }

    try {
      console.log('재고 항목 수정 시작:', { itemId: editItem.id, data })
      
      // UUID 기반 단일 테이블 업데이트 (통합 완료)
      console.log('업데이트 시도 - ID:', editItem.id, 'ID 타입:', typeof editItem.id)
      
      const updateData: any = {
        updated_at: new Date().toISOString()
      }
      
      // 수정된 필드만 업데이트
      if (modifiedFields.product) {
        updateData.name = data.product
      }
      if (modifiedFields.spec) {
        updateData.specification = data.spec
      }
      if (modifiedFields.location) {
        updateData.location = data.location
      }
      if (modifiedFields.maker) {
        updateData.maker = data.maker || ''
      }
      if (modifiedFields.unitPrice) {
        updateData.unit_price = data.unitPrice ? parseFloat(data.unitPrice) : null
      }
      if (modifiedFields.stockStatus) {
        updateData.stock_status = data.stockStatus
      }
      if (modifiedFields.note) {
        updateData.note = data.note || ''
      }
      if (modifiedFields.stockInQuantity) {
        updateData.stock_in = parseInt(editFormData.stockInQuantity) || 0
      }
      if (modifiedFields.stockOutQuantity) {
        updateData.stock_out = parseInt(editFormData.stockOutQuantity) || 0
      }
      
      // 입고수량이나 출고수량이 변경된 경우 current_quantity 재계산
      if (modifiedFields.stockInQuantity || modifiedFields.stockOutQuantity) {
        const closingQuantity = parseInt(editFormData.closingQuantity) || 0
        const stockInQuantity = parseInt(editFormData.stockInQuantity) || 0
        const stockOutQuantity = parseInt(editFormData.stockOutQuantity) || 0
        
        // 현재고 = 마감수량 + 입고수량 - 출고수량 (통일된 공식)
        const calculatedCurrentQuantity = closingQuantity + stockInQuantity - stockOutQuantity
        updateData.current_quantity = calculatedCurrentQuantity
        updateData.stock_in = stockInQuantity
        updateData.stock_out = stockOutQuantity
        
        console.log('현재고 재계산:', {
          closingQuantity,
          stockInQuantity,
          stockOutQuantity,
          calculatedCurrentQuantity
        })
      }
      
      console.log('업데이트 데이터:', updateData)
      
      // UUID ID로 직접 업데이트 (통합된 테이블)
      const { data: updateResult, error: updateError } = await supabase
        .from('items')
        .update(updateData)
        .eq('id', editItem.id)  // UUID 직접 사용
        .select()

      if (updateError) {
        console.error('Supabase 업데이트 오류:', updateError)
        throw new Error(`수정 처리 실패: ${updateError.message}`)
      }

      if (!updateResult || updateResult.length === 0) {
        throw new Error('해당 품목을 찾을 수 없습니다.')
      }

      console.log('재고 항목 수정 완료:', updateResult[0])
      
    } catch (error) {
      console.error('재고 항목 수정 오류:', error)
      throw new Error(`재고 항목 수정에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    }
  }

  // DB에 입고 데이터 저장 (권한 기반) - 트랜잭션 적용
  const saveStockInToDB = async (data: any): Promise<{ success: boolean; itemId: string | 'unknown' }> => {
    setIsSaving(true)
    
    try {
      // 권한 확인 - admin 사용자는 우선 허용
      let hasPermission = false
      
      // 현재 사용자 정보 확인
      const currentUser = localStorage.getItem('currentUser')
      if (currentUser) {
        try {
          const userData = JSON.parse(currentUser)
          // admin 사용자는 모든 권한 허용
          if (userData.role === '관리자' || userData.username === 'admin') {
            console.log('admin 사용자 권한 확인: 입고 처리 - 모든 권한 허용')
            hasPermission = true
          }
        } catch (error) {
          console.error('사용자 정보 파싱 오류:', error)
        }
      }
      
      // admin이 아닌 경우에만 level2 권한 체크
      if (!hasPermission) {
        hasPermission = await checkDbPermission('level2')
        if (!hasPermission) {
          throw new Error('입고 권한이 부족합니다. level2 이상의 권한이 필요합니다.')
        }
      }

      // 단가 검증 강화 (수정됨)
      const unitPrice = parseFloat(data.unitPrice)
      if (isNaN(unitPrice) || unitPrice <= 0) {
        throw new Error('단가는 0보다 큰 숫자여야 합니다.')
      }

      // 디버깅: 전송되는 데이터 로그
      console.log('=== 입고 API 호출 디버깅 ===');
      console.log('선택된 품목 상태:', data.stockStatus);
      console.log('전송될 p_stock_status:', data.stockStatus);
      console.log('전체 전송 데이터:', {
        p_product: data.product,
        p_spec: data.spec,
        p_maker: data.maker ?? '',
        p_unit_price: unitPrice,
        p_stock_status: data.stockStatus,
        p_note: data.note ?? '',
        p_purpose: data.purpose ?? '재고관리',
        p_quantity: parseInt(data.quantity),
        p_received_by: 'yjjang',
        p_event_date: data.stockInDate
      });
      console.log('=== 디버깅 끝 ===');

      // 기존 인증 시스템 사용 (Supabase 세션 대신)
      console.log('=== 인증 확인 디버깅 ===')
      console.log('현재 사용자:', user)
      console.log('인증 상태:', isAuthenticated)
      console.log('=== 인증 확인 디버깅 끝 ===')
      
      if (!isAuthenticated || !user) {
        throw new Error('로그인이 필요합니다. 다시 로그인해주세요.')
      }

      // 임시 토큰 생성 (실제로는 서버에서 검증하지 않음)
      const token = `temp_${user.id}_${Date.now()}`

      // API를 통한 입고 처리 (스키마 검증 포함)
      const response = await fetch('/api/stock/in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: data.product,
          specification: data.spec,
          maker: data.maker || '',
          location: data.location || '창고A',
          quantity: parseInt(data.quantity),
          unit_price: unitPrice,
          stock_status: data.stockStatus,
          reason: data.purpose || '재고관리',
          note: data.note || ''
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API 오류:', errorData)
        throw new Error(`입고 처리 실패: ${errorData.error || '알 수 없는 오류'}`)
      }

      const result = await response.json()

      // API 응답 처리
      if (!result.ok) {
        throw new Error(`입고 처리 실패: ${result.error || '알 수 없는 오류'}`)
      }
      
      console.log('입고 완료 - 품목 ID:', result.data?.item_id || 'unknown')
      
      // 디버깅: API 응답 결과 확인
      console.log('=== API 응답 결과 확인 ===');
      console.log('전체 result:', result);
      console.log('result.data:', result.data);
      console.log('=== 결과 확인 끝 ===');

      // UI 업데이트를 위해 부모 컴포넌트에 알림 (안전성 검사 추가)
      try {
        if (typeof onSave === 'function') {
          onSave(data)
        } else {
          console.warn('onSave 함수가 정의되지 않음')
        }
      } catch (onSaveError) {
        console.error('onSave 함수 실행 중 오류:', onSaveError)
        // onSave 에러는 무시하고 계속 진행 (DB 저장은 성공했으므로)
      }
      
      // 성공 알림 표시
      alert('입고가 성공적으로 저장되었습니다!')
      
      // 모달 닫기 전에 잠시 대기 (사용자가 메시지 확인할 수 있도록)
      setTimeout(() => {
        onClose()
      }, 1000)
      
      // API 응답에서 item_id 추출
      const itemId = result.data?.item_id || 'unknown'
      
      return { success: true, itemId }

    } catch (error) {
      console.error('DB 저장 오류:', error)
      alert(`저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
      throw error // 에러를 다시 던져서 상위에서 처리
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 수정 모드와 입고 모드를 구분하여 유효성 검사
    if (isEditMode) {
      // 수정 모드에서는 별도의 유효성 검사 로직 사용 (아래에서 처리)
      console.log('수정 모드 - 기본 유효성 검사 건너뛰기')
    } else {
      // 입고 모드에서만 기본 유효성 검사 실행
      console.log('입고 모드 - 기본 유효성 검사 실행')
      
      // 필수 입력값 검증
      if (!formData.product.trim()) {
        alert('품목명을 입력해주세요.')
        return
      }
      
      if (!formData.spec.trim()) {
        alert('규격을 입력해주세요.')
        return
      }
      
      if (!formData.location.trim()) {
        alert('위치를 입력해주세요.')
        return
      }
      
      if (!formData.quantity || parseInt(formData.quantity) <= 0) {
        alert('유효한 수량을 입력해주세요.')
        return
      }
      
      // 단가는 선택사항이므로 검증 제거
    }
    
    // 단가는 선택사항이므로 빈 값일 때는 0으로 처리
    const unitPrice = formData.unitPrice.trim() ? parseFloat(formData.unitPrice) : 0
    if (formData.unitPrice.trim() && (isNaN(unitPrice) || unitPrice < 0)) {
      alert('유효한 단가를 입력해주세요. (0 이상의 숫자)')
      return
    }

    // 품목 상태 검증 추가
    if (!formData.stockStatus) {
      alert('품목 상태를 선택해주세요.')
      return
    }
    
    // 허용된 4가지 상태값만 검증 (데이터베이스 기준)
    const allowedStatuses = ['new', 'used-new', 'used-used', 'broken']
    if (!allowedStatuses.includes(formData.stockStatus)) {
      alert('올바르지 않은 품목 상태입니다. 신품, 중고신품, 중고사용품, 불량품 중에서 선택해주세요.')
      return
    }

    // 디버깅: 폼 제출 시 상태값 로그
    console.log('=== 폼 제출 디버깅 ===');
    console.log('formData.stockStatus:', formData.stockStatus);
    console.log('선택된 상태값 타입:', typeof formData.stockStatus);
    console.log('허용된 상태값 목록:', allowedStatuses);
    console.log('상태값이 허용 목록에 포함됨:', allowedStatuses.includes(formData.stockStatus));
    console.log('=== 폼 제출 디버깅 끝 ===');

    if (isEditMode) {
      // 에러 상태 초기화
      setFieldErrors({
        product: false,
        spec: false,
        location: false,
        stockStatus: false,
        stockInQuantity: false,
        stockOutQuantity: false
      })
      
      let hasError = false
      
      // 수정 모드 필수 필드 검증
      if (!formData.product.trim()) {
        setFieldErrors(prev => ({ ...prev, product: true }))
        hasError = true
      }
      
      if (!formData.spec.trim()) {
        setFieldErrors(prev => ({ ...prev, spec: true }))
        hasError = true
      }
      
      if (!formData.location.trim()) {
        setFieldErrors(prev => ({ ...prev, location: true }))
        hasError = true
      }
      
      if (!formData.stockStatus) {
        setFieldErrors(prev => ({ ...prev, stockStatus: true }))
        hasError = true
      }
      
      console.log('=== 폼 제출 시 유효성 검사 시작 ===')
      console.log('검증 시 editFormData:', editFormData)
      console.log('stockInQuantity 값:', editFormData.stockInQuantity, '타입:', typeof editFormData.stockInQuantity)
      console.log('stockOutQuantity 값:', editFormData.stockOutQuantity, '타입:', typeof editFormData.stockOutQuantity)
      
      // 수정 모드에서는 editFormData의 값들을 사용하여 검증
      const stockInQty = parseInt(editFormData.stockInQuantity) || 0
      const stockOutQty = parseInt(editFormData.stockOutQuantity) || 0
      
      console.log('파싱된 수량:', { stockInQty, stockOutQty })
      console.log('stockInQuantity === "":', editFormData.stockInQuantity === '')
      console.log('stockInQty < 0:', stockInQty < 0)
      console.log('stockOutQuantity === "":', editFormData.stockOutQuantity === '')
      console.log('stockOutQty < 0:', stockOutQty < 0)
      
      if (editFormData.stockInQuantity === '' || stockInQty < 0) {
        console.log('❌ 입고수량 검증 실패:', editFormData.stockInQuantity, '파싱된 값:', stockInQty)
        setFieldErrors(prev => ({ ...prev, stockInQuantity: true }))
        hasError = true
      } else {
        console.log('✅ 입고수량 검증 성공:', editFormData.stockInQuantity, '파싱된 값:', stockInQty)
      }
      
      if (editFormData.stockOutQuantity === '' || stockOutQty < 0) {
        console.log('❌ 출고수량 검증 실패:', editFormData.stockOutQuantity, '파싱된 값:', stockOutQty)
        setFieldErrors(prev => ({ ...prev, stockOutQuantity: true }))
        hasError = true
      } else {
        console.log('✅ 출고수량 검증 성공:', editFormData.stockOutQuantity, '파싱된 값:', stockOutQty)
      }
      
      console.log('hasError:', hasError)
      console.log('=== 폼 제출 시 유효성 검사 끝 ===')
      
      if (hasError) {
        alert('입력 오류가 있습니다. 빨간색으로 표시된 필드를 확인해주세요.')
        return
      }
      
      // Modified: 새로운 권한 시스템 사용
      if (!canEdit()) {
        alert('수정 기능은 level5 이상 또는 관리자만 사용할 수 있습니다.')
        return
      }
      
      try {
        await updateStockItem(formData) 
        alert(`✅ ${formData.product} 수정 완료!`)
        onSave(formData)
        onClose()
      } catch (error) {
        console.error('수정 처리 중 오류:', error)
        alert(`수정 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
      }
    } else {
      // 입고 모드일 때
      // 중복 재고 확인 (품목명 + 규격으로 확인)
      const duplicate = checkDuplicateStock(formData.product, formData.spec)
      if (duplicate) {
        setDuplicateItem(duplicate)
        setPendingStockInData(formData)
        setShowDuplicateModal(true)
        return
      }
      
      // DB에 저장 (에러 처리 개선)
      try {
        const result = await saveStockInToDB(formData)
        
        // 성공 시 onSave 콜백 호출하고 모달 닫기
        if (result.success) {
          console.log('입고 처리 성공, onSave 콜백 호출')
          console.log('전달할 데이터:', formData) // 디버깅용 로그 추가
          
          // 성공 메시지 표시
          alert(`✅ ${formData.product} 입고 완료!\n수량: ${formData.quantity}개\n상태: ${getStockStatusDisplayText(formData.stockStatus)}`)
          
          onSave(formData)
          onClose()
        }
      } catch (error) {
        console.error('입고 처리 중 오류:', error)
        // 에러를 상위로 전파하지 않고 사용자에게만 알림
        alert(`입고 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
        // 에러 발생 시에도 모달은 열어둠 (사용자가 수정할 수 있도록)
      }
    }
  }

  // 중복 재고 처리 - 기존재고와 합치기
  const handleMergeWithExisting = () => {
    if (duplicateItem && pendingStockInData) {
      const mergedData: any = {
        ...pendingStockInData,
        note: `기존재고(${duplicateItem.currentQuantity}개)와 합침. ${pendingStockInData.note}`.trim()
      }
      onSave(mergedData)
      setShowDuplicateModal(false)
      setDuplicateItem(null)
      setPendingStockInData(null)
      onClose()
    }
  }

  // 엑셀 파일 처리
  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.')
      return
    }

    setIsProcessingExcel(true)
    try {
      const data = await parseExcelFile(file)
      setExcelData(data)
      alert(`${data.length}개의 품목이 성공적으로 읽혔습니다.`)
    } catch (error) {
      console.error('엑셀 파일 처리 오류:', error)
      alert('엑셀 파일 처리 중 오류가 발생했습니다.')
    } finally {
      setIsProcessingExcel(false)
    }
  }

  // 엑셀 파일 파싱 (간단한 CSV 형태로 처리)
  const parseExcelFile = async (file: File): Promise<ExcelStockInData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string
          const lines = text.split('\n')
          const headers = lines[0]?.split(',').map(h => h.trim()) || []
          
          // 필수 컬럼 확인 (사용자 입력 컬럼만)
          const requiredColumns = ['품목명', '규격', '위치', '수량', '단가', '품목상태']
          const missingColumns = requiredColumns.filter(col => !headers.includes(col))
          
          if (missingColumns.length > 0) {
            throw new Error(`필수 컬럼이 누락되었습니다: ${missingColumns.join(', ')}`)
          }

          const data: ExcelStockInData[] = []
          
          for (let i = 1; i < lines.length; i++) {
            const line = lines[i]
            if (line?.trim()) {
              const values = line.split(',').map(v => v.trim())
              
              // 사용자 입력 필수 컬럼들
              const itemName = values[headers.indexOf('품목명')] || ''
              const spec = values[headers.indexOf('규격')] || ''
              const location = values[headers.indexOf('위치')] || ''
              const quantity = parseInt(values[headers.indexOf('수량')] || '0') || 0
              const unitPrice = parseFloat(values[headers.indexOf('단가')] || '0') || 0
              const itemConditionText = values[headers.indexOf('품목상태')] || ''
              
              // 선택적 컬럼들
              const maker = values[headers.indexOf('제조사')] || ''
              const purpose = values[headers.indexOf('용도')] || '재고관리'
              const notes = values[headers.indexOf('비고')] || ''
              
              // 품목상태 검증 (4가지 중 하나만 허용)
              const validStockStatuses = ['신품', '중고신품', '중고사용품', '불량품']
              if (!validStockStatuses.includes(itemConditionText)) {
                throw new Error(`잘못된 품목상태입니다: ${itemConditionText} (${itemName}). 허용값: ${validStockStatuses.join(', ')}`)
              }

              // 품목상태 텍스트를 코드로 변환
              let stockStatus: 'new' | 'used-new' | 'used-used' | 'broken' = 'new'
              if (itemConditionText === '신품') stockStatus = 'new'
              else if (itemConditionText === '중고신품') stockStatus = 'used-new'
              else if (itemConditionText === '중고사용품') stockStatus = 'used-used'
              else if (itemConditionText === '불량품') stockStatus = 'broken'

              if (itemName && spec && location && quantity > 0) {
                data.push({ 
                  product: itemName, 
                  spec,
                  location,
                  quantity, 
                  maker,
                  unitPrice: unitPrice || 0, 
                  purpose,
                  note: notes || '', 
                  stockStatus,
                  stockInDate: new Date().toISOString().split('T')[0] || '', // 업로드일로 자동 설정
                  closingQuantity: 0, // 자동 계산 필드 - 사용자 입력 금지
                  stockIn: quantity, // 입고수량 = 수량
                  stockOut: 0 // 출고수량 = 0 (입고 시)
                })
              }
            }
          }

          resolve(data)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = () => reject(new Error('파일 읽기 실패'))
      reader.readAsText(file)
    })
  }

  // 엑셀 데이터 일괄 입고 - 트랜잭션 적용
  const handleBulkStockIn = async () => {
    if (excelData.length === 0) {
      alert('업로드된 엑셀 데이터가 없습니다.')
      return
    }

    setIsSaving(true)
    try {
      // 권한 확인 (level2 이상 필요)
      const hasPermission = await checkDbPermission('level2')
      if (!hasPermission) {
        throw new Error('입고 권한이 부족합니다. level2 이상의 권한이 필요합니다.')
      }

      // 권한 기반으로 데이터베이스 작업 실행
      await executeWithDbPermission(async () => {
        // 현재 최대 인덱스 번호 조회
        const { data: maxIndexData, error: maxIndexError } = await supabase
          .from('items')
          .select('id')
          .order('id', { ascending: false })
          .limit(1)
          .single()

        let nextIndex = 1
        if (maxIndexData && !maxIndexError && maxIndexData.id) {
          // 기존 ID가 숫자인 경우에만 파싱
          const currentMaxId = parseInt(String(maxIndexData.id))
          if (!isNaN(currentMaxId)) {
            nextIndex = currentMaxId + 1
          }
        }

        // 각 품목을 순차적으로 처리하여 입고 순서대로 인덱스 할당
        const validItems = excelData.filter((item): item is ExcelStockInData => item !== null && item !== undefined)
        
        for (let i = 0; i < validItems.length; i++) {
          const item = validItems[i]
          if (!item) continue
          
          // UUID 생성 (crypto.randomUUID 사용)
          const stockInIndex = crypto.randomUUID()

          // 트랜잭션으로 묶어서 에러 발생 시 전체 롤백
          const { data: result, error: transactionError } = await supabase.rpc('process_stock_in_transaction', {
            p_product: item.product,
            p_spec: item.spec,
            p_maker: item.maker || '',
            p_unit_price: item.unitPrice || 0,
            p_stock_status: item.stockStatus,
            p_note: item.note || '',
            p_purpose: item.purpose || '재고관리',
            p_quantity: item.quantity,
            p_received_by: 'yjjang',
            p_event_date: item.stockInDate || new Date().toISOString().split('T')[0],
            p_location: item.location || '창고A'
          })

          if (transactionError) {
            console.error(`품목 ${i + 1} 트랜잭션 오류:`, transactionError)
            throw new Error(`품목 ${i + 1} 입고 실패: ${transactionError.message}`)
          }

          console.log(`품목 ${i + 1} 입고 완료 - 인덱스: ${stockInIndex}`)
        }

        return { success: true, processedCount: excelData.length }
      }, 'level2')

      alert(`${excelData.length}개 품목의 입고가 완료되었습니다!`)
      setExcelData([])
      onClose()
      
    } catch (error) {
      console.error('일괄 입고 오류:', error)
      alert(`일괄 입고 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setIsSaving(false)
    }
  }

  // 폼 초기화 및 취소 처리
  const handleClose = () => {
    // 저장 중이 아닐 때만 초기화
    if (!isSaving) {
      setFormData({
        product: '', // 품목명 (필수)
        spec: '', // 규격 (필수)
        location: '', // 위치 (필수)
        quantity: '', // 수량 (필수)
        maker: '', // 제조사
        unitPrice: '', // 단가
        purpose: '재고관리', // 용도 (기본값)
        note: '', // 비고
        stockStatus: 'new' as 'new' | 'used-new' | 'used-used' | 'broken' | '', // 품목 상태 (사용자가 선택해야 함, 데이터베이스 기준)
        stockInDate: new Date().toISOString().split('T')[0] || '' || '' // 오늘 날짜를 기본값으로
      })
      setExcelData([])
      setActiveTab('manual')
      setShowDuplicateModal(false)
      setDuplicateItem(null)
      setPendingStockInData(null)
    }
    onClose()
  }

  // CSV 템플릿 다운로드
  const downloadCSVTemplate = () => {
    const csvContent = 'product,spec,location,quantity,maker,unitPrice,purpose,note,stockStatus\n품목명,규격,위치,수량,제조사,단가,용도,비고,품목상태\n전선,2.0SQ x 100m,창고A-01,50,대한전선,10000,재고관리,고품질 동전선,신품\n케이블 타이,100mm,창고B-03,200,한국케이블,500,재고관리,내열성 우수,신품'
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = '입고템플릿.csv'
    link.click()
  }

  // 취소 버튼 전용 핸들러 (저장 전 확인)
  const handleCancel = () => {
    if (formData.product || formData.spec || formData.location || formData.quantity) {
      // 입력된 데이터가 있으면 확인
      if (confirm('입력된 데이터가 있습니다. 정말 취소하시겠습니까?')) {
        handleClose()
      }
    } else {
      // 데이터가 없으면 바로 닫기
      handleClose()
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl bg-white" aria-describedby="stock-in-description">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-green-600" />
              <span className="text-black">{isEditMode ? '재고 수정' : '재고 입고'}</span>
            </DialogTitle>
            <p id="stock-in-description" className="text-sm text-gray-600">
              새로운 재고를 시스템에 등록하거나 기존 재고를 추가합니다. 품목명, 규격, 위치, 수량 등을 입력해주세요.
            </p>
          </DialogHeader>
          
          {/* 탭 선택 */}
          {/* 탭 네비게이션 - 수정 모드에서는 숨김 */}
          {!isEditMode && (
            <div className="flex space-x-1 border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab('manual')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'manual'
                    ? 'bg-white text-black border-b-2 border-black'
                    : 'text-gray-500 hover:text-black hover:bg-gray-100'
                }`}
              >
                개별 입력
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('excel')}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === 'excel'
                    ? 'bg-white text-black border-b-2 border-black'
                    : 'text-gray-500 hover:text-black hover:bg-gray-100'
                }`}
              >
                엑셀 업로드
              </button>
            </div>
          )}

          {/* 개별 입력 탭 - 수정 모드이거나 수동 입력 탭일 때 */}
          {(isEditMode || activeTab === 'manual') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 필수 필드들 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    품목명 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.product}
                    onChange={(e) => {
                      setFormData({...formData, product: e.target.value})
                      if (isEditMode) {
                        setModifiedFields(prev => ({
                          ...prev,
                          product: e.target.value !== editItem.name
                        }))
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      fieldErrors.product
                        ? 'border-red-500 text-red-600 bg-red-50'
                        : isEditMode && modifiedFields.product 
                          ? 'border-blue-500 text-blue-600 bg-blue-50' 
                          : 'border-gray-300 text-black bg-white'
                    }`}
                    placeholder="품목명을 입력하세요"
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    규격 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.spec}
                    onChange={(e) => {
                      setFormData({...formData, spec: e.target.value})
                      if (isEditMode) {
                        setModifiedFields(prev => ({
                          ...prev,
                          spec: e.target.value !== editItem.specification
                        }))
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      fieldErrors.spec
                        ? 'border-red-500 text-red-600 bg-red-50'
                        : isEditMode && modifiedFields.spec 
                          ? 'border-blue-500 text-blue-600 bg-blue-50' 
                          : 'border-gray-300 text-black bg-white'
                    }`}
                    placeholder="규격을 입력하세요 (예: 10mm², 220V)"
                    required
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    위치 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => {
                      setFormData({...formData, location: e.target.value})
                      if (isEditMode) {
                        setModifiedFields(prev => ({
                          ...prev,
                          location: e.target.value !== editItem.location
                        }))
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                      fieldErrors.location
                        ? 'border-red-500 text-red-600 bg-red-50'
                        : isEditMode && modifiedFields.location 
                          ? 'border-blue-500 text-blue-600 bg-blue-50' 
                          : 'border-gray-300 text-black bg-white'
                    }`}
                    placeholder="보관 위치를 입력하세요"
                    required
                    maxLength={100}
                  />
                </div>

                {isEditMode ? (
                  // 수정 모드: 수량 관련 필드들
                  <>
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        입고수량 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={editFormData.stockInQuantity}
                        onChange={(e) => {
                          const value = e.target.value
                          console.log('입고수량 입력 변경:', value, '타입:', typeof value)
                          
                          // 함수형 업데이트 사용하여 이전 상태 기반으로 업데이트
                          setEditFormData(prev => {
                            const newData = {...prev, stockInQuantity: value}
                            console.log('이전 editFormData:', prev)
                            console.log('새로운 editFormData:', newData)
                            return newData
                          })
                          
                          // 수정된 필드 추적
                          setModifiedFields(prev => ({
                            ...prev,
                            stockInQuantity: value !== editItem.inbound?.toString()
                          }))
                          
                          // 즉시 유효성 검사
                          const stockInQty = parseInt(value)
                          if (value === '' || isNaN(stockInQty) || stockInQty < 0) {
                            console.log('입고수량 즉시 검증 실패:', value, '파싱된 값:', stockInQty)
                            setFieldErrors(prev => ({ ...prev, stockInQuantity: true }))
                          } else {
                            console.log('입고수량 즉시 검증 성공:', value, '파싱된 값:', stockInQty)
                            setFieldErrors(prev => ({ ...prev, stockInQuantity: false }))
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                          fieldErrors.stockInQuantity
                            ? 'border-red-500 text-red-600 bg-red-50'
                            : modifiedFields.stockInQuantity 
                              ? 'border-blue-500 text-blue-600 bg-blue-50' 
                              : 'border-gray-300 text-black bg-white'
                        }`}
                        placeholder="입고수량을 입력하세요"
                        required
                        min="0"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-black mb-1">
                        출고수량
                      </label>
                      <input
                        type="number"
                        value={editFormData.stockOutQuantity}
                        onChange={(e) => {
                          const value = e.target.value
                          console.log('출고수량 입력 변경:', value, '타입:', typeof value)
                          
                          // 함수형 업데이트 사용하여 이전 상태 기반으로 업데이트
                          setEditFormData(prev => {
                            const newData = {...prev, stockOutQuantity: value}
                            console.log('이전 editFormData:', prev)
                            console.log('새로운 editFormData:', newData)
                            return newData
                          })
                          
                          // 수정된 필드 추적
                          setModifiedFields(prev => ({
                            ...prev,
                            stockOutQuantity: value !== editItem.outbound?.toString()
                          }))
                          
                          // 즉시 유효성 검사
                          const stockOutQty = parseInt(value)
                          if (value === '' || isNaN(stockOutQty) || stockOutQty < 0) {
                            console.log('출고수량 즉시 검증 실패:', value, '파싱된 값:', stockOutQty)
                            setFieldErrors(prev => ({ ...prev, stockOutQuantity: true }))
                          } else {
                            console.log('출고수량 즉시 검증 성공:', value, '파싱된 값:', stockOutQty)
                            setFieldErrors(prev => ({ ...prev, stockOutQuantity: false }))
                          }
                        }}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black ${
                          fieldErrors.stockOutQuantity
                            ? 'border-red-500 text-red-600 bg-red-50'
                            : modifiedFields.stockOutQuantity 
                              ? 'border-blue-500 text-blue-600 bg-blue-50' 
                              : 'border-gray-300 text-black bg-white'
                        }`}
                        placeholder="출고수량을 입력하세요"
                        min="0"
                      />
                    </div>
                  </>
                ) : (
                  // 입고 모드: 기존 수량 필드
                  <div>
                    <label className="block text-sm font-medium text-black mb-1">
                      수량 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => {
                        console.log('수량 입력 변경:', e.target.value);
                        setFormData({...formData, quantity: e.target.value});
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
                      placeholder="수량을 입력하세요"
                      required
                      min="1"
                    />
                  </div>
                )}
              </div>

              {/* 선택 필드들 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    제조사
                  </label>
                  <input
                    type="text"
                    value={formData.maker}
                    onChange={(e) => setFormData({...formData, maker: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
                    placeholder="제조사를 입력하세요"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    단가 {!isEditMode && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({...formData, unitPrice: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
                    placeholder="단가를 입력하세요"
                    required={!isEditMode}
                    min="0.01"
                    step="0.01"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    용도
                  </label>
                  <input
                    type="text"
                    value={formData.purpose}
                    onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
                    placeholder="용도를 입력하세요"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    품목 상태 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.stockStatus}
                    onChange={(e) => setFormData({...formData, stockStatus: e.target.value as 'new' | 'used-new' | 'used-used' | 'broken' | ''})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
                    required
                  >
                    <option value="">품목 상태를 선택하세요</option>
                    <option value="new">신품</option>
                    <option value="used-new">중고신품</option>
                    <option value="used-used">중고사용품</option>
                    <option value="broken">불량품</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  비고
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
                  placeholder="추가 정보를 입력하세요"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  입고일
                </label>
                <input
                  type="date"
                  value={formData.stockInDate}
                  onChange={(e) => setFormData({...formData, stockInDate: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <Button type="submit" className="flex-1 bg-white text-black border border-gray-300 hover:bg-gray-100">
                  <Plus className="h-4 w-4 mr-2" />
                  {isEditMode ? '수정 완료' : '+ 입고 처리'}
                </Button>
                <Button type="button" onClick={handleCancel} variant="outline" className="flex-1 bg-white text-black border border-gray-300 hover:bg-gray-100">
                  취소
                </Button>
              </div>
            </form>
          )}

          {/* 엑셀 업로드 탭 - 수정 모드에서는 숨김 */}
          {!isEditMode && activeTab === 'excel' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-white">
                <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-sm text-black">
                    엑셀 파일을 업로드하여 일괄 입고할 수 있습니다.
                  </p>
                  <p className="text-xs text-gray-500">
                    필수 컬럼: 품목명, 규격, 위치, 수량, 단가, 품목상태 | 선택 컬럼: 제조사, 용도, 비고
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    품목상태: 신품, 중고신품, 중고사용품, 불량품 중 선택 | 입고일은 업로드일로 자동 설정
                  </p>
                  
                  {/* CSV 템플릿 다운로드 */}
                  <div className="mt-3">
                    <button
                      onClick={downloadCSVTemplate}
                      className="inline-flex items-center px-3 py-1 text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded hover:bg-blue-100"
                    >
                      📄 CSV 템플릿 다운로드
                    </button>
                  </div>
                  
                  <div className="mt-4">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleExcelUpload}
                      className="hidden"
                      id="excel-upload"
                      disabled={isProcessingExcel}
                    />
                    <label
                      className="inline-flex items-center px-4 py-2 bg-white text-black border border-gray-300 rounded-md hover:bg-gray-100 cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {isProcessingExcel ? '처리 중...' : '엑셀 파일 선택'}
                    </label>
                  </div>
                </div>
              </div>

              {/* 업로드된 데이터 미리보기 */}
              {excelData.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-black">업로드된 품목 ({excelData.length}개)</h4>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md bg-white">
                    <table className="min-w-full text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-black">품목명</th>
                          <th className="px-3 py-2 text-left text-black">규격</th>
                          <th className="px-3 py-2 text-left text-black">품목상태</th>
                          <th className="px-3 py-2 text-left text-black">수량</th>
                          <th className="px-3 py-2 text-left text-black">단가</th>
                          <th className="px-3 py-2 text-left text-black">비고</th>
                          <th className="px-3 py-2 text-left text-black">입고일</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {excelData.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-black">{item.product}</td>
                            <td className="px-3 py-2 text-black">{item.spec}</td>
                            <td className="px-3 py-2 text-black">
                              {item.stockStatus === 'new' ? '신품' : 
                               item.stockStatus === 'used-new' ? '중고신품' : 
                               item.stockStatus === 'used-used' ? '중고사용품' : 
                               item.stockStatus === 'broken' ? '불량품' : 
                               '미선택'}
                            </td>
                            <td className="px-3 py-2 text-black">{item.quantity}</td>
                            <td className="px-3 py-2 text-black">{item.unitPrice.toLocaleString()}</td>
                            <td className="px-3 py-2 text-black">{item.note}</td>
                            <td className="px-3 py-2 text-black">{item.stockInDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="flex space-x-3 pt-2">
                    <Button
                      onClick={handleBulkStockIn}
                      className="flex-1 bg-white text-black border border-gray-300 hover:bg-gray-100"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      일괄 입고 처리
                    </Button>
                    <Button
                      onClick={() => setExcelData([])}
                      variant="outline"
                      className="flex-1 bg-white text-black border border-gray-300 hover:bg-gray-100"
                    >
                      데이터 초기화
                    </Button>
                  </div>
                </div>
              )}

              {/* 저장 버튼 */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="bg-white text-black border border-gray-300 hover:bg-gray-100"
                >
                  취소
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? '저장 중...' : '저장'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 중복 재고 확인 팝업 */}
      {showDuplicateModal && duplicateItem && pendingStockInData && (
        <Dialog open={showDuplicateModal} onOpenChange={() => setShowDuplicateModal(false)}>
          <DialogContent className="sm:max-w-md bg-white" aria-describedby="duplicate-stock-description">
            <DialogHeader>
              <DialogTitle className="text-black">기존재고와 합칠래?</DialogTitle>
              <p id="duplicate-stock-description" className="text-sm text-gray-600">
                동일한 품목이 이미 존재합니다. 기존 재고에 합치거나 새로 등록할 수 있습니다.
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">기존재고:</span>
                    <span className="font-medium text-black">{duplicateItem.currentQuantity}개</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">입력재고:</span>
                    <span className="font-medium text-black">{pendingStockInData.quantity}개</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-gray-600">비고:</span>
                    <p className="text-black mt-1">{duplicateItem.notes || '없음'}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-center">
                <Button
                  onClick={handleMergeWithExisting}
                  className="px-8 bg-white text-black border border-gray-300 hover:bg-gray-100"
                >
                  OK
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
} 