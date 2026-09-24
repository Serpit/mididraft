// Generates the site's example audio from scratch, so every clip is original
// and license-clear. Additive synthesis + ADSR, rendered to 16-bit WAV.
import { writeFileSync, mkdirSync } from 'node:fs';

const SR = 44100;

const midiToHz = (m) => 440 * 2 ** ((m - 69) / 12);

function adsr(t, dur, { a = 0.01, d = 0.12, s = 0.6, r = 0.25 }) {
  if (t < 0) return 0;
  if (t < a) return t / a;
  if (t < a + d) return 1 - (1 - s) * ((t - a) / d);
  if (t < dur) return s;
  const rt = t - dur;
  if (rt < r) return s * (1 - rt / r);
  return 0;
}

// Timbres as harmonic amplitude series.
const TIMBRES = {
  piano: {
    partials: [1, 0.45, 0.22, 0.12, 0.07, 0.04],
    env: { a: 0.006, d: 0.35, s: 0.28, r: 0.35 },
    decay: 1.6,
  },
  guitar: {
    partials: [1, 0.6, 0.35, 0.18, 0.1, 0.06, 0.03],
    env: { a: 0.004, d: 0.25, s: 0.22, r: 0.3 },
    decay: 2.2,
  },
  pad: {
    partials: [1, 0.5, 0.3, 0.15],
    env: { a: 0.08, d: 0.3, s: 0.7, r: 0.5 },
    decay: 0.5,
  },
};

function render(notes, durationSeconds, timbreName, opts = {}) {
  const timbre = TIMBRES[timbreName];
  const n = Math.ceil(durationSeconds * SR);
  const out = new Float32Array(n);

  for (const [pitch, start, dur, vel = 0.8] of notes) {
    const f0 = midiToHz(pitch);
    const startSample = Math.floor(start * SR);
    const tail = timbre.env.r + 0.05;
    const endSample = Math.min(n, Math.floor((start + dur + tail) * SR));
    // Slight detune per note keeps repeated pitches from phase-cancelling.
    const detune = 1 + (Math.random() - 0.5) * 0.0015;

    for (let i = startSample; i < endSample; i++) {
      const t = (i - startSample) / SR;
      const env = adsr(t, dur, timbre.env) * Math.exp(-t * timbre.decay * 0.35);
      if (env <= 0) continue;
      let sample = 0;
      for (let h = 0; h < timbre.partials.length; h++) {
        const amp = timbre.partials[h] * Math.exp(-t * timbre.decay * h * 0.25);
        sample += amp * Math.sin(2 * Math.PI * f0 * detune * (h + 1) * t);
      }
      out[i] += (sample / timbre.partials.length) * env * vel;
    }
  }

  if (opts.noise) {
    for (let i = 0; i < n; i++) out[i] += (Math.random() * 2 - 1) * opts.noise;
  }

  if (opts.reverb) {
    // Cheap Schroeder-ish smear, enough to show what reverb does to onsets.
    const delays = [0.029, 0.037, 0.041, 0.053].map((d) => Math.floor(d * SR));
    const wet = new Float32Array(n);
    for (const delay of delays) {
      let feedback = 0.76;
      for (let i = delay; i < n; i++) {
        wet[i] += out[i - delay] * feedback + wet[i - delay] * 0.35;
      }
      void feedback;
    }
    for (let i = 0; i < n; i++)
      out[i] = out[i] * (1 - opts.reverb) + wet[i] * opts.reverb * 0.35;
  }

  // Normalise with a little headroom.
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(out[i]));
  const gain = peak > 0 ? 0.89 / peak : 1;
  for (let i = 0; i < n; i++) out[i] *= gain;

  // 8ms fades so the clip never clicks.
  const fade = Math.floor(0.008 * SR);
  for (let i = 0; i < fade; i++) {
    out[i] *= i / fade;
    out[n - 1 - i] *= i / fade;
  }
  return out;
}

function toWav(samples) {
  const dataBytes = samples.length * 2;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataBytes, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SR, 24);
  buffer.writeUInt32LE(SR * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  return buffer;
}

const beat = 60 / 96; // 96 BPM
const step = beat / 2;

// 1. Clear single-note piano melody — the ideal case.
const pianoMelody = [];
{
  const line = [
    [72, 0, 2],
    [74, 2, 2],
    [76, 4, 2],
    [79, 6, 2],
    [77, 8, 2],
    [76, 10, 2],
    [74, 12, 4],
    [72, 16, 2],
    [69, 18, 2],
    [71, 20, 2],
    [74, 22, 2],
    [72, 24, 8],
  ];
  for (const [pitch, startStep, lenSteps] of line) {
    pianoMelody.push([
      pitch,
      startStep * step,
      lenSteps * step * 0.92,
      0.75 + Math.random() * 0.2,
    ]);
  }
}

// 2. Guitar arpeggio — still monophonic per moment, slightly faster.
const guitarArp = [];
{
  const shapes = [
    [52, 57, 60, 64],
    [50, 57, 62, 65],
    [48, 55, 60, 64],
    [47, 55, 59, 62],
  ];
  let stepIndex = 0;
  for (const shape of shapes) {
    for (const pitch of [...shape, ...shape.slice(0, 3).reverse()]) {
      guitarArp.push([
        pitch,
        stepIndex * step * 0.75,
        step * 0.9,
        0.62 + Math.random() * 0.25,
      ]);
      stepIndex++;
    }
  }
}

// 3. Dense chord mix with reverb and noise — the honest failure case.
const denseMix = [];
{
  const chords = [
    [48, 52, 55, 59, 62],
    [45, 50, 53, 57, 60],
    [43, 47, 50, 55, 59],
    [41, 48, 52, 57, 60],
  ];
  chords.forEach((chord, index) => {
    for (const pitch of chord) {
      denseMix.push([
        pitch,
        index * beat * 2,
        beat * 1.9,
        0.5 + Math.random() * 0.3,
      ]);
    }
    // A melody riding on top, which is what a user actually wants back.
    const melody = [67, 69, 71, 72, 71, 69];
    melody.forEach((pitch, i) => {
      denseMix.push([
        pitch + index,
        index * beat * 2 + i * step * 0.6,
        step * 0.55,
        0.45,
      ]);
    });
  });
}

mkdirSync('public/examples', { recursive: true });

writeFileSync(
  'public/examples/piano-melody.wav',
  toWav(render(pianoMelody, 22, 'piano'))
);
writeFileSync(
  'public/examples/guitar-arpeggio.wav',
  toWav(render(guitarArp, 18, 'guitar'))
);
writeFileSync(
  'public/examples/dense-mix.wav',
  toWav(render(denseMix, 16, 'pad', { noise: 0.012, reverb: 0.45 }))
);

console.log('examples written');
