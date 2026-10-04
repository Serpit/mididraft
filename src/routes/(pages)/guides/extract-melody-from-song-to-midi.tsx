import { GuideLayout } from '@/components/home/guide-layout';
import { websiteConfig } from '@/config/website';
import { Routes } from '@/lib/routes';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

const description =
  'How to get a usable melody out of a full track as MIDI: what to expect, which part of the song to pick, and how to rebuild it with your own sounds.';

export const Route = createFileRoute(
  '/(pages)/guides/extract-melody-from-song-to-midi'
)({
  head: () =>
    seo('/guides/extract-melody-from-song-to-midi', {
      title: `Extract a melody from a song as MIDI | ${websiteConfig.metadata?.name}`,
      description,
      keywords:
        'extract melody from song to midi, song to midi, mp3 song to midi, vocal melody to midi, get melody from audio',
      type: 'article',
    }),
  component: Page,
});

function Page() {
  return (
    <GuideLayout
      title="Extract a melody from a song as MIDI"
      intro={description}
      outcome="A one-line melody draft you can replay with any instrument, and a realistic idea of what a full mix will and will not give you."
      next={{
        label: 'Hear a clip the model gets wrong',
        to: Routes.Examples,
      }}
    >
      <h2>What you can realistically get</h2>
      <p>
        The converter listens for the most prominent pitched line. On a full
        mix, that means a rough outline of the melody, with wrong notes where
        the drums, bass and chords compete with it. It does not separate
        instruments: everything it hears lands on one track. That is enough to
        capture the shape of a tune &mdash; where it goes up, where it settles
        &mdash; and rarely enough to use untouched.
      </p>
      <p>
        So the goal here is a sketch to replay, not a transcription. If you know
        that going in, the result is useful. The examples page includes a
        busy-mix clip so you can hear the ceiling before you spend any time.
      </p>

      <h2>Only convert audio you have the right to use</h2>
      <p>
        Pulling the melody out of your own recordings, stems and licensed
        material is a normal part of production. Converting someone else&rsquo;s
        released track gives you notes, not permission to publish them.
        Converting here happens in your browser and nothing is uploaded, but
        what you do with the result is your responsibility.
      </p>

      <h2>Step 1: choose where in the song to convert</h2>
      <p>
        This matters more than any setting. Pick the stretch where the line you
        want is most exposed:
      </p>
      <ul>
        <li>An intro or breakdown where only the lead is playing.</li>
        <li>A verse where the vocal sits over sparse accompaniment.</li>
        <li>A solo, or a bar where the rhythm section drops out for a fill.</li>
      </ul>
      <p>
        Avoid the biggest chorus, even though it is the part you are thinking
        of. Full arrangements are where the output is least reliable. Select
        fifteen to thirty seconds with the handles; the limit is sixty per run.
      </p>

      <h2>Step 2: if you have stems, use them</h2>
      <p>
        If you made the track, or have the multitrack, export the lead on its
        own and convert that. A dry vocal or lead synth gives a result of a
        different quality to the same part buried in a mix. Turn off reverb and
        delay on the export; tails smear the ends of notes.
      </p>

      <h2>Step 3: narrow the pitch range to the part</h2>
      <p>
        Bass and kick drum live below the melody, cymbals and harmonics above
        it. Open <strong>Pitch range</strong> in the settings and pull the
        handles in to cover only where the melody sits. For a typical lead vocal
        that is roughly C3 to C6; adjust by ear after a listen. This single
        change removes more wrong notes from a full mix than anything else.
      </p>

      <h2>Step 4: raise sensitivity, then clean up</h2>
      <ol>
        <li>
          Raise <strong>Sensitivity</strong> towards 0.6 to 0.7. On a dense
          source you want fewer, surer notes, not every note.
        </li>
        <li>
          Set <strong>Remove short notes</strong> to about 120 to 150&nbsp;ms.
          Short blips are mostly drums and consonants.
        </li>
        <li>
          Turn on <strong>Merge repeated notes</strong> at 80 to 120&nbsp;ms if
          sustained notes come out chopped.
        </li>
      </ol>
      <p>
        The details of each are in{' '}
        <a href={Routes.GuideTooManyNotes}>
          removing extra notes after conversion
        </a>
        .
      </p>

      <h2>Step 5: listen against the original</h2>
      <p>
        Loop the selection and flip <strong>Original</strong> and{' '}
        <strong>MIDI</strong>. Ask only whether the contour is right. Single
        wrong notes are cheap to fix in your DAW, and a missing phrase is not.
        If the contour is wrong in most bars, move the selection to a clearer
        section rather than adjusting further.
      </p>

      <h2>Step 6: export, then rebuild it</h2>
      <p>
        Set the <a href={Routes.GuideFixTempo}>tempo</a> to the real one if you
        know it, download the <code>.mid</code>, and put it on an instrument
        track in your DAW &mdash; the steps are in the guides for{' '}
        <a href={Routes.GuideFlStudio}>FL Studio</a>,{' '}
        <a href={Routes.GuideAbleton}>Ableton</a>,{' '}
        <a href={Routes.GuideLogicPro}>Logic Pro</a>,{' '}
        <a href={Routes.GuideGarageBand}>GarageBand</a> and{' '}
        <a href={Routes.GuideReaper}>REAPER</a>. Then play it against the
        original and correct the notes that are off. Fixing a draft this way is
        usually faster than working the melody out by ear from nothing.
      </p>

      <h2>What will not work</h2>
      <ul>
        <li>
          <strong>Chords and harmony.</strong> You will get fragments of them,
          mixed into the melody line.
        </li>
        <li>
          <strong>Drums and bass lines.</strong> Drums are not pitched, so there
          is nothing for the model to read; a bass line works only if it is the
          loudest pitched thing present.
        </li>
        <li>
          <strong>Two melodies at once.</strong> Call and response works. A duet
          does not.
        </li>
      </ul>
      <p>
        To convert the whole thing, one part at a time, you need each part on
        its own. Separate the parts first, then{' '}
        <a href={Routes.Root}>convert each one</a>.
      </p>
    </GuideLayout>
  );
}
