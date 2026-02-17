#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

./scripts/build_seo_dmg

echo ""
echo "DMG genere dans dist/SEO-Rank-Tracker.dmg"
echo "Appuie sur Entree pour fermer..."
read -r
