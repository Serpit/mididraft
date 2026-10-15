---
title: How to export MIDI from FL Studio, Ableton, Logic and REAPER
description: Where the MIDI export command lives in each DAW, whether it exports one clip or the whole project, and what gets lost on the way out.
date: 2026-10-15
category: Workflow
image: /blog/export-midi.svg
---

Every major DAW can write a standard `.mid` file, but each one hides the
command in a different place, and they disagree about what "export MIDI"
means. Some export one clip, some export the whole project, some do both
from different menus. This page is the short version for the four DAWs our
readers use most, plus what to check before you send the file to someone else.

Menu names change between versions. The paths below match current releases
as far as we could confirm them; if yours differ, look in the same menu for
something close.

## Before you export: what a MIDI file keeps

A `.mid` file holds notes, velocities, tempo and, depending on the DAW,
controller data. It does **not** hold your instruments, presets, effects,
audio clips or mixer settings. Whoever opens it — you in another DAW, a
collaborator, a hardware synth — hears it through whatever sound they load.

So before exporting:

- **Freeze the parts you care about as notes.** Arpeggiators, chord
  generators and MIDI effects usually play live and are not written into the
  file. Render them to MIDI inside the DAW first if you want their output.
- **Check the tempo.** The file stores positions in beats plus a tempo. If the
  tempo is wrong, the part lands in the wrong place on the other side. Our
  [tempo guide](/guides/fix-audio-to-midi-tempo) explains the three ways this
  goes wrong.
- **Decide: one part or the whole song.** One clip per file is the most
  reliable way to move parts between DAWs. Whole-project exports work, but
  each DAW maps tracks and channels its own way.

## FL Studio

**One pattern:** open it in the piano roll, then use the piano roll's own
menu: *File → Export as MIDI file*. The shortcut is Ctrl+Shift+M (Cmd on
Mac). This writes just that pattern's notes for that channel.

**The whole project:** use the project export dialog (Ctrl/Cmd+R) and choose
MIDI as the format. Image-Line's manual recommends running *Tools → Macros →
Prepare for MIDI export* first, which sets every channel up so its notes come
through. Expect notes and velocity; automation and plugin settings will not
survive.

**"FLP to MIDI":** there is no way to read an `.flp` without FL Studio — the
project format is FL's own. If you have FL, open the project and export as
above. If you only have the rendered audio of the song, you are converting
audio to MIDI instead, which is a guess rather than an export (more on that
at the end).

## Ableton Live

**One clip:** right-click a MIDI clip in Session or Arrangement view and
choose *Export MIDI Clip…*. You get a standard MIDI file containing that
clip's notes.

**Several clips or a whole arrangement:** Live does not write a multi-track
`.mid` of the whole set. Consolidate the section you want on each track
(select it, then Ctrl/Cmd+J) and export each consolidated clip on its own.
It is more files, but every DAW opens them without surprises.

## Logic Pro (Mac)

Select one or more MIDI regions, then choose *File → Export → Selection as
MIDI File*, name it and save. Selecting several regions gives you one file.

A single region is saved as a Format 1 file unless you turn on *"Export MIDI
File…" saves single MIDI Regions as Format 0* under *Logic Pro → Settings →
General → Project Handling*. Some older hardware and phone apps only read
Format 0, so turn it on if the receiving end complains.

Apple's own advice is worth repeating: normalize and, if needed, quantize
regions before exporting, because region parameters that Logic applies on
playback are not all written into the file.

## REAPER

**The whole project or selected tracks:** *File → Export project MIDI…*
opens a consolidate dialog. Pick the time range (the entire project or the
time selection), whether to export all tracks or *selected tracks only*, and
whether to merge everything onto one MIDI track or keep one track per track.

**One item:** open it in the MIDI editor and use the editor's *File* menu
(*Export to new MIDI file…* — the exact wording varies a little by version).
That saves a copy of the item as a standalone `.mid`.

REAPER is the most flexible of the four, which also makes it the easiest to
export the wrong thing. Check the time range before you hit OK.

## Check the file before you send it

Import the `.mid` into an empty project — ideally in a different DAW from the
one you made it in — and check three things:

1. **Bar one lines up.** If the part starts early or late, the export
   included or skipped time before the first note. Export from bar one or
   from a tight time selection.
2. **The speed matches.** If it plays at the wrong speed or drifts, the tempo
   in the file and the project disagree.
3. **Nothing went missing.** Arpeggiated or generated parts that were not
   rendered to notes will be absent; controller data like sustain pedal may
   or may not have come through.

## When you have audio instead of a project

Sometimes the MIDI never existed, or the project is gone and only a bounce is
left. Then there is nothing to export — the notes have to be detected from the
sound. That works reasonably on a clean single instrument and badly on a full
mix; we explain why in
[why a full mix will not convert](/blog/why-dense-mixes-dont-convert).

If that is where you are, the free [audio to MIDI converter](/) runs in your
browser, lets you hear the original against the MIDI before you download, and
writes a standard `.mid` you can import with the steps in our
[FL Studio](/guides/audio-to-midi-fl-studio),
[Ableton](/guides/audio-to-midi-ableton),
[Logic Pro](/guides/audio-to-midi-logic-pro) and
[REAPER](/guides/audio-to-midi-reaper) guides. Treat the result as a draft
to edit, not a recovered project.
