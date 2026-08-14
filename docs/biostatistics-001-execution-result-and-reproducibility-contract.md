# BIOSTATISTICS-001 — Execution, Result and Reproducibility Contract

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — EXECUTION_RESULT_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorité | `docs/biostatistics-001-analysis-architecture.md` |

## 1. AnalysisDataset

L'AnalysisDataset est une projection de DatasetRelease. Son identité de projection comprend release/version/digest, AnalysisSpecification/version, population/version, selections, variable/occurrence refs, transformations, time context, quality, factual missingness, restrictions, provenance, lineage, code/procedure refs, creator/runtime futur et digest.

Il ne possède ni Variables, ni occurrences sources, ni vérité scientifique. Model matrix, aggregate et artefact imputé sont des projections/transforms plus bornés et ne doivent pas être confondus avec le release ou un AnalysisResult.

## 2. AnalysisExecution

L'exécution PD-003 porte : executionId/version/status ; specification/version ; amendments ; release/dataset/population ; transformations ; code/procedure/version/digest ; software/libraries/environment ; parameters ; seed ; actor/runtime ; started/ended times ; inputs/outputs/digests ; logs ; warnings ; errors ; diagnostics ; deviations ; controls ; provenance ; lineage ; supersedes/supersededBy ; disposition.

Le raw, les logs et l'erreur sont persistés avant validation aval lorsque le futur runtime le permet. Une exécution doit être idempotente ou explicitement qualifiée quant à l'aléa. Un retry ou rerun produit une trace distincte ; il ne réécrit pas l'ancienne exécution.

## 3. AnalysisDeviation

Une deviation référence specification, expected behavior, observed behavior, time, cause, detection, impacted inputs/outputs, severity, owner, decision, correction éventuelle, reexecution, limitations et audit. La masquer rend l'exécution non recevable pour une projection qui prétend suivre la specification.

## 4. AnalysisResult

Un résultat autonome existe seulement si structure, diagnostics, uncertainty ou lifecycle dépassent une VariableOccurrence dérivée. Son contrat comprend resultId/version/status, specification/execution refs, release/inputs/population, estimand/object, values/structures, uncertainty, diagnostics, quality, limitations, deviations, provenance, lineage, review decisions et supersession.

| Situation | Représentation |
|---|---|
| donnée unitaire dérivée préspécifiée et réutilisable | CanonicalVariable + VariableOccurrence dérivée |
| estimate/contrast/statistic complexe avec diagnostics/incertitude | AnalysisResult |
| execution échouée | AnalysisExecution `FAILED`, aucun résultat inventé |
| résultat non évaluable | disposition explicite, pas zéro/null scientifique |
| nouvelle analyse après correction/release | nouvelle execution et résultat reliés |

## 5. Interprétation

Le résultat statistique décrit les outputs. L'interprétation statistique bornée décrit ces outputs sous le modèle et ses hypothèses. L'interprétation scientifique relie le résultat au Project, aux preuves, contradictions et limites sous décision humaine. La conclusion clinique est une décision engageante séparée. Aucun passage n'est automatique.

## 6. Reconstructibilité et preuves

Le paquet minimal comprend specification, release, population, transformations, code/procedure, environment, software/libraries, parameters, seed si applicable, logs, decisions, deviations, diagnostics, results, uncertainty, provenance et lineage. Un digest prouve une identité de contenu, jamais la validité scientifique.

| Propriété | Sens | Preuve distincte |
|---|---|---|
| repeatability | même configuration/environnement | executions répétées comparables |
| reproducibility | environnement ou opérateur indépendant qualifié | reexecution indépendante |
| robustness | résistance à perturbations pertinentes | analyses planifiées dédiées |
| sensitivity | dépendance à une hypothèse/choix | branches de sensibilité explicites |

## 7. États et refus

`EXECUTION_FAILED`, `NOT_EVALUABLE`, `INVALID`, résultat nul réel, résultat négatif réel, `RESULT_AVAILABLE_WITH_LIMITATIONS` et `REVIEW_REQUIRED` restent distincts. Sont refusés : résultat sans execution ; provenance ou release absente ; software version perdue ; deviation cachée ; output internal-invalid accepté ; échec rapporté comme résultat nul ; ancienne preuve écrasée ; association promue en causalité.
