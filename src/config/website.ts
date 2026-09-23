import { productConfig } from '@/config/product';
import { clientEnv } from '@/env/client';
import { messages } from '@/messages';
import type { WebsiteConfig } from '../types';
import {
  DEFAULT_ALLOWED_TYPES,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_USER_FILES_FOLDER,
} from '@/storage/constants';

// Payment provider controlled by env var: 'stripe' | 'creem' | 'waffo' | ''
// (empty means disabled). Waffo is the provider MidiDraft uses.
const paymentProvider = clientEnv.VITE_PAYMENT_PROVIDER;
const isPaymentEnabled = paymentProvider !== '';

// Resolve price/product IDs based on the active payment provider. Waffo's IDs
// are catalog constants written by `pnpm waffo:setup`, not env vars.
function resolvePriceIds(): { pass: string; proMonthly: string } {
  switch (paymentProvider) {
    case 'waffo':
      return {
        pass: productConfig.waffo.products.projectPass,
        proMonthly: productConfig.waffo.products.proMonthly,
      };
    case 'creem':
      return {
        pass: clientEnv.VITE_CREEM_PRODUCT_LIFETIME ?? '',
        proMonthly: clientEnv.VITE_CREEM_PRODUCT_PRO_MONTHLY ?? '',
      };
    case 'stripe':
      return {
        pass: clientEnv.VITE_STRIPE_PRICE_LIFETIME ?? '',
        proMonthly: clientEnv.VITE_STRIPE_PRICE_PRO_MONTHLY ?? '',
      };
    default:
      return { pass: '', proMonthly: '' };
  }
}
const priceIds = resolvePriceIds();
const { pricing } = productConfig;

/**
 * Website config
 */
export const websiteConfig: WebsiteConfig = {
  ui: {
    mode: {
      // Design C is a warm-white tool built for a first visit; light is the
      // default experience and dark is the same room with the lights off.
      defaultMode: 'light',
      enableSwitch: true,
    },
  },
  metadata: {
    name: messages.site.name,
    title: messages.site.title,
    description: messages.site.description,
    images: {
      ogImage: '/og.png',
      logoLight: '/logo-light.svg',
      logoDark: '/logo-dark.svg',
    },
  },
  // No social accounts are live yet; add them here once they exist.
  social: {},
  auth: {
    enable: true,
    enableGoogleLogin: true,
    enableCredentialLogin: true,
    enableDeleteAccount: true,
  },
  blog: {
    enable: true,
    paginationSize: 6,
  },
  affiliates: {
    enable: false,
    provider: 'affonso',
  },
  mail: {
    enable: true,
    provider: 'cloudflare',
    fromEmail: 'MidiDraft <hello@mididraft.com>',
    // Shown on the site and used as the Waffo store's support email; the two
    // must match for Waffo's review. Sending stays on the own domain above.
    supportEmail: 'MidiDraft <mididraft@outlook.com>',
  },
  newsletter: {
    enable: true,
    provider: 'resend',
    // Product news needs consent: users opt in from settings, never at sign-up.
    autoSubscribeAfterSignUp: false,
  },
  notification: {
    enable: true,
    provider: 'discord',
  },
  storage: {
    // Conversion is local; cloud file storage is not part of the launch.
    enable: false,
    provider: 'r2',
    maxFileSize: DEFAULT_MAX_FILE_SIZE,
    allowedTypes: DEFAULT_ALLOWED_TYPES,
    userFilesFolder: DEFAULT_USER_FILES_FOLDER,
  },
  payment: {
    enable: isPaymentEnabled,
    provider: isPaymentEnabled ? paymentProvider : undefined,
    price: {
      plans: {
        free: {
          id: 'free',
          prices: [],
          isFree: true,
          isLifetime: false,
          name: messages.pricing.plans.free.name,
          description: messages.pricing.plans.free.description,
          features: [...messages.pricing.plans.free.features],
          limits: [...messages.pricing.plans.free.limits],
        },
        // Project Pass: one payment, access for `pricing.projectPass.days`.
        pass: {
          id: 'pass',
          prices: [
            {
              type: 'one_time',
              priceId: priceIds.pass,
              amount: pricing.projectPass.amountUsd * 100,
              currency: 'USD',
            },
          ],
          isFree: false,
          isLifetime: false,
          popular: true,
          name: messages.pricing.plans.pass.name,
          description: messages.pricing.plans.pass.description,
          features: [...messages.pricing.plans.pass.features],
          limits: [...messages.pricing.plans.pass.limits],
        },
        // Pro: monthly subscription. Yearly only goes live once monthly
        // retention is proven, so it is not offered yet.
        pro: {
          id: 'pro',
          prices: [
            {
              type: 'subscription',
              priceId: priceIds.proMonthly,
              amount: pricing.pro.amountUsd * 100,
              currency: 'USD',
              interval: 'month',
            },
          ],
          isFree: false,
          isLifetime: false,
          name: messages.pricing.plans.pro.name,
          description: messages.pricing.plans.pro.description,
          features: [...messages.pricing.plans.pro.features],
          limits: [...messages.pricing.plans.pro.limits],
        },
      },
    },
  },
};
