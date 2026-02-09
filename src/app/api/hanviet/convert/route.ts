import { NextResponse } from 'next/server'
import { convertToHanViet } from '@/lib/hanviet/converter'

export async function POST(request: Request) {
  try {
    const { text, glossary } = await request.json()
    if (!text?.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 })
    }
    const result = await convertToHanViet(text, glossary)
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
