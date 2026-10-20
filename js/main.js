// Lucky Reels – lobbyns startpunkt

import { GAMES, CATEGORIES } from "./data/games.js";
import { wallet, formatCoins, DAILY_BONUS } from "./lib/wallet.js";
import { load, save } from "./lib/storage.js";
import { icons, coinSvg } from "./ui/icons.js";
import { coverArt } from "./ui/art.js";
import { toast, openModal, closeModal, coinBurst } from "./ui/feedback.js";
import { mountHeroMachine } from "./ui/hero-machine.js";

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
    if (btn.classList.contains("btn")) btn.classList.toggle("pulse", ready);
    const label = $("[data-bonus-label]", btn);
    if (label) label.textContent = ready ? `Hämta ${formatCoins(DAILY_BONUS)} mynt` : "Bonus hämtad";
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
  const inCat = filter.category === "all" || game.tags.includes(filter.category);
  const q = filter.query.trim().toLowerCase();
  const inQuery = !q || game.name.toLowerCase().includes(q) || game.tagline.toLowerCase().includes(q);
  return inCat && inQuery;
}

function cardHtml(game, i) {
  const soon = game.status !== "live";
  const badges = game.tags.map((t) => BADGE[t] ?? "").join("");
  const meta = game.kind === "slot" ? `${game.grid} · ${game.lines} linjer` : "Bordsspel";
  return `
    <button class="card${soon ? " is-soon" : ""}" type="button" data-game="${game.id}" style="--i:${i}"
      aria-label="${escapeHtml(game.name)}${soon ? " – kommer snart" : ""}">
      ${coverArt(game)}
      <div class="card__badges">${badges}${soon ? '<span class="badge badge--soon">Snart</span>' : ""}</div>
      ${soon ? `<span class="card__lock">${icons.lock}</span>` : ""}
      <div class="card__body">
        <h3 class="card__title">${escapeHtml(game.name)}</h3>
        <p class="card__meta">${meta}</p>
      </div>
    </button>`;
}

function renderGrid() {
  const list = GAMES.filter(matches);
  const grid = $("#game-grid");
  grid.innerHTML = list.length
    ? list.map(cardHtml).join("")
    : `<p class="empty">Inga spel matchar "${escapeHtml(filter.query)}".</p>`;
  $("#game-count").textContent = `${list.length} av ${GAMES.length} spel`;
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
    [game.kind === "slot" ? "Linjer" : "Typ", game.kind === "slot" ? game.lines : "Bord"],
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

/* ---------- Topplista (exempeldata tills steg 4) ---------- */
const SAMPLE_LEADERS = [
  ["LuckyLinnea", 1_284_500],
  ["SpinKungen", 982_150],
  ["Diamant_Dan", 760_900],
  ["Klöver7", 512_300],
  ["NattUgglan", 401_750],
];

function renderLeaders() {
  $("#leaders").innerHTML =
    SAMPLE_LEADERS.map(
      ([name, score], i) => `
      <div class="leader">
        <span class="leader__rank">${i + 1}</span>
        <span class="leader__name">${escapeHtml(name)}</span>
        <span class="leader__score">${formatCoins(score)}</span>
      </div>`,
    ).join("") + `<p class="leaders__note">Exempeldata – riktiga topplistor kommer när inloggning är på plats.</p>`;
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

  $("#game-grid").addEventListener("click", (e) => {
    const card = e.target.closest("[data-game]");
    if (card) openGame(card.dataset.game);
  });

  $$("[data-bonus]").forEach((b) => b.addEventListener("click", onBonusClick));

  $$("[data-login]").forEach((b) =>
    b.addEventListener("click", () =>
      toast("Inloggning och sparat saldo i molnet kommer snart. Ditt saldo sparas lokalt så länge.", {
        icon: icons.user,
        duration: 3800,
      }),
    ),
  );

  $("[data-play-now]").addEventListener("click", () => {
    $("#lobby").scrollIntoView({ behavior: "smooth" });
  });

  wallet.onChange(({ delta }) => {
    renderBalance();
    if (delta > 0) bumpBalance();
  });

  // Uppdatera bonusknappen om sidan står öppen när nedräkningen går ut
  setInterval(renderBonusButtons, 60_000);
}

/* ---------- Start ---------- */
hydrateIcons();
renderBalance();
renderBonusButtons();
renderChips();
renderGrid();
renderLeaders();
bindEvents();
mountHeroMachine($(".machine"));
