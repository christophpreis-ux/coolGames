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
- Sobald das passiert, erscheint eine Tastenfolge aus ←, ↑, ↓, → – drück sie in exakt der richtigen Reihenfolge nach.
- Mit jedem richtigen Tastendruck wird das Zeitfenster für den nächsten Druck kürzer – der Fisch wehrt sich zunehmend.
- Falsche Taste oder Zeit abgelaufen: Du wirst in den Fluss gezogen, der Fisch entkommt.
- Erfolgreich gefangen: Du hältst den Fisch erst stolz über den Kopf, dann erscheinen Gewicht und Punkte.
- Über den **✕**-Button jederzeit die Angel-Session beenden und die Zusammenfassung sehen (Gesamtpunkte, Anzahl Fische, größter Fang, Liste aller Fänge).

## Die 8 Fischarten

Von häufig/leicht bis selten/legendär – je mehr Tastendrücke eine Art braucht, desto schwerer ist sie und desto mehr Punkte bringt sie:

| Fisch | Tastendrücke | Gewicht | Punkte |
|---|---|---|---|
| 🐟 Rotfeder | 2 | 80–350 g | 60 |
| 🐟 Flussbarsch | 3 | 150–700 g | 110 |
| 🐠 Karpfen | 4 | 1,5–8 kg | 180 |
| 🐠 Hecht | 5 | 2–9 kg | 260 |
| 🐡 Lachs | 6 | 3–14 kg | 360 |
| 🐡 Blauflossen-Thunfisch | 7 | 50–300 kg | 480 |
| 🦈 Weißer Hai | 9 | 500–1100 kg | 700 |
| 🐋 Blauwal | 10 | 100–150 t | 1200 |

Welche Art anbeißt, wird zufällig (gewichtet nach Seltenheit) bestimmt – der Blauwal ist entsprechend selten.

## Angelladen

Über das 🛒-Symbol im Spiel öffnest du den Laden. Dort kannst du dir mit deinen gesammelten Punkten bessere Ruten kaufen – sie brauchen weniger Tastendrücke und geben mehr Zeit pro Druck, die Fangchance bleibt aber unabhängig von der Rute (Punkte/Gewicht richten sich immer nach der Fischart):

| Rute | Preis | Effekt |
|---|---|---|
| Standardrute | kostenlos | volle Tastenfolge, normales Tempo |
| Gold-Angel | 350 Punkte | 1 Tastendruck weniger, mehr Zeit pro Druck |
| Diamant-Angel | 900 Punkte | 2 Tastendrücke weniger, noch mehr Zeit pro Druck |

Gekaufte Ruten bleiben für die restliche Sitzung erhalten und lassen sich im Laden jederzeit wechseln.

## Technik

Reines HTML/CSS/JavaScript, kein Build-Schritt, keine externen Abhängigkeiten. Die Szene (Ufer, Wasser, Angler, Schwimmer, Fischsprung, Platsch-Animation, Fisch-über-Kopf-Pose) wird komplett auf Canvas 2D gezeichnet. Die Tastenfolgen-Logik (Sequenz, schrumpfendes Zeitfenster, Erfolg/Fehlschlag) läuft über einen `requestAnimationFrame`-Loop, der Fristen gegen `performance.now()` prüft. Fischarten werden gewichtet zufällig ausgewählt; gemischte Gewichtseinheiten (g/kg/t) werden für die Gesamtstatistik intern in Gramm normalisiert und dann passend formatiert.
