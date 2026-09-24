import { track } from '@/lib/analytics/events';
import { createCheckoutSession } from '@/api/payment';
import { Button } from '@/components/ui/button';
import { websiteConfig } from '@/config/website';
import { cn } from '@/lib/utils';
import { messages } from '@/messages';
import { IconLoader2 } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

const m = messages.pricing.checkout;

interface CheckoutButtonProps {
  planId: string;
  priceId: string;
  metadata?: Record<string, string>;
  launchOffer?: boolean;
  variant?:
    | 'default'
    | 'outline'
    | 'destructive'
    | 'secondary'
    | 'ghost'
    | 'link'
    | null;
  size?: 'default' | 'sm' | 'lg' | 'icon' | null;
  className?: string;
  children?: React.ReactNode;
}

interface StartCheckoutOptions {
  planId: string;
  priceId: string;
  metadata?: Record<string, string>;
  launchOffer?: boolean;
  /** Where the provider sends the buyer back to. Defaults to billing. */
  successUrl?: string;
  cancelUrl?: string;
}

/**
 * Creates a checkout session and navigates to it. Resolves to false (after
 * showing a toast) when the session could not be created, so callers can
 * put their UI back.
 */
export async function startCheckout({
  planId,
  priceId,
  metadata,
  launchOffer,
  successUrl,
  cancelUrl,
}: StartCheckoutOptions): Promise<boolean> {
  try {
    if (launchOffer) track('launch_offer_checkout');

    // merge metadata with existing metadata
    const mergedMetadata = metadata ? { ...metadata } : {};

    // add promotekit_referral to metadata if enabled promotekit affiliate
    if (
      websiteConfig.affiliates?.enable &&
      websiteConfig.affiliates.provider === 'promotekit'
    ) {
      const promotekitReferral =
        typeof window !== 'undefined'
          ? (window as { promotekit_referral?: string }).promotekit_referral
          : undefined;
      if (promotekitReferral) {
        console.log(
          'create checkout button, promotekitReferral:',
          promotekitReferral
        );
        mergedMetadata.promotekit_referral = promotekitReferral;
      }
    }

    // add affonso_referral to metadata if enabled affonso affiliate
    if (
      websiteConfig.affiliates?.enable &&
      websiteConfig.affiliates.provider === 'affonso'
    ) {
      const affonsoReferral =
        typeof document !== 'undefined'
          ? (() => {
              const match = document.cookie.match(
                /(?:^|; )affonso_referral=([^;]*)/
              );
              return match ? decodeURIComponent(match[1]) : null;
            })()
          : null;
      if (affonsoReferral) {
        console.log(
          'create checkout button, affonsoReferral:',
          affonsoReferral
        );
        mergedMetadata.affonso_referral = affonsoReferral;
      }
    }

    const result = await createCheckoutSession({
      data: {
        planId,
        priceId,
        launchOffer,
        successUrl,
        cancelUrl,
        metadata:
          Object.keys(mergedMetadata).length > 0 ? mergedMetadata : undefined,
      },
    });
    if (result?.url) {
      window.location.href = result.url;
      return true;
    }
    toast.error(m.failed);
    return false;
  } catch (err) {
    console.error('Checkout error:', err);
    toast.error(err instanceof Error ? err.message : m.failed);
    return false;
  }
}

export function CheckoutButton({
  planId,
  priceId,
  metadata,
  launchOffer,
  variant = 'default',
  size = 'default',
  className,
  children,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);
    await startCheckout({ planId, priceId, metadata, launchOffer });
    setIsLoading(false);
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(className)}
      onClick={handleClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <IconLoader2 className="mr-2 size-4 animate-spin" />
          {m.loading}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
