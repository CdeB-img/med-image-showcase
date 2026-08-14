# I08 — SEM_SINGLE_PASS — INTERACTIVE T1

## INPUT

Message utilisateur courant VERBATIM :

> Non

Conversation précédente VERBATIM :

> I08:SEM_SINGLE_PASS:T0 | USER : Dans Fabry, on pense que le T1 natif pourrait être intéressant avant la fibrose, mais je n'ai pas décidé d'en faire le critère principal. À Lyon ils font aussi de l'ECV. Je veux surtout trouver un marqueur précoce qui soit utilisable dans tous les centres.
> I08:SEM_SINGLE_PASS:Q1 | ASSISTANT : Souhaitez-vous définir formellement le T1 natif comme critère principal de l'étude ou conserver cette question ouverte ?

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/interactive-i08-t1-sem-single-pass.json`

```json
{
  "deterministicCoverage": {
    "explicit": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "INV_01",
          "mappedClientElementIds": [
            "sem-element:ke1-b4c3c91b3ce8d0af"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Maladie de Fabry",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "Fabry"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "INV_02",
          "mappedClientElementIds": [
            "sem-element:ke1-bb98f5f3e61f629f"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "T1 natif",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "T1 natif"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "INV_03",
          "mappedClientElementIds": [
            "sem-element:ke1-4cfde86fc77e8703"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "fibrose",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "fibrose"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "INV_04",
          "mappedClientElementIds": [
            "sem-element:ke1-9670951383f53f87"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "avant la fibrose",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "avant la fibrose"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "INV_05",
          "mappedClientElementIds": [
            "sem-element:ke1-08ca25787a622b04"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "statut de critère principal non décidé pour le T1 natif",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "je n'ai pas décidé d'en faire le critère principal"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "INV_06",
          "mappedClientElementIds": [
            "sem-element:ke1-30a2ff4042cb4464"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Centre de Lyon",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "Lyon"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "INV_07",
          "mappedClientElementIds": [
            "sem-element:ke1-1afe27a72610c393"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "ECV",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "ECV"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "INV_08",
          "mappedClientElementIds": [
            "sem-element:ke1-e2421addbfdae4f1"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "marqueur précoce",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "marqueur précoce"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "INV_09",
          "mappedClientElementIds": [
            "sem-element:ke1-edd56e098b73fb75"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "utilisable dans tous les centres",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "utilisable dans tous les centres"
        },
        {
          "coverageStatus": "UNRESOLVED_EXPLICIT_FRAGMENT",
          "inventoryItemId": "INV_10",
          "mappedClientElementIds": [],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Non",
          "reason": "The exact inventory fragment has no source-grounded typed Semantic Element mapping.",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:R1",
          "sourceText": "Non"
        }
      ],
      "status": "INCOMPLETE"
    },
    "integrity": {
      "findings": [],
      "status": "COMPLETE"
    },
    "relations": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "REL_01",
          "mappedClientRelationIds": [
            "sem-relation:ke1-51e03717530735ab"
          ],
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "INV_02",
          "targetInventoryItemId": "INV_01"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "REL_02",
          "mappedClientRelationIds": [
            "sem-relation:ke1-865b74b3fb259e1f"
          ],
          "normalizedRelation": "REPEATED_AT",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "INV_02",
          "targetInventoryItemId": "INV_04"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "REL_03",
          "mappedClientRelationIds": [
            "sem-relation:ke1-b6c0507c5822ef98"
          ],
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "INV_07",
          "targetInventoryItemId": "INV_06"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "REL_04",
          "mappedClientRelationIds": [
            "sem-relation:ke1-00a012b09b3c5414"
          ],
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "INV_08",
          "targetInventoryItemId": "INV_09"
        }
      ],
      "status": "COMPLETE"
    },
    "taxonomy": {
      "findings": [
        {
          "clientElementId": "sem-element:ke1-1afe27a72610c393",
          "code": "SELECTED_JUDGING_VARIABLE_NOT_ENDPOINT",
          "currentType": "BIOMARKER",
          "expectedStudyRole": "OUTCOME_ROLE",
          "expectedType": "ENDPOINT",
          "reason": "A variable explicitly selected as what must count to judge the study is an ENDPOINT role in this context; its underlying observable nature must not erase that expressed project role."
        },
        {
          "clientElementId": "sem-element:ke1-4cfde86fc77e8703",
          "code": "SELECTED_JUDGING_VARIABLE_NOT_ENDPOINT",
          "currentType": "SCIENTIFIC_OBJECT",
          "expectedStudyRole": "OUTCOME_ROLE",
          "expectedType": "ENDPOINT",
          "reason": "A variable explicitly selected as what must count to judge the study is an ENDPOINT role in this context; its underlying observable nature must not erase that expressed project role."
        },
        {
          "clientElementId": "sem-element:ke1-bb98f5f3e61f629f",
          "code": "SELECTED_JUDGING_VARIABLE_NOT_ENDPOINT",
          "currentType": "BIOMARKER",
          "expectedStudyRole": "OUTCOME_ROLE",
          "expectedType": "ENDPOINT",
          "reason": "A variable explicitly selected as what must count to judge the study is an ENDPOINT role in this context; its underlying observable nature must not erase that expressed project role."
        },
        {
          "clientElementId": "sem-element:ke1-e2421addbfdae4f1",
          "code": "SELECTED_JUDGING_VARIABLE_NOT_ENDPOINT",
          "currentType": "BIOMARKER",
          "expectedStudyRole": "OUTCOME_ROLE",
          "expectedType": "ENDPOINT",
          "reason": "A variable explicitly selected as what must count to judge the study is an ENDPOINT role in this context; its underlying observable nature must not erase that expressed project role."
        }
      ],
      "status": "INCOMPLETE"
    }
  },
  "initialReconstruction": {
    "ambiguities": [
      "Le choix exact du critère principal de l'étude n'est pas encore arrêté suite au rejet de sa désignation immédiate."
    ],
    "candidateId": "candidate:ke1-bcf67b9cf98dc298-fix01",
    "clarificationCandidates": [],
    "contradictions": [],
    "elements": [
      {
        "canonicalMeaning": "Statut de critère principal non décidé pour le T1 natif",
        "clientElementId": "sem-element:ke1-08ca25787a622b04",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "INV_05"
        ],
        "polarity": "UNCERTAIN",
        "requiresConfirmation": false,
        "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
        "sourceText": "je n'ai pas décidé d'en faire le critère principal",
        "studyRole": "NONE",
        "supersedesElementIds": [
          "sem-element:ke1-08ca25787a622b04"
        ],
        "type": "UNKNOWN"
      },
      {
        "canonicalMeaning": "ECV (Extracellular Volume fraction)",
        "clientElementId": "sem-element:ke1-1afe27a72610c393",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "INV_07"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
        "sourceText": "ECV",
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [
          "sem-element:ke1-1afe27a72610c393"
        ],
        "type": "BIOMARKER"
      },
      {
        "canonicalMeaning": "Centre de Lyon",
        "clientElementId": "sem-element:ke1-30a2ff4042cb4464",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "INV_06"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
        "sourceText": "Lyon",
        "studyRole": "NONE",
        "supersedesElementIds": [
          "sem-element:ke1-30a2ff4042cb4464"
        ],
        "type": "STUDY_DESIGN"
      },
      {
        "canonicalMeaning": "Imagerie par résonance magnétique ou mesure T1/ECV",
        "clientElementId": "sem-element:ke1-42c79da828e8e32c",
        "confidence": 0.8,
        "epistemicStatus": "INFERRED_HIGH_CONFIDENCE",
        "inferenceReason": "T1 natif and ECV imply underlying cardiac MRI or mapping methods.",
        "inventoryItemIds": [],
        "polarity": "AFFIRMED",
        "requiresConfirmation": true,
        "sourceMessageId": null,
        "sourceText": null,
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "METHOD"
      },
      {
        "canonicalMeaning": "Fibrose",
        "clientElementId": "sem-element:ke1-4cfde86fc77e8703",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "INV_03"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
        "sourceText": "fibrose",
        "studyRole": "NONE",
        "supersedesElementIds": [
          "sem-element:ke1-4cfde86fc77e8703"
        ],
        "type": "SCIENTIFIC_OBJECT"
      },
      {
        "canonicalMeaning": "Avant la fibrose",
        "clientElementId": "sem-element:ke1-9670951383f53f87",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "INV_04"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
        "sourceText": "avant la fibrose",
        "studyRole": "NONE",
        "supersedesElementIds": [
          "sem-element:ke1-9670951383f53f87"
        ],
        "type": "TIMING"
      },
      {
        "canonicalMeaning": "Maladie de Fabry",
        "clientElementId": "sem-element:ke1-b4c3c91b3ce8d0af",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "INV_01"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
        "sourceText": "Fabry",
        "studyRole": "NONE",
        "supersedesElementIds": [
          "sem-element:ke1-b4c3c91b3ce8d0af"
        ],
        "type": "CONDITION"
      },
      {
        "canonicalMeaning": "T1 natif",
        "clientElementId": "sem-element:ke1-bb98f5f3e61f629f",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "INV_02"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
        "sourceText": "T1 natif",
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [
          "sem-element:ke1-bb98f5f3e61f629f"
        ],
        "type": "BIOMARKER"
      },
      {
        "canonicalMeaning": "Marqueur précoce",
        "clientElementId": "sem-element:ke1-e2421addbfdae4f1",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "INV_08"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
        "sourceText": "marqueur précoce",
        "studyRole": "OUTCOME_ROLE",
        "supersedesElementIds": [
          "sem-element:ke1-e2421addbfdae4f1"
        ],
        "type": "BIOMARKER"
      },
      {
        "canonicalMeaning": "Utilisable dans tous les centres",
        "clientElementId": "sem-element:ke1-edd56e098b73fb75",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "INV_09"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
        "sourceText": "utilisable dans tous les centres",
        "studyRole": "NONE",
        "supersedesElementIds": [
          "sem-element:ke1-edd56e098b73fb75"
        ],
        "type": "STUDY_DESIGN"
      }
    ],
    "ellipses": [],
    "knowledgeRequests": [],
    "language": "fr",
    "missingConcepts": [],
    "normalizedMeaning": "Analyse exploratoire de la maladie de Fabry évaluant le T1 natif avant la phase de fibrose, sans l'avoir fixé comme critère principal suite à la question de clarification, en tenant compte de l'ECV mesurée à Lyon, avec l'objectif prioritaire d'identifier un marqueur précoce universellement mesurable dans tous les centres.",
    "relations": [
      {
        "clientRelationId": "sem-relation:ke1-00a012b09b3c5414",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "REL_04"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "sourceClientElementId": "sem-element:ke1-e2421addbfdae4f1",
        "targetClientElementId": "sem-element:ke1-edd56e098b73fb75"
      },
      {
        "clientRelationId": "sem-relation:ke1-51e03717530735ab",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "REL_01"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "sourceClientElementId": "sem-element:ke1-bb98f5f3e61f629f",
        "targetClientElementId": "sem-element:ke1-b4c3c91b3ce8d0af"
      },
      {
        "clientRelationId": "sem-relation:ke1-865b74b3fb259e1f",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "REL_02"
        ],
        "polarity": "AFFIRMED",
        "relationType": "REPEATED_AT",
        "requiresConfirmation": false,
        "sourceClientElementId": "sem-element:ke1-bb98f5f3e61f629f",
        "targetClientElementId": "sem-element:ke1-9670951383f53f87"
      },
      {
        "clientRelationId": "sem-relation:ke1-b6c0507c5822ef98",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "REL_03"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "sourceClientElementId": "sem-element:ke1-1afe27a72610c393",
        "targetClientElementId": "sem-element:ke1-30a2ff4042cb4464"
      }
    ],
    "routeProposal": {
      "confidence": 0.9,
      "expectedCapabilities": [
        "STUDY_DESIGN_STRUCTURING",
        "POPULATION_SETTING"
      ],
      "reason": "L'utilisateur configure les aspects méthodologiques et opérationnels d'une étude clinique sur la maladie de Fabry sans nécessiter de formalisation théorique préalable.",
      "route": "DESIGN_STUDY"
    },
    "semanticInventory": {
      "explicitFragments": [
        {
          "inventoryItemId": "INV_01",
          "linkedInventoryItemIds": [],
          "localRole": "condition",
          "modifiers": [],
          "normalizedLabel": "Maladie de Fabry",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "Fabry"
        },
        {
          "inventoryItemId": "INV_02",
          "linkedInventoryItemIds": [],
          "localRole": "biomarker",
          "modifiers": [],
          "normalizedLabel": "T1 natif",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "T1 natif"
        },
        {
          "inventoryItemId": "INV_03",
          "linkedInventoryItemIds": [],
          "localRole": "scientific_object",
          "modifiers": [],
          "normalizedLabel": "fibrose",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "fibrose"
        },
        {
          "inventoryItemId": "INV_04",
          "linkedInventoryItemIds": [
            "INV_03"
          ],
          "localRole": "timing",
          "modifiers": [],
          "normalizedLabel": "avant la fibrose",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "avant la fibrose"
        },
        {
          "inventoryItemId": "INV_05",
          "linkedInventoryItemIds": [
            "INV_02"
          ],
          "localRole": "endpoint_status",
          "modifiers": [],
          "normalizedLabel": "statut de critère principal non décidé pour le T1 natif",
          "polarity": "UNCERTAIN",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "je n'ai pas décidé d'en faire le critère principal"
        },
        {
          "inventoryItemId": "INV_06",
          "linkedInventoryItemIds": [],
          "localRole": "study_design",
          "modifiers": [],
          "normalizedLabel": "Centre de Lyon",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "Lyon"
        },
        {
          "inventoryItemId": "INV_07",
          "linkedInventoryItemIds": [
            "INV_06"
          ],
          "localRole": "biomarker",
          "modifiers": [],
          "normalizedLabel": "ECV",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "ECV"
        },
        {
          "inventoryItemId": "INV_08",
          "linkedInventoryItemIds": [],
          "localRole": "outcome",
          "modifiers": [],
          "normalizedLabel": "marqueur précoce",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "marqueur précoce"
        },
        {
          "inventoryItemId": "INV_09",
          "linkedInventoryItemIds": [
            "INV_08"
          ],
          "localRole": "study_design",
          "modifiers": [],
          "normalizedLabel": "utilisable dans tous les centres",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "utilisable dans tous les centres"
        },
        {
          "inventoryItemId": "INV_10",
          "linkedInventoryItemIds": [
            "INV_05"
          ],
          "localRole": "constraint",
          "modifiers": [],
          "normalizedLabel": "Non",
          "polarity": "NEGATED",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:R1",
          "sourceText": "Non"
        }
      ],
      "explicitRelations": [
        {
          "inventoryRelationId": "REL_01",
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "INV_02",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "Dans Fabry, on pense que le T1 natif",
          "targetInventoryItemId": "INV_01"
        },
        {
          "inventoryRelationId": "REL_02",
          "normalizedRelation": "REPEATED_AT",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "INV_02",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "le T1 natif pourrait être intéressant avant la fibrose",
          "targetInventoryItemId": "INV_04"
        },
        {
          "inventoryRelationId": "REL_03",
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "INV_07",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "À Lyon ils font aussi de l'ECV",
          "targetInventoryItemId": "INV_06"
        },
        {
          "inventoryRelationId": "REL_04",
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "INV_08",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "marqueur précoce qui soit utilisable dans tous les centres",
          "targetInventoryItemId": "INV_09"
        }
      ]
    },
    "semanticWarnings": [
      "DETERMINISTIC_CANONICAL_CLIENT_ID_BOUND_TO_PRIOR_STATE:9"
    ],
    "summaryForUser": "Prise en compte du refus de fixer le T1 natif comme critère principal, tout en conservant l'ensemble des éléments de l'étude (Fabry, T1 natif, fibrose, ECV à Lyon, recherche de marqueur précoce universel).",
    "unknowns": [
      "Statut définitif du T1 natif comme critère principal."
    ]
  },
  "model": {
    "acceptanceRecord": null,
    "acceptedAt": null,
    "ambiguities": [
      "Le choix exact du critère principal de l'étude n'est pas encore arrêté suite au rejet de sa désignation immédiate."
    ],
    "clarificationCandidates": [],
    "contradictions": [],
    "conversationMessageIds": [
      "I08:SEM_SINGLE_PASS:T0",
      "I08:SEM_SINGLE_PASS:Q1",
      "I08:SEM_SINGLE_PASS:R1"
    ],
    "createdAt": "2026-08-14T09:21:17.383Z",
    "critic": {
      "issues": [],
      "summary": "Single-pass deterministic reports incomplete; no semantic critic or repair was executed.",
      "verdict": "CLARIFICATION_REQUIRED"
    },
    "digest": "ke1-02bc9b7f7ccf41d3",
    "elements": [
      {
        "canonicalMeaning": "Statut de critère principal non décidé pour le T1 natif",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "INV_05"
        ],
        "knowledgeSupport": {
          "assertionRefs": [],
          "checkedAt": null,
          "gapRefs": [],
          "resultRef": null,
          "status": "NOT_CHECKED"
        },
        "polarity": "UNCERTAIN",
        "provenance": {
          "messageId": "I08:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-0e323fcec87e0e3a",
          "rawElementId": "sem-element:ke1-08ca25787a622b04",
          "source": "USER_CORRECTION"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-08ca25787a622b04",
        "sourceSpan": {
          "end": 136,
          "messageId": "I08:SEM_SINGLE_PASS:T0",
          "start": 86,
          "text": "je n'ai pas décidé d'en faire le critère principal"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [
          "sem-element:ke1-08ca25787a622b04"
        ],
        "type": "UNKNOWN",
        "version": 2
      },
      {
        "canonicalMeaning": "ECV (Extracellular Volume fraction)",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "INV_07"
        ],
        "knowledgeSupport": {
          "assertionRefs": [],
          "checkedAt": null,
          "gapRefs": [],
          "resultRef": null,
          "status": "NOT_CHECKED"
        },
        "polarity": "AFFIRMED",
        "provenance": {
          "messageId": "I08:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-0e323fcec87e0e3a",
          "rawElementId": "sem-element:ke1-1afe27a72610c393",
          "source": "USER_CORRECTION"
        },
        "relationships": [
          "sem-relation:ke1-b6c0507c5822ef98"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-1afe27a72610c393",
        "sourceSpan": {
          "end": 168,
          "messageId": "I08:SEM_SINGLE_PASS:T0",
          "start": 165,
          "text": "ECV"
        },
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [
          "sem-element:ke1-1afe27a72610c393"
        ],
        "type": "BIOMARKER",
        "version": 2
      },
      {
        "canonicalMeaning": "Centre de Lyon",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "INV_06"
        ],
        "knowledgeSupport": {
          "assertionRefs": [],
          "checkedAt": null,
          "gapRefs": [],
          "resultRef": null,
          "status": "NOT_CHECKED"
        },
        "polarity": "AFFIRMED",
        "provenance": {
          "messageId": "I08:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-0e323fcec87e0e3a",
          "rawElementId": "sem-element:ke1-30a2ff4042cb4464",
          "source": "USER_CORRECTION"
        },
        "relationships": [
          "sem-relation:ke1-b6c0507c5822ef98"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-30a2ff4042cb4464",
        "sourceSpan": {
          "end": 144,
          "messageId": "I08:SEM_SINGLE_PASS:T0",
          "start": 140,
          "text": "Lyon"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [
          "sem-element:ke1-30a2ff4042cb4464"
        ],
        "type": "STUDY_DESIGN",
        "version": 2
      },
      {
        "canonicalMeaning": "Imagerie par résonance magnétique ou mesure T1/ECV",
        "confidence": 0.8,
        "epistemicStatus": "INFERRED_HIGH_CONFIDENCE",
        "inferenceReason": "T1 natif and ECV imply underlying cardiac MRI or mapping methods.",
        "inventoryItemIds": [],
        "knowledgeSupport": {
          "assertionRefs": [],
          "checkedAt": null,
          "gapRefs": [],
          "resultRef": null,
          "status": "NOT_CHECKED"
        },
        "polarity": "AFFIRMED",
        "provenance": {
          "messageId": null,
          "providerCallId": "gemini-call:ke1-4c5eab9a773120ee",
          "rawElementId": "EL_10",
          "source": "DETERMINISTIC_CARRY_FORWARD"
        },
        "relationships": [],
        "requiresConfirmation": true,
        "semanticElementId": "sem-element:ke1-42c79da828e8e32c",
        "sourceSpan": null,
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "METHOD",
        "version": 2
      },
      {
        "canonicalMeaning": "Fibrose",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "INV_03"
        ],
        "knowledgeSupport": {
          "assertionRefs": [],
          "checkedAt": null,
          "gapRefs": [],
          "resultRef": null,
          "status": "NOT_CHECKED"
        },
        "polarity": "AFFIRMED",
        "provenance": {
          "messageId": "I08:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-0e323fcec87e0e3a",
          "rawElementId": "sem-element:ke1-4cfde86fc77e8703",
          "source": "USER_CORRECTION"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-4cfde86fc77e8703",
        "sourceSpan": {
          "end": 79,
          "messageId": "I08:SEM_SINGLE_PASS:T0",
          "start": 72,
          "text": "fibrose"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [
          "sem-element:ke1-4cfde86fc77e8703"
        ],
        "type": "SCIENTIFIC_OBJECT",
        "version": 2
      },
      {
        "canonicalMeaning": "Avant la fibrose",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "INV_04"
        ],
        "knowledgeSupport": {
          "assertionRefs": [],
          "checkedAt": null,
          "gapRefs": [],
          "resultRef": null,
          "status": "NOT_CHECKED"
        },
        "polarity": "AFFIRMED",
        "provenance": {
          "messageId": "I08:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-0e323fcec87e0e3a",
          "rawElementId": "sem-element:ke1-9670951383f53f87",
          "source": "USER_CORRECTION"
        },
        "relationships": [
          "sem-relation:ke1-865b74b3fb259e1f"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-9670951383f53f87",
        "sourceSpan": {
          "end": 79,
          "messageId": "I08:SEM_SINGLE_PASS:T0",
          "start": 63,
          "text": "avant la fibrose"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [
          "sem-element:ke1-9670951383f53f87"
        ],
        "type": "TIMING",
        "version": 2
      },
      {
        "canonicalMeaning": "Maladie de Fabry",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "INV_01"
        ],
        "knowledgeSupport": {
          "assertionRefs": [],
          "checkedAt": null,
          "gapRefs": [],
          "resultRef": null,
          "status": "NOT_CHECKED"
        },
        "polarity": "AFFIRMED",
        "provenance": {
          "messageId": "I08:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-0e323fcec87e0e3a",
          "rawElementId": "sem-element:ke1-b4c3c91b3ce8d0af",
          "source": "USER_CORRECTION"
        },
        "relationships": [
          "sem-relation:ke1-51e03717530735ab"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-b4c3c91b3ce8d0af",
        "sourceSpan": {
          "end": 10,
          "messageId": "I08:SEM_SINGLE_PASS:T0",
          "start": 5,
          "text": "Fabry"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [
          "sem-element:ke1-b4c3c91b3ce8d0af"
        ],
        "type": "CONDITION",
        "version": 2
      },
      {
        "canonicalMeaning": "T1 natif",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "INV_02"
        ],
        "knowledgeSupport": {
          "assertionRefs": [],
          "checkedAt": null,
          "gapRefs": [],
          "resultRef": null,
          "status": "NOT_CHECKED"
        },
        "polarity": "AFFIRMED",
        "provenance": {
          "messageId": "I08:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-0e323fcec87e0e3a",
          "rawElementId": "sem-element:ke1-bb98f5f3e61f629f",
          "source": "USER_CORRECTION"
        },
        "relationships": [
          "sem-relation:ke1-51e03717530735ab",
          "sem-relation:ke1-865b74b3fb259e1f"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-bb98f5f3e61f629f",
        "sourceSpan": {
          "end": 36,
          "messageId": "I08:SEM_SINGLE_PASS:T0",
          "start": 28,
          "text": "T1 natif"
        },
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [
          "sem-element:ke1-bb98f5f3e61f629f"
        ],
        "type": "BIOMARKER",
        "version": 2
      },
      {
        "canonicalMeaning": "Marqueur précoce",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "INV_08"
        ],
        "knowledgeSupport": {
          "assertionRefs": [],
          "checkedAt": null,
          "gapRefs": [],
          "resultRef": null,
          "status": "NOT_CHECKED"
        },
        "polarity": "AFFIRMED",
        "provenance": {
          "messageId": "I08:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-0e323fcec87e0e3a",
          "rawElementId": "sem-element:ke1-e2421addbfdae4f1",
          "source": "USER_CORRECTION"
        },
        "relationships": [
          "sem-relation:ke1-00a012b09b3c5414"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-e2421addbfdae4f1",
        "sourceSpan": {
          "end": 213,
          "messageId": "I08:SEM_SINGLE_PASS:T0",
          "start": 197,
          "text": "marqueur précoce"
        },
        "studyRole": "OUTCOME_ROLE",
        "supersedesElementIds": [
          "sem-element:ke1-e2421addbfdae4f1"
        ],
        "type": "BIOMARKER",
        "version": 2
      },
      {
        "canonicalMeaning": "Utilisable dans tous les centres",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "INV_09"
        ],
        "knowledgeSupport": {
          "assertionRefs": [],
          "checkedAt": null,
          "gapRefs": [],
          "resultRef": null,
          "status": "NOT_CHECKED"
        },
        "polarity": "AFFIRMED",
        "provenance": {
          "messageId": "I08:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-0e323fcec87e0e3a",
          "rawElementId": "sem-element:ke1-edd56e098b73fb75",
          "source": "USER_CORRECTION"
        },
        "relationships": [
          "sem-relation:ke1-00a012b09b3c5414"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-edd56e098b73fb75",
        "sourceSpan": {
          "end": 255,
          "messageId": "I08:SEM_SINGLE_PASS:T0",
          "start": 223,
          "text": "utilisable dans tous les centres"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [
          "sem-element:ke1-edd56e098b73fb75"
        ],
        "type": "STUDY_DESIGN",
        "version": 2
      }
    ],
    "ellipses": [],
    "executionSnapshot": {
      "criticAttempts": [],
      "criticCallId": "deterministic-no-critic",
      "criticCallIds": [],
      "criticPromptVersion": "SEM-001-CRITIC-1.6",
      "executedAt": "2026-08-14T09:22:20.855Z",
      "model": "gemini-3.5-flash-lite",
      "provider": "GOOGLE_GEMINI",
      "rawCritic": {
        "checklist": [
          {
            "check": "EVERY_EXPLICIT_OBJECT_REPRESENTED",
            "evidence": "No semantic critic was executed; deterministic reports remain visible.",
            "result": "NOT_APPLICABLE"
          },
          {
            "check": "EVERY_COMPARATOR_REPRESENTED",
            "evidence": "No semantic critic was executed; deterministic reports remain visible.",
            "result": "NOT_APPLICABLE"
          },
          {
            "check": "EVERY_INTERVENTION_REPRESENTED",
            "evidence": "No semantic critic was executed; deterministic reports remain visible.",
            "result": "NOT_APPLICABLE"
          },
          {
            "check": "EVERY_MODALITY_REPRESENTED",
            "evidence": "No semantic critic was executed; deterministic reports remain visible.",
            "result": "NOT_APPLICABLE"
          },
          {
            "check": "EVERY_EXPLICIT_RELATION_REPRESENTED",
            "evidence": "No semantic critic was executed; deterministic reports remain visible.",
            "result": "NOT_APPLICABLE"
          },
          {
            "check": "NO_INCOMPATIBLE_OBJECT_TYPE",
            "evidence": "No semantic critic was executed; deterministic reports remain visible.",
            "result": "NOT_APPLICABLE"
          },
          {
            "check": "NO_EXPLICIT_RELATION_WEAKENED",
            "evidence": "No semantic critic was executed; deterministic reports remain visible.",
            "result": "NOT_APPLICABLE"
          },
          {
            "check": "NO_INFERENCE_PROMOTED",
            "evidence": "No semantic critic was executed; deterministic reports remain visible.",
            "result": "NOT_APPLICABLE"
          },
          {
            "check": "NO_AMBIGUITY_HIDDEN",
            "evidence": "No semantic critic was executed; deterministic reports remain visible.",
            "result": "NOT_APPLICABLE"
          },
          {
            "check": "NO_NEGATION_REVERSED_OR_IGNORED",
            "evidence": "No semantic critic was executed; deterministic reports remain visible.",
            "result": "NOT_APPLICABLE"
          },
          {
            "check": "NO_TIMING_LOST",
            "evidence": "No semantic critic was executed; deterministic reports remain visible.",
            "result": "NOT_APPLICABLE"
          },
          {
            "check": "NO_UNSUPPORTED_OUTCOME_ENDPOINT_PROMOTION",
            "evidence": "No semantic critic was executed; deterministic reports remain visible.",
            "result": "NOT_APPLICABLE"
          },
          {
            "check": "NO_SPECIFIC_CONCEPT_GENERALIZED",
            "evidence": "No semantic critic was executed; deterministic reports remain visible.",
            "result": "NOT_APPLICABLE"
          },
          {
            "check": "NO_IMPORTANT_FRAGMENT_UNREPRESENTED",
            "evidence": "No semantic critic was executed; deterministic reports remain visible.",
            "result": "NOT_APPLICABLE"
          },
          {
            "check": "ROUTE_MATCHES_COMPLETE_SEMANTIC_MODEL",
            "evidence": "No semantic critic was executed; deterministic reports remain visible.",
            "result": "NOT_APPLICABLE"
          }
        ],
        "criticId": "EXP-SEM-ABLATION-02-DETERMINISTIC-NO-LLM-CRITIC",
        "criticSummary": "Single-pass deterministic reports incomplete; no semantic critic or repair was executed.",
        "issues": [],
        "missingExplicitSourceFragments": [],
        "proposedRepairs": [],
        "verdict": "CLARIFICATION_REQUIRED"
      },
      "rawCritics": [],
      "rawReconstruction": {
        "ambiguities": [
          "Le choix exact du critère principal de l'étude n'est pas encore arrêté suite au rejet de sa désignation immédiate."
        ],
        "candidateId": "candidate:ke1-bcf67b9cf98dc298-fix01",
        "clarificationCandidates": [],
        "contradictions": [],
        "elements": [
          {
            "canonicalMeaning": "Statut de critère principal non décidé pour le T1 natif",
            "clientElementId": "sem-element:ke1-08ca25787a622b04",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "INV_05"
            ],
            "polarity": "UNCERTAIN",
            "requiresConfirmation": false,
            "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
            "sourceText": "je n'ai pas décidé d'en faire le critère principal",
            "studyRole": "NONE",
            "supersedesElementIds": [
              "sem-element:ke1-08ca25787a622b04"
            ],
            "type": "UNKNOWN"
          },
          {
            "canonicalMeaning": "ECV (Extracellular Volume fraction)",
            "clientElementId": "sem-element:ke1-1afe27a72610c393",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "INV_07"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
            "sourceText": "ECV",
            "studyRole": "MEASUREMENT",
            "supersedesElementIds": [
              "sem-element:ke1-1afe27a72610c393"
            ],
            "type": "BIOMARKER"
          },
          {
            "canonicalMeaning": "Centre de Lyon",
            "clientElementId": "sem-element:ke1-30a2ff4042cb4464",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "INV_06"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
            "sourceText": "Lyon",
            "studyRole": "NONE",
            "supersedesElementIds": [
              "sem-element:ke1-30a2ff4042cb4464"
            ],
            "type": "STUDY_DESIGN"
          },
          {
            "canonicalMeaning": "Imagerie par résonance magnétique ou mesure T1/ECV",
            "clientElementId": "sem-element:ke1-42c79da828e8e32c",
            "confidence": 0.8,
            "epistemicStatus": "INFERRED_HIGH_CONFIDENCE",
            "inferenceReason": "T1 natif and ECV imply underlying cardiac MRI or mapping methods.",
            "inventoryItemIds": [],
            "polarity": "AFFIRMED",
            "requiresConfirmation": true,
            "sourceMessageId": null,
            "sourceText": null,
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "METHOD"
          },
          {
            "canonicalMeaning": "Fibrose",
            "clientElementId": "sem-element:ke1-4cfde86fc77e8703",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "INV_03"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
            "sourceText": "fibrose",
            "studyRole": "NONE",
            "supersedesElementIds": [
              "sem-element:ke1-4cfde86fc77e8703"
            ],
            "type": "SCIENTIFIC_OBJECT"
          },
          {
            "canonicalMeaning": "Avant la fibrose",
            "clientElementId": "sem-element:ke1-9670951383f53f87",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "INV_04"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
            "sourceText": "avant la fibrose",
            "studyRole": "NONE",
            "supersedesElementIds": [
              "sem-element:ke1-9670951383f53f87"
            ],
            "type": "TIMING"
          },
          {
            "canonicalMeaning": "Maladie de Fabry",
            "clientElementId": "sem-element:ke1-b4c3c91b3ce8d0af",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "INV_01"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
            "sourceText": "Fabry",
            "studyRole": "NONE",
            "supersedesElementIds": [
              "sem-element:ke1-b4c3c91b3ce8d0af"
            ],
            "type": "CONDITION"
          },
          {
            "canonicalMeaning": "T1 natif",
            "clientElementId": "sem-element:ke1-bb98f5f3e61f629f",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "INV_02"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
            "sourceText": "T1 natif",
            "studyRole": "MEASUREMENT",
            "supersedesElementIds": [
              "sem-element:ke1-bb98f5f3e61f629f"
            ],
            "type": "BIOMARKER"
          },
          {
            "canonicalMeaning": "Marqueur précoce",
            "clientElementId": "sem-element:ke1-e2421addbfdae4f1",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "INV_08"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
            "sourceText": "marqueur précoce",
            "studyRole": "OUTCOME_ROLE",
            "supersedesElementIds": [
              "sem-element:ke1-e2421addbfdae4f1"
            ],
            "type": "BIOMARKER"
          },
          {
            "canonicalMeaning": "Utilisable dans tous les centres",
            "clientElementId": "sem-element:ke1-edd56e098b73fb75",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "INV_09"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
            "sourceText": "utilisable dans tous les centres",
            "studyRole": "NONE",
            "supersedesElementIds": [
              "sem-element:ke1-edd56e098b73fb75"
            ],
            "type": "STUDY_DESIGN"
          }
        ],
        "ellipses": [],
        "knowledgeRequests": [],
        "language": "fr",
        "missingConcepts": [],
        "normalizedMeaning": "Analyse exploratoire de la maladie de Fabry évaluant le T1 natif avant la phase de fibrose, sans l'avoir fixé comme critère principal suite à la question de clarification, en tenant compte de l'ECV mesurée à Lyon, avec l'objectif prioritaire d'identifier un marqueur précoce universellement mesurable dans tous les centres.",
        "relations": [
          {
            "clientRelationId": "sem-relation:ke1-00a012b09b3c5414",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "REL_04"
            ],
            "polarity": "AFFIRMED",
            "relationType": "RELATED_TO_CANDIDATE",
            "requiresConfirmation": false,
            "sourceClientElementId": "sem-element:ke1-e2421addbfdae4f1",
            "targetClientElementId": "sem-element:ke1-edd56e098b73fb75"
          },
          {
            "clientRelationId": "sem-relation:ke1-51e03717530735ab",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "REL_01"
            ],
            "polarity": "AFFIRMED",
            "relationType": "RELATED_TO_CANDIDATE",
            "requiresConfirmation": false,
            "sourceClientElementId": "sem-element:ke1-bb98f5f3e61f629f",
            "targetClientElementId": "sem-element:ke1-b4c3c91b3ce8d0af"
          },
          {
            "clientRelationId": "sem-relation:ke1-865b74b3fb259e1f",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "REL_02"
            ],
            "polarity": "AFFIRMED",
            "relationType": "REPEATED_AT",
            "requiresConfirmation": false,
            "sourceClientElementId": "sem-element:ke1-bb98f5f3e61f629f",
            "targetClientElementId": "sem-element:ke1-9670951383f53f87"
          },
          {
            "clientRelationId": "sem-relation:ke1-b6c0507c5822ef98",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "REL_03"
            ],
            "polarity": "AFFIRMED",
            "relationType": "RELATED_TO_CANDIDATE",
            "requiresConfirmation": false,
            "sourceClientElementId": "sem-element:ke1-1afe27a72610c393",
            "targetClientElementId": "sem-element:ke1-30a2ff4042cb4464"
          }
        ],
        "routeProposal": {
          "confidence": 0.9,
          "expectedCapabilities": [
            "STUDY_DESIGN_STRUCTURING",
            "POPULATION_SETTING"
          ],
          "reason": "L'utilisateur configure les aspects méthodologiques et opérationnels d'une étude clinique sur la maladie de Fabry sans nécessiter de formalisation théorique préalable.",
          "route": "DESIGN_STUDY"
        },
        "semanticInventory": {
          "explicitFragments": [
            {
              "inventoryItemId": "INV_01",
              "linkedInventoryItemIds": [],
              "localRole": "condition",
              "modifiers": [],
              "normalizedLabel": "Maladie de Fabry",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
              "sourceText": "Fabry"
            },
            {
              "inventoryItemId": "INV_02",
              "linkedInventoryItemIds": [],
              "localRole": "biomarker",
              "modifiers": [],
              "normalizedLabel": "T1 natif",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
              "sourceText": "T1 natif"
            },
            {
              "inventoryItemId": "INV_03",
              "linkedInventoryItemIds": [],
              "localRole": "scientific_object",
              "modifiers": [],
              "normalizedLabel": "fibrose",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
              "sourceText": "fibrose"
            },
            {
              "inventoryItemId": "INV_04",
              "linkedInventoryItemIds": [
                "INV_03"
              ],
              "localRole": "timing",
              "modifiers": [],
              "normalizedLabel": "avant la fibrose",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
              "sourceText": "avant la fibrose"
            },
            {
              "inventoryItemId": "INV_05",
              "linkedInventoryItemIds": [
                "INV_02"
              ],
              "localRole": "endpoint_status",
              "modifiers": [],
              "normalizedLabel": "statut de critère principal non décidé pour le T1 natif",
              "polarity": "UNCERTAIN",
              "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
              "sourceText": "je n'ai pas décidé d'en faire le critère principal"
            },
            {
              "inventoryItemId": "INV_06",
              "linkedInventoryItemIds": [],
              "localRole": "study_design",
              "modifiers": [],
              "normalizedLabel": "Centre de Lyon",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
              "sourceText": "Lyon"
            },
            {
              "inventoryItemId": "INV_07",
              "linkedInventoryItemIds": [
                "INV_06"
              ],
              "localRole": "biomarker",
              "modifiers": [],
              "normalizedLabel": "ECV",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
              "sourceText": "ECV"
            },
            {
              "inventoryItemId": "INV_08",
              "linkedInventoryItemIds": [],
              "localRole": "outcome",
              "modifiers": [],
              "normalizedLabel": "marqueur précoce",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
              "sourceText": "marqueur précoce"
            },
            {
              "inventoryItemId": "INV_09",
              "linkedInventoryItemIds": [
                "INV_08"
              ],
              "localRole": "study_design",
              "modifiers": [],
              "normalizedLabel": "utilisable dans tous les centres",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
              "sourceText": "utilisable dans tous les centres"
            },
            {
              "inventoryItemId": "INV_10",
              "linkedInventoryItemIds": [
                "INV_05"
              ],
              "localRole": "constraint",
              "modifiers": [],
              "normalizedLabel": "Non",
              "polarity": "NEGATED",
              "sourceMessageId": "I08:SEM_SINGLE_PASS:R1",
              "sourceText": "Non"
            }
          ],
          "explicitRelations": [
            {
              "inventoryRelationId": "REL_01",
              "normalizedRelation": "RELATED_TO_CANDIDATE",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "INV_02",
              "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
              "sourceText": "Dans Fabry, on pense que le T1 natif",
              "targetInventoryItemId": "INV_01"
            },
            {
              "inventoryRelationId": "REL_02",
              "normalizedRelation": "REPEATED_AT",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "INV_02",
              "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
              "sourceText": "le T1 natif pourrait être intéressant avant la fibrose",
              "targetInventoryItemId": "INV_04"
            },
            {
              "inventoryRelationId": "REL_03",
              "normalizedRelation": "RELATED_TO_CANDIDATE",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "INV_07",
              "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
              "sourceText": "À Lyon ils font aussi de l'ECV",
              "targetInventoryItemId": "INV_06"
            },
            {
              "inventoryRelationId": "REL_04",
              "normalizedRelation": "RELATED_TO_CANDIDATE",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "INV_08",
              "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
              "sourceText": "marqueur précoce qui soit utilisable dans tous les centres",
              "targetInventoryItemId": "INV_09"
            }
          ]
        },
        "semanticWarnings": [
          "DETERMINISTIC_CANONICAL_CLIENT_ID_BOUND_TO_PRIOR_STATE:9"
        ],
        "summaryForUser": "Prise en compte du refus de fixer le T1 natif comme critère principal, tout en conservant l'ensemble des éléments de l'étude (Fabry, T1 natif, fibrose, ECV à Lyon, recherche de marqueur précoce universel).",
        "unknowns": [
          "Statut définitif du T1 natif comme critère principal."
        ]
      },
      "reconstructionAttempts": [
        {
          "attempt": 1,
          "category": null,
          "httpStatus": 200,
          "latencyMs": 2556,
          "outcome": "SUCCESS",
          "providerCode": null,
          "providerError": null,
          "providerStatus": null,
          "requestFinished": "2026-08-14T09:22:10.205Z",
          "requestStarted": "2026-08-14T09:22:07.649Z",
          "retryable": false
        },
        {
          "attempt": 1,
          "category": null,
          "httpStatus": 200,
          "latencyMs": 10628,
          "outcome": "SUCCESS",
          "providerCode": null,
          "providerError": null,
          "providerStatus": null,
          "requestFinished": "2026-08-14T09:22:20.849Z",
          "requestStarted": "2026-08-14T09:22:10.221Z",
          "retryable": false
        }
      ],
      "reconstructionCallId": "gemini-call:ke1-0e323fcec87e0e3a",
      "reconstructionPromptVersion": "SEM-001-RECONSTRUCTION-1.6",
      "schemaVersion": "SEM-001-1.1",
      "temperature": null
    },
    "explicitCoverageReport": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "INV_01",
          "mappedClientElementIds": [
            "sem-element:ke1-b4c3c91b3ce8d0af"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Maladie de Fabry",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "Fabry"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "INV_02",
          "mappedClientElementIds": [
            "sem-element:ke1-bb98f5f3e61f629f"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "T1 natif",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "T1 natif"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "INV_03",
          "mappedClientElementIds": [
            "sem-element:ke1-4cfde86fc77e8703"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "fibrose",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "fibrose"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "INV_04",
          "mappedClientElementIds": [
            "sem-element:ke1-9670951383f53f87"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "avant la fibrose",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "avant la fibrose"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "INV_05",
          "mappedClientElementIds": [
            "sem-element:ke1-08ca25787a622b04"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "statut de critère principal non décidé pour le T1 natif",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "je n'ai pas décidé d'en faire le critère principal"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "INV_06",
          "mappedClientElementIds": [
            "sem-element:ke1-30a2ff4042cb4464"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Centre de Lyon",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "Lyon"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "INV_07",
          "mappedClientElementIds": [
            "sem-element:ke1-1afe27a72610c393"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "ECV",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "ECV"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "INV_08",
          "mappedClientElementIds": [
            "sem-element:ke1-e2421addbfdae4f1"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "marqueur précoce",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "marqueur précoce"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "INV_09",
          "mappedClientElementIds": [
            "sem-element:ke1-edd56e098b73fb75"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "utilisable dans tous les centres",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:T0",
          "sourceText": "utilisable dans tous les centres"
        },
        {
          "coverageStatus": "UNRESOLVED_EXPLICIT_FRAGMENT",
          "inventoryItemId": "INV_10",
          "mappedClientElementIds": [],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Non",
          "reason": "The exact inventory fragment has no source-grounded typed Semantic Element mapping.",
          "sourceMessageId": "I08:SEM_SINGLE_PASS:R1",
          "sourceText": "Non"
        }
      ],
      "status": "INCOMPLETE"
    },
    "history": [
      {
        "changeReason": "Nouvelle contribution utilisateur analysée sans réécriture de l’état antérieur.",
        "changedAt": "2026-08-14T09:21:17.383Z",
        "digest": "ke1-7afff7e66a568c7a",
        "modelId": "semantic-model:ke1-bcf67b9cf98dc298",
        "revision": 1,
        "status": "CLARIFICATION_REQUIRED"
      }
    ],
    "knowledgeRequests": [],
    "knowledgeSnapshot": null,
    "missingConcepts": [],
    "normalizedMeaning": "Analyse exploratoire de la maladie de Fabry évaluant le T1 natif avant la phase de fibrose, sans l'avoir fixé comme critère principal suite à la question de clarification, en tenant compte de l'ECV mesurée à Lyon, avec l'objectif prioritaire d'identifier un marqueur précoce universellement mesurable dans tous les centres.",
    "originalRequest": "Dans Fabry, on pense que le T1 natif pourrait être intéressant avant la fibrose, mais je n'ai pas décidé d'en faire le critère principal. À Lyon ils font aussi de l'ECV. Je veux surtout trouver un marqueur précoce qui soit utilisable dans tous les centres.",
    "previousModelId": "semantic-model:ke1-bcf67b9cf98dc298",
    "relationCoverageReport": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "REL_01",
          "mappedClientRelationIds": [
            "sem-relation:ke1-51e03717530735ab"
          ],
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "INV_02",
          "targetInventoryItemId": "INV_01"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "REL_02",
          "mappedClientRelationIds": [
            "sem-relation:ke1-865b74b3fb259e1f"
          ],
          "normalizedRelation": "REPEATED_AT",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "INV_02",
          "targetInventoryItemId": "INV_04"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "REL_03",
          "mappedClientRelationIds": [
            "sem-relation:ke1-b6c0507c5822ef98"
          ],
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "INV_07",
          "targetInventoryItemId": "INV_06"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "REL_04",
          "mappedClientRelationIds": [
            "sem-relation:ke1-00a012b09b3c5414"
          ],
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "INV_08",
          "targetInventoryItemId": "INV_09"
        }
      ],
      "status": "COMPLETE"
    },
    "relations": [
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "REL_04"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-00a012b09b3c5414",
        "sourceElementId": "sem-element:ke1-e2421addbfdae4f1",
        "targetElementId": "sem-element:ke1-edd56e098b73fb75",
        "version": 2,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "REL_01"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-51e03717530735ab",
        "sourceElementId": "sem-element:ke1-bb98f5f3e61f629f",
        "targetElementId": "sem-element:ke1-b4c3c91b3ce8d0af",
        "version": 2,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "REL_02"
        ],
        "polarity": "AFFIRMED",
        "relationType": "REPEATED_AT",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-865b74b3fb259e1f",
        "sourceElementId": "sem-element:ke1-bb98f5f3e61f629f",
        "targetElementId": "sem-element:ke1-9670951383f53f87",
        "version": 2,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "REL_03"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-b6c0507c5822ef98",
        "sourceElementId": "sem-element:ke1-1afe27a72610c393",
        "targetElementId": "sem-element:ke1-30a2ff4042cb4464",
        "version": 2,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      }
    ],
    "revision": 2,
    "routeProposal": {
      "confidence": 0.9,
      "expectedCapabilities": [
        "POPULATION_SETTING",
        "STUDY_DESIGN_STRUCTURING"
      ],
      "reason": "L'utilisateur configure les aspects méthodologiques et opérationnels d'une étude clinique sur la maladie de Fabry sans nécessiter de formalisation théorique préalable.",
      "route": "DESIGN_STUDY"
    },
    "semanticModelId": "semantic-model:ke1-347a605217e07866",
    "semanticModelVersion": "1.1",
    "status": "CLARIFICATION_REQUIRED",
    "summaryForUser": "Prise en compte du refus de fixer le T1 natif comme critère principal, tout en conservant l'ensemble des éléments de l'étude (Fabry, T1 natif, fibrose, ECV à Lyon, recherche de marqueur précoce universel).",
    "unknowns": [
      "Statut définitif du T1 natif comme critère principal."
    ],
    "updatedAt": "2026-08-14T09:22:20.855Z"
  },
  "pairedFirstReconstruction": false,
  "semanticCriticExecuted": false,
  "status": "SUCCESS"
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

Analyse exploratoire de la maladie de Fabry évaluant le T1 natif avant la phase de fibrose, sans l'avoir fixé comme critère principal suite à la question de clarification, en tenant compte de l'ECV mesurée à Lyon, avec l'objectif prioritaire d'identifier un marqueur précoce universellement mesurable dans tous les centres.

Objectif scientifique produit :

Analyse exploratoire de la maladie de Fabry évaluant le T1 natif avant la phase de fibrose, sans l'avoir fixé comme critère principal suite à la question de clarification, en tenant compte de l'ECV mesurée à Lyon, avec l'objectif prioritaire d'identifier un marqueur précoce universellement mesurable dans tous les centres.

### EXPLICITEMENT DIT PAR LE CHERCHEUR

- content=Statut de critère principal non décidé pour le T1 natif | scientificRole=UNKNOWN:NONE | polarity=UNCERTAIN | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=je n'ai pas décidé d'en faire le critère principal | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"]
- content=ECV (Extracellular Volume fraction) | scientificRole=BIOMARKER:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=ECV | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"]
- content=Centre de Lyon | scientificRole=STUDY_DESIGN:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Lyon | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"]
- content=Fibrose | scientificRole=SCIENTIFIC_OBJECT:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=fibrose | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"]
- content=Avant la fibrose | scientificRole=TIMING:NONE | polarity=AFFIRMED | temporalContext=Avant la fibrose | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=avant la fibrose | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"]
- content=Maladie de Fabry | scientificRole=CONDITION:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Fabry | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"]
- content=T1 natif | scientificRole=BIOMARKER:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=T1 natif | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"]
- content=Marqueur précoce | scientificRole=BIOMARKER:OUTCOME_ROLE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=marqueur précoce | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"]
- content=Utilisable dans tous les centres | scientificRole=STUDY_DESIGN:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=utilisable dans tous les centres | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"]

### RELATIONS COMPRISES

- subject=Marqueur précoce | predicate=RELATED_TO_CANDIDATE | object=Utilisable dans tous les centres | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=T1 natif | predicate=RELATED_TO_CANDIDATE | object=Maladie de Fabry | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=T1 natif | predicate=REPEATED_AT | object=Avant la fibrose | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=ECV (Extracellular Volume fraction) | predicate=RELATED_TO_CANDIDATE | object=Centre de Lyon | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER

### CONTEXTE INFÉRÉ

- content=Imagerie par résonance magnétique ou mesure T1/ECV | scientificRole=METHOD:NONE | polarity=AFFIRMED | epistemicStatus=INFERRED_HIGH_CONFIDENCE | ownership=SEM_CANDIDATE | basis=T1 natif and ECV imply underlying cardiac MRI or mapping methods.

### CANDIDATS SCIENTIFIQUES CONTEXTUELS

- Aucun élément produit.

### NÉGATIONS / CONTRAINTES

- Aucun élément produit.

### TEMPORALITÉ

- content=Avant la fibrose | scientificRole=TIMING:NONE | polarity=AFFIRMED | temporalContext=Avant la fibrose | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=avant la fibrose | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"]

### AMBIGUÏTÉS

- content=Le choix exact du critère principal de l'étude n'est pas encore arrêté suite au rejet de sa désignation immédiate. | epistemicStatus=AMBIGUOUS | decisionImpact=SEM reports an unresolved ambiguity; impact requires clarification.

### INFORMATIONS MANQUANTES

- content=Statut définitif du T1 natif comme critère principal. | owner=USER_OR_SPECIALIZED_OWNER_UNRESOLVED | priority=HIGH | blocking=oui | decisionImpact=SEM reports missing or unresolved information.

### INCONNUES

- content=Statut définitif du T1 natif comme critère principal. | owner=USER_OR_SPECIALIZED_OWNER_UNRESOLVED | priority=HIGH | blocking=oui | decisionImpact=SEM reports missing or unresolved information.

### CORRECTIONS / SUPERSESSIONS

- previousContent=Statut de critère principal non décidé pour le T1 natif | currentContent=Statut de critère principal non décidé pour le T1 natif | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"] | disposition=SUPERSEDED
- previousContent=ECV (Extracellular Volume fraction) | currentContent=ECV (Extracellular Volume fraction) | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"] | disposition=SUPERSEDED
- previousContent=Centre de Lyon | currentContent=Centre de Lyon | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"] | disposition=SUPERSEDED
- previousContent=Fibrose | currentContent=Fibrose | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"] | disposition=SUPERSEDED
- previousContent=Avant la fibrose | currentContent=Avant la fibrose | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"] | disposition=SUPERSEDED
- previousContent=Maladie de Fabry | currentContent=Maladie de Fabry | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"] | disposition=SUPERSEDED
- previousContent=T1 natif | currentContent=T1 natif | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"] | disposition=SUPERSEDED
- previousContent=Marqueur précoce | currentContent=Marqueur précoce | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"] | disposition=SUPERSEDED
- previousContent=Utilisable dans tous les centres | currentContent=Utilisable dans tous les centres | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"] | disposition=SUPERSEDED

### OWNERSHIP / STATUT ÉPISTÉMIQUE

- content=Statut de critère principal non décidé pour le T1 natif | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"]
- content=ECV (Extracellular Volume fraction) | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"]
- content=Centre de Lyon | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"]
- content=Imagerie par résonance magnétique ou mesure T1/ECV | epistemicStatus=INFERRED_HIGH_CONFIDENCE | owner=SEM_CANDIDATE
- content=Fibrose | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"]
- content=Avant la fibrose | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"]
- content=Maladie de Fabry | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"]
- content=T1 natif | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"]
- content=Marqueur précoce | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"]
- content=Utilisable dans tous les centres | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:SEM_SINGLE_PASS:T0"]

### QUESTIONS DE CLARIFICATION CANDIDATES

- Aucun élément produit.

## MISSING STRUCTURAL GUARANTEES

- EXACT_PROVIDER_RAW_TEXT_NOT_PERSISTED; STRUCTURED_NATIVE_ARTIFACT_AVAILABLE

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
