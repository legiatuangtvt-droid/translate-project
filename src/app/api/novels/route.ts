import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/sqlite'
import { generateId } from '@/shared/utils'

export async function GET() {
  try {
    const db = getDatabase()
    const novels = db.getAllNovels()
    return NextResponse.json(novels)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const db = getDatabase()
    const novel = {
      id: generateId(),
      title: data.title || '',
      author: data.author || '',
      cover: data.cover || '',
      sourceUrl: data.sourceUrl || '',
      sourceSite: data.sourceSite || 'manual' as const,
      totalChapters: data.totalChapters || 0,
      lastUpdated: new Date(),
      createdAt: new Date()
    }
    db.saveNovel(novel)
    return NextResponse.json(novel, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
