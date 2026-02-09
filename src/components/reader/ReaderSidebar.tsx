'use client'

import { useEffect, useRef } from 'react'
import { Chapter } from '@/shared/types'

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ', color: 'bg-gray-600 text-gray-300' },
  crawled: { label: 'Đã lấy', color: 'bg-blue-800 text-blue-200' },
  translating: { label: 'Đang dịch', color: 'bg-yellow-800 text-yellow-200' },
  translated: { label: 'Đã dịch', color: 'bg-green-800 text-green-200' }
}

interface ReaderSidebarProps {
  chapters: Chapter[]
  currentChapterId: string | null
  onSelectChapter: (chapterId: string) => void
}

export default function ReaderSidebar({ chapters, currentChapterId, onSelectChapter }: ReaderSidebarProps) {
  const activeRef = useRef<HTMLButtonElement>(null)

  const sortedChapters = [...chapters].sort((a, b) => a.index - b.index)

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [currentChapterId])

  return (
    <div className="w-64 flex flex-col bg-gray-800 rounded-lg overflow-hidden shrink-0">
      <div className="px-3 py-2 bg-gray-750 border-b border-gray-700 shrink-0">
        <span className="text-sm font-medium text-blue-400">
          Chương ({chapters.length})
        </span>
      </div>

      <div className="flex-1 overflow-auto">
        {sortedChapters.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-xs">
            Chưa có chương nào
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {sortedChapters.map((ch) => {
              const isActive = ch.id === currentChapterId
              const badge = STATUS_BADGE[ch.status] || STATUS_BADGE.pending
              return (
                <button
                  key={ch.id}
                  ref={isActive ? activeRef : null}
                  onClick={() => onSelectChapter(ch.id)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-750 transition-colors ${
                    isActive ? 'bg-gray-700 border-l-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs truncate ${isActive ? 'text-white font-medium' : 'text-gray-300'}`}>
                      {ch.index + 1}. {ch.title || `Chương ${ch.index + 1}`}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ml-1 ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
