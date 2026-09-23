/**
 * Basic Pitch inference, loaded lazily so the model and TensorFlow.js
 * never touch the initial page bundle.
 *
 * Inference is split from note extraction on purpose: the expensive model
 * pass runs once per audio segment, and changing a threshold afterwards only
 * re-runs the cheap note-building step.
 */
import { AudioError } from './audio';
import type { Note, TranscribeOptions } from './types';

/** Served from public/models/basic-pitch, copied from @spotify/basic-pitch. */
export const MODEL_URL = '/models/basic-pitch/model.json';

/** Model output frame rate, 22050 / 256. */
const ANNOTATIONS_FPS = 86;

type BasicPitchModule = typeof import('@spotify/basic-pitch');

/** Raw per-frame model output, kept so settings can be re-applied instantly. */
export interface ModelOutput {
  frames: number[][];
  onsets: number[][];
  contours: number[][];
}

let modulePromise: Promise<BasicPitchModule> | null = null;
let instancePromise: Promise<
  InstanceType<BasicPitchModule['BasicPitch']>
> | null = null;

async function loadModule(): Promise<BasicPitchModule> {
  if (!modulePromise) {
    // basic-pitch pulls in TensorFlow.js itself, so importing tfjs here as
    // well just loads its kernels a second time.
    modulePromise = import('@spotify/basic-pitch');
  }
  return modulePromise;
}

async function getInstance() {
  const { BasicPitch } = await loadModule();
  if (!instancePromise) {
    instancePromise = (async () => new BasicPitch(MODEL_URL))();
  }
  const instance = await instancePromise;
  await instance.model;
  return instance;
}

/**
 * Warm the model up. Safe to call repeatedly; the work happens once.
 * Called on file selection so the download overlaps the user picking a range.
 */
export async function preloadModel(): Promise<void> {
  try {
    await getInstance();
  } catch {
    // Preloading is best-effort; a real failure surfaces on the actual run.
    modulePromise = null;
    instancePromise = null;
  }
}

export interface AnalyzeProgress {
  /** 0..1 across the whole job, including model load. */
  value: number;
  stage: 'loading-model' | 'analyzing';
}

/**
 * Run the model over a 22050 Hz mono buffer.
 * `signal` lets the UI cancel a run the user no longer wants.
 */
export async function analyze(
  audio: AudioBuffer,
  onProgress?: (progress: AnalyzeProgress) => void,
  signal?: AbortSignal
): Promise<ModelOutput> {
  const throwIfAborted = () => {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
  };

  onProgress?.({ value: 0, stage: 'loading-model' });
  throwIfAborted();

  let basicPitch: InstanceType<BasicPitchModule['BasicPitch']>;
  try {
    basicPitch = await getInstance();
  } catch {
    // A failed load should not poison every later attempt.
    modulePromise = null;
    instancePromise = null;
    throw new AudioError(
      'Could not load the transcription model.',
      'Check your connection and reload the page. The model is about 1 MB and is cached after the first run.',
      'model_load_failed'
    );
  }

  throwIfAborted();
  onProgress?.({ value: 0.08, stage: 'analyzing' });

  const frames: number[][] = [];
  const onsets: number[][] = [];
  const contours: number[][] = [];

  try {
    await basicPitch.evaluateModel(
      audio,
      (f, o, c) => {
        frames.push(...f);
        onsets.push(...o);
        contours.push(...c);
      },
      (percent) => {
        onProgress?.({
          value: 0.08 + Math.max(0, Math.min(1, percent)) * 0.92,
          stage: 'analyzing',
        });
      }
    );
  } catch (error) {
    if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
    const outOfMemory =
      error instanceof Error && /memory|allocat/i.test(error.message);
    throw new AudioError(
      'The transcription ran out of resources.',
      outOfMemory
        ? 'Try a shorter segment, or close other heavy browser tabs.'
        : 'Try a shorter segment. 15 to 60 seconds is the reliable range.',
      outOfMemory ? 'out_of_memory' : 'inference_failed'
    );
  }

  throwIfAborted();
  onProgress?.({ value: 1, stage: 'analyzing' });

  return { frames, onsets, contours };
}

const midiToHz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/**
 * Turn raw model output into notes. Cheap enough to re-run on every slider
 * change, which is what makes the sensitivity controls feel immediate.
 */
export async function notesFromOutput(
  output: ModelOutput,
  options: TranscribeOptions
): Promise<Note[]> {
  const { outputToNotesPoly, addPitchBendsToNoteEvents, noteFramesToTime } =
    await loadModule();

  // outputToNotesPoly mutates frames/onsets when a pitch range is set,
  // so hand it copies and keep the originals reusable.
  const needsCopy =
    options.minPitchMidi !== null || options.maxPitchMidi !== null;
  const frames = needsCopy
    ? output.frames.map((row) => [...row])
    : output.frames;
  const onsets = needsCopy
    ? output.onsets.map((row) => [...row])
    : output.onsets;

  const notes = noteFramesToTime(
    addPitchBendsToNoteEvents(
      output.contours,
      outputToNotesPoly(
        frames,
        onsets,
        options.onsetThreshold,
        options.frameThreshold,
        Math.max(
          1,
          Math.round((options.minNoteLengthMs / 1000) * ANNOTATIONS_FPS)
        ),
        true,
        options.maxPitchMidi === null ? null : midiToHz(options.maxPitchMidi),
        options.minPitchMidi === null ? null : midiToHz(options.minPitchMidi)
      )
    )
  );

  return notes
    .map((note) => ({
      startTimeSeconds: note.startTimeSeconds,
      durationSeconds: note.durationSeconds,
      pitchMidi: note.pitchMidi,
      amplitude: note.amplitude,
      pitchBends: note.pitchBends,
    }))
    .filter((note) => note.durationSeconds > 0)
    .sort(
      (a, b) =>
        a.startTimeSeconds - b.startTimeSeconds || a.pitchMidi - b.pitchMidi
    );
}
