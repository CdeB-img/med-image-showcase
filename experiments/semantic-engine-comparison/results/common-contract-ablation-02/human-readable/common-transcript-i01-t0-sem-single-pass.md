# I01 — SEM_SINGLE_PASS — COMMON_TRANSCRIPT T0

## INPUT

Message utilisateur courant VERBATIM :

> Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.

Conversation précédente VERBATIM :

> —

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/common-transcript-i01-t0-sem-single-pass.json`

```json
{
  "deterministicCoverage": {
    "explicit": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-01",
          "mappedClientElementIds": [
            "elem-01"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Je veux",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I01:T0",
          "sourceText": "Je veux"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-02",
          "mappedClientElementIds": [],
          "mappedClientRelationIds": [
            "rel-01"
          ],
          "normalizedMeaning": "comparer",
          "reason": "The explicit functional fragment is represented by its source-grounded direct Semantic Relation rather than by a false object node.",
          "sourceMessageId": "I01:T0",
          "sourceText": "comparer"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-03",
          "mappedClientElementIds": [
            "elem-02"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "stent immédiat",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I01:T0",
          "sourceText": "le stent immédiat"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-04",
          "mappedClientElementIds": [
            "elem-03"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "stent différé",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I01:T0",
          "sourceText": "stent différé"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-05",
          "mappedClientElementIds": [
            "elem-04"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "infarctus",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I01:T0",
          "sourceText": "l'infarctus"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-06",
          "mappedClientElementIds": [],
          "mappedClientRelationIds": [
            "rel-02"
          ],
          "normalizedMeaning": "voir",
          "reason": "The explicit functional fragment is represented by its source-grounded direct Semantic Relation rather than by a false object node.",
          "sourceMessageId": "I01:T0",
          "sourceText": "voir"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-07",
          "mappedClientElementIds": [
            "elem-05"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "lésions",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I01:T0",
          "sourceText": "les lésions"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-08",
          "mappedClientElementIds": [
            "elem-06"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "IRM",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I01:T0",
          "sourceText": "IRM"
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
          "inventoryRelationId": "rel-inv-01",
          "mappedClientRelationIds": [
            "rel-01"
          ],
          "normalizedRelation": "COMPARES_WITH",
          "reason": "The functional relation hub is preserved by a direct explicit Semantic Relation between its linked scientific endpoints; a relation-as-object node is not required.",
          "sourceInventoryItemId": "inv-02",
          "targetInventoryItemId": "inv-03"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel-inv-02",
          "mappedClientRelationIds": [
            "rel-01"
          ],
          "normalizedRelation": "COMPARES_WITH",
          "reason": "The functional relation hub is preserved by a direct explicit Semantic Relation between its linked scientific endpoints; a relation-as-object node is not required.",
          "sourceInventoryItemId": "inv-02",
          "targetInventoryItemId": "inv-04"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel-inv-03",
          "mappedClientRelationIds": [
            "rel-02"
          ],
          "normalizedRelation": "OBSERVES",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv-08",
          "targetInventoryItemId": "inv-07"
        }
      ],
      "status": "COMPLETE"
    },
    "taxonomy": {
      "findings": [
        {
          "clientElementId": "elem-06",
          "code": "IMAGING_FAMILY_TYPED_AS_METHOD",
          "currentType": "METHOD",
          "expectedStudyRole": "MEASUREMENT",
          "expectedType": "MODALITY",
          "reason": "The exact source names a broad imaging family without a sequence, acquisition or processing qualifier; the operational taxonomy requires MODALITY."
        }
      ],
      "status": "INCOMPLETE"
    }
  },
  "initialReconstruction": {
    "ambiguities": [],
    "candidateId": "cand-001",
    "clarificationCandidates": [],
    "contradictions": [],
    "elements": [
      {
        "canonicalMeaning": "User intent to compare interventions and observe lesions",
        "clientElementId": "elem-01",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-01"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I01:T0",
        "sourceText": "Je veux",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_INTENT"
      },
      {
        "canonicalMeaning": "Immediate stenting",
        "clientElementId": "elem-02",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-03"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I01:T0",
        "sourceText": "le stent immédiat",
        "studyRole": "INTERVENTION_ARM",
        "supersedesElementIds": [],
        "type": "INTERVENTION"
      },
      {
        "canonicalMeaning": "Delayed stenting",
        "clientElementId": "elem-03",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-04"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I01:T0",
        "sourceText": "stent différé",
        "studyRole": "COMPARATOR_ARM",
        "supersedesElementIds": [],
        "type": "INTERVENTION"
      },
      {
        "canonicalMeaning": "Myocardial infarction",
        "clientElementId": "elem-04",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-05"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I01:T0",
        "sourceText": "l'infarctus",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONDITION"
      },
      {
        "canonicalMeaning": "Lesions",
        "clientElementId": "elem-05",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-07"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I01:T0",
        "sourceText": "les lésions",
        "studyRole": "SUBJECT",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_OBJECT"
      },
      {
        "canonicalMeaning": "Magnetic resonance imaging",
        "clientElementId": "elem-06",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-08"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I01:T0",
        "sourceText": "IRM",
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "METHOD"
      }
    ],
    "ellipses": [],
    "knowledgeRequests": [],
    "language": "fr",
    "missingConcepts": [],
    "normalizedMeaning": "Comparison of immediate stenting versus delayed stenting in myocardial infarction, observing lesions using MRI.",
    "relations": [
      {
        "clientRelationId": "rel-01",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel-inv-01",
          "rel-inv-02"
        ],
        "polarity": "AFFIRMED",
        "relationType": "COMPARES_WITH",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem-02",
        "targetClientElementId": "elem-03"
      },
      {
        "clientRelationId": "rel-02",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel-inv-03"
        ],
        "polarity": "AFFIRMED",
        "relationType": "OBSERVES",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem-06",
        "targetClientElementId": "elem-05"
      }
    ],
    "routeProposal": {
      "confidence": 0.95,
      "expectedCapabilities": [
        "Define study population",
        "Specify primary endpoints",
        "Establish timing and follow-up"
      ],
      "reason": "The user is setting up a comparison between two interventional arms in a specific clinical condition with an observation method.",
      "route": "DESIGN_STUDY"
    },
    "semanticInventory": {
      "explicitFragments": [
        {
          "inventoryItemId": "inv-01",
          "linkedInventoryItemIds": [
            "inv-02",
            "inv-03",
            "inv-04",
            "inv-05",
            "inv-06"
          ],
          "localRole": "intent",
          "modifiers": [],
          "normalizedLabel": "Je veux",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:T0",
          "sourceText": "Je veux"
        },
        {
          "inventoryItemId": "inv-02",
          "linkedInventoryItemIds": [
            "inv-03",
            "inv-04"
          ],
          "localRole": "action",
          "modifiers": [],
          "normalizedLabel": "comparer",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:T0",
          "sourceText": "comparer"
        },
        {
          "inventoryItemId": "inv-03",
          "linkedInventoryItemIds": [],
          "localRole": "intervention",
          "modifiers": [
            "immédiat"
          ],
          "normalizedLabel": "stent immédiat",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:T0",
          "sourceText": "le stent immédiat"
        },
        {
          "inventoryItemId": "inv-04",
          "linkedInventoryItemIds": [],
          "localRole": "intervention",
          "modifiers": [
            "différé"
          ],
          "normalizedLabel": "stent différé",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:T0",
          "sourceText": "stent différé"
        },
        {
          "inventoryItemId": "inv-05",
          "linkedInventoryItemIds": [],
          "localRole": "condition",
          "modifiers": [],
          "normalizedLabel": "infarctus",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:T0",
          "sourceText": "l'infarctus"
        },
        {
          "inventoryItemId": "inv-06",
          "linkedInventoryItemIds": [
            "inv-07",
            "inv-08"
          ],
          "localRole": "action",
          "modifiers": [],
          "normalizedLabel": "voir",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:T0",
          "sourceText": "voir"
        },
        {
          "inventoryItemId": "inv-07",
          "linkedInventoryItemIds": [],
          "localRole": "object",
          "modifiers": [],
          "normalizedLabel": "lésions",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:T0",
          "sourceText": "les lésions"
        },
        {
          "inventoryItemId": "inv-08",
          "linkedInventoryItemIds": [],
          "localRole": "method",
          "modifiers": [],
          "normalizedLabel": "IRM",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I01:T0",
          "sourceText": "IRM"
        }
      ],
      "explicitRelations": [
        {
          "inventoryRelationId": "rel-inv-01",
          "normalizedRelation": "COMPARES_WITH",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "inv-02",
          "sourceMessageId": "I01:T0",
          "sourceText": "comparer le stent immédiat au stent différé",
          "targetInventoryItemId": "inv-03"
        },
        {
          "inventoryRelationId": "rel-inv-02",
          "normalizedRelation": "COMPARES_WITH",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "inv-02",
          "sourceMessageId": "I01:T0",
          "sourceText": "comparer le stent immédiat au stent différé",
          "targetInventoryItemId": "inv-04"
        },
        {
          "inventoryRelationId": "rel-inv-03",
          "normalizedRelation": "OBSERVES",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "inv-08",
          "sourceMessageId": "I01:T0",
          "sourceText": "voir les lésions en IRM",
          "targetInventoryItemId": "inv-07"
        }
      ]
    },
    "semanticWarnings": [],
    "summaryForUser": "Comparaison entre stent immédiat et stent différé dans l'infarctus, avec observation des lésions par IRM.",
    "unknowns": []
  },
  "model": {
    "acceptanceRecord": null,
    "acceptedAt": null,
    "ambiguities": [],
    "clarificationCandidates": [],
    "contradictions": [],
    "conversationMessageIds": [
      "I01:T0"
    ],
    "createdAt": "2026-08-14T08:45:17.646Z",
    "critic": {
      "issues": [],
      "summary": "Single-pass deterministic reports incomplete; no semantic critic or repair was executed.",
      "verdict": "CLARIFICATION_REQUIRED"
    },
    "digest": "ke1-5f86e3b84abb679c",
    "elements": [
      {
        "canonicalMeaning": "Immediate stenting",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-03"
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
          "messageId": "I01:T0",
          "providerCallId": "gemini-call:ke1-1b173d5c115212c8",
          "rawElementId": "elem-02",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-b625b8d792d82ab3"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-4d26d13a6c9989f6",
        "sourceSpan": {
          "end": 34,
          "messageId": "I01:T0",
          "start": 17,
          "text": "le stent immédiat"
        },
        "studyRole": "INTERVENTION_ARM",
        "supersedesElementIds": [],
        "type": "INTERVENTION",
        "version": 1
      },
      {
        "canonicalMeaning": "Lesions",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-07"
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
          "messageId": "I01:T0",
          "providerCallId": "gemini-call:ke1-1b173d5c115212c8",
          "rawElementId": "elem-05",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-c97266d820ebe2f4"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-7377740c719bb0c8",
        "sourceSpan": {
          "end": 88,
          "messageId": "I01:T0",
          "start": 77,
          "text": "les lésions"
        },
        "studyRole": "SUBJECT",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_OBJECT",
        "version": 1
      },
      {
        "canonicalMeaning": "Magnetic resonance imaging",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-08"
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
          "messageId": "I01:T0",
          "providerCallId": "gemini-call:ke1-1b173d5c115212c8",
          "rawElementId": "elem-06",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-c97266d820ebe2f4"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-8d483ef98330dc35",
        "sourceSpan": {
          "end": 95,
          "messageId": "I01:T0",
          "start": 92,
          "text": "IRM"
        },
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "METHOD",
        "version": 1
      },
      {
        "canonicalMeaning": "User intent to compare interventions and observe lesions",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-01"
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
          "messageId": "I01:T0",
          "providerCallId": "gemini-call:ke1-1b173d5c115212c8",
          "rawElementId": "elem-01",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-91cf5aa379f8eaef",
        "sourceSpan": {
          "end": 7,
          "messageId": "I01:T0",
          "start": 0,
          "text": "Je veux"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_INTENT",
        "version": 1
      },
      {
        "canonicalMeaning": "Myocardial infarction",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-05"
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
          "messageId": "I01:T0",
          "providerCallId": "gemini-call:ke1-1b173d5c115212c8",
          "rawElementId": "elem-04",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-b6c20eed741fa9d1",
        "sourceSpan": {
          "end": 68,
          "messageId": "I01:T0",
          "start": 57,
          "text": "l'infarctus"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONDITION",
        "version": 1
      },
      {
        "canonicalMeaning": "Delayed stenting",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-04"
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
          "messageId": "I01:T0",
          "providerCallId": "gemini-call:ke1-1b173d5c115212c8",
          "rawElementId": "elem-03",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-b625b8d792d82ab3"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-d5f711cbc470528f",
        "sourceSpan": {
          "end": 51,
          "messageId": "I01:T0",
          "start": 38,
          "text": "stent différé"
        },
        "studyRole": "COMPARATOR_ARM",
        "supersedesElementIds": [],
        "type": "INTERVENTION",
        "version": 1
      }
    ],
    "ellipses": [],
    "executionSnapshot": {
      "criticAttempts": [],
      "criticCallId": "deterministic-no-critic",
      "criticCallIds": [],
      "criticPromptVersion": "SEM-001-CRITIC-1.6",
      "executedAt": "2026-08-14T08:45:17.646Z",
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
        "ambiguities": [],
        "candidateId": "cand-001",
        "clarificationCandidates": [],
        "contradictions": [],
        "elements": [
          {
            "canonicalMeaning": "User intent to compare interventions and observe lesions",
            "clientElementId": "elem-01",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv-01"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I01:T0",
            "sourceText": "Je veux",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "SCIENTIFIC_INTENT"
          },
          {
            "canonicalMeaning": "Immediate stenting",
            "clientElementId": "elem-02",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv-03"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I01:T0",
            "sourceText": "le stent immédiat",
            "studyRole": "INTERVENTION_ARM",
            "supersedesElementIds": [],
            "type": "INTERVENTION"
          },
          {
            "canonicalMeaning": "Delayed stenting",
            "clientElementId": "elem-03",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv-04"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I01:T0",
            "sourceText": "stent différé",
            "studyRole": "COMPARATOR_ARM",
            "supersedesElementIds": [],
            "type": "INTERVENTION"
          },
          {
            "canonicalMeaning": "Myocardial infarction",
            "clientElementId": "elem-04",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv-05"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I01:T0",
            "sourceText": "l'infarctus",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "CONDITION"
          },
          {
            "canonicalMeaning": "Lesions",
            "clientElementId": "elem-05",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv-07"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I01:T0",
            "sourceText": "les lésions",
            "studyRole": "SUBJECT",
            "supersedesElementIds": [],
            "type": "SCIENTIFIC_OBJECT"
          },
          {
            "canonicalMeaning": "Magnetic resonance imaging",
            "clientElementId": "elem-06",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv-08"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I01:T0",
            "sourceText": "IRM",
            "studyRole": "MEASUREMENT",
            "supersedesElementIds": [],
            "type": "METHOD"
          }
        ],
        "ellipses": [],
        "knowledgeRequests": [],
        "language": "fr",
        "missingConcepts": [],
        "normalizedMeaning": "Comparison of immediate stenting versus delayed stenting in myocardial infarction, observing lesions using MRI.",
        "relations": [
          {
            "clientRelationId": "rel-01",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "rel-inv-01",
              "rel-inv-02"
            ],
            "polarity": "AFFIRMED",
            "relationType": "COMPARES_WITH",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem-02",
            "targetClientElementId": "elem-03"
          },
          {
            "clientRelationId": "rel-02",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "rel-inv-03"
            ],
            "polarity": "AFFIRMED",
            "relationType": "OBSERVES",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem-06",
            "targetClientElementId": "elem-05"
          }
        ],
        "routeProposal": {
          "confidence": 0.95,
          "expectedCapabilities": [
            "Define study population",
            "Specify primary endpoints",
            "Establish timing and follow-up"
          ],
          "reason": "The user is setting up a comparison between two interventional arms in a specific clinical condition with an observation method.",
          "route": "DESIGN_STUDY"
        },
        "semanticInventory": {
          "explicitFragments": [
            {
              "inventoryItemId": "inv-01",
              "linkedInventoryItemIds": [
                "inv-02",
                "inv-03",
                "inv-04",
                "inv-05",
                "inv-06"
              ],
              "localRole": "intent",
              "modifiers": [],
              "normalizedLabel": "Je veux",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I01:T0",
              "sourceText": "Je veux"
            },
            {
              "inventoryItemId": "inv-02",
              "linkedInventoryItemIds": [
                "inv-03",
                "inv-04"
              ],
              "localRole": "action",
              "modifiers": [],
              "normalizedLabel": "comparer",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I01:T0",
              "sourceText": "comparer"
            },
            {
              "inventoryItemId": "inv-03",
              "linkedInventoryItemIds": [],
              "localRole": "intervention",
              "modifiers": [
                "immédiat"
              ],
              "normalizedLabel": "stent immédiat",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I01:T0",
              "sourceText": "le stent immédiat"
            },
            {
              "inventoryItemId": "inv-04",
              "linkedInventoryItemIds": [],
              "localRole": "intervention",
              "modifiers": [
                "différé"
              ],
              "normalizedLabel": "stent différé",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I01:T0",
              "sourceText": "stent différé"
            },
            {
              "inventoryItemId": "inv-05",
              "linkedInventoryItemIds": [],
              "localRole": "condition",
              "modifiers": [],
              "normalizedLabel": "infarctus",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I01:T0",
              "sourceText": "l'infarctus"
            },
            {
              "inventoryItemId": "inv-06",
              "linkedInventoryItemIds": [
                "inv-07",
                "inv-08"
              ],
              "localRole": "action",
              "modifiers": [],
              "normalizedLabel": "voir",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I01:T0",
              "sourceText": "voir"
            },
            {
              "inventoryItemId": "inv-07",
              "linkedInventoryItemIds": [],
              "localRole": "object",
              "modifiers": [],
              "normalizedLabel": "lésions",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I01:T0",
              "sourceText": "les lésions"
            },
            {
              "inventoryItemId": "inv-08",
              "linkedInventoryItemIds": [],
              "localRole": "method",
              "modifiers": [],
              "normalizedLabel": "IRM",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I01:T0",
              "sourceText": "IRM"
            }
          ],
          "explicitRelations": [
            {
              "inventoryRelationId": "rel-inv-01",
              "normalizedRelation": "COMPARES_WITH",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "inv-02",
              "sourceMessageId": "I01:T0",
              "sourceText": "comparer le stent immédiat au stent différé",
              "targetInventoryItemId": "inv-03"
            },
            {
              "inventoryRelationId": "rel-inv-02",
              "normalizedRelation": "COMPARES_WITH",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "inv-02",
              "sourceMessageId": "I01:T0",
              "sourceText": "comparer le stent immédiat au stent différé",
              "targetInventoryItemId": "inv-04"
            },
            {
              "inventoryRelationId": "rel-inv-03",
              "normalizedRelation": "OBSERVES",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "inv-08",
              "sourceMessageId": "I01:T0",
              "sourceText": "voir les lésions en IRM",
              "targetInventoryItemId": "inv-07"
            }
          ]
        },
        "semanticWarnings": [],
        "summaryForUser": "Comparaison entre stent immédiat et stent différé dans l'infarctus, avec observation des lésions par IRM.",
        "unknowns": []
      },
      "reconstructionAttempts": [
        {
          "attempt": 1,
          "category": null,
          "httpStatus": 200,
          "latencyMs": 6873,
          "outcome": "SUCCESS",
          "providerCode": null,
          "providerError": null,
          "providerStatus": null,
          "requestFinished": "2026-08-14T08:45:17.626Z",
          "requestStarted": "2026-08-14T08:45:10.753Z",
          "retryable": false
        }
      ],
      "reconstructionCallId": "gemini-call:ke1-1b173d5c115212c8",
      "reconstructionPromptVersion": "SEM-001-RECONSTRUCTION-1.6",
      "schemaVersion": "SEM-001-1.1",
      "temperature": null
    },
    "explicitCoverageReport": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-01",
          "mappedClientElementIds": [
            "elem-01"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Je veux",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I01:T0",
          "sourceText": "Je veux"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-02",
          "mappedClientElementIds": [],
          "mappedClientRelationIds": [
            "rel-01"
          ],
          "normalizedMeaning": "comparer",
          "reason": "The explicit functional fragment is represented by its source-grounded direct Semantic Relation rather than by a false object node.",
          "sourceMessageId": "I01:T0",
          "sourceText": "comparer"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-03",
          "mappedClientElementIds": [
            "elem-02"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "stent immédiat",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I01:T0",
          "sourceText": "le stent immédiat"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-04",
          "mappedClientElementIds": [
            "elem-03"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "stent différé",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I01:T0",
          "sourceText": "stent différé"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-05",
          "mappedClientElementIds": [
            "elem-04"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "infarctus",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I01:T0",
          "sourceText": "l'infarctus"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-06",
          "mappedClientElementIds": [],
          "mappedClientRelationIds": [
            "rel-02"
          ],
          "normalizedMeaning": "voir",
          "reason": "The explicit functional fragment is represented by its source-grounded direct Semantic Relation rather than by a false object node.",
          "sourceMessageId": "I01:T0",
          "sourceText": "voir"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-07",
          "mappedClientElementIds": [
            "elem-05"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "lésions",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I01:T0",
          "sourceText": "les lésions"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-08",
          "mappedClientElementIds": [
            "elem-06"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "IRM",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I01:T0",
          "sourceText": "IRM"
        }
      ],
      "status": "COMPLETE"
    },
    "history": [],
    "knowledgeRequests": [],
    "knowledgeSnapshot": null,
    "missingConcepts": [],
    "normalizedMeaning": "Comparison of immediate stenting versus delayed stenting in myocardial infarction, observing lesions using MRI.",
    "originalRequest": "Je veux comparer le stent immédiat au stent différé dans l'infarctus et voir les lésions en IRM.",
    "previousModelId": null,
    "relationCoverageReport": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel-inv-01",
          "mappedClientRelationIds": [
            "rel-01"
          ],
          "normalizedRelation": "COMPARES_WITH",
          "reason": "The functional relation hub is preserved by a direct explicit Semantic Relation between its linked scientific endpoints; a relation-as-object node is not required.",
          "sourceInventoryItemId": "inv-02",
          "targetInventoryItemId": "inv-03"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel-inv-02",
          "mappedClientRelationIds": [
            "rel-01"
          ],
          "normalizedRelation": "COMPARES_WITH",
          "reason": "The functional relation hub is preserved by a direct explicit Semantic Relation between its linked scientific endpoints; a relation-as-object node is not required.",
          "sourceInventoryItemId": "inv-02",
          "targetInventoryItemId": "inv-04"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel-inv-03",
          "mappedClientRelationIds": [
            "rel-02"
          ],
          "normalizedRelation": "OBSERVES",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv-08",
          "targetInventoryItemId": "inv-07"
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
          "rel-inv-01",
          "rel-inv-02"
        ],
        "polarity": "AFFIRMED",
        "relationType": "COMPARES_WITH",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-b625b8d792d82ab3",
        "sourceElementId": "sem-element:ke1-4d26d13a6c9989f6",
        "targetElementId": "sem-element:ke1-d5f711cbc470528f",
        "version": 1,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel-inv-03"
        ],
        "polarity": "AFFIRMED",
        "relationType": "OBSERVES",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-c97266d820ebe2f4",
        "sourceElementId": "sem-element:ke1-8d483ef98330dc35",
        "targetElementId": "sem-element:ke1-7377740c719bb0c8",
        "version": 1,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      }
    ],
    "revision": 1,
    "routeProposal": {
      "confidence": 0.95,
      "expectedCapabilities": [
        "Define study population",
        "Establish timing and follow-up",
        "Specify primary endpoints"
      ],
      "reason": "The user is setting up a comparison between two interventional arms in a specific clinical condition with an observation method.",
      "route": "DESIGN_STUDY"
    },
    "semanticModelId": "semantic-model:ke1-475f31be478cae72",
    "semanticModelVersion": "1.1",
    "status": "CLARIFICATION_REQUIRED",
    "summaryForUser": "Comparaison entre stent immédiat et stent différé dans l'infarctus, avec observation des lésions par IRM.",
    "unknowns": [],
    "updatedAt": "2026-08-14T08:45:17.646Z"
  },
  "pairedFirstReconstruction": true,
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

Comparison of immediate stenting versus delayed stenting in myocardial infarction, observing lesions using MRI.

Objectif scientifique produit :

User intent to compare interventions and observe lesions

### EXPLICITEMENT DIT PAR LE CHERCHEUR

- content=Immediate stenting | scientificRole=INTERVENTION:INTERVENTION_ARM | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=le stent immédiat | provenanceTurnIds=["I01:T0"]
- content=Lesions | scientificRole=SCIENTIFIC_OBJECT:SUBJECT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=les lésions | provenanceTurnIds=["I01:T0"]
- content=Magnetic resonance imaging | scientificRole=METHOD:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=IRM | provenanceTurnIds=["I01:T0"]
- content=User intent to compare interventions and observe lesions | scientificRole=SCIENTIFIC_INTENT:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Je veux | provenanceTurnIds=["I01:T0"]
- content=Myocardial infarction | scientificRole=CONDITION:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=l'infarctus | provenanceTurnIds=["I01:T0"]
- content=Delayed stenting | scientificRole=INTERVENTION:COMPARATOR_ARM | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=stent différé | provenanceTurnIds=["I01:T0"]

### RELATIONS COMPRISES

- subject=Immediate stenting | predicate=COMPARES_WITH | object=Delayed stenting | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Magnetic resonance imaging | predicate=OBSERVES | object=Lesions | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER

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

- content=Immediate stenting | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I01:T0"]
- content=Lesions | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I01:T0"]
- content=Magnetic resonance imaging | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I01:T0"]
- content=User intent to compare interventions and observe lesions | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I01:T0"]
- content=Myocardial infarction | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I01:T0"]
- content=Delayed stenting | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I01:T0"]

### QUESTIONS DE CLARIFICATION CANDIDATES

- Aucun élément produit.

## MISSING STRUCTURAL GUARANTEES

- EXACT_PROVIDER_RAW_TEXT_NOT_PERSISTED; STRUCTURED_NATIVE_ARTIFACT_AVAILABLE

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
