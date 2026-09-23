import { Button } from '@/components/ui/button';
import { formatSeconds } from '@/lib/midi/audio';
import type { PreviewSource } from '@/lib/midi/player';
import { cn } from '@/lib/utils';
import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconRepeat,
} from '@tabler/icons-react';

interface TransportProps {
  playing: boolean;
  source: PreviewSource;
  currentTime: number;
  duration: number;
  looping: boolean;
  onToggle: () => void;
  onSourceChange: (source: PreviewSource) => void;
  onLoopChange: (looping: boolean) => void;
  disabled?: boolean;
}

/**
 * Compare the two.
 *
 * One player, one playhead, two sources: switching keeps your place, so the
 * same bar can be heard both ways. That comparison is the whole reason to
 * trust or distrust a transcription, so it sits at the top of the result
 * rather than under it.
 *
 * Each side of the switch carries its own colour dot — blue for the
 * recording, orange for the MIDI — and the same two colours are used on the
 * waveform and the note roll. The word is always there too; the colour is a
 * shorthand, never the only signal.
 */
export function Transport({
  playing,
  source,
  currentTime,
  duration,
  looping,
  onToggle,
  onSourceChange,
  onLoopChange,
  disabled,
}: TransportProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        type="button"
        size="lg"
        className="size-12 rounded-full p-0"
        onClick={onToggle}
        disabled={disabled}
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? (
          <IconPlayerPauseFilled className="size-5" />
        ) : (
          <IconPlayerPlayFilled className="size-5" />
        )}
      </Button>

      <div className="inline-flex h-12 items-center rounded-full border border-hairline bg-surface-strong p-1">
        {(
          [
            { value: 'audio', label: 'Original', dot: 'st-key-audio' },
            { value: 'midi', label: 'MIDI', dot: 'st-key-midi' },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={source === option.value}
            aria-label={`Preview the ${option.label.toLowerCase()}`}
            disabled={disabled}
            onClick={() => onSourceChange(option.value)}
            className={cn(
              'flex h-full items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors',
              source === option.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <span
              aria-hidden="true"
              className={cn('size-2 rounded-full', option.dot)}
            />
            {option.label}
          </button>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        className={cn(
          'h-12 rounded-full bg-surface-strong px-4',
          looping && 'border-foreground'
        )}
        onClick={() => onLoopChange(!looping)}
        disabled={disabled}
        aria-pressed={looping}
      >
        <IconRepeat className="mr-1.5 size-4" />
        Loop {looping ? 'on' : 'off'}
      </Button>

      <span className="st-readout ml-auto text-sm text-muted-foreground">
        <span className="text-foreground">{formatSeconds(currentTime)}</span>
        {' / '}
        {formatSeconds(duration)}
      </span>
    </div>
  );
}
