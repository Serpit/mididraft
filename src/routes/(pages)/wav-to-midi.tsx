import { Converter } from '@/components/converter/converter';
import { ExamplePlayer } from '@/components/home/examples-strip';
import { HeroStage } from '@/components/home/hero-stage';
import Container from '@/components/layout/container';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { productConfig } from '@/config/product';
import { websiteConfig } from '@/config/website';
import { getExample } from '@/lib/midi/examples';
import { Routes } from '@/lib/routes';
import { seo } from '@/lib/seo';
import { getCanonicalUrl } from '@/lib/urls';
import { Link, createFileRoute } from '@tanstack/react-router';
import type { ReactNode } from 'react';

/**
 * The WAV landing page.
 *
 * Bing already ranks the homepage 7–9 for "wav to midi" and its variants, but
 * Google has no page that answers that query on its own. This page is the
 * same converter with the text a WAV user needs: what a WAV costs against the
 * size limit, why a bounce fails, and what to export instead. It is not a
 * copy of the homepage — formats other than WAV are only mentioned, never
 * explained here.
 */
const title = 'WAV to MIDI Converter';
const description =
  'Convert a WAV file to an editable MIDI draft in your browser. Compare the MIDI with the original by ear, clean it up, and download a standard .mid free — no upload, no account.';

const { limits } = productConfig;

const FAQ_ITEMS = [
  {
    id: 'wav-vs-mp3',
    question: 'Is WAV better than MP3 for converting to MIDI?',
    answer:
      'Usually a little. A WAV keeps the quiet notes and sharp note starts that MP3 compression softens, so fast passages and soft notes come through more often. The difference is smaller than the difference between a dry single instrument and a full mix: a clean MP3 of one instrument converts better than a WAV of a finished song.',
  },
  {
    id: 'upload',
    question: 'Is my WAV file uploaded anywhere?',
    answer:
      'No. The file is read from your disk and converted by a model that runs in the page. Nothing is sent to a server, so an unreleased bounce stays on your machine.',
  },
  {
    id: 'full-song',
    question: 'Can I convert a whole song WAV to MIDI?',
    answer: `You can load a WAV of up to ${limits.maxDurationMinutes} minutes and ${limits.maxFileMb} MB, and convert up to ${limits.maxSegmentSeconds} seconds of it per run. A finished mix gives a rough sketch with missing inner parts — no audio-to-MIDI tool reliably splits a song into instruments. Convert a single stem if you have one.`,
  },
];

/** Approximate length that fits under the size limit, for common bounces. */
const SIZE_ROWS = [
  { format: '16-bit, 44.1 kHz, stereo', fits: 'just under 3 minutes' },
  { format: '24-bit, 48 kHz, stereo', fits: 'about 1 minute 50 seconds' },
  { format: '16-bit, 44.1 kHz, mono', fits: 'the full 3 minutes' },
];

const FAILURES: { heading: string; body: ReactNode }[] = [
  {
    heading: `The WAV is over ${limits.maxFileMb} MB`,
    body: 'High sample rates and stereo fill the limit fast. Bounce only the section you need, bounce it in mono, or save it as an MP3 — three minutes of MP3 is about 7 MB.',
  },
  {
    heading: '"Could not decode" the file',
    body: 'Most WAVs are plain PCM and open in every browser. Some recorders and samplers write compressed WAVs (ADPCM, µ-law) that a browser cannot read. Re-export as 16- or 24-bit PCM WAV from your DAW or an audio editor.',
  },
  {
    heading: 'Far too many notes',
    body: (
      <>
        Reverb tails, master-bus processing and several instruments at once all
        turn into extra notes. Bounce the track dry, one instrument, with
        effects off. More in{' '}
        <Link
          to={Routes.GuideTooManyNotes}
          className="text-foreground underline underline-offset-4"
        >
          why audio to MIDI gives too many notes
        </Link>
        .
      </>
    ),
  },
  {
    heading: 'Notes drift off the grid in your DAW',
    body: (
      <>
        The .mid carries the tempo shown next to the piano roll, estimated from
        the notes. Set the real tempo before you export, or see{' '}
        <Link
          to={Routes.GuideFixTempo}
          className="text-foreground underline underline-offset-4"
        >
          fixing audio to MIDI tempo
        </Link>
        .
      </>
    ),
  },
];

export const Route = createFileRoute('/(pages)/wav-to-midi')({
  head: () => {
    const url = getCanonicalUrl('/wav-to-midi');
    const metadata = seo('/wav-to-midi', {
      title: `${title} | ${websiteConfig.metadata?.name}`,
      description,
    });

    const appJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: title,
      url,
      description,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any browser',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
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

    return {
      ...metadata,
      scripts: [
        { type: 'application/ld+json', children: JSON.stringify(appJsonLd) },
        { type: 'application/ld+json', children: JSON.stringify(faqJsonLd) },
      ],
    };
  },
  component: WavToMidiPage,
});

function WavToMidiPage() {
  const example = getExample('piano-melody');

  return (
    <div className="flex flex-col">
      <section
        id="converter"
        className="relative isolate overflow-hidden border-b border-hairline"
      >
        <HeroStage />
        <Container className="relative z-10 px-4 py-10 sm:py-12">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-balance text-3xl font-medium tracking-tight sm:text-4xl">
              {title}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-balance leading-relaxed text-muted-foreground sm:text-lg">
              Drop a WAV bounce and get an editable MIDI draft. It is converted
              in your browser, and the download is free.
            </p>
          </div>

          <div className="mx-auto mt-7 max-w-5xl">
            <Converter />
          </div>

          <p className="mx-auto mt-8 max-w-xl text-center leading-relaxed text-muted-foreground">
            Have an MP3, FLAC or M4A instead? The same{' '}
            <Link
              to={Routes.Root}
              className="text-foreground underline underline-offset-4"
            >
              audio to MIDI converter
            </Link>{' '}
            reads those too.
          </p>
        </Container>
      </section>

      {example && (
        <section className="border-b border-hairline py-16 sm:py-20">
          <Container className="px-4">
            <div className="mx-auto max-w-2xl text-center">
              <p className="st-eyebrow">Before and after</p>
              <h2 className="mt-3 text-balance text-2xl font-medium tracking-tight sm:text-3xl">
                A WAV in, a MIDI draft out
              </h2>
            </div>
            <article className="st-card mx-auto mt-10 grid max-w-5xl gap-6 p-5 sm:p-6 md:grid-cols-[1fr_18rem]">
              <div>
                <h3 className="text-lg font-medium">{example.title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {example.description}
                </p>
                <p className="mt-4 text-sm leading-relaxed">
                  <span className="font-medium">What you get: </span>
                  <span className="text-muted-foreground">
                    {example.expectation}
                  </span>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {example.conditions}
                </p>
                <Link
                  to={Routes.Examples}
                  className="mt-4 inline-block text-sm underline underline-offset-2"
                >
                  More examples, including one that converts badly
                </Link>
              </div>
              <ExamplePlayer example={example} />
            </article>
          </Container>
        </section>
      )}

      <section className="border-b border-hairline py-16 sm:py-20">
        <Container className="px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="st-eyebrow">Formats and limits</p>
            <h2 className="mt-3 text-balance text-2xl font-medium tracking-tight sm:text-3xl">
              How much WAV fits
            </h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Files can be up to {limits.maxFileMb} MB and{' '}
              {limits.maxDurationMinutes} minutes, and each run converts up to{' '}
              {limits.maxSegmentSeconds} seconds. A WAV hits the size limit
              before the length limit unless it is mono. The model mixes to mono
              anyway, so a mono bounce loses nothing.
            </p>
          </div>

          <div className="st-card mx-auto mt-8 max-w-3xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-hairline">
                <tr>
                  <th className="px-5 py-3 font-medium">WAV bounce</th>
                  <th className="px-5 py-3 font-medium">
                    Fits in {limits.maxFileMb} MB
                  </th>
                </tr>
              </thead>
              <tbody>
                {SIZE_ROWS.map((row) => (
                  <tr
                    key={row.format}
                    className="border-b border-hairline last:border-0"
                  >
                    <td className="px-5 py-3">{row.format}</td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {row.fits}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mx-auto mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            Also accepted: MP3, FLAC, M4A, AAC and OGG. The output is a standard
            .mid with pitch, start, length and velocity on one track and the
            tempo in the header, so it opens in any DAW.
          </p>

          <h3 className="mx-auto mt-12 max-w-3xl text-lg font-medium tracking-tight">
            When a WAV does not convert well
          </h3>
          <dl className="mx-auto mt-4 grid max-w-3xl gap-4 sm:grid-cols-2">
            {FAILURES.map((failure) => (
              <div key={failure.heading} className="st-card p-5">
                <dt className="font-medium">{failure.heading}</dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {failure.body}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <section id="faq" className="py-16 sm:py-20">
        <Container className="px-4">
          <div className="mx-auto max-w-2xl text-center">
            <p className="st-eyebrow">FAQ</p>
            <h2 className="mt-3 text-balance text-2xl font-medium tracking-tight sm:text-3xl">
              WAV to MIDI questions
            </h2>
          </div>
          <Accordion className="mx-auto mt-10 w-full max-w-3xl space-y-3">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="st-card border-b-0 px-5"
              >
                <AccordionTrigger className="py-4 text-left text-base font-medium hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="pb-3 leading-relaxed text-muted-foreground">
                    {item.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Container>
      </section>
    </div>
  );
}
