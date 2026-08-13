# OBS-001 — Project Handoff Contract

**Version :** 1.0
**Statut :** OFFICIAL — PROJECT_HANDOFF_COMPANION
**Niveau documentaire :** NIVEAU_3 — compagnon subordonné à OBS-001
**Date d'admission :** 12 août 2026
**Source maîtresse :** présent fichier Markdown
**Autorité :** Charte → Scientific Product Manifesto V2 → PD-003 V2 → OBS-001
**Décision associée :** `OBS001_OBSERVABILITY_MEASUREMENT_ARCHITECTURE_ADMITTED_WITH_LIMITATIONS`

---

## 1. Objet

Cette annexe définit le passage normatif entre les plans Scientific Model, Knowledge, Observability & Measurement et Research Project. Elle ne définit ni API, ni stockage, ni moteur, ni interface, ni migration, ni protocole d'acquisition.

Le handoff transforme une intention de mesure scientifiquement qualifiée en information exploitable par le Research Project. Il ne crée aucune donnée observée et ne garantit ni faisabilité, ni performance, ni validité.

## 2. Chaîne de responsabilité

```text
ScientificModel
  → ObservableProperty
  → MeasurementDefinition
  → BiomarkerRole éventuel
  → OBS-001 qualification
  → ResearchProject décision
  → DataNeed éventuel
  → CanonicalVariable éventuelle
  → VariableOccurrence éventuelle
```

La chaîne exprime un ordre de qualification, pas une obligation de créer chaque objet. Une étape absente, non applicable ou refusée reste explicitement visible.

## 3. Contrats amont

### 3.1 Scientific Model → OBS

| Champ | Cardinalité | Exigence | Owner d'origine | Condition d'acceptation OBS |
|---|---:|---|---|---|
| ScientificModelRef | 1..n | obligatoire | Scientific Thinking / owner du modèle | identité et version explicites |
| ObservablePropertyRef | 1..n | obligatoire | Scientific Thinking | propriété distinguée du rôle biomarqueur et de la méthode |
| relation modèle–propriété | 1..n | obligatoire | Scientific Thinking | sens et contexte qualifiés au moyen des relations PD-003 existantes |
| ObjectiveRef ou HypothesisRef | 0..n | conditionnel | Research Project | présent si le besoin naît d'un objectif ou d'une hypothèse déjà formalisé |
| limites du modèle | 0..n | obligatoire si connues | Scientific Thinking | limites conservées, jamais converties en certitudes |

OBS peut refuser le handoff si la propriété observable n'est pas distinguable du phénomène, de la mesure ou du rôle biomarqueur.

### 3.2 Knowledge → OBS

| Champ | Cardinalité | Exigence | Owner d'origine | Condition d'acceptation OBS |
|---|---:|---|---|---|
| KnowledgeItemRef / AssertionRef | 0..n | obligatoire pour toute affirmation externe | Knowledge | identité, version, contexte et provenance explicites |
| SourceRef / EvidenceLinkRef | 0..n | obligatoire si une performance ou une validité est revendiquée | Knowledge | lien contrôlable vers la preuve applicable |
| ApplicabilityContext | 0..n | obligatoire si la portée est bornée | Knowledge | population, usage, domaine ou conditions visibles |
| ContradictionRef | 0..n | obligatoire si connue | Knowledge | contradiction non résolue silencieusement |
| KnowledgeGapRef | 0..n | obligatoire si connu | Knowledge | lacune conservée dans le handoff |
| état de connaissance | 1 | obligatoire | Knowledge | établi, incomplet, contradictoire, inconnu ou non évaluable |

Une absence de preuve n'est jamais transformée en preuve négative. Une source hors contexte ne qualifie pas une mesure dans un nouveau contexte.

## 4. Paquet OBS → Research Project

Chaque paquet de handoff porte un identifiant documentaire local, un owner, une version et une date d'effet. Cet identifiant ne crée pas un nouvel objet métier canonique.

| Champ du paquet | Cardinalité | Statut | Owner de contenu | Règle |
|---|---:|---|---|---|
| sourceOwner | 1..n | obligatoire | owners des objets transmis | chaque sourceOwner reste identifié ; le handoff ne transfère pas l'ownership |
| objectIds | 1..n | obligatoire | owners des objets transmis | identifiants et types PD-003 explicites, sans identifiant composite substitutif |
| versions | 1..n | obligatoire | version owners | chaque objectId possède la version effectivement qualifiée |
| ScientificModelRef | 1..n | obligatoire | Scientific Thinking | référence, jamais copie autonome |
| ObservablePropertyRef | 1..n | obligatoire | Scientific Thinking | propriété que le projet cherche à observer |
| MeasurementDefinitionRef | 1..n | obligatoire sauf refus | owner de domaine de mesure | définition intentionnelle, non valeur observée |
| BiomarkerRoleRef | 0..n | optionnel | Scientific Thinking / humain mandaté | rôle contextualisé ; ne devient jamais objet racine concurrent |
| evidenceRefs / KnowledgeRefs | 0..n | conditionnel | Knowledge | obligatoires pour les affirmations de validité ou de performance ; références, jamais copies de preuve |
| applicability | 1..n | obligatoire | OBS + owner du contexte | domaine, population, usage, temps et conditions auxquels le paquet s'applique |
| conditions de mesure | 0..n | obligatoire si pertinentes | owner de domaine de mesure | équipement, matériau, pré-analytique, opérateur, temporalité ou environnement selon le domaine |
| performanceSummary | 0..n | conditionnel | owner de domaine + Knowledge | dimensions, preuves, contexte et inconnues ; aucune valeur inventée |
| confounders | 0..n | obligatoire si connus | domaine + Knowledge | distingués des erreurs et des exclusions |
| qualityRequirements | 0..n | obligatoire si connues | domaine de mesure | contrôles, seuils ou critères seulement s'ils sont sourcés et contextualisés |
| alternatives | 0..n | optionnel | domaine + Project | méthodes alternatives avec différences et limites visibles |
| rejectedOptions | 0..n | obligatoire si une option a été écartée | décisionnaire d'origine | option, raison, acteur, mandat, date et condition de réexamen |
| provenance | 1..n | obligatoire | chaque owner source | origine de chaque affirmation ou décision |
| unknowns | 0..n | obligatoire si présentes | owner qui les constate | jamais supprimées pour rendre le paquet complet |
| contradictions | 0..n | obligatoire si présentes | Knowledge / domaine | état et impact explicités |
| limitations | 0..n | obligatoire si connues | tous owners concernés | inclut non-transférabilité et non-comparabilité |
| decisionNeeded | 1..n | obligatoire | OBS steward + Project | décisions humaines encore ouvertes, sans option pré-adoptée |
| mappingStatus | 1 | obligatoire | OBS steward | mapping courant, legacy, incomplet, ambigu ou refusé, avec pertes explicites |
| état de handoff | 1 | obligatoire | OBS steward | valeur contrôlée de la section 5 |
| décision Project | 0..1 | produite en aval | décisionnaire humain du Project | acceptation, demande de complément, substitution ou refus |

## 5. États du handoff

| État | Sens | Effet autorisé |
|---|---|---|
| `COMPLETE` | champs requis présents, contradictions et limites explicites | le Project peut décider ; aucune création automatique de variable |
| `INCOMPLETE` | qualification utilisable mais un ou plusieurs éléments requis manquent | le Project peut demander un complément, borner l'usage ou refuser |
| `NOT_EVALUABLE` | les informations disponibles ne permettent pas d'évaluer la mesure ou sa portée | aucune revendication de validité, performance ou comparabilité |
| `BLOCKED` | contradiction, ownership, provenance, sécurité ou condition critique empêche le handoff | arrêt jusqu'à décision humaine ou nouvelle preuve |
| `REFUSED` | le Project ou l'owner mandaté refuse cette mesure pour le contexte | conserver motif, auteur, mandat, date et alternatives éventuelles |

`COMPLETE` signifie complet pour la décision décrite, non vrai, valide, faisable, implémenté ou évalué sous PD-011.

## 6. Décisions du Research Project

Le décisionnaire humain du Research Project peut :

1. accepter le paquet dans son contexte et créer ensuite un DataNeed si nécessaire ;
2. accepter sous conditions explicites ;
3. demander une clarification ou une nouvelle preuve ;
4. choisir une alternative ;
5. déclarer la mesure non applicable ;
6. refuser la mesure ;
7. suspendre la décision.

Toute décision doit porter l'acteur, le Mandat, le contexte, la date, le motif, les éléments considérés, les inconnues et les impacts. OBS ne prend pas la décision scientifique finale à la place du Project.

## 7. Créations aval autorisées

Après décision humaine, le Research Project peut créer ou relier :

- un DataNeed décrivant ce dont le projet a besoin ;
- une CanonicalVariable si une identité variable réutilisable est justifiée ;
- des VariableOccurrences uniquement lorsque le contexte d'apparition est défini ;
- une Observation uniquement lorsqu'une valeur ou un fait observé existe effectivement ;
- une AnalysisSpecification ou une AnalysisExecution dans leur temporalité propre.

Le handoff OBS ne crée jamais automatiquement ces objets. MeasurementDefinition, DataNeed, CanonicalVariable, VariableOccurrence et Observation restent distincts.

## 8. Cas de refus obligatoires

Le handoff doit être refusé ou bloqué lorsque :

- le ScientificModel ou l'ObservableProperty n'est pas identifiable ;
- une méthode est présentée comme une observation déjà réalisée ;
- un rôle biomarqueur est affirmé sans contexte ;
- une valeur de performance est dépourvue de source ou de conditions applicables ;
- deux méthodes sont déclarées comparables sans preuve de comparabilité ;
- une contradiction critique est masquée ;
- l'owner ou le décisionnaire n'est pas identifiable ;
- une inconnue critique est remplacée par une valeur par défaut ;
- la demande exige un protocole d'acquisition, une recommandation clinique ou une décision automatique hors périmètre.

## 9. Corrections et retour amont

Le Project ne corrige pas une définition de mesure dont il n'est pas owner. Il émet une demande de correction traçable vers l'owner compétent. La correction crée une nouvelle version ou révision selon PD-003 ; elle ne réécrit pas silencieusement le paquet consommé.

Une modification de MeasurementDefinition, de conditions, de performance, de preuve, de modèle ou de propriété observable déclenche une analyse d'impact sur les Projects consommateurs. L'impact peut imposer relecture, requalification ou nouvelle décision humaine.

## 10. Relation avec CDM-001

Le paquet OBS exprime le besoin et la sémantique de mesure avant toute architecture canonique de données. CDM-001 pourra définir ultérieurement les contrats de représentation, d'occurrence, d'unité, de valeur manquante et de provenance de données, sans modifier rétrospectivement OBS.

En l'absence de CDM-001 admis :

- aucun schéma de stockage n'est présumé ;
- aucune variable n'est réputée persistée ;
- aucune occurrence n'est réputée collectée ;
- les contraintes de représentation restent ouvertes et explicites.

## 11. Relation avec Data Management et Biostatistics

Data Management est consommateur des DataNeeds et variables décidés par le Project ; il ne définit pas la validité scientifique de la mesure. Biostatistics qualifie les usages analytiques, modèles, estimands et résultats ; elle ne redéfinit pas l'ObservableProperty ou la MeasurementDefinition.

Leurs futurs contrats doivent recevoir les limites, versions, conditions, provenance et décisions du handoff sans les aplatir.

## 12. Provider et SEM

Ce contrat est exclusivement documentaire et normatif. Aucun appel Gemini, campagne SEM, benchmark provider ou quota externe n'est requis pour le créer, l'admettre ou l'appliquer. Le quota Gemini et l'état de SEM-001R3 ne constituent ni un prérequis, ni une preuve, ni un blocage pour OBS-001.

## 13. Limites

Cette annexe ne prouve :

- aucune implémentation du handoff ;
- aucune conformité des moteurs existants ;
- aucune validité scientifique d'une mesure particulière ;
- aucune performance réelle ;
- aucune migration legacy ;
- aucun PASS PD-011.

Elle définit exclusivement le contrat normatif de transfert de responsabilité.
