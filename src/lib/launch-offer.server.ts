import { getCookie, setCookie } from '@tanstack/react-start/server';
import { and, eq, isNotNull, or, sql } from 'drizzle-orm';
import { productConfig } from '@/config/product';
import { websiteConfig } from '@/config/website';
import { getDb } from '@/db';
import { launchOffer, payment } from '@/db/app.schema';

const campaign = productConfig.launchOffer;
const COOKIE = 'mididraft_launch_visitor';

export function launchOfferEnabled() {
  return (
    campaign.enabled &&
    productConfig.features.paidPlans &&
    websiteConfig.payment?.enable &&
    websiteConfig.payment.provider === 'waffo'
  );
}

export async function hasPurchased(userId: string) {
  const [row] = await getDb()
    .select({ id: payment.id })
    .from(payment)
    .where(
      and(
        eq(payment.userId, userId),
        or(eq(payment.paid, true), isNotNull(payment.periodStart))
      )
    )
    .limit(1);
  return !!row;
}

export function accountOfferId(userId: string) {
  return `${campaign.campaign}:user:${userId}`;
}

/** Anonymous identity is an opaque HttpOnly cookie; deadlines live in D1.
 * Once signed in, the earliest deadline is permanently attached to the account.
 * Clearing anonymous cookies cannot be prevented without fingerprinting.
 */
export async function resolveLaunchOffer(userId?: string, start = false) {
  if (!launchOfferEnabled() || (userId && (await hasPurchased(userId)))) {
    return null;
  }
  const db = getDb();
  let visitorId = getCookie(COOKIE);
  if (!visitorId || !/^[0-9a-f-]{36}$/.test(visitorId)) {
    if (!start) return null;
    visitorId = crypto.randomUUID();
    setCookie(COOKIE, visitorId, {
      httpOnly: true,
      secure: import.meta.env?.PROD ?? true,
      sameSite: 'lax',
      path: '/',
      maxAge: 365 * 24 * 60 * 60,
    });
  }
  const id = `${campaign.campaign}:visitor:${visitorId}`;
  if (start) {
    await db
      .insert(launchOffer)
      .values({
        id,
        expiresAt: Date.now() + campaign.durationHours * 60 * 60 * 1000,
      })
      .onConflictDoNothing();
  }
  const [visitor] = await db
    .select()
    .from(launchOffer)
    .where(eq(launchOffer.id, id))
    .limit(1);
  if (!visitor) return null;
  if (!userId) return visitor;

  const accountId = accountOfferId(userId);
  await db
    .insert(launchOffer)
    .values({
      id: accountId,
      expiresAt: visitor.expiresAt,
    })
    .onConflictDoUpdate({
      target: launchOffer.id,
      set: {
        expiresAt: sql`min(${launchOffer.expiresAt}, ${visitor.expiresAt})`,
      },
    });
  const [account] = await db
    .select()
    .from(launchOffer)
    .where(eq(launchOffer.id, accountId))
    .limit(1);
  // Logging out on this browser must not restore a later visitor deadline.
  await db
    .update(launchOffer)
    .set({ expiresAt: account.expiresAt })
    .where(eq(launchOffer.id, id));
  return account;
}
