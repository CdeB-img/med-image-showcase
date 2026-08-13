# SEM3B3-RU-CAL-PULMONARY-HEMODYNAMICS-FOLLOWUP — Hémodynamique pulmonaire et suivi multimodal

**Statut :** `CALIBRATION_VISIBLE_SIMULATED_REVIEW`

**Set :** `CALIBRATION` · **Priorité :** `CALIBRATION_GATE`

**Case :** `SEM3-CAL-PULMONARY-HEMODYNAMICS-FOLLOWUP` v1.0.0 · **Envelope :** v1.0.0

## Identity

| Champ | Valeur |
|---|---|
| Domaine | cardiologie et hypertension pulmonaire |
| Catégorie | `COMPARISON_AND_TIMING` |
| Difficulté | `ADVANCED` |
| Langue | `fr-FR` |
| Tours | 7 |

## Scientific request

> **turn-1 — USER.** Je veux suivre l'hémodynamique pulmonaire après changement de prise en charge.
>
> **turn-2 — USER.** On a l'échographie de routine au départ.
>
> **turn-3 — USER.** Le cathétérisme n'est disponible que chez certains patients.
>
> **turn-4 — USER.** À six mois, l'évaluation sera surtout non invasive.
>
> **turn-5 — USER.** Je veux décrire l'évolution sans considérer les deux sources comme équivalentes.
>
> **turn-6 — USER.** La fonction du ventricule droit est aussi intéressante, mais secondaire.
>
> **turn-7 — USER.** Il faut garder distincts phénomène hémodynamique, observables et méthodes.

## Current interpretation — candidate only

Candidat Calibration original sur des sources hémodynamiques asymétriques ; aucune équivalence scientifique n'est affirmée.

État actif et obligations reconstructibles :

- Le suivi à six mois est principalement non invasif.
- La source invasive n'existe que dans un sous-ensemble.
- Les sources ne doivent pas être supposées équivalentes.
- Distinguer phénomène, observables et méthodes.

Historique/superseded :

- Aucun élément déclaré.

Unknowns intentionnels :

- Les observables principaux et la comparabilité des sources ne sont pas définis.

Ambiguïtés candidates :

- Aucun élément déclaré.

## Acceptance Envelope — human view

### Required

- Le suivi à six mois est principalement non invasif. — INHERENTLY_REQUIRED, CRITICAL, source : `source.conversationTurns[3]`
- La source invasive n'existe que dans un sous-ensemble. — INHERENTLY_REQUIRED, CRITICAL, source : `source.conversationTurns[2]`
- Les sources ne doivent pas être supposées équivalentes. — INHERENTLY_REQUIRED, CRITICAL, source : `source.conversationTurns[4]`
- Distinguer phénomène, observables et méthodes. — INHERENTLY_REQUIRED, CRITICAL, source : `source.conversationTurns[6]`

### Prohibited

- Fusionner les sources comme une même mesure interchangeable. — `CONCEPTUAL_PLAN_COLLAPSE`, CRITICAL
- Présenter le cathétérisme comme disponible ou obligatoire pour tous. — `EXPLICIT_FIDELITY_FAILURE`, CRITICAL

### Optional relevant

- Fonction ventriculaire droite comme contribution secondaire explicitement non principale. — `CONTEXTUAL_CANDIDATE`, absence bloquante : non, enveloppe non exhaustive : oui

### Clarification

- Statut candidat : `OPTIONAL`.
- Impact décisionnel : La définition des observables appartient à OBS et n'empêche pas l'authoring de la structure longitudinale.
- Classes recevables : Observable hémodynamique prioritaire.
- Formulation exacte imposée : non.

### Ownership

- SEM → Research Project / human decision : SEM peut préserver et structurer l'intention, les unknowns et les candidats ; il n'adopte pas une décision de projet. Promotion interdite : Inference, option or contextual candidate to adopted Project decision
- Knowledge / OBS / Imaging / Scientific Thinking → SEM benchmark reference : Les owners spécialisés qualifient preuves, mesures, acquisition ou hypothèses ; leur support n'est pas une déclaration utilisateur. Promotion interdite : Specialist support to explicit user fact or automatic endpoint

## Propriétés SEM-002 concernées

- `PROPERTY_CLARIFICATION_HAS_DECISIONAL_VALUE` — `SCIENTIFIC_UNDERSTANDING_COMPETENCE`, absolue : non
- `PROPERTY_COMPARISON_AND_TIMING_PRESERVED` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_CONCEPTUAL_PLAN_SEPARATION` — `SCIENTIFIC_UNDERSTANDING_COMPETENCE`, absolue : non
- `PROPERTY_EXPLICIT_CONTENT_PRESERVED` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_EXPLICIT_RELATIONS_PRESERVED` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_KNOWLEDGE_SUPPORT_NOT_PROJECT_TRUTH` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_NONCRITICAL_FORM_VARIATION_ALLOWED` — `SCIENTIFIC_UNDERSTANDING_COMPETENCE`, absolue : non
- `PROPERTY_NO_UNSUPPORTED_INVENTION` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_POLARITY_AND_CONDITIONALITY_PRESERVED` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_PROVENANCE_RECONSTRUCTIBLE` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_SEMANTIC_EQUIVALENCE_RECOGNIZED` — `SCIENTIFIC_UNDERSTANDING_COMPETENCE`, absolue : non

## Review points hérités de la queue B1

### `SEM3B1-REVIEW-024` — `SCIENTIFIC_REVIEW_REQUIRED`

- Point : Scientific readability of REQUIRED, PROHIBITED and OPTIONAL_RELEVANT.
- Proposition actuelle : Acceptance Envelope candidate as versioned in the corpus.
- Alternatives raisonnables : Accept as authored ; Revise with a new version ; Reject from active corpus.
- Compétence : Scientific domain expert familiar with the scenario.
- Conséquence si ouvert : Candidate remains DESIGN_ONLY and cannot enter formal Calibration.

### `SEM3B1-REVIEW-025` — `CALIBRATION_REVIEW_REQUIRED`

- Point : SEM-003B Calibration gate.
- Proposition actuelle : Acceptance Envelope candidate as versioned in the corpus.
- Alternatives raisonnables : Accept as authored ; Revise with a new version ; Reject from active corpus.
- Compétence : PD-011 methodological governance and scientific reviewer.
- Conséquence si ouvert : CALIBRATION_VISIBLE is forbidden; candidate remains DESIGN_ONLY.

### `SEM3B1-REVIEW-026` — `PARENTAGE_REVIEW_REQUIRED`

- Point : Independent inter-set parentage review.
- Proposition actuelle : Acceptance Envelope candidate as versioned in the corpus.
- Alternatives raisonnables : Accept as authored ; Revise with a new version ; Reject from active corpus.
- Compétence : Independent benchmark methodologist.
- Conséquence si ouvert : Candidate cannot be used for formal Calibration until reviewed.

### `SEM3B1-REVIEW-027` — `METHODOLOGICAL_REVIEW_REQUIRED`

- Point : Conceptual-plan separation and OBS boundary.
- Proposition actuelle : Acceptance Envelope candidate as versioned in the corpus.
- Alternatives raisonnables : Accept as authored ; Revise with a new version ; Reject from active corpus.
- Compétence : OBS measurement expert and SEM methodologist.
- Conséquence si ouvert : The evaluator cannot be trained on this distinction as final before OBS-aware review.


## Parentage — assistance only

**Statut de cette comparaison :** `REVIEW_ASSISTANCE_ONLY` — aucun seuil numérique et aucune conclusion automatique.

Development à comparer en priorité :

- `SEM3-DEV-CARDIAC-AGING-TRAJECTORY` — catégories communes : COMPARISON_AND_TIMING, MULTIDIMENSIONAL_REQUEST ; caractéristiques communes : MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP ; même groupe de domaine : oui.
- `SEM3-DEV-CT-FUNCTIONAL-ESTIMATE-ROLE` — catégories communes : PHENOMENON_VERSUS_OBSERVABLE ; caractéristiques communes : MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP, PHENOMENON_OBSERVABLE ; même groupe de domaine : oui.
- `SEM3-DEV-CORONARY-PERFUSION-PRIORITY` — catégories communes : COMPARISON_AND_TIMING ; caractéristiques communes : MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP ; même groupe de domaine : oui.

Autres candidats Calibration à comparer en priorité :

- `SEM3-CAL-ORGANOID-LIVE-SIGNAL-MEASUREMENT` — catégories communes : MULTIDIMENSIONAL_REQUEST, PHENOMENON_VERSUS_OBSERVABLE ; caractéristiques communes : MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP, PHENOMENON_OBSERVABLE.
- `SEM3-CAL-CONGENITAL-FLOW-ELLIPSIS` — catégories communes : COMPARISON_AND_TIMING, MULTIDIMENSIONAL_REQUEST ; caractéristiques communes : MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT.
- `SEM3-CAL-ATRIAL-FIBROSIS-ABLATION` — catégories communes : aucune ; caractéristiques communes : MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP.

Conclusion candidate B1, non humaine : `SIMULATED_PARENTAGE_CLEAR` ; Question hémodynamique pulmonaire, disponibilité invasive partielle et distinction phénomène/observable ; chaîne différente des cas Development valvulaires et perfusionnels. Contamination évidente identifiée : non.

Historique H01–H30 : B1 compared originalRequest only across H01-H30 and reported no source reuse; this is not an independent human conclusion.

Exemples exposés : SEM-002/SEM-003 exposed examples remain ineligible as Calibration sources; no reuse was declared by B1.

- Conclusion candidate : `UNDETERMINED — HUMAN_REVIEW_REQUIRED`.
- Incertitude restante : l’assistance par métadonnées ne mesure ni dérivation sémantique, ni contamination, ni indépendance d’authoring.



## Revue et disposition

### Avis séparés des trois personas

- **REVIEWER_SIM_1** — `SIMULATED_ACCEPT` — Pulmonary hemodynamics and follow-up remain explicit without presuming a disease mechanism or endpoint hierarchy.
- **REVIEWER_SIM_2** — `SIMULATED_ACCEPT` — Partial modality availability and follow-up timing remain reconstructible and do not become inclusion requirements.
- **REVIEWER_SIM_3** — `SIMULATED_ACCEPT` — The reference preserves conditionality, provenance and ownership; parentage is sufficiently distinct.

### Désaccords et résolution

- Aucun désaccord non résolu.

### Consensus simulé

The case is stable for calibration of timing, partial availability and non-promotion.

- `CALIBRATION_ADMISSION` → `SIMULATED_APPROVE_FOR_CALIBRATION` (SEM3B3-SIMDEC-PULMONARY-HEMODYNAMICS-FOLLOWUP-CALIBRATION-ADMISSION)
- `METHODOLOGICAL_REFERENCE` → `SIMULATED_ACCEPT` (SEM3B3-SIMDEC-PULMONARY-HEMODYNAMICS-FOLLOWUP-METHODOLOGICAL-REFERENCE)
- `PARENTAGE` → `SIMULATED_PARENTAGE_CLEAR` (SEM3B3-SIMDEC-PULMONARY-HEMODYNAMICS-FOLLOWUP-PARENTAGE)
- `SCIENTIFIC_REFERENCE` → `SIMULATED_ACCEPT` (SEM3B3-SIMDEC-PULMONARY-HEMODYNAMICS-FOLLOWUP-SCIENTIFIC-REFERENCE)

**Recommended disposition — à renseigner par l’humain :**

`CALIBRATION_VISIBLE` / `REJECTED` / `NEEDS_SPECIALIST_REVIEW`

**Impact d’exposition :** état courant `CALIBRATION_VISIBLE` ; aucune décision isolée ne promeut le cas ; le blind reste inéligible.

## Règles de preuve

- Les trois rôles enregistrés ici sont des personas simulées et ne valent jamais revue humaine.
- La revue simulée peut rendre une référence visible pour la calibration de développement, sans satisfaire la preuve confirmatoire PD-011.
- Toute révision doit préciser le delta ; toute décision incomplète reste ouverte.
- La trace structurée respecte `semantic-validation/sem-003/review/contracts/simulated-pluralistic-review-record.schema.json`.
