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
// 20. Distant Train — low rumble with doppler-like sweeps
// ---------------------------------------------------------------------------
export function distantTrain(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.5;
  d.addNode(out);

  // Continuous low rumble — brown noise → lowpass
  const rumble = d.addSource(createNoiseSource(ctx, "brown"));
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 180;
  d.addNode(lp);
  const rumbleGain = ctx.createGain();
  rumbleGain.gain.value = 0.35;
  d.addNode(rumbleGain);

  // Slow sway for the rumble — like the train gently rocking
  const swayLfo = ctx.createOscillator();
  swayLfo.type = "sine";
  swayLfo.frequency.value = 0.12;
  swayLfo.start();
  d.addOsc(swayLfo);
  const swayDepth = ctx.createGain();
  swayDepth.gain.value = 0.1;
  d.addNode(swayDepth);
  swayLfo.connect(swayDepth);
  swayDepth.connect(rumbleGain.gain);

  rumble.connect(lp);
  lp.connect(rumbleGain);
  rumbleGain.connect(out);

  // Rhythmic clickety-clack: gentle timed impulses
  function clack() {
    if (d.isAborted) return;

    const durationS = 0.012;
    const samples = Math.floor(ctx.sampleRate * durationS);
    const buf = ctx.createBuffer(1, samples, ctx.sampleRate);
    const ch = buf.getChannelData(0);
    for (let i = 0; i < samples; i++) {
      ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / samples, 6);
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    d.addSource(src);

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = randRange(600, 1200);
    bp.Q.value = 3;
    d.addNode(bp);

    const clackGain = ctx.createGain();
    clackGain.gain.value = randRange(0.08, 0.18);
    d.addNode(clackGain);

    // Muffle to sound distant
    const distLp = ctx.createBiquadFilter();
    distLp.type = "lowpass";
    distLp.frequency.value = 800;
    d.addNode(distLp);

    src.connect(bp);
    bp.connect(clackGain);
    clackGain.connect(distLp);
    distLp.connect(out);
    src.start();

    // Two clicks close together (clickety-clack pattern)
    const gap = randRange(120, 180);
    d.addTimer(setTimeout(clack, gap));
  }

  // Periodic doppler-like pass: sweep the rumble filter
  function dopplerPass() {
    if (d.isAborted) return;

    const now = ctx.currentTime;
    const sweepDuration = randRange(6, 12);
    // Sweep filter up then back down
    lp.frequency.setValueAtTime(180, now);
    lp.frequency.linearRampToValueAtTime(350, now + sweepDuration * 0.4);
    lp.frequency.linearRampToValueAtTime(180, now + sweepDuration);

    // Volume swell
    rumbleGain.gain.setValueAtTime(0.35, now);
    rumbleGain.gain.linearRampToValueAtTime(0.55, now + sweepDuration * 0.4);
    rumbleGain.gain.linearRampToValueAtTime(0.35, now + sweepDuration);

    d.addTimer(setTimeout(dopplerPass, randRange(20000, 45000)));
  }

  d.addTimer(setTimeout(clack, 500));
  d.addTimer(setTimeout(dopplerPass, randRange(8000, 15000)));

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 21. Birdsong — gentle pentatonic chirps with trills
// ---------------------------------------------------------------------------
export function birdsong(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.5;
  d.addNode(out);

  // Bird-like frequencies (high pentatonic, sparrow-like)
  const birdFreqs = [2200, 2640, 2970, 3520, 3960, 4400, 4950];

  function chirp() {
    if (d.isAborted) return;

    const baseFreq = birdFreqs[Math.floor(Math.random() * birdFreqs.length)];
    const noteCount = Math.floor(randRange(2, 5));
    const now = ctx.currentTime;

    for (let i = 0; i < noteCount; i++) {
      const noteStart = now + i * randRange(0.06, 0.12);
      const noteDuration = randRange(0.04, 0.1);
      const freq = baseFreq * (1 + (Math.random() - 0.5) * 0.15);

      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, noteStart);
      // Slight upward or downward slide for natural sound
      osc.frequency.linearRampToValueAtTime(
        freq * (1 + (Math.random() - 0.5) * 0.1),
        noteStart + noteDuration
      );
      d.addOsc(osc);

      const env = ctx.createGain();
      env.gain.value = 0;
      d.addNode(env);

      const amp = randRange(0.06, 0.15);
      env.gain.setValueAtTime(0, noteStart);
      env.gain.linearRampToValueAtTime(amp, noteStart + 0.005);
      env.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);

      osc.connect(env);
      env.connect(out);
      osc.start(noteStart);
      osc.stop(noteStart + noteDuration + 0.05);
    }

    // Next chirp after a pause
    d.addTimer(setTimeout(chirp, randRange(1500, 5000)));
  }

  // Occasional trill — rapid repeating note
  function trill() {
    if (d.isAborted) return;

    const baseFreq = birdFreqs[Math.floor(Math.random() * birdFreqs.length)];
    const now = ctx.currentTime;
    const trillNotes = Math.floor(randRange(6, 12));

    for (let i = 0; i < trillNotes; i++) {
      const t = now + i * 0.04;
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = baseFreq + (i % 2 === 0 ? 0 : randRange(100, 300));
      d.addOsc(osc);

      const env = ctx.createGain();
      env.gain.value = 0;
      d.addNode(env);

      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.08, t + 0.005);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      osc.connect(env);
      env.connect(out);
      osc.start(t);
      osc.stop(t + 0.05);
    }

    d.addTimer(setTimeout(trill, randRange(6000, 15000)));
  }

  d.addTimer(setTimeout(chirp, randRange(500, 2000)));
  d.addTimer(setTimeout(chirp, randRange(2000, 4000)));
  d.addTimer(setTimeout(trill, randRange(4000, 8000)));

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 22. Crickets — high-frequency rhythmic chirping
// ---------------------------------------------------------------------------
export function crickets(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.45;
  d.addNode(out);

  // Multiple cricket "voices" at slightly different rates and frequencies
  for (let v = 0; v < 3; v++) {
    const freq = randRange(3800, 4600);
    const chirpRate = randRange(6, 10); // chirps per second
    const chirpDuration = randRange(0.015, 0.03);

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.start();
    d.addOsc(osc);

    // AM modulation at chirp rate to create rhythmic pulsing
    const amOsc = ctx.createOscillator();
    amOsc.type = "square";
    amOsc.frequency.value = chirpRate;
    amOsc.start();
    d.addOsc(amOsc);

    // Convert square wave (-1 to 1) into (0 to 1) range for AM
    const amGain = ctx.createGain();
    amGain.gain.value = 0.5;
    d.addNode(amGain);

    const amOffset = ctx.createGain();
    amOffset.gain.value = 0;
    d.addNode(amOffset);

    amOsc.connect(amGain);
    amGain.connect(amOffset.gain);

    // Overall voice volume
    const voiceGain = ctx.createGain();
    voiceGain.gain.value = randRange(0.04, 0.08);
    d.addNode(voiceGain);

    // Gentle bandpass to shape the tone
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = freq;
    bp.Q.value = 15;
    d.addNode(bp);

    osc.connect(bp);
    bp.connect(amOffset);
    amOffset.connect(voiceGain);
    voiceGain.connect(out);

    // Slow volume variation — some crickets get louder/quieter
    const breathLfo = ctx.createOscillator();
    breathLfo.type = "sine";
    breathLfo.frequency.value = randRange(0.05, 0.15);
    breathLfo.start();
    d.addOsc(breathLfo);
    const breathDepth = ctx.createGain();
    breathDepth.gain.value = 0.02;
    d.addNode(breathDepth);
    breathLfo.connect(breathDepth);
    breathDepth.connect(voiceGain.gain);
  }

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 23. Glitch SFX — random digital distortion bursts
// ---------------------------------------------------------------------------
export function glitchSfx(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.35;
  d.addNode(out);

  // Constant low digital hum
  const hum = ctx.createOscillator();
  hum.type = "sawtooth";
  hum.frequency.value = 120;
  hum.start();
  d.addOsc(hum);
  const humGain = ctx.createGain();
  humGain.gain.value = 0.02;
  d.addNode(humGain);
  const humLp = ctx.createBiquadFilter();
  humLp.type = "lowpass";
  humLp.frequency.value = 400;
  d.addNode(humLp);
  hum.connect(humLp);
  humLp.connect(humGain);
  humGain.connect(out);

  function glitch() {
    if (d.isAborted) return;

    const burstCount = Math.floor(randRange(1, 4));
    for (let i = 0; i < burstCount; i++) {
      const delay = i * randRange(30, 100);
      const timer = setTimeout(() => {
        if (d.isAborted) return;

        const durationS = randRange(0.01, 0.06);
        const samples = Math.floor(ctx.sampleRate * durationS);
        const buf = ctx.createBuffer(1, samples, ctx.sampleRate);
        const ch = buf.getChannelData(0);

        // Bitcrushed-style noise
        let val = 0;
        const stepSize = Math.floor(randRange(4, 32));
        for (let j = 0; j < samples; j++) {
          if (j % stepSize === 0) {
            val = (Math.random() * 2 - 1);
          }
          ch[j] = val * Math.pow(1 - j / samples, 2);
        }

        const src = ctx.createBufferSource();
        src.buffer = buf;
        d.addSource(src);

        const glitchGain = ctx.createGain();
        glitchGain.gain.value = randRange(0.1, 0.3);
        d.addNode(glitchGain);

        const bp = ctx.createBiquadFilter();
        bp.type = "bandpass";
        bp.frequency.value = randRange(800, 6000);
        bp.Q.value = randRange(1, 5);
        d.addNode(bp);

        src.connect(bp);
        bp.connect(glitchGain);
        glitchGain.connect(out);
        src.start();
      }, delay);
      d.addTimer(timer);
    }

    d.addTimer(setTimeout(glitch, randRange(3000, 8000)));
  }

  d.addTimer(setTimeout(glitch, randRange(1000, 3000)));

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 24. Drone Hum — low continuous quadcopter-like hum
// ---------------------------------------------------------------------------
export function droneHum(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.4;
  d.addNode(out);

  // Multiple motor oscillators slightly detuned
  const motorFreqs = [85, 170, 255];
  for (const freq of motorFreqs) {
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    osc.frequency.value = freq;
    osc.start();
    d.addOsc(osc);

    const oscGain = ctx.createGain();
    oscGain.gain.value = freq === 85 ? 0.06 : freq === 170 ? 0.04 : 0.02;
    d.addNode(oscGain);

    // Slight pitch wobble for each motor
    const wobble = ctx.createOscillator();
    wobble.type = "sine";
    wobble.frequency.value = randRange(0.3, 0.8);
    wobble.start();
    d.addOsc(wobble);
    const wobbleDepth = ctx.createGain();
    wobbleDepth.gain.value = freq * 0.008;
    d.addNode(wobbleDepth);
    wobble.connect(wobbleDepth);
    wobbleDepth.connect(osc.frequency);

    osc.connect(oscGain);
    oscGain.connect(out);
  }

  // Broad noise layer for propeller wash
  const wash = d.addSource(createNoiseSource(ctx, "pink"));
  const washBp = ctx.createBiquadFilter();
  washBp.type = "bandpass";
  washBp.frequency.value = 300;
  washBp.Q.value = 0.5;
  d.addNode(washBp);
  const washGain = ctx.createGain();
  washGain.gain.value = 0.04;
  d.addNode(washGain);

  wash.connect(washBp);
  washBp.connect(washGain);
  washGain.connect(out);

  // Distance modulation — drone slowly gets closer/farther
  const distLfo = ctx.createOscillator();
  distLfo.type = "sine";
  distLfo.frequency.value = 0.03;
  distLfo.start();
  d.addOsc(distLfo);
  const distDepth = ctx.createGain();
  distDepth.gain.value = 0.15;
  d.addNode(distDepth);
  distLfo.connect(distDepth);
  distDepth.connect(out.gain);

  // Lowpass to keep it distant and soothing
  const masterLp = ctx.createBiquadFilter();
  masterLp.type = "lowpass";
  masterLp.frequency.value = 600;
  d.addNode(masterLp);

  const realOut = ctx.createGain();
  realOut.gain.value = 1;
  d.addNode(realOut);

  out.connect(masterLp);
  masterLp.connect(realOut);

  return { node: realOut, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 25. Lo-Fi Radio — warm muffled beats with vinyl crackle
// ---------------------------------------------------------------------------
export function lofiRadio(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.45;
  d.addNode(out);

  // Warm chord pad: stacked sine tones (Am7 voicing)
  // A3≈220, C4≈261.63, E4≈329.63, G4≈392
  const chordFreqs = [220, 261.63, 329.63, 392];
  for (const freq of chordFreqs) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    osc.start();
    d.addOsc(osc);

    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.025;
    d.addNode(oscGain);

    // Gentle vibrato
    const vib = ctx.createOscillator();
    vib.type = "sine";
    vib.frequency.value = randRange(3, 5);
    vib.start();
    d.addOsc(vib);
    const vibDepth = ctx.createGain();
    vibDepth.gain.value = 0.004;
    d.addNode(vibDepth);
    vib.connect(vibDepth);
    vibDepth.connect(oscGain.gain);

    osc.connect(oscGain);
    oscGain.connect(out);
  }

  // Slow "beat" — kick-like pulse
  const kickOsc = ctx.createOscillator();
  kickOsc.type = "sine";
  kickOsc.frequency.value = 60;
  kickOsc.start();
  d.addOsc(kickOsc);

  // AM at ~1.5 Hz (~90 BPM feel)
  const beatLfo = ctx.createOscillator();
  beatLfo.type = "sine";
  beatLfo.frequency.value = 1.5;
  beatLfo.start();
  d.addOsc(beatLfo);
  const beatDepth = ctx.createGain();
  beatDepth.gain.value = 0.015;
  d.addNode(beatDepth);
  const kickGain = ctx.createGain();
  kickGain.gain.value = 0;
  d.addNode(kickGain);
  beatLfo.connect(beatDepth);
  beatDepth.connect(kickGain.gain);
  kickOsc.connect(kickGain);
  kickGain.connect(out);

  // Vinyl surface noise
  const hiss = d.addSource(createNoiseSource(ctx, "white"));
  const hissLp = ctx.createBiquadFilter();
  hissLp.type = "lowpass";
  hissLp.frequency.value = 800;
  d.addNode(hissLp);
  const hissGain = ctx.createGain();
  hissGain.gain.value = 0.03;
  d.addNode(hissGain);
  hiss.connect(hissLp);
  hissLp.connect(hissGain);
  hissGain.connect(out);

  // Overall heavy lowpass — sounds like it's coming through a small speaker
  const muffle = ctx.createBiquadFilter();
  muffle.type = "lowpass";
  muffle.frequency.value = 900;
  d.addNode(muffle);

  const realOut = ctx.createGain();
  realOut.gain.value = 1;
  d.addNode(realOut);

  out.connect(muffle);
  muffle.connect(realOut);

  return { node: realOut, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 26. Cat Meow — periodic soothing meow sounds
// ---------------------------------------------------------------------------
export function catMeow(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.4;
  d.addNode(out);

  function meow() {
    if (d.isAborted) return;

    const now = ctx.currentTime;
    const duration = randRange(0.4, 0.8);

    // Main vocal formant — sine sweep
    const osc = ctx.createOscillator();
    osc.type = "sine";
    const startFreq = randRange(400, 500);
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.linearRampToValueAtTime(startFreq * 1.8, now + duration * 0.3);
    osc.frequency.linearRampToValueAtTime(startFreq * 1.2, now + duration * 0.7);
    osc.frequency.linearRampToValueAtTime(startFreq * 0.8, now + duration);
    d.addOsc(osc);

    // Second formant (nasal quality)
    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(startFreq * 2.5, now);
    osc2.frequency.linearRampToValueAtTime(startFreq * 3.5, now + duration * 0.3);
    osc2.frequency.linearRampToValueAtTime(startFreq * 2.8, now + duration);
    d.addOsc(osc2);

    const env = ctx.createGain();
    env.gain.value = 0;
    d.addNode(env);
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.15, now + duration * 0.15);
    env.gain.setValueAtTime(0.15, now + duration * 0.6);
    env.gain.linearRampToValueAtTime(0, now + duration);

    const env2 = ctx.createGain();
    env2.gain.value = 0;
    d.addNode(env2);
    env2.gain.setValueAtTime(0, now);
    env2.gain.linearRampToValueAtTime(0.04, now + duration * 0.2);
    env2.gain.linearRampToValueAtTime(0, now + duration);

    // Breathy noise component
    const noise = d.addSource(createNoiseSource(ctx, "pink"));
    const noiseBp = ctx.createBiquadFilter();
    noiseBp.type = "bandpass";
    noiseBp.frequency.value = 1200;
    noiseBp.Q.value = 2;
    d.addNode(noiseBp);
    const noiseEnv = ctx.createGain();
    noiseEnv.gain.value = 0;
    d.addNode(noiseEnv);
    noiseEnv.gain.setValueAtTime(0, now);
    noiseEnv.gain.linearRampToValueAtTime(0.06, now + duration * 0.1);
    noiseEnv.gain.linearRampToValueAtTime(0, now + duration);

    // Muffle slightly for distance
    const mewLp = ctx.createBiquadFilter();
    mewLp.type = "lowpass";
    mewLp.frequency.value = 1800;
    d.addNode(mewLp);

    osc.connect(env);
    osc2.connect(env2);
    noise.connect(noiseBp);
    noiseBp.connect(noiseEnv);
    env.connect(mewLp);
    env2.connect(mewLp);
    noiseEnv.connect(mewLp);
    mewLp.connect(out);

    osc.start(now);
    osc.stop(now + duration + 0.1);
    osc2.start(now);
    osc2.stop(now + duration + 0.1);

    const stopTimer = setTimeout(() => {
      try { noise.stop(); } catch { /* ok */ }
      try { noise.disconnect(); } catch { /* ok */ }
    }, (duration + 0.2) * 1000);
    d.addTimer(stopTimer);

    // Next meow after a long pause — cats are lazy
    d.addTimer(setTimeout(meow, randRange(12000, 30000)));
  }

  d.addTimer(setTimeout(meow, randRange(3000, 8000)));

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 27. Muffled Bass — sub-bass pulses heard through a wall
// ---------------------------------------------------------------------------
export function muffledBass(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.45;
  d.addNode(out);

  // Sub-bass oscillator
  const bass = ctx.createOscillator();
  bass.type = "sine";
  bass.frequency.value = 45;
  bass.start();
  d.addOsc(bass);

  const bassGain = ctx.createGain();
  bassGain.gain.value = 0.2;
  d.addNode(bassGain);

  // Beat pattern AM at ~2.2 Hz (~130 BPM, club-like)
  const beatLfo = ctx.createOscillator();
  beatLfo.type = "sine";
  beatLfo.frequency.value = 2.2;
  beatLfo.start();
  d.addOsc(beatLfo);
  const beatDepth = ctx.createGain();
  beatDepth.gain.value = 0.12;
  d.addNode(beatDepth);
  beatLfo.connect(beatDepth);
  beatDepth.connect(bassGain.gain);

  bass.connect(bassGain);
  bassGain.connect(out);

  // Mid-frequency body noise (muffled synth/crowd)
  const bodyNoise = d.addSource(createNoiseSource(ctx, "pink"));
  const bodyBp = ctx.createBiquadFilter();
  bodyBp.type = "bandpass";
  bodyBp.frequency.value = 300;
  bodyBp.Q.value = 1.5;
  d.addNode(bodyBp);
  const bodyGain = ctx.createGain();
  bodyGain.gain.value = 0.04;
  d.addNode(bodyGain);

  // Beat modulation on body too
  const bodyBeatDepth = ctx.createGain();
  bodyBeatDepth.gain.value = 0.02;
  d.addNode(bodyBeatDepth);
  beatLfo.connect(bodyBeatDepth);
  bodyBeatDepth.connect(bodyGain.gain);

  bodyNoise.connect(bodyBp);
  bodyBp.connect(bodyGain);
  bodyGain.connect(out);

  // Heavy lowpass — simulates walls absorbing highs
  const wallLp = ctx.createBiquadFilter();
  wallLp.type = "lowpass";
  wallLp.frequency.value = 200;
  d.addNode(wallLp);

  const realOut = ctx.createGain();
  realOut.gain.value = 1;
  d.addNode(realOut);

  out.connect(wallLp);
  wallLp.connect(realOut);

  return { node: realOut, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 28. Radio Static — white noise with intermittent crackle
// ---------------------------------------------------------------------------
export function radioStatic(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.35;
  d.addNode(out);

  // Base static: filtered white noise
  const noise = d.addSource(createNoiseSource(ctx, "white"));
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 3000;
  bp.Q.value = 0.3;
  d.addNode(bp);
  const staticGain = ctx.createGain();
  staticGain.gain.value = 0.06;
  d.addNode(staticGain);

  noise.connect(bp);
  bp.connect(staticGain);
  staticGain.connect(out);

  // Occasional "tuning" sweep
  function sweep() {
    if (d.isAborted) return;
    const now = ctx.currentTime;
    const dur = randRange(0.5, 2.0);
    bp.frequency.setValueAtTime(3000, now);
    bp.frequency.linearRampToValueAtTime(randRange(1000, 6000), now + dur * 0.5);
    bp.frequency.linearRampToValueAtTime(3000, now + dur);

    d.addTimer(setTimeout(sweep, randRange(8000, 20000)));
  }

  // Intermittent crackle bursts
  function burst() {
    if (d.isAborted) return;

    const count = Math.floor(randRange(2, 6));
    for (let i = 0; i < count; i++) {
      const delay = i * randRange(10, 50);
      const timer = setTimeout(() => {
        if (d.isAborted) return;
        const samples = Math.floor(ctx.sampleRate * randRange(0.002, 0.008));
        const buf = ctx.createBuffer(1, samples, ctx.sampleRate);
        const ch = buf.getChannelData(0);
        for (let j = 0; j < samples; j++) {
          ch[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / samples, 3);
        }
        const src = ctx.createBufferSource();
        src.buffer = buf;
        d.addSource(src);
        const crackGain = ctx.createGain();
        crackGain.gain.value = randRange(0.1, 0.3);
        d.addNode(crackGain);
        src.connect(crackGain);
        crackGain.connect(out);
        src.start();
      }, delay);
      d.addTimer(timer);
    }

    d.addTimer(setTimeout(burst, randRange(2000, 6000)));
  }

  d.addTimer(setTimeout(sweep, randRange(5000, 10000)));
  d.addTimer(setTimeout(burst, randRange(1000, 3000)));

  // Slow overall volume breathing
  const breathLfo = ctx.createOscillator();
  breathLfo.type = "sine";
  breathLfo.frequency.value = 0.08;
  breathLfo.start();
  d.addOsc(breathLfo);
  const breathDepth = ctx.createGain();
  breathDepth.gain.value = 0.02;
  d.addNode(breathDepth);
  breathLfo.connect(breathDepth);
  breathDepth.connect(out.gain);

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 29. Acoustic Guitar — gentle arpeggiated string tones
// ---------------------------------------------------------------------------
export function acousticGuitar(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.5;
  d.addNode(out);

  // Chord progressions: Am → C → G → Em (soothing campfire feel)
  const chords = [
    [220.0, 261.63, 329.63],  // Am: A3, C4, E4
    [261.63, 329.63, 392.0],  // C: C4, E4, G4
    [196.0, 246.94, 293.66],  // G: G3, B3, D4
    [164.81, 196.0, 246.94],  // Em: E3, G3, B3
  ];
  let chordIdx = 0;

  function strum() {
    if (d.isAborted) return;

    const chord = chords[chordIdx % chords.length];
    chordIdx++;

    const now = ctx.currentTime;

    chord.forEach((freq, i) => {
      const noteStart = now + i * randRange(0.08, 0.15);
      const noteDuration = randRange(1.5, 2.5);

      // Karplus-Strong-like: use a shaped noise burst + sine for string quality
      const osc = ctx.createOscillator();
      osc.type = "triangle"; // warmer than sine, softer than square
      osc.frequency.value = freq;
      d.addOsc(osc);

      const env = ctx.createGain();
      env.gain.value = 0;
      d.addNode(env);

      const amplitude = randRange(0.06, 0.12);
      env.gain.setValueAtTime(0, noteStart);
      env.gain.linearRampToValueAtTime(amplitude, noteStart + 0.005);
      env.gain.exponentialRampToValueAtTime(0.001, noteStart + noteDuration);

      // Body resonance filter
      const bodyBp = ctx.createBiquadFilter();
      bodyBp.type = "bandpass";
      bodyBp.frequency.value = 400;
      bodyBp.Q.value = 0.5;
      d.addNode(bodyBp);

      osc.connect(env);
      env.connect(bodyBp);
      bodyBp.connect(out);
      osc.start(noteStart);
      osc.stop(noteStart + noteDuration + 0.1);
    });

    // Next strum after 3-6 seconds
    d.addTimer(setTimeout(strum, randRange(3000, 6000)));
  }

  d.addTimer(setTimeout(strum, randRange(500, 2000)));

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 30. Coyote Howl — distant gliding pitched tones
// ---------------------------------------------------------------------------
export function coyoteHowl(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.35;
  d.addNode(out);

  function howl() {
    if (d.isAborted) return;

    const now = ctx.currentTime;
    const duration = randRange(2.5, 4.5);
    const baseFreq = randRange(280, 380);

    // Main vocal tone
    const osc = ctx.createOscillator();
    osc.type = "sine";
    // Characteristic howl shape: rise → sustain high → fall
    osc.frequency.setValueAtTime(baseFreq * 0.6, now);
    osc.frequency.linearRampToValueAtTime(baseFreq, now + duration * 0.2);
    osc.frequency.setValueAtTime(baseFreq, now + duration * 0.5);
    osc.frequency.linearRampToValueAtTime(baseFreq * 1.1, now + duration * 0.65);
    osc.frequency.linearRampToValueAtTime(baseFreq * 0.5, now + duration);
    d.addOsc(osc);

    // Slight vibrato
    const vib = ctx.createOscillator();
    vib.type = "sine";
    vib.frequency.value = 5;
    vib.start();
    d.addOsc(vib);
    const vibDepth = ctx.createGain();
    vibDepth.gain.value = 8;
    d.addNode(vibDepth);
    vib.connect(vibDepth);
    vibDepth.connect(osc.frequency);

    // Envelope
    const env = ctx.createGain();
    env.gain.value = 0;
    d.addNode(env);
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(0.1, now + duration * 0.15);
    env.gain.setValueAtTime(0.1, now + duration * 0.6);
    env.gain.linearRampToValueAtTime(0, now + duration);

    // Distance muffling
    const distLp = ctx.createBiquadFilter();
    distLp.type = "lowpass";
    distLp.frequency.value = 600;
    d.addNode(distLp);

    osc.connect(env);
    env.connect(distLp);
    distLp.connect(out);
    osc.start(now);
    osc.stop(now + duration + 0.1);

    const vibStop = setTimeout(() => {
      try { vib.stop(); } catch { /* ok */ }
    }, (duration + 0.2) * 1000);
    d.addTimer(vibStop);

    // Occasional follow-up yip (short bark)
    if (Math.random() < 0.4) {
      const yipDelay = (duration + randRange(0.3, 0.8)) * 1000;
      d.addTimer(setTimeout(() => {
        if (d.isAborted) return;
        const yipNow = ctx.currentTime;
        const yipOsc = ctx.createOscillator();
        yipOsc.type = "sine";
        yipOsc.frequency.setValueAtTime(baseFreq * 1.5, yipNow);
        yipOsc.frequency.linearRampToValueAtTime(baseFreq * 2, yipNow + 0.1);
        d.addOsc(yipOsc);
        const yipEnv = ctx.createGain();
        yipEnv.gain.value = 0;
        d.addNode(yipEnv);
        yipEnv.gain.setValueAtTime(0, yipNow);
        yipEnv.gain.linearRampToValueAtTime(0.06, yipNow + 0.02);
        yipEnv.gain.exponentialRampToValueAtTime(0.001, yipNow + 0.15);
        yipOsc.connect(yipEnv);
        yipEnv.connect(distLp);
        yipOsc.start(yipNow);
        yipOsc.stop(yipNow + 0.2);
      }, yipDelay));
    }

    // Next howl after a long wait
    d.addTimer(setTimeout(howl, randRange(25000, 60000)));
  }

  d.addTimer(setTimeout(howl, randRange(5000, 15000)));

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 31. Owl Hoot — low breathy periodic hoots
// ---------------------------------------------------------------------------
export function owlHoot(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.4;
  d.addNode(out);

  function hoot() {
    if (d.isAborted) return;

    const now = ctx.currentTime;
    // "hoo-hoo-hoo-hooooo" pattern
    const pattern = [0.25, 0.25, 0.25, 0.7];
    let offset = 0;

    for (const dur of pattern) {
      const t = now + offset;

      const osc = ctx.createOscillator();
      osc.type = "sine";
      const freq = randRange(260, 310);
      osc.frequency.setValueAtTime(freq, t);
      // Slight downward pitch at end of each note
      osc.frequency.linearRampToValueAtTime(freq * 0.92, t + dur);
      d.addOsc(osc);

      const env = ctx.createGain();
      env.gain.value = 0;
      d.addNode(env);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(0.12, t + 0.03);
      env.gain.setValueAtTime(0.12, t + dur * 0.7);
      env.gain.linearRampToValueAtTime(0, t + dur);

      // Breathy noise layer
      const noise = d.addSource(createNoiseSource(ctx, "brown"));
      const noiseLp = ctx.createBiquadFilter();
      noiseLp.type = "lowpass";
      noiseLp.frequency.value = 400;
      d.addNode(noiseLp);
      const noiseEnv = ctx.createGain();
      noiseEnv.gain.value = 0;
      d.addNode(noiseEnv);
      noiseEnv.gain.setValueAtTime(0, t);
      noiseEnv.gain.linearRampToValueAtTime(0.04, t + 0.02);
      noiseEnv.gain.linearRampToValueAtTime(0, t + dur);

      // Distance filter
      const distLp = ctx.createBiquadFilter();
      distLp.type = "lowpass";
      distLp.frequency.value = 500;
      d.addNode(distLp);

      osc.connect(env);
      noise.connect(noiseLp);
      noiseLp.connect(noiseEnv);
      env.connect(distLp);
      noiseEnv.connect(distLp);
      distLp.connect(out);

      osc.start(t);
      osc.stop(t + dur + 0.05);

      const stopNoise = setTimeout(() => {
        try { noise.stop(); } catch { /* ok */ }
        try { noise.disconnect(); } catch { /* ok */ }
      }, (offset + dur + 0.1) * 1000);
      d.addTimer(stopNoise);

      offset += dur + randRange(0.15, 0.3);
    }

    d.addTimer(setTimeout(hoot, randRange(15000, 35000)));
  }

  d.addTimer(setTimeout(hoot, randRange(3000, 8000)));

  return { node: out, cleanup: () => d.cleanup() };
}

// ---------------------------------------------------------------------------
// 32. Shimmer SFX — descending sparkle tones (shooting star)
// ---------------------------------------------------------------------------
export function shimmerSfx(ctx: AudioContext): SoundGeneratorResult {
  const d = new Disposer();
  const out = ctx.createGain();
  out.gain.value = 0.4;
  d.addNode(out);

  // Very quiet background shimmer — high filtered noise
  const bgNoise = d.addSource(createNoiseSource(ctx, "white"));
  const bgHp = ctx.createBiquadFilter();
  bgHp.type = "highpass";
  bgHp.frequency.value = 8000;
  d.addNode(bgHp);
  const bgGain = ctx.createGain();
  bgGain.gain.value = 0.01;
  d.addNode(bgGain);
  bgNoise.connect(bgHp);
  bgHp.connect(bgGain);
  bgGain.connect(out);

  function sparkle() {
    if (d.isAborted) return;

    const now = ctx.currentTime;
    const noteCount = Math.floor(randRange(5, 10));
    const totalDuration = randRange(1.5, 3.0);

    // Descending cascade of high sine pings
    for (let i = 0; i < noteCount; i++) {
      const t = now + (i / noteCount) * totalDuration;
      const freq = randRange(2000, 6000) * (1 - i / noteCount * 0.4);
      const dur = randRange(0.3, 0.8);

      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = freq;
      d.addOsc(osc);

      const env = ctx.createGain();
      env.gain.value = 0;
      d.addNode(env);

      const amp = randRange(0.03, 0.08);
      env.gain.setValueAtTime(0, t);
      env.gain.linearRampToValueAtTime(amp, t + 0.005);
      env.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(env);
      env.connect(out);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }

    // Next shimmer after a long wait
    d.addTimer(setTimeout(sparkle, randRange(15000, 40000)));
  }

  d.addTimer(setTimeout(sparkle, randRange(3000, 8000)));

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

  // ---- Scene-specific procedural sounds (replacing TODO placeholders) ----

  // Train Station
  "distant-train": distantTrain,
  "birdsong": birdsong,
  "crickets": crickets,

  // Library (reusing existing generators with scene-specific IDs)
  "lib-cat": catPurring,
  "lib-clock": clock,
  "lib-fireplace": fireplace,
  "lib-record": vinyl,

  // Cyberpunk
  "glitch-sfx": glitchSfx,
  "drone-hum": droneHum,
  "cy-neon": neonBuzz,
  "lofi-radio": lofiRadio,
  "cat-meow": catMeow,
  "muffled-bass": muffledBass,
  "radio-static": radioStatic,

  // Desert
  "de-campfire": fireplace,
  "de-crackle": fireplace,
  "acoustic-guitar": acousticGuitar,
  "coyote-howl": coyoteHowl,
  "de-crickets": crickets,
  "owl-hoot": owlHoot,
  "shimmer-sfx": shimmerSfx,

  // Shared aliases for scene-specific IDs
  "tr-train": distantTrain,
  "tr-birds": birdsong,
  "tr-crickets": crickets,
  "cy-hologram": glitchSfx,
  "cy-drone": droneHum,
  "cy-radio": lofiRadio,
  "cy-cat": catMeow,
  "cy-music": muffledBass,
  "cy-satellite": radioStatic,
  "de-guitar": acousticGuitar,
  "de-coyote": coyoteHowl,
  "de-owl": owlHoot,
  "de-star": shimmerSfx,

  // Mountain Café (procedural aliases)
  "mt-espresso": espresso,
  "mt-barista": barista,
  "mt-vinyl": vinyl,
  "mt-fan": ceilingFan,
};
