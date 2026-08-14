# I02 — SEM_SINGLE_PASS — COMMON_TRANSCRIPT T1

## INPUT

Message utilisateur courant VERBATIM :

> L'IRM principale est à 24 h puis à J7. Je n'ai souvent pas d'IRM avant la thrombectomie.

Conversation précédente VERBATIM :

> I02:T0 | USER : Chez les patients thrombectomisés, je veux savoir si l'OEF se normalise quand la perfusion s'améliore, mais je n'ai pas toujours l'IRM avant le geste.

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/common-transcript-i02-t1-sem-single-pass.json`

```json
{
  "deterministicCoverage": {
    "explicit": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_01",
          "mappedClientElementIds": [
            "elem_01"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "patients thrombectomisés",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:T0",
          "sourceText": "les patients thrombectomisés"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_02",
          "mappedClientElementIds": [
            "elem_02"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "savoir si",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:T0",
          "sourceText": "savoir si"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_03",
          "mappedClientElementIds": [
            "elem_03"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "normalisation de l'OEF",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:T0",
          "sourceText": "l'OEF se normalise"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_04",
          "mappedClientElementIds": [
            "elem_04"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "amélioration de la perfusion",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:T0",
          "sourceText": "la perfusion s'améliore"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_05",
          "mappedClientElementIds": [
            "elem_05"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "absence fréquente d'IRM avant le geste",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:T0",
          "sourceText": "je n'ai pas toujours l'IRM avant le geste"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_06",
          "mappedClientElementIds": [
            "elem_06"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "IRM",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:T0",
          "sourceText": "l'IRM"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_07",
          "mappedClientElementIds": [
            "elem_07"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "avant le geste",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:T0",
          "sourceText": "avant le geste"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_08",
          "mappedClientElementIds": [
            "elem_08"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "IRM principale",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:R1",
          "sourceText": "L'IRM principale"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_09",
          "mappedClientElementIds": [
            "elem_09"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "à 24 h",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:R1",
          "sourceText": "à 24 h"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_10",
          "mappedClientElementIds": [
            "elem_10"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "à J7",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:R1",
          "sourceText": "à J7"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_11",
          "mappedClientElementIds": [
            "elem_11"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "absence fréquente d'IRM avant la thrombectomie",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:R1",
          "sourceText": "Je n'ai souvent pas d'IRM avant la thrombectomie"
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
          "inventoryRelationId": "rel_inv_01",
          "mappedClientRelationIds": [
            "rel_01"
          ],
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv_03",
          "targetInventoryItemId": "inv_04"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_inv_02",
          "mappedClientRelationIds": [
            "rel_02"
          ],
          "normalizedRelation": "REPEATED_AT",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv_06",
          "targetInventoryItemId": "inv_07"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_inv_03",
          "mappedClientRelationIds": [
            "rel_03"
          ],
          "normalizedRelation": "REPEATED_AT",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv_08",
          "targetInventoryItemId": "inv_09"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_inv_04",
          "mappedClientRelationIds": [
            "rel_04"
          ],
          "normalizedRelation": "REPEATED_AT",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv_08",
          "targetInventoryItemId": "inv_10"
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
        "canonicalMeaning": "Patients who have undergone thrombectomy",
        "clientElementId": "elem_01",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_01"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I02:T0",
        "sourceText": "les patients thrombectomisés",
        "studyRole": "SUBJECT",
        "supersedesElementIds": [],
        "type": "POPULATION"
      },
      {
        "canonicalMeaning": "Desire to know/evaluate a scientific relation",
        "clientElementId": "elem_02",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_02"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I02:T0",
        "sourceText": "savoir si",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_INTENT"
      },
      {
        "canonicalMeaning": "Oxygen Extraction Fraction normalization",
        "clientElementId": "elem_03",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_03"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I02:T0",
        "sourceText": "l'OEF se normalise",
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "BIOMARKER"
      },
      {
        "canonicalMeaning": "Perfusion improvement",
        "clientElementId": "elem_04",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_04"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I02:T0",
        "sourceText": "la perfusion s'améliore",
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "BIOMARKER"
      },
      {
        "canonicalMeaning": "MRI is not always available before the procedure",
        "clientElementId": "elem_05",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_05"
        ],
        "polarity": "NEGATED",
        "requiresConfirmation": false,
        "sourceMessageId": "I02:T0",
        "sourceText": "je n'ai pas toujours l'IRM avant le geste",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONSTRAINT"
      },
      {
        "canonicalMeaning": "Magnetic Resonance Imaging",
        "clientElementId": "elem_06",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_06"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I02:T0",
        "sourceText": "l'IRM",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "MODALITY"
      },
      {
        "canonicalMeaning": "Before the procedure/gesture",
        "clientElementId": "elem_07",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_07"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I02:T0",
        "sourceText": "avant le geste",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "TIMING"
      },
      {
        "canonicalMeaning": "Main Magnetic Resonance Imaging",
        "clientElementId": "elem_08",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_08"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I02:R1",
        "sourceText": "L'IRM principale",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "MODALITY"
      },
      {
        "canonicalMeaning": "At 24 hours",
        "clientElementId": "elem_09",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_09"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I02:R1",
        "sourceText": "à 24 h",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "TIMING"
      },
      {
        "canonicalMeaning": "At day 7",
        "clientElementId": "elem_10",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_10"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I02:R1",
        "sourceText": "à J7",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "TIMING"
      },
      {
        "canonicalMeaning": "Often no MRI before thrombectomy",
        "clientElementId": "elem_11",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv_11"
        ],
        "polarity": "NEGATED",
        "requiresConfirmation": false,
        "sourceMessageId": "I02:R1",
        "sourceText": "Je n'ai souvent pas d'IRM avant la thrombectomie",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONSTRAINT"
      }
    ],
    "ellipses": [],
    "knowledgeRequests": [],
    "language": "fr",
    "missingConcepts": [],
    "normalizedMeaning": "Evaluation de la normalisation de l'OEF en fonction de l'amelioration de la perfusion chez les patients thrombectomises, avec des examens IRM principaux a 24h et J7 et l'absence frequente d'IRM avant le geste.",
    "relations": [
      {
        "clientRelationId": "rel_01",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_inv_01"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_03",
        "targetClientElementId": "elem_04"
      },
      {
        "clientRelationId": "rel_02",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_inv_02"
        ],
        "polarity": "AFFIRMED",
        "relationType": "REPEATED_AT",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_06",
        "targetClientElementId": "elem_07"
      },
      {
        "clientRelationId": "rel_03",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_inv_03"
        ],
        "polarity": "AFFIRMED",
        "relationType": "REPEATED_AT",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_08",
        "targetClientElementId": "elem_09"
      },
      {
        "clientRelationId": "rel_04",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_inv_04"
        ],
        "polarity": "AFFIRMED",
        "relationType": "REPEATED_AT",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_08",
        "targetClientElementId": "elem_10"
      }
    ],
    "routeProposal": {
      "confidence": 0.95,
      "expectedCapabilities": [
        "Define study population",
        "Specify imaging timelines",
        "Handle missing baseline data constraints"
      ],
      "reason": "The user is framing a clinical research question involving patient population, biomarkers, timings, and procedural constraints, which fits study design.",
      "route": "DESIGN_STUDY"
    },
    "semanticInventory": {
      "explicitFragments": [
        {
          "inventoryItemId": "inv_01",
          "linkedInventoryItemIds": [],
          "localRole": "SUBJECT",
          "modifiers": [],
          "normalizedLabel": "patients thrombectomisés",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I02:T0",
          "sourceText": "les patients thrombectomisés"
        },
        {
          "inventoryItemId": "inv_02",
          "linkedInventoryItemIds": [],
          "localRole": "INTENT",
          "modifiers": [],
          "normalizedLabel": "savoir si",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I02:T0",
          "sourceText": "savoir si"
        },
        {
          "inventoryItemId": "inv_03",
          "linkedInventoryItemIds": [
            "inv_04"
          ],
          "localRole": "MEASUREMENT",
          "modifiers": [],
          "normalizedLabel": "normalisation de l'OEF",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I02:T0",
          "sourceText": "l'OEF se normalise"
        },
        {
          "inventoryItemId": "inv_04",
          "linkedInventoryItemIds": [
            "inv_03"
          ],
          "localRole": "MEASUREMENT",
          "modifiers": [],
          "normalizedLabel": "amélioration de la perfusion",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I02:T0",
          "sourceText": "la perfusion s'améliore"
        },
        {
          "inventoryItemId": "inv_05",
          "linkedInventoryItemIds": [
            "inv_06",
            "inv_07"
          ],
          "localRole": "CONSTRAINT",
          "modifiers": [
            "pas toujours"
          ],
          "normalizedLabel": "absence fréquente d'IRM avant le geste",
          "polarity": "NEGATED",
          "sourceMessageId": "I02:T0",
          "sourceText": "je n'ai pas toujours l'IRM avant le geste"
        },
        {
          "inventoryItemId": "inv_06",
          "linkedInventoryItemIds": [],
          "localRole": "MODALITY",
          "modifiers": [],
          "normalizedLabel": "IRM",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I02:T0",
          "sourceText": "l'IRM"
        },
        {
          "inventoryItemId": "inv_07",
          "linkedInventoryItemIds": [],
          "localRole": "TIMING",
          "modifiers": [],
          "normalizedLabel": "avant le geste",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I02:T0",
          "sourceText": "avant le geste"
        },
        {
          "inventoryItemId": "inv_08",
          "linkedInventoryItemIds": [
            "inv_09",
            "inv_10"
          ],
          "localRole": "MODALITY",
          "modifiers": [
            "principale"
          ],
          "normalizedLabel": "IRM principale",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I02:R1",
          "sourceText": "L'IRM principale"
        },
        {
          "inventoryItemId": "inv_09",
          "linkedInventoryItemIds": [
            "inv_08"
          ],
          "localRole": "TIMING",
          "modifiers": [],
          "normalizedLabel": "à 24 h",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I02:R1",
          "sourceText": "à 24 h"
        },
        {
          "inventoryItemId": "inv_10",
          "linkedInventoryItemIds": [
            "inv_08"
          ],
          "localRole": "TIMING",
          "modifiers": [],
          "normalizedLabel": "à J7",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I02:R1",
          "sourceText": "à J7"
        },
        {
          "inventoryItemId": "inv_11",
          "linkedInventoryItemIds": [],
          "localRole": "CONSTRAINT",
          "modifiers": [
            "souvent pas"
          ],
          "normalizedLabel": "absence fréquente d'IRM avant la thrombectomie",
          "polarity": "NEGATED",
          "sourceMessageId": "I02:R1",
          "sourceText": "Je n'ai souvent pas d'IRM avant la thrombectomie"
        }
      ],
      "explicitRelations": [
        {
          "inventoryRelationId": "rel_inv_01",
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "inv_03",
          "sourceMessageId": "I02:T0",
          "sourceText": "l'OEF se normalise quand la perfusion s'améliore",
          "targetInventoryItemId": "inv_04"
        },
        {
          "inventoryRelationId": "rel_inv_02",
          "normalizedRelation": "REPEATED_AT",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "inv_06",
          "sourceMessageId": "I02:T0",
          "sourceText": "l'IRM avant le geste",
          "targetInventoryItemId": "inv_07"
        },
        {
          "inventoryRelationId": "rel_inv_03",
          "normalizedRelation": "REPEATED_AT",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "inv_08",
          "sourceMessageId": "I02:R1",
          "sourceText": "L'IRM principale est à 24 h",
          "targetInventoryItemId": "inv_09"
        },
        {
          "inventoryRelationId": "rel_inv_04",
          "normalizedRelation": "REPEATED_AT",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "inv_08",
          "sourceMessageId": "I02:R1",
          "sourceText": "L'IRM principale est à 24 h puis à J7.",
          "targetInventoryItemId": "inv_10"
        }
      ]
    },
    "semanticWarnings": [
      "DETERMINISTIC_INVENTORY_RELATION_SOURCE_SPAN_DERIVED:1"
    ],
    "summaryForUser": "Prise en compte des précisions sur les délais de l'IRM (à 24 h puis à J7) et la confirmation de l'absence fréquente d'IRM avant la thrombectomie.",
    "unknowns": []
  },
  "model": {
    "acceptanceRecord": null,
    "acceptedAt": null,
    "ambiguities": [],
    "clarificationCandidates": [],
    "contradictions": [],
    "conversationMessageIds": [
      "I02:T0",
      "I02:R1"
    ],
    "createdAt": "2026-08-14T08:51:52.931Z",
    "critic": {
      "issues": [],
      "summary": "Single-pass deterministic reports complete; no semantic critic was executed.",
      "verdict": "ACCEPT"
    },
    "digest": "ke1-520f76ec2a61da50",
    "elements": [
      {
        "canonicalMeaning": "Patients who have undergone thrombectomy",
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
        "polarity": "AFFIRMED",
        "provenance": {
          "messageId": "I02:T0",
          "providerCallId": "gemini-call:ke1-c60033b8346a4594",
          "rawElementId": "elem_01",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-05a15b7bdd2783c7",
        "sourceSpan": {
          "end": 33,
          "messageId": "I02:T0",
          "start": 5,
          "text": "les patients thrombectomisés"
        },
        "studyRole": "SUBJECT",
        "supersedesElementIds": [],
        "type": "POPULATION",
        "version": 2
      },
      {
        "canonicalMeaning": "At day 7",
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
          "messageId": "I02:R1",
          "providerCallId": "gemini-call:ke1-c60033b8346a4594",
          "rawElementId": "elem_10",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-db661ef934f04f85"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-285d41b486d85c30",
        "sourceSpan": {
          "end": 37,
          "messageId": "I02:R1",
          "start": 33,
          "text": "à J7"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "TIMING",
        "version": 1
      },
      {
        "canonicalMeaning": "At 24 hours",
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
          "messageId": "I02:R1",
          "providerCallId": "gemini-call:ke1-c60033b8346a4594",
          "rawElementId": "elem_09",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-9bacd885cb178a49"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-353c7f527c04db0e",
        "sourceSpan": {
          "end": 27,
          "messageId": "I02:R1",
          "start": 21,
          "text": "à 24 h"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "TIMING",
        "version": 1
      },
      {
        "canonicalMeaning": "Magnetic Resonance Imaging",
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
          "messageId": "I02:T0",
          "providerCallId": "gemini-call:ke1-c60033b8346a4594",
          "rawElementId": "elem_06",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-380ace2027411ec4"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-3944579344f8e407",
        "sourceSpan": {
          "end": 134,
          "messageId": "I02:T0",
          "start": 129,
          "text": "l'IRM"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "MODALITY",
        "version": 2
      },
      {
        "canonicalMeaning": "MRI is not always available before the procedure",
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
        "polarity": "NEGATED",
        "provenance": {
          "messageId": "I02:T0",
          "providerCallId": "gemini-call:ke1-c60033b8346a4594",
          "rawElementId": "elem_05",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-5e5eb6731d9a58a7",
        "sourceSpan": {
          "end": 149,
          "messageId": "I02:T0",
          "start": 108,
          "text": "je n'ai pas toujours l'IRM avant le geste"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONSTRAINT",
        "version": 2
      },
      {
        "canonicalMeaning": "Main Magnetic Resonance Imaging",
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
          "messageId": "I02:R1",
          "providerCallId": "gemini-call:ke1-c60033b8346a4594",
          "rawElementId": "elem_08",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-9bacd885cb178a49",
          "sem-relation:ke1-db661ef934f04f85"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-68dc9d62c1485c16",
        "sourceSpan": {
          "end": 16,
          "messageId": "I02:R1",
          "start": 0,
          "text": "L'IRM principale"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "MODALITY",
        "version": 1
      },
      {
        "canonicalMeaning": "Desire to know/evaluate a scientific relation",
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
          "messageId": "I02:T0",
          "providerCallId": "gemini-call:ke1-c60033b8346a4594",
          "rawElementId": "elem_02",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-726e7278f4c17f3c",
        "sourceSpan": {
          "end": 52,
          "messageId": "I02:T0",
          "start": 43,
          "text": "savoir si"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_INTENT",
        "version": 2
      },
      {
        "canonicalMeaning": "Before the procedure/gesture",
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
          "messageId": "I02:T0",
          "providerCallId": "gemini-call:ke1-c60033b8346a4594",
          "rawElementId": "elem_07",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-380ace2027411ec4"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-bd322dd7c1f71d83",
        "sourceSpan": {
          "end": 149,
          "messageId": "I02:T0",
          "start": 135,
          "text": "avant le geste"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "TIMING",
        "version": 2
      },
      {
        "canonicalMeaning": "Oxygen Extraction Fraction normalization",
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
          "messageId": "I02:T0",
          "providerCallId": "gemini-call:ke1-c60033b8346a4594",
          "rawElementId": "elem_03",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-0f8fa4a3bff1d737"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-ca3c9fc2f04f73ce",
        "sourceSpan": {
          "end": 71,
          "messageId": "I02:T0",
          "start": 53,
          "text": "l'OEF se normalise"
        },
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "BIOMARKER",
        "version": 2
      },
      {
        "canonicalMeaning": "Often no MRI before thrombectomy",
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
        "polarity": "NEGATED",
        "provenance": {
          "messageId": "I02:R1",
          "providerCallId": "gemini-call:ke1-c60033b8346a4594",
          "rawElementId": "elem_11",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-f405a71461aaabe8",
        "sourceSpan": {
          "end": 87,
          "messageId": "I02:R1",
          "start": 39,
          "text": "Je n'ai souvent pas d'IRM avant la thrombectomie"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONSTRAINT",
        "version": 1
      },
      {
        "canonicalMeaning": "Perfusion improvement",
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
          "messageId": "I02:T0",
          "providerCallId": "gemini-call:ke1-c60033b8346a4594",
          "rawElementId": "elem_04",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-0f8fa4a3bff1d737"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-fb88eb7580e85d11",
        "sourceSpan": {
          "end": 101,
          "messageId": "I02:T0",
          "start": 78,
          "text": "la perfusion s'améliore"
        },
        "studyRole": "MEASUREMENT",
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
      "executedAt": "2026-08-14T08:52:32.226Z",
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
            "canonicalMeaning": "Patients who have undergone thrombectomy",
            "clientElementId": "elem_01",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_01"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I02:T0",
            "sourceText": "les patients thrombectomisés",
            "studyRole": "SUBJECT",
            "supersedesElementIds": [],
            "type": "POPULATION"
          },
          {
            "canonicalMeaning": "Desire to know/evaluate a scientific relation",
            "clientElementId": "elem_02",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_02"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I02:T0",
            "sourceText": "savoir si",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "SCIENTIFIC_INTENT"
          },
          {
            "canonicalMeaning": "Oxygen Extraction Fraction normalization",
            "clientElementId": "elem_03",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_03"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I02:T0",
            "sourceText": "l'OEF se normalise",
            "studyRole": "MEASUREMENT",
            "supersedesElementIds": [],
            "type": "BIOMARKER"
          },
          {
            "canonicalMeaning": "Perfusion improvement",
            "clientElementId": "elem_04",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_04"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I02:T0",
            "sourceText": "la perfusion s'améliore",
            "studyRole": "MEASUREMENT",
            "supersedesElementIds": [],
            "type": "BIOMARKER"
          },
          {
            "canonicalMeaning": "MRI is not always available before the procedure",
            "clientElementId": "elem_05",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_05"
            ],
            "polarity": "NEGATED",
            "requiresConfirmation": false,
            "sourceMessageId": "I02:T0",
            "sourceText": "je n'ai pas toujours l'IRM avant le geste",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "CONSTRAINT"
          },
          {
            "canonicalMeaning": "Magnetic Resonance Imaging",
            "clientElementId": "elem_06",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_06"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I02:T0",
            "sourceText": "l'IRM",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "MODALITY"
          },
          {
            "canonicalMeaning": "Before the procedure/gesture",
            "clientElementId": "elem_07",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_07"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I02:T0",
            "sourceText": "avant le geste",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "TIMING"
          },
          {
            "canonicalMeaning": "Main Magnetic Resonance Imaging",
            "clientElementId": "elem_08",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_08"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I02:R1",
            "sourceText": "L'IRM principale",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "MODALITY"
          },
          {
            "canonicalMeaning": "At 24 hours",
            "clientElementId": "elem_09",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_09"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I02:R1",
            "sourceText": "à 24 h",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "TIMING"
          },
          {
            "canonicalMeaning": "At day 7",
            "clientElementId": "elem_10",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_10"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I02:R1",
            "sourceText": "à J7",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "TIMING"
          },
          {
            "canonicalMeaning": "Often no MRI before thrombectomy",
            "clientElementId": "elem_11",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv_11"
            ],
            "polarity": "NEGATED",
            "requiresConfirmation": false,
            "sourceMessageId": "I02:R1",
            "sourceText": "Je n'ai souvent pas d'IRM avant la thrombectomie",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "CONSTRAINT"
          }
        ],
        "ellipses": [],
        "knowledgeRequests": [],
        "language": "fr",
        "missingConcepts": [],
        "normalizedMeaning": "Evaluation de la normalisation de l'OEF en fonction de l'amelioration de la perfusion chez les patients thrombectomises, avec des examens IRM principaux a 24h et J7 et l'absence frequente d'IRM avant le geste.",
        "relations": [
          {
            "clientRelationId": "rel_01",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "rel_inv_01"
            ],
            "polarity": "AFFIRMED",
            "relationType": "RELATED_TO_CANDIDATE",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem_03",
            "targetClientElementId": "elem_04"
          },
          {
            "clientRelationId": "rel_02",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "rel_inv_02"
            ],
            "polarity": "AFFIRMED",
            "relationType": "REPEATED_AT",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem_06",
            "targetClientElementId": "elem_07"
          },
          {
            "clientRelationId": "rel_03",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "rel_inv_03"
            ],
            "polarity": "AFFIRMED",
            "relationType": "REPEATED_AT",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem_08",
            "targetClientElementId": "elem_09"
          },
          {
            "clientRelationId": "rel_04",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "rel_inv_04"
            ],
            "polarity": "AFFIRMED",
            "relationType": "REPEATED_AT",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem_08",
            "targetClientElementId": "elem_10"
          }
        ],
        "routeProposal": {
          "confidence": 0.95,
          "expectedCapabilities": [
            "Define study population",
            "Specify imaging timelines",
            "Handle missing baseline data constraints"
          ],
          "reason": "The user is framing a clinical research question involving patient population, biomarkers, timings, and procedural constraints, which fits study design.",
          "route": "DESIGN_STUDY"
        },
        "semanticInventory": {
          "explicitFragments": [
            {
              "inventoryItemId": "inv_01",
              "linkedInventoryItemIds": [],
              "localRole": "SUBJECT",
              "modifiers": [],
              "normalizedLabel": "patients thrombectomisés",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I02:T0",
              "sourceText": "les patients thrombectomisés"
            },
            {
              "inventoryItemId": "inv_02",
              "linkedInventoryItemIds": [],
              "localRole": "INTENT",
              "modifiers": [],
              "normalizedLabel": "savoir si",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I02:T0",
              "sourceText": "savoir si"
            },
            {
              "inventoryItemId": "inv_03",
              "linkedInventoryItemIds": [
                "inv_04"
              ],
              "localRole": "MEASUREMENT",
              "modifiers": [],
              "normalizedLabel": "normalisation de l'OEF",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I02:T0",
              "sourceText": "l'OEF se normalise"
            },
            {
              "inventoryItemId": "inv_04",
              "linkedInventoryItemIds": [
                "inv_03"
              ],
              "localRole": "MEASUREMENT",
              "modifiers": [],
              "normalizedLabel": "amélioration de la perfusion",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I02:T0",
              "sourceText": "la perfusion s'améliore"
            },
            {
              "inventoryItemId": "inv_05",
              "linkedInventoryItemIds": [
                "inv_06",
                "inv_07"
              ],
              "localRole": "CONSTRAINT",
              "modifiers": [
                "pas toujours"
              ],
              "normalizedLabel": "absence fréquente d'IRM avant le geste",
              "polarity": "NEGATED",
              "sourceMessageId": "I02:T0",
              "sourceText": "je n'ai pas toujours l'IRM avant le geste"
            },
            {
              "inventoryItemId": "inv_06",
              "linkedInventoryItemIds": [],
              "localRole": "MODALITY",
              "modifiers": [],
              "normalizedLabel": "IRM",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I02:T0",
              "sourceText": "l'IRM"
            },
            {
              "inventoryItemId": "inv_07",
              "linkedInventoryItemIds": [],
              "localRole": "TIMING",
              "modifiers": [],
              "normalizedLabel": "avant le geste",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I02:T0",
              "sourceText": "avant le geste"
            },
            {
              "inventoryItemId": "inv_08",
              "linkedInventoryItemIds": [
                "inv_09",
                "inv_10"
              ],
              "localRole": "MODALITY",
              "modifiers": [
                "principale"
              ],
              "normalizedLabel": "IRM principale",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I02:R1",
              "sourceText": "L'IRM principale"
            },
            {
              "inventoryItemId": "inv_09",
              "linkedInventoryItemIds": [
                "inv_08"
              ],
              "localRole": "TIMING",
              "modifiers": [],
              "normalizedLabel": "à 24 h",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I02:R1",
              "sourceText": "à 24 h"
            },
            {
              "inventoryItemId": "inv_10",
              "linkedInventoryItemIds": [
                "inv_08"
              ],
              "localRole": "TIMING",
              "modifiers": [],
              "normalizedLabel": "à J7",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I02:R1",
              "sourceText": "à J7"
            },
            {
              "inventoryItemId": "inv_11",
              "linkedInventoryItemIds": [],
              "localRole": "CONSTRAINT",
              "modifiers": [
                "souvent pas"
              ],
              "normalizedLabel": "absence fréquente d'IRM avant la thrombectomie",
              "polarity": "NEGATED",
              "sourceMessageId": "I02:R1",
              "sourceText": "Je n'ai souvent pas d'IRM avant la thrombectomie"
            }
          ],
          "explicitRelations": [
            {
              "inventoryRelationId": "rel_inv_01",
              "normalizedRelation": "RELATED_TO_CANDIDATE",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "inv_03",
              "sourceMessageId": "I02:T0",
              "sourceText": "l'OEF se normalise quand la perfusion s'améliore",
              "targetInventoryItemId": "inv_04"
            },
            {
              "inventoryRelationId": "rel_inv_02",
              "normalizedRelation": "REPEATED_AT",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "inv_06",
              "sourceMessageId": "I02:T0",
              "sourceText": "l'IRM avant le geste",
              "targetInventoryItemId": "inv_07"
            },
            {
              "inventoryRelationId": "rel_inv_03",
              "normalizedRelation": "REPEATED_AT",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "inv_08",
              "sourceMessageId": "I02:R1",
              "sourceText": "L'IRM principale est à 24 h",
              "targetInventoryItemId": "inv_09"
            },
            {
              "inventoryRelationId": "rel_inv_04",
              "normalizedRelation": "REPEATED_AT",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "inv_08",
              "sourceMessageId": "I02:R1",
              "sourceText": "L'IRM principale est à 24 h puis à J7.",
              "targetInventoryItemId": "inv_10"
            }
          ]
        },
        "semanticWarnings": [
          "DETERMINISTIC_INVENTORY_RELATION_SOURCE_SPAN_DERIVED:1"
        ],
        "summaryForUser": "Prise en compte des précisions sur les délais de l'IRM (à 24 h puis à J7) et la confirmation de l'absence fréquente d'IRM avant la thrombectomie.",
        "unknowns": []
      },
      "reconstructionAttempts": [
        {
          "attempt": 1,
          "category": null,
          "httpStatus": 200,
          "latencyMs": 15110,
          "outcome": "SUCCESS",
          "providerCode": null,
          "providerError": null,
          "providerStatus": null,
          "requestFinished": "2026-08-14T08:52:22.554Z",
          "requestStarted": "2026-08-14T08:52:07.444Z",
          "retryable": false
        },
        {
          "attempt": 1,
          "category": null,
          "httpStatus": 200,
          "latencyMs": 9648,
          "outcome": "SUCCESS",
          "providerCode": null,
          "providerError": null,
          "providerStatus": null,
          "requestFinished": "2026-08-14T08:52:32.219Z",
          "requestStarted": "2026-08-14T08:52:22.571Z",
          "retryable": false
        }
      ],
      "reconstructionCallId": "gemini-call:ke1-c60033b8346a4594",
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
            "elem_01"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "patients thrombectomisés",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:T0",
          "sourceText": "les patients thrombectomisés"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_02",
          "mappedClientElementIds": [
            "elem_02"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "savoir si",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:T0",
          "sourceText": "savoir si"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_03",
          "mappedClientElementIds": [
            "elem_03"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "normalisation de l'OEF",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:T0",
          "sourceText": "l'OEF se normalise"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_04",
          "mappedClientElementIds": [
            "elem_04"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "amélioration de la perfusion",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:T0",
          "sourceText": "la perfusion s'améliore"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_05",
          "mappedClientElementIds": [
            "elem_05"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "absence fréquente d'IRM avant le geste",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:T0",
          "sourceText": "je n'ai pas toujours l'IRM avant le geste"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_06",
          "mappedClientElementIds": [
            "elem_06"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "IRM",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:T0",
          "sourceText": "l'IRM"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_07",
          "mappedClientElementIds": [
            "elem_07"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "avant le geste",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:T0",
          "sourceText": "avant le geste"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_08",
          "mappedClientElementIds": [
            "elem_08"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "IRM principale",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:R1",
          "sourceText": "L'IRM principale"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_09",
          "mappedClientElementIds": [
            "elem_09"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "à 24 h",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:R1",
          "sourceText": "à 24 h"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_10",
          "mappedClientElementIds": [
            "elem_10"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "à J7",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:R1",
          "sourceText": "à J7"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv_11",
          "mappedClientElementIds": [
            "elem_11"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "absence fréquente d'IRM avant la thrombectomie",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I02:R1",
          "sourceText": "Je n'ai souvent pas d'IRM avant la thrombectomie"
        }
      ],
      "status": "COMPLETE"
    },
    "history": [
      {
        "changeReason": "Nouvelle contribution utilisateur analysée sans réécriture de l’état antérieur.",
        "changedAt": "2026-08-14T08:51:52.931Z",
        "digest": "ke1-24cc7487ce69f333",
        "modelId": "semantic-model:ke1-a50f1682b12201b6",
        "revision": 1,
        "status": "CANDIDATE"
      }
    ],
    "knowledgeRequests": [],
    "knowledgeSnapshot": null,
    "missingConcepts": [],
    "normalizedMeaning": "Evaluation de la normalisation de l'OEF en fonction de l'amelioration de la perfusion chez les patients thrombectomises, avec des examens IRM principaux a 24h et J7 et l'absence frequente d'IRM avant le geste.",
    "originalRequest": "Chez les patients thrombectomisés, je veux savoir si l'OEF se normalise quand la perfusion s'améliore, mais je n'ai pas toujours l'IRM avant le geste.",
    "previousModelId": "semantic-model:ke1-a50f1682b12201b6",
    "relationCoverageReport": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_inv_01",
          "mappedClientRelationIds": [
            "rel_01"
          ],
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv_03",
          "targetInventoryItemId": "inv_04"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_inv_02",
          "mappedClientRelationIds": [
            "rel_02"
          ],
          "normalizedRelation": "REPEATED_AT",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv_06",
          "targetInventoryItemId": "inv_07"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_inv_03",
          "mappedClientRelationIds": [
            "rel_03"
          ],
          "normalizedRelation": "REPEATED_AT",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv_08",
          "targetInventoryItemId": "inv_09"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_inv_04",
          "mappedClientRelationIds": [
            "rel_04"
          ],
          "normalizedRelation": "REPEATED_AT",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv_08",
          "targetInventoryItemId": "inv_10"
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
          "rel_inv_01"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-0f8fa4a3bff1d737",
        "sourceElementId": "sem-element:ke1-ca3c9fc2f04f73ce",
        "targetElementId": "sem-element:ke1-fb88eb7580e85d11",
        "version": 2,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_inv_02"
        ],
        "polarity": "AFFIRMED",
        "relationType": "REPEATED_AT",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-380ace2027411ec4",
        "sourceElementId": "sem-element:ke1-3944579344f8e407",
        "targetElementId": "sem-element:ke1-bd322dd7c1f71d83",
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
        "relationType": "REPEATED_AT",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-9bacd885cb178a49",
        "sourceElementId": "sem-element:ke1-68dc9d62c1485c16",
        "targetElementId": "sem-element:ke1-353c7f527c04db0e",
        "version": 1,
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
        "relationType": "REPEATED_AT",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-db661ef934f04f85",
        "sourceElementId": "sem-element:ke1-68dc9d62c1485c16",
        "targetElementId": "sem-element:ke1-285d41b486d85c30",
        "version": 1,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      }
    ],
    "revision": 2,
    "routeProposal": {
      "confidence": 0.95,
      "expectedCapabilities": [
        "Define study population",
        "Handle missing baseline data constraints",
        "Specify imaging timelines"
      ],
      "reason": "The user is framing a clinical research question involving patient population, biomarkers, timings, and procedural constraints, which fits study design.",
      "route": "DESIGN_STUDY"
    },
    "semanticModelId": "semantic-model:ke1-f7a957536b24d527",
    "semanticModelVersion": "1.1",
    "status": "CANDIDATE",
    "summaryForUser": "Prise en compte des précisions sur les délais de l'IRM (à 24 h puis à J7) et la confirmation de l'absence fréquente d'IRM avant la thrombectomie.",
    "unknowns": [],
    "updatedAt": "2026-08-14T08:52:32.226Z"
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

Evaluation de la normalisation de l'OEF en fonction de l'amelioration de la perfusion chez les patients thrombectomises, avec des examens IRM principaux a 24h et J7 et l'absence frequente d'IRM avant le geste.

Objectif scientifique produit :

Desire to know/evaluate a scientific relation

### EXPLICITEMENT DIT PAR LE CHERCHEUR

- content=Patients who have undergone thrombectomy | scientificRole=POPULATION:SUBJECT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=les patients thrombectomisés | provenanceTurnIds=["I02:T0"]
- content=At day 7 | scientificRole=TIMING:NONE | polarity=AFFIRMED | temporalContext=At day 7 | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=à J7 | provenanceTurnIds=["I02:R1"]
- content=At 24 hours | scientificRole=TIMING:NONE | polarity=AFFIRMED | temporalContext=At 24 hours | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=à 24 h | provenanceTurnIds=["I02:R1"]
- content=Magnetic Resonance Imaging | scientificRole=MODALITY:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=l'IRM | provenanceTurnIds=["I02:T0"]
- content=MRI is not always available before the procedure | scientificRole=CONSTRAINT:NONE | polarity=NEGATED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=je n'ai pas toujours l'IRM avant le geste | provenanceTurnIds=["I02:T0"]
- content=Main Magnetic Resonance Imaging | scientificRole=MODALITY:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=L'IRM principale | provenanceTurnIds=["I02:R1"]
- content=Desire to know/evaluate a scientific relation | scientificRole=SCIENTIFIC_INTENT:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=savoir si | provenanceTurnIds=["I02:T0"]
- content=Before the procedure/gesture | scientificRole=TIMING:NONE | polarity=AFFIRMED | temporalContext=Before the procedure/gesture | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=avant le geste | provenanceTurnIds=["I02:T0"]
- content=Oxygen Extraction Fraction normalization | scientificRole=BIOMARKER:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=l'OEF se normalise | provenanceTurnIds=["I02:T0"]
- content=Often no MRI before thrombectomy | scientificRole=CONSTRAINT:NONE | polarity=NEGATED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Je n'ai souvent pas d'IRM avant la thrombectomie | provenanceTurnIds=["I02:R1"]
- content=Perfusion improvement | scientificRole=BIOMARKER:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=la perfusion s'améliore | provenanceTurnIds=["I02:T0"]

### RELATIONS COMPRISES

- subject=Oxygen Extraction Fraction normalization | predicate=RELATED_TO_CANDIDATE | object=Perfusion improvement | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Magnetic Resonance Imaging | predicate=REPEATED_AT | object=Before the procedure/gesture | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Main Magnetic Resonance Imaging | predicate=REPEATED_AT | object=At 24 hours | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Main Magnetic Resonance Imaging | predicate=REPEATED_AT | object=At day 7 | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER

### CONTEXTE INFÉRÉ

- Aucun élément produit.

### CANDIDATS SCIENTIFIQUES CONTEXTUELS

- Aucun élément produit.

### NÉGATIONS / CONTRAINTES

- content=MRI is not always available before the procedure | scientificRole=CONSTRAINT:NONE | polarity=NEGATED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=je n'ai pas toujours l'IRM avant le geste | provenanceTurnIds=["I02:T0"]
- content=Often no MRI before thrombectomy | scientificRole=CONSTRAINT:NONE | polarity=NEGATED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Je n'ai souvent pas d'IRM avant la thrombectomie | provenanceTurnIds=["I02:R1"]

### TEMPORALITÉ

- content=At day 7 | scientificRole=TIMING:NONE | polarity=AFFIRMED | temporalContext=At day 7 | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=à J7 | provenanceTurnIds=["I02:R1"]
- content=At 24 hours | scientificRole=TIMING:NONE | polarity=AFFIRMED | temporalContext=At 24 hours | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=à 24 h | provenanceTurnIds=["I02:R1"]
- content=Before the procedure/gesture | scientificRole=TIMING:NONE | polarity=AFFIRMED | temporalContext=Before the procedure/gesture | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=avant le geste | provenanceTurnIds=["I02:T0"]

### AMBIGUÏTÉS

- Aucun élément produit.

### INFORMATIONS MANQUANTES

- Aucun élément produit.

### INCONNUES

- Aucun élément produit.

### CORRECTIONS / SUPERSESSIONS

- Aucun élément produit.

### OWNERSHIP / STATUT ÉPISTÉMIQUE

- content=Patients who have undergone thrombectomy | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I02:T0"]
- content=At day 7 | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I02:R1"]
- content=At 24 hours | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I02:R1"]
- content=Magnetic Resonance Imaging | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I02:T0"]
- content=MRI is not always available before the procedure | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I02:T0"]
- content=Main Magnetic Resonance Imaging | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I02:R1"]
- content=Desire to know/evaluate a scientific relation | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I02:T0"]
- content=Before the procedure/gesture | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I02:T0"]
- content=Oxygen Extraction Fraction normalization | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I02:T0"]
- content=Often no MRI before thrombectomy | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I02:R1"]
- content=Perfusion improvement | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I02:T0"]

### QUESTIONS DE CLARIFICATION CANDIDATES

- Aucun élément produit.

## MISSING STRUCTURAL GUARANTEES

- EXACT_PROVIDER_RAW_TEXT_NOT_PERSISTED; STRUCTURED_NATIVE_ARTIFACT_AVAILABLE

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
