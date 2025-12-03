'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Project } from '@/lib/types'
import { X, Save, Settings, Zap, Cpu, Palette, Plus, Trash2, Edit2, FileText, AlertTriangle } from 'lucide-react'
import MotorSpecModal from './MotorSpecModal'
import BulkMotorAddModal from './BulkMotorAddModal'
import SpecificationGenerator from './SpecificationGenerator'

interface ProjectDetailModalProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onSave: (project: Project) => void
  onDelete?: (projectId: number) => void
}

interface MotorSpec {
  id?: number
  motor_type: string
  motor_name: string
  power_kw: number
  voltage: string
  phase: string
  pole: string
  current_amp?: number
  quantity: number
  breaker_size?: string
  cable_size?: string
  eocr_setting?: string
  breaker_setting?: string
}

interface CctvLocation {
  id: string
  location: string
}

interface AdditionalOption {
  id: string
  name: string
  location: string
}

export default function ProjectDetailModal({ project, isOpen, onClose, onSave, onDelete }: ProjectDetailModalProps) {
  const [currentProject, setCurrentProject] = useState<Project | null>(project)
  const [activeTab, setActiveTab] = useState('basic')
  const [motors, setMotors] = useState<MotorSpec[]>([])
  const [cctvLocations, setCctvLocations] = useState<CctvLocation[]>([])
  const [additionalOptions, setAdditionalOptions] = useState<AdditionalOption[]>([])
  const [hardwareType, setHardwareType] = useState<string>('')
  const [showMotorModal, setShowMotorModal] = useState(false)
  const [showBulkMotorModal, setShowBulkMotorModal] = useState(false)
  const [showSpecGenerator, setShowSpecGenerator] = useState(false)
  const [editingMotor, setEditingMotor] = useState<MotorSpec | null>(null)
  const [totalPower, setTotalPower] = useState<{ [key: string]: number }>({})
  const [totalCurrent, setTotalCurrent] = useState<{ [key: string]: number }>({})

  // 총 용량 및 전류 계산
  const calculateTotals = useCallback((motorList: MotorSpec[]) => {
    if (!Array.isArray(motorList)) return

    const powerByVoltage: { [key: string]: number } = {}
    const currentByVoltage: { [key: string]: number } = {}

    motorList.forEach(motor => {
      const totalPower = motor.power_kw * motor.quantity
      const totalCurrent = (motor.current_amp || 0) * motor.quantity
      
      if (!powerByVoltage[motor.voltage]) {
        powerByVoltage[motor.voltage] = 0
        currentByVoltage[motor.voltage] = 0
      }
      
      powerByVoltage[motor.voltage] += totalPower
      currentByVoltage[motor.voltage] += totalCurrent
    })

    setTotalPower(powerByVoltage)
    setTotalCurrent(currentByVoltage)
  }, [])

  // 모터 사양 로드
  const loadMotorSpecs = useCallback(async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/motors`)
      if (response.ok) {
        const motorData = await response.json()
        if (Array.isArray(motorData)) {
          setMotors(motorData)
          calculateTotals(motorData)
        } else {
          setMotors([])
          calculateTotals([])
        }
      }
    } catch (error) {
      console.error('모터 사양 로드 실패:', error)
      setMotors([])
      calculateTotals([])
    }
  }, [calculateTotals])

  useEffect(() => {
    setCurrentProject(project)
    setActiveTab('basic')
    setMotors([])
    setCctvLocations([])
    setAdditionalOptions([])
    
    // 프로젝트가 있으면 모터 사양 로드
    if (project?.id) {
      loadMotorSpecs(String(project.id))
    }
  }, [project, loadMotorSpecs])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value, type, checked } = e.target as HTMLInputElement;
    setCurrentProject(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [id]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
      };
    });
  };

  const handleSwitchChange = (id: keyof Project, checked: boolean) => {
    setCurrentProject(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [id]: checked
      };
    });
  };

  // 모터 추가
  const handleAddMotor = () => {
    setEditingMotor(null)
    setShowMotorModal(true)
  }

  // 대량 모터 추가
  const handleBulkAddMotor = () => {
    setShowBulkMotorModal(true)
  }

  // 대량 모터 저장
  const handleBulkSaveMotor = async (motorsToAdd: MotorSpec[]) => {
    if (!currentProject?.id) return

    try {
      const promises = motorsToAdd.map(motor => 
        fetch(`/api/projects/${currentProject.id}/motors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(motor)
        })
      )

      const results = await Promise.all(promises)
      const failed = results.filter(result => !result.ok)
      
      if (failed.length > 0) {
        alert(`${failed.length}개 모터 추가에 실패했습니다.`)
      } else {
        await loadMotorSpecs(String(currentProject.id))
        alert(`${motorsToAdd.length}개 모터가 성공적으로 추가되었습니다.`)
      }
    } catch (error) {
      console.error('대량 모터 추가 오류:', error)
      alert('모터 추가 중 오류가 발생했습니다.')
    }
  }

  // 모터 수정
  const handleEditMotor = (motor: MotorSpec) => {
    setEditingMotor(motor)
    setShowMotorModal(true)
  }

  // 모터 저장
  const handleSaveMotor = async (motorData: MotorSpec) => {
    if (!currentProject?.id) return

    try {
      const url = `/api/projects/${currentProject.id}/motors`
      const method = motorData.id ? 'PUT' : 'POST'
      const params = motorData.id ? `?motorId=${motorData.id}` : ''

      const response = await fetch(url + params, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(motorData)
      })

      if (response.ok) {
        await loadMotorSpecs(String(currentProject.id))
      } else {
        alert('모터 사양 저장에 실패했습니다.')
      }
    } catch (error) {
      console.error('모터 사양 저장 오류:', error)
      alert('모터 사양 저장 중 오류가 발생했습니다.')
    }
  }

  // 모터 삭제
  const handleDeleteMotor = async (motorId: number) => {
    if (!currentProject?.id) return

    if (!confirm('이 모터를 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/projects/${currentProject.id}/motors?motorId=${motorId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadMotorSpecs(String(currentProject.id))
      } else {
        alert('모터 삭제에 실패했습니다.')
      }
    } catch (error) {
      console.error('모터 삭제 오류:', error)
      alert('모터 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleCctvLocationChange = (id: string, value: string) => {
    setCctvLocations(prev => prev.map(loc => 
      loc.id === id ? { ...loc, location: value } : loc
    ))
  }

  const addCctvLocation = () => {
    const newLocation: CctvLocation = {
      id: Date.now().toString(),
      location: ''
    }
    setCctvLocations(prev => [...prev, newLocation])
  }

  const removeCctvLocation = (id: string) => {
    setCctvLocations(prev => prev.filter(loc => loc.id !== id))
  }

  const handleAdditionalOptionChange = (id: string, field: keyof AdditionalOption, value: string) => {
    setAdditionalOptions(prev => prev.map(option => 
      option.id === id ? { ...option, [field]: value } : option
    ))
  }

  const addAdditionalOption = () => {
    const newOption: AdditionalOption = {
      id: Date.now().toString(),
      name: '',
      location: ''
    }
    setAdditionalOptions(prev => [...prev, newOption])
  }

  const removeAdditionalOption = (id: string) => {
    setAdditionalOptions(prev => prev.filter(option => option.id !== id))
  }


  const handleSave = () => {
    if (currentProject) {
      onSave(currentProject);
    }
  };

  const handleDelete = () => {
    if (currentProject && onDelete) {
      // Encoding issue fix: Using English for confirmation
      if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
        onDelete(currentProject.id);
      }
    }
  }

  if (!currentProject) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[1200px] h-[90vh] p-0 gap-0 bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white flex flex-row items-center justify-between shrink-0">
          <div className="flex flex-col gap-1.5">
            <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
              프로젝트 설정
            </DialogTitle>
            <p className="text-sm text-gray-500 font-medium pl-14">
              {currentProject.project_name || '새 프로젝트'} <span className="mx-2 text-gray-300">|</span> {currentProject.project_number || '미지정'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
            <X className="h-6 w-6" />
          </Button>
        </DialogHeader>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 pt-6 pb-2 shrink-0 bg-white">
            <TabsList className="grid w-full grid-cols-5 h-14 p-1.5 bg-slate-100/80 rounded-2xl">
              <TabsTrigger 
                value="basic" 
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-medium transition-all text-gray-500 hover:text-gray-900"
              >
                기본정보
              </TabsTrigger>
              <TabsTrigger 
                value="hardware" 
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-medium transition-all text-gray-500 hover:text-gray-900"
              >
                하드웨어
              </TabsTrigger>
              <TabsTrigger 
                value="power" 
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-medium transition-all text-gray-500 hover:text-gray-900"
              >
                전원사양
              </TabsTrigger>
              <TabsTrigger 
                value="motor" 
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-medium transition-all text-gray-500 hover:text-gray-900"
              >
                모터사양
              </TabsTrigger>
              <TabsTrigger 
                value="option" 
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-medium transition-all text-gray-500 hover:text-gray-900"
              >
                옵션사양
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-6 bg-white">
            <TabsContent value="basic" className="mt-0 space-y-8 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              {/* Basic Info Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <div className="h-8 w-1 bg-blue-500 rounded-full" />
                  <h3 className="text-lg font-bold text-gray-800">기본 정보</h3>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="project_name" className="text-gray-600 font-medium">프로젝트명</Label>
                    <Input 
                      id="project_name" 
                      value={currentProject.project_name || ''} 
                      onChange={handleChange} 
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-gray-600 font-medium">업무 구분</Label>
                    <Select 
                      value={currentProject.category || 'project'} 
                      onValueChange={(value) => handleChange({ target: { id: 'category', value } } as any)}
                    >
                      <SelectTrigger className="h-12 border-gray-200 focus:ring-4 focus:ring-blue-500/10 rounded-xl">
                        <SelectValue placeholder="업무 구분 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white shadow-lg border-gray-100">
                        <SelectItem value="project">프로젝트</SelectItem>
                        <SelectItem value="individual">개별업무</SelectItem>
                        <SelectItem value="standardization">업무 표준화</SelectItem>
                        <SelectItem value="wheel_conversion">차륜관리프로그램 변환</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="base_name" className="text-gray-600 font-medium">기지명</Label>
                    <Input 
                      id="base_name" 
                      value={currentProject.base_name || ''} 
                      onChange={handleChange}
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_name" className="text-gray-600 font-medium">고객사명</Label>
                    <Input 
                      id="client_name" 
                      value={currentProject.client_name || ''} 
                      onChange={handleChange}
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_contact" className="text-gray-600 font-medium">고객사 연락처</Label>
                    <Input 
                      id="client_contact" 
                      value={currentProject.client_contact || ''} 
                      onChange={handleChange}
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ProjectStatus" className="text-gray-600 font-medium">프로젝트 상태</Label>
                    <Select value={currentProject.ProjectStatus} onValueChange={(value) => handleChange({ target: { id: 'ProjectStatus', value } } as any)}>
                      <SelectTrigger className="h-12 border-gray-200 focus:ring-4 focus:ring-blue-500/10 rounded-xl">
                        <SelectValue placeholder="상태 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Manufacturing">제작중</SelectItem>
                        <SelectItem value="Demolished">철거</SelectItem>
                        <SelectItem value="Warranty">하자보증중</SelectItem>
                        <SelectItem value="WarrantyComplete">하자보증완료</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-3 pt-8">
                    <Switch
                      id="has_disk"
                      checked={currentProject.has_disk || false}
                      onCheckedChange={(checked) => handleSwitchChange('has_disk', checked)}
                    />
                    <Label htmlFor="has_disk" className="text-gray-700 font-medium cursor-pointer">디스크브레이크 포함</Label>
                  </div>
                </div>
              </section>
              
              {/* Schedule Info Section */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <div className="h-8 w-1 bg-purple-500 rounded-full" />
                  <h3 className="text-lg font-bold text-gray-800">일정 정보</h3>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="assembly_date" className="text-gray-600 font-medium">조립완료일</Label>
                    <Input 
                      id="assembly_date" 
                      type="date" 
                      value={currentProject.assembly_date || ''} 
                      onChange={handleChange}
                      className="h-11 border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="factory_test_date" className="text-gray-600 font-medium">공장시운전일</Label>
                    <Input 
                      id="factory_test_date" 
                      type="date" 
                      value={currentProject.factory_test_date || ''} 
                      onChange={handleChange}
                      className="h-11 border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="site_test_date" className="text-gray-600 font-medium">현장시운전일</Label>
                    <Input 
                      id="site_test_date" 
                      type="date" 
                      value={currentProject.site_test_date || ''} 
                      onChange={handleChange}
                      className="h-11 border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="completion_date" className="text-gray-600 font-medium">준공완료일</Label>
                    <Input 
                      id="completion_date" 
                      type="date" 
                      value={currentProject.completion_date || ''} 
                      onChange={handleChange}
                      className="h-11 border-gray-200"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="warranty_period" className="text-gray-600 font-medium">하자보증기간</Label>
                    <Input 
                      id="warranty_period" 
                      value={currentProject.warranty_period || ''} 
                      onChange={handleChange} 
                      placeholder="예: 1년, 2년"
                      className="h-11 border-gray-200"
                    />
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="hardware" className="mt-0 space-y-8 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <div className="h-8 w-1 bg-emerald-500 rounded-full" />
                  <h3 className="text-lg font-bold text-gray-800">하드웨어 구성</h3>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="hardware_type" className="text-gray-600 font-medium">제조사 (PLC/HMI)</Label>
                    <Select value={hardwareType} onValueChange={setHardwareType}>
                      <SelectTrigger className="h-11 border-gray-200">
                        <SelectValue placeholder="하드웨어 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="siemens">Siemens (지멘스)</SelectItem>
                        <SelectItem value="fanuc">Fanuc (화낙)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hardware_version" className="text-gray-600 font-medium">하드웨어 버전 / 모델명</Label>
                    <Input 
                      id="hardware_version" 
                      value={currentProject.hardware_version || ''} 
                      onChange={handleChange}
                      className="h-11 border-gray-200"
                    />
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="power" className="mt-0 space-y-8 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <div className="h-8 w-1 bg-amber-500 rounded-full" />
                  <h3 className="text-lg font-bold text-gray-800">인입전원 사양</h3>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="incoming_voltage" className="text-gray-600 font-medium">전압 (V)</Label>
                    <Input 
                      id="incoming_voltage" 
                      value={currentProject.incoming_power || ''} 
                      onChange={handleChange}
                      className="h-11 border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="primary_breaker" className="text-gray-600 font-medium">메인 차단기 (A)</Label>
                    <Input 
                      id="primary_breaker" 
                      value={currentProject.primary_breaker || ''} 
                      onChange={handleChange}
                      className="h-11 border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="incoming_current" className="text-gray-600 font-medium">정격 전류 (A)</Label>
                    <Input 
                      id="incoming_current" 
                      type="number" 
                      value={currentProject.pvr_ampere || 0} 
                      onChange={handleChange}
                      className="h-11 border-gray-200"
                    />
                  </div>
                </div>
              </section>
              
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <div className="h-8 w-1 bg-orange-500 rounded-full" />
                  <h3 className="text-lg font-bold text-gray-800">PVR / 제어전원</h3>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="primary_power" className="text-gray-600 font-medium">1차 전원</Label>
                    <Input 
                      id="primary_power" 
                      value={currentProject.incoming_power || ''} 
                      onChange={handleChange}
                      className="h-11 border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary_power" className="text-gray-600 font-medium">2차 전원 (제어전원)</Label>
                    <Select value={hardwareType} onValueChange={(value) => {
                      setHardwareType(value)
                      const voltage = value === 'siemens' ? '400V' : '200V'
                      setCurrentProject(prev => prev ? {...prev, hardware_version: value} : null)
                    }}>
                      <SelectTrigger className="h-11 border-gray-200">
                        <SelectValue placeholder="자동 설정" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="siemens">지멘스 (400V)</SelectItem>
                        <SelectItem value="fanuc">화낙 (200V)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondary_breaker" className="text-gray-600 font-medium">2차 차단기 용량</Label>
                    <Input 
                      id="secondary_breaker" 
                      type="number" 
                      value={currentProject.pvr_ampere || 0} 
                      onChange={handleChange}
                      className="h-11 border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequency" className="text-gray-600 font-medium">주파수 (Hz)</Label>
                    <Input 
                      id="frequency" 
                      type="number" 
                      value={currentProject.frequency || 0} 
                      onChange={handleChange}
                      className="h-11 border-gray-200"
                    />
                  </div>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="motor" className="mt-0 space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-1 bg-indigo-500 rounded-full" />
                  <h3 className="text-lg font-bold text-gray-800">모터 목록</h3>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowSpecGenerator(true)} size="sm" variant="secondary" className="bg-gray-100 hover:bg-gray-200 text-gray-700">
                    <FileText className="h-4 w-4 mr-2" />
                    사양서 출력
                  </Button>
                  <Button onClick={handleBulkAddMotor} size="sm" variant="outline" className="border-gray-300 hover:bg-gray-50">
                    <Plus className="h-4 w-4 mr-2" />
                    대량 추가
                  </Button>
                  <Button onClick={handleAddMotor} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    개별 추가
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {motors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
                    <Cpu className="h-12 w-12 mb-3 text-gray-300" />
                    <p className="font-medium">등록된 모터가 없습니다</p>
                    <p className="text-sm">상단의 &apos;추가&apos; 버튼을 눌러 모터를 등록해주세요.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {motors.map((motor) => (
                      <div key={motor.id} className="group border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all bg-white">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                              M
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-lg">{motor.motor_name}</h4>
                              <p className="text-xs text-gray-500 font-medium">{motor.motor_type} | {motor.quantity}대</p>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              onClick={() => handleEditMotor(motor)} 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              onClick={() => handleDeleteMotor(motor.id!)} 
                              variant="ghost" 
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-y-3 gap-x-4 text-sm">
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400">출력</span>
                            <span className="font-semibold text-gray-700">{motor.power_kw}kW</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400">전압</span>
                            <span className="font-semibold text-gray-700">{motor.voltage}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400">전류</span>
                            <span className="font-semibold text-gray-700">{motor.current_amp}A</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400">차단기</span>
                            <span className="font-semibold text-gray-700">{motor.breaker_size}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400">케이블</span>
                            <span className="font-semibold text-gray-700">{motor.cable_size}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs text-gray-400">총 용량</span>
                            <span className="font-bold text-blue-600">{(motor.power_kw * motor.quantity).toFixed(2)}kW</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {Object.keys(totalPower).length > 0 && (
                <div className="mt-8 pt-6 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">전압별 합계</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(totalPower).map(([voltage, power]) => (
                      <div key={voltage} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-slate-700">{voltage}</span>
                          <span className="text-xs bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">Total</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">총 용량</span>
                            <span className="font-bold text-blue-600">{power.toFixed(2)}kW</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-500">총 전류</span>
                            <span className="font-bold text-blue-600">{totalCurrent[voltage]?.toFixed(2) || 0}A</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="option" className="mt-0 space-y-8 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* CCTV Section */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <Zap className="h-5 w-5" />
                      </div>
                      <h3 className="font-bold text-lg text-gray-800">CCTV 설정</h3>
                    </div>
                    <Switch 
                      id="cctv_enabled"
                      checked={currentProject.cctv_spec ? true : false}
                      onCheckedChange={(checked) => setCurrentProject(prev => prev ? {...prev, cctv_spec: checked ? 'enabled' : ''} : null)}
                    />
                  </div>
                  
                  {currentProject.cctv_spec && (
                    <div className="space-y-4 animate-in fade-in-50">
                      <div className="grid grid-cols-2 gap-3">
                        {['공구대 2곳', '칩컨베이어', '크러셔', '기타'].map((label) => (
                          <div key={label} className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg">
                            <Checkbox id={`cctv_${label}`} />
                            <Label htmlFor={`cctv_${label}`} className="text-sm font-medium">{label}</Label>
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-3 pt-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase">설치 위치 상세</Label>
                        {cctvLocations.map((location) => (
                          <div key={location.id} className="flex gap-2">
                            <Input 
                              value={location.location} 
                              onChange={(e) => handleCctvLocationChange(location.id, e.target.value)}
                              placeholder="위치 입력"
                              className="h-9 text-sm"
                            />
                            <Button onClick={() => removeCctvLocation(location.id)} variant="ghost" size="icon" className="h-9 w-9 text-red-500 hover:bg-red-50">
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button onClick={addCctvLocation} variant="outline" size="sm" className="w-full border-dashed text-gray-500 hover:text-blue-600 hover:border-blue-300">
                          <Plus className="h-3 w-3 mr-2" />
                          위치 추가
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Other Options */}
                <div className="space-y-6">
                  {/* Warning Light */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                          <Palette className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-800">경광등</h3>
                      </div>
                      <Switch 
                        checked={currentProject.warning_light || false}
                        onCheckedChange={(checked) => handleSwitchChange('warning_light', checked as boolean)}
                      />
                    </div>
                    {currentProject.warning_light && (
                      <Input placeholder="설치 위치 입력" className="mt-2" />
                    )}
                  </div>

                  {/* Buzzer */}
                  <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg text-red-600">
                          <Zap className="h-5 w-5" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-800">부저</h3>
                      </div>
                      <Switch 
                        checked={currentProject.buzzer || false}
                        onCheckedChange={(checked) => handleSwitchChange('buzzer', checked as boolean)}
                      />
                    </div>
                    {currentProject.buzzer && (
                      <Input placeholder="설치 위치 입력" className="mt-2" />
                    )}
                  </div>
                </div>
              </div>

              {/* Additional Options List */}
              <div className="pt-6 border-t border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800">기타 추가사항</h3>
                  <Button onClick={addAdditionalOption} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    항목 추가
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {additionalOptions.map((option) => (
                    <div key={option.id} className="flex gap-4 items-start p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex-1 space-y-2">
                        <Label className="text-xs text-gray-500">옵션명</Label>
                        <Input 
                          value={option.name} 
                          onChange={(e) => handleAdditionalOptionChange(option.id, 'name', e.target.value)}
                          className="bg-white h-9"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label className="text-xs text-gray-500">설치 위치 / 비고</Label>
                        <Input 
                          value={option.location} 
                          onChange={(e) => handleAdditionalOptionChange(option.id, 'location', e.target.value)}
                          className="bg-white h-9"
                        />
                      </div>
                      <Button onClick={() => removeAdditionalOption(option.id)} variant="ghost" size="icon" className="mt-6 text-gray-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {additionalOptions.length === 0 && (
                    <p className="text-center text-gray-400 text-sm py-4">추가된 항목이 없습니다.</p>
                  )}
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer */}
        <DialogFooter className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex justify-between w-full items-center">
            <div>
              {onDelete && (
                <Button 
                  variant="ghost" 
                  onClick={handleDelete} 
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  프로젝트 삭제
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} className="h-11 px-6 border-gray-300 text-gray-700 hover:bg-white hover:text-gray-900">
                취소
              </Button>
              <Button onClick={handleSave} className="h-11 px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20">
                <Save className="h-4 w-4 mr-2" />
                변경사항 저장
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Modals remain unchanged */}
      <MotorSpecModal
        isOpen={showMotorModal}
        onClose={() => setShowMotorModal(false)}
        onSave={handleSaveMotor}
        motor={editingMotor}
        projectId={String(currentProject?.id || '')}
      />

      <BulkMotorAddModal
        isOpen={showBulkMotorModal}
        onClose={() => setShowBulkMotorModal(false)}
        onSave={handleBulkSaveMotor}
        projectId={String(currentProject?.id || '')}
      />

      <SpecificationGenerator
        isOpen={showSpecGenerator}
        onClose={() => setShowSpecGenerator(false)}
        projectData={{
          id: Number(currentProject?.id) || 0,
          projectName: currentProject?.project_name || '',
          projectNumber: currentProject?.project_number || '',
          description: currentProject?.description
        }}
      />
    </Dialog>
  );
}
