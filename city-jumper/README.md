# City Jumper

Ein 2D-Browser-Endless-Runner: Die Figur läuft automatisch über die Dächer der Stadt, wird dabei stetig schneller, und du musst rechtzeitig über die Lücken zum nächsten Haus springen.

## Spielen

Einfach `index.html` in einem Browser öffnen, oder lokal servieren:

```bash
cd city-jumper
python3 -m http.server 8080
# dann http://localhost:8080 öffnen
```

## Spielprinzip

- Die Figur läuft automatisch immer weiter nach vorne – du steuerst nur den Sprung, nicht die Vorwärtsbewegung.
- **Leertaste** (oder Tippen/Klicken auf das Spielfeld) löst einen Sprung aus, sobald du auf einem Dach stehst.
- Drückst du die Leertaste noch einmal, während du in der Luft bist, machst du einen **Doppelsprung** – nötig für die breiteren Lücken.
- Das Lauftempo nimmt stetig zu (bis zu einer Obergrenze) – dadurch bleibt weniger Reaktionszeit in echten Sekunden, auch wenn die Lücken selbst immer fair springbar bleiben (siehe Technik).
- Verpasst du die Kante eines Dachs oder eine Lücke ist zu breit, fällt die Figur herunter – der Lauf ist vorbei.
- Die zurückgelegte Strecke wird live als Punktzahl angezeigt. Der **Rekord wird automatisch gespeichert** (localStorage) und überlebt das Schließen der Seite.
- Eine kurze Gnadenfrist (Coyote-Time) erlaubt einen normalen Sprung auch dann noch, wenn du die Leertaste erst kurz nach dem Verlassen der Kante drückst.

## Technik

Reines HTML/CSS/JavaScript, kein Build-Schritt, keine externen Abhängigkeiten. Die komplette Szene (Parallax-Skyline im Hintergrund, Häuser mit Fenster-Textur, Läufer-Figur) wird auf Canvas 2D gezeichnet. Die Spielerfigur bleibt auf einer festen Bildschirm-x-Position (`PLAYER_SCREEN_X_FACTOR`); stattdessen scrollt die Welt (Häuser bewegen sich nach links), klassisches Endless-Runner-Prinzip.

Alle Physik- und Tempo-Konstanten sind als Anteil von `canvas.width`/`canvas.height` statt fixer Pixelwerte definiert, damit sich das Spiel unabhängig von der tatsächlichen Fenstergröße immer gleich anfühlt. Die Sprungzeit (`jumpAirTime()`, `T = 2·V/G`) ist dadurch unabhängig von der Canvas-Größe konstant (~0,6 s). Die Lückenbreite zwischen zwei Häusern (`spawnNextBuilding()`) wird relativ zur **aktuellen** Lauf-Geschwindigkeit generiert (`maxSingle = Tempo × T`), in drei Kategorien – leicht (lockerer Einfachsprung), mittel (braucht gutes Timing) und schwer (braucht den Doppelsprung). Dadurch bleiben Lücken bei jedem Tempo grundsätzlich fair springbar; schwerer wird das Spiel dadurch, dass bei höherem Tempo weniger reale Zeit zum Reagieren bleibt, nicht dadurch, dass Lücken plötzlich unfair breit würden. Höhenunterschiede zwischen aufeinanderfolgenden Dächern sind auf einen Bruchteil der maximal erreichbaren Sprunghöhe begrenzt, damit ein höheres nächstes Dach immer erreichbar bleibt.

Landung/Fall-Erkennung läuft über `groundYAt(screenX)`, das prüft, ob an der festen Spieler-x-Position gerade ein Hausdach liegt. Fehlt der Boden – ob durch Sprung oder schlicht verpasste Kante –, beginnt automatisch der freie Fall (`falling = true`), inklusive `COYOTE_TIME_MS`-Gnadenfrist für einen noch normal zählenden Sprung kurz nach Kantenverlust. Der Doppelsprung ist über einen einfachen `jumpsUsed`-Zähler (0/1/2) begrenzt, der bei jeder Landung zurückgesetzt wird.

Die Strecke wird auflösungsunabhängig als `distanceFactor` (Anteil von `canvas.width` pro Sekunde, aufsummiert) statt in rohen Pixeln getrackt, damit die Punktzahl unabhängig von der Fenstergröße vergleichbar bleibt. Der Rekord wird als einfache Zahl unter `city_jumper_highscore_v1` in `localStorage` gespeichert.
