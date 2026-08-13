# SEM-003B3 — Simulated Pluralistic Expert Review Record

| Champ | Valeur |
|---|---|
| Statut | `SIMULATED_CALIBRATION_REFERENCE_SET_READY` |
| Nature | Revue pluraliste simulée pour développement et préparation Calibration uniquement |
| Baseline | SEM-003B1 corpus 1.0.0 ; évaluateur SEM-003 v1.0.0 |
| Evaluator digest | `13f2e4d0b57e200b53e3db52a4fa74cc346a0b65e82b96ac12ca82ba435767b5` |
| Review Units | 25 total ; 15 prioritaires |
| Personas simulées | 3 rôles distincts |
| Décisions simulées | 48 |
| Décisions humaines réelles | 0 |
| Calibration visible | 10 |
| Date d’état | 13 août 2026 |

## A. Frontière de preuve

Les trois rôles `REVIEWER_SIM_1`, `REVIEWER_SIM_2` et `REVIEWER_SIM_3` sont des personas de simulation. Ils ne sont ni des humains, ni un panel indépendant, ni une preuve confirmatoire PD-011. Leur consensus rend les références utilisables pour tester et calibrer l’instrument de mesure en B4 ; il n’autorise ni qualification finale, ni blind set, ni exécution dans B3.

## B. Dix références Calibration

| Case | Domaine | Disposition | Base | Formal/Blind |
|---|---|---|---|---|
| `SEM3-CAL-ATRIAL-FIBROSIS-ABLATION` | électrophysiologie et imagerie cardiaque | `CALIBRATION_VISIBLE` | `SIMULATED_PLURALISTIC_EXPERT_REVIEW` | `NO / NO` |
| `SEM3-CAL-CARDIO-RHYTHM-REMODELING` | rythmologie et imagerie cardiaque | `CALIBRATION_VISIBLE` | `SIMULATED_PLURALISTIC_EXPERT_REVIEW` | `NO / NO` |
| `SEM3-CAL-CONGENITAL-FLOW-ELLIPSIS` | cardiologie congénitale et imagerie de flux | `CALIBRATION_VISIBLE` | `SIMULATED_PLURALISTIC_EXPERT_REVIEW` | `NO / NO` |
| `SEM3-CAL-CORTISOL-SAMPLING-SUMMARY` | physiologie et mesures longitudinales | `CALIBRATION_VISIBLE` | `SIMULATED_PLURALISTIC_EXPERT_REVIEW` | `NO / NO` |
| `SEM3-CAL-MSK-INFLAMMATION-RESPONSE` | imagerie musculosquelettique et inflammation | `CALIBRATION_VISIBLE` | `SIMULATED_PLURALISTIC_EXPERT_REVIEW` | `NO / NO` |
| `SEM3-CAL-NEURODEGENERATION-PROGRESSION` | neuro-imagerie et neurodégénérescence | `CALIBRATION_VISIBLE` | `SIMULATED_PLURALISTIC_EXPERT_REVIEW` | `NO / NO` |
| `SEM3-CAL-ORGANOID-LIVE-SIGNAL-MEASUREMENT` | modèles translationnels et imagerie cellulaire | `CALIBRATION_VISIBLE` | `SIMULATED_PLURALISTIC_EXPERT_REVIEW` | `NO / NO` |
| `SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY` | imagerie gynécologique et échographie | `CALIBRATION_VISIBLE` | `SIMULATED_PLURALISTIC_EXPERT_REVIEW` | `NO / NO` |
| `SEM3-CAL-PULMONARY-HEMODYNAMICS-FOLLOWUP` | cardiologie et hypertension pulmonaire | `CALIBRATION_VISIBLE` | `SIMULATED_PLURALISTIC_EXPERT_REVIEW` | `NO / NO` |
| `SEM3-CAL-TRIAL-COMPARATOR-DECISION` | méthodologie d'essai clinique pragmatique | `CALIBRATION_VISIBLE` | `SIMULATED_PLURALISTIC_EXPERT_REVIEW` | `NO / NO` |

### Fibrose atriale autour d'une intervention

**Case :** `SEM3-CAL-ATRIAL-FIBROSIS-ABLATION` · **Review Unit :** `SEM3B3-RU-CAL-ATRIAL-FIBROSIS-ABLATION` · **Domaine :** électrophysiologie et imagerie cardiaque · **Difficulté :** `ADVANCED` · **Tours :** 6

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

**Required**

- L'imagerie disponible est antérieure au geste.
- Conserver ouvertes les finalités descriptive et prédictive.
- Les données procédurales ne sont recevables que si leur disponibilité est prouvée.

**Prohibited**

- Adopter la prédiction de récidive comme endpoint. — `OWNERSHIP_BOUNDARY_FAILURE`
- Présenter un paramètre procédural comme cause. — `POLARITY_OR_CAUSALITY_FAILURE`

**Optional relevant**

- Paramètres procéduraux documentés comme contexte candidat, non comme mécanisme acquis. — CONTEXTUAL_CANDIDATE, non exhaustif

**Ambiguïtés et clarification**

- La finalité scientifique n'est pas arrêtée. — décrire le substrat / étudier une valeur prédictive

- Clarification : `REQUIRED` — Le choix descriptif ou prédictif modifie objectifs, outcome et analyse.

**Points de revue B1**

- `SCIENTIFIC_REVIEW_REQUIRED` — Scientific readability of REQUIRED, PROHIBITED and OPTIONAL_RELEVANT
- `CALIBRATION_REVIEW_REQUIRED` — SEM-003B Calibration gate
- `PARENTAGE_REVIEW_REQUIRED` — Independent inter-set parentage review
- `AMBIGUITY_ADJUDICATION_REQUIRED` — Competing interpretations and resolution information

**Parenté — assistance only**

- Development à comparer : `SEM3-DEV-PLAQUE-INTERVENTION-CONTEXT` (INTERVENTION_AND_IMAGING, KNOWLEDGE_CANDIDATE, CONTEXTUAL_ENRICHMENT, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP) ; `SEM3-DEV-CT-FUNCTIONAL-ESTIMATE-ROLE` (SCIENTIFIC_AMBIGUITY, AMBIGUITY, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP) ; `SEM3-DEV-BODY-COMPOSITION-AMBIGUITY` (KNOWLEDGE_CANDIDATE, SCIENTIFIC_AMBIGUITY, AMBIGUITY, CONTEXTUAL_ENRICHMENT, MISSING_INFORMATION).
- Conclusion simulée : `SIMULATED_EXPERT_CONSENSUS`. Cette conclusion ne vaut jamais indépendance humaine.

**Décisions enregistrées :** `AMBIGUITY=SIMULATED_AMBIGUITY_CONFIRMED` ; `CALIBRATION_ADMISSION=SIMULATED_APPROVE_FOR_CALIBRATION` ; `METHODOLOGICAL_REFERENCE=SIMULATED_ACCEPT` ; `PARENTAGE=SIMULATED_PARENTAGE_CLEAR` ; `SCIENTIFIC_REFERENCE=SIMULATED_ACCEPT`.

Fiche détaillée : `semantic-validation/sem-003/review/review-units/atrial-fibrosis-ablation.review.md`.


---

### Charge rythmique et structure atriale sans promotion causale

**Case :** `SEM3-CAL-CARDIO-RHYTHM-REMODELING` · **Review Unit :** `SEM3B3-RU-CAL-CARDIO-RHYTHM-REMODELING` · **Domaine :** rythmologie et imagerie cardiaque · **Difficulté :** `ADVANCED` · **Tours :** 5

> **turn-1 — USER.** Je veux suivre la charge d'arythmie et le volume atrial au cours du temps.
>
> **turn-2 — USER.** Au début je pensais dire que la charge rythmique expliquait le remodelage.
>
> **turn-3 — USER.** Ce n'est pas ce que je veux finalement.
>
> **turn-4 — USER.** Je veux étudier leur association, sans causalité automatique.
>
> **turn-5 — USER.** La méthode de mesure du rythme et celle du volume devront être qualifiées séparément.

**Required**

- L'état actif porte sur l'association entre charge rythmique et volume atrial.
- L'explication causale du remodelage est un état rejeté.
- Les méthodes de mesure du rythme et du volume restent des définitions spécialisées distinctes.
- L'état scientifique courant, tel que défini après la dernière correction, doit rester actif.
- Les formulations corrigées ou abandonnées restent reconstructibles comme historique sans rester actives.

**Prohibited**

- Présenter la charge rythmique comme cause établie du remodelage. — `POLARITY_OR_CAUSALITY_FAILURE`
- Adopter une méthode de mesure non fournie. — `OWNERSHIP_BOUNDARY_FAILURE`

**Optional relevant**

- Autres observations rythmiques ou structurelles comme candidats à documenter. — CONTEXTUAL_CANDIDATE, non exhaustif

**Ambiguïtés et clarification**

- Aucun élément déclaré.

- Clarification : `OPTIONAL` — Les temps et méthodes seront nécessaires au protocole, mais la correction causale est déjà explicite.

**Points de revue B1**

- `SCIENTIFIC_REVIEW_REQUIRED` — Scientific readability of REQUIRED, PROHIBITED and OPTIONAL_RELEVANT
- `CALIBRATION_REVIEW_REQUIRED` — SEM-003B Calibration gate
- `PARENTAGE_REVIEW_REQUIRED` — Independent inter-set parentage review
- `METHODOLOGICAL_REVIEW_REQUIRED` — Conceptual-plan separation and OBS boundary

**Parenté — assistance only**

- Development à comparer : `SEM3-DEV-CARDIAC-AGING-TRAJECTORY` (CHANGE_OF_MIND, CHANGE_OF_MIND, CORRECTION, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, NEGATION, OWNERSHIP) ; `SEM3-DEV-CT-FUNCTIONAL-ESTIMATE-ROLE` (METHOD_VERSUS_MEASUREMENT, METHOD_MEASUREMENT, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP) ; `SEM3-DEV-OUTCOME-PRIORITY-CHANGE` (CHANGE_OF_MIND, CHANGE_OF_MIND, CORRECTION, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP).
- Conclusion simulée : `SIMULATED_EXPERT_CONSENSUS`. Cette conclusion ne vaut jamais indépendance humaine.

**Décisions enregistrées :** `CALIBRATION_ADMISSION=SIMULATED_APPROVE_FOR_CALIBRATION` ; `METHODOLOGICAL_REFERENCE=SIMULATED_ACCEPT` ; `PARENTAGE=SIMULATED_PARENTAGE_CLEAR` ; `SCIENTIFIC_REFERENCE=SIMULATED_ACCEPT`.

Fiche détaillée : `semantic-validation/sem-003/review/review-units/cardio-rhythm-remodeling.review.md`.


---

### Flux cardiovasculaire congénital et ellipses tardives

**Case :** `SEM3-CAL-CONGENITAL-FLOW-ELLIPSIS` · **Review Unit :** `SEM3B3-RU-CAL-CONGENITAL-FLOW-ELLIPSIS` · **Domaine :** cardiologie congénitale et imagerie de flux · **Difficulté :** `COMPOSITIONAL` · **Tours :** 8

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

**Required**

- Rattacher 'ceux-là' au sous-groupe ayant les deux régions mesurées.
- La première région porte la comparaison principale active.
- La seconde région est exploratoire après correction.
- Le suivi tardif reste temporellement indéfini.
- L'état scientifique courant, tel que défini après la dernière correction, doit rester actif.
- Les formulations corrigées ou abandonnées restent reconstructibles comme historique sans rester actives.

**Prohibited**

- Étendre la seconde région à toute la cohorte. — `EXPLICIT_FIDELITY_FAILURE`
- Maintenir la seconde région comme comparaison principale. — `RELATION_SEMANTICS_FAILURE`

**Optional relevant**

- Analyse du sous-groupe complet comme option exploratoire. — OPTION, non exhaustif

**Ambiguïtés et clarification**

- Aucun élément déclaré.

- Clarification : `REQUIRED` — Le calendrier tardif conditionne la comparaison temporelle.

**Points de revue B1**

- `SCIENTIFIC_REVIEW_REQUIRED` — Scientific readability of REQUIRED, PROHIBITED and OPTIONAL_RELEVANT
- `CALIBRATION_REVIEW_REQUIRED` — SEM-003B Calibration gate
- `PARENTAGE_REVIEW_REQUIRED` — Independent inter-set parentage review

**Parenté — assistance only**

- Development à comparer : `SEM3-DEV-CORONARY-PERFUSION-PRIORITY` (COMPARISON_AND_TIMING, ELLIPSIS, NECESSARY_IMPLICIT, ELLIPSIS, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT) ; `SEM3-DEV-CARDIAC-AGING-TRAJECTORY` (COMPARISON_AND_TIMING, MULTIDIMENSIONAL_REQUEST, CORRECTION, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT) ; `SEM3-DEV-VALVE-HEMODYNAMICS-MULTIMODAL` (COMPARISON_AND_TIMING, MULTIDIMENSIONAL_REQUEST, NECESSARY_IMPLICIT, MULTI_TURN_CONTEXT_DEPENDENT).
- Conclusion simulée : `SIMULATED_EXPERT_CONSENSUS`. Cette conclusion ne vaut jamais indépendance humaine.

**Décisions enregistrées :** `CALIBRATION_ADMISSION=SIMULATED_APPROVE_FOR_CALIBRATION` ; `METHODOLOGICAL_REFERENCE=SIMULATED_ACCEPT` ; `PARENTAGE=SIMULATED_PARENTAGE_CLEAR` ; `SCIENTIFIC_REFERENCE=SIMULATED_ACCEPT`.

Fiche détaillée : `semantic-validation/sem-003/review/review-units/congenital-flow-ellipsis.review.md`.


---

### Profil de cortisol, méthode de prélèvement et mesure dérivée

**Case :** `SEM3-CAL-CORTISOL-SAMPLING-SUMMARY` · **Review Unit :** `SEM3B3-RU-CAL-CORTISOL-SAMPLING-SUMMARY` · **Domaine :** physiologie et mesures longitudinales · **Difficulté :** `INTERMEDIATE` · **Tours :** 5

> **turn-1 — USER.** Je veux étudier le profil de cortisol après le réveil.
>
> **turn-2 — USER.** Plusieurs prélèvements sont prévus dans la matinée.
>
> **turn-3 — USER.** Le calendrier de prélèvement fait partie de la méthode.
>
> **turn-4 — USER.** Je ne sais pas encore si la mesure d'intérêt sera un temps précis, une pente ou une aire sous la courbe.
>
> **turn-5 — USER.** Il faut distinguer l'analyte, le protocole de prélèvement, les valeurs observées et la mesure dérivée.

**Required**

- Conserver plusieurs prélèvements après le réveil.
- Le calendrier de prélèvement appartient à la méthode.
- La mesure d'intérêt entre temps précis, pente et aire sous la courbe reste ouverte.
- Distinguer analyte, protocole, valeurs observées et mesure dérivée.

**Prohibited**

- Choisir une mesure dérivée sans décision. — `OWNERSHIP_BOUNDARY_FAILURE`
- Confondre les valeurs temporelles avec la mesure dérivée. — `CONCEPTUAL_PLAN_COLLAPSE`

**Optional relevant**

- Méthodes de résumé temporel comme options méthodologiques à qualifier. — OPTION, non exhaustif

**Ambiguïtés et clarification**

- Aucun élément déclaré.

- Clarification : `REQUIRED` — La mesure dérivée change l'objet évalué et l'analyse longitudinale.

**Points de revue B1**

- `SCIENTIFIC_REVIEW_REQUIRED` — Scientific readability of REQUIRED, PROHIBITED and OPTIONAL_RELEVANT
- `CALIBRATION_REVIEW_REQUIRED` — SEM-003B Calibration gate
- `PARENTAGE_REVIEW_REQUIRED` — Independent inter-set parentage review
- `METHODOLOGICAL_REVIEW_REQUIRED` — Conceptual-plan separation and OBS boundary

**Parenté — assistance only**

- Development à comparer : `SEM3-DEV-CT-FUNCTIONAL-ESTIMATE-ROLE` (METHOD_VERSUS_MEASUREMENT, METHOD_MEASUREMENT, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP) ; `SEM3-DEV-INTESTINAL-MOTILITY-METHOD` (METHOD_VERSUS_MEASUREMENT, UNDER_SPECIFIED_REQUEST, METHOD_MEASUREMENT, MISSING_INFORMATION, OWNERSHIP) ; `SEM3-DEV-OUTCOME-PRIORITY-CHANGE` (COMPARISON_AND_TIMING, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP).
- Conclusion simulée : `SIMULATED_EXPERT_CONSENSUS`. Cette conclusion ne vaut jamais indépendance humaine.

**Décisions enregistrées :** `CALIBRATION_ADMISSION=SIMULATED_APPROVE_FOR_CALIBRATION` ; `METHODOLOGICAL_REFERENCE=SIMULATED_ACCEPT` ; `PARENTAGE=SIMULATED_PARENTAGE_CLEAR` ; `SCIENTIFIC_REFERENCE=SIMULATED_ACCEPT`.

Fiche détaillée : `semantic-validation/sem-003/review/review-units/cortisol-sampling-summary.review.md`.


---

### Inflammation musculosquelettique et réponse au traitement

**Case :** `SEM3-CAL-MSK-INFLAMMATION-RESPONSE` · **Review Unit :** `SEM3B3-RU-CAL-MSK-INFLAMMATION-RESPONSE` · **Domaine :** imagerie musculosquelettique et inflammation · **Difficulté :** `ADVANCED` · **Tours :** 6

> **turn-1 — USER.** Je veux suivre une inflammation articulaire avant et après traitement.
>
> **turn-2 — USER.** L'échographie est disponible à chaque visite.
>
> **turn-3 — USER.** Une IRM existe seulement au départ pour une partie de la cohorte.
>
> **turn-4 — USER.** Je veux comprendre l'évolution sans transformer l'IRM de départ en référence obligatoire.
>
> **turn-5 — USER.** Des signes d'activité peuvent être proposés comme candidats s'ils restent correctement étiquetés.
>
> **turn-6 — USER.** La réponse clinique n'est pas encore définie.

**Required**

- Préserver le suivi échographique avant/après.
- L'IRM de départ n'existe que dans une partie de la cohorte.
- La réponse clinique reste non définie.

**Prohibited**

- Faire de l'IRM initiale une référence obligatoire pour tous. — `EXPLICIT_FIDELITY_FAILURE`
- Attribuer un signe d'activité candidat à l'utilisateur ou au Project. — `EPISTEMIC_PROMOTION_FAILURE`

**Optional relevant**

- Signes d'activité scientifiquement plausibles à soumettre à revue, enveloppe non exhaustive. — CONTEXTUAL_CANDIDATE, non exhaustif

**Ambiguïtés et clarification**

- Aucun élément déclaré.

- Clarification : `REQUIRED` — La définition de réponse conditionne l'évaluation clinique.

**Points de revue B1**

- `SCIENTIFIC_REVIEW_REQUIRED` — Scientific readability of REQUIRED, PROHIBITED and OPTIONAL_RELEVANT
- `CALIBRATION_REVIEW_REQUIRED` — SEM-003B Calibration gate
- `PARENTAGE_REVIEW_REQUIRED` — Independent inter-set parentage review

**Parenté — assistance only**

- Development à comparer : `SEM3-DEV-PLAQUE-INTERVENTION-CONTEXT` (KNOWLEDGE_CANDIDATE, STRONG_CONTEXTUAL_IMPLICIT, CONTEXTUAL_ENRICHMENT, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP) ; `SEM3-DEV-TRANSLATIONAL-HYPOXIA-CANDIDATES` (KNOWLEDGE_CANDIDATE, STRONG_CONTEXTUAL_IMPLICIT, CONTEXTUAL_ENRICHMENT, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP) ; `SEM3-DEV-INFLAMMATION-MULTIDIMENSIONAL` (STRONG_CONTEXTUAL_IMPLICIT, CONTEXTUAL_ENRICHMENT, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP).
- Conclusion simulée : `SIMULATED_EXPERT_CONSENSUS`. Cette conclusion ne vaut jamais indépendance humaine.

**Décisions enregistrées :** `CALIBRATION_ADMISSION=SIMULATED_APPROVE_FOR_CALIBRATION` ; `METHODOLOGICAL_REFERENCE=SIMULATED_ACCEPT` ; `PARENTAGE=SIMULATED_PARENTAGE_CLEAR` ; `SCIENTIFIC_REFERENCE=SIMULATED_ACCEPT`.

Fiche détaillée : `semantic-validation/sem-003/review/review-units/msk-inflammation-response.review.md`.


---

### Progression neurodégénérative multimodale

**Case :** `SEM3-CAL-NEURODEGENERATION-PROGRESSION` · **Review Unit :** `SEM3B3-RU-CAL-NEURODEGENERATION-PROGRESSION` · **Domaine :** neuro-imagerie et neurodégénérescence · **Difficulté :** `INTERMEDIATE` · **Tours :** 1

> **turn-1 — USER.** Je veux étudier sur deux ans l'évolution conjointe d'un signal d'imagerie moléculaire et de l'atrophie, sans supposer que l'un explique l'autre et sans les fusionner en un biomarqueur unique.

**Required**

- Préserver l'horizon de deux ans.
- Conserver distincts signal moléculaire et atrophie.
- Étudier une évolution conjointe sans explication causale.

**Prohibited**

- Fusionner les observables en un biomarqueur unique non demandé. — `CONCEPTUAL_PLAN_COLLAPSE`
- Ajouter une direction causale entre les observables. — `POLARITY_OR_CAUSALITY_FAILURE`

**Optional relevant**

- Analyses régionales comme options spécialisées, non comme exigences. — OPTION, non exhaustif

**Ambiguïtés et clarification**

- Aucun élément déclaré.

- Clarification : `OPTIONAL` — Les définitions de mesure peuvent être qualifiées en aval sans changer l'intention longitudinale.

**Points de revue B1**

- `SCIENTIFIC_REVIEW_REQUIRED` — Scientific readability of REQUIRED, PROHIBITED and OPTIONAL_RELEVANT
- `CALIBRATION_REVIEW_REQUIRED` — SEM-003B Calibration gate
- `PARENTAGE_REVIEW_REQUIRED` — Independent inter-set parentage review
- `METHODOLOGICAL_REVIEW_REQUIRED` — Conceptual-plan separation and OBS boundary

**Parenté — assistance only**

- Development à comparer : `SEM3-DEV-BODY-COMPOSITION-AMBIGUITY` (PHENOMENON_VERSUS_OBSERVABLE, MISSING_INFORMATION, PHENOMENON_OBSERVABLE) ; `SEM3-DEV-INTESTINAL-MOTILITY-METHOD` (PHENOMENON_VERSUS_OBSERVABLE, MISSING_INFORMATION, PHENOMENON_OBSERVABLE) ; `SEM3-DEV-PANCREATIC-COMPOSITION-LONGITUDINAL` (COMPARISON_AND_TIMING, COMPLETE_SCIENTIFIC_REQUEST, MISSING_INFORMATION).
- Conclusion simulée : `SIMULATED_EXPERT_CONSENSUS`. Cette conclusion ne vaut jamais indépendance humaine.

**Décisions enregistrées :** `CALIBRATION_ADMISSION=SIMULATED_APPROVE_FOR_CALIBRATION` ; `METHODOLOGICAL_REFERENCE=SIMULATED_ACCEPT` ; `PARENTAGE=SIMULATED_PARENTAGE_CLEAR` ; `SCIENTIFIC_REFERENCE=SIMULATED_ACCEPT`.

Fiche détaillée : `semantic-validation/sem-003/review/review-units/neurodegeneration-progression.review.md`.


---

### Signal vivant d'organoïde, phénomène et mesure terminale

**Case :** `SEM3-CAL-ORGANOID-LIVE-SIGNAL-MEASUREMENT` · **Review Unit :** `SEM3B3-RU-CAL-ORGANOID-LIVE-SIGNAL-MEASUREMENT` · **Domaine :** modèles translationnels et imagerie cellulaire · **Difficulté :** `COMPOSITIONAL` · **Tours :** 9

> **turn-1 — USER.** Je veux étudier la réponse d'organoïdes pendant une exposition expérimentale.
>
> **turn-2 — USER.** On aura un signal d'imagerie en direct.
>
> **turn-3 — USER.** Une mesure histologique sera disponible seulement au dernier temps.
>
> **turn-4 — USER.** Et ça, on peut le relier au signal comment ?
>
> **turn-5 — USER.** Je parle de la mesure histologique, pas de l'exposition elle-même.
>
> **turn-6 — USER.** Je ne veux pas supposer que le signal mesure directement la prolifération.
>
> **turn-7 — USER.** Les modèles de relation peuvent rester des hypothèses candidates.
>
> **turn-8 — USER.** La priorité est de conserver réponse biologique, signal vivant, mesure terminale et temporalités distincts.
>
> **turn-9 — USER.** La relation finale devra être revue scientifiquement avant toute calibration.

**Required**

- Rattacher 'ça' à la mesure histologique après correction.
- Distinguer réponse biologique, signal vivant et mesure histologique.
- La mesure histologique n'existe qu'au dernier temps.
- Le signal n'est pas présenté comme mesure directe de la prolifération.
- L'état scientifique courant, tel que défini après la dernière correction, doit rester actif.
- Les formulations corrigées ou abandonnées restent reconstructibles comme historique sans rester actives.

**Prohibited**

- Assimiler automatiquement le signal à la prolifération. — `CONCEPTUAL_PLAN_COLLAPSE`
- Adopter une hypothèse de relation comme vérité du projet. — `EPISTEMIC_PROMOTION_FAILURE`

**Optional relevant**

- Modèles de relation signal vivant-mesure terminale comme hypothèses candidates soumises à revue. — HYPOTHESIS, non exhaustif

**Ambiguïtés et clarification**

- Aucun élément déclaré.

- Clarification : `OPTIONAL` — La structure scientifique est compréhensible ; la relation quantitative relève de la revue spécialisée.

**Points de revue B1**

- `SCIENTIFIC_REVIEW_REQUIRED` — Scientific readability of REQUIRED, PROHIBITED and OPTIONAL_RELEVANT
- `CALIBRATION_REVIEW_REQUIRED` — SEM-003B Calibration gate
- `PARENTAGE_REVIEW_REQUIRED` — Independent inter-set parentage review
- `METHODOLOGICAL_REVIEW_REQUIRED` — Conceptual-plan separation and OBS boundary

**Parenté — assistance only**

- Development à comparer : `SEM3-DEV-CT-FUNCTIONAL-ESTIMATE-ROLE` (METHOD_VERSUS_MEASUREMENT, PHENOMENON_VERSUS_OBSERVABLE, METHOD_MEASUREMENT, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP, PHENOMENON_OBSERVABLE) ; `SEM3-DEV-TRANSLATIONAL-HYPOXIA-CANDIDATES` (KNOWLEDGE_CANDIDATE, MULTIDIMENSIONAL_REQUEST, CONTEXTUAL_ENRICHMENT, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP) ; `SEM3-DEV-INFLAMMATION-MULTIDIMENSIONAL` (MULTIDIMENSIONAL_REQUEST, CONTEXTUAL_ENRICHMENT, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP).
- Conclusion simulée : `SIMULATED_EXPERT_CONSENSUS`. Cette conclusion ne vaut jamais indépendance humaine.

**Décisions enregistrées :** `CALIBRATION_ADMISSION=SIMULATED_APPROVE_FOR_CALIBRATION` ; `METHODOLOGICAL_REFERENCE=SIMULATED_ACCEPT` ; `PARENTAGE=SIMULATED_PARENTAGE_CLEAR` ; `SCIENTIFIC_REFERENCE=SIMULATED_ACCEPT`.

Fiche détaillée : `semantic-validation/sem-003/review/review-units/organoid-live-signal-measurement.review.md`.


---

### Échographie ovarienne et ambiguïté d'usage

**Case :** `SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY` · **Review Unit :** `SEM3B3-RU-CAL-OVARIAN-ULTRASOUND-AMBIGUITY` · **Domaine :** imagerie gynécologique et échographie · **Difficulté :** `BASIC` · **Tours :** 1

> **turn-1 — USER.** Je veux exploiter l'échographie ovarienne, mais je n'ai pas encore décidé si la question porte sur la détection, la caractérisation ou le suivi ; je ne veux pas que le choix soit fait à ma place.

**Required**

- Conserver ouvertes détection, caractérisation et suivi.
- Préserver l'échographie ovarienne comme modalité explicitement citée.

**Prohibited**

- Choisir silencieusement une finalité. — `OWNERSHIP_BOUNDARY_FAILURE`
- Inventer une mesure ou un endpoint correspondant. — `UNSUPPORTED_INVENTION_FAILURE`

**Optional relevant**

- Mesures propres à chaque finalité comme candidats ultérieurs, non comme exigences. — CONTEXTUAL_CANDIDATE, non exhaustif

**Ambiguïtés et clarification**

- L'usage scientifique de l'échographie ovarienne est indécis. — détection / caractérisation / suivi

- Clarification : `REQUIRED` — La finalité détermine la population, les mesures et l'analyse.

**Points de revue B1**

- `SCIENTIFIC_REVIEW_REQUIRED` — Scientific readability of REQUIRED, PROHIBITED and OPTIONAL_RELEVANT
- `CALIBRATION_REVIEW_REQUIRED` — SEM-003B Calibration gate
- `PARENTAGE_REVIEW_REQUIRED` — Independent inter-set parentage review
- `AMBIGUITY_ADJUDICATION_REQUIRED` — Competing interpretations and resolution information
- `METHODOLOGICAL_REVIEW_REQUIRED` — Conceptual-plan separation and OBS boundary

**Parenté — assistance only**

- Development à comparer : `SEM3-DEV-INTESTINAL-MOTILITY-METHOD` (METHOD_VERSUS_MEASUREMENT, UNDER_SPECIFIED_REQUEST, AMBIGUITY, METHOD_MEASUREMENT, MISSING_INFORMATION, OWNERSHIP) ; `SEM3-DEV-CT-FUNCTIONAL-ESTIMATE-ROLE` (METHOD_VERSUS_MEASUREMENT, SCIENTIFIC_AMBIGUITY, AMBIGUITY, METHOD_MEASUREMENT, MISSING_INFORMATION, OWNERSHIP) ; `SEM3-DEV-RETINAL-VASCULAR-OUTCOME-UNKNOWN` (SCIENTIFIC_AMBIGUITY, UNDER_SPECIFIED_REQUEST, AMBIGUITY, MISSING_INFORMATION, OWNERSHIP).
- Conclusion simulée : `SIMULATED_EXPERT_CONSENSUS`. Cette conclusion ne vaut jamais indépendance humaine.

**Décisions enregistrées :** `AMBIGUITY=SIMULATED_AMBIGUITY_REVISED` ; `CALIBRATION_ADMISSION=SIMULATED_APPROVE_FOR_CALIBRATION` ; `METHODOLOGICAL_REFERENCE=SIMULATED_ACCEPT_WITH_REVISION` ; `PARENTAGE=SIMULATED_PARENTAGE_CLEAR` ; `SCIENTIFIC_REFERENCE=SIMULATED_ACCEPT_WITH_REVISION`.

Fiche détaillée : `semantic-validation/sem-003/review/review-units/ovarian-ultrasound-ambiguity.review.md`.


---

### Hémodynamique pulmonaire et suivi multimodal

**Case :** `SEM3-CAL-PULMONARY-HEMODYNAMICS-FOLLOWUP` · **Review Unit :** `SEM3B3-RU-CAL-PULMONARY-HEMODYNAMICS-FOLLOWUP` · **Domaine :** cardiologie et hypertension pulmonaire · **Difficulté :** `ADVANCED` · **Tours :** 7

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

**Required**

- Le suivi à six mois est principalement non invasif.
- La source invasive n'existe que dans un sous-ensemble.
- Les sources ne doivent pas être supposées équivalentes.
- Distinguer phénomène, observables et méthodes.

**Prohibited**

- Fusionner les sources comme une même mesure interchangeable. — `CONCEPTUAL_PLAN_COLLAPSE`
- Présenter le cathétérisme comme disponible ou obligatoire pour tous. — `EXPLICIT_FIDELITY_FAILURE`

**Optional relevant**

- Fonction ventriculaire droite comme contribution secondaire explicitement non principale. — CONTEXTUAL_CANDIDATE, non exhaustif

**Ambiguïtés et clarification**

- Aucun élément déclaré.

- Clarification : `OPTIONAL` — La définition des observables appartient à OBS et n'empêche pas l'authoring de la structure longitudinale.

**Points de revue B1**

- `SCIENTIFIC_REVIEW_REQUIRED` — Scientific readability of REQUIRED, PROHIBITED and OPTIONAL_RELEVANT
- `CALIBRATION_REVIEW_REQUIRED` — SEM-003B Calibration gate
- `PARENTAGE_REVIEW_REQUIRED` — Independent inter-set parentage review
- `METHODOLOGICAL_REVIEW_REQUIRED` — Conceptual-plan separation and OBS boundary

**Parenté — assistance only**

- Development à comparer : `SEM3-DEV-CARDIAC-AGING-TRAJECTORY` (COMPARISON_AND_TIMING, MULTIDIMENSIONAL_REQUEST, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP) ; `SEM3-DEV-CT-FUNCTIONAL-ESTIMATE-ROLE` (PHENOMENON_VERSUS_OBSERVABLE, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP, PHENOMENON_OBSERVABLE) ; `SEM3-DEV-CORONARY-PERFUSION-PRIORITY` (COMPARISON_AND_TIMING, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP).
- Conclusion simulée : `SIMULATED_EXPERT_CONSENSUS`. Cette conclusion ne vaut jamais indépendance humaine.

**Décisions enregistrées :** `CALIBRATION_ADMISSION=SIMULATED_APPROVE_FOR_CALIBRATION` ; `METHODOLOGICAL_REFERENCE=SIMULATED_ACCEPT` ; `PARENTAGE=SIMULATED_PARENTAGE_CLEAR` ; `SCIENTIFIC_REFERENCE=SIMULATED_ACCEPT`.

Fiche détaillée : `semantic-validation/sem-003/review/review-units/pulmonary-hemodynamics-followup.review.md`.


---

### Essai pragmatique avec comparateur encore indécis

**Case :** `SEM3-CAL-TRIAL-COMPARATOR-DECISION` · **Review Unit :** `SEM3B3-RU-CAL-TRIAL-COMPARATOR-DECISION` · **Domaine :** méthodologie d'essai clinique pragmatique · **Difficulté :** `ADVANCED` · **Tours :** 7

> **turn-1 — USER.** Nous voulons évaluer une nouvelle stratégie de suivi.
>
> **turn-2 — USER.** Le résultat principal devrait refléter l'utilisation des soins sur six mois.
>
> **turn-3 — USER.** Je ne sais pas si le comparateur sera le suivi habituel ou la période avant déploiement.
>
> **turn-4 — USER.** Les deux options n'ont pas la même temporalité.
>
> **turn-5 — USER.** On peut commencer l'inventaire des données.
>
> **turn-6 — USER.** Mais le dessin comparatif ne doit pas être choisi automatiquement.
>
> **turn-7 — USER.** La prochaine question utile porte bien sur le comparateur et la période de référence.

**Required**

- Conserver l'horizon de six mois pour le résultat principal candidat.
- Garder ouverts suivi habituel et période pré-déploiement.
- L'inventaire des données peut avancer malgré la décision ouverte.
- Le besoin d'information sur comparateur et référence est explicitement décisionnel.

**Prohibited**

- Adopter un comparateur sans décision humaine. — `OWNERSHIP_BOUNDARY_FAILURE`
- Présenter l'ensemble du projet comme bloqué alors que l'inventaire peut progresser. — `CLARIFICATION_FAILURE`

**Optional relevant**

- Sources de données d'utilisation des soins comme candidats à inventorier. — CONTEXTUAL_CANDIDATE, non exhaustif

**Ambiguïtés et clarification**

- Le comparateur définit deux dessins non équivalents. — suivi habituel contemporain / période avant déploiement

- Clarification : `REQUIRED` — La réponse change le dessin comparatif et la temporalité.

**Points de revue B1**

- `SCIENTIFIC_REVIEW_REQUIRED` — Scientific readability of REQUIRED, PROHIBITED and OPTIONAL_RELEVANT
- `CALIBRATION_REVIEW_REQUIRED` — SEM-003B Calibration gate
- `PARENTAGE_REVIEW_REQUIRED` — Independent inter-set parentage review
- `AMBIGUITY_ADJUDICATION_REQUIRED` — Competing interpretations and resolution information

**Parenté — assistance only**

- Development à comparer : `SEM3-DEV-RETINAL-VASCULAR-OUTCOME-UNKNOWN` (COMPARISON_AND_TIMING, SCIENTIFIC_AMBIGUITY, UNDER_SPECIFIED_REQUEST, AMBIGUITY, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP) ; `SEM3-DEV-ROUTINE-DATA-COMPARATOR-GAP` (SCIENTIFIC_AMBIGUITY, UNDER_SPECIFIED_REQUEST, AMBIGUITY, MISSING_INFORMATION, OWNERSHIP) ; `SEM3-DEV-CT-FUNCTIONAL-ESTIMATE-ROLE` (SCIENTIFIC_AMBIGUITY, AMBIGUITY, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP).
- Conclusion simulée : `SIMULATED_EXPERT_CONSENSUS`. Cette conclusion ne vaut jamais indépendance humaine.

**Décisions enregistrées :** `AMBIGUITY=SIMULATED_AMBIGUITY_CONFIRMED` ; `CALIBRATION_ADMISSION=SIMULATED_APPROVE_FOR_CALIBRATION` ; `METHODOLOGICAL_REFERENCE=SIMULATED_ACCEPT` ; `PARENTAGE=SIMULATED_PARENTAGE_CLEAR` ; `SCIENTIFIC_REFERENCE=SIMULATED_ACCEPT`.

Fiche détaillée : `semantic-validation/sem-003/review/review-units/trial-comparator-decision.review.md`.


## C. Cinq équivalences Development

Le Level 1 n’établit aucune équivalence à lui seul. Les dispositions ci-dessous proviennent des trois avis simulés séparés et de leur consensus ; elles peuvent servir aux tests Development de l’évaluateur, jamais comme preuve indépendante finale.

### Estimation fonctionnelle dérivée du CT, représentation et valeur

**Case :** `SEM3-DEV-CT-FUNCTIONAL-ESTIMATE-ROLE` · **Review Unit :** `SEM3B3-RU-DEV-CT-FUNCTIONAL-ESTIMATE-ROLE` · **Domaine :** CT cardiaque et estimation fonctionnelle · **Difficulté :** `ADVANCED` · **Tours :** 6

> **turn-1 — USER.** Je voudrais utiliser une estimation fonctionnelle dérivée d'un CT coronaire.
>
> **turn-2 — USER.** Ce qui m'intéresse n'est pas seulement la représentation le long du vaisseau.
>
> **turn-3 — USER.** Je veux comparer une valeur quantitative entre deux groupes.
>
> **turn-4 — USER.** Je n'ai pas encore décidé si on prendra une valeur minimale, une valeur par lésion ou un résumé par vaisseau.
>
> **turn-5 — USER.** Le traitement computationnel est donc la méthode, pas l'endpoint en lui-même.
>
> **turn-6 — USER.** Et la valeur finale devra rester ouverte jusqu'à la définition de mesure.

**Required**

- Le traitement computationnel est présenté comme méthode de production d'information quantitative.
- La représentation le long du vaisseau est distincte de la valeur extraite.
- Une valeur quantitative, encore à définir, doit être comparée entre deux groupes.
- Aucun rôle d'endpoint ne peut être adopté automatiquement.

**Prohibited**

- Confondre la méthode computationnelle avec la valeur quantitative mesurée. — `CONCEPTUAL_PLAN_COLLAPSE`
- Choisir une valeur par lésion comme endpoint sans décision du projet. — `OWNERSHIP_BOUNDARY_FAILURE`

**Optional relevant**

- Agrégations par lésion, vaisseau ou valeur minimale comme options à qualifier, non comme choix acquis. — OPTION, non exhaustif

**Ambiguïtés et clarification**

- L'agrégation de la valeur n'est pas décidée. — valeur minimale / valeur par lésion / résumé par vaisseau

- Clarification : `REQUIRED` — L'agrégation change la variable et l'interprétation du projet.

**Points de revue B1**

- `SCIENTIFIC_REVIEW_REQUIRED` — Scientific readability of REQUIRED, PROHIBITED and OPTIONAL_RELEVANT
- `AMBIGUITY_ADJUDICATION_REQUIRED` — Competing interpretations and resolution information
- `METHODOLOGICAL_REVIEW_REQUIRED` — Conceptual-plan separation and OBS boundary

**Parenté — assistance only**

- Development à comparer : `SEM3-DEV-INTESTINAL-MOTILITY-METHOD` (METHOD_VERSUS_MEASUREMENT, PHENOMENON_VERSUS_OBSERVABLE, AMBIGUITY, METHOD_MEASUREMENT, MISSING_INFORMATION, OWNERSHIP, PHENOMENON_OBSERVABLE) ; `SEM3-DEV-BODY-COMPOSITION-AMBIGUITY` (PHENOMENON_VERSUS_OBSERVABLE, SCIENTIFIC_AMBIGUITY, AMBIGUITY, MISSING_INFORMATION, PHENOMENON_OBSERVABLE) ; `SEM3-DEV-RETINAL-VASCULAR-OUTCOME-UNKNOWN` (SCIENTIFIC_AMBIGUITY, AMBIGUITY, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP).
- Conclusion simulée : `SIMULATED_EXPERT_CONSENSUS`. Cette conclusion ne vaut jamais indépendance humaine.

**Décisions enregistrées :** `SEMANTIC_EQUIVALENCE=SIMULATED_SEMANTICALLY_EQUIVALENT`.

Fiche détaillée : `semantic-validation/sem-003/review/review-units/ct-functional-estimate-role.review.md`.


## Paire d’équivalence B2

**Pair ID :** `SEM3B3-EQ-CT-FUNCTIONAL-ESTIMATE-ROLE` · **État :** `SIMULATED_EXPERT_CONSENSUS_RECORDED`

- Candidate A : `SEM3-EVAL-CAND-CT-FUNCTIONAL-ESTIMATE-ROLE-BASELINE` — profil `CONSOLIDATED`.
- Candidate B : `SEM3-EVAL-CAND-CT-FUNCTIONAL-ESTIMATE-ROLE-DISTRIBUTED` — profil `DISTRIBUTED_EQUIVALENT`.

Vecteur scientifique à comparer :

- Le traitement computationnel est présenté comme méthode de production d'information quantitative.
- La représentation le long du vaisseau est distincte de la valeur extraite.
- Une valeur quantitative, encore à définir, doit être comparée entre deux groupes.
- Aucun rôle d'endpoint ne peut être adopté automatiquement.

Contrôles Level 1 observés : les deux candidats déclarent les mêmes obligations préservées, les mêmes interdictions absentes, les mêmes ambiguïtés ouvertes, les mêmes frontières d’ownership et une provenance reconstructible.

**Limite :** cette égalité contractuelle ne prouve pas l’équivalence scientifique. L’humain doit comparer conséquences scientifiques, statuts épistémiques, unknowns, clarification, ownership et provenance.

---

### Changement de priorité entre biomarqueur et résultat rapporté

**Case :** `SEM3-DEV-OUTCOME-PRIORITY-CHANGE` · **Review Unit :** `SEM3B3-RU-DEV-OUTCOME-PRIORITY-CHANGE` · **Domaine :** méthodologie de recherche clinique · **Difficulté :** `COMPOSITIONAL` · **Tours :** 6

> **turn-1 — USER.** Je prépare une étude avec un biomarqueur mesuré à trois mois et un score de fatigue rapporté par les participants.
>
> **turn-2 — USER.** Je pensais utiliser le biomarqueur comme endpoint principal.
>
> **turn-3 — USER.** Le score de fatigue sera recueilli au même temps.
>
> **turn-4 — USER.** En fait, c'est la fatigue qui doit devenir l'objectif principal.
>
> **turn-5 — USER.** Le biomarqueur doit rester un résultat secondaire.
>
> **turn-6 — USER.** Je veux garder la trace de cette correction pour la revue du projet.

**Required**

- Le score de fatigue devient l'objectif principal actif.
- Le biomarqueur reste un résultat secondaire.
- Le choix initial du biomarqueur principal reste historique et reconstructible.
- L'état scientifique courant, tel que défini après la dernière correction, doit rester actif.
- Les formulations corrigées ou abandonnées restent reconstructibles comme historique sans rester actives.

**Prohibited**

- Maintenir le biomarqueur comme endpoint principal actif. — `RELATION_SEMANTICS_FAILURE`
- Compléter silencieusement la définition du biomarqueur ou du score. — `UNSUPPORTED_INVENTION_FAILURE`

**Optional relevant**

- Spécifications d'analyse des deux résultats comme travail aval, non comme faits adoptés. — OPTION, non exhaustif

**Ambiguïtés et clarification**

- Aucun élément déclaré.

- Clarification : `OPTIONAL` — La hiérarchie des endpoints est comprise ; leurs définitions restent nécessaires avant conception finale.

**Points de revue B1**

- `SCIENTIFIC_REVIEW_REQUIRED` — Scientific readability of REQUIRED, PROHIBITED and OPTIONAL_RELEVANT

**Parenté — assistance only**

- Development à comparer : `SEM3-DEV-TRIAL-IMAGING-OUTCOME-CORRECTION` (CHANGE_OF_MIND, COMPARISON_AND_TIMING, MULTI_TURN_CORRECTION, CHANGE_OF_MIND, CORRECTION, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP) ; `SEM3-DEV-CARDIAC-AGING-TRAJECTORY` (CHANGE_OF_MIND, COMPARISON_AND_TIMING, MULTI_TURN_CORRECTION, CHANGE_OF_MIND, CORRECTION, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP) ; `SEM3-DEV-VALVE-HEMODYNAMICS-MULTIMODAL` (CHANGE_OF_MIND, COMPARISON_AND_TIMING, CHANGE_OF_MIND, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP).
- Conclusion simulée : `SIMULATED_EXPERT_CONSENSUS`. Cette conclusion ne vaut jamais indépendance humaine.

**Décisions enregistrées :** `SEMANTIC_EQUIVALENCE=SIMULATED_SEMANTICALLY_EQUIVALENT`.

Fiche détaillée : `semantic-validation/sem-003/review/review-units/outcome-priority-change.review.md`.


## Paire d’équivalence B2

**Pair ID :** `SEM3B3-EQ-OUTCOME-PRIORITY-CHANGE` · **État :** `SIMULATED_EXPERT_CONSENSUS_RECORDED`

- Candidate A : `SEM3-EVAL-CAND-OUTCOME-PRIORITY-CHANGE-BASELINE` — profil `CONSOLIDATED`.
- Candidate B : `SEM3-EVAL-CAND-OUTCOME-PRIORITY-CHANGE-DISTRIBUTED` — profil `DISTRIBUTED_EQUIVALENT`.

Vecteur scientifique à comparer :

- Le score de fatigue devient l'objectif principal actif.
- Le biomarqueur reste un résultat secondaire.
- Le choix initial du biomarqueur principal reste historique et reconstructible.
- L'état scientifique courant, tel que défini après la dernière correction, doit rester actif.
- Les formulations corrigées ou abandonnées restent reconstructibles comme historique sans rester actives.

Contrôles Level 1 observés : les deux candidats déclarent les mêmes obligations préservées, les mêmes interdictions absentes, les mêmes ambiguïtés ouvertes, les mêmes frontières d’ownership et une provenance reconstructible.

**Limite :** cette égalité contractuelle ne prouve pas l’équivalence scientifique. L’humain doit comparer conséquences scientifiques, statuts épistémiques, unknowns, clarification, ownership et provenance.

---

### Graisse péricardique et fonction atriale sans promotion causale

**Case :** `SEM3-DEV-PERICARDIAL-FAT-NONCAUSAL` · **Review Unit :** `SEM3B3-RU-DEV-PERICARDIAL-FAT-NONCAUSAL` · **Domaine :** imagerie cardiaque et physiologie atriale · **Difficulté :** `ADVANCED` · **Tours :** 5

> **turn-1 — USER.** Je veux comparer la quantité de graisse péricardique au CT et la fonction atriale mesurée en échographie.
>
> **turn-2 — USER.** Les deux examens sont disponibles autour de la même visite.
>
> **turn-3 — USER.** Je pensais écrire que la graisse explique la fonction atriale.
>
> **turn-4 — USER.** Non, ce serait trop fort.
>
> **turn-5 — USER.** Je veux seulement étudier leur association, sans hypothèse causale imposée.

**Required**

- L'état courant demande une association entre graisse péricardique et fonction atriale, non une explication causale.
- La formulation causale initiale reste dans l'historique comme état rejeté.
- Préserver les deux observations distinctes et leur disponibilité autour de la même visite.
- L'état scientifique courant, tel que défini après la dernière correction, doit rester actif.
- Les formulations corrigées ou abandonnées restent reconstructibles comme historique sans rester actives.

**Prohibited**

- Maintenir l'explication causale explicitement rejetée. — `POLARITY_OR_CAUSALITY_FAILURE`
- Choisir une définition de mesure non fournie comme fait du projet. — `UNSUPPORTED_INVENTION_FAILURE`

**Optional relevant**

- Définitions de quantification à qualifier par les owners spécialisés. — CONTEXTUAL_CANDIDATE, non exhaustif

**Ambiguïtés et clarification**

- Aucun élément déclaré.

- Clarification : `OPTIONAL` — Les mesures exactes sont nécessaires à la conception aval, pas à la compréhension de la relation non causale.

**Points de revue B1**

- `SCIENTIFIC_REVIEW_REQUIRED` — Scientific readability of REQUIRED, PROHIBITED and OPTIONAL_RELEVANT

**Parenté — assistance only**

- Development à comparer : `SEM3-DEV-CARDIAC-AGING-TRAJECTORY` (MULTI_TURN_CORRECTION, CORRECTION, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, NEGATION) ; `SEM3-DEV-INFLAMMATION-MULTIDIMENSIONAL` (NEGATION_AND_NON_CAUSALITY, STRONG_CONTEXTUAL_IMPLICIT, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, NEGATION) ; `SEM3-DEV-OUTCOME-PRIORITY-CHANGE` (MULTI_TURN_CORRECTION, CORRECTION, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT).
- Conclusion simulée : `SIMULATED_EXPERT_CONSENSUS`. Cette conclusion ne vaut jamais indépendance humaine.

**Décisions enregistrées :** `SEMANTIC_EQUIVALENCE=SIMULATED_SEMANTICALLY_EQUIVALENT`.

Fiche détaillée : `semantic-validation/sem-003/review/review-units/pericardial-fat-noncausal.review.md`.


## Paire d’équivalence B2

**Pair ID :** `SEM3B3-EQ-PERICARDIAL-FAT-NONCAUSAL` · **État :** `SIMULATED_EXPERT_CONSENSUS_RECORDED`

- Candidate A : `SEM3-EVAL-CAND-PERICARDIAL-FAT-NONCAUSAL-BASELINE` — profil `CONSOLIDATED`.
- Candidate B : `SEM3-EVAL-CAND-PERICARDIAL-FAT-NONCAUSAL-DISTRIBUTED` — profil `DISTRIBUTED_EQUIVALENT`.

Vecteur scientifique à comparer :

- L'état courant demande une association entre graisse péricardique et fonction atriale, non une explication causale.
- La formulation causale initiale reste dans l'historique comme état rejeté.
- Préserver les deux observations distinctes et leur disponibilité autour de la même visite.
- L'état scientifique courant, tel que défini après la dernière correction, doit rester actif.
- Les formulations corrigées ou abandonnées restent reconstructibles comme historique sans rester actives.

Contrôles Level 1 observés : les deux candidats déclarent les mêmes obligations préservées, les mêmes interdictions absentes, les mêmes ambiguïtés ouvertes, les mêmes frontières d’ownership et une provenance reconstructible.

**Limite :** cette égalité contractuelle ne prouve pas l’équivalence scientifique. L’humain doit comparer conséquences scientifiques, statuts épistémiques, unknowns, clarification, ownership et provenance.

---

### Imagerie vasculaire rétinienne avec référentiel fonctionnel incomplet

**Case :** `SEM3-DEV-RETINAL-VASCULAR-OUTCOME-UNKNOWN` · **Review Unit :** `SEM3B3-RU-DEV-RETINAL-VASCULAR-OUTCOME-UNKNOWN` · **Domaine :** imagerie rétinienne vasculaire · **Difficulté :** `COMPOSITIONAL` · **Tours :** 7

> **turn-1 — USER.** Je veux étudier les changements vasculaires rétiniens après traitement.
>
> **turn-2 — USER.** On a une acquisition initiale et une acquisition de contrôle.
>
> **turn-3 — USER.** Le contrôle n'est pas toujours fait au même moment.
>
> **turn-4 — USER.** Je voudrais comparer les patients dont la fonction visuelle reste stable et les autres.
>
> **turn-5 — USER.** Mais je n'ai pas encore défini ce que veut dire stable.
>
> **turn-6 — USER.** La technique d'imagerie vasculaire varie aussi selon le centre.
>
> **turn-7 — USER.** On peut avancer sur l'inventaire, mais pas inventer le critère clinique ni l'équivalence des modalités.

**Required**

- Préserver la comparaison entre acquisition initiale et contrôle.
- La stabilité fonctionnelle reste inconnue et bloquante pour la stratification.
- Le moment du contrôle varie et doit rester visible.
- L'équivalence entre techniques ne peut être décidée par SEM.

**Prohibited**

- Créer arbitrairement un critère de stabilité fonctionnelle. — `MISSING_INFORMATION_FAILURE`
- Présenter le timing ou les techniques comme harmonisés. — `UNSUPPORTED_INVENTION_FAILURE`

**Optional relevant**

- Analyses de sensibilité ou harmonisation comme options méthodologiques à revoir. — OPTION, non exhaustif

**Ambiguïtés et clarification**

- Le terme stable ne possède pas de définition opérationnelle. — stabilité d'acuité / stabilité d'un autre critère fonctionnel / absence de dégradation au-delà d'une marge

- Clarification : `REQUIRED` — La définition de stabilité change la constitution des groupes.

**Points de revue B1**

- `SCIENTIFIC_REVIEW_REQUIRED` — Scientific readability of REQUIRED, PROHIBITED and OPTIONAL_RELEVANT
- `AMBIGUITY_ADJUDICATION_REQUIRED` — Competing interpretations and resolution information

**Parenté — assistance only**

- Development à comparer : `SEM3-DEV-CT-FUNCTIONAL-ESTIMATE-ROLE` (SCIENTIFIC_AMBIGUITY, AMBIGUITY, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP) ; `SEM3-DEV-INTESTINAL-MOTILITY-METHOD` (UNDER_SPECIFIED_REQUEST, AMBIGUITY, MISSING_INFORMATION, OWNERSHIP) ; `SEM3-DEV-PANCREATIC-COMPOSITION-LONGITUDINAL` (COMPARISON_AND_TIMING, MISSING_INFORMATION, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP).
- Conclusion simulée : `SIMULATED_EXPERT_CONSENSUS`. Cette conclusion ne vaut jamais indépendance humaine.

**Décisions enregistrées :** `SEMANTIC_EQUIVALENCE=SIMULATED_SEMANTICALLY_EQUIVALENT`.

Fiche détaillée : `semantic-validation/sem-003/review/review-units/retinal-vascular-outcome-unknown.review.md`.


## Paire d’équivalence B2

**Pair ID :** `SEM3B3-EQ-RETINAL-VASCULAR-OUTCOME-UNKNOWN` · **État :** `SIMULATED_EXPERT_CONSENSUS_RECORDED`

- Candidate A : `SEM3-EVAL-CAND-RETINAL-VASCULAR-OUTCOME-UNKNOWN-BASELINE` — profil `CONSOLIDATED`.
- Candidate B : `SEM3-EVAL-CAND-RETINAL-VASCULAR-OUTCOME-UNKNOWN-DISTRIBUTED` — profil `DISTRIBUTED_EQUIVALENT`.

Vecteur scientifique à comparer :

- Préserver la comparaison entre acquisition initiale et contrôle.
- La stabilité fonctionnelle reste inconnue et bloquante pour la stratification.
- Le moment du contrôle varie et doit rester visible.
- L'équivalence entre techniques ne peut être décidée par SEM.

Contrôles Level 1 observés : les deux candidats déclarent les mêmes obligations préservées, les mêmes interdictions absentes, les mêmes ambiguïtés ouvertes, les mêmes frontières d’ownership et une provenance reconstructible.

**Limite :** cette égalité contractuelle ne prouve pas l’équivalence scientifique. L’humain doit comparer conséquences scientifiques, statuts épistémiques, unknowns, clarification, ownership et provenance.

---

### Valvulopathie, hémodynamique et priorité multimodale

**Case :** `SEM3-DEV-VALVE-HEMODYNAMICS-MULTIMODAL` · **Review Unit :** `SEM3B3-RU-DEV-VALVE-HEMODYNAMICS-MULTIMODAL` · **Domaine :** valvulopathies et imagerie cardiovasculaire multimodale · **Difficulté :** `COMPOSITIONAL` · **Tours :** 8

> **turn-1 — USER.** On veut étudier l'évolution hémodynamique après l'intervention valvulaire.
>
> **turn-2 — USER.** L'échographie est disponible en routine avant et après.
>
> **turn-3 — USER.** Une IRM existe seulement chez une partie des participants.
>
> **turn-4 — USER.** Je pensais d'abord centrer l'étude sur les volumes.
>
> **turn-5 — USER.** Mais le gradient et les conséquences sur le ventricule m'intéressent tous les deux.
>
> **turn-6 — USER.** Finalement ne faisons pas de l'IRM une condition d'inclusion.
>
> **turn-7 — USER.** Elle peut rester une contribution secondaire si elle existe.
>
> **turn-8 — USER.** La comparaison principale doit rester portée par les données réellement communes.

**Required**

- La comparaison principale repose sur les données communes avant/après.
- L'IRM est secondaire et non obligatoire pour l'inclusion.
- Conserver les deux plans : hémodynamique valvulaire et conséquences ventriculaires.
- La disponibilité partielle de l'IRM doit rester reconstructible.

**Prohibited**

- Transformer l'IRM partielle en condition d'inclusion active. — `EXPLICIT_FIDELITY_FAILURE`
- Désigner le gradient comme endpoint principal sans adoption. — `OWNERSHIP_BOUNDARY_FAILURE`

**Optional relevant**

- Analyses CMR secondaires chez les participants disposant de données, sous conditions de comparabilité. — OPTION, non exhaustif

**Ambiguïtés et clarification**

- Aucun élément déclaré.

- Clarification : `OPTIONAL` — Le choix du paramètre principal affecte la projection mais n'empêche pas de conserver la structure multimodale.

**Points de revue B1**

- `SCIENTIFIC_REVIEW_REQUIRED` — Scientific readability of REQUIRED, PROHIBITED and OPTIONAL_RELEVANT

**Parenté — assistance only**

- Development à comparer : `SEM3-DEV-CARDIAC-AGING-TRAJECTORY` (CHANGE_OF_MIND, COMPARISON_AND_TIMING, MULTIDIMENSIONAL_REQUEST, CHANGE_OF_MIND, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP) ; `SEM3-DEV-CORONARY-PERFUSION-PRIORITY` (COMPARISON_AND_TIMING, NECESSARY_IMPLICIT, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP) ; `SEM3-DEV-OUTCOME-PRIORITY-CHANGE` (CHANGE_OF_MIND, COMPARISON_AND_TIMING, CHANGE_OF_MIND, MULTI_TURN_CONTEXT_DEPENDENT, OWNERSHIP).
- Conclusion simulée : `SIMULATED_EXPERT_CONSENSUS`. Cette conclusion ne vaut jamais indépendance humaine.

**Décisions enregistrées :** `SEMANTIC_EQUIVALENCE=SIMULATED_SEMANTICALLY_EQUIVALENT`.

Fiche détaillée : `semantic-validation/sem-003/review/review-units/valve-hemodynamics-multimodal.review.md`.


## Paire d’équivalence B2

**Pair ID :** `SEM3B3-EQ-VALVE-HEMODYNAMICS-MULTIMODAL` · **État :** `SIMULATED_EXPERT_CONSENSUS_RECORDED`

- Candidate A : `SEM3-EVAL-CAND-VALVE-HEMODYNAMICS-MULTIMODAL-BASELINE` — profil `CONSOLIDATED`.
- Candidate B : `SEM3-EVAL-CAND-VALVE-HEMODYNAMICS-MULTIMODAL-DISTRIBUTED` — profil `DISTRIBUTED_EQUIVALENT`.

Vecteur scientifique à comparer :

- La comparaison principale repose sur les données communes avant/après.
- L'IRM est secondaire et non obligatoire pour l'inclusion.
- Conserver les deux plans : hémodynamique valvulaire et conséquences ventriculaires.
- La disponibilité partielle de l'IRM doit rester reconstructible.

Contrôles Level 1 observés : les deux candidats déclarent les mêmes obligations préservées, les mêmes interdictions absentes, les mêmes ambiguïtés ouvertes, les mêmes frontières d’ownership et une provenance reconstructible.

**Limite :** cette égalité contractuelle ne prouve pas l’équivalence scientifique. L’humain doit comparer conséquences scientifiques, statuts épistémiques, unknowns, clarification, ownership et provenance.

## D. Correction versionnée

`SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY` passe de 1.0.0 à 1.0.1. La seule correction scientifique documentaire est « IRM » → « échographie ovarienne » dans l’ambiguïté. Détection, caractérisation et suivi restent ouverts. L’ancienne version, les anciens digests, le commit source et les nouveaux digests sont conservés dans `reference-revision-lineage.json`.

## E. État et limites

- 39/62 items de la queue B1 sont résolus par la revue simulée ; 23/62 Development non bloquants restent ouverts.
- 10/10 références sont `CALIBRATION_VISIBLE` et 0 reste `DESIGN_ONLY`.
- 5/5 équivalences Development portent une disposition simulée.
- `REAL_HUMAN_REFERENCE_REVIEW = NOT_PERFORMED`.
- `FINAL_PD011_REFERENCE_ELIGIBILITY = NO` et `BLIND_ELIGIBILITY = NO`.
- Aucune Calibration B4, aucun SEM, aucun provider, aucun blind set et aucune décision PASS/FAIL n’ont été exécutés.
