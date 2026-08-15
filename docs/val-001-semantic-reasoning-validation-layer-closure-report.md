# VAL-001 — Semantic Reasoning Validation Layer — Closure Report

## 1. Décision

`VAL001_VALIDATION_LAYER_CLOSED_WITH_LIVE_SEMANTIC_REVIEW_LIMITATION_READY_FOR_QRY001`

VAL-001 est fermée comme capability transverse V1 de niveau 3. La limitation résiduelle porte sur le reviewer sémantique live : il n'est ni techniquement démontré ni scientifiquement qualifié, reste `DISABLED_BY_DEFAULT`, et aucun gate V1 ne dépend silencieusement de son exécution.

## 2. Périmètre

La mission ferme le corridor de validation transverse des handoffs du Protocol Designer. Elle couvre les contrats, adapters read-only, runners déterministes, revue sémantique conditionnelle, frontière Human Review, findings, gates produit, synthèse UI et preuves locales. Elle ne qualifie ni un raisonnement scientifique, ni un modèle, ni une étude, ni un document, et ne constitue pas un PASS PD-011.

## 3. Autorités consultées

L'ordre de gouvernance appliqué est celui de `0. NOXIA — SOURCE-OF-TRUTH-INDEX.md`, puis de la Charte fondatrice, du Scientific Product Manifesto et de l'Editorial Engine Architecture Manifesto. Les contrats spécialisés consultés sont VAL-000, PD-003 V2 et sa compatibilité legacy, OBS-001, les autorités CDM/DM/BIOSTATISTICS/TMP/DOC applicables, Audit-D et les rapports de fermeture DAI/SEM. L'index n'a pas été modifié et aucune de ces autorités n'a été réécrite.

## 4. Commits Parts 2–4

| Partie | Commit | Décision démontrée |
|---|---|---|
| 2 | `f69c8727` | Contracts, registry et 11 adapters prêts |
| 3 | `6f1fe1a0` | Moteur déterministe et corridor A–J prêts |
| 4 | `103783e8` | Revue sémantique conditionnelle, Human Review, gates et UI prêts |

Le bloc historique BIOSTATISTICS/DAI apparu dans une ancienne sortie console n'a été trouvé dans aucun artefact VAL courant.

## 5. Architecture VAL-000 réutilisée

VAL-001 étend VAL-000 ; aucune seconde architecture de validation n'a été créée. Le flux demeure : contrat domaine → validator/invariant provider domaine → adapter VAL → comparaison transverse → observation/finding VAL. Les règles métier ne sont pas recodées dans le moteur transverse.

## 6. Checkpoint Registry

Le registre `VAL-001-CHECKPOINT-REGISTRY@1.0.0` contient 10 checkpoints versionnés, digest `val1-745da452f08facae`. Les anciennes significations A–G n'ont pas été réutilisées silencieusement ; le corridor courant est A–J.

## 7. Invariant Registry

Le registre `VAL-001-INVARIANT-REFERENCE-REGISTRY@1.0.0` référence 46 invariants auprès de leurs owners : 31 `DETERMINISTIC`, 13 `SEMANTIC_REVIEW` et 2 `HUMAN_ARBITRATION`. Son digest est `val1-4a9d5eaa744d6eee`. Onze adapters read-only rendent les artefacts observables sans transfert d'ownership.

## 8. Corridor A–J

Les dix handoffs Request → Interpretation → Thinking → OBS/Imaging → Project → Study Data → Data Management → Biostatistics → Template → Document/Product View sont représentés. Les sous-chaînes realized-time restent `NOT_APPLICABLE` ou `DEFERRED_TO_REALIZED_TIME` selon leurs contrats ; aucun runtime OBS V2 autonome n'a été créé.

## 9. Validation déterministe

Le runner construit des snapshots immuables, vérifie l'applicabilité, appelle les providers domaine disponibles, compare identités/versions/provenance/ownership, produit observations et findings, puis calcule une disposition bornée. Le corridor propre produit zéro faux finding critique. Toutes les violations critiques structurées injectées sont détectées. `UNKNOWN`, `NOT_GENERATABLE`, `NOT_APPLICABLE` et les différences légitimes restent visibles sans être converties en succès ni en échec sémantique arbitraire.

## 10. Revue sémantique

La revue S est déclenchable seulement après D insuffisant, sur snapshots figés, question précise et preuves minimisées. Le contrat sépare payload, configuration, raw-before-parse, validation structurée, résultat technique et résultat sémantique. Les fixtures couvrent `EQUIVALENT`, `PARTIALLY_EQUIVALENT`, `NOT_EQUIVALENT`, `AMBIGUOUS` et `INSUFFICIENT_EVIDENCE`. Le reviewer ne corrige ni source ni cible et n'adopte aucune décision.

## 11. Human Review

Les deux invariants H produisent des `ValidationHumanReviewRequest`. Une revue S ne peut pas les fermer. La résolution réutilise le Human Decision Envelope existant, vérifie request/run, target, acteur, mandat et provenance, conserve l'ancien run et crée une nouvelle preuve liée. La mutation éventuelle d'un Project appartient au Project owner et reste extérieure à VAL.

## 12. Audit-D / Audit-L

Audit-D reste un provider de findings ; ses guards ne sont ni recalculés ni dupliqués. Un finding Audit-D historique ne disparaît pas sans preuve explicite de résolution. Audit-L reste `SHADOW_ONLY_NOT_PRODUCT_ACTIVE`. SEM Full reste archivé, non nominal, avec rollback legacy disponible ; aucun critic, repair LLM ou adjudicator n'a été ajouté.

## 13. Product gates

Sept gates minces lisent les derniers ValidationRuns applicables : `CONTRIBUTION_ADOPTION`, `PROJECT_FREEZE`, `PROTOCOL_GENERATION`, `DMP_GENERATION`, `SAP_GENERATION`, `V1_READY` et `CANDIDATE_PREVIEW`. Les variantes clean, warning, critical, pending S, pending H, technical failure, `NOT_APPLICABLE`, `NOT_GENERATABLE` et checkpoint absent sont testées. Le preview reste possible et porte `PREVIEW`, `NOT_ADOPTED`, `NOT_PROJECT_TRUTH`. Aucun gate n'autorise une écriture Project ou Document.

La démonstration Protocol Designer ne possède pas encore de ValidationRun transverse persisté : ses gates officiels sont donc rendus `NOT_EVALUABLE`, et non artificiellement réussis. La projection affichée reste une prévisualisation de démonstration ; aucune action officielle n'est silencieusement autorisée.

## 14. UI

La surface minimale `Validation` est intégrée au Protocol Designer. Le mode standard expose état, blockers, revue nécessaire, unknowns, checkpoints incomplets, limites et disponibilité des actions en vocabulaire métier. Le mode expert expose runs, checkpoints, invariants, statuts technique/sémantique, digests et historique. Aucun score global, JSON, secret, auto-fix ou bouton d'acceptation IA n'est présenté.

## 15. Campagne locale

La campagne `VAL001-CLOSURE-LOCAL-01` est classée `LEVEL_3_CAPABILITY_VALIDATION_EVIDENCE`. Elle utilise uniquement 60 cas synthétiques visibles `VAL-C01` à `VAL-C60`, plus deux assertions de clôture. Résultat : 60/60 cas PASS, 2/2 assertions PASS, 0 skipped, 0 mutation, 0 Blind, 0 donnée patient. Les preuves sont conservées sous `validation/val-001-closure/`.

## 16. Smoke live

Décision : `LIVE_SEMANTIC_SMOKE_NOT_REQUIRED`.

Classification : `LIVE_SEMANTIC_REVIEW_NOT_REQUIRED_FOR_V1_CAPABILITY_CLOSURE`.

Le chemin live n'est pas une dépendance V1 : D assure les conclusions structurelles prouvables, H reste disponible pour l'arbitrage, et les demandes S non exécutées restent ouvertes. Aucun appel externe n'a donc été autorisé ou lancé. Aucune qualification du reviewer n'est revendiquée.

## 17. Provider accounting

| Compteur | Valeur |
|---|---:|
| Appels provider live | 0 |
| Fixture semantic reviews | 10 |
| Fixture transport operations | 2 |
| Invalid structured outputs | 1 |
| Provider unavailable fixtures | 1 |
| Cache hits | 0 |

Les deux opérations de transport sont locales et synthétiques ; elles ne sont pas des appels provider.

## 18. Call-avoidance accounting

| Classe | Valeur | Interprétation |
|---|---:|---|
| `NOT_REQUIRED` | 10 | checkpoints du corridor propre conclus sans S |
| `AVOIDED` | 0 | aucun appel hypothétique n'est compté sans preuve stricte |
| `DEFERRED` | 1 | demande S conservée, provider désactivé |
| `CACHED` | 0 | aucun résultat live réutilisé |

Ces classes restent séparées ; `NOT_APPLICABLE` et H direct ne sont pas comptés comme appels évités.

## 19. Replay

Deux passes logiques conservent les mêmes snapshots, configuration, observations, findings, demandes, gates et résumé hors timestamps explicitement exclus. Le `resultDigest` d'un replay identique reste identique. Une variation de source, cible, checkpoint ou configuration produit une autre identité ; aucun checkpoint COMPLETE n'est rejoué comme une nouvelle preuve.

## 20. Safety boundaries

`PROJECT_WRITES_BY_VAL = 0`, `SOURCE_MUTATIONS = 0`, `TARGET_MUTATIONS = 0`, `AUTO_FIXES = 0`, `AUTO_DECISIONS = 0`, `PATIENT_DATA = 0`, `FRESH_BLIND = 0`, `PD011_PASS_CLAIMS = 0`. La canonicalisation et l'évaluation ne complètent aucune valeur manquante. Le provider reste désactivé par défaut, sans fallback modèle ni repair loop.

## 21. Validation ciblée

La sélection couvrant VAL Parts 2–5, Scientific Interpretation, SEM legacy/Audit, Scientific Thinking, Imaging/OBS, Research Project, Human Decision, DAI, CDM/DM/BIOSTATISTICS, TMP/DOC, SYS-001B et Protocol Designer totalise 1 408/1 408 tests PASS. VAL seul totalise 364/364 PASS : VAL-000 26, Part 2 89, Part 3 95, Part 4 92, Part 5 62. Typecheck, build, lint ciblé et `git diff --check` passent.

## 22. Suite globale

| Passed | Failed | Skipped | Total |
|---:|---:|---:|---:|
| 2070 | 3 | 0 | 2073 |

Les trois échecs sont exclusivement les guards de propreté du checkout externe `editorial-engine` dans `scientific-knowledge-graph-web.test.mjs`, `scientific-corpus.test.mjs` et `scientific-multidomain.test.mjs`. Aucun nouvel échec n'est attribuable à VAL-001. La suite globale n'est donc pas présentée comme entièrement verte.

## 23. Limites externes et historiques connues

- Reviewer sémantique live non démontré et non qualifié ; désactivé par défaut, non bloquant pour les gates V1.
- La démonstration UI n'attache pas encore un historique persistant de ValidationRuns ; l'absence est rendue `NOT_EVALUABLE`.
- Les validateurs documentaires gelés DM-001 et BIOSTATISTICS-001 demeurent hors périmètre.
- Les trois guards de propreté `editorial-engine` restent externes et préexistants ; le checkout protégé n'a pas été modifié.

## 24. Matrice de non-régression

| Contract | Preserved | Proof/Test | Limitation |
|---|---|---|---|
| VAL read-only | Oui | VAL-C01, C43, C57, C60 | aucune écriture autorisée |
| Project single source of truth | Oui | VAL-C02, C03, C43 | mutation hors VAL seulement |
| Human Decision ownership | Oui | VAL-C41–C43 | acteur/mandat requis |
| OBS ownership | Oui | VAL-C07, C08 | aucun runtime OBS V2 |
| CanonicalVariable identity | Oui | VAL-C04, C05 | équivalence différente passe par S |
| expected vs realized | Oui | VAL-C09–C12 | realized-time hors V1 lorsque applicable |
| planned vs realized | Oui | VAL-C11, C12 | aucune exécution inventée |
| factual vs analytical missingness | Oui | VAL-C15, C16 | owners domaine conservés |
| Endpoint/Estimand/Model separation | Oui | VAL-C13, C14 | aucune fusion implicite |
| projection-only | Oui | VAL-C24–C27 | preview non officielle |
| NOT_GENERATABLE | Oui | VAL-C24, C53, C54 | reste sectionnel |
| unknown preservation | Oui | VAL-C21–C23, C55 | pas de complétion |
| Audit-D ownership | Oui | VAL-C28–C31 | résolution explicite requise |
| Audit-L shadow-only | Oui | tests statiques Part 4/5 | non actif V1 |
| SEM Full archived | Oui | non-régression SEM | rollback legacy seulement |
| D before S | Oui | VAL-C06, C32–C40 | S seulement si D insuffisant |
| H not replaced by S | Oui | VAL-C41, C42 | H automatiquement fermé = 0 |
| technical != semantic failure | Oui | VAL-C44–C47 | invalid output jamais accepté |
| no auto-fix | Oui | VAL-C60 | aucun contrôle de correction automatique |
| no provider fallback | Oui | configuration + tests | provider disabled by default |
| no PD-011 claim | Oui | manifestes campagne/clôture | niveau 3 seulement |

## 25. Limitations

VAL-001 établit une capability d'observation, de validation et de gating ; elle n'établit pas la justesse scientifique générale. La revue sémantique live devra faire l'objet d'une mission distincte si un futur gate la rend obligatoire. L'alimentation persistante de l'UI en ValidationRuns réels appartient à une intégration produit ultérieure ; l'état courant demeure fail-closed par `NOT_EVALUABLE`.

## 26. Relation à PD-011

Cette campagne n'est ni un protocole PD-011, ni une qualification de modèle, ni une preuve de généralisation. Les cas sont visibles et synthétiques. `V1_READY` signifie uniquement que les checkpoints techniques V1 peuvent permettre la poursuite produit ; il ne signifie jamais `SCIENTIFICALLY_VALIDATED` ou PASS PD-011.

## 27. Relation à QRY-001

VAL-001 peut exposer à QRY-001 les unknowns, findings non résolus, demandes S/H, décisions bloquantes ou invalidées, preuves manquantes, branches affectées, owners et conséquences de readiness. VAL-001 ne choisit pas la prochaine question. La mission suivante est uniquement `QRY-001 — INFORMATION GAIN ENGINE`.

## 28. Décision finale

Parts 2, 3, 4 et 5 sont présentes ; 45/45 gates de fermeture passent ; la campagne locale est 60/60 PASS ; les limites live et externes restent visibles et non bloquantes pour la capability V1.

`VAL001_VALIDATION_LAYER_CLOSED_WITH_LIVE_SEMANTIC_REVIEW_LIMITATION_READY_FOR_QRY001`
