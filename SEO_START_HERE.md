# SEO tracker: start here

Tu peux ignorer le dossier `scripts/`.

Utilise seulement ces 3 fichiers a la racine:

1. `Lancer SEO Tracker.command`
   - Lance une mesure immediate.
   - Ouvre le dernier rapport.

2. `Installer cron SEO.command`
   - Installe l'execution automatique bi-hebdo (mardi + vendredi 08:15).

3. `Creer DMG SEO.command`
   - Regenerer un DMG si tu veux partager/archiver le lanceur.

Resultats:

- `data/seo/latest_report_noapi.md` (mode sans API)
- `data/seo/rank_history_noapi.csv`
- `data/seo/rank_trend_noapi.png`
- `data/seo/cron.log` (runs cron)

Mode actuel recommande:

- Sans API / sans carte bancaire.
- Le script tente de trouver la position de `noxia-imagerie.fr` sur les requetes de `scripts/seo_queries.txt`.
