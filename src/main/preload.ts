/**
 * Preload Script — Ponte segura entre o processo principal e o renderer.
 *
 * Expõe apenas APIs específicas via contextBridge.
 * NUNCA expõe ipcRenderer diretamente.
 *
 * Segurança:
 * - contextIsolation: true
 * - nodeIntegration: false
 * - Toda comunicação passa pelos handlers tipados definidos em IPC
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IPC } from './ipc-channels';
import type { ElectronAPI } from '@shared/electron-api';

// ─── API Exposta ao Renderer ──────────────────────

const electronAPI: ElectronAPI = {
  // Flags
  syncFlags: (flags: unknown[]) => ipcRenderer.invoke(IPC.FLAGS_SYNC, flags),
  loadFlags: () => ipcRenderer.invoke(IPC.FLAGS_LOAD),

  // Settings
  getSettings: () => ipcRenderer.invoke(IPC.SETTINGS_GET_ALL),
  setSetting: (key: string, value: unknown) => ipcRenderer.invoke(IPC.SETTINGS_SET, key, value),

  // File dialogs
  openFileDialog: () => ipcRenderer.invoke(IPC.FILE_OPEN_DIALOG),
  saveFileDialog: (defaultPath?: string) => ipcRenderer.invoke(IPC.FILE_SAVE_DIALOG, defaultPath),

  // File I/O
  readFile: (filePath: string) => ipcRenderer.invoke(IPC.FILE_READ, filePath),
  writeFile: (filePath: string, content: string) =>
    ipcRenderer.invoke(IPC.FILE_WRITE, filePath, content),

  // Window controls
  minimizeWindow: () => ipcRenderer.invoke(IPC.WINDOW_MINIMIZE),
  maximizeWindow: () => ipcRenderer.invoke(IPC.WINDOW_MAXIMIZE),
  closeWindow: () => ipcRenderer.invoke(IPC.WINDOW_CLOSE),
  isMaximized: () => ipcRenderer.invoke(IPC.WINDOW_IS_MAXIMIZED),

  // App info
  getAppVersion: () => ipcRenderer.invoke(IPC.APP_GET_VERSION),
  getPath: (name: string) => ipcRenderer.invoke(IPC.APP_GET_PATH, name),

  // Logging
  log: (level: string, message: string, ...args: unknown[]) =>
    ipcRenderer.invoke(IPC.LOG, level, message, ...args),

  // Menu actions listener
  onMenuAction: (callback: (action: string, ...args: unknown[]) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, action: string, ...args: unknown[]) => {
      callback(action, ...args);
    };
    ipcRenderer.on(IPC.MENU_ACTION, handler);
    return () => {
      ipcRenderer.removeListener(IPC.MENU_ACTION, handler);
    };
  },

  // Wallpaper
  saveWallpaper: (base64: string) => ipcRenderer.invoke(IPC.WALLPAPER_SAVE, base64),
  loadWallpaper: () => ipcRenderer.invoke(IPC.WALLPAPER_LOAD),
  removeWallpaper: () => ipcRenderer.invoke(IPC.WALLPAPER_REMOVE),

  // Updater status listener
  onUpdateStatus: (callback: (status: Record<string, unknown>) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, status: Record<string, unknown>) => {
      callback(status);
    };
    ipcRenderer.on(IPC.UPDATER_STATUS, handler);
    return () => {
      ipcRenderer.removeListener(IPC.UPDATER_STATUS, handler);
    };
  },
};

contextBridge.exposeInMainWorld('electron', electronAPI);

// ─── Type exports para o renderer ────────────────

export type { ElectronAPI } from '@shared/electron-api';
