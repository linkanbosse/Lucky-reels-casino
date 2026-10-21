// Lucky Reels – varje slots egen visuella identitet.
// CSS-delen (ram, hjul, knappar, bakgrund) ligger i css/skins/<spel-id>.css.
// Här finns det som behöver JavaScript: loggans text, ljudprofil, partiklar vid
// storvinst, vinstlinjernas färger och hur kortsymbolerna (10–A) ritas.
//
//   logo      – [huvudtext, undertext] i ramens skylt
//   sound     – ljudprofil i audio.js
//   particles – vad som regnar vid storvinst (coins.js)
//   royal     – { font, deco, colors: { ten, jack, queen, king, ace }: [ljus, mellan, mörk] }
//   lines     – färger på vinstlinjerna

export const SKINS = {
  "golden-sevens": {
    logo: ["Golden Sevens", "Vegas Neon"],
    sound: "neon",
    particles: "neon",
    lines: ["#ff3df0", "#22e3ff", "#fff35c", "#7cff6b", "#ff8a3d"],
    royal: { font: "Monoton", deco: "neon", colors: {} },
  },
  "diamond-rush": {
    logo: ["Diamond Rush", "Kristallgruvan"],
    sound: "crystal",
    particles: "gems",
    lines: ["#7df9ff", "#c4b5fd", "#f0abfc", "#a7f3d0", "#fde68a"],
    royal: {
      font: "Orbitron",
      deco: "crystal",
      colors: {
        ten: ["#e0f2fe", "#38bdf8", "#0c4a6e"],
        jack: ["#ccfbf1", "#2dd4bf", "#134e4a"],
        queen: ["#f5d0fe", "#e879f9", "#701a75"],
        king: ["#e0e7ff", "#818cf8", "#312e81"],
        ace: ["#ffffff", "#bae6fd", "#0369a1"],
      },
    },
  },
  "royal-crown": {
    logo: ["Royal Crown", "Kungens skattkammare"],
    sound: "royal",
    particles: "coins",
    lines: ["#ffd36b", "#ff5a7a", "#7dd3fc", "#c4b5fd", "#86efac"],
    royal: {
      font: "Cinzel Decorative",
      deco: "plaque",
      colors: {
        ten: ["#dbeafe", "#2563eb", "#172554"],
        jack: ["#dcfce7", "#15803d", "#052e16"],
        queen: ["#fae8ff", "#a21caf", "#3b0764"],
        king: ["#fee2e2", "#b91c1c", "#450a0a"],
        ace: ["#fef3c7", "#d97706", "#451a03"],
      },
    },
  },
  "cherry-blast": {
    logo: ["Cherry Blast", "Godisfabriken"],
    sound: "candy",
    particles: "candy",
    lines: ["#ff4d8d", "#5eead4", "#fde047", "#c084fc", "#fb923c"],
    royal: { font: "Lilita One", deco: "candy", colors: {} },
  },
  "moonlight-magic": {
    logo: ["Moonlight Magic", "Månskensriten"],
    sound: "mystic",
    particles: "stars",
    lines: ["#c4b5fd", "#7dd3fc", "#f9a8d4", "#fde68a", "#a7f3d0"],
    royal: {
      font: "Uncial Antiqua",
      deco: "mystic",
      colors: {
        ten: ["#e0f2fe", "#7dd3fc", "#1e3a8a"],
        jack: ["#d1fae5", "#6ee7b7", "#064e3b"],
        queen: ["#fce7f3", "#f9a8d4", "#831843"],
        king: ["#ede9fe", "#a78bfa", "#2e1065"],
        ace: ["#fefce8", "#fde68a", "#713f12"],
      },
    },
  },
  "pharaohs-gold": {
    logo: ["Pharaoh's Gold", "Faraos gravkammare"],
    sound: "egypt",
    particles: "coins",
    lines: ["#ffd36b", "#38bdf8", "#f87171", "#34d399", "#e9d5ff"],
    royal: {
      font: "Marcellus SC",
      deco: "stone",
      colors: {
        ten: ["#bae6fd", "#0369a1", "#082f49"],
        jack: ["#a7f3d0", "#047857", "#022c22"],
        queen: ["#fecaca", "#b91c1c", "#450a0a"],
        king: ["#c7d2fe", "#1d4ed8", "#172554"],
        ace: ["#fef08a", "#ca8a04", "#422006"],
      },
    },
  },
  "ghost-gulch": {
    logo: ["Ghost Gulch", "Spökstaden"],
    sound: "western",
    particles: "coins",
    lines: ["#fb923c", "#fde68a", "#f87171", "#a3e635", "#e5e7eb"],
    royal: {
      font: "Rye",
      deco: "wood",
      colors: {
        ten: ["#fde68a", "#d97706", "#451a03"],
        jack: ["#fed7aa", "#ea580c", "#431407"],
        queen: ["#fecaca", "#dc2626", "#450a0a"],
        king: ["#e7e5e4", "#a8a29e", "#1c1917"],
        ace: ["#fef9c3", "#facc15", "#422006"],
      },
    },
  },
  "iron-lockdown": {
    logo: ["Iron Lockdown", "Högsäkerhetsfängelset"],
    sound: "prison",
    particles: "sparks",
    lines: ["#facc15", "#f97316", "#38bdf8", "#f43f5e", "#a3e635"],
    royal: {
      font: "Black Ops One",
      deco: "steel",
      colors: {
        ten: ["#bae6fd", "#0284c7", "#082f49"],
        jack: ["#bbf7d0", "#16a34a", "#052e16"],
        queen: ["#fed7aa", "#ea580c", "#431407"],
        king: ["#fecaca", "#dc2626", "#450a0a"],
        ace: ["#fef08a", "#eab308", "#422006"],
      },
    },
  },
  "steam-express": {
    logo: ["Steam Express", "Guldtåget"],
    sound: "steam",
    particles: "coins",
    lines: ["#fbbf24", "#f97316", "#fde68a", "#fca5a5", "#93c5fd"],
    royal: {
      font: "Alfa Slab One",
      deco: "brass",
      colors: {
        ten: ["#e0f2fe", "#0ea5e9", "#0c4a6e"],
        jack: ["#d1fae5", "#10b981", "#064e3b"],
        queen: ["#fce7f3", "#db2777", "#500724"],
        king: ["#fee2e2", "#dc2626", "#450a0a"],
        ace: ["#fef9c3", "#eab308", "#422006"],
      },
    },
  },
};

export const skinFor = (id) => SKINS[id] ?? { logo: [id, ""], sound: "classic", particles: "coins", royal: null };
