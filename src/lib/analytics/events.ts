/**
 * Product analytics for the converter.
 *
 * One `track()` call feeds GA4 in production. In development it logs each
 * event to the console instead, so the instrumentation can be checked without
 * a GA property. Reports and funnels live in GA4 itself (docs/analytics.md).
 *
 * Privacy: the privacy policy promises we never record file names, audio or
 * note data. Every parameter here is a category or a coarse bucket. Keep it
 * that way when adding events.
 */

export type InputSource = 'upload' | 'example';

export type LengthBucket =
  | '<15s'
  | '15-30s'
  | '30-60s'
  | '1-2min'
  | '2-3min'
  | '>3min';

export type RejectReason =
  | 'unsupported_format'
  | 'too_large'
  | 'too_long'
  | 'decode_failed'
  | 'example_unavailable';

export type AnalyzeErrorReason =
  | 'segment_too_short'
  | 'model_load_failed'
  | 'inference_failed'
  | 'out_of_memory'
  | 'unknown';

export type SettingGroup = 'detection' | 'cleanup' | 'tempo';

export type BatchStatus = 'completed' | 'partial' | 'failed';

/** Every event the site sends, and the parameters each one carries. */
export interface AnalyticsEvents {
  launch_offer_view: { surface: 'banner' | 'popup' };
  launch_offer_dismiss: Record<string, never>;
  launch_offer_click: { surface: 'popup' | 'pricing' };
  launch_offer_checkout: Record<string, never>;
  /** A file decoded and passed the length check. */
  file_loaded: {
    input_source: InputSource;
    file_ext: string;
    audio_length: LengthBucket;
    example_slug?: string;
    /** 1 for the first file in this page visit, 2 for the second, … */
    file_index: number;
  };
  /** A file never reached the model. */
  file_rejected: {
    input_source: InputSource;
    reason: RejectReason;
    file_ext: string;
  };
  /** Sent once per page visit, when a second file is loaded. */
  second_file_loaded: { input_source: InputSource };
  analyze_start: { segment_length: LengthBucket; run_index: number };
  analyze_complete: {
    segment_length: LengthBucket;
    duration_ms: number;
    /** 'yes' when the model found no notes at all. */
    empty_result: 'yes' | 'no';
    run_index: number;
  };
  analyze_error: { reason: AnalyzeErrorReason; segment_length: LengthBucket };
  analyze_cancel: { segment_length: LengthBucket };
  /** Once per source per file, the first time it plays. */
  preview_play: { preview_source: 'audio' | 'midi' };
  /** Once per file, when both the original and the MIDI have been played. */
  ab_compared: Record<string, never>;
  /** Once per group per file, on the first change. */
  settings_adjusted: { setting_group: SettingGroup };
  midi_download: {
    input_source: InputSource;
    segment_length: LengthBucket;
    cleanup_active: 'yes' | 'no';
    bpm_edited: 'yes' | 'no';
    file_index: number;
  };
  /** A batch conversion started. */
  batch_start: {
    file_count: number;
    plan_id: string;
  };
  /** A batch conversion finished (all, some, or none succeeded). */
  batch_complete: {
    file_count: number;
    success_count: number;
    fail_count: number;
    duration_ms: number;
    status: BatchStatus;
    plan_id: string;
  };
  /** The ZIP was downloaded after a batch. */
  batch_download: {
    file_count: number;
    plan_id: string;
  };
  /** A preset was loaded and applied. */
  preset_applied: {
    preset_id: string;
  };
  /** A preset was saved for the first time. */
  preset_created: Record<string, never>;
  /** A preset was updated with new settings. */
  preset_updated: {
    preset_id: string;
  };
  /** A preset was deleted. */
  preset_deleted: {
    preset_id: string;
  };
}

export type EventName = keyof AnalyticsEvents;

type EventParams = Record<string, string | number>;

/** Dispatched by the GA snippet once `gtag` is configured. */
export const GTAG_READY_EVENT = 'mididraft:gtag-ready';
const PENDING_LIMIT = 50;

type Gtag = (...args: unknown[]) => void;

const pending: [EventName, EventParams][] = [];

function getGtag(): Gtag | undefined {
  return (window as unknown as { gtag?: Gtag }).gtag;
}

function flushPending() {
  const gtag = getGtag();
  if (!gtag) return;
  for (const [name, params] of pending.splice(0)) {
    gtag('event', name, params);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener(GTAG_READY_EVENT, flushPending);
}

/**
 * Record a product event. Safe to call anywhere on the client: it never
 * throws, and events sent before GA has loaded are held until it is ready.
 */
export function track<N extends EventName>(
  name: N,
  ...[params]: AnalyticsEvents[N] extends Record<string, never>
    ? []
    : [AnalyticsEvents[N]]
): void {
  if (typeof window === 'undefined') return;
  const clean: EventParams = {};
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value !== undefined) clean[key] = value as string | number;
  }

  if (import.meta.env.DEV) {
    console.debug('[analytics]', name, clean);
  }

  if (getGtag()) {
    flushPending();
    getGtag()?.('event', name, clean);
  } else if (pending.length < PENDING_LIMIT) {
    pending.push([name, clean]);
  }
}

export function lengthBucket(seconds: number): LengthBucket {
  if (seconds < 15) return '<15s';
  if (seconds < 30) return '15-30s';
  if (seconds <= 60) return '30-60s';
  if (seconds <= 120) return '1-2min';
  if (seconds <= 180) return '2-3min';
  return '>3min';
}

const KNOWN_EXTENSIONS = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'];

/** The file's extension if it is a format we know, never the name itself. */
export function fileExtension(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? '';
  return KNOWN_EXTENSIONS.includes(ext) ? ext : 'other';
}
