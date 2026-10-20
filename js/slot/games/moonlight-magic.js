// Moonlight Magic – 5×4, 40 linjer med kaskader.
// Varje kaskad i rad höjer multiplikatorn, och under free spins börjar den på ×3.
import { GAMES } from "../../data/games.js";
import { LINES_5x4 } from "../engine.js";

const base = { ten: 10, jack: 10, queen: 10, king: 9, ace: 9, amethyst: 5, sapphire: 4, star: 3, moon: 1 };
const withWild = { ...base, wild: 2 };

export default {
  ...GAMES.find((g) => g.id === "moonlight-magic"),
  rtp: 96.4,
  reels: 5,
  rows: 4,
  lines: LINES_5x4,
  cascade: { multipliers: [1, 2, 3, 5], freeMultipliers: [3, 6, 9, 15] },
  bets: [20, 40, 100, 200, 400, 1000],
  wild: "wild",
  scatter: { id: "moon", pays: { 3: 2, 4: 5, 5: 20 }, freeSpins: { 3: 8, 4: 12, 5: 20 }, retrigger: { 3: 5 } },
  symbols: {
    ten: { pays: { 3: 8, 4: 18, 5: 35 } },
    jack: { pays: { 3: 8, 4: 18, 5: 35 } },
    queen: { pays: { 3: 9, 4: 20, 5: 40 } },
    king: { pays: { 3: 14, 4: 26, 5: 50 } },
    ace: { pays: { 3: 14, 4: 35, 5: 70 } },
    amethyst: { pays: { 3: 26, 4: 70, 5: 175 } },
    sapphire: { pays: { 3: 35, 4: 85, 5: 250 } },
    star: { pays: { 3: 50, 4: 175, 5: 500 } },
    wild: { pays: {} },
    moon: { noLine: true },
  },
  weights: [base, withWild, withWild, withWild, base],
};
