import { GoogleGenerativeAI } from '@google/generative-ai'
import { BaseTranslator } from './base'

export class GeminiTranslator extends BaseTranslator {
  private genAI: GoogleGenerativeAI
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>

  constructor(apiKey: string) {
    super('gemini')
    if (!apiKey) {
      throw new Error('Gemini API key is required')
    }
    this.genAI = new GoogleGenerativeAI(apiKey)
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  }

  async translate(text: string, style: 'convert' | 'literary' = 'literary'): Promise<string> {
    if (!text.trim()) return ''

    const prompt = this.buildTranslationPrompt(text, style)

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      let translatedText = response.text()
      translatedText = this.applyGlossary(translatedText)
      translatedText = this.postProcess(translatedText)
      return translatedText
    } catch (error: any) {
      console.error('Gemini translation error:', error.message)
      if (error.message?.includes('429') || error.message?.includes('quota')) {
        throw new Error('Gemini API rate limit exceeded. Please try again later.')
      }
      throw new Error(`Translation failed: ${error.message}`)
    }
  }

  private buildTranslationPrompt(text: string, style: 'convert' | 'literary'): string {
    const glossaryContext = this.buildGlossaryContext()

    if (style === 'convert') {
      return `Ban la mot dich gia chuyen nghiep. Dich doan van tieng Trung sau sang tieng Viet.

Yeu cau:
- Dich sat nghia, giu nguyen cau truc cau goc
- Giu nguyen cac thuat ngu tu tien, vo hiep
- Khong them bot noi dung
- Chi tra ve ban dich, khong giai thich
${glossaryContext}

Van ban can dich:
${text}`
    }

    return `Ban la mot dich gia van hoc chuyen nghiep. Dich doan van tieng Trung sau sang tieng Viet.

Yeu cau:
- Dich van phong tu nhien, muot ma nhu van hoc Viet Nam
- Chuyen doi thanh ngu, tuc ngu sang tuong duong tieng Viet
- Giu nguyen cam xuc va nhip dieu cua cau van
- Su dung tu ngu phu hop voi boi canh co dai/tu tien
- Chi tra ve ban dich, khong giai thich
${glossaryContext}

Van ban can dich:
${text}`
  }

  private buildGlossaryContext(): string {
    if (this.glossary.length === 0) return ''
    const entries = this.glossary.map((g) => `- "${g.original}" → "${g.translated}"`).join('\n')
    return `\nTu dien thuat ngu (bat buoc su dung):\n${entries}\n`
  }

  private postProcess(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\s+([,。！？；：])/g, '$1')
      .replace(/([,。！？；：])\s*/g, '$1 ')
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      .replace(/\n\s*\n/g, '\n\n')
      .trim()
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const result = await this.model.generateContent('Hello')
      await result.response
      return true
    } catch {
      return false
    }
  }
}
