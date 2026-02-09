import { GeminiTranslator } from './gemini'
import { GoogleTranslator } from './google'
import { OllamaTranslator } from './ollama'
import { BaseTranslator } from './base'
import { GlossaryEntry } from '@/shared/types'
import { chunkText } from '@/shared/utils'

export type TranslatorType = 'gemini' | 'google' | 'ollama'

export interface TranslationTask {
  id: string
  text: string
  style: 'convert' | 'literary'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  result?: string
  error?: string
  translator?: TranslatorType
}

export interface TranslationProgress {
  total: number
  completed: number
  failed: number
  current?: string
}

export class TranslatorManager {
  private translators: Map<TranslatorType, BaseTranslator> = new Map()
  private primaryTranslator: TranslatorType = 'gemini'
  private fallbackTranslator: TranslatorType = 'google'
  private queue: TranslationTask[] = []
  private isProcessing = false
  private glossary: GlossaryEntry[] = []

  constructor() {
    this.translators.set('google', new GoogleTranslator())
  }

  initGemini(apiKey: string): void {
    try {
      this.translators.set('gemini', new GeminiTranslator(apiKey))
      this.updateGlossary()
    } catch (error) {
      console.error('Failed to initialize Gemini:', error)
    }
  }

  initOllama(endpoint?: string, model?: string): void {
    try {
      this.translators.set('ollama', new OllamaTranslator(endpoint, model))
      this.updateGlossary()
    } catch (error) {
      console.error('Failed to initialize Ollama:', error)
    }
  }

  setTranslators(primary: TranslatorType, fallback: TranslatorType): void {
    this.primaryTranslator = primary
    this.fallbackTranslator = fallback
  }

  setGlossary(entries: GlossaryEntry[]): void {
    this.glossary = entries
    this.updateGlossary()
  }

  private updateGlossary(): void {
    for (const translator of this.translators.values()) {
      translator.setGlossary(this.glossary)
    }
  }

  async translate(text: string, style: 'convert' | 'literary' = 'literary'): Promise<{ result: string; translator: TranslatorType }> {
    const primary = this.translators.get(this.primaryTranslator)
    if (primary) {
      try {
        const result = await primary.translate(text, style)
        return { result, translator: this.primaryTranslator }
      } catch (error) {
        console.warn(`Primary translator (${this.primaryTranslator}) failed:`, error)
      }
    }

    const fallback = this.translators.get(this.fallbackTranslator)
    if (fallback) {
      try {
        const result = await fallback.translate(text, style)
        return { result, translator: this.fallbackTranslator }
      } catch (error) {
        console.error(`Fallback translator (${this.fallbackTranslator}) failed:`, error)
        throw error
      }
    }

    throw new Error('No translator available')
  }

  async translateLongText(
    text: string,
    style: 'convert' | 'literary' = 'literary',
    chunkSize: number = 2000,
    onProgress?: (current: number, total: number) => void
  ): Promise<string> {
    const chunks = chunkText(text, chunkSize)
    const results: string[] = []

    for (let i = 0; i < chunks.length; i++) {
      const { result } = await this.translate(chunks[i], style)
      results.push(result)
      if (onProgress) onProgress(i + 1, chunks.length)
      if (i < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500))
      }
    }

    return results.join('\n\n')
  }

  getAvailableTranslators(): TranslatorType[] {
    return Array.from(this.translators.keys())
  }
}

let managerInstance: TranslatorManager | null = null

export function getTranslatorManager(): TranslatorManager {
  if (!managerInstance) {
    managerInstance = new TranslatorManager()
  }
  return managerInstance
}
