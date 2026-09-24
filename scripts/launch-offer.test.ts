/** Run: node --experimental-test-module-mocks --import tsx --test scripts/launch-offer.test.ts */
import assert from 'node:assert/strict';
import { mock, test } from 'node:test';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { productConfig } from '../src/config/product';
import { offerClock, offerSecondsLeft } from '../src/lib/launch-offer';

const client = createClient({ url: ':memory:' });
const db = drizzle(client);
const cookies = new Map<string, string>();
await client.execute(`CREATE TABLE launch_offer (
  id TEXT PRIMARY KEY, expires_at INTEGER NOT NULL,
  checkout_id TEXT, checkout_url TEXT, checkout_expires_at INTEGER
)`);
await client.execute(`CREATE TABLE payment (
  id TEXT PRIMARY KEY, user_id TEXT, paid INTEGER, period_start INTEGER
)`);
mock.module('../src/db/index.ts', { namedExports: { getDb: () => db } });
mock.module('../src/config/website.ts', {
  namedExports: {
    websiteConfig: {
      payment: {
        enable: true,
        provider: 'waffo',
        price: {
          plans: {
            pass: {
              prices: [{ priceId: productConfig.waffo.products.projectPass }],
            },
            pro: {
              prices: [{ priceId: productConfig.waffo.products.proMonthly }],
            },
          },
        },
      },
    },
  },
});
mock.module('@tanstack/react-start/server', {
  namedExports: {
    getCookie: (name: string) => cookies.get(name),
    setCookie: (name: string, value: string) => cookies.set(name, value),
  },
});
const { resolveLaunchOffer } = await import('../src/lib/launch-offer.server');

test('a personal deadline survives refresh, login, another browser, and expiration', async () => {
  const visitor = await resolveLaunchOffer(undefined, true);
  assert.ok(visitor);
  assert.ok(Math.abs(visitor.expiresAt - Date.now() - 86_400_000) < 2000);
  assert.equal(
    (await resolveLaunchOffer(undefined, true))?.expiresAt,
    visitor.expiresAt
  );
  const account = await resolveLaunchOffer('qa-account', true);
  assert.equal(account?.expiresAt, visitor.expiresAt);
  cookies.clear();
  assert.equal(
    (await resolveLaunchOffer('qa-account', true))?.expiresAt,
    visitor.expiresAt
  );
  const expired = Date.now() - 1000;
  await client.execute({
    sql: 'UPDATE launch_offer SET expires_at = ? WHERE id = ?',
    args: [expired, account!.id],
  });
  assert.equal(
    (await resolveLaunchOffer('qa-account', true))?.expiresAt,
    expired
  );
  assert.equal((await resolveLaunchOffer(undefined, true))?.expiresAt, expired);
  assert.equal(offerSecondsLeft(expired, Date.now()), 0);
});

test('paid and refunded buyers never receive a new first-purchase offer', async () => {
  for (const paid of [1, 0]) {
    await client.execute({
      sql: 'INSERT OR REPLACE INTO payment VALUES (?, ?, ?, ?)',
      args: ['qa-payment', 'qa-buyer', paid, Date.now()],
    });
    assert.equal(await resolveLaunchOffer('qa-buyer', true), null);
  }
});

test('checkout lookup cannot start an offer and an invalid identity cannot claim one', async () => {
  cookies.clear();
  assert.equal(await resolveLaunchOffer('qa-new-user'), null);
  cookies.set('mididraft_launch_visitor', 'invalid');
  assert.equal(await resolveLaunchOffer('qa-new-user'), null);
});

test('countdown handles the last second and never wraps after expiry', () => {
  assert.deepEqual(offerClock(86400), ['24', '00', '00']);
  assert.deepEqual(offerClock(3599), ['00', '59', '59']);
  assert.equal(offerSecondsLeft(1001, 1000), 1);
  assert.equal(offerSecondsLeft(1000, 1000), 0);
  assert.equal(offerSecondsLeft(1000, 2000), 0);
});

await client.execute(
  `CREATE TABLE user (id TEXT PRIMARY KEY, email TEXT, name TEXT)`
);
await client.execute(
  `INSERT INTO user VALUES ('qa-checkout', 'qa@example.invalid', 'QA')`
);
const calls: Record<string, any>[] = [];
let failCheckout = false;
mock.module('../src/payment/index.ts', {
  namedExports: {
    createCheckout: async (params: Record<string, any>) => {
      calls.push(params);
      if (failCheckout) throw new Error('Simulated timeout');
      return { id: 'qa-session', url: 'https://checkout.example.invalid/qa' };
    },
    createCustomerPortal: async () => ({}),
  },
});
mock.module('../src/middlewares/auth-middleware.ts', {
  namedExports: { authApiMiddleware: {} },
});
mock.module('../src/lib/plan-resolver.ts', {
  namedExports: { resolveUserPlan: async () => ({}) },
});
mock.module('../src/lib/urls.ts', {
  namedExports: { getBaseUrl: () => 'https://example.invalid' },
});
mock.module('@tanstack/react-start', {
  namedExports: {
    createServerFn: () => {
      let validator: any;
      const builder = {
        inputValidator: (value: any) => {
          validator = value;
          return builder;
        },
        middleware: () => builder,
        handler: (fn: any) => (input: any) =>
          fn({
            data: validator ? validator.parse(input.data) : input.data,
            context: { userId: 'qa-checkout' },
          }),
      };
      return builder;
    },
  },
});
const { createCheckoutSession } = await import('../src/api/payment');
const purchase = (data: Record<string, any> = {}) =>
  createCheckoutSession({
    data: {
      planId: 'pass',
      priceId: productConfig.waffo.products.projectPass,
      launchOffer: true,
      ...data,
    },
  });

test('a retry after a payment timeout uses the same key; successful checkouts are reused', async () => {
  cookies.clear();
  await resolveLaunchOffer('qa-checkout', true);
  failCheckout = true;
  await assert.rejects(purchase(), /Simulated timeout/);
  failCheckout = false;
  const result = await purchase();
  assert.equal(calls.length, 2);
  assert.equal(
    calls[0].launchOffer.idempotencyKey,
    calls[1].launchOffer.idempotencyKey
  );
  assert.equal(calls[1].launchOffer.amountUsd, 4.9);
  assert.ok(calls[1].launchOffer.expiresAt <= Date.now() + 45 * 60 * 1000);
  assert.deepEqual(await purchase(), result);
  assert.equal(calls.length, 2);
});

test('expired discounts reject rather than silently charging standard price', async () => {
  await client.execute(
    `UPDATE launch_offer SET expires_at = 1 WHERE id LIKE '%qa-checkout'`
  );
  await assert.rejects(purchase(), /offer has ended/);
  await assert.rejects(
    purchase({ priceId: 'unrecognized-product' }),
    /not available/
  );
  await assert.rejects(
    purchase({
      planId: 'pro',
      priceId: productConfig.waffo.products.proMonthly,
    }),
    /offer has ended/
  );
  assert.equal(calls.length, 2);
});

test('a standard checkout remains full price even with forged discount metadata', async () => {
  await purchase({
    launchOffer: false,
    metadata: { amountUsd: '0.01', userId: 'other-user' },
  });
  assert.equal(calls.at(-1)?.launchOffer, undefined);
  assert.equal(calls.at(-1)?.metadata.userId, 'qa-checkout');
});

// Verify the real provider chooses the catalog SKU, not an arbitrary price override.
const checkoutRequests: any[] = [];
const sdk = await import('@waffo/pancake-ts');
mock.module('@waffo/pancake-ts', {
  namedExports: {
    ...sdk,
    WaffoPancake: class {
      checkout = {
        createSession: async (params: any, options: any) => {
          checkoutRequests.push({ params, options });
          return {
            checkoutUrl: 'https://checkout.example.invalid',
            sessionId: 'sku-test',
          };
        },
      };
    },
  },
});
mock.module('../src/env/server.ts', {
  namedExports: {
    serverEnv: {
      WAFFO_MERCHANT_ID: 'test-only',
      WAFFO_PRIVATE_KEY: 'test-only',
    },
  },
});
mock.module('../src/notification/index.ts', {
  namedExports: { sendPaymentNotification: async () => {} },
});
const { WaffoProvider } = await import('../src/payment/provider/waffo');
test('launch checkout uses the dedicated SKU and preserves the expiry and retry key', async () => {
  const provider = new WaffoProvider();
  await provider.createCheckout({
    planId: 'pass',
    priceId: productConfig.waffo.products.projectPass,
    customerEmail: 'qa@example.invalid',
    launchOffer: {
      amountUsd: 4.9,
      expiresAt: Date.now() + 90000,
      idempotencyKey: 'qa-retry-key',
    },
  });
  const request = checkoutRequests.at(-1);
  assert.equal(
    request.params.productId,
    productConfig.waffo.products.projectPassLaunch
  );
  assert.equal(
    request.params.metadata.priceId,
    productConfig.waffo.products.projectPassLaunch
  );
  assert.equal(request.params.priceSnapshot, undefined);
  assert.ok(request.params.expiresInSeconds <= 90);
  assert.equal(request.options.idempotencyKey, 'qa-retry-key');
  await provider.createCheckout({
    planId: 'pass',
    priceId: productConfig.waffo.products.projectPass,
    customerEmail: 'qa@example.invalid',
  });
  assert.equal(
    checkoutRequests.at(-1).params.productId,
    productConfig.waffo.products.projectPass
  );
});

test('launch SKU is not accepted as an unguarded client-selected price', async () => {
  await assert.rejects(
    purchase({
      launchOffer: false,
      priceId: productConfig.waffo.products.projectPassLaunch,
    }),
    /not available/
  );
});
