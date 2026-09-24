import { Routes } from '@/lib/routes';
import { messages } from '@/messages';
import { productConfig } from './product';
import { IconBooks, IconSparkles } from '@tabler/icons-react';
import type { MenuItemConfig } from '../types';
import { GUIDES } from './guides';

const m = messages.nav;

/**
 * Navbar links.
 *
 * Pages for features that are not built yet stay out of the nav — see
 * `productConfig.features`. About, contact and the legal pages live in the
 * footer: on a first visit the nav should only offer the tool, the proof and
 * the guides. Batch sits next to the converter because it is a tool, not
 * reading material, and it is the paid one.
 */
export function getNavbarLinks(): MenuItemConfig[] {
  const links: MenuItemConfig[] = [
    { title: m.converter, href: Routes.Root, external: false },
  ];
  if (productConfig.features.batch) {
    links.push({
      title: m.batch.short,
      href: Routes.BatchAudioToMidi,
      badge: m.batch.badge,
      external: false,
    });
  }
  links.push({ title: m.examples, href: Routes.Examples, external: false });

  const guideItems: MenuItemConfig[] = GUIDES.map((guide) => ({
    title: guide.title,
    description: guide.description,
    href: guide.href,
    icon: guide.icon,
    external: false,
  }));

  if (productConfig.features.cleanupPresets) {
    guideItems.unshift({
      title: m.cleanup.title,
      description: m.cleanup.description,
      href: Routes.MidiCleanup,
      icon: IconSparkles,
      external: false,
    });
  }

  // The hub is the one way in to reading material; the blog is reached from
  // there and from the footer rather than competing with it up here.
  guideItems.push({
    title: m.allGuides.title,
    description: m.allGuides.description,
    href: Routes.Guides,
    icon: IconBooks,
    external: false,
  });

  links.push({ title: m.guidesLabel, items: guideItems });

  links.push({ title: m.pricing, href: Routes.Pricing, external: false });

  return links;
}
