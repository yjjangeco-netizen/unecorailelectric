'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

interface MotorSpecModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (motor: MotorSpec) => void
  motor?: MotorSpec | null
  projectId: string
}

const MOTOR_SPECS = {
  spindle: {
    name: '스핀들',
    powerOptions: [
      { value: 37, label: '37kW' },
    ],
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

// 전류 계산 함수 (상과 극에 따라)
const calculateCurrent = (powerKw: number, voltage: string, phase: string, pole: string): number => {
  const voltageNum = parseFloat(voltage.replace('V', ''))
  const power = powerKw * 1000 // kW to W

  if (phase === '1상') {
    // 단상: P = V × I × cosφ
    return Math.round((power / (voltageNum * 0.8)) * 100) / 100 // 0.8 power factor
  } else {
    // 3상: P = √3 × V × I × cosφ
    return Math.round((power / (voltageNum * Math.sqrt(3) * 0.8)) * 100) / 100 // 0.8 power factor
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

export default function MotorSpecModal({ isOpen, onClose, onSave, motor, projectId }: MotorSpecModalProps) {
  const [formData, setFormData] = useState<MotorSpec>({
    motor_type: 'spindle',
    motor_name: '',
    power_kw: 0,
    voltage: '220V',
    phase: '3상',
    pole: '4P',
    quantity: 1,
    current_amp: 0,
    breaker_size: '',
    cable_size: '',
    eocr_setting: '',
    breaker_setting: ''
  })

  const [isCustomPower, setIsCustomPower] = useState(false)

  useEffect(() => {
    if (motor) {
      setFormData(motor)
      setIsCustomPower(!MOTOR_SPECS[motor.motor_type as keyof typeof MOTOR_SPECS]?.powerOptions.some(opt => opt.value === motor.power_kw))
    } else {
      setFormData({
        motor_type: 'spindle',
        motor_name: '',
        power_kw: 0,
        voltage: '220V',
        quantity: 1,
        phase: '3상',
        pole: '4P',
        current_amp: 0,
        breaker_size: '',
        cable_size: ''
      })
      setIsCustomPower(false)
    }
  }, [motor, isOpen])

  useEffect(() => {
    if (formData.power_kw > 0 && formData.voltage && formData.phase) {
      const current = calculateCurrent(formData.power_kw, formData.voltage, formData.phase, formData.pole)
      const breakerSize = getBreakerSize(current)
      const cableSize = getCableSize(current)
      const eocrSetting = getEOCRSetting(current)
      const breakerSetting = getBreakerSetting(current)

      setFormData(prev => ({
        ...prev,
        current_amp: current,
        breaker_size: breakerSize,
        cable_size: cableSize,
        eocr_setting: eocrSetting,
        breaker_setting: breakerSetting
      }))
    }
  }, [formData.power_kw, formData.voltage, formData.phase, formData.pole])

  const handleMotorTypeChange = (type: string) => {
    const spec = MOTOR_SPECS[type as keyof typeof MOTOR_SPECS]
    setFormData(prev => ({
      ...prev,
      motor_type: type,
      motor_name: spec.name,
      power_kw: spec.powerOptions[0]?.value || 0,
      voltage: spec.voltageOptions[0] || '220V',
      quantity: spec.defaultQuantity
    }))
    setIsCustomPower(false)
  }

  const handlePowerChange = (power: number) => {
    setFormData(prev => ({
      ...prev,
      power_kw: power
    }))
  }

  const handleCustomPowerChange = (value: string) => {
    const power = parseFloat(value) || 0
    setFormData(prev => ({
      ...prev,
      power_kw: power
    }))
  }

  const handleSave = () => {
    if (!formData.motor_name || formData.power_kw <= 0) {
      alert('모터명과 출력을 입력해주세요.')
      return
    }
    onSave(formData)
    onClose()
  }

  const currentSpec = MOTOR_SPECS[formData.motor_type as keyof typeof MOTOR_SPECS]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>모터 사양 {motor ? '수정' : '추가'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="motor_type">모터 유형</Label>
              <Select value={formData.motor_type} onValueChange={handleMotorTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="모터 유형 선택" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MOTOR_SPECS).map(([key, spec]) => (
                    <SelectItem key={key} value={key}>
                      {spec.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="motor_name">모터명</Label>
              <Input
                id="motor_name"
                value={formData.motor_name}
                onChange={(e) => setFormData(prev => ({ ...prev, motor_name: e.target.value }))}
                placeholder="모터명 입력"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="power">출력 (kW)</Label>
              {currentSpec.powerOptions.length > 0 && !isCustomPower ? (
                <Select value={formData.power_kw.toString()} onValueChange={(value) => handlePowerChange(parseFloat(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="출력 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentSpec.powerOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">직접 입력</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.power_kw || ''}
                    onChange={(e) => handleCustomPowerChange(e.target.value)}
                    placeholder="출력 입력"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCustomPower(false)}
                  >
                    선택
                  </Button>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="voltage">전압</Label>
              <Select value={formData.voltage} onValueChange={(value) => setFormData(prev => ({ ...prev, voltage: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="전압 선택" />
                </SelectTrigger>
                <SelectContent>
                  {currentSpec.voltageOptions.map((voltage) => (
                    <SelectItem key={voltage} value={voltage}>
                      {voltage}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phase">상</Label>
              <Select value={formData.phase} onValueChange={(value) => setFormData(prev => ({ ...prev, phase: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="상 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1상">1상</SelectItem>
                  <SelectItem value="3상">3상</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pole">극</Label>
              <Select value={formData.pole} onValueChange={(value) => setFormData(prev => ({ ...prev, pole: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="극 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2P">2P</SelectItem>
                  <SelectItem value="4P">4P</SelectItem>
                  <SelectItem value="6P">6P</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity">수량</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              />
            </div>

            <div>
              <Label htmlFor="current">전류 (A)</Label>
              <Input
                id="current"
                value={formData.current_amp || ''}
                readOnly
                className="bg-gray-100"
              />
            </div>

            <div>
              <Label htmlFor="total_power">총 용량 (kW)</Label>
              <Input
                id="total_power"
                value={(formData.power_kw * formData.quantity).toFixed(2)}
                readOnly
                className="bg-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="breaker">차단기</Label>
              <Input
                id="breaker"
                value={formData.breaker_size || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, breaker_size: e.target.value }))}
                placeholder="차단기 크기"
              />
            </div>

            <div>
              <Label htmlFor="cable">케이블</Label>
              <Input
                id="cable"
                value={formData.cable_size || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, cable_size: e.target.value }))}
                placeholder="케이블 크기"
              />
            </div>

            <div>
              <Label htmlFor="eocr_setting">EOCR 설정</Label>
              <Input
                id="eocr_setting"
                value={formData.eocr_setting || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, eocr_setting: e.target.value }))}
                placeholder="EOCR 설정값"
              />
            </div>

            <div>
              <Label htmlFor="breaker_setting">차단기 설정</Label>
              <Input
                id="breaker_setting"
                value={formData.breaker_setting || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, breaker_setting: e.target.value }))}
                placeholder="차단기 설정값"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave}>
            {motor ? '수정' : '추가'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
