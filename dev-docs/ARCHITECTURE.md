# FastFlag Editor — Architecture Documentation

## Overview

FastFlag Editor is a desktop application for managing Roblox FastFlags.  
Built with Electron + React + TypeScript, fully offline, no backend.

**Stack:** Electron 43, React 19.2, Vite 7.3, TypeScript 5.9, Zustand 5, Tailwind CSS 4, Zod 4

---

## Architecture Layers

```
┌─────────────────────────────────────────────────┐
│                  RENDERER (React)               │
│  Components / Stores / Hooks / Plugins / Utils   │
│                  ┌───────────┐                  │
│                  │ Event Bus │                  │
│                  └───────────┘                  │
├─────────────────────────────────────────────────┤
│               contextBridge (preload.ts)         │
│        IPC Channels Typed (ipc-channels.ts)     │
├─────────────────────────────────────────────────┤
│              MAIN PROCESS (Node.js)             │
│  Window │ Menu │ IPC Handlers │ Store │ Logger  │
│  Updater │ Migrations │ File Dialogs │ Security │
├─────────────────────────────────────────────────┤
│              electron-store (filesystem)         │
│         %APPDATA%/FastFlag Editor/              │
└─────────────────────────────────────────────────┘
```

## Main Process Modules

| Module              | Path                       | Responsibility                              |
| ------------------- | -------------------------- | ------------------------------------------- |
| **index.ts**        | `src/main/index.ts`        | Entry point: orchestrates startup           |
| **window.ts**       | `src/main/window.ts`       | BrowserWindow creation, bounds persistence  |
| **menu.ts**         | `src/main/menu.ts`         | Native OS menu (File/Edit/View/Window/Help) |
| **ipc-channels.ts** | `src/main/ipc-channels.ts` | Typed IPC channel constants                 |
| **ipc-handlers.ts** | `src/main/ipc-handlers.ts` | All IPC handler registration                |
| **store.ts**        | `src/main/store.ts`        | electron-store instances + migrations       |
| **logger.ts**       | `src/main/logger.ts`       | Structured logging with rotation            |
| **updater.ts**      | `src/main/updater.ts`      | Auto-update via electron-updater            |
| **preload.ts**      | `src/main/preload.ts`      | contextBridge safe API                      |

## Renderer Architecture

| Path              | Responsibility                 |
| ----------------- | ------------------------------ |
| `src/components/` | React UI components            |
| `src/stores/`     | Zustand state stores           |
| `src/hooks/`      | Custom React hooks             |
| `src/plugins/`    | Plugin system                  |
| `src/providers/`  | ThemeProvider                  |
| `src/shared/`     | Types shared with main process |
| `src/utils/`      | Event bus, utilities           |
| `src/adapters/`   | Roblox format parsers          |

## State Management

- **Flag Store** (Zustand + Zundo): flags array with undo/redo
- **UI Store**: UI-only state (dialog open, context menu, selection)
- **electron-store**: Persistent data on filesystem

## Data Flow

1. User interacts with React components
2. Components call zustand store methods
3. Store is subscribed to by auto-save hook
4. Auto-save syncs state → filesystem via IPC
5. Main process persists to `electron-store`

## Security

- `contextIsolation: true` — renderer isolated
- `nodeIntegration: false` — No Node.js in renderer
- All communication via typed IPC channels
- Preload uses `contextBridge` (no raw ipcRenderer)

## Build Pipeline

```
npm run build
  ├── build:renderer (vite build → dist/index.html)
  └── build:main (tsc -p tsconfig.main.json → dist/main/)

npm run release
  └── electron-builder (asar + nsis + portable)
```

## Future Roadmap

- [ ] Virtual list for 100K+ flags
- [ ] Unit tests (Vitest + Testing Library)
- [ ] i18n support (Portuguese, Spanish)
- [ ] Plugin marketplace
- [ ] CI/CD via GitHub Actions
