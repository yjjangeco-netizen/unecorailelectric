'use client'

import AuthGuard from '@/components/AuthGuard'
import GenericBoard from '@/components/GenericBoard'

export default function ToolsPage() {
  return (
    <AuthGuard>
      <GenericBoard boardType="TOOLS" emptyMessage="등록된 업무툴 관련 게시글이 없습니다." basePath="/work-tool/tools" />
    </AuthGuard>
  )
}
