import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { NewsletterFormCard } from '@/components/settings/notification/newsletter-form-card';
import { messages } from '@/messages';
import { createFileRoute } from '@tanstack/react-router';

const m = messages.settings.notification;

export const Route = createFileRoute('/settings/notifications')({
  component: NotificationsPage,
});

function NotificationsPage() {
  const breadcrumbs = [
    { label: messages.common.settings, isCurrentPage: false },
    { label: m.title, isCurrentPage: true },
  ];

  return (
    <DashboardLayout
      breadcrumbs={breadcrumbs}
      title={m.title}
      description={m.description}
    >
      <div className="flex flex-col gap-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <NewsletterFormCard />
        </div>
      </div>
    </DashboardLayout>
  );
}
