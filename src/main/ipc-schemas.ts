/**
 * Zod Schemas — Validação de payloads IPC.
 *
 * Todos os dados que cruzam a boundary main/renderer são validados aqui.
 * Isso garante type safety em runtime e previne ataques de prototype pollution.
 */

import { z } from 'zod';

// ─── Base types ───────────────────────────────────────

export const FastFlagSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  value: z.string().max(10000),
  tags: z.array(z.string().max(50)).max(20),
  preset: z.boolean(),
  createdAt: z.number().int().positive(),
  updatedAt: z.number().int().positive(),
});

export type FastFlag = z.infer<typeof FastFlagSchema>;

// ─── IPC Payload Schemas ──────────────────────────────

export const FlagsSyncPayloadSchema = z.array(FastFlagSchema);

export const SettingsSetPayloadSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.unknown(),
});

export const FileReadPayloadSchema = z.object({
  filePath: z.string().min(1),
});

export const FileWritePayloadSchema = z.object({
  filePath: z.string().min(1),
  content: z.string().max(10_000_000), // 10MB max
});

export const WallpaperSavePayloadSchema = z.object({
  base64Data: z.string().min(1),
});

export const LogPayloadSchema = z.object({
  level: z.enum(['info', 'warn', 'error', 'debug']),
  message: z.string().max(5000),
  args: z.array(z.unknown()).optional(),
});

// ─── Validation helpers ───────────────────────────────

export function validatePayload<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { ok: true; data: T } | { ok: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, data: result.data };
  }
  const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
  return { ok: false, error: `Validation failed: ${errors}` };
}
