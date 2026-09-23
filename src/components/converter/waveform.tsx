import { formatSeconds } from '@/lib/midi/audio';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface WaveformProps {
  peaks: number[];
  durationSeconds: number;
  currentTime: number;
  /** The slice that will actually be transcribed. */
  selection: { start: number; end: number };
  onSelectionChange: (selection: { start: number; end: number }) => void;
  onSeek?: (seconds: number) => void;
  /** Longest slice the converter accepts, in seconds. */
  maxSelectionSeconds: number;
  disabled?: boolean;
}

type DragTarget = 'start' | 'end' | null;

/**
 * Waveform with draggable selection handles.
 *
 * Picking a 15–60 second slice is the difference between a usable draft and a
 * long wait, so the control is front and centre rather than hidden in settings.
 */
export function Waveform({
  peaks,
  durationSeconds,
  currentTime,
  selection,
  onSelectionChange,
  onSeek,
  maxSelectionSeconds,
  disabled,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<DragTarget>(null);

  /*
   * `buildWaveformPeaks` returns a fixed number of peaks. One flex child per
   * peak gives every bar a sub-pixel width in a narrow container — on a phone,
   * or whenever the waveform shares a row — and the waveform disappears
   * entirely. Downsample to whatever the container can actually draw.
   */
  const [barCount, setBarCount] = useState(0);
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const measure = () =>
      setBarCount(Math.max(24, Math.floor(element.clientWidth / 3)));
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const bars = useMemo(() => {
    if (peaks.length === 0 || barCount === 0) return [];
    if (barCount >= peaks.length) return peaks;
    const out: number[] = [];
    const bucket = peaks.length / barCount;
    for (let index = 0; index < barCount; index++) {
      const from = Math.floor(index * bucket);
      const to = Math.max(from + 1, Math.floor((index + 1) * bucket));
      let peak = 0;
      for (let i = from; i < to && i < peaks.length; i++) {
        if (peaks[i] > peak) peak = peaks[i];
      }
      out.push(peak);
    }
    return out;
  }, [peaks, barCount]);

  const timeAt = useCallback(
    (clientX: number) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return 0;
      const ratio = (clientX - rect.left) / rect.width;
      return Math.max(0, Math.min(1, ratio)) * durationSeconds;
    },
    [durationSeconds]
  );

  useEffect(() => {
    if (!dragging) return;

    const onMove = (event: PointerEvent) => {
      const time = timeAt(event.clientX);
      if (dragging === 'start') {
        const start = Math.min(time, selection.end - 0.5);
        onSelectionChange({
          start: Math.max(0, start),
          end: Math.min(selection.end, start + maxSelectionSeconds),
        });
      } else {
        const end = Math.max(time, selection.start + 0.5);
        onSelectionChange({
          start: Math.max(selection.start, end - maxSelectionSeconds),
          end: Math.min(durationSeconds, end),
        });
      }
    };
    const onUp = () => setDragging(null);

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, [
    dragging,
    selection,
    durationSeconds,
    maxSelectionSeconds,
    onSelectionChange,
    timeAt,
  ]);

  const pct = (seconds: number) =>
    `${Math.max(0, Math.min(100, (seconds / Math.max(durationSeconds, 0.001)) * 100))}%`;

  const selectionSeconds = selection.end - selection.start;

  return (
    <div className="space-y-2">
      <div
        ref={containerRef}
        className={cn(
          'relative h-24 w-full select-none overflow-hidden rounded-xl border border-hairline bg-surface-strong sm:h-28',
          onSeek && !disabled && 'cursor-pointer'
        )}
        onClick={(event) => {
          if (disabled || dragging) return;
          onSeek?.(timeAt(event.clientX));
        }}
      >
        {/* Waveform bars */}
        <div className="absolute inset-0 flex items-center gap-px px-px">
          {bars.map((peak, index) => {
            const time = (index / bars.length) * durationSeconds;
            const inSelection =
              time >= selection.start && time <= selection.end;
            return (
              <div
                key={index}
                className={cn(
                  'flex-1 rounded-full transition-colors',
                  inSelection ? 'bg-audio' : 'bg-muted-foreground/25'
                )}
                style={{ height: `${Math.max(2, peak * 92)}%` }}
              />
            );
          })}
        </div>

        {/* Dimmed regions outside the selection */}
        <div
          className="absolute inset-y-0 left-0 bg-surface-strong/70"
          style={{ width: pct(selection.start) }}
        />
        <div
          className="absolute inset-y-0 right-0 bg-surface-strong/70"
          style={{ width: pct(durationSeconds - selection.end) }}
        />

        {/* Selection handles */}
        {(['start', 'end'] as const).map((edge) => (
          <button
            key={edge}
            type="button"
            disabled={disabled}
            aria-label={`${edge === 'start' ? 'Start' : 'End'} of selection, ${formatSeconds(selection[edge])}`}
            onPointerDown={(event) => {
              if (disabled) return;
              event.preventDefault();
              event.stopPropagation();
              setDragging(edge);
            }}
            onKeyDown={(event) => {
              const step = event.shiftKey ? 1 : 0.1;
              if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
                event.preventDefault();
                const delta = event.key === 'ArrowLeft' ? -step : step;
                const next = { ...selection, [edge]: selection[edge] + delta };
                if (
                  next.end - next.start >= 0.5 &&
                  next.end - next.start <= maxSelectionSeconds &&
                  next.start >= 0 &&
                  next.end <= durationSeconds
                ) {
                  onSelectionChange(next);
                }
              }
            }}
            className={cn(
              'absolute inset-y-0 z-10 w-6 -translate-x-1/2 cursor-ew-resize',
              'flex items-center justify-center disabled:cursor-not-allowed'
            )}
            style={{ left: pct(selection[edge]) }}
          >
            <span className="h-full w-0.5 rounded-full bg-foreground" />
            <span className="absolute size-4 rounded-full border border-hairline bg-surface-strong" />
          </button>
        ))}

        {/* Playhead */}
        <div
          className="pointer-events-none absolute inset-y-0 w-0.5 rounded-full bg-midi"
          style={{ left: pct(currentTime) }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="st-readout">
          <span className="text-foreground">
            {formatSeconds(selection.start)} – {formatSeconds(selection.end)}
          </span>{' '}
          ({selectionSeconds.toFixed(1)}s selected)
        </span>
        <span className="st-readout">
          full file {formatSeconds(durationSeconds)} · max {maxSelectionSeconds}
          s per run
        </span>
      </div>
    </div>
  );
}
