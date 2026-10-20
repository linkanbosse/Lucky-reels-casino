# Lucky Reels 🎰

Ett socialt casino med **låtsasmynt** – slots, bordsspel och topplistor. Inga riktiga pengar används.

**Live:** https://linkanbosse.github.io/lucky-reels-casino/

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
games/                  Ett spel per mapp (kommer i steg 2)
.github/workflows/      Publicering till GitHub Pages
```

## Färdplan

1. ✅ Repo, lobby, designsystem, GitHub Pages
2. Gemensam slotmotor + de tre första slotsen
3. Inloggning och sparat saldo med Supabase
4. Topplistor + resterande slots (10–15 totalt)

## Lägga till ett spel

1. Skapa `games/<spel-id>/index.html`.
2. I `js/data/games.js`: sätt `status: "live"` och `url: "games/<spel-id>/"` på spelet.

## Publicering

Varje push till `main` publiceras automatiskt via GitHub Actions (fliken **Actions** visar status).
Engångsinställning: **Settings → Pages → Source: GitHub Actions**.

## Testa lokalt (valfritt)

```
python3 -m http.server 8080
```
och öppna http://localhost:8080. Sidan använder ES-moduler och måste därför köras via en server, inte som fil.
