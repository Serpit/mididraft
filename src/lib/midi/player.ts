/**
 * A/B preview player.
 *
 * Plays either the original audio or a synthesised version of the transcribed
 * notes, and keeps the playhead when you switch between them — that direct
 * comparison is how a user judges whether the transcription is usable.
 */
import { getAudioContext } from './audio';
import type { Note } from './types';

export type PreviewSource = 'audio' | 'midi';

export interface PlayerState {
  playing: boolean;
  source: PreviewSource;
  currentTime: number;
  duration: number;
}

const midiToFrequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

export class PreviewPlayer {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private notes: Note[] = [];

  private bufferSource: AudioBufferSourceNode | null = null;
  private voices: { osc: OscillatorNode; gain: GainNode }[] = [];

  private source: PreviewSource = 'audio';
  private playing = false;
  /** Position in the timeline that playback started from. */
  private offset = 0;
  /** AudioContext time at which playback started. */
  private startedAt = 0;
  private loopRegion: { start: number; end: number } | null = null;
  private loopTimer: ReturnType<typeof setTimeout> | null = null;
  private endTimer: ReturnType<typeof setTimeout> | null = null;

  private listeners = new Set<(state: PlayerState) => void>();

  subscribe(listener: (state: PlayerState) => void): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private emit() {
    const state = this.getState();
    for (const listener of this.listeners) listener(state);
  }

  private ensureContext(): AudioContext {
    if (!this.context) {
      this.context = getAudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.9;
      this.master.connect(this.context.destination);
    }
    if (this.context.state === 'suspended') void this.context.resume();
    return this.context;
  }

  getState(): PlayerState {
    return {
      playing: this.playing,
      source: this.source,
      currentTime: this.getCurrentTime(),
      duration: this.getDuration(),
    };
  }

  getDuration(): number {
    const audioDuration = this.audioBuffer?.duration ?? 0;
    const midiDuration = this.notes.reduce(
      (end, n) => Math.max(end, n.startTimeSeconds + n.durationSeconds),
      0
    );
    return Math.max(audioDuration, midiDuration);
  }

  getCurrentTime(): number {
    if (!this.playing || !this.context) return this.offset;
    const elapsed = this.context.currentTime - this.startedAt;
    const position = this.offset + elapsed;
    if (this.loopRegion) {
      const { start, end } = this.loopRegion;
      const span = end - start;
      if (span > 0 && position > end) {
        return start + ((position - start) % span);
      }
    }
    return Math.min(position, this.getDuration());
  }

  setAudio(buffer: AudioBuffer | null) {
    const wasPlaying = this.playing;
    this.stopNodes();
    this.audioBuffer = buffer;
    this.offset = 0;
    if (wasPlaying) this.playing = false;
    this.emit();
  }

  setNotes(notes: Note[]) {
    this.notes = notes;
    // Re-schedule so an edit is audible immediately.
    if (this.playing && this.source === 'midi') {
      const position = this.getCurrentTime();
      this.stopNodes();
      this.startFrom(position);
      return;
    }
    this.emit();
  }

  setSource(source: PreviewSource) {
    if (source === this.source) return;
    const position = this.getCurrentTime();
    const wasPlaying = this.playing;
    this.stopNodes();
    this.source = source;
    this.offset = position;
    if (wasPlaying) this.startFrom(position);
    else this.emit();
  }

  toggleSource() {
    this.setSource(this.source === 'audio' ? 'midi' : 'audio');
  }

  setLoop(region: { start: number; end: number } | null) {
    this.loopRegion = region;
    if (this.playing) {
      const position = this.getCurrentTime();
      this.stopNodes();
      this.startFrom(region ? Math.max(position, region.start) : position);
    }
  }

  play(from?: number) {
    const start = from ?? this.getCurrentTime();
    this.stopNodes();
    this.startFrom(start >= this.getDuration() - 0.05 ? 0 : start);
  }

  pause() {
    if (!this.playing) return;
    const position = this.getCurrentTime();
    this.stopNodes();
    this.offset = position;
    this.emit();
  }

  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  seek(seconds: number) {
    const clamped = Math.max(0, Math.min(seconds, this.getDuration()));
    if (this.playing) {
      this.stopNodes();
      this.startFrom(clamped);
    } else {
      this.offset = clamped;
      this.emit();
    }
  }

  stop() {
    this.stopNodes();
    this.offset = this.loopRegion?.start ?? 0;
    this.emit();
  }

  dispose() {
    this.stopNodes();
    this.listeners.clear();
    this.master?.disconnect();
    this.master = null;
    this.context = null;
  }

  private startFrom(position: number) {
    const context = this.ensureContext();
    const duration = this.getDuration();
    if (duration <= 0) return;

    const loopStart = this.loopRegion?.start ?? 0;
    const loopEnd = this.loopRegion?.end ?? duration;
    const from = Math.max(0, Math.min(position, duration));

    this.offset = from;
    this.startedAt = context.currentTime;
    this.playing = true;

    if (this.source === 'audio') this.startAudio(from, loopStart, loopEnd);
    else this.startMidi(from, loopStart, loopEnd);

    const playUntil = (this.loopRegion ? loopEnd : duration) - from;
    if (this.loopRegion) {
      this.loopTimer = setTimeout(
        () => {
          this.stopNodes();
          this.startFrom(loopStart);
        },
        Math.max(50, playUntil * 1000)
      );
    } else {
      this.endTimer = setTimeout(
        () => {
          this.stopNodes();
          this.offset = 0;
          this.emit();
        },
        Math.max(50, playUntil * 1000 + 120)
      );
    }

    this.emit();
  }

  private startAudio(from: number, loopStart: number, loopEnd: number) {
    if (!this.audioBuffer || !this.context || !this.master) return;
    const source = this.context.createBufferSource();
    source.buffer = this.audioBuffer;
    source.connect(this.master);
    const span = this.loopRegion ? loopEnd - from : undefined;
    if (span !== undefined) source.start(0, from, Math.max(0.01, span));
    else source.start(0, from);
    this.bufferSource = source;
    void loopStart;
  }

  private startMidi(from: number, _loopStart: number, loopEnd: number) {
    if (!this.context || !this.master) return;
    const context = this.context;
    const now = context.currentTime;
    const until = this.loopRegion ? loopEnd : Number.POSITIVE_INFINITY;

    for (const note of this.notes) {
      const noteEnd = note.startTimeSeconds + note.durationSeconds;
      if (noteEnd <= from || note.startTimeSeconds >= until) continue;

      const startAt = now + Math.max(0, note.startTimeSeconds - from);
      const stopAt = now + Math.min(noteEnd, until) - from;
      if (stopAt <= startAt) continue;

      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = 'triangle';
      osc.frequency.value = midiToFrequency(note.pitchMidi);

      // Short attack and release keep the preview readable without clicks.
      const peak = Math.max(0.04, Math.min(0.28, note.amplitude * 0.3));
      const attack = 0.006;
      const release = 0.05;
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.linearRampToValueAtTime(peak, startAt + attack);
      gain.gain.setValueAtTime(
        peak,
        Math.max(startAt + attack, stopAt - release)
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, stopAt + release);

      osc.connect(gain);
      gain.connect(this.master);
      osc.start(startAt);
      osc.stop(stopAt + release + 0.02);
      this.voices.push({ osc, gain });
    }
  }

  private stopNodes() {
    if (this.loopTimer) clearTimeout(this.loopTimer);
    if (this.endTimer) clearTimeout(this.endTimer);
    this.loopTimer = null;
    this.endTimer = null;

    if (this.bufferSource) {
      try {
        this.bufferSource.stop();
      } catch {
        // Already stopped; nothing to do.
      }
      this.bufferSource.disconnect();
      this.bufferSource = null;
    }

    for (const voice of this.voices) {
      try {
        voice.osc.stop();
      } catch {
        // Already stopped; nothing to do.
      }
      voice.osc.disconnect();
      voice.gain.disconnect();
    }
    this.voices = [];
    this.playing = false;
  }
}
