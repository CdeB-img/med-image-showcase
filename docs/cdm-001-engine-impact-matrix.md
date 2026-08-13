# CDM-001 — Engine Impact Matrix

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — ENGINE_IMPACT_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorité | CDM-001 |

## 1. Règle de lecture

Cette matrice décrit les adaptations normatives prévisibles. Elle ne modifie aucun moteur et ne prouve aucune incompatibilité réellement observée, implémentation, adapter, évaluation ou activation. `Breaking?` qualifie le risque pour un consumer qui prétendrait écrire/lire CDM-001.

## 2. Matrice obligatoire

| Engine | Current normative contract | CDM dependency | Required adaptation | Breaking? | Adapter needed? | Implementation required? | Evaluation required? |
|---|---|---|---|---|---|---|---|
| Knowledge | KE-001 possède concepts, assertions, sources scientifiques, preuves, gaps et applicabilité | CDM référence la science sans la copier ; StudyDataSource reste distincte | exposer refs/version/context ; distinguer source scientifique et source de donnée | potentiel si fusion de sources | à déterminer | oui, mission séparée | oui |
| Scientific Thinking | RDE/PD-005 produisent questions, modèles, options et contributions | DataNeed/Variable sont adoptés par Project, jamais par ST | proposer des objets V2 sans occurrence, valeur ou adoption implicite | oui pour chaîne V1 composite | probable | oui, mission séparée | oui |
| OBS | OBS-001 possède OP, MD, rôles, conditions, performances et qualité attendue | CDM conserve planned/actual MD, comparabilité et limites | préparer un handoff référencé ; ne pas produire d’occurrence | non pour mission ; oui pour consumer CDM | limité | oui, mission séparée | oui |
| Imaging | RDE-003/IMG possèdent mesure, acquisition, lecture et QA Imaging | CDM représente unités, occurrences, source, temps et lineage Imaging | séparer définition/exécution/donnée/analyse ; préserver formats comme sources | potentiel | probable | oui, mission séparée | oui |
| Research Project | PD-003/RDE possèdent DataNeeds, Variables, occasions, choix et décisions | Project→CDM est le handoff fondateur | produire ids/versions/attentes/unknowns/decisions complets | oui pour writers V1 | probable | oui, mission séparée | oui |
| REG | REG-001 résout Requirements et applicabilité sans muter Project | CDM peut fournir des faits bornés et mappings | référencer provenance et temporalité ; ne pas définir variables/validité | non par principe | à déterminer | à déterminer | oui si adapté |
| DOC-002 | patterns documentaires, sans science ni document | patterns peuvent encadrer projections CDM | conserver canonical refs, statuses, limitations et owner | potentiel | à déterminer | oui, mission séparée | oui |
| TMP | composition logique de documents, dependencies futures | CRF, Data Dictionary, SAP, SoA structurent des projections CDM | accepter refs CDM et refuser toute création de Variable/Occurrence | oui pour templates déclarés CDM | probable | oui, mission séparée | oui |
| DOC | projection/rendu à partir de Project/TMP | projeter data autorisées sans corriger le fond | rendre identity/version/source/status/lineage/limits | oui pour documents CDM | probable | oui, mission séparée | oui |
| VAL | diagnostics structuraux read-only ; aucun checkpoint CDM | neuf checkpoints de fidélité futurs | ajouter invariants/cas sans déclarer validité scientifique | nouvelle couverture | oui | oui, mission séparée | oui, obligatoire |
| future Data Management | responsabilité non encore admise | CDM est son contrat canonique amont | ingestion, quality, correction, freeze/lock sans redéfinir sens | nouvelle brique | non applicable | oui après norme dédiée | oui |
| future Biostatistics | responsabilité non encore admise | reçoit Variables/Occurrences contextualisées ; retourne Results | séparer rôle analytique, transformation, execution, result, interpretation | nouvelle brique | non applicable | oui après norme dédiée | oui |

## 3. Adaptations transversales minimales

Tout consumer futur doit démontrer : même CanonicalVariable dans collecte/analyse/projections ; distinction Variable/Occurrence ; expected/realized et planned/actual ; axes de valeur/missingness ; source et méthode réelles ; unité originale ; qualité ; corrections non destructives ; lineage exhaustif ; mappings non autoritaires ; unknowns/contradictions ; ownership ; legacy en lecture ; décisions humaines.

## 4. Breaking changes conceptuels

Sont breaking pour une revendication CDM : champ/colonne utilisé comme identité ; Variable dupliquée par timepoint/méthode/source ; `null` comme missingness suffisant ; source/méthode planifiée écrasée ; conversion destructive ; derivation sans parents ; dataset/SAP propriétaire du sens ; standard externe comme modèle interne ; AnalysisResult promu en interprétation.

Les artefacts historiques restent valides dans leur contexte V1. Le breaking change porte sur toute écriture ou revendication V2, pas sur leur conservation.

## 5. Ordre de travail futur

1. architecture normative Data Management ;
2. architecture normative Biostatistics/Analysis ;
3. adapters Project/OBS/domaines vers CDM ;
4. projections CRF/Data Dictionary/SoA/SAP/datasets/standards ;
5. checkpoints VAL ;
6. campagne PD-011 distincte ;
7. seulement ensuite, décision de migration ou activation.

## 6. Provider et état réel

Aucun appel Gemini, campagne SEM, benchmark provider ou quota externe n’est utilisé. SEM-001R3 ne bloque ni ne qualifie les adaptations. Aucun code, moteur, schéma, donnée, test produit ou adapter n’est modifié ; les statuts de la matrice sont documentaires.

## 7. Limitations

L’état technique actuel n’a pas été audité pour conformité CDM au-delà des rapports imposés. Les owners organisationnels, technologies, formats, coûts, planning, corpus de fixtures et seuils d’évaluation restent hors périmètre.
