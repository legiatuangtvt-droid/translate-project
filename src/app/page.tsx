import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
      <h1 className="text-4xl font-bold text-center">Novel Translator</h1>
      <p className="text-gray-400 text-lg text-center max-w-xl">
        Dịch truyện Trung Quốc sang tiếng Việt. Hỗ trợ dịch Hán Việt, dịch máy (Google, Gemini, Ollama).
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link
          href="/translate"
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium transition-colors"
        >
          Dịch nhanh
        </Link>
        <Link
          href="/library"
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
        >
          Thư viện
        </Link>
        <Link
          href="/search"
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-medium transition-colors"
        >
          Tìm truyện
        </Link>
      </div>
    </div>
  )
}
