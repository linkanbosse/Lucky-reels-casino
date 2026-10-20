// Lucky Reels – nivåmärke med XP-ring, XP-list i spelen och firande vid ny nivå.

import { wallet, formatCoins } from "../lib/wallet.js";
import { progress, titleFor } from "../lib/levels.js";
import { toast, coinBurst } from "./feedback.js";
import { icons } from "./icons.js";

const R = 15;
const C = 2 * Math.PI * R;

/** Runt nivåmärke med XP-ring. Uppdateras automatiskt. */
export function mountLevelBadge(el) {
  el.classList.add("level-badge");
  el.innerHTML = `<svg viewBox="0 0 36 36" aria-hidden="true">
      <circle cx="18" cy="18" r="${R}" class="level-badge__track"/>
      <circle cx="18" cy="18" r="${R}" class="level-badge__ring" stroke-dasharray="${C}" transform="rotate(-90 18 18)"/>
    </svg><b data-level-num></b>`;
  const ring = el.querySelector(".level-badge__ring");
  const num = el.querySelector("[data-level-num]");
  const render = () => {
    const p = progress(wallet.stats.xp);
    num.textContent = p.level;
    ring.style.strokeDashoffset = String(C * (1 - p.pct / 100));
    el.title = `Nivå ${p.level} – ${titleFor(p.level)} · ${formatCoins(p.into)}/${formatCoins(p.needed)} XP till nästa nivå`;
    el.setAttribute("aria-label", el.title);
  };
  wallet.onChange(render);
  render();
  return render;
}

/** Tunn XP-list (används under spelens toppfält). */
export function mountXpBar(el) {
  el.classList.add("xp-bar");
  el.innerHTML = `<span class="xp-bar__fill"></span><span class="xp-bar__label"></span>`;
  const fill = el.firstElementChild;
  const label = el.lastElementChild;
  const render = () => {
    const p = progress(wallet.stats.xp);
    fill.style.width = `${p.pct}%`;
    label.textContent = `Nivå ${p.level} · ${Math.floor(p.pct)} %`;
  };
  wallet.onChange(render);
  render();
}

/** Visar ett firande när spelaren når en ny nivå. */
export function celebrateLevelUps(anchor = () => document.querySelector(".level-badge")) {
  wallet.onLevelUp(({ level, reward }) => {
    const el = anchor();
    if (el) {
      el.classList.remove("is-levelup");
      void el.offsetWidth;
      el.classList.add("is-levelup");
      coinBurst(el, 14);
    }
    toast(`Nivå ${level} – ${titleFor(level)}! +${formatCoins(reward)} mynt`, { variant: "gold", icon: icons.star, duration: 4200 });
  });
}
