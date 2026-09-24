import { Button } from '@/components/ui/button';
import {
  ACCEPTED_EXTENSIONS,
  MAX_FILE_BYTES,
  formatBytes,
} from '@/lib/midi/audio';
import { cn } from '@/lib/utils';
import { IconLock, IconUpload } from '@tabler/icons-react';
import { useRef, useState } from 'react';

interface BatchDropZoneProps {
  onFiles: (files: File[]) => void;
  disabled?: boolean;
  maxFiles: number;
  maxDurationMinutes: number;
}

export function BatchDropZone({
  onFiles,
  disabled,
  maxFiles,
  maxDurationMinutes,
}: BatchDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const accepted = Array.from(files).filter((file) => {
      const ext = file.name.toLowerCase();
      return ACCEPTED_EXTENSIONS.some((e) => ext.endsWith(e));
    });
    if (accepted.length > 0) {
      onFiles(accepted.slice(0, maxFiles));
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
        'st-card text-center transition-colors',
        dragging && 'border-audio bg-audio/5',
        disabled && 'opacity-60'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(',')}
        multiple
        className="sr-only"
        disabled={disabled}
        onChange={(event) => {
          handleFiles(event.target.files);
          event.target.value = '';
        }}
      />

      <div className="px-6 py-10">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-surface-strong">
          <IconUpload className="size-7 text-muted-foreground" />
        </div>

        <h2 className="mt-5 text-xl font-medium tracking-tight sm:text-2xl">
          Drop audio files, or choose some
        </h2>
        <p className="mx-auto mt-2 max-w-md leading-relaxed text-muted-foreground">
          Select up to {maxFiles} files. Each file can be up to{' '}
          {maxDurationMinutes} minutes long. They will be processed one after
          another in your browser.
        </p>

        <Button
          type="button"
          size="lg"
          className="mt-7 h-12 rounded-full px-7 text-base"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          Choose audio files
        </Button>

        <ul className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
          {[
            ACCEPTED_EXTENSIONS.join(' · '),
            `up to ${formatBytes(MAX_FILE_BYTES)} each`,
            `up to ${maxDurationMinutes} minutes each`,
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
          Converted in your browser — nothing is uploaded.
        </p>
      </div>
    </div>
  );
}
