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

- Du startest mit 300 Credits und genau einem, ziemlich schlechten Auto: der **Rostlaube** (Speed 12 / Beschleunigung 10 / Handling 14). Sie zählt nicht zu den sammelbaren Autos und taucht auch nicht in Boostern auf.
- Im **Shop** gibt es **vier Booster-Sorten**: Auto-Booster und Fähigkeiten-Booster, jeweils in Level 1 und Level 2. Jeder Booster enthält 5 Karten aus seinem Pool. Level 1 zieht mit Standard-Chancen, Level 2 kostet das Dreifache und zieht deutlich besser – **nur im Auto-Booster Level 2 stecken göttliche Autos.**

| Booster | Preis | Inhalt |
|---|---|---|
| 📦 Auto-Booster Lv. 1 | 150 ⚡ | 5 Auto-Karten, Standard-Chancen |
| 🏆 Auto-Booster Lv. 2 | 450 ⚡ | 5 Auto-Karten, stark verbesserte Chancen, einzige Quelle für **Göttlich** |
| 🎴 Fähigkeiten-Booster Lv. 1 | 120 ⚡ | 5 Fähigkeitskarten, Standard-Chancen |
| ✨ Fähigkeiten-Booster Lv. 2 | 360 ⚡ | 5 Fähigkeitskarten, stark verbesserte Chancen |

- Die gezogenen Karten liegen erst **verdeckt** (Kartenrückseite mit ⚡-Logo) – du tippst sie einzeln an, und sie drehen sich mit einer 3D-Flip-Animation um.
- Über "Rennangebot einholen" fordert dich ein Gegner heraus. Du siehst sein Auto **vorher** und kannst annehmen oder ablehnen – bei Ablehnung passiert nichts.
- Nimmst du an, wählst du eins deiner Autos als Einsatz und optional bis zu 2 Fähigkeitskarten aus deinem Inventar.
- Das Rennen läuft aus der **Verfolgerperspektive** hinter deinem Auto, live simuliert auf einer **800 Meter langen Strecke** mit Kurven, Bäumen, Leitplanken und einem Zielbogen. Beide Autos fahren automatisch; ihre Geschwindigkeit ergibt sich direkt aus Speed/Beschleunigung/Handling – ein Auto mit doppelt so hohen Werten ist auch wirklich fast doppelt so schnell.
- **Aktive Fähigkeitskarten** (Nitro-Boosts, Debuffs, Teleport, Fallen, Geist) liegen während des Rennens als große Buttons unter der Strecke. Du entscheidest selbst, *wann* du sie zündest – nur tatsächlich gedrückte Karten werden verbraucht, ungenutzte bleiben im Inventar. Rein passive Karten (Glücksbringer, Belohnungs-Boni, Diebstahlchance, Schutz bei Niederlage) wirken automatisch im Hintergrund.
- Gegner können während des Rennens **angreifen** und dich kurz ausbremsen – außer die Fähigkeit **Geist** ist gerade aktiv, dann gehen Angriffe wirkungslos durch dich hindurch.
- **Gewinnst** du: Credits (abhängig von der Seltenheit des Gegner-Autos) und **immer auch das Gegner-Auto obendrauf**. **Verlierst** du: Dein eingesetztes Auto geht an den Gegner – außer eine Fähigkeit bewahrt es davor.
- Über "Sammlung" siehst du alle bisher entdeckten Autos und Fähigkeiten; noch nicht gefundene Karten erscheinen ausgegraut als "???". Dieser Sammlungsfortschritt bleibt auch nach einem Neustart erhalten.
- Der **Spielstand wird automatisch gespeichert** (localStorage): Credits, Garage, Fähigkeitskarten und Sammlung überleben das Schließen des Browsers, der Start-Button wird zu "Weiterspielen".
- "Neu starten" setzt Credits, Garage und Fähigkeitskarten auf den Anfangszustand zurück – die Sammlung (entdeckte Karten) bleibt unberührt.

## Die 56 Autos

10 Autos pro Seltenheitsstufe von Gewöhnlich bis Legendär, plus 6 **göttliche** Autos als neue Top-Stufe. Speed/Beschleunigung/Handling reichen bis 100 in den ersten fünf Stufen – göttliche Autos sprengen die Skala und erreichen bis zu 140. Je höher die Seltenheit, desto höher tendenziell die Werte – und desto auffälliger die Silhouette im Icon (Kombi → Limousine → Coupé mit Streifen → Muscle-Car mit Spoiler → leuchtender Hypercar → schwebender Energie-Flieger).

| Seltenheit | Anzahl | Beispiele | Top-Werte (Speed/Beschl./Handling) |
|---|---|---|---|
| Gewöhnlich | 10 | Schrotthaufen, Zitronenflitzer, Blechbüchse, Wackeldackel-E, Gartenzwerg GT | ~20–30 |
| Ungewöhnlich | 10 | Stadtblitz, Alltagsrakete, Blauer Blitz, Vorstadtpanther | ~36–50 |
| Selten | 10 | Sturmvogel, Turbovolt X, Nachtschatten, Blitzrochen | ~50–68 |
| Episch | 10 | Photon-GT, Voltano, Hyperdrift, Schockwelle, Prisma-X | ~64–84 |
| Legendär | 10 | Quantenblitz, Ewigkeitsmotor, Voltgott, Apex Volt | ~80–100 |
| **Göttlich** | 6 | Zeus-X, Helios Prime, Chronos Omega, Walhalla GT, Nova Divina, **Aether Unendlich** | ~118–140 |

Das stärkste Auto im Spiel ist **Aether Unendlich** (Speed 138 / Beschleunigung 132 / Handling 134), das schwächste die Start-Rostlaube. Weil die Renngeschwindigkeit direkt aus den Stats berechnet wird, ist der Unterschied nicht mehr kosmetisch: Ein göttliches Auto fährt real gut doppelt so schnell wie die Rostlaube und deutlich spürbar schneller als selbst Apex Volt.

Göttliche Autos sehen auch anders aus als alles andere: Statt auf Rädern zu rollen, **schweben** sie über einem Energiefeld, mit extrem flacher, gestreckter Karosserie und gläserner Kanzel statt normaler Windschutzscheibe.

Zusätzlich hat **jedes einzelne Auto** (alle 56 plus die Rostlaube) einen eigenen, permanent laufenden Animationseffekt, der zu seinem Namen passt – ein paar Beispiele:

- Die **Rostlaube** stottert graue Abgaswölkchen und hat Elektrik-Aussetzer, beim **Schrotthaufen** bröckeln Rostflocken ab, der **Wackeldackel-E** wackelt tatsächlich, und beim **Rentnerflitzer** blinkt der Blinker seit 1987 durchgehend.
- Der **Bürostuhl GT** verliert fliegende Akten, die **Nachbarschaftsrakete** feiert mit Konfetti, beim **Vorstadtpanther** lauern blinzelnde Panther-Augen hinter der Scheibe.
- **Funkenflug** sprüht eine Funkenfontäne, der **Nachtschatten** zieht Schattengeister hinter sich her, beim **Blitzrochen** gleiten Blitze unterm Unterboden entlang.
- **Titanblitz** wird regelmäßig vom Blitz getroffen, der **Neonstürmer** hat einen Neonrand in ständig wechselnder Farbe, **Prisma-X** bricht Licht in Regenbogenstrahlen.
- Bei den Legendären: **Singularität-X** saugt als schwarzes Loch Sterne an, der **Ewigkeitsmotor** dreht ein goldenes Uhrwerk, der **Unendlichkeitsantrieb** schickt Partikel auf eine ∞-Bahn, der **Zeitraffer-E** zieht Zeitraffer-Nachbilder hinter sich her, und **Apex Volt** trägt eine funkensprühende Blitzkrone.
- Bei den Göttlichen: **Zeus-X** wirft echte Blitze aus einer Gewitterwolke, **Helios Prime** lodert mit einer rotierenden Sonnenkorona, **Chronos Omega** zieht Zeit-Nachbilder in beide Richtungen und tickt wie eine Uhr, **Walhalla GT** lässt leuchtende Runen aufsteigen, **Nova Divina** pulsiert wie eine Supernova, und **Aether Unendlich** ist von schimmernden Aurora-Bändern umgeben.

## Die 56 Fähigkeitskarten

Jede Karte wird bei einem Rennen verbraucht (einmalig, danach aus dem Inventar entfernt). Es gibt zwei Grundtypen:

- **Passive Karten** wirken automatisch im Hintergrund, sobald das Rennen beginnt (Boosts, Debuffs, Glück, Belohnungs-Boni, Diebstahl- und Schutzchancen).
- **Aktive Karten** erscheinen im Rennen als Buttons unter der Strecke – du entscheidest den genauen Moment, in dem du sie zündest.

| Kategorie | Typ | Beispiel (niedrigste → höchste Stufe) | Effekt |
|---|---|---|---|
| Eigene Werte boosten | aktiv | Turbo-Kick I → Nitro-Schub II → Quantensprung | +10 % bis +55 % auf Tempo/Beschleunigung/Handling/alle Werte, sichtbare Nitro-Flammen |
| Gegner schwächen | aktiv | Sand im Getriebe I → Sabotage II → Systemkollaps | −8 % bis −50 % auf einzelne oder alle Gegner-Werte, trifft den Gegner sichtbar |
| Rennglück | passiv | Glücksbringer I/II, Perfekter Start | verringert den Zufalls-Nachteil im Rennwurf |
| **Teleport** | aktiv | Kurz-Teleport → Blitz-Teleport → **Portal-Meister** | Sprung nach vorn im Rennen, sichtbar als Portal-Effekt |
| **Falle** | aktiv | Ölfalle → **Schockfalle** | Der Gegner rutscht/wird gelähmt und stark ausgebremst |
| **Geist** | aktiv | Geist | Macht dich kurzzeitig unverwundbar gegen Gegner-Angriffe |
| Belohnung erhöhen | passiv | Trinkgeld → Jackpot → Goldrausch | +20 % bis +250 % Credits bei Sieg |
| Schutz bei Niederlage | passiv | Rostschutz → Vollversicherung → **Unbesiegbar** | 20 % bis 100 % Chance, das Auto trotz Niederlage zu behalten |
| Beute-Bonus | passiv | Diebstahlsicherung → Kopfgeldjäger II → **Autodieb** | +15 % bis 100 % Bonus-Credits fürs Ausschlachten des erbeuteten Gegner-Autos |
| Sonderfälle | passiv | Ersatzteil, Doppelzug | feste Bonus-Credits unabhängig vom Ausgang |

Die drei Teleport-Karten springen im Rennen sichtbar nach vorn: Das Auto hängt erst zurück, dann öffnet sich ein Portal (türkiser Austritts-Ring, lila Eintritts-Ring, Energiespur) und es materialisiert weiter vorne. Der legendäre **Portal-Meister** teleportiert dein Auto bei einer Niederlage außerdem sicher nach Hause – der Gegner bekommt es garantiert nicht. Die **Ölfalle** lässt den Gegner sichtbar ausrutschen und über eine Ölspur schlittern, die **Schockfalle** legt ihn komplett lahm.

Die mächtigsten Karten im Spiel sind legendär:

- **Zeitmanipulation** – garantierter Sieg in diesem Rennen, unabhängig von den Auto-Werten.
- **Singularität** – garantierter Sieg **und** 100 % Bonus-Credits fürs erbeutete Auto. Die stärkste Karte im Spiel.

## Technik

Reines HTML/CSS/JavaScript, kein Build-Schritt, keine externen Abhängigkeiten. Alle Auto-Icons werden als Seitenansicht-Silhouette auf Canvas 2D gezeichnet – eine eigene Zeichenfunktion pro Seltenheitsstufe (Kombi mit Rostflecken, Limousine mit Zierstreifen, Coupé mit Rennstreifen, Muscle-Car mit Hutzenhaube und Spoiler, Hypercar mit Leuchteffekt via `shadowBlur` und großem Heckflügel, schwebender göttlicher Flieger mit Energiefeld statt Rädern). Für die Renn-Ego-Perspektive gibt es zusätzlich eine reine Heckansicht-Zeichenfunktion (`drawCarRear`), die dieselben Rarity-Stilelemente (Spoiler, Glow, Farbverlauf) aus der Vogelperspektive in eine Von-hinten-Ansicht überträgt. Darüber liegt eine kleine FX-Engine: jedes Auto hat einen eigenen Effekt-Eintrag mit bis zu drei Hooks (`bg` hinter der Karosserie, `transform` für Bewegungen der Karosserie selbst, `fg` für Partikel davor). Eine einzige `requestAnimationFrame`-Schleife rendert alle sichtbaren Karten-Icons mit ~30 fps neu, sortiert nicht mehr eingehängte Canvases automatisch aus und überspringt unsichtbare; Partikelbahnen werden deterministisch aus einem Hash der Auto-ID abgeleitet, damit die Effekte stabil und flackerfrei loopen.

Autos und Fähigkeiten sind reine Datenlisten (`CARS` mit 56, `ABILITIES` mit 56 Einträgen), Booster-Ziehungen und Gegner-Auswahl laufen über eine gewichtete Zufallsfunktion (`pickWeightedRarity`) – die vier Booster-Sorten sind Einträge in einer `PACK_TYPES`-Tabelle mit eigenem Pool (Autos/Fähigkeiten), Preis und Seltenheits-Odds; göttliche Autos haben nur im Auto-Booster-Pool eine Zieh-Wahrscheinlichkeit über 0. Die verdeckten Booster-Karten sind ein reiner CSS-3D-Flip (`transform-style: preserve-3d`, `backface-visibility: hidden`, Rotation beim Klick).

Das Rennen ist eine **Live-Physiksimulation statt eines vorab feststehenden Ergebnisses**: Pro Frame nähert sich die Geschwindigkeit jedes Autos seiner Zielgeschwindigkeit an (`simRacer`), die sich aus `topSpeedFromScore(carScore(...))` ergibt – Top-Speed skaliert direkt mit dem gewichteten Stat-Score, daher ist ein Geschwindigkeitsunterschied zwischen zwei Autos im Rennen genauso spürbar wie in den Karten-Stats. Passive Fähigkeits-Effekte (`combineEffects`) fließen als Multiplikatoren in Top-Speed und Beschleunigungsverhalten ein; aktive Fähigkeiten werden erst über `activateRaceAbility()` gezündet, wenn der Spieler den entsprechenden Button drückt, und wirken sich sofort auf die laufende Simulation aus (Boost-Multiplikator, Gegner-Verlangsamung, Sofort-Distanzsprung beim Teleport, Unverwundbarkeits-Flag beim Geist). Zufällige Gegner-Angriffe werden zu Rennbeginn vorab terminiert und während der Simulation ausgelöst, sofern der Spieler nicht gerade Geist aktiv hat. Die Pseudo-3D-Ego-Perspektive (`drawEgoRace`) projiziert die Straße in Tiefen-Scheiben mit perspektivischer Verjüngung, seitlicher Kurvenverschiebung, Parallax-Bergen, Bäumen/Leitplanken am Streckenrand und einem Zielbogen bei 800 m; das Spielerauto steht fix im Vordergrund (Heckansicht), das Gegnerauto wird abhängig vom Abstand in der Tiefe eingeblendet. Am Ende der Simulation entscheidet die tatsächlich zurückgelegte Distanz über Sieg/Niederlage (`finishRace`) – die anschließende `applyRaceOutcome` verbraucht nur wirklich gezündete aktive Karten, ungenutzte wandern zurück ins Inventar.

Besitz-Inventare (`ownedCars`, `ownedAbilities`) sind flache ID-Arrays mit erlaubten Duplikaten, verbrauchte Fähigkeitskarten werden per Index aus dem Array entfernt. Der komplette Spielstand (Credits, Garage, Inventar, Sammlung) wird nach jeder Änderung automatisch als JSON in `localStorage` gespeichert und beim Laden validiert (unbekannte IDs werden verworfen); der Sammlungsfortschritt (`discoveredCars`/`discoveredAbilities`) ist bewusst von Credits/Garage/Inventar getrennt und übersteht daher auch einen Neustart im Spiel.
