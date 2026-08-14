# I08 — SEM_SINGLE_PASS — COMMON_TRANSCRIPT T2

## INPUT

Message utilisateur courant VERBATIM :

> Je préfère donc partir sur le T1 natif comme candidat principal, mais garder l'ECV exploratoire là où il est disponible.

Conversation précédente VERBATIM :

> I08:T0 | USER : Dans Fabry, on pense que le T1 natif pourrait être intéressant avant la fibrose, mais je n'ai pas décidé d'en faire le critère principal. À Lyon ils font aussi de l'ECV. Je veux surtout trouver un marqueur précoce qui soit utilisable dans tous les centres.
> I08:R1 | USER : Oui, tous les centres ont du T1 natif. Non, l'ECV seulement deux centres.

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/common-transcript-i08-t2-sem-single-pass.json`

```json
{
  "deterministicCoverage": {
    "explicit": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_pref_t1",
          "mappedClientElementIds": [],
          "mappedClientRelationIds": [
            "rel_client_t1_critere"
          ],
          "normalizedMeaning": "Choix du T1 natif comme candidat principal",
          "reason": "The explicit functional fragment is represented by its source-grounded direct Semantic Relation rather than by a false object node.",
          "sourceMessageId": "I08:R2",
          "sourceText": "Je préfère donc partir sur le T1 natif comme candidat principal"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_t1_pref",
          "mappedClientElementIds": [
            "elem_t1_pref_01"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "T1 natif",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:R2",
          "sourceText": "le T1 natif"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_critere_princ",
          "mappedClientElementIds": [
            "elem_critere_princ_01"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Critère principal",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:R2",
          "sourceText": "candidat principal"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_garde_ecv",
          "mappedClientElementIds": [],
          "mappedClientRelationIds": [
            "state-transition:elem_ecv_exp_01"
          ],
          "normalizedMeaning": "Utilisation exploratoire de l'ECV selon disponibilité",
          "reason": "The explicit functional fragment is represented by its source-grounded direct Semantic Relation rather than by a false object node.",
          "sourceMessageId": "I08:R2",
          "sourceText": "garder l'ECV exploratoire là où il est disponible"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_ecv_exp",
          "mappedClientElementIds": [
            "elem_ecv_exp_01"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Volume extracellulaire (ECV)",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:R2",
          "sourceText": "l'ECV"
        },
        {
          "coverageStatus": "UNRESOLVED_EXPLICIT_FRAGMENT",
          "inventoryItemId": "item_disp",
          "mappedClientElementIds": [],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Disponibilité conditionnelle",
          "reason": "The exact inventory fragment has no source-grounded typed Semantic Element mapping.",
          "sourceMessageId": "I08:R2",
          "sourceText": "là où il est disponible"
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
          "inventoryRelationId": "rel_pref_t1_critere",
          "mappedClientRelationIds": [
            "rel_client_t1_critere"
          ],
          "normalizedRelation": "SELECTED_AS",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "item_t1_pref",
          "targetInventoryItemId": "item_critere_princ"
        },
        {
          "coverageStatus": "EXPLICIT_RELATION_UNMAPPED",
          "inventoryRelationId": "rel_garde_ecv",
          "mappedClientRelationIds": [],
          "normalizedRelation": "CONDITIONAL_ON",
          "reason": "The explicit relational construction has no mapped direct Semantic Relation between elements grounded to its inventory endpoints.",
          "sourceInventoryItemId": "item_ecv_exp",
          "targetInventoryItemId": "item_disp"
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
    "ambiguities": [],
    "candidateId": "semantic-model:ke1-1ed2491dde866032",
    "clarificationCandidates": [],
    "contradictions": [],
    "elements": [
      {
        "canonicalMeaning": "T1 natif",
        "clientElementId": "elem_t1_pref_01",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_t1_pref"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I08:R2",
        "sourceText": "le T1 natif",
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [
          "sem-element:ke1-bb98f5f3e61f629f"
        ],
        "type": "BIOMARKER"
      },
      {
        "canonicalMeaning": "Candidat principal d'évaluation",
        "clientElementId": "elem_critere_princ_01",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_critere_princ"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I08:R2",
        "sourceText": "candidat principal",
        "studyRole": "OUTCOME_ROLE",
        "supersedesElementIds": [
          "sem-element:ke1-d8c9045b4f4590b7"
        ],
        "type": "ENDPOINT"
      },
      {
        "canonicalMeaning": "Volume extracellulaire (ECV) exploratoire",
        "clientElementId": "elem_ecv_exp_01",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_ecv_exp"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I08:R2",
        "sourceText": "l'ECV",
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [
          "sem-element:ke1-ac76601724e22d0b"
        ],
        "type": "BIOMARKER"
      }
    ],
    "ellipses": [],
    "knowledgeRequests": [],
    "language": "fr",
    "missingConcepts": [],
    "normalizedMeaning": "L'utilisateur choisit d'utiliser le T1 natif comme candidat principal pour l'étude dans la maladie de Fabry et de garder l'ECV de manière exploratoire là où il est disponible.",
    "relations": [
      {
        "clientRelationId": "rel_client_t1_critere",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_pref_t1_critere"
        ],
        "polarity": "AFFIRMED",
        "relationType": "SELECTED_AS",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem_t1_pref_01",
        "targetClientElementId": "elem_critere_princ_01"
      }
    ],
    "routeProposal": {
      "confidence": 0.95,
      "expectedCapabilities": [
        "STUDY_DESIGN_BUILDER",
        "ENDPOINT_SELECTION"
      ],
      "reason": "L'utilisateur finalise le choix du critère principal de son étude et précise la gestion des mesures secondaires.",
      "route": "DESIGN_STUDY"
    },
    "semanticInventory": {
      "explicitFragments": [
        {
          "inventoryItemId": "item_pref_t1",
          "linkedInventoryItemIds": [
            "item_t1_pref",
            "item_critere_princ"
          ],
          "localRole": "action",
          "modifiers": [],
          "normalizedLabel": "Choix du T1 natif comme candidat principal",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I08:R2",
          "sourceText": "Je préfère donc partir sur le T1 natif comme candidat principal"
        },
        {
          "inventoryItemId": "item_t1_pref",
          "linkedInventoryItemIds": [],
          "localRole": "biomarker",
          "modifiers": [],
          "normalizedLabel": "T1 natif",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I08:R2",
          "sourceText": "le T1 natif"
        },
        {
          "inventoryItemId": "item_critere_princ",
          "linkedInventoryItemIds": [],
          "localRole": "endpoint",
          "modifiers": [],
          "normalizedLabel": "Critère principal",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I08:R2",
          "sourceText": "candidat principal"
        },
        {
          "inventoryItemId": "item_garde_ecv",
          "linkedInventoryItemIds": [
            "item_ecv_exp",
            "item_disp"
          ],
          "localRole": "action",
          "modifiers": [],
          "normalizedLabel": "Utilisation exploratoire de l'ECV selon disponibilité",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I08:R2",
          "sourceText": "garder l'ECV exploratoire là où il est disponible"
        },
        {
          "inventoryItemId": "item_ecv_exp",
          "linkedInventoryItemIds": [],
          "localRole": "biomarker",
          "modifiers": [
            "exploratoire"
          ],
          "normalizedLabel": "Volume extracellulaire (ECV)",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I08:R2",
          "sourceText": "l'ECV"
        },
        {
          "inventoryItemId": "item_disp",
          "linkedInventoryItemIds": [],
          "localRole": "modifier",
          "modifiers": [],
          "normalizedLabel": "Disponibilité conditionnelle",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I08:R2",
          "sourceText": "là où il est disponible"
        }
      ],
      "explicitRelations": [
        {
          "inventoryRelationId": "rel_pref_t1_critere",
          "normalizedRelation": "SELECTED_AS",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "item_t1_pref",
          "sourceMessageId": "I08:R2",
          "sourceText": "Je préfère donc partir sur le T1 natif comme candidat principal",
          "targetInventoryItemId": "item_critere_princ"
        },
        {
          "inventoryRelationId": "rel_garde_ecv",
          "normalizedRelation": "CONDITIONAL_ON",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "item_ecv_exp",
          "sourceMessageId": "I08:R2",
          "sourceText": "garder l'ECV exploratoire là où il est disponible",
          "targetInventoryItemId": "item_disp"
        }
      ]
    },
    "semanticWarnings": [],
    "summaryForUser": "Vous retenez le T1 natif comme critère principal et l'ECV de façon exploratoire selon sa disponibilité.",
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
      "I08:R1",
      "I08:R2"
    ],
    "createdAt": "2026-08-14T09:06:50.372Z",
    "critic": {
      "issues": [],
      "summary": "Single-pass deterministic reports incomplete; no semantic critic or repair was executed.",
      "verdict": "CLARIFICATION_REQUIRED"
    },
    "digest": "ke1-48adae658980f019",
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
        "relationships": [],
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
        "version": 3
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
        "relationships": [],
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
        "version": 3
      },
      {
        "canonicalMeaning": "Candidat principal d'évaluation",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_critere_princ"
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
          "messageId": "I08:R2",
          "providerCallId": "gemini-call:ke1-c3a95d69ee4b1ded",
          "rawElementId": "elem_critere_princ_01",
          "source": "USER_CORRECTION"
        },
        "relationships": [
          "sem-relation:ke1-1dddfec6ab4de59a"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-3e82291c9abfe830",
        "sourceSpan": {
          "end": 63,
          "messageId": "I08:R2",
          "start": 45,
          "text": "candidat principal"
        },
        "studyRole": "OUTCOME_ROLE",
        "supersedesElementIds": [
          "sem-element:ke1-d8c9045b4f4590b7"
        ],
        "type": "ENDPOINT",
        "version": 1
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
          "source": "DETERMINISTIC_CARRY_FORWARD"
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
        "version": 2
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
        "version": 3
      },
      {
        "canonicalMeaning": "Volume extracellulaire (ECV) exploratoire",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_ecv_exp"
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
          "messageId": "I08:R2",
          "providerCallId": "gemini-call:ke1-c3a95d69ee4b1ded",
          "rawElementId": "elem_ecv_exp_01",
          "source": "USER_CORRECTION"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-949a9727569cdbc3",
        "sourceSpan": {
          "end": 82,
          "messageId": "I08:R2",
          "start": 77,
          "text": "l'ECV"
        },
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [
          "sem-element:ke1-ac76601724e22d0b"
        ],
        "type": "BIOMARKER",
        "version": 1
      },
      {
        "canonicalMeaning": "Volume extracellulaire (ECV)",
        "confidence": 1,
        "epistemicStatus": "REJECTED_BY_USER",
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
          "source": "USER_CORRECTION"
        },
        "relationships": [],
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
        "version": 3
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
        "relationships": [],
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
        "version": 3
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
          "source": "DETERMINISTIC_CARRY_FORWARD"
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
        "version": 2
      },
      {
        "canonicalMeaning": "T1 natif",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "item_t1_pref"
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
          "messageId": "I08:R2",
          "providerCallId": "gemini-call:ke1-c3a95d69ee4b1ded",
          "rawElementId": "elem_t1_pref_01",
          "source": "USER_CORRECTION"
        },
        "relationships": [
          "sem-relation:ke1-1dddfec6ab4de59a"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-bb98f5f3e61f629f",
        "sourceSpan": {
          "end": 38,
          "messageId": "I08:R2",
          "start": 27,
          "text": "le T1 natif"
        },
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [
          "sem-element:ke1-bb98f5f3e61f629f"
        ],
        "type": "BIOMARKER",
        "version": 3
      },
      {
        "canonicalMeaning": "Critère principal d'évaluation",
        "confidence": 1,
        "epistemicStatus": "REJECTED_BY_USER",
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
          "source": "USER_CORRECTION"
        },
        "relationships": [],
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
        "version": 3
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
        "version": 3
      }
    ],
    "ellipses": [],
    "executionSnapshot": {
      "criticAttempts": [],
      "criticCallId": "deterministic-no-critic",
      "criticCallIds": [],
      "criticPromptVersion": "SEM-001-CRITIC-1.6",
      "executedAt": "2026-08-14T09:08:44.866Z",
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
        "candidateId": "semantic-model:ke1-1ed2491dde866032",
        "clarificationCandidates": [],
        "contradictions": [],
        "elements": [
          {
            "canonicalMeaning": "T1 natif",
            "clientElementId": "elem_t1_pref_01",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "item_t1_pref"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I08:R2",
            "sourceText": "le T1 natif",
            "studyRole": "MEASUREMENT",
            "supersedesElementIds": [
              "sem-element:ke1-bb98f5f3e61f629f"
            ],
            "type": "BIOMARKER"
          },
          {
            "canonicalMeaning": "Candidat principal d'évaluation",
            "clientElementId": "elem_critere_princ_01",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "item_critere_princ"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I08:R2",
            "sourceText": "candidat principal",
            "studyRole": "OUTCOME_ROLE",
            "supersedesElementIds": [
              "sem-element:ke1-d8c9045b4f4590b7"
            ],
            "type": "ENDPOINT"
          },
          {
            "canonicalMeaning": "Volume extracellulaire (ECV) exploratoire",
            "clientElementId": "elem_ecv_exp_01",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "item_ecv_exp"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I08:R2",
            "sourceText": "l'ECV",
            "studyRole": "MEASUREMENT",
            "supersedesElementIds": [
              "sem-element:ke1-ac76601724e22d0b"
            ],
            "type": "BIOMARKER"
          }
        ],
        "ellipses": [],
        "knowledgeRequests": [],
        "language": "fr",
        "missingConcepts": [],
        "normalizedMeaning": "L'utilisateur choisit d'utiliser le T1 natif comme candidat principal pour l'étude dans la maladie de Fabry et de garder l'ECV de manière exploratoire là où il est disponible.",
        "relations": [
          {
            "clientRelationId": "rel_client_t1_critere",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "rel_pref_t1_critere"
            ],
            "polarity": "AFFIRMED",
            "relationType": "SELECTED_AS",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem_t1_pref_01",
            "targetClientElementId": "elem_critere_princ_01"
          }
        ],
        "routeProposal": {
          "confidence": 0.95,
          "expectedCapabilities": [
            "STUDY_DESIGN_BUILDER",
            "ENDPOINT_SELECTION"
          ],
          "reason": "L'utilisateur finalise le choix du critère principal de son étude et précise la gestion des mesures secondaires.",
          "route": "DESIGN_STUDY"
        },
        "semanticInventory": {
          "explicitFragments": [
            {
              "inventoryItemId": "item_pref_t1",
              "linkedInventoryItemIds": [
                "item_t1_pref",
                "item_critere_princ"
              ],
              "localRole": "action",
              "modifiers": [],
              "normalizedLabel": "Choix du T1 natif comme candidat principal",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I08:R2",
              "sourceText": "Je préfère donc partir sur le T1 natif comme candidat principal"
            },
            {
              "inventoryItemId": "item_t1_pref",
              "linkedInventoryItemIds": [],
              "localRole": "biomarker",
              "modifiers": [],
              "normalizedLabel": "T1 natif",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I08:R2",
              "sourceText": "le T1 natif"
            },
            {
              "inventoryItemId": "item_critere_princ",
              "linkedInventoryItemIds": [],
              "localRole": "endpoint",
              "modifiers": [],
              "normalizedLabel": "Critère principal",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I08:R2",
              "sourceText": "candidat principal"
            },
            {
              "inventoryItemId": "item_garde_ecv",
              "linkedInventoryItemIds": [
                "item_ecv_exp",
                "item_disp"
              ],
              "localRole": "action",
              "modifiers": [],
              "normalizedLabel": "Utilisation exploratoire de l'ECV selon disponibilité",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I08:R2",
              "sourceText": "garder l'ECV exploratoire là où il est disponible"
            },
            {
              "inventoryItemId": "item_ecv_exp",
              "linkedInventoryItemIds": [],
              "localRole": "biomarker",
              "modifiers": [
                "exploratoire"
              ],
              "normalizedLabel": "Volume extracellulaire (ECV)",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I08:R2",
              "sourceText": "l'ECV"
            },
            {
              "inventoryItemId": "item_disp",
              "linkedInventoryItemIds": [],
              "localRole": "modifier",
              "modifiers": [],
              "normalizedLabel": "Disponibilité conditionnelle",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I08:R2",
              "sourceText": "là où il est disponible"
            }
          ],
          "explicitRelations": [
            {
              "inventoryRelationId": "rel_pref_t1_critere",
              "normalizedRelation": "SELECTED_AS",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "item_t1_pref",
              "sourceMessageId": "I08:R2",
              "sourceText": "Je préfère donc partir sur le T1 natif comme candidat principal",
              "targetInventoryItemId": "item_critere_princ"
            },
            {
              "inventoryRelationId": "rel_garde_ecv",
              "normalizedRelation": "CONDITIONAL_ON",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "item_ecv_exp",
              "sourceMessageId": "I08:R2",
              "sourceText": "garder l'ECV exploratoire là où il est disponible",
              "targetInventoryItemId": "item_disp"
            }
          ]
        },
        "semanticWarnings": [],
        "summaryForUser": "Vous retenez le T1 natif comme critère principal et l'ECV de façon exploratoire selon sa disponibilité.",
        "unknowns": []
      },
      "reconstructionAttempts": [
        {
          "attempt": 1,
          "category": null,
          "httpStatus": 200,
          "latencyMs": 4227,
          "outcome": "SUCCESS",
          "providerCode": null,
          "providerError": null,
          "providerStatus": null,
          "requestFinished": "2026-08-14T09:08:25.700Z",
          "requestStarted": "2026-08-14T09:08:21.473Z",
          "retryable": false
        },
        {
          "attempt": 1,
          "category": null,
          "httpStatus": 200,
          "latencyMs": 13488,
          "outcome": "SUCCESS",
          "providerCode": null,
          "providerError": null,
          "providerStatus": null,
          "requestFinished": "2026-08-14T09:08:39.202Z",
          "requestStarted": "2026-08-14T09:08:25.714Z",
          "retryable": false
        },
        {
          "attempt": 1,
          "category": null,
          "httpStatus": 200,
          "latencyMs": 5657,
          "outcome": "SUCCESS",
          "providerCode": null,
          "providerError": null,
          "providerStatus": null,
          "requestFinished": "2026-08-14T09:08:44.861Z",
          "requestStarted": "2026-08-14T09:08:39.204Z",
          "retryable": false
        }
      ],
      "reconstructionCallId": "gemini-call:ke1-c3a95d69ee4b1ded",
      "reconstructionPromptVersion": "SEM-001-RECONSTRUCTION-1.6",
      "schemaVersion": "SEM-001-1.1",
      "temperature": null
    },
    "explicitCoverageReport": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_pref_t1",
          "mappedClientElementIds": [],
          "mappedClientRelationIds": [
            "rel_client_t1_critere"
          ],
          "normalizedMeaning": "Choix du T1 natif comme candidat principal",
          "reason": "The explicit functional fragment is represented by its source-grounded direct Semantic Relation rather than by a false object node.",
          "sourceMessageId": "I08:R2",
          "sourceText": "Je préfère donc partir sur le T1 natif comme candidat principal"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_t1_pref",
          "mappedClientElementIds": [
            "elem_t1_pref_01"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "T1 natif",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:R2",
          "sourceText": "le T1 natif"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_critere_princ",
          "mappedClientElementIds": [
            "elem_critere_princ_01"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Critère principal",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:R2",
          "sourceText": "candidat principal"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_garde_ecv",
          "mappedClientElementIds": [],
          "mappedClientRelationIds": [
            "state-transition:elem_ecv_exp_01"
          ],
          "normalizedMeaning": "Utilisation exploratoire de l'ECV selon disponibilité",
          "reason": "The explicit functional fragment is represented by its source-grounded direct Semantic Relation rather than by a false object node.",
          "sourceMessageId": "I08:R2",
          "sourceText": "garder l'ECV exploratoire là où il est disponible"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "item_ecv_exp",
          "mappedClientElementIds": [
            "elem_ecv_exp_01"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Volume extracellulaire (ECV)",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I08:R2",
          "sourceText": "l'ECV"
        },
        {
          "coverageStatus": "UNRESOLVED_EXPLICIT_FRAGMENT",
          "inventoryItemId": "item_disp",
          "mappedClientElementIds": [],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Disponibilité conditionnelle",
          "reason": "The exact inventory fragment has no source-grounded typed Semantic Element mapping.",
          "sourceMessageId": "I08:R2",
          "sourceText": "là où il est disponible"
        }
      ],
      "status": "INCOMPLETE"
    },
    "history": [
      {
        "changeReason": "Nouvelle contribution utilisateur analysée sans réécriture de l’état antérieur.",
        "changedAt": "2026-08-14T09:06:50.372Z",
        "digest": "ke1-c89248ba0937369e",
        "modelId": "semantic-model:ke1-969de3961c2bc49a",
        "revision": 1,
        "status": "CLARIFICATION_REQUIRED"
      },
      {
        "changeReason": "Nouvelle contribution utilisateur analysée sans réécriture de l’état antérieur.",
        "changedAt": "2026-08-14T09:07:46.259Z",
        "digest": "ke1-1e604aadd88eb6d9",
        "modelId": "semantic-model:ke1-1ed2491dde866031",
        "revision": 2,
        "status": "CANDIDATE"
      }
    ],
    "knowledgeRequests": [],
    "knowledgeSnapshot": null,
    "missingConcepts": [],
    "normalizedMeaning": "L'utilisateur choisit d'utiliser le T1 natif comme candidat principal pour l'étude dans la maladie de Fabry et de garder l'ECV de manière exploratoire là où il est disponible.",
    "originalRequest": "Dans Fabry, on pense que le T1 natif pourrait être intéressant avant la fibrose, mais je n'ai pas décidé d'en faire le critère principal. À Lyon ils font aussi de l'ECV. Je veux surtout trouver un marqueur précoce qui soit utilisable dans tous les centres.",
    "previousModelId": "semantic-model:ke1-1ed2491dde866031",
    "relationCoverageReport": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel_pref_t1_critere",
          "mappedClientRelationIds": [
            "rel_client_t1_critere"
          ],
          "normalizedRelation": "SELECTED_AS",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "item_t1_pref",
          "targetInventoryItemId": "item_critere_princ"
        },
        {
          "coverageStatus": "EXPLICIT_RELATION_UNMAPPED",
          "inventoryRelationId": "rel_garde_ecv",
          "mappedClientRelationIds": [],
          "normalizedRelation": "CONDITIONAL_ON",
          "reason": "The explicit relational construction has no mapped direct Semantic Relation between elements grounded to its inventory endpoints.",
          "sourceInventoryItemId": "item_ecv_exp",
          "targetInventoryItemId": "item_disp"
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
          "rel_t1_all_centers"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-0a2b8420e77b6ffc",
        "sourceElementId": "sem-element:ke1-85c1367a1fcdefe6",
        "targetElementId": "sem-element:ke1-85c1367a1fcdefe6",
        "version": 2,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel_pref_t1_critere"
        ],
        "polarity": "AFFIRMED",
        "relationType": "SELECTED_AS",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-1dddfec6ab4de59a",
        "sourceElementId": "sem-element:ke1-bb98f5f3e61f629f",
        "targetElementId": "sem-element:ke1-3e82291c9abfe830",
        "version": 1,
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
        "version": 2,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      }
    ],
    "revision": 3,
    "routeProposal": {
      "confidence": 0.95,
      "expectedCapabilities": [
        "ENDPOINT_SELECTION",
        "STUDY_DESIGN_BUILDER"
      ],
      "reason": "L'utilisateur finalise le choix du critère principal de son étude et précise la gestion des mesures secondaires.",
      "route": "DESIGN_STUDY"
    },
    "semanticModelId": "semantic-model:ke1-c293296bc5a6d59f",
    "semanticModelVersion": "1.1",
    "status": "CLARIFICATION_REQUIRED",
    "summaryForUser": "Vous retenez le T1 natif comme critère principal et l'ECV de façon exploratoire selon sa disponibilité.",
    "unknowns": [],
    "updatedAt": "2026-08-14T09:08:44.866Z"
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

L'utilisateur choisit d'utiliser le T1 natif comme candidat principal pour l'étude dans la maladie de Fabry et de garder l'ECV de manière exploratoire là où il est disponible.

Objectif scientifique produit :

L'utilisateur choisit d'utiliser le T1 natif comme candidat principal pour l'étude dans la maladie de Fabry et de garder l'ECV de manière exploratoire là où il est disponible.

### EXPLICITEMENT DIT PAR LE CHERCHEUR

- content=Avant le stade de fibrose | scientificRole=TIMING:NONE | polarity=AFFIRMED | temporalContext=Avant le stade de fibrose | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=la fibrose | provenanceTurnIds=["I08:T0"]
- content=Centre de Lyon | scientificRole=STUDY_DESIGN:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Lyon | provenanceTurnIds=["I08:T0"]
- content=Candidat principal d'évaluation | scientificRole=ENDPOINT:OUTCOME_ROLE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=candidat principal | provenanceTurnIds=["I08:R2"]
- content=Disponibilité du T1 natif dans tous les centres | scientificRole=BIOMARKER:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=tous les centres ont du T1 natif | provenanceTurnIds=["I08:R1"]
- content=Applicabilité multicentrique (tous les centres) | scientificRole=STUDY_DESIGN:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=tous les centres | provenanceTurnIds=["I08:T0"]
- content=Volume extracellulaire (ECV) exploratoire | scientificRole=BIOMARKER:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=l'ECV | provenanceTurnIds=["I08:R2"]
- content=Maladie de Fabry | scientificRole=CONDITION:SUBJECT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Fabry | provenanceTurnIds=["I08:T0"]
- content=Disponibilité de l'ECV dans seulement deux centres | scientificRole=BIOMARKER:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=l'ECV seulement deux centres | provenanceTurnIds=["I08:R1"]
- content=T1 natif | scientificRole=BIOMARKER:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=le T1 natif | provenanceTurnIds=["I08:R2"]
- content=Marqueur précoce | scientificRole=BIOMARKER:OUTCOME_ROLE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=marqueur précoce | provenanceTurnIds=["I08:T0"]

### RELATIONS COMPRISES

- subject=Disponibilité du T1 natif dans tous les centres | predicate=RELATED_TO_CANDIDATE | object=Disponibilité du T1 natif dans tous les centres | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=T1 natif | predicate=SELECTED_AS | object=Candidat principal d'évaluation | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Disponibilité de l'ECV dans seulement deux centres | predicate=RELATED_TO_CANDIDATE | object=Disponibilité de l'ECV dans seulement deux centres | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER

### CONTEXTE INFÉRÉ

- Aucun élément produit.

### CANDIDATS SCIENTIFIQUES CONTEXTUELS

- Aucun élément produit.

### NÉGATIONS / CONTRAINTES

- Aucun élément produit.

### TEMPORALITÉ

- content=Avant le stade de fibrose | scientificRole=TIMING:NONE | polarity=AFFIRMED | temporalContext=Avant le stade de fibrose | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=la fibrose | provenanceTurnIds=["I08:T0"]

### AMBIGUÏTÉS

- Aucun élément produit.

### INFORMATIONS MANQUANTES

- Aucun élément produit.

### INCONNUES

- Aucun élément produit.

### CORRECTIONS / SUPERSESSIONS

- previousContent=Critère principal d'évaluation | currentContent=Candidat principal d'évaluation | provenanceTurnIds=["I08:R2"] | disposition=SUPERSEDED
- previousContent=Volume extracellulaire (ECV) | currentContent=Volume extracellulaire (ECV) exploratoire | provenanceTurnIds=["I08:R2"] | disposition=SUPERSEDED
- previousContent=Volume extracellulaire (ECV) | currentContent=Volume extracellulaire (ECV) | provenanceTurnIds=["I08:T0"] | disposition=REJECTED
- previousContent=T1 natif | currentContent=T1 natif | provenanceTurnIds=["I08:R2"] | disposition=SUPERSEDED
- previousContent=Critère principal d'évaluation | currentContent=Critère principal d'évaluation | provenanceTurnIds=["I08:T0"] | disposition=REJECTED

### OWNERSHIP / STATUT ÉPISTÉMIQUE

- content=Avant le stade de fibrose | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:T0"]
- content=Centre de Lyon | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:T0"]
- content=Candidat principal d'évaluation | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:R2"]
- content=Disponibilité du T1 natif dans tous les centres | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:R1"]
- content=Applicabilité multicentrique (tous les centres) | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:T0"]
- content=Volume extracellulaire (ECV) exploratoire | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:R2"]
- content=Maladie de Fabry | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:T0"]
- content=Disponibilité de l'ECV dans seulement deux centres | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:R1"]
- content=T1 natif | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:R2"]
- content=Marqueur précoce | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I08:T0"]

### QUESTIONS DE CLARIFICATION CANDIDATES

- Aucun élément produit.

## MISSING STRUCTURAL GUARANTEES

- EXACT_PROVIDER_RAW_TEXT_NOT_PERSISTED; STRUCTURED_NATIVE_ARTIFACT_AVAILABLE

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
