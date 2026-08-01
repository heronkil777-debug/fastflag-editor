/**
 * Auto Updater — Integração com electron-updater.
 *
 * Checa atualizações em:
 * - Startup (silencioso)
 * - Manual (via menu Help > Check for Updates)
 *
 * Configurado para GitHub Releases.
 */

import { autoUpdater } from 'electron-updater';
import { BrowserWindow, dialog } from 'electron';
import { IPC } from './ipc-channels';
import logger from './logger';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';

// ─── Configuration ─────────────────────────────────

autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.logger = logger;

// ─── Events ────────────────────────────────────────

function setupUpdaterEvents(mainWindow: BrowserWindow): void {
  autoUpdater.on('checking-for-update', () => {
    logger.info('Checking for updates...');
  });

  autoUpdater.on('update-available', info => {
    logger.info('Update available:', info.version);
    mainWindow.webContents.send(IPC.UPDATER_STATUS, {
      status: 'available',
      version: info.version,
    });
  });

  autoUpdater.on('update-not-available', () => {
    logger.info('No updates available');
    mainWindow.webContents.send(IPC.UPDATER_STATUS, {
      status: 'not-found',
    });
  });

  autoUpdater.on('download-progress', progress => {
    mainWindow.webContents.send(IPC.UPDATER_STATUS, {
      status: 'downloading',
      progress: progress.percent,
    });
  });

  autoUpdater.on('update-downloaded', info => {
    logger.info('Update downloaded:', info.version);
    mainWindow.webContents.send(IPC.UPDATER_STATUS, {
      status: 'downloaded',
      version: info.version,
    });

    dialog
      .showMessageBox(mainWindow, {
        type: 'info',
        title: 'Update Ready',
        message: `FastFlag Editor ${info.version} has been downloaded.`,
        detail: 'It will be installed automatically when you close the application.',
        buttons: ['Restart Now', 'Later'],
      })
      .then(result => {
        if (result.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
  });

  autoUpdater.on('error', error => {
    logger.error('Update error:', error.message);
    mainWindow.webContents.send(IPC.UPDATER_STATUS, {
      status: 'error',
      error: error.message,
    });
  });
}

// ─── Actions ────────────────────────────────────────

export function checkForUpdates(): void {
  // Skip update check in development or unpacked mode (no app-update.yml)
  if (!app.isPackaged || process.env.NODE_ENV === 'development') {
    logger.info('Skipping update check — running in development/unpacked mode');
    return;
  }

  // Check if app-update.yml exists (only present in published releases)
  const updateConfigPath = path.join(process.resourcesPath, 'app-update.yml');
  try {
    fs.accessSync(updateConfigPath);
  } catch {
    logger.info('Skipping update check — no update config found (unpacked build)');
    return;
  }

  autoUpdater
    .checkForUpdates()
    .then(() => {
      logger.info('Update check triggered');
    })
    .catch(error => {
      logger.error('Update check failed:', error.message);
    });
}

export function initUpdater(mainWindow: BrowserWindow): void {
  setupUpdaterEvents(mainWindow);

  // Checar atualizações no startup com 5s de delay
  setTimeout(() => {
    checkForUpdates();
  }, 5 * 1000);
}
