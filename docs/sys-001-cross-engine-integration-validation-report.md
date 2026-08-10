# SYS-001 — Cross-Engine Integration & End-to-End Validation

## Intégration, durcissement et validation de la chaîne NOXIA

| Champ | Valeur |
|---|---|
| Mission | validation technique transversale des moteurs existants |
| Date d’exécution | 10 août 2026 |
| Dépôt | `noxia-dev` |
| Baseline | `54d3cb6ca27440e31bbcd64839ccd51e2cee253c` |
| Nature | rapport d’implémentation et de validation ; aucune autorité scientifique ou normative |
| Portée | Guided Intake, Intent, Knowledge, External Evidence, Scientific Thinking, Imaging, Research Project Construction, Document Projection et UI |
| Validation scientifique PD-011 | non réalisée ; aucun PASS scientifique revendiqué |

## 1. Décision

La composition technique est substantiellement cohérente, mais elle n’est pas prête à être déclarée validée de bout en bout.

Deux ruptures bloquantes demeurent :

1. le contrat d’identité des décisions humaines de Scientific Thinking et Imaging ne transporte pas `actor`, `mandate`, `scope`, `version`, `timestamp` et `impact` ;
2. le cas obligatoire de construction d’étude comparant CT et IRM pour la fibrose myocardique ne peut pas atteindre Research Project puis Protocol Projection depuis l’application réelle : le parcours `DESIGN_STUDY` contourne Scientific Thinking, tandis qu’Imaging refuse correctement de fabriquer le biomarqueur manquant.

La trajectoire recommandée est **B — SYS-001B ciblé**, sans lancement automatique. Elle doit fermer ces deux ruptures sans modifier les autorités.

## 2. Autorités

Les documents ont été consultés dans l’ordre imposé. Le `SOURCE-OF-TRUTH-INDEX` route les autorités mais ne constitue pas une autorité scientifique autonome.

| Plan | Documents consultés | Usage dans SYS-001 |
|---|---|---|
| Gouvernance supérieure | `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`, Charte fondatrice, Scientific Product Manifesto | principes établis, frontières et responsabilités |
| Autorité éditoriale externe | `Editorial Engine — Architecture Manifesto` du dépôt externe protégé | projection passive, vérité produit externe, effets explicites |
| Références normatives NOXIA | PD-003, PD-004, PD-005, PD-009, PD-011, RDE-001 v1.1, RDE-002 v1.1, RDE-003 v1.1, KE-001 v1.0 | cible contractuelle et conditions de validation |
| Preuves d’implémentation | ENG-001, ENG-002, ENG-003, ST-001, IMG-001, IMG-001B, PRJ-001, DOC-001 | état déclaré, limites et validations antérieures |
| Code et tests | `src/features/**`, `src/pages/ProtocolDesignerDemo.tsx` | état réellement implémenté |

`INT-001` n’existe ni comme rapport identifié ni comme surface de mission active dans le checkout. Le commit de baseline `1dcb4ab fix(intent): preserve scientific comparison semantics` a été traité comme code existant, sans lui attribuer silencieusement le statut documentaire `INT-001`.

## 3. Baseline

Avant modification :

| Contrôle | Résultat |
|---|---|
| `git rev-parse HEAD` | `54d3cb6ca27440e31bbcd64839ccd51e2cee253c` |
| `git status --short` | vide |
| `git diff --stat` | vide |
| `git diff --check` | succès, aucune sortie |
| Branche | `main` |
| Commit HEAD | `feat(document): implement Document Projection Engine V1` |

Aucun reset, restore massif, clean, stash, commit, push ou déploiement n’a été exécuté.

## 4. État concurrent du dépôt

Le worktree était propre. Les changements DOC-001 étaient déjà consolidés dans le commit HEAD. Le correctif de comparaison scientifique était déjà consolidé dans `1dcb4ab`. Aucun travail concurrent non commité n’a été détecté.

Le dépôt Editorial Engine externe a été lu comme autorité et dépendance ; il n’a pas été modifié. Ses gardes historiques ne sont pas utilisées comme preuve scientifique de SYS-001.

## 5. Architecture réellement observée

La chaîne réelle est une composition de hooks React, contrats TypeScript validés par Zod, moteurs déterministes et état de session local :

`Utilisateur → Intake linguistique → validation humaine → routing déterministe → Knowledge → ST conditionnel → Imaging conditionnel → Project Construction → Document Projection → UI`.

Elle n’est pas strictement linéaire :

- UNDERSTAND s’arrête dans Knowledge ;
- FORMALIZE_IDEA active Scientific Thinking ;
- DESIGN_STUDY active Imaging si `questionRequiresImaging`, sinon Project Construction ;
- DOCUMENT n’est accessible qu’après gel et autorisation Project ;
- Knowledge Explorer est transversal et le retour conserve le contexte ;
- une indisponibilité Gemini propose un repli local explicite, sans simuler une interprétation riche.

Écart réel : DESIGN_STUDY ne crée pas actuellement de session Scientific Thinking. Imaging reçoit alors `VALIDATED_DESIGN_CONTEXT`, même lorsque la question a encore besoin de formalisation scientifique.

## 6. Matrice des moteurs

| Engine | Input Contract | Output Contract | Owner | Consumes | Produces | Human Gate | Version | Next Consumer | Failure Modes |
|---|---|---|---|---|---|---|---|---|---|
| Guided Intake | `ScientificIntakeRequest` | `ScientificIntakeInterpretation` candidate | Intake | texte utilisateur | reformulation/extraction candidate | revue de chaque champ | 1.0 | Intent | provider absent, quota, réponse invalide, sécurité locale |
| Intent / Session | interprétation + revues | `ValidatedScientificIntent`, `ScientificSessionContext` | Protocol Designer | demande, corrections humaines | intent, route, objets préservés, relations | confirmation compréhension/orientation | session schema 9.0 | Knowledge/ST/IMG/PRJ | ambiguïté, contradiction, route faible, changement majeur |
| Knowledge | `KnowledgeRequest` | `KnowledgeResult` | Knowledge Engine | intent, contexte, providers internes | concepts, assertions applicables, gaps, conflits, synthèse | clarification et autorisation externe | 1.1 runtime consolidé | UNDERSTAND/ST/IMG/PRJ | no match, provider failure, out of domain, patient-level |
| External Evidence | `ExternalQueryPlan` autorisé | candidats externes attachés au résultat | External Evidence Search | gap Knowledge + autorisation | sources/assertions candidates | autorisation utilisateur/PD-009 | V1 | Knowledge UI et futurs reviewers | forbidden, unavailable, rate limit, partial, no match |
| Scientific Thinking | `ScientificThinkingInput` | `ScientificThinkingOutput` + handoff 1.0 | ST Engine | intent validé, Knowledge, décisions | questions, hypothèses, objectifs, mécanismes candidats | sélection/revue/autorisation | 1.0.0 | Imaging ou PRJ | clarification, contradiction, refus, handoff not ready |
| Imaging | `ImagingDesignInput` | `ImagingDesignResult` + handoff 1.1 | Imaging Study Designer | question, ST ou contexte validé, Knowledge, équipement | chaîne phénomène→mesure, QA, contribution projet | revues, gates, gel | 1.1.0 | PRJ | chaîne non défendable, incompatibilité, unknown, safety, contradiction |
| Research Project Construction | `ResearchProjectConstructionInput` | `ResearchProjectDesignResult` + handoff Document 1.0 | Project Construction | intent, ST, Imaging, Knowledge | projet candidat, dépendances, readiness, version | sélection, endpoint, gel, autorisation DOC | 1.0.0 | Document | question non confirmée, Imaging requis non prêt, contradiction |
| Document Projection | projet gelé + décisions | `DocumentProjection` | Document Engine | une version Project autorisée | projection passive, sections, diff, historique de série | autorisation Project amont | 1.0.0 | UI/renderers | source non gelée, handoff absent, type non supporté |

Persistance réellement observée : session Protocol Designer, ST, IMG et PRJ sont sérialisés en stockage local ; Knowledge possède ses snapshots/caches locaux ; les projections Document sont conservées dans l’état React monté et ne survivent pas à une nouvelle session navigateur.

## 7. Contrats de handoff

| Handoff | État | Preuve | Écart |
|---|---|---|---|
| Intent → Knowledge | corrigé et testé | question, objets, relations, contexte, consumer et version transmis | le repli local n’extrait pas de champs riches |
| Knowledge → ST | conforme avec limite | `resultId`, digest, couverture, sources, gaps, concepts | identité décisionnelle aval incomplète |
| ST → Imaging | structurellement conforme | output/handoff ref, décisions IDs, unknowns, contradictions, boundary | absent dans le parcours UI DESIGN_STUDY direct |
| ST → PRJ | conforme avec limite | question, objectifs, hypothèses et décisions référencés | ST peut être remplacé par `VALIDATED_CONTEXT` |
| Imaging → PRJ | conforme pour le scénario inconnu | handoff 1.1, version, readiness, équipement, exclusions, provenance | décision de gel sans acteur/mandat |
| PRJ → DOC | corrigé et testé | project ID/version/digest, handoff, décisions, sections | PRJ record ne porte pas lui-même un impact explicite |
| Knowledge → UNDERSTAND | conforme | projection spécifique, branches séparées, gaps et provenance | une seule projection UNDERSTAND runtime, pas Document Engine autonome |
| Project change → Document regeneration | partiel | digest/version déclenchent une nouvelle projection ; diff moteur testé | historique Document non persistant hors montage React |

Aucun handoff critique n’est fondé uniquement sur une narration libre. Les textes explicatifs accompagnent des identifiants, statuts, versions, digests, tableaux structurés ou graphes d’impact.

## 8. Source de vérité

Principe établi : le Research Project PD-003 est l’unique agrégat de vérité du projet.

État réel : `ResearchProjectDesignResult` est le seul objet project-shaped transmis à DOC dans la session, mais il porte explicitement la mention `RUNTIME_PROJECT_PROJECTION_DOES_NOT_OWN_CANONICAL_TRUTH`. Aucun deuxième projet concurrent n’a été détecté. La non-duplication est donc respectée, mais l’agrégat canonique PD-003 durable n’est pas intégralement implémenté.

Knowledge, ST, IMG et DOC restent des résultats, contributions ou projections. DOC ne modifie jamais son entrée.

## 9. Ownership

- Knowledge possède la résolution et la qualification de connaissance runtime, pas la science canonique.
- ST possède la structuration des candidats scientifiques, pas leur adoption.
- Imaging possède la contribution méthodologique d’imagerie, pas le projet global ni l’inférence statistique.
- Project Construction compose le projet candidat et sa version, sans exécuter les moteurs spécialisés futurs.
- Document possède la composition et les renderers, pas le contenu scientifique ni les décisions.
- L’humain reste propriétaire des décisions et de leur mandat.

Aucun renderer ne réécrit le projet. Les changements de renderer HTML/Markdown conservent le digest de projection et le digest source.

## 10. Décisions humaines

Le contrat cible exige `decisionId`, `actor`, `mandate`, `scope`, `status`, `version`, `timestamp` et `impact`.

| Surface | Champs réellement portés | Conclusion |
|---|---|---|
| Scientific Thinking | ID, gate, décision, targets, raison, date | **bloquant** : acteur, mandat, version et impact absents |
| Imaging | ID, gate, décision, targets, raison, date | **bloquant** : acteur, mandat, version et impact absents ; les revues de candidats ne créent pas toutes un record |
| Project Construction | ID, gate, décision, targets, raison, acteur, mandat nullable, date | partiel : version et impact ne sont pas portés dans le record source |
| Document Projection | mêmes `decisionId`, acteur, mandat, scope, version source, timestamp et impact dérivé des targets | correction SYS-001 ; n’invente pas les champs absents en amont |

Les états pending/rejected ne sont pas transformés en adopted par DOC. Les mêmes IDs Project sont conservés dans la projection. La rupture amont interdit cependant de valider SYS-C05.

## 11. Unknowns

Le système conserve les distinctions `UNKNOWN`, `ABSENT`, `NOT_APPLICABLE`, `INCOMPATIBLE`, `NOT_SUPPORTED` et `BLOCKED`.

Le cas équipement IRM inconnu produit :

- Imaging strategy `FROZEN_BY_HUMAN` ;
- `equipmentCompatibilityStatus = UNKNOWN` ;
- `executableProtocolReadiness = EXECUTABLE_PROTOCOL_NOT_READY` ;
- Project `TECHNICAL_FEASIBILITY = PARTIAL` ;
- section Document Imaging contenant les deux statuts sans renforcement.

## 12. Limitations

Les limitations restent présentes dans les résultats et les sections Document. Les moteurs futurs Biostatistics, Data Management, Regulatory, Economics, Safety et Clinical Operations sont représentés comme exigences, questions ou états non évalués. Aucune valeur statistique, procédure, coût, paramètre constructeur ou protocole exécutable n’est créé.

## 13. Contradictions

Une contradiction scientifique non résolue reste dans ST et bloque le handoff par une entrée `UNRESOLVED_CONTRADICTION:<texte>`. Project et Document conservent leurs listes de contradictions ; les sections dépendantes deviennent bloquées lorsque la règle déclarative l’exige.

Contradiction documentaire à ne pas résoudre silencieusement : RDE-003 v1.1, NIVEAU_1, classe l’équipement exact inconnu parmi les conditions d’arrêt ou de refus, tandis que IMG-001B, rapport d’implémentation subordonné, autorise le gel de la stratégie scientifique et le handoff Project tout en bloquant le protocole exécutable. Le critère obligatoire SYS-001 exige ce second comportement. SYS-001 l’a testé comme séparation de branches, sans modifier ni réinterpréter l’autorité RDE-003. Une clarification normative future peut préciser que l’arrêt vise la branche exécutable et non toute contribution scientifique au projet.

## 14. Knowledge et provenance

- les providers internes restent identifiables ;
- les branches CT et IRM restent séparées ;
- une comparaison directe absente n’est pas remplacée par une conclusion générale ;
- les sources PubMed restent `ASSERTION_CANDIDATE` / `EXTERNAL_CANDIDATE` ;
- `corpusMutation` reste faux ;
- une source rétractée est exclue par ENG-003 ;
- no match, provider failure et external forbidden restent distincts ;
- le repli `EXACT_FIRST_NO_IMPLICIT_FALLBACK` est testé.

Correction d’intégration : une requête UNDERSTAND ne reçoit plus artificiellement un `strategyVersion` de projet. Elle reste donc `PUBLIC` lorsqu’aucun projet n’est présent et peut proposer, sans l’exécuter, une recherche externe autorisable.

## 15. Changements majeurs

Les événements testés couvrent : QuestionChanged, PopulationChanged, EndpointChanged, BiomarkerChanged, ModalityChanged, AcquisitionChanged, EquipmentChanged, TimingChanged, QualityRuleChanged et ImageAnalysisChanged.

Les graphes distinguent `REVIEW_REQUIRED`, `INVALIDATED`, `OBSOLETE`, `NEWLY_REQUIRED`, `PRESERVED` et `UNAFFECTED_DEMONSTRATED`. Une modification majeure reste `PENDING_CONFIRMATION` avant application. L’UI réelle affiche les éléments à reconstruire avant confirmation.

Limite : la preuve de propagation jusqu’à une nouvelle projection persistée n’est pas complète pour chaque famille d’événement ; les moteurs d’impact et de diff sont prouvés séparément.

## 16. Versionnement

- les versions ST, IMG, PRJ et Document sont explicites ;
- un changement Project confirmé crée un nouvel ID de version ;
- la version gelée antérieure reste inchangée dans `versionHistory` ;
- une projection suivante référence la nouvelle version et conserve la précédente dans sa série ;
- le changement de renderer ne modifie aucune version scientifique.

La session Protocol Designer incrémente son `contextVersion` lors d’une transition. Les timestamps peuvent varier ; les digests scientifiques déterministes restent stables à entrée égale.

## 17. Document Projection

DOC-001 a été exécuté avec des sorties réelles de Knowledge, ST, Imaging et Project Construction produites par les moteurs, pas avec un objet Project rédigé manuellement.

Preuves :

- scénario Imaging inconnu projeté fidèlement ;
- scénario non-Imaging avec section Imaging `NOT_APPLICABLE` ;
- sections `GENERATABLE`, `PARTIALLY_GENERATABLE`, `NOT_GENERATABLE`, `BLOCKED` ou `NOT_APPLICABLE` déterminées par règles ;
- décision Project conservée sous le même ID ;
- provenance, unknowns, limitations et contradictions transportés ;
- aucune section spécialisée future inventée.

## 18. Cas A–J

| Cas | État | Résultat observé |
|---|---|---|
| A — ECV UNDERSTAND | PASS | Knowledge utile ; aucun projet automatique |
| B — CT/IRM comparaison | PASS après correction | route UNDERSTAND, COMPARE, branches CT/IRM séparées |
| C — comparaison contextualisée | PASS après correction | CT, IRM et fibrose conservés ; aucune modalité sélectionnée |
| D — construction Imaging CT/IRM/fibrose | **FAIL bloquant** | objets préservés mais aucun biomarqueur gouverné ; aucune acquisition inventée ; handoff IMG NOT_READY ; l’UI DESIGN_STUDY ne passe pas par ST |
| E — équipement inconnu | PASS | IMG gelé, UNKNOWN, PRJ technique PARTIAL, protocole non prêt, DOC fidèle |
| F — équipement incompatible | PASS | INCOMPATIBLE, blocage ciblé, aucun protocole exécutable |
| G — sans Imaging | PASS | Imaging NOT_APPLICABLE, Project fonctionnel, section DOC non applicable |
| H — corpus insuffisant | PASS après correction | gap visible, recherche externe proposée mais non autorisée, aucun corpus voisin |
| I — changement après freeze | PARTIAL | nouvelle version et historique immuable prouvés ; persistance UI de l’historique DOC limitée |
| J — contradiction | PASS | contradiction ouverte, handoff bloqué, aucune résolution silencieuse |

## 19. Perturbations

Le changement de renderer, une nouvelle projection de même source et un rejeu déterministe conservent les objets critiques, la source Project et la readiness. Les tests P-WEB couvrent la conservation de session et le retour arrière.

Limite : ponctuation, ordre mineur des mots et reformulations lexicales n’ont pas tous été rejoués sur la chaîne complète jusqu’à DOC ; la couverture est partielle.

## 20. Reproductibilité

À question, contexte, corpus/version et décisions égales, Knowledge, ST, IMG, PRJ et Projection Plan produisent les mêmes digests et objets dans les tests déterministes. Les identifiants dépendant d’horodatages restent explicitement variables.

La reformulation linguistique Gemini n’est pas démontrée déterministe. Son échec conserve le contrat et le texte source mais conduit à une interprétation locale vide, donc à une capacité sémantique réduite. Reproductibilité contractuelle : PASS ; reproductibilité sémantique du provider : non démontrée.

## 21. LLM actuel

| Usage | Statut | Comportement réel | Frontière |
|---|---|---|---|
| Reformulation/extraction Intake | `LLM_OPTIONAL` | Gemini, puis validation humaine | ne devient jamais un fait sans revue |
| Repli Intake | `DETERMINISTIC_FALLBACK` | interprétation vide, texte conservé | ne simule pas le provider |
| Classification/routing final | `LLM_FORBIDDEN` | règles déterministes sur intent validé | route réversible et traçable |
| Knowledge retrieval/synthesis | `LLM_FORBIDDEN` | providers, règles, applicabilité, synthèse déterministe | aucune invention |
| External query/extraction | `LLM_FORBIDDEN` actuellement | requête gouvernée et extraction candidate exacte | jamais de promotion automatique |
| Scientific Thinking | `LLM_FORBIDDEN` pour décision | construction déterministe de candidats | humain adopte ou rejette |
| Imaging | `LLM_FORBIDDEN` pour science/méthode | chaîne déterministe et gaps | aucun protocole constructeur |
| Project Construction | `LLM_FORBIDDEN` | composition déterministe | moteurs futurs non simulés |
| Document Projection/rédaction | `LLM_FORBIDDEN` | patterns déclaratifs et renderers passifs | projection non propriétaire |

## 22. Future Semantic Validation Layer

Cette couche n’est pas implémentée et ne constitue pas VAL-001.

### Points d’insertion possibles

1. après l’interprétation Intake, avant validation humaine ;
2. après le routing, avant activation conditionnelle ;
3. à chaque handoff ST→IMG, IMG→PRJ et PRJ→DOC ;
4. après une modification majeure, avant invalidation ciblée ;
5. avant restitution d’une projection.

### Contrat documentaire candidat

`SemanticValidationRequest` : `originalRequest`, `interpretedIntent`, `preservedObjects`, `engineInput`, `engineOutput`, `expectedOperation`, `humanDecisions`, `limitations`, `provenance`.

`SemanticValidationResult` : `VALID | INVALID | REVIEW_REQUIRED`, `diagnostics`, `lostObjects`, `intentDrift`, `unsupportedStrengthening`, `unsupportedWeakening`, `rerouteSuggestion`.

### Risques et frontières

- ne jamais modifier directement Research Project ;
- ne jamais adopter une décision ;
- ne jamais renforcer une preuve ou résoudre une contradiction ;
- distinguer erreur sémantique, corpus insuffisant et moteur indisponible ;
- conserver request/result/version pour rejeu ;
- toute reroute reste proposition soumise au workflow PD-009.

## 23. UX end-to-end

Validation dans l’application réelle, serveur local :

| Contrôle | Résultat |
|---|---|
| Desktop 1440×900 | aucun débordement horizontal |
| Mobile 375×812 | aucun débordement horizontal |
| Comparaison CT/IRM/fibrose | trois objets visibles, route UNDERSTAND |
| Knowledge | branches CT/IRM séparées, comparaison non couverte visible |
| Transition Knowledge→ST | contexte v1→v2, objet central conservé |
| Retour ST→Knowledge | activation clavier Entrée, contexte v3 conservé |
| Changement majeur | alertdialog avant reconstruction, liste des impacts visible |
| Progressive disclosure | graphes, traces et provenance en niveaux secondaires |
| Console | aucune erreur ; deux warnings React Router v7 préexistants |
| Échec Gemini | texte conservé, repli local explicite, aucune simulation |

Le parcours clavier complet Tab n’a pas pu être observé de façon fiable par la surface de navigateur ; l’activation clavier d’une action a été prouvée et les tests composants P-WEB restent verts. Cette limitation n’est pas transformée en preuve complète d’accessibilité.

## 24. Corrections réalisées

1. conservation explicite de `CT cardiaque` et `IRM cardiaque` dans le contexte Intent ;
2. augmentation Knowledge des termes déclarés par les objets extraits de la question, sans écrasement ;
3. routing des comparaisons sans intention de projet vers UNDERSTAND ;
4. conservation des modalités Imaging même sans biomarqueur, avec interdiction d’émettre une acquisition sans lien biomarqueur ;
5. nouveau consumer Knowledge `RESEARCH_PROJECT_CONSTRUCTION` pour les projets non-Imaging ;
6. suppression du faux `strategyVersion` Project sur les requêtes UNDERSTAND publiques ;
7. transport PRJ→DOC du mandat, scope, version, timestamp et impact traçable disponibles ;
8. suite de validation compositionnelle SYS-001 dédiée.

Aucun corpus, Reasoning Book, Knowledge Graph, Scientific Program, document normatif ou moteur futur n’a été modifié.

## 25. Tests

| Suite | Résultat |
|---|---|
| SYS-001 | 10 fichiers, 24 tests, PASS |
| Knowledge / External Evidence | 8 fichiers, 87 tests, PASS |
| Scientific Thinking | 6 fichiers, 33 tests, PASS |
| Imaging | 9 fichiers, 60 tests, PASS |
| IMG-001B ciblé | 8 tests, PASS, sous-ensemble de la suite Imaging |
| Research Project Construction | 5 fichiers, 56 tests, PASS |
| Document Projection | 3 fichiers, 22 tests, PASS |
| Protocol Designer / Intake / P-WEB | 7 fichiers, 148 tests, PASS |
| Typecheck | PASS |
| Lint | PASS avec 7 warnings Fast Refresh préexistants, 0 erreur |
| Build | PASS avec warnings Browserslist/chunk size préexistants |
| `git diff --check` | PASS avant modifications ; à rejouer en validation finale |
| Suite globale | 926 PASS, 3 FAIL sur 929 ; les 3 échecs sont exclusivement les gardes préexistantes exigeant un dépôt Editorial Engine externe propre |

## 26. Limitations

- contrat complet des décisions ST/IMG non implémenté ;
- scénario D incapable d’atteindre Project/DOC sans biomarqueur gouverné ni orchestration ST préalable ;
- historique Document non persistant après démontage de la page ;
- une seule définition de projection (`PROTOCOL`) est implémentée ; cohérence multi-projection non démontrable ;
- aggregate Research Project canonique PD-003 durable incomplet ;
- validation scientifique PD-011 non réalisée ;
- compatibilité équipement générale non fermée ;
- protocole d’acquisition exécutable interdit ;
- Biostatistics, Data Management, Regulatory, Economics, Safety et Clinical Operations non implémentés ;
- Semantic Validation Engine non implémenté ;
- Gemini indisponible pendant le test navigateur ; fonctionnement du repli prouvé, qualité provider non testée ;
- parcours clavier Tab navigateur non intégralement probant.

## 27. Fichiers modifiés

- `package.json` ;
- `src/pages/ProtocolDesignerDemo.tsx` ;
- `src/features/protocol-designer/intake/journey.ts` ;
- `src/features/knowledge-engine/types.ts` ;
- `src/features/knowledge-engine/knowledge-request.ts` ;
- `src/features/knowledge-engine/concept-resolver.ts` ;
- `src/features/knowledge-engine/engine.ts` ;
- `src/features/imaging-study-designer/engine.ts` ;
- `src/features/document-projection/types.ts` ;
- `src/features/document-projection/composition.ts` ;
- `src/features/document-projection/DocumentProjectionView.tsx` ;
- `src/features/document-projection/markdown-renderer.ts` ;
- `src/features/document-projection/html-renderer.ts` ;
- `src/features/system-integration/audit.ts` ;
- `src/features/system-integration/index.ts` ;
- `src/features/system-integration/__tests__/` ;
- le présent rapport.

Le `SOURCE-OF-TRUTH-INDEX` n’est pas modifié : SYS-001 est un rapport non admis et n’ajoute ni corpus ni autorité. Une admission documentaire explicite reste nécessaire avant tout routage dans l’index.

## 28. Contrats

| Contract | Status | Evidence | Test | Limitation |
|---|---|---|---|---|
| SYS-C01 — Original intent preserved | PASS | original question, validated intent, handoffs | end-to-end, UI | repli local sans extraction riche |
| SYS-C02 — Specialized objects preserved | PASS_WITH_LIMITATION | CT, IRM, fibrose, COMPARE distincts | end-to-end D, browser | scénario D s’arrête avant PRJ |
| SYS-C03 — One Research Project truth | PASS_WITH_LIMITATION | DOC lit un seul résultat Project | document-projection | aggregate canonique durable incomplet |
| SYS-C04 — Engine ownership preserved | PASS | boundaries et projection notices | contracts, engine suites | aucun moteur Phase 2 |
| SYS-C05 — Human decisions immutable | **FAIL_BLOCKING** | audit ST/IMG incomplet | human-decisions | acteur/mandat/version/impact absents |
| SYS-C06 — Unknown remains unknown | PASS | UNKNOWN→PARTIAL→UNKNOWN | unknowns | compatibilité à revoir |
| SYS-C07 — Contradictions preserved | PASS | blocker ST et sections DOC | end-to-end J, DOC | contextualisation dépendante |
| SYS-C08 — Knowledge provenance preserved | PASS | sources, locators, digests | provenance, Knowledge | revue globale non revendiquée |
| SYS-C09 — External evidence stays candidate | PASS | corpusMutation=false | provenance, ENG-003 | aucune promotion |
| SYS-C10 — Engine activation conditional | PASS_WITH_LIMITATION | UNDERSTAND, non-Imaging, missing IMG | engine-availability, browser | ST non activé dans DESIGN_STUDY |
| SYS-C11 — NOT_APPLICABLE supported | PASS | non-Imaging PRJ/DOC | engine-availability, DOC | aucune section artificielle |
| SYS-C12 — Missing engine never simulated | PASS | REQUIRED_BUT_NOT_READY/refusal | engine-availability | moteur futur absent |
| SYS-C13 — Major changes propagate | PARTIAL | graphes IMG/PRJ, alert UI | changes, versions, browser | pas chaque événement jusqu’à DOC persistant |
| SYS-C14 — Historical versions immutable | PASS | snapshot gelé et versionHistory | versions | persistance locale |
| SYS-C15 — Project → Document handoff faithful | PASS_WITH_LIMITATION | source digest/version et décisions | unknowns, DOC | historique React non durable |
| SYS-C16 — Projection never owns science | PASS | boundary, immutabilité, passive renderers | DOC, regression | une seule projection active |
| SYS-C17 — Multi-projection consistency | NOT_DEMONSTRATED | seul Protocol implémenté | catalogue DOC | projections futures absentes |
| SYS-C18 — Deterministic replay | PASS_WITH_LIMITATION | mêmes digests/objets | regression, engine suites | provider linguistique hors garantie |
| SYS-C19 — LLM failure preserves contracts | PASS_WITH_LIMITATION | fallback local réel | browser, P-WEB | sémantique réduite |
| SYS-C20 — No silent scientific reconstruction | PASS | blocages/gaps/branches | A–J | cas D non clos |

## 29. Non-régressions

Les suites Knowledge, ST, IMG, IMG-001B, PRJ, DOC et Protocol Designer restent vertes après corrections. Aucun paramètre constructeur, résultat scientifique, fait clinique, recommandation ou valeur statistique n’a été ajouté. Les branches non couvertes restent visibles. Le build de production aboutit.

La suite globale exécute 929 tests : 926 passent. Les trois échecs sont `P3M-Web 80`, `P4 66` et la garde P5 « leaves editorial-engine unchanged ». Ils lisent le dépôt externe `/Users/charles/Documents/Projets/editorial-engine`, déjà sale et hors périmètre d’écriture SYS-001. Aucune différence SYS-001 n’est impliquée dans ces trois assertions ; les suites ciblées du dépôt NOXIA sont toutes vertes.

Les warnings non bloquants observés sont : Fast Refresh sur sept composants UI, avertissements React Router v7, données Browserslist anciennes et taille du chunk Protocol Designer. Aucun n’est introduit comme vérité métier ni masqué comme succès scientifique.

## 30. Prochaine étape

Recommandation : **B — SYS-001B ciblé**.

Périmètre minimal proposé, sans exécution automatique :

1. définir et implémenter un envelope décisionnel partagé conforme à PD-003/PD-009 pour ST, IMG, PRJ et DOC, avec identité humaine et mandat obligatoires avant adoption ;
2. définir le guard déterministe qui active ST depuis DESIGN_STUDY lorsque la question, les hypothèses, objectifs ou le lien phénomène–biomarqueur ne sont pas assez stabilisés ;
3. rejouer le cas D dans l’application réelle jusqu’à Protocol Projection ;
4. rejouer le parcours clavier intégral ;
5. ne demander VAL-001 qu’après fermeture et nouvelle validation SYS.

`CROSS_ENGINE_INTEGRATION_NOT_READY`
