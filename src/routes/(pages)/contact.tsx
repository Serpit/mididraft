import { createFileRoute } from '@tanstack/react-router';
import Container from '@/components/layout/container';
import { ContactFormCard } from '@/components/contact/contact-form-card';
import { websiteConfig } from '@/config/website';
import { messages } from '@/messages';
import { seo } from '@/lib/seo';

const m = messages.contact;

export const Route = createFileRoute('/(pages)/contact')({
  head: () =>
    seo('/contact', {
      title: `${m.title} | ${websiteConfig.metadata?.name}`,
      description: m.description,
    }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <Container className="py-16 px-4">
      <div className="mx-auto max-w-4xl space-y-8 pb-16">
        <div className="space-y-4">
          <h1 className="text-center text-3xl font-bold tracking-tight">
            {m.title}
          </h1>
          <p className="text-center text-lg text-muted-foreground">
            {m.description}
          </p>
        </div>
        <ContactFormCard />
      </div>
    </Container>
  );
}
