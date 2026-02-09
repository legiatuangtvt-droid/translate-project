import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  writeBatch
} from 'firebase/firestore'
import { firestore } from './config'
import type { SyncProgress, BackupInfo } from '@/shared/types'

const BATCH_SIZE = 400

type ProgressCallback = (progress: SyncProgress) => void

export async function backupToCloud(
  userId: string,
  onProgress: ProgressCallback
): Promise<void> {
  // 1. Export all data from SQLite
  onProgress({ phase: 'novels', current: 0, total: 0, message: 'Đang xuất dữ liệu local...' })
  const response = await fetch('/api/sync/export')
  if (!response.ok) throw new Error('Không thể xuất dữ liệu local')
  const allData = await response.json()

  // 2. Backup novels
  const novels = allData.novels || []
  onProgress({ phase: 'novels', current: 0, total: novels.length, message: `Đang upload ${novels.length} truyện...` })
  await writeCollectionInBatches(userId, 'novels', novels, 'id', (current, total) => {
    onProgress({ phase: 'novels', current, total, message: `Upload truyện ${current}/${total}` })
  })

  // 3. Backup chapters
  const chapters = allData.chapters || []
  onProgress({ phase: 'chapters', current: 0, total: chapters.length, message: `Đang upload ${chapters.length} chương...` })
  await writeCollectionInBatches(userId, 'chapters', chapters, 'id', (current, total) => {
    onProgress({ phase: 'chapters', current, total, message: `Upload chương ${current}/${total}` })
  })

  // 4. Backup glossary
  const glossary = allData.glossary || []
  onProgress({ phase: 'glossary', current: 0, total: glossary.length, message: `Đang upload ${glossary.length} từ vựng...` })
  await writeCollectionInBatches(userId, 'glossary', glossary, 'id', (current, total) => {
    onProgress({ phase: 'glossary', current, total, message: `Upload từ vựng ${current}/${total}` })
  })

  // 5. Backup reading progress
  const readingProgress = allData.readingProgress || []
  onProgress({ phase: 'progress', current: 0, total: readingProgress.length, message: 'Đang upload tiến độ đọc...' })
  for (const rp of readingProgress) {
    const ref = doc(firestore, `users/${userId}/reading_progress/${rp.novelId}`)
    await setDoc(ref, rp)
  }

  // 6. Backup settings
  onProgress({ phase: 'settings', current: 0, total: 1, message: 'Đang upload cài đặt...' })
  if (allData.settings) {
    const settingsRef = doc(firestore, `users/${userId}/settings/app_settings`)
    await setDoc(settingsRef, allData.settings)
  }

  // 7. Write backup metadata
  const metaRef = doc(firestore, `users/${userId}/metadata/backup_info`)
  await setDoc(metaRef, {
    lastBackupAt: new Date().toISOString(),
    novelCount: novels.length,
    chapterCount: chapters.length,
    glossaryCount: glossary.length
  })

  onProgress({ phase: 'done', current: 1, total: 1, message: 'Backup hoàn tất!' })
}

export async function restoreFromCloud(
  userId: string,
  onProgress: ProgressCallback
): Promise<void> {
  // 1. Read novels
  onProgress({ phase: 'novels', current: 0, total: 0, message: 'Đang tải truyện từ cloud...' })
  const novels = await readCollection(userId, 'novels')

  // 2. Read chapters
  onProgress({ phase: 'chapters', current: 0, total: 0, message: 'Đang tải chương từ cloud...' })
  const chapters = await readCollection(userId, 'chapters')

  // 3. Read glossary
  onProgress({ phase: 'glossary', current: 0, total: 0, message: 'Đang tải từ vựng từ cloud...' })
  const glossary = await readCollection(userId, 'glossary')

  // 4. Read reading progress
  onProgress({ phase: 'progress', current: 0, total: 0, message: 'Đang tải tiến độ đọc...' })
  const readingProgress = await readCollection(userId, 'reading_progress')

  // 5. Read settings
  const settingsDoc = await getDoc(doc(firestore, `users/${userId}/settings/app_settings`))
  const settings = settingsDoc.exists() ? settingsDoc.data() : null

  // 6. Import to SQLite
  onProgress({ phase: 'settings', current: 0, total: 1, message: 'Đang khôi phục database local...' })
  const response = await fetch('/api/sync/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ novels, chapters, glossary, readingProgress, settings })
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(err.error || 'Khôi phục thất bại')
  }

  onProgress({ phase: 'done', current: 1, total: 1, message: 'Khôi phục hoàn tất!' })
}

export async function getLastBackupInfo(userId: string): Promise<BackupInfo | null> {
  try {
    const metaRef = doc(firestore, `users/${userId}/metadata/backup_info`)
    const snapshot = await getDoc(metaRef)
    if (!snapshot.exists()) return null
    return snapshot.data() as BackupInfo
  } catch {
    return null
  }
}

// Helpers

async function writeCollectionInBatches(
  userId: string,
  collectionName: string,
  items: any[],
  idField: string,
  onBatchProgress: (current: number, total: number) => void
): Promise<void> {
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = writeBatch(firestore)
    const slice = items.slice(i, i + BATCH_SIZE)
    for (const item of slice) {
      const ref = doc(firestore, `users/${userId}/${collectionName}/${item[idField]}`)
      batch.set(ref, JSON.parse(JSON.stringify(item))) // strip undefined values
    }
    await batch.commit()
    onBatchProgress(Math.min(i + BATCH_SIZE, items.length), items.length)
  }
}

async function readCollection(userId: string, collectionName: string): Promise<any[]> {
  const snapshot = await getDocs(collection(firestore, `users/${userId}/${collectionName}`))
  return snapshot.docs.map((d) => d.data())
}
