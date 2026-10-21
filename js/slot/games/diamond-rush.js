// Diamond Rush – 5×3, 20 linjer. Diamanten är wild och expanderar på hjul 2–4.
import { GAMES } from "../../data/games.js";
import { BETS } from "../bets.js";
import { LINES_5x3 } from "../engine.js";

const base = { ten: 11, jack: 11, queen: 10, king: 10, ace: 9, amethyst: 6, sapphire: 5, emerald: 4, ruby: 3, seven: 2 };

export default {
  ...GAMES.find((g) => g.id === "diamond-rush"),
  rtp: 96.0,
  reels: 5,
  rows: 3,
  lines: LINES_5x3.slice(0, 20),
  bets: BETS,
  wild: "diamond",
  expandingWild: { reels: [1, 2, 3] },
  symbols: {
    ten: { pays: { 3: 12, 4: 25, 5: 50 } },
    jack: { pays: { 3: 12, 4: 25, 5: 60 } },
    queen: { pays: { 3: 15, 4: 30, 5: 80 } },
    king: { pays: { 3: 15, 4: 40, 5: 100 } },
    ace: { pays: { 3: 20, 4: 50, 5: 150 } },
    amethyst: { pays: { 3: 30, 4: 80, 5: 200 } },
    sapphire: { pays: { 3: 40, 4: 100, 5: 300 } },
    emerald: { pays: { 3: 50, 4: 150, 5: 400 } },
    ruby: { pays: { 3: 75, 4: 200, 5: 600 } },
    seven: { pays: { 3: 100, 4: 400, 5: 1500 } },
    diamond: { pays: {} },
  },
  weights: [base, { ...base, diamond: 2 }, { ...base, diamond: 2 }, { ...base, diamond: 2 }, base],
};
