import { HanVietSegment, HanVietResult } from '@/shared/types'
import { getHanVietDict } from './dictionary'

const VIET_LOWER = 'a-záàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ'

function isCJKCharacter(char: string): boolean {
  const code = char.codePointAt(0) || 0
  return (code >= 0x4E00 && code <= 0x9FFF) ||
         (code >= 0x3400 && code <= 0x4DBF) ||
         (code >= 0x20000 && code <= 0x2A6DF)
}

/** Capitalize the first letter of a string (skip if already uppercase) */
function capitalizeFirst(str: string): string {
  if (!str) return str
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    // Check if it's a letter (lowercase !== uppercase for letters)
    if (ch.toLowerCase() !== ch.toUpperCase()) {
      if (ch === ch.toLowerCase()) {
        // Lowercase → capitalize it
        return str.slice(0, i) + ch.toUpperCase() + str.slice(i + 1)
      }
      // Already uppercase → done
      return str
    }
  }
  return str
}

/** Capitalize the first letter of each word (for proper nouns) */
function capitalizeWords(str: string): string {
  const re = new RegExp(`(^|\\s)([${VIET_LOWER}])`, 'g')
  return str.replace(re, (_, prefix, ch) => prefix + ch.toUpperCase())
}

// Characters that trigger capitalization of the next CJK segment
const SENTENCE_END = new Set(['。', '！', '？', '!', '?'])
const DIALOGUE_OPEN = new Set(['「', '『', '\u201C']) // 「『"
const CAPITALIZE_AFTER = new Set(['：', ':'])

export async function convertToHanViet(
  text: string,
  glossary?: Array<{ original: string; translated: string; type?: string }>
): Promise<HanVietResult> {
  const dict = getHanVietDict()
  const segments: HanVietSegment[] = []

  // Build phrase dictionary from glossary
  const phraseDict: Record<string, string> = {}
  const properNounOriginals = new Set<string>() // Chinese originals that are names/places
  let maxPhraseLen = 1
  const textStr = text
  if (glossary && glossary.length > 0) {
    for (const entry of glossary) {
      if (entry.original.includes('{n}')) {
        // Pattern entry: expand {n} placeholder to match actual numbers in text
        const escaped = entry.original
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replace('\\{n\\}', '(\\d+)')
        const regex = new RegExp(escaped, 'g')
        let match
        while ((match = regex.exec(textStr)) !== null) {
          const fullMatch = match[0]
          const number = match[1]
          const replacement = entry.translated.replace('{n}', number)
          phraseDict[fullMatch] = replacement
          maxPhraseLen = Math.max(maxPhraseLen, [...fullMatch].length)
        }
      } else {
        // Strip spaces from Chinese original (users may type 卒 印 but text has 卒印)
        const cleanOriginal = entry.original.replace(/\s/g, '')
        if (cleanOriginal.length >= 1) {
          phraseDict[cleanOriginal] = entry.translated
          maxPhraseLen = Math.max(maxPhraseLen, [...cleanOriginal].length)
        }
        // Track proper nouns (character names, location names)
        if (entry.type === 'character' || entry.type === 'location') {
          properNounOriginals.add(cleanOriginal)
        }
      }
    }
  }

  let i = 0
  const chars = [...text] // handle multi-byte Unicode correctly

  while (i < chars.length) {
    let matched = false

    // Try phrase match (longest first) - only if current char is CJK
    if (isCJKCharacter(chars[i]) && maxPhraseLen >= 2) {
      for (let len = Math.min(maxPhraseLen, chars.length - i); len >= 2; len--) {
        const phrase = chars.slice(i, i + len).join('')
        if (phraseDict[phrase]) {
          segments.push({ original: phrase, hanviet: phraseDict[phrase], isCJK: true })
          i += len
          matched = true
          break
        }
      }
    }

    if (!matched) {
      const char = chars[i]
      if (isCJKCharacter(char)) {
        // Check single-char glossary override first, then dictionary
        const reading = phraseDict[char] || dict[char] || null
        segments.push({ original: char, hanviet: reading || `[${char}]`, isCJK: true })
      } else {
        segments.push({ original: char, hanviet: null, isCJK: false })
      }
      i++
    }
  }

  // ---- Capitalization post-processing ----
  let shouldCapitalizeNext = true // capitalize first segment (start of text)

  for (const seg of segments) {
    if (seg.isCJK && seg.hanviet) {
      const isProperNoun = properNounOriginals.has(seg.original)
      if (isProperNoun) {
        // Proper noun: always capitalize all words (Lâm Động, Thanh Dương...)
        seg.hanviet = capitalizeWords(seg.hanviet)
      } else if (shouldCapitalizeNext) {
        // Start of sentence/dialogue/chapter title: capitalize first letter
        seg.hanviet = capitalizeFirst(seg.hanviet)
      }
      // Chapter marker: 第X章 (glossary pattern) or single 章 → capitalize next (chapter title)
      shouldCapitalizeNext = /第.+章$/.test(seg.original) || seg.original === '章'
    } else if (!seg.isCJK) {
      const ch = seg.original
      if (SENTENCE_END.has(ch) || ch === '\n') {
        shouldCapitalizeNext = true
      } else if (DIALOGUE_OPEN.has(ch)) {
        shouldCapitalizeNext = true
      } else if (CAPITALIZE_AFTER.has(ch)) {
        shouldCapitalizeNext = true
      }
    }
  }

  // ---- Build hanvietText from capitalized segments ----
  const hanvietParts: string[] = []
  let prevWasCJK = false

  for (const seg of segments) {
    if (seg.isCJK) {
      if (prevWasCJK) hanvietParts.push(' ')
      hanvietParts.push(seg.hanviet || seg.original)
      prevWasCJK = true
    } else {
      hanvietParts.push(seg.original)
      prevWasCJK = false
    }
  }

  let hanvietText = hanvietParts.join('')
    .replace(/[^\S\n]+/g, ' ')          // collapse spaces/tabs but keep \n
    .replace(/ ([，。！？；：、])/g, '$1') // remove space before punctuation
    .replace(/\n /g, '\n')               // remove space after newline
    .replace(/ \n/g, '\n')               // remove space before newline
    .trim()

  return { segments, hanvietText }
}
