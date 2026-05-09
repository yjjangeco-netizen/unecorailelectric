'use client'

import AuthGuard from '@/components/AuthGuard'
import GenericBoard from '@/components/GenericBoard'

export default function TroubleshootingPage() {
  return (
    <AuthGuard>
      <GenericBoard boardType="TROUBLESHOOTING" emptyMessage="등록된 고장대응 게시글이 없습니다." basePath="/work-tool/troubleshooting" />
    </AuthGuard>
  )
}
