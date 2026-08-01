import type { ScientificExplorerData } from "./types";

const scientificExplorerData: ScientificExplorerData = {
  "assertions": [
    {
      "assertionType": "EntityObjectAssertion",
      "conceptIds": [
        "noxia:radiology:scientific-concept:segmentation:inter-annotator-agreement",
        "noxia:radiology:scientific-concept:segmentation:reference-annotation"
      ],
      "confidence": "HIGH",
      "contexts": [
        {
          "dimension": "modality",
          "label": "Modality",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "population",
          "label": "Population",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "manufacturer",
          "label": "Manufacturer",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "software",
          "label": "Software",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        }
      ],
      "evidenceLinkIds": [
        "noxia:radiology:evidence-link:continuous-wave:segmentation:agreement-assessment-needed"
      ],
      "evidenceQuality": "METHOD_STUDY",
      "evidenceTypeKey": "METHOD_STUDY",
      "humanReviewed": false,
      "id": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:agreement-assessment-needed:revision:1",
      "limitations": [],
      "metricKeys": [
        "inter-annotator-agreement"
      ],
      "modalityIds": [],
      "objectId": "noxia:radiology:scientific-concept:segmentation:reference-annotation",
      "objectLabel": "Annotation de référence",
      "polarity": "POSITIVE",
      "predicate": "SHOULD_BE_ASSESSED_FOR",
      "reviewState": "PROVENANCE_REVIEWED",
      "scientificMaturity": "PEER_REVIEWED_RESULT",
      "statementText": "Agreement between annotators should be assessed because annotation subjectivity and variability affect the stability and reproducibility of segmentation evaluation.",
      "status": "PROVENANCE_REVIEWED",
      "subjectId": "noxia:radiology:scientific-concept:segmentation:inter-annotator-agreement",
      "subjectLabel": "Accord inter-annotateurs",
      "taskKeys": []
    },
    {
      "assertionType": "LiteralValueAssertion",
      "conceptIds": [
        "noxia:radiology:scientific-concept:segmentation:task-generalizability"
      ],
      "confidence": "HIGH",
      "contexts": [
        {
          "dimension": "modality",
          "label": "Modality",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "population",
          "label": "Population",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "manufacturer",
          "label": "Manufacturer",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "software",
          "label": "Software",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        }
      ],
      "evidenceLinkIds": [
        "noxia:radiology:evidence-link:continuous-wave:segmentation:benchmark-heterogeneity-and-rater-limit"
      ],
      "evidenceQuality": "MULTITASK_BENCHMARK",
      "evidenceTypeKey": "MULTITASK_BENCHMARK",
      "humanReviewed": false,
      "id": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:benchmark-heterogeneity-and-rater-limit:revision:1",
      "limitations": [
        {
          "id": "HETEROGENEOUS_PROTOCOLS",
          "label": "Heterogeneous protocols"
        },
        {
          "id": "SINGLE_RATER_REFERENCE",
          "label": "Single rater reference"
        }
      ],
      "metricKeys": [],
      "modalityIds": [],
      "objectId": null,
      "objectLabel": "Benchmark design",
      "polarity": "QUALIFIED",
      "predicate": "IS_QUALIFIED_BY",
      "reviewState": "QUALIFIED",
      "scientificMaturity": "PEER_REVIEWED_RESULT",
      "statementText": "Benchmark interpretation depends on source heterogeneity, acquisition protocols and annotation design; a single-rater reference remains a documented limitation.",
      "status": "QUALIFIED",
      "subjectId": "noxia:radiology:scientific-concept:segmentation:task-generalizability",
      "subjectLabel": "Généralisabilité entre tâches",
      "taskKeys": []
    },
    {
      "assertionType": "LiteralValueAssertion",
      "conceptIds": [
        "noxia:radiology:scientific-concept:segmentation:inter-annotator-agreement"
      ],
      "confidence": "HIGH",
      "contexts": [
        {
          "dimension": "modality",
          "label": "Modality",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "population",
          "label": "Population",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "manufacturer",
          "label": "Manufacturer",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "software",
          "label": "Software",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        }
      ],
      "evidenceLinkIds": [
        "noxia:radiology:evidence-link:continuous-wave:segmentation:consensus-plus-metrics-characterizes-variability"
      ],
      "evidenceQuality": "METHOD_STUDY",
      "evidenceTypeKey": "METHOD_STUDY",
      "humanReviewed": false,
      "id": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:consensus-plus-metrics-characterizes-variability:revision:1",
      "limitations": [
        {
          "id": "METRIC_SET_REMAINS_TASK_DEPENDENT",
          "label": "Metric set remains task dependent"
        }
      ],
      "metricKeys": [
        "inter-annotator-agreement"
      ],
      "modalityIds": [],
      "objectId": null,
      "objectLabel": "Consensus and performance metrics",
      "polarity": "POSITIVE",
      "predicate": "CAN_BE_CHARACTERIZED_BY",
      "reviewState": "PROVENANCE_REVIEWED",
      "scientificMaturity": "PEER_REVIEWED_RESULT",
      "statementText": "A consensus reference estimate combined with overlap and classification metrics can characterize variation among multiple annotations.",
      "status": "PROVENANCE_REVIEWED",
      "subjectId": "noxia:radiology:scientific-concept:segmentation:inter-annotator-agreement",
      "subjectLabel": "Accord inter-annotateurs",
      "taskKeys": []
    },
    {
      "assertionType": "LiteralValueAssertion",
      "conceptIds": [
        "noxia:radiology:scientific-concept:segmentation:dice-similarity-coefficient"
      ],
      "confidence": "HIGH",
      "contexts": [
        {
          "dimension": "modality",
          "label": "Modality",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "population",
          "label": "Population",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "manufacturer",
          "label": "Manufacturer",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "software",
          "label": "Software",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        }
      ],
      "evidenceLinkIds": [
        "noxia:radiology:evidence-link:continuous-wave:segmentation:dice-limited-small-structures"
      ],
      "evidenceQuality": "CONSENSUS_RECOMMENDATIONS",
      "evidenceTypeKey": "CONSENSUS_RECOMMENDATIONS",
      "humanReviewed": false,
      "id": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:dice-limited-small-structures:revision:1",
      "limitations": [
        {
          "id": "SHAPE_INFORMATION_LIMITED",
          "label": "Shape information limited"
        },
        {
          "id": "SMALL_STRUCTURE_SENSITIVITY",
          "label": "Small structure sensitivity"
        }
      ],
      "metricKeys": [
        "dice-similarity-coefficient"
      ],
      "modalityIds": [],
      "objectId": null,
      "objectLabel": "Small structure sensitivity",
      "polarity": "QUALIFIED",
      "predicate": "HAS_LIMITATION",
      "reviewState": "QUALIFIED",
      "scientificMaturity": "PEER_REVIEWED_RESULT",
      "statementText": "Dice-based overlap assessment has documented limitations for small structures and should be qualified by object size and complementary spatial information.",
      "status": "QUALIFIED",
      "subjectId": "noxia:radiology:scientific-concept:segmentation:dice-similarity-coefficient",
      "subjectLabel": "Coefficient de similarité de Dice",
      "taskKeys": []
    },
    {
      "assertionType": "LiteralValueAssertion",
      "conceptIds": [
        "noxia:radiology:scientific-concept:segmentation:medical-image-segmentation"
      ],
      "confidence": "HIGH",
      "contexts": [
        {
          "dimension": "modality",
          "label": "Modality",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "population",
          "label": "Population",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "manufacturer",
          "label": "Manufacturer",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "software",
          "label": "Software",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        }
      ],
      "evidenceLinkIds": [
        "noxia:radiology:evidence-link:continuous-wave:segmentation:hierarchical-aggregation-required"
      ],
      "evidenceQuality": "CONSENSUS_RECOMMENDATIONS",
      "evidenceTypeKey": "CONSENSUS_RECOMMENDATIONS",
      "humanReviewed": false,
      "id": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:hierarchical-aggregation-required:revision:1",
      "limitations": [],
      "metricKeys": [],
      "modalityIds": [],
      "objectId": null,
      "objectLabel": "Hierarchy aware aggregation",
      "polarity": "POSITIVE",
      "predicate": "REQUIRES",
      "reviewState": "PROVENANCE_REVIEWED",
      "scientificMaturity": "DELPHI_FRAMEWORK_RECOMMENDATION",
      "statementText": "Per-image metric values should be aggregated while respecting nested data structures such as multiple images per patient or patients per institution.",
      "status": "PROVENANCE_REVIEWED",
      "subjectId": "noxia:radiology:scientific-concept:segmentation:medical-image-segmentation",
      "subjectLabel": "Segmentation d'image médicale",
      "taskKeys": [
        "medical-image-segmentation"
      ]
    },
    {
      "assertionType": "LiteralValueAssertion",
      "conceptIds": [
        "noxia:radiology:scientific-concept:segmentation:medical-image-segmentation"
      ],
      "confidence": "HIGH",
      "contexts": [
        {
          "dimension": "modality",
          "label": "Modality",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "population",
          "label": "Population",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "manufacturer",
          "label": "Manufacturer",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "software",
          "label": "Software",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        }
      ],
      "evidenceLinkIds": [
        "noxia:radiology:evidence-link:continuous-wave:segmentation:metric-selection-follows-segmentation-properties"
      ],
      "evidenceQuality": "METHOD_ANALYSIS",
      "evidenceTypeKey": "METHOD_ANALYSIS",
      "humanReviewed": false,
      "id": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:metric-selection-follows-segmentation-properties:revision:1",
      "limitations": [],
      "metricKeys": [],
      "modalityIds": [],
      "objectId": null,
      "objectLabel": "Segmentation properties",
      "polarity": "POSITIVE",
      "predicate": "REQUIRES_CONSIDERATION_OF",
      "reviewState": "PROVENANCE_REVIEWED",
      "scientificMaturity": "PEER_REVIEWED_RESULT",
      "statementText": "Metric selection should account for the properties of the segmentations under evaluation and the sensitivities of candidate metrics.",
      "status": "PROVENANCE_REVIEWED",
      "subjectId": "noxia:radiology:scientific-concept:segmentation:medical-image-segmentation",
      "subjectLabel": "Segmentation d'image médicale",
      "taskKeys": [
        "medical-image-segmentation"
      ]
    },
    {
      "assertionType": "LiteralValueAssertion",
      "conceptIds": [
        "noxia:radiology:scientific-concept:segmentation:medical-image-segmentation"
      ],
      "confidence": "HIGH",
      "contexts": [
        {
          "dimension": "modality",
          "label": "Modality",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "population",
          "label": "Population",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "manufacturer",
          "label": "Manufacturer",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "software",
          "label": "Software",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        }
      ],
      "evidenceLinkIds": [
        "noxia:radiology:evidence-link:continuous-wave:segmentation:multiple-complementary-metrics"
      ],
      "evidenceQuality": "CONSENSUS_RECOMMENDATIONS",
      "evidenceTypeKey": "CONSENSUS_RECOMMENDATIONS",
      "humanReviewed": false,
      "id": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:multiple-complementary-metrics:revision:1",
      "limitations": [],
      "metricKeys": [],
      "modalityIds": [],
      "objectId": null,
      "objectLabel": "Multiple complementary metrics",
      "polarity": "POSITIVE",
      "predicate": "SHOULD_BE_EVALUATED_WITH",
      "reviewState": "PROVENANCE_REVIEWED",
      "scientificMaturity": "DELPHI_FRAMEWORK_RECOMMENDATION",
      "statementText": "A complex segmentation task generally requires several complementary metrics because one metric cannot represent every relevant validation property.",
      "status": "PROVENANCE_REVIEWED",
      "subjectId": "noxia:radiology:scientific-concept:segmentation:medical-image-segmentation",
      "subjectLabel": "Segmentation d'image médicale",
      "taskKeys": [
        "medical-image-segmentation"
      ]
    },
    {
      "assertionType": "LiteralValueAssertion",
      "conceptIds": [
        "noxia:radiology:scientific-concept:segmentation:medical-image-segmentation"
      ],
      "confidence": "HIGH",
      "contexts": [
        {
          "dimension": "modality",
          "label": "Modality",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "population",
          "label": "Population",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "manufacturer",
          "label": "Manufacturer",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "software",
          "label": "Software",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        }
      ],
      "evidenceLinkIds": [
        "noxia:radiology:evidence-link:continuous-wave:segmentation:problem-fingerprint-guides-metrics"
      ],
      "evidenceQuality": "CONSENSUS_RECOMMENDATIONS",
      "evidenceTypeKey": "CONSENSUS_RECOMMENDATIONS",
      "humanReviewed": false,
      "id": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:problem-fingerprint-guides-metrics:revision:1",
      "limitations": [],
      "metricKeys": [],
      "modalityIds": [],
      "objectId": null,
      "objectLabel": "Task specific problem fingerprint",
      "polarity": "POSITIVE",
      "predicate": "REQUIRES_METRIC_SELECTION_FROM",
      "reviewState": "PROVENANCE_REVIEWED",
      "scientificMaturity": "DELPHI_FRAMEWORK_RECOMMENDATION",
      "statementText": "Validation metrics should be selected from the properties and pitfalls of the specific image-analysis problem rather than from a universal default metric.",
      "status": "PROVENANCE_REVIEWED",
      "subjectId": "noxia:radiology:scientific-concept:segmentation:medical-image-segmentation",
      "subjectLabel": "Segmentation d'image médicale",
      "taskKeys": [
        "medical-image-segmentation"
      ]
    },
    {
      "assertionType": "NegativeAssertion",
      "conceptIds": [
        "noxia:radiology:scientific-concept:segmentation:task-generalizability"
      ],
      "confidence": "HIGH",
      "contexts": [
        {
          "dimension": "modality",
          "label": "Modality",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "population",
          "label": "Population",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "manufacturer",
          "label": "Manufacturer",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "software",
          "label": "Software",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        }
      ],
      "evidenceLinkIds": [
        "noxia:radiology:evidence-link:continuous-wave:segmentation:single-task-performance-not-generalization"
      ],
      "evidenceQuality": "MULTITASK_BENCHMARK",
      "evidenceTypeKey": "MULTITASK_BENCHMARK",
      "humanReviewed": false,
      "id": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:single-task-performance-not-generalization:revision:1",
      "limitations": [
        {
          "id": "SINGLE_TASK_EVIDENCE",
          "label": "Single task evidence"
        }
      ],
      "metricKeys": [],
      "modalityIds": [],
      "objectId": null,
      "objectLabel": "Single task performance",
      "polarity": "NEGATIVE",
      "predicate": "IS_NOT_ESTABLISHED_BY",
      "reviewState": "QUALIFIED",
      "scientificMaturity": "PEER_REVIEWED_RESULT",
      "statementText": "Strong performance on one segmentation problem does not by itself establish generalization to an unseen task.",
      "status": "QUALIFIED",
      "subjectId": "noxia:radiology:scientific-concept:segmentation:task-generalizability",
      "subjectLabel": "Généralisabilité entre tâches",
      "taskKeys": []
    },
    {
      "assertionType": "LiteralValueAssertion",
      "conceptIds": [
        "noxia:radiology:scientific-concept:segmentation:staple-consensus"
      ],
      "confidence": "HIGH",
      "contexts": [
        {
          "dimension": "modality",
          "label": "Modality",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "population",
          "label": "Population",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "manufacturer",
          "label": "Manufacturer",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "software",
          "label": "Software",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        }
      ],
      "evidenceLinkIds": [
        "noxia:radiology:evidence-link:continuous-wave:segmentation:staple-input-performance"
      ],
      "evidenceQuality": "METHOD_VALIDATION",
      "evidenceTypeKey": "METHOD_VALIDATION",
      "humanReviewed": false,
      "id": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:staple-input-performance:revision:1",
      "limitations": [],
      "metricKeys": [],
      "modalityIds": [],
      "objectId": null,
      "objectLabel": "Input segmentation performance",
      "polarity": "POSITIVE",
      "predicate": "ESTIMATES",
      "reviewState": "PROVENANCE_REVIEWED",
      "scientificMaturity": "METHOD_VALIDATION",
      "statementText": "STAPLE jointly estimates a performance level for each input segmentation while estimating the probabilistic reference.",
      "status": "PROVENANCE_REVIEWED",
      "subjectId": "noxia:radiology:scientific-concept:segmentation:staple-consensus",
      "subjectLabel": "Estimation consensuelle STAPLE",
      "taskKeys": [
        "staple-consensus"
      ]
    },
    {
      "assertionType": "EntityObjectAssertion",
      "conceptIds": [
        "noxia:radiology:scientific-concept:segmentation:reference-annotation",
        "noxia:radiology:scientific-concept:segmentation:staple-consensus"
      ],
      "confidence": "HIGH",
      "contexts": [
        {
          "dimension": "modality",
          "label": "Modality",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "population",
          "label": "Population",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "manufacturer",
          "label": "Manufacturer",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "software",
          "label": "Software",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        }
      ],
      "evidenceLinkIds": [
        "noxia:radiology:evidence-link:continuous-wave:segmentation:staple-probabilistic-reference"
      ],
      "evidenceQuality": "METHOD_VALIDATION",
      "evidenceTypeKey": "METHOD_VALIDATION",
      "humanReviewed": false,
      "id": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:staple-probabilistic-reference:revision:1",
      "limitations": [
        {
          "id": "PROBABILISTIC_REFERENCE_NOT_ERROR_FREE_TRUTH",
          "label": "Probabilistic reference not error free truth"
        }
      ],
      "metricKeys": [],
      "modalityIds": [],
      "objectId": "noxia:radiology:scientific-concept:segmentation:reference-annotation",
      "objectLabel": "Annotation de référence",
      "polarity": "POSITIVE",
      "predicate": "ESTIMATES",
      "reviewState": "PROVENANCE_REVIEWED",
      "scientificMaturity": "METHOD_VALIDATION",
      "statementText": "STAPLE estimates a probabilistic reference segmentation from a collection of input segmentations rather than asserting an error-free ground truth.",
      "status": "PROVENANCE_REVIEWED",
      "subjectId": "noxia:radiology:scientific-concept:segmentation:staple-consensus",
      "subjectLabel": "Estimation consensuelle STAPLE",
      "taskKeys": [
        "staple-consensus"
      ]
    },
    {
      "assertionType": "LiteralValueAssertion",
      "conceptIds": [
        "noxia:radiology:scientific-concept:segmentation:overlap-metric"
      ],
      "confidence": "HIGH",
      "contexts": [
        {
          "dimension": "modality",
          "label": "Modality",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "population",
          "label": "Population",
          "operator": "NOT_APPLICABLE",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "manufacturer",
          "label": "Manufacturer",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        },
        {
          "dimension": "software",
          "label": "Software",
          "operator": "UNKNOWN",
          "unknown": null,
          "value": null
        }
      ],
      "evidenceLinkIds": [
        "noxia:radiology:evidence-link:continuous-wave:segmentation:zero-overlap-distance-information"
      ],
      "evidenceQuality": "METHOD_ANALYSIS",
      "evidenceTypeKey": "METHOD_ANALYSIS",
      "humanReviewed": false,
      "id": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:zero-overlap-distance-information:revision:1",
      "limitations": [
        {
          "id": "ZERO_OVERLAP_SPATIAL_INFORMATION_LOST",
          "label": "Zero overlap spatial information lost"
        }
      ],
      "metricKeys": [],
      "modalityIds": [],
      "objectId": null,
      "objectLabel": "Spatial distance at zero overlap",
      "polarity": "QUALIFIED",
      "predicate": "DOES_NOT_RETAIN",
      "reviewState": "QUALIFIED",
      "scientificMaturity": "PEER_REVIEWED_RESULT",
      "statementText": "When two segmentations have no overlap, overlap metrics return the same zero value regardless of their separation, whereas distance metrics retain spatial information.",
      "status": "QUALIFIED",
      "subjectId": "noxia:radiology:scientific-concept:segmentation:overlap-metric",
      "subjectLabel": "Métrique de recouvrement",
      "taskKeys": []
    }
  ],
  "concepts": [
    {
      "assertionCount": 4,
      "description": "Délimitation ou attribution de classes à des régions d'une image médicale.",
      "id": "noxia:radiology:scientific-concept:segmentation:medical-image-segmentation",
      "key": "medical-image-segmentation",
      "label": "Segmentation d'image médicale",
      "type": "SoftwareMethod"
    },
    {
      "assertionCount": 2,
      "description": "Accord observé entre plusieurs annotations indépendantes d'une même cible de segmentation.",
      "id": "noxia:radiology:scientific-concept:segmentation:inter-annotator-agreement",
      "key": "inter-annotator-agreement",
      "label": "Accord inter-annotateurs",
      "type": "QualityMetric"
    },
    {
      "assertionCount": 2,
      "description": "Annotation utilisée comme référence explicite pour l'évaluation d'une segmentation, avec ses incertitudes et sa provenance.",
      "id": "noxia:radiology:scientific-concept:segmentation:reference-annotation",
      "key": "reference-annotation",
      "label": "Annotation de référence",
      "type": "Observation"
    },
    {
      "assertionCount": 2,
      "description": "Estimation probabiliste d'une segmentation de référence et des performances des segmentations d'entrée.",
      "id": "noxia:radiology:scientific-concept:segmentation:staple-consensus",
      "key": "staple-consensus",
      "label": "Estimation consensuelle STAPLE",
      "type": "SoftwareMethod"
    },
    {
      "assertionCount": 2,
      "description": "Capacité documentée d'une méthode à conserver des performances sur des tâches ou jeux de données distincts de son contexte initial.",
      "id": "noxia:radiology:scientific-concept:segmentation:task-generalizability",
      "key": "task-generalizability",
      "label": "Généralisabilité entre tâches",
      "type": "QualityAttribute"
    },
    {
      "assertionCount": 1,
      "description": "Métrique de recouvrement utilisée pour comparer deux segmentations.",
      "id": "noxia:radiology:scientific-concept:segmentation:dice-similarity-coefficient",
      "key": "dice-similarity-coefficient",
      "label": "Coefficient de similarité de Dice",
      "type": "QualityMetric"
    },
    {
      "assertionCount": 1,
      "description": "Famille de métriques comparant le recouvrement de segmentations sans représenter à elle seule toutes les propriétés de forme ou de distance.",
      "id": "noxia:radiology:scientific-concept:segmentation:overlap-metric",
      "key": "overlap-metric",
      "label": "Métrique de recouvrement",
      "type": "QualityMetric"
    }
  ],
  "contradictions": [
    {
      "classification": "METHOD_DIFFERENCE",
      "id": "noxia:radiology:context-difference:continuous-wave:segmentation:overlap-boundary",
      "label": "Method difference"
    }
  ],
  "defaultConceptKey": null,
  "digest": "a99e600ac7c9272dbe4c7b5b03ff05ef83fe34596f22a94105d1704a70f0c047",
  "editorialLinks": [
    {
      "label": "Segmentation IRM",
      "to": "/segmentation-irm"
    },
    {
      "label": "Méthodologie d’imagerie quantitative",
      "to": "/methodologie-imagerie-quantitative"
    },
    {
      "label": "Références et publications",
      "to": "/references-publications"
    }
  ],
  "evidenceLinks": [
    {
      "analyticalSummary": "Agreement between annotators should be assessed because annotation subjectivity and variability affect the stability and reproducibility of segmentation evaluation.",
      "assertionId": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:agreement-assessment-needed:revision:1",
      "confidence": "HIGH",
      "extractionType": "METHOD_DESCRIPTION",
      "id": "noxia:radiology:evidence-link:continuous-wave:segmentation:agreement-assessment-needed",
      "limitations": [],
      "locator": "PMC10062409 — Introduction — BioC offset 3744",
      "relationType": "SUPPORTS",
      "sourceId": "noxia:scientific-source:pubmed:37008654:revision:1"
    },
    {
      "analyticalSummary": "Benchmark interpretation depends on source heterogeneity, acquisition protocols and annotation design; a single-rater reference remains a documented limitation.",
      "assertionId": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:benchmark-heterogeneity-and-rater-limit:revision:1",
      "confidence": "HIGH",
      "extractionType": "LIMITATION",
      "id": "noxia:radiology:evidence-link:continuous-wave:segmentation:benchmark-heterogeneity-and-rater-limit",
      "limitations": [
        {
          "id": "HETEROGENEOUS_PROTOCOLS",
          "label": "Heterogeneous protocols"
        },
        {
          "id": "SINGLE_RATER_REFERENCE",
          "label": "Single rater reference"
        }
      ],
      "locator": "PMC9287542 — Discussion, challenge data set — BioC offset 21744",
      "relationType": "QUALIFIES",
      "sourceId": "noxia:scientific-source:pubmed:35840566:revision:1"
    },
    {
      "analyticalSummary": "A consensus reference estimate combined with overlap and classification metrics can characterize variation among multiple annotations.",
      "assertionId": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:consensus-plus-metrics-characterizes-variability:revision:1",
      "confidence": "HIGH",
      "extractionType": "METHOD_DESCRIPTION",
      "id": "noxia:radiology:evidence-link:continuous-wave:segmentation:consensus-plus-metrics-characterizes-variability",
      "limitations": [
        {
          "id": "METRIC_SET_REMAINS_TASK_DEPENDENT",
          "label": "Metric set remains task dependent"
        }
      ],
      "locator": "PMC10062409 — Related work, STAPLE consensus — BioC offset 8986",
      "relationType": "SUPPORTS",
      "sourceId": "noxia:scientific-source:pubmed:37008654:revision:1"
    },
    {
      "analyticalSummary": "Dice-based overlap assessment has documented limitations for small structures and should be qualified by object size and complementary spatial information.",
      "assertionId": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:dice-limited-small-structures:revision:1",
      "confidence": "HIGH",
      "extractionType": "LIMITATION",
      "id": "noxia:radiology:evidence-link:continuous-wave:segmentation:dice-limited-small-structures",
      "limitations": [
        {
          "id": "SHAPE_INFORMATION_LIMITED",
          "label": "Shape information limited"
        },
        {
          "id": "SMALL_STRUCTURE_SENSITIVITY",
          "label": "Small structure sensitivity"
        }
      ],
      "locator": "PMC11182665 — Metric pitfalls — BioC offset 28133",
      "relationType": "QUALIFIES",
      "sourceId": "noxia:scientific-source:pubmed:38347141:revision:1"
    },
    {
      "analyticalSummary": "Per-image metric values should be aggregated while respecting nested data structures such as multiple images per patient or patients per institution.",
      "assertionId": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:hierarchical-aggregation-required:revision:1",
      "confidence": "HIGH",
      "extractionType": "RECOMMENDATION_TEXT",
      "id": "noxia:radiology:evidence-link:continuous-wave:segmentation:hierarchical-aggregation-required",
      "limitations": [],
      "locator": "PMC11182665 — Metric aggregation — BioC offset 28788",
      "relationType": "SUPPORTS",
      "sourceId": "noxia:scientific-source:pubmed:38347141:revision:1"
    },
    {
      "analyticalSummary": "Metric selection should account for the properties of the segmentations under evaluation and the sensitivities of candidate metrics.",
      "assertionId": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:metric-selection-follows-segmentation-properties:revision:1",
      "confidence": "HIGH",
      "extractionType": "METHOD_DESCRIPTION",
      "id": "noxia:radiology:evidence-link:continuous-wave:segmentation:metric-selection-follows-segmentation-properties",
      "limitations": [],
      "locator": "PMC4533825 — Metric selection — BioC offset 86390",
      "relationType": "SUPPORTS",
      "sourceId": "noxia:scientific-source:pubmed:26263899:revision:1"
    },
    {
      "analyticalSummary": "A complex segmentation task generally requires several complementary metrics because one metric cannot represent every relevant validation property.",
      "assertionId": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:multiple-complementary-metrics:revision:1",
      "confidence": "HIGH",
      "extractionType": "RECOMMENDATION_TEXT",
      "id": "noxia:radiology:evidence-link:continuous-wave:segmentation:multiple-complementary-metrics",
      "limitations": [],
      "locator": "PMC11182665 — Cross-domain metric recommendation — BioC offset 11954",
      "relationType": "SUPPORTS",
      "sourceId": "noxia:scientific-source:pubmed:38347141:revision:1"
    },
    {
      "analyticalSummary": "Validation metrics should be selected from the properties and pitfalls of the specific image-analysis problem rather than from a universal default metric.",
      "assertionId": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:problem-fingerprint-guides-metrics:revision:1",
      "confidence": "HIGH",
      "extractionType": "RECOMMENDATION_TEXT",
      "id": "noxia:radiology:evidence-link:continuous-wave:segmentation:problem-fingerprint-guides-metrics",
      "limitations": [],
      "locator": "PMC11182665 — Metrics Reloaded Framework — BioC offset 5984",
      "relationType": "SUPPORTS",
      "sourceId": "noxia:scientific-source:pubmed:38347141:revision:1"
    },
    {
      "analyticalSummary": "Strong performance on one segmentation problem does not by itself establish generalization to an unseen task.",
      "assertionId": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:single-task-performance-not-generalization:revision:1",
      "confidence": "HIGH",
      "extractionType": "LIMITATION",
      "id": "noxia:radiology:evidence-link:continuous-wave:segmentation:single-task-performance-not-generalization",
      "limitations": [
        {
          "id": "SINGLE_TASK_EVIDENCE",
          "label": "Single task evidence"
        }
      ],
      "locator": "PMC9287542 — Introduction — BioC offset 3115",
      "relationType": "QUALIFIES",
      "sourceId": "noxia:scientific-source:pubmed:35840566:revision:1"
    },
    {
      "analyticalSummary": "STAPLE jointly estimates a performance level for each input segmentation while estimating the probabilistic reference.",
      "assertionId": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:staple-input-performance:revision:1",
      "confidence": "HIGH",
      "extractionType": "METHOD_DESCRIPTION",
      "id": "noxia:radiology:evidence-link:continuous-wave:segmentation:staple-input-performance",
      "limitations": [],
      "locator": "PMC1283110 — Abstract",
      "relationType": "SUPPORTS",
      "sourceId": "noxia:scientific-source:pubmed:15250643:revision:1"
    },
    {
      "analyticalSummary": "STAPLE estimates a probabilistic reference segmentation from a collection of input segmentations rather than asserting an error-free ground truth.",
      "assertionId": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:staple-probabilistic-reference:revision:1",
      "confidence": "HIGH",
      "extractionType": "METHOD_DESCRIPTION",
      "id": "noxia:radiology:evidence-link:continuous-wave:segmentation:staple-probabilistic-reference",
      "limitations": [
        {
          "id": "PROBABILISTIC_REFERENCE_NOT_ERROR_FREE_TRUTH",
          "label": "Probabilistic reference not error free truth"
        }
      ],
      "locator": "PMC1283110 — Abstract",
      "relationType": "SUPPORTS",
      "sourceId": "noxia:scientific-source:pubmed:15250643:revision:1"
    },
    {
      "analyticalSummary": "When two segmentations have no overlap, overlap metrics return the same zero value regardless of their separation, whereas distance metrics retain spatial information.",
      "assertionId": "noxia:radiology:scientific-assertion:continuous-wave:segmentation:zero-overlap-distance-information:revision:1",
      "confidence": "HIGH",
      "extractionType": "LIMITATION",
      "id": "noxia:radiology:evidence-link:continuous-wave:segmentation:zero-overlap-distance-information",
      "limitations": [
        {
          "id": "ZERO_OVERLAP_SPATIAL_INFORMATION_LOST",
          "label": "Zero overlap spatial information lost"
        }
      ],
      "locator": "PMC4533825 — Effects of overlap on correlation — BioC offset 65969",
      "relationType": "QUALIFIES",
      "sourceId": "noxia:scientific-source:pubmed:26263899:revision:1"
    }
  ],
  "facets": {
    "evidenceTypes": [
      {
        "assertionCount": 4,
        "id": "CONSENSUS_RECOMMENDATIONS",
        "key": "CONSENSUS_RECOMMENDATIONS",
        "label": "Consensus recommendations"
      },
      {
        "assertionCount": 2,
        "id": "METHOD_ANALYSIS",
        "key": "METHOD_ANALYSIS",
        "label": "Method analysis"
      },
      {
        "assertionCount": 2,
        "id": "METHOD_STUDY",
        "key": "METHOD_STUDY",
        "label": "Method study"
      },
      {
        "assertionCount": 2,
        "id": "METHOD_VALIDATION",
        "key": "METHOD_VALIDATION",
        "label": "Method validation"
      },
      {
        "assertionCount": 2,
        "id": "MULTITASK_BENCHMARK",
        "key": "MULTITASK_BENCHMARK",
        "label": "Multitask benchmark"
      }
    ],
    "metrics": [
      {
        "assertionCount": 2,
        "id": "noxia:radiology:scientific-concept:segmentation:inter-annotator-agreement",
        "key": "inter-annotator-agreement",
        "label": "Accord inter-annotateurs"
      },
      {
        "assertionCount": 1,
        "id": "noxia:radiology:scientific-concept:segmentation:dice-similarity-coefficient",
        "key": "dice-similarity-coefficient",
        "label": "Coefficient de similarité de Dice"
      }
    ],
    "tasks": [
      {
        "assertionCount": 4,
        "id": "noxia:radiology:scientific-concept:segmentation:medical-image-segmentation",
        "key": "medical-image-segmentation",
        "label": "Segmentation d'image médicale"
      },
      {
        "assertionCount": 2,
        "id": "noxia:radiology:scientific-concept:segmentation:staple-consensus",
        "key": "staple-consensus",
        "label": "Estimation consensuelle STAPLE"
      }
    ]
  },
  "illustration": null,
  "projectionIds": [
    "noxia:radiology:scientific-projection:territorial-wave:segmentation:state-of-knowledge"
  ],
  "safeguards": {
    "humanScientificReviewPerformed": false,
    "mentionsAreEvidence": false,
    "missingDataVisible": true,
    "publicPublicationReady": false,
    "sourceOfTruth": "SCIENTIFIC_KNOWLEDGE_GRAPH"
  },
  "selectedDomain": {
    "description": "Territory-selected and atomically executed scientific campaign for segmentation.",
    "id": "noxia:knowledge-catalog:domain:segmentation",
    "key": "segmentation",
    "label": "Segmentation en imagerie",
    "metrics": {
      "abstractOnlySourceCount": 0,
      "assertionCount": 12,
      "childCount": 8,
      "contradictionCount": 1,
      "documentaryReferenceCount": 5,
      "evidenceLinkCount": 12,
      "fullTextSourceCount": 5,
      "localizedEvidenceLinkCount": 12,
      "openQuestionCount": 2,
      "parentCount": 0,
      "potentialPageCount": 8,
      "potentialProjectionCount": 9,
      "projectionCount": 1,
      "publicPageCount": 0,
      "relatedCount": 0,
      "scientificSourceCount": 5,
      "sourceCount": 5,
      "synthesisCount": 1,
      "unresolvedDocumentaryReferenceCount": 0
    },
    "readiness": {
      "editorialProjection": true,
      "provenance": true,
      "publicPublication": false,
      "scientific": true,
      "synthesis": true
    },
    "selection": {
      "components": {
        "deterministicSynthesisAvailable": 12.5,
        "implementationSimplicity": 10,
        "internalProjectionAvailable": 12.5,
        "sourceQuality": 20,
        "sufficientAssertionCoverage": 25,
        "sufficientSourceCoverage": 20
      },
      "rule": "EDITORIAL_READY_RICHNESS_DEMONSTRATION_SIMPLICITY_V1",
      "score": 100,
      "tieBreaker": "SEGMENTATION_THEN_STABLE_ID"
    },
    "status": "PROJECTED"
  },
  "sourceCatalog": {
    "catalogId": "noxia:scientific-knowledge-catalog",
    "digest": "101adf9eb9310f921297f29cf9a03ad8ec871d74a4d35967bcf0033a7bf2e07a",
    "planningDigest": "7f562740e84b5685fc80eee57ead41176dbef28d383f9f2e546811f9ff9c672a",
    "version": "1.3.0"
  },
  "sources": [
    {
      "abstractOnly": false,
      "authors": [
        "Maier-Hein L",
        "Reinke A",
        "Godau P",
        "Tizabi MD",
        "Buettner F",
        "Christodoulou E",
        "Glocker B",
        "Isensee F",
        "Kleesiek J",
        "Kozubek M",
        "Reyes M",
        "Riegler MA",
        "Wiesenfarth M",
        "Kavur AE",
        "Sudre CH",
        "Baumgartner M",
        "Eisenmann M",
        "Heckmann-Nötzel D",
        "Rädsch T",
        "Acion L",
        "Antonelli M",
        "Arbel T",
        "Bakas S",
        "Benis A",
        "Blaschko MB",
        "Cardoso MJ",
        "Cheplygina V",
        "Cimini BA",
        "Collins GS",
        "Farahani K",
        "Ferrer L",
        "Galdran A",
        "van Ginneken B",
        "Haase R",
        "Hashimoto DA",
        "Hoffman MM",
        "Huisman M",
        "Jannin P",
        "Kahn CE",
        "Kainmueller D",
        "Kainz B",
        "Karargyris A",
        "Karthikesalingam A",
        "Kofler F",
        "Kopp-Schneider A",
        "Kreshuk A",
        "Kurc T",
        "Landman BA",
        "Litjens G",
        "Madani A",
        "Maier-Hein K",
        "Martel AL",
        "Mattson P",
        "Meijering E",
        "Menze B",
        "Moons KGM",
        "Müller H",
        "Nichyporuk B",
        "Nickel F",
        "Petersen J",
        "Rajpoot N",
        "Rieke N",
        "Saez-Rodriguez J",
        "Sánchez CI",
        "Shetty S",
        "van Smeden M",
        "Summers RM",
        "Taha AA",
        "Tiulpin A",
        "Tsaftaris SA",
        "Van Calster B",
        "Varoquaux G",
        "Jäger PF"
      ],
      "documentStatus": "CURRENT",
      "doi": "10.1038/s41592-023-02151-z",
      "fullTextUrl": "https://pmc.ncbi.nlm.nih.gov/articles/PMC11182665/",
      "id": "noxia:scientific-source:pubmed:38347141:revision:1",
      "journal": "Nature methods",
      "pmid": "38347141",
      "sourceType": "DELPHI_METHOD_FRAMEWORK",
      "title": "Metrics reloaded: recommendations for image analysis validation.",
      "url": "https://pubmed.ncbi.nlm.nih.gov/38347141/",
      "year": 2024
    },
    {
      "abstractOnly": false,
      "authors": [
        "Yang F",
        "Zamzmi G",
        "Angara S",
        "Rajaraman S",
        "Aquilina A",
        "Xue Z",
        "Jaeger S",
        "Papagiannakis E",
        "Antani SK"
      ],
      "documentStatus": "CURRENT",
      "doi": "10.1109/access.2023.3249759",
      "fullTextUrl": "https://pmc.ncbi.nlm.nih.gov/articles/PMC10062409/",
      "id": "noxia:scientific-source:pubmed:37008654:revision:1",
      "journal": "IEEE access : practical innovations, open solutions",
      "pmid": "37008654",
      "sourceType": "METHOD_STUDY",
      "title": "Assessing Inter-Annotator Agreement for Medical Image Segmentation.",
      "url": "https://pubmed.ncbi.nlm.nih.gov/37008654/",
      "year": 2023
    },
    {
      "abstractOnly": false,
      "authors": [
        "Antonelli M",
        "Reinke A",
        "Bakas S",
        "Farahani K",
        "Kopp-Schneider A",
        "Landman BA",
        "Litjens G",
        "Menze B",
        "Ronneberger O",
        "Summers RM",
        "van Ginneken B",
        "Bilello M",
        "Bilic P",
        "Christ PF",
        "Do RKG",
        "Gollub MJ",
        "Heckers SH",
        "Huisman H",
        "Jarnagin WR",
        "McHugo MK",
        "Napel S",
        "Pernicka JSG",
        "Rhode K",
        "Tobon-Gomez C",
        "Vorontsov E",
        "Meakin JA",
        "Ourselin S",
        "Wiesenfarth M",
        "Arbeláez P",
        "Bae B",
        "Chen S",
        "Daza L",
        "Feng J",
        "He B",
        "Isensee F",
        "Ji Y",
        "Jia F",
        "Kim I",
        "Maier-Hein K",
        "Merhof D",
        "Pai A",
        "Park B",
        "Perslev M",
        "Rezaiifar R",
        "Rippel O",
        "Sarasua I",
        "Shen W",
        "Son J",
        "Wachinger C",
        "Wang L",
        "Wang Y",
        "Xia Y",
        "Xu D",
        "Xu Z",
        "Zheng Y",
        "Simpson AL",
        "Maier-Hein L",
        "Cardoso MJ"
      ],
      "documentStatus": "CURRENT",
      "doi": "10.1038/s41467-022-30695-9",
      "fullTextUrl": "https://pmc.ncbi.nlm.nih.gov/articles/PMC9287542/",
      "id": "noxia:scientific-source:pubmed:35840566:revision:1",
      "journal": "Nature communications",
      "pmid": "35840566",
      "sourceType": "MULTITASK_BENCHMARK",
      "title": "The Medical Segmentation Decathlon.",
      "url": "https://pubmed.ncbi.nlm.nih.gov/35840566/",
      "year": 2022
    },
    {
      "abstractOnly": false,
      "authors": [
        "Taha AA",
        "Hanbury A"
      ],
      "documentStatus": "CURRENT",
      "doi": "10.1186/s12880-015-0068-x",
      "fullTextUrl": "https://pmc.ncbi.nlm.nih.gov/articles/PMC4533825/",
      "id": "noxia:scientific-source:pubmed:26263899:revision:1",
      "journal": "BMC medical imaging",
      "pmid": "26263899",
      "sourceType": "METHOD_ANALYSIS",
      "title": "Metrics for evaluating 3D medical image segmentation: analysis, selection, and tool.",
      "url": "https://pubmed.ncbi.nlm.nih.gov/26263899/",
      "year": 2015
    },
    {
      "abstractOnly": false,
      "authors": [
        "Warfield SK",
        "Zou KH",
        "Wells WM"
      ],
      "documentStatus": "CURRENT",
      "doi": "10.1109/TMI.2004.828354",
      "fullTextUrl": "https://pmc.ncbi.nlm.nih.gov/articles/PMC1283110/",
      "id": "noxia:scientific-source:pubmed:15250643:revision:1",
      "journal": "IEEE transactions on medical imaging",
      "pmid": "15250643",
      "sourceType": "METHOD_VALIDATION",
      "title": "Simultaneous truth and performance level estimation (STAPLE): an algorithm for the validation of image segmentation.",
      "url": "https://pubmed.ncbi.nlm.nih.gov/15250643/",
      "year": 2004
    }
  ],
  "syntheses": [
    {
      "assertionIds": [
        "noxia:radiology:scientific-assertion:continuous-wave:segmentation:agreement-assessment-needed:revision:1",
        "noxia:radiology:scientific-assertion:continuous-wave:segmentation:benchmark-heterogeneity-and-rater-limit:revision:1",
        "noxia:radiology:scientific-assertion:continuous-wave:segmentation:consensus-plus-metrics-characterizes-variability:revision:1",
        "noxia:radiology:scientific-assertion:continuous-wave:segmentation:dice-limited-small-structures:revision:1",
        "noxia:radiology:scientific-assertion:continuous-wave:segmentation:hierarchical-aggregation-required:revision:1",
        "noxia:radiology:scientific-assertion:continuous-wave:segmentation:metric-selection-follows-segmentation-properties:revision:1",
        "noxia:radiology:scientific-assertion:continuous-wave:segmentation:multiple-complementary-metrics:revision:1",
        "noxia:radiology:scientific-assertion:continuous-wave:segmentation:problem-fingerprint-guides-metrics:revision:1",
        "noxia:radiology:scientific-assertion:continuous-wave:segmentation:single-task-performance-not-generalization:revision:1",
        "noxia:radiology:scientific-assertion:continuous-wave:segmentation:staple-input-performance:revision:1",
        "noxia:radiology:scientific-assertion:continuous-wave:segmentation:staple-probabilistic-reference:revision:1",
        "noxia:radiology:scientific-assertion:continuous-wave:segmentation:zero-overlap-distance-information:revision:1"
      ],
      "conceptIds": [
        "boundary-metric",
        "dice-similarity-coefficient",
        "inter-annotator-agreement",
        "medical-image-segmentation",
        "overlap-metric",
        "reference-annotation",
        "staple-consensus",
        "task-generalizability"
      ],
      "confidence": "HIGH",
      "consensus": {
        "detected": false,
        "state": "NO_EXPLICIT_CURRENT_CONSENSUS"
      },
      "contradictions": [
        {
          "classification": "METHOD_DIFFERENCE",
          "id": "noxia:radiology:context-difference:continuous-wave:segmentation:overlap-boundary",
          "label": "Method difference"
        }
      ],
      "convergence": "CONTEXT_DEPENDENT_CONVERGENCE",
      "humanReviewed": false,
      "id": "noxia:radiology:scientific-synthesis:territorial-wave:segmentation:state-of-knowledge",
      "key": "segmentation-state-of-knowledge",
      "label": "Segmentation state of knowledge",
      "limitations": [
        {
          "id": "HETEROGENEOUS_PROTOCOLS",
          "label": "Heterogeneous protocols"
        },
        {
          "id": "METRIC_SET_REMAINS_TASK_DEPENDENT",
          "label": "Metric set remains task dependent"
        },
        {
          "id": "PROBABILISTIC_REFERENCE_NOT_ERROR_FREE_TRUTH",
          "label": "Probabilistic reference not error free truth"
        },
        {
          "id": "SHAPE_INFORMATION_LIMITED",
          "label": "Shape information limited"
        },
        {
          "id": "SINGLE_RATER_REFERENCE",
          "label": "Single rater reference"
        },
        {
          "id": "SINGLE_TASK_EVIDENCE",
          "label": "Single task evidence"
        },
        {
          "id": "SMALL_STRUCTURE_SENSITIVITY",
          "label": "Small structure sensitivity"
        },
        {
          "id": "ZERO_OVERLAP_SPATIAL_INFORMATION_LOST",
          "label": "Zero overlap spatial information lost"
        }
      ],
      "missingData": [
        {
          "id": "SCIENTIFIC_HUMAN_REVIEW_NOT_PERFORMED",
          "label": "Scientific human review not performed"
        },
        {
          "id": "TASK_SPECIFIC_METRIC_SELECTION_REMAINS_REQUIRED",
          "label": "Task specific metric selection remains required"
        }
      ],
      "modalityIds": [],
      "openQuestions": [
        {
          "id": "SCIENTIFIC_HUMAN_REVIEW_NOT_PERFORMED",
          "label": "Scientific human review not performed"
        },
        {
          "id": "TASK_SPECIFIC_METRIC_SELECTION_REMAINS_REQUIRED",
          "label": "Task specific metric selection remains required"
        }
      ],
      "statisticalMetaAnalysisPerformed": false
    }
  ],
  "version": "1.0.0"
};

export default scientificExplorerData;
