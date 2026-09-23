import { formatSeconds } from '@/lib/midi/audio';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useRef, useState } from 'react';

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
          'relative h-24 w-full select-none overflow-hidden rounded-lg border bg-muted/40',
          onSeek && !disabled && 'cursor-pointer'
        )}
        onClick={(event) => {
          if (disabled || dragging) return;
          onSeek?.(timeAt(event.clientX));
        }}
      >
        {/* Waveform bars */}
        <div className="absolute inset-0 flex items-center gap-px px-px">
          {peaks.map((peak, index) => {
            const time = (index / peaks.length) * durationSeconds;
            const inSelection =
              time >= selection.start && time <= selection.end;
            return (
              <div
                key={index}
                className={cn(
                  'flex-1 rounded-full transition-colors',
                  inSelection ? 'bg-primary/70' : 'bg-muted-foreground/25'
                )}
                style={{ height: `${Math.max(2, peak * 92)}%` }}
              />
            );
          })}
        </div>

        {/* Dimmed regions outside the selection */}
        <div
          className="absolute inset-y-0 left-0 bg-background/55"
          style={{ width: pct(selection.start) }}
        />
        <div
          className="absolute inset-y-0 right-0 bg-background/55"
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
              'absolute inset-y-0 z-10 w-3 -translate-x-1/2 cursor-ew-resize',
              'flex items-center justify-center disabled:cursor-not-allowed'
            )}
            style={{ left: pct(selection[edge]) }}
          >
            <span className="h-full w-0.5 rounded-full bg-primary shadow-sm" />
          </button>
        ))}

        {/* Playhead */}
        <div
          className="pointer-events-none absolute inset-y-0 w-px bg-destructive"
          style={{ left: pct(currentTime) }}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="tabular-nums">
          Selection {formatSeconds(selection.start)} –{' '}
          {formatSeconds(selection.end)}
          <span className="ml-1 text-foreground">
            ({selectionSeconds.toFixed(1)}s)
          </span>
        </span>
        <span className="tabular-nums">
          Full file {formatSeconds(durationSeconds)} · max {maxSelectionSeconds}
          s per run
        </span>
      </div>
    </div>
  );
}
