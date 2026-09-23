import { CapabilitiesSection } from '@/components/home/capabilities';
import { ExamplesStripSection } from '@/components/home/examples-strip';
import { FaqSection } from '@/components/home/faq';
import { HeroSection } from '@/components/home/hero';
import { WorkflowSection } from '@/components/home/workflow';

/**
 * The homepage is the converter plus the text a first-time visitor needs to
 * decide whether this tool fits their material. There is no separate
 * /audio-to-midi page competing with it.
 *
 * Order matters more than volume here: tool, proof, how it works,
 * constraints, FAQ. The old page described the same four steps twice and
 * split formats from privacy; both pairs are now single sections.
 */
export function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <ExamplesStripSection />
      <WorkflowSection />
      <CapabilitiesSection />
      <FaqSection />
    </div>
  );
}
