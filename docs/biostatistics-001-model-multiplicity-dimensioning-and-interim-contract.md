# BIOSTATISTICS-001 — Model, Multiplicity, Dimensioning and Interim Contract

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — METHOD_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorité | `docs/biostatistics-001-analysis-architecture.md` |

## 1. StatisticalMethodDefinition

La définition subordonnée porte identity/version, category, purpose, applicable estimand/data structure, inputs, outputs, assumptions, parameters, constraints, diagnostics, failure conditions, uncertainty, limits, references, owner et status. Elle n'est ni un catalogue de recommandations ni une implémentation.

Les catégories candidates couvrent description, estimation, comparaison, modélisation, longitudinal, time-to-event, diagnostic accuracy, agreement, reproducibility, clustered/multicentre, multivariate, predictive et causal contexts. Leur mention prouve seulement une extensibilité conceptuelle.

## 2. ModelAssumptionSet et DiagnosticPlan

Les hypothèses sont classées : scientific/design, measurement/comparability, data-generation, missingness, model-form et computational/execution. Chaque hypothèse a source, owner, statut, test/diagnostic éventuel, conséquence et sensibilité liée.

Le DiagnosticPlan porte target, method/ref, expected evidence, evaluability rule, severity, owner, disposition et limitations. Un diagnostic n'est pas une vérité scientifique. Un échec ne déclenche aucun model switch caché ; toute alternative exige specification ou branche explicitement versionnée.

## 3. MultiplicityStrategy

Le contrat identifie family, questions/endpoints/times/populations/contrasts/models, ordering ou grouping, strategy class, assumptions, outputs, limits, human decision et version. BIOSTATISTICS-001 ne fixe aucune technique ou seuil. Si la multiplicité est applicable mais non décidée, le statut reste `DECISION_PENDING` ou bloquant selon l'usage.

Une sélection a posteriori du résultat favorable constitue `MULTIPLICITY_HIDDEN` et ne peut être réparée par une annotation de rapport.

## 4. Dimensionnement

`Dimensionnement` est réutilisé sans objet SampleSize. Il porte : Project/Objective/Hypothesis/Estimand refs ; design et population ; assumptions ; chaque assumption source/type/version/owner ; uncertainty ; losses/non-evaluability ; scenarios ; constraints ; future calculation method ref ; outputs attendus ; limitations ; decisions ; provenance ; version et amendment history.

| Source d'hypothèse | Qualification minimale |
|---|---|
| données internes | dataset/release/version, population, méthode et limites |
| littérature/corpus | référence, date, applicabilité et incertitude |
| externe | source, contexte, owner et restrictions |
| pilote | identité, statut, comparabilité et limites |
| expertise | humain, mandat, date, justification et incertitude |
| contrainte opérationnelle | owner, nature, date et impact |
| inconnue | `UNKNOWN`, jamais valeur comblée |

Les scénarios restent concurrents ; aucun effectif n'est calculé ou inventé par cette architecture. Une seule valeur non sourcée bloque l'adoption.

## 5. Randomisation et insu

Project possède la stratégie ; Clinical Operations/DM futurs possèdent l'opération ; Biostatistics définit seulement les éléments analytiques, contraintes et traces applicables. Toute séquence, facteur, restriction, levée d'insu ou accès réel exige owner, mandat, version, confidentialité et audit. Aucun système de randomisation ou participant n'est créé.

## 6. InterimAnalysisDefinition

Cette définition subordonnée porte purpose, trigger/time, DataRelease, population, estimand/model refs, access/blinding, multiplicity link, decision rule class, owner/mandate, committee ref éventuelle, outputs, confidentiality, consequences, audit et limitations. Aucun seuil, calendrier réel, comité ou règle exécutable n'est admis ici.

## 7. Refus

Sont refusés : méthode choisie par fréquence historique ; model redéfinissant MeasurementDefinition ; hypothèse sans source/owner ; diagnostic effacé ; multiplicité post-hoc masquée ; effectif inventé ; interim sans mandat ; randomisation exécutée par Biostatistics documentaire ; résultat statistique interprété comme pertinence clinique.
