/**
 * A single transcribed note, in seconds and MIDI pitch numbers.
 * Mirrors the shape Basic Pitch returns so notes can flow straight into
 * the cleanup pipeline and the MIDI writer.
 */
export interface Note {
  startTimeSeconds: number;
  durationSeconds: number;
  pitchMidi: number;
  amplitude: number;
  pitchBends?: number[];
}

/** Model thresholds exposed to the user as "sensitivity" controls. */
export interface TranscribeOptions {
  /** Higher = fewer, more confident note starts. */
  onsetThreshold: number;
  /** Higher = notes end sooner. */
  frameThreshold: number;
  /** Shortest note the model is allowed to emit, in milliseconds. */
  minNoteLengthMs: number;
  /** Lowest MIDI pitch to keep, or null for no limit. */
  minPitchMidi: number | null;
  /** Highest MIDI pitch to keep, or null for no limit. */
  maxPitchMidi: number | null;
}

export const DEFAULT_TRANSCRIBE_OPTIONS: TranscribeOptions = {
  onsetThreshold: 0.5,
  frameThreshold: 0.3,
  minNoteLengthMs: 120,
  minPitchMidi: null,
  maxPitchMidi: null,
};

/** Post-processing applied to the raw transcription, all reversible. */
export interface CleanupOptions {
  /** Drop notes shorter than this, in milliseconds. 0 disables. */
  removeShorterThanMs: number;
  /** Drop notes quieter than this share of the loudest note. 0 disables. */
  removeQuieterThan: number;
  /** Merge same-pitch notes separated by less than this gap, in ms. 0 disables. */
  mergeGapMs: number;
  /** Trim overlapping same-pitch notes so each pitch sounds once at a time. */
  trimOverlaps: boolean;
  /** 0 = keep original timing, 1 = snap fully to the grid. */
  quantizeStrength: number;
  /** Grid resolution in steps per bar, e.g. 16 for 16th notes. */
  quantizeGrid: number;
}

export const DEFAULT_CLEANUP_OPTIONS: CleanupOptions = {
  removeShorterThanMs: 0,
  removeQuieterThan: 0,
  mergeGapMs: 0,
  trimOverlaps: false,
  quantizeStrength: 0,
  quantizeGrid: 16,
};

export const PITCH_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const;

/** Format a MIDI pitch number the way a DAW piano roll labels it. */
export function pitchToName(pitchMidi: number): string {
  const name = PITCH_NAMES[((pitchMidi % 12) + 12) % 12];
  const octave = Math.floor(pitchMidi / 12) - 1;
  return `${name}${octave}`;
}
