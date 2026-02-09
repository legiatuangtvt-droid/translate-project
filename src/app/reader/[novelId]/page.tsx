'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Novel, Chapter } from '@/shared/types'
import { useReadingProgress } from '@/hooks/useReadingProgress'
import ReaderSidebar from '@/components/reader/ReaderSidebar'
import ReaderToolbar, { DisplayMode } from '@/components/reader/ReaderToolbar'
import ReaderContent from '@/components/reader/ReaderContent'

export default function ReaderPage() {
  const params = useParams()
  const novelId = params.novelId as string

  // Data state
  const [novel, setNovel] = useState<Novel | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isLoadingChapter, setIsLoadingChapter] = useState(false)

  // UI state
  const [displayMode, setDisplayMode] = useState<DisplayMode>('vi')
  const [showSidebar, setShowSidebar] = useState(true)
  const [fontSize, setFontSize] = useState(18)

  // Translation state
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationProgress, setTranslationProgress] = useState(0)
  const [translationError, setTranslationError] = useState<string | null>(null)

  // Refs
  const scrollRef = useRef<HTMLDivElement>(null)
  const restoredRef = useRef(false)

  // Reading progress hook
  const { progress, isLoading: progressLoading, saveProgress } = useReadingProgress(novelId)

  // Sorted chapters
  const sortedChapters = useMemo(
    () => [...chapters].sort((a, b) => a.index - b.index),
    [chapters]
  )

  const currentIndex = useMemo(
    () => sortedChapters.findIndex(ch => ch.id === currentChapter?.id),
    [sortedChapters, currentChapter]
  )

  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < sortedChapters.length - 1

  // Auto-hide sidebar on small screens
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    if (mq.matches) setShowSidebar(false)
  }, [])

  // Fetch novel, chapters, and settings on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [novelRes, chaptersRes, settingsRes] = await Promise.all([
          fetch(`/api/novels/${novelId}`),
          fetch(`/api/chapters/by-novel/${novelId}`),
          fetch('/api/settings'),
        ])
        const novelData = await novelRes.json()
        const chaptersData = await chaptersRes.json()
        const settingsData = await settingsRes.json()

        if (novelData?.error) {
          setLoadError('Không tìm thấy truyện')
          return
        }
        setNovel(novelData)
        if (Array.isArray(chaptersData)) setChapters(chaptersData)
        if (settingsData?.fontSize) setFontSize(settingsData.fontSize)
      } catch (err) {
        console.error('Failed to load reader data:', err)
        setLoadError('Không thể tải dữ liệu. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [novelId])

  // Restore reading progress after data loads
  useEffect(() => {
    if (restoredRef.current || progressLoading || loading || chapters.length === 0) return

    restoredRef.current = true
    const targetChapterId = progress?.chapterId
    const sorted = [...chapters].sort((a, b) => a.index - b.index)

    if (targetChapterId && sorted.some(ch => ch.id === targetChapterId)) {
      loadChapter(targetChapterId, progress?.position)
    } else if (sorted.length > 0) {
      loadChapter(sorted[0].id)
    }
  }, [progress, progressLoading, loading, chapters]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load a chapter by ID
  const loadChapter = useCallback(async (chapterId: string, restorePosition?: number) => {
    setIsLoadingChapter(true)
    setTranslationError(null)
    try {
      const res = await fetch(`/api/chapters/${chapterId}`)
      const data = await res.json()
      if (data?.error) {
        console.error('Chapter not found:', data.error)
        setIsLoadingChapter(false)
        return
      }
      setCurrentChapter(data)
      if (restorePosition === undefined) {
        saveProgress(chapterId, 0)
        if (scrollRef.current) scrollRef.current.scrollTop = 0
      } else {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (scrollRef.current) {
              scrollRef.current.scrollTop = restorePosition
            }
          })
        })
      }
    } catch (err) {
      console.error('Failed to load chapter:', err)
    } finally {
      setIsLoadingChapter(false)
    }
  }, [saveProgress])

  // Chapter navigation
  const handlePrevChapter = useCallback(() => {
    if (currentIndex > 0 && !isLoadingChapter) {
      loadChapter(sortedChapters[currentIndex - 1].id)
    }
  }, [currentIndex, sortedChapters, loadChapter, isLoadingChapter])

  const handleNextChapter = useCallback(() => {
    if (currentIndex < sortedChapters.length - 1 && !isLoadingChapter) {
      loadChapter(sortedChapters[currentIndex + 1].id)
    }
  }, [currentIndex, sortedChapters, loadChapter, isLoadingChapter])

  // Scroll tracking
  const handleScroll = useCallback((scrollTop: number) => {
    if (currentChapter) {
      saveProgress(currentChapter.id, scrollTop)
    }
  }, [currentChapter, saveProgress])

  // Translate current chapter via SSE
  const handleTranslateChapter = useCallback(async () => {
    if (!currentChapter || isTranslating) return
    setIsTranslating(true)
    setTranslationProgress(0)
    setTranslationError(null)

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId: currentChapter.id, style: 'literary' }),
      })

      if (!res.ok) {
        setTranslationError(`Lỗi server (${res.status})`)
        return
      }

      const reader = res.body?.getReader()
      if (!reader) {
        setTranslationError('Không thể đọc response stream')
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'progress') {
              setTranslationProgress(((event.current + 1) / event.total) * 100)
            } else if (event.type === 'done') {
              setCurrentChapter(prev => prev ? {
                ...prev,
                translatedContent: event.translated,
                status: 'translated' as const,
              } : null)
              setChapters(prev => prev.map(ch =>
                ch.id === currentChapter.id ? { ...ch, status: 'translated' as const } : ch
              ))
            } else if (event.type === 'error') {
              setTranslationError(event.message || 'Lỗi không xác định')
            }
          } catch {}
        }
      }
    } catch (err) {
      setTranslationError(err instanceof Error ? err.message : 'Lỗi kết nối')
    } finally {
      setIsTranslating(false)
      setTranslationProgress(0)
    }
  }, [currentChapter, isTranslating])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      switch (e.key) {
        case 'ArrowLeft':
        case '[':
          e.preventDefault()
          handlePrevChapter()
          break
        case 'ArrowRight':
        case ']':
          e.preventDefault()
          handleNextChapter()
          break
        case 'Escape':
          setShowSidebar(prev => !prev)
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handlePrevChapter, handleNextChapter])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] text-gray-400">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin mb-3" />
          <p>Đang tải...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (loadError || !novel) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">{loadError || 'Không tìm thấy truyện'}</p>
          <Link href="/reader" className="text-blue-400 hover:text-blue-300 text-sm">
            Quay lại danh sách truyện
          </Link>
        </div>
      </div>
    )
  }

  // No chapters state
  if (chapters.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)] text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">Truyện chưa có chương nào</p>
          <p className="text-sm mb-4">Hãy thêm chương từ trang Dịch hoặc Paste</p>
          <div className="flex gap-3 justify-center">
            <Link href={`/paste?novelId=${novelId}`} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors">
              Paste & Dịch
            </Link>
            <Link href="/reader" className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors">
              Quay lại
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-3">
      {showSidebar && (
        <ReaderSidebar
          chapters={chapters}
          currentChapterId={currentChapter?.id || null}
          onSelectChapter={(id) => loadChapter(id)}
        />
      )}

      <div className="flex-1 flex flex-col bg-gray-800 rounded-lg overflow-hidden min-w-0">
        <ReaderToolbar
          novelTitle={novel.title}
          currentChapter={currentChapter}
          currentIndex={currentIndex}
          totalChapters={sortedChapters.length}
          displayMode={displayMode}
          fontSize={fontSize}
          showSidebar={showSidebar}
          isLoadingChapter={isLoadingChapter}
          onDisplayModeChange={setDisplayMode}
          onFontSizeChange={setFontSize}
          onToggleSidebar={() => setShowSidebar(prev => !prev)}
          onPrevChapter={handlePrevChapter}
          onNextChapter={handleNextChapter}
        />

        <ReaderContent
          chapter={currentChapter}
          displayMode={displayMode}
          fontSize={fontSize}
          scrollRef={scrollRef}
          onScroll={handleScroll}
          isLoadingChapter={isLoadingChapter}
          isTranslating={isTranslating}
          translationProgress={translationProgress}
          translationError={translationError}
          onTranslateChapter={handleTranslateChapter}
          onPrevChapter={handlePrevChapter}
          onNextChapter={handleNextChapter}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      </div>
    </div>
  )
}
