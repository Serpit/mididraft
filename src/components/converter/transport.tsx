import { Button } from '@/components/ui/button';
import { formatSeconds } from '@/lib/midi/audio';
import type { PreviewSource } from '@/lib/midi/player';
import { cn } from '@/lib/utils';
import {
  IconPlayerPauseFilled,
  IconPlayerPlayFilled,
  IconPlayerStopFilled,
  IconRepeat,
} from '@tabler/icons-react';

interface TransportProps {
  playing: boolean;
  source: PreviewSource;
  currentTime: number;
  duration: number;
  looping: boolean;
  onToggle: () => void;
  onStop: () => void;
  onSourceChange: (source: PreviewSource) => void;
  onLoopChange: (looping: boolean) => void;
  disabled?: boolean;
}

/**
 * Playback bar with the original/MIDI switch.
 *
 * Switching keeps the playhead, so the same bar can be heard both ways —
 * the fastest way to tell whether a transcription is worth editing.
 */
export function Transport({
  playing,
  source,
  currentTime,
  duration,
  looping,
  onToggle,
  onStop,
  onSourceChange,
  onLoopChange,
  disabled,
}: TransportProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="icon"
          onClick={onToggle}
          disabled={disabled}
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <IconPlayerPauseFilled className="size-4" />
          ) : (
            <IconPlayerPlayFilled className="size-4" />
          )}
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={onStop}
          disabled={disabled}
          aria-label="Stop"
        >
          <IconPlayerStopFilled className="size-4" />
        </Button>
      </div>

      {/* Original / MIDI switch */}
      <div className="inline-flex rounded-lg border p-0.5">
        {(
          [
            { value: 'audio', label: 'Original' },
            { value: 'midi', label: 'MIDI' },
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
              'rounded-md px-3 py-1 text-sm font-medium transition-colors',
              source === option.value
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <Button
        type="button"
        size="sm"
        variant={looping ? 'secondary' : 'ghost'}
        onClick={() => onLoopChange(!looping)}
        disabled={disabled}
        aria-pressed={looping}
      >
        <IconRepeat className="mr-1 size-4" />
        Loop selection
      </Button>

      <span className="ml-auto text-sm tabular-nums text-muted-foreground">
        {formatSeconds(currentTime)} / {formatSeconds(duration)}
      </span>
    </div>
  );
}
