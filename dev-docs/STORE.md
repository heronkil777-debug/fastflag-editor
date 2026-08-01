# FastFlag Editor — Store Architecture

## Stores Overview

| Store           | Library         | Persistence                 | Scope    |
| --------------- | --------------- | --------------------------- | -------- |
| Flag Store      | Zustand + Zundo | electron-store (filesystem) | Main     |
| UI Store        | Zustand         | In-memory                   | Renderer |
| Settings Store  | electron-store  | Filesystem                  | Main     |
| Plugin Registry | Custom          | In-memory                   | Renderer |

---

## Flag Store (`src/stores/flag-store.ts`)

### State Shape

```ts
interface FastFlag {
  id: string; // UUID v4
  name: string; // e.g. "FIntRenderShadowQuality"
  value: string; // always string
  tags: string[]; // auto-tagged on creation
  preset: boolean; // included in preset exports
  createdAt: number; // epoch timestamp
  updatedAt: number;
}
```

### Key Actions

- `addFlag(name, value, tags?)` → auto-tags if no tags provided
- `importFromJSON(json)` → auto-detects format (roblox | fastflag-editor)
- `exportAll()` / `exportPresetRoblox()` / `exportAllRoblox()`
- `autoTagFlag(id)` / `autoTagAll()` → removes tags based on flag name patterns

### Undo/Redo

- Uses **zundo** middleware (Zustand temporal)
- Max history: 500 actions
- Partialized to only store `flags` (not transient UI state)

### Persistence

- **No longer uses localStorage**
- State synced via `window.electron.syncFlags()` → IPC → `electron-store`
- Auto-save hook debounces after 2000ms + saves on blur/beforeUnload

### Migration

- `runMigrations()` runs on app startup
- Version number stored in electron-store
- Migration functions registered per version (1→2, 2→3, etc.)

---

## UI Store (`src/stores/ui-store.ts`)

### State

```ts
interface UIState {
  selectedFlagId: string | null;
  editingCell: { flagId; column } | null;
  contextMenu: { x; y; flagId } | null;
  dialogState: { addFlagOpen; importOpen };
  filters: { tag: string | null; searchQuery: string };
  sortConfig: { column; direction } | null;
}
```

### Design

- **No persistence** — UI state is ephemeral
- **Pure Zustand** (no middleware)
- All actions are synchronous

---

## Settings Sync

Settings are persisted via electron-store in the main process.
The renderer reads/writes through typed IPC channels:

```ts
// Read:
window.electron.getSettings() → { theme, autoSave, language, ... }

// Write:
window.electron.setSetting('theme', 'light')
```

---

## Performance Notes

### Why zundo over redux-undo?

- Zero additional dependencies (Zustand native)
- Smaller bundle size (2KB vs 14KB)
- Cleaner API with `partialize` for snapshot efficiency

### Memory Pressure

- 10K flags ≈ ~1MB JSON in memory
- Undo history stores up to 500 snapshots — worst case 500×1MB = 500MB
  Mitigated by partialize: only stores `[FastFlag[], FastFlag[]]` diff
- For heavy use cases (>100K flags), consider virtual list
