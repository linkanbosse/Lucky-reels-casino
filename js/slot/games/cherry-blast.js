// Cherry Blast – 6×5 med klustervinster och kaskader.
// Under free spins landar bomber vars multiplikatorer läggs ihop och multiplicerar vinsten.
import { GAMES } from "../../data/games.js";
import { BETS } from "../bets.js";

const base = { cherry: 20, lemon: 18, orange: 16, plum: 14, grapes: 12, bell: 6, seven: 4, diamond: 3, star: 2.2 };
const free = { ...base, bomb: 2 };

export default {
  ...GAMES.find((g) => g.id === "cherry-blast"),
  rtp: 95.5,
  reels: 6,
  rows: 5,
  mode: "cluster",
  cluster: { min: 5 },
  cascade: { multipliers: [1] },
  bets: BETS,
  scatter: { id: "star", pays: { 4: 3, 5: 5, 6: 100 }, freeSpins: { 4: 10, 5: 12, 6: 15 }, retrigger: { 3: 5 } },
  bombs: { id: "bomb" },
  feature: "Bomber multiplicerar vinsterna",
  symbols: {
    cherry: { pays: { 5: 1.6, 7: 3.5, 9: 7, 12: 20, 15: 70 } },
    lemon: { pays: { 5: 1.8, 7: 4, 9: 8, 12: 28, 15: 80 } },
    orange: { pays: { 5: 2.1, 7: 5.5, 9: 10, 12: 35, 15: 100 } },
    plum: { pays: { 5: 2.7, 7: 7, 9: 14, 12: 40, 15: 140 } },
    grapes: { pays: { 5: 3.5, 7: 10, 9: 20, 12: 55, 15: 200 } },
    bell: { pays: { 5: 7, 7: 17, 9: 35, 12: 100, 15: 350 } },
    seven: { pays: { 5: 14, 7: 35, 9: 70, 12: 200, 15: 700 } },
    diamond: { pays: { 5: 20, 7: 55, 9: 100, 12: 350, 15: 1400 } },
    star: { noLine: true },
    bomb: { noLine: true, values: { 2: 30, 3: 20, 4: 12, 5: 10, 8: 8, 10: 6, 15: 4, 25: 3, 50: 1.5, 100: 0.5 } },
  },
  weights: Array.from({ length: 6 }, () => base),
  freeWeights: Array.from({ length: 6 }, () => free),
};
