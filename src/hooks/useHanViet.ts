'use client'

import { useState, useCallback } from 'react'
import { HanVietResult } from '@/shared/types'

export function useHanViet() {
  const [result, setResult] = useState<HanVietResult | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const convert = useCallback(async (
    text: string,
    glossary?: Array<{ original: string; translated: string; type?: string }>
  ) => {
    if (!text.trim()) {
      setResult(null)
      return
    }
    setIsConverting(true)
    setError(null)
    try {
      const res = await fetch('/api/hanviet/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, glossary })
      })
      if (!res.ok) throw new Error('Conversion failed')
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsConverting(false)
    }
  }, [])

  const clear = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { result, setResult, isConverting, error, convert, clear }
}
