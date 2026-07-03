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
- Dein Einkaufswagen-Racer fährt automatisch los.
- An jeder Kreuzung hält er komplett an – drück schnell **←** oder **→**, um abzubiegen.
- Manche Abzweigungen sind Umwege. Finde die kürzeste Route zum Ziel.

## Medaillen

| Medaille | Bedingung |
|---|---|
| 💎 Diamant | Schnellste erreichbare Gesamtzeit (optimale Route + blitzschnelle Reaktionen) |
| 🥇 Gold | Durchschnittliche Reaktionszeit an Kreuzungen ≤ 5 Sekunden |
| 🥈 Silber | Durchschnittliche Reaktionszeit an Kreuzungen ≤ 10 Sekunden |

Die Diamant-Zielzeit wird nicht per Faustformel geschätzt, sondern aus einer echten Simulation einer fehlerfreien Fahrt (optimale Route, minimale aber realistische Reaktionszeit) berechnet – sie bleibt also korrekt, auch wenn Strecke oder Fahrphysik später angepasst werden.

## Technik

Reines HTML/CSS/JavaScript, kein Build-Schritt, keine externen Abhängigkeiten. Die Strecke ist ein Graph aus Knoten/Kanten (`game.js`), das Rendering läuft über Canvas 2D.
