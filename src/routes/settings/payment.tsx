import { createFileRoute, useSearch } from '@tanstack/react-router';
import { DashboardHeader } from '@/components/layout/dashboard-header';
import { PaymentCard } from '@/components/payment/payment-card';
import { messages } from '@/messages';

export const Route = createFileRoute('/settings/payment')({
  validateSearch: (s): { session_id?: string; callback?: string } => ({
    session_id: typeof s?.session_id === 'string' ? s.session_id : undefined,
    callback: typeof s?.callback === 'string' ? s.callback : undefined,
  }),
  component: PaymentPage,
});

function PaymentPage() {
  const search = useSearch({ from: '/settings/payment' });
  const breadcrumbs = [
    { label: messages.common.settings, isCurrentPage: false },
    { label: messages.settings.billing.breadcrumb, isCurrentPage: true },
  ];

  return (
    <>
      <DashboardHeader breadcrumbs={breadcrumbs} />
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 lg:gap-6 lg:py-6">
            <div className="px-4 lg:px-6">
              <PaymentCard
                sessionId={search.session_id}
                callback={search.callback ?? '/settings/billing'}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
