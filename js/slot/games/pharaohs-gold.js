// Pharaoh's Gold – 5×3, 20 linjer med Hold & Win.
// Sex eller fler guldmynt låses fast och ger respins. Mynten kan bära Mini-, Minor- eller Major-jackpott,
// och fylls hela brädet vinner man GRAND.
import { GAMES } from "../../data/games.js";
import { BETS } from "../bets.js";
import { LINES_5x3 } from "../engine.js";

const base = { ten: 11, jack: 11, queen: 10, king: 10, ace: 9, ankh: 5, eye: 4, scarab: 3, coin: 8 };
const withWild = { ...base, pyramid: 2 };

export default {
  ...GAMES.find((g) => g.id === "pharaohs-gold"),
  rtp: 95.3,
  reels: 5,
  rows: 3,
  lines: LINES_5x3.slice(0, 20),
  bets: BETS,
  wild: "pyramid",
  holdWin: {
    coin: "coin",
    trigger: 6,
    respins: 3,
    landChance: 0.065,
    jackpots: { mini: 20, minor: 50, major: 200, grand: 1000 },
  },
  symbols: {
    ten: { pays: { 3: 15, 4: 45, 5: 120 } },
    jack: { pays: { 3: 15, 4: 45, 5: 120 } },
    queen: { pays: { 3: 15, 4: 60, 5: 150 } },
    king: { pays: { 3: 25, 4: 75, 5: 225 } },
    ace: { pays: { 3: 30, 4: 90, 5: 300 } },
    ankh: { pays: { 3: 60, 4: 180, 5: 600 } },
    eye: { pays: { 3: 90, 4: 300, 5: 900 } },
    scarab: { pays: { 3: 150, 4: 450, 5: 1500 } },
    pyramid: { pays: {} },
    coin: { noLine: true, values: { 2: 30, 3: 25, 5: 15, 8: 10, 10: 6, 15: 5, 25: 3, mini: 2, minor: 0.7, major: 0.15 } },
  },
  weights: [base, withWild, withWild, withWild, withWild],
};
