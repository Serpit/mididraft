import { Button } from '@/components/ui/button';
import {
  ACCEPTED_EXTENSIONS,
  MAX_DURATION_SECONDS,
  MAX_FILE_BYTES,
  formatBytes,
} from '@/lib/midi/audio';
import { handOffToBatch } from '@/lib/midi/batch-handoff';
import { Routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { IconLock } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import { useRef, useState } from 'react';

interface DropZoneProps {
  onFile: (file: File) => void;
  /** Called instead of `onFile` when more than one file arrives at once. */
  onFiles?: (files: File[]) => void;
  disabled?: boolean;
}

/**
 * The first and only thing on the first screen.
 *
 * One card, one pill, and the three facts that decide whether someone tries
 * it at all: it is free, it stays on your machine, and these are the formats.
 * Everything else about the tool is further down the page where it belongs.
 */
export function DropZone({ onFile, onFiles, disabled }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (list: FileList | null) => {
    const files = Array.from(list ?? []);
    if (files.length > 1 && onFiles) {
      onFiles(files);
    } else if (files[0]) {
      onFile(files[0]);
    }
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
        'st-card melody-drop text-center transition-colors',
        dragging && 'border-audio bg-audio/5',
        disabled && 'opacity-60'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        multiple={!!onFiles}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files);
          // Allow re-selecting the same file after a reset.
          event.target.value = '';
        }}
      />

      <figure className="melody-art" aria-hidden="true">
        <img
          src="/illustrations/paper-melody.jpg"
          alt=""
          width={1536}
          height={1024}
          fetchPriority="high"
        />
        <figcaption>
          A little idea.
          <br />
          <em>A new possibility.</em>
        </figcaption>
      </figure>
      <div className="melody-action">
        <p className="st-eyebrow mb-3">Make room for your next melody</p>
        <h2 className="text-xl font-medium tracking-tight sm:text-2xl">
          Drop an audio file, or choose one
        </h2>
        <p className="mx-auto mt-2 max-w-md leading-relaxed text-muted-foreground">
          Works best on a clear single instrument or one melody line. Pick a
          15–60 second section for the fastest, most accurate draft.
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
          Converted in your browser — your audio is never uploaded, and the
          export is free.
        </p>

        {onFiles && (
          <p className="mt-2 text-sm text-muted-foreground">
            A folder of clips? Drop them all at once, or{' '}
            <Link
              to={Routes.BatchAudioToMidi}
              className="underline underline-offset-4 hover:text-foreground"
              onClick={() =>
                handOffToBatch({ entry: 'dropzone_hint', files: [] })
              }
            >
              open the batch converter
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
