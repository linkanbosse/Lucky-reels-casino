// Lucky Reels – lobbyns startpunkt

import { GAMES, CATEGORIES } from "./data/games.js";
import { wallet, formatCoins, DAILY_BONUS } from "./lib/wallet.js";
import { load, save } from "./lib/storage.js";
import { icons, coinSvg } from "./ui/icons.js";
import { coverArt } from "./ui/art.js";
import { toast, openModal, closeModal, coinBurst } from "./ui/feedback.js";
import { account } from "./lib/account.js";
import { openAccount, openSignup, bindAccountUi } from "./ui/account-ui.js";
import { openCoffee } from "./ui/coffee.js";
import { openWatch } from "./ui/watch.js";
import { mountLevelBadge, celebrateLevelUps } from "./ui/level-ui.js";
import { mountTournaments, refreshTournaments } from "./ui/tournaments.js";

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/* ---------- Ikoner i statisk markup ---------- */
function hydrateIcons() {
  $$("[data-icon]").forEach((el) => {
    el.insertAdjacentHTML("afterbegin", icons[el.dataset.icon] ?? "");
  });
  $$("[data-coin]").forEach((el) => {
    el.insertAdjacentHTML("afterbegin", coinSvg(el.dataset.coin));
  });
}

/* ---------- Saldo ---------- */
function renderBalance() {
  $$("[data-balance]").forEach((el) => {
    el.textContent = formatCoins(wallet.balance);
  });
  $("[data-stat-balance]").textContent = formatCoins(wallet.balance);
  $("[data-stat-biggest]").textContent = formatCoins(wallet.stats.biggestWin);
  $("[data-stat-spins]").textContent = formatCoins(wallet.stats.spins);
}

function bumpBalance() {
  $$(".balance").forEach((el) => {
    el.classList.remove("is-bump");
    void el.offsetWidth; // starta om animationen
    el.classList.add("is-bump");
  });
}

/* ---------- Daglig bonus ---------- */
function formatCooldown(ms) {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.ceil((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

function renderBonusButtons() {
  const ready = wallet.dailyCooldown() === 0;
  $$("[data-bonus]").forEach((btn) => {
    if (btn.classList.contains("promo__card")) btn.classList.toggle("is-ready", ready);
    const label = $("[data-bonus-label]", btn);
    const promo = btn.classList.contains("promo__card");
    if (label) label.textContent = ready ? (promo ? "Daglig bonus" : `Hämta ${formatCoins(DAILY_BONUS)} mynt`) : "Bonus hämtad";
    const sub = $("[data-bonus-sub]", btn);
    if (sub) sub.textContent = ready ? `+${formatCoins(DAILY_BONUS)} mynt nu` : `Ny om ${formatCooldown(wallet.dailyCooldown())}`;
  });
}

function onBonusClick(e) {
  const btn = e.currentTarget;
  if (wallet.canRefill()) {
    const amount = wallet.refill();
    coinBurst(btn);
    toast(`Påfyllning! +${formatCoins(amount)} mynt`, { variant: "gold", icon: coinSvg("icon") });
    return;
  }
  const got = wallet.claimDaily();
  if (got) {
    coinBurst(btn, 18);
    toast(`Daglig bonus! +${formatCoins(got)} mynt`, { variant: "gold", icon: coinSvg("icon") });
  } else {
    toast(`Nästa bonus om ${formatCooldown(wallet.dailyCooldown())}`, { icon: icons.gift });
  }
  renderBonusButtons();
}

/* ---------- Spelrutnät ---------- */
const BADGE = {
  popular: '<span class="badge badge--hot">Het</span>',
  new: '<span class="badge badge--new">Ny</span>',
  jackpot: '<span class="badge badge--jackpot">Jackpott</span>',
};

let filter = { category: load("lobby:category", "all"), query: "" };
if (!CATEGORIES.some((c) => c.id === filter.category)) filter.category = "all";

function matches(game) {
  const q = filter.query.trim().toLowerCase();
  // Sökningen gäller alla spel, oavsett vald kategori
  const inCat = !!q || filter.category === "all" || game.tags.includes(filter.category);
  const inQuery = !q || game.name.toLowerCase().includes(q) || game.tagline.toLowerCase().includes(q);
  return inCat && inQuery;
}

function metaFor(game) {
  if (game.kind !== "slot") return "Bordsspel";
  return `${game.grid} · ${typeof game.lines === "number" ? `${game.lines} linjer` : game.lines}`;
}

function cardHtml(game, i) {
  const soon = game.status !== "live";
  const badges = game.tags.map((t) => BADGE[t] ?? "").join("");
  return `
    <button class="tile${soon ? " is-soon" : ""}" type="button" data-game="${game.id}" style="--i:${i}"
      aria-label="${escapeHtml(game.name)}${soon ? " – kommer snart" : ""}">
      <span class="tile__art">
        ${coverArt(game, { cls: "tile__svg", width: 300, height: 300 })}
        <span class="tile__badges">${badges}${soon ? '<span class="badge badge--soon">Snart</span>' : ""}</span>
        ${soon ? `<span class="tile__lock">${icons.lock}</span>` : '<span class="tile__play" aria-hidden="true"></span>'}
      </span>
      <span class="tile__title">${escapeHtml(game.name)}</span>
      <span class="tile__meta">${metaFor(game)}</span>
    </button>`;
}

const sectionHtml = (title, list) => `
  <section class="games">
    <h2 class="games__title">${escapeHtml(title)}</h2>
    <div class="tiles">${list.map(cardHtml).join("")}</div>
  </section>`;

// Populära först, spel som snart kommer sist
const byPopularity = (a, b) =>
  (a.status !== "live") - (b.status !== "live") || b.tags.includes("popular") - a.tags.includes("popular");

function renderGrid() {
  const el = $("#game-sections");
  const list = GAMES.filter(matches);
  const browsing = filter.category === "all" && !filter.query.trim();
  if (!list.length) {
    el.innerHTML = `<p class="empty">Inga spel matchar "${escapeHtml(filter.query)}".</p>`;
  } else if (browsing) {
    const live = GAMES.filter((g) => g.status === "live");
    const popular = live.filter((g) => g.tags.includes("popular"));
    const fresh = live.filter((g) => g.tags.includes("new") && !g.tags.includes("popular"));
    el.innerHTML =
      sectionHtml("Populära spel", popular) +
      (fresh.length ? sectionHtml("Nya spel", fresh) : "") +
      sectionHtml("Alla spel", [...GAMES].sort(byPopularity));
  } else {
    const cat = CATEGORIES.find((c) => c.id === filter.category);
    const title = filter.query.trim() ? `Sökresultat` : cat?.label ?? "Spel";
    el.innerHTML = sectionHtml(title, [...list].sort(byPopularity));
  }
  const live = GAMES.filter((g) => g.status === "live").length;
  $("#game-count").textContent = `${live} spel att spela · ${GAMES.length - live} på väg`;
}

function renderChips() {
  $("#chips").innerHTML = CATEGORIES.map(
    (c) => `<button class="chip" type="button" data-cat="${c.id}" aria-pressed="${c.id === filter.category}">${c.label}</button>`,
  ).join("");
}

function openGame(id) {
  const game = GAMES.find((g) => g.id === id);
  if (!game) return;
  if (game.status === "live" && game.url) {
    location.href = game.url;
    return;
  }
  const facts = [
    ["Rutnät", game.grid],
    [game.kind === "slot" ? (typeof game.lines === "number" ? "Linjer" : "Vinstsätt") : "Typ", game.kind === "slot" ? game.lines : "Bord"],
    ["Volatilitet", game.volatility],
  ];
  const content = openModal(
    `<div class="game-info">
      <div class="game-info__art">${coverArt(game, { cls: "", width: 480, height: 300 })}</div>
      <div class="game-info__body">
        <span class="badge badge--soon">Under utveckling</span>
        <h2 class="game-info__title" style="margin-top:12px">${escapeHtml(game.name)}</h2>
        <p class="game-info__desc">${escapeHtml(game.tagline)}</p>
        <dl class="game-info__facts">
          ${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${escapeHtml(v)}</dd></div>`).join("")}
        </dl>
        <button class="btn btn--gold" type="button" data-notify>${icons.spark}Påminn mig när den släpps</button>
      </div>
    </div>`,
    game.name,
  );
  $("[data-notify]", content).addEventListener("click", () => {
    const wishlist = new Set(load("wishlist", []));
    wishlist.add(game.id);
    save("wishlist", [...wishlist]);
    closeModal();
    toast(`${game.name} är sparad på din önskelista`, { icon: icons.spark });
  });
}

/* ---------- Topplista ---------- */
let leaderOrder = "balance";
let leaderTimer = 0;

async function renderLeaders() {
  const el = $("#leaders");
  const me = account.user?.id;
  el.setAttribute("aria-busy", "true");
  try {
    const rows = await account.leaderboard(leaderOrder, 10);
    const field = leaderOrder === "balance" ? "balance" : "biggest_win";
    el.innerHTML = rows.length
      ? rows
          .map(
            (r, i) => `
      <div class="leader${r.id === me ? " is-me" : ""}">
        <span class="leader__rank">${i + 1}</span>
        <span class="leader__name">${escapeHtml(r.username)}${r.id === me ? " (du)" : ""}${r.level ? `<span class="level-chip">Nv ${r.level}</span>` : ""}</span>
        <span class="leader__score">${formatCoins(r[field])}</span>
      </div>`,
          )
          .join("") +
        (me ? "" : `<p class="leaders__note">Skapa ett konto för att synas på topplistan.</p>`)
      : `<p class="leaders__note">Ingen på listan än – skapa ett konto och bli först!</p>`;
  } catch (e) {
    console.warn("Topplistan kunde inte laddas:", e);
    el.innerHTML = `<p class="leaders__note">Topplistan kunde inte laddas just nu.</p>`;
  } finally {
    el.removeAttribute("aria-busy");
  }
}

/* ---------- Meddelande från admin ---------- */
async function renderAnnouncement() {
  const value = await account.setting("announcement").catch(() => null);
  const el = $("#announce");
  if (!value?.text) return;
  el.innerHTML = `${icons.spark}<span></span>`;
  el.querySelector("span").textContent = value.text;
  el.hidden = false;
}

/* ---------- Händelser ---------- */
function bindEvents() {
  $("#chips").addEventListener("click", (e) => {
    const chip = e.target.closest("[data-cat]");
    if (!chip) return;
    filter.category = chip.dataset.cat;
    save("lobby:category", filter.category);
    $$("[data-cat]").forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
    renderGrid();
  });

  $("#search").addEventListener("input", (e) => {
    filter.query = e.target.value;
    renderGrid();
  });

  $("#game-sections").addEventListener("click", (e) => {
    const card = e.target.closest("[data-game]");
    if (card) openGame(card.dataset.game);
  });

  $$("[data-bonus]").forEach((b) => b.addEventListener("click", onBonusClick));

  $$("[data-login]").forEach((b) => b.addEventListener("click", () => (closeMenu(), openAccount())));
  $$("[data-signup]").forEach((b) => b.addEventListener("click", openSignup));
  $$("[data-coffee]").forEach((b) => b.addEventListener("click", () => (closeMenu(), openCoffee())));
  $$("[data-watch]").forEach((b) => b.addEventListener("click", () => (closeMenu(), openWatch())));

  // Sök: knappen fäller ut sökfältet
  $("[data-search-toggle]").addEventListener("click", (e) => {
    const box = $("[data-search]");
    box.hidden = !box.hidden;
    e.currentTarget.setAttribute("aria-expanded", String(!box.hidden));
    if (!box.hidden) $("#search").focus();
    else if (filter.query) {
      $("#search").value = filter.query = "";
      renderGrid();
    }
  });

  // Flikar och meny
  $$("[data-tab]").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
  $$("[data-goto]").forEach((b) => b.addEventListener("click", () => (closeMenu(), setTab(b.dataset.goto))));
  $("[data-menu]").addEventListener("click", openMenu);
  $$("[data-menu-close]").forEach((b) => b.addEventListener("click", closeMenu));
  addEventListener("keydown", (e) => e.key === "Escape" && closeMenu());
  addEventListener("hashchange", tabFromHash);
  document.addEventListener("click", (e) => {
    if (!e.target.closest('a[href="#lobby"]')) return;
    e.preventDefault();
    setTab("casino");
  });

  $("#lb-tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-order]");
    if (!b) return;
    leaderOrder = b.dataset.order;
    $$("#lb-tabs [data-order]").forEach((t) => t.setAttribute("aria-pressed", String(t === b)));
    renderLeaders();
  });

  wallet.onChange(({ delta }) => {
    renderBalance();
    if (delta > 0) bumpBalance();
  });

  bindAccountUi({
    onChange: ({ event, profile }) => {
      $(".drawer__hint").textContent = profile ? "Visa profil och nivå" : "Spara saldot och tävla";
      renderBalance();
      renderBonusButtons();
      if (event !== "PROFILE") {
        clearTimeout(leaderTimer);
        leaderTimer = setTimeout(() => {
          renderLeaders();
          refreshTournaments();
        }, 250);
      }
    },
  });

  // Uppdatera bonusknappen om sidan står öppen när nedräkningen går ut
  setInterval(renderBonusButtons, 60_000);
}

/* ---------- Flikar ---------- */
function setTab(name, scroll = true) {
  $$("[data-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === name)));
  $$("[data-panel]").forEach((p) => (p.hidden = p.dataset.panel !== name));
  if (scroll) scrollTo({ top: 0, behavior: "smooth" });
}

function tabFromHash() {
  if (["#tournaments", "#leaderboard"].includes(location.hash)) setTab("compete", false);
  else if (location.hash === "#lobby") setTab("casino", false);
}

/* ---------- Meny ---------- */
function openMenu() {
  const d = $("#drawer");
  d.hidden = false;
  requestAnimationFrame(() => d.classList.add("is-open"));
  $("[data-menu]").setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
}

function closeMenu() {
  const d = $("#drawer");
  if (d.hidden) return;
  d.classList.remove("is-open");
  $("[data-menu]").setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
  setTimeout(() => {
    if (!d.classList.contains("is-open")) d.hidden = true;
  }, 250);
}

/* ---------- Start ---------- */
hydrateIcons();
renderBalance();
renderBonusButtons();
renderChips();
renderGrid();
bindEvents();
setTab("casino", false);
tabFromHash();
mountLevelBadge($("[data-level-badge]"));
mountTournaments($("#tours"));
renderAnnouncement();
celebrateLevelUps();
