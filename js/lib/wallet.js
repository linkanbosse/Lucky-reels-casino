// Lucky Reels – plånbok för låtsasmynt.
//
// Alla spel ska bara prata med `wallet` (debit/credit/onChange). I steg 3 byts
// den lokala lagringen mot Supabase utan att spelen behöver ändras.

import { load, save } from "./storage.js";

export const START_BALANCE = 10_000;
export const DAILY_BONUS = 1_000;
export const REFILL_LIMIT = 100; // under detta saldo får man fylla på gratis
const DAY_MS = 24 * 60 * 60 * 1000;

const listeners = new Set();

let state = load("wallet", null);
if (!state || typeof state.balance !== "number" || !Number.isFinite(state.balance)) {
  state = { balance: START_BALANCE, lastDaily: 0, totalWon: 0, biggestWin: 0, spins: 0 };
  save("wallet", state);
}

function commit(delta, reason) {
  save("wallet", state);
  for (const cb of listeners) cb({ balance: state.balance, delta, reason });
}

export const wallet = {
  get balance() {
    return state.balance;
  },

  get stats() {
    const { totalWon, biggestWin, spins } = state;
    return { totalWon, biggestWin, spins };
  },

  /** Drar en insats. Returnerar false om saldot inte räcker. */
  debit(amount, reason = "bet") {
    amount = Math.floor(amount);
    if (!(amount > 0) || amount > state.balance) return false;
    state.balance -= amount;
    if (reason === "bet") state.spins += 1;
    commit(-amount, reason);
    return true;
  },

  /** Lägger till mynt (vinst, bonus, påfyllning). */
  credit(amount, reason = "win") {
    amount = Math.floor(amount);
    if (!(amount > 0)) return;
    state.balance += amount;
    if (reason === "win") {
      state.totalWon += amount;
      state.biggestWin = Math.max(state.biggestWin, amount);
    }
    commit(amount, reason);
  },

  /** Millisekunder kvar tills dagens bonus kan hämtas (0 = redo). */
  dailyCooldown(now = Date.now()) {
    return Math.max(0, state.lastDaily + DAY_MS - now);
  },

  claimDaily(now = Date.now()) {
    if (this.dailyCooldown(now) > 0) return 0;
    state.lastDaily = now;
    this.credit(DAILY_BONUS, "daily");
    return DAILY_BONUS;
  },

  canRefill() {
    return state.balance < REFILL_LIMIT;
  },

  refill() {
    if (!this.canRefill()) return 0;
    const amount = START_BALANCE - state.balance;
    this.credit(amount, "refill");
    return amount;
  },

  onChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};

// Håll flera öppna flikar i synk
window.addEventListener("storage", (e) => {
  if (e.key !== "lr:wallet" || !e.newValue) return;
  try {
    const next = JSON.parse(e.newValue);
    const delta = next.balance - state.balance;
    state = next;
    for (const cb of listeners) cb({ balance: state.balance, delta, reason: "sync" });
  } catch {
    /* ignorera trasig data */
  }
});

const nf = new Intl.NumberFormat("sv-SE");
export const formatCoins = (n) => nf.format(Math.floor(n));
