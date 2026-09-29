import { createFileRoute } from '@tanstack/react-router';
import { GUIDES } from '@/config/guides';
import { productConfig } from '@/config/product';
import { websiteConfig } from '@/config/website';
import { getBaseUrl } from '@/lib/urls';

/**
 * llms.txt — a plain-text map of the site for AI assistants.
 *
 * Follows the llmstxt.org layout: title, one-line summary, then linked
 * sections. Feature pages are listed only once the feature has shipped, the
 * same rule the sitemap uses.
 */
export const Route = createFileRoute('/llms.txt')({
  server: {
    handlers: {
      GET: async () => {
        const base = getBaseUrl().replace(/\/$/, '');
        const link = (path: string, title: string, note: string) =>
          `- [${title}](${base}${path}): ${note}`;

        const tool = [
          link(
            '/',
            'Audio to MIDI converter',
            'The tool itself. Converts MP3/WAV to an editable MIDI draft in the browser; audio is never uploaded.'
          ),
          link(
            '/examples',
            'Examples',
            'Demo clips with the results, including one the model handles badly on purpose.'
          ),
        ];
        if (productConfig.features.batch) {
          tool.push(
            link(
              '/batch-audio-to-midi',
              'Batch audio to MIDI',
              'Convert and clean several files the same way.'
            )
          );
        }
        if (productConfig.features.cleanupPresets) {
          tool.push(
            link(
              '/midi-cleanup',
              'MIDI cleanup',
              'Remove short and quiet notes, merge, trim overlaps, quantize.'
            )
          );
        }

        const guides = GUIDES.map((g) => link(g.href, g.title, g.description));

        const about = [
          link(
            '/pricing',
            'Pricing',
            `Free single-file conversion with MIDI download; Project Pass $${productConfig.pricing.projectPass.amountUsd} for ${productConfig.pricing.projectPass.days} days; Pro $${productConfig.pricing.pro.amountUsd} per ${productConfig.pricing.pro.interval}.`
          ),
          link('/about', 'About', 'Who makes MidiDraft and why.'),
          link('/contact', 'Contact', 'How to reach the team.'),
        ];

        const body = `# ${websiteConfig.metadata?.name}

> ${websiteConfig.metadata?.description}

Conversion runs entirely in the browser using an open-source model (Spotify Basic Pitch); audio is not uploaded. Accuracy is best on a single clear instrument and limited on full mixes — the site states this plainly.

## Tool

${tool.join('\n')}

## Guides

${guides.join('\n')}

## About

${about.join('\n')}
`;

        return new Response(body, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      },
    },
  },
});
