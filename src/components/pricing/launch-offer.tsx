import { IconArrowRight, IconCheck, IconClock } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { getLaunchOffer } from '@/api/launch-offer';
import { authClient } from '@/auth/client';
import { CheckoutButton } from '@/components/pricing/create-checkout-button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { productConfig } from '@/config/product';
import { websiteConfig } from '@/config/website';
import { track } from '@/lib/analytics/events';
import { fireConfetti } from '@/lib/confetti';
import { offerClock, offerSecondsLeft } from '@/lib/launch-offer';
import { Routes } from '@/lib/routes';

const campaign = productConfig.launchOffer;
const PRICE = `$${campaign.amountUsd.toFixed(2)}`;
const DISPLAY_KEY = `mididraft:${campaign.campaign}:shown`;
const enabled =
  campaign.enabled &&
  productConfig.features.paidPlans &&
  websiteConfig.payment?.enable &&
  websiteConfig.payment.provider === 'waffo';
const OfferContext = createContext({
  active: false,
  seconds: 0,
  showOffer: () => {},
});
export const useLaunchOffer = () => useContext(OfferContext);

// Storage failures must never interrupt the converter or trigger repeated dialogs.
let shownInMemory = '';
function alreadyShown(today: string) {
  try {
    return localStorage.getItem(DISPLAY_KEY) === today;
  } catch {
    return shownInMemory === today;
  }
}
function markShown(today: string) {
  shownInMemory = today;
  try {
    localStorage.setItem(DISPLAY_KEY, today);
  } catch {
    /* optional storage */
  }
}

export function LaunchOfferProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const seen = useRef(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), 2000);
    return () => window.clearTimeout(timer);
  }, []);
  const query = useQuery({
    queryKey: ['launch-offer', session?.user.id ?? 'visitor'],
    queryFn: () => getLaunchOffer(),
    enabled: !!enabled && ready && !isPending,
    refetchInterval: 60_000,
    staleTime: 0,
    retry: false,
  });
  useEffect(() => {
    const data = query.data;
    if (!data?.expiresAt) {
      setSeconds(0);
      return;
    }
    const anchor = performance.now();
    const tick = () =>
      setSeconds(
        offerSecondsLeft(
          data.expiresAt!,
          data.serverNow + performance.now() - anchor
        )
      );
    tick();
    const timer = window.setInterval(tick, 250);
    return () => window.clearInterval(timer);
  }, [query.data]);
  const active =
    !!enabled &&
    !isPending &&
    !query.isError &&
    !!query.data?.expiresAt &&
    seconds > 0;
  useEffect(() => {
    if (!active) return;
    if (!seen.current) {
      track('launch_offer_view', { surface: 'banner' });
      seen.current = true;
    }
    const today = new Date().toLocaleDateString('en-CA');
    if (!alreadyShown(today)) {
      markShown(today);
      setOpen(true);
      track('launch_offer_view', { surface: 'popup' });
    }
  }, [active]);
  const context = useMemo(
    () => ({
      active,
      seconds,
      showOffer: () => {
        setOpen(true);
        track('launch_offer_view', { surface: 'popup' });
      },
    }),
    [active, seconds]
  );
  const celebrate = open && active;
  useEffect(() => {
    if (!celebrate) return;
    // Wait for the dialog's zoom-in so the burst lands behind a settled card.
    const timer = window.setTimeout(() => fireConfetti(), 220);
    return () => window.clearTimeout(timer);
  }, [celebrate]);
  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (!next) track('launch_offer_dismiss');
  };
  return (
    <OfferContext.Provider value={context}>
      {children}
      <Dialog
        open={open && !!query.data?.expiresAt && !query.isError}
        onOpenChange={changeOpen}
      >
        <DialogContent className="launch-offer-dialog sm:max-w-[460px]">
          <div className="launch-offer-eyebrow">
            YOUR FIRST PROJECT, FOR LESS
          </div>
          <DialogTitle className="launch-offer-title">
            More ideas.
            <br />
            Less busywork.
          </DialogTitle>
          <DialogDescription className="launch-offer-description">
            Get {productConfig.pricing.projectPass.days} days of batch
            conversion to turn your audio clips into editable MIDI drafts.
          </DialogDescription>
          <div
            className={`launch-offer-price ${active ? 'is-celebrating' : ''}`}
          >
            <strong>{active ? PRICE : '$7'}</strong>
            <span>
              USD
              <br />
              {active ? 'Standard price $7' : 'Standard price'}
            </span>
            {active && <span className="launch-offer-saving">Save $2.10</span>}
          </div>
          <ul className="launch-offer-benefits">
            <li>
              <IconCheck size={17} aria-hidden="true" />
              Batch up to 10 files at a time
            </li>
            <li>
              <IconCheck size={17} aria-hidden="true" />
              Apply cleanup presets across your batch
            </li>
            <li>
              <IconCheck size={17} aria-hidden="true" />
              Audio stays in your browser
            </li>
          </ul>
          {active ? (
            <div
              className={`launch-offer-countdown ${seconds < 3600 ? 'is-urgent' : ''}`}
            >
              <p>
                <span className="launch-offer-dot" />
                {seconds < 3600
                  ? `Last hour for your ${PRICE} offer`
                  : 'Your offer expires in'}
              </p>
              <div
                className="launch-offer-digits"
                role="timer"
                aria-label="Offer time remaining"
                aria-live="off"
              >
                {offerClock(seconds).map((value, i) => (
                  <div key={['hours', 'minutes', 'seconds'][i]}>
                    <strong>{value}</strong>
                    <span>{['HOURS', 'MINUTES', 'SECONDS'][i]}</span>
                  </div>
                ))}
              </div>
              <small>
                Buy within this time. Your 7 days start after payment.
              </small>
            </div>
          ) : (
            <output className="launch-offer-expired">
              Your launch offer has ended. The Project Pass is available for $7.
            </output>
          )}
          <LaunchOfferAction active={active} />
          <p className="launch-offer-terms">
            One payment. No subscription. Tax calculated at checkout.
          </p>
          <button
            type="button"
            className="launch-offer-skip"
            onClick={() => changeOpen(false)}
          >
            Continue free
          </button>
        </DialogContent>
      </Dialog>
    </OfferContext.Provider>
  );
}

function LaunchOfferAction({ active }: { active: boolean }) {
  const { data: session } = authClient.useSession();
  const label = active ? `Get 7 days for ${PRICE}` : 'View standard pricing';
  if (!active || !session?.user) {
    return (
      <a
        className="launch-offer-cta"
        href={
          active
            ? `${Routes.Login}?callbackUrl=${encodeURIComponent(Routes.Pricing)}`
            : Routes.Pricing
        }
        onClick={() => {
          if (active) track('launch_offer_click', { surface: 'popup' });
        }}
      >
        {label}
        <IconArrowRight size={18} aria-hidden="true" />
      </a>
    );
  }
  return (
    <CheckoutButton
      planId="pass"
      priceId={productConfig.waffo.products.projectPass}
      launchOffer
      className="launch-offer-cta"
    >
      {label}
      <IconArrowRight size={18} aria-hidden="true" />
    </CheckoutButton>
  );
}

export function LaunchOfferBanner() {
  const { active, seconds, showOffer } = useLaunchOffer();
  return (
    <>
      {' '}
      {active && (
        <div className="launch-offer-banner">
          <span>
            <strong>Launch offer</strong> · 7 days for {PRICE}
          </span>
          <span className="launch-offer-banner-clock">
            <IconClock size={15} aria-hidden="true" />
            <span>
              Ends in{' '}
              <span className="tabular-nums">
                {offerClock(seconds).join(':')}
              </span>
            </span>
          </span>
          <button
            type="button"
            onClick={() => {
              showOffer();
            }}
          >
            Get offer <IconArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      )}
    </>
  );
}
