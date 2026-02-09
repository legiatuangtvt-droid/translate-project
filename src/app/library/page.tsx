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
  lastUpdated: string
}

export default function LibraryPage() {
  const [novels, setNovels] = useState<Novel[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/novels')
      .then(res => res.json())
      .then(data => setNovels(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Xóa truyện này?')) return
    await fetch(`/api/novels/${id}`, { method: 'DELETE' })
    setNovels(novels.filter(n => n.id !== id))
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Đang tải...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Thư viện truyện</h1>
        <Link
          href="/search"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
        >
          + Thêm truyện
        </Link>
      </div>

      {novels.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">Chưa có truyện nào</p>
          <Link href="/search" className="text-blue-400 hover:text-blue-300">
            Tìm và thêm truyện mới
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {novels.map(novel => (
            <div key={novel.id} className="bg-gray-800 rounded-lg p-4 flex gap-4">
              {novel.cover && (
                <img src={novel.cover} alt={novel.title} className="w-20 h-28 object-cover rounded" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{novel.title}</h3>
                <p className="text-sm text-gray-400">{novel.author}</p>
                <p className="text-xs text-gray-500 mt-1">{novel.totalChapters} chương</p>
                <div className="flex gap-2 mt-3">
                  <Link
                    href={`/reader/${novel.id}`}
                    className="text-xs px-2 py-1 bg-green-700 hover:bg-green-600 rounded transition-colors"
                  >
                    Đọc
                  </Link>
                  <Link
                    href={`/paste?novelId=${novel.id}`}
                    className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  >
                    Dịch
                  </Link>
                  <button
                    onClick={() => handleDelete(novel.id)}
                    className="text-xs px-2 py-1 bg-red-800 hover:bg-red-700 rounded transition-colors"
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
