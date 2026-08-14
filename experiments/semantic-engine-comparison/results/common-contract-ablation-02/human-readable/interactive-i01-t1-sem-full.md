# I01 — SEM_FULL — INTERACTIVE T1

## INPUT

Message utilisateur courant VERBATIM :

> Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.

Conversation précédente VERBATIM :

> —

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/interactive-i01-t1-sem-full.json`

```json
{
  "criticCycles": {
    "accepted": true,
    "attempts": [
      {
        "attempt": 1,
        "category": null,
        "httpStatus": 200,
        "latencyMs": 3041,
        "outcome": "SUCCESS",
        "providerCode": null,
        "providerError": null,
        "providerStatus": null,
        "requestFinished": "2026-08-14T09:16:00.600Z",
        "requestStarted": "2026-08-14T09:15:57.559Z",
        "retryable": false
      }
    ],
    "callIds": [
      "gemini-call:ke1-641e0ed12a9be1cd"
    ],
    "candidate": {
      "ambiguities": [],
      "candidateId": "cand-ke1-ff1f88475e3908f3",
      "clarificationCandidates": [],
      "contradictions": [],
      "elements": [
        {
          "canonicalMeaning": "Je veux comparer",
          "clientElementId": "elem_01",
          "confidence": 1,
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "inferenceReason": null,
          "inventoryItemIds": [
            "item_01"
          ],
          "polarity": "AFFIRMED",
          "requiresConfirmation": false,
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "comparer",
          "studyRole": "NONE",
          "supersedesElementIds": [],
          "type": "OPERATION"
        },
        {
          "canonicalMeaning": "stent immédiat",
          "clientElementId": "elem_02",
          "confidence": 1,
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "inferenceReason": null,
          "inventoryItemIds": [
            "item_02"
          ],
          "polarity": "AFFIRMED",
          "requiresConfirmation": false,
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "stent immédiat",
          "studyRole": "INTERVENTION_ARM",
          "supersedesElementIds": [],
          "type": "INTERVENTION"
        },
        {
          "canonicalMeaning": "stent différé",
          "clientElementId": "elem_03",
          "confidence": 1,
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "inferenceReason": null,
          "inventoryItemIds": [
            "item_03"
          ],
          "polarity": "AFFIRMED",
          "requiresConfirmation": false,
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "stent différé",
          "studyRole": "COMPARATOR_ARM",
          "supersedesElementIds": [],
          "type": "COMPARATOR"
        },
        {
          "canonicalMeaning": "infarctus",
          "clientElementId": "elem_04",
          "confidence": 1,
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "inferenceReason": null,
          "inventoryItemIds": [
            "item_04"
          ],
          "polarity": "AFFIRMED",
          "requiresConfirmation": false,
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "infarctus",
          "studyRole": "NONE",
          "supersedesElementIds": [],
          "type": "CONDITION"
        },
        {
          "canonicalMeaning": "voir",
          "clientElementId": "elem_05",
          "confidence": 1,
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "inferenceReason": null,
          "inventoryItemIds": [
            "item_05"
          ],
          "polarity": "AFFIRMED",
          "requiresConfirmation": false,
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "voir",
          "studyRole": "NONE",
          "supersedesElementIds": [],
          "type": "SCIENTIFIC_INTENT"
        },
        {
          "canonicalMeaning": "lésions",
          "clientElementId": "elem_06",
          "confidence": 1,
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "inferenceReason": null,
          "inventoryItemIds": [
            "item_06"
          ],
          "polarity": "AFFIRMED",
          "requiresConfirmation": false,
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "lésions",
          "studyRole": "SUBJECT",
          "supersedesElementIds": [],
          "type": "SCIENTIFIC_OBJECT"
        },
        {
          "canonicalMeaning": "IRM",
          "clientElementId": "elem_07",
          "confidence": 1,
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "inferenceReason": null,
          "inventoryItemIds": [
            "item_07"
          ],
          "polarity": "AFFIRMED",
          "requiresConfirmation": false,
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "IRM",
          "studyRole": "MEASUREMENT",
          "supersedesElementIds": [],
          "type": "MODALITY"
        }
      ],
      "ellipses": [],
      "knowledgeRequests": [],
      "language": "fr",
      "missingConcepts": [],
      "normalizedMeaning": "Comparison between immediate stenting and delayed stenting in myocardial infarction, observing lesions using MRI.",
      "relations": [
        {
          "clientRelationId": "rel_01",
          "confidence": 1,
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "inferenceReason": null,
          "inventoryRelationIds": [
            "rel_01"
          ],
          "polarity": "AFFIRMED",
          "relationType": "COMPARES_WITH",
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
            "rel_02"
          ],
          "polarity": "AFFIRMED",
          "relationType": "APPLIES_TO",
          "requiresConfirmation": false,
          "sourceClientElementId": "elem_02",
          "targetClientElementId": "elem_04"
        },
        {
          "clientRelationId": "rel_03",
          "confidence": 1,
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "inferenceReason": null,
          "inventoryRelationIds": [
            "rel_03"
          ],
          "polarity": "AFFIRMED",
          "relationType": "OBSERVED_BY",
          "requiresConfirmation": false,
          "sourceClientElementId": "elem_06",
          "targetClientElementId": "elem_07"
        }
      ],
      "routeProposal": {
        "confidence": 0.95,
        "expectedCapabilities": [
          "study design structuring",
          "intervention arm configuration",
          "imaging endpoint specification"
        ],
        "reason": "The user is setting up a comparative study protocol involving interventions, a condition, and a measurement modality.",
        "route": "DESIGN_STUDY"
      },
      "semanticInventory": {
        "explicitFragments": [
          {
            "inventoryItemId": "item_01",
            "linkedInventoryItemIds": [
              "item_02",
              "item_03"
            ],
            "localRole": "action",
            "modifiers": [],
            "normalizedLabel": "comparer",
            "polarity": "AFFIRMED",
            "sourceMessageId": "I01:SEM_FULL:T0",
            "sourceText": "comparer"
          },
          {
            "inventoryItemId": "item_02",
            "linkedInventoryItemIds": [
              "item_01",
              "item_03",
              "item_04"
            ],
            "localRole": "intervention_1",
            "modifiers": [
              "immédiat"
            ],
            "normalizedLabel": "stent immédiat",
            "polarity": "AFFIRMED",
            "sourceMessageId": "I01:SEM_FULL:T0",
            "sourceText": "stent immédiat"
          },
          {
            "inventoryItemId": "item_03",
            "linkedInventoryItemIds": [
              "item_01",
              "item_02"
            ],
            "localRole": "intervention_2",
            "modifiers": [
              "différé"
            ],
            "normalizedLabel": "stent différé",
            "polarity": "AFFIRMED",
            "sourceMessageId": "I01:SEM_FULL:T0",
            "sourceText": "stent différé"
          },
          {
            "inventoryItemId": "item_04",
            "linkedInventoryItemIds": [
              "item_02"
            ],
            "localRole": "condition",
            "modifiers": [],
            "normalizedLabel": "infarctus",
            "polarity": "AFFIRMED",
            "sourceMessageId": "I01:SEM_FULL:T0",
            "sourceText": "infarctus"
          },
          {
            "inventoryItemId": "item_05",
            "linkedInventoryItemIds": [
              "item_06",
              "item_07"
            ],
            "localRole": "intent",
            "modifiers": [],
            "normalizedLabel": "voir",
            "polarity": "AFFIRMED",
            "sourceMessageId": "I01:SEM_FULL:T0",
            "sourceText": "voir"
          },
          {
            "inventoryItemId": "item_06",
            "linkedInventoryItemIds": [
              "item_05",
              "item_07"
            ],
            "localRole": "object",
            "modifiers": [],
            "normalizedLabel": "lésions",
            "polarity": "AFFIRMED",
            "sourceMessageId": "I01:SEM_FULL:T0",
            "sourceText": "lésions"
          },
          {
            "inventoryItemId": "item_07",
            "linkedInventoryItemIds": [
              "item_05",
              "item_06"
            ],
            "localRole": "modality",
            "modifiers": [],
            "normalizedLabel": "IRM",
            "polarity": "AFFIRMED",
            "sourceMessageId": "I01:SEM_FULL:T0",
            "sourceText": "IRM"
          }
        ],
        "explicitRelations": [
          {
            "inventoryRelationId": "rel_01",
            "normalizedRelation": "COMPARES_WITH",
            "polarity": "AFFIRMED",
            "sourceInventoryItemId": "item_02",
            "sourceMessageId": "I01:SEM_FULL:T0",
            "sourceText": "comparer le stent immédiat au stent différé",
            "targetInventoryItemId": "item_03"
          },
          {
            "inventoryRelationId": "rel_02",
            "normalizedRelation": "APPLIES_TO",
            "polarity": "AFFIRMED",
            "sourceInventoryItemId": "item_02",
            "sourceMessageId": "I01:SEM_FULL:T0",
            "sourceText": "stent immédiat au stent différé dans l'infarctus",
            "targetInventoryItemId": "item_04"
          },
          {
            "inventoryRelationId": "rel_03",
            "normalizedRelation": "OBSERVED_BY",
            "polarity": "AFFIRMED",
            "sourceInventoryItemId": "item_06",
            "sourceMessageId": "I01:SEM_FULL:T0",
            "sourceText": "voir les lésions en IRM",
            "targetInventoryItemId": "item_07"
          }
        ]
      },
      "semanticWarnings": [],
      "summaryForUser": "Comparaison entre stent immédiat et stent différé dans l'infarctus, avec observation des lésions en IRM.",
      "unknowns": []
    },
    "critics": [
      {
        "checklist": [
          {
            "check": "EVERY_EXPLICIT_OBJECT_REPRESENTED",
            "evidence": "All explicit fragments including stent immédiat, stent différé, infarctus, lesions, and IRM are successfully represented in the candidate elements.",
            "result": "PASS"
          },
          {
            "check": "EVERY_COMPARATOR_REPRESENTED",
            "evidence": "Stent différé is correctly represented as a COMPARATOR with COMPARATOR_ARM study role.",
            "result": "PASS"
          },
          {
            "check": "EVERY_INTERVENTION_REPRESENTED",
            "evidence": "Stent immédiat is correctly represented as an INTERVENTION with INTERVENTION_ARM study role.",
            "result": "PASS"
          },
          {
            "check": "EVERY_MODALITY_REPRESENTED",
            "evidence": "IRM is correctly represented as a MODALITY.",
            "result": "PASS"
          },
          {
            "check": "EVERY_EXPLICIT_RELATION_REPRESENTED",
            "evidence": "All explicit relations (COMPARES_WITH, APPLIES_TO, OBSERVED_BY) are fully mapped.",
            "result": "PASS"
          },
          {
            "check": "NO_INCOMPATIBLE_OBJECT_TYPE",
            "evidence": "Taxonomy report is complete with zero type mismatches or violations.",
            "result": "PASS"
          },
          {
            "check": "NO_EXPLICIT_RELATION_WEAKENED",
            "evidence": "No explicit relations were weakened or converted into inferences.",
            "result": "PASS"
          },
          {
            "check": "NO_INFERENCE_PROMOTED",
            "evidence": "All elements and relations are strictly grounded on user statements.",
            "result": "PASS"
          },
          {
            "check": "NO_AMBIGUITY_HIDDEN",
            "evidence": "No ambiguities were suppressed.",
            "result": "PASS"
          },
          {
            "check": "NO_NEGATION_REVERSED_OR_IGNORED",
            "evidence": "Polarities are correctly preserved as AFFIRMED.",
            "result": "PASS"
          },
          {
            "check": "NO_TIMING_LOST",
            "evidence": "No temporal expressions were omitted.",
            "result": "PASS"
          },
          {
            "check": "NO_UNSUPPORTED_OUTCOME_ENDPOINT_PROMOTION",
            "evidence": "No outcome has been promoted to endpoint without user specification.",
            "result": "PASS"
          },
          {
            "check": "NO_SPECIFIC_CONCEPT_GENERALIZED",
            "evidence": "Specific technical concepts and terms are preserved without unauthorized generalization.",
            "result": "PASS"
          },
          {
            "check": "NO_IMPORTANT_FRAGMENT_UNREPRESENTED",
            "evidence": "Missing explicit source fragments list is empty.",
            "result": "PASS"
          },
          {
            "check": "ROUTE_MATCHES_COMPLETE_SEMANTIC_MODEL",
            "evidence": "The route DESIGN_STUDY appropriately fits a study setup involving interventions, conditions, and observation modalities.",
            "result": "PASS"
          }
        ],
        "criticId": "critic-ke1-ff1f88475e3908f3",
        "criticSummary": "All checks passed successfully. The semantic model, inventory coverage, relation coverage, taxonomy report, and integrity report are complete and consistent with the source text.",
        "issues": [],
        "missingExplicitSourceFragments": [],
        "proposedRepairs": [],
        "verdict": "ACCEPT"
      }
    ],
    "cycleAttempts": [
      [
        {
          "attempt": 1,
          "category": null,
          "httpStatus": 200,
          "latencyMs": 3041,
          "outcome": "SUCCESS",
          "providerCode": null,
          "providerError": null,
          "providerStatus": null,
          "requestFinished": "2026-08-14T09:16:00.600Z",
          "requestStarted": "2026-08-14T09:15:57.559Z",
          "retryable": false
        }
      ]
    ],
    "repairDiagnostics": [],
    "terminalReason": "CRITIC_ACCEPTED_AFTER_COMPLETE_AUDIT"
  },
  "initialReconstruction": {
    "ambiguities": [],
    "candidateId": "cand-ke1-ff1f88475e3908f3",
    "clarificationCandidates": [],
    "contradictions": [],
    "elements": [
      {
        "canonicalMeaning": "Je veux comparer",
        "clientElementId": "elem_01",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_01"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I01:SEM_FULL:T0",
        "sourceText": "comparer",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "OPERATION"
      },
      {
        "canonicalMeaning": "stent immédiat",
        "clientElementId": "elem_02",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_02"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I01:SEM_FULL:T0",
        "sourceText": "stent immédiat",
        "studyRole": "INTERVENTION_ARM",
        "supersedesElementIds": [],
        "type": "INTERVENTION"
      },
      {
        "canonicalMeaning": "stent différé",
        "clientElementId": "elem_03",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_03"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I01:SEM_FULL:T0",
        "sourceText": "stent différé",
        "studyRole": "COMPARATOR_ARM",
        "supersedesElementIds": [],
        "type": "COMPARATOR"
      },
      {
        "canonicalMeaning": "infarctus",
        "clientElementId": "elem_04",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_04"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I01:SEM_FULL:T0",
        "sourceText": "infarctus",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONDITION"
      },
      {
        "canonicalMeaning": "voir",
        "clientElementId": "elem_05",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_05"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I01:SEM_FULL:T0",
        "sourceText": "voir",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_INTENT"
      },
      {
        "canonicalMeaning": "lésions",
        "clientElementId": "elem_06",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_06"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I01:SEM_FULL:T0",
        "sourceText": "lésions",
        "studyRole": "SUBJECT",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_OBJECT"
      },
      {
        "canonicalMeaning": "IRM",
        "clientElementId": "elem_07",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_07"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I01:SEM_FULL:T0",
        "sourceText": "IRM",
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "MODALITY"
      }
    ],
    "ellipses": [],
    "knowledgeRequests": [],
    "language": "fr",
    "missingConcepts": [],
    "normalizedMeaning": "Comparison between immediate stenting and delayed stenting in myocardial infarction, observing lesions using MRI.",
    "relations": [
      {
        "clientRelationId": "rel_01",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_01"
        ],
        "polarity": "AFFIRMED",
        "relationType": "COMPARES_WITH",
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
          "rel_02"
        ],
        "polarity": "AFFIRMED",
        "relationType": "APPLIES_TO",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_02",
        "targetClientElementId": "elem_04"
      },
      {
        "clientRelationId": "rel_03",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_03"
        ],
        "polarity": "AFFIRMED",
        "relationType": "OBSERVED_BY",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_06",
        "targetClientElementId": "elem_07"
      }
    ],
    "routeProposal": {
      "confidence": 0.95,
      "expectedCapabilities": [
        "study design structuring",
        "intervention arm configuration",
        "imaging endpoint specification"
      ],
      "reason": "The user is setting up a comparative study protocol involving interventions, a condition, and a measurement modality.",
      "route": "DESIGN_STUDY"
    },
    "semanticInventory": {
      "explicitFragments": [
        {
          "inventoryItemId": "item_01",
          "linkedInventoryItemIds": [
            "item_02",
            "item_03"
          ],
          "localRole": "action",
          "modifiers": [],
          "normalizedLabel": "comparer",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "comparer"
        },
        {
          "inventoryItemId": "item_02",
          "linkedInventoryItemIds": [
            "item_01",
            "item_03",
            "item_04"
          ],
          "localRole": "intervention_1",
          "modifiers": [
            "immédiat"
          ],
          "normalizedLabel": "stent immédiat",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "stent immédiat"
        },
        {
          "inventoryItemId": "item_03",
          "linkedInventoryItemIds": [
            "item_01",
            "item_02"
          ],
          "localRole": "intervention_2",
          "modifiers": [
            "différé"
          ],
          "normalizedLabel": "stent différé",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "stent différé"
        },
        {
          "inventoryItemId": "item_04",
          "linkedInventoryItemIds": [
            "item_02"
          ],
          "localRole": "condition",
          "modifiers": [],
          "normalizedLabel": "infarctus",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "infarctus"
        },
        {
          "inventoryItemId": "item_05",
          "linkedInventoryItemIds": [
            "item_06",
            "item_07"
          ],
          "localRole": "intent",
          "modifiers": [],
          "normalizedLabel": "voir",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "voir"
        },
        {
          "inventoryItemId": "item_06",
          "linkedInventoryItemIds": [
            "item_05",
            "item_07"
          ],
          "localRole": "object",
          "modifiers": [],
          "normalizedLabel": "lésions",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "lésions"
        },
        {
          "inventoryItemId": "item_07",
          "linkedInventoryItemIds": [
            "item_05",
            "item_06"
          ],
          "localRole": "modality",
          "modifiers": [],
          "normalizedLabel": "IRM",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "IRM"
        }
      ],
      "explicitRelations": [
        {
          "inventoryRelationId": "rel_01",
          "normalizedRelation": "COMPARES_WITH",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "item_02",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "comparer le stent immédiat au stent différé",
          "targetInventoryItemId": "item_03"
        },
        {
          "inventoryRelationId": "rel_02",
          "normalizedRelation": "APPLIES_TO",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "item_02",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "stent immédiat au stent différé dans l'infarctus",
          "targetInventoryItemId": "item_04"
        },
        {
          "inventoryRelationId": "rel_03",
          "normalizedRelation": "OBSERVED_BY",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "item_06",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "voir les lésions en IRM",
          "targetInventoryItemId": "item_07"
        }
      ]
    },
    "semanticWarnings": [],
    "summaryForUser": "Comparaison entre stent immédiat et stent différé dans l'infarctus, avec observation des lésions en IRM.",
    "unknowns": []
  },
  "model": {
    "acceptanceRecord": null,
    "acceptedAt": null,
    "ambiguities": [],
    "clarificationCandidates": [],
    "contradictions": [],
    "conversationMessageIds": [
      "I01:SEM_FULL:T0"
    ],
    "createdAt": "2026-08-14T09:10:05.852Z",
    "critic": {
      "issues": [],
      "summary": "All checks passed successfully. The semantic model, inventory coverage, relation coverage, taxonomy report, and integrity report are complete and consistent with the source text.",
      "verdict": "ACCEPT"
    },
    "digest": "ke1-7d34ebe79964b003",
    "elements": [
      {
        "canonicalMeaning": "stent immédiat",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_02"
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
          "messageId": "I01:SEM_FULL:T0",
          "providerCallId": "gemini-call:ke1-2e9441b3fd9355c7",
          "rawElementId": "elem_02",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-08906878f99e3444",
          "sem-relation:ke1-1e89963322d86e07"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-09e50c63cd78c30f",
        "sourceSpan": {
          "end": 34,
          "messageId": "I01:SEM_FULL:T0",
          "start": 20,
          "text": "stent immédiat"
        },
        "studyRole": "INTERVENTION_ARM",
        "supersedesElementIds": [],
        "type": "INTERVENTION",
        "version": 2
      },
      {
        "canonicalMeaning": "IRM",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_07"
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
          "messageId": "I01:SEM_FULL:T0",
          "providerCallId": "gemini-call:ke1-2e9441b3fd9355c7",
          "rawElementId": "elem_07",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-b3d8176eace3090a"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-24d50b57e4815413",
        "sourceSpan": {
          "end": 95,
          "messageId": "I01:SEM_FULL:T0",
          "start": 92,
          "text": "IRM"
        },
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "MODALITY",
        "version": 2
      },
      {
        "canonicalMeaning": "voir",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_05"
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
          "messageId": "I01:SEM_FULL:T0",
          "providerCallId": "gemini-call:ke1-2e9441b3fd9355c7",
          "rawElementId": "elem_05",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-25baf65ea11dab12",
        "sourceSpan": {
          "end": 76,
          "messageId": "I01:SEM_FULL:T0",
          "start": 72,
          "text": "voir"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_INTENT",
        "version": 2
      },
      {
        "canonicalMeaning": "infarctus",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_04"
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
          "messageId": "I01:SEM_FULL:T0",
          "providerCallId": "gemini-call:ke1-2e9441b3fd9355c7",
          "rawElementId": "elem_04",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-1e89963322d86e07"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-46b4fd545a390170",
        "sourceSpan": {
          "end": 68,
          "messageId": "I01:SEM_FULL:T0",
          "start": 59,
          "text": "infarctus"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONDITION",
        "version": 2
      },
      {
        "canonicalMeaning": "stent différé",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_03"
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
          "messageId": "I01:SEM_FULL:T0",
          "providerCallId": "gemini-call:ke1-2e9441b3fd9355c7",
          "rawElementId": "elem_03",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-08906878f99e3444"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-48ccb421200ea55d",
        "sourceSpan": {
          "end": 51,
          "messageId": "I01:SEM_FULL:T0",
          "start": 38,
          "text": "stent différé"
        },
        "studyRole": "COMPARATOR_ARM",
        "supersedesElementIds": [],
        "type": "COMPARATOR",
        "version": 2
      },
      {
        "canonicalMeaning": "lésions",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_06"
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
          "messageId": "I01:SEM_FULL:T0",
          "providerCallId": "gemini-call:ke1-2e9441b3fd9355c7",
          "rawElementId": "elem_06",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-b3d8176eace3090a"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-74272f58b2bb1e9c",
        "sourceSpan": {
          "end": 88,
          "messageId": "I01:SEM_FULL:T0",
          "start": 81,
          "text": "lésions"
        },
        "studyRole": "SUBJECT",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_OBJECT",
        "version": 2
      },
      {
        "canonicalMeaning": "Je veux comparer",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_01"
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
          "messageId": "I01:SEM_FULL:T0",
          "providerCallId": "gemini-call:ke1-2e9441b3fd9355c7",
          "rawElementId": "elem_01",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-fe1eb2d591ff2fb9",
        "sourceSpan": {
          "end": 16,
          "messageId": "I01:SEM_FULL:T0",
          "start": 8,
          "text": "comparer"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "OPERATION",
        "version": 2
      }
    ],
    "ellipses": [],
    "executionSnapshot": {
      "criticAttempts": [
        {
          "attempt": 1,
          "category": null,
          "httpStatus": 200,
          "latencyMs": 3041,
          "outcome": "SUCCESS",
          "providerCode": null,
          "providerError": null,
          "providerStatus": null,
          "requestFinished": "2026-08-14T09:16:00.600Z",
          "requestStarted": "2026-08-14T09:15:57.559Z",
          "retryable": false
        }
      ],
      "criticCallId": "gemini-call:ke1-641e0ed12a9be1cd",
      "criticCallIds": [
        "gemini-call:ke1-641e0ed12a9be1cd"
      ],
      "criticPromptVersion": "SEM-001-CRITIC-1.6",
      "executedAt": "2026-08-14T09:16:00.601Z",
      "model": "gemini-3.5-flash-lite",
      "provider": "GOOGLE_GEMINI",
      "rawCritic": {
        "checklist": [
          {
            "check": "EVERY_EXPLICIT_OBJECT_REPRESENTED",
            "evidence": "All explicit fragments including stent immédiat, stent différé, infarctus, lesions, and IRM are successfully represented in the candidate elements.",
            "result": "PASS"
          },
          {
            "check": "EVERY_COMPARATOR_REPRESENTED",
            "evidence": "Stent différé is correctly represented as a COMPARATOR with COMPARATOR_ARM study role.",
            "result": "PASS"
          },
          {
            "check": "EVERY_INTERVENTION_REPRESENTED",
            "evidence": "Stent immédiat is correctly represented as an INTERVENTION with INTERVENTION_ARM study role.",
            "result": "PASS"
          },
          {
            "check": "EVERY_MODALITY_REPRESENTED",
            "evidence": "IRM is correctly represented as a MODALITY.",
            "result": "PASS"
          },
          {
            "check": "EVERY_EXPLICIT_RELATION_REPRESENTED",
            "evidence": "All explicit relations (COMPARES_WITH, APPLIES_TO, OBSERVED_BY) are fully mapped.",
            "result": "PASS"
          },
          {
            "check": "NO_INCOMPATIBLE_OBJECT_TYPE",
            "evidence": "Taxonomy report is complete with zero type mismatches or violations.",
            "result": "PASS"
          },
          {
            "check": "NO_EXPLICIT_RELATION_WEAKENED",
            "evidence": "No explicit relations were weakened or converted into inferences.",
            "result": "PASS"
          },
          {
            "check": "NO_INFERENCE_PROMOTED",
            "evidence": "All elements and relations are strictly grounded on user statements.",
            "result": "PASS"
          },
          {
            "check": "NO_AMBIGUITY_HIDDEN",
            "evidence": "No ambiguities were suppressed.",
            "result": "PASS"
          },
          {
            "check": "NO_NEGATION_REVERSED_OR_IGNORED",
            "evidence": "Polarities are correctly preserved as AFFIRMED.",
            "result": "PASS"
          },
          {
            "check": "NO_TIMING_LOST",
            "evidence": "No temporal expressions were omitted.",
            "result": "PASS"
          },
          {
            "check": "NO_UNSUPPORTED_OUTCOME_ENDPOINT_PROMOTION",
            "evidence": "No outcome has been promoted to endpoint without user specification.",
            "result": "PASS"
          },
          {
            "check": "NO_SPECIFIC_CONCEPT_GENERALIZED",
            "evidence": "Specific technical concepts and terms are preserved without unauthorized generalization.",
            "result": "PASS"
          },
          {
            "check": "NO_IMPORTANT_FRAGMENT_UNREPRESENTED",
            "evidence": "Missing explicit source fragments list is empty.",
            "result": "PASS"
          },
          {
            "check": "ROUTE_MATCHES_COMPLETE_SEMANTIC_MODEL",
            "evidence": "The route DESIGN_STUDY appropriately fits a study setup involving interventions, conditions, and observation modalities.",
            "result": "PASS"
          }
        ],
        "criticId": "critic-ke1-ff1f88475e3908f3",
        "criticSummary": "All checks passed successfully. The semantic model, inventory coverage, relation coverage, taxonomy report, and integrity report are complete and consistent with the source text.",
        "issues": [],
        "missingExplicitSourceFragments": [],
        "proposedRepairs": [],
        "verdict": "ACCEPT"
      },
      "rawCritics": [
        {
          "checklist": [
            {
              "check": "EVERY_EXPLICIT_OBJECT_REPRESENTED",
              "evidence": "All explicit fragments including stent immédiat, stent différé, infarctus, lesions, and IRM are successfully represented in the candidate elements.",
              "result": "PASS"
            },
            {
              "check": "EVERY_COMPARATOR_REPRESENTED",
              "evidence": "Stent différé is correctly represented as a COMPARATOR with COMPARATOR_ARM study role.",
              "result": "PASS"
            },
            {
              "check": "EVERY_INTERVENTION_REPRESENTED",
              "evidence": "Stent immédiat is correctly represented as an INTERVENTION with INTERVENTION_ARM study role.",
              "result": "PASS"
            },
            {
              "check": "EVERY_MODALITY_REPRESENTED",
              "evidence": "IRM is correctly represented as a MODALITY.",
              "result": "PASS"
            },
            {
              "check": "EVERY_EXPLICIT_RELATION_REPRESENTED",
              "evidence": "All explicit relations (COMPARES_WITH, APPLIES_TO, OBSERVED_BY) are fully mapped.",
              "result": "PASS"
            },
            {
              "check": "NO_INCOMPATIBLE_OBJECT_TYPE",
              "evidence": "Taxonomy report is complete with zero type mismatches or violations.",
              "result": "PASS"
            },
            {
              "check": "NO_EXPLICIT_RELATION_WEAKENED",
              "evidence": "No explicit relations were weakened or converted into inferences.",
              "result": "PASS"
            },
            {
              "check": "NO_INFERENCE_PROMOTED",
              "evidence": "All elements and relations are strictly grounded on user statements.",
              "result": "PASS"
            },
            {
              "check": "NO_AMBIGUITY_HIDDEN",
              "evidence": "No ambiguities were suppressed.",
              "result": "PASS"
            },
            {
              "check": "NO_NEGATION_REVERSED_OR_IGNORED",
              "evidence": "Polarities are correctly preserved as AFFIRMED.",
              "result": "PASS"
            },
            {
              "check": "NO_TIMING_LOST",
              "evidence": "No temporal expressions were omitted.",
              "result": "PASS"
            },
            {
              "check": "NO_UNSUPPORTED_OUTCOME_ENDPOINT_PROMOTION",
              "evidence": "No outcome has been promoted to endpoint without user specification.",
              "result": "PASS"
            },
            {
              "check": "NO_SPECIFIC_CONCEPT_GENERALIZED",
              "evidence": "Specific technical concepts and terms are preserved without unauthorized generalization.",
              "result": "PASS"
            },
            {
              "check": "NO_IMPORTANT_FRAGMENT_UNREPRESENTED",
              "evidence": "Missing explicit source fragments list is empty.",
              "result": "PASS"
            },
            {
              "check": "ROUTE_MATCHES_COMPLETE_SEMANTIC_MODEL",
              "evidence": "The route DESIGN_STUDY appropriately fits a study setup involving interventions, conditions, and observation modalities.",
              "result": "PASS"
            }
          ],
          "criticId": "critic-ke1-ff1f88475e3908f3",
          "criticSummary": "All checks passed successfully. The semantic model, inventory coverage, relation coverage, taxonomy report, and integrity report are complete and consistent with the source text.",
          "issues": [],
          "missingExplicitSourceFragments": [],
          "proposedRepairs": [],
          "verdict": "ACCEPT"
        }
      ],
      "rawReconstruction": {
        "ambiguities": [],
        "candidateId": "cand-ke1-ff1f88475e3908f3",
        "clarificationCandidates": [],
        "contradictions": [],
        "elements": [
          {
            "canonicalMeaning": "Je veux comparer",
            "clientElementId": "elem_01",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "item_01"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I01:SEM_FULL:T0",
            "sourceText": "comparer",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "OPERATION"
          },
          {
            "canonicalMeaning": "stent immédiat",
            "clientElementId": "elem_02",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "item_02"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I01:SEM_FULL:T0",
            "sourceText": "stent immédiat",
            "studyRole": "INTERVENTION_ARM",
            "supersedesElementIds": [],
            "type": "INTERVENTION"
          },
          {
            "canonicalMeaning": "stent différé",
            "clientElementId": "elem_03",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "item_03"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I01:SEM_FULL:T0",
            "sourceText": "stent différé",
            "studyRole": "COMPARATOR_ARM",
            "supersedesElementIds": [],
            "type": "COMPARATOR"
          },
          {
            "canonicalMeaning": "infarctus",
            "clientElementId": "elem_04",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "item_04"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I01:SEM_FULL:T0",
            "sourceText": "infarctus",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "CONDITION"
          },
          {
            "canonicalMeaning": "voir",
            "clientElementId": "elem_05",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "item_05"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I01:SEM_FULL:T0",
            "sourceText": "voir",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "SCIENTIFIC_INTENT"
          },
          {
            "canonicalMeaning": "lésions",
            "clientElementId": "elem_06",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "item_06"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I01:SEM_FULL:T0",
            "sourceText": "lésions",
            "studyRole": "SUBJECT",
            "supersedesElementIds": [],
            "type": "SCIENTIFIC_OBJECT"
          },
          {
            "canonicalMeaning": "IRM",
            "clientElementId": "elem_07",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "item_07"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I01:SEM_FULL:T0",
            "sourceText": "IRM",
            "studyRole": "MEASUREMENT",
            "supersedesElementIds": [],
            "type": "MODALITY"
          }
        ],
        "ellipses": [],
        "knowledgeRequests": [],
        "language": "fr",
        "missingConcepts": [],
        "normalizedMeaning": "Comparison between immediate stenting and delayed stenting in myocardial infarction, observing lesions using MRI.",
        "relations": [
          {
            "clientRelationId": "rel_01",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "rel_01"
            ],
            "polarity": "AFFIRMED",
            "relationType": "COMPARES_WITH",
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
              "rel_02"
            ],
            "polarity": "AFFIRMED",
            "relationType": "APPLIES_TO",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem_02",
            "targetClientElementId": "elem_04"
          },
          {
            "clientRelationId": "rel_03",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "rel_03"
            ],
            "polarity": "AFFIRMED",
            "relationType": "OBSERVED_BY",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem_06",
            "targetClientElementId": "elem_07"
          }
        ],
        "routeProposal": {
          "confidence": 0.95,
          "expectedCapabilities": [
            "study design structuring",
            "intervention arm configuration",
            "imaging endpoint specification"
          ],
          "reason": "The user is setting up a comparative study protocol involving interventions, a condition, and a measurement modality.",
          "route": "DESIGN_STUDY"
        },
        "semanticInventory": {
          "explicitFragments": [
            {
              "inventoryItemId": "item_01",
              "linkedInventoryItemIds": [
                "item_02",
                "item_03"
              ],
              "localRole": "action",
              "modifiers": [],
              "normalizedLabel": "comparer",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I01:SEM_FULL:T0",
              "sourceText": "comparer"
            },
            {
              "inventoryItemId": "item_02",
              "linkedInventoryItemIds": [
                "item_01",
                "item_03",
                "item_04"
              ],
              "localRole": "intervention_1",
              "modifiers": [
                "immédiat"
              ],
              "normalizedLabel": "stent immédiat",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I01:SEM_FULL:T0",
              "sourceText": "stent immédiat"
            },
            {
              "inventoryItemId": "item_03",
              "linkedInventoryItemIds": [
                "item_01",
                "item_02"
              ],
              "localRole": "intervention_2",
              "modifiers": [
                "différé"
              ],
              "normalizedLabel": "stent différé",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I01:SEM_FULL:T0",
              "sourceText": "stent différé"
            },
            {
              "inventoryItemId": "item_04",
              "linkedInventoryItemIds": [
                "item_02"
              ],
              "localRole": "condition",
              "modifiers": [],
              "normalizedLabel": "infarctus",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I01:SEM_FULL:T0",
              "sourceText": "infarctus"
            },
            {
              "inventoryItemId": "item_05",
              "linkedInventoryItemIds": [
                "item_06",
                "item_07"
              ],
              "localRole": "intent",
              "modifiers": [],
              "normalizedLabel": "voir",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I01:SEM_FULL:T0",
              "sourceText": "voir"
            },
            {
              "inventoryItemId": "item_06",
              "linkedInventoryItemIds": [
                "item_05",
                "item_07"
              ],
              "localRole": "object",
              "modifiers": [],
              "normalizedLabel": "lésions",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I01:SEM_FULL:T0",
              "sourceText": "lésions"
            },
            {
              "inventoryItemId": "item_07",
              "linkedInventoryItemIds": [
                "item_05",
                "item_06"
              ],
              "localRole": "modality",
              "modifiers": [],
              "normalizedLabel": "IRM",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I01:SEM_FULL:T0",
              "sourceText": "IRM"
            }
          ],
          "explicitRelations": [
            {
              "inventoryRelationId": "rel_01",
              "normalizedRelation": "COMPARES_WITH",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "item_02",
              "sourceMessageId": "I01:SEM_FULL:T0",
              "sourceText": "comparer le stent immédiat au stent différé",
              "targetInventoryItemId": "item_03"
            },
            {
              "inventoryRelationId": "rel_02",
              "normalizedRelation": "APPLIES_TO",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "item_02",
              "sourceMessageId": "I01:SEM_FULL:T0",
              "sourceText": "stent immédiat au stent différé dans l'infarctus",
              "targetInventoryItemId": "item_04"
            },
            {
              "inventoryRelationId": "rel_03",
              "normalizedRelation": "OBSERVED_BY",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "item_06",
              "sourceMessageId": "I01:SEM_FULL:T0",
              "sourceText": "voir les lésions en IRM",
              "targetInventoryItemId": "item_07"
            }
          ]
        },
        "semanticWarnings": [],
        "summaryForUser": "Comparaison entre stent immédiat et stent différé dans l'infarctus, avec observation des lésions en IRM.",
        "unknowns": []
      },
      "reconstructionAttempts": [
        {
          "attempt": 1,
          "category": null,
          "httpStatus": 200,
          "latencyMs": 6869,
          "outcome": "SUCCESS",
          "providerCode": null,
          "providerError": null,
          "providerStatus": null,
          "requestFinished": "2026-08-14T09:15:57.538Z",
          "requestStarted": "2026-08-14T09:15:50.669Z",
          "retryable": false
        }
      ],
      "reconstructionCallId": "gemini-call:ke1-2e9441b3fd9355c7",
      "reconstructionPromptVersion": "SEM-001-RECONSTRUCTION-1.6",
      "schemaVersion": "SEM-001-1.1",
      "temperature": null
    },
    "explicitCoverageReport": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_01",
          "mappedClientElementIds": [
            "elem_01"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "comparer",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "comparer"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_02",
          "mappedClientElementIds": [
            "elem_02"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "stent immédiat",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "stent immédiat"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_03",
          "mappedClientElementIds": [
            "elem_03"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "stent différé",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "stent différé"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_04",
          "mappedClientElementIds": [
            "elem_04"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "infarctus",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "infarctus"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_05",
          "mappedClientElementIds": [
            "elem_05"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "voir",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "voir"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_06",
          "mappedClientElementIds": [
            "elem_06"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "lésions",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "lésions"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_07",
          "mappedClientElementIds": [
            "elem_07"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "IRM",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "IRM"
        }
      ],
      "status": "COMPLETE"
    },
    "history": [
      {
        "changeReason": "Nouvelle contribution utilisateur analysée sans réécriture de l’état antérieur.",
        "changedAt": "2026-08-14T09:10:05.852Z",
        "digest": "ke1-4fa30737ca11d47b",
        "modelId": "semantic-model:ke1-ff1f88475e3908f3",
        "revision": 1,
        "status": "CANDIDATE"
      }
    ],
    "knowledgeRequests": [],
    "knowledgeSnapshot": null,
    "missingConcepts": [],
    "normalizedMeaning": "Comparison between immediate stenting and delayed stenting in myocardial infarction, observing lesions using MRI.",
    "originalRequest": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
    "previousModelId": "semantic-model:ke1-ff1f88475e3908f3",
    "relationCoverageReport": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_01",
          "mappedClientRelationIds": [
            "rel_01"
          ],
          "normalizedRelation": "COMPARES_WITH",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "item_02",
          "targetInventoryItemId": "item_03"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_02",
          "mappedClientRelationIds": [
            "rel_02"
          ],
          "normalizedRelation": "APPLIES_TO",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "item_02",
          "targetInventoryItemId": "item_04"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_03",
          "mappedClientRelationIds": [
            "rel_03"
          ],
          "normalizedRelation": "OBSERVED_BY",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "item_06",
          "targetInventoryItemId": "item_07"
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
          "rel_01"
        ],
        "polarity": "AFFIRMED",
        "relationType": "COMPARES_WITH",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-08906878f99e3444",
        "sourceElementId": "sem-element:ke1-09e50c63cd78c30f",
        "targetElementId": "sem-element:ke1-48ccb421200ea55d",
        "version": 2,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_02"
        ],
        "polarity": "AFFIRMED",
        "relationType": "APPLIES_TO",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-1e89963322d86e07",
        "sourceElementId": "sem-element:ke1-09e50c63cd78c30f",
        "targetElementId": "sem-element:ke1-46b4fd545a390170",
        "version": 2,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_03"
        ],
        "polarity": "AFFIRMED",
        "relationType": "OBSERVED_BY",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-b3d8176eace3090a",
        "sourceElementId": "sem-element:ke1-74272f58b2bb1e9c",
        "targetElementId": "sem-element:ke1-24d50b57e4815413",
        "version": 2,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      }
    ],
    "revision": 2,
    "routeProposal": {
      "confidence": 0.95,
      "expectedCapabilities": [
        "imaging endpoint specification",
        "intervention arm configuration",
        "study design structuring"
      ],
      "reason": "The user is setting up a comparative study protocol involving interventions, a condition, and a measurement modality.",
      "route": "DESIGN_STUDY"
    },
    "semanticModelId": "semantic-model:ke1-b45d9a6214648686",
    "semanticModelVersion": "1.1",
    "status": "CANDIDATE",
    "summaryForUser": "Comparaison entre stent immédiat et stent différé dans l'infarctus, avec observation des lésions en IRM.",
    "unknowns": [],
    "updatedAt": "2026-08-14T09:16:00.601Z"
  },
  "pairedFirstReconstruction": false,
  "postCriticCandidate": {
    "ambiguities": [],
    "candidateId": "cand-ke1-ff1f88475e3908f3",
    "clarificationCandidates": [],
    "contradictions": [],
    "elements": [
      {
        "canonicalMeaning": "Je veux comparer",
        "clientElementId": "elem_01",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_01"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I01:SEM_FULL:T0",
        "sourceText": "comparer",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "OPERATION"
      },
      {
        "canonicalMeaning": "stent immédiat",
        "clientElementId": "elem_02",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_02"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I01:SEM_FULL:T0",
        "sourceText": "stent immédiat",
        "studyRole": "INTERVENTION_ARM",
        "supersedesElementIds": [],
        "type": "INTERVENTION"
      },
      {
        "canonicalMeaning": "stent différé",
        "clientElementId": "elem_03",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_03"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I01:SEM_FULL:T0",
        "sourceText": "stent différé",
        "studyRole": "COMPARATOR_ARM",
        "supersedesElementIds": [],
        "type": "COMPARATOR"
      },
      {
        "canonicalMeaning": "infarctus",
        "clientElementId": "elem_04",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_04"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I01:SEM_FULL:T0",
        "sourceText": "infarctus",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONDITION"
      },
      {
        "canonicalMeaning": "voir",
        "clientElementId": "elem_05",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_05"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I01:SEM_FULL:T0",
        "sourceText": "voir",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_INTENT"
      },
      {
        "canonicalMeaning": "lésions",
        "clientElementId": "elem_06",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_06"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I01:SEM_FULL:T0",
        "sourceText": "lésions",
        "studyRole": "SUBJECT",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_OBJECT"
      },
      {
        "canonicalMeaning": "IRM",
        "clientElementId": "elem_07",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_07"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I01:SEM_FULL:T0",
        "sourceText": "IRM",
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "MODALITY"
      }
    ],
    "ellipses": [],
    "knowledgeRequests": [],
    "language": "fr",
    "missingConcepts": [],
    "normalizedMeaning": "Comparison between immediate stenting and delayed stenting in myocardial infarction, observing lesions using MRI.",
    "relations": [
      {
        "clientRelationId": "rel_01",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_01"
        ],
        "polarity": "AFFIRMED",
        "relationType": "COMPARES_WITH",
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
          "rel_02"
        ],
        "polarity": "AFFIRMED",
        "relationType": "APPLIES_TO",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_02",
        "targetClientElementId": "elem_04"
      },
      {
        "clientRelationId": "rel_03",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_03"
        ],
        "polarity": "AFFIRMED",
        "relationType": "OBSERVED_BY",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_06",
        "targetClientElementId": "elem_07"
      }
    ],
    "routeProposal": {
      "confidence": 0.95,
      "expectedCapabilities": [
        "study design structuring",
        "intervention arm configuration",
        "imaging endpoint specification"
      ],
      "reason": "The user is setting up a comparative study protocol involving interventions, a condition, and a measurement modality.",
      "route": "DESIGN_STUDY"
    },
    "semanticInventory": {
      "explicitFragments": [
        {
          "inventoryItemId": "item_01",
          "linkedInventoryItemIds": [
            "item_02",
            "item_03"
          ],
          "localRole": "action",
          "modifiers": [],
          "normalizedLabel": "comparer",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "comparer"
        },
        {
          "inventoryItemId": "item_02",
          "linkedInventoryItemIds": [
            "item_01",
            "item_03",
            "item_04"
          ],
          "localRole": "intervention_1",
          "modifiers": [
            "immédiat"
          ],
          "normalizedLabel": "stent immédiat",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "stent immédiat"
        },
        {
          "inventoryItemId": "item_03",
          "linkedInventoryItemIds": [
            "item_01",
            "item_02"
          ],
          "localRole": "intervention_2",
          "modifiers": [
            "différé"
          ],
          "normalizedLabel": "stent différé",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "stent différé"
        },
        {
          "inventoryItemId": "item_04",
          "linkedInventoryItemIds": [
            "item_02"
          ],
          "localRole": "condition",
          "modifiers": [],
          "normalizedLabel": "infarctus",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "infarctus"
        },
        {
          "inventoryItemId": "item_05",
          "linkedInventoryItemIds": [
            "item_06",
            "item_07"
          ],
          "localRole": "intent",
          "modifiers": [],
          "normalizedLabel": "voir",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "voir"
        },
        {
          "inventoryItemId": "item_06",
          "linkedInventoryItemIds": [
            "item_05",
            "item_07"
          ],
          "localRole": "object",
          "modifiers": [],
          "normalizedLabel": "lésions",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "lésions"
        },
        {
          "inventoryItemId": "item_07",
          "linkedInventoryItemIds": [
            "item_05",
            "item_06"
          ],
          "localRole": "modality",
          "modifiers": [],
          "normalizedLabel": "IRM",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "IRM"
        }
      ],
      "explicitRelations": [
        {
          "inventoryRelationId": "rel_01",
          "normalizedRelation": "COMPARES_WITH",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "item_02",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "comparer le stent immédiat au stent différé",
          "targetInventoryItemId": "item_03"
        },
        {
          "inventoryRelationId": "rel_02",
          "normalizedRelation": "APPLIES_TO",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "item_02",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "stent immédiat au stent différé dans l'infarctus",
          "targetInventoryItemId": "item_04"
        },
        {
          "inventoryRelationId": "rel_03",
          "normalizedRelation": "OBSERVED_BY",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "item_06",
          "sourceMessageId": "I01:SEM_FULL:T0",
          "sourceText": "voir les lésions en IRM",
          "targetInventoryItemId": "item_07"
        }
      ]
    },
    "semanticWarnings": [],
    "summaryForUser": "Comparaison entre stent immédiat et stent différé dans l'infarctus, avec observation des lésions en IRM.",
    "unknowns": []
  },
  "semanticCriticExecuted": true,
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

Comparison between immediate stenting and delayed stenting in myocardial infarction, observing lesions using MRI.

Objectif scientifique produit :

voir

### EXPLICITEMENT DIT PAR LE CHERCHEUR

- content=stent immédiat | scientificRole=INTERVENTION:INTERVENTION_ARM | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=stent immédiat | provenanceTurnIds=["I01:SEM_FULL:T0"]
- content=IRM | scientificRole=MODALITY:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=IRM | provenanceTurnIds=["I01:SEM_FULL:T0"]
- content=voir | scientificRole=SCIENTIFIC_INTENT:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=voir | provenanceTurnIds=["I01:SEM_FULL:T0"]
- content=infarctus | scientificRole=CONDITION:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=infarctus | provenanceTurnIds=["I01:SEM_FULL:T0"]
- content=stent différé | scientificRole=COMPARATOR:COMPARATOR_ARM | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=stent différé | provenanceTurnIds=["I01:SEM_FULL:T0"]
- content=lésions | scientificRole=SCIENTIFIC_OBJECT:SUBJECT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=lésions | provenanceTurnIds=["I01:SEM_FULL:T0"]
- content=Je veux comparer | scientificRole=OPERATION:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=comparer | provenanceTurnIds=["I01:SEM_FULL:T0"]

### RELATIONS COMPRISES

- subject=stent immédiat | predicate=COMPARES_WITH | object=stent différé | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=stent immédiat | predicate=APPLIES_TO | object=infarctus | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=lésions | predicate=OBSERVED_BY | object=IRM | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER

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

- content=stent immédiat | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I01:SEM_FULL:T0"]
- content=IRM | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I01:SEM_FULL:T0"]
- content=voir | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I01:SEM_FULL:T0"]
- content=infarctus | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I01:SEM_FULL:T0"]
- content=stent différé | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I01:SEM_FULL:T0"]
- content=lésions | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I01:SEM_FULL:T0"]
- content=Je veux comparer | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I01:SEM_FULL:T0"]

### QUESTIONS DE CLARIFICATION CANDIDATES

- Aucun élément produit.

## MISSING STRUCTURAL GUARANTEES

- EXACT_PROVIDER_RAW_TEXT_NOT_PERSISTED; STRUCTURED_NATIVE_ARTIFACT_AVAILABLE

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
