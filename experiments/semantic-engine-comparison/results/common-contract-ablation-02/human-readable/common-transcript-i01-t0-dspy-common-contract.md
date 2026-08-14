# I01 — DSPY_COMMON_CONTRACT — COMMON_TRANSCRIPT T0

## INPUT

Message utilisateur courant VERBATIM :

> Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.

Conversation précédente VERBATIM :

> —

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/common-transcript-i01-t0-dspy-common-contract.json`

```json
{
  "common_state_json": "{\n  \"originalRequest\": \"Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.\",\n  \"conversationTurns\": [\n    {\n      \"turnId\": \"T0\",\n      \"role\": \"USER\",\n      \"content\": \"Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.\"\n    }\n  ],\n  \"normalizedUnderstanding\": \"The user wants to compare immediate stenting versus delayed stenting in myocardial infarction, and evaluate lesions using cardiac magnetic resonance imaging (MRI).\",\n  \"scientificGoal\": \"Compare immediate stenting versus delayed stenting in infarction and assess lesions using MRI.\",\n  \"explicitUserStatements\": [\n    {\n      \"itemId\": \"item_stent_comparison\",\n      \"content\": \"Je veux comparer le stent immédiat au stent différé dans l'infarctus\",\n      \"scientificRole\": \"project variable\",\n      \"polarity\": \"AFFIRMED\",\n      \"epistemicStatus\": \"EXPLICIT_USER_STATED\",\n      \"ownership\": \"USER\",\n      \"sourceText\": \"Je veux comparer le stent immédiat au stent différé dans l'infarctus\",\n      \"provenanceTurnIds\": [\"T0\"],\n      \"basis\": null,\n      \"temporalContext\": null\n    },\n    {\n      \"itemId\": \"item_mri_assessment\",\n      \"content\": \"voir les lésions en IRM\",\n      \"scientificRole\": \"method or measurement definition\",\n      \"polarity\": \"AFFIRMED\",\n      \"epistemicStatus\": \"EXPLICIT_USER_STATED\",\n      \"ownership\": \"USER\",\n      \"sourceText\": \"voir les lésions en IRM\",\n      \"provenanceTurnIds\": [\"T0\"],\n      \"basis\": null,\n      \"temporalContext\": null\n    }\n  ],\n  \"objects\": [],\n  \"relations\": [],\n  \"negationsAndConstraints\": [],\n  \"temporalModel\": [],\n  \"inferredContext\": [],\n  \"contextualScientificCandidates\": [],\n  \"ambiguities\": [],\n  \"unknowns\": [],\n  \"missingInformation\": [],\n  \"correctionsAndSupersessions\": [],\n  \"contradictions\": [],\n  \"ownershipAndEpistemicState\": [],\n  \"clarificationCandidates\": []\n}"
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

The user wants to compare immediate stenting versus delayed stenting in myocardial infarction, and evaluate lesions using cardiac magnetic resonance imaging (MRI).

Objectif scientifique produit :

Compare immediate stenting versus delayed stenting in infarction and assess lesions using MRI.

### EXPLICITEMENT DIT PAR LE CHERCHEUR

- content=Je veux comparer le stent immédiat au stent différé dans l'infarctus | scientificRole=project variable | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Je veux comparer le stent immédiat au stent différé dans l'infarctus | provenanceTurnIds=["T0"]
- content=voir les lésions en IRM | scientificRole=method or measurement definition | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=voir les lésions en IRM | provenanceTurnIds=["T0"]

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
