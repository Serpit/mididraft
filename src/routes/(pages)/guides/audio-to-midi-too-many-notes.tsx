import { GuideLayout } from '@/components/home/guide-layout';
import { websiteConfig } from '@/config/website';
import { Routes } from '@/lib/routes';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

const description =
  'Audio to MIDI added notes you never played? Work out where the extras sit, which setting removes them, and when the right answer is a cleaner recording.';

export const Route = createFileRoute(
  '/(pages)/guides/audio-to-midi-too-many-notes'
)({
  head: () =>
    seo('/guides/audio-to-midi-too-many-notes', {
      title: `Audio to MIDI too many notes: how to remove them | ${websiteConfig.metadata?.name}`,
      description,
      keywords:
        'audio to midi too many notes, audio to midi extra notes, remove short notes midi, audio to midi messy notes, clean up converted midi',
      type: 'article',
    }),
  component: Page,
});

function Page() {
  return (
    <GuideLayout
      title="Audio to MIDI added too many notes: how to remove them"
      intro={description}
      outcome="A draft with the stray notes gone and the real ones intact, and a fast way to tell which setting to touch for which kind of extra note."
      next={{
        label: 'Fix the tempo before you quantize',
        to: Routes.GuideFixTempo,
      }}
    >
      <h2>Look at where the extras are first</h2>
      <p>
        &ldquo;Too many notes&rdquo; is three different problems, and each has a
        different fix. Turning one slider up and hoping works badly, because the
        same slider that removes the junk also removes the quiet notes you
        wanted. Look at the piano roll for a moment and see which pattern you
        have:
      </p>
      <ul>
        <li>
          <strong>Extras sit in one pitch region</strong> &mdash; a stripe at
          the very bottom or very top, or a row an octave above the real melody.
        </li>
        <li>
          <strong>Extras are very short</strong> &mdash; dots and dashes
          scattered between the real notes, at any pitch.
        </li>
        <li>
          <strong>One long note is chopped into repeats</strong> &mdash; the
          same pitch struck again and again where you held it.
        </li>
      </ul>

      <h2>Extras in one pitch region</h2>
      <p>
        These are not performance at all. Low stripes are usually rumble,
        handling noise or the body of a room; high rows are overtones, which the
        model sometimes reports as notes in their own right, especially on
        distorted guitar and bright synth leads.
      </p>
      <p>
        Use <strong>Pitch range</strong>. Set the lower and upper handles just
        outside the lowest and highest notes the instrument really played. It is
        the most precise tool here because it removes by what the note is, not
        by how loud or long it is, so it cannot touch a real note inside the
        range. A voice rarely needs anything below about C2 or above C6; a
        standard guitar starts at E2.
      </p>

      <h2>Very short extras</h2>
      <p>
        Blips between real notes come from noise, breath, string squeak and the
        edges of notes where the pitch wobbles. They have in common that they
        are short.
      </p>
      <ol>
        <li>
          Set <strong>Remove short notes</strong> to about 100&nbsp;ms and
          listen. Raise it in steps of 10 to 20&nbsp;ms. Stop as soon as a real
          note disappears.
        </li>
        <li>
          If real notes start to go before the junk does, you have reached what
          this slider can do. Go back a step and handle the rest with{' '}
          <strong>Sensitivity</strong>, below.
        </li>
        <li>
          Check fast passages specifically. Notes below roughly 80&nbsp;ms are
          fast runs as often as they are junk, and this slider cannot tell the
          difference.
        </li>
      </ol>

      <h3>Remove short notes or Minimum note length?</h3>
      <p>
        They look the same and are not. <strong>Minimum note length</strong>{' '}
        sits in the first group and tells the model what it may report, so
        changing it re-runs the note extraction.{' '}
        <strong>Remove short notes</strong> sits in the second group and just
        filters the notes you can already see, instantly and reversibly. Start
        with the second; reach for the first only if the second does not do it.
      </p>

      <h2>Quiet extras</h2>
      <p>
        Faint notes under a loud line are often reverb tails and bleed. Two ways
        to handle them, depending on whether you want to lose that quiet detail:
      </p>
      <ul>
        <li>
          <strong>Remove quiet notes</strong> drops everything below a share of
          the loudest note. It is blunt: it will also drop a deliberate soft
          passage. Use it on material with an even dynamic.
        </li>
        <li>
          <strong>Sensitivity</strong>, in the first group, sets how confident
          the model must be that a note started. Raise it from the default
          towards 0.6 to 0.7 for fewer, surer notes. Quiet notes go first, then
          marginal ones.
        </li>
      </ul>

      <h2>A held note chopped into repeats</h2>
      <p>
        The model saw a false restart on a note that was still sounding. It is
        typical on piano with pedal, bowed strings, pads and any held vocal. The
        notes are real; there are just too many of them.
      </p>
      <p>
        Set <strong>Merge repeated notes</strong> to 80 to 150&nbsp;ms. It joins
        same-pitch notes separated by a gap shorter than that, which restores
        the long note. Keep it below the shortest gap you actually played
        &mdash; a fast repeated-note figure should stay repeated.
      </p>
      <p>
        If notes overlap where they should end, add{' '}
        <strong>Trim overlaps</strong>. It stops the same pitch sounding twice
        at once, which in a DAW is what makes a part sound muddy even when the
        notes are right.
      </p>

      <h2>The order that wastes least</h2>
      <ol>
        <li>
          <strong>Pitch range</strong> &mdash; removes whole categories without
          risk.
        </li>
        <li>
          <strong>Sensitivity</strong> &mdash; fewer, more certain notes.
        </li>
        <li>
          <strong>Merge repeated notes</strong> and{' '}
          <strong>Trim overlaps</strong> &mdash; repair, rather than remove.
        </li>
        <li>
          <strong>Remove short notes</strong> &mdash; the last sweep.
        </li>
        <li>
          <strong>Remove quiet notes</strong> &mdash; only if reverb is still
          visible.
        </li>
      </ol>
      <p>
        Everything in the second group is reversible.{' '}
        <em>Reset to the raw result</em> brings back the unfiltered notes, so
        you can try an aggressive value to see what it removes before settling.
      </p>

      <h2>Judge by ear, then by eye</h2>
      <p>
        A busy piano roll can sound right, and a tidy one can be missing the
        line you cared about. Loop a few seconds and flip between{' '}
        <strong>Original</strong> and <strong>MIDI</strong> after every change.
        If a change makes the MIDI sound less like the original, undo it, even
        if the roll looks cleaner.
      </p>

      <h2>When the settings are not the answer</h2>
      <p>
        If you have worked through the list and the roll is still full of notes
        that were never played, the recording is the problem. The usual causes
        are reverb, distortion, and more than one instrument. They are covered
        in{' '}
        <a href={Routes.GuideImproveResults}>
          how to get better audio to MIDI results
        </a>
        , and the <a href={Routes.Examples}>examples page</a> has one clip that
        is hard on purpose, so you can hear what it looks like when no setting
        will help. Re-recording dry, or converting one instrument at a time,
        will beat any amount of cleanup.
      </p>
      <p>
        Once the notes are right, the same filters can be applied to many files
        at once with <a href={Routes.MidiCleanup}>MIDI cleanup</a> and{' '}
        <a href={Routes.BatchAudioToMidi}>batch conversion</a>.
      </p>
    </GuideLayout>
  );
}
