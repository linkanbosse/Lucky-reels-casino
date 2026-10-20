// Lucky Reels – genererad omslagsgrafik för spelkort.
// Ett tema = två bakgrundsfärger + glödfärg + huvudsymbol + två sidosymboler.

import { symbolMarkup } from "./symbols.js";

let uid = 0;

// Deterministisk pseudo-slump så att varje spel får samma gnistor varje gång
function seeded(seed) {
  let s = 0;
  for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Inre <svg> kan inte roteras pålitligt, så rotationen läggs på en omslutande <g>
const nested = (name, x, y, size, transform = "") =>
  `<g${transform ? ` transform="${transform}"` : ""}><svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 100 100">${symbolMarkup(name)}</svg></g>`;

export function coverArt(game, { cls = "card__art", width = 300, height = 400 } = {}) {
  const n = ++uid;
  const { from, to, glow } = game.theme;
  const [side1, side2] = game.sideSymbols ?? [game.symbol, game.symbol];
  const rnd = seeded(game.id);
  const cx = width / 2;
  const cy = height * 0.42;
  const main = Math.min(width, height) * 0.58;

  const sparkles = Array.from({ length: 18 }, () => {
    const x = (rnd() * width).toFixed(1);
    const y = (rnd() * height * 0.8).toFixed(1);
    const r = (0.6 + rnd() * 1.8).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${(0.25 + rnd() * 0.6).toFixed(2)}"/>`;
  }).join("");

  const rays = Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const a2 = a + Math.PI / 30;
    const R = Math.max(width, height);
    return `<path d="M${cx} ${cy}L${cx + R * Math.cos(a)} ${cy + R * Math.sin(a)}L${cx + R * Math.cos(a2)} ${cy + R * Math.sin(a2)}Z"/>`;
  }).join("");

  return `<svg class="${cls}" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="bg${n}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="gl${n}" cx="50%" cy="42%" r="50%">
      <stop offset="0" stop-color="${glow}" stop-opacity=".85"/>
      <stop offset=".55" stop-color="${glow}" stop-opacity=".18"/>
      <stop offset="1" stop-color="${glow}" stop-opacity="0"/>
    </radialGradient>
    <filter id="sh${n}" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000" flood-opacity=".55"/>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg${n})"/>
  <g fill="${glow}" opacity=".10">${rays}</g>
  <rect width="${width}" height="${height}" fill="url(#gl${n})"/>
  ${sparkles}
  <g opacity=".55" filter="url(#sh${n})">
    ${nested(side1, width * 0.02, height * 0.56, main * 0.42, `rotate(-14 ${width * 0.12} ${height * 0.64})`)}
    ${nested(side2, width * 0.72, height * 0.1, main * 0.36, `rotate(12 ${width * 0.82} ${height * 0.18})`)}
  </g>
  <g filter="url(#sh${n})">${nested(game.symbol, cx - main / 2, cy - main / 2, main)}</g>
</svg>`;
}
