'use client'

import AuthGuard from '@/components/AuthGuard'
import GenericBoardWrite from '@/components/GenericBoardWrite'

export default function TroubleshootingWritePage() {
  return (
    <AuthGuard>
      <GenericBoardWrite boardType="TROUBLESHOOTING" basePath="/work-tool/troubleshooting" />
    </AuthGuard>
  )
}
