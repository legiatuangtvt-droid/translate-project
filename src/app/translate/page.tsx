'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { Chapter, HanVietSegment, GlossaryEntry } from '@/shared/types'
import { useHanViet } from '@/hooks/useHanViet'
import { useTranslation } from '@/hooks/useTranslation'
import { useGlossary } from '@/hooks/useGlossary'
import NovelSelector from '@/components/translate/NovelSelector'
import ChapterSidebar from '@/components/translate/ChapterSidebar'
import EnhancedGlossaryPanel from '@/components/translate/EnhancedGlossaryPanel'

// Render segments with hover highlighting + click/shift-click to edit
function SegmentRenderer({
  segments,
  mode,
  hoveredIndex,
  hoveredGlossaryOriginal,
  selectedRange,
  onHover,
  onHoverGlossary,
  onClickSegment,
  glossaryOriginals,
}: {
  segments: HanVietSegment[]
  mode: 'original' | 'hanviet'
  hoveredIndex: number | null
  hoveredGlossaryOriginal?: string | null
  selectedRange?: { start: number; end: number } | null
  onHover: (index: number | null) => void
  onHoverGlossary?: (original: string | null) => void
  onClickSegment?: (index: number, rect: { top: number; left: number; bottom: number }, shiftKey: boolean) => void
  glossaryOriginals?: Set<string>
}) {
  let prevWasCJK = false

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.isCJK) {
          const text = mode === 'original' ? seg.original : (seg.hanviet || `[${seg.original}]`)
          const needSpace = prevWasCJK && mode === 'hanviet'
          prevWasCJK = true
          const isSelected = selectedRange && i >= selectedRange.start && i <= selectedRange.end
          const isHighlighted = hoveredIndex === i ||
            (hoveredGlossaryOriginal != null && seg.original === hoveredGlossaryOriginal)
          return (
            <span key={i}>
              {needSpace && ' '}
              <span
                className={`cursor-pointer transition-colors duration-100 rounded px-0.5 -mx-0.5 ${
                  isSelected ? 'bg-orange-500/40' :
                  isHighlighted ? 'bg-blue-500/40' : 'hover:bg-blue-500/20'
                }`}
                onMouseEnter={() => {
                  onHover(i)
                  if (onHoverGlossary && glossaryOriginals?.has(seg.original)) {
                    onHoverGlossary(seg.original)
                  }
                }}
                onMouseLeave={() => {
                  onHover(null)
                  if (onHoverGlossary) onHoverGlossary(null)
                }}
                onClick={(e) => {
                  if (onClickSegment) {
                    const r = e.currentTarget.getBoundingClientRect()
                    onClickSegment(i, { top: r.top, left: r.left, bottom: r.bottom }, e.shiftKey)
                  }
                }}
              >
                {text}
              </span>
            </span>
          )
        } else {
          prevWasCJK = false
          return <span key={i}>{seg.original}</span>
        }
      })}
    </>
  )
}

// Render Vietnamese text with clickable glossary terms
function VietnameseRenderer({
  text,
  glossaryEntries,
  hoveredGlossaryOriginal,
  onHoverGlossary,
  onClickEntry,
}: {
  text: string
  glossaryEntries: GlossaryEntry[]
  hoveredGlossaryOriginal: string | null
  onHoverGlossary: (original: string | null) => void
  onClickEntry: (entry: GlossaryEntry, rect: { top: number; left: number; bottom: number }) => void
}) {
  const parts = useMemo(() => {
    // Get entries that have a replacement value in the Vietnamese text
    // Same logic as buildNameReplacer: vietnamese || (char/loc ? translated : null)
    const replaceableEntries = glossaryEntries
      .map(e => {
        let replacement: string | null = null
        if (e.vietnamese) replacement = e.vietnamese
        else if ((e.type === 'character' || e.type === 'location') && e.translated) replacement = e.translated
        return replacement ? { entry: e, replacement } : null
      })
      .filter((x): x is { entry: GlossaryEntry; replacement: string } => x !== null)
      .sort((a, b) => b.replacement.length - a.replacement.length)

    if (replaceableEntries.length === 0) return [{ text, entry: null as GlossaryEntry | null }]

    // Build regex matching all replacement values
    const escaped = replaceableEntries.map(x => x.replacement.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    const regex = new RegExp(`(${escaped.join('|')})`, 'g')

    const result: Array<{ text: string; entry: GlossaryEntry | null }> = []
    let lastIndex = 0
    let match

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        result.push({ text: text.slice(lastIndex, match.index), entry: null })
      }
      const matched = replaceableEntries.find(x => x.replacement === match![0])
      result.push({ text: match[0], entry: matched?.entry || null })
      lastIndex = regex.lastIndex
    }

    if (lastIndex < text.length) {
      result.push({ text: text.slice(lastIndex), entry: null })
    }

    return result
  }, [text, glossaryEntries])

  return (
    <>
      {parts.map((part, i) => {
        if (part.entry) {
          const isHighlighted = hoveredGlossaryOriginal === part.entry.original
          return (
            <span
              key={i}
              className={`cursor-pointer transition-colors duration-100 rounded px-0.5 -mx-0.5 ${
                isHighlighted ? 'bg-blue-500/40' : 'hover:bg-blue-500/20'
              }`}
              onMouseEnter={() => onHoverGlossary(part.entry!.original)}
              onMouseLeave={() => onHoverGlossary(null)}
              onClick={(e) => {
                const r = e.currentTarget.getBoundingClientRect()
                onClickEntry(part.entry!, { top: r.top, left: r.left, bottom: r.bottom })
              }}
            >
              {part.text}
            </span>
          )
        }
        return <span key={i}>{part.text}</span>
      })}
    </>
  )
}

/** Check if a glossary pattern entry (with {n}) matches a given text */
function matchesPattern(pattern: string, text: string): boolean {
  if (!pattern.includes('{n}')) return false
  const escaped = pattern
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace('\\{n\\}', '\\d+')
  return new RegExp(`^${escaped}$`).test(text)
}

// Popup for editing glossary entry on a clicked segment (or range)
function GlossaryPopup({
  original,
  hanviet,
  position,
  existingEntry,
  onSave,
  onDelete,
  onClose,
}: {
  original: string   // combined Chinese original (may be multi-char)
  hanviet: string    // combined Hán Việt reading
  position: { top: number; left: number; bottom: number }
  existingEntry: GlossaryEntry | undefined
  onSave: (original: string, translated: string, type: GlossaryEntry['type'], vietnamese?: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}) {
  // Detect if this is a pattern entry (第{n}章 → Chương {n})
  const isPattern = existingEntry?.original.includes('{n}') || false
  const displayOriginal = isPattern ? existingEntry!.original : original

  const [translated, setTranslated] = useState(existingEntry?.translated || hanviet || '')
  const [vietnamese, setVietnamese] = useState(existingEntry?.vietnamese || '')
  const [type, setType] = useState<GlossaryEntry['type']>(existingEntry?.type || 'other')
  const [saving, setSaving] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  // Close on click outside (but not on Shift+Click, to allow range selection)
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.shiftKey) return
      if (popupRef.current && popupRef.current.contains(e.target as Node)) return
      onClose()
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [onClose])

  const handleSave = async () => {
    if (!translated.trim() || saving) return
    setSaving(true)
    try {
      await onSave(displayOriginal, translated.trim(), type, vietnamese.trim() || undefined)
    } finally {
      setSaving(false)
    }
  }

  // Position below segment, or above if near bottom of screen
  const showAbove = position.bottom + 220 > window.innerHeight
  const style: React.CSSProperties = {
    position: 'fixed',
    left: Math.max(8, Math.min(position.left, window.innerWidth - 296)),
    zIndex: 50,
    ...(showAbove
      ? { bottom: window.innerHeight - position.top + 8 }
      : { top: position.bottom + 8 }),
  }

  return (
    <div ref={popupRef} style={style} className="bg-gray-800 border border-gray-600 rounded-lg shadow-2xl p-3 w-72">
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-xl text-white font-medium">{displayOriginal}</span>
          {isPattern ? (
            <span className="text-xs text-purple-400 bg-purple-900/40 px-1.5 py-0.5 rounded">mẫu</span>
          ) : (
            <span className="text-sm text-yellow-400">{hanviet}</span>
          )}
        </div>
        {isPattern && (
          <div className="text-xs text-gray-500 mb-2">
            Áp dụng: {original} → {hanviet}
          </div>
        )}
        <div className="space-y-2">
          <input
            type="text"
            value={translated}
            onChange={(e) => setTranslated(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') onClose()
            }}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
            placeholder="Hán Việt..."
            autoFocus
          />
          <input
            type="text"
            value={vietnamese}
            onChange={(e) => setVietnamese(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') onClose()
            }}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-green-300 focus:outline-none focus:border-green-500"
            placeholder="Nghĩa Việt (VD: hắn)"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as GlossaryEntry['type'])}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="other">Khác</option>
            <option value="character">Nhân vật</option>
            <option value="location">Địa danh</option>
            <option value="term">Thuật ngữ</option>
          </select>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!translated.trim() || saving}
              className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm text-white font-medium transition-colors"
            >
              {saving ? '...' : existingEntry ? 'Cập nhật' : 'Thêm'}
            </button>
            {existingEntry && (
              <button
                onClick={() => onDelete(existingEntry.id)}
                className="px-3 py-1.5 bg-red-800 hover:bg-red-700 rounded text-sm text-red-200 transition-colors"
              >
                Xóa
              </button>
            )}
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
    </div>
  )
}

export default function TranslatePage() {
  const [inputText, setInputText] = useState('')
  const [style, setStyle] = useState<'convert' | 'literary'>('literary')
  const [showGlossary, setShowGlossary] = useState(false)
  const [showVietnamese, setShowVietnamese] = useState(true)

  // Novel & chapter state
  const [selectedNovelId, setSelectedNovelId] = useState<string | null>(null)
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [showChapters, setShowChapters] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Segment highlight + click-to-edit state
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null)
  const [hoveredGlossaryOriginal, setHoveredGlossaryOriginal] = useState<string | null>(null)
  const [clickedSegment, setClickedSegment] = useState<{
    startIndex: number
    endIndex: number
    original: string     // combined Chinese original
    hanviet: string      // combined Hán Việt reading
    position: { top: number; left: number; bottom: number }
  } | null>(null)

  // Scroll sync refs
  const chineseScrollRef = useRef<HTMLDivElement>(null)
  const hanvietScrollRef = useRef<HTMLDivElement>(null)
  const vietnameseScrollRef = useRef<HTMLDivElement>(null)
  const isSyncingScroll = useRef(false)

  const { result: hanvietResult, setResult: setHanvietResult, isConverting, convert: convertHanViet, clear: clearHanViet } = useHanViet()
  const { result: viResult, setResult: setViResult, isTranslating, progress, error, translateText, clear: clearTranslation } = useTranslation()
  const { entries: glossaryEntries, isLoading: glossaryLoading, addEntry, updateEntry, deleteEntry } = useGlossary(selectedNovelId || undefined)

  // Set of glossary originals (character/location) for cross-panel hover
  const glossaryOriginals = useMemo(() => {
    const set = new Set<string>()
    for (const e of glossaryEntries) {
      // Include entries that have a Vietnamese replacement value
      if (e.vietnamese || e.type === 'character' || e.type === 'location') {
        set.add(e.original.replace(/\s/g, ''))
      }
    }
    return set
  }, [glossaryEntries])

  // Scroll sync handler — sync all 3 panels by scroll ratio
  const scrollRefs = useMemo(() => ({
    chinese: chineseScrollRef,
    hanviet: hanvietScrollRef,
    vietnamese: vietnameseScrollRef,
  }), [])

  const handleScroll = useCallback((source: 'chinese' | 'hanviet' | 'vietnamese') => {
    if (isSyncingScroll.current) return
    isSyncingScroll.current = true

    const sourceEl = scrollRefs[source].current
    if (sourceEl) {
      const maxScroll = sourceEl.scrollHeight - sourceEl.clientHeight
      const ratio = maxScroll > 0 ? sourceEl.scrollTop / maxScroll : 0
      for (const [key, ref] of Object.entries(scrollRefs)) {
        if (key !== source && ref.current) {
          const targetMax = ref.current.scrollHeight - ref.current.clientHeight
          ref.current.scrollTop = ratio * targetMax
        }
      }
    }

    requestAnimationFrame(() => {
      isSyncingScroll.current = false
    })
  }, [scrollRefs])

  // Auto-save Vietnamese translation to current chapter when translation completes
  const prevTranslating = useRef(false)
  useEffect(() => {
    if (prevTranslating.current && !isTranslating && currentChapterId && viResult) {
      // Translation just finished → save to current chapter
      fetch(`/api/chapters/${currentChapterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          translatedContent: viResult,
          convertedContent: hanvietResult?.hanvietText || undefined,
          status: 'translated'
        })
      }).then(res => {
        if (res.ok) {
          res.json().then(updated => {
            setChapters(prev => prev.map(ch =>
              ch.id === currentChapterId ? updated : ch
            ))
          })
        }
      }).catch(console.error)
    }
    prevTranslating.current = isTranslating
  }, [isTranslating, currentChapterId, viResult, hanvietResult])

  // Fetch chapters when novel selected
  useEffect(() => {
    if (!selectedNovelId) {
      setChapters([])
      setCurrentChapterId(null)
      setShowChapters(false)
      return
    }
    fetch(`/api/chapters/by-novel/${selectedNovelId}`)
      .then(res => res.json())
      .then(data => setChapters(Array.isArray(data) ? data : []))
      .catch(console.error)
  }, [selectedNovelId])

  const handleNovelSelect = useCallback((novelId: string | null) => {
    setSelectedNovelId(novelId)
    setCurrentChapterId(null)
    if (novelId) setShowChapters(true)
  }, [])

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return
    const glossaryForConverter = glossaryEntries.map(e => ({
      original: e.original,
      translated: e.translated,
      vietnamese: e.vietnamese,
      type: e.type
    }))
    convertHanViet(inputText, glossaryForConverter)
    translateText(inputText, style, glossaryForConverter)
  }, [inputText, style, convertHanViet, translateText, glossaryEntries])

  const handleClear = useCallback(() => {
    setInputText('')
    clearHanViet()
    clearTranslation()
    setCurrentChapterId(null)
  }, [clearHanViet, clearTranslation])

  const handleLoadChapter = useCallback(async (chapterId: string) => {
    try {
      const res = await fetch(`/api/chapters/${chapterId}`)
      if (!res.ok) throw new Error('Failed to load chapter')
      const chapter = await res.json()
      setInputText(chapter.rawContent || '')
      setCurrentChapterId(chapterId)

      if (chapter.rawContent) {
        const glossaryForConverter = glossaryEntries.map(e => ({
          original: e.original,
          translated: e.translated,
          type: e.type
        }))
        convertHanViet(chapter.rawContent, glossaryForConverter)
      } else {
        clearHanViet()
      }

      if (chapter.translatedContent) {
        setViResult(chapter.translatedContent)
        setShowVietnamese(true)
      } else {
        setViResult(null)
      }
    } catch (error) {
      console.error('Failed to load chapter:', error)
    }
  }, [glossaryEntries, convertHanViet, clearHanViet, setViResult])

  const handleSaveNewChapter = useCallback(async (title: string, index: number) => {
    if (!selectedNovelId || !title.trim()) return
    setIsSaving(true)
    try {
      const res = await fetch('/api/chapters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          novelId: selectedNovelId,
          title: title.trim(),
          index,
          rawContent: inputText,
          convertedContent: hanvietResult?.hanvietText || undefined,
          translatedContent: viResult || undefined,
          status: viResult ? 'translated' : 'pending'
        })
      })
      if (!res.ok) throw new Error('Failed to save chapter')
      const newChapter = await res.json()
      setChapters(prev => [...prev, newChapter])
      setCurrentChapterId(newChapter.id)
    } catch (error) {
      console.error('Failed to save chapter:', error)
    } finally {
      setIsSaving(false)
    }
  }, [selectedNovelId, inputText, hanvietResult, viResult])

  const handleUpdateChapter = useCallback(async () => {
    if (!currentChapterId) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/chapters/${currentChapterId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawContent: inputText,
          convertedContent: hanvietResult?.hanvietText || undefined,
          translatedContent: viResult || undefined,
          status: viResult ? 'translated' : 'pending'
        })
      })
      if (!res.ok) throw new Error('Failed to update chapter')
      const updated = await res.json()
      setChapters(prev => prev.map(ch =>
        ch.id === currentChapterId ? updated : ch
      ))
    } catch (error) {
      console.error('Failed to update chapter:', error)
    } finally {
      setIsSaving(false)
    }
  }, [currentChapterId, inputText, hanvietResult, viResult])

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === 'Enter') {
      handleTranslate()
    }
  }, [handleTranslate])

  // Click on segment → open glossary popup; Shift+click → extend range
  const handleSegmentClick = useCallback((index: number, rect: { top: number; left: number; bottom: number }, shiftKey: boolean) => {
    if (!hanvietResult) return
    const seg = hanvietResult.segments[index]
    if (!seg || !seg.isCJK) return

    if (shiftKey && clickedSegment) {
      // Shift+click: extend selection range
      const start = Math.min(clickedSegment.startIndex, index)
      const end = Math.max(clickedSegment.endIndex, index)
      let combinedOriginal = ''
      const hanvietParts: string[] = []
      for (let i = start; i <= end; i++) {
        const s = hanvietResult.segments[i]
        if (s.isCJK) {
          combinedOriginal += s.original
          if (s.hanviet) hanvietParts.push(s.hanviet)
        }
      }
      setClickedSegment({
        startIndex: start,
        endIndex: end,
        original: combinedOriginal,
        hanviet: hanvietParts.join(' '),
        position: rect,
      })
    } else {
      // Normal click: single segment
      setClickedSegment({
        startIndex: index,
        endIndex: index,
        original: seg.original,
        hanviet: seg.hanviet || '',
        position: rect,
      })
    }
  }, [hanvietResult, clickedSegment])

  // Save glossary entry from popup → re-convert
  const handlePopupSave = useCallback(async (original: string, translated: string, type: GlossaryEntry['type'], vietnamese?: string) => {
    const cleanOriginal = original.replace(/\s/g, '')
    const existing = glossaryEntries.find(e => e.original.replace(/\s/g, '') === cleanOriginal)

    if (existing) {
      await updateEntry(existing.id, original, translated, type, vietnamese)
    } else {
      await addEntry(original, translated, type, undefined, vietnamese)
    }

    // Build updated glossary (state not yet updated)
    const updatedGlossary = existing
      ? glossaryEntries.map(e =>
          e.id === existing.id
            ? { original, translated, type }
            : { original: e.original, translated: e.translated, type: e.type }
        )
      : [
          ...glossaryEntries.map(e => ({ original: e.original, translated: e.translated, type: e.type })),
          { original, translated, type }
        ]

    // Re-convert with updated glossary
    convertHanViet(inputText, updatedGlossary)
    setClickedSegment(null)
  }, [glossaryEntries, updateEntry, addEntry, convertHanViet, inputText])

  // Delete glossary entry from popup → re-convert
  const handlePopupDelete = useCallback(async (entryId: string) => {
    await deleteEntry(entryId)

    const updatedGlossary = glossaryEntries
      .filter(e => e.id !== entryId)
      .map(e => ({ original: e.original, translated: e.translated, type: e.type }))

    convertHanViet(inputText, updatedGlossary)
    setClickedSegment(null)
  }, [glossaryEntries, deleteEntry, convertHanViet, inputText])

  const gridClass = showVietnamese ? 'grid-cols-3' : 'grid-cols-2'

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-3">
      {/* Top bar: novel selector + action buttons */}
      <div className="flex items-center gap-3 shrink-0">
        <NovelSelector
          selectedNovelId={selectedNovelId}
          onSelect={handleNovelSelect}
        />
        <div className="flex-1" />
        <select
          className="bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white"
          value={style}
          onChange={(e) => setStyle(e.target.value as 'convert' | 'literary')}
        >
          <option value="literary">Văn học</option>
          <option value="convert">Sát nghĩa</option>
        </select>
        <button
          onClick={handleTranslate}
          disabled={!inputText.trim() || isTranslating}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded text-sm text-white font-medium transition-colors"
        >
          {isTranslating ? 'Đang dịch...' : 'Dịch'}
        </button>
        <button
          onClick={() => setShowGlossary(!showGlossary)}
          className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
            showGlossary
              ? 'bg-orange-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
        >
          Từ điển ({glossaryEntries.length})
        </button>
        {selectedNovelId && (
          <button
            onClick={() => setShowChapters(!showChapters)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              showChapters
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
          >
            Chương ({chapters.length})
          </button>
        )}
        <button
          onClick={handleClear}
          className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition-colors"
        >
          Xóa
        </button>
      </div>

      {/* Progress bar */}
      {(isTranslating || isConverting) && (
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex-1 bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: progress ? `${((progress.current + 1) / progress.total) * 100}%` : '0%'
              }}
            />
          </div>
          <span className="text-sm text-gray-400 whitespace-nowrap">
            {isConverting && 'Chuyển Hán Việt...'}
            {isTranslating && progress && `Dịch ${progress.current + 1}/${progress.total} chunks`}
            {isTranslating && !progress && 'Đang kết nối...'}
          </span>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 border border-red-700 rounded px-4 py-2 text-red-300 text-sm shrink-0">
          {error}
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex gap-3 min-h-0">
        {/* Chapter sidebar */}
        {selectedNovelId && showChapters && (
          <ChapterSidebar
            chapters={chapters}
            currentChapterId={currentChapterId}
            onLoadChapter={handleLoadChapter}
            onSaveNew={handleSaveNewChapter}
            onUpdateCurrent={handleUpdateChapter}
            isSaving={isSaving}
          />
        )}

        {/* Panel grid */}
        <div className={`flex-1 grid ${gridClass} gap-3 min-h-0`}>
          {/* Panel 1: Chinese Original (editable) */}
          <div className="flex flex-col bg-gray-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-750 border-b border-gray-700">
              <span className="text-sm font-medium text-gray-300">中文 (Gốc) — {inputText.length} ký tự</span>
              {inputText && (
                <button
                  onClick={() => copyToClipboard(inputText)}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Copy
                </button>
              )}
            </div>
            {hanvietResult ? (
              // After conversion: show segments with hover highlight + scroll sync
              <div
                ref={chineseScrollRef}
                onScroll={() => handleScroll('chinese')}
                className="flex-1 overflow-auto p-4 text-gray-100 whitespace-pre-wrap leading-relaxed"
              >
                <SegmentRenderer
                  segments={hanvietResult.segments}
                  mode="original"
                  hoveredIndex={hoveredSegment}
                  hoveredGlossaryOriginal={hoveredGlossaryOriginal}
                  selectedRange={clickedSegment ? { start: clickedSegment.startIndex, end: clickedSegment.endIndex } : null}
                  onHover={setHoveredSegment}
                  onHoverGlossary={setHoveredGlossaryOriginal}
                  onClickSegment={handleSegmentClick}
                  glossaryOriginals={glossaryOriginals}
                />
              </div>
            ) : (
              // Before conversion: editable textarea
              <textarea
                className="flex-1 bg-transparent p-4 text-gray-100 placeholder-gray-500 resize-none focus:outline-none leading-relaxed"
                placeholder="Paste tiếng Trung vào đây... (Ctrl+Enter để dịch)"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            )}
          </div>

          {/* Panel 2: Han Viet */}
          <div className="flex flex-col bg-gray-800 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-750 border-b border-gray-700">
              <span className="text-sm font-medium text-yellow-400">Hán Việt</span>
              {hanvietResult && (
                <button
                  onClick={() => copyToClipboard(hanvietResult.hanvietText)}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Copy
                </button>
              )}
            </div>
            <div
              ref={hanvietScrollRef}
              onScroll={() => handleScroll('hanviet')}
              className="flex-1 overflow-auto p-4 text-yellow-100 whitespace-pre-wrap leading-relaxed"
            >
              {hanvietResult ? (
                <SegmentRenderer
                  segments={hanvietResult.segments}
                  mode="hanviet"
                  hoveredIndex={hoveredSegment}
                  hoveredGlossaryOriginal={hoveredGlossaryOriginal}
                  selectedRange={clickedSegment ? { start: clickedSegment.startIndex, end: clickedSegment.endIndex } : null}
                  onHover={setHoveredSegment}
                  onHoverGlossary={setHoveredGlossaryOriginal}
                  onClickSegment={handleSegmentClick}
                  glossaryOriginals={glossaryOriginals}
                />
              ) : (
                <span className="text-gray-500 italic">
                  {isConverting ? 'Đang chuyển đổi...' : 'Kết quả Hán Việt sẽ hiện ở đây'}
                </span>
              )}
            </div>
          </div>

          {/* Panel 3: Vietnamese Translation (toggleable) */}
          {showVietnamese && (
            <div className="flex flex-col bg-gray-800 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-750 border-b border-gray-700">
                <span className="text-sm font-medium text-green-400">Tiếng Việt</span>
                {viResult && (
                  <button
                    onClick={() => copyToClipboard(viResult)}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Copy
                  </button>
                )}
              </div>
              <div
                ref={vietnameseScrollRef}
                onScroll={() => handleScroll('vietnamese')}
                className="flex-1 overflow-auto p-4 text-green-100 whitespace-pre-wrap leading-relaxed"
              >
                {viResult ? (
                  <VietnameseRenderer
                    text={viResult}
                    glossaryEntries={glossaryEntries}
                    hoveredGlossaryOriginal={hoveredGlossaryOriginal}
                    onHoverGlossary={setHoveredGlossaryOriginal}
                    onClickEntry={(entry, rect) => {
                      setClickedSegment({
                        startIndex: -1,
                        endIndex: -1,
                        original: entry.original,
                        hanviet: entry.translated,
                        position: rect,
                      })
                    }}
                  />
                ) : (
                  <span className="text-gray-500 italic">
                    {isTranslating ? 'Đang dịch...' : 'Bản dịch tiếng Việt sẽ hiện ở đây'}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Glossary panel */}
        {showGlossary && (
          <div className="w-80 min-h-0">
            <EnhancedGlossaryPanel
              entries={glossaryEntries}
              onAdd={addEntry}
              onUpdate={updateEntry}
              onDelete={deleteEntry}
              isLoading={glossaryLoading}
              novelId={selectedNovelId}
            />
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="flex items-center justify-end text-sm shrink-0">
        <div className="flex gap-2">
          {hanvietResult && (
            <button
              onClick={() => copyToClipboard(hanvietResult.hanvietText)}
              className="px-3 py-1 bg-yellow-800 hover:bg-yellow-700 rounded text-yellow-200 transition-colors"
            >
              Copy Hán Việt
            </button>
          )}
          {viResult && (
            <button
              onClick={() => copyToClipboard(viResult)}
              className="px-3 py-1 bg-green-800 hover:bg-green-700 rounded text-green-200 transition-colors"
            >
              Copy Tiếng Việt
            </button>
          )}
        </div>
      </div>

      {/* Glossary popup on segment click */}
      {clickedSegment && (
        <GlossaryPopup
          original={clickedSegment.original}
          hanviet={clickedSegment.hanviet}
          position={clickedSegment.position}
          existingEntry={
            // Direct match first, then pattern match (第{n}章 → 第1章)
            glossaryEntries.find(
              e => e.original.replace(/\s/g, '') === clickedSegment.original
            ) || glossaryEntries.find(
              e => matchesPattern(e.original, clickedSegment.original)
            )
          }
          onSave={handlePopupSave}
          onDelete={handlePopupDelete}
          onClose={() => setClickedSegment(null)}
        />
      )}
    </div>
  )
}
