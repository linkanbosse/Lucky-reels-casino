// Lucky Reels – stämningsbakgrund för spelsidorna.
// En silhuett av spelets miljö längst ner (SVG) och svävande partiklar (canvas)
// i spelets glödfärg. Stängs av för den som valt reducerad rörelse.

const SCENES = {
  western: `<path d="M0 230 60 180l50 30 70-70 60 50 50-30 80 60 60-40 70 50v100H0Z" opacity=".55"/>
    <path d="M90 300V200h14v-30h12v30h14v100M70 230h20v-20h6v40M140 220h20v-24h6v44" opacity=".9"/>
    <path d="M300 300v-60h60v60M296 240h68l-34-26Z M410 300v-80h10v80M470 300v-40h50v40M466 260h58l-29-20Z" opacity=".8"/>`,
  prison: `<path d="M0 300V170h500v130Z" opacity=".45"/>
    <path d="M30 170V60M80 170V60M130 170V60M180 170V60M230 170V60M280 170V60M330 170V60M380 170V60M430 170V60M480 170V60" stroke="currentColor" stroke-width="8" opacity=".55"/>
    <path d="M0 60h500v10H0Z M0 165h500v10H0Z" opacity=".7"/>
    <path d="M420 0 300 300h80Z" opacity=".12"/>`,
  rail: `<path d="M0 300V220l80-30 70 20 90-50 80 40 90-30 90 30v120Z" opacity=".5"/>
    <path d="M0 270h500M0 290h500" stroke="currentColor" stroke-width="5" opacity=".7"/>
    <path d="M20 262v36M60 262v36M100 262v36M140 262v36M180 262v36M220 262v36M260 262v36M300 262v36M340 262v36M380 262v36M420 262v36M460 262v36" stroke="currentColor" stroke-width="6" opacity=".45"/>`,
  desert: `<path d="M0 300V240l70-20 90 25 100-40 120 30 120-20v85Z" opacity=".55"/>
    <path d="M300 240 360 150l60 90Z M380 240l40-60 40 60Z M80 240l50-80 50 80Z" opacity=".85"/>`,
  night: `<circle cx="400" cy="70" r="40" opacity=".5"/><path d="M0 300V230l90-40 80 30 100-60 90 50 140-30v120Z" opacity=".6"/>`,
  palace: `<path d="M60 300V170h40v-30l20-30 20 30v30h220v-30l20-30 20 30v30h40v130Z M220 170v-50l30-40 30 40v50" opacity=".55"/>`,
  gems: `<path d="M0 300 60 220l60 50 70-90 80 80 60-60 80 70 90-40v70Z" opacity=".5"/>`,
  neon: `<path d="M0 300V250h500v50Z" opacity=".5"/><path d="M40 250V120h60v130M150 250V80h80v170M290 250V140h50v110M390 250V100h70v150" opacity=".45"/>`,
  candy: `<circle cx="80" cy="260" r="60" opacity=".35"/><circle cx="260" cy="280" r="80" opacity=".3"/><circle cx="440" cy="250" r="55" opacity=".35"/>`,
};

export function mountAmbient(theme = {}) {
  const scene = SCENES[theme.scene];
  if (scene) {
    const el = document.createElement("div");
    el.className = "scene";
    el.setAttribute("aria-hidden", "true");
    el.innerHTML = `<svg viewBox="0 0 500 300" preserveAspectRatio="xMidYMax slice" fill="currentColor">${scene}</svg>`;
    document.body.prepend(el);
  }

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.className = "ambient";
  canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const ctx = canvas.getContext("2d");
  const color = theme.glow ?? "#ffd36b";
  const dpr = Math.min(2, devicePixelRatio || 1);
  let w = 0;
  let h = 0;

  function resize() {
    w = innerWidth;
    h = innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener("resize", resize);
  resize();

  const count = Math.round(Math.min(46, (w * h) / 16000));
  const make = (anywhere) => ({
    x: Math.random() * w,
    y: anywhere ? Math.random() * h : h + 10,
    r: 0.6 + Math.random() * 2.2,
    vy: 0.15 + Math.random() * 0.45,
    vx: (Math.random() - 0.5) * 0.25,
    phase: Math.random() * Math.PI * 2,
  });
  const parts = Array.from({ length: count }, () => make(true));

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(3, (now - last) / 16.7);
    last = now;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    for (const p of parts) {
      p.y -= p.vy * dt;
      p.x += (p.vx + Math.sin(now / 1400 + p.phase) * 0.15) * dt;
      if (p.y < -10) Object.assign(p, make(false));
      ctx.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(now / 900 + p.phase));
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
    if (!document.hidden) requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      last = performance.now();
      requestAnimationFrame(frame);
    }
  });
  requestAnimationFrame(frame);
}
