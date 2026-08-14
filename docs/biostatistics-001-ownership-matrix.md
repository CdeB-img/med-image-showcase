# BIOSTATISTICS-001 — Ownership Matrix

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — OWNERSHIP_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorité | `docs/biostatistics-001-analysis-architecture.md` |

## 1. Règle générale

Créer, contribuer, consommer, décider, corriger, versionner, exécuter et projeter sont des responsabilités distinctes. Une contribution analytique ne transfère ni l'ownership Project, ni celui de la mesure, ni celui de la donnée source.

## 2. Matrice par construction

| Construction | Owner du sens | Contributeurs | Consommateurs | Adoption/décision | Correction/version | Exécution | Projection |
|---|---|---|---|---|---|---|---|
| question/objectifs/hypothèses | Research Project | Scientific Thinking, Knowledge, domaines | Biostatistics, DOC, VAL | humain Project | Project | non applicable | DOC/TMP |
| population Project | Research Project | domaines, Clinical Operations | Biostatistics, DM | humain Project | Project | opérations spécialisées | DOC/TMP |
| Endpoint | Research Project | OBS/domaines, Biostatistics | specs, documents | humain Project | Project | non applicable | DOC/TMP |
| ObservableProperty | OBS/domaine | Knowledge | Project, Biostatistics, CDM | gouvernance domaine | OBS | non applicable | documents domaine |
| MeasurementDefinition | OBS/domaine | Imaging/Laboratory/Clinical/Device | Project, CDM, Biostatistics | owner domaine + Project pour usage | OBS/domaine | domaine | DOC/TMP |
| CanonicalVariable | Research Project | OBS/domaines, CDM | DM, Biostatistics, projections | humain Project | Project | CDM/DM pour occurrences | DOC/TMP |
| VariableOccurrence | source/CDM selon contrat | sites, systèmes, domaines, DM | Biostatistics, documents | disposition humaine si requise | source/DM sous mandat | source/DM | datasets/documents |
| factual missingness | CDM/DM factuel | source/domaines | Biostatistics | owner factuel applicable | source/DM | DM | reports |
| DatasetRelease | DM | CDM, domaines, owner usage | Biostatistics | humain/instance autorisée | DM via successor | DM | AnalysisDataset |
| AnalysisSpecification | Biostatistics/domaine analytique | Project, OBS, CDM, DM | executions, DOC, VAL | humain mandaté | Biostatistics | non applicable | SAP/catalogue |
| Estimand | Biostatistics sous Project | Project/domaines | methods/results/docs | humain mandaté | Biostatistics | non applicable | SAP/report |
| AnalysisVariableRoleAssignment | Biostatistics | CDM/Project | executions | owner specification | Biostatistics | AnalysisExecution | SAP/dataset spec |
| AnalysisPopulationDefinition | Biostatistics | Project, CDM, DM | executions/results | humain selon gouvernance | Biostatistics | AnalysisExecution | SAP/report |
| MissingDataStrategy | Biostatistics | CDM/DM factuels, Project | executions/results | humain mandaté | Biostatistics | AnalysisExecution | SAP/report |
| IntercurrentEventStrategy | Biostatistics | Project/domaines | estimands/executions | humain mandaté | Biostatistics | AnalysisExecution | SAP/report |
| StatisticalMethodDefinition | Biostatistics/domaine analytique | experts applicables | AnalysisSpecification | humain mandaté | Biostatistics | AnalysisExecution | SAP/methods |
| MultiplicityStrategy | Biostatistics | Project | executions/results | humain mandaté | Biostatistics | AnalysisExecution | SAP/report |
| Dimensionnement | Biostatistics sous décision Project | sources et experts déclarés | Project/DOC | humain mandaté | Biostatistics/Project | future exécution dédiée | protocol/SAP |
| AnalysisDataset | Biostatistics comme consumer-projection | DM/CDM | AnalysisExecution | owner specification | successor, jamais mutation source | chaîne analytique | data specification |
| AnalysisExecution | processus analytique sous mandat | runtime/analyste futur | AnalysisResult, audit, VAL | owner analytique | nouvelle exécution | système/analyste autorisé | logs/diagnostics |
| AnalysisResult | owner analytique | execution, CDM/DM | Project, DOC, VAL | humain pour usage/interprétation | supersession/réanalyse | produit par execution | tables/reports |
| StatisticalInterpretationEnvelope | Biostatistics | Project/domaines | humain mandaté | humain mandaté | nouvelle version | non applicable | report |
| ScientificInterpretation | humain Project mandaté | Knowledge, domaines, Biostatistics | décisions/documents | humain mandaté | Project | non applicable | documents |

## 3. Matrice de handoff

| De → vers | Owner qui demeure | Droit transmis | Droit interdit |
|---|---|---|---|
| Project → Biostatistics | Project | référencer et analyser sous mandat | changer question/endpoint/population |
| OBS → Biostatistics | OBS/domaine | consommer définition/qualifications | redéfinir mesure/validité |
| CDM → Biostatistics | Project/CDM/source selon objet | sélectionner des inputs | recréer Variables ou occurrences |
| DM → Biostatistics | DM pour release/audit | projeter un AnalysisDataset | modifier release ou source |
| Biostatistics → CDM/DM | Biostatistics pour specs/results | conserver lineage et impact | écraser occurrences/releases |
| Biostatistics → DOC/TMP | chaque owner source | rendre une projection | faire du document une vérité |
| Biostatistics → VAL | owners sources | diagnostiquer | corriger automatiquement ou déclarer PASS |

## 4. Décisions humaines réservées

Restent humaines et mandatées : adoption/amendement d'une AnalysisSpecification ; adoption d'un estimand, d'une population, d'une méthode ou d'un Dimensionnement ; traitement d'une contradiction ; interprétation scientifique ; conclusion clinique ; autorisation de publication, d'activation ou de modification du Project. L'absence de mandat maintient `DECISION_PENDING` ou bloque l'usage concerné.

## 5. Refus

Sont refusés : owner absent ; handoff interprété comme transfert ; correction analytique d'une source ; méthode ou population adoptée implicitement ; Project/OBS/CDM/DM muté depuis un SAP, dataset, modèle ou résultat ; interprétation automatique.
