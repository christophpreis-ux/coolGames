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
- Jeder Wurf verbraucht 1 Köder. Ohne Köder kein Wurf – und ohne Geld für Nachschub heißt es neu starten.
- Über den **✕**-Button jederzeit die Angel-Session beenden und die Zusammenfassung sehen (Gesamtpunkte, Anzahl Fische, größter Fang, Liste aller Fänge).

## Die 19 Fisch-/Meeresarten

Von häufig/leicht bis selten/legendär – je mehr Tastendrücke eine Art braucht, desto mehr Punkte bringt sie. Welche Art anbeißt, wird zufällig (gewichtet nach Seltenheit) bestimmt. Jede Art hat außerdem eine eigene, art-typische Silhouette statt nur einer anderen Farbe – Haie, Thunfische, Schwertfische, Wale, Scheibenfische (Mondfisch) und Kopffüßer (Kalmare) sehen alle grundlegend anders aus:

| Fisch | Tastendrücke | Gewicht | Punkte |
|---|---|---|---|
| 🐟 Rotfeder | 2 | 80–350 g | 60 |
| 🐟 Flussbarsch | 3 | 150–700 g | 110 |
| 🐠 Karpfen | 4 | 1,5–8 kg | 180 |
| 🐠 Hecht | 5 | 2–9 kg | 260 |
| 🐡 Lachs | 6 | 3–14 kg | 360 |
| 🐡 Blauflossen-Thunfisch | 7 | 50–300 kg | 480 |
| 🐟 Schwertfisch | 8 | 50–150 kg | 590 |
| 🦈 Weißer Hai | 9 | 500–1100 kg | 700 |
| 🐋 Blauwal | 10 | 100–150 t | 1200 |
| 🦑 Riesenkalmar | 11 | 150–450 kg | 1450 |
| 🐟 Mondfisch | 12 | 300–2300 kg | 1700 |
| 🦈 Grönlandhai | 13 | 400–1000 kg | 1950 |
| 🐋 Pottwal | 14 | 35–45 t | 2200 |
| 🐉 Seedrache | 15 | 2–5 t | 3000 |
| 🦈 Walhai | 16 | 10–20 t | 2500 |
| 🦑 Kolosskalmar | 17 | 400–750 kg | 2800 |
| 🐋 Grönlandwal | 18 | 60–100 t | 3100 |
| 🦈 Megalodon | 19 | 30–65 t | 3500 |
| 🐙 **Kraken (Endboss)** | 20 | 10–20 t | 6000 |

Zwei Arten sind exklusiv an eine bestimmte Rute gebunden – ohne sie tauchen sie im Zufallspool gar nicht erst auf, egal wie gut der Köder ist:

- **Seedrache** (nur mit Drachen-Angel): keine kleine Fischform, sondern eine große, gewellte Seeschlange mit Drachenkopf und Hörnern.
- **Kraken** (nur mit Kraken-Angel): der echte Endboss – ein riesiger, bedrohlicher Tintenfisch mit gezacktem Mantel, glühend roten Augen und sieben peitschenden, saugnapfbesetzten Tentakeln. Größer und wertvoller als jeder andere Fang im Spiel.

## Mutationen

Nach jedem Fang besteht eine kleine Chance, dass es sich um eine seltene Variante handelt – erst nach dem Anlanden sichtbar, dafür umso wertvoller. 15 verschiedene Mutationen sind möglich:

| Mutation | Chance | Effekt |
|---|---|---|
| 📏 Riesenexemplar | 6 % | +40 % Punkte, +50 % Gewicht |
| 🤏 Zwergexemplar | 5 % | +30 % Punkte, −40 % Gewicht |
| ✨ Glitzerschuppen | 4 % | +60 % Punkte, glitzert |
| 🌑 Schattenfisch | 1,8 % | +90 % Punkte |
| 🤍 Albino | 2,5 % | +80 % Punkte |
| ⚙️ Metallisch | 1,6 % | +95 % Punkte, glitzert |
| ❄️ Eisig | 1,3 % | +85 % Punkte |
| 🦴 Uralt | 1,5 % | +100 % Punkte |
| 💎 Kristallschuppen | 1,2 % | +110 % Punkte, glitzert |
| 🔥 Feurig | 1,0 % | +100 % Punkte |
| 2️⃣ Zweiköpfig | 1,0 % | +120 % Punkte |
| ☢️ Radioaktiv | 0,6 % | +160 % Punkte, glitzert |
| 👑 Goldrausch | 0,8 % | +150 % Punkte, glitzert golden |
| 🌈 Regenbogenglanz | 0,4 % | +200 % Punkte, glitzert |
| 🌌 Kosmisch | 0,2 % | +250 % Punkte, glitzert |

## Angelladen

Über das 🛒-Symbol im Spiel öffnest du den Laden. Dort kannst du dir mit deinen gesammelten Punkten bessere Ruten kaufen – jede mit eigenem Design, sowohl im Laden als auch als Rute in der Szene. Sie brauchen weniger Tastendrücke und geben mehr Zeit pro Druck; die Belohnung richtet sich aber immer nach der Fischart, nicht nach der Rute:

| Rute | Preis | Effekt |
|---|---|---|
| Standardrute | kostenlos | volle Tastenfolge, normales Tempo |
| Gold-Angel | 350 Punkte | 1 Tastendruck weniger, mehr Zeit pro Druck |
| Diamant-Angel | 900 Punkte | 2 Tastendrücke weniger, noch mehr Zeit pro Druck |
| Platin-Angel | 1.600 Punkte | wie Diamant, aber mit mehr Zeit pro Druck |
| Titan-Angel | 2.800 Punkte | 3 Tastendrücke weniger |
| Drachen-Angel | 5.000 Punkte | 3 Tastendrücke weniger – einzige Rute, an der der Seedrache anbeißt |
| Legenden-Angel | 6.500 Punkte | 4 Tastendrücke weniger |
| Mythos-Angel | 9.000 Punkte | 5 Tastendrücke weniger |
| Kraken-Angel | 15.000 Punkte | 5 Tastendrücke weniger, am meisten Zeit – einzige Rute, an der der Kraken anbeißt |

Gekaufte Ruten bleiben für die restliche Sitzung erhalten und lassen sich im Laden jederzeit wechseln.

## Köder

Jeder Wurf kostet 1 Köder aus dem Köcher. Bessere Köder machen die Fische **nicht leichter zu fangen** (das macht die Rute) – sie verschieben nur die Zufallsauswahl stark zugunsten seltener, wertvoller Arten. Köder werden in Tüten gekauft und stapeln sich im Köcher – die vier normalen Köder in 20er-Tüten, der Ultraköder nur im Zweierpack:

| Köder | Preis | Effekt |
|---|---|---|
| Standardköder | 60 Punkte (20 Stück) | normale Fangchancen |
| Premiumköder | 120 Punkte (20 Stück) | deutlich höhere Chance auf größere Fische |
| Profiköder | 500 Punkte (20 Stück) | starker Zug zu seltenen Fängen |
| Meisterköder | 1.000 Punkte (20 Stück) | maximale Chance auf die seltensten Fänge |
| **Ultraköder** | 5.000 Punkte (**2 Stück**) | kein Zufall mehr – fängt garantiert den bestmöglichen Fisch, den die aktuell ausgerüstete Angel überhaupt fangen kann |

Der Ultraköder schaltet keine neuen Arten frei – er garantiert nur, dass unter allen mit der aktuellen Rute erreichbaren Arten die mit den meisten Punkten anbeißt (z. B. Megalodon mit einer normalen Rute, der Kraken mit der Kraken-Angel).

Ist der Köcher leer, kannst du nicht mehr werfen. Reicht das Guthaben noch für eine Tüte, schickt dich das Spiel in den Laden. Reicht es auch dafür nicht mehr, bleibt nur der Neustart – der setzt Punkte, Ruten **und** Köder auf den Anfangszustand zurück (eine Starter-Tüte Standardköder).

## Technik

Reines HTML/CSS/JavaScript, kein Build-Schritt, keine externen Abhängigkeiten. Die Szene (Ufer, Wasser, Angler, Schwimmer, Fischsprung, Platsch-Animation, Fisch-über-Kopf-Pose, Glitzer-Effekte) wird komplett auf Canvas 2D gezeichnet, ebenso die Ruten-Icons im Laden. Jede Art bekommt eine von acht art-typischen Silhouetten (`drawCreature` wählt anhand von `species.shape`): normaler Fisch (Torpedokörper, gegabelte Schwanzflosse), Thunfisch (schlank, Halbmondschwanz, Finlets), Schwertfisch (langer Schnabel, Segelflosse), Hai (spitze Schnauze, hohe Rückenflosse, asymmetrischer Schwanz, Kiemenspalten), Wal (rundlicher Körper, horizontale Fluke, Blasloch, Paddelflosse), Scheibenfisch (Mondfisch: rund, gespiegelte Riesenflossen, Stummelschwanz), Kopffüßer (Mantel + Tentakel, für Riesen-/Kolosskalmar) und die beiden Unikate Seedrache (Seeschlange mit Drachenkopf) und Kraken (überdimensionaler, gezackter Tintenfisch mit glühenden Augen). Die Tastenfolgen-Logik (Sequenz, schrumpfendes Zeitfenster, Erfolg/Fehlschlag) läuft über einen `requestAnimationFrame`-Loop, der Fristen gegen `performance.now()` prüft. Fischarten und Mutationen werden unabhängig voneinander gewichtet zufällig ausgewählt (Seedrache/Kraken nur aus dem Pool, wenn die passende Rute ausgerüstet ist); gemischte Gewichtseinheiten (g/kg/t) werden für die Gesamtstatistik intern in Gramm normalisiert und dann passend formatiert.
