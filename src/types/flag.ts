/**
 * Core domain types for FastFlag Editor.
 *
 * All types are defined here to ensure a single source of truth.
 * No business logic depends on specific flag names — the model is fully generic.
 */

/** Represents a single FastFlag entry. */
export interface FastFlag {
  /** Unique identifier (UUID v4). Stable across renames. */
  id: string;
  /** Flag name, e.g. "FIntRenderShadowQuality". */
  name: string;
  /** Flag value, always stored as string to match Roblox's format. */
  value: string;
  /** User-defined tags for organization and filtering. */
  tags: string[];
  /** Whether this flag is included in the active preset. */
  preset: boolean;
  /** ISO timestamp of creation. */
  createdAt: number;
  /** ISO timestamp of last update. */
  updatedAt: number;
}

/** Column definition for the flag table. */
export interface ColumnDef {
  /** Unique column key matching a FastFlag field. */
  key: keyof Pick<FastFlag, 'tags' | 'preset' | 'name' | 'value'>;
  /** Display label in the table header. */
  label: string;
  /** Default width in pixels. 0 = flex. */
  defaultWidth: number;
  /** Whether the column can be resized. */
  resizable: boolean;
  /** Whether the column is sortable. */
  sortable: boolean;
  /** Whether the column is directly editable. */
  editable: boolean;
}

/** Sort configuration for the flag table. */
export interface SortConfig {
  /** Column key to sort by. */
  column: keyof Pick<FastFlag, 'tags' | 'preset' | 'name' | 'value'>;
  /** Sort direction. */
  direction: 'asc' | 'desc';
}

/** Identifies which cell is currently being edited. */
export interface EditingCell {
  /** ID of the flag being edited. */
  flagId: string;
  /** Column key being edited. */
  column: keyof Pick<FastFlag, 'tags' | 'preset' | 'name' | 'value'>;
}

/** Export format version. Increment when schema changes. */
export const EXPORT_FORMAT_VERSION = 1;

/** Our internal export format with full metadata. */
export interface ExportData {
  version: typeof EXPORT_FORMAT_VERSION;
  exportedAt: number;
  flags: FastFlag[];
}

/** Roblox ClientAppSettings.json format (flat key-value). */
export type RobloxFormat = Record<string, string>;

/** Column definitions in display order. */
export const DEFAULT_COLUMNS: ColumnDef[] = [
  {
    key: 'tags',
    label: 'Tags',
    defaultWidth: 220,
    resizable: true,
    sortable: true,
    editable: true,
  },
  { key: 'preset', label: '✓', defaultWidth: 50, resizable: false, sortable: true, editable: true },
  {
    key: 'name',
    label: 'Name',
    defaultWidth: 300,
    resizable: true,
    sortable: true,
    editable: true,
  },
  {
    key: 'value',
    label: 'Value',
    defaultWidth: 200,
    resizable: true,
    sortable: true,
    editable: true,
  },
];
