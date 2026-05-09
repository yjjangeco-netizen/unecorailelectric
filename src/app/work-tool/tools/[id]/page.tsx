import AuthGuard from '@/components/AuthGuard'
import GenericBoardDetail from '@/components/GenericBoardDetail'

export default function ToolsDetailPage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard>
      <GenericBoardDetail id={params.id} boardType="TOOLS" basePath="/work-tool/tools" />
    </AuthGuard>
  )
}
