'use client'

import AuthGuard from '@/components/AuthGuard'
import DriveBoard from '@/components/DriveBoard'

export default function TroubleshootingPage() {
  return (
    <AuthGuard>
      <DriveBoard folderName="Breakdown" title="고장대응 자료실" emptyMessage="구글 드라이브(manual/Breakdown)에 등록된 고장대응 문서가 없습니다." />
    </AuthGuard>
  )
}
