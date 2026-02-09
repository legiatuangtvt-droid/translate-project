import { Novel, Chapter } from '@/shared/types'

export abstract class BaseCrawler {
  protected baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  abstract search(keyword: string): Promise<Novel[]>
  abstract getNovelInfo(url: string): Promise<Novel>
  abstract getChapterList(novelId: string): Promise<Chapter[]>
  abstract getChapterContent(chapterUrl: string): Promise<string>

  protected async delay(ms: number = 1000): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
