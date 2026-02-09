import { NextResponse } from 'next/server'
import { FanqieCrawler } from '@/lib/crawler/sites/fanqie'

export async function POST(request: Request) {
  try {
    const { novelId } = await request.json()
    const crawler = new FanqieCrawler()
    const chapters = await crawler.getChapterList(novelId)
    return NextResponse.json(chapters)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
