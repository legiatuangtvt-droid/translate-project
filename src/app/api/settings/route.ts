import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/db/sqlite'

export async function GET() {
  try {
    const db = getDatabase()
    const settings = db.getSettings()
    return NextResponse.json(settings || {
      theme: 'dark',
      fontSize: 16,
      fontFamily: 'system-ui',
      translatorPrimary: 'google',
      translatorFallback: 'google',
      autoTranslate: false
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const settings = await request.json()
    const db = getDatabase()
    db.saveSettings(settings)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
