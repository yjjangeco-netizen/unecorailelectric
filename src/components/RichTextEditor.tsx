'use client'

import { useEffect, useRef } from 'react'

// 간단 리치텍스트 에디터 — 글자 크기/색상/굵게/링크 (HTML 저장).
// 게시판 본문용. 블로그처럼 사용자가 직접 서식을 지정한다.

const FONT_SIZES = [
  { label: '작게', value: '2' },
  { label: '보통', value: '3' },
  { label: '크게', value: '5' },
  { label: '아주 크게', value: '7' }
]
const COLORS = ['#111827', '#dc2626', '#2563eb', '#16a34a', '#d97706', '#7c3aed']

export default function RichTextEditor({
  value,
  onChange,
  placeholder = '내용을 입력하세요.'
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  // 초기 값만 한 번 주입(이후엔 비제어 — 커서 튐 방지)
  useEffect(() => {
    if (ref.current && value && ref.current.innerHTML === '') {
      ref.current.innerHTML = value
    }
  }, [value])

  const exec = (command: string, arg?: string) => {
    document.execCommand(command, false, arg)
    ref.current?.focus()
    onChange(ref.current?.innerHTML || '')
  }

  return (
    <div className="rounded-md border border-gray-300">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        <button
          type="button"
          onClick={() => exec('bold')}
          className="rounded px-2 py-1 text-sm font-bold text-gray-700 hover:bg-gray-200"
          title="굵게"
        >
          B
        </button>
        <select
          onChange={(e) => exec('fontSize', e.target.value)}
          defaultValue="3"
          className="rounded border border-gray-300 bg-white px-1.5 py-1 text-sm text-gray-700"
          title="글자 크기"
        >
          {FONT_SIZES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1 pl-1">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => exec('foreColor', c)}
              className="h-5 w-5 rounded-full border border-gray-300"
              style={{ backgroundColor: c }}
              title="글자 색"
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('링크 주소를 입력하세요 (https://...)')
            if (url) exec('createLink', url)
          }}
          className="rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-200"
          title="링크"
        >
          링크
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={() => onChange(ref.current?.innerHTML || '')}
        className="min-h-[220px] px-3 py-2 text-sm leading-relaxed text-gray-900 focus:outline-none empty:before:text-gray-400 empty:before:content-[attr(data-placeholder)]"
      />
    </div>
  )
}
