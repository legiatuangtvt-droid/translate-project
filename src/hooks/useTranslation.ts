'use client'

import { useState, useCallback, useRef } from 'react'

interface TranslationProgress {
  current: number
  total: number
}

export function useTranslation() {
  const [result, setResult] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [progress, setProgress] = useState<TranslationProgress | null>(null)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const translateText = useCallback(async (
    text: string,
    style: 'convert' | 'literary' = 'literary',
    glossary?: Array<{ original: string; translated: string; vietnamese?: string; type?: string }>
  ) => {
    if (!text.trim()) return

    // Abort previous request
    if (abortRef.current) {
      abortRef.current.abort()
    }

    const controller = new AbortController()
    abortRef.current = controller

    setIsTranslating(true)
    setResult(null)
    setProgress(null)
    setError(null)

    try {
      const response = await fetch('/api/translate/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, style, glossary }),
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error('Translation failed')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      if (!reader) throw new Error('No response body')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6))
              if (event.type === 'progress') {
                setProgress({ current: event.current, total: event.total })
              } else if (event.type === 'chunk') {
                accumulated += (accumulated ? '\n\n' : '') + event.text
                setResult(accumulated)
              } else if (event.type === 'done') {
                setResult(event.translated)
              } else if (event.type === 'error') {
                setError(event.message)
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setError(err.message)
      }
    } finally {
      setIsTranslating(false)
      abortRef.current = null
    }
  }, [])

  const clear = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
    }
    setResult(null)
    setProgress(null)
    setError(null)
    setIsTranslating(false)
  }, [])

  return { result, setResult, isTranslating, progress, error, translateText, clear }
}
