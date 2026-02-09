'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/reader', label: 'Đọc truyện' },
  { href: '/translate', label: 'Dịch nhanh' },
  { href: '/library', label: 'Thư viện' },
  { href: '/search', label: 'Tìm truyện' },
  { href: '/paste', label: 'Paste & Dịch' },
  { href: '/settings', label: 'Cài đặt' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-gray-900 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center h-14 gap-1">
          <Link href="/" className="text-white font-bold text-lg mr-6">
            Novel Translator
          </Link>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
