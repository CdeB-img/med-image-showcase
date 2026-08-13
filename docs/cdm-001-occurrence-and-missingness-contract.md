# CDM-001 — Occurrence and Missingness Contract

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — OCCURRENCE_MISSINGNESS_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorité | CDM-001 puis PD-003 V2 |

## 1. VariableOccurrence

Une occurrence est la réalisation, tentative, absence qualifiée, invalidité, non-applicabilité ou dérivation d’une version de CanonicalVariable pour une StudyUnitReference et un contexte temporel. Elle possède exactement un `REALIZES`; elle peut posséder zéro ou une `FULFILLS_OCCASION` principale, avec relations complémentaires explicites.

Contrat minimal : occurrenceId ; variable id/version ; StudyUnitReference ; expected occasion ; temps réels ; source/contexte ; MD réelle/version ; contenu ; statuts ; unité réelle ; ValueDomain version ; qualité ; provenance ; parents ; transformations ; corrections ; supersession ; audit ; restrictions ; unknowns ; limitations.

## 2. Axes orthogonaux

| Axe | Questions | Exemples de qualifications |
|---|---|---|
| existence de contenu | une valeur/catégorie est-elle présente ? | `OBSERVED_VALUE`, `NO_VALUE` |
| réalisation | collecte/tentative a-t-elle eu lieu ? | realized, not collected, partial |
| applicabilité | l’attente s’applique-t-elle ? | applicable, `NOT_APPLICABLE`, unknown |
| validité | le contenu satisfait-il les règles ? | valid, `INVALID`, unknown |
| évaluabilité | permet-il l’évaluation attendue ? | evaluable, `NOT_EVALUABLE` |
| disponibilité | source/contenu est-il accessible ? | available, `NOT_AVAILABLE`, `SOURCE_UNAVAILABLE` |
| qualité | quels contrôles/résultats réels ? | qualifiés par dimension |
| utilisation | quelle disposition a été décidée ? | accepted, rejected, withdrawn, analysis-excluded |

Les termes du mandat (`MISSING_EXPECTED`, `NOT_COLLECTED`, `NOT_AVAILABLE`, `NOT_APPLICABLE`, `NOT_EVALUABLE`, `INVALID`, `REJECTED`, `WITHDRAWN`, `SOURCE_UNAVAILABLE`, `UNKNOWN`) composent ces axes ; ils ne forment pas une enum unique.

## 3. Missingness reasons

| Situation | Représentation | Ne signifie pas |
|---|---|---|
| attendu mais absent | missing expected + raison connue/inconnue | zéro/négatif |
| jamais attendu | absence d’occasion ou non-applicabilité justifiée | échec de collecte |
| refus participant | not collected + reason/actor/time | source indisponible |
| examen non réalisé | réalisation absente | examen non évaluable |
| examen réalisé, donnée inexploitable | realized + not evaluable/invalid selon fait | jamais collecté |
| donnée perdue | production éventuellement établie + unavailable/lost | jamais produite |
| source inaccessible | source unavailable | absence scientifique |
| sous LoD/LoQ | contenu censuré/qualifié + limite/version | missing générique |
| suppression/retrait | withdrawn/rejected + décision/audit | effacement |
| non-utilisée analytiquement | usage status | invalidité source |

## 4. Not applicable, not evaluable, invalid

`NOT_APPLICABLE` porte sur la pertinence de l’attente. `NOT_EVALUABLE` porte sur l’aptitude d’une réalisation ou tentative à soutenir l’évaluation. `INVALID` porte sur la violation d’une règle applicable. Plusieurs axes peuvent coexister seulement si leur sens reste cohérent et justifié ; aucun mapping automatique n’est autorisé.

## 5. Occurrence identity

- correction : successor/version relié par `SUPERSEDES` ; original immuable ;
- réplication/répétition : nouvelle occurrence ;
- resaisie : correction ou doublon selon provenance, jamais overwrite ;
- reprocessing/re-reading/re-segmentation : nouvelle réalisation ou transformation avec parents ;
- unit conversion/harmonization : output transformé avec source ;
- re-analysis : nouvelle AnalysisExecution/Result ;
- adjudication : output/décision relié à toutes les lectures sources.

## 6. Qualité et restrictions

Chaque qualité porte cible, dimension, règle/version, contrôle, résultat, owner, temps, conséquence, source et limitations. Les restrictions d’accès, d’usage, de confidentialité ou de consentement restent distinctes de la validité et de la qualité.

## 7. Frontière Biostatistics

CDM décrit ce qui manque, pourquoi, quand et dans quel contexte. Biostatistics décide, dans AnalysisSpecification, exclusion, imputation, modèle, estimand, sensitivity ou autre traitement. Cette décision ne modifie jamais l’occurrence source.

## 8. Refus et limitations

Sont refusés : `null` seul ; valeur par défaut ; missing = négatif ; invalid = missing ; not evaluable = invalid ; suppression après correction ; aplatissement des axes dans un score. Aucun vocabulaire de stockage ni stratégie statistique n’est imposé.
