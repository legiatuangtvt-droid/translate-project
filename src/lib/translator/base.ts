import { GlossaryEntry } from '@/shared/types'

export abstract class BaseTranslator {
  protected name: string
  protected glossary: GlossaryEntry[] = []

  constructor(name: string) {
    this.name = name
  }

  setGlossary(entries: GlossaryEntry[]): void {
    this.glossary = entries
  }

  abstract translate(text: string, style?: 'convert' | 'literary'): Promise<string>

  protected applyGlossary(text: string): string {
    let result = text
    for (const entry of this.glossary) {
      result = result.replace(new RegExp(entry.original, 'g'), entry.translated)
    }
    return result
  }

  protected buildPrompt(text: string, style: 'convert' | 'literary'): string {
    const glossaryContext =
      this.glossary.length > 0
        ? `\nTu dien ten rieng:\n${this.glossary.map((g) => `- ${g.original} = ${g.translated}`).join('\n')}\n`
        : ''

    if (style === 'convert') {
      return `Dich doan van tieng Trung sau sang tieng Viet, giu nguyen cau truc cau:${glossaryContext}\n\n${text}`
    }

    return `Dich doan van tieng Trung sau sang tieng Viet voi van phong tu nhien, muot ma:${glossaryContext}\n\n${text}`
  }
}
