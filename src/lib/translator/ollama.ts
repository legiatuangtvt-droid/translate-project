import axios from 'axios'
import { BaseTranslator } from './base'

export class OllamaTranslator extends BaseTranslator {
  private endpoint: string
  private model: string

  constructor(endpoint: string = 'http://localhost:11434', model: string = 'qwen2') {
    super('ollama')
    this.endpoint = endpoint
    this.model = model
  }

  async translate(text: string, style: 'convert' | 'literary' = 'literary'): Promise<string> {
    if (!text.trim()) return ''
    const prompt = this.buildTranslationPrompt(text, style)
    try {
      const response = await axios.post(
        `${this.endpoint}/api/generate`,
        { model: this.model, prompt, stream: false, options: { temperature: 0.3, top_p: 0.9 } },
        { timeout: 120000 }
      )
      let result = response.data.response || ''
      result = this.applyGlossary(result)
      result = this.postProcess(result)
      return result
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama is not running. Please start Ollama first.')
      }
      throw new Error(`Ollama translation failed: ${error.message}`)
    }
  }

  private buildTranslationPrompt(text: string, style: 'convert' | 'literary'): string {
    const glossaryContext = this.buildGlossaryContext()
    if (style === 'convert') {
      return `Dich doan van tieng Trung sau sang tieng Viet, giu nguyen cau truc cau goc.\n${glossaryContext}\nChi tra ve ban dich, khong giai thich.\n\n${text}`
    }
    return `Ban la dich gia van hoc. Dich doan van tieng Trung sau sang tieng Viet voi van phong tu nhien, muot ma.\n${glossaryContext}\nChi tra ve ban dich, khong giai thich.\n\n${text}`
  }

  private buildGlossaryContext(): string {
    if (this.glossary.length === 0) return ''
    const entries = this.glossary.slice(0, 20).map((g) => `${g.original}=${g.translated}`).join(', ')
    return `Tu dien: ${entries}`
  }

  private postProcess(text: string): string {
    return text.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim()
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.endpoint}/api/tags`, { timeout: 5000 })
      return response.status === 200
    } catch { return false }
  }
}
