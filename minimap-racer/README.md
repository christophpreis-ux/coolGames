# Minimap Racer

Ein 2D-Browser-Rennspiel: Das gesamte Spielfeld **ist** die Minimap – wie in Mario Kart, nur dass du die ganze Runde immer im Überblick siehst.

## Spielen

Einfach `index.html` in einem Browser öffnen, oder lokal servieren:

```bash
cd minimap-racer
python3 -m http.server 8080
# dann http://localhost:8080 öffnen
```

## Spielprinzip

- Wähle deinen Fahrer: Glatze oder lange Haare.
- 5 Level, jedes schwieriger als das letzte: mehr Kreuzungen, mehr Tempo, kürzerer Brems-/Beschleunigungsweg, längere Umwege bei falscher Abzweigung.
- Dein Einkaufswagen-Racer fährt automatisch los.
- An jeder Kreuzung hält er komplett an – drück schnell **←** oder **→**, um abzubiegen.
- Manche Abzweigungen sind Umwege. Finde die kürzeste Route zum Ziel.
- Über den **✕**-Button im Rennen jederzeit zurück zur Fahrerauswahl.
- Nach jedem Level: Medaille + Statistik, dann weiter zum nächsten Level. Nach Level 5 gibt's eine Gesamtübersicht mit der Medaille pro Level.

## Medaillen (pro Level)

| Medaille | Bedingung |
|---|---|
| 💎 Diamant | Schnellste erreichbare Gesamtzeit für dieses Level (optimale Route + blitzschnelle Reaktionen) |
| 🥇 Gold | Durchschnittliche Reaktionszeit an Kreuzungen ≤ 5 Sekunden |
| 🥈 Silber | Durchschnittliche Reaktionszeit an Kreuzungen ≤ 10 Sekunden |

Die Diamant-Zielzeit wird nicht per Faustformel geschätzt, sondern pro Level aus einer echten Simulation einer fehlerfreien Fahrt (optimale Route, minimale aber realistische Reaktionszeit) berechnet – sie bleibt also korrekt, auch wenn Strecke oder Fahrphysik später angepasst werden.

## Technik

Reines HTML/CSS/JavaScript, kein Build-Schritt, keine externen Abhängigkeiten. Jedes Level ist ein Graph aus Knoten/Kanten, der über einen kleinen Track-Builder (Geraden, Gabelungen, Kurven) in `game.js` beschrieben wird. Welcher Ast an einer Kreuzung "links" bzw. "rechts" ist, wird per Kreuzprodukt relativ zur Einfahrtsrichtung bestimmt – das funktioniert auch in Kurven (siehe Level 5). Das Rendering läuft über Canvas 2D.
