import { Button } from '@/components/ui/button';
import {
  ACCEPTED_EXTENSIONS,
  MAX_DURATION_SECONDS,
  MAX_FILE_BYTES,
  formatBytes,
} from '@/lib/midi/audio';
import { cn } from '@/lib/utils';
import { IconLock, IconMusic } from '@tabler/icons-react';
import { useRef, useState } from 'react';

interface DropZoneProps {
  onFile: (file: File) => void;
  disabled?: boolean;
}

/**
 * The first and only thing on the first screen.
 *
 * One card, one pill, and the three facts that decide whether someone tries
 * it at all: it is free, it stays on your machine, and these are the formats.
 * Everything else about the tool is further down the page where it belongs.
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
        'st-card px-6 py-10 text-center transition-colors sm:px-10 sm:py-14',
        dragging && 'border-audio bg-audio/5',
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

      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-surface-strong">
        <IconMusic className="size-6 text-audio" />
      </span>

      <h2 className="mt-5 text-xl font-medium tracking-tight sm:text-2xl">
        Drop an audio file, or choose one
      </h2>
      <p className="mx-auto mt-2 max-w-md leading-relaxed text-muted-foreground">
        Works best on a clear single instrument or one melody line. Pick a 15–60
        second section for the fastest, most accurate draft.
      </p>

      <Button
        type="button"
        size="lg"
        className="mt-7 h-12 rounded-full px-7 text-base"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        Choose an audio file
      </Button>

      <ul className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
        {[
          ACCEPTED_EXTENSIONS.join(' · '),
          `up to ${formatBytes(MAX_FILE_BYTES)}`,
          `up to ${MAX_DURATION_SECONDS / 60} minutes`,
        ].map((item) => (
          <li
            key={item}
            className="rounded-full bg-surface-strong px-3 py-1 text-xs"
          >
            {item}
          </li>
        ))}
      </ul>

      <p className="mt-5 inline-flex items-center gap-2 text-sm text-muted-foreground">
        <IconLock className="size-4 shrink-0" />
        Converted in your browser — your audio is never uploaded, and the export
        is free.
      </p>
    </div>
  );
}
