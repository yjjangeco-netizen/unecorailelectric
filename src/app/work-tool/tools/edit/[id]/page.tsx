'use client'

import AuthGuard from '@/components/AuthGuard'
import GenericBoardWrite from '@/components/GenericBoardWrite'

export default function ToolsEditPage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard>
      <GenericBoardWrite boardType="TOOLS" basePath="/work-tool/tools" editId={params.id} />
    </AuthGuard>
  )
}
