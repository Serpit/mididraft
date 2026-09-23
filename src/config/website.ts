import { clientEnv } from '@/env/client';
import { messages } from '@/messages';
import type { WebsiteConfig } from '../types';
import {
  DEFAULT_ALLOWED_TYPES,
  DEFAULT_MAX_FILE_SIZE,
  DEFAULT_USER_FILES_FOLDER,
} from '@/storage/constants';

// Payment provider controlled by env var: 'stripe' | 'creem' | '' (empty means disabled)
const paymentProvider = clientEnv.VITE_PAYMENT_PROVIDER;
const isPaymentEnabled = paymentProvider !== '';
const isCreemPayment = paymentProvider === 'creem';

// Resolve price/product IDs based on the active payment provider
const priceIds = isPaymentEnabled
  ? {
      proMonthly: isCreemPayment
        ? (clientEnv.VITE_CREEM_PRODUCT_PRO_MONTHLY ?? '')
        : (clientEnv.VITE_STRIPE_PRICE_PRO_MONTHLY ?? ''),
      proYearly: isCreemPayment
        ? (clientEnv.VITE_CREEM_PRODUCT_PRO_YEARLY ?? '')
        : (clientEnv.VITE_STRIPE_PRICE_PRO_YEARLY ?? ''),
      lifetime: isCreemPayment
        ? (clientEnv.VITE_CREEM_PRODUCT_LIFETIME ?? '')
        : (clientEnv.VITE_STRIPE_PRICE_LIFETIME ?? ''),
    }
  : { proMonthly: '', proYearly: '', lifetime: '' };

/**
 * Website config
 */
export const websiteConfig: WebsiteConfig = {
  ui: {
    mode: {
      defaultMode: 'dark',
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
  social: {
    twitter: 'https://x.com/mididraft',
  },
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
    supportEmail: 'MidiDraft <hello@mididraft.com>',
  },
  newsletter: {
    enable: true,
    provider: 'resend',
    autoSubscribeAfterSignUp: true,
  },
  notification: {
    enable: true,
    provider: 'discord',
  },
  storage: {
    enable: true,
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
        // "Project Pass" — a one-time 7-day pass, priced from the plan.
        pro: {
          id: 'pro',
          prices: [
            {
              type: 'one_time',
              priceId: priceIds.lifetime,
              amount: 700,
              currency: 'USD',
              allowPromotionCode: true,
            },
          ],
          isFree: false,
          isLifetime: false,
          popular: true,
          name: messages.pricing.plans.pro.name,
          description: messages.pricing.plans.pro.description,
          features: [...messages.pricing.plans.pro.features],
          limits: [...messages.pricing.plans.pro.limits],
        },
        // "Pro" — the recurring plan. Yearly only goes live once monthly
        // retention is proven, so it is not offered yet.
        lifetime: {
          id: 'lifetime',
          prices: [
            {
              type: 'subscription',
              priceId: priceIds.proMonthly,
              amount: 1200,
              currency: 'USD',
              interval: 'month',
            },
          ],
          isFree: false,
          isLifetime: false,
          name: messages.pricing.plans.lifetime.name,
          description: messages.pricing.plans.lifetime.description,
          features: [...messages.pricing.plans.lifetime.features],
          limits: [...messages.pricing.plans.lifetime.limits],
        },
      },
    },
  },
};
