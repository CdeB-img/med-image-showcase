# I02 — PYDANTIC_COMMON_CONTRACT — COMMON_TRANSCRIPT T0

## INPUT

Message utilisateur courant VERBATIM :

> Chez les patients thrombectomisés, je veux savoir si l'OEF se normalise quand la perfusion s'améliore, mais je n'ai pas toujours l'IRM avant le geste.

Conversation précédente VERBATIM :

> —

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/common-transcript-i02-t0-pydantic-common-contract.json`

```json
{
  "firstOutput": {
    "ambiguities": [
      {
        "ambiguityId": "AMB_OEF_NORMALIZATION_CRITERIA",
        "content": "Les critères précis de normalisation de l'OEF et d'amélioration de la perfusion ne sont pas définis.",
        "decisionImpact": "Crucial pour déterminer la méthodologie d'analyse des données d'imagerie.",
        "epistemicStatus": "AMBIGUOUS",
        "interpretations": [
          "Normalisation basée sur des seuils absolus (ex: < 40%)",
          "Normalisation par rapport au côté controlatéral sain"
        ],
        "provenanceTurnIds": [
          "I02:T0"
        ]
      }
    ],
    "clarificationCandidates": [
      {
        "blocking": false,
        "clarificationId": "CLAR_BASELINE_MRI",
        "decisionImpact": "Permet d'adapter le plan d'analyse en fonction de la disponibilité variable des IRM pré-procédurales.",
        "priority": "MEDIUM",
        "question": "Comment prévoyez-vous de gérer l'absence fréquente d'IRM avant la thrombectomie dans votre analyse ?",
        "targetIds": [
          "MISS_BASELINE_MRI_HANDLING"
        ]
      }
    ],
    "contextualScientificCandidates": [],
    "contradictions": [],
    "conversationTurns": [
      {
        "content": "Chez les patients thrombectomisés, je veux savoir si l'OEF se normalise quand la perfusion s'améliore, mais je n'ai pas toujours l'IRM avant le geste.",
        "role": "USER",
        "turnId": "I02:T0"
      }
    ],
    "correctionsAndSupersessions": [],
    "explicitUserStatements": [
      {
        "basis": "I02:T0",
        "content": "Chez les patients thrombectomisés, je veux savoir si l'OEF se normalise quand la perfusion s'améliore",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "EXP_GOAL_OEF_PERFUSION",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I02:T0"
        ],
        "scientificRole": "PRIMARY_QUESTION",
        "sourceText": "Chez les patients thrombectomisés, je veux savoir si l'OEF se normalise quand la perfusion s'améliore",
        "temporalContext": "POST_THROMBECTOMY"
      },
      {
        "basis": "I02:T0",
        "content": "je n'ai pas toujours l'IRM avant le geste",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "EXP_CONSTRAINT_MISSING_MRI",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I02:T0"
        ],
        "scientificRole": "METHODOLOGICAL_CONSTRAINT",
        "sourceText": "je n'ai pas toujours l'IRM avant le geste",
        "temporalContext": "PRE_PROCEDURAL"
      }
    ],
    "inferredContext": [],
    "missingInformation": [
      {
        "blocking": false,
        "content": "Stratégie pour gérer l'absence d'IRM pré-thrombectomie chez certains patients.",
        "decisionImpact": "Affecte la taille de la cohorte analysable et le design de l'étude (analyse longitudinale vs transversale).",
        "missingId": "MISS_BASELINE_MRI_HANDLING",
        "owner": "USER",
        "priority": "MEDIUM",
        "provenanceTurnIds": [
          "I02:T0"
        ]
      }
    ],
    "negationsAndConstraints": [],
    "normalizedUnderstanding": "L'utilisateur souhaite étudier la relation entre la normalisation de l'OEF (Oxygen Extraction Fraction) et l'amélioration de la perfusion chez des patients ayant subi une thrombectomie, tout en prenant en compte une contrainte méthodologique : l'absence fréquente d'imagerie par résonance magnétique (IRM) avant la réalisation du geste.",
    "objects": [
      {
        "basis": "I02:T0",
        "content": "OEF (Oxygen Extraction Fraction)",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "OBJ_OEF",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I02:T0"
        ],
        "scientificRole": "BIOMARKER",
        "sourceText": "l'OEF",
        "temporalContext": null
      },
      {
        "basis": "I02:T0",
        "content": "Perfusion",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "OBJ_PERFUSION",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I02:T0"
        ],
        "scientificRole": "BIOMARKER",
        "sourceText": "la perfusion",
        "temporalContext": null
      },
      {
        "basis": "I02:T0",
        "content": "IRM avant le geste (IRM pré-thrombectomie)",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "OBJ_PRE_MRI",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I02:T0"
        ],
        "scientificRole": "METHOD_OR_MEASUREMENT",
        "sourceText": "l'IRM avant le geste",
        "temporalContext": null
      }
    ],
    "originalRequest": "Chez les patients thrombectomisés, je veux savoir si l'OEF se normalise quand la perfusion s'améliore, mais je n'ai pas toujours l'IRM avant le geste.",
    "ownershipAndEpistemicState": [
      {
        "content": "Chez les patients thrombectomisés, je veux savoir si l'OEF se normalise quand la perfusion s'améliore",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "owner": "USER",
        "provenanceTurnIds": [
          "I02:T0"
        ],
        "statementId": "STMT_01"
      },
      {
        "content": "je n'ai pas toujours l'IRM avant le geste",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "owner": "USER",
        "provenanceTurnIds": [
          "I02:T0"
        ],
        "statementId": "STMT_02"
      }
    ],
    "relations": [
      {
        "basis": "I02:T0",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "object": "OBJ_PERFUSION",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "predicate": "RELATION_IMPROVEMENT_CORRELATION",
        "provenanceTurnIds": [
          "I02:T0"
        ],
        "relationId": "REL_01",
        "sourceText": "l'OEF se normalise quand la perfusion s'améliore",
        "subject": "OBJ_OEF",
        "temporalContext": null
      }
    ],
    "scientificGoal": "Évaluer si la normalisation de l'OEF est corrélée à l'amélioration de la perfusion chez les patients thrombectomisés, malgré des données d'imagerie pré-procédurale incomplètes.",
    "temporalModel": [],
    "unknowns": []
  }
}
```

## STRUCTURED CONTRACT STATUS

- provider status : `SUCCESS`
- parsing status : `PARSED_AND_VALIDATED`
- structured contract conformance : `PASS`
- scientific semantic evaluability : `EVALUABLE`
- evaluation mode : `DETERMINISTIC_COMMON_STATE_PROJECTION`
- native raw output persisted : `false`

## SCIENTIFIC INTERPRETATION

### COMPRÉHENSION GLOBALE

L'utilisateur souhaite étudier la relation entre la normalisation de l'OEF (Oxygen Extraction Fraction) et l'amélioration de la perfusion chez des patients ayant subi une thrombectomie, tout en prenant en compte une contrainte méthodologique : l'absence fréquente d'imagerie par résonance magnétique (IRM) avant la réalisation du geste.

Objectif scientifique produit :

Évaluer si la normalisation de l'OEF est corrélée à l'amélioration de la perfusion chez les patients thrombectomisés, malgré des données d'imagerie pré-procédurale incomplètes.

### EXPLICITEMENT DIT PAR LE CHERCHEUR

- content=Chez les patients thrombectomisés, je veux savoir si l'OEF se normalise quand la perfusion s'améliore | scientificRole=PRIMARY_QUESTION | polarity=AFFIRMED | temporalContext=POST_THROMBECTOMY | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | basis=I02:T0 | sourceText=Chez les patients thrombectomisés, je veux savoir si l'OEF se normalise quand la perfusion s'améliore | provenanceTurnIds=["I02:T0"]
- content=je n'ai pas toujours l'IRM avant le geste | scientificRole=METHODOLOGICAL_CONSTRAINT | polarity=AFFIRMED | temporalContext=PRE_PROCEDURAL | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | basis=I02:T0 | sourceText=je n'ai pas toujours l'IRM avant le geste | provenanceTurnIds=["I02:T0"]

### RELATIONS COMPRISES

- subject=OBJ_OEF | predicate=RELATION_IMPROVEMENT_CORRELATION | object=OBJ_PERFUSION | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | basis=I02:T0 | sourceText=l'OEF se normalise quand la perfusion s'améliore | provenanceTurnIds=["I02:T0"]

### CONTEXTE INFÉRÉ

- Aucun élément produit.

### CANDIDATS SCIENTIFIQUES CONTEXTUELS

- Aucun élément produit.

### NÉGATIONS / CONTRAINTES

- Aucun élément produit.

### TEMPORALITÉ

- Aucun élément produit.

### AMBIGUÏTÉS

- content=Les critères précis de normalisation de l'OEF et d'amélioration de la perfusion ne sont pas définis. | epistemicStatus=AMBIGUOUS | decisionImpact=Crucial pour déterminer la méthodologie d'analyse des données d'imagerie. | provenanceTurnIds=["I02:T0"] | interpretations=["Normalisation basée sur des seuils absolus (ex: < 40%)", "Normalisation par rapport au côté controlatéral sain"]

### INFORMATIONS MANQUANTES

- content=Stratégie pour gérer l'absence d'IRM pré-thrombectomie chez certains patients. | owner=USER | priority=MEDIUM | blocking=non | decisionImpact=Affecte la taille de la cohorte analysable et le design de l'étude (analyse longitudinale vs transversale). | provenanceTurnIds=["I02:T0"]

### INCONNUES

- Aucun élément produit.

### CORRECTIONS / SUPERSESSIONS

- Aucun élément produit.

### OWNERSHIP / STATUT ÉPISTÉMIQUE

- content=Chez les patients thrombectomisés, je veux savoir si l'OEF se normalise quand la perfusion s'améliore | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I02:T0"]
- content=je n'ai pas toujours l'IRM avant le geste | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I02:T0"]

### QUESTIONS DE CLARIFICATION CANDIDATES

- question=Comment prévoyez-vous de gérer l'absence fréquente d'IRM avant la thrombectomie dans votre analyse ? | priority=MEDIUM | blocking=non | decisionImpact=Permet d'adapter le plan d'analyse en fonction de la disponibilité variable des IRM pré-procédurales. | targetIds=["MISS_BASELINE_MRI_HANDLING"]

## MISSING STRUCTURAL GUARANTEES

- EXACT_PROVIDER_RAW_TEXT_NOT_PERSISTED; STRUCTURED_NATIVE_ARTIFACT_AVAILABLE

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
