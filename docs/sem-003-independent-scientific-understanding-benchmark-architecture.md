# SEM-003 — Independent Scientific Understanding Benchmark Architecture

## Architecture normative spécialisée du futur benchmark indépendant de compréhension scientifique

| Champ | Valeur |
|---|---|
| Identifiant documentaire | `SEM-003` |
| Version | `1.0` |
| Statut | `ADMITTED_WITH_LIMITATIONS` |
| Niveau documentaire | `NIVEAU_1 — référence normative spécialisée` |
| Source maîtresse | `docs/sem-003-independent-scientific-understanding-benchmark-architecture.md` |
| Date de conception | 13 août 2026 |
| Opération d’admission | `SEM-003B — Benchmark Architecture Admission + Development / Calibration Authoring Protocol` |
| Index de gouvernance après admission | `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`, version 1.32, `OFFICIAL` |
| Autorité de compétence | `docs/sem-002-scientific-understanding-competence-contract.md` |
| Autorité d’évaluation | `docs/pd-011-evaluation-framework.md` |
| Nature | architecture documentaire et méthodologique ; aucun cas de qualification créé |
| Décision | `SEM003_ADMITTED_WITH_LIMITATIONS` |

---

## 0. Décision, portée et condition de lecture

SEM-003 définit l’architecture d’un futur benchmark indépendant destiné à répondre à la question :

> NOXIA comprend-il réellement la demande scientifique de l’utilisateur ?

Il ne cherche pas principalement à établir si une génération reproduit un graphe, une topologie ou un JSON prédéfini. Il définit un jugement portant sur les obligations scientifiques préservées, les erreurs interdites, le statut épistémique, la provenance, l’ownership, les inconnues, les ambiguïtés, les clarifications et les enrichissements contextuels.

Le présent document est un **contrat spécialisé de benchmark admis avec limitations**. Il n’est :

- ni un nouveau modèle métier de NOXIA ;
- ni un protocole PD-011 préenregistré ;
- ni un jeu de cas ;
- ni une référence experte finale ;
- ni une calibration ;
- ni une preuve de performance de SEM ;
- ni une autorisation de modifier ou d’exécuter SEM.

L’admission de SEM-003 signifie uniquement que son architecture est cohérente, gouvernable et subordonnée aux autorités applicables. Elle ne résout pas les paramètres qui appartiennent à la calibration, au protocole formel PD-011, à la qualification de l’évaluateur ou à la gouvernance physique du blind set.

À la fin de l’opération SEM-003B :

- SEM-003 est `ADMITTED_WITH_LIMITATIONS` ;
- aucun seuil continu n’est fixé ;
- le nombre de répétitions indépendantes reste à calibrer sous PD-011 ;
- aucun cas `BLIND_SEALED` n’existe ;
- H01–H30 restent `HISTORICAL_LEGACY_NON_REGRESSION_CORPUS` ;
- l’index de gouvernance version 1.32 enregistre l’admission et ses limites ;
- aucune revendication PASS, FAIL ou NON CONCLUANT n’est produite.

## 1. Autorités et séparation des plans

### 1.1 Ordre d’autorité appliqué

La conception a été conduite selon l’ordre suivant :

1. `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` ;
2. Charte fondatrice, source maîtresse `output/documents/noxia-la-charte-fondatrice-edition-editoriale.docx` ;
3. Scientific Product Manifesto V2, source maîtresse `output/documents/noxia-protocol-designer-scientific-product-manifesto-v2.0.docx` ;
4. Editorial Engine — Architecture Manifesto, autorité externe `editorial-engine/docs/architecture-manifesto.md` ;
5. `docs/sem-002-scientific-understanding-competence-contract.md` ;
6. `docs/sem-002a-scientific-understanding-competence-contract-admission-report.md` ;
7. PD-003 V2 et ses annexes de compatibilité, ownership, relations et impacts moteurs ;
8. OBS-001 et ses annexes utiles ;
9. PD-005 pour la responsabilité des rôles IA ;
10. PD-009 pour la valeur décisionnelle d’une clarification ;
11. PD-011 pour les jeux, références, métriques, répétitions, seuils et décisions ;
12. rapports SEM historiques strictement nécessaires, lus uniquement comme preuves datées.

### 1.2 Classification des affirmations

| Classe | Contenu applicable à SEM-003 | Autorité ou preuve |
|---|---|---|
| Principes établis | science avant production ; absence de donnée non remplacée ; incertitude visible ; décision humaine ; contexte, provenance et historique conservés | Charte fondatrice ; Scientific Product Manifesto V2 |
| Références normatives | modèle métier et ownership ; observabilité et mesure ; prochaine action ; évaluation ; contrat de compétence SEM | PD-003 V2 ; OBS-001 ; PD-009 ; PD-011 ; SEM-002 |
| Corpus scientifique | aucun corpus scientifique nouveau ; les futurs cas devront dater leur état de connaissance | futures références expertes sous PD-011 |
| Cible | benchmark indépendant à enveloppes d’acceptation, multi-run, protégé contre l’exposition et capable d’accepter des équivalences sémantiques | présent document admis avec limitations |
| État réellement implémenté | SEM legacy local historiquement validé techniquement ; aucune infrastructure SEM-003, aucun jeu et aucun évaluateur SEM-003 démontrés | rapports SEM datés ; état documentaire SEM-002A |
| Hypothèses | faisabilité du scellement, qualité de l’adjudication, métriques calculables, séparation organisationnelle suffisante, nombre de runs et seuils | à calibrer et arbitrer dans les phases futures |

### 1.3 Préséance et contradictions

Le `SOURCE-OF-TRUTH-INDEX` route les autorités mais ne produit aucune vérité scientifique. SEM-002 définit la compétence attendue. PD-003 V2 reste seul propriétaire des catégories métier, relations, statuts, ownership et frontières du produit. OBS-001 spécialise `ObservableProperty`, `MeasurementDefinition` et `BiomarkerRole`. PD-009 possède la décision de poser ou non une clarification. PD-011 possède les protocoles d’évaluation, les métriques admises, les seuils, les répétitions, les portes et les décisions de campagne.

Le terme `Scientific Understanding Judgment Unit` utilisé ci-dessous désigne une unité de benchmark. Il ne crée aucun objet canonique PD-003. Le terme `Acceptance Envelope` désigne une référence d’évaluation structurée au sens de PD-011 ; il ne remplace pas une vérité métier et ne modifie pas le modèle produit.

La règle PD-011 imposant une référence experte pluraliste s’applique. La composition exacte au-delà de son minimum normatif, la séparation pratique des personnes et la gouvernance du blind package devront être décidées avant SEM-003C. Aucune solution technique de stockage n’est silencieusement admise ici.

### 1.4 Usage des preuves historiques

Le rapport `docs/sem-001r5f-relation-ownership-and-critic-oscillation-resolution-report.md` démontre historiquement une fréquence importante d’inversions inter-campagnes, plusieurs configurations successives, des réparations répétées et un risque élevé de sur-ajustement. Cette observation justifie la séparation stricte des jeux et l’évaluation multi-run ; elle ne crée ni propriété scientifique, ni seuil, ni règle de performance universelle.

H01–H30 sont exposés. Ils peuvent alimenter la non-régression technique ou illustrer une propriété connue. Ils ne peuvent plus constituer une preuve indépendante de généralisation.

## 2. Principe scientifique du benchmark

### 2.1 Vecteur d’obligations scientifiques

La compréhension est évaluée au moyen d’un vecteur explicite pouvant contenir :

- les contenus explicitement fournis ;
- les relations et leurs directions ;
- les rôles scientifiques ;
- les polarités, négations, conditionnalités et limites causales ;
- les temporalités et comparaisons ;
- les corrections et changements d’avis ;
- la provenance et la reconstructibilité ;
- les implicites nécessaires et contextuels ;
- les inconnues et informations manquantes ;
- les ambiguïtés qu’il faut conserver ;
- les candidats contextuels recevables ;
- les clarifications ayant une valeur décisionnelle ;
- les limites d’ownership ;
- les promotions et inventions interdites.

Deux sorties structurellement différentes peuvent satisfaire le même vecteur. Deux sorties de topologie proche peuvent diverger scientifiquement si elles n’accordent pas le même statut épistémique à une information, si elles perdent une relation, si elles effacent une inconnue, si elles déplacent l’ownership ou si elles rompent la provenance.

### 2.2 Trois familles non fusionnables

#### A. `SAFETY_FIDELITY_INVARIANT`

Ces propriétés sont absolues, jugées à chaque run sémantiquement évaluable et non compensables. Une violation applicable bloque la porte correspondante, indépendamment des moyennes de compétence ou d’enrichissement.

#### B. `SCIENTIFIC_UNDERSTANDING_COMPETENCE`

Ces propriétés sont mesurées sur une distribution de runs et de cas selon un protocole préspécifié. Une erreur grave reste individuellement visible et peut déclencher une porte critique ; l’agrégation statistique ne l’efface pas.

#### C. `CONTEXTUAL_ENRICHMENT`

Cette propriété mesure la capacité à proposer des candidats pertinents, contextualisés et correctement étiquetés sans les promouvoir. Un candidat optionnel n’est jamais requis dans toutes les générations. L’absence d’enrichissement ne peut pas être maquillée en fidélité, et l’abondance d’enrichissement ne compense aucune perte de fidélité.

## 3. Unités contractuelles du futur benchmark

### 3.1 Définition d’un cas

Un cas de benchmark est une situation scientifique versionnée, bornée et gouvernée qui combine :

- une demande source et, si nécessaire, une conversation multi-tour ;
- un contexte scientifique daté ;
- des informations disponibles et volontairement absentes ;
- une ou plusieurs difficultés conceptuelles ciblées ;
- une référence experte décrivant un espace de réponses admissibles ;
- des propriétés critiques et statistiques applicables ;
- un statut d’exposition ;
- un historique d’auteur, de revue, de gel, d’usage et de retrait.

Un cas n’est pas une simple paire prompt/réponse. Une paraphrase, une inversion cosmétique ou un changement de forme ne crée pas une indépendance nouvelle si la source, les faits discriminants ou la chaîne de raisonnement restent apparentés.

### 3.2 `Scientific Understanding Judgment Unit`

La structure suivante est une **fiche de jugement de benchmark**. Les noms anglais sont des identifiants spécialisés du benchmark parce que SEM-002 utilise déjà ce registre lexical. Ils ne deviennent ni objets ni vocabulaires métier PD-003.

| Champ candidat | Fonction | Règle |
|---|---|---|
| `caseId` | identité stable du cas | opaque au contenu ; version distincte ; jamais réutilisée |
| `sourceRequest` | demande utilisateur effectivement évaluée | contenu exact, langue et provenance conservés |
| `language` | langue et variante utiles au jugement | ne crée pas une équivalence automatique entre traductions |
| `domain` | domaine scientifique borné | distinct du statut d’expertise et du domaine revendiqué par la campagne |
| `scenarioCategory` | catégorie SEM-002 principale et éventuelles secondaires | aucune catégorie ne remplace les propriétés applicables |
| `conversationTurns` | historique multi-tour ordonné | corrections, changements d’avis et ellipses conservés sans écrasement |
| `explicitObligations` | contenus explicitement fournis à préserver | chaque obligation possède source, portée, criticité et localisateur |
| `relationObligations` | relations, direction, rôle et portée | endpoints et sens scientifique explicités ; proximité insuffisante |
| `polarityObligations` | affirmation, négation, condition, non-causalité | la polarité ne peut être reconstruite par défaut |
| `timingObligations` | temporalités, fenêtres et comparaisons | chaque ancrage est relié à l’objet concerné |
| `correctionObligations` | éléments remplacés, maintenus ou retirés | l’état courant et l’historique restent reconstructibles |
| `requiredUnknowns` | informations qui doivent rester inconnues | aucune complétion silencieuse ; effet décisionnel qualifié |
| `requiredAmbiguities` | interprétations concurrentes à conserver | l’enveloppe indique ce qui permettrait de les résoudre |
| `forbiddenPromotions` | changements de statut épistémique ou d’ownership interdits | inclut Knowledge → Project et inférence → déclaration utilisateur |
| `forbiddenInventions` | faits, relations, causalités ou décisions sans support | criticité et effet scientifique préqualifiés |
| `expectedInferenceClasses` | classes d’inférence recevables ou attendues | distinguées de l’explicite et reliées à leur support contextuel |
| `contextualCandidateEnvelope` | espace de candidats utiles mais optionnels | peut être vide ; applicabilité, justification et exclusions explicites |
| `clarificationExpectation` | besoin, classe ou absence de clarification attendue | fondé sur la valeur décisionnelle PD-009, jamais sur la complétude abstraite |
| `ownershipBoundaries` | owners et promotions nécessitant adoption | reprend PD-003/OBS ; aucune responsabilité créée par le benchmark |
| `acceptableSemanticVariants` | représentations différentes mais potentiellement équivalentes | chaque variante est justifiée par le même vecteur d’obligations |
| `criticalProperties` | propriétés absolues applicables | évaluées par run ; une violation n’est pas moyennée |
| `statisticalProperties` | propriétés à agréger | métrique, unité et traitement des non-évaluables préspécifiés ailleurs |
| `adjudicationNotes` | raisonnement expert, réserves et conflits | versionné, séparé de l’observation d’une sortie aveugle avant gel |
| `exposureStatus` | état de visibilité du cas | transition explicite, horodatée et irréversible lorsqu’elle retire l’aveugle |

### 3.3 Sous-unités de jugement

Le cas est l’unité de contexte. La propriété applicable au run est l’unité principale de décision. Les obligations atomiques servent au calcul et à l’explication, mais ne doivent jamais être agrégées en perdant leur sens scientifique.

Le lignage minimal futur est :

`configuration → campagne → jeu → cas/version → Acceptance Envelope/version → run → obligation/propriété → jugement → métrique → porte → décision PD-011`.

## 4. Registre des 18 propriétés SEM-002

Les codes `P01` à `P18` sont des alias propres au présent document. Ils ne remplacent pas les identifiants SEM-002.

| Property | Family | Run-level ou distribution | Absolute ou statistical | Failure class | Compensable ? |
|---|---|---|---|---|---|
| P01 — `PROPERTY_EXPLICIT_CONTENT_PRESERVED` | `SAFETY_FIDELITY_INVARIANT` | run-level | absolute | `EXPLICIT_FIDELITY_FAILURE` | Non |
| P02 — `PROPERTY_EXPLICIT_RELATIONS_PRESERVED` | `SAFETY_FIDELITY_INVARIANT` | run-level | absolute | `RELATION_SEMANTICS_FAILURE` | Non |
| P03 — `PROPERTY_POLARITY_AND_CONDITIONALITY_PRESERVED` | `SAFETY_FIDELITY_INVARIANT` | run-level | absolute | `POLARITY_OR_CAUSALITY_FAILURE` | Non |
| P04 — `PROPERTY_COMPARISON_AND_TIMING_PRESERVED` | `SAFETY_FIDELITY_INVARIANT` | run-level | absolute | `EXPLICIT_FIDELITY_FAILURE` | Non |
| P05 — `PROPERTY_CORRECTION_PROPAGATED_WITH_HISTORY` | `SAFETY_FIDELITY_INVARIANT` | run-level | absolute | `EXPLICIT_FIDELITY_FAILURE` | Non |
| P06 — `PROPERTY_NO_UNSUPPORTED_CAUSAL_PROMOTION` | `SAFETY_FIDELITY_INVARIANT` | run-level | absolute | `POLARITY_OR_CAUSALITY_FAILURE` | Non |
| P07 — `PROPERTY_CONTEXTUAL_INFERENCE_NOT_USER_FACT` | `SAFETY_FIDELITY_INVARIANT` | run-level | absolute | `EPISTEMIC_PROMOTION_FAILURE` | Non |
| P08 — `PROPERTY_KNOWLEDGE_SUPPORT_NOT_PROJECT_TRUTH` | `SAFETY_FIDELITY_INVARIANT` | run-level | absolute | `EPISTEMIC_PROMOTION_FAILURE` | Non |
| P09 — `PROPERTY_AMBIGUITY_AND_UNKNOWN_PRESERVED` | `SAFETY_FIDELITY_INVARIANT` | run-level | absolute | `MISSING_INFORMATION_FAILURE` | Non |
| P10 — `PROPERTY_NO_UNSUPPORTED_INVENTION` | `SAFETY_FIDELITY_INVARIANT` | run-level | absolute | `UNSUPPORTED_INVENTION_FAILURE` | Non |
| P11 — `PROPERTY_OWNER_AND_ADOPTION_BOUNDARIES_PRESERVED` | `SAFETY_FIDELITY_INVARIANT` | run-level | absolute | `OWNERSHIP_BOUNDARY_FAILURE` | Non |
| P12 — `PROPERTY_PROVENANCE_RECONSTRUCTIBLE` | `SAFETY_FIDELITY_INVARIANT` | run-level | absolute | `PROVENANCE_FAILURE` | Non |
| P13 — `PROPERTY_MISSING_CRITICAL_INFORMATION_DETECTED` | `SCIENTIFIC_UNDERSTANDING_COMPETENCE` | distribution, avec annotation run-level | statistical | `MISSING_INFORMATION_FAILURE` | Agrégation dans cette propriété seulement ; jamais contre une porte absolue |
| P14 — `PROPERTY_CONCEPTUAL_PLAN_SEPARATION` | `SCIENTIFIC_UNDERSTANDING_COMPETENCE` | distribution, avec annotation run-level | statistical | `CONCEPTUAL_PLAN_COLLAPSE` | Agrégation dans cette propriété seulement ; erreur grave signalée séparément |
| P15 — `PROPERTY_SEMANTIC_EQUIVALENCE_RECOGNIZED` | `SCIENTIFIC_UNDERSTANDING_COMPETENCE` | distribution, avec annotation run-level | statistical | `SEMANTIC_EQUIVALENCE_EVALUATION_FAILURE` | Agrégation dans cette propriété seulement |
| P16 — `PROPERTY_CLARIFICATION_HAS_DECISIONAL_VALUE` | `SCIENTIFIC_UNDERSTANDING_COMPETENCE` | distribution, avec annotation run-level | statistical | `CLARIFICATION_FAILURE` | Agrégation dans cette propriété seulement |
| P17 — `PROPERTY_NONCRITICAL_FORM_VARIATION_ALLOWED` | `SCIENTIFIC_UNDERSTANDING_COMPETENCE` | distribution et comparaisons de runs | statistical | `SEMANTIC_EQUIVALENCE_EVALUATION_FAILURE` | Agrégation dans cette propriété seulement |
| P18 — `PROPERTY_CONTEXTUAL_CANDIDATE_RELEVANCE` | `CONTEXTUAL_ENRICHMENT` | distribution, avec annotation run-level | statistical | `CONTEXTUAL_UNDERSTANDING_FAILURE` | Agrégation d’enrichissement seulement ; jamais contre fidélité ou safety |

Un run `NOT_EVALUABLE` reste dans le dénominateur de fiabilité prévu par le protocole. Il ne devient ni un succès, ni une absence silencieuse. Un `SAFE_FAIL_CLOSED` correctement qualifié peut réussir une obligation de sûreté lorsqu’un refus est attendu ; il ne démontre pas à lui seul une compréhension positive.

## 5. `Acceptance Envelope`

### 5.1 Finalité

Chaque cas futur possède une `Acceptance Envelope` versionnée. Elle décrit l’espace des réponses scientifiquement admissibles sans imposer un Gold Frame exhaustif unique.

| Zone | Contenu | Effet de jugement |
|---|---|---|
| `REQUIRED` | éléments ou propriétés qui doivent être présents ou reconstructibles | omission applicable = échec de la propriété concernée |
| `PROHIBITED` | promotions, inventions, pertes, contradictions effacées ou décisions indues | présence applicable = échec, potentiellement bloquant |
| `ACCEPTABLE_SEMANTIC_VARIANT` | compositions différentes satisfaisant les mêmes obligations | recevable après contrôles critiques et équivalence traçable |
| `OPTIONAL_RELEVANT` | candidats contextuels utiles mais non indispensables | contribue à P18 ; absence isolée non bloquante |
| `ADMISSIBLE_AMBIGUITY` | interprétations concurrentes que la science ou la demande ne départage pas | fermeture arbitraire = échec ; conservation qualifiée = recevable |
| `EXPECTED_CLARIFICATION` | besoin ou classe de question à valeur décisionnelle suffisante | qualité et pertinence évaluées ; formulation littérale non imposée |

### 5.2 Règles d’acceptation

1. Un objet et une relation peuvent être équivalents à une composition de plusieurs objets et relations si le vecteur d’obligations, les conséquences, la provenance et l’ownership restent identiques.
2. Un niveau de détail supérieur n’est pas automatiquement meilleur ni équivalent.
3. Une information contextuelle recevable reste une inférence ou un candidat ; elle ne devient pas une déclaration utilisateur.
4. Un candidat Knowledge ne devient pas une décision du `ResearchProject` sans adoption autorisée.
5. Une ambiguïté non résoluble reste ouverte.
6. Une clarification ne réussit que si une réponse plausible peut modifier une décision, une branche, une limite, un risque, un objet ou une projection selon PD-009.
7. Les `adjudicationNotes` ne sont pas enrichies après observation des sorties aveugles pour rendre une réponse favorable ; toute lacune de référence entraîne la disposition prévue par PD-011.
8. Une variante admissible peut être ajoutée dans une nouvelle version de référence uniquement hors campagne close, avec justification, historique et analyse d’impact.

### 5.3 Dispositions de jugement candidates

Les dispositions de sortie restent celles admises par SEM-002 :

- `ACCEPTABLE_SEMANTIC_EQUIVALENT` ;
- `ACCEPTABLE_NONCRITICAL_VARIATION` ;
- `SAFE_FAIL_CLOSED` ;
- `SEMANTIC_FAILURE` ;
- `PROVIDER_EXECUTION_FAILURE` ;
- `NOT_EVALUABLE`.

Elles ne valent pas décision de campagne. La décision PASS, FAIL ou NON CONCLUANT appartient exclusivement à PD-011.

## 6. Statuts d’exposition et protection du blind set

### 6.1 Statuts obligatoires

| Statut | Sens | Accès et usage permis |
|---|---|---|
| `DESIGN_ONLY` | squelette ou concept de cas non admis dans un jeu | visible aux auteurs ; aucune preuve de performance |
| `DEVELOPMENT_VISIBLE` | cas et référence exposés au développement | correction du système autorisée ; jamais preuve aveugle |
| `CALIBRATION_VISIBLE` | cas réservé à la calibration des métriques, seuils et répétitions | visible au groupe de calibration ; ne prouve pas la qualification finale |
| `BLIND_SEALED` | cas et références gelés, scellés et non accessibles à l’équipe qui modifie SEM | exécution uniquement par procédure contrôlée après protocole gelé |
| `QUALIFICATION_EXECUTED` | cas scellé exécuté dans une campagne identifiée, résultats encore gouvernés | aucune réparation ni modification de référence pendant la campagne |
| `EXPOSED_AFTER_QUALIFICATION` | contenu ou référence dévoilé après décision ou incident | résultat historique conservé ; cas retiré de toute future preuve indépendante |
| `RETIRED_NON_REGRESSION` | cas exposé ou retiré conservé pour incident/non-régression | réutilisable techniquement ; jamais présenté comme blind set indépendant |

### 6.2 Transitions gouvernées

Les transitions admissibles sont explicites, datées et journalisées. Une trajectoire typique peut être :

`DESIGN_ONLY → DEVELOPMENT_VISIBLE`

ou :

`DESIGN_ONLY → CALIBRATION_VISIBLE`

ou, après création indépendante et revue :

`DESIGN_ONLY → BLIND_SEALED → QUALIFICATION_EXECUTED → EXPOSED_AFTER_QUALIFICATION → RETIRED_NON_REGRESSION`.

Une transition vers `BLIND_SEALED` est interdite si le contenu, une paraphrase proche, les faits discriminants ou la référence ont été exposés à l’équipe qui adapte SEM. Un cas exposé à une réparation ne peut pas revenir à `BLIND_SEALED`. Une campagne close n’est jamais réécrite lorsqu’un cas change ensuite de statut.

Chaque événement d’exposition conserve au minimum : identité/version du cas, ancien et nouveau statut, date, auteur, motif, personnes ou groupes exposés, campagne concernée, digest, incident éventuel et disposition.

### 6.3 Options d’architecture de protection

| Option | Forces | Limites et décisions restantes |
|---|---|---|
| Dépôt privé séparé | séparation nette, historique, contrôle d’accès et revue | administrateurs, clones et sauvegardes peuvent exposer ; gouvernance d’accès à décider |
| Artefact chiffré dans ou hors dépôt | contenu illisible sans clé ; digest simple | gestion des clés, métadonnées visibles, risque de déchiffrement dans l’environnement de développement |
| Stockage hors dépôt | forte séparation du code et des cas | traçabilité, sauvegarde, continuité, contrôle des versions et audit à garantir |
| Injection contrôlée | l’opérateur reçoit seulement le payload nécessaire à l’exécution | runner isolé, journalisation et effacement des traces à définir |
| Évaluateur détenu par une personne différente | séparation organisationnelle des références et de la notation | faisabilité dépend de l’équipe ; conflits et continuité à gérer |
| Package scellé avec digest | prouve l’identité du package exécuté | le digest ne protège pas la confidentialité et doit être lié à un manifeste signé ou approuvé |

### 6.4 Recommandation principale candidate

La recommandation principale est une architecture combinée :

1. le dépôt de développement NOXIA ne conserve que l’architecture, les schémas génériques, les catégories, les règles de décision et les manifestes non secrets ;
2. le payload aveugle et les références expertes cachées résident dans un stockage séparé à accès contrôlé, détenu par le propriétaire du blind package ;
3. le texte de demande injecté au système et la référence experte cachée sont conservés comme compartiments distincts lorsque la procédure exige que l’opérateur voie la demande sans voir la référence ;
4. un package immuable est scellé avec un digest et relié au protocole préenregistré ;
5. un mécanisme d’injection contrôlée fournit les demandes au runner isolé sans exposer les références ;
6. les sorties sont transférées à l’évaluateur indépendant ; l’opérateur de campagne ne modifie ni SEM, ni le package, ni la référence ;
7. aucun résultat intermédiaire du blind set n’est communiqué à l’équipe de développement avant la clôture et la décision de campagne ;
8. après exposition, les cas rejoignent la non-régression et un futur blind set doit être indépendant.

Cette recommandation n’admet ni plateforme, ni dépôt, ni chiffrement, ni gestionnaire de clés. Restent à arbitrer : menace couverte, politique d’accès, organisation réelle, disponibilité d’un dépositaire indépendant, chiffrement, sauvegardes, confidentialité, rétention, journalisation, signature des digests, récupération après incident et coûts opérationnels.

## 7. Architecture des jeux

### 7.1 `Development Set`

Usage : exemples visibles, développement, tests d’intégration, apprentissage des propriétés et réparation autorisée. Les références peuvent être détaillées. Les résultats servent au diagnostic, jamais à une revendication de généralisation indépendante.

### 7.2 `Calibration Set`

Usage : calibrer sous PD-011 le nombre de runs, les métriques, la qualité de l’évaluateur, les agrégations, les intervalles d’incertitude, les seuils continus et le traitement des non-évaluables. Ce jeu reste distinct du Development Set et du Blind Qualification Set. Il ne porte aucune décision finale.

### 7.3 `Blind Qualification Set`

Usage : mesure indépendante finale sur une configuration gelée. Les seuils, répétitions, propriétés, références, règles d’arrêt et analyse sont préspécifiés. Aucune réparation, aucun amendement favorable et aucun accès aux références n’est autorisé pendant la campagne. Les résultats défavorables et non évaluables restent visibles.

### 7.4 `Non-Regression Corpus`

Usage : H01–H30, cas Development exposés, anciens cas aveugles après exposition, incidents et propriétés techniques ciblées. Il est versionné, rejoué pour toute version applicable et enrichi après incident. Il ne peut jamais être présenté comme preuve de généralisation indépendante.

### 7.5 Séparation et parenté

Les jeux Development, Calibration et Blind ne partagent ni cas, ni traduction directe, ni paraphrase, ni faits discriminants, ni scénario dérivé, ni référence source permettant de reconstruire la même réponse. Les catégories peuvent être communes ; les contenus et chaînes de raisonnement ne le sont pas.

Une analyse de parenté documente au minimum : origine, auteur, domaine, faits discriminants, relations attendues, ambiguïtés, chaîne de raisonnement, sources, formulation, variantes et exposition. Un doute raisonnable sur la parenté interdit l’usage aveugle jusqu’à arbitrage.

### 7.6 Articulation avec le `Jeu de qualification` de PD-011

PD-011 distingue déjà un `Jeu de qualification` contrôlé, chargé de décider si une version peut ouvrir le jeu aveugle. Le `Calibration Set` défini par SEM-003 répond à une autre question : il sert à fixer les métriques, les répétitions, les agrégations et les seuils continus. Une performance favorable en calibration n’autorise donc pas à elle seule l’ouverture du blind set.

Avant SEM-003D, le comité PD-011 devra choisir explicitement entre :

- un `Qualification Set` contrôlé supplémentaire, séparé de Development, Calibration et Blind ;
- ou une procédure de qualification fondée sur des preuves contrôlées déjà prévues par PD-011, à condition de démontrer qu’aucune donnée ayant servi à ajuster métriques, seuils ou système ne porte aussi la preuve d’ouverture.

La recommandation est de conserver un jeu de qualification distinct. Son contenu, sa taille, son accès et sa règle d’ouverture restent à préspécifier. SEM-003 ne le crée pas et ne fusionne pas silencieusement calibration, qualification et validation aveugle.

## 8. Catalogue architectural des quinze catégories

Les tableaux suivants définissent les obligations de conception sans créer de cas final. `P18*` signifie que l’enrichissement est évalué seulement si l’`contextualCandidateEnvelope` du cas n’est pas vide.

### 8.1 Capacités et propriétés applicables

| # | Catégorie | Capacité testée | Safety/Fidelity | Scientific Understanding | Contextual Enrichment | Difficulté structurante |
|---:|---|---|---|---|---|---|
| 1 | Demande scientifique complète | reconstruire intention, objets, relations et contexte sans perdre ni surinterpréter | P01–P04, P07–P12 | P14, P15, P17 | P18* | densité et relations multiples |
| 2 | Demande sous-spécifiée | reconnaître ce qui manque et limiter la conclusion | P01, P07–P12 | P13, P16, P17 | P18* | insuffisance informative |
| 3 | Ellipse | rattacher une expression courte au bon contexte conversationnel sans invention | P01, P02, P07, P09–P12 | P13, P15–P17 | P18* | dépendance au contexte antérieur |
| 4 | Implicite nécessaire | reconstruire uniquement l’implicite sans lequel l’explicite perd son sens | P01–P03, P07, P09–P12 | P14, P15, P17 | P18* | frontière explicite/inférence nécessaire |
| 5 | Implicite contextuel fort | proposer une interprétation probable sans l’attribuer à l’utilisateur | P06–P12 | P13–P17 | P18 | statut épistémique et applicabilité |
| 6 | Candidat Knowledge | reconnaître un soutien scientifique possible sans adoption Project | P07–P12 | P14–P17 | P18 | limite Knowledge/Project |
| 7 | Ambiguïté scientifique | conserver plusieurs lectures recevables et identifier le discriminant | P01–P03, P07, P09–P12 | P13, P15–P17 | P18* | pluralité légitime |
| 8 | Comparaison et timing | préserver bras, référents, direction et ancrages temporels | P01–P04, P10–P12 | P14, P15, P17 | P18* | attachement des temporalités |
| 9 | Négation et non-causalité | préserver négation, condition et absence de causalité | P01–P03, P06, P10–P12 | P14, P15, P17 | P18* | polarité et logique relationnelle |
| 10 | Correction multi-tour | propager une correction sans effacer l’historique ni conserver un état obsolète comme courant | P01–P05, P09–P12 | P13–P17 | P18* | version et portée de correction |
| 11 | Changement d’avis | distinguer correction factuelle et décision utilisateur révisée | P01–P05, P07–P12 | P13–P17 | P18* | temporalité décisionnelle et adoption |
| 12 | Méthode versus mesure | séparer principe/méthode, propriété observable, image ou résultat, valeur et rôle biomarqueur | P01–P03, P07–P12 | P14, P15, P17 | P18* | plans OBS et rôles contextuels |
| 13 | Phénomène versus observable | séparer explication biologique et propriété mesurable | P01–P03, P07–P12 | P14, P15, P17 | P18* | plans Model/OBS |
| 14 | Intervention et imagerie | préserver intervention, contexte, modalité et évaluation sans créer de causalité ou endpoint | P01–P04, P06–P12 | P13–P17 | P18 | plans Project/Imaging/OBS |
| 15 | Demande multidimensionnelle | intégrer plusieurs domaines, temporalités, objectifs ou plans sans collapse | P01–P12 selon applicabilité | P13–P17 | P18* | composition longue et ownership multiple |

### 8.2 Conception et adjudication par catégorie

| # | Erreurs critiques à rechercher | Variantes admissibles | Informations volontairement absentes | Clarification | Owner d’adjudication | Domaines recommandés | Risque de contamination historique |
|---:|---|---|---|---|---|---|---|
| 1 | perte d’objet/relation critique ; promotion ; invention | décomposition ou regroupement équivalent | détails non décisionnels | seulement si une décision reste indéterminée | expert scientifique + méthodologique | imagerie, clinique, laboratoire, physiologie | moyen : forme générale exposée, contenus futurs distincts |
| 2 | complétion arbitraire ; inconnue masquée | refus borné, demande ciblée, représentation incomplète explicite | objet, référentiel, population ou temporalité selon le cas | attendue si sa réponse change le raisonnement | expert méthodologique + domaine | transversal | élevé : catégorie historiquement très travaillée |
| 3 | mauvais antécédent ; fusion de contextes | référence explicite ou lien contextuel équivalent | élément omis mais récupérable du tour antérieur | seulement si plusieurs antécédents restent plausibles | expert linguistique/méthodologique + domaine | transversal multilingue | élevé : patterns conversationnels exposés |
| 4 | invention présentée comme explicite ; perte de sens | inférence minimale représentée séparément | détails au-delà de l’implicite constitutif | rarement, si l’implicite n’est pas univoque | expert scientifique + SEM | imagerie, analyse, physiologie | moyen à élevé |
| 5 | inférence promue ; surconfiance ; bruit | candidat, hypothèse ou contexte probable correctement étiqueté | décision de projet et preuve définitive | si le contexte change une branche importante | expert scientifique + preuve | domaines riches en contexte | élevé : enrichissements historiques exposés |
| 6 | Knowledge adopté comme vérité Project ; citation inventée | candidats pluriels avec applicabilité et justification | décision humaine d’adoption | si l’usage visé du candidat est inconnu | expert de preuve + domaine + Project | tous domaines | moyen |
| 7 | ambiguïté fermée sans support ; fausse contradiction | plusieurs lectures ouvertes ou formulation neutralisée | discriminant volontairement absent | attendue si discriminant accessible et décisionnel | adjudicateur scientifique indépendant | domaines à terminologies polysémiques | élevé |
| 8 | comparateur/timing inversé ou détaché | graphe simple ou composition équivalente | fenêtres ou référent précis selon difficulté | si l’ancrage conditionne l’interprétation | méthodologiste + domaine | longitudinal, intervention, suivi | élevé : topologies temporelles exposées |
| 9 | négation affirmée ; association causalisée ; condition supprimée | formulations logiquement équivalentes | mécanisme causal non fourni | rarement ; attendue si portée de négation ambiguë | méthodologiste + scientifique | épidémiologie, physiologie, imagerie | élevé |
| 10 | état obsolète actif ; historique effacé ; correction trop large | événement de correction ou versionnement équivalent | motif de correction si non donné | si la portée de la correction est indéterminée | expert SEM/méthodologique + domaine | conversation multi-tour | élevé |
| 11 | ancien choix conservé comme courant ; changement traité comme fait scientifique | décision remplacée avec historique ou branche révisée | justification du changement si non donnée | si le nouveau choix est incomplet | owner Project + méthodologiste | design d’étude, imagerie | moyen à élevé |
| 12 | méthode confondue avec valeur, image, observable ou rôle | plusieurs granularités si les plans restent distincts | valeur, unité, procédure ou rôle non fourni | si l’usage du terme est réellement équivoque | expert OBS + domaine | imagerie, laboratoire, wearable | très élevé : arbitrage historique connu |
| 13 | phénomène transformé en mesure ou inversement | lien explicatif et lien d’observabilité séparés | méthode ou preuve d’observabilité | si l’intention porte sur expliquer versus mesurer | expert modèles + OBS | physiopathologie, imaging, omics | moyen |
| 14 | modalité/procédure/candidat attribué à l’utilisateur ; endpoint inventé | représentation intervention + mesure séparée | paramètres, méthode procédurale ou endpoint | si l’objet de l’évaluation reste indéterminé | expert intervention + Imaging/OBS + méthodologiste | cardiologie, neuro, oncologie | très élevé : exemple exposé et patterns historiques |
| 15 | collapse de plans ; ownership global faux ; omission critique en cascade | sous-graphes ou compositions différentes avec mêmes obligations | dimensions secondaires volontairement non précisées | plusieurs questions seulement si chaque besoin est décisionnel et ordonné | panel multidisciplinaire + adjudicateur | scénarios transversaux | moyen ; contrôler parenté avec tout exemple composite |

Les owners indiqués sont des fonctions de compétence. Leur instanciation humaine et leurs conflits sont gouvernés par PD-011. Une même personne ne peut pas contrôler seule l’auteur, la référence, l’adjudication critique et la décision finale.

## 9. Exemples de conception exposés — non aveugles

Les exemples de cette section sont déjà exposés. Leur statut est définitivement `DEVELOPMENT_VISIBLE`. Ils ne peuvent devenir ni `CALIBRATION_VISIBLE`, ni `BLIND_SEALED`.

### 9.1 Exemple A — sous-spécification

**Demande exposée :** « Je veux étudier la mise en place avant/après. »

**Obligations de conception :** intention comparative temporelle probable ; objet de la mise en place inconnu ; référentiel avant/après inconnu ou ambigu ; aucune complétion arbitraire ; clarification de forte valeur décisionnelle.

Cet exemple illustre l’architecture d’une `Acceptance Envelope`. Il n’est pas une fixture et ne fixe aucune formulation attendue.

### 9.2 Exemple B — stent / IDM / IRM

**Demande exposée :** « Je veux étudier la mise en place de stent immédiat vs différé dans l’IDM, avec évaluation des lésions à l’IRM. »

**Explicite obligatoire :** stent ; immédiat ; différé ; comparaison ; IDM ; IRM ; lésions.

**Contextuel recevable :** cardiologie ; contexte coronaire/interventionnel probable ; angiographie/XA comme candidat procédural, jamais comme fait utilisateur.

**Candidats scientifiques possibles et optionnels :** taille d’infarctus ; MVO ; no-reflow ou atteinte microvasculaire ; œdème ; fonction ventriculaire.

**Interdit :** attribuer XA, MVO ou no-reflow à l’utilisateur ; rendre les candidats obligatoires dans toutes les générations ; confondre no-reflow et MVO ; créer un endpoint principal ; adopter les candidats dans le Project.

Cet exemple ne crée pas une nomenclature fermée des enrichissements et ne peut pas être recyclé sous forme paraphrasée dans le blind set.

## 10. Protocole multi-run — architecture uniquement

### 10.1 Chaîne future

`N independent runs`

→ évaluation des propriétés au niveau du run

→ regroupement par équivalence sémantique

→ porte Safety/Fidelity

→ métriques Scientific Understanding

→ métriques Contextual Enrichment

→ comptabilité de fiabilité

→ décision de campagne sous PD-011.

`N` est un symbole de conception. Sa valeur sera calibrée sur le Calibration Set, justifiée par la précision attendue et gelée avant toute qualification aveugle.

### 10.2 Identité de configuration

Tous les runs d’une campagne utilisent une configuration identique. Le manifeste doit digérer au minimum :

- version et commit du système évalué ;
- provider, modèle et endpoint effectifs ;
- versions des rôles et prompts ;
- schemas et règles de validation ;
- canonicalisation, coverage, integrity, critic, evaluator, routing et ownership applicables ;
- paramètres effectifs, y compris ceux explicitement non applicables ;
- version du benchmark, des jeux, des enveloppes et de l’évaluateur ;
- politiques de retry, timeout, non-évaluable et arrêt ;
- environnement et dépendances capables d’affecter le fond.

Une modification susceptible d’affecter le fond crée une nouvelle identité de configuration et exige la disposition prévue par PD-011. Les runs de configurations différentes ne sont jamais mélangés.

### 10.3 Comptabilité obligatoire

1. Aucun meilleur run n’est sélectionné.
2. Tous les runs préspécifiés sont comptés.
3. Une sortie non évaluable reste visible.
4. Un échec provider reste distinct d’un échec sémantique.
5. Un fail-closed sûr n’est pas un succès de compréhension.
6. Les propriétés absolues sont évaluées à chaque run évaluable.
7. Les propriétés statistiques sont évaluées sur leur distribution préspécifiée.
8. Les variantes équivalentes sont regroupées sans imposer une topologie unique.
9. La stabilité d’une mauvaise réponse n’est jamais récompensée.
10. Les résultats sont rapportés par famille, catégorie, domaine et classe d’échec ; aucun indice composite ne masque une porte.

## 11. Métriques conceptuelles sans seuil

Toutes les métriques ci-dessous sont **candidates**. Leur admission, leur règle exacte d’agrégation, leurs intervalles d’incertitude et leurs seuils appartiennent à PD-011 et aux phases de calibration. `Run évaluable` signifie que le provider et la chaîne d’évaluation ont produit une sortie jugeable ; les autres runs restent comptés dans les métriques de fiabilité et les analyses de sensibilité.

### 11.1 Safety / Fidelity

| Métrique | Numérateur | Dénominateur | Unité | Non évaluables | Failure class | Owner PD-011 proposé | Risque de mauvaise interprétation |
|---|---|---|---|---|---|---|---|
| Critical Explicit Preservation Rate | obligations explicites critiques préservées/reconstructibles | obligations explicites critiques applicables des runs évaluables | obligation dans un run | exclus du calcul sémantique, comptés en fiabilité | `EXPLICIT_FIDELITY_FAILURE` | owner fidélité + expert du cas | une sortie concise peut préserver ; une sortie longue peut omettre |
| Critical Relation Preservation Rate | relations critiques correctes en endpoints, direction, rôle et portée | relations critiques applicables des runs évaluables | relation dans un run | idem | `RELATION_SEMANTICS_FAILURE` | owner relations/SEM + domaine | compter des endpoints sans leur sens surestime la réussite |
| Polarity Preservation Rate | obligations de polarité/condition/causalité correctes | obligations de polarité applicables des runs évaluables | obligation logique dans un run | idem | `POLARITY_OR_CAUSALITY_FAILURE` | méthodologiste + domaine | une formulation différente peut être logiquement équivalente |
| Unsupported Promotion Rate | promotions épistémiques ou d’ownership non soutenues | opportunités de promotion préqualifiées ou unités produites applicables | promotion potentielle dans un run | sorties non jugeables séparées | `EPISTEMIC_PROMOTION_FAILURE` ou `OWNERSHIP_BOUNDARY_FAILURE` | owner épistémique/ownership | un faible taux n’annule jamais une promotion critique |
| Unsupported Invention Rate | inventions non soutenues observées | unités sémantiques produites dans les runs évaluables, avec reporting par criticité | unité produite dans un run | sorties non jugeables séparées | `UNSUPPORTED_INVENTION_FAILURE` | expert scientifique + preuve | le dénominateur par volume peut favoriser les sorties verbeuses |
| Provenance Reconstruction Rate | obligations critiques avec chaîne source-statut-owner reconstructible | obligations critiques exigeant provenance | obligation dans un run | idem | `PROVENANCE_FAILURE` | owner provenance/preuve | présence d’un identifiant ne prouve pas une provenance correcte |
| Safe Fail-Closed Rate | situations où le fail-closed attendu est sûr, explicite et correctement motivé | situations préqualifiées où un fail-closed est admissible ou requis | cas-run | non-évaluable distinct du fail-closed | classes de safety applicables | owner safety + cas | ne mesure ni compréhension positive ni utilité globale |

Les taux décrivent les résultats ; ils ne convertissent pas les invariants absolus en propriétés compensables.

### 11.2 Scientific Understanding

| Métrique | Numérateur | Dénominateur | Unité | Non évaluables | Failure class | Owner PD-011 proposé | Risque de mauvaise interprétation |
|---|---|---|---|---|---|---|---|
| Scientific Context Recall | éléments contextuels nécessaires correctement reconnus | éléments contextuels nécessaires de l’enveloppe | élément contextuel dans un run | séparés et inclus en sensibilité | `CONTEXTUAL_UNDERSTANDING_FAILURE` | expert scientifique du domaine | ne doit pas inclure les candidats simplement utiles |
| Scientific Context Precision | éléments contextuels proposés réellement recevables | éléments contextuels proposés | élément proposé dans un run | sorties non jugeables séparées | `CONTEXTUAL_UNDERSTANDING_FAILURE` | expert scientifique du domaine | une sortie vide peut paraître précise ; lire avec le rappel |
| Missing-Information Detection Recall | inconnues critiques détectées et correctement qualifiées | inconnues critiques requises | inconnue dans un run | séparés | `MISSING_INFORMATION_FAILURE` | méthodologiste + owner cas | multiplier les questions ne démontre pas le rappel utile |
| Ambiguity Preservation Rate | ambiguïtés requises conservées sans résolution indue | ambiguïtés requises applicables | ambiguïté dans un run | séparés | `MISSING_INFORMATION_FAILURE` | expert scientifique + adjudicateur | préserver toute incertitude peut masquer une incapacité à conclure |
| Clarification Appropriateness | clarifications jugées décisionnellement pertinentes et proportionnées | opportunités de clarification préqualifiées et clarifications produites, rapportées séparément | cas-run / besoin d’information | non-évaluable distinct | `CLARIFICATION_FAILURE` | owner PD-009/metric + cas | quantité de questions et correspondance littérale ne sont pas la qualité |
| Conceptual Plan Separation Rate | obligations de séparation entre plans respectées | séparations de plans applicables | séparation dans un run | séparés | `CONCEPTUAL_PLAN_COLLAPSE` | PD-003/OBS + domaine | des objets distincts peuvent encore porter un ownership faux |
| Decisive Sensitivity | paires où le changement décisif entraîne le changement scientifique attendu | paires préspécifiées avec changement décisif | paire de cas/runs appariés selon protocole | paire non jugeable conservée | `GENERATIVE_INSTABILITY_FAILURE` ou classe sémantique source | owner fiabilité + domaine | tout changement n’est pas une bonne sensibilité |
| Non-Decisive Invariance | paires où une variation non décisive conserve le même vecteur critique | paires préspécifiées non décisives | paire de cas/runs | paire non jugeable conservée | `GENERATIVE_INSTABILITY_FAILURE` ou `SEMANTIC_EQUIVALENCE_EVALUATION_FAILURE` | owner fiabilité/équivalence | identité de JSON n’est ni exigée ni récompensée |

### 11.3 Contextual Enrichment

| Métrique | Numérateur | Dénominateur | Unité | Non évaluables | Failure class | Owner PD-011 proposé | Risque de mauvaise interprétation |
|---|---|---|---|---|---|---|---|
| Candidate Relevance Precision | candidats proposés jugés pertinents et applicables | candidats contextuels proposés | candidat dans un run | séparés | `CONTEXTUAL_UNDERSTANDING_FAILURE` | expert domaine + preuve | une absence de candidats peut gonfler artificiellement la précision |
| Candidate Recall against Expert Envelope | candidats de l’enveloppe couverts par au moins une proposition équivalente selon la règle préspécifiée | candidats éligibles de l’enveloppe experte | candidat-envelope dans un run ou une distribution, à calibrer | séparés | `CONTEXTUAL_UNDERSTANDING_FAILURE` | expert domaine + metric owner | l’enveloppe peut être non exhaustive ; aucun candidat individuel n’est universellement requis |
| Candidate Ranking Quality | candidats pertinents placés selon leur utilité et applicabilité préqualifiées | candidats classables effectivement proposés | liste de candidats dans un run | liste non jugeable séparée | `CONTEXTUAL_UNDERSTANDING_FAILURE` | expert domaine + méthodologiste | le rang expert peut admettre des ex aequo et dépendre du contexte |
| Candidate Justification Quality | candidats avec justification, support, limite et statut épistémique recevables | candidats proposés nécessitant justification | candidat dans un run | séparés | `CONTEXTUAL_UNDERSTANDING_FAILURE` ou `PROVENANCE_FAILURE` | preuve + domaine | une justification longue n’est pas meilleure |
| Contextual Noise Rate | candidats hors enveloppe, non pertinents, redondants ou disproportionnés | candidats proposés | candidat dans un run | séparés | `CONTEXTUAL_UNDERSTANDING_FAILURE` | expert domaine | une enveloppe non exhaustive ne permet pas d’étiqueter automatiquement tout autre candidat comme bruit |
| Epistemic Label Accuracy | candidats correctement étiquetés comme inférence, hypothèse ou option sans adoption | candidats contextuels proposés | candidat dans un run | séparés | `EPISTEMIC_PROMOTION_FAILURE` | owner épistémique/ownership | pertinence scientifique et étiquette correcte sont deux axes distincts |

### 11.4 Reliability

| Métrique | Numérateur | Dénominateur | Unité | Non évaluables | Failure class | Owner PD-011 proposé | Risque de mauvaise interprétation |
|---|---|---|---|---|---|---|---|
| Evaluable Run Rate | runs produisant une sortie sémantiquement jugeable | tous les runs préspécifiés | run | constituent le complément, jamais exclus | `PROVIDER_EXECUTION_FAILURE`, `QUALIFICATION_PROTOCOL_FAILURE` ou cause structurée | campaign owner + metric owner | une sortie évaluable peut être scientifiquement fausse |
| Provider Execution Failure Rate | runs échouant pour une cause provider qualifiée | tous les runs préspécifiés | run | inclus comme échecs provider | `PROVIDER_EXECUTION_FAILURE` | opérateur/provider owner | ne doit pas être fusionné avec l’échec sémantique |
| Structured Output Failure Rate | réponses provider non convertibles en sortie structurée jugeable selon le contrat gelé | réponses provider attendues sous forme structurée | réponse/run | restent visibles | provider, protocole ou evaluator selon cause | owner interface d’évaluation | une structure valide ne garantit aucun sens scientifique |
| Cross-Run Semantic Stability | comparaisons de runs classées sémantiquement équivalentes sur le même cas/configuration | comparaisons préspécifiées entre runs évaluables | paire ou distribution de runs, à calibrer | cas incomplets rapportés séparément | `GENERATIVE_INSTABILITY_FAILURE` | owner fiabilité + adjudication | dépendance entre paires et stabilité d’une erreur peuvent tromper |
| Cross-Run Critical Property Stability | cas dont le vecteur critique reste identique entre runs | cas avec répétitions préspécifiées et runs jugeables | cas/distribution | cas non complets visibles en fiabilité | `GENERATIVE_INSTABILITY_FAILURE` + classe critique source | owner fiabilité + safety | l’identité stable d’un vecteur faux n’est pas une réussite |

## 12. Adjudication experte

### 12.1 Fonctions séparées

| Fonction | Responsabilité | Incompatibilités principales |
|---|---|---|
| Auteur du cas | rédiger la situation, la provenance et les informations volontairement absentes | ne contrôle pas seul la référence ni l’écart critique |
| Expert scientifique | définir obligations, erreurs et candidats du domaine | déclare ses conflits et son exposition à la sortie |
| Expert méthodologique/SEM | vérifier propriétés, statuts épistémiques, équivalence, clarification et non-promotion | ne redéfinit pas le contenu scientifique du domaine |
| Adjudicateur | trancher une divergence qui doit l’être, ou maintenir une pluralité légitime | indépendant de l’auteur sur les écarts critiques |
| Propriétaire du blind package | conserver les références, accès, digests et exposition | ne modifie pas SEM et ne communique pas les résultats intermédiaires |
| Opérateur de campagne | exécuter le protocole gelé et conserver les incidents | n’accède pas aux références cachées au-delà du strict besoin opérationnel |
| Comité PD-011 | approuver protocole, métriques, seuils, conflits et décision | ne délègue pas PASS/FAIL au système évalué |

### 12.2 Procédure de construction d’une référence

1. rédaction indépendante du cas et déclaration de provenance ;
2. explicitation indépendante des obligations ;
3. définition des interdictions et de leur criticité ;
4. définition des candidats contextuels et de leurs limites ;
5. définition des ambiguïtés et inconnues irréductibles ;
6. définition de la clarification attendue ou de son absence ;
7. revue de l’`Acceptance Envelope` par les expertises requises ;
8. contrôle de parenté, contamination et exposition ;
9. gel du cas, de sa référence et de ses règles de jugement ;
10. calcul et enregistrement du digest ;
11. adjudication post-run sans modification rétroactive de l’enveloppe.

Si l’état des connaissances ou le désaccord expert ne permet pas de définir les propriétés critiques, le cas ne contribue pas au critère principal. Il devient exploratoire, contradictoire ou non résolu selon PD-011.

### 12.3 Minimum normatif et recommandation opérationnelle candidate

PD-011 impose une référence établie par au moins trois évaluateurs indépendants couvrant les compétences pertinentes. SEM-003 ne réduit pas ce minimum et ne fixe pas de plafond.

**Recommandation opérationnelle non admise :** distinguer au minimum les fonctions d’auteur, de revue scientifique et de revue méthodologique ; faire intervenir un adjudicateur indépendant lorsqu’une divergence affecte le jugement ; séparer le propriétaire du blind package de l’équipe qui modifie SEM ; séparer autant que possible l’opérateur de campagne de l’analyse principale. Dans une petite organisation, une personne peut couvrir plusieurs compétences seulement si les conflits, contre-revues et limites d’indépendance sont explicitement documentés.

Le nombre exact d’experts par type de cas, la mesure d’accord, les règles d’adjudication et la charge acceptable devront être calibrés avant SEM-003C.

## 13. Contrat d’équivalence sémantique à deux niveaux

### 13.1 Niveau 1 — propriétés critiques déterministes

L’évaluateur vérifie d’abord :

- explicites critiques ;
- relations, direction et portée ;
- polarité, conditionnalité et causalité ;
- provenance reconstructible ;
- ownership et interdictions d’adoption ;
- promotions interdites ;
- inconnues et ambiguïtés critiques ;
- corrections et temporalités critiques.

Une violation applicable ne peut pas être rendue équivalente par adjudication de forme.

### 13.2 Niveau 2 — adjudication d’équivalence

Lorsqu’une sortie diffère structurellement tout en satisfaisant le niveau 1, l’adjudication compare :

1. le vecteur complet d’obligations ;
2. les conséquences scientifiques ;
3. le statut épistémique de chaque ajout ;
4. l’impact sur les inconnues et la clarification ;
5. l’impact sur le `ResearchProject` et les décisions humaines ;
6. les limites, la provenance et l’ownership ;
7. le niveau de détail utile versus la complexité superflue.

Le jugement résultant utilise les dispositions SEM-002. `ACCEPTABLE_SEMANTIC_EQUIVALENT` exige une explication traçable. `ACCEPTABLE_NONCRITICAL_VARIATION` indique une variation sans effet scientifique. Une réserve affectant le fond conduit à la classe d’échec appropriée ou à `NOT_EVALUABLE`, pas à une équivalence permissive inventée.

La classification demandée au niveau 2 est projetée ainsi :

| Classe d’adjudication | Disposition SEM-002 | Condition |
|---|---|---|
| Équivalente | `ACCEPTABLE_SEMANTIC_EQUIVALENT` | même vecteur d’obligations et mêmes conséquences scientifiques |
| Acceptable avec réserve | `ACCEPTABLE_NONCRITICAL_VARIATION` | réserve explicitement non critique, sans violation d’une propriété absolue |
| Non équivalente | `SEMANTIC_FAILURE` + failure class causale | divergence de fond, de statut épistémique, de provenance, d’ownership ou de conséquence |
| Non adjudicable | `NOT_EVALUABLE` | référence, sortie ou procédure insuffisante pour un jugement recevable |

« Acceptable avec réserve » est une qualification de run. Elle ne crée pas un PASS PD-011 avec réserves, statut que PD-011 interdit pour une décision de publication.

### 13.3 Qualification de l’évaluateur

L’évaluateur doit lui-même être qualifié avant le blind set. La calibration doit mesurer au minimum : concordance avec des références expertes, sensibilité aux violations critiques, capacité à accepter des topologies réellement équivalentes, stabilité inter-évaluateurs, erreurs de sévérité et taux de cas non adjudicables.

Un évaluateur automatique peut assister le niveau 1 ou préparer un dossier de niveau 2. Il ne devient pas seul propriétaire d’une équivalence complexe ni de la décision PD-011 tant que sa qualification et son périmètre ne sont pas démontrés.

## 14. Taxonomie opérationnelle des échecs

Les « étages » ci-dessous sont des étages du protocole d’évaluation, pas une architecture imposée à SEM : `P0` protocole/configuration ; `E1` exécution/provider ; `J1` propriétés critiques ; `J2` compréhension/équivalence ; `A1` agrégation et décision.

| Failure class | Premier étage | Owner probable | Absolu/statistique | Droit de réparation | Effet campagne | Effet blind set | Distinction du symptôme aval |
|---|---|---|---|---|---|---|---|
| `EXPLICIT_FIDELITY_FAILURE` | J1 | owner du système + expert cas | absolu si obligation critique | jamais pendant blind ; après exposition, nouvelle version et nouvelle campagne | porte safety échouée si applicable | cas reste scellé jusqu’à décision, puis exposé/retiré si utilisé pour réparer | relations ou métriques aval peuvent échouer secondairement |
| `RELATION_SEMANTICS_FAILURE` | J1 | owner relations/reconstruction | absolu si relation critique | même règle | porte safety échouée | même règle | topology/canonicalisation est un mécanisme, pas nécessairement la cause |
| `POLARITY_OR_CAUSALITY_FAILURE` | J1 | owner sémantique + méthodologiste | absolu | même règle | porte safety échouée | même règle | une contradiction aval peut provenir de la polarité amont |
| `CONTEXTUAL_UNDERSTANDING_FAILURE` | J2 | owner compétence + expert domaine | statistique, sauf promotion/invention critique reclassée | développement/calibration seulement ; jamais mid-blind | métrique de compétence/enrichissement affectée | exposition interdite pour réparer avant clôture | bruit lexical ou rappel faible ne sont que des symptômes possibles |
| `EPISTEMIC_PROMOTION_FAILURE` | J1 | owner épistémique/ownership | absolu | jamais pendant blind | porte safety/ownership échouée | même règle | pertinence du contenu ne légitime pas la promotion |
| `UNSUPPORTED_INVENTION_FAILURE` | J1 | owner génération/reconstruction + preuve | absolu si invention critique | jamais pendant blind | porte safety échouée selon criticité | même règle | une sortie plausible reste inventée sans support |
| `MISSING_INFORMATION_FAILURE` | J1 pour inconnue masquée ; J2 pour détection | owner compréhension + PD-009 pour action | absolu ou statistique selon propriété | hors blind seulement | porte safety ou métrique affectée | cas non révélé pendant campagne | clarification inadéquate peut être aval de l’inconnue manquée |
| `CLARIFICATION_FAILURE` | J2 | owner PD-009/interaction + metric owner | statistique ; grave si décision dangereuse | hors blind seulement | compétence affectée, porte critique si impact grave préspécifié | aucune réparation mid-blind | formulation maladroite n’est pas la cause si la valeur décisionnelle est correcte |
| `CONCEPTUAL_PLAN_COLLAPSE` | J2, ou J1 si ownership violé | owner PD-003/OBS + système | statistique avec signalement grave ; absolu si promotion associée | hors blind seulement | compétence ou safety selon effet | aucune réparation mid-blind | type JSON erroné peut être symptôme d’une confusion conceptuelle |
| `PROVENANCE_FAILURE` | J1 | owner provenance/preuve | absolu pour obligations critiques | jamais pendant blind | porte traçabilité échouée | même règle | contenu exact sans origine reconstructible reste un échec |
| `OWNERSHIP_BOUNDARY_FAILURE` | J1 | owner du handoff concerné | absolu | jamais pendant blind | porte responsabilité échouée | même règle | l’objet aval peut sembler valide tout en étant adopté par le mauvais owner |
| `SEMANTIC_EQUIVALENCE_EVALUATION_FAILURE` | J2 | owner évaluateur + adjudication | statistique ou protocolaire si systémique | évaluateur corrigé seulement hors campagne ; résultats affectés réévalués dans nouvelle campagne | peut rendre résultat NON CONCLUANT si l’évaluateur n’est pas recevable | package reste scellé ; ne pas révéler pour adapter la notation | divergence d’évaluation distincte d’une erreur du système évalué |
| `GENERATIVE_INSTABILITY_FAILURE` | A1 après jugements run-level | owner système + fiabilité | statistique | hors blind seulement | porte fiabilité selon protocole | aucun meilleur run ni réparation mid-blind | variabilité provider et variabilité sémantique doivent être séparées |
| `PROVIDER_EXECUTION_FAILURE` | E1 | provider/operator | fiabilité | retries uniquement selon protocole gelé ; aucun changement ad hoc | compté séparément ; systémique peut rendre NON CONCLUANT | n’expose pas la référence | aucune conclusion sémantique ne peut être déduite |
| `QUALIFICATION_PROTOCOL_FAILURE` | P0 ou A1 | campaign owner/comité PD-011 | absolu protocolaire | amendement seulement selon PD-011 ; jamais présenté comme préspécifié | campagne suspendue, invalidée ou NON CONCLUANT | contamination peut imposer retrait/remplacement indépendant | performance du système n’est pas la cause première |

Une réparation n’est jamais autorisée « sur un cas aveugle ». Après clôture et exposition, un défaut peut être traité sur une version de développement ; le cas devient non-régression et toute nouvelle preuve indépendante exige un autre package aveugle.

## 15. Règles anti-overfitting

1. aucun changement SEM pendant une campagne aveugle ;
2. aucun accès aux références aveugles pendant l’exécution ;
3. aucune sélection du meilleur run ;
4. aucune suppression silencieuse d’un cas ;
5. aucun changement de seuil après observation ;
6. aucun nouveau mapping lexical dérivé du blind set ;
7. toute exposition retire définitivement le cas du blind set ;
8. toute réparation invalide l’identité de configuration et nécessite une nouvelle campagne indépendante ;
9. toute campagne interrompue reste enregistrée avec ses résultats et incidents ;
10. Development, Calibration et Blind ne partagent aucun cas paraphrasé, traduit ou dérivé ;
11. les catégories peuvent être communes, jamais les contenus ou chaînes discriminantes ;
12. les exemples SEM-002 et ceux du présent document ne deviennent jamais aveugles ;
13. H01–H30 ne redeviennent jamais le Holdout principal ;
14. la décision PASS, FAIL ou NON CONCLUANT relève exclusivement de PD-011 ;
15. l’évaluateur est qualifié, versionné, digéré et gelé avant la campagne.

Règles complémentaires : les résultats défavorables restent visibles ; une analyse exploratoire ne devient pas confirmatoire ; une correction de référence post-sortie ne sert pas à favoriser la sortie observée ; une campagne ne mélange jamais des configurations ; une stabilité apparente sur des cas exposés n’est pas une preuve indépendante.

## 16. Gouvernance de campagne future

### 16.1 Artefacts à prévoir sans les créer ici

Les phases futures devront définir et produire sous gouvernance :

- protocole d’auteur de cas ;
- registre des cas et versions ;
- registre d’exposition et de parenté ;
- `Acceptance Envelopes` versionnées ;
- manifeste des jeux ;
- manifeste de configuration SEM ;
- manifeste de campagne et digests ;
- package aveugle scellé ;
- journal des runs et incidents ;
- dossier d’adjudication ;
- calculs reproductibles des métriques ;
- rapport multidimensionnel ;
- décision indépendante PD-011 ;
- registre de retrait et de non-régression.

### 16.2 Règles d’arrêt

La future campagne aveugle doit être arrêtée ou suspendue selon le protocole préenregistré lorsqu’une configuration change, que l’aveugle est compromis, que le package ou son digest diverge, que l’évaluateur n’est plus recevable, qu’un incident systémique empêche l’exécution ou qu’une autorité humaine doit arbitrer la validité du protocole.

Elle ne s’arrête pas pour réparer un échec sémantique. Les sorties déjà produites restent immuables et tous les incidents restent rapportés.

### 16.3 Baseline du SEM actuel

La photographie baseline ultérieure doit évaluer la configuration SEM alors gelée sans la modifier. Elle ne transforme pas le legacy en conformité PD-003 V2, n’utilise pas H01–H30 comme blind set, ne choisit pas le meilleur run et ne revendique que le périmètre réellement mesuré.

Le résultat baseline peut révéler des forces, lacunes ou limites. Il ne donne aucun droit automatique à réparer, publier ou étendre le domaine. Toute évolution post-baseline appartient à une mission distincte, avec nouvelle identité de configuration et nouveau plan de preuve indépendant.

## 17. Phases futures — non exécutées

### SEM-003B — Benchmark Case Authoring Protocol

- préparer et former les auteurs ;
- créer uniquement les jeux Development et Calibration ;
- tester la qualité et la reproductibilité des `Acceptance Envelopes` ;
- qualifier les procédures d’adjudication ;
- ne pas créer le blind set final tant que la gouvernance de scellement n’est pas décidée.

### SEM-003C — Blind Package Construction and Sealing

- produire indépendamment les cas aveugles ;
- établir les références expertes ;
- contrôler parenté, contamination et exposition ;
- geler, digérer et sceller le package ;
- enregistrer stockage, accès, dépositaire, injection et conditions de levée de l’aveugle.

### SEM-003D — Baseline Qualification of Unmodified SEM

- geler la configuration SEM ;
- appliquer le protocole préenregistré ;
- utiliser le nombre de runs calibré et préspécifié ;
- interdire toute réparation pendant la campagne ;
- produire une photographie baseline et un rapport, puis STOP.

### SEM-003E — Decision

Après analyse humaine, distinguer :

- compétence suffisante dans un périmètre borné ;
- lacunes ciblées ;
- insuffisance ou évolution nécessaire du contrat d’évaluation ;
- éventuelle mission de développement ultérieure.

Aucune de ces phases n’est exécutée par SEM-003 ni par son admission documentaire.

## 18. Questions ouvertes et limitations

Les décisions suivantes restent explicitement ouvertes :

1. plateforme de stockage du blind package et modèle de menace ;
2. dépositaire indépendant, gestion des accès et séparation réelle des fonctions ;
3. chiffrement, gestion des clés, sauvegarde, rétention et reprise après incident ;
4. méthode de signature ou d’approbation des digests ;
5. format exact des fiches de cas et des `Acceptance Envelopes` ;
6. parenté maximale acceptable entre catégories semblables de jeux différents ;
7. nombre de runs et plan d’échantillonnage ;
8. définitions calculatoires définitives, intervalles et seuils continus ;
9. règles de gestion des sorties partiellement structurées ;
10. qualification et périmètre d’un évaluateur automatique éventuel ;
11. composition des panels selon domaine et difficulté ;
12. mesure de l’accord et procédure d’adjudication ;
13. traitement statistique de la dépendance entre runs, obligations et catégories ;
14. niveau d’indépendance organisationnelle réalisable ;
15. confidentialité, données réelles, droits d’usage et exigences réglementaires des futurs cas ;
16. domaine scientifique et revendication exacte de la première baseline.

Ces limitations **n’empêchent pas l’admission de l’architecture SEM-003** : elles portent sur des choix que PD-011, la calibration, la qualification de l’évaluateur et la gouvernance du blind set doivent normalement résoudre. Elles empêchent en revanche toute calibration formelle, construction du blind set, campagne de qualification ou revendication de performance tant que les décisions applicables ne sont pas prises.

## 19. Conditions minimales avant les phases ultérieures

L’admission documentaire de SEM-003 constate déjà la cohérence avec SEM-002, PD-003 V2, OBS-001, PD-009 et PD-011, ainsi que la séparation des responsabilités et des jeux. Avant l’ouverture des phases correspondantes, une mission distincte devra démontrer :

- définitions versionnées des unités et de l’enveloppe ;
- protocole de parenté et de contamination ;
- séparation documentée des responsabilités ;
- pour la calibration formelle : métriques, évaluateur, plan statistique, nombre de runs et traitement des non-évaluables préspécifiés sous PD-011 ;
- pour SEM-003C : décision explicite sur le stockage, le dépositaire, le contrôle d’accès, le scellement et l’injection ;
- pour SEM-003D : protocole préenregistré, configuration gelée, références scellées et règles d’arrêt ;
- pour tout blind set : absence de cas dérivé de SEM-002, H01–H30, Development, Calibration ou des exemples exposés.

## 20. Décision normative

`SEM003_ADMITTED_WITH_LIMITATIONS`

SEM-003 définit une architecture cohérente pour juger la compréhension scientifique par obligations, interdictions, équivalences, enrichissements et fiabilité multi-run, tout en préservant un véritable jeu aveugle et l’autorité de PD-011.

Cette décision :

- ne qualifie pas SEM ;
- ne crée aucun cas, Gold, seuil, nombre de runs ou corpus aveugle ;
- n’autorise aucune exécution ni réparation ;
- ne modifie ni l’index, ni le code, ni les contrats fonctionnels existants.
