'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, User as UserIcon, Calendar, Eye, FileText, Download, Edit, Trash2, MessageSquare, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from '@/hooks/useUser'
import { supabase } from '@/lib/supabaseClient'

interface GenericBoardDetailProps {
  id: string
  boardType: 'SOP' | 'TOOLS' | 'TROUBLESHOOTING' | 'TECH_DATA'
  basePath: string
}

interface Comment {
  id: number
  board_id: number
  author_id: string
  author_name: string
  content: string
  created_at: string
}

export default function GenericBoardDetail({ id, boardType, basePath }: GenericBoardDetailProps) {
  const router = useRouter()
  const { user } = useUser()
  const [boardItem, setBoardItem] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 댓글 상태
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)

  // 권한 체크: 본인 또는 관리자(레벨 5 이상)
  const canModify = () => {
    if (!user || !boardItem) return false
    if (user.id === boardItem.author_id) return true
    if (user.level === 'admin' || user.level === 'administrator') return true
    const numLevel = parseInt(String(user.level), 10)
    if (!isNaN(numLevel) && numLevel >= 5) return true
    return false
  }

  const handleDelete = async () => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return

    try {
      setIsLoading(true)
      const res = await fetch(`/api/boards/${id}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.id || '',
          'x-user-level': user?.level || ''
        }
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || '삭제 실패')
      }
      alert('게시글이 삭제되었습니다.')
      router.push(basePath)
    } catch (error: any) {
      console.error(error)
      alert('삭제 중 오류가 발생했습니다: ' + (error?.message || ''))
      setIsLoading(false)
    }
  }

  // 게시글 조회
  useEffect(() => {
    const fetchBoardDetail = async () => {
      try {
        setIsLoading(true)
        const res = await fetch(`/api/boards/${id}`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        setBoardItem(data)
      } catch (error) {
        console.error('Error fetching board detail:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBoardDetail()
  }, [id])

  // 댓글 조회
  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('board_comments')
        .select('*')
        .eq('board_id', id)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setComments(data)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [id])

  // 댓글 작성
  const handleSubmitComment = async () => {
    if (!newComment.trim()) return
    if (!user) {
      alert('로그인이 필요합니다.')
      return
    }

    setIsSubmittingComment(true)
    try {
      const { error } = await supabase
        .from('board_comments')
        .insert({
          board_id: parseInt(id),
          author_id: user.id,
          author_name: user.name || user.username || '익명',
          content: newComment.trim()
        })

      if (error) throw error

      setNewComment('')
      fetchComments()
    } catch (error) {
      console.error('Comment submission error:', error)
      alert('댓글 등록 중 오류가 발생했습니다.')
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // 댓글 삭제
  const handleDeleteComment = async (commentId: number, authorId: string) => {
    if (!user) return
    // 본인 또는 관리자만 삭제 가능
    const isOwner = user.id === authorId
    const isAdm = user.level === 'admin' || user.level === 'administrator' || parseInt(String(user.level), 10) >= 5
    if (!isOwner && !isAdm) {
      alert('본인의 댓글만 삭제할 수 있습니다.')
      return
    }
    if (!confirm('댓글을 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('board_comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
      fetchComments()
    } catch (error) {
      console.error('Comment delete error:', error)
      alert('댓글 삭제 중 오류가 발생했습니다.')
    }
  }

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>
  }

  if (!boardItem) {
    return <div className="flex justify-center items-center h-64">게시글을 찾을 수 없습니다.</div>
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* 상단 버튼 영역 */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.push(basePath)}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로
        </Button>
        <div className="flex gap-2">
          {canModify() && (
            <>
              <Button variant="outline" className="text-gray-600" onClick={() => router.push(`${basePath}/edit/${id}`)}>
                <Edit className="h-4 w-4 mr-2" />
                수정
              </Button>
              <Button variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                삭제
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 게시글 영역 */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* 게시글 헤더 */}
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{boardItem.title}</h1>
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                {boardItem.author_name?.[0] || 'U'}
              </div>
              <span className="font-medium text-gray-700">{boardItem.author_name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span>{new Date(boardItem.created_at).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Eye className="h-4 w-4 text-gray-400" />
              <span>조회 {boardItem.views}</span>
            </div>
          </div>
        </div>

        {/* 게시글 본문 */}
        <div className="px-8 py-10 min-h-[400px] text-gray-800 whitespace-pre-wrap leading-relaxed text-base">
          {boardItem.content}
        </div>
      </div>

      {/* 댓글 영역 */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* 댓글 헤더 */}
        <div className="px-8 py-4 border-b border-gray-100 bg-gray-50/30 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-gray-500" />
          <h3 className="text-sm font-bold text-gray-700">댓글 {comments.length}개</h3>
        </div>

        {/* 댓글 목록 */}
        <div className="divide-y divide-gray-100">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="px-8 py-4 hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
                      {comment.author_name?.[0] || 'U'}
                    </div>
                    <span className="font-semibold text-sm text-gray-800">{comment.author_name}</span>
                    <span className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleString()}</span>
                  </div>
                  {user && (user.id === comment.author_id || user.level === 'admin' || user.level === 'administrator' || parseInt(String(user.level), 10) >= 5) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id, comment.author_id)}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed pl-9">{comment.content}</p>
              </div>
            ))
          ) : (
            <div className="px-8 py-8 text-center text-sm text-gray-400">
              아직 댓글이 없습니다. 첫 번째 댓글을 작성해 보세요!
            </div>
          )}
        </div>

        {/* 댓글 작성 폼 */}
        <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/30">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold mt-1 shrink-0">
              {user?.name?.[0] || 'U'}
            </div>
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={user ? '댓글을 입력하세요...' : '로그인 후 댓글을 작성할 수 있습니다.'}
                disabled={!user}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[80px] disabled:bg-gray-100 disabled:cursor-not-allowed"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleSubmitComment()
                  }
                }}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">Ctrl+Enter로 등록</span>
                <Button
                  onClick={handleSubmitComment}
                  disabled={!user || !newComment.trim() || isSubmittingComment}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm h-9 px-4"
                >
                  <Send className="h-3.5 w-3.5 mr-1.5" />
                  {isSubmittingComment ? '등록 중...' : '등록'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 버튼 영역 */}
      <div className="flex justify-between items-center border-t border-gray-200 pt-6">
        <Button 
          variant="outline" 
          onClick={() => router.push(basePath)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          목록으로
        </Button>
      </div>
    </div>
  )
}
