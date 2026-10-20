// Simulerar ett slotspel och skriver ut återbetalning (RTP), träfffrekvens m.m.
// Användning: node tools/simulate.mjs <spel-id> [antal snurr] [seed]
import { playRound, prepare } from "../js/slot/engine.js";

const id = process.argv[2];
const N = Number(process.argv[3] ?? 1_000_000);
const config = prepare((await import(`../js/slot/games/${id}.js`)).default);

// Snabb deterministisk PRNG (mulberry32) för reproducerbara körningar
let seed = Number(process.argv[4] ?? 12345);
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const bet = 100;
let paid = 0, won = 0, hits = 0, features = 0, featureWin = 0, jackpots = 0, big = 0, maxWin = 0;
let holdWins = 0, holdWinWin = 0, grands = 0, cascades = 0;

for (let i = 0; i < N; i++) {
  paid += bet;
  const r = playRound(config, { bet, rnd });
  let total = r.total;
  cascades += r.steps.length - 1;
  if (r.jackpot) jackpots++;
  if (r.holdWin) { holdWins++; holdWinWin += r.holdWin.total; if (r.holdWin.full) grands++; }
  let pending = r.scatter?.freeSpins ?? 0;
  if (pending) {
    features++;
    let fs = 0;
    while (pending > 0) {
      pending--;
      const f = playRound(config, { bet, free: true, rnd });
      fs += f.total;
      if (f.jackpot) jackpots++;
      pending += f.scatter?.freeSpins ?? 0;
    }
    featureWin += fs;
    total += fs;
  }
  if (r.total > 0) hits++;
  if (total >= bet * 20) big++;
  maxWin = Math.max(maxWin, total);
  won += total;
}

const pct = (x) => (x * 100).toFixed(2) + " %";
const every = (n) => (n ? `1 på ${Math.round(N / n).toLocaleString("sv-SE")}` : "aldrig");
console.log(`${config.name} – ${N.toLocaleString("sv-SE")} snurr`);
console.log(`RTP:               ${pct(won / paid)}`);
console.log(`Träfffrekvens:     ${pct(hits / N)}`);
if (config.cascade) console.log(`Kaskader/snurr:    ${(cascades / N).toFixed(3)}`);
if (features) console.log(`Free spins:        ${every(features)} snurr, ${pct(featureWin / paid)} av RTP`);
if (config.holdWin) console.log(`Hold & Win:        ${every(holdWins)} snurr, ${pct(holdWinWin / paid)} av RTP, Grand ${grands} st`);
if (config.jackpot) console.log(`Jackpott:          ${jackpots} st (${every(jackpots)})`);
console.log(`Storvinst (≥20×):  ${every(big)} snurr`);
console.log(`Största vinst:     ${(maxWin / bet).toFixed(1)}× insatsen`);
