// Ghost Gulch – 5×4 med 1 024 vägar.
// Dynamit är WILD och spränger grannrutorna till wilds. 3, 4 eller 5 dödskallar
// startar tre olika bonusnivåer där alla wilds sitter fast och exploderar varje snurr.
import { GAMES } from "../../data/games.js";

const base = { ten: 12, jack: 12, queen: 11, king: 11, ace: 10, horseshoe: 6, boot: 5, hat: 4, sheriff: 3, skull: 1.4 };
const withWild = { ...base, dynamite: 1.1 };
const free = { ...base, skull: 0.5 };
const freeWild = { ...free, dynamite: 0.6 };

export default {
  ...GAMES.find((g) => g.id === "ghost-gulch"),
  rtp: 96,
  reels: 5,
  rows: 4,
  mode: "ways",
  ways: { divisor: 19.5 },
  bets: [20, 40, 100, 200, 400, 1000],
  wild: "dynamite",
  explodingWild: { pattern: [[0, -1], [0, 1], [-1, 0], [1, 0]] },
  scatter: { id: "skull", pays: { 3: 2, 4: 10, 5: 50 }, retrigger: { 3: 3 } },
  bonus: {
    byScatter: { 3: 0, 4: 1, 5: 2 },
    levels: [
      { name: "Spökstaden", spins: 10, sticky: true, desc: "10 free spins. Dynamiten sitter fast och exploderar varje snurr." },
      { name: "Sheriffens hämnd", spins: 10, sticky: true, startMultiplier: 2, desc: "10 free spins med klibbiga wilds. Alla vinster ×2." },
      { name: "Dödens dal", spins: 12, sticky: true, startMultiplier: 3, desc: "12 free spins med klibbiga wilds. Alla vinster ×3." },
    ],
  },
  bonusBuy: [
    { label: "Spökstaden", level: 0, price: 43 },
    { label: "Sheriffens hämnd", level: 1, price: 86 },
    { label: "Dödens dal", level: 2, price: 205 },
  ],
  symbols: {
    ten: { pays: { 3: 0.4, 4: 0.8, 5: 1.5 } },
    jack: { pays: { 3: 0.4, 4: 0.8, 5: 1.5 } },
    queen: { pays: { 3: 0.4, 4: 1, 5: 2 } },
    king: { pays: { 3: 0.6, 4: 1.2, 5: 2.5 } },
    ace: { pays: { 3: 0.6, 4: 1.5, 5: 3 } },
    horseshoe: { pays: { 3: 1, 4: 3, 5: 6 } },
    boot: { pays: { 3: 1.5, 4: 4, 5: 8 } },
    hat: { pays: { 3: 2, 4: 6, 5: 12 } },
    sheriff: { pays: { 3: 3, 4: 10, 5: 25 } },
    dynamite: { pays: {} },
    skull: { noLine: true },
  },
  weights: [base, withWild, withWild, withWild, base],
  freeWeights: [free, freeWild, freeWild, freeWild, free],
};
