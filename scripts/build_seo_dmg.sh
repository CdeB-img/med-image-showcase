#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$ROOT_DIR/dist/SEO-Rank-Tracker"
DMG_PATH="$ROOT_DIR/dist/SEO-Rank-Tracker.dmg"
LAUNCHER="$APP_DIR/Lancer SEO Tracker.command"

mkdir -p "$APP_DIR" "$ROOT_DIR/data/seo"

cat > "$LAUNCHER" <<EOF
#!/bin/zsh
set -euo pipefail
cd "$ROOT_DIR"
./scripts/run_seo_rank_tracker.sh | tee -a data/seo/manual_run.log
if [[ -f "data/seo/latest_report_noapi.md" ]]; then
  open "data/seo/latest_report_noapi.md"
elif [[ -f "data/seo/latest_report.md" ]]; then
  open "data/seo/latest_report.md"
fi
EOF

chmod +x "$LAUNCHER"

cat > "$APP_DIR/README.txt" <<'EOF'
SEO Rank Tracker (NOXIA)

1) Double-cliquer sur "Lancer SEO Tracker.command".
2) Le script genere:
   - data/seo/rank_history_noapi.csv (mode sans API)
   - data/seo/latest_report_noapi.md
   - data/seo/rank_trend_noapi.png

Si des clefs Google API sont configurees (.env.seo), il utilisera le mode API.
Sinon, il utilise un mode sans cle (best-effort).
EOF

rm -f "$DMG_PATH"
hdiutil create -volname "SEO Rank Tracker" -srcfolder "$APP_DIR" -ov -format UDZO "$DMG_PATH" >/dev/null

echo "DMG created: $DMG_PATH"
