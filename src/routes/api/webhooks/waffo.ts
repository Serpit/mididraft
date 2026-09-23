import { createFileRoute } from '@tanstack/react-router';
import { handleWebhookEvent, isPaymentEnabled } from '@/payment';
import { WebhookSignatureError } from '@/payment/provider/waffo';

/**
 * Waffo Pancake webhook endpoint: https://mididraft.com/api/webhooks/waffo
 *
 * Register it per environment for the MidiDraft store (test and prod are
 * separate registrations). Events: order.completed, subscription.activated,
 * subscription.renewed, subscription.recovered, subscription.plan_changed,
 * subscription.canceling, subscription.uncanceled, subscription.canceled,
 * subscription.past_due, refund.succeeded.
 *
 * A bad signature gets 401. A processing error gets 500 so Waffo retries —
 * the handlers are idempotent, and a subscription update that arrives before
 * its activation relies on that retry.
 */
export const Route = createFileRoute('/api/webhooks/waffo')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isPaymentEnabled()) {
          return Response.json({ received: true }, { status: 200 });
        }
        // Raw text: parsing first would change the bytes that were signed.
        const payload = await request.text();
        const signature = request.headers.get('x-waffo-signature') ?? '';
        if (!payload || !signature) {
          return Response.json(
            { error: 'Missing payload or signature' },
            { status: 400 }
          );
        }
        try {
          await handleWebhookEvent(payload, signature);
          return Response.json({ received: true }, { status: 200 });
        } catch (error) {
          if (error instanceof WebhookSignatureError) {
            console.warn('Waffo webhook: invalid signature', error.message);
            return Response.json(
              { error: 'Invalid signature' },
              { status: 401 }
            );
          }
          console.error('Waffo webhook error:', error);
          return Response.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
          );
        }
      },
    },
  },
});
