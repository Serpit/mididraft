import { productConfig } from '@/config/product';
import { getDb } from '@/db';
import { payment } from '@/db/app.schema';
import { user } from '@/db/auth.schema';
import { serverEnv } from '@/env/server';
import { sendPaymentNotification } from '@/notification';
import {
  WaffoPancake,
  WebhookEventType,
  verifyWebhook,
} from '@waffo/pancake-ts';
import type { WebhookEvent } from '@waffo/pancake-ts';
import { and, desc, eq, gt } from 'drizzle-orm';
import type {
  CheckoutResult,
  CreateCheckoutParams,
  PaymentProvider,
  PaymentStatus,
  PortalResult,
} from '../types';
import { PaymentScenes, PaymentTypes, PlanIntervals } from '../types';

/**
 * Waffo has no API for a pre-authenticated portal link yet; customers sign in
 * to this page with their purchase email (magic link).
 */
const CONSUMER_PORTAL_URL = 'https://pancake.waffo.ai/consumer/portal/login';

const DAY_MS = 24 * 60 * 60 * 1000;

/** The signature did not verify; the route answers 401 instead of retrying. */
export class WebhookSignatureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebhookSignatureError';
  }
}

type Event = WebhookEvent;

/**
 * Waffo Pancake (merchant of record) provider.
 *
 * Checkout: a hosted session per purchase, carrying `userId`, `planId` and
 * `priceId` in its metadata so the webhook can attribute the order.
 *
 * Webhooks write the shared `payment` table:
 * - Project Pass (`order.completed`) → one-time row, scene `pass`, access until
 *   `periodEnd`. Buying another pass while one is active extends it.
 * - Pro (`subscription.*`) → one subscription row keyed by the Waffo order ID,
 *   updated as the subscription renews, cancels or falls past due.
 *
 * Every handler is idempotent: Waffo retries failed deliveries, and a row is
 * keyed by the payment ID (`invoiceId`, unique) or the order ID.
 */
export class WaffoProvider implements PaymentProvider {
  private client: WaffoPancake;

  constructor() {
    const merchantId = serverEnv.WAFFO_MERCHANT_ID;
    const privateKey = serverEnv.WAFFO_PRIVATE_KEY;
    if (!merchantId || !privateKey) {
      throw new Error('WAFFO_MERCHANT_ID and WAFFO_PRIVATE_KEY are required.');
    }
    this.client = new WaffoPancake({ merchantId, privateKey });
  }

  getProviderName(): string {
    return 'waffo';
  }

  async createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult> {
    const remaining = params.launchOffer
      ? Math.floor((params.launchOffer.expiresAt - Date.now()) / 1000)
      : undefined;
    if (remaining !== undefined && remaining < 1) {
      throw new Error('Your launch offer has expired.');
    }
    const checkoutPriceId = params.launchOffer
      ? productConfig.waffo.products.projectPassLaunch
      : params.priceId;
    const session = await this.client.checkout.createSession(
      {
        productId: checkoutPriceId,
        currency: 'USD',
        buyerEmail: params.customerEmail,
        successUrl: params.successUrl,
        ...(params.launchOffer && {
          expiresInSeconds: Math.min(45 * 60, remaining!),
        }),
        metadata: {
          ...params.metadata,
          planId: params.planId,
          priceId: checkoutPriceId,
        },
      },
      params.launchOffer
        ? { idempotencyKey: params.launchOffer.idempotencyKey }
        : undefined
    );
    return { url: session.checkoutUrl, id: session.sessionId };
  }

  async createCustomerPortal(): Promise<PortalResult> {
    return { url: CONSUMER_PORTAL_URL };
  }

  async handleWebhookEvent(payload: string, signature: string): Promise<void> {
    let event: Event;
    try {
      event = verifyWebhook(payload, signature, {
        environment: serverEnv.WAFFO_MODE,
      });
    } catch (error) {
      throw new WebhookSignatureError(
        error instanceof Error ? error.message : String(error)
      );
    }

    // A test-mode purchase must never unlock production, and the merchant's
    // other stores are none of this site's business.
    if (event.mode !== serverEnv.WAFFO_MODE) {
      console.warn(`Waffo webhook: ignoring ${event.mode}-mode event`);
      return;
    }
    if (event.storeId !== productConfig.waffo.storeId) {
      console.warn(`Waffo webhook: ignoring event for store ${event.storeId}`);
      return;
    }

    console.log(`>> Waffo webhook ${event.eventType} ${event.id}`);
    switch (event.eventType) {
      case WebhookEventType.OrderCompleted:
        await this.onOrderCompleted(event);
        break;
      case WebhookEventType.SubscriptionActivated:
        await this.onSubscriptionActivated(event);
        break;
      case WebhookEventType.SubscriptionRenewed:
      case WebhookEventType.SubscriptionRecovered:
      case WebhookEventType.SubscriptionPlanChanged:
        await this.updateSubscription(event, { status: 'active' });
        break;
      case WebhookEventType.SubscriptionUncanceled:
        await this.updateSubscription(event, {
          status: 'active',
          cancelAtPeriodEnd: false,
        });
        break;
      case WebhookEventType.SubscriptionCanceling:
        await this.updateSubscription(event, { cancelAtPeriodEnd: true });
        break;
      case WebhookEventType.SubscriptionCanceled:
        await this.updateSubscription(event, { status: 'canceled' });
        break;
      case WebhookEventType.SubscriptionPastDue:
        await this.updateSubscription(event, { status: 'past_due' });
        break;
      case WebhookEventType.RefundSucceeded:
        await this.onRefundSucceeded(event);
        break;
      default:
        // payment_succeeded carries no period; renewed covers renewals.
        console.log(`<< Waffo webhook ${event.eventType}: nothing to do`);
    }
  }

  /** Project Pass purchase. */
  private async onOrderCompleted(event: Event): Promise<void> {
    const { data } = event;
    const priceId = this.resolvePriceId(event);
    if (
      priceId !== productConfig.waffo.products.projectPass &&
      priceId !== productConfig.waffo.products.projectPassLaunch
    ) {
      console.warn(`<< Waffo order for unknown product ${data.productName}`);
      return;
    }
    const userId = await this.resolveUserId(event);
    if (!userId) {
      console.error(`<< Waffo order ${data.orderId}: no matching user`);
      return;
    }

    const db = getDb();
    const now = new Date();
    const paidAt = new Date(event.timestamp);

    // Stack passes: a new one starts where an active one ends.
    const [active] = await db
      .select({ periodEnd: payment.periodEnd })
      .from(payment)
      .where(
        and(
          eq(payment.userId, userId),
          eq(payment.scene, PaymentScenes.PASS),
          eq(payment.paid, true),
          gt(payment.periodEnd, paidAt)
        )
      )
      .orderBy(desc(payment.periodEnd))
      .limit(1);
    const start = active?.periodEnd ?? paidAt;

    const inserted = await db
      .insert(payment)
      .values({
        id: crypto.randomUUID(),
        priceId,
        userId,
        customerId: data.buyerEmail,
        subscriptionId: null,
        sessionId: data.orderId,
        invoiceId: data.paymentId ?? event.eventId,
        type: PaymentTypes.ONE_TIME,
        scene: PaymentScenes.PASS,
        interval: null,
        status: 'completed',
        paid: true,
        periodStart: start,
        periodEnd: new Date(
          start.getTime() + productConfig.pricing.projectPass.days * DAY_MS
        ),
        cancelAtPeriodEnd: null,
        trialStart: null,
        trialEnd: null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing()
      .returning({ id: payment.id });

    if (inserted.length === 0) {
      console.log(`<< Waffo order ${data.orderId} already recorded`);
      return;
    }
    await this.setCustomerId(userId, data.buyerEmail);
    await this.notify(event, userId);
    console.log(`<< Waffo pass recorded for order ${data.orderId}`);
  }

  /** First Pro payment. */
  private async onSubscriptionActivated(event: Event): Promise<void> {
    const { data } = event;
    const priceId = this.resolvePriceId(event);
    if (priceId !== productConfig.waffo.products.proMonthly) {
      console.warn(`<< Waffo subscription for unknown product ${priceId}`);
      return;
    }
    const userId = await this.resolveUserId(event);
    if (!userId) {
      console.error(`<< Waffo subscription ${data.orderId}: no matching user`);
      return;
    }

    const db = getDb();
    const now = new Date();
    const [existing] = await db
      .select({ id: payment.id })
      .from(payment)
      .where(eq(payment.subscriptionId, data.orderId))
      .limit(1);
    if (existing) {
      await this.updateSubscription(event, { status: 'active' });
      return;
    }

    await db
      .insert(payment)
      .values({
        id: crypto.randomUUID(),
        priceId,
        userId,
        customerId: data.buyerEmail,
        subscriptionId: data.orderId,
        sessionId: data.orderId,
        invoiceId: data.paymentId ?? event.eventId,
        type: PaymentTypes.SUBSCRIPTION,
        scene: PaymentScenes.SUBSCRIPTION,
        interval: PlanIntervals.MONTH,
        status: 'active',
        paid: true,
        periodStart: parseDate(data.currentPeriodStart) ?? now,
        periodEnd: parseDate(data.currentPeriodEnd),
        cancelAtPeriodEnd: false,
        trialStart: null,
        trialEnd: null,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoNothing();

    await this.setCustomerId(userId, data.buyerEmail);
    await this.notify(event, userId);
    console.log(`<< Waffo subscription ${data.orderId} activated`);
  }

  private async updateSubscription(
    event: Event,
    changes: { status?: PaymentStatus; cancelAtPeriodEnd?: boolean }
  ): Promise<void> {
    const { data } = event;
    const db = getDb();
    const updated = await db
      .update(payment)
      .set({
        ...changes,
        ...(data.currentPeriodStart && {
          periodStart: parseDate(data.currentPeriodStart),
        }),
        ...(data.currentPeriodEnd && {
          periodEnd: parseDate(data.currentPeriodEnd),
        }),
        updatedAt: new Date(),
      })
      .where(eq(payment.subscriptionId, data.orderId))
      .returning({ id: payment.id });

    if (updated.length === 0) {
      // The activation has not landed yet. Throwing makes Waffo retry later.
      throw new Error(
        `Waffo ${event.eventType}: subscription ${data.orderId} not recorded yet`
      );
    }
    console.log(`<< Waffo subscription ${data.orderId} updated`);
  }

  /** A refund revokes what the order granted. */
  private async onRefundSucceeded(event: Event): Promise<void> {
    const { data } = event;
    const db = getDb();
    const updated = await db
      .update(payment)
      .set({ status: 'canceled', paid: false, updatedAt: new Date() })
      .where(eq(payment.sessionId, data.orderId))
      .returning({ id: payment.id });
    console.log(
      `<< Waffo refund for order ${data.orderId}: ${updated.length} record(s) revoked`
    );
  }

  /** Checkout metadata first; the product's `sku` metadata as a fallback. */
  private resolvePriceId(event: Event): string | undefined {
    const fromOrder = event.data.orderMetadata?.priceId;
    if (fromOrder) return fromOrder;
    const sku = event.data.productMetadata?.sku;
    const { products } = productConfig.waffo;
    if (sku === 'project-pass') return products.projectPass;
    if (sku === 'project-pass-launch') return products.projectPassLaunch;
    if (sku === 'pro-monthly') return products.proMonthly;
    return undefined;
  }

  /** Checkout metadata first; the buyer's email as a fallback. */
  private async resolveUserId(event: Event): Promise<string | undefined> {
    const fromOrder = event.data.orderMetadata?.userId;
    if (fromOrder) return fromOrder;
    const [row] = await getDb()
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, event.data.buyerEmail))
      .limit(1);
    return row?.id;
  }

  /** Waffo identifies customers by email; the portal signs them in with it. */
  private async setCustomerId(userId: string, email: string): Promise<void> {
    await getDb()
      .update(user)
      .set({ customerId: email, updatedAt: new Date() })
      .where(eq(user.id, userId));
  }

  private async notify(event: Event, userId: string): Promise<void> {
    try {
      await sendPaymentNotification({
        sessionId: event.data.orderId,
        customerId: event.data.buyerEmail,
        userName: event.data.orderMetadata?.userName ?? userId,
        amount: Number(event.data.chargedAmount ?? event.data.amount ?? 0),
      });
    } catch (error) {
      console.error('Waffo payment notification failed:', error);
    }
  }
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
