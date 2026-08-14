# I01 — PYDANTIC_COMMON_CONTRACT — INTERACTIVE T0

## INPUT

Message utilisateur courant VERBATIM :

> Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.

Conversation précédente VERBATIM :

> —

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/interactive-i01-t0-pydantic-common-contract.json`

```json
{
  "firstOutput": {
    "ambiguities": [
      {
        "ambiguityId": "AMB_TIMING_DELAY",
        "content": "Le délai exact avant la réalisation du stent différé (ex. nombre de jours) n'est pas spécifié.",
        "decisionImpact": "Impacte la comparabilité des protocoles d'intervention et l'interprétation des résultats d'imagerie par RM.",
        "epistemicStatus": "AMBIGUOUS",
        "interpretations": [
          "Délai de quelques jours (ex. 3 à 7 jours)",
          "Délai guidé par la clinique ou l'ischémie résiduelle"
        ],
        "provenanceTurnIds": [
          "T0"
        ]
      }
    ],
    "clarificationCandidates": [
      {
        "blocking": false,
        "clarificationId": "CLAR_TIMING_DELAY",
        "decisionImpact": "Permet de préciser le protocole exact de stent différé pour l'analyse comparative.",
        "priority": "MEDIUM",
        "question": "Quel est le délai prévu pour la réalisation du stent différé par rapport à l'intervention immédiate ?",
        "targetIds": [
          "AMB_TIMING_DELAY"
        ]
      }
    ],
    "contextualScientificCandidates": [
      {
        "basis": null,
        "content": "L'imagerie par résonance magnétique (IRM) cardiaque permet d'évaluer les lésions myocardiques, la taille de l'infarctus, l'œdème et le microvascular obstruction (MVO) après un infarctus du myocarde.",
        "epistemicStatus": "SUPPORTED_CANDIDATE",
        "itemId": "CSC_MRI_ROLE",
        "ownership": "SYSTEM",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "T0"
        ],
        "scientificRole": "method",
        "sourceText": null,
        "temporalContext": null
      }
    ],
    "contradictions": [],
    "conversationTurns": [
      {
        "content": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
        "role": "USER",
        "turnId": "T0"
      }
    ],
    "correctionsAndSupersessions": [],
    "explicitUserStatements": [
      {
        "basis": null,
        "content": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "EUS_COMPARE_STENT_MRI",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "T0"
        ],
        "scientificRole": "project_variable",
        "sourceText": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
        "temporalContext": null
      }
    ],
    "inferredContext": [],
    "missingInformation": [
      {
        "blocking": false,
        "content": "Le délai spécifique du stent différé et les critères d'évaluation précis de l'IRM (ex. volume d'infarctus, sauvetage myocardique) restent à définir.",
        "decisionImpact": "Nécessaire pour affiner le protocole méthodologique de comparaison.",
        "missingId": "MISS_PROTOCOL_DETAILS",
        "owner": "USER",
        "priority": "MEDIUM",
        "provenanceTurnIds": [
          "T0"
        ]
      }
    ],
    "negationsAndConstraints": [],
    "normalizedUnderstanding": "L'utilisateur souhaite mener une comparaison entre une stratégie de stent immédiat et une stratégie de stent différé chez des patients présentant un infarctus du myocarde, avec une évaluation des lésions myocardiques par imagerie par résonance magnétique (IRM).",
    "objects": [
      {
        "basis": null,
        "content": "Stent immédiat",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "OBJ_STENT_IMMEDIATE",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "T0"
        ],
        "scientificRole": "method",
        "sourceText": "stent immédiat",
        "temporalContext": null
      },
      {
        "basis": null,
        "content": "Stent différé",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "OBJ_STENT_DEFERRED",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "T0"
        ],
        "scientificRole": "method",
        "sourceText": "stent différé",
        "temporalContext": null
      },
      {
        "basis": null,
        "content": "Infarctus du myocarde",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "OBJ_INFARCT",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "T0"
        ],
        "scientificRole": "phenomenon",
        "sourceText": "infarctus",
        "temporalContext": null
      },
      {
        "basis": null,
        "content": "Imagerie par résonance magnétique (IRM) des lésions",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "OBJ_MRI_LESIONS",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "T0"
        ],
        "scientificRole": "observable_property",
        "sourceText": "voir les lésions en IRM",
        "temporalContext": null
      }
    ],
    "originalRequest": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
    "ownershipAndEpistemicState": [
      {
        "content": "Comparaison entre stent immédiat et stent différé dans l'infarctus avec évaluation des lésions par IRM.",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "owner": "USER",
        "provenanceTurnIds": [],
        "statementId": "EUS_COMPARE_STENT_MRI"
      }
    ],
    "relations": [
      {
        "basis": null,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "object": "OBJ_STENT_DEFERRED",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "predicate": "COMPARED_TO",
        "provenanceTurnIds": [
          "T0"
        ],
        "relationId": "REL_COMPARE_STENTS",
        "sourceText": "comparer le stent immédiat au stent différé",
        "subject": "OBJ_STENT_IMMEDIATE",
        "temporalContext": null
      },
      {
        "basis": null,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "object": "OBJ_INFARCT",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "predicate": "APPLIES_TO",
        "provenanceTurnIds": [
          "T0"
        ],
        "relationId": "REL_STENT_INFARCT",
        "sourceText": "dans l'infarctus",
        "subject": "OBJ_STENT_IMMEDIATE",
        "temporalContext": null
      },
      {
        "basis": null,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "object": "OBJ_INFARCT",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "predicate": "APPLIES_TO",
        "provenanceTurnIds": [
          "T0"
        ],
        "relationId": "REL_STENT_DEF_INFARCT",
        "sourceText": "dans l'infarctus",
        "subject": "OBJ_STENT_DEFERRED",
        "temporalContext": null
      },
      {
        "basis": null,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "object": "OBJ_MRI_LESIONS",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "predicate": "EVALUATED_BY",
        "provenanceTurnIds": [
          "T0"
        ],
        "relationId": "REL_EVAL_MRI",
        "sourceText": "voir les lésions en IRM",
        "subject": "OBJ_INFARCT",
        "temporalContext": null
      }
    ],
    "scientificGoal": "Comparer l'efficacité et l'impact myocardique d'une stratégie de stent immédiat versus stent différé chez des patients victimes d'un infarctus, en utilisant l'IRM pour l'évaluation des lésions.",
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

L'utilisateur souhaite mener une comparaison entre une stratégie de stent immédiat et une stratégie de stent différé chez des patients présentant un infarctus du myocarde, avec une évaluation des lésions myocardiques par imagerie par résonance magnétique (IRM).

Objectif scientifique produit :

Comparer l'efficacité et l'impact myocardique d'une stratégie de stent immédiat versus stent différé chez des patients victimes d'un infarctus, en utilisant l'IRM pour l'évaluation des lésions.

### EXPLICITEMENT DIT PAR LE CHERCHEUR

- content=Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM. | scientificRole=project_variable | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM. | provenanceTurnIds=["T0"]

### RELATIONS COMPRISES

- subject=OBJ_STENT_IMMEDIATE | predicate=COMPARED_TO | object=OBJ_STENT_DEFERRED | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=comparer le stent immédiat au stent différé | provenanceTurnIds=["T0"]
- subject=OBJ_STENT_IMMEDIATE | predicate=APPLIES_TO | object=OBJ_INFARCT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=dans l'infarctus | provenanceTurnIds=["T0"]
- subject=OBJ_STENT_DEFERRED | predicate=APPLIES_TO | object=OBJ_INFARCT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=dans l'infarctus | provenanceTurnIds=["T0"]
- subject=OBJ_INFARCT | predicate=EVALUATED_BY | object=OBJ_MRI_LESIONS | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=voir les lésions en IRM | provenanceTurnIds=["T0"]

### CONTEXTE INFÉRÉ

- Aucun élément produit.

### CANDIDATS SCIENTIFIQUES CONTEXTUELS

- content=L'imagerie par résonance magnétique (IRM) cardiaque permet d'évaluer les lésions myocardiques, la taille de l'infarctus, l'œdème et le microvascular obstruction (MVO) après un infarctus du myocarde. | scientificRole=method | polarity=AFFIRMED | epistemicStatus=SUPPORTED_CANDIDATE | ownership=SYSTEM | provenanceTurnIds=["T0"]

### NÉGATIONS / CONTRAINTES

- Aucun élément produit.

### TEMPORALITÉ

- Aucun élément produit.

### AMBIGUÏTÉS

- content=Le délai exact avant la réalisation du stent différé (ex. nombre de jours) n'est pas spécifié. | epistemicStatus=AMBIGUOUS | decisionImpact=Impacte la comparabilité des protocoles d'intervention et l'interprétation des résultats d'imagerie par RM. | provenanceTurnIds=["T0"] | interpretations=["Délai de quelques jours (ex. 3 à 7 jours)", "Délai guidé par la clinique ou l'ischémie résiduelle"]

### INFORMATIONS MANQUANTES

- content=Le délai spécifique du stent différé et les critères d'évaluation précis de l'IRM (ex. volume d'infarctus, sauvetage myocardique) restent à définir. | owner=USER | priority=MEDIUM | blocking=non | decisionImpact=Nécessaire pour affiner le protocole méthodologique de comparaison. | provenanceTurnIds=["T0"]

### INCONNUES

- Aucun élément produit.

### CORRECTIONS / SUPERSESSIONS

- Aucun élément produit.

### OWNERSHIP / STATUT ÉPISTÉMIQUE

- content=Comparaison entre stent immédiat et stent différé dans l'infarctus avec évaluation des lésions par IRM. | epistemicStatus=EXPLICIT_USER_STATED | owner=USER

### QUESTIONS DE CLARIFICATION CANDIDATES

- question=Quel est le délai prévu pour la réalisation du stent différé par rapport à l'intervention immédiate ? | priority=MEDIUM | blocking=non | decisionImpact=Permet de préciser le protocole exact de stent différé pour l'analyse comparative. | targetIds=["AMB_TIMING_DELAY"]

## MISSING STRUCTURAL GUARANTEES

- EXACT_PROVIDER_RAW_TEXT_NOT_PERSISTED; STRUCTURED_NATIVE_ARTIFACT_AVAILABLE

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
