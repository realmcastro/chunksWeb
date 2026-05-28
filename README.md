# ChunksWeb - English Fluency Learning Platform

A modern, offline-first Progressive Web Application (PWA) for English fluency development through chunk-based acquisition, structured grammar progression, and scientifically optimized spaced repetition review.

## Features

- **Chunk-Based Learning**: Learn English through natural language patterns and chunks
- **Structured Progression**: Foundation → Basic → Advanced levels
- **Spaced Repetition**: SM-2 algorithm for optimal memory retention
- **Multiple Study Modes**: Free exploration, daily review, category focus, Feynman mode
- **Exercise Types**: Active recall, cloze deletion, sentence reconstruction, translation drills
- **Offline Support**: Full PWA with service worker and IndexedDB caching
- **Progress Analytics**: Streaks, mastery distribution, review forecasting
- **Dark Mode**: Full dark mode support with system preference detection

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (existing database via Prisma ORM)
- **Offline Storage**: IndexedDB via Dexie.js
- **State Management**: Zustand
- **Translation**: Bergamot (WebAssembly-based neural MT)
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Install dependencies**

```bash
npm install
```

2. **Generate Prisma client**

```bash
npm run db:generate
```

3. **Push schema to database** (if needed)

```bash
npm run db:push
```

4. **Start development server**

```bash
npm run dev
```

5. **Open browser**

Navigate to [http://localhost:3000](http://localhost:3000)

### Database

The application uses an existing SQLite database (`chunks_v1.db`) as the single source of truth. The Prisma schema is configured to connect to this database file.

If you need to inspect the database:

```bash
npm run db:studio
```

## Project Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx           # Root layout with fonts
│   ├── page.tsx             # Dashboard/home page
│   └── globals.css          # Global styles + CSS variables
├── components/
│   └── ui/                  # Base UI components (Button, Card, Input)
├── lib/
│   ├── db/                  # Database layer
│   │   ├── prisma.ts        # Prisma client singleton
│   │   └── queries/         # Query functions
│   ├── spaced-repetition/   # SM-2 algorithm
│   └── utils/               # Utility functions
└── types/                   # TypeScript types
```

## Study Modes

1. **Spaced Repetition Review** - Review items due for review using SM-2
2. **Category Focus** - Deep dive into a specific category
3. **Feynman Mode** - Explain chunks in your own words
4. **Free Exploration** - Browse and learn at your own pace
5. **Weakness Targeted** - Focus on items with low mastery

## Offline Support

The application is a Progressive Web App (PWA) that:

- Caches the app shell for instant load
- Stores chunks, categories, and user data in IndexedDB
- Syncs progress when online
- Works fully offline after initial load

## Translation

Translations are handled client-side using Bergamot Translator (WebAssembly):

- No API keys required
- No internet required after model download
- All translations stored in SQLite for reuse
- Supports English → Portuguese

## Scripts

| Command               | Description              |
| --------------------- | ------------------------ |
| `npm run dev`         | Start development server |
| `npm run build`       | Build for production     |
| `npm run start`       | Start production server  |
| `npm run lint`        | Run ESLint               |
| `npm run db:generate` | Generate Prisma client   |
| `npm run db:push`     | Push schema to database  |
| `npm run db:studio`   | Open Prisma Studio       |

## License

MIT
"# chunksWeb" 
