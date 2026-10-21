// Lucky Reels – slotsymboler i vektorform.
// Varje symbol ritas i en 100×100-ruta. Gradient-id:n görs unika per anrop
// så att samma symbol kan visas många gånger på sidan.

import { adventureShapes } from "./symbols-adventure.js";

let uid = 0;
const id = (name) => `${name}-${++uid}`;

const lin = (gid, stops, x2 = 0, y2 = 1) =>
  `<linearGradient id="${gid}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops
    .map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`)
    .join("")}</linearGradient>`;

const shapes = {
  seven() {
    const g = id("s7");
    return `<defs>${lin(g, ["#ff6b6b", "#e11d48", "#7f1d1d"])}</defs>
      <path d="M22 18h58l-4 12-28 54H28l26-50H22Z" fill="url(#${g})" stroke="#4c0519" stroke-width="4" stroke-linejoin="round"/>
      <path d="M28 24h44" stroke="#fff" stroke-opacity=".55" stroke-width="4" stroke-linecap="round"/>`;
  },
  cherry() {
    const g = id("ch");
    return `<defs><radialGradient id="${g}" cx=".35" cy=".35" r=".7"><stop offset="0" stop-color="#ff8fa3"/><stop offset=".5" stop-color="#e11d48"/><stop offset="1" stop-color="#6b0f24"/></radialGradient></defs>
      <path d="M34 62C40 40 52 24 70 14M66 64C64 44 66 28 70 14" stroke="#166534" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M70 14c8-2 16 2 18 10-10 2-16-2-18-10Z" fill="#22c55e" stroke="#14532d" stroke-width="2"/>
      <circle cx="32" cy="70" r="17" fill="url(#${g})" stroke="#4c0519" stroke-width="3"/>
      <circle cx="66" cy="72" r="17" fill="url(#${g})" stroke="#4c0519" stroke-width="3"/>
      <circle cx="26" cy="64" r="4" fill="#fff" opacity=".7"/><circle cx="60" cy="66" r="4" fill="#fff" opacity=".7"/>`;
  },
  bell() {
    const g = id("bl");
    return `<defs>${lin(g, ["#fff4c2", "#fbbf24", "#b45309"], 1, 1)}</defs>
      <path d="M50 12c-4 0-6 3-6 6-14 4-20 16-20 30v14l-8 10h68l-8-10V48c0-14-6-26-20-30 0-3-2-6-6-6Z" fill="url(#${g})" stroke="#78350f" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="50" cy="82" r="8" fill="#b45309" stroke="#78350f" stroke-width="3"/>
      <path d="M36 34c-3 5-4 10-4 18" stroke="#fff" stroke-opacity=".7" stroke-width="4" stroke-linecap="round" fill="none"/>`;
  },
  diamond() {
    const a = id("dm");
    const b = id("dm");
    return `<defs>${lin(a, ["#cffafe", "#22d3ee", "#0e7490"], 1, 1)}${lin(b, ["#a5f3fc", "#0891b2"])}</defs>
      <path d="M28 18h44l18 22-40 46-40-46Z" fill="url(#${a})" stroke="#164e63" stroke-width="4" stroke-linejoin="round"/>
      <path d="M10 40h80M28 18l10 22 12 46M72 18 62 40 50 86M38 40l12-22 12 22" stroke="#164e63" stroke-width="2.5" fill="none" stroke-linejoin="round"/>
      <path d="M38 40h24L50 86Z" fill="url(#${b})" opacity=".55"/>
      <path d="M30 24l6 12" stroke="#fff" stroke-width="4" stroke-linecap="round"/>`;
  },
  bar() {
    const g = id("br");
    return `<defs>${lin(g, ["#3f3f46", "#18181b"])}</defs>
      <rect x="10" y="30" width="80" height="40" rx="8" fill="url(#${g})" stroke="#fbbf24" stroke-width="4"/>
      <text x="50" y="60" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="26" fill="#fde68a" letter-spacing="2">BAR</text>`;
  },
  clover() {
    const g = id("cl");
    return `<defs><radialGradient id="${g}" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#86efac"/><stop offset=".6" stop-color="#16a34a"/><stop offset="1" stop-color="#14532d"/></radialGradient></defs>
      <g fill="url(#${g})" stroke="#052e16" stroke-width="3">
        <path d="M50 48C38 48 26 40 30 28s18-10 20 2c2-12 16-14 20-2s-8 20-20 20Z"/>
        <path d="M50 48C38 48 26 56 30 68s18 10 20-2c2 12 16 14 20 2s-8-20-20-20Z" transform="rotate(90 50 48)"/>
        <path d="M50 48C38 48 26 56 30 68s18 10 20-2c2 12 16 14 20 2s-8-20-20-20Z"/>
        <path d="M50 48C38 48 26 56 30 68s18 10 20-2c2 12 16 14 20 2s-8-20-20-20Z" transform="rotate(-90 50 48)"/>
      </g>
      <path d="M50 52c2 14 6 24 14 34" stroke="#14532d" stroke-width="5" fill="none" stroke-linecap="round"/>`;
  },
  crown() {
    const g = id("cr");
    return `<defs>${lin(g, ["#fff4c2", "#facc15", "#a16207"], 1, 1)}</defs>
      <path d="M14 74 10 30l22 18 18-30 18 30 22-18-4 44Z" fill="url(#${g})" stroke="#713f12" stroke-width="4" stroke-linejoin="round"/>
      <rect x="14" y="74" width="72" height="12" rx="3" fill="#ca8a04" stroke="#713f12" stroke-width="4"/>
      <circle cx="50" cy="60" r="6" fill="#e11d48" stroke="#713f12" stroke-width="2"/>
      <circle cx="30" cy="64" r="4" fill="#22d3ee" stroke="#713f12" stroke-width="2"/>
      <circle cx="70" cy="64" r="4" fill="#22d3ee" stroke="#713f12" stroke-width="2"/>`;
  },
  star() {
    const g = id("st");
    return `<defs>${lin(g, ["#fef9c3", "#facc15", "#ca8a04"], 1, 1)}</defs>
      <path d="m50 8 12.4 25.2 27.8 4-20.1 19.6 4.7 27.7L50 71.5 25.2 84.5l4.7-27.7L9.8 37.2l27.8-4Z" fill="url(#${g})" stroke="#713f12" stroke-width="4" stroke-linejoin="round"/>
      <path d="M40 30 34 40" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`;
  },
  pyramid() {
    const a = id("py");
    const b = id("py");
    return `<defs>${lin(a, ["#fde68a", "#d97706"], 1, 1)}${lin(b, ["#b45309", "#78350f"])}</defs>
      <path d="M50 12 90 84H50Z" fill="url(#${b})"/><path d="M50 12 10 84h40Z" fill="url(#${a})"/>
      <path d="M50 12 90 84H10Z" fill="none" stroke="#451a03" stroke-width="4" stroke-linejoin="round"/>
      <path d="M44 46a6 6 0 0 1 12 0 6 6 0 0 1-12 0Z" fill="#22d3ee" stroke="#451a03" stroke-width="2"/>`;
  },
  moon() {
    const g = id("mn");
    return `<defs>${lin(g, ["#f5f3ff", "#c4b5fd", "#6d28d9"], 1, 1)}</defs>
      <path d="M62 10a40 40 0 1 0 28 62A32 32 0 1 1 62 10Z" fill="url(#${g})" stroke="#2e1065" stroke-width="4" stroke-linejoin="round"/>
      <path d="m74 24 3 6 6 1-4 4 1 6-6-3-6 3 1-6-4-4 6-1Z" fill="#fef08a"/>`;
  },
  flame() {
    const g = id("fl");
    return `<defs>${lin(g, ["#fef08a", "#f97316", "#b91c1c"])}</defs>
      <path d="M50 8c4 18 26 26 26 50a26 26 0 0 1-52 0c0-12 6-20 12-26 0 10 4 16 10 18-4-16 0-30 4-42Z" fill="url(#${g})" stroke="#7f1d1d" stroke-width="4" stroke-linejoin="round"/>
      <path d="M50 52c6 6 12 10 12 20a12 12 0 0 1-24 0c0-8 6-12 12-20Z" fill="#fef9c3" opacity=".85"/>`;
  },
  wave() {
    const g = id("wv");
    return `<defs>${lin(g, ["#a5f3fc", "#0ea5e9", "#1e3a8a"])}</defs>
      <path d="M8 64c10-28 30-44 54-44 14 0 26 8 30 20-10-6-24-4-30 6 12-2 22 6 22 18 0 4-2 8-4 10H8Z" fill="url(#${g})" stroke="#172554" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="74" cy="82" r="5" fill="#e0f2fe"/><circle cx="28" cy="80" r="3" fill="#e0f2fe"/>`;
  },
  cards() {
    return `<g stroke="#1f2937" stroke-width="3" stroke-linejoin="round">
        <rect x="16" y="20" width="44" height="62" rx="6" fill="#f8fafc" transform="rotate(-12 38 51)"/>
        <rect x="40" y="18" width="44" height="62" rx="6" fill="#ffffff" transform="rotate(10 62 49)"/>
      </g>
      <text x="64" y="58" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="30" fill="#dc2626" transform="rotate(10 62 49)">A</text>
      <path d="m60 64 4-6 4 6-4 6Z" fill="#dc2626" transform="rotate(10 62 49)"/>`;
  },
  wheel() {
    const segs = Array.from({ length: 12 }, (_, i) => {
      const a0 = (i * 30 * Math.PI) / 180;
      const a1 = ((i + 1) * 30 * Math.PI) / 180;
      const p = (a, r) => `${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`;
      const fill = i % 2 ? "#111827" : "#dc2626";
      return `<path d="M50 50L${p(a0, 38)}A38 38 0 0 1 ${p(a1, 38)}Z" fill="${i === 0 ? "#16a34a" : fill}"/>`;
    }).join("");
    const g = id("wh");
    return `<defs>${lin(g, ["#fde68a", "#b45309"], 1, 1)}</defs>
      <circle cx="50" cy="50" r="44" fill="url(#${g})" stroke="#451a03" stroke-width="3"/>
      ${segs}
      <circle cx="50" cy="50" r="16" fill="url(#${g})" stroke="#451a03" stroke-width="3"/>
      <circle cx="66" cy="26" r="4" fill="#fff"/>`;
  },
  lemon() {
    const g = id("le");
    return `<defs><radialGradient id="${g}" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#fef9c3"/><stop offset=".5" stop-color="#facc15"/><stop offset="1" stop-color="#a16207"/></radialGradient></defs>
      <path d="M12 54c4-22 22-36 40-36s34 12 38 30c-4 22-22 36-40 36S16 72 12 54Z" fill="url(#${g})" stroke="#713f12" stroke-width="4" stroke-linejoin="round" transform="rotate(-18 50 50)"/>
      <path d="M30 40c6-8 16-12 24-12" stroke="#fff" stroke-opacity=".75" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  },
  orange() {
    const g = id("or");
    return `<defs><radialGradient id="${g}" cx=".38" cy=".35" r=".75"><stop offset="0" stop-color="#fed7aa"/><stop offset=".5" stop-color="#f97316"/><stop offset="1" stop-color="#9a3412"/></radialGradient></defs>
      <circle cx="50" cy="56" r="34" fill="url(#${g})" stroke="#7c2d12" stroke-width="4"/>
      <path d="M50 22c2-8 8-12 16-12-2 8-8 12-16 12Z" fill="#22c55e" stroke="#14532d" stroke-width="2.5"/>
      <g fill="#7c2d12" opacity=".35"><circle cx="62" cy="62" r="1.6"/><circle cx="54" cy="72" r="1.6"/><circle cx="68" cy="50" r="1.6"/><circle cx="40" cy="70" r="1.6"/></g>
      <path d="M32 44c4-6 10-9 16-10" stroke="#fff" stroke-opacity=".7" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  },
  plum() {
    const g = id("pl");
    return `<defs><radialGradient id="${g}" cx=".36" cy=".32" r=".8"><stop offset="0" stop-color="#e9d5ff"/><stop offset=".45" stop-color="#9333ea"/><stop offset="1" stop-color="#3b0764"/></radialGradient></defs>
      <path d="M50 22c22 0 34 16 34 34S70 90 50 90 16 76 16 56s12-34 34-34Z" fill="url(#${g})" stroke="#2e1065" stroke-width="4"/>
      <path d="M50 24c4 14 4 40-2 64" stroke="#2e1065" stroke-opacity=".35" stroke-width="3" fill="none"/>
      <path d="M50 24c0-8 4-12 8-14" stroke="#713f12" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M58 16c8-6 18-4 22 2-8 6-18 4-22-2Z" fill="#22c55e" stroke="#14532d" stroke-width="2.5"/>
      <path d="M28 48c2-8 8-14 14-16" stroke="#fff" stroke-opacity=".6" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  },
  grapes() {
    const g = id("gr");
    const berries = [
      [36, 36], [52, 34], [68, 36], [28, 52], [44, 50], [60, 50], [76, 52], [36, 66], [52, 66], [68, 66], [44, 80], [60, 80],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="url(#${g})" stroke="#14532d" stroke-width="2.5"/><circle cx="${x - 3}" cy="${y - 3}" r="2.5" fill="#fff" opacity=".7"/>`)
      .join("");
    return `<defs><radialGradient id="${g}" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="#d9f99d"/><stop offset=".55" stop-color="#65a30d"/><stop offset="1" stop-color="#1a2e05"/></radialGradient></defs>
      <path d="M52 26c0-8 2-14 8-18" stroke="#713f12" stroke-width="4" stroke-linecap="round" fill="none"/>
      ${berries}`;
  },
  bomb() {
    const a = id("bo");
    const b = id("bo");
    return `<defs><radialGradient id="${a}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fbcfe8"/><stop offset=".45" stop-color="#ec4899"/><stop offset="1" stop-color="#701a75"/></radialGradient>${lin(b, ["#fde68a", "#f59e0b"])}</defs>
      <circle cx="48" cy="58" r="32" fill="url(#${a})" stroke="#4a044e" stroke-width="4"/>
      <rect x="40" y="18" width="18" height="12" rx="3" fill="#6b21a8" stroke="#3b0764" stroke-width="3" transform="rotate(20 49 24)"/>
      <path d="M56 20c6-8 14-10 20-6" stroke="#a16207" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="m78 12 3 5 6 1-4 4 1 6-6-3-5 3 1-6-4-4 6-1Z" fill="url(#${b})" stroke="#b45309" stroke-width="1.5"/>
      <ellipse cx="36" cy="44" rx="9" ry="6" fill="#fff" opacity=".55" transform="rotate(-30 36 44)"/>`;
  },
  coin() {
    const a = id("cn");
    const b = id("cn");
    return `<defs>${lin(a, ["#fff4c2", "#facc15", "#a16207"], 1, 1)}${lin(b, ["#fde68a", "#ca8a04"], 1, 0)}</defs>
      <circle cx="50" cy="50" r="44" fill="url(#${a})" stroke="#713f12" stroke-width="4"/>
      <circle cx="50" cy="50" r="34" fill="url(#${b})" stroke="#a16207" stroke-width="2.5"/>
      <path d="M50 22 74 66H26Z" fill="#fef3c7" opacity=".5" stroke="#a16207" stroke-width="2" stroke-linejoin="round"/>
      <path d="M50 22 62 44H38Z" fill="#fff7d6" opacity=".6"/>
      <path d="M22 34c6-10 16-16 28-16" stroke="#fff" stroke-opacity=".7" stroke-width="4" stroke-linecap="round" fill="none"/>`;
  },
  ankh() {
    const g = id("an");
    return `<defs>${lin(g, ["#fef08a", "#eab308", "#854d0e"], 1, 1)}</defs>
      <path d="M50 8c-14 0-22 12-22 24 0 10 6 18 12 22H18v14h24v26h16V68h24V54H60c6-4 12-12 12-22 0-12-8-24-22-24Zm0 14c6 0 8 6 8 11 0 7-4 14-8 18-4-4-8-11-8-18 0-5 2-11 8-11Z"
        fill="url(#${g})" stroke="#713f12" stroke-width="4" stroke-linejoin="round"/>
      <path d="M24 58h12" stroke="#fff" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>`;
  },
  eye() {
    const a = id("ey");
    const b = id("ey");
    return `<defs>${lin(a, ["#a5f3fc", "#0891b2", "#164e63"], 1, 1)}${lin(b, ["#fde68a", "#ca8a04"])}</defs>
      <path d="M6 46c14-18 30-26 46-26s30 8 42 26c-12 16-26 24-42 24S20 62 6 46Z" fill="#f8fafc" stroke="#0f172a" stroke-width="5" stroke-linejoin="round"/>
      <circle cx="50" cy="45" r="15" fill="url(#${a})" stroke="#0f172a" stroke-width="4"/>
      <circle cx="50" cy="45" r="6" fill="#0f172a"/><circle cx="45" cy="40" r="3" fill="#fff"/>
      <path d="M8 26c16-10 30-12 44-10M42 70l-6 22M30 66c-6 10-4 22 8 22" stroke="url(#${b})" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  },
  scarab() {
    const a = id("sc");
    const b = id("sc");
    return `<defs><radialGradient id="${a}" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="#6ee7b7"/><stop offset=".5" stop-color="#059669"/><stop offset="1" stop-color="#022c22"/></radialGradient>${lin(b, ["#fde68a", "#ca8a04"])}</defs>
      <g stroke="#022c22" stroke-width="4" stroke-linecap="round"><path d="M30 46 12 38M30 58 10 62M30 70 16 84M70 46l18-8M70 58l20 4M70 70l14 14"/></g>
      <path d="M8 30c10-4 20 0 24 8M92 30c-10-4-20 0-24 8" stroke="url(#${b})" stroke-width="6" fill="none" stroke-linecap="round"/>
      <circle cx="50" cy="26" r="12" fill="url(#${b})" stroke="#713f12" stroke-width="3"/>
      <ellipse cx="50" cy="60" rx="24" ry="30" fill="url(#${a})" stroke="#022c22" stroke-width="4"/>
      <path d="M50 32v58" stroke="#022c22" stroke-width="3"/>
      <ellipse cx="40" cy="50" rx="5" ry="9" fill="#fff" opacity=".35"/>`;
  },
  wild() {
    const a = id("wd");
    const b = id("wd");
    return `<defs>${lin(a, ["#7c3aed", "#db2777"], 1, 1)}${lin(b, ["#fff4c2", "#facc15", "#b45309"])}</defs>
      <rect x="6" y="20" width="88" height="60" rx="14" fill="url(#${a})" stroke="url(#${b})" stroke-width="6"/>
      <path d="M12 30c20-6 56-6 76 0" stroke="#fff" stroke-opacity=".35" stroke-width="4" stroke-linecap="round" fill="none"/>
      <text x="50" y="62" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="900" font-size="24" fill="url(#${b})" stroke="#3b0764" stroke-width="2" paint-order="stroke" letter-spacing="1">WILD</text>`;
  },
};

// Kortsymboler (låga vinster): bokstav med egen färg
const ROYALS = {
  ten: ["10", ["#bfdbfe", "#3b82f6", "#1e3a8a"], 54],
  jack: ["J", ["#bbf7d0", "#22c55e", "#14532d"], 80],
  queen: ["Q", ["#f5d0fe", "#c026d3", "#581c87"], 62],
  king: ["K", ["#fecaca", "#ef4444", "#7f1d1d"], 76],
  ace: ["A", ["#fde68a", "#f59e0b", "#78350f"], 76],
};

// Spelets stil på kortsymbolerna (se js/slot/skins.js). null = standardutseendet.
let royalStyle = null;
export function setRoyalStyle(style) {
  royalStyle = style ?? null;
}

// Typsnitt har olika bredd – skala så att bokstäverna fyller rutan lika mycket
const FONT_SCALE = {
  Monoton: 0.6, Orbitron: 0.8, "Black Ops One": 0.8, "Alfa Slab One": 0.78, Rye: 0.78,
  "Lilita One": 0.95, "Uncial Antiqua": 0.86, "Marcellus SC": 0.92, "Cinzel Decorative": 0.78,
};

// Bokstäverna krymps så att de ryms i plattan/medaljongen
const DECO_SCALE = { crystal: 0.95, plaque: 0.88, stone: 0.84, wood: 0.86, steel: 0.84, brass: 0.72 };

// Standardfärger per stil när skinnet inte anger egna
const STYLE_COLORS = {
  neon: { ten: "#22e3ff", jack: "#7cff6b", queen: "#ff3df0", king: "#ff4d4d", ace: "#fff35c" },
  candy: {
    ten: ["#e0f2fe", "#38bdf8", "#075985"], jack: ["#ecfccb", "#84cc16", "#365314"],
    queen: ["#fce7f3", "#f472b6", "#831843"], king: ["#fee2e2", "#f43f5e", "#881337"], ace: ["#ffedd5", "#fb923c", "#7c2d12"],
  },
};

const rivet = (x, y) => `<circle cx="${x}" cy="${y}" r="3.4" fill="#d1d5db" stroke="#1f2937" stroke-width="1.4"/><circle cx="${x - 1}" cy="${y - 1}" r="1.1" fill="#fff" opacity=".8"/>`;

function styledRoyal(name, label, defColors, baseSize) {
  const st = royalStyle;
  const font = `${st.font}, Georgia, serif`;
  const plate = !["neon", "candy", "mystic"].includes(st.deco);
  const size = baseSize * (FONT_SCALE[st.font] ?? 0.85) * (DECO_SCALE[st.deco] ?? 1);
  const colors = st.colors?.[name] ?? STYLE_COLORS[st.deco]?.[name] ?? defColors;
  const g = id(name);
  const t = (attrs) => `<text x="50" y="${plate ? 53 : 52}" text-anchor="middle" dominant-baseline="central" font-family="${font}" font-size="${size.toFixed(1)}" ${attrs}>${label}</text>`;
  const letter = (stroke = colors[2], w = 7) =>
    `<defs>${lin(g, colors)}</defs>${t(`fill="url(#${g})" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" paint-order="stroke"`)}${t(`fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1"`)}`;

  switch (st.deco) {
    case "neon": {
      const c = colors;
      const f = id("glow");
      return `<defs><filter id="${f}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3.2"/></filter></defs>
        ${t(`fill="${c}" filter="url(#${f})" opacity=".95"`)}
        ${t(`fill="${c}"`)}
        ${t(`fill="#fff" opacity=".55" transform="translate(0 -0.6)" style="mix-blend-mode:screen"`)}`;
    }
    case "crystal": {
      const p = id("cp");
      return `<defs>${lin(p, ["rgba(255,255,255,.22)", "rgba(125,211,252,.06)", "rgba(15,23,42,.35)"], 1, 1)}</defs>
        <path d="M50 6 88 28v44L50 94 12 72V28Z" fill="url(#${p})" stroke="${colors[1]}" stroke-opacity=".55" stroke-width="2"/>
        <path d="M50 6v88M12 28l76 44M88 28 12 72" stroke="#fff" stroke-opacity=".07" stroke-width="1.5"/>
        ${letter(colors[2], 6)}`;
    }
    case "plaque": {
      const p = id("pl");
      const r = id("rim");
      return `<defs>${lin(p, [colors[1], colors[2]])}${lin(r, ["#fff4c2", "#d4a017", "#7a4a05"], 1, 1)}</defs>
        <path d="M18 10h64q8 0 8 8v52q0 10-10 14L50 94 20 84q-10-4-10-14V18q0-8 8-8Z" fill="url(#${p})" stroke="url(#${r})" stroke-width="5"/>
        <path d="M24 18h52" stroke="#fff" stroke-opacity=".25" stroke-width="3" stroke-linecap="round"/>
        ${(() => {
          const gg = id("gl");
          return `<defs>${lin(gg, ["#fffbe6", "#facc15", "#a16207"])}</defs>${t(`fill="url(#${gg})" stroke="#3b2405" stroke-width="5" stroke-linejoin="round" paint-order="stroke"`)}`;
        })()}`;
    }
    case "candy": {
      return `<defs>${lin(g, colors)}</defs>
        ${t(`fill="none" stroke="${colors[2]}" stroke-width="15" stroke-linejoin="round"`)}
        ${t(`fill="url(#${g})" stroke="#fff" stroke-width="7" stroke-linejoin="round" paint-order="stroke"`)}
        <ellipse cx="38" cy="30" rx="9" ry="4" fill="#fff" opacity=".75" transform="rotate(-20 38 30)"/>`;
    }
    case "mystic": {
      const f = id("mg");
      return `<defs>${lin(g, colors)}<filter id="${f}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter></defs>
        ${t(`fill="${colors[1]}" filter="url(#${f})" opacity=".8"`)}
        ${t(`fill="url(#${g})" stroke="${colors[2]}" stroke-width="5" stroke-linejoin="round" paint-order="stroke"`)}
        <path d="M80 14l2.4 6.6L89 23l-6.6 2.4L80 32l-2.4-6.6L71 23l6.6-2.4Z" fill="#fff" opacity=".9"/>`;
    }
    case "stone": {
      const p = id("sd");
      return `<defs>${lin(p, ["#f3e2b3", "#d6b77a", "#a9824a"], 0.4, 1)}</defs>
        <rect x="8" y="8" width="84" height="84" rx="8" fill="url(#${p})" stroke="#6b4a1f" stroke-width="3"/>
        <rect x="15" y="15" width="70" height="70" rx="4" fill="none" stroke="#7c5a2a" stroke-opacity=".55" stroke-width="2"/>
        <path d="M8 30h6M86 64h6M30 92v-6" stroke="#6b4a1f" stroke-opacity=".5" stroke-width="2"/>
        ${letter(colors[2], 6)}`;
    }
    case "wood": {
      const p = id("wd");
      return `<defs>${lin(p, ["#9a6532", "#6e4220", "#4a2a12"])}</defs>
        <rect x="7" y="14" width="86" height="72" rx="6" fill="url(#${p})" stroke="#2b1607" stroke-width="3"/>
        <path d="M10 32c20-4 40 4 80-2M10 54c26 3 50-4 80 1M10 72c18-3 44 3 80-1" stroke="#2b1607" stroke-opacity=".35" stroke-width="1.6" fill="none"/>
        <circle cx="15" cy="22" r="2.6" fill="#1c1917"/><circle cx="85" cy="22" r="2.6" fill="#1c1917"/>
        <circle cx="15" cy="78" r="2.6" fill="#1c1917"/><circle cx="85" cy="78" r="2.6" fill="#1c1917"/>
        ${letter("#1a0d03", 6)}`;
    }
    case "steel": {
      const p = id("stl");
      return `<defs>${lin(p, ["#d1d5db", "#6b7280", "#374151"], 0.3, 1)}</defs>
        <rect x="8" y="8" width="84" height="84" rx="6" fill="url(#${p})" stroke="#111827" stroke-width="3"/>
        <rect x="13" y="13" width="74" height="74" rx="3" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="1.5"/>
        ${rivet(17, 17)}${rivet(83, 17)}${rivet(17, 83)}${rivet(83, 83)}
        ${letter("#0b0f17", 6)}`;
    }
    case "brass": {
      const p = id("bs");
      const q = id("bi");
      return `<defs>${lin(p, ["#fff1b8", "#d4a017", "#7a4a05"], 1, 1)}${lin(q, ["#3b2410", "#1a0f06"])}</defs>
        <circle cx="50" cy="50" r="43" fill="url(#${p})" stroke="#3b2205" stroke-width="3"/>
        <circle cx="50" cy="50" r="34" fill="url(#${q})" stroke="#7a4a05" stroke-width="2"/>
        ${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<circle cx="${(50 + 38.5 * Math.cos((a * Math.PI) / 180)).toFixed(1)}" cy="${(50 + 38.5 * Math.sin((a * Math.PI) / 180)).toFixed(1)}" r="2" fill="#5a3505"/>`).join("")}
        ${letter("#120a03", 5)}`;
    }
    default:
      return letter();
  }
}

for (const [name, [label, colors, size]] of Object.entries(ROYALS)) {
  shapes[name] = () => {
    if (royalStyle) return styledRoyal(name, label, colors, size);
    const g = id(name);
    return `<defs>${lin(g, colors)}</defs>
      <text x="50" y="${50 + size * 0.34}" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="900" font-size="${size}"
        fill="url(#${g})" stroke="${colors[2]}" stroke-width="8" stroke-linejoin="round" paint-order="stroke">${label}</text>
      <text x="50" y="${50 + size * 0.34}" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="900" font-size="${size}"
        fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.2">${label}</text>`;
  };
}

// Slipade ädelstenar (mellanvinster)
const GEMS = {
  ruby: ["#fecdd3", "#e11d48", "#4c0519"],
  emerald: ["#bbf7d0", "#10b981", "#064e3b"],
  sapphire: ["#bfdbfe", "#2563eb", "#172554"],
  amethyst: ["#e9d5ff", "#9333ea", "#2e1065"],
};

for (const [name, [light, mid, dark]] of Object.entries(GEMS)) {
  shapes[name] = () => {
    const g = id(name);
    const h = id(name);
    return `<defs>${lin(g, [light, mid, dark], 1, 1)}${lin(h, [mid, dark])}</defs>
      <path d="M32 12h36l20 20v36L68 88H32L12 68V32Z" fill="url(#${g})" stroke="${dark}" stroke-width="4" stroke-linejoin="round"/>
      <path d="M38 28h24l10 10v24L62 72H38L28 62V38Z" fill="url(#${h})" opacity=".85"/>
      <path d="M32 12l6 16M68 12l-6 16M88 32 72 38M88 68 72 62M68 88l-6-16M32 88l6-16M12 68l16-6M12 32l16 6" stroke="${dark}" stroke-width="2" opacity=".7"/>
      <path d="M40 32h16" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`;
  };
}

Object.assign(shapes, adventureShapes(id, lin));

export const SYMBOLS = Object.keys(shapes);

export function symbolSvg(name, cls = "") {
  const draw = shapes[name] ?? shapes.star;
  return `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true">${draw()}</svg>`;
}

// Bara den inre grafiken (för att bädda in i större SVG-kompositioner)
export function symbolMarkup(name) {
  return (shapes[name] ?? shapes.star)();
}
