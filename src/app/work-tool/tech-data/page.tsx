'use client'

import AuthGuard from '@/components/AuthGuard'
import GenericBoard from '@/components/GenericBoard'

export default function TechDataPage() {
  return (
    <AuthGuard>
      <GenericBoard boardType="TECH_DATA" emptyMessage="등록된 기술자료가 없습니다." basePath="/work-tool/tech-data" />
    </AuthGuard>
  )
}
