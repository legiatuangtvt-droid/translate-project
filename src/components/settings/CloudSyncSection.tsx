'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { signInWithGoogle, signOutUser } from '@/lib/firebase/auth'
import { backupToCloud, restoreFromCloud, getLastBackupInfo } from '@/lib/firebase/sync'
import type { SyncProgress, BackupInfo } from '@/shared/types'

export default function CloudSyncSection() {
  const { user, isLoading: authLoading } = useAuth()
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null)
  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (user) {
      getLastBackupInfo(user.uid).then(setBackupInfo).catch(console.error)
    } else {
      setBackupInfo(null)
    }
  }, [user])

  const handleSignIn = async () => {
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError(`Đăng nhập thất bại: ${err.message}`)
      }
    }
  }

  const handleSignOut = async () => {
    await signOutUser()
    setBackupInfo(null)
    setSyncProgress(null)
    setSuccessMsg(null)
  }

  const handleBackup = async () => {
    if (!user) return
    setIsSyncing(true)
    setError(null)
    setSuccessMsg(null)
    try {
      await backupToCloud(user.uid, setSyncProgress)
      const info = await getLastBackupInfo(user.uid)
      setBackupInfo(info)
      setSuccessMsg('Backup thành công!')
      setTimeout(() => setSuccessMsg(null), 3000)
    } catch (err: any) {
      setError(`Backup thất bại: ${err.message}`)
    } finally {
      setIsSyncing(false)
      setSyncProgress(null)
    }
  }

  const handleRestore = async () => {
    if (!user) return
    if (!confirm('Thao tác này sẽ THAY THẾ TOÀN BỘ dữ liệu local bằng bản backup trên cloud.\n\nBạn có chắc chắn muốn tiếp tục?')) {
      return
    }
    setIsSyncing(true)
    setError(null)
    setSuccessMsg(null)
    try {
      await restoreFromCloud(user.uid, setSyncProgress)
      setSuccessMsg('Khôi phục thành công! Tải lại trang để xem dữ liệu mới.')
      setTimeout(() => setSuccessMsg(null), 5000)
    } catch (err: any) {
      setError(`Khôi phục thất bại: ${err.message}`)
    } finally {
      setIsSyncing(false)
      setSyncProgress(null)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('vi-VN')
    } catch {
      return dateStr
    }
  }

  const getProgressPercent = () => {
    if (!syncProgress || syncProgress.total === 0) return 0
    if (syncProgress.phase === 'done') return 100
    return Math.round((syncProgress.current / syncProgress.total) * 100)
  }

  if (authLoading) {
    return (
      <div>
        <h2 className="text-lg font-medium mb-4">Cloud Sync</h2>
        <p className="text-gray-400 text-sm">Đang tải...</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-lg font-medium mb-4">Cloud Sync</h2>

      {/* Error / Success messages */}
      {error && (
        <div className="mb-4 p-3 rounded bg-red-600/20 text-red-400 text-sm">{error}</div>
      )}
      {successMsg && (
        <div className="mb-4 p-3 rounded bg-green-600/20 text-green-400 text-sm">{successMsg}</div>
      )}

      {!user ? (
        /* Not signed in */
        <div className="space-y-3">
          <p className="text-gray-400 text-sm">
            Đăng nhập để backup và đồng bộ dữ liệu lên cloud.
          </p>
          <button
            onClick={handleSignIn}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-800 rounded font-medium hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Đăng nhập bằng Google
          </button>
        </div>
      ) : (
        /* Signed in */
        <div className="space-y-4">
          {/* User info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user.photoURL && (
                <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full" />
              )}
              <div>
                <p className="text-sm font-medium">{user.displayName}</p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              disabled={isSyncing}
              className="text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              Đăng xuất
            </button>
          </div>

          {/* Last backup info */}
          {backupInfo && (
            <div className="bg-gray-700/50 rounded p-3 text-sm">
              <p className="text-gray-300">
                Backup gần nhất: <span className="text-white">{formatDate(backupInfo.lastBackupAt)}</span>
              </p>
              <p className="text-gray-400 mt-1">
                {backupInfo.novelCount} truyện, {backupInfo.chapterCount} chương, {backupInfo.glossaryCount} từ vựng
              </p>
            </div>
          )}
          {!backupInfo && !isSyncing && (
            <p className="text-sm text-gray-500">Chưa có bản backup nào.</p>
          )}

          {/* Progress bar */}
          {syncProgress && syncProgress.phase !== 'done' && (
            <div className="space-y-2">
              <p className="text-sm text-gray-300">{syncProgress.message}</p>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercent()}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleBackup}
              disabled={isSyncing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isSyncing && syncProgress?.phase !== 'done' ? 'Đang xử lý...' : 'Backup lên Cloud'}
            </button>
            <button
              onClick={handleRestore}
              disabled={isSyncing || !backupInfo}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded text-sm font-medium transition-colors disabled:opacity-50"
            >
              Khôi phục từ Cloud
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
