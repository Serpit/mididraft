import {
  LAUNCH_PRICE,
  useLaunchOffer,
} from '@/components/pricing/launch-offer';
import { Button } from '@/components/ui/button';
import { productConfig } from '@/config/product';
import { formatBytes } from '@/lib/midi/audio';
import { IconArrowRight, IconStack2, IconX } from '@tabler/icons-react';

const { pricing, batchLimits } = productConfig;
/** Names listed before the rest fold into "and N more". */
const SHOWN = 4;

interface BatchTrayProps {
  files: File[];
  /** The visitor already has a pass or Pro; no price to show. */
  hasBatchAccess: boolean;
  onBatch: () => void;
  onConvertFirst: () => void;
  onClear: () => void;
}

/**
 * What the homepage shows when several files land on it at once.
 *
 * Dropping a folder is the clearest sign someone wants the batch tool, so
 * nothing is thrown away: the whole drop is offered as one batch, with the
 * free one-file conversion still a click away and the price stated up front.
 */
export function BatchTray({
  files,
  hasBatchAccess,
  onBatch,
  onConvertFirst,
  onClear,
}: BatchTrayProps) {
  const { active: offer } = useLaunchOffer();
  const count = files.length;
  const maxFiles = batchLimits.pass.maxFiles;
  const price = offer ? LAUNCH_PRICE : `$${pricing.projectPass.amountUsd}`;

  return (
    <div className="st-card overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-5 pt-5">
        <div className="min-w-0">
          <p className="st-eyebrow flex items-center gap-2">
            <IconStack2 className="size-3.5" />
            {count} clips dropped
          </p>
          <h2 className="mt-2 text-xl font-medium tracking-tight sm:text-2xl">
            Convert all {Math.min(count, maxFiles)} in one run
          </h2>
          <p className="mt-1.5 max-w-lg text-muted-foreground">
            One set of settings for every clip, and one ZIP with every .mid.
            Still converted in your browser, still never uploaded.
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 rounded-full"
          aria-label="Clear these files"
          onClick={onClear}
        >
          <IconX className="size-4" />
        </Button>
      </div>

      <ul className="mx-5 mt-4 divide-y divide-hairline rounded-xl border border-hairline">
        {files.slice(0, SHOWN).map((file, index) => (
          <li
            // Two files can share a name when they come from different folders.
            key={`${file.name}-${index}`}
            className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
          >
            <span className="truncate">{file.name}</span>
            <span className="st-readout shrink-0 text-xs text-muted-foreground">
              {formatBytes(file.size)}
            </span>
          </li>
        ))}
        {count > SHOWN && (
          <li className="px-4 py-2.5 text-sm text-muted-foreground">
            and {count - SHOWN} more
          </li>
        )}
      </ul>

      {count > maxFiles && (
        <p className="mx-5 mt-3 text-sm text-muted-foreground">
          A run takes up to {maxFiles} files, so the first {maxFiles} go in.
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-hairline px-5 py-4">
        <Button
          type="button"
          size="lg"
          className="h-12 rounded-full px-6 text-base"
          onClick={onBatch}
        >
          Batch convert all {Math.min(count, maxFiles)}
          <IconArrowRight className="ml-1.5 size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="h-12 rounded-full px-4"
          onClick={onConvertFirst}
        >
          Just convert the first one, free
        </Button>
        {!hasBatchAccess && (
          <p className="w-full text-sm text-muted-foreground">
            Batch is part of the Project Pass:{' '}
            <span className="font-medium text-foreground">{price}</span>
            {offer && (
              <>
                {' '}
                <span className="line-through">
                  ${pricing.projectPass.amountUsd}
                </span>
              </>
            )}{' '}
            for {pricing.projectPass.days} days, one payment. You can set
            everything up before you pay.
          </p>
        )}
      </div>
    </div>
  );
}
