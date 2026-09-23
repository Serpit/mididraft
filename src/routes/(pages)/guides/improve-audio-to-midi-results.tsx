import { GuideLayout } from '@/components/home/guide-layout';
import { websiteConfig } from '@/config/website';
import { Routes } from '@/lib/routes';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

const description =
  'Which recordings convert to usable MIDI, which never will, and the settings that fix the four most common failures.';

export const Route = createFileRoute(
  '/(pages)/guides/improve-audio-to-midi-results'
)({
  head: () =>
    seo('/guides/improve-audio-to-midi-results', {
      title: `How to get better audio to MIDI results | ${websiteConfig.metadata?.name}`,
      description,
      keywords:
        'improve audio to midi, fix wrong notes after audio to midi, audio to midi not accurate, best audio for midi conversion',
      type: 'article',
    }),
  component: Page,
});

function Page() {
  return (
    <GuideLayout
      title="How to get better audio to MIDI results"
      intro={description}
      outcome="A clear sense of whether your material can convert at all, and the two or three settings to reach for when it half-works."
      next={{ label: 'Hear the hard example', to: Routes.Examples }}
    >
      <h2>The material matters more than the settings</h2>
      <p>
        No setting rescues a recording the model cannot hear into. Roughly, in
        descending order of how well it converts:
      </p>
      <ol>
        <li>
          <strong>Clean, single instrument, one note at a time.</strong> A dry
          piano take, a DI guitar line, a hummed melody. This is the case the
          tool is built for.
        </li>
        <li>
          <strong>Single instrument playing chords.</strong> Usable, but expect
          missed inner voices and extra notes from overtones.
        </li>
        <li>
          <strong>Two instruments together.</strong> Both land on one MIDI
          track, interleaved. Sometimes useful as a sketch.
        </li>
        <li>
          <strong>A finished, mastered mix.</strong> Expect a rough outline of
          the loudest line and a lot of noise. This is not a limitation to
          configure around; it is what the technology does.
        </li>
      </ol>

      <h2>Four things that hurt, in order</h2>

      <h3>1. Reverb and delay</h3>
      <p>
        The worst offender by a distance. A tail blurs where one note ends and
        the next begins, so the model reports notes that overlap, repeat, or
        never stop. If you have access to the dry source, use it. If you do not,
        raise the minimum note length and turn on &ldquo;trim overlaps&rdquo;,
        and accept that note ends will need work.
      </p>

      <h3>2. Distortion and heavy compression</h3>
      <p>
        Both generate harmonics that read as real notes, usually an octave or a
        fifth above what was played. Narrow the pitch range to the
        instrument&rsquo;s actual range and a lot of this disappears.
      </p>

      <h3>3. Several instruments at once</h3>
      <p>
        There is no separation step here: everything lands on one track. Convert
        stems individually if you have them. If you only have the mix, pick the
        section where the part you want is most exposed.
      </p>

      <h3>4. Very fast passages</h3>
      <p>
        Below roughly 60–80&nbsp;ms per note, onsets start merging. Rolls,
        trills and fast runs come out as fewer, longer notes. Lowering the
        minimum note length helps a little, at the cost of more false notes
        everywhere else.
      </p>

      <h2>What to change, by symptom</h2>

      <h3>Far too many short notes</h3>
      <p>
        Raise <strong>sensitivity</strong> towards 0.6–0.7, and set{' '}
        <strong>remove short notes</strong> to 100–150&nbsp;ms. If they cluster
        at the very bottom or top of the range, narrow the{' '}
        <strong>pitch range</strong> instead — that is usually rumble or
        harmonics, not performance.
      </p>

      <h3>Notes are missing</h3>
      <p>
        Lower <strong>sensitivity</strong> towards 0.25–0.35. If quiet notes are
        the ones vanishing, check that <strong>remove quiet notes</strong> is
        off. If whole phrases are missing, the source is probably too dense at
        that point.
      </p>

      <h3>Notes cut off too early, or run on forever</h3>
      <p>
        That is <strong>note sustain</strong>. Lower it to hold notes longer,
        raise it to end them sooner. On material with a lot of ring-out, pair a
        higher value with <strong>trim overlaps</strong>.
      </p>

      <h3>One pitch repeats rapidly where you played one long note</h3>
      <p>
        A false onset on a sustained note. Set{' '}
        <strong>merge repeated notes</strong> to 80–150&nbsp;ms. This is very
        common on piano with pedal and on bowed strings.
      </p>

      <h3>Timing feels wrong in the DAW</h3>
      <p>
        Check the <strong>tempo</strong> value before exporting. It is estimated
        from note spacing and can land on half or double the real tempo. If you
        know the tempo, type it in. Only then reach for quantize, and keep it
        low — at 100% you throw away the feel that made you record the take.
      </p>

      <h2>A workflow that saves time</h2>
      <ol>
        <li>
          Convert fifteen seconds first, not the whole thing. If fifteen seconds
          are unusable, sixty will be too.
        </li>
        <li>
          Judge it by ear with the <strong>Original / MIDI</strong> switch, not
          by looking at the piano roll. A roll that looks busy can sound fine,
          and vice versa.
        </li>
        <li>
          Fix detection first (sensitivity, sustain, pitch range), cleanup
          second. Cleanup cannot recover a note that was never detected.
        </li>
        <li>
          Export, open it in your DAW, and play it against the original audio
          there. Problems that were inaudible in a short loop show up quickly.
        </li>
      </ol>

      <h2>When to stop</h2>
      <p>
        If after a couple of minutes of adjustment the draft still needs more
        editing than playing the part in by hand would, stop and play it in.
        This tool is worth using when it saves you time, and it will not always.
      </p>
    </GuideLayout>
  );
}
