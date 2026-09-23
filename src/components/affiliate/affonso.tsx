import { ClientScript } from '@/components/shared/client-script';
import { websiteConfig } from '@/config/website';
import { clientEnv } from '@/env/client';

/**
 * Affonso (PromosKit) affiliate script
 * https://affonso.io
 */
export function AffonsoScript() {
  if (
    !websiteConfig.affiliates?.enable ||
    websiteConfig.affiliates.provider !== 'affonso'
  ) {
    return null;
  }
  const affiliateId = clientEnv.VITE_AFFILIATE_AFFONSO_ID;
  if (!affiliateId) return null;

  return (
    <ClientScript
      src="https://affonso.io/js/pixel.min.js"
      async
      dataAttributes={{ affonso: affiliateId, cookie_duration: '30' }}
    />
  );
}
