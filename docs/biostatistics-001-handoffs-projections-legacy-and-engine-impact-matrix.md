# BIOSTATISTICS-001 — Handoffs, Projections, Legacy and Engine Impact Matrix

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — TRANSITION_IMPACT_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorité | `docs/biostatistics-001-analysis-architecture.md` |

## 1. Handoffs

| Interface | Source de vérité | Payload cible | Refus critique |
|---|---|---|---|
| Project → Biostatistics | ResearchProject/version | question, objectives, hypotheses, populations, interventions/exposures/comparators, endpoints, decisions, unknowns, provenance | Project incomplet ou muté par analyse |
| OBS/domaines → Biostatistics | OP/MD/version | meaning, conditions, performance, quality, uncertainty, comparability, limitations, sources | model redefines measure |
| CDM → Biostatistics | CDM objects/versions | CanonicalVariables, occurrences, sources/methods/times, units, statuses, quality, factual missingness, lineage | matrix without identity/context |
| DM → Biostatistics | DatasetRelease/version/digest | snapshot, scope, restrictions, findings, queries, corrections, transforms, audit, limits | release treated as truth or rewritten |
| Biostatistics → CDM/DM | Analysis specs/executions/results | refs, inputs, transforms, outputs, uncertainty, provenance, lineage, impact | source occurrence overwritten |
| Biostatistics → DOC/TMP | governed analytical objects | SAP, methods, shells, data spec, reports, diagnostics, deviations, sensitivities | projection owns content |
| Biostatistics → VAL | contracts and evidence | checkpoints, artifacts, versions, findings, decisions | PASS or correction automatic |
| Biostatistics → future QRY | analysis gaps | unknowns, ambiguities, decision needs, owner, value rationale | Biostatistics chooses product next action |

## 2. Projections

| Projection | Sources obligatoires | Ne possède jamais |
|---|---|---|
| SAP | Project + AnalysisSpecifications + decisions | dictionnaire scientifique, data ou résultats |
| Statistical Methods | methods/specifications/version | méthode adoptée sans décision |
| Analysis Specification Catalog | specs et versions | contenu source autonome |
| TLF shells | expected outputs + definitions | résultats futurs |
| Analysis Data Specification | CDM/DM release + roles/transforms | CanonicalVariable identity |
| Statistical Report | executions/results/diagnostics/limits | interprétation scientifique automatique |
| Results Tables | AnalysisResults | vérité clinique |
| Model Diagnostics | executions/diagnostic plans | décision de modèle cachée |
| Deviation Report | AnalysisDeviations | correction automatique |
| Sensitivity Report | primary + sensitivity results | remplacement de l'analyse primaire |

Chaque projection porte projectionId/version, source identities/versions, profile/audience, owner, decisions, limitations, state, provenance, digest et supersession. Une modification revient sous forme de Contribution à l'owner ; jamais comme écriture inverse directe.

## 3. Legacy compatibility

| Legacy | Lecture compatible | Mapping refusé ou limité |
|---|---|---|
| type V1 `Analyse` | AnalysisSpecification si le contenu décrit une spécification | AnalysisExecution/Result inventé |
| SAP historique | projection historique + extraction prudente de refs | règle actuelle ou dictionnaire parallèle |
| nom de colonne/dataset | alias de projection vers Variable si preuve | nouvelle CanonicalVariable lexicale |
| population textuelle | candidate AnalysisPopulationDefinition | mutation population Project |
| règle de missingness textuelle | candidate MissingDataStrategy avec owner/source | factual missingness écrasé |
| output statistique historique | candidate result/evidence selon provenance | AnalysisResult officiel sans execution |
| mention « final » ou signature | metadata historique | approbation réelle inférée |
| standard/code externe | TerminologyMapping ou requirement à résoudre | identité NOXIA remplacée |
| procédure locale Core Lab/CIC | Local Practice/Historical Reference | méthode générale ou réglementation actuelle |

Les dispositions sont `LEGACY_READABLE`, `MAPPING_REQUIRED`, `AMBIGUOUS_LEGACY`, `MAPPED_WITH_LIMITATIONS` ou `REFUSED_MAPPING`. Toute conversion conserve source/version/digest, localisateur, décision, pertes, alternatives, actor/mandate/date et supersession.

## 4. Engine impact

| Consumer/capability | État observé | Impact cible | Autorisation actuelle |
|---|---|---|---|
| Research Project / PRJ | objets Project existants, aucune adaptation BIO | handoff versionné Project → Specification | documentaire seulement |
| OBS/Imaging/Laboratory | owners de mesure existants | références qualité/comparabilité vers analyse | aucune mutation |
| CDM | architecture documentaire admise | inputs et conservation results | aucune implémentation |
| DM | architecture documentaire admise | DatasetRelease et audit vers analyse | aucune implémentation |
| Biostatistics runtime | absent | minimal V1 futur | interdit dans BIOSTATISTICS-001 |
| TMP/DOC | projections/capacités existantes ou cibles | profiles SAP/report/shells | aucun document réel généré |
| VAL | architecture et validators historiques | VAL-BIO-01–10 futurs | aucun seuil/PASS |
| QRY | non admis comme capacité applicable ici | exposer unknowns futurs | aucune sélection de question |
| REG | resolver/corpus selon statut | qualifier exigences futures | aucune règle actuelle déduite |
| SEM/hybrid runtime | historique séparé | aucun impact | fermé, non rouvert |

## 5. Gates futures

1. implémenter uniquement les handoffs CDM/DM/Biostatistics sous mission autorisée ;
2. démontrer identité/version/provenance sur fixtures synthétiques ;
3. préserver lectures legacy sans écriture implicite ;
4. ajouter les checkpoints VAL-BIO sans seuil inventé ;
5. qualifier projections TMP/DOC séparément ;
6. soumettre toute racine ou relation manquante à PD-003 ;
7. garder publication/activation fermées jusqu'aux autorités applicables.

## 6. Interdictions permanentes

Aucune donnée patient, analyse réelle, calcul, effectif, méthode sélectionnée, SAP final, randomisation, interim, imputation, standard implémenté, migration V1, changement SEM/hybride, PASS PD-011 ou activation produit ne découle de cette matrice.
