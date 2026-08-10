# SYS-001B — Cross-Engine Integration Closure Report

| Champ | Valeur |
|---|---|
| Mission | fermeture ciblée des deux blocages de SYS-001 |
| Date d’exécution | 10 août 2026 |
| Dépôt | `noxia-dev` |
| Baseline | `03bfaef4033486fd9c4077165978252f0d38a8bc` |
| Branche | `main` |
| Nature | rapport d’implémentation et de validation ; aucune autorité scientifique ou normative |
| Validation scientifique PD-011 | non réalisée ; aucun PASS scientifique revendiqué |

## 1. Décision

Les deux blocages techniques de SYS-001 sont fermés : SYS-C05 et SYS-C10 passent, et le cas D atteint réellement une projection Protocol depuis l’application. Scientific Thinking reste conditionnel, Imaging conserve ses gardes, les décisions engageantes portent leur identité humaine et aucune science n’est fabriquée pour fermer le parcours.

Décision : **CROSS_ENGINE_INTEGRATION_CLOSED_WITH_LIMITATIONS**. Les limitations restantes sont non bloquantes pour SYS-001B et sont explicitées en section 27.

## 2. Autorités

Le `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md` a été lu en premier comme routeur documentaire, sans lui attribuer d’autorité scientifique autonome. Les principes établis proviennent de la Charte fondatrice et du Scientific Product Manifesto. Les références normatives consultées incluent PD-003, PD-004, PD-005, PD-009, PD-011, RDE-001 v1.1, RDE-002 v1.1, RDE-003 v1.1 et KE-001. Les rapports ENG-001 à ENG-003, ST-001, IMG-001, IMG-001B, PRJ-001, DOC-001 et SYS-001 documentent l’état antérieur.

Le corpus scientifique et le Knowledge Graph n’ont pas été modifiés. La cible de SYS-001B était strictement contractuelle et orchestrale. L’état réellement implémenté est décrit ci-dessous. Aucune hypothèse n’est présentée comme une capacité validée.

## 3. Baseline

Avant SYS-001B : worktree `noxia-dev` propre, branche `main`, HEAD `03bfaef4033486fd9c4077165978252f0d38a8bc`, `git diff --stat` vide et `git diff --check` réussi. Aucun reset, restore, clean, stash, commit, push ou déploiement n’a été exécuté.

Le checkout externe `/Users/charles/Documents/Projets/editorial-engine` était déjà sale avant la mission. Il a été traité comme protégé, lu seulement par les gardes existantes et jamais modifié par SYS-001B.

## 4. Deux blocages SYS-001

1. Les décisions ST et IMG ne transportaient pas l’identité, le mandat, la version et l’impact requis de manière partagée jusqu’à PRJ et DOC.
2. `DESIGN_STUDY` contournait Scientific Thinking même lorsque la chaîne Question–Phénomène–Biomarqueur nécessaire à Imaging était incomplète ; le cas CT/IRM/fibrose s’arrêtait donc correctement dans Imaging, mais trop tard pour être reconstruit.

Ces deux défauts sont corrigés sans créer de moteur, d’architecture ou d’autorité nouvelle.

## 5. Architecture de correction

La correction ajoute deux composants internes minimaux à la composition existante :

- un contrat partagé `HumanDecisionEnvelope`, consommé sans reconstruction par ST, IMG, PRJ et DOC ;
- un `Scientific Readiness Guard` déterministe, exécuté entre Intent et le prochain moteur spécialisé.

La chaîne réelle devient : `Intake → Intent → Knowledge → [Scientific Thinking si requis] → [Imaging si requis] → Research Project → décision humaine de gel → Document Projection`.

## 6. Human Decision Envelope

L’envelope partagé porte exactement : `decisionId`, `actor`, `mandate`, `scope`, `status`, `version`, `timestamp`, `impact`, `targets`, `reason`, `provenance`, `engineSource` et `projectVersion`. `gateId` et `envelopeVersion` restent des métadonnées opérationnelles explicites.

Une décision candidate ou une porte `PENDING` peut exister avec `actor`, `mandate` et `timestamp` non attribués. Elle reste non engageante. Toute adoption, validation, freeze, handoff ou projection engageante exige l’acteur et son mandat ; en leur absence, l’état devient `INCOMPLETE_FOR_ADOPTION` et aucun effet aval n’est produit.

## 7. Migration ST

Scientific Thinking passe à la version `1.1.0`, handoff `1.1`. Les portes Question, Hypothèse, Objectif et transition de design créent des envelopes candidates puis des décisions engageantes seulement après attribution de l’acteur et du mandat. Les revues successives créent une nouvelle version sans muter l’ancienne. Le handoff transporte les décisions complètes, pas seulement leurs identifiants.

## 8. Migration IMG

Imaging passe à la version `1.2.0`, handoff `1.2`. Les revues de phénomènes, biomarqueurs, modalités et acquisitions ainsi que les portes structurantes utilisent le même contrat. L’autorité saisie dans l’UI est conservée dans les contrôles de session. Le gel Imaging reste impossible tant que les chaînes scientifiques, questions adaptatives ou portes structurantes réellement bloquantes sont ouvertes.

## 9. Propagation PRJ

Research Project Construction passe à la version `1.1.0`, handoff Document `1.1`. L’entrée fusionne les envelopes ST, IMG et les décisions locales sans modifier une version historique. Les décisions Population, Design, Critère, alternatives, compromis, limitations, gel et handoff DOC exigent acteur, mandat et justification. Le Research Project demeure l’unique agrégat de projet transmis à DOC.

## 10. Projection DOC

Document Projection passe à `1.1.0`. La composition et les renderers transportent les `HumanDecisionEnvelope` exacts. DOC ne reconstruit plus un acteur, un mandat, un statut, une version ou un impact depuis des champs voisins. Les doublons ne sont éliminés que pour une même paire `decisionId + version`; les versions successives restent visibles.

## 11. Scientific Readiness Guard

Le guard `1.0` est pur et déterministe. Il qualifie la stabilisation de la question, l’objet/Phénomène, l’objectif, la relation, les contradictions ouvertes, le besoin Imaging et la présence d’un observable ou biomarqueur. Il retourne `SCIENTIFIC_THINKING_REQUIRED` ou `READY_FOR_NEXT_ENGINE`, une surface suivante et une trace explicite.

Dans le cas D, le motif `IMAGING_OBSERVABLE_OR_BIOMARKER_MISSING` active ST avant Imaging. Une autorisation ST existante est réutilisée sans nouvelle activation artificielle.

## 12. Règles d’activation ST

- `UNDERSTAND` reste un parcours Knowledge.
- `FORMALIZE_IDEA` active ST.
- `DESIGN_STUDY` active ST seulement si le guard détecte une chaîne scientifique insuffisante ou contradictoire.
- Une demande Imaging déjà structurée, par exemple avec ECV explicitement qualifié, peut aller directement à Imaging.
- Une demande non-Imaging suffisamment structurée peut aller directement à Project Construction.
- Une contradiction ouverte réactive ST ; aucun moteur aval ne la résout silencieusement.

## 13. Cas D complet

Demande rejouée : « Je veux construire une étude comparant CT et IRM pour mesurer la fibrose myocardique. »

Parcours navigateur prouvé : Intake local explicite après indisponibilité Gemini → validation de compréhension → `DESIGN_STUDY` → ST requis → clarification de la mesure et du critère de comparaison → décisions humaines ST → Knowledge applicable → Imaging avec ECV candidat et branches CT/IRM → décisions et gel Imaging → Project Construction → décisions et gel Project → autorisation documentaire → `Protocol — projection documentaire`.

Le libellé affiché est : « Scientific object / phenomenon candidate: fibrose myocardique, à confirmer selon les objets et connaissances applicables ». Il n’est pas promu automatiquement en Phénomène biologique canonique confirmé.

## 14. Knowledge dans le cas D

Knowledge reste exact-first, sans closest-corpus fallback. Les assertions applicables et leurs références gouvernées permettent de présenter ECV comme candidat relié aux branches CT et IRM. L’absence d’une comparaison générale directe demeure une limitation. Les sources, locators, digests, gaps et provenance restent identifiables ; aucune mutation de corpus n’est réalisée.

## 15. Imaging

Imaging conserve `fibrose myocardique` comme objet, ECV comme candidat gouverné et CT/IRM comme deux branches non sélectionnées automatiquement. Les acquisitions restent de niveau 1/2 ; le niveau 3 exécutable est explicitement bloqué. L’équipement inconnu reste `UNKNOWN`, et un timing critique inconnu bloque effectivement le freeze. Le handoff devient possible seulement après une décision humaine explicite sur le timing et les autres portes applicables.

## 16. PRJ

PRJ reçoit le handoff Imaging gelé, la Question ST, les Objectifs, Hypothèses, unknowns, limites, provenance et décisions. Il construit des plans candidats, exige une sélection humaine du design et du Critère principal, ne calcule aucun effectif ni puissance et ne simule aucun moteur spécialisé futur. Le gel crée une version candidate immuable avant l’autorisation DOC.

## 17. DOC

La projection Protocol est `PARTIAL`, avec 10 sections générables et 6 partiellement générables dans le rejeu navigateur. Elle conserve `fibrose myocardique`, la question CT/IRM, le plan humainement adopté, les limites Imaging, les inconnues, les exigences futures et le registre complet des décisions ST/IMG/PRJ. La projection affirme explicitement qu’elle n’est ni la vérité du projet, ni un protocole clinique exécutable, ni une approbation.

## 18. Cas non-Imaging

Les tests rejouent une demande structurée explicitement sans Imaging : ST n’est pas rendu obligatoire et Project Construction est la surface suivante. Imaging et sa section documentaire deviennent `NOT_APPLICABLE`; aucun faux handoff Imaging n’est créé.

## 19. Legacy decisions

Les décisions historiques incomplètes restent conservées sous `LEGACY_DECISION_IDENTITY_INCOMPLETE`. Aucun acteur ni mandat n’est déduit d’une raison, d’un auteur libre ou d’une projection DOC. Ces décisions ne peuvent pas produire un nouvel effet engageant sans réouverture et attribution explicite de l’autorité.

## 20. Versionnement

Une réouverture produit `version + 1`, référence la provenance antérieure et conserve la version précédente. Les décisions ST, IMG et PRJ sont immuables par paire `decisionId + version`. Les tests couvrent le rejeu déterministe, la réouverture après changement majeur et la présence simultanée des versions dans DOC.

## 21. Impact

`impact` distingue `affectedObjects`, `affectedEngines`, `reopenedGates` et `obsoleteProjections`. Un changement majeur affiche ses effets avant confirmation, réouvre les portes touchées et marque les projections aval concernées sans modifier silencieusement la version gelée.

## 22. Session/persistence

Le schéma de session Protocol Designer passe de `9.0` à `10.0` et utilise une clé locale V10. Une session V9 n’est pas relue silencieusement comme V10. L’état central conserve la question, l’intent, l’objet candidat, les transitions, ST, IMG, PRJ, les décisions, les unknowns et les versions. La projection DOC reste une projection runtime du montage courant, comme avant SYS-001B.

## 23. UX

L’UI distingue les portes candidates non attribuées des décisions engageantes. Les champs Acteur et Mandat expliquent quand ils deviennent obligatoires. La porte Scientific Thinking annonce pourquoi elle est activée et ce qu’elle empêche. Le passage entre ST, IMG, PRJ et DOC conserve le contexte et l’objet central. Les questions adaptatives expliquent leur raison et leur influence, et acceptent texte libre, suggestions ou « je ne sais pas ».

## 24. Clavier

Les contrôles sont des éléments natifs (`button`, `textarea`, `input`, `select`) avec libellés accessibles. Les suites P-WEB vérifient le focus visible, le déplacement de focus après interprétation et l’opérabilité native. Le parcours navigateur complet a été réalisé sémantiquement ; un audit exhaustif Tab/Shift+Tab de chaque contrôle n’est pas revendiqué comme preuve WCAG complète.

## 25. Tests

| Validation | Résultat |
|---|---|
| SYS-001B dédié | 10 tests, PASS |
| SYS-001 / System Integration | 11 fichiers, 34 tests, PASS |
| Intake / Intent / Protocol Designer | 7 fichiers, 148 tests, PASS |
| Knowledge + External Evidence | 8 fichiers, 87 tests, PASS |
| Scientific Thinking | 6 fichiers, 33 tests, PASS |
| Imaging | 9 fichiers, 60 tests, PASS |
| IMG-001B ciblé | 8 tests, PASS |
| Research Project Construction | 5 fichiers, 56 tests, PASS |
| Document Projection | 3 fichiers, 22 tests, PASS |
| Typecheck | PASS |
| Lint | PASS, 0 erreur, 7 warnings Fast Refresh préexistants |
| Build | PASS ; warnings Browserslist/chunk size non bloquants |
| Navigateur | PASS du cas D jusqu’à Protocol Projection ; reprise dans un onglet neuf sans erreur console |
| `git diff --check` | PASS |
| Suite globale | 936 PASS / 939 ; 3 échecs exclusivement externes et préexistants |

## 26. Contrats SYS rejoués

| Contrat | État | Preuve principale |
|---|---|---|
| SYS-C01 — Original intent preserved | PASS | question source et reformulation transportées |
| SYS-C02 — Specialized objects preserved | PASS | fibrose, CT, IRM et ECV restent distincts |
| SYS-C03 — One Research Project truth | PASS_WITH_LIMITATION | une seule source Project vers DOC ; agrégat durable incomplet |
| SYS-C04 — Engine ownership preserved | PASS | frontières et notices des moteurs |
| SYS-C05 — Human decisions immutable | PASS | envelope partagé, acteur/mandat, version, réouverture |
| SYS-C06 — Unknown remains unknown | PASS | inconnues Imaging/Project/DOC conservées |
| SYS-C07 — Contradictions preserved | PASS | contradiction ouverte bloque/réactive ST |
| SYS-C08 — Knowledge provenance preserved | PASS | sources, locators et digests |
| SYS-C09 — External evidence stays candidate | PASS | aucune mutation/promotion du corpus |
| SYS-C10 — Engine activation conditional | PASS | ST conditionnel dans DESIGN_STUDY |
| SYS-C11 — NOT_APPLICABLE supported | PASS | parcours non-Imaging |
| SYS-C12 — Missing engine never simulated | PASS | exigences spécialisées futures uniquement |
| SYS-C13 — Major changes propagate | PASS_WITH_LIMITATION | graphes et versions ; persistance DOC runtime |
| SYS-C14 — Historical versions immutable | PASS | anciennes versions conservées |
| SYS-C15 — Project → Document handoff faithful | PASS | décisions exactes, version et digest |
| SYS-C16 — Projection never owns science | PASS | renderers passifs, source Project inchangée |
| SYS-C17 — Multi-projection consistency | NOT_DEMONSTRATED | seule la projection Protocol existe |
| SYS-C18 — Deterministic replay | PASS_WITH_LIMITATION | digests stables ; provider linguistique hors garantie |
| SYS-C19 — LLM failure preserves contracts | PASS_WITH_LIMITATION | fallback local explicite, sémantique réduite |
| SYS-C20 — No silent scientific reconstruction | PASS | gaps, limites et blocages conservés |

## 27. Limitations

- une seule définition DOC (`PROTOCOL`) est implémentée ; SYS-C17 reste `NOT_DEMONSTRATED` comme autorisé ;
- l’agrégat Research Project canonique durable défini par PD-003 n’est pas intégralement matérialisé ;
- l’historique DOC reste attaché au montage runtime ;
- la validation scientifique PD-011 n’est pas réalisée ;
- le parcours clavier intégral ne constitue pas un audit WCAG complet ;
- Gemini était indisponible pendant le rejeu navigateur ; le fallback contractuel est prouvé, pas la qualité du provider ;
- le protocole d’acquisition exécutable, les paramètres constructeur, l’effectif, la puissance, le budget, la réglementation et les moteurs spécialisés futurs restent volontairement non générés ;
- la contradiction documentaire déjà signalée par SYS-001 entre l’arrêt RDE-003 et le handoff scientifique IMG-001B n’est pas résolue silencieusement : le handoff ne vaut jamais autorisation d’acquisition exécutable ;
- la suite globale reste rouge sur trois gardes qui exigent que le checkout Editorial Engine externe soit propre.

## 28. Fichiers modifiés

Le périmètre comprend 43 fichiers suivis modifiés, trois nouveaux fichiers de code/test et le présent rapport, répartis ainsi :

- `src/features/protocol-designer/` : envelope humain, guard, session V10, intent et tests P-WEB ;
- `src/features/scientific-thinking/` : contrats, session, moteur, UI et tests ;
- `src/features/imaging-study-designer/` : contrats, input, session, moteur, UI et tests ;
- `src/features/knowledge-engine/concept-resolver.ts` : résolution gouvernée des concepts applicables ;
- `src/features/research-project-construction/` : contrats, input, session, moteur, UI et tests ;
- `src/features/document-projection/` : composition, contrats, renderers, UI et tests ;
- `src/features/system-integration/` : audit, fixtures, régressions et suite `sys-001b-closure.test.ts` ;
- `src/pages/ProtocolDesignerDemo.tsx` : orchestration conditionnelle et conservation de contexte ;
- `docs/sys-001b-cross-engine-integration-closure-report.md`.

Le `SOURCE-OF-TRUTH-INDEX` n’est pas modifié : ce rapport technique n’est ni une nouvelle autorité, ni un corpus, ni une admission documentaire explicitement demandée.

## 29. Non-régressions

Toutes les suites ciblées du dépôt NOXIA sont vertes. La suite globale exécute 939 tests : 936 passent. Les trois échecs sont les gardes P3M-Web 80, P4 66 et P5 « leaves editorial-engine unchanged », qui lisent le checkout externe déjà sale et hors périmètre. Aucun échec interne SYS-001B ne subsiste.

Aucun corpus, Reasoning Book, Scientific Program, Territory Model, Knowledge Graph, document normatif, route publique, moteur futur ou autorité n’a été modifié. Aucun commit, push ou déploiement n’a été effectué.

## 30. Prochaine étape

SYS-001B ne justifie pas une nouvelle architecture. La prochaine étape éventuelle relève d’une mission séparée : admission documentaire explicite du rapport si souhaitée, nettoyage autorisé du checkout Editorial Engine par son propriétaire, ou validation scientifique/accessibilité dédiée. Aucune de ces actions n’est requise pour fermer les deux blocages SYS-001.

CROSS_ENGINE_INTEGRATION_CLOSED_WITH_LIMITATIONS
