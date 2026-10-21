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

function tone(freq, { type = "sine", start = 0, dur = 0.15, vol = 0.3, slide = 0, attack = 0.005, lowpass = 0, echo = 0 } = {}) {
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
  let node = osc.connect(gain);
  if (lowpass) {
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = lowpass;
    node = node.connect(f);
  }
  node.connect(master);
  // Enkelt eko: en fördröjd, svagare kopia (magiska och kristallklara teman)
  if (echo) {
    const d = c.createDelay(1);
    d.delayTime.value = echo;
    const fb = c.createGain();
    fb.gain.value = 0.35;
    node.connect(d);
    d.connect(fb).connect(master);
  }
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

// Skalor (Hz) för de olika ljudprofilerna
const PENTA = [659.25, 739.99, 830.61, 987.77, 1108.73, 1318.51, 1479.98, 1661.22, 1975.53];
const PHRYGIAN = [329.63, 349.23, 415.3, 440, 493.88, 523.25, 587.33, 659.25, 698.46]; // österländsk dur
const MINOR_PENTA = [220, 261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25];
const MINOR = [261.63, 293.66, 311.13, 349.23, 392, 415.3, 466.16, 523.25, 622.25];

// Ljudprofiler per spel. wave = melodins vågform, scale = toner, stop = hjulstoppets ljud.
const THEMES = {
  classic: { wave: "triangle", scale: NOTES, stop: "thunk" },
  neon: { wave: "square", scale: NOTES.map((n) => n / 2), stop: "blip", vol: 0.1 },
  crystal: { wave: "sine", scale: PENTA, stop: "chime", echo: 0.12 },
  royal: { wave: "sawtooth", scale: NOTES.map((n) => n / 2), stop: "thunk", lowpass: 1800, vol: 0.14 },
  candy: { wave: "sine", scale: NOTES, stop: "pop" },
  mystic: { wave: "sine", scale: MINOR.map((n) => n * 2), stop: "chime", echo: 0.22 },
  egypt: { wave: "triangle", scale: PHRYGIAN.map((n) => n * 2), stop: "drum" },
  western: { wave: "sawtooth", scale: MINOR_PENTA.map((n) => n * 2), stop: "clop", lowpass: 2400, vol: 0.12 },
  prison: { wave: "square", scale: MINOR, stop: "clank", lowpass: 2000, vol: 0.09 },
  steam: { wave: "triangle", scale: NOTES.map((n) => n * 0.75), stop: "chug" },
};
let theme = THEMES.classic;

const note = (i, opts = {}) =>
  tone(theme.scale[Math.min(i, theme.scale.length - 1)], {
    type: theme.wave,
    vol: theme.vol ?? 0.18,
    lowpass: theme.lowpass,
    echo: theme.echo,
    ...opts,
  });

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
  /** Väljer spelets ljudprofil (se THEMES). */
  setTheme(name) {
    theme = THEMES[name] ?? THEMES.classic;
  },
  click() {
    tone(1400, { type: "square", dur: 0.04, vol: 0.06 });
  },
  spin() {
    switch (theme.stop) {
      case "chug":
        [0, 0.12, 0.24].forEach((s) => noise({ start: s, dur: 0.1, vol: 0.18, freq: 400, q: 0.7, type: "lowpass" }));
        break;
      case "blip":
        tone(330, { type: "square", dur: 0.3, vol: 0.06, slide: 660 });
        break;
      case "clank":
        noise({ dur: 0.3, vol: 0.14, freq: 900, q: 0.5 });
        tone(140, { type: "sawtooth", dur: 0.3, vol: 0.06, slide: 80, lowpass: 900 });
        break;
      default:
        noise({ dur: 0.35, vol: 0.12, freq: 600, q: 0.6 });
        tone(220, { type: "triangle", dur: 0.25, vol: 0.12, slide: 220 });
    }
  },
  reelStop(i = 0) {
    switch (theme.stop) {
      case "blip":
        tone(880 - i * 60, { type: "square", dur: 0.06, vol: 0.07 });
        break;
      case "chime":
        tone(theme.scale[i % theme.scale.length] * 2, { type: "sine", dur: 0.35, vol: 0.12, echo: theme.echo });
        tone(90, { type: "sine", dur: 0.1, vol: 0.2, slide: -30 });
        break;
      case "pop":
        tone(300 + i * 70, { type: "sine", dur: 0.09, vol: 0.28, slide: 500 });
        break;
      case "drum":
        tone(80 - i * 3, { type: "sine", dur: 0.22, vol: 0.45, slide: -30 });
        noise({ dur: 0.08, vol: 0.12, freq: 900, q: 0.8 });
        break;
      case "clop":
        tone(520 - i * 30, { type: "sine", dur: 0.05, vol: 0.3 });
        noise({ dur: 0.04, vol: 0.15, freq: 2500, q: 3 });
        break;
      case "clank":
        tone(310, { type: "square", dur: 0.08, vol: 0.06, lowpass: 2500 });
        tone(437, { type: "sine", dur: 0.25, vol: 0.12 });
        noise({ dur: 0.06, vol: 0.18, freq: 4000, q: 2 });
        break;
      case "chug":
        noise({ dur: 0.12, vol: 0.22, freq: 300, q: 0.7, type: "lowpass" });
        tone(70, { type: "sine", dur: 0.12, vol: 0.3, slide: -20 });
        break;
      default:
        tone(110 - i * 6, { type: "sine", dur: 0.14, vol: 0.35, slide: -50 });
        noise({ dur: 0.05, vol: 0.12, freq: 3000, q: 1.5 });
    }
  },
  scatter(i = 0) {
    note(4 + i, { dur: 0.5, vol: 0.22 });
    tone((theme.scale[4 + i] ?? 1500) * 2, { type: "sine", dur: 0.4, vol: 0.08, start: 0.02 });
  },
  anticipation() {
    tone(300, { type: "sawtooth", dur: 1.1, vol: 0.05, slide: 600, attack: 0.2, lowpass: theme.lowpass });
  },
  tick() {
    tone(1800 + Math.random() * 300, { type: "sine", dur: 0.03, vol: 0.05 });
  },
  win(size = 1) {
    const steps = Math.min(3 + size, 7);
    for (let i = 0; i < steps; i++) note(i, { start: i * 0.07, dur: 0.22 });
  },
  bigWin() {
    [0, 2, 4, 5, 7, 8].forEach((n, i) => {
      note(n, { start: i * 0.12, dur: 0.3, vol: 0.1 });
      tone(theme.scale[n] / 2, { type: "triangle", start: i * 0.12, dur: 0.35, vol: 0.15 });
    });
    note(8, { start: 0.75, dur: 1.2, vol: 0.2 });
    if (theme.stop === "chug") this.whistle(0.9);
  },
  feature() {
    [0, 2, 4, 7, 4, 7, 8].forEach((n, i) => note(n, { start: i * 0.09, dur: 0.25, vol: 0.2 }));
    if (theme.stop === "clank") this.siren();
    if (theme.stop === "chug") this.whistle();
  },
  /** Ånglokets vissla (Steam Express). */
  whistle(start = 0) {
    [587.33, 739.99, 880].forEach((f) => tone(f, { type: "sine", start, dur: 0.9, vol: 0.08, attack: 0.08 }));
    noise({ start, dur: 0.9, vol: 0.06, freq: 2500, q: 0.6 });
  },
  /** Larmsiren (Iron Lockdown). */
  siren() {
    for (let i = 0; i < 3; i++) tone(500, { type: "sawtooth", start: i * 0.45, dur: 0.42, vol: 0.05, slide: 400, lowpass: 2200 });
  },
  /** Dynamitsmäll (Ghost Gulch) och liknande. */
  boom() {
    noise({ dur: 0.6, vol: 0.4, freq: 200, q: 0.5, type: "lowpass" });
    tone(60, { type: "sine", dur: 0.5, vol: 0.4, slide: -30 });
  },
  coin() {
    tone(2200, { type: "square", dur: 0.05, vol: 0.04 });
    tone(3300, { type: "square", start: 0.05, dur: 0.08, vol: 0.04 });
  },
  error() {
    tone(180, { type: "square", dur: 0.18, vol: 0.08 });
  },
};
