# SEM-001R3 — Semantic Reconstruction Competence Repair Report

**Décision :** `SCIENTIFIC_SEMANTIC_RECONSTRUCTION_NOT_READY`
**Date :** 2026-08-11
**Dépôt :** `noxia-dev`
**Branche observée :** `sem-001r-closure`
**Commit observé :** `d3de7ad603031acb8703cded7e5f00c24719be37`
**Modèle live :** `gemini-3.5-flash-lite`
**Schéma SEM :** `SEM-001-1.1`

## 1. Décision

SEM-001R3 n'est pas qualifié. La campagne Development courante a été interrompue par la limite provider `generate_content_free_tier_requests = 500` à 13/30 cas complets. Les métriques Development n'ont donc pas été calculées, la configuration n'a pas été gelée, aucune campagne holdout R3 n'a été créée et les gates navigateur/aval sont restées fermées.

Cette décision ne transforme pas la limite provider en défaut sémantique. Elle constate uniquement que les preuves obligatoires de fermeture ne sont pas disponibles.

## 2. Baseline

SEM-001R2 reste la dernière campagne holdout complète. Elle avait produit 30/30 holdouts mais échouait avec : Critical Semantic Recall 0,5089 ; Explicit Object Recall 0,5489 ; Explicit Relation Recall 0,3833 ; Comparator Preservation 0,3333 ; Intervention Preservation 0,7500 ; Modality Preservation 1,0000 ; Critical Unsupported Inference Rate 0,0667 ; 73 bloqueurs absolus.

R3 n'écrase aucun artefact R2 et ne réinterprète pas sa décision `NOT_READY`.

## 3. Résultats SEM-001R2

Le diagnostic de départ est confirmé comme quatre classes génériques : taxonomie instable, relations directes insuffisantes, critic sans effet et faux positifs de négation dans l'évaluateur. Aucun Gold Frame R2 n'a été modifié.

## 4. Diagnostic

Le travail R3 a porté uniquement sur les propriétaires génériques démontrés : prompt de reconstruction, schéma, couverture déterministe, critic/réparations, canonicalisation et évaluateur. Les itérations Development ont également révélé des faux rejets génériques de la garde : connecteurs pris pour des objets, relations temporelles inverses, biomarqueur assimilé à un outil, ellipses coordonnées, supersession multi-tour et objectifs composites.

## 5. Taxonomie

Le prompt définit opérationnellement les types utilisés avec distinction entre nature, exclusions, confusions et rôle relationnel. Les règles couvrent notamment SCIENTIFIC_OBJECT, PHENOMENON, BIOMARKER, MODALITY, METHOD, INTERVENTION, COMPARATOR, ENDPOINT, OUTCOME, POPULATION, CONDITION, TIMING et CONSTRAINT.

La règle MODALITY/METHOD, la priorité des variables quantitatives, les objectifs méthodologiques et les rôles de comparaison sont vérifiés par une `SemanticTaxonomyReport` déterministe. Il ne s'agit pas d'une encyclopédie ni d'un mapping lexical par cas.

## 6. Semantic Inventory

La reconstruction impose deux phases dans un seul structured output : inventaire exhaustif des fragments et relations explicites, puis classification scientifique. Chaque fragment porte sa provenance, son rôle local, sa polarité, ses modificateurs et ses liens d'inventaire.

Les fragments composites peuvent être représentés par plusieurs éléments constituants lorsqu'ils sont déjà conservés par le graphe ; aucun faux wrapper n'est exigé.

## 7. Séparation type / rôle

Le modèle 1.1 sépare `type` et `studyRole`. Un objet INTERVENTION peut ainsi jouer `INTERVENTION_ARM` ou `COMPARATOR_ARM` sans mutation de sa nature ontologique. Les rôles disponibles restent bornés au contrat SEM et ne modifient pas PD-003.

## 8. Explicit Coverage

`ExplicitCoverageReport` vérifie chaque fragment inventorié. Un fragment est mappé par un ou plusieurs Semantic Elements, par une relation directe lorsqu'il s'agit d'un connecteur, par les constituants d'un fragment composite, ou demeure explicitement non résolu. La garde n'invente aucun type manquant.

Les ellipses restent ancrées sur le fragment exact de l'inventaire. Une expansion canonique non contiguë ne devient pas une fausse citation source.

## 9. Relation Coverage

`RelationCoverageReport` vérifie les endpoints, la direction et le caractère direct des relations. Il reconnaît les formulations inverses fidèles de mesure et de temporalité, refuse les arêtes auto-comparatives et exige les relations scientifiques directes lorsque des spokes d'intention masquent les endpoints.

Une relation d'un endpoint explicitement négaté puis supersédé n'est pas maintenue comme relation affirmée active, car cela annulerait la correction utilisateur.

## 10. Comparaisons

Les comparaisons conservent les deux objets et une relation directe. Les agrégats de scanners/sites/lecteurs sont représentés comme contexte de comparaison, non comme objet qui se compare à lui-même. Les actions comparatives peuvent être couvertes par la relation directe entre leurs bras.

## 11. Critic V2

`SEM-001-CRITIC-1.2` reçoit messages, inventaire, modèle typé, rapports de couverture, rapport taxonomique, ambiguïtés et inférences. Il produit exactement les 14 contrôles requis, un verdict, des issues et des réparations proposées.

ACCEPT est rejeté par le code si la couverture explicite, relationnelle ou taxonomique est incomplète.

## 12. Critic Repair

Le critic ne mute pas directement le modèle. Chaque réparation traverse validation de schéma, vérification de provenance, application bornée et nouvelle canonicalisation. Deux cycles au maximum sont autorisés.

Après une seconde réparation, une acceptation n'est possible que pour des défauts couverts par les gardes déterministes, si toutes les réparations sont acceptées, si le candidat a matériellement changé et si les trois rapports deviennent complets. Une réparation identique sans progrès reste un échec.

## 13. Polarité / négation

Éléments, relations et inventaire portent `AFFIRMED`, `NEGATED`, `UNCERTAIN` ou `CONDITIONAL`. Une contrainte négative n'est plus comptée comme inférence affirmée interdite. Une correction multi-tour conserve l'ancien sens comme négaté/supersédé et le nouveau sens comme actif.

## 14. Évaluateur

L'évaluateur 1.2 utilise type canonique, sens normalisé, relations, rôle et polarité. Il reconnaît les équivalences directionnelles bornées et la composition d'intentions longitudinales sans rechercher les concepts interdits dans toute la sérialisation brute.

Les seuils historiques n'ont pas été modifiés et l'évaluateur n'a pas été rendu permissif sur les types incompatibles.

## 15. Routing

Le routing reste dérivé du modèle complet : DESIGN_STUDY pour les variables de conception, FORMALIZE_IDEA pour une relation à cadrer, UNDERSTAND pour l'exploration, DOCUMENT uniquement pour une demande documentaire et REVIEW_REROUTE pour une contradiction exigeant revue. Aucune formulation Development ou holdout n'est codée dans le routeur.

## 16. Development Campaign

Run courant : `sem-001r3-development-2026-08-11T10-52-30-106Z`.

| Champ | Résultat |
|---|---:|
| Cas complets | 13/30 |
| Départs enregistrés | 38 |
| Concurrence | 1 |
| Plafond applicatif | 5 RPM |
| Retry enregistré | 1 |
| HTTP 429 terminal | 1 |
| Métriques calculées | Non |

Une première exécution puis une reprise bornée ont rencontré la même limite `RESOURCE_EXHAUSTED` sur D14. La reprise a conservé les 13 cas complets et n'a pas mélangé de configuration.

## 17. Freeze de configuration

Statut : `NOT_PERFORMED`.

Le gel est conditionné à une Development campaign complète. Aucun `campaign-manifest.json` R3 n'a été créé. Les versions courantes sont reconstruction 1.2, critic 1.2, schéma 1.1, modèle canonique 1.1 et évaluateur 1.2, mais elles ne constituent pas un freeze qualifiant.

Les digests historiques protégés sont restés inchangés : holdout `ke1-08392b87b2cc140b`, Gold Frames `ke1-34ef12e65473a7f2`, fichier de validation `ke1-ad6dfe2f629e2343`.

## 18. Holdout Campaign

Statut : `NOT_STARTED`.

Le protocole exige 30/30 Development avant l'ouverture unique des 30 HOLDOUT_CASES. Cette condition n'est pas satisfaite. Aucun résultat, métrique ou manifeste holdout R3 n'est revendiqué.

## 19. Métriques

Statut : `NOT_CALCULATED`.

Le calcul sur 13/30 aurait violé la règle 30/30. Aucun score R3 n'est publié, aucun seuil n'est déclaré PASS et aucun bloqueur sémantique n'est déduit des cas non exécutés.

## 20. Comparaison R2 → R3

La comparaison quantitative est impossible sans campagne R3 complète. Les tests et les passages Development observés démontrent le fonctionnement des mécanismes génériques, mais ne remplacent ni les métriques 30/30 ni la preuve holdout.

## 21. Impact du critic

Le critic a désormais détecté et réparé des pertes de type, rôle, fragment et relation pendant les itérations Development. Il n'est plus structurellement limité à 30/30 ACCEPT avec zéro issue. La valeur agrégée avant/après n'est toutefois pas publiée : elle exige le corpus Development complet.

## 22. Erreurs résiduelles

Le bloqueur actif est externe et documentairement précis : `PROVIDER_CAPACITY_FAILURE`, HTTP 429, `RESOURCE_EXHAUSTED`, métrique `generate_content_free_tier_requests`, limite 500, modèle Flash-Lite. La même condition persiste après le délai de reprise annoncé.

Il reste par conséquent impossible de conclure sur les erreurs sémantiques résiduelles des 17 cas Development non complétés et des 30 holdouts non exécutés.

## 23. Invariants IMG

Statut post-R3 : `BLOCKED_NOT_EXECUTED`.

Les invariants IMG ne sont pas franchis comme gate R3, car la campagne centrale n'est pas complète. Les tests unitaires de non-régression restent exécutables séparément mais ne constituent pas l'artefact live exigé après qualification.

## 24. Navigateur live

Statut : `BLOCKED_NOT_EXECUTED`.

Les scénarios A–E ne peuvent être rejoués avant réussite des seuils centraux et absence de bloqueur absolu.

## 25. ST live

Statut : `BLOCKED_NOT_EXECUTED`.

Aucun Semantic Model R3 qualifié n'a été transmis en live à ST.

## 26. IMG live

Statut : `BLOCKED_NOT_EXECUTED`.

Aucun Semantic Model R3 qualifié n'a été transmis en live à IMG.

## 27. PRJ live

Statut : `BLOCKED_NOT_EXECUTED`.

Aucun Semantic Model R3 qualifié n'a été transmis en live à PRJ et aucune acceptation humaine n'a été simulée.

## 28. Non-régressions

Les tests SEM locaux couvrent les contrats historiques, corrections, provider, cas obligatoires, avals, UI, robustesse linguistique et 35 contrats R3 génériques.

| Validation | Résultat |
|---|---:|
| SEM | 113/113 PASS |
| IMG | 60/60 PASS |
| PRJ | 56/56 PASS |
| SYS | 34/34 PASS |
| TMP | 18/18 PASS |
| P-WEB-04R UI | 42/42 PASS |
| Typecheck | PASS |
| Lint | PASS, 7 warnings Fast Refresh préexistants |
| Build | PASS, warnings bundle/Browserslist non bloquants |
| `git diff --check` | PASS |
| Suite globale | 1146/1149 PASS |

Les trois seuls échecs globaux vérifient la propreté du dépôt externe `editorial-engine` depuis P3M-Web, P4 et P5. Ce dépôt était déjà sale et n'a pas été modifié par SEM-001R3. Ils restent isolés conformément au protocole.

## 29. Limitations

- Development R3 incomplet : 13/30.
- Quota provider journalier épuisé pendant la passe complète.
- Aucun freeze, holdout, métrique centrale R3, navigateur live ou diagnostic aval live.
- Le résultat `NOT_READY` ne démontre ni l'échec ni la réussite des seuils sémantiques R3 ; il démontre l'absence de preuve qualifiante complète.

## 30. Fichiers modifiés

Le périmètre R3 comprend le prompt SEM, les contrats/types/schémas, la couverture et les réparations, le provider, la canonicalisation, l'évaluateur, le serveur, les tests SEM, le runner de campagne, les scripts npm, les artefacts `semantic-validation/sem-001r3/` et le présent rapport. Les fixtures Gold restent inchangées.

Aucun code ST, IMG, PRJ, Knowledge, External Evidence, SYS, TMP, DOC, REG ou Editorial Engine n'a été modifié pour obtenir un score SEM.

## 31. Décision finale

`SCIENTIFIC_SEMANTIC_RECONSTRUCTION_NOT_READY`

Conditions minimales de reprise : disponibilité restaurée du quota `gemini-3.5-flash-lite`, reprise de la même Development campaign jusqu'à 30/30, calcul des métriques Development, gel des digests, puis une unique campagne holdout 30/30. Toute modification produit post-holdout invalidera la campagne et exigera un nouvel identifiant.

Aucun commit, push ou déploiement n'a été effectué.

## 32. Addendum de continuation Development — 2026-08-12

Les sections 16 à 31 consignent l'état observé lors de l'arrêt provider du 11 août 2026. Elles ne sont pas réécrites rétroactivement. Le présent addendum enregistre la reprise stricte de la même campagne `sem-001r3-development-2026-08-11T10-52-30-106Z`, sa clôture Development à 30/30 et la décision de ne pas ouvrir le holdout.

La tentative précédente s'était arrêtée sur D14 avec `PROVIDER_CAPACITY_FAILURE`, HTTP 429, `RESOURCE_EXHAUSTED`. Avant la reprise, 13 cas étaient `COMPLETE`. Leur configuration LLM n'a pas été modifiée et aucun de ces 13 cas n'a été rappelé au provider.

## 33. Réconciliation de `coverage.ts`

Le fichier `src/features/scientific-semantic-reconstruction/coverage.ts` est non suivi dans le worktree courant : aucune version Git historique de cette création n'existe. La version pré-lint a néanmoins été reconstruite exactement à partir des sorties de validation persistées.

| Élément | Avant checkpoint | État courant |
|---|---|---|
| Expression | `/^[A-Za-zÀ-ÖØ-öø-ÿ]\\d(?:[A-Za-zÀ-ÖØ-öø-ÿ0-9*+\\-]*)$/u` | `/^[A-Za-zÀ-ÖØ-öø-ÿ]\\d(?:[A-Za-zÀ-ÖØ-öø-ÿ0-9*+-]*)$/u` |
| Digest coverage/repair | `ke1-01579ca67586df12` | `ke1-38e38b3ef0d37d0a` |
| Nature du changement | échappement littéral du tiret | suppression lint de l'échappement final inutile |

Le tiret placé en dernière position d'une classe de caractères JavaScript est littéral avec ou sans échappement. La preuve exhaustive a couvert 1 112 064 valeurs scalaires Unicode et 6 672 397 comparaisons de chaînes : zéro divergence.

Le replay local D01–D13 a ensuite comparé ancienne et nouvelle implémentation sans appel LLM. Les 13 cas sur 13 sont fonctionnellement identiques pour la couverture explicite, la couverture relationnelle, les réparations, le modèle canonique fonctionnel, les entrées et sorties de l'évaluateur, les métriques unitaires et les bloqueurs. La seule différence de replay est l'identifiant technique `semanticModelId`, exclu du digest fonctionnel.

Diagnostic : `NON_SEMANTIC_EQUIVALENT_CHANGE`.

Disposition : `NON_SEMANTIC_DIGEST_DRIFT_ACCEPTED`.

## 34. Disposition des checkpoints et dépendances

Le premier étage physiquement modifié était STAGE 4, mais aucun étage n'était fonctionnellement impacté. D01–D13 ont donc été conservés `COMPLETE` : 13 résultats réutilisés, 13 réévaluations déterministes pour preuve et zéro appel LLM.

La reprise a sélectionné D14–D30 uniquement. D18 a produit une première reconstruction dont l'inventaire isolait le mot fonctionnel « pour » comme fragment explicite. Le contrat de réparation borné du critic ne peut pas muter `semanticInventory`; après deux cycles, l'artefact reconstruction n'était donc pas compatible avec une continuation aval. Cette tentative est conservée dans `semantic-validation/sem-001r3/history/development-2026-08-12T09-58-02-394Z/SEM-D18-failed-stage-snapshot.json`. D18 seul a été repris à STAGE 1, sans rappel d'un autre cas et sans modification du produit, du prompt, du schéma, du critic, des fixtures ou des seuils.

## 35. Budget provider et consommation

Le plan pré-appel comptait 17 cas incomplets, 18 tours, 36 appels minimum, 45 appels de base attendus, 108 appels logiques maximaux attendus, 324 départs de réserve retry, soit 432 départs bornés et 482 avec marge. Cette borne restait sous la limite configurée de 500 requêtes quotidiennes. Le quota restant exact n'était pas exposé par l'API ; le runner est resté fail-closed sur toute erreur de capacité.

| Mesure | Valeur |
|---|---:|
| Départs génération avant reprise | 33 |
| Nouveaux appels reconstruction | 19 |
| Nouveaux appels critic | 29 |
| Nouveaux retries | 0 |
| Nouveaux départs génération | 48 |
| Départs génération de campagne après reprise | 81 |
| HTTP 429 pendant cette reprise | 0 |
| Appels navigateur | 0 |
| Appels holdout | 0 |

Le compteur de campagne conserve un retry historique antérieur à cette mission. Aucun nouveau retry n'a été consommé pendant la reprise du 12 août.

## 36. État final Development

| Champ | Résultat |
|---|---:|
| Cas complets | 30/30 |
| Métriques | `CALCULATED_ON_30_OF_30` |
| Critic accepté | 30/30 |
| Bloqueurs absolus | 12 |
| Seuils de référence | FAIL |
| Gate sémantique | Fermée |
| Holdout | Non ouvert |

Le statut `COMPLETE` d'un cas signifie que la chaîne reconstruction–critic–canonicalisation–évaluation possède tous ses artefacts. Il ne signifie pas que le résultat satisfait le Gold Frame. Les 12 bloqueurs sont issus de l'évaluation indépendante des 30 résultats complets.

## 37. Métriques Development

### 37.1 Repères de gate historiques

| Métrique | Numérateur | Dénominateur | Score | Repère | État | Cas en erreur |
|---|---:|---:|---:|---:|---|---|
| Critical Semantic Recall | 27,8667 | 30 | 0,9289 | ≥ 0,98 | FAIL | D16, D19, D21, D23, D28 |
| Explicit Object Recall | 27,3333 | 30 | 0,9111 | ≥ 0,98 | FAIL | D16, D19, D21, D23, D28 |
| Explicit Relation Recall | 29 | 30 | 0,9667 | ≥ 0,95 | PASS | D21 |
| Comparator Preservation | 7 | 7 | 1,0000 | 1,00 | PASS | — |
| Intervention Preservation | 5 | 6 | 0,8333 | 1,00 | FAIL | D16 |
| Modality Preservation | 9 | 9 | 1,0000 | 1,00 | PASS | — |
| Critical Unsupported Inference Rate | 3 | 30 | 0,1000 | 0 | FAIL | D02, D16 |
| Generic-Domain Collapse Rate | 0 | 30 | 0 | 0 | PASS | — |
| Correction Propagation Rate | 1 | 1 | 1,0000 | 1,00 | PASS | — |
| Multi-turn Critical Context Loss | 0 | 1 | 0 | 0 | PASS | — |

Les numérateurs fractionnaires des recalls sont les sommes des scores unitaires par cas, conformément à l'évaluateur 1.2.

### 37.2 Métriques complémentaires

| Métrique | Numérateur | Dénominateur | Score | Cas en erreur |
|---|---:|---:|---:|---|
| Semantic Drift Rate | 0,4722 | 30 | 0,0157 | D02, D16 |
| Unsupported Inference Rate | 0 | 30 | 0 | — |
| Ellipsis Detection Rate | 29 | 30 | 0,9667 | D01 |
| Ambiguity Preservation Rate | 19,8333 | 30 | 0,6611 | D01, D04, D05, D07, D08, D09, D11, D23, D25, D26, D30 |
| Unnecessary Clarification Rate | 0 | 30 | 0 | — |
| Route Correctness | 25 | 30 | 0,8333 | D14, D20, D23, D27, D28 |
| Multi-turn Context Preservation | 1 | 1 | 1,0000 | — |

Ces résultats Development sont des repères techniques. Ils ne constituent ni un PASS PD-011, ni une qualification holdout, ni une fermeture SEM.

## 38. Impact du critic

| Mesure | Résultat |
|---|---:|
| Before Critic Object Recall | 0,7913 |
| After Critic Object Recall | 0,9111 |
| Before Critic Relation Recall | 0,9333 |
| After Critic Relation Recall | 0,9667 |
| Issues détectées | 17 |
| Réparations proposées | 21 |
| Réparations acceptées | 21 |
| Réparations rejetées | 0 |
| Nouvelles inférences non soutenues | 0 |
| False Positive Critic Rate | 0,1000 |
| Critic Acceptance Rate | 1,0000 |

Le critic améliore les recalls moyens et est fonctionnel sur 30/30. Son acceptation n'élimine toutefois pas les pertes détectées ensuite par les Gold Frames indépendants.

## 39. Erreurs restantes

Six cas portent les 12 bloqueurs absolus : D02, D16, D19, D21, D23 et D28.

| Classe | Nombre | Preuves principales |
|---|---:|---|
| `TAXONOMY_FAILURE` | 8 | objets explicites mal typés ou absents sur D16, D19, D21, D23, D28 |
| `MODEL_REASONING_FAILURE` | 3 | inférences interdites sur D02 et D16 |
| `RELATION_COVERAGE_FAILURE` | 1 | relation 1,5T → 3T perdue sur D21 |

Les rapports runtime de couverture d'inventaire sont complets sur 30/30, mais l'Explicit Object Recall indépendant échoue sur cinq cas. Cette divergence n'est pas résolue silencieusement : couvrir l'inventaire produit par le provider ne prouve pas que cet inventaire a lui-même capturé tous les objets du Gold Frame.

Conformément à la mission, aucune modification produit n'est effectuée après observation de ces métriques.

## 40. Économie des appels LLM

| Stage | Cases | Appels potentiels sans réutilisation | Appels LLM réels | Appels évités | Raison |
|---|---:|---:|---:|---:|---|
| Existing COMPLETE | D01–D13 | 33 | 0 | 33 | checkpoints LLM compatibles réutilisés |
| Deterministic reevaluation | D01–D13 | 0 | 0 | 0 | replay local coverage/canonical/evaluator |
| Incomplete reconstruction | D14–D30, reprise D18 incluse | 19 | 19 | 0 | artefact provider absent ou D18 incompatible |
| Incomplete critic | D14–D30, reprise D18 incluse | 29 | 29 | 0 | audit/repair LLM requis |
| Retry | — | conditionnel | 0 | 0 | aucun nouveau retry nécessaire |
| Browser | — | hors périmètre | 0 | 0 | gate interdite |
| Holdout | 30 | hors périmètre | 0 | 0 | non ouvert avant décision humaine |
| **Total Development comparable** | **30** | **81** | **48** | **33** | **CALL_LLM_ONLY_IF_REQUIRED** |

`totalLLMCallsAvoided = 33`. Les appels de découverte du catalogue de modèles ne sont pas des appels de génération sémantique et ne sont pas inclus.

## 41. Checkpoints immuables par stage

Les 30 cas disposent chacun de six artefacts séparés : reconstruction, critic, canonicalisation, couverture, évaluation et métriques. Le manifeste `semantic-validation/sem-001r3/stage-checkpoint-manifest.json` compte 180 artefacts `COMPLETE`.

Chaque artefact contient `caseId`, `inputDigest`, `stageVersion`, `dependencyDigests`, `schemaVersion`, `createdAt`, `status` et, lorsque applicable, provider, modèle et version de prompt. Les 30 chaînes de dépendance reconstruction → critic → canonicalisation → évaluation → métriques ont été vérifiées. Le digest de couverture courant est `ke1-38e38b3ef0d37d0a`.

## 42. Validations de continuation

| Validation | Résultat |
|---|---:|
| Suite SEM unifiée — SEM-001 / SEM-001R / SEM-001R2 / SEM-001R3 | 113/113 PASS |
| Coverage / evaluator / critic / provider / rate limiter | Inclus dans les 113 tests — PASS |
| Replay d'équivalence D01–D13 | 13/13 identiques — PASS |
| Cache/checkpoints par stage | 180/180 artefacts — PASS |
| Chaînes de dépendance | 30/30 — PASS |
| Checkpoints COMPLETE non rappelés | 13/13 — PASS |
| Development | 30/30 COMPLETE |
| Métriques Development | Calculées sur 30/30 |
| Holdout non ouvert | PASS |
| `git diff --check` | PASS |
| Typecheck / lint / build | Non relancés : aucun code runner ou produit modifié pendant cette continuation |

Les scénarios navigateur A–E et les diagnostics live ST/IMG/PRJ n'ont pas été lancés, conformément à la gate.

## 43. Recommandation avant Holdout

Recommandation factuelle : `R3_DEVELOPMENT_REQUIRES_FURTHER_REPAIR`.

Motif : Development est complet et le critic est fonctionnel, mais Critical Semantic Recall, Explicit Object Recall, Intervention Preservation et Critical Unsupported Inference Rate manquent les repères historiques ; 12 bloqueurs absolus restent actifs. Dépenser le budget holdout dans cet état ne serait pas justifié.

Cette recommandation n'est ni une décision scientifique PD-011, ni une fermeture SEM, ni une autorisation de publication.

Décision de cette passe : `SEM001R3_DEVELOPMENT_REQUIRES_FURTHER_REPAIR`.

Aucun commit, push ou déploiement n'a été effectué.
