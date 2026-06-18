/**
 * AudioEngine — manages a single Web Audio API AudioContext, a master gain bus,
 * and an arbitrary number of named sound sources produced by generator functions.
 *
 * Every sound gets its own GainNode so volumes can be controlled independently.
 * All transitions use linearRampToValueAtTime for glitch-free 500 ms ramps.
 */

import type { SoundGenerator, SoundGeneratorResult } from "./sound-generators";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/** Serialisable snapshot of a single sound channel. */
export interface SoundChannelState {
  id: string;
  playing: boolean;
  volume: number; // 0-1, the *target* volume (ignoring master)
  muted: boolean;
}

/** Options accepted when registering a sound. */
export interface RegisterSoundOptions {
  /** Initial per-channel volume (0-1). @default 0.5 */
  volume?: number;
  /** Start playing immediately after registration. @default false */
  autoPlay?: boolean;
}

/** Full engine snapshot (useful for persisting / restoring UI state). */
export interface AudioEngineSnapshot {
  masterVolume: number;
  masterMuted: boolean;
  channels: SoundChannelState[];
}

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

interface SoundChannel {
  id: string;
  generator: SoundGenerator;
  generatorResult: SoundGeneratorResult | null;
  gainNode: GainNode;
  volume: number;   // user-set volume 0-1
  playing: boolean;
  muted: boolean;    // per-channel mute
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_RAMP_MS = 500;

// ---------------------------------------------------------------------------
// AudioEngine
// ---------------------------------------------------------------------------

export class AudioEngine {
  private ctx: AudioContext;
  private masterGain: GainNode;
  private channels: Map<string, SoundChannel> = new Map();
  private _masterVolume = 1;
  private _masterMuted = false;
  private _resumed = false;

  constructor() {
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this._masterVolume;
    this.masterGain.connect(this.ctx.destination);
  }

  // -----------------------------------------------------------------------
  // AudioContext lifecycle
  // -----------------------------------------------------------------------

  /** Call once on the first user gesture (click / tap). */
  async ensureResumed(): Promise<void> {
    if (this._resumed) return;
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }
    this._resumed = true;
  }

  get context(): AudioContext {
    return this.ctx;
  }

  // -----------------------------------------------------------------------
  // Channel registration
  // -----------------------------------------------------------------------

  /**
   * Register a sound by id + generator function.
   * The generator is *not* invoked until the sound is first played.
   */
  register(
    id: string,
    generator: SoundGenerator,
    opts: RegisterSoundOptions = {},
  ): void {
    const { volume = 0.5, autoPlay = false } = opts;

    if (this.channels.has(id)) {
      // Re-register: tear down existing channel first.
      this.unregister(id);
    }

    const gainNode = this.ctx.createGain();
    gainNode.gain.value = 0; // start silent
    gainNode.connect(this.masterGain);

    const channel: SoundChannel = {
      id,
      generator,
      generatorResult: null,
      gainNode,
      volume,
      playing: false,
      muted: false,
    };

    this.channels.set(id, channel);

    if (autoPlay) {
      this.play(id);
    }
  }

  /** Fully tear down a channel, disconnecting all nodes. */
  unregister(id: string): void {
    const ch = this.channels.get(id);
    if (!ch) return;
    this.stopChannel(ch);
    ch.gainNode.disconnect();
    this.channels.delete(id);
  }

  // -----------------------------------------------------------------------
  // Playback
  // -----------------------------------------------------------------------

  /** Start a sound, creating generator nodes if needed. */
  play(id: string): void {
    const ch = this.requireChannel(id);
    if (ch.playing) return;

    this.ensureResumed();

    // Lazily create generator nodes.
    if (!ch.generatorResult) {
      ch.generatorResult = ch.generator(this.ctx);
      ch.generatorResult.node.connect(ch.gainNode);
    }

    ch.playing = true;

    // Ramp up from 0 → target volume
    const target = ch.muted || this._masterMuted ? 0 : ch.volume;
    this.rampGain(ch.gainNode, target, DEFAULT_RAMP_MS);
  }

  /** Stop a sound, cleaning up generator nodes so they can be recreated. */
  stop(id: string): void {
    const ch = this.requireChannel(id);
    if (!ch.playing) return;

    // Ramp to silence first, then disconnect after ramp.
    this.rampGain(ch.gainNode, 0, DEFAULT_RAMP_MS);
    setTimeout(() => this.stopChannel(ch), DEFAULT_RAMP_MS + 50);
  }

  /** Toggle play / stop. Returns the new playing state. */
  toggleSound(id: string): boolean {
    const ch = this.requireChannel(id);
    if (ch.playing) {
      this.stop(id);
      return false;
    } else {
      this.play(id);
      return true;
    }
  }

  /** Whether a given sound is currently playing. */
  isPlaying(id: string): boolean {
    return this.channels.get(id)?.playing ?? false;
  }

  // -----------------------------------------------------------------------
  // Volume
  // -----------------------------------------------------------------------

  /** Set volume for a single channel (0-1). */
  setVolume(id: string, vol: number): void {
    const ch = this.requireChannel(id);
    ch.volume = clamp01(vol);
    if (ch.playing && !ch.muted && !this._masterMuted) {
      this.rampGain(ch.gainNode, ch.volume, DEFAULT_RAMP_MS);
    }
  }

  /** Get the current target volume for a channel. */
  getVolume(id: string): number {
    return this.requireChannel(id).volume;
  }

  /** Set the master volume (0-1). Affects all channels. */
  setMasterVolume(vol: number): void {
    this._masterVolume = clamp01(vol);
    if (!this._masterMuted) {
      this.rampGain(this.masterGain, this._masterVolume, DEFAULT_RAMP_MS);
    }
  }

  get masterVolume(): number {
    return this._masterVolume;
  }

  // -----------------------------------------------------------------------
  // Mute / unmute
  // -----------------------------------------------------------------------

  /** Mute ALL sound output (preserves individual volumes). */
  muteAll(): void {
    this._masterMuted = true;
    this.rampGain(this.masterGain, 0, DEFAULT_RAMP_MS);
  }

  /** Restore sound output after muteAll(). */
  unmuteAll(): void {
    this._masterMuted = false;
    this.rampGain(this.masterGain, this._masterVolume, DEFAULT_RAMP_MS);
  }

  get isMasterMuted(): boolean {
    return this._masterMuted;
  }

  /** Mute a single channel. */
  muteChannel(id: string): void {
    const ch = this.requireChannel(id);
    ch.muted = true;
    if (ch.playing) {
      this.rampGain(ch.gainNode, 0, DEFAULT_RAMP_MS);
    }
  }

  /** Unmute a single channel. */
  unmuteChannel(id: string): void {
    const ch = this.requireChannel(id);
    ch.muted = false;
    if (ch.playing) {
      this.rampGain(ch.gainNode, ch.volume, DEFAULT_RAMP_MS);
    }
  }

  // -----------------------------------------------------------------------
  // Fading
  // -----------------------------------------------------------------------

  /** Fade a channel in over `durationMs` (starts playback if stopped). */
  fadeIn(id: string, durationMs: number = DEFAULT_RAMP_MS): void {
    const ch = this.requireChannel(id);
    if (!ch.playing) {
      // Start at silence and begin playback.
      ch.gainNode.gain.value = 0;
      this.play(id);
    }
    this.rampGain(ch.gainNode, ch.volume, durationMs);
  }

  /** Fade a channel out over `durationMs` then stop it. */
  fadeOut(id: string, durationMs: number = DEFAULT_RAMP_MS): void {
    const ch = this.requireChannel(id);
    if (!ch.playing) return;
    this.rampGain(ch.gainNode, 0, durationMs);
    setTimeout(() => this.stopChannel(ch), durationMs + 50);
  }

  // -----------------------------------------------------------------------
  // Snapshot
  // -----------------------------------------------------------------------

  /** Return a serialisable snapshot of the entire engine state. */
  snapshot(): AudioEngineSnapshot {
    const channels: SoundChannelState[] = [];
    for (const ch of this.channels.values()) {
      channels.push({
        id: ch.id,
        playing: ch.playing,
        volume: ch.volume,
        muted: ch.muted,
      });
    }
    return {
      masterVolume: this._masterVolume,
      masterMuted: this._masterMuted,
      channels,
    };
  }

  /** Restore volumes & play-state from a snapshot (channels must already be registered). */
  restoreSnapshot(snap: AudioEngineSnapshot): void {
    this.setMasterVolume(snap.masterVolume);
    if (snap.masterMuted) this.muteAll();
    else this.unmuteAll();

    for (const cs of snap.channels) {
      const ch = this.channels.get(cs.id);
      if (!ch) continue;
      ch.volume = cs.volume;
      if (cs.muted) this.muteChannel(cs.id);
      if (cs.playing && !ch.playing) this.play(cs.id);
      if (!cs.playing && ch.playing) this.stop(cs.id);
    }
  }

  // -----------------------------------------------------------------------
  // Teardown
  // -----------------------------------------------------------------------

  /** Destroy the engine – disconnects everything and closes the AudioContext. */
  async dispose(): Promise<void> {
    for (const ch of this.channels.values()) {
      this.stopChannel(ch);
      ch.gainNode.disconnect();
    }
    this.channels.clear();
    this.masterGain.disconnect();
    await this.ctx.close();
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private requireChannel(id: string): SoundChannel {
    const ch = this.channels.get(id);
    if (!ch) throw new Error(`AudioEngine: unknown sound "${id}"`);
    return ch;
  }

  /** Stop generator, clean up nodes, mark as not playing. */
  private stopChannel(ch: SoundChannel): void {
    if (ch.generatorResult) {
      ch.generatorResult.cleanup();
      try {
        ch.generatorResult.node.disconnect();
      } catch {
        /* already disconnected – safe to ignore */
      }
      ch.generatorResult = null;
    }
    ch.playing = false;
  }

  /** Smoothly ramp a GainNode's gain to `target` over `ms` milliseconds. */
  private rampGain(gainNode: GainNode, target: number, ms: number): void {
    const now = this.ctx.currentTime;
    const param = gainNode.gain;
    // Cancel any in-progress ramp and snap to current value first.
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(clamp01(target), now + ms / 1000);
  }
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}
