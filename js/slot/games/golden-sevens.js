// Golden Sevens – klassisk 3×3 fruktautomat. WILD ersätter allt och dubblar vinsten.
import { GAMES } from "../../data/games.js";
import { LINES_3x3 } from "../engine.js";

const reel = { cherry: 7, lemon: 6, orange: 6, plum: 5, bell: 4, bar: 3, seven: 2, wild: 1 };

export default {
  ...GAMES.find((g) => g.id === "golden-sevens"),
  rtp: 95.6,
  reels: 3,
  rows: 3,
  lines: LINES_3x3,
  bets: [10, 20, 50, 100, 200, 500, 1000],
  wild: "wild",
  wildMultiplier: 2,
  symbols: {
    cherry: { pays: { 2: 1, 3: 5 } },
    lemon: { pays: { 3: 11 } },
    orange: { pays: { 3: 13 } },
    plum: { pays: { 3: 17 } },
    bell: { pays: { 3: 28 } },
    bar: { pays: { 3: 55 } },
    seven: { pays: { 3: 110 } },
    wild: { pays: { 3: 250 } },
  },
  weights: [reel, reel, reel],
};
