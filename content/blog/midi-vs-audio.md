---
title: MIDI is not audio — and why that decides what a converter can do
description: What a MIDI file actually contains, what an audio file contains, and why converting one to the other is a guess rather than a decode.
date: 2026-09-22
category: Fundamentals
image: /blog/midi-vs-audio.svg
---

Most disappointment with audio-to-MIDI tools comes from one wrong assumption:
that converting audio to MIDI is like converting a WAV to an MP3 — a change of
container, with the same information inside. It is not. The two formats hold
completely different things, and understanding that tells you exactly what any
converter can and cannot do for you.

## What is actually in each file

An **audio file** is a recording of air pressure over time. Forty-four
thousand numbers per second, each describing where a speaker cone should be.
It contains everything at once: the instrument, the room, the noise floor, the
reverb, every other instrument playing at the same moment — all summed into a
single stream of numbers.

A **MIDI file** contains no sound at all. It is a list of instructions:

```
note 72 on,  velocity 98, at 0.000s
note 72 off,              at 0.575s
note 74 on,  velocity 91, at 0.625s
```

That is the whole idea. Pitch, when it starts, when it stops, how hard.
Nothing about timbre, nothing about the room, nothing about what instrument
plays it. A MIDI file is a score, and it sounds like whatever instrument you
point it at.

This is why a 3-minute MIDI file is a few kilobytes and a 3-minute WAV is 30
megabytes. The MIDI file is not a compressed version of the audio. It is a
different, much smaller kind of fact about the music.

## Why one direction is easy and the other is hard

**MIDI to audio is deterministic.** You have the instructions and you have an
instrument; you execute them. Every DAW does this thousands of times a second
without breaking a sweat. Nothing is being guessed.

**Audio to MIDI is inference.** You have the summed result and you are trying
to recover the instructions that produced it. That is a genuinely hard,
sometimes impossible problem, because information was destroyed in the mix:

- Two instruments playing the same note become one set of overtones. There is
  no reliable way to know there were two.
- A note's release blurs into the next note's attack. Where does one end?
- Reverb is a copy of the note arriving later and quieter. Is that a new note
  or an echo of the last one?
- An overtone at exactly twice the frequency looks identical to a real note an
  octave up.

A converter answers all of these with probabilities, not certainties. That is
why every honest tool in this space talks about drafts rather than
transcriptions, and why accuracy varies so wildly between a dry piano take and
a mastered track.

## What this means in practice

**Convert the cleanest source you can reach.** Not the mix — the stem. Not the
stem with reverb — the dry stem. Every processing stage between the performance
and the file you convert has destroyed information the model now has to guess
at.

**Expect to keep the pitches and fix the rest.** In a usable conversion, the
notes are mostly right and the timing is roughly right. Note lengths, stray
short notes and the occasional octave error are the normal editing load. That
is still far faster than playing a part in by ear.

**Do not expect stem separation.** Asking a converter to turn a finished song
into accurate separate instrument parts is asking it to undo the mix. Some
tools attempt it; none of them do it reliably, and a tool that promises it
without qualification is overselling.

**What you get back is more flexible than what you put in.** This is the real
payoff. Once a melody is MIDI you can transpose it without artefacts, change
the tempo without stretching anything, swap the instrument entirely, quantize
it, or hand it to a notation program. None of that is possible with the
recording.

## The useful mental model

Think of audio-to-MIDI as transcription by ear, done fast. A good musician
listening to a clean solo piano recording writes down most of the notes and
misses some detail. The same musician listening to a full mix gets the top line
and a rough sense of the chords. A converter behaves the same way, on the same
material, for the same reasons — and, like a transcribing musician, it works
best when you give it something clear to listen to.

[Try it on a clip of your own](/) — fifteen seconds is enough to tell whether
your material is in the range where this works.
