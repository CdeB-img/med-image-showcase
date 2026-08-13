# SEM-001R2 — Live Semantic Competence Qualification Report

**Décision :** `SCIENTIFIC_SEMANTIC_RECONSTRUCTION_NOT_READY`
**Date de campagne :** 2026-08-11
**Dépôt :** `noxia-dev`
**Branche observée :** `sem-001r-closure`
**Commit observé :** `d3de7ad603031acb8703cded7e5f00c24719be37`
**Campaign ID qualifiante :** `sem-001r2-2026-08-11T01-17-41-951Z-ke1-3bb807034f670217`
**Modèle :** `gemini-3.5-flash-lite`
**Schéma :** `SEM-001-1.0`

## 1. Décision

La reconstruction sémantique scientifique n'est pas qualifiée.

La campagne live est techniquement complète et homogène : 30/30 holdouts, 62 départs de requêtes, double passe, aucun retry, aucun HTTP 429, aucune erreur provider et aucune sortie structurée invalide. Elle échoue néanmoins aux seuils centraux de rappel des objets, des relations, des éléments critiques, des comparateurs et des interventions. Elle contient 73 bloqueurs absolus selon l'évaluateur officiel.

Les gates navigateur A–E et diagnostics live ST/IMG/PRJ restent donc fermées. Les exécuter aurait contredit le protocole et aurait nécessité d'accepter silencieusement des Semantic Models non qualifiés.

## 2. Baseline

La baseline SEM-001R avait corrigé la taxonomie des erreurs provider, borné les reprises et réparé la perte CT/relation dans le transfert SEM → IMG. La fermeture restait refusée faute de campagne provider exploitable.

Une première campagne Flash-Lite complète a ensuite été exécutée sous l'identifiant `sem-001r2-2026-08-11T00-53-36-161Z-ke1-3c0e530e944c946a`. Son diagnostic a démontré une consigne taxonomique insuffisante, un évaluateur trop lexical et une critique sans effet. Cette campagne a été invalidée pour la qualification finale, puis archivée sans réécriture sous `semantic-validation/sem-001r2/history/`.

La campagne courante est une nouvelle campagne, avec nouveaux identifiant, versions de prompts, version d'évaluateur et digests. Aucun résultat des deux campagnes n'est mélangé.

## 3. Périmètre

La passe couvre :

- le provider Gemini réel ;
- le modèle Flash-Lite imposé ;
- les structured outputs reconstruction et critique ;
- 30 Gold Semantic Frames gelés ;
- la double passe reconstruction/critique ;
- la canonicalisation, Knowledge et les digests ;
- les métriques SEM-001 inchangées ;
- les sept invariants comparatifs IMG 1.2.1 ;
- les non-régressions techniques accessibles sans franchir une gate échouée.

Elle ne qualifie ni `gemini-3.5-flash`, ni un autre modèle, ni un autre provider. Elle n'autorise ni publication, ni activation produit, ni acceptation humaine simulée.

## 4. Configuration provider

| Champ | Valeur observée |
|---|---|
| Provider | `GOOGLE_GEMINI` |
| Endpoint génération | `v1beta/models/{model}:generateContent` |
| Audit modèle | `v1beta/models` — HTTP 200 |
| Structured response | `application/json` + `responseJsonSchema` |
| Sampling historique | omis |
| `temperature` | `null` / `NOT_APPLICABLE` |
| Concurrence | 1 |
| Timeout | 90 s |
| Tentatives maximales | 4 par opération |

Les paramètres dépréciés `temperature`, `top_p` et `top_k` ne sont pas envoyés. La reproductibilité repose sur l'identité du modèle, les versions et digests des prompts, le schéma, les sorties structurées, le modèle canonique, les snapshots et le manifeste.

## 5. Modèle

L'API Models a exposé :

- API name : `models/gemini-3.5-flash-lite` ;
- display name : `Gemini 3.5 Flash Lite` ;
- version provider : `3.5-flash-lite-07-2026` ;
- méthodes : `generateContent`, `countTokens`, `createCachedContent`, `batchGenerateContent` ;
- limite d'entrée : 1 048 576 tokens ;
- limite de sortie : 65 536 tokens.

La documentation officielle de Google sur les modèles et les structured outputs a été vérifiée, puis la disponibilité a été confirmée par l'API réellement appelée. La qualification vaut uniquement pour l'identité et les digests du Campaign Manifest courant.

## 6. Rate limits observés

| Limite | Valeur |
|---|---:|
| RPM provider déclaré dans Google AI Studio | 15 |
| RPD provider déclaré dans Google AI Studio | 500 |
| RPM applicatif appliqué | 5 |
| Concurrence appliquée | 1 |
| Départs observés | 62 |
| HTTP 429 observés | 0 |

Le limiteur utilise une fenêtre glissante de 60 secondes et s'applique à chaque tentative, y compris un éventuel retry. La vitesse n'a pas été utilisée comme critère d'acceptation. La campagne a duré 734 secondes.

## 7. Stratégie retry

Les reprises sont réservées aux erreurs transitoires classifiées : rate limit transitoire, réseau, timeout et erreurs serveur. Les erreurs d'authentification, modèle, quota journalier, schéma, sécurité ou structured output invalide ne sont pas reprises silencieusement.

La campagne courante a produit :

- 0 retry ;
- 0 arrêt pour capacité ;
- 0 erreur provider ;
- 0 réparation de structured output.

## 8. Campagne immuable

| Élément gelé | Valeur |
|---|---|
| Campaign version | `SEM-001R2-CAMPAIGN-1.1` |
| Configuration digest | `ke1-3bb807034f670217` |
| Holdout corpus digest | `ke1-08392b87b2cc140b` |
| Gold frame digest | `ke1-34ef12e65473a7f2` |
| Validation file digest | `ke1-ad6dfe2f629e2343` |
| Reconstruction prompt | `SEM-001-RECONSTRUCTION-1.1` / `ke1-9de3ce71b2a628c5` |
| Critic prompt | `SEM-001-CRITIC-1.1` / `ke1-c0446a13dd0464f7` |
| Evaluator | `SEM-001-EVALUATOR-1.1` |
| Provider schema digest | `ke1-c88b1c996bec518d` |

Les 30 Gold Semantic Frames n'ont pas été modifiés entre le démarrage et la clôture. Chaque cas a été checkpointé atomiquement. Les fichiers de la première campagne restent disponibles comme état historique invalidé.

## 9. Structured output

Les 62 réponses attendues ont satisfait les schémas provider puis les contrats canoniques internes. Le diagnostic sécurisé n'a enregistré aucun `INVALID_STRUCTURED_OUTPUT`, aucun JSON brut invalide et aucun chemin de validation en erreur.

Le parser ne complète aucune propriété absente. Les données brutes structurées ne sont conservées dans l'artefact sécurisé que lorsqu'une erreur structurée le justifie ; aucune n'a été nécessaire dans cette campagne.

## 10. Résultats 30/30

| Résultat | Valeur |
|---|---:|
| Holdouts complets | 30/30 |
| Opérations principales | 62/62 |
| Reconstruction SUCCESS | 31/31, H29 comportant deux tours |
| Critique SUCCESS | 31/31, H29 comportant deux tours |
| Canonicalisation SUCCESS | 30/30 |
| Évaluation READY | 30/30 |
| Provider homogène | 30/30 Flash-Lite |

Le résultat technique complet n'est pas un résultat de compétence. H03 est le seul cas sans bloqueur absolu selon les Gold Frames et l'évaluateur courants.

## 11. Métriques

Les métriques conservent la convention historique de moyenne des rappels par cas. Le numérateur publié est donc la somme des ratios par cas et le dénominateur le nombre de cas applicables.

| Métrique centrale | Numérateur | Dénominateur | Score | Seuil | Résultat |
|---|---:|---:|---:|---:|---|
| Critical Semantic Recall | 15.2667 | 30 | 0.5089 | ≥ 0.98 | FAIL |
| Explicit Object Recall | 16.4667 | 30 | 0.5489 | ≥ 0.98 | FAIL |
| Explicit Relation Recall | 11.5000 | 30 | 0.3833 | ≥ 0.95 | FAIL |
| Comparator Preservation | 1 | 3 | 0.3333 | 1.00 | FAIL |
| Intervention Preservation | 3 | 4 | 0.7500 | 1.00 | FAIL |
| Modality Preservation | 5 | 5 | 1.0000 | 1.00 | PASS |
| Critical Unsupported Inference Rate | 2 | 30 | 0.0667 | 0 | FAIL |
| Generic-Domain Collapse Rate | 0 | 30 | 0 | 0 | PASS |
| Correction Propagation Rate | 1 | 1 | 1.0000 | 1.00 | PASS |
| Multi-turn critical context loss | 0 | 1 | 0 | 0 | PASS |

| Métrique complémentaire | Numérateur | Dénominateur | Score |
|---|---:|---:|---:|
| Semantic Drift Rate | 0.45 | 30 | 0.0150 |
| Unsupported Inference Rate | 0 | 30 | 0 |
| Ellipsis Detection Rate | 30 | 30 | 1.0000 |
| Ambiguity Preservation Rate | 26 | 30 | 0.8667 |
| Unnecessary Clarification Rate | 0 | 30 | 0 |
| Route Correctness | 26 | 30 | 0.8667 |

Comparaison avec la campagne invalidée : l'Explicit Object Recall passe de 0.2456 à 0.5489, l'Explicit Relation Recall de 0.0667 à 0.3833, le Critical Semantic Recall de 0.2000 à 0.5089, la Modality Preservation de 0.4000 à 1.0000, la Route Correctness de 0.4000 à 0.8667 et la perte critique multi-tour de 1 à 0. L'amélioration est réelle mais très insuffisante pour les seuils figés.

## 12. Erreurs par cas

| Cas | Object recall | Relation recall | Critical recall | Route | Bloqueurs | Classification primaire |
|---|---:|---:|---:|---|---:|---|
| SEM-H01 | 0.667 | 1.000 | 0.750 | PASS | 1 | PROMPT_FAILURE (1) |
| SEM-H02 | 1.000 | 0.000 | 0.800 | FAIL | 1 | PROMPT_FAILURE (1) |
| SEM-H03 | 1.000 | 1.000 | 1.000 | PASS | 0 | Aucune |
| SEM-H04 | 0.250 | 1.000 | 0.400 | PASS | 3 | PROMPT_FAILURE (3) |
| SEM-H05 | 0.750 | 0.000 | 0.600 | PASS | 2 | PROMPT_FAILURE (2) |
| SEM-H06 | 0.000 | 0.000 | 0.000 | PASS | 5 | PROMPT_FAILURE (5) |
| SEM-H07 | 0.750 | 1.000 | 0.800 | FAIL | 1 | PROMPT_FAILURE (1) |
| SEM-H08 | 0.000 | 1.000 | 0.200 | PASS | 5 | PROMPT_FAILURE (4) ; EVALUATOR_FAILURE (1) |
| SEM-H09 | 0.333 | 0.000 | 0.250 | PASS | 3 | PROMPT_FAILURE (3) |
| SEM-H10 | 0.250 | 0.000 | 0.200 | PASS | 4 | PROMPT_FAILURE (4) |
| SEM-H11 | 0.500 | 0.000 | 0.333 | FAIL | 2 | PROMPT_FAILURE (2) |
| SEM-H12 | 0.500 | 0.000 | 0.400 | PASS | 3 | PROMPT_FAILURE (3) |
| SEM-H13 | 0.750 | 0.500 | 0.667 | PASS | 2 | PROMPT_FAILURE (2) |
| SEM-H14 | 1.000 | 0.000 | 0.750 | PASS | 1 | PROMPT_FAILURE (1) |
| SEM-H15 | 1.000 | 0.000 | 0.800 | PASS | 1 | PROMPT_FAILURE (1) |
| SEM-H16 | 0.667 | 0.000 | 0.500 | PASS | 2 | PROMPT_FAILURE (2) |
| SEM-H17 | 0.000 | 0.000 | 0.000 | PASS | 6 | PROMPT_FAILURE (5) ; EVALUATOR_FAILURE (1) |
| SEM-H18 | 0.500 | 0.000 | 0.400 | PASS | 3 | PROMPT_FAILURE (3) |
| SEM-H19 | 0.500 | 1.000 | 0.600 | PASS | 2 | PROMPT_FAILURE (2) |
| SEM-H20 | 0.667 | 1.000 | 0.667 | PASS | 1 | PROMPT_FAILURE (1) |
| SEM-H21 | 0.750 | 0.000 | 0.600 | FAIL | 2 | PROMPT_FAILURE (2) |
| SEM-H22 | 0.200 | 0.000 | 0.167 | PASS | 5 | PROMPT_FAILURE (5) |
| SEM-H23 | 0.500 | 0.000 | 0.400 | PASS | 3 | PROMPT_FAILURE (3) |
| SEM-H24 | 0.600 | 1.000 | 0.667 | PASS | 2 | PROMPT_FAILURE (2) |
| SEM-H25 | 0.750 | 0.000 | 0.600 | PASS | 2 | PROMPT_FAILURE (2) |
| SEM-H26 | 0.000 | 0.000 | 0.000 | PASS | 5 | PROMPT_FAILURE (5) |
| SEM-H27 | 0.667 | 1.000 | 0.750 | PASS | 1 | PROMPT_FAILURE (1) |
| SEM-H28 | 0.500 | 1.000 | 0.667 | PASS | 2 | PROMPT_FAILURE (2) |
| SEM-H29 | 0.750 | 1.000 | 0.800 | PASS | 1 | PROMPT_FAILURE (1) |
| SEM-H30 | 0.667 | 0.000 | 0.500 | PASS | 2 | PROMPT_FAILURE (2) |

Le détail textuel de chaque bloqueur et son digest de modèle canonique se trouve dans `semantic-validation/sem-001r2/semantic-failures.json`.

## 13. Généralisation du diagnostic

Les défauts sont génériques, non lexicaux :

1. **Classification taxonomique instable — PROMPT_FAILURE.** Les concepts explicites sont souvent conservés textuellement mais rangés sous un type voisin : METHOD/MODALITY, BIOMARKER/METHOD, SCIENTIFIC_OBJECT/ENDPOINT ou INTERVENTION/COMPARATOR. Les seuils exigent le type du Gold Frame.
2. **Relations directes insuffisantes — PROMPT_FAILURE.** Le modèle réifie encore certaines comparaisons ou mesures dans un élément intermédiaire, change la direction, utilise une relation inférée ou omet l'arête directe attendue.
3. **Critique systématiquement inefficace — CRITIC_FAILURE contributif.** La seconde passe a retourné `ACCEPT`, zéro issue et aucune révision pour 30/30 cas malgré 73 bloqueurs détectés ensuite.
4. **Négations mal évaluées — EVALUATOR_FAILURE.** H08 et H17 conservent des exclusions explicites comme CONSTRAINT, mais le détecteur de forbidden inference retrouve lexicalement le concept interdit à l'intérieur de sa négation et produit deux faux positifs. Ces deux erreurs ne suffisent pas à expliquer le FAIL : les cinq autres seuils centraux restent très inférieurs aux exigences.

Aucun `GOLD_FRAME_ISSUE`, `CANONICALIZATION_FAILURE`, `KNOWLEDGE_ALIGNMENT_FAILURE` ou `DOWNSTREAM_FAILURE` n'est démontré comme cause primaire dans la campagne qualifiante. Les Gold Frames sont restés gelés. Aucun patch lexical ou règle spécifique à un terme de holdout n'a été ajouté.

## 14. Invariants IMG

Les sept invariants IMG 1.2.1 passent :

- CT / IRM ;
- T1 / T2 ;
- PET / CT ;
- Echo / CMR ;
- ADC / perfusion ;
- MRE / échographie ;
- DWI corps entier / PET PSMA.

Résultat : 7/7 PASS. La suite ciblée `downstream-diagnostics.test.ts` passe 10/10 et la suite IMG complète passe 60/60. Aucune nouvelle correction IMG n'a été effectuée.

## 15. Navigateur live

Statut : `BLOCKED_NOT_EXECUTED`.

Le protocole autorise A–E uniquement après réussite de la campagne sémantique. Cette condition est fausse. Aucun résultat `providerStatus = AVAILABLE`, `mode = LIVE_LLM` ou UX n'est donc revendiqué.

## 16. Diagnostic ST live

Statut : `BLOCKED_NOT_EXECUTED`.

Le modèle live n'a pas été accepté pour l'aval, car l'adaptateur ST exige un snapshot SEM `ACCEPTED`. Simuler une acceptation humaine pour franchir ce contrat aurait constitué une promotion silencieuse. La baseline fixture SEM → ST passe, mais sa valeur est uniquement une non-régression non live.

## 17. Diagnostic IMG live

Statut : `BLOCKED_NOT_EXECUTED`.

Les invariants fixtures démontrent que le transfert SEM → IMG conserve les comparaisons attendues lorsque l'entrée est correcte. Ils ne démontrent pas la fidélité d'un handoff produit depuis les Semantic Models live non qualifiés.

## 18. Diagnostic PRJ live

Statut : `BLOCKED_NOT_EXECUTED`.

La baseline fixture SEM → PRJ passe et conserve l'imagerie comme `REQUIRED_BUT_NOT_READY`. Aucun diagnostic live n'est revendiqué en l'absence de snapshot accepté.

## 19. UX

Les critères navigateur de langage libre, compréhension affichée, implicites séparés, clarification, Living View, correction multi-tour, historique, desktop, mobile et console n'ont pas été exécutés. Leur statut est `NOT_DEMONSTRATED`, et non PASS.

## 20. Non-régressions

| Validation | Résultat |
|---|---|
| Tests SEM-001 / SEM-001R / SEM-001R2 | 66/66 PASS |
| Invariants et diagnostics fixtures SEM → aval | 10/10 PASS |
| Suite IMG | 60/60 PASS |
| Typecheck | PASS |
| Lint | PASS, 0 erreur et 7 warnings Fast Refresh préexistants |
| Build production | PASS |
| Suite globale | 1099/1102 PASS |
| `git diff --check` | PASS |

Les trois échecs globaux sont les gardes externes préexistantes qui exigent un dépôt `editorial-engine` propre. Elles observent des modifications externes à NOXIA et indépendantes de SEM-001R2. Le dépôt externe n'a pas été modifié par cette mission.

## 21. Limitations

- Flash-Lite n'est pas qualifié pour SEM-001R2 avec les prompts et digests courants.
- La classification des types et la production de relations directes restent insuffisamment fiables.
- La seconde passe critique n'exerce pas son rôle de détection et correction.
- L'évaluateur confond encore deux négations explicites avec des inférences interdites ; corriger cette classe exigerait une nouvelle version d'évaluateur et une nouvelle campagne complète.
- Le navigateur A–E, l'UX réelle et les diagnostics live ST/IMG/PRJ restent non démontrés.
- Les warnings de build relatifs à la taille d'un chunk et aux données Browserslist sont périphériques, sans effet sur la décision sémantique.

## 22. Fichiers modifiés

Périmètre SEM-001R2 :

- `api/prompts/scientific-semantic-reconstruction-prompt.ts` ;
- `scripts/semantic-live-browser-server.ts` ;
- `src/features/scientific-semantic-reconstruction/provider.ts` ;
- `src/features/scientific-semantic-reconstruction/types.ts` ;
- `src/features/scientific-semantic-reconstruction/canonical.ts` ;
- `src/features/scientific-semantic-reconstruction/competence.ts` ;
- `src/features/scientific-semantic-reconstruction/manual/live-competence-campaign.manual.ts` ;
- `src/features/scientific-semantic-reconstruction/manual/rolling-rate-limiter.ts` ;
- tests provider, évaluateur, limiteur et diagnostics sous `src/features/scientific-semantic-reconstruction/__tests__/` ;
- neuf artefacts courants et neuf artefacts historiques sous `semantic-validation/sem-001r2/` ;
- le présent rapport.

Les modifications TMP-001 déjà présentes dans le worktree sont hors périmètre. Aucun commit, push, déploiement, publication ou modification du dépôt externe n'a été effectué.

## 23. Décision de qualification

Les conditions `CLOSED` et `CLOSED_WITH_PERIPHERAL_LIMITATIONS` ne sont pas satisfaites : plusieurs seuils centraux échouent, 73 bloqueurs absolus restent actifs, le navigateur A–E n'est pas exécuté et les diagnostics live ST/IMG/PRJ ne sont pas démontrés.

`SCIENTIFIC_SEMANTIC_RECONSTRUCTION_NOT_READY`
