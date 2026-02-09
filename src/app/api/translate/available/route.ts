import { NextResponse } from 'next/server'
import { getTranslatorManager } from '@/lib/translator'

export async function GET() {
  const manager = getTranslatorManager()
  if (process.env.GEMINI_API_KEY) {
    manager.initGemini(process.env.GEMINI_API_KEY)
  }
  return NextResponse.json(manager.getAvailableTranslators())
}
