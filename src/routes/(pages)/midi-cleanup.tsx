import { NotLaunched } from '@/components/home/not-launched';
import { productConfig } from '@/config/product';
import { websiteConfig } from '@/config/website';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

const description =
  'Save a set of cleanup settings — short-note removal, merging, overlap trimming, light quantization — and apply it to a whole batch at once.';

export const Route = createFileRoute('/(pages)/midi-cleanup')({
  head: () => {
    const metadata = seo('/midi-cleanup', {
      title: `MIDI cleanup presets | ${websiteConfig.metadata?.name}`,
      description,
    });
    return productConfig.features.cleanupPresets
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
      title="MIDI cleanup presets"
      summary={description}
      scope={[
        'Save a named combination of the cleanup controls already in the converter',
        'Apply one preset across every file in a batch',
        'Compare before and after by ear, and revert without re-converting',
        'Import an existing .mid file and clean it up without re-transcribing',
      ]}
      gate="The cleanup controls themselves already ship free in the converter, and free MIDI editors do a lot of this too. Presets are only worth money if they measurably beat doing it by hand on a real batch. That comparison has not been run yet, so there is nothing to sell and this page stays unpublished."
    />
  );
}
