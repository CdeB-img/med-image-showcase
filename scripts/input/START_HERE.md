# START HERE

Utilise seulement ces 2 fichiers:

1. `Lancer SEO Tracker.command`
2. `Installer cron SEO.command`

Resultats:

- `scripts/output/latest_report.md`
- `scripts/output/rank_history.csv`
- `scripts/output/rank_trend.png`

Important fiabilite:

- Si le statut affiche `invalid_no_links`, la mesure est non fiable (moteur bloque/non parsable).
- En mode sans API, le script utilise `bing` par defaut (plus stable que Google en scraping).

Logs/cache/intermediaire:

- `scripts/internal/`

Configuration (optionnelle API):

- `scripts/internal/seo.env`

Requetes suivies:

- `scripts/internal/seo_queries.txt`
