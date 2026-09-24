import { getDb } from '@/db';
import { cleanupPresets, type PresetSettings } from '@/db/app.schema';
import { resolveUserPlan } from '@/lib/plan-resolver';
import {
  DEFAULT_CLEANUP_OPTIONS,
  DEFAULT_TRANSCRIBE_OPTIONS,
} from '@/lib/midi/types';
import { authApiMiddleware } from '@/middlewares/auth-middleware';
import { createServerFn } from '@tanstack/react-start';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';

const presetSettingsSchema = z.object({
  transcribe: z.object({
    onsetThreshold: z.number().min(0).max(1),
    frameThreshold: z.number().min(0).max(1),
    minNoteLengthMs: z.number().min(0),
    minPitchMidi: z.number().int().min(21).max(108).nullable(),
    maxPitchMidi: z.number().int().min(21).max(108).nullable(),
  }),
  cleanup: z.object({
    removeShorterThanMs: z.number().min(0),
    removeQuieterThan: z.number().min(0),
    mergeGapMs: z.number().min(0),
    trimOverlaps: z.boolean(),
    quantizeStrength: z.number().min(0).max(1),
    quantizeGrid: z.number().int().min(1),
  }),
  bpm: z.number().min(20).max(300),
});

async function assertProPlan(userId: string) {
  const result = await resolveUserPlan(userId);
  const planId = result.currentPlan?.id;
  if (planId !== 'pro') {
    throw new Error('Pro subscription required');
  }
}

export const listPresets = createServerFn({ method: 'GET' })
  .middleware([authApiMiddleware])
  .handler(async ({ context }) => {
    await assertProPlan(context.userId);
    const db = getDb();
    return db
      .select()
      .from(cleanupPresets)
      .where(eq(cleanupPresets.userId, context.userId))
      .orderBy(desc(cleanupPresets.updatedAt));
  });

const createPresetSchema = z.object({
  name: z.string().min(1).max(100),
  settings: presetSettingsSchema,
});

export const createPreset = createServerFn({ method: 'POST' })
  .inputValidator(createPresetSchema)
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    await assertProPlan(context.userId);
    const db = getDb();
    const now = new Date();
    const id = crypto.randomUUID();
    await db.insert(cleanupPresets).values({
      id,
      userId: context.userId,
      name: data.name,
      settings: data.settings as PresetSettings,
      createdAt: now,
      updatedAt: now,
    });
    return { id };
  });

const updatePresetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100),
  settings: presetSettingsSchema,
});

export const updatePreset = createServerFn({ method: 'POST' })
  .inputValidator(updatePresetSchema)
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    await assertProPlan(context.userId);
    const db = getDb();
    const [existing] = await db
      .select()
      .from(cleanupPresets)
      .where(
        and(
          eq(cleanupPresets.id, data.id),
          eq(cleanupPresets.userId, context.userId)
        )
      )
      .limit(1);
    if (!existing) throw new Error('Preset not found');
    await db
      .update(cleanupPresets)
      .set({
        name: data.name,
        settings: data.settings as PresetSettings,
        updatedAt: new Date(),
      })
      .where(eq(cleanupPresets.id, data.id));
  });

const deletePresetSchema = z.object({
  id: z.string().min(1),
});

export const deletePreset = createServerFn({ method: 'POST' })
  .inputValidator(deletePresetSchema)
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    await assertProPlan(context.userId);
    const db = getDb();
    await db
      .delete(cleanupPresets)
      .where(
        and(
          eq(cleanupPresets.id, data.id),
          eq(cleanupPresets.userId, context.userId)
        )
      );
  });

export function mergeWithDefaults(
  saved: Partial<PresetSettings>
): PresetSettings {
  return {
    transcribe: { ...DEFAULT_TRANSCRIBE_OPTIONS, ...saved.transcribe },
    cleanup: { ...DEFAULT_CLEANUP_OPTIONS, ...saved.cleanup },
    bpm: saved.bpm ?? 120,
  };
}
