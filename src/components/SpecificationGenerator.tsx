'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, FileText, Download, Edit3, Save, Eye } from 'lucide-react'

interface SpecificationGeneratorProps {
  isOpen: boolean
  onClose: () => void
  projectData: {
    id: number
    projectName: string
    projectNumber: string
    description?: string
  }
}

interface SpecificationData {
  type: 'PVR' | '전기판넬 및 제작' | '시운전'
  title: string
  projectName: string
  projectNumber: string
  client: string
  location: string
  date: string
  specifications: {
    section: string
    content: string
  }[]
  notes: string
}

export default function SpecificationGenerator({ isOpen, onClose, projectData }: SpecificationGeneratorProps) {
  const [specType, setSpecType] = useState<'PVR' | '전기판넬 및 제작' | '시운전'>('PVR')
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [specData, setSpecData] = useState<SpecificationData>({
    type: 'PVR',
    title: '',
    projectName: projectData.projectName,
    projectNumber: projectData.projectNumber,
    client: '',
    location: '',
    date: new Date().toLocaleDateString('ko-KR'),
    specifications: [
      { section: '개요', content: '' },
      { section: '기술사양', content: '' },
      { section: '시공방법', content: '' },
      { section: '검사기준', content: '' },
    ],
    notes: ''
  })

  const handleSpecTypeChange = (type: 'PVR' | '전기판넬 및 제작' | '시운전') => {
    setSpecType(type)
    setSpecData(prev => ({
      ...prev,
      type,
      title: `${type} 사양서 - ${projectData.projectName}`
    }))
  }

  const handleInputChange = (field: keyof SpecificationData, value: string) => {
    setSpecData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSpecificationChange = (index: number, field: 'section' | 'content', value: string) => {
    setSpecData(prev => ({
      ...prev,
      specifications: prev.specifications.map((spec, i) => 
        i === index ? { ...spec, [field]: value } : spec
      )
    }))
  }

  const addSpecification = () => {
    setSpecData(prev => ({
      ...prev,
      specifications: [...prev.specifications, { section: '', content: '' }]
    }))
  }

  const removeSpecification = (index: number) => {
    setSpecData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }))
  }

  const generateDocument = async (format: 'hwp' | 'doc') => {
    try {
      // 사양서 생성 API 호출
      const response = await fetch('/api/generate-specification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...specData,
          format
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${specData.title}.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      } else {
        alert('문서 생성에 실패했습니다.')
      }
    } catch (error) {
      console.error('문서 생성 오류:', error)
      alert('문서 생성 중 오류가 발생했습니다.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">사양서 출력</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex h-[calc(90vh-120px)]">
          {/* 왼쪽: 편집 영역 */}
          {!isPreviewMode && (
            <div className="w-1/2 p-6 overflow-y-auto border-r">
              <div className="space-y-6">
                {/* 사양서 유형 선택 */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">사양서 유형</Label>
                  <Select value={specType} onValueChange={handleSpecTypeChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PVR">PVR</SelectItem>
                      <SelectItem value="전기판넬 및 제작">전기판넬 및 제작</SelectItem>
                      <SelectItem value="시운전">시운전</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 기본 정보 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">기본 정보</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">제목</Label>
                      <Input
                        value={specData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="사양서 제목을 입력하세요"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">프로젝트명</Label>
                      <Input
                        value={specData.projectName}
                        onChange={(e) => handleInputChange('projectName', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">프로젝트 번호</Label>
                      <Input
                        value={specData.projectNumber}
                        onChange={(e) => handleInputChange('projectNumber', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">발주처</Label>
                      <Input
                        value={specData.client}
                        onChange={(e) => handleInputChange('client', e.target.value)}
                        placeholder="발주처명을 입력하세요"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">현장 위치</Label>
                      <Input
                        value={specData.location}
                        onChange={(e) => handleInputChange('location', e.target.value)}
                        placeholder="현장 위치를 입력하세요"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">작성일</Label>
                      <Input
                        value={specData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 사양서 내용 */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">사양서 내용</CardTitle>
                      <Button size="sm" onClick={addSpecification}>
                        <FileText className="h-4 w-4 mr-1" />
                        섹션 추가
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {specData.specifications.map((spec, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <Input
                            value={spec.section}
                            onChange={(e) => handleSpecificationChange(index, 'section', e.target.value)}
                            placeholder="섹션 제목"
                            className="font-medium"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeSpecification(index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={spec.content}
                          onChange={(e) => handleSpecificationChange(index, 'content', e.target.value)}
                          placeholder="섹션 내용을 입력하세요"
                          rows={4}
                        />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* 비고 */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">비고</Label>
                  <Textarea
                    value={specData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="추가 사항을 입력하세요"
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 오른쪽: 미리보기 영역 */}
          <div className="w-1/2 p-6 overflow-y-auto bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">미리보기</h3>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                >
                  {isPreviewMode ? <Edit3 className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                  {isPreviewMode ? '편집' : '미리보기'}
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{specData.title}</h1>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>프로젝트명: {specData.projectName}</p>
                  <p>프로젝트 번호: {specData.projectNumber}</p>
                  <p>발주처: {specData.client}</p>
                  <p>현장 위치: {specData.location}</p>
                  <p>작성일: {specData.date}</p>
                </div>
              </div>

              <div className="space-y-6">
                {specData.specifications.map((spec, index) => (
                  <div key={index}>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{spec.section}</h3>
                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                      {spec.content || '내용을 입력하세요'}
                    </div>
                  </div>
                ))}
              </div>

              {specData.notes && (
                <div className="mt-8 pt-4 border-t">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">비고</h3>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {specData.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <div className="text-sm text-gray-600">
            {specType} 사양서를 생성합니다
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button
              onClick={() => generateDocument('hwp')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-1" />
              HWP로 출력
            </Button>
            <Button
              onClick={() => generateDocument('doc')}
              className="bg-green-600 hover:bg-green-700"
            >
              <Download className="h-4 w-4 mr-1" />
              DOC로 출력
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}