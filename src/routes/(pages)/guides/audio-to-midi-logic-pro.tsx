import { GuideLayout } from '@/components/home/guide-layout';
import { websiteConfig } from '@/config/website';
import { Routes } from '@/lib/routes';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

// TODO: add real screenshots of each step once captured from a live session.
// Placeholder images would be worse than none.

const description =
  'Two ways to get MIDI from audio in Logic Pro: its own Flex Pitch conversion, or a converted .mid on a software instrument track — and which one fits your material.';

export const Route = createFileRoute('/(pages)/guides/audio-to-midi-logic-pro')(
  {
    head: () =>
      seo('/guides/audio-to-midi-logic-pro', {
        title: `Audio to MIDI in Logic Pro: Flex Pitch or a converted .mid | ${websiteConfig.metadata?.name}`,
        description,
        keywords:
          'audio to midi logic pro, logic pro flex pitch to midi, import midi logic pro, mp3 to midi logic pro',
        type: 'article',
      }),
    component: Page,
  }
);

function Page() {
  return (
    <GuideLayout
      title="Audio to MIDI in Logic Pro"
      intro={description}
      outcome="A MIDI region on a software instrument track in Logic, at your project tempo, ready to edit in the Piano Roll."
      next={{
        label: 'The same thing in GarageBand',
        to: Routes.GuideGarageBand,
      }}
    >
      <h2>First: try Flex Pitch</h2>
      <p>
        Logic has audio-to-MIDI built in. For a single melody line that is
        already in your project, it is the quickest route:
      </p>
      <ol>
        <li>Double-click the audio region to open the Audio Track Editor.</li>
        <li>
          Click the <em>Show/Hide Flex</em> button and choose{' '}
          <em>Flex Pitch</em> from the Flex Mode pop-up menu.
        </li>
        <li>
          Fix any wrongly detected notes in the editor, then choose{' '}
          <em>Edit → Create MIDI Track from Flex Pitch Data</em>.
        </li>
      </ol>
      <p>
        Logic adds a new software instrument track under the audio track, with a
        MIDI region for each audio region.
      </p>

      <h2>When to use a converter instead</h2>
      <p>
        Flex Pitch is built for monophonic material — one note at a time. Come
        back here when:
      </p>
      <ul>
        <li>
          The part has chords. Flex Pitch tracks a single pitch, so a piano
          chord or a strummed guitar comes out as one line at best.
        </li>
        <li>
          You want to hear the MIDI against the original and adjust sensitivity,
          note length and cleanup before anything touches your project.
        </li>
        <li>
          The audio is an MP3 or a voice memo you have not imported yet, and you
          only want the notes.
        </li>
      </ul>

      <h2>Export a clean source from Logic</h2>
      <ol>
        <li>
          Solo the track you want. If you only have a full mix and are on Logic
          Pro 11 or later, the Stem Splitter can pull out vocals, bass, drums or
          other instruments first — convert the stem, not the mix.
        </li>
        <li>
          Set a cycle area over four to eight bars and use{' '}
          <em>File → Bounce → Project or Section</em>, choosing a WAV (PCM)
          file.
        </li>
        <li>
          Bypass reverb and delay on that track before bouncing if you can.
          Tails smear note onsets and turn into extra notes.
        </li>
        <li>Note the project tempo in the LCD. You will need it next.</li>
      </ol>

      <h2>Convert</h2>
      <ol>
        <li>
          Drop the WAV into the{' '}
          <a href={Routes.Root}>audio to MIDI converter</a>. It runs in your
          browser, so nothing is uploaded.
        </li>
        <li>Select the section you want — up to sixty seconds per run.</li>
        <li>
          Play it and flip between <strong>Original</strong> and{' '}
          <strong>MIDI</strong>. Too many short notes: raise the minimum note
          length. Notes missing: lower the sensitivity.
        </li>
        <li>
          Set <strong>tempo</strong> to your Logic project tempo, then download
          the <code>.mid</code>.
        </li>
      </ol>

      <h2>Import into Logic</h2>
      <p>
        Drag the <code>.mid</code> from the Finder onto an existing software
        instrument track, or into the empty space below your tracks to get a new
        one. <em>File → Import → MIDI File</em> does the same thing.
      </p>
      <p>
        Logic may ask whether to import the tempo information from the file.
        Choose <strong>No</strong> if your project tempo is already right —
        importing it replaces the tempo of the whole project. Choose{' '}
        <strong>Yes</strong> only in an empty project where you want Logic to
        take its tempo from the file.
      </p>
      <p>
        The region lands at the playhead or wherever you dropped it. Move it so
        its start lines up with the bar you bounced from, and it should sit
        under the original audio note for note.
      </p>

      <h2>Common problems</h2>
      <ul>
        <li>
          <strong>Notes drift away from the audio.</strong> The tempo in the
          converter did not match the project. Set it and export again rather
          than time-stretching the region.
        </li>
        <li>
          <strong>The whole project changed tempo.</strong> You answered Yes to
          importing tempo information. Undo, and import again with No.
        </li>
        <li>
          <strong>Notes an octave out.</strong> An overtone read as the note.
          Narrow the pitch range in the converter, or transpose those notes in
          the Piano Roll.
        </li>
        <li>
          <strong>Long, overlapping notes on guitar.</strong> Turn on{' '}
          <strong>trim overlaps</strong> before exporting.
        </li>
      </ul>

      <h2>Afterwards</h2>
      <p>
        Treat the region as a draft of the part. Logic&rsquo;s Piano Roll
        quantize and velocity tools are the right place for the last round of
        fixes, and it is still faster than playing the part in again.
      </p>
    </GuideLayout>
  );
}
