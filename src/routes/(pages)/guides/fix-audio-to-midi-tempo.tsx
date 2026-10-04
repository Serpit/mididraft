import { GuideLayout } from '@/components/home/guide-layout';
import { websiteConfig } from '@/config/website';
import { Routes } from '@/lib/routes';
import { seo } from '@/lib/seo';
import { createFileRoute } from '@tanstack/react-router';

const description =
  'Why a converted .mid lands at half speed, double speed or slowly out of time in your DAW, how the tempo is estimated, and how to set the right one.';

export const Route = createFileRoute('/(pages)/guides/fix-audio-to-midi-tempo')(
  {
    head: () =>
      seo('/guides/fix-audio-to-midi-tempo', {
        title: `Fix the wrong tempo after audio to MIDI | ${websiteConfig.metadata?.name}`,
        description,
        keywords:
          'audio to midi wrong tempo, midi half time double time, midi file wrong bpm, fix midi tempo after conversion, midi out of sync with audio',
        type: 'article',
      }),
    component: Page,
  }
);

function Page() {
  return (
    <GuideLayout
      title="Fix the wrong tempo after audio to MIDI"
      intro={description}
      outcome="A .mid whose notes sit on your DAW's grid at the speed you recorded them, and a way to tell which of three different tempo problems you have."
      next={{
        label: 'Clean up the notes themselves',
        to: Routes.GuideTooManyNotes,
      }}
    >
      <h2>What the tempo in the file actually does</h2>
      <p>
        Audio has no tempo, only time. The model reports every note as
        &ldquo;starts at 2.31 seconds, lasts 0.4 seconds&rdquo;. A MIDI file
        does not store seconds; it stores positions in beats. So the converter
        needs a tempo to turn one into the other, and it writes that tempo into
        the file.
      </p>
      <p>
        The consequence is worth holding on to:{' '}
        <strong>
          the tempo you export with decides how the notes are laid out against a
          grid, not how they sound.
        </strong>{' '}
        Played at the tempo written in the file, the part is always as fast as
        your recording. The trouble starts when that tempo and your
        project&rsquo;s tempo disagree.
      </p>

      <h2>Which problem do you have?</h2>

      <h3>
        1. The part plays at the right speed but looks half or double on the
        grid
      </h3>
      <p>
        The tempo in the file is wrong by a factor of two, and your DAW kept it.
        A 90&nbsp;BPM part exported as 180 plays correctly, but every beat spans
        two grid lines. Quantize then snaps to the wrong lines, and copying the
        part to the next bar goes wrong.
      </p>
      <p>
        <strong>Fix:</strong> set <em>Tempo</em> in the converter to the real
        value and export again. Do not stretch the part in the DAW to
        compensate.
      </p>

      <h3>2. The part is faster or slower than the rest of the project</h3>
      <p>
        Your DAW ignored the tempo in the file and placed the notes by beat
        against the project tempo. Every beat is now the length of the
        project&rsquo;s beat, not the file&rsquo;s. The speed changes by the
        ratio between the two: 100 in the file against 120 in the project plays
        20% faster.
      </p>
      <p>
        <strong>Fix:</strong> export with the tempo of the project you are
        importing into. Then nothing needs to be scaled either way.
      </p>

      <h3>3. The part starts in time and drifts</h3>
      <p>
        The tempo is close but not exact, so the error grows with every bar.
        This is common when you guessed the tempo by ear or accepted an estimate
        on a recording that was not played to a click. After sixteen bars a
        2&nbsp;BPM error is already more than a beat out.
      </p>
      <p>
        <strong>Fix:</strong> find the exact tempo (below) and export again. If
        the recording itself speeds up and slows down, no single tempo will
        hold, and the part needs to be conformed in the DAW instead.
      </p>

      <h2>How the estimate is made, and where it fails</h2>
      <p>
        The tempo shown in the converter is a hint, not a beat detector. It
        looks at the gaps between note starts, takes the middle one, treats it
        as one beat, and then doubles or halves the result until it lands
        between 70 and 180&nbsp;BPM. Gaps shorter than 50&nbsp;ms or longer than
        two seconds are ignored, and with fewer than four notes it falls back to
        120.
      </p>
      <p>That makes it wrong in predictable ways:</p>
      <ul>
        <li>
          <strong>Eighth-note parts read double.</strong> If most notes are
          eighths, the typical gap is half a beat, so a 90&nbsp;BPM part reports
          180.
        </li>
        <li>
          <strong>Slow, sustained parts read double or half.</strong> A
          chord-per-bar pad gives a gap of a whole bar, which is then folded
          into range at some multiple of the real tempo.
        </li>
        <li>
          <strong>Anything under 70 or over 180 cannot be reported.</strong> A
          60&nbsp;BPM ballad comes out as 120; a 200&nbsp;BPM track as 100.
        </li>
        <li>
          <strong>Swing and triplets</strong> make the gaps uneven, so the
          median can land between values.
        </li>
        <li>
          <strong>Once you move the slider, the estimate stops updating</strong>{' '}
          for that file, so your value is not overwritten when you change the
          sensitivity afterwards.
        </li>
      </ul>

      <h2>Finding the real tempo</h2>
      <ol>
        <li>
          <strong>Use the number you already have.</strong> If the audio came
          out of a project, that project&rsquo;s tempo is the answer. Nothing
          you can measure afterwards is as exact.
        </li>
        <li>
          <strong>Otherwise tap along.</strong> Play the original and tap a
          tempo in your DAW or a tap-tempo tool for about thirty seconds. Round
          to a whole number unless you hear drift.
        </li>
        <li>
          <strong>Sanity-check against the estimate.</strong> If the converter
          says 180 and your tapping says 90, you have the eighth-note case
          above. If tapping gives 90 and the estimate says 120, the part is
          probably not on a regular pulse and the estimate is not worth
          trusting.
        </li>
      </ol>

      <h2>Set it and export</h2>
      <ol>
        <li>
          Open the settings under the result in the{' '}
          <a href={Routes.Root}>audio to MIDI converter</a> and find{' '}
          <strong>Tempo</strong> in the second group. It runs from 40 to 220.
        </li>
        <li>
          Set it to the real tempo. Playback in the page does not change,
          because it plays the notes in seconds; what changes is the file you
          download.
        </li>
        <li>
          Export, import into your DAW at the project tempo, and compare the
          part to the original on the first and last bar. If both line up, you
          are done.
        </li>
      </ol>

      <h2>If the DAW asks about tempo on import</h2>
      <p>
        Most DAWs offer to take the tempo from the file or keep the
        project&rsquo;s. If the project already has the right tempo, keep it. If
        you are starting from the imported part, take the file&rsquo;s, but
        check it first: a wrong tempo you accept at this step becomes the
        project&rsquo;s tempo. The per-DAW steps are in the{' '}
        <a href={Routes.GuideFlStudio}>FL Studio</a>,{' '}
        <a href={Routes.GuideAbleton}>Ableton</a> and{' '}
        <a href={Routes.GuideReaper}>REAPER</a> guides.
      </p>

      <h2>Tempo and quantize</h2>
      <p>
        Quantize snaps note starts to a grid, so it is only as good as the tempo
        underneath it. Set the tempo first, then quantize, and keep the strength
        low if the take was played with feel. Quantizing against a wrong tempo
        moves notes confidently to the wrong places.
      </p>
    </GuideLayout>
  );
}
