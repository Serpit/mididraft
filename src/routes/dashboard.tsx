import { SidebarLayoutPage } from '@/components/layout/sidebar-layout';
import { Routes } from '@/lib/routes';
import { authRouteMiddleware } from '@/middlewares/auth-middleware';
import { createFileRoute, redirect } from '@tanstack/react-router';

// MidiDraft has no dashboard: the homepage is the tool. Old links and the
// template's post-login redirect land back there.
export const Route = createFileRoute('/dashboard')({
  ssr: false,
  beforeLoad: () => {
    throw redirect({ to: Routes.Root });
  },
  component: SidebarLayoutPage,
  server: {
    middleware: [authRouteMiddleware],
  },
});
