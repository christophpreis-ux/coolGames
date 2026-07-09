# Voltgarage

Ein Sammelkarten-Rennspiel im Booster-Stil: Elektro-Rennwagen und Fähigkeitskarten sammeln, gegen Gegner antreten – und dabei riskante Angebote auch mal ablehnen, denn wer verliert, muss sein eingesetztes Auto abgeben.

## Spielen

Einfach `index.html` in einem Browser öffnen, oder lokal servieren:

```bash
cd voltgarage
python3 -m http.server 8080
# dann http://localhost:8080 öffnen
```

## Spielprinzip

- Du startest mit 300 Credits und genau einem, ziemlich schlechten Auto: der **Rostlaube** (Speed 12 / Beschleunigung 10 / Handling 14). Sie zählt nicht zu den 50 sammelbaren Autos und taucht auch nicht in Boostern auf.
- Es gibt **vier Booster-Sorten**: Auto-Booster und Fähigkeiten-Booster, jeweils in Level 1 und Level 2. Jeder Booster enthält 5 Karten aus seinem Pool. Level 1 zieht mit Standard-Chancen (50 % Gewöhnlich, 28 % Ungewöhnlich, 14 % Selten, 6 % Episch, 2 % Legendär), Level 2 kostet das Dreifache und zieht deutlich besser (16/30/30/16/8 %).

| Booster | Preis | Inhalt |
|---|---|---|
| 📦 Auto-Booster Lv. 1 | 150 ⚡ | 5 Auto-Karten, Standard-Chancen |
| 🏆 Auto-Booster Lv. 2 | 450 ⚡ | 5 Auto-Karten, stark verbesserte Chancen |
| 🎴 Fähigkeiten-Booster Lv. 1 | 120 ⚡ | 5 Fähigkeitskarten, Standard-Chancen |
| ✨ Fähigkeiten-Booster Lv. 2 | 360 ⚡ | 5 Fähigkeitskarten, stark verbesserte Chancen |

- Die gezogenen Karten liegen erst **verdeckt** (Kartenrückseite mit ⚡-Logo) – du tippst sie einzeln an, und sie drehen sich mit einer 3D-Flip-Animation um.
- Über "Rennangebot einholen" fordert dich ein Gegner heraus. Du siehst sein Auto **vorher** und kannst annehmen oder ablehnen – bei Ablehnung passiert nichts.
- Nimmst du an, wählst du eins deiner Autos als Einsatz und optional bis zu 2 Fähigkeitskarten aus deinem Inventar (die dabei verbraucht werden).
- Das Rennen wird als kurze Animation zweier Boliden auf einer Strecke dargestellt, das Ergebnis steht aber schon vorher fest: Es basiert auf den Auto-Werten (Speed/Beschleunigung/Handling), etwaigen Fähigkeits-Boosts/Debuffs und einem Zufallsanteil.
- **Gewinnst** du: Credits (abhängig von der Seltenheit des Gegner-Autos) und eine kleine Chance, das Gegner-Auto obendrauf zu bekommen. **Verlierst** du: Dein eingesetztes Auto geht an den Gegner – außer eine Fähigkeit bewahrt es davor.
- Über "Sammlung" siehst du alle bisher entdeckten Autos und Fähigkeiten; noch nicht gefundene Karten erscheinen ausgegraut als "???". Dieser Sammlungsfortschritt bleibt auch nach einem Neustart erhalten.
- Der **Spielstand wird automatisch gespeichert** (localStorage): Credits, Garage, Fähigkeitskarten und Sammlung überleben das Schließen des Browsers, der Start-Button wird zu "Weiterspielen".
- "Neu starten" setzt Credits, Garage und Fähigkeitskarten auf den Anfangszustand zurück – die Sammlung (entdeckte Karten) bleibt unberührt.

## Die 50 Autos

10 Autos pro Seltenheitsstufe, jedes mit eigenen Speed-/Beschleunigungs-/Handling-Werten (1–100) und eigenem Farbschema. Je höher die Seltenheit, desto höher tendenziell die Werte – und desto auffälliger die Silhouette im Icon (Kombi → Limousine → Coupé mit Streifen → Muscle-Car mit Spoiler → leuchtender Hypercar).

| Seltenheit | Anzahl | Beispiele | Top-Werte (Speed/Beschl./Handling) |
|---|---|---|---|
| Gewöhnlich | 10 | Schrotthaufen, Zitronenflitzer, Blechbüchse, Wackeldackel-E, Gartenzwerg GT | ~20–30 |
| Ungewöhnlich | 10 | Stadtblitz, Alltagsrakete, Blauer Blitz, Vorstadtpanther | ~36–50 |
| Selten | 10 | Sturmvogel, Turbovolt X, Nachtschatten, Blitzrochen | ~50–68 |
| Episch | 10 | Photon-GT, Voltano, Hyperdrift, Schockwelle, Prisma-X | ~64–84 |
| Legendär | 10 | Quantenblitz, Ewigkeitsmotor, Voltgott, **Apex Volt** | ~80–100 |

Das stärkste Auto im Spiel ist **Apex Volt** (Speed 100 / Beschleunigung 96 / Handling 94), das schwächste die Start-Rostlaube.

Zusätzlich hat **jedes einzelne Auto** (alle 50 plus die Rostlaube) einen eigenen, permanent laufenden Animationseffekt, der zu seinem Namen passt – ein paar Beispiele:

- Die **Rostlaube** stottert graue Abgaswölkchen und hat Elektrik-Aussetzer, beim **Schrotthaufen** bröckeln Rostflocken ab, der **Wackeldackel-E** wackelt tatsächlich, und beim **Rentnerflitzer** blinkt der Blinker seit 1987 durchgehend.
- Der **Bürostuhl GT** verliert fliegende Akten, die **Nachbarschaftsrakete** feiert mit Konfetti, beim **Vorstadtpanther** lauern blinzelnde Panther-Augen hinter der Scheibe.
- **Funkenflug** sprüht eine Funkenfontäne, der **Nachtschatten** zieht Schattengeister hinter sich her, beim **Blitzrochen** gleiten Blitze unterm Unterboden entlang.
- **Titanblitz** wird regelmäßig vom Blitz getroffen, der **Neonstürmer** hat einen Neonrand in ständig wechselnder Farbe, **Prisma-X** bricht Licht in Regenbogenstrahlen.
- Bei den Legendären: **Singularität-X** saugt als schwarzes Loch Sterne an, der **Ewigkeitsmotor** dreht ein goldenes Uhrwerk, der **Unendlichkeitsantrieb** schickt Partikel auf eine ∞-Bahn, der **Zeitraffer-E** zieht Zeitraffer-Nachbilder hinter sich her, und **Apex Volt** trägt eine funkensprühende Blitzkrone.

## Die 53 Fähigkeitskarten

Jede Karte wird bei einem Rennen verbraucht (einmalig, danach aus dem Inventar entfernt) und wirkt sich auf genau dieses eine Rennen aus. Effekt-Kategorien:

| Kategorie | Beispiel (niedrigste → höchste Stufe) | Effekt |
|---|---|---|
| Eigene Werte boosten | Turbo-Kick I → Nitro-Schub II → Quantensprung | +10 % bis +55 % auf Tempo/Beschleunigung/Handling/alle Werte |
| Gegner schwächen | Sand im Getriebe I → Sabotage II → Systemkollaps | −8 % bis −50 % auf einzelne oder alle Gegner-Werte |
| Rennglück | Glücksbringer I/II, Perfekter Start | verringert den Zufalls-Nachteil im Rennwurf |
| **Teleport** | Kurz-Teleport → Blitz-Teleport → **Portal-Meister** | +25 % bis +70 % direkt auf den Rennwurf – im Rennen sichtbar als Portal-Sprung nach vorn |
| Belohnung erhöhen | Trinkgeld → Jackpot → Goldrausch | +20 % bis +250 % Credits bei Sieg |
| Schutz bei Niederlage | Rostschutz → Vollversicherung → **Unbesiegbar** | 20 % bis 100 % Chance, das Auto trotz Niederlage zu behalten |
| Auto stehlen | Diebstahlsicherung → Kopfgeldjäger II → **Autodieb** | +15 % bis 100 % zusätzliche Chance, das Gegner-Auto bei Sieg zu erbeuten |
| Sonderfälle | Ersatzteil, Doppelzug | feste Bonus-Credits unabhängig vom Ausgang |

Die drei Teleport-Karten springen im Rennen sichtbar nach vorn: Das Auto hängt erst zurück, dann öffnet sich ein Portal (türkiser Austritts-Ring, lila Eintritts-Ring, Energiespur) und es materialisiert weiter vorne. Der legendäre **Portal-Meister** teleportiert dein Auto bei einer Niederlage außerdem sicher nach Hause – der Gegner bekommt es garantiert nicht.

Die mächtigsten Karten im Spiel sind legendär:

- **Zeitmanipulation** – garantierter Sieg in diesem Rennen, unabhängig von den Auto-Werten.
- **Singularität** – garantierter Sieg **und** garantiert das Gegner-Auto erbeutet. Die stärkste Karte im Spiel.

## Technik

Reines HTML/CSS/JavaScript, kein Build-Schritt, keine externen Abhängigkeiten. Alle Auto-Icons werden als Seitenansicht-Silhouette auf Canvas 2D gezeichnet – eine eigene Zeichenfunktion pro Seltenheitsstufe (Kombi mit Rostflecken, Limousine mit Zierstreifen, Coupé mit Rennstreifen, Muscle-Car mit Hutzenhaube und Spoiler, Hypercar mit Leuchteffekt via `shadowBlur` und großem Heckflügel). Darüber liegt eine kleine FX-Engine: jedes Auto hat einen eigenen Effekt-Eintrag mit bis zu drei Hooks (`bg` hinter der Karosserie, `transform` für Bewegungen der Karosserie selbst, `fg` für Partikel davor). Eine einzige `requestAnimationFrame`-Schleife rendert alle sichtbaren Karten-Icons mit ~30 fps neu, sortiert nicht mehr eingehängte Canvases automatisch aus und überspringt unsichtbare; Partikelbahnen werden deterministisch aus einem Hash der Auto-ID abgeleitet, damit die Effekte stabil und flackerfrei loopen. Dieselben Effekte laufen auch live auf den fahrenden Autos in der Rennanimation. Autos und Fähigkeiten sind reine Datenlisten (`CARS` mit 50, `ABILITIES` mit 53 Einträgen), Booster-Ziehungen und Gegner-Auswahl laufen über eine gewichtete Zufallsfunktion (`pickWeightedRarity`) – die vier Booster-Sorten sind Einträge in einer `PACK_TYPES`-Tabelle mit eigenem Pool (Autos/Fähigkeiten), Preis und Seltenheits-Odds. Die verdeckten Booster-Karten sind ein reiner CSS-3D-Flip (`transform-style: preserve-3d`, `backface-visibility: hidden`, Rotation beim Klick). Der Renn-Ausgang wird vorab per Formel aus Auto-Werten, kombinierten Fähigkeits-Effekten und Zufallswurf bestimmt (`resolveRace`, Teleport wirkt als Multiplikator auf den Rennwurf); die anschließende Canvas-Animation (Countdown, Beschleunigungskurve, Ziellinie, ggf. sichtbarer Portal-Sprung) bildet dieses bereits feststehende Ergebnis nur visuell nach. Besitz-Inventare (`ownedCars`, `ownedAbilities`) sind flache ID-Arrays mit erlaubten Duplikaten, verbrauchte Fähigkeitskarten werden per Index aus dem Array entfernt. Der komplette Spielstand (Credits, Garage, Inventar, Sammlung) wird nach jeder Änderung automatisch als JSON in `localStorage` gespeichert und beim Laden validiert (unbekannte IDs werden verworfen); der Sammlungsfortschritt (`discoveredCars`/`discoveredAbilities`) ist bewusst von Credits/Garage/Inventar getrennt und übersteht daher auch einen Neustart im Spiel.
