import { zipSync } from 'fflate';
import type { BatchItem } from './batch';
import { midiFileNameForBatch } from './batch';

export async function createMidiZip(items: BatchItem[]): Promise<Blob> {
  const done = items.filter((item) => item.status === 'done' && item.midiBlob);
  if (done.length === 0) throw new Error('No completed files to zip');

  const files: Record<string, Uint8Array> = {};
  for (let i = 0; i < done.length; i++) {
    const item = done[i]!;
    const name = midiFileNameForBatch(item.file.name, i);
    files[name] = new Uint8Array(await item.midiBlob!.arrayBuffer());
  }

  const zipped = zipSync(files);
  return new Blob([zipped], { type: 'application/zip' });
}
