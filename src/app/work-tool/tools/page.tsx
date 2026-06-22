'use client'

import AuthGuard from '@/components/AuthGuard'
import DriveBoard from '@/components/DriveBoard'

export default function ToolsPage() {
  return (
    <AuthGuard>
      <DriveBoard folderName="Worktool" title="업무툴 자료실" emptyMessage="구글 드라이브(manual/Worktool)에 등록된 업무툴 문서가 없습니다." />
    </AuthGuard>
  )
}
