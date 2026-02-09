# Novel Translator

Desktop application for translating Chinese novels to Vietnamese.

## Features

- **Crawl novels** from Chinese novel sites (Fanqie, Qidian, JJWXC)
- **Translate** with multiple backends (Gemini API, Google Translate, Ollama)
- **Read** with customizable UI and progress tracking
- **Sync** across devices with Firebase

## Tech Stack

- **Desktop:** Electron + React + TypeScript
- **Build:** electron-vite
- **UI:** Tailwind CSS + shadcn/ui
- **Database:** SQLite (local) + Firebase (cloud sync)
- **Translation:** Gemini API, Google Translate, Ollama

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Type check
npm run typecheck
```

## Project Structure

```
src/
├── main/           # Electron main process
│   ├── crawler/    # Novel crawlers
│   ├── translator/ # Translation modules
│   ├── storage/    # SQLite + file system
│   └── firebase/   # Cloud sync
├── preload/        # Electron preload scripts
├── renderer/       # React UI
│   ├── pages/
│   ├── components/
│   └── hooks/
└── shared/         # Shared types and utilities
```

## Configuration

Copy `.env.example` to `.env` and fill in your API keys:

```bash
cp .env.example .env
```

## License

MIT
