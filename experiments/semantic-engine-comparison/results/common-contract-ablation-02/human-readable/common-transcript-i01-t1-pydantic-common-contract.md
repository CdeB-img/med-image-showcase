# I01 — PYDANTIC_COMMON_CONTRACT — COMMON_TRANSCRIPT T1

## INPUT

Message utilisateur courant VERBATIM :

> Oui, la lésion coupable est traitée tout de suite dans les deux groupes. Je compare les autres lésions pendant l'hospitalisation à un traitement 4–6 semaines plus tard.

Conversation précédente VERBATIM :

> I01:T0 | USER : Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/common-transcript-i01-t1-pydantic-common-contract.json`

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
        "turnId": "I01:T0"
      },
      {
        "content": "Oui, la lésion coupable est traitée tout de suite dans les deux groupes. Je compare les autres lésions pendant l'hospitalisation à un traitement 4–6 semaines plus tard.",
        "role": "USER",
        "turnId": "I01:R1"
      }
    ],
    "correctionsAndSupersessions": [],
    "explicitUserStatements": [
      {
        "basis": "I01:T0",
        "content": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "stmt_001",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I01:T0"
        ],
        "scientificRole": "PRIMARY_USER_REQUEST",
        "sourceText": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
        "temporalContext": null
      },
      {
        "basis": "I01:R1",
        "content": "Oui, la lésion coupable est traitée tout de suite dans les deux groupes. Je compare les autres lésions pendant l'hospitalisation à un traitement 4–6 semaines plus tard.",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "stmt_002",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I01:R1"
        ],
        "scientificRole": "PROJECT_DECISION",
        "sourceText": "Oui, la lésion coupable est traitée tout de suite dans les deux groupes. Je compare les autres lésions pendant l'hospitalisation à un traitement 4–6 semaines plus tard.",
        "temporalContext": null
      }
    ],
    "inferredContext": [],
    "missingInformation": [],
    "negationsAndConstraints": [],
    "normalizedUnderstanding": "Comparison between immediate stenting and deferred stenting in myocardial infarction, assessing lesions via MRI, where the culprit lesion is treated immediately in both groups, comparing non-culprit/other lesions treated during hospitalization versus 4-6 weeks later.",
    "objects": [],
    "originalRequest": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
    "ownershipAndEpistemicState": [],
    "relations": [],
    "scientificGoal": "Compare immediate stenting versus deferred stenting strategies in myocardial infarction with MRI evaluation of lesions.",
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

Comparison between immediate stenting and deferred stenting in myocardial infarction, assessing lesions via MRI, where the culprit lesion is treated immediately in both groups, comparing non-culprit/other lesions treated during hospitalization versus 4-6 weeks later.

Objectif scientifique produit :

Compare immediate stenting versus deferred stenting strategies in myocardial infarction with MRI evaluation of lesions.

### EXPLICITEMENT DIT PAR LE CHERCHEUR

- content=Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM. | scientificRole=PRIMARY_USER_REQUEST | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | basis=I01:T0 | sourceText=Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM. | provenanceTurnIds=["I01:T0"]
- content=Oui, la lésion coupable est traitée tout de suite dans les deux groupes. Je compare les autres lésions pendant l'hospitalisation à un traitement 4–6 semaines plus tard. | scientificRole=PROJECT_DECISION | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | basis=I01:R1 | sourceText=Oui, la lésion coupable est traitée tout de suite dans les deux groupes. Je compare les autres lésions pendant l'hospitalisation à un traitement 4–6 semaines plus tard. | provenanceTurnIds=["I01:R1"]

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

- EXACT_PROVIDER_RAW_TEXT_NOT_PERSISTED; STRUCTURED_NATIVE_ARTIFACT_AVAILABLE

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
