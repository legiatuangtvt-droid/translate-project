import { NextResponse } from 'next/server'
import { FanqieCrawler } from '@/lib/crawler/sites/fanqie'

export async function POST(request: Request) {
  try {
    const { url } = await request.json()
    const crawler = new FanqieCrawler()
    const novel = await crawler.getNovelInfo(url)
    return NextResponse.json(novel)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
