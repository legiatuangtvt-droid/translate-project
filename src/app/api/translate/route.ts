import { getDatabase } from '@/lib/db/sqlite'
import { getTranslatorManager } from '@/lib/translator'
import { chunkText } from '@/shared/utils'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const { chapterId, style = 'literary' } = await request.json()
  const db = getDatabase()
  const chapter = db.getChapter(chapterId)

  if (!chapter) {
    return new Response(JSON.stringify({ error: 'Chapter not found' }), { status: 404 })
  }

  if (!chapter.rawContent) {
    return new Response(JSON.stringify({ error: 'Chapter has no content' }), { status: 400 })
  }

  const manager = getTranslatorManager()
  if (process.env.GEMINI_API_KEY) {
    manager.initGemini(process.env.GEMINI_API_KEY)
  }

  db.updateChapterStatus(chapterId, 'translating')

  const encoder = new TextEncoder()
  const chunks = chunkText(chapter.rawContent, 2000)

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const results: string[] = []
        for (let i = 0; i < chunks.length; i++) {
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'progress', current: i, total: chunks.length })}\n\n`
          ))
          const { result } = await manager.translate(chunks[i], style)
          results.push(result)
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ type: 'chunk', index: i, text: result })}\n\n`
          ))
        }
        const fullText = results.join('\n\n')
        db.updateChapterContent(chapterId, undefined, undefined, fullText, 'translated')
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'done', translated: fullText })}\n\n`
        ))
      } catch (error: any) {
        db.updateChapterStatus(chapterId, 'pending')
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
