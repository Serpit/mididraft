import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { ApiKeysPageContent } from '@/components/settings/apikeys/apikeys-page-content';
import { messages } from '@/messages';
import { createFileRoute } from '@tanstack/react-router';

const m = messages.settings.apiKeys;

export const Route = createFileRoute('/settings/apikeys')({
  component: ApiKeysPage,
});

function ApiKeysPage() {
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
      <ApiKeysPageContent />
    </DashboardLayout>
  );
}
