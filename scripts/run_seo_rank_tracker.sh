#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Option 1: external env file (recommended for cron)
# Example path: ~/.config/noxia-seo.env
if [[ -f "${SEO_ENV_FILE:-$HOME/.config/noxia-seo.env}" ]]; then
  # shellcheck disable=SC1090
  source "${SEO_ENV_FILE:-$HOME/.config/noxia-seo.env}"
fi

# Option 2: repo-local env file
if [[ -f ".env.seo" ]]; then
  # shellcheck disable=SC1091
  source ".env.seo"
fi

mkdir -p data/seo

if [[ -n "${GOOGLE_API_KEY:-}" \
  && -n "${GOOGLE_CSE_ID:-}" \
  && "${GOOGLE_API_KEY:-}" != "replace_me" \
  && "${GOOGLE_CSE_ID:-}" != "replace_me" ]]; then
  echo "Mode: Google API (with credentials)"
  python3 scripts/seo_rank_tracker.py \
    --domain noxia-imagerie.fr \
    --queries-file scripts/seo_queries.txt \
    --history-csv data/seo/rank_history.csv \
    --report-md data/seo/latest_report.md \
    --chart-png data/seo/rank_trend.png \
    --hl fr \
    --gl fr \
    --max-results 50
else
  echo "Mode: No API key (best-effort HTML parsing)"
  python3 scripts/seo_rank_tracker_noapi.py \
    --domain noxia-imagerie.fr \
    --queries-file scripts/seo_queries.txt \
    --history-csv data/seo/rank_history_noapi.csv \
    --report-md data/seo/latest_report_noapi.md \
    --chart-png data/seo/rank_trend_noapi.png \
    --hl fr \
    --gl fr \
    --max-results 50 \
    --engine google
fi
