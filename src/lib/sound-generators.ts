/**
 * sound-generators.ts
 *
 * Procedural café-ambience sound generators using the Web Audio API.
 * Every function accepts an AudioContext and returns a top-level AudioNode
 * plus a cleanup callback.  NO external audio files are used – everything
 * is synthesised from oscillators, noise buffers, and filters.
 */

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

/** The return type of every generator function. */
export interface SoundGeneratorResult {
  /** The top-level node to connect to a downstream GainNode / destination. */
  node: AudioNode;
  /** Stops all scheduled work and disconnects internal nodes. */
  cleanup: () => void;
}

/** A generator function signature. */
export type SoundGenerator = (ctx: AudioContext) => SoundGeneratorResult;

// ---------------------------------------------------------------------------
// Utility: create a looping noise buffer
// ---------------------------------------------------------------------------

type NoiseColor = "white" | "pink" | "brown";

function createNoiseBuffer(
  ctx: AudioContext,
  color: NoiseColor,
  durationS = 2,
): AudioBuffer {
  const length = ctx.sampleRate * durationS;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (color === "white") {
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  } else if (color === "pink") {
    // Paul Kellet's refined method
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  } else {
    // brown
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  }

  return buffer;
}

/** Create a looping BufferSourceNode for a given noise colour. */
function createNoiseSource(
  ctx: AudioContext,
  color: NoiseColor,
  durationS = 2,
): AudioBufferSourceNode {
  const src = ctx.createBufferSource();
  src.buffer = createNoiseBuffer(ctx, color, durationS);
  src.loop = true;
  src.start();
  return src;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Collect disposable resources so cleanup() tears everything down in one go.
 */
class Disposer {
  private sources: AudioBufferSourceNode[] = [];
  private oscillators: OscillatorNode[] = [];
  private timers: ReturnType<typeof setTimeout>[] = [];
  private intervals: ReturnType<typeof setInterval>[] = [];
  private nodes: AudioNode[] = [];
  private aborted = false;

  get isAborted() {
    return this.aborted;
  }

  addSource(s: AudioBufferSourceNode) {
    this.sources.push(s);
    return s;
  }
  addOsc(o: OscillatorNode) {
    this.oscillators.push(o);
    return o;
  }
  addTimer(t: ReturnType<typeof setTimeout>) {
    this.timers.push(t);
    return t;
  }
  addInterval(t: ReturnType<typeof setInterval>) {
    this.intervals.push(t);
    return t;
  }
  addNode(n: AudioNode) {
    this.nodes.push(n);
    return n;
  }

  cleanup() {
    this.aborted = true;
    for (const s of this.sources) {
      try { s.stop(); } catch { /* ok */ }
      try { s.disconnect(); } catch { /* ok */ }
    }
    for (const o of this.oscillators) {
      try { o.stop(); } catch { /* ok */ }
      try { o.disconnect(); } catch { /* ok */ }
    }
    for (const t of this.timers) clearTimeout(t);
    for (const t of this.intervals) clearInterval(t);
    for (const n of this.nodes) {
      try { n.disconnect(); } catch { /* ok */ }
    }
  }
}

function randRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

// ---------------------------------------------------------------------------
// 1. Rain — steady rainfall
// ---------------------------------------------------------------------------
export function rain(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 1;
  d.addNode(out);

  // White noise → bandpass centred on ~2 kHz → gentle AM
  const noise = d.addSource(createNoiseSource(ctx, "white"));
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 2000;
  bp.Q.value = 0.5;
  d.addNode(bp);

  // Gentle amplitude modulation for "patter" feel
  const amGain = ctx.createGain();
  amGain.gain.value = 0.7;
  d.addNode(amGain);

  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 0.15; // very slow
  lfo.start();
  d.addOsc(lfo);

  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.3; // subtle depth
  d.addNode(lfoGain);

  lfo.connect(lfoGain);
  lfoGain.connect(amGain.gain);

  // A second, higher layer for light rain texture
  const noise2 = d.addSource(createNoiseSource(ctx, "white"));
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = 5000;
  d.addNode(hp);
  const hpGain = ctx.createGain();
  hpGain.gain.value = 0.15;
  d.addNode(hpGain);

  noise.connect(bp);
  bp.connect(amGain);
  amGain.connect(out);

  noise2.connect(hp);
  hp.connect(hpGain);
  hpGain.connect(out);

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 2. Espresso — periodic steam hiss
// ---------------------------------------------------------------------------
export function espresso(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.8;
  d.addNode(out);

  function hiss() {
    if (d.isAborted) return;

    const src = d.addSource(createNoiseSource(ctx, "pink"));
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 4000;
    hp.Q.value = 5;
    d.addNode(hp);

    const env = ctx.createGain();
    env.gain.value = 0;
    d.addNode(env);

    const now = ctx.currentTime;
    const duration = randRange(1.5, 3.0);
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.9, now + 0.15);
    env.gain.setValueAtTime(0.9, now + duration - 0.4);
    env.gain.linearRampToValueAtTime(0, now + duration);

    src.connect(hp);
    hp.connect(env);
    env.connect(out);

    // Stop & schedule next burst
    const stopTimer = setTimeout(() => {
      try { src.stop(); } catch { /* ok */ }
      try { src.disconnect(); } catch { /* ok */ }
    }, duration * 1000 + 100);
    d.addTimer(stopTimer);

    const next = randRange(4, 8) * 1000;
    d.addTimer(setTimeout(hiss, next));
  }

  // Start first hiss after a short delay
  d.addTimer(setTimeout(hiss, 500));

  // Add a quiet, constant steam layer
  const bgNoise = d.addSource(createNoiseSource(ctx, "white"));
  const bgHp = ctx.createBiquadFilter();
  bgHp.type = "highpass";
  bgHp.frequency.value = 6000;
  d.addNode(bgHp);
  const bgGain = ctx.createGain();
  bgGain.gain.value = 0.06;
  d.addNode(bgGain);
  bgNoise.connect(bgHp);
  bgHp.connect(bgGain);
  bgGain.connect(out);

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 3. Grinder — grinding vibration
// ---------------------------------------------------------------------------
export function grinder(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.7;
  d.addNode(out);

  const noise = d.addSource(createNoiseSource(ctx, "brown"));

  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 800;
  bp.Q.value = 4;
  d.addNode(bp);

  // LFO at ~8 Hz for grinding vibration
  const lfo = ctx.createOscillator();
  lfo.type = "square";
  lfo.frequency.value = 8;
  lfo.start();
  d.addOsc(lfo);

  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 0.5;
  d.addNode(lfoGain);

  const amGain = ctx.createGain();
  amGain.gain.value = 0.5;
  d.addNode(amGain);

  lfo.connect(lfoGain);
  lfoGain.connect(amGain.gain);

  // Higher rattle layer
  const noise2 = d.addSource(createNoiseSource(ctx, "white"));
  const bp2 = ctx.createBiquadFilter();
  bp2.type = "bandpass";
  bp2.frequency.value = 2500;
  bp2.Q.value = 3;
  d.addNode(bp2);
  const rattleGain = ctx.createGain();
  rattleGain.gain.value = 0.15;
  d.addNode(rattleGain);

  const lfo2 = ctx.createOscillator();
  lfo2.type = "sine";
  lfo2.frequency.value = 8;
  lfo2.start();
  d.addOsc(lfo2);
  const lfo2Gain = ctx.createGain();
  lfo2Gain.gain.value = 0.4;
  d.addNode(lfo2Gain);

  lfo2.connect(lfo2Gain);
  lfo2Gain.connect(rattleGain.gain);

  noise.connect(bp);
  bp.connect(amGain);
  amGain.connect(out);

  noise2.connect(bp2);
  bp2.connect(rattleGain);
  rattleGain.connect(out);

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 4. Fireplace — warm rumble + random crackles
// ---------------------------------------------------------------------------
export function fireplace(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.9;
  d.addNode(out);

  // Base rumble: brown noise → lowpass 400 Hz
  const rumble = d.addSource(createNoiseSource(ctx, "brown"));
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 400;
  d.addNode(lp);
  const rumbleGain = ctx.createGain();
  rumbleGain.gain.value = 0.6;
  d.addNode(rumbleGain);

  // Subtle AM on the rumble for flickering
  const flameLfo = ctx.createOscillator();
  flameLfo.type = "sine";
  flameLfo.frequency.value = 0.3;
  flameLfo.start();
  d.addOsc(flameLfo);
  const flameLfoGain = ctx.createGain();
  flameLfoGain.gain.value = 0.15;
  d.addNode(flameLfoGain);
  flameLfo.connect(flameLfoGain);
  flameLfoGain.connect(rumbleGain.gain);

  rumble.connect(lp);
  lp.connect(rumbleGain);
  rumbleGain.connect(out);

  // Crackle layer: short noise impulses at random intervals
  function crackle() {
    if (d.isAborted) return;

    const burstCount = Math.floor(randRange(1, 4));
    for (let i = 0; i < burstCount; i++) {
      const delay = i * randRange(20, 60);
      const timer = setTimeout(() => {
        if (d.isAborted) return;
        const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.008), ctx.sampleRate);
        const ch = buf.getChannelData(0);
        for (let j = 0; j < ch.length; j++) {
          ch[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / ch.length, 2);
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        d.addSource(src);

        const crackBp = ctx.createBiquadFilter();
        crackBp.type = "bandpass";
        crackBp.frequency.value = randRange(1000, 4000);
        crackBp.Q.value = randRange(1, 3);
        d.addNode(crackBp);

        const crackGain = ctx.createGain();
        crackGain.gain.value = randRange(0.3, 0.8);
        d.addNode(crackGain);

        src.connect(crackBp);
        crackBp.connect(crackGain);
        crackGain.connect(out);
        src.start();
      }, delay);
      d.addTimer(timer);
    }

    d.addTimer(setTimeout(crackle, randRange(100, 600)));
  }
  crackle();

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 5. Vinyl — gentle surface crackle
// ---------------------------------------------------------------------------
export function vinyl(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.5;
  d.addNode(out);

  // Constant low hiss
  const hiss = d.addSource(createNoiseSource(ctx, "white"));
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 1000;
  d.addNode(lp);
  const hissGain = ctx.createGain();
  hissGain.gain.value = 0.04;
  d.addNode(hissGain);

  hiss.connect(lp);
  lp.connect(hissGain);
  hissGain.connect(out);

  // Random impulse clicks
  function tick() {
    if (d.isAborted) return;
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.003), ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < ch.length; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / ch.length, 4);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    d.addSource(src);

    const clickLp = ctx.createBiquadFilter();
    clickLp.type = "lowpass";
    clickLp.frequency.value = 2000;
    d.addNode(clickLp);

    const clickGain = ctx.createGain();
    clickGain.gain.value = randRange(0.1, 0.5);
    d.addNode(clickGain);

    src.connect(clickLp);
    clickLp.connect(clickGain);
    clickGain.connect(out);
    src.start();

    d.addTimer(setTimeout(tick, randRange(40, 300)));
  }
  tick();

  // 33⅓ RPM "wow" — very slow pitch wobble is simulated via gain modulation
  const wowLfo = ctx.createOscillator();
  wowLfo.type = "sine";
  wowLfo.frequency.value = 0.55; // ~33 rpm
  wowLfo.start();
  d.addOsc(wowLfo);
  const wowGain = ctx.createGain();
  wowGain.gain.value = 0.015;
  d.addNode(wowGain);
  wowLfo.connect(wowGain);
  wowGain.connect(hissGain.gain);

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 6. Jazz — muffled music simulation
// ---------------------------------------------------------------------------
export function jazz(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.5;
  d.addNode(out);

  // Muffled "music body": bandpass noise ~500 Hz
  const noise = d.addSource(createNoiseSource(ctx, "white"));
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 500;
  bp.Q.value = 1.5;
  d.addNode(bp);
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.12;
  d.addNode(noiseGain);

  // Slow rhythm-like modulation
  const rhythmLfo = ctx.createOscillator();
  rhythmLfo.type = "sine";
  rhythmLfo.frequency.value = 1.8; // ~108 bpm vibe
  rhythmLfo.start();
  d.addOsc(rhythmLfo);
  const rhythmGain = ctx.createGain();
  rhythmGain.gain.value = 0.04;
  d.addNode(rhythmGain);
  rhythmLfo.connect(rhythmGain);
  rhythmGain.connect(noiseGain.gain);

  noise.connect(bp);
  bp.connect(noiseGain);
  noiseGain.connect(out);

  // Cmaj7 chord tones: C3, E3, G3, Bb3 as very quiet sine oscillators
  // Frequencies: C3≈130.81, E3≈164.81, G3≈196.00, Bb3≈233.08
  const chordFreqs = [130.81, 164.81, 196.0, 233.08];
  for (const freq of chordFreqs) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.start();
    d.addOsc(osc);

    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.02; // very quiet
    d.addNode(oscGain);

    // Gentle vibrato
    const vib = ctx.createOscillator();
    vib.type = "sine";
    vib.frequency.value = randRange(4, 6);
    vib.start();
    d.addOsc(vib);
    const vibDepth = ctx.createGain();
    vibDepth.gain.value = 0.005;
    d.addNode(vibDepth);
    vib.connect(vibDepth);
    vibDepth.connect(oscGain.gain);

    // Muffle each tone
    const toneLp = ctx.createBiquadFilter();
    toneLp.type = "lowpass";
    toneLp.frequency.value = 800;
    d.addNode(toneLp);

    osc.connect(toneLp);
    toneLp.connect(oscGain);
    oscGain.connect(out);
  }

  // Overall muffling — simulates sound coming through a wall
  const muffle = ctx.createBiquadFilter();
  muffle.type = "lowpass";
  muffle.frequency.value = 1200;
  d.addNode(muffle);

  // Re-route out through muffle
  const preMuffle = ctx.createGain();
  preMuffle.gain.value = 1;
  d.addNode(preMuffle);

  // Disconnect out from its implicit connections and put muffle in between
  // Since we built everything into `out`, swap:
  // Everything → out → muffle → realOut
  const realOut = ctx.createGain();
  realOut.gain.value = 1;
  d.addNode(realOut);

  out.connect(muffle);
  muffle.connect(realOut);

  return { node: realOut, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 7. Wind chimes — random pentatonic sine pings with decay
// ---------------------------------------------------------------------------
export function windChimes(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.6;
  d.addNode(out);

  // Pentatonic scale frequencies (C5 pentatonic and above)
  const pentatonic = [
    523.25, 587.33, 659.25, 783.99, 880.0, // C5, D5, E5, G5, A5
    1046.5, 1174.66, 1318.51, 1567.98, 1760.0, // C6, D6, E6, G6, A6
  ];

  function chime() {
    if (d.isAborted) return;

    const freq = pentatonic[Math.floor(Math.random() * pentatonic.length)];
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    d.addOsc(osc);

    const env = ctx.createGain();
    env.gain.value = 0;
    d.addNode(env);

    const now = ctx.currentTime;
    const amplitude = randRange(0.08, 0.25);
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(amplitude, now + 0.01);
    env.gain.exponentialRampToValueAtTime(0.001, now + randRange(1.5, 3.5));

    osc.connect(env);
    env.connect(out);
    osc.start(now);
    osc.stop(now + 4);

    // Schedule next chime
    d.addTimer(setTimeout(chime, randRange(800, 3000)));
  }

  // Start with a staggered first few
  d.addTimer(setTimeout(chime, 300));
  d.addTimer(setTimeout(chime, 1200));

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 8. Keyboard — typing sounds
// ---------------------------------------------------------------------------
export function keyboard(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.5;
  d.addNode(out);

  function keystroke() {
    if (d.isAborted) return;

    const durationMs = randRange(20, 80);
    const durationS = durationMs / 1000;
    const samples = Math.floor(ctx.sampleRate * durationS);
    const buf = ctx.createBuffer(1, samples, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < samples; i++) {
      // Shaped noise burst with fast attack, medium decay
      const env = Math.pow(1 - i / samples, 3);
      ch[i] = (Math.random() * 2 - 1) * env;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    d.addSource(src);

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = randRange(2500, 4000);
    bp.Q.value = randRange(1, 3);
    d.addNode(bp);

    const clickGain = ctx.createGain();
    clickGain.gain.value = randRange(0.3, 0.7);
    d.addNode(clickGain);

    src.connect(bp);
    bp.connect(clickGain);
    clickGain.connect(out);
    src.start();

    // Random interval: bursts of typing with pauses
    const isPause = Math.random() < 0.1;
    const nextDelay = isPause ? randRange(400, 1200) : randRange(60, 200);
    d.addTimer(setTimeout(keystroke, nextDelay));
  }

  keystroke();

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 9. Conversations — crowd murmur
// ---------------------------------------------------------------------------
export function conversations(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.6;
  d.addNode(out);

  // Two layers of filtered noise to simulate overlapping conversations
  for (let layer = 0; layer < 2; layer++) {
    const noise = d.addSource(createNoiseSource(ctx, "pink"));

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = layer === 0 ? 600 : 1800;
    bp.Q.value = 0.7;
    d.addNode(bp);

    // Slow random AM to simulate natural speech rhythm
    const amGain = ctx.createGain();
    amGain.gain.value = layer === 0 ? 0.18 : 0.10;
    d.addNode(amGain);

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = randRange(0.3, 0.8);
    lfo.start();
    d.addOsc(lfo);

    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = layer === 0 ? 0.08 : 0.05;
    d.addNode(lfoDepth);

    lfo.connect(lfoDepth);
    lfoDepth.connect(amGain.gain);

    noise.connect(bp);
    bp.connect(amGain);
    amGain.connect(out);
  }

  // Extra very-slow modulation on master for "waves" of conversation
  const waveLfo = ctx.createOscillator();
  waveLfo.type = "sine";
  waveLfo.frequency.value = 0.07;
  waveLfo.start();
  d.addOsc(waveLfo);
  const waveDepth = ctx.createGain();
  waveDepth.gain.value = 0.2;
  d.addNode(waveDepth);
  waveLfo.connect(waveDepth);
  waveDepth.connect(out.gain);

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 10. Traffic — distant street noise
// ---------------------------------------------------------------------------
export function traffic(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.6;
  d.addNode(out);

  // Low-frequency rumble
  const noise = d.addSource(createNoiseSource(ctx, "brown"));
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 200;
  d.addNode(lp);
  const rumbleGain = ctx.createGain();
  rumbleGain.gain.value = 0.4;
  d.addNode(rumbleGain);

  // Slow modulation for passing vehicles
  const vehicleLfo = ctx.createOscillator();
  vehicleLfo.type = "sine";
  vehicleLfo.frequency.value = 0.08;
  vehicleLfo.start();
  d.addOsc(vehicleLfo);
  const vehicleDepth = ctx.createGain();
  vehicleDepth.gain.value = 0.15;
  d.addNode(vehicleDepth);
  vehicleLfo.connect(vehicleDepth);
  vehicleDepth.connect(rumbleGain.gain);

  noise.connect(lp);
  lp.connect(rumbleGain);
  rumbleGain.connect(out);

  // Mid-frequency road texture
  const roadNoise = d.addSource(createNoiseSource(ctx, "pink"));
  const roadBp = ctx.createBiquadFilter();
  roadBp.type = "bandpass";
  roadBp.frequency.value = 400;
  roadBp.Q.value = 0.5;
  d.addNode(roadBp);
  const roadGain = ctx.createGain();
  roadGain.gain.value = 0.08;
  d.addNode(roadGain);
  roadNoise.connect(roadBp);
  roadBp.connect(roadGain);
  roadGain.connect(out);

  // Occasional distant horn
  function horn() {
    if (d.isAborted) return;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = randRange(260, 340);
    d.addOsc(osc);

    // Second harmonic
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = osc.frequency.value * 1.5;
    d.addOsc(osc2);

    const env = ctx.createGain();
    env.gain.value = 0;
    d.addNode(env);

    const now = ctx.currentTime;
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.08, now + 0.3);
    env.gain.setValueAtTime(0.08, now + 0.8);
    env.gain.linearRampToValueAtTime(0, now + 1.2);

    // Muffle the horn — sounds distant
    const hornLp = ctx.createBiquadFilter();
    hornLp.type = "lowpass";
    hornLp.frequency.value = 600;
    d.addNode(hornLp);

    osc.connect(env);
    osc2.connect(env);
    env.connect(hornLp);
    hornLp.connect(out);
    osc.start(now);
    osc.stop(now + 1.5);
    osc2.start(now);
    osc2.stop(now + 1.5);

    d.addTimer(setTimeout(horn, randRange(15000, 30000)));
  }

  d.addTimer(setTimeout(horn, randRange(5000, 10000)));

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 11. Ceiling fan — low whoosh
// ---------------------------------------------------------------------------
export function ceilingFan(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.5;
  d.addNode(out);

  // Very low sine for the motor hum
  const hum = ctx.createOscillator();
  hum.type = "sine";
  hum.frequency.value = 40;
  hum.start();
  d.addOsc(hum);

  const humGain = ctx.createGain();
  humGain.gain.value = 0.15;
  d.addNode(humGain);

  hum.connect(humGain);
  humGain.connect(out);

  // Whoosh: filtered noise with slow AM
  const whoosh = d.addSource(createNoiseSource(ctx, "brown"));
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 150;
  d.addNode(lp);

  const whooshGain = ctx.createGain();
  whooshGain.gain.value = 0.2;
  d.addNode(whooshGain);

  // Blade rotation modulation ~0.5 Hz (simulates 3-blade fan at low speed)
  const bladeLfo = ctx.createOscillator();
  bladeLfo.type = "sine";
  bladeLfo.frequency.value = 0.5;
  bladeLfo.start();
  d.addOsc(bladeLfo);

  const bladeDepth = ctx.createGain();
  bladeDepth.gain.value = 0.1;
  d.addNode(bladeDepth);

  bladeLfo.connect(bladeDepth);
  bladeDepth.connect(whooshGain.gain);

  whoosh.connect(lp);
  lp.connect(whooshGain);
  whooshGain.connect(out);

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 12. Tea kettle — gentle whistle
// ---------------------------------------------------------------------------
export function teaKettle(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.4;
  d.addNode(out);

  // High sine wave for whistle
  const whistle = ctx.createOscillator();
  whistle.type = "sine";
  whistle.frequency.value = 3800;
  whistle.start();
  d.addOsc(whistle);

  // Slight pitch wobble
  const wobble = ctx.createOscillator();
  wobble.type = "sine";
  wobble.frequency.value = 3;
  wobble.start();
  d.addOsc(wobble);
  const wobbleDepth = ctx.createGain();
  wobbleDepth.gain.value = 30;
  d.addNode(wobbleDepth);
  wobble.connect(wobbleDepth);
  wobbleDepth.connect(whistle.frequency);

  const whistleGain = ctx.createGain();
  whistleGain.gain.value = 0.12;
  d.addNode(whistleGain);

  whistle.connect(whistleGain);
  whistleGain.connect(out);

  // Breathy noise component
  const noise = d.addSource(createNoiseSource(ctx, "white"));
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 4000;
  bp.Q.value = 8;
  d.addNode(bp);
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.15;
  d.addNode(noiseGain);

  noise.connect(bp);
  bp.connect(noiseGain);
  noiseGain.connect(out);

  // Slight amplitude variation
  const amLfo = ctx.createOscillator();
  amLfo.type = "sine";
  amLfo.frequency.value = 0.4;
  amLfo.start();
  d.addOsc(amLfo);
  const amDepth = ctx.createGain();
  amDepth.gain.value = 0.04;
  d.addNode(amDepth);
  amLfo.connect(amDepth);
  amDepth.connect(out.gain);

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 13. Clock — tick-tock at 1 Hz
// ---------------------------------------------------------------------------
export function clock(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.5;
  d.addNode(out);

  let isTock = false;

  function tick() {
    if (d.isAborted) return;

    // Tiny noise impulse ~5 ms, with slightly different character for tick vs tock
    const durationS = 0.005;
    const samples = Math.floor(ctx.sampleRate * durationS);
    const buf = ctx.createBuffer(1, samples, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < samples; i++) {
      const env = Math.pow(1 - i / samples, 8);
      ch[i] = (Math.random() * 2 - 1) * env;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    d.addSource(src);

    // Tick is higher pitched, tock is lower
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = isTock ? 1800 : 2800;
    bp.Q.value = 5;
    d.addNode(bp);

    const tickGain = ctx.createGain();
    tickGain.gain.value = isTock ? 0.6 : 0.8;
    d.addNode(tickGain);

    src.connect(bp);
    bp.connect(tickGain);
    tickGain.connect(out);
    src.start();

    isTock = !isTock;
    d.addTimer(setTimeout(tick, 1000)); // exactly 1 Hz
  }

  tick();

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 14. Cat purring — low rumble
// ---------------------------------------------------------------------------
export function catPurring(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.5;
  d.addNode(out);

  // Low sine at ~25 Hz — the fundamental purr
  const purr = ctx.createOscillator();
  purr.type = "sine";
  purr.frequency.value = 25;
  purr.start();
  d.addOsc(purr);

  // Second harmonic
  const purr2 = ctx.createOscillator();
  purr2.type = "sine";
  purr2.frequency.value = 50;
  purr2.start();
  d.addOsc(purr2);

  const purrGain = ctx.createGain();
  purrGain.gain.value = 0.25;
  d.addNode(purrGain);

  const purr2Gain = ctx.createGain();
  purr2Gain.gain.value = 0.12;
  d.addNode(purr2Gain);

  // AM at ~5 Hz for characteristic purr texture
  const amLfo = ctx.createOscillator();
  amLfo.type = "sine";
  amLfo.frequency.value = 5;
  amLfo.start();
  d.addOsc(amLfo);

  // Use a shaper to make the AM more pulse-like (inhale/exhale pattern)
  const amDepth = ctx.createGain();
  amDepth.gain.value = 0.15;
  d.addNode(amDepth);

  amLfo.connect(amDepth);
  amDepth.connect(purrGain.gain);
  amDepth.connect(purr2Gain.gain);

  purr.connect(purrGain);
  purr2.connect(purr2Gain);
  purrGain.connect(out);
  purr2Gain.connect(out);

  // Breathy noise layer
  const noise = d.addSource(createNoiseSource(ctx, "brown"));
  const noiseLp = ctx.createBiquadFilter();
  noiseLp.type = "lowpass";
  noiseLp.frequency.value = 80;
  d.addNode(noiseLp);
  const noiseGain = ctx.createGain();
  noiseGain.gain.value = 0.08;
  d.addNode(noiseGain);

  const noiseAm = ctx.createGain();
  noiseAm.gain.value = 0.05;
  d.addNode(noiseAm);
  amLfo.connect(noiseAm);
  noiseAm.connect(noiseGain.gain);

  noise.connect(noiseLp);
  noiseLp.connect(noiseGain);
  noiseGain.connect(out);

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 15. Page turning — periodic paper sounds
// ---------------------------------------------------------------------------
export function pageTurning(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.5;
  d.addNode(out);

  function turn() {
    if (d.isAborted) return;

    // ~200 ms shaped noise burst
    const durationS = randRange(0.15, 0.25);
    const samples = Math.floor(ctx.sampleRate * durationS);
    const buf = ctx.createBuffer(1, samples, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < samples; i++) {
      // Bell-curve-ish envelope: attack then longer decay
      const t = i / samples;
      const env = t < 0.15
        ? t / 0.15
        : Math.pow(1 - (t - 0.15) / 0.85, 2);
      ch[i] = (Math.random() * 2 - 1) * env;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    d.addSource(src);

    // Paper-like filtering: highpass to remove boomy lows + gentle bandpass
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 800;
    d.addNode(hp);

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = randRange(2000, 4000);
    bp.Q.value = 0.8;
    d.addNode(bp);

    const turnGain = ctx.createGain();
    turnGain.gain.value = randRange(0.3, 0.6);
    d.addNode(turnGain);

    src.connect(hp);
    hp.connect(bp);
    bp.connect(turnGain);
    turnGain.connect(out);
    src.start();

    d.addTimer(setTimeout(turn, randRange(5000, 15000)));
  }

  d.addTimer(setTimeout(turn, randRange(1000, 3000)));

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 16. Neon buzz — 60 Hz mains hum
// ---------------------------------------------------------------------------
export function neonBuzz(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.3; // intentionally quiet
  d.addNode(out);

  // Fundamental 60 Hz sawtooth
  const osc60 = ctx.createOscillator();
  osc60.type = "sawtooth";
  osc60.frequency.value = 60;
  osc60.start();
  d.addOsc(osc60);
  const osc60Gain = ctx.createGain();
  osc60Gain.gain.value = 0.08;
  d.addNode(osc60Gain);

  // 120 Hz harmonic
  const osc120 = ctx.createOscillator();
  osc120.type = "sine";
  osc120.frequency.value = 120;
  osc120.start();
  d.addOsc(osc120);
  const osc120Gain = ctx.createGain();
  osc120Gain.gain.value = 0.05;
  d.addNode(osc120Gain);

  // 180 Hz harmonic
  const osc180 = ctx.createOscillator();
  osc180.type = "sine";
  osc180.frequency.value = 180;
  osc180.start();
  d.addOsc(osc180);
  const osc180Gain = ctx.createGain();
  osc180Gain.gain.value = 0.03;
  d.addNode(osc180Gain);

  osc60.connect(osc60Gain);
  osc120.connect(osc120Gain);
  osc180.connect(osc180Gain);
  osc60Gain.connect(out);
  osc120Gain.connect(out);
  osc180Gain.connect(out);

  // Slight random flicker
  const flickerLfo = ctx.createOscillator();
  flickerLfo.type = "sine";
  flickerLfo.frequency.value = 0.2;
  flickerLfo.start();
  d.addOsc(flickerLfo);
  const flickerDepth = ctx.createGain();
  flickerDepth.gain.value = 0.02;
  d.addNode(flickerDepth);
  flickerLfo.connect(flickerDepth);
  flickerDepth.connect(out.gain);

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 17. Ice cubes — occasional clink
// ---------------------------------------------------------------------------
export function iceCubes(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.5;
  d.addNode(out);

  function clink() {
    if (d.isAborted) return;

    // A short cluster of 1-3 clinks
    const count = Math.floor(randRange(1, 4));
    for (let i = 0; i < count; i++) {
      const delay = i * randRange(50, 150);
      const timer = setTimeout(() => {
        if (d.isAborted) return;

        const durationS = randRange(0.015, 0.04);
        const samples = Math.floor(ctx.sampleRate * durationS);
        const buf = ctx.createBuffer(1, samples, ctx.sampleRate);
        const ch = buf.getChannelData(0);
        for (let j = 0; j < samples; j++) {
          const env = Math.pow(1 - j / samples, 6);
          ch[j] = (Math.random() * 2 - 1) * env;
        }

        const src = ctx.createBufferSource();
        src.buffer = buf;
        d.addSource(src);

        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = randRange(5000, 7000);
        bp.Q.value = randRange(8, 15);
        d.addNode(bp);

        const clinkGain = ctx.createGain();
        clinkGain.gain.value = randRange(0.3, 0.7);
        d.addNode(clinkGain);

        src.connect(bp);
        bp.connect(clinkGain);
        clinkGain.connect(out);
        src.start();
      }, delay);
      d.addTimer(timer);
    }

    d.addTimer(setTimeout(clink, randRange(10000, 20000)));
  }

  d.addTimer(setTimeout(clink, randRange(2000, 5000)));

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 18. Train horn — very distant, very rare
// ---------------------------------------------------------------------------
export function trainHorn(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.4;
  d.addNode(out);

  function horn() {
    if (d.isAborted) return;

    // Two-tone horn (typical train horns use multiple frequencies)
    const freq1 = randRange(170, 195);
    const freq2 = freq1 * 1.33; // rough minor third

    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.value = freq1;
    d.addOsc(osc1);

    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = freq2;
    d.addOsc(osc2);

    const env = ctx.createGain();
    env.gain.value = 0;
    d.addNode(env);

    const now = ctx.currentTime;
    // Slow attack, sustain, slow decay
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.06, now + 0.8);
    env.gain.setValueAtTime(0.06, now + 2.5);
    env.gain.linearRampToValueAtTime(0, now + 4.0);

    // Heavy lowpass to simulate distance
    const distanceLp = ctx.createBiquadFilter();
    distanceLp.type = "lowpass";
    distanceLp.frequency.value = 350;
    d.addNode(distanceLp);

    osc1.connect(env);
    osc2.connect(env);
    env.connect(distanceLp);
    distanceLp.connect(out);

    osc1.start(now);
    osc1.stop(now + 4.5);
    osc2.start(now);
    osc2.stop(now + 4.5);

    d.addTimer(setTimeout(horn, randRange(45000, 90000)));
  }

  // First horn after 10-20s
  d.addTimer(setTimeout(horn, randRange(10000, 20000)));

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 19. Barista — espresso hiss bursts + ceramic clinks
// ---------------------------------------------------------------------------
export function barista(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.6;
  d.addNode(out);

  // Periodic espresso-style hiss bursts
  function hissBurst() {
    if (d.isAborted) return;

    const noise = d.addSource(createNoiseSource(ctx, "pink"));
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 3500;
    hp.Q.value = 3;
    d.addNode(hp);

    const env = ctx.createGain();
    env.gain.value = 0;
    d.addNode(env);

    const now = ctx.currentTime;
    const duration = randRange(0.8, 2.0);
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.5, now + 0.1);
    env.gain.setValueAtTime(0.5, now + duration * 0.7);
    env.gain.linearRampToValueAtTime(0, now + duration);

    noise.connect(hp);
    hp.connect(env);
    env.connect(out);

    const stopTimer = setTimeout(() => {
      try { noise.stop(); } catch { /* ok */ }
      try { noise.disconnect(); } catch { /* ok */ }
    }, duration * 1000 + 100);
    d.addTimer(stopTimer);

    d.addTimer(setTimeout(hissBurst, randRange(5000, 12000)));
  }

  // Ceramic clink sounds (short sine pings)
  function ceramicClink() {
    if (d.isAborted) return;

    const count = Math.floor(randRange(1, 3));
    for (let i = 0; i < count; i++) {
      const delay = i * randRange(80, 200);
      const timer = setTimeout(() => {
        if (d.isAborted) return;

        const freq = randRange(1800, 2500);
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.value = freq;
        d.addOsc(osc);

        const env = ctx.createGain();
        env.gain.value = 0;
        d.addNode(env);

        const now = ctx.currentTime;
        env.gain.setValueAtTime(0, now);
        env.gain.linearRampToValueAtTime(randRange(0.15, 0.35), now + 0.002);
        env.gain.exponentialRampToValueAtTime(0.001, now + randRange(0.15, 0.3));

        osc.connect(env);
        env.connect(out);
        osc.start(now);
        osc.stop(now + 0.4);
      }, delay);
      d.addTimer(timer);
    }

    d.addTimer(setTimeout(ceramicClink, randRange(4000, 10000)));
  }

  d.addTimer(setTimeout(hissBurst, randRange(1000, 3000)));
  d.addTimer(setTimeout(ceramicClink, randRange(2000, 5000)));

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// Registry: all generators keyed by their sound ID
// ---------------------------------------------------------------------------

export const SOUND_GENERATORS: Record<string, SoundGenerator> = {
  rain,
  espresso,
  grinder,
  fireplace,
  vinyl,
  jazz,
  "wind-chimes": windChimes,
  keyboard,
  conversations,
  traffic,
  "ceiling-fan": ceilingFan,
  "tea-kettle": teaKettle,
  clock,
  "cat-purring": catPurring,
  "page-turning": pageTurning,
  "neon-buzz": neonBuzz,
  "ice-cubes": iceCubes,
  "train-horn": trainHorn,
  barista,
};
