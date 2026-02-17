#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
INTERNAL_DIR="$ROOT_DIR/scripts/internal"
OUTPUT_DIR="$ROOT_DIR/scripts/output"
cd "$ROOT_DIR"

# Option 1: external env file (recommended for cron)
# Example path: ~/.config/noxia-seo.env
if [[ -f "${SEO_ENV_FILE:-$HOME/.config/noxia-seo.env}" ]]; then
  # shellcheck disable=SC1090
  source "${SEO_ENV_FILE:-$HOME/.config/noxia-seo.env}"
fi

# Option 2: repo-local env file in scripts/internal
if [[ -f "$INTERNAL_DIR/seo.env" ]]; then
  # shellcheck disable=SC1091
  source "$INTERNAL_DIR/seo.env"
fi

mkdir -p "$OUTPUT_DIR" "$INTERNAL_DIR"

# Ensure matplotlib/fontconfig can write cache in all environments.
export MPLCONFIGDIR="${MPLCONFIGDIR:-$INTERNAL_DIR/.mplconfig}"
export XDG_CACHE_HOME="${XDG_CACHE_HOME:-$INTERNAL_DIR/.cache}"
export MPLBACKEND="${MPLBACKEND:-Agg}"
mkdir -p "$MPLCONFIGDIR" "$XDG_CACHE_HOME" "$XDG_CACHE_HOME/fontconfig"

if [[ -n "${GOOGLE_API_KEY:-}" \
  && -n "${GOOGLE_CSE_ID:-}" \
  && "${GOOGLE_API_KEY:-}" != "replace_me" \
  && "${GOOGLE_CSE_ID:-}" != "replace_me" ]]; then
  echo "Mode: Google API (with credentials)"
  python3 "$INTERNAL_DIR/seo_rank_tracker.py" \
    --domain noxia-imagerie.fr \
    --queries-file "$INTERNAL_DIR/seo_queries.txt" \
    --history-csv "$OUTPUT_DIR/rank_history.csv" \
    --report-md "$OUTPUT_DIR/latest_report.md" \
    --chart-png "$OUTPUT_DIR/rank_trend.png" \
    --hl fr \
    --gl fr \
    --max-results 50
else
  echo "Mode: No API key (best-effort HTML parsing)"
  SEO_NOAPI_ENGINE="${SEO_NOAPI_ENGINE:-bing}"
  python3 "$INTERNAL_DIR/seo_rank_tracker_noapi.py" \
    --domain noxia-imagerie.fr \
    --queries-file "$INTERNAL_DIR/seo_queries.txt" \
    --history-csv "$OUTPUT_DIR/rank_history.csv" \
    --report-md "$OUTPUT_DIR/latest_report.md" \
    --chart-png "$OUTPUT_DIR/rank_trend.png" \
    --hl fr \
    --gl fr \
    --max-results 50 \
    --engine "$SEO_NOAPI_ENGINE"
fi
