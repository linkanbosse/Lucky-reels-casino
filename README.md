# Lucky Reels 🎰

Ett socialt casino med **låtsasmynt** – slots, bordsspel och topplistor. Inga riktiga pengar används.

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
  lib/wallet.js         Plånbok för låtsasmynt (debit/credit/bonus)
  lib/storage.js        Säker localStorage
  ui/symbols.js         Slotsymboler i SVG (delas med slotmotorn)
  ui/art.js             Genererad omslagsgrafik för spelkort
  ui/icons.js           Ikoner och myntgrafik
  ui/feedback.js        Toast, modal, myntregn
  ui/hero-machine.js    Demoautomaten på startsidan
  slot/engine.js        Slotmotorns matematik (ren logik, ingen DOM)
  slot/slot-game.js     Gemensamt spelgränssnitt: hjul, vinster, autospel, free spins
  slot/audio.js         Syntetiserade ljudeffekter (Web Audio)
  slot/coins.js         Myntregn vid storvinster
  slot/games/<id>.js    Ett spels konfiguration: symboler, vinster, vikter, specialfunktioner
games/<id>/index.html   Spelsidan (laddar konfigurationen och slot-game.js)
tools/simulate.mjs      Simulerar ett spel och räknar ut RTP
.github/workflows/      Publicering till GitHub Pages
```

## Färdplan

1. ✅ Repo, lobby, designsystem, GitHub Pages
2. ✅ Gemensam slotmotor + Golden Sevens, Diamond Rush, Royal Crown
3. Inloggning och sparat saldo med Supabase
4. Topplistor + resterande slots (10–15 totalt)

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

## Publicering

Varje push till `main` publiceras automatiskt via GitHub Actions (fliken **Actions** visar status).
Engångsinställning: **Settings → Pages → Source: GitHub Actions**.

## Testa lokalt (valfritt)

```
python3 -m http.server 8080
```
och öppna http://localhost:8080. Sidan använder ES-moduler och måste därför köras via en server, inte som fil.
