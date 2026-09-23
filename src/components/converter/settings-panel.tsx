import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  DEFAULT_CLEANUP_OPTIONS,
  DEFAULT_TRANSCRIBE_OPTIONS,
  pitchToName,
} from '@/lib/midi/types';
import type { CleanupOptions, TranscribeOptions } from '@/lib/midi/types';
import { IconRotate } from '@tabler/icons-react';

interface SettingsPanelProps {
  detection: TranscribeOptions;
  onDetectionChange: (options: TranscribeOptions) => void;
  cleanup: CleanupOptions;
  onCleanupChange: (options: CleanupOptions) => void;
  bpm: number;
  onBpmChange: (bpm: number) => void;
  disabled?: boolean;
}

function Control({
  label,
  hint,
  value,
  children,
}: {
  label: string;
  hint: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label className="text-sm font-medium">{label}</Label>
        <span className="text-xs tabular-nums text-muted-foreground">
          {value}
        </span>
      </div>
      {children}
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

const firstValue = (value: number | readonly number[]) =>
  Array.isArray(value) ? value[0] : (value as number);

/**
 * Detection and cleanup controls.
 *
 * Detection changes re-derive notes from the cached model output, so they
 * apply instantly without re-running the model. Reset restores the raw
 * transcription — nothing here is destructive.
 */
export function SettingsPanel({
  detection,
  onDetectionChange,
  cleanup,
  onCleanupChange,
  bpm,
  onBpmChange,
  disabled,
}: SettingsPanelProps) {
  const resetAll = () => {
    onDetectionChange({ ...DEFAULT_TRANSCRIBE_OPTIONS });
    onCleanupChange({ ...DEFAULT_CLEANUP_OPTIONS });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Adjust the result</h3>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={resetAll}
          disabled={disabled}
        >
          <IconRotate className="mr-1 size-3.5" />
          Reset
        </Button>
      </div>

      <div className="space-y-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Detection
        </p>

        <Control
          label="Sensitivity"
          hint="Lower picks up quiet notes and more noise. Higher keeps only confident note starts."
          value={detection.onsetThreshold.toFixed(2)}
        >
          <Slider
            min={0.05}
            max={0.9}
            step={0.05}
            value={[detection.onsetThreshold]}
            disabled={disabled}
            onValueChange={(value) =>
              onDetectionChange({
                ...detection,
                onsetThreshold: firstValue(value),
              })
            }
          />
        </Control>

        <Control
          label="Note sustain"
          hint="Lower holds notes longer. Higher cuts them off sooner."
          value={detection.frameThreshold.toFixed(2)}
        >
          <Slider
            min={0.05}
            max={0.9}
            step={0.05}
            value={[detection.frameThreshold]}
            disabled={disabled}
            onValueChange={(value) =>
              onDetectionChange({
                ...detection,
                frameThreshold: firstValue(value),
              })
            }
          />
        </Control>

        <Control
          label="Minimum note length"
          hint="The shortest note the model is allowed to report."
          value={`${detection.minNoteLengthMs} ms`}
        >
          <Slider
            min={20}
            max={500}
            step={10}
            value={[detection.minNoteLengthMs]}
            disabled={disabled}
            onValueChange={(value) =>
              onDetectionChange({
                ...detection,
                minNoteLengthMs: firstValue(value),
              })
            }
          />
        </Control>

        <Control
          label="Pitch range"
          hint="Cut sub-bass rumble and high harmonics that are not real notes."
          value={`${pitchToName(detection.minPitchMidi ?? 21)} – ${pitchToName(
            detection.maxPitchMidi ?? 108
          )}`}
        >
          <Slider
            min={21}
            max={108}
            step={1}
            value={[
              detection.minPitchMidi ?? 21,
              detection.maxPitchMidi ?? 108,
            ]}
            disabled={disabled}
            onValueChange={(value) => {
              const range = value as number[];
              onDetectionChange({
                ...detection,
                minPitchMidi: range[0] <= 21 ? null : range[0],
                maxPitchMidi: range[1] >= 108 ? null : range[1],
              });
            }}
          />
        </Control>
      </div>

      <div className="space-y-5 border-t pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Cleanup
        </p>

        <Control
          label="Remove short notes"
          hint="The usual fix for stray blips between real notes."
          value={
            cleanup.removeShorterThanMs === 0
              ? 'off'
              : `under ${cleanup.removeShorterThanMs} ms`
          }
        >
          <Slider
            min={0}
            max={400}
            step={10}
            value={[cleanup.removeShorterThanMs]}
            disabled={disabled}
            onValueChange={(value) =>
              onCleanupChange({
                ...cleanup,
                removeShorterThanMs: firstValue(value),
              })
            }
          />
        </Control>

        <Control
          label="Remove quiet notes"
          hint="Drops notes below this share of the loudest note."
          value={
            cleanup.removeQuieterThan === 0
              ? 'off'
              : `under ${Math.round(cleanup.removeQuieterThan * 100)}%`
          }
        >
          <Slider
            min={0}
            max={0.6}
            step={0.05}
            value={[cleanup.removeQuieterThan]}
            disabled={disabled}
            onValueChange={(value) =>
              onCleanupChange({
                ...cleanup,
                removeQuieterThan: firstValue(value),
              })
            }
          />
        </Control>

        <Control
          label="Merge repeated notes"
          hint="Joins same-pitch notes split by a false onset on a sustained note."
          value={
            cleanup.mergeGapMs === 0
              ? 'off'
              : `gaps under ${cleanup.mergeGapMs} ms`
          }
        >
          <Slider
            min={0}
            max={300}
            step={10}
            value={[cleanup.mergeGapMs]}
            disabled={disabled}
            onValueChange={(value) =>
              onCleanupChange({ ...cleanup, mergeGapMs: firstValue(value) })
            }
          />
        </Control>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Label className="text-sm font-medium">Trim overlaps</Label>
            <p className="text-xs text-muted-foreground">
              Stops the same pitch sounding twice at once.
            </p>
          </div>
          <Switch
            checked={cleanup.trimOverlaps}
            disabled={disabled}
            onCheckedChange={(checked) =>
              onCleanupChange({ ...cleanup, trimOverlaps: checked })
            }
          />
        </div>

        <Control
          label="Quantize"
          hint="Pulls note starts towards the grid. Keep it low to preserve your feel."
          value={
            cleanup.quantizeStrength === 0
              ? 'off'
              : `${Math.round(cleanup.quantizeStrength * 100)}% to 1/${cleanup.quantizeGrid}`
          }
        >
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={[cleanup.quantizeStrength]}
            disabled={disabled}
            onValueChange={(value) =>
              onCleanupChange({
                ...cleanup,
                quantizeStrength: firstValue(value),
              })
            }
          />
        </Control>

        <Control
          label="Tempo"
          hint="Written into the exported file so your DAW lines the notes up. Estimated from the notes; correct it if you know the real tempo."
          value={`${bpm} BPM`}
        >
          <Slider
            min={40}
            max={220}
            step={1}
            value={[bpm]}
            disabled={disabled}
            onValueChange={(value) => onBpmChange(firstValue(value))}
          />
        </Control>
      </div>
    </div>
  );
}
