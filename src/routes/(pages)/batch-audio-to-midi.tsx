import { NotLaunched } from '@/components/home/not-launched';
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
    // Unfinished feature: keep it out of the index until it works.
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
    <NotLaunched
      title="Batch audio to MIDI"
      summary={description}
      scope={[
        'Up to 10 clips in one run, processed one after another in the browser',
        'One set of detection and cleanup settings applied to the whole batch',
        'Consistent file naming, so the output drops straight into a project folder',
        'Per-file retry, so one failure does not cost you the whole batch',
        'A total length cap per batch, set from what real machines can actually finish',
      ]}
      gate="The batch has to be genuinely faster than doing the same clips one at a time — the target is at least 30% off the median total time, measured against the free single-file flow on the same material. Until that is measured and met, there is nothing here worth charging for, and this page stays unpublished."
    />
  );
}
