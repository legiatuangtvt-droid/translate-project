# CLAUDE.md - Hướng dẫn cho Claude Code

## Tổng quan dự án
Ứng dụng Web dịch thuật truyện Trung Quốc sang tiếng Việt.

## Tech Stack
- **Framework:** Next.js 15.1 (App Router)
- **Frontend:** React 19 + TypeScript
- **UI:** Tailwind CSS
- **Database:** better-sqlite3 (local)
- **Cloud:** Firebase (Auth + Firestore cho sync)
- **HTTP:** axios
- **Parser:** cheerio
- **AI/LLM:** @google/generative-ai (Gemini)

## Dev Server
- **Luôn khởi động tại port 3010**: `npm run dev` → http://localhost:3010
- Port 3000 đã được dùng cho dự án khác, KHÔNG dùng port 3000

## Cấu trúc thư mục
```
src/
├── app/                    # Next.js App Router
│   ├── api/                # Backend API routes
│   │   ├── novels/         # CRUD novels
│   │   ├── chapters/       # CRUD chapters
│   │   ├── crawler/        # Crawl endpoints
│   │   ├── translate/      # Translation (SSE streaming)
│   │   ├── glossary/       # CRUD glossary
│   │   ├── hanviet/        # Hán-Việt conversion
│   │   ├── reading-progress/
│   │   ├── settings/
│   │   └── sync/           # Firebase backup/restore
│   ├── pages/              # UI pages (library, reader, search, translate, paste, settings)
│   └── layout.tsx
├── lib/                    # Core business logic
│   ├── db/sqlite.ts        # SQLite wrapper (full CRUD + export/import)
│   ├── crawler/            # Fanqie crawler
│   ├── translator/         # Gemini, Google, Ollama
│   ├── hanviet/            # Hán-Việt converter
│   └── firebase/           # Auth + Sync
├── components/             # React components
├── hooks/                  # Custom hooks
└── shared/                 # Types, utils
```

## Quy tắc code

### TypeScript
- Strict mode bật
- Dùng interface thay vì type khi có thể
- Export types từ `src/shared/types.ts`

### Naming conventions
- Components: PascalCase (`LibraryPage.tsx`)
- Hooks: camelCase với prefix "use" (`useAuth.ts`)
- Utils: camelCase (`formatChapter.ts`)
- Constants: UPPER_SNAKE_CASE

### Import order
1. React/Next.js imports
2. Third-party libraries
3. Local components
4. Local hooks/utils
5. Types
6. Styles

## API Keys (Environment)
```env
GEMINI_API_KEY=                          # Google Gemini API
NEXT_PUBLIC_FIREBASE_API_KEY=            # Firebase (cần NEXT_PUBLIC_ prefix)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Commands thường dùng
```bash
# Development (port 3010)
npm run dev

# Build
npm run build

# Lint
npm run lint
```

## Lưu ý quan trọng

### Crawler
- Respect rate limiting (delay giữa requests)
- Lưu cache để tránh crawl lại
- Handle encoding UTF-8 cho tiếng Trung

### Translation
- Gemini API: 1500 requests/ngày free
- Chia nhỏ chapter thành chunks (~2000 ký tự)
- Lưu glossary để dịch nhất quán tên nhân vật

### Storage
- SQLite database: `data/app.db`
- Thư mục `data/` đã được gitignore

### Firebase Sync
- Auth: Google Sign-in only (client-side)
- Sync: Manual backup/restore (không real-time)
- Firestore structure: `users/{userId}/novels/`, `chapters/`, `glossary/`, `reading_progress/`, `settings/`, `metadata/`
- Env vars PHẢI có prefix `NEXT_PUBLIC_` cho client-side access

## Nguyên tắc viết Plan

- Khi đưa ra các lựa chọn, phân tích ưu/nhược điểm để user quyết định
- Khi user đã chọn một option, **xóa bỏ các lựa chọn không được chọn**
- Chỉ giữ lại nội dung của lựa chọn cuối cùng trong plan
- Đánh dấu lựa chọn đã quyết định bằng ✅
- Plan phải ngắn gọn, chỉ chứa những gì sẽ thực hiện

## Quy tắc cập nhật tiến độ

- **Luôn cập nhật PLAN.md** sau mỗi phiên làm việc
- Đánh dấu `[x]` cho tasks đã hoàn thành trong Milestones
- Ghi lại ngày và công việc đã làm vào bảng TIẾN ĐỘ
- Ghi chú các **issue/bug** cần fix với prefix `**FIX:**`
- Commit và push code trước khi kết thúc phiên

## Sites hỗ trợ
- Fanqie (番茄) - Ưu tiên, miễn phí
- Qidian (起点) - Cần xử lý anti-crawl
- JJWXC (晋江) - Truyện nữ, đam mỹ
