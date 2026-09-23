/**
 * Audio decoding and resampling for the converter.
 * Everything here runs in the browser; the audio never leaves the device.
 */

/** Basic Pitch only accepts mono audio at this rate. */
export const TARGET_SAMPLE_RATE = 22050;

/** Upload limits for the free tier, as stated on the homepage. */
export const MAX_FILE_BYTES = 30 * 1024 * 1024;
export const MAX_DURATION_SECONDS = 180;

export const ACCEPTED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/ogg',
  'audio/flac',
  'audio/x-flac',
  'audio/mp4',
  'audio/aac',
];

export const ACCEPTED_EXTENSIONS = [
  '.mp3',
  '.wav',
  '.ogg',
  '.flac',
  '.m4a',
  '.aac',
];

/** Stable failure category, reported to analytics in place of the message. */
export type AudioErrorCode =
  | 'unsupported_format'
  | 'too_large'
  | 'decode_failed'
  | 'segment_too_short'
  | 'model_load_failed'
  | 'inference_failed'
  | 'out_of_memory';

export class AudioError extends Error {
  constructor(
    message: string,
    /** Short hint shown under the error, telling the user what to try next. */
    readonly hint?: string,
    readonly code?: AudioErrorCode
  ) {
    super(message);
    this.name = 'AudioError';
  }
}

let sharedContext: AudioContext | null = null;

/** A single shared AudioContext, created lazily on first user gesture. */
export function getAudioContext(): AudioContext {
  if (!sharedContext || sharedContext.state === 'closed') {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    sharedContext = new Ctor();
  }
  return sharedContext;
}

function getOfflineContext(
  channels: number,
  length: number,
  sampleRate: number
): OfflineAudioContext {
  const Ctor =
    window.OfflineAudioContext ??
    (
      window as unknown as {
        webkitOfflineAudioContext: typeof OfflineAudioContext;
      }
    ).webkitOfflineAudioContext;
  return new Ctor(channels, length, sampleRate);
}

export function isAcceptedFile(file: File): boolean {
  if (ACCEPTED_MIME_TYPES.includes(file.type)) return true;
  const lower = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

/**
 * Decode a user-selected file into an AudioBuffer.
 * Throws an AudioError with a recovery hint for every failure we can name.
 */
export async function decodeAudioFile(file: File): Promise<AudioBuffer> {
  if (!isAcceptedFile(file)) {
    throw new AudioError(
      `${file.name} is not an audio file we can read.`,
      `Supported formats: ${ACCEPTED_EXTENSIONS.join(', ')}.`,
      'unsupported_format'
    );
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new AudioError(
      `${file.name} is ${formatBytes(file.size)}, over the ${formatBytes(
        MAX_FILE_BYTES
      )} limit.`,
      'Export a shorter section from your DAW and try again.',
      'too_large'
    );
  }

  const bytes = await file.arrayBuffer();
  try {
    return await getAudioContext().decodeAudioData(bytes);
  } catch {
    throw new AudioError(
      `Could not decode ${file.name}.`,
      'The file may be corrupt, DRM-protected, or use a codec this browser does not support. Try exporting a WAV.',
      'decode_failed'
    );
  }
}

/**
 * Mix to mono, cut to the selected segment, and resample to 22050 Hz —
 * the exact input shape the model needs.
 */
export async function prepareForModel(
  buffer: AudioBuffer,
  startSeconds = 0,
  endSeconds = buffer.duration
): Promise<AudioBuffer> {
  const start = Math.max(0, Math.min(startSeconds, buffer.duration));
  const end = Math.max(start, Math.min(endSeconds, buffer.duration));
  const segmentSeconds = end - start;

  if (segmentSeconds < 0.2) {
    throw new AudioError(
      'The selected segment is too short to transcribe.',
      'Select at least half a second of audio.',
      'segment_too_short'
    );
  }

  const frames = Math.ceil(segmentSeconds * TARGET_SAMPLE_RATE);
  const offline = getOfflineContext(1, frames, TARGET_SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = buffer;
  source.connect(offline.destination);
  source.start(0, start, segmentSeconds);

  try {
    return await offline.startRendering();
  } catch {
    throw new AudioError(
      'Ran out of memory while preparing the audio.',
      'Try a shorter segment — 15 to 60 seconds works best.',
      'out_of_memory'
    );
  }
}

/** Cut a segment out of a buffer at its original rate, for A/B playback. */
export async function sliceBuffer(
  buffer: AudioBuffer,
  startSeconds: number,
  endSeconds: number
): Promise<AudioBuffer> {
  const start = Math.max(0, Math.min(startSeconds, buffer.duration));
  const end = Math.max(start, Math.min(endSeconds, buffer.duration));
  const segmentSeconds = end - start;
  const frames = Math.max(1, Math.ceil(segmentSeconds * buffer.sampleRate));

  const offline = getOfflineContext(
    buffer.numberOfChannels,
    frames,
    buffer.sampleRate
  );
  const source = offline.createBufferSource();
  source.buffer = buffer;
  source.connect(offline.destination);
  source.start(0, start, segmentSeconds);
  return offline.startRendering();
}

/**
 * Downsample a buffer to a peak envelope for the waveform strip.
 * Returns `bucketCount` values in 0..1.
 */
export function buildWaveformPeaks(
  buffer: AudioBuffer,
  bucketCount = 600
): number[] {
  const data = buffer.getChannelData(0);
  const bucketSize = Math.max(1, Math.floor(data.length / bucketCount));
  const peaks: number[] = [];
  let max = 0;

  for (let i = 0; i < bucketCount; i++) {
    const offset = i * bucketSize;
    let peak = 0;
    for (let j = 0; j < bucketSize && offset + j < data.length; j++) {
      const value = Math.abs(data[offset + j]);
      if (value > peak) peak = value;
    }
    peaks.push(peak);
    if (peak > max) max = peak;
  }

  return max > 0 ? peaks.map((p) => p / max) : peaks;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
