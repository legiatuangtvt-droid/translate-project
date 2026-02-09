'use client'

import { useState, useMemo } from 'react'
import { GlossaryEntry } from '@/shared/types'
import GlossaryPanel from '@/components/glossary/GlossaryPanel'

interface EnhancedGlossaryPanelProps {
  entries: GlossaryEntry[]
  onAdd: (original: string, translated: string, type: GlossaryEntry['type'], targetNovelId?: string | null, vietnamese?: string) => Promise<any>
  onUpdate: (id: string, original: string, translated: string, type: GlossaryEntry['type'], vietnamese?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  isLoading: boolean
  novelId: string | null
}

export default function EnhancedGlossaryPanel({
  entries,
  onAdd,
  onUpdate,
  onDelete,
  isLoading,
  novelId
}: EnhancedGlossaryPanelProps) {
  const [activeTab, setActiveTab] = useState<'global' | 'novel'>('global')

  const globalEntries = useMemo(
    () => entries.filter(e => !e.novelId),
    [entries]
  )

  const novelEntries = useMemo(
    () => entries.filter(e => e.novelId === novelId),
    [entries, novelId]
  )

  // No novel selected: show standard glossary panel
  if (!novelId) {
    return (
      <GlossaryPanel
        entries={globalEntries}
        onAdd={(o, t, type, vi) => onAdd(o, t, type, null, vi)}
        onUpdate={onUpdate}
        onDelete={onDelete}
        isLoading={isLoading}
      />
    )
  }

  // Novel selected: show tabs
  return (
    <div className="flex flex-col h-full bg-gray-800 rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-700 shrink-0">
        <button
          onClick={() => setActiveTab('global')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'global'
              ? 'text-orange-400 border-b-2 border-orange-400 bg-gray-750'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Chung ({globalEntries.length})
        </button>
        <button
          onClick={() => setActiveTab('novel')}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === 'novel'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-750'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Truyện ({novelEntries.length})
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'global' ? (
          <GlossaryPanel
            entries={globalEntries}
            onAdd={(o, t, type, vi) => onAdd(o, t, type, null, vi)}
            onUpdate={onUpdate}
            onDelete={onDelete}
            isLoading={isLoading}
          />
        ) : (
          <div className="flex flex-col h-full">
            {/* Novel-specific entries (editable) */}
            <div className="flex-1 overflow-hidden">
              <GlossaryPanel
                entries={novelEntries}
                onAdd={(o, t, type, vi) => onAdd(o, t, type, novelId, vi)}
                onUpdate={onUpdate}
                onDelete={onDelete}
                isLoading={isLoading}
              />
            </div>

            {/* Global entries reference (read-only) */}
            {globalEntries.length > 0 && (
              <div className="border-t border-gray-600 shrink-0">
                <div className="px-3 py-1.5 bg-gray-750 text-[10px] text-gray-500 uppercase tracking-wide">
                  Từ điển chung (tham khảo)
                </div>
                <div className="max-h-32 overflow-auto divide-y divide-gray-700">
                  {globalEntries.map(entry => (
                    <div key={entry.id} className="px-3 py-1 flex items-center gap-2">
                      <span className="text-gray-400 text-xs">{entry.original}</span>
                      <span className="text-gray-600 text-[10px]">→</span>
                      <span className="text-gray-500 text-xs">{entry.translated}</span>
                      {entry.vietnamese && (
                        <>
                          <span className="text-gray-600 text-[10px]">→</span>
                          <span className="text-gray-500 text-xs">{entry.vietnamese}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
