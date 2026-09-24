import { SettingsPanel } from '@/components/converter/settings-panel';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { UpgradePrompt } from '@/components/batch/upgrade-prompt';
import { BatchDropZone } from '@/components/batch/batch-drop-zone';
import { BatchFileList } from '@/components/batch/batch-file-list';
import { useCurrentPlan } from '@/hooks/use-payment';
import { productConfig } from '@/config/product';
import {
  DEFAULT_CLEANUP_OPTIONS,
  DEFAULT_TRANSCRIBE_OPTIONS,
} from '@/lib/midi/types';
import type { CleanupOptions, TranscribeOptions } from '@/lib/midi/types';
import {
  createBatchItem,
  processBatch,
  type BatchItem,
  type BatchProgress,
} from '@/lib/midi/batch';
import { createMidiZip } from '@/lib/midi/zip-export';
import { downloadBlob } from '@/lib/midi/export';
import { track } from '@/lib/analytics/events';
import { cn } from '@/lib/utils';
import {
  IconChevronDown,
  IconDownload,
  IconRefresh,
  IconX,
} from '@tabler/icons-react';
import { useCallback, useRef, useState } from 'react';

type BatchStage = 'idle' | 'running' | 'done';

const { batchLimits } = productConfig;

export function BatchConverter({ className }: { className?: string }) {
  const { planId, hasBatchAccess } = useCurrentPlan();

  if (!hasBatchAccess) {
    return (
      <UpgradePrompt
        planId="pass"
        title="Batch processing is a paid feature"
        description="The free converter handles one file at a time. Upgrade to process multiple clips in one run, with consistent settings and a ZIP download."
        className={className}
      />
    );
  }

  const limits = planId === 'pro' ? batchLimits.pro : batchLimits.pass;

  return (
    <BatchConverterInner
      className={className}
      limits={limits}
      planId={planId}
    />
  );
}

interface BatchLimits {
  maxFiles: number;
  maxDurationMinutes: number;
}

function BatchConverterInner({
  className,
  limits,
  planId,
}: {
  className?: string;
  limits: BatchLimits;
  /** Reported with batch events so usage can be split by plan. */
  planId: string;
}) {
  const [stage, setStage] = useState<BatchStage>('idle');
  const [items, setItems] = useState<BatchItem[]>([]);
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(
    null
  );
  const [detection, setDetection] = useState<TranscribeOptions>({
    ...DEFAULT_TRANSCRIBE_OPTIONS,
  });
  const [cleanup, setCleanup] = useState<CleanupOptions>({
    ...DEFAULT_CLEANUP_OPTIONS,
  });
  const [bpm, setBpm] = useState(120);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const handleFilesAdded = useCallback(
    (files: File[]) => {
      const newItems = files
        .filter((file) => {
          const name = file.name.toLowerCase();
          return (
            name.endsWith('.mp3') ||
            name.endsWith('.wav') ||
            name.endsWith('.ogg') ||
            name.endsWith('.flac') ||
            name.endsWith('.m4a') ||
            name.endsWith('.aac')
          );
        })
        .slice(0, limits.maxFiles - items.length)
        .map((file) => createBatchItem(file));

      setItems((prev) => [...prev, ...newItems].slice(0, limits.maxFiles));
    },
    [items.length, limits]
  );

  const handleRemoveItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleRetryItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: 'pending' as const, progress: 0, error: null }
          : item
      )
    );
  }, []);

  const handleStart = useCallback(async () => {
    if (items.length === 0) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStage('running');
    setItems((prev) =>
      prev.map((item) =>
        item.status === 'failed'
          ? { ...item, status: 'pending' as const, progress: 0, error: null }
          : item
      )
    );

    track('batch_start', { file_count: items.length, plan_id: planId });
    const startedAt = performance.now();

    const result = await processBatch(
      items,
      { transcribe: detection, cleanup, bpm },
      (updatedItems, progress) => {
        setItems([...updatedItems]);
        setBatchProgress(progress);
      },
      controller.signal
    );

    setItems(result);
    setStage('done');

    const successCount = result.filter((i) => i.status === 'done').length;
    const failCount = result.filter((i) => i.status === 'failed').length;
    track('batch_complete', {
      file_count: result.length,
      success_count: successCount,
      fail_count: failCount,
      duration_ms: Math.round(performance.now() - startedAt),
      status:
        successCount === result.length
          ? 'completed'
          : successCount > 0
            ? 'partial'
            : 'failed',
      plan_id: planId,
    });
  }, [items, detection, cleanup, bpm, planId]);

  const handleCancel = useCallback(() => {
    abortRef.current?.abort();
    setStage('done');
  }, []);

  const handleDownloadZip = useCallback(async () => {
    const doneItems = items.filter((item) => item.status === 'done');
    if (doneItems.length === 0) return;

    const blob = await createMidiZip(doneItems);
    downloadBlob(blob, `mididraft-batch-${Date.now()}.zip`);
    track('batch_download', {
      file_count: doneItems.length,
      plan_id: planId,
    });
  }, [items, planId]);

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    setStage('idle');
    setItems([]);
    setBatchProgress(null);
  }, []);

  const isRunning = stage === 'running';
  const hasResults = items.some((item) => item.status === 'done');
  const hasFailed = items.some((item) => item.status === 'failed');

  return (
    <div className={cn('space-y-5', className)}>
      {stage === 'idle' && items.length === 0 && (
        <>
          <BatchDropZone
            onFiles={handleFilesAdded}
            disabled={isRunning}
            maxFiles={limits.maxFiles}
            maxDurationMinutes={limits.maxDurationMinutes}
          />

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {limits.maxFiles} files max, {limits.maxDurationMinutes} minutes
              each. All processing happens in your browser.
            </p>
          </div>
        </>
      )}

      {items.length > 0 && (
        <div className="st-card space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-3">
            <div>
              <p className="font-medium">
                {items.length} file{items.length !== 1 ? 's' : ''} queued
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Max {limits.maxFiles} files, {limits.maxDurationMinutes} minutes
                each
              </p>
            </div>
            {!isRunning && (
              <Button
                type="button"
                variant="ghost"
                className="h-10 rounded-full"
                onClick={handleReset}
              >
                <IconX className="mr-1.5 size-4" />
                Clear all
              </Button>
            )}
          </div>

          <div className="px-5">
            <BatchFileList
              items={items}
              onRemove={handleRemoveItem}
              onRetry={handleRetryItem}
            />
          </div>

          {isRunning && batchProgress && (
            <div className="px-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-medium">
                  Converting {batchProgress.currentFileName}…
                </p>
                <span className="st-readout text-sm text-muted-foreground">
                  {batchProgress.completedFiles} / {batchProgress.totalFiles}{' '}
                  files
                </span>
              </div>
              <Progress
                value={batchProgress.overallProgress * 100}
                className="mt-3 h-2"
              />
              <p className="mt-3 text-sm text-muted-foreground">
                Running on your own machine. Nothing has been uploaded.
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-hairline px-5 py-4">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-full bg-surface-strong px-5"
              aria-expanded={settingsOpen}
              onClick={() => setSettingsOpen((value) => !value)}
              disabled={isRunning}
            >
              {settingsOpen ? 'Hide settings' : 'Adjust settings'}
              <IconChevronDown
                className={cn(
                  'ml-1.5 size-4 transition-transform',
                  settingsOpen && 'rotate-180'
                )}
              />
            </Button>

            {isRunning ? (
              <Button
                type="button"
                variant="outline"
                className="ml-auto h-12 rounded-full px-6"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            ) : (
              <>
                {hasFailed && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-full px-5"
                    onClick={handleStart}
                  >
                    <IconRefresh className="mr-1.5 size-4" />
                    Retry failed
                  </Button>
                )}
                <Button
                  type="button"
                  size="lg"
                  className="ml-auto h-12 rounded-full px-6 text-base"
                  onClick={handleStart}
                  disabled={items.length === 0}
                >
                  Convert all
                </Button>
                {hasResults && (
                  <Button
                    type="button"
                    size="lg"
                    className="h-12 rounded-full px-6 text-base"
                    onClick={handleDownloadZip}
                  >
                    <IconDownload className="mr-2 size-4" />
                    Download ZIP
                  </Button>
                )}
              </>
            )}
          </div>

          {settingsOpen && (
            <div className="border-t border-hairline px-5 py-6">
              <SettingsPanel
                detection={detection}
                onDetectionChange={setDetection}
                cleanup={cleanup}
                onCleanupChange={setCleanup}
                bpm={bpm}
                onBpmChange={setBpm}
                disabled={isRunning}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
