# I06 — SEM_SINGLE_PASS — COMMON_TRANSCRIPT T1

## INPUT

Message utilisateur courant VERBATIM :

> Par "la seconde", je parle de l'ASL. Je veux distinguer progression vraie et pseudoprogression à 3 mois.

Conversation précédente VERBATIM :

> I06:T0 | USER : Je compare DSC et ASL chez mes gliomes. Quand elles ne racontent pas la même chose, je veux savoir laquelle est la plus utile pour la progression. Pour ceux qui n'ont que la seconde, je préfère quand même les garder si c'est possible.

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/common-transcript-i06-t1-sem-single-pass.json`

```json
{
  "deterministicCoverage": {
    "explicit": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_10",
          "mappedClientElementIds": [
            "elem_01"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "ASL",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:R1",
          "sourceText": "l'ASL"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_11",
          "mappedClientElementIds": [
            "elem_02"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Vraie progression",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:R1",
          "sourceText": "progression vraie"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_12",
          "mappedClientElementIds": [
            "elem_03"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Pseudoprogression",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:R1",
          "sourceText": "pseudoprogression"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_13",
          "mappedClientElementIds": [
            "elem_04"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "3 mois",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:R1",
          "sourceText": "à 3 mois"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_14",
          "mappedClientElementIds": [
            "elem_05"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "distinguer",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:R1",
          "sourceText": "distinguer"
        }
      ],
      "status": "COMPLETE"
    },
    "integrity": {
      "findings": [],
      "status": "COMPLETE"
    },
    "relations": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_inv_10",
          "mappedClientRelationIds": [
            "rel_01"
          ],
          "normalizedRelation": "DISTINGUISHED_FROM",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv_11",
          "targetInventoryItemId": "inv_12"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_inv_11",
          "mappedClientRelationIds": [
            "rel_02"
          ],
          "normalizedRelation": "REPEATED_AT",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv_11",
          "targetInventoryItemId": "inv_13"
        },
        {
          "coverageStatus": "EXPLICIT_RELATION_UNMAPPED",
          "inventoryRelationId": "rel_inv_12",
          "mappedClientRelationIds": [],
          "normalizedRelation": "OBSERVES",
          "reason": "The explicit relational construction has no mapped direct Semantic Relation between elements grounded to its inventory endpoints.",
          "sourceInventoryItemId": "inv_14",
          "targetInventoryItemId": "inv_11"
        }
      ],
      "status": "INCOMPLETE"
    },
    "taxonomy": {
      "findings": [],
      "status": "COMPLETE"
    }
  },
  "initialReconstruction": {
    "ambiguities": [
      "Gestion des cas avec données ASL partielles sans DSC"
    ],
    "candidateId": "cand-ke1-06-rev2",
    "clarificationCandidates": [],
    "contradictions": [],
    "elements": [
      {
        "canonicalMeaning": "Arterial Spin Labeling MRI (ASL)",
        "clientElementId": "elem_01",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_10"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I06:R1",
        "sourceText": "l'ASL",
        "studyRole": "INTERVENTION_ARM",
        "supersedesElementIds": [],
        "type": "METHOD"
      },
      {
        "canonicalMeaning": "True progression",
        "clientElementId": "elem_02",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_11"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I06:R1",
        "sourceText": "progression vraie",
        "studyRole": "OUTCOME_ROLE",
        "supersedesElementIds": [],
        "type": "OUTCOME"
      },
      {
        "canonicalMeaning": "Pseudoprogression",
        "clientElementId": "elem_03",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_12"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I06:R1",
        "sourceText": "pseudoprogression",
        "studyRole": "OUTCOME_ROLE",
        "supersedesElementIds": [],
        "type": "OUTCOME"
      },
      {
        "canonicalMeaning": "3 months",
        "clientElementId": "elem_04",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_13"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I06:R1",
        "sourceText": "à 3 mois",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "TIMING"
      },
      {
        "canonicalMeaning": "Distinguish between true progression and pseudoprogression",
        "clientElementId": "elem_05",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_14"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I06:R1",
        "sourceText": "distinguer",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_INTENT"
      }
    ],
    "ellipses": [],
    "knowledgeRequests": [],
    "language": "fr",
    "missingConcepts": [],
    "normalizedMeaning": "L'utilisateur précise que \"la seconde\" désigne l'ASL et indique son intention de distinguer la vraie progression de la pseudoprogression à 3 mois.",
    "relations": [
      {
        "clientRelationId": "rel_01",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_inv_10"
        ],
        "polarity": "AFFIRMED",
        "relationType": "DISTINGUISHED_FROM",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_02",
        "targetClientElementId": "elem_03"
      },
      {
        "clientRelationId": "rel_02",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_inv_11"
        ],
        "polarity": "AFFIRMED",
        "relationType": "REPEATED_AT",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_02",
        "targetClientElementId": "elem_04"
      }
    ],
    "routeProposal": {
      "confidence": 0.95,
      "expectedCapabilities": [
        "Définition précise des critères d'évaluation d'imagerie",
        "Gestion des données partielles"
      ],
      "reason": "L'utilisateur affine les critères d'évaluation, les méthodes et les objectifs temporels pour son étude de cohorte sur les gliomes.",
      "route": "DESIGN_STUDY"
    },
    "semanticInventory": {
      "explicitFragments": [
        {
          "inventoryItemId": "inv_10",
          "linkedInventoryItemIds": [],
          "localRole": "object",
          "modifiers": [],
          "normalizedLabel": "ASL",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I06:R1",
          "sourceText": "l'ASL"
        },
        {
          "inventoryItemId": "inv_11",
          "linkedInventoryItemIds": [],
          "localRole": "target",
          "modifiers": [],
          "normalizedLabel": "Vraie progression",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I06:R1",
          "sourceText": "progression vraie"
        },
        {
          "inventoryItemId": "inv_12",
          "linkedInventoryItemIds": [],
          "localRole": "target",
          "modifiers": [],
          "normalizedLabel": "Pseudoprogression",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I06:R1",
          "sourceText": "pseudoprogression"
        },
        {
          "inventoryItemId": "inv_13",
          "linkedInventoryItemIds": [],
          "localRole": "timing",
          "modifiers": [],
          "normalizedLabel": "3 mois",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I06:R1",
          "sourceText": "à 3 mois"
        },
        {
          "inventoryItemId": "inv_14",
          "linkedInventoryItemIds": [],
          "localRole": "action",
          "modifiers": [],
          "normalizedLabel": "distinguer",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I06:R1",
          "sourceText": "distinguer"
        }
      ],
      "explicitRelations": [
        {
          "inventoryRelationId": "rel_inv_10",
          "normalizedRelation": "DISTINGUISHED_FROM",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "inv_11",
          "sourceMessageId": "I06:R1",
          "sourceText": "distinguer progression vraie et pseudoprogression",
          "targetInventoryItemId": "inv_12"
        },
        {
          "inventoryRelationId": "rel_inv_11",
          "normalizedRelation": "REPEATED_AT",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "inv_11",
          "sourceMessageId": "I06:R1",
          "sourceText": "progression vraie et pseudoprogression à 3 mois",
          "targetInventoryItemId": "inv_13"
        },
        {
          "inventoryRelationId": "rel_inv_12",
          "normalizedRelation": "OBSERVES",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "inv_14",
          "sourceMessageId": "I06:R1",
          "sourceText": "Je veux distinguer progression vraie et pseudoprogression",
          "targetInventoryItemId": "inv_11"
        }
      ]
    },
    "semanticWarnings": [],
    "summaryForUser": "L'ASL est confirmée comme seconde méthode, et l'objectif d'évaluation est précisé pour distinguer la progression vraie de la pseudoprogression à 3 mois.",
    "unknowns": []
  },
  "model": {
    "acceptanceRecord": null,
    "acceptedAt": null,
    "ambiguities": [
      "Gestion des cas avec données ASL partielles sans DSC"
    ],
    "clarificationCandidates": [],
    "contradictions": [],
    "conversationMessageIds": [
      "I06:T0",
      "I06:R1"
    ],
    "createdAt": "2026-08-14T09:01:56.771Z",
    "critic": {
      "issues": [],
      "summary": "Single-pass deterministic reports incomplete; no semantic critic or repair was executed.",
      "verdict": "CLARIFICATION_REQUIRED"
    },
    "digest": "ke1-fc1b3d31ef990c05",
    "elements": [
      {
        "canonicalMeaning": "True progression",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_11"
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
          "messageId": "I06:R1",
          "providerCallId": "gemini-call:ke1-06273ccbf3afa85f",
          "rawElementId": "elem_02",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-591b5c827c246d36",
          "sem-relation:ke1-9223a6b11a3dfa5d"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-4eb67123d6c92def",
        "sourceSpan": {
          "end": 73,
          "messageId": "I06:R1",
          "start": 56,
          "text": "progression vraie"
        },
        "studyRole": "OUTCOME_ROLE",
        "supersedesElementIds": [],
        "type": "OUTCOME",
        "version": 1
      },
      {
        "canonicalMeaning": "Utility for progression assessment",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_08"
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
          "messageId": "I06:T0",
          "providerCallId": "gemini-call:ke1-6691eef56f4d7789",
          "rawElementId": "elem_05",
          "source": "DETERMINISTIC_CARRY_FORWARD"
        },
        "relationships": [
          "sem-relation:ke1-d54d0e4719830b6b"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-5597336786d51373",
        "sourceSpan": {
          "end": 125,
          "messageId": "I06:T0",
          "start": 99,
          "text": "laquelle est la plus utile"
        },
        "studyRole": "OUTCOME_ROLE",
        "supersedesElementIds": [],
        "type": "ENDPOINT",
        "version": 2
      },
      {
        "canonicalMeaning": "3 months",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_13"
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
          "messageId": "I06:R1",
          "providerCallId": "gemini-call:ke1-06273ccbf3afa85f",
          "rawElementId": "elem_04",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-9223a6b11a3dfa5d"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-70c54d162229aeaa",
        "sourceSpan": {
          "end": 103,
          "messageId": "I06:R1",
          "start": 95,
          "text": "à 3 mois"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "TIMING",
        "version": 1
      },
      {
        "canonicalMeaning": "Arterial Spin Labeling MRI (ASL)",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_10"
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
          "messageId": "I06:R1",
          "providerCallId": "gemini-call:ke1-06273ccbf3afa85f",
          "rawElementId": "elem_01",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-f0026975eec42539",
          "sem-relation:ke1-f31c888f1bf656b3"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-7d40eceab438999e",
        "sourceSpan": {
          "end": 35,
          "messageId": "I06:R1",
          "start": 30,
          "text": "l'ASL"
        },
        "studyRole": "INTERVENTION_ARM",
        "supersedesElementIds": [],
        "type": "METHOD",
        "version": 2
      },
      {
        "canonicalMeaning": "Distinguish between true progression and pseudoprogression",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_14"
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
          "messageId": "I06:R1",
          "providerCallId": "gemini-call:ke1-06273ccbf3afa85f",
          "rawElementId": "elem_05",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-7d89ee0af54786de",
        "sourceSpan": {
          "end": 55,
          "messageId": "I06:R1",
          "start": 45,
          "text": "distinguer"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_INTENT",
        "version": 1
      },
      {
        "canonicalMeaning": "Glioma",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_05"
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
          "messageId": "I06:T0",
          "providerCallId": "gemini-call:ke1-6691eef56f4d7789",
          "rawElementId": "elem_03",
          "source": "DETERMINISTIC_CARRY_FORWARD"
        },
        "relationships": [
          "sem-relation:ke1-f31c888f1bf656b3",
          "sem-relation:ke1-fc58f298e796bb54"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-8976c0e4e1c67c20",
        "sourceSpan": {
          "end": 38,
          "messageId": "I06:T0",
          "start": 31,
          "text": "gliomes"
        },
        "studyRole": "SUBJECT",
        "supersedesElementIds": [],
        "type": "CONDITION",
        "version": 2
      },
      {
        "canonicalMeaning": "Pseudoprogression",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_12"
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
          "messageId": "I06:R1",
          "providerCallId": "gemini-call:ke1-06273ccbf3afa85f",
          "rawElementId": "elem_03",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-591b5c827c246d36"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-8fc6798b686c807f",
        "sourceSpan": {
          "end": 94,
          "messageId": "I06:R1",
          "start": 77,
          "text": "pseudoprogression"
        },
        "studyRole": "OUTCOME_ROLE",
        "supersedesElementIds": [],
        "type": "OUTCOME",
        "version": 1
      },
      {
        "canonicalMeaning": "Dynamic Susceptibility Contrast MRI (DSC)",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_03"
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
          "messageId": "I06:T0",
          "providerCallId": "gemini-call:ke1-6691eef56f4d7789",
          "rawElementId": "elem_01",
          "source": "DETERMINISTIC_CARRY_FORWARD"
        },
        "relationships": [
          "sem-relation:ke1-f0026975eec42539",
          "sem-relation:ke1-fc58f298e796bb54"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-9c76acf0bb5c49e4",
        "sourceSpan": {
          "end": 14,
          "messageId": "I06:T0",
          "start": 11,
          "text": "DSC"
        },
        "studyRole": "COMPARATOR_ARM",
        "supersedesElementIds": [],
        "type": "METHOD",
        "version": 2
      },
      {
        "canonicalMeaning": "Tumor progression",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_09"
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
          "messageId": "I06:T0",
          "providerCallId": "gemini-call:ke1-6691eef56f4d7789",
          "rawElementId": "elem_04",
          "source": "DETERMINISTIC_CARRY_FORWARD"
        },
        "relationships": [
          "sem-relation:ke1-d54d0e4719830b6b"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-9d17ea98e70586d4",
        "sourceSpan": {
          "end": 145,
          "messageId": "I06:T0",
          "start": 134,
          "text": "progression"
        },
        "studyRole": "OUTCOME_ROLE",
        "supersedesElementIds": [],
        "type": "OUTCOME",
        "version": 2
      }
    ],
    "ellipses": [],
    "executionSnapshot": {
      "criticAttempts": [],
      "criticCallId": "deterministic-no-critic",
      "criticCallIds": [],
      "criticPromptVersion": "SEM-001-CRITIC-1.6",
      "executedAt": "2026-08-14T09:03:05.347Z",
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
          "Gestion des cas avec données ASL partielles sans DSC"
        ],
        "candidateId": "cand-ke1-06-rev2",
        "clarificationCandidates": [],
        "contradictions": [],
        "elements": [
          {
            "canonicalMeaning": "Arterial Spin Labeling MRI (ASL)",
            "clientElementId": "elem_01",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_10"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I06:R1",
            "sourceText": "l'ASL",
            "studyRole": "INTERVENTION_ARM",
            "supersedesElementIds": [],
            "type": "METHOD"
          },
          {
            "canonicalMeaning": "True progression",
            "clientElementId": "elem_02",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_11"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I06:R1",
            "sourceText": "progression vraie",
            "studyRole": "OUTCOME_ROLE",
            "supersedesElementIds": [],
            "type": "OUTCOME"
          },
          {
            "canonicalMeaning": "Pseudoprogression",
            "clientElementId": "elem_03",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_12"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I06:R1",
            "sourceText": "pseudoprogression",
            "studyRole": "OUTCOME_ROLE",
            "supersedesElementIds": [],
            "type": "OUTCOME"
          },
          {
            "canonicalMeaning": "3 months",
            "clientElementId": "elem_04",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_13"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I06:R1",
            "sourceText": "à 3 mois",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "TIMING"
          },
          {
            "canonicalMeaning": "Distinguish between true progression and pseudoprogression",
            "clientElementId": "elem_05",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_14"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I06:R1",
            "sourceText": "distinguer",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "SCIENTIFIC_INTENT"
          }
        ],
        "ellipses": [],
        "knowledgeRequests": [],
        "language": "fr",
        "missingConcepts": [],
        "normalizedMeaning": "L'utilisateur précise que \"la seconde\" désigne l'ASL et indique son intention de distinguer la vraie progression de la pseudoprogression à 3 mois.",
        "relations": [
          {
            "clientRelationId": "rel_01",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "rel_inv_10"
            ],
            "polarity": "AFFIRMED",
            "relationType": "DISTINGUISHED_FROM",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem_02",
            "targetClientElementId": "elem_03"
          },
          {
            "clientRelationId": "rel_02",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "rel_inv_11"
            ],
            "polarity": "AFFIRMED",
            "relationType": "REPEATED_AT",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem_02",
            "targetClientElementId": "elem_04"
          }
        ],
        "routeProposal": {
          "confidence": 0.95,
          "expectedCapabilities": [
            "Définition précise des critères d'évaluation d'imagerie",
            "Gestion des données partielles"
          ],
          "reason": "L'utilisateur affine les critères d'évaluation, les méthodes et les objectifs temporels pour son étude de cohorte sur les gliomes.",
          "route": "DESIGN_STUDY"
        },
        "semanticInventory": {
          "explicitFragments": [
            {
              "inventoryItemId": "inv_10",
              "linkedInventoryItemIds": [],
              "localRole": "object",
              "modifiers": [],
              "normalizedLabel": "ASL",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I06:R1",
              "sourceText": "l'ASL"
            },
            {
              "inventoryItemId": "inv_11",
              "linkedInventoryItemIds": [],
              "localRole": "target",
              "modifiers": [],
              "normalizedLabel": "Vraie progression",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I06:R1",
              "sourceText": "progression vraie"
            },
            {
              "inventoryItemId": "inv_12",
              "linkedInventoryItemIds": [],
              "localRole": "target",
              "modifiers": [],
              "normalizedLabel": "Pseudoprogression",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I06:R1",
              "sourceText": "pseudoprogression"
            },
            {
              "inventoryItemId": "inv_13",
              "linkedInventoryItemIds": [],
              "localRole": "timing",
              "modifiers": [],
              "normalizedLabel": "3 mois",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I06:R1",
              "sourceText": "à 3 mois"
            },
            {
              "inventoryItemId": "inv_14",
              "linkedInventoryItemIds": [],
              "localRole": "action",
              "modifiers": [],
              "normalizedLabel": "distinguer",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I06:R1",
              "sourceText": "distinguer"
            }
          ],
          "explicitRelations": [
            {
              "inventoryRelationId": "rel_inv_10",
              "normalizedRelation": "DISTINGUISHED_FROM",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "inv_11",
              "sourceMessageId": "I06:R1",
              "sourceText": "distinguer progression vraie et pseudoprogression",
              "targetInventoryItemId": "inv_12"
            },
            {
              "inventoryRelationId": "rel_inv_11",
              "normalizedRelation": "REPEATED_AT",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "inv_11",
              "sourceMessageId": "I06:R1",
              "sourceText": "progression vraie et pseudoprogression à 3 mois",
              "targetInventoryItemId": "inv_13"
            },
            {
              "inventoryRelationId": "rel_inv_12",
              "normalizedRelation": "OBSERVES",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "inv_14",
              "sourceMessageId": "I06:R1",
              "sourceText": "Je veux distinguer progression vraie et pseudoprogression",
              "targetInventoryItemId": "inv_11"
            }
          ]
        },
        "semanticWarnings": [],
        "summaryForUser": "L'ASL est confirmée comme seconde méthode, et l'objectif d'évaluation est précisé pour distinguer la progression vraie de la pseudoprogression à 3 mois.",
        "unknowns": []
      },
      "reconstructionAttempts": [
        {
          "attempt": 1,
          "category": null,
          "httpStatus": 200,
          "latencyMs": 5205,
          "outcome": "SUCCESS",
          "providerCode": null,
          "providerError": null,
          "providerStatus": null,
          "requestFinished": "2026-08-14T09:03:05.334Z",
          "requestStarted": "2026-08-14T09:03:00.129Z",
          "retryable": false
        }
      ],
      "reconstructionCallId": "gemini-call:ke1-06273ccbf3afa85f",
      "reconstructionPromptVersion": "SEM-001-RECONSTRUCTION-1.6",
      "schemaVersion": "SEM-001-1.1",
      "temperature": null
    },
    "explicitCoverageReport": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_10",
          "mappedClientElementIds": [
            "elem_01"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "ASL",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:R1",
          "sourceText": "l'ASL"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_11",
          "mappedClientElementIds": [
            "elem_02"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Vraie progression",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:R1",
          "sourceText": "progression vraie"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_12",
          "mappedClientElementIds": [
            "elem_03"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Pseudoprogression",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:R1",
          "sourceText": "pseudoprogression"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_13",
          "mappedClientElementIds": [
            "elem_04"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "3 mois",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:R1",
          "sourceText": "à 3 mois"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_14",
          "mappedClientElementIds": [
            "elem_05"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "distinguer",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:R1",
          "sourceText": "distinguer"
        }
      ],
      "status": "COMPLETE"
    },
    "history": [
      {
        "changeReason": "Nouvelle contribution utilisateur analysée sans réécriture de l’état antérieur.",
        "changedAt": "2026-08-14T09:01:56.771Z",
        "digest": "ke1-d5b3e47a669e0bce",
        "modelId": "semantic-model:ke1-c9c42e6a12a0fa0e",
        "revision": 1,
        "status": "CLARIFICATION_REQUIRED"
      }
    ],
    "knowledgeRequests": [],
    "knowledgeSnapshot": null,
    "missingConcepts": [],
    "normalizedMeaning": "L'utilisateur précise que \"la seconde\" désigne l'ASL et indique son intention de distinguer la vraie progression de la pseudoprogression à 3 mois.",
    "originalRequest": "Je compare DSC et ASL chez mes gliomes. Quand elles ne racontent pas la même chose, je veux savoir laquelle est la plus utile pour la progression. Pour ceux qui n'ont que la seconde, je préfère quand même les garder si c'est possible.",
    "previousModelId": "semantic-model:ke1-c9c42e6a12a0fa0e",
    "relationCoverageReport": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_inv_10",
          "mappedClientRelationIds": [
            "rel_01"
          ],
          "normalizedRelation": "DISTINGUISHED_FROM",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv_11",
          "targetInventoryItemId": "inv_12"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_inv_11",
          "mappedClientRelationIds": [
            "rel_02"
          ],
          "normalizedRelation": "REPEATED_AT",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv_11",
          "targetInventoryItemId": "inv_13"
        },
        {
          "coverageStatus": "EXPLICIT_RELATION_UNMAPPED",
          "inventoryRelationId": "rel_inv_12",
          "mappedClientRelationIds": [],
          "normalizedRelation": "OBSERVES",
          "reason": "The explicit relational construction has no mapped direct Semantic Relation between elements grounded to its inventory endpoints.",
          "sourceInventoryItemId": "inv_14",
          "targetInventoryItemId": "inv_11"
        }
      ],
      "status": "INCOMPLETE"
    },
    "relations": [
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_inv_10"
        ],
        "polarity": "AFFIRMED",
        "relationType": "DISTINGUISHED_FROM",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-591b5c827c246d36",
        "sourceElementId": "sem-element:ke1-4eb67123d6c92def",
        "targetElementId": "sem-element:ke1-8fc6798b686c807f",
        "version": 1,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_inv_11"
        ],
        "polarity": "AFFIRMED",
        "relationType": "REPEATED_AT",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-9223a6b11a3dfa5d",
        "sourceElementId": "sem-element:ke1-4eb67123d6c92def",
        "targetElementId": "sem-element:ke1-70c54d162229aeaa",
        "version": 1,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_inv_05"
        ],
        "polarity": "AFFIRMED",
        "relationType": "EVALUATES_OUTCOME",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-d54d0e4719830b6b",
        "sourceElementId": "sem-element:ke1-5597336786d51373",
        "targetElementId": "sem-element:ke1-9d17ea98e70586d4",
        "version": 2,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_inv_01",
          "rel_inv_02"
        ],
        "polarity": "AFFIRMED",
        "relationType": "COMPARES_WITH",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-f0026975eec42539",
        "sourceElementId": "sem-element:ke1-9c76acf0bb5c49e4",
        "targetElementId": "sem-element:ke1-7d40eceab438999e",
        "version": 2,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_inv_04"
        ],
        "polarity": "AFFIRMED",
        "relationType": "APPLIED_TO",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-f31c888f1bf656b3",
        "sourceElementId": "sem-element:ke1-7d40eceab438999e",
        "targetElementId": "sem-element:ke1-8976c0e4e1c67c20",
        "version": 2,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_inv_03"
        ],
        "polarity": "AFFIRMED",
        "relationType": "APPLIED_TO",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-fc58f298e796bb54",
        "sourceElementId": "sem-element:ke1-9c76acf0bb5c49e4",
        "targetElementId": "sem-element:ke1-8976c0e4e1c67c20",
        "version": 2,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      }
    ],
    "revision": 2,
    "routeProposal": {
      "confidence": 0.95,
      "expectedCapabilities": [
        "Définition précise des critères d'évaluation d'imagerie",
        "Gestion des données partielles"
      ],
      "reason": "L'utilisateur affine les critères d'évaluation, les méthodes et les objectifs temporels pour son étude de cohorte sur les gliomes.",
      "route": "DESIGN_STUDY"
    },
    "semanticModelId": "semantic-model:ke1-0c73c9e721e3f733",
    "semanticModelVersion": "1.1",
    "status": "CLARIFICATION_REQUIRED",
    "summaryForUser": "L'ASL est confirmée comme seconde méthode, et l'objectif d'évaluation est précisé pour distinguer la progression vraie de la pseudoprogression à 3 mois.",
    "unknowns": [],
    "updatedAt": "2026-08-14T09:03:05.347Z"
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

L'utilisateur précise que "la seconde" désigne l'ASL et indique son intention de distinguer la vraie progression de la pseudoprogression à 3 mois.

Objectif scientifique produit :

Distinguish between true progression and pseudoprogression

### EXPLICITEMENT DIT PAR LE CHERCHEUR

- content=True progression | scientificRole=OUTCOME:OUTCOME_ROLE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=progression vraie | provenanceTurnIds=["I06:R1"]
- content=Utility for progression assessment | scientificRole=ENDPOINT:OUTCOME_ROLE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=laquelle est la plus utile | provenanceTurnIds=["I06:T0"]
- content=3 months | scientificRole=TIMING:NONE | polarity=AFFIRMED | temporalContext=3 months | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=à 3 mois | provenanceTurnIds=["I06:R1"]
- content=Arterial Spin Labeling MRI (ASL) | scientificRole=METHOD:INTERVENTION_ARM | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=l'ASL | provenanceTurnIds=["I06:R1"]
- content=Distinguish between true progression and pseudoprogression | scientificRole=SCIENTIFIC_INTENT:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=distinguer | provenanceTurnIds=["I06:R1"]
- content=Glioma | scientificRole=CONDITION:SUBJECT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=gliomes | provenanceTurnIds=["I06:T0"]
- content=Pseudoprogression | scientificRole=OUTCOME:OUTCOME_ROLE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=pseudoprogression | provenanceTurnIds=["I06:R1"]
- content=Dynamic Susceptibility Contrast MRI (DSC) | scientificRole=METHOD:COMPARATOR_ARM | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=DSC | provenanceTurnIds=["I06:T0"]
- content=Tumor progression | scientificRole=OUTCOME:OUTCOME_ROLE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=progression | provenanceTurnIds=["I06:T0"]

### RELATIONS COMPRISES

- subject=True progression | predicate=DISTINGUISHED_FROM | object=Pseudoprogression | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=True progression | predicate=REPEATED_AT | object=3 months | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Utility for progression assessment | predicate=EVALUATES_OUTCOME | object=Tumor progression | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Dynamic Susceptibility Contrast MRI (DSC) | predicate=COMPARES_WITH | object=Arterial Spin Labeling MRI (ASL) | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Arterial Spin Labeling MRI (ASL) | predicate=APPLIED_TO | object=Glioma | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Dynamic Susceptibility Contrast MRI (DSC) | predicate=APPLIED_TO | object=Glioma | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER

### CONTEXTE INFÉRÉ

- Aucun élément produit.

### CANDIDATS SCIENTIFIQUES CONTEXTUELS

- Aucun élément produit.

### NÉGATIONS / CONTRAINTES

- Aucun élément produit.

### TEMPORALITÉ

- content=3 months | scientificRole=TIMING:NONE | polarity=AFFIRMED | temporalContext=3 months | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=à 3 mois | provenanceTurnIds=["I06:R1"]

### AMBIGUÏTÉS

- content=Gestion des cas avec données ASL partielles sans DSC | epistemicStatus=AMBIGUOUS | decisionImpact=SEM reports an unresolved ambiguity; impact requires clarification.

### INFORMATIONS MANQUANTES

- Aucun élément produit.

### INCONNUES

- Aucun élément produit.

### CORRECTIONS / SUPERSESSIONS

- Aucun élément produit.

### OWNERSHIP / STATUT ÉPISTÉMIQUE

- content=True progression | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I06:R1"]
- content=Utility for progression assessment | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I06:T0"]
- content=3 months | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I06:R1"]
- content=Arterial Spin Labeling MRI (ASL) | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I06:R1"]
- content=Distinguish between true progression and pseudoprogression | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I06:R1"]
- content=Glioma | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I06:T0"]
- content=Pseudoprogression | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I06:R1"]
- content=Dynamic Susceptibility Contrast MRI (DSC) | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I06:T0"]
- content=Tumor progression | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I06:T0"]

### QUESTIONS DE CLARIFICATION CANDIDATES

- Aucun élément produit.

## MISSING STRUCTURAL GUARANTEES

- EXACT_PROVIDER_RAW_TEXT_NOT_PERSISTED; STRUCTURED_NATIVE_ARTIFACT_AVAILABLE

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
