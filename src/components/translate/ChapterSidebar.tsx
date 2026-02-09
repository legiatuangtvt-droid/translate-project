'use client'

import { useState, useEffect } from 'react'
import { Chapter } from '@/shared/types'

interface ChapterSidebarProps {
  chapters: Chapter[]
  currentChapterId: string | null
  onLoadChapter: (id: string) => void
  onSaveNew: (title: string, index: number) => Promise<void>
  onUpdateCurrent: () => Promise<void>
  isSaving: boolean
}

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending: { label: 'Chờ', color: 'bg-gray-600 text-gray-300' },
  crawled: { label: 'Đã lấy', color: 'bg-blue-800 text-blue-200' },
  translating: { label: 'Đang dịch', color: 'bg-yellow-800 text-yellow-200' },
  translated: { label: 'Đã dịch', color: 'bg-green-800 text-green-200' }
}

export default function ChapterSidebar({
  chapters,
  currentChapterId,
  onLoadChapter,
  onSaveNew,
  onUpdateCurrent,
  isSaving
}: ChapterSidebarProps) {
  const [newTitle, setNewTitle] = useState('')
  const [newIndex, setNewIndex] = useState(chapters.length + 1)
  const [saving, setSaving] = useState(false)

  // Auto-update index when chapters change
  useEffect(() => {
    setNewIndex(chapters.length + 1)
  }, [chapters.length])

  const handleSaveNew = async () => {
    if (!newTitle.trim() || saving) return
    setSaving(true)
    try {
      await onSaveNew(newTitle.trim(), newIndex - 1) // convert 1-based to 0-based
      setNewTitle('')
      setNewIndex(chapters.length + 2) // next chapter
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveNew()
  }

  // Sort chapters by index for display
  const sortedChapters = [...chapters].sort((a, b) => a.index - b.index)

  return (
    <div className="w-64 flex flex-col bg-gray-800 rounded-lg overflow-hidden shrink-0">
      {/* Header */}
      <div className="px-3 py-2 bg-gray-750 border-b border-gray-700 shrink-0">
        <span className="text-sm font-medium text-blue-400">
          Chương ({chapters.length})
        </span>
      </div>

      {/* Save new chapter */}
      <div className="p-3 border-b border-gray-700 space-y-2 shrink-0">
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            className="w-14 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:border-blue-500"
            value={newIndex}
            onChange={(e) => setNewIndex(Math.max(1, parseInt(e.target.value) || 1))}
          />
          <input
            type="text"
            placeholder="Tên chương..."
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSaveNew}
            disabled={!newTitle.trim() || saving || isSaving}
            className="flex-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-xs text-white transition-colors"
          >
            {saving ? '...' : 'Lưu mới'}
          </button>
          {currentChapterId && (
            <button
              onClick={onUpdateCurrent}
              disabled={isSaving}
              className="flex-1 px-2 py-1 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-xs text-white transition-colors"
            >
              {isSaving ? '...' : 'Cập nhật'}
            </button>
          )}
        </div>
      </div>

      {/* Chapter list */}
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
                  onClick={() => onLoadChapter(ch.id)}
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
