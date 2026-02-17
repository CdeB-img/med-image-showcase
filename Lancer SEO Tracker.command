#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

./scripts/run_seo_rank_tracker.sh | tee -a data/seo/manual_run.log

if [[ -f "data/seo/latest_report_noapi.md" ]]; then
  open "data/seo/latest_report_noapi.md"
elif [[ -f "data/seo/latest_report.md" ]]; then
  open "data/seo/latest_report.md"
fi

echo ""
echo "OK. Resultats dans data/seo/"
echo "Appuie sur Entree pour fermer..."
read -r
