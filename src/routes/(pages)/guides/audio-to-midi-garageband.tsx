import { GuideLayout } from '@/components/home/guide-layout';
import { websiteConfig } from '@/config/website';
import { Routes } from '@/lib/routes';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

// TODO: add real screenshots of each step once captured from a live session.
// Placeholder images would be worse than none.

const description =
  'GarageBand cannot turn audio into MIDI on its own. Here is how to convert a recording to a .mid and put it on a software instrument track, on the Mac and on iPhone or iPad.';

export const Route = createFileRoute(
  '/(pages)/guides/audio-to-midi-garageband'
)({
  head: () =>
    seo('/guides/audio-to-midi-garageband', {
      title: `Audio to MIDI in GarageBand: convert and import a .mid | ${websiteConfig.metadata?.name}`,
      description,
      keywords:
        'audio to midi garageband, garageband convert audio to midi, import midi garageband, mp3 to midi garageband',
      type: 'article',
    }),
  component: Page,
});

function Page() {
  return (
    <GuideLayout
      title="Audio to MIDI in GarageBand"
      intro={description}
      outcome="A software instrument track in GarageBand playing your part, with notes you can edit in the Piano Roll."
      next={{
        label: 'The same thing in Logic Pro',
        to: Routes.GuideLogicPro,
      }}
    >
      <h2>Why this takes a converter</h2>
      <p>
        GarageBand has no audio-to-MIDI command, and it does not have the Flex
        Pitch conversion that Logic Pro has. What it does handle well is
        importing a MIDI file. So the job is: convert the audio outside
        GarageBand, then bring the <code>.mid</code> in.
      </p>

      <h2>Get a clean source</h2>
      <ul>
        <li>
          <strong>Already in GarageBand?</strong> Solo the track, set the cycle
          area over the bars you want, and use{' '}
          <em>Share → Export Song to Disk</em> as WAV (uncompressed).
        </li>
        <li>
          <strong>A voice memo or phone recording?</strong> Use it directly.
          Humming or singing into the phone works if the room is quiet and
          nothing else is playing.
        </li>
      </ul>
      <p>
        Either way, one instrument or one voice at a time converts far better
        than a mix, and a dry recording beats one with reverb.
      </p>

      <h2>Convert</h2>
      <ol>
        <li>
          Open the <a href={Routes.Root}>audio to MIDI converter</a> and drop in
          the file. MP3, WAV and M4A all work; the conversion runs in your
          browser and nothing is uploaded.
        </li>
        <li>Select up to sixty seconds.</li>
        <li>
          Play it and switch between <strong>Original</strong> and{' '}
          <strong>MIDI</strong>. If the MIDI is a scatter of short notes, raise
          the minimum note length; if notes are missing, lower the sensitivity.
        </li>
        <li>
          Set the <strong>tempo</strong> — to your GarageBand project tempo if
          you exported from one, otherwise to whatever the converter estimated
          or you know the take to be. Write it down.
        </li>
        <li>
          Download the <code>.mid</code>.
        </li>
      </ol>

      <h2>Import on the Mac</h2>
      <ol>
        <li>
          <strong>Set the project tempo first</strong>, in the LCD at the top of
          the window, to the value you exported with. Do not rely on GarageBand
          picking the tempo up from the file.
        </li>
        <li>
          Drag the <code>.mid</code> from the Finder onto a software instrument
          track, or into the empty space below the tracks to get a new one.
        </li>
        <li>
          Pick a sound in the Library. The MIDI carries pitch, timing, length
          and velocity, so it will play on any instrument, not just a piano.
        </li>
      </ol>

      <h2>Import on iPhone or iPad</h2>
      <ol>
        <li>
          Save the <code>.mid</code> to the Files app or iCloud Drive.
        </li>
        <li>
          In GarageBand, open Tracks view, tap the Loop Browser button, choose{' '}
          <em>Files</em>, then <em>Browse items from the Files app</em> and pick
          the file.
        </li>
        <li>
          Drag it into the Tracks area. It arrives on a Keyboard track. Set the
          song tempo to match before you do, for the same reason as on the Mac.
        </li>
      </ol>

      <h2>Common problems</h2>
      <ul>
        <li>
          <strong>Notes run ahead of or behind the beat.</strong> The project
          tempo does not match the tempo you exported with. Change the project
          tempo, or set the tempo in the converter and export again.
        </li>
        <li>
          <strong>The part sounds busy and fluttery.</strong> Usually reverb in
          the source, or slides in a vocal. Raise the minimum note length and
          merge repeated notes, then export again.
        </li>
        <li>
          <strong>Chords come out thin.</strong> Expected on dense material. A
          single melody line converts much better than full chords.
        </li>
      </ul>

      <h2>Afterwards</h2>
      <p>
        Open the region in the Piano Roll and fix what remains — a stray note, a
        note end that runs on. It is a draft of the part, and editing a draft is
        still quicker than playing it in again.
      </p>
    </GuideLayout>
  );
}
