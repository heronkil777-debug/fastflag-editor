/**
 * IPC Channels — Canal de comunicação tipado entre main e renderer.
 *
 * Todas as strings de canal são definidas aqui como um objeto const.
 * Main e preload importam do mesmo source — sem strings mágicas.
 *
 * Convenção: `namespace:action`
 */

export const IPC = {
  // ─── Data ─────────────────────────────────────
  /** Sincroniza o estado completo das flags do renderer → main */
  FLAGS_SYNC: 'flags:sync',

  /** Carrega o estado persistido do filesystem */
  FLAGS_LOAD: 'flags:load',

  // ─── Settings ──────────────────────────────────
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',
  SETTINGS_GET_ALL: 'settings:get-all',

  // ─── File operations ──────────────────────────
  FILE_OPEN_DIALOG: 'file:open-dialog',
  FILE_SAVE_DIALOG: 'file:save-dialog',
  FILE_READ: 'file:read',
  FILE_WRITE: 'file:write',

  // ─── Menu actions ─────────────────────────────
  MENU_ACTION: 'menu:action',

  // ─── Updates ─────────────────────────────────
  UPDATER: 'updater:check',
  UPDATER_STATUS: 'updater:status',

  // ─── Window ──────────────────────────────────
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_IS_MAXIMIZED: 'window:is-maximized',

  // ─── Logging ─────────────────────────────────
  LOG: 'log:write',

  // ─── App ─────────────────────────────────────
  APP_GET_PATH: 'app:get-path',
  APP_GET_VERSION: 'app:get-version',

  // ─── Recent files ────────────────────────────
  RECENT_FILES: 'recent-files:update',

  // ─── Wallpaper ──────────────────────────────
  WALLPAPER_SAVE: 'wallpaper:save',
  WALLPAPER_LOAD: 'wallpaper:load',
  WALLPAPER_REMOVE: 'wallpaper:remove',
} as const;

export type IpcChannel = (typeof IPC)[keyof typeof IPC];