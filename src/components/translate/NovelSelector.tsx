'use client'

import { useState, useEffect, useCallback } from 'react'
import { Novel } from '@/shared/types'

interface NovelSelectorProps {
  selectedNovelId: string | null
  onSelect: (novelId: string | null) => void
}

export default function NovelSelector({ selectedNovelId, onSelect }: NovelSelectorProps) {
  const [novels, setNovels] = useState<Novel[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetch('/api/novels')
      .then(res => res.json())
      .then((data: Novel[]) => {
        setNovels(data.filter(n => n.sourceSite === 'manual'))
      })
      .catch(console.error)
  }, [])

  const handleCreate = useCallback(async () => {
    if (!newTitle.trim() || isCreating) return
    setIsCreating(true)
    try {
      const res = await fetch('/api/novels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          author: '',
          sourceSite: 'manual',
          sourceUrl: ''
        })
      })
      if (!res.ok) throw new Error('Failed to create novel')
      const novel = await res.json()
      setNovels(prev => [novel, ...prev])
      onSelect(novel.id)
      setNewTitle('')
      setShowCreate(false)
    } catch (error) {
      console.error('Failed to create novel:', error)
    } finally {
      setIsCreating(false)
    }
  }, [newTitle, isCreating, onSelect])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate()
    if (e.key === 'Escape') { setShowCreate(false); setNewTitle('') }
  }

  const selectedNovel = novels.find(n => n.id === selectedNovelId)

  return (
    <div className="flex items-center gap-3">
      <select
        className="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500 min-w-[200px]"
        value={selectedNovelId || ''}
        onChange={(e) => {
          const val = e.target.value
          if (val === '__create__') {
            setShowCreate(true)
          } else {
            onSelect(val || null)
          }
        }}
      >
        <option value="">-- Không chọn truyện --</option>
        {novels.map(novel => (
          <option key={novel.id} value={novel.id}>
            {novel.title} ({novel.totalChapters} chương)
          </option>
        ))}
        <option value="__create__">+ Tạo truyện mới...</option>
      </select>

      {showCreate && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Tên truyện mới..."
            className="bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button
            onClick={handleCreate}
            disabled={!newTitle.trim() || isCreating}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm text-white transition-colors"
          >
            {isCreating ? '...' : 'Tạo'}
          </button>
          <button
            onClick={() => { setShowCreate(false); setNewTitle('') }}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition-colors"
          >
            Hủy
          </button>
        </div>
      )}

      {selectedNovel && (
        <span className="text-xs text-gray-400">
          {selectedNovel.totalChapters} chương
        </span>
      )}

      {selectedNovelId && (
        <button
          onClick={() => onSelect(null)}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          Bỏ chọn
        </button>
      )}
    </div>
  )
}
