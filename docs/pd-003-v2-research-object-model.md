# PD-003 V2 — Research Object Model

## Modèle métier canonique du Protocol Designer

| Champ | Valeur |
|---|---|
| Identifiant documentaire | PD-003 V2 |
| Version | 2.0 |
| Statut | `OFFICIAL — REFERENCE_NORMATIVE_CURRENT` |
| Niveau documentaire | `NIVEAU_1 — référence métier normative` |
| Source maîtresse | `docs/pd-003-v2-research-object-model.md` |
| Date d'effet | 12 août 2026 |
| Autorité supérieure | Charte fondatrice, puis Scientific Product Manifesto V2 |
| Version remplacée | PD-003 V1, conservée sous `docs/pd-003-research-object-model.md` avec le statut `HISTORICAL_SUPERSEDED` |
| Portée | modèle conceptuel métier ; aucune prescription d'implémentation ou de stockage |
| Décision | `PD003_V2_RESEARCH_OBJECT_MODEL_ADMITTED_WITH_LIMITATIONS` |

---

## 0. Règle de lecture et décision normative

PD-003 V2 est l'autorité courante sur le vocabulaire métier canonique, les identités, relations, cycles de vie, responsabilités, handoffs, états et invariants du Protocol Designer.

Cette version accomplit l'évolution devenue possible après l'adoption du Scientific Product Manifesto V2. Elle remplace la chaîne composite V1 par une architecture explicite :

> Knowledge → Scientific Models → Observable Properties → Measurement Definitions → Biomarker Roles → Research Project → Canonical Variables → Variable Occurrences → Analyses → Documents.

Cette chaîne décrit des responsabilités et des transmissions de références. Elle n'est ni un pipeline obligatoire, ni une chaîne d'autorité descendante, ni un droit de mutation automatique.

PD-003 V2 :

- préserve les 68 types d'objets V1 par un crosswalk exhaustif ;
- conserve 67 continuités d'identité, inchangées, clarifiées ou spécialisées ;
- place le type `Biomarqueur` V1 en lecture legacy et le remplace, pour toute nouvelle création V2, par `BiomarkerRole` ;
- admet sept nouveaux types d'objets canoniques : `ScientificModel`, `ObservableProperty`, `MeasurementDefinition`, `DataNeed`, `VariableOccurrence`, `Biospecimen` et `AnalysisResult` ;
- qualifie `StudyDataSource` comme sous-ressource, `TerminologyMapping` comme relation, `AnalysisExecution` comme sous-ressource et les occasions temporelles comme relations ou value objects ;
- conserve les moteurs et rapports existants comme état d'implémentation V1 tant qu'une migration séparée n'est pas réalisée.

La présente admission ne crée aucun moteur, aucune interface, aucune migration, aucun protocole, aucune donnée, aucun PASS PD-011 et aucune validation scientifique.

---

## 1. Plans de vérité obligatoirement distincts

| Plan | Contenu | Propriétaire de la vérité | Interdiction |
|---|---|---|---|
| Constitution | mission, principes, responsabilités fondamentales | Charte puis Manifesto V2 | être réécrite par commodité d'implémentation |
| Knowledge | concepts, assertions, relations, preuves, domaines, controverses | gouvernance Knowledge et corpus | adopter une stratégie de projet |
| Scientific Model | composition explicative, alternatives, hypothèses de modèle | gouvernance du modèle ; contributions Scientific Thinking | recopier les preuves ou devenir vérité universelle |
| Observability & Measurement | propriétés observables et définitions de mesure | futur domaine OBS avec spécialistes | contenir des valeurs individuelles ou choisir la variable du projet |
| Research Project | intention, modèles adoptés, Data Needs, variables, décisions, stratégie | Study Design et acteurs humains mandatés | modifier la force de Knowledge |
| Study Data | occurrences, sources, qualité, provenance, corrections, lignage | systèmes sources puis Data Management/CDM pour la représentation | expliquer la science ou choisir l'inférence |
| Analyses | spécifications, exécutions et résultats | owners spécialisés | confondre résultat et interprétation |
| Projections | structure et forme pour un usage | TMP puis DOC | devenir source du fond |
| Implémentation | capacités réellement livrées et testées | rapports, code et tests datés | redéfinir le modèle métier |

Une même expression ne doit jamais être utilisée pour fusionner deux plans. Le terme non qualifié `Observation` est interdit pour désigner une Variable Occurrence.

---

## 2. Métamodèle conceptuel

### 2.1 Catégories

| Catégorie | Critère d'autonomie | Exemples V2 |
|---|---|---|
| `OBJECT` | identité, responsabilité, cycle et version propres ; peut être cité indépendamment | ScientificModel, ObservableProperty, CanonicalVariable |
| `ROLE` | qualification contextuelle d'un objet ou d'une relation ; son sens dépend des extrémités | BiomarkerRole |
| `RELATION` | affirmation typée entre identités, avec contexte, état, période et provenance | TerminologyMapping, COVERS_DATA_NEED |
| `VALUE_OBJECT` | valeur sémantique définie par son contenu, sans lifecycle autonome | TemporalAnchor, SourceProvenanceAxes |
| `PROJECT_SUBRESOURCE / SUBRESOURCE` | identité locale et lifecycle subordonnés à un objet propriétaire, souvent le ResearchProject | StudyDataSource, ExpectedVariableOccasion, AnalysisExecution |
| `SPECIALIZATION` | même lignée canonique qu'un type plus général, avec contraintes et owner spécialisés | CanonicalVariable, Visit, AnalysisSpecification |
| `PROJECTION` | représentation dérivée pour un usage, sans mutation ni ownership du fond | vue CRF, Data Dictionary, SAP ou document d'une identité canonique |
| `NOT_REQUIRED` | aucune nouvelle entité ; une composition ou une relation existante conserve le sens sans perte | ScientificInterpretation comme composition gouvernée |
| `LEGACY_OBJECT` | objet créé sous une norme remplacée, lisible et rejouable mais non créable en V2 | Biomarqueur V1 |

### 2.2 Test d'autonomie obligatoire

Un nouveau type devient `OBJECT` seulement si au moins quatre propriétés sont démontrées :

1. il possède une identité stable indépendante de son libellé ;
2. il a un owner capable de le créer, qualifier, corriger et versionner ;
3. il suit un cycle de vie distinct ;
4. il peut être référencé par plusieurs consommateurs sans être copié ;
5. son changement possède des impacts propres ;
6. le représenter comme rôle, relation, value object ou sous-ressource ferait perdre du sens, de la provenance ou une décision.

À défaut, la représentation la moins inflationniste s'impose.

### 2.3 Arbitrage explicite des candidats

| Candidat examiné | Décision | Justification normative |
|---|---|---|
| ScientificModel | `OBJECT` | Identité/version, composition, alternatives, cycle, adoption et impacts propres ; une simple Hypothèse ou relation Knowledge ne les conserve pas. |
| ObservableProperty | `OBJECT` | Identité scientifique réutilisable et cycle distinct des phénomènes, méthodes, rôles biomarqueurs, variables et valeurs. |
| MeasurementDefinition | `OBJECT` | Méthode versionnée, domaines, conditions, performances, reproductibilité et limites réutilisables indépendamment d'un Project. |
| DataNeed | `OBJECT` borné au ResearchProject | Lifecycle de couverture, décisions, temporalité et impacts propres ; une question adaptative ou un missing datum ne porte pas ce contrat. |
| VariableOccurrence | `OBJECT` | Identité, correction, source, qualité, temps, restriction et lignage propres ; elle ne peut être réduite à la CanonicalVariable. |
| Biospecimen | `OBJECT` | Identité matérielle, custody, parenté, disponibilité, transformations et cycle distincts des mesures et des données. |
| StudyDataSource | `SUBRESOURCE` | L'usage, la période, l'accès et la provenance dépendent du Project ; l'identité et l'ownership du système externe restent externes. L'autonomie NOXIA n'est pas démontrée. |
| AnalysisResult | `OBJECT` sous critère d'autonomie | Les résultats complexes ont structure, diagnostics, incertitude, revue et cycle propres ; un scalaire dérivé pré-spécifié reste VariableOccurrence. |
| TerminologyMapping | `RELATION` | Son sens dépend de deux identités/version, d'un type d'équivalence et d'un contexte ; le réifier comme objet racine créerait une identité concurrente inutile. |

Les alternatives `ROLE`, `VALUE_OBJECT`, `SPECIALIZATION`, `PROJECTION` et `NOT_REQUIRED` ont été testées mais ne sont retenues pour aucun de ces neuf candidats. Elles restent utilisées ailleurs : BiomarkerRole est un `ROLE`, TemporalAnchor un `VALUE_OBJECT`, CanonicalVariable une `SPECIALIZATION`, les vues documentaires des `PROJECTION`, et aucun nouveau type autonome n'est requis pour ScientificInterpretation.

### 2.4 Contrat commun à tout objet canonique

Tout objet canonique possède au minimum :

- une identité canonique stable et son type ;
- une version immuable et son statut de cycle de vie ;
- un contexte et un domaine de validité ;
- un owner et les contributeurs autorisés ;
- une provenance ;
- les inconnues, contradictions et limites applicables ;
- les décisions humaines engageantes ;
- les relations sources et dépendantes ;
- les objets remplacés, spécialisés ou contextualisés ;
- les projections qui le consomment sans le posséder.

---

## 3. Research Project — source de vérité d'un projet particulier

`ResearchProject` est la spécialisation V2 du `Dossier de recherche` V1. Il conserve sa continuité d'identité.

Il est la source de vérité pour :

- la situation, l'intention, la question et le contexte du projet ;
- les modèles scientifiques candidats, adoptés ou rejetés pour ce projet ;
- les Data Needs, Canonical Variables, temps attendus et critères ;
- les options, recommandations, décisions, versions et impacts ;
- les inconnues, contradictions, risques, biais et limites ;
- les références vers Knowledge, OBS, sources de données, analyses et projections.

Il n'est pas la source de vérité pour :

- la connaissance scientifique générale ;
- la preuve qu'une méthode mesure une Observable Property ;
- une donnée brute conservée dans son système source ;
- l'applicabilité d'une Requirement possédée par REG ;
- une structure de Template possédée par TMP ;
- une projection possédée par DOC ;
- un résultat d'évaluation PD-011.

### 3.1 Modèles adoptés

Le Project ne copie pas un ScientificModel. Il porte une relation versionnée d'adoption ou de rejet avec acteur, mandat, portée, justification, réserves, alternatives et date d'effet. Plusieurs modèles concurrents peuvent rester actifs dans des rôles différents.

### 3.2 Écritures et contributions

Un moteur propose une `Contribution`. Une mutation canonique appartient à l'owner de l'objet et, lorsqu'elle engage la stratégie, exige une `Décision` humaine sous `Mandat décisionnel`. Aucun handoff ne transfère l'ownership.

---

## 4. Nouveaux objets canoniques V2

### 4.1 ScientificModel

**Catégorie :** `OBJECT`.

**Rôle.** Composition explicative versionnée d'éléments scientifiques référencés, organisée pour une question ou un domaine explicatif.

**Contrat.** Il porte identité, version, objectif explicatif, références Knowledge, éléments, rôles, relations causales, fonctionnelles ou temporelles proposées, mécanismes, temporalité, hypothèses de modèle, présupposés, alternatives, conditions de réfutation, inconnues, contradictions, domaine de validité, statut de chaque composant, provenance, revue et supersession.

**Owner.** Une gouvernance scientifique de modèle demeure à instituer. Scientific Thinking propose ; les spécialistes contribuent ; un acteur scientifique mandaté adopte l'usage dans un Project.

**Cycle.** proposé → documenté → en revue → admissible dans un contexte → adopté ou rejeté par un Project → révisé, remplacé ou déprécié.

**Invariants.** Il référence Knowledge sans recopier les preuves ; il n'augmente jamais leur force ; un modèle adopté n'est pas une vérité universelle ; une Hypothèse V1 ne devient pas automatiquement ScientificModel.

### 4.2 ObservableProperty

**Catégorie :** `OBJECT`.

**Rôle.** Propriété, construit, état descriptible ou catégorie susceptible d'être observé, estimé ou classé par une méthode définissable.

**Contrat.** Elle porte identité scientifique, nature, contexte, forme observable, formes de résultat possibles, dimensions, conditions d'observabilité, limites, inconnues, provenance, facteurs de confusion, méthodes candidates, domaines de validité et relations explicites aux phénomènes, MeasurementDefinitions et BiomarkerRoles.

**Owner.** Futur domaine OBS ; Knowledge possède les concepts et assertions référencés ; les domaines de mesure contribuent.

**Cycle.** candidat → défini → documenté → revu → actif → restreint, remplacé ou déprécié.

**Invariants.** Une ObservableProperty n'est ni Phénomène biologique, ni preuve, ni MeasurementDefinition, ni BiomarkerRole, ni CanonicalVariable, ni valeur.

### 4.3 MeasurementDefinition

**Catégorie :** `OBJECT`.

**Rôle.** Définition versionnée du principe par lequel une ObservableProperty peut produire une mesure, catégorie, classification ou statut interprétable.

**Contrat.** Elle porte identité, version, propriété ciblée, nature et domaine de la méthode, conditions nécessaires, forme des résultats, dépendances techniques, performances documentées, reproductibilité, qualité, facteurs de confusion, limites, provenance et sources Knowledge référencées. Imaging, Laboratory, Clinical Assessment, Device, Questionnaire et Derived Method sont des spécialisations possibles, non une taxonomie exhaustive admise ici.

**Owner.** Futur OBS pour le contrat transversal ; Imaging, laboratoire, évaluation clinique et autres domaines possèdent leurs spécialisations.

**Cycle.** candidate → documentée → qualifiée → disponible dans un domaine → révisée, restreinte ou remplacée.

**Invariants.** Elle ne constitue ni un choix de projet, ni une Acquisition, ni une valeur ; la mesurabilité ne prouve pas un BiomarkerRole.

### 4.4 DataNeed

**Catégorie :** `OBJECT`, à identité bornée au ResearchProject.

**Rôle.** Information que le projet doit pouvoir obtenir, réutiliser, classer ou dériver pour répondre à une Question, poursuivre un Objectif, examiner une Hypothèse, définir un Endpoint, exécuter une Analyse, satisfaire une Regulatory Requirement, répondre à un Quality Need ou couvrir un Operational Need.

**Contrat.** Il porte identité, statut, raisons et objets motivateurs, population ou unité concernée, temporalité, qualité attendue, sources admissibles ou exclues, Variables candidates, couverture complète/partielle/absente, responsables, décisions, inconnues, compromis et provenance.

**Owner.** ResearchProject / Study Design.

**Cycle.** ouvert → adopté → partiellement couvert → couvert, abandonné, non évaluable ou remplacé. `Couvert` en définition ne signifie pas réalisé dans les données.

**Invariants.** Il reste distinct d'un Knowledge Gap, du `Besoin d'information` conversationnel, d'une Adaptive Question et d'une Missing Data ; il ne crée jamais automatiquement une Variable ou une collecte.

### 4.5 VariableOccurrence

**Catégorie :** `OBJECT`.

**Rôle.** Réalisation, tentative de réalisation, absence qualifiée ou dérivation d'une CanonicalVariable pour une unité étudiée et une occasion données.

**Contrat.** Elle porte `occurrenceId`, CanonicalVariable et version, unité étudiée, occasion/timepoint, MeasurementDefinition et version, source, `valueOrStatus`, unité effective, temps d'acquisition/collecte/transformation/analyse applicables, qualité, contrôles, provenance, sources de dérivation, historique de correction, restrictions d'usage et acteur ou système producteur.

**Owner.** Le système source possède la valeur primaire ; Data Management/CDM possède sa représentation canonique ; les owners spécialisés possèdent les règles de production ou de dérivation.

**Cycle.** attendue → tentée → réalisée, absente, non collectée, non applicable, non évaluable ou invalide → vérifiée → corrigée ou remplacée → gelée/archivée.

**Invariants.** Elle ne modifie jamais sa Variable ; absence ≠ normal ; correction ≠ effacement ; dérivation sans sources ≠ recevable ; occurrence ≠ interprétation.

### 4.6 Biospecimen

**Catégorie :** `OBJECT`.

**Rôle.** Ressource matérielle spécialisée issue d'une unité source et pouvant faire l'objet de collectes, transformations, conservations ou aliquotages.

**Contrat.** Il porte `specimenId`, unité source, type matériel, événement de collecte, processing, conditions, chaîne de custody, storage, transformations, parentSpecimen, childSpecimens, aliquots, quantité/qualité lorsqu'elles sont gouvernées, disponibilité, restrictions, consentement applicable, provenance et statut. Blood, Serum, Plasma, Urine, Stool, Biopsy, DNA/RNA et Aliquot servent de cas de test ; ils ne constituent pas une taxonomie exhaustive imposée.

**Owner.** Domaine Biospecimen/biobanque et système source ; représentation coordonnée par Data Management.

**Cycle.** planifié → collecté → reçu → qualifié → stocké → transformé/aliquoté → utilisé, épuisé, détruit ou archivé.

**Invariants.** Biospecimen ≠ Variable ; collecte ≠ VariableOccurrence d'une propriété ; conservation ≠ analyse sélectionnée ; biobanque ≠ source scientifique.

### 4.7 AnalysisResult

**Catégorie :** `OBJECT` sous critère d'autonomie.

**Rôle.** Résultat d'une AnalysisExecution dont la structure, les diagnostics, l'incertitude ou le sens ne peuvent pas être conservés fidèlement par une seule VariableOccurrence dérivée.

**Contrat.** Il porte AnalysisSpecification et exécution sources, entrées, population d'analyse, estimand ou objet de calcul applicable, valeurs/structures produites, incertitude, diagnostics, qualité, limites, version, provenance et statut.

**Owner.** Owner spécialisé de l'analyse ; Data Management conserve le lignage ; le ResearchProject référence le résultat adopté pour interprétation.

**Cycle.** produit → contrôlé → disponible pour revue → retenu avec limites, rejeté ou remplacé → archivé.

**Invariants.** Un scalaire dérivé déjà défini comme CanonicalVariable doit rester VariableOccurrence ; l'identité AnalysisResult est réservée aux résultats complexes ; résultat ≠ interprétation ≠ décision.

---

## 5. Spécialisations et constructions non autonomes

### 5.1 BiomarkerRole

`BiomarkerRole` est un `ROLE` qualifié, identifiable et versionné, reliant :

- une ObservableProperty ;
- une cible : phénomène, état, exposition, réponse ou résultat pertinent ;
- un usage scientifique ;
- une population, un temps et un contexte ;
- une ou plusieurs MeasurementDefinitions compatibles ;
- un domaine de validité, des facteurs de confusion, une reproductibilité documentée, des limites et preuves ;
- un niveau de confiance, des alternatives, contradictions et une provenance ;
- un statut Project : candidat, retenu, rejeté ou exploratoire.

La gouvernance scientifique du rôle en possède la définition générale, OBS contribue propriété/méthode, Knowledge fournit les preuves référencées et le ResearchProject possède la décision d'adoption contextuelle. Il n'est pas une ObservableProperty et ne devient pas valide par la seule mesurabilité. Deux rôles ne sont pas fusionnés lorsque cible, usage, population, temps, méthode ou domaine diffèrent.

### 5.2 CanonicalVariable

`CanonicalVariable` est la spécialisation V2 de `Variable d'étude`. Son identité est unique dans un Project et à travers CRF, Data Dictionary, SAP, jeux d'analyse, exports, rapports et documents.

Elle porte au minimum : `variableId`, canonicalName, displayLabels, aliases, version, projectId, scientificRole, DataNeedRefs, ObservablePropertyRef si applicable, MeasurementDefinitionRef si applicable, BiomarkerRoleRefs si applicable, EndpointRefs, sourceExpectation, temporalExpectation, unitOrValueDomain, dataType, qualityExpectation, missingnessPolicy, derivation, dependencies, analysisUses, TerminologyMappings, provenance et statut.

Une modification de libellé, traduction ou mapping compatible conserve l'identité. Une modification du sens, de la propriété, du rôle, de la méthode déterminante, du domaine de valeurs ou de l'unité sémantique crée une nouvelle version ou identité selon la rupture de sens.

### 5.3 StudyDataSource

`StudyDataSource` est un `SUBRESOURCE`, non un objet autonome V2. Il décrit une source effectivement utilisée ou prévue : identité externe référencée, responsable, période, version, règles d'accès, mandat de production, contexte de provenance, domaine/méthode et lignage. EHR, laboratoire, PACS, registre, wearable, biobanque, eCRF, import externe et source dérivée sont couverts sans devenir des types racines distincts.

Si une future architecture démontre qu'une source possède un lifecycle et un owner indépendants dans NOXIA, son admission comme objet exigera une évolution normative. Un système externe conserve toujours sa propre identité ; NOXIA ne le recrée pas.

### 5.4 TerminologyMapping

`TerminologyMapping` est une `RELATION` versionnée, jamais un objet racine. Elle porte standard et version, identité NOXIA source, cible externe, type d'équivalence, contexte, exclusions, provenance, revue, alternatives et période de validité.

Un mapping partiel ne devient pas exact. Un code externe ne remplace jamais l'identité canonique NOXIA. CDISC, FHIR, OMOP, LOINC, SNOMED CT et MedDRA sont des systèmes externes possibles ; leur présence n'accorde aucune priorité sur le raisonnement interne.

### 5.5 Temps et occasions

- `Visit` est la spécialisation V2 de `Visite ou temps d'observation` pour une rencontre ou fenêtre opérationnelle planifiée.
- `TemporalAnchor` est un `VALUE_OBJECT` : timepoint scientifique, événement relatif, fenêtre ou intervalle.
- `ExpectedVariableOccasion` est une `RELATION`/`SUBRESOURCE` reliant CanonicalVariable, unité/groupe et TemporalAnchor.
- AcquisitionTime, CollectionTime, ProcessingTime, TransformationTime et AnalysisTime sont des rôles temporels portés par les objets concernés.

Une répétition temporelle ne crée pas plusieurs CanonicalVariables si leur sens reste identique.

### 5.6 Analyse

Le type V1 `Analyse` devient `AnalysisSpecification` sans rupture d'identité lorsque son contenu décrit une spécification.

- `AnalysisSpecification` est l'objet canonique qui définit finalité, entrées, population, méthode, hypothèses, outputs attendus, qualité et limites.
- `AnalysisExecution` est un `SUBRESOURCE` versionné qui relie une spécification, ses entrées réelles, l'environnement, l'exécutant, la date, les contrôles et le statut.
- `AnalysisResult` est un objet uniquement sous le critère d'autonomie du §4.7.
- `ScientificInterpretation` est une construction gouvernée de Project composée de résultat, Règle d'interprétation, Justification et Décision humaine ; aucun nouvel objet racine n'est admis tant que cette composition conserve intégralement l'identité et l'ownership.

Imaging possède lecture et mesure d'image ; Data Management possède transformations, intégrité et lignage ; Biostatistics possède estimands, modèles, populations d'analyse, sensibilités et dimensionnement ; l'humain mandaté possède l'interprétation engageante.

---

## 6. Inventaire canonique des continuités V1

Les définitions V1 restent incorporées pour les types `UNCHANGED`, sous le contrat commun V2. Les clarifications et spécialisations ci-dessous priment sur les formulations V1 correspondantes.

| Famille | Types canoniques V2 |
|---|---|
| Projet et gouvernance | ResearchProject ; Acteur du projet ; Mandat décisionnel ; Situation de recherche ; Intention scientifique ; Contexte du projet ; Stratégie scientifique ; Version de stratégie ; Contribution |
| Construction scientifique | Question scientifique ; Objectif scientifique ; Hypothèse ; Pathologie ou condition clinique ; Structure anatomique ; Population d'étude ; Phénotype ; Phénomène biologique ; Plan d'étude ; Groupe d'étude ; Visit ; Intervention ou exposition |
| Mesure et stratégie | CanonicalVariable ; Critère de jugement ; Modalité d'imagerie ; Acquisition ; Séquence ou technique ; Paramètre critique ; Condition de mesure ; Protocole d'imagerie ; Site et environnement technique ; Contrainte ; Règle d'harmonisation ; Contrôle qualité ; Procédure de lecture ; AnalysisSpecification ; Dimensionnement ; Règle d'interprétation |
| Dialogue et décision | Information de projet ; Besoin d'information ; Échange adaptatif ; Option ; Recommandation ; Décision ; Justification ; Compromis ; Dépendance ; Incertitude ; Risque ; Biais ; Limite ; Contradiction ; Alerte méthodologique ; Revue méthodologique ; Analyse d'impact ; Événement d'évolution |
| Knowledge | Énoncé de connaissance ; Relation scientifique ; Domaine de validité ; Source scientifique ; Preuve scientifique ; Synthèse de preuves ; Controverse scientifique ; État de connaissance effectif ; Règle méthodologique |
| Projection | Profil de projection ; Projection ; Rapport scientifique |

Les 68 dispositions individuelles et leurs règles de migration figurent dans `docs/pd-003-v1-v2-object-crosswalk.md`.

---

## 7. États, absence et non-évaluabilité

### 7.1 Dimensions orthogonales

Un état unique ne doit jamais mélanger connaissance, réalisation, applicabilité, cohérence, dérivation et actualité.

| Dimension | Valeurs minimales |
|---|---|
| Épistémique | `KNOWN`, `ASSUMED`, `UNKNOWN`, `WITHHELD` |
| Applicabilité | `APPLICABLE`, `NOT_APPLICABLE`, `APPLICABILITY_UNKNOWN` |
| Réalisation | `EXPECTED_NOT_YET_AVAILABLE`, `REALIZED`, `MISSING`, `NOT_COLLECTED`, `NOT_EVALUABLE`, `INVALID` |
| Cohérence | `CONSISTENT`, `CONFLICTING` |
| Lignage | `PRIMARY`, `REUSED`, `TRANSFORMED`, `DERIVED` |
| Actualité | `CURRENT`, `SUPERSEDED`, `OBSOLETE` |

### 7.2 Compatibilité V1

`connu` se projette vers `KNOWN`; `supposé` vers `ASSUMED`; `inconnu` vers `UNKNOWN`; `non applicable` vers l'axe Applicabilité ; `contradictoire` vers `CONFLICTING` ; `obsolète` vers l'axe Actualité. Aucune migration ne doit réduire ces axes en un enum unique.

### 7.3 Absence

`MISSING`, `NOT_COLLECTED`, `NOT_APPLICABLE`, `NOT_EVALUABLE`, `INVALID` et un résultat biologiquement négatif sont distincts. Une raison, une provenance, un responsable et une conséquence analytique doivent être conservés lorsqu'ils sont connus.

---

## 8. Sources et provenance

La provenance d'une donnée se décrit selon quatre axes au minimum :

1. **mandat de production** : `STUDY_MANDATED`, `NOT_STUDY_MANDATED`, `UNKNOWN` ;
2. **contexte** : `ROUTINE_CARE`, `RESEARCH`, registre, biobanque, ressource externe ou autre contexte gouverné ;
3. **domaine/méthode** : imagerie, laboratoire, dispositif porté, clinique ou autre spécialité ;
4. **lignage** : primaire, réutilisé, transformé ou dérivé.

Ces axes ne constituent pas une taxonomie plate. `ROUTINE_CARE` ≠ `STUDY_MANDATED` : le premier qualifie le contexte d'origine et le second un mandat de production. Une donnée de soin courant reste issue du soin courant après sélection, copie, transformation ou analyse. `DERIVED` ne décrit jamais son mandat d'origine.

Traçabilité et provenance sont liées mais distinctes : la provenance décrit l'origine et les transformations ; la traçabilité permet de reconstruire la continuité entre identités, versions, handoffs, décisions, contrôles et projections.

---

## 9. Ownership et handoffs

### 9.1 Règles

1. Créer, contribuer, adopter, représenter, analyser et projeter sont des responsabilités distinctes.
2. Un consumer ne mute jamais l'objet de son provider.
3. Une correction détectée en aval remonte comme Contribution vers l'owner.
4. Un handoff transmet le minimum suffisant et conserve identité, version, rôle, contexte, statut, provenance, décisions, inconnues, contradictions, limites et dépendances.
5. Une adoption Project ne transforme ni modèle candidat en vérité, ni Requirement candidate en obligation, ni pattern en règle.
6. Un owner spécialisé ne peut pas promouvoir sa contribution dans le domaine d'un autre owner.

### 9.2 Enveloppe commune d'un handoff

Chaque handoff identifie obligatoirement source owner, target owner, identités et versions, statuts, provenance, inconnues, contradictions, décisions, transformations autorisées, transformations interdites et accusé de réception ou refus. L'absence d'un élément requis est transmise comme `UNKNOWN` ou `INCOMPLETE`, jamais comblée silencieusement.

### 9.3 Frontières minimales

| Handoff | Source owner → target owner | Identités/contenu transmis | Transformations autorisées | Transformations interdites |
|---|---|---|---|---|
| Knowledge → ScientificModel | Knowledge → gouvernance Models | unités, assertions, preuves, domaines, limites, contradictions, versions | référencer, composer, qualifier le rôle dans un modèle | copier la preuve, augmenter la causalité ou modifier Knowledge |
| ScientificModel → OBS | gouvernance Models → OBS | modèle/version, éléments, rôles, relations, alternatives, portée, statuts | identifier des ObservableProperties candidates et questions d'observabilité | présenter le modèle comme vérité unique ou méthode validée |
| Knowledge → OBS | Knowledge → OBS | propriétés candidates, assertions et preuves de méthodes | référencer et qualifier le domaine | créer un choix de projet ou un rôle biomarqueur adopté |
| OBS → ResearchProject | OBS → ResearchProject / Study Design | ObservableProperties, MeasurementDefinitions, BiomarkerRoles candidats, preuves, limites, gaps | adopter/rejeter/contextualiser par Décision Project | créer automatiquement CanonicalVariable, DataNeed ou choix de modalité |
| ResearchProject → CDM | ResearchProject → futur CDM | DataNeeds, CanonicalVariables, TemporalAnchors, occasions, sources prévues, qualité, decisions | définir une représentation qui conserve le sens | inventer une valeur, aplatir les états ou redéfinir la Variable |
| CDM → Data Management | futur CDM → Data Management | contrat de représentation, identités, sources, statuts, provenance et lignage | collecter, conserver, contrôler, corriger par supersession | changer DataNeed, scientificRole ou définition canonique |
| CDM → Biostatistics | futur CDM → Biostatistics | Variables, Occurrences, quality, missingness, provenance et versions | sélectionner des entrées selon AnalysisSpecification et gel déclaré | choisir implicitement l'estimand ou requalifier une occurrence |
| Imaging → Project/CDM | Imaging → ResearchProject puis futur CDM | MeasurementDefinitions spécialisées, faisabilité, acquisitions prévues/réalisées, qualité, limites | proposer opérationnalisation et représentation spécialisée | promouvoir modalité en besoin, méthode en validité, valeur en interprétation |
| Analysis → Project/Documents | Biostatistics/domaine → ResearchProject puis DOC | spécification, exécution, résultats, diagnostics, limites, lignage | revue humaine, décision, projection autorisée | produire automatiquement interprétation, décision ou vérité documentaire |
| Project/REG/DOC-002 → TMP | owners sources → TMP | objets, Requirements, Patterns et états | composer une structure logique | créer contenu, Requirement ou objet métier |
| TMP/Project → DOC | TMP/Project → DOC | structure et contenu gouvernés avec versions | projeter et rendre selon profil | corriger le Project ou masquer une limite obligatoire |
| toute frontière → VAL | owner source → VAL | snapshots minimaux read-only, règles, références et décisions | diagnostiquer et produire une preuve d'évaluation | corriger, muter ou créer un PASS scientifique implicite |

Le détail des owners figure dans `docs/pd-003-v2-ownership-matrix.md`.

---

## 10. Identité, versionnement et supersession

### 10.1 Continuité sémantique

Une identité canonique représente un sens gouverné, non un libellé d'écran. Alias, traduction, format et mapping externe compatibles ne créent pas de nouvelle identité.

Une modification compatible crée une version. Une modification qui change la propriété, la cible, le rôle, le domaine ou la signification crée une nouvelle identité reliée par `SUPERSEDES`, `SPECIALIZES` ou une relation plus précise.

L'identifiant reste opaque au sens fragile, indépendant d'un écran et d'un standard externe. Les labels, aliases et TerminologyMappings sont révisables sans devenir l'identité.

### 10.2 Versions immuables

Une version utilisée par une Décision, une AnalysisExecution ou une Projection est immuable. Une correction crée une nouvelle version et une Analyse d'impact ; elle ne réécrit pas l'historique.

Toute version ou révision conserve : `version`, `revision`, `supersedes`, `supersededBy`, `effectiveFrom`, `effectiveUntil`, `status`, `reason` et `provenance`. `revision` documente une correction non sémantique au sein de la politique de version ; `version` signale un état gouverné consommable ; aucune des deux n'autorise l'écrasement.

| Changement | Décision d'identité par défaut | Justification |
|---|---|---|
| correction factuelle sans changement de sens | même identité, nouvelle révision/version | l'historique et les impacts restent reconstructibles |
| changement de label, traduction ou alias | même identité ; metadata versionnée | le sens scientifique reste stable |
| ajout ou correction d'un mapping externe | même identité NOXIA ; nouvelle TerminologyMapping/version | le standard externe ne possède pas l'identité interne |
| changement compatible de méthode sans effet sur le sens de l'objet | même identité, nouvelle version ; applicabilité réévaluée | les consumers doivent pouvoir choisir la version exacte |
| changement de méthode déterminante ou de principe de mesure | nouvelle MeasurementDefinition ; nouvelle identité si le sens de la Variable change | la comparabilité ne peut être supposée |
| changement d'unité purement convertible et gouverné | même identité/version qualifiée si le domaine sémantique reste stable | la représentation ne doit pas multiplier les Variables |
| changement d'unité sémantique, de domaine de valeurs ou d'échelle non équivalente | nouvelle identité ou spécialisation | la valeur ne répond plus à la même définition |
| changement de temporalité attendue | mêmes Variable et TemporalAnchor/occasion versionnés si le sens reste stable ; nouvelle identité si la temporalité définit le construit | Variable identity ≠ observation occasion, sauf rupture scientifique démontrée |
| changement de BiomarkerRole | nouvelle version ou nouvelle identité du rôle selon cible/usage/population/temps/méthode | le rôle est contextuel et ne modifie ni ObservableProperty ni Variable automatiquement |
| changement de propriété, cible, owner ou signification | nouvelle identité reliée par `SUPERSEDES` | la continuité sémantique est rompue |
| fusion proposée de deux identités | refus par défaut ; décision humaine et preuve de `sameIdentity` requises | similitude de libellé, code ou valeur ne prouve pas l'identité |

### 10.3 Legacy

- PD-003 V1 reste consultable pour tout artefact antérieur à l'effet de V2.
- Un objet legacy reste interprété selon la norme qui l'a créé.
- Aucun Biomarqueur V1 n'est automatiquement scindé en ObservableProperty et BiomarkerRole.
- Aucune Variable V1 contenant une valeur ne devient CanonicalVariable sans séparation sourcée.
- Deux Variables V1 à des temps différents ne sont ni fusionnées ni séparées automatiquement.
- Toute ambiguïté reçoit `NEW_MAPPING_REQUIRED` ou `AMBIGUOUS_REQUIRES_ARBITRATION`.

La politique complète figure dans `docs/pd-003-v2-legacy-compatibility.md`.

---

## 11. Relations canoniques V2

Toute relation possède direction, type, contexte, justification, statut, période, provenance, version et owner. Une relation qualifiée peut avoir une identité stable sans devenir un objet racine.

Les relations structurantes nouvelles sont :

- `REFERENCES_KNOWLEDGE` ;
- `COMPOSES` ;
- `MODELS` ;
- `OBSERVABLE_BY` ;
- `MEASURED_BY` ;
- `HAS_BIOMARKER_ROLE` ;
- `INDICATES` ;
- `MOTIVATES_DATA_NEED` ;
- `COVERS_DATA_NEED` ;
- `OPERATIONALIZES` ;
- `EXPECTED_AT` ;
- `REALIZES` ;
- `DERIVED_FROM` ;
- `COLLECTED_FROM` ;
- `PRODUCED_BY` ;
- `CONSUMED_BY_ANALYSIS` ;
- `PRODUCES_RESULT` ;
- `INTERPRETED_BY` ;
- `MAPPED_TO_STANDARD` ;
- `SUPERSEDES`.

Les relations V1 incompatibles, notamment `Phénomène est approché par Biomarqueur`, `Modalité permet d'observer Biomarqueur` et `Biomarqueur est opérationnalisé par Variable`, sont conservées uniquement en lecture legacy. Leur décomposition V2 exige des mappings explicites.

Le catalogue normatif complet figure dans `docs/pd-003-v2-relationship-catalog.md`.

---

## 12. Cycles de vie

| Famille | Cycle de référence |
|---|---|
| Objet de Project | proposé → instruit → adopté/rejeté/différé → actif → révisé/remplacé → archivé |
| ScientificModel | proposé → documenté → en revue → admissible → adopté/rejeté par contexte → remplacé/déprécié |
| ObservableProperty / MeasurementDefinition | candidate → documentée → qualifiée → active → restreinte/remplacée/dépréciée |
| BiomarkerRole | candidat → évalué → retenu/rejeté/exploratoire dans un contexte → réévalué/remplacé |
| DataNeed | ouvert → adopté → partiellement couvert → couvert/abandonné/non évaluable/remplacé |
| CanonicalVariable | proposée → définie → adoptée → attendue/collectable/dérivable → révisée/remplacée/retirée |
| VariableOccurrence | attendue → tentée → réalisée/absente/non collectée/non applicable/non évaluable/invalide → vérifiée → corrigée/remplacée → archivée |
| Biospecimen | planifié → collecté → reçu → qualifié → stocké → transformé/utilisé/épuisé/détruit/archivé |
| AnalysisResult | produit → contrôlé → disponible → retenu/rejeté/remplacé → archivé |
| Knowledge | proposé → revu → publié/effectif → corrigé/remplacé/déprécié/rétracté |
| Projection | demandée → produite → relue → diffusée → remplacée/archivée |

Une vue locale de readiness ne devient jamais un état canonique supplémentaire.

---

## 13. Invariants de cohérence V2

1. Knowledge unit is not a Scientific Model.
2. Scientific Model references Knowledge and never increases its evidence.
3. A Phenomenon is not its Observable Property.
4. An Observable Property is not automatically a Biomarker.
5. Biomarker validity is contextual.
6. A Measurement Definition is not a project decision or a realized value.
7. A Data Need belongs to a Research Project.
8. A Data Need does not create a Canonical Variable automatically.
9. A Canonical Variable is a project definition, not a Variable Occurrence.
10. One Canonical Variable identity is shared across projections.
11. A repeated timepoint does not create a second Canonical Variable identity.
12. A Variable Occurrence never changes its Canonical Variable.
13. Missing, not collected, not applicable, not evaluable, invalid and negative are distinct.
14. Routine care does not become study mandated silently.
15. A Biospecimen is not a Variable.
16. Biospecimen collection does not imply a selected analysis.
17. Analysis Specification, Analysis Execution, Analysis Result and Scientific Interpretation remain distinct.
18. A derived occurrence retains every source occurrence, method, version and quality lineage.
19. External standards map to NOXIA identities; they do not replace NOXIA reasoning.
20. A candidate mechanism is neither a Knowledge assertion nor a universal truth.
21. Unknowns and contradictions survive every boundary unless a valid source or Decision changes them.
22. Every canonical mutation is owned, versioned, justified and reconstructible.
23. A contribution never becomes adopted content without the required owner and human Decision.
24. A projection may change presentation, never semantic identity or engagement level.
25. A result is not an interpretation; an interpretation is not a Decision.
26. A source descriptor never transfers ownership of the external source to NOXIA.
27. A terminology mapping never upgrades partial equivalence to exact equivalence.
28. Every supersession preserves replay of the superseded identity and version.

Toute violation non explicitement assumée rend le sous-graphe concerné incohérent, incomplet ou non évaluable. Aucun score global ne peut compenser une violation critique.

---

## 14. Cas conceptuels normatifs

### A — Infarctus et angiographie à rayons X (XA)

- **Objets créés si justifiés :** un ScientificModel référencé sur l'infarctus ; les ObservableProperties pertinentes ; une MeasurementDefinition spécialisée XA ; un DataNeed Project ; après décision, une CanonicalVariable ; une VariableOccurrence seulement lorsqu'une valeur ou un statut réel existe.
- **Objets non créés automatiquement :** aucune MeasurementDefinition IRM, aucun BiomarkerRole, aucune Variable, aucune Occurrence et aucun protocole d'acquisition par la seule mention de XA.
- **Relations :** `REFERENCES_KNOWLEDGE`, `MODELS`, `OBSERVABLE_BY`, `MEASURED_BY`, puis, après décisions distinctes, `MOTIVATES_DATA_NEED`, `OPERATIONALIZES`, `COVERS_DATA_NEED` et `REALIZES`.
- **Owners :** Knowledge possède concepts et preuves ; Scientific Models possède la composition ; OBS/Imaging possèdent la définition de mesure ; ResearchProject possède besoin, choix et variable ; le système source produit l'occurrence.
- **Décisions nécessaires :** adoption du modèle, qualification éventuelle d'un BiomarkerRole, justification du DataNeed et sélection de l'opérationnalisation XA.
- **Provenance :** sources Knowledge, versions du modèle et de la méthode, mandat de production, contexte XA, source effective et lignage de chaque occurrence.
- **UNKNOWN conservés :** applicabilité au projet, performances dans le contexte, faisabilité locale, rôle biomarqueur, qualité et valeur observée tant qu'ils ne sont pas établis.

### B — Infarctus et IRM

- **Objets créés si justifiés :** le ScientificModel peut être le même qu'au cas A ; les ObservableProperties sont réutilisées lorsqu'elles gardent le même sens ; les MeasurementDefinitions IRM portent leurs identités et versions propres ; DataNeeds, CanonicalVariables et Occurrences suivent les décisions du Project.
- **Objets non créés automatiquement :** aucune duplication du ScientificModel ou de l'ObservableProperty sur le seul changement de modalité ; aucune XA, aucun BiomarkerRole et aucune valeur implicites.
- **Relations :** `REFERENCES_KNOWLEDGE`, `MODELS`, `OBSERVABLE_BY`, `MEASURED_BY`, `MOTIVATES_DATA_NEED`, `OPERATIONALIZES`, `EXPECTED_AT` et `REALIZES`.
- **Owners :** Knowledge et Scientific Models conservent les mêmes frontières ; OBS/Imaging possède la définition IRM ; le ResearchProject décide son usage ; Data Management conserve réalisation et lignage.
- **Décisions nécessaires :** vérifier si la propriété visée est réellement commune, choisir ou refuser la méthode IRM, définir la temporalité et décider les rôles scientifiques du projet.
- **Provenance :** version de la MeasurementDefinition, conditions et limites documentées, site/source, mandat de production et dérivations.
- **UNKNOWN conservés :** comparabilité avec XA, disponibilité, conditions techniques, reproductibilité locale et validité contextuelle.

### C — Comparaison XA / IRM

- **Objets créés si justifiés :** un DataNeed comparatif ; deux MeasurementDefinitions au minimum lorsque les principes diffèrent ; une ou plusieurs CanonicalVariables selon que le sens scientifique et la forme de résultat restent ou non identiques ; une AnalysisSpecification si la comparaison est adoptée.
- **Objets non créés automatiquement :** aucune équivalence de méthode, aucune fusion de Variables, aucun BiomarkerRole commun et aucun AnalysisResult avant exécution.
- **Relations :** chaque méthode `MEASURED_BY` sa propriété ; les variables `COVERS_DATA_NEED` et `OPERATIONALIZES` les définitions ; les entrées sont `CONSUMED_BY_ANALYSIS` ; l'exécution seule `PRODUCES_RESULT`.
- **Owners :** OBS/Imaging possède les définitions et comparabilité documentée ; ResearchProject possède le DataNeed et les Variables ; Biostatistics ou le domaine compétent possède l'analyse.
- **Décisions nécessaires :** définir la question de comparabilité, l'unité d'analyse, les conditions d'appariement, la tolérance temporelle et les règles d'interprétation.
- **Provenance :** méthode, version, source, site, temps réel, contrôles qualité, population d'analyse et lignage des résultats.
- **UNKNOWN conservés :** interchangeabilité, biais de mesure, valeurs manquantes, impact du délai et généralisation hors domaine validé.

### D — Échocardiographie de soin courant réutilisée

- **Objets créés si justifiés :** StudyDataSource subordonnée au Project ; référence à la MeasurementDefinition pertinente ; DataNeed et CanonicalVariable du projet ; VariableOccurrences importées avec statut `NOT_STUDY_MANDATED`.
- **Objets non créés automatiquement :** aucune nouvelle acquisition mandatée par l'étude, aucun transfert de propriété de la source, aucun BiomarkerRole et aucune validation de qualité par la seule disponibilité.
- **Relations :** la variable `COVERS_DATA_NEED`, les occurrences `REALIZES` la variable, sont `COLLECTED_FROM` la source de soin et `PRODUCED_BY` le processus historique qualifié.
- **Owners :** le système de soin conserve la production ; OBS/domaine conserve la définition de mesure ; ResearchProject décide la réutilisation ; Data Management conserve provenance, qualité et restrictions.
- **Décisions nécessaires :** admissibilité de la réutilisation, compatibilité de méthode/version, usage autorisé, temporalité et traitement des limitations.
- **Provenance :** mandat `ROUTINE_CARE`, contexte clinique d'origine, source, date, méthode, opérateur si disponible, contrôles et restrictions.
- **UNKNOWN conservés :** éléments d'acquisition absents, biais de sélection, exhaustivité, comparabilité et aptitude à l'usage scientifique.

### E — Troponine répétée T0 / H6 / H12 / H24

- **Objets créés :** une seule CanonicalVariable si la définition scientifique est stable ; quatre ExpectedVariableOccasions reliées à des TemporalAnchors ; zéro à quatre VariableOccurrences selon la réalisation.
- **Objets non créés :** aucune Variable distincte par temps, aucune valeur zéro ou normale à partir d'une absence, aucun AnalysisResult par répétition seule.
- **Relations :** la variable est `EXPECTED_AT` chaque occasion ; chaque occurrence `REALIZES` la même Variable et `FULFILLS_OCCASION` l'occasion correspondante ; une dérivation éventuelle est `DERIVED_FROM` des occurrences sources.
- **Owners :** ResearchProject possède variable et occasions ; le laboratoire possède la production technique ; Data Management conserve valeurs, statuts, unités, temps réels et corrections.
- **Décisions nécessaires :** identité stable ou nouvelle Variable si la définition change, fenêtres, unités, méthode admissible et politique de missingness.
- **Provenance :** mandat, source, prélèvement, méthode/version, temps attendu et réel, unité, contrôles et correction.
- **UNKNOWN conservés :** valeur non obtenue, raison d'absence non documentée, méthode inconnue ou temps réel incomplet ; une absence à H12 n'est ni zéro ni normal.

### F — ObservableProperty sans rôle biomarqueur

- **Objets créés si justifiés :** ObservableProperty et éventuellement MeasurementDefinition ; un DataNeed peut exister si le Project veut la caractériser.
- **Objets non créés :** aucun BiomarkerRole, aucune CanonicalVariable et aucune Occurrence sans preuve, usage, besoin et décisions supplémentaires.
- **Relations :** le phénomène peut être `OBSERVABLE_BY` la propriété et la propriété `MEASURED_BY` une méthode ; `HAS_BIOMARKER_ROLE` est intentionnellement absent.
- **Owners :** Knowledge/Scientific Models décrivent la cible ; OBS possède propriété et méthode ; ResearchProject ne possède que ses choix éventuels.
- **Décisions nécessaires :** aucune décision biomarqueur par défaut ; toute création future d'un rôle exige cible, usage, population, temps, méthode, preuves et limites.
- **Provenance :** sources établissant l'observabilité et la méthode, avec domaine de validité et contradictions.
- **UNKNOWN conservés :** valeur indicative, validité biomarqueur, utilité de projet et couverture d'un besoin.

### G — Une ObservableProperty avec deux BiomarkerRoles

- **Objets créés :** une ObservableProperty réutilisée ; deux BiomarkerRoles distincts dès que cible, usage, population, temps, MeasurementDefinition ou domaine diffère.
- **Objets non créés :** aucune seconde ObservableProperty si la propriété garde le même sens ; aucun rôle universel fusionné ; aucune Variable automatique.
- **Relations :** l'ObservableProperty `HAS_BIOMARKER_ROLE` chacun des deux rôles ; chaque rôle `INDICATES` sa cible et référence ses preuves, limites et alternatives.
- **Owners :** OBS/gouvernance scientifique possède la définition générale des rôles ; ResearchProject adopte, rejette ou maintient exploratoire chaque usage contextuel.
- **Décisions nécessaires :** identité distincte des rôles, statut de projet, confiance, méthode applicable et non-transfert des preuves entre contextes.
- **Provenance :** preuves et domaines de validité propres à chaque rôle, version de la propriété et des MeasurementDefinitions.
- **UNKNOWN conservés :** validité d'un rôle dans le contexte de l'autre, équivalence des méthodes et généralisabilité.

### H — Fécothèque sans analyse sélectionnée

- **Objets créés :** Biospecimens « selles », leurs aliquots/enfants si matérialisés, événements de collecte/traitement, stockage, qualité, custody, restrictions et provenance.
- **Objets non créés :** aucune CanonicalVariable de résultat, aucune VariableOccurrence de mesure, aucune AnalysisSpecification et aucun AnalysisResult tant qu'aucune analyse n'est adoptée.
- **Relations :** Biospecimens enfants `COLLECTED_FROM` ou dérivés de leur parent avec lignage matériel ; une future méthode pourra `USES_BIOSPECIMEN` seulement après décision.
- **Owners :** domaine Biospecimen/biobanque possède l'identité matérielle et le cycle ; ResearchProject possède l'usage prévu ; Data Management conserve les références et statuts autorisés.
- **Décisions nécessaires :** collecte/usage autorisés, restrictions, durée et qualité ; la sélection d'une analyse reste une décision ultérieure indépendante.
- **Provenance :** unité source, collecte, traitement, parenté, emplacement, custody et événements de disponibilité.
- **UNKNOWN conservés :** analyses futures, ObservableProperties, MeasurementDefinitions, variables et résultats ; la présence du matériel ne les préjuge pas.

### I — Variable CRF utilisée ensuite en Biostatistics

- **Objets créés :** une CanonicalVariable unique ; ses projections CRF et Data Dictionary ; ses VariableOccurrences ; une AnalysisSpecification qui référence la même identité ; AnalysisExecution et AnalysisResult seulement lors de la réalisation.
- **Objets non créés :** aucune nouvelle Variable pour la colonne d'analyse, le libellé SAP ou le format d'échange ; aucune copie sémantique dans le document.
- **Relations :** la Variable `COVERS_DATA_NEED`, ses occurrences la `REALIZES`, puis Variable et occurrences sont `CONSUMED_BY_ANALYSIS`; l'exécution `PRODUCES_RESULT`.
- **Owners :** ResearchProject possède la Variable ; Data Management possède représentation, collecte et qualité ; Biostatistics possède spécification/exécution/résultat ; DOC/TMP possèdent seulement les projections.
- **Décisions nécessaires :** définition canonique, population et usage analytique, gel/version des entrées et traitement des statuts.
- **Provenance :** même `variableId` et version de bout en bout, projections, source des occurrences, transformations, gel analytique et exécution.
- **UNKNOWN conservés :** valeurs non collectées, qualité non vérifiée, inclusion analytique et résultat avant exécution.

### J — Variable dérivée depuis plusieurs Variables sources

- **Objets créés si pré-spécifiés :** une CanonicalVariable dérivée distincte lorsque son sens est stable ; une VariableOccurrence dérivée par unité/occasion ; AnalysisResult à la place uniquement si la sortie complexe satisfait le critère d'autonomie.
- **Objets non créés :** aucune mutation des Variables sources, aucune dérivation sans méthode/version, aucune interprétation ou décision à partir du résultat seul.
- **Relations :** la Variable dérivée `COVERS_DATA_NEED`; l'occurrence dérivée `REALIZES` cette Variable, est `DERIVED_FROM` toutes les occurrences sources et `PRODUCED_BY` une exécution qualifiée.
- **Owners :** ResearchProject possède la définition ; Data Management possède transformations de données autorisées ; Biostatistics ou le domaine spécialisé possède la méthode analytique.
- **Décisions nécessaires :** identité distincte, méthode, inputs requis, temporalité, propagation du missingness, qualité et conditions de recalcul.
- **Provenance :** toutes les occurrences sources, versions de Variables, méthode, paramètres, environnement, auteur/système, date et corrections.
- **UNKNOWN conservés :** résultat si une source manque, validité hors conditions, impact d'une correction et interprétation scientifique.

### K — Étude sans Imaging

- **Objets créés :** ScientificModel, ObservableProperties, MeasurementDefinitions cliniques/biologiques, DataNeeds, CanonicalVariables, occasions et Occurrences selon le design adopté.
- **Objets non créés :** aucune Modalité d'imagerie, Acquisition, Séquence, Protocole d'imagerie ou contribution Imaging artificielle.
- **Relations :** la chaîne `MODELS` → `OBSERVABLE_BY` → `MEASURED_BY` → `MOTIVATES_DATA_NEED` → `COVERS_DATA_NEED` → `REALIZES` reste valide sans Imaging.
- **Owners :** Knowledge, Models, OBS, ResearchProject et domaines cliniques/biologiques exercent leurs responsabilités ; Imaging est `NOT_APPLICABLE`.
- **Décisions nécessaires :** méthodes non-imagerie applicables, DataNeeds, variables et analyses ; aucune décision Imaging n'est requise.
- **Provenance :** sources et méthodes des domaines réellement utilisés, avec mandat et lignage habituels.
- **UNKNOWN conservés :** toute information d'imagerie non demandée ; elle n'est ni manquante ni implicitement négative.

### L — Donnée absente, non évaluable ou invalide

- **Objets créés :** une VariableOccurrence ou trace d'attente portant le statut approprié, la raison connue, les contrôles et la provenance ; aucune valeur fictive.
- **Objets non créés :** aucun zéro, normal, négatif, résultat analytique ou conclusion substitué à `MISSING`, `NOT_COLLECTED`, `NOT_APPLICABLE`, `NOT_EVALUABLE` ou `INVALID`.
- **Relations :** l'occurrence/statut `REALIZES` la Variable et `FULFILLS_OCCASION` avec résultat de réalisation qualifié ; une invalidité peut référencer le contrôle ou processus `PRODUCED_BY`.
- **Owners :** le système source constate l'événement ; Data Management qualifie et conserve l'état sans inventer la raison ; ResearchProject décide les conséquences ; Biostatistics applique la règle pré-spécifiée.
- **Décisions nécessaires :** distinction entre absence et non-applicabilité, acceptabilité, nouvelle tentative, exclusion ou analyse de sensibilité ; correction humaine si le statut est erroné.
- **Provenance :** occasion attendue, tentative, source, contrôles, auteur/système, date, raison et historique de correction.
- **UNKNOWN conservés :** raison non documentée, valeur réelle, récupérabilité et impact ; l'inconnu reste inconnu jusqu'à preuve ou décision.

---

## 15. Compatibilité des autorités et état réellement implémenté

### 15.1 Compatibilité normative

- PD-004 reste autorité UX ; ses libellés V1 doivent être mappés lors d'une future révision, sans changement implicite aujourd'hui.
- PD-005 reste autorité des rôles IA ; ses familles anciennes doivent produire des Contributions V2, jamais muter directement les nouveaux objets.
- PD-009 reste autorité de la prochaine action ; ses états V1 se projettent sur les axes du §7.
- PD-011 reste seule autorité PASS/FAIL ; la présente admission ne constitue aucune évaluation.
- RDE-001/002 restent compatibles si ResearchProject est lu comme la spécialisation V2 du Dossier et si leurs chaînes V1 sont interprétées par le catalogue legacy.
- RDE-003 reste l'owner spécialisé Imaging mais sa chaîne Phénomène–Biomarqueur–Modalité doit migrer vers ObservableProperty, MeasurementDefinition et BiomarkerRole.
- KE-001 reste compatible : il fournit les unités Knowledge et ne possède ni modèle adopté ni Variable.

### 15.2 État implémenté constaté

Les implémentations ST-001, IMG-001/1B, PRJ-001, REG-001, DOC-002, TMP-001, DOC-001B et VAL-000 utilisent encore des contrats V1 ou des projections runtime propres. Certaines séparent déjà des responsabilités proches de V2, mais aucune n'implémente PD-003 V2 par la seule admission du présent document.

Tout consumer reste `V1_COMPATIBLE_LEGACY_READER` jusqu'à une migration, un mapping, des tests de non-régression et une décision séparés. OBS-001 et CDM-001 ne sont pas créés ici.

---

## 16. Conditions d'évolution

PD-003 V2 évolue lorsqu'une décision modifie :

- le sens, l'autonomie ou l'owner d'un objet canonique ;
- une relation structurante, un invariant ou un lifecycle ;
- la séparation Knowledge/Model/OBS/Project/Data/Analysis/Projection ;
- la politique d'identité, de version, de supersession ou de legacy ;
- la qualification d'un candidat comme objet, rôle, relation, value object ou sous-ressource ;
- la compatibilité constitutionnelle avec le Manifesto V2.

Il ne doit jamais évoluer pour :

- refléter un type technique, un stockage, une API, un écran ou un prompt ;
- rendre conforme une implémentation sans corriger celle-ci ;
- intégrer une source, une valeur ou un cas particulier ;
- déclarer une migration, un moteur ou une évaluation absents ;
- réduire une inconnue ou une contradiction par commodité.

---

## 17. Limitations de l'admission

1. L'owner institutionnel des ScientificModels réutilisables reste à nommer ; le présent modèle définit les responsabilités minimales sans créer de registre.
2. OBS-001 et CDM-001 restent des architectures futures ; leurs taxonomies détaillées ne sont pas préjugées.
3. StudyDataSource reste une sous-ressource jusqu'à démonstration d'autonomie.
4. AnalysisResult est admis sous critère d'autonomie ; les spécialisations Biostatistics devront préciser les résultats complexes.
5. La taxonomie Biospecimen reste spécialisée et future au-delà du contrat minimal.
6. Aucune implémentation actuelle n'est déclarée conforme V2 sans migration et évaluation.
7. Les documents normatifs consommateurs continuent de contenir des chaînes lexicales V1 ; le catalogue legacy et la matrice d'impact gouvernent leur lecture jusqu'à leur révision.
8. Aucun modèle de stockage, format d'échange, code produit, protocole ou recommandation n'est défini.

Ces limites n'empêchent pas l'admission du modèle conceptuel, mais interdisent de présenter l'écosystème comme migré ou implémenté.

---

## 18. Décision finale

PD-003 V2 est admis comme référence métier normative courante, avec conservation intégrale de PD-003 V1 pour l'historique et obligation de migration explicite par consumer.

`PD003_V2_RESEARCH_OBJECT_MODEL_ADMITTED_WITH_LIMITATIONS`
