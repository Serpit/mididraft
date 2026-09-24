import { getDb } from '@/db';
import { launchOffer, payment } from '@/db/app.schema';
import { productConfig } from '@/config/product';
import { resolveLaunchOffer } from '@/lib/launch-offer.server';
import { user } from '@/db/auth.schema';
import { websiteConfig } from '@/config/website';
import { resolveUserPlan } from '@/lib/plan-resolver';
import { getBaseUrl } from '@/lib/urls';
import { authApiMiddleware } from '@/middlewares/auth-middleware';
import { createCheckout, createCustomerPortal } from '@/payment';
import { createServerFn } from '@tanstack/react-start';
import { and, eq, isNull, lte, or } from 'drizzle-orm';
import { z } from 'zod';

const checkoutSchema = z.object({
  planId: z.string().min(1),
  priceId: z.string().min(1),
  successUrl: z.url().optional(),
  cancelUrl: z.url().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  launchOffer: z.boolean().optional(),
});

export const createCheckoutSession = createServerFn({ method: 'POST' })
  .inputValidator(checkoutSchema)
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const db = getDb();
    const [userRow] = await db
      .select({ email: user.email, name: user.name })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (!userRow?.email) throw new Error('User email not found');
    const { planId, priceId, successUrl, cancelUrl, metadata } = data;
    const plan = websiteConfig.payment?.price?.plans[planId];
    if (
      !productConfig.features.paidPlans ||
      !websiteConfig.payment?.enable ||
      !plan ||
      plan.disabled ||
      plan.isFree ||
      !plan.prices.some((price) => price.priceId === priceId && !price.disabled)
    ) {
      throw new Error('This plan is not available.');
    }
    const offer = data.launchOffer ? await resolveLaunchOffer(userId) : null;
    if (
      data.launchOffer &&
      (planId !== 'pass' || !offer || offer.expiresAt <= Date.now())
    ) {
      throw new Error(
        'This offer has ended or is unavailable. Refresh to see current pricing.'
      );
    }
    if (
      offer?.checkoutUrl &&
      offer.checkoutId &&
      (offer.checkoutExpiresAt ?? 0) > Date.now()
    ) {
      return { url: offer.checkoutUrl, id: offer.checkoutId };
    }
    // One live discounted checkout per account, including simultaneous tabs.
    let checkoutExpiresAt = offer
      ? Math.min(offer.expiresAt, Date.now() + 45 * 60 * 1000)
      : undefined;
    if (offer) {
      const locked = await db
        .update(launchOffer)
        .set({
          checkoutExpiresAt,
          checkoutId: null,
          checkoutUrl: null,
        })
        .where(
          and(
            eq(launchOffer.id, offer.id),
            or(
              isNull(launchOffer.checkoutExpiresAt),
              lte(launchOffer.checkoutExpiresAt, Date.now())
            )
          )
        )
        .returning({ id: launchOffer.id });
      if (!locked.length) {
        const [pending] = await db
          .select()
          .from(launchOffer)
          .where(eq(launchOffer.id, offer.id))
          .limit(1);
        checkoutExpiresAt = pending?.checkoutExpiresAt ?? undefined;
        if (!checkoutExpiresAt || checkoutExpiresAt <= Date.now()) {
          throw new Error('Please try checkout again.');
        }
      }
    }
    const baseUrl = getBaseUrl();
    const isStripe = websiteConfig.payment?.provider === 'stripe';
    const cancel = cancelUrl ?? `${baseUrl}/settings/billing`;

    // For Stripe: {CHECKOUT_SESSION_ID} is replaced by Stripe on redirect,
    // then the Payment page polls by sessionId until the webhook writes the DB record.
    // Creem and Waffo do NOT replace URL placeholders and show their own
    // confirmation page, so redirect straight to billing.
    const success = !isStripe
      ? (successUrl ?? `${baseUrl}/settings/billing`)
      : (successUrl ??
        `${baseUrl}/settings/payment?session_id={CHECKOUT_SESSION_ID}&callback=/settings/billing`);
    const checkoutMetadata = {
      ...metadata,
      userId,
      userName: userRow.name ?? '',
      ...(offer && { campaign: productConfig.launchOffer.campaign }),
    };

    const result = await createCheckout({
      planId,
      priceId,
      customerEmail: userRow.email,
      successUrl: success,
      cancelUrl: cancel,
      metadata: checkoutMetadata,
      ...(offer && {
        launchOffer: {
          amountUsd: productConfig.launchOffer.amountUsd,
          expiresAt: checkoutExpiresAt!,
          idempotencyKey: `launch-${Array.from(
            new Uint8Array(
              await crypto.subtle.digest(
                'SHA-256',
                new TextEncoder().encode(`${offer.id}:${checkoutExpiresAt}`)
              )
            )
          )
            .map((byte) => byte.toString(16).padStart(2, '0'))
            .join('')}`,
        },
      }),
    });
    if (offer) {
      await db
        .update(launchOffer)
        .set({
          checkoutId: result.id,
          checkoutUrl: result.url,
        })
        .where(eq(launchOffer.id, offer.id));
    }
    return { url: result.url, id: result.id };
  });

const portalSchema = z.object({
  returnUrl: z.string().url().optional(),
  locale: z.string().optional(),
});

export const createCustomerPortalSession = createServerFn({ method: 'POST' })
  .inputValidator(portalSchema)
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const db = getDb();
    const [row] = await db
      .select({ customerId: user.customerId })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    if (!row?.customerId) {
      throw new Error('No customer found for user');
    }
    const baseUrl = getBaseUrl();
    const returnUrl = data.returnUrl ?? `${baseUrl}/settings/billing`;
    const result = await createCustomerPortal({
      customerId: row.customerId,
      returnUrl,
      locale: data.locale,
    });
    return { url: result.url };
  });

export const getCurrentPlan = createServerFn({ method: 'GET' })
  .middleware([authApiMiddleware])
  .handler(async ({ context }) => {
    return resolveUserPlan(context.userId);
  });

const checkCompletionSchema = z.object({ sessionId: z.string().min(1) });

/**
 * Check payment completion by Stripe session ID.
 * Used by Stripe flow where the session ID is embedded in the redirect URL.
 */
export const checkPaymentCompletion = createServerFn({ method: 'GET' })
  .inputValidator(checkCompletionSchema)
  .middleware([authApiMiddleware])
  .handler(async ({ data, context }) => {
    const db = getDb();
    const [record] = await db
      .select()
      .from(payment)
      .where(
        and(
          eq(payment.sessionId, data.sessionId),
          eq(payment.userId, context.userId)
        )
      )
      .limit(1);
    return { isPaid: !!record?.paid };
  });
