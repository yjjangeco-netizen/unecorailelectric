'use client'

import AuthGuard from '@/components/AuthGuard'
import GenericBoardWrite from '@/components/GenericBoardWrite'

export default function SOPEditPage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard>
      <GenericBoardWrite boardType="SOP" basePath="/work-tool/sop" editId={params.id} />
    </AuthGuard>
  )
}
