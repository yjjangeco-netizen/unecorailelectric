'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, ChevronDown, Menu, Plus, X, Home, Package2, FileText, Calendar, Settings } from 'lucide-react'

// 한국 공휴일 (2026년 기준, 필요시 확장)
const HOLIDAYS: Record<string, string> = {
  '01-01': '신정', '03-01': '삼일절', '05-05': '어린이날',
  '06-06': '현충일', '08-15': '광복절', '10-03': '개천절',
  '10-09': '한글날', '12-25': '크리스마스',
  // 2026 음력 공휴일 (대략)
  '01-29': '설날', '01-30': '설날', '01-31': '설날',
  '05-24': '부처님오신날', '09-25': '추석', '09-26': '추석', '09-27': '추석',
}

const getHoliday = (date: Date) => {
  const key = format(date, 'MM-dd')
  return HOLIDAYS[key] || null
}

interface CalendarEvent {
  id: string
  title: string
  start: string | Date
  end?: string | Date
  backgroundColor?: string
  allDay?: boolean
  extendedProps?: any
}

interface MobileCalendarProps {
  events: CalendarEvent[]
  categoryFilters: { project: boolean; business_trip: boolean; leave: boolean; other: boolean }
  setCategoryFilters: React.Dispatch<React.SetStateAction<{ project: boolean; business_trip: boolean; leave: boolean; other: boolean }>>
  usersList: any[]
  onAddEvent: () => void
  onAddLeave: () => void
  onEventClick: (event: CalendarEvent) => void
  onDateClick: (date: Date) => void
  isLoading: boolean
  onRefresh: () => void
  userLevel?: string
}

export default function MobileCalendar({
  events, categoryFilters, setCategoryFilters, usersList,
  onAddEvent, onAddLeave, onEventClick, onDateClick, isLoading, onRefresh, userLevel
}: MobileCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showFilterDrawer, setShowFilterDrawer] = useState(false)
  const [showFabMenu, setShowFabMenu] = useState(false)
  const [showViewDropdown, setShowViewDropdown] = useState(false)
  const [showNavDrawer, setShowNavDrawer] = useState(false)
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [isHalfView, setIsHalfView] = useState(false)

  const prevMonth = () => {
    if (viewMode === 'week') setCurrentDate(prev => addDays(prev, -7))
    else if (viewMode === 'day') setCurrentDate(prev => addDays(prev, -1))
    else setCurrentDate(prev => subMonths(prev, 1))
  }
  const nextMonth = () => {
    if (viewMode === 'week') setCurrentDate(prev => addDays(prev, 7))
    else if (viewMode === 'day') setCurrentDate(prev => addDays(prev, 1))
    else setCurrentDate(prev => addMonths(prev, 1))
  }

  const generateMonthDays = (date: Date) => {
    const monthStart = startOfMonth(date)
    const monthEnd = endOfMonth(date)
    const start = startOfWeek(monthStart, { weekStartsOn: 0 })
    const end = endOfWeek(monthEnd, { weekStartsOn: 0 })
    const days: Date[] = []
    let d = start
    while (d <= end) { days.push(d); d = addDays(d, 1) }
    return days
  }

  const getFilteredEvents = useCallback(() => {
    return events.filter(event => {
      const t = event.extendedProps?.type || 'other'
      if (t === 'project' && !categoryFilters.project) return false
      if (t === 'business_trip' && !categoryFilters.business_trip) return false
      if (t === 'leave' && !categoryFilters.leave) return false
      if ((t === 'general' || t === 'other') && !categoryFilters.other) return false
      return true
    })
  }, [events, categoryFilters])

  const getEventsForDate = useCallback((date: Date) => {
    return getFilteredEvents().filter(event => {
      const es = typeof event.start === 'string' ? parseISO(event.start) : event.start
      const ee = event.end ? (typeof event.end === 'string' ? parseISO(event.end) : event.end) : es
      const target = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const s = new Date(es.getFullYear(), es.getMonth(), es.getDate())
      const e = new Date(ee.getFullYear(), ee.getMonth(), ee.getDate())
      return target >= s && target <= e
    })
  }, [getFilteredEvents])

  // 이벤트 바 슬롯 할당 (주 단위)
  const allocateSlots = useCallback((week: Date[]) => {
    const wStart = new Date(week[0].getFullYear(), week[0].getMonth(), week[0].getDate())
    const wEnd = new Date(week[6].getFullYear(), week[6].getMonth(), week[6].getDate())
    const DAY_MS = 86400000
    const filtered = getFilteredEvents()
    const weekEvents: { event: CalendarEvent; startDate: Date; endDate: Date }[] = []

    filtered.forEach(event => {
      const es = typeof event.start === 'string' ? parseISO(event.start) : event.start
      const ee = event.end ? (typeof event.end === 'string' ? parseISO(event.end) : event.end) : es
      const eStart = new Date(es.getFullYear(), es.getMonth(), es.getDate())
      const eEnd = new Date(ee.getFullYear(), ee.getMonth(), ee.getDate())
      if (eEnd >= wStart && eStart <= wEnd) weekEvents.push({ event, startDate: eStart, endDate: eEnd })
    })

    weekEvents.sort((a, b) => {
      const dA = a.endDate.getTime() - a.startDate.getTime()
      const dB = b.endDate.getTime() - b.startDate.getTime()
      if (dB !== dA) return dB - dA
      return a.startDate.getTime() - b.startDate.getTime()
    })

    const occ: boolean[][] = []
    const result: { event: CalendarEvent; slot: number; startCol: number; endCol: number; isStart: boolean; isEnd: boolean }[] = []

    weekEvents.forEach(({ event, startDate, endDate }) => {
      const vStart = startDate < wStart ? wStart : startDate
      const vEnd = endDate > wEnd ? wEnd : endDate
      const startCol = Math.round((vStart.getTime() - wStart.getTime()) / DAY_MS)
      const endCol = Math.round((vEnd.getTime() - wStart.getTime()) / DAY_MS)
      let slot = 0
      while (true) {
        if (!occ[slot]) occ[slot] = new Array(7).fill(false)
        let ok = true
        for (let c = startCol; c <= endCol; c++) { if (occ[slot][c]) { ok = false; break } }
        if (ok) break
        slot++
      }
      if (!occ[slot]) occ[slot] = new Array(7).fill(false)
      for (let c = startCol; c <= endCol; c++) occ[slot][c] = true
      result.push({ event, slot, startCol, endCol, isStart: startDate >= wStart, isEnd: endDate <= wEnd })
    })
    return result
  }, [getFilteredEvents])

  const viewModeLabel = viewMode === 'month' ? '월' : viewMode === 'week' ? '주' : '일'

  // 선택된 날짜의 일정 목록
  const selectedDayEvents = selectedDay ? getEventsForDate(selectedDay) : []

  // 현재 달의 모든 일정 (반 갈라지기 모드용)
  const currentMonthEvents = getFilteredEvents().filter(ev => {
    const es = typeof ev.start === 'string' ? parseISO(ev.start) : ev.start
    return es.getMonth() === currentDate.getMonth() && es.getFullYear() === currentDate.getFullYear()
  }).sort((a, b) => {
    const dA = typeof a.start === 'string' ? parseISO(a.start) : a.start
    const dB = typeof b.start === 'string' ? parseISO(b.start) : b.start
    return dA.getTime() - dB.getTime()
  })

  const days = generateMonthDays(currentDate)
  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))

  const MAX_SLOTS = isHalfView ? 2 : 3
  const SLOT_H = isHalfView ? 16 : 18
  const HEADER_H = isHalfView ? 22 : 28

  return (
    <div className="flex flex-col h-full bg-white" style={{ minHeight: '100dvh' }}>
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-30">
        <button onClick={() => setShowFilterDrawer(true)} className="p-1">
          <Menu className="w-5 h-5 text-gray-700" />
        </button>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1"><ChevronLeft className="w-5 h-5 text-gray-500" /></button>
          <h2 className="text-lg font-bold text-gray-900 mx-1">
            {format(currentDate, 'yyyy. M.', { locale: ko })}
          </h2>
          <button onClick={nextMonth} className="p-1"><ChevronRight className="w-5 h-5 text-gray-500" /></button>
          {/* 뷰 드롭다운 */}
          <div className="relative ml-1">
            <button onClick={() => setShowViewDropdown(!showViewDropdown)} className="flex items-center gap-0.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-md px-2 py-1">
              {viewModeLabel}<ChevronDown className="w-3 h-3" />
            </button>
            {showViewDropdown && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[80px]">
                {[{ k: 'month' as const, l: '월' }, { k: 'week' as const, l: '주' }, { k: 'day' as const, l: '일' }].map(v => (
                  <button key={v.k} onClick={() => { setViewMode(v.k); setShowViewDropdown(false) }}
                    className={`block w-full text-left px-4 py-2 text-sm ${viewMode === v.k ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}>
                    {v.l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => { setIsHalfView(!isHalfView); if (!isHalfView && !selectedDay) setSelectedDay(new Date()) }}
          className={`text-[12px] font-bold px-2.5 py-1 rounded-md transition-colors ${isHalfView ? 'bg-blue-100 text-blue-600' : 'text-gray-500 border border-gray-200'}`}
        >
          {isHalfView ? '닫기' : '내역'}
        </button>
      </div>

      {/* ── 요일 헤더 ── */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
          <div key={d} className={`text-center text-[12px] font-semibold py-2 ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'}`}>
            {d}
          </div>
        ))}
      </div>

      {/* ── 달력 본문 ── */}
      <div className={`${isHalfView ? '' : 'flex-1'} overflow-hidden`}>
        <div className="border-b border-gray-100">
          {weeks.map((week, wi) => {
            const slots = allocateSlots(week)
            const maxSlot = slots.length > 0 ? Math.max(...slots.map(s => s.slot)) : -1
            const visibleSlots = Math.min(maxSlot + 1, MAX_SLOTS)
            const rowH = HEADER_H + visibleSlots * SLOT_H + 8

            return (
              <div key={wi} className="grid grid-cols-7 relative border-b border-gray-50" style={{ minHeight: `${Math.max(rowH, isHalfView ? 48 : 90)}px` }}>
                {week.map((day, di) => {
                  const inMonth = isSameMonth(day, currentDate)
                  const today = isToday(day)
                  const holiday = getHoliday(day)
                  const isSelected = selectedDay && isSameDay(day, selectedDay)

                  return (
                    <div key={day.toISOString()}
                      onClick={() => { setSelectedDay(day); if (!isHalfView) setIsHalfView(true) }}
                      className={`border-r border-gray-50 pl-1 pt-1 cursor-pointer transition-colors
                        ${!inMonth ? 'opacity-30' : ''}
                        ${isSelected ? 'bg-blue-50/60' : ''}
                      `}
                      style={{ minHeight: `${Math.max(rowH, isHalfView ? 48 : 90)}px` }}
                    >
                      <div className="flex flex-col items-start">
                        <span className={`text-[13px] font-medium leading-none
                          ${!inMonth ? 'text-gray-400' :
                            holiday || di === 0 ? 'text-red-500' :
                            di === 6 ? 'text-blue-500' : 'text-gray-800'}
                          ${today ? 'bg-blue-500 !text-white rounded-full w-6 h-6 flex items-center justify-center text-[12px]' : ''}
                        `}>
                          {format(day, 'd')}
                        </span>
                        {holiday && inMonth && (
                          <span className="text-[8px] text-red-400 leading-tight mt-0.5 truncate max-w-[calc(100%-2px)]">{holiday}</span>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* 이벤트 바 오버레이 */}
                {slots.filter(s => s.slot < MAX_SLOTS).map(s => {
                  const rounded = s.isStart && s.isEnd ? 'rounded-full'
                    : s.isStart ? 'rounded-l-full'
                    : s.isEnd ? 'rounded-r-full' : ''

                  return (
                    <div key={`${s.event.id}-w${wi}`}
                      onClick={(e) => { e.stopPropagation(); onEventClick(s.event) }}
                      className={`absolute cursor-pointer text-[10px] text-white font-medium truncate leading-[16px] ${rounded}`}
                      style={{
                        top: `${HEADER_H + (isHalfView ? 2 : 0) + s.slot * SLOT_H}px`,
                        left: `calc(${(s.startCol / 7) * 100}% + 2px)`,
                        width: `calc(${((s.endCol - s.startCol + 1) / 7) * 100}% - 4px)`,
                        height: `${SLOT_H - 3}px`,
                        backgroundColor: s.event.backgroundColor || '#6B7280',
                        paddingLeft: '5px',
                        paddingRight: '3px',
                        zIndex: 10,
                      }}
                      title={s.event.title}
                    >
                      {s.isStart ? s.event.title : ''}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── 하단 일정 리스트 (내역보기 모드) ── */}
      {isHalfView && (
        <div className="flex-1 overflow-y-auto bg-white border-t border-gray-200">
          <div className="px-4 py-3 border-b border-gray-100 sticky top-0 bg-white z-10">
            <h3 className="text-sm font-bold text-gray-800">
              {format(currentDate, 'yyyy년 M월 일정', { locale: ko })}
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {currentMonthEvents.length === 0 ? (
              <div className="text-center py-10 text-sm text-gray-400">일정이 없습니다.</div>
            ) : (
              currentMonthEvents.map(event => {
                const es = typeof event.start === 'string' ? parseISO(event.start) : event.start
                const ee = event.end ? (typeof event.end === 'string' ? parseISO(event.end) : event.end) : null
                return (
                  <div key={event.id} className="flex items-start gap-3 px-4 py-3 active:bg-gray-50" onClick={() => onEventClick(event)}>
                    <div className="w-1 rounded-full mt-1" style={{ backgroundColor: event.backgroundColor || '#6B7280', minHeight: '36px' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {format(es, 'M/d(EEE)', { locale: ko })}
                        {ee && !isSameDay(es, ee) ? ` ~ ${format(ee, 'M/d(EEE)', { locale: ko })}` : ''}
                        {!event.allDay && ` ${format(es, 'HH:mm')}`}
                      </p>
                      {event.extendedProps?.participant && (
                        <p className="text-[11px] text-gray-400 mt-0.5">{event.extendedProps.participant}</p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* ── FAB (+) 버튼 ── */}
      <div className="fixed bottom-20 right-5 z-50">
        {showFabMenu && (
          <div className="absolute bottom-14 right-0 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden min-w-[160px]"
            style={{ animation: 'fadeInUp 0.15s ease' }}>
            <button onClick={() => { onAddLeave(); setShowFabMenu(false) }}
              className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 border-b border-gray-100">
              🏖️ 휴가/반차 신청
            </button>
            <button onClick={() => { onAddEvent(); setShowFabMenu(false) }}
              className="flex items-center gap-2 w-full px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50">
              📅 일정 추가
            </button>
          </div>
        )}
        <button onClick={() => setShowFabMenu(!showFabMenu)}
          className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all ${showFabMenu ? 'bg-gray-600 rotate-45' : 'bg-blue-600'}`}>
          <Plus className="w-7 h-7 text-white" />
        </button>
      </div>

      {/* ── 필터 서랍 (왼쪽 슬라이드) ── */}
      {showFilterDrawer && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60]" onClick={() => setShowFilterDrawer(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-72 bg-white z-[61] shadow-2xl overflow-y-auto"
            style={{ animation: 'slideInLeft 0.2s ease' }}>
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900">캘린더 필터</h3>
              <button onClick={() => setShowFilterDrawer(false)}><X className="w-5 h-5 text-gray-500" /></button>
            </div>
            <div className="p-4 space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">카테고리</p>
              {[
                { key: 'project' as const, label: '프로젝트', color: '#10B981' },
                { key: 'leave' as const, label: '휴가/반차', color: '#F97316' },
                { key: 'business_trip' as const, label: '출장/외근', color: '#8B5CF6' },
                { key: 'other' as const, label: '기타 일정', color: '#6B7280' },
              ].map(cat => (
                <label key={cat.key} className="flex items-center gap-3 py-2 cursor-pointer">
                  <input type="checkbox" checked={categoryFilters[cat.key]}
                    onChange={e => setCategoryFilters(prev => ({ ...prev, [cat.key]: e.target.checked }))}
                    className="w-4 h-4 rounded border-gray-300" />
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                  <span className="text-sm text-gray-700 font-medium">{cat.label}</span>
                </label>
              ))}
            </div>
            {usersList.length > 0 && (
              <div className="p-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">팀원 범례</p>
                <div className="space-y-2">
                  {usersList.map(u => (
                    <div key={u.id} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: u.color || '#6B7280' }} />
                      <span className="text-sm text-gray-600">{u.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── 좌측 네비게이션 서랍 ── */}
      {showNavDrawer && (
        <>
          <div className="fixed inset-0 bg-black/40 z-[60]" onClick={() => setShowNavDrawer(false)} />
          <div className="fixed top-0 left-0 bottom-0 w-64 bg-white z-[61] shadow-2xl"
            style={{ animation: 'slideInLeft 0.2s ease' }}>
            <div className="px-4 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">UNECORAIL</h3>
              <p className="text-xs text-gray-400 mt-0.5">유네코레일 전기팀</p>
            </div>
            <nav className="py-2">
              {[
                { name: '대시보드', href: '/dashboard', icon: Home },
                { name: 'AS/SS', href: '/as-ss', icon: Package2 },
                { name: '업무일지', href: '/work-diary', icon: FileText },
                { name: '일정', href: '/schedule', icon: Calendar },
                { name: '설정', href: '/settings', icon: Settings },
              ].map(item => (
                <a key={item.name} href={item.href}
                  onClick={() => setShowNavDrawer(false)}
                  className="flex items-center gap-3 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  <item.icon className="w-5 h-5 text-gray-400" />
                  {item.name}
                </a>
              ))}
            </nav>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes slideInLeft { from { transform:translateX(-100%); } to { transform:translateX(0); } }
      `}</style>
    </div>
  )
}
