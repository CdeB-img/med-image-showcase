# BIOSTATISTICS-001 — Variable Roles, Missingness and Sensitivity Contract

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — DATA_USE_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorité | `docs/biostatistics-001-analysis-architecture.md` |

## 1. AnalysisVariableRoleAssignment

Chaque assignment référence `canonicalVariableId`, variableVersion, AnalysisSpecification/version, population, temporal context, rôle, transformation éventuelle, source/release et justification. Outcome, exposure, intervention indicator, comparator indicator, covariate, stratification factor, cluster, censoring, weighting, offset, auxiliary variable, analysis time, join identifier et diagnostic variable sont des rôles de travail extensibles.

Un rôle ne modifie ni scientificRole, ni ObservableProperty, ni MeasurementDefinition, ni Endpoint. Une même CanonicalVariable peut avoir plusieurs rôles dans des spécifications distinctes. Un alias ou nom de colonne reste une métadonnée de projection.

## 2. Factual missingness

CDM/DM conservent valeur/statut, reason, expected occasion, source, temps, method, quality, correction history, provenance et lineage. `MISSING`, `NOT_COLLECTED`, `NOT_AVAILABLE`, `NOT_APPLICABLE`, `NOT_EVALUABLE`, `INVALID`, `LOST`, `WITHDRAWN`, `SOURCE_MISSING`, `TECHNICAL_FAILURE` et `UNKNOWN_REASON` ne sont jamais réduits à un null universel.

Biostatistics lit ces faits sans les requalifier. Toute correction factuelle retourne à la source/DM sous mandat et produit un successeur ; elle n'est pas réalisée par une stratégie analytique.

## 3. MissingDataStrategy

La stratégie analytique porte scope, estimand/population, faits concernés, hypothèses, treatment class, modèle ou procédure future, variables auxiliaires, diagnostics, outputs, limitations, sensitivity links, provenance, version, owner et décision. Elle peut décider exclusion, inclusion sous modèle, imputation, pondération, censure ou autre disposition explicitement adoptée ; aucune option n'est recommandée par ce contrat.

Une valeur imputée reste un artefact analytique : source occurrences, algorithm/version, parameters, execution, uncertainty et lineage. Elle ne remplace jamais l'occurrence source, ne devient pas automatiquement CanonicalVariable et ne circule hors de son contexte sans contrat.

## 4. IntercurrentEventStrategy

Chaque événement intercurrent référence event identity/type, source, timing, relation à l'estimand, stratégie, owner, unknowns et décision. Il ne devient pas missingness par absence de mesure et ne doit pas être confondu avec protocol deviation, invalid measurement, method change ou human decision.

## 5. SensitivityAnalysisDefinition

Une sensibilité identifie : analysis primary ref ; hypothesis/choice varied ; scientific rationale ; invariant estimand components ; changed population/model/missingness/definition ; expected comparison ; outputs ; limitations ; pre/post-specification status ; version et owner.

La sensibilité produit une exécution et des résultats distincts. Elle ne remplace ni réécrit l'analyse principale. La robustesse est une interprétation humaine fondée sur l'ensemble, pas un booléen automatique.

## 6. Non-évaluabilité et analyse partielle

Une analyse peut être non évaluable alors qu'une autre sur les mêmes sources demeure possible. Exemple abstrait : une seconde occurrence absente bloque un delta mais n'invalide pas automatiquement une analyse baseline distincte. Toute analyse alternative exige sa propre AnalysisSpecification, population, estimand, statut et décision ; elle n'est jamais une réparation silencieuse.

## 7. Refus

Sont refusés : colonne promue en Variable ; imputation écrasant source ; invalidité transformée en missingness générique ; `NOT_APPLICABLE` traité comme zéro ; event intercurrent inféré lexicalement ; sensibilité requalifiée primaire ; analyse alternative exécutée sans nouvelle specification ; provenance du traitement absente.
