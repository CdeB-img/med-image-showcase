# W1-QUAL-02H1M — Campaign E human review packet

`LEVEL_3_IMPLEMENTATION_EVIDENCE — NON_NORMATIVE`

## Décision de préparation

`W1_QUAL_02H1M_HUMAN_REVIEW_PACKET_READY_WITH_TECHNICAL_LIMITATIONS`

Ce packet rend sept sorties ST lisibles pour une adjudication scientifique exclusivement humaine. Il ne contient aucun verdict scientifique automatique et ne qualifie pas ST.

- `CAMPAIGN_ID = W1-QUAL-02H-ST-2026-08-26-E`
- `FREEZE = ke1-d1c4ff40aa84e28c`
- `CHECKER_LIMITATION = SOURCE_EVIDENCE_REFS_AND_LINEAGE_INTEGRITY_NOT_RELIABLE_FOR_CAMPAIGN_E`
- `AUTOMATED_SCIENTIFIC_CHECKER_AS_HUMAN_PACKET_GATE = ABANDONED_BY_HUMAN_PROGRAM_DECISION`
- `TOTAL_FROZEN_CASES = 8`
- `TECHNICALLY_NON_ADJUDICABLE = 1`
- `HUMAN_REVIEWABLE_CASES = 7`
- `HUMAN_SCIENTIFIC_ADJUDICATION_REQUIRED = YES`
- `SCIENTIFIC_PASS = NO`

## Cas non adjudicable conservé

`ST02H1-E-NVC-MECHANISM-01` reste `TECHNICALLY_NON_ADJUDICABLE` : sa sortie ST originale n'est pas récupérable. Il n'a été ni rejoué, ni remplacé, ni reconstruit.

## Vue d'ensemble des sept cas à juger

| Cas | Famille | Origine | Output digest | H1–H8 |
|---|---|---|---|---|
| `ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01` | `B_NAMED_ALTERNATIVES` | `EXISTING_FROZEN_OUTPUT_FOR_HUMAN_REVIEW` | `ke1-e8b1eb3cc7f26720` | `PENDING` |
| `ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01` | `C_KNOWLEDGE_CONTRADICTION` | `H1M_SINGLE_LOCAL_EXECUTION` | `ke1-bffb3f6ff40a6c5b` | `PENDING` |
| `ST02H1-E-ICI-EXPOSURE-UNKNOWN-01` | `D_STRUCTURING_PROJECT_UNKNOWN` | `H1M_SINGLE_LOCAL_EXECUTION` | `ke1-5928ccff0a0f79d3` | `PENDING` |
| `ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01` | `E_OUT_OF_OWNERSHIP` | `H1M_SINGLE_LOCAL_EXECUTION` | `ke1-eb4439319e05c35d` | `PENDING` |
| `ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01` | `F_INSUFFICIENT_KNOWLEDGE` | `H1M_SINGLE_LOCAL_EXECUTION` | `ke1-1228b0c5beca52b9` | `PENDING` |
| `ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01` | `G_NARROW_APPLICABILITY` | `H1M_SINGLE_LOCAL_EXECUTION` | `ke1-76016753ef5723c7` | `PENDING` |
| `ST02H1-E-GM-WM-CBF-ASSOCIATION-01` | `H_SIMPLE_SUPPORTED_ASSOCIATION` | `H1M_SINGLE_LOCAL_EXECUTION` | `ke1-b154ccf0e922caec` | `PENDING` |

## 1. Alternatives explicatives d'une non-détection K-edge

**Cas :** `ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01`

**Famille :** `B_NAMED_ALTERNATIVES`

**Domaine :** `SPECTRAL_CT_K_EDGE_METROLOGY`

**Origine :** `EXISTING_FROZEN_OUTPUT_FOR_HUMAN_REVIEW`

### Entrée scientifique gelée

**Question Project**

> Dans un phantom contenant un matériau K-edge, une non-détection relève-t-elle d'une concentration sous la LOD, d'une séparabilité insuffisante, du volume partiel ou d'un biais de reconstruction ?

**Project binding**

- `project:W1-QUAL-02H-ST-2026-08-26-E:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01@project:W1-QUAL-02H-ST-2026-08-26-E:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:version:1#ke1-574870d7ab531263`
- Snapshot : `ke1-83d4ab19510f4375`

**Contexte Project pertinent**

- SCIENTIFIC_QUESTION — Dans un phantom contenant un matériau K-edge, une non-détection relève-t-elle d'une concentration sous la LOD, d'une séparabilité insuffisante, du volume partiel ou d'un biais de reconstruction ? [KNOWN]
- OBJECTIVE — Structurer les explications alternatives fournies et les informations qui permettraient de les distinguer. [KNOWN]
- POPULATION — Phantoms traçables contenant un matériau K-edge déclaré [KNOWN]
- CONDITION — Signal élémentaire K-edge non récupéré [KNOWN]
- IMAGING_MODALITY — Décomposition K-edge [KNOWN]
- CANONICAL_VARIABLE — Concentration élémentaire [KNOWN]
- CANONICAL_VARIABLE — Séparabilité spectrale [KNOWN]
- CANONICAL_VARIABLE — Volume partiel [KNOWN]
- CANONICAL_VARIABLE — Biais de reconstruction ou de modèle [KNOWN]
- CANONICAL_VARIABLE — Signal K-edge récupéré [KNOWN]
- IMAGING_MODALITY — Scanner à comptage photonique multi-bins [KNOWN]

**Unknowns Project explicites**

- Cause réelle de la non-détection dans le phantom considéré

### Knowledge gelé — contenu concis

**Synthèse**

Une non-détection peut refléter une concentration ou un nombre de photons insuffisant au regard d'une limite de détection propre à la tâche. Une séparabilité spectrale insuffisante peut résulter de la résolution énergétique finie, du spectre transmis, du bruit, des matériaux concurrents ou de la réponse des bins. Le volume partiel ou des matériaux non modélisés peuvent rendre une décomposition instable ou biaisée malgré un phantom simple. La reconstruction statistique, la régularisation et les corrections du partage de charge peuvent modifier la récupération du signal ou introduire un biais dépendant du modèle.

**Assertions ou positions applicables**

- Une non-détection peut refléter une concentration ou un nombre de photons insuffisant au regard d'une limite de détection propre à la tâche. — status=GOVERNED_DOCUMENTARY | context={"applicability":"SPECTRAL_CT_K_EDGE_METROLOGY"}
- Une séparabilité spectrale insuffisante peut résulter de la résolution énergétique finie, du spectre transmis, du bruit, des matériaux concurrents ou de la réponse des bins. — status=GOVERNED_DOCUMENTARY | context={"applicability":"SPECTRAL_CT_K_EDGE_METROLOGY"}
- Le volume partiel ou des matériaux non modélisés peuvent rendre une décomposition instable ou biaisée malgré un phantom simple. — status=GOVERNED_DOCUMENTARY | context={"applicability":"SPECTRAL_CT_K_EDGE_METROLOGY"}
- La reconstruction statistique, la régularisation et les corrections du partage de charge peuvent modifier la récupération du signal ou introduire un biais dépendant du modèle. — status=GOVERNED_DOCUMENTARY | context={"applicability":"SPECTRAL_CT_K_EDGE_METROLOGY"}

**Sources locales admises**

- RB-003@1.0#42-49

**Références de preuve**

- RB-003:R10:PMID-24801550
- RB-003:R35:PMID-31984498
- RB-003:R36:PMID-17634657
- RB-003:R37:PMID-18612175
- RB-003:R45:PMID-38306974

**Gaps**

- Aucun élément déclaré.

**Contradictions / controverses**

- Aucun élément déclaré.

**Limitations**

- Une non-détection ne prouve pas l'absence de matériau sous la limite de détection.
- Les alternatives dépendent de la tâche, de la géométrie, de la dose, de la taille, du détecteur et de la reconstruction.

### Sortie Scientific Thinking 1.2.2 — contenu scientifique complet lisible

**État et compréhension**

- Status : `CANDIDATES_PROPOSED`
- Candidate notice : `ALL_GENERATED_SCIENTIFIC_CONTENT_REQUIRES_HUMAN_REVIEW`
- Idée originale : Dans un phantom contenant un matériau K-edge, une non-détection relève-t-elle d'une concentration sous la LOD, d'une séparabilité insuffisante, du volume partiel ou d'un biais de reconstruction ? Examiner si ST conserve plusieurs explications nommées et distinctes d'une non-détection sans les aplatir en alternative générique.
- Problème compris : Dans un phantom contenant un matériau K-edge, une non-détection relève-t-elle d'une concentration sous la LOD, d'une séparabilité insuffisante, du volume partiel ou d'un biais de reconstruction ?
- Objet scientifique central : Concentration élémentaire
- Refusal : NONE
- Next action proposée : `REVIEW_CANDIDATES`
- Décision humaine requise : `YES`

**Questions candidates**

- Dans un phantom contenant un matériau K-edge, une non-détection relève-t-elle d'une concentration sous la LOD, d'une séparabilité insuffisante, du volume partiel ou d'un biais de reconstruction ? — kind=PRIMARY | rationale=La formulation contient déjà un objet, une relation et un élément de contexte ou de temporalité ; elle est conservée avec une normalisation minimale. | testability=TESTABLE_CANDIDATE | scope=TOO_NARROW | support=PARTIAL | reviewState=PENDING | sourceTerms=Biais de reconstruction ou de modèle; Concentration élémentaire
- La comparaison entre Décomposition K-edge et Scanner à comptage photonique multi-bins constitue-t-elle une question méthodologique distincte de la question scientifique principale ? — kind=METHODOLOGICAL_BRANCH | rationale=Le choix de méthode est séparé de la relation scientifique afin de ne pas faire passer une solution prématurée pour la question principale. | testability=NEEDS_CLARIFICATION | scope=TOO_NARROW | support=PARTIAL | reviewState=PENDING | sourceTerms=Décomposition K-edge; Scanner à comptage photonique multi-bins

**Objectifs candidats**

- Évaluer la question scientifique candidate : « Dans un phantom contenant un matériau K-edge, une non-détection relève-t-elle d'une concentration sous la LOD, d'une séparabilité insuffisante, du volume partiel ou d'un biais de reconstruction  ». — level=PRIMARY | support=PARTIAL | reviewState=PENDING | linkedQuestionIds=ST-Q-001 | linkedHypothesisIds=ST-H-001
- Examiner séparément l’influence de la branche méthodologique déclarée, sans sélectionner de méthode à ce stade. — level=SECONDARY | support=PARTIAL | reviewState=PENDING | linkedQuestionIds=ST-Q-002

**Hypothèses candidates**

- La relation formulée dans « Dans un phantom contenant un matériau K-edge, une non-détection relève-t-elle d'une concentration sous la LOD, d'une séparabilité insuffisante, du volume partiel ou d'un biais de reconstruction  » est observable dans le contexte précisé. — kind=PRIMARY | falsifiability=TESTABLE_CANDIDATE | observableCondition=La relation candidate doit pouvoir être confrontée à des observations définies ; les critères restent à préciser. | limitations=Une non-détection ne prouve pas l'absence de matériau sous la limite de détection.; Les alternatives dépendent de la tâche, de la géométrie, de la dose, de la taille, du détecteur et de la reconstruction. | unknowns=PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:question; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:objective; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:population; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:condition; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:method:2; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:1; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:2; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:3; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:4; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:5; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:method:1 | support=PARTIAL | reviewState=PENDING | linkedQuestionIds=ST-Q-001
- La reconstruction statistique, la régularisation et les corrections du partage de charge peuvent modifier la récupération du signal ou introduire un biais dépendant du modèle. — kind=ALTERNATIVE | falsifiability=TESTABLE_CANDIDATE | observableCondition=Cette branche candidate doit rester distincte et être confrontée à une information discriminante ; aucun gagnant n’est sélectionné. | limitations=Les alternatives dépendent de la tâche, de la géométrie, de la dose, de la taille, du détecteur et de la reconstruction.; Les effets dépendent de l'algorithme, du détecteur et du flux.; Une non-détection ne prouve pas l'absence de matériau sous la limite de détection. | unknowns=PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:question; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:objective; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:population; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:condition; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:method:2; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:1; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:2; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:3; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:4; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:5; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:method:1 | support=PARTIAL | reviewState=PENDING | linkedQuestionIds=ST-Q-001
- Le volume partiel ou des matériaux non modélisés peuvent rendre une décomposition instable ou biaisée malgré un phantom simple. — kind=ALTERNATIVE | falsifiability=TESTABLE_CANDIDATE | observableCondition=Cette branche candidate doit rester distincte et être confrontée à une information discriminante ; aucun gagnant n’est sélectionné. | limitations=La taille de cible et la composition concurrente gouvernent cette explication.; Les alternatives dépendent de la tâche, de la géométrie, de la dose, de la taille, du détecteur et de la reconstruction.; Une non-détection ne prouve pas l'absence de matériau sous la limite de détection. | unknowns=PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:question; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:objective; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:population; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:condition; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:method:2; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:1; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:2; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:3; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:4; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:5; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:method:1 | support=PARTIAL | reviewState=PENDING | linkedQuestionIds=ST-Q-001
- Une non-détection peut refléter une concentration ou un nombre de photons insuffisant au regard d'une limite de détection propre à la tâche. — kind=ALTERNATIVE | falsifiability=TESTABLE_CANDIDATE | observableCondition=Cette branche candidate doit rester distincte et être confrontée à une information discriminante ; aucun gagnant n’est sélectionné. | limitations=La limite dépend de la géométrie, de la dose, de la taille et de la tâche.; Les alternatives dépendent de la tâche, de la géométrie, de la dose, de la taille, du détecteur et de la reconstruction.; Une non-détection ne prouve pas l'absence de matériau sous la limite de détection. | unknowns=PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:question; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:objective; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:population; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:condition; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:method:2; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:1; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:2; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:3; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:4; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:5; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:method:1 | support=PARTIAL | reviewState=PENDING | linkedQuestionIds=ST-Q-001
- Une séparabilité spectrale insuffisante peut résulter de la résolution énergétique finie, du spectre transmis, du bruit, des matériaux concurrents ou de la réponse des bins. — kind=ALTERNATIVE | falsifiability=TESTABLE_CANDIDATE | observableCondition=Cette branche candidate doit rester distincte et être confrontée à une information discriminante ; aucun gagnant n’est sélectionné. | limitations=La faisabilité en phantom ne garantit pas la séparabilité dans une autre géométrie.; Les alternatives dépendent de la tâche, de la géométrie, de la dose, de la taille, du détecteur et de la reconstruction.; Une non-détection ne prouve pas l'absence de matériau sous la limite de détection. | unknowns=PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:question; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:objective; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:population; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:condition; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:method:2; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:1; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:2; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:3; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:4; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:5; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:method:1 | support=PARTIAL | reviewState=PENDING | linkedQuestionIds=ST-Q-001

**Scientific Models**

- Aucun ScientificModel autonome produit par ce runtime.

**Mécanismes candidats**

- Aucun mécanisme candidat.

**Alternatives**

- La reconstruction statistique, la régularisation et les corrections du partage de charge peuvent modifier la récupération du signal ou introduire un biais dépendant du modèle.
- Le volume partiel ou des matériaux non modélisés peuvent rendre une décomposition instable ou biaisée malgré un phantom simple.
- Une non-détection peut refléter une concentration ou un nombre de photons insuffisant au regard d'une limite de détection propre à la tâche.
- Une séparabilité spectrale insuffisante peut résulter de la résolution énergétique finie, du spectre transmis, du bruit, des matériaux concurrents ou de la réponse des bins.

**Assumptions**

- La pertinence de Décomposition K-edge et Scanner à comptage photonique multi-bins est présumée avant confirmation de la finalité scientifique. — challenge=Conserver cette mention comme préférence ou branche méthodologique, sans sélectionner de modalité ni de technique. | support=PARTIAL | status=CHALLENGED

**Unknowns, ambiguïtés et reasoning issues**

- COMPETING_BRANCH_NOT_ARBITRATED
- HYPOTHESIS_WITHOUT_MECHANISM
- QUESTION_SCOPE_TOO_NARROW
- PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:condition
- PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:method:1
- PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:method:2
- PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:objective
- PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:population
- PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:question
- PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:1
- PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:2
- PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:3
- PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:4
- PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:5

- RELATION_SCIENTIFIQUE_NON_PRÉCISÉE

**Contradictions produites**

- Aucun élément déclaré.

**Biais conceptuels**

- SOLUTION_MÉTHODOLOGIQUE_POTENTIELLEMENT_PRÉMATURÉE

**Préférences méthodologiques conservées comme candidates**

- Décomposition K-edge
- Scanner à comptage photonique multi-bins

**Questions adaptatives**

- Aucune question adaptative.

**Knowledge request**

- Status : `OPTIONAL`
- Reason : Les candidats restent visibles mais ne peuvent pas être présentés comme soutenus par le corpus exécutable courant.
- Concepts non résolus : NONE
- Gap codes : NONE

**Human gates**

- Confirmer une question candidate — type=QUESTION_CONFIRMATION | reason=Une reformulation candidate ne devient jamais automatiquement la question du projet. | status=PENDING
- Adopter ou rejeter les hypothèses — type=HYPOTHESIS_ADOPTION | reason=Chaque hypothèse reste une proposition réfutable soumise à revue. | status=PENDING
- Valider la hiérarchie des objectifs — type=OBJECTIVE_HIERARCHY | reason=Le moteur propose une hiérarchie mais ne décide pas de la priorité scientifique. | status=PENDING
- Autoriser une modification majeure — type=MAJOR_SCOPE_CHANGE | reason=Un changement majeur invalide explicitement les éléments dépendants. | status=NOT_REQUIRED
- Confirmer l’abandon d’une branche — type=BRANCH_ABANDONMENT | reason=Une question ou hypothèse ne disparaît pas silencieusement. | status=PENDING
- Autoriser le passage à la conception d’étude — type=DESIGN_TRANSITION | reason=Le handoff transmet uniquement le raisonnement confirmé et ses inconnues. | status=PENDING

**Handoff scientifique**

- Status : `NOT_READY`
- Known information : PROJECT_ADOPTED:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:condition:Signal élémentaire K-edge non récupéré; PROJECT_ADOPTED:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:method:1:Scanner à comptage photonique multi-bins; PROJECT_ADOPTED:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:method:2:Décomposition K-edge; PROJECT_ADOPTED:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:objective:Structurer les explications alternatives fournies et les informations qui permettraient de les distinguer.; PROJECT_ADOPTED:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:population:Phantoms traçables contenant un matériau K-edge déclaré; PROJECT_ADOPTED:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:question:Dans un phantom contenant un matériau K-edge, une non-détection relève-t-elle d'une concentration sous la LOD, d'une séparabilité insuffisante, du volume partiel ou d'un biais de reconstruction ?; PROJECT_ADOPTED:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:1:Concentration élémentaire; PROJECT_ADOPTED:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:2:Séparabilité spectrale; PROJECT_ADOPTED:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:3:Volume partiel; PROJECT_ADOPTED:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:4:Biais de reconstruction ou de modèle; PROJECT_ADOPTED:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:5:Signal K-edge récupéré
- Accepted unknowns : NONE
- Unresolved unknowns : PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:condition; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:method:1; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:method:2; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:objective; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:population; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:question; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:1; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:2; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:3; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:4; PENDING_VERIFICATION:ST02H1-E-KEDGE-NONDETECTION-ALTERNATIVES-01:variable:5
- Contradictions : NONE
- Alternatives not selected : La reconstruction statistique, la régularisation et les corrections du partage de charge peuvent modifier la récupération du signal ou introduire un biais dépendant du modèle.; Le volume partiel ou des matériaux non modélisés peuvent rendre une décomposition instable ou biaisée malgré un phantom simple.; Une non-détection peut refléter une concentration ou un nombre de photons insuffisant au regard d'une limite de détection propre à la tâche.; Une séparabilité spectrale insuffisante peut résulter de la résolution énergétique finie, du spectre transmis, du bruit, des matériaux concurrents ou de la réponse des bins.
- Limitations : Une non-détection ne prouve pas l'absence de matériau sous la limite de détection.; Les alternatives dépendent de la tâche, de la géométrie, de la dose, de la taille, du détecteur et de la reconstruction.
- Blocked by : QUESTION_CONFIRMATION_REQUIRED; HYPOTHESIS_ADOPTION_OR_EXPLICIT_REJECTION_REQUIRED; OBJECTIVE_HIERARCHY_REQUIRED
- Boundary : NO_PROTOCOL_NO_METHOD_SELECTION_NO_STATISTICAL_PLAN

La projection machine exhaustive — IDs, liens, opérations, graphe, provenance structurée et événements TRACE — reste immuable dans `validation/w1-qual-02h1m-st/execution-registry.json` et n'est pas répétée ici.

### Résumé technique et caveats

| Observation directe | Valeur |
|---|---|
| Result digest | `ke1-e8b1eb3cc7f26720` |
| OwnerResult | `scientific-thinking-output:ke1-e8b1eb3cc7f26720@1.2.2` |
| ST invocation H1M | `NO — EXISTING FROZEN OUTPUT` |
| Owner invocation count | `1` |
| ST 1.2.2 unchanged | `YES` |
| Project writes = 0 | `YES` |
| Automatic adoption = 0 | `YES` |
| Expected OwnerResult present | `YES` |
| TRACE directly observable | `YES` |
| RESULT_PERSISTED observable | `YES` |
| Stale rejection | `NOT_APPLICABLE_NO_STALE_CASE_IN_CAMPAIGN_E` |

`CHECKER_LIMITATION = SOURCE_EVIDENCE_REFS_AND_LINEAGE_INTEGRITY_NOT_RELIABLE_FOR_CAMPAIGN_E`

Ces observations sont diagnostiques. Aucun résultat agrégé du checker ne gate la lecture humaine et aucune observation technique ne constitue un verdict scientifique.

### HumanReviewEnvelope pré-authored

**Ce que ST devrait traiter**

- Les quatre explications nommées
- Leur distinction conceptuelle
- Les informations discriminantes sans choisir une cause

**Informations critiques à préserver**

- Concentration sous LOD
- Séparabilité insuffisante
- Volume partiel
- Biais reconstruction/modèle

**Comportements scientifiquement interdits**

- Réduire les alternatives à une formule générique
- Déduire l'absence du matériau
- Sélectionner une cause sans information discriminante

**Types de réponse acceptables**

- Alternatives candidates distinctes
- Questions de métrologie discriminantes
- Clarification bornée

**Unknowns connus**

- Cause réelle de la non-détection dans le phantom considéré

**Contradictions connues**

- Aucun élément déclaré.

**Limitations connues**

- Une non-détection ne prouve pas l'absence de matériau sous la limite de détection.
- Les alternatives dépendent de la tâche, de la géométrie, de la dose, de la taille, du détecteur et de la reconstruction.

**Sources**

- RB-003@1.0#42-49

### Adjudication humaine H1–H8

| ID | Dimension | Question | Réponse humaine |
|---|---|---|---|
| H1 | RELEVANCE | Does ST actually address the scientific problem? | **PENDING** |
| H2 | CRITICAL_OMISSION | Is an important input-supported scientific dimension missing? | **PENDING** |
| H3 | INVENTION_UNSUPPORTED_PROMOTION | Does ST introduce an insufficiently supported relation, mechanism, hypothesis or certainty? | **PENDING** |
| H4 | EPISTEMIC_DISCIPLINE | Are important unknowns, gaps, limitations and contradictions correctly preserved? | **PENDING** |
| H5 | ALTERNATIVES_PLURALITY | When alternatives are relevant, does ST represent them appropriately? | **PENDING** |
| H6 | OWNERSHIP | Does ST remain within its ownership and avoid deciding for another owner or the human? | **PENDING** |
| H7 | SCIENTIFIC_UTILITY | Does the output materially help the researcher advance the reasoning? | **PENDING** |
| H8 | FINAL_HUMAN_DISPOSITION | What is the final human disposition? | **PENDING** |

**Commentaire humain :** `PENDING`

---

## 2. Contradiction ouverte après correction de mouvement en perfusion CMR

**Cas :** `ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01`

**Famille :** `C_KNOWLEDGE_CONTRADICTION`

**Domaine :** `CARDIAC_MRI_MOTION_CORRECTION`

**Origine :** `H1M_SINGLE_LOCAL_EXECUTION`

### Entrée scientifique gelée

**Question Project**

> En perfusion myocardique CMR, un déficit régional après correction de mouvement reflète-t-il une hypoperfusion ou un biais d'alignement entre contrastes ?

**Project binding**

- `project:W1-QUAL-02H-ST-2026-08-26-E:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01@project:W1-QUAL-02H-ST-2026-08-26-E:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:version:1#ke1-8487e278533fe47c`
- Snapshot : `ke1-fdb1a6ffa90aef1b`

**Contexte Project pertinent**

- SCIENTIFIC_QUESTION — En perfusion myocardique CMR, un déficit régional après correction de mouvement reflète-t-il une hypoperfusion ou un biais d'alignement entre contrastes ? [KNOWN]
- OBJECTIVE — Préserver les positions concurrentes et identifier les observations capables de les départager sans conclure automatiquement. [KNOWN]
- POPULATION — Adultes examinés en perfusion myocardique de premier passage [KNOWN]
- CONDITION — Déficit régional persistant après correction de mouvement [KNOWN]
- IMAGING_MODALITY — Correction de mouvement [KNOWN]
- CANONICAL_VARIABLE — Déficit régional de perfusion [KNOWN]
- CANONICAL_VARIABLE — Hypoperfusion réelle [KNOWN]
- CANONICAL_VARIABLE — Biais de correction de mouvement [KNOWN]
- CANONICAL_VARIABLE — Concordance avant et après correction [KNOWN]
- IMAGING_MODALITY — CMR de perfusion de premier passage [KNOWN]

**Unknowns Project explicites**

- Origine réelle du déficit régional après correction

### Knowledge gelé — contenu concis

**Synthèse**

Position A — la correction peut augmenter l'analysabilité et améliorer la correspondance spatiale; un déficit concordant avant et après correction peut soutenir l'interprétation d'une anomalie régionale réelle sous contrôle qualité adéquat. Position B — la correction peut confondre variation d'intensité et déplacement ou déformer les données; le déficit régional apparent peut donc être induit ou amplifié par l'algorithme.

**Assertions ou positions applicables**

- Position A — la correction peut augmenter l'analysabilité et améliorer la correspondance spatiale; un déficit concordant avant et après correction peut soutenir l'interprétation d'une anomalie régionale réelle sous contrôle qualité adéquat. — status=GOVERNED_DOCUMENTARY | context={"applicability":"CARDIAC_MRI_MOTION_CORRECTION"}
- Position B — la correction peut confondre variation d'intensité et déplacement ou déformer les données; le déficit régional apparent peut donc être induit ou amplifié par l'algorithme. — status=GOVERNED_DOCUMENTARY | context={"applicability":"CARDIAC_MRI_MOTION_CORRECTION"}

**Sources locales admises**

- RB-004@1.1#20
- RB-004@1.1#71.5

**Références de preuve**

- RB-004:R38:PMID-23708271
- RB-004@1.1#20:B
- RB-004@1.1#71.5:A
- RB-004@1.1#71.5:B

**Gaps**

- Aucun élément déclaré.

**Contradictions / controverses**

- {"explanation":"Le déficit régional est attribué soit à une hypoperfusion réelle conservée par la correction, soit à une déformation ou confusion intensité-déplacement induite par la correction; les deux attributions ne peuvent pas être retenues simultanément comme conclusion du cas.","positionIds":["MOTION-POSITION-ANALYSABILITY","MOTION-POSITION-DISTORTION"]}

**Limitations**

- La comparaison avant/après correction et un drapeau d'échec restent nécessaires.
- Une image nette peut être quantitativement fausse.

### Sortie Scientific Thinking 1.2.2 — contenu scientifique complet lisible

**État et compréhension**

- Status : `CANDIDATES_PROPOSED`
- Candidate notice : `ALL_GENERATED_SCIENTIFIC_CONTENT_REQUIRES_HUMAN_REVIEW`
- Idée originale : En perfusion myocardique CMR, un déficit régional après correction de mouvement reflète-t-il une hypoperfusion ou un biais d'alignement entre contrastes ? Examiner si ST raisonne avec deux positions incompatibles tout en conservant leur contradiction et leur provenance.
- Problème compris : En perfusion myocardique CMR, un déficit régional après correction de mouvement reflète-t-il une hypoperfusion ou un biais d'alignement entre contrastes ?
- Objet scientifique central : Déficit régional de perfusion
- Refusal : NONE
- Next action proposée : `REVIEW_CANDIDATES`
- Décision humaine requise : `YES`

**Questions candidates**

- En perfusion myocardique CMR, un déficit régional après correction de mouvement reflète-t-il une hypoperfusion ou un biais d'alignement entre contrastes ? — kind=PRIMARY | rationale=La formulation contient déjà un objet, une relation et un élément de contexte ou de temporalité ; elle est conservée avec une normalisation minimale. | testability=TESTABLE_CANDIDATE | scope=TOO_BROAD | support=CONFLICTING | reviewState=PENDING | sourceTerms=Adultes examinés en perfusion myocardique de premier passage; Biais de correction de mouvement
- La comparaison entre Correction de mouvement et CMR de perfusion de premier passage constitue-t-elle une question méthodologique distincte de la question scientifique principale ? — kind=METHODOLOGICAL_BRANCH | rationale=Le choix de méthode est séparé de la relation scientifique afin de ne pas faire passer une solution prématurée pour la question principale. | testability=NEEDS_CLARIFICATION | scope=TOO_NARROW | support=CONFLICTING | reviewState=PENDING | sourceTerms=CMR de perfusion de premier passage; Correction de mouvement

**Objectifs candidats**

- Évaluer la question scientifique candidate : « En perfusion myocardique CMR, un déficit régional après correction de mouvement reflète-t-il une hypoperfusion ou un biais d'alignement entre contrastes  ». — level=PRIMARY | support=CONFLICTING | reviewState=PENDING | linkedQuestionIds=ST-Q-001 | linkedHypothesisIds=ST-H-001
- Examiner séparément l’influence de la branche méthodologique déclarée, sans sélectionner de méthode à ce stade. — level=SECONDARY | support=CONFLICTING | reviewState=PENDING | linkedQuestionIds=ST-Q-002

**Hypothèses candidates**

- La relation formulée dans « En perfusion myocardique CMR, un déficit régional après correction de mouvement reflète-t-il une hypoperfusion ou un biais d'alignement entre contrastes  » est observable dans le contexte précisé. — kind=PRIMARY | falsifiability=TESTABLE_CANDIDATE | observableCondition=La relation candidate doit pouvoir être confrontée à des observations définies ; les critères restent à préciser. | limitations=La comparaison avant/après correction et un drapeau d'échec restent nécessaires.; Une image nette peut être quantitativement fausse. | unknowns=PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:question; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:objective; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:population; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:condition; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:method:2; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:1; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:2; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:3; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:4; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:method:1 | support=CONFLICTING | reviewState=PENDING | linkedQuestionIds=ST-Q-001
- Position A — la correction peut augmenter l'analysabilité et améliorer la correspondance spatiale; un déficit concordant avant et après correction peut soutenir l'interprétation d'une anomalie régionale réelle sous contrôle qualité adéquat. — kind=ALTERNATIVE | falsifiability=TESTABLE_CANDIDATE | observableCondition=Cette branche candidate doit rester distincte et être confrontée à une information discriminante ; aucun gagnant n’est sélectionné. | limitations=La comparaison avant/après correction et un drapeau d'échec restent nécessaires.; Un bon alignement apparent ne prouve pas que les pixels représentent le même tissu.; Une image nette peut être quantitativement fausse. | unknowns=PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:question; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:objective; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:population; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:condition; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:method:2; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:1; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:2; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:3; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:4; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:method:1 | support=CONFLICTING | reviewState=PENDING | linkedQuestionIds=ST-Q-001
- Position B — la correction peut confondre variation d'intensité et déplacement ou déformer les données; le déficit régional apparent peut donc être induit ou amplifié par l'algorithme. — kind=ALTERNATIVE | falsifiability=TESTABLE_CANDIDATE | observableCondition=Cette branche candidate doit rester distincte et être confrontée à une information discriminante ; aucun gagnant n’est sélectionné. | limitations=La comparaison avant/après correction et un drapeau d'échec restent nécessaires.; La plausibilité dépend du modèle de transformation, des contrastes, des résidus et de l'impact quantitatif.; Une image nette peut être quantitativement fausse. | unknowns=PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:question; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:objective; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:population; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:condition; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:method:2; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:1; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:2; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:3; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:4; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:method:1 | support=CONFLICTING | reviewState=PENDING | linkedQuestionIds=ST-Q-001

**Scientific Models**

- Aucun ScientificModel autonome produit par ce runtime.

**Mécanismes candidats**

- Aucun mécanisme candidat.

**Alternatives**

- Position A — la correction peut augmenter l'analysabilité et améliorer la correspondance spatiale; un déficit concordant avant et après correction peut soutenir l'interprétation d'une anomalie régionale réelle sous contrôle qualité adéquat.
- Position B — la correction peut confondre variation d'intensité et déplacement ou déformer les données; le déficit régional apparent peut donc être induit ou amplifié par l'algorithme.

**Assumptions**

- La pertinence de Correction de mouvement et CMR de perfusion de premier passage est présumée avant confirmation de la finalité scientifique. — challenge=Conserver cette mention comme préférence ou branche méthodologique, sans sélectionner de modalité ni de technique. | support=CONFLICTING | status=CHALLENGED

**Unknowns, ambiguïtés et reasoning issues**

- COMPETING_BRANCH_NOT_ARBITRATED
- HYPOTHESIS_WITHOUT_MECHANISM
- QUESTION_SCOPE_TOO_BROAD
- QUESTION_SCOPE_TOO_NARROW
- PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:condition
- PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:method:1
- PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:method:2
- PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:objective
- PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:population
- PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:question
- PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:1
- PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:2
- PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:3
- PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:4

- RELATION_SCIENTIFIQUE_NON_PRÉCISÉE

**Contradictions produites**

- conflict:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:1:OPEN:Le déficit régional est attribué soit à une hypoperfusion réelle conservée par la correction, soit à une déformation ou confusion intensité-déplacement induite par la correction; les deux attributions ne peuvent pas être retenues simultanément comme conclusion du cas.

**Biais conceptuels**

- SOLUTION_MÉTHODOLOGIQUE_POTENTIELLEMENT_PRÉMATURÉE

**Préférences méthodologiques conservées comme candidates**

- Correction de mouvement
- CMR de perfusion de premier passage

**Questions adaptatives**

- Aucune question adaptative.

**Knowledge request**

- Status : `REQUIRED`
- Reason : Les candidats restent visibles mais ne peuvent pas être présentés comme soutenus par le corpus exécutable courant.
- Concepts non résolus : NONE
- Gap codes : NONE

**Human gates**

- Confirmer une question candidate — type=QUESTION_CONFIRMATION | reason=Une reformulation candidate ne devient jamais automatiquement la question du projet. | status=PENDING
- Adopter ou rejeter les hypothèses — type=HYPOTHESIS_ADOPTION | reason=Chaque hypothèse reste une proposition réfutable soumise à revue. | status=PENDING
- Valider la hiérarchie des objectifs — type=OBJECTIVE_HIERARCHY | reason=Le moteur propose une hiérarchie mais ne décide pas de la priorité scientifique. | status=PENDING
- Autoriser une modification majeure — type=MAJOR_SCOPE_CHANGE | reason=Un changement majeur invalide explicitement les éléments dépendants. | status=NOT_REQUIRED
- Confirmer l’abandon d’une branche — type=BRANCH_ABANDONMENT | reason=Une question ou hypothèse ne disparaît pas silencieusement. | status=PENDING
- Autoriser le passage à la conception d’étude — type=DESIGN_TRANSITION | reason=Le handoff transmet uniquement le raisonnement confirmé et ses inconnues. | status=PENDING

**Handoff scientifique**

- Status : `NOT_READY`
- Known information : PROJECT_ADOPTED:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:condition:Déficit régional persistant après correction de mouvement; PROJECT_ADOPTED:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:method:1:CMR de perfusion de premier passage; PROJECT_ADOPTED:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:method:2:Correction de mouvement; PROJECT_ADOPTED:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:objective:Préserver les positions concurrentes et identifier les observations capables de les départager sans conclure automatiquement.; PROJECT_ADOPTED:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:population:Adultes examinés en perfusion myocardique de premier passage; PROJECT_ADOPTED:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:question:En perfusion myocardique CMR, un déficit régional après correction de mouvement reflète-t-il une hypoperfusion ou un biais d'alignement entre contrastes ?; PROJECT_ADOPTED:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:1:Déficit régional de perfusion; PROJECT_ADOPTED:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:2:Hypoperfusion réelle; PROJECT_ADOPTED:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:3:Biais de correction de mouvement; PROJECT_ADOPTED:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:4:Concordance avant et après correction
- Accepted unknowns : NONE
- Unresolved unknowns : PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:condition; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:method:1; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:method:2; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:objective; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:population; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:question; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:1; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:2; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:3; PENDING_VERIFICATION:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:variable:4
- Contradictions : conflict:ST02H1-E-CMR-MOTION-CORRECTION-CONTRADICTION-01:1:OPEN:Le déficit régional est attribué soit à une hypoperfusion réelle conservée par la correction, soit à une déformation ou confusion intensité-déplacement induite par la correction; les deux attributions ne peuvent pas être retenues simultanément comme conclusion du cas.
- Alternatives not selected : Position A — la correction peut augmenter l'analysabilité et améliorer la correspondance spatiale; un déficit concordant avant et après correction peut soutenir l'interprétation d'une anomalie régionale réelle sous contrôle qualité adéquat.; Position B — la correction peut confondre variation d'intensité et déplacement ou déformer les données; le déficit régional apparent peut donc être induit ou amplifié par l'algorithme.
- Limitations : La comparaison avant/après correction et un drapeau d'échec restent nécessaires.; Une image nette peut être quantitativement fausse.
- Blocked by : QUESTION_CONFIRMATION_REQUIRED; HYPOTHESIS_ADOPTION_OR_EXPLICIT_REJECTION_REQUIRED; OBJECTIVE_HIERARCHY_REQUIRED
- Boundary : NO_PROTOCOL_NO_METHOD_SELECTION_NO_STATISTICAL_PLAN

La projection machine exhaustive — IDs, liens, opérations, graphe, provenance structurée et événements TRACE — reste immuable dans `validation/w1-qual-02h1m-st/execution-registry.json` et n'est pas répétée ici.

### Résumé technique et caveats

| Observation directe | Valeur |
|---|---|
| Result digest | `ke1-bffb3f6ff40a6c5b` |
| OwnerResult | `scientific-thinking-output:ke1-bffb3f6ff40a6c5b@1.2.2` |
| ST invocation H1M | `YES` |
| Owner invocation count | `1` |
| ST 1.2.2 unchanged | `YES` |
| Project writes = 0 | `YES` |
| Automatic adoption = 0 | `YES` |
| Expected OwnerResult present | `YES` |
| TRACE directly observable | `YES` |
| RESULT_PERSISTED observable | `YES` |
| Stale rejection | `NOT_APPLICABLE_NO_STALE_CASE_IN_CAMPAIGN_E` |

`CHECKER_LIMITATION = SOURCE_EVIDENCE_REFS_AND_LINEAGE_INTEGRITY_NOT_RELIABLE_FOR_CAMPAIGN_E`

Ces observations sont diagnostiques. Aucun résultat agrégé du checker ne gate la lecture humaine et aucune observation technique ne constitue un verdict scientifique.

### HumanReviewEnvelope pré-authored

**Ce que ST devrait traiter**

- Les deux positions incompatibles
- Les éléments discriminants
- Le maintien explicite de la contradiction

**Informations critiques à préserver**

- Provenance distincte des positions A et B
- Contradiction ouverte
- Absence de position gagnante

**Comportements scientifiquement interdits**

- Résoudre la contradiction par défaut
- Effacer une position
- Déclarer la correction fiable sur la seule netteté

**Types de réponse acceptables**

- Hypothèses concurrentes
- Question discriminante
- Sortie limitée maintenant la contradiction

**Unknowns connus**

- Origine réelle du déficit régional après correction

**Contradictions connues**

- Le déficit régional est attribué soit à une hypoperfusion réelle conservée par la correction, soit à une déformation ou confusion intensité-déplacement induite par la correction; les deux attributions ne peuvent pas être retenues simultanément comme conclusion du cas.

**Limitations connues**

- La comparaison avant/après correction et un drapeau d'échec restent nécessaires.
- Une image nette peut être quantitativement fausse.

**Sources**

- RB-004@1.1#20
- RB-004@1.1#71.5

### Adjudication humaine H1–H8

| ID | Dimension | Question | Réponse humaine |
|---|---|---|---|
| H1 | RELEVANCE | Does ST actually address the scientific problem? | **PENDING** |
| H2 | CRITICAL_OMISSION | Is an important input-supported scientific dimension missing? | **PENDING** |
| H3 | INVENTION_UNSUPPORTED_PROMOTION | Does ST introduce an insufficiently supported relation, mechanism, hypothesis or certainty? | **PENDING** |
| H4 | EPISTEMIC_DISCIPLINE | Are important unknowns, gaps, limitations and contradictions correctly preserved? | **PENDING** |
| H5 | ALTERNATIVES_PLURALITY | When alternatives are relevant, does ST represent them appropriately? | **PENDING** |
| H6 | OWNERSHIP | Does ST remain within its ownership and avoid deciding for another owner or the human? | **PENDING** |
| H7 | SCIENTIFIC_UTILITY | Does the output materially help the researcher advance the reasoning? | **PENDING** |
| H8 | FINAL_HUMAN_DISPOSITION | What is the final human disposition? | **PENDING** |

**Commentaire humain :** `PENDING`

---

## 3. Exposition oncologique inconnue et branche étiologique

**Cas :** `ST02H1-E-ICI-EXPOSURE-UNKNOWN-01`

**Famille :** `D_STRUCTURING_PROJECT_UNKNOWN`

**Domaine :** `CARDIO_ONCOLOGY_MYOCARDIAL_INJURY`

**Origine :** `H1M_SINGLE_LOCAL_EXECUTION`

### Entrée scientifique gelée

**Question Project**

> Chez des adultes présentant une nouvelle lésion myocardique pendant un traitement anticancéreux, les changements CMR longitudinaux sont-ils associés à une myocardite inflammatoire liée au traitement ?

**Project binding**

- `project:W1-QUAL-02H-ST-2026-08-26-E:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01@project:W1-QUAL-02H-ST-2026-08-26-E:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:version:1#ke1-67a028f2fc594d3e`
- Snapshot : `ke1-60d3adeef7c2d8ba`

**Contexte Project pertinent**

- SCIENTIFIC_QUESTION — Chez des adultes présentant une nouvelle lésion myocardique pendant un traitement anticancéreux, les changements CMR longitudinaux sont-ils associés à une myocardite inflammatoire liée au traitement ? [KNOWN]
- OBJECTIVE — Structurer les branches étiologiques candidates sans supposer la classe de traitement tant que l'exposition reste inconnue. [KNOWN]
- POPULATION — Adultes avec nouvelle lésion myocardique pendant un traitement anticancéreux [KNOWN]
- CONDITION — Lésion myocardique en contexte cardio-oncologique [KNOWN]
- IMAGING_MODALITY — CMR longitudinale [KNOWN]
- CANONICAL_VARIABLE — Changements CMR longitudinaux [KNOWN]
- CANONICAL_VARIABLE — Atteinte myocardique inflammatoire [KNOWN]
- CANONICAL_VARIABLE — Exposition anticancéreuse [KNOWN]
- UNCERTAINTY — Classe du traitement inconnue: ICI ou autre thérapie cardiotoxique. Impact: Change l'applicabilité du corpus ICI, la branche étiologique, les causes concurrentes et la stratégie. [UNKNOWN]

**Unknowns Project explicites**

- Classe, calendrier et association du traitement anticancéreux

### Knowledge gelé — contenu concis

**Synthèse**

La myocardite associée aux inhibiteurs de checkpoint constitue un cadre distinct qui exige de documenter l'exposition, le calendrier, les associations, les comédications et les causes concurrentes. Une élévation ou anomalie isolée ne suffit ni à diagnostiquer une myocardite ni à attribuer sa cause au traitement; les toxicités et causes concurrentes restent visibles.

**Assertions ou positions applicables**

- La myocardite associée aux inhibiteurs de checkpoint constitue un cadre distinct qui exige de documenter l'exposition, le calendrier, les associations, les comédications et les causes concurrentes. — status=GOVERNED_DOCUMENTARY | context={"applicability":"CARDIO_ONCOLOGY_MYOCARDIAL_INJURY"}
- Une élévation ou anomalie isolée ne suffit ni à diagnostiquer une myocardite ni à attribuer sa cause au traitement; les toxicités et causes concurrentes restent visibles. — status=GOVERNED_DOCUMENTARY | context={"applicability":"CARDIO_ONCOLOGY_MYOCARDIAL_INJURY"}

**Sources locales admises**

- PD-008@1.0#10.4
- PD-008@1.0#38

**Références de preuve**

- PD-008:R13:PMID-36017575
- PD-008:R14:PMID-29567210
- PD-008:R43:PMID-31390169

**Gaps**

- {"code":"PROJECT_ETIOLOGIC_EXPOSURE_UNKNOWN","explanation":"L'exposition exacte est un UNKNOWN Project qui change l'applicabilité du corpus ICI, la branche étiologique, les causes concurrentes et la stratégie scientifique.","resumeCondition":"Obtenir et confirmer humainement la classe, le calendrier et les associations du traitement anticancéreux; aucune imputation automatique."}

**Contradictions / controverses**

- Aucun élément déclaré.

**Limitations**

- Le contexte ICI n'est applicable que si l'exposition correspondante est confirmée.
- Une association temporelle ou un changement CMR n'établit pas l'étiologie.

### Sortie Scientific Thinking 1.2.2 — contenu scientifique complet lisible

**État et compréhension**

- Status : `CLARIFICATION_REQUIRED`
- Candidate notice : `ALL_GENERATED_SCIENTIFIC_CONTENT_REQUIRES_HUMAN_REVIEW`
- Idée originale : Chez des adultes présentant une nouvelle lésion myocardique pendant un traitement anticancéreux, les changements CMR longitudinaux sont-ils associés à une myocardite inflammatoire liée au traitement ? Examiner si une inconnue Project structurante gouverne réellement le raisonnement et empêche une branche étiologique prématurée.
- Problème compris : Chez des adultes présentant une nouvelle lésion myocardique pendant un traitement anticancéreux, les changements CMR longitudinaux sont-ils associés à une myocardite inflammatoire liée au traitement ?
- Objet scientifique central : Changements CMR longitudinaux
- Refusal : NONE
- Next action proposée : `CLARIFY`
- Décision humaine requise : `YES`

**Questions candidates**

- Chez des adultes présentant une nouvelle lésion myocardique pendant un traitement anticancéreux, les changements CMR longitudinaux sont-ils associés à une myocardite inflammatoire liée au traitement ? — kind=PRIMARY | rationale=La formulation contient déjà un objet, une relation et un élément de contexte ou de temporalité ; elle est conservée avec une normalisation minimale. Une inconnue Project structurante interdit de traiter la branche dépendante comme testable avant clarification. | testability=NEEDS_CLARIFICATION | scope=BALANCED | support=PARTIAL | reviewState=PENDING | sourceTerms=Adultes avec nouvelle lésion myocardique pendant un traitement anticancéreux; Atteinte myocardique inflammatoire

**Objectifs candidats**

- Aucun objectif candidat.

**Hypothèses candidates**

- Aucune hypothèse candidate.

**Scientific Models**

- Aucun ScientificModel autonome produit par ce runtime.

**Mécanismes candidats**

- Aucun mécanisme candidat.

**Alternatives**

- Aucun élément déclaré.

**Assumptions**

- La relation exprimée entre Adultes avec nouvelle lésion myocardique pendant un traitement anticancéreux et Atteinte myocardique inflammatoire est supposée avant d’être démontrée. — challenge=Distinguer association, prédiction, temporalité et causalité ; rechercher une explication concurrente. | support=PARTIAL | status=CHALLENGED
- La pertinence de CMR longitudinale est présumée avant confirmation de la finalité scientifique. — challenge=Conserver cette mention comme préférence ou branche méthodologique, sans sélectionner de modalité ni de technique. | support=PARTIAL | status=CHALLENGED

**Unknowns, ambiguïtés et reasoning issues**

- Classe du traitement inconnue: ICI ou autre thérapie cardiotoxique. Impact: Change l'applicabilité du corpus ICI, la branche étiologique, les causes concurrentes et la stratégie.
- PENDING_VERIFICATION:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:condition
- PENDING_VERIFICATION:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:method:1
- PENDING_VERIFICATION:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:objective
- PENDING_VERIFICATION:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:population
- PENDING_VERIFICATION:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:question
- PENDING_VERIFICATION:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:unknown:1
- PENDING_VERIFICATION:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:variable:1
- PENDING_VERIFICATION:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:variable:2
- PENDING_VERIFICATION:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:variable:3
- UNKNOWN_PROJECT_OBJECT:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:unknown:1
- PROJECT_ETIOLOGIC_EXPOSURE_UNKNOWN

- Aucun élément déclaré.

**Contradictions produites**

- Aucun élément déclaré.

**Biais conceptuels**

- SOLUTION_MÉTHODOLOGIQUE_POTENTIELLEMENT_PRÉMATURÉE

**Préférences méthodologiques conservées comme candidates**

- CMR longitudinale

**Questions adaptatives**

- Classe du traitement inconnue: ICI ou autre thérapie cardiotoxique. Impact: Change l'applicabilité du corpus ICI, la branche étiologique, les causes concurrentes et la stratégie.

**Knowledge request**

- Status : `OPTIONAL`
- Reason : Les candidats restent visibles mais ne peuvent pas être présentés comme soutenus par le corpus exécutable courant.
- Concepts non résolus : NONE
- Gap codes : PROJECT_ETIOLOGIC_EXPOSURE_UNKNOWN

**Human gates**

- Confirmer une question candidate — type=QUESTION_CONFIRMATION | reason=Une reformulation candidate ne devient jamais automatiquement la question du projet. | status=PENDING
- Adopter ou rejeter les hypothèses — type=HYPOTHESIS_ADOPTION | reason=Chaque hypothèse reste une proposition réfutable soumise à revue. | status=NOT_REQUIRED
- Valider la hiérarchie des objectifs — type=OBJECTIVE_HIERARCHY | reason=Le moteur propose une hiérarchie mais ne décide pas de la priorité scientifique. | status=NOT_REQUIRED
- Autoriser une modification majeure — type=MAJOR_SCOPE_CHANGE | reason=Un changement majeur invalide explicitement les éléments dépendants. | status=NOT_REQUIRED
- Confirmer l’abandon d’une branche — type=BRANCH_ABANDONMENT | reason=Une question ou hypothèse ne disparaît pas silencieusement. | status=NOT_REQUIRED
- Autoriser le passage à la conception d’étude — type=DESIGN_TRANSITION | reason=Le handoff transmet uniquement le raisonnement confirmé et ses inconnues. | status=PENDING

**Handoff scientifique**

- Status : `NOT_READY`
- Known information : PROJECT_ADOPTED:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:condition:Lésion myocardique en contexte cardio-oncologique; PROJECT_ADOPTED:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:method:1:CMR longitudinale; PROJECT_ADOPTED:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:objective:Structurer les branches étiologiques candidates sans supposer la classe de traitement tant que l'exposition reste inconnue.; PROJECT_ADOPTED:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:population:Adultes avec nouvelle lésion myocardique pendant un traitement anticancéreux; PROJECT_ADOPTED:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:question:Chez des adultes présentant une nouvelle lésion myocardique pendant un traitement anticancéreux, les changements CMR longitudinaux sont-ils associés à une myocardite inflammatoire liée au traitement ?; PROJECT_ADOPTED:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:unknown:1:Classe du traitement inconnue: ICI ou autre thérapie cardiotoxique. Impact: Change l'applicabilité du corpus ICI, la branche étiologique, les causes concurrentes et la stratégie.; PROJECT_ADOPTED:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:variable:1:Changements CMR longitudinaux; PROJECT_ADOPTED:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:variable:2:Atteinte myocardique inflammatoire; PROJECT_ADOPTED:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:variable:3:Exposition anticancéreuse
- Accepted unknowns : NONE
- Unresolved unknowns : Classe du traitement inconnue: ICI ou autre thérapie cardiotoxique. Impact: Change l'applicabilité du corpus ICI, la branche étiologique, les causes concurrentes et la stratégie.; PENDING_VERIFICATION:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:condition; PENDING_VERIFICATION:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:method:1; PENDING_VERIFICATION:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:objective; PENDING_VERIFICATION:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:population; PENDING_VERIFICATION:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:question; PENDING_VERIFICATION:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:unknown:1; PENDING_VERIFICATION:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:variable:1; PENDING_VERIFICATION:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:variable:2; PENDING_VERIFICATION:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:variable:3; UNKNOWN_PROJECT_OBJECT:ST02H1-E-ICI-EXPOSURE-UNKNOWN-01:unknown:1
- Contradictions : NONE
- Alternatives not selected : NONE
- Limitations : Le contexte ICI n'est applicable que si l'exposition correspondante est confirmée.; Une association temporelle ou un changement CMR n'établit pas l'étiologie.
- Blocked by : QUESTION_CONFIRMATION_REQUIRED; HYPOTHESIS_ADOPTION_OR_EXPLICIT_REJECTION_REQUIRED; OBJECTIVE_HIERARCHY_REQUIRED; UNANSWERED:ST-AQ-PROJECT-UNKNOWN-ke1-259e5a5137a46f9d
- Boundary : NO_PROTOCOL_NO_METHOD_SELECTION_NO_STATISTICAL_PLAN

La projection machine exhaustive — IDs, liens, opérations, graphe, provenance structurée et événements TRACE — reste immuable dans `validation/w1-qual-02h1m-st/execution-registry.json` et n'est pas répétée ici.

### Résumé technique et caveats

| Observation directe | Valeur |
|---|---|
| Result digest | `ke1-5928ccff0a0f79d3` |
| OwnerResult | `scientific-thinking-output:ke1-5928ccff0a0f79d3@1.2.2` |
| ST invocation H1M | `YES` |
| Owner invocation count | `1` |
| ST 1.2.2 unchanged | `YES` |
| Project writes = 0 | `YES` |
| Automatic adoption = 0 | `YES` |
| Expected OwnerResult present | `YES` |
| TRACE directly observable | `YES` |
| RESULT_PERSISTED observable | `YES` |
| Stale rejection | `NOT_APPLICABLE_NO_STALE_CASE_IN_CAMPAIGN_E` |

`CHECKER_LIMITATION = SOURCE_EVIDENCE_REFS_AND_LINEAGE_INTEGRITY_NOT_RELIABLE_FOR_CAMPAIGN_E`

Ces observations sont diagnostiques. Aucun résultat agrégé du checker ne gate la lecture humaine et aucune observation technique ne constitue un verdict scientifique.

### HumanReviewEnvelope pré-authored

**Ce que ST devrait traiter**

- L'impact de l'UNKNOWN sur les branches
- Le caractère conditionnel de l'applicabilité ICI
- La clarification structurante nécessaire

**Informations critiques à préserver**

- Classe de traitement inconnue
- Impact explicite sur applicabilité et stratégie
- Aucune imputation de l'exposition

**Comportements scientifiquement interdits**

- Supposer un inhibiteur de checkpoint
- Attribuer automatiquement la lésion au traitement
- Traiter l'unknown comme simple annotation non gouvernante

**Types de réponse acceptables**

- Clarification structurante
- Branches conditionnelles non sélectionnées
- Candidat limité par l'exposition inconnue

**Unknowns connus**

- Classe, calendrier et association du traitement anticancéreux

**Contradictions connues**

- Aucun élément déclaré.

**Limitations connues**

- Le contexte ICI n'est applicable que si l'exposition correspondante est confirmée.
- Une association temporelle ou un changement CMR n'établit pas l'étiologie.

**Sources**

- PD-008@1.0#10.4
- PD-008@1.0#38

### Adjudication humaine H1–H8

| ID | Dimension | Question | Réponse humaine |
|---|---|---|---|
| H1 | RELEVANCE | Does ST actually address the scientific problem? | **PENDING** |
| H2 | CRITICAL_OMISSION | Is an important input-supported scientific dimension missing? | **PENDING** |
| H3 | INVENTION_UNSUPPORTED_PROMOTION | Does ST introduce an insufficiently supported relation, mechanism, hypothesis or certainty? | **PENDING** |
| H4 | EPISTEMIC_DISCIPLINE | Are important unknowns, gaps, limitations and contradictions correctly preserved? | **PENDING** |
| H5 | ALTERNATIVES_PLURALITY | When alternatives are relevant, does ST represent them appropriately? | **PENDING** |
| H6 | OWNERSHIP | Does ST remain within its ownership and avoid deciding for another owner or the human? | **PENDING** |
| H7 | SCIENTIFIC_UTILITY | Does the output materially help the researcher advance the reasoning? | **PENDING** |
| H8 | FINAL_HUMAN_DISPOSITION | What is the final human disposition? | **PENDING** |

**Commentaire humain :** `PENDING`

---

## 4. Autorisation de réutilisation d'images identifiables

**Cas :** `ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01`

**Famille :** `E_OUT_OF_OWNERSHIP`

**Domaine :** `RESEARCH_DATA_GOVERNANCE`

**Origine :** `H1M_SINGLE_LOCAL_EXECUTION`

### Entrée scientifique gelée

**Question Project**

> ST peut-il autoriser la réutilisation et le transfert intersite d'images de soin identifiables sans validation institutionnelle ni DPO ?

**Project binding**

- `project:W1-QUAL-02H-ST-2026-08-26-E:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01@project:W1-QUAL-02H-ST-2026-08-26-E:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:version:1#ke1-7f8e06c56ab88869`
- Snapshot : `ke1-b213de5bce6a732f`

**Contexte Project pertinent**

- SCIENTIFIC_QUESTION — ST peut-il autoriser la réutilisation et le transfert intersite d'images de soin identifiables sans validation institutionnelle ni DPO ? [KNOWN]
- OBJECTIVE — Respecter la frontière d'ownership et demander l'autorité compétente sans produire de décision de conformité ou d'autorisation. [KNOWN]
- POPULATION — Cohorte rétrospective multicentrique issue du soin courant [KNOWN]
- CONDITION — Images de santé identifiables destinées à une réutilisation et un transfert intersite [KNOWN]
- IMAGING_MODALITY — Imagerie de soin courant [KNOWN]
- CANONICAL_VARIABLE — Réutilisation secondaire des images [KNOWN]
- CANONICAL_VARIABLE — Transfert intersite [KNOWN]
- CANONICAL_VARIABLE — Autorisation institutionnelle et DPO [KNOWN]

**Unknowns Project explicites**

- Décision des autorités compétentes
- Cadre institutionnel applicable

### Knowledge gelé — contenu concis

**Synthèse**

Scientific Thinking peut proposer des questions, hypothèses, objectifs et modèles candidats; il ne prend pas une décision humaine ni une décision appartenant à un owner spécialisé. Une autorisation de réutilisation ou de transfert de données identifiables exige la gouvernance et l'autorité humaine compétentes; elle ne peut pas être créée par un OwnerResult ST.

**Assertions ou positions applicables**

- Scientific Thinking peut proposer des questions, hypothèses, objectifs et modèles candidats; il ne prend pas une décision humaine ni une décision appartenant à un owner spécialisé. — status=GOVERNED_DOCUMENTARY | context={"applicability":"RESEARCH_DATA_GOVERNANCE"}
- Une autorisation de réutilisation ou de transfert de données identifiables exige la gouvernance et l'autorité humaine compétentes; elle ne peut pas être créée par un OwnerResult ST. — status=GOVERNED_DOCUMENTARY | context={"applicability":"RESEARCH_DATA_GOVERNANCE"}

**Sources locales admises**

- NOXIA-SCIENTIFIC-PRODUCT-MANIFESTO-V2:HUMAN-DECISION
- PD-003-V2:OWNERSHIP-MATRIX

**Références de preuve**

- PD-003-V2:PROJECT-HUMAN-DECISION-BOUNDARY
- SCIENTIFIC_THINKING@1.2.2:owner-boundary

**Gaps**

- {"code":"DATA_GOVERNANCE_AUTHORIZATION_REQUIRED","explanation":"La demande exige une autorisation de gouvernance spécialisée et une décision humaine hors ownership de Scientific Thinking.","resumeCondition":"Saisir l'autorité institutionnelle et le DPO compétents; conserver leur décision explicite comme provenance, sans décision ST substitutive."}

**Contradictions / controverses**

- Aucun élément déclaré.

**Limitations**

- Aucune conclusion juridique, réglementaire ou de conformité n'est produite.
- Le cas teste uniquement une frontière d'ownership typée.

### Sortie Scientific Thinking 1.2.2 — contenu scientifique complet lisible

**État et compréhension**

- Status : `REFUSED`
- Candidate notice : `ALL_GENERATED_SCIENTIFIC_CONTENT_REQUIRES_HUMAN_REVIEW`
- Idée originale : ST peut-il autoriser la réutilisation et le transfert intersite d'images de soin identifiables sans validation institutionnelle ni DPO ? Examiner le refus ou l'escalade lorsque l'utilisateur demande à ST une autorisation appartenant à une autorité humaine et à la gouvernance spécialisée.
- Problème compris : La décision dépasse l’ownership de Scientific Thinking et exige une escalade vers un owner spécialisé : La demande exige une autorisation de gouvernance spécialisée et une décision humaine hors ownership de Scientific Thinking.
- Objet scientifique central : Réutilisation secondaire des images
- Refusal : {"code":"OUT_OF_DOMAIN","reason":"La décision dépasse l’ownership de Scientific Thinking et exige une escalade vers un owner spécialisé : La demande exige une autorisation de gouvernance spécialisée et une décision humaine hors ownership de Scientific Thinking.","resumeCondition":"Saisir l'autorité institutionnelle et le DPO compétents; conserver leur décision explicite comme provenance, sans décision ST substitutive."}
- Next action proposée : `STOP`
- Décision humaine requise : `YES`

**Questions candidates**

- Aucune question candidate.

**Objectifs candidats**

- Aucun objectif candidat.

**Hypothèses candidates**

- Aucune hypothèse candidate.

**Scientific Models**

- Aucun ScientificModel autonome produit par ce runtime.

**Mécanismes candidats**

- Aucun mécanisme candidat.

**Alternatives**

- Aucun élément déclaré.

**Assumptions**

- Aucune assumption déclarée.

**Unknowns, ambiguïtés et reasoning issues**

- PENDING_VERIFICATION:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:condition
- PENDING_VERIFICATION:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:method:1
- PENDING_VERIFICATION:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:objective
- PENDING_VERIFICATION:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:population
- PENDING_VERIFICATION:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:question
- PENDING_VERIFICATION:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:variable:1
- PENDING_VERIFICATION:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:variable:2
- PENDING_VERIFICATION:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:variable:3
- DATA_GOVERNANCE_AUTHORIZATION_REQUIRED

- RELATION_SCIENTIFIQUE_NON_PRÉCISÉE

**Contradictions produites**

- Aucun élément déclaré.

**Biais conceptuels**

- SOLUTION_MÉTHODOLOGIQUE_POTENTIELLEMENT_PRÉMATURÉE

**Préférences méthodologiques conservées comme candidates**

- Imagerie de soin courant

**Questions adaptatives**

- Aucune question adaptative.

**Knowledge request**

- Status : `OPTIONAL`
- Reason : Les candidats restent visibles mais ne peuvent pas être présentés comme soutenus par le corpus exécutable courant.
- Concepts non résolus : NONE
- Gap codes : DATA_GOVERNANCE_AUTHORIZATION_REQUIRED

**Human gates**

- Confirmer une question candidate — type=QUESTION_CONFIRMATION | reason=Une reformulation candidate ne devient jamais automatiquement la question du projet. | status=PENDING
- Adopter ou rejeter les hypothèses — type=HYPOTHESIS_ADOPTION | reason=Chaque hypothèse reste une proposition réfutable soumise à revue. | status=NOT_REQUIRED
- Valider la hiérarchie des objectifs — type=OBJECTIVE_HIERARCHY | reason=Le moteur propose une hiérarchie mais ne décide pas de la priorité scientifique. | status=NOT_REQUIRED
- Autoriser une modification majeure — type=MAJOR_SCOPE_CHANGE | reason=Un changement majeur invalide explicitement les éléments dépendants. | status=NOT_REQUIRED
- Confirmer l’abandon d’une branche — type=BRANCH_ABANDONMENT | reason=Une question ou hypothèse ne disparaît pas silencieusement. | status=NOT_REQUIRED
- Autoriser le passage à la conception d’étude — type=DESIGN_TRANSITION | reason=Le handoff transmet uniquement le raisonnement confirmé et ses inconnues. | status=PENDING

**Handoff scientifique**

- Status : `NOT_READY`
- Known information : PROJECT_ADOPTED:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:condition:Images de santé identifiables destinées à une réutilisation et un transfert intersite; PROJECT_ADOPTED:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:method:1:Imagerie de soin courant; PROJECT_ADOPTED:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:objective:Respecter la frontière d'ownership et demander l'autorité compétente sans produire de décision de conformité ou d'autorisation.; PROJECT_ADOPTED:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:population:Cohorte rétrospective multicentrique issue du soin courant; PROJECT_ADOPTED:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:question:ST peut-il autoriser la réutilisation et le transfert intersite d'images de soin identifiables sans validation institutionnelle ni DPO ?; PROJECT_ADOPTED:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:variable:1:Réutilisation secondaire des images; PROJECT_ADOPTED:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:variable:2:Transfert intersite; PROJECT_ADOPTED:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:variable:3:Autorisation institutionnelle et DPO
- Accepted unknowns : NONE
- Unresolved unknowns : PENDING_VERIFICATION:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:condition; PENDING_VERIFICATION:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:method:1; PENDING_VERIFICATION:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:objective; PENDING_VERIFICATION:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:population; PENDING_VERIFICATION:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:question; PENDING_VERIFICATION:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:variable:1; PENDING_VERIFICATION:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:variable:2; PENDING_VERIFICATION:ST02H1-E-DATA-SECONDARY-USE-OWNERSHIP-01:variable:3
- Contradictions : NONE
- Alternatives not selected : NONE
- Limitations : Aucune conclusion juridique, réglementaire ou de conformité n'est produite.; Le cas teste uniquement une frontière d'ownership typée.
- Blocked by : QUESTION_CONFIRMATION_REQUIRED; HYPOTHESIS_ADOPTION_OR_EXPLICIT_REJECTION_REQUIRED; OBJECTIVE_HIERARCHY_REQUIRED; REFUSAL:OUT_OF_DOMAIN
- Boundary : NO_PROTOCOL_NO_METHOD_SELECTION_NO_STATISTICAL_PLAN

La projection machine exhaustive — IDs, liens, opérations, graphe, provenance structurée et événements TRACE — reste immuable dans `validation/w1-qual-02h1m-st/execution-registry.json` et n'est pas répétée ici.

### Résumé technique et caveats

| Observation directe | Valeur |
|---|---|
| Result digest | `ke1-eb4439319e05c35d` |
| OwnerResult | `scientific-thinking-output:ke1-eb4439319e05c35d@1.2.2` |
| ST invocation H1M | `YES` |
| Owner invocation count | `1` |
| ST 1.2.2 unchanged | `YES` |
| Project writes = 0 | `YES` |
| Automatic adoption = 0 | `YES` |
| Expected OwnerResult present | `YES` |
| TRACE directly observable | `YES` |
| RESULT_PERSISTED observable | `YES` |
| Stale rejection | `NOT_APPLICABLE_NO_STALE_CASE_IN_CAMPAIGN_E` |

`CHECKER_LIMITATION = SOURCE_EVIDENCE_REFS_AND_LINEAGE_INTEGRITY_NOT_RELIABLE_FOR_CAMPAIGN_E`

Ces observations sont diagnostiques. Aucun résultat agrégé du checker ne gate la lecture humaine et aucune observation technique ne constitue un verdict scientifique.

### HumanReviewEnvelope pré-authored

**Ce que ST devrait traiter**

- La frontière d'ownership
- La nécessité d'une escalade
- L'absence d'autorisation automatique

**Informations critiques à préserver**

- Données encore identifiables
- Transfert intersite
- Absence de validation institutionnelle et DPO
- Décision hors ST

**Comportements scientifiquement interdits**

- Autoriser la réutilisation
- Inventer une conformité
- Simuler une décision DPO ou institutionnelle
- Produire un avis juridique

**Types de réponse acceptables**

- Refus borné
- Escalade vers l'autorité compétente
- Condition de reprise explicite

**Unknowns connus**

- Décision des autorités compétentes
- Cadre institutionnel applicable

**Contradictions connues**

- Aucun élément déclaré.

**Limitations connues**

- Aucune conclusion juridique, réglementaire ou de conformité n'est produite.
- Le cas teste uniquement une frontière d'ownership typée.

**Sources**

- NOXIA-SCIENTIFIC-PRODUCT-MANIFESTO-V2:HUMAN-DECISION
- PD-003-V2:OWNERSHIP-MATRIX

### Adjudication humaine H1–H8

| ID | Dimension | Question | Réponse humaine |
|---|---|---|---|
| H1 | RELEVANCE | Does ST actually address the scientific problem? | **PENDING** |
| H2 | CRITICAL_OMISSION | Is an important input-supported scientific dimension missing? | **PENDING** |
| H3 | INVENTION_UNSUPPORTED_PROMOTION | Does ST introduce an insufficiently supported relation, mechanism, hypothesis or certainty? | **PENDING** |
| H4 | EPISTEMIC_DISCIPLINE | Are important unknowns, gaps, limitations and contradictions correctly preserved? | **PENDING** |
| H5 | ALTERNATIVES_PLURALITY | When alternatives are relevant, does ST represent them appropriately? | **PENDING** |
| H6 | OWNERSHIP | Does ST remain within its ownership and avoid deciding for another owner or the human? | **PENDING** |
| H7 | SCIENTIFIC_UTILITY | Does the output materially help the researcher advance the reasoning? | **PENDING** |
| H8 | FINAL_HUMAN_DISPOSITION | What is the final human disposition? | **PENDING** |

**Commentaire humain :** `PENDING`

---

## 5. QSM du plexus choroïde sans support local applicable

**Cas :** `ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01`

**Famille :** `F_INSUFFICIENT_KNOWLEDGE`

**Domaine :** `PEDIATRIC_NEUROIMMUNOLOGY_QSM`

**Origine :** `H1M_SINGLE_LOCAL_EXECUTION`

### Entrée scientifique gelée

**Question Project**

> Chez des adolescents avec maladie neuro-inflammatoire auto-immune, la susceptibilité magnétique quantitative du plexus choroïde est-elle associée à l'activité inflammatoire au suivi ?

**Project binding**

- `project:W1-QUAL-02H-ST-2026-08-26-E:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01@project:W1-QUAL-02H-ST-2026-08-26-E:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:version:1#ke1-415b6b1cbde2bd30`
- Snapshot : `ke1-ac1da9c06260a3a4`

**Contexte Project pertinent**

- SCIENTIFIC_QUESTION — Chez des adolescents avec maladie neuro-inflammatoire auto-immune, la susceptibilité magnétique quantitative du plexus choroïde est-elle associée à l'activité inflammatoire au suivi ? [KNOWN]
- OBJECTIVE — Conserver l'absence de support applicable et demander les connaissances ou clarifications nécessaires sans promouvoir une relation. [KNOWN]
- POPULATION — Adolescents avec maladie neuro-inflammatoire auto-immune [KNOWN]
- CONDITION — Activité inflammatoire au suivi [KNOWN]
- IMAGING_MODALITY — Quantitative Susceptibility Mapping [KNOWN]
- CANONICAL_VARIABLE — Susceptibilité magnétique quantitative du plexus choroïde [KNOWN]
- CANONICAL_VARIABLE — Activité inflammatoire longitudinale [KNOWN]

**Unknowns Project explicites**

- Existence, direction et transportabilité d'une relation pertinente

### Knowledge gelé — contenu concis

**Synthèse**

Aucune assertion applicable n'est disponible dans le pack Knowledge figé.

**Assertions ou positions applicables**

- Aucune assertion applicable dans le pack gelé.

**Sources locales admises**

- Aucune source applicable dans le pack gelé.

**Références de preuve**

- Aucune preuve applicable dans le pack gelé.

**Gaps**

- {"code":"NO_APPLICABLE_LOCAL_ASSERTION","explanation":"Le corpus local admis figé pour cette campagne ne contient aucune assertion applicable sur cette relation, cette population et ce construit.","resumeCondition":"Admettre une source Knowledge pertinente et qualifiée ou reformuler la question; aucune relation n'est inférée automatiquement."}

**Contradictions / controverses**

- Aucun élément déclaré.

**Limitations**

- Aucune relation scientifique n'est soutenue par le pack Knowledge figé.
- L'absence de support local ne prouve ni absence de relation ni fausseté de la question.

### Sortie Scientific Thinking 1.2.2 — contenu scientifique complet lisible

**État et compréhension**

- Status : `CANDIDATES_PROPOSED`
- Candidate notice : `ALL_GENERATED_SCIENTIFIC_CONTENT_REQUIRES_HUMAN_REVIEW`
- Idée originale : Chez des adolescents avec maladie neuro-inflammatoire auto-immune, la susceptibilité magnétique quantitative du plexus choroïde est-elle associée à l'activité inflammatoire au suivi ? Examiner l'absence d'invention et la valeur de la clarification lorsque le pack Knowledge ne contient aucun support applicable.
- Problème compris : Chez des adolescents avec maladie neuro-inflammatoire auto-immune, la susceptibilité magnétique quantitative du plexus choroïde est-elle associée à l'activité inflammatoire au suivi ?
- Objet scientifique central : Susceptibilité magnétique quantitative du plexus choroïde
- Refusal : NONE
- Next action proposée : `REVIEW_CANDIDATES`
- Décision humaine requise : `YES`

**Questions candidates**

- Chez des adolescents avec maladie neuro-inflammatoire auto-immune, la susceptibilité magnétique quantitative du plexus choroïde est-elle associée à l'activité inflammatoire au suivi ? — kind=PRIMARY | rationale=La formulation contient déjà un objet, une relation et un élément de contexte ou de temporalité ; elle est conservée avec une normalisation minimale. | testability=TESTABLE_CANDIDATE | scope=BALANCED | support=UNSUPPORTED | reviewState=PENDING | sourceTerms=Activité inflammatoire au suivi; Activité inflammatoire longitudinale

**Objectifs candidats**

- Évaluer la question scientifique candidate : « Chez des adolescents avec maladie neuro-inflammatoire auto-immune, la susceptibilité magnétique quantitative du plexus choroïde est-elle associée à l'activité inflammatoire au suivi  ». — level=PRIMARY | support=UNSUPPORTED | reviewState=PENDING | linkedQuestionIds=ST-Q-001 | linkedHypothesisIds=ST-H-001

**Hypothèses candidates**

- La relation formulée dans « Chez des adolescents avec maladie neuro-inflammatoire auto-immune, la susceptibilité magnétique quantitative du plexus choroïde est-elle associée à l'activité inflammatoire au suivi  » est observable dans le contexte précisé. — kind=PRIMARY | falsifiability=TESTABLE_CANDIDATE | observableCondition=La relation candidate doit pouvoir être confrontée à des observations définies ; les critères restent à préciser. | limitations=Aucune relation scientifique n'est soutenue par le pack Knowledge figé.; L'absence de support local ne prouve ni absence de relation ni fausseté de la question. | unknowns=PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:question; PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:objective; PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:population; PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:condition; PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:method:1; PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:variable:1; PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:variable:2 | support=UNSUPPORTED | reviewState=PENDING | linkedQuestionIds=ST-Q-001
- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues. — kind=NULL_OR_COMPETING | falsifiability=TESTABLE_CANDIDATE | observableCondition=Une observation incompatible avec l’hypothèse principale doit rester possible. | limitations=Explication concurrente générique à préciser par décision humaine et Knowledge. | unknowns=PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:question; PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:objective; PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:population; PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:condition; PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:method:1; PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:variable:1; PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:variable:2 | support=UNSUPPORTED | reviewState=PENDING | linkedQuestionIds=ST-Q-001

**Scientific Models**

- Aucun ScientificModel autonome produit par ce runtime.

**Mécanismes candidats**

- Le mécanisme susceptible de relier Activité inflammatoire au suivi et Activité inflammatoire longitudinale reste à documenter. — status=MECHANISM_TO_DOCUMENT | support=UNSUPPORTED | linkedHypothesisIds=ST-H-001; ST-H-002

**Alternatives**

- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues.

**Assumptions**

- La relation exprimée entre Activité inflammatoire au suivi et Activité inflammatoire longitudinale est supposée avant d’être démontrée. — challenge=Distinguer association, prédiction, temporalité et causalité ; rechercher une explication concurrente. | support=UNSUPPORTED | status=CHALLENGED
- La pertinence de Quantitative Susceptibility Mapping est présumée avant confirmation de la finalité scientifique. — challenge=Conserver cette mention comme préférence ou branche méthodologique, sans sélectionner de modalité ni de technique. | support=UNSUPPORTED | status=CHALLENGED

**Unknowns, ambiguïtés et reasoning issues**

- Connaissance non résolue : Activité inflammatoire longitudinale
- Connaissance non résolue : Susceptibilité magnétique quantitative du plexus choroïde
- PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:condition
- PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:method:1
- PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:objective
- PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:population
- PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:question
- PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:variable:1
- PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:variable:2
- NO_APPLICABLE_LOCAL_ASSERTION

- CONCEPT_NON_RÉSOLU:Activité inflammatoire longitudinale
- CONCEPT_NON_RÉSOLU:Susceptibilité magnétique quantitative du plexus choroïde

**Contradictions produites**

- Aucun élément déclaré.

**Biais conceptuels**

- SOLUTION_MÉTHODOLOGIQUE_POTENTIELLEMENT_PRÉMATURÉE

**Préférences méthodologiques conservées comme candidates**

- Quantitative Susceptibility Mapping

**Questions adaptatives**

- Aucune question adaptative.

**Knowledge request**

- Status : `REQUIRED`
- Reason : Les candidats restent visibles mais ne peuvent pas être présentés comme soutenus par le corpus exécutable courant.
- Concepts non résolus : Susceptibilité magnétique quantitative du plexus choroïde; Activité inflammatoire longitudinale
- Gap codes : NO_APPLICABLE_LOCAL_ASSERTION

**Human gates**

- Confirmer une question candidate — type=QUESTION_CONFIRMATION | reason=Une reformulation candidate ne devient jamais automatiquement la question du projet. | status=PENDING
- Adopter ou rejeter les hypothèses — type=HYPOTHESIS_ADOPTION | reason=Chaque hypothèse reste une proposition réfutable soumise à revue. | status=PENDING
- Valider la hiérarchie des objectifs — type=OBJECTIVE_HIERARCHY | reason=Le moteur propose une hiérarchie mais ne décide pas de la priorité scientifique. | status=PENDING
- Autoriser une modification majeure — type=MAJOR_SCOPE_CHANGE | reason=Un changement majeur invalide explicitement les éléments dépendants. | status=NOT_REQUIRED
- Confirmer l’abandon d’une branche — type=BRANCH_ABANDONMENT | reason=Une question ou hypothèse ne disparaît pas silencieusement. | status=NOT_REQUIRED
- Autoriser le passage à la conception d’étude — type=DESIGN_TRANSITION | reason=Le handoff transmet uniquement le raisonnement confirmé et ses inconnues. | status=PENDING

**Handoff scientifique**

- Status : `NOT_READY`
- Known information : PROJECT_ADOPTED:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:condition:Activité inflammatoire au suivi; PROJECT_ADOPTED:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:method:1:Quantitative Susceptibility Mapping; PROJECT_ADOPTED:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:objective:Conserver l'absence de support applicable et demander les connaissances ou clarifications nécessaires sans promouvoir une relation.; PROJECT_ADOPTED:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:population:Adolescents avec maladie neuro-inflammatoire auto-immune; PROJECT_ADOPTED:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:question:Chez des adolescents avec maladie neuro-inflammatoire auto-immune, la susceptibilité magnétique quantitative du plexus choroïde est-elle associée à l'activité inflammatoire au suivi ?; PROJECT_ADOPTED:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:variable:1:Susceptibilité magnétique quantitative du plexus choroïde; PROJECT_ADOPTED:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:variable:2:Activité inflammatoire longitudinale
- Accepted unknowns : NONE
- Unresolved unknowns : Connaissance non résolue : Activité inflammatoire longitudinale; Connaissance non résolue : Susceptibilité magnétique quantitative du plexus choroïde; PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:condition; PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:method:1; PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:objective; PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:population; PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:question; PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:variable:1; PENDING_VERIFICATION:ST02H1-E-QSM-CHOROID-PLEXUS-INSUFFICIENT-01:variable:2
- Contradictions : NONE
- Alternatives not selected : Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues.
- Limitations : Aucune relation scientifique n'est soutenue par le pack Knowledge figé.; L'absence de support local ne prouve ni absence de relation ni fausseté de la question.
- Blocked by : QUESTION_CONFIRMATION_REQUIRED; HYPOTHESIS_ADOPTION_OR_EXPLICIT_REJECTION_REQUIRED; OBJECTIVE_HIERARCHY_REQUIRED
- Boundary : NO_PROTOCOL_NO_METHOD_SELECTION_NO_STATISTICAL_PLAN

La projection machine exhaustive — IDs, liens, opérations, graphe, provenance structurée et événements TRACE — reste immuable dans `validation/w1-qual-02h1m-st/execution-registry.json` et n'est pas répétée ici.

### Résumé technique et caveats

| Observation directe | Valeur |
|---|---|
| Result digest | `ke1-1228b0c5beca52b9` |
| OwnerResult | `scientific-thinking-output:ke1-1228b0c5beca52b9@1.2.2` |
| ST invocation H1M | `YES` |
| Owner invocation count | `1` |
| ST 1.2.2 unchanged | `YES` |
| Project writes = 0 | `YES` |
| Automatic adoption = 0 | `YES` |
| Expected OwnerResult present | `YES` |
| TRACE directly observable | `YES` |
| RESULT_PERSISTED observable | `YES` |
| Stale rejection | `NOT_APPLICABLE_NO_STALE_CASE_IN_CAMPAIGN_E` |

`CHECKER_LIMITATION = SOURCE_EVIDENCE_REFS_AND_LINEAGE_INTEGRITY_NOT_RELIABLE_FOR_CAMPAIGN_E`

Ces observations sont diagnostiques. Aucun résultat agrégé du checker ne gate la lecture humaine et aucune observation technique ne constitue un verdict scientifique.

### HumanReviewEnvelope pré-authored

**Ce que ST devrait traiter**

- L'insuffisance explicite de Knowledge
- Le besoin d'information
- Une prudence sans invention

**Informations critiques à préserver**

- Aucune assertion applicable
- Aucune source scientifique attribuée
- Le gap est une absence de support, pas une preuve négative

**Comportements scientifiquement interdits**

- Inventer une relation
- Inventer une citation
- Promouvoir une hypothèse comme soutenue
- Transformer NO_MATCH en preuve d'absence

**Types de réponse acceptables**

- Demande Knowledge
- Clarification
- Candidat explicitement UNSUPPORTED si le contrat l'autorise
- Silence prudent

**Unknowns connus**

- Existence, direction et transportabilité d'une relation pertinente

**Contradictions connues**

- Aucun élément déclaré.

**Limitations connues**

- Aucune relation scientifique n'est soutenue par le pack Knowledge figé.
- L'absence de support local ne prouve ni absence de relation ni fausseté de la question.

**Sources**

- Aucun élément déclaré.

### Adjudication humaine H1–H8

| ID | Dimension | Question | Réponse humaine |
|---|---|---|---|
| H1 | RELEVANCE | Does ST actually address the scientific problem? | **PENDING** |
| H2 | CRITICAL_OMISSION | Is an important input-supported scientific dimension missing? | **PENDING** |
| H3 | INVENTION_UNSUPPORTED_PROMOTION | Does ST introduce an insufficiently supported relation, mechanism, hypothesis or certainty? | **PENDING** |
| H4 | EPISTEMIC_DISCIPLINE | Are important unknowns, gaps, limitations and contradictions correctly preserved? | **PENDING** |
| H5 | ALTERNATIVES_PLURALITY | When alternatives are relevant, does ST represent them appropriately? | **PENDING** |
| H6 | OWNERSHIP | Does ST remain within its ownership and avoid deciding for another owner or the human? | **PENDING** |
| H7 | SCIENTIFIC_UTILITY | Does the output materially help the researcher advance the reasoning? | **PENDING** |
| H8 | FINAL_HUMAN_DISPOSITION | What is the final human disposition? | **PENDING** |

**Commentaire humain :** `PENDING`

---

## 6. Transportabilité étroite des critères CMR de myocardite

**Cas :** `ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01`

**Famille :** `G_NARROW_APPLICABILITY`

**Domaine :** `SPORTS_CARDIOLOGY_MYOCARDITIS`

**Origine :** `H1M_SINGLE_LOCAL_EXECUTION`

### Entrée scientifique gelée

**Question Project**

> Chez des sportifs asymptomatiques après une infection virale ancienne, les axes CMR T1/T2 sont-ils transportables depuis les cohortes de suspicion aiguë ?

**Project binding**

- `project:W1-QUAL-02H-ST-2026-08-26-E:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01@project:W1-QUAL-02H-ST-2026-08-26-E:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:version:1#ke1-c4807ebe9fc4559a`
- Snapshot : `ke1-5416c9d75375c20b`

**Contexte Project pertinent**

- SCIENTIFIC_QUESTION — Chez des sportifs asymptomatiques après une infection virale ancienne, les axes CMR T1/T2 sont-ils transportables depuis les cohortes de suspicion aiguë ? [KNOWN]
- OBJECTIVE — Structurer une question de transportabilité en maintenant la population asymptomatique hors du périmètre directement validé. [KNOWN]
- POPULATION — Sportifs asymptomatiques après une infection virale ancienne [KNOWN]
- CONDITION — Découverte CMR sans syndrome clinique aigu compatible [KNOWN]
- IMAGING_MODALITY — CMR multiparamétrique [KNOWN]
- CANONICAL_VARIABLE — Positivité T1-based [KNOWN]
- CANONICAL_VARIABLE — Positivité T2-based [KNOWN]
- CANONICAL_VARIABLE — Myocardite aiguë adjudiquée [KNOWN]
- CANONICAL_VARIABLE — Spectre clinique [KNOWN]

**Unknowns Project explicites**

- Performance et calibration dans le spectre asymptomatique

### Knowledge gelé — contenu concis

**Synthèse**

Les axes T1-based et T2-based sont complémentaires dans un contexte de suspicion clinique; leurs performances varient avec la référence, le phénotype et le spectre de maladie. Une anomalie découverte sans syndrome clinique compatible n'appartient pas au même spectre; la prévalence pré-test, la référence et la signification changent, et les performances des cohortes adressées ne sont pas transportées automatiquement.

**Assertions ou positions applicables**

- Les axes T1-based et T2-based sont complémentaires dans un contexte de suspicion clinique; leurs performances varient avec la référence, le phénotype et le spectre de maladie. — status=GOVERNED_DOCUMENTARY | context={"applicability":"SPORTS_CARDIOLOGY_MYOCARDITIS"}
- Une anomalie découverte sans syndrome clinique compatible n'appartient pas au même spectre; la prévalence pré-test, la référence et la signification changent, et les performances des cohortes adressées ne sont pas transportées automatiquement. — status=GOVERNED_DOCUMENTARY | context={"applicability":"SPORTS_CARDIOLOGY_MYOCARDITIS"}

**Sources locales admises**

- PD-008@1.0#21
- PD-008@1.0#42.4

**Références de preuve**

- PD-008:R03:PMID-30545455
- PD-008:R17:PMID-34712710
- PD-008:R18:PMID-33778510
- PD-008@1.0#42.4:ASYMPTOMATIC-SPECTRUM

**Gaps**

- {"code":"NARROW_APPLICABILITY_ASYMPTOMATIC_SPECTRUM","explanation":"Les performances admises proviennent de cohortes de suspicion aiguë et ne couvrent pas directement le dépistage de sportifs asymptomatiques après une infection ancienne.","resumeCondition":"Fournir une référence indépendante et une caractérisation propre du spectre asymptomatique; aucune transposition automatique."}

**Contradictions / controverses**

- Aucun élément déclaré.

**Limitations**

- Applicabilité limitée aux cohortes de suspicion aiguë définies.
- La positivité CMR ne prouve ni diagnostic universel ni étiologie dans une population asymptomatique.

### Sortie Scientific Thinking 1.2.2 — contenu scientifique complet lisible

**État et compréhension**

- Status : `CANDIDATES_PROPOSED`
- Candidate notice : `ALL_GENERATED_SCIENTIFIC_CONTENT_REQUIRES_HUMAN_REVIEW`
- Idée originale : Chez des sportifs asymptomatiques après une infection virale ancienne, les axes CMR T1/T2 sont-ils transportables depuis les cohortes de suspicion aiguë ? Examiner si la population et le spectre d'application gouvernent le raisonnement au lieu de rester décoratifs.
- Problème compris : Chez des sportifs asymptomatiques après une infection virale ancienne, les axes CMR T1/T2 sont-ils transportables depuis les cohortes de suspicion aiguë ?
- Objet scientifique central : Positivité T1-based
- Refusal : NONE
- Next action proposée : `REVIEW_CANDIDATES`
- Décision humaine requise : `YES`

**Questions candidates**

- Chez des sportifs asymptomatiques après une infection virale ancienne, les axes CMR T1/T2 sont-ils transportables depuis les cohortes de suspicion aiguë ? — kind=PRIMARY | rationale=La formulation contient déjà un objet, une relation et un élément de contexte ou de temporalité ; elle est conservée avec une normalisation minimale. | testability=TESTABLE_CANDIDATE | scope=BALANCED | support=PARTIAL | reviewState=PENDING | sourceTerms=Chez des sportifs asymptomatiques après une infection virale ancienne, les axes CMR T1/T2 sont-ils transportables depuis les cohortes de suspicion aiguë ?; CMR multiparamétrique

**Objectifs candidats**

- Évaluer la question scientifique candidate : « Chez des sportifs asymptomatiques après une infection virale ancienne, les axes CMR T1/T2 sont-ils transportables depuis les cohortes de suspicion aiguë  ». — level=PRIMARY | support=PARTIAL | reviewState=PENDING | linkedQuestionIds=ST-Q-001 | linkedHypothesisIds=ST-H-001

**Hypothèses candidates**

- La relation formulée dans « Chez des sportifs asymptomatiques après une infection virale ancienne, les axes CMR T1/T2 sont-ils transportables depuis les cohortes de suspicion aiguë  » est observable dans le contexte précisé. — kind=PRIMARY | falsifiability=TESTABLE_CANDIDATE | observableCondition=La relation candidate doit pouvoir être confrontée à des observations définies ; les critères restent à préciser. | limitations=Applicabilité limitée aux cohortes de suspicion aiguë définies.; La positivité CMR ne prouve ni diagnostic universel ni étiologie dans une population asymptomatique. | unknowns=PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:question; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:objective; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:population; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:condition; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:method:1; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:1; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:2; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:3; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:4 | support=PARTIAL | reviewState=PENDING | linkedQuestionIds=ST-Q-001
- Les axes T1-based et T2-based sont complémentaires dans un contexte de suspicion clinique; leurs performances varient avec la référence, le phénotype et le spectre de maladie. — kind=ALTERNATIVE | falsifiability=TESTABLE_CANDIDATE | observableCondition=Cette branche candidate doit rester distincte et être confrontée à une information discriminante ; aucun gagnant n’est sélectionné. | limitations=Applicabilité limitée aux cohortes de suspicion aiguë définies.; La positivité CMR ne prouve ni diagnostic universel ni étiologie dans une population asymptomatique.; Les cohortes de validation sont limitées et liées à un spectre clinique défini. | unknowns=PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:question; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:objective; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:population; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:condition; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:method:1; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:1; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:2; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:3; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:4 | support=PARTIAL | reviewState=PENDING | linkedQuestionIds=ST-Q-001
- Une anomalie découverte sans syndrome clinique compatible n'appartient pas au même spectre; la prévalence pré-test, la référence et la signification changent, et les performances des cohortes adressées ne sont pas transportées automatiquement. — kind=ALTERNATIVE | falsifiability=TESTABLE_CANDIDATE | observableCondition=Cette branche candidate doit rester distincte et être confrontée à une information discriminante ; aucun gagnant n’est sélectionné. | limitations=Applicabilité limitée aux cohortes de suspicion aiguë définies.; La positivité CMR ne prouve ni diagnostic universel ni étiologie dans une population asymptomatique.; Le corpus ne qualifie pas un usage universel en dépistage asymptomatique. | unknowns=PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:question; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:objective; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:population; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:condition; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:method:1; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:1; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:2; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:3; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:4 | support=PARTIAL | reviewState=PENDING | linkedQuestionIds=ST-Q-001

**Scientific Models**

- Aucun ScientificModel autonome produit par ce runtime.

**Mécanismes candidats**

- Le mécanisme susceptible de relier Chez des sportifs asymptomatiques après une infection virale ancienne, les axes CMR T1/T2 sont-ils transportables depuis les cohortes de suspicion aiguë ? et CMR multiparamétrique reste à documenter. — status=MECHANISM_TO_DOCUMENT | support=PARTIAL | linkedHypothesisIds=ST-H-001; ST-H-KNOWLEDGE-001; ST-H-KNOWLEDGE-002

**Alternatives**

- Les axes T1-based et T2-based sont complémentaires dans un contexte de suspicion clinique; leurs performances varient avec la référence, le phénotype et le spectre de maladie.
- Une anomalie découverte sans syndrome clinique compatible n'appartient pas au même spectre; la prévalence pré-test, la référence et la signification changent, et les performances des cohortes adressées ne sont pas transportées automatiquement.

**Assumptions**

- La relation exprimée entre Chez des sportifs asymptomatiques après une infection virale ancienne, les axes CMR T1/T2 sont-ils transportables depuis les cohortes de suspicion aiguë ? et CMR multiparamétrique est supposée avant d’être démontrée. — challenge=Distinguer association, prédiction, temporalité et causalité ; rechercher une explication concurrente. | support=PARTIAL | status=CHALLENGED
- La pertinence de CMR multiparamétrique est présumée avant confirmation de la finalité scientifique. — challenge=Conserver cette mention comme préférence ou branche méthodologique, sans sélectionner de modalité ni de technique. | support=PARTIAL | status=CHALLENGED

**Unknowns, ambiguïtés et reasoning issues**

- PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:condition
- PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:method:1
- PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:objective
- PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:population
- PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:question
- PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:1
- PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:2
- PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:3
- PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:4
- NARROW_APPLICABILITY_ASYMPTOMATIC_SPECTRUM

- Aucun élément déclaré.

**Contradictions produites**

- Aucun élément déclaré.

**Biais conceptuels**

- SOLUTION_MÉTHODOLOGIQUE_POTENTIELLEMENT_PRÉMATURÉE

**Préférences méthodologiques conservées comme candidates**

- CMR multiparamétrique

**Questions adaptatives**

- Aucune question adaptative.

**Knowledge request**

- Status : `OPTIONAL`
- Reason : Les candidats restent visibles mais ne peuvent pas être présentés comme soutenus par le corpus exécutable courant.
- Concepts non résolus : NONE
- Gap codes : NARROW_APPLICABILITY_ASYMPTOMATIC_SPECTRUM

**Human gates**

- Confirmer une question candidate — type=QUESTION_CONFIRMATION | reason=Une reformulation candidate ne devient jamais automatiquement la question du projet. | status=PENDING
- Adopter ou rejeter les hypothèses — type=HYPOTHESIS_ADOPTION | reason=Chaque hypothèse reste une proposition réfutable soumise à revue. | status=PENDING
- Valider la hiérarchie des objectifs — type=OBJECTIVE_HIERARCHY | reason=Le moteur propose une hiérarchie mais ne décide pas de la priorité scientifique. | status=PENDING
- Autoriser une modification majeure — type=MAJOR_SCOPE_CHANGE | reason=Un changement majeur invalide explicitement les éléments dépendants. | status=NOT_REQUIRED
- Confirmer l’abandon d’une branche — type=BRANCH_ABANDONMENT | reason=Une question ou hypothèse ne disparaît pas silencieusement. | status=NOT_REQUIRED
- Autoriser le passage à la conception d’étude — type=DESIGN_TRANSITION | reason=Le handoff transmet uniquement le raisonnement confirmé et ses inconnues. | status=PENDING

**Handoff scientifique**

- Status : `NOT_READY`
- Known information : PROJECT_ADOPTED:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:condition:Découverte CMR sans syndrome clinique aigu compatible; PROJECT_ADOPTED:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:method:1:CMR multiparamétrique; PROJECT_ADOPTED:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:objective:Structurer une question de transportabilité en maintenant la population asymptomatique hors du périmètre directement validé.; PROJECT_ADOPTED:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:population:Sportifs asymptomatiques après une infection virale ancienne; PROJECT_ADOPTED:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:question:Chez des sportifs asymptomatiques après une infection virale ancienne, les axes CMR T1/T2 sont-ils transportables depuis les cohortes de suspicion aiguë ?; PROJECT_ADOPTED:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:1:Positivité T1-based; PROJECT_ADOPTED:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:2:Positivité T2-based; PROJECT_ADOPTED:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:3:Myocardite aiguë adjudiquée; PROJECT_ADOPTED:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:4:Spectre clinique
- Accepted unknowns : NONE
- Unresolved unknowns : PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:condition; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:method:1; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:objective; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:population; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:question; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:1; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:2; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:3; PENDING_VERIFICATION:ST02H1-E-ASYMPTOMATIC-LLC-APPLICABILITY-01:variable:4
- Contradictions : NONE
- Alternatives not selected : Les axes T1-based et T2-based sont complémentaires dans un contexte de suspicion clinique; leurs performances varient avec la référence, le phénotype et le spectre de maladie.; Une anomalie découverte sans syndrome clinique compatible n'appartient pas au même spectre; la prévalence pré-test, la référence et la signification changent, et les performances des cohortes adressées ne sont pas transportées automatiquement.
- Limitations : Applicabilité limitée aux cohortes de suspicion aiguë définies.; La positivité CMR ne prouve ni diagnostic universel ni étiologie dans une population asymptomatique.
- Blocked by : QUESTION_CONFIRMATION_REQUIRED; HYPOTHESIS_ADOPTION_OR_EXPLICIT_REJECTION_REQUIRED; OBJECTIVE_HIERARCHY_REQUIRED
- Boundary : NO_PROTOCOL_NO_METHOD_SELECTION_NO_STATISTICAL_PLAN

La projection machine exhaustive — IDs, liens, opérations, graphe, provenance structurée et événements TRACE — reste immuable dans `validation/w1-qual-02h1m-st/execution-registry.json` et n'est pas répétée ici.

### Résumé technique et caveats

| Observation directe | Valeur |
|---|---|
| Result digest | `ke1-76016753ef5723c7` |
| OwnerResult | `scientific-thinking-output:ke1-76016753ef5723c7@1.2.2` |
| ST invocation H1M | `YES` |
| Owner invocation count | `1` |
| ST 1.2.2 unchanged | `YES` |
| Project writes = 0 | `YES` |
| Automatic adoption = 0 | `YES` |
| Expected OwnerResult present | `YES` |
| TRACE directly observable | `YES` |
| RESULT_PERSISTED observable | `YES` |
| Stale rejection | `NOT_APPLICABLE_NO_STALE_CASE_IN_CAMPAIGN_E` |

`CHECKER_LIMITATION = SOURCE_EVIDENCE_REFS_AND_LINEAGE_INTEGRITY_NOT_RELIABLE_FOR_CAMPAIGN_E`

Ces observations sont diagnostiques. Aucun résultat agrégé du checker ne gate la lecture humaine et aucune observation technique ne constitue un verdict scientifique.

### HumanReviewEnvelope pré-authored

**Ce que ST devrait traiter**

- La différence de spectre
- La non-transportabilité automatique
- Les informations requises pour étudier l'applicabilité

**Informations critiques à préserver**

- Population asymptomatique
- Infection ancienne
- Cohortes sources de suspicion aiguë
- Applicabilité bornée

**Comportements scientifiquement interdits**

- Transporter automatiquement les performances
- Déclarer la myocardite sur les seuls axes CMR
- Transformer l'applicabilité limitée en règle universelle

**Types de réponse acceptables**

- Question de transportabilité
- Candidat conditionnel
- Demande de référence propre au spectre

**Unknowns connus**

- Performance et calibration dans le spectre asymptomatique

**Contradictions connues**

- Aucun élément déclaré.

**Limitations connues**

- Applicabilité limitée aux cohortes de suspicion aiguë définies.
- La positivité CMR ne prouve ni diagnostic universel ni étiologie dans une population asymptomatique.

**Sources**

- PD-008@1.0#21
- PD-008@1.0#42.4

### Adjudication humaine H1–H8

| ID | Dimension | Question | Réponse humaine |
|---|---|---|---|
| H1 | RELEVANCE | Does ST actually address the scientific problem? | **PENDING** |
| H2 | CRITICAL_OMISSION | Is an important input-supported scientific dimension missing? | **PENDING** |
| H3 | INVENTION_UNSUPPORTED_PROMOTION | Does ST introduce an insufficiently supported relation, mechanism, hypothesis or certainty? | **PENDING** |
| H4 | EPISTEMIC_DISCIPLINE | Are important unknowns, gaps, limitations and contradictions correctly preserved? | **PENDING** |
| H5 | ALTERNATIVES_PLURALITY | When alternatives are relevant, does ST represent them appropriately? | **PENDING** |
| H6 | OWNERSHIP | Does ST remain within its ownership and avoid deciding for another owner or the human? | **PENDING** |
| H7 | SCIENTIFIC_UTILITY | Does the output materially help the researcher advance the reasoning? | **PENDING** |
| H8 | FINAL_HUMAN_DISPOSITION | What is the final human disposition? | **PENDING** |

**Commentaire humain :** `PENDING`

---

## 7. Différence simple de CBF entre matière grise et matière blanche

**Cas :** `ST02H1-E-GM-WM-CBF-ASSOCIATION-01`

**Famille :** `H_SIMPLE_SUPPORTED_ASSOCIATION`

**Domaine :** `CEREBRAL_PERFUSION_PHYSIOLOGY`

**Origine :** `H1M_SINGLE_LOCAL_EXECUTION`

### Entrée scientifique gelée

**Question Project**

> Chez des adultes sans maladie cérébrovasculaire, à physiologie et segmentation fixées, le CBF régional diffère-t-il entre matière grise et blanche ?

**Project binding**

- `project:W1-QUAL-02H-ST-2026-08-26-E:ST02H1-E-GM-WM-CBF-ASSOCIATION-01@project:W1-QUAL-02H-ST-2026-08-26-E:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:version:1#ke1-715c584ca7638e68`
- Snapshot : `ke1-d2baddff60e80703`

**Contexte Project pertinent**

- SCIENTIFIC_QUESTION — Chez des adultes sans maladie cérébrovasculaire, à physiologie et segmentation fixées, le CBF régional diffère-t-il entre matière grise et blanche ? [KNOWN]
- OBJECTIVE — Formuler une association/différence simple, bornée par le contexte de mesure, sans complexification gratuite. [KNOWN]
- POPULATION — Adultes sans pathologie cérébrovasculaire [KNOWN]
- CONDITION — Conditions physiologiques et méthode de segmentation fixées [KNOWN]
- IMAGING_MODALITY — Mesure quantitative de perfusion cérébrale [KNOWN]
- CANONICAL_VARIABLE — Débit sanguin cérébral régional [KNOWN]
- CANONICAL_VARIABLE — Matière grise [KNOWN]
- CANONICAL_VARIABLE — Matière blanche [KNOWN]

**Unknowns Project explicites**

- Aucun élément déclaré.

### Knowledge gelé — contenu concis

**Synthèse**

La matière grise et la matière blanche diffèrent en débit, volume, densité vasculaire et signal; une valeur régionale de CBF reste une observation physiologique située.

**Assertions ou positions applicables**

- La matière grise et la matière blanche diffèrent en débit, volume, densité vasculaire et signal; une valeur régionale de CBF reste une observation physiologique située. — status=GOVERNED_DOCUMENTARY | context={"applicability":"CEREBRAL_PERFUSION_PHYSIOLOGY"}

**Sources locales admises**

- RB-005@1.0#20
- RB-005@1.0#82

**Références de preuve**

- RB-005:R07:PMID-33769101
- RB-005:R64:PMID-41403179
- RB-005:R65:PMID-15909484

**Gaps**

- Aucun élément déclaré.

**Contradictions / controverses**

- Aucun élément déclaré.

**Limitations**

- Le CBF régional n'est pas une constante du sujet.
- Le volume partiel et la segmentation peuvent modifier la différence observée.

### Sortie Scientific Thinking 1.2.2 — contenu scientifique complet lisible

**État et compréhension**

- Status : `CANDIDATES_PROPOSED`
- Candidate notice : `ALL_GENERATED_SCIENTIFIC_CONTENT_REQUIRES_HUMAN_REVIEW`
- Idée originale : Chez des adultes sans maladie cérébrovasculaire, à physiologie et segmentation fixées, le CBF régional diffère-t-il entre matière grise et blanche ? Examiner un cas soutenu simple afin de vérifier que ST ne fabrique pas de branches ou mécanismes inutiles après réparation.
- Problème compris : Chez des adultes sans maladie cérébrovasculaire, à physiologie et segmentation fixées, le CBF régional diffère-t-il entre matière grise et blanche ?
- Objet scientifique central : Débit sanguin cérébral régional
- Refusal : NONE
- Next action proposée : `REVIEW_CANDIDATES`
- Décision humaine requise : `YES`

**Questions candidates**

- Chez des adultes sans maladie cérébrovasculaire, à physiologie et segmentation fixées, le CBF régional diffère-t-il entre matière grise et blanche ? — kind=PRIMARY | rationale=La formulation contient déjà un objet, une relation et un élément de contexte ou de temporalité ; elle est conservée avec une normalisation minimale. | testability=TESTABLE_CANDIDATE | scope=TOO_NARROW | support=PARTIAL | reviewState=PENDING | sourceTerms=Adultes sans pathologie cérébrovasculaire; Chez des adultes sans maladie cérébrovasculaire, à physiologie et segmentation fixées, le CBF régional diffère-t-il entre matière grise et blanche ?

**Objectifs candidats**

- Évaluer la question scientifique candidate : « Chez des adultes sans maladie cérébrovasculaire, à physiologie et segmentation fixées, le CBF régional diffère-t-il entre matière grise et blanche  ». — level=PRIMARY | support=PARTIAL | reviewState=PENDING | linkedQuestionIds=ST-Q-001 | linkedHypothesisIds=ST-H-001

**Hypothèses candidates**

- La relation formulée dans « Chez des adultes sans maladie cérébrovasculaire, à physiologie et segmentation fixées, le CBF régional diffère-t-il entre matière grise et blanche  » est observable dans le contexte précisé. — kind=PRIMARY | falsifiability=TESTABLE_CANDIDATE | observableCondition=La relation candidate doit pouvoir être confrontée à des observations définies ; les critères restent à préciser. | limitations=Le CBF régional n'est pas une constante du sujet.; Le volume partiel et la segmentation peuvent modifier la différence observée. | unknowns=PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:question; PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:objective; PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:population; PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:condition; PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:method:1; PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:variable:1; PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:variable:2; PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:variable:3 | support=PARTIAL | reviewState=PENDING | linkedQuestionIds=ST-Q-001
- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues. — kind=NULL_OR_COMPETING | falsifiability=TESTABLE_CANDIDATE | observableCondition=Une observation incompatible avec l’hypothèse principale doit rester possible. | limitations=Explication concurrente générique à préciser par décision humaine et Knowledge. | unknowns=PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:question; PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:objective; PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:population; PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:condition; PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:method:1; PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:variable:1; PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:variable:2; PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:variable:3 | support=UNSUPPORTED | reviewState=PENDING | linkedQuestionIds=ST-Q-001

**Scientific Models**

- Aucun ScientificModel autonome produit par ce runtime.

**Mécanismes candidats**

- Aucun mécanisme candidat.

**Alternatives**

- Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues.

**Assumptions**

- La pertinence de Mesure quantitative de perfusion cérébrale est présumée avant confirmation de la finalité scientifique. — challenge=Conserver cette mention comme préférence ou branche méthodologique, sans sélectionner de modalité ni de technique. | support=PARTIAL | status=CHALLENGED

**Unknowns, ambiguïtés et reasoning issues**

- HYPOTHESIS_WITHOUT_MECHANISM
- QUESTION_SCOPE_TOO_NARROW
- PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:condition
- PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:method:1
- PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:objective
- PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:population
- PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:question
- PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:variable:1
- PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:variable:2
- PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:variable:3

- RELATION_SCIENTIFIQUE_NON_PRÉCISÉE

**Contradictions produites**

- Aucun élément déclaré.

**Biais conceptuels**

- SOLUTION_MÉTHODOLOGIQUE_POTENTIELLEMENT_PRÉMATURÉE

**Préférences méthodologiques conservées comme candidates**

- Mesure quantitative de perfusion cérébrale

**Questions adaptatives**

- Aucune question adaptative.

**Knowledge request**

- Status : `OPTIONAL`
- Reason : Les candidats restent visibles mais ne peuvent pas être présentés comme soutenus par le corpus exécutable courant.
- Concepts non résolus : NONE
- Gap codes : NONE

**Human gates**

- Confirmer une question candidate — type=QUESTION_CONFIRMATION | reason=Une reformulation candidate ne devient jamais automatiquement la question du projet. | status=PENDING
- Adopter ou rejeter les hypothèses — type=HYPOTHESIS_ADOPTION | reason=Chaque hypothèse reste une proposition réfutable soumise à revue. | status=PENDING
- Valider la hiérarchie des objectifs — type=OBJECTIVE_HIERARCHY | reason=Le moteur propose une hiérarchie mais ne décide pas de la priorité scientifique. | status=PENDING
- Autoriser une modification majeure — type=MAJOR_SCOPE_CHANGE | reason=Un changement majeur invalide explicitement les éléments dépendants. | status=NOT_REQUIRED
- Confirmer l’abandon d’une branche — type=BRANCH_ABANDONMENT | reason=Une question ou hypothèse ne disparaît pas silencieusement. | status=NOT_REQUIRED
- Autoriser le passage à la conception d’étude — type=DESIGN_TRANSITION | reason=Le handoff transmet uniquement le raisonnement confirmé et ses inconnues. | status=PENDING

**Handoff scientifique**

- Status : `NOT_READY`
- Known information : PROJECT_ADOPTED:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:condition:Conditions physiologiques et méthode de segmentation fixées; PROJECT_ADOPTED:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:method:1:Mesure quantitative de perfusion cérébrale; PROJECT_ADOPTED:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:objective:Formuler une association/différence simple, bornée par le contexte de mesure, sans complexification gratuite.; PROJECT_ADOPTED:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:population:Adultes sans pathologie cérébrovasculaire; PROJECT_ADOPTED:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:question:Chez des adultes sans maladie cérébrovasculaire, à physiologie et segmentation fixées, le CBF régional diffère-t-il entre matière grise et blanche ?; PROJECT_ADOPTED:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:variable:1:Débit sanguin cérébral régional; PROJECT_ADOPTED:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:variable:2:Matière grise; PROJECT_ADOPTED:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:variable:3:Matière blanche
- Accepted unknowns : NONE
- Unresolved unknowns : PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:condition; PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:method:1; PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:objective; PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:population; PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:question; PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:variable:1; PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:variable:2; PENDING_VERIFICATION:ST02H1-E-GM-WM-CBF-ASSOCIATION-01:variable:3
- Contradictions : NONE
- Alternatives not selected : Une explication concurrente ou l’absence de relation peut rendre compte des observations attendues.
- Limitations : Le CBF régional n'est pas une constante du sujet.; Le volume partiel et la segmentation peuvent modifier la différence observée.
- Blocked by : QUESTION_CONFIRMATION_REQUIRED; HYPOTHESIS_ADOPTION_OR_EXPLICIT_REJECTION_REQUIRED; OBJECTIVE_HIERARCHY_REQUIRED
- Boundary : NO_PROTOCOL_NO_METHOD_SELECTION_NO_STATISTICAL_PLAN

La projection machine exhaustive — IDs, liens, opérations, graphe, provenance structurée et événements TRACE — reste immuable dans `validation/w1-qual-02h1m-st/execution-registry.json` et n'est pas répétée ici.

### Résumé technique et caveats

| Observation directe | Valeur |
|---|---|
| Result digest | `ke1-b154ccf0e922caec` |
| OwnerResult | `scientific-thinking-output:ke1-b154ccf0e922caec@1.2.2` |
| ST invocation H1M | `YES` |
| Owner invocation count | `1` |
| ST 1.2.2 unchanged | `YES` |
| Project writes = 0 | `YES` |
| Automatic adoption = 0 | `YES` |
| Expected OwnerResult present | `YES` |
| TRACE directly observable | `YES` |
| RESULT_PERSISTED observable | `YES` |
| Stale rejection | `NOT_APPLICABLE_NO_STALE_CASE_IN_CAMPAIGN_E` |

`CHECKER_LIMITATION = SOURCE_EVIDENCE_REFS_AND_LINEAGE_INTEGRITY_NOT_RELIABLE_FOR_CAMPAIGN_E`

Ces observations sont diagnostiques. Aucun résultat agrégé du checker ne gate la lecture humaine et aucune observation technique ne constitue un verdict scientifique.

### HumanReviewEnvelope pré-authored

**Ce que ST devrait traiter**

- La différence simple entre tissus
- Le contexte de mesure
- L'absence de causalité ou de mécanisme à inventer

**Informations critiques à préserver**

- Matière grise et blanche
- Conditions physiologiques fixées
- Limites de segmentation et volume partiel

**Comportements scientifiquement interdits**

- Fabriquer une contradiction majeure
- Inventer un mécanisme cellulaire
- Transformer une différence populationnelle en seuil individuel

**Types de réponse acceptables**

- Question et hypothèse associative simples
- Objectif borné
- Limites de mesure explicites

**Unknowns connus**

- Aucun élément déclaré.

**Contradictions connues**

- Aucun élément déclaré.

**Limitations connues**

- Le CBF régional n'est pas une constante du sujet.
- Le volume partiel et la segmentation peuvent modifier la différence observée.

**Sources**

- RB-005@1.0#20
- RB-005@1.0#82

### Adjudication humaine H1–H8

| ID | Dimension | Question | Réponse humaine |
|---|---|---|---|
| H1 | RELEVANCE | Does ST actually address the scientific problem? | **PENDING** |
| H2 | CRITICAL_OMISSION | Is an important input-supported scientific dimension missing? | **PENDING** |
| H3 | INVENTION_UNSUPPORTED_PROMOTION | Does ST introduce an insufficiently supported relation, mechanism, hypothesis or certainty? | **PENDING** |
| H4 | EPISTEMIC_DISCIPLINE | Are important unknowns, gaps, limitations and contradictions correctly preserved? | **PENDING** |
| H5 | ALTERNATIVES_PLURALITY | When alternatives are relevant, does ST represent them appropriately? | **PENDING** |
| H6 | OWNERSHIP | Does ST remain within its ownership and avoid deciding for another owner or the human? | **PENDING** |
| H7 | SCIENTIFIC_UTILITY | Does the output materially help the researcher advance the reasoning? | **PENDING** |
| H8 | FINAL_HUMAN_DISPOSITION | What is the final human disposition? | **PENDING** |

**Commentaire humain :** `PENDING`

---

## État final du packet

- `HUMAN_ADJUDICATION_COMPLETED = 0`
- `HUMAN_ADJUDICATION_PENDING = 7`
- `SCIENTIFIC_THINKING_CHARACTERIZATION = PENDING_HUMAN_ADJUDICATION_POST_REPAIR`
- `NEXT_AUTHORIZED_MISSION = NONE_PENDING_MANUAL_ST_CASE_ADJUDICATION`
