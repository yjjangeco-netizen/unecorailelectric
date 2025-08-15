export default function TestSimplePage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">🧪 Simple Test Page</h1>
      <p className="text-gray-600">This is a simple test page without complex dependencies.</p>
      <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded">
        <p className="text-green-800">✅ If you can see this, the basic page rendering is working!</p>
      </div>
    </div>
  )
}
