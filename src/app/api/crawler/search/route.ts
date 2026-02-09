import { NextResponse } from 'next/server'
import { FanqieCrawler } from '@/lib/crawler/sites/fanqie'

export async function POST(request: Request) {
  try {
    const { keyword } = await request.json()
    const crawler = new FanqieCrawler()
    const novels = await crawler.search(keyword)
    return NextResponse.json(novels)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
