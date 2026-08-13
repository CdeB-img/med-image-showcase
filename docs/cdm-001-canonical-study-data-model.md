# CDM-001 — Canonical Study Data Model

## Architecture normative des données d’étude NOXIA

| Champ | Valeur |
|---|---|
| Identifiant | CDM-001 |
| Version | 1.0 |
| Statut | `OFFICIAL — REFERENCE_NORMATIVE_SPECIALIZED_CURRENT` avec limitations explicites |
| Niveau | `NIVEAU_1 — référence normative spécialisée` |
| Date d’effet documentaire | 12 août 2026 |
| Source maîtresse | `docs/cdm-001-canonical-study-data-model.md` |
| Autorités supérieures | Charte fondatrice → Scientific Product Manifesto V2 → PD-003 V2 → OBS-001 dans son domaine |
| Nature | modèle métier conceptuel ; ni stockage, ni échange, ni implémentation |

## 1. Décision

CDM-001 est admis comme référence normative spécialisée du plan **Study Data** de NOXIA.

Il spécialise, sans les redéfinir, `CanonicalVariable`, `VariableOccurrence`, `StudyDataSource`, `TemporalAnchor`, `ExpectedVariableOccasion`, `Biospecimen`, `TerminologyMapping`, `AnalysisSpecification`, `AnalysisExecution` et `AnalysisResult`. Il fixe l’identité, la réalisation, les valeurs et statuts, les sources, les temps, les unités, la qualité réelle, le missingness, les corrections, les transformations, la provenance, le lignage et les handoffs.

L’admission est prononcée **avec limitations** : aucun moteur CDM, aucun stockage, aucune migration, aucun eCRF, dataset, standard externe, Data Management, Biostatistics, adaptation moteur ou PASS PD-011 n’est réalisé. Aucun appel Gemini, aucune campagne SEM, aucun benchmark provider et aucun quota externe n’ont été mobilisés ; l’état de SEM-001R3 est sans effet sur la décision.

Aucune évolution de PD-003 V2 ou d’OBS-001 n’est requise. Les besoins examinés sont représentables par leurs objets, relations, spécialisations, sous-ressources, value objects et projections déjà admis.

## 2. Autorités

L’ordre appliqué est : SOURCE-OF-TRUTH-INDEX ; Charte ; Scientific Product Manifesto V2 ; manifeste externe de l’Editorial Engine ; PD-003 V2 et ses cinq compagnons demandés ; OBS-001 et ses six compagnons demandés ; PD-004 ; PD-005 ; PD-009 ; PD-011 ; RDE-001 ; RDE-002 ; RDE-003 ; KE-001. ST-001, IMG-001, IMG-001B, PRJ-001, REG-001, DOC-002, TMP-001, DOC-001B et VAL-000 ont été consultés seulement comme état ou contexte. Les compagnons MAN-001 ont été consultés comme contexte officiel de transition historique ; SKM-000 et PD-003R1 l’ont été comme candidats historiques non autoritatifs.

Règles de préséance : la Charte et le Manifeste fixent la philosophie ; PD-003 V2 possède les objets et relations ; OBS-001 possède le sens général de l’observabilité et de la mesure ; ResearchProject possède les besoins, définitions et choix du projet ; CDM possède leur représentation Study Data et la réalisation canonique ; Data Management et Biostatistics restent des responsabilités futures ; PD-011 possède exclusivement l’évaluation.

## 3. Baseline

### 3.1 Baseline normative

- Le Manifeste V2 sépare `Knowledge → ScientificModel → ObservableProperty → MeasurementDefinition → BiomarkerRole → ResearchProject → CanonicalVariable → VariableOccurrence → Analyses → Documents`.
- PD-003 V2 admet les constructions nécessaires et interdit qu’une projection crée une seconde identité.
- OBS-001 impose de conserver la définition de mesure prévue, la méthode réelle, les conditions, la qualité, les limites et la provenance.
- PD-003 V2 attribue au ResearchProject le sens de la variable et au futur CDM/Data la représentation canonique, la conservation, la qualité et le lignage des occurrences.

### 3.2 État réellement implémenté

Les rapports ST-001, IMG-001/001B, PRJ-001, REG-001, DOC-002, TMP-001 et DOC-001B démontrent des capacités bornées, non une implémentation CDM. PRJ-001 produit des variables candidates et des requirements Data/Biostatistics ; TMP-001 garde Data Management et Biostatistics `FUTURE` ; DOC-001B ne rend réellement que `PROTOCOL` ; VAL-000 est diagnostique et ne contient aucun checkpoint CDM actif. Aucun modèle canonique Study Data conforme à CDM-001 n’est démontré.

### 3.3 Contradictions explicitement arbitrées

| ID | Tension | Arbitrage | Effet |
|---|---|---|---|
| CDM-A01 | `ExpectedVariableOccasion` pourrait sembler un nouvel objet | PD-003 V2 l’admet déjà comme `RELATION / SUBRESOURCE` | pas d’évolution PD-003 |
| CDM-A02 | `Transformation` pourrait devenir un objet racine | définition réutilisable par règle/méthode/AnalysisSpecification ; exécution comme sous-ressource de lignage liée aux occurrences ou à AnalysisExecution | pas d’objet racine |
| CDM-A03 | `Dataset` pourrait devenir source de vérité | `PROJECTION` matérialisée et versionnée des objets canoniques | pas d’identité scientifique concurrente |
| CDM-A04 | `StudyUnit` pourrait exiger une ontologie universelle | référence qualifiée vers l’objet de projet/domaine existant, avec type et parentage contextuels | pas de racine universelle |
| CDM-A05 | `Value` et les statuts pourraient être des objets | contenu et qualifications orthogonales de VariableOccurrence | pas d’objet ni enum plate |
| CDM-A06 | l’implémentation V1 utilise des variables composites | état courant inférieur ; mapping requis, jamais promotion | aucune correction moteur |

## 4. Mission

CDM-001 définit comment représenter, de façon canonique, versionnée, reconstructible et indépendante des projections : ce que le projet a décidé de recueillir ; ce qui a été tenté ou réalisé ; pour quelle unité et à quel moment ; depuis quelle source et quelle méthode ; avec quelle valeur, unité, qualité et restriction ; puis comment cette donnée a été corrigée, transformée, dérivée, consommée et projetée.

Le modèle doit répondre aux vingt questions de traçabilité du mandat, de la motivation du `DataNeed` jusqu’aux projections utilisatrices, sans confondre définition, attente, réalisation, analyse et interprétation.

## 5. Plans de vérité

| Plan | Owner | Ce que CDM fait | Promotion interdite |
|---|---|---|---|
| Constitution | Charte / Manifeste | s’y conforme | représentation technique → principe |
| Objets métier | PD-003 V2 | spécialise la représentation | sous-contrat → nouvel objet caché |
| Mesure générale | OBS / domaines | référence versions, conditions et limites | occurrence → redéfinition de méthode |
| Projet | ResearchProject | reçoit besoins, variables, attentes et décisions | champ disponible → besoin adopté |
| Study Data | CDM | représente occurrences, valeurs, statuts, provenance et lignage | projection → vérité canonique |
| Opérations données | futur Data Management | prépare le contrat | contrôle technique → sens scientifique |
| Analyse | Biostatistics / owner analytique | remet des inputs contextualisés et reçoit les résultats | matrice numérique → variable redéfinie |
| Documents | TMP / DOC | fournit des références projetables | document → owner du fond |
| État courant | rapports et code | constate les écarts | implémentation → norme |
| Hypothèses | travaux futurs | les garde explicites | cible → capacité livrée |

## 6. Frontières

CDM gouverne la représentation Study Data des définitions ; les occurrences ; valeurs et statuts ; sources et temps réalisés ; unités et domaines appliqués ; qualité réelle ; missingness ; corrections ; transformations ; provenance ; lignage ; restrictions ; relations entre source-native, canonicalized, standardized, quality-controlled, derived et analysis input.

CDM ne gouverne jamais Knowledge, ScientificModels, ObservableProperties, MeasurementDefinitions, validité d’un BiomarkerRole, DataNeeds adoptés, décision de créer une CanonicalVariable, objectifs, endpoints, méthodes statistiques, interprétations, décisions humaines, structure documentaire, stockage ou format d’échange.

**Data model ≠ storage model ≠ exchange format.** CDM-001 ne préjuge ni SQL, NoSQL, base documentaire, graphe, schéma relationnel, FHIR store, base OMOP, Parquet, CSV, JSON ou repository DICOM. JSON, XML, CSV, FHIR, CDISC, ODM, DICOM, NIfTI et Parquet restent des formats, standards, mappings ou projections ; aucune technologie ne devient la vérité métier.

## 7. Rôle du CDM

Le rôle du CDM est d’assurer une **continuité d’identité et de contexte** entre la décision du projet et chaque réalisation. Il conserve le contrat scientifique référencé sans le posséder, représente l’écart entre attendu et réel, et fournit un lignage utilisable par Data Management, Biostatistics, DOC et VAL.

Il ne produit aucune valeur, ne choisit aucune source ou méthode et ne corrige aucun sens scientifique. Une correction sémantique retourne comme `Contribution` au ResearchProject ou à l’owner amont.

## 8. Non-duplication Project / OBS

ResearchProject reste owner des DataNeeds, CanonicalVariables, occasions attendues, sources prévues, méthodes choisies, endpoints et décisions. OBS et les domaines restent owners des propriétés, définitions de mesure, qualifications de méthode et qualité attendue. CDM référence leurs identités et versions ; il ne les copie pas comme autorité propre.

Une divergence réelle — source différente, méthode différente, hors fenêtre, unité inattendue — est une propriété de la réalisation. Elle ne réécrit ni le plan Project ni OBS.

## 9. CanonicalVariable

La `CanonicalVariable` est la spécialisation PD-003 de Variable et conserve une identité sémantique unique dans le ResearchProject. Le contrat CDM référence au minimum : `variableId`, version, canonicalName, labels/aliases projetés, description, DataNeed/Objectif/Endpoint refs, ObservableProperty/MeasurementDefinition refs lorsqu’applicables, BiomarkerRole éventuel, rôle scientifique, sémantique de valeur et d’unité, value domain, attentes de source/temps/qualité/missingness, statut de dérivation, mapping terminologique, provenance, cycle et supersession.

Une variable administrative, contextuelle, d’identification pseudonymisée, de classification, événementielle, d’exposition ou dérivée peut être canonique sans `ObservableProperty`. L’absence de référence doit être justifiée par sa nature, jamais remplie artificiellement.

Le CRF, le Data Dictionary, le SAP, un dataset, un export ou un rapport ne possèdent ni ne recréent cette identité.

## 10. VariableOccurrence

Une `VariableOccurrence` représente, pour une unité étudiée et un contexte temporel, une réalisation, tentative, absence qualifiée, invalidité, non-applicabilité ou dérivation d’une version de CanonicalVariable.

Le contrat spécialisé conserve au minimum : occurrenceId ; CanonicalVariable id/version ; StudyUnitReference ; sujet si pertinent ; occasion attendue éventuelle ; contexte temporel réel ; source et contexte ; MeasurementDefinition réelle/version ; contenu de valeur ; statuts orthogonaux ; unité réelle ; version du value domain ; qualité ; temps de collecte/acquisition/observation/processing/dérivation/analyse applicables ; provenance ; occurrences sources ; transformations ; corrections ; supersession ; audit ; restrictions ; unknowns et limitations.

Chaque occurrence possède exactement un `REALIZES` vers une version de CanonicalVariable. Une occurrence ne redéfinit jamais la Variable et n’est jamais une interprétation scientifique.

## 11. Value semantics

`Value` n’est pas un objet racine. C’est le contenu qualifié d’une occurrence : numérique, entier, décimal, catégorie, ordinal, binaire, date/temps, durée, texte, concept codé, résultat structuré, structure répétée, composite ou autre forme gouvernée.

Sept axes restent orthogonaux : existence de valeur ; réalisation de collecte ; applicabilité ; validité ; qualité ; disponibilité ; décision d’utilisation. `value = null` ne suffit jamais. Une occurrence peut, par exemple, avoir une collecte réalisée, aucune valeur exploitable, une validité `INVALID`, une qualité documentée et une décision d’usage `EXCLUDED_FROM_ANALYSIS`.

## 12. Missingness

Le missingness décrit le fait et sa raison ; il ne prescrit aucune stratégie statistique. Sont distingués : attendu mais absent ; jamais attendu ; non applicable ; refus ; examen non réalisé ; examen réalisé mais inexploitable ; donnée perdue ; inconnue ; source inaccessible ; valeur sous limite ; censurée ; invalidité technique ; retrait justifié ; non-utilisation analytique.

Les raisons sont portées par `HAS_MISSINGNESS_REASON` et les axes de statut, avec contexte, source, acteur, date et preuve disponibles. Une valeur négative ou zéro reste une valeur observée, jamais un missingness.

## 13. Not applicable / not evaluable / invalid

| Qualification | Question | Exemple conceptuel | Ne signifie pas |
|---|---|---|---|
| `NOT_APPLICABLE` | la variable devait-elle s’appliquer à cette unité/contexte ? | sous-étude non applicable | manquante ou négative |
| `NOT_EVALUABLE` | une réalisation existe-t-elle sans permettre l’évaluation attendue ? | image présente mais inexploitable | invalide par définition |
| `INVALID` | une valeur produite viole-t-elle une règle applicable ? | contrôle technique échoué | absence de collecte |
| `UNKNOWN` | l’information de statut est-elle insuffisante ? | cause de l’absence non établie | valeur par défaut |
| `OBSERVED_VALUE` | un contenu exploitable a-t-il été produit ? | valeur/catégorie qualifiée | vérité scientifique |

Ces qualifications ne sont ni interchangeables ni ordonnées. Le passage de l’une à l’autre exige un événement, une justification et une trace.

## 14. Study units

`StudyUnitReference` est une référence qualifiée, non un nouvel objet racine. Elle conserve `studyUnitType`, identity/version, parentUnit et relations vers les objets existants du Project ou du domaine.

Le contrat couvre participant/sujet, visite, épisode, lésion, segment, organe, examen, série, image, ROI, Biospecimen, aliquot, événement, centre, dispositif, reader et couple reader–examen. Une même occurrence désigne son unité principale ; les unités de contexte restent reliées sans aplatir la hiérarchie.

## 15. Temporalité

| Construction | Classification | Rôle |
|---|---|---|
| Visit / événement | objet PD-003 existant | contexte de plan ou événement réel |
| TemporalAnchor | `VALUE_OBJECT` | référentiel, direction, unité, fenêtre, tolérance |
| ExpectedVariableOccasion | `RELATION / SUBRESOURCE` | attente Variable × ancre × unité/condition |
| actual observation/collection/acquisition/processing/derivation/analysis time | contenu temporel qualifié de l’occurrence/exécution | temps effectivement constaté |

Un timepoint ne crée jamais à lui seul une nouvelle CanonicalVariable. Les temps attendus et réalisés restent séparés ; les temps inconnus ne sont pas déduits d’un ordre de visite.

## 16. Expected Variable Occasion

L’ExpectedVariableOccasion relie une version de CanonicalVariable, une unité ou population qualifiée, un TemporalAnchor, une fenêtre, des conditions, un caractère obligatoire/optionnel/conditionnel/as-needed, une sous-étude éventuelle, les sources et méthodes prévues, ainsi que les attentes de qualité et de missingness.

Elle est owned par ResearchProject / Study Design. CDM la représente et relie une occurrence par `FULFILLS_OCCASION`. L’attente peut être satisfaite, hors fenêtre, partielle, non applicable, non réalisée, invalide ou non évaluable ; elle ne produit aucune valeur.

## 17. Schedule of Activities

La Schedule of Activities est une projection des ExpectedVariableOccasions et décisions Project. Une cellule exprime une attente contextualisée ; elle n’est ni Variable ni VariableOccurrence.

CDM permet la comparaison expected/realized sans faire de la SoA l’owner des identités. Une modification visuelle de la SoA ne modifie pas le projet ; une modification de l’attente doit retourner au Project puis créer une nouvelle version.

## 18. Sources

`StudyDataSource` reste une sous-ressource PD-003. Son contrat CDM porte sourceId/type, owner externe ou Project d’usage, système/organisation, version, période effective, productionContext, mandateContext, accessContext, provenance, métadonnées de fiabilité/qualité, limitations et mappingStatus.

Les axes sont indépendants : mandat de production ; provenance ; domaine/méthode ; système/organisation ; relation temporelle au projet ; lignage. `ROUTINE_CARE`, `STUDY_MANDATED`, `REGISTRY`, `BIOBANK`, `EXTERNAL_DATABASE`, `HISTORICAL_DATA`, `DEVICE`, `IMAGING`, `LABORATORY` et `DERIVED` ne forment donc pas une enum unique.

## 19. Planned vs actual source

L’ExpectedVariableOccasion référence la source prévue ; l’occurrence référence la source réelle. Toute divergence conserve source prévue, source réelle, raison, déviation, impact qualité/comparabilité, décision, provenance et condition de revue.

Une donnée provenant d’un laboratoire local ne réécrit jamais l’attente « laboratoire central ». L’absence de source réelle reste `UNKNOWN` ou `SOURCE_UNAVAILABLE` selon les faits, non copiée depuis le plan.

## 20. Planned vs actual method

La méthode prévue est la MeasurementDefinition/version adoptée par le Project ; la méthode réelle est celle qui a produit l’occurrence. Une divergence conserve les deux références et versions, raison, qualité, comparabilité, décision et provenance.

Une méthode différente peut produire une occurrence comparable, comparable sous conditions, non interchangeable, incomparable ou de comparabilité inconnue. Seules les qualifications OBS/du domaine et une décision Project autorisent l’usage ; l’identité de Variable n’impose aucune fusion.

## 21. Unités

Sont distinguées : sémantique canonique d’unité, unité attendue, unité réelle, unité d’affichage, unité d’analyse et unité d’export. Une conversion gouvernée qui conserve le même sens ne crée pas une nouvelle Variable.

Toute conversion conserve valeur/unité source, règle/version, paramètres, valeur/unité cible, précision, arrondi, limitations, provenance et occurrences source/sortie. L’original n’est jamais écrasé. Une incompatibilité d’unité bloque la conversion ou exige un mapping qualifié.

## 22. Value domains

Un ValueDomain versionné qualifie forme, valeurs/codes/labels autorisés, ordre éventuel, compatibilité d’unité, précision, sémantique de plage, missingness et TerminologyMappings. Il est une sous-ressource/value object de la définition, non un type de stockage.

Un ajout compatible de label ou mapping peut créer une nouvelle version sans nouvelle identité de Variable. Une modification qui change les distinctions scientifiques, le construit, l’ordre, le sens d’une catégorie ou l’interprétation exige une nouvelle version majeure ou une nouvelle CanonicalVariable selon le test du §51.

## 23. Terminology mappings

`TerminologyMapping` reste la relation PD-003 `MAPPED_TO_STANDARD`. Elle conserve identité/version NOXIA, standard/version, concept/code cible, relation d’équivalence, contexte, exclusions, provenance, statut de revue, alternatives et supersession.

LOINC, SNOMED CT, MedDRA, CDISC Controlled Terminology, UCUM, vocabulaires FHIR ou OMOP ne remplacent jamais l’identité NOXIA. Une correspondance partielle reste partielle ; l’égalité de libellé ne prouve rien.

## 24. Biospecimens

`Biospecimen` reste l’objet matériel PD-003, distinct de Variable, source et occurrence. Sa représentation Study Data conserve : biospecimenId/version ; parentBiospecimen ; sourceStudyUnit ; collectionContext ; materialType ; temps ; processing ; stockage ; aliquotage ; quantité ; disponibilité ; qualité ; chaîne de garde ; restrictions ; destruction ; provenance et supersession.

La chaîne participant → prélèvement → sang → plasma → aliquot → assay → VariableOccurrence conserve chaque identité et relation. Une fécothèque sans analyse sélectionnée peut représenter collections, aliquots, stockage, disponibilité et provenance, sans créer BiomarkerRole, MeasurementDefinition, CanonicalVariable analytique, AnalysisSpecification ou AnalysisResult.

## 25. Routine care

Une donnée de soin courant conserve `productionContext = ROUTINE_CARE` même lorsqu’elle est réutilisée par l’étude. Son usage Project est un mandat de consommation distinct, non une réécriture de l’origine.

Une échocardiographie, biologie ou donnée hospitalière réutilisée conserve examen/source d’origine, méthode/version, temps, qualité, provenance, restrictions et décision d’usage. Elle ne devient jamais une procédure imposée par l’étude.

## 26. Transformations

Une transformation est représentée sans objet racine nouveau. Sa **définition** est portée par une Règle méthodologique, Règle de calcul, MeasurementDefinition dérivée ou AnalysisSpecification selon le sens ; son **exécution** est une sous-ressource de lignage rattachée aux occurrences ou à AnalysisExecution.

Le contrat d’exécution conserve transformationId local, type, owner, inputs et versions, rule/algorithm ref et version, paramètres, contexte, outputs, timestamp, quality checks, warnings, limitations, provenance et supersession. `DERIVED_FROM` doit former un graphe acyclique par version. Même définition, mêmes inputs canoniques et mêmes versions doivent produire le même résultat canonique dérivé, sauf source d’aléa explicitement gouvernée qui change l’identité d’exécution et la reproductibilité attendue.

`SOURCE_NATIVE`, `CANONICALIZED`, `STANDARDIZED`, `QUALITY_CONTROLLED`, `DERIVED`, `ANALYSIS_READY`, `ANALYSIS_INPUT` et `ANALYSIS_RESULT` qualifient des axes différents — nature, transformation, validation, statut analytique et usage — et ne forment pas une enum universelle.

## 27. Derived Variables

Une sortie dérivée devient CanonicalVariable seulement si elle possède un sens scientifique stable et réutilisable pour une unité étudiée. Elle conserve sourceVariableRefs, définition/version de dérivation, sens, unité/value domain, conditions, propagation de missingness et qualité, provenance, pertinence analytique et supersession.

BMI, ECV, score, volume segmenté, delta, ratio ou valeur normalisée sont des cas à arbitrer par ce test, jamais des Variables automatiques. Une occurrence dérivée référence toutes ses occurrences parentes. Un résultat inférentiel reste `AnalysisResult`.

## 28. Frontière derivation / Analysis

Une dérivation relève du CDM lorsqu’elle produit une donnée définie pour une unité étudiée, suit une règle préspécifiée, possède un sens de Variable réutilisable, peut être obtenue indépendamment de la comparaison statistique centrale et conserve les parents.

Elle relève d’AnalysisSpecification/AnalysisResult lorsqu’elle estime un effet ou estimand, compare des groupes, ajuste un modèle, calcule une incertitude inférentielle, produit une statistique globale, dépend de la population d’analyse ou constitue un résultat statistique. Une même chaîne peut produire d’abord une Variable dérivée puis la consommer dans une analyse ; les deux étapes et owners restent distincts.

## 29. AnalysisResult

CDM référence l’`AnalysisResult` PD-003 et peut représenter les liens vers AnalysisSpecification/Execution, inputs/versions, population, dataset projeté, paramètres référencés, résultat structuré, incertitude, qualité, warnings, provenance et lignage.

CDM ne choisit ni estimand, modèle, covariables, analyse principale, méthode de missing data, sensibilité ni interprétation. `AnalysisResult` n’est jamais `ScientificInterpretation` ; cette dernière exige une décision humaine mandatée.

## 30. Datasets

Un dataset est classé `PROJECTION` matérialisée et versionnée d’objets canoniques. Il possède une définition de projection : datasetId local, version, variables incluses, sélection d’occurrences, population, politique temporelle, transformations, filtres, quality gates, provenance, états de revue/freeze/lock et restrictions.

Il ne possède ni DataNeed ni CanonicalVariable. Une colonne référence l’identité NOXIA et peut avoir un nom propre. Un dataset d’analyse peut porter des produits analytiques ; si un produit acquiert un sens scientifique réutilisable différent, sa nouvelle CanonicalVariable doit être décidée en amont, jamais créée par matérialisation.

## 31. CRF

Le CRF est une `PROJECTION` de collecte dérivée des CanonicalVariables, ExpectedVariableOccasions, attentes de source/méthode, ValueDomains, instructions, règles qualité, conditions et décisions Project.

Un champ CRF référence une Variable ; il ne la crée pas. Un changement ergonomique reste projection. Tout changement de sens, unité, domaine, méthode ou attente retourne comme Contribution à l’owner Project avant une nouvelle version canonique.

## 32. Data Dictionary

Le Data Dictionary est une projection descriptive de la même identité : nom technique, libellé, définition, type conceptuel, domaine, unité, source/temps attendus, missingness, qualité, mappings et versions. Il ne devient ni registre de Variables autonome ni preuve d’occurrences.

Une entrée orpheline sans CanonicalVariableRef est `INCOMPLETE` ou legacy à mapper. Une différence de nom entre Data Dictionary, CRF et dataset n’est pas une différence d’identité.

## 33. SAP / Biostatistics

Le SAP et les AnalysisSpecifications consomment les mêmes CanonicalVariables. Biostatistics peut qualifier rôle analytique, population, transformation, covariable, usage endpoint, relation estimand, missing-data handling et analyses de sensibilité ; il ne redéfinit pas l’identité ou le sens source.

Une nouvelle donnée analytique scientifiquement différente exige une nouvelle CanonicalVariable décidée par le ResearchProject ou un AnalysisResult selon sa nature, avec lignage. Le SAP est un consommateur/document, jamais un dictionnaire scientifique parallèle.

## 34. Data Management

Le futur Data Management sera responsable des opérations d’ingestion, structure, validation, normalisation, harmonisation d’unité, coding, reconciliation, queries, cleaning, corrections, freeze, lock, lignage et traçabilité sous le contrat CDM.

Il peut créer ou corriger une représentation/occurrence dans son mandat, pas le DataNeed ni le sens de CanonicalVariable. Toute anomalie sémantique devient Contribution vers ResearchProject/OBS/domaine. CDM-001 n’implémente aucun de ces processus.

## 35. External standards

CDISC, FHIR, OMOP, LOINC, SNOMED CT, MedDRA, UCUM, ODM, DICOM, NIfTI et autres standards/formats se branchent par mappings versionnés et projections d’échange : modèle interne NOXIA → mapping externe → projection/échange.

Une projection SDTM-like ou ADaM-like conserve variable NOXIA, occurrences sources, dérivation, domaine/variable externes, terminologie/version, type de mapping, limites et provenance. Une ressource FHIR, ligne OMOP ou objet DICOM importé conserve source et version ; il ne dicte pas le modèle canonique.

## 36. Provenance

Toute occurrence permet de reconstruire : origine ; source system/object/version ; variable/version ; MeasurementDefinition prévue et réelle ; contexte temporel ; valeur/unité d’origine ; transformations ; corrections ; décisions qualité ; mappings ; consommateurs analytiques ; outputs et projections dépendants.

La provenance est additive et immuable. Une projection peut l’abréger selon PD-004, jamais rompre les références nécessaires. L’absence d’un élément critique est visible et peut bloquer l’usage sans être inventée.

## 37. Lineage

Le lignage est un graphe conceptuel, non une technologie. Il utilise notamment `DERIVED_FROM`, `PRODUCED_BY`, `COLLECTED_FROM`, `CONSUMED_BY_ANALYSIS`, `PRODUCES_RESULT`, `MAPPED_TO_STANDARD` et `SUPERSEDES`.

Exemples de chemins recevables : Biospecimen → résultat laboratory source → occurrence normalisée → Variable dérivée → dataset projection → AnalysisResult → table → document ; DICOM study → series → segmentation → volume → VariableOccurrence → AnalysisExecution → AnalysisResult. Chaque nœud conserve identité/version/owner ; chaque arête conserve contexte, règle et provenance. Aucun parent n’est perdu.

## 38. Corrections

Une correction ne modifie jamais silencieusement l’occurrence historique. Elle conserve original, corrected occurrence/version, reason, actor/system, mandat, timestamp, source evidence, impacts qualité/aval, `SUPERSEDES` et besoin de réanalyse.

Erreur de saisie CRF, correction laboratoire, nouveau contour, mapping corrigé, dérivation recalculée et retrait de source suivent tous ce contrat. Une resaisie sans lien est une nouvelle occurrence candidate ou un doublon à qualifier, jamais une correction implicite.

## 39. Audit trail

La trace conceptuelle répond : qui ; quoi ; quand ; pourquoi ; version lue ; source ; état avant ; état après ; décision/mandat ; objets et projections impactés ; réanalyse/revue attendue. Elle est immuable et liée aux objets PD-003 appropriés, sans imposer de technologie.

Une opération sans actor ou système, raison, versions ou impact nécessaires est `INCOMPLETE`. L’audit décrit l’acte ; il ne prouve pas sa validité scientifique.

## 40. Data quality

Les axes restent séparés : qualité attendue de mesure, acquisition et lecture (OBS/domaines) ; occurrence quality, data integrity, completeness, consistency, validity, source verification, transformation quality et analysis readiness (CDM/Data).

Chaque qualification de qualité possède cible, règle/version, résultat, statut, owner, temps, conséquence, preuve/provenance et limitations. Aucun score unique ne compense une invalidité critique ou une provenance manquante. Une donnée quality-controlled n’est pas scientifiquement vraie par définition.

## 41. Freeze / lock

Draft, reviewed, queried, corrected, validated, frozen, locked et released-for-analysis appartiennent à plusieurs axes : état de contenu, revue, autorisation d’usage, état de dataset et état Project. Ils ne forment pas une seule enum.

Freeze crée un snapshot/version de données et de lignage pour un usage nommé ; lock interdit des mutations ordinaires selon une décision de gouvernance ; release autorise un usage analytique borné. Aucun de ces états ne prouve vérité, validité scientifique ou PASS. Une correction post-lock crée un successor et une analyse d’impact.

## 42. Longitudinal data

Baseline, follow-up, événement déclencheur, temps relatif, hors fenêtre, visite manquée, répétition biologique/technique, mesure continue et série temporelle sont représentés par TemporalAnchors, ExpectedVariableOccasions, temps réels et relations d’unité.

Le modèle n’est pas visit-only. Une série peut être représentée comme résultat structuré ou ensemble d’occurrences selon sa sémantique et ses besoins de lignage. Les trous, changements de dispositif/version et fenêtres de wear-time restent explicites.

## 43. Multicentre

Chaque occurrence conserve centre, laboratoire/scanner/dispositif, vendor, logiciel/version, unité locale, dictionnaire local, procédure réelle et transformations. Une harmonisation produit de nouvelles occurrences ou projections reliées aux originaux ; elle n’uniformise jamais silencieusement.

Les comparabilités sont héritées par référence aux qualifications OBS/domaines, jamais déduites d’une même Variable ou unité. L’effet centre et son traitement appartiennent à Biostatistics.

## 44. Imaging data

DICOM study, series, image, segmentation, ROI, mesure quantitative, classification reader, metadata d’acquisition et métrique dérivée restent objets/références du domaine Imaging. CDM représente les StudyUnitReferences, occurrences et leur lignage sans remplacer Imaging.

DICOM, NIfTI, SEG, SR et autres formats sont sources ou projections. Une segmentation ou relecture crée une nouvelle réalisation/transformation reliée ; un volume réutilisable peut devenir occurrence d’une Variable dérivée après décision Project.

## 45. Laboratory data

Le contrat distingue prélèvement, Biospecimen, aliquot, assay/MeasurementDefinition, CanonicalVariable et VariableOccurrence. Il conserve unité réelle, LoD/LoQ et leur version, below-detection/censoring, recalibration, kit/lot/instrument/version, laboratoire central/local et contexte routine care.

`BELOW_DETECTION_LIMIT` est une qualification de valeur/censure avec limite référencée, pas une absence générique. Un changement de kit ou laboratoire reste condition/méthode/source réelle et n’implique une nouvelle Variable que si le sens change.

## 46. Handoff Project → CDM

Le paquet versionné contient : projectId/version ; DataNeeds ; CanonicalVariables/versions ; contextes temporels attendus ; sources et MeasurementDefinitions prévues ; value domains ; unités ; attentes qualité/missingness ; définitions de dérivation ; plans Biospecimen ; mappings ; décisions ; unknowns ; contradictions ; limitations ; provenance.

`COMPLETE`, `INCOMPLETE`, `NOT_EVALUABLE` et `BLOCKED` sont des diagnostics composés, non une enum universelle. `COMPLETE` signifie complet pour la représentation demandée, jamais valide ou réalisé. CDM ne comble aucun champ.

## 47. Handoff OBS → CDM

Le handoff transite par les décisions Project et référence ObservableProperty/version, MeasurementDefinition prévue/version, sémantique, qualité attendue, comparabilité, conditions, unknowns, contradictions, limitations et provenance.

CDM conserve seulement les références nécessaires à l’interprétation et la méthode réelle de chaque occurrence. Il ne copie ni preuve ni qualification comme autorité propre et ne modifie aucun objet OBS.

## 48. Handoff CDM → Data Management

Le paquet contient identités/définitions ; occurrences ; sources ; temporalités ; sémantique de valeur ; unités ; missingness ; qualité ; transformations ; corrections ; lignage ; audit requirements ; mappings ; restrictions ; versions ; provenance et décisions applicables.

Data Management reçoit le droit opérationnel défini par son futur contrat, jamais le droit de modifier le sens scientifique. Une perte d’identité, de version, de valeur/unité source, de missingness ou de lignage rend le handoff non fidèle.

## 49. Handoff CDM → Biostatistics

Biostatistics reçoit CanonicalVariable ids/versions, occurrences, MeasurementDefinition versions, méthodes/sources/temps réels, unités, qualité, missingness, limitations de comparabilité, dérivation, freeze/lock/release, relations de population, restrictions et provenance.

Une matrice numérique sans ce contexte est une projection incomplète. Biostatistics sélectionne et transforme selon AnalysisSpecification ; ses décisions ne réétiquettent pas les sources.

## 50. Handoff Analysis → CDM

Le paquet de résultat référence AnalysisSpecification, AnalysisExecution, input occurrences/dataset projection, population, versions, paramètres, AnalysisResults, incertitudes, qualité, warnings, provenance et lignage.

CDM conserve le résultat structuré et ses liens sans devenir owner de la méthode statistique. Toute correction ou réexécution crée une nouvelle version/exécution et relie les résultats antérieurs.

## 51. Identity/versioning Variables

| Changement | Disposition par défaut | Test opposable |
|---|---|---|
| label, traduction, alias, nom de colonne | même identité ; projection ou nouvelle version descriptive | sens inchangé |
| timepoint, source, contexte routine/study, rôle analytique | même identité si le sens reste stable ; qualifications/occasions distinctes | ne pas encoder le contexte dans l’id |
| unité ou précision | même identité + version si conversion gouvernée et sémantique stable ; sinon nouvelle identité | comparabilité et sens démontrés |
| ValueDomain/catégorie | nouvelle version si distinctions scientifiques inchangées ; nouvelle identité si sens/catégories constitutives changent | impact sur interprétation |
| MeasurementDefinition | même identité possible si la Variable vise le même sens et méthodes qualifiées ; nouvelle identité si l’opérationnalisation définit un construit différent | décision Project + OBS |
| population ou endpoint usage | même identité si portée d’usage seulement ; nouvelle identité si définition constitutive change | owner et domaine |
| formule/définition scientifique | nouvelle version compatible ou nouvelle identité si sens substantiellement modifié | continuity of meaning |
| code/standard externe | même identité ; TerminologyMapping versionné | code externe non autoritaire |

`sameIdentity` exige continuité de sens, owner et rôle ; `newVersion` conserve cette continuité avec changement traçable ; `newIdentity` est obligatoire dès que le construit, la définition scientifique ou le rôle ontologiquement constitutif change.

## 52. Identity/versioning Occurrences

| Situation | Qualification |
|---|---|
| correction de saisie/source | occurrence/version supersédante liée à l’originale |
| réplication ou répétition biologique/technique | nouvelle occurrence avec relation de répétition/contextes |
| duplicate record | occurrence candidate marquée doublon ; aucune fusion sans décision |
| reprocessing, re-reading, re-segmentation | nouvelle occurrence ou produit de transformation selon sortie ; parents conservés |
| re-analysis | nouvelle AnalysisExecution/AnalysisResult, pas réétiquetage de l’occurrence source |
| conversion d’unité/harmonisation | occurrence transformée ou représentation dérivée avec original et règle |
| adjudication | nouvelle occurrence/décision qualifiée reliée aux lectures sources ; sources conservées |

L’occurrenceId désigne une réalisation historique. Un changement de valeur, méthode, source, temps ou unité réelle ne l’écrase jamais. Une correction peut conserver une lignée logique de même réalisation tout en créant une version ou occurrence supersédante explicite.

## 53. Relations

CDM réutilise strictement le catalogue PD-003 : `COVERS_DATA_NEED`, `OPERATIONALIZES`, `EXPECTED_AT`, `REALIZES`, `FULFILLS_OCCASION`, `OCCURRED_AT`, `HAS_STATUS`, `HAS_MISSINGNESS_REASON`, `COLLECTED_FROM`, `PRODUCED_BY`, `USES_BIOSPECIMEN`, `DERIVED_FROM`, `CONSUMED_BY_ANALYSIS`, `PRODUCES_RESULT`, `MAPPED_TO_STANDARD` et `SUPERSEDES`.

| Besoin candidat | Classification | Représentation retenue |
|---|---|---|
| CanonicalVariable | `SPECIALIZATION` PD-003 existante | même identité que Variable, profil CDM subordonné au Project |
| VariableOccurrence | `OBJECT` PD-003 existant | réalisation autonome avec identité, source, temps, qualité et cycle propres |
| Value | `NOT_REQUIRED` comme objet | contenu qualifié de VariableOccurrence |
| ValueDomain | `SUBRESOURCE / VALUE_OBJECT` | sémantique versionnée subordonnée à la définition |
| StudyUnitReference | `VALUE_OBJECT / qualified reference` | référence aux objets existants |
| StudyDataSource | `SUBRESOURCE` PD-003 existante | usage, version, mandat, accès et provenance subordonnés au Project |
| TemporalAnchor | `VALUE_OBJECT` PD-003 existant | ancre, fenêtre, intervalle ou temps relatif |
| ExpectedVariableOccasion | déjà `RELATION / SUBRESOURCE` | contrat spécialisé du §16 |
| Transformation definition/execution | règle/AnalysisSpecification + `SUBRESOURCE` de lignage | `DERIVED_FROM` / `PRODUCED_BY` |
| Dataset | `PROJECTION` | collection matérialisée versionnée |
| AnalysisDataset | `PROJECTION` spécialisée | dataset borné par une définition, une population et une AnalysisSpecification |
| Biospecimen | `OBJECT` PD-003 existant | identité matérielle, parentage, custody, qualité et cycle propres |
| Event / Visit | objet ou spécialisation PD-003 existants | donnée lorsqu'il est le fait observé ; contexte lorsqu'il ancre d'autres occurrences |
| AnalysisExecution | `SUBRESOURCE` PD-003 existante | exécution versionnée subordonnée à la spécification |
| AnalysisResult | `OBJECT` PD-003 sous critère d'autonomie | résultat complexe ; un scalaire dérivé préspécifié reste occurrence |
| TerminologyMapping | `RELATION` PD-003 existante | mapping source/cible/version/context, non identitaire |
| CRF/Data Dictionary/SoA/SAP/export | `PROJECTION` ou document consumer | références canoniques |

Aucune relation nouvelle n’est admise. Si un futur besoin ne peut être porté ainsi, CDM doit produire `PD003_EVOLUTION_REQUIRED` avant toute extension.

## 54. Ownership

ResearchProject possède DataNeeds, CanonicalVariables, attentes et décisions ; CDM possède le contrat de représentation Study Data ; systèmes sources/sites produisent ; Data Management futur conserve, contrôle et corrige sous mandat ; OBS/domaines possèdent la mesure ; Biostatistics possède spécifications/exécutions/résultats analytiques ; l’humain mandaté possède les décisions engageantes.

La matrice complète de création, contribution, consommation, décision, correction et version figure dans `docs/cdm-001-ownership-matrix.md`. Un handoff ne transfère jamais l’ownership et une correction aval retourne à l’owner du sens.

## 55. Legacy

Variables V1, Observation ambiguë, Data Requirements historiques, champs CRF, datasets, colonnes, exports, outputs Imaging et résultats Laboratory restent lisibles sous leur version. Ils sont qualifiés `LEGACY_READABLE`, `V1_COMPOSITE_LEGACY`, `MAPPING_REQUIRED`, `AMBIGUOUS_LEGACY`, `MAPPED_WITH_LIMITATIONS` ou `REFUSED_MAPPING`.

Ni égalité de nom, ni position de colonne, ni unité, ni code externe ne prouve `sameIdentity`. Aucun artefact n’est migré. La politique détaillée figure dans `docs/cdm-001-legacy-compatibility.md`.

## 56. Vingt cas conceptuels normatifs

Ces cas sont des fixtures conceptuelles sans donnée patient, seuil, protocole ou affirmation de validité scientifique. Les références `CASE-*` sont locales aux cas et doivent être résolues dans un projet réel.

### A — Variable quantitative mesurée une fois

- **ScientificModel refs :** `CASE-A-SM` candidat ; **ObservableProperty refs :** `CASE-A-OP` si applicable ; **MeasurementDefinition refs :** `CASE-A-MD` prévue/réelle ; **DataNeed refs :** `CASE-A-DN` adopté.
- **CanonicalVariable :** `CASE-A-VAR` unique ; **Expected Occasion :** une occasion baseline ; **VariableOccurrence(s) :** zéro ou une par unité ; **StudyUnit :** participant qualifié.
- **Planned source :** source Project ; **Actual source :** source productrice ; **Planned method :** `CASE-A-MD`; **Actual method :** version réellement utilisée ; **Value/value status :** `OBSERVED_VALUE` ou raison explicite ; **Unit :** attendue et réelle ; **Quality :** qualification réelle ; **Missingness :** aucun si valeur observée, sinon raison.
- **Transformations :** aucune par défaut ; **Derivations :** aucune ; **Analysis refs éventuelles :** consumer éventuel seulement.
- **Owner :** Project pour Variable, CDM pour représentation ; **Decision owner :** humain Project ; **Correction owner :** source/Data sous mandat ; **Version owner :** Project pour Variable, CDM/Data pour occurrence ; **Provenance :** source, méthode, temps ; **Lineage :** source → occurrence ; **Unknowns :** éléments non établis ; **Contradictions :** conservées ; **Objects NOT created :** aucune deuxième Variable, analyse ou interprétation ; **Projection consequences :** un champ/colonne peut référencer `CASE-A-VAR`.

### B — Même Variable répétée T0/H6/H12/H24

- **ScientificModel refs :** `CASE-B-SM` ; **ObservableProperty refs :** `CASE-B-OP` ; **MeasurementDefinition refs :** `CASE-B-MD` ; **DataNeed refs :** `CASE-B-DN` longitudinal.
- **CanonicalVariable :** `CASE-B-TROPONIN`, une identité ; **Expected Occasion :** quatre occasions T0/H6/H12/H24 ; **VariableOccurrence(s) :** jusqu’à quatre par participant ; **StudyUnit :** participant.
- **Planned source :** laboratoire prévu ; **Actual source :** par occurrence ; **Planned method :** même MD prévue ; **Actual method :** version par occurrence ; **Value/value status :** indépendant par temps ; **Unit :** par occurrence ; **Quality :** par occurrence ; **Missingness :** chaque attente non réalisée est qualifiée séparément.
- **Transformations :** conversion éventuelle tracée ; **Derivations :** aucune par défaut ; **Analysis refs éventuelles :** modèle longitudinal futur.
- **Owner :** Project/CDM selon plan ; **Decision owner :** humain Project ; **Correction owner :** laboratoire/Data ; **Version owner :** owners respectifs ; **Provenance :** quatre chaînes ; **Lineage :** chaque occurrence → même Variable + occasion ; **Unknowns :** temps/méthode inconnus restent inconnus ; **Contradictions :** méthodes divergentes visibles ; **Objects NOT created :** `TROPONIN_T0/H6/H12/H24` comme Variables ; **Projection consequences :** SoA/CRF/dataset projettent quatre occurrences d’une identité.

### C — Même Variable recueillie dans le CRF et utilisée dans le SAP

- **ScientificModel refs :** `CASE-C-SM` éventuel ; **ObservableProperty refs :** `CASE-C-OP` éventuel ; **MeasurementDefinition refs :** `CASE-C-MD` ; **DataNeed refs :** `CASE-C-DN`.
- **CanonicalVariable :** `CASE-C-VAR` référencée par collecte et analyse ; **Expected Occasion :** selon Project ; **VariableOccurrence(s) :** réalisées depuis la collecte ; **StudyUnit :** unité Project.
- **Planned source :** CRF comme projection de collecte, source réelle distincte ; **Actual source :** système/source productrice ; **Planned method :** MD prévue ; **Actual method :** conservée ; **Value/value status :** occurrence ; **Unit :** canonique/réelle/analysis séparées ; **Quality :** transmise ; **Missingness :** fait CDM, stratégie SAP séparée.
- **Transformations :** analytiques sous AnalysisSpecification ; **Derivations :** seulement si nouvelle donnée définie ; **Analysis refs éventuelles :** SAP/AnalysisSpecification consumer.
- **Owner :** Project pour Variable ; **Decision owner :** Project/Biostatistics selon acte ; **Correction owner :** Data/source ; **Version owner :** Project/CDM/Analysis séparés ; **Provenance :** collecte → occurrence → analyse ; **Lineage :** CanonicalVariableRef commun ; **Unknowns :** non comblés par SAP ; **Contradictions :** visibles ; **Objects NOT created :** variable SAP parallèle ; **Projection consequences :** CRF et SAP portent la même référence.

### D — Labels différents CRF / dataset / SAP

- **ScientificModel refs :** `CASE-D-SM` ; **ObservableProperty refs :** `CASE-D-OP`; **MeasurementDefinition refs :** `CASE-D-MD`; **DataNeed refs :** `CASE-D-DN`.
- **CanonicalVariable :** `VAR-INFARCT-SIZE` ; **Expected Occasion :** primary assessment ; **VariableOccurrence(s) :** selon unités ; **StudyUnit :** examen/participant selon définition.
- **Planned source :** source d’imagerie prévue ; **Actual source :** examen réel ; **Planned method :** MD prévue ; **Actual method :** méthode/version réelle ; **Value/value status :** qualifié ; **Unit :** réelle ; **Quality :** occurrence quality ; **Missingness :** raison par occurrence.
- **Transformations :** éventuelle normalisation ; **Derivations :** règle de mesure si dérivée ; **Analysis refs éventuelles :** AnalysisSpecification.
- **Owner :** Project ; **Decision owner :** humain ; **Correction owner :** Imaging/Data ; **Version owner :** Project/CDM ; **Provenance :** complète ; **Lineage :** source → occurrence → dataset ; **Unknowns :** mapping externe possible ; **Contradictions :** labels divergents ne sont pas contradiction de sens ; **Objects NOT created :** `infarct_size`, `INF_SIZE` ou label SAP comme Variables ; **Projection consequences :** CRF « Infarct size », dictionary `infarct_size`, dataset `INF_SIZE`, SAP label et code externe référencent tous `VAR-INFARCT-SIZE`.

### E — Échocardiographie de soin courant réutilisée

- **ScientificModel refs :** `CASE-E-SM` ; **ObservableProperty refs :** `CASE-E-OP` selon usage ; **MeasurementDefinition refs :** méthode Echo réelle ; **DataNeed refs :** besoin Project de réutilisation.
- **CanonicalVariable :** variable Project seulement après décision ; **Expected Occasion :** éventuellement aucune collecte study-mandated, mais fenêtre d’éligibilité ; **VariableOccurrence(s) :** résultats réutilisés ; **StudyUnit :** examen/participant.
- **Planned source :** soin courant éligible ; **Actual source :** système Echo de soin ; **Planned method :** famille/méthode admissible ; **Actual method :** version réellement documentée ; **Value/value status :** selon examen ; **Unit :** réelle ; **Quality :** connue/inconnue ; **Missingness :** absence de dossier distincte de non-applicabilité.
- **Transformations :** import/canonicalisation traçable ; **Derivations :** aucune implicite ; **Analysis refs éventuelles :** consumer éventuel.
- **Owner :** source externe pour production, Project pour usage, CDM pour représentation ; **Decision owner :** humain Project ; **Correction owner :** source/Data selon mandat ; **Version owner :** owners séparés ; **Provenance :** `ROUTINE_CARE` immuable ; **Lineage :** examen original → occurrence ; **Unknowns :** méthode/qualité non documentées ; **Contradictions :** source déclarée vs vérifiée ; **Objects NOT created :** procédure study-mandated ; **Projection consequences :** CRF/dataset signalent origine routine care.

### F — Troponine répétée, laboratoire central puis local

- **ScientificModel refs :** `CASE-F-SM` ; **ObservableProperty refs :** `CASE-F-OP` ; **MeasurementDefinition refs :** MD centrale prévue + MD locale réelle ; **DataNeed refs :** `CASE-F-DN`.
- **CanonicalVariable :** `CASE-F-TROPONIN` unique si sens stable ; **Expected Occasion :** occasions répétées ; **VariableOccurrence(s) :** centrale puis locale ; **StudyUnit :** participant.
- **Planned source :** laboratoire central ; **Actual source :** central pour certaines occurrences, local pour d’autres ; **Planned method :** assay central ; **Actual method :** assay/version par laboratoire ; **Value/value status :** par occurrence ; **Unit :** unités réelles ; **Quality :** par lot/lab ; **Missingness :** indépendant.
- **Transformations :** conversion/harmonisation seulement si gouvernée ; **Derivations :** aucune fusion implicite ; **Analysis refs éventuelles :** comparaison/sensibilité future.
- **Owner :** Project/CDM/Laboratory ; **Decision owner :** Project pour acceptation, Analysis pour usage ; **Correction owner :** laboratoire/Data ; **Version owner :** owners ; **Provenance :** lab/kit/lot/version ; **Lineage :** chaque résultat source conservé ; **Unknowns :** comparabilité ; **Contradictions :** qualifications divergentes ouvertes ; **Objects NOT created :** Variable locale automatique ; **Projection consequences :** dataset conserve méthode/source et ne concatène pas sans règle.

### G — Valeur absente

- **ScientificModel refs :** selon Variable ; **ObservableProperty refs :** selon Variable ; **MeasurementDefinition refs :** prévue ; **DataNeed refs :** besoin couvert attendu.
- **CanonicalVariable :** identité existante ; **Expected Occasion :** présente ; **VariableOccurrence(s) :** occurrence d’absence qualifiée ou attente non réalisée liée ; **StudyUnit :** unité attendue.
- **Planned source :** connue ; **Actual source :** absente/inconnue selon fait ; **Planned method :** connue ; **Actual method :** non réalisée ou inconnue ; **Value/value status :** `MISSING_EXPECTED`/`NOT_COLLECTED`/autre raison exacte ; **Unit :** attendue seulement ; **Quality :** non évaluée, pas « bonne » ; **Missingness :** raison explicite.
- **Transformations :** aucune ; **Derivations :** outputs dépendants bloqués ou missing qualifié ; **Analysis refs éventuelles :** stratégie future seulement.
- **Owner :** Project/CDM ; **Decision owner :** Data/Project pour disposition ; **Correction owner :** source/Data ; **Version owner :** CDM/Data ; **Provenance :** attente et constat ; **Lineage :** occasion → absence ; **Unknowns :** cause si non établie ; **Contradictions :** déclarations incompatibles conservées ; **Objects NOT created :** valeur zéro/négative ; **Projection consequences :** missingness visible dans toutes les projections.

### H — Valeur invalide

- **ScientificModel refs :** selon Variable ; **ObservableProperty refs :** selon Variable ; **MeasurementDefinition refs :** réelle ; **DataNeed refs :** besoin Project.
- **CanonicalVariable :** inchangée ; **Expected Occasion :** satisfaite par tentative ; **VariableOccurrence(s) :** occurrence avec contenu éventuel et `INVALID`; **StudyUnit :** unité réelle.
- **Planned source :** prévue ; **Actual source :** réelle ; **Planned method :** prévue ; **Actual method :** réelle ; **Value/value status :** valeur brute conservée si autorisée + invalidité ; **Unit :** réelle ; **Quality :** échec documenté ; **Missingness :** distinct, éventuellement valeur non exploitable.
- **Transformations :** aucune promotion ; **Derivations :** outputs refusés ou limités ; **Analysis refs éventuelles :** exclusion documentée possible.
- **Owner :** CDM/Data pour statut, domaine pour critère ; **Decision owner :** humain mandaté pour usage ; **Correction owner :** source/Data ; **Version owner :** CDM/Data ; **Provenance :** contrôle/règle/version ; **Lineage :** source → invalid occurrence ; **Unknowns :** cause si inconnue ; **Contradictions :** contrôle divergent conservé ; **Objects NOT created :** valeur manquante substitutive ; **Projection consequences :** état invalid visible.

### I — Valeur non applicable

- **ScientificModel refs :** contexte qui borne l’applicabilité ; **ObservableProperty refs :** éventuelle ; **MeasurementDefinition refs :** éventuelle ; **DataNeed refs :** besoin conditionnel.
- **CanonicalVariable :** conservée ; **Expected Occasion :** conditionnelle ou non applicable ; **VariableOccurrence(s) :** qualification d’applicabilité, sans fausse valeur ; **StudyUnit :** unité hors condition.
- **Planned source :** conditionnelle ; **Actual source :** aucune attendue ; **Planned method :** conditionnelle ; **Actual method :** aucune ; **Value/value status :** `NOT_APPLICABLE`; **Unit :** sans objet ; **Quality :** sans objet ; **Missingness :** non-applicabilité, pas missing attendu.
- **Transformations :** aucune ; **Derivations :** aucune ; **Analysis refs éventuelles :** règle d’exclusion contextuelle possible.
- **Owner :** Project pour condition ; **Decision owner :** humain Project ; **Correction owner :** Project si condition erronée ; **Version owner :** Project/CDM ; **Provenance :** justification d’applicabilité ; **Lineage :** condition → statut ; **Unknowns :** conservés ; **Contradictions :** critères concurrents visibles ; **Objects NOT created :** valeur négative ou occurrence de mesure réalisée ; **Projection consequences :** cellule SoA/CRF explicitement non applicable.

### J — Mesure réalisée mais non évaluable

- **ScientificModel refs :** `CASE-J-SM`; **ObservableProperty refs :** `CASE-J-OP`; **MeasurementDefinition refs :** `CASE-J-MD`; **DataNeed refs :** `CASE-J-DN`.
- **CanonicalVariable :** `CASE-J-VAR`; **Expected Occasion :** réalisée ; **VariableOccurrence(s) :** tentative/source présente avec `NOT_EVALUABLE`; **StudyUnit :** examen/image/Biospecimen selon cas.
- **Planned source :** source prévue ; **Actual source :** artefact réel ; **Planned method :** MD prévue ; **Actual method :** méthode exécutée ; **Value/value status :** aucun contenu exploitable ou contenu conservé sous restriction ; **Unit :** si produite ; **Quality :** insuffisance qualifiée ; **Missingness :** non-évaluabilité distincte d’absence.
- **Transformations :** processing tenté conservé ; **Derivations :** variable dérivée bloquée si input critique ; **Analysis refs éventuelles :** input refusé/limité.
- **Owner :** domaine/source/CDM selon acte ; **Decision owner :** humain pour usage ; **Correction owner :** source/Data ; **Version owner :** CDM/Data ; **Provenance :** acte, artefact et contrôle ; **Lineage :** source présente → tentative → état ; **Unknowns :** cause résiduelle ; **Contradictions :** readers/contrôles divergents ; **Objects NOT created :** valeur normale, invalidité automatique ; **Projection consequences :** réalisation et non-évaluabilité affichées ensemble.

### K — Changement d’unité avec conversion

- **ScientificModel refs :** selon Variable ; **ObservableProperty refs :** cible stable ; **MeasurementDefinition refs :** méthode réelle ; **DataNeed refs :** besoin inchangé.
- **CanonicalVariable :** même identité si sens/conversion gouvernés ; **Expected Occasion :** inchangée ; **VariableOccurrence(s) :** occurrence source + représentation/occurrence convertie reliée ; **StudyUnit :** identique.
- **Planned source :** source prévue ; **Actual source :** réelle ; **Planned method :** prévue ; **Actual method :** réelle ; **Value/value status :** source et convertie `OBSERVED_VALUE`; **Unit :** source + target ; **Quality :** précision/arrondi documentés ; **Missingness :** propagé, jamais transformé en valeur.
- **Transformations :** rule/version/parameters obligatoires ; **Derivations :** conversion non scientifique par défaut ; **Analysis refs éventuelles :** unité d’analyse consumer.
- **Owner :** Project pour Variable, CDM/Data pour conversion ; **Decision owner :** Data/Project selon règle ; **Correction owner :** Data ; **Version owner :** owner de règle/occurrences ; **Provenance :** valeur et unité originales ; **Lineage :** source → conversion → target ; **Unknowns :** compatibilité/precision ; **Contradictions :** règles concurrentes visibles ; **Objects NOT created :** nouvelle Variable sur unité seule ; **Projection consequences :** display/export units peuvent différer sans perte.

### L — Changement de méthode entre deux occurrences

- **ScientificModel refs :** `CASE-L-SM`; **ObservableProperty refs :** `CASE-L-OP`; **MeasurementDefinition refs :** `CASE-L-MD1` et `CASE-L-MD2`; **DataNeed refs :** `CASE-L-DN`.
- **CanonicalVariable :** une identité si même sens Project ; **Expected Occasion :** deux ou plus ; **VariableOccurrence(s) :** chacune avec méthode réelle ; **StudyUnit :** même type/unité.
- **Planned source :** selon plan ; **Actual source :** par occurrence ; **Planned method :** MD1 ; **Actual method :** MD1 puis MD2 ; **Value/value status :** par occurrence ; **Unit :** réelle ; **Quality :** par méthode ; **Missingness :** indépendant.
- **Transformations :** harmonisation seulement si qualifiée ; **Derivations :** aucune fusion ; **Analysis refs éventuelles :** spécification distincte ou covariate méthode.
- **Owner :** OBS/domaines pour méthodes, Project pour choix, CDM pour réalisation ; **Decision owner :** humain Project/Analysis ; **Correction owner :** source/Data ; **Version owner :** owners ; **Provenance :** méthode/version ; **Lineage :** chaque occurrence → MD réelle ; **Unknowns :** comparabilité ; **Contradictions :** conservées ; **Objects NOT created :** Variable par méthode automatique ; **Projection consequences :** dataset ne fusionne pas sur variableId seul.

### M — Variable dérivée de deux Variables sources

- **ScientificModel refs :** `CASE-M-SM` éventuel ; **ObservableProperty refs :** sortie si mesure dérivée ; **MeasurementDefinition refs :** MD dérivée ou règle Project ; **DataNeed refs :** `CASE-M-DN`.
- **CanonicalVariable :** `CASE-M-DERIVED` décidée + deux source refs ; **Expected Occasion :** compatible avec les inputs ; **VariableOccurrence(s) :** deux parents et un output ; **StudyUnit :** même unité ou relation explicite.
- **Planned source :** occurrences canoniques ; **Actual source :** ids/versions exacts ; **Planned method :** derivation definition ; **Actual method :** rule/version exécutée ; **Value/value status :** output ou raison de non-calcul ; **Unit :** dérivée ; **Quality :** propagation explicite ; **Missingness :** règle préspécifiée.
- **Transformations :** exécution de dérivation ; **Derivations :** parents exhaustifs ; **Analysis refs éventuelles :** consumer, pas nécessaire à la création.
- **Owner :** Project pour Variable/règle adoptée, CDM/Data pour exécution ; **Decision owner :** humain Project ; **Correction owner :** Data/owner de règle ; **Version owner :** owners ; **Provenance :** inputs/rule/context ; **Lineage :** parents → output ; **Unknowns :** paramètres/compatibilité ; **Contradictions :** règles concurrentes non fusionnées ; **Objects NOT created :** AnalysisResult si donnée unitaire réutilisable ; **Projection consequences :** CRF peut ne pas la collecter, dataset la projette avec lineage.

### N — ECV avec hématocrite externe

- **ScientificModel refs :** `CASE-N-SM`; **ObservableProperty refs :** `CASE-N-OP-ECV`; **MeasurementDefinition refs :** MD dérivée ECV + MD hématocrite externe ; **DataNeed refs :** besoins inputs/ECV adoptés.
- **CanonicalVariable :** ECV dérivée si sens stable + Variables inputs ; **Expected Occasion :** fenêtres temporelles compatibles décidées ; **VariableOccurrence(s) :** imagerie inputs, hématocrite, output éventuel ; **StudyUnit :** examen/participant avec relations.
- **Planned source :** imagerie + laboratoire prévu ; **Actual source :** sources exactes, hématocrite potentiellement externe/routine ; **Planned method :** MDs prévues ; **Actual method :** versions réelles ; **Value/value status :** output ou `NOT_EVALUABLE`/missing raison ; **Unit :** inputs/output ; **Quality :** par source + propagation ; **Missingness :** input critique absent bloque selon règle.
- **Transformations :** calcul ECV versionné ; **Derivations :** toutes occurrences parentes ; **Analysis refs éventuelles :** analyses consommatrices.
- **Owner :** Imaging/Laboratory/Project/CDM séparés ; **Decision owner :** humain Project ; **Correction owner :** source/Data ; **Version owner :** owner de chaque définition ; **Provenance :** inter-domaines ; **Lineage :** inputs → output ; **Unknowns :** timing/comparabilité ; **Contradictions :** méthodes divergentes visibles ; **Objects NOT created :** Biospecimen implicite ou valeur ECV sans inputs ; **Projection consequences :** dataset doit transporter toute la chaîne.

### O — Segmentation → volume → occurrence

- **ScientificModel refs :** `CASE-O-SM`; **ObservableProperty refs :** `CASE-O-OP-VOLUME`; **MeasurementDefinition refs :** image + segmentation/quantification ; **DataNeed refs :** `CASE-O-DN`.
- **CanonicalVariable :** volume dérivé décidé ; **Expected Occasion :** examen/temps prévu ; **VariableOccurrence(s) :** image refs, segmentation product, volume occurrence ; **StudyUnit :** examen → série/image → ROI/lésion.
- **Planned source :** acquisition Imaging prévue ; **Actual source :** DICOM/source réelle ; **Planned method :** pipeline prévu ; **Actual method :** reader/algorithm/software versions ; **Value/value status :** volume ou non-évaluable ; **Unit :** réelle ; **Quality :** acquisition/segmentation/occurrence séparées ; **Missingness :** image absente vs segmentation inexploitable distinguées.
- **Transformations :** segmentation/quantification executions ; **Derivations :** image/ROI parents ; **Analysis refs éventuelles :** downstream.
- **Owner :** Imaging pour méthode, Project pour Variable, CDM/Data pour lineage ; **Decision owner :** humain ; **Correction owner :** Imaging/Data ; **Version owner :** owners ; **Provenance :** DICOM/reader/software ; **Lineage :** study → series → segmentation → volume ; **Unknowns :** compatibilité/reader ; **Contradictions :** contours concurrents conservés ; **Objects NOT created :** interprétation clinique ; **Projection consequences :** Core Lab/dataset montrent version et adjudication.

### P — Biospecimen → aliquot → analyse

- **ScientificModel refs :** `CASE-P-SM`; **ObservableProperty refs :** analyte/property si adoptée ; **MeasurementDefinition refs :** assay/version ; **DataNeed refs :** besoin biologique.
- **CanonicalVariable :** résultat d’assay seulement, pas le specimen ; **Expected Occasion :** collecte et mesure attendues distinctes ; **VariableOccurrence(s) :** résultat par aliquot/assay ; **StudyUnit :** participant → collection → Biospecimen → aliquot.
- **Planned source :** biobanque/laboratoire prévus ; **Actual source :** specimen/aliquot/lab réels ; **Planned method :** assay prévu ; **Actual method :** kit/lot/instrument ; **Value/value status :** résultat ou statut ; **Unit :** réelle ; **Quality :** specimen + assay + occurrence ; **Missingness :** specimen absent, indisponible ou assay invalide distingués.
- **Transformations :** processing/aliquoting non confondus avec dérivation de valeur ; **Derivations :** occurrence liée au specimen exact ; **Analysis refs éventuelles :** assay/analysis consumer.
- **Owner :** Biobanking/Laboratory/Project/CDM ; **Decision owner :** humain Project ; **Correction owner :** source/Data ; **Version owner :** owners ; **Provenance :** chaîne de garde ; **Lineage :** participant → specimen → aliquot → assay → occurrence ; **Unknowns :** conditions manquantes ; **Contradictions :** ids/quantités divergents ; **Objects NOT created :** Variable « aliquot » ; **Projection consequences :** inventory et data projections restent distincts.

### Q — Fécothèque sans analyse sélectionnée

- **ScientificModel refs :** éventuel usage futur non adopté ; **ObservableProperty refs :** aucune requise ; **MeasurementDefinition refs :** aucune assay inventée ; **DataNeed refs :** plan de collection ou option future Project.
- **CanonicalVariable :** aucune Variable analytique ; **Expected Occasion :** occasions de collection Biospecimen, pas de variable analytique ; **VariableOccurrence(s) :** aucune mesure analytique ; **StudyUnit :** participant → collection → Biospecimen → aliquots.
- **Planned source :** collection/biobanque ; **Actual source :** specimens réels si collectés ; **Planned method :** procédure de collection/processing seulement ; **Actual method :** réalisation réelle ; **Value/value status :** attributs matériels, pas résultats analytiques ; **Unit :** quantité matérielle si applicable ; **Quality :** specimen quality ; **Missingness :** collection non réalisée/indisponibilité qualifiées.
- **Transformations :** processing/aliquoting matériels ; **Derivations :** parentage Biospecimen ; **Analysis refs éventuelles :** aucune.
- **Owner :** Biobanking/Project ; **Decision owner :** humain Project ; **Correction owner :** Biobank/Data ; **Version owner :** Biospecimen owner ; **Provenance :** collecte/stockage/chaîne ; **Lineage :** collection → specimen → aliquots ; **Unknowns :** usages futurs ; **Contradictions :** plans futurs incompatibles visibles ; **Objects NOT created :** BiomarkerRole, MD analytique, Variable analytique, AnalysisSpecification, AnalysisResult ; **Projection consequences :** inventaire/projection Biospecimen uniquement.

### R — Wearable longitudinal avec périodes manquantes

- **ScientificModel refs :** `CASE-R-SM`; **ObservableProperty refs :** `CASE-R-OP`; **MeasurementDefinition refs :** device/algorithm versionnés ; **DataNeed refs :** longitudinal.
- **CanonicalVariable :** signal/résumé défini selon contrat ; **Expected Occasion :** période/fenêtres, event-based ou continuous ; **VariableOccurrence(s) :** série ou occurrences par politique ; **StudyUnit :** participant → device → intervalle.
- **Planned source :** wearable prévu ; **Actual source :** device/hardware/software réels ; **Planned method :** sampling/aggregation prévus ; **Actual method :** versions/configuration ; **Value/value status :** segments observés et trous ; **Unit :** réelle ; **Quality :** signal/wear-time ; **Missingness :** non-port, perte signal, indisponibilité et inconnue distingués.
- **Transformations :** agrégation versionnée ; **Derivations :** résumés liés aux segments ; **Analysis refs éventuelles :** longitudinales futures.
- **Owner :** Device domain/Project/CDM ; **Decision owner :** humain Project ; **Correction owner :** source/Data ; **Version owner :** owners ; **Provenance :** device/firmware/algorithm/time sync ; **Lineage :** samples/segments → résumé ; **Unknowns :** cause des trous ; **Contradictions :** clocks/versions divergentes ; **Objects NOT created :** visite artificielle par période ; **Projection consequences :** dataset conserve couverture et gaps.

### S — Mapping externe CDISC / FHIR / OMOP

- **ScientificModel refs :** ceux de la Variable source ; **ObservableProperty refs :** inchangées ; **MeasurementDefinition refs :** inchangées ; **DataNeed refs :** inchangés.
- **CanonicalVariable :** `CASE-S-VAR` NOXIA reste canonique ; **Expected Occasion :** inchangée ; **VariableOccurrence(s) :** source des projections ; **StudyUnit :** relations mappées explicitement.
- **Planned source :** NOXIA canonical ; **Actual source :** occurrence canonique ou import externe qualifié ; **Planned method :** mapping/version ; **Actual method :** standard/version réellement appliqué ; **Value/value status :** préservé ; **Unit :** mapping UCUM éventuel ; **Quality :** mapping review ; **Missingness :** non aplati.
- **Transformations :** projection d’échange ; **Derivations :** lineage vers représentation externe ; **Analysis refs éventuelles :** ADaM-like seulement si applicable.
- **Owner :** owner identité + gouvernance terminologique ; **Decision owner :** humain mandaté ; **Correction owner :** mapping owner ; **Version owner :** mapping owner ; **Provenance :** source/cible/version ; **Lineage :** NOXIA → mapping → projection ; **Unknowns :** équivalence partielle ; **Contradictions :** mappings concurrents conservés ; **Objects NOT created :** Variable par code externe ; **Projection consequences :** CDISC/FHIR/OMOP restent projections/mappings.

### T — Cas intégrateur majeur 1 OP → 2 MD → 1 Variable → 3 Occurrences → 2 Analyses → 3 Résultats

- **ScientificModel refs :** `CASE-T-SM`; **ObservableProperty refs :** une `CASE-T-OP`; **MeasurementDefinition refs :** `CASE-T-MD-A`, `CASE-T-MD-B` non supposées interchangeables ; **DataNeed refs :** un besoin Project borné.
- **CanonicalVariable :** `CASE-T-VAR` unique ; **Expected Occasion :** trois occasions ou contextes qualifiés ; **VariableOccurrence(s) :** `OCC-T1/T2/T3`, chacune vers la même Variable et sa MD réelle ; **StudyUnit :** unité qualifiée commune ou relations explicites.
- **Planned source :** sources/MD prévues par occasion ; **Actual source :** trois sources exactes ; **Planned method :** MD-A/MD-B selon plan ; **Actual method :** versions réellement utilisées ; **Value/value status :** trois statuts/valeurs indépendants ; **Unit :** source et canonique conservées ; **Quality :** par occurrence ; **Missingness :** par occurrence, aucun défaut implicite.
- **Transformations :** canonicalisation/harmonisation seulement si règles admises ; **Derivations :** parents exhaustifs ; **Analysis refs éventuelles :** deux AnalysisSpecifications distinctes, leurs executions, trois AnalysisResults distincts.
- **Owner :** OBS/domaines pour MD, Project pour Variable/choix, CDM/Data pour occurrences, owners analytiques pour résultats ; **Decision owner :** humains mandatés ; **Correction owner :** source/Data/Analysis selon objet ; **Version owner :** chaque owner ; **Provenance :** complète par nœud/arête ; **Lineage :** OP → MDs → Variable → occurrences → executions → résultats ; **Unknowns :** comparabilité non inventée ; **Contradictions :** conservées ; **Objects NOT created :** seconde Variable, résultat fusionné, ScientificInterpretation automatique ; **Projection consequences :** deux datasets/analyses peuvent projeter la même identité avec sélections différentes, sans seconde vérité.

## 57. Vingt-quatre contrats de non-régression

| ID | Invariant | Résultat obligatoire | Échec bloquant |
|---|---|---|---|
| CDM-C01 | CanonicalVariable != VariableOccurrence | définition et réalisations séparées | valeur incluse dans la définition |
| CDM-C02 | identité indépendante du champ CRF | field name référence variableId | renommage crée une Variable |
| CDM-C03 | timepoint répété != nouvelle Variable | occasions/occurrences multiples | T0/H6 créent des identités |
| CDM-C04 | Routine Care != Study Mandated | origine réelle conservée | réutilisation réécrit le mandat |
| CDM-C05 | Missing != Negative | valeur négative reste observée | absence codée négative |
| CDM-C06 | Missing != Not Applicable | raison et applicabilité séparées | non-applicable traité absent |
| CDM-C07 | Invalid != Missing | invalidité et réalisation visibles | invalide aplati en absence |
| CDM-C08 | Not Evaluable != Invalid | tentative/artefact et aptitude séparés | synonymie imposée |
| CDM-C09 | Biospecimen != Variable | identité matérielle distincte | aliquot devient Variable |
| CDM-C10 | Source != MeasurementDefinition | origine et méthode séparées | système source définit la méthode |
| CDM-C11 | planned method != actual method | deux refs/versions conservées | plan réécrit par le réel |
| CDM-C12 | planned source != actual source | deux sources conservées | source prévue écrasée |
| CDM-C13 | conversion conserve original et lignage | source value/unit + règle + output | conversion destructive |
| CDM-C14 | dérivation conserve chaque parent | toutes occurrences sources liées | parent omis |
| CDM-C15 | Data Management ne redéfinit pas Variable | Contribution amont | correction de sens locale |
| CDM-C16 | Biostatistics ne redéfinit pas Variable | rôle analytique séparé | SAP/dataset change le sens |
| CDM-C17 | CRF ne crée pas Variable | projection référence Project | champ orphelin promu |
| CDM-C18 | Dataset ne crée pas seconde identité | colonnes → canonical refs | colonne devient canonique |
| CDM-C19 | code externe ne remplace pas identité NOXIA | TerminologyMapping versionné | code = primary identity |
| CDM-C20 | AnalysisResult != ScientificInterpretation | résultat puis décision humaine | sortie statistique = conclusion |
| CDM-C21 | correction n’efface pas l’histoire | supersession et audit | overwrite |
| CDM-C22 | Unknown reste unknown | aucun défaut plausible | remplissage silencieux |
| CDM-C23 | contradiction reste visible | positions + contexte + owner | sélection silencieuse |
| CDM-C24 | mêmes inputs/versions/transformation → même résultat dérivé canonique | reproductibilité logique | variation non expliquée |

## 58. Impacts moteurs

`Breaking?` exprime un risque de contrat pour une future consommation CDM ; il ne constate aucune adaptation actuelle.

| Engine | Current normative contract | CDM dependency | Required adaptation | Breaking? | Adapter needed? | Implementation required? | Evaluation required? |
|---|---|---|---|---|---|---|---|
| Knowledge | KE-001 : assertions, preuves, gaps, contexte | références sans devenir source Study Data | distinguer Source scientifique et StudyDataSource | potentiel si fusion | à déterminer | mission séparée | oui |
| Scientific Thinking | RDE/PD-005 : modèles, options, contributions | DataNeeds/Variables proposées puis décidées | produire des refs V2 sans occurrence | oui pour sorties V1 composites | probable | mission séparée | oui |
| OBS | OBS-001 : propriété, mesure, rôle, qualité attendue | versions/méthodes/limites à préserver | handoff CDM référencé, aucun transfert | non normatif | limité | mission séparée | oui |
| Imaging | RDE-003/IMG : mesure/lecture/QA | sources, unités de contexte, occurrences, lineage | séparer définition, exécution, donnée et analyse | potentiel | probable | mission séparée | oui |
| Research Project | RDE-001/002, PD-003 | owner DataNeeds, Variables, attentes | produire paquet Project→CDM complet | oui pour writers V1 | probable | mission séparée | oui |
| REG | REG-001 : requirements/applicabilité | faits Study Data bornés | référencer, ne pas redéfinir | non par principe | à déterminer | mission séparée | oui si adapté |
| DOC-002 | patterns documentaires | patterns de projection data | conserver limites et ownership | potentiel | à déterminer | mission séparée | oui |
| TMP | structure logique | CRF/Data Dictionary/SAP/SoA structures | référencer CDM, ne créer aucune Variable | oui pour templates déclarés CDM | probable | mission séparée | oui |
| DOC | projection/rendu | valeurs/statuts/provenance autorisés | rendre identités et limites sans mutation | oui pour projections CDM | probable | mission séparée | oui |
| VAL | diagnostics read-only | neuf checkpoints futurs | invariants CDM sans correction/validité scientifique | nouvelle couverture | oui | mission séparée | oui, constitutif |
| future Data Management | responsabilité non admise | contrat opérationnel canonique | implémenter sans ownership scientifique | nouvelle brique | non applicable | oui, future mission | oui |
| future Biostatistics | responsabilité non admise | inputs contextualisés et résultats liés | séparer rôle analytique, méthode, résultat, interprétation | nouvelle brique | non applicable | oui, future mission | oui |

La matrice détaillée figure dans `docs/cdm-001-engine-impact-matrix.md`. Aucune adaptation réelle n’est réalisée.

## 59. Future VAL checkpoints

| Checkpoint | Fidélité à vérifier | Promotions interdites |
|---|---|---|
| ResearchProject → CDM | ids, versions, owners, attentes, décisions, unknowns | champ manquant inventé |
| OBS → CDM | OP/MD refs, conditions, qualité, comparabilité | occurrence redéfinit MD |
| CDM definition → CRF | canonical ids, occasions, domains | champ crée Variable |
| CDM definition → Data Dictionary | noms projetés et sens | dictionnaire devient registry |
| CDM → Data Management | occurrences, statuts, sources, lineage | Data modifie sens |
| CDM → Biostatistics | contextes, méthodes, qualité, missingness | matrice numérique sans contexte |
| CDM → Dataset | sélection, filtres, transformations, freeze | colonne crée identité |
| Analysis → CDM | specs/executions/inputs/results | résultat devient interprétation |
| CDM → Documents | provenance, limites, restrictions | projection corrige le fond |

Chaque checkpoint compare conservé, perdu, ajouté, renforcé, affaibli, non mappé, changement de statut, rupture de provenance, unknown/contradiction/missingness/lineage et promotions interdites. VAL reste diagnostique ; une conformité structurelle ne déclare jamais une donnée scientifiquement valide.

## 60. Future PD-011 evaluation

Une future campagne distincte devra couvrir cas simples, legacy, missingness, longitudinal, multi-source, multi-method, derived data, corrections/audit, standards mapping, Imaging, Laboratory et Biospecimen ; utiliser les vingt cas A–T et les vingt-quatre contrats CDM-C01–C24 ; geler versions, mappings, fixtures et références ; établir golden examples et failure modes ; rapporter fidélité d’identité, provenance, lignage, statuts, reproductibilité et charge de correction.

Tolérance nulle candidate pour : Variable assimilée à occurrence ; timepoint créant une identité ; routine care réécrit ; source/méthode/unité originale perdue ; missing assimilé à négatif ; correction destructive ; dérivation sans parents ; code externe remplaçant NOXIA ; CRF/dataset créant une Variable ; analyse changeant le sens ; contradiction ou provenance critique supprimée.

Aucun seuil continu ni PASS n’est fixé ici. PD-011 seul gouvernera protocole, métriques, jeux, indépendance, PASS/FAIL/NON CONCLUANT et publication.

## 61. Governance

CDM-001 évolue lorsqu’une décision modifie : contrat Study Data d’une construction PD-003 ; frontière Project/OBS/CDM/Data/Analysis ; identité/version ; axes de valeur/missingness/qualité ; temporalité ; sources ; transformation/lignage ; mapping externe ; correction/audit ; handoff ; relation ou classification de projection.

Il ne doit jamais évoluer pour refléter une base, un format, une colonne, un standard externe, une UI, un LLM/provider, une campagne SEM, une panne, un quota, un moteur momentanément absent ou un dataset particulier.

Tout changement de sens d’un objet/relation/invariant PD-003 exige une évolution PD-003 préalable. Tout changement du sens général de la mesure exige un arbitrage OBS. Une Contribution aval n’est jamais une mutation directe. Les dix compagnons sont subordonnés à cette source maîtresse.

## 62. Limitations

1. Aucun moteur, stockage, schéma, API, UI, eCRF, CRF, Data Dictionary, SAP, dataset ou échange n’est créé.
2. Aucun Data Management ou Biostatistics normatif/implémenté n’est admis ; seules leurs frontières sont préparées.
3. Aucun catalogue réel de Variables, unités, ValueDomains, méthodes, sources, terminologies ou mappings n’est fourni.
4. Aucun artefact V1 n’est inventorié ou migré ; la compatibilité est un contrat de lecture.
5. Aucun standard externe n’est implémenté ni déclaré universellement compatible.
6. Aucune donnée patient, valeur scientifique, protocole, recommandation ou interprétation clinique n’est produite.
7. Les reports V1 démontrent des capacités bornées non conformes par défaut à CDM-001 ; aucune adaptation n’a été testée.
8. Aucun checkpoint VAL ni campagne PD-011 CDM n’est réalisé.
9. L’instance organisationnelle CDM, Data Management et Biostatistics reste à instituer.
10. L’admission documentaire ne vaut ni implémentation, ni activation, ni validité scientifique, ni publication.
11. La mission est indépendante de tout provider live ; aucun appel Gemini, SEM, benchmark provider ou quota externe n’a été utilisé.

## 63. Next steps

1. Spécifier séparément l’architecture normative Data Management, subordonnée à CDM-001, sans implémentation implicite.
2. Spécifier séparément l’architecture Biostatistics et son handoff Analysis, sans modifier les Variables sources.
3. Définir une mission d’adaptation par consumer, incluant crosswalk et refus avant toute écriture CDM.
4. Préparer les neuf checkpoints VAL et une campagne PD-011 indépendante avec fixtures gelées.
5. N’autoriser aucun stockage, mapping, migration ou activation avant admission de ses contrats et preuve proportionnée.

`CDM001_CANONICAL_STUDY_DATA_MODEL_ADMITTED_WITH_LIMITATIONS`
