import Container from '@/components/layout/container';
import { productConfig } from '@/config/product';
import { Routes } from '@/lib/routes';
import { Link } from '@tanstack/react-router';

/**
 * Formats, limits and privacy in one block.
 *
 * `mp3 to midi`, `wav to midi` and `audio to midi` are covered honestly here
 * rather than split across near-duplicate pages that compete with each other.
 * The privacy points sit in the same section because they answer the same
 * question a producer is really asking: what happens to my file.
 */
const FORMATS = [
  {
    heading: 'MP3',
    body: 'What most people have on hand, so it is the format this tool is tuned for. Compression costs you a little: very quiet notes and fast passages survive better in a lossless file.',
  },
  {
    heading: 'WAV',
    body: 'The best input. An uncompressed bounce straight out of your DAW, one instrument, no master-bus compression or reverb, gives the cleanest note onsets to work with.',
  },
  {
    heading: 'FLAC, M4A, AAC, OGG',
    body: 'All accepted, decoded by your browser before conversion. If a file will not decode, the browser lacks that codec — re-export it as WAV and it will work.',
  },
  {
    heading: 'Output: a standard .mid',
    body: 'Note pitch, start, length and velocity on one track, with the tempo written into the header. It opens in any DAW, notation app or hardware sequencer.',
  },
];

const PRIVACY = [
  {
    heading: 'Converted on your machine',
    body: 'The model is about 1 MB and runs in the page. Your file is read from disk and processed locally — there is no upload step and no server queue.',
  },
  {
    heading: 'No file names in analytics',
    body: 'Usage events record that a conversion started, finished or failed, and roughly how long it took. They never record what you converted.',
  },
  {
    heading: 'Nothing to delete later',
    body: 'Because your audio never arrives here, there is no copy to ask us to remove. Closing the tab is the whole cleanup.',
  },
];

export function CapabilitiesSection() {
  const { limits } = productConfig;

  return (
    <section id="formats" className="border-b border-hairline py-16 sm:py-20">
      <Container className="px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="st-eyebrow">Formats, limits, privacy</p>
          <h2 className="mt-3 text-balance text-2xl font-medium tracking-tight sm:text-3xl">
            What goes in, what comes out, where it happens
          </h2>
        </div>

        <dl className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
          {[
            { term: 'Max file size', detail: `${limits.maxFileMb} MB` },
            {
              term: 'Max file length',
              detail: `${limits.maxDurationMinutes} minutes`,
            },
            {
              term: 'Per conversion',
              detail: `${limits.maxSegmentSeconds} seconds`,
            },
          ].map((item) => (
            <div key={item.term} className="st-card px-5 py-4 text-center">
              <dt className="st-eyebrow">{item.term}</dt>
              <dd className="st-readout mt-2 text-xl">{item.detail}</dd>
            </div>
          ))}
        </dl>

        <div className="mx-auto mt-12 grid max-w-5xl gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <h3 className="text-lg font-medium tracking-tight">
              Formats it reads
            </h3>
            <dl className="mt-4 space-y-4">
              {FORMATS.map((format) => (
                <div key={format.heading} className="st-card p-5">
                  <dt className="font-medium">{format.heading}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {format.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-medium tracking-tight">
              Your unreleased material stays yours
            </h3>
            <dl className="mt-4 space-y-4">
              {PRIVACY.map((point) => (
                <div key={point.heading} className="st-card p-5">
                  <dt className="font-medium">{point.heading}</dt>
                  <dd className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {point.body}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-5 text-sm text-muted-foreground">
              Full detail in the{' '}
              <Link
                to={Routes.PrivacyPolicy}
                className="text-foreground underline underline-offset-4"
              >
                privacy policy
              </Link>
              .
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
