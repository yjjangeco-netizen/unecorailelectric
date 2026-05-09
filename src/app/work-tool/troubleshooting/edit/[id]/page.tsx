'use client'

import AuthGuard from '@/components/AuthGuard'
import GenericBoardWrite from '@/components/GenericBoardWrite'

export default function TroubleshootingEditPage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard>
      <GenericBoardWrite boardType="TROUBLESHOOTING" basePath="/work-tool/troubleshooting" editId={params.id} />
    </AuthGuard>
  )
}
