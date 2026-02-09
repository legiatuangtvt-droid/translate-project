import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/sqlite'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const novelId = searchParams.get('novelId')
    if (!novelId) {
      return NextResponse.json({ error: 'novelId required' }, { status: 400 })
    }
    const db = getDatabase()
    const progress = db.getProgress(novelId)
    return NextResponse.json(progress)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { novelId, chapterId, position } = await request.json()
    if (!novelId || !chapterId) {
      return NextResponse.json({ error: 'novelId and chapterId required' }, { status: 400 })
    }
    const db = getDatabase()
    db.saveProgress({ novelId, chapterId, position: position || 0, lastRead: new Date() })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
