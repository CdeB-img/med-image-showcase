# OBS-001 — Observability & Measurement Architecture

## Architecture normative du domaine d’observabilité et de mesure NOXIA

| Champ | Valeur |
|---|---|
| Identifiant documentaire | OBS-001 |
| Version | 1.0 |
| Statut | `OFFICIAL — REFERENCE_NORMATIVE_SPECIALIZED_CURRENT` |
| Niveau documentaire | `NIVEAU_1 — référence normative spécialisée` |
| Source maîtresse | `docs/obs-001-observability-measurement-architecture.md` |
| Date d’effet | 12 août 2026 |
| Autorités supérieures | Charte fondatrice → Scientific Product Manifesto V2 → PD-003 V2 |
| Autorités coordonnées | PD-004, PD-005, PD-009, PD-011, RDE-001, RDE-002, RDE-003, KE-001 |
| Domaine d’autorité | contrat transversal des `ObservableProperty`, `MeasurementDefinition` et qualifications scientifiques générales des `BiomarkerRole` |
| Source de vocabulaire canonique | PD-003 V2 et ses annexes |
| Décision | `OBS001_OBSERVABILITY_MEASUREMENT_ARCHITECTURE_ADMITTED_WITH_LIMITATIONS` |

---

## 1. Décision

OBS-001 est admis comme référence normative spécialisée du domaine **Observability & Measurement**.

Il spécialise, sans les redéfinir, les objets canoniques `ObservableProperty` et `MeasurementDefinition`, ainsi que la qualification scientifique générale du rôle `BiomarkerRole`. Il organise leurs conditions, performances, limites, comparaisons, versions, références Knowledge et handoffs vers le `ResearchProject`.

L’admission est prononcée **avec limitations** parce qu’aucun moteur OBS, aucune migration V1, aucun catalogue d’équipements, aucun CDM, aucun moteur Data Management, aucun moteur Biostatistics et aucune campagne PD-011 ne sont réalisés. Ces absences n’empêchent pas de fixer le contrat conceptuel ; elles interdisent de présenter OBS comme implémenté, qualifié ou activé.

L’arbitrage ne requiert aucune évolution de PD-003 V2. Les besoins examinés sont représentables par les objets, rôles, relations, spécialisations et sous-ressources déjà admis. Les libellés candidats tels que `REQUIRES_CONDITION`, `HAS_PERFORMANCE` ou `COMPATIBLE_WITH` ne sont donc pas admis comme relations canoniques nouvelles : ils sont des significations portées par des qualifications gouvernées attachées aux objets ou relations PD-003 existants.

## 2. Autorités

### 2.1 Ordre d’autorité appliqué

La mission a commencé par le `SOURCE-OF-TRUTH-INDEX` courant, puis a consulté dans l’ordre imposé : Charte fondatrice ; Scientific Product Manifesto V2 ; Architecture Manifesto de l’Editorial Engine ; PD-003 V2 et ses cinq annexes demandées ; PD-004 ; PD-005 ; PD-009 ; PD-011 ; RDE-001 ; RDE-002 ; RDE-003 ; KE-001 ; les rapports d’état ST-001, IMG-001, IMG-001B, PRJ-001, REG-001, DOC-002, TMP-001, DOC-001B et VAL-000 ; enfin les compagnons MAN-001, SKM-000 et PD-003R1.

SKM-000 et PD-003R1 sont des travaux historiques/candidats. Ils expliquent l’origine de certaines questions, mais le Manifeste V2 et PD-003 V2 ont depuis arbitré les objets et relations. Ils ne peuvent donc ni étendre, ni contredire, ni compléter silencieusement le contrat courant.

### 2.2 Règles de préséance

1. La Charte gouverne les principes généraux.
2. Le Manifeste V2 gouverne les plans de vérité et responsabilités fondamentales.
3. PD-003 V2 gouverne exclusivement les catégories, objets, rôles, relations, identités et invariants canoniques.
4. OBS-001 gouverne uniquement leur sémantique spécialisée d’observabilité et de mesure.
5. RDE-003 et les autres domaines possèdent leurs spécialisations ; ils ne deviennent pas owners transversaux d’OBS.
6. PD-009 possède la prochaine action ; PD-011 possède l’évaluation et tout PASS/FAIL.
7. Les rapports d’implémentation décrivent un état daté et ne corrigent aucune norme.

Cette préséance est nécessaire pour éviter qu’un domaine spécialisé, un état runtime ou une facilité technique devienne une doctrine scientifique générale.

## 3. Baseline

### 3.1 Baseline normative

- Le Scientific Product Manifesto V2 est la constitution scientifique spécialisée courante.
- PD-003 V2 est le modèle métier canonique courant.
- `ScientificModel`, `ObservableProperty`, `MeasurementDefinition`, `DataNeed`, `VariableOccurrence`, `Biospecimen` et `AnalysisResult` sont déjà des objets canoniques.
- `BiomarkerRole` est un rôle ; `CanonicalVariable` une spécialisation ; `StudyDataSource` et `AnalysisExecution` des sous-ressources ; `TerminologyMapping` une relation ; `TemporalAnchor` un value object.
- Le type `Biomarqueur` V1 est `SUPERSEDED / LEGACY_ONLY` pour les nouvelles créations.

### 3.2 Baseline réellement implémentée

Les rapports ST-001, IMG-001/1B, PRJ-001, REG-001, DOC-002, TMP-001, DOC-001B et VAL-000 décrivent des capacités V1 bornées, encore fondées sur des projections ou contrats legacy. Aucun de ces rapports ne démontre une écriture ou une lecture conforme à OBS-001.

Les campagnes SEM et leur état, notamment SEM-001R3, sont hors périmètre. La présente mission est exclusivement documentaire et normative : elle ne dépend d’aucun provider LLM live, ne lance aucun appel Gemini, aucune campagne SEM, aucun benchmark provider et ne consomme aucun quota externe. Une panne, un quota ou un statut SEM ne peut ni bloquer ni influencer la décision OBS-001.

### 3.3 Hypothèses explicitement non transformées en faits

- l’existence future d’un moteur OBS ;
- l’existence d’un catalogue d’équipements gouverné ;
- la disponibilité de mappings legacy réels ;
- la validité scientifique d’une méthode particulière ;
- la comparabilité de deux méthodes ;
- les seuils, performances ou domaines applicables d’un corpus scientifique ;
- la structure future de stockage, d’API ou d’interface.

## 4. Mission

OBS-001 définit comment NOXIA représente :

> ce qui peut être observé → comment cela peut être mesuré → sous quelles conditions → avec quelles performances documentées → avec quelles limites → et dans quel contexte l’observable peut jouer un `BiomarkerRole`.

Sa mission est de rendre reconstructibles : l’identité de la propriété ; chaque définition de mesure ; les conditions d’applicabilité ; les sources Knowledge ; la signification des sorties ; les performances et incertitudes ; les méthodes alternatives ; la validité contextualisée des rôles biomarqueurs ; et le paquet remis au Project pour décision humaine.

Cette mission est justifiée par une séparation de responsabilités : Knowledge sait ce qui est affirmé et prouvé ; Scientific Models organisent une explication ; OBS qualifie l’observabilité et la mesure ; le Project décide ce qu’il veut obtenir ; CDM représentera les occurrences ; les domaines analytiques produiront leurs spécifications et résultats ; DOC projettera sans posséder le fond.

## 5. Frontières

### 5.1 OBS gouverne

- le contrat transversal et le cycle spécialisé d’`ObservableProperty` ;
- le contrat transversal et le cycle spécialisé de `MeasurementDefinition` ;
- les qualifications de conditions, performances, comparabilité, qualité attendue et dépendances ;
- la qualification scientifique générale et candidate d’un `BiomarkerRole` ;
- les contributions d’owners de domaine ;
- les handoffs `ScientificModel → OBS`, `Knowledge → OBS` et `OBS → ResearchProject` ;
- les diagnostics d’incomplétude propres à l’observabilité, sans créer un enum universel.

### 5.2 OBS ne gouverne jamais

- une assertion, une preuve, une controverse ou une force de preuve Knowledge ;
- l’adoption d’un ScientificModel ;
- un `DataNeed`, une `CanonicalVariable`, une `VariableOccurrence` ou un Endpoint ;
- une décision de modalité, collecte ou projet ;
- une `AnalysisSpecification`, une `AnalysisExecution`, un `AnalysisResult` ou une interprétation ;
- une donnée individuelle, un protocole d’acquisition, un catalogue d’équipements, un document ou une publication ;
- la prochaine action, un PASS/FAIL PD-011 ou une décision humaine.

La frontière est opposable : une sortie OBS qui contient l’un de ces engagements est une violation d’ownership, pas une extension commode.

## 6. Plans de vérité

| Plan | Vérité possédée | Ce qu’OBS peut faire | Promotion interdite |
|---|---|---|---|
| Constitution | principes et responsabilités fondamentales | s’y conformer | adapter la constitution à une méthode |
| Knowledge | concepts, assertions, preuves, relations, validité, limites, controverses | référencer et contextualiser l’usage | copier ou augmenter la preuve |
| Scientific Models | composition explicative, alternatives, hypothèses de modèle | recevoir les éléments à examiner | traiter le modèle comme vérité ou besoin de mesure |
| OBS | propriétés observables, définitions de mesure, qualifications générales | définir, comparer, restreindre et transmettre | créer un choix de projet ou une valeur |
| Research Project | besoins, opérationnalisations, variables, critères, décisions | proposer des Contributions | adopter à la place de l’humain |
| Study Data / CDM futur | occurrences, sources, qualité réelle, provenance, corrections | fournir les références de sens à préserver | posséder la vérité scientifique |
| Analysis | spécifications, exécutions, résultats | délimiter la frontière de mesure | choisir l’inférence ou interpréter |
| Projection | forme pour un usage | fournir des références projetables | corriger ou posséder le fond |
| Implémentation | capacités réellement livrées et testées | aucune revendication par admission | déclarer OBS implémenté |

Ces plans restent distincts parce que leur identité, owner, cycle et condition de correction diffèrent.

## 7. Responsabilité OBS

OBS est l’owner sémantique transversal du **contrat d’observabilité et de mesure**, non un owner universel de chaque spécialité.

Il décide : les champs communs ; les tests d’identité ; les axes sémantiques ; les exigences de provenance ; la forme des qualifications ; les règles de handoff ; les états d’incomplétude ; et les critères qui distinguent mesure, analyse et décision Project.

Les domaines Imaging, Laboratory, Clinical Assessment, Questionnaire, Device/Wearable et autres spécialistes possèdent les extensions et règles propres à leurs méthodes. Leur contribution doit satisfaire le contrat transversal ; OBS ne peut réécrire leur savoir de domaine, et le spécialiste ne peut réduire les invariants transversaux.

Cette organisation évite à la fois un OBS monolithique et des définitions incompatibles par domaine.

## 8. Non-duplication avec Knowledge

### 8.1 Règle de référence

Toute proposition scientifique utilisée par OBS reste une identité Knowledge versionnée. OBS conserve `KnowledgeRefs`, le rôle de la référence dans la qualification, le contexte d’usage, la date de résolution et la provenance du handoff. Il ne recopie pas l’assertion comme autorité propre.

### 8.2 Répartition des contenus

| Contenu | Owner | Représentation dans OBS | Justification |
|---|---|---|---|
| définition d’un concept scientifique | Knowledge | `scientificConceptRef` | éviter une seconde terminologie |
| assertion qu’une méthode renseigne une propriété | Knowledge pour l’assertion ; OBS pour la relation qualifiée | `REFERENCES_KNOWLEDGE` + `MEASURED_BY` contextualisée | séparer preuve et architecture |
| résultat de performance publié | Knowledge | référence de preuve et qualification d’applicabilité | OBS ne crée aucune donnée scientifique |
| dimension de performance attendue | OBS | qualification sans valeur inventée | c’est une sémantique de mesure |
| domaine de validité scientifique | owner Knowledge de l’assertion | référence ; portée appliquée à l’objet OBS | conserver la source et la version |
| choix de méthode pour un projet | ResearchProject | absent d’OBS ; Contribution candidate seulement | le contexte et les compromis appartiennent au projet |

Une absence de référence ne permet pas de créer une assertion locale : elle produit un gap ou un diagnostic d’insuffisance.

## 9. Relation avec Scientific Models

Un `ScientificModel` transmet à OBS ses identités/version, éléments, rôles, relations proposées, alternatives, hypothèses, portée, statuts, inconnues et contradictions. OBS qualifie ensuite l’observabilité de chaque élément sans modifier le modèle.

Un élément peut être : scientifiquement important mais non observable ; potentiellement observable ; indirectement observable ; observable avec conditions ; d’observabilité inconnue ; ou observable mais sans utilité démontrée pour le Project. Ces qualifications sont des diagnostics de handoff construits à partir des axes PD-003, pas de nouveaux états canoniques.

Le modèle ne motive pas automatiquement une mesure. Cette règle est nécessaire parce qu’importance explicative, possibilité de mesure et utilité de projet sont trois questions différentes.

## 10. ObservableProperty

### 10.1 Contrat spécialisé

OBS reprend strictement l’objet PD-003 V2. Une `ObservableProperty` doit exposer, selon pertinence :

| Élément | Règle OBS |
|---|---|
| identité et version | stables, opaques au libellé et immuables après consommation |
| `scientificConceptRef` | référence Knowledge ; jamais copie du concept |
| nature observable | axes orthogonaux du §10.2 |
| domaine | domaine scientifique et domaine de mesure, sans imposer une spécialité unique |
| dimensionalité | scalaire, vectorielle, spatiale, temporelle, catégorielle, composite ou non établie, selon définition sourcée |
| forme de résultat | formes admissibles ; aucune valeur réelle |
| applicabilité | axes PD-003 contextualisés ; aucun « valide partout » implicite |
| conditions d’observabilité | qualifications générales, références et inconnues |
| confounders et limitations | références Knowledge + rôle dans la mesure |
| unknowns et contradictions | conservés séparément et propagés |
| provenance et `KnowledgeRefs` | obligatoires pour toute qualification structurante |
| MeasurementDefinitions | candidates, compatibles, incompatibles ou non évaluées, avec qualification |
| BiomarkerRoles | zéro à plusieurs rôles contextualisés ; jamais implicites |

### 10.2 Nature observable : axes orthogonaux

OBS n’admet pas une enum unique `DIRECTLY_OBSERVABLE / INDIRECTLY_ESTIMATED / MODEL_DERIVED / CLASSIFIED / COMPOSITE`, car ces termes répondent à des questions différentes.

| Axe | Valeurs conceptuelles minimales | Question |
|---|---|---|
| mode d’accès | direct, indirect/estimé, dérivé par modèle, inconnu | comment la propriété est-elle obtenue ? |
| forme de sortie | quantitative, ordinale, nominale/classifiée, binaire, structurée, inconnue | quelle sémantique de résultat ? |
| composition | atomique, composite, inconnue | le résultat combine-t-il plusieurs constituants ? |
| résolution | globale, locale/spatiale, temporelle, longitudinale, autre qualification | à quelle granularité ? |
| dépendance interprétative | instrumentale, opérateur/reader, algorithme, consensus/adjudication, mixte | quelles médiations sont constitutives ? |

La séparation empêche par exemple de traiter « composite » comme l’opposé de « quantitatif » ou « classifié » comme l’opposé de « indirect ».

### 10.3 Invariants

1. Une `ObservableProperty` n’est ni un Phénomène, ni une `MeasurementDefinition`, ni un `BiomarkerRole`, ni une Variable, ni une valeur.
2. Son existence ne prouve ni mesurabilité opérationnelle, ni validité biomarqueur, ni utilité de projet.
3. Plusieurs méthodes peuvent viser la même propriété sans être comparables.
4. Une même méthode peut participer à plusieurs propriétés seulement si chaque relation est explicitement qualifiée.

## 11. MeasurementDefinition

### 11.1 Contrat spécialisé

Une `MeasurementDefinition` représente une définition scientifique versionnée du principe et de la méthode par lesquels une `ObservableProperty` peut produire un résultat interprétable. Elle doit pouvoir porter, selon pertinence :

- identité, version et supersession ;
- `ObservablePropertyRef` cible et relation `MEASURED_BY` ;
- principe de mesure et classe de méthode ;
- domaine transversal et spécialisation de domaine ;
- `inputRequirements` et dépendances ;
- sémantique de sortie, unités ou value domains possibles ;
- conditions préalables, facteurs de confusion et limites ;
- qualifications de performances documentées ;
- exigences de précision, répétabilité, reproductibilité, biais et robustesse lorsqu’applicables ;
- qualifications d’harmonisation, calibration et comparaison ;
- exigences de contrôle qualité de mesure ;
- domaine d’applicabilité, incompatibilités, inconnues et contradictions ;
- références Knowledge, provenance, statut et historique.

Les valeurs de performance restent dans Knowledge. OBS conserve la dimension, le contexte, la relation à la méthode et les références qui permettent de reconstruire la qualification.

### 11.2 Granularité d’identité

La définition doit être assez précise pour permettre une comparaison reproductible : principe, propriété, chaîne constitutive, sémantique de sortie et conditions déterminantes doivent être identifiables. Elle ne doit pas être si spécifique qu’un numéro de scanner, un lot, un site ou tout paramètre d’exécution crée automatiquement une nouvelle identité.

Un changement crée une nouvelle identité si le principe, le mesurande, la sémantique de sortie ou les conditions déterminantes changent au point que les résultats ne répondent plus à la même définition. Un changement compatible de version, matériel, logiciel, calibration ou procédure crée une nouvelle version ou une qualification de compatibilité lorsque le sens reste stable. La comparabilité n’est jamais présumée.

### 11.3 Invariants

1. Une `MeasurementDefinition` n’est ni un choix Project, ni une exécution, ni une valeur.
2. Une méthode documentée mais hors domaine reste définie et `NOT_APPLICABLE` dans ce contexte.
3. Une méthode applicable mais localement indisponible reste scientifiquement applicable ; l’indisponibilité appartient au Project/Operations.
4. Une performance inconnue reste inconnue ; aucune valeur par défaut n’est admise.

## 12. Principe, méthode, procédure et exécution

| Niveau | Qualification PD-003/OBS | Owner | Frontière |
|---|---|---|---|
| Measurement Principle | `VALUE_OBJECT` ou qualification constitutive de `MeasurementDefinition` | OBS avec spécialiste | principe physique, biologique, clinique ou computationnel ; pas d’identité racine autonome démontrée |
| MeasurementDefinition | `OBJECT` canonique | OBS + owner spécialisé | définition scientifique réutilisable et versionnée |
| Measurement Procedure générique | `SPECIALIZATION` ou `SUBRESOURCE` versionnée de la définition selon autonomie | domaine spécialisé | instructions déterminantes réutilisables ; aucune exécution réelle |
| Measurement Execution | déjà couverte par Acquisition, Reading/processing effectif, `AnalysisExecution` ou production future d’une `VariableOccurrence` | système/source et domaine | événement réel ; aucun nouvel objet racine OBS |
| Acquisition | objet PD-003 existant, projet/spécialité | Imaging ou domaine, Project pour le choix | plan ou acte d’obtention ; ne redéfinit pas la méthode générale |
| Reading Procedure | spécialisation de `MeasurementDefinition` déjà issue de la Procédure de lecture V1 | Imaging/Core Lab ou domaine | définition de lecture ; le résultat réel reste aval |
| Analysis-based measurement | `MeasurementDefinition`, `AnalysisSpecification` ou les deux selon §27 | OBS/domaine et owner Analysis | mesure préspécifiée d’une propriété versus inférence/effet |
| Device-specific implementation | `SUBRESOURCE` ou qualification de compatibilité | domaine Device/équipement | dépendance de réalisation ; pas de nouvelle identité par défaut |

Ce choix applique le test d’autonomie PD-003 : aucun candidat supplémentaire n’a démontré quatre critères d’objet racine. Il évite une ontologie inflationniste tout en conservant la reproductibilité par versions et qualifications.

## 13. Spécialisations de domaine

Le contrat transversal est obligatoire pour Imaging, Laboratory, Clinical Assessment, Questionnaire, Device/Wearable, Physiological Monitoring et Derived Measurement. La liste est ouverte : elle teste la transversalité sans créer une taxonomie exhaustive.

Toute spécialisation doit : référencer une `ObservableProperty` ; conserver une identité/version de méthode ; déclarer principe, inputs, outputs, conditions, performances applicables, qualité, limites, KnowledgeRefs, provenance et owner ; exposer ce qui reste inconnu ; et respecter le handoff Project.

Les extensions propres au domaine sont des spécialisations ou sous-ressources, jamais des définitions concurrentes d’`ObservableProperty` ou de `MeasurementDefinition`. Le détail est porté par `docs/obs-001-measurement-domain-specialization.md`.

## 14. Imaging

### 14.1 Répartition des responsabilités

| Construction | OBS possède | Imaging possède | ResearchProject possède | Promotion interdite |
|---|---|---|---|---|
| Modalité | relation à la classe de méthode et à la propriété | définition de la famille technologique et expertise spécialisée | décision de retenir/refuser | modalité disponible → mesure valide |
| Acquisition | référence à la définition générale | stratégie, conditions, acte ou plan spécialisé | choix, temporalité et faisabilité locale | acquisition → valeur ou endpoint |
| Séquence / Technique | place comme spécialisation de méthode | contrat spécialisé, version et dépendances | variante retenue | nom de séquence → identité scientifique universelle |
| Paramètre critique | sémantique d’influence et référence de condition | définition du paramètre et domaine | valeur/contrainte prévue si décidée | valeur locale → règle générale |
| Condition de mesure | qualification transversale | spécificité Imaging | contexte adopté | recommandation → obligation implicite |
| Protocole d’imagerie | aucune composition exécutable | composition méthodologique candidate | adoption Project | protocole candidat → exécutable |
| Procédure de lecture | frontière de `MeasurementDefinition` | définition de lecture, readers, QA | choix de procédure/organisation | lecture → interprétation scientifique automatique |
| Contrôle qualité | signification de qualité attendue | règles QA Imaging | acceptation de projet et conséquence | bon aspect → validité de mesure |

### 14.2 Relation à RDE-003

RDE-003 reste l’owner spécialisé Imaging. Sa chaîne V1 condensée doit, dans une future adaptation, être lue par l’adaptateur legacy puis produire des références distinctes vers `ObservableProperty`, `MeasurementDefinition` et `BiomarkerRole`. OBS-001 ne modifie ni RDE-003 ni IMG.

Imaging contribue à OBS ; il ne devient pas owner global de l’observabilité. Cette limite est démontrée par les cas Laboratory, Questionnaire, Wearable et étude sans imagerie.

## 15. Laboratory

Laboratory possède les spécialisations liées aux analytes, matrices, prélèvements, préparations, réactifs, lots, instruments, calibration, contrôles et procédures analytiques. OBS possède le contrat transversal et la distinction propriété/méthode/rôle.

Une méthode Laboratory doit pouvoir qualifier : type de matériau requis sans confondre `Biospecimen` et mesure ; pré-analytique ; principe analytique ; chaîne de calibration ; unités/value domains ; plages de fonctionnement documentées ; inter-lot/inter-instrument/inter-site lorsque pertinentes ; conditions de stockage/traitement qui affectent le mesurande ; et qualité attendue.

Le Project décide le prélèvement, le temps, la source et l’opérationnalisation. Le futur CDM conservera le Biospecimen exact, l’occurrence, la méthode réelle, le lot/version si pertinent et la qualité observée. OBS ne crée ni résultat biologique ni valeur de référence.

## 16. Clinical Assessment

Clinical Assessment couvre les mesures issues d’un examen, d’une échelle, d’un jugement structuré ou d’une tâche clinique générale sans devenir une décision clinique individuelle.

La spécialisation précise : construit/propriété ciblé ; instrument ou procédure ; qualifications du rater ; instructions et contexte ; forme de résultat ; subjectivité constitutive ; répétabilité intra/inter-rater lorsque pertinente ; conditions d’aveugle/adjudication ; biais connus ; langue/culture/version pour les instruments concernés ; et limites.

Questionnaire est une spécialisation possible : version, langue, mode d’administration, règles de scoring et gestion des items manquants sont déterminants. Le score défini peut relever d’une `MeasurementDefinition`; son usage inferentiel ultérieur relève d’Analysis. L’administration réelle et la réponse restent des occurrences futures, jamais des objets OBS.

## 17. Device / Wearable

Device/Wearable et Physiological Monitoring spécialisent `MeasurementDefinition` lorsque la propriété est obtenue par capteur ou dispositif.

Le contrat spécialisé peut exiger : classe de capteur ; positionnement ; fréquence/continuité conceptuelle ; calibration ; version matérielle/logicielle/firmware ; algorithme embarqué déterminant ; dépendances d’environnement ; synchronisation temporelle ; comportement en perte de signal ; dérive ; autonomie/adhérence comme limites de réalisation ; et forme des données brutes ou résumées attendues.

OBS définit la sémantique de mesure et les dépendances documentées. Le domaine Device possède la spécialisation ; le Project possède le choix et la faisabilité ; le système source possède la production ; CDM conservera les occurrences, trous, versions et provenance ; Biostatistics possède les analyses longitudinales. La disponibilité commerciale ou locale ne prouve aucune validité.

## 18. BiomarkerRole

### 18.1 Contrat général

Un `BiomarkerRole` relie au minimum : `ObservableProperty` ; cible ; usage scientifique ; population ; contexte temporel ; une ou plusieurs `MeasurementDefinition` compatibles ; domaine de validité ; confounders ; reproductibilité ; références de preuve ; limites ; confiance qualifiée ; alternatives ; contradictions ; provenance ; version et statut.

OBS peut proposer, qualifier, comparer, restreindre, contester, versionner et transmettre ce rôle. Une qualification ne peut être plus forte que les KnowledgeRefs applicables. Un conflit conserve toutes les positions et leurs contextes.

### 18.2 Général versus Project

| Niveau | Owner | Statut | Décision permise |
|---|---|---|---|
| `GENERAL_BIOMARKER_ROLE` | gouvernance scientifique du rôle avec OBS et Knowledge | candidat, documenté, qualifié, restreint, contesté, remplacé | décrire une qualification générale bornée |
| `PROJECT_ADOPTED_BIOMARKER_ROLE` | `ResearchProject` sous décision humaine | candidat Project, retenu, rejeté, exploratoire, différé | décider l’usage dans un projet précis |

Ces libellés désignent deux portées de la même construction `BiomarkerRole`, pas deux objets canoniques nouveaux. L’adoption Project référence la version générale, ajoute contexte, raison, alternatives, réserves, acteur et mandat, sans réécrire la qualification amont.

## 19. Validité d’un BiomarkerRole

La validité ne doit jamais être réduite à un score global. Les axes suivants restent séparés et ne sont renseignés que lorsqu’ils sont pertinents et soutenus :

| Axe | Question NOXIA | Owner principal |
|---|---|---|
| analytical validity | lorsque cet axe est pertinent, la méthode satisfait-elle les propriétés analytiques revendiquées contre la référence et dans les conditions déclarées ? | Knowledge + domaine ; OBS conserve la qualification applicable |
| measurement validity | la définition, le processus et la sémantique de sortie soutiennent-ils effectivement l’ObservableProperty ciblée ? | OBS + domaine, références Knowledge |
| biological relevance | la propriété est-elle reliée à la cible biologique dans ce contexte ? | Knowledge ; rôle référencé par OBS |
| construct validity | la propriété et la méthode correspondent-elles au construit visé ? | Scientific Models + Knowledge + OBS |
| repeatability / reproducibility | la mesure est-elle stable sous répétitions ou variations définies ? | OBS/domaine ; preuves Knowledge |
| transportability | la qualification se maintient-elle entre populations, sites, dispositifs ou versions spécifiés ? | Knowledge + OBS ; décision Project |
| sensitivity / specificity | ces dimensions sont-elles définies pour la tâche de classification concernée ? | Knowledge + domaine ; jamais universelles |
| prognostic / predictive association | l’association avec un résultat ou une réponse est-elle soutenue ? | Knowledge ; adoption Project |
| applicability | le rôle est-il recevable pour population, temps, méthode et usage courants ? | qualification OBS ; Project décide l’usage |
| evidence strength | quelle est la force des preuves applicables ? | Knowledge exclusivement |

Un axe absent vaut `UNKNOWN` ou `NOT_APPLICABLE` selon justification ; il ne vaut jamais zéro. Les taxonomies réglementaires externes peuvent être référencées, mais ne remplacent pas cette architecture et ne confèrent aucun statut réglementaire.

## 20. Performance de mesure

### 20.1 Qualification de performance

Les performances sont représentées par des **qualifications contextuelles subordonnées** à une `MeasurementDefinition`, et non par de nouveaux objets racines. Chaque qualification conserve : dimension ; définition opératoire référencée ; contexte/population ; méthode/version ; conditions ; unité ou forme de résultat si pertinente ; KnowledgeRefs ; applicabilité ; incertitude ; contradictions ; provenance ; date ; statut et supersession.

Les valeurs scientifiques restent dans Knowledge. Cette séparation permet d’attacher plusieurs preuves et domaines à la même définition sans dupliquer la connaissance.

### 20.2 Dimensions possibles

Accuracy, precision, repeatability, reproducibility, bias, linearity, range, limit of detection, limit of quantification, sensitivity, specificity, agreement, robustness, inter-reader, intra-reader, inter-site, inter-device, inter-vendor et test-retest constituent un vocabulaire ouvert. Une dimension n’est jamais obligatoire par son seul nom : sa pertinence dépend de la forme de résultat, de la tâche, du principe, du domaine et de l’usage.

Le catalogue sémantique précise les tests de pertinence. Par exemple, sensibilité/spécificité exigent une tâche et une référence qualifiées ; LoD/LoQ exigent une mesure pour laquelle ces concepts ont un sens ; inter-reader exige une dépendance de lecture ; inter-vendor exige plusieurs implémentations comparables. Cette règle empêche les tableaux de performance décoratifs.

## 21. Conditions

### 21.1 Types de rôle, non enum universel

Une condition est représentée par l’objet V1 conservé `Condition de mesure`, une `Contrainte`, un `Paramètre critique`, un `Site et environnement technique`, une qualification de relation ou une sous-ressource, selon son autonomie et son owner.

Les rôles suivants restent distincts :

| Rôle de condition | Sens | Conséquence |
|---|---|---|
| required condition | nécessaire pour que la définition s’applique | absence → non-applicabilité ou non-évaluabilité selon contexte |
| recommended condition | améliore une propriété documentée sans être constitutive | écart conservé avec impact à évaluer |
| known influence | facteur documenté modifiant résultat/performance | qualification, stratification, limite ou contrôle |
| quality criterion | test d’aptitude d’une production future | le résultat du contrôle appartient à l’exécution/occurrence |
| contraindication / exclusion | contexte où l’usage est interdit ou scientifiquement irrecevable selon l’owner compétent | refus ou escalade ; OBS ne crée pas une décision clinique |
| unknown effect | influence non établie | inconnue explicite, jamais condition satisfaite |

### 21.2 Portée

- La définition générale porte les conditions constitutives et les influences documentées réutilisables.
- Le domaine d’applicabilité porte population, contexte, temps et environnement dans lesquels les qualifications sont recevables.
- La spécialisation de méthode porte les dépendances propres au domaine.
- Le Project porte les contraintes, équipements, choix, préparation et timing prévus.
- L’exécution future porte les conditions effectivement observées, la version réelle et les écarts.

Cette répartition évite de confondre une exigence scientifique générale avec une disponibilité locale ou une observation réalisée.

## 22. Confounders

Un confounder de mesure est une influence capable d’altérer la relation entre `ObservableProperty`, méthode et résultat, sans être la propriété ciblée. Il peut être biologique, physiologique, technique, temporel, comportemental, opérateur, site, processing, reconstruction, reader ou algorithmique.

OBS conserve son rôle dans la mesure, son contexte, les objets affectés, les KnowledgeRefs, le sens attendu de l’influence lorsqu’il est prouvé, les contrôles/mitigations possibles, le résidu, les inconnues et contradictions. Il ne copie pas l’assertion scientifique et ne transforme pas une mitigation en disparition du facteur.

Un confounder scientifique de mesure se distingue : d’une covariable choisie par Biostatistics ; d’un biais global de design ; d’une erreur de donnée ; d’une contrainte opérationnelle ; et d’un facteur de risque clinique. Plusieurs qualifications peuvent coexister si les responsabilités sont explicitement séparées.

## 23. Qualité

| Qualité | Owner | Objet de la qualité | OBS peut-il la posséder ? |
|---|---|---|---|
| measurement quality requirement | OBS + domaine | aptitude attendue d’une mesure à répondre à sa définition | oui, comme exigence sémantique |
| acquisition quality requirement | domaine d’acquisition, notamment Imaging | aptitude de l’entrée ou de l’acte d’acquisition | contribution/référence seulement |
| reading quality requirement | domaine de lecture/Core Lab | aptitude de la procédure/reader | contribution/référence seulement |
| data quality | Data Management futur | intégrité, conformité et transformations de données | non |
| occurrence quality | système source puis CDM/Data | qualité réellement observée d’une occurrence | non |
| analysis quality | owner de l’analyse / Biostatistics | validité de l’exécution et des résultats analytiques | non |

Toute exigence de qualité de mesure précise : objet contrôlé ; moment ; méthode ; critère sémantique ; conséquence d’échec ; owner ; version ; KnowledgeRefs et provenance. Elle ne contient aucun résultat de contrôle réel.

La qualité attendue n’est ni la validité biomarqueur, ni la performance, ni l’applicabilité. Une bonne répétabilité ne prouve pas l’exactitude ; une entrée visuellement satisfaisante ne prouve pas la validité de mesure.

## 24. Harmonisation

### 24.1 Architecture multi-axes

OBS ne crée pas un enum plat `EQUIVALENT / COMPARABLE_WITH_CONDITIONS / HARMONIZABLE / CALIBRATABLE / NON_INTERCHANGEABLE / INCOMPARABLE / UNKNOWN`. Une qualification de comparaison porte au minimum :

- même `ObservableProperty` ou non ;
- équivalence de la sémantique de sortie ;
- domaine/population/temps ;
- conditions d’appariement ;
- biais ou transformation documentés ;
- interchangeabilité décisionnelle ;
- besoin d’harmonisation ou calibration ;
- qualité/performance résiduelle ;
- KnowledgeRefs, versions, contradictions et provenance.

### 24.2 Conclusions projetables

Les libellés peuvent résumer la qualification : équivalence démontrée dans un domaine borné ; comparable sous conditions ; harmonisable selon une règle versionnée ; calibrable contre une référence qualifiée ; non interchangeable ; incomparable pour l’usage ; comparaison inconnue.

Ces libellés sont des diagnostics composés, pas des relations canoniques nouvelles. `Règle d’harmonisation`, `MEASURED_BY`, `OPERATIONALIZES`, `REFERENCES_KNOWLEDGE` et les qualifications de relations suffisent. Toute équivalence est sourcée, versionnée, contextualisée et révisable ; la même propriété ciblée ne suffit jamais.

## 25. Équipements et versions

OBS ne crée ni catalogue d’équipements ni identité locale de manufacturer/model. Une `MeasurementDefinition` peut déclarer une **qualification de dépendance ou de compatibilité** vers une classe ou propriété technique pertinente : manufacturer, model, generation, software/firmware, field strength, detector technology, reagent/platform, reconstruction capability ou autre propriété gouvernée par le domaine.

La qualification porte : nature de la dépendance ; caractère constitutif ou compatible ; versions/période ; conditions ; preuve ; domaine ; inconnues ; owner ; provenance. Le Project référence ensuite l’équipement local déclaré ou vérifié et demande une décision de compatibilité. L’exécution future conserve l’implémentation réellement utilisée.

`METHOD_NOT_APPLICABLE` et `METHOD_UNAVAILABLE` restent distincts : le premier qualifie la science dans un contexte ; le second qualifie la faisabilité locale. Un appareil disponible ne rend pas une méthode applicable ; une méthode applicable ne rend pas l’appareil disponible.

## 26. Direct, indirect et derived

| Notion | Qualification | Ce qu’elle ne signifie pas |
|---|---|---|
| mesure directe | relation constitutive relativement directe entre propriété et résultat selon un principe déclaré | absence de conditions, erreur ou interprétation |
| estimation indirecte | propriété estimée par un signal, une transformation ou un modèle intermédiaire | biomarqueur automatiquement valide |
| classification | résultat catégoriel selon une règle/version | vérité ontologique ou diagnostic clinique individuel |
| mesure dérivée | sortie préspécifiée visant une `ObservableProperty`, avec sources et méthode | toute sortie d’analyse statistique |
| modèle de reconstruction | composant déterminant de la chaîne de mesure | ScientificModel explicatif |
| proxy | mesure utilisée comme substitut pratique ou conceptuel dans un contexte | `BiomarkerRole` universel |
| surrogate | rôle scientifique particulier exigeant des preuves et un contexte propres | simple synonyme de proxy ou biomarker |
| BiomarkerRole | usage contextualisé d’une propriété comme indicateur d’une cible | propriété, méthode ou variable |

Une `CanonicalVariable` dérivée n’est pas automatiquement une `MeasurementDefinition`. Si la dérivation définit comment une propriété stable est mesurée, la définition appartient à OBS ; si elle estime un effet, compare plusieurs variables ou répond à une question inferentielle, elle appartient à `AnalysisSpecification`.

## 27. Frontière OBS / Analysis

### 27.1 Test de décision opposable

Une transformation relève principalement de `MeasurementDefinition` si toutes les conditions suivantes sont satisfaites :

1. sa finalité première est de produire une mesure, catégorie ou statut d’une `ObservableProperty` identifiée ;
2. les inputs, la chaîne constitutive, la sémantique de sortie et les conditions sont préspécifiés ;
3. la sortie possède une interprétation de mesure réutilisable entre projets ;
4. sa performance peut être qualifiée indépendamment de l’hypothèse analytique du projet ;
5. elle ne choisit ni estimand, ni population d’analyse, ni comparaison causale/inférentielle.

Elle relève principalement d’`AnalysisSpecification` si elle estime un effet, compare des groupes, sélectionne un modèle statistique, combine des variables pour une question inferentielle, définit une population d’analyse ou produit un résultat dont le sens dépend du plan d’analyse.

Les deux sont nécessaires lorsqu’une chaîne analytique produit d’abord une mesure définie puis utilise ces mesures pour une inférence. Les owners, versions, entrées, résultats et lignages restent séparés.

### 27.2 Cas de référence

`image → segmentation → volume` peut constituer une `MeasurementDefinition` spécialisée si le volume est l’`ObservableProperty`, que la segmentation/quantification est constitutive et que sa sortie est réutilisable.

`plusieurs variables → modèle statistique → estimation d’effet` relève d’`AnalysisSpecification`. Le fait que le résultat soit numérique ne transforme pas l’analyse en mesure OBS.

## 28. Frontière OBS / Project

OBS transmet des propriétés, méthodes et rôles candidats, avec conditions, performances, alternatives, risques, limites, unknowns, contradictions et evidenceRefs.

OBS ne transmet jamais comme adoption : une `CanonicalVariable`, un `DataNeed`, un Endpoint, une modalité retenue, un plan d’acquisition, une source, un temps ou une décision. Le Project peut créer ou adopter ces objets uniquement après contextualisation, comparaison, contribution des domaines et décision humaine.

La règle est nécessaire parce que « mesurable » ne signifie ni « nécessaire », ni « faisable », ni « préférable », ni « collecté ».

## 29. Handoff ScientificModel → OBS

Le paquet contient : sourceOwner ; modelId/version ; objectif explicatif ; éléments/rôles/relations ; références Knowledge ; alternatives ; hypothèses ; portée ; états ; inconnues ; contradictions ; provenance ; et question d’observabilité.

OBS ajoute, sans muter le modèle, une qualification par élément :

- `SCIENTIFICALLY_IMPORTANT` — rôle dans le modèle ;
- `POTENTIALLY_OBSERVABLE` — propriété candidate, méthode non encore qualifiée ;
- `NON_OBSERVABLE_IN_CURRENT_SCOPE` — aucune voie recevable dans le périmètre ;
- `INDIRECTLY_OBSERVABLE` — médiation/estimation nécessaire ;
- `OBSERVABILITY_UNKNOWN` — preuve ou définition insuffisante ;
- `OBSERVABLE_NOT_PROJECT_USEFUL` — propriété mesurable mais utilité de projet non soutenue.

Ces libellés sont des diagnostics de handoff, non des états PD-003. Toute conclusion conserve justification, KnowledgeRefs, contexte, owner et condition de réexamen.

## 30. Handoff Knowledge → OBS

Le paquet Knowledge fournit identités/versions de concepts, assertions, EvidenceLinks, method/performance evidence, limites, controverses, domaines de validité, dates, statuts et provenance.

OBS conserve : références ; rôle de chaque référence ; qualification d’applicabilité ; contexte d’usage ; version du paquet ; contradictions/gaps ; et provenance de résolution. Il ne copie aucun texte comme nouvelle preuve, ne modifie aucune force et ne convertit aucun statement documentaire en assertion effective.

Une panne ou indisponibilité de provider, si elle était observée dans une future implémentation, resterait `SOURCE_UNAVAILABLE` ou `PROVIDER_FAILURE` selon KE-001. Elle ne deviendrait jamais `INSUFFICIENT_EVIDENCE`. Dans la présente mission, aucun provider live n’est utilisé.

## 31. Handoff OBS → Project

### 31.1 Paquet conceptuel

Le handoff transmet obligatoirement : sourceOwner ; objets et versions ; `ObservableProperty` ; `MeasurementDefinition` candidates ; applicabilité ; provenance ; evidenceRefs ; unknowns ; contradictions ; `decisionNeeded` ; et `mappingStatus`.

Il transmet lorsque pertinent : `BiomarkerRole` candidates ; performanceSummary ; qualityRequirements ; confounders ; limitations ; alternatives ; rejectedOptions et raisons ; dépendances de domaine/équipement ; comparabilité/harmonisation ; risques et conditions de réexamen.

### 31.2 Statuts du paquet

| Diagnostic | Condition |
|---|---|
| `COMPLETE_FOR_PROJECT_REVIEW` | identités, versions, owner, propriété, au moins une méthode candidate ou refus explicite, applicabilité, evidenceRefs/provenance et décisions ouvertes sont présents |
| `INCOMPLETE` | champ obligatoire absent, mapping legacy non décidé, owner/version/provenance manquant ou alternative structurante non caractérisée |
| `NOT_EVALUABLE` | preuve/applicabilité/performance critique insuffisante ou contradictoire au point de rendre l’adoption honnête impossible |
| `PROJECT_ADOPTION_BLOCKED` | méthode hors domaine, contradiction critique, validité biomarqueur non soutenue pour l’usage, identité ambiguë, qualité minimale indéfinie ou acteur/mandat requis absent |

Un paquet peut être complet et contenir des inconnues non bloquantes. `COMPLETE` ne signifie ni recommandation, ni faisabilité, ni adoption. Le contrat détaillé figure dans `docs/obs-001-project-handoff-contract.md`.

## 32. Relation au futur CDM

OBS produit un contrat de sens, pas un modèle de stockage. Le futur CDM devra préserver pour chaque définition et occurrence :

- version d’`ObservableProperty` ;
- version de `MeasurementDefinition` prévue et méthode effectivement utilisée ;
- `CanonicalVariable` et version ;
- `VariableOccurrence` et version/statut ;
- contexte de mesure prévu et réel ;
- attentes de qualité et qualité observée sans les fusionner ;
- source, système/producteur, temps et provenance ;
- conditions, écarts, transformations, corrections et lignage ;
- inconnues, contradictions, limitations et restrictions d’usage.

CDM ne pourra pas redéfinir la propriété, la méthode, la validité biomarqueur ou la décision Project. Toute perte de version, méthode réelle, source ou provenance empêchera de reconstruire la signification d’une occurrence.

## 33. Relation à Biostatistics

Biostatistics reçoit, via Project/CDM futurs : Variables ; Occurrences ; validité de mesure applicable ; version de méthode ; qualité ; incertitude ; missingness ; limites de comparabilité ; conditions de mesure ; et lignage.

Il possède `AnalysisSpecification`, estimands, modèles, populations d’analyse, covariables, sensibilités, dimensionnement, exécutions et résultats statistiques selon PD-003. Il ne redéfinit jamais une `MeasurementDefinition` pour rendre une analyse possible. Une incompatibilité doit conduire à une limitation, une stratification, une autre spécification, une demande de données ou un refus, jamais à un changement silencieux du sens amont.

OBS ne choisit aucun modèle statistique et ne qualifie aucune occurrence réelle. Biostatistics ne décide ni `BiomarkerRole` général, ni opérationnalisation Project.

## 34. États, inconnues et contradictions

OBS réutilise les axes PD-003 : épistémique, applicabilité, réalisation, cohérence, lignage et actualité. Les libellés demandés sont arbitrés ainsi :

| Libellé | Qualification | Représentation |
|---|---|---|
| `UNKNOWN_OBSERVABILITY` | diagnostic | `UNKNOWN` sur la question d’observabilité + objet/contexte |
| `MEASUREMENT_NOT_DEFINED` | diagnostic | propriété sans `MeasurementDefinition` recevable |
| `INSUFFICIENT_EVIDENCE` | diagnostic Knowledge-derived | refs/gap ; ne qualifie pas une panne technique |
| `CONFLICTING_EVIDENCE` | diagnostic de cohérence | positions Knowledge `CONFLICTING` conservées |
| `METHOD_NOT_APPLICABLE` | conséquence de l’axe Applicabilité | `NOT_APPLICABLE` dans le contexte qualifié |
| `METHOD_UNAVAILABLE` | diagnostic Project/Operations | disponibilité locale absente ; pas un état scientifique OBS |
| `PERFORMANCE_UNKNOWN` | diagnostic | qualification de performance requise mais `UNKNOWN` |
| `COMPARABILITY_UNKNOWN` | diagnostic | absence de comparaison recevable entre versions/méthodes |
| `BIOMARKER_VALIDITY_UNKNOWN` | diagnostic | un ou plusieurs axes nécessaires du rôle restent inconnus |

Une contradiction est créée seulement pour le même sens, contexte, période et portée. Une différence de méthode ou de population peut être une différence contextuelle. OBS ne tranche jamais par majorité de sources et ne supprime aucune position.

## 35. Relations

OBS utilise les relations canoniques `OBSERVABLE_BY`, `MEASURED_BY`, `HAS_BIOMARKER_ROLE`, `INDICATES`, `REFERENCES_KNOWLEDGE`, `OPERATIONALIZES` et `SUPERSEDES`, ainsi que les relations V1 compatibles `impose`, `affecte`, `harmonise`, `contrôle`, `repose sur` et `produit` lorsqu’elles sont explicitement qualifiées.

| Besoin candidat | Décision | Représentation admise sans nouvelle relation canonique |
|---|---|---|
| `REQUIRES_CONDITION` | `NOT_REQUIRED` | `Condition de mesure`/`Contrainte` + relation V1 `impose` qualifiée |
| `AFFECTED_BY` | `NOT_REQUIRED` | relation V1 `affecte` + confounder/condition référencé |
| `HAS_PERFORMANCE` | `NOT_REQUIRED` | qualification subordonnée de `MeasurementDefinition` + KnowledgeRefs |
| `COMPATIBLE_WITH` / `ALTERNATIVE_TO` | `NOT_REQUIRED` | qualification de comparaison entre identités/version + Option Project en aval |
| `CALIBRATED_AGAINST` | `NOT_REQUIRED` | Règle d’harmonisation/calibration + références de méthode |
| `HARMONIZED_WITH` | `NOT_REQUIRED` | Règle d’harmonisation + objets/versions ciblés |
| `VALID_IN` | `NOT_REQUIRED` | Domaine de validité et applicabilité PD-003 |
| `REQUIRES_QUALITY` | `NOT_REQUIRED` | Contrôle qualité/exigence rattachée à la méthode |
| `USES_DEVICE_CLASS` | `NOT_REQUIRED` | dépendance/compatibilité technique qualifiée |

Aucune relation canonique nouvelle n’est indispensable ; `PD003_EVOLUTION_REQUIRED` n’est donc pas déclenché. Si une future implémentation démontre une perte de sens impossible à éviter avec ces constructions, elle devra suspendre l’écriture correspondante et ouvrir un arbitrage PD-003 avant extension.

## 36. Ownership

OBS possède les contrats transversaux de propriété, méthode, performance, condition, comparaison et rôle biomarqueur général. Knowledge possède les unités épistémiques. Scientific Models possèdent la composition explicative. Les domaines possèdent leurs spécialisations. ResearchProject possède besoins, choix, variables, critères et adoption contextuelle. CDM/Data futurs possèdent représentation et qualité des occurrences. Biostatistics possède l’inférence. REG, TMP et DOC possèdent respectivement Requirements, structure et projection. VAL diagnostique. L’humain mandaté possède les décisions engageantes.

Une correction détectée en aval retourne comme `Contribution` vers l’owner. Aucun consumer ne modifie l’objet source. La matrice détaillée des droits de création, contribution, décision, correction et version figure dans `docs/obs-001-ownership-matrix.md`.

## 37. Identité et versionnement

### 37.1 Règle générale

`sameIdentity` exige la continuité de la propriété ciblée, du principe constitutif, de la sémantique de sortie, de l’owner et du rôle. Un changement compatible produit une nouvelle version/qualification ; une rupture de sens produit une nouvelle identité reliée par `SUPERSEDES` ou spécialisation. Aucune version consommée n’est écrasée.

### 37.2 Tests obligatoires

| Changement | Décision par défaut | Condition |
|---|---|---|
| label, traduction, alias | même identité, metadata versionnée | sens inchangé |
| nouvelle preuve | même identité ; nouvelle qualification/KnowledgeRef | aucun changement de définition |
| correction de performance | même identité ; qualification supersédante | correction sourcée, impact analysé |
| unité | même identité si conversion gouvernée et même sémantique ; sinon nouvelle identité/version majeure | comparabilité démontrée |
| algorithme | nouvelle version si chaîne/sortie compatibles ; nouvelle identité si principe ou sens change | performance/comparabilité réévaluées |
| reconstruction | même règle que l’algorithme | dépendance déterminante explicitée |
| génération de scanner | qualification de compatibilité/version ; nouvelle identité seulement si définition rompue | aucun automatisme par matériel |
| software/firmware | version/compatibilité ; nouvelle identité si sémantique changée | versions effectives conservées |
| réactif/kit/lot | version ou compatibilité ; nouvelle identité si principe/mesurande change | laboratoire owner spécialisé |
| reader procedure | nouvelle version ou identité selon modification de la définition de lecture | inter/intra-reader réévalués |
| calibration | nouvelle qualification/version ; nouvelle identité si référence/sens change | lignage de calibration conservé |
| population valide | qualification d’applicabilité/version ; nouveau rôle si contexte biomarqueur change | aucune généralisation |
| BiomarkerRole | version ou nouvelle identité du rôle ; OP/MD inchangées | cible/usage/population/temps déterminent la rupture |
| principe physique/biologique | nouvelle `MeasurementDefinition` | rupture constitutive présumée |

## 38. Legacy

OBS lit tout artefact V1 selon PD-003 V1 puis applique le crosswalk et la politique legacy V2. Il ne décompose jamais automatiquement un `Biomarqueur` V1.

| Objet V1 | Lecture OBS | Statut si preuves insuffisantes |
|---|---|---|
| Biomarqueur | composé possible de propriété, rôle, méthode, variable ou résultat | `V1_COMPOSITE_LEGACY` + `MAPPING_REQUIRED` |
| Modalité | famille technologique pouvant contribuer à une méthode | `AMBIGUOUS_LEGACY` si propriété/méthode non démontrées |
| Séquence / technique | spécialisation candidate de méthode | `MAPPING_REQUIRED` si version/sens/owner manquent |
| Condition de mesure | condition générale ou contrainte Project à distinguer | `AMBIGUOUS_LEGACY` si portée inconnue |
| Procédure de lecture | définition de lecture ou exécution historique à distinguer | `MAPPING_REQUIRED` |
| Variable | `CanonicalVariable` possible si définition pure ; aucune valeur ne migre implicitement | `V1_COMPOSITE_LEGACY` si définition/occurrence mêlées |

Un mapping n’est admis que si identité, version, owner, propriété, méthode, contexte, provenance et pertes sont démontrables. Sinon l’objet reste V1, lisible et non promu. Le détail figure dans `docs/obs-001-legacy-compatibility.md`.

## 39. Seize cas conceptuels normatifs

Les cas ci-dessous testent l’architecture ; ils ne contiennent ni seuil clinique, ni recommandation, ni protocole. Les noms de propriétés et méthodes sont des identités candidates à résoudre contre Knowledge, jamais des assertions nouvelles.

### A — IRM T1 mapping myocardique

| Élément requis | Application du contrat |
|---|---|
| ScientificModel refs | modèle(s) versionné(s) expliquant le construit myocardique concerné ; aucune adoption implicite |
| ObservableProperty | propriété de relaxation/paramètre myocardique candidat, distincte de la carte et de la séquence |
| MeasurementDefinition | définition IRM T1 mapping spécialisée, avec principe, reconstruction, sémantique de sortie et version |
| BiomarkerRole | facultatif ; rôle candidat seulement si cible, usage, population, temps et preuves sont qualifiés |
| Knowledge refs | concepts T1, mesure, méthode, performances, limites et domaines ; localisateurs/version requis |
| Conditions | champ, séquence/technique, préparation, rythme/mouvement, timing, reconstruction et autres conditions uniquement si documentées |
| Performances | dimensions pertinentes référencées ; aucune valeur inventée ; comparabilité entre versions inconnue sans preuve |
| Confounders | facteurs biologiques/techniques documentés, sans liste universelle imposée |
| Quality | exigences d’acquisition, reconstruction et lecture référencées ; résultat QA absent au niveau OBS |
| Alternatives | autres MeasurementDefinitions visant la même propriété, gardées distinctes et comparées seulement sous preuves |
| Project decision required | retenir/rejeter la méthode, le temps, la modalité, la source et l’opérationnalisation |
| DataNeed possible | caractériser la propriété dans la population/temps du projet ; non adopté par OBS |
| Objects NOT created | aucune CanonicalVariable, occurrence, acquisition adoptée, séquence imposée, Endpoint, valeur ou protocole |
| Owner | OBS transversal ; Imaging pour la spécialisation ; Project pour le choix |
| Provenance | versions du modèle, Knowledge, méthode, qualification et handoff |
| Unknowns | applicabilité locale, équipement, performances, unité/domaine de sortie ou comparabilité si non établis |
| Contradictions | positions Knowledge incompatibles conservées par contexte/version |
| OBS → Project | propriété + méthode(s) candidates + conditions/limites + preuve + décisions ouvertes |

### B — ECV myocardique avec hématocrite externe

| Élément requis | Application du contrat |
|---|---|
| ScientificModel refs | modèle(s) du construit extracellulaire visé, versionnés et référencés |
| ObservableProperty | propriété estimée/composite candidate, distincte de ses inputs et du rôle biomarqueur |
| MeasurementDefinition | définition dérivée reliant inputs IRM et hématocrite selon une règle versionnée ; frontière OBS/Analysis explicitée |
| BiomarkerRole | candidat optionnel ; validité indépendante de la seule calculabilité |
| Knowledge refs | relation entre construit, inputs, méthode de dérivation, validité, performances et limites |
| Conditions | méthode/temps des inputs, compatibilité temporelle, unités, processing et contexte nécessaires |
| Performances | propagation des performances/erreurs et reproductibilité seulement si sourcées |
| Confounders | conditions affectant l’un des inputs ou la dérivation, qualifiées séparément |
| Quality | exigences de qualité de chaque input et de la dérivation ; aucun résultat QA créé |
| Alternatives | autres méthodes d’estimation ou absence d’ECV ; aucune équivalence supposée |
| Project decision required | décider la justification, l’origine de l’hématocrite, la tolérance temporelle et l’usage |
| DataNeed possible | obtenir les inputs nécessaires et leur provenance ; besoin adopté uniquement par Project |
| Objects NOT created | aucun Biospecimen implicite, prélèvement, Variable, occurrence, valeur ECV ou Endpoint |
| Owner | OBS/Imaging pour la définition dérivée ; Laboratory pour la méthode hématocrite ; Project pour l’intégration |
| Provenance | chaque input, méthode/version, règle de dérivation, KnowledgeRefs et handoff |
| Unknowns | comparabilité des méthodes d’input, timing, disponibilité et propagation d’incertitude |
| Contradictions | preuves divergentes sur conditions/performance restent distinctes |
| OBS → Project | définition composite, dépendances multi-domaines, alternatives et décisions nécessaires |

### C — LGE qualitatif / semi-quantitatif

| Élément requis | Application du contrat |
|---|---|
| ScientificModel refs | modèle(s) du phénomène/construit visé(s), sans transformer l’image en vérité du modèle |
| ObservableProperty | propriété/classification candidate, précisant forme qualitative ou semi-quantitative |
| MeasurementDefinition | définitions séparées si procédures, échelles ou sémantiques de sortie diffèrent |
| BiomarkerRole | optionnel et contextualisé ; ne résulte pas du terme LGE seul |
| Knowledge refs | définition de la propriété, relation aux cibles, procédures, performances de lecture et limites |
| Conditions | acquisition, contraste/timing si pertinents et sourcés, reconstruction, display et procédure de lecture |
| Performances | agreement/inter-reader/intra-reader ou robustesse seulement selon tâche définie |
| Confounders | artefacts, contexte anatomique/technique et autres influences documentées |
| Quality | qualité d’entrée et de lecture séparées ; adjudication possible comme procédure spécialisée |
| Alternatives | qualitatif, semi-quantitatif et autres méthodes restent non interchangeables par défaut |
| Project decision required | choisir forme de résultat, procédure, readers, aveugle et usage de projet |
| DataNeed possible | disposer d’une classification ou mesure répondant au construit ; Project seul l’adopte |
| Objects NOT created | aucune classification patient, valeur, décision clinique, Variable ou occurrence |
| Owner | OBS + Imaging/Core Lab pour la spécialisation ; Project pour le choix |
| Provenance | version de procédure, KnowledgeRefs, owners et qualifications de lecture |
| Unknowns | comparabilité des catégories, performances entre readers/sites ou domaine d’usage |
| Contradictions | désaccords de définition/lecture conservés, sans vote automatique |
| OBS → Project | méthodes distinctes, dépendance reader, quality requirements, alternatives et limites |

### D — CBF par ASL

| Élément requis | Application du contrat |
|---|---|
| ScientificModel refs | modèle(s) d’hémodynamique/perfusion applicable(s), sans adoption automatique |
| ObservableProperty | cerebral blood flow comme propriété quantitative candidate, identité Knowledge à résoudre |
| MeasurementDefinition | méthode ASL spécialisée avec principe, inputs, reconstruction et sémantique de sortie versionnés |
| BiomarkerRole | facultatif ; cible/usage/population/temps et preuves requis |
| Knowledge refs | principe ASL, relation à CBF, performances, conditions, limites, controverses et validité |
| Conditions | timing/physiologie, acquisition, processing, calibration et autres dépendances documentées |
| Performances | repeatability, reproducibility, bias, inter-site/device selon preuves applicables |
| Confounders | facteurs physiologiques et techniques sourcés ; aucun effet présumé |
| Quality | exigences d’acquisition/reconstruction/quantification ; qualité réelle future distincte |
| Alternatives | autres ASL ou autres principes visant CBF ; pas d’interchangeabilité implicite |
| Project decision required | retenir méthode, population, temps, équipement et opérationnalisation |
| DataNeed possible | caractériser CBF dans un contexte Project défini |
| Objects NOT created | aucune Acquisition adoptée, Variable, occurrence, seuil, carte ou protocole |
| Owner | OBS transversal ; Imaging pour ASL ; Project pour l’adoption |
| Provenance | modèle, KnowledgeRefs, méthode/version, conditions et handoff |
| Unknowns | applicabilité, performance locale, comparabilité et faisabilité équipement |
| Contradictions | preuves/méthodes divergentes conservées par contexte |
| OBS → Project | propriété CBF + option ASL + performance/quality/conditions + alternatives |

### E — CBF estimé par CT perfusion

| Élément requis | Application du contrat |
|---|---|
| ScientificModel refs | même famille de modèles possible que D, référencée sans duplication |
| ObservableProperty | CBF réutilisée si le sens scientifique est identique ; nouvelle propriété seulement si sens différent démontré |
| MeasurementDefinition | définition CT perfusion distincte, avec acquisition, processing/model et output semantics versionnés |
| BiomarkerRole | candidat éventuel propre à cible, usage, temps, population et méthode compatibles |
| Knowledge refs | principe CT perfusion, modèle d’estimation, performances, conditions, limites et controverses |
| Conditions | acquisition, injection/timing/processing et dépendances seulement comme qualifications sourcées |
| Performances | dimensions pertinentes par version/méthode ; aucune transposition depuis ASL |
| Confounders | influences documentées de la chaîne CT et du contexte |
| Quality | exigences d’entrée, processing et résultat ; aucune occurrence ni carte réelle |
| Alternatives | ASL et autres méthodes ; « même propriété » ne signifie pas « même mesure » |
| Project decision required | décider bénéfice méthodologique, faisabilité, contraintes et méthode retenue |
| DataNeed possible | caractériser CBF selon l’objectif Project, sans modalité prédéterminée |
| Objects NOT created | aucune équivalence ASL/CT, Variable, occurrence, exposition, valeur ou recommandation |
| Owner | OBS + Imaging CT ; Project pour le choix ; autres domaines pour contraintes spécialisées |
| Provenance | modèles, méthode/version, KnowledgeRefs, conditions et handoff |
| Unknowns | comparabilité ASL/CT, biais, disponibilité et domaine local |
| Contradictions | différences contextuelles distinguées des contradictions réelles |
| OBS → Project | méthode CT distincte, comparaison bornée, risques/limites et décisions ouvertes |

### F — Même ObservableProperty, deux méthodes

| Élément requis | Application du contrat |
|---|---|
| ScientificModel refs | modèle unique ou plusieurs modèles selon contexte ; versions explicites |
| ObservableProperty | une identité seulement si le sens est démontré identique |
| MeasurementDefinition | deux identités/version distinctes lorsque principes ou chaînes déterminantes diffèrent |
| BiomarkerRole | zéro, un ou plusieurs ; aucune fusion par propriété commune |
| Knowledge refs | preuve de mesure pour chaque méthode et preuve comparative distincte |
| Conditions | conditions propres à chaque méthode et conditions d’appariement |
| Performances | qualification par méthode ; comparaison uniquement sur dimensions communes |
| Confounders | communs et spécifiques séparés |
| Quality | exigences propres ; une qualité acceptable dans A ne valide pas B |
| Alternatives | alternative, complémentarité ou non-comparabilité qualifiées multi-axes |
| Project decision required | choisir, combiner, apparier, stratifier ou différer |
| DataNeed possible | une information scientifique commune pouvant avoir plusieurs couvertures |
| Objects NOT created | aucune méthode « meilleure », Variable double ou équivalence automatique |
| Owner | OBS pour comparaison ; domaines pour méthodes ; Project pour choix |
| Provenance | versions, preuves de chaque branche et preuve comparative |
| Unknowns | interchangeabilité, biais différentiel, transformation et usage commun |
| Contradictions | résultats de comparaison incompatibles conservés par contexte |
| OBS → Project | matrice de comparaison + limites + décisions et options rejetées |

### G — Méthode disponible mais non valide dans la population

| Élément requis | Application du contrat |
|---|---|
| ScientificModel refs | modèle Project applicable ou candidat, sans effet sur la validité de méthode |
| ObservableProperty | propriété identifiée |
| MeasurementDefinition | méthode définie et disponible, mais qualification `NOT_APPLICABLE` pour la population visée |
| BiomarkerRole | non adoptable dans ce contexte si sa méthode/validité critique échoue |
| Knowledge refs | preuve/domaine établissant l’inapplicabilité ou l’incertitude applicable |
| Conditions | disponibilité locale séparée des conditions scientifiques |
| Performances | les performances hors population ne sont pas transférées |
| Confounders | facteurs de population/contextes concernés |
| Quality | une bonne exécution ne corrige pas l’inapplicabilité |
| Alternatives | autres méthodes ou réduction de portée à instruire |
| Project decision required | rejeter/différer, choisir une alternative ou revoir la population |
| DataNeed possible | peut rester ouvert ; la source disponible ne le couvre pas honnêtement |
| Objects NOT created | aucune Variable fondée sur cette méthode, aucune occurrence attendue, aucun rôle adopté |
| Owner | OBS/domaine qualifie l’applicabilité ; Project décide |
| Provenance | KnowledgeRefs du domaine de validité + preuve de disponibilité locale distincte |
| Unknowns | alternative applicable ou nouvelle preuve éventuelle |
| Contradictions | si preuves conflictuelles, statut `NOT_EVALUABLE` plutôt que résolution forcée |
| OBS → Project | blocage d’adoption nommé, méthode disponible mais scientifiquement irrecevable |

### H — Méthode valide mais impossible sur l’équipement local

| Élément requis | Application du contrat |
|---|---|
| ScientificModel refs | modèle applicable, inchangé par la disponibilité locale |
| ObservableProperty | propriété identifiée |
| MeasurementDefinition | méthode scientifiquement applicable dans son domaine |
| BiomarkerRole | candidat général possible ; adoption Project dépend de l’opérationnalisation |
| Knowledge refs | preuve de validité et dépendances/compatibilité technique documentées |
| Conditions | capacité technique requise comparée à l’équipement local déclaré/vérifié |
| Performances | qualification scientifique conservée ; aucune performance locale inventée |
| Confounders | influences de la méthode, indépendantes de l’indisponibilité |
| Quality | exigences définies mais non exécutables localement |
| Alternatives | équipement/site externe, méthode alternative, adaptation ou abandon à instruire |
| Project decision required | arbitrer faisabilité, site, méthode ou changement de portée |
| DataNeed possible | valide mais non couvert par l’option locale actuelle |
| Objects NOT created | aucune acquisition, Variable, occurrence ou compatibilité forcée |
| Owner | OBS/domaine pour validité ; Project/Operations/équipement pour disponibilité |
| Provenance | KnowledgeRefs + déclaration/qualification locale avec owners séparés |
| Unknowns | disponibilité d’alternatives, coût/organisation et compatibilité non vérifiée |
| Contradictions | différence validité/disponibilité n’est pas une contradiction scientifique |
| OBS → Project | méthode applicable + diagnostic `METHOD_UNAVAILABLE` + alternatives/décision |

### I — ObservableProperty sans BiomarkerRole

| Élément requis | Application du contrat |
|---|---|
| ScientificModel refs | élément de modèle ou concept pouvant être caractérisé, sans rôle indicateur présumé |
| ObservableProperty | propriété autonome et réutilisable |
| MeasurementDefinition | zéro à plusieurs méthodes candidates |
| BiomarkerRole | explicitement absent |
| Knowledge refs | observabilité, méthodes, limites et domaines seulement |
| Conditions | conditions de chaque méthode si elle existe |
| Performances | qualifications par méthode ; absence de méthode permise |
| Confounders | facteurs de mesure documentés |
| Quality | exigences seulement pour les méthodes candidates |
| Alternatives | caractériser autrement, ne pas mesurer ou garder l’inconnue |
| Project decision required | décider si la propriété motive un besoin ; aucun rôle biomarqueur par défaut |
| DataNeed possible | oui, pour caractérisation, sans être un besoin biomarqueur |
| Objects NOT created | aucun BiomarkerRole, DataNeed, Variable ou occurrence automatique |
| Owner | OBS pour propriété/méthode ; Project pour éventuel besoin |
| Provenance | concepts et assertions Knowledge référencés |
| Unknowns | utilité de projet et éventuel rôle futur |
| Contradictions | positions sur observabilité conservées |
| OBS → Project | propriété/méthode avec champ `BiomarkerRole: none` et décision ouverte |

### J — Même ObservableProperty, deux BiomarkerRoles

| Élément requis | Application du contrat |
|---|---|
| ScientificModel refs | modèles/cibles correspondant à chaque usage, avec versions |
| ObservableProperty | une propriété réutilisée |
| MeasurementDefinition | méthodes compatibles avec chaque rôle, potentiellement différentes |
| BiomarkerRole | deux identités/révisions distinctes si cible, usage, population, temps ou méthode diffère |
| Knowledge refs | preuves propres à chaque rôle ; aucune transposition |
| Conditions | domaines et méthodes propres à chaque rôle |
| Performances | qualifications de mesure communes possibles, validité du rôle séparée |
| Confounders | communs ou spécifiques explicités |
| Quality | exigences par méthode/usage |
| Alternatives | rôles concurrents, complémentaires ou aucun rôle |
| Project decision required | adopter/rejeter chaque rôle séparément |
| DataNeed possible | un ou plusieurs besoins selon objectifs ; pas déduits des rôles |
| Objects NOT created | aucune seconde propriété, aucun rôle universel, aucune Variable automatique |
| Owner | OBS/gouvernance de rôle ; Project pour adoption contextuelle |
| Provenance | preuves et domaines de chaque rôle séparés |
| Unknowns | transport d’un rôle vers le contexte de l’autre |
| Contradictions | un rôle soutenu et l’autre contesté coexistent sans moyenne |
| OBS → Project | deux cartes de rôle complètes, avec décisions et preuves indépendantes |

### K — Analyse biologique répétée

| Élément requis | Application du contrat |
|---|---|
| ScientificModel refs | modèle justifiant la propriété et sa dynamique éventuelle |
| ObservableProperty | propriété biologique stable dans son sens, indépendante des temps |
| MeasurementDefinition | méthode Laboratory versionnée ; méthodes changées restent distinguées |
| BiomarkerRole | optionnel, contextualisé par temps/usage |
| Knowledge refs | méthode, validité, conditions pré-analytiques, performances et limites |
| Conditions | Biospecimen/matrice, traitement, stockage, méthode, timing et calibration pertinents |
| Performances | repeatability, inter-lot/instrument/site si applicables et sourcées |
| Confounders | pré-analytique, biologique, traitement et autres influences documentées |
| Quality | exigences prélèvement/méthode ; qualité réelle de chaque occurrence future |
| Alternatives | autre méthode, autre matrice, autre timing ou non-collecte |
| Project decision required | choisir méthode, occasions, source, politique de changement et usage |
| DataNeed possible | besoin répété relié à des `TemporalAnchor`; adopté par Project |
| Objects NOT created | aucune Variable par timepoint, valeur, occurrence ou Biospecimen réel |
| Owner | Laboratory/OBS pour méthode ; Project pour occasions ; CDM/Data futurs pour occurrences |
| Provenance | méthode/version, calibration, source Knowledge et handoff |
| Unknowns | évolution de méthode, comparabilité et conditions réelles |
| Contradictions | méthodes ou références divergentes conservées |
| OBS → Project | une propriété/méthode + exigences temporelles possibles, sans créer les occasions |

### L — Questionnaire clinique

| Élément requis | Application du contrat |
|---|---|
| ScientificModel refs | modèle du construit visé et alternatives explicatives |
| ObservableProperty | construit/classification rapporté ou évalué, identité distincte du questionnaire |
| MeasurementDefinition | instrument versionné + langue + mode + scoring constitutif |
| BiomarkerRole | facultatif ; jamais déduit du score |
| Knowledge refs | validité de construit, performances, applicabilité, versions et traductions |
| Conditions | langue/culture, mode d’administration, assistance, timing, complétude |
| Performances | reliability, agreement, responsiveness ou autres axes seulement si définis/sourcés |
| Confounders | compréhension, contexte, mode, rater/auto-report et influences documentées |
| Quality | règles de complétude/scoring attendues ; réponses réelles hors OBS |
| Alternatives | autre instrument, autre version, évaluation clinique ou absence de mesure |
| Project decision required | choisir instrument/version/langue/temps et usage |
| DataNeed possible | obtenir le construit ou score dans le contexte du projet |
| Objects NOT created | aucune réponse, score individuel, Variable, occurrence ou interprétation clinique |
| Owner | Clinical Assessment/Questionnaire + OBS ; Project pour adoption |
| Provenance | instrument/version, KnowledgeRefs, traduction et qualification |
| Unknowns | applicabilité de version, comparabilité de modes ou gestion des items manquants |
| Contradictions | preuves de versions/populations séparées |
| OBS → Project | définition instrumentale + conditions + limites + décision humaine |

### M — Wearable / capteur longitudinal

| Élément requis | Application du contrat |
|---|---|
| ScientificModel refs | modèle du phénomène/propriété et de sa dynamique temporelle |
| ObservableProperty | propriété physiologique/comportementale candidate, distincte du signal brut |
| MeasurementDefinition | capteur + positionnement + firmware/algorithme déterminant + output semantics |
| BiomarkerRole | optionnel, usage/population/temps strictement contextualisés |
| Knowledge refs | principe, validation, performance, dérive, limites et domaine |
| Conditions | port, calibration, environnement, adhérence, synchronisation, processing |
| Performances | test-retest, inter-device, drift, agreement ou autres axes pertinents |
| Confounders | activité/contexte, placement, perte de signal et influences documentées |
| Quality | critères de couverture/validité de signal attendus ; qualité réelle future séparée |
| Alternatives | mesure ponctuelle, autre dispositif, autre méthode ou aucune collecte |
| Project decision required | dispositif, période, fréquence, adhérence, source et résumé/usage |
| DataNeed possible | caractériser longitudinalement la propriété ; temporalité adoptée par Project |
| Objects NOT created | aucune série, occurrence, agrégat, source, Variable ou analyse longitudinale |
| Owner | Device domain/OBS ; Project ; futur CDM/Data ; Biostatistics pour analyse |
| Provenance | hardware/software/algorithm versions, KnowledgeRefs et handoff |
| Unknowns | compatibilité inter-device, adhérence, couverture et mises à jour |
| Contradictions | performances divergentes par version conservées |
| OBS → Project | méthode versionnée, dépendances, qualité attendue et limites longitudinales |

### N — Mesure dépendante d’un reader humain

| Élément requis | Application du contrat |
|---|---|
| ScientificModel refs | construit/phénomène visé et rôle de la propriété |
| ObservableProperty | propriété ou catégorie évaluée |
| MeasurementDefinition | procédure de lecture versionnée, critères, aveugle/adjudication si constitutifs |
| BiomarkerRole | facultatif et indépendant de la seule expertise du reader |
| Knowledge refs | validité, agreement, formation, limites et contexte |
| Conditions | qualifications du reader, interface, contexte, répétitions et règles de discordance |
| Performances | inter-reader, intra-reader, agreement, robustness selon tâche |
| Confounders | expérience, connaissance contextuelle, ordre, fatigue ou autres influences documentées |
| Quality | exigences de reader/procédure, contrôles et conséquences d’échec |
| Alternatives | lecture centrale/locale, automatisée/assistée ou procédure différente |
| Project decision required | procédure, readers, adjudication, centralisation et usage |
| DataNeed possible | obtenir une mesure/classification selon la procédure adoptée |
| Objects NOT created | aucun reader qualifié, résultat, adjudication réelle, Variable ou occurrence |
| Owner | domaine spécialisé/Core Lab pour procédure ; Project pour organisation |
| Provenance | version de procédure, KnowledgeRefs, owner et qualification |
| Unknowns | performance locale, transferabilité, availability des readers |
| Contradictions | désaccord méthodologique conservé, pas résolu par consensus fictif |
| OBS → Project | dépendance humaine explicite + performance/QA + options de gouvernance |

### O — Segmentation puis quantification

| Élément requis | Application du contrat |
|---|---|
| ScientificModel refs | modèle du construit dont la propriété quantitative est visée |
| ObservableProperty | propriété quantitative finale, distincte du masque/algorithme |
| MeasurementDefinition | chaîne segmentation → quantification si elle satisfait le test §27 |
| BiomarkerRole | optionnel et prouvé séparément |
| Knowledge refs | validation de segmentation/quantification, performances, limites et versions |
| Conditions | image d’entrée, processing, logiciel/algorithme, intervention humaine et calibration |
| Performances | accuracy/agreement/reproducibility selon référence et contexte |
| Confounders | qualité d’image, contours, algorithme, reader et autres influences sourcées |
| Quality | critères d’entrée, segmentation et sortie ; résultat réel hors OBS |
| Alternatives | algorithmes/procédures distincts, manuel/assisté, non-comparabilité possible |
| Project decision required | méthode/version, niveau d’automatisation, QA et usage |
| DataNeed possible | obtenir la propriété quantitative, sans imposer l’algorithme avant décision |
| Objects NOT created | aucun masque, volume, AnalysisResult, Variable, occurrence ou interprétation |
| Owner | OBS + domaine de mesure ; système externe pour exécution ; Project pour choix |
| Provenance | chaîne/version, inputs attendus, KnowledgeRefs et handoff |
| Unknowns | performance entre versions, dépendance data et comparabilité |
| Contradictions | résultats d’études divergents conservés par version/contexte |
| OBS → Project | définition de mesure et, si nécessaire, AnalysisSpecification aval distincte |

### P — Étude sans imagerie

| Élément requis | Application du contrat |
|---|---|
| ScientificModel refs | modèles scientifiques applicables au domaine non-Imaging |
| ObservableProperty | propriétés Laboratory, Clinical, Questionnaire, Device ou autres |
| MeasurementDefinition | spécialisations non-Imaging uniquement |
| BiomarkerRole | zéro à plusieurs selon preuves et contexte |
| Knowledge refs | corpus/méthodes des domaines réellement concernés |
| Conditions | conditions de ces méthodes ; Imaging `NOT_APPLICABLE` |
| Performances | dimensions pertinentes aux méthodes retenues |
| Confounders | influences propres aux domaines |
| Quality | exigences de mesure, prélèvement, administration ou dispositif selon cas |
| Alternatives | méthodes non-Imaging et option de ne pas mesurer |
| Project decision required | besoins, méthodes, temps, sources, Variables et analyses |
| DataNeed possible | oui, sans dépendance Imaging |
| Objects NOT created | aucune Modalité, Acquisition, Séquence, Protocole Imaging ou contribution Imaging |
| Owner | OBS + domaines concernés ; Imaging aucun rôle implicite |
| Provenance | KnowledgeRefs/domaines, méthodes et handoff |
| Unknowns | toute information Imaging non demandée est `NOT_APPLICABLE`, pas manquante |
| Contradictions | contradictions des domaines concernés seulement |
| OBS → Project | paquet transversal sans section Imaging artificielle |

## 40. Cas de non-régression

| # | Invariant testé | Situation | Résultat obligatoire | Échec critique |
|---:|---|---|---|---|
| 1 | ObservableProperty ≠ Phenomenon | même libellé ou proximité conceptuelle | deux identités/rôles reliés, jamais fusionnés | propriété promue en phénomène |
| 2 | propriété sans BiomarkerRole | propriété mesurable sans usage indicateur | rôle absent, absence explicite | rôle créé automatiquement |
| 3 | une propriété, deux rôles | cibles/usages différents | deux rôles contextualisés | rôle universel fusionné |
| 4 | méthode mesurable non applicable | méthode documentée hors population | `NOT_APPLICABLE` contextualisé | performance hors domaine transférée |
| 5 | méthodes non interchangeables | même propriété, principes différents | non-interchangeabilité/unknown conservé | valeurs fusionnées sans preuve |
| 6 | disponible non recommandable | appareil/méthode localement disponible, validité insuffisante | adoption bloquée ou revue | disponibilité promue en validité |
| 7 | pertinente indisponible | méthode applicable, capacité locale absente | science conservée + `METHOD_UNAVAILABLE` | méthode déclarée non valide |
| 8 | performance incertaine | preuve incomplète | `PERFORMANCE_UNKNOWN` dans handoff | valeur par défaut ou omission |
| 9 | contradiction Knowledge | preuves applicables incompatibles | positions, refs et impact propagés | vote ou suppression |
| 10 | OBS ne crée pas de Variable | propriété/méthode complète | handoff seulement | `CanonicalVariable` créée |
| 11 | Imaging borné | projet multi-domaines ou sans Imaging | owner transversal OBS conservé | Imaging owner global |
| 12 | MD ≠ occurrence | méthode disponible et projet adoptant | aucune valeur/statut produit par OBS | `MeasurementDefinition` traitée comme donnée |

Ces contrats deviennent des cas candidats PD-011 ; leur réussite documentaire ne constitue aucun PASS.

## 41. Impacts moteurs

OBS-001 impose une dépendance normative future sans modifier aucun moteur. Les impacts principaux sont : Knowledge expose des références sans duplication ; Scientific Thinking transmet des modèles/propriétés candidates ; Imaging adapte sa chaîne V1 ; Research Project consomme le handoff et conserve la décision ; REG consomme des faits bornés ; TMP/DOC projettent les nouvelles identités ; VAL ajoute des checkpoints ; CDM/Data/Biostatistics préservent le sens sans l’absorber.

Chaque adaptation doit posséder une mission séparée, un adapter legacy explicite, des tests de non-régression et une évaluation proportionnée. `COMPATIBLE_IN_PRINCIPLE` ne signifie pas implémenté. La matrice complète figure dans `docs/obs-001-engine-impact-matrix.md`.

## 42. Évaluation future

### 42.1 Contrats à préparer sous PD-011

- les 16 cas A–P et les 12 cas de non-régression ;
- des cas experts, incomplets, contradictoires, impossibles, hors domaine et multicentriques ;
- des références expertes indépendantes par domaine ;
- des versions gelées de PD-003, OBS, Knowledge, méthodes et cas ;
- des métriques séparées de fidélité, applicabilité, traçabilité, non-promotion, comparabilité, gestion des inconnues et compréhension ;
- des failure modes et erreurs critiques ;
- des preuves de conservation des owners, versions, conditions, limites et décisions ;
- des seuils continus contextualisés préspécifiés par la future campagne, jamais par OBS-001.

### 42.2 Gates critiques candidats

Tolérance nulle pour : propriété confondue avec phénomène ; preuve inventée ; rôle biomarqueur déduit de la mesurabilité ; méthode hors domaine proposée sans blocage ; contradiction supprimée ; Variable ou occurrence créée par OBS ; owner spécialisé écrasé ; provenance critique perdue ; relation ou objet canonique inventé ; décision humaine contournée.

VAL pourra vérifier la fidélité structurale d’un handoff. Il ne pourra jamais déclarer une méthode scientifiquement valide par cohérence du graphe. Seule une campagne PD-011 recevable peut qualifier une revendication définie.

## 43. Gouvernance

### 43.1 Autorité et contributions

OBS-001 évolue par décision documentaire explicite de l’owner du domaine OBS, avec contributions des owners Knowledge, Scientific Models, Imaging, Laboratory, Clinical Assessment, Device, Project, Data et Biostatistics selon impact. Une décision engageante nomme acteur, mandat, versions, alternatives, contradictions et analyse d’impact.

### 43.2 Conditions d’évolution

Le document évolue si changent : le contrat spécialisé d’un objet ; la frontière OBS/Knowledge/Model/Project/Analysis ; la politique de performance/condition/comparabilité ; un handoff ; l’ownership transversal ; les règles d’identité/version ; les diagnostics ; la compatibilité legacy ; ou une dépendance future vers CDM/Biostatistics.

Il ne doit jamais évoluer pour : ajouter une valeur scientifique ; refléter un provider, quota, panne, format, API, stockage, écran, prompt, scanner, produit ou protocole ; aligner la norme sur une implémentation ; déclarer une campagne réussie ; ou masquer une contradiction.

### 43.3 Gate PD-003

Toute demande de nouvel objet racine, rôle canonique, relation structurante ou modification d’invariant déclenche : analyse des alternatives `OBJECT/ROLE/RELATION/VALUE_OBJECT/SUBRESOURCE/SPECIALIZATION/PROJECTION/NOT_REQUIRED` ; déclaration `PD003_EVOLUTION_REQUIRED` si indispensable ; suspension de l’écriture concernée ; puis arbitrage coordonné de PD-003 avant évolution OBS. Aucun tel besoin n’est bloquant dans la version 1.0.

## 44. Limitations

1. Aucun moteur OBS n’est implémenté, activé ou évalué.
2. Les taxonomies de domaine restent ouvertes ; le catalogue sémantique ne prétend pas à l’exhaustivité scientifique.
3. Aucun catalogue d’équipements, de méthodes, de propriétés ou de rôles réels n’est créé.
4. Aucune performance, validité, équivalence ou limite scientifique particulière n’est admise par ce document.
5. L’owner organisationnel des Scientific Models réutilisables reste à instituer dans PD-003 V2.
6. CDM-001, Data Management et Biostatistics restent des architectures futures ; seuls leurs contrats de frontière sont préparés.
7. Les moteurs V1, dont Imaging et Research Project, ne sont pas rendus conformes par l’admission.
8. Les mappings legacy réels restent à instruire objet par objet ; aucune migration n’est réalisée.
9. Les critères PD-011, jeux, experts, seuils et campagnes restent à créer et à geler séparément.
10. Aucune UI, API, structure de stockage, donnée, protocole clinique ou d’acquisition n’est défini.
11. Aucun provider LLM live, Gemini, benchmark provider ou campagne SEM n’a été utilisé ; quota Gemini et SEM-001R3 sont sans effet sur OBS-001.
12. L’admission documentaire n’est ni une validation scientifique, ni un PASS, ni une publication ou activation produit.

Ces limites n’empêchent pas l’admission de l’architecture conceptuelle ; elles bornent strictement toute revendication et toute prochaine mission.

## 45. Prochaine étape

L’ordre admissible est :

1. produire, dans une mission séparée, une analyse d’adaptation par consumer sans modifier les sources V1 ;
2. définir CDM-001 à partir des références et invariants du §32, sans stockage ni implémentation implicites ;
3. définir les architectures normatives Data Management et Biostatistics, en conservant la frontière §27 ;
4. concevoir des adapters legacy et des contrats de double lecture, sans migration automatique ;
5. préparer une campagne PD-011 indépendante couvrant les cas de la présente norme ;
6. n’autoriser une implémentation, migration ou activation qu’après décisions distinctes.

`OBS001_OBSERVABILITY_MEASUREMENT_ARCHITECTURE_ADMITTED_WITH_LIMITATIONS`
