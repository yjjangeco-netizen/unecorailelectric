'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Project } from '@/lib/types'
import { X, Save, Settings, Zap, Cpu, Palette, Plus, Trash2, Edit2, FileText, Briefcase, Wrench, LayoutGrid, Cog } from 'lucide-react'
import MotorSpecModal from './MotorSpecModal'
import BulkMotorAddModal from './BulkMotorAddModal'
import SpecificationGenerator from './SpecificationGenerator'

interface ProjectDetailModalProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onSave: (project: Project) => void
  onDelete?: (projectId: number) => void
  isNewProject?: boolean
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

// 업무 구분별 탭 설정
const CATEGORY_TABS: Record<string, string[]> = {
  project: ['basic', 'hardware', 'power', 'motor', 'option'],
  individual: ['basic'],
  standardization: ['basic'],
  wheel_conversion: ['basic', 'hardware'],
}

// 업무 구분 정보
const CATEGORY_INFO: Record<string, { label: string; icon: React.ReactNode; color: string; description: string }> = {
  project: { 
    label: '프로젝트', 
    icon: <Briefcase className="h-5 w-5" />, 
    color: 'from-blue-500 to-indigo-600',
    description: '차륜선삭기/선반 제작 프로젝트'
  },
  individual: { 
    label: '개별업무', 
    icon: <Wrench className="h-5 w-5" />, 
    color: 'from-emerald-500 to-teal-600',
    description: 'AS/SS 및 개별 유지보수 업무'
  },
  standardization: { 
    label: '업무 표준화', 
    icon: <LayoutGrid className="h-5 w-5" />, 
    color: 'from-purple-500 to-pink-600',
    description: '표준화 문서 및 프로세스'
  },
  wheel_conversion: { 
    label: '차륜관리프로그램 변환', 
    icon: <Cog className="h-5 w-5" />, 
    color: 'from-orange-500 to-red-600',
    description: '차륜관리프로그램 버전 업그레이드'
  },
}

// 기본 프로젝트 상태 (컴포넌트 외부에 정의)
const DEFAULT_PROJECT: Project = {
  id: 0,
  project_name: '',
  project_number: '',
  category: 'project',
  description: '',
  ProjectStatus: 'Manufacturing',
  priority: 'medium',
  start_date: '',
  end_date: '',
  assembly_date: '',
  factory_test_date: '',
  site_test_date: '',
  completion_date: '',
  warranty_period: '',
  budget: 0,
  manager_id: '',
  client_name: '',
  client_contact: '',
  created_by: '',
  created_at: '',
  updated_at: '',
  base_name: '',
  hardware_version: '',
  has_disk: false,
  incoming_power: '',
  primary_breaker: '',
  pvr_ampere: 0,
  frequency: 0,
  spindle_spec: '',
  tool_post_spec: '',
  pump_low_spec: '',
  pump_high_spec: '',
  crusher_spec: '',
  conveyor_spec: '',
  dust_collector_spec: '',
  vehicle_transfer_device: '',
  oil_heater: '',
  cooling_fan: '',
  chiller: '',
  lubrication: '',
  grease: '',
  cctv_spec: '',
  automatic_cover: '',
  ups_spec: '',
  configuration: '',
  main_color: '',
  auxiliary_color: '',
  warning_light: false,
  buzzer: false,
  speaker: false,
  automatic_rail: false,
  is_active: true,
}

export default function ProjectEditModal({ project, isOpen, onClose, onSave, onDelete, isNewProject = false }: ProjectDetailModalProps) {
  const [currentProject, setCurrentProject] = useState<Project>(project || DEFAULT_PROJECT)
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

  // 현재 카테고리에서 사용 가능한 탭 (useMemo로 최적화)
  const availableTabs = useMemo(() => 
    CATEGORY_TABS[currentProject.category || 'project'] || ['basic'],
    [currentProject.category]
  )

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
    if (isOpen) {
      setCurrentProject(project || DEFAULT_PROJECT)
      setActiveTab('basic')
      setMotors([])
      setCctvLocations([])
      setAdditionalOptions([])
      
      // 기존 프로젝트가 있으면 모터 사양 로드
      if (project?.id) {
        loadMotorSpecs(String(project.id))
      }
    }
  }, [project, isOpen, loadMotorSpecs])

  // 카테고리 변경 시 탭 확인
  useEffect(() => {
    if (!availableTabs.includes(activeTab)) {
      setActiveTab('basic')
    }
  }, [currentProject.category, activeTab, availableTabs])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target as HTMLInputElement;
    const checked = (e.target as HTMLInputElement).checked;
    setCurrentProject(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : (type === 'number' ? parseFloat(value) : value)
    }));
  };

  const handleSwitchChange = (id: keyof Project, checked: boolean) => {
    setCurrentProject(prev => ({
      ...prev,
      [id]: checked
    }));
  };

  const handleCategoryChange = (category: string) => {
    setCurrentProject(prev => ({
      ...prev,
      category
    }));
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
    if (currentProject && onDelete && currentProject.id) {
      if (confirm('정말로 이 프로젝트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        onDelete(currentProject.id);
      }
    }
  }

  // 탭 이름 매핑
  const tabNames: Record<string, string> = {
    basic: '기본정보',
    hardware: '하드웨어',
    power: '전원사양',
    motor: '모터사양',
    option: '옵션사양'
  }

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
              {isNewProject || !project ? '프로젝트 추가' : '프로젝트 설정'}
            </DialogTitle>
            <p className="text-sm text-gray-500 font-medium pl-14">
              {currentProject.project_name || '새 프로젝트'} 
              {currentProject.project_number && (
                <>
                  <span className="mx-2 text-gray-300">|</span> 
                  {currentProject.project_number}
                </>
              )}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
            <X className="h-6 w-6" />
          </Button>
        </DialogHeader>

        {/* 업무 구분 선택 (항상 표시) */}
        <div className="px-8 py-5 bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100 shrink-0">
          <Label className="text-sm font-semibold text-gray-700 mb-3 block">업무 구분</Label>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(CATEGORY_INFO).map(([key, info]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleCategoryChange(key)}
                className={`
                  relative p-4 rounded-xl border-2 transition-all duration-200 text-left
                  ${currentProject.category === key 
                    ? `border-transparent bg-gradient-to-br ${info.color} text-white shadow-lg scale-[1.02]` 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }
                `}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${currentProject.category === key ? 'bg-white/20' : 'bg-gray-100'}`}>
                    <span className={currentProject.category === key ? 'text-white' : 'text-gray-600'}>
                      {info.icon}
                    </span>
                  </div>
                  <span className="font-bold">{info.label}</span>
                </div>
                <p className={`text-xs ${currentProject.category === key ? 'text-white/80' : 'text-gray-500'}`}>
                  {info.description}
                </p>
                {currentProject.category === key && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-white rounded-full shadow-md" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content with Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-8 pt-5 pb-2 shrink-0 bg-white">
            <TabsList className={`grid w-full h-14 p-1.5 bg-slate-100/80 rounded-2xl`} style={{ gridTemplateColumns: `repeat(${availableTabs.length}, 1fr)` }}>
              {availableTabs.map(tab => (
                <TabsTrigger 
                  key={tab}
                  value={tab}
                  className="rounded-xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm font-medium transition-all text-gray-500 hover:text-gray-900"
                >
                  {tabNames[tab]}
                </TabsTrigger>
              ))}
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
                      placeholder="프로젝트명을 입력하세요"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project_number" className="text-gray-600 font-medium">프로젝트 번호</Label>
                    <Input 
                      id="project_number" 
                      value={currentProject.project_number || ''} 
                      onChange={handleChange} 
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all"
                      placeholder="예: CNCUWL-2501"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="base_name" className="text-gray-600 font-medium">기지명</Label>
                    <Input 
                      id="base_name" 
                      value={currentProject.base_name || ''} 
                      onChange={handleChange}
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all"
                      placeholder="기지명을 입력하세요"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_name" className="text-gray-600 font-medium">고객사명</Label>
                    <Input 
                      id="client_name" 
                      value={currentProject.client_name || ''} 
                      onChange={handleChange}
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all"
                      placeholder="고객사명을 입력하세요"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client_contact" className="text-gray-600 font-medium">고객사 연락처</Label>
                    <Input 
                      id="client_contact" 
                      value={currentProject.client_contact || ''} 
                      onChange={handleChange}
                      className="h-12 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl transition-all"
                      placeholder="연락처를 입력하세요"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ProjectStatus" className="text-gray-600 font-medium">프로젝트 상태</Label>
                    <Select value={currentProject.ProjectStatus || 'Manufacturing'} onValueChange={(value) => handleChange({ target: { id: 'ProjectStatus', value } } as any)}>
                      <SelectTrigger className="h-12 border-gray-200 focus:ring-4 focus:ring-blue-500/10 rounded-xl">
                        <SelectValue placeholder="상태 선택" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="Manufacturing">제작중</SelectItem>
                        <SelectItem value="Demolished">철거</SelectItem>
                        <SelectItem value="Warranty">하자보증중</SelectItem>
                        <SelectItem value="WarrantyComplete">하자보증완료</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {currentProject.category === 'project' && (
                    <div className="flex items-center space-x-3 pt-8">
                      <Switch
                        id="has_disk"
                        checked={currentProject.has_disk || false}
                        onCheckedChange={(checked) => handleSwitchChange('has_disk', checked)}
                      />
                      <Label htmlFor="has_disk" className="text-gray-700 font-medium cursor-pointer">디스크브레이크 포함</Label>
                    </div>
                  )}
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

            {availableTabs.includes('hardware') && (
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
                        <SelectContent className="bg-white">
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
            )}

            {availableTabs.includes('power') && (
              <TabsContent value="power" className="mt-0 space-y-8 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                <section className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                    <div className="h-8 w-1 bg-amber-500 rounded-full" />
                    <h3 className="text-lg font-bold text-gray-800">인입전원 사양</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="incoming_power" className="text-gray-600 font-medium">전압 (V)</Label>
                      <Input 
                        id="incoming_power" 
                        value={currentProject.incoming_power || ''} 
                        onChange={handleChange}
                        className="h-11 border-gray-200"
                        placeholder="예: 380V"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="primary_breaker" className="text-gray-600 font-medium">메인 차단기 (A)</Label>
                      <Input 
                        id="primary_breaker" 
                        value={currentProject.primary_breaker || ''} 
                        onChange={handleChange}
                        className="h-11 border-gray-200"
                        placeholder="예: 400A"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pvr_ampere" className="text-gray-600 font-medium">정격 전류 (A)</Label>
                      <Input 
                        id="pvr_ampere" 
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
                      <Label htmlFor="frequency" className="text-gray-600 font-medium">주파수 (Hz)</Label>
                      <Input 
                        id="frequency" 
                        type="number" 
                        value={currentProject.frequency || 0} 
                        onChange={handleChange}
                        className="h-11 border-gray-200"
                        placeholder="예: 60"
                      />
                    </div>
                  </div>
                </section>
              </TabsContent>
            )}

            {availableTabs.includes('motor') && (
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
            )}

            {availableTabs.includes('option') && (
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
                        onCheckedChange={(checked) => setCurrentProject(prev => ({...prev, cctv_spec: checked ? 'enabled' : ''}))}
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
            )}
          </div>
        </Tabs>

        {/* Footer */}
        <DialogFooter className="px-8 py-5 border-t border-gray-100 bg-gray-50/50 shrink-0">
          <div className="flex justify-between w-full items-center">
            <div>
              {onDelete && currentProject.id > 0 && (
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
  )
}
