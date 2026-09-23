import { GuideLayout } from '@/components/home/guide-layout';
import { websiteConfig } from '@/config/website';
import { Routes } from '@/lib/routes';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

// TODO: add real screenshots of each step once captured from a live session.
// Placeholder images would be worse than none.

const description =
  'Convert an audio loop to MIDI and import it into FL Studio, with the tempo set so the notes land where you played them.';

export const Route = createFileRoute('/(pages)/guides/audio-to-midi-fl-studio')(
  {
    head: () =>
      seo('/guides/audio-to-midi-fl-studio', {
        title: `Audio to MIDI in FL Studio: import a converted .mid | ${websiteConfig.metadata?.name}`,
        description,
        keywords:
          'audio to midi fl studio, import midi fl studio, mp3 to midi fl studio, fl studio midi tempo',
        type: 'article',
      }),
    component: Page,
  }
);

function Page() {
  return (
    <GuideLayout
      title="Audio to MIDI in FL Studio"
      intro={description}
      outcome="A MIDI clip in the Piano roll, on a channel of your choice, playing back at the right tempo."
      next={{
        label: 'The same thing in Ableton',
        to: Routes.GuideAbleton,
      }}
    >
      <h2>Before you convert</h2>
      <p>
        FL Studio has no built-in audio-to-MIDI conversion, which is why this
        takes a round trip through a converter. Two things decide how much
        editing you will do afterwards, and both happen before conversion:
      </p>
      <ul>
        <li>
          <strong>Export one instrument, not the mix.</strong> Solo the channel
          and render just that. A full mix gives you a MIDI part with notes from
          everything at once.
        </li>
        <li>
          <strong>Render a short section.</strong> Set the selection to four or
          eight bars and export that rather than the whole arrangement. Fifteen
          to sixty seconds converts fast and gives a cleaner result.
        </li>
      </ul>
      <p>
        In FL Studio: <em>File → Export → WAV</em>, and under Miscellaneous make
        sure <em>Save selection as</em> is what you expect. Note the project
        tempo shown in the transport — you will need it in a moment.
      </p>

      <h2>Convert the file</h2>
      <ol>
        <li>
          Open the <a href={Routes.Root}>converter</a> and drop in the WAV you
          exported.
        </li>
        <li>
          Drag the selection handles to the section you want. The converter
          transcribes up to sixty seconds per run.
        </li>
        <li>
          Play it back and switch between <strong>Original</strong> and{' '}
          <strong>MIDI</strong>. If the MIDI is a scatter of short notes, raise
          the minimum note length; if notes are missing, lower the sensitivity.
        </li>
        <li>
          <strong>Set the tempo to your FL Studio project tempo</strong> before
          exporting. The converter estimates tempo from the notes, and an
          estimate that is out by a factor of two is the usual reason imported
          MIDI does not line up.
        </li>
        <li>
          Download the <code>.mid</code> file.
        </li>
      </ol>

      <h2>Import the MIDI into FL Studio</h2>
      <p>There are two routes, and they do different things.</p>

      <h3>Into the current project (usually what you want)</h3>
      <ol>
        <li>
          Open the Piano roll on the channel you want to play the part — a
          synth, a sampler, anything.
        </li>
        <li>
          In the Piano roll menu, choose <em>File → Import MIDI file</em>, and
          pick the <code>.mid</code> you downloaded.
        </li>
        <li>
          The notes appear in that channel&rsquo;s Piano roll. If FL asks about
          the MIDI channel, take channel 1 — the export is a single track.
        </li>
      </ol>

      <h3>As a new project</h3>
      <p>
        Dragging the <code>.mid</code> onto the FL Studio window, or using{' '}
        <em>File → Import → MIDI file</em>, opens it as its own project and
        takes the tempo from the file. Useful for auditioning, awkward if you
        wanted the part inside the track you are already working on.
      </p>

      <h2>If the notes do not line up</h2>
      <ul>
        <li>
          <strong>Everything drifts progressively.</strong> Tempo mismatch. The
          file&rsquo;s tempo and the project tempo differ. Re-export from the
          converter with the correct tempo set.
        </li>
        <li>
          <strong>Everything is offset by a constant amount.</strong> Your
          selection did not start on a bar line. Select the notes in the Piano
          roll and nudge them, or re-render the audio from a bar boundary.
        </li>
        <li>
          <strong>Timing is close but loose.</strong> That is your performance,
          faithfully transcribed. Use the converter&rsquo;s quantize control at
          a low setting, or FL&rsquo;s own quantize (<kbd>Alt</kbd> +{' '}
          <kbd>Q</kbd>) once the notes are in.
        </li>
      </ul>

      <h2>Cleaning up in the Piano roll</h2>
      <p>
        Transcription of a recorded performance always leaves some artefacts.
        The three worth fixing first:
      </p>
      <ul>
        <li>
          <strong>Very short stray notes.</strong> Faster to remove in the
          converter before export — set &ldquo;remove short notes&rdquo; to
          around 80–120&nbsp;ms — than to hunt for them by hand.
        </li>
        <li>
          <strong>Notes an octave off.</strong> Usually an overtone read as a
          note. Select and transpose, or narrow the pitch range and convert
          again.
        </li>
        <li>
          <strong>Overlapping duplicates on one pitch.</strong> Turn on
          &ldquo;trim overlaps&rdquo; in the converter; FL will otherwise
          retrigger the same note oddly on some synths.
        </li>
      </ul>

      <h2>What this will not do</h2>
      <p>
        It will not split a finished track into separate instrument parts, and
        it will not give you an accurate transcription of a dense mix. If the
        source is a full arrangement, expect a sketch you rebuild by hand rather
        than a part you can use as-is.
      </p>
    </GuideLayout>
  );
}
