# SEM3B3-RU-CAL-ATRIAL-FIBROSIS-ABLATION — Fibrose atriale autour d'une intervention

**Statut :** `CALIBRATION_VISIBLE_SIMULATED_REVIEW`

**Set :** `CALIBRATION` · **Priorité :** `CALIBRATION_GATE`

**Case :** `SEM3-CAL-ATRIAL-FIBROSIS-ABLATION` v1.0.0 · **Envelope :** v1.0.0

## Identity

| Champ | Valeur |
|---|---|
| Domaine | électrophysiologie et imagerie cardiaque |
| Catégorie | `INTERVENTION_AND_IMAGING` |
| Difficulté | `ADVANCED` |
| Langue | `fr-FR` |
| Tours | 6 |

## Scientific request

> **turn-1 — USER.** Je veux étudier la fibrose atriale chez des patients ayant une ablation.
>
> **turn-2 — USER.** Il y a une imagerie avant le geste, mais le contrôle n'est pas uniforme.
>
> **turn-3 — USER.** Je ne sais pas encore si l'objectif est de décrire le substrat ou de prédire une récidive.
>
> **turn-4 — USER.** Ne choisissons pas silencieusement l'un des deux.
>
> **turn-5 — USER.** Les paramètres procéduraux peuvent être du contexte s'ils sont réellement disponibles.
>
> **turn-6 — USER.** Aucun paramètre ne doit devenir un mécanisme causal par défaut.

## Current interpretation — candidate only

Candidat Calibration original sur une ambiguïté d'objectif autour d'une intervention d'électrophysiologie.

État actif et obligations reconstructibles :

- L'imagerie disponible est antérieure au geste.
- Conserver ouvertes les finalités descriptive et prédictive.
- Les données procédurales ne sont recevables que si leur disponibilité est prouvée.

Historique/superseded :

- Aucun élément déclaré.

Unknowns intentionnels :

- L'objectif descriptif ou prédictif reste indécis.
- Le calendrier du contrôle n'est pas uniforme.
- Les données procédurales disponibles ne sont pas listées.

Ambiguïtés candidates :

- La finalité scientifique n'est pas arrêtée. — alternatives : décrire le substrat / étudier une valeur prédictive

## Acceptance Envelope — human view

### Required

- L'imagerie disponible est antérieure au geste. — INHERENTLY_REQUIRED, CRITICAL, source : `source.conversationTurns[1]`
- Conserver ouvertes les finalités descriptive et prédictive. — INHERENTLY_REQUIRED, CRITICAL, source : `source.conversationTurns[2]`
- Les données procédurales ne sont recevables que si leur disponibilité est prouvée. — INHERENTLY_REQUIRED, CRITICAL, source : `source.conversationTurns[4]`

### Prohibited

- Adopter la prédiction de récidive comme endpoint. — `OWNERSHIP_BOUNDARY_FAILURE`, CRITICAL
- Présenter un paramètre procédural comme cause. — `POLARITY_OR_CAUSALITY_FAILURE`, CRITICAL

### Optional relevant

- Paramètres procéduraux documentés comme contexte candidat, non comme mécanisme acquis. — `CONTEXTUAL_CANDIDATE`, absence bloquante : non, enveloppe non exhaustive : oui

### Clarification

- Statut candidat : `REQUIRED`.
- Impact décisionnel : Le choix descriptif ou prédictif modifie objectifs, outcome et analyse.
- Classes recevables : Finalité principale du projet.
- Formulation exacte imposée : non.

### Ownership

- SEM → Research Project / human decision : SEM peut préserver et structurer l'intention, les unknowns et les candidats ; il n'adopte pas une décision de projet. Promotion interdite : Inference, option or contextual candidate to adopted Project decision
- Knowledge / OBS / Imaging / Scientific Thinking → SEM benchmark reference : Les owners spécialisés qualifient preuves, mesures, acquisition ou hypothèses ; leur support n'est pas une déclaration utilisateur. Promotion interdite : Specialist support to explicit user fact or automatic endpoint

## Propriétés SEM-002 concernées

- `PROPERTY_AMBIGUITY_AND_UNKNOWN_PRESERVED` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_CLARIFICATION_HAS_DECISIONAL_VALUE` — `SCIENTIFIC_UNDERSTANDING_COMPETENCE`, absolue : non
- `PROPERTY_COMPARISON_AND_TIMING_PRESERVED` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_CONCEPTUAL_PLAN_SEPARATION` — `SCIENTIFIC_UNDERSTANDING_COMPETENCE`, absolue : non
- `PROPERTY_CONTEXTUAL_CANDIDATE_RELEVANCE` — `CONTEXTUAL_ENRICHMENT`, absolue : non
- `PROPERTY_CONTEXTUAL_INFERENCE_NOT_USER_FACT` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_EXPLICIT_CONTENT_PRESERVED` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_NONCRITICAL_FORM_VARIATION_ALLOWED` — `SCIENTIFIC_UNDERSTANDING_COMPETENCE`, absolue : non
- `PROPERTY_NO_UNSUPPORTED_CAUSAL_PROMOTION` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_NO_UNSUPPORTED_INVENTION` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_OWNER_AND_ADOPTION_BOUNDARIES_PRESERVED` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_POLARITY_AND_CONDITIONALITY_PRESERVED` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_PROVENANCE_RECONSTRUCTIBLE` — `SAFETY_FIDELITY_INVARIANT`, absolue : oui
- `PROPERTY_SEMANTIC_EQUIVALENCE_RECOGNIZED` — `SCIENTIFIC_UNDERSTANDING_COMPETENCE`, absolue : non

## Review points hérités de la queue B1

### `SEM3B1-REVIEW-028` — `SCIENTIFIC_REVIEW_REQUIRED`

- Point : Scientific readability of REQUIRED, PROHIBITED and OPTIONAL_RELEVANT.
- Proposition actuelle : Acceptance Envelope candidate as versioned in the corpus.
- Alternatives raisonnables : Accept as authored ; Revise with a new version ; Reject from active corpus.
- Compétence : Scientific domain expert familiar with the scenario.
- Conséquence si ouvert : Candidate remains DESIGN_ONLY and cannot enter formal Calibration.

### `SEM3B1-REVIEW-029` — `CALIBRATION_REVIEW_REQUIRED`

- Point : SEM-003B Calibration gate.
- Proposition actuelle : Acceptance Envelope candidate as versioned in the corpus.
- Alternatives raisonnables : Accept as authored ; Revise with a new version ; Reject from active corpus.
- Compétence : PD-011 methodological governance and scientific reviewer.
- Conséquence si ouvert : CALIBRATION_VISIBLE is forbidden; candidate remains DESIGN_ONLY.

### `SEM3B1-REVIEW-030` — `PARENTAGE_REVIEW_REQUIRED`

- Point : Independent inter-set parentage review.
- Proposition actuelle : Acceptance Envelope candidate as versioned in the corpus.
- Alternatives raisonnables : Accept as authored ; Revise with a new version ; Reject from active corpus.
- Compétence : Independent benchmark methodologist.
- Conséquence si ouvert : Candidate cannot be used for formal Calibration until reviewed.

### `SEM3B1-REVIEW-031` — `AMBIGUITY_ADJUDICATION_REQUIRED`

- Point : Competing interpretations and resolution information.
- Proposition actuelle : Acceptance Envelope candidate as versioned in the corpus.
- Alternatives raisonnables : Accept as authored ; Revise with a new version ; Reject from active corpus.
- Compétence : Scientific domain expert and SEM methodologist.
- Conséquence si ouvert : Future evaluator decisions remain provisional until the envelope is adjudicated.


## Parentage — assistance only

**Statut de cette comparaison :** `REVIEW_ASSISTANCE_ONLY` — aucun seuil numérique et aucune conclusion automatique.

Development à comparer en priorité :

- `SEM3-DEV-PLAQUE-INTERVENTION-CONTEXT` — catégories communes : INTERVENTION_AND_IMAGING, KNOWLEDGE_CANDIDATE ; caractéristiques communes : CONTEXTUAL_ENRICHMENT, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP ; même groupe de domaine : oui.
- `SEM3-DEV-CT-FUNCTIONAL-ESTIMATE-ROLE` — catégories communes : SCIENTIFIC_AMBIGUITY ; caractéristiques communes : AMBIGUITY, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP ; même groupe de domaine : oui.
- `SEM3-DEV-BODY-COMPOSITION-AMBIGUITY` — catégories communes : KNOWLEDGE_CANDIDATE, SCIENTIFIC_AMBIGUITY ; caractéristiques communes : AMBIGUITY, CONTEXTUAL_ENRICHMENT, MISSING_INFORMATION ; même groupe de domaine : non.

Autres candidats Calibration à comparer en priorité :

- `SEM3-CAL-CARDIO-RHYTHM-REMODELING` — catégories communes : aucune ; caractéristiques communes : MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, NEGATION, OWNERSHIP.
- `SEM3-CAL-MSK-INFLAMMATION-RESPONSE` — catégories communes : KNOWLEDGE_CANDIDATE ; caractéristiques communes : CONTEXTUAL_ENRICHMENT, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP.
- `SEM3-CAL-ORGANOID-LIVE-SIGNAL-MEASUREMENT` — catégories communes : KNOWLEDGE_CANDIDATE ; caractéristiques communes : CONTEXTUAL_ENRICHMENT, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP.

Conclusion candidate B1, non humaine : `SIMULATED_PARENTAGE_CLEAR` ; Ambiguïté descriptive/prédictive et contexte d'électrophysiologie distincts des scénarios interventionnels Development. Contamination évidente identifiée : non.

Historique H01–H30 : B1 compared originalRequest only across H01-H30 and reported no source reuse; this is not an independent human conclusion.

Exemples exposés : SEM-002/SEM-003 exposed examples remain ineligible as Calibration sources; no reuse was declared by B1.

- Conclusion candidate : `UNDETERMINED — HUMAN_REVIEW_REQUIRED`.
- Incertitude restante : l’assistance par métadonnées ne mesure ni dérivation sémantique, ni contamination, ni indépendance d’authoring.



## Revue et disposition

### Avis séparés des trois personas

- **REVIEWER_SIM_1** — `SIMULATED_ACCEPT` — The scenario preserves atrial fibrosis, ablation and the deliberately open scientific role without creating an outcome.
- **REVIEWER_SIM_2** — `SIMULATED_ACCEPT` — The competing predictive and response-assessment roles remain non-equivalent and require clarification before Project adoption.
- **REVIEWER_SIM_3** — `SIMULATED_ACCEPT` — Optional candidates remain non-user facts; parentage assistance reveals no source reuse and blind eligibility stays forbidden.

### Désaccords et résolution

- Aucun désaccord non résolu.

### Consensus simulé

The reference is internally coherent and the unresolved role is intentionally represented rather than completed.

- `AMBIGUITY` → `SIMULATED_AMBIGUITY_CONFIRMED` (SEM3B3-SIMDEC-ATRIAL-FIBROSIS-ABLATION-AMBIGUITY)
- `CALIBRATION_ADMISSION` → `SIMULATED_APPROVE_FOR_CALIBRATION` (SEM3B3-SIMDEC-ATRIAL-FIBROSIS-ABLATION-CALIBRATION-ADMISSION)
- `METHODOLOGICAL_REFERENCE` → `SIMULATED_ACCEPT` (SEM3B3-SIMDEC-ATRIAL-FIBROSIS-ABLATION-METHODOLOGICAL-REFERENCE)
- `PARENTAGE` → `SIMULATED_PARENTAGE_CLEAR` (SEM3B3-SIMDEC-ATRIAL-FIBROSIS-ABLATION-PARENTAGE)
- `SCIENTIFIC_REFERENCE` → `SIMULATED_ACCEPT` (SEM3B3-SIMDEC-ATRIAL-FIBROSIS-ABLATION-SCIENTIFIC-REFERENCE)

**Recommended disposition — à renseigner par l’humain :**

`CALIBRATION_VISIBLE` / `REJECTED` / `NEEDS_SPECIALIST_REVIEW`

**Impact d’exposition :** état courant `CALIBRATION_VISIBLE` ; aucune décision isolée ne promeut le cas ; le blind reste inéligible.

## Règles de preuve

- Les trois rôles enregistrés ici sont des personas simulées et ne valent jamais revue humaine.
- La revue simulée peut rendre une référence visible pour la calibration de développement, sans satisfaire la preuve confirmatoire PD-011.
- Toute révision doit préciser le delta ; toute décision incomplète reste ouverte.
- La trace structurée respecte `semantic-validation/sem-003/review/contracts/simulated-pluralistic-review-record.schema.json`.
