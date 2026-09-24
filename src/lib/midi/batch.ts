import { decodeAudioFile, prepareForModel } from './audio';
import { analyze, notesFromOutput, preloadModel } from './transcribe';
import { applyCleanup } from './cleanup';
import { notesToMidiBlob, midiFileName } from './export';
import type { Note } from './types';
import type { CleanupOptions, TranscribeOptions } from './types';

export type BatchItemStatus =
  | 'pending'
  | 'decoding'
  | 'analyzing'
  | 'cleaning'
  | 'done'
  | 'failed';

export interface BatchItem {
  id: string;
  file: File;
  status: BatchItemStatus;
  progress: number;
  notes: Note[] | null;
  midiBlob: Blob | null;
  error: string | null;
}

export interface BatchSettings {
  transcribe: TranscribeOptions;
  cleanup: CleanupOptions;
  bpm: number;
}

export interface BatchProgress {
  completedFiles: number;
  totalFiles: number;
  currentFileName: string;
  overallProgress: number;
}

export function createBatchItem(file: File): BatchItem {
  return {
    id: crypto.randomUUID(),
    file,
    status: 'pending',
    progress: 0,
    notes: null,
    midiBlob: null,
    error: null,
  };
}

export async function processBatch(
  items: BatchItem[],
  settings: BatchSettings,
  onProgress: (items: BatchItem[], batchProgress: BatchProgress) => void,
  signal: AbortSignal
): Promise<BatchItem[]> {
  await preloadModel();

  const result = items.map((item) => ({ ...item }));
  let completedCount = 0;

  for (let i = 0; i < result.length; i++) {
    if (signal.aborted) break;

    const item = result[i]!;
    item.status = 'decoding';
    item.progress = 0;
    onProgress(result, {
      completedFiles: completedCount,
      totalFiles: result.length,
      currentFileName: item.file.name,
      overallProgress: completedCount / result.length,
    });

    try {
      const buffer = await decodeAudioFile(item.file);
      if (signal.aborted) break;

      item.status = 'analyzing';
      const mono = await prepareForModel(buffer);
      if (signal.aborted) break;

      const output = await analyze(
        mono,
        (p) => {
          item.progress = p.value * 100;
          onProgress(result, {
            completedFiles: completedCount,
            totalFiles: result.length,
            currentFileName: item.file.name,
            overallProgress: (completedCount + p.value) / result.length,
          });
        },
        signal
      );
      if (signal.aborted) break;

      item.status = 'cleaning';
      const rawNotes = await notesFromOutput(output, settings.transcribe);
      const cleaned = applyCleanup(rawNotes, settings.cleanup, settings.bpm);
      item.notes = cleaned;
      item.midiBlob = notesToMidiBlob(cleaned, {
        bpm: settings.bpm,
        trackName: item.file.name.replace(/\.[^.]+$/, ''),
      });

      item.status = 'done';
      item.progress = 100;
      completedCount++;
    } catch (err) {
      if (signal.aborted) break;
      item.status = 'failed';
      item.error =
        err instanceof Error ? err.message : 'Unknown error during conversion';
    }

    onProgress(result, {
      completedFiles: completedCount,
      totalFiles: result.length,
      currentFileName: item.file.name,
      overallProgress: completedCount / result.length,
    });
  }

  return result;
}

export function midiFileNameForBatch(
  sourceName: string,
  index: number
): string {
  const prefix = String(index + 1).padStart(2, '0');
  const base = midiFileName(sourceName);
  return `${prefix}-${base}`;
}
