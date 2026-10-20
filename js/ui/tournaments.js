// Lucky Reels – turneringar i lobbyn: lista, nedräkning, ställning och "gå med".

import { account, friendlyError } from "../lib/account.js";
import { wallet, formatCoins } from "../lib/wallet.js";
import { GAMES } from "../data/games.js";
import { icons, coinSvg } from "./icons.js";
import { toast, openModal } from "./feedback.js";
import { openAccount } from "./account-ui.js";

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

export const METRICS = {
  multiplier: { label: "Största vinst (× insatsen)", short: "Bästa multiplikator", fmt: (v) => `${Number(v).toLocaleString("sv-SE", { maximumFractionDigits: 1 })}×` },
  total_win: { label: "Mest vunnet totalt", short: "Totalvinst", fmt: (v) => formatCoins(v) },
  spins: { label: "Flest snurr", short: "Antal snurr", fmt: (v) => formatCoins(v) },
};

const gameName = (id) => (id ? GAMES.find((g) => g.id === id)?.name ?? id : "Alla slots");

function timeLeft(t, now = Date.now()) {
  const start = Date.parse(t.starts_at);
  const end = Date.parse(t.ends_at);
  if (now < start) return { state: "soon", text: `Startar om ${duration(start - now)}` };
  if (now < end) return { state: "live", text: `${duration(end - now)} kvar` };
  return { state: "ended", text: t.settled ? "Avgjord" : "Avslutad – priser delas ut" };
}

function duration(ms) {
  const m = Math.floor(ms / 60000);
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  if (d > 0) return `${d} d ${h} h`;
  if (h > 0) return `${h} h ${m % 60} min`;
  return `${Math.max(1, m)} min`;
}

let cache = [];
let root = null;
let ticker = 0;

export async function mountTournaments(el) {
  root = el;
  el.addEventListener("click", onClick);
  await refreshTournaments();
  clearInterval(ticker);
  ticker = setInterval(() => render(), 30_000);
}

export async function refreshTournaments() {
  if (!root) return;
  try {
    await account.settleTournaments().catch(() => {});
    cache = await account.tournaments();
    render();
  } catch (e) {
    console.warn("Turneringar kunde inte laddas:", e);
    root.innerHTML = `<p class="leaders__note">Turneringarna kunde inte laddas just nu.</p>`;
  }
}

function render() {
  if (!root) return;
  if (!cache.length) {
    root.innerHTML = `<p class="leaders__note">Inga turneringar just nu – titta in snart igen!</p>`;
    return;
  }
  const me = account.user?.id;
  root.innerHTML = cache
    .map((t) => {
      const metric = METRICS[t.metric] ?? METRICS.multiplier;
      const tl = timeLeft(t);
      const mine = t.entries.find((e) => e.user_id === me);
      const ranked = t.entries.filter((e) => Number(e.score) > 0);
      const myRank = mine ? ranked.findIndex((e) => e.user_id === me) + 1 : 0;
      const top = ranked.slice(0, 3);
      const prizes = (t.prizes ?? []).map((p, i) => `<li><b>${i + 1}:a</b> ${formatCoins((t.prize_pool * p) / 100)}</li>`).join("");
      let action = "";
      if (tl.state === "ended") {
        action = mine?.prize > 0 ? `<span class="tour__won">Du vann ${formatCoins(mine.prize)}!</span>` : "";
      } else if (!account.loggedIn) {
        action = `<button class="btn btn--royal" type="button" data-tour-login>Logga in för att tävla</button>`;
      } else if (mine) {
        const url = t.game_id ? GAMES.find((g) => g.id === t.game_id)?.url : null;
        action = url
          ? `<a class="btn btn--gold" href="${url}">${icons.play}Spela ${escapeHtml(gameName(t.game_id))}</a>`
          : `<a class="btn btn--gold" href="#lobby">${icons.play}Välj ett spel</a>`;
      } else {
        action = `<button class="btn btn--gold" type="button" data-join="${t.id}">${t.entry_fee > 0 ? `Gå med · ${formatCoins(t.entry_fee)}` : "Gå med gratis"}</button>`;
      }
      return `<article class="tour tour--${tl.state}">
        <header class="tour__head">
          <div>
            <h3 class="tour__name">${escapeHtml(t.name)}</h3>
            <p class="tour__meta">${escapeHtml(gameName(t.game_id))} · ${metric.label}</p>
          </div>
          <span class="tour__time">${tl.state === "live" ? '<i class="tour__dot"></i>' : ""}${tl.text}</span>
        </header>
        <div class="tour__pool">${coinSvg("icon")}<b>${formatCoins(t.prize_pool)}</b><span>i prispotten · ${t.entries.length} deltagare</span></div>
        <ul class="tour__prizes">${prizes}</ul>
        <ol class="tour__top">
          ${top.length
            ? top
                .map(
                  (e, i) => `<li class="${e.user_id === me ? "is-me" : ""}"><span class="tour__rank">${i + 1}</span><span class="tour__player">${escapeHtml(e.profiles?.username ?? "Spelare")}</span><b>${metric.fmt(e.score)}</b>${
                    e.prize > 0 ? `<em>+${formatCoins(e.prize)}</em>` : ""
                  }</li>`,
                )
                .join("")
            : `<li class="tour__empty">Ingen har poäng än – bli först!</li>`}
        </ol>
        ${mine && myRank > 3 ? `<p class="tour__mine">Du ligger ${myRank}:a med ${metric.fmt(mine.score)}</p>` : mine && !myRank && tl.state !== "ended" ? `<p class="tour__mine">Du är med – spela för att få poäng!</p>` : ""}
        <div class="tour__actions">${action}<button class="btn btn--ghost" type="button" data-standings="${t.id}">Hela listan</button></div>
      </article>`;
    })
    .join("");
}

async function onClick(e) {
  if (e.target.closest("[data-tour-login]")) return openAccount();
  const join = e.target.closest("[data-join]");
  if (join) {
    const t = cache.find((x) => x.id === Number(join.dataset.join));
    if (t.entry_fee > wallet.balance) return toast("Saldot räcker inte för avgiften.", { icon: icons.info });
    join.disabled = true;
    try {
      await account.rpc("join_tournament", { p_id: t.id });
      if (t.entry_fee > 0) await account.refreshProfile();
      toast(`Du är med i ${t.name}! Lycka till.`, { variant: "gold", icon: icons.trophy });
      await refreshTournaments();
    } catch (err) {
      join.disabled = false;
      const msg = err?.message ?? "";
      toast(msg.includes("already_joined") ? "Du är redan med." : msg.includes("closed") ? "Turneringen är stängd." : friendlyError(err), { icon: icons.info });
    }
    return;
  }
  const st = e.target.closest("[data-standings]");
  if (st) openStandings(cache.find((x) => x.id === Number(st.dataset.standings)));
}

function openStandings(t) {
  const metric = METRICS[t.metric] ?? METRICS.multiplier;
  const me = account.user?.id;
  const rows = t.entries
    .map(
      (e, i) => `<div class="leader${e.user_id === me ? " is-me" : ""}">
        <span class="leader__rank">${i + 1}</span>
        <span class="leader__name">${escapeHtml(e.profiles?.username ?? "Spelare")}${e.profiles?.level ? `<span class="level-chip">Nv ${e.profiles.level}</span>` : ""}</span>
        <span class="leader__score">${metric.fmt(e.score)}${e.prize > 0 ? ` · +${formatCoins(e.prize)}` : ""}</span>
      </div>`,
    )
    .join("");
  openModal(
    `<div class="paytable">
      <h2>${escapeHtml(t.name)}</h2>
      <p>${escapeHtml(gameName(t.game_id))} · ${metric.label} · ${timeLeft(t).text}</p>
      <p>Poängen räknas automatiskt när du spelar. ${t.metric === "multiplier" ? "Din bästa enskilda vinst delat med insatsen räknas." : ""} Priserna delas ut när turneringen är slut.</p>
      <div class="leaders">${rows || `<p class="leaders__note">Inga deltagare än.</p>`}</div>
    </div>`,
    "Ställning",
  );
}
