// Lucky Reels – myntregn på canvas vid storvinster.
// kind väljer vad som regnar: coins, neon (konfetti), gems, candy, stars eller sparks.

const PALETTES = {
  neon: ["#ff3df0", "#22e3ff", "#fff35c", "#7cff6b", "#ff8a3d"],
  gems: ["#7df9ff", "#c084fc", "#f472b6", "#34d399", "#60a5fa"],
  candy: ["#ff4d8d", "#5eead4", "#fde047", "#c084fc", "#fb923c"],
  stars: ["#fef9c3", "#e0e7ff", "#fde68a", "#c4b5fd"],
  sparks: ["#fde047", "#fb923c", "#fff7ed"],
};

let defaultKind = "coins";
/** Väljer vad som regnar i det här spelet. */
export function setShowerKind(kind) {
  defaultKind = kind ?? "coins";
}

export function coinShower({ duration = 3000, intensity = 1, parent = document.body, kind = defaultKind } = {}) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  const canvas = document.createElement("canvas");
  canvas.className = "coin-canvas";
  parent.prepend(canvas);
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  let w = 0;
  let h = 0;
  const resize = () => {
    w = canvas.width = Math.round(innerWidth * dpr);
    h = canvas.height = Math.round(innerHeight * dpr);
  };
  resize();
  addEventListener("resize", resize);

  const coins = [];
  const palette = PALETTES[kind] ?? null;
  const spawnUntil = performance.now() + duration;
  const rate = 0.3 + 0.2 * intensity; // mynt per bildruta i snitt

  function spawn() {
    const size = (7 + Math.random() * 6) * dpr;
    coins.push({
      x: w * (0.2 + Math.random() * 0.6),
      y: h + size,
      vx: (Math.random() - 0.5) * 9 * dpr,
      vy: -(14 + Math.random() * 10) * dpr,
      size,
      spin: Math.random() * Math.PI * 2,
      spinSpeed: 0.12 + Math.random() * 0.2,
      color: palette ? palette[Math.floor(Math.random() * palette.length)] : null,
    });
  }

  function drawCoin(c) {
    const sx = Math.abs(Math.cos(c.spin)) * 0.85 + 0.15;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(sx, 1);
    const g = ctx.createRadialGradient(-c.size * 0.3, -c.size * 0.3, c.size * 0.1, 0, 0, c.size);
    g.addColorStop(0, "#fff4c2");
    g.addColorStop(0.45, "#ffcf5a");
    g.addColorStop(1, "#b8700c");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, c.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(168, 98, 7, 0.9)";
    ctx.lineWidth = c.size * 0.12;
    ctx.beginPath();
    ctx.arc(0, 0, c.size * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function star(r, inner) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5 - Math.PI / 2;
      const rr = i % 2 ? inner : r;
      ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    ctx.closePath();
  }

  function drawPiece(c) {
    if (kind === "coins" || !palette) return drawCoin(c);
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.spin);
    const s = c.size;
    ctx.fillStyle = c.color;
    if (kind === "neon") {
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 12;
      ctx.scale(1, Math.abs(Math.cos(c.spin * 1.3)) * 0.8 + 0.2);
      ctx.fillRect(-s * 0.9, -s * 0.35, s * 1.8, s * 0.7);
    } else if (kind === "gems") {
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.8, -s * 0.2);
      ctx.lineTo(0, s * 1.1);
      ctx.lineTo(-s * 0.8, -s * 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.55)";
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.lineTo(s * 0.8, -s * 0.2);
      ctx.lineTo(0, -s * 0.05);
      ctx.closePath();
      ctx.fill();
    } else if (kind === "candy") {
      ctx.beginPath();
      ctx.arc(0, 0, s, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.85)";
      ctx.lineWidth = s * 0.25;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.55, 0, Math.PI * 1.3);
      ctx.stroke();
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.moveTo(-s, 0);
      ctx.lineTo(-s * 1.7, -s * 0.6);
      ctx.lineTo(-s * 1.7, s * 0.6);
      ctx.moveTo(s, 0);
      ctx.lineTo(s * 1.7, -s * 0.6);
      ctx.lineTo(s * 1.7, s * 0.6);
      ctx.fill();
    } else if (kind === "stars") {
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 14;
      star(s * 1.1, s * 0.45);
      ctx.fill();
    } else {
      // gnistor
      ctx.shadowColor = c.color;
      ctx.shadowBlur = 10;
      ctx.rotate(Math.atan2(c.vy, c.vx) - c.spin);
      ctx.fillRect(-s * 1.4, -s * 0.18, s * 2.8, s * 0.36);
    }
    ctx.restore();
  }

  let raf = 0;
  let stopped = false;
  function frame(now) {
    if (!stopped && now < spawnUntil && coins.length < 40 + 30 * intensity) {
      let n = rate;
      while (n >= 1 || Math.random() < n) {
        spawn();
        n -= 1;
        if (n <= 0) break;
      }
    }
    ctx.clearRect(0, 0, w, h);
    for (let i = coins.length - 1; i >= 0; i--) {
      const c = coins[i];
      c.vy += 0.45 * dpr;
      c.x += c.vx;
      c.y += c.vy;
      c.spin += c.spinSpeed;
      if (c.y > h + c.size * 2 && c.vy > 0) coins.splice(i, 1);
      else drawPiece(c);
    }
    if (coins.length || (!stopped && now < spawnUntil)) raf = requestAnimationFrame(frame);
    else cleanup();
  }

  function cleanup() {
    cancelAnimationFrame(raf);
    removeEventListener("resize", resize);
    canvas.remove();
  }

  raf = requestAnimationFrame(frame);
  return () => {
    stopped = true;
  };
}
