# SEM-001R5B — Human Arbitration Recording + Governed Legacy Configuration Freeze

**Décision : `R5B_GOVERNED_LEGACY_CONFIGURATION_READY_FOR_H29_REPLAY`**

Date : 2026-08-13

Configuration : `SEM_LEGACY_R5B`

Digest : `ke1-f7893e6c21710ec8`

Statut : `PROPOSED_NOT_ACTIVATED`

## Portée et autorité

La mission ferme une configuration de compétence **legacy** gouvernée ; elle ne migre pas SEM vers PD-003 V2 et n'autorise ni activation ni Holdout. Les autorités ont été relues dans l'ordre prescrit. PD-003 V2 reste l'autorité métier normative courante ; la compatibilité legacy autorise la lecture et le replay historiques, mais interdit d'assimiler un PASS legacy à un PASS V2. SEM demeure `REALIGNMENT_REQUIRED` et sa conformité V2 est `NOT_CLAIMED`.

Le moteur, PD-003 V2, les seuils et les corpus textuels n'ont pas été modifiés. Seules les quatre corrections Gold autorisées ont été appliquées. Le SOURCE-OF-TRUTH-INDEX n'est pas modifié : ce candidat non activé et son rapport constituent des preuves de campagne, pas une nouvelle autorité documentaire.

## Arbitrages enregistrés

| Cas | Décision | Effet gouverné |
|---|---|---|
| H10 | `LEGACY_MAPPING_UNRESOLVED` | Aucun changement ; nouveau mapping V2 requis. |
| H12 | `CHANGE_GOLD` | `PREDICTS_CANDIDATE` devient `RELATED_TO_CANDIDATE`. |
| H17 | `LEGACY_MAPPING_UNRESOLVED` | Aucun changement ; nouveau mapping V2 requis. |
| H22 | `CHANGE_GOLD` | Récidive reste `CONDITION` ; `vs` devient `COMPARES_WITH`. |
| H25 | `CHANGE_GOLD` | Agent injecté `INTERVENTION` ; inflammation et vascularisation `PHENOMENON`. |
| H28 | `PD003_V2_REALIGNMENT_REQUIRED` | Dette enregistrée ; aucune mutation normative. |
| H30 | `CHANGE_GOLD_RELATION` + dette legacy | Retrait de `AIMS_TO_MODIFY` ; ambiguïté ENDPOINT/OUTCOME conservée. |

Arbitrages : **7/7**. Gold modifiés : **H12, H22, H25, H30 uniquement**. Le digest Gold Holdout passe de `ke1-471d78570da30acb` à `ke1-9208b3d2f1d0698e`. Les assertions avant/après, sources, décisions, justifications et digests par cas sont consignés dans `semantic-validation/sem-001r5b/human-arbitrations-and-gold-changes.json`.

Les mappings legacy non résolus sont **H10, H17, H28 et H30**. Ils ne sont ni corrigés artificiellement ni présentés comme conformes à PD-003 V2.

## Configuration et checkpoints

`SEM_LEGACY_R5B` fige les Repairs A/B/C PASS, prompts, schémas, coverage/integrity, canonicalizer, evaluator, routing, Gold post-arbitrage, seuils, provider/modèle, corpus Development/Holdout et décisions humaines. Le digest a été recalculé sur ce matériau complet.

| Disposition | Nombre |
|---|---:|
| `REUSE_COMPATIBLE` | 0 |
| `DETERMINISTIC_RECOMPUTE` | 0 |
| `LLM_REQUIRED` | 56 |
| `INVALID` | 0 |
| `UNRESOLVED_BY_LEGACY_MODEL` | 4 |

Le premier étage invalidé des 56 cas exécutables est `RECONSTRUCTION_CONFIGURATION_DIGEST` : les résultats R5/R5A restent des preuves historiques, mais ne peuvent pas être promus dans R5B. Pour H10, H17, H28 et H30, l'arrêt précède l'exécution à `NORMATIVE_MAPPING_BEFORE_EXECUTION`. La classification exhaustive des 60 cas est enregistrée dans `semantic-validation/sem-001r5b/checkpoint-classification.json`.

## H29 et fermeture

H29 est **`READY_FOR_MINIMAL_REPLAY_NOT_EXECUTED`**. Son replay devra reconstruire une chaîne homogène R5B dès le premier tour : 4 opérations LLM minimales, 6 maximales selon les cycles critic, avec 30 départs provider au maximum en incluant les retries. Aucun checkpoint résultat R5/R5A ne sera mélangé à cette chaîne. Le plan détaillé est dans `semantic-validation/sem-001r5b/h29-minimal-replay-plan.json`.

Pendant R5B : **0 appel LLM**, **0 appel évité par réutilisation compatible**, **0 retry**, Holdout **`NOT_STARTED`**. La création de `semantic-validation/sem-001r5b/legacy-qualification-freeze-candidate.json` n'active pas le freeze et n'autorise aucun Holdout.

## Validation

Les quatre artefacts JSON sont valides. Le recalcul confirme le digest `ke1-f7893e6c21710ec8`, 60 classifications uniques et les quatre mutations R5B exclusivement. L'écart H07 avec son ancien checkpoint est l'arbitrage R4B autorisé déjà hérité, pas une mutation R5B. Les tests ciblés passent **20/20**, la suite SEM **270/270**, le typecheck et `git diff --check` passent. Aucun browser, flux aval live, appel provider, commit, push ou déploiement n'a été réalisé.
