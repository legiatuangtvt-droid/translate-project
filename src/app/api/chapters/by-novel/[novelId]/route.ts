import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/sqlite'

export async function GET(_request: Request, { params }: { params: Promise<{ novelId: string }> }) {
  try {
    const { novelId } = await params
    const db = getDatabase()
    const chapters = db.getChaptersByNovel(novelId)
    return NextResponse.json(chapters)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
