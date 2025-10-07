'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Project } from '@/lib/types'
import { X, Save, Settings, Zap, Cpu, Palette, CheckSquare, Plus, Trash2, Edit2, FileText } from 'lucide-react'
import MotorSpecModal from './MotorSpecModal'
import BulkMotorAddModal from './BulkMotorAddModal'
import SpecificationGenerator from './SpecificationGenerator'

interface ProjectDetailModalProps {
  project: Project | null
  isOpen: boolean
  onClose: () => void
  onSave: (project: Project) => void
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

export default function ProjectDetailModal({ project, isOpen, onClose, onSave }: ProjectDetailModalProps) {
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

  useEffect(() => {
    setCurrentProject(project)
    setActiveTab('basic')
    setMotors([])
    setCctvLocations([])
    setAdditionalOptions([])
    
    // 프로젝트가 있으면 모터 사양 로드
    if (project?.id) {
      loadMotorSpecs(project.id)
    }
  }, [project])

  // 모터 사양 로드
  const loadMotorSpecs = async (projectId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/motors`)
      if (response.ok) {
        const motorData = await response.json()
        setMotors(motorData)
        calculateTotals(motorData)
      }
    } catch (error) {
      console.error('모터 사양 로드 실패:', error)
    }
  }

  // 총 용량 및 전류 계산
  const calculateTotals = (motorList: MotorSpec[]) => {
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
  }

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
        await loadMotorSpecs(currentProject.id)
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
        await loadMotorSpecs(currentProject.id)
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
        await loadMotorSpecs(currentProject.id)
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

  if (!currentProject) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            프로젝트 상세 정보: {currentProject.name || '새 프로젝트'} ({currentProject.project_number || '미지정'})
          </DialogTitle>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">기본정보</TabsTrigger>
            <TabsTrigger value="hardware">하드웨어정보</TabsTrigger>
            <TabsTrigger value="power">전원사양</TabsTrigger>
            <TabsTrigger value="motor">모터사양</TabsTrigger>
            <TabsTrigger value="option">옵션사양</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="mt-4 space-y-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">기본 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">프로젝트명</Label>
                    <Input id="name" value={currentProject.name || ''} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="base_name">기지명</Label>
                    <Input id="base_name" value={currentProject.base_name || ''} onChange={handleChange} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="has_disk"
                      checked={currentProject.has_disk || false}
                      onCheckedChange={(checked) => handleSwitchChange('has_disk', checked)}
                    />
                    <Label htmlFor="has_disk">디스크브레이크 여부</Label>
                  </div>
                  <div>
                    <Label htmlFor="status">프로젝트 상태</Label>
                    <Select value={currentProject.status} onValueChange={(value) => handleChange({ target: { id: 'status', value } })}>
                      <SelectTrigger>
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
                  <div>
                    <Label htmlFor="client_name">고객사명</Label>
                    <Input id="client_name" value={currentProject.client_name || ''} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="client_contact">고객사 연락처</Label>
                    <Input id="client_contact" value={currentProject.client_contact || ''} onChange={handleChange} />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">일정 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="assembly_date">조립완료일</Label>
                    <Input id="assembly_date" type="date" value={currentProject.assembly_date || ''} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="factory_test_date">공장시운전일</Label>
                    <Input id="factory_test_date" type="date" value={currentProject.factory_test_date || ''} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="site_test_date">현장시운전일</Label>
                    <Input id="site_test_date" type="date" value={currentProject.site_test_date || ''} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="completion_date">준공완료일</Label>
                    <Input id="completion_date" type="date" value={currentProject.completion_date || ''} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="warranty_period">하자보증기간</Label>
                    <Input id="warranty_period" value={currentProject.warranty_period || ''} onChange={handleChange} placeholder="예: 1년, 2년" />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hardware" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="hardware_type">하드웨어 사양정보</Label>
                <Select value={hardwareType} onValueChange={setHardwareType}>
                  <SelectTrigger>
                    <SelectValue placeholder="하드웨어 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="siemens">지멘스</SelectItem>
                    <SelectItem value="fanuc">화낙</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="hardware_version">하드웨어 버전</Label>
                <Input id="hardware_version" value={currentProject.hardware_version || ''} onChange={handleChange} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="power" className="mt-4 space-y-4">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">인입전원 사양</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="incoming_voltage">전압</Label>
                    <Input id="incoming_voltage" value={currentProject.incoming_power || ''} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="primary_breaker">차단기</Label>
                    <Input id="primary_breaker" value={currentProject.primary_breaker || ''} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="incoming_current">전류</Label>
                    <Input id="incoming_current" type="number" value={currentProject.pvr_ampere || 0} onChange={handleChange} />
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">PVR 사양</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primary_power">1차전원</Label>
                    <Input id="primary_power" value={currentProject.incoming_power || ''} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="secondary_power">2차전원</Label>
                    <Select value={hardwareType} onValueChange={(value) => {
                      setHardwareType(value)
                      const voltage = value === 'siemens' ? '400V' : '200V'
                      setCurrentProject(prev => prev ? {...prev, hardware_version: value} : null)
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="하드웨어에 따라 자동 설정" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="siemens">지멘스 (400V)</SelectItem>
                        <SelectItem value="fanuc">화낙 (200V)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="secondary_breaker">2차 차단기 전류</Label>
                    <Input id="secondary_breaker" type="number" value={currentProject.pvr_ampere || 0} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="tertiary_breaker">3차 차단기 전류</Label>
                    <Input id="tertiary_breaker" type="number" value={currentProject.frequency || 0} onChange={handleChange} />
                  </div>
                  <div>
                    <Label htmlFor="frequency">주파수</Label>
                    <Input id="frequency" type="number" value={currentProject.frequency || 0} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="motor" className="mt-4 space-y-4">
            <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">모터 사양</h3>
                        <div className="flex gap-2">
                          <Button onClick={() => setShowSpecGenerator(true)} size="sm" variant="secondary">
                            <FileText className="h-4 w-4 mr-2" />
                            사양서 출력
                          </Button>
                          <Button onClick={handleBulkAddMotor} size="sm" variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            대량 추가
                          </Button>
                          <Button onClick={handleAddMotor} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            개별 추가
                          </Button>
                        </div>
                      </div>
              
              {/* 모터 목록 */}
              <div className="space-y-4">
                {motors.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    등록된 모터가 없습니다. 모터 추가 버튼을 클릭하여 모터를 추가하세요.
                  </div>
                ) : (
                  motors.map((motor) => (
                    <div key={motor.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium text-lg">{motor.motor_name}</h4>
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => handleEditMotor(motor)} 
                            variant="outline" 
                            size="sm"
                          >
                            <Edit2 className="h-4 w-4 mr-1" />
                            수정
                          </Button>
                          <Button 
                            onClick={() => handleDeleteMotor(motor.id!)} 
                            variant="outline" 
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">출력:</span>
                          <span className="ml-2">{motor.power_kw}kW</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">전압:</span>
                          <span className="ml-2">{motor.voltage}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">상:</span>
                          <span className="ml-2">{motor.phase}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">극:</span>
                          <span className="ml-2">{motor.pole}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">수량:</span>
                          <span className="ml-2">{motor.quantity}개</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">전류:</span>
                          <span className="ml-2">{motor.current_amp}A</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">차단기:</span>
                          <span className="ml-2">{motor.breaker_size}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">케이블:</span>
                          <span className="ml-2">{motor.cable_size}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">EOCR:</span>
                          <span className="ml-2">{motor.eocr_setting || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">차단기설정:</span>
                          <span className="ml-2">{motor.breaker_setting || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">총 용량:</span>
                          <span className="ml-2 font-semibold text-blue-600">
                            {(motor.power_kw * motor.quantity).toFixed(2)}kW
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">총 전류:</span>
                          <span className="ml-2 font-semibold text-blue-600">
                            {((motor.current_amp || 0) * motor.quantity).toFixed(2)}A
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 전압별 총계 */}
              {Object.keys(totalPower).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">전압별 총계</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(totalPower).map(([voltage, power]) => (
                      <div key={voltage} className="border rounded-lg p-4 bg-gray-50">
                        <h4 className="font-medium text-lg mb-2">{voltage} 전압</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>총 용량:</span>
                            <span className="font-semibold text-blue-600">{power.toFixed(2)}kW</span>
                          </div>
                          <div className="flex justify-between">
                            <span>총 전류:</span>
                            <span className="font-semibold text-blue-600">
                              {totalCurrent[voltage]?.toFixed(2) || 0}A
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="option" className="mt-4 space-y-4">
            <div className="space-y-6">
              {/* CCTV */}
              <div>
                <h3 className="text-lg font-semibold mb-4">CCTV</h3>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox 
                    id="cctv_enabled"
                    checked={currentProject.cctv_spec ? true : false}
                    onCheckedChange={(checked) => setCurrentProject(prev => prev ? {...prev, cctv_spec: checked ? 'enabled' : ''} : null)}
                  />
                  <Label htmlFor="cctv_enabled">CCTV 있음</Label>
                </div>
                
                {currentProject.cctv_spec && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>공구대 2곳</Label>
                        <Checkbox />
                      </div>
                      <div>
                        <Label>칩컨베이어</Label>
                        <Checkbox />
                      </div>
                      <div>
                        <Label>크러셔</Label>
                        <Checkbox />
                      </div>
                      <div>
                        <Label>기타</Label>
                        <Checkbox />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>CCTV 설치 위치</Label>
                      {cctvLocations.map((location) => (
                        <div key={location.id} className="flex gap-2">
                          <Input 
                            value={location.location} 
                            onChange={(e) => handleCctvLocationChange(location.id, e.target.value)}
                            placeholder="설치 위치 입력"
                          />
                          <Button onClick={() => removeCctvLocation(location.id)} variant="outline" size="sm">
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button onClick={addCctvLocation} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        위치 추가
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* 경광등 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">경광등</h3>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox 
                    id="warning_light_enabled"
                    checked={currentProject.warning_light || false}
                    onCheckedChange={(checked) => handleSwitchChange('warning_light', checked as boolean)}
                  />
                  <Label htmlFor="warning_light_enabled">경광등 있음</Label>
                </div>
                
                {currentProject.warning_light && (
                  <div>
                    <Label htmlFor="warning_light_location">설치 위치</Label>
                    <Input id="warning_light_location" placeholder="경광등 설치 위치 입력" />
                  </div>
                )}
              </div>

              {/* 부저 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">부저</h3>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox 
                    id="buzzer_enabled"
                    checked={currentProject.buzzer || false}
                    onCheckedChange={(checked) => handleSwitchChange('buzzer', checked as boolean)}
                  />
                  <Label htmlFor="buzzer_enabled">부저 있음</Label>
                </div>
                
                {currentProject.buzzer && (
                  <div>
                    <Label htmlFor="buzzer_location">설치 위치</Label>
                    <Input id="buzzer_location" placeholder="부저 설치 위치 입력" />
                  </div>
                )}
              </div>

              {/* 스피커 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">스피커</h3>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox 
                    id="speaker_enabled"
                    checked={currentProject.speaker || false}
                    onCheckedChange={(checked) => handleSwitchChange('speaker', checked as boolean)}
                  />
                  <Label htmlFor="speaker_enabled">스피커 있음</Label>
                </div>
                
                {currentProject.speaker && (
                  <div>
                    <Label htmlFor="speaker_location">설치 위치</Label>
                    <Input id="speaker_location" placeholder="스피커 설치 위치 입력" />
                  </div>
                )}
              </div>

              {/* 자동레일 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">자동레일</h3>
                <div className="flex items-center space-x-2 mb-4">
                  <Checkbox 
                    id="automatic_rail_enabled"
                    checked={currentProject.automatic_rail || false}
                    onCheckedChange={(checked) => handleSwitchChange('automatic_rail', checked as boolean)}
                  />
                  <Label htmlFor="automatic_rail_enabled">자동레일 있음</Label>
                </div>
              </div>

              {/* 추가사항 */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">추가사항</h3>
                  <Button onClick={addAdditionalOption} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    추가사항
                  </Button>
                </div>
                
                {additionalOptions.map((option) => (
                  <div key={option.id} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">추가 옵션</h4>
                      <Button onClick={() => removeAdditionalOption(option.id)} variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>옵션명</Label>
                        <Input 
                          value={option.name} 
                          onChange={(e) => handleAdditionalOptionChange(option.id, 'name', e.target.value)}
                          placeholder="옵션명 입력"
                        />
                      </div>
                      <div>
                        <Label>설치 위치</Label>
                        <Input 
                          value={option.location} 
                          onChange={(e) => handleAdditionalOptionChange(option.id, 'location', e.target.value)}
                          placeholder="설치 위치 입력"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSave}>저장</Button>
        </DialogFooter>
      </DialogContent>

              {/* 모터 사양 모달 */}
              <MotorSpecModal
                isOpen={showMotorModal}
                onClose={() => setShowMotorModal(false)}
                onSave={handleSaveMotor}
                motor={editingMotor}
                projectId={currentProject?.id || ''}
              />

              {/* 대량 모터 추가 모달 */}
              <BulkMotorAddModal
                isOpen={showBulkMotorModal}
                onClose={() => setShowBulkMotorModal(false)}
                onSave={handleBulkSaveMotor}
                projectId={currentProject?.id || ''}
              />

              {/* 사양서 생성기 모달 */}
              <SpecificationGenerator
                isOpen={showSpecGenerator}
                onClose={() => setShowSpecGenerator(false)}
                project={currentProject}
                motors={motors}
              />
            </Dialog>
          );
        }