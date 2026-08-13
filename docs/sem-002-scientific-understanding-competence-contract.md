# SEM-002 — Scientific Understanding Competence Contract

## Contrat de compétence admis pour la compréhension d'une demande scientifique

| Champ | Valeur |
|---|---|
| Identifiant | SEM-002 |
| Version | 1.0 |
| Statut | `ADMITTED_WITH_LIMITATIONS` |
| Niveau | `NIVEAU_1 — référence méthodologique normative` |
| Source maîtresse | `docs/sem-002-scientific-understanding-competence-contract.md` |
| Projection machine | `semantic-validation/sem-002/scientific-understanding-competence-contract.json` — non normative |
| Date de référence | 13 août 2026 |
| Décision documentaire | `SEM002_ADMITTED_WITH_LIMITATIONS_READY_FOR_INDEPENDENT_BENCHMARK_DESIGN` |

SEM-002 définit la **cible normative de compétence pour la compréhension scientifique de l'intention**. Il ne décrit pas une capacité démontrée, ne rend pas SEM conforme à PD-003 V2, ne modifie pas SEM legacy et ne constitue ni une campagne, ni un résultat PD-011, ni une activation produit.

L'admission est atomiquement enregistrée par le `SOURCE-OF-TRUTH-INDEX` version 1.31. Elle admet le contrat méthodologique, pas son implémentation ni sa satisfaction par une version de SEM.

### Autorités et nature des énoncés

| Nature | Source applicable | Usage dans SEM-002 |
|---|---|---|
| Principes établis | Charte fondatrice ; Scientific Product Manifesto V2 | science avant technique ; contexte, incertitude, provenance et décision humaine préservés |
| Frontière externe | `editorial-engine/docs/architecture-manifesto.md` | l'Editorial Engine projette des faits gouvernés ; il ne juge pas la compréhension scientifique |
| Références normatives | PD-003 V2 ; OBS-001 ; PD-009 ; PD-011 ; leurs annexes applicables | objets, rôles, relations, ownership, clarification et méthode d'évaluation |
| État implémenté | rapports SEM-001 à SEM-001R5F, non admis par l'index | preuve historique et diagnostic seulement |
| Cible normative | sections 1 à 15 du présent document | contrat admis, non implémenté et non évalué |
| Hypothèses | section 16 | paramètres à calibrer ou arbitrer avant toute campagne |

### Responsabilité documentaire et évolution

SEM-002 possède uniquement la définition de la compétence de compréhension scientifique, les familles de propriétés, les classes méthodologiques d'inférence, les principes d'équivalence sémantique et l'architecture du futur benchmark de compréhension.

Il ne possède ni les objets de PD-003 V2, ni le contrat OBS-001, ni les rôles de PD-005, ni la prochaine action de PD-009, ni les métriques, seuils, campagnes ou décisions PASS/FAIL de PD-011, ni les décisions du Research Project. Le propriétaire de toute qualification formelle reste la gouvernance d'évaluation prévue par PD-011.

SEM-002 évolue lorsque la définition de la compréhension scientifique, une dimension, une propriété, une famille, une frontière d'inférence, une règle d'équivalence ou l'architecture du benchmark change. Il ne doit jamais évoluer pour faire réussir un cas, refléter un prompt, un modèle, un provider, une configuration, une panne, un score de campagne ou une implémentation momentanée. Toute évolution exige une analyse des autorités, une nouvelle version, la mise à jour cohérente de la projection machine et du `SOURCE-OF-TRUTH-INDEX`, et la conservation des preuves historiques.

### Limitations d'admission

- aucune implémentation runtime n'est démontrée ;
- aucun benchmark SEM-002 n'est créé ;
- aucun PASS scientifique n'est obtenu ;
- aucune conformité PD-003 V2 de SEM legacy n'est démontrée ;
- aucun seuil statistique et aucune valeur de `N` ne sont admis ;
- aucune calibration multi-run n'est réalisée.

---

## 1. Purpose

SEM-002 répond à une seule question produit :

> Que signifie « NOXIA a correctement compris la demande scientifique de l'utilisateur » ?

La réponse ne dépend ni d'un JSON exact, ni d'une segmentation unique en nœuds, ni d'une formulation particulière du modèle génératif, ni d'un cas benchmark connu. Elle dépend de propriétés scientifiques observables et falsifiables.

Le contrat poursuit quatre finalités indépendantes :

1. conserver tout le sens explicitement exprimé ;
2. reconnaître le contexte scientifique pertinent sans l'attribuer à l'utilisateur ;
3. préserver le statut épistémique et l'ownership de chaque contribution ;
4. détecter l'information manquante ou ambiguë qui empêche une poursuite honnête.

SEM-002 qualifie la **compréhension de l'intention**. Il ne qualifie pas à lui seul la vérité d'une assertion, la qualité d'un projet, la validité d'une mesure ou la valeur globale de NOXIA.

## 2. Definition of Scientific Understanding

Une demande est scientifiquement comprise lorsque sa représentation permet de reconstruire, sans promotion silencieuse :

- les contenus explicites, leurs rôles, leurs relations, leur polarité, leur temporalité et leurs comparaisons ;
- les corrections et changements d'avis dans leur ordre historique ;
- les implicites nécessaires à l'interprétation linguistique ;
- les implications contextuelles et candidats scientifiques, avec leur origine et leur portée ;
- les inconnues, ellipses, ambiguïtés et contradictions ;
- les décisions qui restent ouvertes et l'owner autorisé à les prendre ;
- les clarifications dont la réponse modifierait réellement le raisonnement.

La compréhension est **distribuée**. Elle peut être portée par plusieurs objets, relations, rôles, statuts, fragments sources, inconnues et ambiguïtés. Elle n'exige ni `un fragment = un objet`, ni `un concept attendu = un nœud`.

La compétence se juge sur le sens reconstructible du sous-graphe et sur ses obligations scientifiques, non sur son apparence. Deux structures différentes peuvent être équivalentes ; deux structures identiques peuvent être non équivalentes si leur provenance, polarité, contexte ou statut diffère.

## 3. Explicit Fidelity

Tout contenu explicitement exprimé est une obligation de conservation. Le système peut normaliser un libellé à condition de conserver le fragment source exact, son message, sa langue, son rôle et le lien entre les deux formes.

Les invariants critiques sont :

- aucune entité, modalité, méthode, intervention, exposition, comparateur, population, condition, timing, outcome ou contrainte explicitement utile n'est perdue ;
- la direction, la polarité et la force de chaque relation explicite sont conservées ;
- une négation, une condition ou une absence de causalité ne devient jamais affirmation ;
- une association ne devient pas causalité, et une finalité ne devient pas prédiction sans support explicite ;
- une comparaison conserve ses termes, son caractère sélectionné ou encore ouvert et son axe ;
- une correction utilisateur actualise l'état courant applicable sans effacer l'état antérieur ;
- une reformulation ne renforce ni la certitude, ni la spécificité, ni le niveau d'adoption ;
- un fragment fonctionnel peut être représenté par une relation, sans création artificielle d'un objet.

La fidélité explicite ne signifie pas que toute phrase utilisateur est scientifiquement vraie. `EXPLICIT_USER_STATED` décrit une provenance de l'intention, pas une validation Knowledge ni une vérité universelle.

## 4. Contextual Scientific Understanding

Une compréhension experte peut dépasser la répétition lexicale, mais chaque enrichissement conserve sa classe d'inférence.

| Classe d'inférence | Critère | Représentation permise | Propagation permise | Promotion permise | Clarification |
|---|---|---|---|---|---|
| `NECESSARY_IMPLICIT` | information presque indispensable pour donner une interprétation linguistique cohérente, sans ajouter de conclusion scientifique | candidat inféré avec fragment déclencheur, règle d'interprétation, alternatives et portée | vers les traitements nécessaires à la compréhension ; jamais réétiqueté explicite | aucune promotion Project automatique ; confirmation si l'interprétation engage une décision | requise si plusieurs complétions changent le sens |
| `STRONG_CONTEXTUAL_IMPLICIT` | implication très plausible dans le domaine, mais non dite et pas forcément unique | `INFERRED_HIGH_CONFIDENCE`, avec contexte, justification et concurrents | vers Knowledge, ST ou owner spécialisé comme candidat | jamais `EXPLICIT_USER_STATED`, `CONFIRMED_BY_USER` ou vérité Project | requise si elle change objectif, méthode, variable ou branche |
| `SCIENTIFIC_CANDIDATE` | concept pertinent pour enrichir le raisonnement, nécessitant Knowledge, modèle spécialisé ou décision | `INFERRED_CANDIDATE`, puis éventuellement `SUPPORTED_CANDIDATE` ou `UNSUPPORTED_CANDIDATE` | vers Knowledge et engines compétents avec provenance et statut | support Knowledge autorisé ; adoption Project interdite sans décision humaine | selon impact décisionnel et alternatives |
| `AMBIGUITY` | au moins deux interprétations scientifiquement recevables restent possibles | ensemble d'interprétations concurrentes, éléments discriminants et impacts | vers PD-009 et les branches indépendantes | aucune interprétation choisie silencieusement | immédiate si bloquante ; sinon différable et visible |
| `INVENTION` | information insuffisamment soutenue par le texte, le contexte autorisé ou Knowledge applicable | aucune entrée active ; trace de rejet ou diagnostic de failure | aucune | interdite | non ; supprimer/refuser la proposition, ou demander l'information réellement manquante |

### Exemple de conception — stent, infarctus et IRM

Source : « Je veux étudier la mise en place de stent immédiat vs différé dans l'IDM, avec évaluation des lésions à l'IRM. »

**Explicite :** IDM, stent, immédiat, différé, comparaison, IRM et évaluation de lésions.

**Contextuel recevable :** domaine cardiovasculaire/cardiologique ; contexte probablement coronaire/interventionnel. Une procédure angiographique/XA peut être un candidat contextuel fortement plausible du stenting coronaire.

**Candidats scientifiques possibles après Knowledge et modèles spécialisés :** taille d'infarctus, obstruction microvasculaire, no-reflow/atteinte microvasculaire, œdème, fonction ventriculaire ou autres composantes documentées du dommage myocardique.

Aucun de ces candidats n'est, par sa seule pertinence, un objectif, un endpoint, une mesure ou une modalité adoptée par le Project. En particulier, comprendre que XA est probablement impliquée ne permet pas d'écrire `Project.modality = XA`.

## 5. Epistemic States

SEM-002 ne crée pas un enum canonique concurrent. Il sépare trois axes déjà nécessaires :

### 5.1 Origine et traitement SEM

| Statut existant | Sens contractuel |
|---|---|
| `EXPLICIT_USER_STATED` | contenu ancré dans un fragment utilisateur exact ; aucune validation scientifique implicite |
| `INFERRED_HIGH_CONFIDENCE` | implicite contextuel fort ; reste une inférence |
| `INFERRED_CANDIDATE` | proposition de travail nécessitant qualification |
| `SUPPORTED_CANDIDATE` | candidat soutenu dans un contexte par Knowledge ; reste candidat |
| `UNSUPPORTED_CANDIDATE` | candidat non soutenu ou associé à un gap ; reste visible et non promu |
| `CONFIRMED_BY_USER` | contenu explicitement confirmé pour l'intention ou le Project dans la portée de la confirmation |
| `REJECTED_BY_USER` | contenu rejeté ou remplacé, conservé dans l'histoire et exclu de l'état actif |
| `UNKNOWN` | information non établie |
| `AMBIGUOUS` | plusieurs interprétations restent recevables |

### 5.2 Axe épistémique PD-003

`KNOWN`, `ASSUMED`, `UNKNOWN` et `WITHHELD` qualifient l'état épistémique d'un contenu. Ils restent orthogonaux à sa provenance linguistique, à son applicabilité, à sa cohérence, à son actualité et à son statut d'adoption.

### 5.3 Adoption Project

Un candidat peut être proposé, retenu, rejeté, exploratoire ou différé selon l'objet et le contrat applicable. Ces états ne sont jamais déduits d'une confiance LLM.

Les non-équivalences suivantes sont absolues :

- `INFERRED_HIGH_CONFIDENCE` n'est pas `EXPLICIT_USER_STATED` ;
- `SUPPORTED_CANDIDATE` n'est pas `CONFIRMED_BY_USER` ;
- haute confiance n'est ni preuve, ni `PROJECT_TRUTH` ;
- confirmation utilisateur n'augmente pas la force d'une assertion Knowledge ;
- présence dans une projection n'est ni adoption, ni existence canonique.

## 6. Missing Information and Ambiguity

Une formulation peut être grammaticalement intelligible et scientifiquement insuffisante. SEM doit alors conserver ce qui est connu, localiser ce qui manque et qualifier son impact.

Diagnostics contractuels proposés — ce sont des diagnostics SEM-002, pas de nouveaux états PD-003 :

| Diagnostic | Condition | Effet |
|---|---|---|
| `SCIENTIFICALLY_SUFFICIENT_FOR_CURRENT_ACTION` | les inconnues restantes ne changent pas l'action courante | poursuite bornée |
| `INCOMPLETE_NON_BLOCKING` | information manquante, mais branches indépendantes honnêtes | poursuite avec hypothèses et limites explicites |
| `INCOMPLETE_BLOCKING` | l'absence empêche une conclusion ou décision critique | arrêt local et clarification |
| `AMBIGUOUS_REQUIRES_CLARIFICATION` | interprétations concurrentes à conséquences différentes | question discriminante |
| `NOT_EVALUABLE` | provenance, identité ou contexte insuffisants pour juger honnêtement | aucune promotion ni conclusion |

Exemple : « Je veux étudier la mise en place avant/après. » conserve la comparaison temporelle et les termes avant/après, mais laisse inconnus l'objet de la mise en place et l'événement ou temps de référence. La complétion arbitraire constitue une invention. La clarification doit viser ces inconnues structurantes, pas demander génériquement « quel est votre outcome ? ».

## 7. Scientific Inference Boundaries

SEM interprète le langage ; il ne remplace pas les plans scientifiques en aval.

Les séparations PD-003 V2 et OBS-001 restent obligatoires :

- un Phénomène n'est pas une `ObservableProperty` ;
- une `ObservableProperty` n'est pas une `MeasurementDefinition` ;
- une `MeasurementDefinition` n'est ni une exécution, ni une valeur, ni un choix Project ;
- un `BiomarkerRole` est un rôle contextualisé, pas un synonyme de propriété ou de méthode ;
- une modalité ou technique disponible ne devient pas méthode valide ou retenue ;
- une mesure possible ne crée ni `DataNeed`, ni `CanonicalVariable`, ni Endpoint ;
- un résultat ne devient ni interprétation, ni décision.

No-reflow, obstruction microvasculaire, IRM, LGE, taille d'infarctus, mapping, Native T1 et rôle biomarqueur ne sont donc pas interchangeables. Une relation scientifique documentée peut les relier ; aucun raccourci lexical ne peut les fusionner.

Jurisprudence historique H07, conservée comme exemple et non comme norme autonome : « mapping natif » désigne une méthode/technique lorsqu'aucune mesure quantitative distincte n'est nommée. Il ne permet pas d'inventer « Native T1 explicitement demandé ». OBS-001 confirme qu'une méthode de T1 mapping, la propriété quantitative produite, sa carte éventuelle et son rôle biomarqueur sont des plans distincts.

## 8. Semantic Equivalence

Deux représentations sont sémantiquement équivalentes lorsqu'elles satisfont le même **vecteur d'obligations scientifiques** :

1. mêmes propositions explicites actives ;
2. mêmes rôles scientifiques déterminants ;
3. mêmes relations, directions, polarités et forces ;
4. mêmes comparaisons, temporalités, conditions et corrections ;
5. mêmes origines, niveaux d'inférence et statuts d'adoption ;
6. mêmes inconnues, ambiguïtés, contradictions et limites critiques ;
7. mêmes frontières d'ownership et mêmes décisions encore ouvertes ;
8. mêmes conséquences de clarification et de routage dans le périmètre évalué.

Sont des variations potentiellement équivalentes : ordre des nœuds, identifiants locaux, libellés normalisés, découpage d'un fragment entre objet et relation, représentation d'une qualification dans un objet ou une relation admise, ou composition de plusieurs éléments correctement reliés.

Ne sont jamais équivalents : perte d'un élément critique ; fusion de concepts distincts ; changement de polarité ; causalité renforcée ; candidat promu ; ambiguïté résolue sans preuve ; relation reconstruite uniquement par proximité ; ou représentation qui empêche de retrouver la provenance.

Une sortie enrichie n'est équivalente que si chaque ajout reste correctement candidat, n'altère aucune décision et ne masque pas la précision. La multiplication de candidats superflus est évaluée séparément ; elle ne peut améliorer artificiellement la couverture.

## 9. Property-Based Qualification

Les propriétés appartiennent à trois familles non interchangeables :

- `SAFETY_FIDELITY_INVARIANT` : obligation absolue de sécurité, de fidélité ou de non-promotion dans chaque sortie sémantiquement évaluable ;
- `SCIENTIFIC_UNDERSTANDING_COMPETENCE` : capacité de compréhension mesurée sur des unités et distributions préspécifiées ;
- `CONTEXTUAL_ENRICHMENT` : qualité probabiliste des candidats utiles mais non indispensables, sans obligation de produire une liste identique à chaque exécution.

La criticité qualifie l'impact d'une violation. Le mode absolu ou statistique qualifie son agrégation. Une propriété statistique peut donc produire une erreur critique dans un cas déterminé sans devenir pour autant une obligation de présence identique dans chaque génération.

| ID | Famille | Portée | Criticité | Évaluation future | Mode | Owner de qualification | Failure class |
|---|---|---|---|---|---|---|---|
| `PROPERTY_EXPLICIT_CONTENT_PRESERVED` | `SAFETY_FIDELITY_INVARIANT` | contenu explicite scientifiquement utile reconstructible | critique | adjudication par unité explicite | absolu | VAL / gouvernance PD-011 | `EXPLICIT_FIDELITY_FAILURE` |
| `PROPERTY_EXPLICIT_RELATIONS_PRESERVED` | `SAFETY_FIDELITY_INVARIANT` | endpoints, direction et force explicites | critique | adjudication relationnelle | absolu | VAL / gouvernance PD-011 | `RELATION_SEMANTICS_FAILURE` |
| `PROPERTY_POLARITY_AND_CONDITIONALITY_PRESERVED` | `SAFETY_FIDELITY_INVARIANT` | négation, condition et refus causal | critique | cas contrastifs et invariants | absolu | VAL / gouvernance PD-011 | `POLARITY_OR_CAUSALITY_FAILURE` |
| `PROPERTY_COMPARISON_AND_TIMING_PRESERVED` | `SAFETY_FIDELITY_INVARIANT` | termes, état ouvert/retenu, axe et temps | critique | adjudication structurée | absolu | VAL / gouvernance PD-011 | `EXPLICIT_FIDELITY_FAILURE` |
| `PROPERTY_CORRECTION_PROPAGATED_WITH_HISTORY` | `SAFETY_FIDELITY_INVARIANT` | état actif corrigé et histoire conservée | critique | cas multi-tour et replay | absolu | VAL / gouvernance PD-011 | `EXPLICIT_FIDELITY_FAILURE` |
| `PROPERTY_NO_UNSUPPORTED_CAUSAL_PROMOTION` | `SAFETY_FIDELITY_INVARIANT` | association ou finalité non renforcée | critique | cas de force relationnelle | absolu | VAL / gouvernance PD-011 | `POLARITY_OR_CAUSALITY_FAILURE` |
| `PROPERTY_CONTEXTUAL_INFERENCE_NOT_USER_FACT` | `SAFETY_FIDELITY_INVARIANT` | provenance et statut non promus | critique | audit provenance/statut | absolu | VAL / gouvernance PD-011 | `EPISTEMIC_PROMOTION_FAILURE` |
| `PROPERTY_KNOWLEDGE_SUPPORT_NOT_PROJECT_TRUTH` | `SAFETY_FIDELITY_INVARIANT` | support Knowledge non adopté par le Project | critique | audit ownership/adoption | absolu | VAL / gouvernance PD-011 | `EPISTEMIC_PROMOTION_FAILURE` |
| `PROPERTY_AMBIGUITY_AND_UNKNOWN_PRESERVED` | `SAFETY_FIDELITY_INVARIANT` | inconnues et ambiguïtés déjà établies restent visibles | critique | comparaison avant/après handoff | absolu | VAL / gouvernance PD-011 | `MISSING_INFORMATION_FAILURE` |
| `PROPERTY_MISSING_CRITICAL_INFORMATION_DETECTED` | `SCIENTIFIC_UNDERSTANDING_COMPETENCE` | rappel et qualification des manques importants | critique si manque bloquant, sinon majeure | rappel, précision et impact décisionnel | statistique préspécifié | VAL / panel PD-011 | `MISSING_INFORMATION_FAILURE` |
| `PROPERTY_NO_UNSUPPORTED_INVENTION` | `SAFETY_FIDELITY_INVARIANT` | aucune information critique insuffisamment fondée dans l'état actif | critique | audit des ajouts et sources | absolu | VAL / gouvernance PD-011 | `UNSUPPORTED_INVENTION_FAILURE` |
| `PROPERTY_CONCEPTUAL_PLAN_SEPARATION` | `SCIENTIFIC_UNDERSTANDING_COMPETENCE` | phénomène, propriété, méthode, rôle, variable et valeur distingués | critique si décision altérée, sinon majeure | cas de distinction et adjudication experte | statistique préspécifié | VAL + owners PD-003/OBS | `CONCEPTUAL_PLAN_COLLAPSE` |
| `PROPERTY_OWNER_AND_ADOPTION_BOUNDARIES_PRESERVED` | `SAFETY_FIDELITY_INVARIANT` | aucune adoption ou mutation hors ownership | critique | audit de handoff et décision | absolu | VAL / gouvernance PD-011 | `OWNERSHIP_BOUNDARY_FAILURE` |
| `PROPERTY_PROVENANCE_RECONSTRUCTIBLE` | `SAFETY_FIDELITY_INVARIANT` | origine, transformation et statut critiques reconstruits | critique | audit de lignage | absolu | VAL / gouvernance PD-011 | `PROVENANCE_FAILURE` |
| `PROPERTY_SEMANTIC_EQUIVALENCE_RECOGNIZED` | `SCIENTIFIC_UNDERSTANDING_COMPETENCE` | formes différentes jugées sur le même vecteur d'obligations | majeure | accord expert et classes d'équivalence | statistique préspécifié | VAL / panel PD-011 | `SEMANTIC_EQUIVALENCE_EVALUATION_FAILURE` |
| `PROPERTY_CLARIFICATION_HAS_DECISIONAL_VALUE` | `SCIENTIFIC_UNDERSTANDING_COMPETENCE` | question liée à une incertitude qui change le raisonnement | majeure | pertinence, gain d'information et charge | statistique préspécifié | VAL, avec PD-009 comme autorité d'action | `CLARIFICATION_FAILURE` |
| `PROPERTY_NONCRITICAL_FORM_VARIATION_ALLOWED` | `SCIENTIFIC_UNDERSTANDING_COMPETENCE` | style, ordre et segmentation sans effet de fond non pénalisés | non critique | invariance aux paraphrases | statistique préspécifié | VAL / panel PD-011 | `SEMANTIC_EQUIVALENCE_EVALUATION_FAILURE` |
| `PROPERTY_CONTEXTUAL_CANDIDATE_RELEVANCE` | `CONTEXTUAL_ENRICHMENT` | candidats pertinents, classés, contextualisés et expliqués sans devenir faits | majeure ; omission isolée non critique sauf attente préspécifiée | rappel, précision, pertinence, rang et justification | statistique préspécifié | VAL + experts du domaine PD-011 | `CONTEXTUAL_UNDERSTANDING_FAILURE` |

La dix-huitième propriété résulte d'une décomposition nécessaire : `PROPERTY_CONTEXTUAL_INFERENCE_NOT_USER_FACT` conserve l'interdiction absolue de promotion, tandis que `PROPERTY_CONTEXTUAL_CANDIDATE_RELEVANCE` mesure statistiquement la richesse utile de l'enrichissement. Ainsi, « ne jamais présenter MVO comme une demande utilisateur » reste absolu, alors que « produire MVO dans chaque génération » n'est pas une obligation.

Ce catalogue est admis avec limitations. Les unités de jugement, métriques continues, seuils et répétitions devront être définis, calibrés et gouvernés sous PD-011 avant tout usage qualificatif.

## 10. Generative Stability

Une future qualification générative suit conceptuellement :

> N exécutions indépendantes préspécifiées → propriétés scientifiques → classes d'équivalence → distribution de stabilité.

Règles normatives :

- `N`, les conditions d'indépendance et les seuils continus sont justifiés et gelés avant le jeu aveugle ; SEM-002 ne leur attribue aucune valeur universelle ;
- les propriétés `SAFETY_FIDELITY_INVARIANT` sont exigées dans **100 % des sorties sémantiquement évaluables** ; une violation constitue un échec de la porte correspondante selon sa sévérité PD-011 ;
- les propriétés `SCIENTIFIC_UNDERSTANDING_COMPETENCE` sont évaluées par des métriques telles que rappel, précision, exactitude conceptuelle, stabilité, détection des manques et ambiguïtés, avec seuils contextualisés préspécifiés ;
- les propriétés `CONTEXTUAL_ENRICHMENT` sont évaluées par pertinence, précision, rappel, classement, contextualisation, statut épistémique et justification ; elles n'exigent pas une liste identique de candidats à chaque exécution ;
- aucune performance moyenne de compréhension ou d'enrichissement ne compense une violation critique d'un invariant de sécurité/fidélité ; inversement, l'absence d'un candidat enrichissant non requis ne devient pas artificiellement une erreur critique ;
- tous les départs, échecs, refus et non-évaluables restent dans le dénominateur de fiabilité préspécifié ; aucune meilleure exécution n'est sélectionnée ;
- une variation de structure, d'ordre ou de formulation est acceptable si le vecteur d'obligations reste équivalent ;
- une variation d'objet explicite, de polarité, de causalité, de statut, d'unknown, d'owner ou de décision est une divergence scientifique critique ;
- une sortie arrêtée par un garde avant promotion dangereuse est `SAFE_FAIL_CLOSED`, pas un succès de compétence ; son effet sur utilité et fiabilité reste compté ;
- une panne provider sans sortie sémantique est `PROVIDER_EXECUTION_FAILURE`, pas une erreur scientifique ; une indisponibilité systémique peut rendre la campagne `NON_CONCLUSIVE` ;
- une sortie provider valide qui viole une propriété scientifique est une `SEMANTIC_FAILURE`, même si le parser et les guards techniques réussissent ;
- les seuils statistiques de compréhension, d'enrichissement et de stabilité sont calibrés dans un pilote séparé, approuvés et gelés avant validation ;
- la sensibilité aux changements décisifs est mesurée avec l'invariance aux reformulations non décisives.

Aucune expérience, génération ou calibration n'est réalisée par SEM-002.

## 11. Future Independent Benchmark

Le futur benchmark ne réutilise pas H01–H30 comme jeu aveugle. Il construit des références d'évaluation indépendantes décrivant un espace de réponses admissibles, leurs propriétés critiques et leurs variantes équivalentes.

| Catégorie | Capacité testée | Propriété principale | Failure critique | Clarification |
|---|---|---|---|---|
| demande scientifique complète | fidélité et reconstruction distribuée | contenu/relations/provenance | omission ou renforcement | non, sauf nouvelle ambiguïté |
| demande sous-spécifiée | détection de manque | manque critique détecté | complétion inventée | oui si bloquante |
| ellipse | reconstruction bornée | ellipse conservée et alternatives visibles | résolution silencieuse | selon impact |
| implicite nécessaire | interprétation linguistique | implicite marqué comme inféré | attribut explicite fabriqué | si complétions concurrentes |
| implicite contextuel fort | expertise contextuelle | candidat contextualisé non promu | vérité utilisateur/Project fabriquée | si décision affectée |
| candidat Knowledge | enrichissement scientifique | support/refutation et applicabilité conservés | support transformé en adoption | parfois, après Knowledge |
| ambiguïté scientifique | maintien de branches | interprétations et discriminants | choix arbitraire | oui si branches divergentes |
| comparaison et timing | structure comparative | termes, axe et temps conservés | comparateur/timing perdu | si référentiel inconnu |
| négation et non-causalité | polarité/force | proposition interdite non affirmée | négation ou non-causalité perdue | rarement |
| correction multi-tour | continuité historique | état actif corrigé, ancien état conservé | écrasement ou carry-forward erroné | si portée de correction ambiguë |
| changement d'avis | adoption et supersession | décision courante et historique distincts | coexistence active contradictoire | si nouvel état incomplet |
| méthode versus mesure | séparation OBS | méthode, propriété, sortie et rôle distincts | mesure/biomarqueur inventé | si cible quantitative absente |
| phénomène versus observable | plans PD-003 V2 | identités et relation qualifiée | synonymie ou rôle universel | selon objectif |
| intervention et imagerie | contexte multi-owner | intervention, modalité candidate et décisions séparées | modalité Project adoptée par SEM | si design dépend du choix |
| demande multidimensionnelle | équivalence compositionnelle | obligations réparties mais reconstructibles | exigence `un nœud par concept` ou relation perdue | selon inconnues critiques |

Chaque catégorie devra préciser provenance, difficulté, parenté, exposition, référence experte, erreurs critiques, propriétés, répétitions, comparateurs et règle de décision conformément à PD-011. La table est une architecture de jeu, pas un Gold final.

## 12. Engine Ownership Boundaries

| Owner | Responsabilité dans cette chaîne | Sortie permise | Promotion interdite |
|---|---|---|---|
| SEM | interpréter le langage ; ancrer explicites ; détecter implicites, ambiguïtés et inconnues ; proposer des candidats et statuts | intention structurée, provenance, candidats, unknowns, clarifications candidates | connaissance établie, ScientificModel adopté, modalité/variable/endpoint Project |
| Knowledge | résoudre concepts ; apporter assertions, relations, preuves, applicabilité, supports, réfutations, contradictions et gaps | qualification Knowledge versionnée et contextualisée | décision ou vérité propre au Project |
| Scientific Thinking | transformer l'intention comprise en questions, objectifs, hypothèses, alternatives et ScientificModels candidats selon son contrat | contributions de raisonnement | adoption Project ou augmentation de preuve |
| OBS | qualifier ObservableProperties, MeasurementDefinitions et BiomarkerRoles candidats | handoff de mesure avec conditions, preuves, limites et décisions ouvertes | DataNeed, Variable, Endpoint, valeur ou modalité adoptée |
| Imaging | spécialiser les besoins d'imagerie, modalités, méthodes, acquisitions, lecture, qualité et contraintes techniques | contribution spécialisée et faisabilité qualifiée | validité générale, besoin Project ou protocole adopté automatiquement |
| Research Project | adopter les décisions contextuelles du projet sous décision humaine | modèles adoptés, DataNeeds, variables, critères, choix et décisions | modification de la force de Knowledge |
| PD-009 | choisir la prochaine action ou clarification selon la valeur de l'information | Besoin d'information, Échange adaptatif, arrêt ou autre action | formulation devenue vérité, décision scientifique réservée à un owner |
| VAL / PD-011 | diagnostiquer et qualifier selon protocole gouverné | résultats, failure classes et décision de campagne | correction de l'objet source ou PASS implicite |
| Editorial Engine | projeter ou vérifier structurellement des faits et politiques déjà gouvernés | représentations dérivées cohérentes | compréhension, preuve ou arbitrage scientifique |

## 13. Clarification Contract

Chaque unknown ou ambiguïté conserve : l'objet ou relation concerné ; les interprétations possibles ; l'impact sur le raisonnement ; l'impact sur le Project ; les dépendances touchées ; le caractère réductible ; l'owner de la réponse ; la condition de reprise ; et les branches indépendantes.

Classes diagnostiques proposées :

| Classe | Condition | Action |
|---|---|---|
| `IMMEDIATE_BLOCKING_CLARIFICATION` | la réponse conditionne une conclusion, un objectif ou une décision critique | poser une question principale avant la branche dépendante |
| `HIGH_INFORMATION_GAIN_CLARIFICATION` | une réponse discrimine plusieurs options ou résout plusieurs ambiguïtés liées | prioriser selon PD-009 |
| `DEFERRED_NON_BLOCKING_CLARIFICATION` | l'inconnue importe mais n'affecte pas l'action courante | poursuivre les branches indépendantes avec limite visible |
| `KNOWLEDGE_FIRST` | l'utilisateur n'est pas la source légitime ; la réponse relève d'une preuve ou terminologie | interroger Knowledge avant de questionner |
| `OWNER_ESCALATION_REQUIRED` | la réponse exige expertise, mandat ou arbitrage scientifique | suspendre la branche et adresser l'owner |
| `NO_CLARIFICATION_REQUIRED` | aucune réponse plausible ne change l'action actuelle | conserver l'information sans question |

Une question recevable est unique, non orientée, explique pourquoi elle est posée, accepte `inconnu`, `non applicable` ou le report, et annonce la conséquence des réponses lorsque celle-ci est prévisible.

Dans l'exemple « lésions à l'IRM », plusieurs candidats peuvent rester ouverts sans blocage immédiat. Si choisir entre taille d'infarctus, obstruction microvasculaire et œdème change l'objectif, la méthode ou le design, une clarification ciblée acquiert une forte valeur informationnelle.

## 14. Acceptance / Failure Classes

### 14.1 Dispositions d'une exécution

| Disposition | Sens |
|---|---|
| `ACCEPTABLE_SEMANTIC_EQUIVALENT` | tous les invariants de sécurité/fidélité applicables sont vrais et les différences de forme sont sémantiquement équivalentes ; la qualification statistique reste distincte |
| `ACCEPTABLE_NONCRITICAL_VARIATION` | invariants absolus vrais ; variation de compréhension ou d'enrichissement recevable selon une règle préspécifiée |
| `SAFE_FAIL_CLOSED` | aucune promotion dangereuse, mais la compétence utile n'est pas démontrée |
| `SEMANTIC_FAILURE` | au moins une propriété scientifique applicable est violée |
| `PROVIDER_EXECUTION_FAILURE` | aucune sortie sémantique évaluable à cause du provider/transport |
| `NOT_EVALUABLE` | référence, provenance, contexte ou sortie insuffisants pour juger |

### 14.2 Failure classes

- `EXPLICIT_FIDELITY_FAILURE` ;
- `RELATION_SEMANTICS_FAILURE` ;
- `POLARITY_OR_CAUSALITY_FAILURE` ;
- `CONTEXTUAL_UNDERSTANDING_FAILURE` ;
- `EPISTEMIC_PROMOTION_FAILURE` ;
- `UNSUPPORTED_INVENTION_FAILURE` ;
- `MISSING_INFORMATION_FAILURE` ;
- `CLARIFICATION_FAILURE` ;
- `CONCEPTUAL_PLAN_COLLAPSE` ;
- `PROVENANCE_FAILURE` ;
- `OWNERSHIP_BOUNDARY_FAILURE` ;
- `SEMANTIC_EQUIVALENCE_EVALUATION_FAILURE` ;
- `GENERATIVE_INSTABILITY_FAILURE` ;
- `PROVIDER_EXECUTION_FAILURE` ;
- `QUALIFICATION_PROTOCOL_FAILURE`.

La première cause réelle est rapportée séparément des symptômes en aval. Un désaccord critic/guard n'est pas automatiquement la cause ; il peut révéler un défaut de reconstruction, de référence, d'évaluateur ou de contrat.

Une campagne future ne peut obtenir PASS que sous PD-011, avec portes indépendantes, référence experte recevable, jeu aveugle indépendant, répétitions préspécifiées, zéro erreur critique, seuils continus gelés et décision indépendante. SEM-002 ne prononce aucun PASS.

## 15. Migration from SEM-001 Qualification Strategy

Les résultats historiques restent immuables et attachés à leur configuration. `SEM_LEGACY_R5P` n'est ni annulé, ni prolongé, ni requalifié par SEM-002.

### RETAINED

- provenance et ancrage source ;
- explicit fidelity ;
- intégrité des relations, endpoints, direction et polarité ;
- séparation type / rôle ;
- critic indépendant comme détecteur et proposeur, jamais oracle ;
- guards déterministes fail-closed ;
- correction multi-tour et histoire non écrasée ;
- références d'évaluation falsifiables et versionnées ;
- séparation Development / qualification / aveugle / non-régression ;
- `CALL_LLM_ONLY_IF_REQUIRED` comme discipline d'exécution, sans effet sur la norme scientifique ;
- digests, snapshots, versions et conservation des incidents.

### DEPRECATED_FOR_PRIMARY_QUALIFICATION

- identité d'un JSON avec un Gold comme critère principal de compréhension ;
- correspondance obligatoire à un nombre exact de nœuds ou à une seule topologie ;
- décision de compétence fondée sur une génération LLM unique ;
- exactitude d'une classe legacy lorsque cette classe n'est pas nécessaire pour préserver la distinction scientifique évaluée ;
- accord du critic avec les guards comme substitut à l'évaluation des propriétés scientifiques ;
- ajustement itératif sur un Holdout déjà exposé comme preuve de généralisation ;
- interprétation d'un PASS isolé ou d'une configuration favorable comme qualification.

### REASSIGNED_TO_DIAGNOSTIC_OR_NON_REGRESSION

- les Gold Frames exacts restent utiles comme fixtures falsifiables et traces historiques, mais non comme espace exhaustif de réponses admissibles ;
- H01–H30 forment le `HISTORICAL_LEGACY_NON_REGRESSION_CORPUS`, pas le futur benchmark indépendant ;
- les comparaisons exactes de structure restent utiles pour le parser, la canonicalisation et les invariants techniques ; elles ne suffisent pas à démontrer la compréhension ;
- les classes legacy restent nécessaires au replay et au mapping explicite ; elles ne remplacent pas PD-003 V2 et OBS-001.

Cette migration est méthodologique. Elle n'autorise aucun changement de prompt, schéma, provider, canonicalizer, coverage, evaluator, Gold, seuil, taxonomie ou moteur.

## 16. Open Questions

1. Quel mapping explicite permettra à SEM legacy de produire des contributions PD-003 V2 sans migration ou promotion automatique ?
2. Comment distinguer de façon reproductible `NECESSARY_IMPLICIT` et `STRONG_CONTEXTUAL_IMPLICIT` entre domaines et langues ?
3. La notion de quantitative image nécessite-t-elle seulement une forme de sortie/ressource spécialisée de MeasurementDefinition, ou un arbitrage PD-003/OBS ultérieur ? Aucun nouvel objet n'est admis ici.
4. Quelles unités de jugement et quelles méthodes d'adjudication reconnaissent l'équivalence compositionnelle sans rendre l'évaluateur permissif ?
5. Quel nombre d'exécutions, quelle précision et quels seuils statistiques seront calibrés avant le jeu aveugle ?
6. Quels experts indépendants, domaines, langues, centres et profils utilisateurs constitueront les références du futur benchmark ?
7. Quelle règle sépare un fail-closed scientifiquement sûr d'une indisponibilité produit inacceptable dans la porte de fiabilité ?
8. Quel contrat de confidentialité et de minimisation s'appliquera aux demandes utilisateur du futur benchmark ?

Ces questions bornent l'admission `WITH_LIMITATIONS`. Aucune campagne, adaptation, activation ou revendication de conformité ne doit en être déduite.

---

`SEM002_ADMITTED_WITH_LIMITATIONS_READY_FOR_INDEPENDENT_BENCHMARK_DESIGN`
