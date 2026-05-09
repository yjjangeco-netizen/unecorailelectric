import AuthGuard from '@/components/AuthGuard'
import GenericBoardDetail from '@/components/GenericBoardDetail'

export default function TechDataDetailPage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard>
      <GenericBoardDetail id={params.id} boardType="TECH_DATA" basePath="/work-tool/tech-data" />
    </AuthGuard>
  )
}
