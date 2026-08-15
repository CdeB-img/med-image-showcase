# QRY-001 — Information Gain Engine — Closure Report

## 1. Décision

`QRY001_INFORMATION_GAIN_ENGINE_CLOSED_WITH_SESSION_MEMORY_LIMITATION_READY_FOR_UX001`

QRY-001 est fermé comme implémentation produit de niveau 3 subordonnée à PD-009. La mémoire de navigation reste limitée à la session, tandis que la sélection est reconstructible depuis l’état courant du Research Project et les signaux propriétaires.

Ce rapport est une `LEVEL_3_IMPLEMENTATION_EVIDENCE`. Il n’est ni une autorité normative, ni une preuve `PD011_PASS`.

## 2. Périmètre réel

QRY-001 fournit une navigation scientifique déterministe et en lecture seule : collecte de besoins sourcés, construction d’actions candidates, éligibilité, comparaison qualitative, conservation des options non dominées, lifecycle, routage vers les owners et surface produit minimale. QRY ne décide aucune vérité scientifique et ne modifie ni Project ni VAL.

## 3. Autorités appliquées

- Routage documentaire : `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`, version 1.45, non modifié.
- Principes : Charte fondatrice, Scientific Product Manifesto V2 et gouvernance externe de l’Editorial Engine.
- Modèle et ownership : `docs/pd-003-v2-research-object-model.md` et annexes applicables.
- Présentation : `docs/pd-004-ux-manifesto.md`.
- Navigation et valeur de l’information : `docs/pd-009-decision-engine-architecture.md`, autorité unique de la politique QRY.
- Exécution de capabilities : PD-005, sans choix de provider ou de modèle par QRY.
- Validation : VAL-001 consommé en lecture seule ; PD-011 n’est pas revendiqué.

## 4. Baseline et commits

| Étape | Décision | Commit |
| --- | --- | --- |
| Partie 1 | `QRY001_PART1_BASELINE_READY_WAITING_FOR_PART2` | lecture seule, baseline `01d1d22e8c97ed4efd7e586796ba51d4090e3bb7` |
| Partie 2 | `QRY001_PART2_DETERMINISTIC_INFORMATION_GAIN_ENGINE_READY_WAITING_FOR_PART3` | `18279c4bf58ce99205f7a212ba93a89ac2a2f344` |
| Partie 3 | `QRY001_PART3_NAVIGATION_LIFECYCLE_READY_WAITING_FOR_PART4` | `9a04ad0057724978a62a731bba0cb0df46251b1a` |
| Partie 4 fonctionnelle | intégration produit et écarts de fermeture clos | `805fe9c1efac217edf91a6972262d0115f27f1ae` |

## 5. Mapping PD-009

Chaque `NextActionCandidate` référence exactement une des huit catégories PD-009 : clarifier par échange adaptatif ; construire ou réviser un objet ; comparer des options ; déclencher une revue méthodologique ; demander une décision humaine ; produire une projection provisoire ; suspendre ou arrêter ; refuser une projection protocolaire.

Les codes techniques sont explicitement mappés vers ces libellés. Ils ne constituent pas une taxonomie concurrente.

## 6. Context et besoins de navigation

`QueryNavigationContext` est `DERIVED`, `READ_ONLY`, version-aware, reconstructible et `sourceOfTruth = false`. Il agrège des références vers les unknowns, ambiguïtés, contradictions, planning decision requirements, findings et reviews VAL, readiness, générabilité documentaire, gaps et dépendances. Il ne duplique pas le Research Project.

Un `DataNeed` reste distinct d’un Besoin d’information PD-009 : son identité et son owner sont conservés lorsqu’un adapter expose une incertitude de navigation.

## 7. Actions, éligibilité et valeur de l’information

Les actions candidates conservent target, owner, sources, branches, décisions, dependencies, impacts, provenance et conséquence du defer. Leur éligibilité exclut notamment les branches fermées, les besoins résolus, la complétude abstraite et les objets realized-time différés.

Le modèle de valeur de l’information est un vecteur qualitatif à neuf dimensions, comparé dans l’ordre lexicographique PD-009 puis par dominance. Il n’existe aucun score global, somme pondérée, pourcentage, probabilité artificielle ou tie-break arbitraire. Les dimensions non établies restent `UNKNOWN` ou `NOT_AVAILABLE`.

## 8. Dominance et sélection

Les options non dominées sont toutes conservées. Une action est sélectionnée uniquement lorsqu’une préférence déterministe existe. Une égalité ou un compromis persistant reste visible et peut produire un choix humain ; l’ordre de tableau ou d’affichage n’est jamais converti en préférence scientifique.

`NO_USEFUL_ACTION` ne signifie pas `PROJECT_COMPLETE`. `SUFFICIENT_FOR_CURRENT_STEP` ne signifie pas `PD011_PASS`. Un refus de projection conserve sa règle, ses preuves, son owner et sa remédiation éventuelle.

## 9. Lifecycle, réponses et mémoire

La Partie 3 sépare sélection, présentation, réponse, résolution, defer, decline, cannot-answer, supersession, invalidation, completion et réouverture. Une réponse brute n’est jamais une vérité Project.

- texte libre : handoff vers Scientific Interpretation ;
- option structurée ou revue : cible Human Decision ;
- action de domaine : owner/capability ;
- defer, decline ou cannot-answer : lifecycle QRY uniquement ;
- réponse stale : préservée mais jamais promue.

La déduplication utilise l’identité structurelle du besoin, de la cible, des décisions, des branches et de la version. Aucun fuzzy matching scientifique n’est utilisé.

## 10. Intégrations propriétaires

### Research Project

La surface Project consomme une projection QRY et ne contient plus sa propre sélection transverse de questions. QRY n’appelle aucune mutation Project. Après une décision ou contribution appliquée par son owner, une nouvelle version Project reconstruit la sélection.

### VAL

QRY consomme les gates et traces VAL sans recalculer d’invariant, fermer de finding ou modifier de ValidationRun. En l’absence actuelle d’historique transverse persisté, `NOT_EVALUABLE` est affiché comme prérequis système/validation et jamais comme question scientifique.

Les demandes de revue sémantique restent différées ou non résolues : le reviewer live est désactivé, non qualifié et non requis pour la V1.

### Human Decision

QRY produit uniquement une cible vers le `Human Decision Envelope` existant. L’acteur, le mandat, la décision engageante et l’écriture Project restent chez l’owner humain/Project. Une préférence de navigation n’est pas une vérité scientifique.

### Scientific Interpretation

La surface prépare uniquement un handoff contractuel pour une réponse libre. Aucun provider n’est appelé et aucune interprétation scientifique n’est réalisée par QRY.

## 11. Surface produit

La zone compacte « Prochaine action » est intégrée à la surface Research Project. Le mode standard montre l’action, le statut Project, la raison, « pourquoi maintenant », l’influence, le déblocage et la conséquence du defer. Le mode expert expose les références de trace, règles, vecteur qualitatif, alternatives, impacts, VAL et limitations.

Les options non dominées sont présentées sans sélection par défaut. Les actions système ne sont pas rendues comme questions scientifiques. Les interactions QRY ne produisent que des événements de lifecycle ou des handoffs bornés.

## 12. Replay et campagne de fermeture

Deux reconstructions équivalentes produisent les mêmes source-state digest, candidate set, non-dominated set et trace digest. Les changements Project ou VAL rendent l’ancien état stale et créent une nouvelle sélection sans réécrire l’historique.

La campagne `QRY-001-CLOSURE-01` est stockée sous `validation/qry-001-closure/`. Elle est `VISIBLE_SYNTHETIC_CONTRACT_FIXTURES`, `NOT_PD011_QUALIFICATION`, sans Gold scientifique ni donnée blind. Elle couvre 22 familles A–V et les 45 gates `QRY-CLOSE-C01` à `QRY-CLOSE-C45` : 45 PASS, 0 FAIL. Le scénario à huit événements donne `DUPLICATE_QUESTION_COUNT = 0` hors trigger explicite.

## 13. Validations

| Validation | Résultat |
| --- | --- |
| QRY Parts 2–4 | 267/267 PASS |
| Corridor transverse ciblé | 1 277/1 277 PASS |
| Tests produit Partie 4 | 79/79 PASS |
| Typecheck | PASS |
| Build | PASS |
| Lint fichiers modifiés | PASS |
| `git diff --check` | PASS |
| Suite globale | 2 337 PASS, 3 FAIL, 0 SKIP, 2 340 TOTAL |

Les trois échecs globaux sont exclusivement `PRE_EXISTING_EXTERNAL_CLEANLINESS_FAILURE` : trois gardes constatent le worktree déjà modifié du checkout externe `editorial-engine`. Aucun nouvel échec n’est attribuable à QRY-001 et ce checkout n’a pas été modifié par la mission.

## 14. Frontières vérifiées

`PROVIDER_CALLS = 0` ; `PROJECT_WRITES_BY_QRY = 0` ; `VAL_WRITES = 0` ; `AUTO_HUMAN_DECISIONS = 0` ; `ARBITRARY_SCORES = 0` ; `ARBITRARY_TIE_BREAKS = 0` ; `FUZZY_SCIENTIFIC_DEDUP = 0` ; `BLIND_READS = 0` ; `PD011_PASS_CLAIMS = 0` ; `SOURCE_OF_TRUTH_INDEX_MODIFIED = 0` ; `UX001_IMPLEMENTED = NO`.

## 15. Limitation de persistance

Classification : `NAVIGATION_MEMORY_SESSION_SCOPED_PROJECT_STATE_RECONSTRUCTIBLE`.

Cette limitation est acceptable pour la V1 parce que :

- la vérité Project ne dépend pas de cette mémoire ;
- une nouvelle session reconstruit la sélection depuis les sources courantes ;
- les Human Decisions et informations adoptées restent persistées chez leurs owners ;
- les refus, defer et événements QRY ne sont pas promus en faits scientifiques ;
- la limitation est exposée dans la projection et le présent rapport.

La mémoire de navigation n’est pas durable après perte de session ou changement d’appareil. Aucun historique transverse persisté de ValidationRuns n’est ajouté. Ces deux limites devront être traitées par leurs missions propriétaires si une persistance durable devient nécessaire.

## 16. Relation à UX-001

QRY-001 détermine quoi faire ensuite. UX-001 pourra déterminer comment organiser et présenter cette navigation dans l’Adaptive Research Workspace. Aucune refonte UX, personnalisation, orchestration probabiliste ou nouvelle politique de ranking n’a été commencée.

## 17. Décision finale

`QRY001_INFORMATION_GAIN_ENGINE_CLOSED_WITH_SESSION_MEMORY_LIMITATION_READY_FOR_UX001`
