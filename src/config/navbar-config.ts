import { Routes } from '@/lib/routes';
import { messages } from '@/messages';
import { productConfig } from './product';
import {
  IconBuilding,
  IconAdjustmentsBolt,
  IconFileText,
  IconMail,
  IconShieldCheck,
  IconSparkles,
  IconStack2,
  IconWaveSine,
} from '@tabler/icons-react';
import type { MenuItemConfig } from '../types';
import { websiteConfig } from './website';

const m = messages.nav;

/**
 * Navbar links.
 *
 * Pages for features that are not built yet stay out of the nav — see
 * `productConfig.features`.
 */
export function getNavbarLinks(): MenuItemConfig[] {
  const links: MenuItemConfig[] = [
    { title: m.converter, href: Routes.Root, external: false },
    { title: m.examples, href: Routes.Examples, external: false },
  ];

  const guideItems: MenuItemConfig[] = [
    {
      title: m.guides.flStudio.title,
      description: m.guides.flStudio.description,
      href: Routes.GuideFlStudio,
      icon: IconWaveSine,
      external: false,
    },
    {
      title: m.guides.ableton.title,
      description: m.guides.ableton.description,
      href: Routes.GuideAbleton,
      icon: IconAdjustmentsBolt,
      external: false,
    },
    {
      title: m.guides.improveResults.title,
      description: m.guides.improveResults.description,
      href: Routes.GuideImproveResults,
      icon: IconSparkles,
      external: false,
    },
  ];

  if (productConfig.features.batch) {
    guideItems.unshift({
      title: m.batch.title,
      description: m.batch.description,
      href: Routes.BatchAudioToMidi,
      icon: IconStack2,
      external: false,
    });
  }
  if (productConfig.features.cleanupPresets) {
    guideItems.unshift({
      title: m.cleanup.title,
      description: m.cleanup.description,
      href: Routes.MidiCleanup,
      icon: IconSparkles,
      external: false,
    });
  }

  links.push({ title: m.guidesLabel, items: guideItems });

  links.push({ title: m.pricing, href: Routes.Pricing, external: false });
  if (websiteConfig.blog?.enable) {
    links.push({ title: m.blog, href: Routes.Blog, external: false });
  }

  links.push({
    title: m.pages,
    items: [
      {
        title: m.about.title,
        description: m.about.description,
        href: Routes.About,
        icon: IconBuilding,
        external: false,
      },
      {
        title: m.contact.title,
        description: m.contact.description,
        href: Routes.Contact,
        icon: IconMail,
        external: false,
      },
      {
        title: m.privacyPolicy.title,
        description: m.privacyPolicy.description,
        href: Routes.PrivacyPolicy,
        icon: IconShieldCheck,
        external: false,
      },
      {
        title: m.termsOfService.title,
        description: m.termsOfService.description,
        href: Routes.TermsOfService,
        icon: IconFileText,
        external: false,
      },
    ],
  });

  return links;
}
