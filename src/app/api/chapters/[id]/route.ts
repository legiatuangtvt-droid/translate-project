import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/sqlite'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = getDatabase()
    const chapter = db.getChapter(id)
    if (!chapter) return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    return NextResponse.json(chapter)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { rawContent, convertedContent, translatedContent, status, title } = await request.json()
    const db = getDatabase()

    db.updateChapterContent(id, rawContent, convertedContent, translatedContent, status, title)

    const updatedChapter = db.getChapter(id)
    if (!updatedChapter) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
    }
    return NextResponse.json(updatedChapter)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
