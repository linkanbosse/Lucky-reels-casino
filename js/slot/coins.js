// Lucky Reels – myntregn på canvas vid storvinster.

export function coinShower({ duration = 3000, intensity = 1, parent = document.body } = {}) {
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
      else drawCoin(c);
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
