'use client'

import AuthGuard from '@/components/AuthGuard'
import GenericBoardWrite from '@/components/GenericBoardWrite'

export default function TechDataEditPage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard>
      <GenericBoardWrite boardType="TECH_DATA" basePath="/work-tool/tech-data" editId={params.id} />
    </AuthGuard>
  )
}
