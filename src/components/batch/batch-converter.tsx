import { authClient } from '@/auth/client';
import { SettingsPanel } from '@/components/converter/settings-panel';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BatchDropZone } from '@/components/batch/batch-drop-zone';
import { BatchFileList } from '@/components/batch/batch-file-list';
import { BatchUnlock } from '@/components/batch/batch-unlock';
import {
  LAUNCH_PRICE,
  useLaunchOffer,
} from '@/components/pricing/launch-offer';
import { useCurrentPlan } from '@/hooks/use-payment';
import { productConfig } from '@/config/product';
import { ACCEPTED_EXTENSIONS } from '@/lib/midi/audio';
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
  type BatchSettings,
} from '@/lib/midi/batch';
import {
  saveBatchDraft,
  takeBatchDraft,
  takeBatchHandoff,
} from '@/lib/midi/batch-handoff';
import { createMidiZip } from '@/lib/midi/zip-export';
import { downloadBlob } from '@/lib/midi/export';
import { track } from '@/lib/analytics/events';
import type {
  AnalyticsEvents,
  BatchResumeReason,
} from '@/lib/analytics/events';
import { Routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import {
  IconChevronDown,
  IconDownload,
  IconPlus,
  IconRefresh,
  IconX,
} from '@tabler/icons-react';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';

type BatchStage = 'idle' | 'running' | 'done';
type PageEntry = AnalyticsEvents['batch_page_view']['entry'];

const { batchLimits, pricing } = productConfig;
const RETURN_REASONS = ['login', 'paid', 'cancel'] as const;
/** How often, and how long, to wait for the payment webhook after checkout. */
const CONFIRM_POLL_MS = 3000;
const CONFIRM_MAX_POLLS = 30;

function isAccepted(file: File) {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

/**
 * The batch page.
 *
 * Everyone can queue files and set things up; only the Convert button is
 * paid. A visitor without a pass sees the unlock panel under their own file
 * list instead, and the files survive the sign-in and checkout redirects.
 */
export function BatchConverter({ className }: { className?: string }) {
  const plan = useCurrentPlan();
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { active: offer, settled: offerSettled } = useLaunchOffer();
  const navigate = useNavigate();

  // A signed-out visitor has no plan to wait for.
  const planKnown = plan.isFetched || (!sessionPending && !session?.user);
  const locked = planKnown && !plan.hasBatchAccess;
  const limits = plan.planId === 'pro' ? batchLimits.pro : batchLimits.pass;

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

  /** Files over the per-run limit that were left out of the last add. */
  const [overflow, setOverflow] = useState(0);
  /** Names from a saved batch whose audio could not be kept. */
  const [missingNames, setMissingNames] = useState<string[]>([]);
  const [resume, setResume] = useState<BatchResumeReason | null>(null);
  const [confirmTimedOut, setConfirmTimedOut] = useState(false);
  const [entry, setEntry] = useState<PageEntry | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);
  const initRef = useRef(false);
  const viewSentRef = useRef(false);
  const paywallSentRef = useRef(false);
  const autoStartRef = useRef(false);

  const applySettings = useCallback((next: BatchSettings) => {
    setDetection(next.transcribe);
    setCleanup(next.cleanup);
    setBpm(next.bpm);
  }, []);

  const handleFilesAdded = useCallback(
    (files: File[]) => {
      const accepted = files.filter(isAccepted);
      const room = Math.max(0, limits.maxFiles - items.length);
      setOverflow(Math.max(0, accepted.length - room));
      const newItems = accepted.slice(0, room).map(createBatchItem);
      setItems((prev) => [...prev, ...newItems].slice(0, limits.maxFiles));
    },
    [items.length, limits]
  );

  /*
   * Pick up files handed over from the homepage, or a batch saved before
   * sign-in or checkout. Runs once; the ref also keeps React's dev-mode
   * double effect from reading the one-shot handoff twice.
   */
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const param = new URLSearchParams(window.location.search).get('resume');
    const returned = RETURN_REASONS.find((reason) => reason === param);
    if (param !== null) {
      void navigate({ to: Routes.BatchAudioToMidi, replace: true });
    }

    const handoff = takeBatchHandoff();
    if (handoff) {
      if (handoff.settings) applySettings(handoff.settings);
      handleFilesAdded(handoff.files);
      setEntry(handoff.entry);
      return;
    }

    void takeBatchDraft().then((draft) => {
      if (!draft) {
        if (returned) {
          track('batch_resume', { reason: returned, restored: 'none' });
        }
        setEntry(returned ? 'resume' : 'direct');
        return;
      }
      const reason = returned ?? 'return';
      applySettings(draft.settings);
      if (draft.files) {
        handleFilesAdded(draft.files);
      } else {
        setMissingNames(draft.names);
      }
      setResume(reason);
      setEntry('resume');
      track('batch_resume', {
        reason,
        restored: draft.files ? 'files' : 'names',
      });
    });
  }, [applySettings, handleFilesAdded, navigate]);

  useEffect(() => {
    if (!entry || !planKnown || viewSentRef.current) return;
    viewSentRef.current = true;
    track('batch_page_view', { entry, plan_id: plan.planId });
  }, [entry, planKnown, plan.planId]);

  useEffect(() => {
    if (!locked || items.length === 0 || paywallSentRef.current) return;
    if (!offerSettled) return;
    paywallSentRef.current = true;
    track('batch_paywall_view', {
      file_count: items.length,
      offer: offer ? 'yes' : 'no',
    });
  }, [locked, items.length, offer, offerSettled]);

  const saveDraft = useCallback(
    () =>
      saveBatchDraft(
        items.map((item) => item.file),
        { transcribe: detection, cleanup, bpm }
      ),
    [items, detection, cleanup, bpm]
  );

  /*
   * Back from checkout, the pass exists only once the payment webhook has
   * landed. Poll for it for a while; if it is still missing, keep the batch
   * so a reload a minute later picks it up again.
   */
  const confirming = resume === 'paid' && !plan.hasBatchAccess;
  const refetchPlan = plan.refetch;
  const saveDraftRef = useRef(saveDraft);
  saveDraftRef.current = saveDraft;
  useEffect(() => {
    if (!confirming || confirmTimedOut) return;
    let polls = 0;
    const timer = window.setInterval(() => {
      polls += 1;
      if (polls > CONFIRM_MAX_POLLS) {
        window.clearInterval(timer);
        setConfirmTimedOut(true);
        void saveDraftRef.current();
        window.history.replaceState(
          window.history.state,
          '',
          `${Routes.BatchAudioToMidi}?resume=paid`
        );
        return;
      }
      void refetchPlan();
    }, CONFIRM_POLL_MS);
    return () => window.clearInterval(timer);
  }, [confirming, confirmTimedOut, refetchPlan]);

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

    track('batch_start', { file_count: items.length, plan_id: plan.planId });
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
      plan_id: plan.planId,
    });
  }, [items, detection, cleanup, bpm, plan.planId]);

  // Paid and back with the files: carry on without another click.
  useEffect(() => {
    if (resume !== 'paid' || !plan.hasBatchAccess || autoStartRef.current) {
      return;
    }
    if (items.length === 0 || stage !== 'idle') return;
    autoStartRef.current = true;
    void handleStart();
  }, [resume, plan.hasBatchAccess, items.length, stage, handleStart]);

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
      plan_id: plan.planId,
    });
  }, [items, plan.planId]);

  const handleReset = useCallback(() => {
    abortRef.current?.abort();
    setStage('idle');
    setItems([]);
    setBatchProgress(null);
    setOverflow(0);
  }, []);

  const isRunning = stage === 'running';
  const hasResults = items.some((item) => item.status === 'done');
  const hasFailed = items.some((item) => item.status === 'failed');
  const stillMissing = missingNames.filter(
    (name) => !items.some((item) => item.file.name === name)
  );
  const price = offer ? LAUNCH_PRICE : `$${pricing.projectPass.amountUsd}`;

  return (
    <div className={cn('space-y-5', className)}>
      {stillMissing.length > 0 && (
        <div className="st-card flex gap-3 p-5">
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              Add {stillMissing.length === 1 ? 'this file' : 'these files'}{' '}
              again to pick up where you left off
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Your browser would not keep the audio while you were away. Your
              settings are back as you left them.
            </p>
            <ul className="st-readout mt-3 space-y-1 text-sm">
              {stillMissing.map((name) => (
                <li key={name} className="truncate">
                  {name}
                </li>
              ))}
            </ul>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0 rounded-full"
            aria-label="Dismiss"
            onClick={() => setMissingNames([])}
          >
            <IconX className="size-4" />
          </Button>
        </div>
      )}

      {resume === 'cancel' && items.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Checkout was cancelled. Your files are still here.
        </p>
      )}

      {overflow > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          {overflow} file{overflow === 1 ? ' was' : 's were'} left out: a run
          takes up to {limits.maxFiles} files.
        </p>
      )}

      {stage === 'idle' && items.length === 0 && (
        <>
          <BatchDropZone
            onFiles={handleFilesAdded}
            disabled={isRunning}
            maxFiles={limits.maxFiles}
            maxDurationMinutes={limits.maxDurationMinutes}
          />

          <p className="text-center text-sm text-muted-foreground">
            {locked
              ? `Batch is part of the Project Pass: ${price} for ${pricing.projectPass.days} days. Add your files and settings first; you pay only when you convert.`
              : `${limits.maxFiles} files max, ${limits.maxDurationMinutes} minutes each. All processing happens in your browser.`}
          </p>
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
              <div className="flex items-center gap-1">
                {items.length < limits.maxFiles && (
                  <>
                    <input
                      ref={addInputRef}
                      type="file"
                      accept={ACCEPTED_EXTENSIONS.join(',')}
                      multiple
                      className="sr-only"
                      onChange={(event) => {
                        handleFilesAdded(Array.from(event.target.files ?? []));
                        event.target.value = '';
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 rounded-full"
                      onClick={() => addInputRef.current?.click()}
                    >
                      <IconPlus className="mr-1.5 size-4" />
                      Add files
                    </Button>
                  </>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 rounded-full"
                  onClick={handleReset}
                >
                  <IconX className="mr-1.5 size-4" />
                  Clear all
                </Button>
              </div>
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

            {locked ? null : isRunning ? (
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
                  disabled={items.length === 0 || !planKnown}
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

          {locked && (
            <BatchUnlock
              className="rounded-b-2xl"
              fileCount={items.length}
              onBeforeLeave={saveDraft}
              confirming={confirming && !confirmTimedOut}
              confirmTimedOut={confirmTimedOut}
              autoCheckout={resume === 'login' && missingNames.length === 0}
            />
          )}
        </div>
      )}
    </div>
  );
}
