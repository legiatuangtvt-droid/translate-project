import { getTranslatorManager } from '@/lib/translator'
import { chunkText } from '@/shared/utils'

export const dynamic = 'force-dynamic'

// Replace glossary character/location names with placeholders before translation,
// then restore with Vietnamese translations after. This ensures consistent names.
function buildNameReplacer(glossary: any[]) {
  const entries: Array<{ original: string; replacement: string }> = []
  if (glossary && Array.isArray(glossary)) {
    for (const g of glossary) {
      if (!g.original) continue
      // Determine replacement value:
      // 1. If vietnamese is set → use it
      // 2. If character/location without vietnamese → use translated
      // 3. Otherwise → skip
      let replacement: string | null = null
      if (g.vietnamese) {
        replacement = g.vietnamese
      } else if ((g.type === 'character' || g.type === 'location') && g.translated) {
        replacement = g.translated
      }
      if (replacement) {
        entries.push({ original: g.original.replace(/\s/g, ''), replacement })
      }
    }
    // Sort longest first to avoid partial matches
    entries.sort((a, b) => b.original.length - a.original.length)
  }

  function preProcess(text: string): string {
    let result = text
    for (let i = 0; i < entries.length; i++) {
      result = result.replaceAll(entries[i].original, `[[NM${i}]]`)
    }
    // Add comma between adjacent placeholders so Google Translate keeps them separate
    result = result.replace(/\]\]\[\[NM/g, ']], [[NM')
    return result
  }

  function postProcess(text: string): string {
    let result = text
    for (let i = 0; i < entries.length; i++) {
      // Handle variations Google Translate might produce around placeholders
      const patterns = [`[[NM${i}]]`, `[[ NM${i} ]]`, `[[NM${i} ]]`, `[[ NM${i}]]`, `[NM${i}]`, `NM${i}`]
      for (const p of patterns) {
        result = result.replaceAll(p, entries[i].replacement)
      }
    }
    return result
  }

  return { preProcess, postProcess, hasEntries: entries.length > 0 }
}

export async function POST(request: Request) {
  const { text, style = 'literary', glossary } = await request.json()

  if (!text?.trim()) {
    return new Response(JSON.stringify({ error: 'No text provided' }), { status: 400 })
  }

  const manager = getTranslatorManager()
  if (process.env.GEMINI_API_KEY) {
    manager.initGemini(process.env.GEMINI_API_KEY)
  }

  if (glossary && Array.isArray(glossary)) {
    manager.setGlossary(glossary.map((g: any) => ({
      id: g.id || '',
      original: g.original,
      translated: g.translated,
      type: g.type || 'other'
    })))
  }

  const { preProcess, postProcess } = buildNameReplacer(glossary)
  const encoder = new TextEncoder()
  const chunks = chunkText(text, 2000)

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const results: string[] = []
        for (let i = 0; i < chunks.length; i++) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'progress', current: i, total: chunks.length })}\n\n`
          ))
          const preprocessed = preProcess(chunks[i])
          const { result } = await manager.translate(preprocessed, style)
          const postprocessed = postProcess(result)
          results.push(postprocessed)
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'chunk', index: i, text: postprocessed })}\n\n`
          ))
        }
        const fullText = results.join('\n\n')
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'done', translated: fullText })}\n\n`
        ))
      } catch (error: any) {
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`
        ))
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    }
  })
}
