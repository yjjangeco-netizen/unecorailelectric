'use client'

import React, { useRef } from 'react'
import { QRCodeCanvas } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import { Download, QrCode } from 'lucide-react'

// QR이 가리킬 QR_KAKAO 챗봇 배포 도메인.
// 환경변수로 덮어쓸 수 있고, 없으면 운영 도메인을 기본값으로 사용.
const QR_BASE =
  process.env.NEXT_PUBLIC_QR_BASE_URL || 'https://hectoraaa.vercel.app'

interface ProjectQrCodeProps {
  projectNumber?: string | null
}

/**
 * 현장 부착용 QR 코드 생성기.
 * project_number(CNCWL-2503 등)를 QR_KAKAO 진입 URL로 인코딩한다.
 *   예) https://hectoraaa.vercel.app/qr?pn=CNCWL-2503
 * 작업자가 찍으면 QR_KAKAO의 resolver가 현장+컨트롤러를 해석해 매뉴얼로 직행한다.
 */
export default function ProjectQrCode({ projectNumber }: ProjectQrCodeProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const code = (projectNumber || '').trim()

  if (!code) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 p-4 text-sm text-gray-400 flex items-center gap-2">
        <QrCode className="w-4 h-4" />
        프로젝트 번호를 입력하면 현장 부착용 QR이 생성됩니다.
      </div>
    )
  }

  const url = `${QR_BASE}/qr?pn=${encodeURIComponent(code)}`

  const handleDownload = () => {
    const canvas = wrapRef.current?.querySelector('canvas')
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `QR_${code}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  return (
    <div className="rounded-xl border border-gray-200 p-4 flex items-center gap-4">
      <div
        ref={wrapRef}
        className="bg-white p-2 rounded-lg border border-gray-100 shrink-0"
      >
        <QRCodeCanvas value={url} size={132} level="M" marginSize={0} />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="text-sm font-medium text-gray-700">현장 부착용 QR</div>
        <div className="text-xs text-gray-400 break-all">{url}</div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleDownload}
          className="gap-1"
        >
          <Download className="w-4 h-4" /> PNG 다운로드
        </Button>
      </div>
    </div>
  )
}
