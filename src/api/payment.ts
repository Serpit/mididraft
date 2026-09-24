import { getDb } from '@/db';
import { payment } from '@/db/app.schema';
import { user } from '@/db/auth.schema';
import { websiteConfig } from '@/config/website';
import { resolveUserPlan } from '@/lib/plan-resolver';
import { getBaseUrl } from '@/lib/urls';
import { authApiMiddleware } from '@/middlewares/auth-middleware';
import { createCheckout, createCustomerPortal } from '@/payment';
import { createServerFn } from '@tanstack/react-start';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const checkoutSchema = z.object({
  planId: z.string().min(1),
  priceId: z.string().min(1),
  successUrl: z.url().optional(),
  cancelUrl: z.url().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
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
    };

    const result = await createCheckout({
      planId,
      priceId,
      customerEmail: userRow.email,
      successUrl: success,
      cancelUrl: cancel,
      metadata: checkoutMetadata,
    });
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
