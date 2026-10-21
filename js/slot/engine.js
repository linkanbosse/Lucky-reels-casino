// Lucky Reels – slotmotorns matematik.
//
// Ren logik utan DOM, så att samma kod används både i webbläsaren och i
// simuleringsskriptet (tools/simulate.mjs) som räknar fram återbetalningen (RTP).
//
// En spelrunda (playRound) returnerar en lista med steg som gränssnittet spelar upp:
// klassiska spel har ett steg, kaskadspel ett steg per kaskad.
//
// Konfiguration (alla fält utom de fyra första är valfria):
//   reels, rows        – rutnätets storlek
//   symbols            – { id: { pays, noLine, values } }
//                         pays: { antal: multipel }. Linjespel: av linjeinsatsen.
//                               Klusterspel: av total insats, nyckeln är minsta klusterstorlek.
//                         noLine: symbolen ingår aldrig i linjer/kluster (scatter, mynt, bomber)
//                         values: viktade värden som slumpas per ruta, t.ex. bombens multiplikator
//   weights            – en vikttabell per hjul: { symbolId: vikt }
//   freeWeights        – andra vikttabeller under free spins
//   mode               – "lines" (standard) eller "cluster"
//   lines              – vinstlinjer (linjespel), ett radindex per hjul
//   cluster            – { min } minsta klusterstorlek (klusterspel)
//   cascade            – { multipliers, freeMultipliers } vinnande symboler försvinner,
//                         nya faller ner och multiplikatorn stiger för varje kaskad
//   wild, wildMultiplier, expandingWild { reels }
//   scatter            – { id, pays, freeSpins, retrigger }
//   freeSpinMultiplier – multiplikator på alla vinster under free spins (klassiska spel)
//   bombs              – { id } bombernas värden summeras och multiplicerar rundans vinst
//   jackpot            – { symbol, count } minst `count` sådana var som helst vinner jackpotten
//   holdWin            – { coin, trigger, respins, landChance, jackpots, specials, fullBonus } Hold & Win-bonus
//                         specials: { collector, payer, sniper, pcollector, ppayer } chans per landad ruta
//   ways               – { divisor } "ways"-spel: vinst för lika symboler på intilliggande hjul från vänster,
//                         pays är multipel av insats/divisor per väg
//   mystery            – { id, reveal } mysterieboxar (värde = antal kopior, xWays) som alla avslöjar samma symbol
//   explodingWild      – { pattern } nylandade wilds spränger grannrutor till wilds
//   bonus              – { levels, byScatter } bonusnivåer: fler scatters ger bättre free spins.
//                         En nivå: { name, desc, spins, sticky, wildMult, startMultiplier, multiplierPerMystery }
//   bonusBuy           – [{ label, price, level | coins }] köp bonusen direkt för price × insatsen
//   maxWin             – högsta vinst per runda i × insatsen (standard 10 000, samma gräns som servern)

const DEFAULT_MAX_WIN = 10_000;

/** Kryptografiskt slumptal i [0, 1). Faller tillbaka på Math.random. */
export function cryptoRandom() {
  const c = globalThis.crypto;
  if (c?.getRandomValues) {
    const buf = new Uint32Array(1);
    c.getRandomValues(buf);
    return buf[0] / 4294967296;
  }
  return Math.random();
}

/** Symbolens grund-id. Rutor med värde lagras som "bomb:5" eller "coin:mini". */
export const baseId = (cell) => {
  const i = cell.indexOf(":");
  return i < 0 ? cell : cell.slice(0, i);
};

/** Värdet i en ruta, t.ex. 5 för "bomb:5", "mini" för "coin:mini", annars null. */
export const cellValue = (cell) => {
  const i = cell.indexOf(":");
  if (i < 0) return null;
  const v = cell.slice(i + 1);
  return /^\d+(\.\d+)?$/.test(v) ? Number(v) : v;
};

/** Hur många symboler rutan räknas som i ways-spel ("king:x3" = 3). */
export const cellCount = (cell) => {
  const v = cellValue(cell);
  return typeof v === "string" && /^x\d+$/.test(v) ? Number(v.slice(1)) : 1;
};

/** Rutans egen multiplikator ("wild:m3" = ×3). */
export const cellMult = (cell) => {
  const v = cellValue(cell);
  return typeof v === "string" && /^m\d+$/.test(v) ? Number(v.slice(1)) : 1;
};

function buildTable(entries) {
  const list = entries.filter(([, w]) => w > 0);
  const total = list.reduce((sum, [, w]) => sum + w, 0);
  let acc = 0;
  return { total, cumulative: list.map(([v, w]) => [v, (acc += w)]) };
}

function pick(table, rnd) {
  const x = rnd() * table.total;
  for (const [v, upto] of table.cumulative) if (x < upto) return v;
  return table.cumulative[table.cumulative.length - 1][0];
}

/** Förbereder vikttabellerna för snabb dragning. Anropas en gång per spel. */
export function prepare(config) {
  if (config._prepared) return config;
  config.mode ??= "lines";
  const check = (weights) =>
    weights.forEach((table, r) => {
      for (const id of Object.keys(table)) {
        if (!config.symbols[id]) throw new Error(`${config.id}: okänd symbol "${id}" på hjul ${r + 1}`);
      }
    });
  check(config.weights);
  if (config.weights.length !== config.reels) throw new Error(`${config.id}: fel antal vikttabeller`);
  config._tables = config.weights.map((t) => buildTable(Object.entries(t)));
  if (config.freeWeights) {
    check(config.freeWeights);
    config._freeTables = config.freeWeights.map((t) => buildTable(Object.entries(t)));
  }
  config._values = {};
  for (const [id, s] of Object.entries(config.symbols)) {
    if (s.values) config._values[id] = buildTable(Object.entries(s.values));
  }
  if (config.mystery) config._reveal = buildTable(Object.entries(config.mystery.reveal));
  if (config.holdWin?.specials) config._specials = Object.entries(config.holdWin.specials);
  if (config.mode === "lines" && config.lines.some((l) => l.length !== config.reels || l.some((row) => row < 0 || row >= config.rows))) {
    throw new Error(`${config.id}: felaktig vinstlinje`);
  }
  config._prepared = true;
  return config;
}

/** Drar en symbol (med eventuellt värde) för ett hjul. */
export function drawCell(config, r, rnd = cryptoRandom, free = false) {
  const tables = free && config._freeTables ? config._freeTables : config._tables;
  const id = pick(tables[r], rnd);
  const values = config._values[id];
  return values ? `${id}:${pick(values, rnd)}` : id;
}

/** Slumpar fram ett rutnät: grid[hjul][rad]. */
export function randomGrid(config, rnd = cryptoRandom, free = false) {
  prepare(config);
  return Array.from({ length: config.reels }, (_, r) =>
    Array.from({ length: config.rows }, () => drawCell(config, r, rnd, free)),
  );
}

const isNoLine = (config, cell) => !!config.symbols[baseId(cell)]?.noLine;

// Högsta tröskeln som uppnåtts, t.ex. { 3: 10, 4: 15 } och 5 träffar → 15
function topKey(table, count) {
  if (!table) return 0;
  let value = 0;
  let best = -1;
  for (const [k, v] of Object.entries(table)) {
    const n = Number(k);
    if (count >= n && n > best) {
      best = n;
      value = v;
    }
  }
  return value;
}

/* ---------- Linjevinster ---------- */

export function evaluateLines(config, grid, bet) {
  const { wild } = config;
  const lineBet = bet / config.lines.length;
  const wins = [];

  config.lines.forEach((line, lineIndex) => {
    const syms = line.map((row, r) => grid[r][row]);

    let leadWilds = 0;
    while (wild && leadWilds < syms.length && syms[leadWilds] === wild) leadWilds++;

    let best = null;
    const base = syms.find((s) => s !== wild);
    if (base && !isNoLine(config, base)) {
      let n = 0;
      while (n < syms.length && (syms[n] === base || syms[n] === wild)) n++;
      const pay = config.symbols[base].pays?.[n] ?? 0;
      if (pay > 0) {
        const usesWild = syms.slice(0, n).includes(wild);
        const mult = usesWild && config.wildMultiplier ? config.wildMultiplier : 1;
        best = { symbol: base, count: n, pay: pay * mult, wildBoost: usesWild && mult > 1 };
      }
    }

    if (wild && leadWilds > 0) {
      const pay = config.symbols[wild].pays?.[leadWilds] ?? 0;
      if (pay > 0 && (!best || pay > best.pay)) best = { symbol: wild, count: leadWilds, pay, wildBoost: false };
    }

    if (!best) return;
    wins.push({
      line: lineIndex,
      symbol: best.symbol,
      count: best.count,
      wildBoost: best.wildBoost,
      amount: best.pay * lineBet,
      positions: line.slice(0, best.count).map((row, r) => [r, row]),
    });
  });
  return wins;
}

/* ---------- Klustervinster ---------- */

export function evaluateClusters(config, grid, bet) {
  const { reels, rows } = config;
  const min = config.cluster?.min ?? 5;
  const seen = Array.from({ length: reels }, () => new Array(rows).fill(false));
  const wins = [];

  for (let r = 0; r < reels; r++) {
    for (let row = 0; row < rows; row++) {
      if (seen[r][row]) continue;
      const sym = grid[r][row];
      seen[r][row] = true;
      if (isNoLine(config, sym)) continue;
      const positions = [[r, row]];
      for (let i = 0; i < positions.length; i++) {
        const [cr, crow] = positions[i];
        for (const [dr, drow] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nr = cr + dr;
          const nrow = crow + drow;
          if (nr < 0 || nr >= reels || nrow < 0 || nrow >= rows || seen[nr][nrow]) continue;
          if (grid[nr][nrow] !== sym) continue;
          seen[nr][nrow] = true;
          positions.push([nr, nrow]);
        }
      }
      if (positions.length < min) continue;
      const pay = topKey(config.symbols[sym].pays, positions.length);
      if (pay > 0) wins.push({ symbol: sym, count: positions.length, amount: pay * bet, positions, cluster: true });
    }
  }
  return wins;
}

/* ---------- Ways-vinster ---------- */

// Antal vägar = produkten av antalet träffar per hjul. Rutor med xN räknas som N symboler,
// och wilds med ×M multiplicerar vägarna de ingår i.
export function evaluateWays(config, grid, bet) {
  const { wild } = config;
  const unit = bet / (config.ways?.divisor ?? 20);
  const wins = [];
  for (const [sym, def] of Object.entries(config.symbols)) {
    if (sym === wild || def.noLine || !def.pays || !Object.keys(def.pays).length) continue;
    let ways = 1;
    let weight = 1;
    let reelsHit = 0;
    let onlyWild = true;
    const positions = [];
    for (let r = 0; r < config.reels; r++) {
      let count = 0;
      let w = 0;
      grid[r].forEach((cell, row) => {
        const b = baseId(cell);
        if (b !== sym && b !== wild) return;
        if (b === sym) onlyWild = false;
        const n = cellCount(cell);
        count += n;
        w += n * cellMult(cell);
        positions.push([r, row]);
      });
      if (!count) break;
      ways *= count;
      weight *= w;
      reelsHit++;
    }
    const pay = def.pays[reelsHit] ?? 0;
    if (!pay || onlyWild) continue;
    const used = positions.filter(([r]) => r < reelsHit);
    wins.push({ symbol: sym, count: reelsHit, ways, multiplier: weight / ways, amount: pay * unit * weight, positions: used, way: true });
  }
  return wins;
}

/** Antal vägar i rutnätet (för visning), med xWays-rutor inräknade. */
export function waysCount(grid) {
  return grid.reduce((p, col) => p * col.reduce((s, c) => s + cellCount(c), 0), 1);
}

/* ---------- Hjälpfunktioner ---------- */

function expandWilds(config, grid) {
  const expanded = [];
  if (!config.wild || !config.expandingWild) return { grid, expanded };
  const out = grid.map((col, r) => {
    if (config.expandingWild.reels.includes(r) && col.includes(config.wild)) {
      expanded.push(r);
      return col.map(() => config.wild);
    }
    return col;
  });
  return { grid: out, expanded };
}

function positionsOf(grid, test) {
  const out = [];
  grid.forEach((col, r) => col.forEach((cell, row) => test(cell) && out.push([r, row])));
  return out;
}

/** Tar bort rutor och låter resten falla ner. moves[r][nyRad] = gammal rad (negativ = ny symbol ovanifrån). */
export function tumble(config, grid, removed, rnd, free) {
  const gone = new Set(removed.map(([r, row]) => `${r}-${row}`));
  const moves = [];
  const next = grid.map((col, r) => {
    const survivors = [];
    col.forEach((cell, row) => {
      if (!gone.has(`${r}-${row}`)) survivors.push(row);
    });
    const k = col.length - survivors.length;
    const fresh = Array.from({ length: k }, () => drawCell(config, r, rnd, free));
    moves.push([...fresh.map((_, j) => j - k), ...survivors]);
    return [...fresh, ...survivors.map((row) => col[row])];
  });
  return { grid: next, moves };
}

/* ---------- En hel spelrunda ---------- */

export function playRound(config, { bet, free = false, rnd = cryptoRandom, state = null }) {
  prepare(config);
  const level = free && config.bonus && state ? config.bonus.levels[state.level] : null;
  const initial = randomGrid(config, rnd, free);

  // Klibbiga wilds från tidigare free spins ligger kvar
  const sticky = state?.sticky ?? {};
  for (const [key, cell] of Object.entries(sticky)) {
    const [r, row] = key.split("-").map(Number);
    initial[r][row] = cell;
  }

  const { grid: startGrid, expanded } = expandWilds(config, initial);
  let grid = startGrid;

  // Mysterieboxar (xWays): alla avslöjar samma symbol, en box räknas som flera symboler
  let mystery = null;
  if (config.mystery) {
    const positions = positionsOf(grid, (c) => baseId(c) === config.mystery.id);
    if (positions.length) {
      const symbol = pick(config._reveal, rnd);
      grid = grid.map((col) => col.slice());
      for (const [r, row] of positions) {
        const n = cellValue(grid[r][row]);
        grid[r][row] = typeof n === "number" && n > 1 ? `${symbol}:x${n}` : symbol;
      }
      mystery = { positions, symbol };
    }
  }

  // Exploderande wilds: nylandade wilds gör grannrutorna till wilds
  const explosions = [];
  const landedWilds = config.wild ? positionsOf(grid, (c) => baseId(c) === config.wild) : [];
  if (config.explodingWild && config.wild) {
    const pattern = config.explodingWild.pattern ?? [[0, -1], [0, 1], [-1, 0], [1, 0]];
    // Även klibbiga wilds exploderar igen varje snurr
    const fresh = landedWilds;
    if (fresh.length) {
      grid = grid.map((col) => col.slice());
      for (const [r, row] of fresh) {
        const cells = [];
        for (const [dr, drow] of pattern) {
          const nr = r + dr;
          const nrow = row + drow;
          if (nr < 0 || nr >= config.reels || nrow < 0 || nrow >= config.rows) continue;
          const c = grid[nr][nrow];
          if (baseId(c) === config.wild || isNoLine(config, c)) continue;
          grid[nr][nrow] = config.wild;
          cells.push([nr, nrow]);
        }
        explosions.push({ at: [r, row], cells });
      }
    }
  }

  // Bonusnivåns wild-multiplikator gäller alla wilds som saknar en egen
  if (level?.wildMult > 1) {
    grid = grid.map((col) => col.map((c) => (c === config.wild ? `${config.wild}:m${level.wildMult}` : c)));
  }

  // Tillstånd till nästa free spin
  let nextState = null;
  let multiplier = 1;
  if (level) {
    nextState = { ...state, sticky: { ...sticky } };
    if (level.sticky) {
      // Bara wilds som landat sitter fast – rutor som sprängts till wilds gäller en snurr
      for (const [r, row] of landedWilds) nextState.sticky[`${r}-${row}`] = grid[r][row];
    }
    if (level.multiplierPerMystery && mystery) nextState.multiplier += level.multiplierPerMystery * mystery.positions.length;
    multiplier = nextState.multiplier;
  } else if (free && config.freeSpinMultiplier) {
    multiplier = config.freeSpinMultiplier;
  }

  const steps = [];
  let total = 0;

  const evalGrid = (g) =>
    config.mode === "cluster" ? evaluateClusters(config, g, bet) : config.mode === "ways" ? evaluateWays(config, g, bet) : evaluateLines(config, g, bet);

  if (config.cascade) {
    const mults = (free && config.cascade.freeMultipliers) || config.cascade.multipliers || [1];
    for (let i = 0; i < 60; i++) {
      const wins = evalGrid(grid);
      const multiplier = mults[Math.min(i, mults.length - 1)];
      if (!wins.length) {
        steps.push({ grid, wins, multiplier, stepWin: 0 });
        break;
      }
      const removed = [];
      const seen = new Set();
      for (const w of wins)
        for (const p of w.positions) {
          const key = `${p[0]}-${p[1]}`;
          if (!seen.has(key)) {
            seen.add(key);
            removed.push(p);
          }
        }
      const raw = wins.reduce((s, w) => s + w.amount, 0);
      const t = tumble(config, grid, removed, rnd, free);
      steps.push({ grid, wins, multiplier, stepWin: raw * multiplier, removed, next: t.grid, moves: t.moves });
      total += raw * multiplier;
      grid = t.grid;
    }
  } else {
    const wins = evalGrid(grid);
    const raw = wins.reduce((s, w) => s + w.amount, 0);
    steps.push({ grid, wins, multiplier, stepWin: raw * multiplier });
    total += raw * multiplier;
  }

  const finalGrid = grid;

  // Bomber multiplicerar rundans vinst
  let bombs = null;
  if (config.bombs) {
    const positions = positionsOf(finalGrid, (c) => baseId(c) === config.bombs.id);
    if (positions.length) {
      const sum = positions.reduce((s, [r, row]) => s + (cellValue(finalGrid[r][row]) || 0), 0);
      bombs = { positions, multiplier: sum, applied: total > 0 };
      if (total > 0 && sum > 0) total *= sum;
    }
  }

  // Scatter
  let scatter = null;
  if (config.scatter) {
    const s = config.scatter;
    const positions = positionsOf(finalGrid, (c) => c === s.id);
    const count = positions.length;
    const pay = topKey(s.pays, count);
    const table = free && s.retrigger ? s.retrigger : s.freeSpins;
    let freeSpins = topKey(table, count);
    let bonusLevel = -1;
    if (config.bonus && !free) {
      for (const [n, lvl] of Object.entries(config.bonus.byScatter)) if (count >= Number(n)) bonusLevel = Math.max(bonusLevel, lvl);
      freeSpins = bonusLevel >= 0 ? config.bonus.levels[bonusLevel].spins : 0;
    }
    if (count > 0) {
      scatter = { count, positions, amount: pay * bet, freeSpins, level: bonusLevel };
      total += pay * bet;
    }
  }

  // Jackpott (antal symboler var som helst)
  let jackpot = false;
  if (config.jackpot) {
    const n = positionsOf(finalGrid, (c) => c === config.jackpot.symbol).length;
    jackpot = n >= config.jackpot.count;
  }

  // Hold & Win
  let holdWin = null;
  if (config.holdWin) {
    const coins = positionsOf(finalGrid, (c) => baseId(c) === config.holdWin.coin);
    if (coins.length >= config.holdWin.trigger) {
      holdWin = playHoldWin(config, finalGrid, bet, rnd);
      total += holdWin.total;
    }
  }

  const cap = (config.maxWin ?? DEFAULT_MAX_WIN) * bet;
  const capped = total > cap;
  if (capped) total = cap;

  return {
    initial, expanded, mystery, explosions, steps, finalGrid, bombs, scatter, jackpot, holdWin,
    state: nextState, multiplier, capped, total: Math.floor(total + 1e-9),
  };
}

/** Startläge för en bonusnivå (free spins). */
export function bonusState(config, level) {
  const l = config.bonus.levels[level];
  return { level, sticky: {}, multiplier: l.startMultiplier ?? 1 };
}

/* ---------- Hold & Win ---------- */

/** Värdet av ett mynt i mynt (insats × multipel, eller jackpottens multipel). */
export function coinWorth(config, cell, bet) {
  const v = cellValue(cell);
  if (typeof v === "number") return v * bet;
  return (config.holdWin.jackpots?.[v] ?? 0) * bet;
}

// Specialsymboler i Hold & Win (alla bär ett värde i × insatsen):
//   sniper     – dubblar 1–3 slumpvisa andra värden när den landar
//   payer      – lägger sitt värde på alla andra rutor när den landar
//   collector  – samlar ihop alla andra värden till sig själv när den landar
//   ppayer/pcollector – som payer/collector, men verkar efter varje respin resten av bonusen
export const HOLD_SPECIALS = ["sniper", "payer", "collector", "ppayer", "pcollector"];

export function playHoldWin(config, grid, bet, rnd = cryptoRandom) {
  const hw = config.holdWin;
  const size = config.reels * config.rows;
  const isStart = (c) => baseId(c) === hw.coin || HOLD_SPECIALS.includes(baseId(c));
  const board = grid.map((col) => col.map((c) => (isStart(c) ? c : null)));
  const start = board.map((col) => col.slice());
  let held = board.flat().filter(Boolean).length;
  let left = hw.respins;
  const respins = [];

  const num = (c) => (typeof cellValue(c) === "number" ? cellValue(c) : 0);
  const occupied = () => {
    const out = [];
    board.forEach((col, r) => col.forEach((c, row) => c && out.push([r, row])));
    return out;
  };
  const add = (r, row, v) => (board[r][row] = `${baseId(board[r][row])}:${num(board[r][row]) + v}`);
  const snapshot = () => board.map((col) => col.slice());

  function act(type, r, row, actions) {
    // Jackpottmynt (t.ex. "coin:mini") har inget siffervärde och påverkas inte av specialsymbolerna
    const others = occupied().filter(([cr, crow]) => (cr !== r || crow !== row) && typeof cellValue(board[cr][crow]) === "number");
    if (!others.length) return;
    if (type === "sniper") {
      const shots = Math.min(others.length, 1 + Math.floor(rnd() * 3));
      const targets = [];
      for (let i = 0; i < shots; i++) targets.push(others.splice(Math.floor(rnd() * others.length), 1)[0]);
      for (const [tr, trow] of targets) add(tr, trow, num(board[tr][trow]));
      actions.push({ type, at: [r, row], targets, board: snapshot() });
    } else if (type === "payer") {
      const amount = num(board[r][row]);
      for (const [tr, trow] of others) add(tr, trow, amount);
      actions.push({ type, at: [r, row], targets: others, amount, board: snapshot() });
    } else if (type === "collector") {
      const amount = others.reduce((sum, [tr, trow]) => sum + num(board[tr][trow]), 0);
      add(r, row, amount);
      actions.push({ type, at: [r, row], targets: others, amount, board: snapshot() });
    }
  }

  while (left > 0 && held < size) {
    const landed = [];
    for (let r = 0; r < config.reels; r++) {
      for (let row = 0; row < config.rows; row++) {
        if (board[r][row]) continue;
        if (rnd() >= hw.landChance) continue;
        let type = hw.coin;
        if (config._specials) {
          let x = rnd();
          for (const [t, p] of config._specials) {
            if (x < p) {
              type = t;
              break;
            }
            x -= p;
          }
        }
        const cell = `${type}:${pick(config._values[hw.coin], rnd)}`;
        board[r][row] = cell;
        landed.push({ r, row, cell });
      }
    }
    held += landed.length;
    left = landed.length ? hw.respins : left - 1;

    const actions = [];
    if (config._specials) {
      for (const type of ["sniper", "payer", "collector"]) {
        for (const l of landed) if (baseId(l.cell) === type) act(type, l.r, l.row, actions);
      }
      for (const [type, as] of [["ppayer", "payer"], ["pcollector", "collector"]]) {
        for (const [r, row] of occupied()) if (baseId(board[r][row]) === type) act(as, r, row, actions);
      }
    }
    respins.push({ landed, actions, left });
  }

  const full = held === size;
  let total = board.flat().reduce((s, c) => s + (c ? coinWorth(config, c, bet) : 0), 0);
  if (full) total += (hw.fullBonus ?? hw.jackpots?.grand ?? 0) * bet;
  total = Math.min(Math.floor(total + 1e-9), (config.maxWin ?? DEFAULT_MAX_WIN) * bet);
  return { start, respins, board, full, total };
}

/** Bonusköp för Hold & Win: ett rutnät med `coins` startmynt (+ ev. en specialsymbol), inga linjevinster, och hela bonusen. */
export function buyHoldWin(config, { bet, coins, extra = null, rnd = cryptoRandom }) {
  prepare(config);
  const hw = config.holdWin;
  const grid = Array.from({ length: config.reels }, (_, r) =>
    Array.from({ length: config.rows }, () => {
      let c;
      do c = drawCell(config, r, rnd);
      while (baseId(c) === hw.coin || c === config.wild || isNoLine(config, c));
      return c;
    }),
  );
  // Ingen linjevinst får uppstå av utfyllnaden: blanda hjulen tills inga vinster finns
  const evalGrid = (g) => (config.mode === "ways" ? evaluateWays(config, g, bet) : evaluateLines(config, g, bet));
  for (let tries = 0; tries < 50 && evalGrid(grid).length; tries++) {
    const r = Math.floor(rnd() * config.reels);
    grid[r] = grid[r].map(() => {
      let c;
      do c = drawCell(config, r, rnd);
      while (baseId(c) === hw.coin || c === config.wild || isNoLine(config, c));
      return c;
    });
  }
  const free = [];
  grid.forEach((col, r) => col.forEach((_, row) => free.push([r, row])));
  for (let i = 0; i < coins; i++) {
    const [r, row] = free.splice(Math.floor(rnd() * free.length), 1)[0];
    grid[r][row] = `${hw.coin}:${pick(config._values[hw.coin], rnd)}`;
  }
  if (extra) {
    const [r, row] = free.splice(Math.floor(rnd() * free.length), 1)[0];
    grid[r][row] = `${extra}:${pick(config._values[hw.coin], rnd)}`;
  }
  const holdWin = playHoldWin(config, grid, bet, rnd);
  return {
    initial: grid, expanded: [], mystery: null, explosions: [],
    steps: [{ grid, wins: [], multiplier: 1, stepWin: 0 }],
    finalGrid: grid, bombs: null, scatter: null, jackpot: false, holdWin,
    state: null, multiplier: 1, capped: false, total: holdWin.total,
  };
}

/** Delade vinstlinjer för 5×3-spel (de första 10, 20 eller 25 används). */
export const LINES_5x3 = [
  [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [1, 0, 1, 2, 1],
  [1, 2, 1, 0, 1], [0, 1, 1, 1, 0], [2, 1, 1, 1, 2], [0, 1, 0, 1, 0], [2, 1, 2, 1, 2],
  [1, 1, 0, 1, 1], [1, 1, 2, 1, 1], [0, 0, 2, 0, 0], [2, 2, 0, 2, 2], [0, 2, 0, 2, 0],
  [2, 0, 2, 0, 2], [1, 0, 2, 0, 1], [1, 2, 0, 2, 1], [0, 2, 2, 2, 0], [2, 0, 0, 0, 2],
];

/** 40 vinstlinjer för 5×4-spel. */
export const LINES_5x4 = [
  [0, 0, 0, 0, 0], [1, 1, 1, 1, 1], [2, 2, 2, 2, 2], [3, 3, 3, 3, 3],
  [0, 1, 2, 1, 0], [1, 2, 3, 2, 1], [3, 2, 1, 2, 3], [2, 1, 0, 1, 2],
  [0, 1, 0, 1, 0], [1, 0, 1, 0, 1], [2, 3, 2, 3, 2], [3, 2, 3, 2, 3],
  [1, 2, 1, 2, 1], [2, 1, 2, 1, 2], [0, 0, 1, 2, 3], [3, 3, 2, 1, 0],
  [0, 1, 1, 1, 0], [1, 2, 2, 2, 1], [2, 1, 1, 1, 2], [3, 2, 2, 2, 3],
  [1, 0, 0, 0, 1], [2, 3, 3, 3, 2], [0, 0, 1, 0, 0], [3, 3, 2, 3, 3],
  [1, 1, 0, 1, 1], [2, 2, 3, 2, 2], [1, 1, 2, 1, 1], [2, 2, 1, 2, 2],
  [0, 2, 0, 2, 0], [3, 1, 3, 1, 3], [0, 1, 2, 3, 3], [3, 2, 1, 0, 0],
  [1, 0, 1, 2, 1], [2, 3, 2, 1, 2], [0, 2, 2, 2, 0], [3, 1, 1, 1, 3],
  [1, 3, 1, 3, 1], [2, 0, 2, 0, 2], [0, 3, 0, 3, 0], [3, 0, 3, 0, 3],
];

export const LINES_3x3 = [
  [1, 1, 1], [0, 0, 0], [2, 2, 2], [0, 1, 2], [2, 1, 0],
];
