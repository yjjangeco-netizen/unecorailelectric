'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { Image as ImageIcon, Link as LinkIcon, Paperclip, Check, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabaseClient'

interface GenericBoardWriteProps {
  boardType: 'SOP' | 'TOOLS' | 'TROUBLESHOOTING' | 'TECH_DATA'
  basePath: string
  editId?: string
}

export default function GenericBoardWrite({ boardType, basePath, editId }: GenericBoardWriteProps) {
  const router = useRouter()
  const { user } = useUser()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(!!editId)
  const fileInputRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (!editId) return
    const fetchExisting = async () => {
      try {
        const res = await fetch(`/api/boards/${editId}`)
        if (res.ok) {
          const data = await res.json()
          setTitle(data.title || '')
          setContent(data.content || '')
        }
      } catch (error) {
        console.error('Error fetching existing post:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchExisting()
  }, [editId])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (!selectedFiles.length) return

    const compressedFiles: File[] = []
    
    for (const file of selectedFiles) {
      if (file.type.startsWith('image/')) {
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        }
        try {
          const compressedFile = await imageCompression(file, options)
          compressedFiles.push(compressedFile)
        } catch (error) {
          console.error('Image compression failed:', error)
          compressedFiles.push(file)
        }
      } else {
        compressedFiles.push(file)
      }
    }

    setFiles(prev => [...prev, ...compressedFiles])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      let boardDataId = editId

      if (!editId) {
        // 새 글 등록 (POST)
        const res = await fetch('/api/boards', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': user?.id || '',
            'x-user-level': user?.level || ''
          },
          body: JSON.stringify({
            boardType,
            title,
            content,
            authorName: user?.name || '관리자'
          })
        })

        if (!res.ok) throw new Error('게시글 등록 실패')
        const boardData = await res.json()
        boardDataId = boardData.id
      } else {
        // 기존 글 수정 (PUT)
        const res = await fetch(`/api/boards/${editId}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': user?.id || '',
            'x-user-level': user?.level || ''
          },
          body: JSON.stringify({ title, content })
        })
        if (!res.ok) throw new Error('게시글 수정 실패')
      }

      if (files.length > 0 && boardDataId) {
        let appendedContent = content + '\n\n---\n[첨부파일]\n'
        let uploadedUrls: string[] = []

        for (let i = 0; i < files.length; i++) {
          const file = files[i]
          const fileExt = file.name.split('.').pop()
          const fileName = `boards/${boardDataId}_${Date.now()}_${i}.${fileExt}`
          
          const { error: uploadError } = await supabase.storage
            .from('as-images')
            .upload(fileName, file)

          if (!uploadError) {
            const { data: pubData } = supabase.storage.from('as-images').getPublicUrl(fileName)
            if (pubData?.publicUrl) {
              uploadedUrls.push(pubData.publicUrl)
              appendedContent += `\n${pubData.publicUrl}`
            }
          }
        }

        if (uploadedUrls.length > 0) {
          await fetch(`/api/boards/${boardDataId}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'x-user-id': user?.id || '',
              'x-user-level': user?.level || ''
            },
            body: JSON.stringify({ title, content: appendedContent })
          })
        }
      }

      alert(editId ? '게시글이 성공적으로 수정되었습니다.' : '게시글이 성공적으로 등록되었습니다.')
      router.push(`${basePath}/${boardDataId || ''}`)
    } catch (error) {
      console.error(error)
      alert('오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">로딩 중...</div>
  }

  return (
    <div className="max-w-6xl mx-auto min-h-screen bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
      {/* 툴바 (블로그 에디터 스타일) */}
      <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-xl">
        <div className="flex items-center gap-1">
          <Button variant="ghost" className="h-10 px-3 text-gray-600 flex flex-col gap-1 hover:bg-gray-50" onClick={() => fileInputRef.current?.click()}>
            <ImageIcon className="h-5 w-5" />
            <span className="text-[10px]">사진/파일</span>
          </Button>
          <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple className="hidden" />
          
          <div className="w-px h-8 bg-gray-200 mx-2" />
          
          <Button variant="ghost" className="h-10 px-3 text-gray-400 flex flex-col gap-1" disabled>
            <LinkIcon className="h-5 w-5" />
            <span className="text-[10px]">링크</span>
          </Button>
          <Button variant="ghost" className="h-10 px-3 text-gray-400 flex flex-col gap-1" disabled>
            <Paperclip className="h-5 w-5" />
            <span className="text-[10px]">파일</span>
          </Button>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => router.push(basePath)} className="text-gray-600">
            <ArrowLeft className="h-4 w-4 mr-2" />
            취소
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting} 
            className="bg-green-600 hover:bg-green-700 text-white min-w-[100px] font-bold"
          >
            {isSubmitting ? '발행 중...' : (
              <>
                <Check className="h-4 w-4 mr-2" />
                발행
              </>
            )}
          </Button>
        </div>
      </div>

      {/* 에디터 본문 영역 */}
      <div className="flex-1 px-12 py-10 flex flex-col max-w-4xl mx-auto w-full">
        {/* 제목 입력 */}
        <input 
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          className="w-full text-4xl font-bold text-gray-900 border-b border-gray-100 pb-6 mb-8 focus:outline-none placeholder:text-gray-300"
        />

        {/* 본문 입력 */}
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="본문을 입력하세요."
          className="w-full flex-1 min-h-[500px] text-lg text-gray-800 leading-relaxed resize-none focus:outline-none placeholder:text-gray-300"
        />
      </div>

      {/* 첨부파일 표시 영역 (있을 경우만) */}
      {files.length > 0 && (
        <div className="px-12 py-6 bg-gray-50 border-t border-gray-100">
          <h4 className="text-sm font-bold text-gray-700 mb-3">첨부된 파일 ({files.length})</h4>
          <div className="flex flex-wrap gap-2">
            {files.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-white px-3 py-2 rounded border border-gray-200 shadow-sm text-sm">
                <span className="text-gray-600 truncate max-w-[200px]">{file.name}</span>
                <span className="text-gray-400 text-xs">({(file.size / 1024).toFixed(1)} KB)</span>
                <button type="button" onClick={() => removeFile(idx)} className="text-red-500 font-bold ml-2">✕</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
