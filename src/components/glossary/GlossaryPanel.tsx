'use client'

import { useState } from 'react'
import { GlossaryEntry } from '@/shared/types'

interface GlossaryPanelProps {
  entries: GlossaryEntry[]
  onAdd: (original: string, translated: string, type: GlossaryEntry['type'], vietnamese?: string) => Promise<any>
  onUpdate: (id: string, original: string, translated: string, type: GlossaryEntry['type'], vietnamese?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  isLoading: boolean
}

const TYPE_LABELS: Record<GlossaryEntry['type'], string> = {
  character: 'Nhân vật',
  location: 'Địa danh',
  term: 'Thuật ngữ',
  other: 'Khác'
}

const TYPE_COLORS: Record<GlossaryEntry['type'], string> = {
  character: 'bg-blue-800 text-blue-200',
  location: 'bg-green-800 text-green-200',
  term: 'bg-purple-800 text-purple-200',
  other: 'bg-gray-700 text-gray-300'
}

export default function GlossaryPanel({ entries, onAdd, onUpdate, onDelete, isLoading }: GlossaryPanelProps) {
  const [newOriginal, setNewOriginal] = useState('')
  const [newTranslated, setNewTranslated] = useState('')
  const [newVietnamese, setNewVietnamese] = useState('')
  const [newType, setNewType] = useState<GlossaryEntry['type']>('character')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editOriginal, setEditOriginal] = useState('')
  const [editTranslated, setEditTranslated] = useState('')
  const [editVietnamese, setEditVietnamese] = useState('')
  const [editType, setEditType] = useState<GlossaryEntry['type']>('character')
  const [filter, setFilter] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!newOriginal.trim() || !newTranslated.trim() || adding) return
    setAdding(true)
    try {
      await onAdd(newOriginal.trim(), newTranslated.trim(), newType, newVietnamese.trim() || undefined)
      setNewOriginal('')
      setNewTranslated('')
      setNewVietnamese('')
    } finally {
      setAdding(false)
    }
  }

  const handleAddKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
  }

  const handleStartEdit = (entry: GlossaryEntry) => {
    setEditingId(entry.id)
    setEditOriginal(entry.original)
    setEditTranslated(entry.translated)
    setEditVietnamese(entry.vietnamese || '')
    setEditType(entry.type)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editOriginal.trim() || !editTranslated.trim()) return
    await onUpdate(editingId, editOriginal.trim(), editTranslated.trim(), editType, editVietnamese.trim() || undefined)
    setEditingId(null)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveEdit()
    if (e.key === 'Escape') setEditingId(null)
  }

  const filteredEntries = entries.filter(e =>
    e.original.includes(filter) || e.translated.toLowerCase().includes(filter.toLowerCase()) ||
    (e.vietnamese && e.vietnamese.toLowerCase().includes(filter.toLowerCase()))
  )

  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 bg-gray-750 border-b border-gray-700 flex items-center justify-between shrink-0">
        <span className="text-sm font-medium text-orange-400">
          Từ điển ({entries.length})
        </span>
      </div>

      {/* Add new entry form */}
      <div className="p-3 border-b border-gray-700 space-y-2 shrink-0">
        <div className="px-1 pb-1 text-xs text-gray-500">
          Dùng <span className="text-orange-400">{'{n}'}</span> cho số. VD: 第{'{n}'}章 → Chương {'{n}'}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Trung (VD: 大梁)"
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            value={newOriginal}
            onChange={(e) => setNewOriginal(e.target.value)}
            onKeyDown={handleAddKeyDown}
          />
          <input
            type="text"
            placeholder="Hán Việt (VD: Đại Lương)"
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
            value={newTranslated}
            onChange={(e) => setNewTranslated(e.target.value)}
            onKeyDown={handleAddKeyDown}
          />
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Nghĩa Việt (VD: hắn)"
            className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-green-300 placeholder-gray-500 focus:outline-none focus:border-green-500"
            value={newVietnamese}
            onChange={(e) => setNewVietnamese(e.target.value)}
            onKeyDown={handleAddKeyDown}
          />
        </div>
        <div className="flex gap-2 items-center">
          <select
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none"
            value={newType}
            onChange={(e) => setNewType(e.target.value as GlossaryEntry['type'])}
          >
            <option value="character">Nhân vật</option>
            <option value="location">Địa danh</option>
            <option value="term">Thuật ngữ</option>
            <option value="other">Khác</option>
          </select>
          <button
            onClick={handleAdd}
            disabled={!newOriginal.trim() || !newTranslated.trim() || adding}
            className="px-3 py-1 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-xs text-white transition-colors"
          >
            {adding ? '...' : 'Thêm'}
          </button>
        </div>
      </div>

      {/* Search/filter */}
      <div className="px-3 py-2 border-b border-gray-700 shrink-0">
        <input
          type="text"
          placeholder="Tìm kiếm..."
          className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-orange-500"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      {/* Entry list */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500 text-sm">Đang tải...</div>
        ) : filteredEntries.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {filter ? 'Không tìm thấy' : 'Chưa có mục nào. Thêm từ điển ở trên.'}
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="px-3 py-2 hover:bg-gray-750 group">
                {editingId === entry.id ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-orange-500"
                        value={editOriginal}
                        onChange={(e) => setEditOriginal(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                        autoFocus
                      />
                      <input
                        type="text"
                        className="flex-1 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-orange-500"
                        value={editTranslated}
                        onChange={(e) => setEditTranslated(e.target.value)}
                        onKeyDown={handleEditKeyDown}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Nghĩa Việt"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm text-green-300 placeholder-gray-500 focus:outline-none focus:border-green-500"
                      value={editVietnamese}
                      onChange={(e) => setEditVietnamese(e.target.value)}
                      onKeyDown={handleEditKeyDown}
                    />
                    <div className="flex gap-2 items-center">
                      <select
                        className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white focus:outline-none"
                        value={editType}
                        onChange={(e) => setEditType(e.target.value as GlossaryEntry['type'])}
                      >
                        <option value="character">Nhân vật</option>
                        <option value="location">Địa danh</option>
                        <option value="term">Thuật ngữ</option>
                        <option value="other">Khác</option>
                      </select>
                      <button
                        onClick={handleSaveEdit}
                        className="px-2 py-1 bg-green-700 hover:bg-green-600 rounded text-xs text-white transition-colors"
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 transition-colors"
                      >
                        Hủy
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white text-sm font-medium">{entry.original}</span>
                        <span className="text-gray-500 text-xs">→</span>
                        <span className="text-orange-300 text-sm">{entry.translated}</span>
                        {entry.vietnamese && (
                          <>
                            <span className="text-gray-500 text-xs">→</span>
                            <span className="text-green-300 text-sm">{entry.vietnamese}</span>
                          </>
                        )}
                      </div>
                      <span className={`text-xs px-1.5 py-0.5 rounded mt-1 inline-block ${TYPE_COLORS[entry.type]}`}>
                        {TYPE_LABELS[entry.type]}
                      </span>
                    </div>
                    <div className="hidden group-hover:flex gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => handleStartEdit(entry)}
                        className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => onDelete(entry.id)}
                        className="px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
