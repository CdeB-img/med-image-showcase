# OBS-001 — Measurement Semantics Catalog

## Catalogue gouverné des axes de mesure, performance, condition, comparabilité et validité biomarqueur

| Champ | Valeur |
|---|---|
| Document | Annexe normative spécialisée d’OBS-001 |
| Version | 1.0 |
| Statut | `OFFICIAL — CONTROLLED_SEMANTICS_COMPANION` |
| Niveau | `NIVEAU_3 — compagnon subordonné` |
| Autorité | `docs/obs-001-observability-measurement-architecture.md` |
| Portée | vocabulaires ouverts, axes orthogonaux et tests de pertinence ; aucune donnée scientifique |

## 1. Responsabilité distincte

Ce catalogue possède une responsabilité claire : maintenir les **axes de qualification** employés par OBS sans transformer l’architecture principale en inventaire de termes. Il ne crée ni objet, ni rôle, ni relation canonique. Il ne contient aucune valeur de performance, aucun seuil, aucune recommandation et aucune preuve autonome.

Une entrée est un descripteur contrôlé. Son usage exige toujours objet, contexte, owner, version, KnowledgeRefs, provenance et statut. Un terme absent peut être proposé comme extension ; il ne peut pas être utilisé comme synonyme implicite d’un terme existant.

## 2. Règles transversales

1. Les axes restent orthogonaux ; aucune enum plate ne doit mélanger accès, sortie, qualité, applicabilité et preuve.
2. `UNKNOWN` signifie information non établie ; `NOT_APPLICABLE` exige une justification de non-pertinence.
3. Une dimension de performance n’est renseignée que si sa définition et sa tâche sont applicables.
4. Un résumé ne remplace jamais la qualification source.
5. Toute conclusion comparative est bornée aux versions, populations, temps, conditions et usages évalués.
6. La force de preuve reste possédée par Knowledge.
7. Les extensions de domaine ne peuvent pas modifier le sens transversal.

## 3. Axes de nature d’une ObservableProperty

### 3.1 Mode d’accès

| Terme | Sens | Test d’usage | Ne signifie pas |
|---|---|---|---|
| `DIRECT_ACCESS` | le résultat provient d’une interaction constitutive relativement directe avec la propriété selon le principe déclaré | aucune variable intermédiaire ne porte le sens principal | exact, sans erreur ou sans processing |
| `INDIRECT_ESTIMATION` | la propriété est estimée depuis un signal ou une propriété intermédiaire | chaîne d’estimation et hypothèses identifiées | biomarker valide |
| `MODEL_DERIVED_ACCESS` | un modèle/reconstruction déterminant produit l’estimation | modèle, version, inputs et domaine indispensables | ScientificModel explicatif |
| `ACCESS_UNKNOWN` | le mode d’accès ne peut être qualifié | information ou preuve insuffisante | absence d’observabilité |

### 3.2 Forme de sortie

| Terme | Sens | Exigence minimale |
|---|---|---|
| `QUANTITATIVE` | résultat numérique avec unité ou échelle définie | sémantique de valeur et domaine |
| `ORDINAL` | catégories ordonnées sans distance métrique présumée | ordre et règles de classement |
| `NOMINAL_CLASSIFIED` | catégories sans ordre intrinsèque | classes et procédure |
| `BINARY` | deux catégories définies | règle/version ; aucune naturalisation du seuil |
| `STRUCTURED` | résultat composé non réductible à une seule valeur | structure et rôles des composants |
| `OUTPUT_FORM_UNKNOWN` | forme non établie | gap explicite |

### 3.3 Composition et résolution

`ATOMIC`, `COMPOSITE` et `COMPOSITION_UNKNOWN` qualifient la composition. La résolution est décrite séparément : globale, locale/spatiale, temporelle, longitudinale, événementielle ou autre qualification de domaine. `COMPOSITE` peut donc être quantitatif, classifié ou structuré.

### 3.4 Médiation

| Terme | Sens |
|---|---|
| `INSTRUMENT_MEDIATED` | instrument constitutif |
| `READER_MEDIATED` | jugement ou action humaine constitutive |
| `ALGORITHM_MEDIATED` | algorithme constitutif |
| `CONSENSUS_MEDIATED` | consensus/adjudication constitutifs |
| `MIXED_MEDIATION` | plusieurs médiations déterminantes |
| `MEDIATION_UNKNOWN` | médiation non suffisamment documentée |

## 4. Classes ouvertes de MeasurementDefinition

| Classe | Critère | Owner spécialisé typique |
|---|---|---|
| `IMAGING_MEASUREMENT` | signal/image et chaîne Imaging constitutive | Imaging |
| `LABORATORY_MEASUREMENT` | analyte/matrice et procédure Laboratory constitutifs | Laboratory |
| `CLINICAL_ASSESSMENT` | examen/jugement clinique structuré | Clinical Assessment |
| `QUESTIONNAIRE_MEASUREMENT` | instrument de questionnaire et scoring | Questionnaire/Clinical Assessment |
| `DEVICE_MEASUREMENT` | capteur/dispositif et software déterminant | Device domain |
| `PHYSIOLOGICAL_MONITORING` | mesure physiologique continue ou répétée | domaine physiologique/Device |
| `DERIVED_MEASUREMENT` | dérivation préspécifiée visant une ObservableProperty | domaine de mesure + OBS |
| `METHOD_CLASS_OTHER` | classe spécialisée gouvernée non listée | owner nommé |
| `METHOD_CLASS_UNKNOWN` | classe non résolue | diagnostic, pas catégorie fourre-tout |

La classification n’est pas exhaustive et ne crée pas de types racines.

## 5. Dimensions de performance

### 5.1 Contrat commun

Chaque qualification de performance contient : `dimension`; définition/terminologie référencée ; tâche ; propriété ; méthode/version ; population/contexte ; conditions ; unité/forme ; résultat Knowledge référencé ; incertitude ; applicabilité ; contradictions ; date ; owner ; provenance ; supersession.

### 5.2 Mesure quantitative et métrologie

| Dimension | Question | Condition de pertinence | Confusion interdite |
|---|---|---|---|
| accuracy | proximité à une référence qualifiée | référence et méthode de comparaison définies | precision |
| precision | dispersion sous conditions définies | répétitions et conditions explicites | exactitude |
| bias | écart systématique relatif à une référence | référence et direction définies | erreur individuelle |
| linearity | relation sur un domaine défini | domaine et modèle attendus | corrélation générale |
| range | domaine où la méthode satisfait des critères déclarés | bornes et critères référencés | domaine de validité complet |
| limit of detection | capacité de détection selon définition du domaine | mesurande et décision de détection pertinents | seuil clinique |
| limit of quantification | quantification selon performance définie | mesure quantitative et critères pertinents | LoD |

### 5.3 Stabilité et reproductibilité

| Dimension | Variation contrôlée | Exigence |
|---|---|---|
| repeatability | mêmes conditions définies | fenêtre, opérateur/dispositif et procédure explicités |
| reproducibility | conditions changées et nommées | facteurs de variation explicités |
| test-retest | répétition temporelle | stabilité attendue du phénomène et intervalle qualifiés |
| robustness | perturbations spécifiées | perturbations et critères d’acceptation |
| inter-reader | readers différents | procédure, formation et tâche |
| intra-reader | même reader répété | aveugle/intervalle et tâche |
| inter-site | sites différents | méthodes/versions et effets de site |
| inter-device | dispositifs différents | classes/versions et conditions |
| inter-vendor | vendors différents | implémentations et domaine comparatif |

`Reproducibility` ne remplace pas ces sous-qualifications. Elle doit nommer les facteurs qui varient.

### 5.4 Classification et accord

| Dimension | Condition de pertinence | Garde |
|---|---|---|
| sensitivity | tâche, classe positive et référence qualifiées | jamais utilisée comme capacité générale de mesure |
| specificity | tâche, classe négative et référence qualifiées | jamais transférée entre populations |
| agreement | deux méthodes/readers/versions comparés | agreement ≠ corrélation |
| discrimination/other task metric | seulement si terminologie et tâche gouvernées | ajout comme extension, pas synonyme improvisé |

## 6. Conditions et influences

### 6.1 Rôle normatif

| Rôle | Obligation | Statut en cas d’absence |
|---|---|---|
| `REQUIRED_CONDITION` | condition constitutive documentée | non-applicable, incomplete ou non-évaluable selon portée |
| `RECOMMENDED_CONDITION` | influence bénéfique documentée | écart + impact, pas invalidité automatique |
| `KNOWN_INFLUENCE` | direction/effet ou simple influence sourcée | limitation, contrôle ou stratification |
| `QUALITY_CRITERION` | test d’aptitude attendu | résultat futur distinct |
| `EXCLUSION_CONDITION` | contexte exclu par l’owner compétent | refus/escalade contextualisé |
| `UNKNOWN_EFFECT` | influence possible non établie | unknown explicite |

### 6.2 Dimensions contextuelles

Patient/participant condition, preparation, timing, operator, reader, site/environment, device, manufacturer/model/generation, software/firmware, reagent/lot, calibration, processing, reconstruction, input quality et source sont des dimensions possibles. Aucune n’est obligatoire universellement.

## 7. Qualité attendue

| Type | Objet contrôlé | Owner | Résultat réel possédé par |
|---|---|---|---|
| `MEASUREMENT_QUALITY_REQUIREMENT` | aptitude de la mesure définie | OBS/domaine | CDM/Data ou système source |
| `ACQUISITION_QUALITY_REQUIREMENT` | entrée/acquisition | domaine acquisition | système source/domaine/Data |
| `READING_QUALITY_REQUIREMENT` | procédure/reader | domaine lecture/Core Lab | domaine/Data |
| `DATA_QUALITY` | intégrité/représentation | Data Management | Data Management |
| `OCCURRENCE_QUALITY` | occurrence précise | CDM/Data | CDM/Data |
| `ANALYSIS_QUALITY` | exécution/résultat analytique | owner Analysis | owner Analysis |

Une exigence contient cible, méthode de contrôle, moment, critère, conséquence, owner, version et preuve. OBS ne contient jamais le résultat réel.

## 8. Comparabilité et harmonisation

### 8.1 Axes obligatoires

1. identité de l’ObservableProperty ;
2. sémantique de sortie ;
3. domaine/population/temps ;
4. conditions d’appariement ;
5. biais/différence systématique ;
6. transformation/calibration ;
7. interchangeabilité pour l’usage ;
8. incertitude résiduelle ;
9. preuve/version/provenance.

### 8.2 Diagnostics composés

| Diagnostic | Condition minimale | Interdiction |
|---|---|---|
| `EQUIVALENT_IN_DEFINED_DOMAIN` | équivalence démontrée sur tous les axes requis | généraliser hors domaine |
| `COMPARABLE_WITH_CONDITIONS` | comparaison recevable sous conditions nommées | appeler interchangeable |
| `HARMONIZABLE_BY_RULE` | règle/version et performance résiduelle documentées | effacer les méthodes sources |
| `CALIBRATABLE_AGAINST_REFERENCE` | référence, calibration et domaine documentés | confondre calibration et vérité |
| `NON_INTERCHANGEABLE` | résultats comparables mais substitution irrecevable pour l’usage | fusionner les valeurs |
| `INCOMPARABLE_FOR_USE` | propriété/sortie/contexte incompatibles | produire une transformation implicite |
| `COMPARABILITY_UNKNOWN` | preuve ou contexte insuffisant | choisir l’égalité par défaut |

Ces diagnostics ne sont pas des relations PD-003 nouvelles.

## 9. Axes de validité BiomarkerRole

| Axe | Owner de la vérité | OBS conserve | Project décide |
|---|---|---|---|
| analytical validity | Knowledge + domaine | propriétés analytiques, référence, conditions et limites applicables | aptitude analytique à l’usage |
| measurement validity | Knowledge + domaine | qualification et refs | aptitude à l’usage |
| biological relevance | Knowledge | cible/contexte et refs | pertinence pour l’objectif |
| construct validity | Knowledge/Models/OBS | cohérence propriété-méthode-construit | adoption contextuelle |
| repeatability/reproducibility | Knowledge + domaine | performance applicable | acceptabilité |
| transportability | Knowledge/OBS | domaines et inconnues | site/population réels |
| task sensitivity/specificity | Knowledge | tâche/référence/population | rôle dans le design |
| prognostic/predictive association | Knowledge | preuves et domaine | usage scientifique |
| applicability | OBS | qualification | adoption/rejet |
| evidence strength | Knowledge | référence exacte | niveau d’engagement permis |

Les axes ne sont ni compensables ni moyennés. Un axe critique inconnu peut rendre le rôle `NOT_EVALUABLE` pour un usage sans rendre la propriété inexistante.

## 10. Diagnostics OBS

| Diagnostic | Déclencheur | Owner de l’action suivante |
|---|---|---|
| `UNKNOWN_OBSERVABILITY` | propriété/voie non qualifiable | PD-009 après signal OBS |
| `MEASUREMENT_NOT_DEFINED` | aucune méthode recevable définie | OBS/domaine ou arrêt |
| `INSUFFICIENT_EVIDENCE` | Knowledge applicable insuffisant | Knowledge/PD-009 |
| `CONFLICTING_EVIDENCE` | positions applicables incompatibles | Knowledge/revue humaine |
| `METHOD_NOT_APPLICABLE` | domaine incompatible | OBS/domaine ; Project ne peut adopter |
| `METHOD_UNAVAILABLE` | capacité locale absente | Project/Operations |
| `PERFORMANCE_UNKNOWN` | performance requise non établie | Knowledge/OBS/domaine |
| `COMPARABILITY_UNKNOWN` | comparaison non qualifiable | OBS/domaine |
| `BIOMARKER_VALIDITY_UNKNOWN` | axe critique du rôle inconnu | gouvernance du rôle/Project |

Ils composent les axes PD-003 et ne créent aucun état canonique universel.

## 11. Gouvernance du catalogue

Le catalogue évolue lorsqu’un axe transversal change de sens, qu’une dimension scientifique récurrente exige une définition contrôlée ou qu’un conflit de synonymes menace la fidélité inter-domaines. Toute extension indique définition, question, owner, condition de pertinence, exclusions, mapping PD-003 et impacts.

Il ne doit pas évoluer pour enregistrer une valeur, un seuil, une marque, un instrument, un corpus, une méthode particulière, un écran ou une implémentation.

## 12. Limitations

- Vocabulaire ouvert et non exhaustif.
- Aucun standard externe n’est adopté comme taxonomie universelle.
- Aucun terme ne prouve qu’une qualification scientifique existe dans un corpus.
- Aucune compatibilité moteur n’est démontrée.
