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
- Für 150 Credits öffnest du einen **Booster** mit 5 zufälligen Karten – gemischt aus Autos und Fähigkeitskarten, gewichtet nach Seltenheit (50 % Gewöhnlich, 28 % Ungewöhnlich, 14 % Selten, 6 % Episch, 2 % Legendär).
- Über "Rennangebot einholen" fordert dich ein Gegner heraus. Du siehst sein Auto **vorher** und kannst annehmen oder ablehnen – bei Ablehnung passiert nichts.
- Nimmst du an, wählst du eins deiner Autos als Einsatz und optional bis zu 2 Fähigkeitskarten aus deinem Inventar (die dabei verbraucht werden).
- Das Rennen wird als kurze Animation zweier Boliden auf einer Strecke dargestellt, das Ergebnis steht aber schon vorher fest: Es basiert auf den Auto-Werten (Speed/Beschleunigung/Handling), etwaigen Fähigkeits-Boosts/Debuffs und einem Zufallsanteil.
- **Gewinnst** du: Credits (abhängig von der Seltenheit des Gegner-Autos) und eine kleine Chance, das Gegner-Auto obendrauf zu bekommen. **Verlierst** du: Dein eingesetztes Auto geht an den Gegner – außer eine Fähigkeit bewahrt es davor.
- Über "Sammlung" siehst du alle bisher entdeckten Autos und Fähigkeiten; noch nicht gefundene Karten erscheinen ausgegraut als "???". Dieser Sammlungsfortschritt bleibt auch nach einem Neustart erhalten.
- "Neu starten" setzt Credits, Garage und Fähigkeitskarten auf den Anfangszustand zurück (Credits, Autos, Karten) – die Sammlung (entdeckte Karten) bleibt unberührt.

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

## Die 50 Fähigkeitskarten

10 Karten pro Seltenheitsstufe. Jede Karte wird bei einem Rennen verbraucht (einmalig, danach aus dem Inventar entfernt) und wirkt sich auf genau dieses eine Rennen aus. Effekt-Kategorien:

| Kategorie | Beispiel (niedrigste → höchste Stufe) | Effekt |
|---|---|---|
| Eigene Werte boosten | Turbo-Kick I → Nitro-Schub II → Quantensprung | +10 % bis +55 % auf Tempo/Beschleunigung/Handling/alle Werte |
| Gegner schwächen | Sand im Getriebe I → Sabotage II → Systemkollaps | −8 % bis −50 % auf einzelne oder alle Gegner-Werte |
| Rennglück | Glücksbringer I/II, Perfekter Start | verringert den Zufalls-Nachteil im Rennwurf |
| Belohnung erhöhen | Trinkgeld → Jackpot → Goldrausch | +20 % bis +250 % Credits bei Sieg |
| Schutz bei Niederlage | Rostschutz → Vollversicherung → **Unbesiegbar** | 20 % bis 100 % Chance, das Auto trotz Niederlage zu behalten |
| Auto stehlen | Diebstahlsicherung → Kopfgeldjäger II → **Autodieb** | +15 % bis 100 % zusätzliche Chance, das Gegner-Auto bei Sieg zu erbeuten |
| Sonderfälle | Ersatzteil, Doppelzug | feste Bonus-Credits unabhängig vom Ausgang |

Die beiden mächtigsten Karten im Spiel sind legendär:

- **Zeitmanipulation** – garantierter Sieg in diesem Rennen, unabhängig von den Auto-Werten.
- **Singularität** – garantierter Sieg **und** garantiert das Gegner-Auto erbeutet. Die stärkste Karte im Spiel.

## Technik

Reines HTML/CSS/JavaScript, kein Build-Schritt, keine externen Abhängigkeiten. Alle Auto-Icons werden als Seitenansicht-Silhouette auf Canvas 2D gezeichnet – eine eigene Zeichenfunktion pro Seltenheitsstufe (Kombi mit Rostflecken, Limousine mit Zierstreifen, Coupé mit Rennstreifen, Muscle-Car mit Hutzenhaube und Spoiler, Hypercar mit Leuchteffekt via `shadowBlur` und großem Heckflügel). Autos und Fähigkeiten sind reine Datenlisten (`CARS`/`ABILITIES`, je 50 Einträge), Booster-Ziehungen und Gegner-Auswahl laufen über eine gewichtete Zufallsfunktion (`pickWeightedRarity`). Der Renn-Ausgang wird vorab per Formel aus Auto-Werten, kombinierten Fähigkeits-Effekten und Zufallswurf bestimmt (`resolveRace`); die anschließende Canvas-Animation (Countdown, Beschleunigungskurve, Ziellinie) bildet dieses bereits feststehende Ergebnis nur visuell nach. Besitz-Inventare (`ownedCars`, `ownedAbilities`) sind flache ID-Arrays mit erlaubten Duplikaten, verbrauchte Fähigkeitskarten werden per Index aus dem Array entfernt. Der Sammlungsfortschritt (`discoveredCars`/`discoveredAbilities`) ist bewusst von Credits/Garage/Inventar getrennt und übersteht daher einen Neustart.
