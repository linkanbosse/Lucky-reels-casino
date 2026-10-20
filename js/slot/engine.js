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
//   holdWin            – { coin, trigger, respins, landChance, jackpots } Hold & Win-bonus

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

export function playRound(config, { bet, free = false, rnd = cryptoRandom }) {
  prepare(config);
  const initial = randomGrid(config, rnd, free);
  const { grid: startGrid, expanded } = expandWilds(config, initial);
  const steps = [];
  let grid = startGrid;
  let total = 0;

  const evalGrid = (g) => (config.mode === "cluster" ? evaluateClusters(config, g, bet) : evaluateLines(config, g, bet));

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
    const multiplier = free && config.freeSpinMultiplier ? config.freeSpinMultiplier : 1;
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
    const freeSpins = topKey(table, count);
    if (count > 0) {
      scatter = { count, positions, amount: pay * bet, freeSpins };
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

  return { initial, expanded, steps, finalGrid, bombs, scatter, jackpot, holdWin, total: Math.floor(total + 1e-9) };
}

/* ---------- Hold & Win ---------- */

/** Värdet av ett mynt i mynt (insats × multipel, eller jackpottens multipel). */
export function coinWorth(config, cell, bet) {
  const v = cellValue(cell);
  if (typeof v === "number") return v * bet;
  return (config.holdWin.jackpots[v] ?? 0) * bet;
}

export function playHoldWin(config, grid, bet, rnd = cryptoRandom) {
  const hw = config.holdWin;
  const size = config.reels * config.rows;
  const board = grid.map((col) => col.map((c) => (baseId(c) === hw.coin ? c : null)));
  let held = board.flat().filter(Boolean).length;
  let left = hw.respins;
  const respins = [];

  while (left > 0 && held < size) {
    const landed = [];
    for (let r = 0; r < config.reels; r++) {
      for (let row = 0; row < config.rows; row++) {
        if (board[r][row]) continue;
        if (rnd() < hw.landChance) {
          const cell = `${hw.coin}:${pick(config._values[hw.coin], rnd)}`;
          board[r][row] = cell;
          landed.push({ r, row, cell });
        }
      }
    }
    held += landed.length;
    left = landed.length ? hw.respins : left - 1;
    respins.push({ landed, left });
  }

  const full = held === size;
  let total = board.flat().reduce((s, c) => s + (c ? coinWorth(config, c, bet) : 0), 0);
  if (full) total += hw.jackpots.grand * bet;
  return { start: grid.map((col) => col.map((c) => (baseId(c) === hw.coin ? c : null))), respins, board, full, total };
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
