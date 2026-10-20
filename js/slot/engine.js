// Lucky Reels – slotmotorns matematik.
//
// Ren logik utan DOM, så att samma kod används både i webbläsaren och i
// simuleringsskriptet (tools/simulate.mjs) som räknar fram återbetalningen (RTP).
//
// Ett spel beskrivs av en konfiguration:
//   reels, rows      – rutnätets storlek
//   lines            – vinstlinjer, en radindex per hjul
//   symbols          – { id: { pays: { antal: multipel av linjeinsatsen } } }
//   weights          – en vikttabell per hjul: { symbolId: vikt }
//   wild             – symbol-id som ersätter alla utom scatter (valfritt)
//   wildMultiplier   – linjevinst med minst en ersättande wild multipliceras (valfritt)
//   expandingWild    – { reels: [hjulindex] } wild växer och täcker hela hjulet (valfritt)
//   scatter          – { id, pays: { antal: multipel av total insats }, freeSpins: { antal: snurr } }
//   freeSpinMultiplier – multiplikator på alla vinster under free spins
//   jackpot          – { symbol, count } minst `count` sådana symboler var som helst vinner jackpotten

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

/** Förbereder vikttabellerna för snabb dragning. Anropas en gång per spel. */
export function prepare(config) {
  if (config._prepared) return config;
  config._tables = config.weights.map((table) => {
    const entries = Object.entries(table).filter(([, w]) => w > 0);
    const total = entries.reduce((sum, [, w]) => sum + w, 0);
    let acc = 0;
    return { total, cumulative: entries.map(([id, w]) => [id, (acc += w)]) };
  });
  for (const [r, table] of config.weights.entries()) {
    for (const id of Object.keys(table)) {
      if (!config.symbols[id]) throw new Error(`${config.id}: okänd symbol "${id}" på hjul ${r + 1}`);
    }
  }
  if (config.lines.some((l) => l.length !== config.reels || l.some((row) => row < 0 || row >= config.rows))) {
    throw new Error(`${config.id}: felaktig vinstlinje`);
  }
  config._prepared = true;
  return config;
}

function draw(table, rnd) {
  const x = rnd() * table.total;
  for (const [id, upto] of table.cumulative) if (x < upto) return id;
  return table.cumulative[table.cumulative.length - 1][0];
}

/** Slumpar fram ett rutnät: grid[hjul][rad]. */
export function randomGrid(config, rnd = cryptoRandom) {
  prepare(config);
  return config._tables.map((table) => Array.from({ length: config.rows }, () => draw(table, rnd)));
}

/** Utvärderar ett rutnät. Ren funktion – används av spin() och av tester. */
export function evaluate(config, grid, { bet, multiplier = 1 }) {
  const { wild, scatter, jackpot } = config;
  const lineBet = bet / config.lines.length;

  // Expanderande wilds
  const expanded = [];
  if (wild && config.expandingWild) {
    grid = grid.map((col, r) => {
      if (config.expandingWild.reels.includes(r) && col.includes(wild)) {
        expanded.push(r);
        return col.map(() => wild);
      }
      return col;
    });
  }

  const wins = [];
  let jackpotHit = false;

  config.lines.forEach((line, lineIndex) => {
    const syms = line.map((row, r) => grid[r][row]);

    // Inledande wilds
    let leadWilds = 0;
    while (wild && leadWilds < syms.length && syms[leadWilds] === wild) leadWilds++;

    // Bästa kandidat 1: första riktiga symbolen med wild-ersättning
    let best = null;
    const base = syms.find((s) => s !== wild);
    if (base && (!scatter || base !== scatter.id)) {
      let n = 0;
      while (n < syms.length && (syms[n] === base || syms[n] === wild)) n++;
      const pay = config.symbols[base].pays?.[n] ?? 0;
      if (pay > 0) {
        const usesWild = syms.slice(0, n).includes(wild);
        const mult = usesWild && config.wildMultiplier ? config.wildMultiplier : 1;
        best = { symbol: base, count: n, pay: pay * mult, wildBoost: usesWild && mult > 1 };
      }
    }

    // Kandidat 2: bara wilds
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
      amount: best.pay * lineBet * multiplier,
      positions: line.slice(0, best.count).map((row, r) => [r, row]),
    });
  });

  // Scatter
  let scatterResult = null;
  if (scatter) {
    const positions = [];
    grid.forEach((col, r) => col.forEach((s, row) => s === scatter.id && positions.push([r, row])));
    const count = positions.length;
    const pay = scatter.pays?.[count] ?? 0;
    const spins = topKey(scatter.freeSpins, count);
    if (pay > 0 || spins > 0) {
      scatterResult = { count, positions, amount: pay * bet * multiplier, freeSpins: spins };
    } else if (count > 0) {
      scatterResult = { count, positions, amount: 0, freeSpins: 0 };
    }
  }

  if (jackpot) {
    const n = grid.reduce((sum, col) => sum + col.filter((s) => s === jackpot.symbol).length, 0);
    jackpotHit = n >= jackpot.count;
  }

  const raw = wins.reduce((s, w) => s + w.amount, 0) + (scatterResult?.amount ?? 0);
  return {
    grid,
    expanded,
    wins,
    scatter: scatterResult,
    jackpot: jackpotHit,
    total: Math.floor(raw + 1e-9),
  };
}

// Högsta tröskeln som uppnåtts, t.ex. { 3: 10, 4: 15 } och 5 träffar → 15
function topKey(table, count) {
  if (!table) return 0;
  let value = 0;
  for (const [k, v] of Object.entries(table)) if (count >= Number(k)) value = Math.max(value, v);
  return value;
}

/** Ett komplett snurr. */
export function spin(config, { bet, multiplier = 1, rnd = cryptoRandom }) {
  const grid = randomGrid(config, rnd);
  return { ...evaluate(config, grid, { bet, multiplier }), raw: grid };
}

/** Delade vinstlinjer för 5×3-spel (de första 10, 20 eller 25 används). */
export const LINES_5x3 = [
  [1, 1, 1, 1, 1], [0, 0, 0, 0, 0], [2, 2, 2, 2, 2], [0, 1, 2, 1, 0], [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2], [2, 2, 1, 0, 0], [1, 0, 0, 0, 1], [1, 2, 2, 2, 1], [1, 0, 1, 2, 1],
  [1, 2, 1, 0, 1], [0, 1, 1, 1, 0], [2, 1, 1, 1, 2], [0, 1, 0, 1, 0], [2, 1, 2, 1, 2],
  [1, 1, 0, 1, 1], [1, 1, 2, 1, 1], [0, 0, 2, 0, 0], [2, 2, 0, 2, 2], [0, 2, 0, 2, 0],
  [2, 0, 2, 0, 2], [1, 0, 2, 0, 1], [1, 2, 0, 2, 1], [0, 2, 2, 2, 0], [2, 0, 0, 0, 2],
];

export const LINES_3x3 = [
  [1, 1, 1], [0, 0, 0], [2, 2, 2], [0, 1, 2], [2, 1, 0],
];
