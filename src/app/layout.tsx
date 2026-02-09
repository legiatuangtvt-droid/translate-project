import type { Metadata } from 'next'
import Navbar from '@/components/layout/Navbar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Novel Translator - Dịch truyện Trung Việt',
  description: 'Ứng dụng dịch truyện Trung Quốc sang tiếng Việt',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="bg-gray-900 text-white min-h-screen">
        <Navbar />
        <main className="w-full px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  )
}
