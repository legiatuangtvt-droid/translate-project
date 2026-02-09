'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { ReadingProgress } from '@/shared/types'

export function useReadingProgress(novelId: string) {
  const [progress, setProgress] = useState<ReadingProgress | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setIsLoading(true)
    fetch(`/api/reading-progress?novelId=${novelId}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.chapterId) {
          setProgress(data)
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false))
  }, [novelId])

  const saveProgress = useCallback((chapterId: string, position: number) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      fetch('/api/reading-progress', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novelId, chapterId, position })
      }).catch(console.error)
      setProgress({ novelId, chapterId, position, lastRead: new Date() })
    }, 500)
  }, [novelId])

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  return { progress, isLoading, saveProgress }
}
