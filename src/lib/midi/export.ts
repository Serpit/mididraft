/**
 * MIDI file writing.
 *
 * The tempo written here matters: a file without it opens at the DAW default
 * and every note lands in the wrong place, which is the single most common
 * complaint about audio-to-MIDI tools.
 */
import { Midi } from '@tonejs/midi';
import type { Note } from './types';

export interface ExportOptions {
  /** Written into the file so the DAW lines the notes up correctly. */
  bpm: number;
  /** Track name shown in the DAW. */
  trackName: string;
  /** General MIDI program number; 0 is Acoustic Grand Piano. */
  instrumentNumber?: number;
}

/** Build a standard `.mid` file from a note list. */
export function notesToMidi(notes: Note[], options: ExportOptions): Uint8Array {
  const midi = new Midi();
  midi.header.setTempo(options.bpm);
  midi.header.name = options.trackName;

  const track = midi.addTrack();
  track.name = options.trackName;
  track.instrument.number = options.instrumentNumber ?? 0;

  for (const note of notes) {
    track.addNote({
      midi: Math.round(note.pitchMidi),
      time: Math.max(0, note.startTimeSeconds),
      duration: Math.max(0.01, note.durationSeconds),
      velocity: Math.max(0.05, Math.min(1, note.amplitude)),
    });
  }

  return new Uint8Array(midi.toArray());
}

export function notesToMidiBlob(notes: Note[], options: ExportOptions): Blob {
  const bytes = notesToMidi(notes, options);
  return new Blob([bytes as BlobPart], { type: 'audio/midi' });
}

/** Turn any input filename into a safe `.mid` filename. */
export function midiFileName(sourceName: string, suffix = ''): string {
  const base = sourceName.replace(/\.[^.]+$/, '') || 'mididraft';
  const safe = base
    .replace(/[^\w\-. ]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return `${safe || 'mididraft'}${suffix}.mid`;
}

/** Trigger a browser download without leaving the page. */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Give the download a tick to start before releasing the object URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Read an existing `.mid` file back into our note shape. */
export async function midiFileToNotes(
  file: File
): Promise<{ notes: Note[]; bpm: number; trackName: string }> {
  const bytes = await file.arrayBuffer();
  const midi = new Midi(bytes);
  const notes: Note[] = [];

  for (const track of midi.tracks) {
    for (const note of track.notes) {
      notes.push({
        startTimeSeconds: note.time,
        durationSeconds: note.duration,
        pitchMidi: note.midi,
        amplitude: note.velocity,
      });
    }
  }

  return {
    notes: notes.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds),
    bpm: midi.header.tempos[0]?.bpm ?? 120,
    trackName: midi.header.name || file.name.replace(/\.[^.]+$/, ''),
  };
}
