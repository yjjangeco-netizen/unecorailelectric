export default function Loading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">고급 통계 검색</h2>
        <p className="text-gray-600">데이터를 불러오는 중...</p>
      </div>
    </div>
  )
}
