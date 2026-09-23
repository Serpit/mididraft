import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <img
      src="/brand/mididraft-mark.svg"
      alt="MidiDraft logo"
      className={cn('size-8 shrink-0', className)}
      width={32}
      height={32}
      decoding="async"
    />
  );
}

/** Branch-specific typographic signature, kept as accessible live text. */
export function BrandWordmark() {
  return (
    <span className="brand-wordmark">
      <span>Midi</span>
      <span>Draft</span>
    </span>
  );
}
