import { cn } from '@/lib/utils';
import { pitchToName } from '@/lib/midi/types';
import type { Note } from '@/lib/midi/types';
import { useEffect, useMemo, useRef } from 'react';

interface PianoRollProps {
  notes: Note[];
  /** Notes before cleanup, drawn as faint outlines for comparison. */
  ghostNotes?: Note[];
  durationSeconds: number;
  currentTime: number;
  loopRegion?: { start: number; end: number } | null;
  onSeek?: (seconds: number) => void;
  className?: string;
}

const MIN_VISIBLE_SEMITONES = 18;
const PADDING_SEMITONES = 2;

/**
 * A read-only piano roll. Its job is to make transcription errors visible —
 * stray blips, overlapping notes, octave jumps — not to be a full editor.
 */
export function PianoRoll({
  notes,
  ghostNotes,
  durationSeconds,
  currentTime,
  loopRegion,
  onSeek,
  className,
}: PianoRollProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const range = useMemo(() => {
    const all = [...notes, ...(ghostNotes ?? [])];
    if (all.length === 0) return { low: 48, high: 72 };
    let low = Number.POSITIVE_INFINITY;
    let high = Number.NEGATIVE_INFINITY;
    for (const note of all) {
      if (note.pitchMidi < low) low = note.pitchMidi;
      if (note.pitchMidi > high) high = note.pitchMidi;
    }
    low -= PADDING_SEMITONES;
    high += PADDING_SEMITONES;
    const span = high - low;
    if (span < MIN_VISIBLE_SEMITONES) {
      const extra = (MIN_VISIBLE_SEMITONES - span) / 2;
      low -= extra;
      high += extra;
    }
    return { low: Math.floor(low), high: Math.ceil(high) };
  }, [notes, ghostNotes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const styles = getComputedStyle(container);
      const noteColor =
        styles.getPropertyValue('--pr-note').trim() || '#6366f1';
      const ghostColor =
        styles.getPropertyValue('--pr-ghost').trim() || '#94a3b8';
      const gridColor =
        styles.getPropertyValue('--pr-grid').trim() || '#e2e8f0';
      const laneColor =
        styles.getPropertyValue('--pr-lane').trim() || '#f1f5f9';
      const headColor =
        styles.getPropertyValue('--pr-head').trim() || '#ef4444';
      const loopColor =
        styles.getPropertyValue('--pr-loop').trim() || '#6366f1';

      const semitones = range.high - range.low + 1;
      const rowHeight = height / semitones;
      const duration = Math.max(durationSeconds, 0.001);
      const xFor = (seconds: number) => (seconds / duration) * width;
      const yFor = (pitch: number) => (range.high - pitch) * rowHeight;

      // Black-key lanes, so the pitch axis is readable without labels.
      for (let pitch = range.low; pitch <= range.high; pitch++) {
        const isBlackKey = [1, 3, 6, 8, 10].includes(((pitch % 12) + 12) % 12);
        if (isBlackKey) {
          ctx.fillStyle = laneColor;
          ctx.fillRect(0, yFor(pitch), width, rowHeight);
        }
      }

      // One gridline per second.
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      for (let second = 1; second < duration; second++) {
        const x = Math.round(xFor(second)) + 0.5;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      if (loopRegion && loopRegion.end > loopRegion.start) {
        ctx.fillStyle = loopColor;
        ctx.globalAlpha = 0.08;
        ctx.fillRect(
          xFor(loopRegion.start),
          0,
          xFor(loopRegion.end) - xFor(loopRegion.start),
          height
        );
        ctx.globalAlpha = 1;
      }

      const drawNote = (note: Note, fill: string, alpha: number) => {
        const x = xFor(note.startTimeSeconds);
        const w = Math.max(2, xFor(note.durationSeconds));
        const y = yFor(note.pitchMidi);
        const h = Math.max(2, rowHeight - 1);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = fill;
        const radius = Math.min(2, h / 2, w / 2);
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, radius);
        ctx.fill();
        ctx.globalAlpha = 1;
      };

      if (ghostNotes) {
        for (const note of ghostNotes) drawNote(note, ghostColor, 0.28);
      }
      for (const note of notes) {
        drawNote(note, noteColor, 0.35 + Math.min(0.65, note.amplitude));
      }

      // Playhead.
      const x = Math.round(xFor(currentTime)) + 0.5;
      ctx.strokeStyle = headColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    };

    draw();
    const observer = new ResizeObserver(draw);
    observer.observe(container);
    return () => observer.disconnect();
  }, [notes, ghostNotes, durationSeconds, currentTime, loopRegion, range]);

  const handleSeek = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    onSeek(Math.max(0, Math.min(1, ratio)) * durationSeconds);
  };

  return (
    <div className={cn('flex h-full gap-3', className)}>
      {/* Pitch axis */}
      <div className="st-readout flex w-10 shrink-0 flex-col justify-between py-1 text-[11px] text-muted-foreground">
        <span>{pitchToName(range.high)}</span>
        <span>{pitchToName(Math.round((range.high + range.low) / 2))}</span>
        <span>{pitchToName(range.low)}</span>
      </div>

      <div
        ref={containerRef}
        onClick={handleSeek}
        onKeyDown={(event) => {
          if (!onSeek) return;
          if (event.key === 'ArrowRight') onSeek(currentTime + 0.5);
          if (event.key === 'ArrowLeft') onSeek(Math.max(0, currentTime - 0.5));
        }}
        // Seeking makes this a slider over the timeline; without onSeek it is
        // a picture of the notes and nothing more.
        {...(onSeek
          ? {
              role: 'slider' as const,
              tabIndex: 0,
              'aria-label': 'Playhead position. Click or use arrow keys.',
              'aria-valuenow': Math.round(currentTime * 10) / 10,
              'aria-valuemin': 0,
              'aria-valuemax': Math.round(durationSeconds * 10) / 10,
              'aria-valuetext': `${currentTime.toFixed(1)} seconds`,
            }
          : {
              role: 'img' as const,
              'aria-label': `Piano roll showing ${notes.length} notes`,
            })}
        className={cn(
          'piano-roll relative h-full min-h-48 min-w-0 flex-1 overflow-hidden rounded-xl border border-hairline bg-surface-strong',
          onSeek &&
            'cursor-pointer focus-visible:ring-2 focus-visible:ring-ring'
        )}
      >
        <canvas ref={canvasRef} className="block" />
        {notes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
            No notes detected
          </div>
        )}
      </div>
    </div>
  );
}
