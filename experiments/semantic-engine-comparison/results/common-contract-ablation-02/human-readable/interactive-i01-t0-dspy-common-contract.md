# I01 — DSPY_COMMON_CONTRACT — INTERACTIVE T0

## INPUT

Message utilisateur courant VERBATIM :

> Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.

Conversation précédente VERBATIM :

> —

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/interactive-i01-t0-dspy-common-contract.json`

```json
{
  "common_state_json": "{\n  \"originalRequest\": \"Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.\",\n  \"conversationTurns\": [\n    {\n      \"turnId\": \"T0\",\n      \"role\": \"USER\",\n      \"content\": \"Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.\"\n    }\n  ],\n  \"normalizedUnderstanding\": \"The user wants to compare immediate stenting with deferred stenting in infarction and observe lesions using MRI.\",\n  \"scientificGoal\": \"Compare immediate stenting versus deferred stenting in infarction and evaluate lesions using MRI.\",\n  \"explicitUserStatements\": [\n    {\n      \"itemId\": \"ITEM_01\",\n      \"content\": \"Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.\",\n      \"scientificRole\": \"endpoint\",\n      \"polarity\": \"AFFIRMED\",\n      \"epistemicStatus\": \"EXPLICIT_USER_STATED\",\n      \"ownership\": \"USER\",\n      \"provenanceTurnIds\": [\n        \"T0\"\n      ],\n      \"sourceText\": \"Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.\",\n      \"basis\": null,\n      \"temporalContext\": null\n    }\n  ],\n  \"objects\": [],\n  \"relations\": [],\n  \"negationsAndConstraints\": [],\n  \"temporalModel\": [],\n  \"inferredContext\": [],\n  \"contextualScientificCandidates\": [],\n  \"ambiguities\": [],\n  \"missingInformation\": [],\n  \"unknowns\": [],\n  \"contradictions\": [],\n  \"correctionsAndSupersessions\": [],\n  \"ownershipAndEpistemicState\": [],\n  \"clarificationCandidates\": []\n}",
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

The user wants to compare immediate stenting with deferred stenting in infarction and observe lesions using MRI.

Objectif scientifique produit :

Compare immediate stenting versus deferred stenting in infarction and evaluate lesions using MRI.

### EXPLICITEMENT DIT PAR LE CHERCHEUR

- content=Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM. | scientificRole=endpoint | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM. | provenanceTurnIds=["T0"]

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

- Aucun élément produit.

### INCONNUES

- Aucun élément produit.

### CORRECTIONS / SUPERSESSIONS

- Aucun élément produit.

### OWNERSHIP / STATUT ÉPISTÉMIQUE

- Aucun élément produit.

### QUESTIONS DE CLARIFICATION CANDIDATES

- Aucun élément produit.

## MISSING STRUCTURAL GUARANTEES

- Aucune limite supplémentaire observée au niveau du Common Scientific State accepté.

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
