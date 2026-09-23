import Container from '@/components/layout/container';

/**
 * The four steps and the four materials, in one section.
 *
 * They used to be two blocks describing the same workflow twice: "pick a
 * section, compare, fix, export" followed by four cards saying the same thing
 * per instrument. Merged, the steps carry the workflow and the material list
 * carries only what differs — what to expect, and the one setting that helps.
 *
 * The instrument scenarios live on the homepage on purpose. `voice to midi`,
 * `guitar to midi` and `piano to midi` are real but small searches, and
 * splitting them into separate pages before the results justify it just makes
 * four pages compete for one intent.
 */
const STEPS = [
  {
    title: 'Pick a section',
    body: 'Load an MP3 or WAV and drag the handles to the 15–60 seconds you actually want. Shorter sections convert faster and more accurately than whole tracks.',
  },
  {
    title: 'Compare it to the original',
    body: 'Switch between the recording and the transcribed MIDI without losing your place. This is the fastest way to tell whether a draft is worth editing.',
  },
  {
    title: 'Fix what is wrong',
    body: 'Adjust sensitivity, note length and pitch range, drop short blips, merge doubled onsets and quantize as lightly as you like. Reset restores the raw transcription.',
  },
  {
    title: 'Export to your DAW',
    body: 'Download a standard .mid file with the tempo written in, so the notes land where you expect in FL Studio, Ableton, Logic or anything else.',
  },
];

const MATERIALS = [
  {
    title: 'Piano and keys',
    body: 'One line at a time is the best case for this tool. Sustain pedal and ringing chords are what cost you accuracy.',
    tip: 'Turn on "trim overlaps".',
  },
  {
    title: 'Guitar',
    body: 'Single-note riffs and arpeggios convert well. Strummed chords, palm mutes and heavy distortion read as extra notes.',
    tip: 'Record clean DI, not a mic on an amp.',
  },
  {
    title: 'Voice and humming',
    body: 'Steady notes with clear changes work. Slides, breathiness and vibrato produce short scattered notes.',
    tip: 'Minimum note length ≈ 150 ms.',
  },
  {
    title: 'Loops and samples',
    body: 'Get the notes of a loop you like the shape of, then rebuild it with your own sounds instead of using the recording.',
    tip: 'Convert one bar, repeat it in the DAW.',
  },
];

export function WorkflowSection() {
  return (
    <section
      id="how-it-works"
      className="border-b border-hairline py-16 sm:py-20"
    >
      <Container className="px-4">
        <div className="mx-auto max-w-2xl text-center">
          <p className="st-eyebrow">How it works</p>
          <h2 className="mt-3 text-balance text-2xl font-medium tracking-tight sm:text-3xl">
            Four steps, all in the browser
          </h2>
          <p className="mt-3 leading-relaxed text-muted-foreground">
            Nothing is uploaded and nothing is queued on a server. What changes
            between jobs is the material, not the steps.
          </p>
        </div>

        <ol className="mx-auto mt-10 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="st-card p-5">
              <span className="st-readout flex size-8 items-center justify-center rounded-full bg-surface-strong text-sm">
                {index + 1}
              </span>
              <h3 className="mt-4 font-medium">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="mx-auto mt-14 max-w-5xl">
          <h3 className="text-center text-xl font-medium tracking-tight">
            What producers convert, and what to expect
          </h3>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {MATERIALS.map((item) => (
              <article key={item.title} className="st-card p-5">
                <h4 className="font-medium">{item.title}</h4>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {item.body}
                </p>
                <p className="mt-4 inline-flex rounded-full bg-surface-strong px-3 py-1 text-xs">
                  {item.tip}
                </p>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
