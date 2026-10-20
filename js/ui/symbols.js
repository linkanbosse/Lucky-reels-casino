// Lucky Reels – slotsymboler i vektorform.
// Varje symbol ritas i en 100×100-ruta. Gradient-id:n görs unika per anrop
// så att samma symbol kan visas många gånger på sidan.

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
};

export const SYMBOLS = Object.keys(shapes);

export function symbolSvg(name, cls = "") {
  const draw = shapes[name] ?? shapes.star;
  return `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true">${draw()}</svg>`;
}

// Bara den inre grafiken (för att bädda in i större SVG-kompositioner)
export function symbolMarkup(name) {
  return (shapes[name] ?? shapes.star)();
}
