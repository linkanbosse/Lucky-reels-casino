// Lucky Reels – konton via Supabase (inloggning, profil, topplistor).
//
// Sidan fungerar även utan konto: då sparas saldot bara lokalt i webbläsaren.
// Inloggade spelare får saldot sparat i databasen och syns på topplistan.

import { SUPABASE_URL, SUPABASE_KEY } from "../config.js";

let client = null;
let clientPromise = null;
let user = null;
let profile = null;
const listeners = new Set();

// Supabase-biblioteket laddas bara när det behövs, så sidan startar snabbt
function getClient() {
  if (client) return Promise.resolve(client);
  clientPromise ??= import("../vendor/supabase.js").then(({ createClient }) => {
    client = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" },
    });
    client.auth.onAuthStateChange((event, session) => {
      // Supabase rekommenderar att inte vänta på andra anrop inuti den här callbacken
      setTimeout(() => handleSession(event, session), 0);
    });
    return client;
  });
  return clientPromise;
}

let profileRequest = null;

async function handleSession(event, session) {
  const nextUser = session?.user ?? null;
  const changed = nextUser?.id !== user?.id;
  user = nextUser;
  if (!user) {
    profile = null;
  } else if (changed || !profile) {
    // Flera händelser kan komma samtidigt vid inloggning – hämta profilen bara en gång
    profileRequest ??= fetchProfile().finally(() => (profileRequest = null));
    profile = await profileRequest;
  }
  emit(event);
}

function emit(event) {
  for (const cb of listeners) cb({ event, user, profile });
}

async function fetchProfile() {
  if (!user) return null;
  const sb = await getClient();
  // Profilen skapas av en databastrigger vid registrering – försök några gånger
  for (let i = 0; i < 4; i++) {
    const { data, error } = await sb.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (data) return data;
    if (error) console.warn("Kunde inte läsa profil:", error.message);
    await new Promise((r) => setTimeout(r, 400 * (i + 1)));
  }
  return null;
}

const ERRORS = [
  [/invalid login credentials/i, "Fel e-post eller lösenord."],
  [/email not confirmed/i, "Bekräfta din e-post först – kolla inkorgen (och skräpposten)."],
  [/user already registered/i, "Det finns redan ett konto med den e-postadressen."],
  [/password should be at least|weak password/i, "Lösenordet måste vara minst 6 tecken."],
  [/unable to validate email|invalid email|email address .* is invalid/i, "E-postadressen ser inte giltig ut."],
  [/rate limit|too many requests|security purposes/i, "För många försök. Vänta en stund och försök igen."],
  [/failed to fetch|network/i, "Kunde inte nå servern. Kontrollera internetanslutningen."],
];

export function friendlyError(error) {
  const msg = error?.message ?? String(error);
  for (const [re, text] of ERRORS) if (re.test(msg)) return text;
  return `Något gick fel: ${msg}`;
}

// Adressen spelaren skickas tillbaka till från e-postlänkar (lobbyn)
function homeUrl() {
  const parts = location.pathname.split("/");
  const gamesIndex = parts.indexOf("games");
  const base = gamesIndex > 0 ? parts.slice(0, gamesIndex).join("/") + "/" : location.pathname.replace(/[^/]*$/, "");
  return location.origin + base;
}

export const account = {
  /** Startar Supabase och läser in en eventuell sparad session. */
  async init() {
    try {
      const sb = await getClient();
      const { data } = await sb.auth.getSession();
      await handleSession("INITIAL", data.session);
    } catch (e) {
      console.warn("Supabase kunde inte startas:", e);
      emit("OFFLINE");
    }
  },

  get user() {
    return user;
  },

  get profile() {
    return profile;
  },

  get loggedIn() {
    return !!user && !!profile;
  },

  onChange(cb) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },

  async usernameAvailable(name) {
    const sb = await getClient();
    const { data, error } = await sb.rpc("username_available", { p_name: name });
    if (error) throw error;
    return data;
  },

  async signUp({ email, password, username }) {
    const sb = await getClient();
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { username }, emailRedirectTo: homeUrl() },
    });
    if (error) throw error;
    // Utan e-postbekräftelse loggas man in direkt, annars måste länken i mejlet klickas
    return { needsConfirmation: !data.session };
  },

  async signIn({ email, password }) {
    const sb = await getClient();
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  async signOut() {
    const sb = await getClient();
    await sb.auth.signOut();
  },

  async resetPassword(email) {
    const sb = await getClient();
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: homeUrl() });
    if (error) throw error;
  },

  async updatePassword(password) {
    const sb = await getClient();
    const { error } = await sb.auth.updateUser({ password });
    if (error) throw error;
  },

  async refreshProfile() {
    profile = await fetchProfile();
    emit("PROFILE");
    return profile;
  },

  /** Anropar en databasfunktion (apply_round, claim_daily, refill). */
  async rpc(name, params) {
    const sb = await getClient();
    const { data, error } = await sb.rpc(name, params);
    if (error) throw error;
    return data;
  },

  async leaderboard(order = "balance", limit = 10) {
    const sb = await getClient();
    const query = (hideBanned) => {
      let q = sb.from("profiles").select("*").order(order, { ascending: false }).limit(limit);
      if (hideBanned) q = q.eq("banned", false);
      return q;
    };
    let { data, error } = await query(true);
    // Äldre databas utan kolumnen "banned": hämta utan filter
    if (error && /banned/.test(error.message)) ({ data, error } = await query(false));
    if (error) throw error;
    return data;
  },

  /** Pågående och nyligen avslutade turneringar med deltagare (bäst först). */
  async tournaments() {
    const sb = await getClient();
    const since = new Date(Date.now() - 3 * 864e5).toISOString();
    const { data: list, error } = await sb.from("tournaments").select("*").gt("ends_at", since).order("ends_at", { ascending: true });
    if (error) throw error;
    if (!list.length) return [];
    const { data: entries, error: e2 } = await sb
      .from("tournament_entries")
      .select("tournament_id, user_id, score, spins, prize, joined_at, profiles(username, level)")
      .in("tournament_id", list.map((t) => t.id))
      .order("score", { ascending: false })
      .limit(1000);
    if (e2) throw e2;
    for (const t of list) t.entries = entries.filter((e) => e.tournament_id === t.id);
    return list;
  },

  /** Delar ut priser i turneringar som tagit slut (säkert att anropa ofta). */
  async settleTournaments() {
    const sb = await getClient();
    await sb.rpc("settle_tournaments");
  },

  /** Läser en inställning (t.ex. "announcement") från databasen, eller null. */
  async setting(key) {
    const sb = await getClient();
    const { data, error } = await sb.from("settings").select("value").eq("key", key).maybeSingle();
    if (error) return null;
    return data?.value ?? null;
  },
};
