import AuthGuard from '@/components/AuthGuard'
import GenericBoardDetail from '@/components/GenericBoardDetail'

export default function SOPDetailPage({ params }: { params: { id: string } }) {
  return (
    <AuthGuard>
      <GenericBoardDetail id={params.id} boardType="SOP" basePath="/work-tool/sop" />
    </AuthGuard>
  )
}
