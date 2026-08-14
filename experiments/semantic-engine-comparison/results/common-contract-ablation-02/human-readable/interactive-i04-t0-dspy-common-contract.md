# I04 — DSPY_COMMON_CONTRACT — INTERACTIVE T0

## INPUT

Message utilisateur courant VERBATIM :

> Je veux détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible. On a plusieurs centres et tout le monde n'a pas les mêmes séquences.

Conversation précédente VERBATIM :

> —

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/interactive-i04-t0-dspy-common-contract.json`

```json
{
  "common_state_json": "{\n  \"originalRequest\": \"Je veux détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible. On a plusieurs centres et tout le monde n'a pas les mêmes séquences.\",\n  \"conversationTurns\": [\n    {\n      \"turnId\": \"T0\",\n      \"role\": \"USER\",\n      \"content\": \"Je veux détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible. On a plusieurs centres et tout le monde n'a pas les mêmes séquences.\"\n    }\n  ],\n  \"normalizedUnderstanding\": \"The user aims to detect early cardiac involvement in Fabry disease prior to visible fibrosis, across multiple centers with heterogeneous imaging sequences.\",\n  \"scientificGoal\": \"Detect early cardiac involvement in Fabry disease before visible fibrosis.\",\n  \"explicitUserStatements\": [\n    {\n      \"itemId\": \"item_1\",\n      \"content\": \"détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible\",\n      \"scientificRole\": \"endpoint\",\n      \"polarity\": \"AFFIRMED\",\n      \"epistemicStatus\": \"EXPLICIT_USER_STATED\",\n      \"ownership\": \"USER\",\n      \"sourceText\": \"Je veux détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible.\",\n      \"provenanceTurnIds\": [\"T0\"],\n      \"basis\": null,\n      \"temporalContext\": \"early (before visible fibrosis)\"\n    },\n    {\n      \"itemId\": \"item_2\",\n      \"content\": \"plusieurs centres et tout le monde n'a pas les mêmes séquences\",\n      \"scientificRole\": \"project variable\",\n      \"polarity\": \"AFFIRMED\",\n      \"epistemicStatus\": \"EXPLICIT_USER_STATED\",\n      \"ownership\": \"USER\",\n      \"sourceText\": \"On a plusieurs centres et tout le monde n'a pas les mêmes séquences.\",\n      \"provenanceTurnIds\": [\"T0\"],\n      \"basis\": null,\n      \"temporalContext\": null\n    }\n  ],\n  \"objects\": [],\n  \"relations\": [],\n  \"negationsAndConstraints\": [],\n  \"temporalModel\": [],\n  \"inferredContext\": [],\n  \"contextualScientificCandidates\": [],\n  \"ambiguities\": [],\n  \"missingInformation\": [\n    {\n      \"missingId\": \"missing_1\",\n      \"content\": \"Specific imaging sequences or protocols available across the multiple centers\",\n      \"priority\": \"HIGH\",\n      \"blocking\": true,\n      \"decisionImpact\": \"Can change the method choice and harmonization strategy across centers for detecting early cardiac involvement.\",\n      \"owner\": \"USER\",\n      \"provenanceTurnIds\": [\"T0\"]\n    }\n  ],\n  \"unknowns\": [],\n  \"correctionsAndSupersessions\": [],\n  \"contradictions\": [],\n  \"ownershipAndEpistemicState\": [\n    {\n      \"statementId\": \"own_1\",\n      \"content\": \"Detection of early cardiac involvement in Fabry disease before visible fibrosis across multi-center with heterogeneous sequences\",\n      \"owner\": \"USER\",\n      \"epistemicStatus\": \"EXPLICIT_USER_STATED\",\n      \"provenanceTurnIds\": [\"T0\"]\n    }\n  ],\n  \"clarificationCandidates\": [\n    {\n      \"clarificationId\": \"clar_1\",\n      \"question\": \"Quelles sont précisément les séquences disponibles dans vos différents centres ?\",\n      \"priority\": \"HIGH\",\n      \"blocking\": true,\n      \"decisionImpact\": \"Can change the method choice and harmonization strategy across centers for detecting early cardiac involvement.\",\n      \"targetIds\": [\"missing_1\"]\n    }\n  ]\n}",
  "deterministicJsonSyntaxRepairApplied": false,
  "deterministicJsonSyntaxRepairTool": null,
  "llmRepairCall": false
}
```

## STRUCTURED CONTRACT STATUS

- provider status : `SUCCESS`
- parsing status : `PARSED`
- structured contract conformance : `PASS`
- scientific semantic evaluability : `EVALUABLE`
- evaluation mode : `DIRECT_STRUCTURED_OUTPUT`
- native raw output persisted : `true`

## SCIENTIFIC INTERPRETATION

### COMPRÉHENSION GLOBALE

The user aims to detect early cardiac involvement in Fabry disease prior to visible fibrosis, across multiple centers with heterogeneous imaging sequences.

Objectif scientifique produit :

Detect early cardiac involvement in Fabry disease before visible fibrosis.

### EXPLICITEMENT DIT PAR LE CHERCHEUR

- content=détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible | scientificRole=endpoint | polarity=AFFIRMED | temporalContext=early (before visible fibrosis) | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Je veux détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible. | provenanceTurnIds=["T0"]
- content=plusieurs centres et tout le monde n'a pas les mêmes séquences | scientificRole=project variable | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=On a plusieurs centres et tout le monde n'a pas les mêmes séquences. | provenanceTurnIds=["T0"]

### RELATIONS COMPRISES

- Aucun élément produit.

### CONTEXTE INFÉRÉ

- Aucun élément produit.

### CANDIDATS SCIENTIFIQUES CONTEXTUELS

- Aucun élément produit.

### NÉGATIONS / CONTRAINTES

- Aucun élément produit.

### TEMPORALITÉ

- Aucun élément produit.

### AMBIGUÏTÉS

- Aucun élément produit.

### INFORMATIONS MANQUANTES

- content=Specific imaging sequences or protocols available across the multiple centers | owner=USER | priority=HIGH | blocking=oui | decisionImpact=Can change the method choice and harmonization strategy across centers for detecting early cardiac involvement. | provenanceTurnIds=["T0"]

### INCONNUES

- Aucun élément produit.

### CORRECTIONS / SUPERSESSIONS

- Aucun élément produit.

### OWNERSHIP / STATUT ÉPISTÉMIQUE

- content=Detection of early cardiac involvement in Fabry disease before visible fibrosis across multi-center with heterogeneous sequences | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["T0"]

### QUESTIONS DE CLARIFICATION CANDIDATES

- question=Quelles sont précisément les séquences disponibles dans vos différents centres ? | priority=HIGH | blocking=oui | decisionImpact=Can change the method choice and harmonization strategy across centers for detecting early cardiac involvement. | targetIds=["missing_1"]

## MISSING STRUCTURAL GUARANTEES

- Aucune limite supplémentaire observée au niveau du Common Scientific State accepté.

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
