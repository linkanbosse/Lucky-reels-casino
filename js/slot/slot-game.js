// Lucky Reels – gemensam spelsida för alla slots.
//
// Ett spel behöver bara en konfiguration (js/slot/games/<id>.js) och en
// HTML-sida som anropar mountSlot(config). Allt gränssnitt byggs här.
//
// Motorn (engine.js) räknar ut hela rundan i förväg. Den här filen spelar upp
// den: hjulsnurr → vinster per steg (kaskader) → bomber → scatter → bonusar.

import { prepare, playRound, drawCell, baseId, cellValue, coinWorth } from "./engine.js";
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
  star: "Stjärna", clover: "Klöver", moon: "Måne", bomb: "Bomb", coin: "Guldmynt", ankh: "Ankh", eye: "Horus öga",
  scarab: "Skarabé", pyramid: "Pyramid",
};

const JACKPOT_NAMES = { mini: "MINI", minor: "MINOR", major: "MAJOR", grand: "GRAND" };

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
  const hw = config.holdWin;

  /* ---------- Tillstånd ---------- */
  const savedBet = load(`slot:${id}:bet`, 0);
  const st = {
    bet: config.bets.includes(savedBet) ? savedBet : config.bets[Math.min(1, config.bets.length - 1)],
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
  const currentBet = () => (st.fs ? st.fs.bet : st.bet);

  /* ---------- DOM ---------- */
  document.title = `${config.name} – Lucky Reels`;
  document.body.className = "slot-page";
  document.body.style.setProperty("--g-from", config.theme.from);
  document.body.style.setProperty("--g-to", config.theme.to);
  document.body.style.setProperty("--g-glow", config.theme.glow);

  const cols = Array.from({ length: config.reels }, (_, r) => `<div class="reel-col" data-reel="${r}"><div class="strip"></div></div>`).join("");

  const marquee = [];
  if (config.jackpot) {
    marquee.push(`<div class="jackpot"><span class="jackpot__label">JACKPOTT</span>${coinSvg("icon")}<span class="jackpot__value" data-jackpot></span></div>`);
  }
  if (hw) {
    marquee.push(
      `<div class="jp-ladder">${Object.keys(hw.jackpots)
        .map((k) => `<div class="jp jp--${k}"><span>${JACKPOT_NAMES[k]}</span><b data-jp="${k}"></b></div>`)
        .join("")}</div>`,
    );
  }
  if (config.cascade?.multipliers?.length > 1) marquee.push(`<div class="mult-ladder" data-ladder></div>`);
  marquee.push(`<span class="fs-banner">${icons.spark}<span data-fs-text></span></span>`);

  document.body.innerHTML = `
    <header class="slot-top">
      <a class="btn btn--ghost btn--icon" href="../../" aria-label="Tillbaka till lobbyn">${icons.back}</a>
      <h1 class="slot-top__title text-gold">${config.name}</h1>
      <div class="balance" title="Ditt saldo">${coinSvg("balance__coin")}<span data-balance></span></div>
    </header>
    <main class="slot">
      <div class="slot__marquee">${marquee.join("")}</div>
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
    cellW = Math.max(40, Math.floor(Math.min(byW, byH, config.reels <= 3 ? 140 : 124)));
    cellH = Math.max(40, Math.floor(Math.min(byH, cellW * 1.3)));
    document.body.style.setProperty("--cell-w", `${cellW}px`);
    document.body.style.setProperty("--cell-h", `${cellH}px`);
    paylinesEl.setAttribute("viewBox", `0 0 ${config.reels * cellW + (config.reels - 1) * GAP} ${config.rows * cellH}`);
  }
  addEventListener("resize", layout);
  layout();

  /* ---------- Rendering ---------- */
  function labelFor(cell) {
    const v = cellValue(cell);
    if (v === null) return "";
    const base = baseId(cell);
    if (config.bombs && base === config.bombs.id) return `×${v}`;
    if (hw && base === hw.coin) return typeof v === "number" ? formatCoins(v * currentBet()) : JACKPOT_NAMES[v] ?? v;
    return String(v);
  }

  function cellHtml(cell, r, row) {
    const label = labelFor(cell);
    const jp = hw && baseId(cell) === hw.coin && typeof cellValue(cell) === "string" ? ` cell__label--${cellValue(cell)}` : "";
    return `<div class="cell"${r !== undefined ? ` data-pos="${r}-${row}"` : ""} data-sym="${baseId(cell)}">${symbolSvg(baseId(cell))}${
      label ? `<span class="cell__label${jp}">${label}</span>` : ""
    }</div>`;
  }

  function renderGrid(grid) {
    strips.forEach((strip, r) => {
      strip.innerHTML = grid[r].map((s, row) => cellHtml(s, r, row)).join("");
      strip.style.transform = "";
    });
  }

  const cellEl = (r, row) => reelsEl.querySelector(`[data-pos="${r}-${row}"]`);

  function renderBalance() {
    document.querySelectorAll("[data-balance]").forEach((el) => (el.textContent = formatCoins(wallet.balance)));
  }

  function renderBet() {
    $("[data-bet-amount]").textContent = formatCoins(currentBet());
    const i = config.bets.indexOf(st.bet);
    const locked = st.spinning || st.auto > 0 || !!st.fs;
    $('[data-bet="-1"]').disabled = locked || i <= 0;
    $('[data-bet="1"]').disabled = locked || i >= config.bets.length - 1;
    if (hw) {
      for (const [k, mult] of Object.entries(hw.jackpots)) $(`[data-jp="${k}"]`).textContent = formatCoins(mult * currentBet());
    }
  }

  function renderJackpot() {
    const el = $("[data-jackpot]");
    if (el) el.textContent = formatCoins(st.jackpot);
  }

  function renderLadder(active = -1) {
    const el = $("[data-ladder]");
    if (!el) return;
    const mults = (st.fs && config.cascade.freeMultipliers) || config.cascade.multipliers;
    el.innerHTML = mults.map((m, i) => `<span class="${i === active ? "is-active" : i < active ? "is-done" : ""}">×${m}</span>`).join("");
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

  function drawLines(wins) {
    paylinesEl.innerHTML = wins
      .filter((w) => w.line !== undefined)
      .map((w) => {
        const c = LINE_COLORS[w.line % LINE_COLORS.length];
        return `<polyline points="${linePoints(w.line)}" stroke="${c}" color="${c}"/>`;
      })
      .join("");
  }

  function markCells(positions) {
    reelsEl.querySelectorAll(".is-win").forEach((c) => c.classList.remove("is-win"));
    for (const [r, row] of positions) cellEl(r, row)?.classList.add("is-win");
    reelsEl.classList.toggle("has-win", positions.length > 0);
  }

  function describeWin(w, multiplier = 1) {
    const name = SYMBOL_NAMES[w.symbol] ?? w.symbol;
    const where = w.cluster ? `Kluster ${w.count}× ${name}` : `Linje ${w.line + 1} · ${w.count}× ${name}`;
    const extra = w.wildBoost ? ` · WILD ×${config.wildMultiplier}` : "";
    const mult = multiplier > 1 ? ` · ×${multiplier}` : "";
    return `${where}${extra}${mult} · ${formatCoins(w.amount * multiplier)}`;
  }

  function countUp(el, from, to, ms) {
    return new Promise((resolve) => {
      if (ms <= 0 || to === from) {
        el.textContent = formatCoins(to);
        return resolve();
      }
      const start = performance.now();
      let lastTick = 0;
      const step = (now) => {
        const t = Math.min(1, (now - start) / ms);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = formatCoins(from + (to - from) * eased);
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
      if (amount !== null) countUp($("[data-amount]", el), 0, amount, Math.min(2500, autoClose - 1200));
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

  /* ---------- Hjulanimation ---------- */
  function animateReels(grid, free) {
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
      const symbols = [...grid[r], ...Array.from({ length: fillers }, () => drawCell(config, r, Math.random, free)), ...current];
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
            const special = s === scatterId || (hw && baseId(s) === hw.coin) || (config.bombs && baseId(s) === config.bombs.id);
            if (special) {
              if (s === scatterId) scattersLanded++;
              sfx.scatter(Math.min(4, scattersLanded));
              cellEl(r, row)?.classList.add("is-scatter");
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

  async function showExpandedWilds(round) {
    if (!round.expanded.length) return;
    for (const r of round.expanded) {
      strips[r].innerHTML = round.steps[0].grid[r].map((s, row) => cellHtml(s, r, row)).join("");
      strips[r].querySelectorAll(".cell").forEach((c) => c.classList.add("is-expanding"));
      sfx.scatter(2);
      await wait(st.turbo ? 120 : 320);
    }
    msgEl.textContent = round.expanded.length > 1 ? `${round.expanded.length} expanderande wilds!` : "Expanderande wild!";
    await wait(st.turbo ? 150 : 400);
  }

  // Vinnande symboler sprängs, resten faller ner och nya ramlar in ovanifrån
  async function playTumble(step) {
    for (const [r, row] of step.removed) cellEl(r, row)?.classList.add("is-popping");
    sfx.coin();
    await wait(st.turbo ? 180 : 380);
    const dur = st.turbo ? 220 : 420;
    const anims = [];
    strips.forEach((strip, r) => {
      const moves = step.moves[r];
      if (moves.every((from, row) => from === row)) return;
      strip.innerHTML = step.next[r].map((s, row) => cellHtml(s, r, row)).join("");
      [...strip.children].forEach((el, row) => {
        const from = moves[row];
        if (from === row) return;
        anims.push(
          el.animate(
            [{ transform: `translateY(${(from - row) * cellH}px)` }, { transform: "translateY(0)" }],
            { duration: dur + (row - from) * 25, easing: "cubic-bezier(.5,0,.75,1.25)", fill: "backwards" },
          ).finished,
        );
      });
    });
    await Promise.all(anims);
    sfx.reelStop(2);
  }

  async function presentRound(round, bet, free) {
    let running = 0;
    const cascade = !!config.cascade;
    let lastWins = [];

    for (let i = 0; i < round.steps.length; i++) {
      const step = round.steps[i];
      if (cascade) renderLadder(step.wins.length ? i : -1);
      if (!step.wins.length) break;

      markCells(step.wins.flatMap((w) => w.positions));
      drawLines(step.wins);
      lastWins = step.wins;
      msgEl.textContent =
        step.wins.length === 1
          ? describeWin(step.wins[0], step.multiplier)
          : `${step.wins.length} vinster${step.multiplier > 1 ? ` · ×${step.multiplier}` : ""}`;
      winEl.classList.add("is-active");
      sfx.win(Math.min(4, 1 + i));
      const before = running;
      running += step.stepWin;
      await countUp(winEl, before, running, st.turbo ? 200 : cascade ? 600 : Math.min(1800, 400 + (step.stepWin / bet) * 150));

      if (step.removed) {
        await wait(st.turbo ? 150 : 350);
        clearWin();
        await playTumble(step);
        if (i + 1 < round.steps.length && round.steps[i + 1].wins.length) {
          msgEl.textContent = "Kaskad!";
        }
      }
    }

    // Bomber multiplicerar hela rundans vinst
    if (round.bombs?.applied && round.bombs.multiplier > 0) {
      markCells(round.bombs.positions);
      round.bombs.positions.forEach(([r, row]) => cellEl(r, row)?.classList.add("is-scatter"));
      msgEl.textContent = `Bomber ×${round.bombs.multiplier}!`;
      sfx.feature();
      await wait(st.turbo ? 300 : 700);
      const before = running;
      running *= round.bombs.multiplier;
      await countUp(winEl, before, running, st.turbo ? 300 : 1000);
    }

    // Scatter
    const sc = round.scatter;
    if (sc && (sc.amount > 0 || sc.freeSpins > 0)) {
      markCells(sc.positions);
      sc.positions.forEach(([r, row]) => cellEl(r, row)?.classList.add("is-scatter"));
      if (sc.amount > 0) {
        msgEl.textContent = `${sc.count}× ${SYMBOL_NAMES[config.scatter.id]} · ${formatCoins(sc.amount)}`;
        const before = running;
        running += sc.amount;
        await countUp(winEl, before, running, st.turbo ? 200 : 600);
      }
    }

    const baseTotal = round.total - (round.holdWin?.total ?? 0);
    if (baseTotal > 0) {
      winEl.textContent = formatCoins(baseTotal);
      winEl.classList.add("is-active");
      wallet.credit(baseTotal, "win");
      if (navigator.vibrate && st.sound) navigator.vibrate(baseTotal >= bet * BIG_WIN ? [60, 40, 120] : 25);
    } else if (!sc?.freeSpins && !round.holdWin) {
      winEl.innerHTML = "&nbsp;";
      msgEl.textContent = free ? "Ingen vinst – nästa free spin" : "";
    }

    const ratio = baseTotal / bet;
    if (ratio >= BIG_WIN) {
      sfx.bigWin();
      const tier = ratio >= 100 ? ["EPISK", 3] : ratio >= 40 ? ["MEGA", 2] : ["STOR", 1];
      await showOverlay({ kicker: tier[0], title: "VINST", amount: baseTotal, autoClose: st.turbo ? 3000 : 4500, shower: tier[1] });
      if (st.auto > 0) {
        st.auto = 0;
        toast("Autospel stoppat efter storvinst", { icon: icons.spark });
      }
    }

    // Klassiska spel: visa linjerna en i taget tills nästa snurr
    if (!cascade && lastWins.length > 1) {
      let i = 0;
      st.lineCycle = setInterval(() => {
        const w = lastWins[i % lastWins.length];
        drawLines([w]);
        markCells(w.positions);
        msgEl.textContent = describeWin(w, round.steps[0].multiplier);
        i++;
      }, 1400);
    }
  }

  /* ---------- Hold & Win ---------- */
  async function runHoldWin(round, bet) {
    const h = round.holdWin;
    const coinsAtStart = h.start.flat().filter(Boolean).length;
    sfx.feature();
    await showOverlay({
      kicker: `${coinsAtStart} GULDMYNT`,
      title: "HOLD & WIN",
      hint: `Mynten låses · ${hw.respins} respins · nya mynt återställer räknaren`,
      autoClose: 3200,
      shower: 1,
    });

    clearWin();
    document.body.classList.add("in-hold-win");
    const banner = $("[data-fs-text]");
    const board = h.start.map((col) => col.slice());
    const paint = () =>
      strips.forEach((strip, r) => {
        strip.innerHTML = board[r]
          .map((c, row) => (c ? cellHtml(c, r, row).replace('class="cell"', 'class="cell is-held"') : `<div class="cell cell--empty" data-pos="${r}-${row}"></div>`))
          .join("");
      });
    paint();
    banner.textContent = `RESPINS ${hw.respins}`;
    msgEl.textContent = "Landa fler mynt!";
    winEl.innerHTML = "&nbsp;";
    await wait(600);

    for (const spin of h.respins) {
      reelsEl.querySelectorAll(".cell--empty").forEach((c) => c.classList.add("is-respinning"));
      sfx.spin();
      await wait(st.turbo ? 300 : 750);
      reelsEl.querySelectorAll(".is-respinning").forEach((c) => c.classList.remove("is-respinning"));
      for (const { r, row, cell } of spin.landed) {
        board[r][row] = cell;
        const el = cellEl(r, row);
        el.outerHTML = cellHtml(cell, r, row).replace('class="cell"', 'class="cell is-held is-scatter"');
        sfx.scatter(3);
        await wait(st.turbo ? 80 : 200);
      }
      banner.textContent = `RESPINS ${spin.left}`;
      if (spin.landed.length) msgEl.textContent = `+${spin.landed.length} mynt – respins återställda!`;
      await wait(st.turbo ? 200 : 450);
    }

    // Räkna ihop mynten ett i taget
    msgEl.textContent = h.full ? "Hela brädet fyllt – GRAND JACKPOTT!" : "Mynten räknas…";
    let running = 0;
    winEl.classList.add("is-active");
    for (let r = 0; r < config.reels; r++) {
      for (let row = 0; row < config.rows; row++) {
        const c = board[r][row];
        if (!c) continue;
        const worth = coinWorth(config, c, bet);
        const el = cellEl(r, row);
        el?.classList.add("is-win");
        sfx.coin();
        const before = running;
        running += worth;
        await countUp(winEl, before, running, st.turbo ? 60 : 160);
        el?.classList.remove("is-win");
      }
    }
    if (h.full) {
      const before = running;
      running += hw.jackpots.grand * bet;
      await countUp(winEl, before, running, 800);
    }

    wallet.credit(h.total, "win");
    document.body.classList.remove("in-hold-win");
    renderControls();
    await showOverlay({
      kicker: h.full ? "GRAND JACKPOTT" : "HOLD & WIN",
      title: "TOTALVINST",
      amount: h.total,
      autoClose: 4500,
      shower: h.total >= bet * 40 ? 3 : 2,
    });
    renderGrid(round.finalGrid);
    st.grid = round.finalGrid;
    if (st.auto > 0) st.auto = 0;
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

    const free = !!st.fs && st.fs.left > 0;
    const bet = free ? st.fs.bet : st.bet;

    if (!free) {
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
    msgEl.textContent = free ? "Free spin…" : "Lycka till!";
    if (free) {
      st.fs.left--;
      save(`slot:${id}:fs`, st.fs);
    }
    renderControls();
    if (config.cascade) renderLadder(-1);
    sfx.click();

    const round = playRound(config, { bet, free });
    await animateReels(round.initial, free);
    st.grid = round.initial;
    await showExpandedWilds(round);
    await presentRound(round, bet, free);
    st.grid = round.finalGrid;

    if (round.holdWin) await runHoldWin(round, bet);

    // Jackpott
    if (round.jackpot && config.jackpot) {
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
    if (free) st.fs.win += round.total;
    const awarded = round.scatter?.freeSpins ?? 0;
    if (awarded > 0) {
      sfx.feature();
      const mult = config.freeSpinMultiplier ?? 1;
      if (free) {
        st.fs.left += awarded;
        st.fs.total += awarded;
        await showOverlay({ kicker: "RETRIGGER", title: `+${awarded} FREE SPINS`, autoClose: 2500 });
      } else {
        st.fs = { left: awarded, total: awarded, win: 0, bet };
        st.auto = 0;
        const extra = mult > 1 ? `Alla vinster ×${mult}` : config.feature ?? "";
        await showOverlay({
          kicker: `${round.scatter.count} SCATTER`,
          title: `${awarded} FREE SPINS`,
          hint: `${extra ? `${extra} · ` : ""}tryck för att starta`,
          autoClose: 3500,
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
      if (config.cascade) renderLadder(-1);
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
      if (st.auto > 0) st.timers.push(setTimeout(play, st.turbo ? 200 : 500));
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
        <p>Stoppar automatiskt vid bonusar, storvinst eller om saldot tar slut. Tryck på knappen igen för att stoppa.</p>
        ${[10, 25, 50, 100, 250].map((n) => `<button class="btn btn--ghost" type="button" data-n="${n}">${n}</button>`).join("")}
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
    const bet = currentBet();
    const cluster = config.mode === "cluster";
    const unit = cluster ? bet : bet / config.lines.length;
    const special = new Set([config.wild, config.scatter?.id, config.bombs?.id, hw?.coin].filter(Boolean));
    const regular = Object.entries(config.symbols)
      .filter(([sym, s]) => !special.has(sym) && s.pays && Object.keys(s.pays).length)
      .sort((a, b) => Math.max(...Object.values(b[1].pays)) - Math.max(...Object.values(a[1].pays)));

    const pays = (p) => {
      const keys = Object.keys(p).map(Number).sort((a, b) => b - a);
      return keys
        .map((n, i) => {
          const label = cluster ? (i === 0 ? `${n}+` : n === keys[i - 1] - 1 ? `${n}` : `${n}–${keys[i - 1] - 1}`) : `${n}×`;
          return `<li><b>${label}</b> ${formatCoins(p[n] * unit)}</li>`;
        })
        .join("");
    };

    const specials = [];
    if (config.wild) {
      const wp = config.symbols[config.wild].pays ?? {};
      const parts = ["Ersätter alla vanliga symboler."];
      if (config.wildMultiplier) parts.push(`Vinster med WILD multipliceras ×${config.wildMultiplier}.`);
      if (config.expandingWild) parts.push(`Expanderar och täcker hela hjulet på hjul ${config.expandingWild.reels.map((r) => r + 1).join(", ")}.`);
      if (Object.keys(wp).length) parts.push(`Egen vinst: ${Object.entries(wp).sort((a, b) => b[0] - a[0]).map(([n, x]) => `${n}× = ${formatCoins(x * unit)}`).join(", ")}.`);
      if (config.jackpot) parts.push(`${config.jackpot.count} eller fler var som helst vinner jackpotten. Maxinsats ger hela potten, lägre insats en andel.`);
      specials.push(`<div class="special">${symbolSvg(config.wild)}<p><strong>${SYMBOL_NAMES[config.wild]} är WILD.</strong> ${parts.join(" ")}</p></div>`);
    }
    if (config.scatter) {
      const s = config.scatter;
      const fs = Object.entries(s.freeSpins ?? {}).map(([n, x]) => `${n} ger ${x}`).join(", ");
      const sp = Object.entries(s.pays ?? {}).map(([n, x]) => `${n}× = ${formatCoins(x * bet)}`).join(", ");
      const more = [];
      if (config.freeSpinMultiplier > 1) more.push(`Alla vinster under free spins ×${config.freeSpinMultiplier}.`);
      if (config.cascade?.freeMultipliers) more.push(`Kaskadmultiplikatorn börjar på ×${config.cascade.freeMultipliers[0]} under free spins.`);
      if (config.bombs) more.push("Under free spins kan bomber landa.");
      specials.push(
        `<div class="special">${symbolSvg(s.id)}<p><strong>${SYMBOL_NAMES[s.id]} är SCATTER</strong> och räknas var som helst. ${sp ? `Vinst: ${sp}. ` : ""}Free spins: ${fs}.${
          s.retrigger ? ` Under free spins ger ${Object.entries(s.retrigger).map(([n, x]) => `${n} st +${x}`).join(", ")}.` : " Kan återaktiveras."
        } ${more.join(" ")}</p></div>`,
      );
    }
    if (config.bombs) {
      const vals = Object.keys(config.symbols[config.bombs.id].values).map(Number).sort((a, b) => a - b);
      specials.push(
        `<div class="special">${symbolSvg(config.bombs.id)}<p><strong>Bomber</strong> har en multiplikator på ×${vals[0]}–×${vals[vals.length - 1]}. När kaskaderna är klara läggs alla bomber ihop och multiplicerar rundans vinst, om rundan gav vinst.</p></div>`,
      );
    }
    if (hw) {
      const jp = Object.entries(hw.jackpots).map(([k, m]) => `${JACKPOT_NAMES[k]} ${formatCoins(m * bet)}`).join(", ");
      specials.push(
        `<div class="special">${symbolSvg(hw.coin)}<p><strong>Hold & Win:</strong> ${hw.trigger} eller fler guldmynt startar bonusen. Mynten låses och du får ${hw.respins} respins. Varje nytt mynt låses och återställer räknaren. Alla mynt betalas ut på slutet, och fylls hela brädet vinner du GRAND. Jackpottar: ${jp}.</p></div>`,
      );
    }
    if (config.cascade) {
      specials.push(
        `<div class="special">${icons.spark}<p><strong>Kaskader:</strong> vinnande symboler försvinner och nya faller ner. Varje kaskad i rad höjer multiplikatorn: ${config.cascade.multipliers.map((m) => `×${m}`).join(" → ")}${
          config.cascade.freeMultipliers ? `. Under free spins: ${config.cascade.freeMultipliers.map((m) => `×${m}`).join(" → ")}` : ""
        }.</p></div>`,
      );
    }

    const rules = cluster
      ? `Vinster ges för kluster om minst ${config.cluster.min} lika symboler som sitter ihop vågrätt eller lodrätt. Siffran till vänster är klustrets storlek.`
      : "Linjevinster räknas från vänster hjul, bara högsta vinsten per linje betalas.";

    openModal(
      `<div class="paytable">
        <h2>${config.name}</h2>
        <p>${config.tagline}</p>
        <p>Vinsterna nedan gäller din insats på <strong>${formatCoins(bet)}</strong> mynt. ${rules}</p>
        ${specials.length ? `<h3>Specialfunktioner</h3>${specials.join("")}` : ""}
        <h3>Symboler</h3>
        <div class="pay-grid">
          ${regular.map(([sym, s]) => `<div class="pay-item">${symbolSvg(sym)}<ul>${pays(s.pays)}</ul></div>`).join("")}
        </div>
        ${
          cluster
            ? ""
            : `<h3>${config.lines.length} vinstlinjer</h3>
        <div class="line-grid">${config.lines.map((l, i) => `<div class="line-mini">${lineMini(l)}${i + 1}</div>`).join("")}</div>`
        }
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
      if (hw && st.grid && !st.spinning) renderGrid(st.grid); // myntens värden följer insatsen
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
    if (e.target.closest?.("button, a, input")) return;
    if (document.querySelector(".modal.is-open")) return;
    e.preventDefault();
    if (st.overlay) st.overlay.click();
    else play();
  });

  wallet.onError((text) => toast(text, { icon: icons.info, duration: 4000 }));

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
    Array.from({ length: config.rows }, () => drawCell(config, r, Math.random)),
  );
  st.grid = startGrid;
  renderGrid(startGrid);
  renderBalance();
  renderJackpot();
  renderControls();
  if (config.cascade) renderLadder(-1);
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
