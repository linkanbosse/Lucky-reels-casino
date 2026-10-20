// Lucky Reels – inloggning, registrering och profil (modaler).

import { account, friendlyError } from "../lib/account.js";
import { wallet, formatCoins } from "../lib/wallet.js";
import { icons } from "./icons.js";
import { openModal, closeModal, toast } from "./feedback.js";

const $ = (sel, root = document) => root.querySelector(sel);
const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const USERNAME_RE = /^[A-Za-z0-9_ÅÄÖåäö]{3,20}$/;

export function openAccount() {
  if (account.loggedIn) openProfile();
  else openAuth("login");
}

function openAuth(mode = "login") {
  const content = openModal(
    `<div class="auth">
      <div class="tabs" role="tablist">
        <button type="button" role="tab" data-mode="login" aria-selected="${mode === "login"}">Logga in</button>
        <button type="button" role="tab" data-mode="signup" aria-selected="${mode === "signup"}">Skapa konto</button>
      </div>
      <form class="form" novalidate>
        <p class="form__intro" data-intro></p>
        <label class="field" data-only="signup">
          <span>Användarnamn</span>
          <input name="username" autocomplete="username" minlength="3" maxlength="20" placeholder="Syns på topplistan" autocapitalize="off" spellcheck="false">
          <small data-hint="username">3–20 tecken: bokstäver, siffror och _</small>
        </label>
        <label class="field">
          <span>E-post</span>
          <input name="email" type="email" autocomplete="email" inputmode="email" required autocapitalize="off" spellcheck="false">
        </label>
        <label class="field" data-hide="reset">
          <span>Lösenord</span>
          <input name="password" type="password" minlength="6" required>
        </label>
        <p class="form__error" role="alert" data-error></p>
        <button class="btn btn--gold" type="submit" data-submit></button>
        <button class="link-btn" type="button" data-forgot>Glömt lösenordet?</button>
      </form>
    </div>`,
    "Konto",
  );

  const form = $("form", content);
  const errorEl = $("[data-error]", content);
  const submit = $("[data-submit]", content);

  function setMode(m) {
    mode = m;
    content.querySelectorAll("[data-mode]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.mode === m)));
    content.querySelectorAll("[data-only]").forEach((el) => (el.hidden = el.dataset.only !== m));
    content.querySelectorAll("[data-hide]").forEach((el) => (el.hidden = el.dataset.hide === m));
    $("[data-forgot]", content).hidden = m !== "login";
    $('[name="password"]', content).autocomplete = m === "signup" ? "new-password" : "current-password";
    submit.textContent = m === "signup" ? "Skapa konto" : m === "reset" ? "Skicka återställningslänk" : "Logga in";
    $("[data-intro]", content).textContent =
      m === "signup"
        ? "Spara ditt saldo i molnet, spela på flera enheter och tävla på topplistan. Nya konton får 10 000 mynt."
        : m === "reset"
          ? "Ange din e-post så skickar vi en länk där du väljer ett nytt lösenord."
          : "Logga in för att fortsätta med ditt sparade saldo.";
    errorEl.textContent = "";
  }

  content.querySelector(".tabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-mode]");
    if (b) setMode(b.dataset.mode);
  });
  $("[data-forgot]", content).addEventListener("click", () => setMode("reset"));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";
    const email = form.email.value.trim();
    const password = form.password.value;
    const username = form.username.value.trim();

    if (!/^\S+@\S+\.\S+$/.test(email)) return (errorEl.textContent = "Ange en giltig e-postadress.");
    if (mode !== "reset" && password.length < 6) return (errorEl.textContent = "Lösenordet måste vara minst 6 tecken.");
    if (mode === "signup" && !USERNAME_RE.test(username)) {
      return (errorEl.textContent = "Användarnamnet ska vara 3–20 tecken: bokstäver, siffror eller _.");
    }

    submit.disabled = true;
    const label = submit.textContent;
    submit.textContent = "Vänta…";
    try {
      if (mode === "signup") {
        if (!(await account.usernameAvailable(username))) {
          errorEl.textContent = "Användarnamnet är upptaget. Välj ett annat.";
          return;
        }
        const { needsConfirmation } = await account.signUp({ email, password, username });
        if (needsConfirmation) {
          showMessage("Kolla din e-post", `Vi har skickat en bekräftelselänk till <strong>${escapeHtml(email)}</strong>. Klicka på länken för att aktivera kontot – titta även i skräpposten.`);
        } else {
          closeModal();
          toast(`Välkommen, ${username}! Du har 10 000 mynt.`, { icon: icons.user });
        }
      } else if (mode === "reset") {
        await account.resetPassword(email);
        showMessage("Kolla din e-post", "Om det finns ett konto med den adressen har vi skickat en länk för att välja nytt lösenord.");
      } else {
        await account.signIn({ email, password });
        closeModal();
        toast("Du är inloggad", { icon: icons.user });
      }
    } catch (err) {
      errorEl.textContent = friendlyError(err);
    } finally {
      submit.disabled = false;
      if (submit.textContent === "Vänta…") submit.textContent = label;
    }
  });

  setMode(mode);
  requestAnimationFrame(() => (mode === "signup" ? form.username : form.email).focus());
}

function showMessage(title, html) {
  openModal(
    `<div class="auth"><h2 class="auth__title">${title}</h2><p class="form__intro">${html}</p>
      <button class="btn btn--gold" type="button" data-ok style="width:100%;margin-top:16px">OK</button></div>`,
    title,
  );
  $(".modal [data-ok]").addEventListener("click", closeModal);
}

function openProfile() {
  const p = account.profile;
  const s = wallet.stats;
  const content = openModal(
    `<div class="auth">
      <div class="profile-head">
        <span class="profile-avatar">${escapeHtml(p.username.slice(0, 1).toUpperCase())}</span>
        <div><h2 class="auth__title">${escapeHtml(p.username)}</h2><p class="form__intro">${escapeHtml(account.user.email ?? "")}</p></div>
      </div>
      <dl class="profile-stats">
        <div><dt>Saldo</dt><dd>${formatCoins(wallet.balance)}</dd></div>
        <div><dt>Största vinst</dt><dd>${formatCoins(s.biggestWin)}</dd></div>
        <div><dt>Antal snurr</dt><dd>${formatCoins(s.spins)}</dd></div>
        <div><dt>Totalt vunnet</dt><dd>${formatCoins(s.totalWon)}</dd></div>
      </dl>
      <p class="form__intro">Ditt saldo sparas i molnet och följer med till alla enheter där du loggar in.</p>
      <div class="profile-actions">
        ${wallet.canRefill() ? `<button class="btn btn--gold" type="button" data-refill>Fyll på mynt</button>` : ""}
        <button class="btn btn--ghost" type="button" data-logout ${wallet.canRefill() ? "" : 'style="grid-column:1/-1"'}>Logga ut</button>
      </div>
    </div>`,
    "Profil",
  );
  $("[data-refill]", content)?.addEventListener("click", () => {
    const amount = wallet.refill();
    closeModal();
    if (amount) toast(`Påfyllning! +${formatCoins(amount)} mynt`, { variant: "gold", icon: icons.gift });
  });
  $("[data-logout]", content).addEventListener("click", async () => {
    await account.signOut();
    closeModal();
    toast("Du är utloggad. Nu spelar du med det lokala saldot.", { icon: icons.user, duration: 3500 });
  });
}

function openNewPassword() {
  const content = openModal(
    `<div class="auth">
      <h2 class="auth__title">Välj nytt lösenord</h2>
      <form class="form" novalidate>
        <label class="field"><span>Nytt lösenord</span><input name="password" type="password" minlength="6" autocomplete="new-password" required></label>
        <p class="form__error" role="alert" data-error></p>
        <button class="btn btn--gold" type="submit">Spara lösenord</button>
      </form>
    </div>`,
    "Nytt lösenord",
  );
  const form = $("form", content);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.password.value.length < 6) return ($("[data-error]", content).textContent = "Minst 6 tecken.");
    try {
      await account.updatePassword(form.password.value);
      closeModal();
      toast("Lösenordet är bytt", { icon: icons.user });
    } catch (err) {
      $("[data-error]", content).textContent = friendlyError(err);
    }
  });
}

/** Kopplar konto-händelser till sidan: knapptexter, välkomstmeddelanden och felmeddelanden. */
export function bindAccountUi({ onChange } = {}) {
  let welcomed = false;
  account.onChange(({ event, user, profile }) => {
    document.querySelectorAll("[data-login-label]").forEach((el) => {
      el.textContent = profile ? profile.username : "Logga in";
    });
    document.body.classList.toggle("is-logged-in", !!profile);
    if (event === "PASSWORD_RECOVERY") openNewPassword();
    if (event === "SIGNED_IN" && profile && !welcomed && location.hash.includes("access_token")) {
      welcomed = true;
      toast(`Välkommen, ${profile.username}!`, { icon: icons.user });
    }
    if (user && !profile && event !== "INITIAL") {
      toast("Inloggad, men profilen kunde inte läsas. Har databasen satts upp?", { icon: icons.info, duration: 5000 });
    }
    onChange?.({ event, user, profile });
  });
  wallet.onError((text) => toast(text, { icon: icons.info, duration: 4000 }));
}
