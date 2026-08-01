/**
 * Adapter for Roblox's ClientAppSettings.json format.
 *
 * This format is a flat key-value JSON object where all values are strings.
 * Example:
 * {
 *   "FFlagDebugDisableTelemetryEpicV2": "True",
 *   "FIntFRMMaxGrass": "100"
 * }
 *
 * This adapter is responsible ONLY for format conversion.
 * No business logic belongs here.
 */

import type { FastFlag, RobloxFormat, ExportData } from '@/types/flag';
import { generateId } from '@/utils/id';
import { EXPORT_FORMAT_VERSION } from '@/types/flag';

/** Parses a Roblox ClientAppSettings.json string into FastFlag objects. */
export function parseRobloxFormat(json: string): FastFlag[] {
  const data: RobloxFormat = JSON.parse(json);
  const now = Date.now();

  return Object.entries(data).map(([name, value], index) => ({
    id: generateId(),
    name,
    value: String(value),
    tags: [] as string[],
    preset: true,
    createdAt: now + index,
    updatedAt: now + index,
  }));
}

/** Converts FastFlag objects to Roblox ClientAppSettings.json format.
 *  By default exports ALL flags. Pass presetOnly=true for preset-only export. */
export function toRobloxFormat(flags: FastFlag[], presetOnly = false): string {
  const data: RobloxFormat = {};
  for (const flag of flags) {
    if (!presetOnly || flag.preset) {
      data[flag.name] = flag.value;
    }
  }
  return JSON.stringify(data, null, 2);
}

/** Converts FastFlag objects to our internal export format with metadata. */
export function toExportFormat(flags: FastFlag[]): string {
  const data: ExportData = {
    version: EXPORT_FORMAT_VERSION,
    exportedAt: Date.now(),
    flags,
  };
  return JSON.stringify(data, null, 2);
}

/** Detects whether a JSON string is in Roblox format or our internal format. */
export function detectFormat(json: string): 'roblox' | 'fastflag-editor' | 'unknown' {
  try {
    const data = JSON.parse(json);

    // Our format has a version field
    if (typeof data === 'object' && data !== null && 'version' in data && 'flags' in data) {
      return 'fastflag-editor';
    }

    // Roblox format is a flat string→string map
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      const values = Object.values(data);
      if (values.every(v => typeof v === 'string')) {
        return 'roblox';
      }
    }

    return 'unknown';
  } catch {
    return 'unknown';
  }
}

/** Parses our internal export format back into FastFlag objects. */
export function parseExportFormat(json: string): FastFlag[] {
  const data: ExportData = JSON.parse(json);
  return data.flags;
}
