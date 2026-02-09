# CLAUDE.md - Hướng dẫn cho Claude Code

## Tổng quan dự án
Ứng dụng Desktop dịch thuật truyện Trung Quốc sang tiếng Việt.

## Tech Stack
- **Framework:** Electron 28+ với electron-vite
- **Frontend:** React 18 + TypeScript
- **UI:** shadcn/ui + Tailwind CSS
- **State:** Zustand
- **Database:** better-sqlite3 (local)
- **Cloud:** Firebase (Firestore cho sync)
- **HTTP:** axios hoặc got
- **Parser:** cheerio

## Cấu trúc thư mục
```
src/
├── main/           # Electron main process
│   ├── crawler/    # Crawl website truyện
│   ├── translator/ # Dịch thuật (Gemini, Google)
│   ├── storage/    # SQLite + file system
│   └── firebase/   # Sync với cloud
├── renderer/       # React UI
│   ├── pages/      # Library, Reader, Search, Settings
│   ├── components/ # Shared components
│   └── hooks/      # Custom hooks
└── shared/         # Types, utils dùng chung
```

## Quy tắc code

### TypeScript
- Strict mode bật
- Dùng interface thay vì type khi có thể
- Export types từ `src/shared/types.ts`

### Naming conventions
- Components: PascalCase (`LibraryPage.tsx`)
- Hooks: camelCase với prefix "use" (`useNovel.ts`)
- Utils: camelCase (`formatChapter.ts`)
- Constants: UPPER_SNAKE_CASE

### Import order
1. React/Electron imports
2. Third-party libraries
3. Local components
4. Local hooks/utils
5. Types
6. Styles

### IPC Communication
- Main process handlers: `src/main/ipc/`
- Preload scripts: `src/preload/`
- Renderer gọi qua `window.api`

## API Keys (Environment)
```env
GEMINI_API_KEY=        # Google Gemini API
FIREBASE_CONFIG=       # Firebase config JSON
```

## Commands thường dùng
```bash
# Development
npm run dev

# Build
npm run build

# Lint
npm run lint

# Type check
npm run typecheck
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
- Text truyện lưu trong `data/novels/`
- SQLite database: `data/app.db`
- Thư mục `data/` đã được gitignore

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

**Ví dụ cập nhật PLAN.md:**
```markdown
# TIẾN ĐỘ

| Ngày | Công việc |
|------|-----------|
| 2026-02-05 | Setup project, implement crawler |
| 2026-02-06 | Fix Electron issue, implement translator |

# MILESTONES

**Milestone 1: Setup & Crawl**
- [x] Init project
- [x] Implement Fanqie crawler
- [ ] **FIX:** Electron environment issue
```

## Workflow khi thêm tính năng mới

1. Tạo branch: `feature/ten-tinh-nang`
2. Viết types trước trong `shared/types.ts`
3. Implement main process logic
4. Tạo IPC handlers
5. Build UI components
6. Test và commit

## Sites hỗ trợ
- Fanqie (番茄) - Ưu tiên, miễn phí
- Qidian (起点) - Cần xử lý anti-crawl
- JJWXC (晋江) - Truyện nữ, đam mỹ
