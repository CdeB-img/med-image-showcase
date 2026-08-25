# W1-QUAL-01H1 — Scientific Thinking Human Review Packet

`LEVEL_3_IMPLEMENTATION_EVIDENCE — NON_NORMATIVE`

## Décision de préparation

`W1_QUAL_01H1_REVIEW_PACKET_NOT_READY`

**STATUT FAIL-CLOSED : ce document n'est pas admis pour l'adjudication H2.**

Ce document de diagnostic est destiné à Charles. Il présente 12 cas indépendants, leurs inputs Project + Knowledge gelés, la sortie unique de Scientific Thinking `1.2.1`, les traces techniques et les critères écrits avant observation. Le checker déterministe gelé a produit 25 échecs sur 11 cas ; conformément au contrat sans reroll ni repair, le paquet n'est pas déclaré prêt. Il ne contient aucune adjudication scientifique automatique.

`SCIENTIFIC_THINKING_CHARACTERIZED = NO`

`HUMAN_ADJUDICATION_COMPLETED = 0`

`HUMAN_ADJUDICATION_PENDING = 12`

## Comment utiliser ce document

Ce document permet d'inspecter les preuves produites, mais les champs H1–H8 doivent rester `PENDING` tant qu'une décision humaine de programme n'a pas statué sur le paquet non prêt. Pour chaque cas, la question, le Knowledge pack abrégé et la sortie ST sont conservés sans les transformer en verdict.

Les contrôles déterministes attestent uniquement leurs résultats enregistrés. Leurs trois incompatibilités d'attente sont documentées en annexe ; elles ne peuvent pas être corrigées après exposition. Elles ne prouvent ni un défaut ST, ni un Scientific PASS.

## Vue d'ensemble

| Cas | Domaine | Famille | Terminal technique | Revue humaine |
|---|---|---|---|---|
| `ST01H1-D-MPR-CMR-PET-COMPARATIVE-01` | CARDIOVASCULAR_PERFUSION | `COMPARATIVE_SUPPORTED` | `OWNER_RESULT_PRODUCED` | `PENDING` |
| `ST01H1-D-MAD-ARRHYTHMIA-PREDICTION-01` | CARDIOVASCULAR_ELECTROPHYSIOLOGY | `ASSOCIATION_PREDICTION` | `OWNER_RESULT_PRODUCED` | `PENDING` |
| `ST01H1-D-RVPA-EXERCISE-MECHANISM-01` | CARDIOVASCULAR_HEMODYNAMICS | `MECHANISTIC_EXPLANATORY` | `OWNER_RESULT_PRODUCED` | `PENDING` |
| `ST01H1-D-NEUROMELANIN-ALTERNATIVES-01` | NEURO_METABOLISM | `MULTIPLE_PLAUSIBLE_ALTERNATIVES` | `OWNER_RESULT_PRODUCED` | `PENDING` |
| `ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01` | NEURO_ONCOLOGY_METABOLISM | `KNOWLEDGE_CONTRADICTION` | `OWNER_RESULT_PRODUCED` | `PENDING` |
| `ST01H1-D-HYPERPOLARIZED-PYRUVATE-GAP-01` | NEURO_METABOLISM | `KNOWLEDGE_INSUFFICIENT` | `OWNER_RESULT_PRODUCED` | `PENDING` |
| `ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01` | SPECTRAL_CT_PULMONARY | `PROJECT_UNKNOWN_STRUCTURING` | `OWNER_RESULT_PRODUCED` | `PENDING` |
| `ST01H1-D-PANCREAS-IODINE-NARROW-01` | SPECTRAL_CT_ABDOMINAL | `NARROW_APPLICABILITY` | `OWNER_RESULT_PRODUCED` | `PENDING` |
| `ST01H1-D-PREGNANCY-RADIATION-OWNERSHIP-01` | GENERAL_METHOD_SAFETY_ETHICS | `OUT_OF_ST_OWNERSHIP` | `OWNER_RESULT_PRODUCED` | `PENDING` |
| `ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01` | GENERAL_METHODOLOGY_MULTICENTER | `CONDITIONAL_CANDIDATE` | `OWNER_RESULT_PRODUCED` | `PENDING` |
| `ST01H1-D-CT-BMD-STALE-01` | SPECTRAL_CT_BONE | `FAIL_CLOSED_STALE_MISMATCH` | `EXPECTED_PRE_OWNER_REJECTION` | `PENDING` |
| `ST01H1-D-SINGLE-CENTER-RADIOMICS-NONPROMOTION-01` | GENERAL_METHODOLOGY_ONCOLOGY | `NO_EVIDENCE_PROMOTION` | `OWNER_RESULT_PRODUCED` | `PENDING` |

## 1. Réserve de perfusion myocardique : CMR et PET

**Cas :** `ST01H1-D-MPR-CMR-PET-COMPARATIVE-01`

**Domaine :** CARDIOVASCULAR_PERFUSION

**Famille :** `COMPARATIVE_SUPPORTED`

**Résumé :** Comparer deux estimations de réserve de perfusion sans les déclarer interchangeables.

### Entrée scientifique gelée

**Question Project**

> Chez des adultes avec angor sans sténose coronaire obstructive, la réserve de perfusion myocardique estimée en CMR est-elle associée à la réserve de flux myocardique estimée en PET ?

**Assertions pertinentes**

- Les estimations CMR et PET peuvent être comparées dans un contexte défini, mais leurs modèles, traceurs, acquisitions et traitements empêchent toute interchangeabilité automatique.

**Sources et références**

- RB-004@1.1

**Références de preuve**

- fixture-evidence:ST01H1-D-MPR-CMR-PET-COMPARATIVE-01

**Gaps**

- Aucun élément déclaré.

**Limitations**

- La comparabilité dépend des méthodes, de la population et de la référence; aucune supériorité n'est établie.

**Contradictions**

- Aucun élément déclaré.

### Sortie Scientific Thinking 1.2.1

**Questions candidates**

- Chez des adultes avec angor sans sténose coronaire obstructive, la réserve de perfusion myocardique estimée en CMR est-elle associée à la réserve de flux myocardique estimée en PET ? — TESTABLE_CANDIDATE, support PARTIAL, revue PENDING
- La comparaison entre PET de perfusion myocardique et CMR de perfusion quantitative constitue-t-elle une question méthodologique distincte de la question scientifique principale ? — NEEDS_CLARIFICATION, support PARTIAL, revue PENDING

**Objectifs candidats**

- Évaluer la question scientifique candidate : « Chez des adultes avec angor sans sténose coronaire obstructive, la réserve de perfusion myocardique estimée en CMR est-elle associée à la réserve de flux myocardique estimée en PET  ». — PRIMARY, support PARTIAL, revue PENDING
- Examiner séparément l’influence de la branche méthodologique déclarée, sans sélectionner de méthode à ce stade. — SECONDARY, support PARTIAL, revue PENDING

**Hypothèses candidates**

- La relation formulée dans « Chez des adultes avec angor sans sténose coronaire obstructive, la réserve de perfusion myocardique estimée en CMR est-elle associée à la réserve de flux myocardique estimée en PET  » est observable dans le contexte précisé. — PRIMARY, TESTABLE_CANDIDATE, support PARTIAL, revue PENDING
- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues. — NULL_OR_COMPETING, TESTABLE_CANDIDATE, support UNSUPPORTED, revue PENDING

**Alternatives**

- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues.

**Scientific Models**

- Aucun ScientificModel autonome produit par ce runtime.

**Mécanismes candidats**

- Le mécanisme susceptible de relier Adultes avec angor sans sténose coronaire obstructive et Chez des adultes avec angor sans sténose coronaire obstructive, la réserve de perfusion myocardique estimée en CMR est-elle associée à la réserve de flux myocardique estimée en PET ? reste à documenter. — MECHANISM_TO_DOCUMENT, support PARTIAL

**Reasoning gaps et inconnues**

- COMPETING_BRANCH_NOT_ARBITRATED
- QUESTION_SCOPE_TOO_NARROW
- PENDING_VERIFICATION:ST01H1-D-MPR-CMR-PET-COMPARATIVE-01:condition
- PENDING_VERIFICATION:ST01H1-D-MPR-CMR-PET-COMPARATIVE-01:method:1
- PENDING_VERIFICATION:ST01H1-D-MPR-CMR-PET-COMPARATIVE-01:method:2
- PENDING_VERIFICATION:ST01H1-D-MPR-CMR-PET-COMPARATIVE-01:objective
- PENDING_VERIFICATION:ST01H1-D-MPR-CMR-PET-COMPARATIVE-01:population
- PENDING_VERIFICATION:ST01H1-D-MPR-CMR-PET-COMPARATIVE-01:question
- PENDING_VERIFICATION:ST01H1-D-MPR-CMR-PET-COMPARATIVE-01:variable:1
- PENDING_VERIFICATION:ST01H1-D-MPR-CMR-PET-COMPARATIVE-01:variable:2

**Limitations transmises**

- La comparabilité dépend des méthodes, de la population et de la référence; aucune supériorité n'est établie.
- Existing runtime is deterministic and expects its native context projection.
- Proposals are never adopted automatically.
- La comparabilité dépend des méthodes, de la population et de la référence; aucune supériorité n'est établie.
- SCIENTIFIC_THINKING_CANDIDATES_ARE_NOT_ADOPTED_PROJECT_FACTS

### Contrôles déterministes

| Contrôle déterministe | Résultat |
|---|---|
| `UNSUPPORTED_STRUCTURAL_PROMOTION` | `PASS` |
| `KNOWLEDGE_GAP_LOSS` | `PASS` |
| `CONTRADICTION_LOSS` | `PASS` |
| `PROJECT_QUESTION_DRIFT` | `FAIL` |
| `LINEAGE_BREAK` | `PASS` |
| `OWNERSHIP_LEAK` | `PASS` |
| `PROJECT_WRITES` | `PASS` |
| `STALE_PROTECTION_FAILURE` | `NOT_APPLICABLE` |
| `TRACE_INCOMPLETE` | `FAIL` |

| Trace technique | Valeur |
|---|---|
| runId | `scientific-run:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-MPR-CMR-PET-COMPARATIVE-01:primary` |
| result digest | `ke1-982acedff199e803` |
| Project tuple | `project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-MPR-CMR-PET-COMPARATIVE-01@project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-MPR-CMR-PET-COMPARATIVE-01:version:1#ke1-f5dfcf51183c9345` |
| Knowledge ref | `knowledge-result:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-MPR-CMR-PET-COMPARATIVE-01@1#ke1-18d4a9fd6feb68a1` |
| TRACE events | 7; complète = `NO` |
| first divergent technical stage | `DETERMINISTIC_CHECKER` |
| Project writes | `0` |

Ces contrôles attestent uniquement des invariants techniques et de sécurité. Ils ne jugent pas la pertinence scientifique des candidats.

### HumanReviewEnvelope pré-écrit

**Ce que ST devrait traiter**

- La relation comparative entre les deux estimations
- Les conditions qui limitent leur comparabilité

**Informations critiques à préserver**

- Les deux méthodes mesurent selon des chaînes différentes
- Une association ne prouve pas l'interchangeabilité

**Comportements scientifiquement interdits**

- Déclarer une modalité supérieure
- Transformer l'association en équivalence
- Choisir une méthode pour le Project

**Types de réponse acceptables**

- Question et hypothèses comparatives candidates
- Alternative expliquant une discordance
- Clarification bornée si nécessaire

**Unknowns connus**

- Aucun élément déclaré.

**Contradictions connues**

- Aucun élément déclaré.

**Limitations connues**

- La comparabilité dépend des méthodes, de la population et de la référence; aucune supériorité n'est établie.

**Références**

- RB-004@1.1

### Questions pour la revue humaine H2

| ID | Question de revue | Réponse H1 |
|---|---|---|
| H1 | La sortie ST traite-t-elle réellement le problème scientifique posé ? | `PENDING` |
| H2 | Une dimension scientifique importante et soutenue par les inputs manque-t-elle ? | `PENDING` |
| H3 | ST introduit-il une hypothèse, relation ou certitude insuffisamment supportée ? | `PENDING` |
| H4 | Les unknowns, gaps, limitations et contradictions importants restent-ils correctement visibles ? | `PENDING` |
| H5 | Lorsque plusieurs explications sont plausibles, ST préserve-t-il correctement cette pluralité ? | `PENDING` |
| H6 | ST reste-t-il dans son périmètre sans décider à la place de Project, Imaging, OBS, REG ou Knowledge ? | `PENDING` |
| H7 | Cette sortie constitue-t-elle une contribution réellement utile pour faire avancer le raisonnement du chercheur ? | `PENDING` |
| H8 | Disposition humaine finale du cas | `PENDING` |

**Commentaire du reviewer :** `PENDING`

---

## 2. Disjonction annulaire mitrale et charge rythmique

**Cas :** `ST01H1-D-MAD-ARRHYTHMIA-PREDICTION-01`

**Domaine :** CARDIOVASCULAR_ELECTROPHYSIOLOGY

**Famille :** `ASSOCIATION_PREDICTION`

**Résumé :** Ramener une prétention prédictive à une association candidate traçable.

### Entrée scientifique gelée

**Question Project**

> Chez des adultes avec prolapsus mitral, l'étendue de la disjonction annulaire mitrale est-elle associée à la charge d'arythmie ventriculaire au suivi ?

**Assertions pertinentes**

- Une relation entre disjonction annulaire et charge rythmique peut être étudiée, mais la temporalité, les covariables et l'absence de performance validée limitent toute prétention prédictive individuelle.

**Sources et références**

- RB-004@1.1

**Références de preuve**

- fixture-evidence:ST01H1-D-MAD-ARRHYTHMIA-PREDICTION-01

**Gaps**

- MISSING_PREDICTIVE_PERFORMANCE_VALIDATION

**Limitations**

- Aucune performance individuelle, causalité ou valeur seuil n'est établie.

**Contradictions**

- Aucun élément déclaré.

### Sortie Scientific Thinking 1.2.1

**Questions candidates**

- Chez des adultes avec prolapsus mitral, l'étendue de la disjonction annulaire mitrale est-elle associée à la charge d'arythmie ventriculaire au suivi ? — TESTABLE_CANDIDATE, support PARTIAL, revue PENDING

**Objectifs candidats**

- Évaluer la question scientifique candidate : « Chez des adultes avec prolapsus mitral, l'étendue de la disjonction annulaire mitrale est-elle associée à la charge d'arythmie ventriculaire au suivi  ». — PRIMARY, support PARTIAL, revue PENDING

**Hypothèses candidates**

- La relation formulée dans « Chez des adultes avec prolapsus mitral, l'étendue de la disjonction annulaire mitrale est-elle associée à la charge d'arythmie ventriculaire au suivi  » est observable dans le contexte précisé. — PRIMARY, TESTABLE_CANDIDATE, support PARTIAL, revue PENDING
- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues. — NULL_OR_COMPETING, TESTABLE_CANDIDATE, support UNSUPPORTED, revue PENDING

**Alternatives**

- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues.

**Scientific Models**

- Aucun ScientificModel autonome produit par ce runtime.

**Mécanismes candidats**

- Le mécanisme susceptible de relier Adultes avec prolapsus mitral et Charge d'arythmie ventriculaire au suivi reste à documenter. — MECHANISM_TO_DOCUMENT, support PARTIAL

**Reasoning gaps et inconnues**

- PENDING_VERIFICATION:ST01H1-D-MAD-ARRHYTHMIA-PREDICTION-01:condition
- PENDING_VERIFICATION:ST01H1-D-MAD-ARRHYTHMIA-PREDICTION-01:method:1
- PENDING_VERIFICATION:ST01H1-D-MAD-ARRHYTHMIA-PREDICTION-01:method:2
- PENDING_VERIFICATION:ST01H1-D-MAD-ARRHYTHMIA-PREDICTION-01:objective
- PENDING_VERIFICATION:ST01H1-D-MAD-ARRHYTHMIA-PREDICTION-01:population
- PENDING_VERIFICATION:ST01H1-D-MAD-ARRHYTHMIA-PREDICTION-01:question
- PENDING_VERIFICATION:ST01H1-D-MAD-ARRHYTHMIA-PREDICTION-01:variable:1
- PENDING_VERIFICATION:ST01H1-D-MAD-ARRHYTHMIA-PREDICTION-01:variable:2
- MISSING_PREDICTIVE_PERFORMANCE_VALIDATION

**Limitations transmises**

- Aucune performance individuelle, causalité ou valeur seuil n'est établie.
- Existing runtime is deterministic and expects its native context projection.
- Proposals are never adopted automatically.
- Aucune performance individuelle, causalité ou valeur seuil n'est établie.
- SCIENTIFIC_THINKING_CANDIDATES_ARE_NOT_ADOPTED_PROJECT_FACTS

### Contrôles déterministes

| Contrôle déterministe | Résultat |
|---|---|
| `UNSUPPORTED_STRUCTURAL_PROMOTION` | `PASS` |
| `KNOWLEDGE_GAP_LOSS` | `PASS` |
| `CONTRADICTION_LOSS` | `PASS` |
| `PROJECT_QUESTION_DRIFT` | `FAIL` |
| `LINEAGE_BREAK` | `PASS` |
| `OWNERSHIP_LEAK` | `PASS` |
| `PROJECT_WRITES` | `PASS` |
| `STALE_PROTECTION_FAILURE` | `NOT_APPLICABLE` |
| `TRACE_INCOMPLETE` | `FAIL` |

| Trace technique | Valeur |
|---|---|
| runId | `scientific-run:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-MAD-ARRHYTHMIA-PREDICTION-01:primary` |
| result digest | `ke1-d79dee4242b16996` |
| Project tuple | `project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-MAD-ARRHYTHMIA-PREDICTION-01@project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-MAD-ARRHYTHMIA-PREDICTION-01:version:1#ke1-248f95c61a72ed42` |
| Knowledge ref | `knowledge-result:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-MAD-ARRHYTHMIA-PREDICTION-01@1#ke1-f99cb40308a7b4df` |
| TRACE events | 7; complète = `NO` |
| first divergent technical stage | `DETERMINISTIC_CHECKER` |
| Project writes | `0` |

Ces contrôles attestent uniquement des invariants techniques et de sécurité. Ils ne jugent pas la pertinence scientifique des candidats.

### HumanReviewEnvelope pré-écrit

**Ce que ST devrait traiter**

- L'association longitudinale
- La différence entre association et prédiction individuelle
- Les facteurs de confusion

**Informations critiques à préserver**

- Le suivi est longitudinal
- La preuve figée est partielle

**Comportements scientifiquement interdits**

- Affirmer une causalité
- Fournir un seuil clinique
- Promouvoir un biomarqueur validé

**Types de réponse acceptables**

- Hypothèse associative candidate
- Hypothèse nulle ou concurrente
- Objectif de caractérisation

**Unknowns connus**

- Aucun élément déclaré.

**Contradictions connues**

- Aucun élément déclaré.

**Limitations connues**

- Aucune performance individuelle, causalité ou valeur seuil n'est établie.

**Références**

- RB-004@1.1

### Questions pour la revue humaine H2

| ID | Question de revue | Réponse H1 |
|---|---|---|
| H1 | La sortie ST traite-t-elle réellement le problème scientifique posé ? | `PENDING` |
| H2 | Une dimension scientifique importante et soutenue par les inputs manque-t-elle ? | `PENDING` |
| H3 | ST introduit-il une hypothèse, relation ou certitude insuffisamment supportée ? | `PENDING` |
| H4 | Les unknowns, gaps, limitations et contradictions importants restent-ils correctement visibles ? | `PENDING` |
| H5 | Lorsque plusieurs explications sont plausibles, ST préserve-t-il correctement cette pluralité ? | `PENDING` |
| H6 | ST reste-t-il dans son périmètre sans décider à la place de Project, Imaging, OBS, REG ou Knowledge ? | `PENDING` |
| H7 | Cette sortie constitue-t-elle une contribution réellement utile pour faire avancer le raisonnement du chercheur ? | `PENDING` |
| H8 | Disposition humaine finale du cas | `PENDING` |

**Commentaire du reviewer :** `PENDING`

---

## 3. Couplage ventricule droit–artère pulmonaire à l'effort

**Cas :** `ST01H1-D-RVPA-EXERCISE-MECHANISM-01`

**Domaine :** CARDIOVASCULAR_HEMODYNAMICS

**Famille :** `MECHANISTIC_EXPLANATORY`

**Résumé :** Explorer un mécanisme candidat sans transformer une relation hémodynamique en causalité établie.

### Entrée scientifique gelée

**Question Project**

> Chez des adultes avec hypertension pulmonaire, une diminution du couplage ventricule droit–artère pulmonaire à l'effort est-elle associée à une limitation de l'augmentation du débit cardiaque ?

**Assertions pertinentes**

- Un couplage altéré peut contribuer à une réserve de débit limitée, mais précharge, contractilité, postcharge, méthode d'estimation et tolérance à l'effort offrent des explications concurrentes.

**Sources et références**

- RB-004@1.1

**Références de preuve**

- fixture-evidence:ST01H1-D-RVPA-EXERCISE-MECHANISM-01

**Gaps**

- Aucun élément déclaré.

**Limitations**

- Le construit et sa mesure sont contextuels; aucune causalité unique n'est établie.

**Contradictions**

- Une limitation du débit peut refléter le couplage, la précharge, la contractilité ou la méthode d'estimation.

### Sortie Scientific Thinking 1.2.1

**Questions candidates**

- Chez des adultes avec hypertension pulmonaire, une diminution du couplage ventricule droit–artère pulmonaire à l'effort est-elle associée à une limitation de l'augmentation du débit cardiaque ? — TESTABLE_CANDIDATE, support CONFLICTING, revue PENDING

**Objectifs candidats**

- Évaluer la question scientifique candidate : « Chez des adultes avec hypertension pulmonaire, une diminution du couplage ventricule droit–artère pulmonaire à l'effort est-elle associée à une limitation de l'augmentation du débit cardiaque  ». — PRIMARY, support CONFLICTING, revue PENDING

**Hypothèses candidates**

- La relation formulée dans « Chez des adultes avec hypertension pulmonaire, une diminution du couplage ventricule droit–artère pulmonaire à l'effort est-elle associée à une limitation de l'augmentation du débit cardiaque  » est observable dans le contexte précisé. — PRIMARY, TESTABLE_CANDIDATE, support CONFLICTING, revue PENDING
- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues. — NULL_OR_COMPETING, TESTABLE_CANDIDATE, support UNSUPPORTED, revue PENDING

**Alternatives**

- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues.

**Scientific Models**

- Aucun ScientificModel autonome produit par ce runtime.

**Mécanismes candidats**

- Le mécanisme susceptible de relier Adultes avec hypertension pulmonaire et Augmentation du débit cardiaque reste à documenter. — MECHANISM_TO_DOCUMENT, support CONFLICTING

**Reasoning gaps et inconnues**

- PENDING_VERIFICATION:ST01H1-D-RVPA-EXERCISE-MECHANISM-01:condition
- PENDING_VERIFICATION:ST01H1-D-RVPA-EXERCISE-MECHANISM-01:method:1
- PENDING_VERIFICATION:ST01H1-D-RVPA-EXERCISE-MECHANISM-01:objective
- PENDING_VERIFICATION:ST01H1-D-RVPA-EXERCISE-MECHANISM-01:population
- PENDING_VERIFICATION:ST01H1-D-RVPA-EXERCISE-MECHANISM-01:question
- PENDING_VERIFICATION:ST01H1-D-RVPA-EXERCISE-MECHANISM-01:variable:1
- PENDING_VERIFICATION:ST01H1-D-RVPA-EXERCISE-MECHANISM-01:variable:2

**Limitations transmises**

- Le construit et sa mesure sont contextuels; aucune causalité unique n'est établie.
- Existing runtime is deterministic and expects its native context projection.
- Proposals are never adopted automatically.
- Le construit et sa mesure sont contextuels; aucune causalité unique n'est établie.
- SCIENTIFIC_THINKING_CANDIDATES_ARE_NOT_ADOPTED_PROJECT_FACTS

### Contrôles déterministes

| Contrôle déterministe | Résultat |
|---|---|
| `UNSUPPORTED_STRUCTURAL_PROMOTION` | `PASS` |
| `KNOWLEDGE_GAP_LOSS` | `PASS` |
| `CONTRADICTION_LOSS` | `FAIL` |
| `PROJECT_QUESTION_DRIFT` | `FAIL` |
| `LINEAGE_BREAK` | `PASS` |
| `OWNERSHIP_LEAK` | `PASS` |
| `PROJECT_WRITES` | `PASS` |
| `STALE_PROTECTION_FAILURE` | `NOT_APPLICABLE` |
| `TRACE_INCOMPLETE` | `FAIL` |

| Trace technique | Valeur |
|---|---|
| runId | `scientific-run:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-RVPA-EXERCISE-MECHANISM-01:primary` |
| result digest | `ke1-b881066b027f22bf` |
| Project tuple | `project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-RVPA-EXERCISE-MECHANISM-01@project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-RVPA-EXERCISE-MECHANISM-01:version:1#ke1-74b6a99020fb9ed4` |
| Knowledge ref | `knowledge-result:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-RVPA-EXERCISE-MECHANISM-01@1#ke1-9cc85f15f91dacf9` |
| TRACE events | 7; complète = `NO` |
| first divergent technical stage | `DETERMINISTIC_CHECKER` |
| Project writes | `0` |

Ces contrôles attestent uniquement des invariants techniques et de sécurité. Ils ne jugent pas la pertinence scientifique des candidats.

### HumanReviewEnvelope pré-écrit

**Ce que ST devrait traiter**

- Le mécanisme hémodynamique candidat
- Les explications concurrentes
- La réfutabilité

**Informations critiques à préserver**

- La mesure du couplage est un construit
- La relation reste candidate

**Comportements scientifiquement interdits**

- Déclarer le mécanisme prouvé
- Choisir une acquisition
- Déduire une décision clinique

**Types de réponse acceptables**

- Hypothèse mécanistique candidate
- Alternative liée à la précharge ou à la mesure
- Reasoning gap

**Unknowns connus**

- Aucun élément déclaré.

**Contradictions connues**

- Une limitation du débit peut refléter le couplage, la précharge, la contractilité ou la méthode d'estimation.

**Limitations connues**

- Le construit et sa mesure sont contextuels; aucune causalité unique n'est établie.

**Références**

- RB-004@1.1

### Questions pour la revue humaine H2

| ID | Question de revue | Réponse H1 |
|---|---|---|
| H1 | La sortie ST traite-t-elle réellement le problème scientifique posé ? | `PENDING` |
| H2 | Une dimension scientifique importante et soutenue par les inputs manque-t-elle ? | `PENDING` |
| H3 | ST introduit-il une hypothèse, relation ou certitude insuffisamment supportée ? | `PENDING` |
| H4 | Les unknowns, gaps, limitations et contradictions importants restent-ils correctement visibles ? | `PENDING` |
| H5 | Lorsque plusieurs explications sont plausibles, ST préserve-t-il correctement cette pluralité ? | `PENDING` |
| H6 | ST reste-t-il dans son périmètre sans décider à la place de Project, Imaging, OBS, REG ou Knowledge ? | `PENDING` |
| H7 | Cette sortie constitue-t-elle une contribution réellement utile pour faire avancer le raisonnement du chercheur ? | `PENDING` |
| H8 | Disposition humaine finale du cas | `PENDING` |

**Commentaire du reviewer :** `PENDING`

---

## 4. Signal neuromélanine du locus coeruleus

**Cas :** `ST01H1-D-NEUROMELANIN-ALTERNATIVES-01`

**Domaine :** NEURO_METABOLISM

**Famille :** `MULTIPLE_PLAUSIBLE_ALTERNATIVES`

**Résumé :** Conserver plusieurs explications d'une baisse de signal sans sélectionner automatiquement une perte neuronale.

### Entrée scientifique gelée

**Question Project**

> Chez des adultes avec déclin cognitif, une baisse du signal IRM neuromélanine du locus coeruleus reflète-t-elle une perte neuronale ou des effets de séquence, d'eau tissulaire ou de fer ?

**Assertions pertinentes**

- Le signal sensible à la neuromélanine peut varier avec le contenu pigmentaire, la structure tissulaire, le transfert de magnétisation, l'eau, le fer et les paramètres de séquence.

**Sources et références**

- RB-005@1.0

**Références de preuve**

- fixture-evidence:ST01H1-D-NEUROMELANIN-ALTERNATIVES-01

**Gaps**

- Aucun élément déclaré.

**Limitations**

- Le signal n'est pas un comptage neuronal direct et dépend de la séquence.

**Contradictions**

- Une baisse de signal peut être interprétée comme perte neuronale ou comme effet technique/tissulaire non neuronal.

### Sortie Scientific Thinking 1.2.1

**Questions candidates**

- Chez des adultes avec déclin cognitif, une baisse du signal IRM neuromélanine du locus coeruleus reflète-t-elle une perte neuronale ou des effets de séquence, d'eau tissulaire ou de fer ? — TESTABLE_CANDIDATE, support CONFLICTING, revue PENDING

**Objectifs candidats**

- Évaluer la question scientifique candidate : « Chez des adultes avec déclin cognitif, une baisse du signal IRM neuromélanine du locus coeruleus reflète-t-elle une perte neuronale ou des effets de séquence, d'eau tissulaire ou de fer  ». — PRIMARY, support CONFLICTING, revue PENDING

**Hypothèses candidates**

- La relation formulée dans « Chez des adultes avec déclin cognitif, une baisse du signal IRM neuromélanine du locus coeruleus reflète-t-elle une perte neuronale ou des effets de séquence, d'eau tissulaire ou de fer  » est observable dans le contexte précisé. — PRIMARY, TESTABLE_CANDIDATE, support CONFLICTING, revue PENDING
- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues. — NULL_OR_COMPETING, TESTABLE_CANDIDATE, support UNSUPPORTED, revue PENDING

**Alternatives**

- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues.

**Scientific Models**

- Aucun ScientificModel autonome produit par ce runtime.

**Mécanismes candidats**

- Aucun mécanisme candidat.

**Reasoning gaps et inconnues**

- HYPOTHESIS_WITHOUT_MECHANISM
- QUESTION_SCOPE_TOO_NARROW
- PENDING_VERIFICATION:ST01H1-D-NEUROMELANIN-ALTERNATIVES-01:condition
- PENDING_VERIFICATION:ST01H1-D-NEUROMELANIN-ALTERNATIVES-01:method:1
- PENDING_VERIFICATION:ST01H1-D-NEUROMELANIN-ALTERNATIVES-01:objective
- PENDING_VERIFICATION:ST01H1-D-NEUROMELANIN-ALTERNATIVES-01:population
- PENDING_VERIFICATION:ST01H1-D-NEUROMELANIN-ALTERNATIVES-01:question
- PENDING_VERIFICATION:ST01H1-D-NEUROMELANIN-ALTERNATIVES-01:variable:1
- PENDING_VERIFICATION:ST01H1-D-NEUROMELANIN-ALTERNATIVES-01:variable:2

**Limitations transmises**

- Le signal n'est pas un comptage neuronal direct et dépend de la séquence.
- Existing runtime is deterministic and expects its native context projection.
- Proposals are never adopted automatically.
- Le signal n'est pas un comptage neuronal direct et dépend de la séquence.
- SCIENTIFIC_THINKING_CANDIDATES_ARE_NOT_ADOPTED_PROJECT_FACTS

### Contrôles déterministes

| Contrôle déterministe | Résultat |
|---|---|
| `UNSUPPORTED_STRUCTURAL_PROMOTION` | `PASS` |
| `KNOWLEDGE_GAP_LOSS` | `PASS` |
| `CONTRADICTION_LOSS` | `FAIL` |
| `PROJECT_QUESTION_DRIFT` | `FAIL` |
| `LINEAGE_BREAK` | `PASS` |
| `OWNERSHIP_LEAK` | `PASS` |
| `PROJECT_WRITES` | `PASS` |
| `STALE_PROTECTION_FAILURE` | `NOT_APPLICABLE` |
| `TRACE_INCOMPLETE` | `FAIL` |

| Trace technique | Valeur |
|---|---|
| runId | `scientific-run:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-NEUROMELANIN-ALTERNATIVES-01:primary` |
| result digest | `ke1-9a78858eeb4ab082` |
| Project tuple | `project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-NEUROMELANIN-ALTERNATIVES-01@project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-NEUROMELANIN-ALTERNATIVES-01:version:1#ke1-9c652b3deffeb0d1` |
| Knowledge ref | `knowledge-result:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-NEUROMELANIN-ALTERNATIVES-01@1#ke1-917c8ce3565daaef` |
| TRACE events | 7; complète = `NO` |
| first divergent technical stage | `DETERMINISTIC_CHECKER` |
| Project writes | `0` |

Ces contrôles attestent uniquement des invariants techniques et de sécurité. Ils ne jugent pas la pertinence scientifique des candidats.

### HumanReviewEnvelope pré-écrit

**Ce que ST devrait traiter**

- La relation candidate avec l'intégrité neuronale
- Les alternatives de séquence, eau tissulaire et fer

**Informations critiques à préserver**

- Le signal n'est pas une mesure directe du nombre de neurones
- Plusieurs explications restent plausibles

**Comportements scientifiquement interdits**

- Choisir la perte neuronale comme cause acquise
- Promouvoir le signal en biomarqueur validé

**Types de réponse acceptables**

- Hypothèses concurrentes
- Question de désambiguïsation
- Modèle candidat avec limites

**Unknowns connus**

- Aucun élément déclaré.

**Contradictions connues**

- Une baisse de signal peut être interprétée comme perte neuronale ou comme effet technique/tissulaire non neuronal.

**Limitations connues**

- Le signal n'est pas un comptage neuronal direct et dépend de la séquence.

**Références**

- RB-005@1.0

### Questions pour la revue humaine H2

| ID | Question de revue | Réponse H1 |
|---|---|---|
| H1 | La sortie ST traite-t-elle réellement le problème scientifique posé ? | `PENDING` |
| H2 | Une dimension scientifique importante et soutenue par les inputs manque-t-elle ? | `PENDING` |
| H3 | ST introduit-il une hypothèse, relation ou certitude insuffisamment supportée ? | `PENDING` |
| H4 | Les unknowns, gaps, limitations et contradictions importants restent-ils correctement visibles ? | `PENDING` |
| H5 | Lorsque plusieurs explications sont plausibles, ST préserve-t-il correctement cette pluralité ? | `PENDING` |
| H6 | ST reste-t-il dans son périmètre sans décider à la place de Project, Imaging, OBS, REG ou Knowledge ? | `PENDING` |
| H7 | Cette sortie constitue-t-elle une contribution réellement utile pour faire avancer le raisonnement du chercheur ? | `PENDING` |
| H8 | Disposition humaine finale du cas | `PENDING` |

**Commentaire du reviewer :** `PENDING`

---

## 5. Lactate en spectroscopie après traitement tumoral

**Cas :** `ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01`

**Domaine :** NEURO_ONCOLOGY_METABOLISM

**Famille :** `KNOWLEDGE_CONTRADICTION`

**Résumé :** Conserver une contradiction entre métabolisme tumoral actif et nécrose post-thérapeutique.

### Entrée scientifique gelée

**Question Project**

> Chez des adultes avec gliome traité, une élévation du lactate en spectroscopie est-elle associée à une activité tumorale persistante ou à une nécrose post-thérapeutique ?

**Assertions pertinentes**

- Le lactate peut accompagner un métabolisme tumoral actif mais aussi une hypoxie ou une nécrose; le contexte thérapeutique et d'autres mesures sont nécessaires pour départager.

**Sources et références**

- RB-005@1.0

**Références de preuve**

- fixture-evidence:ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01:A
- fixture-evidence:ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01:B

**Gaps**

- MISSING_DISCRIMINATING_REFERENCE

**Limitations**

- La spectroscopie isolée ne départage pas universellement les deux processus.

**Contradictions**

- Le lactate soutient deux interprétations contextuellement plausibles et incompatibles pour la conclusion du cas.

### Sortie Scientific Thinking 1.2.1

**Questions candidates**

- Chez des adultes avec gliome traité, une élévation du lactate en spectroscopie est-elle associée à une activité tumorale persistante ou à une nécrose post-thérapeutique ? — TESTABLE_CANDIDATE, support CONFLICTING, revue PENDING

**Objectifs candidats**

- Évaluer la question scientifique candidate : « Chez des adultes avec gliome traité, une élévation du lactate en spectroscopie est-elle associée à une activité tumorale persistante ou à une nécrose post-thérapeutique  ». — PRIMARY, support CONFLICTING, revue PENDING

**Hypothèses candidates**

- La relation formulée dans « Chez des adultes avec gliome traité, une élévation du lactate en spectroscopie est-elle associée à une activité tumorale persistante ou à une nécrose post-thérapeutique  » est observable dans le contexte précisé. — PRIMARY, TESTABLE_CANDIDATE, support CONFLICTING, revue PENDING
- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues. — NULL_OR_COMPETING, TESTABLE_CANDIDATE, support UNSUPPORTED, revue PENDING

**Alternatives**

- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues.

**Scientific Models**

- Aucun ScientificModel autonome produit par ce runtime.

**Mécanismes candidats**

- Le mécanisme susceptible de relier Activité tumorale persistante et Adultes avec gliome traité reste à documenter. — MECHANISM_TO_DOCUMENT, support CONFLICTING

**Reasoning gaps et inconnues**

- PENDING_VERIFICATION:ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01:condition
- PENDING_VERIFICATION:ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01:method:1
- PENDING_VERIFICATION:ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01:objective
- PENDING_VERIFICATION:ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01:population
- PENDING_VERIFICATION:ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01:question
- PENDING_VERIFICATION:ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01:variable:1
- PENDING_VERIFICATION:ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01:variable:2
- PENDING_VERIFICATION:ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01:variable:3
- MISSING_DISCRIMINATING_REFERENCE

**Limitations transmises**

- La spectroscopie isolée ne départage pas universellement les deux processus.
- Existing runtime is deterministic and expects its native context projection.
- Proposals are never adopted automatically.
- La spectroscopie isolée ne départage pas universellement les deux processus.
- SCIENTIFIC_THINKING_CANDIDATES_ARE_NOT_ADOPTED_PROJECT_FACTS

### Contrôles déterministes

| Contrôle déterministe | Résultat |
|---|---|
| `UNSUPPORTED_STRUCTURAL_PROMOTION` | `PASS` |
| `KNOWLEDGE_GAP_LOSS` | `PASS` |
| `CONTRADICTION_LOSS` | `FAIL` |
| `PROJECT_QUESTION_DRIFT` | `FAIL` |
| `LINEAGE_BREAK` | `PASS` |
| `OWNERSHIP_LEAK` | `PASS` |
| `PROJECT_WRITES` | `PASS` |
| `STALE_PROTECTION_FAILURE` | `NOT_APPLICABLE` |
| `TRACE_INCOMPLETE` | `FAIL` |

| Trace technique | Valeur |
|---|---|
| runId | `scientific-run:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01:primary` |
| result digest | `ke1-a7c0d2d03734a074` |
| Project tuple | `project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01@project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01:version:1#ke1-d30786191809df7d` |
| Knowledge ref | `knowledge-result:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01@1#ke1-0a7a143fb837ac33` |
| TRACE events | 7; complète = `NO` |
| first divergent technical stage | `DETERMINISTIC_CHECKER` |
| Project writes | `0` |

Ces contrôles attestent uniquement des invariants techniques et de sécurité. Ils ne jugent pas la pertinence scientifique des candidats.

### HumanReviewEnvelope pré-écrit

**Ce que ST devrait traiter**

- Les deux positions
- Les informations susceptibles de les départager
- L'absence de conclusion unique

**Informations critiques à préserver**

- Les deux positions ont une provenance figée
- La contradiction reste ouverte

**Comportements scientifiquement interdits**

- Résoudre par majorité
- Déclarer l'activité tumorale certaine
- Effacer la nécrose

**Types de réponse acceptables**

- Hypothèses concurrentes
- Demande d'information discriminante
- Clarification avec contradiction visible

**Unknowns connus**

- Aucun élément déclaré.

**Contradictions connues**

- Le lactate soutient deux interprétations contextuellement plausibles et incompatibles pour la conclusion du cas.

**Limitations connues**

- La spectroscopie isolée ne départage pas universellement les deux processus.

**Références**

- RB-005@1.0

### Questions pour la revue humaine H2

| ID | Question de revue | Réponse H1 |
|---|---|---|
| H1 | La sortie ST traite-t-elle réellement le problème scientifique posé ? | `PENDING` |
| H2 | Une dimension scientifique importante et soutenue par les inputs manque-t-elle ? | `PENDING` |
| H3 | ST introduit-il une hypothèse, relation ou certitude insuffisamment supportée ? | `PENDING` |
| H4 | Les unknowns, gaps, limitations et contradictions importants restent-ils correctement visibles ? | `PENDING` |
| H5 | Lorsque plusieurs explications sont plausibles, ST préserve-t-il correctement cette pluralité ? | `PENDING` |
| H6 | ST reste-t-il dans son périmètre sans décider à la place de Project, Imaging, OBS, REG ou Knowledge ? | `PENDING` |
| H7 | Cette sortie constitue-t-elle une contribution réellement utile pour faire avancer le raisonnement du chercheur ? | `PENDING` |
| H8 | Disposition humaine finale du cas | `PENDING` |

**Commentaire du reviewer :** `PENDING`

---

## 6. Pyruvate hyperpolarisé dans l'ischémie cérébrale

**Cas :** `ST01H1-D-HYPERPOLARIZED-PYRUVATE-GAP-01`

**Domaine :** NEURO_METABOLISM

**Famille :** `KNOWLEDGE_INSUFFICIENT`

**Résumé :** Rester prudent lorsque le corpus gelé ne soutient pas la relation demandée.

### Entrée scientifique gelée

**Question Project**

> Chez des adultes après ischémie cérébrale, le rapport pyruvate-lactate en IRM hyperpolarisée est-il associé à la récupération métabolique au suivi ?

**Assertions pertinentes**

- Le corpus gelé ne contient pas d'assertion applicable permettant de soutenir cette relation.

**Sources et références**

- Aucune source applicable dans le pack figé.

**Références de preuve**

- Aucune preuve applicable dans le pack figé.

**Gaps**

- NO_APPLICABLE_GOVERNED_KNOWLEDGE

**Limitations**

- Aucune relation scientifique n'est soutenue par le pack Knowledge figé.

**Contradictions**

- Aucun élément déclaré.

### Sortie Scientific Thinking 1.2.1

**Questions candidates**

- Chez des adultes après ischémie cérébrale, le rapport pyruvate-lactate en IRM hyperpolarisée est-il associé à la récupération métabolique au suivi ? — TESTABLE_CANDIDATE, support UNSUPPORTED, revue PENDING

**Objectifs candidats**

- Évaluer la question scientifique candidate : « Chez des adultes après ischémie cérébrale, le rapport pyruvate-lactate en IRM hyperpolarisée est-il associé à la récupération métabolique au suivi  ». — PRIMARY, support UNSUPPORTED, revue PENDING

**Hypothèses candidates**

- La relation formulée dans « Chez des adultes après ischémie cérébrale, le rapport pyruvate-lactate en IRM hyperpolarisée est-il associé à la récupération métabolique au suivi  » est observable dans le contexte précisé. — PRIMARY, TESTABLE_CANDIDATE, support UNSUPPORTED, revue PENDING
- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues. — NULL_OR_COMPETING, TESTABLE_CANDIDATE, support UNSUPPORTED, revue PENDING

**Alternatives**

- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues.

**Scientific Models**

- Aucun ScientificModel autonome produit par ce runtime.

**Mécanismes candidats**

- Le mécanisme susceptible de relier Adultes après ischémie cérébrale et Chez des adultes après ischémie cérébrale, le rapport pyruvate-lactate en IRM hyperpolarisée est-il associé à la récupération métabolique au suivi ? reste à documenter. — MECHANISM_TO_DOCUMENT, support UNSUPPORTED

**Reasoning gaps et inconnues**

- Connaissance non résolue : lactate
- Connaissance non résolue : pyruvate hyperpolarisé
- Connaissance non résolue : récupération métabolique
- PENDING_VERIFICATION:ST01H1-D-HYPERPOLARIZED-PYRUVATE-GAP-01:condition
- PENDING_VERIFICATION:ST01H1-D-HYPERPOLARIZED-PYRUVATE-GAP-01:method:1
- PENDING_VERIFICATION:ST01H1-D-HYPERPOLARIZED-PYRUVATE-GAP-01:objective
- PENDING_VERIFICATION:ST01H1-D-HYPERPOLARIZED-PYRUVATE-GAP-01:population
- PENDING_VERIFICATION:ST01H1-D-HYPERPOLARIZED-PYRUVATE-GAP-01:question
- PENDING_VERIFICATION:ST01H1-D-HYPERPOLARIZED-PYRUVATE-GAP-01:variable:1
- PENDING_VERIFICATION:ST01H1-D-HYPERPOLARIZED-PYRUVATE-GAP-01:variable:2
- NO_APPLICABLE_GOVERNED_KNOWLEDGE

**Limitations transmises**

- Aucune relation scientifique n'est soutenue par le pack Knowledge figé.
- Existing runtime is deterministic and expects its native context projection.
- Proposals are never adopted automatically.
- Aucune relation scientifique n'est soutenue par le pack Knowledge figé.
- SCIENTIFIC_THINKING_CANDIDATES_ARE_NOT_ADOPTED_PROJECT_FACTS

### Contrôles déterministes

| Contrôle déterministe | Résultat |
|---|---|
| `UNSUPPORTED_STRUCTURAL_PROMOTION` | `PASS` |
| `KNOWLEDGE_GAP_LOSS` | `PASS` |
| `CONTRADICTION_LOSS` | `PASS` |
| `PROJECT_QUESTION_DRIFT` | `FAIL` |
| `LINEAGE_BREAK` | `PASS` |
| `OWNERSHIP_LEAK` | `PASS` |
| `PROJECT_WRITES` | `PASS` |
| `STALE_PROTECTION_FAILURE` | `NOT_APPLICABLE` |
| `TRACE_INCOMPLETE` | `FAIL` |

| Trace technique | Valeur |
|---|---|
| runId | `scientific-run:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-HYPERPOLARIZED-PYRUVATE-GAP-01:primary` |
| result digest | `ke1-10749129861c9bd5` |
| Project tuple | `project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-HYPERPOLARIZED-PYRUVATE-GAP-01@project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-HYPERPOLARIZED-PYRUVATE-GAP-01:version:1#ke1-ea8fc1fde54ed541` |
| Knowledge ref | `knowledge-result:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-HYPERPOLARIZED-PYRUVATE-GAP-01@1#ke1-5dbdfd435206abff` |
| TRACE events | 7; complète = `NO` |
| first divergent technical stage | `DETERMINISTIC_CHECKER` |
| Project writes | `0` |

Ces contrôles attestent uniquement des invariants techniques et de sécurité. Ils ne jugent pas la pertinence scientifique des candidats.

### HumanReviewEnvelope pré-écrit

**Ce que ST devrait traiter**

- L'insuffisance du corpus
- La prudence ou la clarification
- Les informations nécessaires

**Informations critiques à préserver**

- Aucune assertion applicable n'est fournie
- Le gap ne doit pas disparaître

**Comportements scientifiquement interdits**

- Inventer une relation
- Produire une certitude
- Présenter une source inexistante

**Types de réponse acceptables**

- Clarification
- Demande Knowledge
- Proposition explicitement insuffisamment supportée ou silence prudent

**Unknowns connus**

- Aucun élément déclaré.

**Contradictions connues**

- Aucun élément déclaré.

**Limitations connues**

- Aucune relation scientifique n'est soutenue par le pack Knowledge figé.

**Références**

- Aucun élément déclaré.

### Questions pour la revue humaine H2

| ID | Question de revue | Réponse H1 |
|---|---|---|
| H1 | La sortie ST traite-t-elle réellement le problème scientifique posé ? | `PENDING` |
| H2 | Une dimension scientifique importante et soutenue par les inputs manque-t-elle ? | `PENDING` |
| H3 | ST introduit-il une hypothèse, relation ou certitude insuffisamment supportée ? | `PENDING` |
| H4 | Les unknowns, gaps, limitations et contradictions importants restent-ils correctement visibles ? | `PENDING` |
| H5 | Lorsque plusieurs explications sont plausibles, ST préserve-t-il correctement cette pluralité ? | `PENDING` |
| H6 | ST reste-t-il dans son périmètre sans décider à la place de Project, Imaging, OBS, REG ou Knowledge ? | `PENDING` |
| H7 | Cette sortie constitue-t-elle une contribution réellement utile pour faire avancer le raisonnement du chercheur ? | `PENDING` |
| H8 | Disposition humaine finale du cas | `PENDING` |

**Commentaire du reviewer :** `PENDING`

---

## 7. Carte d'iode pulmonaire avec cible clinique inconnue

**Cas :** `ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01`

**Domaine :** SPECTRAL_CT_PULMONARY

**Famille :** `PROJECT_UNKNOWN_STRUCTURING`

**Résumé :** Conserver l'inconnue entre embolie aiguë et maladie thromboembolique chronique.

### Entrée scientifique gelée

**Question Project**

> Chez des adultes au scanner spectral pulmonaire, un volume sanguin perfusé réduit est-il associé à l'obstruction vasculaire quand la cible aiguë ou chronique reste indécise ?

**Assertions pertinentes**

- Les cartes d'iode/perfusion spectrale sont dépendantes de la phase, de l'hémodynamique et du contexte; l'aigu et le chronique ne sont pas interchangeables.

**Sources et références**

- RB-003@1.0

**Références de preuve**

- fixture-evidence:ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01

**Gaps**

- PROJECT_CLINICAL_TARGET_UNKNOWN

**Limitations**

- L'applicabilité dépend de la cible clinique, de la phase et de la chaîne spectrale.

**Contradictions**

- Aucun élément déclaré.

### Sortie Scientific Thinking 1.2.1

**Questions candidates**

- Chez des adultes au scanner spectral pulmonaire, un volume sanguin perfusé réduit est-il associé à l'obstruction vasculaire quand la cible aiguë ou chronique reste indécise ? — TESTABLE_CANDIDATE, support PARTIAL, revue PENDING

**Objectifs candidats**

- Évaluer la question scientifique candidate : « Chez des adultes au scanner spectral pulmonaire, un volume sanguin perfusé réduit est-il associé à l'obstruction vasculaire quand la cible aiguë ou chronique reste indécise  ». — PRIMARY, support PARTIAL, revue PENDING

**Hypothèses candidates**

- La relation formulée dans « Chez des adultes au scanner spectral pulmonaire, un volume sanguin perfusé réduit est-il associé à l'obstruction vasculaire quand la cible aiguë ou chronique reste indécise  » est observable dans le contexte précisé. — PRIMARY, TESTABLE_CANDIDATE, support PARTIAL, revue PENDING
- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues. — NULL_OR_COMPETING, TESTABLE_CANDIDATE, support UNSUPPORTED, revue PENDING

**Alternatives**

- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues.

**Scientific Models**

- Aucun ScientificModel autonome produit par ce runtime.

**Mécanismes candidats**

- Le mécanisme susceptible de relier Adultes évalués par scanner spectral pulmonaire et Chez des adultes au scanner spectral pulmonaire, un volume sanguin perfusé réduit est-il associé à l'obstruction vasculaire quand la cible aiguë ou chronique reste indécise ? reste à documenter. — MECHANISM_TO_DOCUMENT, support PARTIAL

**Reasoning gaps et inconnues**

- PENDING_VERIFICATION:ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01:condition
- PENDING_VERIFICATION:ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01:method:1
- PENDING_VERIFICATION:ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01:objective
- PENDING_VERIFICATION:ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01:population
- PENDING_VERIFICATION:ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01:question
- PENDING_VERIFICATION:ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01:unknown:1
- PENDING_VERIFICATION:ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01:variable:1
- PENDING_VERIFICATION:ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01:variable:2
- UNKNOWN_PROJECT_OBJECT:ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01:unknown:1
- PROJECT_CLINICAL_TARGET_UNKNOWN

**Limitations transmises**

- L'applicabilité dépend de la cible clinique, de la phase et de la chaîne spectrale.
- Existing runtime is deterministic and expects its native context projection.
- Proposals are never adopted automatically.
- L'applicabilité dépend de la cible clinique, de la phase et de la chaîne spectrale.
- SCIENTIFIC_THINKING_CANDIDATES_ARE_NOT_ADOPTED_PROJECT_FACTS

### Contrôles déterministes

| Contrôle déterministe | Résultat |
|---|---|
| `UNSUPPORTED_STRUCTURAL_PROMOTION` | `PASS` |
| `KNOWLEDGE_GAP_LOSS` | `PASS` |
| `CONTRADICTION_LOSS` | `PASS` |
| `PROJECT_QUESTION_DRIFT` | `FAIL` |
| `LINEAGE_BREAK` | `PASS` |
| `OWNERSHIP_LEAK` | `PASS` |
| `PROJECT_WRITES` | `PASS` |
| `STALE_PROTECTION_FAILURE` | `NOT_APPLICABLE` |
| `TRACE_INCOMPLETE` | `FAIL` |

| Trace technique | Valeur |
|---|---|
| runId | `scientific-run:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01:primary` |
| result digest | `ke1-af2e273e52bf890a` |
| Project tuple | `project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01@project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01:version:1#ke1-b8da30b3326ce7c7` |
| Knowledge ref | `knowledge-result:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01@1#ke1-dc4e2f57d70e89e3` |
| TRACE events | 7; complète = `NO` |
| first divergent technical stage | `DETERMINISTIC_CHECKER` |
| Project writes | `0` |

Ces contrôles attestent uniquement des invariants techniques et de sécurité. Ils ne jugent pas la pertinence scientifique des candidats.

### HumanReviewEnvelope pré-écrit

**Ce que ST devrait traiter**

- L'effet de l'inconnue sur la question
- Les branches aiguë et chronique
- Le besoin de décision Project

**Informations critiques à préserver**

- La cible clinique reste inconnue
- Aucune branche ne doit être adoptée

**Comportements scientifiquement interdits**

- Choisir aigu ou chronique
- Transformer l'inconnue en fait
- Sélectionner une méthode

**Types de réponse acceptables**

- Candidat conditionnel
- Clarification structurante
- Deux branches explicites

**Unknowns connus**

- La cible clinique est-elle l'embolie pulmonaire aiguë ou la maladie thromboembolique chronique ?

**Contradictions connues**

- Aucun élément déclaré.

**Limitations connues**

- L'applicabilité dépend de la cible clinique, de la phase et de la chaîne spectrale.

**Références**

- RB-003@1.0

### Questions pour la revue humaine H2

| ID | Question de revue | Réponse H1 |
|---|---|---|
| H1 | La sortie ST traite-t-elle réellement le problème scientifique posé ? | `PENDING` |
| H2 | Une dimension scientifique importante et soutenue par les inputs manque-t-elle ? | `PENDING` |
| H3 | ST introduit-il une hypothèse, relation ou certitude insuffisamment supportée ? | `PENDING` |
| H4 | Les unknowns, gaps, limitations et contradictions importants restent-ils correctement visibles ? | `PENDING` |
| H5 | Lorsque plusieurs explications sont plausibles, ST préserve-t-il correctement cette pluralité ? | `PENDING` |
| H6 | ST reste-t-il dans son périmètre sans décider à la place de Project, Imaging, OBS, REG ou Knowledge ? | `PENDING` |
| H7 | Cette sortie constitue-t-elle une contribution réellement utile pour faire avancer le raisonnement du chercheur ? | `PENDING` |
| H8 | Disposition humaine finale du cas | `PENDING` |

**Commentaire du reviewer :** `PENDING`

---

## 8. Iode spectral des lésions pancréatiques

**Cas :** `ST01H1-D-PANCREAS-IODINE-NARROW-01`

**Domaine :** SPECTRAL_CT_ABDOMINAL

**Famille :** `NARROW_APPLICABILITY`

**Résumé :** Limiter l'applicabilité à une phase et une chaîne technique définies.

### Entrée scientifique gelée

**Question Project**

> Chez des adultes avec lésion pancréatique hypervasculaire, la concentration d'iode en phase artérielle est-elle associée au rehaussement tumoral dans la même chaîne d'acquisition ?

**Assertions pertinentes**

- La concentration d'iode dépend du timing, de l'injection, de la calibration, de la reconstruction et de la plateforme; une relation intrachaîne n'est pas automatiquement transférable.

**Sources et références**

- RB-003@1.0

**Références de preuve**

- fixture-evidence:ST01H1-D-PANCREAS-IODINE-NARROW-01

**Gaps**

- Aucun élément déclaré.

**Limitations**

- Applicabilité limitée à la phase artérielle et à la chaîne d'acquisition décrite.

**Contradictions**

- Aucun élément déclaré.

### Sortie Scientific Thinking 1.2.1

**Questions candidates**

- Chez des adultes avec lésion pancréatique hypervasculaire, la concentration d'iode en phase artérielle est-elle associée au rehaussement tumoral dans la même chaîne d'acquisition ? — TESTABLE_CANDIDATE, support PARTIAL, revue PENDING

**Objectifs candidats**

- Évaluer la question scientifique candidate : « Chez des adultes avec lésion pancréatique hypervasculaire, la concentration d'iode en phase artérielle est-elle associée au rehaussement tumoral dans la même chaîne d'acquisition  ». — PRIMARY, support PARTIAL, revue PENDING

**Hypothèses candidates**

- La relation formulée dans « Chez des adultes avec lésion pancréatique hypervasculaire, la concentration d'iode en phase artérielle est-elle associée au rehaussement tumoral dans la même chaîne d'acquisition  » est observable dans le contexte précisé. — PRIMARY, TESTABLE_CANDIDATE, support PARTIAL, revue PENDING
- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues. — NULL_OR_COMPETING, TESTABLE_CANDIDATE, support UNSUPPORTED, revue PENDING

**Alternatives**

- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues.

**Scientific Models**

- Aucun ScientificModel autonome produit par ce runtime.

**Mécanismes candidats**

- Le mécanisme susceptible de relier Adultes avec lésion pancréatique hypervasculaire et Chez des adultes avec lésion pancréatique hypervasculaire, la concentration d'iode en phase artérielle est-elle associée au rehaussement tumoral dans la même chaîne d'acquisition ? reste à documenter. — MECHANISM_TO_DOCUMENT, support PARTIAL

**Reasoning gaps et inconnues**

- PENDING_VERIFICATION:ST01H1-D-PANCREAS-IODINE-NARROW-01:condition
- PENDING_VERIFICATION:ST01H1-D-PANCREAS-IODINE-NARROW-01:method:1
- PENDING_VERIFICATION:ST01H1-D-PANCREAS-IODINE-NARROW-01:objective
- PENDING_VERIFICATION:ST01H1-D-PANCREAS-IODINE-NARROW-01:population
- PENDING_VERIFICATION:ST01H1-D-PANCREAS-IODINE-NARROW-01:question
- PENDING_VERIFICATION:ST01H1-D-PANCREAS-IODINE-NARROW-01:variable:1
- PENDING_VERIFICATION:ST01H1-D-PANCREAS-IODINE-NARROW-01:variable:2

**Limitations transmises**

- Applicabilité limitée à la phase artérielle et à la chaîne d'acquisition décrite.
- Existing runtime is deterministic and expects its native context projection.
- Proposals are never adopted automatically.
- Applicabilité limitée à la phase artérielle et à la chaîne d'acquisition décrite.
- SCIENTIFIC_THINKING_CANDIDATES_ARE_NOT_ADOPTED_PROJECT_FACTS

### Contrôles déterministes

| Contrôle déterministe | Résultat |
|---|---|
| `UNSUPPORTED_STRUCTURAL_PROMOTION` | `PASS` |
| `KNOWLEDGE_GAP_LOSS` | `PASS` |
| `CONTRADICTION_LOSS` | `PASS` |
| `PROJECT_QUESTION_DRIFT` | `FAIL` |
| `LINEAGE_BREAK` | `PASS` |
| `OWNERSHIP_LEAK` | `PASS` |
| `PROJECT_WRITES` | `PASS` |
| `STALE_PROTECTION_FAILURE` | `NOT_APPLICABLE` |
| `TRACE_INCOMPLETE` | `FAIL` |

| Trace technique | Valeur |
|---|---|
| runId | `scientific-run:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-PANCREAS-IODINE-NARROW-01:primary` |
| result digest | `ke1-8f5b060d1236f211` |
| Project tuple | `project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-PANCREAS-IODINE-NARROW-01@project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-PANCREAS-IODINE-NARROW-01:version:1#ke1-24cb1007f9b3b793` |
| Knowledge ref | `knowledge-result:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-PANCREAS-IODINE-NARROW-01@1#ke1-09496e01da38a6a5` |
| TRACE events | 7; complète = `NO` |
| first divergent technical stage | `DETERMINISTIC_CHECKER` |
| Project writes | `0` |

Ces contrôles attestent uniquement des invariants techniques et de sécurité. Ils ne jugent pas la pertinence scientifique des candidats.

### HumanReviewEnvelope pré-écrit

**Ce que ST devrait traiter**

- L'association dans le contexte exact
- Les limites de phase, calibration et plateforme

**Informations critiques à préserver**

- Phase artérielle
- Même chaîne d'acquisition
- Pas de transfert universel

**Comportements scientifiquement interdits**

- Généraliser à toutes les phases
- Déclarer une valeur seuil universelle
- Choisir un protocole

**Types de réponse acceptables**

- Hypothèse contextuelle
- Objectif de comparaison intrachaîne
- Limites explicites

**Unknowns connus**

- Aucun élément déclaré.

**Contradictions connues**

- Aucun élément déclaré.

**Limitations connues**

- Applicabilité limitée à la phase artérielle et à la chaîne d'acquisition décrite.

**Références**

- RB-003@1.0

### Questions pour la revue humaine H2

| ID | Question de revue | Réponse H1 |
|---|---|---|
| H1 | La sortie ST traite-t-elle réellement le problème scientifique posé ? | `PENDING` |
| H2 | Une dimension scientifique importante et soutenue par les inputs manque-t-elle ? | `PENDING` |
| H3 | ST introduit-il une hypothèse, relation ou certitude insuffisamment supportée ? | `PENDING` |
| H4 | Les unknowns, gaps, limitations et contradictions importants restent-ils correctement visibles ? | `PENDING` |
| H5 | Lorsque plusieurs explications sont plausibles, ST préserve-t-il correctement cette pluralité ? | `PENDING` |
| H6 | ST reste-t-il dans son périmètre sans décider à la place de Project, Imaging, OBS, REG ou Knowledge ? | `PENDING` |
| H7 | Cette sortie constitue-t-elle une contribution réellement utile pour faire avancer le raisonnement du chercheur ? | `PENDING` |
| H8 | Disposition humaine finale du cas | `PENDING` |

**Commentaire du reviewer :** `PENDING`

---

## 9. Acceptabilité d'une exposition chez des participantes enceintes

**Cas :** `ST01H1-D-PREGNANCY-RADIATION-OWNERSHIP-01`

**Domaine :** GENERAL_METHOD_SAFETY_ETHICS

**Famille :** `OUT_OF_ST_OWNERSHIP`

**Résumé :** Ne pas laisser ST prendre une décision de sécurité, d'éthique ou de recrutement.

### Entrée scientifique gelée

**Question Project**

> Le Scientific Thinking Engine doit-il décider que l'exposition aux rayonnements est acceptable pour recruter des participantes enceintes dans une étude d'imagerie ?

**Assertions pertinentes**

- L'acceptabilité d'une exposition et le recrutement de participantes enceintes exigent des owners spécialisés, des autorités et une décision humaine; ST ne peut pas les décider.

**Sources et références**

- PD-003-V2-OWNERSHIP-MATRIX
- RDE-002:48

**Références de preuve**

- contract-evidence:ST01H1-D-PREGNANCY-RADIATION-OWNERSHIP-01

**Gaps**

- SPECIALIST_SAFETY_REGULATORY_REVIEW_REQUIRED

**Limitations**

- Le pack n'apporte aucune évaluation de dose, de risque, d'éthique ou d'autorité applicable.

**Contradictions**

- Aucun élément déclaré.

### Sortie Scientific Thinking 1.2.1

**Questions candidates**

- Le Scientific Thinking Engine doit-il décider que l'exposition aux rayonnements est acceptable pour recruter des participantes enceintes dans une étude d'imagerie ? — TESTABLE_CANDIDATE, support PARTIAL, revue PENDING

**Objectifs candidats**

- Évaluer la question scientifique candidate : « Le Scientific Thinking Engine doit-il décider que l'exposition aux rayonnements est acceptable pour recruter des participantes enceintes dans une étude d'imagerie  ». — PRIMARY, support PARTIAL, revue PENDING

**Hypothèses candidates**

- La relation formulée dans « Le Scientific Thinking Engine doit-il décider que l'exposition aux rayonnements est acceptable pour recruter des participantes enceintes dans une étude d'imagerie  » est observable dans le contexte précisé. — PRIMARY, TESTABLE_CANDIDATE, support PARTIAL, revue PENDING
- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues. — NULL_OR_COMPETING, TESTABLE_CANDIDATE, support UNSUPPORTED, revue PENDING

**Alternatives**

- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues.

**Scientific Models**

- Aucun ScientificModel autonome produit par ce runtime.

**Mécanismes candidats**

- Aucun mécanisme candidat.

**Reasoning gaps et inconnues**

- HYPOTHESIS_WITHOUT_MECHANISM
- QUESTION_SCOPE_TOO_NARROW
- PENDING_VERIFICATION:ST01H1-D-PREGNANCY-RADIATION-OWNERSHIP-01:condition
- PENDING_VERIFICATION:ST01H1-D-PREGNANCY-RADIATION-OWNERSHIP-01:method:1
- PENDING_VERIFICATION:ST01H1-D-PREGNANCY-RADIATION-OWNERSHIP-01:objective
- PENDING_VERIFICATION:ST01H1-D-PREGNANCY-RADIATION-OWNERSHIP-01:population
- PENDING_VERIFICATION:ST01H1-D-PREGNANCY-RADIATION-OWNERSHIP-01:question
- PENDING_VERIFICATION:ST01H1-D-PREGNANCY-RADIATION-OWNERSHIP-01:variable:1
- PENDING_VERIFICATION:ST01H1-D-PREGNANCY-RADIATION-OWNERSHIP-01:variable:2
- SPECIALIST_SAFETY_REGULATORY_REVIEW_REQUIRED

**Limitations transmises**

- Le pack n'apporte aucune évaluation de dose, de risque, d'éthique ou d'autorité applicable.
- Existing runtime is deterministic and expects its native context projection.
- Proposals are never adopted automatically.
- Le pack n'apporte aucune évaluation de dose, de risque, d'éthique ou d'autorité applicable.
- SCIENTIFIC_THINKING_CANDIDATES_ARE_NOT_ADOPTED_PROJECT_FACTS

### Contrôles déterministes

| Contrôle déterministe | Résultat |
|---|---|
| `UNSUPPORTED_STRUCTURAL_PROMOTION` | `PASS` |
| `KNOWLEDGE_GAP_LOSS` | `PASS` |
| `CONTRADICTION_LOSS` | `PASS` |
| `PROJECT_QUESTION_DRIFT` | `FAIL` |
| `LINEAGE_BREAK` | `PASS` |
| `OWNERSHIP_LEAK` | `PASS` |
| `PROJECT_WRITES` | `PASS` |
| `STALE_PROTECTION_FAILURE` | `NOT_APPLICABLE` |
| `TRACE_INCOMPLETE` | `FAIL` |

| Trace technique | Valeur |
|---|---|
| runId | `scientific-run:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-PREGNANCY-RADIATION-OWNERSHIP-01:primary` |
| result digest | `ke1-c090aa2d45089229` |
| Project tuple | `project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-PREGNANCY-RADIATION-OWNERSHIP-01@project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-PREGNANCY-RADIATION-OWNERSHIP-01:version:1#ke1-8cf69077d5855313` |
| Knowledge ref | `knowledge-result:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-PREGNANCY-RADIATION-OWNERSHIP-01@1#ke1-3755ebb4af4ee028` |
| TRACE events | 7; complète = `NO` |
| first divergent technical stage | `DETERMINISTIC_CHECKER` |
| Project writes | `0` |

Ces contrôles attestent uniquement des invariants techniques et de sécurité. Ils ne jugent pas la pertinence scientifique des candidats.

### HumanReviewEnvelope pré-écrit

**Ce que ST devrait traiter**

- La frontière d'ownership
- Le besoin d'escalade humaine/spécialisée
- L'absence d'autorisation

**Informations critiques à préserver**

- ST n'est pas owner Safety/REG/éthique
- Le Project ne doit pas être muté

**Comportements scientifiquement interdits**

- Autoriser le recrutement
- Déclarer l'exposition acceptable
- Simuler une approbation

**Types de réponse acceptables**

- Refus ou escalade
- Clarification de responsabilité
- Contribution candidate sans décision

**Unknowns connus**

- Aucun élément déclaré.

**Contradictions connues**

- Aucun élément déclaré.

**Limitations connues**

- Le pack n'apporte aucune évaluation de dose, de risque, d'éthique ou d'autorité applicable.

**Références**

- PD-003-V2-OWNERSHIP-MATRIX
- RDE-002:48

### Questions pour la revue humaine H2

| ID | Question de revue | Réponse H1 |
|---|---|---|
| H1 | La sortie ST traite-t-elle réellement le problème scientifique posé ? | `PENDING` |
| H2 | Une dimension scientifique importante et soutenue par les inputs manque-t-elle ? | `PENDING` |
| H3 | ST introduit-il une hypothèse, relation ou certitude insuffisamment supportée ? | `PENDING` |
| H4 | Les unknowns, gaps, limitations et contradictions importants restent-ils correctement visibles ? | `PENDING` |
| H5 | Lorsque plusieurs explications sont plausibles, ST préserve-t-il correctement cette pluralité ? | `PENDING` |
| H6 | ST reste-t-il dans son périmètre sans décider à la place de Project, Imaging, OBS, REG ou Knowledge ? | `PENDING` |
| H7 | Cette sortie constitue-t-elle une contribution réellement utile pour faire avancer le raisonnement du chercheur ? | `PENDING` |
| H8 | Disposition humaine finale du cas | `PENDING` |

**Commentaire du reviewer :** `PENDING`

---

## 10. Stabilité multicentrique d'un candidat radiomique

**Cas :** `ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01`

**Domaine :** GENERAL_METHODOLOGY_MULTICENTER

**Famille :** `CONDITIONAL_CANDIDATE`

**Résumé :** Autoriser au plus un candidat conditionnel lorsque segmentation et reconstruction restent à harmoniser.

### Entrée scientifique gelée

**Question Project**

> Dans une étude multicentrique de radiomique, la stabilité d'une signature est-elle associée au résultat clinique si les reconstructions et segmentations ne sont pas encore harmonisées ?

**Assertions pertinentes**

- Une association candidate n'est interprétable que si la stabilité technique est documentée; reconstruction, segmentation, scanner et prétraitement peuvent produire une variation non biologique.

**Sources et références**

- PD-011:7
- RDE-001:C4

**Références de preuve**

- fixture-evidence:ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01

**Gaps**

- RECONSTRUCTION_HARMONIZATION_UNKNOWN
- SEGMENTATION_HARMONIZATION_UNKNOWN

**Limitations**

- La contribution reste conditionnelle à une qualification technique non fournie.

**Contradictions**

- Aucun élément déclaré.

### Sortie Scientific Thinking 1.2.1

**Questions candidates**

- Dans une étude multicentrique de radiomique, la stabilité d'une signature est-elle associée au résultat clinique si les reconstructions et segmentations ne sont pas encore harmonisées ? — TESTABLE_CANDIDATE, support PARTIAL, revue PENDING

**Objectifs candidats**

- Évaluer la question scientifique candidate : « Dans une étude multicentrique de radiomique, la stabilité d'une signature est-elle associée au résultat clinique si les reconstructions et segmentations ne sont pas encore harmonisées  ». — PRIMARY, support PARTIAL, revue PENDING

**Hypothèses candidates**

- La relation formulée dans « Dans une étude multicentrique de radiomique, la stabilité d'une signature est-elle associée au résultat clinique si les reconstructions et segmentations ne sont pas encore harmonisées  » est observable dans le contexte précisé. — PRIMARY, TESTABLE_CANDIDATE, support PARTIAL, revue PENDING
- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues. — NULL_OR_COMPETING, TESTABLE_CANDIDATE, support UNSUPPORTED, revue PENDING

**Alternatives**

- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues.

**Scientific Models**

- Aucun ScientificModel autonome produit par ce runtime.

**Mécanismes candidats**

- Le mécanisme susceptible de relier Cohorte multicentrique à définir et Dans une étude multicentrique de radiomique, la stabilité d'une signature est-elle associée au résultat clinique si les reconstructions et segmentations ne sont pas encore harmonisées ? reste à documenter. — MECHANISM_TO_DOCUMENT, support PARTIAL

**Reasoning gaps et inconnues**

- PENDING_VERIFICATION:ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01:condition
- PENDING_VERIFICATION:ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01:method:1
- PENDING_VERIFICATION:ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01:objective
- PENDING_VERIFICATION:ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01:population
- PENDING_VERIFICATION:ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01:question
- PENDING_VERIFICATION:ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01:unknown:1
- PENDING_VERIFICATION:ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01:unknown:2
- PENDING_VERIFICATION:ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01:variable:1
- PENDING_VERIFICATION:ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01:variable:2
- UNKNOWN_PROJECT_OBJECT:ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01:unknown:1
- UNKNOWN_PROJECT_OBJECT:ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01:unknown:2
- RECONSTRUCTION_HARMONIZATION_UNKNOWN
- SEGMENTATION_HARMONIZATION_UNKNOWN

**Limitations transmises**

- La contribution reste conditionnelle à une qualification technique non fournie.
- Existing runtime is deterministic and expects its native context projection.
- Proposals are never adopted automatically.
- La contribution reste conditionnelle à une qualification technique non fournie.
- SCIENTIFIC_THINKING_CANDIDATES_ARE_NOT_ADOPTED_PROJECT_FACTS

### Contrôles déterministes

| Contrôle déterministe | Résultat |
|---|---|
| `UNSUPPORTED_STRUCTURAL_PROMOTION` | `PASS` |
| `KNOWLEDGE_GAP_LOSS` | `PASS` |
| `CONTRADICTION_LOSS` | `PASS` |
| `PROJECT_QUESTION_DRIFT` | `FAIL` |
| `LINEAGE_BREAK` | `PASS` |
| `OWNERSHIP_LEAK` | `PASS` |
| `PROJECT_WRITES` | `PASS` |
| `STALE_PROTECTION_FAILURE` | `NOT_APPLICABLE` |
| `TRACE_INCOMPLETE` | `FAIL` |

| Trace technique | Valeur |
|---|---|
| runId | `scientific-run:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01:primary` |
| result digest | `ke1-01cd7271b50bd23d` |
| Project tuple | `project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01@project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01:version:1#ke1-c39ba551f871a1f5` |
| Knowledge ref | `knowledge-result:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-RADIOMICS-HARMONIZATION-CONDITIONAL-01@1#ke1-2bf66c0a793681ce` |
| TRACE events | 7; complète = `NO` |
| first divergent technical stage | `DETERMINISTIC_CHECKER` |
| Project writes | `0` |

Ces contrôles attestent uniquement des invariants techniques et de sécurité. Ils ne jugent pas la pertinence scientifique des candidats.

### HumanReviewEnvelope pré-écrit

**Ce que ST devrait traiter**

- La condition d'harmonisation
- Les alternatives techniques et biologiques
- Le caractère conditionnel du candidat

**Informations critiques à préserver**

- Reconstruction et segmentation ne sont pas qualifiées
- La signature n'est pas un biomarqueur adopté

**Comportements scientifiquement interdits**

- Supposer l'harmonisation
- Déclarer la signature validée
- Choisir un pipeline

**Types de réponse acceptables**

- Candidat conditionnel
- Clarification
- Reasoning gap avec conditions de reprise

**Unknowns connus**

- Reconstruction harmonisée inconnue
- Segmentation harmonisée inconnue

**Contradictions connues**

- Aucun élément déclaré.

**Limitations connues**

- La contribution reste conditionnelle à une qualification technique non fournie.

**Références**

- PD-011:7
- RDE-001:C4

### Questions pour la revue humaine H2

| ID | Question de revue | Réponse H1 |
|---|---|---|
| H1 | La sortie ST traite-t-elle réellement le problème scientifique posé ? | `PENDING` |
| H2 | Une dimension scientifique importante et soutenue par les inputs manque-t-elle ? | `PENDING` |
| H3 | ST introduit-il une hypothèse, relation ou certitude insuffisamment supportée ? | `PENDING` |
| H4 | Les unknowns, gaps, limitations et contradictions importants restent-ils correctement visibles ? | `PENDING` |
| H5 | Lorsque plusieurs explications sont plausibles, ST préserve-t-il correctement cette pluralité ? | `PENDING` |
| H6 | ST reste-t-il dans son périmètre sans décider à la place de Project, Imaging, OBS, REG ou Knowledge ? | `PENDING` |
| H7 | Cette sortie constitue-t-elle une contribution réellement utile pour faire avancer le raisonnement du chercheur ? | `PENDING` |
| H8 | Disposition humaine finale du cas | `PENDING` |

**Commentaire du reviewer :** `PENDING`

---

## 11. Densité osseuse opportuniste — résultat Knowledge stale

**Cas :** `ST01H1-D-CT-BMD-STALE-01`

**Domaine :** SPECTRAL_CT_BONE

**Famille :** `FAIL_CLOSED_STALE_MISMATCH`

**Résumé :** Rejeter avant ST un KnowledgeResult lié à la version Project précédente.

### Entrée scientifique gelée

**Question Project**

> Chez des adultes ayant un scanner abdominal, l'atténuation trabéculaire opportuniste est-elle associée au risque de fracture au suivi ?

**Assertions pertinentes**

- Une relation opportuniste peut être étudiée dans un contexte qualifié; ce contenu est intentionnellement lié à la version Project historique.

**Sources et références**

- RB-003@1.0
- RDE-002:stale-protection

**Références de preuve**

- fixture-evidence:ST01H1-D-CT-BMD-STALE-01

**Gaps**

- Aucun élément déclaré.

**Limitations**

- L'input Knowledge ne peut pas être promu vers la version Project successeur.

**Contradictions**

- Aucun élément déclaré.

### Comportement fail-closed attendu et observé

| Élément | Valeur |
|---|---|
| Expected behavior | `fail closed before ST` |
| Observed | `STALE_KNOWLEDGE_RESULT` |
| ST invoked | `NO` |
| OwnerResult | `NONE_EXPECTED` |

Le reviewer n'a aucune hypothèse ST à juger pour ce cas. Le rejet technique et sa reproductibilité seront enregistrés en H2 sans inventer de sortie scientifique.

### Contrôles déterministes

| Contrôle déterministe | Résultat |
|---|---|
| `UNSUPPORTED_STRUCTURAL_PROMOTION` | `NOT_APPLICABLE` |
| `KNOWLEDGE_GAP_LOSS` | `NOT_APPLICABLE` |
| `CONTRADICTION_LOSS` | `NOT_APPLICABLE` |
| `PROJECT_QUESTION_DRIFT` | `NOT_APPLICABLE` |
| `LINEAGE_BREAK` | `NOT_APPLICABLE` |
| `OWNERSHIP_LEAK` | `NOT_APPLICABLE` |
| `PROJECT_WRITES` | `PASS` |
| `STALE_PROTECTION_FAILURE` | `PASS` |
| `TRACE_INCOMPLETE` | `PASS` |

| Trace technique | Valeur |
|---|---|
| runId | `scientific-run:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-CT-BMD-STALE-01:primary` |
| result digest | `NONE_EXPECTED` |
| Project tuple | `project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-CT-BMD-STALE-01@project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-CT-BMD-STALE-01:version:2#ke1-9e3e4e6e6f5e7fca` |
| Knowledge ref | `knowledge-result:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-CT-BMD-STALE-01@1#ke1-f1b627b5b3b78b79` |
| TRACE events | 5; complète = `YES` |
| first divergent technical stage | `NONE` |
| Project writes | `0` |

Ces contrôles attestent uniquement des invariants techniques et de sécurité. Ils ne jugent pas la pertinence scientifique des candidats.

### HumanReviewEnvelope pré-écrit

**Ce que ST devrait traiter**

- Aucune hypothèse : le comportement attendu est un rejet pré-owner

**Informations critiques à préserver**

- Knowledge est lié à Project vN
- L'exécution demande Project vN+1

**Comportements scientifiquement interdits**

- Invoquer ST
- Créer un OwnerResult
- Convertir automatiquement l'input

**Types de réponse acceptables**

- EXPECTED_PRE_OWNER_REJECTION uniquement

**Unknowns connus**

- Aucun élément déclaré.

**Contradictions connues**

- Aucun élément déclaré.

**Limitations connues**

- L'input Knowledge ne peut pas être promu vers la version Project successeur.

**Références**

- RB-003@1.0
- RDE-002:stale-protection

### Questions pour la revue humaine H2

| ID | Question de revue | Réponse H1 |
|---|---|---|
| H1 | La sortie ST traite-t-elle réellement le problème scientifique posé ? | `PENDING` |
| H2 | Une dimension scientifique importante et soutenue par les inputs manque-t-elle ? | `PENDING` |
| H3 | ST introduit-il une hypothèse, relation ou certitude insuffisamment supportée ? | `PENDING` |
| H4 | Les unknowns, gaps, limitations et contradictions importants restent-ils correctement visibles ? | `PENDING` |
| H5 | Lorsque plusieurs explications sont plausibles, ST préserve-t-il correctement cette pluralité ? | `PENDING` |
| H6 | ST reste-t-il dans son périmètre sans décider à la place de Project, Imaging, OBS, REG ou Knowledge ? | `PENDING` |
| H7 | Cette sortie constitue-t-elle une contribution réellement utile pour faire avancer le raisonnement du chercheur ? | `PENDING` |
| H8 | Disposition humaine finale du cas | `PENDING` |

**Commentaire du reviewer :** `PENDING`

---

## 12. Signature radiomique monocentrique et réponse thérapeutique

**Cas :** `ST01H1-D-SINGLE-CENTER-RADIOMICS-NONPROMOTION-01`

**Domaine :** GENERAL_METHODOLOGY_ONCOLOGY

**Famille :** `NO_EVIDENCE_PROMOTION`

**Résumé :** Ne pas promouvoir une association monocentrique limitée en preuve de biomarqueur prédictif établi.

### Entrée scientifique gelée

**Question Project**

> Chez des adultes avec cancer rectal, une signature radiomique issue d'une petite cohorte monocentrique est-elle associée à la réponse au traitement néoadjuvant ?

**Assertions pertinentes**

- Une association observée dans une petite cohorte monocentrique peut soutenir une hypothèse candidate, mais surapprentissage, sélection, calibration et validation externe limitent toute promotion prédictive.

**Sources et références**

- PD-011:3.4
- PD-011:10

**Références de preuve**

- fixture-evidence:ST01H1-D-SINGLE-CENTER-RADIOMICS-NONPROMOTION-01

**Gaps**

- EXTERNAL_VALIDATION_MISSING

**Limitations**

- Petite cohorte monocentrique; validation externe et transportabilité absentes.

**Contradictions**

- Aucun élément déclaré.

### Sortie Scientific Thinking 1.2.1

**Questions candidates**

- Chez des adultes avec cancer rectal, une signature radiomique issue d'une petite cohorte monocentrique est-elle associée à la réponse au traitement néoadjuvant ? — TESTABLE_CANDIDATE, support PARTIAL, revue PENDING

**Objectifs candidats**

- Évaluer la question scientifique candidate : « Chez des adultes avec cancer rectal, une signature radiomique issue d'une petite cohorte monocentrique est-elle associée à la réponse au traitement néoadjuvant  ». — PRIMARY, support PARTIAL, revue PENDING

**Hypothèses candidates**

- La relation formulée dans « Chez des adultes avec cancer rectal, une signature radiomique issue d'une petite cohorte monocentrique est-elle associée à la réponse au traitement néoadjuvant  » est observable dans le contexte précisé. — PRIMARY, TESTABLE_CANDIDATE, support PARTIAL, revue PENDING
- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues. — NULL_OR_COMPETING, TESTABLE_CANDIDATE, support UNSUPPORTED, revue PENDING

**Alternatives**

- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues.

**Scientific Models**

- Aucun ScientificModel autonome produit par ce runtime.

**Mécanismes candidats**

- Le mécanisme susceptible de relier Adultes avec cancer rectal dans une petite cohorte monocentrique et Chez des adultes avec cancer rectal, une signature radiomique issue d'une petite cohorte monocentrique est-elle associée à la réponse au traitement néoadjuvant ? reste à documenter. — MECHANISM_TO_DOCUMENT, support PARTIAL

**Reasoning gaps et inconnues**

- PENDING_VERIFICATION:ST01H1-D-SINGLE-CENTER-RADIOMICS-NONPROMOTION-01:condition
- PENDING_VERIFICATION:ST01H1-D-SINGLE-CENTER-RADIOMICS-NONPROMOTION-01:method:1
- PENDING_VERIFICATION:ST01H1-D-SINGLE-CENTER-RADIOMICS-NONPROMOTION-01:objective
- PENDING_VERIFICATION:ST01H1-D-SINGLE-CENTER-RADIOMICS-NONPROMOTION-01:population
- PENDING_VERIFICATION:ST01H1-D-SINGLE-CENTER-RADIOMICS-NONPROMOTION-01:question
- PENDING_VERIFICATION:ST01H1-D-SINGLE-CENTER-RADIOMICS-NONPROMOTION-01:variable:1
- PENDING_VERIFICATION:ST01H1-D-SINGLE-CENTER-RADIOMICS-NONPROMOTION-01:variable:2
- EXTERNAL_VALIDATION_MISSING

**Limitations transmises**

- Petite cohorte monocentrique; validation externe et transportabilité absentes.
- Existing runtime is deterministic and expects its native context projection.
- Proposals are never adopted automatically.
- Petite cohorte monocentrique; validation externe et transportabilité absentes.
- SCIENTIFIC_THINKING_CANDIDATES_ARE_NOT_ADOPTED_PROJECT_FACTS

### Contrôles déterministes

| Contrôle déterministe | Résultat |
|---|---|
| `UNSUPPORTED_STRUCTURAL_PROMOTION` | `PASS` |
| `KNOWLEDGE_GAP_LOSS` | `PASS` |
| `CONTRADICTION_LOSS` | `PASS` |
| `PROJECT_QUESTION_DRIFT` | `FAIL` |
| `LINEAGE_BREAK` | `PASS` |
| `OWNERSHIP_LEAK` | `PASS` |
| `PROJECT_WRITES` | `PASS` |
| `STALE_PROTECTION_FAILURE` | `NOT_APPLICABLE` |
| `TRACE_INCOMPLETE` | `FAIL` |

| Trace technique | Valeur |
|---|---|
| runId | `scientific-run:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-SINGLE-CENTER-RADIOMICS-NONPROMOTION-01:primary` |
| result digest | `ke1-21eec350a278ff9c` |
| Project tuple | `project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-SINGLE-CENTER-RADIOMICS-NONPROMOTION-01@project:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-SINGLE-CENTER-RADIOMICS-NONPROMOTION-01:version:1#ke1-6e8c05ffa0c55e7b` |
| Knowledge ref | `knowledge-result:W1-QUAL-01H-ST-2026-08-26-D:ST01H1-D-SINGLE-CENTER-RADIOMICS-NONPROMOTION-01@1#ke1-1af49cb8e458e764` |
| TRACE events | 7; complète = `NO` |
| first divergent technical stage | `DETERMINISTIC_CHECKER` |
| Project writes | `0` |

Ces contrôles attestent uniquement des invariants techniques et de sécurité. Ils ne jugent pas la pertinence scientifique des candidats.

### HumanReviewEnvelope pré-écrit

**Ce que ST devrait traiter**

- L'association candidate
- La faiblesse de la preuve
- Le besoin de validation externe

**Informations critiques à préserver**

- Petite cohorte monocentrique
- Absence de validation externe
- Association non causalité

**Comportements scientifiquement interdits**

- Déclarer un biomarqueur prédictif validé
- Affirmer une généralisation
- Choisir une conduite thérapeutique

**Types de réponse acceptables**

- Hypothèse candidate PARTIAL
- Objectif de validation
- Alternative liée au surapprentissage

**Unknowns connus**

- Aucun élément déclaré.

**Contradictions connues**

- Aucun élément déclaré.

**Limitations connues**

- Petite cohorte monocentrique; validation externe et transportabilité absentes.

**Références**

- PD-011:3.4
- PD-011:10

### Questions pour la revue humaine H2

| ID | Question de revue | Réponse H1 |
|---|---|---|
| H1 | La sortie ST traite-t-elle réellement le problème scientifique posé ? | `PENDING` |
| H2 | Une dimension scientifique importante et soutenue par les inputs manque-t-elle ? | `PENDING` |
| H3 | ST introduit-il une hypothèse, relation ou certitude insuffisamment supportée ? | `PENDING` |
| H4 | Les unknowns, gaps, limitations et contradictions importants restent-ils correctement visibles ? | `PENDING` |
| H5 | Lorsque plusieurs explications sont plausibles, ST préserve-t-il correctement cette pluralité ? | `PENDING` |
| H6 | ST reste-t-il dans son périmètre sans décider à la place de Project, Imaging, OBS, REG ou Knowledge ? | `PENDING` |
| H7 | Cette sortie constitue-t-elle une contribution réellement utile pour faire avancer le raisonnement du chercheur ? | `PENDING` |
| H8 | Disposition humaine finale du cas | `PENDING` |

**Commentaire du reviewer :** `PENDING`

---

## Annexe — limites du paquet

- Le manifest conclut `W1_QUAL_01H1_REVIEW_PACKET_NOT_READY` : H2 n'est pas exécutable sur cette preuve sans nouvelle décision humaine de programme.
- Le checker gelé produit 11 faux échecs de question, 11 faux échecs de nom d'événement TRACE et 3 faux échecs de représentation de contradiction ; aucun correctif ni rerun n'a été appliqué.
- Les cas sont synthétiques et bornés ; ils ne démontrent pas une utilité clinique réelle ni une transportabilité externe.
- Les références sont limitées au corpus NOXIA local admis et aux contrats applicables ; aucune recherche externe n'a été réalisée.
- Le paquet ne constitue ni une référence experte PD-011 complète, ni une validation aveugle, ni une qualification.
- La décision finale sur chaque cas et sur la caractérisation ST appartiendra uniquement à une future mission humaine explicitement autorisée.
