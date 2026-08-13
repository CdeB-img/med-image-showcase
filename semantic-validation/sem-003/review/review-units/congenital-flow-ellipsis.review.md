# SEM3B3-RU-CAL-CONGENITAL-FLOW-ELLIPSIS — Flux cardiovasculaire congénital et ellipses tardives

**Statut :** `CALIBRATION_VISIBLE_SIMULATED_REVIEW`

**Set :** `CALIBRATION` · **Priorité :** `CALIBRATION_GATE`

**Case :** `SEM3-CAL-CONGENITAL-FLOW-ELLIPSIS` v1.0.0 · **Envelope :** v1.0.0

## Identity

| Champ | Valeur |
|---|---|
| Domaine | cardiologie congénitale et imagerie de flux |
| Catégorie | `ELLIPSIS` |
| Difficulté | `COMPOSITIONAL` |
| Langue | `fr-FR` |
| Tours | 8 |

## Scientific request

> **turn-1 — USER.** Je veux comparer le flux avant et après correction chirurgicale.
>
> **turn-2 — USER.** La cohorte concerne des adultes avec une cardiopathie congénitale.
>
> **turn-3 — USER.** On a deux régions vasculaires d'intérêt.
>
> **turn-4 — USER.** La première est bien couverte, la seconde seulement chez certains.
>
> **turn-5 — USER.** Et pour ceux-là, au suivi tardif ?
>
> **turn-6 — USER.** Je parle des patients qui ont les deux régions mesurées.
>
> **turn-7 — USER.** Finalement la seconde région reste exploratoire.
>
> **turn-8 — USER.** La comparaison principale porte sur la première, avec l'historique de cette correction.

## Current interpretation — candidate only

Candidat Calibration original où deux ellipses dépendent d'antécédents conversationnels différents.

État actif et obligations reconstructibles :

- Rattacher 'ceux-là' au sous-groupe ayant les deux régions mesurées.
- La première région porte la comparaison principale active.
- La seconde région est exploratoire après correction.
- Le suivi tardif reste temporellement indéfini.
- L'état scientifique courant, tel que défini après la dernière correction, doit rester actif.

Historique/superseded :

- Les formulations corrigées ou abandonnées restent reconstructibles comme historique sans rester actives.

Unknowns intentionnels :

- Le temps exact du suivi tardif n'est pas défini.

Ambiguïtés candidates :

- Aucun élément déclaré.

## Acceptance Envelope — human view

### Required

- Rattacher 'ceux-là' au sous-groupe ayant les deux régions mesurées. — INHERENTLY_REQUIRED, CRITICAL, source : `source.conversationTurns[5]`
- La première région porte la comparaison principale active. — INHERENTLY_REQUIRED, CRITICAL, source : `source.conversationTurns[7]`
- La seconde région est exploratoire après correction. — INHERENTLY_REQUIRED, CRITICAL, source : `source.conversationTurns[6]`
- Le suivi tardif reste temporellement indéfini. — INHERENTLY_REQUIRED, CRITICAL, source : `source.conversationTurns[4]`
- L'état scientifique courant, tel que défini après la dernière correction, doit rester actif. — INHERENTLY_REQUIRED, CRITICAL, source : `source.conversationTurns[7]`
- Les formulations corrigées ou abandonnées restent reconstructibles comme historique sans rester actives. — INHERENTLY_REQUIRED, MAJOR, source : `source.conversationTurns[7]`

### Prohibited

- Étendre la seconde région à toute la cohorte. — `EXPLICIT_FIDELITY_FAILURE`, CRITICAL
- Maintenir la seconde région comme comparaison principale. — `RELATION_SEMANTICS_FAILURE`, CRITICAL

### Optional relevant

- Analyse du sous-groupe complet comme option exploratoire. — `OPTION`, absence bloquante : non, enveloppe non exhaustive : oui

### Clarification

- Statut candidat : `REQUIRED`.
- Impact décisionnel : Le calendrier tardif conditionne la comparaison temporelle.
- Classes recevables : Définition du suivi tardif.
- Formulation exacte imposée : non.

### Ownership

- SEM → Research Project / human decision : SEM peut préserver et structurer l'intention, les unknowns et les candidats ; il n'adopte pas une décision de projet. Promotion interdite : Inference, option or contextual candidate to adopted Project decision
- Knowledge / OBS / Imaging / Scientific Thinking → SEM benchmark reference : Les owners spécialisés qualifient preuves, mesures, acquisition ou hypothèses ; leur support n'est pas une déclaration utilisateur. Promotion interdite : Specialist support to explicit user fact or automatic endpoint

## Propriétés SEM-002 concernées

- `PROPERTY_AMBIGUITY_AND_UNKNOWN_PRESERVED` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_CLARIFICATION_HAS_DECISIONAL_VALUE` — `SCIENTIFIC_UNDERSTANDING_COMPETENCE`, absolue : non
- `PROPERTY_COMPARISON_AND_TIMING_PRESERVED` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_CORRECTION_PROPAGATED_WITH_HISTORY` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_EXPLICIT_CONTENT_PRESERVED` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_EXPLICIT_RELATIONS_PRESERVED` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_MISSING_CRITICAL_INFORMATION_DETECTED` — `SCIENTIFIC_UNDERSTANDING_COMPETENCE`, absolue : non
- `PROPERTY_NONCRITICAL_FORM_VARIATION_ALLOWED` — `SCIENTIFIC_UNDERSTANDING_COMPETENCE`, absolue : non
- `PROPERTY_NO_UNSUPPORTED_INVENTION` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_POLARITY_AND_CONDITIONALITY_PRESERVED` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_PROVENANCE_RECONSTRUCTIBLE` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_SEMANTIC_EQUIVALENCE_RECOGNIZED` — `SCIENTIFIC_UNDERSTANDING_COMPETENCE`, absolue : non

## Review points hérités de la queue B1

### `SEM3B1-REVIEW-032` — `SCIENTIFIC_REVIEW_REQUIRED`

- Point : Scientific readability of REQUIRED, PROHIBITED and OPTIONAL_RELEVANT.
- Proposition actuelle : Acceptance Envelope candidate as versioned in the corpus.
- Alternatives raisonnables : Accept as authored ; Revise with a new version ; Reject from active corpus.
- Compétence : Scientific domain expert familiar with the scenario.
- Conséquence si ouvert : Candidate remains DESIGN_ONLY and cannot enter formal Calibration.

### `SEM3B1-REVIEW-033` — `CALIBRATION_REVIEW_REQUIRED`

- Point : SEM-003B Calibration gate.
- Proposition actuelle : Acceptance Envelope candidate as versioned in the corpus.
- Alternatives raisonnables : Accept as authored ; Revise with a new version ; Reject from active corpus.
- Compétence : PD-011 methodological governance and scientific reviewer.
- Conséquence si ouvert : CALIBRATION_VISIBLE is forbidden; candidate remains DESIGN_ONLY.

### `SEM3B1-REVIEW-034` — `PARENTAGE_REVIEW_REQUIRED`

- Point : Independent inter-set parentage review.
- Proposition actuelle : Acceptance Envelope candidate as versioned in the corpus.
- Alternatives raisonnables : Accept as authored ; Revise with a new version ; Reject from active corpus.
- Compétence : Independent benchmark methodologist.
- Conséquence si ouvert : Candidate cannot be used for formal Calibration until reviewed.


## Parentage — assistance only

**Statut de cette comparaison :** `REVIEW_ASSISTANCE_ONLY` — aucun seuil numérique et aucune conclusion automatique.

Development à comparer en priorité :

- `SEM3-DEV-CORONARY-PERFUSION-PRIORITY` — catégories communes : COMPARISON_AND_TIMING, ELLIPSIS, NECESSARY_IMPLICIT ; caractéristiques communes : ELLIPSIS, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT ; même groupe de domaine : oui.
- `SEM3-DEV-CARDIAC-AGING-TRAJECTORY` — catégories communes : COMPARISON_AND_TIMING, MULTIDIMENSIONAL_REQUEST ; caractéristiques communes : CORRECTION, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT ; même groupe de domaine : oui.
- `SEM3-DEV-VALVE-HEMODYNAMICS-MULTIMODAL` — catégories communes : COMPARISON_AND_TIMING, MULTIDIMENSIONAL_REQUEST, NECESSARY_IMPLICIT ; caractéristiques communes : MULTI_TURN_CONTEXT_DEPENDENT ; même groupe de domaine : oui.

Autres candidats Calibration à comparer en priorité :

- `SEM3-CAL-ORGANOID-LIVE-SIGNAL-MEASUREMENT` — catégories communes : MULTIDIMENSIONAL_REQUEST ; caractéristiques communes : CORRECTION, ELLIPSIS, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT.
- `SEM3-CAL-PULMONARY-HEMODYNAMICS-FOLLOWUP` — catégories communes : COMPARISON_AND_TIMING, MULTIDIMENSIONAL_REQUEST ; caractéristiques communes : MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT.
- `SEM3-CAL-CARDIO-RHYTHM-REMODELING` — catégories communes : aucune ; caractéristiques communes : CORRECTION, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT.

Conclusion candidate B1, non humaine : `SIMULATED_PARENTAGE_CLEAR` ; Ellipses sur sous-groupe et régions de flux avec correction de priorité ; structure non dérivée des cas Development. Contamination évidente identifiée : non.

Historique H01–H30 : B1 compared originalRequest only across H01-H30 and reported no source reuse; this is not an independent human conclusion.

Exemples exposés : SEM-002/SEM-003 exposed examples remain ineligible as Calibration sources; no reuse was declared by B1.

- Conclusion candidate : `UNDETERMINED — HUMAN_REVIEW_REQUIRED`.
- Incertitude restante : l’assistance par métadonnées ne mesure ni dérivation sémantique, ni contamination, ni indépendance d’authoring.



## Revue et disposition

### Avis séparés des trois personas

- **REVIEWER_SIM_1** — `SIMULATED_ACCEPT` — The elliptical continuation remains anchored to congenital flow while the missing anatomical and measurement details stay unknown.
- **REVIEWER_SIM_2** — `SIMULATED_ACCEPT` — The reference does not infer a specific observable or acquisition and correctly requests clarification only where decisionally useful.
- **REVIEWER_SIM_3** — `SIMULATED_ACCEPT` — Provenance across turns and ownership boundaries remain reconstructible; no Development source is reused.

### Désaccords et résolution

- Aucun désaccord non résolu.

### Consensus simulé

The multi-turn reference is stable because it preserves the ellipse without silently completing it.

- `CALIBRATION_ADMISSION` → `SIMULATED_APPROVE_FOR_CALIBRATION` (SEM3B3-SIMDEC-CONGENITAL-FLOW-ELLIPSIS-CALIBRATION-ADMISSION)
- `METHODOLOGICAL_REFERENCE` → `SIMULATED_ACCEPT` (SEM3B3-SIMDEC-CONGENITAL-FLOW-ELLIPSIS-METHODOLOGICAL-REFERENCE)
- `PARENTAGE` → `SIMULATED_PARENTAGE_CLEAR` (SEM3B3-SIMDEC-CONGENITAL-FLOW-ELLIPSIS-PARENTAGE)
- `SCIENTIFIC_REFERENCE` → `SIMULATED_ACCEPT` (SEM3B3-SIMDEC-CONGENITAL-FLOW-ELLIPSIS-SCIENTIFIC-REFERENCE)

**Recommended disposition — à renseigner par l’humain :**

`CALIBRATION_VISIBLE` / `REJECTED` / `NEEDS_SPECIALIST_REVIEW`

**Impact d’exposition :** état courant `CALIBRATION_VISIBLE` ; aucune décision isolée ne promeut le cas ; le blind reste inéligible.

## Règles de preuve

- Les trois rôles enregistrés ici sont des personas simulées et ne valent jamais revue humaine.
- La revue simulée peut rendre une référence visible pour la calibration de développement, sans satisfaire la preuve confirmatoire PD-011.
- Toute révision doit préciser le delta ; toute décision incomplète reste ouverte.
- La trace structurée respecte `semantic-validation/sem-003/review/contracts/simulated-pluralistic-review-record.schema.json`.
