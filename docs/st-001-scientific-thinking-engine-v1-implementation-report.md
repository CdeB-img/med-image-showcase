# ST-001 — NOXIA Scientific Thinking Engine V1

Date d’arrêt : 9 août 2026

Nature : rapport d’implémentation et de validation, non normatif

Niveau documentaire : `NIVEAU_3`

Périmètre : `FORMALIZE_IDEA`, raccord Knowledge et handoff borné vers `DESIGN_STUDY`

Autorité scientifique revendiquée : aucune

PASS PD-011 revendiqué : aucun

Commit, push, déploiement : aucun

## 1. Décision

La première version réelle du Scientific Thinking Engine est implémentée dans le démonstrateur Protocol Designer. Elle transforme une idée, intuition, observation ou question partiellement structurée en objets candidats distincts, trace leur construction, préserve les alternatives et bloque le passage vers Research Design tant que les portes humaines requises ne sont pas satisfaites.

La décision finale est assortie de limites non bloquantes : l’interprétation linguistique distante était indisponible pendant le test navigateur et le parcours de repli local a donc été utilisé ; les règles sémantiques V1 restent bornées ; la narration de l’interface reste française ; le Research Design Engine complet demeure hors périmètre.

Cette décision ne vaut ni validation scientifique, ni validation clinique, ni protocole, ni publication, ni PASS PD-011.

## 2. Autorités

La mission a été qualifiée comme une implémentation produit de niveau 3 des responsabilités déjà définies dans RDE-001 et RDE-002. Elle ne crée ni architecture normative, ni ontologie, ni corpus.

Ordre de lecture respecté : SOURCE-OF-TRUTH-INDEX intégral ; Charte fondatrice ; Scientific Product Manifesto ; Product Specification ; PD-003 ; PD-004 ; Manuel UX officiel ; PD-005 ; PD-007 ; PD-009 ; PD-011 ; PD-012 ; PD-013 ; RDE-001 ; RDE-002 ; RDE-003 ; KE-001 ; rapports ENG-001, ENG-002 et ENG-003 disponibles.

Séparation appliquée :

- principes établis : Charte fondatrice et Scientific Product Manifesto ;
- références normatives : Product Specification, PD-003/004/005/007/009/011/012/013, RDE-001/002/003 et KE-001 ;
- corpus scientifiques : providers internes existants, consultés uniquement par le Knowledge Engine ;
- cible : instruction ST-001 ;
- état réellement implémenté : modules runtime, session V5, interface `FORMALIZE_IDEA`, tests et handoff décrits ci-dessous ;
- hypothèses : capacité future d’une interprétation linguistique distante et extension multilingue ; elles ne sont pas présentées comme capacités démontrées.

Aucune contradiction n’a été résolue silencieusement. Le snapshot de l’index qui indique qu’aucun moteur RDE général n’est démontré est antérieur aux rapports d’implémentation ENG et à ST-001 ; l’index reste une autorité de routage et n’est pas réécrit par cette mission. Le dépôt Editorial Engine externe était sale avant ST-001 et est demeuré en lecture seule.

Contrôle d’intégrité final : les empreintes du SOURCE-OF-TRUTH-INDEX, de PD-003/004/005/007/009/011/012/013, de RDE-001/002/003 et de KE-001 sont identiques à la baseline. L’index reste à `19dd00e4cb0c1c96438f86d259fa93e4477abe80bf08a26b86075a376f65d337`.

## 3. Baseline Git

- dépôt : `/Users/charles/Documents/Projets/NOXIA/noxia-dev` ;
- branche initiale : `main` ;
- HEAD initial : `20062a8d15e2eba819b4608e3d3162b34bbaf42b` ;
- `origin/main` : même révision au contrôle initial ;
- état initial : propre, aucun fichier modifié ou non suivi ;
- tâche concurrente sur les surfaces ST-001 : aucune détectée ;
- baseline : typecheck réussi, Knowledge 87/87, Protocol Designer 148/148 ;
- dépôt externe `/Users/charles/Documents/Projets/editorial-engine` : HEAD `335fbbea8d138901f0cdf4f5e2d3b96144880e8b`, déjà sale avant la mission, laissé inchangé ;
- aucun commit, push ou déploiement.

## 4. Architecture observée

La baseline comportait un intake linguistique validé par l’utilisateur, un Intent Orchestrator local, un matching de trois scénarios, le Knowledge Engine V1.2 et trois espaces de parcours. `FORMALIZE_IDEA` se limitait toutefois à une phrase générique et aux hypothèses statiques du scénario confirmé. Le bouton vers `DESIGN_STUDY` ne vérifiait aucune adoption structurée.

ST-001 remplace uniquement cette projection par la chaîne suivante :

`ValidatedScientificIntent + ScientificSessionContext + KnowledgeResult → ScientificThinkingInput → opérations déterministes → ScientificThinkingResult → décisions humaines → ResearchDesignHandoff`

`UNDERSTAND` n’est pas réécrit. Le Knowledge Engine conserve ses providers et son comportement. `DESIGN_STUDY` reste une surface de démonstration existante ; ST-001 ne lui ajoute qu’un handoff contrôlé.

## 5. Composants créés

- contrat et schémas runtime V1 ;
- constructeur d’entrée depuis le contexte validé et `KnowledgeResult` ;
- moteur déterministe de classification, clarification, Question, Hypothèses, Objectifs et mécanismes ;
- projection runtime `ScientificReasoningGraph` ;
- sélection et traçage des vingt opérations ST-001 ;
- gestion des réponses adaptatives et décisions humaines ;
- qualification des modifications mineures/majeures ;
- session Scientific Thinking persistable et historique d’invalidation ;
- handoff borné vers Research Design ;
- surface conversationnelle à divulgation progressive ;
- six fichiers de tests spécialisés et fixtures de test.

## 6. Input contract

`ScientificThinkingInput` V1 contient : expression originale, reformulation validée, langue, référence de Scientific Intent, niveau utilisateur, parcours source, session et version de contexte, projet éventuel, décisions antérieures, termes scientifiques, concepts résolus ou non résolus, relations, population, pathologie, phénomènes, résultats, méthodes mentionnées, finalité, contexte, informations explicites/interprétées, inconnues, contradictions, gardes de sécurité et résumé traçable du `KnowledgeResult`.

Le schéma est strict : un champ inconnu est refusé. L’entrée est une projection runtime ; elle ne constitue pas un second modèle métier et ne modifie aucun objet PD-003.

## 7. Output contract

`ScientificThinkingResult` V1 contient : idée originale, problème compris, objet central, éléments sémantiques, Questions candidates et Question sélectionnée, Hypothèses, Objectifs, mécanismes, assumptions, inconnues, ambiguïtés, contradictions, biais, problèmes de raisonnement, préférences méthodologiques, alternatives, opérations, questions adaptatives, gates humaines, changements, refus éventuel, demande Knowledge éventuelle, prochaine action, provenance, graphe, handoff et trace.

La sortie narrative n’est jamais l’unique sortie. La constante `ALL_GENERATED_SCIENTIFIC_CONTENT_REQUIRES_HUMAN_REVIEW` marque toutes les propositions structurantes comme candidates.

## 8. Question construction

Le moteur distingue une Question déjà exploitable d’une idée thématique, d’une prétention prédictive et d’une relation intuitive. Il conserve une bonne Question avec normalisation minimale, sépare une branche méthodologique MOLLI/SASHA d’une Question ECV pronostique et détecte les portées trop larges ou trop étroites.

Une modalité ou une méthode mentionnée reste une préférence ou une branche candidate. Elle n’est jamais introduite automatiquement dans la Question principale. Une idée sur la fibrose déclenche d’abord une clarification de finalité ; aucune IRM n’est choisie.

## 9. Hypotheses

Les Hypothèses ne sont produites qu’après l’obtention d’une Question examinable. Chaque Hypothèse référence la Question, une condition observable, ses inconnues, ses limites, son statut Knowledge et son état de revue.

Une Hypothèse principale n’efface pas l’alternative nulle ou concurrente. Le moteur rend visibles les Hypothèses non réfutables, les Hypothèses sans mécanisme et les besoins de connaissance. Une couverture Knowledge générale ne transforme pas une relation générée en vérité : l’appui est plafonné à partiel faute d’assertion exacte reliant les objets.

## 10. Objectives

Les Objectifs sont proposés uniquement pour une Question testable. L’objectif principal référence la Question et l’Hypothèse structurante. Une branche méthodologique peut produire un objectif secondaire séparé, sans choix de méthode.

La hiérarchie n’est activée qu’après action humaine. Le moteur ne multiplie pas artificiellement les objectifs et ne génère aucun objectif lorsqu’une idée reste floue ou non examinable.

## 11. Mechanisms

Un mécanisme est un objet candidat distinct. Pour une relation intuitive, le moteur indique que le mécanisme reliant les objets reste à documenter. Il ne génère aucun mécanisme biologique précis à partir de sa mémoire et ne qualifie pas un mécanisme comme soutenu sans preuve exacte.

L’absence de mécanisme est un problème de raisonnement explicite (`HYPOTHESIS_WITHOUT_MECHANISM`), pas un contenu complété silencieusement.

## 12. Scientific Reasoning Graph

La projection `RUNTIME_PROJECTION_1.0` porte explicitement `NO_NEW_ONTOLOGY`. Elle représente situation, observation/intuition, assumptions, Questions, Hypothèses, Objectifs, mécanismes, inconnues et préférences méthodologiques.

Les relations runtime incluent reformulation, dépendance, alternative, mise à l’épreuve, adressage d’un objectif, explication et information requise. Les nœuds reflètent les états utilisateur, candidat, confirmé, rejeté ou ouvert. La projection permet de détecter Question sans Objectif, Hypothèse sans Objectif ou mécanisme, branche non arbitrée et dépendance inconnue.

## 13. Operations

Les vingt opérations imposées sont versionnées et présentes dans chaque résultat avec l’un des états `EXECUTED`, `AVAILABLE`, `NOT_APPLICABLE` ou `BLOCKED` : `CLARIFY_IDEA`, `REFORMULATE_QUESTION`, `SPLIT_QUESTION`, `MERGE_QUESTIONS`, `REDUCE_SCOPE`, `EXPAND_SCOPE`, `IDENTIFY_ASSUMPTION`, `CHALLENGE_ASSUMPTION`, `GENERATE_ALTERNATIVE_HYPOTHESIS`, `REFINE_HYPOTHESIS`, `REJECT_NON_TESTABLE_HYPOTHESIS`, `IDENTIFY_MECHANISM`, `IDENTIFY_MISSING_INFORMATION`, `IDENTIFY_CONTRADICTION`, `IDENTIFY_CONCEPTUAL_BIAS`, `PROPOSE_OBJECTIVES`, `PRIORITIZE_OBJECTIVES_FOR_REVIEW`, `REQUEST_KNOWLEDGE`, `REQUEST_HUMAN_DECISION`, `PREPARE_RESEARCH_DESIGN_HANDOFF`.

Une opération disponible ne modifie rien tant qu’elle n’est pas demandée ou autorisée. Chaque opération expose une raison et apparaît dans la trace.

## 14. Adaptive questions

Les questions sont dérivées du raisonnement courant, pas d’un questionnaire fixe. Elles ne portent que sur la finalité, la relation, la portée ou la testabilité lorsque la réponse peut modifier une Question, une Hypothèse, un Objectif ou la prochaine action.

Chaque carte affiche « Question X sur environ N », pourquoi la question est posée, ce qu’elle influence, des réponses rapides, un texte libre et « Je ne sais pas ». Une Question Fabry/ECV déjà structurée ne reçoit aucune question supplémentaire.

Aucun nombre de centres, taille d’échantillon, budget, équipement précis ou paramètre d’acquisition n’est demandé par Scientific Thinking.

## 15. Knowledge integration

Le consumer `SCIENTIFIC_THINKING_ENGINE` est ajouté au contrat Knowledge existant, sans modifier provider, corpus, synthèse ou architecture KE-001. L’entrée ST conserve l’identifiant, le digest, la couverture, les sources, gaps, concepts non résolus et limites du `KnowledgeResult`.

Une couverture insuffisante laisse la Question et l’Hypothèse candidates visibles avec un statut non soutenu, une demande Knowledge et un gap. Aucun scénario proche ni contenu mémorisé ne remplace le résultat absent. Les sources et mécanismes ne sont jamais inventés.

## 16. Human decisions

Six gates sont explicites : confirmation de Question, adoption/rejet des Hypothèses, hiérarchie des Objectifs, modification majeure, abandon de branche et transition vers `DESIGN_STUDY`.

Chaque action crée un identifiant de décision, une date, une cible, un motif et un état. Les cartes rendent visibles « retenu », « rejeté » et « à revoir ». Une Hypothèse rejetée peut être réactivée par une nouvelle décision, sans effacer l’historique.

## 17. Change propagation

Le comparateur de changement qualifie une correction terminologique ou précision comme mineure, et une modification d’objet ou de portée comme majeure. Un changement majeur liste les Questions, Hypothèses, Objectifs et mécanismes affectés, exige une confirmation et interdit une reconstruction silencieuse.

Lors de l’invalidation, la projection précédente, son digest et ses identifiants de décision sont archivés dans `scientificThinkingHistory`. La session active est reconstruite ; l’historique n’est pas écrasé.

## 18. Research Design handoff

Le handoff V1 contient Question confirmée, Hypothèses adoptées, Objectifs adoptés, mécanismes candidats, informations connues, inconnues acceptées et non résolues, contradictions, références de décisions, alternatives, limites, provenance et `KnowledgeResult` utilisé.

Son passage suit trois états : `NOT_READY`, `READY_FOR_HUMAN_AUTHORIZATION`, `AUTHORIZED`. Il reste bloqué sans Question confirmée, revue des Hypothèses, Objectif principal adopté, clarification fondamentale ou contradiction non résolue. L’autorisation humaine finale est obligatoire.

La frontière `NO_PROTOCOL_NO_METHOD_SELECTION_NO_STATISTICAL_PLAN` exclut acquisition, plan statistique, budget, CRF et protocole. Le navigateur a démontré le passage autorisé jusqu’à l’étape 1 de la surface Research Design existante.

## 19. Refus

Les états implémentés distinguent patient-level, hors domaine, entrée insuffisante et finalité non testable. L’arrêt expose la raison et la condition de reprise. Une Hypothèse non réfutable ne produit ni Hypothèse candidate ni Objectif.

Le Domain Gate patient reste local. Le test réel « Mon T2 est élevé, est-ce grave ? » affiche uniquement une compréhension méthodologique générale, aucune question de projet, aucune transition de formalisation et aucun avis patient.

Les contradictions non résolues bloquent le handoff. La connaissance insuffisante n’est pas masquée ; elle peut rester une inconnue explicite si la Question demeure scientifiquement structurée.

## 20. UX

La surface `FORMALIZE_IDEA` suit une discussion guidée : compréhension candidate, Question travaillée, prochaine clarification, Hypothèses concurrentes, Objectifs, inconnues et prochaine action. La progression est présentée en trois blocs scientifiques, pas comme un formulaire de protocole.

Divulgation progressive :

- niveau 0 : Question candidate, prochaine clarification et action humaine ;
- niveau 1 : Hypothèses et Objectifs ;
- niveau 2 : assumptions, mécanismes, biais et inconnues ;
- niveau 3 : graphe, opérations, trace, gates et historique.

Les contrôles sont natifs. Une gestion clavier explicite couvre boutons critiques et disclosures. L’exploration Knowledge reste transversale lorsqu’un scénario interne existe.

## 21. Tests

| Validation | Résultat |
|---|---:|
| Scientific Thinking | 6 fichiers, 30/30 |
| Knowledge Engine | 8 fichiers, 87/87 |
| Protocol Designer | 7 fichiers, 148/148 |
| Typecheck | réussi |
| Lint | 0 erreur ; 7 avertissements préexistants `react-refresh` |
| Build production | réussi ; avertissement non bloquant de chunk > 500 kB et données Browserslist anciennes |
| Privacy | réussie dans les suites Knowledge et Protocol Designer |
| Routes/noindex/sitemap | réussie dans P-WEB-02 et P-WEB-03 |
| SEO | non relancé séparément : aucune route, canonical, sitemap, robots ou page indexée modifiée ; contrats SEO globaux réussis |
| `git diff --check` | réussi avant rapport ; à rejouer après rapport |

Suite globale pertinente : 761/764 tests réussis. Les trois échecs sont les gardes historiques qui exigent un dépôt Editorial Engine externe propre. Ils reproduisent exactement la saleté constatée à la baseline et ne concernent ni ST-001, ni Knowledge, ni Protocol Designer.

Les tests ST couvrent séparément contrats d’entrée/sortie, Questions, ambiguïtés, assumptions, Hypothèses, Objectifs, graphe, opérations, questions adaptatives, Knowledge, gates, changements, handoff, refus, trace, déterminisme, huit cas obligatoires et dix cas méthodologiques supplémentaires.

## 22. Navigateur

Validation réelle effectuée dans le navigateur intégré sur `http://127.0.0.1:5174/protocol-designer/demo`. Le provider linguistique était indisponible ; le repli local déclaré a été utilisé. Aucun message d’erreur console n’a été observé.

| # | Scénario | Résultat |
|---:|---|---|
| 1 | Idée floue — fibrose | finalité et relation demandées ; objet conservé ; aucune IRM choisie |
| 2 | Question Fabry/ECV structurée | Question conservée avec normalisation apostrophe ; aucune clarification inutile ; Hypothèses/Objectif immédiats |
| 3 | Hypothèse implicite no-reflow | intuition distincte ; no-reflow, atteinte microvasculaire et stenting conservés |
| 4 | Plusieurs Hypothèses | principale et concurrente affichées, aucune suppression automatique |
| 5 | Split ECV/MOLLI/SASHA | Question pronostique et branche méthodologique séparées |
| 6 | Changement majeur | avertissement visible et liste des objets à reconstruire |
| 7 | Retour arrière | `FORMALIZE_IDEA → UNDERSTAND → FORMALIZE_IDEA`, contexte et objet conservés, version incrémentée |
| 8 | Knowledge requis | état `REQUIRED`, candidat visible et non soutenu |
| 9 | Knowledge absent | gap visible, aucun corpus voisin substitué |
| 10 | Passage `DESIGN_STUDY` | Question, Hypothèses et Objectif revus ; autorisation humaine ; étape 1/8 rendue |
| 11 | Patient-level | compréhension générale seule ; aucun raisonnement de projet ni avis patient |
| 12 | Reset | session supprimée par le contrôle dédié, retour au texte vide et compteur 0/4 000 |

Le clavier réel a focalisé et activé par Entrée la confirmation de Question après ajout du gestionnaire explicite ; un disclosure a été ouvert par Entrée. Les contrôles critiques sont également couverts par tests d’interface.

## 23. Responsive

Les largeurs 320, 390, 768, 1024, 1440 et 1920 px ont été imposées dans le navigateur sur la surface Scientific Thinking complète.

| Largeur | Débordement document | Sections hors viewport | Question visible | Disclosures |
|---:|---:|---:|---:|---:|
| 320 | non | 0 | oui | 4 |
| 390 | non | 0 | oui | 4 |
| 768 | non | 0 | oui | 4 |
| 1024 | non | 0 | oui | 4 |
| 1440 | non | 0 | oui | 4 |
| 1920 | non | 0 | oui | 4 |

Les cartes de Questions, Hypothèses, alternatives, explications, inconnues, gates et disclosures restent dans le viewport. L’override de viewport a été réinitialisé après le test.

## 24. Limites

1. L’interprétation linguistique distante n’a pas été démontrée pendant cette passe navigateur ; le repli local a été utilisé et déclaré.
2. Les règles de reconnaissance et de reformulation sont déterministes mais lexicalement bornées ; elles ne couvrent pas toutes les formulations scientifiques possibles.
3. Le contrat accepte `fr` et `en`, mais la narration et les formulations générées de la V1 restent françaises.
4. L’appui Knowledge d’une Hypothèse générée est volontairement plafonné à `PARTIAL` même si la couverture générale est `SUPPORTED`, faute de vérification d’une assertion exacte reliant les objets.
5. Les mécanismes précis ne sont pas générés sans Knowledge ; certains résultats signalent donc `HYPOTHESIS_WITHOUT_MECHANISM`.
6. La classification large/étroite est une heuristique V1, non une évaluation scientifique globale.
7. `DESIGN_STUDY` demeure le démonstrateur P-WEB-06 ; ST-001 ne constitue pas le Research Design Engine complet.
8. La session est locale au navigateur ; elle n’est pas un registre probatoire distribué.
9. Le bundle Protocol Designer dépasse le seuil d’avertissement Vite de 500 kB ; le build réussit mais un découpage futur est souhaitable.
10. La suite globale reste affectée par trois gardes dépendant de la propreté du dépôt Editorial Engine externe, déjà sale avant la mission.

Aucune limite ne satisfait un critère bloquant ST-001 : le moteur n’est pas une simple reformulation LLM, ne choisit aucune solution, ne masque aucune alternative, ne contourne aucune gate et ne permet pas un passage non autorisé vers Research Design.

## 25. Fichiers modifiés

Implémentation Scientific Thinking :

- `src/features/scientific-thinking/types.ts` ;
- `src/features/scientific-thinking/input.ts` ;
- `src/features/scientific-thinking/engine.ts` ;
- `src/features/scientific-thinking/change.ts` ;
- `src/features/scientific-thinking/session.ts` ;
- `src/features/scientific-thinking/ScientificThinkingView.tsx` ;
- `src/features/scientific-thinking/index.ts`.

Tests Scientific Thinking :

- `src/features/scientific-thinking/__tests__/fixtures.ts` ;
- `contracts.test.ts` ;
- `mandatory-cases.test.ts` ;
- `methodological-cases.test.ts` ;
- `reasoning.test.ts` ;
- `handoff.test.ts` ;
- `ui.test.tsx`.

Raccords bornés :

- `src/features/knowledge-engine/types.ts` ;
- `src/features/knowledge-engine/knowledge-request.ts` ;
- `src/features/protocol-designer/intake/types.ts` ;
- `src/features/protocol-designer/intake/session.ts` ;
- `src/features/protocol-designer/intake/journey.ts` ;
- `src/pages/ProtocolDesignerDemo.tsx` ;
- `src/features/protocol-designer/__tests__/p-web-06-v1.test.tsx` ;
- présent rapport.

Aucun document normatif, RDE, KE-001, Scientific Program, Reasoning Book, corpus, Scientific Knowledge Graph, route SEO, configuration de publication ou fichier Editorial Engine n’a été modifié.

## 26. Contrats

| Contract | Préservé ? | Test-preuve | Limite |
|---|---|---|---|
| ST01-C01 — Idea is not Question | Oui | cas 1, types sémantiques et `CLARIFY_IDEA` | reconnaissance lexicale V1 |
| ST01-C02 — Question is not Solution | Oui | cas T1/Fabry, préférence méthodologique et `QUESTION_SCOPE_TOO_NARROW` | dictionnaire de méthodes borné |
| ST01-C03 — Observation ≠ Hypothesis | Oui | test no-reflow et nœuds typés | classification initiale heuristique |
| ST01-C04 — Assumption visible | Oui | `mandatory-cases` et graphe `ASSUMPTION` | challenge générique si Knowledge absent |
| ST01-C05 — Multiple hypotheses preserved | Oui | principale + `NULL_OR_COMPETING`, `ALTERNATIVE_TO` | nombre volontairement borné |
| ST01-C06 — Objectives linked to Question | Oui | identifiants `linkedQuestionIds` et `linkedHypothesisIds` | pas d’élément mesurable détaillé à ce stade |
| ST01-C07 — Only decision-relevant questions asked | Oui | Question Fabry sans clarification ; registre ST adaptatif | règles V1 de nécessité |
| ST01-C08 — Knowledge not invented | Oui | cas Knowledge absent, support non soutenu, aucune source générée | couverture générale non équivalente à preuve exacte |
| ST01-C09 — Human adoption required | Oui | session/gates et handoff `NOT_READY` | identité humaine applicative non implémentée |
| ST01-C10 — Specific scientific object preserved | Oui | navigateur fibrose, no-reflow/stenting, ECV/MOLLI/SASHA | extraction lexicale bornée |
| ST01-C11 — Major change explicit | Oui | test de changement, navigateur et archive de session | invalidation au niveau des objets ST, pas moteur aval complet |
| ST01-C12 — Reasoning reconstructible | Oui | input/output digests, graphe, opérations, trace et historique | persistance locale uniquement |
| ST01-C13 — Same context → same structured reasoning | Oui | test de déterminisme byte-identique des structures | narration multilingue future hors test |
| ST01-C14 — Patient-level blocked | Oui | test unitaire et navigateur Domain Gate | compréhension générale uniquement |
| ST01-C15 — No premature Imaging decision | Oui | cas fibrose et T1 mapping ; boundary de handoff | dictionnaire de modalités borné |
| ST01-C16 — Clean handoff to Research Design | Oui | workflow humain complet et navigateur étape 1/8 | Research Design complet hors périmètre |

## 27. Décision de suite

La suite recommandée est une évaluation PD-011 dédiée de ST-001 avant toute extension de la grammaire sémantique, de la narration multilingue ou du moteur Research Design. L’optimisation du bundle et un rejeu avec le provider linguistique disponible sont des améliorations non bloquantes. Aucun protocole, corpus ou document normatif ne doit être produit à partir de ce rapport seul.

`SCIENTIFIC_THINKING_ENGINE_V1_IMPLEMENTED_WITH_LIMITATIONS`
