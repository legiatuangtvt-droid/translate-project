'use client'

import { useState, useEffect, useCallback } from 'react'

interface Novel { id: string; title: string; author: string; sourceSite: string }
interface Chapter {
  id: string; novelId: string; index: number; title: string;
  rawContent?: string; translatedContent?: string; status: string
}

export default function PastePage() {
  const [novels, setNovels] = useState<Novel[]>([])
  const [selectedNovelId, setSelectedNovelId] = useState<string>('')
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [chapterTitle, setChapterTitle] = useState('')
  const [pasteContent, setPasteContent] = useState('')
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [activeChapter, setActiveChapter] = useState<Chapter | null>(null)
  const [activeTab, setActiveTab] = useState<'raw' | 'translated'>('raw')
  const [translatingId, setTranslatingId] = useState<string | null>(null)
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null)
  const [saving, setSaving] = useState(false)

  // Load novels
  useEffect(() => {
    fetch('/api/novels')
      .then(res => res.json())
      .then(data => {
        const manualNovels = (Array.isArray(data) ? data : []).filter((n: Novel) => n.sourceSite === 'manual')
        setNovels(manualNovels)
      })
      .catch(console.error)
  }, [])

  // Load chapters when novel selected
  useEffect(() => {
    if (!selectedNovelId) { setChapters([]); return }
    fetch(`/api/chapters/by-novel/${selectedNovelId}`)
      .then(res => res.json())
      .then(data => setChapters(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [selectedNovelId])

  const handleCreateNovel = async () => {
    if (!newTitle.trim()) return
    const res = await fetch('/api/novels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, author: '', sourceSite: 'manual', sourceUrl: '' })
    })
    const novel = await res.json()
    setNovels(prev => [...prev, novel])
    setSelectedNovelId(novel.id)
    setNewTitle('')
    setShowCreate(false)
  }

  const handleSaveChapter = async () => {
    if (!selectedNovelId || !chapterTitle.trim() || !pasteContent.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId: selectedNovelId,
          title: chapterTitle,
          rawContent: pasteContent,
          index: chapters.length
        })
      })
      const chapter = await res.json()
      setChapters(prev => [...prev, chapter])
      setChapterTitle('')
      setPasteContent('')
    } finally {
      setSaving(false)
    }
  }

  const handleTranslate = useCallback(async (chapterId: string) => {
    setTranslatingId(chapterId)
    setProgress(null)

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId })
      })

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) return

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value, { stream: true }).split('\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6))
              if (event.type === 'progress') setProgress({ current: event.current, total: event.total })
              if (event.type === 'done') {
                setChapters(prev => prev.map(c =>
                  c.id === chapterId ? { ...c, status: 'translated', translatedContent: event.translated } : c
                ))
              }
            } catch { /* ignore */ }
          }
        }
      }
    } finally {
      setTranslatingId(null)
      setProgress(null)
    }
  }, [])

  const handleViewChapter = useCallback(async (chapterId: string) => {
    const res = await fetch(`/api/chapters/${chapterId}`)
    const chapter = await res.json()
    setActiveChapter(chapter)
    setActiveTab('raw')
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Paste & Dịch</h1>

      {/* Novel selector */}
      <div className="flex gap-3 items-center">
        <select
          className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
          value={selectedNovelId}
          onChange={(e) => setSelectedNovelId(e.target.value)}
        >
          <option value="">-- Chọn truyện --</option>
          {novels.map(n => <option key={n.id} value={n.id}>{n.title}</option>)}
        </select>
        <button
          onClick={() => setShowCreate(true)}
          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
        >
          + Tạo mới
        </button>
      </div>

      {showCreate && (
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
            placeholder="Tên truyện..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
          <button onClick={handleCreateNovel} className="px-4 py-2 bg-blue-600 rounded text-sm">Tạo</button>
          <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-gray-700 rounded text-sm">Hủy</button>
        </div>
      )}

      {selectedNovelId && (
        <>
          {/* Paste area */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <input
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              placeholder="Tiêu đề chương..."
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
            />
            <textarea
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white resize-none"
              rows={6}
              placeholder="Paste nội dung tiếng Trung vào đây..."
              value={pasteContent}
              onChange={(e) => setPasteContent(e.target.value)}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">{pasteContent.length} ký tự</span>
              <button
                onClick={handleSaveChapter}
                disabled={saving || !chapterTitle.trim() || !pasteContent.trim()}
                className="px-4 py-2 bg-green-700 hover:bg-green-600 disabled:bg-gray-600 rounded text-sm transition-colors"
              >
                {saving ? 'Đang lưu...' : 'Lưu chương'}
              </button>
            </div>
          </div>

          {/* Translation progress */}
          {translatingId && progress && (
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${((progress.current + 1) / progress.total) * 100}%` }} />
              </div>
              <span className="text-sm text-gray-400">{progress.current + 1}/{progress.total}</span>
            </div>
          )}

          {/* Chapter list */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Danh sách chương ({chapters.length})</h3>
            {chapters.map(ch => (
              <div key={ch.id} className="bg-gray-800 rounded p-3 flex items-center justify-between">
                <div>
                  <span className="text-sm">{ch.title}</span>
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                    ch.status === 'translated' ? 'bg-green-900 text-green-300' :
                    ch.status === 'translating' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-gray-700 text-gray-400'
                  }`}>
                    {ch.status === 'translated' ? 'Đã dịch' : ch.status === 'translating' ? 'Đang dịch' : 'Chưa dịch'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewChapter(ch.id)}
                    className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    Đọc
                  </button>
                  {ch.status !== 'translated' && (
                    <button
                      onClick={() => handleTranslate(ch.id)}
                      disabled={!!translatingId}
                      className="text-xs px-3 py-1 bg-blue-700 hover:bg-blue-600 disabled:bg-gray-600 rounded transition-colors"
                    >
                      {translatingId === ch.id ? 'Đang dịch...' : 'Dịch'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Reading panel */}
      {activeChapter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-8">
          <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="font-medium">{activeChapter.title}</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('raw')}
                  className={`px-3 py-1 rounded text-sm ${activeTab === 'raw' ? 'bg-blue-600' : 'bg-gray-700'}`}
                >
                  Gốc (中文)
                </button>
                <button
                  onClick={() => setActiveTab('translated')}
                  disabled={!activeChapter.translatedContent}
                  className={`px-3 py-1 rounded text-sm ${activeTab === 'translated' ? 'bg-green-600' : 'bg-gray-700'} disabled:opacity-50`}
                >
                  Bản dịch
                </button>
                <button
                  onClick={() => setActiveChapter(null)}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                >
                  Đóng
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6 whitespace-pre-wrap leading-relaxed">
              {activeTab === 'raw' ? activeChapter.rawContent : activeChapter.translatedContent}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
