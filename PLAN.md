# Dự Án Dịch Thuật Truyện Trung Quốc

## Thông tin đầu vào
- Sử dụng cá nhân
- Muốn miễn phí
- GPU yếu/không có
- Biết React/TypeScript
- Site ưu tiên: Fanqie (番茄)

---

# QUYẾT ĐỊNH CÔNG NGHỆ

## 1. Loại Ứng Dụng: ✅ Web App (Next.js)

**Triển khai:**
- Next.js 15 full-stack (API Routes + React UI)
- Node.js backend tích hợp (server-side)
- SQLite cho lưu trữ local
- Chạy local trên port 3010

**Lý do chọn:**
- ✅ Full-stack trong một framework (không cần tách backend)
- ✅ API Routes xử lý crawl & dịch server-side (không bị CORS)
- ✅ SSE streaming cho real-time translation
- ✅ Dễ deploy, dễ develop
- ✅ Phù hợp cho mục đích cá nhân

---

## 2. API Dịch Thuật: ✅ Hybrid (Đa nguồn + Tùy chỉnh)

**Kiến trúc:**
```
TranslatorManager
├── GeminiTranslator   (primary - có internet, miễn phí 1500 req/ngày)
├── OllamaTranslator   (backup - offline, cần GPU)
├── GoogleTranslator   (convert nhanh - scraping)
└── [Mở rộng]          (thêm API mới bất cứ lúc nào)
```

**Tính năng tùy chỉnh:**
- ✅ Prompt Engineering - tạo phong cách dịch riêng
- ✅ Glossary System - từ điển tên riêng nhất quán
- ✅ Post-processing - sửa lỗi, format tự động
- ✅ Fallback logic - tự chuyển translator khi lỗi
- ✅ Plugin Architecture - thêm translator mới dễ dàng

---

## 3. Frontend Framework: ✅ Next.js + React + TypeScript

**Stack UI:**
- Next.js 15.1 (App Router)
- React 19 + TypeScript
- Tailwind CSS
- Custom hooks cho logic UI

---

# KIẾN TRÚC HỆ THỐNG

```
┌─────────────────────────────────────────────────────────┐
│                    WEB APP (Next.js)                     │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │   React UI  │  │  API Routes │  │   Server-Side   │ │
│  │   (Pages)   │  │  (Backend)  │  │    Libraries    │ │
│  └─────────────┘  └─────────────┘  └─────────────────┘ │
│         │               │                  │           │
│  ┌──────┴───────────────┴──────────────────┴────────┐  │
│  │           src/lib/ (Business Logic)              │  │
│  │  Crawler │ Translator │ HanViet │ DB │ Glossary  │  │
│  └──────────────────────────────────────────────────┘  │
│         │                    │                         │
│  ┌──────┴──────┐     ┌──────┴────────┐                │
│  │   SQLite    │     │  File System  │                │
│  │  (app.db)   │     │  (data/)      │                │
│  └─────────────┘     └───────────────┘                │
└─────────────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
┌─────────────────┐    ┌─────────────────────────────────┐
│    Firebase     │    │        Translation APIs         │
│   (chưa tích   │    │  Gemini │ Google │ Ollama       │
│    hợp)        │    └─────────────────────────────────┘
└─────────────────┘
```

---

# CẤU TRÚC DỰ ÁN

```
translate-project/
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx              # Root layout
│   │   ├── pages/                  # Page routes
│   │   │   ├── page.tsx            # Home
│   │   │   ├── library/            # Thư viện truyện
│   │   │   ├── search/             # Tìm kiếm truyện
│   │   │   ├── translate/          # Dịch & đọc truyện
│   │   │   ├── paste/              # Dán & dịch text
│   │   │   └── settings/           # Cài đặt
│   │   └── api/                    # Backend API routes
│   │       ├── novels/             # CRUD novels
│   │       ├── chapters/           # CRUD chapters
│   │       ├── crawler/            # Crawl endpoints
│   │       │   ├── search/
│   │       │   ├── novel-info/
│   │       │   └── chapter-list/
│   │       ├── translate/          # Translation (SSE streaming)
│   │       │   ├── text/
│   │       │   └── available/
│   │       ├── glossary/           # CRUD glossary
│   │       ├── hanviet/            # Hán-Việt conversion
│   │       │   └── convert/
│   │       └── settings/           # User settings
│   │
│   ├── lib/                        # Core business logic
│   │   ├── db/
│   │   │   └── sqlite.ts           # SQLite wrapper (full CRUD)
│   │   ├── crawler/
│   │   │   ├── base.ts             # Abstract base class
│   │   │   └── sites/
│   │   │       └── fanqie.ts       # Fanqie crawler
│   │   ├── translator/
│   │   │   ├── base.ts             # Abstract base class
│   │   │   ├── manager.ts          # TranslatorManager (singleton)
│   │   │   ├── gemini.ts           # Gemini API
│   │   │   ├── google.ts           # Google Translate scraping
│   │   │   └── ollama.ts           # Ollama local LLM
│   │   └── hanviet/
│   │       ├── converter.ts        # Hán-Việt conversion logic
│   │       └── dictionary.ts       # 500+ character mappings
│   │
│   ├── components/                 # React components
│   │   ├── layout/
│   │   │   └── Navbar.tsx
│   │   ├── translate/
│   │   │   ├── NovelSelector.tsx
│   │   │   ├── ChapterSidebar.tsx
│   │   │   └── EnhancedGlossaryPanel.tsx
│   │   └── glossary/
│   │       └── GlossaryPanel.tsx
│   │
│   ├── hooks/                      # Custom React hooks
│   │   ├── useHanViet.ts
│   │   ├── useTranslation.ts
│   │   └── useGlossary.ts
│   │
│   └── shared/                     # Types & utils
│       ├── types.ts
│       └── utils.ts
│
├── data/                           # Runtime data (gitignored)
│   └── app.db                      # SQLite database
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.js
└── PLAN.md
```

---

# CÁC TÍNH NĂNG

## Phase 1: MVP ✅ HOÀN THÀNH
1. **Crawl truyện** - Fanqie (番茄), tải chapter, lưu local
2. **Dịch cơ bản** - Gemini API + Google Translate + Ollama
3. **Hán-Việt** - Chuyển đổi Hán-Việt với từ điển 500+ ký tự
4. **Glossary** - Từ điển tên riêng, nhất quán trong bản dịch
5. **UI cơ bản** - Library, Search, Translate, Paste, Settings

## Phase 2: Nâng cao
6. **Reader page** - UI đọc truyện chuyên dụng, lưu tiến độ
7. **Sync & Backup** - Firebase sync
8. **Tùy chỉnh nâng cao** - Custom prompt, theme, export/import
9. **Thêm crawlers** - Qidian (起点), JJWXC (晋江)

---

# MILESTONES

**Milestone 1: Setup & Crawl** ✅ HOÀN THÀNH
- [x] Init project (Next.js + React + TypeScript)
- [x] Cấu hình Tailwind CSS
- [x] SQLite database schema (novels, chapters, glossary, settings, reading_progress)
- [x] Crawler base class
- [x] Implement Fanqie (番茄) crawler (search, novel-info, chapter-list, chapter-content)
- [x] API routes cho crawler

**Milestone 2: Dịch thuật** ✅ HOÀN THÀNH
- [x] Translator base class
- [x] Gemini API integration (gemini-1.5-flash, prompt engineering)
- [x] Google Translate scraping (miễn phí, không cần API key)
- [x] Ollama integration (local LLM, qwen2)
- [x] TranslatorManager với fallback logic
- [x] SSE streaming cho real-time translation
- [x] Text chunking (2000 ký tự/chunk)
- [x] Glossary integration trong pipeline dịch

**Milestone 3: Hán-Việt & Glossary** ✅ HOÀN THÀNH
- [x] Hán-Việt converter với dictionary 500+ ký tự
- [x] CJK character detection & segmentation
- [x] Glossary CRUD (create, read, update, delete)
- [x] Glossary types: Character, Location, Term, Other
- [x] Global & novel-specific glossary entries
- [x] Pre/post-translation glossary application (placeholder system)

**Milestone 4: UI Pages** ✅ HOÀN THÀNH
- [x] Home page
- [x] Library page (hiển thị novels, xóa, links)
- [x] Search page (tìm kiếm, thêm novel vào library)
- [x] Translate page (chọn novel/chapter, Hán-Việt, dịch, glossary panel)
- [x] Paste page (dán text thủ công, dịch)
- [x] Settings page (theme, font, translator config, API keys)
- [x] Navbar navigation

**Milestone 5: Reader & Polish** ✅ HOÀN THÀNH
- [x] Reader page chuyên dụng (/reader/[novelId])
- [x] Reading progress API + hook (lưu/khôi phục vị trí đọc)
- [x] 3 chế độ hiển thị (Tiếng Việt / Song ngữ / Hán Việt)
- [x] Chapter navigation (sidebar, prev/next, keyboard shortcuts)
- [x] Inline translation cho chapters chưa dịch (SSE streaming)
- [x] Reader index page (/reader) với novel picker
- [x] UI polish: responsive sidebar, toolbar wrap, bottom nav, loading spinner
- [x] Error handling: load error, translation error + retry, empty states

**Milestone 6: Firebase & Sync**
- [ ] Firebase Firestore setup
- [ ] Auth (email, Google)
- [ ] Sync logic (novels, chapters, glossary)
- [ ] Cloud backup & restore

**Milestone 7: Mở rộng**
- [ ] Qidian (起点) crawler
- [ ] JJWXC (晋江) crawler
- [ ] Export (TXT, EPUB)
- [ ] Batch translation queue
- [ ] Desktop packaging (Electron wrapper hoặc Tauri)

---

# API ENDPOINTS

| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/novels` | Danh sách novels |
| POST | `/api/novels` | Tạo novel |
| DELETE | `/api/novels/[id]` | Xóa novel |
| GET | `/api/chapters` | Danh sách chapters |
| POST | `/api/chapters` | Tạo chapter |
| GET | `/api/chapters/[id]` | Chi tiết chapter |
| GET | `/api/chapters/by-novel/[novelId]` | Chapters theo novel |
| POST | `/api/crawler/search` | Tìm kiếm truyện |
| GET | `/api/crawler/novel-info` | Thông tin novel |
| GET | `/api/crawler/chapter-list` | Danh sách chapters |
| POST | `/api/translate/text` | Dịch text (SSE) |
| POST | `/api/translate` | Dịch chapter (SSE) |
| GET | `/api/translate/available` | Translators khả dụng |
| GET/POST/PUT/DELETE | `/api/glossary` | CRUD glossary |
| POST | `/api/hanviet/convert` | Chuyển đổi Hán-Việt |
| GET/PUT | `/api/reading-progress` | Tiến độ đọc |
| GET/PUT | `/api/settings` | User settings |

---

# TIẾN ĐỘ

| Ngày | Công việc |
|------|-----------|
| 2026-02-05 | Setup project, cấu trúc thư mục, push GitHub |
| 2026-02-06 | Chuyển sang Next.js, implement crawler & translator |
| 2026-02-07 | Implement Hán-Việt converter, glossary system |
| 2026-02-08 | UI pages (Library, Search, Translate, Paste, Settings) |
| 2026-02-09 | Cập nhật PLAN.md, implement Reader page (Milestone 5) |

---

# CÔNG NGHỆ SỬ DỤNG

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15.1 |
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS |
| Local Database | better-sqlite3 |
| HTTP Client | axios |
| HTML Parser | cheerio |
| AI/LLM | @google/generative-ai (Gemini) |
| Dev Server | Port 3010 |

---

# BƯỚC TIẾP THEO

1. Implement Reader page chuyên dụng (đọc truyện thoải mái)
2. Progress tracking (lưu vị trí đọc, đánh dấu chapters đã đọc)
3. UI polish (responsive, loading states, error handling)
4. Firebase integration cho sync multi-device
