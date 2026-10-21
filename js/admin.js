// Lucky Reels – adminpanel: statistik, spelare, turneringar och meddelande i lobbyn.
// Allt kontrolleras även i databasen (is_admin), så sidan går inte att använda utan behörighet.

import { account, friendlyError } from "./lib/account.js";
import { formatCoins, formatKr } from "./lib/wallet.js";
import { GAMES } from "./data/games.js";
import { icons } from "./ui/icons.js";
import { toast, openModal, closeModal } from "./ui/feedback.js";
import { METRICS } from "./ui/tournaments.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const escapeHtml = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const date = (d) => (d ? new Date(d).toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" }) : "–");
const fail = (e) => toast(e?.message?.includes("not_admin") ? "Du saknar adminbehörighet." : friendlyError(e), { icon: icons.info, duration: 4000 });

$$("[data-icon]").forEach((el) => el.insertAdjacentHTML("afterbegin", icons[el.dataset.icon] ?? ""));

let players = [];
let started = false;

account.onChange(async ({ profile }) => {
  const gate = $("[data-gate]");
  if (!profile) {
    gate.innerHTML = `Du måste vara inloggad. <a href="../">Logga in i lobbyn</a> och kom tillbaka hit.`;
    $("[data-panel]").hidden = true;
    return;
  }
  const ok = await account.rpc("is_admin").catch(() => false);
  if (!ok) {
    gate.textContent = "Ditt konto har inte adminbehörighet.";
    return;
  }
  gate.hidden = true;
  $("[data-panel]").hidden = false;
  $("[data-admin-user]").textContent = profile.username;
  if (!started) {
    started = true;
    bind();
    loadStats();
  }
});
account.init();

/* ---------- Flikar ---------- */
function bind() {
  $(".admin-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-tab]");
    if (!b) return;
    $$(".admin-tabs [data-tab]").forEach((t) => t.setAttribute("aria-pressed", String(t === b)));
    $$("[data-view]").forEach((v) => (v.hidden = v.dataset.view !== b.dataset.tab));
    ({ overview: loadStats, players: loadPlayers, tournaments: loadTours, message: loadMessage })[b.dataset.tab]();
  });

  let searchTimer = 0;
  $("[data-player-search]").addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(loadPlayers, 300);
  });
  $("[data-players]").addEventListener("click", onPlayerClick);

  $("[data-game-select]").innerHTML =
    `<option value="">Alla slots</option>` +
    GAMES.filter((g) => g.kind === "slot" && g.status === "live").map((g) => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join("");
  const form = $("[data-tour-form]");
  const local = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  form.starts.value = local(new Date());
  form.ends.value = local(new Date(Date.now() + 7 * 864e5));
  form.addEventListener("submit", createTour);
  $("[data-tours]").addEventListener("click", onTourClick);

  $("[data-msg-form]").addEventListener("submit", saveMessage);
}

/* ---------- Översikt ---------- */
async function loadStats() {
  const el = $("[data-stats]");
  try {
    const s = await account.rpc("admin_stats");
    const card = (label, value) => `<div class="stat"><div class="stat__value">${value}</div><div class="stat__label">${label}</div></div>`;
    el.innerHTML = [
      card("Spelare", formatCoins(s.users)),
      card("Nya senaste dygnet", formatCoins(s.new_24h)),
      card("Aktiva senaste dygnet", formatCoins(s.active_24h)),
      card("Aktiva senaste veckan", formatCoins(s.active_7d)),
      card("Snurr totalt", formatCoins(s.spins)),
      card("Kronor i omlopp", formatKr(s.coins)),
      card("Pågående turneringar", formatCoins(s.tournaments_active)),
      card("Avstängda", formatCoins(s.banned)),
    ].join("");
  } catch (e) {
    el.innerHTML = `<p class="leaders__note">Kunde inte läsa statistiken. Har du kört den senaste SQL-filen?</p>`;
    fail(e);
  }
}

/* ---------- Spelare ---------- */
async function loadPlayers() {
  const el = $("[data-players]");
  try {
    players = await account.rpc("admin_users", { p_search: $("[data-player-search]").value.trim(), p_limit: 100 });
    el.innerHTML = players.length
      ? players
          .map(
            (p) => `<article class="admin-row${p.banned ? " is-banned" : ""}">
          <div class="admin-row__main">
            <b>${escapeHtml(p.username)}</b>${p.is_admin ? ' <span class="level-chip">Admin</span>' : ""}${p.banned ? ' <span class="level-chip chip--danger">Avstängd</span>' : ""}
            <small>${escapeHtml(p.email)} · Nivå ${p.level} · ${formatCoins(p.spins)} snurr · Senast ${date(p.last_seen)}</small>
          </div>
          <div class="admin-row__value">${formatCoins(p.balance)}</div>
          <button class="btn btn--ghost" type="button" data-edit="${p.id}">Hantera</button>
        </article>`,
          )
          .join("")
      : `<p class="leaders__note">Inga spelare hittades.</p>`;
  } catch (e) {
    el.innerHTML = "";
    fail(e);
  }
}

function onPlayerClick(e) {
  const b = e.target.closest("[data-edit]");
  if (!b) return;
  const p = players.find((x) => x.id === b.dataset.edit);
  const content = openModal(
    `<div class="auth">
      <h2 class="auth__title">${escapeHtml(p.username)}</h2>
      <p class="form__intro">${escapeHtml(p.email)} · Skapad ${date(p.created_at)} · Största vinst ${formatCoins(p.biggest_win)}</p>
      <form class="form" data-balance-form>
        <label class="field"><span>Saldo</span><input name="balance" type="number" min="0" step="1" value="${p.balance}"></label>
        <button class="btn btn--gold" type="submit">Spara saldo</button>
      </form>
      <div class="profile-actions">
        <button class="btn ${p.banned ? "btn--royal" : "btn--ghost"}" type="button" data-ban>${p.banned ? "Häv avstängning" : "Stäng av"}</button>
        <button class="btn btn--ghost" type="button" data-admin>${p.is_admin ? "Ta bort admin" : "Gör till admin"}</button>
      </div>
    </div>`,
    "Hantera spelare",
  );
  const update = async (params, msg) => {
    try {
      await account.rpc("admin_update_user", { p_user: p.id, ...params });
      toast(msg, { icon: icons.shield });
      closeModal();
      loadPlayers();
    } catch (err) {
      toast(err?.message?.includes("cannot_change_self") ? "Du kan inte stänga av eller ta bort admin från dig själv." : friendlyError(err), { icon: icons.info });
    }
  };
  $("[data-balance-form]", content).addEventListener("submit", (ev) => {
    ev.preventDefault();
    const v = Math.floor(Number(ev.target.balance.value));
    if (!(v >= 0)) return toast("Ange ett saldo på 0 eller mer.", { icon: icons.info });
    update({ p_balance: v }, `Saldot för ${p.username} är nu ${formatCoins(v)}`);
  });
  $("[data-ban]", content).addEventListener("click", () => {
    if (!p.banned && !confirm(`Stänga av ${p.username}? Spelaren kan inte spela och syns inte på topplistan.`)) return;
    update({ p_banned: !p.banned }, p.banned ? `${p.username} kan spela igen` : `${p.username} är avstängd`);
  });
  $("[data-admin]", content).addEventListener("click", () => {
    if (!p.is_admin && !confirm(`Ge ${p.username} full adminbehörighet?`)) return;
    update({ p_admin: !p.is_admin }, p.is_admin ? `${p.username} är inte längre admin` : `${p.username} är nu admin`);
  });
}

/* ---------- Turneringar ---------- */
async function loadTours() {
  const el = $("[data-tours]");
  try {
    const list = await account.tournaments();
    const now = Date.now();
    el.innerHTML = list.length
      ? list
          .map((t) => {
            const live = Date.parse(t.ends_at) > now;
            const game = t.game_id ? GAMES.find((g) => g.id === t.game_id)?.name ?? t.game_id : "Alla slots";
            return `<article class="admin-row">
              <div class="admin-row__main">
                <b>${escapeHtml(t.name)}</b> ${t.settled ? '<span class="level-chip">Avgjord</span>' : live ? '<span class="level-chip">Pågår</span>' : ""}
                <small>${escapeHtml(game)} · ${METRICS[t.metric]?.label ?? t.metric} · ${date(t.starts_at)} – ${date(t.ends_at)} · ${t.entries.length} deltagare</small>
              </div>
              <div class="admin-row__value">${formatCoins(t.prize_pool)}</div>
              ${t.settled ? "" : `<div class="admin-row__btns"><button class="btn btn--ghost" type="button" data-end="${t.id}">Avsluta nu</button><button class="btn btn--ghost" type="button" data-delete="${t.id}">Ta bort</button></div>`}
            </article>`;
          })
          .join("")
      : `<p class="leaders__note">Inga turneringar.</p>`;
  } catch (e) {
    fail(e);
  }
}

async function createTour(e) {
  e.preventDefault();
  const f = e.target;
  const err = $("[data-tour-error]");
  err.textContent = "";
  const prizes = f.prizes.value.split(/[,\s]+/).filter(Boolean).map(Number);
  if (!prizes.length || prizes.some((p) => !(p > 0)) || prizes.reduce((a, b) => a + b, 0) > 100) {
    err.textContent = "Prisfördelningen ska vara positiva procent som tillsammans blir högst 100.";
    return;
  }
  const starts = f.starts.value ? new Date(f.starts.value) : new Date();
  const ends = new Date(f.ends.value);
  if (!(ends > starts)) {
    err.textContent = "Slutet måste vara efter starten.";
    return;
  }
  try {
    await account.rpc("admin_save_tournament", {
      p_name: f.name.value.trim(),
      p_game: f.game.value,
      p_metric: f.metric.value,
      p_starts: starts.toISOString(),
      p_ends: ends.toISOString(),
      p_pool: Math.floor(Number(f.pool.value)),
      p_fee: Math.floor(Number(f.fee.value) || 0),
      p_prizes: prizes.map(Math.floor),
    });
    toast("Turneringen är skapad", { variant: "gold", icon: icons.trophy });
    f.name.value = "";
    loadTours();
  } catch (e2) {
    err.textContent = friendlyError(e2);
  }
}

async function onTourClick(e) {
  const end = e.target.closest("[data-end]");
  const del = e.target.closest("[data-delete]");
  if (!end && !del) return;
  const id = Number((end ?? del).dataset[end ? "end" : "delete"]);
  if (!confirm(end ? "Avsluta turneringen nu och dela ut priserna?" : "Ta bort turneringen? Deltagarna får inga priser.")) return;
  try {
    await account.rpc("admin_end_tournament", { p_id: id, p_delete: !!del });
    toast(end ? "Turneringen är avslutad och priserna utdelade" : "Turneringen är borttagen", { icon: icons.trophy });
    loadTours();
  } catch (e2) {
    fail(e2);
  }
}

/* ---------- Meddelande ---------- */
async function loadMessage() {
  const value = await account.setting("announcement");
  $("[data-msg-form]").text.value = value?.text ?? "";
}

async function saveMessage(e) {
  e.preventDefault();
  const text = e.target.text.value.trim();
  try {
    await account.rpc("admin_set_setting", { p_key: "announcement", p_value: { text } });
    toast(text ? "Meddelandet visas nu i lobbyn" : "Meddelandet är borttaget", { icon: icons.spark });
  } catch (e2) {
    fail(e2);
  }
}
