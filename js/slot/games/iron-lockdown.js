// Iron Lockdown – 6×4 med 4 096 vägar och mysterieboxar (xWays).
// Alla boxar i en snurr avslöjar samma symbol och räknas som 2–4 symboler var,
// vilket ger fler vägar. Under bonusen höjer varje box multiplikatorn, som aldrig sjunker.
import { GAMES } from "../../data/games.js";
import { BETS } from "../bets.js";

const base = { ten: 12, jack: 12, queen: 11, king: 11, ace: 10, lamp: 6, lock: 5, cuffs: 4, key: 3, mystery: 1.6, siren: 1.15 };
const withWild = { ...base, wild: 1 };
const free = { ...base, mystery: 2.2, siren: 0.6 };
const freeWild = { ...free, wild: 0.8 };

export default {
  ...GAMES.find((g) => g.id === "iron-lockdown"),
  rtp: 96,
  reels: 6,
  rows: 4,
  mode: "ways",
  ways: { divisor: 3.4 },
  bets: BETS,
  wild: "wild",
  mystery: {
    id: "mystery",
    reveal: { ten: 10, jack: 10, queen: 9, king: 9, ace: 8, lamp: 6, lock: 5, cuffs: 4, key: 3, wild: 1.5 },
  },
  scatter: { id: "siren", pays: { 3: 2, 4: 10, 5: 50, 6: 200 }, retrigger: { 3: 3 } },
  bonus: {
    byScatter: { 3: 0, 4: 1, 5: 2 },
    levels: [
      { name: "Lockdown", spins: 10, startMultiplier: 1, multiplierPerMystery: 1, desc: "10 free spins. Varje mysteriebox höjer multiplikatorn +1 – den sjunker aldrig." },
      { name: "Högsäkerhet", spins: 12, startMultiplier: 3, multiplierPerMystery: 1, desc: "12 free spins. Multiplikatorn börjar på ×3 och varje box ger +1." },
      { name: "Isoleringen", spins: 12, startMultiplier: 5, multiplierPerMystery: 2, desc: "12 free spins. Multiplikatorn börjar på ×5 och varje box ger +2." },
    ],
  },
  bonusBuy: [
    { label: "Lockdown", level: 0, price: 50 },
    { label: "Högsäkerhet", level: 1, price: 89 },
    { label: "Isoleringen", level: 2, price: 165 },
  ],
  symbols: {
    ten: { pays: { 3: 0.2, 4: 0.5, 5: 1, 6: 2 } },
    jack: { pays: { 3: 0.2, 4: 0.5, 5: 1, 6: 2 } },
    queen: { pays: { 3: 0.2, 4: 0.6, 5: 1.2, 6: 2.5 } },
    king: { pays: { 3: 0.3, 4: 0.8, 5: 1.5, 6: 3 } },
    ace: { pays: { 3: 0.3, 4: 0.8, 5: 1.5, 6: 3 } },
    lamp: { pays: { 3: 0.5, 4: 1.5, 5: 3, 6: 6 } },
    lock: { pays: { 3: 0.8, 4: 2, 5: 4, 6: 8 } },
    cuffs: { pays: { 3: 1, 4: 3, 5: 6, 6: 12 } },
    key: { pays: { 3: 1.5, 4: 5, 5: 10, 6: 25 } },
    wild: { pays: {} },
    mystery: { noLine: true, values: { 2: 6, 3: 3, 4: 1 } },
    siren: { noLine: true },
  },
  weights: [base, withWild, withWild, withWild, withWild, base],
  freeWeights: [free, freeWild, freeWild, freeWild, freeWild, free],
};
