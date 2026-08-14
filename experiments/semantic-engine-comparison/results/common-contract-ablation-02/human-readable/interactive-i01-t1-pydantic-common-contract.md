# I01 — PYDANTIC_COMMON_CONTRACT — INTERACTIVE T1

## INPUT

Message utilisateur courant VERBATIM :

> 4–6 semaines

Conversation précédente VERBATIM :

> I01:PYDANTIC_COMMON_CONTRACT:T0 | USER : Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.
> I01:PYDANTIC_COMMON_CONTRACT:Q1 | ASSISTANT : Quel est le délai prévu pour la réalisation du stent différé par rapport à l'intervention immédiate ?

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/interactive-i01-t1-pydantic-common-contract.json`

```json
{
  "firstOutput": {
    "ambiguities": [],
    "clarificationCandidates": [],
    "contextualScientificCandidates": [],
    "contradictions": [],
    "conversationTurns": [
      {
        "content": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
        "role": "USER",
        "turnId": "I01:PYDANTIC_COMMON_CONTRACT:T0"
      },
      {
        "content": "Quel est le délai prévu pour la réalisation du stent différé par rapport à l'intervention immédiate ?",
        "role": "ASSISTANT",
        "turnId": "I01:PYDANTIC_COMMON_CONTRACT:Q1"
      },
      {
        "content": "4–6 semaines",
        "role": "USER",
        "turnId": "I01:PYDANTIC_COMMON_CONTRACT:R1"
      }
    ],
    "correctionsAndSupersessions": [],
    "explicitUserStatements": [
      {
        "basis": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
        "content": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "STMT_01",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I01:PYDANTIC_COMMON_CONTRACT:T0"
        ],
        "scientificRole": "project_goal",
        "sourceText": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
        "temporalContext": null
      },
      {
        "basis": "4–6 semaines",
        "content": "Délai prévu pour la réalisation du stent différé par rapport à l'intervention immédiate : 4–6 semaines",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "STMT_02",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I01:PYDANTIC_COMMON_CONTRACT:R1"
        ],
        "scientificRole": "project_variable",
        "sourceText": "4–6 semaines",
        "temporalContext": null
      }
    ],
    "inferredContext": [],
    "missingInformation": [],
    "negationsAndConstraints": [],
    "normalizedUnderstanding": "The user wants to compare immediate stenting versus delayed stenting (at 4-6 weeks) in myocardial infarction and assess lesions using cardiac MRI.",
    "objects": [
      {
        "basis": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
        "content": "stent immédiat",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "OBJ_01",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I01:PYDANTIC_COMMON_CONTRACT:T0"
        ],
        "scientificRole": "method",
        "sourceText": "stent immédiat",
        "temporalContext": null
      },
      {
        "basis": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
        "content": "stent différé",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "OBJ_02",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I01:PYDANTIC_COMMON_CONTRACT:T0"
        ],
        "scientificRole": "method",
        "sourceText": "stent différé",
        "temporalContext": null
      },
      {
        "basis": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
        "content": "infarctus",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "OBJ_03",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I01:PYDANTIC_COMMON_CONTRACT:T0"
        ],
        "scientificRole": "phenomenon",
        "sourceText": "infarctus",
        "temporalContext": null
      },
      {
        "basis": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
        "content": "lésions en IRM",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "OBJ_04",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I01:PYDANTIC_COMMON_CONTRACT:T0"
        ],
        "scientificRole": "endpoint",
        "sourceText": "lésions en IRM",
        "temporalContext": null
      }
    ],
    "originalRequest": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
    "ownershipAndEpistemicState": [
      {
        "content": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "owner": "USER",
        "provenanceTurnIds": [],
        "statementId": "STMT_01"
      },
      {
        "content": "4–6 semaines",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "owner": "USER",
        "provenanceTurnIds": [],
        "statementId": "STMT_02"
      }
    ],
    "relations": [
      {
        "basis": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "object": "OBJ_02",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "predicate": "compare_to",
        "provenanceTurnIds": [
          "I01:PYDANTIC_COMMON_CONTRACT:T0"
        ],
        "relationId": "REL_01",
        "sourceText": "Je veux comparer le stent immédiat au stent différé",
        "subject": "OBJ_01",
        "temporalContext": null
      },
      {
        "basis": "4–6 semaines",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "object": "STMT_02",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "predicate": "has_delay",
        "provenanceTurnIds": [
          "I01:PYDANTIC_COMMON_CONTRACT:R1"
        ],
        "relationId": "REL_02",
        "sourceText": "4–6 semaines",
        "subject": "OBJ_02",
        "temporalContext": null
      }
    ],
    "scientificGoal": "Comparer le stent immédiat au stent différé (4-6 semaines) dans l'infarctus et évaluer les lésions en IRM.",
    "temporalModel": [
      {
        "basis": "4–6 semaines",
        "content": "Délai du stent différé: 4–6 semaines",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "TMP_01",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I01:PYDANTIC_COMMON_CONTRACT:R1"
        ],
        "scientificRole": "project_variable",
        "sourceText": "4–6 semaines",
        "temporalContext": null
      }
    ],
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

The user wants to compare immediate stenting versus delayed stenting (at 4-6 weeks) in myocardial infarction and assess lesions using cardiac MRI.

Objectif scientifique produit :

Comparer le stent immédiat au stent différé (4-6 semaines) dans l'infarctus et évaluer les lésions en IRM.

### EXPLICITEMENT DIT PAR LE CHERCHEUR

- content=Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM. | scientificRole=project_goal | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | basis=Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM. | sourceText=Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM. | provenanceTurnIds=["I01:PYDANTIC_COMMON_CONTRACT:T0"]
- content=Délai prévu pour la réalisation du stent différé par rapport à l'intervention immédiate : 4–6 semaines | scientificRole=project_variable | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | basis=4–6 semaines | sourceText=4–6 semaines | provenanceTurnIds=["I01:PYDANTIC_COMMON_CONTRACT:R1"]

### RELATIONS COMPRISES

- subject=OBJ_01 | predicate=compare_to | object=OBJ_02 | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | basis=Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM. | sourceText=Je veux comparer le stent immédiat au stent différé | provenanceTurnIds=["I01:PYDANTIC_COMMON_CONTRACT:T0"]
- subject=OBJ_02 | predicate=has_delay | object=STMT_02 | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | basis=4–6 semaines | sourceText=4–6 semaines | provenanceTurnIds=["I01:PYDANTIC_COMMON_CONTRACT:R1"]

### CONTEXTE INFÉRÉ

- Aucun élément produit.

### CANDIDATS SCIENTIFIQUES CONTEXTUELS

- Aucun élément produit.

### NÉGATIONS / CONTRAINTES

- Aucun élément produit.

### TEMPORALITÉ

- content=Délai du stent différé: 4–6 semaines | scientificRole=project_variable | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | basis=4–6 semaines | sourceText=4–6 semaines | provenanceTurnIds=["I01:PYDANTIC_COMMON_CONTRACT:R1"]

### AMBIGUÏTÉS

- Aucun élément produit.

### INFORMATIONS MANQUANTES

- Aucun élément produit.

### INCONNUES

- Aucun élément produit.

### CORRECTIONS / SUPERSESSIONS

- Aucun élément produit.

### OWNERSHIP / STATUT ÉPISTÉMIQUE

- content=Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM. | epistemicStatus=EXPLICIT_USER_STATED | owner=USER
- content=4–6 semaines | epistemicStatus=EXPLICIT_USER_STATED | owner=USER

### QUESTIONS DE CLARIFICATION CANDIDATES

- Aucun élément produit.

## MISSING STRUCTURAL GUARANTEES

- EXACT_PROVIDER_RAW_TEXT_NOT_PERSISTED; STRUCTURED_NATIVE_ARTIFACT_AVAILABLE

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
