import axios from 'axios'
import { BaseTranslator } from './base'

export class GoogleTranslator extends BaseTranslator {
  private readonly baseUrl = 'https://translate.googleapis.com/translate_a/single'

  constructor() {
    super('google')
  }

  async translate(text: string, _style: 'convert' | 'literary' = 'convert'): Promise<string> {
    if (!text.trim()) return ''

    try {
      const chunks = this.splitText(text, 4500)
      const translatedChunks: string[] = []

      for (const chunk of chunks) {
        const translated = await this.translateChunk(chunk)
        translatedChunks.push(translated)
        if (chunks.length > 1) {
          await this.delayMs(500)
        }
      }

      let result = translatedChunks.join(' ')
      result = this.applyGlossary(result)
      return result
    } catch (error: any) {
      console.error('Google Translate error:', error.message)
      throw new Error(`Google Translate failed: ${error.message}`)
    }
  }

  private async translateChunk(text: string): Promise<string> {
    const params = new URLSearchParams({
      client: 'gtx', sl: 'zh-CN', tl: 'vi', dt: 't', q: text
    })
    const response = await axios.post(this.baseUrl, params.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 30000
    })

    const data = response.data
    if (!Array.isArray(data) || !Array.isArray(data[0])) {
      throw new Error('Invalid response format')
    }

    const translatedParts: string[] = []
    for (const part of data[0]) {
      if (Array.isArray(part) && part[0]) {
        translatedParts.push(part[0])
      }
    }
    return translatedParts.join('')
  }

  private splitText(text: string, maxLength: number): string[] {
    if (text.length <= maxLength) return [text]
    const chunks: string[] = []
    let currentChunk = ''
    const sentences = text.split(/(?<=[。！？；\n])/g)
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > maxLength) {
        if (currentChunk) chunks.push(currentChunk.trim())
        if (sentence.length > maxLength) {
          const subChunks = this.splitByLength(sentence, maxLength)
          chunks.push(...subChunks.slice(0, -1))
          currentChunk = subChunks[subChunks.length - 1]
        } else {
          currentChunk = sentence
        }
      } else {
        currentChunk += sentence
      }
    }
    if (currentChunk.trim()) chunks.push(currentChunk.trim())
    return chunks
  }

  private splitByLength(text: string, maxLength: number): string[] {
    const chunks: string[] = []
    for (let i = 0; i < text.length; i += maxLength) {
      chunks.push(text.slice(i, i + maxLength))
    }
    return chunks
  }

  private delayMs(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
