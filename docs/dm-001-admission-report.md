# DM-001 — Admission Report

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — ADMISSION_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorité | `docs/dm-001-study-data-management-architecture.md` |
| Date | 15 août 2026 |

## 1. Nature et décision

La mission est normative, conceptuelle et documentaire. Elle admet DM-001 comme référence spécialisée de niveau 1, subordonnée à la Charte, au Scientific Product Manifesto V2, à PD-003 V2, à OBS-001 et à CDM-001.

Décision : `DM001_STUDY_DATA_MANAGEMENT_ARCHITECTURE_ADMITTED_WITH_LIMITATIONS`.

DM-001 définit la Data Management Capability : spécifications de collecte, ingestion, contrôles, findings, queries, corrections, réconciliations, transformations opérationnelles, snapshots, freezes, locks, unlocks, releases et audit trail. Il ne crée ni donnée scientifique, ni source parallèle de vérité.

## 2. Vérification de la précondition CDM

La précondition est satisfaite : `docs/cdm-001-canonical-study-data-model.md` est présent, version 1.0, `OFFICIAL — REFERENCE_NORMATIVE_SPECIALIZED_CURRENT`, admis sous la décision `CDM001_CANONICAL_STUDY_DATA_MODEL_ADMITTED_WITH_LIMITATIONS` et répertorié avec ses dix compagnons dans le SOURCE-OF-TRUTH-INDEX courant.

CDM-001 n’a pas été recréé, réécrit ou modifié. DM-001 consomme ses identités, occurrences, statuts, sources, temps, missingness, provenance, dérivations, lignage et projections.

## 3. Autorités et méthode

Le SOURCE-OF-TRUTH-INDEX a été lu intégralement puis les autorités ont été consultées dans l’ordre : Charte ; Manifeste V2 ; manifeste externe de l’Editorial Engine ; PD-003 V2 et compagnons ; OBS-001 et compagnons ; CDM-001 et compagnons ; RDE-001/002 ; PRJ-001 ; REG-001 ; TMP-001 ; DOC-001/001B/002 ; VAL-000.

Les résultats DOC-000B-R1, DOC-000D et les inventaires DOC-002 ont été utilisés uniquement comme sources de patterns. Les plans ont été séparés : principes établis, normes, corpus candidats, cible DM, état réellement implémenté et hypothèses. Aucun résultat historique ou local n’a été promu.

## 4. Arbitrages de classification

| Question | Décision | Justification |
|---|---|---|
| DataManagementDefinition | définition/artefact opérationnel | décrit un processus et son ownership, pas un construit scientifique |
| DataCollectionSpecification | définition/projection | référence Project/CDM ; un champ ne crée pas une Variable |
| DataIngestionRecord | trace d’exécution | décrit un lot, son brut, son résultat et ses erreurs |
| DataQualityFinding | finding | observe sans corriger |
| DataQuery | enveloppe de décision opérationnelle | une question/réponse ne modifie rien seule |
| DataCorrectionRecord | exécution/audit | versionne avant/après et supersession |
| ReconciliationRecord | décision/audit | conserve sources, différences et non-résolus |
| TransformationDefinition | définition subordonnée | réutilise règle, méthode ou AnalysisSpecification selon le sens |
| TransformationExecution | trace d’exécution | relie parents et résultats, sans racine autonome |
| DataSnapshot | projection | vue matérialisée, jamais vérité concurrente |
| DataFreeze / DataLock | enveloppes de décision et audit | états gouvernés de processus |
| DatasetRelease | projection et décision d’usage | paquet versionné dérivé d’un snapshot |
| AuditEvent | audit record | preuve d’événement, non owner du fond |

Aucun artefact ne satisfait un besoin de nouvelle racine PD-003. Aucun changement d’objet, relation ou ownership PD-003/OBS/CDM n’est donc requis.

## 5. Frontières admises

- Research Project possède besoins, variables, occasions, plan, objectifs, endpoints et décisions.
- OBS et les domaines possèdent propriétés, définitions de mesure, critères et limites scientifiques.
- CDM-001 possède la représentation canonique des réalisations et leur lignage.
- Data Management possède le processus opérationnel et peut modifier un état ou une représentation uniquement avec trace.
- La future Biostatistics possède estimands, AnalysisSpecifications, stratégies du missingness, populations, modèles, dimensionnement et interprétation statistique bornée.

La formule historique de RDE-001 selon laquelle Data Management « définit les données » est qualifiée : DM définit les spécifications opérationnelles de collecte et de traitement ; il ne définit ni le besoin scientifique, ni l’identité de Variable, ni le sens de mesure.

## 6. Corpus documentaire utilisé

| Source | Statut appliqué | Apport borné |
|---|---|---|
| DOC-000B-R1 validation SI | `QUALITY_PATTERN` / `HISTORICAL_REFERENCE` | exigences-risques-tests-anomalies-trace-release, sans validation réelle |
| DOC-000B-R1 suivi d’étude | `LOCAL_PRACTICE` | jalons, readiness, déviations, coordination, sans valeurs individuelles |
| DOC-000D Core Lab | `OPERATIONAL_PATTERN` | attendu/reçu, QC, feedback-action-clôture, dérivations d’imagerie |
| comparaison FDA/Core Lab | `REGULATORY_REQUIREMENT_CANDIDATE` | domaines de gouvernance seulement ; aucune règle actuelle déduite |
| DOC-002 | `METHODOLOGICAL_PRACTICE` / `OPERATIONAL_PATTERN` | CRF, DMP, dictionnaire, audit, query, lock et exports candidats |
| TMP-001 | état de structure | projections logiques DM encore futures |
| REG-000/001 | corpus candidat / résolution bornée | exigences restent contextualisées, versionnées et vérifiables |

## 7. Couverture documentaire

La source maîtresse définit quatorze artefacts opérationnels, le cycle de vie, trois projections de collecte, l’ingestion/idempotence/doublons/données tardives, quatre plans de validation, le missingness factuel, neuf catégories de transformation, freeze/lock/unlock/release, provenance/lignage/audit, sept handoffs, quinze cas A–O et vingt contrats DM-C01–DM-C20.

Les six compagnons séparent admission, ownership, collecte/ingestion, qualité/query/correction/réconciliation, transformations/états/release/audit, et compatibilité/impacts.

L'admission ajoute sept documents gouvernés. L'inventaire courant contient 110 fichiers gouvernés dans `docs/` et 42 fichiers présents hors corpus gouverné, soit 152 fichiers physiques dans ce répertoire ; avec vingt livrables gouvernés sous `output/` et deux artefacts racine, le corpus gouverné compte 132 artefacts, ou 133 index inclus.

## 8. Validations

Le validateur déterministe DM-001 contrôle présence, version, statut, liens, ownership, absence de redéfinition CDM, classification sans racine PD-003, quinze cas, vingt contrats, séparation DM/Biostatistics, missingness/imputation, sources/transformation/analyse/projection, absence de données patient, de code produit, de runtime, d’API, d’UI, de provider et de standard déclaré implémenté.

Les références PD-003 V2, OBS-001 et CDM-001 ont été vérifiées par présence, identité, statut, invariants et empreintes Git non modifiées. Le SOURCE-OF-TRUTH-INDEX est réconcilié uniquement après admission. Un contrôle documentaire réussi n’est ni une preuve scientifique, ni une conformité d’implémentation, ni un PASS PD-011.

## 9. Limitations obligatoires

- aucun moteur Data Management implémenté ;
- aucun stockage ;
- aucune base de données ;
- aucun eCRF fonctionnel ;
- aucun EDC ;
- aucun dataset réel ;
- aucune donnée patient ;
- aucune migration V1 ;
- aucun mapping CDISC/FHIR/OMOP implémenté ;
- aucune règle réglementaire déclarée actuelle sans vérification ;
- aucune Biostatistics ;
- aucune campagne PD-011 ;
- aucune activation produit ;
- aucune modification du runtime hybride ;
- aucune réouverture SEM ;
- zéro appel provider, zéro Blind et zéro modification de code produit.

`DM001_STUDY_DATA_MANAGEMENT_ARCHITECTURE_ADMITTED_WITH_LIMITATIONS`
