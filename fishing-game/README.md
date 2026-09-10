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

- Wähle deinen Angler: Glatze oder lange Haare. Er steht als richtige kleine Figur auf einem hölzernen Steg, der vom Ufer über das Wasser hinausragt – zwei Beine, Arme, Kopf mit Gesicht – und holt beim Auswerfen sichtbar mit der Rute aus, bevor er wirft.
- Die Angel wird automatisch ausgeworfen. Nach einer zufälligen Wartezeit beißt ein Fisch an.
- Sobald das passiert, erscheint eine Tastenfolge aus ←, ↑, ↓, → – drück sie in exakt der richtigen Reihenfolge nach. Der Angler kurbelt dabei sichtbar mit beiden Armen und macht bei jedem Treffer einen kleinen Ruck, als würde er den Fisch wirklich hereinziehen.
- Mit jedem richtigen Tastendruck wird das Zeitfenster für den nächsten Druck kürzer – der Fisch wehrt sich zunehmend.
- Falsche Taste oder Zeit abgelaufen: Du wirst in den Fluss gezogen (mit erschrockenem Gesicht), der Fisch entkommt.
- Erfolgreich gefangen: Du hältst den Fisch erst stolz über den Kopf (mit sichtbar breitem Grinsen), dann erscheinen Gewicht und Punkte.
- Zum Weiterangeln reicht danach eine der vier Angel-Tasten (←/↑/↓/→) – der eigentliche "Weiter"-Button geht also genauso.
- Jeder Wurf verbraucht 1 Köder. Ohne Köder kein Wurf – und ohne Geld für Nachschub heißt es neu starten.
- Über den **✕**-Button jederzeit die Angel-Session beenden und die Zusammenfassung sehen (Gesamtpunkte, Anzahl Fische, größter Fang, Liste aller Fänge).
- Der **Spielstand wird automatisch gespeichert** (localStorage): Punkte, Fänge, Ruten, Köder-Vorrat und der gewählte Angler überstehen das Schließen der Seite. Warst du gerade mitten in einer Angel-Session, landest du beim nächsten Öffnen direkt wieder im Spiel (mit einem frischen Wurf statt einer mitten drin abgebrochenen Animation).
- "Angler wechseln" auf der Zusammenfassung setzt den laufenden Run vollständig zurück, bevor es zurück zur Auswahl geht – so bleibt man nie in einem Zustand hängen, der beim nächsten Laden wieder mitten ins Spiel statt zur Auswahl springt.
- Auf dem Auswahlbildschirm gibt's zusätzlich den Button **"Spiel zurücksetzen"** (mit Sicherheitsabfrage): Punkte, Ruten, Köder, alle Fänge und die Angler-Wahl gehen komplett von vorne los. Das Fischlexikon (gesammelte Arten/Mutationen) und die Promo-Code-Historie bleiben davon unberührt – die sind eine dauerhafte Sammlung und werden absichtlich nie zurückgesetzt.

## Die 20 Fisch-/Meeresarten

Von häufig/leicht bis selten/legendär – je mehr Tastendrücke eine Art braucht, desto mehr Punkte bringt sie. Welche Art anbeißt, wird zufällig (gewichtet nach Seltenheit) bestimmt. Jede Art hat außerdem eine eigene, art-typische Silhouette statt nur einer anderen Farbe – Haie, Thunfische, Schwertfische, Wale, Scheibenfische (Mondfisch), Kopffüßer (Kalmare) und sogar ein Insekt (Mückenfisch) sehen alle grundlegend anders aus:

| Fisch | Tastendrücke | Gewicht | Punkte |
|---|---|---|---|
| 🐟 Rotfeder | 2 | 80–350 g | 60 |
| 🐟 Flussbarsch | 3 | 150–700 g | 110 |
| 🐠 Karpfen | 4 | 1,5–8 kg | 180 |
| 🐠 Hecht | 5 | 2–9 kg | 260 |
| 🐡 Lachs | 6 | 3–14 kg | 360 |
| 🦟 Mückenfisch | 6 | 1–5 g | 340 |
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

Der **Mückenfisch** ist trotz seiner geringen Größe (kleinste Silhouette im Spiel) überdurchschnittlich viel wert – kein Fisch-, sondern ein Insektenbauplan: segmentierter Hinterleib, durchscheinendes Flügelpaar, sechs dünne Beine und Stechrüssel statt Flossen und Schuppen.

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

Dazu kommen zwei weitere Mutationen, die **nicht** über die normale Zufallsauswahl erreichbar sind, sondern nur während eines Events:

| Mutation | Chance | Effekt |
|---|---|---|
| 👽 Alien | nur im Alien-Event | +300 % Punkte, grün, glitzert |
| 🧟 Zombie | nur im Zombie-Event | +120 % Punkte, fauliges Grünbraun |

## Alien-Event & Zombie-Event

Jede Minute Spielzeit besteht eine 1-zu-100-Chance, dass ein **Alien-Event** losgeht – ein Banner am oberen Bildschirmrand kündigt es an. Für die nächsten 25 Sekunden bekommt **jeder** gefangene Fisch garantiert die Alien-Mutation: grün gefärbt, glitzernd, +300 % Punkte – egal welche Art gerade anbeißt und egal welche Rute/Köder ausgerüstet ist. Das Event ist reiner Glückszufall und komplett unabhängig vom sonstigen Fortschritt (Ruten, Köder, Punkte).

Nach demselben Prinzip gibt's das **Zombie-Event**: ebenfalls einmal pro Minute Spielzeit geprüft, aber mit 20 % Wahrscheinlichkeit – also deutlich häufiger als das Alien-Event. Dafür ist die Zombie-Mutation spürbar schwächer (+120 % statt +300 % Punkte, kein Glitzern). Beide Events laufen komplett unabhängig voneinander; sollten sie zufällig gleichzeitig aktiv sein, hat Alien Vorrang.

Alternativ lässt sich das Alien-Event auch gezielt auslösen: Im Angelladen gibt es oben ein **Promo-Code**-Feld. Der Code muss exakt (inklusive Groß-/Kleinschreibung) eingegeben werden:

| Code | Effekt |
|---|---|
| `HIGH ALIENS` | Startet das Alien-Event sofort |
| `LUCKY` | 10 Minuten lang 3-faches Glück auf alle normalen Mutationen (nicht auf Alien) |

Ein falscher oder unbekannter Code zeigt "Diesen Code gibt's nicht." in Rot an. Jeder Code lässt sich **maximal 2× pro Stunde** einlösen (rollierendes Zeitfenster) – ein dritter Versuch zeigt an, wie lange noch gewartet werden muss. Das Limit übersteht auch ein Neuladen der Seite.

## Fischlexikon

Unter dem 🛒-Shopsymbol sitzt ein eigenes 📖-Symbol – öffnet das **Fischlexikon**, ein eigenständiges Modal getrennt vom Angelladen, mit zwei Reitern:

- **Diese Runde**: alle Fänge der aktuell laufenden Session, wie auf der Zusammenfassung.
- **Sammlung**: eine dauerhafte Pokédex-artige Übersicht über **alle** Fischarten und **alle** Mutationen, die du jemals gefangen hast – in zwei getrennten Kategorien. Noch nie Gefangenes erscheint als "???" mit ❓-Symbol, abgedunkelt.

Die Sammlung wächst über die gesamte Spielzeit hinweg und übersteht sowohl das Schließen der Seite als auch einen kompletten Neustart ("Neu starten" nach leerem Köcher) – nur Punkte, Ruten und Köder werden dabei zurückgesetzt, die entdeckten Arten/Mutationen bleiben erhalten.

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

Reines HTML/CSS/JavaScript, kein Build-Schritt, keine externen Abhängigkeiten. Die Szene (Ufer, Steg, Wasser, Angler, Schwimmer, Fischsprung, Platsch-Animation, Fisch-über-Kopf-Pose, Glitzer-Effekte) wird komplett auf Canvas 2D gezeichnet, ebenso die Ruten-Icons im Laden. Der Angler selbst ist eine richtige kleine Figur (Kopf mit Gesicht, Torso, zwei Arme über `drawLimb` mit angedeutetem Ellbogen, zwei Beine mit Füßen) statt nur eines Rumpfes mit Kopf. `drawHead` bekommt einen `expression`-Parameter ("neutral"/"strain"/"happy"/"shock") und zeichnet Augen, Augenbrauen und Mund passend zum Spielzustand. Beim Auswerfen läuft eine kurze Ausholen-und-Wurf-Animation (`CAST_ANIM_DURATION`, mit `easeOutBack`-Überschwung am Ende), während der die Rute an der animierten Hand hängt und Schwimmer/Angelschnur erst nach dem Wurf erscheinen; während des Drills (Tastenfolge) kurbeln beide Arme rhythmisch und machen bei jedem korrekten Tastendruck (`lastTugTime`) einen kurzen, abklingenden Ruck nach hinten, während der Oberkörper leicht zurücklehnt. Jede Art bekommt eine von neun art-typischen Silhouetten (`drawCreature` wählt anhand von `species.shape`): normaler Fisch (Torpedokörper, gegabelte Schwanzflosse), Thunfisch (schlank, Halbmondschwanz, Finlets), Schwertfisch (langer Schnabel, Segelflosse), Hai (spitze Schnauze, hohe Rückenflosse, asymmetrischer Schwanz, Kiemenspalten), Wal (rundlicher Körper, horizontale Fluke, Blasloch, Paddelflosse), Scheibenfisch (Mondfisch: rund, gespiegelte Riesenflossen, Stummelschwanz), Kopffüßer (Mantel + Tentakel, für Riesen-/Kolosskalmar), Insekt (Mückenfisch: `drawMosquitoShape` – segmentierter Hinterleib, durchscheinende Flügel, sechs Beine, Stechrüssel statt Flossen) und die beiden Unikate Seedrache (Seeschlange mit Drachenkopf) und Kraken (überdimensionaler, gezackter Tintenfisch mit glühenden Augen). Die Tastenfolgen-Logik (Sequenz, schrumpfendes Zeitfenster, Erfolg/Fehlschlag) läuft über einen `requestAnimationFrame`-Loop, der Fristen gegen `performance.now()` prüft. Fischarten und Mutationen werden unabhängig voneinander gewichtet zufällig ausgewählt (Seedrache/Kraken nur aus dem Pool, wenn die passende Rute ausgerüstet ist); gemischte Gewichtseinheiten (g/kg/t) werden für die Gesamtstatistik intern in Gramm normalisiert und dann passend formatiert.

Das Alien-Event läuft komplett unabhängig von der Fisch-/Ruten-Logik: `maybeRollAlienEvent()` wird jeden Frame aus der Hauptschleife aufgerufen, würfelt aber nur einmal pro `ALIEN_CHECK_INTERVAL` (60s) via `performance.now()`-Differenz. Die Alien-Mutation selbst ist ein ganz normaler Eintrag in `MUTATIONS` mit `chance: 0` und `eventOnly: true` – `pickMutation()` schließt `eventOnly`-Einträge aus der normalen gewichteten Auswahl aus, gibt aber sofort `MUTATION_BY_ID.alien` zurück, solange `alienEventUntil` in der Zukunft liegt. Dadurch reicht ein einziges globales Zeitfenster, um *jede* Art (nicht nur eine feste "Alien-Art") für die Dauer des Events grün und mit +300 % Punkten zu färben, ganz ohne Sonderfall in der Fischauswahl selbst.

Der Angler steht auf einem eigens gezeichneten Steg (`drawPier()`): eine Holzplattform, die vom Ufer über das Wasser hinausragt, mit sichtbaren Stützpfählen im wasserseitigen Teil (bewusst außerhalb der Standposition, damit kein Pfahl zwischen den Beinen steht) und angedeuteten Plankenfugen. `pierTopY()` legt die Deckoberkante fest, und `anglerHandPos()` leitet daraus die Körperposition ab (`ANGLER_BODY_HEIGHT_FACTOR` als gemeinsame Konstante mit `drawAngler()`), sodass die Füße exakt auf der Stegoberfläche landen statt im Übergang zwischen Ufer und Wasser zu "versinken".

Das Zombie-Event ist eine reine Kopie dieses Musters mit eigenen Konstanten und eigenem Zeitfenster (`maybeRollZombieEvent()`, `zombieEventUntil`, `ZOMBIE_EVENT_CHANCE = 0.2` statt `0.01`) und einem zweiten `eventOnly`-Mutations-Eintrag (`zombie`, schwächerer Multiplikator, kein Glitzern). `pickMutation()` prüft Alien zuerst und Zombie danach, bevor sie überhaupt in die normale gewichtete Auswahl fällt – bei einem (unwahrscheinlichen) gleichzeitig aktiven Fenster gewinnt also immer Alien.

Das Fischlexikon nutzt zwei zusätzliche `Set`s, `discoveredSpecies` und `discoveredMutations`, die in `succeedCatch()` bei jedem Fang befüllt und (als Arrays) über `saveGame()`/`loadGame()` persistiert werden – bewusst unabhängig vom Punkte-/Ruten-/Köder-Reset in `hardReset()`, damit die Sammlung wie ein echtes Pokédex nie schrumpft. Die Rendering-Funktionen (`renderFishdexCollection()`) iterieren einfach über die kompletten `FISH_SPECIES`- und `MUTATIONS`-Arrays und prüfen pro Eintrag nur `discoveredSpecies.has(id)`/`discoveredMutations.has(id)`, um zwischen echtem Eintrag und "???"-Platzhalter zu unterscheiden.

Promo-Codes teilen sich für "HIGH ALIENS" denselben `startAlienEvent()`-Aufruf wie der natürliche Zufallswurf, und "LUCKY" setzt nur `luckyBuffUntil`, das `pickMutation()` als Multiplikator auf alle `m.chance`-Werte anwendet (der Alien-Event-Zweig bleibt davon unberührt, da er vorher separat abgefragt wird). `PROMO_CODES` ist eine einfache Objekt-Map von exaktem Code-Text auf `{ message, apply() }`; der Vergleich in `redeemPromoCode()` erfolgt bewusst ohne `.toUpperCase()`, Groß-/Kleinschreibung zählt also mit. Der globale `keydown`-Handler für die Angel-Tasten ignoriert Events, deren `target` ein `<input>`/`<textarea>` ist, damit Tippen im Promo-Code-Feld (z. B. der Buchstabe „A“) nicht versehentlich als Angel-Steuerung oder „Weiter angeln“ interpretiert wird.

Das Stunden-Limit pro Code läuft über `promoRedemptions` (`{ [code]: number[] }`, Zeitstempel in `Date.now()`) und wird wie der Rest des Spielstands automatisch in `localStorage` persistiert – bewusst `Date.now()` statt `performance.now()`, weil Letzteres bei jedem Seitenaufruf auf 0 zurückspringt und das Limit sonst durch einfaches Neuladen umgangen werden könnte. `recentRedemptions()` filtert bei jedem Versuch abgelaufene Einträge (älter als `PROMO_RATE_WINDOW_MS`) heraus, bevor gegen `PROMO_RATE_LIMIT` geprüft wird – ein rollierendes Fenster statt einer festen Uhrzeitstunde.

Der Spielstand wird als JSON in `localStorage` gespeichert (`saveGame()`/`loadGame()`) – ein `sessionActive`-Flag merkt sich, ob gerade eine Angel-Session lief (zwischen "Angeln starten"/"Nochmal angeln" und dem Beenden per ✕). `saveGame()` hängt am Ende von `updateHud()`, das nach jeder relevanten Änderung (Fang, Köderverbrauch, Ruten-/Köderkauf, Reset) ohnehin aufgerufen wird, sodass kein Aufrufer einzeln ans Speichern denken muss. Fänge werden dabei nicht als komplette Objekte, sondern nur als `speciesId`/`mutationId` serialisiert und beim Laden über `SPECIES_BY_ID`/`MUTATION_BY_ID` wieder aufgelöst; unbekannte IDs (z. B. nach einem Datenupdate) werden dabei defensiv verworfen. Beim Laden mit `sessionActive === true` springt das Spiel direkt in den Spielbildschirm (`enterGameScreen()`) und startet einen frischen Wurf – eine mitten unterbrochene Wurf- oder Biss-Animation wird bewusst nicht restauriert.
