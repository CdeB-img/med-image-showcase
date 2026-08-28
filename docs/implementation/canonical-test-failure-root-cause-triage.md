# NOXIA — Canonical Test Failure Root-Cause Triage

> Classification : `LEVEL_3_IMPLEMENTATION_EVIDENCE`
>
> `NORMATIVE_AUTHORITY = NONE`
>
> Date de l'observation : 2026-08-28
>
> Mission : forensic technique read-only ; aucune réparation appliquée.

## Decision

La reproduction canonique retrouve exactement les 25 tests rouges dans 20 fichiers signalés par l'audit antérieur. Les 25 échecs sont attribués, sans inconnu résiduel, à neuf causes racines techniques.

Aucun de ces échecs ne démontre un `CURRENT_CODE_REGRESSION` :

- 11 échecs dérivent d'une fixture Imaging historique devenue incompatible avec la conservation fail-closed d'une contradiction Knowledge ;
- 3 dépendent uniquement de l'état sale du repository sibling Editorial Engine ;
- 3 portent encore les attentes antérieures à l'évolution intentionnelle de l'applicabilité Knowledge ;
- 2 proviennent de tests historiques non suivis, localement exclus de Git mais toujours découverts par Vitest ;
- 2 figent d'anciennes versions runtime légitimement incrémentées ;
- 1 compare une preuve ST 1.2.1 historique aux chemins mutables du runtime ST 1.2.2 ;
- 1 utilise un matcher Imaging trop large qui confond référence de dépendance et séquence créée ;
- 1 fige un ancien libellé de présentation devenu intent-aware ;
- 1 exige l'ancien sous-type ST `NULL_OR_COMPETING` alors que les alternatives explicites sont désormais matérialisées comme `ALTERNATIVE`.

Cette conclusion ne constitue ni un PASS scientifique, ni une autorisation de mettre à jour les attentes en masse. Elle identifie seulement les causes techniques actuelles.

```text
TOTAL_FAILURES_OBSERVED = 25
TOTAL_FAILURES_CLASSIFIED = 25
TOTAL_FAILURES_ASSIGNED_TO_ROOT_CAUSE = 25
UNKNOWN_FAILURES = 0

CURRENT_CODE_REGRESSION = 0
P0 = 0
```

## Git baseline

État vérifié avant la reproduction :

```text
branch = protocol-designer-canonical-ingestion
HEAD = 933646daa23e9aa73964e94e3f5bb9a2160d96be
origin/main = f504d8fc658ebdf17757e589f610e8f56c24e335
tracked diff = clean
git status --short = empty
```

Avance locale conservée, non poussée :

```text
b07c3e3edcd62f5e7924261e5172fffd87677bb4 docs(protocol-designer): preserve product checkpoint forensic reports
933646daa23e9aa73964e94e3f5bb9a2160d96be docs(infra): preserve technical debt false-green audit
```

Les 53 artefacts historiques sont restés physiquement présents et masqués par les règles locales exactes de `.git/info/exclude`. Ce fichier n'a pas été modifié ; son SHA-256 observé avant mission est `dd6dc883aead48d57c54852babd79010e9476dae8f3a1654a4dabf40201f5da3`.

Autorités lues dans l'ordre prescrit : Source-of-Truth Index courant, Charte fondatrice, Scientific Product Manifesto V2, Editorial Engine Architecture Manifesto. Les sections réellement nécessaires de KE-001, RDE-001, RDE-002 et RDE-003 ont ensuite été consultées. Les rapports antérieurs sont utilisés exclusivement comme preuves Level 3.

## Test reproduction

Une seule exécution de la suite canonique a été réalisée :

```text
command = npm test -- --reporter=json --outputFile=/tmp/noxia-canonical-test-triage.json
exit = 1

test files = 20 failed / 166 passed / 2 skipped / 188 total
tests = 25 failed / 3247 passed / 12 skipped / 3284 total
```

Le total est identique à l'audit d'entrée. Deux exécutions focalisées de tests existants ont uniquement complété les valeurs tronquées du reporter :

```text
IMG mandatory = 2 failed / 8 passed / 10 total
PROJECT-SPINE-03 selected gate = 1 failed / 2 skipped / 3 discovered
```

Un readback local déterministe a confirmé que le cas no-reflow produit une modalité IRM candidate sans biomarqueur ni acquisition, avec `RETURN_TO_SCIENTIFIC_THINKING`. Aucune suite globale n'a été rejouée, aucun provider n'a été activé et aucune recherche externe n'a été lancée.

## Failure inventory

| FAILURE_ID | TEST_FILE | TEST_NAME | ERROR_TYPE | STACK_OR_FIRST_RELEVANT_LOCATION |
|---|---|---|---|---|
| F01 | `src/knowledge-graph/scientific-knowledge-graph-web.test.mjs` | `P3M-Web deterministic migration 80. leaves editorial-engine clean` | `AssertionError` | ligne 514 |
| F02 | `src/knowledge-graph/scientific-corpus/scientific-corpus.test.mjs` | `P4 real sourced ECV/T1 scientific corpus 66 — leaves editorial-engine unchanged` | `AssertionError` | ligne 224 |
| F03 | `src/knowledge-graph/scientific-multidomain/scientific-multidomain.test.mjs` | `P5 scientific multidomain wave leaves editorial-engine unchanged` | `AssertionError` | ligne 108 |
| F04 | `src/features/document-projection/__tests__/doc-001b-study-template-integration.test.ts` | `19 / cas B — structure les blocs Imaging depuis TMP` | `Error` | fixture PRJ ligne 110, test ligne 224 |
| F05 | même fichier | `20 / cas C — garde l'Imaging incomplet partiel sans protocole inventé` | `Error` | fixture PRJ ligne 110, test ligne 233 |
| F06 | `src/features/document-projection/__tests__/projection-engine.test.ts` | `projette la contribution Imaging complète sans fabriquer de protocole d'acquisition` | `Error` | fixture PRJ ligne 110, test ligne 26 |
| F07 | `src/features/knowledge-engine/__tests__/eng-002-product-cases.test.ts` | `14 — conserve un provider présent mais exclut ses assertions au contexte incompatible` | `AssertionError` | ligne 56 |
| F08 | `src/features/knowledge-engine/__tests__/eng-003-external-search.test.ts` | `2 — no-reflow après stenting conserve le terme spécifique` | `TypeError` | ligne 275 |
| F09 | `src/features/imaging-study-designer/__tests__/img-001b-project-handoff.test.ts` | `autorise un handoff de projet IRM avec équipement inconnu...` | `AssertionError` | ligne 33 |
| F10 | même fichier | `autorise un multicentrique partiellement connu...` | `AssertionError` | ligne 85 |
| F11 | même fichier | `refuse les paramètres exacts tout en permettant le handoff...` | `AssertionError` | ligne 95 |
| F12 | même fichier | `préserve la version gelée et impose une requalification...` | `AssertionError` | ligne 115 |
| F13 | `src/features/imaging-study-designer/__tests__/mandatory-cases.test.ts` | `CAS 1 — Fabry/fibrose part du phénomène et ne crée aucune séquence` | `AssertionError` | ligne 12 |
| F14 | même fichier | `CAS 3 — no-reflow après reperfusion/stenting reste spécifique...` | `AssertionError` | ligne 26 |
| F15 | `src/features/research-project-construction/__tests__/mandatory-cases.test.ts` | `1. construit un candidat Fabry longitudinal avec handoff IMG gelé...` | `Error` | fixture PRJ ligne 110, test ligne 7 |
| F16 | `src/features/research-project-construction/__tests__/project-spine-03-native-owner-invocation.test.ts` | `REAL RUNTIME GATE — I01–I16...` | `AssertionError` | ligne 196 |
| F17 | `src/features/system-integration/__tests__/contracts.test.ts` | `expose des versions explicites pour chaque contribution aval` | `AssertionError` | ligne 15 |
| F18 | `src/features/system-integration/__tests__/human-decisions.test.ts` | `transporte dans DOC les champs disponibles de la décision Project...` | `AssertionError` | ligne 24 |
| F19 | `src/features/system-integration/__tests__/unknowns.test.ts` | `CAS E — UNKNOWN reste distinct de NOT_APPLICABLE, INCOMPATIBLE et READY` | `AssertionError` | ligne 12 |
| F20 | `src/features/protocol-designer/conversation/__tests__/conv-ux-v2-part1.test.tsx` | `COLCHICINE-E2E closes response → SI → Project owner → QRY...` | `Error` | fixture PRJ ligne 110, test ligne 319 |
| F21 | `src/features/protocol-designer/functional-reset/__tests__/functional-reset-03b.test.tsx` | `FR03B-C10 — Standard keeps one primary free-text interaction...` | `AssertionError` | ligne 288 |
| F22 | `src/features/protocol-designer/functional-reset/__tests__/project-persistence-01.test.ts` | `F01 freezes the exact 03R3 prompt digest` | `AssertionError` | ligne 25 |
| F23 | `src/features/protocol-designer/functional-reset/__tests__/project-persistence-01r1.test.ts` | `R1F01 preserves the frozen semantic prompt` | `AssertionError` | ligne 29 |
| F24 | `src/features/protocol-designer/functional-reset/__tests__/w1-imaging-01-product-scientific-thinking-handoff.test.ts` | `W1IMG01-17 preserves ST alternatives` | `AssertionError` | ligne 251 |
| F25 | `src/features/protocol-designer/functional-reset/__tests__/w1-qual-01h1t-contract-readback.test.ts` | `preserves ST 1.2.1 runtime hashes without invoking ST` | `AssertionError` | ligne 46 |

## Failure classification

Le registre ci-dessous complète l'inventaire par `FAILURE_ID`. Une classification primaire unique est attribuée à chaque échec.

| ID | EXPECTED | ACTUAL | PRIMARY_CLASS | EXPECTATION_SOURCE | EXPECTATION_STILL_VALID | LIKELY_OWNER | FIRST_DIVERGENT_STAGE | ROOT_CAUSE_ID | PRIORITY | FUTURE_REPAIR_TYPE |
|---|---|---|---|---|---|---|---|---|---|---|
| F01 | sibling `git status --porcelain = empty` | 42 paths modifiés/non suivis | `EXTERNAL_REPOSITORY_STATE` | `EXTERNAL_REPOSITORY_STATE` | PARTIAL | `EDITORIAL_INTEGRATION` | `EXTERNAL_WORKTREE_GUARD` | RC-TEST-01 | P1 | `REMOVE_EXTERNAL_STATE_DEPENDENCY` |
| F02 | `protectedState.editorialEngineUnchanged = true` | `false` | `EXTERNAL_REPOSITORY_STATE` | `EXTERNAL_REPOSITORY_STATE` | PARTIAL | `EDITORIAL_INTEGRATION` | `EXTERNAL_WORKTREE_GUARD` | RC-TEST-01 | P1 | `REMOVE_EXTERNAL_STATE_DEPENDENCY` |
| F03 | même invariant | `false` | `EXTERNAL_REPOSITORY_STATE` | `EXTERNAL_REPOSITORY_STATE` | PARTIAL | `EDITORIAL_INTEGRATION` | `EXTERNAL_WORKTREE_GUARD` | RC-TEST-01 | P1 | `REMOVE_EXTERNAL_STATE_DEPENDENCY` |
| F04 | fixture Imaging gelée disponible pour DOC cas B | `IMG_001B_LIVE_HANDOFF_NOT_FROZEN` | `FROZEN_FIXTURE_STALE` | `TEST_FIXTURE` | PARTIAL | `TEST_HARNESS` | `IMAGING_TEST_INPUT_ASSEMBLY` | RC-TEST-02 | P1 | `REFREEZE_WITH_GOVERNED_EVIDENCE` |
| F05 | fixture Imaging gelée disponible pour DOC cas C | même erreur | `FROZEN_FIXTURE_STALE` | `TEST_FIXTURE` | PARTIAL | `TEST_HARNESS` | `IMAGING_TEST_INPUT_ASSEMBLY` | RC-TEST-02 | P1 | `REFREEZE_WITH_GOVERNED_EVIDENCE` |
| F06 | contribution Imaging gelée projetable | même erreur | `FROZEN_FIXTURE_STALE` | `TEST_FIXTURE` | PARTIAL | `TEST_HARNESS` | `IMAGING_TEST_INPUT_ASSEMBLY` | RC-TEST-02 | P1 | `REFREEZE_WITH_GOVERNED_EVIDENCE` |
| F07 | au moins une assertion exclue ; coverage `PARTIAL` | 0 assertion exclue ; assertions qualifiées avec limites | `TEST_EXPECTATION_STALE` | `IMPLEMENTATION_CONTRACT` | NO | `KNOWLEDGE` | `KNOWLEDGE_APPLICABILITY` | RC-TEST-03 | P2 | `FIX_TEST_EXPECTATION` |
| F08 | un plan externe exécuté dont la première branche contient no-reflow/stenting | couverture interne suffisante ; décision `INTERNAL_ONLY` ; aucun plan provider | `TEST_EXPECTATION_STALE` | `IMPLEMENTATION_CONTRACT` | PARTIAL | `KNOWLEDGE` | `EXTERNAL_SEARCH_DECISION` | RC-TEST-03 | P2 | `FIX_TEST_EXPECTATION` |
| F09 | handoff `FROZEN_BY_HUMAN` | `NOT_READY` | `FROZEN_FIXTURE_STALE` | `TEST_FIXTURE` | PARTIAL | `TEST_HARNESS` | `IMAGING_TEST_INPUT_ASSEMBLY` | RC-TEST-02 | P1 | `REFREEZE_WITH_GOVERNED_EVIDENCE` |
| F10 | handoff `FROZEN_BY_HUMAN` | `NOT_READY` | `FROZEN_FIXTURE_STALE` | `TEST_FIXTURE` | PARTIAL | `TEST_HARNESS` | `IMAGING_TEST_INPUT_ASSEMBLY` | RC-TEST-02 | P1 | `REFREEZE_WITH_GOVERNED_EVIDENCE` |
| F11 | handoff conceptuel `FROZEN_BY_HUMAN` | `NOT_READY` | `FROZEN_FIXTURE_STALE` | `TEST_FIXTURE` | PARTIAL | `TEST_HARNESS` | `IMAGING_TEST_INPUT_ASSEMBLY` | RC-TEST-02 | P1 | `REFREEZE_WITH_GOVERNED_EVIDENCE` |
| F12 | ancienne version encore gelée avant requalification | fixture déjà `NOT_READY` avant le changement | `FROZEN_FIXTURE_STALE` | `TEST_FIXTURE` | PARTIAL | `TEST_HARNESS` | `IMAGING_TEST_INPUT_ASSEMBLY` | RC-TEST-02 | P1 | `REFREEZE_WITH_GOVERNED_EVIDENCE` |
| F13 | aucune séquence exécutable créée | dépendances Level 2 contiennent les refs gouvernées `...molli` et `...sasha`; Level 3 reste non générable | `TEST_HARNESS_DEFECT` | `NORMATIVE_CONTRACT` | YES | `TEST_HARNESS` | `IMAGING_NEGATIVE_ASSERTION` | RC-TEST-04 | P2 | `FIX_TEST_HARNESS` |
| F14 | 0 modalité candidate | 1 modalité IRM candidate, 0 biomarqueur, 0 acquisition, status `RETURN_TO_SCIENTIFIC_THINKING` | `TEST_EXPECTATION_STALE` | `IMPLEMENTATION_CONTRACT` | PARTIAL | `KNOWLEDGE` | `KNOWLEDGE_APPLICABILITY` | RC-TEST-03 | P2 | `FIX_TEST_EXPECTATION` |
| F15 | fixture Imaging gelée pour PRJ | `IMG_001B_LIVE_HANDOFF_NOT_FROZEN` | `FROZEN_FIXTURE_STALE` | `TEST_FIXTURE` | PARTIAL | `TEST_HARNESS` | `IMAGING_TEST_INPUT_ASSEMBLY` | RC-TEST-02 | P1 | `REFREEZE_WITH_GOVERNED_EVIDENCE` |
| F16 | Knowledge runtime `1.2.0` | `1.2.1` | `VERSION_OR_DIGEST_BASELINE_STALE` | `HARDCODED_BASELINE` | NO | `TEST_HARNESS` | `OWNER_VERSION_ASSERTION` | RC-TEST-05 | P2 | `FIX_TEST_EXPECTATION` |
| F17 | ST runtime `1.1.0` | `1.2.2` ; IMG/PRJ/DOC identiques à l'attendu | `VERSION_OR_DIGEST_BASELINE_STALE` | `HARDCODED_BASELINE` | NO | `TEST_HARNESS` | `OWNER_VERSION_ASSERTION` | RC-TEST-05 | P2 | `FIX_TEST_EXPECTATION` |
| F18 | `projectDocument(...).ok = true` | `false`, conséquence du handoff Imaging `NOT_READY` | `FROZEN_FIXTURE_STALE` | `TEST_FIXTURE` | PARTIAL | `TEST_HARNESS` | `IMAGING_TEST_INPUT_ASSEMBLY` | RC-TEST-02 | P1 | `REFREEZE_WITH_GOVERNED_EVIDENCE` |
| F19 | handoff Imaging frozen, équipement inconnu, protocole non prêt | handoff `NOT_READY` | `FROZEN_FIXTURE_STALE` | `TEST_FIXTURE` | PARTIAL | `TEST_HARNESS` | `IMAGING_TEST_INPUT_ASSEMBLY` | RC-TEST-02 | P1 | `REFREEZE_WITH_GOVERNED_EVIDENCE` |
| F20 | le scénario conversationnel obtient une fixture Imaging gelée | `IMG_001B_LIVE_HANDOFF_NOT_FROZEN` | `FROZEN_FIXTURE_STALE` | `TEST_FIXTURE` | PARTIAL | `TEST_HARNESS` | `IMAGING_TEST_INPUT_ASSEMBLY` | RC-TEST-02 | P1 | `REFREEZE_WITH_GOVERNED_EVIDENCE` |
| F21 | placeholder exact `Ajouter ou modifier un élément du projet…` | `Décrivez le projet de recherche que vous souhaitez construire.` | `TEST_EXPECTATION_STALE` | `HARDCODED_BASELINE` | NO | `OTHER` | `PRODUCT_ENTRY_PRESENTATION` | RC-TEST-06 | P3 | `FIX_TEST_EXPECTATION` |
| F22 | prompt digest `ke1-c0ca1286fa26c762` | `ke1-2a749424ecde0120` | `LEGACY_TEST_NOT_CURRENTLY_APPLICABLE` | `FROZEN_RUNTIME_EVIDENCE` | PARTIAL | `INFRA` | `VITEST_TEST_DISCOVERY` | RC-TEST-07 | P1 | `SPLIT_HISTORICAL_TEST_SUITE` |
| F23 | même digest gelé | même digest courant | `LEGACY_TEST_NOT_CURRENTLY_APPLICABLE` | `FROZEN_RUNTIME_EVIDENCE` | PARTIAL | `INFRA` | `VITEST_TEST_DISCOVERY` | RC-TEST-07 | P1 | `SPLIT_HISTORICAL_TEST_SUITE` |
| F24 | présence d'une hypothèse ST de kind `NULL_OR_COMPETING` puis conservation Imaging | le premier prédicat est `false`; les branches explicites utilisent `ALTERNATIVE` | `TEST_EXPECTATION_STALE` | `IMPLEMENTATION_CONTRACT` | PARTIAL | `TEST_HARNESS` | `ST_ALTERNATIVE_KIND_ASSERTION` | RC-TEST-08 | P2 | `FIX_TEST_EXPECTATION` |
| F25 | hash moteur ST 1.2.1 `sha256-e87aa94e3e7f0542991f2d3bc748a9ba41f33fb0ff32511ea25f820feb9564dc` | hash moteur courant ST 1.2.2 `sha256-edb070f46c7c986ee6980cb955e3d5fc535413782b4e5bcd198f3ca0be59b427` | `TEST_HARNESS_DEFECT` | `FROZEN_RUNTIME_EVIDENCE` | PARTIAL | `TEST_HARNESS` | `HISTORICAL_EVIDENCE_READBACK` | RC-TEST-09 | P2 | `FIX_TEST_HARNESS` |

## Expectation provenance

| Source | Failures | Interprétation |
|---|---:|---|
| `EXTERNAL_REPOSITORY_STATE` | 3 | La valeur attendue décrit une propreté de worktree externe, pas une sortie NOXIA. |
| `TEST_FIXTURE` | 11 | L'invariant métier aval reste souvent pertinent, mais la fixture n'atteint plus sa précondition gelée. |
| `IMPLEMENTATION_CONTRACT` | 4 | F07/F08/F14/F24 figent une ancienne forme du comportement ; la finalité de couverture ou de conservation peut rester partiellement valide. |
| `NORMATIVE_CONTRACT` | 1 | F13 protège légitimement l'absence de protocole exécutable inventé, mais son matcher ne distingue pas une dépendance d'une création. |
| `HARDCODED_BASELINE` | 3 | F16/F17/F21 attendent littéralement une ancienne version ou un ancien libellé. |
| `FROZEN_RUNTIME_EVIDENCE` | 3 | F22/F23 portent un ancien prompt 03R3 ; F25 porte une identité ST 1.2.1 historiquement correcte. |

`EXPECTATION_STILL_VALID = PARTIAL` signifie que l'intention générale du test reste légitime, pas que sa valeur exacte doit être conservée dans le gate courant. Aucun test ou rapport Level 3 n'a été élevé au rang de norme.

## Owner attribution

| LIKELY_OWNER | Failure count | Failures | Motif |
|---|---:|---|---|
| `TEST_HARNESS` | 16 | F04–F06, F09–F13, F15, F17–F20, F24–F25, plus F16 | fixtures, assertions ou readbacks divergents avant toute preuve d'un défaut owner courant |
| `KNOWLEDGE` | 3 | F07, F08, F14 | premier changement observable dans l'applicabilité et la décision de recherche externe |
| `EDITORIAL_INTEGRATION` | 3 | F01–F03 | lecture directe du sibling mutable |
| `INFRA` | 2 | F22–F23 | découverte Vitest de fichiers ignorés et non suivis |
| `OTHER` — Protocol Designer presentation | 1 | F21 | libellé intent-aware de la surface conversationnelle |

L'owner d'un objet versionné reste indiqué dans la section dédiée, mais le propriétaire de la réparation future est le premier étage divergent. Ainsi, F16/F17/F25 ne sont pas attribués à la science de Knowledge/ST : les versions et preuves courantes sont cohérentes, ce sont les assertions de test qui ne le sont pas.

## Editorial Engine dependent failures

Le sibling observé est :

```text
path = /Users/charles/Documents/Projets/editorial-engine
HEAD = 335fbbea8d138901f0cdf4f5e2d3b96144880e8b
git status --porcelain entries = 42
```

F01 exécute directement `git status --porcelain` dans ce chemin absolu et exige une chaîne vide. F02 et F03 appellent `inspectProtectedSurfaces`, qui agrège `git diff`, l'index et les fichiers non suivis du sibling, puis pose `editorialEngineUnchanged = changed.length === 0`.

Constats :

- les trois tests protègent historiquement l'idée que leurs migrations n'ont pas modifié Editorial Engine ;
- ils ne comparent pourtant pas un état avant/après la migration et ne vérifient pas le package consommé ;
- ils testent aujourd'hui la propreté globale du worktree sibling au moment du run ;
- avec un sibling réellement clean, les trois prédicats redeviendraient vrais ;
- l'échec actuel ne prouve ni un défaut NOXIA ni une incompatibilité d'API Editorial Engine ;
- la dépendance du gate canonique à un worktree sibling mutable est elle-même le défaut de reproductibilité.

Aucun fichier, index, stash ou historique du sibling n'a été modifié.

## IMG_001B_LIVE_HANDOFF_NOT_FROZEN

La dette reste active et s'étend à 11 failures de la présente reproduction.

`makeFrozenImagingResult()` construit actuellement un vrai input ECV/T1 via Knowledge puis Scientific Thinking. Depuis la connexion Knowledge → Scientific Thinking (`218715fc5063e8d1e437bbadcc2e7ab33975c3a2`), la contradiction Knowledge est conservée dans le handoff ST puis projetée dans `ImagingDesignInput.contradictions`. Le contrat Imaging inclut toute contradiction non résolue dans `freezeBlockers` sous `UNRESOLVED_STRUCTURAL_CONTRADICTION`.

Les boucles historiques approuvent les gates et, selon les fixtures, répondent aux questions. Elles ne résolvent pas la contradiction. Le résultat correct et fail-closed est donc :

```text
projectConstructionHandoff.status = NOT_READY
not = FROZEN_BY_HUMAN
```

`NOT_FROZEN` ne signifie pas que les décisions humaines n'ont pas été simulées ; il signifie qu'une contradiction structurelle amont reste non résolue et interdit le freeze. Modifier le moteur pour ignorer cette contradiction contredirait le contrat. La réparation future doit construire/refreezer une fixture dont les preuves gouvernées satisfont réellement le scénario testé, sans supprimer silencieusement la contradiction.

Tests directement ou indirectement dépendants :

- F09–F12 : expectations directes `FROZEN_BY_HUMAN` ;
- F04–F06, F15, F20 : exception explicite `IMG_001B_LIVE_HANDOFF_NOT_FROZEN` ;
- F18–F19 : échec aval parce que DOC/SYS reçoit un handoff `NOT_READY`.

Les rapports W1 antérieurs avaient déjà enregistré huit failures historiques voisines sous `PREEXISTING_HISTORICAL_FIXTURE_DEBT`; cela confirme l'antériorité mais ne remplace pas l'analyse causale ci-dessus.

## Version/hash/digest failures

| Failure | EXPECTED_VALUE | ACTUAL_VALUE | OBJECT_OWNER | LAST_KNOWN_CHANGE | CHANGE_COMMIT | CHANGE_INTENT | TEST_RELATION_TO_CHANGE |
|---|---|---|---|---|---|---|---|
| F16 | Knowledge `1.2.0` | `1.2.1` | Knowledge | 2026-08-27 | `320d54bbab3c87833ea69583097860c28d010403` | synthèse UNDERSTAND gouvernée | test créé avant le bump (`7c9f012e...`) |
| F17 | ST `1.1.0` | `1.2.2` | Scientific Thinking | 2026-08-26 | `6803ba7d5c73c1df8771dbd8e9748d6334adf436` | réparation bornée de défauts human-adjudicated | test créé avant (`94a6e634...`) |
| F22 | prompt `ke1-c0ca1286fa26c762` | `ke1-2a749424ecde0120` | Persistence / Project extraction | 2026-08-25 | `9be06edca1a7500ab7a43d065e94241e91d67bec` | provenance littérale par source anchors | test non suivi : relation Git non démontrable |
| F23 | même prompt historique | même prompt courant | Persistence / Project extraction | 2026-08-25 | `9be06edca1a7500ab7a43d065e94241e91d67bec` | même changement | test non suivi : relation Git non démontrable |
| F25 | moteur ST 1.2.1 `e87aa94e...` | moteur ST 1.2.2 `edb070f4...` | Scientific Thinking | 2026-08-26 | `6803ba7d5c73c1df8771dbd8e9748d6334adf436` | réparation ST 1.2.2 | test créé avant le bump (`af6df685...`) |

F16/F17 sont des baselines de versions stale. F22/F23 sont des preuves prompt historiques découvertes hors de leur suite. F25 ne doit surtout pas être réparé par remplacement du hash historique : le hash 1.2.1 reste une preuve correcte, mais le test le compare à un chemin runtime mutable désormais en 1.2.2.

## Behavioral failures

### Knowledge applicability and external decision — F07, F08, F14

KE-001 distingue une dimension `HARD`, dont l'incompatibilité exclut, d'une différence non critique/`SOFT`, qui peut produire `APPLICABLE_WITH_LIMITATIONS`. Les corrections produit `320d54bb...` puis `153e8709...` ont propagé ce contrat et amélioré le matching UNDERSTAND.

- F07 attend encore qu'une pathologie non documentée exclue nécessairement les assertions. Le runtime courant les conserve avec limitations quand la dimension est `SOFT`.
- F08 suppose qu'une recherche externe `EXTERNAL_ALLOWED` sera toujours exécutée. La couverture interne no-reflow est désormais `SUPPORTED`; la décision devient correctement `INTERNAL_ONLY`, le provider reste à zéro appel, et `provider.plans[0]` n'existe pas.
- F14 attend zéro modalité. Le même résultat Knowledge supporté porte des assertions MR ; Imaging conserve donc une candidate IRM sans biomarqueur ni acquisition, avec limites explicites et retour vers Scientific Thinking.

Ces changements sont intentionnels, déterministes et couverts par les tests produit 01I. Les attentes historiques doivent être réécrites selon leur finalité, pas simplement remplacées par les valeurs actuelles.

### Imaging sequence negative assertion — F13

La sortie n'a créé ni objet séquence exécutable ni paramètres Level 3. Elle contient des identifiants de dépendance gouvernés `noxia:radiology:acquisition-method:molli` et `...:sasha` dans un plan Level 2, tandis que :

```text
level3.status = NOT_GENERATABLE_WITH_CURRENT_EXECUTABLE_KNOWLEDGE
```

Le matcher sérialise tout `acquisitionStrategies` puis interdit toute occurrence textuelle de `MOLLI|SASHA|séquence de type`. Il confond conservation d'une référence Knowledge et création d'une séquence. L'invariant normatif reste valable ; le prédicat du harness ne l'évalue plus correctement.

### Intent-aware product placeholder — F21

Le test conserve ses deux invariants principaux : un seul champ libre et aucun bouton `Continuer`. Seule l'expectation exacte du placeholder diverge. `312b4b9c45de57ed3a6339dcc703f79955fbc36c` a introduit `productEntryPromptForIntent`; un contexte `DESIGN_STUDY` affiche désormais `Décrivez le projet de recherche que vous souhaitez construire.`. Il s'agit d'une présentation active, pas d'une preuve d'un défaut QRY ou Project.

### ST alternatives — F24

RDE-001/RDE-002 exigent la conservation des hypothèses concurrentes et alternatives, pas un sous-type unique. Le test date du corridor ST → Imaging 1.2.1. ST 1.2.2 (`6803ba7d...`) matérialise les statements Knowledge pluriels comme branches `ALTERNATIVE`; il ne produit le fallback générique `NULL_OR_COMPETING` que lorsqu'aucune branche explicite n'est disponible. Le premier assert exact sur `NULL_OR_COMPETING` échoue avant même l'assert Imaging. La future expectation doit vérifier la pluralité, l'identité et la conservation du contenu, sans imposer l'ancien fallback.

## Historical/legacy tests

| Surface/test | Classification de surface | État |
|---|---|---|
| F22/F23 — Project Persistence 03R3/01R1 | `UNREACHABLE_HISTORICAL` pour le gate courant | fichiers physiques non suivis, règles exactes `.git/info/exclude:12-13`, mais inclus par `src/**/*.{test,spec}.{ts,tsx,mjs}` |
| F25 — Campaign D / ST 1.2.1 evidence | `SUPERSEDED_BUT_SUPPORTED` | preuve historique à préserver ; readback courant mal ciblé |
| F04–F06, F09–F12, F15, F18–F20 | `ACTIVE_CURRENT` | capacités aval actives ; fixture stale, donc ne pas séparer ces tests comme legacy |
| F16/F17/F21/F24 | `ACTIVE_CURRENT` | tests actifs dont une expectation ciblée doit être réconciliée |

Deux faits sont distincts pour F22/F23 : le mécanisme de persistence/extraction reste actif, mais ces deux fichiers précis ne font pas partie de `HEAD`. `git ls-files` ne les connaît pas et Git les ignore localement. Vitest parcourt cependant le filesystem indépendamment de Git. Ils rendent donc le résultat canonique dépendant des artefacts physiques propres à la machine.

Un troisième fichier historique non suivi, `project-persistence-tech-01.test.ts`, est également découvert mais passe ; il confirme que le problème de configuration dépasse les seuls deux tests rouges.

## Root-cause groups

| ROOT_CAUSE_ID | FAILURE_COUNT | AFFECTED_TEST_FILES | CLASS | PRIORITY | OWNER | FIRST_DIVERGENT_STAGE | REPAIR_TYPE | RISK_OF_BLIND_EXPECTATION_UPDATE |
|---|---:|---|---|---|---|---|---|---|
| RC-TEST-01 | 3 | 3 knowledge-graph suites | `EXTERNAL_REPOSITORY_STATE` | P1 | `EDITORIAL_INTEGRATION` | `EXTERNAL_WORKTREE_GUARD` | `REMOVE_EXTERNAL_STATE_DEPENDENCY` | HIGH — masquerait une non-reproductibilité |
| RC-TEST-02 | 11 | DOC (2), IMG, PRJ, SYS (2), conversation | `FROZEN_FIXTURE_STALE` | P1 | `TEST_HARNESS` | `IMAGING_TEST_INPUT_ASSEMBLY` | `REFREEZE_WITH_GOVERNED_EVIDENCE` | CRITICAL — ignorerait une contradiction réelle |
| RC-TEST-03 | 3 | ENG-002, ENG-003, IMG mandatory | `TEST_EXPECTATION_STALE` | P2 | `KNOWLEDGE` | `KNOWLEDGE_APPLICABILITY` | `FIX_TEST_EXPECTATION` | HIGH — pourrait réintroduire une exclusion SOFT erronée ou forcer l'externe |
| RC-TEST-04 | 1 | IMG mandatory | `TEST_HARNESS_DEFECT` | P2 | `TEST_HARNESS` | `IMAGING_NEGATIVE_ASSERTION` | `FIX_TEST_HARNESS` | HIGH — supprimerait des dépendances/provenances licites |
| RC-TEST-05 | 2 | PROJECT-SPINE-03, SYS contracts | `VERSION_OR_DIGEST_BASELINE_STALE` | P2 | `TEST_HARNESS` | `OWNER_VERSION_ASSERTION` | `FIX_TEST_EXPECTATION` | MEDIUM — une mise à jour sans vérifier l'intention de version reste dangereuse |
| RC-TEST-06 | 1 | Functional Reset 03B | `TEST_EXPECTATION_STALE` | P3 | `OTHER` | `PRODUCT_ENTRY_PRESENTATION` | `FIX_TEST_EXPECTATION` | LOW — mais préserver les invariants one-input/no-continue |
| RC-TEST-07 | 2 | Project Persistence 01/01R1 non suivis | `LEGACY_TEST_NOT_CURRENTLY_APPLICABLE` | P1 | `INFRA` | `VITEST_TEST_DISCOVERY` | `SPLIT_HISTORICAL_TEST_SUITE` | HIGH — éditer des artefacts exclus masquerait la non-portabilité du gate |
| RC-TEST-08 | 1 | W1 Imaging handoff | `TEST_EXPECTATION_STALE` | P2 | `TEST_HARNESS` | `ST_ALTERNATIVE_KIND_ASSERTION` | `FIX_TEST_EXPECTATION` | HIGH — ne pas perdre les alternatives explicites au profit d'un fallback générique |
| RC-TEST-09 | 1 | H1T readback | `TEST_HARNESS_DEFECT` | P2 | `TEST_HARNESS` | `HISTORICAL_EVIDENCE_READBACK` | `FIX_TEST_HARNESS` | CRITICAL — ne jamais réécrire une preuve 1.2.1 pour refléter 1.2.2 |
| **TOTAL** | **25** | **20 fichiers rouges** | — | — | — | — | — | — |

```text
3 + 11 + 3 + 1 + 2 + 1 + 2 + 1 + 1 = 25
```

## Priority

```text
P0 = 0 failures
P1 = 16 failures
P2 = 8 failures
P3 = 1 failure
```

- P1 : restaurer d'abord la reproductibilité du gate et la validité des fixtures qui bloquent plusieurs corridors.
- P2 : réconcilier ensuite les attentes comportementales/versionnées et les prédicats trop larges, test par test.
- P3 : aligner en dernier le libellé de présentation sans toucher aux deux invariants UX encore verts.

Aucun rouge observé ne démontre un runtime critique invalide ou dangereux ; aucun P0 n'est justifié.

## Recommended repair sequence

1. Isoler du gate canonique les tests physiques non suivis et rendre la découverte indépendante de `.git/info/exclude` (`RC-TEST-07`).
2. Remplacer la vérification de propreté globale du sibling par une preuve d'intégration/reproductibilité bornée, sans nettoyer Editorial Engine (`RC-TEST-01`).
3. Réparer la famille de fixtures Imaging avec une entrée gouvernée adaptée à l'objet de chaque test ; conserver toute contradiction lorsqu'elle est pertinente (`RC-TEST-02`).
4. Corriger le readback Campaign D pour comparer l'évidence 1.2.1 à des bytes archivés/identifiés, jamais au runtime courant (`RC-TEST-09`).
5. Aligner explicitement les baselines Knowledge/ST sur les commits de version autorisés, avec tests de cohérence plutôt qu'un bulk replace (`RC-TEST-05`).
6. Réconcilier F07/F08/F14 avec KE-001 et séparer le test de sérialisation externe d'une décision `INTERNAL_ONLY` légitime (`RC-TEST-03`).
7. Remplacer le matcher textuel F13 par une vérification des objets/états Level 3 réellement interdits (`RC-TEST-04`).
8. Vérifier la pluralité ST et sa conservation Imaging par identités/contenus, sans imposer `NULL_OR_COMPETING` (`RC-TEST-08`).
9. Adapter uniquement le placeholder F21 en conservant les assertions structurantes déjà vertes (`RC-TEST-06`).

Chaque étape doit être un futur changement borné avec son propre diff et ses tests ciblés. Cette séquence n'autorise aucune réparation dans la présente mission.

## What must not be bulk-updated

Ne pas effectuer de remplacement global des versions, digests ou hashes. En particulier :

- ne pas transformer le hash historique ST 1.2.1 en hash ST 1.2.2 ;
- ne pas remplacer aveuglément tous les `FROZEN_BY_HUMAN` par `NOT_READY` ;
- ne pas retirer `UNRESOLVED_STRUCTURAL_CONTRADICTION` du fail-closed Imaging ;
- ne pas supprimer les références MOLLI/SASHA de provenance uniquement pour satisfaire une regex ;
- ne pas forcer `EXTERNAL_ALLOWED` quand Knowledge est suffisamment couvert en interne ;
- ne pas revenir à l'exclusion absolue d'une dimension `SOFT` ;
- ne pas remplacer toutes les alternatives ST explicites par un fallback générique ;
- ne pas éditer, skipper ou ajouter les tests non suivis simplement parce qu'ils sont rouges ;
- ne pas nettoyer le sibling Editorial Engine pour produire artificiellement un run vert ;
- ne modifier aucun corpus, Gold, owner output, Project write boundary, snapshot ou autorité.

## Cost

```text
EXTERNAL_LLM_API_CALLS = 0
SCIENTIFIC_PROVIDER_CALLS = 0
NETWORK_CALLS = 0
NEW_BENCHMARK = 0
NEW_SCIENTIFIC_CAMPAIGN = 0
CANONICAL_FULL_SUITE_RUNS = 1
```

Seuls des documents locaux, Git read-only, la suite canonique unique, deux tests focalisés existants et un readback local déterministe ont été utilisés.

## Git

```text
CODE_CHANGED = NO
AUTHORITIES_CHANGED = NO
HISTORICAL_ARTIFACTS_CHANGED = NO
.git/info/exclude CHANGED = NO
GIT_ADD = NO
COMMIT = NO
PUSH = NO
DEPLOYMENT = NO
```

La seule modification de worktree produite par la mission est le présent rapport non suivi :

`docs/implementation/canonical-test-failure-root-cause-triage.md`

CANONICAL_TEST_FAILURE_ROOT_CAUSES_IDENTIFIED
