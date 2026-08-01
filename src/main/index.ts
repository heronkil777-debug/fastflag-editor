/**
 * Main Process Entry Point
 *
 * Orquestra todos os subsistemas:
 * 1. Inicializa logs
 * 2. Roda migrations de dados
 * 3. Cria janela principal
 * 4. Registra handlers IPC
 * 5. Cria menu
 * 6. Inicializa auto-updater
 *
 * Este é o ÚNICO ponto de inicialização.
 * Cada módulo exporta uma função de setup que é chamada aqui.
 */

import { app } from 'electron';
import { createMainWindow, getMainWindow } from './window';
import { registerIpcHandlers } from './ipc-handlers';
import { runMigrations } from './store';
import { initUpdater } from './updater';
import logger from './logger';

// ─── Startup ──────────────────────────────────────

void app.whenReady().then(() => {
  logger.info('=== FastFlag Editor starting ===');
  logger.info(`Version: ${app.getVersion()}`);
  logger.info(`Platform: ${process.platform}`);

  // 1. Migrations (deve rodar ANTES de criar a janela)
  runMigrations();

  // 2. Criar janela principal
  const mainWindow = createMainWindow();

  // 3. Registrar IPC handlers
  registerIpcHandlers(mainWindow);

  // 4. Inicializar auto-updater
  initUpdater(mainWindow);

  // 6. macOS: recriar janela quando o dock é clicado
  app.on('activate', () => {
    if (getMainWindow() === null) {
      const window = createMainWindow();
      registerIpcHandlers(window);
      initUpdater(window);
    }
  });

  logger.info('=== FastFlag Editor ready ===');
});

// ─── Shutdown ─────────────────────────────────────

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    logger.info('All windows closed — quitting');
    app.quit();
  }
});

app.on('before-quit', () => {
  logger.info('Application quitting');
});

// ─── Squirrel startup handling ───────────────────
// Detecta instalação/atualização do Squirrel (electron-builder)
(async () => {
  try {
    const squirrelModule = await import('electron-squirrel-startup');
    const squirrel = squirrelModule.default ?? squirrelModule;
    if (squirrel) {
      logger.info('Squirrel startup event — exiting');
      app.quit();
    }
  } catch {
    // electron-squirrel-startup não disponível — ok
  }
})();
