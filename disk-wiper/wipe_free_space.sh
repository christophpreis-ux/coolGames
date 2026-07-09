#!/usr/bin/env bash
#
# wipe_free_space.sh - überschreibt den FREIEN Speicherplatz eines Volumes
# mit Nullen. Funktioniert unverändert auf macOS und Linux.
#
# Wie es funktioniert: es wird eine einzige Datei angelegt, die mit Nullen
# gefüllt wird, bis der Datenträger voll ist ("kein Speicherplatz mehr").
# Danach wird genau diese Datei wieder gelöscht. Es werden dabei niemals
# vorhandene Dateien angefasst und niemals direkt auf ein Geräte-/Raw-Device
# (z. B. /dev/disk0) geschrieben - nur ganz normale Dateioperationen im
# Dateisystem des angegebenen Verzeichnisses.
#
# Verwendung:
#   ./wipe_free_space.sh [Zielverzeichnis]
#
# Ohne Angabe wird $HOME verwendet (i. d. R. das Systemvolume). Für eine
# externe Festplatte z. B.: ./wipe_free_space.sh /Volumes/MeineDrive
#
# Wichtiger Hinweis zu SSDs/Flash-Speicher (Standard bei aktuellen Macs):
# Wear-Leveling und TRIM sorgen dafür, dass der Controller "freie" Blöcke
# ohnehin intern neu verwaltet - ein Nullen von oben bringt sicherheitstechnisch
# kaum etwas und erzeugt zusätzlichen Schreibverschleiß. Apple hat deshalb u. a.
# "Papierkorb sicher leeren" seit Jahren entfernt. Sinnvoll bleibt der Trick z. B.
# um Backup-Images/VM-Disks danach besser komprimieren zu können.

set -euo pipefail

TARGET_DIR="${1:-$HOME}"
FILL_FILE="$TARGET_DIR/.wipe_free_space_fill.tmp"

cleanup() {
  rm -f "$FILL_FILE"
}
trap cleanup EXIT INT TERM

if [ ! -d "$TARGET_DIR" ]; then
  echo "Verzeichnis nicht gefunden: $TARGET_DIR" >&2
  exit 1
fi

if [ ! -w "$TARGET_DIR" ]; then
  echo "Keine Schreibrechte in: $TARGET_DIR" >&2
  exit 1
fi

FREE_KB=$(df -Pk "$TARGET_DIR" | awk 'NR==2 {print $4}')
FREE_GB=$((FREE_KB / 1024 / 1024))

echo "Ziel-Verzeichnis:  $TARGET_DIR"
echo "Freier Speicher:   ca. ${FREE_GB} GB"
echo
echo "Achtung:"
echo "- Es wird eine Fülldatei angelegt, die den gesamten freien Speicher"
echo "  belegt, danach sofort wieder gelöscht. Bestehende Dateien bleiben"
echo "  unberührt."
echo "- Der Datenträger ist während des Vorgangs kurzzeitig zu 100% voll -"
echo "  andere laufende Programme können dadurch Fehler beim Speichern zeigen."
echo "- Auf SSDs bringt das sicherheitstechnisch wenig (siehe Kommentar oben"
echo "  im Skript), kann aber sinnvoll sein, um Images/Backups zu verkleinern."
echo "- Kann je nach Größe des freien Speichers sehr lange dauern."
echo
read -r -p "Trotzdem fortfahren? [y/N] " confirm
case "$confirm" in
  [yY]|[yY][eE][sS]|[jJ]|[jJ][aA]) ;;
  *) echo "Abgebrochen."; exit 0 ;;
esac

echo "Fülle freien Speicher mit Nullen (Strg+C zum sicheren Abbrechen)..."
dd if=/dev/zero of="$FILL_FILE" bs=1048576 2>/dev/null || true

echo
echo "Räume auf..."
sync 2>/dev/null || true

echo "Fertig: freier Speicher wurde mit Nullen überschrieben, Fülldatei entfernt."
