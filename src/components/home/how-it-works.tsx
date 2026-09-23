import Container from '@/components/layout/container';
import {
  IconArrowsShuffle,
  IconDownload,
  IconEar,
  IconUpload,
} from '@tabler/icons-react';

const STEPS = [
  {
    icon: IconUpload,
    title: 'Pick a section',
    body: 'Load an MP3 or WAV and drag the handles to the 15–60 seconds you actually want. Shorter sections convert faster and more accurately than whole tracks.',
  },
  {
    icon: IconEar,
    title: 'Compare it to the original',
    body: 'Switch between the original audio and the transcribed MIDI without losing your place. This is the fastest way to tell whether a draft is worth editing.',
  },
  {
    icon: IconArrowsShuffle,
    title: 'Fix what is wrong',
    body: 'Adjust sensitivity, minimum note length and pitch range, then drop short blips, merge doubled onsets and quantize as lightly as you like. Reset restores the raw transcription.',
  },
  {
    icon: IconDownload,
    title: 'Export to your DAW',
    body: 'Download a standard .mid file with the tempo written in, so the notes land where you expect in FL Studio, Ableton, Logic or anything else.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-16 sm:py-20">
      <Container className="px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            How the conversion works
          </h2>
          <p className="mt-3 text-muted-foreground">
            Four steps, all in the browser. Nothing is uploaded and nothing is
            queued on a server.
          </p>
        </div>

        <ol className="mx-auto mt-10 grid max-w-5xl gap-6 sm:grid-cols-2">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                  <step.icon className="size-5 text-primary" />
                </span>
                <h3 className="font-semibold">
                  <span className="mr-1.5 text-muted-foreground tabular-nums">
                    {index + 1}.
                  </span>
                  {step.title}
                </h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}
