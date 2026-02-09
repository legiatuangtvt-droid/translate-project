import BetterSqlite3 from 'better-sqlite3'
import { Novel, Chapter, GlossaryEntry, ReadingProgress, AppSettings } from '@/shared/types'
import { existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'

export class Database {
  private db: BetterSqlite3.Database | null = null
  private dbPath: string

  constructor(dbPath?: string) {
    this.dbPath = dbPath || join(process.cwd(), 'data', 'app.db')
  }

  init(): void {
    const dir = dirname(this.dbPath)
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true })
    }

    this.db = new BetterSqlite3(this.dbPath)
    this.db.pragma('journal_mode = WAL')

    this.createTables()
    this.migrateDatabase()
  }

  private createTables(): void {
    if (!this.db) return

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS novels (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        author TEXT,
        cover TEXT,
        source_url TEXT NOT NULL,
        source_site TEXT NOT NULL,
        total_chapters INTEGER DEFAULT 0,
        last_updated TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS chapters (
        id TEXT PRIMARY KEY,
        novel_id TEXT NOT NULL,
        idx INTEGER NOT NULL,
        title TEXT,
        source_url TEXT,
        raw_content TEXT,
        converted_content TEXT,
        translated_content TEXT,
        status TEXT DEFAULT 'pending',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
      )
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS glossary (
        id TEXT PRIMARY KEY,
        original TEXT NOT NULL,
        translated TEXT NOT NULL,
        type TEXT DEFAULT 'other',
        novel_id TEXT,
        FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
      )
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reading_progress (
        novel_id TEXT PRIMARY KEY,
        chapter_id TEXT NOT NULL,
        position INTEGER DEFAULT 0,
        last_read TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (novel_id) REFERENCES novels(id) ON DELETE CASCADE
      )
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `)

    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_chapters_novel ON chapters(novel_id);
      CREATE INDEX IF NOT EXISTS idx_glossary_novel ON glossary(novel_id);
    `)
  }

  private migrateDatabase(): void {
    if (!this.db) return
    const columns = (this.db.pragma('table_info(chapters)') as Array<{ name: string }>).map(
      (c) => c.name
    )
    if (!columns.includes('raw_content')) {
      this.db.exec('ALTER TABLE chapters ADD COLUMN raw_content TEXT')
    }
    if (!columns.includes('converted_content')) {
      this.db.exec('ALTER TABLE chapters ADD COLUMN converted_content TEXT')
    }
    if (!columns.includes('translated_content')) {
      this.db.exec('ALTER TABLE chapters ADD COLUMN translated_content TEXT')
    }

    // Glossary migration
    const glossaryCols = (this.db.pragma('table_info(glossary)') as Array<{ name: string }>).map(
      (c) => c.name
    )
    if (!glossaryCols.includes('vietnamese')) {
      this.db.exec('ALTER TABLE glossary ADD COLUMN vietnamese TEXT')
    }
  }

  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }

  // Novel Methods
  saveNovel(novel: Novel): void {
    if (!this.db) throw new Error('Database not initialized')
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO novels (id, title, author, cover, source_url, source_site, total_chapters, last_updated, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      novel.id, novel.title, novel.author, novel.cover || null,
      novel.sourceUrl, novel.sourceSite, novel.totalChapters,
      novel.lastUpdated.toISOString(), novel.createdAt.toISOString()
    )
  }

  getNovel(id: string): Novel | null {
    if (!this.db) throw new Error('Database not initialized')
    const stmt = this.db.prepare('SELECT * FROM novels WHERE id = ?')
    const row = stmt.get(id) as any
    if (!row) return null
    return this.rowToNovel(row)
  }

  getAllNovels(): Novel[] {
    if (!this.db) throw new Error('Database not initialized')
    const stmt = this.db.prepare('SELECT * FROM novels ORDER BY last_updated DESC')
    const rows = stmt.all() as any[]
    return rows.map((row) => this.rowToNovel(row))
  }

  deleteNovel(id: string): void {
    if (!this.db) throw new Error('Database not initialized')
    const stmt = this.db.prepare('DELETE FROM novels WHERE id = ?')
    stmt.run(id)
  }

  private rowToNovel(row: any): Novel {
    return {
      id: row.id, title: row.title, author: row.author, cover: row.cover,
      sourceUrl: row.source_url, sourceSite: row.source_site,
      totalChapters: row.total_chapters,
      lastUpdated: new Date(row.last_updated), createdAt: new Date(row.created_at)
    }
  }

  // Chapter Methods
  saveChapter(chapter: Chapter): void {
    if (!this.db) throw new Error('Database not initialized')
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO chapters (id, novel_id, idx, title, source_url, raw_content, converted_content, translated_content, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      chapter.id, chapter.novelId, chapter.index, chapter.title, chapter.sourceUrl,
      chapter.rawContent || null, chapter.convertedContent || null,
      chapter.translatedContent || null, chapter.status,
      chapter.createdAt.toISOString(), chapter.updatedAt.toISOString()
    )
  }

  saveChapters(chapters: Chapter[]): void {
    if (!this.db) throw new Error('Database not initialized')
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO chapters (id, novel_id, idx, title, source_url, raw_content, converted_content, translated_content, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const insertMany = this.db.transaction((chapters: Chapter[]) => {
      for (const chapter of chapters) {
        stmt.run(
          chapter.id, chapter.novelId, chapter.index, chapter.title, chapter.sourceUrl,
          chapter.rawContent || null, chapter.convertedContent || null,
          chapter.translatedContent || null, chapter.status,
          chapter.createdAt.toISOString(), chapter.updatedAt.toISOString()
        )
      }
    })
    insertMany(chapters)
  }

  getChapter(id: string): Chapter | null {
    if (!this.db) throw new Error('Database not initialized')
    const stmt = this.db.prepare('SELECT * FROM chapters WHERE id = ?')
    const row = stmt.get(id) as any
    if (!row) return null
    return this.rowToChapter(row)
  }

  getChaptersByNovel(novelId: string): Chapter[] {
    if (!this.db) throw new Error('Database not initialized')
    const stmt = this.db.prepare('SELECT * FROM chapters WHERE novel_id = ? ORDER BY idx')
    const rows = stmt.all(novelId) as any[]
    return rows.map((row) => this.rowToChapter(row))
  }

  updateChapterStatus(id: string, status: Chapter['status']): void {
    if (!this.db) throw new Error('Database not initialized')
    const stmt = this.db.prepare('UPDATE chapters SET status = ?, updated_at = ? WHERE id = ?')
    stmt.run(status, new Date().toISOString(), id)
  }

  updateChapterContent(id: string, rawContent?: string, convertedContent?: string, translatedContent?: string, status?: Chapter['status'], title?: string): void {
    if (!this.db) throw new Error('Database not initialized')
    const stmt = this.db.prepare(`
      UPDATE chapters
      SET raw_content = COALESCE(?, raw_content),
          converted_content = COALESCE(?, converted_content),
          translated_content = COALESCE(?, translated_content),
          status = COALESCE(?, status),
          title = COALESCE(?, title),
          updated_at = ?
      WHERE id = ?
    `)
    stmt.run(rawContent ?? null, convertedContent ?? null, translatedContent ?? null, status ?? null, title ?? null, new Date().toISOString(), id)
  }

  updateNovelChapterCount(novelId: string): void {
    if (!this.db) throw new Error('Database not initialized')
    const count = (
      this.db.prepare('SELECT COUNT(*) as count FROM chapters WHERE novel_id = ?').get(novelId) as { count: number }
    ).count
    this.db.prepare('UPDATE novels SET total_chapters = ?, last_updated = ? WHERE id = ?')
      .run(count, new Date().toISOString(), novelId)
  }

  private rowToChapter(row: any): Chapter {
    return {
      id: row.id, novelId: row.novel_id, index: row.idx, title: row.title,
      sourceUrl: row.source_url, rawContent: row.raw_content || undefined,
      convertedContent: row.converted_content || undefined,
      translatedContent: row.translated_content || undefined,
      status: row.status, createdAt: new Date(row.created_at), updatedAt: new Date(row.updated_at)
    }
  }

  // Glossary Methods
  saveGlossaryEntry(entry: GlossaryEntry): void {
    if (!this.db) throw new Error('Database not initialized')
    const stmt = this.db.prepare('INSERT OR REPLACE INTO glossary (id, original, translated, vietnamese, type, novel_id) VALUES (?, ?, ?, ?, ?, ?)')
    stmt.run(entry.id, entry.original, entry.translated, entry.vietnamese || null, entry.type, entry.novelId || null)
  }

  getGlossary(novelId?: string): GlossaryEntry[] {
    if (!this.db) throw new Error('Database not initialized')
    let rows: any[]
    if (novelId) {
      rows = this.db.prepare('SELECT * FROM glossary WHERE novel_id = ? OR novel_id IS NULL').all(novelId) as any[]
    } else {
      rows = this.db.prepare('SELECT * FROM glossary WHERE novel_id IS NULL').all() as any[]
    }
    return rows.map((row) => ({
      id: row.id, original: row.original, translated: row.translated,
      vietnamese: row.vietnamese || undefined,
      type: row.type, novelId: row.novel_id
    }))
  }

  updateGlossaryEntry(id: string, fields: { original?: string; translated?: string; vietnamese?: string; type?: string }): void {
    if (!this.db) throw new Error('Database not initialized')
    const sets: string[] = []
    const values: any[] = []
    if (fields.original !== undefined) { sets.push('original = ?'); values.push(fields.original) }
    if (fields.translated !== undefined) { sets.push('translated = ?'); values.push(fields.translated) }
    if (fields.vietnamese !== undefined) { sets.push('vietnamese = ?'); values.push(fields.vietnamese || null) }
    if (fields.type !== undefined) { sets.push('type = ?'); values.push(fields.type) }
    if (sets.length === 0) return
    values.push(id)
    const stmt = this.db.prepare(`UPDATE glossary SET ${sets.join(', ')} WHERE id = ?`)
    stmt.run(...values)
  }

  deleteGlossaryEntry(id: string): void {
    if (!this.db) throw new Error('Database not initialized')
    this.db.prepare('DELETE FROM glossary WHERE id = ?').run(id)
  }

  // Reading Progress
  saveProgress(progress: ReadingProgress): void {
    if (!this.db) throw new Error('Database not initialized')
    const stmt = this.db.prepare('INSERT OR REPLACE INTO reading_progress (novel_id, chapter_id, position, last_read) VALUES (?, ?, ?, ?)')
    stmt.run(progress.novelId, progress.chapterId, progress.position, progress.lastRead.toISOString())
  }

  getProgress(novelId: string): ReadingProgress | null {
    if (!this.db) throw new Error('Database not initialized')
    const row = this.db.prepare('SELECT * FROM reading_progress WHERE novel_id = ?').get(novelId) as any
    if (!row) return null
    return { novelId: row.novel_id, chapterId: row.chapter_id, position: row.position, lastRead: new Date(row.last_read) }
  }

  // Sync: Export/Import All Data
  getAllChapters(): Chapter[] {
    if (!this.db) throw new Error('Database not initialized')
    const rows = this.db.prepare('SELECT * FROM chapters ORDER BY novel_id, idx').all() as any[]
    return rows.map((row) => this.rowToChapter(row))
  }

  getAllGlossary(): GlossaryEntry[] {
    if (!this.db) throw new Error('Database not initialized')
    const rows = this.db.prepare('SELECT * FROM glossary').all() as any[]
    return rows.map((row) => ({
      id: row.id, original: row.original, translated: row.translated,
      vietnamese: row.vietnamese || undefined,
      type: row.type, novelId: row.novel_id || undefined
    }))
  }

  getAllProgress(): ReadingProgress[] {
    if (!this.db) throw new Error('Database not initialized')
    const rows = this.db.prepare('SELECT * FROM reading_progress').all() as any[]
    return rows.map((row) => ({
      novelId: row.novel_id, chapterId: row.chapter_id,
      position: row.position, lastRead: new Date(row.last_read)
    }))
  }

  exportAll() {
    return {
      novels: this.getAllNovels(),
      chapters: this.getAllChapters(),
      glossary: this.getAllGlossary(),
      readingProgress: this.getAllProgress(),
      settings: this.getSettings()
    }
  }

  importAll(data: {
    novels: Novel[]
    chapters: Chapter[]
    glossary: GlossaryEntry[]
    readingProgress: ReadingProgress[]
    settings: AppSettings | null
  }): void {
    if (!this.db) throw new Error('Database not initialized')
    const doImport = this.db.transaction(() => {
      // Clear all tables (order matters: children before parents)
      this.db!.exec('DELETE FROM reading_progress')
      this.db!.exec('DELETE FROM glossary')
      this.db!.exec('DELETE FROM chapters')
      this.db!.exec('DELETE FROM novels')
      this.db!.exec('DELETE FROM settings')

      // Insert novels
      for (const novel of data.novels) {
        this.saveNovel(novel)
      }
      // Insert chapters (batch)
      if (data.chapters.length > 0) {
        this.saveChapters(data.chapters)
      }
      // Insert glossary
      for (const entry of data.glossary) {
        this.saveGlossaryEntry(entry)
      }
      // Insert reading progress
      for (const progress of data.readingProgress) {
        this.saveProgress(progress)
      }
      // Insert settings
      if (data.settings) {
        this.saveSettings(data.settings)
      }
    })
    doImport()
  }

  // Settings
  saveSettings(settings: AppSettings): void {
    if (!this.db) throw new Error('Database not initialized')
    const stmt = this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    const saveMany = this.db.transaction(() => {
      stmt.run('theme', settings.theme)
      stmt.run('fontSize', String(settings.fontSize))
      stmt.run('fontFamily', settings.fontFamily)
      stmt.run('translatorPrimary', settings.translatorPrimary)
      stmt.run('translatorFallback', settings.translatorFallback)
      stmt.run('autoTranslate', String(settings.autoTranslate))
      if (settings.geminiApiKey) stmt.run('geminiApiKey', settings.geminiApiKey)
      if (settings.ollamaEndpoint) stmt.run('ollamaEndpoint', settings.ollamaEndpoint)
    })
    saveMany()
  }

  getSettings(): AppSettings | null {
    if (!this.db) throw new Error('Database not initialized')
    const rows = this.db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
    if (rows.length === 0) return null
    const m = new Map(rows.map((r) => [r.key, r.value]))
    return {
      theme: (m.get('theme') as AppSettings['theme']) || 'system',
      fontSize: parseInt(m.get('fontSize') || '16', 10),
      fontFamily: m.get('fontFamily') || 'system-ui',
      translatorPrimary: (m.get('translatorPrimary') as AppSettings['translatorPrimary']) || 'gemini',
      translatorFallback: (m.get('translatorFallback') as AppSettings['translatorFallback']) || 'google',
      autoTranslate: m.get('autoTranslate') === 'true',
      geminiApiKey: m.get('geminiApiKey'),
      ollamaEndpoint: m.get('ollamaEndpoint')
    }
  }
}

let dbInstance: Database | null = null

export function getDatabase(): Database {
  if (!dbInstance) {
    dbInstance = new Database()
    dbInstance.init()
  }
  return dbInstance
}
