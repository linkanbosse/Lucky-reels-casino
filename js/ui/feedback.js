// Lucky Reels – toasts, modal och myntanimation

import { icons, coinSvg } from "./icons.js";

/* ---------- Toast ---------- */
let toastRoot;

export function toast(message, { variant = "", icon = "", duration = 2800 } = {}) {
  toastRoot ??= document.querySelector(".toasts");
  const el = document.createElement("div");
  el.className = `toast${variant ? ` toast--${variant}` : ""}`;
  el.setAttribute("role", "status");
  el.innerHTML = `${icon}<span></span>`;
  el.querySelector("span").textContent = message;
  toastRoot.append(el);
  setTimeout(() => {
    el.classList.add("is-leaving");
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }, duration);
}

/* ---------- Modal ---------- */
let modalEl;
let lastFocus = null;

function ensureModal() {
  if (modalEl) return modalEl;
  modalEl = document.createElement("div");
  modalEl.className = "modal";
  modalEl.setAttribute("aria-hidden", "true");
  modalEl.innerHTML = `
    <div class="modal__panel" role="dialog" aria-modal="true">
      <button class="btn btn--icon modal__close" type="button" aria-label="Stäng">${icons.close}</button>
      <div class="modal__content"></div>
    </div>`;
  modalEl.addEventListener("click", (e) => {
    if (e.target === modalEl || e.target.closest(".modal__close")) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalEl.classList.contains("is-open")) closeModal();
  });
  document.body.append(modalEl);
  return modalEl;
}

export function openModal(html, label = "Dialog") {
  const el = ensureModal();
  lastFocus = document.activeElement;
  el.querySelector(".modal__content").innerHTML = html;
  el.querySelector(".modal__panel").setAttribute("aria-label", label);
  el.setAttribute("aria-hidden", "false");
  el.classList.add("is-open");
  document.body.style.overflow = "hidden";
  requestAnimationFrame(() => el.querySelector(".modal__close").focus());
  return el.querySelector(".modal__content");
}

export function closeModal() {
  if (!modalEl) return;
  modalEl.classList.remove("is-open");
  modalEl.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  lastFocus?.focus?.();
}

/* ---------- Myntregn ---------- */
export function coinBurst(fromEl, count = 14) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const r = fromEl.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  for (let i = 0; i < count; i++) {
    const wrap = document.createElement("div");
    wrap.className = "coin-burst";
    wrap.innerHTML = coinSvg();
    const angle = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 90;
    wrap.style.left = `${x - 11}px`;
    wrap.style.top = `${y - 11}px`;
    wrap.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
    wrap.style.setProperty("--dy", `${Math.sin(angle) * dist - 40}px`);
    wrap.style.setProperty("--rot", `${(Math.random() - 0.5) * 720}deg`);
    wrap.style.animationDelay = `${i * 18}ms`;
    document.body.append(wrap);
    wrap.addEventListener("animationend", () => wrap.remove(), { once: true });
  }
}
