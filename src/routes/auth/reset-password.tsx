import { createFileRoute, redirect } from '@tanstack/react-router';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { websiteConfig } from '@/config/website';
import { messages } from '@/messages';
import { Routes } from '@/lib/routes';

const m = messages.auth.resetPassword;

export const Route = createFileRoute('/auth/reset-password')({
  beforeLoad: () => {
    if (!websiteConfig.auth?.enable) {
      throw redirect({ to: Routes.Root });
    }
  },
  component: ResetPasswordPage,
  head: () => ({
    meta: [{ title: m.title }, { name: 'description', content: m.description }],
  }),
});

function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
