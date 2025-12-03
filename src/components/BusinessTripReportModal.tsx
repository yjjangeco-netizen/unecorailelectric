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
import { FileText, Upload, X, MapPin, Calendar, Briefcase, Paperclip, Send } from 'lucide-react'

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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white border-0 shadow-2xl rounded-2xl p-0 [&>button]:hidden">
        {/* 헤더 - 그라데이션 배경 */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-2xl relative">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-white font-semibold">
              <div className="bg-white/20 p-2 rounded-lg mr-3">
                <FileText className="h-5 w-5 text-white" />
              </div>
              출장/외근 보고서 작성
            </DialogTitle>
          </DialogHeader>
          {/* 커스텀 닫기 버튼 */}
          <button
            onClick={handleClose}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* 출장/외근 정보 카드 */}
          {tripData && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200 shadow-sm">
              <div className="flex items-center mb-4">
                <Briefcase className="h-5 w-5 text-slate-600 mr-2" />
                <h3 className="font-semibold text-slate-800">출장/외근 정보</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">제목</p>
                    <p className="text-sm text-slate-800 font-semibold">
                      {tripData.title.replace(/^\[(출장|외근)\]\s*/, '')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">장소</p>
                    <p className="text-sm text-slate-800 font-semibold">{tripData.location}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3 md:col-span-2">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <Calendar className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">기간</p>
                    <p className="text-sm text-slate-800 font-semibold">
                      {tripData.startDate} ~ {tripData.endDate}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 보고서 제목 */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold text-slate-700 flex items-center">
              보고서 제목
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="보고서 제목을 입력하세요"
              className="w-full h-11 px-4 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* 보고서 내용 */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-semibold text-slate-700 flex items-center">
              보고서 내용
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="출장/외근 내용을 상세히 작성해주세요&#10;&#10;• 방문 목적 및 결과&#10;• 주요 논의 내용&#10;• 후속 조치 사항"
              className="w-full min-h-[180px] px-4 py-3 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
            />
          </div>

          {/* 첨부파일 */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold text-slate-700 flex items-center">
              <Paperclip className="h-4 w-4 mr-1.5 text-slate-500" />
              첨부파일
            </Label>
            <div className="flex space-x-2">
              <Input
                value={newAttachment}
                onChange={(e) => setNewAttachment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddAttachment()}
                placeholder="첨부파일 URL 또는 파일명을 입력하세요"
                className="flex-1 h-10 px-4 border-slate-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <Button
                type="button"
                onClick={handleAddAttachment}
                variant="outline"
                className="h-10 px-4 border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-all"
              >
                <Upload className="h-4 w-4 mr-1.5" />
                추가
              </Button>
            </div>
            
            {attachments.length > 0 && (
              <div className="space-y-2 mt-3">
                {attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-2.5 border border-slate-200 group hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <Paperclip className="h-4 w-4 text-slate-400 mr-2 flex-shrink-0" />
                      <span className="text-sm text-slate-700 truncate">
                        {attachment}
                      </span>
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-7 w-7 p-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 푸터 */}
        <div className="px-6 py-4 bg-slate-50 rounded-b-2xl border-t border-slate-200">
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="px-6 h-11 border-slate-300 hover:bg-slate-100 rounded-lg font-medium transition-all"
            >
              취소
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={loading || !title.trim() || !content.trim()}
              className="px-6 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-medium shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  저장 중...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  보고서 제출
                </>
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
