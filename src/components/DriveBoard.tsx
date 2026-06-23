'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExternalLink, FileText, Folder, RefreshCw, Search, Sparkles, Upload } from 'lucide-react'

type DriveNode = {
  id: string
  name: string
  type: 'folder' | 'file'
  mimeType?: string
  webViewLink?: string
  previewUrl?: string | null
  modifiedTime?: string
  size?: string
  path?: string
}

interface DriveBoardProps {
  folderName: string
  title: string
  emptyMessage?: string
}

function formatDate(value?: string) {
  if (!value) return ''
  return new Date(value).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

function getFileKind(node: DriveNode) {
  if (node.type === 'folder') return '폴더'
  if (node.mimeType?.includes('pdf')) return 'PDF'
  if (node.mimeType?.includes('document')) return 'Google 문서'
  if (node.mimeType?.includes('spreadsheet')) return 'Google 스프레드시트'
  if (node.mimeType?.includes('presentation')) return 'Google 프레젠테이션'
  if (node.mimeType?.includes('image')) return '이미지'
  return '파일'
}

export default function DriveBoard({ folderName, title, emptyMessage = '구글 드라이브에 등록된 문서가 없습니다.' }: DriveBoardProps) {
  const { user } = useUser()
  const [children, setChildren] = useState<DriveNode[]>([])
  const [selected, setSelected] = useState<DriveNode | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [classifyLoading, setClassifyLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusMessage, setStatusMessage] = useState('')

  // 기기 종류 필터
  const [machineFilter, setMachineFilter] = useState('전체')
  // 하드웨어 제어기 필터
  const [hardwareFilter, setHardwareFilter] = useState('전체')

  const headers = useMemo(() => ({
    'Content-Type': 'application/json',
    'x-user-id': user?.id || ''
  }), [user?.id])

  const loadFolderData = useCallback(async () => {
    if (!user?.id) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/work-tool/drive-library?folder=${encodeURIComponent(folderName)}`, {
        headers
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '문서를 불러오지 못했습니다.')
      
      const files = data.root?.children || []
      setChildren(files)
      
      // 첫 번째 파일을 기본 선택
      const firstFile = files.find((item: DriveNode) => item.type === 'file')
      if (firstFile) {
        setSelected(firstFile)
      } else {
        setSelected(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '문서를 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }, [folderName, headers, user?.id])

  const [uploading, setUploading] = useState(false)
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !user?.id) return
    setUploading(true)
    setStatusMessage('')
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folderName)
      const res = await fetch('/api/work-tool/drive-upload', {
        method: 'POST',
        headers: { 'x-user-id': user.id },
        body: formData
      })
      const data = await res.json()
      if (!res.ok || data?.ok === false) throw new Error(data?.error || '업로드 실패')
      setStatusMessage(`✅ 업로드 완료: ${file.name}`)
      loadFolderData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '업로드에 실패했습니다.')
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    loadFolderData()
  }, [loadFolderData])

  // 수동 드라이브 파일 스마트 분류 실행
  const runDriveClassification = async () => {
    setClassifyLoading(true)
    setError('')
    setStatusMessage('')
    try {
      const res = await fetch('/api/work-tool/drive-classify', {
        method: 'POST',
        headers
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '스마트 분류 실행 실패')
      
      setStatusMessage(data.message || '스마트 분류가 성공적으로 완료되었습니다.')
      // 분류가 끝났으므로 해당 폴더 리스트 다시 로드
      await loadFolderData()
    } catch (err) {
      setError(err instanceof Error ? err.message : '스마트 분류 실행 중 오류가 발생했습니다.')
    } finally {
      setClassifyLoading(false)
    }
  }

  // 필터링 적용 목록 계산
  const filtered = useMemo(() => {
    return children.filter((item) => {
      // 1. 키워드 검색
      const term = search.trim().toLowerCase()
      const matchesSearch = !term || item.name.toLowerCase().includes(term)

      // 2. 기기 필터링 (전삭기, 선반, 디스크 선반, WSMS, 공통)
      let matchesMachine = true
      if (machineFilter !== '전체') {
        const itemClean = item.name.replace(/\s+/g, '').toLowerCase()
        const filterClean = machineFilter.replace(/\s+/g, '').toLowerCase()
        
        if (filterClean === '선반') {
          // 디스크 선반과 일반 선반 구분
          matchesMachine = itemClean.includes('선반') && !itemClean.includes('디스크선반')
        } else {
          matchesMachine = itemClean.includes(filterClean)
        }
      }

      // 3. 하드웨어(제어기) 필터링 (840D, 840Dsl, ONE, 0+, 공통)
      let matchesHardware = true
      if (hardwareFilter !== '전체') {
        const itemClean = item.name.replace(/\s+/g, '').toLowerCase()
        const filterClean = hardwareFilter.replace(/\s+/g, '').toLowerCase()

        if (filterClean === '840d') {
          // 840Dsl과 구분
          matchesHardware = itemClean.includes('840d') && !itemClean.includes('840dsl')
        } else if (filterClean === '0+') {
          // Fanuc 0+ 또는 Fanuc 0i
          matchesHardware = itemClean.includes('0+') || itemClean.includes('0i') || itemClean.includes('fanuc')
        } else {
          matchesHardware = itemClean.includes(filterClean)
        }
      }

      return matchesSearch && matchesMachine && matchesHardware
    })
  }, [children, search, machineFilter, hardwareFilter])

  const machineOptions = ['전체', '전삭기', '선반', '디스크 선반', '탠덤', '공통']
  const hardwareOptions = ['전체', '840D', '840Dsl', 'ONE', '0+', '공통']

  return (
    <div className="space-y-4">
      {/* 상단 타이틀 영역 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white/70 backdrop-blur-md border border-gray-100 rounded-xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-blue-600">
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span className="text-sm font-semibold tracking-wider uppercase">Google Drive 연동 라이브러리</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            구글 드라이브 <code className="px-1.5 py-0.5 rounded bg-gray-100 font-mono text-xs text-blue-700">manual/{folderName}/original</code> 폴더에 보관된 문서가 실시간 연동됩니다.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* 파일 업로드 (드라이브 original 폴더로) */}
          <label className={`inline-flex cursor-pointer items-center rounded-md px-4 py-2 text-sm font-medium ${uploading ? 'bg-gray-300 text-gray-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
            <Upload className={`mr-2 h-4 w-4 ${uploading ? 'animate-pulse' : ''}`} />
            {uploading ? '업로드 중...' : '파일 업로드'}
            <input type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
          {/* 스마트 분류 실행 버튼 */}
          <Button onClick={runDriveClassification} disabled={classifyLoading || loading} variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
            <Sparkles className={`mr-2 h-4 w-4 text-blue-600 ${classifyLoading ? 'animate-pulse' : ''}`} />
            원본 자동 분류 실행
          </Button>
          <Button onClick={loadFolderData} disabled={loading} className="bg-blue-600 text-white hover:bg-blue-700 font-medium">
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </Button>
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700 font-medium">
          {statusMessage}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50/50 px-4 py-3 text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      {/* 리스트 및 뷰어 레이아웃 */}
      <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
        {/* 좌측 리스트 카드 */}
        <Card className="border-gray-200 overflow-hidden shadow-sm flex flex-col h-[78vh]">
          {/* 필터 설정 컨트롤 영역 */}
          <div className="p-4 border-b border-gray-100 space-y-3 bg-gray-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="문서 제목 검색..."
                className="pl-9 bg-white border-gray-200 focus-visible:ring-blue-500"
              />
            </div>
            
            {/* 오라버니가 요청한 기기 및 하드웨어 필터 드롭다운 */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">기기 제품군</span>
                <select
                  value={machineFilter}
                  onChange={(event) => setMachineFilter(event.target.value)}
                  className="h-9 w-full rounded-md border border-gray-200 bg-white px-2.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer"
                >
                  {machineOptions.map((option) => (
                    <option key={option} value={option}>기기: {option}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-1">제어기 사양</span>
                <select
                  value={hardwareFilter}
                  onChange={(event) => setHardwareFilter(event.target.value)}
                  className="h-9 w-full rounded-md border border-gray-200 bg-white px-2.5 text-xs text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium cursor-pointer"
                >
                  {hardwareOptions.map((option) => (
                    <option key={option} value={option}>HW: {option}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <CardContent className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {loading ? (
              <div className="flex items-center justify-center h-full text-sm text-gray-400 gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                드라이브 문서 로딩 중...
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-sm text-gray-400 p-8 text-center">
                <FileText className="h-10 w-10 text-gray-300 mb-2" />
                <p>{emptyMessage}</p>
                {(machineFilter !== '전체' || hardwareFilter !== '전체' || search) && (
                  <p className="text-xs text-gray-400 mt-1">필터 설정을 해제하면 더 많은 결과가 보일 수 있습니다.</p>
                )}
              </div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  onClick={() => item.type === 'file' && setSelected(item)}
                  className={`w-full rounded-lg border p-3.5 text-left transition-all ${
                    selected?.id === item.id
                      ? 'border-blue-500 bg-blue-50/60 shadow-sm ring-1 ring-blue-500/20'
                      : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {item.type === 'folder' ? (
                      <Folder className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                    ) : (
                      <FileText className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-gray-950">
                        {item.name}
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-400 font-medium">
                        <span>{getFileKind(item)}</span>
                        {item.modifiedTime && <span>{formatDate(item.modifiedTime)}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </CardContent>
        </Card>

        {/* 우측 뷰어 카드 */}
        <Card className="border-gray-200 overflow-hidden shadow-sm flex flex-col h-[78vh]">
          <CardContent className="p-0 flex flex-col h-full bg-gray-50/30">
            {selected ? (
              <div className="flex flex-col h-full">
                {/* 뷰어 헤더 */}
                <div className="flex items-center justify-between border-b border-gray-100 bg-white px-5 py-4">
                  <div className="min-w-0">
                    <div className="truncate font-bold text-gray-950 text-base">{selected.name}</div>
                    <div className="truncate text-xs text-gray-500 mt-1 font-medium">
                      {getFileKind(selected)} · 수정일자: {formatDate(selected.modifiedTime)}
                    </div>
                  </div>
                  {selected.webViewLink && (
                    <Button variant="outline" size="sm" className="border-gray-200" asChild>
                      <a href={selected.webViewLink} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Drive에서 열기
                      </a>
                    </Button>
                  )}
                </div>
                
                {/* iframe 영역 */}
                <div className="flex-1 bg-white relative">
                  {selected.previewUrl ? (
                    <iframe
                      title={selected.name}
                      src={selected.previewUrl}
                      className="absolute inset-0 h-full w-full border-0"
                      allow="autoplay"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400 font-medium bg-white">
                      미리보기를 지원하지 않는 문서 포맷입니다.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-sm text-gray-400 p-8 text-center bg-white">
                <FileText className="h-16 w-16 text-gray-200 mb-4 animate-bounce" />
                <p className="font-semibold text-gray-500">선택된 문서가 없습니다.</p>
                <p className="text-xs text-gray-400 mt-1">왼쪽 목록에서 열람하실 문서를 선택해 주세요.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
