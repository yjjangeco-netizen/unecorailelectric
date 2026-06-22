'use client'

import AuthGuard from '@/components/AuthGuard'
import DriveBoard from '@/components/DriveBoard'

export default function TechDataPage() {
  return (
    <AuthGuard>
      <DriveBoard folderName="engineerData" title="기술자료 자료실" emptyMessage="구글 드라이브(manual/engineerData)에 등록된 기술자료 문서가 없습니다." />
    </AuthGuard>
  )
}
