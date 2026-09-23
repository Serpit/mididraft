import Container from '@/components/layout/container';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

/**
 * FAQ content is also the JSON-LD source on the homepage route, so questions
 * and answers stay identical between what a reader sees and what a crawler
 * reads.
 */
export const FAQ_ITEMS = [
  {
    id: 'accuracy',
    question: 'How accurate is audio to MIDI conversion?',
    answer:
      'On a clear recording of one instrument playing one line at a time, expect most note pitches and starts to come through, with note ends and very fast passages needing a pass by hand. On a full mix — several instruments, reverb, mastering — expect a rough sketch and missing inner voices. No audio-to-MIDI tool, this one included, reliably separates a finished song into accurate per-instrument parts. Try the hard example on the Examples page before you plan any work around it.',
  },
  {
    id: 'upload',
    question: 'Is my audio uploaded anywhere?',
    answer:
      'No. The model runs in your browser and your file is read directly from disk. Nothing is sent to a server, so unreleased material stays on your machine. The site does not record file names or audio content in its analytics.',
  },
  {
    id: 'free',
    question: 'What does the free version actually include?',
    answer:
      'The whole conversion: load a file, pick a section, transcribe it, compare it against the original, adjust the detection and cleanup settings, and download a standard .mid file with the correct tempo. No account, no email, no watermark on the output.',
  },
  {
    id: 'polyphonic',
    question: 'Can it transcribe chords and multiple instruments?',
    answer:
      'It detects multiple pitches at once, so simple chords often come through. It does not separate instruments. A guitar and a vocal playing together land on the same MIDI track, and dense arrangements produce extra notes from overtones and reverb. Convert one instrument at a time if you can.',
  },
  {
    id: 'tempo',
    question: 'Why do my notes land in the wrong place in my DAW?',
    answer:
      'Almost always a tempo mismatch. The exported file carries the tempo shown next to the piano roll, which is estimated from the notes. If you know the real tempo of your clip, set it before exporting, or set your project tempo to match. The FL Studio and Ableton guides walk through this.',
  },
  {
    id: 'length',
    question: 'Why is there a length limit?',
    answer:
      'Conversion runs on your own CPU, so a long file means a long wait and a real risk of the tab running out of memory. Files can be up to three minutes, and each run converts up to sixty seconds of that. Fifteen to sixty seconds is also the range where the result is worth editing rather than rewriting.',
  },
  {
    id: 'voice',
    question: 'Does it work on humming or singing?',
    answer:
      'Often, yes — a steady hummed or sung melody with clear note changes converts about as well as an instrument. Breathy, sliding or heavily processed vocals produce wandering pitch and extra notes. Raise the minimum note length and narrow the pitch range if you get a scatter of short notes.',
  },
  {
    id: 'formats',
    question: 'Which files can I convert?',
    answer:
      'MP3, WAV, FLAC, M4A, AAC and OGG, up to 30 MB and 3 minutes. The output is a standard .mid file that opens in any DAW, notation program or hardware sequencer.',
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="py-16 sm:py-20">
      <Container className="px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="st-eyebrow">FAQ</p>
          <h2 className="mt-3 text-balance text-2xl font-medium tracking-tight sm:text-3xl">
            Audio to MIDI, answered honestly
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Including the parts that do not work. You will find out anyway the
            first time you convert a full mix.
          </p>
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
  );
}
