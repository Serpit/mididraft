import { getDb } from '@/db';
import { payment } from '@/db/app.schema';
import { findPlanByPriceId, getAllPricePlans } from '@/lib/price-plan';
import type {
  PaymentStatus,
  PlanInterval,
  PricePlan,
  Subscription,
} from '@/payment/types';
import { PaymentScenes, PaymentTypes } from '@/payment/types';
import { and, desc, eq, gt, or } from 'drizzle-orm';

export interface PlanResult {
  currentPlan: PricePlan | null;
  subscription: Subscription | null;
  pass: { expiresAt: Date } | null;
}

export async function resolveUserPlan(userId: string): Promise<PlanResult> {
  const db = getDb();
  const plans = getAllPricePlans();
  const freePlan = plans.find((p) => p.isFree && !p.disabled) ?? null;
  const lifetimePlanIds = plans.filter((p) => p.isLifetime).map((p) => p.id);

  const payments = await db
    .select({
      id: payment.id,
      priceId: payment.priceId,
      customerId: payment.customerId,
      type: payment.type,
      status: payment.status,
      scene: payment.scene,
      interval: payment.interval,
      periodStart: payment.periodStart,
      periodEnd: payment.periodEnd,
      cancelAtPeriodEnd: payment.cancelAtPeriodEnd,
      trialStart: payment.trialStart,
      trialEnd: payment.trialEnd,
      createdAt: payment.createdAt,
    })
    .from(payment)
    .where(
      and(
        eq(payment.paid, true),
        eq(payment.userId, userId),
        or(
          and(
            eq(payment.type, PaymentTypes.ONE_TIME),
            eq(payment.scene, PaymentScenes.LIFETIME),
            eq(payment.status, 'completed')
          ),
          and(
            eq(payment.type, PaymentTypes.ONE_TIME),
            eq(payment.scene, PaymentScenes.PASS),
            eq(payment.status, 'completed'),
            gt(payment.periodEnd, new Date())
          ),
          and(
            eq(payment.type, PaymentTypes.SUBSCRIPTION),
            or(eq(payment.status, 'active'), eq(payment.status, 'trialing'))
          )
        )
      )
    )
    .orderBy(desc(payment.createdAt));

  let userLifetimePlan: PricePlan | null = null;
  let activeSubscription: Subscription | null = null;
  let passPlan: PricePlan | null = null;
  let passExpiresAt: Date | null = null;

  for (const rec of payments) {
    if (
      rec.type === PaymentTypes.ONE_TIME &&
      rec.scene === PaymentScenes.LIFETIME &&
      rec.status === 'completed' &&
      !userLifetimePlan
    ) {
      const plan = findPlanByPriceId(rec.priceId);
      if (plan && lifetimePlanIds.includes(plan.id)) {
        userLifetimePlan = plan as PricePlan;
      }
    }
    if (rec.scene === PaymentScenes.PASS && rec.periodEnd) {
      if (!passExpiresAt || rec.periodEnd > passExpiresAt) {
        passExpiresAt = rec.periodEnd;
      }
      passPlan ??= (findPlanByPriceId(rec.priceId) as PricePlan) ?? null;
    }
    if (
      !userLifetimePlan &&
      rec.type === PaymentTypes.SUBSCRIPTION &&
      (rec.status === 'active' || rec.status === 'trialing') &&
      !activeSubscription
    ) {
      activeSubscription = {
        id: rec.id,
        priceId: rec.priceId,
        customerId: rec.customerId,
        status: rec.status as PaymentStatus,
        type: rec.type as 'subscription',
        interval: rec.interval as PlanInterval | undefined,
        currentPeriodStart: rec.periodStart ?? undefined,
        currentPeriodEnd: rec.periodEnd ?? undefined,
        cancelAtPeriodEnd: rec.cancelAtPeriodEnd ?? false,
        trialStartDate: rec.trialStart ?? undefined,
        trialEndDate: rec.trialEnd ?? undefined,
        createdAt: rec.createdAt,
      };
    }
  }

  const pass = passExpiresAt ? { expiresAt: passExpiresAt } : null;
  if (userLifetimePlan) {
    return { currentPlan: userLifetimePlan, subscription: null, pass };
  }
  if (activeSubscription) {
    const subscriptionPlan =
      plans.find((p) =>
        p.prices.some((pr) => pr.priceId === activeSubscription!.priceId)
      ) ?? null;
    return {
      currentPlan: subscriptionPlan as PricePlan | null,
      subscription: activeSubscription,
      pass,
    };
  }
  if (passPlan) {
    return { currentPlan: passPlan, subscription: null, pass };
  }
  return {
    currentPlan: freePlan as PricePlan | null,
    subscription: null,
    pass: null,
  };
}
