'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface CSVUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadComplete: () => void
}

interface CSVItem {
  item_number: string
  item_name: string
  specification: string
  maker: string
  note: string
  rack_location: string
  barcode: string
}

export default function CSVUploadModal({ isOpen, onClose, onUploadComplete }: CSVUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const [previewData, setPreviewData] = useState<CSVItem[]>([])
  const [loading, setLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null)

  // 현재 로그인한 사용자 정보 가져오기
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser()
        if (user && !error) {
          setCurrentUser({ id: user.id, email: user.email || '' })
        }
      } catch (error) {
        console.error('사용자 정보 가져오기 오류:', error)
      }
    }
    
    if (isOpen) {
      getCurrentUser()
    }
  }, [isOpen])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setSelectedFile(file)
      setFileName(file.name)
      setErrorMessage('')
      setUploadStatus('idle')
      parseCSV(file)
    } else if (file) {
      setErrorMessage('CSV 파일만 업로드 가능합니다.')
      setSelectedFile(null)
      setFileName('')
      setPreviewData([])
    }
  }

  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n')
      const headers = (lines[0] || '').split(',').map(h => h.trim())
      
             // CSV 헤더 검증
       const requiredHeaders = ['item_number', 'item_name', 'specification', 'maker', 'note', 'rack_location', 'barcode']
       const isValidHeaders = requiredHeaders.every(header => 
         headers.some(h => h.toLowerCase() === header.toLowerCase())
       )
       
       if (!isValidHeaders) {
         setErrorMessage('CSV 파일의 헤더가 올바르지 않습니다. item_number, item_name, specification, maker, note, rack_location, barcode 컬럼이 필요합니다.')
         setPreviewData([])
         return
       }

             const data: CSVItem[] = []
             for (let i = 1; i < lines.length; i++) {
        if (lines[i]?.trim()) {
          const values = (lines[i] || '').split(',').map(v => v.trim())
           if (values.length >= 7) {
             data.push({
               item_number: values[0] || '',
               item_name: values[1] || '',
               specification: values[2] || '',
               maker: values[3] || '',
               note: values[4] || '',
               rack_location: values[5] || '',
               barcode: values[6] || ''
             })
           }
         }
       }
      
      setPreviewData(data.slice(0, 10)) // 처음 10개만 미리보기
    }
    reader.readAsText(file)
  }

  const handleUpload = async () => {
    if (!selectedFile || previewData.length === 0) return

    setLoading(true)
    setUploadStatus('uploading')
    
    try {
      // CSV 데이터를 품목 데이터로 변환하여 데이터베이스에 저장
      for (const item of previewData) {
                 // 기존 품목이 있는지 확인
         const { data: existingItems } = await supabase
           .from('items')
           .select('*')
           .eq('name', item.item_name)
           .eq('specification', item.specification)
           .eq('maker', item.maker)

                 if (existingItems && existingItems.length > 0) {
           // 기존 품목이 있으면 수량만 추가
           const existingItem = existingItems[0]
           await supabase
             .from('stock_in')
             .insert({
               item_id: existingItem.id,
               quantity: parseInt(item.item_number) || 1,
               unit_price: 0, // 가격 정보가 없으므로 0으로 설정
               condition_type: 'new',
               reason: 'CSV 업로드',
               ordered_by: currentUser?.email || '시스템',
               received_by: currentUser?.email || '시스템',
               received_at: new Date().toISOString()
             })
         } else {
           // 새 품목 생성
           const { data: newItem, error: itemError } = await supabase
             .from('items')
             .insert({
               name: item.item_name,
               specification: item.specification,
               maker: item.maker,
               unit_price: 0, // 가격 정보가 없으므로 0으로 설정
               purpose: item.note || 'CSV 업로드',
               min_stock: 0,
               category: '기타',
               description: `${item.specification} ${item.maker} ${item.note}`
             })
             .select()
             .single()

           if (itemError) throw itemError

           // 입고 기록 생성
           await supabase
             .from('stock_in')
             .insert({
               item_id: newItem.id,
               quantity: parseInt(item.item_number) || 1,
               unit_price: 0, // 가격 정보가 없으므로 0으로 설정
               condition_type: 'new',
               reason: 'CSV 업로드',
               ordered_by: currentUser?.email || '시스템',
               received_by: currentUser?.email || '시스템',
               received_at: new Date().toISOString()
             })
         }
      }

      setUploadStatus('success')
      setTimeout(() => {
        onUploadComplete()
        onClose()
        resetForm()
      }, 2000)

    } catch (error) {
      console.error('CSV 업로드 오류:', error)
      setUploadStatus('error')
      setErrorMessage('CSV 업로드 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedFile(null)
    setFileName('')
    setPreviewData([])
    setUploadStatus('idle')
    setErrorMessage('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>CSV 파일 업로드</DialogTitle>
          <DialogDescription>
            CSV 파일을 업로드하여 여러 품목을 한번에 입고할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 파일 선택 섹션 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV 파일 선택
            </label>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => document.getElementById('csv-file-input')?.click()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                <Upload className="h-4 w-4 mr-2" />
                파일 선택
              </Button>
              <Button
                onClick={() => window.open('/csv-template.csv', '_blank')}
                variant="outline"
                className="px-4 py-2"
                disabled={loading}
              >
                <FileText className="h-4 w-4 mr-2" />
                템플릿 다운로드
              </Button>
              <input
                id="csv-file-input"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  {fileName || '선택된 파일이 없습니다'}
                </p>
              </div>
            </div>
          </div>

          {/* 오류 메시지 */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">
                  {errorMessage}
                </div>
              </div>
            </div>
          )}

          {/* 업로드 상태 */}
          {uploadStatus === 'uploading' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span className="text-sm text-blue-800">CSV 파일을 업로드하고 있습니다...</span>
              </div>
            </div>
          )}

          {uploadStatus === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-800">CSV 업로드가 완료되었습니다!</span>
              </div>
            </div>
          )}

          {/* 데이터 미리보기 */}
          {previewData.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                데이터 미리보기 (처음 10개 항목)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                                     <thead className="bg-gray-50">
                     <tr>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         #
                       </th>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         품명
                       </th>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         규격
                       </th>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         메이커
                       </th>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         비고
                       </th>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         RACK
                       </th>
                       <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                         바코드
                       </th>
                     </tr>
                   </thead>
                                       <tbody className="bg-white divide-y divide-gray-200">
                       {previewData.map((item, index) => (
                         <tr key={index} className="hover:bg-gray-50">
                           <td className="px-3 py-2 text-sm text-gray-900">{item.item_number}</td>
                           <td className="px-3 py-2 text-sm text-gray-900 font-medium">{item.item_name}</td>
                           <td className="px-3 py-2 text-sm text-gray-600">{item.specification}</td>
                           <td className="px-3 py-2 text-sm text-gray-600">{item.maker}</td>
                           <td className="px-3 py-2 text-sm text-gray-600">{item.note || '-'}</td>
                           <td className="px-3 py-2 text-sm text-gray-600">{item.rack_location || '-'}</td>
                           <td className="px-3 py-2 text-sm text-gray-900">{item.barcode || '-'}</td>
                         </tr>
                       ))}
                     </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                총 {previewData.length}개 항목이 업로드됩니다.
              </p>
            </div>
          )}

          {/* 버튼 그룹 */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              취소
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || previewData.length === 0 || loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? '업로드 중...' : '다음으로'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 