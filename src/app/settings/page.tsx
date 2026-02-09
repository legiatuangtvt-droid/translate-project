'use client'

import { useState, useEffect } from 'react'

interface Settings {
  theme: string
  fontSize: number
  fontFamily: string
  translatorPrimary: string
  translatorFallback: string
  autoTranslate: boolean
  geminiApiKey?: string
  ollamaEndpoint?: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    theme: 'dark',
    fontSize: 16,
    fontFamily: 'system-ui',
    translatorPrimary: 'google',
    translatorFallback: 'google',
    autoTranslate: false,
    geminiApiKey: '',
    ollamaEndpoint: 'http://localhost:11434'
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) setSettings(data)
      })
      .catch(console.error)
  }, [])

  const handleSave = async () => {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Cài đặt</h1>

      <div className="space-y-6">
        {/* Translator settings */}
        <section className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-medium">Dịch thuật</h2>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Translator chính</label>
            <select
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              value={settings.translatorPrimary}
              onChange={(e) => setSettings({ ...settings, translatorPrimary: e.target.value })}
            >
              <option value="gemini">Google Gemini (AI)</option>
              <option value="google">Google Translate (Free)</option>
              <option value="ollama">Ollama (Local)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Translator dự phòng</label>
            <select
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              value={settings.translatorFallback}
              onChange={(e) => setSettings({ ...settings, translatorFallback: e.target.value })}
            >
              <option value="google">Google Translate</option>
              <option value="gemini">Google Gemini</option>
              <option value="ollama">Ollama</option>
              <option value="none">Không dùng</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Gemini API Key</label>
            <input
              type="password"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              placeholder="AIza..."
              value={settings.geminiApiKey || ''}
              onChange={(e) => setSettings({ ...settings, geminiApiKey: e.target.value })}
            />
            <p className="text-xs text-gray-500 mt-1">Free: 1500 requests/ngày</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Ollama Endpoint</label>
            <input
              type="text"
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              value={settings.ollamaEndpoint || ''}
              onChange={(e) => setSettings({ ...settings, ollamaEndpoint: e.target.value })}
            />
          </div>
        </section>

        {/* Reading settings */}
        <section className="bg-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-medium">Đọc truyện</h2>

          <div>
            <label className="block text-sm text-gray-400 mb-1">Cỡ chữ: {settings.fontSize}px</label>
            <input
              type="range"
              min="12"
              max="28"
              value={settings.fontSize}
              onChange={(e) => setSettings({ ...settings, fontSize: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
        </section>

        <button
          onClick={handleSave}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition-colors"
        >
          {saved ? 'Đã lưu!' : 'Lưu cài đặt'}
        </button>
      </div>
    </div>
  )
}
