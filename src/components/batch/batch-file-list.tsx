import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { BatchItem } from '@/lib/midi/batch';
import { cn } from '@/lib/utils';
import {
  IconAlertTriangle,
  IconCheck,
  IconLoader2,
  IconX,
} from '@tabler/icons-react';

interface BatchFileListProps {
  items: BatchItem[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

const STATUS_ICONS: Record<BatchItem['status'], React.ReactNode> = {
  pending: null,
  decoding: (
    <IconLoader2 className="size-4 animate-spin text-muted-foreground" />
  ),
  analyzing: <IconLoader2 className="size-4 animate-spin text-primary" />,
  cleaning: <IconLoader2 className="size-4 animate-spin text-primary" />,
  done: <IconCheck className="size-4 text-success" />,
  failed: <IconAlertTriangle className="size-4 text-destructive" />,
};

const STATUS_LABELS: Record<BatchItem['status'], string> = {
  pending: 'Waiting',
  decoding: 'Reading',
  analyzing: 'Converting',
  cleaning: 'Cleaning up',
  done: 'Done',
  failed: 'Failed',
};

export function BatchFileList({
  items,
  onRemove,
  onRetry,
}: BatchFileListProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            'flex items-center gap-3 rounded-lg border bg-card px-4 py-3',
            item.status === 'failed' && 'border-destructive/30 bg-destructive/5'
          )}
        >
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-strong text-xs font-medium text-muted-foreground">
            {index + 1}
          </span>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.file.name}</p>
            <div className="mt-1 flex items-center gap-2">
              {STATUS_ICONS[item.status]}
              <span className="text-xs text-muted-foreground">
                {STATUS_LABELS[item.status]}
              </span>
              {item.status === 'analyzing' && (
                <span className="text-xs text-muted-foreground">
                  {Math.round(item.progress)}%
                </span>
              )}
              {item.error && (
                <span className="truncate text-xs text-destructive">
                  {item.error}
                </span>
              )}
            </div>
            {(item.status === 'analyzing' || item.status === 'decoding') && (
              <Progress value={item.progress} className="mt-2 h-1" />
            )}
          </div>

          <div className="flex items-center gap-1">
            {item.status === 'failed' && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-full"
                onClick={() => onRetry(item.id)}
              >
                Retry
              </Button>
            )}
            {(item.status === 'pending' || item.status === 'failed') && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={() => onRemove(item.id)}
              >
                <IconX className="size-4" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
