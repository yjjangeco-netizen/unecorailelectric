'use client'

import AuthGuard from '@/components/AuthGuard'
import GenericBoardWrite from '@/components/GenericBoardWrite'

export default function SOPWritePage() {
  return (
    <AuthGuard>
      <GenericBoardWrite boardType="SOP" basePath="/work-tool/sop" />
    </AuthGuard>
  )
}
