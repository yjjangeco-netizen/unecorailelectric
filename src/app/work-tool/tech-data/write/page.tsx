'use client'

import AuthGuard from '@/components/AuthGuard'
import GenericBoardWrite from '@/components/GenericBoardWrite'

export default function TechDataWritePage() {
  return (
    <AuthGuard>
      <GenericBoardWrite boardType="TECH_DATA" basePath="/work-tool/tech-data" />
    </AuthGuard>
  )
}
