/**
 * IPC Handlers — Registra todos os handlers de comunicação.
 *
 * Cada handler:
 * - Valida entrada com Zod (ipc-schemas.ts)
 * - Retorna Result<T, AppError> para o renderer
 * - Loga operações
 * - Não lança exceções — embrulha em try/catch sempre
 */

import { ipcMain, dialog, app, BrowserWindow } from 'electron';
import fs from 'fs/promises';
import path from 'path';
import { z } from 'zod';
import logger from './logger';
import { IPC } from './ipc-channels';
import {
  validatePayload,
  FlagsSyncPayloadSchema,
  SettingsSetPayloadSchema,
  FileReadPayloadSchema,
  FileWritePayloadSchema,
  WallpaperSavePayloadSchema,
  LogPayloadSchema,
} from './ipc-schemas';

// ─── Types ────────────────────────────────────────────

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

// ─── Store access (lazy, via function) ────────────────

let dataStore: {
  get: <T>(key: string, defaultValue?: T) => T | undefined;
  set: <T>(key: string, value: T) => void;
  store: Record<string, unknown>;
} | null = null;

let settingsStore: {
  get: <T>(key: string, defaultValue?: T) => T | undefined;
  set: <T>(key: string, value: T) => void;
  store: Record<string, unknown>;
} | null = null;

async function initStores(): Promise<void> {
  if (dataStore && settingsStore) return;
  const storeModule = await import('./store');
  dataStore = storeModule.dataStore;
  settingsStore = storeModule.settingsStore;
}

// ─── Helpers ──────────────────────────────────────────

function createHandler<T, R>(
  channel: string,
  schema: z.ZodSchema<T> | null,
  handler: (data: T) => Promise<Result<R>>
) {
  ipcMain.handle(channel, async (_event, payload: unknown): Promise<Result<R>> => {
    await initStores();
    if (schema) {
      const validation = validatePayload(schema, payload);
      if (!validation.ok) {
        logger.warn(`Validation failed for ${channel}:`, validation.error);
        return { ok: false, error: validation.error };
      }
      return handler(validation.data);
    }

    return handler(payload as T);
  });
}

// ─── Registro ─────────────────────────────────────────

export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  logger.info('Registering IPC handlers...');

  // ─── Flags Sync ─────────────────────────────────────
  createHandler<z.infer<typeof FlagsSyncPayloadSchema>, null>(
    IPC.FLAGS_SYNC,
    FlagsSyncPayloadSchema,
    flags => {
      try {
        dataStore!.set('flags', flags);
        logger.info(`Flags synced: ${flags.length} entries`);
        return Promise.resolve({ ok: true, data: null });
      } catch (error) {
        logger.error('Failed to sync flags:', error);
        return Promise.resolve({ ok: false, error: 'Failed to save flags' });
      }
    }
  );

  createHandler<unknown, unknown[]>(IPC.FLAGS_LOAD, null, () => {
    try {
      const flags = dataStore!.get('flags', []);
      logger.info(`Flags loaded: ${(flags as unknown[]).length} entries`);
      return Promise.resolve({ ok: true, data: flags as unknown[] });
    } catch (error) {
      logger.error('Failed to load flags:', error);
      return Promise.resolve({ ok: true, data: [] });
    }
  });

  // ─── Settings ──────────────────────────────────────
  createHandler<unknown, Record<string, unknown>>(IPC.SETTINGS_GET_ALL, null, () => {
    try {
      return Promise.resolve({ ok: true, data: settingsStore!.store });
    } catch (error) {
      logger.error('Failed to get settings:', error);
      return Promise.resolve({ ok: false, error: 'Failed to read settings' });
    }
  });

  createHandler<z.infer<typeof SettingsSetPayloadSchema>, null>(
    IPC.SETTINGS_SET,
    SettingsSetPayloadSchema,
    ({ key, value }) => {
      try {
        settingsStore!.set(key, value);
        logger.debug(`Setting "${key}" updated`);
        return Promise.resolve({ ok: true, data: null });
      } catch (error) {
        logger.error(`Failed to set ${key}:`, error);
        return Promise.resolve({ ok: false, error: `Failed to save setting: ${key}` });
      }
    }
  );

  // ─── File Dialogs ──────────────────────────────────
  createHandler<unknown, string | null>(IPC.FILE_OPEN_DIALOG, null, async () => {
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

  createHandler<{ defaultPath?: string }, string | null>(
    IPC.FILE_SAVE_DIALOG,
    null,
    async (_event, defaultPath?: string) => {
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
    }
  );

  // ─── File Read/Write ───────────────────────────────
  createHandler<z.infer<typeof FileReadPayloadSchema>, string>(
    IPC.FILE_READ,
    FileReadPayloadSchema,
    async ({ filePath }) => {
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        return { ok: true, data: content };
      } catch (error) {
        logger.error(`Failed to read file: ${filePath}`, error);
        return { ok: false, error: `Could not read: ${filePath}` };
      }
    }
  );

  createHandler<z.infer<typeof FileWritePayloadSchema>, null>(
    IPC.FILE_WRITE,
    FileWritePayloadSchema,
    async ({ filePath, content }) => {
      try {
        await fs.writeFile(filePath, content, 'utf-8');
        logger.info(`File written: ${filePath}`);
        return { ok: true, data: null };
      } catch (error) {
        logger.error(`Failed to write file: ${filePath}`, error);
        return { ok: false, error: `Could not write: ${filePath}` };
      }
    }
  );

  // ─── Window ────────────────────────────────────────
  ipcMain.handle(IPC.WINDOW_IS_MAXIMIZED, (): boolean => {
    return mainWindow?.isMaximized() ?? false;
  });

  ipcMain.handle(IPC.WINDOW_MINIMIZE, (): void => {
    mainWindow?.minimize();
  });

  ipcMain.handle(IPC.WINDOW_MAXIMIZE, (): void => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.handle(IPC.WINDOW_CLOSE, (): void => {
    mainWindow?.close();
  });

  // ─── App ───────────────────────────────────────────
  createHandler<string, string>(
    IPC.APP_GET_PATH,
    z.string().min(1),
    (name): Promise<Result<string>> => {
      const validPaths = [
        'home',
        'appData',
        'assets',
        'userData',
        'sessionData',
        'temp',
        'exe',
        'module',
        'desktop',
        'documents',
        'downloads',
        'music',
        'pictures',
        'videos',
        'recent',
        'logs',
        'crashDumps',
      ] as const;
      type ValidPathName = (typeof validPaths)[number];
      if (!validPaths.includes(name as ValidPathName)) {
        return Promise.resolve({ ok: false, error: `Invalid path name: ${name}` });
      }
      return Promise.resolve({
        ok: true,
        data: app.getPath(name as ValidPathName),
      });
    }
  );

  ipcMain.handle(IPC.APP_GET_VERSION, (): string => {
    return app.getVersion();
  });

  // ─── Log ───────────────────────────────────────────
  createHandler<z.infer<typeof LogPayloadSchema>, null>(
    IPC.LOG,
    LogPayloadSchema,
    ({ level, message, args }) => {
      logger[level](message, ...(args ?? []));
      return Promise.resolve({ ok: true, data: null });
    }
  );

  // ─── Wallpaper ─────────────────────────────────────
  const wpDir = path.join(app.getPath('userData'), 'wallpaper');

  createHandler<z.infer<typeof WallpaperSavePayloadSchema>, { path: string }>(
    IPC.WALLPAPER_SAVE,
    WallpaperSavePayloadSchema,
    async ({ base64Data }) => {
      try {
        await fs.mkdir(wpDir, { recursive: true });
        const wpPath = path.join(wpDir, 'bg.png');
        const buffer = Buffer.from(base64Data.split(',')[1] || base64Data, 'base64');
        await fs.writeFile(wpPath, buffer);
        return { ok: true, data: { path: wpPath } };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        logger.error('Wallpaper save failed:', message);
        return { ok: false, error: message };
      }
    }
  );

  createHandler<unknown, { dataUrl: string } | null>(IPC.WALLPAPER_LOAD, null, async () => {
    try {
      const wpPath = path.join(wpDir, 'bg.png');
      try {
        await fs.access(wpPath);
      } catch {
        return { ok: true, data: null };
      }
      const buffer = await fs.readFile(wpPath);
      const dataUrl = `data:image/png;base64,${buffer.toString('base64')}`;
      return { ok: true, data: { dataUrl } };
    } catch {
      return { ok: true, data: null };
    }
  });

  createHandler<unknown, null>(IPC.WALLPAPER_REMOVE, null, async () => {
    try {
      const wpPath = path.join(wpDir, 'bg.png');
      await fs.unlink(wpPath).catch(() => {});
      return { ok: true, data: null };
    } catch {
      return { ok: false, error: 'Failed to remove wallpaper' };
    }
  });

  logger.info('IPC handlers registered');
}
