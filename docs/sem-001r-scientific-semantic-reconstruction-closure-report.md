# SEM-001R — Scientific Semantic Reconstruction Closure Report

**Nature :** rapport d’implémentation, de diagnostic et de décision de fermeture
**Date :** 11 août 2026
**Contrat SEM :** 1.0
**Schéma :** `SEM-001-1.0`
**Baseline Git :** `d3de7ad603031acb8703cded7e5f00c24719be37`
**Décision :** `SCIENTIFIC_SEMANTIC_RECONSTRUCTION_NOT_READY`

Ce rapport décrit l’état réellement observé. Il ne constitue ni un `PASS` PD-011, ni une validation scientifique, ni une autorisation de publication, de déploiement ou d’usage clinique.

## 1. Décision

La fermeture est refusée. Les défauts locaux identifiés par SEM-001R ont été traités : les échecs fournisseur sont classifiés et tracés, les reprises sont bornées, la campagne est séquentielle, et la perte CT ainsi que la perte de relation comparative dans le transfert SEM → IMG sont corrigées.

La compétence live reste toutefois non démontrée : la passe complète n’a produit que 6 résultats exploitables sur 30, une sortie structurée était invalide et les autres appels ont rencontré une limite fournisseur HTTP 429. Les métriques de fermeture ne peuvent donc pas être calculées. Le navigateur live A–E n’est pas démontré. Ces deux conditions imposent `NOT_READY`.

## 2. Baseline

- dépôt : `noxia-dev` ;
- branche observée : `sem-001r-closure` ;
- commit de départ : `d3de7ad603031acb8703cded7e5f00c24719be37` ;
- index documentaire consulté intégralement : version 1.25 ;
- SEM-001 initial : 3/30 résultats live, 27 erreurs fournisseur génériques et perte CT dans le transfert direct SEM → IMG ;
- travaux TMP-001 déjà présents et préservés hors périmètre ;
- dépôt externe `editorial-engine` déjà modifié, inspecté en lecture seule et non modifié par cette mission ;
- aucun commit, push ou déploiement effectué.

## 3. Blocages SEM-001

| Blocage initial | État SEM-001R | Preuve |
|---|---|---|
| 27 échecs fournisseur non qualifiés | Corrigé localement | Taxonomie, détails HTTP sûrs et traces par tentative |
| Concurrence de campagne | Corrigé localement | Concurrence 1 et appels séquentiels |
| Absence de stratégie de reprise | Corrigé localement | Trois tentatives maximum, uniquement pour les erreurs transitoires |
| Modèle configuré non audité | Corrigé localement | Audit `v1beta/models` HTTP 200 |
| CT perdu par SEM → IMG | Corrigé localement | Invariants comparatifs et tests aval |
| Relation comparative classée comme contrainte | Corrigé localement | `scientificRelationships` séparé de `knownConstraints` |
| 30/30 live non démontré | Bloquant | 6/30 dans la passe complète |
| Navigateur A–E live non démontré | Bloquant | Cas A renvoyé en mode de continuité après échec fournisseur |

## 4. Diagnostic provider

Les erreurs sont désormais distinguées selon les catégories suivantes : `AUTHENTICATION`, `INVALID_MODEL`, `RATE_LIMIT`, `QUOTA`, `TIMEOUT`, `NETWORK`, `SERVER_ERROR`, `INVALID_STRUCTURED_OUTPUT`, `SCHEMA_REJECTION`, `PROMPT_TOO_LARGE`, `SAFETY_REFUSAL`, `CLIENT_ERROR` et `UNKNOWN_PROVIDER_FAILURE`.

Le diagnostic réel a établi deux classes actives :

- `INVALID_STRUCTURED_OUTPUT` sur SEM-H07 : HTTP 200, mais la reconstruction ne satisfaisait pas le contrat SEM ;
- `RATE_LIMIT` sur les autres échecs : HTTP 429, `RESOURCE_EXHAUSTED`, métrique `generate_content_free_tier_requests`, limite déclarée 20 et délai de reprise explicite.

La première sortie avait nommé ces 429 `QUOTA`, car le texte fournisseur mentionnait génériquement le plan et la facturation. Cette règle a été corrigée : une limite positive accompagnée de `RetryInfo` est transitoire ; un quota nul, journalier ou explicitement épuisé reste `QUOTA` et n’est pas rejoué.

## 5. Correction provider

Le fournisseur conserve maintenant, sans clé ni charge utile sensible : début et fin de tentative, latence, résultat, catégorie, statut HTTP, statut et code fournisseur, message borné et caractère rejouable. Les échecs de schéma exposent seulement les chemins et codes de validation, pas la réponse brute.

Les erreurs déterministes ne sont jamais rejouées : authentification, modèle invalide, quota non transitoire, réponse structurée invalide, schéma rejeté, prompt trop grand, refus de sûreté et erreur client. Les timeouts, erreurs réseau, 5xx et limites transitoires peuvent être rejoués dans la borne configurée.

## 6. Modèle réellement utilisé

| Élément | Valeur observée |
|---|---|
| Fournisseur | `GOOGLE_GEMINI` |
| Modèle configuré et appelé | `gemini-3.5-flash` |
| Endpoint d’audit | `v1beta/models` |
| Résultat de l’audit | HTTP 200 |
| Modèle présent | Oui |
| Capacité requise | `generateContent` présente |
| Température | 0 |
| Prompt reconstruction | `SEM-001-RECONSTRUCTION-1.0` |
| Prompt critique | `SEM-001-CRITIC-1.0` |
| Schéma | `SEM-001-1.0` |

L’hypothèse `INVALID_MODEL` est rejetée par l’audit réel.

## 7. Retry / concurrency

- concurrence : 1 ;
- ordre : holdouts H01 à H30, sans retrait ni permutation ;
- intervalle minimum entre appels : 4 100 ms ;
- timeout par appel : 45 000 ms ;
- tentatives maximales : 3 ;
- backoff exponentiel borné ;
- prise en compte de `Retry-After` et de Google `RetryInfo.retryDelay` ;
- compteur et détail des tentatives conservés dans le snapshot d’exécution ;
- aucune reprise sur un échec déterministe.

La relance de contrôle après correction de `RetryInfo` a épuisé trois tentatives sur chacun de H01 à H06. La fermeture étant déjà impossible pour cette passe, elle a été interrompue après H06 afin de ne pas multiplier des appels externes sans bénéfice décisionnel.

## 8. Réparation SEM → IMG

La correction appartient à Imagerie, pas à SEM. `buildImagingDesignInput` construit désormais les préférences de méthode à partir des méthodes ST, de l’équipement déclaré et des termes participant aux relations transmises. Elle ne dépend donc plus uniquement d’une liste lexicale de modalités.

Les relations sont conservées dans `scientificRelationships`. Elles ne sont plus mélangées aux contraintes. Le digest de l’entrée inclut les méthodes, relations et contraintes. Le contrat Imagerie passe de 1.2.0 à 1.2.1, sans sélection automatique de modalité ni altération de la science canonique.

## 9. Invariants comparatifs

Les tests démontrent la conservation des deux extrémités et de la relation `COMPARES_WITH` pour :

| Couple | Méthodes conservées | Relation conservée | Résultat |
|---|---:|---:|---|
| CT / IRM | Oui | Oui | PASS |
| T1 / T2 | Oui | Oui | PASS |
| PET / CT | Oui | Oui | PASS |
| Echo / CMR | Oui | Oui | PASS |
| ADC / perfusion | Oui | Oui | PASS |
| Élastographie par résonance magnétique / élastographie ultrasonore | Oui | Oui | PASS |
| DWI corps entier / PET PSMA | Oui | Oui | PASS |

Les deux derniers couples servent de holdouts de généralisation de la règle locale ; aucune règle lexicale spécifique n’a été ajoutée pour eux.

## 10. Campagne holdout

La passe complète a exécuté exactement les 30 `HOLDOUT_CASES`, sans modifier les cas, les gold frames, les seuils, les prompts ou la partition après observation. Elle a produit 6 résultats complets. Les métriques n’ont pas été calculées sur ce sous-ensemble.

| caseId | requestStarted | reconstructionStatus | criticStatus | providerStatus | HTTP / erreur provider | retryCount | latencyMs | finalStatus |
|---|---|---|---|---|---|---:|---:|---|
| SEM-H01 | 2026-08-11T00:05:41.083Z | SUCCESS | SUCCESS | AVAILABLE | — | 0 | 24573 | COMPLETE |
| SEM-H02 | 2026-08-11T00:06:05.656Z | SUCCESS | SUCCESS | AVAILABLE | — | 0 | 23365 | COMPLETE |
| SEM-H03 | 2026-08-11T00:06:29.021Z | SUCCESS | SUCCESS | AVAILABLE | — | 0 | 22269 | COMPLETE |
| SEM-H04 | 2026-08-11T00:06:51.290Z | SUCCESS | SUCCESS | AVAILABLE | — | 0 | 23292 | COMPLETE |
| SEM-H05 | 2026-08-11T00:07:14.582Z | SUCCESS | SUCCESS | AVAILABLE | — | 0 | 21987 | COMPLETE |
| SEM-H06 | 2026-08-11T00:07:36.569Z | SUCCESS | SUCCESS | AVAILABLE | — | 0 | 23045 | COMPLETE |
| SEM-H07 | 2026-08-11T00:07:59.615Z | FAILED | NOT_STARTED | FAILED | 200 / INVALID_STRUCTURED_OUTPUT | 0 | 12715 | FAILED |
| SEM-H08 | 2026-08-11T00:08:12.330Z | SUCCESS | FAILED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 15273 | FAILED |
| SEM-H09 | 2026-08-11T00:08:27.603Z | SUCCESS | FAILED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 17440 | FAILED |
| SEM-H10 | 2026-08-11T00:08:45.043Z | FAILED | NOT_STARTED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 4098 | FAILED |
| SEM-H11 | 2026-08-11T00:08:49.141Z | FAILED | NOT_STARTED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 4112 | FAILED |
| SEM-H12 | 2026-08-11T00:08:53.253Z | FAILED | NOT_STARTED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 4071 | FAILED |
| SEM-H13 | 2026-08-11T00:08:57.324Z | FAILED | NOT_STARTED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 4201 | FAILED |
| SEM-H14 | 2026-08-11T00:09:01.525Z | FAILED | NOT_STARTED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 4001 | FAILED |
| SEM-H15 | 2026-08-11T00:09:05.526Z | FAILED | NOT_STARTED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 4150 | FAILED |
| SEM-H16 | 2026-08-11T00:09:09.676Z | FAILED | NOT_STARTED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 4134 | FAILED |
| SEM-H17 | 2026-08-11T00:09:13.810Z | FAILED | NOT_STARTED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 4010 | FAILED |
| SEM-H18 | 2026-08-11T00:09:17.820Z | FAILED | NOT_STARTED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 4169 | FAILED |
| SEM-H19 | 2026-08-11T00:09:21.989Z | FAILED | NOT_STARTED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 4055 | FAILED |
| SEM-H20 | 2026-08-11T00:09:26.044Z | FAILED | NOT_STARTED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 4233 | FAILED |
| SEM-H21 | 2026-08-11T00:09:30.277Z | FAILED | NOT_STARTED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 3952 | FAILED |
| SEM-H22 | 2026-08-11T00:09:34.229Z | FAILED | NOT_STARTED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 4176 | FAILED |
| SEM-H23 | 2026-08-11T00:09:38.405Z | FAILED | NOT_STARTED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 4049 | FAILED |
| SEM-H24 | 2026-08-11T00:09:42.454Z | FAILED | NOT_STARTED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 4147 | FAILED |
| SEM-H25 | 2026-08-11T00:09:46.601Z | FAILED | NOT_STARTED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 4048 | FAILED |
| SEM-H26 | 2026-08-11T00:09:50.649Z | FAILED | NOT_STARTED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 4162 | FAILED |
| SEM-H27 | 2026-08-11T00:09:54.812Z | FAILED | NOT_STARTED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 4025 | FAILED |
| SEM-H28 | 2026-08-11T00:09:58.837Z | FAILED | NOT_STARTED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 4185 | FAILED |
| SEM-H29 | 2026-08-11T00:10:03.022Z | FAILED | NOT_STARTED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 4058 | FAILED |
| SEM-H30 | 2026-08-11T00:10:07.080Z | FAILED | NOT_STARTED | FAILED | 429 / RESOURCE_EXHAUSTED / RATE_LIMIT | 0 | 4070 | FAILED |

Note : les lignes 429 restituent la qualification corrigée. La sortie brute de cette passe les avait initialement nommées `QUOTA`; les statuts HTTP, fournisseur, limites et délais n’ont pas été altérés.

## 11. Résultats 30/30

| Exigence | Résultat |
|---|---|
| Cas prévus | 30 |
| Cas effectivement appelés | 30 |
| Résultats exploitables | 6 |
| Résultats requis | 30 |
| Complétude | 20 % |
| Verdict | NOT_DEMONSTRATED |

La relance avec reprises corrigées a confirmé la persistance de la limite sur H01–H06 ; elle n’a produit aucun résultat complet. La condition 30/30 n’est pas satisfaite.

## 12. Métriques

Aucune des métriques suivantes n’est publiée sur un sous-ensemble : Explicit Object Recall, Explicit Relation Recall, Critical Semantic Recall, Comparator Preservation, Intervention Preservation, Modality Preservation, Semantic Drift Rate, Unsupported Inference Rate, Critical Unsupported Inference Rate, Ellipsis Detection Rate, Ambiguity Preservation Rate, Unnecessary Clarification Rate, Route Correctness, Correction Propagation Rate, Multi-turn Context Preservation et Generic-Domain Collapse Rate.

| Seuil de fermeture | Valeur | Statut |
|---|---:|---|
| Critical Semantic Recall ≥ 0,98 | Non calculable | NOT_DEMONSTRATED |
| Explicit Object Recall ≥ 0,98 | Non calculable | NOT_DEMONSTRATED |
| Explicit Relation Recall ≥ 0,95 | Non calculable | NOT_DEMONSTRATED |
| Comparator Preservation = 1,00 | Non calculable | NOT_DEMONSTRATED |
| Intervention Preservation = 1,00 | Non calculable | NOT_DEMONSTRATED |
| Modality Preservation = 1,00 | Non calculable | NOT_DEMONSTRATED |
| Critical Unsupported Inference Rate = 0 | Non calculable | NOT_DEMONSTRATED |
| Generic-Domain Collapse Rate = 0 | Non calculable | NOT_DEMONSTRATED |
| Correction Propagation Rate = 1,00 | Non calculable | NOT_DEMONSTRATED |
| Multi-turn critical context loss = 0 | Non calculable | NOT_DEMONSTRATED |

Aucun seuil n’a été abaissé.

## 13. Cas bloquants

- SEM-H07 : sortie structurée non conforme ; aucune reprise, conformément à la règle déterministe ;
- SEM-H08 à SEM-H30 : limite fournisseur transitoire pendant la passe complète ;
- relance H01 à H06 : trois tentatives par cas, toujours limitées ;
- navigateur A–E : impossible de recevoir un modèle `LIVE_LLM` pendant la fenêtre de validation ;
- métriques : interdites sur 6/30 ;
- aucun défaut de conservation comparatif local ne subsiste dans les tests, mais le live ne permet pas d’exclure un blocage absolu sur les 30 holdouts.

## 14. Cas carotidien

Le cas A est présent dans l’interface et dans les cas de compétence. Le navigateur desktop l’a envoyé au véritable endpoint. Après épuisement des reprises fournisseur, la réponse a été `DEGRADED` : le texte original est conservé et aucune compréhension équivalente n’est revendiquée. L’ellipse, la comparaison/évaluation et la clarification utile ne sont donc pas démontrées en live.

## 15. Cas reperfusion

Les contrats et fixtures locales conservent stent immédiat, stent différé, leur comparaison, l’IRM et les lésions, tout en séparant les candidats implicites. Le cas navigateur live B n’a pas été poursuivi après l’échec live du cas A et la persistance démontrée de la limite. Statut : localement couvert, live non démontré.

## 16. Cas question complète

Le cas complet STEMI, 5 jours, taille d’infarctus, LGE, stenting immédiat/différé et MVO secondaire possède un gold frame qui interdit les clarifications redondantes. Les tests techniques de contrat passent. Le cas navigateur live C n’est pas démontré pendant cette mission.

## 17. Correction multi-tour

Les tests de correction conservent l’historique, la provenance et le contexte, et permettent de remplacer une priorité sans réécrire l’ancien état. SEM-H29 n’a pas produit de modèle live à cause de la limite fournisseur. Le cas navigateur D n’est donc pas démontré et `Correction Propagation Rate` reste non calculable.

## 18. Navigateur live

Un serveur local dédié a servi la SPA et le véritable `/api/scientific-semantic`, avec la clé uniquement côté serveur. Le cas A desktop 1440×1000 a réellement attendu les reprises puis affiché honnêtement le mode de continuité. Ce résultat démontre le raccordement réel et la sûreté du fallback, pas la compétence live.

Le contrôle mobile 390×844 démontre : largeur document 390 px, aucun débordement horizontal, Conversation visible, Projet en construction visible, audit expert secondaire, aucun champ Actor ou Mandate. Les cas A–E avec réponses `LIVE_LLM` ne sont pas démontrés. Le critère navigateur de fermeture échoue.

## 19. ST diagnostic

| Engine | Input semantically correct? | Output faithful? | Critical information lost? | Unsupported inference? | Status |
|---|---:|---:|---:|---:|---|
| ST | Oui | Oui sur les diagnostics déterministes | Non observée | Non observée | PASS_LOCAL |

Le snapshot SEM, les modalités et la relation comparative sont conservés. Aucun choix méthodologique automatique n’est introduit.

## 20. IMG diagnostic

| Engine | Input semantically correct? | Output faithful? | Critical information lost? | Unsupported inference? | Status |
|---|---:|---:|---:|---:|---|
| IMG | Oui | Oui après correction 1.2.1 | Non sur les sept invariants | Non observée | PASS_LOCAL |

CT, IRM et leur relation sont conservés. La relation n’est plus qualifiée de contrainte et aucune modalité n’est automatiquement adoptée.

## 21. PRJ diagnostic

| Engine | Input semantically correct? | Output faithful? | Critical information lost? | Unsupported inference? | Status |
|---|---:|---:|---:|---:|---|
| PRJ | Oui | Oui sur les diagnostics déterministes | Non observée | Non observée | PASS_LOCAL |

Le contexte comparatif est conservé et l’imagerie spécialisée non prête reste `REQUIRED_BUT_NOT_READY`. Project truth n’est pas remplacée par une projection SEM ou IMG.

## 22. UX

L’interface demeure Conversation + Projet en construction, avec Audit / mode expert secondaire. Elle accepte le langage libre, affiche l’historique et les corrections, n’expose pas Actor ou Mandate dans le parcours standard et ne remet pas les états internes au premier plan. Le mode de continuité explique explicitement qu’il n’est pas équivalent à la compréhension avancée.

## 23. Tests

| Validation | Résultat |
|---|---|
| SEM-001 / SEM-001R | 59/59 |
| Taxonomie/retry provider | 12/12 |
| IMG | 60/60 |
| SYS-001 / SYS-001B | 34/34 |
| Campagne ciblée Intake/Protocol Designer, Knowledge/External Evidence, ST, IMG/IMG-001B, PRJ, SYS, TMP, DOC-001, DOC-002, REG-001 | 521/521 après alignement du contrat IMG 1.2.1 |
| Typecheck application | PASS |
| Typecheck TMP-001 | PASS |
| Lint | PASS, 0 erreur et 7 avertissements Fast Refresh préexistants |
| Build production | PASS |
| Git diff whitespace | PASS |
| Navigateur desktop | Endpoint réel atteint ; compétence live non démontrée |
| Navigateur mobile | Responsive PASS ; compétence live non démontrée |
| Suite globale | 1092/1095 |

Les trois échecs globaux sont exclusivement les gardes historiques qui exigent un dépôt externe `editorial-engine` propre. Son état sale préexistait et il n’a pas été modifié par cette mission.

## 24. Non-régressions

Sont préservés par les contrats et suites locales : `originalRequest`, historique sémantique, statuts épistémiques, provenance Knowledge, corrections utilisateur, Project truth unique, TMP-001, DOC-002, REG-001, unknowns, contradictions, versioning, progressive disclosure, absence de publication et absence de `PASS` PD-011.

Aucun gold frame, cas holdout, seuil ou route publique n’a été modifié. Aucun changement n’a été apporté au dépôt externe `editorial-engine`.

## 25. Limitations

1. La limite externe `generate_content_free_tier_requests` empêche une campagne 30/30 avec reconstruction et critique indépendantes.
2. SEM-H07 a produit une reconstruction ne satisfaisant pas le schéma ; le détail de chemin sera disponible lors d’une prochaine occurrence grâce au diagnostic ajouté.
3. Les métriques de compétence restent non démontrées.
4. Les cas navigateur A–E ne sont pas démontrés avec `LIVE_LLM`.
5. Le dépôt externe `editorial-engine` reste sale et déclenche trois gardes globales périphériques préexistantes.
6. Les sept avertissements lint Fast Refresh et l’avertissement de taille du bundle sont non bloquants et préexistants.

## 26. Fichiers modifiés

Périmètre SEM-001R :

- `src/features/scientific-semantic-reconstruction/types.ts` ;
- `src/features/scientific-semantic-reconstruction/provider.ts` ;
- `src/features/scientific-semantic-reconstruction/canonical.ts` ;
- `src/features/scientific-semantic-reconstruction/server.ts` ;
- `src/features/scientific-semantic-reconstruction/manual/live-competence-campaign.manual.ts` ;
- `src/features/scientific-semantic-reconstruction/__tests__/provider.test.ts` ;
- `src/features/scientific-semantic-reconstruction/__tests__/downstream-diagnostics.test.ts` ;
- `src/features/imaging-study-designer/input.ts` ;
- `src/features/imaging-study-designer/types.ts` ;
- `src/features/system-integration/__tests__/contracts.test.ts` ;
- `src/features/system-integration/__tests__/end-to-end.test.ts` ;
- `scripts/semantic-live-browser-server.ts` ;
- `docs/sem-001r-scientific-semantic-reconstruction-closure-report.md`.

Les autres changements visibles dans le worktree appartiennent aux travaux SEM-001 ou TMP-001 déjà présents. Ils n’ont été ni nettoyés, ni mis en index, ni committés.

## 27. Décision de fermeture

Les corrections provider et SEM → IMG sont localement validées, mais elles ne remplacent pas la preuve de compétence exigée. Une campagne live incomplète et un navigateur A–E live non démontré interdisent `CLOSED` et `CLOSED_WITH_PERIPHERAL_LIMITATIONS`.

`SCIENTIFIC_SEMANTIC_RECONSTRUCTION_NOT_READY`
