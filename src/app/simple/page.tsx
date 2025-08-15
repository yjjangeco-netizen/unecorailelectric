export default function SimplePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🧪 Simple Main Page</h1>
      <p className="text-gray-600">This is a simplified main page for testing.</p>
      <div className="mt-4 p-4 bg-blue-100 border border-blue-300 rounded">
        <p className="text-blue-800">✅ Basic page rendering is working!</p>
      </div>
      <div className="mt-4">
        <a href="/test-simple" className="text-blue-600 hover:underline">Go to Test Page</a>
      </div>
    </div>
  )
}
