import type { QueryClient } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useRouterState,
} from '@tanstack/react-router';
import { AffonsoScript } from '@/components/affiliate/affonso';
import { PromotekitScript } from '@/components/affiliate/promotekit';
import { Analytics } from '@/components/analytics/analytics';
import { CrispChat } from '@/components/chatbox/crisp-chat';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';
import { DefaultNotFound } from '@/components/layout/default-not-found';
import { Toaster } from '@/components/shared/toaster';
import { websiteConfig } from '@/config/website';
import appCss from '../styles.css?url';
import { DefaultCatchBoundary } from '@/components/layout/default-catch-boundary';
import { Routes } from '@/lib/routes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { lazy } from 'react';

const DevTools = import.meta.env.DEV
  ? lazy(() => import('@/integrations/devtools'))
  : () => null;

/**
 * https://github.com/backpine/tanstack-start-on-cloudflare/blob/main/src/routes/__root.tsx
 */
export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: websiteConfig.metadata?.title,
      },
      {
        name: 'description',
        content: websiteConfig.metadata?.description,
      },
      {
        name: 'theme-color',
        content: '#09090b',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'manifest', href: '/manifest.json' },
    ],
  }),
  // shellComponent automatically wraps root component, errorComponent, and notFoundComponent
  shellComponent: RootDocument,
  component: RootComponent,
  notFoundComponent: DefaultNotFound,
  errorComponent: DefaultCatchBoundary,
});

/**
 * Root component (wrapped by shellComponent: RootDocument)
 * Only marketing pages get Navbar + Footer; auth/dashboard/404 pages don't.
 */
function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname }) ?? '';
  const matches = useRouterState({ select: (s) => s.matches }) ?? [];
  const isAuthPages = pathname.startsWith(Routes.Auth);
  const isProtectedPages =
    pathname.startsWith(Routes.Admin) ||
    pathname.startsWith(Routes.Dashboard) ||
    pathname.startsWith(Routes.Settings);
  // When no child route matches (e.g. /hello), only root is in matches; use minimal layout
  const isNotFound =
    pathname !== Routes.Root && pathname !== '' && matches.length <= 1;

  if (isAuthPages || isProtectedPages || isNotFound) {
    return (
      <div className="flex min-h-screen flex-col">
        <main id="main-content" className="flex-1">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar scroll />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

/**
 * Root document
 */
function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <TooltipProvider>
            {children}
            <Toaster richColors position="top-right" offset={64} />
          </TooltipProvider>
        </ThemeProvider>
        <DevTools />
        <Analytics />
        <CrispChat />
        <AffonsoScript />
        <PromotekitScript />
        <Scripts />
      </body>
    </html>
  );
}
