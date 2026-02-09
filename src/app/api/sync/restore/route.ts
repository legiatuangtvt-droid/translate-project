import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/sqlite'
import { Novel, Chapter, GlossaryEntry, ReadingProgress, AppSettings } from '@/shared/types'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const db = getDatabase()

    // Deserialize dates from JSON strings
    const novels: Novel[] = (data.novels || []).map((n: any) => ({
      ...n,
      lastUpdated: new Date(n.lastUpdated),
      createdAt: new Date(n.createdAt)
    }))

    const chapters: Chapter[] = (data.chapters || []).map((c: any) => ({
      ...c,
      createdAt: new Date(c.createdAt),
      updatedAt: new Date(c.updatedAt)
    }))

    const glossary: GlossaryEntry[] = data.glossary || []

    const readingProgress: ReadingProgress[] = (data.readingProgress || []).map((rp: any) => ({
      ...rp,
      lastRead: new Date(rp.lastRead)
    }))

    const settings: AppSettings | null = data.settings || null

    db.importAll({ novels, chapters, glossary, readingProgress, settings })

    return NextResponse.json({
      success: true,
      imported: {
        novels: novels.length,
        chapters: chapters.length,
        glossary: glossary.length,
        readingProgress: readingProgress.length
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
