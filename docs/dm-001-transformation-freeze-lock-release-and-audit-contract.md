# DM-001 — Transformation, Freeze, Lock, Release and Audit Contract

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — LIFECYCLE_AUDIT_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorité | `docs/dm-001-study-data-management-architecture.md` |

## 1. TransformationDefinition

Une définition de transformation déclare identité, version, catégorie, owner, entrées, sorties, règles, conditions, paramètres, unités, mappings, erreurs attendues, limites et lien CDM. Elle est classée selon son sens : règle opérationnelle DM, MeasurementDefinition/domaine, TerminologyMapping ou AnalysisSpecification. DM-001 ne crée pas une racine universelle `Transformation`.

## 2. TransformationExecution

Chaque exécution enregistre définition/version, occurrences ou artefacts parents, sorties, environnement, acteur/runtime, temps, statut, logs, erreurs, provenance, lineage et digest lorsque pertinent. Une sortie ne peut être acceptable sans parents reconstructibles.

| Catégorie | Owner du sens | Autorisation DM | Boundary |
|---|---|---|---|
| normalisation/harmonisation | CDM/DM sous contrat | exécuter et tracer | aucune perte de source |
| conversion d’unité | OBS/domaine + règle versionnée | exécuter si équivalence établie | unité source conservée |
| recodage/mapping terminologique | owner identité/terminologie | appliquer mapping versionné | code externe ≠ identité NOXIA |
| agrégation/dérivation opérationnelle | Project/domaine/DM selon définition | exécuter avec parents | aucune création d’endpoint |
| pseudonymisation/anonymisation | gouvernance spécialisée à établir | tracer l’opération si mandatée | aucune conformité ou anonymisation présumée |
| calcul analytique | Biostatistics/domaine analytique | seulement handoff/trace | relève d’AnalysisExecution |
| correction | acteur mandaté/source | record avant/après séparé | ne pas la masquer comme transformation |

## 3. DataSnapshot

Un snapshot référence un périmètre, une version, les occurrences et définitions, les règles de sélection, l’état qualité, les queries/findings ouverts, les transformations, les limitations, la date logique, un digest et un parent éventuel. Il est immuable comme preuve ; une évolution produit un successeur.

## 4. Freeze

Un freeze est une restriction opérationnelle préparatoire ou partielle. Son contrat précise périmètre, type, acteur, mandat, préconditions, date, statut, exclusions, findings ouverts, opérations encore autorisées et condition de sortie.

Soft freeze, partial freeze, variable-level freeze et subject/site-level freeze sont des options conceptuelles lorsque justifiées. Aucun type n’est obligatoire pour toutes les études.

## 5. Lock et unlock

Un lock est une décision, un contrat, un état et un audit empêchant les modifications ordinaires. Son caractère techniquement irréversible n’est jamais présumé.

Un unlock exige acteur, mandat, raison, périmètre, finding ou preuve, analyse d’impact, décision, date, statut antérieur, nouvelle branche/version et plan de relock/release si applicable. Une query seule ne déverrouille rien.

## 6. DatasetRelease

Un release contient identité/version, snapshot source, usage autorisé, population/périmètre, variables, occurrences référencées, règles et transformations, état qualité, missingness factuel, exclusions documentées, limitations, provenance, destinataires, décision et statut.

Un release n’est ni une base canonique ni une AnalysisSpecification. Il n’autorise pas un usage non déclaré. Une correction ultérieure crée une nouvelle branche de lineage, un nouveau snapshot et éventuellement une nouvelle release ; l’ancienne reste reconstructible.

## 7. Corrections post-freeze ou post-lock

1. enregistrer le finding et la source nouvelle ;
2. déterminer le périmètre impacté ;
3. obtenir décision et mandat d’unlock si lock actif ;
4. conserver l’occurrence et le snapshot antérieurs ;
5. créer la correction et réexécuter les transformations dépendantes ;
6. produire un nouveau snapshot ;
7. décider relock et nouvelle release ;
8. notifier les consommateurs selon le contrat applicable.

Aucune étape ne modifie rétroactivement une preuve historique.

## 8. Provenance, lineage et AuditEvent

| Plan | Question | Références minimales |
|---|---|---|
| Provenance | d’où vient cette information ? | source document/système/valeur, acteur/runtime, temps, version |
| Lineage | comment cette sortie a-t-elle été produite ? | parents, définition/version, exécution, paramètres, statut, erreurs |
| Audit trail | quels événements ont affecté son état ? | événement, objet, acteur, mandat, avant/après, date, raison, preuves |

Un AuditEvent est attendu immuable et ordonné dans son contexte, mais DM-001 ne prétend pas qu’un mécanisme technique particulier garantit cette immutabilité.

## 9. Handoff Biostatistics

La release remet des occurrences et métadonnées factuelles. Biostatistics référence le release, choisit AnalysisSpecification, population, modèles, stratégie du missingness et sensibilités. Une AnalysisExecution ou dérivation analytique retourne avec identité, version, entrées, sorties, provenance et lignage, sans écraser les occurrences sources.

## 10. Refus

Freeze, lock ou release sont refusés si le périmètre ou la version ne sont pas identifiables, si la provenance/lineage critique n’est pas reconstructible, si les findings bloquants applicables sont masqués, si l’autorité de décision manque ou si un usage non autorisé est demandé. Le refus est audité ; il ne déclenche aucune correction automatique.
