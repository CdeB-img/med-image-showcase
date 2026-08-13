# SEM-001R5C — H29 Autonomous Replay and Legacy Closure Report

## Décision

`SEM_LEGACY_CLOSURE_BLOCKED_BY_PERSISTENT_GENERIC_DEFECT`

SEM legacy n'est pas qualifié ni gelé. La configuration terminale reste une candidate non activée. Aucun Campaign Manifest qualifiant n'est créé.

## H29

| Élément | Résultat |
|---|---|
| Statut | `FAIL` |
| Configuration terminale | `SEM_LEGACY_R5E` |
| Digest | `ke1-63fa5c00c7be4ab4` |
| Constituants | 16/16 vérifiés |
| Premier étage divergent | `TURN_1_CRITIC` |
| Classe | `CRITIC_FAILURE` |
| Cause | `INVENTORY_RELATION_DIRECTION_AND_CRITIC_REPAIR_OSCILLATION` |
| Owner | `SEM_CRITIC_AND_RELATION_INTEGRITY` |
| Raison terminale | `CRITIC_MAX_CYCLES_EXHAUSTED` |

La reconstruction R5E conserve correctement la réponse tumorale comme `OUTCOME`. Elle produit aussi une Semantic Relation `OUTCOME → TIMING`, conforme à la règle générique d'ancrage temporel. L'inventaire relationnel cité inverse cependant les extrémités `TIMING → OUTCOME`.

Le critic oscille ensuite :

1. au cycle 1, il inverse la Semantic Relation pour la faire suivre l'inventaire incohérent ;
2. au cycle 2, il rétablit la direction métier `OUTCOME → TIMING`, sans corriger l'inventaire ;
3. les deux cycles sont épuisés avec la même incohérence active.

Preuves :

- reconstruction : `semantic-validation/sem-001r5e/raw-provider-responses/001-SEM-H29-reconstruction-t1-c0.json` ;
- critic cycle 1 : `semantic-validation/sem-001r5e/raw-provider-responses/002-SEM-H29-critic-t1-c1.json` ;
- critic cycle 2 : `semantic-validation/sem-001r5e/raw-provider-responses/003-SEM-H29-critic-t1-c2.json` ;
- résultat : `semantic-validation/sem-001r5e/h29-result.json`.

## Réparations génériques réalisées

| Réparation | Classe / owner | Validation | Commits |
|---|---|---|---|
| D — distinction OUTCOME / ENDPOINT | Taxonomie et prompt | PASS | `6b216d0`, `d386081` |
| E — propagation d'un rejet multi-tour | Canonicalisation et coverage | PASS | `3585ed0`, `e5bb0b6` |
| F — validation du contrat sémantique provider | Structured output / provider | PASS | `0d32338` |
| G — deux régénérations structurées bornées | Structured output / provider | PASS | `1011efe` |

Les tests synthétiques sont génériques et ne contiennent ni `caseId`, ni expression H29, ni Gold, ni valeur métier particulière.

R5D a correctement fermé une reconstruction non sourcée après une première régénération. R5E a ensuite utilisé les deux nouvelles générations autorisées. Le défaut terminal est une oscillation critic/inventaire. Ajouter une troisième heuristique violerait la limite de deux cycles successifs sur une même classe causale.

## Configuration terminale

- nom : `SEM_LEGACY_R5E` ;
- digest : `ke1-63fa5c00c7be4ab4` ;
- provider : `GOOGLE_GEMINI` ;
- modèle : `gemini-3.5-flash-lite` ;
- reconstruction prompt : `SEM-001-RECONSTRUCTION-1.5` ;
- critic prompt : `SEM-001-CRITIC-1.6` ;
- schéma : `SEM-001-1.1` ;
- modèle canonique : `1.1` ;
- Gold, corpus et seuils : inchangés ;
- statut : `PROPOSED_NOT_ACTIVATED` ;
- freeze qualifiant : non activé ;
- Campaign Manifest : non créé ;
- `pd003V2Compliance` : `NOT_CLAIMED` ;
- `pd003V2Realignment` : `REQUIRED`.

## Holdout et validations live

| Gate | Statut |
|---|---|
| H29 | FAIL |
| Holdout legacy complet | `NOT_AUTHORIZED_AFTER_H29_FAIL` |
| H10, H17, H28, H30 | `UNRESOLVED_BY_LEGACY_MODEL` préservé |
| Métriques Holdout | `NOT_COMPUTED` |
| Browser A–E LIVE_LLM | `NOT_AUTHORIZED_AFTER_H29_FAIL` |
| SEM → ST | `NOT_AUTHORIZED_AFTER_H29_FAIL` |
| SEM → IMG | `NOT_AUTHORIZED_AFTER_H29_FAIL` |
| SEM → PRJ | `NOT_AUTHORIZED_AFTER_H29_FAIL` |

## Validations techniques

| Validation | Résultat |
|---|---|
| Suite SEM | 277/277 PASS |
| Tests génériques R5D | 3/3 PASS, inclus dans la suite SEM |
| Typecheck | PASS |
| Build production | PASS, avertissements de taille de chunks et données Browserslist non bloquants |
| `git diff --check` | PASS |
| Configuration R5E | 16/16 constituants exacts |
| Tests downstream/live | non exécutés, gate H29 fermé |

## Accounting LLM et provider

| Mesure | Valeur |
|---|---:|
| Opérations sémantiques avec réponses provider | 14 |
| Générations provider HTTP 200 | 15 |
| Départs réseau sans réponse provider | 5 |
| Départs provider/réseau totaux | 20 |
| Retries transitoires | 4 |
| Appels qualifiants évités par réutilisation | 0 |
| Incidents structured output | 1 |

Le replay homogène interdit la réutilisation de résultats entre configurations : les appels évités par cache sont donc nuls. Les cinq départs réseau échoués ont été espacés de 60 secondes et n'ont produit aucune réponse LLM. Ils sont conservés comme preuve d'environnement, puis la même configuration R5D a été relancée avec accès réseau sans changement SEM.

Pour le replay terminal R5E seul : 3 opérations LLM, 3 départs provider, 0 retry et 0 incident structured output.

## Git

- baseline : `bb342ca` ;
- HEAD fonctionnel audité avant commit des preuves : `1011efe` ;
- commits fonctionnels locaux : 6 ;
- push : NO ;
- déploiement : NO ;
- historique réécrit : NO.

## Conclusion

La fermeture honnête de SEM legacy est impossible dans cette mission sans dépasser la limite gouvernée de réparations. Le moteur n'est pas déclaré qualifié, parfait, conforme PD-003 V2, multi-provider, ni prêt pour la production Protocol Designer.

Décision machine : `semantic-validation/sem-001r5e/persistent-generic-defect-decision.json`.
