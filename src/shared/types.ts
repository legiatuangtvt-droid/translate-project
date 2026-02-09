// Novel types
export interface Novel {
  id: string
  title: string
  author: string
  cover?: string
  sourceUrl: string
  sourceSite: 'fanqie' | 'qidian' | 'jjwxc' | 'manual'
  totalChapters: number
  lastUpdated: Date
  createdAt: Date
}

export interface Chapter {
  id: string
  novelId: string
  index: number
  title: string
  sourceUrl: string
  rawContent?: string
  convertedContent?: string
  translatedContent?: string
  status: 'pending' | 'crawled' | 'translating' | 'translated'
  createdAt: Date
  updatedAt: Date
}

// Translation types
export interface TranslationResult {
  original: string
  converted: string
  translated: string
  translator: 'gemini' | 'google' | 'ollama'
}

export interface GlossaryEntry {
  id: string
  original: string
  translated: string
  vietnamese?: string // nghĩa tiếng Việt (dùng để thay thế trong bản dịch)
  type: 'character' | 'location' | 'term' | 'other'
  novelId?: string // null = global
}

// Reading progress
export interface ReadingProgress {
  novelId: string
  chapterId: string
  position: number // scroll position
  lastRead: Date
}

// Settings
export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  fontSize: number
  fontFamily: string
  translatorPrimary: 'gemini' | 'google' | 'ollama'
  translatorFallback: 'gemini' | 'google' | 'ollama' | 'none'
  autoTranslate: boolean
  geminiApiKey?: string
  ollamaEndpoint?: string
}

// Han Viet types (NEW)
export interface HanVietSegment {
  original: string
  hanviet: string | null
  isCJK: boolean
}

export interface HanVietResult {
  segments: HanVietSegment[]
  hanvietText: string
}
