import Link from 'next/link'
import { Home, AlertTriangle } from 'lucide-react'

export default function NotFound() {
  return (
    <main 
      className="min-h-screen grid place-items-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100" 
      aria-labelledby="nf-title"
      role="main"
    >
      <section className="text-center space-y-6 bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-4">
          <AlertTriangle className="h-8 w-8 text-orange-600" aria-hidden="true" />
        </div>
        
        <div className="space-y-3">
          <h1 
            id="nf-title" 
            className="text-2xl font-bold text-gray-900"
          >
            페이지를 찾을 수 없습니다
          </h1>
          <p className="text-gray-600 leading-relaxed">
            요청하신 경로가 존재하지 않거나 이동되었습니다.<br />
            주소를 확인하거나 메인 페이지로 돌아가주세요.
          </p>
        </div>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            aria-label="유네코레일 전기파트 메인 페이지로 이동"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
            메인 페이지로
          </Link>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            <strong>오류 코드:</strong> 404 - Not Found
          </p>
          <p className="text-xs text-gray-400 mt-2">
            문제가 지속되면 관리자에게 문의하세요.
          </p>
        </div>
      </section>
    </main>
  )
}
