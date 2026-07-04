# Blitzangler

Ein 2D-Browser-Angelspiel: Auswerfen, warten, und wenn ein Fisch anbeißt, schnell die richtige Tastenfolge nachdrücken, bevor er dich in den Fluss zieht.

## Spielen

Einfach `index.html` in einem Browser öffnen, oder lokal servieren:

```bash
cd fishing-game
python3 -m http.server 8080
# dann http://localhost:8080 öffnen
```

## Spielprinzip

- Wähle deinen Angler: Glatze oder lange Haare.
- Die Angel wird automatisch ausgeworfen. Nach einer zufälligen Wartezeit beißt ein Fisch an.
- Sobald das passiert, erscheint eine Tastenfolge aus ←, ↑, ↓, → (2 bis 9 Tasten lang) – drück sie in exakt der richtigen Reihenfolge nach.
- Mit jedem richtigen Tastendruck wird das Zeitfenster für den nächsten Druck kürzer – der Fisch wehrt sich zunehmend.
- Falsche Taste oder Zeit abgelaufen: Du wirst in den Fluss gezogen, der Fisch entkommt.
- Erfolgreich gefangen: Der Fisch wird gewogen (in Gramm) und in Punkte umgewandelt – je mehr Tastendrücke die Folge hatte, desto schwerer der Fisch und desto mehr Punkte.
- Über den **✕**-Button jederzeit die Angel-Session beenden und die Zusammenfassung sehen (Gesamtpunkte, Anzahl Fische, größter Fang, Liste aller Fänge).

## Technik

Reines HTML/CSS/JavaScript, kein Build-Schritt, keine externen Abhängigkeiten. Die Szene (Ufer, Wasser, Angler, Schwimmer, Fischsprung, Platsch-Animation) wird komplett auf Canvas 2D gezeichnet. Die Tastenfolgen-Logik (Sequenz, schrumpfendes Zeitfenster, Erfolg/Fehlschlag) läuft über einen `requestAnimationFrame`-Loop, der Fristen gegen `performance.now()` prüft.
