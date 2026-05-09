'use client'

import AuthGuard from '@/components/AuthGuard'
import GenericBoardWrite from '@/components/GenericBoardWrite'

export default function ToolsWritePage() {
  return (
    <AuthGuard>
      <GenericBoardWrite boardType="TOOLS" basePath="/work-tool/tools" />
    </AuthGuard>
  )
}
