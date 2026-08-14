# I08 — SEM_SINGLE_PASS — COMMON_TRANSCRIPT T1

## INPUT

Message utilisateur courant VERBATIM :

> Oui, tous les centres ont du T1 natif. Non, l'ECV seulement deux centres.

Conversation précédente VERBATIM :

> I08:T0 | USER : Dans Fabry, on pense que le T1 natif pourrait être intéressant avant la fibrose, mais je n'ai pas décidé d'en faire le critère principal. À Lyon ils font aussi de l'ECV. Je veux surtout trouver un marqueur précoce qui soit utilisable dans tous les centres.

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/common-transcript-i08-t1-sem-single-pass.json`

```json
{
  "deterministicCoverage": {
    "explicit": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_t1_new",
          "mappedClientElementIds": [
            "elem_t1_new_01"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Disponibilité du T1 natif dans tous les centres",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:R1",
          "sourceText": "tous les centres ont du T1 natif"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_ecv_new",
          "mappedClientElementIds": [
            "elem_ecv_new_01"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Disponibilité de l'ECV dans seulement deux centres",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:R1",
          "sourceText": "l'ECV seulement deux centres"
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
          "inventoryRelationId": "rel_t1_all_centers",
          "mappedClientRelationIds": [
            "coalesced:elem_t1_new_01",
            "rel_client_t1_all"
          ],
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "item_t1_new",
          "targetInventoryItemId": "item_t1_new"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_ecv_two_centers",
          "mappedClientRelationIds": [
            "coalesced:elem_ecv_new_01",
            "rel_client_ecv_two"
          ],
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "item_ecv_new",
          "targetInventoryItemId": "item_ecv_new"
        }
      ],
      "status": "COMPLETE"
    },
    "taxonomy": {
      "findings": [],
      "status": "COMPLETE"
    }
  },
  "initialReconstruction": {
    "ambiguities": [],
    "candidateId": "cand-ke1-fixed-01",
    "clarificationCandidates": [],
    "contradictions": [],
    "elements": [
      {
        "canonicalMeaning": "Disponibilité du T1 natif dans tous les centres",
        "clientElementId": "elem_t1_new_01",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_t1_new"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I08:R1",
        "sourceText": "tous les centres ont du T1 natif",
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "BIOMARKER"
      },
      {
        "canonicalMeaning": "Disponibilité de l'ECV dans seulement deux centres",
        "clientElementId": "elem_ecv_new_01",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_ecv_new"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I08:R1",
        "sourceText": "l'ECV seulement deux centres",
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "BIOMARKER"
      }
    ],
    "ellipses": [],
    "knowledgeRequests": [],
    "language": "fr",
    "missingConcepts": [],
    "normalizedMeaning": "L'utilisateur confirme que tous les centres disposent du T1 natif, tandis que l'ECV n'est disponible que dans deux centres.",
    "relations": [
      {
        "clientRelationId": "rel_client_t1_all",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_t1_all_centers"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_t1_new_01",
        "targetClientElementId": "elem_t1_new_01"
      },
      {
        "clientRelationId": "rel_client_ecv_two",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_ecv_two_centers"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_ecv_new_01",
        "targetClientElementId": "elem_ecv_new_01"
      }
    ],
    "routeProposal": {
      "confidence": 0.9,
      "expectedCapabilities": [
        "METHOD_FEASIBILITY_CHECK"
      ],
      "reason": "L'utilisateur précise les contraintes opérationnelles et de disponibilité des méthodes pour concevoir l'étude.",
      "route": "DESIGN_STUDY"
    },
    "semanticInventory": {
      "explicitFragments": [
        {
          "inventoryItemId": "item_t1_new",
          "linkedInventoryItemIds": [],
          "localRole": "subject",
          "modifiers": [],
          "normalizedLabel": "Disponibilité du T1 natif dans tous les centres",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I08:R1",
          "sourceText": "tous les centres ont du T1 natif"
        },
        {
          "inventoryItemId": "item_ecv_new",
          "linkedInventoryItemIds": [],
          "localRole": "subject",
          "modifiers": [],
          "normalizedLabel": "Disponibilité de l'ECV dans seulement deux centres",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I08:R1",
          "sourceText": "l'ECV seulement deux centres"
        }
      ],
      "explicitRelations": [
        {
          "inventoryRelationId": "rel_t1_all_centers",
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "item_t1_new",
          "sourceMessageId": "I08:R1",
          "sourceText": "tous les centres ont du T1 natif",
          "targetInventoryItemId": "item_t1_new"
        },
        {
          "inventoryRelationId": "rel_ecv_two_centers",
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "item_ecv_new",
          "sourceMessageId": "I08:R1",
          "sourceText": "l'ECV seulement deux centres",
          "targetInventoryItemId": "item_ecv_new"
        }
      ]
    },
    "semanticWarnings": [],
    "summaryForUser": "Confirmation de la disponibilité universelle du T1 natif et restreinte de l'ECV dans les centres.",
    "unknowns": []
  },
  "model": {
    "acceptanceRecord": null,
    "acceptedAt": null,
    "ambiguities": [],
    "clarificationCandidates": [],
    "contradictions": [],
    "conversationMessageIds": [
      "I08:T0",
      "I08:R1"
    ],
    "createdAt": "2026-08-14T09:06:50.372Z",
    "critic": {
      "issues": [],
      "summary": "Single-pass deterministic reports complete; no semantic critic was executed.",
      "verdict": "ACCEPT"
    },
    "digest": "ke1-1e604aadd88eb6d9",
    "elements": [
      {
        "canonicalMeaning": "Avant le stade de fibrose",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_fibrose"
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
          "messageId": "I08:T0",
          "providerCallId": "gemini-call:ke1-bf67cae0f6d7251c",
          "rawElementId": "elem_fibrose",
          "source": "DETERMINISTIC_CARRY_FORWARD"
        },
        "relationships": [
          "sem-relation:ke1-a1a568ba9bcda3f6"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-295c9bdb5ee03d3f",
        "sourceSpan": {
          "end": 79,
          "messageId": "I08:T0",
          "start": 69,
          "text": "la fibrose"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "TIMING",
        "version": 2
      },
      {
        "canonicalMeaning": "Centre de Lyon",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_lyon"
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
          "messageId": "I08:T0",
          "providerCallId": "gemini-call:ke1-bf67cae0f6d7251c",
          "rawElementId": "elem_lyon",
          "source": "DETERMINISTIC_CARRY_FORWARD"
        },
        "relationships": [
          "sem-relation:ke1-49d4cfef796ab0a3"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-30a2ff4042cb4464",
        "sourceSpan": {
          "end": 144,
          "messageId": "I08:T0",
          "start": 140,
          "text": "Lyon"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "STUDY_DESIGN",
        "version": 2
      },
      {
        "canonicalMeaning": "Disponibilité du T1 natif dans tous les centres",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_t1_new"
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
          "messageId": "I08:R1",
          "providerCallId": "gemini-call:ke1-59f0cb2e402f86e2",
          "rawElementId": "elem_t1_new_01",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-0a2b8420e77b6ffc"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-85c1367a1fcdefe6",
        "sourceSpan": {
          "end": 37,
          "messageId": "I08:R1",
          "start": 5,
          "text": "tous les centres ont du T1 natif"
        },
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "BIOMARKER",
        "version": 1
      },
      {
        "canonicalMeaning": "Applicabilité multicentrique (tous les centres)",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_tous_centres"
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
          "messageId": "I08:T0",
          "providerCallId": "gemini-call:ke1-bf67cae0f6d7251c",
          "rawElementId": "elem_tous_centres",
          "source": "DETERMINISTIC_CARRY_FORWARD"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-8cbc19323026504e",
        "sourceSpan": {
          "end": 255,
          "messageId": "I08:T0",
          "start": 239,
          "text": "tous les centres"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "STUDY_DESIGN",
        "version": 2
      },
      {
        "canonicalMeaning": "Volume extracellulaire (ECV)",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_ecv"
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
          "messageId": "I08:T0",
          "providerCallId": "gemini-call:ke1-bf67cae0f6d7251c",
          "rawElementId": "elem_ecv",
          "source": "DETERMINISTIC_CARRY_FORWARD"
        },
        "relationships": [
          "sem-relation:ke1-49d4cfef796ab0a3"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-ac76601724e22d0b",
        "sourceSpan": {
          "end": 168,
          "messageId": "I08:T0",
          "start": 163,
          "text": "l'ECV"
        },
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "BIOMARKER",
        "version": 2
      },
      {
        "canonicalMeaning": "Maladie de Fabry",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_fabry"
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
          "messageId": "I08:T0",
          "providerCallId": "gemini-call:ke1-bf67cae0f6d7251c",
          "rawElementId": "elem_fabry",
          "source": "DETERMINISTIC_CARRY_FORWARD"
        },
        "relationships": [
          "sem-relation:ke1-51e03717530735ab"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-b4c3c91b3ce8d0af",
        "sourceSpan": {
          "end": 10,
          "messageId": "I08:T0",
          "start": 5,
          "text": "Fabry"
        },
        "studyRole": "SUBJECT",
        "supersedesElementIds": [],
        "type": "CONDITION",
        "version": 2
      },
      {
        "canonicalMeaning": "Disponibilité de l'ECV dans seulement deux centres",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_ecv_new"
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
          "messageId": "I08:R1",
          "providerCallId": "gemini-call:ke1-59f0cb2e402f86e2",
          "rawElementId": "elem_ecv_new_01",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-f369b11634855dca"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-ba4b5e637b8ab827",
        "sourceSpan": {
          "end": 72,
          "messageId": "I08:R1",
          "start": 44,
          "text": "l'ECV seulement deux centres"
        },
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "BIOMARKER",
        "version": 1
      },
      {
        "canonicalMeaning": "T1 natif",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_t1"
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
          "messageId": "I08:T0",
          "providerCallId": "gemini-call:ke1-bf67cae0f6d7251c",
          "rawElementId": "elem_t1",
          "source": "DETERMINISTIC_CARRY_FORWARD"
        },
        "relationships": [
          "sem-relation:ke1-3a508fe465c36798",
          "sem-relation:ke1-51e03717530735ab",
          "sem-relation:ke1-a1a568ba9bcda3f6"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-bb98f5f3e61f629f",
        "sourceSpan": {
          "end": 36,
          "messageId": "I08:T0",
          "start": 25,
          "text": "le T1 natif"
        },
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "BIOMARKER",
        "version": 2
      },
      {
        "canonicalMeaning": "Critère principal d'évaluation",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_critere"
        ],
        "knowledgeSupport": {
          "assertionRefs": [],
          "checkedAt": null,
          "gapRefs": [],
          "resultRef": null,
          "status": "NOT_CHECKED"
        },
        "polarity": "NEGATED",
        "provenance": {
          "messageId": "I08:T0",
          "providerCallId": "gemini-call:ke1-bf67cae0f6d7251c",
          "rawElementId": "elem_critere",
          "source": "DETERMINISTIC_CARRY_FORWARD"
        },
        "relationships": [
          "sem-relation:ke1-3a508fe465c36798"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-d8c9045b4f4590b7",
        "sourceSpan": {
          "end": 136,
          "messageId": "I08:T0",
          "start": 119,
          "text": "critère principal"
        },
        "studyRole": "OUTCOME_ROLE",
        "supersedesElementIds": [],
        "type": "ENDPOINT",
        "version": 2
      },
      {
        "canonicalMeaning": "Marqueur précoce",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_marqueur"
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
          "messageId": "I08:T0",
          "providerCallId": "gemini-call:ke1-bf67cae0f6d7251c",
          "rawElementId": "elem_marqueur",
          "source": "DETERMINISTIC_CARRY_FORWARD"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-e2421addbfdae4f1",
        "sourceSpan": {
          "end": 213,
          "messageId": "I08:T0",
          "start": 197,
          "text": "marqueur précoce"
        },
        "studyRole": "OUTCOME_ROLE",
        "supersedesElementIds": [],
        "type": "BIOMARKER",
        "version": 2
      }
    ],
    "ellipses": [],
    "executionSnapshot": {
      "criticAttempts": [],
      "criticCallId": "deterministic-no-critic",
      "criticCallIds": [],
      "criticPromptVersion": "SEM-001-CRITIC-1.6",
      "executedAt": "2026-08-14T09:07:46.259Z",
      "model": "gemini-3.5-flash-lite",
      "provider": "GOOGLE_GEMINI",
      "rawCritic": {
        "checklist": [
          {
            "check": "EVERY_EXPLICIT_OBJECT_REPRESENTED",
            "evidence": "Deterministic coverage, relation, taxonomy and integrity reports are complete.",
            "result": "PASS"
          },
          {
            "check": "EVERY_COMPARATOR_REPRESENTED",
            "evidence": "Deterministic coverage, relation, taxonomy and integrity reports are complete.",
            "result": "PASS"
          },
          {
            "check": "EVERY_INTERVENTION_REPRESENTED",
            "evidence": "Deterministic coverage, relation, taxonomy and integrity reports are complete.",
            "result": "PASS"
          },
          {
            "check": "EVERY_MODALITY_REPRESENTED",
            "evidence": "Deterministic coverage, relation, taxonomy and integrity reports are complete.",
            "result": "PASS"
          },
          {
            "check": "EVERY_EXPLICIT_RELATION_REPRESENTED",
            "evidence": "Deterministic coverage, relation, taxonomy and integrity reports are complete.",
            "result": "PASS"
          },
          {
            "check": "NO_INCOMPATIBLE_OBJECT_TYPE",
            "evidence": "Deterministic coverage, relation, taxonomy and integrity reports are complete.",
            "result": "PASS"
          },
          {
            "check": "NO_EXPLICIT_RELATION_WEAKENED",
            "evidence": "Deterministic coverage, relation, taxonomy and integrity reports are complete.",
            "result": "PASS"
          },
          {
            "check": "NO_INFERENCE_PROMOTED",
            "evidence": "Deterministic coverage, relation, taxonomy and integrity reports are complete.",
            "result": "PASS"
          },
          {
            "check": "NO_AMBIGUITY_HIDDEN",
            "evidence": "Deterministic coverage, relation, taxonomy and integrity reports are complete.",
            "result": "PASS"
          },
          {
            "check": "NO_NEGATION_REVERSED_OR_IGNORED",
            "evidence": "Deterministic coverage, relation, taxonomy and integrity reports are complete.",
            "result": "PASS"
          },
          {
            "check": "NO_TIMING_LOST",
            "evidence": "Deterministic coverage, relation, taxonomy and integrity reports are complete.",
            "result": "PASS"
          },
          {
            "check": "NO_UNSUPPORTED_OUTCOME_ENDPOINT_PROMOTION",
            "evidence": "Deterministic coverage, relation, taxonomy and integrity reports are complete.",
            "result": "PASS"
          },
          {
            "check": "NO_SPECIFIC_CONCEPT_GENERALIZED",
            "evidence": "Deterministic coverage, relation, taxonomy and integrity reports are complete.",
            "result": "PASS"
          },
          {
            "check": "NO_IMPORTANT_FRAGMENT_UNREPRESENTED",
            "evidence": "Deterministic coverage, relation, taxonomy and integrity reports are complete.",
            "result": "PASS"
          },
          {
            "check": "ROUTE_MATCHES_COMPLETE_SEMANTIC_MODEL",
            "evidence": "Deterministic coverage, relation, taxonomy and integrity reports are complete.",
            "result": "PASS"
          }
        ],
        "criticId": "EXP-SEM-ABLATION-02-DETERMINISTIC-NO-LLM-CRITIC",
        "criticSummary": "Single-pass deterministic reports complete; no semantic critic was executed.",
        "issues": [],
        "missingExplicitSourceFragments": [],
        "proposedRepairs": [],
        "verdict": "ACCEPT"
      },
      "rawCritics": [],
      "rawReconstruction": {
        "ambiguities": [],
        "candidateId": "cand-ke1-fixed-01",
        "clarificationCandidates": [],
        "contradictions": [],
        "elements": [
          {
            "canonicalMeaning": "Disponibilité du T1 natif dans tous les centres",
            "clientElementId": "elem_t1_new_01",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "item_t1_new"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I08:R1",
            "sourceText": "tous les centres ont du T1 natif",
            "studyRole": "MEASUREMENT",
            "supersedesElementIds": [],
            "type": "BIOMARKER"
          },
          {
            "canonicalMeaning": "Disponibilité de l'ECV dans seulement deux centres",
            "clientElementId": "elem_ecv_new_01",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "item_ecv_new"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I08:R1",
            "sourceText": "l'ECV seulement deux centres",
            "studyRole": "MEASUREMENT",
            "supersedesElementIds": [],
            "type": "BIOMARKER"
          }
        ],
        "ellipses": [],
        "knowledgeRequests": [],
        "language": "fr",
        "missingConcepts": [],
        "normalizedMeaning": "L'utilisateur confirme que tous les centres disposent du T1 natif, tandis que l'ECV n'est disponible que dans deux centres.",
        "relations": [
          {
            "clientRelationId": "rel_client_t1_all",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "rel_t1_all_centers"
            ],
            "polarity": "AFFIRMED",
            "relationType": "RELATED_TO_CANDIDATE",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem_t1_new_01",
            "targetClientElementId": "elem_t1_new_01"
          },
          {
            "clientRelationId": "rel_client_ecv_two",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "rel_ecv_two_centers"
            ],
            "polarity": "AFFIRMED",
            "relationType": "RELATED_TO_CANDIDATE",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem_ecv_new_01",
            "targetClientElementId": "elem_ecv_new_01"
          }
        ],
        "routeProposal": {
          "confidence": 0.9,
          "expectedCapabilities": [
            "METHOD_FEASIBILITY_CHECK"
          ],
          "reason": "L'utilisateur précise les contraintes opérationnelles et de disponibilité des méthodes pour concevoir l'étude.",
          "route": "DESIGN_STUDY"
        },
        "semanticInventory": {
          "explicitFragments": [
            {
              "inventoryItemId": "item_t1_new",
              "linkedInventoryItemIds": [],
              "localRole": "subject",
              "modifiers": [],
              "normalizedLabel": "Disponibilité du T1 natif dans tous les centres",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I08:R1",
              "sourceText": "tous les centres ont du T1 natif"
            },
            {
              "inventoryItemId": "item_ecv_new",
              "linkedInventoryItemIds": [],
              "localRole": "subject",
              "modifiers": [],
              "normalizedLabel": "Disponibilité de l'ECV dans seulement deux centres",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I08:R1",
              "sourceText": "l'ECV seulement deux centres"
            }
          ],
          "explicitRelations": [
            {
              "inventoryRelationId": "rel_t1_all_centers",
              "normalizedRelation": "RELATED_TO_CANDIDATE",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "item_t1_new",
              "sourceMessageId": "I08:R1",
              "sourceText": "tous les centres ont du T1 natif",
              "targetInventoryItemId": "item_t1_new"
            },
            {
              "inventoryRelationId": "rel_ecv_two_centers",
              "normalizedRelation": "RELATED_TO_CANDIDATE",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "item_ecv_new",
              "sourceMessageId": "I08:R1",
              "sourceText": "l'ECV seulement deux centres",
              "targetInventoryItemId": "item_ecv_new"
            }
          ]
        },
        "semanticWarnings": [],
        "summaryForUser": "Confirmation de la disponibilité universelle du T1 natif et restreinte de l'ECV dans les centres.",
        "unknowns": []
      },
      "reconstructionAttempts": [
        {
          "attempt": 1,
          "category": null,
          "httpStatus": 200,
          "latencyMs": 6677,
          "outcome": "SUCCESS",
          "providerCode": null,
          "providerError": null,
          "providerStatus": null,
          "requestFinished": "2026-08-14T09:07:41.557Z",
          "requestStarted": "2026-08-14T09:07:34.880Z",
          "retryable": false
        },
        {
          "attempt": 1,
          "category": null,
          "httpStatus": 200,
          "latencyMs": 4678,
          "outcome": "SUCCESS",
          "providerCode": null,
          "providerError": null,
          "providerStatus": null,
          "requestFinished": "2026-08-14T09:07:46.249Z",
          "requestStarted": "2026-08-14T09:07:41.571Z",
          "retryable": false
        }
      ],
      "reconstructionCallId": "gemini-call:ke1-59f0cb2e402f86e2",
      "reconstructionPromptVersion": "SEM-001-RECONSTRUCTION-1.6",
      "schemaVersion": "SEM-001-1.1",
      "temperature": null
    },
    "explicitCoverageReport": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_t1_new",
          "mappedClientElementIds": [
            "elem_t1_new_01"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Disponibilité du T1 natif dans tous les centres",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:R1",
          "sourceText": "tous les centres ont du T1 natif"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_ecv_new",
          "mappedClientElementIds": [
            "elem_ecv_new_01"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Disponibilité de l'ECV dans seulement deux centres",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:R1",
          "sourceText": "l'ECV seulement deux centres"
        }
      ],
      "status": "COMPLETE"
    },
    "history": [
      {
        "changeReason": "Nouvelle contribution utilisateur analysée sans réécriture de l’état antérieur.",
        "changedAt": "2026-08-14T09:06:50.372Z",
        "digest": "ke1-c89248ba0937369e",
        "modelId": "semantic-model:ke1-969de3961c2bc49a",
        "revision": 1,
        "status": "CLARIFICATION_REQUIRED"
      }
    ],
    "knowledgeRequests": [],
    "knowledgeSnapshot": null,
    "missingConcepts": [],
    "normalizedMeaning": "L'utilisateur confirme que tous les centres disposent du T1 natif, tandis que l'ECV n'est disponible que dans deux centres.",
    "originalRequest": "Dans Fabry, on pense que le T1 natif pourrait être intéressant avant la fibrose, mais je n'ai pas décidé d'en faire le critère principal. À Lyon ils font aussi de l'ECV. Je veux surtout trouver un marqueur précoce qui soit utilisable dans tous les centres.",
    "previousModelId": "semantic-model:ke1-969de3961c2bc49a",
    "relationCoverageReport": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_t1_all_centers",
          "mappedClientRelationIds": [
            "coalesced:elem_t1_new_01",
            "rel_client_t1_all"
          ],
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "item_t1_new",
          "targetInventoryItemId": "item_t1_new"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_ecv_two_centers",
          "mappedClientRelationIds": [
            "coalesced:elem_ecv_new_01",
            "rel_client_ecv_two"
          ],
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "item_ecv_new",
          "targetInventoryItemId": "item_ecv_new"
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
          "rel_t1_all_centers"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-0a2b8420e77b6ffc",
        "sourceElementId": "sem-element:ke1-85c1367a1fcdefe6",
        "targetElementId": "sem-element:ke1-85c1367a1fcdefe6",
        "version": 1,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_t1_critere"
        ],
        "polarity": "NEGATED",
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-3a508fe465c36798",
        "sourceElementId": "sem-element:ke1-bb98f5f3e61f629f",
        "targetElementId": "sem-element:ke1-d8c9045b4f4590b7",
        "version": 2,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_lyon_ecv"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-49d4cfef796ab0a3",
        "sourceElementId": "sem-element:ke1-ac76601724e22d0b",
        "targetElementId": "sem-element:ke1-30a2ff4042cb4464",
        "version": 2,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_t1_fabry"
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
          "rel_t1_fibrose"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RECOVERS_AFTER",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-a1a568ba9bcda3f6",
        "sourceElementId": "sem-element:ke1-bb98f5f3e61f629f",
        "targetElementId": "sem-element:ke1-295c9bdb5ee03d3f",
        "version": 2,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_ecv_two_centers"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-f369b11634855dca",
        "sourceElementId": "sem-element:ke1-ba4b5e637b8ab827",
        "targetElementId": "sem-element:ke1-ba4b5e637b8ab827",
        "version": 1,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      }
    ],
    "revision": 2,
    "routeProposal": {
      "confidence": 0.9,
      "expectedCapabilities": [
        "METHOD_FEASIBILITY_CHECK"
      ],
      "reason": "L'utilisateur précise les contraintes opérationnelles et de disponibilité des méthodes pour concevoir l'étude.",
      "route": "DESIGN_STUDY"
    },
    "semanticModelId": "semantic-model:ke1-1ed2491dde866031",
    "semanticModelVersion": "1.1",
    "status": "CANDIDATE",
    "summaryForUser": "Confirmation de la disponibilité universelle du T1 natif et restreinte de l'ECV dans les centres.",
    "unknowns": [],
    "updatedAt": "2026-08-14T09:07:46.259Z"
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

L'utilisateur confirme que tous les centres disposent du T1 natif, tandis que l'ECV n'est disponible que dans deux centres.

Objectif scientifique produit :

L'utilisateur confirme que tous les centres disposent du T1 natif, tandis que l'ECV n'est disponible que dans deux centres.

### EXPLICITEMENT DIT PAR LE CHERCHEUR

- content=Avant le stade de fibrose | scientificRole=TIMING:NONE | polarity=AFFIRMED | temporalContext=Avant le stade de fibrose | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=la fibrose | provenanceTurnIds=["I08:T0"]
- content=Centre de Lyon | scientificRole=STUDY_DESIGN:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Lyon | provenanceTurnIds=["I08:T0"]
- content=Disponibilité du T1 natif dans tous les centres | scientificRole=BIOMARKER:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=tous les centres ont du T1 natif | provenanceTurnIds=["I08:R1"]
- content=Applicabilité multicentrique (tous les centres) | scientificRole=STUDY_DESIGN:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=tous les centres | provenanceTurnIds=["I08:T0"]
- content=Volume extracellulaire (ECV) | scientificRole=BIOMARKER:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=l'ECV | provenanceTurnIds=["I08:T0"]
- content=Maladie de Fabry | scientificRole=CONDITION:SUBJECT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Fabry | provenanceTurnIds=["I08:T0"]
- content=Disponibilité de l'ECV dans seulement deux centres | scientificRole=BIOMARKER:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=l'ECV seulement deux centres | provenanceTurnIds=["I08:R1"]
- content=T1 natif | scientificRole=BIOMARKER:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=le T1 natif | provenanceTurnIds=["I08:T0"]
- content=Critère principal d'évaluation | scientificRole=ENDPOINT:OUTCOME_ROLE | polarity=NEGATED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=critère principal | provenanceTurnIds=["I08:T0"]
- content=Marqueur précoce | scientificRole=BIOMARKER:OUTCOME_ROLE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=marqueur précoce | provenanceTurnIds=["I08:T0"]

### RELATIONS COMPRISES

- subject=Disponibilité du T1 natif dans tous les centres | predicate=RELATED_TO_CANDIDATE | object=Disponibilité du T1 natif dans tous les centres | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=T1 natif | predicate=RELATED_TO_CANDIDATE | object=Critère principal d'évaluation | polarity=NEGATED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Volume extracellulaire (ECV) | predicate=RELATED_TO_CANDIDATE | object=Centre de Lyon | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=T1 natif | predicate=RELATED_TO_CANDIDATE | object=Maladie de Fabry | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=T1 natif | predicate=RECOVERS_AFTER | object=Avant le stade de fibrose | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Disponibilité de l'ECV dans seulement deux centres | predicate=RELATED_TO_CANDIDATE | object=Disponibilité de l'ECV dans seulement deux centres | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER

### CONTEXTE INFÉRÉ

- Aucun élément produit.

### CANDIDATS SCIENTIFIQUES CONTEXTUELS

- Aucun élément produit.

### NÉGATIONS / CONTRAINTES

- content=Critère principal d'évaluation | scientificRole=ENDPOINT:OUTCOME_ROLE | polarity=NEGATED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=critère principal | provenanceTurnIds=["I08:T0"]

### TEMPORALITÉ

- content=Avant le stade de fibrose | scientificRole=TIMING:NONE | polarity=AFFIRMED | temporalContext=Avant le stade de fibrose | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=la fibrose | provenanceTurnIds=["I08:T0"]

### AMBIGUÏTÉS

- Aucun élément produit.

### INFORMATIONS MANQUANTES

- Aucun élément produit.

### INCONNUES

- Aucun élément produit.

### CORRECTIONS / SUPERSESSIONS

- Aucun élément produit.

### OWNERSHIP / STATUT ÉPISTÉMIQUE

- content=Avant le stade de fibrose | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:T0"]
- content=Centre de Lyon | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:T0"]
- content=Disponibilité du T1 natif dans tous les centres | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:R1"]
- content=Applicabilité multicentrique (tous les centres) | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:T0"]
- content=Volume extracellulaire (ECV) | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:T0"]
- content=Maladie de Fabry | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:T0"]
- content=Disponibilité de l'ECV dans seulement deux centres | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:R1"]
- content=T1 natif | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:T0"]
- content=Critère principal d'évaluation | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:T0"]
- content=Marqueur précoce | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:T0"]

### QUESTIONS DE CLARIFICATION CANDIDATES

- Aucun élément produit.

## MISSING STRUCTURAL GUARANTEES

- EXACT_PROVIDER_RAW_TEXT_NOT_PERSISTED; STRUCTURED_NATIVE_ARTIFACT_AVAILABLE

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
