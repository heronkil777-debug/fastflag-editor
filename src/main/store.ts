/**
 * Main Store — Persistência de dados no filesystem via electron-store.
 *
 * Responsável por:
 * - Carregar/salvar flags do filesystem (não localStorage)
 * - Manter configurações do app
 * - Gerenciar arquivos recentes
 * - Migração de schemas de dados entre versões
 *
 * electron-store@11 é ESM-native; quando compilado pra CJS o TypeScript
 * perde a resolução de tipos. Usamos import padrão com esModuleInterop.
 */

import Store from 'electron-store';
import { app } from 'electron';
import logger from './logger';

// ─── Schema versions ──────────────────────────────

const CURRENT_DATA_VERSION = 1;

// ─── Stores ───────────────────────────────────────
// Usamos type assertion para contornar limitações do ESM/CJS
// As instâncias de Store têm os métodos get() e set() em tempo de execução

/** Dados das flags do usuário */
export const dataStore = new Store({
  name: 'user-data',
  defaults: {
    version: CURRENT_DATA_VERSION,
    flags: [] as Record<string, unknown>[],
  },
}) as unknown as {
  get: <T>(key: string, defaultValue?: T) => T | undefined;
  set: <T>(key: string, value: T) => void;
  store: Record<string, unknown>;
};

/** Configurações da aplicação */
export const settingsStore = new Store({
  name: 'settings',
  defaults: {
    windowBounds: { width: 1200, height: 800 },
    theme: 'dark',
    autoSave: true,
    autoSaveInterval: 2000,
    maxUndoHistory: 500,
    language: 'en',
    recentFiles: [] as string[],
  },
}) as unknown as {
  get: <T>(key: string, defaultValue?: T) => T | undefined;
  set: <T>(key: string, value: T) => void;
  store: Record<string, unknown>;
};

// ─── Migrations ───────────────────────────────────

type MigrationFn = (data: Record<string, unknown>) => Record<string, unknown>;

const migrations: Record<number, MigrationFn> = {
  // Futuras migrations vão aqui
};

export function runMigrations(): void {
  const storedVersion = (dataStore.get('version') as number) || 1;

  if (storedVersion >= CURRENT_DATA_VERSION) {
    logger.debug(`Data at version ${storedVersion}, no migrations needed`);
    return;
  }

  logger.info(
    `Running data migrations from v${storedVersion} to v${CURRENT_DATA_VERSION}`
  );

  try {
    let data = dataStore.store as Record<string, unknown>;

    for (let v = storedVersion + 1; v <= CURRENT_DATA_VERSION; v++) {
      const migrate = migrations[v];
      if (migrate) {
        logger.info(`Applying migration v${v}`);
        data = migrate(data);
      }
    }

    data.version = CURRENT_DATA_VERSION;
    dataStore.set('flags', data.flags);
    dataStore.set('version', CURRENT_DATA_VERSION);
    logger.info('Migrations complete');
  } catch (error) {
    logger.error('Migration failed:', error);
  }
}

// ─── Helpers ──────────────────────────────────────

export function getAppDataPath(): string {
  return app.getPath('userData');
}

export function getExportsPath(): string {
  return app.getPath('documents');
}