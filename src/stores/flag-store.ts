/**
 * Flag Store — Persistência e undo/redo para FastFlags.
 *
 * Arquitetura:
 * 1. Zustand gerencia o estado em memória (rápido)
 * 2. zundo middleware fornece undo/redo com limite configurável
 * 3. Persistência assíncrona via IPC → electron-store (filesystem)
 * 4. localStorage como cache de inicialização rápida (fallback)
 *
 * Decisão: abandonamos persist() do Zustand.
 * A sincronização é manual (auto-save) via window.electron.syncFlags().
 * Isso isola o state do local storage e dá controle total sobre quando salvar.
 */

import { create } from 'zustand';
import { temporal } from 'zundo';
import type { FastFlag } from '@/types/flag';
import { generateId } from '@/utils/id';
import { suggestTags } from '@/utils/auto-tag';
import {
  detectFormat,
  parseRobloxFormat,
  parseExportFormat,
  toRobloxFormat,
  toExportFormat,
} from '@/adapters/roblox';

// ─── IPC Bridge ────────────────────────────────────
// Carregado do contextBridge exposto pelo preload
declare global {
  interface Window {
    electron?: {
      syncFlags: (flags: unknown[]) => Promise<{ ok: boolean; error?: string }>;
      loadFlags: () => Promise<{ ok: boolean; data?: unknown }>;
      saveWallpaper: (base64: string) => Promise<{ ok: boolean; error?: string }>;
      loadWallpaper: () => Promise<{ ok: boolean; dataUrl?: string }>;
      removeWallpaper: () => Promise<{ ok: boolean }>;
    };
  }
}

// ─── State ────────────────────────────────────────────

interface FlagState {
  flags: FastFlag[];
  /** Carrega flags do filesystem (chamado uma vez no startup) */
  loadFlags: () => Promise<void>;
}

// ─── Actions ───────────────────────────────────────────

interface FlagActions {
  addFlag: (name: string, value: string, tags?: string[]) => string;
  removeFlag: (id: string) => void;
  removeFlags: (ids: string[]) => void;
  updateFlag: (
    id: string,
    updates: Partial<Pick<FastFlag, 'name' | 'value' | 'tags' | 'preset'>>
  ) => void;
  duplicateFlag: (id: string) => string | null;
  togglePreset: (id: string) => void;
  addTag: (flagId: string, tag: string) => void;
  removeTag: (flagId: string, tag: string) => void;
  importFromJSON: (json: string) => number;
  exportAll: () => string;
  exportPresetRoblox: () => string;
  exportAllRoblox: () => string;
  clearAll: () => void;
  getAllTags: () => string[];
  getFlag: (id: string) => FastFlag | undefined;
  isNameDuplicate: (name: string, excludeId?: string) => boolean;
  autoTagFlag: (id: string) => void;
  autoTagAll: () => number;
}

// ─── Store ─────────────────────────────────────────────

export type FlagStore = FlagState & FlagActions;

export const useFlagStore = create<FlagStore>()(
  temporal(
    (set, get) => ({
      flags: [],

      // ─── Persistência ────────────────────────────────

      loadFlags: async () => {
        try {
          // Tenta carregar do filesystem via Electron IPC
          if (window.electron?.loadFlags) {
            const result = await window.electron.loadFlags();
            if (result.ok && Array.isArray(result.data)) {
              set({ flags: result.data as FastFlag[] });
              return;
            }
          }
        } catch {
          // Fallback: começa vazio
        }
      },

      // ─── CRUD ──────────────────────────────────────────

      addFlag: (name, value, tags) => {
        const id = generateId();
        const now = Date.now();
        const finalTags = tags && tags.length > 0 ? tags : suggestTags(name);
        set((state) => ({
          flags: [
            ...state.flags,
            {
              id,
              name,
              value,
              tags: finalTags,
              preset: false,
              createdAt: now,
              updatedAt: now,
            },
          ],
        }));
        return id;
      },

      removeFlag: (id) => {
        set((state) => ({
          flags: state.flags.filter((f) => f.id !== id),
        }));
      },

      removeFlags: (ids) => {
        const idSet = new Set(ids);
        set((state) => ({
          flags: state.flags.filter((f) => !idSet.has(f.id)),
        }));
      },

      updateFlag: (id, updates) => {
        set((state) => ({
          flags: state.flags.map((f) =>
            f.id === id ? { ...f, ...updates, updatedAt: Date.now() } : f
          ),
        }));
      },

      duplicateFlag: (id) => {
        const flag = get().flags.find((f) => f.id === id);
        if (!flag) return null;
        const newId = generateId();
        const now = Date.now();
        set((state) => ({
          flags: [
            ...state.flags,
            {
              ...flag,
              id: newId,
              name: `${flag.name} (copy)`,
              preset: false,
              createdAt: now,
              updatedAt: now,
            },
          ],
        }));
        return newId;
      },

      // ─── Preset ───────────────────────────────────────

      togglePreset: (id) => {
        set((state) => ({
          flags: state.flags.map((f) =>
            f.id === id ? { ...f, preset: !f.preset, updatedAt: Date.now() } : f
          ),
        }));
      },

      // ─── Tags ─────────────────────────────────────────

      addTag: (flagId, tag) => {
        const trimmed = tag.trim();
        if (!trimmed) return;
        set((state) => ({
          flags: state.flags.map((f) => {
            if (f.id !== flagId) return f;
            if (f.tags.includes(trimmed)) return f;
            return { ...f, tags: [...f.tags, trimmed], updatedAt: Date.now() };
          }),
        }));
      },

      removeTag: (flagId, tag) => {
        set((state) => ({
          flags: state.flags.map((f) => {
            if (f.id !== flagId) return f;
            return {
              ...f,
              tags: f.tags.filter((t) => t !== tag),
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      // ─── Import / Export ──────────────────────────────

      importFromJSON: (json) => {
        const format = detectFormat(json);
        let imported: FastFlag[];

        switch (format) {
          case 'roblox':
            imported = parseRobloxFormat(json);
            break;
          case 'fastflag-editor':
            imported = parseExportFormat(json);
            break;
          default:
            return 0;
        }

        imported = imported.map((f) => ({
          ...f,
          tags: f.tags.length > 0 ? f.tags : suggestTags(f.name),
        }));

        set((state) => ({
          flags: [...state.flags, ...imported],
        }));

        return imported.length;
      },

      exportAll: () => {
        return toExportFormat(get().flags);
      },

      exportPresetRoblox: () => {
        return toRobloxFormat(get().flags.filter((f) => f.preset), true);
      },

      exportAllRoblox: () => {
        return toRobloxFormat(get().flags);
      },

      // ─── Utilities ───────────────────────────────────

      clearAll: () => {
        set({ flags: [] });
      },

      getAllTags: () => {
        const tagSet = new Set<string>();
        for (const flag of get().flags) {
          for (const tag of flag.tags) {
            tagSet.add(tag);
          }
        }
        return Array.from(tagSet).sort();
      },

      getFlag: (id) => {
        return get().flags.find((f) => f.id === id);
      },

      isNameDuplicate: (name, excludeId) => {
        return get().flags.some((f) => f.name === name && f.id !== excludeId);
      },

      // ─── Auto-Tagging ────────────────────────────────

      autoTagFlag: (id) => {
        const flag = get().flags.find((f) => f.id === id);
        if (!flag) return;
        const suggested = suggestTags(flag.name);
        set((state) => ({
          flags: state.flags.map((f) =>
            f.id === id
              ? { ...f, tags: suggested, updatedAt: Date.now() }
              : f
          ),
        }));
      },

      autoTagAll: () => {
        let count = 0;
        set((state) => ({
          flags: state.flags.map((f) => {
            const suggested = suggestTags(f.name);
            if (JSON.stringify(f.tags) !== JSON.stringify(suggested)) {
              count++;
              return { ...f, tags: suggested, updatedAt: Date.now() };
            }
            return f;
          }),
        }));
        return count;
      },
    }),
    {
      // zundo configuration
      limit: 500,
      partialize: (state) => ({ flags: state.flags }),
    }
  )
);