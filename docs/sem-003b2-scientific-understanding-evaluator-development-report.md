# SEM-003B2 — Scientific Understanding Evaluator Development

## Rapport de développement contractuel sur le jeu Development uniquement

| Champ | Valeur |
|---|---|
| Version | `1.0` |
| Statut | `OFFICIAL` |
| Niveau documentaire | `NIVEAU_3 — rapport de mission` |
| Source maîtresse | `docs/sem-003b2-scientific-understanding-evaluator-development-report.md` |
| Date | 13 août 2026 |
| Baseline documentaire | `SOURCE-OF-TRUTH-INDEX` version `1.33` |
| Index après clôture | version `1.34`, `OFFICIAL` |
| Evaluator | `SEM003_EVALUATOR_VERSION = 1.0.0` |
| Digest de configuration | `13f2e4d0b57e200b53e3db52a4fa74cc346a0b65e82b96ac12ca82ba435767b5` |
| Décision | `SEM003B2_EVALUATOR_READY_FOR_HUMAN_REFERENCE_REVIEW` |

---

## 1. Résultat

Le premier évaluateur SEM-003 de compréhension scientifique est développé sous `semantic-validation/sem-003/evaluator/`. Il consomme uniquement un `Case`, son `Acceptance Envelope` et une représentation candidate normalisée. Il ne modifie ni PD-003, ni OBS-001, ni SEM-002, ni le runtime SEM.

L’évaluateur applique deux niveaux strictement séparés :

1. **Level 1 — contrôles contractuels déterministes.** Il vérifie les mappings explicites vers `REQUIRED`, les signaux `PROHIBITED`, les ambiguïtés ouvertes, les frontières d’ownership, la provenance et les états non évaluables. Il n’utilise ni similarité lexicale, ni topologie JSON exacte, ni règle propre à un cas.
2. **Level 2 — adjudication explicite.** Tout jugement scientifique non trivial produit un paquet `ADJUDICATION_REQUIRED`. Aucune décision humaine, équivalence complexe ou approbation scientifique n’est inventée.

Les modes `DEVELOPMENT_SYNTHETIC`, `FUTURE_SEM_RUNTIME` et `HUMAN_ADJUDICATION` sont contractuellement représentés. Seul `DEVELOPMENT_SYNTHETIC` a été exécuté dans cette mission.

## 2. Contrats et identité

Six contrats de benchmark versionnés sont créés :

- `evaluation-input.schema.json` ;
- `candidate-semantic-representation.schema.json` ;
- `evaluation-result.schema.json` ;
- `property-judgment.schema.json` ;
- `adjudication-packet.schema.json` ;
- `human-decision-record.schema.json`.

Ils sont explicitement des contrats d’évaluation, jamais des objets PD-003, des schémas runtime SEM ou des sources de vérité scientifique. La représentation candidate sait porter les éléments courants, historiques, superseded, inconnus, ambigus, optionnels, leur ownership et leur provenance.

Le registre des propriétés est dérivé mécaniquement de la projection machine SEM-002 version 1.0. Il conserve exactement :

- P01–P12 : douze invariants `SAFETY_FIDELITY_INVARIANT`, absolus et non compensables ;
- P13–P17 : cinq propriétés `SCIENTIFIC_UNDERSTANDING_COMPETENCE`, dont seule la mécanique de jugement est développée ;
- P18 : une propriété `CONTEXTUAL_ENRICHMENT`, dont la pertinence reste à adjuger et calibrer.

Le digest couvre le code du noyau, les six schémas, le registre des propriétés, le contrat candidat normalisé, le contrat d’adjudication, la taxonomie failure/disposition et les versions de SEM-002, SEM-003 et de l’Acceptance Envelope.

## 3. Preuve Development

| Preuve | Résultat |
|---|---:|
| Cas Development disponibles / utilisés | `15 / 15` |
| Candidats synthétiques | `41` |
| Candidats de base positifs | `15` |
| Paires de formes différentes | `5` |
| Candidats proches avec défaut sémantique réel | `12` |
| Candidats dédiés à la mécanique P13–P18 | `6` |
| États fail-closed/provider/non-évaluable | `3` |
| Propriétés reconnues | `18 / 18` |
| Invariants P01–P12 avec fixture positive et négative | `12 / 12` |
| Propriétés P13–P18 avec fixture d’adjudication | `6 / 6` |

Les cinq paires de structure différente conservent le même vecteur critique au Level 1. Elles ne sont jamais rejetées pour leur forme. Parce que les déclarations d’équivalence présentes dans les références restent candidates et portent `notAutomaticallyEvaluated = true`, leur disposition demeure `NOT_EVALUABLE` avec paquets d’adjudication ouverts ; cette retenue est volontaire.

Les douze candidats négatifs sont construits par une mutation générique unique d’un mapping `REQUIRED` ou d’un signal `PROHIBITED`. Chacun entraîne `SEMANTIC_FAILURE` pour au moins l’invariant absolu ciblé. Aucune règle ne contient un `caseId`, une clé sémantique de cas, un terme scientifique particulier, un Gold ou une valeur benchmark.

Le résultat distingue la première cause des constats aval. `SAFE_FAIL_CLOSED`, `PROVIDER_EXECUTION_FAILURE` et `NOT_EVALUABLE` restent distincts d’une réussite de compréhension. Aucun score global n’est calculé.

## 4. Frontière Calibration et gouvernance

`CALIBRATION_CASE_CONTENT_ACCESSED_FOR_EVALUATOR_TUNING = NO`.

L’évaluateur, ses fixtures, ses attentes, ses mappings et ses règles ont été construits uniquement depuis les quinze cas `DEVELOPMENT_VISIBLE`. Aucun cas Calibration n’est référencé par une fixture ou par le noyau. Le validateur transverse SEM-003B1 existant a relu le corpus complet uniquement pour sa vérification structurelle et contractuelle déjà admise ; cette passe n’a fourni aucune règle, attente ou décision à l’évaluateur.

Les dix candidats Calibration restent `DESIGN_ONLY`, `HUMAN_REVIEW_REQUIRED` et `PARENTAGE_REVIEW_REQUIRED`. Le nombre visible reste zéro. Les 62 items de la Review Queue ne sont ni fermés ni modifiés. Aucune calibration, répétition, valeur de `N`, métrique agrégée, limite numérique, gate ou qualification n’est exécutée.

## 5. Validations

| Validation | Résultat |
|---|---|
| Contrats évaluateur | `PASS` — 6/6 schémas compilés |
| Validateur évaluateur | `PASS` — 18 propriétés, 15 cas, 41 candidats |
| Tests évaluateur | `PASS` — 10/10 |
| Validateur authoring existant | `PASS` — 3/3 exemples |
| Tests authoring existants | `PASS` — 17/17 |
| Validateur corpus existant | `PASS` — 25 Case + 25 Envelopes, structure uniquement |
| Tests corpus existants | `PASS` — 20/20 |
| Anti-overfitting | `PASS` — aucun Case ID ou semanticKey Development/Calibration dans le noyau |
| Couverture machine | `PASS` — 18/18, sans score |
| Appels LLM/provider | `0` |
| Runtime SEM / browser / downstream | `NOT_EXECUTED` |

Les validations `typecheck`, `build` et `git diff --check` sont exécutées à la clôture de la mission et enregistrées dans le compte rendu Git final ; elles ne constituent aucune qualification PD-011.

## 6. Limites réelles et prochaine gate

- les références Development restent candidates jusqu’aux revues scientifiques et méthodologiques humaines ;
- les cinq équivalences de démonstration restent ouvertes à l’adjudication ;
- l’adapter d’une future sortie SEM vers la représentation candidate doit être développé et qualifié séparément ;
- `FUTURE_SEM_RUNTIME` et `HUMAN_ADJUDICATION` ne sont pas exécutés ici ;
- six failure classes restent contractuellement supportées mais non déclenchées par les fixtures Development actuelles ;
- l’évaluateur n’est ni calibré, ni qualifié sous PD-011 ;
- aucune valeur de `N`, aucun seuil, blind set, campagne ou PASS/FAIL scientifique n’existe.

Prochaine mission unique : `SEM-003B3 — Human Reference Review & Calibration Admission`.

Décision finale :

`SEM003B2_EVALUATOR_READY_FOR_HUMAN_REFERENCE_REVIEW`
