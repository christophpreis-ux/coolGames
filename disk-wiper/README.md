# Festplatten-Reiniger

Kein Spiel, sondern ein Werkzeug: überschreibt den **freien** Speicherplatz einer Festplatte mit Nullen. Eine Webseite kann das nicht selbst tun – Browser haben keinen Zugriff auf rohen Speicherplatz –, deshalb liefert diese Seite den fertigen Terminal-Befehl bzw. ein Skript zum Kopieren oder Herunterladen, für macOS und Linux gleichermaßen.

## Anzeigen

Einfach `index.html` in einem Browser öffnen, oder lokal servieren:

```bash
cd disk-wiper
python3 -m http.server 8080
# dann http://localhost:8080 öffnen
```

Auf der Seite gibt es zwei "Kopieren"-Buttons (Schnellbefehl als Einzeiler, oder das vollständige Skript mit Sicherheitsabfrage) sowie einen Download-Link für `wipe_free_space.sh`.

## Wie es funktioniert

Es wird eine einzige Datei angelegt, die mit Nullen gefüllt wird, bis der Datenträger voll ist ("kein Speicherplatz mehr") – danach wird genau diese Datei sofort wieder gelöscht. Das überschreibt effektiv alle vorher freien/gelöschten Blöcke mit Nullen, ohne dabei jemals eine vorhandene Datei anzufassen und **ohne jemals direkt auf ein Geräte-/Raw-Device zu schreiben** (also nie sowas wie `/dev/disk0`) – nur ganz normale Dateioperationen innerhalb des angegebenen Verzeichnisses. Ein `trap` auf `EXIT`/`INT`/`TERM` sorgt dafür, dass die Fülldatei auch bei einem Abbruch per Strg+C sauber wieder entfernt wird.

```bash
./wipe_free_space.sh [Zielverzeichnis]
```

Ohne Angabe wird `$HOME` verwendet (i. d. R. das Systemvolume). Für eine externe Festplatte z. B.: `./wipe_free_space.sh /Volumes/MeineDrive` (macOS) oder `./wipe_free_space.sh /media/meindrive` (Linux).

## Wichtige Hinweise

- **SSD/Flash-Speicher** (Standard bei aktuellen Macs): Wear-Leveling und TRIM sorgen ohnehin dafür, dass der Controller "freie" Blöcke intern neu verwaltet – ein Nullen von oben bringt sicherheitstechnisch kaum etwas und erzeugt zusätzlichen Schreibverschleiß. Apple hat deshalb z. B. "Papierkorb sicher leeren" seit Jahren entfernt. Sinnvoll bleibt der Trick trotzdem, etwa um Backup-Images oder VM-Disks danach deutlich besser komprimieren zu können.
- Der Datenträger ist während des Vorgangs kurzzeitig zu 100 % voll – andere offene Programme können in dem Moment Fehler beim Speichern zeigen.
- Je nach freiem Speicherplatz kann der Vorgang lange dauern.

## Technik

Ein einzelnes POSIX-Shellskript (`wipe_free_space.sh`), das ohne Änderungen sowohl unter macOS als auch unter Linux läuft – `dd`, `df` und `rm` sind auf beiden Systemen Standard-Bordmittel. Vor dem eigentlichen Füllen zeigt das Skript den verfügbaren freien Speicher an (`df -Pk`) und fragt einmal explizit nach Bestätigung. `dd if=/dev/zero of=<Fülldatei> bs=1048576` läuft ohne Größenbegrenzung, bis das Dateisystem einen "kein Speicherplatz mehr"-Fehler zurückgibt (der bewusst ignoriert wird, da er das erwartete Ende des Vorgangs markiert); anschließend wird die Fülldatei gelöscht. Die HTML-Seite selbst enthält denselben Skriptinhalt eingebettet als Codeblock (Einzeiler-Variante und volle Skript-Variante) mit Kopieren-Buttons (`navigator.clipboard`, mit `execCommand`-Fallback) sowie einen direkten Download-Link auf die tatsächliche `.sh`-Datei.
