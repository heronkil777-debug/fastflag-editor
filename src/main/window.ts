/**
 * Window Manager — Criação e gerenciamento da janela principal.
 *
 * Responsável por:
 * - Criar BrowserWindow com todas as configurações de segurança
 * - Gerenciar bounds da janela (tamanho, posição)
 * - Salvar/restaurar estado da janela
 * - Carregar URL (dev: localhost, prod: dist/index.html)
 */

import { BrowserWindow, app, screen } from 'electron';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const storeModule = require('./store') as any;
import logger from './logger';

const isDev = !app.isPackaged;

let mainWindow: BrowserWindow | null = null;

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

export function createMainWindow(): BrowserWindow {
  // Restaurar tamanho e posição anteriores
  const bounds = (storeModule.settingsStore.get('windowBounds') as { width: number; height: number; x?: number; y?: number }) || { width: 1200, height: 800 };

  // Garantir que a janela não comece fora da tela
  const display = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = display.workAreaSize;

  const windowWidth = Math.min(bounds.width || 1200, screenWidth);
  const windowHeight = Math.min(bounds.height || 800, screenHeight);

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: 800,
    minHeight: 600,
    title: 'FastFlag Editor',
    backgroundColor: '#1a0a2e', // deep purple — evita flash branco
    show: false, // Mostrar só depois de carregado

    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,     // SEGURANÇA: isolar o renderer
      nodeIntegration: false,     // SEGURANÇA: sem acesso direto ao Node
      sandbox: false,             // electron-store requer preload
      webSecurity: true,
    },

    icon: path.join(__dirname, '../assets/icon.png'),
  });

  // Carregar conteúdo
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173').catch((err) => {
      logger.error('Failed to load dev server:', err.message);
    });
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '../index.html');
    mainWindow.loadFile(indexPath).catch((err) => {
      logger.error('Failed to load index.html:', err.message);
    });
  }

  // Mostrar quando estiver pronto (evita tela branca)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    mainWindow?.focus();
    logger.info('Main window shown');
  });

  // Salvar bounds ao redimensionar/mover
  mainWindow.on('resize', () => {
    if (!mainWindow) return;
    const [width, height] = mainWindow.getSize();
    storeModule.settingsStore.set('windowBounds', { ...bounds, width, height });
  });

  mainWindow.on('move', () => {
    if (!mainWindow) return;
    const [x, y] = mainWindow.getPosition();
    const [w, h] = mainWindow.getSize();
    storeModule.settingsStore.set('windowBounds', { x, y, width: w, height: h });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Log event
  mainWindow.webContents.on('did-finish-load', () => {
    logger.info('Window content loaded');
  });

  mainWindow.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription) => {
      logger.error(
        `Window content failed to load: ${errorCode} — ${errorDescription}`
      );
    }
  );

  logger.info('Main window created');
  return mainWindow;
}