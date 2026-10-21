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
    ten: { pays: { 3: 11, 4: 29, 5: 60 } },
    jack: { pays: { 3: 11, 4: 29, 5: 60 } },
    queen: { pays: { 3: 15, 4: 33, 5: 73 } },
    king: { pays: { 3: 20, 4: 44, 5: 97 } },
    ace: { pays: { 3: 20, 4: 48, 5: 122 } },
    lantern: { pays: { 3: 36, 4: 97, 5: 243 } },
    watch: { pays: { 3: 48, 4: 146, 5: 365 } },
    bag: { pays: { 3: 73, 4: 218, 5: 608 } },
    train: { pays: { 3: 122, 4: 365, 5: 1215 } },
    wild: { pays: { 3: 122, 4: 365, 5: 1215 } },
    coin: { noLine: true, values: { 1: 30, 2: 25, 3: 18, 5: 12, 10: 6, 20: 2.5, 50: 0.6, 100: 0.15 } },
  },
  weights: [base, withWild, withWild, withWild, withWild],
};
