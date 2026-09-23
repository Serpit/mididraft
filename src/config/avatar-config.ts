import { IconCreditCard, IconSettings2 } from '@tabler/icons-react';
import { Routes } from '@/lib/routes';
import type { MenuItemConfig } from '../types';
import { messages } from '@/messages';
import { websiteConfig } from './website';

const m = messages.dashboard.avatar;

/**
 * Avatar dropdown links
 */
export function getAvatarLinks(): MenuItemConfig[] {
  return [
    ...(websiteConfig.payment?.enable
      ? [
          {
            title: m.billing,
            href: Routes.SettingsBilling,
            icon: IconCreditCard,
          },
        ]
      : []),
    { title: m.settings, href: Routes.SettingsProfile, icon: IconSettings2 },
  ];
}
