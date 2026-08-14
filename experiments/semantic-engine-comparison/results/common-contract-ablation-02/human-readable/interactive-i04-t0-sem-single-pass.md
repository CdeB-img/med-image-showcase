# I04 — SEM_SINGLE_PASS — INTERACTIVE T0

## INPUT

Message utilisateur courant VERBATIM :

> Je veux détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible. On a plusieurs centres et tout le monde n'a pas les mêmes séquences.

Conversation précédente VERBATIM :

> —

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/interactive-i04-t0-sem-single-pass.json`

```json
{
  "deterministicCoverage": {
    "explicit": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_detecter",
          "mappedClientElementIds": [
            "elem_intent"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "détecter",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "détecter"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_atteinte_cardiaque",
          "mappedClientElementIds": [
            "elem_atteinte"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "atteinte cardiaque précoce",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "l'atteinte cardiaque précoce"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_fabry",
          "mappedClientElementIds": [
            "elem_fabry"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "maladie de Fabry",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "Fabry"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_fibrose",
          "mappedClientElementIds": [
            "elem_fibrose"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "fibrose visible",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "la fibrose visible"
        },
        {
          "coverageStatus": "UNRESOLVED_EXPLICIT_FRAGMENT",
          "inventoryItemId": "item_avant",
          "mappedClientElementIds": [],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "avant",
          "reason": "The exact inventory fragment has no source-grounded typed Semantic Element mapping.",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "avant"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_centres",
          "mappedClientElementIds": [
            "elem_centres"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "plusieurs centres",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "plusieurs centres"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_sequences",
          "mappedClientElementIds": [
            "elem_sequences"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "séquences d'acquisition",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "les mêmes séquences"
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
          "inventoryRelationId": "rel_intent_detect",
          "mappedClientRelationIds": [
            "rel_intent_to_target"
          ],
          "normalizedRelation": "AIMS_TO_MODIFY",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "item_detecter",
          "targetInventoryItemId": "item_atteinte_cardiaque"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_fabry_cond",
          "mappedClientRelationIds": [
            "rel_atteinte_cond"
          ],
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "item_atteinte_cardiaque",
          "targetInventoryItemId": "item_fabry"
        },
        {
          "coverageStatus": "EXPLICIT_RELATION_UNMAPPED",
          "inventoryRelationId": "rel_avant_fibrose",
          "mappedClientRelationIds": [],
          "normalizedRelation": "RECOVERS_AFTER",
          "reason": "The explicit relational construction has no mapped direct Semantic Relation between elements grounded to its inventory endpoints.",
          "sourceInventoryItemId": "item_detecter",
          "targetInventoryItemId": "item_fibrose"
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
      "Précision de la méthode de détection de l'atteinte cardiaque précoce non explicitée."
    ],
    "candidateId": "cand_01J9XYZ0000000000000000001",
    "clarificationCandidates": [
      {
        "question": "Quelle méthode ou quel biomarqueur préférez-vous utiliser pour détecter l'atteinte cardiaque précoce dans ce contexte multicentrique ?",
        "reason": "Préciser la modalité ou la méthode d'imagerie/biomarqueur pour formaliser le protocole.",
        "resolvesClientElementIds": [
          "elem_sequences"
        ]
      }
    ],
    "contradictions": [],
    "elements": [
      {
        "canonicalMeaning": "Détecter l'atteinte cardiaque précoce",
        "clientElementId": "elem_intent",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_detecter"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
        "sourceText": "détecter",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_INTENT"
      },
      {
        "canonicalMeaning": "Atteinte cardiaque précoce",
        "clientElementId": "elem_atteinte",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_atteinte_cardiaque"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
        "sourceText": "l'atteinte cardiaque précoce",
        "studyRole": "OUTCOME_ROLE",
        "supersedesElementIds": [],
        "type": "OUTCOME"
      },
      {
        "canonicalMeaning": "Maladie de Fabry",
        "clientElementId": "elem_fabry",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_fabry"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
        "sourceText": "Fabry",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONDITION"
      },
      {
        "canonicalMeaning": "Fibrose cardiaque visible",
        "clientElementId": "elem_fibrose",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_fibrose"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
        "sourceText": "la fibrose visible",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_OBJECT"
      },
      {
        "canonicalMeaning": "Étude multicentrique",
        "clientElementId": "elem_centres",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_centres"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
        "sourceText": "plusieurs centres",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "STUDY_DESIGN"
      },
      {
        "canonicalMeaning": "Séquences d'acquisition hétérogènes entre centres",
        "clientElementId": "elem_sequences",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_sequences"
        ],
        "polarity": "NEGATED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
        "sourceText": "les mêmes séquences",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "METHOD"
      }
    ],
    "ellipses": [],
    "knowledgeRequests": [],
    "language": "fr",
    "missingConcepts": [
      "Biomarqueur spécifique ou modalité d'imagerie utilisée pour la détection précoce"
    ],
    "normalizedMeaning": "L'utilisateur souhaite détecter l'atteinte cardiaque précoce dans la maladie de Fabry avant l'apparition de la fibrose visible, dans un contexte multicentrique caractérisé par une hétérogénéité des séquences d'acquisition.",
    "relations": [
      {
        "clientRelationId": "rel_intent_to_target",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_intent_detect"
        ],
        "polarity": "AFFIRMED",
        "relationType": "AIMS_TO_MODIFY",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_intent",
        "targetClientElementId": "elem_atteinte"
      },
      {
        "clientRelationId": "rel_atteinte_cond",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_fabry_cond"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_atteinte",
        "targetClientElementId": "elem_fabry"
      }
    ],
    "routeProposal": {
      "confidence": 0.95,
      "expectedCapabilities": [
        "Définition des critères d'évaluation",
        "Harmonisation méthodologique multicentrique",
        "Sélection des biomarqueurs ou méthodes"
      ],
      "reason": "L'utilisateur formule un objectif de détection clinique dans un contexte multicentrique avec des contraintes méthodologiques, ce qui correspond à la conception d'une étude.",
      "route": "DESIGN_STUDY"
    },
    "semanticInventory": {
      "explicitFragments": [
        {
          "inventoryItemId": "item_detecter",
          "linkedInventoryItemIds": [
            "item_atteinte_cardiaque"
          ],
          "localRole": "action",
          "modifiers": [],
          "normalizedLabel": "détecter",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "détecter"
        },
        {
          "inventoryItemId": "item_atteinte_cardiaque",
          "linkedInventoryItemIds": [
            "item_fabry"
          ],
          "localRole": "target",
          "modifiers": [
            "précoce"
          ],
          "normalizedLabel": "atteinte cardiaque précoce",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "l'atteinte cardiaque précoce"
        },
        {
          "inventoryItemId": "item_fabry",
          "linkedInventoryItemIds": [],
          "localRole": "condition",
          "modifiers": [],
          "normalizedLabel": "maladie de Fabry",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "Fabry"
        },
        {
          "inventoryItemId": "item_fibrose",
          "linkedInventoryItemIds": [],
          "localRole": "constraint_bound",
          "modifiers": [
            "visible"
          ],
          "normalizedLabel": "fibrose visible",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "la fibrose visible"
        },
        {
          "inventoryItemId": "item_avant",
          "linkedInventoryItemIds": [
            "item_detecter",
            "item_fibrose"
          ],
          "localRole": "timing_relation",
          "modifiers": [],
          "normalizedLabel": "avant",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "avant"
        },
        {
          "inventoryItemId": "item_centres",
          "linkedInventoryItemIds": [],
          "localRole": "study_design",
          "modifiers": [
            "plusieurs"
          ],
          "normalizedLabel": "plusieurs centres",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "plusieurs centres"
        },
        {
          "inventoryItemId": "item_sequences",
          "linkedInventoryItemIds": [
            "item_centres"
          ],
          "localRole": "method",
          "modifiers": [
            "pas les mêmes"
          ],
          "normalizedLabel": "séquences d'acquisition",
          "polarity": "NEGATED",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "les mêmes séquences"
        }
      ],
      "explicitRelations": [
        {
          "inventoryRelationId": "rel_intent_detect",
          "normalizedRelation": "AIMS_TO_MODIFY",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "item_detecter",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "détecter l'atteinte cardiaque précoce",
          "targetInventoryItemId": "item_atteinte_cardiaque"
        },
        {
          "inventoryRelationId": "rel_fabry_cond",
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "item_atteinte_cardiaque",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "l'atteinte cardiaque précoce dans Fabry",
          "targetInventoryItemId": "item_fabry"
        },
        {
          "inventoryRelationId": "rel_avant_fibrose",
          "normalizedRelation": "RECOVERS_AFTER",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "item_detecter",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "Je veux détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible.",
          "targetInventoryItemId": "item_fibrose"
        }
      ]
    },
    "semanticWarnings": [
      "DETERMINISTIC_INVENTORY_RELATION_SOURCE_SPAN_DERIVED:1"
    ],
    "summaryForUser": "Reconstruction sémantique de l'intention de détecter précocement l'atteinte cardiaque dans Fabry avant la fibrose, en tenant compte de l'hétérogénéité des séquences entre les différents centres.",
    "unknowns": []
  },
  "model": {
    "acceptanceRecord": null,
    "acceptedAt": null,
    "ambiguities": [
      "Précision de la méthode de détection de l'atteinte cardiaque précoce non explicitée."
    ],
    "clarificationCandidates": [
      {
        "question": "Quelle méthode ou quel biomarqueur préférez-vous utiliser pour détecter l'atteinte cardiaque précoce dans ce contexte multicentrique ?",
        "reason": "Préciser la modalité ou la méthode d'imagerie/biomarqueur pour formaliser le protocole.",
        "resolvesElementIds": [
          "sem-element:ke1-7c730737e246355b"
        ]
      }
    ],
    "contradictions": [],
    "conversationMessageIds": [
      "I04:SEM_SINGLE_PASS:T0"
    ],
    "createdAt": "2026-08-14T09:17:03.565Z",
    "critic": {
      "issues": [],
      "summary": "Single-pass deterministic reports incomplete; no semantic critic or repair was executed.",
      "verdict": "CLARIFICATION_REQUIRED"
    },
    "digest": "ke1-70af2165b12277e1",
    "elements": [
      {
        "canonicalMeaning": "Étude multicentrique",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_centres"
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
          "messageId": "I04:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-5294b0fe51289bba",
          "rawElementId": "elem_centres",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-003189523f16dcde",
        "sourceSpan": {
          "end": 105,
          "messageId": "I04:SEM_SINGLE_PASS:T0",
          "start": 88,
          "text": "plusieurs centres"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "STUDY_DESIGN",
        "version": 1
      },
      {
        "canonicalMeaning": "Séquences d'acquisition hétérogènes entre centres",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_sequences"
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
          "messageId": "I04:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-5294b0fe51289bba",
          "rawElementId": "elem_sequences",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-7c730737e246355b",
        "sourceSpan": {
          "end": 150,
          "messageId": "I04:SEM_SINGLE_PASS:T0",
          "start": 131,
          "text": "les mêmes séquences"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "METHOD",
        "version": 1
      },
      {
        "canonicalMeaning": "Fibrose cardiaque visible",
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
          "messageId": "I04:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-5294b0fe51289bba",
          "rawElementId": "elem_fibrose",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-95d3c2b6304607d2",
        "sourceSpan": {
          "end": 81,
          "messageId": "I04:SEM_SINGLE_PASS:T0",
          "start": 63,
          "text": "la fibrose visible"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_OBJECT",
        "version": 1
      },
      {
        "canonicalMeaning": "Atteinte cardiaque précoce",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_atteinte_cardiaque"
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
          "messageId": "I04:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-5294b0fe51289bba",
          "rawElementId": "elem_atteinte",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-8452cd6d33e50e29",
          "sem-relation:ke1-f345ee1b721d2257"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-b01a8aba7016e06e",
        "sourceSpan": {
          "end": 45,
          "messageId": "I04:SEM_SINGLE_PASS:T0",
          "start": 17,
          "text": "l'atteinte cardiaque précoce"
        },
        "studyRole": "OUTCOME_ROLE",
        "supersedesElementIds": [],
        "type": "OUTCOME",
        "version": 1
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
          "messageId": "I04:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-5294b0fe51289bba",
          "rawElementId": "elem_fabry",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-8452cd6d33e50e29"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-b4c3c91b3ce8d0af",
        "sourceSpan": {
          "end": 56,
          "messageId": "I04:SEM_SINGLE_PASS:T0",
          "start": 51,
          "text": "Fabry"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONDITION",
        "version": 1
      },
      {
        "canonicalMeaning": "Détecter l'atteinte cardiaque précoce",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_detecter"
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
          "messageId": "I04:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-5294b0fe51289bba",
          "rawElementId": "elem_intent",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-f345ee1b721d2257"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-bfe6a6e737b208eb",
        "sourceSpan": {
          "end": 16,
          "messageId": "I04:SEM_SINGLE_PASS:T0",
          "start": 8,
          "text": "détecter"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_INTENT",
        "version": 1
      }
    ],
    "ellipses": [],
    "executionSnapshot": {
      "criticAttempts": [],
      "criticCallId": "deterministic-no-critic",
      "criticCallIds": [],
      "criticPromptVersion": "SEM-001-CRITIC-1.6",
      "executedAt": "2026-08-14T09:17:03.565Z",
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
          "Précision de la méthode de détection de l'atteinte cardiaque précoce non explicitée."
        ],
        "candidateId": "cand_01J9XYZ0000000000000000001",
        "clarificationCandidates": [
          {
            "question": "Quelle méthode ou quel biomarqueur préférez-vous utiliser pour détecter l'atteinte cardiaque précoce dans ce contexte multicentrique ?",
            "reason": "Préciser la modalité ou la méthode d'imagerie/biomarqueur pour formaliser le protocole.",
            "resolvesClientElementIds": [
              "elem_sequences"
            ]
          }
        ],
        "contradictions": [],
        "elements": [
          {
            "canonicalMeaning": "Détecter l'atteinte cardiaque précoce",
            "clientElementId": "elem_intent",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "item_detecter"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
            "sourceText": "détecter",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "SCIENTIFIC_INTENT"
          },
          {
            "canonicalMeaning": "Atteinte cardiaque précoce",
            "clientElementId": "elem_atteinte",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "item_atteinte_cardiaque"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
            "sourceText": "l'atteinte cardiaque précoce",
            "studyRole": "OUTCOME_ROLE",
            "supersedesElementIds": [],
            "type": "OUTCOME"
          },
          {
            "canonicalMeaning": "Maladie de Fabry",
            "clientElementId": "elem_fabry",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "item_fabry"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
            "sourceText": "Fabry",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "CONDITION"
          },
          {
            "canonicalMeaning": "Fibrose cardiaque visible",
            "clientElementId": "elem_fibrose",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "item_fibrose"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
            "sourceText": "la fibrose visible",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "SCIENTIFIC_OBJECT"
          },
          {
            "canonicalMeaning": "Étude multicentrique",
            "clientElementId": "elem_centres",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "item_centres"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
            "sourceText": "plusieurs centres",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "STUDY_DESIGN"
          },
          {
            "canonicalMeaning": "Séquences d'acquisition hétérogènes entre centres",
            "clientElementId": "elem_sequences",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "item_sequences"
            ],
            "polarity": "NEGATED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
            "sourceText": "les mêmes séquences",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "METHOD"
          }
        ],
        "ellipses": [],
        "knowledgeRequests": [],
        "language": "fr",
        "missingConcepts": [
          "Biomarqueur spécifique ou modalité d'imagerie utilisée pour la détection précoce"
        ],
        "normalizedMeaning": "L'utilisateur souhaite détecter l'atteinte cardiaque précoce dans la maladie de Fabry avant l'apparition de la fibrose visible, dans un contexte multicentrique caractérisé par une hétérogénéité des séquences d'acquisition.",
        "relations": [
          {
            "clientRelationId": "rel_intent_to_target",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "rel_intent_detect"
            ],
            "polarity": "AFFIRMED",
            "relationType": "AIMS_TO_MODIFY",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem_intent",
            "targetClientElementId": "elem_atteinte"
          },
          {
            "clientRelationId": "rel_atteinte_cond",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "rel_fabry_cond"
            ],
            "polarity": "AFFIRMED",
            "relationType": "RELATED_TO_CANDIDATE",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem_atteinte",
            "targetClientElementId": "elem_fabry"
          }
        ],
        "routeProposal": {
          "confidence": 0.95,
          "expectedCapabilities": [
            "Définition des critères d'évaluation",
            "Harmonisation méthodologique multicentrique",
            "Sélection des biomarqueurs ou méthodes"
          ],
          "reason": "L'utilisateur formule un objectif de détection clinique dans un contexte multicentrique avec des contraintes méthodologiques, ce qui correspond à la conception d'une étude.",
          "route": "DESIGN_STUDY"
        },
        "semanticInventory": {
          "explicitFragments": [
            {
              "inventoryItemId": "item_detecter",
              "linkedInventoryItemIds": [
                "item_atteinte_cardiaque"
              ],
              "localRole": "action",
              "modifiers": [],
              "normalizedLabel": "détecter",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
              "sourceText": "détecter"
            },
            {
              "inventoryItemId": "item_atteinte_cardiaque",
              "linkedInventoryItemIds": [
                "item_fabry"
              ],
              "localRole": "target",
              "modifiers": [
                "précoce"
              ],
              "normalizedLabel": "atteinte cardiaque précoce",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
              "sourceText": "l'atteinte cardiaque précoce"
            },
            {
              "inventoryItemId": "item_fabry",
              "linkedInventoryItemIds": [],
              "localRole": "condition",
              "modifiers": [],
              "normalizedLabel": "maladie de Fabry",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
              "sourceText": "Fabry"
            },
            {
              "inventoryItemId": "item_fibrose",
              "linkedInventoryItemIds": [],
              "localRole": "constraint_bound",
              "modifiers": [
                "visible"
              ],
              "normalizedLabel": "fibrose visible",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
              "sourceText": "la fibrose visible"
            },
            {
              "inventoryItemId": "item_avant",
              "linkedInventoryItemIds": [
                "item_detecter",
                "item_fibrose"
              ],
              "localRole": "timing_relation",
              "modifiers": [],
              "normalizedLabel": "avant",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
              "sourceText": "avant"
            },
            {
              "inventoryItemId": "item_centres",
              "linkedInventoryItemIds": [],
              "localRole": "study_design",
              "modifiers": [
                "plusieurs"
              ],
              "normalizedLabel": "plusieurs centres",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
              "sourceText": "plusieurs centres"
            },
            {
              "inventoryItemId": "item_sequences",
              "linkedInventoryItemIds": [
                "item_centres"
              ],
              "localRole": "method",
              "modifiers": [
                "pas les mêmes"
              ],
              "normalizedLabel": "séquences d'acquisition",
              "polarity": "NEGATED",
              "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
              "sourceText": "les mêmes séquences"
            }
          ],
          "explicitRelations": [
            {
              "inventoryRelationId": "rel_intent_detect",
              "normalizedRelation": "AIMS_TO_MODIFY",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "item_detecter",
              "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
              "sourceText": "détecter l'atteinte cardiaque précoce",
              "targetInventoryItemId": "item_atteinte_cardiaque"
            },
            {
              "inventoryRelationId": "rel_fabry_cond",
              "normalizedRelation": "RELATED_TO_CANDIDATE",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "item_atteinte_cardiaque",
              "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
              "sourceText": "l'atteinte cardiaque précoce dans Fabry",
              "targetInventoryItemId": "item_fabry"
            },
            {
              "inventoryRelationId": "rel_avant_fibrose",
              "normalizedRelation": "RECOVERS_AFTER",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "item_detecter",
              "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
              "sourceText": "Je veux détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible.",
              "targetInventoryItemId": "item_fibrose"
            }
          ]
        },
        "semanticWarnings": [
          "DETERMINISTIC_INVENTORY_RELATION_SOURCE_SPAN_DERIVED:1"
        ],
        "summaryForUser": "Reconstruction sémantique de l'intention de détecter précocement l'atteinte cardiaque dans Fabry avant la fibrose, en tenant compte de l'hétérogénéité des séquences entre les différents centres.",
        "unknowns": []
      },
      "reconstructionAttempts": [
        {
          "attempt": 1,
          "category": null,
          "httpStatus": 200,
          "latencyMs": 14921,
          "outcome": "SUCCESS",
          "providerCode": null,
          "providerError": null,
          "providerStatus": null,
          "requestFinished": "2026-08-14T09:17:03.543Z",
          "requestStarted": "2026-08-14T09:16:48.622Z",
          "retryable": false
        }
      ],
      "reconstructionCallId": "gemini-call:ke1-5294b0fe51289bba",
      "reconstructionPromptVersion": "SEM-001-RECONSTRUCTION-1.6",
      "schemaVersion": "SEM-001-1.1",
      "temperature": null
    },
    "explicitCoverageReport": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_detecter",
          "mappedClientElementIds": [
            "elem_intent"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "détecter",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "détecter"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_atteinte_cardiaque",
          "mappedClientElementIds": [
            "elem_atteinte"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "atteinte cardiaque précoce",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "l'atteinte cardiaque précoce"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_fabry",
          "mappedClientElementIds": [
            "elem_fabry"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "maladie de Fabry",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "Fabry"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_fibrose",
          "mappedClientElementIds": [
            "elem_fibrose"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "fibrose visible",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "la fibrose visible"
        },
        {
          "coverageStatus": "UNRESOLVED_EXPLICIT_FRAGMENT",
          "inventoryItemId": "item_avant",
          "mappedClientElementIds": [],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "avant",
          "reason": "The exact inventory fragment has no source-grounded typed Semantic Element mapping.",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "avant"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_centres",
          "mappedClientElementIds": [
            "elem_centres"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "plusieurs centres",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "plusieurs centres"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_sequences",
          "mappedClientElementIds": [
            "elem_sequences"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "séquences d'acquisition",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:SEM_SINGLE_PASS:T0",
          "sourceText": "les mêmes séquences"
        }
      ],
      "status": "INCOMPLETE"
    },
    "history": [],
    "knowledgeRequests": [],
    "knowledgeSnapshot": null,
    "missingConcepts": [
      "Biomarqueur spécifique ou modalité d'imagerie utilisée pour la détection précoce"
    ],
    "normalizedMeaning": "L'utilisateur souhaite détecter l'atteinte cardiaque précoce dans la maladie de Fabry avant l'apparition de la fibrose visible, dans un contexte multicentrique caractérisé par une hétérogénéité des séquences d'acquisition.",
    "originalRequest": "Je veux détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible. On a plusieurs centres et tout le monde n'a pas les mêmes séquences.",
    "previousModelId": null,
    "relationCoverageReport": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_intent_detect",
          "mappedClientRelationIds": [
            "rel_intent_to_target"
          ],
          "normalizedRelation": "AIMS_TO_MODIFY",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "item_detecter",
          "targetInventoryItemId": "item_atteinte_cardiaque"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_fabry_cond",
          "mappedClientRelationIds": [
            "rel_atteinte_cond"
          ],
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "item_atteinte_cardiaque",
          "targetInventoryItemId": "item_fabry"
        },
        {
          "coverageStatus": "EXPLICIT_RELATION_UNMAPPED",
          "inventoryRelationId": "rel_avant_fibrose",
          "mappedClientRelationIds": [],
          "normalizedRelation": "RECOVERS_AFTER",
          "reason": "The explicit relational construction has no mapped direct Semantic Relation between elements grounded to its inventory endpoints.",
          "sourceInventoryItemId": "item_detecter",
          "targetInventoryItemId": "item_fibrose"
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
          "rel_fabry_cond"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-8452cd6d33e50e29",
        "sourceElementId": "sem-element:ke1-b01a8aba7016e06e",
        "targetElementId": "sem-element:ke1-b4c3c91b3ce8d0af",
        "version": 1,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_intent_detect"
        ],
        "polarity": "AFFIRMED",
        "relationType": "AIMS_TO_MODIFY",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-f345ee1b721d2257",
        "sourceElementId": "sem-element:ke1-bfe6a6e737b208eb",
        "targetElementId": "sem-element:ke1-b01a8aba7016e06e",
        "version": 1,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      }
    ],
    "revision": 1,
    "routeProposal": {
      "confidence": 0.95,
      "expectedCapabilities": [
        "Définition des critères d'évaluation",
        "Harmonisation méthodologique multicentrique",
        "Sélection des biomarqueurs ou méthodes"
      ],
      "reason": "L'utilisateur formule un objectif de détection clinique dans un contexte multicentrique avec des contraintes méthodologiques, ce qui correspond à la conception d'une étude.",
      "route": "DESIGN_STUDY"
    },
    "semanticModelId": "semantic-model:ke1-f25dbc0ce00a4378",
    "semanticModelVersion": "1.1",
    "status": "CLARIFICATION_REQUIRED",
    "summaryForUser": "Reconstruction sémantique de l'intention de détecter précocement l'atteinte cardiaque dans Fabry avant la fibrose, en tenant compte de l'hétérogénéité des séquences entre les différents centres.",
    "unknowns": [],
    "updatedAt": "2026-08-14T09:17:03.565Z"
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

L'utilisateur souhaite détecter l'atteinte cardiaque précoce dans la maladie de Fabry avant l'apparition de la fibrose visible, dans un contexte multicentrique caractérisé par une hétérogénéité des séquences d'acquisition.

Objectif scientifique produit :

Détecter l'atteinte cardiaque précoce

### EXPLICITEMENT DIT PAR LE CHERCHEUR

- content=Étude multicentrique | scientificRole=STUDY_DESIGN:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=plusieurs centres | provenanceTurnIds=["I04:SEM_SINGLE_PASS:T0"]
- content=Séquences d'acquisition hétérogènes entre centres | scientificRole=METHOD:NONE | polarity=NEGATED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=les mêmes séquences | provenanceTurnIds=["I04:SEM_SINGLE_PASS:T0"]
- content=Fibrose cardiaque visible | scientificRole=SCIENTIFIC_OBJECT:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=la fibrose visible | provenanceTurnIds=["I04:SEM_SINGLE_PASS:T0"]
- content=Atteinte cardiaque précoce | scientificRole=OUTCOME:OUTCOME_ROLE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=l'atteinte cardiaque précoce | provenanceTurnIds=["I04:SEM_SINGLE_PASS:T0"]
- content=Maladie de Fabry | scientificRole=CONDITION:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Fabry | provenanceTurnIds=["I04:SEM_SINGLE_PASS:T0"]
- content=Détecter l'atteinte cardiaque précoce | scientificRole=SCIENTIFIC_INTENT:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=détecter | provenanceTurnIds=["I04:SEM_SINGLE_PASS:T0"]

### RELATIONS COMPRISES

- subject=Atteinte cardiaque précoce | predicate=RELATED_TO_CANDIDATE | object=Maladie de Fabry | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Détecter l'atteinte cardiaque précoce | predicate=AIMS_TO_MODIFY | object=Atteinte cardiaque précoce | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER

### CONTEXTE INFÉRÉ

- Aucun élément produit.

### CANDIDATS SCIENTIFIQUES CONTEXTUELS

- Aucun élément produit.

### NÉGATIONS / CONTRAINTES

- content=Séquences d'acquisition hétérogènes entre centres | scientificRole=METHOD:NONE | polarity=NEGATED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=les mêmes séquences | provenanceTurnIds=["I04:SEM_SINGLE_PASS:T0"]

### TEMPORALITÉ

- Aucun élément produit.

### AMBIGUÏTÉS

- content=Précision de la méthode de détection de l'atteinte cardiaque précoce non explicitée. | epistemicStatus=AMBIGUOUS | decisionImpact=SEM reports an unresolved ambiguity; impact requires clarification.

### INFORMATIONS MANQUANTES

- content=Biomarqueur spécifique ou modalité d'imagerie utilisée pour la détection précoce | owner=USER_OR_SPECIALIZED_OWNER_UNRESOLVED | priority=HIGH | blocking=oui | decisionImpact=SEM reports missing or unresolved information.

### INCONNUES

- content=Biomarqueur spécifique ou modalité d'imagerie utilisée pour la détection précoce | owner=USER_OR_SPECIALIZED_OWNER_UNRESOLVED | priority=HIGH | blocking=oui | decisionImpact=SEM reports missing or unresolved information.

### CORRECTIONS / SUPERSESSIONS

- Aucun élément produit.

### OWNERSHIP / STATUT ÉPISTÉMIQUE

- content=Étude multicentrique | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:SEM_SINGLE_PASS:T0"]
- content=Séquences d'acquisition hétérogènes entre centres | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:SEM_SINGLE_PASS:T0"]
- content=Fibrose cardiaque visible | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:SEM_SINGLE_PASS:T0"]
- content=Atteinte cardiaque précoce | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:SEM_SINGLE_PASS:T0"]
- content=Maladie de Fabry | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:SEM_SINGLE_PASS:T0"]
- content=Détecter l'atteinte cardiaque précoce | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:SEM_SINGLE_PASS:T0"]

### QUESTIONS DE CLARIFICATION CANDIDATES

- question=Quelle méthode ou quel biomarqueur préférez-vous utiliser pour détecter l'atteinte cardiaque précoce dans ce contexte multicentrique ? | priority=HIGH | blocking=oui | decisionImpact=Préciser la modalité ou la méthode d'imagerie/biomarqueur pour formaliser le protocole. | targetIds=["sem-element:ke1-7c730737e246355b"]

## MISSING STRUCTURAL GUARANTEES

- EXACT_PROVIDER_RAW_TEXT_NOT_PERSISTED; STRUCTURED_NATIVE_ARTIFACT_AVAILABLE

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
