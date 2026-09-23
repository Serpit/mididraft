import {
  IconBell,
  IconCreditCard,
  IconFileUpload,
  IconKey,
  IconLayoutDashboard,
  IconLock,
  IconSettings2,
  IconShieldCheck,
  IconUserCircle,
  IconUsers,
} from '@tabler/icons-react';
import { Routes } from '@/lib/routes';
import type { MenuItemConfig } from '../types';
import { messages } from '@/messages';
import { websiteConfig } from './website';

const m = messages.dashboard.sidebar;
const am = messages.admin;

/**
 * Sidebar links
 */
export function getSidebarLinks(): MenuItemConfig[] {
  return [
    {
      title: m.dashboard,
      icon: IconLayoutDashboard,
      href: Routes.Dashboard,
      external: false,
    },
    {
      title: am.title,
      icon: IconShieldCheck,
      authorizeOnly: ['admin'],
      items: [
        {
          title: am.users.title,
          icon: IconUsers,
          href: Routes.AdminUsers,
          external: false,
        },
      ],
    },
    {
      title: m.settings,
      icon: IconSettings2,
      items: [
        {
          title: m.profile,
          icon: IconUserCircle,
          href: Routes.SettingsProfile,
          external: false,
        },
        ...(websiteConfig.payment?.enable
          ? [
              {
                title: m.billing,
                icon: IconCreditCard,
                href: Routes.SettingsBilling,
                external: false,
              },
            ]
          : []),
        {
          title: m.security,
          icon: IconLock,
          href: Routes.SettingsSecurity,
          external: false,
        },
        {
          title: m.files,
          icon: IconFileUpload,
          href: Routes.SettingsFiles,
          external: false,
        },
        {
          title: m.apiKeys,
          icon: IconKey,
          href: Routes.SettingsApiKeys,
          external: false,
        },
        {
          title: m.notifications,
          icon: IconBell,
          href: Routes.SettingsNotifications,
          external: false,
        },
      ],
    },
  ];
}
