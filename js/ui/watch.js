// Lucky Reels – "Titta och få pengar": en bild visas i 20 sekunder, sedan får man låtsaspengar.

import { WATCH_IMAGES, WATCH_SECONDS } from "../config.js";
import { wallet, formatKr, WATCH_REWARD } from "../lib/wallet.js";
import { friendlyError } from "../lib/account.js";
import { toast, coinBurst } from "./feedback.js";
import { icons, coinSvg } from "./icons.js";

const R = 22;
const C = 2 * Math.PI * R;

export async function openWatch(base = "") {
  let start;
  try {
    start = await wallet.startWatch();
  } catch (e) {
    toast(/start_watch|PGRST202/.test(e?.message ?? "") ? "Funktionen är inte aktiverad i databasen än." : friendlyError(e), { icon: icons.info });
    return;
  }
  if (!start.ok) {
    toast(
      start.reason === "limit"
        ? "Du har tittat 10 gånger i dag – kom tillbaka i morgon!"
        : `Nästa gång om ${start.waitS >= 60 ? `${Math.ceil(start.waitS / 60)} min` : `${start.waitS} s`}.`,
      { icon: icons.tv },
    );
    return;
  }

  const src = base + WATCH_IMAGES[Math.floor(Math.random() * WATCH_IMAGES.length)];
  const el = document.createElement("div");
  el.className = "watch";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "Titta och få pengar");
  el.innerHTML = `
    <div class="watch__top">
      <span class="watch__tag">${icons.tv}Titta i ${WATCH_SECONDS} sekunder</span>
      <span class="watch__timer"><svg viewBox="0 0 50 50"><circle cx="25" cy="25" r="${R}" class="watch__track"/><circle cx="25" cy="25" r="${R}" class="watch__ring" stroke-dasharray="${C}" transform="rotate(-90 25 25)"/></svg><b data-left>${WATCH_SECONDS}</b></span>
    </div>
    <img class="watch__img" src="${src}" alt="Bild som visas för att tjäna låtsaspengar">
    <div class="watch__bottom">
      <button class="btn btn--gold" type="button" data-claim disabled>${coinSvg("icon")}<span>Vänta…</span></button>
      <button class="link-btn" type="button" data-skip>Avbryt utan belöning</button>
    </div>`;
  document.body.append(el);
  document.body.style.overflow = "hidden";
  const ring = el.querySelector(".watch__ring");
  const left = el.querySelector("[data-left]");
  const claim = el.querySelector("[data-claim]");

  // Klockan går bara när sidan syns
  let elapsed = 0;
  let last = performance.now();
  let raf = 0;
  const tick = (now) => {
    if (!document.hidden) elapsed += now - last;
    last = now;
    const t = Math.min(1, elapsed / (WATCH_SECONDS * 1000));
    ring.style.strokeDashoffset = String(C * (1 - t));
    left.textContent = String(Math.max(0, Math.ceil(WATCH_SECONDS - elapsed / 1000)));
    if (t < 1) raf = requestAnimationFrame(tick);
    else {
      claim.disabled = false;
      claim.querySelector("span").textContent = `Hämta ${formatKr(WATCH_REWARD)}`;
      claim.classList.add("pulse");
      left.textContent = "✓";
    }
  };
  raf = requestAnimationFrame(tick);

  const close = () => {
    cancelAnimationFrame(raf);
    el.remove();
    document.body.style.overflow = "";
  };
  el.querySelector("[data-skip]").addEventListener("click", close);
  claim.addEventListener("click", async () => {
    claim.disabled = true;
    try {
      const got = await wallet.claimWatch();
      close();
      if (got) {
        coinBurst(document.querySelector(".balance") ?? document.body, 16);
        toast(`Tack för att du tittade! +${formatKr(got)}`, { variant: "gold", icon: coinSvg("icon") });
      } else {
        toast("Belöningen kunde inte hämtas – försök igen om en stund.", { icon: icons.info });
      }
    } catch (e) {
      close();
      toast(friendlyError(e), { icon: icons.info });
    }
  });
}
