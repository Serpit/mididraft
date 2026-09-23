import Container from '@/components/layout/container';
import { Badge } from '@/components/ui/badge';
import {
  IconDeviceAudioTape,
  IconGuitarPick,
  IconMicrophone,
  IconPiano,
} from '@tabler/icons-react';

/**
 * The instrument scenarios live on the homepage on purpose.
 *
 * `voice to midi`, `guitar to midi` and `piano to midi` are real but small
 * searches, and splitting them into separate pages before the results justify
 * it just makes four pages compete for one intent. They get their own pages
 * only if the search data shows a genuinely different task.
 */
const CASES = [
  {
    icon: IconPiano,
    title: 'Piano to MIDI',
    body: 'A recorded piano or keys take, one line at a time, is the best case for this tool. Sustain pedal and ringing chords are what cost you accuracy — mute earlier and you get a cleaner draft.',
    tip: 'Turn on "trim overlaps" if held chords smear together.',
  },
  {
    icon: IconGuitarPick,
    title: 'Guitar to MIDI',
    body: 'Single-note riffs and arpeggios convert well. Strummed chords, palm mutes and heavy distortion do not: the overtones read as extra notes and the transcription gets busy.',
    tip: 'Record clean DI rather than a mic on an amp.',
  },
  {
    icon: IconMicrophone,
    title: 'Voice and humming to MIDI',
    body: 'Hum a melody, convert it, and drop it onto a synth. Steady notes with clear changes work; slides, breathiness and vibrato produce short scattered notes.',
    tip: 'Raise the minimum note length to about 150 ms.',
  },
  {
    icon: IconDeviceAudioTape,
    title: 'Loops and samples to MIDI',
    body: 'Take a loop you like the shape of, get the notes as MIDI, and rebuild it with your own sounds. You keep the idea and the arrangement without using someone else’s recording.',
    tip: 'Convert one bar, then repeat it in your DAW.',
  },
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="py-16 sm:py-20">
      <Container className="px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            What producers convert
          </h2>
          <p className="mt-3 text-muted-foreground">
            Each of these works differently. Here is what to expect, and the one
            setting that helps most.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-2">
          {CASES.map((item) => (
            <article key={item.title} className="rounded-xl border bg-card p-6">
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <item.icon className="size-5 text-primary" />
                </span>
                <h3 className="font-semibold">{item.title}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
              <Badge variant="secondary" className="mt-4 font-normal">
                {item.tip}
              </Badge>
            </article>
          ))}
        </div>
      </Container>
    </section>
  );
}
