'use client'

import React from 'react'
import { Chapter } from '@/shared/types'
import { DisplayMode } from './ReaderToolbar'

interface ReaderContentProps {
  chapter: Chapter | null
  displayMode: DisplayMode
  fontSize: number
  scrollRef: React.RefObject<HTMLDivElement | null>
  onScroll: (scrollTop: number) => void
  isLoadingChapter: boolean
  isTranslating: boolean
  translationProgress: number
  translationError: string | null
  onTranslateChapter: () => void
  onPrevChapter: () => void
  onNextChapter: () => void
  hasPrev: boolean
  hasNext: boolean
}

export default function ReaderContent({
  chapter,
  displayMode,
  fontSize,
  scrollRef,
  onScroll,
  isLoadingChapter,
  isTranslating,
  translationProgress,
  translationError,
  onTranslateChapter,
  onPrevChapter,
  onNextChapter,
  hasPrev,
  hasNext,
}: ReaderContentProps) {
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    onScroll(e.currentTarget.scrollTop)
  }

  // Loading state
  if (isLoadingChapter) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <div className="inline-block w-6 h-6 border-2 border-gray-600 border-t-blue-500 rounded-full animate-spin mb-3" />
          <p className="text-sm">Đang tải chương...</p>
        </div>
      </div>
    )
  }

  // Empty state
  if (!chapter) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-lg mb-2">Chọn một chương để bắt đầu đọc</p>
          <p className="text-sm">Sử dụng sidebar bên trái hoặc phím ← →</p>
        </div>
      </div>
    )
  }

  const hasTranslation = chapter.status === 'translated' && chapter.translatedContent
  const hasHanViet = !!chapter.convertedContent

  // Translation banner for untranslated chapters
  const TranslationBanner = () => {
    // Translation error
    if (translationError) {
      return (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-red-300 text-sm">Lỗi dịch thuật</p>
            <p className="text-red-400 text-xs mt-1">{translationError}</p>
          </div>
          <button
            onClick={onTranslateChapter}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white transition-colors shrink-0 ml-3"
          >
            Thử lại
          </button>
        </div>
      )
    }

    if (hasTranslation && displayMode === 'vi') return null
    if (hasTranslation && displayMode === 'side-by-side') return null
    if (hasHanViet && displayMode === 'hanviet') return null

    if (isTranslating) {
      return (
        <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-300 text-sm">Đang dịch...</span>
            <span className="text-blue-400 text-xs">{Math.round(translationProgress)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1.5">
            <div
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${translationProgress}%` }}
            />
          </div>
        </div>
      )
    }

    if (displayMode === 'hanviet' && !hasHanViet) {
      return (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-4 text-center">
          <p className="text-yellow-300 text-sm">Chưa có bản Hán Việt cho chương này</p>
          <p className="text-yellow-500 text-xs mt-1">Vui lòng dịch ở trang Dịch nhanh trước</p>
        </div>
      )
    }

    if ((displayMode === 'vi' || displayMode === 'side-by-side') && !hasTranslation) {
      return (
        <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-4 flex items-center justify-between">
          <span className="text-yellow-300 text-sm">Chương này chưa được dịch</span>
          <button
            onClick={onTranslateChapter}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white transition-colors"
          >
            Dịch ngay
          </button>
        </div>
      )
    }

    return null
  }

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 overflow-auto p-4 md:p-6"
    >
      <TranslationBanner />

      {displayMode === 'vi' && (
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-medium text-white mb-6">
            {chapter.title || `Chương ${chapter.index + 1}`}
          </h2>
          <div
            className="text-gray-200 whitespace-pre-wrap leading-relaxed"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
          >
            {hasTranslation ? chapter.translatedContent : chapter.rawContent || 'Chưa có nội dung'}
          </div>
        </div>
      )}

      {displayMode === 'side-by-side' && (
        <div>
          <h2 className="text-xl font-medium text-white mb-6">
            {chapter.title || `Chương ${chapter.index + 1}`}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Nguyên văn</p>
              <div
                className="text-gray-400 whitespace-pre-wrap"
                style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
              >
                {chapter.rawContent || 'Chưa có nội dung gốc'}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Bản dịch</p>
              <div
                className="text-green-100 whitespace-pre-wrap"
                style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
              >
                {hasTranslation ? chapter.translatedContent : 'Chưa dịch'}
              </div>
            </div>
          </div>
        </div>
      )}

      {displayMode === 'hanviet' && (
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-medium text-white mb-6">
            {chapter.title || `Chương ${chapter.index + 1}`}
          </h2>
          <div
            className="text-yellow-100 whitespace-pre-wrap leading-relaxed"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
          >
            {hasHanViet ? chapter.convertedContent : chapter.rawContent || 'Chưa có nội dung'}
          </div>
        </div>
      )}

      {/* Bottom navigation */}
      <div className="max-w-3xl mx-auto mt-12 mb-6">
        <div className="border-t border-gray-700 pt-6 flex items-center justify-between">
          <button
            onClick={onPrevChapter}
            disabled={!hasPrev}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed rounded text-sm text-white transition-colors"
          >
            &#9664; Chương trước
          </button>
          <span className="text-gray-500 text-sm">— Hết chương —</span>
          <button
            onClick={onNextChapter}
            disabled={!hasNext}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed rounded text-sm text-white transition-colors"
          >
            Chương sau &#9654;
          </button>
        </div>
      </div>
    </div>
  )
}
