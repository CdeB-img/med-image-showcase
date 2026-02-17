# SEO rank tracker (Google)

Ce script permet de suivre dans le temps la position de votre domaine sur une liste de requetes.

## 1) Prerequis

- Python 3.9+
- Une cle Google Custom Search JSON API
- Un moteur programmable (CSE) configure pour recherche web

Variables d'environnement requises:

- `GOOGLE_API_KEY`
- `GOOGLE_CSE_ID`

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

## 4) Frequence recommandee

- 1 fois par semaine (meme jour, meme heure)

## 5) Notes importantes

- Les positions varient selon pays, langue, device et personnalisation.
- Ce script suit une tendance, pas une "position absolue unique".
- Si `matplotlib` n'est pas installe, la courbe PNG est ignoree.
