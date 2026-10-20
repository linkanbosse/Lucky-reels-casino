// Lucky Reels – liten dekorativ spelautomat i hero-sektionen.
// Snurrar av sig själv med jämna mellanrum och när man trycker på den.

import { symbolSvg } from "./symbols.js";

const POOL = ["seven", "cherry", "bell", "diamond", "crown", "clover", "star", "bar"];
const CELL = 104; // px, måste matcha .reel i lobby.css
const STRIP = 18; // antal symboler per remsa

const pick = () => POOL[Math.floor(Math.random() * POOL.length)];

export function mountHeroMachine(root) {
  const reels = [...root.querySelectorAll(".reel__strip")];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let spinning = false;

  // Startläge: tre sjuor
  reels.forEach((strip) => {
    strip.innerHTML = symbolSvg("seven");
  });

  async function spin() {
    if (spinning) return;
    spinning = true;
    const win = Math.random() < 0.35;
    const winSymbol = pick();

    await Promise.all(
      reels.map((strip, i) => {
        const final = win ? winSymbol : pick();
        const current = strip.lastElementChild?.outerHTML ?? symbolSvg("seven");
        const names = Array.from({ length: STRIP - 2 }, pick);
        // Remsan rullar nedåt: sista symbolen hamnar överst, nuvarande längst ner
        strip.innerHTML = symbolSvg(final) + names.map((n) => symbolSvg(n)).join("") + current;
        const distance = (STRIP - 1) * CELL;
        if (reduced) {
          strip.innerHTML = symbolSvg(final);
          return Promise.resolve();
        }
        const anim = strip.animate(
          [
            { transform: `translateY(${-distance}px)`, filter: "blur(0)" },
            { transform: `translateY(${-distance * 0.4}px)`, filter: "blur(2px)", offset: 0.5 },
            { transform: "translateY(6px)", filter: "blur(0)", offset: 0.92 },
            { transform: "translateY(0)" },
          ],
          { duration: 1100 + i * 280, easing: "cubic-bezier(.3,.1,.2,1)" },
        );
        return anim.finished.then(() => {
          strip.innerHTML = symbolSvg(final);
        });
      }),
    );

    if (win) {
      root.animate(
        [{ boxShadow: "0 0 0 rgba(255,196,77,0)" }, { boxShadow: "0 0 60px rgba(255,196,77,.9)" }, { boxShadow: "0 0 0 rgba(255,196,77,0)" }],
        { duration: 900, iterations: 2 },
      );
    }
    spinning = false;
  }

  root.addEventListener("click", spin);
  root.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      spin();
    }
  });

  if (!reduced) {
    setTimeout(spin, 900);
    setInterval(() => {
      if (!document.hidden) spin();
    }, 7000);
  }
}
