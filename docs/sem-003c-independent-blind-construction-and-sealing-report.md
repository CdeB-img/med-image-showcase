# SEM-003C — Independent Blind Construction & Sealing

## Rapport de construction et de scellement du premier jeu aveugle indépendant

| Champ | Valeur |
|---|---|
| Version | `1.0` |
| Statut | `OFFICIAL` |
| Niveau documentaire | `NIVEAU_3 — rapport de mission` |
| Source maîtresse | présent fichier Markdown |
| Date | 14 août 2026 |
| Blind Set | `SEM003C-BLIND-QUALIFICATION-SET-01` version `1.0.0` |
| Evaluator cible | version `1.1.0` |
| Digest Evaluator | `b05bc0ac66cb3e4dc5f135ba278cac8cadebe7443e57b1003dca580c9bd0e9bd` |
| Décision | `SEM003C_INDEPENDENT_BLIND_SET_SEALED_READY_FOR_QUALIFICATION` |

## 1. Résultat

Le premier jeu de qualification aveugle SEM-003 est construit, revu avant toute sortie SEM, séparé en package d'entrée et package de référence, digéré et scellé sous `semantic-validation/sem-003/blind/`.

Il contient quinze cas entièrement nouveaux. Aucun n'est une traduction, une paraphrase, un changement superficiel de pathologie ou une recombinaison des quinze cas Development, des dix cas Calibration, des exemples SEM-002/SEM-003 ou de H01–H30. La revue de parenté compare les demandes et chaînes de raisonnement visibles ; elle n'utilise ni Gold Frame ni sortie SEM.

Le scellement prépare uniquement SEM-003D. Aucun cas n'a été exécuté et aucune qualification de SEM n'est revendiquée.

## 2. Blind corpus

| Indicateur | Résultat |
|---|---:|
| Cas | 15 |
| Conversations multi-tour | 12 — 80 % |
| Conversations single-turn | 3 |
| Catégories SEM-003 | 15/15 |
| Propriétés SEM-002 | 18/18 |
| Cardiovasculaire / imagerie cardiovasculaire | 6 — 40 % |
| Autre imagerie médicale | 5 — 33,33 % |
| Recherche clinique / biomédicale / méthodologique | 4 — 26,67 % |
| Obligations `REQUIRED` | 88 |
| Interdictions `PROHIBITED` | 44 |
| Candidats optionnels non exhaustifs | 6 |
| Ambiguïtés explicitement concurrentes | 2 |

Les fréquences documentent la composition réelle ; elles ne créent ni pondération, ni score composite, ni seuil.

## 3. Référence et autorité

Chaque cas possède une `Acceptance Envelope` distincte comprenant `REQUIRED`, `PROHIBITED`, deux variantes structurelles admissibles, les candidats optionnels applicables, les ambiguïtés, la clarification attendue, les frontières d'ownership, les propriétés et les points d'adjudication.

La revue utilise trois fonctions simulées par cas :

- `REVIEWER_SIM_SCIENTIFIC` ;
- `REVIEWER_SIM_METHOD_OBS` ;
- `REVIEWER_SIM_BENCHMARK_GOVERNANCE`.

Cela représente 45 avis simulés. Ces avis ne sont ni des personnes, ni trois évaluateurs humains indépendants, ni un panel PD-011. Les limites restent :

- `REAL_HUMAN_REFERENCE_REVIEW = NOT_PERFORMED` ;
- `FINAL_PD011_REFERENCE_ELIGIBILITY = NO` ;
- `P13–P18 = UNRESOLVED_FOR_FINAL_PD011_DECISION`.

Le jeu est recevable pour une photographie technique SEM-003D selon le contrat de la présente mission ; il ne suffit pas à une décision confirmatoire finale PD-011.

## 4. Séparation et scellement

Le package d'entrée contient exclusivement les identifiants, versions, langue, demande source et tours de conversation. Il ne contient aucune enveloppe, propriété attendue, référence, décision ou résultat.

Le package de référence contient les quinze Cases, quinze `Acceptance Envelopes`, la revue simulée et l'audit de parenté. Le runner SEM-003D devra injecter uniquement `semantic-validation/sem-003/blind/input/` et ne devra ni monter ni révéler `sealed-reference/`, `review/`, `registry/` ou `coverage/` à SEM ou à l'opérateur de campagne.

| Package | Digest SHA-256 |
|---|---|
| Blind input package | `2fc328eb1bf81520979029db345355450bf38114be711406ee05bc6f55d9892f` |
| Sealed reference package | `23f0544d84d105501ead27e23740777f650f8bf83be72cf77b383f5730018304` |

Le stockage est séparé logiquement et par chemins dans le dépôt Git canonique. Git et les digests prouvent l'identité et l'immutabilité ; ils ne constituent pas un contrôle de confidentialité. Le contrôle d'accès du dépôt reste une responsabilité opérationnelle externe à SEM-003C.

## 5. Validations

| Validation | Résultat |
|---|---|
| Blind validator | `PASS — 30/30` |
| Blind tests | `PASS — 30/30` |
| Authoring validator/tests | `PASS` |
| Corpus validator/tests | `PASS` |
| B3 review validator/tests | `PASS` |
| Evaluator validator/tests | `PASS` |
| B4R tests | `PASS` |
| B4 precommitment tests | `PASS` |
| B4 Restart validator/tests | `PASS` |
| Typecheck | `PASS` |
| Build | `PASS` |
| `git diff --check` | `PASS` |
| Appels LLM/provider | `0` |
| Runtime SEM / browser / downstream / H29 / Holdout | `NOT_EXECUTED` |

Les contrôles C01–C30 couvrent schémas, unicité, parenté, contamination, séparation des packages, absence de résultats, immutabilité, expositions, identité de l'évaluateur, provenance, autorité simulée, couverture, digests, absence de seuil et absence de réutilisation des fixtures Calibration.

Le validateur du préflight B4 historique initial reproduit volontairement son échec de dérive lorsqu'il confronte l'ancien gel 1.0.0 à l'identité active 1.1.0. Il n'est pas une gate SEM-003C et n'est pas modifié. Les gates actives B4R et B4 Restart passent intégralement.

## 6. Git et frontières

| Commit local | Rôle |
|---|---|
| `a40be9e` | authoring indépendant des quinze cas et inputs |
| `38039f4` | enveloppes, revue simulée et parenté |
| `251f842` | scellement, manifestes et trente contrôles déterministes |
| commit contenant le présent rapport | admission documentaire et mise à jour de l'index |

Aucun push, rebase, squash, réécriture d'historique ou déploiement n'est réalisé. Aucun fichier fonctionnel SEM, Evaluator, Gold, seuil ou corpus visible n'est modifié. L'évaluateur reste 1.1.0 au digest gelé.

## 7. Décision

`SEM003C_INDEPENDENT_BLIND_SET_SEALED_READY_FOR_QUALIFICATION`

Prochaine mission unique : `SEM-003D — Qualification of Frozen SEM Against Sealed Blind Set`.

SEM-003D devra geler et digérer la configuration SEM complète, préengager le protocole PD-011 applicable, injecter uniquement le package d'entrée, conserver toutes les exécutions et interdire toute réparation ou modification de référence pendant la campagne.
