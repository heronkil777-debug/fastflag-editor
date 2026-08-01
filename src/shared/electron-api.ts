/**
 * Shared Types — Tipos compartilhados entre main, preload e renderer.
 *
 * Este arquivo elimina a duplicação de tipos e garante que o preload
 * e o renderer estejam sempre sincronizados.
 */

// ─── Electron API exposta via contextBridge ────────────

export interface ElectronAPI {
  // Flags
  syncFlags: (flags: unknown[]) => Promise<{ ok: boolean; error?: string }>;
  loadFlags: () => Promise<{ ok: boolean; data?: unknown[]; error?: string }>;

  // Settings
  getSettings: () => Promise<{ ok: boolean; data?: Record<string, unknown>; error?: string }>;
  setSetting: (key: string, value: unknown) => Promise<{ ok: boolean; error?: string }>;

  // File dialogs
  openFileDialog: () => Promise<{ ok: boolean; data?: string | null; error?: string }>;
  saveFileDialog: (
    defaultPath?: string
  ) => Promise<{ ok: boolean; data?: string | null; error?: string }>;

  // File I/O
  readFile: (filePath: string) => Promise<{ ok: boolean; data?: string; error?: string }>;
  writeFile: (filePath: string, content: string) => Promise<{ ok: boolean; error?: string }>;

  // Window controls
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isMaximized: () => Promise<boolean>;

  // App info
  getAppVersion: () => Promise<string>;
  getPath: (name: string) => Promise<{ ok: boolean; data?: string; error?: string }>;

  // Logging
  log: (
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    ...args: unknown[]
  ) => Promise<{ ok: boolean }>;

  // Menu actions listener
  onMenuAction: (callback: (action: string, ...args: unknown[]) => void) => () => void;

  // Wallpaper
  saveWallpaper: (base64: string) => Promise<{ ok: boolean; path?: string; error?: string }>;
  loadWallpaper: () => Promise<{ ok: boolean; dataUrl?: string; error?: string }>;
  removeWallpaper: () => Promise<{ ok: boolean; error?: string }>;

  // Updater status listener
  onUpdateStatus: (callback: (status: Record<string, unknown>) => void) => () => void;
}
