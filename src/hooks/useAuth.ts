'use client'

import { useState, useEffect } from 'react'
import { type User } from 'firebase/auth'
import { onAuthChange } from '@/lib/firebase/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUser(user)
      setIsLoading(false)
    })
    return unsubscribe
  }, [])

  return { user, isLoading }
}
