import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { FilesPageContent } from '@/components/settings/files/files-page-content';
import { messages } from '@/messages';
import { createFileRoute } from '@tanstack/react-router';

const m = messages.settings.files;

export const Route = createFileRoute('/settings/files')({
  component: FilesPage,
});

function FilesPage() {
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
      <FilesPageContent />
    </DashboardLayout>
  );
}
