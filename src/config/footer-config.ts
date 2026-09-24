import { Routes } from '@/lib/routes';
import type { MenuItemConfig } from '../types';
import { GUIDES } from './guides';
import { productConfig } from './product';
import { websiteConfig } from './website';
import { messages } from '@/messages';

const m = messages.nav;

/**
 * Footer links, grouped by section.
 * Unlaunched feature pages are omitted here too.
 */
export function getFooterLinks(): MenuItemConfig[] {
  const productItems: MenuItemConfig[] = [
    { title: m.converter, href: Routes.Root, external: false },
    { title: m.examples, href: Routes.Examples, external: false },
  ];
  if (productConfig.features.batch) {
    productItems.push({
      title: m.batch.title,
      href: Routes.BatchAudioToMidi,
      external: false,
    });
  }
  if (productConfig.features.cleanupPresets) {
    productItems.push({
      title: m.cleanup.title,
      href: Routes.MidiCleanup,
      external: false,
    });
  }
  productItems.push({
    title: m.pricing,
    href: Routes.Pricing,
    external: false,
  });
  productItems.push({ title: m.faq, href: Routes.Faqs, external: false });

  const resourcesItems: MenuItemConfig[] = [
    { title: m.allGuides.title, href: Routes.Guides, external: false },
    ...GUIDES.map((guide) => ({
      title: guide.title,
      href: guide.href,
      external: false,
    })),
  ];
  if (websiteConfig.blog?.enable) {
    resourcesItems.push({ title: m.blog, href: Routes.Blog, external: false });
  }

  const companyItems: MenuItemConfig[] = [
    { title: m.about.title, href: Routes.About, external: false },
    { title: m.contact.title, href: Routes.Contact, external: false },
  ];

  const legalItems: MenuItemConfig[] = [
    {
      title: m.privacyPolicy.title,
      href: Routes.PrivacyPolicy,
      external: false,
    },
    {
      title: m.termsOfService.title,
      href: Routes.TermsOfService,
      external: false,
    },
    { title: m.cookiePolicy.title, href: Routes.CookiePolicy, external: false },
  ];

  return [
    { title: m.product, items: productItems },
    { title: m.resources, items: resourcesItems },
    { title: m.company, items: companyItems },
    { title: m.legal, items: legalItems },
  ];
}
