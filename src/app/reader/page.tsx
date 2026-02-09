'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Novel {
  id: string
  title: string
  author: string
  cover?: string
  sourceSite: string
  totalChapters: number
}

export default function ReaderIndexPage() {
  const [novels, setNovels] = useState<Novel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/novels')
      .then(res => res.json())
      .then(data => setNovels(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Đang tải...</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Đọc truyện</h1>

      {novels.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">Chưa có truyện nào trong thư viện</p>
          <Link href="/search" className="text-blue-400 hover:text-blue-300">
            Tìm và thêm truyện mới
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {novels.map(novel => (
            <Link
              key={novel.id}
              href={`/reader/${novel.id}`}
              className="bg-gray-800 rounded-lg p-4 flex gap-4 hover:bg-gray-750 transition-colors"
            >
              {novel.cover && (
                <img src={novel.cover} alt={novel.title} className="w-20 h-28 object-cover rounded" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate text-white">{novel.title}</h3>
                <p className="text-sm text-gray-400">{novel.author}</p>
                <p className="text-xs text-gray-500 mt-1">{novel.totalChapters} chương</p>
                <span className="inline-block mt-3 text-xs px-3 py-1 bg-green-700 rounded text-white">
                  Đọc
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
