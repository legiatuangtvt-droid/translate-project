import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/sqlite'
import { generateId } from '@/shared/utils'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const novelId = searchParams.get('novelId') || undefined
    const db = getDatabase()
    const glossary = db.getGlossary(novelId)
    return NextResponse.json(glossary)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const db = getDatabase()
    const entry = { id: generateId(), ...data }
    db.saveGlossaryEntry(entry)
    return NextResponse.json(entry, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const { id, original, translated, vietnamese, type } = await request.json()
    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }
    const db = getDatabase()
    db.updateGlossaryEntry(id, { original, translated, vietnamese, type })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json()
    const db = getDatabase()
    db.deleteGlossaryEntry(id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
