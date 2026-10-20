// Lucky Reels – symboler för bonusäventyr-spelen (Ghost Gulch, Iron Lockdown, Steam Express).
// Samma format som symbols.js: varje funktion ritar i en 100×100-ruta och får
// hjälpfunktionerna id() och lin() så att gradienterna blir unika.

export function adventureShapes(id, lin) {
  // Glansig etikett (t.ex. "WILD", "BONUS") längst ner i rutan
  const ribbon = (text, fill, stroke = "#1c0a00", y = 74, size = 15) => {
    const g = id("rb");
    return `<defs>${lin(g, fill)}</defs>
      <rect x="10" y="${y}" width="80" height="20" rx="6" fill="url(#${g})" stroke="${stroke}" stroke-width="3"/>
      <text x="50" y="${y + 15}" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="${size}"
        fill="#fff" stroke="${stroke}" stroke-width="3" paint-order="stroke" letter-spacing="1">${text}</text>`;
  };
  const shine = (d) => `<path d="${d}" stroke="#fff" stroke-opacity=".7" stroke-width="4" stroke-linecap="round" fill="none"/>`;

  // Rund medaljong med ikon i mitten – används av Hold & Win-specialarna
  const medal = (inner, ring, core, label, labelFill) => {
    const a = id("md");
    const b = id("md");
    return `<defs>${lin(a, ring, 1, 1)}<radialGradient id="${b}" cx=".4" cy=".35" r=".75"><stop offset="0" stop-color="${core[0]}"/><stop offset="1" stop-color="${core[1]}"/></radialGradient></defs>
      <circle cx="50" cy="44" r="38" fill="url(#${a})" stroke="#1c0a00" stroke-width="4"/>
      <circle cx="50" cy="44" r="29" fill="url(#${b})" stroke="#1c0a00" stroke-opacity=".5" stroke-width="2"/>
      ${inner}
      ${shine("M24 30c5-9 14-14 24-15")}
      ${ribbon(label, labelFill, "#1c0a00", 74, label.length > 7 ? 12 : 14)}`;
  };

  return {
    /* ---------- Ghost Gulch ---------- */
    horseshoe() {
      const g = id("hs");
      return `<defs>${lin(g, ["#f1f5f9", "#94a3b8", "#334155"], 1, 1)}</defs>
        <path d="M22 86V48c0-18 12-34 28-34s28 16 28 34v38H62V48c0-10-5-19-12-19s-12 9-12 19v38Z" fill="url(#${g})" stroke="#0f172a" stroke-width="4" stroke-linejoin="round"/>
        <rect x="16" y="82" width="26" height="9" rx="3" fill="#64748b" stroke="#0f172a" stroke-width="3"/>
        <rect x="58" y="82" width="26" height="9" rx="3" fill="#64748b" stroke="#0f172a" stroke-width="3"/>
        <g fill="#0f172a"><circle cx="29" cy="70" r="2.6"/><circle cx="28" cy="56" r="2.6"/><circle cx="31" cy="42" r="2.6"/><circle cx="71" cy="70" r="2.6"/><circle cx="72" cy="56" r="2.6"/><circle cx="69" cy="42" r="2.6"/></g>
        ${shine("M30 36c3-8 9-14 16-15")}`;
    },
    boot() {
      const a = id("bt");
      const b = id("bt");
      return `<defs>${lin(a, ["#d6a46b", "#92400e", "#451a03"], 1, 1)}${lin(b, ["#fde68a", "#b45309"])}</defs>
        <path d="M30 10h30l-2 46c0 6 4 10 10 12l16 6c6 2 8 8 6 14H22c-4 0-6-3-6-7l8-26Z" fill="url(#${a})" stroke="#1c0a00" stroke-width="4" stroke-linejoin="round"/>
        <path d="M30 10c6 4 24 4 30 0" stroke="#1c0a00" stroke-width="4" fill="none"/>
        <path d="M34 24c6 6 14 6 20 0M34 38c6 6 14 6 20 0" stroke="#fde68a" stroke-width="2.5" stroke-dasharray="3 3" fill="none"/>
        <path d="M16 82h76" stroke="#1c0a00" stroke-width="4"/>
        <circle cx="14" cy="74" r="8" fill="url(#${b})" stroke="#1c0a00" stroke-width="3"/>
        <path d="M14 66v16M6 74h16M8 68l12 12M20 68 8 80" stroke="#78350f" stroke-width="2"/>
        ${shine("M36 16v30")}`;
    },
    hat() {
      const a = id("ht");
      const b = id("ht");
      return `<defs>${lin(a, ["#e7b77a", "#a16207", "#422006"], 1, 1)}${lin(b, ["#7f1d1d", "#450a0a"])}</defs>
        <path d="M6 62c10 12 30 16 44 16s34-4 44-16c-4-2-10-2-16 2-6 2-20 4-28 4s-22-2-28-4c-6-4-12-4-16-2Z" fill="url(#${a})" stroke="#1c0a00" stroke-width="4" stroke-linejoin="round"/>
        <path d="M26 64c-2-14 0-34 8-42 4-4 10-2 16 2 6-4 12-6 16-2 8 8 10 28 8 42-8 3-16 4-24 4s-16-1-24-4Z" fill="url(#${a})" stroke="#1c0a00" stroke-width="4" stroke-linejoin="round"/>
        <path d="M26 54c16 4 32 4 48 0v8c-16 4-32 4-48 0Z" fill="url(#${b})" stroke="#1c0a00" stroke-width="3"/>
        <path d="M50 24v14" stroke="#1c0a00" stroke-width="3" stroke-linecap="round" opacity=".6"/>
        ${shine("M34 30c-2 6-3 12-3 18")}`;
    },
    sheriff() {
      const a = id("sh");
      const b = id("sh");
      const tips = [0, 60, 120, 180, 240, 300]
        .map((deg) => {
          const rad = ((deg - 90) * Math.PI) / 180;
          return `<circle cx="${(50 + 40 * Math.cos(rad)).toFixed(1)}" cy="${(50 + 40 * Math.sin(rad)).toFixed(1)}" r="6" fill="url(#${a})" stroke="#713f12" stroke-width="3"/>`;
        })
        .join("");
      return `<defs>${lin(a, ["#fff7cc", "#facc15", "#a16207"], 1, 1)}${lin(b, ["#fde68a", "#ca8a04"])}</defs>
        <path d="m50 10 12 22h24L74 52l12 20H62L50 92 38 72H14l12-20-12-20h24Z" fill="url(#${a})" stroke="#713f12" stroke-width="4" stroke-linejoin="round"/>
        ${tips}
        <circle cx="50" cy="51" r="17" fill="url(#${b})" stroke="#713f12" stroke-width="3"/>
        <path d="m50 40 3.5 7 7.5 1-5.5 5 1.5 7.5-7-3.5-7 3.5 1.5-7.5-5.5-5 7.5-1Z" fill="#fff7cc" stroke="#713f12" stroke-width="1.5"/>
        ${shine("M38 30l6-10")}`;
    },
    dynamite() {
      const a = id("dy");
      const b = id("dy");
      const sticks = [28, 50, 72]
        .map((x) => `<rect x="${x - 10}" y="22" width="20" height="50" rx="5" fill="url(#${a})" stroke="#450a0a" stroke-width="3.5"/><path d="M${x - 5} 28v38" stroke="#fff" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>`)
        .join("");
      return `<defs>${lin(a, ["#fca5a5", "#dc2626", "#7f1d1d"], 1, 0)}${lin(b, ["#fff7cc", "#fbbf24", "#ea580c"])}</defs>
        ${sticks}
        <rect x="14" y="40" width="72" height="10" rx="2" fill="#78350f" stroke="#1c0a00" stroke-width="3"/>
        <path d="M50 22c0-8 6-12 12-10 6 2 8 0 10-4" stroke="#57534e" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="m74 2 3 6 7-1-5 5 4 6-7-2-3 7-2-7-7 1 5-5-4-6 7 2Z" fill="url(#${b})" stroke="#c2410c" stroke-width="1.5"/>
        ${ribbon("WILD", ["#fde047", "#ea580c", "#9a3412"], "#431407", 72, 17)}`;
    },
    skull() {
      const a = id("sk");
      const b = id("sk");
      return `<defs>${lin(a, ["#fffbeb", "#e7e5e4", "#a8a29e"], 1, 1)}<radialGradient id="${b}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fde047"/><stop offset=".6" stop-color="#f97316"/><stop offset="1" stop-color="#7c2d12"/></radialGradient></defs>
        <path d="M50 8C28 8 16 22 16 40c0 10 4 16 10 20v12h48V60c6-4 10-10 10-20C84 22 72 8 50 8Z" fill="url(#${a})" stroke="#292524" stroke-width="4" stroke-linejoin="round"/>
        <ellipse cx="36" cy="40" rx="10" ry="11" fill="url(#${b})" stroke="#292524" stroke-width="3"/>
        <ellipse cx="64" cy="40" rx="10" ry="11" fill="url(#${b})" stroke="#292524" stroke-width="3"/>
        <path d="M50 50l-5 9h10Z" fill="#292524"/>
        <path d="M36 62v10M44 62v10M52 62v10M60 62v10" stroke="#292524" stroke-width="3"/>
        ${shine("M26 26c4-8 12-12 20-13")}
        ${ribbon("BONUS", ["#c084fc", "#7c3aed", "#3b0764"], "#1e0638", 74, 15)}`;
    },

    /* ---------- Iron Lockdown ---------- */
    lamp() {
      const a = id("lp");
      const b = id("lp");
      return `<defs>${lin(a, ["#e2e8f0", "#64748b", "#1e293b"], 1, 1)}<radialGradient id="${b}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fffbeb"/><stop offset=".55" stop-color="#fde047"/><stop offset="1" stop-color="#ca8a04"/></radialGradient></defs>
        <path d="M50 52 92 22v60Z" fill="#fef9c3" opacity=".35"/>
        <path d="M30 76h28l6 14H24Z" fill="url(#${a})" stroke="#0f172a" stroke-width="4" stroke-linejoin="round"/>
        <path d="M44 76V62" stroke="#0f172a" stroke-width="6"/>
        <rect x="14" y="24" width="50" height="40" rx="12" fill="url(#${a})" stroke="#0f172a" stroke-width="4" transform="rotate(-12 39 44)"/>
        <ellipse cx="60" cy="40" rx="10" ry="17" fill="url(#${b})" stroke="#0f172a" stroke-width="4" transform="rotate(-12 60 40)"/>
        ${shine("M22 32c6-4 16-6 26-6")}`;
    },
    lock() {
      const a = id("lk");
      const b = id("lk");
      return `<defs>${lin(a, ["#fef3c7", "#d97706", "#78350f"], 1, 1)}${lin(b, ["#f1f5f9", "#94a3b8", "#334155"])}</defs>
        <path d="M30 44V32c0-12 9-22 20-22s20 10 20 22v12h-10V32c0-6-4-12-10-12s-10 6-10 12v12Z" fill="url(#${b})" stroke="#0f172a" stroke-width="4" stroke-linejoin="round"/>
        <rect x="18" y="42" width="64" height="48" rx="10" fill="url(#${a})" stroke="#451a03" stroke-width="4"/>
        <circle cx="50" cy="60" r="7" fill="#1c0a00"/><path d="M47 62h6l2 16H45Z" fill="#1c0a00"/>
        <g fill="#451a03" opacity=".6"><circle cx="26" cy="50" r="2.5"/><circle cx="74" cy="50" r="2.5"/><circle cx="26" cy="82" r="2.5"/><circle cx="74" cy="82" r="2.5"/></g>
        ${shine("M26 54v20")}`;
    },
    cuffs() {
      const a = id("cf");
      const ring = (cx) => `<circle cx="${cx}" cy="58" r="20" fill="none" stroke="#0f172a" stroke-width="13"/><circle cx="${cx}" cy="58" r="20" fill="none" stroke="url(#${a})" stroke-width="8"/>
        <rect x="${cx - 8}" y="30" width="16" height="12" rx="3" fill="url(#${a})" stroke="#0f172a" stroke-width="3"/>`;
      return `<defs>${lin(a, ["#f8fafc", "#94a3b8", "#475569"], 1, 1)}</defs>
        <path d="M30 34c4-14 10-20 20-20s16 6 20 20" stroke="#0f172a" stroke-width="7" fill="none"/>
        <path d="M30 34c4-14 10-20 20-20s16 6 20 20" stroke="#cbd5e1" stroke-width="3" stroke-dasharray="5 4" fill="none"/>
        ${ring(28)}${ring(72)}
        ${shine("M14 50c2-6 6-10 10-12")}`;
    },
    key() {
      const a = id("ky");
      return `<defs>${lin(a, ["#fff7cc", "#eab308", "#713f12"], 1, 1)}</defs>
        <g transform="rotate(-40 50 50)">
          <circle cx="50" cy="22" r="16" fill="url(#${a})" stroke="#422006" stroke-width="4"/>
          <circle cx="50" cy="22" r="6" fill="#1c0a00"/>
          <rect x="45" y="36" width="10" height="56" rx="3" fill="url(#${a})" stroke="#422006" stroke-width="4"/>
          <path d="M55 70h14v8H55M55 82h10v8H55" fill="url(#${a})" stroke="#422006" stroke-width="3.5" stroke-linejoin="round"/>
          <path d="M42 40h16" stroke="#422006" stroke-width="3"/>
        </g>
        ${shine("M30 24c2-4 6-8 10-9")}`;
    },
    mystery() {
      const a = id("my");
      const b = id("my");
      return `<defs>${lin(a, ["#cbd5e1", "#475569", "#0f172a"], 1, 1)}${lin(b, ["#fef9c3", "#facc15", "#ea580c"])}</defs>
        <rect x="10" y="10" width="80" height="80" rx="12" fill="url(#${a})" stroke="#020617" stroke-width="4"/>
        <rect x="18" y="18" width="64" height="64" rx="8" fill="none" stroke="#94a3b8" stroke-opacity=".5" stroke-width="2"/>
        <g fill="#e2e8f0" stroke="#020617" stroke-width="1.5"><circle cx="18" cy="18" r="3.5"/><circle cx="82" cy="18" r="3.5"/><circle cx="18" cy="82" r="3.5"/><circle cx="82" cy="82" r="3.5"/></g>
        <text x="50" y="70" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="56" fill="url(#${b})" stroke="#431407" stroke-width="4" paint-order="stroke">?</text>
        ${shine("M18 28c4-6 10-10 18-10")}`;
    },
    siren() {
      const a = id("sr");
      const b = id("sr");
      return `<defs><radialGradient id="${a}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fecaca"/><stop offset=".5" stop-color="#ef4444"/><stop offset="1" stop-color="#7f1d1d"/></radialGradient>${lin(b, ["#e2e8f0", "#475569"])}</defs>
        <g stroke="#facc15" stroke-width="4" stroke-linecap="round" opacity=".9"><path d="M14 22l8 8M86 22l-8 8M50 4v8M6 46h10M84 46h10"/></g>
        <path d="M24 64V44c0-14 12-26 26-26s26 12 26 26v20Z" fill="url(#${a})" stroke="#450a0a" stroke-width="4" stroke-linejoin="round"/>
        <path d="M38 30c-4 4-6 10-6 16" stroke="#fff" stroke-opacity=".75" stroke-width="5" stroke-linecap="round" fill="none"/>
        <rect x="18" y="62" width="64" height="10" rx="3" fill="url(#${b})" stroke="#0f172a" stroke-width="3"/>
        ${ribbon("BONUS", ["#60a5fa", "#2563eb", "#172554"], "#0b1533", 74, 15)}`;
    },

    /* ---------- Steam Express ---------- */
    lantern() {
      const a = id("ln");
      const b = id("ln");
      return `<defs>${lin(a, ["#a8a29e", "#44403c", "#1c1917"], 1, 1)}<radialGradient id="${b}" cx=".5" cy=".55" r=".55"><stop offset="0" stop-color="#fff7ed"/><stop offset=".5" stop-color="#fb923c"/><stop offset="1" stop-color="#9a3412"/></radialGradient></defs>
        <path d="M38 14c0-6 24-6 24 0" stroke="#1c1917" stroke-width="5" fill="none"/>
        <path d="M30 22h40l-4 8H34Z" fill="url(#${a})" stroke="#0c0a09" stroke-width="3.5" stroke-linejoin="round"/>
        <rect x="32" y="30" width="36" height="44" rx="6" fill="url(#${b})" stroke="#0c0a09" stroke-width="4"/>
        <path d="M44 30v44M56 30v44M32 52h36" stroke="#0c0a09" stroke-width="3" opacity=".7"/>
        <path d="M28 74h44l-4 12H32Z" fill="url(#${a})" stroke="#0c0a09" stroke-width="3.5" stroke-linejoin="round"/>
        ${shine("M36 36v12")}`;
    },
    watch() {
      const a = id("wt");
      return `<defs>${lin(a, ["#fff7cc", "#eab308", "#713f12"], 1, 1)}</defs>
        <path d="M50 4v10" stroke="#713f12" stroke-width="4"/><circle cx="50" cy="8" r="5" fill="none" stroke="url(#${a})" stroke-width="3"/>
        <rect x="44" y="12" width="12" height="8" rx="2" fill="url(#${a})" stroke="#422006" stroke-width="3"/>
        <circle cx="50" cy="56" r="36" fill="url(#${a})" stroke="#422006" stroke-width="4"/>
        <circle cx="50" cy="56" r="27" fill="#fffbeb" stroke="#713f12" stroke-width="3"/>
        <g stroke="#422006" stroke-width="3" stroke-linecap="round"><path d="M50 33v5M50 74v5M27 56h5M68 56h5"/></g>
        <path d="M50 56V40M50 56l12 8" stroke="#1c0a00" stroke-width="4" stroke-linecap="round"/>
        <circle cx="50" cy="56" r="3.5" fill="#b91c1c"/>
        ${shine("M28 40c4-8 10-12 18-13")}`;
    },
    bag() {
      const a = id("bg");
      const b = id("bg");
      return `<defs>${lin(a, ["#d9c49a", "#a16207", "#3f2a06"], 1, 1)}${lin(b, ["#fff7cc", "#facc15", "#a16207"])}</defs>
        <path d="M38 22c-4-6 0-12 6-12h12c6 0 10 6 6 12Z" fill="url(#${a})" stroke="#1c0a00" stroke-width="4" stroke-linejoin="round"/>
        <path d="M38 24C20 34 12 52 14 68c2 14 14 22 36 22s34-8 36-22c2-16-6-34-24-44Z" fill="url(#${a})" stroke="#1c0a00" stroke-width="4" stroke-linejoin="round"/>
        <path d="M36 24h28" stroke="#7f1d1d" stroke-width="6" stroke-linecap="round"/>
        <text x="50" y="76" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="34" fill="url(#${b})" stroke="#1c0a00" stroke-width="3" paint-order="stroke">$</text>
        ${shine("M24 54c2-8 6-14 12-18")}`;
    },
    train() {
      const a = id("tr");
      const b = id("tr");
      const c = id("tr");
      return `<defs>${lin(a, ["#fca5a5", "#b91c1c", "#450a0a"], 0, 1)}${lin(b, ["#e7e5e4", "#57534e", "#1c1917"], 0, 1)}${lin(c, ["#fff7cc", "#facc15", "#a16207"])}</defs>
        <path d="M18 14h14l-2 12H20Z" fill="url(#${b})" stroke="#0c0a09" stroke-width="3"/>
        <circle cx="24" cy="8" r="5" fill="#d6d3d1" opacity=".8"/><circle cx="34" cy="4" r="4" fill="#d6d3d1" opacity=".6"/>
        <rect x="10" y="26" width="50" height="34" rx="6" fill="url(#${b})" stroke="#0c0a09" stroke-width="4"/>
        <rect x="56" y="14" width="34" height="46" rx="5" fill="url(#${a})" stroke="#0c0a09" stroke-width="4"/>
        <rect x="63" y="21" width="20" height="16" rx="3" fill="#fef3c7" stroke="#0c0a09" stroke-width="3"/>
        <path d="M6 60h88v8H6Z" fill="url(#${c})" stroke="#0c0a09" stroke-width="3"/>
        <path d="M4 66 12 76H2Z" fill="url(#${c})" stroke="#0c0a09" stroke-width="2.5" stroke-linejoin="round"/>
        <g fill="url(#${a})" stroke="#0c0a09" stroke-width="3.5"><circle cx="24" cy="78" r="11"/><circle cx="50" cy="78" r="11"/><circle cx="76" cy="78" r="11"/></g>
        <g fill="url(#${c})"><circle cx="24" cy="78" r="3.5"/><circle cx="50" cy="78" r="3.5"/><circle cx="76" cy="78" r="3.5"/></g>
        <path d="M24 78h52" stroke="#0c0a09" stroke-width="3"/>
        <circle cx="10" cy="43" r="5" fill="#fef9c3" stroke="#0c0a09" stroke-width="2.5"/>
        ${shine("M16 32h30")}`;
    },
    collector() {
      return medal(
        `<path d="M36 30v14a14 14 0 0 0 28 0V30" stroke="#1c0a00" stroke-width="12" fill="none" stroke-linecap="butt"/>
         <path d="M36 30v14a14 14 0 0 0 28 0V30" stroke="#ef4444" stroke-width="7" fill="none"/>
         <path d="M33 30h8M59 30h8" stroke="#e2e8f0" stroke-width="7"/>`,
        ["#fff7cc", "#facc15", "#a16207"], ["#fef3c7", "#d97706"], "COLLECT", ["#f87171", "#b91c1c", "#450a0a"],
      );
    },
    payer() {
      return medal(
        `<path d="M50 24v40M40 34l10-10 10 10M40 54l10 10 10-10" stroke="#1c0a00" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
         <circle cx="50" cy="44" r="9" fill="#fde047" stroke="#1c0a00" stroke-width="3"/>`,
        ["#bbf7d0", "#22c55e", "#14532d"], ["#dcfce7", "#16a34a"], "PAYER", ["#4ade80", "#15803d", "#052e16"],
      );
    },
    sniper() {
      return medal(
        `<circle cx="50" cy="44" r="16" fill="none" stroke="#1c0a00" stroke-width="4"/>
         <path d="M50 22v12M50 54v12M28 44h12M60 44h12" stroke="#1c0a00" stroke-width="4" stroke-linecap="round"/>
         <circle cx="50" cy="44" r="4" fill="#dc2626"/>`,
        ["#bfdbfe", "#3b82f6", "#1e3a8a"], ["#e0f2fe", "#38bdf8"], "SNIPER", ["#60a5fa", "#1d4ed8", "#0b1533"],
      );
    },
    pcollector() {
      return medal(
        `<path d="M36 30v14a14 14 0 0 0 28 0V30" stroke="#1c0a00" stroke-width="12" fill="none"/>
         <path d="M36 30v14a14 14 0 0 0 28 0V30" stroke="#a855f7" stroke-width="7" fill="none"/>
         <path d="M33 30h8M59 30h8" stroke="#fde047" stroke-width="7"/>`,
        ["#fdf4ff", "#c026d3", "#4a044e"], ["#fae8ff", "#a21caf"], "∞ COLLECT", ["#e879f9", "#a21caf", "#3b0764"],
      );
    },
    ppayer() {
      return medal(
        `<path d="M50 24v40M40 34l10-10 10 10M40 54l10 10 10-10" stroke="#1c0a00" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
         <circle cx="50" cy="44" r="9" fill="#e879f9" stroke="#1c0a00" stroke-width="3"/>`,
        ["#fdf4ff", "#c026d3", "#4a044e"], ["#fae8ff", "#a21caf"], "∞ PAYER", ["#e879f9", "#a21caf", "#3b0764"],
      );
    },
  };
}
