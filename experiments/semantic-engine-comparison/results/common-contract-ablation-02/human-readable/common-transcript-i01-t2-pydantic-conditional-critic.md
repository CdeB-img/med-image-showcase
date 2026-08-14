# I01 — PYDANTIC_CONDITIONAL_CRITIC — COMMON_TRANSCRIPT T2

## INPUT

Message utilisateur courant VERBATIM :

> La taille d'infarctus sera le critère principal en CMR à J3–J5, la MVO secondaire. Je ne veux pas de strain.

Conversation précédente VERBATIM :

> I01:T0 | USER : Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.
> I01:R1 | USER : Oui, la lésion coupable est traitée tout de suite dans les deux groupes. Je compare les autres lésions pendant l'hospitalisation à un traitement 4–6 semaines plus tard.

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/common-transcript-i01-t2-pydantic-conditional-critic.json`

```json
{
  "criticOutput": {
    "correctedState": {
      "ambiguities": [],
      "clarificationCandidates": [],
      "contextualScientificCandidates": [
        {
          "basis": "I01:T0",
          "content": "IRM cardiaque envisagée pour voir les lésions dans le cadre de l'infarctus du myocarde.",
          "epistemicStatus": "INFERRED_HIGH_CONFIDENCE",
          "itemId": "csc_01",
          "ownership": "USER",
          "polarity": "AFFIRMED",
          "provenanceTurnIds": [
            "I01:T0"
          ],
          "scientificRole": "method or measurement definition",
          "sourceText": "voir les lésions en IRM",
          "temporalContext": "durant l'infarctus"
        }
      ],
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
        },
        {
          "content": "La taille d'infarctus sera le critère principal en CMR à J3–J5, la MVO secondaire. Je ne veux pas de strain.",
          "role": "USER",
          "turnId": "I01:R2"
        }
      ],
      "correctionsAndSupersessions": [],
      "explicitUserStatements": [
        {
          "basis": "I01:T0",
          "content": "Je veux comparer le stent immédiat au stent différé dans l'infarctus",
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "itemId": "estmt_01",
          "ownership": "USER",
          "polarity": "AFFIRMED",
          "provenanceTurnIds": [
            "I01:T0"
          ],
          "scientificRole": "project variable",
          "sourceText": "comparer le stent immédiat au stent différé dans l'infarctus",
          "temporalContext": "infarctus"
        },
        {
          "basis": "I01:R1",
          "content": "La lésion coupable est traitée tout de suite dans les deux groupes.",
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "itemId": "estmt_02",
          "ownership": "USER",
          "polarity": "AFFIRMED",
          "provenanceTurnIds": [
            "I01:R1"
          ],
          "scientificRole": "method or measurement definition",
          "sourceText": "la lésion coupable est traitée tout de suite dans les deux groupes",
          "temporalContext": "immédiat (tout de suite)"
        },
        {
          "basis": "I01:R1",
          "content": "Je compare les autres lésions pendant l'hospitalisation à un traitement 4–6 semaines plus tard.",
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "itemId": "estmt_03",
          "ownership": "USER",
          "polarity": "AFFIRMED",
          "provenanceTurnIds": [
            "I01:R1"
          ],
          "scientificRole": "project variable",
          "sourceText": "Je compare les autres lésions pendant l'hospitalisation à un traitement 4–6 semaines plus tard.",
          "temporalContext": "pendant l'hospitalisation versus 4-6 semaines plus tard"
        },
        {
          "basis": "I01:R2",
          "content": "La taille d'infarctus sera le critère principal en CMR à J3–J5",
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "itemId": "estmt_04",
          "ownership": "USER",
          "polarity": "AFFIRMED",
          "provenanceTurnIds": [
            "I01:R2"
          ],
          "scientificRole": "endpoint",
          "sourceText": "La taille d'infarctus sera le critère principal en CMR à J3–J5",
          "temporalContext": "J3-J5"
        },
        {
          "basis": "I01:R2",
          "content": "la MVO secondaire",
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "itemId": "estmt_05",
          "ownership": "USER",
          "polarity": "AFFIRMED",
          "provenanceTurnIds": [
            "I01:R2"
          ],
          "scientificRole": "endpoint",
          "sourceText": "la MVO secondaire",
          "temporalContext": "non spécifié"
        },
        {
          "basis": "I01:R2",
          "content": "Je ne veux pas de strain.",
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "itemId": "estmt_06",
          "ownership": "USER",
          "polarity": "NEGATED",
          "provenanceTurnIds": [
            "I01:R2"
          ],
          "scientificRole": "method or measurement definition",
          "sourceText": "Je ne veux pas de strain.",
          "temporalContext": "non spécifié"
        }
      ],
      "inferredContext": [],
      "missingInformation": [],
      "negationsAndConstraints": [
        {
          "basis": "I01:R2",
          "content": "Pas de mesure du strain en CMR",
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "itemId": "neg_01",
          "ownership": "USER",
          "polarity": "NEGATED",
          "provenanceTurnIds": [
            "I01:R2"
          ],
          "scientificRole": "method or measurement definition",
          "sourceText": "Je ne veux pas de strain.",
          "temporalContext": "non spécifié"
        }
      ],
      "normalizedUnderstanding": "Comparaison entre le stent immédiat et le stent différé des lésions non coupables dans l'infarctus du myocarde, avec traitement initial de la lésion coupable dans les deux groupes. Le groupe stent immédiat traite les autres lésions pendant l'hospitalisation, tandis que le groupe stent différé les traite 4 à 6 semaines plus tard. Le critère de jugement principal est la taille d'infarctus mesurée par CMR à J3–J5, le critère secondaire étant la MVO (microvascular obstruction), sans évaluation par strain.",
      "objects": [
        {
          "basis": "I01:T0",
          "content": "Stent immédiat vs stent différé dans l'infarctus",
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "itemId": "obj_01",
          "ownership": "USER",
          "polarity": "AFFIRMED",
          "provenanceTurnIds": [
            "I01:T0",
            "I01:R1"
          ],
          "scientificRole": "project variable",
          "sourceText": "stent immédiat au stent différé dans l'infarctus",
          "temporalContext": "infarctus"
        },
        {
          "basis": "I01:R2",
          "content": "Taille d'infarctus (critère principal) et MVO (critère secondaire) en CMR à J3-J5",
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "itemId": "obj_02",
          "ownership": "USER",
          "polarity": "AFFIRMED",
          "provenanceTurnIds": [
            "I01:R2"
          ],
          "scientificRole": "endpoint",
          "sourceText": "La taille d'infarctus sera le critère principal en CMR à J3–J5, la MVO secondaire.",
          "temporalContext": "J3-J5"
        }
      ],
      "originalRequest": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
      "ownershipAndEpistemicState": [
        {
          "content": "Comparaison de stratégies de stent immédiat versus différé pour les lésions non coupables dans l'infarctus.",
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "owner": "USER",
          "provenanceTurnIds": [],
          "statementId": "st_01"
        },
        {
          "content": "La taille d'infarctus en CMR à J3-J5 est le critère principal et la MVO est le critère secondaire.",
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "owner": "USER",
          "provenanceTurnIds": [],
          "statementId": "st_02"
        },
        {
          "content": "Absence d'évaluation du strain.",
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "owner": "USER",
          "provenanceTurnIds": [],
          "statementId": "st_03"
        }
      ],
      "relations": [
        {
          "basis": "I01:R2",
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "object": "estmt_04",
          "ownership": "USER",
          "polarity": "AFFIRMED",
          "predicate": "hasPrimaryEndpoint",
          "provenanceTurnIds": [
            "I01:R2"
          ],
          "relationId": "rel_01",
          "sourceText": "La taille d'infarctus sera le critère principal en CMR à J3–J5",
          "subject": "estmt_01",
          "temporalContext": "J3-J5"
        },
        {
          "basis": "I01:R2",
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "object": "estmt_05",
          "ownership": "USER",
          "polarity": "AFFIRMED",
          "predicate": "hasSecondaryEndpoint",
          "provenanceTurnIds": [
            "I01:R2"
          ],
          "relationId": "rel_02",
          "sourceText": "la MVO secondaire",
          "subject": "estmt_01",
          "temporalContext": "non spécifié"
        }
      ],
      "scientificGoal": "Comparer le stent immédiat au stent différé des lésions non coupables dans l'infarctus du myocarde, avec pour critère principal la taille d'infarctus en CMR à J3-J5 et comme critère secondaire la MVO.",
      "temporalModel": [],
      "unknowns": []
    },
    "rationale": "The state is fully consistent with the provided conversation turns and exhibits correct fidelity, ownership, epistemic status, and scientific roles. No meaningful corrections are required.",
    "verdict": "ACCEPT"
  },
  "criticTrigger": {
    "reasons": [
      "NEGATIONS_OR_CONSTRAINTS_PRESENT",
      "CONTEXTUAL_CANDIDATES_PRESENT",
      "OWNERSHIP_OR_EPISTEMIC_CONFLICT"
    ],
    "required": true
  },
  "firstOutput": {
    "ambiguities": [],
    "clarificationCandidates": [],
    "contextualScientificCandidates": [
      {
        "basis": "I01:T0",
        "content": "IRM cardiaque envisagée pour voir les lésions dans le cadre de l'infarctus du myocarde.",
        "epistemicStatus": "INFERRED_HIGH_CONFIDENCE",
        "itemId": "csc_01",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I01:T0"
        ],
        "scientificRole": "method or measurement definition",
        "sourceText": "voir les lésions en IRM",
        "temporalContext": "durant l'infarctus"
      }
    ],
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
      },
      {
        "content": "La taille d'infarctus sera le critère principal en CMR à J3–J5, la MVO secondaire. Je ne veux pas de strain.",
        "role": "USER",
        "turnId": "I01:R2"
      }
    ],
    "correctionsAndSupersessions": [],
    "explicitUserStatements": [
      {
        "basis": "I01:T0",
        "content": "Je veux comparer le stent immédiat au stent différé dans l'infarctus",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "estmt_01",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I01:T0"
        ],
        "scientificRole": "project variable",
        "sourceText": "comparer le stent immédiat au stent différé dans l'infarctus",
        "temporalContext": "infarctus"
      },
      {
        "basis": "I01:R1",
        "content": "La lésion coupable est traitée tout de suite dans les deux groupes.",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "estmt_02",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I01:R1"
        ],
        "scientificRole": "method or measurement definition",
        "sourceText": "la lésion coupable est traitée tout de suite dans les deux groupes",
        "temporalContext": "immédiat (tout de suite)"
      },
      {
        "basis": "I01:R1",
        "content": "Je compare les autres lésions pendant l'hospitalisation à un traitement 4–6 semaines plus tard.",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "estmt_03",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I01:R1"
        ],
        "scientificRole": "project variable",
        "sourceText": "Je compare les autres lésions pendant l'hospitalisation à un traitement 4–6 semaines plus tard.",
        "temporalContext": "pendant l'hospitalisation versus 4-6 semaines plus tard"
      },
      {
        "basis": "I01:R2",
        "content": "La taille d'infarctus sera le critère principal en CMR à J3–J5",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "estmt_04",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I01:R2"
        ],
        "scientificRole": "endpoint",
        "sourceText": "La taille d'infarctus sera le critère principal en CMR à J3–J5",
        "temporalContext": "J3-J5"
      },
      {
        "basis": "I01:R2",
        "content": "la MVO secondaire",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "estmt_05",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I01:R2"
        ],
        "scientificRole": "endpoint",
        "sourceText": "la MVO secondaire",
        "temporalContext": "non spécifié"
      },
      {
        "basis": "I01:R2",
        "content": "Je ne veux pas de strain.",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "estmt_06",
        "ownership": "USER",
        "polarity": "NEGATED",
        "provenanceTurnIds": [
          "I01:R2"
        ],
        "scientificRole": "method or measurement definition",
        "sourceText": "Je ne veux pas de strain.",
        "temporalContext": "non spécifié"
      }
    ],
    "inferredContext": [],
    "missingInformation": [],
    "negationsAndConstraints": [
      {
        "basis": "I01:R2",
        "content": "Pas de mesure du strain en CMR",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "neg_01",
        "ownership": "USER",
        "polarity": "NEGATED",
        "provenanceTurnIds": [
          "I01:R2"
        ],
        "scientificRole": "method or measurement definition",
        "sourceText": "Je ne veux pas de strain.",
        "temporalContext": "non spécifié"
      }
    ],
    "normalizedUnderstanding": "Comparaison entre le stent immédiat et le stent différé des lésions non coupables dans l'infarctus du myocarde, avec traitement initial de la lésion coupable dans les deux groupes. Le groupe stent immédiat traite les autres lésions pendant l'hospitalisation, tandis que le groupe stent différé les traite 4 à 6 semaines plus tard. Le critère de jugement principal est la taille d'infarctus mesurée par CMR à J3–J5, le critère secondaire étant la MVO (microvascular obstruction), sans évaluation par strain.",
    "objects": [
      {
        "basis": "I01:T0",
        "content": "Stent immédiat vs stent différé dans l'infarctus",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "obj_01",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I01:T0",
          "I01:R1"
        ],
        "scientificRole": "project variable",
        "sourceText": "stent immédiat au stent différé dans l'infarctus",
        "temporalContext": "infarctus"
      },
      {
        "basis": "I01:R2",
        "content": "Taille d'infarctus (critère principal) et MVO (critère secondaire) en CMR à J3-J5",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "itemId": "obj_02",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "provenanceTurnIds": [
          "I01:R2"
        ],
        "scientificRole": "endpoint",
        "sourceText": "La taille d'infarctus sera le critère principal en CMR à J3–J5, la MVO secondaire.",
        "temporalContext": "J3-J5"
      }
    ],
    "originalRequest": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
    "ownershipAndEpistemicState": [
      {
        "content": "Comparaison de stratégies de stent immédiat versus différé pour les lésions non coupables dans l'infarctus.",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "owner": "USER",
        "provenanceTurnIds": [],
        "statementId": "st_01"
      },
      {
        "content": "La taille d'infarctus en CMR à J3-J5 est le critère principal et la MVO est le critère secondaire.",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "owner": "USER",
        "provenanceTurnIds": [],
        "statementId": "st_02"
      },
      {
        "content": "Absence d'évaluation du strain.",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "owner": "USER",
        "provenanceTurnIds": [],
        "statementId": "st_03"
      }
    ],
    "relations": [
      {
        "basis": "I01:R2",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "object": "estmt_04",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "predicate": "hasPrimaryEndpoint",
        "provenanceTurnIds": [
          "I01:R2"
        ],
        "relationId": "rel_01",
        "sourceText": "La taille d'infarctus sera le critère principal en CMR à J3–J5",
        "subject": "estmt_01",
        "temporalContext": "J3-J5"
      },
      {
        "basis": "I01:R2",
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "object": "estmt_05",
        "ownership": "USER",
        "polarity": "AFFIRMED",
        "predicate": "hasSecondaryEndpoint",
        "provenanceTurnIds": [
          "I01:R2"
        ],
        "relationId": "rel_02",
        "sourceText": "la MVO secondaire",
        "subject": "estmt_01",
        "temporalContext": "non spécifié"
      }
    ],
    "scientificGoal": "Comparer le stent immédiat au stent différé des lésions non coupables dans l'infarctus du myocarde, avec pour critère principal la taille d'infarctus en CMR à J3-J5 et comme critère secondaire la MVO.",
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

Comparaison entre le stent immédiat et le stent différé des lésions non coupables dans l'infarctus du myocarde, avec traitement initial de la lésion coupable dans les deux groupes. Le groupe stent immédiat traite les autres lésions pendant l'hospitalisation, tandis que le groupe stent différé les traite 4 à 6 semaines plus tard. Le critère de jugement principal est la taille d'infarctus mesurée par CMR à J3–J5, le critère secondaire étant la MVO (microvascular obstruction), sans évaluation par strain.

Objectif scientifique produit :

Comparer le stent immédiat au stent différé des lésions non coupables dans l'infarctus du myocarde, avec pour critère principal la taille d'infarctus en CMR à J3-J5 et comme critère secondaire la MVO.

### EXPLICITEMENT DIT PAR LE CHERCHEUR

- content=Je veux comparer le stent immédiat au stent différé dans l'infarctus | scientificRole=project variable | polarity=AFFIRMED | temporalContext=infarctus | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | basis=I01:T0 | sourceText=comparer le stent immédiat au stent différé dans l'infarctus | provenanceTurnIds=["I01:T0"]
- content=La lésion coupable est traitée tout de suite dans les deux groupes. | scientificRole=method or measurement definition | polarity=AFFIRMED | temporalContext=immédiat (tout de suite) | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | basis=I01:R1 | sourceText=la lésion coupable est traitée tout de suite dans les deux groupes | provenanceTurnIds=["I01:R1"]
- content=Je compare les autres lésions pendant l'hospitalisation à un traitement 4–6 semaines plus tard. | scientificRole=project variable | polarity=AFFIRMED | temporalContext=pendant l'hospitalisation versus 4-6 semaines plus tard | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | basis=I01:R1 | sourceText=Je compare les autres lésions pendant l'hospitalisation à un traitement 4–6 semaines plus tard. | provenanceTurnIds=["I01:R1"]
- content=La taille d'infarctus sera le critère principal en CMR à J3–J5 | scientificRole=endpoint | polarity=AFFIRMED | temporalContext=J3-J5 | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | basis=I01:R2 | sourceText=La taille d'infarctus sera le critère principal en CMR à J3–J5 | provenanceTurnIds=["I01:R2"]
- content=la MVO secondaire | scientificRole=endpoint | polarity=AFFIRMED | temporalContext=non spécifié | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | basis=I01:R2 | sourceText=la MVO secondaire | provenanceTurnIds=["I01:R2"]
- content=Je ne veux pas de strain. | scientificRole=method or measurement definition | polarity=NEGATED | temporalContext=non spécifié | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | basis=I01:R2 | sourceText=Je ne veux pas de strain. | provenanceTurnIds=["I01:R2"]

### RELATIONS COMPRISES

- subject=estmt_01 | predicate=hasPrimaryEndpoint | object=estmt_04 | polarity=AFFIRMED | temporalContext=J3-J5 | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | basis=I01:R2 | sourceText=La taille d'infarctus sera le critère principal en CMR à J3–J5 | provenanceTurnIds=["I01:R2"]
- subject=estmt_01 | predicate=hasSecondaryEndpoint | object=estmt_05 | polarity=AFFIRMED | temporalContext=non spécifié | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | basis=I01:R2 | sourceText=la MVO secondaire | provenanceTurnIds=["I01:R2"]

### CONTEXTE INFÉRÉ

- Aucun élément produit.

### CANDIDATS SCIENTIFIQUES CONTEXTUELS

- content=IRM cardiaque envisagée pour voir les lésions dans le cadre de l'infarctus du myocarde. | scientificRole=method or measurement definition | polarity=AFFIRMED | temporalContext=durant l'infarctus | epistemicStatus=INFERRED_HIGH_CONFIDENCE | ownership=USER | basis=I01:T0 | sourceText=voir les lésions en IRM | provenanceTurnIds=["I01:T0"]

### NÉGATIONS / CONTRAINTES

- content=Pas de mesure du strain en CMR | scientificRole=method or measurement definition | polarity=NEGATED | temporalContext=non spécifié | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | basis=I01:R2 | sourceText=Je ne veux pas de strain. | provenanceTurnIds=["I01:R2"]

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

- content=Comparaison de stratégies de stent immédiat versus différé pour les lésions non coupables dans l'infarctus. | epistemicStatus=EXPLICIT_USER_STATED | owner=USER
- content=La taille d'infarctus en CMR à J3-J5 est le critère principal et la MVO est le critère secondaire. | epistemicStatus=EXPLICIT_USER_STATED | owner=USER
- content=Absence d'évaluation du strain. | epistemicStatus=EXPLICIT_USER_STATED | owner=USER

### QUESTIONS DE CLARIFICATION CANDIDATES

- Aucun élément produit.

## MISSING STRUCTURAL GUARANTEES

- EXACT_PROVIDER_RAW_TEXT_NOT_PERSISTED; STRUCTURED_NATIVE_ARTIFACT_AVAILABLE

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
