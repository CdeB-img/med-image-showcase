# I01 — DSPY_COMMON_CONTRACT — COMMON_TRANSCRIPT T1

## INPUT

Message utilisateur courant VERBATIM :

> Oui, la lésion coupable est traitée tout de suite dans les deux groupes. Je compare les autres lésions pendant l'hospitalisation à un traitement 4–6 semaines plus tard.

Conversation précédente VERBATIM :

> I01:T0 | USER : Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/common-transcript-i01-t1-dspy-common-contract.json`

```json
{
  "common_state_json": "{\n  \"originalRequest\": \"Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.\",\n  \"conversationTurns\": [\n    {\n      \"turnId\": \"I01:T0\",\n      \"role\": \"USER\",\n      \"content\": \"Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.\"\n    },\n    {\n      \"turnId\": \"I01:R1\",\n      \"role\": \"USER\",\n      \"content\": \"Oui, la lésion coupable est traitée tout de suite dans les deux groupes. Je compare les autres lésions pendant l'hospitalisation à un traitement 4–6 semaines plus tard.\"\n    }\n  ],\n  \"normalizedUnderstanding\": \"Comparison of immediate stenting vs. deferred stenting of non-culprit lesions in myocardial infarction, evaluating lesions via MRI. The culprit lesion is treated immediately in both groups, while non-culprit lesions are treated either during index hospitalization or 4-6 weeks later.\",\n  \"scientificGoal\": \"Compare immediate vs. deferred stenting of non-culprit lesions in myocardial infarction and assess lesions using MRI.\",\n  \"explicitUserStatements\": [\n    {\n      \"itemId\": \"item_1\",\n      \"content\": \"comparer le stent immédiat au stent différé dans l'infarctus\",\n      \"scientificRole\": \"phenomenon\",\n      \"polarity\": \"AFFIRMED\",\n      \"epistemicStatus\": \"EXPLICIT_USER_STATED\",\n      \"ownership\": \"USER\",\n      \"sourceText\": \"Je veux comparer le stent immédiat au stent différé dans l'infarctus\",\n      \"provenanceTurnIds\": [\n        \"I01:T0\"\n      ]\n    },\n    {\n      \"itemId\": \"item_2\",\n      \"content\": \"voir les lésions en IRM\",\n      \"scientificRole\": \"method\",\n      \"polarity\": \"AFFIRMED\",\n      \"epistemicStatus\": \"EXPLICIT_USER_STATED\",\n      \"ownership\": \"USER\",\n      \"sourceText\": \"voir les lésions en IRM\",\n      \"provenanceTurnIds\": [\n        \"I01:T0\"\n      ]\n    },\n    {\n      \"itemId\": \"item_3\",\n      \"content\": \"la lésion coupable est traitée tout de suite dans les deux groupes\",\n      \"scientificRole\": \"project variable\",\n      \"polarity\": \"AFFIRMED\",\n      \"epistemicStatus\": \"EXPLICIT_USER_STATED\",\n      \"ownership\": \"USER\",\n      \"sourceText\": \"la lésion coupable est traitée tout de suite dans les deux groupes\",\n      \"provenanceTurnIds\": [\n        \"I01:R1\"\n      ]\n    },\n    {\n      \"itemId\": \"item_4\",\n      \"content\": \"Je compare les autres lésions pendant l'hospitalisation à un traitement 4–6 semaines plus tard\",\n      \"scientificRole\": \"project variable\",\n      \"polarity\": \"AFFIRMED\",\n      \"epistemicStatus\": \"EXPLICIT_USER_STATED\",\n      \"ownership\": \"USER\",\n      \"sourceText\": \"Je compare les autres lésions pendant l'hospitalisation à un traitement 4–6 semaines plus tard.\",\n      \"provenanceTurnIds\": [\n        \"I01:R1\"\n      ]\n    }\n  ],\n  \"relations\": [\n    {\n      \"relationId\": \"rel_1\",\n      \"subject\": \"item_1\",\n      \"predicate\": \"evaluated_by\",\n      \"object\": \"item_2\",\n      \"polarity\": \"AFFIRMED\",\n      \"epistemicStatus\": \"EXPLICIT_USER_STATED\",\n      \"ownership\": \"USER\",\n      \"sourceText\": \"voir les lésions en IRM\",\n      \"provenanceTurnIds\": [\n        \"I01:T0\"\n      ]\n    }\n  ],\n  \"objects\": [],\n  \"negationsAndConstraints\": [],\n  \"temporalModel\": [\n    {\n      \"itemId\": \"temp_1\",\n      \"content\": \"traitement 4–6 semaines plus tard\",\n      \"scientificRole\": \"temporal context\",\n      \"polarity\": \"AFFIRMED\",\n      \"epistemicStatus\": \"EXPLICIT_USER_STATED\",\n      \"ownership\": \"USER\",\n      \"sourceText\": \"4–6 semaines plus tard\",\n      \"provenanceTurnIds\": [\n        \"I01:R1\"\n      ],\n      \"temporalContext\": \"4-6 weeks\"\n    }\n  ],\n  \"ambiguities\": [],\n  \"missingInformation\": [],\n  \"unknowns\": [],\n  \"contradictions\": [],\n  \"correctionsAndSupersessions\": [],\n  \"contextualScientificCandidates\": [],\n  \"inferredContext\": [],\n  \"ownershipAndEpistemicState\": [\n    {\n      \"statementId\": \"own_1\",\n      \"content\": \"Study design comparing immediate vs deferred stenting in myocardial infarction with MRI evaluation\",\n      \"epistemicStatus\": \"EXPLICIT_USER_STATED\",\n      \"owner\": \"USER\",\n      \"provenanceTurnIds\": [\n        \"I01:T0\",\n        \"I01:R1\"\n      ]\n    }\n  ],\n  \"clarificationCandidates\": []\n}",
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
- `REGENERATED_AFTER_TECHNICAL_OUTPUT_LOSS = TRUE`
- `primaryStrictPairedSample = false`

## SCIENTIFIC INTERPRETATION

### COMPRÉHENSION GLOBALE

Comparison of immediate stenting vs. deferred stenting of non-culprit lesions in myocardial infarction, evaluating lesions via MRI. The culprit lesion is treated immediately in both groups, while non-culprit lesions are treated either during index hospitalization or 4-6 weeks later.

Objectif scientifique produit :

Compare immediate vs. deferred stenting of non-culprit lesions in myocardial infarction and assess lesions using MRI.

### EXPLICITEMENT DIT PAR LE CHERCHEUR

- content=comparer le stent immédiat au stent différé dans l'infarctus | scientificRole=phenomenon | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Je veux comparer le stent immédiat au stent différé dans l'infarctus | provenanceTurnIds=["I01:T0"]
- content=voir les lésions en IRM | scientificRole=method | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=voir les lésions en IRM | provenanceTurnIds=["I01:T0"]
- content=la lésion coupable est traitée tout de suite dans les deux groupes | scientificRole=project variable | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=la lésion coupable est traitée tout de suite dans les deux groupes | provenanceTurnIds=["I01:R1"]
- content=Je compare les autres lésions pendant l'hospitalisation à un traitement 4–6 semaines plus tard | scientificRole=project variable | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Je compare les autres lésions pendant l'hospitalisation à un traitement 4–6 semaines plus tard. | provenanceTurnIds=["I01:R1"]

### RELATIONS COMPRISES

- subject=item_1 | predicate=evaluated_by | object=item_2 | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=voir les lésions en IRM | provenanceTurnIds=["I01:T0"]

### CONTEXTE INFÉRÉ

- Aucun élément produit.

### CANDIDATS SCIENTIFIQUES CONTEXTUELS

- Aucun élément produit.

### NÉGATIONS / CONTRAINTES

- Aucun élément produit.

### TEMPORALITÉ

- content=traitement 4–6 semaines plus tard | scientificRole=temporal context | polarity=AFFIRMED | temporalContext=4-6 weeks | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=4–6 semaines plus tard | provenanceTurnIds=["I01:R1"]

### AMBIGUÏTÉS

- Aucun élément produit.

### INFORMATIONS MANQUANTES

- Aucun élément produit.

### INCONNUES

- Aucun élément produit.

### CORRECTIONS / SUPERSESSIONS

- Aucun élément produit.

### OWNERSHIP / STATUT ÉPISTÉMIQUE

- content=Study design comparing immediate vs deferred stenting in myocardial infarction with MRI evaluation | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I01:T0", "I01:R1"]

### QUESTIONS DE CLARIFICATION CANDIDATES

- Aucun élément produit.

## MISSING STRUCTURAL GUARANTEES

- PRIMARY_STRICT_PAIRED_SAMPLE_LOST

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
