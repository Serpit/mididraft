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

export function CheckoutButton({
  planId,
  priceId,
  metadata,
  variant = 'default',
  size = 'default',
  className,
  children,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);

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
          metadata:
            Object.keys(mergedMetadata).length > 0 ? mergedMetadata : undefined,
        },
      });
      if (result?.url) {
        window.location.href = result.url;
      } else {
        toast.error(m.failed);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error(m.failed);
    } finally {
      setIsLoading(false);
    }
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
