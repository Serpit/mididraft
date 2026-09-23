import { FaqSection } from '@/components/home/faq';
import Container from '@/components/layout/container';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { productConfig } from '@/config/product';
import { websiteConfig } from '@/config/website';
import { Routes } from '@/lib/routes';
import { seo } from '@/lib/seo';
import { cn } from '@/lib/utils';
import { messages } from '@/messages';
import { IconCheck, IconMinus } from '@tabler/icons-react';
import { Link, createFileRoute } from '@tanstack/react-router';

const m = messages.pricing;
const { pricing, features } = productConfig;

export const Route = createFileRoute('/(pages)/pricing')({
  head: () =>
    seo('/pricing', {
      title: `Pricing — free audio to MIDI, paid batch workflow | ${websiteConfig.metadata?.name}`,
      description: m.description,
    }),
  component: PricingPage,
});

interface Plan {
  id: string;
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: readonly string[];
  limits: readonly string[];
  available: boolean;
  popular?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: m.plans.free.name,
    price: '$0',
    cadence: 'always',
    description: m.plans.free.description,
    features: m.plans.free.features,
    limits: m.plans.free.limits,
    available: true,
  },
  {
    id: 'pass',
    name: m.plans.pro.name,
    price: `$${pricing.projectPass.amountUsd}`,
    cadence: `one-time, ${pricing.projectPass.days} days`,
    description: m.plans.pro.description,
    features: m.plans.pro.features,
    limits: m.plans.pro.limits,
    available: features.paidPlans,
    popular: true,
  },
  {
    id: 'pro',
    name: m.plans.lifetime.name,
    price: `$${pricing.pro.amountUsd}`,
    cadence: `per ${pricing.pro.interval}`,
    description: m.plans.lifetime.description,
    features: m.plans.lifetime.features,
    limits: m.plans.lifetime.limits,
    available: features.paidPlans,
  },
];

function PricingPage() {
  return (
    <Container className="px-4 py-16">
      <div className="mx-auto max-w-3xl space-y-4 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {m.title}
        </h1>
        <p className="text-lg text-muted-foreground">{m.description}</p>
      </div>

      <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={cn(
              'flex flex-col rounded-xl border bg-card p-6',
              plan.popular && plan.available && 'border-primary shadow-sm'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">{plan.name}</h2>
              {!plan.available && <Badge variant="outline">Not on sale</Badge>}
            </div>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-3xl font-bold tabular-nums">
                {plan.price}
              </span>
              <span className="text-sm text-muted-foreground">
                {plan.cadence}
              </span>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {plan.description}
            </p>

            <ul className="mt-6 flex-1 space-y-2.5 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-2">
                  <IconCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{feature}</span>
                </li>
              ))}
              {plan.limits.map((limit) => (
                <li key={limit} className="flex gap-2 text-muted-foreground">
                  <IconMinus className="mt-0.5 size-4 shrink-0" />
                  <span>{limit}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              {plan.id === 'free' ? (
                <Link
                  to={Routes.Root}
                  className={cn(buttonVariants(), 'w-full')}
                >
                  Convert a file now
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className={cn(
                    buttonVariants({ variant: 'outline' }),
                    'w-full cursor-not-allowed opacity-60'
                  )}
                >
                  Not available yet
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {!features.paidPlans && (
        <div className="mx-auto mt-10 max-w-3xl rounded-xl border border-dashed bg-muted/30 p-6">
          <h2 className="font-semibold">Why the paid plans are not on sale</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The batch and preset features behind them are not built. Charging
            for them now would mean taking money for something that does not
            exist, so the buttons are disabled and no checkout is wired up.
            These prices are the ones being tested, not validated optimal prices
            — they may change before anything goes on sale.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            The free converter is finished and is not a trial. It does the whole
            job, including the MIDI download, and it will stay free.
          </p>
        </div>
      )}

      <div className="mx-auto mt-10 max-w-3xl space-y-6">
        <div>
          <h2 className="font-semibold">
            What you would actually be paying for
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Time on repetitive work, and nothing else. If you convert one clip
            now and then, the free tier is the right answer and you should use
            it. The paid tiers exist for the case where you have ten loops to
            convert, clean the same way, name consistently and hand to a project
            — and only if doing that in a batch is measurably faster than doing
            it one at a time.
          </p>
        </div>
        <div>
          <h2 className="font-semibold">Refunds and cancellation</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            When the paid plans do open: the Project Pass is a single payment
            that does not renew, the Pro plan can be cancelled from your account
            page at any time, and a refund can be requested within 7 days of a
            first purchase. Prices are in US dollars; any tax is shown at
            checkout before you pay.
          </p>
        </div>
      </div>

      <FaqSection />
    </Container>
  );
}
