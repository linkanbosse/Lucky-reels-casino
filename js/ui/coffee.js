// Lucky Reels – "Bjud mig på kaffe" via Swish.
// Öppnar Swish med numret och beloppet ifyllt (Swish officiella betallänk,
// app.swish.nu/1/p/sw/). På en dator visar länken en QR-kod att skanna.

import { SWISH_NUMBER } from "../config.js";
import { openModal } from "./feedback.js";

const PRESETS = [20, 50, 100];

export function swishUrl(amount, message = "Kaffe till Lucky Reels") {
  // Swish vill ha %20 för mellanslag (inte +), så kodningen görs för hand
  return `https://app.swish.nu/1/p/sw/?sw=${SWISH_NUMBER}&amt=${Number(amount).toFixed(1)}&msg=${encodeURIComponent(message)}&edit=amt,msg`;
}

const cupSvg = `<svg viewBox="0 0 64 64" aria-hidden="true" class="coffee__cup">
  <path d="M22 6c-3 4 3 6 0 10M32 4c-3 4 3 6 0 10M42 6c-3 4 3 6 0 10" stroke="#e7e5e4" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>
  <path d="M10 22h40v14c0 11-9 20-20 20S10 47 10 36Z" fill="#fde68a" stroke="#78350f" stroke-width="3.5" stroke-linejoin="round"/>
  <path d="M14 26h32" stroke="#78350f" stroke-width="5" stroke-linecap="round"/>
  <path d="M50 26h3a7 7 0 0 1 0 14h-4" stroke="#78350f" stroke-width="3.5" fill="none"/>
  <path d="M6 58h48" stroke="#78350f" stroke-width="3.5" stroke-linecap="round"/>
</svg>`;

export function openCoffee() {
  const content = openModal(
    `<div class="coffee">
      ${cupSvg}
      <h2 class="auth__title" style="padding:0">Bjud mig på kaffe</h2>
      <p class="form__intro">Lucky Reels är gratis och utan riktiga insatser. Gillar du sidan får du gärna bjuda på en kaffe – helt frivilligt, och du får inga låtsaspengar eller fördelar för det.</p>
      <div class="coffee__amounts" role="group" aria-label="Välj belopp">
        ${PRESETS.map((a, i) => `<button type="button" class="chip" data-amt="${a}" aria-pressed="${i === 1}">${a} kr</button>`).join("")}
      </div>
      <label class="field">
        <span>Valfri summa (kr)</span>
        <input name="amount" type="number" inputmode="numeric" min="1" max="10000" step="1" value="50">
      </label>
      <p class="form__error" role="alert" data-error></p>
      <a class="btn btn--gold coffee__go" data-swish href="${swishUrl(50)}" target="_blank" rel="noopener">Öppna Swish</a>
      <p class="coffee__note">Öppnas i Swish-appen. På en dator visas en QR-kod som du skannar med telefonen.</p>
    </div>`,
    "Bjud på kaffe",
  );
  const input = content.querySelector("[name=amount]");
  const link = content.querySelector("[data-swish]");
  const error = content.querySelector("[data-error]");

  const update = () => {
    const v = Math.floor(Number(input.value));
    const ok = v >= 1 && v <= 10000;
    error.textContent = ok ? "" : "Ange ett belopp mellan 1 och 10 000 kr.";
    link.classList.toggle("is-disabled", !ok);
    link.setAttribute("aria-disabled", String(!ok));
    if (ok) link.href = swishUrl(v);
    content.querySelectorAll("[data-amt]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.amt) === v)));
  };

  content.querySelector(".coffee__amounts").addEventListener("click", (e) => {
    const b = e.target.closest("[data-amt]");
    if (!b) return;
    input.value = b.dataset.amt;
    update();
  });
  input.addEventListener("input", update);
  link.addEventListener("click", (e) => {
    if (link.classList.contains("is-disabled")) e.preventDefault();
  });
}
