import { Button } from '@/components/ui/button';
import {
  ACCEPTED_EXTENSIONS,
  MAX_DURATION_SECONDS,
  MAX_FILE_BYTES,
  formatBytes,
} from '@/lib/midi/audio';
import { cn } from '@/lib/utils';
import { IconLock, IconMusic, IconUpload } from '@tabler/icons-react';
import { useRef, useState } from 'react';

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

/**
 * The first thing on the page: pick a file and start.
 * No sign-up, no email — the free export has to actually finish the job.
 */
export function DropZone({ onFile, disabled }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) onFile(file);
  };

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled) handleFiles(event.dataTransfer.files);
      }}
      className={cn(
        'rounded-xl border-2 border-dashed p-8 text-center transition-colors sm:p-12',
        dragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/30',
        disabled && 'opacity-60'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files);
          // Allow re-selecting the same file after a reset.
          event.target.value = '';
        }}
      />

      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
        <IconMusic className="size-6 text-primary" />
      </div>

      <h2 className="mt-4 text-lg font-semibold">
        Drop an MP3 or WAV to get MIDI
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        Works best on a clear single instrument or one melody line. Pick a 15–60
        second section for the fastest, most accurate draft.
      </p>

      <Button
        type="button"
        size="lg"
        className="mt-5"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        <IconUpload className="mr-2 size-4" />
        Choose an audio file
      </Button>

      <ul className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <li>{ACCEPTED_EXTENSIONS.join(' · ')}</li>
        <li>up to {formatBytes(MAX_FILE_BYTES)}</li>
        <li>up to {MAX_DURATION_SECONDS / 60} minutes</li>
      </ul>

      <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <IconLock className="size-3.5" />
        Converted in your browser. Your audio is never uploaded.
      </p>
    </div>
  );
}
