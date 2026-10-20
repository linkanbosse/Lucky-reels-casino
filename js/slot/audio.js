// Lucky Reels – syntetiserade ljudeffekter med Web Audio API.
// Inga ljudfiler behövs: allt genereras i realtid, vilket håller sidan lätt.

let ctx = null;
let master = null;
let enabled = true;

function ac() {
  if (!enabled) return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq, { type = "sine", start = 0, dur = 0.15, vol = 0.3, slide = 0, attack = 0.005 } = {}) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + start;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise({ start = 0, dur = 0.2, vol = 0.15, freq = 1200, q = 0.8, type = "bandpass" } = {}) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + start;
  const len = Math.ceil(c.sampleRate * dur);
  const buffer = c.createBuffer(1, len, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;
  filter.Q.value = q;
  const gain = c.createGain();
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain).connect(master);
  src.start(t);
}

const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98];

export const sfx = {
  setEnabled(on) {
    enabled = on;
    if (!on && ctx) ctx.suspend();
  },
  get enabled() {
    return enabled;
  },
  /** Måste anropas från en användarhändelse första gången (mobilwebbläsare kräver det). */
  unlock() {
    ac();
  },
  click() {
    tone(1400, { type: "square", dur: 0.04, vol: 0.06 });
  },
  spin() {
    noise({ dur: 0.35, vol: 0.12, freq: 600, q: 0.6 });
    tone(220, { type: "triangle", dur: 0.25, vol: 0.12, slide: 220 });
  },
  reelStop(i = 0) {
    tone(110 - i * 6, { type: "sine", dur: 0.14, vol: 0.35, slide: -50 });
    noise({ dur: 0.05, vol: 0.12, freq: 3000, q: 1.5 });
  },
  scatter(i = 0) {
    tone(NOTES[4 + i] ?? 1500, { type: "triangle", dur: 0.5, vol: 0.22 });
    tone((NOTES[4 + i] ?? 1500) * 2, { type: "sine", dur: 0.4, vol: 0.08, start: 0.02 });
  },
  anticipation() {
    tone(300, { type: "sawtooth", dur: 1.1, vol: 0.05, slide: 600, attack: 0.2 });
  },
  tick() {
    tone(1800 + Math.random() * 300, { type: "sine", dur: 0.03, vol: 0.05 });
  },
  win(size = 1) {
    const steps = Math.min(3 + size, 7);
    for (let i = 0; i < steps; i++) tone(NOTES[i], { type: "triangle", start: i * 0.07, dur: 0.22, vol: 0.18 });
  },
  bigWin() {
    [0, 2, 4, 5, 7, 8].forEach((n, i) => {
      tone(NOTES[n], { type: "square", start: i * 0.12, dur: 0.3, vol: 0.08 });
      tone(NOTES[n] / 2, { type: "triangle", start: i * 0.12, dur: 0.35, vol: 0.15 });
    });
    tone(NOTES[8], { type: "triangle", start: 0.75, dur: 1.2, vol: 0.2 });
  },
  feature() {
    [0, 2, 4, 7, 4, 7, 8].forEach((n, i) => tone(NOTES[n], { type: "triangle", start: i * 0.09, dur: 0.25, vol: 0.2 }));
  },
  coin() {
    tone(2200, { type: "square", dur: 0.05, vol: 0.04 });
    tone(3300, { type: "square", start: 0.05, dur: 0.08, vol: 0.04 });
  },
  error() {
    tone(180, { type: "square", dur: 0.18, vol: 0.08 });
  },
};
