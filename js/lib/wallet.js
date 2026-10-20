// Lucky Reels – plånbok för låtsasmynt.
//
// Alla spel pratar bara med `wallet` (debit/credit/onChange).
// Utloggad: saldot sparas lokalt i webbläsaren.
// Inloggad: saldot ligger i Supabase. Ändringar visas direkt och skickas till
// databasen i tur och ordning; databasens svar är alltid det som gäller.

import { load, save } from "./storage.js";
import { account } from "./account.js";

export const START_BALANCE = 10_000;
export const DAILY_BONUS = 1_000;
export const REFILL_LIMIT = 100; // under detta saldo får man fylla på gratis
const DAY_MS = 24 * 60 * 60 * 1000;

const listeners = new Set();
const errorListeners = new Set();

let local = load("wallet", null);
if (!local || typeof local.balance !== "number" || !Number.isFinite(local.balance)) {
  local = { balance: START_BALANCE, lastDaily: 0, totalWon: 0, biggestWin: 0, spins: 0 };
  save("wallet", local);
}

// Serverläge
let remote = null; // { balance, lastDaily, totalWon, biggestWin, spins }
let pending = 0; // summan av ändringar som ännu inte bekräftats av servern
let queue = Promise.resolve();

const state = () => remote ?? local;

function emit(delta, reason) {
  const balance = wallet.balance;
  for (const cb of listeners) cb({ balance, delta, reason });
}

function fromProfile(p) {
  return {
    balance: Number(p.balance),
    lastDaily: p.last_daily ? Date.parse(p.last_daily) : 0,
    totalWon: Number(p.total_won),
    biggestWin: Number(p.biggest_win),
    spins: Number(p.spins),
  };
}

function reportError(error) {
  const code = error?.message ?? String(error);
  const text =
    code.includes("insufficient_funds") ? "Saldot räckte inte enligt servern – saldot har uppdaterats."
    : code.includes("win_too_large") ? "Servern godkände inte vinsten."
    : code.includes("not_logged_in") || code.includes("JWT") ? "Du har loggats ut. Logga in igen för att spara saldot."
    : "Kunde inte spara saldot just nu. Det synkas igen när anslutningen fungerar.";
  for (const cb of errorListeners) cb(text);
}

// Skickar en ändring till servern. Lokalt saldo uppdateras direkt (optimistiskt).
function sync(delta, fn) {
  pending += delta;
  queue = queue
    .then(fn)
    .then((serverBalance) => {
      pending -= delta;
      if (remote) {
        remote.balance = Number(serverBalance) + pending;
        emit(0, "sync");
      }
    })
    .catch(async (error) => {
      pending -= delta;
      console.warn("Saldosynk misslyckades:", error);
      reportError(error);
      await resync();
    });
}

async function resync() {
  if (!account.user) return;
  try {
    const p = await account.refreshProfile();
    if (p && remote) {
      const before = remote.balance;
      remote = fromProfile(p);
      remote.balance += pending;
      emit(remote.balance - before, "sync");
    }
  } catch (e) {
    console.warn("Kunde inte läsa saldot:", e);
  }
}

account.onChange(({ user, profile }) => {
  const before = wallet.balance;
  if (user && profile) {
    if (!remote || pending === 0) {
      remote = fromProfile(profile);
      remote.balance += pending;
    }
  } else if (!user) {
    remote = null;
    pending = 0;
  }
  if (wallet.balance !== before) emit(wallet.balance - before, "account");
  else emit(0, "account");
});

export const wallet = {
  get balance() {
    return state().balance;
  },

  get online() {
    return !!remote;
  },

  get stats() {
    const { totalWon, biggestWin, spins } = state();
    return { totalWon, biggestWin, spins };
  },

  /** Drar en insats. Returnerar false om saldot inte räcker. */
  debit(amount, reason = "bet") {
    amount = Math.floor(amount);
    const s = state();
    if (!(amount > 0) || amount > s.balance) return false;
    s.balance -= amount;
    if (reason === "bet") s.spins += 1;
    if (remote) sync(-amount, () => account.rpc("apply_round", { p_bet: amount, p_win: 0 }));
    else save("wallet", local);
    emit(-amount, reason);
    return true;
  },

  /** Lägger till en vinst. Bonus och påfyllning går via claimDaily/refill. */
  credit(amount, reason = "win") {
    amount = Math.floor(amount);
    if (!(amount > 0)) return;
    const s = state();
    s.balance += amount;
    if (reason === "win") {
      s.totalWon += amount;
      s.biggestWin = Math.max(s.biggestWin, amount);
    }
    if (remote) sync(amount, () => account.rpc("apply_round", { p_bet: 0, p_win: amount }));
    else save("wallet", local);
    emit(amount, reason);
  },

  /** Millisekunder kvar tills dagens bonus kan hämtas (0 = redo). */
  dailyCooldown(now = Date.now()) {
    return Math.max(0, state().lastDaily + DAY_MS - now);
  },

  claimDaily(now = Date.now()) {
    if (this.dailyCooldown(now) > 0) return 0;
    const s = state();
    s.lastDaily = now;
    s.balance += DAILY_BONUS;
    if (remote) {
      sync(DAILY_BONUS, async () => {
        const res = await account.rpc("claim_daily");
        if (remote && res.last_daily) remote.lastDaily = Date.parse(res.last_daily);
        if (!res.ok) throw new Error("daily_not_ready");
        return res.balance;
      });
    } else save("wallet", local);
    emit(DAILY_BONUS, "daily");
    return DAILY_BONUS;
  },

  canRefill() {
    return state().balance < REFILL_LIMIT;
  },

  refill() {
    if (!this.canRefill()) return 0;
    const s = state();
    const amount = START_BALANCE - s.balance;
    s.balance = START_BALANCE;
    if (remote) sync(amount, () => account.rpc("refill"));
    else save("wallet", local);
    emit(amount, "refill");
    return amount;
  },

  onChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },

  /** Får ett meddelande (svenska) när något inte kunde sparas på servern. */
  onError(cb) {
    errorListeners.add(cb);
    return () => errorListeners.delete(cb);
  },
};

// Håll flera öppna flikar i synk (gäller det lokala saldot)
window.addEventListener("storage", (e) => {
  if (e.key !== "lr:wallet" || !e.newValue || remote) return;
  try {
    const next = JSON.parse(e.newValue);
    const delta = next.balance - local.balance;
    local = next;
    emit(delta, "sync");
  } catch {
    /* ignorera trasig data */
  }
});

account.init();

const nf = new Intl.NumberFormat("sv-SE");
export const formatCoins = (n) => nf.format(Math.floor(n));
