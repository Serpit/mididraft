# First-project launch offer

The offer is configured in `src/config/product.ts`: $4.90 for the existing
7-day Project Pass, with a personal 24-hour purchase window. Only the Waffo
provider supports it. Feature/payment switches still gate all promotion UI.

## Release

Apply `0005_fixed_sinister_six.sql` to the target D1 database **before** deploying
the application. The offer uses the dedicated Waffo product
`PROD_47SW5UfkLywWmBOHRjMspD`, published at $4.90. Publish catalog updates before
app deployment. The server selects this SKU only after checking eligibility;
client requests cannot select it directly. The normal Project Pass remains $7.
Both SKUs grant the same 7-day pass through the webhook and plan resolver.
Verify a sandbox checkout's displayed total and expiry before production release.

## Behavior

- Marketing pages start the offer after a 2-second delay and completed auth lookup.
- The popup appears once per local calendar day. The sticky navigation keeps an
  offer entry available after dismissal. Auth, account/admin and unmatched routes
  do not show it.
- The deadline is stored in D1 under a random HttpOnly visitor cookie. Refreshing,
  changing pages or editing local storage cannot extend it. Sign-in attaches the
  earliest deadline to the account, including across browsers.
- Anonymous cookie deletion cannot be prevented without fingerprinting. Once
  attached, the account deadline never restarts. Prior paid/refunded purchases
  exclude the account.
- The server validates the plan/product pair and eligibility at checkout. Expired
  offers produce an error, never an unexpected higher charge. Standard purchases
  explicitly retain the standard price.
- A live checkout is reused across clicks/tabs. Retrying after a network error uses
  the same payment-provider idempotency key. Checkout expires within 45 minutes
  and no later than the personal deadline.
- The timer uses server time. Its glow honors reduced-motion preferences. It stops
  at zero; an open popup then explains the standard price. The pricing page and
  banner revert at the same time.
- Analytics: `launch_offer_view` (banner/popup), `launch_offer_dismiss`,
  `launch_offer_click` (signed-out CTA), `launch_offer_checkout` (checkout attempt).
  These events contain no visitor identifiers. Successful payment remains
  authoritative in the payment database; do not count checkout attempts as revenue.

## Validation

Run `node --experimental-test-module-mocks --import tsx --test scripts/launch-offer.test.ts`.
The native Node tests use an in-memory SQLite database and a mocked payment
transport: deadline persistence, account binding, expired offers, paid/refunded
exclusion, retry idempotency, product validation and metadata tampering.

Browser QA covers desktop and 375/320px layouts, daily dismissal, reload
persistence, pricing synchronization, login callback and reduced motion.
No real payment is made by these checks.
