import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/sqlite'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = getDatabase()
    const novel = db.getNovel(id)
    if (!novel) return NextResponse.json({ error: 'Novel not found' }, { status: 404 })
    return NextResponse.json(novel)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = getDatabase()
    db.deleteNovel(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
