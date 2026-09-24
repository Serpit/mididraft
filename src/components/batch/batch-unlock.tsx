import { authClient } from '@/auth/client';
import { LoginForm } from '@/components/auth/login-form';
import { startCheckout } from '@/components/pricing/create-checkout-button';
import {
  LAUNCH_PRICE,
  useLaunchOffer,
} from '@/components/pricing/launch-offer';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { productConfig } from '@/config/product';
import { websiteConfig } from '@/config/website';
import { track } from '@/lib/analytics/events';
import { Routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { messages } from '@/messages';
import { IconCheck, IconLoader2, IconLock } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import { useCallback, useEffect, useRef, useState } from 'react';

const { pricing, batchLimits } = productConfig;
const STANDARD_PRICE = `$${pricing.projectPass.amountUsd}`;
const onSale =
  productConfig.features.paidPlans && !!websiteConfig.payment?.enable;

/** Where sign-in and checkout come back to, so the batch can be restored. */
function batchReturnPath(reason: 'login' | 'paid' | 'cancel') {
  return `${Routes.BatchAudioToMidi}?resume=${reason}`;
}

interface BatchUnlockProps {
  fileCount: number;
  /** Saves the queued files; runs before anything navigates away. */
  onBeforeLeave: () => Promise<void>;
  /** Back from checkout, waiting for the payment webhook. */
  confirming?: boolean;
  /** Payment still not confirmed after waiting. */
  confirmTimedOut?: boolean;
  /** Back from signing in with a redirect: go on to checkout by itself. */
  autoCheckout?: boolean;
  className?: string;
}

/**
 * The paywall on the batch page, shown in place of the Convert button.
 *
 * It sits under the visitor's own file list on purpose: what they are paying
 * for is right there. Sign-in opens in a dialog and flows straight into
 * checkout, and the files are saved first so neither redirect loses them.
 */
export function BatchUnlock({
  fileCount,
  onBeforeLeave,
  confirming,
  confirmTimedOut,
  autoCheckout,
  className,
}: BatchUnlockProps) {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const { active: offer } = useLaunchOffer();
  const [loginOpen, setLoginOpen] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const autoStarted = useRef(false);

  const price = offer ? LAUNCH_PRICE : STANDARD_PRICE;
  const priceId =
    websiteConfig.payment?.price?.plans.pass?.prices[0]?.priceId ?? '';

  const checkout = useCallback(async () => {
    setRedirecting(true);
    await onBeforeLeave();
    const origin = window.location.origin;
    const started = await startCheckout({
      planId: 'pass',
      priceId,
      launchOffer: offer || undefined,
      successUrl: origin + batchReturnPath('paid'),
      cancelUrl: origin + batchReturnPath('cancel'),
    });
    if (!started) setRedirecting(false);
  }, [offer, onBeforeLeave, priceId]);

  useEffect(() => {
    if (!autoCheckout || autoStarted.current) return;
    if (sessionPending || !session?.user || !onSale) return;
    autoStarted.current = true;
    void checkout();
  }, [autoCheckout, checkout, session, sessionPending]);

  const handleUnlock = async () => {
    const signedIn = !!session?.user;
    track('batch_unlock_click', {
      signed_in: signedIn ? 'yes' : 'no',
      offer: offer ? 'yes' : 'no',
      file_count: fileCount,
    });
    if (signedIn) {
      await checkout();
      return;
    }
    // Google sign-in leaves the page; keep the files for the way back.
    await onBeforeLeave();
    setLoginOpen(true);
  };

  const busy = redirecting || confirming || sessionPending;

  return (
    <div
      className={cn(
        'border-t border-hairline bg-surface-strong/40 px-5 py-5',
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="st-eyebrow flex items-center gap-2">
            <IconLock className="size-3.5" />
            Project Pass
          </p>
          <p className="mt-1.5 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight">
              {price}
            </span>
            {offer && (
              <span className="text-sm text-muted-foreground line-through">
                {STANDARD_PRICE}
              </span>
            )}
            <span className="text-sm text-muted-foreground">
              one payment · {pricing.projectPass.days} days
            </span>
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
            {[
              `Convert these ${fileCount} file${fileCount === 1 ? '' : 's'} in one run`,
              `Up to ${batchLimits.pass.maxFiles} files per run, as often as you like for ${pricing.projectPass.days} days`,
              'One set of settings, one ZIP with every .mid',
            ].map((line) => (
              <li key={line} className="flex gap-2">
                <IconCheck className="mt-0.5 size-4 shrink-0 text-foreground" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
          {confirming ? (
            <Button disabled size="lg" className="h-12 rounded-full px-6">
              <IconLoader2 className="mr-2 size-4 animate-spin" />
              Confirming your payment…
            </Button>
          ) : onSale ? (
            <Button
              type="button"
              size="lg"
              className="h-12 rounded-full px-6 text-base"
              disabled={busy || !priceId}
              onClick={handleUnlock}
            >
              {redirecting ? (
                <>
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                  Opening checkout…
                </>
              ) : (
                `Unlock and convert ${fileCount} — ${price}`
              )}
            </Button>
          ) : (
            <Button disabled size="lg" className="h-12 rounded-full px-6">
              Not available yet
            </Button>
          )}
          <Link
            to={Routes.Pricing}
            className="text-center text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground sm:text-right"
          >
            Compare plans
          </Link>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {confirmTimedOut
          ? 'Your payment has not shown up yet. Give it a minute and reload this page. Your files are kept on this device.'
          : 'No subscription. Your files stay on this device while you sign in and pay, and pick up here afterwards.'}
      </p>

      <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
        <DialogContent className="sm:max-w-100 overflow-hidden border-0 p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{messages.auth.login.signIn}</DialogTitle>
          </DialogHeader>
          <LoginForm
            callbackUrl={batchReturnPath('login')}
            onSuccess={() => {
              setLoginOpen(false);
              void checkout();
            }}
            className="border-0 shadow-none"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
