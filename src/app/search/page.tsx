'use client'

import { useState } from 'react'

interface Novel {
  id: string
  title: string
  author: string
  cover?: string
  totalChapters: number
  sourceUrl: string
  sourceSite: string
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Novel[]>([])
  const [loading, setLoading] = useState(false)
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  const handleSearch = async () => {
    if (!query.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/crawler/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: query })
      })
      const data = await res.json()
      setResults(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async (novel: Novel) => {
    try {
      await fetch('/api/novels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novel)
      })
      setAddedIds(prev => new Set([...prev, novel.id]))
    } catch (err) {
      console.error('Add failed:', err)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tìm truyện</h1>

      <div className="flex gap-3 mb-6">
        <input
          type="text"
          className="flex-1 bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          placeholder="Nhập tên truyện (tiếng Trung)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-white transition-colors"
        >
          {loading ? 'Đang tìm...' : 'Tìm'}
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Hỗ trợ: Fanqie (番茄)
      </p>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map(novel => (
            <div key={novel.id} className="bg-gray-800 rounded-lg p-4 flex gap-4 items-center">
              {novel.cover && (
                <img src={novel.cover} alt={novel.title} className="w-16 h-22 object-cover rounded" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium">{novel.title}</h3>
                <p className="text-sm text-gray-400">{novel.author}</p>
                <p className="text-xs text-gray-500">{novel.totalChapters} chương</p>
              </div>
              <button
                onClick={() => handleAdd(novel)}
                disabled={addedIds.has(novel.id)}
                className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 disabled:text-gray-400 rounded text-sm transition-colors whitespace-nowrap"
              >
                {addedIds.has(novel.id) ? 'Đã thêm' : 'Thêm vào thư viện'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
