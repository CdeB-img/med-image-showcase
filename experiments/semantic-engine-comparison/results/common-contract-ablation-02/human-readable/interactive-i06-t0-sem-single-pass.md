# I06 — SEM_SINGLE_PASS — INTERACTIVE T0

## INPUT

Message utilisateur courant VERBATIM :

> Je compare DSC et ASL chez mes gliomes. Quand elles ne racontent pas la même chose, je veux savoir laquelle est la plus utile pour la progression. Pour ceux qui n'ont que la seconde, je préfère quand même les garder si c'est possible.

Conversation précédente VERBATIM :

> —

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/interactive-i06-t0-sem-single-pass.json`

```json
{
  "deterministicCoverage": {
    "explicit": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "F01",
          "mappedClientElementIds": [
            "E01"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "DSC",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "DSC"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "F02",
          "mappedClientElementIds": [
            "E02"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "ASL",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "ASL"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "F03",
          "mappedClientElementIds": [
            "E03"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "gliomes",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "gliomes"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "F04",
          "mappedClientElementIds": [
            "E04"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "progression",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "progression"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "F05",
          "mappedClientElementIds": [
            "E05"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "utilité comparative",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "laquelle est la plus utile"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "F06",
          "mappedClientElementIds": [
            "E06"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "discordance",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "ne racontent pas la même chose"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "F07",
          "mappedClientElementIds": [
            "E07"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "cas avec ASL seule",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "ceux qui n'ont que la seconde"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "F08",
          "mappedClientElementIds": [
            "E08"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "conservation conditionnelle",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "les garder si c'est possible"
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
          "inventoryRelationId": "R01",
          "mappedClientRelationIds": [
            "REL01"
          ],
          "normalizedRelation": "COMPARES_WITH",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "F01",
          "targetInventoryItemId": "F02"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "R02",
          "mappedClientRelationIds": [
            "REL02"
          ],
          "normalizedRelation": "RELATED_TO_CONDITION",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "F01",
          "targetInventoryItemId": "F03"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "R03",
          "mappedClientRelationIds": [
            "REL03"
          ],
          "normalizedRelation": "RELATED_TO_CONDITION",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "F02",
          "targetInventoryItemId": "F03"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "R04",
          "mappedClientRelationIds": [
            "REL04"
          ],
          "normalizedRelation": "EVALUATES_ENDPOINT",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "F05",
          "targetInventoryItemId": "F04"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "R05",
          "mappedClientRelationIds": [
            "REL05"
          ],
          "normalizedRelation": "CONDITIONAL_INCLUSION",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "F08",
          "targetInventoryItemId": "F07"
        }
      ],
      "status": "COMPLETE"
    },
    "taxonomy": {
      "findings": [
        {
          "clientElementId": "E01",
          "code": "QUANTITATIVE_COMPARAND_TYPED_AS_METHOD",
          "currentType": "METHOD",
          "expectedStudyRole": "MEASUREMENT",
          "expectedType": "BIOMARKER",
          "reason": "The explicit phrase functions as the quantitative observable or predictor in the stated relation and does not name the procedure that produces it; the runtime SEM contract requires BIOMARKER while preserving the relation and source span."
        }
      ],
      "status": "INCOMPLETE"
    }
  },
  "initialReconstruction": {
    "ambiguities": [],
    "candidateId": "C01",
    "clarificationCandidates": [
      {
        "question": "Souhaitez-vous formaliser un critère d'évaluation formel pour mesurer la discordance entre DSC et ASL ?",
        "reason": "La gestion des cas discordants est mentionnée mais nécessite des critères opérationnels.",
        "resolvesClientElementIds": [
          "E05",
          "E06"
        ]
      }
    ],
    "contradictions": [],
    "elements": [
      {
        "canonicalMeaning": "Dynamic Susceptibility Contrast perfusion MRI",
        "clientElementId": "E01",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "F01"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
        "sourceText": "DSC",
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "METHOD"
      },
      {
        "canonicalMeaning": "Arterial Spin Labeling perfusion MRI",
        "clientElementId": "E02",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "F02"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
        "sourceText": "ASL",
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "METHOD"
      },
      {
        "canonicalMeaning": "Glioma",
        "clientElementId": "E03",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "F03"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
        "sourceText": "gliomes",
        "studyRole": "SUBJECT",
        "supersedesElementIds": [],
        "type": "CONDITION"
      },
      {
        "canonicalMeaning": "Tumor progression",
        "clientElementId": "E04",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "F04"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
        "sourceText": "progression",
        "studyRole": "OUTCOME_ROLE",
        "supersedesElementIds": [],
        "type": "ENDPOINT"
      },
      {
        "canonicalMeaning": "Comparative evaluation of method utility",
        "clientElementId": "E05",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "F05"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
        "sourceText": "laquelle est la plus utile",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "OPERATION"
      },
      {
        "canonicalMeaning": "Discordance between methods",
        "clientElementId": "E06",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "F06"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
        "sourceText": "ne racontent pas la même chose",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "PHENOMENON"
      },
      {
        "canonicalMeaning": "Patient subset having only ASL",
        "clientElementId": "E07",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "F07"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
        "sourceText": "ceux qui n'ont que la seconde",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "POPULATION"
      },
      {
        "canonicalMeaning": "Conditional inclusion of single-modality cases",
        "clientElementId": "E08",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "F08"
        ],
        "polarity": "CONDITIONAL",
        "requiresConfirmation": false,
        "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
        "sourceText": "les garder si c'est possible",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONSTRAINT"
      }
    ],
    "ellipses": [],
    "knowledgeRequests": [],
    "language": "fr",
    "missingConcepts": [],
    "normalizedMeaning": "Comparison of DSC and ASL perfusion methods in gliomas to evaluate their utility for disease progression when discordant, alongside preservation of single-modality ASL cases if possible.",
    "relations": [
      {
        "clientRelationId": "REL01",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "R01"
        ],
        "polarity": "AFFIRMED",
        "relationType": "COMPARES_WITH",
        "requiresConfirmation": false,
        "sourceClientElementId": "E01",
        "targetClientElementId": "E02"
      },
      {
        "clientRelationId": "REL02",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "R02"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CONDITION",
        "requiresConfirmation": false,
        "sourceClientElementId": "E01",
        "targetClientElementId": "E03"
      },
      {
        "clientRelationId": "REL03",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "R03"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CONDITION",
        "requiresConfirmation": false,
        "sourceClientElementId": "E02",
        "targetClientElementId": "E03"
      },
      {
        "clientRelationId": "REL04",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "R04"
        ],
        "polarity": "AFFIRMED",
        "relationType": "EVALUATES_ENDPOINT",
        "requiresConfirmation": false,
        "sourceClientElementId": "E05",
        "targetClientElementId": "E04"
      },
      {
        "clientRelationId": "REL05",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "R05"
        ],
        "polarity": "CONDITIONAL",
        "relationType": "CONDITIONAL_INCLUSION",
        "requiresConfirmation": false,
        "sourceClientElementId": "E08",
        "targetClientElementId": "E07"
      }
    ],
    "routeProposal": {
      "confidence": 0.95,
      "expectedCapabilities": [
        "Method comparison design",
        "Endpoint definition for progression",
        "Handling of discordant imaging modalities"
      ],
      "reason": "The user is setting up a comparison between diagnostic methods (DSC vs ASL) in a specific condition (gliomas) with defined endpoints and inclusion constraints.",
      "route": "DESIGN_STUDY"
    },
    "semanticInventory": {
      "explicitFragments": [
        {
          "inventoryItemId": "F01",
          "linkedInventoryItemIds": [],
          "localRole": "subject_method",
          "modifiers": [],
          "normalizedLabel": "DSC",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "DSC"
        },
        {
          "inventoryItemId": "F02",
          "linkedInventoryItemIds": [],
          "localRole": "subject_method",
          "modifiers": [],
          "normalizedLabel": "ASL",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "ASL"
        },
        {
          "inventoryItemId": "F03",
          "linkedInventoryItemIds": [],
          "localRole": "condition",
          "modifiers": [],
          "normalizedLabel": "gliomes",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "gliomes"
        },
        {
          "inventoryItemId": "F04",
          "linkedInventoryItemIds": [],
          "localRole": "endpoint_target",
          "modifiers": [],
          "normalizedLabel": "progression",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "progression"
        },
        {
          "inventoryItemId": "F05",
          "linkedInventoryItemIds": [],
          "localRole": "evaluation",
          "modifiers": [],
          "normalizedLabel": "utilité comparative",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "laquelle est la plus utile"
        },
        {
          "inventoryItemId": "F06",
          "linkedInventoryItemIds": [],
          "localRole": "condition",
          "modifiers": [],
          "normalizedLabel": "discordance",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "ne racontent pas la même chose"
        },
        {
          "inventoryItemId": "F07",
          "linkedInventoryItemIds": [],
          "localRole": "population_subset",
          "modifiers": [],
          "normalizedLabel": "cas avec ASL seule",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "ceux qui n'ont que la seconde"
        },
        {
          "inventoryItemId": "F08",
          "linkedInventoryItemIds": [],
          "localRole": "constraint_action",
          "modifiers": [],
          "normalizedLabel": "conservation conditionnelle",
          "polarity": "CONDITIONAL",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "les garder si c'est possible"
        }
      ],
      "explicitRelations": [
        {
          "inventoryRelationId": "R01",
          "normalizedRelation": "COMPARES_WITH",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "F01",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "Je compare DSC et ASL",
          "targetInventoryItemId": "F02"
        },
        {
          "inventoryRelationId": "R02",
          "normalizedRelation": "RELATED_TO_CONDITION",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "F01",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "Je compare DSC et ASL chez mes gliomes.",
          "targetInventoryItemId": "F03"
        },
        {
          "inventoryRelationId": "R03",
          "normalizedRelation": "RELATED_TO_CONDITION",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "F02",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "Je compare DSC et ASL chez mes gliomes.",
          "targetInventoryItemId": "F03"
        },
        {
          "inventoryRelationId": "R04",
          "normalizedRelation": "EVALUATES_ENDPOINT",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "F05",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "la plus utile pour la progression",
          "targetInventoryItemId": "F04"
        },
        {
          "inventoryRelationId": "R05",
          "normalizedRelation": "CONDITIONAL_INCLUSION",
          "polarity": "CONDITIONAL",
          "sourceInventoryItemId": "F08",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "Pour ceux qui n'ont que la seconde, je préfère quand même les garder si c'est possible",
          "targetInventoryItemId": "F07"
        }
      ]
    },
    "semanticWarnings": [
      "DETERMINISTIC_INVENTORY_RELATION_SOURCE_SPAN_DERIVED:2"
    ],
    "summaryForUser": "Comparaison de la DSC et de l'ASL dans les gliomes pour évaluer leur utilité en cas de discordance vis-à-vis de la progression, avec conservation potentielle des cas ne disposant que de l'ASL.",
    "unknowns": []
  },
  "model": {
    "acceptanceRecord": null,
    "acceptedAt": null,
    "ambiguities": [
      "La mesure quantitative produite par la méthode « ASL » et utilisée comme prédicteur n'est pas explicitement nommée."
    ],
    "clarificationCandidates": [
      {
        "question": "Souhaitez-vous formaliser un critère d'évaluation formel pour mesurer la discordance entre DSC et ASL ?",
        "reason": "La gestion des cas discordants est mentionnée mais nécessite des critères opérationnels.",
        "resolvesElementIds": [
          "sem-element:ke1-4b391086bbea1622",
          "sem-element:ke1-df46ee8aeaa3e446"
        ]
      }
    ],
    "contradictions": [],
    "conversationMessageIds": [
      "I06:SEM_SINGLE_PASS:T0"
    ],
    "createdAt": "2026-08-14T09:19:21.818Z",
    "critic": {
      "issues": [],
      "summary": "Single-pass deterministic reports incomplete; no semantic critic or repair was executed.",
      "verdict": "CLARIFICATION_REQUIRED"
    },
    "digest": "ke1-46c2839e0f16aab2",
    "elements": [
      {
        "canonicalMeaning": "Tumor progression",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "F04"
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
          "messageId": "I06:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-48aeb9b820005c84",
          "rawElementId": "E04",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-3561ef74ee628be0"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-10dbd53730a263c3",
        "sourceSpan": {
          "end": 145,
          "messageId": "I06:SEM_SINGLE_PASS:T0",
          "start": 134,
          "text": "progression"
        },
        "studyRole": "OUTCOME_ROLE",
        "supersedesElementIds": [],
        "type": "ENDPOINT",
        "version": 1
      },
      {
        "canonicalMeaning": "Discordance between methods",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "F06"
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
          "messageId": "I06:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-48aeb9b820005c84",
          "rawElementId": "E06",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-4b391086bbea1622",
        "sourceSpan": {
          "end": 82,
          "messageId": "I06:SEM_SINGLE_PASS:T0",
          "start": 52,
          "text": "ne racontent pas la même chose"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "PHENOMENON",
        "version": 1
      },
      {
        "canonicalMeaning": "Arterial Spin Labeling perfusion MRI",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "F02"
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
          "messageId": "I06:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-48aeb9b820005c84",
          "rawElementId": "E02",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-26bc4a76f8fff5ca",
          "sem-relation:ke1-ec15b09382c57447"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-68c07596e614ebca",
        "sourceSpan": {
          "end": 21,
          "messageId": "I06:SEM_SINGLE_PASS:T0",
          "start": 18,
          "text": "ASL"
        },
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "METHOD",
        "version": 1
      },
      {
        "canonicalMeaning": "Patient subset having only ASL",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "F07"
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
          "messageId": "I06:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-48aeb9b820005c84",
          "rawElementId": "E07",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-423e9e6254124086"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-7e65f65b50e4c1a7",
        "sourceSpan": {
          "end": 181,
          "messageId": "I06:SEM_SINGLE_PASS:T0",
          "start": 152,
          "text": "ceux qui n'ont que la seconde"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "POPULATION",
        "version": 1
      },
      {
        "canonicalMeaning": "Glioma",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "F03"
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
          "messageId": "I06:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-48aeb9b820005c84",
          "rawElementId": "E03",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-26bc4a76f8fff5ca",
          "sem-relation:ke1-3d23ee4d3c53bea1"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-8976c0e4e1c67c20",
        "sourceSpan": {
          "end": 38,
          "messageId": "I06:SEM_SINGLE_PASS:T0",
          "start": 31,
          "text": "gliomes"
        },
        "studyRole": "SUBJECT",
        "supersedesElementIds": [],
        "type": "CONDITION",
        "version": 1
      },
      {
        "canonicalMeaning": "Conditional inclusion of single-modality cases",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "F08"
        ],
        "knowledgeSupport": {
          "assertionRefs": [],
          "checkedAt": null,
          "gapRefs": [],
          "resultRef": null,
          "status": "NOT_CHECKED"
        },
        "polarity": "CONDITIONAL",
        "provenance": {
          "messageId": "I06:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-48aeb9b820005c84",
          "rawElementId": "E08",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-423e9e6254124086"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-d4a35b092ad5faad",
        "sourceSpan": {
          "end": 233,
          "messageId": "I06:SEM_SINGLE_PASS:T0",
          "start": 205,
          "text": "les garder si c'est possible"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONSTRAINT",
        "version": 1
      },
      {
        "canonicalMeaning": "Comparative evaluation of method utility",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "F05"
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
          "messageId": "I06:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-48aeb9b820005c84",
          "rawElementId": "E05",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-3561ef74ee628be0"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-df46ee8aeaa3e446",
        "sourceSpan": {
          "end": 125,
          "messageId": "I06:SEM_SINGLE_PASS:T0",
          "start": 99,
          "text": "laquelle est la plus utile"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "OPERATION",
        "version": 1
      },
      {
        "canonicalMeaning": "Dynamic Susceptibility Contrast perfusion MRI",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "F01"
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
          "messageId": "I06:SEM_SINGLE_PASS:T0",
          "providerCallId": "gemini-call:ke1-48aeb9b820005c84",
          "rawElementId": "E01",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-3d23ee4d3c53bea1",
          "sem-relation:ke1-ec15b09382c57447"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-f2dbffbaf716bffe",
        "sourceSpan": {
          "end": 14,
          "messageId": "I06:SEM_SINGLE_PASS:T0",
          "start": 11,
          "text": "DSC"
        },
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "METHOD",
        "version": 1
      }
    ],
    "ellipses": [],
    "executionSnapshot": {
      "criticAttempts": [],
      "criticCallId": "deterministic-no-critic",
      "criticCallIds": [],
      "criticPromptVersion": "SEM-001-CRITIC-1.6",
      "executedAt": "2026-08-14T09:19:21.818Z",
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
          "La mesure quantitative produite par la méthode « ASL » et utilisée comme prédicteur n'est pas explicitement nommée."
        ],
        "candidateId": "C01",
        "clarificationCandidates": [
          {
            "question": "Souhaitez-vous formaliser un critère d'évaluation formel pour mesurer la discordance entre DSC et ASL ?",
            "reason": "La gestion des cas discordants est mentionnée mais nécessite des critères opérationnels.",
            "resolvesClientElementIds": [
              "E05",
              "E06"
            ]
          }
        ],
        "contradictions": [],
        "elements": [
          {
            "canonicalMeaning": "Dynamic Susceptibility Contrast perfusion MRI",
            "clientElementId": "E01",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "F01"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
            "sourceText": "DSC",
            "studyRole": "MEASUREMENT",
            "supersedesElementIds": [],
            "type": "METHOD"
          },
          {
            "canonicalMeaning": "Arterial Spin Labeling perfusion MRI",
            "clientElementId": "E02",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "F02"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
            "sourceText": "ASL",
            "studyRole": "MEASUREMENT",
            "supersedesElementIds": [],
            "type": "METHOD"
          },
          {
            "canonicalMeaning": "Glioma",
            "clientElementId": "E03",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "F03"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
            "sourceText": "gliomes",
            "studyRole": "SUBJECT",
            "supersedesElementIds": [],
            "type": "CONDITION"
          },
          {
            "canonicalMeaning": "Tumor progression",
            "clientElementId": "E04",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "F04"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
            "sourceText": "progression",
            "studyRole": "OUTCOME_ROLE",
            "supersedesElementIds": [],
            "type": "ENDPOINT"
          },
          {
            "canonicalMeaning": "Comparative evaluation of method utility",
            "clientElementId": "E05",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "F05"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
            "sourceText": "laquelle est la plus utile",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "OPERATION"
          },
          {
            "canonicalMeaning": "Discordance between methods",
            "clientElementId": "E06",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "F06"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
            "sourceText": "ne racontent pas la même chose",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "PHENOMENON"
          },
          {
            "canonicalMeaning": "Patient subset having only ASL",
            "clientElementId": "E07",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "F07"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
            "sourceText": "ceux qui n'ont que la seconde",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "POPULATION"
          },
          {
            "canonicalMeaning": "Conditional inclusion of single-modality cases",
            "clientElementId": "E08",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "F08"
            ],
            "polarity": "CONDITIONAL",
            "requiresConfirmation": false,
            "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
            "sourceText": "les garder si c'est possible",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "CONSTRAINT"
          }
        ],
        "ellipses": [],
        "knowledgeRequests": [],
        "language": "fr",
        "missingConcepts": [],
        "normalizedMeaning": "Comparison of DSC and ASL perfusion methods in gliomas to evaluate their utility for disease progression when discordant, alongside preservation of single-modality ASL cases if possible.",
        "relations": [
          {
            "clientRelationId": "REL01",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "R01"
            ],
            "polarity": "AFFIRMED",
            "relationType": "COMPARES_WITH",
            "requiresConfirmation": false,
            "sourceClientElementId": "E01",
            "targetClientElementId": "E02"
          },
          {
            "clientRelationId": "REL02",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "R02"
            ],
            "polarity": "AFFIRMED",
            "relationType": "RELATED_TO_CONDITION",
            "requiresConfirmation": false,
            "sourceClientElementId": "E01",
            "targetClientElementId": "E03"
          },
          {
            "clientRelationId": "REL03",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "R03"
            ],
            "polarity": "AFFIRMED",
            "relationType": "RELATED_TO_CONDITION",
            "requiresConfirmation": false,
            "sourceClientElementId": "E02",
            "targetClientElementId": "E03"
          },
          {
            "clientRelationId": "REL04",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "R04"
            ],
            "polarity": "AFFIRMED",
            "relationType": "EVALUATES_ENDPOINT",
            "requiresConfirmation": false,
            "sourceClientElementId": "E05",
            "targetClientElementId": "E04"
          },
          {
            "clientRelationId": "REL05",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "R05"
            ],
            "polarity": "CONDITIONAL",
            "relationType": "CONDITIONAL_INCLUSION",
            "requiresConfirmation": false,
            "sourceClientElementId": "E08",
            "targetClientElementId": "E07"
          }
        ],
        "routeProposal": {
          "confidence": 0.95,
          "expectedCapabilities": [
            "Method comparison design",
            "Endpoint definition for progression",
            "Handling of discordant imaging modalities"
          ],
          "reason": "The user is setting up a comparison between diagnostic methods (DSC vs ASL) in a specific condition (gliomas) with defined endpoints and inclusion constraints.",
          "route": "DESIGN_STUDY"
        },
        "semanticInventory": {
          "explicitFragments": [
            {
              "inventoryItemId": "F01",
              "linkedInventoryItemIds": [],
              "localRole": "subject_method",
              "modifiers": [],
              "normalizedLabel": "DSC",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
              "sourceText": "DSC"
            },
            {
              "inventoryItemId": "F02",
              "linkedInventoryItemIds": [],
              "localRole": "subject_method",
              "modifiers": [],
              "normalizedLabel": "ASL",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
              "sourceText": "ASL"
            },
            {
              "inventoryItemId": "F03",
              "linkedInventoryItemIds": [],
              "localRole": "condition",
              "modifiers": [],
              "normalizedLabel": "gliomes",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
              "sourceText": "gliomes"
            },
            {
              "inventoryItemId": "F04",
              "linkedInventoryItemIds": [],
              "localRole": "endpoint_target",
              "modifiers": [],
              "normalizedLabel": "progression",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
              "sourceText": "progression"
            },
            {
              "inventoryItemId": "F05",
              "linkedInventoryItemIds": [],
              "localRole": "evaluation",
              "modifiers": [],
              "normalizedLabel": "utilité comparative",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
              "sourceText": "laquelle est la plus utile"
            },
            {
              "inventoryItemId": "F06",
              "linkedInventoryItemIds": [],
              "localRole": "condition",
              "modifiers": [],
              "normalizedLabel": "discordance",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
              "sourceText": "ne racontent pas la même chose"
            },
            {
              "inventoryItemId": "F07",
              "linkedInventoryItemIds": [],
              "localRole": "population_subset",
              "modifiers": [],
              "normalizedLabel": "cas avec ASL seule",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
              "sourceText": "ceux qui n'ont que la seconde"
            },
            {
              "inventoryItemId": "F08",
              "linkedInventoryItemIds": [],
              "localRole": "constraint_action",
              "modifiers": [],
              "normalizedLabel": "conservation conditionnelle",
              "polarity": "CONDITIONAL",
              "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
              "sourceText": "les garder si c'est possible"
            }
          ],
          "explicitRelations": [
            {
              "inventoryRelationId": "R01",
              "normalizedRelation": "COMPARES_WITH",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "F01",
              "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
              "sourceText": "Je compare DSC et ASL",
              "targetInventoryItemId": "F02"
            },
            {
              "inventoryRelationId": "R02",
              "normalizedRelation": "RELATED_TO_CONDITION",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "F01",
              "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
              "sourceText": "Je compare DSC et ASL chez mes gliomes.",
              "targetInventoryItemId": "F03"
            },
            {
              "inventoryRelationId": "R03",
              "normalizedRelation": "RELATED_TO_CONDITION",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "F02",
              "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
              "sourceText": "Je compare DSC et ASL chez mes gliomes.",
              "targetInventoryItemId": "F03"
            },
            {
              "inventoryRelationId": "R04",
              "normalizedRelation": "EVALUATES_ENDPOINT",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "F05",
              "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
              "sourceText": "la plus utile pour la progression",
              "targetInventoryItemId": "F04"
            },
            {
              "inventoryRelationId": "R05",
              "normalizedRelation": "CONDITIONAL_INCLUSION",
              "polarity": "CONDITIONAL",
              "sourceInventoryItemId": "F08",
              "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
              "sourceText": "Pour ceux qui n'ont que la seconde, je préfère quand même les garder si c'est possible",
              "targetInventoryItemId": "F07"
            }
          ]
        },
        "semanticWarnings": [
          "DETERMINISTIC_INVENTORY_RELATION_SOURCE_SPAN_DERIVED:2"
        ],
        "summaryForUser": "Comparaison de la DSC et de l'ASL dans les gliomes pour évaluer leur utilité en cas de discordance vis-à-vis de la progression, avec conservation potentielle des cas ne disposant que de l'ASL.",
        "unknowns": []
      },
      "reconstructionAttempts": [
        {
          "attempt": 1,
          "category": null,
          "httpStatus": 200,
          "latencyMs": 9190,
          "outcome": "SUCCESS",
          "providerCode": null,
          "providerError": null,
          "providerStatus": null,
          "requestFinished": "2026-08-14T09:19:21.795Z",
          "requestStarted": "2026-08-14T09:19:12.605Z",
          "retryable": false
        }
      ],
      "reconstructionCallId": "gemini-call:ke1-48aeb9b820005c84",
      "reconstructionPromptVersion": "SEM-001-RECONSTRUCTION-1.6",
      "schemaVersion": "SEM-001-1.1",
      "temperature": null
    },
    "explicitCoverageReport": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "F01",
          "mappedClientElementIds": [
            "E01"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "DSC",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "DSC"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "F02",
          "mappedClientElementIds": [
            "E02"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "ASL",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "ASL"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "F03",
          "mappedClientElementIds": [
            "E03"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "gliomes",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "gliomes"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "F04",
          "mappedClientElementIds": [
            "E04"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "progression",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "progression"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "F05",
          "mappedClientElementIds": [
            "E05"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "utilité comparative",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "laquelle est la plus utile"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "F06",
          "mappedClientElementIds": [
            "E06"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "discordance",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "ne racontent pas la même chose"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "F07",
          "mappedClientElementIds": [
            "E07"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "cas avec ASL seule",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "ceux qui n'ont que la seconde"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "F08",
          "mappedClientElementIds": [
            "E08"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "conservation conditionnelle",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I06:SEM_SINGLE_PASS:T0",
          "sourceText": "les garder si c'est possible"
        }
      ],
      "status": "COMPLETE"
    },
    "history": [],
    "knowledgeRequests": [],
    "knowledgeSnapshot": null,
    "missingConcepts": [],
    "normalizedMeaning": "Comparison of DSC and ASL perfusion methods in gliomas to evaluate their utility for disease progression when discordant, alongside preservation of single-modality ASL cases if possible.",
    "originalRequest": "Je compare DSC et ASL chez mes gliomes. Quand elles ne racontent pas la même chose, je veux savoir laquelle est la plus utile pour la progression. Pour ceux qui n'ont que la seconde, je préfère quand même les garder si c'est possible.",
    "previousModelId": null,
    "relationCoverageReport": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "R01",
          "mappedClientRelationIds": [
            "REL01"
          ],
          "normalizedRelation": "COMPARES_WITH",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "F01",
          "targetInventoryItemId": "F02"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "R02",
          "mappedClientRelationIds": [
            "REL02"
          ],
          "normalizedRelation": "RELATED_TO_CONDITION",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "F01",
          "targetInventoryItemId": "F03"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "R03",
          "mappedClientRelationIds": [
            "REL03"
          ],
          "normalizedRelation": "RELATED_TO_CONDITION",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "F02",
          "targetInventoryItemId": "F03"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "R04",
          "mappedClientRelationIds": [
            "REL04"
          ],
          "normalizedRelation": "EVALUATES_ENDPOINT",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "F05",
          "targetInventoryItemId": "F04"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "R05",
          "mappedClientRelationIds": [
            "REL05"
          ],
          "normalizedRelation": "CONDITIONAL_INCLUSION",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "F08",
          "targetInventoryItemId": "F07"
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
          "R03"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CONDITION",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-26bc4a76f8fff5ca",
        "sourceElementId": "sem-element:ke1-68c07596e614ebca",
        "targetElementId": "sem-element:ke1-8976c0e4e1c67c20",
        "version": 1,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "R04"
        ],
        "polarity": "AFFIRMED",
        "relationType": "EVALUATES_ENDPOINT",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-3561ef74ee628be0",
        "sourceElementId": "sem-element:ke1-df46ee8aeaa3e446",
        "targetElementId": "sem-element:ke1-10dbd53730a263c3",
        "version": 1,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "R02"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CONDITION",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-3d23ee4d3c53bea1",
        "sourceElementId": "sem-element:ke1-f2dbffbaf716bffe",
        "targetElementId": "sem-element:ke1-8976c0e4e1c67c20",
        "version": 1,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "R05"
        ],
        "polarity": "CONDITIONAL",
        "relationType": "CONDITIONAL_INCLUSION",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-423e9e6254124086",
        "sourceElementId": "sem-element:ke1-d4a35b092ad5faad",
        "targetElementId": "sem-element:ke1-7e65f65b50e4c1a7",
        "version": 1,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "R01"
        ],
        "polarity": "AFFIRMED",
        "relationType": "COMPARES_WITH",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-ec15b09382c57447",
        "sourceElementId": "sem-element:ke1-f2dbffbaf716bffe",
        "targetElementId": "sem-element:ke1-68c07596e614ebca",
        "version": 1,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      }
    ],
    "revision": 1,
    "routeProposal": {
      "confidence": 0.95,
      "expectedCapabilities": [
        "Endpoint definition for progression",
        "Handling of discordant imaging modalities",
        "Method comparison design"
      ],
      "reason": "The user is setting up a comparison between diagnostic methods (DSC vs ASL) in a specific condition (gliomas) with defined endpoints and inclusion constraints.",
      "route": "DESIGN_STUDY"
    },
    "semanticModelId": "semantic-model:ke1-bfc42508f43a7df4",
    "semanticModelVersion": "1.1",
    "status": "CLARIFICATION_REQUIRED",
    "summaryForUser": "Comparaison de la DSC et de l'ASL dans les gliomes pour évaluer leur utilité en cas de discordance vis-à-vis de la progression, avec conservation potentielle des cas ne disposant que de l'ASL.",
    "unknowns": [],
    "updatedAt": "2026-08-14T09:19:21.818Z"
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

Comparison of DSC and ASL perfusion methods in gliomas to evaluate their utility for disease progression when discordant, alongside preservation of single-modality ASL cases if possible.

Objectif scientifique produit :

Comparison of DSC and ASL perfusion methods in gliomas to evaluate their utility for disease progression when discordant, alongside preservation of single-modality ASL cases if possible.

### EXPLICITEMENT DIT PAR LE CHERCHEUR

- content=Tumor progression | scientificRole=ENDPOINT:OUTCOME_ROLE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=progression | provenanceTurnIds=["I06:SEM_SINGLE_PASS:T0"]
- content=Discordance between methods | scientificRole=PHENOMENON:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=ne racontent pas la même chose | provenanceTurnIds=["I06:SEM_SINGLE_PASS:T0"]
- content=Arterial Spin Labeling perfusion MRI | scientificRole=METHOD:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=ASL | provenanceTurnIds=["I06:SEM_SINGLE_PASS:T0"]
- content=Patient subset having only ASL | scientificRole=POPULATION:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=ceux qui n'ont que la seconde | provenanceTurnIds=["I06:SEM_SINGLE_PASS:T0"]
- content=Glioma | scientificRole=CONDITION:SUBJECT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=gliomes | provenanceTurnIds=["I06:SEM_SINGLE_PASS:T0"]
- content=Conditional inclusion of single-modality cases | scientificRole=CONSTRAINT:NONE | polarity=CONDITIONAL | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=les garder si c'est possible | provenanceTurnIds=["I06:SEM_SINGLE_PASS:T0"]
- content=Comparative evaluation of method utility | scientificRole=OPERATION:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=laquelle est la plus utile | provenanceTurnIds=["I06:SEM_SINGLE_PASS:T0"]
- content=Dynamic Susceptibility Contrast perfusion MRI | scientificRole=METHOD:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=DSC | provenanceTurnIds=["I06:SEM_SINGLE_PASS:T0"]

### RELATIONS COMPRISES

- subject=Arterial Spin Labeling perfusion MRI | predicate=RELATED_TO_CONDITION | object=Glioma | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Comparative evaluation of method utility | predicate=EVALUATES_ENDPOINT | object=Tumor progression | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Dynamic Susceptibility Contrast perfusion MRI | predicate=RELATED_TO_CONDITION | object=Glioma | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Conditional inclusion of single-modality cases | predicate=CONDITIONAL_INCLUSION | object=Patient subset having only ASL | polarity=CONDITIONAL | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Dynamic Susceptibility Contrast perfusion MRI | predicate=COMPARES_WITH | object=Arterial Spin Labeling perfusion MRI | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER

### CONTEXTE INFÉRÉ

- Aucun élément produit.

### CANDIDATS SCIENTIFIQUES CONTEXTUELS

- Aucun élément produit.

### NÉGATIONS / CONTRAINTES

- content=Conditional inclusion of single-modality cases | scientificRole=CONSTRAINT:NONE | polarity=CONDITIONAL | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=les garder si c'est possible | provenanceTurnIds=["I06:SEM_SINGLE_PASS:T0"]

### TEMPORALITÉ

- Aucun élément produit.

### AMBIGUÏTÉS

- content=La mesure quantitative produite par la méthode « ASL » et utilisée comme prédicteur n'est pas explicitement nommée. | epistemicStatus=AMBIGUOUS | decisionImpact=SEM reports an unresolved ambiguity; impact requires clarification.

### INFORMATIONS MANQUANTES

- Aucun élément produit.

### INCONNUES

- Aucun élément produit.

### CORRECTIONS / SUPERSESSIONS

- Aucun élément produit.

### OWNERSHIP / STATUT ÉPISTÉMIQUE

- content=Tumor progression | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I06:SEM_SINGLE_PASS:T0"]
- content=Discordance between methods | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I06:SEM_SINGLE_PASS:T0"]
- content=Arterial Spin Labeling perfusion MRI | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I06:SEM_SINGLE_PASS:T0"]
- content=Patient subset having only ASL | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I06:SEM_SINGLE_PASS:T0"]
- content=Glioma | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I06:SEM_SINGLE_PASS:T0"]
- content=Conditional inclusion of single-modality cases | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I06:SEM_SINGLE_PASS:T0"]
- content=Comparative evaluation of method utility | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I06:SEM_SINGLE_PASS:T0"]
- content=Dynamic Susceptibility Contrast perfusion MRI | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I06:SEM_SINGLE_PASS:T0"]

### QUESTIONS DE CLARIFICATION CANDIDATES

- question=Souhaitez-vous formaliser un critère d'évaluation formel pour mesurer la discordance entre DSC et ASL ? | priority=HIGH | blocking=oui | decisionImpact=La gestion des cas discordants est mentionnée mais nécessite des critères opérationnels. | targetIds=["sem-element:ke1-4b391086bbea1622", "sem-element:ke1-df46ee8aeaa3e446"]

## MISSING STRUCTURAL GUARANTEES

- EXACT_PROVIDER_RAW_TEXT_NOT_PERSISTED; STRUCTURED_NATIVE_ARTIFACT_AVAILABLE

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
