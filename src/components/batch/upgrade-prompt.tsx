import { authClient } from '@/auth/client';
import { CheckoutButton } from '@/components/pricing/create-checkout-button';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { productConfig } from '@/config/product';
import { websiteConfig } from '@/config/website';
import { Routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { IconLock } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';

interface UpgradePromptProps {
  /** Which plan to push: 'pass' for Project Pass, 'pro' for Pro. */
  planId: 'pass' | 'pro';
  title: string;
  description: string;
  className?: string;
}

const { pricing } = productConfig;
const onSale =
  productConfig.features.paidPlans && !!websiteConfig.payment?.enable;

export function UpgradePrompt({
  planId,
  title,
  description,
  className,
}: UpgradePromptProps) {
  const { data: session, isPending } = authClient.useSession();
  const priceId =
    websiteConfig.payment?.price?.plans[planId]?.prices[0]?.priceId ?? '';

  const planName = planId === 'pass' ? 'Project Pass' : 'Pro';
  const planPrice =
    planId === 'pass'
      ? `$${pricing.projectPass.amountUsd}`
      : `$${pricing.pro.amountUsd}`;
  const planCadence =
    planId === 'pass'
      ? `one-time, ${pricing.projectPass.days} days`
      : `per ${pricing.pro.interval}`;

  return (
    <div className={cn('st-card space-y-6 text-center', className)}>
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-surface-strong">
        <IconLock className="size-6 text-muted-foreground" />
      </div>

      <div>
        <h2 className="text-xl font-medium tracking-tight">{title}</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="mx-auto max-w-sm rounded-lg border bg-surface p-5">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-2xl font-bold">{planName}</span>
          <span className="text-lg font-semibold">{planPrice}</span>
          <span className="text-sm text-muted-foreground">{planCadence}</span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3">
        {isPending ? (
          <Button disabled className="h-11 rounded-full px-6">
            Loading…
          </Button>
        ) : !session?.user ? (
          <a
            href={`${Routes.Login}?callbackUrl=${encodeURIComponent(Routes.BatchAudioToMidi)}`}
            className={cn(buttonVariants(), 'h-11 rounded-full px-6')}
          >
            Sign in to upgrade
          </a>
        ) : onSale ? (
          <CheckoutButton
            planId={planId}
            priceId={priceId}
            className="h-11 rounded-full px-6"
          >
            Upgrade to {planName}
          </CheckoutButton>
        ) : (
          <Button disabled className="h-11 rounded-full px-6">
            Not available yet
          </Button>
        )}

        <Link
          to={Routes.Pricing}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          See all plans
        </Link>
      </div>
    </div>
  );
}
