#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CRON_MARKER="# NOXIA_SEO_TRACKER"
CRON_EXPR="15 8 * * 2,5"
CRON_CMD="cd \"$ROOT_DIR\" && /bin/zsh -lc './scripts/run_seo_rank_tracker.sh >> data/seo/cron.log 2>&1'"
CRON_LINE="$CRON_EXPR $CRON_CMD"

tmpfile="$(mktemp)"
crontab -l 2>/dev/null > "$tmpfile" || true

# Remove previous NOXIA tracker lines
grep -v "NOXIA_SEO_TRACKER" "$tmpfile" | grep -v "run_seo_rank_tracker.sh" > "${tmpfile}.clean" || true
mv "${tmpfile}.clean" "$tmpfile"

{
  echo "$CRON_MARKER"
  echo "$CRON_LINE"
} >> "$tmpfile"

crontab "$tmpfile"
rm -f "$tmpfile"

echo "Cron installed:"
echo "$CRON_MARKER"
echo "$CRON_LINE"
