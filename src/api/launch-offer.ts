import { createServerFn } from '@tanstack/react-start';
import { getRequestHeaders } from '@tanstack/react-start/server';
import { auth } from '@/auth/auth';
import { resolveLaunchOffer } from '@/lib/launch-offer.server';

/** POST because the first visible impression starts the personal deadline. */
export const getLaunchOffer = createServerFn({ method: 'POST' }).handler(
  async () => {
    const session = await auth.api.getSession({ headers: getRequestHeaders() });
    const offer = await resolveLaunchOffer(session?.user.id, true);
    return {
      expiresAt: offer?.expiresAt ?? null,
      serverNow: Date.now(),
    };
  }
);
