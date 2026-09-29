import { GuideLayout } from '@/components/home/guide-layout';
import { websiteConfig } from '@/config/website';
import { Routes } from '@/lib/routes';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

// TODO: add real screenshots of each step once captured from a live session.

const description =
  'REAPER has no built-in pitch-to-MIDI conversion. Here is how to render a clean source, convert it to a .mid, and import it onto a track at the right tempo.';

export const Route = createFileRoute('/(pages)/guides/audio-to-midi-reaper')({
  head: () =>
    seo('/guides/audio-to-midi-reaper', {
      title: `Audio to MIDI in REAPER: convert and import a .mid | ${websiteConfig.metadata?.name}`,
      description,
      keywords:
        'audio to midi reaper, reaper convert audio to midi, import midi reaper, mp3 to midi reaper',
      type: 'article',
    }),
  component: Page,
});

function Page() {
  return (
    <GuideLayout
      title="Audio to MIDI in REAPER"
      intro={description}
      outcome="A MIDI item on a REAPER track, at the project tempo, playing through any instrument you load."
      next={{
        label: 'Get better results from any recording',
        to: Routes.GuideImproveResults,
      }}
    >
      <h2>What REAPER can and cannot do here</h2>
      <p>
        REAPER edits MIDI very well, but it does not detect pitch in audio and
        write notes from it. If you own Melodyne, REAPER hosts it through ARA
        and you can drag notes out as MIDI from there. Otherwise the job is:
        convert the audio outside REAPER, then import the <code>.mid</code>.
      </p>

      <h2>Render a clean source</h2>
      <ol>
        <li>
          Solo the track you want. One instrument or one voice converts far
          better than a full mix.
        </li>
        <li>
          Make a time selection over the bars you want — somewhere between
          fifteen seconds and a minute.
        </li>
        <li>
          Open <em>File → Render</em>. Set <em>Source</em> to{' '}
          <em>Selected tracks (stems)</em> and <em>Bounds</em> to{' '}
          <em>Time selection</em>.
        </li>
        <li>
          Choose WAV at 44.1&nbsp;kHz. Bypass reverb and delay on the track
          first if you can — tails smear note onsets, which is the most common
          cause of extra notes.
        </li>
        <li>Note your project tempo. You will set it in the converter.</li>
      </ol>

      <h2>Convert</h2>
      <ol>
        <li>
          Drop the WAV into the{' '}
          <a href={Routes.Root}>audio to MIDI converter</a>. It runs in your
          browser, so the file is not uploaded anywhere.
        </li>
        <li>Select the section you want — up to sixty seconds per run.</li>
        <li>
          Use the <strong>Original / MIDI</strong> switch while it plays. Loop
          the selection and listen for wrong pitches rather than reading the
          piano roll.
        </li>
        <li>
          Set <strong>tempo</strong> to your REAPER project tempo before you
          export.
        </li>
        <li>
          Download the <code>.mid</code>.
        </li>
      </ol>

      <h2>Import into REAPER</h2>
      <ol>
        <li>
          Place the edit cursor where the part should start — usually the same
          position your time selection began.
        </li>
        <li>
          Drag the <code>.mid</code> onto an empty track, or select the track
          and use <em>Insert → Media file</em>. REAPER creates a MIDI item.
        </li>
        <li>
          Add an instrument to the track&rsquo;s FX chain. ReaSynth is enough to
          check the notes; swap in whatever you actually want later.
        </li>
        <li>
          Double-click the item to open the MIDI editor and check the part
          against the original.
        </li>
      </ol>
      <p>Two things worth knowing:</p>
      <ul>
        <li>
          <strong>Tempo.</strong> Depending on your preferences, REAPER may ask
          whether to import the file&rsquo;s tempo. If your project tempo is
          already right, keep it. If the notes land at the wrong spacing, fix
          the tempo in the converter and export again rather than stretching the
          item.
        </li>
        <li>
          <strong>One track per file.</strong> The converter always exports a
          single track, so you get one item, not a spread of tracks.
        </li>
      </ul>

      <h2>Common problems</h2>
      <ul>
        <li>
          <strong>Notes drift out of time as the item plays.</strong> Tempo
          mismatch between the exported file and your project.
        </li>
        <li>
          <strong>The part starts in the wrong place.</strong> The item is
          inserted at the edit cursor. Move it to where the time selection
          began.
        </li>
        <li>
          <strong>A cloud of short notes.</strong> Reverb or a noisy source.
          Raise minimum note length in the converter, and render the audio dry.
        </li>
        <li>
          <strong>Melody is right, harmony is missing.</strong> Expected on
          anything dense. Convert each instrument separately if you have the
          stems.
        </li>
        <li>
          <strong>Notes an octave out.</strong> An overtone read as a
          fundamental. Narrow the pitch range and convert again, or transpose
          those notes in the MIDI editor.
        </li>
      </ul>

      <h2>Afterwards</h2>
      <p>
        Treat the result as a draft of the part, not a finished MIDI
        performance. Fixing note ends, deleting artefacts and adjusting velocity
        in REAPER&rsquo;s MIDI editor is normal, and still much faster than
        playing the part in again from scratch.
      </p>
    </GuideLayout>
  );
}
