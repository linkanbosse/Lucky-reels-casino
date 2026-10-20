// Royal Crown – 5×3, 25 linjer, hög volatilitet.
// Kronan är wild. Sex eller fler kronor var som helst vinner jackpotten.
// Tre eller fler stjärnor (scatter) ger free spins där alla vinster tredubblas.
import { GAMES } from "../../data/games.js";
import { LINES_5x3 } from "../engine.js";

const base = { ten: 12, jack: 12, queen: 11, king: 10, ace: 10, emerald: 5, sapphire: 4, ruby: 3, diamond: 2, crown: 2, star: 2 };

export default {
  ...GAMES.find((g) => g.id === "royal-crown"),
  rtp: 95.8,
  reels: 5,
  rows: 3,
  lines: LINES_5x3,
  bets: [25, 50, 100, 250, 500, 1000],
  wild: "crown",
  scatter: { id: "star", pays: { 3: 5, 4: 20, 5: 100 }, freeSpins: { 3: 10, 4: 15, 5: 20 } },
  freeSpinMultiplier: 3,
  jackpot: { symbol: "crown", count: 6, seed: 50_000, contribution: 0.01 },
  symbols: {
    ten: { pays: { 3: 8, 4: 25, 5: 75 } },
    jack: { pays: { 3: 8, 4: 25, 5: 75 } },
    queen: { pays: { 3: 12, 4: 40, 5: 100 } },
    king: { pays: { 3: 18, 4: 50, 5: 150 } },
    ace: { pays: { 3: 22, 4: 60, 5: 200 } },
    emerald: { pays: { 3: 50, 4: 150, 5: 500 } },
    sapphire: { pays: { 3: 60, 4: 200, 5: 750 } },
    ruby: { pays: { 3: 80, 4: 300, 5: 1000 } },
    diamond: { pays: { 2: 10, 3: 100, 4: 500, 5: 2000 } },
    crown: { pays: { 2: 20, 3: 200, 4: 1000, 5: 5000 } },
    star: { pays: {} },
  },
  weights: [base, base, base, base, base],
};
