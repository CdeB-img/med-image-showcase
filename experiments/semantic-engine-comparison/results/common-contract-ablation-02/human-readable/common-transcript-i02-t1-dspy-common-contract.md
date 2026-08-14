# I02 — DSPY_COMMON_CONTRACT — COMMON_TRANSCRIPT T1

## INPUT

Message utilisateur courant VERBATIM :

> L'IRM principale est à 24 h puis à J7. Je n'ai souvent pas d'IRM avant la thrombectomie.

Conversation précédente VERBATIM :

> I02:T0 | USER : Chez les patients thrombectomisés, je veux savoir si l'OEF se normalise quand la perfusion s'améliore, mais je n'ai pas toujours l'IRM avant le geste.

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/common-transcript-i02-t1-dspy-common-contract.json`

```json
{
  "common_state_json": "{\n  \"originalRequest\": \"Chez les patients thrombectomisés, je veux savoir si l'OEF se normalise quand la perfusion s'améliore, mais je n'ai pas toujours l'IRM avant le geste.\",\n  \"conversationTurns\": [\n    {\n      \"turnId\": \"I02:T0\",\n      \"role\": \"USER\",\n      \"content\": \"Chez les patients thrombectomisés, je veux savoir si l'OEF se normalise quand la perfusion s'améliore, mais je n'ai pas toujours l'IRM avant le geste.\"\n    },\n    {\n      \"turnId\": \"I02:R1\",\n      \"role\": \"USER\",\n      \"content\": \"L'IRM principale est à 24 h puis à J7. Je n'ai souvent pas d'IRM avant la thrombectomie.\"\n    }\n  ],\n  \"normalizedUnderstanding\": \"The user aims to investigate whether Oxygen Extraction Fraction (OEF) normalizes when perfusion improves in post-thrombectomy patients. The imaging timeline primarily involves MRI at 24 hours and at Day 7, while pre-thrombectomy MRI is frequently absent.\",\n  \"scientificGoal\": \"Determine if OEF normalizes when perfusion improves in thrombectomized patients.\",\n  \"explicitUserStatements\": [\n    {\n      \"itemId\": \"item_1\",\n      \"content\": \"Chez les patients thrombectomisés\",\n      \"scientificRole\": \"phenomenon\",\n      \"polarity\": \"AFFIRMED\",\n      \"epistemicStatus\": \"EXPLICIT_USER_STATED\",\n      \"ownership\": \"USER\",\n      \"sourceText\": \"Chez les patients thrombectomisés\",\n      \"provenanceTurnIds\": [\n        \"I02:T0\"\n      ]\n    },\n    {\n      \"itemId\": \"item_2\",\n      \"content\": \"l'OEF se normalise quand la perfusion s'améliore\",\n      \"scientificRole\": \"endpoint\",\n      \"polarity\": \"AFFIRMED\",\n      \"epistemicStatus\": \"EXPLICIT_USER_STATED\",\n      \"ownership\": \"USER\",\n      \"sourceText\": \"l'OEF se normalise quand la perfusion s'améliore\",\n      \"provenanceTurnIds\": [\n        \"I02:T0\"\n      ]\n    },\n    {\n      \"itemId\": \"item_3\",\n      \"content\": \"je n'ai pas toujours l'IRM avant le geste\",\n      \"scientificRole\": \"method or measurement definition\",\n      \"polarity\": \"NEGATED\",\n      \"epistemicStatus\": \"EXPLICIT_USER_STATED\",\n      \"ownership\": \"USER\",\n      \"sourceText\": \"je n'ai pas toujours l'IRM avant le geste\",\n      \"provenanceTurnIds\": [\n        \"I02:T0\"\n      ]\n    },\n    {\n      \"itemId\": \"item_4\",\n      \"content\": \"L'IRM principale est à 24 h puis à J7\",\n      \"scientificRole\": \"method or measurement definition\",\n      \"polarity\": \"AFFIRMED\",\n      \"epistemicStatus\": \"EXPLICIT_USER_STATED\",\n      \"ownership\": \"USER\",\n      \"sourceText\": \"L'IRM principale est à 24 h puis à J7\",\n      \"provenanceTurnIds\": [\n        \"I02:R1\"\n      ],\n      \"temporalContext\": \"à 24 h puis à J7\"\n    },\n    {\n      \"itemId\": \"item_5\",\n      \"content\": \"Je n'ai souvent pas d'IRM avant la thrombectomie\",\n      \"scientificRole\": \"method or measurement definition\",\n      \"polarity\": \"NEGATED\",\n      \"epistemicStatus\": \"EXPLICIT_USER_STATED\",\n      \"ownership\": \"USER\",\n      \"sourceText\": \"Je n'ai souvent pas d'IRM avant la thrombectomie\",\n      \"provenanceTurnIds\": [\n        \"I02:R1\"\n      ]\n    }\n  ],\n  \"relations\": [],\n  \"objects\": [],\n  \"inferredContext\": [],\n  \"negationsAndConstraints\": [\n    {\n      \"itemId\": \"item_nc_1\",\n      \"content\": \"Absence fréquente d'IRM avant la thrombectomie / avant le geste\",\n      \"scientificRole\": \"project variable\",\n      \"polarity\": \"NEGATED\",\n      \"epistemicStatus\": \"EXPLICIT_USER_STATED\",\n      \"ownership\": \"USER\",\n      \"sourceText\": \"je n'ai pas toujours l'IRM avant le geste\",\n      \"provenanceTurnIds\": [\n        \"I02:T0\",\n        \"I02:R1\"\n      ]\n    }\n  ],\n  \"temporalModel\": [\n    {\n      \"itemId\": \"item_t_1\",\n      \"content\": \"IRM principale à 24 h puis à J7\",\n      \"scientificRole\": \"project variable\",\n      \"polarity\": \"AFFIRMED\",\n      \"epistemicStatus\": \"EXPLICIT_USER_STATED\",\n      \"ownership\": \"USER\",\n      \"sourceText\": \"L'IRM principale est à 24 h puis à J7.\",\n      \"provenanceTurnIds\": [\n        \"I02:R1\"\n      ],\n      \"temporalContext\": \"24 h puis à J7\"\n    }\n  ],\n  \"ambiguities\": [],\n  \"missingInformation\": [],\n  \"unknowns\": [],\n  \"contradictions\": [],\n  \"correctionsAndSupersessions\": [],\n  \"contextualScientificCandidates\": [],\n  \"ownershipAndEpistemicState\": [],\n  \"clarificationCandidates\": []\n}",
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

The user aims to investigate whether Oxygen Extraction Fraction (OEF) normalizes when perfusion improves in post-thrombectomy patients. The imaging timeline primarily involves MRI at 24 hours and at Day 7, while pre-thrombectomy MRI is frequently absent.

Objectif scientifique produit :

Determine if OEF normalizes when perfusion improves in thrombectomized patients.

### EXPLICITEMENT DIT PAR LE CHERCHEUR

- content=Chez les patients thrombectomisés | scientificRole=phenomenon | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Chez les patients thrombectomisés | provenanceTurnIds=["I02:T0"]
- content=l'OEF se normalise quand la perfusion s'améliore | scientificRole=endpoint | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=l'OEF se normalise quand la perfusion s'améliore | provenanceTurnIds=["I02:T0"]
- content=je n'ai pas toujours l'IRM avant le geste | scientificRole=method or measurement definition | polarity=NEGATED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=je n'ai pas toujours l'IRM avant le geste | provenanceTurnIds=["I02:T0"]
- content=L'IRM principale est à 24 h puis à J7 | scientificRole=method or measurement definition | polarity=AFFIRMED | temporalContext=à 24 h puis à J7 | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=L'IRM principale est à 24 h puis à J7 | provenanceTurnIds=["I02:R1"]
- content=Je n'ai souvent pas d'IRM avant la thrombectomie | scientificRole=method or measurement definition | polarity=NEGATED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Je n'ai souvent pas d'IRM avant la thrombectomie | provenanceTurnIds=["I02:R1"]

### RELATIONS COMPRISES

- Aucun élément produit.

### CONTEXTE INFÉRÉ

- Aucun élément produit.

### CANDIDATS SCIENTIFIQUES CONTEXTUELS

- Aucun élément produit.

### NÉGATIONS / CONTRAINTES

- content=Absence fréquente d'IRM avant la thrombectomie / avant le geste | scientificRole=project variable | polarity=NEGATED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=je n'ai pas toujours l'IRM avant le geste | provenanceTurnIds=["I02:T0", "I02:R1"]

### TEMPORALITÉ

- content=IRM principale à 24 h puis à J7 | scientificRole=project variable | polarity=AFFIRMED | temporalContext=24 h puis à J7 | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=L'IRM principale est à 24 h puis à J7. | provenanceTurnIds=["I02:R1"]

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
