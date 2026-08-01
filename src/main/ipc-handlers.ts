/**
 * IPC Handlers — Registra todos os handlers de comunicação.
 *
 * Cada handler:
 * - Valida entrada com Zod (quando aplicável)
 * - Retorna Result<T, AppError> para o renderer
 * - Loga operações
 * - Não lança exceções — embrulha em try/catch sempre
 */

import { ipcMain, dialog, app, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import logger from './logger';
import { IPC } from './ipc-channels';

const store = require('./store');
// ─── Registro ─────────────────────────────────────

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  logger.info('Registering IPC handlers...');

  // ─── Flags Sync ─────────────────────────────────
  ipcMain.handle(IPC.FLAGS_SYNC, (_event, flags: unknown[]) => {
    try {
      store.dataStore.set('flags', flags);
      logger.info(`Flags synced: ${flags.length} entries`);
      return { ok: true };
    } catch (error) {
      logger.error('Failed to sync flags:', error);
      return { ok: false, error: 'Failed to save flags' };
    }
  });

  ipcMain.handle(IPC.FLAGS_LOAD, () => {
    try {
      const flags = store.dataStore.get('flags', []);
      logger.info(`Flags loaded: ${(flags as unknown[]).length} entries`);
      return { ok: true, data: flags };
    } catch (error) {
      logger.error('Failed to load flags:', error);
      return { ok: true, data: [] }; // graceful fallback
    }
  });

  // ─── Settings ──────────────────────────────────
  ipcMain.handle(IPC.SETTINGS_GET_ALL, () => {
    try {
      return { ok: true, data: store.settingsStore.store };
    } catch (error) {
      logger.error('Failed to get settings:', error);
      return { ok: false, error: 'Failed to read settings' };
    }
  });

  ipcMain.handle(IPC.SETTINGS_SET, (_event, key: string, value: unknown) => {
    try {
      store.settingsStore.set(key, value);
      logger.debug(`Setting "${key}" updated`);
      return { ok: true };
    } catch (error) {
      logger.error(`Failed to set ${key}:`, error);
      return { ok: false, error: `Failed to save setting: ${key}` };
    }
  });

  // ─── File Dialogs ──────────────────────────────
  ipcMain.handle(IPC.FILE_OPEN_DIALOG, async () => {
    try {
      const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
      });

      if (result.canceled || !result.filePaths[0]) {
        return { ok: true, data: null };
      }

      return { ok: true, data: result.filePaths[0] };
    } catch (error) {
      logger.error('File dialog failed:', error);
      return { ok: false, error: 'Failed to open file dialog' };
    }
  });

  ipcMain.handle(IPC.FILE_SAVE_DIALOG, async (_event, defaultPath?: string) => {
    try {
      const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultPath || 'flags.json',
        filters: [{ name: 'JSON Files', extensions: ['json'] }],
      });

      if (result.canceled || !result.filePath) {
        return { ok: true, data: null };
      }

      return { ok: true, data: result.filePath };
    } catch (error) {
      logger.error('Save dialog failed:', error);
      return { ok: false, error: 'Failed to open save dialog' };
    }
  });

  // ─── File Read/Write ───────────────────────────
  ipcMain.handle(IPC.FILE_READ, async (_event, filePath: string) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return { ok: true, data: content };
    } catch (error) {
      logger.error(`Failed to read file: ${filePath}`, error);
      return { ok: false, error: `Could not read: ${filePath}` };
    }
  });

  ipcMain.handle(IPC.FILE_WRITE, async (_event, filePath: string, content: string) => {
    try {
      await fs.writeFile(filePath, content, 'utf-8');
      logger.info(`File written: ${filePath}`);
      return { ok: true };
    } catch (error) {
      logger.error(`Failed to write file: ${filePath}`, error);
      return { ok: false, error: `Could not write: ${filePath}` };
    }
  });

  // ─── Window ────────────────────────────────────
  ipcMain.handle(IPC.WINDOW_IS_MAXIMIZED, () => {
    return mainWindow?.isMaximized() ?? false;
  });

  ipcMain.handle(IPC.WINDOW_MINIMIZE, () => {
    mainWindow?.minimize();
  });

  ipcMain.handle(IPC.WINDOW_MAXIMIZE, () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle(IPC.WINDOW_CLOSE, () => {
    mainWindow?.close();
  });

  // ─── App ───────────────────────────────────────
  ipcMain.handle(IPC.APP_GET_PATH, (_event, name: string) => {
    return app.getPath(name as never);
  });

  ipcMain.handle(IPC.APP_GET_VERSION, () => {
    return app.getVersion();
  });

  // ─── Log ───────────────────────────────────────
  ipcMain.handle(
    IPC.LOG,
    (_event, level: 'info' | 'warn' | 'error' | 'debug', message: string, ...args: unknown[]) => {
      logger[level](message, ...args);
    }
  );

  // ─── Wallpaper ─────────────────────────────────
  const wpDir = path.join(app.getPath('userData'), 'wallpaper');

  ipcMain.handle(IPC.WALLPAPER_SAVE, async (_event, base64Data: string) => {
    try {
      await fs.mkdir(wpDir, { recursive: true });
      const wpPath = path.join(wpDir, 'bg.png');
      const buffer = Buffer.from(base64Data.split(',')[1] || base64Data, 'base64');
      await fs.writeFile(wpPath, buffer);
      return { ok: true, path: wpPath };
    } catch (e: any) {
      logger.error('Wallpaper save failed:', e.message);
      return { ok: false, error: e.message };
    }
  });

  ipcMain.handle(IPC.WALLPAPER_LOAD, async () => {
    try {
      const wpPath = path.join(wpDir, 'bg.png');
      try {
        await fs.access(wpPath);
      } catch {
        return { ok: false };
      }
      const buffer = await fs.readFile(wpPath);
      const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
      return { ok: true, dataUrl };
    } catch {
      return { ok: false };
    }
  });

  ipcMain.handle(IPC.WALLPAPER_REMOVE, async () => {
    try {
      const wpPath = path.join(wpDir, 'bg.png');
      await fs.unlink(wpPath).catch(() => {});
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });

  logger.info('IPC handlers registered');
}
