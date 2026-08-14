# I04 — SEM_SINGLE_PASS — COMMON_TRANSCRIPT T2

## INPUT

Message utilisateur courant VERBATIM :

> LGE n'est pas disponible partout non plus et je ne veux pas en faire le critère principal. L'ECV est possible seulement si contraste et hématocrite sont disponibles.

Conversation précédente VERBATIM :

> I04:T0 | USER : Je veux détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible. On a plusieurs centres et tout le monde n'a pas les mêmes séquences.
> I04:R1 | USER : Tous les centres ont cine et T1 natif. Non, le T2 n'est pas disponible partout.

## NATIVE OUTPUT

Artefact : `experiments/semantic-engine-comparison/results/common-contract-ablation-02/native-outputs/common-transcript-i04-t2-sem-single-pass.json`

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
          "normalizedMeaning": "Intention de détecter",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:T0",
          "sourceText": "détecter"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-02",
          "mappedClientElementIds": [
            "elem-02"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Atteinte cardiaque précoce",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:T0",
          "sourceText": "l'atteinte cardiaque précoce"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-03",
          "mappedClientElementIds": [
            "elem-03"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Maladie de Fabry",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:T0",
          "sourceText": "Fabry"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-04",
          "mappedClientElementIds": [
            "elem-04"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Fibrose visible",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:T0",
          "sourceText": "la fibrose visible"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-05",
          "mappedClientElementIds": [
            "elem-05"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Plusieurs centres",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:T0",
          "sourceText": "plusieurs centres"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-06",
          "mappedClientElementIds": [
            "elem-06"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Séquences d'imagerie",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:T0",
          "sourceText": "séquences"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-07",
          "mappedClientElementIds": [
            "elem-07"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Séquence ciné",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R1",
          "sourceText": "cine"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-08",
          "mappedClientElementIds": [
            "elem-08"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Séquence T1 natif",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R1",
          "sourceText": "T1 natif"
        },
        {
          "coverageStatus": "UNRESOLVED_EXPLICIT_FRAGMENT",
          "inventoryItemId": "inv-09",
          "mappedClientElementIds": [],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Disponibilité universelle de ciné et T1 natif",
          "reason": "The exact inventory fragment has no source-grounded typed Semantic Element mapping.",
          "sourceMessageId": "I04:R1",
          "sourceText": "Tous les centres ont cine et T1 natif"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-10",
          "mappedClientElementIds": [
            "elem-09"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Séquence T2",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R1",
          "sourceText": "T2"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-11",
          "mappedClientElementIds": [
            "elem-09"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Indisponibilité partielle du T2",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R1",
          "sourceText": "Non, le T2 n'est pas disponible partout"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-12",
          "mappedClientElementIds": [
            "elem-10"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Séquence LGE",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R2",
          "sourceText": "LGE"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-13",
          "mappedClientElementIds": [
            "elem-10"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Indisponibilité partielle du LGE",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R2",
          "sourceText": "LGE n'est pas disponible partout non plus"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-14",
          "mappedClientElementIds": [
            "elem-14"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Exclusion du LGE comme critère principal",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R2",
          "sourceText": "je ne veux pas en faire le critère principal"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-15",
          "mappedClientElementIds": [
            "elem-11"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Paramètre ECV",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R2",
          "sourceText": "ECV"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-16",
          "mappedClientElementIds": [
            "elem-12"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Agent de contraste",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R2",
          "sourceText": "contraste"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-17",
          "mappedClientElementIds": [
            "elem-13"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Paramètre hématocrite",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R2",
          "sourceText": "hématocrite"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-18",
          "mappedClientElementIds": [
            "elem-15"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Conditionnalité de l'ECV au contraste et à l'hématocrite",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R2",
          "sourceText": "L'ECV est possible seulement si contraste et hématocrite sont disponibles"
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
          "inventoryRelationId": "rel-inv-01",
          "mappedClientRelationIds": [
            "rel-01"
          ],
          "normalizedRelation": "AIMS_TO_OBSERVE",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv-01",
          "targetInventoryItemId": "inv-02"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel-inv-02",
          "mappedClientRelationIds": [
            "rel-02"
          ],
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv-02",
          "targetInventoryItemId": "inv-03"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel-inv-03",
          "mappedClientRelationIds": [
            "rel-03"
          ],
          "normalizedRelation": "PRECEDES",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv-02",
          "targetInventoryItemId": "inv-04"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel-inv-04",
          "mappedClientRelationIds": [
            "rel-04"
          ],
          "normalizedRelation": "EXCLUDES_FROM_ENDPOINT",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv-14",
          "targetInventoryItemId": "inv-12"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel-inv-05",
          "mappedClientRelationIds": [
            "rel-05"
          ],
          "normalizedRelation": "CONDITIONAL_ON",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv-18",
          "targetInventoryItemId": "inv-15"
        }
      ],
      "status": "COMPLETE"
    },
    "taxonomy": {
      "findings": [
        {
          "clientElementId": "elem-11",
          "code": "SELECTED_JUDGING_VARIABLE_NOT_ENDPOINT",
          "currentType": "BIOMARKER",
          "expectedStudyRole": "OUTCOME_ROLE",
          "expectedType": "ENDPOINT",
          "reason": "A variable explicitly selected as what must count to judge the study is an ENDPOINT role in this context; its underlying observable nature must not erase that expressed project role."
        },
        {
          "clientElementId": "elem-13",
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
      "Disponibilité hétérogène des séquences avancées entre les centres (Ciné et T1 natif universels, T2 et LGE absents de certains centres, ECV conditionnel)."
    ],
    "candidateId": "candidate-ke1-i04-r2",
    "clarificationCandidates": [
      {
        "question": "Quel est le critère d'évaluation principal retenu pour l'étude multicentrique en l'absence de disponibilité universelle du T2 et du LGE ?",
        "reason": "Le LGE est exclu comme critère principal et le T2 n'est pas disponible partout, laissant le choix du critère principal ouvert.",
        "resolvesClientElementIds": [
          "elem-02",
          "elem-07",
          "elem-08",
          "elem-10",
          "elem-11"
        ]
      }
    ],
    "contradictions": [],
    "elements": [
      {
        "canonicalMeaning": "Intention de détecter l'atteinte cardiaque précoce",
        "clientElementId": "elem-01",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-01"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:T0",
        "sourceText": "détecter",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_INTENT"
      },
      {
        "canonicalMeaning": "Atteinte cardiaque précoce",
        "clientElementId": "elem-02",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-02"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:T0",
        "sourceText": "l'atteinte cardiaque précoce",
        "studyRole": "OUTCOME_ROLE",
        "supersedesElementIds": [],
        "type": "OUTCOME"
      },
      {
        "canonicalMeaning": "Maladie de Fabry",
        "clientElementId": "elem-03",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-03"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:T0",
        "sourceText": "Fabry",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONDITION"
      },
      {
        "canonicalMeaning": "Fibrose visible",
        "clientElementId": "elem-04",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-04"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:T0",
        "sourceText": "la fibrose visible",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_OBJECT"
      },
      {
        "canonicalMeaning": "Étude multicentrique impliquant plusieurs centres",
        "clientElementId": "elem-05",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-05"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:T0",
        "sourceText": "plusieurs centres",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "STUDY_DESIGN"
      },
      {
        "canonicalMeaning": "Séquences d'imagerie variables selon les centres",
        "clientElementId": "elem-06",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-06"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:T0",
        "sourceText": "séquences",
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "METHOD"
      },
      {
        "canonicalMeaning": "Séquence ciné",
        "clientElementId": "elem-07",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-07"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:R1",
        "sourceText": "cine",
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "METHOD"
      },
      {
        "canonicalMeaning": "Séquence T1 natif",
        "clientElementId": "elem-08",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-08"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:R1",
        "sourceText": "T1 natif",
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "METHOD"
      },
      {
        "canonicalMeaning": "Séquence T2",
        "clientElementId": "elem-09",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-10",
          "inv-11"
        ],
        "polarity": "NEGATED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:R1",
        "sourceText": "T2",
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "METHOD"
      },
      {
        "canonicalMeaning": "Séquence LGE",
        "clientElementId": "elem-10",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-12",
          "inv-13"
        ],
        "polarity": "NEGATED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:R2",
        "sourceText": "LGE",
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "METHOD"
      },
      {
        "canonicalMeaning": "Paramètre ECV",
        "clientElementId": "elem-11",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-15"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:R2",
        "sourceText": "ECV",
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "BIOMARKER"
      },
      {
        "canonicalMeaning": "Agent de contraste",
        "clientElementId": "elem-12",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-16"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:R2",
        "sourceText": "contraste",
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "METHOD"
      },
      {
        "canonicalMeaning": "Paramètre hématocrite",
        "clientElementId": "elem-13",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-17"
        ],
        "polarity": "AFFIRMED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:R2",
        "sourceText": "hématocrite",
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "BIOMARKER"
      },
      {
        "canonicalMeaning": "Exclusion du LGE comme critère principal",
        "clientElementId": "elem-14",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-14"
        ],
        "polarity": "NEGATED",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:R2",
        "sourceText": "je ne veux pas en faire le critère principal",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONSTRAINT"
      },
      {
        "canonicalMeaning": "Conditionnalité de l'ECV au contraste et à l'hématocrite",
        "clientElementId": "elem-15",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-18"
        ],
        "polarity": "CONDITIONAL",
        "requiresConfirmation": false,
        "sourceMessageId": "I04:R2",
        "sourceText": "L'ECV est possible seulement si contraste et hématocrite sont disponibles",
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONSTRAINT"
      }
    ],
    "ellipses": [],
    "knowledgeRequests": [],
    "language": "fr",
    "missingConcepts": [
      "Critère d'évaluation principal retenu pour l'étude"
    ],
    "normalizedMeaning": "Détection d'une atteinte cardiaque précoce dans la maladie de Fabry avant la fibrose visible, dans le cadre d'une étude multicentrique avec des disponibilités hétérogènes de séquences (ciné et T1 natif universels, T2 et LGE non disponibles partout et non retenus comme critères principaux, ECV conditionné au contraste et à l'hématocrite).",
    "relations": [
      {
        "clientRelationId": "rel-01",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel-inv-01"
        ],
        "polarity": "AFFIRMED",
        "relationType": "AIMS_TO_OBSERVE",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem-01",
        "targetClientElementId": "elem-02"
      },
      {
        "clientRelationId": "rel-02",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel-inv-02"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem-02",
        "targetClientElementId": "elem-03"
      },
      {
        "clientRelationId": "rel-03",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel-inv-03"
        ],
        "polarity": "AFFIRMED",
        "relationType": "PRECEDES",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem-02",
        "targetClientElementId": "elem-04"
      },
      {
        "clientRelationId": "rel-04",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel-inv-04"
        ],
        "polarity": "NEGATED",
        "relationType": "EXCLUDES_FROM_ENDPOINT",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem-14",
        "targetClientElementId": "elem-10"
      },
      {
        "clientRelationId": "rel-05",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel-inv-05"
        ],
        "polarity": "CONDITIONAL",
        "relationType": "CONDITIONAL_ON",
        "requiresConfirmation": false,
        "sourceClientElementId": "elem-15",
        "targetClientElementId": "elem-11"
      }
    ],
    "routeProposal": {
      "confidence": 0.95,
      "expectedCapabilities": [
        "Définition de protocole multicentrique",
        "Gestion des contraintes de séquences d'imagerie",
        "Sélection des critères d'évaluation"
      ],
      "reason": "L'utilisateur définit les paramètres d'une étude multicentrique, incluant la population, les méthodes disponibles, les contraintes de matériel et les choix de critères.",
      "route": "DESIGN_STUDY"
    },
    "semanticInventory": {
      "explicitFragments": [
        {
          "inventoryItemId": "inv-01",
          "linkedInventoryItemIds": [
            "inv-02"
          ],
          "localRole": "action",
          "modifiers": [],
          "normalizedLabel": "Intention de détecter",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:T0",
          "sourceText": "détecter"
        },
        {
          "inventoryItemId": "inv-02",
          "linkedInventoryItemIds": [
            "inv-01",
            "inv-03",
            "inv-04"
          ],
          "localRole": "target",
          "modifiers": [
            "précoce"
          ],
          "normalizedLabel": "Atteinte cardiaque précoce",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:T0",
          "sourceText": "l'atteinte cardiaque précoce"
        },
        {
          "inventoryItemId": "inv-03",
          "linkedInventoryItemIds": [
            "inv-02"
          ],
          "localRole": "condition",
          "modifiers": [],
          "normalizedLabel": "Maladie de Fabry",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:T0",
          "sourceText": "Fabry"
        },
        {
          "inventoryItemId": "inv-04",
          "linkedInventoryItemIds": [
            "inv-02"
          ],
          "localRole": "reference_limit",
          "modifiers": [
            "visible"
          ],
          "normalizedLabel": "Fibrose visible",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:T0",
          "sourceText": "la fibrose visible"
        },
        {
          "inventoryItemId": "inv-05",
          "linkedInventoryItemIds": [
            "inv-06"
          ],
          "localRole": "study_design",
          "modifiers": [
            "multicentrique"
          ],
          "normalizedLabel": "Plusieurs centres",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:T0",
          "sourceText": "plusieurs centres"
        },
        {
          "inventoryItemId": "inv-06",
          "linkedInventoryItemIds": [
            "inv-05"
          ],
          "localRole": "method",
          "modifiers": [
            "variables"
          ],
          "normalizedLabel": "Séquences d'imagerie",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:T0",
          "sourceText": "séquences"
        },
        {
          "inventoryItemId": "inv-07",
          "linkedInventoryItemIds": [],
          "localRole": "method",
          "modifiers": [],
          "normalizedLabel": "Séquence ciné",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:R1",
          "sourceText": "cine"
        },
        {
          "inventoryItemId": "inv-08",
          "linkedInventoryItemIds": [],
          "localRole": "method",
          "modifiers": [
            "natif"
          ],
          "normalizedLabel": "Séquence T1 natif",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:R1",
          "sourceText": "T1 natif"
        },
        {
          "inventoryItemId": "inv-09",
          "linkedInventoryItemIds": [
            "inv-07",
            "inv-08"
          ],
          "localRole": "constraint",
          "modifiers": [],
          "normalizedLabel": "Disponibilité universelle de ciné et T1 natif",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:R1",
          "sourceText": "Tous les centres ont cine et T1 natif"
        },
        {
          "inventoryItemId": "inv-10",
          "linkedInventoryItemIds": [],
          "localRole": "method",
          "modifiers": [],
          "normalizedLabel": "Séquence T2",
          "polarity": "NEGATED",
          "sourceMessageId": "I04:R1",
          "sourceText": "T2"
        },
        {
          "inventoryItemId": "inv-11",
          "linkedInventoryItemIds": [
            "inv-10"
          ],
          "localRole": "constraint",
          "modifiers": [],
          "normalizedLabel": "Indisponibilité partielle du T2",
          "polarity": "NEGATED",
          "sourceMessageId": "I04:R1",
          "sourceText": "Non, le T2 n'est pas disponible partout"
        },
        {
          "inventoryItemId": "inv-12",
          "linkedInventoryItemIds": [],
          "localRole": "method",
          "modifiers": [],
          "normalizedLabel": "Séquence LGE",
          "polarity": "NEGATED",
          "sourceMessageId": "I04:R2",
          "sourceText": "LGE"
        },
        {
          "inventoryItemId": "inv-13",
          "linkedInventoryItemIds": [
            "inv-12"
          ],
          "localRole": "constraint",
          "modifiers": [],
          "normalizedLabel": "Indisponibilité partielle du LGE",
          "polarity": "NEGATED",
          "sourceMessageId": "I04:R2",
          "sourceText": "LGE n'est pas disponible partout non plus"
        },
        {
          "inventoryItemId": "inv-14",
          "linkedInventoryItemIds": [
            "inv-12"
          ],
          "localRole": "constraint",
          "modifiers": [],
          "normalizedLabel": "Exclusion du LGE comme critère principal",
          "polarity": "NEGATED",
          "sourceMessageId": "I04:R2",
          "sourceText": "je ne veux pas en faire le critère principal"
        },
        {
          "inventoryItemId": "inv-15",
          "linkedInventoryItemIds": [],
          "localRole": "biomarker",
          "modifiers": [],
          "normalizedLabel": "Paramètre ECV",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:R2",
          "sourceText": "ECV"
        },
        {
          "inventoryItemId": "inv-16",
          "linkedInventoryItemIds": [
            "inv-15"
          ],
          "localRole": "method_requirement",
          "modifiers": [],
          "normalizedLabel": "Agent de contraste",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:R2",
          "sourceText": "contraste"
        },
        {
          "inventoryItemId": "inv-17",
          "linkedInventoryItemIds": [
            "inv-15"
          ],
          "localRole": "biomarker_requirement",
          "modifiers": [],
          "normalizedLabel": "Paramètre hématocrite",
          "polarity": "AFFIRMED",
          "sourceMessageId": "I04:R2",
          "sourceText": "hématocrite"
        },
        {
          "inventoryItemId": "inv-18",
          "linkedInventoryItemIds": [
            "inv-15",
            "inv-16",
            "inv-17"
          ],
          "localRole": "constraint",
          "modifiers": [],
          "normalizedLabel": "Conditionnalité de l'ECV au contraste et à l'hématocrite",
          "polarity": "CONDITIONAL",
          "sourceMessageId": "I04:R2",
          "sourceText": "L'ECV est possible seulement si contraste et hématocrite sont disponibles"
        }
      ],
      "explicitRelations": [
        {
          "inventoryRelationId": "rel-inv-01",
          "normalizedRelation": "AIMS_TO_OBSERVE",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "inv-01",
          "sourceMessageId": "I04:T0",
          "sourceText": "détecter l'atteinte cardiaque précoce",
          "targetInventoryItemId": "inv-02"
        },
        {
          "inventoryRelationId": "rel-inv-02",
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "inv-02",
          "sourceMessageId": "I04:T0",
          "sourceText": "l'atteinte cardiaque précoce dans Fabry",
          "targetInventoryItemId": "inv-03"
        },
        {
          "inventoryRelationId": "rel-inv-03",
          "normalizedRelation": "PRECEDES",
          "polarity": "AFFIRMED",
          "sourceInventoryItemId": "inv-02",
          "sourceMessageId": "I04:T0",
          "sourceText": "Je veux détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible.",
          "targetInventoryItemId": "inv-04"
        },
        {
          "inventoryRelationId": "rel-inv-04",
          "normalizedRelation": "EXCLUDES_FROM_ENDPOINT",
          "polarity": "NEGATED",
          "sourceInventoryItemId": "inv-14",
          "sourceMessageId": "I04:R2",
          "sourceText": "je ne veux pas en faire le critère principal",
          "targetInventoryItemId": "inv-12"
        },
        {
          "inventoryRelationId": "rel-inv-05",
          "normalizedRelation": "CONDITIONAL_ON",
          "polarity": "CONDITIONAL",
          "sourceInventoryItemId": "inv-18",
          "sourceMessageId": "I04:R2",
          "sourceText": "L'ECV est possible seulement si contraste et hématocrite sont disponibles",
          "targetInventoryItemId": "inv-15"
        }
      ]
    },
    "semanticWarnings": [
      "DETERMINISTIC_INVENTORY_RELATION_SOURCE_SPAN_DERIVED:1"
    ],
    "summaryForUser": "Intégration des contraintes sur le LGE (non disponible partout et exclu du critère principal) et sur l'ECV (conditionnel au contraste et à l'hématocrite).",
    "unknowns": []
  },
  "model": {
    "acceptanceRecord": null,
    "acceptedAt": null,
    "ambiguities": [
      "Disponibilité hétérogène des séquences avancées entre les centres (Ciné et T1 natif universels, T2 et LGE absents de certains centres, ECV conditionnel)."
    ],
    "clarificationCandidates": [
      {
        "question": "Quel est le critère d'évaluation principal retenu pour l'étude multicentrique en l'absence de disponibilité universelle du T2 et du LGE ?",
        "reason": "Le LGE est exclu comme critère principal et le T2 n'est pas disponible partout, laissant le choix du critère principal ouvert.",
        "resolvesElementIds": [
          "sem-element:ke1-03899c9631139b72",
          "sem-element:ke1-0686fb334b9349d7",
          "sem-element:ke1-b01a8aba7016e06e",
          "sem-element:ke1-d66bf74598ad7959",
          "sem-element:ke1-e84d65e81331d27c"
        ]
      }
    ],
    "contradictions": [],
    "conversationMessageIds": [
      "I04:T0",
      "I04:R1",
      "I04:R2"
    ],
    "createdAt": "2026-08-14T08:55:01.714Z",
    "critic": {
      "issues": [],
      "summary": "Single-pass deterministic reports incomplete; no semantic critic or repair was executed.",
      "verdict": "CLARIFICATION_REQUIRED"
    },
    "digest": "ke1-6bc372b3760fb247",
    "elements": [
      {
        "canonicalMeaning": "Paramètre ECV",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-15"
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
          "messageId": "I04:R2",
          "providerCallId": "gemini-call:ke1-763f15abe690d8c7",
          "rawElementId": "elem-11",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-0d8ca738a76e68e4"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-03899c9631139b72",
        "sourceSpan": {
          "end": 96,
          "messageId": "I04:R2",
          "start": 93,
          "text": "ECV"
        },
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "BIOMARKER",
        "version": 1
      },
      {
        "canonicalMeaning": "Séquence T1 natif",
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
          "messageId": "I04:R1",
          "providerCallId": "gemini-call:ke1-763f15abe690d8c7",
          "rawElementId": "elem-08",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-0686fb334b9349d7",
        "sourceSpan": {
          "end": 37,
          "messageId": "I04:R1",
          "start": 29,
          "text": "T1 natif"
        },
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "METHOD",
        "version": 2
      },
      {
        "canonicalMeaning": "Fibrose visible",
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
          "messageId": "I04:T0",
          "providerCallId": "gemini-call:ke1-763f15abe690d8c7",
          "rawElementId": "elem-04",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-19b53722bc21738e"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-109b7e05a8777951",
        "sourceSpan": {
          "end": 81,
          "messageId": "I04:T0",
          "start": 63,
          "text": "la fibrose visible"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_OBJECT",
        "version": 3
      },
      {
        "canonicalMeaning": "Séquences d'imagerie variables selon les centres",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-06"
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
          "messageId": "I04:T0",
          "providerCallId": "gemini-call:ke1-763f15abe690d8c7",
          "rawElementId": "elem-06",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-21f2b6e5d9b49b91",
        "sourceSpan": {
          "end": 150,
          "messageId": "I04:T0",
          "start": 141,
          "text": "séquences"
        },
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "METHOD",
        "version": 3
      },
      {
        "canonicalMeaning": "Intention de détecter l'atteinte cardiaque précoce",
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
          "messageId": "I04:T0",
          "providerCallId": "gemini-call:ke1-763f15abe690d8c7",
          "rawElementId": "elem-01",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-69bc53a9548f7245"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-30b41340624f207c",
        "sourceSpan": {
          "end": 16,
          "messageId": "I04:T0",
          "start": 8,
          "text": "détecter"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "SCIENTIFIC_INTENT",
        "version": 3
      },
      {
        "canonicalMeaning": "Séquence T2",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-10",
          "inv-11"
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
          "messageId": "I04:R1",
          "providerCallId": "gemini-call:ke1-763f15abe690d8c7",
          "rawElementId": "elem-09",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-46c9e7e6543bc83a",
        "sourceSpan": {
          "end": 49,
          "messageId": "I04:R1",
          "start": 47,
          "text": "T2"
        },
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "METHOD",
        "version": 2
      },
      {
        "canonicalMeaning": "Agent de contraste",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-16"
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
          "messageId": "I04:R2",
          "providerCallId": "gemini-call:ke1-763f15abe690d8c7",
          "rawElementId": "elem-12",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-50e61ef8192f34b4",
        "sourceSpan": {
          "end": 132,
          "messageId": "I04:R2",
          "start": 123,
          "text": "contraste"
        },
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "METHOD",
        "version": 1
      },
      {
        "canonicalMeaning": "Paramètre hématocrite",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-17"
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
          "messageId": "I04:R2",
          "providerCallId": "gemini-call:ke1-763f15abe690d8c7",
          "rawElementId": "elem-13",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-524b1c65c6bba2e9",
        "sourceSpan": {
          "end": 147,
          "messageId": "I04:R2",
          "start": 136,
          "text": "hématocrite"
        },
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "BIOMARKER",
        "version": 1
      },
      {
        "canonicalMeaning": "Exclusion du LGE comme critère principal",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-14"
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
          "messageId": "I04:R2",
          "providerCallId": "gemini-call:ke1-763f15abe690d8c7",
          "rawElementId": "elem-14",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-73a64eee72fe84d2"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-5b813a58121a9de4",
        "sourceSpan": {
          "end": 89,
          "messageId": "I04:R2",
          "start": 45,
          "text": "je ne veux pas en faire le critère principal"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONSTRAINT",
        "version": 1
      },
      {
        "canonicalMeaning": "Atteinte cardiaque précoce",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-02"
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
          "messageId": "I04:T0",
          "providerCallId": "gemini-call:ke1-763f15abe690d8c7",
          "rawElementId": "elem-02",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-19b53722bc21738e",
          "sem-relation:ke1-69bc53a9548f7245",
          "sem-relation:ke1-8452cd6d33e50e29"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-b01a8aba7016e06e",
        "sourceSpan": {
          "end": 45,
          "messageId": "I04:T0",
          "start": 17,
          "text": "l'atteinte cardiaque précoce"
        },
        "studyRole": "OUTCOME_ROLE",
        "supersedesElementIds": [],
        "type": "OUTCOME",
        "version": 3
      },
      {
        "canonicalMeaning": "Maladie de Fabry",
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
          "messageId": "I04:T0",
          "providerCallId": "gemini-call:ke1-763f15abe690d8c7",
          "rawElementId": "elem-03",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-8452cd6d33e50e29"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-b4c3c91b3ce8d0af",
        "sourceSpan": {
          "end": 56,
          "messageId": "I04:T0",
          "start": 51,
          "text": "Fabry"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONDITION",
        "version": 3
      },
      {
        "canonicalMeaning": "Séquence ciné",
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
          "messageId": "I04:R1",
          "providerCallId": "gemini-call:ke1-763f15abe690d8c7",
          "rawElementId": "elem-07",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-d66bf74598ad7959",
        "sourceSpan": {
          "end": 25,
          "messageId": "I04:R1",
          "start": 21,
          "text": "cine"
        },
        "studyRole": "MEASUREMENT",
        "supersedesElementIds": [],
        "type": "METHOD",
        "version": 2
      },
      {
        "canonicalMeaning": "Étude multicentrique impliquant plusieurs centres",
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
          "messageId": "I04:T0",
          "providerCallId": "gemini-call:ke1-763f15abe690d8c7",
          "rawElementId": "elem-05",
          "source": "USER_LANGUAGE"
        },
        "relationships": [],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-d94779c2cad27a1e",
        "sourceSpan": {
          "end": 105,
          "messageId": "I04:T0",
          "start": 88,
          "text": "plusieurs centres"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "STUDY_DESIGN",
        "version": 3
      },
      {
        "canonicalMeaning": "Conditionnalité de l'ECV au contraste et à l'hématocrite",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-18"
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
          "messageId": "I04:R2",
          "providerCallId": "gemini-call:ke1-763f15abe690d8c7",
          "rawElementId": "elem-15",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-0d8ca738a76e68e4"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-e83966ddca236211",
        "sourceSpan": {
          "end": 164,
          "messageId": "I04:R2",
          "start": 91,
          "text": "L'ECV est possible seulement si contraste et hématocrite sont disponibles"
        },
        "studyRole": "NONE",
        "supersedesElementIds": [],
        "type": "CONSTRAINT",
        "version": 1
      },
      {
        "canonicalMeaning": "Séquence LGE",
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryItemIds": [
          "inv-12",
          "inv-13"
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
          "messageId": "I04:R2",
          "providerCallId": "gemini-call:ke1-763f15abe690d8c7",
          "rawElementId": "elem-10",
          "source": "USER_LANGUAGE"
        },
        "relationships": [
          "sem-relation:ke1-73a64eee72fe84d2"
        ],
        "requiresConfirmation": false,
        "semanticElementId": "sem-element:ke1-e84d65e81331d27c",
        "sourceSpan": {
          "end": 3,
          "messageId": "I04:R2",
          "start": 0,
          "text": "LGE"
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
      "executedAt": "2026-08-14T08:58:12.847Z",
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
          "Disponibilité hétérogène des séquences avancées entre les centres (Ciné et T1 natif universels, T2 et LGE absents de certains centres, ECV conditionnel)."
        ],
        "candidateId": "candidate-ke1-i04-r2",
        "clarificationCandidates": [
          {
            "question": "Quel est le critère d'évaluation principal retenu pour l'étude multicentrique en l'absence de disponibilité universelle du T2 et du LGE ?",
            "reason": "Le LGE est exclu comme critère principal et le T2 n'est pas disponible partout, laissant le choix du critère principal ouvert.",
            "resolvesClientElementIds": [
              "elem-02",
              "elem-07",
              "elem-08",
              "elem-10",
              "elem-11"
            ]
          }
        ],
        "contradictions": [],
        "elements": [
          {
            "canonicalMeaning": "Intention de détecter l'atteinte cardiaque précoce",
            "clientElementId": "elem-01",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv-01"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:T0",
            "sourceText": "détecter",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "SCIENTIFIC_INTENT"
          },
          {
            "canonicalMeaning": "Atteinte cardiaque précoce",
            "clientElementId": "elem-02",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv-02"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:T0",
            "sourceText": "l'atteinte cardiaque précoce",
            "studyRole": "OUTCOME_ROLE",
            "supersedesElementIds": [],
            "type": "OUTCOME"
          },
          {
            "canonicalMeaning": "Maladie de Fabry",
            "clientElementId": "elem-03",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv-03"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:T0",
            "sourceText": "Fabry",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "CONDITION"
          },
          {
            "canonicalMeaning": "Fibrose visible",
            "clientElementId": "elem-04",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv-04"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:T0",
            "sourceText": "la fibrose visible",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "SCIENTIFIC_OBJECT"
          },
          {
            "canonicalMeaning": "Étude multicentrique impliquant plusieurs centres",
            "clientElementId": "elem-05",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv-05"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:T0",
            "sourceText": "plusieurs centres",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "STUDY_DESIGN"
          },
          {
            "canonicalMeaning": "Séquences d'imagerie variables selon les centres",
            "clientElementId": "elem-06",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv-06"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:T0",
            "sourceText": "séquences",
            "studyRole": "MEASUREMENT",
            "supersedesElementIds": [],
            "type": "METHOD"
          },
          {
            "canonicalMeaning": "Séquence ciné",
            "clientElementId": "elem-07",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv-07"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:R1",
            "sourceText": "cine",
            "studyRole": "MEASUREMENT",
            "supersedesElementIds": [],
            "type": "METHOD"
          },
          {
            "canonicalMeaning": "Séquence T1 natif",
            "clientElementId": "elem-08",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv-08"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:R1",
            "sourceText": "T1 natif",
            "studyRole": "MEASUREMENT",
            "supersedesElementIds": [],
            "type": "METHOD"
          },
          {
            "canonicalMeaning": "Séquence T2",
            "clientElementId": "elem-09",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv-10",
              "inv-11"
            ],
            "polarity": "NEGATED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:R1",
            "sourceText": "T2",
            "studyRole": "MEASUREMENT",
            "supersedesElementIds": [],
            "type": "METHOD"
          },
          {
            "canonicalMeaning": "Séquence LGE",
            "clientElementId": "elem-10",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv-12",
              "inv-13"
            ],
            "polarity": "NEGATED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:R2",
            "sourceText": "LGE",
            "studyRole": "MEASUREMENT",
            "supersedesElementIds": [],
            "type": "METHOD"
          },
          {
            "canonicalMeaning": "Paramètre ECV",
            "clientElementId": "elem-11",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv-15"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:R2",
            "sourceText": "ECV",
            "studyRole": "MEASUREMENT",
            "supersedesElementIds": [],
            "type": "BIOMARKER"
          },
          {
            "canonicalMeaning": "Agent de contraste",
            "clientElementId": "elem-12",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv-16"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:R2",
            "sourceText": "contraste",
            "studyRole": "MEASUREMENT",
            "supersedesElementIds": [],
            "type": "METHOD"
          },
          {
            "canonicalMeaning": "Paramètre hématocrite",
            "clientElementId": "elem-13",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv-17"
            ],
            "polarity": "AFFIRMED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:R2",
            "sourceText": "hématocrite",
            "studyRole": "MEASUREMENT",
            "supersedesElementIds": [],
            "type": "BIOMARKER"
          },
          {
            "canonicalMeaning": "Exclusion du LGE comme critère principal",
            "clientElementId": "elem-14",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv-14"
            ],
            "polarity": "NEGATED",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:R2",
            "sourceText": "je ne veux pas en faire le critère principal",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "CONSTRAINT"
          },
          {
            "canonicalMeaning": "Conditionnalité de l'ECV au contraste et à l'hématocrite",
            "clientElementId": "elem-15",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryItemIds": [
              "inv-18"
            ],
            "polarity": "CONDITIONAL",
            "requiresConfirmation": false,
            "sourceMessageId": "I04:R2",
            "sourceText": "L'ECV est possible seulement si contraste et hématocrite sont disponibles",
            "studyRole": "NONE",
            "supersedesElementIds": [],
            "type": "CONSTRAINT"
          }
        ],
        "ellipses": [],
        "knowledgeRequests": [],
        "language": "fr",
        "missingConcepts": [
          "Critère d'évaluation principal retenu pour l'étude"
        ],
        "normalizedMeaning": "Détection d'une atteinte cardiaque précoce dans la maladie de Fabry avant la fibrose visible, dans le cadre d'une étude multicentrique avec des disponibilités hétérogènes de séquences (ciné et T1 natif universels, T2 et LGE non disponibles partout et non retenus comme critères principaux, ECV conditionné au contraste et à l'hématocrite).",
        "relations": [
          {
            "clientRelationId": "rel-01",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "rel-inv-01"
            ],
            "polarity": "AFFIRMED",
            "relationType": "AIMS_TO_OBSERVE",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem-01",
            "targetClientElementId": "elem-02"
          },
          {
            "clientRelationId": "rel-02",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "rel-inv-02"
            ],
            "polarity": "AFFIRMED",
            "relationType": "RELATED_TO_CANDIDATE",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem-02",
            "targetClientElementId": "elem-03"
          },
          {
            "clientRelationId": "rel-03",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "rel-inv-03"
            ],
            "polarity": "AFFIRMED",
            "relationType": "PRECEDES",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem-02",
            "targetClientElementId": "elem-04"
          },
          {
            "clientRelationId": "rel-04",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "rel-inv-04"
            ],
            "polarity": "NEGATED",
            "relationType": "EXCLUDES_FROM_ENDPOINT",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem-14",
            "targetClientElementId": "elem-10"
          },
          {
            "clientRelationId": "rel-05",
            "confidence": 1,
            "epistemicStatus": "EXPLICIT_USER_STATED",
            "inferenceReason": null,
            "inventoryRelationIds": [
              "rel-inv-05"
            ],
            "polarity": "CONDITIONAL",
            "relationType": "CONDITIONAL_ON",
            "requiresConfirmation": false,
            "sourceClientElementId": "elem-15",
            "targetClientElementId": "elem-11"
          }
        ],
        "routeProposal": {
          "confidence": 0.95,
          "expectedCapabilities": [
            "Définition de protocole multicentrique",
            "Gestion des contraintes de séquences d'imagerie",
            "Sélection des critères d'évaluation"
          ],
          "reason": "L'utilisateur définit les paramètres d'une étude multicentrique, incluant la population, les méthodes disponibles, les contraintes de matériel et les choix de critères.",
          "route": "DESIGN_STUDY"
        },
        "semanticInventory": {
          "explicitFragments": [
            {
              "inventoryItemId": "inv-01",
              "linkedInventoryItemIds": [
                "inv-02"
              ],
              "localRole": "action",
              "modifiers": [],
              "normalizedLabel": "Intention de détecter",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:T0",
              "sourceText": "détecter"
            },
            {
              "inventoryItemId": "inv-02",
              "linkedInventoryItemIds": [
                "inv-01",
                "inv-03",
                "inv-04"
              ],
              "localRole": "target",
              "modifiers": [
                "précoce"
              ],
              "normalizedLabel": "Atteinte cardiaque précoce",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:T0",
              "sourceText": "l'atteinte cardiaque précoce"
            },
            {
              "inventoryItemId": "inv-03",
              "linkedInventoryItemIds": [
                "inv-02"
              ],
              "localRole": "condition",
              "modifiers": [],
              "normalizedLabel": "Maladie de Fabry",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:T0",
              "sourceText": "Fabry"
            },
            {
              "inventoryItemId": "inv-04",
              "linkedInventoryItemIds": [
                "inv-02"
              ],
              "localRole": "reference_limit",
              "modifiers": [
                "visible"
              ],
              "normalizedLabel": "Fibrose visible",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:T0",
              "sourceText": "la fibrose visible"
            },
            {
              "inventoryItemId": "inv-05",
              "linkedInventoryItemIds": [
                "inv-06"
              ],
              "localRole": "study_design",
              "modifiers": [
                "multicentrique"
              ],
              "normalizedLabel": "Plusieurs centres",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:T0",
              "sourceText": "plusieurs centres"
            },
            {
              "inventoryItemId": "inv-06",
              "linkedInventoryItemIds": [
                "inv-05"
              ],
              "localRole": "method",
              "modifiers": [
                "variables"
              ],
              "normalizedLabel": "Séquences d'imagerie",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:T0",
              "sourceText": "séquences"
            },
            {
              "inventoryItemId": "inv-07",
              "linkedInventoryItemIds": [],
              "localRole": "method",
              "modifiers": [],
              "normalizedLabel": "Séquence ciné",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:R1",
              "sourceText": "cine"
            },
            {
              "inventoryItemId": "inv-08",
              "linkedInventoryItemIds": [],
              "localRole": "method",
              "modifiers": [
                "natif"
              ],
              "normalizedLabel": "Séquence T1 natif",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:R1",
              "sourceText": "T1 natif"
            },
            {
              "inventoryItemId": "inv-09",
              "linkedInventoryItemIds": [
                "inv-07",
                "inv-08"
              ],
              "localRole": "constraint",
              "modifiers": [],
              "normalizedLabel": "Disponibilité universelle de ciné et T1 natif",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:R1",
              "sourceText": "Tous les centres ont cine et T1 natif"
            },
            {
              "inventoryItemId": "inv-10",
              "linkedInventoryItemIds": [],
              "localRole": "method",
              "modifiers": [],
              "normalizedLabel": "Séquence T2",
              "polarity": "NEGATED",
              "sourceMessageId": "I04:R1",
              "sourceText": "T2"
            },
            {
              "inventoryItemId": "inv-11",
              "linkedInventoryItemIds": [
                "inv-10"
              ],
              "localRole": "constraint",
              "modifiers": [],
              "normalizedLabel": "Indisponibilité partielle du T2",
              "polarity": "NEGATED",
              "sourceMessageId": "I04:R1",
              "sourceText": "Non, le T2 n'est pas disponible partout"
            },
            {
              "inventoryItemId": "inv-12",
              "linkedInventoryItemIds": [],
              "localRole": "method",
              "modifiers": [],
              "normalizedLabel": "Séquence LGE",
              "polarity": "NEGATED",
              "sourceMessageId": "I04:R2",
              "sourceText": "LGE"
            },
            {
              "inventoryItemId": "inv-13",
              "linkedInventoryItemIds": [
                "inv-12"
              ],
              "localRole": "constraint",
              "modifiers": [],
              "normalizedLabel": "Indisponibilité partielle du LGE",
              "polarity": "NEGATED",
              "sourceMessageId": "I04:R2",
              "sourceText": "LGE n'est pas disponible partout non plus"
            },
            {
              "inventoryItemId": "inv-14",
              "linkedInventoryItemIds": [
                "inv-12"
              ],
              "localRole": "constraint",
              "modifiers": [],
              "normalizedLabel": "Exclusion du LGE comme critère principal",
              "polarity": "NEGATED",
              "sourceMessageId": "I04:R2",
              "sourceText": "je ne veux pas en faire le critère principal"
            },
            {
              "inventoryItemId": "inv-15",
              "linkedInventoryItemIds": [],
              "localRole": "biomarker",
              "modifiers": [],
              "normalizedLabel": "Paramètre ECV",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:R2",
              "sourceText": "ECV"
            },
            {
              "inventoryItemId": "inv-16",
              "linkedInventoryItemIds": [
                "inv-15"
              ],
              "localRole": "method_requirement",
              "modifiers": [],
              "normalizedLabel": "Agent de contraste",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:R2",
              "sourceText": "contraste"
            },
            {
              "inventoryItemId": "inv-17",
              "linkedInventoryItemIds": [
                "inv-15"
              ],
              "localRole": "biomarker_requirement",
              "modifiers": [],
              "normalizedLabel": "Paramètre hématocrite",
              "polarity": "AFFIRMED",
              "sourceMessageId": "I04:R2",
              "sourceText": "hématocrite"
            },
            {
              "inventoryItemId": "inv-18",
              "linkedInventoryItemIds": [
                "inv-15",
                "inv-16",
                "inv-17"
              ],
              "localRole": "constraint",
              "modifiers": [],
              "normalizedLabel": "Conditionnalité de l'ECV au contraste et à l'hématocrite",
              "polarity": "CONDITIONAL",
              "sourceMessageId": "I04:R2",
              "sourceText": "L'ECV est possible seulement si contraste et hématocrite sont disponibles"
            }
          ],
          "explicitRelations": [
            {
              "inventoryRelationId": "rel-inv-01",
              "normalizedRelation": "AIMS_TO_OBSERVE",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "inv-01",
              "sourceMessageId": "I04:T0",
              "sourceText": "détecter l'atteinte cardiaque précoce",
              "targetInventoryItemId": "inv-02"
            },
            {
              "inventoryRelationId": "rel-inv-02",
              "normalizedRelation": "RELATED_TO_CANDIDATE",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "inv-02",
              "sourceMessageId": "I04:T0",
              "sourceText": "l'atteinte cardiaque précoce dans Fabry",
              "targetInventoryItemId": "inv-03"
            },
            {
              "inventoryRelationId": "rel-inv-03",
              "normalizedRelation": "PRECEDES",
              "polarity": "AFFIRMED",
              "sourceInventoryItemId": "inv-02",
              "sourceMessageId": "I04:T0",
              "sourceText": "Je veux détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible.",
              "targetInventoryItemId": "inv-04"
            },
            {
              "inventoryRelationId": "rel-inv-04",
              "normalizedRelation": "EXCLUDES_FROM_ENDPOINT",
              "polarity": "NEGATED",
              "sourceInventoryItemId": "inv-14",
              "sourceMessageId": "I04:R2",
              "sourceText": "je ne veux pas en faire le critère principal",
              "targetInventoryItemId": "inv-12"
            },
            {
              "inventoryRelationId": "rel-inv-05",
              "normalizedRelation": "CONDITIONAL_ON",
              "polarity": "CONDITIONAL",
              "sourceInventoryItemId": "inv-18",
              "sourceMessageId": "I04:R2",
              "sourceText": "L'ECV est possible seulement si contraste et hématocrite sont disponibles",
              "targetInventoryItemId": "inv-15"
            }
          ]
        },
        "semanticWarnings": [
          "DETERMINISTIC_INVENTORY_RELATION_SOURCE_SPAN_DERIVED:1"
        ],
        "summaryForUser": "Intégration des contraintes sur le LGE (non disponible partout et exclu du critère principal) et sur l'ECV (conditionnel au contraste et à l'hématocrite).",
        "unknowns": []
      },
      "reconstructionAttempts": [
        {
          "attempt": 1,
          "category": null,
          "httpStatus": 200,
          "latencyMs": 12957,
          "outcome": "SUCCESS",
          "providerCode": null,
          "providerError": null,
          "providerStatus": null,
          "requestFinished": "2026-08-14T08:58:12.821Z",
          "requestStarted": "2026-08-14T08:57:59.864Z",
          "retryable": false
        }
      ],
      "reconstructionCallId": "gemini-call:ke1-763f15abe690d8c7",
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
          "normalizedMeaning": "Intention de détecter",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:T0",
          "sourceText": "détecter"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-02",
          "mappedClientElementIds": [
            "elem-02"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Atteinte cardiaque précoce",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:T0",
          "sourceText": "l'atteinte cardiaque précoce"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-03",
          "mappedClientElementIds": [
            "elem-03"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Maladie de Fabry",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:T0",
          "sourceText": "Fabry"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-04",
          "mappedClientElementIds": [
            "elem-04"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Fibrose visible",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:T0",
          "sourceText": "la fibrose visible"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-05",
          "mappedClientElementIds": [
            "elem-05"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Plusieurs centres",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:T0",
          "sourceText": "plusieurs centres"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-06",
          "mappedClientElementIds": [
            "elem-06"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Séquences d'imagerie",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:T0",
          "sourceText": "séquences"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-07",
          "mappedClientElementIds": [
            "elem-07"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Séquence ciné",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R1",
          "sourceText": "cine"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-08",
          "mappedClientElementIds": [
            "elem-08"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Séquence T1 natif",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R1",
          "sourceText": "T1 natif"
        },
        {
          "coverageStatus": "UNRESOLVED_EXPLICIT_FRAGMENT",
          "inventoryItemId": "inv-09",
          "mappedClientElementIds": [],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Disponibilité universelle de ciné et T1 natif",
          "reason": "The exact inventory fragment has no source-grounded typed Semantic Element mapping.",
          "sourceMessageId": "I04:R1",
          "sourceText": "Tous les centres ont cine et T1 natif"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-10",
          "mappedClientElementIds": [
            "elem-09"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Séquence T2",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R1",
          "sourceText": "T2"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-11",
          "mappedClientElementIds": [
            "elem-09"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Indisponibilité partielle du T2",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R1",
          "sourceText": "Non, le T2 n'est pas disponible partout"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-12",
          "mappedClientElementIds": [
            "elem-10"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Séquence LGE",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R2",
          "sourceText": "LGE"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-13",
          "mappedClientElementIds": [
            "elem-10"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Indisponibilité partielle du LGE",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R2",
          "sourceText": "LGE n'est pas disponible partout non plus"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-14",
          "mappedClientElementIds": [
            "elem-14"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Exclusion du LGE comme critère principal",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R2",
          "sourceText": "je ne veux pas en faire le critère principal"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-15",
          "mappedClientElementIds": [
            "elem-11"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Paramètre ECV",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R2",
          "sourceText": "ECV"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-16",
          "mappedClientElementIds": [
            "elem-12"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Agent de contraste",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R2",
          "sourceText": "contraste"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-17",
          "mappedClientElementIds": [
            "elem-13"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Paramètre hématocrite",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R2",
          "sourceText": "hématocrite"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryItemId": "inv-18",
          "mappedClientElementIds": [
            "elem-15"
          ],
          "mappedClientRelationIds": [],
          "normalizedMeaning": "Conditionnalité de l'ECV au contraste et à l'hématocrite",
          "reason": "At least one source-grounded typed Semantic Element explicitly references this exact inventory fragment.",
          "sourceMessageId": "I04:R2",
          "sourceText": "L'ECV est possible seulement si contraste et hématocrite sont disponibles"
        }
      ],
      "status": "INCOMPLETE"
    },
    "history": [
      {
        "changeReason": "Nouvelle contribution utilisateur analysée sans réécriture de l’état antérieur.",
        "changedAt": "2026-08-14T08:55:01.714Z",
        "digest": "ke1-bd7c8f5d65849be1",
        "modelId": "semantic-model:ke1-da08c2369de0224a",
        "revision": 1,
        "status": "CANDIDATE"
      },
      {
        "changeReason": "Nouvelle contribution utilisateur analysée sans réécriture de l’état antérieur.",
        "changedAt": "2026-08-14T08:55:32.851Z",
        "digest": "ke1-b4d714bc3bc7cc90",
        "modelId": "semantic-model:ke1-b7407e195aecf295",
        "revision": 2,
        "status": "CLARIFICATION_REQUIRED"
      }
    ],
    "knowledgeRequests": [],
    "knowledgeSnapshot": null,
    "missingConcepts": [
      "Critère d'évaluation principal retenu pour l'étude"
    ],
    "normalizedMeaning": "Détection d'une atteinte cardiaque précoce dans la maladie de Fabry avant la fibrose visible, dans le cadre d'une étude multicentrique avec des disponibilités hétérogènes de séquences (ciné et T1 natif universels, T2 et LGE non disponibles partout et non retenus comme critères principaux, ECV conditionné au contraste et à l'hématocrite).",
    "originalRequest": "Je veux détecter l'atteinte cardiaque précoce dans Fabry avant la fibrose visible. On a plusieurs centres et tout le monde n'a pas les mêmes séquences.",
    "previousModelId": "semantic-model:ke1-b7407e195aecf295",
    "relationCoverageReport": {
      "entries": [
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel-inv-01",
          "mappedClientRelationIds": [
            "rel-01"
          ],
          "normalizedRelation": "AIMS_TO_OBSERVE",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv-01",
          "targetInventoryItemId": "inv-02"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel-inv-02",
          "mappedClientRelationIds": [
            "rel-02"
          ],
          "normalizedRelation": "RELATED_TO_CANDIDATE",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv-02",
          "targetInventoryItemId": "inv-03"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel-inv-03",
          "mappedClientRelationIds": [
            "rel-03"
          ],
          "normalizedRelation": "PRECEDES",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv-02",
          "targetInventoryItemId": "inv-04"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel-inv-04",
          "mappedClientRelationIds": [
            "rel-04"
          ],
          "normalizedRelation": "EXCLUDES_FROM_ENDPOINT",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv-14",
          "targetInventoryItemId": "inv-12"
        },
        {
          "coverageStatus": "MAPPED",
          "inventoryRelationId": "rel-inv-05",
          "mappedClientRelationIds": [
            "rel-05"
          ],
          "normalizedRelation": "CONDITIONAL_ON",
          "reason": "At least one direct Semantic Relation explicitly references this exact relational span.",
          "sourceInventoryItemId": "inv-18",
          "targetInventoryItemId": "inv-15"
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
          "rel-inv-05"
        ],
        "polarity": "CONDITIONAL",
        "relationType": "CONDITIONAL_ON",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-0d8ca738a76e68e4",
        "sourceElementId": "sem-element:ke1-e83966ddca236211",
        "targetElementId": "sem-element:ke1-03899c9631139b72",
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
        "relationType": "PRECEDES",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-19b53722bc21738e",
        "sourceElementId": "sem-element:ke1-b01a8aba7016e06e",
        "targetElementId": "sem-element:ke1-109b7e05a8777951",
        "version": 3,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel-inv-01"
        ],
        "polarity": "AFFIRMED",
        "relationType": "AIMS_TO_OBSERVE",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-69bc53a9548f7245",
        "sourceElementId": "sem-element:ke1-30b41340624f207c",
        "targetElementId": "sem-element:ke1-b01a8aba7016e06e",
        "version": 3,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel-inv-04"
        ],
        "polarity": "NEGATED",
        "relationType": "EXCLUDES_FROM_ENDPOINT",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-73a64eee72fe84d2",
        "sourceElementId": "sem-element:ke1-5b813a58121a9de4",
        "targetElementId": "sem-element:ke1-e84d65e81331d27c",
        "version": 1,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      },
      {
        "confidence": 1,
        "epistemicStatus": "EXPLICIT_USER_STATED",
        "inferenceReason": null,
        "inventoryRelationIds": [
          "rel-inv-02"
        ],
        "polarity": "AFFIRMED",
        "relationType": "RELATED_TO_CANDIDATE",
        "requiresConfirmation": false,
        "semanticRelationId": "sem-relation:ke1-8452cd6d33e50e29",
        "sourceElementId": "sem-element:ke1-b01a8aba7016e06e",
        "targetElementId": "sem-element:ke1-b4c3c91b3ce8d0af",
        "version": 3,
        "vocabularyStatus": "RUNTIME_CANDIDATE_RELATION"
      }
    ],
    "revision": 3,
    "routeProposal": {
      "confidence": 0.95,
      "expectedCapabilities": [
        "Définition de protocole multicentrique",
        "Gestion des contraintes de séquences d'imagerie",
        "Sélection des critères d'évaluation"
      ],
      "reason": "L'utilisateur définit les paramètres d'une étude multicentrique, incluant la population, les méthodes disponibles, les contraintes de matériel et les choix de critères.",
      "route": "DESIGN_STUDY"
    },
    "semanticModelId": "semantic-model:ke1-6dea7b3b42f4975f",
    "semanticModelVersion": "1.1",
    "status": "CLARIFICATION_REQUIRED",
    "summaryForUser": "Intégration des contraintes sur le LGE (non disponible partout et exclu du critère principal) et sur l'ECV (conditionnel au contraste et à l'hématocrite).",
    "unknowns": [],
    "updatedAt": "2026-08-14T08:58:12.847Z"
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

Détection d'une atteinte cardiaque précoce dans la maladie de Fabry avant la fibrose visible, dans le cadre d'une étude multicentrique avec des disponibilités hétérogènes de séquences (ciné et T1 natif universels, T2 et LGE non disponibles partout et non retenus comme critères principaux, ECV conditionné au contraste et à l'hématocrite).

Objectif scientifique produit :

Intention de détecter l'atteinte cardiaque précoce

### EXPLICITEMENT DIT PAR LE CHERCHEUR

- content=Paramètre ECV | scientificRole=BIOMARKER:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=ECV | provenanceTurnIds=["I04:R2"]
- content=Séquence T1 natif | scientificRole=METHOD:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=T1 natif | provenanceTurnIds=["I04:R1"]
- content=Fibrose visible | scientificRole=SCIENTIFIC_OBJECT:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=la fibrose visible | provenanceTurnIds=["I04:T0"]
- content=Séquences d'imagerie variables selon les centres | scientificRole=METHOD:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=séquences | provenanceTurnIds=["I04:T0"]
- content=Intention de détecter l'atteinte cardiaque précoce | scientificRole=SCIENTIFIC_INTENT:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=détecter | provenanceTurnIds=["I04:T0"]
- content=Séquence T2 | scientificRole=METHOD:MEASUREMENT | polarity=NEGATED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=T2 | provenanceTurnIds=["I04:R1"]
- content=Agent de contraste | scientificRole=METHOD:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=contraste | provenanceTurnIds=["I04:R2"]
- content=Paramètre hématocrite | scientificRole=BIOMARKER:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=hématocrite | provenanceTurnIds=["I04:R2"]
- content=Exclusion du LGE comme critère principal | scientificRole=CONSTRAINT:NONE | polarity=NEGATED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=je ne veux pas en faire le critère principal | provenanceTurnIds=["I04:R2"]
- content=Atteinte cardiaque précoce | scientificRole=OUTCOME:OUTCOME_ROLE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=l'atteinte cardiaque précoce | provenanceTurnIds=["I04:T0"]
- content=Maladie de Fabry | scientificRole=CONDITION:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=Fabry | provenanceTurnIds=["I04:T0"]
- content=Séquence ciné | scientificRole=METHOD:MEASUREMENT | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=cine | provenanceTurnIds=["I04:R1"]
- content=Étude multicentrique impliquant plusieurs centres | scientificRole=STUDY_DESIGN:NONE | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=plusieurs centres | provenanceTurnIds=["I04:T0"]
- content=Conditionnalité de l'ECV au contraste et à l'hématocrite | scientificRole=CONSTRAINT:NONE | polarity=CONDITIONAL | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=L'ECV est possible seulement si contraste et hématocrite sont disponibles | provenanceTurnIds=["I04:R2"]
- content=Séquence LGE | scientificRole=METHOD:MEASUREMENT | polarity=NEGATED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=LGE | provenanceTurnIds=["I04:R2"]

### RELATIONS COMPRISES

- subject=Conditionnalité de l'ECV au contraste et à l'hématocrite | predicate=CONDITIONAL_ON | object=Paramètre ECV | polarity=CONDITIONAL | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Atteinte cardiaque précoce | predicate=PRECEDES | object=Fibrose visible | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Intention de détecter l'atteinte cardiaque précoce | predicate=AIMS_TO_OBSERVE | object=Atteinte cardiaque précoce | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Exclusion du LGE comme critère principal | predicate=EXCLUDES_FROM_ENDPOINT | object=Séquence LGE | polarity=NEGATED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER
- subject=Atteinte cardiaque précoce | predicate=RELATED_TO_CANDIDATE | object=Maladie de Fabry | polarity=AFFIRMED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER

### CONTEXTE INFÉRÉ

- Aucun élément produit.

### CANDIDATS SCIENTIFIQUES CONTEXTUELS

- Aucun élément produit.

### NÉGATIONS / CONTRAINTES

- content=Séquence T2 | scientificRole=METHOD:MEASUREMENT | polarity=NEGATED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=T2 | provenanceTurnIds=["I04:R1"]
- content=Exclusion du LGE comme critère principal | scientificRole=CONSTRAINT:NONE | polarity=NEGATED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=je ne veux pas en faire le critère principal | provenanceTurnIds=["I04:R2"]
- content=Conditionnalité de l'ECV au contraste et à l'hématocrite | scientificRole=CONSTRAINT:NONE | polarity=CONDITIONAL | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=L'ECV est possible seulement si contraste et hématocrite sont disponibles | provenanceTurnIds=["I04:R2"]
- content=Séquence LGE | scientificRole=METHOD:MEASUREMENT | polarity=NEGATED | epistemicStatus=EXPLICIT_USER_STATED | ownership=USER | sourceText=LGE | provenanceTurnIds=["I04:R2"]

### TEMPORALITÉ

- Aucun élément produit.

### AMBIGUÏTÉS

- content=Disponibilité hétérogène des séquences avancées entre les centres (Ciné et T1 natif universels, T2 et LGE absents de certains centres, ECV conditionnel). | epistemicStatus=AMBIGUOUS | decisionImpact=SEM reports an unresolved ambiguity; impact requires clarification.

### INFORMATIONS MANQUANTES

- content=Critère d'évaluation principal retenu pour l'étude | owner=USER_OR_SPECIALIZED_OWNER_UNRESOLVED | priority=HIGH | blocking=oui | decisionImpact=SEM reports missing or unresolved information.

### INCONNUES

- content=Critère d'évaluation principal retenu pour l'étude | owner=USER_OR_SPECIALIZED_OWNER_UNRESOLVED | priority=HIGH | blocking=oui | decisionImpact=SEM reports missing or unresolved information.

### CORRECTIONS / SUPERSESSIONS

- Aucun élément produit.

### OWNERSHIP / STATUT ÉPISTÉMIQUE

- content=Paramètre ECV | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:R2"]
- content=Séquence T1 natif | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:R1"]
- content=Fibrose visible | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:T0"]
- content=Séquences d'imagerie variables selon les centres | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:T0"]
- content=Intention de détecter l'atteinte cardiaque précoce | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:T0"]
- content=Séquence T2 | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:R1"]
- content=Agent de contraste | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:R2"]
- content=Paramètre hématocrite | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:R2"]
- content=Exclusion du LGE comme critère principal | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:R2"]
- content=Atteinte cardiaque précoce | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:T0"]
- content=Maladie de Fabry | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:T0"]
- content=Séquence ciné | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:R1"]
- content=Étude multicentrique impliquant plusieurs centres | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:T0"]
- content=Conditionnalité de l'ECV au contraste et à l'hématocrite | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:R2"]
- content=Séquence LGE | epistemicStatus=EXPLICIT_USER_STATED | owner=USER | provenanceTurnIds=["I04:R2"]

### QUESTIONS DE CLARIFICATION CANDIDATES

- question=Quel est le critère d'évaluation principal retenu pour l'étude multicentrique en l'absence de disponibilité universelle du T2 et du LGE ? | priority=HIGH | blocking=oui | decisionImpact=Le LGE est exclu comme critère principal et le T2 n'est pas disponible partout, laissant le choix du critère principal ouvert. | targetIds=["sem-element:ke1-03899c9631139b72", "sem-element:ke1-0686fb334b9349d7", "sem-element:ke1-b01a8aba7016e06e", "sem-element:ke1-d66bf74598ad7959", "sem-element:ke1-e84d65e81331d27c"]

## MISSING STRUCTURAL GUARANTEES

- EXACT_PROVIDER_RAW_TEXT_NOT_PERSISTED; STRUCTURED_NATIVE_ARTIFACT_AVAILABLE

_Vue locale déterministe. Aucun appel LLM d’interprétation sémantique post-hoc._
