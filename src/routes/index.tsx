import { HomePage } from '@/components/home/homepage';
import { FAQ_ITEMS } from '@/components/home/faq';
import { websiteConfig } from '@/config/website';
import { seo } from '@/lib/seo';
import { getCanonicalUrl } from '@/lib/urls';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  head: () => {
    const name = websiteConfig.metadata?.name ?? '';
    const title = websiteConfig.metadata?.title ?? '';
    const description = websiteConfig.metadata?.description ?? '';
    const url = getCanonicalUrl('/');

    // The homepage is the tool, so it is described as an application rather
    // than a marketing page.
    const appJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name,
      url,
      description,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any browser',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
        description:
          'Free single-file conversion with MIDI download, no account required',
      },
      featureList: [
        'MP3 to MIDI',
        'WAV to MIDI',
        'Audio to MIDI',
        'Original and MIDI A-B playback',
        'Note cleanup and light quantization',
        'Standard MIDI export with tempo',
      ],
    };

    const faqJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    };

    const metadata = seo('/', {
      title,
      description,
      keywords:
        'audio to midi, mp3 to midi, wav to midi, audio to midi converter, mp3 to midi converter, convert audio to midi, voice to midi, humming to midi',
    });

    return {
      ...metadata,
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(appJsonLd),
        },
        {
          type: 'application/ld+json',
          children: JSON.stringify(faqJsonLd),
        },
      ],
    };
  },
  component: HomePage,
});
