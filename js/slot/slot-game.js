// Lucky Reels – gemensam spelsida för alla slots.
//
// Ett spel behöver bara en konfiguration (js/slot/games/<id>.js) och en
// HTML-sida som anropar mountSlot(config). Allt gränssnitt byggs här.

import { prepare, spin as engineSpin } from "./engine.js";
import { sfx } from "./audio.js";
import { coinShower } from "./coins.js";
import { wallet, formatCoins } from "../lib/wallet.js";
import { load, save } from "../lib/storage.js";
import { symbolSvg } from "../ui/symbols.js";
import { icons, coinSvg } from "../ui/icons.js";
import { toast, openModal, closeModal } from "../ui/feedback.js";

export const SYMBOL_NAMES = {
  seven: "Sjua", cherry: "Körsbär", lemon: "Citron", orange: "Apelsin", plum: "Plommon", grapes: "Druvor",
  bell: "Klocka", bar: "BAR", wild: "WILD", ten: "Tia", jack: "Knekt", queen: "Dam", king: "Kung", ace: "Ess",
  ruby: "Rubin", emerald: "Smaragd", sapphire: "Safir", amethyst: "Ametist", diamond: "Diamant", crown: "Krona",
  star: "Stjärna", clover: "Klöver",
};

const LINE_COLORS = [
  "#facc15", "#f87171", "#60a5fa", "#4ade80", "#f472b6", "#fb923c", "#a78bfa", "#2dd4bf", "#e879f9", "#fde047",
  "#38bdf8", "#f43f5e", "#84cc16", "#c084fc", "#fbbf24", "#22d3ee", "#fb7185", "#a3e635", "#818cf8", "#f97316",
  "#34d399", "#e11d48", "#93c5fd", "#fcd34d", "#d946ef",
];

const BIG_WIN = 15; // × insatsen
const GAP = 4; // px, måste matcha .reels gap

const $ = (sel, root = document) => root.querySelector(sel);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function mountSlot(config) {
  prepare(config);
  const id = config.id;
  const maxBet = config.bets[config.bets.length - 1];

  /* ---------- Tillstånd ---------- */
  const st = {
    bet: config.bets.includes(load(`slot:${id}:bet`, 0)) ? load(`slot:${id}:bet`, 0) : config.bets[Math.min(1, config.bets.length - 1)],
    turbo: load("settings:turbo", false),
    sound: load("settings:sound", true),
    spinning: false,
    auto: 0,
    fs: load(`slot:${id}:fs`, null), // { left, total, win, bet }
    jackpot: config.jackpot ? load(`jackpot:${id}`, config.jackpot.seed) : 0,
    grid: null,
    anims: [],
    timers: [],
    lineCycle: 0,
    overlay: null,
  };
  sfx.setEnabled(st.sound);

  /* ---------- DOM ---------- */
  document.title = `${config.name} – Lucky Reels`;
  document.body.className = "slot-page";
  document.body.style.setProperty("--g-from", config.theme.from);
  document.body.style.setProperty("--g-to", config.theme.to);
  document.body.style.setProperty("--g-glow", config.theme.glow);

  const cols = Array.from({ length: config.reels }, (_, r) => `<div class="reel-col" data-reel="${r}"><div class="strip"></div></div>`).join("");

  document.body.innerHTML = `
    <header class="slot-top">
      <a class="btn btn--ghost btn--icon" href="../../" aria-label="Tillbaka till lobbyn">${icons.back}</a>
      <h1 class="slot-top__title text-gold">${config.name}</h1>
      <div class="balance" title="Ditt saldo">${coinSvg("balance__coin")}<span data-balance></span></div>
    </header>
    <main class="slot">
      <div class="slot__marquee">
        ${config.jackpot ? `<div class="jackpot"><span class="jackpot__label">JACKPOTT</span>${coinSvg("icon")}<span class="jackpot__value" data-jackpot></span></div>` : ""}
        <span class="fs-banner">${icons.spark}<span data-fs-text></span></span>
      </div>
      <div class="frame">
        <div class="reels" style="--reels:${config.reels};--rows:${config.rows}">
          ${cols}
          <svg class="paylines" aria-hidden="true"></svg>
        </div>
      </div>
      <div class="winbar" aria-live="polite">
        <div class="winbar__amount" data-win>&nbsp;</div>
        <div class="winbar__msg" data-msg></div>
      </div>
      <div class="controls">
        <div class="bet">
          <button type="button" data-bet="-1" aria-label="Sänk insats">−</button>
          <div class="bet__value"><span class="bet__label">INSATS</span><span class="bet__amount" data-bet-amount></span></div>
          <button type="button" data-bet="1" aria-label="Höj insats">+</button>
        </div>
        <button class="spin-btn" type="button" data-spin aria-label="Snurra">${icons.spin}<span class="spin-btn__count" data-spin-count></span></button>
        <div class="side-actions">
          <button class="round-btn" type="button" data-auto aria-pressed="false" aria-label="Autospel">AUTO</button>
          <button class="round-btn" type="button" data-turbo aria-pressed="${st.turbo}" aria-label="Turbo">${icons.bolt}</button>
        </div>
      </div>
      <div class="toolbar-mini">
        <button class="btn btn--ghost" type="button" data-paytable>${icons.info}Vinsttabell</button>
        <button class="btn btn--ghost" type="button" data-sound aria-pressed="${st.sound}"></button>
      </div>
    </main>
    <div class="toasts" aria-live="polite"></div>`;

  const reelsEl = $(".reels");
  const colEls = [...document.querySelectorAll(".reel-col")];
  const strips = colEls.map((c) => $(".strip", c));
  const paylinesEl = $(".paylines");
  const winEl = $("[data-win]");
  const msgEl = $("[data-msg]");
  const spinBtn = $("[data-spin]");
  const autoBtn = $("[data-auto]");

  /* ---------- Storlek ---------- */
  // Cellerna får bli lite högre än breda i stående läge, så att hjulen fyller skärmen.
  let cellW = 72;
  let cellH = 72;
  function layout() {
    const landscape = innerWidth > innerHeight && innerHeight < 520;
    const chrome = landscape ? 56 + 60 : 56 + 40 + 56 + 92 + 36 + 5 * 12 + 40;
    const availH = innerHeight - chrome - 28;
    const gutter = 2 * Math.max(16, Math.min(32, innerWidth * 0.04));
    const availW = (landscape ? innerWidth - 360 : Math.min(innerWidth, 760)) - gutter - 28;
    const byW = (availW - GAP * (config.reels - 1)) / config.reels;
    const byH = availH / config.rows;
    cellW = Math.max(44, Math.floor(Math.min(byW, byH, config.reels <= 3 ? 140 : 124)));
    cellH = Math.max(44, Math.floor(Math.min(byH, cellW * 1.3)));
    document.body.style.setProperty("--cell-w", `${cellW}px`);
    document.body.style.setProperty("--cell-h", `${cellH}px`);
    paylinesEl.setAttribute("viewBox", `0 0 ${config.reels * cellW + (config.reels - 1) * GAP} ${config.rows * cellH}`);
  }
  addEventListener("resize", layout);
  layout();

  /* ---------- Rendering ---------- */
  const cellHtml = (sym, r, row) =>
    `<div class="cell"${r !== undefined ? ` data-pos="${r}-${row}"` : ""}>${symbolSvg(sym)}</div>`;

  function renderGrid(grid) {
    strips.forEach((strip, r) => {
      strip.innerHTML = grid[r].map((s, row) => cellHtml(s, r, row)).join("");
      strip.style.transform = "";
    });
  }

  function renderBalance() {
    document.querySelectorAll("[data-balance]").forEach((el) => (el.textContent = formatCoins(wallet.balance)));
  }

  function renderBet() {
    const bet = st.fs ? st.fs.bet : st.bet;
    $("[data-bet-amount]").textContent = formatCoins(bet);
    const i = config.bets.indexOf(st.bet);
    const locked = st.spinning || st.auto > 0 || !!st.fs;
    $('[data-bet="-1"]').disabled = locked || i <= 0;
    $('[data-bet="1"]').disabled = locked || i >= config.bets.length - 1;
  }

  function renderJackpot() {
    const el = $("[data-jackpot]");
    if (el) el.textContent = formatCoins(st.jackpot);
  }

  function renderControls() {
    document.body.classList.toggle("is-spinning", st.spinning);
    document.body.classList.toggle("in-free-spins", !!st.fs);
    autoBtn.setAttribute("aria-pressed", String(st.auto > 0));
    autoBtn.textContent = st.auto > 0 ? (st.auto === Infinity ? "∞" : String(st.auto)) : "AUTO";
    autoBtn.disabled = !!st.fs;
    $("[data-spin-count]").textContent = st.fs ? `${st.fs.left}` : "";
    if (st.fs) {
      const mult = config.freeSpinMultiplier ?? 1;
      $("[data-fs-text]").textContent = `FREE SPINS ${st.fs.total - st.fs.left}/${st.fs.total}${mult > 1 ? ` ×${mult}` : ""}`;
    }
    const soundBtn = $("[data-sound]");
    soundBtn.innerHTML = `${st.sound ? icons.sound : icons.mute}${st.sound ? "Ljud på" : "Ljud av"}`;
    soundBtn.setAttribute("aria-pressed", String(st.sound));
    renderBet();
  }

  function randomSymbolFor(r) {
    const table = config._tables[r];
    const x = Math.random() * table.total;
    for (const [sym, upto] of table.cumulative) if (x < upto) return sym;
    return table.cumulative[0][0];
  }

  /* ---------- Vinstpresentation ---------- */
  function clearWin() {
    clearInterval(st.lineCycle);
    reelsEl.classList.remove("has-win");
    reelsEl.querySelectorAll(".is-win").forEach((c) => c.classList.remove("is-win"));
    paylinesEl.innerHTML = "";
    winEl.classList.remove("is-active");
  }

  function linePoints(lineIndex) {
    const line = config.lines[lineIndex];
    const x = (r) => r * (cellW + GAP) + cellW / 2;
    const y = (row) => row * cellH + cellH / 2;
    const W = config.reels * cellW + (config.reels - 1) * GAP;
    const pts = [[0, y(line[0])], ...line.map((row, r) => [x(r), y(row)]), [W, y(line[line.length - 1])]];
    return pts.map((p) => p.join(",")).join(" ");
  }

  function drawLines(indices) {
    paylinesEl.innerHTML = indices
      .map((i) => `<polyline points="${linePoints(i)}" stroke="${LINE_COLORS[i % LINE_COLORS.length]}" color="${LINE_COLORS[i % LINE_COLORS.length]}"/>`)
      .join("");
  }

  function markCells(positions) {
    reelsEl.querySelectorAll(".is-win").forEach((c) => c.classList.remove("is-win"));
    for (const [r, row] of positions) reelsEl.querySelector(`[data-pos="${r}-${row}"]`)?.classList.add("is-win");
  }

  function describeWin(w) {
    const name = SYMBOL_NAMES[w.symbol] ?? w.symbol;
    return `Linje ${w.line + 1} · ${w.count}× ${name}${w.wildBoost ? ` · WILD ×${config.wildMultiplier}` : ""} · ${formatCoins(w.amount)}`;
  }

  function countUp(el, to, ms) {
    return new Promise((resolve) => {
      if (ms <= 0) {
        el.textContent = formatCoins(to);
        return resolve();
      }
      const start = performance.now();
      let lastTick = 0;
      const step = (now) => {
        const t = Math.min(1, (now - start) / ms);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = formatCoins(to * eased);
        if (now - lastTick > 70 && t < 1) {
          sfx.tick();
          lastTick = now;
        }
        if (t < 1) requestAnimationFrame(step);
        else {
          el.textContent = formatCoins(to);
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  function showOverlay({ kicker = "", title, amount = null, hint = "Tryck för att fortsätta", autoClose = 4000, shower = 0 }) {
    return new Promise((resolve) => {
      const el = document.createElement("div");
      el.className = "overlay";
      el.innerHTML = `<div>
          <div class="overlay__kicker">${kicker}</div>
          <div class="overlay__title">${title}</div>
          ${amount !== null ? `<div class="overlay__amount text-gold" data-amount>0</div>` : ""}
          <div class="overlay__hint">${hint}</div>
        </div>`;
      document.body.append(el);
      st.overlay = el;
      const stopCoins = shower ? coinShower({ duration: autoClose - 800, intensity: shower, parent: el }) : () => {};
      if (amount !== null) countUp($("[data-amount]", el), amount, Math.min(2500, autoClose - 1200));
      let done = false;
      const close = () => {
        if (done) return;
        done = true;
        stopCoins();
        el.remove();
        st.overlay = null;
        resolve();
      };
      el.addEventListener("click", close);
      setTimeout(close, st.auto > 0 || st.fs ? autoClose : autoClose + 4000);
    });
  }

  async function present(result, bet, isFree) {
    const total = result.total;
    const scatterHit = result.scatter && (result.scatter.amount > 0 || result.scatter.freeSpins > 0);

    if (total <= 0 && !scatterHit) {
      winEl.innerHTML = "&nbsp;";
      msgEl.textContent = isFree ? "Ingen vinst – nästa free spin" : "";
      return;
    }

    const positions = result.wins.flatMap((w) => w.positions);
    if (scatterHit) positions.push(...result.scatter.positions);
    reelsEl.classList.add("has-win");
    markCells(positions);
    drawLines(result.wins.map((w) => w.line));

    if (total > 0) {
      wallet.credit(total, "win");
      if (navigator.vibrate && st.sound) navigator.vibrate(total >= bet * BIG_WIN ? [60, 40, 120] : 25);
    }

    const ratio = total / bet;
    winEl.classList.add("is-active");
    msgEl.textContent =
      result.wins.length === 1 ? describeWin(result.wins[0]) : result.wins.length > 1 ? `${result.wins.length} vinstlinjer` : "";
    if (result.scatter?.amount > 0) msgEl.textContent += `${msgEl.textContent ? " · " : ""}Scatter ${formatCoins(result.scatter.amount)}`;

    if (ratio >= BIG_WIN) {
      sfx.bigWin();
      const tier = ratio >= 100 ? ["EPISK", "VINST", 3] : ratio >= 40 ? ["MEGA", "VINST", 2] : ["STOR", "VINST", 1];
      winEl.textContent = formatCoins(total);
      await showOverlay({ kicker: tier[0], title: tier[1], amount: total, autoClose: st.turbo ? 3000 : 4500, shower: tier[2] });
      if (st.auto > 0) {
        st.auto = 0;
        toast("Autospel stoppat efter storvinst", { icon: icons.spark });
      }
    } else if (total > 0) {
      sfx.win(Math.min(4, Math.floor(ratio)));
      const ms = st.turbo ? 300 : Math.min(1800, 400 + ratio * 150);
      await countUp(winEl, total, ms);
    }

    // Visa linjerna en i taget tills nästa snurr
    if (result.wins.length > 1) {
      let i = 0;
      st.lineCycle = setInterval(() => {
        const w = result.wins[i % result.wins.length];
        drawLines([w.line]);
        markCells(w.positions);
        msgEl.textContent = describeWin(w);
        i++;
      }, 1400);
    }
  }

  /* ---------- Hjulanimation ---------- */
  function animateReels(grid) {
    const turbo = st.turbo;
    const base = turbo ? 280 : 650;
    const step = turbo ? 90 : 230;
    const speed = turbo ? 30 : 42; // ms per symbol
    const scatterId = config.scatter?.id;
    const needed = scatterId ? Math.min(...Object.keys(config.scatter.freeSpins ?? { 3: 0 }).map(Number)) : Infinity;

    // Stopptider, med extra spänning när free spins är nära
    const stops = [];
    let seen = 0;
    let extra = 0;
    for (let r = 0; r < config.reels; r++) {
      const anticipate = scatterId && !turbo && seen >= needed - 1 && seen < needed + 2 && r > 0;
      if (anticipate) extra += 1000;
      stops.push({ at: base + r * step + extra, anticipate });
      seen += grid[r].filter((s) => s === scatterId).length;
    }

    sfx.spin();
    let scattersLanded = 0;

    const promises = strips.map((strip, r) => {
      const { at, anticipate } = stops[r];
      const fillers = Math.max(4, Math.round(at / speed));
      const current = st.grid ? st.grid[r] : grid[r];
      const symbols = [...grid[r], ...Array.from({ length: fillers }, () => randomSymbolFor(r)), ...current];
      strip.innerHTML = symbols.map((s, i) => (i < config.rows ? cellHtml(s, r, i) : cellHtml(s))).join("");
      const distance = (symbols.length - config.rows) * cellH;

      if (anticipate) {
        st.timers.push(
          setTimeout(() => {
            colEls[r].classList.add("is-anticipating");
            sfx.anticipation();
          }, stops[r - 1].at),
        );
      }

      const anim = strip.animate(
        [
          { transform: `translateY(${-distance}px)`, easing: "cubic-bezier(.3,.05,.55,1)" },
          { transform: `translateY(${Math.round(cellH * 0.14)}px)`, offset: 0.93, easing: "ease-out" },
          { transform: "translateY(0)" },
        ],
        { duration: at },
      );
      st.anims.push(anim);

      return anim.finished
        .catch(() => {})
        .then(() => {
          colEls[r].classList.remove("is-anticipating");
          strip.innerHTML = grid[r].map((s, row) => cellHtml(s, r, row)).join("");
          sfx.reelStop(r);
          grid[r].forEach((s, row) => {
            if (s === scatterId) {
              scattersLanded++;
              sfx.scatter(scattersLanded - 1);
              reelsEl.querySelector(`[data-pos="${r}-${row}"]`)?.classList.add("is-scatter");
            }
          });
        });
    });

    return Promise.all(promises).then(() => {
      st.anims = [];
      st.timers.forEach(clearTimeout);
      st.timers = [];
    });
  }

  function slamStop() {
    st.timers.forEach(clearTimeout);
    st.timers = [];
    st.anims.forEach((a) => a.finish());
  }

  async function expandWilds(result) {
    if (!result.expanded.length) return;
    for (const r of result.expanded) {
      strips[r].innerHTML = result.grid[r].map((s, row) => cellHtml(s, r, row)).join("");
      strips[r].querySelectorAll(".cell").forEach((c) => c.classList.add("is-expanding"));
      sfx.scatter(2);
      await wait(st.turbo ? 120 : 320);
    }
    msgEl.textContent = result.expanded.length > 1 ? `${result.expanded.length} expanderande wilds!` : "Expanderande wild!";
    await wait(st.turbo ? 150 : 400);
  }

  /* ---------- Spelrunda ---------- */
  async function play() {
    sfx.unlock();
    if (st.overlay) return;
    if (st.spinning) {
      slamStop();
      return;
    }
    st.timers.forEach(clearTimeout);
    st.timers = [];

    const isFree = !!st.fs && st.fs.left > 0;
    const bet = isFree ? st.fs.bet : st.bet;

    if (!isFree) {
      if (!wallet.debit(bet, "bet")) {
        insufficient();
        return;
      }
      if (config.jackpot) {
        st.jackpot += bet * config.jackpot.contribution;
        save(`jackpot:${id}`, st.jackpot);
        renderJackpot();
      }
    }

    st.spinning = true;
    clearWin();
    winEl.innerHTML = "&nbsp;";
    msgEl.textContent = isFree ? "Free spin…" : "Lycka till!";
    if (isFree) {
      st.fs.left--;
      save(`slot:${id}:fs`, st.fs);
    }
    renderControls();
    sfx.click();

    const result = engineSpin(config, { bet, multiplier: isFree ? config.freeSpinMultiplier ?? 1 : 1 });
    await animateReels(result.raw);
    st.grid = result.raw;
    await expandWilds(result);
    st.grid = result.grid;

    await present(result, bet, isFree);

    // Jackpott
    if (result.jackpot && config.jackpot) {
      const win = Math.max(bet * 50, Math.floor((st.jackpot * bet) / maxBet));
      st.jackpot = Math.max(config.jackpot.seed, st.jackpot - win);
      save(`jackpot:${id}`, st.jackpot);
      renderJackpot();
      wallet.credit(win, "win");
      sfx.bigWin();
      st.auto = 0;
      await showOverlay({ kicker: "DU VANN", title: "JACKPOTT!", amount: win, autoClose: 6000, shower: 3 });
    }

    // Free spins
    if (isFree) st.fs.win += result.total;
    const awarded = result.scatter?.freeSpins ?? 0;
    if (awarded > 0) {
      sfx.feature();
      const mult = config.freeSpinMultiplier ?? 1;
      if (isFree) {
        st.fs.left += awarded;
        st.fs.total += awarded;
        await showOverlay({ kicker: "RETRIGGER", title: `+${awarded} FREE SPINS`, autoClose: 2500 });
      } else {
        st.fs = { left: awarded, total: awarded, win: 0, bet };
        if (st.auto > 0) {
          st.auto = 0;
        }
        await showOverlay({
          kicker: `${result.scatter.count} SCATTER`,
          title: `${awarded} FREE SPINS`,
          hint: mult > 1 ? `Alla vinster ×${mult} · tryck för att starta` : "Tryck för att starta",
          autoClose: 3200,
          shower: 1,
        });
      }
      save(`slot:${id}:fs`, st.fs);
    }

    if (st.fs && st.fs.left === 0) {
      const { win, total } = st.fs;
      st.fs = null;
      save(`slot:${id}:fs`, null);
      renderControls();
      await showOverlay({
        kicker: `${total} FREE SPINS KLARA`,
        title: win > 0 ? "TOTALVINST" : "OTUR DEN HÄR GÅNGEN",
        amount: win > 0 ? win : null,
        autoClose: 4000,
        shower: win > 0 ? 1 : 0,
      });
    }

    st.spinning = false;
    renderControls();

    // Fortsätt automatiskt
    if (st.fs) {
      st.timers.push(setTimeout(play, st.turbo ? 300 : 700));
    } else if (st.auto > 0) {
      st.auto = st.auto === Infinity ? Infinity : st.auto - 1;
      renderControls();
      if (st.auto > 0 || st.auto === Infinity) st.timers.push(setTimeout(play, st.turbo ? 200 : 500));
    }
  }

  function insufficient() {
    sfx.error();
    st.auto = 0;
    renderControls();
    if (wallet.canRefill()) {
      const content = openModal(
        `<div class="auto-menu">
          <h2>Slut på mynt</h2>
          <p>Ingen fara – det är bara låtsaspengar. Fyll på och fortsätt spela.</p>
          <button class="btn btn--gold" type="button" style="grid-column:1/-1" data-refill>${icons.gift}Fyll på till 10 000 mynt</button>
        </div>`,
        "Slut på mynt",
      );
      $("[data-refill]", content).addEventListener("click", () => {
        const amount = wallet.refill();
        closeModal();
        toast(`+${formatCoins(amount)} mynt`, { variant: "gold", icon: coinSvg("icon") });
      });
      return;
    }
    const affordable = [...config.bets].reverse().find((b) => b <= wallet.balance);
    if (affordable) {
      st.bet = affordable;
      save(`slot:${id}:bet`, st.bet);
      renderBet();
      toast(`Insatsen sänktes till ${formatCoins(affordable)} – saldot räckte inte`, { icon: icons.info });
    } else {
      toast(`Lägsta insats är ${formatCoins(config.bets[0])} mynt. Hämta din dagliga bonus i lobbyn!`, { icon: icons.info, duration: 4000 });
    }
  }

  /* ---------- Menyer ---------- */
  function openAutoMenu() {
    const content = openModal(
      `<div class="auto-menu">
        <h2>Autospel</h2>
        <p>Stoppar automatiskt vid free spins, storvinst eller om saldot tar slut. Tryck på knappen igen för att stoppa.</p>
        ${[10, 25, 50, 100, 250]
          .map((n) => `<button class="btn btn--ghost" type="button" data-n="${n}">${n}</button>`)
          .join("")}
        <button class="btn btn--ghost" type="button" data-n="Infinity">∞</button>
      </div>`,
      "Autospel",
    );
    content.addEventListener("click", (e) => {
      const b = e.target.closest("[data-n]");
      if (!b) return;
      st.auto = Number(b.dataset.n);
      closeModal();
      renderControls();
      play();
    });
  }

  function lineMini(line) {
    const w = config.reels * 10;
    const h = config.rows * 10;
    const cells = [];
    for (let r = 0; r < config.reels; r++)
      for (let row = 0; row < config.rows; row++)
        cells.push(`<rect x="${r * 10 + 1}" y="${row * 10 + 1}" width="8" height="8" rx="1.5" fill="${line[r] === row ? "#ffd36b" : "rgba(255,255,255,.12)"}"/>`);
    return `<svg viewBox="0 0 ${w} ${h}">${cells.join("")}</svg>`;
  }

  function openPaytable() {
    const bet = st.fs ? st.fs.bet : st.bet;
    const lineBet = bet / config.lines.length;
    const special = new Set([config.wild, config.scatter?.id].filter(Boolean));
    const regular = Object.entries(config.symbols)
      .filter(([sym, s]) => !special.has(sym) && s.pays && Object.keys(s.pays).length)
      .sort((a, b) => Math.max(...Object.values(b[1].pays)) - Math.max(...Object.values(a[1].pays)));

    const pays = (p, unit) =>
      Object.entries(p)
        .sort((a, b) => b[0] - a[0])
        .map(([n, x]) => `<li><b>${n}×</b> ${formatCoins(x * unit)}</li>`)
        .join("");

    const specials = [];
    if (config.wild) {
      const wp = config.symbols[config.wild].pays ?? {};
      const parts = ["Ersätter alla symboler utom scatter."];
      if (config.wildMultiplier) parts.push(`Vinster med WILD multipliceras ×${config.wildMultiplier}.`);
      if (config.expandingWild) parts.push(`Expanderar och täcker hela hjulet på hjul ${config.expandingWild.reels.map((r) => r + 1).join(", ")}.`);
      if (Object.keys(wp).length) parts.push(`Egen vinst: ${Object.entries(wp).sort((a, b) => b[0] - a[0]).map(([n, x]) => `${n}× = ${formatCoins(x * lineBet)}`).join(", ")}.`);
      if (config.jackpot) parts.push(`${config.jackpot.count} eller fler var som helst vinner jackpotten. Maxinsats ger hela potten, lägre insats en andel.`);
      specials.push(`<div class="special">${symbolSvg(config.wild)}<p><strong>${SYMBOL_NAMES[config.wild]} är WILD.</strong> ${parts.join(" ")}</p></div>`);
    }
    if (config.scatter) {
      const s = config.scatter;
      const fs = Object.entries(s.freeSpins ?? {}).map(([n, x]) => `${n} ger ${x}`).join(", ");
      const sp = Object.entries(s.pays ?? {}).map(([n, x]) => `${n}× = ${formatCoins(x * bet)}`).join(", ");
      specials.push(`<div class="special">${symbolSvg(s.id)}<p><strong>${SYMBOL_NAMES[s.id]} är SCATTER</strong> och vinner var som helst. ${sp ? `Vinst: ${sp}. ` : ""}Free spins: ${fs}.${config.freeSpinMultiplier > 1 ? ` Alla vinster under free spins ×${config.freeSpinMultiplier}.` : ""} Kan återaktiveras.</p></div>`);
    }

    openModal(
      `<div class="paytable">
        <h2>${config.name}</h2>
        <p>${config.tagline}</p>
        <p>Vinsterna nedan gäller din insats på <strong>${formatCoins(bet)}</strong> mynt. Linjevinster räknas från vänster hjul, bara högsta vinsten per linje betalas.</p>
        ${specials.length ? `<h3>Specialsymboler</h3>${specials.join("")}` : ""}
        <h3>Symboler</h3>
        <div class="pay-grid">
          ${regular.map(([sym, s]) => `<div class="pay-item">${symbolSvg(sym)}<ul>${pays(s.pays, lineBet)}</ul></div>`).join("")}
        </div>
        <h3>${config.lines.length} vinstlinjer</h3>
        <div class="line-grid">
          ${config.lines.map((l, i) => `<div class="line-mini">${lineMini(l)}${i + 1}</div>`).join("")}
        </div>
        <h3>Om spelet</h3>
        <p>Rutnät ${config.reels}×${config.rows} · Volatilitet: ${config.volatility}${config.rtp ? ` · Teoretisk återbetalning ca ${config.rtp} % (simulerad)` : ""}.</p>
        <p>Varje snurr slumpas med webbläsarens kryptografiska slumpgenerator. Mynten är låtsaspengar utan värde.</p>
      </div>`,
      "Vinsttabell",
    );
  }

  /* ---------- Händelser ---------- */
  spinBtn.addEventListener("click", () => {
    if (st.auto > 0 && !st.spinning) {
      st.auto = 0;
      renderControls();
      return;
    }
    play();
  });

  autoBtn.addEventListener("click", () => {
    sfx.unlock();
    sfx.click();
    if (st.auto > 0) {
      st.auto = 0;
      renderControls();
      toast("Autospel stoppat", { icon: icons.info, duration: 1600 });
    } else if (!st.spinning) {
      openAutoMenu();
    }
  });

  document.querySelectorAll("[data-bet]").forEach((b) =>
    b.addEventListener("click", () => {
      sfx.unlock();
      const i = config.bets.indexOf(st.bet) + Number(b.dataset.bet);
      if (i < 0 || i >= config.bets.length) return;
      st.bet = config.bets[i];
      save(`slot:${id}:bet`, st.bet);
      sfx.click();
      renderBet();
    }),
  );

  $("[data-turbo]").addEventListener("click", (e) => {
    st.turbo = !st.turbo;
    save("settings:turbo", st.turbo);
    e.currentTarget.setAttribute("aria-pressed", String(st.turbo));
    sfx.click();
    toast(st.turbo ? "Turbo på" : "Turbo av", { icon: icons.bolt, duration: 1400 });
  });

  $("[data-sound]").addEventListener("click", () => {
    st.sound = !st.sound;
    save("settings:sound", st.sound);
    sfx.setEnabled(st.sound);
    if (st.sound) sfx.click();
    renderControls();
  });

  $("[data-paytable]").addEventListener("click", openPaytable);

  document.addEventListener("keydown", (e) => {
    if (e.code !== "Space" || e.repeat) return;
    if (e.target.closest?.("button, a, input, .modal.is-open")) return;
    if (document.querySelector(".modal.is-open")) return;
    e.preventDefault();
    if (st.overlay) st.overlay.click();
    else play();
  });

  wallet.onChange(({ delta }) => {
    renderBalance();
    if (delta > 0) {
      const el = $(".slot-top .balance");
      el.classList.remove("is-bump");
      void el.offsetWidth;
      el.classList.add("is-bump");
    }
  });

  // Pausa autospel när fliken göms, så man inte spelar bort saldot i bakgrunden
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && st.auto > 0) {
      st.auto = 0;
      renderControls();
    }
  });

  /* ---------- Start ---------- */
  const startGrid = Array.from({ length: config.reels }, (_, r) =>
    Array.from({ length: config.rows }, () => randomSymbolFor(r)),
  );
  st.grid = startGrid;
  renderGrid(startGrid);
  renderBalance();
  renderJackpot();
  renderControls();
  msgEl.textContent = "Tryck på snurra för att börja";

  if (st.fs && st.fs.left > 0) {
    showOverlay({
      kicker: "VÄLKOMMEN TILLBAKA",
      title: `${st.fs.left} FREE SPINS KVAR`,
      hint: "Tryck för att fortsätta",
      autoClose: 3000,
    }).then(() => play());
  } else if (st.fs) {
    st.fs = null;
    save(`slot:${id}:fs`, null);
    renderControls();
  }
}
