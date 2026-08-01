/**
 * UI Store — non-persisted state for the user interface.
 *
 * This store holds all transient UI state that should NOT survive
 * a page reload: selection, editing, search, sort, filters, etc.
 *
 * Design decisions:
 * - Separate from flag-store to keep persistence clean
 * - No business logic — only UI state and simple setters
 * - Computed values are derived via selectors in components
 */

import { create } from 'zustand';
import type { SortConfig, EditingCell } from '@/types/flag';

// ─── State ────────────────────────────────────────────────

interface UIState {
  /** Currently selected flag ID. Null = no selection. */
  selectedFlagId: string | null;

  /** Currently editing cell. Null = not editing. */
  editingCell: EditingCell | null;

  /** Search query string. */
  searchQuery: string;

  /** Current sort configuration. Null = no sort. */
  sortConfig: SortConfig | null;

  /** Tag filter. Null = show all. */
  filterTag: string | null;

  /** Whether to show only preset flags. */
  presetFilter: boolean;

  /** Whether the "Add Flag" dialog is open. */
  isAddDialogOpen: boolean;

  /** Whether the import dialog is open. */
  isImportDialogOpen: boolean;

  /** Whether the export menu is open. */
  isExportMenuOpen: boolean;

  /** Context menu state. Null = closed. */
  contextMenu: { x: number; y: number; flagId: string } | null;

  /** Whether the tag filter dropdown is open. */
  isTagFilterOpen: boolean;
}

// ─── Actions ──────────────────────────────────────────────

interface UIActions {
  /** Select a flag by ID. Pass null to deselect. */
  selectFlag: (id: string | null) => void;

  /** Start editing a cell. */
  startEditing: (cell: EditingCell) => void;

  /** Stop editing (confirm or cancel). */
  stopEditing: () => void;

  /** Set the search query. */
  setSearchQuery: (query: string) => void;

  /** Set or toggle sort configuration. */
  setSortConfig: (column: SortConfig['column']) => void;

  /** Set the tag filter. Also clears preset filter. */
  setFilterTag: (tag: string | null) => void;

  /** Toggle preset-only filter. */
  togglePresetFilter: () => void;

  /** Open the "Add Flag" dialog. */
  openAddDialog: () => void;

  /** Close the "Add Flag" dialog. */
  closeAddDialog: () => void;

  /** Open the import dialog. */
  openImportDialog: () => void;

  /** Close the import dialog. */
  closeImportDialog: () => void;

  /** Toggle the export menu. */
  toggleExportMenu: () => void;

  /** Close the export menu. */
  closeExportMenu: () => void;

  /** Show the context menu for a flag. */
  showContextMenu: (x: number, y: number, flagId: string) => void;

  /** Close the context menu. */
  closeContextMenu: () => void;

  /** Toggle the tag filter dropdown. */
  toggleTagFilter: () => void;

  /** Close the tag filter dropdown. */
  closeTagFilter: () => void;

  /** Reset all UI state to defaults. */
  resetUI: () => void;
}

// ─── Defaults ─────────────────────────────────────────────

const DEFAULT_STATE: UIState = {
  selectedFlagId: null,
  editingCell: null,
  searchQuery: '',
  sortConfig: null,
  filterTag: null,
  presetFilter: false,
  isAddDialogOpen: false,
  isImportDialogOpen: false,
  isExportMenuOpen: false,
  contextMenu: null,
  isTagFilterOpen: false,
};

// ─── Store ────────────────────────────────────────────────

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()((set) => ({
  ...DEFAULT_STATE,

  selectFlag: (id) => {
    set({ selectedFlagId: id, editingCell: null });
  },

  startEditing: (cell) => {
    set({ editingCell: cell, selectedFlagId: cell.flagId });
  },

  stopEditing: () => {
    set({ editingCell: null });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setSortConfig: (column) => {
    set((state) => {
      if (state.sortConfig?.column === column) {
        if (state.sortConfig.direction === 'asc') {
          return { sortConfig: { column, direction: 'desc' } };
        }
        return { sortConfig: null };
      }
      return { sortConfig: { column, direction: 'asc' } };
    });
  },

  setFilterTag: (tag) => {
    set({ filterTag: tag, presetFilter: false, isTagFilterOpen: false });
  },

  togglePresetFilter: () => {
    set((state) => ({ presetFilter: !state.presetFilter, filterTag: null }));
  },

  openAddDialog: () => set({ isAddDialogOpen: true }),
  closeAddDialog: () => set({ isAddDialogOpen: false }),

  openImportDialog: () => set({ isImportDialogOpen: true }),
  closeImportDialog: () => set({ isImportDialogOpen: false }),

  toggleExportMenu: () => set((state) => ({ isExportMenuOpen: !state.isExportMenuOpen })),
  closeExportMenu: () => set({ isExportMenuOpen: false }),

  showContextMenu: (x, y, flagId) => set({ contextMenu: { x, y, flagId } }),
  closeContextMenu: () => set({ contextMenu: null }),

  toggleTagFilter: () => set((state) => ({ isTagFilterOpen: !state.isTagFilterOpen })),
  closeTagFilter: () => set({ isTagFilterOpen: false }),

  resetUI: () => set(DEFAULT_STATE),
}));
