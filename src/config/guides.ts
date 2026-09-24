import { Routes } from '@/lib/routes';
import { messages } from '@/messages';
import {
  IconAdjustmentsBolt,
  IconMusic,
  IconPiano,
  IconSparkles,
  IconWaveSine,
} from '@tabler/icons-react';
import type { ComponentType } from 'react';

const m = messages.nav.guides;

export interface Guide {
  href: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  /** Paper illustration for the /guides hub card, from /illustrations/icons. */
  art: string;
  /**
   * Last meaningful content change, YYYY-MM-DD. Goes into the sitemap as
   * `lastmod`, so bump it when the guide's text changes — not for a typo.
   */
  updated: string;
}

/**
 * Every how-to guide, in the order they are listed. The nav, the footer, the
 * /guides hub and the sitemap all read from here, so a new guide is one entry.
 */
export const GUIDES: Guide[] = [
  {
    href: Routes.GuideFlStudio,
    ...m.flStudio,
    icon: IconWaveSine,
    art: 'blocks',
    updated: '2026-09-24',
  },
  {
    href: Routes.GuideAbleton,
    ...m.ableton,
    icon: IconAdjustmentsBolt,
    art: 'wave',
    updated: '2026-09-24',
  },
  {
    href: Routes.GuideLogicPro,
    ...m.logicPro,
    icon: IconPiano,
    art: 'keys',
    updated: '2026-09-24',
  },
  {
    href: Routes.GuideGarageBand,
    ...m.garageBand,
    icon: IconMusic,
    art: 'headphones',
    updated: '2026-09-24',
  },
  {
    href: Routes.GuideImproveResults,
    ...m.improveResults,
    icon: IconSparkles,
    art: 'note8',
    updated: '2026-09-24',
  },
];
