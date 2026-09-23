import { createCustomerPortalSession } from '@/api/payment';
import { Button } from '@/components/ui/button';
import { messages } from '@/messages';
import { IconLoader2 } from '@tabler/icons-react';
import { useState } from 'react';
import { toast } from 'sonner';

const m = messages.pricing.customerPortal;

interface CustomerPortalButtonProps {
  userId: string;
  returnUrl?: string;
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

export function CustomerPortalButton({
  returnUrl,
  variant = 'default',
  size = 'default',
  className,
  children,
}: Omit<CustomerPortalButtonProps, 'userId'> & { userId?: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    try {
      setIsLoading(true);
      const result = await createCustomerPortalSession({
        data: { returnUrl },
      });
      if (result?.url) {
        window.location.href = result.url;
      } else {
        toast.error(m.failed);
      }
    } catch (err) {
      console.error('Customer portal error:', err);
      toast.error(m.failed);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
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
