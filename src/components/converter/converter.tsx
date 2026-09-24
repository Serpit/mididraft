import { DropZone } from '@/components/converter/drop-zone';
import { PianoRoll } from '@/components/converter/piano-roll';
import { PresetControls } from '@/components/converter/preset-controls';
import { SettingsPanel } from '@/components/converter/settings-panel';
import { Transport } from '@/components/converter/transport';
import { Waveform } from '@/components/converter/waveform';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCurrentPlan } from '@/hooks/use-payment';
import {
  AudioError,
  MAX_DURATION_SECONDS,
  buildWaveformPeaks,
  decodeAudioFile,
  formatSeconds,
  prepareForModel,
  sliceBuffer,
} from '@/lib/midi/audio';
import { applyCleanup, describeNotes, estimateTempo } from '@/lib/midi/cleanup';
import { downloadBlob, midiFileName, notesToMidiBlob } from '@/lib/midi/export';
import { PreviewPlayer } from '@/lib/midi/player';
import type { PreviewSource } from '@/lib/midi/player';
import { analyze, notesFromOutput, preloadModel } from '@/lib/midi/transcribe';
import type { ModelOutput } from '@/lib/midi/transcribe';
import {
  DEFAULT_CLEANUP_OPTIONS,
  DEFAULT_TRANSCRIBE_OPTIONS,
  pitchToName,
} from '@/lib/midi/types';
import type { CleanupOptions, Note, TranscribeOptions } from '@/lib/midi/types';
import { EXAMPLES } from '@/lib/midi/examples';
import { fileExtension, lengthBucket, track } from '@/lib/analytics/events';
import type {
  AnalyzeErrorReason,
  InputSource,
  RejectReason,
  SettingGroup,
} from '@/lib/analytics/events';
import { Routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import {
  IconAlertTriangle,
  IconChevronDown,
  IconDownload,
  IconRefresh,
  IconX,
} from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** Longest slice we hand to the model in one run. */
const MAX_SEGMENT_SECONDS = 60;
/** Segment pre-selected when a file is loaded. */
const DEFAULT_SEGMENT_SECONDS = 30;

type Stage = 'idle' | 'decoding' | 'analyzing' | 'ready' | 'error';

interface LoadedAudio {
  name: string;
  buffer: AudioBuffer;
  peaks: number[];
}

/** Where a file came from, for analytics only. */
interface FileOrigin {
  source: InputSource;
  exampleSlug?: string;
}

const ANALYZE_ERROR_REASONS: AnalyzeErrorReason[] = [
  'segment_too_short',
  'model_load_failed',
  'inference_failed',
  'out_of_memory',
];

function rejectReason(caught: unknown): RejectReason {
  if (caught instanceof AudioError) {
    if (caught.code === 'unsupported_format') return 'unsupported_format';
    if (caught.code === 'too_large') return 'too_large';
  }
  return 'decode_failed';
}

function analyzeErrorReason(caught: unknown): AnalyzeErrorReason {
  const code = caught instanceof AudioError ? caught.code : undefined;
  return ANALYZE_ERROR_REASONS.find((reason) => reason === code) ?? 'unknown';
}

export function Converter({ className }: { className?: string }) {
  const { hasPresetAccess } = useCurrentPlan();
  const [stage, setStage] = useState<Stage>('idle');
  const [audio, setAudio] = useState<LoadedAudio | null>(null);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState('');
  const [error, setError] = useState<{ message: string; hint?: string } | null>(
    null
  );

  const [modelOutput, setModelOutput] = useState<ModelOutput | null>(null);
  const [rawNotes, setRawNotes] = useState<Note[]>([]);
  const [detection, setDetection] = useState<TranscribeOptions>({
    ...DEFAULT_TRANSCRIBE_OPTIONS,
  });
  const [cleanup, setCleanup] = useState<CleanupOptions>({
    ...DEFAULT_CLEANUP_OPTIONS,
  });
  const [bpm, setBpm] = useState(120);
  const [bpmTouched, setBpmTouched] = useState(false);
  const [showBefore, setShowBefore] = useState(true);
  /** Secondary controls stay closed until someone asks for them. */
  const [adjustOpen, setAdjustOpen] = useState(false);

  const [playerState, setPlayerState] = useState({
    playing: false,
    source: 'audio' as PreviewSource,
    currentTime: 0,
    duration: 0,
  });
  const [looping, setLooping] = useState(false);

  const playerRef = useRef<PreviewPlayer | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const rafRef = useRef<number | null>(null);

  // Analytics bookkeeping. Refs, not state: none of it affects rendering.
  const originRef = useRef<FileOrigin>({ source: 'upload' });
  const filesLoadedRef = useRef(0);
  const runsRef = useRef(0);
  const segmentSecondsRef = useRef(0);
  const playedRef = useRef(new Set<PreviewSource>());
  const comparedRef = useRef(false);
  const adjustedRef = useRef(new Set<SettingGroup>());

  const trackAdjusted = useCallback((group: SettingGroup) => {
    if (adjustedRef.current.has(group)) return;
    adjustedRef.current.add(group);
    track('settings_adjusted', { setting_group: group });
  }, []);

  // One player for the life of the component.
  useEffect(() => {
    const player = new PreviewPlayer();
    playerRef.current = player;
    const unsubscribe = player.subscribe((state) => setPlayerState(state));
    return () => {
      unsubscribe();
      player.dispose();
      playerRef.current = null;
    };
  }, []);

  // Drive the playhead while something is playing.
  useEffect(() => {
    if (!playerState.playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      return;
    }
    const tick = () => {
      const player = playerRef.current;
      if (player) {
        setPlayerState((previous) => ({
          ...previous,
          currentTime: player.getCurrentTime(),
        }));
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playerState.playing]);

  // Count a source as heard the first time it plays for the current file.
  useEffect(() => {
    if (!playerState.playing) return;
    const played = playedRef.current;
    if (played.has(playerState.source)) return;
    played.add(playerState.source);
    track('preview_play', { preview_source: playerState.source });
    if (played.size === 2 && !comparedRef.current) {
      comparedRef.current = true;
      track('ab_compared');
    }
  }, [playerState.playing, playerState.source]);

  const notes = useMemo(
    () => applyCleanup(rawNotes, cleanup, bpm),
    [rawNotes, cleanup, bpm]
  );
  const stats = useMemo(() => describeNotes(notes), [notes]);
  const rawStats = useMemo(() => describeNotes(rawNotes), [rawNotes]);
  const cleanupActive =
    notes.length !== rawNotes.length || cleanup.quantizeStrength > 0;

  // Keep the preview in step with the current note list.
  useEffect(() => {
    playerRef.current?.setNotes(notes);
  }, [notes]);

  const resetAll = useCallback(() => {
    abortRef.current?.abort();
    playerRef.current?.setAudio(null);
    playerRef.current?.setNotes([]);
    setStage('idle');
    setAudio(null);
    setSelection({ start: 0, end: 0 });
    setModelOutput(null);
    setRawNotes([]);
    setDetection({ ...DEFAULT_TRANSCRIBE_OPTIONS });
    setCleanup({ ...DEFAULT_CLEANUP_OPTIONS });
    setBpm(120);
    setBpmTouched(false);
    setLooping(false);
    setError(null);
    setProgress(0);
    setAdjustOpen(false);
  }, []);

  const runAnalysis = useCallback(
    async (
      buffer: AudioBuffer,
      range: { start: number; end: number },
      options: TranscribeOptions
    ) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const segmentLength = lengthBucket(range.end - range.start);
      runsRef.current += 1;
      const startedAt = performance.now();
      track('analyze_start', {
        segment_length: segmentLength,
        run_index: runsRef.current,
      });

      setStage('analyzing');
      setError(null);
      setProgress(0);
      setProgressLabel('Loading the model');

      try {
        const prepared = await prepareForModel(buffer, range.start, range.end);
        if (controller.signal.aborted) return;

        const output = await analyze(
          prepared,
          ({ value, stage: analyzeStage }) => {
            setProgress(Math.round(value * 100));
            setProgressLabel(
              analyzeStage === 'loading-model'
                ? 'Loading the model'
                : 'Listening for notes'
            );
          },
          controller.signal
        );
        if (controller.signal.aborted) return;

        setProgressLabel('Building notes');
        const detected = await notesFromOutput(output, options);
        if (controller.signal.aborted) return;

        // Play back only the selected slice, so both sources line up.
        const segment = await sliceBuffer(buffer, range.start, range.end);
        playerRef.current?.setAudio(segment);
        playerRef.current?.setNotes(detected);

        setModelOutput(output);
        setRawNotes(detected);
        if (!bpmTouched) setBpm(estimateTempo(detected));
        setStage('ready');
        segmentSecondsRef.current = range.end - range.start;
        track('analyze_complete', {
          segment_length: segmentLength,
          duration_ms: Math.round(performance.now() - startedAt),
          empty_result: detected.length === 0 ? 'yes' : 'no',
          run_index: runsRef.current,
        });
      } catch (caught) {
        if (
          controller.signal.aborted ||
          (caught instanceof DOMException && caught.name === 'AbortError')
        ) {
          return;
        }
        track('analyze_error', {
          reason: analyzeErrorReason(caught),
          segment_length: segmentLength,
        });
        setStage('error');
        setError(
          caught instanceof AudioError
            ? { message: caught.message, hint: caught.hint }
            : {
                message: 'Something went wrong during the conversion.',
                hint: 'Reload the page and try a shorter segment.',
              }
        );
      }
    },
    [bpmTouched]
  );

  const loadBuffer = useCallback(
    async (buffer: AudioBuffer, name: string) => {
      const origin = originRef.current;
      if (buffer.duration > MAX_DURATION_SECONDS) {
        track('file_rejected', {
          input_source: origin.source,
          reason: 'too_long',
          file_ext: fileExtension(name),
        });
        setStage('error');
        setError({
          message: `${name} is ${formatSeconds(buffer.duration)} long, over the ${
            MAX_DURATION_SECONDS / 60
          } minute limit.`,
          hint: 'Export a shorter section from your DAW and try again.',
        });
        return;
      }

      filesLoadedRef.current += 1;
      playedRef.current = new Set();
      comparedRef.current = false;
      adjustedRef.current = new Set();
      track('file_loaded', {
        input_source: origin.source,
        file_ext: fileExtension(name),
        audio_length: lengthBucket(buffer.duration),
        example_slug: origin.exampleSlug,
        file_index: filesLoadedRef.current,
      });
      if (filesLoadedRef.current === 2) {
        track('second_file_loaded', { input_source: origin.source });
      }

      const end = Math.min(buffer.duration, DEFAULT_SEGMENT_SECONDS);
      const range = { start: 0, end };
      setAudio({ name, buffer, peaks: buildWaveformPeaks(buffer) });
      setSelection(range);
      setBpmTouched(false);
      await runAnalysis(buffer, range, detection);
    },
    [detection, runAnalysis]
  );

  const handleFile = useCallback(
    async (file: File, origin: FileOrigin = { source: 'upload' }) => {
      resetAll();
      originRef.current = origin;
      setStage('decoding');
      setProgressLabel('Reading the file');
      // Start the model download while the file decodes.
      void preloadModel();

      try {
        const buffer = await decodeAudioFile(file);
        await loadBuffer(buffer, file.name);
      } catch (caught) {
        track('file_rejected', {
          input_source: origin.source,
          reason: rejectReason(caught),
          file_ext: fileExtension(file.name),
        });
        setStage('error');
        setError(
          caught instanceof AudioError
            ? { message: caught.message, hint: caught.hint }
            : {
                message: `Could not read ${file.name}.`,
                hint: 'Try exporting a WAV from your DAW.',
              }
        );
      }
    },
    [loadBuffer, resetAll]
  );

  const handleExample = useCallback(
    async (url: string, name: string) => {
      resetAll();
      setStage('decoding');
      setProgressLabel('Loading the example');
      void preloadModel();

      const origin: FileOrigin = {
        source: 'example',
        exampleSlug: EXAMPLES.find((example) => example.audioUrl === url)?.slug,
      };
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('fetch failed');
        const blob = await response.blob();
        await handleFile(new File([blob], name, { type: blob.type }), origin);
      } catch {
        track('file_rejected', {
          input_source: 'example',
          reason: 'example_unavailable',
          file_ext: fileExtension(name),
        });
        setStage('error');
        setError({
          message: 'Could not load the example.',
          hint: 'Check your connection, or use your own file instead.',
        });
      }
    },
    [handleFile, resetAll]
  );

  /*
   * The example cards further down the page load a clip straight into the
   * converter instead of just playing a file. "Hear the conversion" is the
   * whole promise of the section, and making the reader scroll back up and
   * find the right button breaks it.
   */
  useEffect(() => {
    const onLoadExample = (event: Event) => {
      const detail = (event as CustomEvent<{ url: string; name: string }>)
        .detail;
      if (!detail?.url) return;
      document
        .getElementById('converter')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      void handleExample(detail.url, detail.name);
    };
    window.addEventListener('mididraft:load-example', onLoadExample);
    return () =>
      window.removeEventListener('mididraft:load-example', onLoadExample);
  }, [handleExample]);

  // Re-derive notes when a detection setting changes; no model re-run needed.
  const handleDetectionChange = useCallback(
    async (next: TranscribeOptions) => {
      setDetection(next);
      trackAdjusted('detection');
      if (!modelOutput) return;
      const detected = await notesFromOutput(modelOutput, next);
      setRawNotes(detected);
    },
    [modelOutput, trackAdjusted]
  );

  const handlePresetApply = useCallback(
    async (settings: {
      detection: TranscribeOptions;
      cleanup: CleanupOptions;
      bpm: number;
    }) => {
      setDetection(settings.detection);
      setCleanup(settings.cleanup);
      setBpm(settings.bpm);
      setBpmTouched(true);
      if (!modelOutput) return;
      const detected = await notesFromOutput(modelOutput, settings.detection);
      setRawNotes(detected);
    },
    [modelOutput]
  );

  const handleSelectionChange = useCallback(
    (next: { start: number; end: number }) => {
      setSelection(next);
    },
    []
  );

  const handleLoopChange = useCallback((next: boolean) => {
    setLooping(next);
    const player = playerRef.current;
    if (!player) return;
    player.setLoop(next ? { start: 0, end: player.getDuration() } : null);
  }, []);

  const handleExport = useCallback(() => {
    if (!audio || notes.length === 0) return;
    const blob = notesToMidiBlob(notes, {
      bpm,
      trackName: audio.name.replace(/\.[^.]+$/, ''),
    });
    downloadBlob(blob, midiFileName(audio.name));
    track('midi_download', {
      input_source: originRef.current.source,
      segment_length: lengthBucket(segmentSecondsRef.current),
      cleanup_active: cleanupActive ? 'yes' : 'no',
      bpm_edited: bpmTouched ? 'yes' : 'no',
      file_index: filesLoadedRef.current,
    });
  }, [audio, bpm, bpmTouched, cleanupActive, notes]);

  const busy = stage === 'decoding' || stage === 'analyzing';
  const segmentSeconds = selection.end - selection.start;
  const selectionChanged =
    audio !== null &&
    stage === 'ready' &&
    Math.abs(playerState.duration - segmentSeconds) > 0.05;
  const ready = stage === 'ready';

  return (
    <div className={cn('space-y-5', className)}>
      {error && (
        <div
          role="alert"
          className="st-card border-destructive/30 bg-destructive/5 p-5"
        >
          <div className="flex gap-3">
            <IconAlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="min-w-0">
              <p className="font-medium">{error.message}</p>
              {error.hint && (
                <p className="mt-1 text-muted-foreground">{error.hint}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!audio && !busy && (
        <>
          <DropZone onFile={handleFile} disabled={busy} />

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">
              No file handy? Try one of ours:
            </span>
            {EXAMPLES.map((example) => (
              <Button
                key={example.slug}
                type="button"
                variant="outline"
                className="h-10 rounded-full bg-surface"
                disabled={busy}
                onClick={() =>
                  handleExample(example.audioUrl, example.fileName)
                }
              >
                {example.shortLabel}
              </Button>
            ))}
          </div>
        </>
      )}

      {/*
       * The card below has no `overflow-hidden` on purpose: it would make the
       * card a scroll container and kill the sticky action bar, which is what
       * keeps play and download in reach while the settings are open.
       */}
      {(audio || busy) && (
        <div className="st-card">
          {/* The file, folded down to a line once it is loaded. */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-t-2xl border-b border-hairline px-5 py-3">
            <div className="min-w-0">
              <p className="truncate font-medium">
                {audio?.name ?? 'Reading the file'}
              </p>
              <p className="st-readout mt-0.5 text-xs text-muted-foreground">
                {audio
                  ? `${formatSeconds(audio.buffer.duration)} · ${segmentSeconds.toFixed(0)}s selected · stays on this device`
                  : 'decoding on this device'}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              className="h-10 rounded-full"
              onClick={resetAll}
            >
              <IconX className="mr-1.5 size-4" />
              Change file
            </Button>
          </div>

          {busy && (
            <div className="px-5 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium">{progressLabel}…</p>
                <div className="flex items-center gap-3">
                  <span className="st-readout text-sm text-muted-foreground">
                    {progress}%
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-10 rounded-full"
                    onClick={() => {
                      if (stage === 'analyzing') {
                        track('analyze_cancel', {
                          segment_length: lengthBucket(segmentSeconds),
                        });
                      }
                      abortRef.current?.abort();
                      setStage(audio ? 'ready' : 'idle');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
              <Progress value={progress} className="mt-4 h-2" />
              <p className="mt-3 text-sm text-muted-foreground">
                Running on your own machine. Nothing has been uploaded.
              </p>
            </div>
          )}

          {audio && (
            <div className="border-b border-hairline px-5 py-4">
              <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                <span className="st-eyebrow flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="st-key-audio size-2 rounded-full"
                  />
                  Original audio
                </span>
                <span className="st-readout hidden text-xs text-muted-foreground sm:inline">
                  drag the handles to pick a section
                </span>
              </div>

              <Waveform
                peaks={audio.peaks}
                durationSeconds={audio.buffer.duration}
                currentTime={selection.start + playerState.currentTime}
                selection={selection}
                onSelectionChange={handleSelectionChange}
                maxSelectionSeconds={MAX_SEGMENT_SECONDS}
                disabled={busy}
              />

              {selectionChanged && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-audio/40 bg-audio/5 px-4 py-3">
                  <p className="text-sm">
                    You changed the selection. Convert this{' '}
                    {segmentSeconds.toFixed(0)}s section to update the notes.
                  </p>
                  <Button
                    type="button"
                    className="h-10 rounded-full"
                    onClick={() =>
                      audio && runAnalysis(audio.buffer, selection, detection)
                    }
                  >
                    <IconRefresh className="mr-1.5 size-4" />
                    Convert selection
                  </Button>
                </div>
              )}
            </div>
          )}

          {ready && (
            <>
              {/* Listen first: the A/B switch is the top of the result. */}
              <div className="border-b border-hairline px-5 py-4">
                <Transport
                  playing={playerState.playing}
                  source={playerState.source}
                  currentTime={playerState.currentTime}
                  duration={playerState.duration}
                  looping={looping}
                  onToggle={() => playerRef.current?.toggle()}
                  onSourceChange={(source) =>
                    playerRef.current?.setSource(source)
                  }
                  onLoopChange={handleLoopChange}
                  disabled={notes.length === 0}
                />
              </div>

              <div className="px-5 py-4">
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                  <span className="st-eyebrow flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="st-key-midi size-2 rounded-full"
                    />
                    Transcribed MIDI
                  </span>
                  {cleanupActive && (
                    <button
                      type="button"
                      onClick={() => setShowBefore((value) => !value)}
                      className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    >
                      {showBefore ? 'Hide' : 'Show'} the {rawStats.count} notes
                      before cleanup
                    </button>
                  )}
                </div>

                <PianoRoll
                  className="min-h-48"
                  notes={notes}
                  ghostNotes={
                    showBefore && cleanupActive ? rawNotes : undefined
                  }
                  durationSeconds={Math.max(playerState.duration, 0.001)}
                  currentTime={playerState.currentTime}
                  onSeek={(seconds) => playerRef.current?.seek(seconds)}
                />

                <p className="st-readout mt-3 pb-2 text-sm text-muted-foreground lg:pb-0">
                  {stats.count} notes
                  {stats.lowestPitch !== null && (
                    <>
                      {' · '}
                      {pitchToName(stats.lowestPitch)}–
                      {pitchToName(stats.highestPitch ?? stats.lowestPitch)}
                    </>
                  )}
                  {' · '}
                  {Math.round(stats.medianDurationMs)} ms median
                  {' · '}
                  {bpm} BPM
                </p>

                {notes.length === 0 && (
                  <div className="st-inner mt-4 p-5">
                    <p className="font-medium">No notes came through</p>
                    <p className="mt-1.5 text-muted-foreground">
                      Lower the sensitivity, or pick a section where a single
                      instrument plays clearly. Dense mixes and heavy reverb are
                      the usual causes.{' '}
                      <Link
                        to={Routes.GuideImproveResults}
                        className="underline underline-offset-4"
                      >
                        See what helps
                      </Link>
                      .
                    </p>
                  </div>
                )}
              </div>

              {/*
               * The two things a first-time visitor came for, side by side,
               * and always in the same place: adjust, or take the file.
               */}
              <div className="sticky bottom-0 z-20 flex flex-wrap items-center gap-3 rounded-b-2xl border-t border-hairline bg-surface/95 px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur lg:static lg:pb-4">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-full bg-surface-strong px-5"
                  aria-expanded={adjustOpen}
                  aria-controls="converter-adjust"
                  onClick={() => setAdjustOpen((value) => !value)}
                >
                  {adjustOpen ? 'Hide note settings' : 'Adjust notes'}
                  <IconChevronDown
                    className={cn(
                      'ml-1.5 size-4 transition-transform',
                      adjustOpen && 'rotate-180'
                    )}
                  />
                </Button>

                <Button
                  type="button"
                  size="lg"
                  className="ml-auto h-12 rounded-full px-6 text-base"
                  onClick={handleExport}
                  disabled={notes.length === 0}
                >
                  <IconDownload className="mr-2 size-4" />
                  Download MIDI
                </Button>
              </div>

              {/*
               * Mounted only while it is open, not hidden with CSS. Base UI
               * measures slider geometry on mount, and a slider first mounted
               * inside `display: none` measures zero — every thumb sits at the
               * left end no matter what its value is. Unmounting costs
               * nothing here: the parameter values live in this component's
               * state, not the panel's.
               */}
              {adjustOpen && (
                <div
                  id="converter-adjust"
                  className="rounded-b-2xl border-t border-hairline px-5 py-6"
                >
                  {hasPresetAccess && (
                    <div className="mb-6">
                      <PresetControls
                        detection={detection}
                        cleanup={cleanup}
                        bpm={bpm}
                        onApply={handlePresetApply}
                      />
                    </div>
                  )}
                  <SettingsPanel
                    detection={detection}
                    onDetectionChange={handleDetectionChange}
                    cleanup={cleanup}
                    onCleanupChange={(next) => {
                      setCleanup(next);
                      trackAdjusted('cleanup');
                    }}
                    bpm={bpm}
                    onBpmChange={(next) => {
                      setBpm(next);
                      setBpmTouched(true);
                      trackAdjusted('tempo');
                    }}
                  />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
