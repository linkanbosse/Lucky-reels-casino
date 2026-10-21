// Lucky Reels – nivåer och XP. Samma formler som databasens play_round/level_for_xp.
//   XP per snurr: 10 + insatsen/200 (max 60)
//   Nivå: floor(sqrt(xp / 100)) + 1  → nivå 2 vid 100 XP, nivå 10 vid 8 100 XP
//   Belöning för ny nivå N: N × 2 500 kr

export const xpForBet = (bet) => (bet > 0 ? 10 + Math.floor(Math.min(bet, 10_000) / 200) : 0);
export const levelForXp = (xp) => Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
export const xpForLevel = (level) => 100 * (level - 1) ** 2;
export const rewardForLevel = (level) => level * 2_500;

/** Belöningen för att gå från nivå `from` till `to`. */
export function rewardBetween(from, to) {
  let sum = 0;
  for (let l = from + 1; l <= to; l++) sum += rewardForLevel(l);
  return sum;
}

/** Hur långt man kommit mot nästa nivå: { level, into, needed, pct }. */
export function progress(xp) {
  const level = levelForXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return { level, into: xp - base, needed: next - base, pct: Math.min(100, ((xp - base) / (next - base)) * 100) };
}

const TITLES = [
  [1, "Nybörjare"], [5, "Stammis"], [10, "Högrullare"], [20, "Hajen"], [35, "Legend"], [50, "Kasinokung"],
];

export const titleFor = (level) => TITLES.reduce((t, [min, name]) => (level >= min ? name : t), TITLES[0][1]);
