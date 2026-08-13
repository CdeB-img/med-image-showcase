# OBS-001 — Measurement Domain Specialization

## Contrat transversal et extensions spécialisées de mesure

| Champ | Valeur |
|---|---|
| Document | Annexe normative d’OBS-001 |
| Version | 1.0 |
| Statut | `OFFICIAL — DOMAIN_SPECIALIZATION_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorité | OBS-001 ; PD-003 V2 pour les objets |

## 1. Objet

Cette annexe définit comment les domaines spécialisés étendent `MeasurementDefinition` sans créer une ontologie concurrente. Elle n’établit aucune taxonomie exhaustive et n’admet aucune méthode réelle.

## 2. Contrat transversal obligatoire

Toute spécialisation doit pouvoir fournir ou qualifier :

| Élément commun | Exigence |
|---|---|
| identity/version | identité stable, version immuable, supersession |
| ObservableProperty target | identité/version unique par relation de mesure |
| principle/method class | principe constitutif et classe ouverte |
| inputs | types d’inputs nécessaires, jamais instances réelles |
| output semantics | forme, unité/value domain possible et sens |
| applicability | population, temps, contexte, domaine et exclusions |
| conditions/dependencies | conditions constitutives, influences et dépendances |
| performance | dimensions pertinentes avec KnowledgeRefs, jamais valeurs inventées |
| confounders/limitations | qualifications contextualisées |
| quality requirements | cible, contrôle et conséquence d’échec attendue |
| comparison/harmonization | qualifications multi-axes si nécessaires |
| KnowledgeRefs/provenance | sources versionnées et rôle de chaque référence |
| unknowns/contradictions | axes PD-003 conservés |
| owner/contributors | owner spécialisé et gouvernance OBS |
| Project handoff | décisions ouvertes, options et mapping status |

Une spécialisation qui omet un élément pertinent est `INCOMPLETE`; elle ne peut pas le remplacer par une valeur générique.

## 3. Test d’autonomie

Un élément spécialisé est :

- `SPECIALIZATION` s’il conserve l’identité/lignée de `MeasurementDefinition` avec des contraintes de domaine ;
- `SUBRESOURCE` si son cycle dépend de la méthode propriétaire ;
- `VALUE_OBJECT` si son sens est entièrement défini par son contenu ;
- `RELATION` si son sens dépend d’extrémités versionnées ;
- un objet PD-003 existant si Acquisition, Condition, Constraint, QC, Reading Procedure ou Analysis le couvrent ;
- `NOT_REQUIRED` si une qualification conserve le sens.

La création d’un nouvel objet racine reste interdite sans évolution PD-003.

## 4. Imaging

### 4.1 Owner et objets existants

Imaging possède les spécialisations technologiques, acquisitions, séquences/techniques, paramètres, conditions, protocoles méthodologiques candidats, QA et lectures. OBS possède le contrat transversal ; Project possède les choix.

| Objet Imaging | Place dans OBS | Général / Project-specific | Garde |
|---|---|---|---|
| Modality | classe technologique référencée par une MD spécialisée | général | ne mesure pas un BiomarkerRole par elle-même |
| Acquisition | objet existant réalisant/planifiant une méthode | souvent Project-specific | attente ≠ exécution ≠ valeur |
| Sequence/Technique | spécialisation de MD | définition générale + variante Project | nom commercial/technique ≠ identité universelle |
| Critical Parameter | sous-ressource/condition | général si constitutif ; Project pour valeur prévue | aucune valeur inventée |
| Measurement Condition | objet/qualification | les deux selon portée | général et local distingués |
| Imaging Protocol | composition Project/domaine | Project-specific | jamais exécutable par admission |
| Reading Procedure | spécialisation MD | général/versionné ; Project choisit | résultat/interprétation distincts |
| Quality Control | exigence/règle spécialisée | général + plan Project | qualité réelle hors OBS |

### 4.2 Attributs spécialisés possibles

Signal/image attendu ; modalité ; acquisition/sequence class ; reconstruction ; spatial/temporal resolution semantics ; device/equipment dependencies ; reader/algorithm mediation ; preprocessing ; calibration/reference ; motion/artifact influences ; display/reading conditions ; transfer/harmonization ; QA stages.

Ils ne sont obligatoires que lorsqu’ils déterminent la définition ou l’applicabilité.

## 5. Laboratory

### 5.1 Owner et frontières

Laboratory possède analyte/matrice, pré-analytique, principe analytique, réactif/kit/lot, instrument, calibration, contrôles et procédure. OBS possède la sémantique commune. Biospecimen reste un objet matériel distinct ; Project décide collecte/temps/source ; CDM/Data conservera la réalisation.

### 5.2 Attributs spécialisés possibles

| Dimension | Contenu conceptuel |
|---|---|
| specimen/material requirement | type requis et conditions ; aucune instance |
| pre-analytical | collecte, traitement, stockage, délai et influences |
| analytical principle | principe, instrument/platform, reagent/kit et versions |
| calibration | référence, chaîne et période/version |
| output | analyte/property, unité/value domain et statut possible |
| performance | accuracy, precision, bias, linearity, range, LoD/LoQ, inter-lot/site/instrument selon pertinence |
| quality | contrôles attendus, conséquences et owner |
| comparability | méthodes/lots/plateformes avec domaine et transformations |

Un changement de lot n’est pas automatiquement une nouvelle MD ; il devient version/condition de réalisation sauf rupture démontrée du principe ou du sens.

## 6. Clinical Assessment

Clinical Assessment possède les procédures d’examen, qualifications du rater, instruments et conventions de jugement. Les décisions cliniques individuelles sont hors périmètre.

Attributs possibles : construit/propriété ; tâche ; instructions ; contexte ; rater qualifications ; aveugle ; échelle/catégories ; procédure de consensus/adjudication ; repeatability/agreement ; facteurs d’apprentissage/fatigue/connaissance contextuelle ; langue/culture si applicables ; qualité et limites.

Une catégorie observée n’est ni un diagnostic clinique automatique ni un BiomarkerRole universel.

## 7. Questionnaire

Questionnaire est une spécialisation de Clinical Assessment lorsque l’instrument et ses règles d’administration/scoring sont constitutifs.

| Élément | Règle |
|---|---|
| instrument/version | identité exacte ; versions non fusionnées sans preuve |
| language/cultural version | mapping/version et validité propres |
| administration mode | condition ou version si déterminante |
| respondent/proxy | rôle explicite |
| scoring | composant MD s’il produit la propriété/score défini |
| missing items | règle de méthode ; missingness réel appartient à l’occurrence/analysis |
| psychometric performance | KnowledgeRefs et domaine ; aucun score global OBS |

Le Project décide l’instrument, la langue, le mode et le temps. DOC ne peut jamais modifier les items ou le scoring pour la présentation.

## 8. Device / Wearable

Device domain possède le capteur, matériel, firmware/software, configuration et méthode d’obtention. Project/Operations possèdent disponibilité et déploiement. OBS ne crée aucun catalogue d’appareils.

Attributs possibles : sensor class ; placement ; sampling/aggregation semantics ; calibration ; hardware generation ; firmware/software/algorithm ; raw versus processed output ; synchronisation ; signal loss ; drift ; environmental dependencies ; adherence/wear-time requirements ; battery/availability as operational constraints ; test-retest/inter-device/inter-vendor performance.

Un update logiciel conserve l’identité seulement si le principe, la propriété et la sémantique de sortie restent compatibles. Sinon une nouvelle MD ou identité est requise.

## 9. Physiological Monitoring

Physiological Monitoring spécialise souvent Device/Wearable, mais peut également dépendre d’un système de monitorage non porté.

Le contrat distingue : propriété instantanée, série temporelle et résumé dérivé ; temps de mesure, cadence et fenêtres ; signal brut et output sémantique ; interruptions ; conditions physiologiques ; synchronisation multi-source ; qualité du signal ; version appareil/algorithme ; et analyse longitudinale future.

OBS définit la mesure ; CDM représentera les occurrences ou séries ; Biostatistics définira les résumés inferentiels. Une fenêtre d’analyse n’est pas automatiquement une propriété observable.

## 10. Derived Measurement

Une `DERIVED_MEASUREMENT` est recevable si :

1. elle cible une ObservableProperty stable ;
2. ses inputs et règles sont préspécifiés ;
3. sa sortie possède une sémantique réutilisable de mesure ;
4. sa performance peut être évaluée comme méthode ;
5. elle ne choisit ni population d’analyse, ni estimand, ni comparaison de projet.

Sinon la construction relève d’`AnalysisSpecification`. Les deux coexistent lorsque l’analyse consomme des mesures dérivées.

## 11. Matrice de responsabilités par domaine

| Domaine | Propriété transverse | Spécialisation MD | Conditions de domaine | Qualité attendue | Choix Project | Occurrence réelle | Inférence |
|---|---|---|---|---|---|---|---|
| OBS | owner | co-owner du contrat | gouverne la forme | measurement quality | contribution | aucun | aucune |
| Imaging | contributeur | owner Imaging | owner | acquisition/reading QA | contribution | système/source/Data | image measurement only, pas statistique |
| Laboratory | contributeur | owner Lab | owner | analytical/pre-analytical QA | contribution | Lab/CDM/Data | domaine ou Biostatistics selon analyse |
| Clinical | contributeur | owner Clinical | owner | rater/instrument QA | contribution | source/CDM/Data | domaine/Biostatistics |
| Questionnaire | contributeur | owner instrument | owner | completeness/scoring expected | contribution | source/CDM/Data | Biostatistics/domaine |
| Device | contributeur | owner Device | owner | signal/device QA | contribution | device/CDM/Data | Biostatistics/domaine |
| Project | consumer | consumer | contexte local | accepte les exigences | owner + humain | référence seulement | adopte la spécification |

## 12. Handoff de spécialisation vers OBS

Le domaine transmet : owner/version ; type de spécialisation ; propriété/méthode ; éléments transversaux ; extensions ; KnowledgeRefs ; applicabilité ; conditions ; performance ; qualité ; limites ; unknowns ; contradictions ; provenance ; et décisions à demander.

OBS vérifie le contrat transversal sans modifier le savoir du domaine. Un défaut retourne une Contribution. Une contradiction entre domaines reste ouverte jusqu’à revue ; OBS ne choisit pas le domaine « le plus proche ».

## 13. Non-régression

- Une étude sans Imaging reste complète au niveau OBS.
- Un questionnaire n’est pas transformé en capteur ou en analyse.
- Un Biospecimen n’est pas une mesure Laboratory.
- Un reader humain ne devient pas une occurrence.
- Un algorithme dérivé n’est pas automatiquement une AnalysisSpecification, ni l’inverse.
- Aucune spécialisation ne crée une relation ou un objet canonique caché.
- Les performances restent contextualisées et sourcées.

## 14. Limitations

Cette annexe ne contient aucun catalogue de méthodes, appareils, instruments, kits, logiciels ou procédures. Les attributs sont des dimensions conceptuelles, non une prescription exhaustive.
