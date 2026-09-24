import { track } from '@/lib/analytics/events';
import type { BatchEntrySurface } from '@/lib/analytics/events';
import type { BatchSettings } from './batch';

/**
 * Getting files and settings onto the batch page without asking for them
 * twice.
 *
 * Two hops need covering. Moving from the homepage to the batch page is a
 * client-side navigation, so the files ride along in memory. Signing in with
 * Google and paying on Waffo are full-page navigations that wipe memory, so
 * before either one the batch is written to IndexedDB and read back when the
 * visitor lands on the batch page again. Either way the audio never leaves
 * the device.
 */

interface BatchHandoff {
  /** Where the visitor came from. For analytics only. */
  entry: BatchEntrySurface;
  files: File[];
  settings?: BatchSettings;
}

let pending: BatchHandoff | null = null;

/** Call right before navigating to the batch page. */
export function handOffToBatch(handoff: BatchHandoff) {
  pending = handoff;
  track('batch_entry', { surface: handoff.entry });
}

/** Returns the handoff once, then forgets it. */
export function takeBatchHandoff(): BatchHandoff | null {
  const handoff = pending;
  pending = null;
  return handoff;
}

/*
 * The draft kept across the login and checkout redirects.
 */

const DB_NAME = 'mididraft';
const STORE = 'batch-draft';
const KEY = 'current';
/** A draft older than this belongs to some other visit; drop it. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface BatchDraft {
  /** Null when the browser would not store the audio itself. */
  files: File[] | null;
  /** Always kept, so the visitor can be told which files to add again. */
  names: string[];
  settings: BatchSettings;
}

interface StoredDraft {
  files: { name: string; type: string; blob: Blob }[] | null;
  names: string[];
  settings: BatchSettings;
  savedAt: number;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = run(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(request.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

/**
 * Saves the batch before a full-page navigation. Falls back to names only
 * when the audio does not fit (storage quota, private mode). Never throws:
 * a failed save must not block the visitor from paying.
 */
export async function saveBatchDraft(
  files: File[],
  settings: BatchSettings
): Promise<void> {
  const names = files.map((file) => file.name);
  const base = { names, settings, savedAt: Date.now() };
  try {
    const stored: StoredDraft = {
      ...base,
      files: files.map((file) => ({
        name: file.name,
        type: file.type,
        blob: file,
      })),
    };
    await withStore('readwrite', (store) => store.put(stored, KEY));
    return;
  } catch {
    /* fall through to names only */
  }
  try {
    const stored: StoredDraft = { ...base, files: null };
    await withStore('readwrite', (store) => store.put(stored, KEY));
  } catch {
    /* nothing to restore later; the visitor adds the files again */
  }
}

/** Reads the saved batch and deletes it, so it is restored once. */
export async function takeBatchDraft(): Promise<BatchDraft | null> {
  try {
    const stored = await withStore<StoredDraft | undefined>(
      'readonly',
      (store) => store.get(KEY) as IDBRequest<StoredDraft | undefined>
    );
    await withStore('readwrite', (store) => store.delete(KEY));
    if (!stored || Date.now() - stored.savedAt > MAX_AGE_MS) return null;
    return {
      files:
        stored.files?.map(
          (file) => new File([file.blob], file.name, { type: file.type })
        ) ?? null,
      names: stored.names,
      settings: stored.settings,
    };
  } catch {
    return null;
  }
}
