'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileText, Upload, X } from 'lucide-react'

interface BusinessTripReportModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (reportData: {
    title: string
    content: string
    attachments: string[]
  }) => void
  tripData?: {
    id: string
    title: string
    purpose: string
    location: string
    startDate: string
    endDate: string
  }
  loading?: boolean
}

export default function BusinessTripReportModal({
  isOpen,
  onClose,
  onSave,
  tripData,
  loading = false
}: BusinessTripReportModalProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<string[]>([])
  const [newAttachment, setNewAttachment] = useState('')

  // tripData가 변경될 때 보고서 제목을 목적으로 초기화
  useEffect(() => {
    if (tripData && isOpen) {
      setTitle(tripData.purpose || '')
    }
  }, [tripData, isOpen])

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }

    onSave({
      title: title.trim(),
      content: content.trim(),
      attachments
    })
  }

  const handleAddAttachment = () => {
    if (newAttachment.trim()) {
      setAttachments([...attachments, newAttachment.trim()])
      setNewAttachment('')
    }
  }

  const handleRemoveAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const handleClose = () => {
    setTitle('')
    setContent('')
    setAttachments([])
    setNewAttachment('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <FileText className="h-6 w-6 mr-2 text-blue-600" />
            출장/외근 보고서 작성
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 출장/외근 정보 */}
          {tripData && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">출장/외근 정보</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">제목:</span>
                  <span className="ml-2 text-gray-900">
                    {tripData.title.replace(/^\[(출장|외근)\]\s*/, '')}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">장소:</span>
                  <span className="ml-2 text-gray-900">{tripData.location}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">기간:</span>
                  <span className="ml-2 text-gray-900">
                    {tripData.startDate} ~ {tripData.endDate}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* 보고서 제목 */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              보고서 제목 *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="목적을 보고서 제목으로 입력하세요"
              className="w-full"
            />
          </div>

          {/* 보고서 내용 */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-medium">
              보고서 내용 *
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="출장/외근 내용을 상세히 작성해주세요"
              className="w-full min-h-[200px]"
            />
          </div>

          {/* 첨부파일 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">첨부파일</Label>
            <div className="flex space-x-2">
              <Input
                value={newAttachment}
                onChange={(e) => setNewAttachment(e.target.value)}
                placeholder="첨부파일 URL 또는 설명을 입력하세요"
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleAddAttachment}
                variant="outline"
                size="sm"
              >
                <Upload className="h-4 w-4 mr-1" />
                추가
              </Button>
            </div>
            
            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 rounded-lg p-2"
                  >
                    <span className="text-sm text-gray-700 truncate flex-1">
                      {attachment}
                    </span>
                    <Button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={loading || !title.trim() || !content.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? '저장 중...' : '보고서 제출'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
