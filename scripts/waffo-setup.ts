/**
 * Create or update the MidiDraft store and its products in Waffo Pancake.
 *
 * Prices come from `src/config/product.ts`, so changing a price means editing
 * that file and re-running this script. It is safe to re-run: the store and
 * each product are looked up first, and a product is only updated (Waffo keeps
 * the old version) when its name, description or price differs.
 *
 *   pnpm waffo:setup                     # reads .env, test environment
 *   pnpm waffo:setup .env.production     # another env file
 *   pnpm waffo:setup .env --publish      # also publish products to production
 *
 * It also registers the site's webhook for the key's environment (`WAFFO_MODE`,
 * default test) at WEBHOOK_URL, updating its event list if it drifted.
 *
 * Needs WAFFO_MERCHANT_ID and WAFFO_PRIVATE_KEY (Dashboard → API 与开发). The
 * environment follows the key: a test key writes to test mode. Products are
 * only visible to live checkout after `--publish`, which requires the store to
 * pass Waffo's KYB review.
 */
import fs from 'node:fs';
import { BillingPeriod, TaxCategory, WaffoPancake } from '@waffo/pancake-ts';
import { productConfig } from '../src/config/product';

const STORE_NAME = 'MidiDraft';
const WEBHOOK_URL = 'https://mididraft.com/api/webhooks/waffo';
/** Everything `src/payment/provider/waffo.ts` acts on. */
const WEBHOOK_EVENTS = [
  'order.completed',
  'subscription.activated',
  'subscription.renewed',
  'subscription.recovered',
  'subscription.plan_changed',
  'subscription.canceling',
  'subscription.uncanceled',
  'subscription.canceled',
  'subscription.past_due',
  'refund.succeeded',
] as const;
const TAX_CATEGORY = TaxCategory.SaaS;

const args = process.argv.slice(2);
const publish = args.includes('--publish');
const envFile = args.find((arg) => !arg.startsWith('--')) ?? '.env';
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const merchantId = process.env.WAFFO_MERCHANT_ID;
const privateKey = process.env.WAFFO_PRIVATE_KEY;
if (!merchantId || !privateKey) {
  console.error(
    `WAFFO_MERCHANT_ID and WAFFO_PRIVATE_KEY must be set (read ${envFile}).`
  );
  process.exit(1);
}

const testMode = (process.env.WAFFO_MODE ?? 'test') !== 'prod';
const client = new WaffoPancake({ merchantId, privateKey });
const { pricing } = productConfig;

interface ProductSpec {
  key: 'projectPass' | 'projectPassLaunch' | 'proMonthly';
  type: 'onetime' | 'subscription';
  name: string;
  description: string;
  amount: string;
  metadata: Record<string, unknown>;
}

const PRODUCTS: ProductSpec[] = [
  {
    key: 'projectPass',
    type: 'onetime',
    name: 'MidiDraft Project Pass',
    description: `${pricing.projectPass.days} days of batch conversion and cleanup presets. One payment, does not renew.`,
    amount: pricing.projectPass.amountUsd.toFixed(2),
    metadata: { sku: 'project-pass', accessDays: pricing.projectPass.days },
  },
  {
    key: 'projectPassLaunch',
    type: 'onetime',
    name: 'MidiDraft Project Pass — Launch Offer',
    description: `${pricing.projectPass.days} days of batch conversion and cleanup presets. One payment, does not renew.`,
    amount: productConfig.launchOffer.amountUsd.toFixed(2),
    metadata: {
      sku: 'project-pass-launch',
      accessDays: pricing.projectPass.days,
    },
  },
  {
    key: 'proMonthly',
    type: 'subscription',
    name: 'MidiDraft Pro',
    description:
      'Batch conversion and saved cleanup presets, billed monthly. Cancel any time.',
    amount: pricing.pro.amountUsd.toFixed(2),
    metadata: { sku: 'pro-monthly' },
  },
];

interface ExistingProduct {
  id: string;
  name: string;
  description: string | null;
  status: string;
  prices: { currency: string; priceInfo: { amount: string } }[];
}

function usdAmount(product: ExistingProduct): string | undefined {
  return product.prices.find((price) => price.currency === 'USD')?.priceInfo
    .amount;
}

/** GraphQL reports failures in `errors`, not by throwing. Never read them as "no data". */
async function query<T>(q: string, variables?: Record<string, unknown>) {
  const result = await client.graphql.query<T>({ query: q, variables });
  if (result.errors?.length || !result.data) {
    throw new Error(
      `GraphQL query failed: ${JSON.stringify(result.errors ?? 'no data')}`
    );
  }
  return result.data;
}

async function findStore(): Promise<string> {
  const { stores } = await query<{
    stores: { id: string; name: string; status: string }[];
  }>('query { stores { id name status } }');
  const existing = stores.find((store) => store.name === STORE_NAME);
  if (existing) {
    console.log(`= store ${STORE_NAME} ${existing.id}`);
    return existing.id;
  }
  const { store } = await client.stores.create({ name: STORE_NAME });
  console.log(`+ store ${STORE_NAME} ${store.id}`);
  return store.id;
}

// The top-level `onetimeProducts(filter: { storeId })` form in Waffo's docs is
// rejected by the API; the nested store query is what works.
async function listProducts(storeId: string) {
  const { store } = await query<{
    store: {
      onetimeProducts: ExistingProduct[];
      subscriptionProducts: ExistingProduct[];
    };
  }>(
    `query($storeId: String!) {
      store(id: $storeId) {
        onetimeProducts { id name description status prices { currency priceInfo { amount } } }
        subscriptionProducts { id name description status prices { currency priceInfo { amount } } }
      }
    }`,
    { storeId }
  );
  const active = (products: ExistingProduct[]) =>
    products.filter((product) => product.status === 'active');
  return {
    onetime: active(store.onetimeProducts),
    subscription: active(store.subscriptionProducts),
  };
}

async function upsert(
  storeId: string,
  spec: ProductSpec,
  existing: ExistingProduct[]
): Promise<string> {
  const prices = { USD: { amount: spec.amount, taxCategory: TAX_CATEGORY } };
  const match = existing.find((product) => product.name === spec.name);
  const api =
    spec.type === 'onetime'
      ? client.onetimeProducts
      : client.subscriptionProducts;

  if (!match) {
    const { product } =
      spec.type === 'onetime'
        ? await client.onetimeProducts.create({
            storeId,
            name: spec.name,
            description: spec.description,
            prices,
            metadata: spec.metadata,
          })
        : await client.subscriptionProducts.create({
            storeId,
            name: spec.name,
            description: spec.description,
            billingPeriod: BillingPeriod.Monthly,
            prices,
            metadata: spec.metadata,
          });
    console.log(`+ ${spec.type} ${spec.name} $${spec.amount} ${product.id}`);
    return product.id;
  }

  const current = Number(usdAmount(match));
  if (
    current === Number(spec.amount) &&
    match.description === spec.description
  ) {
    console.log(`= ${spec.type} ${spec.name} $${spec.amount} ${match.id}`);
    return match.id;
  }
  await api.update({
    id: match.id,
    description: spec.description,
    prices,
    metadata: spec.metadata,
  });
  console.log(
    `~ ${spec.type} ${spec.name} $${usdAmount(match)} → $${spec.amount} ${match.id}`
  );
  return match.id;
}

async function upsertWebhook(storeId: string): Promise<void> {
  const { store } = await query<{
    store: {
      storeWebhooks: {
        id: string;
        channel: string;
        url: string;
        events: string[];
        testMode: boolean;
      }[];
    };
  }>(
    `query($storeId: String!) {
      store(id: $storeId) { storeWebhooks { id channel url events testMode } }
    }`,
    { storeId }
  );
  const env = testMode ? 'test' : 'prod';
  const match = store.storeWebhooks.find(
    (hook) =>
      hook.channel === 'http' &&
      hook.url === WEBHOOK_URL &&
      hook.testMode === testMode
  );
  const wanted = [...WEBHOOK_EVENTS].sort().join(',');
  if (!match) {
    await client.webhooks.add({
      storeId,
      channel: 'http',
      url: WEBHOOK_URL,
      events: [...WEBHOOK_EVENTS],
      testMode,
    });
    console.log(`+ webhook (${env}) ${WEBHOOK_URL}`);
    return;
  }
  if ([...match.events].sort().join(',') === wanted) {
    console.log(`= webhook (${env}) ${WEBHOOK_URL}`);
    return;
  }
  await client.webhooks.update({ id: match.id, events: [...WEBHOOK_EVENTS] });
  console.log(`~ webhook (${env}) ${WEBHOOK_URL} events updated`);
}

const storeId = await findStore();
const existing = await listProducts(storeId);
const ids: Record<string, string> = {};
for (const spec of PRODUCTS) {
  ids[spec.key] = await upsert(
    storeId,
    spec,
    spec.type === 'onetime' ? existing.onetime : existing.subscription
  );
  if (publish) {
    const api =
      spec.type === 'onetime'
        ? client.onetimeProducts
        : client.subscriptionProducts;
    await api.publish({ id: ids[spec.key] });
    console.log(`^ published ${spec.name} to production`);
  }
}

await upsertWebhook(storeId);

console.log('\nPut these in src/config/product.ts → waffo:');
console.log(JSON.stringify({ storeId, products: ids }, null, 2));
