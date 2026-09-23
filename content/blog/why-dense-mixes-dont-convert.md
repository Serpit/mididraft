---
title: Why a full mix will not convert to MIDI (and what to convert instead)
description: The four things in a finished track that break audio-to-MIDI conversion, and the practical workarounds when you cannot get a clean source.
date: 2026-09-22
category: Technique
image: /blog/dense-mixes.svg
---

Drop a finished song into any audio-to-MIDI converter and you get back
something disappointing: a dense cloud of short notes, a melody that keeps
jumping octaves, and chords that were never played. This is not a bug in a
particular tool. It is what happens when you ask any of them to un-mix a mix.

Here is what specifically goes wrong, in rough order of how much damage each
one does.

## 1. Everything lands on one track

There is no instrument separation step. The converter hears one signal and
reports the notes it finds in it. Bass, keys, guitar and vocal all arrive on a
single MIDI track, interleaved, with nothing marking which note came from
which source.

Even when the pitch detection is working well, the output is unusable as a
part, because it is four parts stacked on top of each other.

**What to do instead:** convert stems. If you have the session, solo one track
and bounce it. If you are working from someone else's finished track, you do
not have a clean source and no setting will create one.

## 2. Reverb turns one note into several

Reverb is the single most destructive thing for onset detection. A reverb tail
is a delayed, quieter copy of the note, and to a model looking for "energy
appearing at this frequency", a tail looks a lot like a new note starting.

You get: notes that never end, notes that repeat rapidly on one pitch, and
extra notes filling the gaps between the real ones.

**What to do instead:** bounce dry. If you cannot, raise the minimum note
length to 150 ms or more and turn on **merge repeated notes** at around
100 ms. You will lose real fast notes along with the artefacts — that is the
trade, and it is usually worth taking.

## 3. Distortion and compression invent harmonics

Both add energy at multiples of the original frequency. An overtone an octave
or a fifth above the played note is, to a pitch detector, indistinguishable
from someone actually playing that note.

This is why distorted guitar converts so badly, and why heavily compressed
mixes produce a halo of notes above the real melody line.

**What to do instead:** narrow the pitch range to the instrument's real range.
A bass line has no business above C4; excluding everything above it removes
most of the noise in one move. For guitar, record a clean DI rather than a mic
on a driven amp.

## 4. The loudest thing wins

In a mix, quiet parts are masked. A pad under a lead vocal may be inaudible to
the model even though you can hear it, because the vocal's energy dominates
every frequency band the pad occupies.

So you get the top line, roughly, and very little of what is underneath.

**What to do instead:** pick the section where the part you want is most
exposed. An intro, a breakdown, a solo bar. Converting eight exposed bars beats
converting a full chorus.

## The honest hierarchy

From best to worst, for conversion purposes:

1. **Dry, single instrument, one note at a time.** Works well. This is the
   case the technology is built for.
2. **Dry, single instrument, chords.** Usable. Expect missed inner voices.
3. **Wet single instrument, or two instruments.** A sketch. You will do real
   editing.
4. **Full mix.** An outline of the loudest line, buried in noise.
5. **Full mix, mastered and loud.** Do not bother.

Most frustration comes from people at level 4 or 5 expecting level 1 results,
often because a tool's marketing implied it was possible.

## When you genuinely only have the mix

Sometimes you are learning a part from a record and there is no stem to get.
That is a legitimate case, and conversion can still help — just not the way you
hoped.

- Convert a short, exposed section rather than the whole track.
- Treat the output as a **pitch reference**, not a part. It will often get the
  melody's shape and the general register right even when the note boundaries
  are wrong.
- Fix it in a piano roll against the original audio playing underneath. You are
  using the converter to skip the "what note is that?" step, not to do the
  whole job.
- If the result needs more correction than playing it in by ear would take,
  stop and play it in by ear. That is a real answer, and it is sometimes the
  right one.

## Test it in fifteen seconds

You do not have to take any of this on trust. The
[examples page](/examples) includes a deliberately hard clip — dense chords,
reverb, a noise floor — precisely so you can hear what failure sounds like
before you plan work around it. Run your own material through
[the free converter](/) for fifteen seconds and you will know within a minute
whether it is in range.
