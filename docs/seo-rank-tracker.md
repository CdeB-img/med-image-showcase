# SEO rank tracker (Google)

Ce script permet de suivre dans le temps la position de votre domaine sur une liste de requetes.

## 1) Prerequis

- Python 3.9+
- Une cle Google Custom Search JSON API
- Un moteur programmable (CSE) configure pour recherche web

Option sans API:

- possible via mode "no-key" (scraping HTML best-effort)
- pas de carte bancaire, mais moins stable

Variables d'environnement requises:

- `GOOGLE_API_KEY`
- `GOOGLE_CSE_ID`

Vous pouvez partir de:

```bash
cp .env.seo.example .env.seo
```

## 2) Fichiers

- Script: `scripts/seo_rank_tracker.py`
- Requetes exemple: `scripts/seo_queries.txt`
- Historique CSV (sortie): `data/seo/rank_history.csv`
- Rapport markdown (sortie): `data/seo/latest_report.md`
- Courbe PNG (sortie): `data/seo/rank_trend.png`

## 3) Execution

```bash
export GOOGLE_API_KEY="votre_cle"
export GOOGLE_CSE_ID="votre_cse_id"

python3 scripts/seo_rank_tracker.py \
  --domain noxia-imagerie.fr \
  --queries-file scripts/seo_queries.txt \
  --hl fr --gl fr --max-results 50
```

Execution sans API (aucune cle):

```bash
./scripts/run_seo_rank_tracker.sh
```

Le script bascule automatiquement:

- mode API si `GOOGLE_API_KEY` + `GOOGLE_CSE_ID` sont presents
- sinon mode sans API (`seo_rank_tracker_noapi.py`)

## 4) Frequence recommandee

- 1 fois par semaine (meme jour, meme heure)
- ou 2 fois/semaine (bi-hebdo) si vous voulez accelerer le suivi des tendances.

## 5) Installation cron bi-hebdo

Le projet contient un installateur de cron:

```bash
chmod +x scripts/run_seo_rank_tracker.sh scripts/install_seo_cron.sh
./scripts/install_seo_cron.sh
```

Cron installe:

- `15 8 * * 2,5` (mardi et vendredi a 08:15, timezone de la machine)
- Commande executee: `scripts/run_seo_rank_tracker.sh`
- Log: `data/seo/cron.log`

## 6) DMG (double-clic)

Pour generer un DMG avec un lanceur:

```bash
chmod +x scripts/build_seo_dmg.sh
./scripts/build_seo_dmg.sh
```

DMG genere:

- `dist/SEO-Rank-Tracker.dmg`
- contient `Lancer SEO Tracker.command` (double-clic)

## 7) Ce que le script "cherche"

Il execute chaque requete de `scripts/seo_queries.txt` via Google Custom Search API, puis:

- scanne les resultats de 1 a `--max-results` (par defaut 50),
- cherche la premiere URL appartenant a `noxia-imagerie.fr`,
- enregistre la position (ou `>50` si non trouve),
- met a jour l'historique CSV et la courbe.

Les requetes sont organisees en 2 groupes:

- `Brand`: requetes sur votre nom/marque,
- `Services`: requetes metier pour mesurer la visibilite hors marque.

## 8) Notes importantes

- Les positions varient selon pays, langue, device et personnalisation.
- Ce script suit une tendance, pas une "position absolue unique".
- Si `matplotlib` n'est pas installe, la courbe PNG est ignoree.
