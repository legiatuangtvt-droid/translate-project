import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/sqlite'
import { generateId } from '@/shared/utils'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const db = getDatabase()
    const chapter = {
      id: generateId(),
      novelId: data.novelId,
      index: data.index || 0,
      title: data.title || '',
      sourceUrl: data.sourceUrl || '',
      rawContent: data.rawContent || '',
      convertedContent: data.convertedContent || undefined,
      translatedContent: data.translatedContent || undefined,
      status: (data.status || 'pending') as 'pending' | 'crawled' | 'translating' | 'translated',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    db.saveChapter(chapter)
    db.updateNovelChapterCount(chapter.novelId)
    return NextResponse.json(chapter, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
