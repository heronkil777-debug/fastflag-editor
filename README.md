# FastFlag Editor

A universal desktop editor for Roblox FastFlags. Create, edit, organize, and manage any FastFlag with tags, presets, import/export, and more. Fully offline, no backend.

**Stack:** Electron 43 · React 19.2 · TypeScript 5.9 · Zustand 5 · Tailwind CSS 4 · Zod 4

## Features

- Create, edit, duplicate and delete FastFlags
- Tag system with auto-tagging
- Presets support
- Import/Export JSON
- Drag & drop JSON files
- Search and filter flags
- Undo/Redo (Zundo)
- Custom wallpaper background
- Cross-platform (Windows, macOS, Linux)

## Quick Start

```bash
# Install dependencies
npm install

# Dev mode (Vite + Electron)
npm run electron:dev

# Build only
npm run build

# Build and package (installer)
npm run release
```

## Platforms

| Platform | Format                    | Status    |
| -------- | ------------------------- | --------- |
| Windows  | NSIS installer + portable | Supported |
| macOS    | DMG                       | Supported |
| Linux    | AppImage, deb             | Supported |

## Project Structure

```
src/
├── main/           # Electron main process (Node.js)
│   ├── index.ts    # Entry point
│   ├── window.ts   # Window management
│   ├── store.ts    # Persistent storage
│   ├── updater.ts  # Auto-update
│   └── preload.ts  # Secure IPC bridge
├── components/     # React UI components
├── stores/         # Zustand state stores
├── hooks/          # Custom React hooks
├── adapters/       # Roblox format parsers
├── providers/      # React providers
├── types/          # TypeScript types
└── utils/          # Utilities
```

## Tech Stack

| Layer         | Technology                    |
| ------------- | ----------------------------- |
| Desktop Shell | Electron 43                   |
| UI            | React 19.2 + Tailwind CSS 4   |
| Language      | TypeScript 5.9 (strict)       |
| State         | Zustand 5 + Zundo (undo/redo) |
| Validation    | Zod 4                         |
| Build         | Vite 7.3 + electron-builder   |
| Storage       | electron-store (filesystem)   |

## Building for Distribution

```bash
npm run release
```

Infrastructure in `release/`. For cross-platform builds, use GitHub Actions (one per OS).

## Security

- `contextIsolation: true`
- `nodeIntegration: false`
- Typed IPC channels only
- `contextBridge` preload (no raw IPC expose)

## License

MIT
