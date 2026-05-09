'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { Search, Plus, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

interface BoardItem {
  id: number
  title: string
  content: string
  author: string
  date: string
  views: number
  hasAttachment?: boolean
}

interface GenericBoardProps {
  boardType: 'SOP' | 'TOOLS' | 'TROUBLESHOOTING' | 'TECH_DATA'
  emptyMessage?: string
  basePath: string
}

export default function GenericBoard({ boardType, emptyMessage = '등록된 게시글이 없습니다.', basePath }: GenericBoardProps) {
  const router = useRouter()
  const { user } = useUser()
  const [searchTerm, setSearchTerm] = useState('')
  const [boardData, setBoardData] = useState<BoardItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchBoards = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/boards?boardType=${boardType}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      
      const formattedData: BoardItem[] = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: '', // 목록에서는 안 쓰임
        author: item.author_name || '관리자',
        date: new Date(item.created_at).toISOString().split('T')[0],
        views: item.views || 0,
        hasAttachment: false // 나중에 파일 업로드 구현 시 연동
      }))
      
      setBoardData(formattedData)
    } catch (error) {
      console.error('Error fetching boards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBoards()
  }, [boardType])

  const filteredData = boardData.filter(item => item.title.includes(searchTerm))

  return (
    <div className="flex flex-col space-y-4">
      {/* 상단 검색 및 버튼 영역 */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="제목이나 내용으로 검색하세요..." 
            className="pl-9 bg-gray-50 border-gray-200 focus-visible:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => router.push(`${basePath}/write`)} className="bg-blue-600 hover:bg-blue-700 text-white shrink-0">
          <Plus className="h-4 w-4 mr-2" />
          글쓰기
        </Button>
      </div>

      {/* 게시판 목록 */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                <tr>
                  <th className="px-6 py-4 w-20 text-center">번호</th>
                  <th className="px-6 py-4">제목</th>
                  <th className="px-6 py-4 w-24 text-center">첨부</th>
                  <th className="px-6 py-4 w-32 text-center">작성자</th>
                  <th className="px-6 py-4 w-32 text-center">작성일</th>
                  <th className="px-6 py-4 w-20 text-center">조회</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      로딩 중...
                    </td>
                  </tr>
                ) : filteredData.length > 0 ? (
                  filteredData.map((item) => (
                    <tr 
                      key={item.id} 
                      onClick={() => router.push(`${basePath}/${item.id}`)}
                      className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                    >
                      <td className="px-6 py-4 text-center text-gray-500">{item.id}</td>
                      <td className="px-6 py-4 font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {item.title}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.hasAttachment && <FileText className="h-4 w-4 mx-auto text-gray-400" />}
                      </td>
                      <td className="px-6 py-4 text-center text-gray-600">{item.author}</td>
                      <td className="px-6 py-4 text-center text-gray-500">{item.date}</td>
                      <td className="px-6 py-4 text-center text-gray-500">{item.views}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <FileText className="h-10 w-10 text-gray-300 mb-3" />
                        <p>{emptyMessage}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-center py-4 space-x-2">
        <Button variant="outline" size="icon" className="h-8 w-8" disabled>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="sm" className="h-8 w-8 bg-blue-600 text-white hover:bg-blue-700 hover:text-white border-0">
          1
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" disabled>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

    </div>
  )
}
