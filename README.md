# Lucky Reels 🎰

Ett socialt casino med **låtsaspengar i kronor** – slots, bordsspel och topplistor. Inga riktiga pengar används.

**Live:** https://linkanbosse.github.io/Lucky-reels-casino/

## Arkitektur

Ren HTML, CSS och JavaScript-moduler. Inget byggsteg, inga npm-paket – allt kan redigeras direkt i GitHub från mobilen.

```
index.html              Lobbyn
404.html                Felsida
manifest.webmanifest    Gör sidan installerbar som app
css/
  tokens.css            Designsystem: färger, typsnitt, avstånd, skuggor
  base.css              Grundstilar
  components.css        Knappar, saldochip, badges, chips, modal, toast
  lobby.css             Lobbyns layout (header, hero, spelkort, topplista)
js/
  main.js               Startpunkt för lobbyn
  data/games.js         Spelkatalogen – lobbyn byggs från denna lista
  lib/wallet.js         Plånbok för låtsaskronor (debit/credit/bonus, formatKr)
  lib/storage.js        Säker localStorage
  lib/account.js        Inloggning, profil och topplista via Supabase
  config.js             Supabase-adress och publik nyckel
  vendor/supabase.js    supabase-js 2.117.2 som ett ESM-paket (MIT)
  ui/account-ui.js      Inloggning, registrering, profil, nytt lösenord
  ui/symbols.js         Slotsymboler i SVG (delas med slotmotorn)
  ui/art.js             Genererad omslagsgrafik för spelkort
  ui/icons.js           Ikoner och myntgrafik
  ui/feedback.js        Toast, modal, myntregn
  ui/hero-machine.js    Demoautomaten på startsidan
  slot/engine.js        Slotmotorns matematik (ren logik, ingen DOM)
  slot/slot-game.js     Gemensamt spelgränssnitt: hjul, vinster, autospel, free spins
  slot/audio.js         Syntetiserade ljudeffekter (Web Audio)
  slot/coins.js         Myntregn/partiklar vid storvinster (per tema)
  slot/skins.js         Varje spels identitet: logga, typsnitt, symbolstil, ljud, partiklar
  slot/bets.js          Gemensam insatsstege 10–10 000 kr
css/skins/<id>.css      Varje spels egna ram, bakgrund, knappar och färger
  slot/games/<id>.js    Ett spels konfiguration: symboler, vinster, vikter, specialfunktioner
games/<id>/index.html   Spelsidan (laddar konfigurationen och slot-game.js)
tools/simulate.mjs      Simulerar ett spel och räknar ut RTP
supabase/schema.sql     Databasen: profiler, saldo, daglig bonus, säkra funktioner
.github/workflows/      Publicering till GitHub Pages
```

## Färdplan

1. ✅ Repo, lobby, designsystem, GitHub Pages
2. ✅ Gemensam slotmotor + Golden Sevens, Diamond Rush, Royal Crown
3. ✅ Avancerade slots: Cherry Blast (kluster), Moonlight Magic (kaskader), Pharaoh's Gold (Hold & Win)
4. ✅ Inloggning, sparat saldo och topplistor med Supabase
5. ✅ Bonusäventyr: Ghost Gulch (sticky exploderande wilds), Iron Lockdown (mystery-multiplikator), Steam Express (Hold & Win med specialsymboler), bonusköp
6. ✅ XP och nivåer, turneringar, adminpanel (`/admin/`), "titta på bilden"-belöning, Bjud på kaffe (Swish)
7. Bordsspel (blackjack, roulette) och resterande slots

## Lägga till en slot

1. Skapa `js/slot/games/<spel-id>.js` (kopiera en befintlig och ändra symboler, vinster och vikter).
2. Kopiera `games/golden-sevens/index.html` till `games/<spel-id>/index.html` och byt namnet i import-raden.
3. I `js/data/games.js`: sätt `status: "live"` och `url: "games/<spel-id>/"`.
4. Kontrollera återbetalningen: `node tools/simulate.mjs <spel-id> 2000000` (sikta på 94–97 %) och skriv in värdet som `rtp`.

| Spel | Rutnät | Linjer | Special | RTP (6 milj. snurr) |
|---|---|---|---|---|
| Golden Sevens | 3×3 | 5 | WILD dubblar vinsten | 95,6 % |
| Diamond Rush | 5×3 | 20 | Expanderande diamant-wild på hjul 2–4 | 96,0 % |
| Royal Crown | 5×3 | 25 | Free spins ×3, krona-wild, jackpott (6+ kronor) | 95,8 % |
| Cherry Blast | 6×5 | Kluster | Klustervinster, kaskader, multiplikatorbomber i free spins | ca 95,5 % |
| Moonlight Magic | 5×4 | 40 | Kaskader med multiplikator ×1–×5 (×3–×15 i free spins) | 96,4 % |
| Pharaoh's Gold | 5×3 | 20 | Hold & Win med Mini/Minor/Major/Grand | 95,3 % |

## Publicering

Varje push till `main` publiceras automatiskt via GitHub Actions (fliken **Actions** visar status).
Engångsinställning: **Settings → Pages → Source: GitHub Actions**.

## Testa lokalt (valfritt)

```
python3 -m http.server 8080
```
och öppna http://localhost:8080. Sidan använder ES-moduler och måste därför köras via en server, inte som fil.

## Konton med Supabase

Utan konto sparas saldot lokalt i webbläsaren. Med konto ligger saldot i Supabase och följer med mellan enheter.

Engångsinställning i Supabase-projektet:

1. **SQL Editor → New query**: klistra in hela `supabase/schema.sql` och tryck **Run**.
2. **Authentication → URL Configuration**: sätt **Site URL** till `https://linkanbosse.github.io/Lucky-reels-casino/`
   och lägg till samma adress under **Redirect URLs**.

Saldot ändras bara via databasfunktionerna (`play_round`, `claim_daily`, `refill`, `claim_watch_reward` m.fl.), som
kontrollerar inloggning, avstängning, insatsgräns och att saldot räcker. Spelresultaten räknas fortfarande ut i webbläsaren, så en tekniskt
kunnig spelare skulle kunna fuska till sig mynt inom gränserna. För låtsaspengar är det en rimlig avvägning;
helt fusksäkert kräver att snurren räknas ut på servern (t.ex. med en Supabase Edge Function).

### Göra någon till admin

Kör i **SQL Editor** (byt namnet mot rätt användarnamn):

```sql
update public.profiles set is_admin = true where username = 'Användarnamn';
```

Adminpanelen ligger på `/admin/` och visar statistik, spelare (saldo, avstängning, adminrätt), turneringar och
ett meddelande som visas överst i lobbyn. Alla adminfunktioner kontrolleras i databasen, inte bara i webbläsaren.

### Belöningsbilder

Bilderna som visas i 20 sekunder ligger i `assets/watch/` och listas i `WATCH_IMAGES` i `js/config.js`.
