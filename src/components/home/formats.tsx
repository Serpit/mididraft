import Container from '@/components/layout/container';
import { productConfig } from '@/config/product';

/**
 * Format section. This is where `mp3 to midi`, `wav to midi` and
 * `audio to midi` are covered honestly on one page, rather than split across
 * near-duplicate pages that compete with each other.
 */
const FORMATS = [
  {
    heading: 'MP3 to MIDI',
    body: 'MP3 is what most people have on hand, so it is the format this tool is tuned for. Compression does cost you a little: very quiet notes and fast passages survive better in a lossless file. If the source exists as WAV, use the WAV.',
  },
  {
    heading: 'WAV to MIDI',
    body: 'The best input. An uncompressed bounce straight out of your DAW, one instrument, no master-bus compression or reverb, gives the model the cleanest note onsets to work with.',
  },
  {
    heading: 'FLAC, M4A, AAC and OGG',
    body: 'All accepted, decoded by your browser before conversion. If a file will not decode, the browser lacks that codec — re-export it as WAV and it will work.',
  },
  {
    heading: 'What comes out',
    body: 'A standard MIDI file: note pitch, start, length and velocity, on one track, with the tempo written into the header. It opens in any DAW, notation app or hardware sequencer that reads .mid.',
  },
];

export function FormatsSection() {
  const { limits } = productConfig;
  return (
    <section id="formats" className="border-t bg-muted/20 py-16 sm:py-20">
      <Container className="px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Formats and limits
          </h2>
          <p className="mt-3 text-muted-foreground">
            Up to {limits.maxFileMb} MB and {limits.maxDurationMinutes} minutes
            per file, converted {limits.maxSegmentSeconds} seconds at a time.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-2">
          {FORMATS.map((format) => (
            <div key={format.heading} className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold">{format.heading}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {format.body}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
