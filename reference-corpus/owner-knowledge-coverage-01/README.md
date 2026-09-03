# OWNER-KNOWLEDGE-COVERAGE-01

Audit documentaire borné de la couverture des besoins de connaissance par owner. Ce dossier n'est ni une autorité NOXIA, ni un provider Knowledge, ni une admission automatique de sources dans le runtime.

## Livrables

- `owner-knowledge-needs.json` : besoins séparant mécanique owner, connaissance externe, contexte Project et jugement humain ;
- `owner-knowledge-coverage.json` : couverture exacte par source/asset et readiness observée ;
- `owner-knowledge-gap-matrix.json` : gaps classés et priorisés ;
- `knowledge-runtime-reachability.json` : corridor runtime observé et premier gap ;
- `linked-study-propagation-assessment.json` : évaluation des cinq ensembles d'études liés ;
- `targeted-corpus-expansion-plan.json` : acquisitions documentaires ciblées ;
- `reference-knowledge-bridge-plan.md` : conception minimale future, non implémentée ;
- `owner-knowledge-coverage-report.md` : rapport consolidé ;
- `owner-knowledge-coverage.schema.json` et `validate.mjs` : contrat de vocabulaire et contrôles croisés.

## Validation documentaire

```bash
node reference-corpus/reference-corpus-01/validate.mjs
node reference-corpus/owner-knowledge-coverage-01/validate.mjs
```

La validation ne lance ni test produit, ni provider, ni ingestion documentaire.
