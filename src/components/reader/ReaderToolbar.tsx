'use client'

import { Chapter } from '@/shared/types'

export type DisplayMode = 'vi' | 'side-by-side' | 'hanviet'

interface ReaderToolbarProps {
  novelTitle: string
  currentChapter: Chapter | null
  currentIndex: number
  totalChapters: number
  displayMode: DisplayMode
  fontSize: number
  showSidebar: boolean
  isLoadingChapter: boolean
  onDisplayModeChange: (mode: DisplayMode) => void
  onFontSizeChange: (size: number) => void
  onToggleSidebar: () => void
  onPrevChapter: () => void
  onNextChapter: () => void
}

const DISPLAY_MODES: { value: DisplayMode; label: string; shortLabel: string }[] = [
  { value: 'vi', label: 'Tiếng Việt', shortLabel: 'Vi' },
  { value: 'side-by-side', label: 'Song ngữ', shortLabel: '2x' },
  { value: 'hanviet', label: 'Hán Việt', shortLabel: 'HV' },
]

export default function ReaderToolbar({
  novelTitle,
  currentChapter,
  currentIndex,
  totalChapters,
  displayMode,
  fontSize,
  showSidebar,
  isLoadingChapter,
  onDisplayModeChange,
  onFontSizeChange,
  onToggleSidebar,
  onPrevChapter,
  onNextChapter,
}: ReaderToolbarProps) {
  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < totalChapters - 1

  return (
    <div className="bg-gray-800 border-b border-gray-700 px-3 py-2 flex items-center gap-2 md:gap-3 shrink-0 flex-wrap">
      {/* Sidebar toggle */}
      <button
        onClick={onToggleSidebar}
        className={`px-2 py-1 rounded text-sm transition-colors ${
          showSidebar ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
        }`}
        title="Toggle sidebar (Esc)"
      >
        &#9776;
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0 hidden sm:block">
        <span className="text-sm text-gray-300 truncate block">
          {novelTitle}
          {currentChapter && (
            <span className="text-white font-medium">
              {' — '}{currentChapter.title || `Chương ${currentChapter.index + 1}`}
            </span>
          )}
          {isLoadingChapter && (
            <span className="text-gray-500 ml-2">Đang tải...</span>
          )}
        </span>
      </div>

      {/* Chapter navigation */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onPrevChapter}
          disabled={!hasPrev || isLoadingChapter}
          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed rounded text-sm text-white transition-colors"
          title="Chương trước (←)"
        >
          &#9664;
        </button>
        <span className="text-xs text-gray-400 px-1 min-w-[3rem] text-center">
          {totalChapters > 0 ? `${currentIndex + 1}/${totalChapters}` : '—'}
        </span>
        <button
          onClick={onNextChapter}
          disabled={!hasNext || isLoadingChapter}
          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed rounded text-sm text-white transition-colors"
          title="Chương sau (→)"
        >
          &#9654;
        </button>
      </div>

      {/* Display mode */}
      <div className="flex items-center gap-0.5 shrink-0">
        {DISPLAY_MODES.map(mode => (
          <button
            key={mode.value}
            onClick={() => onDisplayModeChange(mode.value)}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              displayMode === mode.value
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="hidden md:inline">{mode.label}</span>
            <span className="md:hidden">{mode.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* Font size */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onFontSizeChange(Math.max(12, fontSize - 2))}
          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white transition-colors"
          title="Thu nhỏ chữ"
        >
          A-
        </button>
        <span className="text-xs text-gray-400 w-6 text-center">{fontSize}</span>
        <button
          onClick={() => onFontSizeChange(Math.min(28, fontSize + 2))}
          className="px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-white transition-colors"
          title="Phóng to chữ"
        >
          A+
        </button>
      </div>
    </div>
  )
}
