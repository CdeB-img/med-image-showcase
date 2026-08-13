# OBS-001 — Legacy Compatibility

**Version :** 1.0
**Statut :** OFFICIAL — COMPANION_NORMATIVE
**Niveau documentaire :** NIVEAU_3 — compagnon subordonné à OBS-001
**Date d'admission :** 12 août 2026
**Source maîtresse :** présent fichier Markdown
**Autorité :** PD-003 V2 Legacy Compatibility → OBS-001
**Décision associée :** `OBS001_OBSERVABILITY_MEASUREMENT_ARCHITECTURE_ADMITTED_WITH_LIMITATIONS`

---

## 1. Objet

Cette annexe spécialise la lecture des artefacts V1 qui combinaient phénomène, biomarqueur, modalité, méthode, variable ou observation. Elle ne migre aucune donnée, ne modifie aucun artefact historique et ne crée aucun objet canonique.

## 2. Principe

Un artefact legacy reste lisible dans son contexte historique. Il ne devient pas automatiquement conforme à OBS-001 et ne peut pas être utilisé pour une nouvelle création V2 avant qualification explicite.

La compatibilité de lecture n'est ni une équivalence sémantique, ni une autorisation d'écriture, ni une preuve de migration.

## 3. États contrôlés

| État | Définition | Autorisation |
|---|---|---|
| `LEGACY_READABLE` | sens historique suffisamment documenté pour être interprété | lecture et citation historique |
| `V1_COMPOSITE_LEGACY` | l'artefact agrège au moins deux concepts désormais distincts | lecture ; aucune création V2 directe |
| `MAPPING_REQUIRED` | un mapping explicite vers OBS/PD-003 V2 est nécessaire | analyse humaine avant réutilisation |
| `AMBIGUOUS_LEGACY` | plusieurs interprétations restent plausibles | aucune projection courante sans arbitrage |
| `MAPPED_WITH_LIMITATIONS` | mapping documenté mais pertes ou inconnues subsistent | usage borné avec limites visibles |
| `SUPERSEDED_FOR_NEW_CREATION` | le type V1 n'est plus autorisé pour de nouveaux objets | lecture historique uniquement |
| `REFUSED_MAPPING` | le sens ou la provenance ne permettent pas un mapping fiable | conservation sans promotion |

## 4. Inventaire de lecture V1 obligatoire

| Construction V1 | Lecture obligatoire | Interdiction |
|---|---|---|
| Biomarqueur V1 | qualifier séparément propriété, méthode et rôle éventuels ; retenir `V1_COMPOSITE_LEGACY` si le sens agrège plusieurs plans | aucune décomposition automatique en ObservableProperty, MeasurementDefinition et BiomarkerRole |
| Modalité V1 | distinguer domaine technologique, classe de méthode et choix Project | ne pas traiter la disponibilité d'une modalité comme validité ou adoption |
| Séquence V1 | déterminer si elle spécialise la MeasurementDefinition, décrit une Acquisition ou constitue un artefact Project-specific | ne pas promouvoir une séquence locale en méthode universelle |
| Condition de mesure V1 | distinguer prérequis, recommandation, influence connue, critère qualité, contre-indication et effet inconnu | ne pas aplatir toutes les conditions en attribut obligatoire |
| Procédure de lecture V1 | déterminer si elle fait partie de MeasurementDefinition, d'une spécialisation de domaine ou d'une exécution réelle | ne pas convertir un reader ou un résultat de lecture en définition générale |
| Variable V1 | distinguer MeasurementDefinition, DataNeed, CanonicalVariable, VariableOccurrence et Observation | ne pas inférer automatiquement plusieurs objets V2 depuis une seule variable composite |

## 5. Crosswalk OBS des constructions composites fréquentes

| Construction V1 | Qualification legacy | Lecture V2 attendue | Décision obligatoire |
|---|---|---|---|
| `Phénomène biologique → Biomarqueur → Modalité` | `V1_COMPOSITE_LEGACY` | ScientificModel ou objet de connaissance → ObservableProperty → MeasurementDefinition ; BiomarkerRole seulement si un rôle contextualisé est démontré | séparer chaque plan ; ne pas conserver le Biomarqueur comme pivot universel |
| `Biomarqueur` utilisé comme propriété mesurable | `MAPPING_REQUIRED` | ObservableProperty | vérifier qu'il ne désigne ni méthode, ni variable, ni rôle clinique |
| `Biomarqueur` utilisé comme rôle | `SUPERSEDED_FOR_NEW_CREATION` | BiomarkerRole appliqué à un objet admissible dans un contexte | qualifier rôle, usage, population, décision et preuve |
| `Modalité` utilisée comme méthode de mesure | `MAPPING_REQUIRED` | MeasurementDefinition avec spécialisation de domaine éventuelle | conserver les conditions et distinguer famille technologique, méthode et équipement |
| `Variable` utilisée comme définition de mesure | `V1_COMPOSITE_LEGACY` | MeasurementDefinition + DataNeed éventuel + CanonicalVariable éventuelle | ne pas inférer automatiquement les trois objets |
| `Observation` utilisée comme méthode ou variable | `AMBIGUOUS_LEGACY` | MeasurementDefinition, VariableOccurrence ou Observation selon la temporalité réelle | exiger valeur/fait observé, contexte et provenance avant de retenir Observation |

## 6. Tests de désambiguïsation

Pour chaque artefact V1, l'examen doit répondre séparément :

1. Quel phénomène ou modèle scientifique est concerné ?
2. Quelle propriété est susceptible d'être observée ?
3. Quelle méthode définit comment cette propriété serait mesurée ?
4. Un rôle biomarqueur est-il réellement affirmé, pour quel usage et quel contexte ?
5. Le Project exprime-t-il un besoin de donnée ?
6. Existe-t-il une identité variable canonique ?
7. Existe-t-il une occurrence contextualisée ?
8. Une valeur ou un fait a-t-il effectivement été observé ?
9. Quelle est la provenance de chaque réponse ?
10. Quelles inconnues, contradictions ou pertes subsistent ?

Une même réponse ne doit pas être copiée dans plusieurs plans pour fabriquer artificiellement la complétude.

## 7. Règles d'identité et de version

- L'identifiant V1 reste attaché à l'artefact historique.
- Un objet V2 ne réutilise pas l'identifiant V1 lorsque son identité scientifique change.
- Un mapping conserve l'identifiant source, la version source, la décision, l'acteur, le Mandat et la date.
- Une correction ne réécrit pas le contenu historique consommé.
- Plusieurs objets V2 peuvent référencer un même artefact composite V1, mais leur création exige des décisions distinctes.
- Un objet V2 peut refuser toute filiation identitaire lorsque le mapping est trop ambigu.

## 8. Lecture et écriture

| Opération | V1 | V2 |
|---|---|---|
| Lire un artefact historique | autorisé avec statut legacy | autorisé |
| Créer un nouveau `Biomarqueur` racine | interdit | BiomarkerRole contextualisé seulement |
| Créer une nouvelle chaîne composite | interdit | utiliser les objets et responsabilités distincts |
| Modifier silencieusement un artefact V1 | interdit | sans objet |
| Projeter V1 comme V2 sans mapping | interdit | sans objet |
| Conserver un artefact non mappable | obligatoire | le marquer explicitement sans promotion |

## 9. Qualité, performance et comparabilité legacy

Les performances, seuils, unités, conditions et règles de qualité trouvés dans un artefact V1 restent attachés à leur contexte source. Ils ne sont jamais transférés automatiquement à une MeasurementDefinition V2.

Les termes « équivalent », « comparable », « harmonisé », « validé » ou « reproductible » exigent une preuve et un contexte. Une égalité de libellé, d'unité ou de modalité ne suffit pas.

## 10. Contradictions et inconnues

Une contradiction entre le sens historique et le modèle courant demeure visible. Le mapping porte les interprétations concurrentes, la décision retenue, son owner et les alternatives refusées.

Si les informations nécessaires manquent, le statut reste `AMBIGUOUS_LEGACY` ou `REFUSED_MAPPING`. Aucune valeur par défaut, convention implicite ou décision de modèle LLM ne peut combler l'absence.

## 11. Relation avec les moteurs

Un moteur qui lit V1 doit déclarer :

- le type et la version reconnus ;
- le mapping appliqué ;
- les pertes et refus ;
- la différence entre lecture historique et écriture courante ;
- la non-promotion automatique vers V2.

L'admission d'OBS-001 ne prouve qu'aucun moteur satisfait ces exigences. Les adaptations relèvent de missions distinctes.

## 12. Provider et SEM

La désambiguïsation normative ne dépend d'aucun provider LLM live. Aucun appel Gemini, campagne SEM, benchmark provider ou quota externe n'est requis. L'état de SEM-001R3 est hors périmètre et ne modifie aucun statut legacy OBS.

## 13. Limites

Cette politique ne fournit ni script de migration, ni schéma de données, ni adapter, ni inventaire exhaustif des artefacts V1. Elle fixe les conditions de compatibilité et de refus avant toute future migration autorisée.
