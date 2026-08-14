# I04 — SEM_FULL — INTERACTIVE T1

## INPUT

Message utilisateur courant VERBATIM :

> Je ne sais pas.

Conversation précédente VERBATIM :

> I04:SEM_FULL:T0 | USER : Je veux détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible. On a plusieurs centres et tout le monde n'a pas les mêmes séquences.
> I04:SEM_FULL:Q1 | ASSISTANT : Quelles modalités ou séquences d'imagerie spécifiques souhaitez-vous harmoniser ou utiliser pour détecter cette atteinte cardiaque précoce ?

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/interactive-i04-t1-sem-full.json`

```json
{
  "criticCycles": {
    "accepted": true,
    "attempts": [
      {
        "attempt": 1,
        "category": null,
        "httpStatus": 200,
        "latencyMs": 5234,
        "outcome": "SUCCESS",
        "providerCode": null,
        "providerError": null,
        "providerStatus": null,
        "requestFinished": "2026-08-14T09:17:41.166Z",
        "requestStarted": "2026-08-14T09:17:35.932Z",
        "retryable": false
      }
    ],
    "callIds": [
      "gemini-call:ke1-9fe286a59a197401"
    ],
    "candidate": {
      "ambiguities": [
        "Hétérogénéité des séquences entre les centres non normalisée"
      ],
      "candidateId": "semantic-candidate:ke1-e41a5db9fc48193d",
      "clarificationCandidates": [
        {
          "question": "Souhaitez-vous définir ou sélectionner une modalité ou une séquence spécifique pour harmoniser l'étude entre les centres ?",
          "reason": "L'utilisateur a indiqué ne pas savoir quelles séquences utiliser.",
          "resolvesClientElementIds": [
            "elem_09",
            "elem_08"
          ]
        }
      ],
      "contradictions": [],
      "elements": [
        {
          "canonicalMeaning": "Intention de l'utilisateur de concevoir ou réaliser une détection",
          "clientElementId": "elem_01",
          "confidence": 1,
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "inferenceReason": null,
          "inventoryItemIds": [
            "inv_02"
          ],
          "polarity": "AFFIRMED",
          "requiresConfirmation": false,
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "Je veux",
          "studyRole": "NONE",
          "supersedesElementIds": [],
          "type": "SCIENTIFIC_INTENT"
        },
        {
          "canonicalMeaning": "Action de détecter",
          "clientElementId": "elem_02",
          "confidence": 1,
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "inferenceReason": null,
          "inventoryItemIds": [
            "inv_03"
          ],
          "polarity": "AFFIRMED",
          "requiresConfirmation": false,
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "détecter",
          "studyRole": "NONE",
          "supersedesElementIds": [],
          "type": "OPERATION"
        },
        {
          "canonicalMeaning": "Atteinte cardiaque",
          "clientElementId": "elem_03",
          "confidence": 1,
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "inferenceReason": null,
          "inventoryItemIds": [
            "inv_04"
          ],
          "polarity": "AFFIRMED",
          "requiresConfirmation": false,
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "l'atteinte cardiaque",
          "studyRole": "SUBJECT",
          "supersedesElementIds": [],
          "type": "SCIENTIFIC_OBJECT"
        },
        {
          "canonicalMeaning": "Phase précoce",
          "clientElementId": "elem_04",
          "confidence": 1,
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "inferenceReason": null,
          "inventoryItemIds": [
            "inv_05"
          ],
          "polarity": "AFFIRMED",
          "requiresConfirmation": false,
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "précoce",
          "studyRole": "NONE",
          "supersedesElementIds": [],
          "type": "TIMING"
        },
        {
          "canonicalMeaning": "Maladie de Fabry",
          "clientElementId": "elem_05",
          "confidence": 1,
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "inferenceReason": null,
          "inventoryItemIds": [
            "inv_06"
          ],
          "polarity": "AFFIRMED",
          "requiresConfirmation": false,
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "Fabry",
          "studyRole": "NONE",
          "supersedesElementIds": [],
          "type": "CONDITION"
        },
        {
          "canonicalMeaning": "Avant la fibrose visible",
          "clientElementId": "elem_06",
          "confidence": 1,
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "inferenceReason": null,
          "inventoryItemIds": [
            "inv_07"
          ],
          "polarity": "AFFIRMED",
          "requiresConfirmation": false,
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "avant la fibrose visible",
          "studyRole": "NONE",
          "supersedesElementIds": [],
          "type": "CONSTRAINT"
        },
        {
          "canonicalMeaning": "Étude multicentrique impliquant plusieurs centres",
          "clientElementId": "elem_07",
          "confidence": 1,
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "inferenceReason": null,
          "inventoryItemIds": [
            "inv_08"
          ],
          "polarity": "AFFIRMED",
          "requiresConfirmation": false,
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "plusieurs centres",
          "studyRole": "NONE",
          "supersedesElementIds": [],
          "type": "STUDY_DESIGN"
        },
        {
          "canonicalMeaning": "Séquences d'acquisition variables selon les centres",
          "clientElementId": "elem_08",
          "confidence": 1,
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "inferenceReason": null,
          "inventoryItemIds": [
            "inv_09"
          ],
          "polarity": "AFFIRMED",
          "requiresConfirmation": false,
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "séquences",
          "studyRole": "NONE",
          "supersedesElementIds": [],
          "type": "METHOD"
        },
        {
          "canonicalMeaning": "Incertitude sur les modalités ou séquences spécifiques",
          "clientElementId": "elem_09",
          "confidence": 1,
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "inferenceReason": null,
          "inventoryItemIds": [
            "inv_01"
          ],
          "polarity": "UNCERTAIN",
          "requiresConfirmation": true,
          "sourceMessageId": "I04:SEM_FULL:R1",
          "sourceText": "Je ne sais pas.",
          "studyRole": "NONE",
          "supersedesElementIds": [],
          "type": "UNKNOWN"
        }
      ],
      "ellipses": [],
      "knowledgeRequests": [],
      "language": "fr",
      "missingConcepts": [
        "Modalité d'imagerie spécifique"
      ],
      "normalizedMeaning": "L'utilisateur indique qu'il ne sait pas quelles modalités ou séquences d'imagerie utiliser dans le cadre multicentrique pour la maladie de Fabry.",
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
          "relationType": "AIMS_TO",
          "requiresConfirmation": false,
          "sourceClientElementId": "elem_01",
          "targetClientElementId": "elem_02"
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
          "relationType": "OBSERVES",
          "requiresConfirmation": false,
          "sourceClientElementId": "elem_02",
          "targetClientElementId": "elem_03"
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
          "relationType": "RELATED_TO_CANDIDATE",
          "requiresConfirmation": false,
          "sourceClientElementId": "elem_03",
          "targetClientElementId": "elem_05"
        },
        {
          "clientRelationId": "rel_04",
          "confidence": 1,
          "epistemicStatus": "EXPLICIT_USER_STATED",
          "inferenceReason": null,
          "inventoryRelationIds": [
            "rel_04"
          ],
          "polarity": "AFFIRMED",
          "relationType": "BOUNDED_BY",
          "requiresConfirmation": false,
          "sourceClientElementId": "elem_02",
          "targetClientElementId": "elem_06"
        }
      ],
      "routeProposal": {
        "confidence": 0.9,
        "expectedCapabilities": [
          "Harmonisation de protocoles",
          "Définition des critères d'évaluation"
        ],
        "reason": "L'utilisateur élabore une étude multicentrique mais doit encore préciser ou harmoniser les méthodes et séquences d'imagerie.",
        "route": "DESIGN_STUDY"
      },
      "semanticInventory": {
        "explicitFragments": [
          {
            "inventoryItemId": "inv_01",
            "linkedInventoryItemIds": [],
            "localRole": "response",
            "modifiers": [],
            "normalizedLabel": "Ne sait pas",
            "polarity": "UNCERTAIN",
            "sourceMessageId": "I04:SEM_FULL:R1",
            "sourceText": "Je ne sais pas."
          },
          {
            "inventoryItemId": "inv_02",
            "linkedInventoryItemIds": [],
            "localRole": "subject",
            "modifiers": [],
            "normalizedLabel": "Intention de l'utilisateur",
            "polarity": "AFFIRMED",
            "sourceMessageId": "I04:SEM_FULL:T0",
            "sourceText": "Je veux"
          },
          {
            "inventoryItemId": "inv_03",
            "linkedInventoryItemIds": [
              "inv_02",
              "inv_04"
            ],
            "localRole": "verb",
            "modifiers": [],
            "normalizedLabel": "Action de détecter",
            "polarity": "AFFIRMED",
            "sourceMessageId": "I04:SEM_FULL:T0",
            "sourceText": "détecter"
          },
          {
            "inventoryItemId": "inv_04",
            "linkedInventoryItemIds": [
              "inv_03"
            ],
            "localRole": "object",
            "modifiers": [],
            "normalizedLabel": "Atteinte cardiaque",
            "polarity": "AFFIRMED",
            "sourceMessageId": "I04:SEM_FULL:T0",
            "sourceText": "l'atteinte cardiaque"
          },
          {
            "inventoryItemId": "inv_05",
            "linkedInventoryItemIds": [
              "inv_04"
            ],
            "localRole": "modifier",
            "modifiers": [],
            "normalizedLabel": "Phase précoce",
            "polarity": "AFFIRMED",
            "sourceMessageId": "I04:SEM_FULL:T0",
            "sourceText": "précoce"
          },
          {
            "inventoryItemId": "inv_06",
            "linkedInventoryItemIds": [
              "inv_04"
            ],
            "localRole": "condition",
            "modifiers": [],
            "normalizedLabel": "Maladie de Fabry",
            "polarity": "AFFIRMED",
            "sourceMessageId": "I04:SEM_FULL:T0",
            "sourceText": "Fabry"
          },
          {
            "inventoryItemId": "inv_07",
            "linkedInventoryItemIds": [
              "inv_03"
            ],
            "localRole": "constraint",
            "modifiers": [],
            "normalizedLabel": "Avant la fibrose visible",
            "polarity": "AFFIRMED",
            "sourceMessageId": "I04:SEM_FULL:T0",
            "sourceText": "avant la fibrose visible"
          },
          {
            "inventoryItemId": "inv_08",
            "linkedInventoryItemIds": [],
            "localRole": "design",
            "modifiers": [],
            "normalizedLabel": "Plusieurs centres",
            "polarity": "AFFIRMED",
            "sourceMessageId": "I04:SEM_FULL:T0",
            "sourceText": "plusieurs centres"
          },
          {
            "inventoryItemId": "inv_09",
            "linkedInventoryItemIds": [],
            "localRole": "method",
            "modifiers": [],
            "normalizedLabel": "Séquences d'acquisition",
            "polarity": "AFFIRMED",
            "sourceMessageId": "I04:SEM_FULL:T0",
            "sourceText": "séquences"
          }
        ],
        "explicitRelations": [
          {
            "inventoryRelationId": "rel_01",
            "normalizedRelation": "AIMS_TO",
            "polarity": "AFFIRMED",
            "sourceInventoryItemId": "inv_02",
            "sourceMessageId": "I04:SEM_FULL:T0",
            "sourceText": "Je veux détecter",
            "targetInventoryItemId": "inv_03"
          },
          {
            "inventoryRelationId": "rel_02",
            "normalizedRelation": "OBSERVES",
            "polarity": "AFFIRMED",
            "sourceInventoryItemId": "inv_03",
            "sourceMessageId": "I04:SEM_FULL:T0",
            "sourceText": "détecter l'atteinte cardiaque",
            "targetInventoryItemId": "inv_04"
          },
          {
            "inventoryRelationId": "rel_03",
            "normalizedRelation": "RELATED_TO_CANDIDATE",
            "polarity": "AFFIRMED",
            "sourceInventoryItemId": "inv_04",
            "sourceMessageId": "I04:SEM_FULL:T0",
            "sourceText": "l'atteinte cardiaque précoce dans Fabry",
            "targetInventoryItemId": "inv_06"
          },
          {
            "inventoryRelationId": "rel_04",
            "normalizedRelation": "BOUNDED_BY",
            "polarity": "AFFIRMED",
            "sourceInventoryItemId": "inv_03",
            "sourceMessageId": "I04:SEM_FULL:T0",
            "sourceText": "Je veux détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible.",
            "targetInventoryItemId": "inv_07"
          }
        ]
      },
      "semanticWarnings": [
        "DETERMINISTIC_INVENTORY_RELATION_SOURCE_SPAN_DERIVED:1"
      ],
      "summaryForUser": "Vous avez indiqué ne pas savoir quelles séquences utiliser.",
      "unknowns": [
        "Choix des séquences d'imagerie"
      ]
    },
    "critics": [
      {
        "checklist": [
          {
            "check": "EVERY_EXPLICIT_OBJECT_REPRESENTED",
            "evidence": "All explicit inventory objects ('atteinte cardiaque', 'Maladie de Fabry', 'séquences') are fully represented as elements.",
            "result": "PASS"
          },
          {
            "check": "EVERY_COMPARATOR_REPRESENTED",
            "evidence": "No explicit comparator is stated in the user messages.",
            "result": "NOT_APPLICABLE"
          },
          {
            "check": "EVERY_INTERVENTION_REPRESENTED",
            "evidence": "No active study intervention or treatment is requested in the user messages.",
            "result": "NOT_APPLICABLE"
          },
          {
            "check": "EVERY_MODALITY_REPRESENTED",
            "evidence": "No specific imaging modality family is affirmed by the user; uncertainty is explicitly captured.",
            "result": "NOT_APPLICABLE"
          },
          {
            "check": "EVERY_EXPLICIT_RELATION_REPRESENTED",
            "evidence": "All explicit relations from the inventory are mapped to client relations.",
            "result": "PASS"
          },
          {
            "check": "NO_INCOMPATIBLE_OBJECT_TYPE",
            "evidence": "Taxonomy report is complete with zero findings; all types match the operational rules.",
            "result": "PASS"
          },
          {
            "check": "NO_EXPLICIT_RELATION_WEAKENED",
            "evidence": "Relations retain their explicit direction and semantics.",
            "result": "PASS"
          },
          {
            "check": "NO_INFERENCE_PROMOTED",
            "evidence": "No inferences are promoted to explicit user statements inappropriately.",
            "result": "PASS"
          },
          {
            "check": "NO_AMBIGUITY_HIDDEN",
            "evidence": "Ambiguities regarding center heterogeneity and unknown sequences are properly exposed.",
            "result": "PASS"
          },
          {
            "check": "NO_NEGATION_REVERSED_OR_IGNORED",
            "evidence": "No negated fragments are reversed or ignored.",
            "result": "PASS"
          },
          {
            "check": "NO_TIMING_LOST",
            "evidence": "Timing elements such as 'précoce' and constraints like 'avant la fibrose visible' are correctly represented.",
            "result": "PASS"
          },
          {
            "check": "NO_UNSUPPORTED_OUTCOME_ENDPOINT_PROMOTION",
            "evidence": "No outcomes or objects are inappropriately promoted to endpoints.",
            "result": "PASS"
          },
          {
            "check": "NO_SPECIFIC_CONCEPT_GENERALIZED",
            "evidence": "Specific concepts like Fabry disease and specific source spans are preserved without undue generalization.",
            "result": "PASS"
          },
          {
            "check": "NO_IMPORTANT_FRAGMENT_UNREPRESENTED",
            "evidence": "Explicit coverage report is complete and all fragments are mapped.",
            "result": "PASS"
          },
          {
            "check": "ROUTE_MATCHES_COMPLETE_SEMANTIC_MODEL",
            "evidence": "Route DESIGN_STUDY is completely justified by the study design, conditions, intent, and centers context.",
            "result": "PASS"
          }
        ],
        "criticId": "critic:ke1-e41a5db9fc48193d-audit",
        "criticSummary": "The semantic model accurately reflects the user messages, including the design of a multicentritic Fabry study, early cardiac involvement detection, sequence heterogeneity, and the explicit response of uncertainty. All checklist items pass.",
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
          "latencyMs": 5234,
          "outcome": "SUCCESS",
          "providerCode": null,
          "providerError": null,
          "providerStatus": null,
          "requestFinished": "2026-08-14T09:17:41.166Z",
          "requestStarted": "2026-08-14T09:17:35.932Z",
          "retryable": false
        }
      ]
    ],
    "repairDiagnostics": [],
    "terminalReason": "CRITIC_ACCEPTED_AFTER_COMPLETE_AUDIT"
  },
  "initialReconstruction": {
    "ambiguities": [
      "Hétérogénéité des séquences entre les centres non normalisée"
    ],
    "candidateId": "semantic-candidate:ke1-e41a5db9fc48193d",
    "clarificationCandidates": [
      {
        "question": "Souhaitez-vous définir ou sélectionner une modalité ou une séquence spécifique pour harmoniser l'étude entre les centres ?",
        "reason": "L'utilisateur a indiqué ne pas savoir quelles séquences utiliser.",
        "resolvesClientElementIds": [
          "elem_09",
          "elem_08"
        ]
      }
    ],
    "contradictions": [],
    "elements": [
      {
        "canonicalMeaning": "Intention de l'utilisateur de concevoir ou réaliser une détection",
        "clientElementId": "elem_01",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_02"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_FULL:T0",
        "sourceText": "Je veux",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_INTENT"
      },
      {
        "canonicalMeaning": "Action de détecter",
        "clientElementId": "elem_02",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_03"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_FULL:T0",
        "sourceText": "détecter",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "OPERATION"
      },
      {
        "canonicalMeaning": "Atteinte cardiaque",
        "clientElementId": "elem_03",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_04"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_FULL:T0",
        "sourceText": "l'atteinte cardiaque",
        "studyRole": "SUBJECT",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_OBJECT"
      },
      {
        "canonicalMeaning": "Phase précoce",
        "clientElementId": "elem_04",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_05"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_FULL:T0",
        "sourceText": "précoce",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "TIMING"
      },
      {
        "canonicalMeaning": "Maladie de Fabry",
        "clientElementId": "elem_05",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_06"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_FULL:T0",
        "sourceText": "Fabry",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONDITION"
      },
      {
        "canonicalMeaning": "Avant la fibrose visible",
        "clientElementId": "elem_06",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_07"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_FULL:T0",
        "sourceText": "avant la fibrose visible",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONSTRAINT"
      },
      {
        "canonicalMeaning": "Étude multicentrique impliquant plusieurs centres",
        "clientElementId": "elem_07",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_08"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_FULL:T0",
        "sourceText": "plusieurs centres",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "STUDY_DESIGN"
      },
      {
        "canonicalMeaning": "Séquences d'acquisition variables selon les centres",
        "clientElementId": "elem_08",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_09"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_FULL:T0",
        "sourceText": "séquences",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "METHOD"
      },
      {
        "canonicalMeaning": "Incertitude sur les modalités ou séquences spécifiques",
        "clientElementId": "elem_09",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_01"
        ],
        "polarity": "UNCERTAIN",
        "requiresConfirmation": true,
        "sourceMessageId": "I04:SEM_FULL:R1",
        "sourceText": "Je ne sais pas.",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "UNKNOWN"
      }
    ],
    "ellipses": [],
    "knowledgeRequests": [],
    "language": "fr",
    "missingConcepts": [
      "Modalité d'imagerie spécifique"
    ],
    "normalizedMeaning": "L'utilisateur indique qu'il ne sait pas quelles modalités ou séquences d'imagerie utiliser dans le cadre multicentrique pour la maladie de Fabry.",
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
        "relationType": "AIMS_TO",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_01",
        "targetClientElementId": "elem_02"
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
        "relationType": "OBSERVES",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_02",
        "targetClientElementId": "elem_03"
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
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_03",
        "targetClientElementId": "elem_05"
      },
      {
        "clientRelationId": "rel_04",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_04"
        ],
        "polarity": "AFFIRMED",
        "relationType": "BOUNDED_BY",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_02",
        "targetClientElementId": "elem_06"
      }
    ],
    "routeProposal": {
      "confidence": 0.9,
      "expectedCapabilities": [
        "Harmonisation de protocoles",
        "Définition des critères d'évaluation"
      ],
      "reason": "L'utilisateur élabore une étude multicentrique mais doit encore préciser ou harmoniser les méthodes et séquences d'imagerie.",
      "route": "DESIGN_STUDY"
    },
    "semanticInventory": {
      "explicitFragments": [
        {
          "inventoryItemId": "inv_01",
          "linkedInventoryItemIds": [],
          "localRole": "response",
          "modifiers": [],
          "normalizedLabel": "Ne sait pas",
          "polarity": "UNCERTAIN",
          "sourceMessageId": "I04:SEM_FULL:R1",
          "sourceText": "Je ne sais pas."
        },
        {
          "inventoryItemId": "inv_02",
          "linkedInventoryItemIds": [],
          "localRole": "subject",
          "modifiers": [],
          "normalizedLabel": "Intention de l'utilisateur",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "Je veux"
        },
        {
          "inventoryItemId": "inv_03",
          "linkedInventoryItemIds": [
            "inv_02",
            "inv_04"
          ],
          "localRole": "verb",
          "modifiers": [],
          "normalizedLabel": "Action de détecter",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "détecter"
        },
        {
          "inventoryItemId": "inv_04",
          "linkedInventoryItemIds": [
            "inv_03"
          ],
          "localRole": "object",
          "modifiers": [],
          "normalizedLabel": "Atteinte cardiaque",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "l'atteinte cardiaque"
        },
        {
          "inventoryItemId": "inv_05",
          "linkedInventoryItemIds": [
            "inv_04"
          ],
          "localRole": "modifier",
          "modifiers": [],
          "normalizedLabel": "Phase précoce",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "précoce"
        },
        {
          "inventoryItemId": "inv_06",
          "linkedInventoryItemIds": [
            "inv_04"
          ],
          "localRole": "condition",
          "modifiers": [],
          "normalizedLabel": "Maladie de Fabry",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "Fabry"
        },
        {
          "inventoryItemId": "inv_07",
          "linkedInventoryItemIds": [
            "inv_03"
          ],
          "localRole": "constraint",
          "modifiers": [],
          "normalizedLabel": "Avant la fibrose visible",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "avant la fibrose visible"
        },
        {
          "inventoryItemId": "inv_08",
          "linkedInventoryItemIds": [],
          "localRole": "design",
          "modifiers": [],
          "normalizedLabel": "Plusieurs centres",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "plusieurs centres"
        },
        {
          "inventoryItemId": "inv_09",
          "linkedInventoryItemIds": [],
          "localRole": "method",
          "modifiers": [],
          "normalizedLabel": "Séquences d'acquisition",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "séquences"
        }
      ],
      "explicitRelations": [
        {
          "inventoryRelationId": "rel_01",
          "normalizedRelation": "AIMS_TO",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "inv_02",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "Je veux détecter",
          "targetInventoryItemId": "inv_03"
        },
        {
          "inventoryRelationId": "rel_02",
          "normalizedRelation": "OBSERVES",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "inv_03",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "détecter l'atteinte cardiaque",
          "targetInventoryItemId": "inv_04"
        },
        {
          "inventoryRelationId": "rel_03",
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "inv_04",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "l'atteinte cardiaque précoce dans Fabry",
          "targetInventoryItemId": "inv_06"
        },
        {
          "inventoryRelationId": "rel_04",
          "normalizedRelation": "BOUNDED_BY",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "inv_03",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "Je veux détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible.",
          "targetInventoryItemId": "inv_07"
        }
      ]
    },
    "semanticWarnings": [
      "DETERMINISTIC_INVENTORY_RELATION_SOURCE_SPAN_DERIVED:1"
    ],
    "summaryForUser": "Vous avez indiqué ne pas savoir quelles séquences utiliser.",
    "unknowns": [
      "Choix des séquences d'imagerie"
    ]
  },
  "model": {
    "acceptanceRecord": null,
    "acceptedAt": null,
    "ambiguities": [
      "Hétérogénéité des séquences entre les centres non normalisée"
    ],
    "clarificationCandidates": [
      {
        "question": "Souhaitez-vous définir ou sélectionner une modalité ou une séquence spécifique pour harmoniser l'étude entre les centres ?",
        "reason": "L'utilisateur a indiqué ne pas savoir quelles séquences utiliser.",
        "resolvesElementIds": [
          "sem-element:ke1-0e185927f0c5601b",
          "sem-element:ke1-4d147db90486b8cd"
        ]
      }
    ],
    "contradictions": [],
    "conversationMessageIds": [
      "I04:SEM_FULL:T0",
      "I04:SEM_FULL:Q1",
      "I04:SEM_FULL:R1"
    ],
    "createdAt": "2026-08-14T09:16:48.323Z",
    "critic": {
      "issues": [],
      "summary": "The semantic model accurately reflects the user messages, including the design of a multicentritic Fabry study, early cardiac involvement detection, sequence heterogeneity, and the explicit response of uncertainty. All checklist items pass.",
      "verdict": "ACCEPT"
    },
    "digest": "ke1-8facb988b51f836c",
    "elements": [
      {
        "canonicalMeaning": "Phase précoce",
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
          "messageId": "I04:SEM_FULL:T0",
          "providerCallId": "gemini-call:ke1-000a1620f9fc4fc4",
          "rawElementId": "elem_04",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-0125ad182f4bd87c",
        "sourceSpan": {
          "end": 45,
          "messageId": "I04:SEM_FULL:T0",
          "start": 38,
          "text": "précoce"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "TIMING",
        "version": 2
      },
      {
        "canonicalMeaning": "Incertitude sur les modalités ou séquences spécifiques",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_01"
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
          "messageId": "I04:SEM_FULL:R1",
          "providerCallId": "gemini-call:ke1-000a1620f9fc4fc4",
          "rawElementId": "elem_09",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-0e185927f0c5601b",
        "sourceSpan": {
          "end": 15,
          "messageId": "I04:SEM_FULL:R1",
          "start": 0,
          "text": "Je ne sais pas."
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "UNKNOWN",
        "version": 1
      },
      {
        "canonicalMeaning": "Séquences d'acquisition variables selon les centres",
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
          "messageId": "I04:SEM_FULL:T0",
          "providerCallId": "gemini-call:ke1-000a1620f9fc4fc4",
          "rawElementId": "elem_08",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-4d147db90486b8cd",
        "sourceSpan": {
          "end": 150,
          "messageId": "I04:SEM_FULL:T0",
          "start": 141,
          "text": "séquences"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "METHOD",
        "version": 2
      },
      {
        "canonicalMeaning": "Action de détecter",
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
          "messageId": "I04:SEM_FULL:T0",
          "providerCallId": "gemini-call:ke1-000a1620f9fc4fc4",
          "rawElementId": "elem_02",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-50f06222f315a8be",
          "sem-relation:ke1-97a997c5c4faadf9",
          "sem-relation:ke1-d67dd3456b5900c9"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-8ee975cee73682ca",
        "sourceSpan": {
          "end": 16,
          "messageId": "I04:SEM_FULL:T0",
          "start": 8,
          "text": "détecter"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "OPERATION",
        "version": 2
      },
      {
        "canonicalMeaning": "Avant la fibrose visible",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_07"
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
          "messageId": "I04:SEM_FULL:T0",
          "providerCallId": "gemini-call:ke1-000a1620f9fc4fc4",
          "rawElementId": "elem_06",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-97a997c5c4faadf9"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-abb32fe017decea4",
        "sourceSpan": {
          "end": 81,
          "messageId": "I04:SEM_FULL:T0",
          "start": 57,
          "text": "avant la fibrose visible"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONSTRAINT",
        "version": 2
      },
      {
        "canonicalMeaning": "Maladie de Fabry",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_06"
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
          "messageId": "I04:SEM_FULL:T0",
          "providerCallId": "gemini-call:ke1-000a1620f9fc4fc4",
          "rawElementId": "elem_05",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-84e65779a297aa65"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-b4c3c91b3ce8d0af",
        "sourceSpan": {
          "end": 56,
          "messageId": "I04:SEM_FULL:T0",
          "start": 51,
          "text": "Fabry"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONDITION",
        "version": 2
      },
      {
        "canonicalMeaning": "Étude multicentrique impliquant plusieurs centres",
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
          "messageId": "I04:SEM_FULL:T0",
          "providerCallId": "gemini-call:ke1-000a1620f9fc4fc4",
          "rawElementId": "elem_07",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-d94779c2cad27a1e",
        "sourceSpan": {
          "end": 105,
          "messageId": "I04:SEM_FULL:T0",
          "start": 88,
          "text": "plusieurs centres"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "STUDY_DESIGN",
        "version": 2
      },
      {
        "canonicalMeaning": "Intention de l'utilisateur de concevoir ou réaliser une détection",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_02"
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
          "messageId": "I04:SEM_FULL:T0",
          "providerCallId": "gemini-call:ke1-000a1620f9fc4fc4",
          "rawElementId": "elem_01",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-d67dd3456b5900c9"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-f7c5754809b8449c",
        "sourceSpan": {
          "end": 7,
          "messageId": "I04:SEM_FULL:T0",
          "start": 0,
          "text": "Je veux"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_INTENT",
        "version": 2
      },
      {
        "canonicalMeaning": "Atteinte cardiaque",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_04"
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
          "messageId": "I04:SEM_FULL:T0",
          "providerCallId": "gemini-call:ke1-000a1620f9fc4fc4",
          "rawElementId": "elem_03",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-50f06222f315a8be",
          "sem-relation:ke1-84e65779a297aa65"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-f9a45bd622f74a92",
        "sourceSpan": {
          "end": 37,
          "messageId": "I04:SEM_FULL:T0",
          "start": 17,
          "text": "l'atteinte cardiaque"
        },
        "studyRole": "SUBJECT",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_OBJECT",
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
          "latencyMs": 5234,
          "outcome": "SUCCESS",
          "providerCode": null,
          "providerError": null,
          "providerStatus": null,
          "requestFinished": "2026-08-14T09:17:41.166Z",
          "requestStarted": "2026-08-14T09:17:35.932Z",
          "retryable": false
        }
      ],
      "criticCallId": "gemini-call:ke1-9fe286a59a197401",
      "criticCallIds": [
        "gemini-call:ke1-9fe286a59a197401"
      ],
      "criticPromptVersion": "SEM-001-CRITIC-1.6",
      "executedAt": "2026-08-14T09:17:41.167Z",
      "model": "gemini-3.5-flash-lite",
      "provider": "GOOGLE_GEMINI",
      "rawCritic": {
        "checklist": [
          {
            "check": "EVERY_EXPLICIT_OBJECT_REPRESENTED",
            "evidence": "All explicit inventory objects ('atteinte cardiaque', 'Maladie de Fabry', 'séquences') are fully represented as elements.",
            "result": "PASS"
          },
          {
            "check": "EVERY_COMPARATOR_REPRESENTED",
            "evidence": "No explicit comparator is stated in the user messages.",
            "result": "NOT_APPLICABLE"
          },
          {
            "check": "EVERY_INTERVENTION_REPRESENTED",
            "evidence": "No active study intervention or treatment is requested in the user messages.",
            "result": "NOT_APPLICABLE"
          },
          {
            "check": "EVERY_MODALITY_REPRESENTED",
            "evidence": "No specific imaging modality family is affirmed by the user; uncertainty is explicitly captured.",
            "result": "NOT_APPLICABLE"
          },
          {
            "check": "EVERY_EXPLICIT_RELATION_REPRESENTED",
            "evidence": "All explicit relations from the inventory are mapped to client relations.",
            "result": "PASS"
          },
          {
            "check": "NO_INCOMPATIBLE_OBJECT_TYPE",
            "evidence": "Taxonomy report is complete with zero findings; all types match the operational rules.",
            "result": "PASS"
          },
          {
            "check": "NO_EXPLICIT_RELATION_WEAKENED",
            "evidence": "Relations retain their explicit direction and semantics.",
            "result": "PASS"
          },
          {
            "check": "NO_INFERENCE_PROMOTED",
            "evidence": "No inferences are promoted to explicit user statements inappropriately.",
            "result": "PASS"
          },
          {
            "check": "NO_AMBIGUITY_HIDDEN",
            "evidence": "Ambiguities regarding center heterogeneity and unknown sequences are properly exposed.",
            "result": "PASS"
          },
          {
            "check": "NO_NEGATION_REVERSED_OR_IGNORED",
            "evidence": "No negated fragments are reversed or ignored.",
            "result": "PASS"
          },
          {
            "check": "NO_TIMING_LOST",
            "evidence": "Timing elements such as 'précoce' and constraints like 'avant la fibrose visible' are correctly represented.",
            "result": "PASS"
          },
          {
            "check": "NO_UNSUPPORTED_OUTCOME_ENDPOINT_PROMOTION",
            "evidence": "No outcomes or objects are inappropriately promoted to endpoints.",
            "result": "PASS"
          },
          {
            "check": "NO_SPECIFIC_CONCEPT_GENERALIZED",
            "evidence": "Specific concepts like Fabry disease and specific source spans are preserved without undue generalization.",
            "result": "PASS"
          },
          {
            "check": "NO_IMPORTANT_FRAGMENT_UNREPRESENTED",
            "evidence": "Explicit coverage report is complete and all fragments are mapped.",
            "result": "PASS"
          },
          {
            "check": "ROUTE_MATCHES_COMPLETE_SEMANTIC_MODEL",
            "evidence": "Route DESIGN_STUDY is completely justified by the study design, conditions, intent, and centers context.",
            "result": "PASS"
          }
        ],
        "criticId": "critic:ke1-e41a5db9fc48193d-audit",
        "criticSummary": "The semantic model accurately reflects the user messages, including the design of a multicentritic Fabry study, early cardiac involvement detection, sequence heterogeneity, and the explicit response of uncertainty. All checklist items pass.",
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
              "evidence": "All explicit inventory objects ('atteinte cardiaque', 'Maladie de Fabry', 'séquences') are fully represented as elements.",
              "result": "PASS"
            },
            {
              "check": "EVERY_COMPARATOR_REPRESENTED",
              "evidence": "No explicit comparator is stated in the user messages.",
              "result": "NOT_APPLICABLE"
            },
            {
              "check": "EVERY_INTERVENTION_REPRESENTED",
              "evidence": "No active study intervention or treatment is requested in the user messages.",
              "result": "NOT_APPLICABLE"
            },
            {
              "check": "EVERY_MODALITY_REPRESENTED",
              "evidence": "No specific imaging modality family is affirmed by the user; uncertainty is explicitly captured.",
              "result": "NOT_APPLICABLE"
            },
            {
              "check": "EVERY_EXPLICIT_RELATION_REPRESENTED",
              "evidence": "All explicit relations from the inventory are mapped to client relations.",
              "result": "PASS"
            },
            {
              "check": "NO_INCOMPATIBLE_OBJECT_TYPE",
              "evidence": "Taxonomy report is complete with zero findings; all types match the operational rules.",
              "result": "PASS"
            },
            {
              "check": "NO_EXPLICIT_RELATION_WEAKENED",
              "evidence": "Relations retain their explicit direction and semantics.",
              "result": "PASS"
            },
            {
              "check": "NO_INFERENCE_PROMOTED",
              "evidence": "No inferences are promoted to explicit user statements inappropriately.",
              "result": "PASS"
            },
            {
              "check": "NO_AMBIGUITY_HIDDEN",
              "evidence": "Ambiguities regarding center heterogeneity and unknown sequences are properly exposed.",
              "result": "PASS"
            },
            {
              "check": "NO_NEGATION_REVERSED_OR_IGNORED",
              "evidence": "No negated fragments are reversed or ignored.",
              "result": "PASS"
            },
            {
              "check": "NO_TIMING_LOST",
              "evidence": "Timing elements such as 'précoce' and constraints like 'avant la fibrose visible' are correctly represented.",
              "result": "PASS"
            },
            {
              "check": "NO_UNSUPPORTED_OUTCOME_ENDPOINT_PROMOTION",
              "evidence": "No outcomes or objects are inappropriately promoted to endpoints.",
              "result": "PASS"
            },
            {
              "check": "NO_SPECIFIC_CONCEPT_GENERALIZED",
              "evidence": "Specific concepts like Fabry disease and specific source spans are preserved without undue generalization.",
              "result": "PASS"
            },
            {
              "check": "NO_IMPORTANT_FRAGMENT_UNREPRESENTED",
              "evidence": "Explicit coverage report is complete and all fragments are mapped.",
              "result": "PASS"
            },
            {
              "check": "ROUTE_MATCHES_COMPLETE_SEMANTIC_MODEL",
              "evidence": "Route DESIGN_STUDY is completely justified by the study design, conditions, intent, and centers context.",
              "result": "PASS"
            }
          ],
          "criticId": "critic:ke1-e41a5db9fc48193d-audit",
          "criticSummary": "The semantic model accurately reflects the user messages, including the design of a multicentritic Fabry study, early cardiac involvement detection, sequence heterogeneity, and the explicit response of uncertainty. All checklist items pass.",
          "issues": [],
          "missingExplicitSourceFragments": [],
          "proposedRepairs": [],
          "verdict": "ACCEPT"
        }
      ],
      "rawReconstruction": {
        "ambiguities": [
          "Hétérogénéité des séquences entre les centres non normalisée"
        ],
        "candidateId": "semantic-candidate:ke1-e41a5db9fc48193d",
        "clarificationCandidates": [
          {
            "question": "Souhaitez-vous définir ou sélectionner une modalité ou une séquence spécifique pour harmoniser l'étude entre les centres ?",
            "reason": "L'utilisateur a indiqué ne pas savoir quelles séquences utiliser.",
            "resolvesClientElementIds": [
              "elem_09",
              "elem_08"
            ]
          }
        ],
        "contradictions": [],
        "elements": [
          {
            "canonicalMeaning": "Intention de l'utilisateur de concevoir ou réaliser une détection",
            "clientElementId": "elem_01",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_02"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:SEM_FULL:T0",
            "sourceText": "Je veux",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "SCIENTIFIC_INTENT"
          },
          {
            "canonicalMeaning": "Action de détecter",
            "clientElementId": "elem_02",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_03"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:SEM_FULL:T0",
            "sourceText": "détecter",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "OPERATION"
          },
          {
            "canonicalMeaning": "Atteinte cardiaque",
            "clientElementId": "elem_03",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_04"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:SEM_FULL:T0",
            "sourceText": "l'atteinte cardiaque",
            "studyRole": "SUBJECT",
            "supersedesElementIds": [],
            "type": "SCIENTIFIC_OBJECT"
          },
          {
            "canonicalMeaning": "Phase précoce",
            "clientElementId": "elem_04",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_05"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:SEM_FULL:T0",
            "sourceText": "précoce",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "TIMING"
          },
          {
            "canonicalMeaning": "Maladie de Fabry",
            "clientElementId": "elem_05",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_06"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:SEM_FULL:T0",
            "sourceText": "Fabry",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "CONDITION"
          },
          {
            "canonicalMeaning": "Avant la fibrose visible",
            "clientElementId": "elem_06",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_07"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:SEM_FULL:T0",
            "sourceText": "avant la fibrose visible",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "CONSTRAINT"
          },
          {
            "canonicalMeaning": "Étude multicentrique impliquant plusieurs centres",
            "clientElementId": "elem_07",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_08"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:SEM_FULL:T0",
            "sourceText": "plusieurs centres",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "STUDY_DESIGN"
          },
          {
            "canonicalMeaning": "Séquences d'acquisition variables selon les centres",
            "clientElementId": "elem_08",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_09"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:SEM_FULL:T0",
            "sourceText": "séquences",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "METHOD"
          },
          {
            "canonicalMeaning": "Incertitude sur les modalités ou séquences spécifiques",
            "clientElementId": "elem_09",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_01"
            ],
            "polarity": "UNCERTAIN",
            "requiresConfirmation": true,
            "sourceMessageId": "I04:SEM_FULL:R1",
            "sourceText": "Je ne sais pas.",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "UNKNOWN"
          }
        ],
        "ellipses": [],
        "knowledgeRequests": [],
        "language": "fr",
        "missingConcepts": [
          "Modalité d'imagerie spécifique"
        ],
        "normalizedMeaning": "L'utilisateur indique qu'il ne sait pas quelles modalités ou séquences d'imagerie utiliser dans le cadre multicentrique pour la maladie de Fabry.",
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
            "relationType": "AIMS_TO",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem_01",
            "targetClientElementId": "elem_02"
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
            "relationType": "OBSERVES",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem_02",
            "targetClientElementId": "elem_03"
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
            "relationType": "RELATED_TO_CANDIDATE",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem_03",
            "targetClientElementId": "elem_05"
          },
          {
            "clientRelationId": "rel_04",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "rel_04"
            ],
            "polarity": "AFFIRMED",
            "relationType": "BOUNDED_BY",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem_02",
            "targetClientElementId": "elem_06"
          }
        ],
        "routeProposal": {
          "confidence": 0.9,
          "expectedCapabilities": [
            "Harmonisation de protocoles",
            "Définition des critères d'évaluation"
          ],
          "reason": "L'utilisateur élabore une étude multicentrique mais doit encore préciser ou harmoniser les méthodes et séquences d'imagerie.",
          "route": "DESIGN_STUDY"
        },
        "semanticInventory": {
          "explicitFragments": [
            {
              "inventoryItemId": "inv_01",
              "linkedInventoryItemIds": [],
              "localRole": "response",
              "modifiers": [],
              "normalizedLabel": "Ne sait pas",
              "polarity": "UNCERTAIN",
              "sourceMessageId": "I04:SEM_FULL:R1",
              "sourceText": "Je ne sais pas."
            },
            {
              "inventoryItemId": "inv_02",
              "linkedInventoryItemIds": [],
              "localRole": "subject",
              "modifiers": [],
              "normalizedLabel": "Intention de l'utilisateur",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:SEM_FULL:T0",
              "sourceText": "Je veux"
            },
            {
              "inventoryItemId": "inv_03",
              "linkedInventoryItemIds": [
                "inv_02",
                "inv_04"
              ],
              "localRole": "verb",
              "modifiers": [],
              "normalizedLabel": "Action de détecter",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:SEM_FULL:T0",
              "sourceText": "détecter"
            },
            {
              "inventoryItemId": "inv_04",
              "linkedInventoryItemIds": [
                "inv_03"
              ],
              "localRole": "object",
              "modifiers": [],
              "normalizedLabel": "Atteinte cardiaque",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:SEM_FULL:T0",
              "sourceText": "l'atteinte cardiaque"
            },
            {
              "inventoryItemId": "inv_05",
              "linkedInventoryItemIds": [
                "inv_04"
              ],
              "localRole": "modifier",
              "modifiers": [],
              "normalizedLabel": "Phase précoce",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:SEM_FULL:T0",
              "sourceText": "précoce"
            },
            {
              "inventoryItemId": "inv_06",
              "linkedInventoryItemIds": [
                "inv_04"
              ],
              "localRole": "condition",
              "modifiers": [],
              "normalizedLabel": "Maladie de Fabry",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:SEM_FULL:T0",
              "sourceText": "Fabry"
            },
            {
              "inventoryItemId": "inv_07",
              "linkedInventoryItemIds": [
                "inv_03"
              ],
              "localRole": "constraint",
              "modifiers": [],
              "normalizedLabel": "Avant la fibrose visible",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:SEM_FULL:T0",
              "sourceText": "avant la fibrose visible"
            },
            {
              "inventoryItemId": "inv_08",
              "linkedInventoryItemIds": [],
              "localRole": "design",
              "modifiers": [],
              "normalizedLabel": "Plusieurs centres",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:SEM_FULL:T0",
              "sourceText": "plusieurs centres"
            },
            {
              "inventoryItemId": "inv_09",
              "linkedInventoryItemIds": [],
              "localRole": "method",
              "modifiers": [],
              "normalizedLabel": "Séquences d'acquisition",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:SEM_FULL:T0",
              "sourceText": "séquences"
            }
          ],
          "explicitRelations": [
            {
              "inventoryRelationId": "rel_01",
              "normalizedRelation": "AIMS_TO",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "inv_02",
              "sourceMessageId": "I04:SEM_FULL:T0",
              "sourceText": "Je veux détecter",
              "targetInventoryItemId": "inv_03"
            },
            {
              "inventoryRelationId": "rel_02",
              "normalizedRelation": "OBSERVES",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "inv_03",
              "sourceMessageId": "I04:SEM_FULL:T0",
              "sourceText": "détecter l'atteinte cardiaque",
              "targetInventoryItemId": "inv_04"
            },
            {
              "inventoryRelationId": "rel_03",
              "normalizedRelation": "RELATED_TO_CANDIDATE",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "inv_04",
              "sourceMessageId": "I04:SEM_FULL:T0",
              "sourceText": "l'atteinte cardiaque précoce dans Fabry",
              "targetInventoryItemId": "inv_06"
            },
            {
              "inventoryRelationId": "rel_04",
              "normalizedRelation": "BOUNDED_BY",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "inv_03",
              "sourceMessageId": "I04:SEM_FULL:T0",
              "sourceText": "Je veux détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible.",
              "targetInventoryItemId": "inv_07"
            }
          ]
        },
        "semanticWarnings": [
          "DETERMINISTIC_INVENTORY_RELATION_SOURCE_SPAN_DERIVED:1"
        ],
        "summaryForUser": "Vous avez indiqué ne pas savoir quelles séquences utiliser.",
        "unknowns": [
          "Choix des séquences d'imagerie"
        ]
      },
      "reconstructionAttempts": [
        {
          "attempt": 1,
          "category": null,
          "httpStatus": 200,
          "latencyMs": 8440,
          "outcome": "SUCCESS",
          "providerCode": null,
          "providerError": null,
          "providerStatus": null,
          "requestFinished": "2026-08-14T09:17:27.238Z",
          "requestStarted": "2026-08-14T09:17:18.798Z",
          "retryable": false
        },
        {
          "attempt": 1,
          "category": null,
          "httpStatus": 200,
          "latencyMs": 8675,
          "outcome": "SUCCESS",
          "providerCode": null,
          "providerError": null,
          "providerStatus": null,
          "requestFinished": "2026-08-14T09:17:35.921Z",
          "requestStarted": "2026-08-14T09:17:27.246Z",
          "retryable": false
        }
      ],
      "reconstructionCallId": "gemini-call:ke1-000a1620f9fc4fc4",
      "reconstructionPromptVersion": "SEM-001-RECONSTRUCTION-1.6",
      "schemaVersion": "SEM-001-1.1",
      "temperature": null
    },
    "explicitCoverageReport": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_01",
          "mappedClientElementIds": [
            "elem_09"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Ne sait pas",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:SEM_FULL:R1",
          "sourceText": "Je ne sais pas."
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_02",
          "mappedClientElementIds": [
            "elem_01"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Intention de l'utilisateur",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "Je veux"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_03",
          "mappedClientElementIds": [
            "elem_02"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Action de détecter",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "détecter"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_04",
          "mappedClientElementIds": [
            "elem_03"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Atteinte cardiaque",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "l'atteinte cardiaque"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_05",
          "mappedClientElementIds": [
            "elem_04"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Phase précoce",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "précoce"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_06",
          "mappedClientElementIds": [
            "elem_05"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Maladie de Fabry",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "Fabry"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_07",
          "mappedClientElementIds": [
            "elem_06"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Avant la fibrose visible",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "avant la fibrose visible"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_08",
          "mappedClientElementIds": [
            "elem_07"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Plusieurs centres",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "plusieurs centres"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_09",
          "mappedClientElementIds": [
            "elem_08"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Séquences d'acquisition",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "séquences"
        }
      ],
      "status": "COMPLETE"
    },
    "history": [
      {
        "changeReason": "Nouvelle contribution utilisateur analysée sans réécriture de l’état antérieur.",
        "changedAt": "2026-08-14T09:16:48.323Z",
        "digest": "ke1-63f3f46fbcdf0af3",
        "modelId": "semantic-model:ke1-e41a5db9fc48193d",
        "revision": 1,
        "status": "CANDIDATE"
      }
    ],
    "knowledgeRequests": [],
    "knowledgeSnapshot": null,
    "missingConcepts": [
      "Modalité d'imagerie spécifique"
    ],
    "normalizedMeaning": "L'utilisateur indique qu'il ne sait pas quelles modalités ou séquences d'imagerie utiliser dans le cadre multicentrique pour la maladie de Fabry.",
    "originalRequest": "Je veux détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible. On a plusieurs centres et tout le monde n'a pas les mêmes séquences.",
    "previousModelId": "semantic-model:ke1-e41a5db9fc48193d",
    "relationCoverageReport": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_01",
          "mappedClientRelationIds": [
            "rel_01"
          ],
          "normalizedRelation": "AIMS_TO",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv_02",
          "targetInventoryItemId": "inv_03"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_02",
          "mappedClientRelationIds": [
            "rel_02"
          ],
          "normalizedRelation": "OBSERVES",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv_03",
          "targetInventoryItemId": "inv_04"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_03",
          "mappedClientRelationIds": [
            "rel_03"
          ],
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv_04",
          "targetInventoryItemId": "inv_06"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_04",
          "mappedClientRelationIds": [
            "rel_04"
          ],
          "normalizedRelation": "BOUNDED_BY",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv_03",
          "targetInventoryItemId": "inv_07"
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
          "rel_02"
        ],
        "polarity": "AFFIRMED",
        "relationType": "OBSERVES",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-50f06222f315a8be",
        "sourceElementId": "sem-element:ke1-8ee975cee73682ca",
        "targetElementId": "sem-element:ke1-f9a45bd622f74a92",
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
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-84e65779a297aa65",
        "sourceElementId": "sem-element:ke1-f9a45bd622f74a92",
        "targetElementId": "sem-element:ke1-b4c3c91b3ce8d0af",
        "version": 2,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_04"
        ],
        "polarity": "AFFIRMED",
        "relationType": "BOUNDED_BY",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-97a997c5c4faadf9",
        "sourceElementId": "sem-element:ke1-8ee975cee73682ca",
        "targetElementId": "sem-element:ke1-abb32fe017decea4",
        "version": 2,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_01"
        ],
        "polarity": "AFFIRMED",
        "relationType": "AIMS_TO",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-d67dd3456b5900c9",
        "sourceElementId": "sem-element:ke1-f7c5754809b8449c",
        "targetElementId": "sem-element:ke1-8ee975cee73682ca",
        "version": 2,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      }
    ],
    "revision": 2,
    "routeProposal": {
      "confidence": 0.9,
      "expectedCapabilities": [
        "Définition des critères d'évaluation",
        "Harmonisation de protocoles"
      ],
      "reason": "L'utilisateur élabore une étude multicentrique mais doit encore préciser ou harmoniser les méthodes et séquences d'imagerie.",
      "route": "DESIGN_STUDY"
    },
    "semanticModelId": "semantic-model:ke1-1e79fe0d924f63d1",
    "semanticModelVersion": "1.1",
    "status": "CANDIDATE",
    "summaryForUser": "Vous avez indiqué ne pas savoir quelles séquences utiliser.",
    "unknowns": [
      "Choix des séquences d'imagerie"
    ],
    "updatedAt": "2026-08-14T09:17:41.167Z"
  },
  "pairedFirstReconstruction": false,
  "postCriticCandidate": {
    "ambiguities": [
      "Hétérogénéité des séquences entre les centres non normalisée"
    ],
    "candidateId": "semantic-candidate:ke1-e41a5db9fc48193d",
    "clarificationCandidates": [
      {
        "question": "Souhaitez-vous définir ou sélectionner une modalité ou une séquence spécifique pour harmoniser l'étude entre les centres ?",
        "reason": "L'utilisateur a indiqué ne pas savoir quelles séquences utiliser.",
        "resolvesClientElementIds": [
          "elem_09",
          "elem_08"
        ]
      }
    ],
    "contradictions": [],
    "elements": [
      {
        "canonicalMeaning": "Intention de l'utilisateur de concevoir ou réaliser une détection",
        "clientElementId": "elem_01",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_02"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_FULL:T0",
        "sourceText": "Je veux",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_INTENT"
      },
      {
        "canonicalMeaning": "Action de détecter",
        "clientElementId": "elem_02",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_03"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_FULL:T0",
        "sourceText": "détecter",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "OPERATION"
      },
      {
        "canonicalMeaning": "Atteinte cardiaque",
        "clientElementId": "elem_03",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_04"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_FULL:T0",
        "sourceText": "l'atteinte cardiaque",
        "studyRole": "SUBJECT",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_OBJECT"
      },
      {
        "canonicalMeaning": "Phase précoce",
        "clientElementId": "elem_04",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_05"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_FULL:T0",
        "sourceText": "précoce",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "TIMING"
      },
      {
        "canonicalMeaning": "Maladie de Fabry",
        "clientElementId": "elem_05",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_06"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_FULL:T0",
        "sourceText": "Fabry",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONDITION"
      },
      {
        "canonicalMeaning": "Avant la fibrose visible",
        "clientElementId": "elem_06",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_07"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_FULL:T0",
        "sourceText": "avant la fibrose visible",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONSTRAINT"
      },
      {
        "canonicalMeaning": "Étude multicentrique impliquant plusieurs centres",
        "clientElementId": "elem_07",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_08"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_FULL:T0",
        "sourceText": "plusieurs centres",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "STUDY_DESIGN"
      },
      {
        "canonicalMeaning": "Séquences d'acquisition variables selon les centres",
        "clientElementId": "elem_08",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_09"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_FULL:T0",
        "sourceText": "séquences",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "METHOD"
      },
      {
        "canonicalMeaning": "Incertitude sur les modalités ou séquences spécifiques",
        "clientElementId": "elem_09",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_01"
        ],
        "polarity": "UNCERTAIN",
        "requiresConfirmation": true,
        "sourceMessageId": "I04:SEM_FULL:R1",
        "sourceText": "Je ne sais pas.",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "UNKNOWN"
      }
    ],
    "ellipses": [],
    "knowledgeRequests": [],
    "language": "fr",
    "missingConcepts": [
      "Modalité d'imagerie spécifique"
    ],
    "normalizedMeaning": "L'utilisateur indique qu'il ne sait pas quelles modalités ou séquences d'imagerie utiliser dans le cadre multicentrique pour la maladie de Fabry.",
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
        "relationType": "AIMS_TO",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_01",
        "targetClientElementId": "elem_02"
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
        "relationType": "OBSERVES",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_02",
        "targetClientElementId": "elem_03"
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
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_03",
        "targetClientElementId": "elem_05"
      },
      {
        "clientRelationId": "rel_04",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_04"
        ],
        "polarity": "AFFIRMED",
        "relationType": "BOUNDED_BY",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_02",
        "targetClientElementId": "elem_06"
      }
    ],
    "routeProposal": {
      "confidence": 0.9,
      "expectedCapabilities": [
        "Harmonisation de protocoles",
        "Définition des critères d'évaluation"
      ],
      "reason": "L'utilisateur élabore une étude multicentrique mais doit encore préciser ou harmoniser les méthodes et séquences d'imagerie.",
      "route": "DESIGN_STUDY"
    },
    "semanticInventory": {
      "explicitFragments": [
        {
          "inventoryItemId": "inv_01",
          "linkedInventoryItemIds": [],
          "localRole": "response",
          "modifiers": [],
          "normalizedLabel": "Ne sait pas",
          "polarity": "UNCERTAIN",
          "sourceMessageId": "I04:SEM_FULL:R1",
          "sourceText": "Je ne sais pas."
        },
        {
          "inventoryItemId": "inv_02",
          "linkedInventoryItemIds": [],
          "localRole": "subject",
          "modifiers": [],
          "normalizedLabel": "Intention de l'utilisateur",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "Je veux"
        },
        {
          "inventoryItemId": "inv_03",
          "linkedInventoryItemIds": [
            "inv_02",
            "inv_04"
          ],
          "localRole": "verb",
          "modifiers": [],
          "normalizedLabel": "Action de détecter",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "détecter"
        },
        {
          "inventoryItemId": "inv_04",
          "linkedInventoryItemIds": [
            "inv_03"
          ],
          "localRole": "object",
          "modifiers": [],
          "normalizedLabel": "Atteinte cardiaque",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "l'atteinte cardiaque"
        },
        {
          "inventoryItemId": "inv_05",
          "linkedInventoryItemIds": [
            "inv_04"
          ],
          "localRole": "modifier",
          "modifiers": [],
          "normalizedLabel": "Phase précoce",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "précoce"
        },
        {
          "inventoryItemId": "inv_06",
          "linkedInventoryItemIds": [
            "inv_04"
          ],
          "localRole": "condition",
          "modifiers": [],
          "normalizedLabel": "Maladie de Fabry",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "Fabry"
        },
        {
          "inventoryItemId": "inv_07",
          "linkedInventoryItemIds": [
            "inv_03"
          ],
          "localRole": "constraint",
          "modifiers": [],
          "normalizedLabel": "Avant la fibrose visible",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "avant la fibrose visible"
        },
        {
          "inventoryItemId": "inv_08",
          "linkedInventoryItemIds": [],
          "localRole": "design",
          "modifiers": [],
          "normalizedLabel": "Plusieurs centres",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "plusieurs centres"
        },
        {
          "inventoryItemId": "inv_09",
          "linkedInventoryItemIds": [],
          "localRole": "method",
          "modifiers": [],
          "normalizedLabel": "Séquences d'acquisition",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "séquences"
        }
      ],
      "explicitRelations": [
        {
          "inventoryRelationId": "rel_01",
          "normalizedRelation": "AIMS_TO",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "inv_02",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "Je veux détecter",
          "targetInventoryItemId": "inv_03"
        },
        {
          "inventoryRelationId": "rel_02",
          "normalizedRelation": "OBSERVES",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "inv_03",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "détecter l'atteinte cardiaque",
          "targetInventoryItemId": "inv_04"
        },
        {
          "inventoryRelationId": "rel_03",
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "inv_04",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "l'atteinte cardiaque précoce dans Fabry",
          "targetInventoryItemId": "inv_06"
        },
        {
          "inventoryRelationId": "rel_04",
          "normalizedRelation": "BOUNDED_BY",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "inv_03",
          "sourceMessageId": "I04:SEM_FULL:T0",
          "sourceText": "Je veux détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible.",
          "targetInventoryItemId": "inv_07"
        }
      ]
    },
    "semanticWarnings": [
      "DETERMINISTIC_INVENTORY_RELATION_SOURCE_SPAN_DERIVED:1"
    ],
    "summaryForUser": "Vous avez indiqué ne pas savoir quelles séquences utiliser.",
    "unknowns": [
      "Choix des séquences d'imagerie"
    ]
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

L'utilisateur indique qu'il ne sait pas quelles modalités ou séquences d'imagerie utiliser dans le cadre multicentrique pour la maladie de Fabry.

Objectif scientifique produit :

Intention de l'utilisateur de concevoir ou réaliser une détection

### EXPLICITEMENT DIT PAR LE CHERCHEUR

- content=Phase précoce | scientificRole=TIMING:NONE | polarity=AFFIRMED | temporalContext=Phase précoce | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=précoce | provenanceTurnIds=["I04:SEM_FULL:T0"]
- content=Incertitude sur les modalités ou séquences spécifiques | scientificRole=UNKNOWN:NONE | polarity=UNCERTAIN | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Je ne sais pas. | provenanceTurnIds=["I04:SEM_FULL:R1"]
- content=Séquences d'acquisition variables selon les centres | scientificRole=METHOD:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=séquences | provenanceTurnIds=["I04:SEM_FULL:T0"]
- content=Action de détecter | scientificRole=OPERATION:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=détecter | provenanceTurnIds=["I04:SEM_FULL:T0"]
- content=Avant la fibrose visible | scientificRole=CONSTRAINT:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=avant la fibrose visible | provenanceTurnIds=["I04:SEM_FULL:T0"]
- content=Maladie de Fabry | scientificRole=CONDITION:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Fabry | provenanceTurnIds=["I04:SEM_FULL:T0"]
- content=Étude multicentrique impliquant plusieurs centres | scientificRole=STUDY_DESIGN:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=plusieurs centres | provenanceTurnIds=["I04:SEM_FULL:T0"]
- content=Intention de l'utilisateur de concevoir ou réaliser une détection | scientificRole=SCIENTIFIC_INTENT:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Je veux | provenanceTurnIds=["I04:SEM_FULL:T0"]
- content=Atteinte cardiaque | scientificRole=SCIENTIFIC_OBJECT:SUBJECT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=l'atteinte cardiaque | provenanceTurnIds=["I04:SEM_FULL:T0"]

### RELATIONS COMPRISES

- subject=Action de détecter | predicate=OBSERVES | object=Atteinte cardiaque | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Atteinte cardiaque | predicate=RELATED_TO_CANDIDATE | object=Maladie de Fabry | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Action de détecter | predicate=BOUNDED_BY | object=Avant la fibrose visible | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Intention de l'utilisateur de concevoir ou réaliser une détection | predicate=AIMS_TO | object=Action de détecter | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER

### CONTEXTE INFÉRÉ

- Aucun élément produit.

### CANDIDATS SCIENTIFIQUES CONTEXTUELS

- Aucun élément produit.

### NÉGATIONS / CONTRAINTES

- Aucun élément produit.

### TEMPORALITÉ

- content=Phase précoce | scientificRole=TIMING:NONE | polarity=AFFIRMED | temporalContext=Phase précoce | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=précoce | provenanceTurnIds=["I04:SEM_FULL:T0"]

### AMBIGUÏTÉS

- content=Hétérogénéité des séquences entre les centres non normalisée | epistemicStatus=AMBIGUOUS | decisionImpact=SEM reports an unresolved ambiguity; impact requires clarification.

### INFORMATIONS MANQUANTES

- content=Choix des séquences d'imagerie | owner=USER_OR_SPECIALIZED_OWNER_UNRESOLVED | priority=MEDIUM | blocking=non | decisionImpact=SEM reports missing or unresolved information.
- content=Modalité d'imagerie spécifique | owner=USER_OR_SPECIALIZED_OWNER_UNRESOLVED | priority=MEDIUM | blocking=non | decisionImpact=SEM reports missing or unresolved information.

### INCONNUES

- content=Choix des séquences d'imagerie | owner=USER_OR_SPECIALIZED_OWNER_UNRESOLVED | priority=MEDIUM | blocking=non | decisionImpact=SEM reports missing or unresolved information.
- content=Modalité d'imagerie spécifique | owner=USER_OR_SPECIALIZED_OWNER_UNRESOLVED | priority=MEDIUM | blocking=non | decisionImpact=SEM reports missing or unresolved information.

### CORRECTIONS / SUPERSESSIONS

- Aucun élément produit.

### OWNERSHIP / STATUT ÉPISTÉMIQUE

- content=Phase précoce | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:SEM_FULL:T0"]
- content=Incertitude sur les modalités ou séquences spécifiques | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:SEM_FULL:R1"]
- content=Séquences d'acquisition variables selon les centres | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:SEM_FULL:T0"]
- content=Action de détecter | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:SEM_FULL:T0"]
- content=Avant la fibrose visible | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:SEM_FULL:T0"]
- content=Maladie de Fabry | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:SEM_FULL:T0"]
- content=Étude multicentrique impliquant plusieurs centres | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:SEM_FULL:T0"]
- content=Intention de l'utilisateur de concevoir ou réaliser une détection | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:SEM_FULL:T0"]
- content=Atteinte cardiaque | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:SEM_FULL:T0"]

### QUESTIONS DE CLARIFICATION CANDIDATES

- question=Souhaitez-vous définir ou sélectionner une modalité ou une séquence spécifique pour harmoniser l'étude entre les centres ? | priority=MEDIUM | blocking=non | decisionImpact=L'utilisateur a indiqué ne pas savoir quelles séquences utiliser. | targetIds=["sem-element:ke1-0e185927f0c5601b", "sem-element:ke1-4d147db90486b8cd"]

## MISSING STRUCTURAL GUARANTEES

- EXACT_PROVIDER_RAW_TEXT_NOT_PERSISTED; STRUCTURED_NATIVE_ARTIFACT_AVAILABLE

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
