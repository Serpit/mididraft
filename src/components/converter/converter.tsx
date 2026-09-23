import { DropZone } from '@/components/converter/drop-zone';
import { PianoRoll } from '@/components/converter/piano-roll';
import { SettingsPanel } from '@/components/converter/settings-panel';
import { Transport } from '@/components/converter/transport';
import { Waveform } from '@/components/converter/waveform';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import { Routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import {
  IconAlertTriangle,
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

export function Converter({ className }: { className?: string }) {
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
      } catch (caught) {
        if (
          controller.signal.aborted ||
          (caught instanceof DOMException && caught.name === 'AbortError')
        ) {
          return;
        }
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
      if (buffer.duration > MAX_DURATION_SECONDS) {
        setStage('error');
        setError({
          message: `${name} is ${formatSeconds(buffer.duration)} long, over the ${
            MAX_DURATION_SECONDS / 60
          } minute limit.`,
          hint: 'Export a shorter section from your DAW and try again.',
        });
        return;
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
    async (file: File) => {
      resetAll();
      setStage('decoding');
      setProgressLabel('Reading the file');
      // Start the model download while the file decodes.
      void preloadModel();

      try {
        const buffer = await decodeAudioFile(file);
        await loadBuffer(buffer, file.name);
      } catch (caught) {
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

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('fetch failed');
        const blob = await response.blob();
        await handleFile(new File([blob], name, { type: blob.type }));
      } catch {
        setStage('error');
        setError({
          message: 'Could not load the example.',
          hint: 'Check your connection, or use your own file instead.',
        });
      }
    },
    [handleFile, resetAll]
  );

  // Re-derive notes when a detection setting changes; no model re-run needed.
  const handleDetectionChange = useCallback(
    async (next: TranscribeOptions) => {
      setDetection(next);
      if (!modelOutput) return;
      const detected = await notesFromOutput(modelOutput, next);
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
  }, [audio, bpm, notes]);

  const busy = stage === 'decoding' || stage === 'analyzing';
  const segmentSeconds = selection.end - selection.start;
  const selectionChanged =
    audio !== null &&
    stage === 'ready' &&
    Math.abs(playerState.duration - segmentSeconds) > 0.05;

  return (
    <div className={cn('space-y-6', className)}>
      {!audio && stage !== 'decoding' && (
        <>
          <DropZone onFile={handleFile} disabled={busy} />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">
              Or try an example:
            </span>
            {EXAMPLES.map((example) => (
              <Button
                key={example.slug}
                type="button"
                size="sm"
                variant="outline"
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

      {error && (
        <Alert variant="destructive">
          <IconAlertTriangle className="size-4" />
          <AlertTitle>{error.message}</AlertTitle>
          {error.hint && <AlertDescription>{error.hint}</AlertDescription>}
        </Alert>
      )}

      {busy && (
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{progressLabel}…</p>
              <p className="text-xs text-muted-foreground">
                {audio?.name ?? 'Preparing'}
                {stage === 'analyzing' &&
                  ` · ${segmentSeconds.toFixed(0)}s selected`}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                abortRef.current?.abort();
                setStage(audio ? 'ready' : 'idle');
              }}
            >
              <IconX className="mr-1 size-4" />
              Cancel
            </Button>
          </div>
          <Progress value={progress} className="mt-4" />
        </div>
      )}

      {audio && (
        <div className="space-y-6 rounded-xl border bg-card p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{audio.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatSeconds(audio.buffer.duration)} ·{' '}
                {audio.buffer.sampleRate} Hz · processed on this device
              </p>
            </div>
            <Button type="button" size="sm" variant="ghost" onClick={resetAll}>
              <IconX className="mr-1 size-4" />
              Start over
            </Button>
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
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed bg-muted/40 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                You changed the selection. Convert this{' '}
                {segmentSeconds.toFixed(0)}s section to update the result.
              </p>
              <Button
                type="button"
                size="sm"
                onClick={() =>
                  audio && runAnalysis(audio.buffer, selection, detection)
                }
              >
                <IconRefresh className="mr-1 size-4" />
                Convert selection
              </Button>
            </div>
          )}

          {stage === 'ready' && (
            <>
              <Transport
                playing={playerState.playing}
                source={playerState.source}
                currentTime={playerState.currentTime}
                duration={playerState.duration}
                looping={looping}
                onToggle={() => playerRef.current?.toggle()}
                onStop={() => playerRef.current?.stop()}
                onSourceChange={(source) =>
                  playerRef.current?.setSource(source)
                }
                onLoopChange={handleLoopChange}
                disabled={notes.length === 0}
              />

              <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
                <div className="space-y-3">
                  <PianoRoll
                    notes={notes}
                    ghostNotes={
                      showBefore && cleanupActive ? rawNotes : undefined
                    }
                    durationSeconds={Math.max(playerState.duration, 0.001)}
                    currentTime={playerState.currentTime}
                    onSeek={(seconds) => playerRef.current?.seek(seconds)}
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{stats.count} notes</Badge>
                    {stats.lowestPitch !== null && (
                      <Badge variant="secondary">
                        {pitchToName(stats.lowestPitch)} –{' '}
                        {pitchToName(stats.highestPitch ?? stats.lowestPitch)}
                      </Badge>
                    )}
                    <Badge variant="secondary">
                      median {Math.round(stats.medianDurationMs)} ms
                    </Badge>
                    {stats.polyphonicCount > 0 && (
                      <Badge variant="outline">
                        {stats.polyphonicCount} overlapping
                      </Badge>
                    )}
                    <Badge variant="outline">{bpm} BPM</Badge>
                    {cleanupActive && (
                      <button
                        type="button"
                        onClick={() => setShowBefore((value) => !value)}
                        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                      >
                        {showBefore ? 'Hide' : 'Show'} the {rawStats.count}{' '}
                        notes before cleanup
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <Button
                      type="button"
                      size="lg"
                      onClick={handleExport}
                      disabled={notes.length === 0}
                    >
                      <IconDownload className="mr-2 size-4" />
                      Download .mid — free
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      Standard MIDI file with tempo. No account needed.
                    </p>
                  </div>

                  {notes.length === 0 && (
                    <Alert>
                      <IconAlertTriangle className="size-4" />
                      <AlertTitle>No notes came through</AlertTitle>
                      <AlertDescription>
                        Lower the sensitivity, or pick a section where a single
                        instrument plays clearly. Dense mixes and heavy reverb
                        are the usual causes.{' '}
                        <Link
                          to={Routes.GuideImproveResults}
                          className="underline underline-offset-2"
                        >
                          See what helps
                        </Link>
                        .
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="rounded-lg border bg-background p-4">
                  <SettingsPanel
                    detection={detection}
                    onDetectionChange={handleDetectionChange}
                    cleanup={cleanup}
                    onCleanupChange={setCleanup}
                    bpm={bpm}
                    onBpmChange={(next) => {
                      setBpm(next);
                      setBpmTouched(true);
                    }}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
