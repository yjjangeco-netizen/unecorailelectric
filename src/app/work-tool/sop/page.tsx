'use client'

import AuthGuard from '@/components/AuthGuard'
import DriveBoard from '@/components/DriveBoard'

export default function SOPPage() {
  return (
    <AuthGuard>
      <DriveBoard folderName="SOP" title="SOP 자료실" emptyMessage="구글 드라이브(manual/SOP)에 등록된 SOP 문서가 없습니다." />
    </AuthGuard>
  )
}
