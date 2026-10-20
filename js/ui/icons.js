// Lucky Reels – SVG-ikoner (stroke-baserade, ärver currentColor)

const wrap = (body) =>
  `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

export const icons = {
  search: wrap('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  lock: wrap('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>'),
  close: wrap('<path d="M18 6 6 18M6 6l12 12"/>'),
  home: wrap('<path d="M3 11 12 3l9 8"/><path d="M5 10v10h14V10"/>'),
  reels: wrap('<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16M15 4v16"/>'),
  trophy: wrap('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>'),
  gift: wrap('<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9"/><path d="M12 8S10.5 3 8 3a2.5 2.5 0 0 0 0 5M12 8s1.5-5 4-5a2.5 2.5 0 0 1 0 5"/>'),
  user: wrap('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>'),
  play: wrap('<path d="M7 4v16l13-8Z" fill="currentColor"/>'),
  back: wrap('<path d="M15 18 9 12l6-6"/>'),
  info: wrap('<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>'),
  sound: wrap('<path d="M11 5 6 9H3v6h3l5 4Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/>'),
  mute: wrap('<path d="M11 5 6 9H3v6h3l5 4Z"/><path d="m22 9-6 6M16 9l6 6"/>'),
  bolt: wrap('<path d="M13 2 4 14h7l-1 8 9-12h-7Z"/>'),
  spin: wrap('<path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v5h-5"/>'),
  spark: wrap('<path d="M12 2v6M12 16v6M2 12h6M16 12h6M5 5l3 3M16 16l3 3M5 19l3-3M16 8l3-3"/>'),
};

// Guldmynt med präglad stjärna – används i saldo, logga och animationer
let coinId = 0;
export const coinSvg = (cls = "") => {
  const g = `coinG${++coinId}`;
  const i = `coinI${coinId}`;
  return `
<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true">
  <defs>
    <linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff4c2"/><stop offset=".45" stop-color="#ffcf5a"/><stop offset="1" stop-color="#b8700c"/>
    </linearGradient>
    <linearGradient id="${i}" x1="1" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#d8890f"/>
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="29" fill="url(#${g})"/>
  <circle cx="32" cy="32" r="22" fill="url(#${i})" stroke="#a86207" stroke-width="1.5"/>
  <path d="m32 17 4.4 9 9.9 1.4-7.2 7 1.7 9.8L32 39.6l-8.8 4.6 1.7-9.8-7.2-7 9.9-1.4Z" fill="#fff3c4" stroke="#a86207" stroke-width="1.2" stroke-linejoin="round"/>
</svg>`;
};
