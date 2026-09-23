import Container from '@/components/layout/container';
import { Routes } from '@/lib/routes';
import { IconCpu, IconEyeOff, IconLock } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';

const POINTS = [
  {
    icon: IconCpu,
    title: 'Converted on your machine',
    body: 'The model is about 1 MB and runs in the page. Your file is read from disk and processed locally — there is no upload step and no server queue.',
  },
  {
    icon: IconEyeOff,
    title: 'No file names, no audio in analytics',
    body: 'Usage events record that a conversion started, finished or failed, and roughly how long it took. They never record what you converted.',
  },
  {
    icon: IconLock,
    title: 'Nothing to delete later',
    body: 'Because your audio never arrives here, there is no copy to ask us to remove. Closing the tab is the whole cleanup.',
  },
];

export function PrivacyNoteSection() {
  return (
    <section className="border-t bg-muted/20 py-16 sm:py-20">
      <Container className="px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Your unreleased material stays yours
          </h2>
          <p className="mt-3 text-muted-foreground">
            The main reason producers avoid online converters is having to hand
            over a track nobody has heard yet. You do not have to here.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-3">
          {POINTS.map((point) => (
            <div key={point.title} className="rounded-xl border bg-card p-6">
              <point.icon className="size-5 text-primary" />
              <h3 className="mt-3 font-semibold">{point.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {point.body}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          Full detail in the{' '}
          <Link
            to={Routes.PrivacyPolicy}
            className="underline underline-offset-2 hover:text-foreground"
          >
            privacy policy
          </Link>
          .
        </p>
      </Container>
    </section>
  );
}
