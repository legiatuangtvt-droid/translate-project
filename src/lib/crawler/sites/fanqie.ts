import axios, { AxiosInstance } from 'axios'
import * as cheerio from 'cheerio'
import { BaseCrawler } from '../base'
import { Novel, Chapter } from '@/shared/types'
import { generateId } from '@/shared/utils'

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'

export class FanqieCrawler extends BaseCrawler {
  private client: AxiosInstance

  constructor() {
    super('https://fanqienovel.com')
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': CHROME_UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    })
  }

  async search(keyword: string): Promise<Novel[]> {
    try {
      const response = await this.client.get('/api/author/search/search_book/v1', {
        params: {
          filter: 'all',
          page_count: 0,
          page_index: 0,
          query_type: 0,
          query_word: keyword
        },
        headers: {
          'User-Agent': CHROME_UA,
          Referer: `${this.baseUrl}/search/${encodeURIComponent(keyword)}`
        }
      })

      const data = response.data
      if (data?.data?.search_book_data_list?.length) {
        return data.data.search_book_data_list.map((book: Record<string, unknown>) => ({
          id: generateId(),
          title: (book.book_name as string) || '',
          author: (book.author as string) || '',
          cover: (book.thumb_url as string) || '',
          sourceUrl: `${this.baseUrl}/page/${book.book_id}`,
          sourceSite: 'fanqie' as const,
          totalChapters: (book.serial_count as number) || 0,
          lastUpdated: new Date(),
          createdAt: new Date()
        }))
      }
      return []
    } catch (error) {
      console.error('Fanqie search error:', error)
      return []
    }
  }

  async getNovelInfo(url: string): Promise<Novel> {
    try {
      const response = await this.client.get(url)
      const $ = cheerio.load(response.data)
      const title = $('h1.info-name').text().trim() || $('h1').first().text().trim()
      const author = $('.author-name-text').text().trim() || $('.author').text().trim()
      const cover = $('img.info-cover').attr('src') || ''
      let totalChapters = 0
      const chapterCountText = $('.info-count').text()
      const chapterMatch = chapterCountText.match(/(\d+)/)
      if (chapterMatch) totalChapters = parseInt(chapterMatch[1], 10)
      return {
        id: generateId(), title, author, cover, sourceUrl: url,
        sourceSite: 'fanqie', totalChapters,
        lastUpdated: new Date(), createdAt: new Date()
      }
    } catch (error) {
      throw new Error(`Failed to get novel info: ${error}`)
    }
  }

  async getChapterList(novelId: string): Promise<Chapter[]> {
    try {
      const response = await this.client.get('/api/reader/directory/detail', {
        params: { bookId: novelId }
      })
      const chapters: Chapter[] = []
      const data = response.data
      if (data?.data?.allItemIds && data?.data?.allItems) {
        const items = data.data.allItems
        let index = 0
        for (const itemId of data.data.allItemIds) {
          const item = items[itemId]
          if (item) {
            chapters.push({
              id: generateId(), novelId, index: index++,
              title: item.title || `Chuong ${index}`,
              sourceUrl: `${this.baseUrl}/reader/${itemId}`,
              status: 'pending', createdAt: new Date(), updatedAt: new Date()
            })
          }
        }
      }
      return chapters
    } catch (error) {
      console.error('Fanqie getChapterList error:', error)
      return []
    }
  }

  async getChapterContent(chapterUrl: string): Promise<string> {
    try {
      const chapterIdMatch = chapterUrl.match(/\/reader\/(\d+)/)
      const chapterId = chapterIdMatch ? chapterIdMatch[1] : ''
      if (!chapterId) throw new Error('Invalid chapter URL')
      const response = await this.client.get('/api/reader/full', { params: { itemId: chapterId } })
      const data = response.data
      if (data?.data?.content) return this.processContent(data.data.content)
      const pageResponse = await this.client.get(chapterUrl)
      const $ = cheerio.load(pageResponse.data)
      const content = $('.read-content').text() || $('.content').text() || $('article').text() || ''
      return this.processContent(content)
    } catch (error) {
      console.error('Fanqie getChapterContent error:', error)
      return ''
    }
  }

  private processContent(content: string): string {
    return content.replace(/\s+/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  }
}
