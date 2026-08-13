# CDM-001 — Biospecimen Data Contract

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — BIOSPECIMEN_DATA_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorité | CDM-001 ; PD-003 V2 pour Biospecimen |

## 1. Principe

Un Biospecimen est une identité matérielle autonome. Il n’est ni Variable, ni VariableOccurrence, ni MeasurementDefinition, ni StudyDataSource. Son existence n’implique aucune analyse, propriété observable, rôle biomarqueur ou résultat.

## 2. Contrat Study Data

| Élément | Exigence |
|---|---|
| biospecimenId / version | identité matérielle stable, supersession explicite |
| parentBiospecimenRef | filiation collection, fraction, dérivé, aliquot |
| sourceStudyUnit | participant/sujet/autre unité et version |
| collectionContext/time | acte, site, mandat, temps et source |
| materialType | qualification gouvernée, pas label libre autoritaire |
| processing | étapes, conditions, times, systems, versions |
| storage | conditions, localisation gouvernée, périodes |
| aliquoting | parents, enfants, quantités et pertes |
| quantity/availability | unité, état, date et incertitude |
| quality | pre-analytical/material checks réels |
| chainOfCustody | acteurs/systèmes, transferts, dates |
| restrictions | consentement, usage, accès, destruction |
| provenance | source, versions, corrections, audit |

## 3. Chaînes normatives

### 3.1 Avec assay

Participant → collection → Biospecimen blood → plasma → aliquot → assay/MeasurementDefinition → VariableOccurrence.

L’occurrence `USES_BIOSPECIMEN` l’aliquot exact et `PRODUCED_BY` l’assay/exécution. Le type d’échantillon ne remplace pas l’identité matérielle. Le résultat ne redéfinit ni Biospecimen ni méthode.

### 3.2 Fécothèque sans analyse

Participant → collection → stool Biospecimen → aliquots → stockage/disponibilité.

Sont représentables : identités, parentage, processing, stockage, quantité, disponibilité, qualité, chaîne de garde, restrictions et provenance. Ne sont pas créés : BiomarkerRole, MeasurementDefinition analytique, CanonicalVariable analytique, AnalysisSpecification ou AnalysisResult. Un usage futur reste DataNeed, Option, Hypothesis ou unknown Project selon le contexte.

## 4. Expected versus actual

Un plan de Biospecimen peut être lié à une ExpectedVariableOccasion ou à une attente matérielle Project, sans produire un specimen réel. La collecte réelle conserve temps, site, méthode/procédure, déviations et source. Une collecte non réalisée, un specimen détruit et un aliquot indisponible ont des statuts distincts.

## 5. Missingness et qualité

Sont distingués : collection non applicable ; non réalisée ; specimen collecté mais perdu ; quantité insuffisante ; qualité insuffisante ; aliquot indisponible ; accès restreint ; assay non réalisé ; résultat assay invalide/non évaluable. L’état matériel n’est jamais copié comme statut de valeur sans relation explicite.

## 6. Ownership

Biobanking/domaine possède l’identité matérielle et la chaîne de garde ; ResearchProject adopte l’usage ; site/source produit et documente ; Laboratory possède l’assay ; CDM/Data représente et conserve ; Biostatistics consomme les résultats autorisés. Toute décision d’usage/destruction/retrait reste humaine et mandatée.

## 7. Corrections, lineage et restrictions

Correction d’identité, parentage, quantité, localisation ou statut crée une version/supersession ; aucun historique n’est effacé. Toute occurrence dérivée conserve specimen/aliquot, assay/version et chaîne. Les restrictions suivent les descendants et projections selon leur politique ; une disponibilité matérielle n’accorde aucun droit d’usage.

## 8. Limitations

Cette annexe ne crée ni biobanque, inventaire, taxonomie de matériaux, chaîne de custody technique, consentement, procédure de collection, assay, valeur ou donnée patient.
