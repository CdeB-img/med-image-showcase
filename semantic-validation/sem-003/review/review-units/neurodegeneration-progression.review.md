# SEM3B3-RU-CAL-NEURODEGENERATION-PROGRESSION — Progression neurodégénérative multimodale

**Statut :** `HUMAN_REVIEW_REQUIRED`

**Set :** `CALIBRATION` · **Priorité :** `CALIBRATION_GATE`

**Case :** `SEM3-CAL-NEURODEGENERATION-PROGRESSION` v1.0.0 · **Envelope :** v1.0.0

## Identity

| Champ | Valeur |
|---|---|
| Domaine | neuro-imagerie et neurodégénérescence |
| Catégorie | `COMPLETE_SCIENTIFIC_REQUEST` |
| Difficulté | `INTERMEDIATE` |
| Langue | `fr-FR` |
| Tours | 1 |

## Scientific request

> **turn-1 — USER.** Je veux étudier sur deux ans l'évolution conjointe d'un signal d'imagerie moléculaire et de l'atrophie, sans supposer que l'un explique l'autre et sans les fusionner en un biomarqueur unique.

## Current interpretation — candidate only

Candidat Calibration original à un tour sur deux observables longitudinales non fusionnées.

État actif et obligations reconstructibles :

- Préserver l'horizon de deux ans.
- Conserver distincts signal moléculaire et atrophie.
- Étudier une évolution conjointe sans explication causale.

Historique/superseded :

- Aucun élément déclaré.

Unknowns intentionnels :

- Les méthodes, régions et temps intermédiaires ne sont pas précisés.

Ambiguïtés candidates :

- Aucun élément déclaré.

## Acceptance Envelope — human view

### Required

- Préserver l'horizon de deux ans. — INHERENTLY_REQUIRED, CRITICAL, source : `source.conversationTurns[0]`
- Conserver distincts signal moléculaire et atrophie. — INHERENTLY_REQUIRED, CRITICAL, source : `source.conversationTurns[0]`
- Étudier une évolution conjointe sans explication causale. — INHERENTLY_REQUIRED, CRITICAL, source : `source.conversationTurns[0]`

### Prohibited

- Fusionner les observables en un biomarqueur unique non demandé. — `CONCEPTUAL_PLAN_COLLAPSE`, CRITICAL
- Ajouter une direction causale entre les observables. — `POLARITY_OR_CAUSALITY_FAILURE`, CRITICAL

### Optional relevant

- Analyses régionales comme options spécialisées, non comme exigences. — `OPTION`, absence bloquante : non, enveloppe non exhaustive : oui

### Clarification

- Statut candidat : `OPTIONAL`.
- Impact décisionnel : Les définitions de mesure peuvent être qualifiées en aval sans changer l'intention longitudinale.
- Classes recevables : Régions et méthodes disponibles.
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
- `PROPERTY_NONCRITICAL_FORM_VARIATION_ALLOWED` — `SCIENTIFIC_UNDERSTANDING_COMPETENCE`, absolue : non
- `PROPERTY_NO_UNSUPPORTED_CAUSAL_PROMOTION` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_NO_UNSUPPORTED_INVENTION` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_POLARITY_AND_CONDITIONALITY_PRESERVED` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_SEMANTIC_EQUIVALENCE_RECOGNIZED` — `SCIENTIFIC_UNDERSTANDING_COMPETENCE`, absolue : non

## Open review points

### `SEM3B1-REVIEW-039` — `SCIENTIFIC_REVIEW_REQUIRED`

- Point : Scientific readability of REQUIRED, PROHIBITED and OPTIONAL_RELEVANT.
- Proposition actuelle : Acceptance Envelope candidate as versioned in the corpus.
- Alternatives raisonnables : Accept as authored ; Revise with a new version ; Reject from active corpus.
- Compétence : Scientific domain expert familiar with the scenario.
- Conséquence si ouvert : Candidate remains DESIGN_ONLY and cannot enter formal Calibration.

### `SEM3B1-REVIEW-040` — `CALIBRATION_REVIEW_REQUIRED`

- Point : SEM-003B Calibration gate.
- Proposition actuelle : Acceptance Envelope candidate as versioned in the corpus.
- Alternatives raisonnables : Accept as authored ; Revise with a new version ; Reject from active corpus.
- Compétence : PD-011 methodological governance and scientific reviewer.
- Conséquence si ouvert : CALIBRATION_VISIBLE is forbidden; candidate remains DESIGN_ONLY.

### `SEM3B1-REVIEW-041` — `PARENTAGE_REVIEW_REQUIRED`

- Point : Independent inter-set parentage review.
- Proposition actuelle : Acceptance Envelope candidate as versioned in the corpus.
- Alternatives raisonnables : Accept as authored ; Revise with a new version ; Reject from active corpus.
- Compétence : Independent benchmark methodologist.
- Conséquence si ouvert : Candidate cannot be used for formal Calibration until reviewed.

### `SEM3B1-REVIEW-042` — `METHODOLOGICAL_REVIEW_REQUIRED`

- Point : Conceptual-plan separation and OBS boundary.
- Proposition actuelle : Acceptance Envelope candidate as versioned in the corpus.
- Alternatives raisonnables : Accept as authored ; Revise with a new version ; Reject from active corpus.
- Compétence : OBS measurement expert and SEM methodologist.
- Conséquence si ouvert : The evaluator cannot be trained on this distinction as final before OBS-aware review.


## Parentage — assistance only

**Statut de cette comparaison :** `REVIEW_ASSISTANCE_ONLY` — aucun seuil numérique et aucune conclusion automatique.

Development à comparer en priorité :

- `SEM3-DEV-BODY-COMPOSITION-AMBIGUITY` — catégories communes : PHENOMENON_VERSUS_OBSERVABLE ; caractéristiques communes : MISSING_INFORMATION, PHENOMENON_OBSERVABLE ; même groupe de domaine : oui.
- `SEM3-DEV-INTESTINAL-MOTILITY-METHOD` — catégories communes : PHENOMENON_VERSUS_OBSERVABLE ; caractéristiques communes : MISSING_INFORMATION, PHENOMENON_OBSERVABLE ; même groupe de domaine : oui.
- `SEM3-DEV-PANCREATIC-COMPOSITION-LONGITUDINAL` — catégories communes : COMPARISON_AND_TIMING, COMPLETE_SCIENTIFIC_REQUEST ; caractéristiques communes : MISSING_INFORMATION ; même groupe de domaine : oui.

Autres candidats Calibration à comparer en priorité :

- `SEM3-CAL-PULMONARY-HEMODYNAMICS-FOLLOWUP` — catégories communes : COMPARISON_AND_TIMING, PHENOMENON_VERSUS_OBSERVABLE ; caractéristiques communes : MISSING_INFORMATION, PHENOMENON_OBSERVABLE.
- `SEM3-CAL-MSK-INFLAMMATION-RESPONSE` — catégories communes : COMPARISON_AND_TIMING ; caractéristiques communes : MISSING_INFORMATION.
- `SEM3-CAL-ORGANOID-LIVE-SIGNAL-MEASUREMENT` — catégories communes : PHENOMENON_VERSUS_OBSERVABLE ; caractéristiques communes : MISSING_INFORMATION, PHENOMENON_OBSERVABLE.

Conclusion candidate B1, non humaine : `PARENTAGE_REVIEW_REQUIRED` ; Deux observables neurodégénératives sur deux ans, distinctes des ambiguïtés neuro-oncologiques Development. Contamination évidente identifiée : non.

Historique H01–H30 : B1 compared originalRequest only across H01-H30 and reported no source reuse; this is not an independent human conclusion.

Exemples exposés : SEM-002/SEM-003 exposed examples remain ineligible as Calibration sources; no reuse was declared by B1.

- Conclusion candidate : `UNDETERMINED — HUMAN_REVIEW_REQUIRED`.
- Incertitude restante : l’assistance par métadonnées ne mesure ni dérivation sémantique, ni contamination, ni indépendance d’authoring.



## Decision form

**SCIENTIFIC_REFERENCE**

- [ ] `ACCEPT`
- [ ] `ACCEPT_WITH_REVISION`
- [ ] `REJECT`
- [ ] `NEEDS_SPECIALIST_REVIEW`

**CALIBRATION_ADMISSION**

- [ ] `APPROVE`
- [ ] `DO_NOT_APPROVE`
- [ ] `DEFER`

**PARENTAGE**

- [ ] `PARENTAGE_CLEAR`
- [ ] `RELATED_VISIBLE_CASE`
- [ ] `CONTAMINATED_FOR_CALIBRATION`
- [ ] `PARENTAGE_REVIEW_UNRESOLVED`

**METHODOLOGICAL_REFERENCE**

- [ ] `ACCEPT`
- [ ] `ACCEPT_WITH_REVISION`
- [ ] `REJECT`
- [ ] `NEEDS_SPECIALIST_REVIEW`
- [ ] `NOT_REQUIRED`

**Rationale :**

**Reviewer reference (pseudonyme stable accepté) :**

**Reviewer role / compétence :**

**Indépendance pour le périmètre déclaré :** `INDEPENDENT_FOR_STATED_SCOPE` / `NOT_INDEPENDENT`

**Conflit :** `NO_CONFLICT_DECLARED` / `CONFLICT_DECLARED_AND_MANAGED` / `CONFLICT_REQUIRES_SECOND_REVIEW`

**Date :**

**Recommended disposition — à renseigner par l’humain :**

`CALIBRATION_VISIBLE` / `REJECTED` / `NEEDS_SPECIALIST_REVIEW`

**Impact d’exposition :** état courant `DESIGN_ONLY` ; aucune décision isolée ne promeut le cas ; le blind reste inéligible.

## Règles de preuve

- Au moins trois évaluateurs indépendants doivent établir une référence experte critique conformément à PD-011.
- Codex n’est pas reviewer humain et n’enregistre aucune décision dans cette phase.
- Toute révision doit préciser le delta ; toute décision incomplète reste ouverte.
- La décision structurée future doit respecter `semantic-validation/sem-003/review/contracts/human-decision-record.schema.json`.
