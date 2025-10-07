'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

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
  selected: boolean
}

interface BulkMotorAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (motors: MotorSpec[]) => void
  projectId: string
}

const MOTOR_SPECS = {
  spindle: {
    name: '스핀들',
    powerOptions: [{ value: 37, label: '37kW' }],
    voltageOptions: ['220V', '400V'],
    defaultQuantity: 4
  },
  tool_post: {
    name: '공구대',
    powerOptions: [
      { value: 2.92, label: '2.92kW' },
      { value: 4.66, label: '4.66kW' },
    ],
    voltageOptions: ['220V', '400V'],
    defaultQuantity: 4
  },
  pump_low: {
    name: '저압펌프',
    powerOptions: [
      { value: 22, label: '22kW' },
      { value: 11, label: '11kW' },
    ],
    voltageOptions: ['380V', '220V'],
    defaultQuantity: 1
  },
  pump_high: {
    name: '고압펌프',
    powerOptions: [
      { value: 3.7, label: '3.7kW' },
    ],
    voltageOptions: ['380V', '220V'],
    defaultQuantity: 1
  },
  crusher: {
    name: '크러셔',
    powerOptions: [
      { value: 11, label: '11kW' },
      { value: 7.5, label: '7.5kW' },
    ],
    voltageOptions: ['380V', '220V'],
    defaultQuantity: 1
  },
  dust_collector: {
    name: '집진기',
    powerOptions: [
      { value: 3.7, label: '3.7kW' },
      { value: 5.5, label: '5.5kW' },
    ],
    voltageOptions: ['380V', '220V'],
    defaultQuantity: 1
  },
  vehicle_transfer: {
    name: '차량이송장치',
    powerOptions: [
      { value: 5.5, label: '5.5kW' },
    ],
    voltageOptions: ['380V', '220V'],
    defaultQuantity: 1
  },
  cooling_fan: {
    name: '냉각팬',
    powerOptions: [
      { value: 0.75, label: '0.75kW' },
    ],
    voltageOptions: ['380V', '220V'],
    defaultQuantity: 1
  },
  lubrication: {
    name: '윤활장치',
    powerOptions: [
      { value: 0.57, label: '0.57kW' },
    ],
    voltageOptions: ['220V', '24V'],
    defaultQuantity: 1
  },
  grease: {
    name: '그리스장치',
    powerOptions: [
      { value: 0.57, label: '0.57kW' },
    ],
    voltageOptions: ['220V', '24V'],
    defaultQuantity: 1
  },
  special: {
    name: '특수사양',
    powerOptions: [],
    voltageOptions: ['220V', '380V', '400V', '24V'],
    defaultQuantity: 1
  }
}

// 전류 계산 함수
const calculateCurrent = (powerKw: number, voltage: string, phase: string): number => {
  const voltageNum = parseFloat(voltage.replace('V', ''))
  const power = powerKw * 1000 // kW to W
  
  if (phase === '1상') {
    return Math.round((power / (voltageNum * 0.8)) * 100) / 100
  } else {
    return Math.round((power / (voltageNum * Math.sqrt(3) * 0.8)) * 100) / 100
  }
}

// 차단기 크기 선택
const getBreakerSize = (current: number): string => {
  if (current <= 10) return '10A'
  if (current <= 16) return '16A'
  if (current <= 20) return '20A'
  if (current <= 25) return '25A'
  if (current <= 32) return '32A'
  if (current <= 40) return '40A'
  if (current <= 50) return '50A'
  if (current <= 63) return '63A'
  if (current <= 80) return '80A'
  if (current <= 100) return '100A'
  if (current <= 125) return '125A'
  if (current <= 160) return '160A'
  if (current <= 200) return '200A'
  if (current <= 250) return '250A'
  if (current <= 315) return '315A'
  if (current <= 400) return '400A'
  return '500A'
}

// 케이블 크기 선택
const getCableSize = (current: number): string => {
  if (current <= 10) return '2.5mm²'
  if (current <= 16) return '4mm²'
  if (current <= 20) return '6mm²'
  if (current <= 25) return '10mm²'
  if (current <= 32) return '16mm²'
  if (current <= 40) return '25mm²'
  if (current <= 50) return '35mm²'
  if (current <= 63) return '50mm²'
  if (current <= 80) return '70mm²'
  if (current <= 100) return '95mm²'
  if (current <= 125) return '120mm²'
  if (current <= 160) return '150mm²'
  if (current <= 200) return '185mm²'
  if (current <= 250) return '240mm²'
  if (current <= 315) return '300mm²'
  if (current <= 400) return '400mm²'
  return '500mm²'
}

// EOCR 설정값 계산
const getEOCRSetting = (current: number): string => {
  const setting = Math.round(current * 1.2) // 120% 설정
  return `${setting}A`
}

// 차단기 설정값 계산
const getBreakerSetting = (current: number): string => {
  const setting = Math.round(current * 1.25) // 125% 설정
  return `${setting}A`
}

export default function BulkMotorAddModal({ isOpen, onClose, onSave, projectId }: BulkMotorAddModalProps) {
  const [motors, setMotors] = useState<MotorSpec[]>([])

  useEffect(() => {
    if (isOpen) {
      // 모든 모터 타입에 대해 초기 데이터 생성
      const initialMotors: MotorSpec[] = Object.entries(MOTOR_SPECS).map(([type, spec]) => ({
        motor_type: type,
        motor_name: spec.name,
        power_kw: spec.powerOptions[0]?.value || 0,
        voltage: spec.voltageOptions[0] || '220V',
        phase: '3상',
        pole: '4P',
        quantity: spec.defaultQuantity,
        current_amp: 0,
        breaker_size: '',
        cable_size: '',
        eocr_setting: '',
        breaker_setting: '',
        selected: false
      }))
      setMotors(initialMotors)
    }
  }, [isOpen])

  // 전류 및 기타 값 계산
  useEffect(() => {
    setMotors(prevMotors => 
      prevMotors.map(motor => {
        if (motor.power_kw > 0 && motor.voltage && motor.phase) {
          const current = calculateCurrent(motor.power_kw, motor.voltage, motor.phase)
          const breakerSize = getBreakerSize(current)
          const cableSize = getCableSize(current)
          const eocrSetting = getEOCRSetting(current)
          const breakerSetting = getBreakerSetting(current)
          
          return {
            ...motor,
            current_amp: current,
            breaker_size: breakerSize,
            cable_size: cableSize,
            eocr_setting: eocrSetting,
            breaker_setting: breakerSetting
          }
        }
        return motor
      })
    )
  }, [motors])

  const handleMotorChange = (index: number, field: keyof MotorSpec, value: any) => {
    setMotors(prevMotors => 
      prevMotors.map((motor, i) => 
        i === index ? { ...motor, [field]: value } : motor
      )
    )
  }

  const handleSelectAll = (selected: boolean) => {
    setMotors(prevMotors => 
      prevMotors.map(motor => ({ ...motor, selected }))
    )
  }

  const handleSave = () => {
    const selectedMotors = motors.filter(motor => motor.selected)
    if (selectedMotors.length === 0) {
      alert('추가할 모터를 선택해주세요.')
      return
    }
    onSave(selectedMotors)
    onClose()
  }

  const selectedCount = motors.filter(motor => motor.selected).length

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>모터 대량 추가</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="selectAll"
                checked={selectedCount === motors.length && motors.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <Label htmlFor="selectAll">전체 선택</Label>
            </div>
            <div className="text-sm text-gray-600">
              {selectedCount}개 모터 선택됨
            </div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">선택</TableHead>
                  <TableHead className="w-32">모터명</TableHead>
                  <TableHead className="w-24">전압</TableHead>
                  <TableHead className="w-20">극</TableHead>
                  <TableHead className="w-20">상</TableHead>
                  <TableHead className="w-24">용량</TableHead>
                  <TableHead className="w-20">수량</TableHead>
                  <TableHead className="w-20">전류</TableHead>
                  <TableHead className="w-24">차단기</TableHead>
                  <TableHead className="w-24">케이블</TableHead>
                  <TableHead className="w-20">EOCR</TableHead>
                  <TableHead className="w-24">차단기설정</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {motors.map((motor, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Checkbox
                        checked={motor.selected}
                        onCheckedChange={(checked) => 
                          handleMotorChange(index, 'selected', checked)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{motor.motor_name}</div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={motor.voltage}
                        onValueChange={(value) => 
                          handleMotorChange(index, 'voltage', value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MOTOR_SPECS[motor.motor_type as keyof typeof MOTOR_SPECS]?.voltageOptions.map((voltage) => (
                            <SelectItem key={voltage} value={voltage}>
                              {voltage}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={motor.pole}
                        onValueChange={(value) => 
                          handleMotorChange(index, 'pole', value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2P">2P</SelectItem>
                          <SelectItem value="4P">4P</SelectItem>
                          <SelectItem value="6P">6P</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={motor.phase}
                        onValueChange={(value) => 
                          handleMotorChange(index, 'phase', value)
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1상">1상</SelectItem>
                          <SelectItem value="3상">3상</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={motor.power_kw.toString()}
                        onValueChange={(value) => 
                          handleMotorChange(index, 'power_kw', parseFloat(value))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MOTOR_SPECS[motor.motor_type as keyof typeof MOTOR_SPECS]?.powerOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={motor.quantity}
                        onChange={(e) => 
                          handleMotorChange(index, 'quantity', parseInt(e.target.value) || 1)
                        }
                        className="w-full"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {motor.current_amp?.toFixed(2)}A
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{motor.breaker_size}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{motor.cable_size}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{motor.eocr_setting}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{motor.breaker_setting}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* 총계 표시 */}
          {selectedCount > 0 && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">선택된 모터 총계</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {Object.entries(
                  motors
                    .filter(motor => motor.selected)
                    .reduce((acc, motor) => {
                      const key = `${motor.voltage}-${motor.phase}`
                      if (!acc[key]) {
                        acc[key] = { power: 0, current: 0, count: 0 }
                      }
                      acc[key].power += motor.power_kw * motor.quantity
                      acc[key].current += (motor.current_amp || 0) * motor.quantity
                      acc[key].count += motor.quantity
                      return acc
                    }, {} as Record<string, { power: number; current: number; count: number }>)
                ).map(([key, totals]) => (
                  <div key={key} className="border rounded p-2">
                    <div className="font-medium">{key}</div>
                    <div>총 용량: {totals.power.toFixed(2)}kW</div>
                    <div>총 전류: {totals.current.toFixed(2)}A</div>
                    <div>총 수량: {totals.count}개</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave} disabled={selectedCount === 0}>
            {selectedCount}개 모터 추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
