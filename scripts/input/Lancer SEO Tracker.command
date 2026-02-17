#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT_DIR"

./scripts/internal/run_seo_rank_tracker.sh | tee -a scripts/internal/manual_run.log

if [[ -f "scripts/output/latest_report.md" ]]; then
  open "scripts/output/latest_report.md" || true
fi

echo ""
echo "OK. Resultats dans scripts/output/"
echo "Appuie sur Entree pour fermer..."
read -r
