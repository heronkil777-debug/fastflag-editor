/**
 * Logger — Sistema de logs estruturado para o processo principal.
 *
 * Usa electron-log com:
 * - 4 níveis: error, warn, info, debug
 * - Rotação automática de arquivos
 * - Captura de uncaughtException e unhandledRejection
 * - Não loga dados sensíveis
 *
 * Constantes de configuração no nível debug.
 * Em produção, apenas info e acima.
 */

import log from 'electron-log';
import { app } from 'electron';
import path from 'path';

// Configuração global
const isDev = !app.isPackaged;

// Nível de log: debug em dev, info em produção
log.transports.console.level = isDev ? 'debug' : 'info';
log.transports.file.level = 'info';

// Local do arquivo de log: %APPDATA%/FastFlag Editor/logs/
log.transports.file.resolvePathFn = () => {
  const logsDir = path.join(app.getPath('userData'), 'logs');
  return path.join(logsDir, 'main.log');
};

// Tamanho máximo do arquivo: 5MB antes de rotacionar
log.transports.file.maxSize = 5 * 1024 * 1024;

// Capturar exceções não tratadas
log.errorHandler.startCatching({
  showDialog: false, // Não mostrar popup, apenas logar
  onError({ error }) {
    log.error('Uncaught exception:', error);
  },
});

// Alias tipados para serem usados pelos módulos
export const logger = {
  debug: (message: string, ...args: unknown[]) => log.debug(message, ...args),
  info: (message: string, ...args: unknown[]) => log.info(message, ...args),
  warn: (message: string, ...args: unknown[]) => log.warn(message, ...args),
  error: (message: string, ...args: unknown[]) => log.error(message, ...args),
  /** Loga uma operação e retorna o timestamp de início para perf */
  startTiming: (label: string) => {
    const start = Date.now();
    log.debug(`[TIMER] ${label} — start`);
    return () => {
      const duration = Date.now() - start;
      log.debug(`[TIMER] ${label} — ${duration}ms`);
      return duration;
    };
  },
};

export default logger;