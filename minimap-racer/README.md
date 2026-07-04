# Minimap Racer

Ein 2D-Browser-Rennspiel im Minimap-Look: Die Kamera folgt deinem Wagen über lange, verwinkelte Strecken, während eine kleine Übersichtskarte in der Ecke (wie in Mario Kart) immer die komplette Strecke zeigt.

## Spielen

Einfach `index.html` in einem Browser öffnen, oder lokal servieren:

```bash
cd minimap-racer
python3 -m http.server 8080
# dann http://localhost:8080 öffnen
```

## Spielprinzip

- Wähle deinen Fahrer: Glatze oder lange Haare.
- 3 lange Level, jedes deutlich schwieriger als das letzte: mehr Kreuzungen (teils mit 3 Abzweigungen), mehr Tempo, kürzerer Brems-/Beschleunigungsweg, mehr Kurven im Streckenverlauf.
- Dein Einkaufswagen-Racer fährt automatisch los. Die Kamera folgt ihm mit leichtem Vorausblick in Fahrtrichtung.
- An jeder Kreuzung hält er komplett an – drück schnell **←** oder **→**, an manchen Kreuzungen auch **↑** für geradeaus (bei 3 Abzweigungen).
- Manche Abzweigungen sind Umwege. Finde die kürzeste Route zum Ziel.
- Über den **✕**-Button im Rennen jederzeit zurück zur Fahrerauswahl.
- Nach jedem Level: Medaille + Statistik, dann weiter zum nächsten Level. Nach Level 3 gibt's eine Gesamtübersicht mit der Medaille pro Level.

## Medaillen (pro Level)

| Medaille | Bedingung |
|---|---|
| 💎 Diamant | Schnellste erreichbare Gesamtzeit für dieses Level (optimale Route + blitzschnelle Reaktionen) |
| 🥇 Gold | Durchschnittliche Reaktionszeit an Kreuzungen ≤ 5 Sekunden |
| 🥈 Silber | Durchschnittliche Reaktionszeit an Kreuzungen ≤ 10 Sekunden |

Die Diamant-Zielzeit wird nicht per Faustformel geschätzt, sondern pro Level aus einer echten Simulation einer fehlerfreien Fahrt (optimale Route, minimale aber realistische Reaktionszeit) berechnet – sie bleibt also korrekt, auch wenn Strecke oder Fahrphysik später angepasst werden.

## Technik

Reines HTML/CSS/JavaScript, kein Build-Schritt, keine externen Abhängigkeiten. Jedes Level ist ein Graph aus Knoten/Kanten, der über einen kleinen Track-Builder (Geraden, Gabelungen mit 2 oder 3 Ästen, Kurven) in `game.js` beschrieben wird. Welcher Ast an einer Kreuzung "links", "geradeaus" bzw. "rechts" ist, wird per Winkel relativ zur Einfahrtsrichtung bestimmt – das funktioniert auch in Kurven und bei drei Abzweigungen. Die Kamera folgt dem Wagen (fester Zoom, sanftes Nachziehen mit Vorausblick); zusätzlich läuft eine kleine Übersichtskarte mit, die die komplette Strecke auf den verfügbaren Platz einpasst. Das Rendering läuft über Canvas 2D.
