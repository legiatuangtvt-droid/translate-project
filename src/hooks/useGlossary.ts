'use client'

import { useState, useCallback, useEffect } from 'react'
import { GlossaryEntry } from '@/shared/types'

export function useGlossary(novelId?: string) {
  const [entries, setEntries] = useState<GlossaryEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchEntries = useCallback(async () => {
    setIsLoading(true)
    try {
      const url = novelId
        ? `/api/glossary?novelId=${novelId}`
        : '/api/glossary'
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch glossary')
      const data = await res.json()
      setEntries(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [novelId])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const addEntry = useCallback(async (
    original: string,
    translated: string,
    type: GlossaryEntry['type'],
    targetNovelId?: string | null,
    vietnamese?: string
  ) => {
    const effectiveNovelId = targetNovelId !== undefined ? targetNovelId : novelId
    const res = await fetch('/api/glossary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ original, translated, vietnamese: vietnamese || undefined, type, novelId: effectiveNovelId || undefined })
    })
    if (!res.ok) throw new Error('Failed to add entry')
    const entry = await res.json()
    setEntries(prev => [...prev, entry])
    return entry
  }, [novelId])

  const updateEntry = useCallback(async (
    id: string,
    original: string,
    translated: string,
    type: GlossaryEntry['type'],
    vietnamese?: string
  ) => {
    const res = await fetch('/api/glossary', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, original, translated, vietnamese: vietnamese ?? '', type })
    })
    if (!res.ok) throw new Error('Failed to update entry')
    setEntries(prev => prev.map(e => e.id === id
      ? { ...e, original, translated, vietnamese: vietnamese || undefined, type }
      : e
    ))
  }, [])

  const deleteEntry = useCallback(async (id: string) => {
    const res = await fetch('/api/glossary', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (!res.ok) throw new Error('Failed to delete entry')
    setEntries(prev => prev.filter(e => e.id !== id))
  }, [])

  return { entries, isLoading, error, addEntry, updateEntry, deleteEntry, refetch: fetchEntries }
}
