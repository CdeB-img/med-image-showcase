# BIOSTATISTICS-001 — Analysis Architecture

| Champ | Valeur |
|---|---|
| Version | 1.0 |
| Statut | `OFFICIAL — REFERENCE_NORMATIVE_SPECIALIZED_CURRENT` avec limitations explicites |
| Niveau | `NIVEAU_1` |
| Date d'admission | 15 août 2026 |
| Source maîtresse | présent Markdown |
| Décision | `BIOSTATISTICS001_ANALYSIS_ARCHITECTURE_ADMITTED_WITH_LIMITATIONS` |

## 1. Finalité

BIOSTATISTICS-001 définit l'architecture conceptuelle et documentaire de la capacité Biostatistics de NOXIA. Il spécialise les objets analytiques déjà admis par PD-003 V2 et organise leur continuité depuis le Research Project, les définitions de mesure, les données canoniques et les releases Data Management jusqu'aux exécutions, résultats, diagnostics et projections documentaires.

Cette référence ne sélectionne aucune méthode pour une étude réelle, ne calcule rien et ne produit aucun résultat. Elle établit les responsabilités, les contrats, les refus, les états, la provenance et les handoffs qui devront précéder toute implémentation.

## 2. Autorités et plans de vérité

L'ordre applicable est : Charte fondatrice → Scientific Product Manifesto V2 → PD-003 V2 → OBS-001 → CDM-001 → DM-001 → BIOSTATISTICS-001. L'Editorial Engine externe gouverne la philosophie des projections génériques, jamais le contenu statistique. PD-011 gouverne toute future qualification, tout protocole d'évaluation et toute décision PASS/FAIL.

| Plan | Nature | Usage dans BIOSTATISTICS-001 |
|---|---|---|
| principes établis | Charte et manifeste V2 | science, contexte, incertitude, provenance, décision humaine |
| références normatives | PD-003 V2, OBS-001, CDM-001, DM-001 | objets, ownerships, mesure, données, opérations et releases |
| corpus documentaire | DOC-000A/B/B-R1/C/D, DOC-002 et modèles historiques | motifs candidats uniquement, jamais méthode imposée |
| cible | présente architecture | contrats conceptuels futurs de Biostatistics |
| état implémenté | code et tests réellement observés | aucune implémentation Biostatistics conforme n'est revendiquée |
| hypothèses | besoins encore à décider | signalés comme futurs, non admis ou soumis à mandat |

Une contradiction n'est jamais résolue par fréquence, ancienneté, commodité technique ou succès d'un document historique.

## 3. Frontières d'ownership

| Owner | Possède | Ne possède pas |
|---|---|---|
| Research Project | question, objectifs, hypothèses scientifiques, populations Project, interventions/expositions/comparateurs, endpoints, stratégie scientifique, décisions humaines, DataNeeds, CanonicalVariables et ExpectedVariableOccasions | modèle statistique exécuté, données réalisées, interprétation automatique |
| OBS et domaines | ObservableProperties, MeasurementDefinitions, validité de mesure, qualité scientifique, performance, incertitude, limites et comparabilité | estimand, population d'analyse, modèle statistique ou décision Project |
| CDM | identité CanonicalVariable, VariableOccurrences, valeurs et statuts, temps, sources et méthodes réelles, missingness factuel, provenance, transformations/derivations, lineage et conservation structurée des AnalysisResults | choix analytique ou interprétation |
| Data Management | collecte, ingestion, contrôles, findings, queries, corrections, réconciliation, transformations opérationnelles, snapshots, freezes, locks, releases et audit | estimand, imputation, modèle, sensibilité ou conclusion |
| Biostatistics | estimands, rôles analytiques, populations d'analyse, hypothèses et méthodes statistiques, stratégie analytique du missingness, règles d'événements intercurrents, multiplicité, sensibilités, analyses supplémentaires, dimensionnement, AnalysisSpecifications, AnalysisExecutions, diagnostics, AnalysisResults, incertitude et limites analytiques | sens de la mesure, occurrence source, décision Project, conclusion clinique |
| humain mandaté | adoption, approbation, amendement, interprétation scientifique et conclusion engageante | provenance inventée ou mutation rétroactive |

Un handoff transmet un contenu et une autorisation bornée ; il ne transfère jamais l'ownership.

## 4. Réutilisation stricte de PD-003 V2

BIOSTATISTICS-001 réutilise `AnalysisSpecification`, `AnalysisExecution`, `AnalysisResult`, `Dimensionnement`, `CanonicalVariable`, `VariableOccurrence`, `ResearchProject`, `ScientificModel`, `Objective`, `Hypothesis`, `Endpoint`, `InterpretationRule`, `Decision`, `Justification`, `Uncertainty`, `Limitation`, `Bias` et `Contradiction`.

| Construction complémentaire | Classification | Owner | Racine nouvelle ? |
|---|---|---|---|
| Estimand | `VALUE_OBJECT / SUBRESOURCE` d'AnalysisSpecification | Biostatistics, adopté sous mandat | non |
| AnalysisVariableRoleAssignment | `RELATION / SUBRESOURCE` | Biostatistics | non |
| AnalysisPopulationDefinition | `DEFINITION / SUBRESOURCE` | Biostatistics + décision applicable | non |
| MissingDataStrategy | `DEFINITION / SUBRESOURCE` | Biostatistics | non |
| IntercurrentEventStrategy | `DEFINITION / SUBRESOURCE` | Biostatistics avec Project/domaine | non |
| StatisticalMethodDefinition | `DEFINITION / SUBRESOURCE` | Biostatistics | non |
| ModelAssumptionSet | `VALUE_OBJECT / SUBRESOURCE` | Biostatistics | non |
| DiagnosticPlan | `DEFINITION / SUBRESOURCE` | Biostatistics | non |
| MultiplicityStrategy | `DEFINITION / SUBRESOURCE` | Biostatistics | non |
| SensitivityAnalysisDefinition | `DEFINITION / SUBRESOURCE` | Biostatistics | non |
| AnalysisDataset | `PROJECTION` spécialisée d'un DatasetRelease | Biostatistics consomme ; DM/CDM conservent les sources | non |
| AnalysisDeviation | `EXECUTION_RECORD / FINDING` | Biostatistics et owner de revue | non |
| StatisticalInterpretationEnvelope | `DECISION_ENVELOPE` | Biostatistics prépare ; humain adopte | non |

Toute nécessité d'une identité autonome, d'un cycle et de relations impossibles à porter ainsi produit `BIOSTATISTICS001_REQUIRES_PD003_ARBITRATION` avant création.

## 5. AnalysisSpecification

`AnalysisSpecification` est l'objet canonique versionné décrivant une analyse avant son exécution. Il porte au minimum : identité, version, statut, owner, finalité, question/objectifs/hypothèses Project référencés, type d'analyse, niveau de préspécification, estimand ou objet de calcul, population d'analyse, rôles de variables, inputs canoniques, DatasetRelease attendu, transformations analytiques, méthode/modèle, hypothèses du modèle, diagnostics, missingness, événements intercurrents, multiplicité, sensibilités, analyses supplémentaires, outputs attendus, incertitude, limites, décisions, justifications, provenance, dépendances et règles d'amendement.

Une spécification ne contient ni donnée réalisée, ni résultat, ni mutation de Project/CDM/DM, ni conclusion. Elle est immuable dès qu'une exécution ou projection gelée la référence ; toute correction crée une version successeure et une analyse d'impact.

## 6. Estimand

Un estimand est le contrat de la quantité ou de l'effet que l'analyse vise à estimer dans un contexte donné. Il est subordonné à une AnalysisSpecification et référence, selon applicabilité : population, variable/endpoint, conditions ou traitements, comparateur, résumé ou contraste, temporalité, événements intercurrents et stratégie associée, ainsi que ses unknowns et limites.

`Endpoint` décrit ce qui est retenu pour juger l'étude ; `CanonicalVariable` conserve l'identité d'une donnée unitaire ; `Estimand` définit la quantité scientifique ciblée ; `StatisticalMethodDefinition` définit comment l'estimer ; `AnalysisResult` conserve ce qui a été produit. Ces plans ne sont jamais fusionnés.

## 7. Rôles analytiques des variables

`AnalysisVariableRoleAssignment` relie une CanonicalVariable existante et sa version à une AnalysisSpecification, une population, un contexte temporel et un rôle analytique. Les rôles de travail peuvent inclure outcome, exposure, intervention indicator, comparator indicator, covariate, stratification factor, cluster, censoring, weighting, offset, auxiliary variable, analysis time, identifier de jointure ou variable de diagnostic. Cette liste est extensible et non une taxonomie scientifique.

Un nom de colonne, alias, codage de travail, contraste, transformation ou rôle ne crée jamais une CanonicalVariable. Une donnée scientifiquement différente exige une décision Project ; une sortie inférentielle relève d'AnalysisResult.

## 8. AnalysisPopulationDefinition

La population d'analyse est un sous-contrat versionné : population Project source, unité d'analyse, critères d'inclusion/exclusion analytiques, période, règles de disponibilité et qualité, statut des violations/déviations, règles de déduplication ou regroupement, références de décision, compte rendu des inclus/exclus et justification.

Elle ne modifie ni la population scientifique Project, ni les VariableOccurrences, ni le DatasetRelease. Plusieurs populations analytiques peuvent coexister et doivent rester nommées, justifiées et reliées à leurs analyses.

## 9. Missing data et événements intercurrents

CDM/DM conservent le fait : valeur absente, non collectée, non disponible, non applicable, non évaluable, invalide, perdue, retirée, source manquante, échec technique ou raison inconnue. Biostatistics conserve séparément la stratégie : inclusion/exclusion, modèle, traitement, imputation éventuelle, censure, pondération, hypothèses, analyses de sensibilité et impact sur l'estimand.

Une valeur imputée ou transformée est un artefact analytique avec parents, définition, version et contexte ; elle ne remplace jamais l'occurrence source.

Un événement intercurrent est un événement postérieur ou concomitant pertinent pour la définition/interprétation de l'estimand. Il reste distinct d'une donnée manquante, d'une déviation, d'une invalidité de mesure, d'un changement de méthode ou d'une décision. Sa stratégie est explicite, versionnée et liée à l'estimand ; aucun mot-clé ne la déduit automatiquement.

## 10. Méthodes, modèles, hypothèses et diagnostics

`StatisticalMethodDefinition` porte catégorie, finalité, inputs, outputs, hypothèses, paramètres, contraintes, diagnostics attendus, limites, références et version. Les catégories conceptuelles peuvent couvrir description, comparaison, estimation, modélisation, temps-événement, diagnostic, accord, reproductibilité, données longitudinales, clustering, données multivariées, causalité ou prédiction, sans sélectionner ni recommander une méthode pour une étude réelle.

`ModelAssumptionSet` distingue hypothèses scientifiques, données, mesure et modèle. `DiagnosticPlan` indique contrôles, sorties, critères d'évaluabilité et dispositions. Une hypothèse non satisfaite, un diagnostic défavorable ou une convergence défaillante reste visible ; aucun changement de modèle, de population ou d'analyse principale n'est silencieux.

## 11. Multiplicité et familles d'analyses

`MultiplicityStrategy` relie la famille de questions, endpoints, temps, populations, contrastes ou modèles concernés à une stratégie déclarée, ses hypothèses, limites et décision humaine. L'absence de stratégie requise est un finding ; aucun résultat ne la reconstruit a posteriori.

Les analyses sont qualifiées indépendamment comme `PRIMARY`, `SUPPORTIVE`, `SENSITIVITY`, `EXPLORATORY` ou `POST_HOC`. Une sensibilité teste une dépendance de l'analyse principale sans la remplacer. Une analyse post-hoc demeure post-hoc après succès. Une analyse exploratoire ne devient pas confirmatoire par sa seule significativité.

## 12. Dimensionnement

BIOSTATISTICS-001 réutilise l'objet PD-003 `Dimensionnement`; il ne crée pas `SampleSize`. Le Dimensionnement référence question, objectif, hypothèses de dimensionnement, estimand, design, population, paramètres supposés, incertitudes, pertes/non-évaluabilité anticipées, sources de chaque hypothèse, scénarios, contraintes, méthode de calcul future, version, justification et décision humaine.

Les sources des hypothèses sont qualifiées : données internes versionnées, littérature/corpus référencé, estimation externe, pilote, expertise humaine déclarée, contrainte opérationnelle ou `UNKNOWN`. Plusieurs scénarios restent concurrents tant qu'aucune décision ne les adopte. Aucun nombre d'effectif n'est inventé ou calculé ici.

## 13. Randomisation, insu et analyses intermédiaires

La stratégie scientifique de randomisation et d'insu appartient au Project avec les owners opérationnels applicables. Biostatistics peut définir séquence, facteurs, blocs/strates conceptuels, restrictions, analyses liées et règles de préservation de l'insu ; DM/Clinical Operations exécutent et tracent sous leur contrat futur. BIOSTATISTICS-001 ne randomise aucun participant et ne crée aucun système.

Une analyse intermédiaire exige finalité, calendrier ou déclencheur, périmètre de données, population, accès, règle de décision, contrôle de multiplicité, owner, comité/mandat éventuel, confidentialité, conséquences et audit. Aucun seuil ou mécanisme réel n'est fixé ici.

## 14. Analysis Dataset

Un Analysis Dataset est une `PROJECTION` bornée d'un `DatasetRelease` DM identifié. Il référence release/version/digest, AnalysisSpecification/version, population, variables/occurrences, sélections, transformations, exclusions, temps, qualité, missingness factuel, restrictions, provenance, lineage et limites. Il ne constitue jamais une seconde vérité.

Sont distingués : dérivation unitaire réutilisable, transformation analytique spécifique, model matrix, agrégat et AnalysisResult. Une transformation analytique conserve chaque parent et sa version ; une correction de source produit une nouvelle release et, si nécessaire, une nouvelle AnalysisExecution.

## 15. AnalysisExecution

`AnalysisExecution` est la sous-ressource PD-003 versionnée qui réalise exactement une AnalysisSpecification gelée sur des inputs gelés. Elle enregistre : identity/version/status ; specification et amendment refs ; DatasetRelease et AnalysisDataset refs ; population ; transformations ; code/procédure ; logiciel, bibliothèques et environnement ; paramètres ; seed si applicable ; acteur/runtime ; date ; inputs/outputs et digests ; logs ; warnings ; errors ; diagnostics ; deviations ; quality checks ; provenance ; lineage ; supersession et disposition.

Le brut et les traces sont conservés avant toute validation aval. Une exécution échouée reste une exécution avec erreur ; elle ne devient ni résultat nul, ni résultat négatif, ni AnalysisResult acceptable.

## 16. AnalysisResult et interprétation

`AnalysisResult` suit le critère d'autonomie PD-003 : structure, diagnostics, incertitude ou cycle propres impossibles à porter fidèlement par une VariableOccurrence dérivée. Il référence spécification, exécution, inputs, population, estimand/objet de calcul, valeurs ou structures, incertitude, diagnostics, qualité, limites, version, provenance, statut et décisions de revue.

Un scalaire unitaire préspécifié et réutilisable reste une VariableOccurrence dérivée. Le résultat statistique, l'interprétation statistique bornée, l'interprétation scientifique et la conclusion clinique sont quatre plans distincts. Biostatistics peut décrire ce que le modèle estime sous ses hypothèses ; seul l'humain mandaté adopte une interprétation scientifique ou une conclusion engageante. Association, prédiction et causalité ne sont jamais promues l'une vers l'autre.

## 17. États de résultat et d'échec

| État | Sens | Interdiction |
|---|---|---|
| null/absence de champ | représentation incomplète | ne pas interpréter comme valeur |
| résultat négatif ou nul | résultat scientifique/statistique réel | ne pas confondre avec échec |
| `NOT_EVALUABLE` | conditions d'évaluation non satisfaites | ne pas inventer une estimation |
| `INVALID` | entrée ou résultat déclaré invalide sous règle référencée | ne pas supprimer l'historique |
| `EXECUTION_FAILED` | procédure non aboutie | ne pas publier un résultat nul |
| `RESULT_AVAILABLE_WITH_LIMITATIONS` | résultat produit avec limites visibles | ne pas masquer diagnostics/limitations |
| `REVIEW_REQUIRED` | résultat disponible mais décision humaine ouverte | ne pas promouvoir en conclusion |

## 18. Reproductibilité

Une analyse reconstructible conserve l'exacte AnalysisSpecification/version, DatasetRelease/version/digest, population, transformations, code/procédure, environnement, logiciels et bibliothèques, paramètres, seed lorsque pertinent, logs, décisions, deviations, diagnostics et résultats. `Repeatability`, `Reproducibility`, `Robustness` et `Sensitivity` restent distinctes : même environnement ; environnement indépendant ; résistance aux perturbations ; dépendance à une hypothèse/choix.

L'absence d'un élément critique interdit une revendication correspondante mais n'efface pas les preuves disponibles.

## 19. Handoffs

| Handoff | Contenu minimal | Interdiction |
|---|---|---|
| Project → Biostatistics | question, objectifs, hypothèses, populations, interventions/expositions/comparateurs, endpoints, stratégie, décisions, unknowns, versions | réécrire le Project |
| OBS/domaines → Biostatistics | propriétés, MeasurementDefinitions, performances, qualité, comparabilité, limites, sources et versions | redéfinir la mesure |
| CDM → Biostatistics | CanonicalVariables, occurrences, sources/méthodes/temps réels, unités, qualité, missingness, lineage, versions | réduire à une matrice sans contexte |
| DM → Biostatistics | DatasetRelease, snapshot, findings/queries ouverts, corrections, transformations, restrictions, audit, limites | traiter release comme vérité ou approbation statistique |
| Biostatistics → CDM/DM | specifications/executions/results, inputs/outputs, transformations analytiques, provenance, lineage, impact de reanalyse | écraser occurrences/releases |
| Biostatistics → TMP/DOC | contributions versionnées pour SAP, méthodes, tables/listings/figures, rapports et limites | document comme source du sens |
| Biostatistics → VAL | checkpoints, invariants, artifacts, versions, findings et décisions | PASS implicite |
| Biostatistics → futur QRY | unknowns, ambiguïtés et décisions nécessaires | choisir automatiquement la prochaine question produit |

## 20. Projections documentaires

Le SAP, les Statistical Methods, le catalogue d'AnalysisSpecifications, les shells Tables/Listings/Figures, l'Analysis Data Specification, le Statistical Report, les Results Tables, Model Diagnostics, Deviation Report et Sensitivity Report sont des projections. Ils référencent les mêmes objets et versions ; ils ne recréent ni variables, ni populations Project, ni méthodes, ni résultats.

DOC/TMP sélectionnent, ordonnent et rendent. DOC-002 peut fournir des patterns documentaires, jamais choisir une méthode. Une modification de projection produit une Contribution ou une demande de changement à l'owner ; elle n'écrit pas directement dans le Project ou l'analyse.

## 21. Apports du corpus documentaire

| Motif observé | Classification | Usage autorisé | Limite |
|---|---|---|---|
| articulation Protocol/SAP/CRF/Data Dictionary/Report | `OPERATIONAL_PATTERN` | exiger références d'identité et version communes | aucun document ne devient source du sens |
| plans, populations, méthodes, outputs et signatures historiques | `METHODOLOGICAL_PRACTICE` | définir des champs de contrat et revues | fréquence et label « final » ne prouvent aucune règle |
| qualité, anomalies, version, audit et release | `QUALITY_PATTERN` | tracer contrôles, deviations et dispositions | aucune validation de système ou conformité actuelle |
| Core Lab, multicentre, lecteurs et hétérogénéité | `LOCAL_PRACTICE` ou `HISTORICAL_REFERENCE` | tester ownership, clustering, mesure et provenance | aucune pratique locale n'est généralisée |
| guide ou standard cité historiquement | `REGULATORY_REQUIREMENT_CANDIDATE` ou `EXTERNAL_REFERENCE` | créer un besoin de vérification REG | aucune obligation actuelle sans résolution REG-001 |
| structure insuffisamment extraite | `UNKNOWN` | conserver le gap | ne pas compléter par invention |

Un ancien SAP reste une référence historique. Une méthode répétée n'est pas recommandée. Une signature prévue ne prouve pas l'approbation. Aucun contenu sensible ou valeur individuelle n'est extrait.

## 22. Vingt cas abstraits de couverture

Chaque cas est conceptuel : aucune donnée patient, méthode imposée, valeur, calcul, résultat ou recommandation n'est produit.

### Case A — outcome continu, deux groupes

- **Contrats analytiques communs :** rôles, population, modèle, missingness, multiplicité, sensibilité et Dimensionnement sont explicitement renseignés, `NOT_APPLICABLE`, `UNKNOWN` ou `DECISION_PENDING` ; aucun champ n'est déduit.

- **Question/Objectif/Project :** comparer un outcome continu entre deux groupes ; Objective, Hypothesis, populations Project, groupes/comparateur et Endpoint restent Project.
- **OBS/CDM/Release :** ObservableProperty et MeasurementDefinition restent domaine ; même CanonicalVariable et occurrences, projetées depuis un DatasetRelease versionné.
- **Analyse :** estimand de contraste, outcome et group indicator comme rôles, population définie, modèle candidat non sélectionné, missingness/multiplicité/sensibilité/dimensionnement explicites ou `UNKNOWN`.
- **Execution/Result/Provenance :** aucun avant spécification gelée ; toute exécution référence release et versions ; résultat autonome seulement selon PD-003.
- **Owner/Human/Forbidden/Projections/Limitations :** Biostatistics prépare, humain adopte ; aucune nouvelle Variable, conclusion ou causalité ; SAP/report sont projections ; hypothèses restent ouvertes.

### Case B — même variable à plusieurs visites

- **Contrats analytiques communs :** rôles, population, modèle, missingness, multiplicité, sensibilité et Dimensionnement sont explicitement renseignés, `NOT_APPLICABLE`, `UNKNOWN` ou `DECISION_PENDING` ; aucun champ n'est déduit.

- **Question/Objectif/Project :** étudier une évolution temporelle ; visites, TemporalAnchors, Objective et Endpoint sont référencés.
- **OBS/CDM/Release :** une CanonicalVariable, plusieurs ExpectedVariableOccasions/VariableOccurrences et temps réels ; release versionnée.
- **Analyse :** estimand longitudinal, rôles outcome/time/group, population, modèle longitudinal candidat, missingness par occasion, multiplicité temporelle, sensibilités et dimensionnement documentés.
- **Execution/Result/Provenance :** model matrix distincte des occurrences ; exécution et résultats conservent temps, méthode réelle et lineage.
- **Owner/Human/Forbidden/Projections/Limitations :** aucune Variable par visite ni imputation source ; adoption humaine ; projections versionnées ; comparabilité temporelle peut rester limitée.

### Case C — endpoint binaire

- **Contrats analytiques communs :** rôles, population, modèle, missingness, multiplicité, sensibilité et Dimensionnement sont explicitement renseignés, `NOT_APPLICABLE`, `UNKNOWN` ou `DECISION_PENDING` ; aucun champ n'est déduit.

- **Question/Objectif/Project :** comparer ou estimer un endpoint binaire défini par Project.
- **OBS/CDM/Release :** mesure/composition de l'endpoint référencée ; CanonicalVariable et occurrences gardent valeur/statut et provenance.
- **Analyse :** estimand, rôle outcome binaire, population, modèle candidat, missingness, multiplicité, sensitivités et Dimensionnement restent déclaratifs.
- **Execution/Result/Provenance :** aucune exécution sans release ; incertitude et diagnostics accompagnent le résultat.
- **Owner/Human/Forbidden/Projections/Limitations :** seuil de définition non inventé ; conclusion humaine ; SAP/table/report ne possèdent pas l'endpoint.

### Case D — temps jusqu'à événement

- **Contrats analytiques communs :** rôles, population, modèle, missingness, multiplicité, sensibilité et Dimensionnement sont explicitement renseignés, `NOT_APPLICABLE`, `UNKNOWN` ou `DECISION_PENDING` ; aucun champ n'est déduit.

- **Question/Objectif/Project :** étudier un délai jusqu'à un événement Project défini.
- **OBS/CDM/Release :** événement, origine temporelle, temps observés et statuts réels restent CDM/DM avec sources.
- **Analyse :** estimand temps-événement, rôles event/time/censoring, population, méthode candidate, règles de censure/intercurrent events, multiplicité, sensibilité et dimensionnement.
- **Execution/Result/Provenance :** exécution conserve origine, règles et diagnostics ; résultat distingue non-événement, censure et absence.
- **Owner/Human/Forbidden/Projections/Limitations :** aucune censure déduite d'un null ; décisions humaines ; projections traçables ; limites de suivi visibles.

### Case E — exactitude diagnostique

- **Contrats analytiques communs :** rôles, population, modèle, missingness, multiplicité, sensibilité et Dimensionnement sont explicitement renseignés, `NOT_APPLICABLE`, `UNKNOWN` ou `DECISION_PENDING` ; aucun champ n'est déduit.

- **Question/Objectif/Project :** évaluer un dispositif de classification/mesure contre une référence adoptée.
- **OBS/CDM/Release :** index test et référence ont MeasurementDefinitions, méthodes, temps, qualités et occurrences distinctes.
- **Analyse :** estimand(s) d'exactitude, rôles test/reference/status, population, modèle candidat, données indéterminées, multiplicité, sensibilités et dimensionnement.
- **Execution/Result/Provenance :** pairing et exclusions sont tracés ; résultats avec incertitude et non-évaluables.
- **Owner/Human/Forbidden/Projections/Limitations :** Biostatistics ne déclare pas la référence vraie ; humain adopte ; aucun seuil/claim clinique automatique.

### Case F — accord entre méthodes

- **Contrats analytiques communs :** rôles, population, modèle, missingness, multiplicité, sensibilité et Dimensionnement sont explicitement renseignés, `NOT_APPLICABLE`, `UNKNOWN` ou `DECISION_PENDING` ; aucun champ n'est déduit.

- **Question/Objectif/Project :** évaluer l'accord de deux méthodes sans présumer leur interchangeabilité.
- **OBS/CDM/Release :** deux MeasurementDefinitions et sources réelles ; CanonicalVariable unique seulement si le sens Project reste le même.
- **Analyse :** objet d'accord, rôles method/pair/value, population, méthode candidate, missing pairs, sensibilités, multiplicité et dimensionnement.
- **Execution/Result/Provenance :** paires, versions méthode, centre et temps sont figés ; diagnostics conservés.
- **Owner/Human/Forbidden/Projections/Limitations :** accord ≠ validité ≠ interchangeabilité ; aucune fusion de méthodes ou occurrences ; interprétation humaine.

### Case G — reproductibilité inter-/intra-reader

- **Contrats analytiques communs :** rôles, population, modèle, missingness, multiplicité, sensibilité et Dimensionnement sont explicitement renseignés, `NOT_APPLICABLE`, `UNKNOWN` ou `DECISION_PENDING` ; aucun champ n'est déduit.

- **Question/Objectif/Project :** quantifier la reproductibilité de lectures selon design Project.
- **OBS/CDM/Release :** lecteurs, répétitions, MeasurementDefinition, ordre/insu réels et occurrences distinctes.
- **Analyse :** estimand de reproductibilité, rôles reader/repetition/unit/value, populations de lecteurs/unités, méthode candidate, missing readings, sensibilités et dimensionnement.
- **Execution/Result/Provenance :** chaque lecture et exécution garde reader/time/version ; résultat conserve diagnostics.
- **Owner/Human/Forbidden/Projections/Limitations :** reproductibilité ≠ exactitude ; aucun lecteur/score inventé ; revue humaine et limitations du plan.

### Case H — biomarqueur d'imagerie dérivé d'une segmentation

- **Contrats analytiques communs :** rôles, population, modèle, missingness, multiplicité, sensibilité et Dimensionnement sont explicitement renseignés, `NOT_APPLICABLE`, `UNKNOWN` ou `DECISION_PENDING` ; aucun champ n'est déduit.

- **Question/Objectif/Project :** analyser une mesure dérivée d'une segmentation adoptée comme variable/endpoint.
- **OBS/CDM/Release :** Imaging possède méthode/segmentation/QC ; CDM conserve parents, CanonicalVariable/occurrences et lineage ; DM release.
- **Analyse :** estimand, outcome et covariates, population, modèle candidat, qualité/non-évaluabilité, sensitivités de segmentation et dimensionnement.
- **Execution/Result/Provenance :** dérivation unitaire réutilisable précède l'analyse ; exécution statistique et résultat restent distincts.
- **Owner/Human/Forbidden/Projections/Limitations :** Biostatistics ne redéfinit ni segmentation ni mesure ; aucune promotion automatique en biomarqueur/endpoint ; décision humaine.

### Case I — attendu mais non collecté

- **Contrats analytiques communs :** rôles, population, modèle, missingness, multiplicité, sensibilité et Dimensionnement sont explicitement renseignés, `NOT_APPLICABLE`, `UNKNOWN` ou `DECISION_PENDING` ; aucun champ n'est déduit.

- **Question/Objectif/Project :** analyser une Variable attendue dont une occasion n'a pas été collectée.
- **OBS/CDM/Release :** ExpectedVariableOccasion et `NOT_COLLECTED` sont conservés ; release n'invente aucune occurrence.
- **Analyse :** rôle prévu, population et missing-data strategy explicites ; modèle/estimand peuvent devenir non évaluables ; sensibilité et dimensionnement qualifiés.
- **Execution/Result/Provenance :** aucune valeur imputée comme source ; exécution peut refuser ou produire un artefact analytique séparé.
- **Owner/Human/Forbidden/Projections/Limitations :** factual missingness CDM/DM, stratégie Biostatistics, décision humaine ; aucune correction fictive ; projections exposent le gap.

### Case J — collecté mais invalide

- **Contrats analytiques communs :** rôles, population, modèle, missingness, multiplicité, sensibilité et Dimensionnement sont explicitement renseignés, `NOT_APPLICABLE`, `UNKNOWN` ou `DECISION_PENDING` ; aucun champ n'est déduit.

- **Question/Objectif/Project :** analyser une Variable avec occurrence collectée déclarée invalide.
- **OBS/CDM/Release :** valeur source, statut `INVALID`, règle/owner de qualité et méthode restent conservés dans la release.
- **Analyse :** règle d'usage/exclusion, population, modèle, missing-data strategy, sensitivités et Dimensionnement sont explicites.
- **Execution/Result/Provenance :** l'occurrence n'est jamais supprimée ; tout artefact analytique référence son statut et sa disposition.
- **Owner/Human/Forbidden/Projections/Limitations :** Biostatistics ne répare pas la mesure ; aucune invalidité transformée en absence ou zéro ; revue humaine.

### Case K — non applicable

- **Contrats analytiques communs :** rôles, population, modèle, missingness, multiplicité, sensibilité et Dimensionnement sont explicitement renseignés, `NOT_APPLICABLE`, `UNKNOWN` ou `DECISION_PENDING` ; aucun champ n'est déduit.

- **Question/Objectif/Project :** une mesure planifiée ne s'applique pas à une unité/occasion qualifiée.
- **OBS/CDM/Release :** `NOT_APPLICABLE` et justification restent distincts de missing/negative.
- **Analyse :** population, rôle et dénominateur applicable, modèle, multiplicité, sensibilités et dimensionnement explicitent la non-applicabilité.
- **Execution/Result/Provenance :** aucune pseudo-valeur ; la disposition est traçable jusqu'au résultat.
- **Owner/Human/Forbidden/Projections/Limitations :** applicability owner identifié et décision humaine conservée ; aucune exclusion silencieuse ; documents affichent la règle et les limites.

### Case L — seconde mesure absente, delta longitudinal impossible

- **Contrats analytiques communs :** rôles, population, modèle, missingness, multiplicité, sensibilité et Dimensionnement sont explicitement renseignés, `NOT_APPLICABLE`, `UNKNOWN` ou `DECISION_PENDING` ; aucun champ n'est déduit.

- **Question/Objectif/Project :** estimer un changement longitudinal tout en permettant une analyse baseline distincte si adoptée.
- **OBS/CDM/Release :** même Variable, baseline présente et seconde occurrence manquante ; release factuelle.
- **Analyse :** estimand longitudinal non évaluable pour certaines unités ; analyse baseline seulement comme AnalysisSpecification distincte ; populations, rôles, missingness, multiplicité, sensibilités et dimensionnement séparés.
- **Execution/Result/Provenance :** aucune fabrication de delta ; executions/results séparés et reliés aux mêmes sources.
- **Owner/Human/Forbidden/Projections/Limitations :** sensibilité ne remplace pas l'analyse principale ; adoption humaine ; projections distinguent les analyses.

### Case M — populations principale et de sensibilité distinctes

- **Contrats analytiques communs :** rôles, population, modèle, missingness, multiplicité, sensibilité et Dimensionnement sont explicitement renseignés, `NOT_APPLICABLE`, `UNKNOWN` ou `DECISION_PENDING` ; aucun champ n'est déduit.

- **Question/Objectif/Project :** examiner la robustesse d'une analyse selon deux définitions analytiques.
- **OBS/CDM/Release :** mêmes définitions de mesure et release, avec statuts/qualités visibles.
- **Analyse :** estimand commun ou différences explicites, population primaire et population de sensibilité versionnées, rôles/modèle/missingness/multiplicité/dimensionnement.
- **Execution/Result/Provenance :** deux executions/results identifiés ; aucun écrasement de la primaire.
- **Owner/Human/Forbidden/Projections/Limitations :** populations n'altèrent pas Project/CDM ; humain juge la robustesse ; report juxtapose sans fusion.

### Case N — covariable d'ajustement préspécifiée

- **Contrats analytiques communs :** rôles, population, modèle, missingness, multiplicité, sensibilité et Dimensionnement sont explicitement renseignés, `NOT_APPLICABLE`, `UNKNOWN` ou `DECISION_PENDING` ; aucun champ n'est déduit.

- **Question/Objectif/Project :** estimer un effet avec ajustement déclaré avant exécution.
- **OBS/CDM/Release :** outcome et covariable sont CanonicalVariables distinctes avec méthodes, temps, qualité et occurrences.
- **Analyse :** estimand, rôles outcome/group/covariate, population, modèle et hypothèses, missingness de covariable, multiplicité, sensitivity et dimensionnement.
- **Execution/Result/Provenance :** specification/version prouve la préspécification ; diagnostics et résultats ajustés/non ajustés restent qualifiés.
- **Owner/Human/Forbidden/Projections/Limitations :** aucune covariable inventée après résultat ; association ≠ causalité ; décision humaine.

### Case O — plusieurs endpoints et multiplicité

- **Contrats analytiques communs :** rôles, population, modèle, missingness, multiplicité, sensibilité et Dimensionnement sont explicitement renseignés, `NOT_APPLICABLE`, `UNKNOWN` ou `DECISION_PENDING` ; aucun champ n'est déduit.

- **Question/Objectif/Project :** analyser plusieurs endpoints/objectifs Project.
- **OBS/CDM/Release :** chaque endpoint référence ses Variables/MeasurementDefinitions et occurrences.
- **Analyse :** estimands, rôles, populations, modèles, missingness, MultiplicityStrategy, sensitivités et Dimensionnement cohérents mais distincts.
- **Execution/Result/Provenance :** famille, ordre et spécifications gelés ; tous résultats et diagnostics restent visibles.
- **Owner/Human/Forbidden/Projections/Limitations :** aucune sélection du meilleur résultat ; multiplicité non reconstruite post hoc ; humain adopte l'interprétation.

### Case P — sensibilité au missingness

- **Contrats analytiques communs :** rôles, population, modèle, missingness, multiplicité, sensibilité et Dimensionnement sont explicitement renseignés, `NOT_APPLICABLE`, `UNKNOWN` ou `DECISION_PENDING` ; aucun champ n'est déduit.

- **Question/Objectif/Project :** tester la dépendance du résultat à des hypothèses analytiques du missingness.
- **OBS/CDM/Release :** missingness factuel et raisons inchangés ; même release ou successor explicitement référencé.
- **Analyse :** estimand, rôles, population primaire, stratégie principale et sensibilités concurrentes, modèle, multiplicité et dimensionnement.
- **Execution/Result/Provenance :** executions séparées avec hypothèses/paramètres ; comparaison tracée.
- **Owner/Human/Forbidden/Projections/Limitations :** aucune imputation ne remplace source ; sensibilité ne devient pas primaire ; conclusion humaine.

### Case Q — multicentre, clustering et hétérogénéité de mesure

- **Contrats analytiques communs :** rôles, population, modèle, missingness, multiplicité, sensibilité et Dimensionnement sont explicitement renseignés, `NOT_APPLICABLE`, `UNKNOWN` ou `DECISION_PENDING` ; aucun champ n'est déduit.

- **Question/Objectif/Project :** analyser une étude multicentrique avec dépendance et méthodes réelles hétérogènes.
- **OBS/CDM/Release :** centre, appareil/laboratoire, méthode/version, qualité et comparabilité restent par occurrence.
- **Analyse :** estimand, rôles outcome/group/cluster/method, population, modèle candidat, missingness, multiplicité, sensitivités et dimensionnement multicentre.
- **Execution/Result/Provenance :** clustering et qualifications OBS sont inputs explicites ; diagnostics par contexte sans fusion silencieuse.
- **Owner/Human/Forbidden/Projections/Limitations :** modèle ne déclare pas les méthodes comparables ; aucune harmonisation implicite ; décision humaine.

### Case R — dimensionnement avec hypothèses incertaines

- **Contrats analytiques communs :** rôles, population, modèle, missingness, multiplicité, sensibilité et Dimensionnement sont explicitement renseignés, `NOT_APPLICABLE`, `UNKNOWN` ou `DECISION_PENDING` ; aucun champ n'est déduit.

- **Question/Objectif/Project :** préparer un dimensionnement lorsque plusieurs hypothèses restent plausibles.
- **OBS/CDM/Release :** données ou performances de mesure éventuelles sont référencées avec versions/limites ; aucune release réelle requise pour l'architecture.
- **Analyse :** estimand, rôles, population, modèle candidat, missingness, multiplicité, sensitivités et objet Dimensionnement avec plusieurs scénarios sourcés/unknowns.
- **Execution/Result/Provenance :** aucun calcul ni AnalysisResult ; toute future exécution de dimensionnement aura identité et provenance.
- **Owner/Human/Forbidden/Projections/Limitations :** aucun effectif inventé ; hypothèses adoptées par humain ; SAP/protocol projettent seulement la décision.

### Case S — signal post-hoc

- **Contrats analytiques communs :** rôles, population, modèle, missingness, multiplicité, sensibilité et Dimensionnement sont explicitement renseignés, `NOT_APPLICABLE`, `UNKNOWN` ou `DECISION_PENDING` ; aucun champ n'est déduit.

- **Question/Objectif/Project :** examiner un signal découvert après une analyse préspécifiée.
- **OBS/CDM/Release :** mêmes objets de mesure et release ou nouvelle release explicitement versionnée.
- **Analyse :** nouvelle AnalysisSpecification `POST_HOC`, estimand exploratoire, rôles/population/modèle/missingness/multiplicité/sensitivités/dimensionnement explicitement qualifiés.
- **Execution/Result/Provenance :** exécution postérieure, dépendance aux résultats observés et provenance visibles.
- **Owner/Human/Forbidden/Projections/Limitations :** aucune promotion en primaire/confirmatoire ; humain décide suite ; rapport conserve temporalité et limites.

### Case T — résultat nécessitant interprétation humaine

- **Contrats analytiques communs :** rôles, population, modèle, missingness, multiplicité, sensibilité et Dimensionnement sont explicitement renseignés, `NOT_APPLICABLE`, `UNKNOWN` ou `DECISION_PENDING` ; aucun champ n'est déduit.

- **Question/Objectif/Project :** relier un AnalysisResult à la question sans automatiser la conclusion.
- **OBS/CDM/Release :** mesure, occurrences, release et quality context restent référencés.
- **Analyse :** estimand, rôles, population, modèle, missingness, multiplicité, sensitivités, Dimensionnement et execution sont figés et traçables.
- **Execution/Result/Provenance :** résultat avec incertitude, diagnostics et limites ; StatisticalInterpretationEnvelope séparée.
- **Owner/Human/Forbidden/Projections/Limitations :** humain mandaté adopte interprétation/conclusion ; significativité ≠ pertinence clinique, association ≠ causalité ; report reste projection.

## 23. Contrats de non-régression

| ID | Invariant opposable |
|---|---|
| BIO-C01 | Biostatistics ne crée aucune nouvelle CanonicalVariable. |
| BIO-C02 | Un nom de colonne analytique n'est jamais une identité. |
| BIO-C03 | Le SAP ne crée aucun dictionnaire scientifique parallèle. |
| BIO-C04 | Une même identité de Variable est conservée dans CRF, CDM, dataset, SAP et résultats. |
| BIO-C05 | Une population d'analyse ne modifie pas une population Project. |
| BIO-C06 | Une exclusion analytique ne supprime aucune occurrence source. |
| BIO-C07 | Le missingness factuel reste distinct de sa stratégie analytique. |
| BIO-C08 | Une imputation ne remplace jamais une occurrence source. |
| BIO-C09 | Un événement intercurrent reste distinct du missingness. |
| BIO-C10 | Estimand et Endpoint sont distincts. |
| BIO-C11 | Estimand et modèle sont distincts. |
| BIO-C12 | Un modèle ne redéfinit aucune MeasurementDefinition. |
| BIO-C13 | Toute transformation analytique conserve ses parents de lignage. |
| BIO-C14 | Un Analysis Dataset est une projection d'un DatasetRelease. |
| BIO-C15 | Toute AnalysisExecution référence les versions exactes de sa spécification et de ses données. |
| BIO-C16 | Toute déviation analytique reste visible. |
| BIO-C17 | Une exécution échouée n'est jamais un résultat nul. |
| BIO-C18 | Une analyse post-hoc reste post-hoc. |
| BIO-C19 | Une analyse exploratoire ne devient pas confirmatoire par son résultat. |
| BIO-C20 | La multiplicité applicable est explicite. |
| BIO-C21 | Une sensibilité ne remplace pas silencieusement l'analyse principale. |
| BIO-C22 | Toute hypothèse de dimensionnement possède une source ou un owner humain explicite. |
| BIO-C23 | Aucun effectif n'est inventé. |
| BIO-C24 | Un résultat statistique ne devient pas automatiquement une interprétation scientifique. |
| BIO-C25 | Une association ne devient jamais automatiquement une causalité. |
| BIO-C26 | Une pratique locale reste locale. |
| BIO-C27 | Un mapping externe ne remplace jamais l'identité NOXIA. |
| BIO-C28 | Toute ancienne release et tout ancien résultat restent reconstructibles après réanalyse. |

## 24. Failure taxonomy

| Failure class | Premier owner de diagnostic | Disposition |
|---|---|---|
| `VARIABLE_IDENTITY_RECREATED_IN_SAP` | DOC/Biostatistics/CDM | refuser projection et restaurer la référence canonique par décision |
| `ANALYSIS_COLUMN_PROMOTED_TO_CANONICAL_VARIABLE` | Biostatistics/CDM/Project | refuser la promotion ; arbitrer le sens |
| `ENDPOINT_ESTIMAND_COLLAPSE` | Project/Biostatistics | séparer les contrats |
| `ESTIMAND_MODEL_COLLAPSE` | Biostatistics | séparer cible et méthode |
| `OBS_MEANING_REDEFINED_BY_ANALYSIS` | OBS/Biostatistics | refuser le modèle comme définition de mesure |
| `FACTUAL_MISSINGNESS_LOST` | CDM/DM/Biostatistics | bloquer l'analyse/projection concernée |
| `IMPUTED_VALUE_OVERWRITES_SOURCE` | Biostatistics/CDM | refuser et conserver les deux plans |
| `ANALYSIS_POPULATION_MUTATES_PROJECT_POPULATION` | Project/Biostatistics | refuser la mutation |
| `POST_HOC_PROMOTED_TO_PRESPECIFIED` | Biostatistics/humain | refuser la qualification |
| `MULTIPLICITY_HIDDEN` | Biostatistics | finding et revue obligatoire |
| `SENSITIVITY_REPLACES_PRIMARY` | Biostatistics | restaurer la coexistence et revue |
| `UNSOURCED_SAMPLE_SIZE_ASSUMPTION` | Biostatistics/humain | bloquer le Dimensionnement |
| `ANALYSIS_EXECUTION_NOT_BOUND_TO_DATA_RELEASE` | Biostatistics/DM | exécution non recevable |
| `RESULT_WITHOUT_EXECUTION` | Biostatistics | résultat non recevable |
| `RESULT_WITHOUT_PROVENANCE` | Biostatistics/CDM | résultat non recevable |
| `FAILED_EXECUTION_REPORTED_AS_NULL_RESULT` | Biostatistics | reclasser comme échec, sans inventer de résultat |
| `STATISTICAL_SIGNIFICANCE_PROMOTED_TO_CLINICAL_RELEVANCE` | humain/Biostatistics | bloquer l'interprétation automatique |
| `ASSOCIATION_PROMOTED_TO_CAUSALITY` | humain/Project/Biostatistics | bloquer la promotion |
| `PROJECTION_BECOMES_SOURCE_OF_TRUTH` | DOC/TMP/owner source | refuser l'écriture inverse directe |
| `SOFTWARE_VERSION_LOST` | Biostatistics | reproductibilité non revendiquable |
| `ANALYSIS_DEVIATION_HIDDEN` | Biostatistics/humain | finding et revue obligatoire |

Aucun failure class ne déclenche une correction automatique. Le système futur produira diagnostics, preuves, impacts, owners et dispositions explicites.

## 25. Futurs checkpoints VAL

| Checkpoint | Source → cible | Owner | Préservé/ajouté | Pertes/affaiblissements interdits | Failure modes critiques |
|---|---|---|---|---|---|
| VAL-BIO-01 | Project → AnalysisSpecification | Project/Biostatistics | ids, versions, question, objectifs, hypothèses, endpoints, décisions ; estimand/rôles ajoutés | sens Project, unknowns, provenance | endpoint-estimand collapse, population mutation |
| VAL-BIO-02 | OBS → AnalysisSpecification | OBS/Biostatistics | OP/MD, conditions, qualité, comparabilité, limites | sens/performance/version | OBS meaning redefined |
| VAL-BIO-03 | CDM → input selection | CDM/Biostatistics | Variables, occurrences, statuts, sources, temps, qualité, missingness, lineage | contexte ou statut | identity recreated, factual missingness lost |
| VAL-BIO-04 | DM DatasetRelease → Analysis Dataset | DM/Biostatistics | release/version/digest, restrictions, findings, lineage ; projection ajoutée | source, quality, audit | dataset as truth, unbound execution |
| VAL-BIO-05 | AnalysisSpecification → AnalysisExecution | Biostatistics | spec/version, inputs, method, parameters, environment | amendments, deviations | software version lost, hidden deviation |
| VAL-BIO-06 | AnalysisExecution → AnalysisResult | Biostatistics/CDM | execution, inputs, outputs, diagnostics, uncertainty, provenance | erreur ou statut | result without execution/provenance, failed as null |
| VAL-BIO-07 | Primary → Sensitivity | Biostatistics | estimand, primary identity, changed assumption, comparative disposition | statut primaire | sensitivity replaces primary |
| VAL-BIO-08 | AnalysisResult → Statistical Report | Biostatistics/DOC | result/version, uncertainty, diagnostics, limitations | provenance, non-évaluable | projection as truth, significance promotion |
| VAL-BIO-09 | AnalysisResult → Scientific Interpretation | humain mandaté | résultat, règle, justification, uncertainty, limitation, décision | alternatives/contradictions | association-to-causality, clinical relevance promotion |
| VAL-BIO-10 | AnalysisSpecification → SAP | Biostatistics/DOC | ids, versions, specs, decisions, gaps, owners | variable identity, pre/post-hoc status | parallel dictionary, hidden multiplicity |

Chaque futur enregistrement de checkpoint devra aussi porter source, cible, identities, versions, preserved, lost, added, weakened, strengthened, nonmapped, provenance, decisions, forbidden promotions et critical failure modes. Aucun seuil PASS n'est fixé par BIOSTATISTICS-001.

## 26. Conditions de refus

Une spécification, exécution, résultat ou projection est refusée si l'identité/version de l'objet source manque ; si la mesure, la Variable, la population, la release, la provenance ou le lineage critique ne sont pas reconstructibles ; si une décision engageante n'a pas d'owner/mandat ; si un ancien document est utilisé comme règle actuelle ; si une méthode est choisie par fréquence ; si un résultat est inventé ; si une correction source est écrasée ; ou si l'objet prétend une interprétation, conformité, qualification ou activation non démontrée.

## 27. Limitations obligatoires

Cette admission ne crée : aucune implémentation Biostatistics ; aucun runtime ; aucun logiciel statistique ; aucun calcul ; aucun dimensionnement réel ; aucun dataset réel ; aucune donnée patient ; aucune exécution ou AnalysisResult réel ; aucun SAP final ; aucune randomisation ; aucune analyse intermédiaire ; aucune imputation ; aucune migration V1 ; aucun mapping CDISC, FHIR ou OMOP ; aucun support de standard ; aucune règle réglementaire actuelle déduite de l'histoire ; aucun PASS PD-011 ; aucune qualification scientifique ; aucune activation produit ; aucun changement du runtime hybride ; aucune réouverture de SEM.

Elle ne modifie ni PD-003 V2, ni OBS-001, ni CDM-001, ni DM-001, ni leurs compagnons. Les liens vers QRY, VAL, TMP, DOC, REG ou une future implémentation restent des handoffs cibles.

## 28. Décision

Les objets racines nécessaires existent dans PD-003 V2 ; les constructions complémentaires sont représentables sans évolution du modèle canonique ; les frontières Project/OBS/CDM/DM/Biostatistics/humain sont explicites ; les cas, contrats, failure classes et checkpoints couvrent le corridor conceptuel sans calcul ni donnée réelle.

Décision :

`BIOSTATISTICS001_ANALYSIS_ARCHITECTURE_ADMITTED_WITH_LIMITATIONS`

Prochaine mission autorisée :

`DATA-ANALYSIS-INTEGRATION-001 — Minimal V1 implementation of CDM, Data Management and Biostatistics handoffs`

Cette future mission ne devra ni rouvrir SEM, ni créer une nouvelle architecture générale.
