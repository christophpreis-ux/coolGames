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

## Die 13 Fischarten

Von häufig/leicht bis selten/legendär – je mehr Tastendrücke eine Art braucht, desto mehr Punkte bringt sie. Welche Art anbeißt, wird zufällig (gewichtet nach Seltenheit) bestimmt:

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
| 🦑 Riesenkalmar | 11 | 150–450 kg | 1450 |
| 🐟 Mondfisch | 12 | 300–2300 kg | 1700 |
| 🦈 Grönlandhai | 13 | 400–1000 kg | 1950 |
| 🐋 Pottwal | 14 | 35–45 t | 2200 |
| 🐉 **Seedrache** | 15 | 2–5 t | 3000 |

Der Seedrache ist eine Ausnahme in mehrfacher Hinsicht: Er beißt **nur an, wenn die Drachen-Angel ausgerüstet ist** – ohne sie taucht er im Zufallspool gar nicht erst auf. Und statt der normalen Fischform ist er eine große, gewellte Seeschlange mit Drachenkopf und Hörnern – ein komplett eigenes Design, deutlich größer als jeder andere Fang im Spiel.

## Mutationen

Nach jedem Fang besteht eine kleine Chance, dass es sich um eine seltene Variante handelt – erst nach dem Anlanden sichtbar, dafür umso wertvoller:

| Mutation | Chance | Effekt |
|---|---|---|
| 📏 Riesenexemplar | 6 % | +40 % Punkte, +50 % Gewicht |
| ✨ Glitzerschuppen | 4 % | +60 % Punkte, glitzert |
| 🤍 Albino | 2,5 % | +80 % Punkte |
| 🦴 Uralt | 1,5 % | +100 % Punkte |
| 👑 Goldrausch | 0,8 % | +150 % Punkte, glitzert golden |

## Angelladen

Über das 🛒-Symbol im Spiel öffnest du den Laden. Dort kannst du dir mit deinen gesammelten Punkten bessere Ruten kaufen – jede mit eigenem Design, sowohl im Laden als auch als Rute in der Szene. Sie brauchen weniger Tastendrücke und geben mehr Zeit pro Druck; die Belohnung richtet sich aber immer nach der Fischart, nicht nach der Rute:

| Rute | Preis | Effekt |
|---|---|---|
| Standardrute | kostenlos | volle Tastenfolge, normales Tempo |
| Gold-Angel | 350 Punkte | 1 Tastendruck weniger, mehr Zeit pro Druck |
| Diamant-Angel | 900 Punkte | 2 Tastendrücke weniger, noch mehr Zeit pro Druck |
| Drachen-Angel | 5000 Punkte | 3 Tastendrücke weniger, am meisten Zeit – und einzige Rute, an der der Seedrache anbeißt |

Gekaufte Ruten bleiben für die restliche Sitzung erhalten und lassen sich im Laden jederzeit wechseln.

## Technik

Reines HTML/CSS/JavaScript, kein Build-Schritt, keine externen Abhängigkeiten. Die Szene (Ufer, Wasser, Angler, Schwimmer, Fischsprung, Platsch-Animation, Fisch-über-Kopf-Pose, Glitzer-Effekte) wird komplett auf Canvas 2D gezeichnet, ebenso die Ruten-Icons im Laden. Normale Fische haben einen torpedoförmigen Körper mit gegabelter Schwanzflosse, Rücken-/Brustflosse und einem richtigen Auge; der Seedrache nutzt stattdessen eine eigene Zeichenfunktion für einen gewellten Schlangenkörper mit Drachenkopf. Die Tastenfolgen-Logik (Sequenz, schrumpfendes Zeitfenster, Erfolg/Fehlschlag) läuft über einen `requestAnimationFrame`-Loop, der Fristen gegen `performance.now()` prüft. Fischarten und Mutationen werden unabhängig voneinander gewichtet zufällig ausgewählt (der Seedrache nur aus dem Pool, wenn die Drachen-Angel ausgerüstet ist); gemischte Gewichtseinheiten (g/kg/t) werden für die Gesamtstatistik intern in Gramm normalisiert und dann passend formatiert.
