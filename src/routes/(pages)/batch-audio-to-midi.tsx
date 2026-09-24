import { BatchConverter } from '@/components/batch/batch-converter';
import Container from '@/components/layout/container';
import { productConfig } from '@/config/product';
import { websiteConfig } from '@/config/website';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

const description =
  'Convert a folder of loops to MIDI in one run, with one set of settings, consistent names and a ZIP download.';

export const Route = createFileRoute('/(pages)/batch-audio-to-midi')({
  head: () => {
    const metadata = seo('/batch-audio-to-midi', {
      title: `Batch audio to MIDI converter | ${websiteConfig.metadata?.name}`,
      description,
    });
    return productConfig.features.batch
      ? metadata
      : {
          ...metadata,
          meta: [
            ...metadata.meta,
            { name: 'robots', content: 'noindex, nofollow' },
          ],
        };
  },
  component: Page,
});

function Page() {
  return (
    <Container className="px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Batch audio to MIDI
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">{description}</p>
        </div>
        <BatchConverter />
      </div>
    </Container>
  );
}
