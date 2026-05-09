import AuthGuard from '@/components/AuthGuard'
import GenericBoardDetail from '@/components/GenericBoardDetail'

export default function TroubleshootingDetailPage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard>
      <GenericBoardDetail id={params.id} boardType="TROUBLESHOOTING" basePath="/work-tool/troubleshooting" />
    </AuthGuard>
  )
}
