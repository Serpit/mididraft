/**
 * Post-processing for transcribed notes.
 *
 * Every operation is a pure function over the note list, so the UI can show a
 * before/after comparison and undo by simply dropping back to the raw notes.
 */
import type { CleanupOptions, Note } from './types';

/** Drop notes shorter than the threshold — the usual fix for stray blips. */
export function removeShortNotes(notes: Note[], minMs: number): Note[] {
  if (minMs <= 0) return notes;
  const minSeconds = minMs / 1000;
  return notes.filter((note) => note.durationSeconds >= minSeconds);
}

/** Drop notes quieter than `ratio` of the loudest note in the take. */
export function removeQuietNotes(notes: Note[], ratio: number): Note[] {
  if (ratio <= 0 || notes.length === 0) return notes;
  const loudest = notes.reduce((max, n) => Math.max(max, n.amplitude), 0);
  if (loudest <= 0) return notes;
  const floor = loudest * ratio;
  return notes.filter((note) => note.amplitude >= floor);
}

/**
 * Join same-pitch notes separated by a gap smaller than `gapMs`.
 * Repeated onsets on a sustained note are the most common transcription
 * artefact on piano and guitar.
 */
export function mergeRepeatedNotes(notes: Note[], gapMs: number): Note[] {
  if (gapMs <= 0 || notes.length < 2) return notes;
  const maxGap = gapMs / 1000;
  const byPitch = new Map<number, Note[]>();

  for (const note of notes) {
    const bucket = byPitch.get(note.pitchMidi);
    if (bucket) bucket.push(note);
    else byPitch.set(note.pitchMidi, [note]);
  }

  const merged: Note[] = [];
  for (const bucket of byPitch.values()) {
    bucket.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
    let current = { ...bucket[0] };
    for (let i = 1; i < bucket.length; i++) {
      const next = bucket[i];
      const currentEnd = current.startTimeSeconds + current.durationSeconds;
      if (next.startTimeSeconds - currentEnd <= maxGap) {
        const nextEnd = next.startTimeSeconds + next.durationSeconds;
        current.durationSeconds =
          Math.max(currentEnd, nextEnd) - current.startTimeSeconds;
        current.amplitude = Math.max(current.amplitude, next.amplitude);
      } else {
        merged.push(current);
        current = { ...next };
      }
    }
    merged.push(current);
  }

  return sortNotes(merged);
}

/**
 * Trim same-pitch notes so no pitch sounds twice at once.
 * Overlapping duplicates make a piano roll unreadable and confuse DAWs.
 */
export function trimOverlappingNotes(notes: Note[]): Note[] {
  if (notes.length < 2) return notes;
  const byPitch = new Map<number, Note[]>();

  for (const note of notes) {
    const bucket = byPitch.get(note.pitchMidi);
    if (bucket) bucket.push(note);
    else byPitch.set(note.pitchMidi, [note]);
  }

  const result: Note[] = [];
  for (const bucket of byPitch.values()) {
    bucket.sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
    for (let i = 0; i < bucket.length; i++) {
      const note = { ...bucket[i] };
      const next = bucket[i + 1];
      if (next) {
        const end = note.startTimeSeconds + note.durationSeconds;
        if (end > next.startTimeSeconds) {
          note.durationSeconds = Math.max(
            0,
            next.startTimeSeconds - note.startTimeSeconds
          );
        }
      }
      if (note.durationSeconds > 0.001) result.push(note);
    }
  }

  return sortNotes(result);
}

/**
 * Pull note starts towards a grid. `strength` 0 keeps the original feel,
 * 1 snaps hard; anything between preserves some of the performance.
 */
export function quantizeNotes(
  notes: Note[],
  bpm: number,
  stepsPerBar: number,
  strength: number
): Note[] {
  if (strength <= 0 || bpm <= 0 || stepsPerBar <= 0) return notes;
  const amount = Math.min(1, strength);
  // Four beats to a bar, which is what the exported MIDI declares.
  const stepSeconds = (60 / bpm) * (4 / stepsPerBar);

  return notes.map((note) => {
    const snapped =
      Math.round(note.startTimeSeconds / stepSeconds) * stepSeconds;
    const start =
      note.startTimeSeconds + (snapped - note.startTimeSeconds) * amount;
    return { ...note, startTimeSeconds: Math.max(0, start) };
  });
}

/** Keep only notes inside an inclusive MIDI pitch range. */
export function filterPitchRange(
  notes: Note[],
  min: number | null,
  max: number | null
): Note[] {
  if (min === null && max === null) return notes;
  return notes.filter(
    (note) =>
      (min === null || note.pitchMidi >= min) &&
      (max === null || note.pitchMidi <= max)
  );
}

/** Run the whole cleanup chain in the order that gives the fewest surprises. */
export function applyCleanup(
  notes: Note[],
  options: CleanupOptions,
  bpm: number
): Note[] {
  let result = notes;
  result = removeShortNotes(result, options.removeShorterThanMs);
  result = removeQuietNotes(result, options.removeQuieterThan);
  result = mergeRepeatedNotes(result, options.mergeGapMs);
  if (options.trimOverlaps) result = trimOverlappingNotes(result);
  result = quantizeNotes(
    result,
    bpm,
    options.quantizeGrid,
    options.quantizeStrength
  );
  return sortNotes(result);
}

export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort(
    (a, b) =>
      a.startTimeSeconds - b.startTimeSeconds || a.pitchMidi - b.pitchMidi
  );
}

export interface NoteStats {
  count: number;
  lowestPitch: number | null;
  highestPitch: number | null;
  durationSeconds: number;
  medianDurationMs: number;
  /** Notes that start while another note is already sounding. */
  polyphonicCount: number;
}

export function describeNotes(notes: Note[]): NoteStats {
  if (notes.length === 0) {
    return {
      count: 0,
      lowestPitch: null,
      highestPitch: null,
      durationSeconds: 0,
      medianDurationMs: 0,
      polyphonicCount: 0,
    };
  }

  const sorted = sortNotes(notes);
  const pitches = sorted.map((n) => n.pitchMidi);
  const durations = sorted
    .map((n) => n.durationSeconds * 1000)
    .sort((a, b) => a - b);

  let polyphonicCount = 0;
  let previousEnd = 0;
  for (const note of sorted) {
    if (note.startTimeSeconds < previousEnd - 0.01) polyphonicCount++;
    previousEnd = Math.max(
      previousEnd,
      note.startTimeSeconds + note.durationSeconds
    );
  }

  return {
    count: sorted.length,
    lowestPitch: Math.min(...pitches),
    highestPitch: Math.max(...pitches),
    durationSeconds: sorted.reduce(
      (end, n) => Math.max(end, n.startTimeSeconds + n.durationSeconds),
      0
    ),
    medianDurationMs: durations[Math.floor(durations.length / 2)],
    polyphonicCount,
  };
}

/**
 * Estimate tempo from the spacing between note starts.
 * A rough hint the user can override, not a beat detector.
 */
export function estimateTempo(notes: Note[]): number {
  if (notes.length < 4) return 120;
  const sorted = sortNotes(notes);
  const gaps: number[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].startTimeSeconds - sorted[i - 1].startTimeSeconds;
    if (gap > 0.05 && gap < 2) gaps.push(gap);
  }
  if (gaps.length < 3) return 120;

  gaps.sort((a, b) => a - b);
  const median = gaps[Math.floor(gaps.length / 2)];
  let bpm = 60 / median;
  // Fold into a musically plausible range rather than reporting 30 or 600.
  while (bpm < 70) bpm *= 2;
  while (bpm > 180) bpm /= 2;
  return Math.round(bpm);
}
