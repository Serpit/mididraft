/**
 * Demo clips shipped with the site.
 *
 * Every clip is synthesised from scratch for MidiDraft, so they carry no
 * third-party rights and anyone can re-run them. One of them is deliberately
 * a case the model handles badly — a demo reel of only wins would not tell
 * you whether the tool works on your material.
 */
export interface Example {
  slug: string;
  shortLabel: string;
  title: string;
  fileName: string;
  audioUrl: string;
  /** What the clip is, in the terms a producer would use. */
  description: string;
  /** What to expect from the transcription, stated plainly. */
  expectation: string;
  /** How the clip was made, so the test is reproducible. */
  conditions: string;
  kind: 'clear' | 'limitation';
}

export const EXAMPLES: Example[] = [
  {
    slug: 'piano-melody',
    shortLabel: 'Piano melody',
    title: 'Clear single-note piano melody',
    fileName: 'piano-melody.wav',
    audioUrl: '/examples/piano-melody.wav',
    description:
      'One note at a time, moderate tempo, no effects. This is the material audio-to-MIDI handles best.',
    expectation:
      'Expect nearly every note start and pitch to come through. You may still want to trim note ends before dropping it into a project.',
    conditions:
      'Synthesised piano-like tone, 96 BPM, 22 seconds, mono WAV at 44.1 kHz, no reverb or compression.',
    kind: 'clear',
  },
  {
    slug: 'guitar-arpeggio',
    shortLabel: 'Guitar arpeggio',
    title: 'Plucked guitar arpeggio',
    fileName: 'guitar-arpeggio.wav',
    audioUrl: '/examples/guitar-arpeggio.wav',
    description:
      'Four chord shapes played one string at a time, with notes ringing into each other.',
    expectation:
      'Pitches land, but overlapping ring-out produces longer notes than you played, and sometimes a doubled onset. "Trim overlaps" and "merge repeated notes" are the two controls that help here.',
    conditions:
      'Synthesised plucked tone, 96 BPM, 18 seconds, mono WAV at 44.1 kHz, natural ring-out, no effects.',
    kind: 'clear',
  },
  {
    slug: 'vocal-line',
    shortLabel: 'Sung line',
    title: 'Sung vowel with slides and vibrato',
    fileName: 'vocal-line.wav',
    audioUrl: '/examples/vocal-line.wav',
    description:
      'A voice-like "ah" singing two short phrases, sliding between notes with vibrato on the held ones. Synthesised, not a real singer.',
    expectation:
      'The pitches come through, but vibrato on a held note reads as a string of fresh onsets, so long notes arrive chopped into short repeats of the same pitch. "Merge repeated notes" at around 150 ms joins them back into single notes.',
    conditions:
      'Synthesised vowel with formant shaping, 120 BPM, 18 seconds, mono WAV at 44.1 kHz, 70 ms slides, vibrato at 5.4 Hz, light breath noise, no reverb.',
    kind: 'clear',
  },
  {
    slug: 'dense-mix',
    shortLabel: 'Dense mix (hard)',
    title: 'Dense chords with reverb — where this breaks down',
    fileName: 'dense-mix.wav',
    audioUrl: '/examples/dense-mix.wav',
    description:
      'Five-note pad chords, a melody on top, added reverb and a noise floor. Closer to a finished mix than to a clean take.',
    expectation:
      'Expect a rough sketch at best: missed inner voices, extra notes smeared by the reverb tail, and an unreliable melody line. Use this to judge whether the tool suits your material before you pay for anything.',
    conditions:
      'Synthesised pad chords plus melody, 96 BPM, 16 seconds, mono WAV at 44.1 kHz, artificial reverb at roughly 45% wet and a low noise floor.',
    kind: 'limitation',
  },
];

export function getExample(slug: string): Example | undefined {
  return EXAMPLES.find((example) => example.slug === slug);
}
