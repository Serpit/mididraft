import { ExamplesStripSection } from '@/components/home/examples-strip';
import { FaqSection } from '@/components/home/faq';
import { FormatsSection } from '@/components/home/formats';
import { HeroSection } from '@/components/home/hero';
import { HowItWorksSection } from '@/components/home/how-it-works';
import { PrivacyNoteSection } from '@/components/home/privacy-note';
import { UseCasesSection } from '@/components/home/use-cases';

/**
 * The homepage is the converter plus the text a first-time visitor needs to
 * decide whether this tool fits their material. There is no separate
 * /audio-to-midi page competing with it.
 */
export function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <HowItWorksSection />
      <ExamplesStripSection />
      <UseCasesSection />
      <FormatsSection />
      <PrivacyNoteSection />
      <FaqSection />
    </div>
  );
}
