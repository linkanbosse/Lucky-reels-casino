// Simulerar ett slotspel och skriver ut återbetalning (RTP), träfffrekvens m.m.
// Användning: node tools/simulate.mjs <spel-id> [antal snurr] [seed] [--buy N]
//   --buy N  simulerar bonusköp nummer N (0 = första) och visar köpets RTP i stället
import { playRound, prepare, bonusState, buyHoldWin } from "../js/slot/engine.js";

const args = process.argv.slice(2);
const buyIndex = args.includes("--buy") ? Number(args[args.indexOf("--buy") + 1]) : null;
const pos = args.filter((a, i) => !a.startsWith("--") && args[i - 1] !== "--buy");
const id = pos[0];
const N = Number(pos[1] ?? 1_000_000);
const config = prepare((await import(`../js/slot/games/${id}.js`)).default);

// Snabb deterministisk PRNG (mulberry32) för reproducerbara körningar
let seed = Number(pos[2] ?? 12345);
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const bet = 100;
let paid = 0, won = 0, hits = 0, features = 0, featureWin = 0, jackpots = 0, big = 0, maxWin = 0;
let holdWins = 0, holdWinWin = 0, grands = 0, cascades = 0;
const levelCount = {}, levelWin = {};

// Spelar en hel free spins-omgång och returnerar vinsten
function freeSpins(spins, level) {
  let pending = spins;
  let state = level >= 0 && config.bonus ? bonusState(config, level) : null;
  let fs = 0;
  while (pending > 0) {
    pending--;
    const f = playRound(config, { bet, free: true, rnd, state });
    fs += f.total;
    if (f.jackpot) jackpots++;
    state = f.state;
    pending += f.scatter?.freeSpins ?? 0;
  }
  return fs;
}

for (let i = 0; i < N; i++) {
  let total = 0;
  if (buyIndex !== null) {
    const opt = config.bonusBuy[buyIndex];
    paid += bet * opt.price;
    if (opt.coins) {
      const r = buyHoldWin(config, { bet, coins: opt.coins, extra: opt.extra, rnd });
      total = r.total;
      holdWins++;
      if (r.holdWin.full) grands++;
    } else {
      total = freeSpins(config.bonus.levels[opt.level].spins, opt.level);
    }
  } else {
    paid += bet;
    const r = playRound(config, { bet, rnd });
    total = r.total;
    cascades += r.steps.length - 1;
    if (r.jackpot) jackpots++;
    if (r.holdWin) { holdWins++; holdWinWin += r.holdWin.total; if (r.holdWin.full) grands++; }
    const spins = r.scatter?.freeSpins ?? 0;
    if (spins) {
      features++;
      const level = r.scatter.level ?? -1;
      const fs = freeSpins(spins, level);
      levelCount[level] = (levelCount[level] ?? 0) + 1;
      levelWin[level] = (levelWin[level] ?? 0) + fs;
      featureWin += fs;
      total += fs;
    }
    if (r.total > 0) hits++;
  }
  if (total >= bet * 20) big++;
  maxWin = Math.max(maxWin, total);
  won += total;
}

const pct = (x) => (x * 100).toFixed(2) + " %";
const every = (n) => (n ? `1 på ${Math.round(N / n).toLocaleString("sv-SE")}` : "aldrig");
console.log(`${config.name} – ${N.toLocaleString("sv-SE")} ${buyIndex !== null ? `bonusköp (${config.bonusBuy[buyIndex].label})` : "snurr"}`);
console.log(`RTP:               ${pct(won / paid)}`);
if (buyIndex !== null) {
  console.log(`Snittvinst:        ${(won / N / bet).toFixed(1)}× insatsen (pris ${config.bonusBuy[buyIndex].price}×)`);
} else {
  console.log(`Träfffrekvens:     ${pct(hits / N)}`);
  if (config.cascade) console.log(`Kaskader/snurr:    ${(cascades / N).toFixed(3)}`);
  if (features) console.log(`Free spins:        ${every(features)} snurr, ${pct(featureWin / paid)} av RTP`);
  for (const l of Object.keys(levelCount).sort()) {
    if (l < 0) continue;
    console.log(`  ${config.bonus.levels[l].name}: ${every(levelCount[l])}, snitt ${(levelWin[l] / levelCount[l] / bet).toFixed(1)}×`);
  }
  if (config.holdWin) console.log(`Hold & Win:        ${every(holdWins)} snurr, ${pct(holdWinWin / paid)} av RTP, fullt bräde ${grands} st`);
}
if (config.jackpot) console.log(`Jackpott:          ${jackpots} st (${every(jackpots)})`);
console.log(`Storvinst (≥20×):  ${every(big)}`);
console.log(`Största vinst:     ${(maxWin / bet).toFixed(1)}× insatsen`);
