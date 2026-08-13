# SEM3B3-RU-CAL-CARDIO-RHYTHM-REMODELING — Charge rythmique et structure atriale sans promotion causale

**Statut :** `HUMAN_REVIEW_REQUIRED`

**Set :** `CALIBRATION` · **Priorité :** `CALIBRATION_GATE`

**Case :** `SEM3-CAL-CARDIO-RHYTHM-REMODELING` v1.0.0 · **Envelope :** v1.0.0

## Identity

| Champ | Valeur |
|---|---|
| Domaine | rythmologie et imagerie cardiaque |
| Catégorie | `NEGATION_AND_NON_CAUSALITY` |
| Difficulté | `ADVANCED` |
| Langue | `fr-FR` |
| Tours | 5 |

## Scientific request

> **turn-1 — USER.** Je veux suivre la charge d'arythmie et le volume atrial au cours du temps.
>
> **turn-2 — USER.** Au début je pensais dire que la charge rythmique expliquait le remodelage.
>
> **turn-3 — USER.** Ce n'est pas ce que je veux finalement.
>
> **turn-4 — USER.** Je veux étudier leur association, sans causalité automatique.
>
> **turn-5 — USER.** La méthode de mesure du rythme et celle du volume devront être qualifiées séparément.

## Current interpretation — candidate only

Candidat Calibration original séparant deux observables, leurs méthodes et une interprétation causale rejetée.

État actif et obligations reconstructibles :

- L'état actif porte sur l'association entre charge rythmique et volume atrial.
- L'explication causale du remodelage est un état rejeté.
- Les méthodes de mesure du rythme et du volume restent des définitions spécialisées distinctes.
- L'état scientifique courant, tel que défini après la dernière correction, doit rester actif.

Historique/superseded :

- Les formulations corrigées ou abandonnées restent reconstructibles comme historique sans rester actives.

Unknowns intentionnels :

- Les temps de mesure et les méthodes de quantification des deux observables ne sont pas définis.

Ambiguïtés candidates :

- Aucun élément déclaré.

## Acceptance Envelope — human view

### Required

- L'état actif porte sur l'association entre charge rythmique et volume atrial. — INHERENTLY_REQUIRED, CRITICAL, source : `source.conversationTurns[3]`
- L'explication causale du remodelage est un état rejeté. — INHERENTLY_REQUIRED, CRITICAL, source : `source.conversationTurns[2]`
- Les méthodes de mesure du rythme et du volume restent des définitions spécialisées distinctes. — INHERENTLY_REQUIRED, CRITICAL, source : `source.conversationTurns[4]`
- L'état scientifique courant, tel que défini après la dernière correction, doit rester actif. — INHERENTLY_REQUIRED, CRITICAL, source : `source.conversationTurns[4]`
- Les formulations corrigées ou abandonnées restent reconstructibles comme historique sans rester actives. — INHERENTLY_REQUIRED, MAJOR, source : `source.conversationTurns[4]`

### Prohibited

- Présenter la charge rythmique comme cause établie du remodelage. — `POLARITY_OR_CAUSALITY_FAILURE`, CRITICAL
- Adopter une méthode de mesure non fournie. — `OWNERSHIP_BOUNDARY_FAILURE`, CRITICAL

### Optional relevant

- Autres observations rythmiques ou structurelles comme candidats à documenter. — `CONTEXTUAL_CANDIDATE`, absence bloquante : non, enveloppe non exhaustive : oui

### Clarification

- Statut candidat : `OPTIONAL`.
- Impact décisionnel : Les temps et méthodes seront nécessaires au protocole, mais la correction causale est déjà explicite.
- Classes recevables : Temps de mesure ; Méthodes de mesure.
- Formulation exacte imposée : non.

### Ownership

- SEM → Research Project / human decision : SEM peut préserver et structurer l'intention, les unknowns et les candidats ; il n'adopte pas une décision de projet. Promotion interdite : Inference, option or contextual candidate to adopted Project decision
- Knowledge / OBS / Imaging / Scientific Thinking → SEM benchmark reference : Les owners spécialisés qualifient preuves, mesures, acquisition ou hypothèses ; leur support n'est pas une déclaration utilisateur. Promotion interdite : Specialist support to explicit user fact or automatic endpoint

## Propriétés SEM-002 concernées

- `PROPERTY_CLARIFICATION_HAS_DECISIONAL_VALUE` — `SCIENTIFIC_UNDERSTANDING_COMPETENCE`, absolue : non
- `PROPERTY_COMPARISON_AND_TIMING_PRESERVED` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_CONCEPTUAL_PLAN_SEPARATION` — `SCIENTIFIC_UNDERSTANDING_COMPETENCE`, absolue : non
- `PROPERTY_CORRECTION_PROPAGATED_WITH_HISTORY` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_EXPLICIT_RELATIONS_PRESERVED` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_NONCRITICAL_FORM_VARIATION_ALLOWED` — `SCIENTIFIC_UNDERSTANDING_COMPETENCE`, absolue : non
- `PROPERTY_NO_UNSUPPORTED_CAUSAL_PROMOTION` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_NO_UNSUPPORTED_INVENTION` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_OWNER_AND_ADOPTION_BOUNDARIES_PRESERVED` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_PROVENANCE_RECONSTRUCTIBLE` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_SEMANTIC_EQUIVALENCE_RECOGNIZED` — `SCIENTIFIC_UNDERSTANDING_COMPETENCE`, absolue : non

## Open review points

### `SEM3B1-REVIEW-035` — `SCIENTIFIC_REVIEW_REQUIRED`

- Point : Scientific readability of REQUIRED, PROHIBITED and OPTIONAL_RELEVANT.
- Proposition actuelle : Acceptance Envelope candidate as versioned in the corpus.
- Alternatives raisonnables : Accept as authored ; Revise with a new version ; Reject from active corpus.
- Compétence : Scientific domain expert familiar with the scenario.
- Conséquence si ouvert : Candidate remains DESIGN_ONLY and cannot enter formal Calibration.

### `SEM3B1-REVIEW-036` — `CALIBRATION_REVIEW_REQUIRED`

- Point : SEM-003B Calibration gate.
- Proposition actuelle : Acceptance Envelope candidate as versioned in the corpus.
- Alternatives raisonnables : Accept as authored ; Revise with a new version ; Reject from active corpus.
- Compétence : PD-011 methodological governance and scientific reviewer.
- Conséquence si ouvert : CALIBRATION_VISIBLE is forbidden; candidate remains DESIGN_ONLY.

### `SEM3B1-REVIEW-037` — `PARENTAGE_REVIEW_REQUIRED`

- Point : Independent inter-set parentage review.
- Proposition actuelle : Acceptance Envelope candidate as versioned in the corpus.
- Alternatives raisonnables : Accept as authored ; Revise with a new version ; Reject from active corpus.
- Compétence : Independent benchmark methodologist.
- Conséquence si ouvert : Candidate cannot be used for formal Calibration until reviewed.

### `SEM3B1-REVIEW-038` — `METHODOLOGICAL_REVIEW_REQUIRED`

- Point : Conceptual-plan separation and OBS boundary.
- Proposition actuelle : Acceptance Envelope candidate as versioned in the corpus.
- Alternatives raisonnables : Accept as authored ; Revise with a new version ; Reject from active corpus.
- Compétence : OBS measurement expert and SEM methodologist.
- Conséquence si ouvert : The evaluator cannot be trained on this distinction as final before OBS-aware review.


## Parentage — assistance only

**Statut de cette comparaison :** `REVIEW_ASSISTANCE_ONLY` — aucun seuil numérique et aucune conclusion automatique.

Development à comparer en priorité :

- `SEM3-DEV-CARDIAC-AGING-TRAJECTORY` — catégories communes : CHANGE_OF_MIND ; caractéristiques communes : CHANGE_OF_MIND, CORRECTION, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, NEGATION, OWNERSHIP ; même groupe de domaine : oui.
- `SEM3-DEV-CT-FUNCTIONAL-ESTIMATE-ROLE` — catégories communes : METHOD_VERSUS_MEASUREMENT ; caractéristiques communes : METHOD_MEASUREMENT, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP ; même groupe de domaine : oui.
- `SEM3-DEV-OUTCOME-PRIORITY-CHANGE` — catégories communes : CHANGE_OF_MIND ; caractéristiques communes : CHANGE_OF_MIND, CORRECTION, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP ; même groupe de domaine : non.

Autres candidats Calibration à comparer en priorité :

- `SEM3-CAL-ORGANOID-LIVE-SIGNAL-MEASUREMENT` — catégories communes : METHOD_VERSUS_MEASUREMENT ; caractéristiques communes : CORRECTION, METHOD_MEASUREMENT, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP.
- `SEM3-CAL-ATRIAL-FIBROSIS-ABLATION` — catégories communes : aucune ; caractéristiques communes : MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, NEGATION, OWNERSHIP.
- `SEM3-CAL-CORTISOL-SAMPLING-SUMMARY` — catégories communes : METHOD_VERSUS_MEASUREMENT ; caractéristiques communes : METHOD_MEASUREMENT, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP.

Conclusion candidate B1, non humaine : `PARENTAGE_REVIEW_REQUIRED` ; Association rythme-structure et méthodes de mesure séparées ; aucune chaîne factuelle équivalente en Development ou dans H01-H30. Contamination évidente identifiée : non.

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
