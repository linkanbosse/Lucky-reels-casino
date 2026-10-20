// Säker wrapper runt localStorage. Privat läge eller blockerad lagring
// får aldrig krascha sidan – då lever värdena bara i minnet.

const PREFIX = "lr:";
const memory = new Map();

export function load(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return memory.has(key) ? memory.get(key) : fallback;
  }
}

export function save(key, value) {
  memory.set(key, value);
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* lagring otillgänglig – minnet räcker */
  }
}
