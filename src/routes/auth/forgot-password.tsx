import { createFileRoute, redirect } from '@tanstack/react-router';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { websiteConfig } from '@/config/website';
import { messages } from '@/messages';
import { Routes } from '@/lib/routes';

const m = messages.auth.forgotPassword;

export const Route = createFileRoute('/auth/forgot-password')({
  beforeLoad: () => {
    if (!websiteConfig.auth?.enable) {
      throw redirect({ to: Routes.Root });
    }
  },
  component: ForgotPasswordPage,
  head: () => ({
    meta: [{ title: m.title }, { name: 'description', content: m.description }],
  }),
});

function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
