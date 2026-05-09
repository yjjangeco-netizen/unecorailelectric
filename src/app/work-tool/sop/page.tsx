'use client'

import AuthGuard from '@/components/AuthGuard'
import GenericBoard from '@/components/GenericBoard'

export default function SOPPage() {
  return (
    <AuthGuard>
      <GenericBoard boardType="SOP" emptyMessage="등록된 SOP 게시글이 없습니다." basePath="/work-tool/sop" />
    </AuthGuard>
  )
}
