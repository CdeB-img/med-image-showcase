# SEM-003B3 — Human Reference Review and Calibration Admission Report

**Version :** 1.0

**Date :** 13 août 2026

**Niveau :** NIVEAU_3 — rapport de gate documentaire

**Statut :** `HUMAN_REVIEW_GATE_REPORT`

**Décision :** `SEM003B3_HUMAN_REVIEW_PACKET_READY_DECISIONS_REQUIRED`

## 1. Résultat

La première exécution de SEM-003B3 s’arrête à la gate humaine prévue. Le paquet de revue est complet et déterministement vérifiable, mais aucune décision humaine n’est enregistrée. Aucun candidat Calibration n’est admis, rejeté ou promu. Aucune équivalence Development n’est décidée.

Ce résultat est un état de préparation, pas une admission Calibration, une calibration, une qualification scientifique ou un PASS sous PD-011.

## 2. Baseline préservée

| Élément | État observé | Effet SEM-003B3 |
|---|---|---|
| Corpus SEM-003B1 | 15 Development + 10 candidats Calibration | Inchangé |
| Review Queue B1 | 62 items `OPEN` | 62 liés, 0 résolu, 0 différé, 0 supprimé |
| Évaluateur SEM-003 | version 1.0.0 | Inchangé |
| Digest évaluateur | `13f2e4d0b57e200b53e3db52a4fa74cc346a0b65e82b96ac12ca82ba435767b5` | Inchangé |
| Calibration | 10/10 `DESIGN_ONLY` | 0 `CALIBRATION_VISIBLE` |
| Blind | absent | Aucun artefact créé |
| SEM runtime | non exécuté | Aucun appel LLM/provider |

L’évaluateur n’a été ni modifié, ni réparé, ni calibré. Son identité et son digest sont strictement ceux enregistrés par SEM-003B2.

## 3. Dossier humain produit

Le dossier comprend :

- 25 `HUMAN_REVIEW_UNIT`, une par Case réelle et sa version d’Acceptance Envelope ;
- 10 fiches humaines Calibration ;
- 5 fiches humaines d’équivalence Development ;
- 10 unités Development supplémentaires conservées sous forme machine pour couvrir toute la Review Queue ;
- une table consolidée des décisions attendues ;
- un registre de versions et digests des références courantes ;
- un contrat d’import des décisions humaines ;
- un mécanisme déterministe de révision, lineage, gate et promotion atomique ;
- un audit anti-overfitting.

Codex a préparé le dossier mais n’est enregistré comme reviewer dans aucune unité. Les comparaisons de parenté calculées sont exclusivement `REVIEW_ASSISTANCE_ONLY` : elles n’utilisent aucun seuil et ne concluent ni indépendance, ni contamination.

## 4. État de la revue humaine

| Compte | Valeur |
|---|---:|
| Review Units | 25 |
| Fiches prioritaires | 15 |
| Décisions humaines enregistrées | 0 |
| Items Review Queue ouverts | 62 |
| Items résolus | 0 |
| Items différés | 0 |
| Items rejetés | 0 |
| Équivalences résolues | 0/5 |
| Candidats Calibration admis | 0/10 |
| Candidats Calibration rejetés | 0/10 |
| Orientations spécialiste décidées | 0/10 |
| Versions de référence créées ou modifiées | 0 |

PD-011 exige une pluralité d’évaluateurs indépendants couvrant les compétences pertinentes pour une référence experte critique. Le contrat machine exige, pour chaque décision, reviewer stable, rôle, compétences, périmètre, rationale, date, conflit, sources et items concernés. Une identité pseudonymisée stable est recevable ; l’indépendance et les compétences ne sont jamais inférées.

## 5. Dix candidats Calibration

| Case | État | Revues ouvertes | Disposition humaine attendue |
|---|---|---:|---|
| `SEM3-CAL-ATRIAL-FIBROSIS-ABLATION` | `DESIGN_ONLY` | 4 | `CALIBRATION_VISIBLE` / `REJECTED` / `NEEDS_SPECIALIST_REVIEW` |
| `SEM3-CAL-CARDIO-RHYTHM-REMODELING` | `DESIGN_ONLY` | 4 | idem |
| `SEM3-CAL-CONGENITAL-FLOW-ELLIPSIS` | `DESIGN_ONLY` | 3 | idem |
| `SEM3-CAL-CORTISOL-SAMPLING-SUMMARY` | `DESIGN_ONLY` | 4 | idem |
| `SEM3-CAL-MSK-INFLAMMATION-RESPONSE` | `DESIGN_ONLY` | 3 | idem |
| `SEM3-CAL-NEURODEGENERATION-PROGRESSION` | `DESIGN_ONLY` | 4 | idem |
| `SEM3-CAL-ORGANOID-LIVE-SIGNAL-MEASUREMENT` | `DESIGN_ONLY` | 4 | idem |
| `SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY` | `DESIGN_ONLY` | 5 | idem ; contradiction terminologique ouverte |
| `SEM3-CAL-PULMONARY-HEMODYNAMICS-FOLLOWUP` | `DESIGN_ONLY` | 4 | idem |
| `SEM3-CAL-TRIAL-COMPARATOR-DECISION` | `DESIGN_ONLY` | 4 | idem |

Une disposition `CALIBRATION_VISIBLE` n’est applicable qu’après satisfaction de toutes les gates pertinentes et import de preuves humaines valides. Elle ne crée aucune éligibilité blind.

### Contradiction documentaire ouverte

La demande de `SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY` nomme l’échographie ovarienne, tandis que la description candidate de l’ambiguïté nomme l’IRM. Le dossier classe cet écart `DOCUMENTARY_MODALITY_TERM_MISMATCH_TO_REVIEW`. Il n’a pas été corrigé, car son arbitrage appartient à la revue humaine et toute révision doit créer une nouvelle version traçable.

## 6. Cinq équivalences Development

| Case | Candidats comparés | Level 1 | État humain |
|---|---|---|---|
| `SEM3-DEV-CT-FUNCTIONAL-ESTIMATE-ROLE` | baseline / distributed | PASS / PASS | `ADJUDICATION_REQUIRED` |
| `SEM3-DEV-OUTCOME-PRIORITY-CHANGE` | baseline / distributed | PASS / PASS | `ADJUDICATION_REQUIRED` |
| `SEM3-DEV-PERICARDIAL-FAT-NONCAUSAL` | baseline / distributed | PASS / PASS | `ADJUDICATION_REQUIRED` |
| `SEM3-DEV-RETINAL-VASCULAR-OUTCOME-UNKNOWN` | baseline / distributed | PASS / PASS | `ADJUDICATION_REQUIRED` |
| `SEM3-DEV-VALVE-HEMODYNAMICS-MULTIMODAL` | baseline / distributed | PASS / PASS | `ADJUDICATION_REQUIRED` |

Le Level 1 établit uniquement l’égalité du vecteur critique déclaré. Il ne prouve ni équivalence scientifique, ni acceptabilité globale. Les conséquences scientifiques, statuts épistémiques, unknowns, ambiguïtés, clarification, ownership et provenance restent à adjuger.

## 7. Gates déterministes disponibles pour la reprise

Le mécanisme de reprise :

1. valide chaque décision contre le Case, l’Envelope et la Review Unit applicables ;
2. interdit une décision automatique ou attribuée à Codex ;
3. interdit la fermeture d’un item non lié ;
4. exige un delta déterministe pour toute révision ;
5. crée une version supérieure et conserve l’ancienne référence avec lineage et digests ;
6. exige la pluralité scientifique et toutes les revues applicables ;
7. bloque promotion, rejet incomplet, conflit non résolu ou besoin spécialiste ;
8. applique atomiquement, seulement après gates satisfaites, Case, registre et Review Queue ;
9. conserve l’inéligibilité blind ;
10. ne modifie jamais l’évaluateur ou SEM.

Ce mécanisme valide structure, traçabilité et cohérence de gate. Il ne produit aucun jugement scientifique.

## 8. Validation

| Contrôle | Résultat |
|---|---|
| Génération déterministe du paquet | PASS — 25 unités, 15 fiches prioritaires |
| Validation structurelle et de traçabilité | PASS — 0 erreur |
| Tests SEM-003B3 | PASS — B3-C01 à B3-C25, 25/25 |
| Review Queue | PASS — 62/62 items liés exactement une fois |
| Frontière Calibration | PASS — 10/10 `DESIGN_ONLY`, 0 promotion |
| Frontière équivalence | PASS — 5/5 `ADJUDICATION_REQUIRED` |
| Frontière anti-overfitting | PASS — aucune adaptation de référence à une sortie observée |
| Évaluateur | PASS — version et digest inchangés |
| SEM / provider | PASS — non exécuté, 0 appel |
| SEM-003A authoring | PASS — validation, 17/17 tests |
| SEM-003B1 corpus | PASS — validation, 20/20 tests |
| SEM-003B2 évaluateur | PASS — validation, 10/10 tests |
| Typecheck | PASS |
| Build | PASS — avertissements non bloquants de dépendances, Browserslist et taille de chunk |
| `git diff --check` | PASS |

## 9. Limites et action humaine requise

Restent entièrement humains :

- la validation scientifique des références ;
- l’adjudication méthodologique et des ambiguïtés ;
- la conclusion de parenté et contamination ;
- l’équivalence scientifique des cinq paires ;
- la déclaration des compétences, conflits et indépendance ;
- la recommandation finale par candidat Calibration.

La prochaine reprise devra importer ces décisions sans modifier rétroactivement les références historiques, relancer les gates, produire les versions nécessaires, puis seulement recalculer le Calibration Reference Set admissible.

## 10. Décision finale

`SEM003B3_HUMAN_REVIEW_PACKET_READY_DECISIONS_REQUIRED`

**Prochaine étape exacte :** `HUMAN REVIEW OF SEM-003B3 PACKET`

STOP. Aucune calibration, aucun blind, aucun runtime SEM, aucun appel LLM/provider, aucune décision PASS/FAIL et aucune modification fonctionnelle n’ont été réalisés.
