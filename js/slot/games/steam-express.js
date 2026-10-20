// Steam Express – 5×4, 40 linjer med en Hold & Win-bonus full av specialsymboler.
// Tre eller fler mynt startar bonuståget. Under respins kan Sniper, Payer och Collector
// landa och slå ihop värdena – de gyllene varianterna verkar efter varje respin.
import { GAMES } from "../../data/games.js";
import { LINES_5x4 } from "../engine.js";

const base = { ten: 11, jack: 11, queen: 10, king: 10, ace: 9, lantern: 5, watch: 4, bag: 3, train: 2, coin: 1.15 };
const withWild = { ...base, wild: 1.6 };

export default {
  ...GAMES.find((g) => g.id === "steam-express"),
  rtp: 95.3,
  reels: 5,
  rows: 4,
  lines: LINES_5x4,
  bets: [20, 40, 100, 200, 400, 1000],
  wild: "wild",
  holdWin: {
    title: "BONUSTÅGET",
    coin: "coin",
    trigger: 3,
    respins: 3,
    landChance: 0.05,
    specials: { sniper: 0.03, payer: 0.03, collector: 0.035, ppayer: 0.004, pcollector: 0.004 },
    fullBonus: 500,
  },
  bonusBuy: [
    { label: "Bonuståget", coins: 3, price: 90, desc: "3 mynt och 3 respins" },
    { label: "Expresståget", coins: 3, extra: "ppayer", price: 720, desc: "3 mynt och en gyllene Payer som betalar ut varje respin" },
  ],
  symbols: {
    ten: { pays: { 3: 12, 4: 31, 5: 63 } },
    jack: { pays: { 3: 12, 4: 31, 5: 63 } },
    queen: { pays: { 3: 16, 4: 35, 5: 77 } },
    king: { pays: { 3: 21, 4: 46, 5: 102 } },
    ace: { pays: { 3: 21, 4: 51, 5: 128 } },
    lantern: { pays: { 3: 38, 4: 102, 5: 256 } },
    watch: { pays: { 3: 51, 4: 154, 5: 384 } },
    bag: { pays: { 3: 77, 4: 230, 5: 640 } },
    train: { pays: { 3: 128, 4: 384, 5: 1279 } },
    wild: { pays: { 3: 128, 4: 384, 5: 1279 } },
    coin: { noLine: true, values: { 1: 30, 2: 25, 3: 18, 5: 12, 10: 6, 20: 2.5, 50: 0.6, 100: 0.15 } },
  },
  weights: [base, withWild, withWild, withWild, withWild],
};
