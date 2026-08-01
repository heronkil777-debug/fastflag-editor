/**
 * Global Type Declarations — Declaration merging para window.electron
 *
 * Este arquivo declara o tipo global Window.electron baseado no ElectronAPI do shared.
 * Deve ser importado em algum arquivo do renderer para ativar o declaration merging.
 */

import type { ElectronAPI } from '@shared/electron-api';

declare global {
  interface Window {
    electron: ElectronAPI | undefined;
  }
}

export {};
