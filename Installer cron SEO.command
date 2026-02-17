#!/bin/zsh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

./scripts/install_seo_cron.sh

echo ""
echo "Cron SEO installee (mardi/vendredi 08:15)."
echo "Appuie sur Entree pour fermer..."
read -r
