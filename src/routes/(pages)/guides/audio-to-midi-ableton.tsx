import { GuideLayout } from '@/components/home/guide-layout';
import { websiteConfig } from '@/config/website';
import { Routes } from '@/lib/routes';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

// TODO: add real screenshots of each step once captured from a live session.

const description =
  'Convert audio to MIDI and drop it into an Ableton Live MIDI track, plus when Live’s own Convert commands are the better tool.';

export const Route = createFileRoute('/(pages)/guides/audio-to-midi-ableton')({
  head: () =>
    seo('/guides/audio-to-midi-ableton', {
      title: `Audio to MIDI in Ableton Live: import a converted .mid | ${websiteConfig.metadata?.name}`,
      description,
      keywords:
        'audio to midi ableton, ableton convert audio to midi, import midi ableton, mp3 to midi ableton',
      type: 'article',
    }),
  component: Page,
});

function Page() {
  return (
    <GuideLayout
      title="Audio to MIDI in Ableton Live"
      intro={description}
      outcome="A MIDI clip on a track in Live, at the project tempo, ready to point at any instrument."
      next={{
        label: 'The same thing in FL Studio',
        to: Routes.GuideFlStudio,
      }}
    >
      <h2>First: should you use Live&rsquo;s own conversion?</h2>
      <p>
        Live has <em>Convert Harmony / Melody / Drums to New MIDI Track</em>{' '}
        built in, on the right-click menu of an audio clip. If your audio is
        already in a Live set, start there — it is one click and it knows your
        project tempo.
      </p>
      <p>Come back here when:</p>
      <ul>
        <li>
          The audio is not in a Live set and you do not want to import it just
          to convert it.
        </li>
        <li>
          You want to hear the transcription against the original, and adjust
          sensitivity and note length, before anything lands in your project.
        </li>
        <li>
          You are on Intro or Lite, where the Convert commands are not
          available.
        </li>
        <li>
          Live&rsquo;s result is too busy and you want to strip short notes and
          merge doubled onsets before importing.
        </li>
      </ul>

      <h2>Export a clean source from Live</h2>
      <ol>
        <li>
          Solo the track you want. One instrument converts far better than a
          mix.
        </li>
        <li>
          Set the loop brace over four to eight bars and use{' '}
          <em>File → Export Audio/Video</em> with <em>Rendered Track</em> set to
          that track.
        </li>
        <li>
          Render at 44.1&nbsp;kHz WAV. Leave any reverb or delay off if you can
          — tails smear note onsets, which is the single biggest cause of extra
          notes.
        </li>
        <li>Note your project tempo. You will set it in the converter.</li>
      </ol>

      <h2>Convert</h2>
      <ol>
        <li>
          Drop the WAV into the{' '}
          <a href={Routes.Root}>audio to MIDI converter</a>. An MP3 bounce works
          too, but WAV keeps quiet notes and fast passages intact.
        </li>
        <li>Select the section you want — up to sixty seconds per run.</li>
        <li>
          Use the <strong>Original / MIDI</strong> switch while it plays. Loop
          the selection and listen for wrong pitches rather than watching the
          piano roll.
        </li>
        <li>
          Set <strong>tempo</strong> to your Live project tempo before you
          export.
        </li>
        <li>
          Download the <code>.mid</code>.
        </li>
      </ol>

      <h2>Import into Live</h2>
      <p>
        Drag the <code>.mid</code> file from your file browser straight onto a
        MIDI track in Session or Arrangement view. Live creates a clip with the
        notes in it.
      </p>
      <p>Two things worth knowing:</p>
      <ul>
        <li>
          <strong>Live keeps your project tempo</strong> and warps the imported
          notes to it. If the file&rsquo;s tempo was wrong, the notes arrive at
          the wrong spacing — fix the tempo in the converter and re-export
          rather than stretching the clip.
        </li>
        <li>
          <strong>A multi-track .mid</strong> would land on several tracks; this
          converter always exports one track, so you get one clip.
        </li>
      </ul>
      <p>
        Point the track at any instrument — Wavetable, Operator, a sampler, an
        external synth. The MIDI carries pitch, timing, length and velocity, so
        dynamics from the original performance survive.
      </p>

      <h2>Common problems</h2>
      <ul>
        <li>
          <strong>Notes drift out of time as the clip plays.</strong> Tempo
          mismatch between the exported file and your set.
        </li>
        <li>
          <strong>A cloud of short notes.</strong> Reverb or a noisy source.
          Raise minimum note length, and re-render the audio dry.
        </li>
        <li>
          <strong>Melody is right, harmony is missing.</strong> Expected on
          anything dense. Convert each instrument separately if you can get at
          the stems.
        </li>
        <li>
          <strong>Notes an octave out.</strong> An overtone read as a
          fundamental. Narrow the pitch range and convert again, or transpose
          the offending notes in Live.
        </li>
      </ul>

      <h2>Afterwards</h2>
      <p>
        Treat the result as a draft of the part, not a finished MIDI
        performance. The work that remains — fixing note ends, deleting
        artefacts, adjusting velocity — is normal, and it is still much faster
        than playing the part in again from scratch.
      </p>
    </GuideLayout>
  );
}
