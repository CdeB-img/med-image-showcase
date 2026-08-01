# P5 — Extension scientifique multidomaine

> Rapport interne scientifique. Aucun texte éditorial public, aucune route, aucun canonical et aucune indexation ne sont produits.

## 1. État Git initial

Branche `main`, HEAD `857e94b6df88289b59de149fe8f77e84dbee9492`. Les changements scientifiques cohérents P1–P4R ont été préservés. Aucun commit, push ou déploiement n'a été effectué.

## 2. Baseline P4R

Digest `7317f0b980c51ddf3b5e0ad403bf30ba14c965c7c1ab473881a8df991a52ac98`. Baseline valide : true. Régression détectée : false.

## 3–5. Domaines et sources

| Domaine | Sources examinées | Sources retenues | Concepts | Assertions | EvidenceLinks |
| --- | --- | --- | --- | --- | --- |
| diffusion-adc | 11 | 9 | 15 | 24 | 27 |
| cerebral-perfusion | 14 | 10 | 15 | 24 | 27 |
| myocardial-tissue-characterization | 13 | 9 | 15 | 25 | 27 |
| spectral-ct | 14 | 10 | 15 | 24 | 27 |

Sources externes examinées : 52. Retenues : 38, dont 29 en texte intégral et 9 limitées au résumé. Rejetées : 14.

| Source | Type | Localisateur | Sujet | Assertions liées | Statut |
| --- | --- | --- | --- | --- | --- |
| 19186405 | CONSENSUS | PMC2631136 | diffusion-adc | 1 | OFFICIAL_FULL_TEXT |
| 21329899 | METHOD_COMPARISON | PubMed abstract only | myocardial-tissue-characterization | 4 | ABSTRACT_ONLY |
| 21640299 | REVIEW | PMC3135980 | cerebral-perfusion | 8 | OFFICIAL_FULL_TEXT |
| 21785096 | METHOD_COMPARISON | PubMed abstract only | cerebral-perfusion | 2 | ABSTRACT_ONLY |
| 23021401 | REVIEW | PMC3514126 | myocardial-tissue-characterization | 4 | OFFICIAL_FULL_TEXT |
| 23023785 | MULTISYSTEM_VALIDATION | PMC3548033 | diffusion-adc | 3 | OFFICIAL_FULL_TEXT |
| 23264345 | VALIDATION_STUDY | PubMed abstract only | cerebral-perfusion | 1 | ABSTRACT_ONLY |
| 25212800 | SYSTEMATIC_REVIEW_META_ANALYSIS | PMC4301583 | myocardial-tissue-characterization | 3 | OFFICIAL_FULL_TEXT |
| 25315701 | METHOD_VALIDATION | PMC4189726 | myocardial-tissue-characterization | 3 | OFFICIAL_FULL_TEXT |
| 25759823 | REVIEW | PMC4336749 | myocardial-tissue-characterization | 2 | OFFICIAL_FULL_TEXT |
| 25802212 | MULTICENTER_STUDY | PMC4403968 | diffusion-adc | 2 | OFFICIAL_FULL_TEXT |
| 25907520 | RECOMMENDATION | PMC5074767 | cerebral-perfusion | 1 | OFFICIAL_FULL_TEXT |
| 26892827 | CONSENSUS | PMC4983499 | diffusion-adc | 7 | OFFICIAL_FULL_TEXT |
| 28168368 | INTERPLATFORM_PHANTOM_STUDY | PMC5544802 | spectral-ct | 4 | OFFICIAL_FULL_TEXT |
| 28956113 | MULTICENTER_METHOD_REVIEW | PMC5811587 | diffusion-adc | 2 | OFFICIAL_FULL_TEXT |
| 29162123 | PROSPECTIVE_METHOD_COMPARISON | PMC5696884 | myocardial-tissue-characterization | 1 | OFFICIAL_FULL_TEXT |
| 29185902 | INTERPLATFORM_PHANTOM_STUDY | PubMed abstract only | spectral-ct | 2 | ABSTRACT_ONLY |
| 29712696 | REVIEW | PMC5933067 | myocardial-tissue-characterization | 2 | OFFICIAL_FULL_TEXT |
| 30231886 | CONSENSUS | PMC6147157 | myocardial-tissue-characterization | 6 | OFFICIAL_FULL_TEXT |
| 30276672 | PHANTOM_STUDY | PubMed abstract only | spectral-ct | 1 | ABSTRACT_ONLY |
| 30346227 | PRACTICE_GUIDANCE | PMC6727131 | cerebral-perfusion | 5 | OFFICIAL_FULL_TEXT |
| 30813942 | METHOD_COMPARISON | PMC6393997 | myocardial-tissue-characterization | 2 | OFFICIAL_FULL_TEXT |
| 30919651 | TECHNICAL_REVIEW | PMC6592074 | spectral-ct | 4 | OFFICIAL_FULL_TEXT |
| 31019604 | METHOD_COMPARISON | PMC6479142 | cerebral-perfusion | 2 | OFFICIAL_FULL_TEXT |
| 31203208 | MULTICENTER_METHOD_COMPARISON | PubMed abstract only | cerebral-perfusion | 2 | ABSTRACT_ONLY |
| 31237496 | PHANTOM_STUDY | PMC6694721 | spectral-ct | 2 | OFFICIAL_FULL_TEXT |
| 33411614 | TECHNICAL_REVIEW | PMC7853765 | spectral-ct | 4 | OFFICIAL_FULL_TEXT |
| 33836457 | REVIEW | PubMed abstract only | diffusion-adc | 4 | ABSTRACT_ONLY |
| 34668387 | INTERPLATFORM_METHOD_STUDY | PubMed abstract only | spectral-ct | 1 | ABSTRACT_ONLY |
| 36010624 | METHOD_COMPARISON | PMC9406974 | cerebral-perfusion | 2 | OFFICIAL_FULL_TEXT |
| 36047540 | TECHNICAL_REVIEW | PMC9434736 | spectral-ct | 3 | OFFICIAL_FULL_TEXT |
| 36828369 | TECHNICAL_REVIEW | PMC9964233 | spectral-ct | 5 | OFFICIAL_FULL_TEXT |
| 37021148 | METHOD_COMPARISON | PMC10069177 | cerebral-perfusion | 2 | OFFICIAL_FULL_TEXT |
| 37437609 | RECOMMENDATION | PMC11197850 | diffusion-adc | 1 | OFFICIAL_FULL_TEXT |
| 38052882 | CALIBRATION_STUDY | PMC10698076 | cerebral-perfusion | 2 | OFFICIAL_FULL_TEXT |
| 38189979 | INTERPLATFORM_CLINICAL_STUDY | PubMed abstract only | spectral-ct | 1 | ABSTRACT_ONLY |
| 38535004 | TECHNICAL_VALIDATION | PMC10969680 | diffusion-adc | 3 | OFFICIAL_FULL_TEXT |
| 39377680 | QIBA_PROFILE | PMC11537247 | diffusion-adc | 4 | OFFICIAL_FULL_TEXT |

### Sources rejetées

| Source | Domaine | Titre | Motif |
| --- | --- | --- | --- |
| PMC12314170 | diffusion-adc | Multi-institution longitudinal apparent diffusion coefficient measurements in a diffusion weighted imaging phantom at room temperature | OVERLAPS_RETAINED_QIBA_AND_PHANTOM_EVIDENCE |
| PMC5968828 | diffusion-adc | Apparent Diffusion Coefficient Is Highly Reproducible on Preclinical Imaging Systems | PRECLINICAL_NONHUMAN_SCOPE |
| PMID:41327069 | cerebral-perfusion | — | ABSTRACT_ONLY_AND_OVERLAPS_SOFTWARE_COMPARISONS |
| PMID:40234640 | cerebral-perfusion | — | OVERLAPS_RETAINED_SOFTWARE_COMPARISONS |
| PMID:37179549 | cerebral-perfusion | Comparison of two computed tomography perfusion post-processing software to assess infarct volume in patients with acute ischemic stroke | OVERLAPS_RETAINED_SOFTWARE_COMPARISONS |
| PMID:38081878 | cerebral-perfusion | — | ALTERNATE_ACQUISITION_OUTSIDE_P5_CORE |
| PMID:36424508 | myocardial-tissue-characterization | — | DISEASE_SPECIFIC_OVERLAP |
| PMID:33219845 | myocardial-tissue-characterization | — | ALGORITHM_SPECIFIC_OVERLAP |
| PMID:38822240 | myocardial-tissue-characterization | — | ALGORITHM_SPECIFIC_OVERLAP |
| PMID:39274260 | myocardial-tissue-characterization | — | DISEASE_SPECIFIC_OVERLAP |
| PMID:39072220 | spectral-ct | — | FIRST_GENERATION_PLATFORM_SPECIFIC_OVERLAP |
| PMID:29624708 | spectral-ct | — | RADIOTHERAPY_APPLICATION_OUTSIDE_P5_CORE |
| PMID:29446082 | spectral-ct | — | SINGLE_SYSTEM_QC_NARROWER_THAN_RETAINED_INTERPLATFORM_EVIDENCE |
| PMID:33506433 | spectral-ct | — | DISEASE_SPECIFIC_VNC_APPLICATION_OUTSIDE_P5_CORE |

## 6–8. Concepts et décisions ontologiques

| Concept | Domaine | Classe | Rôle | Source | Décision |
| --- | --- | --- | --- | --- | --- |
| arterial-input-function | cerebral-perfusion | ModelInput | ModelInput, MeasurementMethodComponent | 21640299 | NEW_SOURCED_CONCEPT |
| cbf | cerebral-perfusion | DerivedMeasurement | DerivedMeasurement, Biomarker | 21640299 | NEW_SOURCED_CONCEPT |
| cbv | cerebral-perfusion | DerivedMeasurement | DerivedMeasurement, Biomarker | 21640299 | NEW_SOURCED_CONCEPT |
| contrast-bolus | cerebral-perfusion | AcquisitionInput | AcquisitionInput | 21640299 | NEW_SOURCED_CONCEPT |
| ct-perfusion | cerebral-perfusion | AcquisitionMethod | AcquisitionMethod | 30346227 | NEW_SOURCED_CONCEPT |
| deconvolution | cerebral-perfusion | ReconstructionMethod | ReconstructionMethod, MeasurementMethod | 21640299 | NEW_SOURCED_CONCEPT |
| ischemic-core-segmentation | cerebral-perfusion | Finding | Finding, DerivedSegmentation | 30346227 | NEW_SOURCED_CONCEPT |
| lesion-volume | cerebral-perfusion | DerivedMeasurement | DerivedMeasurement, Endpoint | 37021148 | NEW_SOURCED_CONCEPT |
| mr-dsc-perfusion | cerebral-perfusion | AcquisitionMethod | AcquisitionMethod | 25907520 | NEW_SOURCED_CONCEPT |
| mtt | cerebral-perfusion | DerivedMeasurement | DerivedMeasurement | 21640299 | NEW_SOURCED_CONCEPT |
| penumbra-segmentation | cerebral-perfusion | Finding | Finding, DerivedSegmentation | 30346227 | NEW_SOURCED_CONCEPT |
| perfusion-parametric-map | cerebral-perfusion | ParametricMap | ParametricMap, ReconstructionOutput | 30346227 | NEW_SOURCED_CONCEPT |
| perfusion-software | cerebral-perfusion | SoftwareMethod | SoftwareMethod, ReconstructionMethod | 31203208 | NEW_SOURCED_CONCEPT |
| residue-function | cerebral-perfusion | ModelComponent | ModelComponent | 21640299 | NEW_SOURCED_CONCEPT |
| tmax | cerebral-perfusion | DerivedMeasurement | DerivedMeasurement | 21640299 | NEW_SOURCED_CONCEPT |
| acute-ischemic-stroke | diffusion-adc | Disease | Disease | 33836457 | NEW_SOURCED_CONCEPT |
| adc-map | diffusion-adc | ParametricMap | ParametricMap, ReconstructionOutput | 39377680 | NEW_SOURCED_CONCEPT |
| adc-repeatability | diffusion-adc | QualityMetric | QualityMetric | 23023785 | NEW_SOURCED_CONCEPT |
| adc-reproducibility | diffusion-adc | QualityMetric | QualityMetric | 25802212 | NEW_SOURCED_CONCEPT |
| adc-value | diffusion-adc | DerivedMeasurement | DerivedMeasurement, Biomarker | 39377680 | NEW_SOURCED_CONCEPT |
| b-value | diffusion-adc | AcquisitionParameter | AcquisitionParameter, Quantity | 39377680 | NEW_SOURCED_CONCEPT |
| diffusion | diffusion-adc | PhysicalPhenomenon | PhysicalPhenomenon | 26892827 | NEW_SOURCED_CONCEPT |
| diffusion-phantom | diffusion-adc | QualityControlObject | QualityControlObject | 23023785 | NEW_SOURCED_CONCEPT |
| diffusion-restriction | diffusion-adc | Finding | Finding | 33836457 | NEW_SOURCED_CONCEPT |
| diffusion-weighting | diffusion-adc | AcquisitionParameter | AcquisitionParameter | 26892827 | NEW_SOURCED_CONCEPT |
| dwi | diffusion-adc | AcquisitionMethod | AcquisitionMethod | 26892827 | NEW_SOURCED_CONCEPT |
| gradient-nonlinearity | diffusion-adc | Limitation | Limitation | 23023785 | NEW_SOURCED_CONCEPT |
| low-b-perfusion | diffusion-adc | Confounder | Confounder | 26892827 | NEW_SOURCED_CONCEPT |
| monoexponential-adc | diffusion-adc | MeasurementMethod | MeasurementMethod | 26892827 | NEW_SOURCED_CONCEPT |
| qiba-adc-profile | diffusion-adc | Standard | Standard, QualityFramework | 39377680 | NEW_SOURCED_CONCEPT |
| dark-blood-lge | myocardial-tissue-characterization | AcquisitionMethod | AcquisitionMethod, ReconstructionMethod | 29162123 | NEW_SOURCED_CONCEPT |
| gadolinium-contrast | myocardial-tissue-characterization | ContrastAgentClass | ContrastAgentClass | 30231886 | NEW_SOURCED_CONCEPT |
| intramyocardial-hemorrhage | myocardial-tissue-characterization | Finding | Finding, Biomarker, Endpoint | 23021401 | NEW_SOURCED_CONCEPT |
| inversion-recovery | myocardial-tissue-characterization | SequenceFamily | SequenceFamily | 30231886 | NEW_SOURCED_CONCEPT |
| lge-acquisition | myocardial-tissue-characterization | AcquisitionMethod | AcquisitionMethod | 30231886 | NEW_SOURCED_CONCEPT |
| lge-finding | myocardial-tissue-characterization | Finding | Finding, Biomarker | 30231886 | NEW_SOURCED_CONCEPT |
| lge-pattern | myocardial-tissue-characterization | Finding | Finding | 30231886 | NEW_SOURCED_CONCEPT |
| lge-quantification | myocardial-tissue-characterization | MeasurementMethod | MeasurementMethod | 21329899 | NEW_SOURCED_CONCEPT |
| microvascular-obstruction | myocardial-tissue-characterization | Finding | Finding, Biomarker, Endpoint | 23021401 | NEW_SOURCED_CONCEPT |
| myocardial-infarction | myocardial-tissue-characterization | Disease | Disease | 29712696 | NEW_SOURCED_CONCEPT |
| myocardial-nulling | myocardial-tissue-characterization | AcquisitionCondition | AcquisitionCondition | 30231886 | NEW_SOURCED_CONCEPT |
| myocarditis | myocardial-tissue-characterization | Disease | Disease | 30813942 | NEW_SOURCED_CONCEPT |
| psir | myocardial-tissue-characterization | ReconstructionMethod | ReconstructionMethod, Sequence | 30231886 | NEW_SOURCED_CONCEPT |
| t2-star | myocardial-tissue-characterization | MeasurementMethod | MeasurementMethod, DerivedMeasurement | 25759823 | NEW_SOURCED_CONCEPT |
| t2-weighted-iron-sensitive | myocardial-tissue-characterization | SequenceFamily | SequenceFamily | 23021401 | NEW_SOURCED_CONCEPT |
| dual-energy-ct | spectral-ct | Technology | Technology, AcquisitionMethod | 36828369 | NEW_SOURCED_CONCEPT |
| dual-layer-detector | spectral-ct | TechnologyImplementation | TechnologyImplementation | 28168368 | NEW_SOURCED_CONCEPT |
| dual-source-de | spectral-ct | TechnologyImplementation | TechnologyImplementation | 36828369 | NEW_SOURCED_CONCEPT |
| effective-atomic-number | spectral-ct | DerivedMeasurement | DerivedMeasurement, ParametricMap | 33411614 | NEW_SOURCED_CONCEPT |
| iodine-concentration | spectral-ct | DerivedMeasurement | DerivedMeasurement, Biomarker | 28168368 | NEW_SOURCED_CONCEPT |
| iodine-map | spectral-ct | ParametricMap | ParametricMap, ReconstructionOutput | 33411614 | NEW_SOURCED_CONCEPT |
| material-decomposition | spectral-ct | ReconstructionMethod | ReconstructionMethod | 33411614 | NEW_SOURCED_CONCEPT |
| photon-counting-ct | spectral-ct | Technology | Technology, DetectorTechnology | 36047540 | NEW_SOURCED_CONCEPT |
| rapid-kvp-switching | spectral-ct | TechnologyImplementation | TechnologyImplementation | 36828369 | NEW_SOURCED_CONCEPT |
| sequential-dual-energy | spectral-ct | TechnologyImplementation | TechnologyImplementation | 36828369 | NEW_SOURCED_CONCEPT |
| spectral-calibration | spectral-ct | QualityMethod | QualityMethod | 34668387 | NEW_SOURCED_CONCEPT |
| spectral-ct | spectral-ct | Technology | Technology, ModalityExtension | 36828369 | NEW_SOURCED_CONCEPT |
| split-filter | spectral-ct | TechnologyImplementation | TechnologyImplementation | 36828369 | NEW_SOURCED_CONCEPT |
| virtual-monoenergetic-image | spectral-ct | ReconstructionOutput | ReconstructionOutput | 30919651 | NEW_SOURCED_CONCEPT |
| virtual-non-contrast | spectral-ct | ReconstructionOutput | ReconstructionOutput | 33411614 | NEW_SOURCED_CONCEPT |

| Décision | Concept | Options | Décision appliquée | Justification |
| --- | --- | --- | --- | --- |
| noxia:radiology:p5:ontology-decision:01 | adc-value | DerivedMeasurement, Biomarker | MULTI_ROLE_MODEL | ADC is a derived quantity; its biomarker role depends on the application and performance claim. |
| noxia:radiology:p5:ontology-decision:02 | diffusion-restriction | Finding, Biomarker | FINDING_ROLE_PRESERVED | Restriction is an interpretation of signal and ADC context, not the ADC measurement itself. |
| noxia:radiology:p5:ontology-decision:03 | tmax | DerivedMeasurement, PhysiologicalQuantity | DERIVED_MEASUREMENT_ONLY | Tmax derives from the residue function and is not a direct physiological flow measurement. |
| noxia:radiology:p5:ontology-decision:04 | lge-finding | Finding, Biomarker, Endpoint | MULTI_ROLE_MODEL | The observed LGE finding is distinct from acquisition and can play biomarker or endpoint roles only in specified contexts. |
| noxia:radiology:p5:ontology-decision:05 | microvascular-obstruction | Finding, Biomarker, Endpoint | MULTI_ROLE_MODEL | MVO is observed as a finding and may be quantified or used as an endpoint in a defined study. |
| noxia:radiology:p5:ontology-decision:06 | intramyocardial-hemorrhage | Finding, Biomarker, Endpoint | MULTI_ROLE_MODEL | IMH is not automatically a quantitative measure; its role depends on sequence and study endpoint. |
| noxia:radiology:p5:ontology-decision:07 | iodine-map | ParametricMap, ReconstructionOutput, MeasurementMethod | OUTPUT_NOT_MEASUREMENT | The map is a reconstruction output; iodine concentration is the separate derived measurement. |
| noxia:radiology:p5:ontology-decision:08 | photon-counting-ct | Technology, Modality | TECHNOLOGY_WITHIN_CT | PCCT remains a CT detector technology and is not merged with all dual-energy implementations. |

## 9. Mesures et méthodes

| Mesure | Domaine | Méthode | Entrées | Unité | Formule sourcée | Limites |
| --- | --- | --- | --- | --- | --- | --- |
| adc | diffusion-adc | monoexponential-adc | signal-intensity-at-specified-b-values | mm²/s | none | B_VALUE_SELECTION, NOISE_FLOOR, PERFUSION_CONTRIBUTION |
| b-value | diffusion-adc | diffusion-gradient-encoding | gradient-amplitude, gradient-duration, gradient-separation | s/mm² | none | SEQUENCE_IMPLEMENTATION |
| adc-repeatability | diffusion-adc | repeat-measurement-analysis | repeated-adc-observations, same-specified-conditions | — | none | CONDITION_DEFINITION_REQUIRED |
| adc-reproducibility | diffusion-adc | multisystem-comparison | adc-observations, changed-site-or-system-conditions | — | none | ANATOMICAL_REGION, SITE, SYSTEM, SEQUENCE |
| cbf | cerebral-perfusion | deconvolution | tissue-time-curve, arterial-input-function | mL/100 g/min | none | AIF_SELECTION, DECONVOLUTION_ALGORITHM |
| cbv | cerebral-perfusion | contrast-time-curve-integration | tissue-time-curve, arterial-input-function | mL/100 g | none | BOLUS_TRUNCATION, NORMALIZATION |
| mtt | cerebral-perfusion | central-volume-model | cbv, cbf | s | MTT = CBV / CBF | MODEL_ASSUMPTION, ALGORITHM_DEPENDENCE |
| tmax | cerebral-perfusion | deconvolution | deconvolved-residue-function | s | none | AIF_DELAY, DECONVOLUTION_ALGORITHM, NOT_DIRECT_FLOW |
| lge-extent | myocardial-tissue-characterization | lge-quantification | reference-myocardium, segmented-myocardium, enhancement-rule | % of LV mass | none | QUANTIFICATION_METHOD, DISEASE_ETIOLOGY |
| mvo-extent | myocardial-tissue-characterization | manual-or-threshold-segmentation | mvo-segmentation, lv-mass | % of LV mass | none | IMAGING_TIME, DEFINITION |
| imh-presence | myocardial-tissue-characterization | t2-or-t2star-assessment | iron-sensitive-image, detection-rule | categorical | none | SEQUENCE, TIMING, DEFINITION |
| myocardial-t2star | myocardial-tissue-characterization | multi-echo-t2star-fitting | multi-echo-signals | ms | none | FIELD_STRENGTH, SEQUENCE, FIT_METHOD |
| iodine-concentration | spectral-ct | material-decomposition | spectral-projections-or-images, material-basis, calibration | mg I/mL | none | PLATFORM, OBJECT_SIZE, DOSE, RECONSTRUCTION |
| virtual-energy | spectral-ct | vmi-reconstruction | spectral-data, selected-energy | keV | none | NOISE_CONTRAST_TRADEOFF |
| vnc-attenuation | spectral-ct | iodine-subtraction | contrast-enhanced-spectral-data, iodine-subtraction-model | HU | none | RESIDUAL_IODINE, CALCIUM_SUBTRACTION, PLATFORM |
| effective-atomic-number | spectral-ct | material-decomposition | spectral-data, implementation-model | dimensionless | none | MODEL_AND_PLATFORM_DEPENDENCE |

Les trois seuils représentés sont strictement rattachés à leur étude, leur algorithme, leur population et leur unité ; aucun n'est marqué universel.

## 10–14. Assertions, preuves, contextes, limites et contradictions

| Assertion | Domaine | Sujet | Prédicat | Contexte | Preuve | Statut |
| --- | --- | --- | --- | --- | --- | --- |
| aif-input | cerebral-perfusion | arterial-input-function | IS_INPUT_TO | aif-input | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| cbf-residue-amplitude | cerebral-perfusion | cbf | IS_DERIVED_FROM | cbf-residue-amplitude | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| common-postprocessing-strong-correlation | cerebral-perfusion | perfusion-software | PRODUCED | common-postprocessing-strong-correlation | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| core-volume-software-dependent | cerebral-perfusion | ischemic-core-segmentation | DEPENDS_ON | core-volume-software-dependent | SUPPORTS, SUPPORTS | AUTOMATED_REVIEW_QUALIFIED |
| ctp-dynamic-bolus | cerebral-perfusion | ct-perfusion | USES | ctp-dynamic-bolus | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| deconvolution-affects-output | cerebral-perfusion | deconvolution | INFLUENCES | deconvolution-affects-output | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| different-postprocessing-poor-correlation | cerebral-perfusion | perfusion-software | PRODUCED | different-postprocessing-poor-correlation | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| dsc-dynamic-susceptibility | cerebral-perfusion | mr-dsc-perfusion | USES | dsc-dynamic-susceptibility | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| map-distinct-segmentation | cerebral-perfusion | perfusion-parametric-map | IS_DISTINCT_FROM | map-distinct-segmentation | SUPPORTS, QUALIFIES | AUTOMATED_REVIEW_PASSED |
| mtt-algorithm-sensitive | cerebral-perfusion | mtt | DEPENDS_ON | mtt-algorithm-sensitive | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| mtt-central-volume-relation | cerebral-perfusion | mtt | CAN_BE_DERIVED_FROM | mtt-central-volume-relation | DERIVES | AUTOMATED_REVIEW_QUALIFIED |
| operator-less-than-vendor | cerebral-perfusion | perfusion-software | VARIABILITY_WAS_MORE_INFLUENCED_BY | operator-less-than-vendor | SUPPORTS | AUTOMATED_REVIEW_QUALIFIED |
| penumbra-volume-software-dependent | cerebral-perfusion | penumbra-segmentation | DEPENDS_ON | penumbra-volume-software-dependent | SUPPORTS, QUALIFIES | AUTOMATED_REVIEW_PASSED |
| perfusion-units-distinct | cerebral-perfusion | cbf | HAS_UNIT_DISTINCT_FROM | perfusion-units-distinct | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| rcbf-threshold-algorithm-calibration | cerebral-perfusion | cbf | HAD_ALGORITHM_SPECIFIC_THRESHOLDS | rcbf-threshold-algorithm-calibration | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| scan-truncation-bias | cerebral-perfusion | ct-perfusion | IS_LIMITED_BY | scan-truncation-bias | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| three-packages-different-volumes | cerebral-perfusion | lesion-volume | DIFFERED_BETWEEN | three-packages-different-volumes | SUPPORTS | AUTOMATED_REVIEW_QUALIFIED |
| threshold-package-specific | cerebral-perfusion | perfusion-software | REQUIRES_CONTEXT_FOR | threshold-package-specific | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| tmax-not-direct-flow | cerebral-perfusion | tmax | IS_NOT | tmax-not-direct-flow | QUALIFIES | AUTOMATED_REVIEW_QUALIFIED |
| tmax-residue-time | cerebral-perfusion | tmax | IS_DEFINED_AS | tmax-residue-time | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| tmax-six-second-study-context | cerebral-perfusion | tmax | USED_THRESHOLD | tmax-six-second-study-context | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| two-packages-agreement-context | cerebral-perfusion | perfusion-software | SHOWED | two-packages-agreement-context | QUALIFIES | AUTOMATED_REVIEW_QUALIFIED |
| validated-software-guidance | cerebral-perfusion | ct-perfusion | REQUIRES | validated-software-guidance | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| vendor-variability | cerebral-perfusion | perfusion-software | WAS_ASSOCIATED_WITH | vendor-variability | SUPPORTS | AUTOMATED_REVIEW_QUALIFIED |
| adc-calculation-more-variable-than-roi | diffusion-adc | adc-value | VARIABILITY_WAS_MORE_INFLUENCED_BY | adc-calculation-more-variable-than-roi | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| adc-depends-on-b-values | diffusion-adc | adc-value | DEPENDS_ON | adc-depends-on-b-values | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| adc-is-derived-measurement | diffusion-adc | adc-value | HAS_METROLOGICAL_ROLE | adc-is-derived-measurement | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| adc-map-is-calculated-output | diffusion-adc | adc-map | IS_CALCULATED_FROM | adc-map-is-calculated-output | SUPPORTS, SUPPORTS | AUTOMATED_REVIEW_PASSED |
| adc-unit | diffusion-adc | adc-value | HAS_UNIT | adc-unit | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| b-selection-limits-comparability | diffusion-adc | b-value | LIMITS_COMPARABILITY_OF | b-selection-limits-comparability | SUPPORTS, QUALIFIES | AUTOMATED_REVIEW_PASSED |
| b-value-unit | diffusion-adc | b-value | HAS_UNIT | b-value-unit | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| brain-multicenter-cv | diffusion-adc | adc-reproducibility | WAS_OBSERVED_AS | brain-multicenter-cv | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| dwi-distortion | diffusion-adc | dwi | IS_LIMITED_BY | dwi-distortion | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| dwi-early-stroke-sensitivity | diffusion-adc | dwi | CAN_DETECT | dwi-early-stroke-sensitivity | SUPPORTS | AUTOMATED_REVIEW_QUALIFIED |
| dwi-false-negative | diffusion-adc | dwi | CAN_HAVE | dwi-false-negative | SUPPORTS | AUTOMATED_REVIEW_QUALIFIED |
| dwi-is-acquisition | diffusion-adc | dwi | IS_ACQUISITION_SENSITIVE_TO | dwi-is-acquisition | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| dwi-lesion-can-reverse | diffusion-adc | diffusion-restriction | CAN_BE | dwi-lesion-can-reverse | QUALIFIES | AUTOMATED_REVIEW_QUALIFIED |
| dwi-not-irreversible-core | diffusion-adc | diffusion-restriction | IS_NOT_EQUIVALENT_TO | dwi-not-irreversible-core | REFUTES | AUTOMATED_REVIEW_CONTESTED |
| gradient-nonlinearity-offcenter | diffusion-adc | gradient-nonlinearity | CAUSES_SPATIAL_BIAS_IN | gradient-nonlinearity-offcenter | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| low-b-perfusion-contribution | diffusion-adc | low-b-perfusion | CAN_INFLUENCE | low-b-perfusion-contribution | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| noise-biases-adc | diffusion-adc | adc-value | IS_LIMITED_BY | noise-biases-adc | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| phantom-isocenter-three-percent | diffusion-adc | adc-reproducibility | WAS_OBSERVED_AS | phantom-isocenter-three-percent | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| phantom-not-clinical-validation | diffusion-adc | diffusion-phantom | DOES_NOT_ESTABLISH | phantom-not-clinical-validation | QUALIFIES | AUTOMATED_REVIEW_QUALIFIED |
| phantom-offcenter-ten-percent | diffusion-adc | gradient-nonlinearity | WAS_ASSOCIATED_WITH | phantom-offcenter-ten-percent | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| qiba-requires-qc | diffusion-adc | qiba-adc-profile | REQUIRES | qiba-requires-qc | SUPPORTS, SUPPORTS | AUTOMATED_REVIEW_PASSED |
| repeatability-distinct | diffusion-adc | adc-repeatability | IS_DISTINCT_FROM | repeatability-distinct | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| reproducibility-multiple-factors | diffusion-adc | adc-reproducibility | DEPENDS_ON | reproducibility-multiple-factors | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| small-structures-more-variable | diffusion-adc | adc-reproducibility | IS_LOWER_IN | small-structures-more-variable | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| association-not-causality | myocardial-tissue-characterization | microvascular-obstruction | DOES_NOT_ESTABLISH | association-not-causality | QUALIFIES | AUTOMATED_REVIEW_QUALIFIED |
| dark-blood-contrast | myocardial-tissue-characterization | dark-blood-lge | IMPROVED | dark-blood-contrast | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| findings-not-automatic-measures | myocardial-tissue-characterization | intramyocardial-hemorrhage | IS_NOT_AUTOMATICALLY | findings-not-automatic-measures | QUALIFIES | AUTOMATED_REVIEW_QUALIFIED |
| hcm-fwhm-reproducible | myocardial-tissue-characterization | lge-quantification | FWHM_WAS | hcm-fwhm-reproducible | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| hcm-fwhm-underestimated | myocardial-tissue-characterization | lge-quantification | FWHM_WAS | hcm-fwhm-underestimated | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| hcm-three-sd-closest-manual | myocardial-tissue-characterization | lge-quantification | WAS_CLOSEST_TO | hcm-three-sd-closest-manual | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| imh-associated-outcomes | myocardial-tissue-characterization | intramyocardial-hemorrhage | IS_ASSOCIATED_WITH | imh-associated-outcomes | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| imh-distinct-mvo | myocardial-tissue-characterization | intramyocardial-hemorrhage | IS_DISTINCT_FROM | imh-distinct-mvo | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| imh-no-standard-protocol | myocardial-tissue-characterization | intramyocardial-hemorrhage | LACKS | imh-no-standard-protocol | QUALIFIES | AUTOMATED_REVIEW_QUALIFIED |
| imh-t2-detection | myocardial-tissue-characterization | intramyocardial-hemorrhage | CAN_BE_DETECTED_WITH | imh-t2-detection | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| imh-t2star-detection | myocardial-tissue-characterization | intramyocardial-hemorrhage | CAN_BE_DETECTED_WITH | imh-t2star-detection | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| imh-timing-dependent | myocardial-tissue-characterization | intramyocardial-hemorrhage | DETECTION_DEPENDS_ON | imh-timing-dependent | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| ir-myocardial-nulling | myocardial-tissue-characterization | inversion-recovery | ENABLES | ir-myocardial-nulling | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| lge-finding-not-acquisition | myocardial-tissue-characterization | lge-finding | IS_DISTINCT_FROM | lge-finding-not-acquisition | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| lge-fwhm-method | myocardial-tissue-characterization | lge-quantification | CAN_USE | lge-fwhm-method | SUPPORTS | AUTOMATED_REVIEW_QUALIFIED |
| lge-manual-quantification | myocardial-tissue-characterization | lge-quantification | CAN_USE | lge-manual-quantification | SUPPORTS | AUTOMATED_REVIEW_QUALIFIED |
| lge-methods-different-extent | myocardial-tissue-characterization | lge-quantification | PRODUCES_METHOD_DEPENDENT | lge-methods-different-extent | SUPPORTS, SUPPORTS | AUTOMATED_REVIEW_QUALIFIED |
| lge-pattern-characterization | myocardial-tissue-characterization | lge-pattern | CONTRIBUTES_TO | lge-pattern-characterization | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| lge-postcontrast-acquisition | myocardial-tissue-characterization | lge-acquisition | USES | lge-postcontrast-acquisition | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| lge-sd-thresholds | myocardial-tissue-characterization | lge-quantification | CAN_USE | lge-sd-thresholds | SUPPORTS | AUTOMATED_REVIEW_QUALIFIED |
| mvo-associated-remodeling | myocardial-tissue-characterization | microvascular-obstruction | IS_ASSOCIATED_WITH | mvo-associated-remodeling | SUPPORTS, QUALIFIES | AUTOMATED_REVIEW_PASSED |
| mvo-dark-core-lge | myocardial-tissue-characterization | microvascular-obstruction | CAN_APPEAR_AS | mvo-dark-core-lge | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| mvo-no-reflow | myocardial-tissue-characterization | microvascular-obstruction | REPRESENTS | mvo-no-reflow | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| myocarditis-threshold-dependent | myocardial-tissue-characterization | lge-quantification | PRODUCED_DIFFERENT | myocarditis-threshold-dependent | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| psir-method-role | myocardial-tissue-characterization | psir | HAS_ROLE | psir-method-role | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| dect-multiple-implementations | spectral-ct | dual-energy-ct | HAS_MULTIPLE | dect-multiple-implementations | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| dual-layer-simultaneous | spectral-ct | dual-layer-detector | SEPARATES | dual-layer-simultaneous | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| dual-source-distinct | spectral-ct | dual-source-de | IS_DISTINCT_FROM | dual-source-distinct | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| high-kev-artifact | spectral-ct | virtual-monoenergetic-image | HIGH_ENERGY_CAN_REDUCE | high-kev-artifact | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| intermanufacturer-variability | spectral-ct | iodine-concentration | DIFFERS_BETWEEN | intermanufacturer-variability | SUPPORTS, SUPPORTS | AUTOMATED_REVIEW_QUALIFIED |
| iodine-accuracy-system-dependent | spectral-ct | iodine-concentration | ACCURACY_DEPENDS_ON | iodine-accuracy-system-dependent | SUPPORTS | AUTOMATED_REVIEW_QUALIFIED |
| iodine-concentration-measure | spectral-ct | iodine-concentration | IS_DERIVED_FROM | iodine-concentration-measure | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| iodine-dose-noise | spectral-ct | iodine-concentration | PRECISION_DEPENDS_ON | iodine-dose-noise | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| iodine-map-not-ct-ecv | spectral-ct | iodine-map | IS_NOT | iodine-map-not-ct-ecv | REFUTES | AUTOMATED_REVIEW_CONTESTED |
| iodine-map-output | spectral-ct | iodine-map | IS_OUTPUT_OF | iodine-map-output | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| iodine-patient-size | spectral-ct | iodine-concentration | ERROR_DEPENDS_ON | iodine-patient-size | SUPPORTS | AUTOMATED_REVIEW_QUALIFIED |
| iodine-unit | spectral-ct | iodine-concentration | HAS_UNIT | iodine-unit | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| lod-platform-size | spectral-ct | iodine-concentration | DETECTION_LIMIT_DEPENDS_ON | lod-platform-size | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| low-kev-iodine-contrast | spectral-ct | virtual-monoenergetic-image | LOW_ENERGY_INCREASES | low-kev-iodine-contrast | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| low-kev-noise | spectral-ct | virtual-monoenergetic-image | LOW_ENERGY_CAN_INCREASE | low-kev-noise | QUALIFIES | AUTOMATED_REVIEW_QUALIFIED |
| material-basis-dependent | spectral-ct | material-decomposition | DEPENDS_ON | material-basis-dependent | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| normalization-reduces-not-erases | spectral-ct | spectral-calibration | CAN_REDUCE | normalization-reduces-not-erases | QUALIFIES, QUALIFIES | AUTOMATED_REVIEW_QUALIFIED |
| pcct-benefits-potential | spectral-ct | photon-counting-ct | HAS | pcct-benefits-potential | QUALIFIES | AUTOMATED_REVIEW_QUALIFIED |
| pcct-direct-conversion | spectral-ct | photon-counting-ct | USES | pcct-direct-conversion | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| pcct-distinct-dect | spectral-ct | photon-counting-ct | IS_DISTINCT_FROM | pcct-distinct-dect | SUPPORTS, MENTIONS | AUTOMATED_REVIEW_PASSED |
| rapid-kvp-distinct | spectral-ct | rapid-kvp-switching | IS_DISTINCT_FROM | rapid-kvp-distinct | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| spectral-energy-information | spectral-ct | spectral-ct | USES | spectral-energy-information | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| vmi-energy-specific | spectral-ct | virtual-monoenergetic-image | REQUIRES | vmi-energy-specific | SUPPORTS | AUTOMATED_REVIEW_PASSED |
| vnc-not-true-noncontrast | spectral-ct | virtual-non-contrast | IS_NOT_EQUIVALENT_TO | vnc-not-true-noncontrast | QUALIFIES | AUTOMATED_REVIEW_QUALIFIED |

| EvidenceLink | Source | Assertion | Relation | Localisateur | Confiance |
| --- | --- | --- | --- | --- | --- |
| aif-input:primary | 21640299 | revision | SUPPORTS | PMC3135980 — Theory, arterial input function and deconvolution | HIGH |
| cbf-residue-amplitude:primary | 21640299 | revision | SUPPORTS | PMC3135980 — Theory, residue function and CBF | HIGH |
| common-postprocessing-strong-correlation:primary | 31019604 | revision | SUPPORTS | PMC6479142 — Results, common post-processing comparison | HIGH |
| core-volume-software-dependent:primary | 31203208 | revision | SUPPORTS | PubMed abstract — Results, comparison of three CT perfusion packages | MODERATE |
| core-volume-software-dependent:supplementary-04 | 37021148 | revision | SUPPORTS | PMC10069177 — Results, core volume differences between software | MODERATE |
| ctp-dynamic-bolus:primary | 30346227 | revision | SUPPORTS | PMC6727131 — Acquisition section, dynamic contrast passage | HIGH |
| deconvolution-affects-output:primary | 21640299 | revision | SUPPORTS | PMC3135980 — Perfusion analysis, deconvolution algorithms | HIGH |
| different-postprocessing-poor-correlation:primary | 31019604 | revision | SUPPORTS | PMC6479142 — Results, cross-program penumbra and core measurements | HIGH |
| dsc-dynamic-susceptibility:primary | 25907520 | revision | SUPPORTS | PMC5074767 — Technique description, DSC bolus acquisition | HIGH |
| map-distinct-segmentation:primary | 30346227 | revision | SUPPORTS | PMC6727131 — Output interpretation, maps and automated lesion volumes | HIGH |
| map-distinct-segmentation:supplementary-06 | 23264345 | revision | QUALIFIES | PubMed abstract — Methods and Results, parametric maps versus infarct and penumbra classification | HIGH |
| mtt-algorithm-sensitive:primary | 21640299 | revision | SUPPORTS | PMC3135980 — Analysis limitations, MTT and algorithm dependence | HIGH |
| mtt-central-volume-relation:primary | 21640299 | revision | DERIVES | PMC3135980 — Theory, central volume principle | HIGH |
| operator-less-than-vendor:primary | 21785096 | revision | SUPPORTS | PubMed abstract — Results, vendor and operator effects | MODERATE |
| penumbra-volume-software-dependent:primary | 37021148 | revision | SUPPORTS | PMC10069177 — Results, perfusion lesion volume comparison | HIGH |
| penumbra-volume-software-dependent:supplementary-05 | 36010624 | revision | QUALIFIES | PMC9406974 — Results, two-package penumbra comparison | HIGH |
| perfusion-units-distinct:primary | 21640299 | revision | SUPPORTS | PMC3135980 — Theory and parameter definitions, CBF and CBV units | HIGH |
| rcbf-threshold-algorithm-calibration:primary | 38052882 | revision | SUPPORTS | PMC10698076 — Results, rCBF threshold calibration by deconvolution algorithm | HIGH |
| scan-truncation-bias:primary | 30346227 | revision | SUPPORTS | PMC6727131 — Acquisition pitfalls, bolus delay and scan duration | HIGH |
| three-packages-different-volumes:primary | 31203208 | revision | SUPPORTS | PubMed abstract — Results, lesion volume estimates across three packages | MODERATE |
| threshold-package-specific:primary | 30346227 | revision | SUPPORTS | PMC6727131 — Practical guidance, package-specific thresholds | HIGH |
| tmax-not-direct-flow:primary | 21640299 | revision | QUALIFIES | PMC3135980 — Interpretation of Tmax, physiologic limitations | HIGH |
| tmax-residue-time:primary | 21640299 | revision | SUPPORTS | PMC3135980 — Theory, definition of Tmax | HIGH |
| tmax-six-second-study-context:primary | 38052882 | revision | SUPPORTS | PMC10698076 — Methods, Tmax hypoperfusion threshold | HIGH |
| two-packages-agreement-context:primary | 36010624 | revision | QUALIFIES | PMC9406974 — Results, agreement between two software packages | HIGH |
| validated-software-guidance:primary | 30346227 | revision | SUPPORTS | PMC6727131 — Practical recommendations, implementation and quality assurance | HIGH |
| vendor-variability:primary | 21785096 | revision | SUPPORTS | PubMed abstract — Results, relative vendor variability | MODERATE |
| adc-calculation-more-variable-than-roi:primary | 37437609 | revision | SUPPORTS | PMC11197850 — Results and Recommendations, calculation versus delineation variability | HIGH |
| adc-depends-on-b-values:primary | 26892827 | revision | SUPPORTS | PMC4983499 — Acquisition recommendations, choice of b-values | HIGH |
| adc-is-derived-measurement:primary | 39377680 | revision | SUPPORTS | PMC11537247 — Profile claims, ADC as a quantitative imaging biomarker | HIGH |
| adc-map-is-calculated-output:primary | 39377680 | revision | SUPPORTS | PMC11537247 — QIBA Profile overview, ADC map derivation | HIGH |
| adc-map-is-calculated-output:supplementary-01 | 38535004 | revision | SUPPORTS | PMC10969680 — Methods, ADC map calculation in the QIBA workflow | HIGH |
| adc-unit:primary | 26892827 | revision | SUPPORTS | PMC4983499 — Technical considerations, ADC units | HIGH |
| b-selection-limits-comparability:primary | 28956113 | revision | SUPPORTS | PMC5811587 — Protocol standardization, b-value harmonization | HIGH |
| b-selection-limits-comparability:supplementary-03 | 19186405 | revision | QUALIFIES | PMC2631136 — Consensus recommendations, acquisition standardization and b-value reporting | HIGH |
| b-value-unit:primary | 26892827 | revision | SUPPORTS | PMC4983499 — Technical considerations, b-value definition | HIGH |
| brain-multicenter-cv:primary | 25802212 | revision | SUPPORTS | PMC4403968 — Results, regional ADC reproducibility | HIGH |
| dwi-distortion:primary | 28956113 | revision | SUPPORTS | PMC5811587 — Technical quality, distortion control | HIGH |
| dwi-early-stroke-sensitivity:primary | 33836457 | revision | SUPPORTS | PubMed abstract — Background and review scope on acute ischemic stroke | MODERATE |
| dwi-false-negative:primary | 33836457 | revision | SUPPORTS | PubMed abstract — Interpretation pitfalls, false-negative DWI | MODERATE |
| dwi-is-acquisition:primary | 26892827 | revision | SUPPORTS | PMC4983499 — Introduction, definition of diffusion-weighted imaging | HIGH |
| dwi-lesion-can-reverse:primary | 33836457 | revision | QUALIFIES | PubMed abstract — Interpretation pitfalls, lesion reversibility | MODERATE |
| dwi-not-irreversible-core:primary | 33836457 | revision | REFUTES | PubMed abstract — Interpretation pitfalls, DWI lesion meaning | MODERATE |
| gradient-nonlinearity-offcenter:primary | 23023785 | revision | SUPPORTS | PMC3548033 — Results and Discussion, off-center gradient nonlinearity | HIGH |
| low-b-perfusion-contribution:primary | 26892827 | revision | SUPPORTS | PMC4983499 — Technical considerations, perfusion contribution at low b-values | HIGH |
| noise-biases-adc:primary | 26892827 | revision | SUPPORTS | PMC4983499 — Technical limitations, noise and fitting | HIGH |
| phantom-isocenter-three-percent:primary | 23023785 | revision | SUPPORTS | PMC3548033 — Results, intersystem isocenter reproducibility | HIGH |
| phantom-not-clinical-validation:primary | 38535004 | revision | QUALIFIES | PMC10969680 — Discussion, transition from phantom validation to clinical application | HIGH |
| phantom-offcenter-ten-percent:primary | 23023785 | revision | SUPPORTS | PMC3548033 — Results, off-center spatial bias | HIGH |
| qiba-requires-qc:primary | 39377680 | revision | SUPPORTS | PMC11537247 — Profile conformance and quality-control sections | HIGH |
| qiba-requires-qc:supplementary-02 | 38535004 | revision | SUPPORTS | PMC10969680 — Phantom validation and QIBA conformance workflow | HIGH |
| repeatability-distinct:primary | 26892827 | revision | SUPPORTS | PMC4983499 — Reproducibility section, terminology | HIGH |
| reproducibility-multiple-factors:primary | 39377680 | revision | SUPPORTS | PMC11537247 — Sources of variation and conformance requirements | HIGH |
| small-structures-more-variable:primary | 25802212 | revision | SUPPORTS | PMC4403968 — Discussion, influence of structure size | HIGH |
| association-not-causality:primary | 25212800 | revision | QUALIFIES | PMC4301583 — Discussion, limitations of observational prognostic evidence | HIGH |
| dark-blood-contrast:primary | 29162123 | revision | SUPPORTS | PMC5696884 — Results, scar-to-blood contrast comparison | HIGH |
| findings-not-automatic-measures:primary | 30231886 | revision | QUALIFIES | PMC6147157 — Endpoint framework, qualitative and quantitative endpoint distinction | HIGH |
| hcm-fwhm-reproducible:primary | 25315701 | revision | SUPPORTS | PMC4189726 — Results, interobserver and intraobserver reproducibility | HIGH |
| hcm-fwhm-underestimated:primary | 25315701 | revision | SUPPORTS | PMC4189726 — Results, FWHM bias relative to manual planimetry | HIGH |
| hcm-three-sd-closest-manual:primary | 25315701 | revision | SUPPORTS | PMC4189726 — Results, accuracy relative to manual planimetry | HIGH |
| imh-associated-outcomes:primary | 25212800 | revision | SUPPORTS | PMC4301583 — Results, hemorrhage and clinical outcomes | HIGH |
| imh-distinct-mvo:primary | 23021401 | revision | SUPPORTS | PMC3514126 — Hemorrhage and microvascular obstruction, pathophysiologic distinction | HIGH |
| imh-no-standard-protocol:primary | 25759823 | revision | QUALIFIES | PMC4336749 — Discussion, heterogeneity of CMR methods | HIGH |
| imh-t2-detection:primary | 23021401 | revision | SUPPORTS | PMC3514126 — CMR methods for hemorrhage, T2-weighted imaging | HIGH |
| imh-t2star-detection:primary | 25759823 | revision | SUPPORTS | PMC4336749 — CMR assessment, T2* detection of hemorrhage | HIGH |
| imh-timing-dependent:primary | 29712696 | revision | SUPPORTS | PMC5933067 — Intramyocardial hemorrhage, temporal evolution | HIGH |
| ir-myocardial-nulling:primary | 30231886 | revision | SUPPORTS | PMC6147157 — LGE acquisition, inversion time and nulling | HIGH |
| lge-finding-not-acquisition:primary | 30231886 | revision | SUPPORTS | PMC6147157 — Endpoint definitions, acquisition versus LGE endpoint | HIGH |
| lge-fwhm-method:primary | 21329899 | revision | SUPPORTS | PubMed abstract — Methods, FWHM scar quantification | MODERATE |
| lge-manual-quantification:primary | 21329899 | revision | SUPPORTS | PubMed abstract — Methods, manual scar quantification reference | MODERATE |
| lge-methods-different-extent:primary | 21329899 | revision | SUPPORTS | PubMed abstract — Results, comparison of scar quantification methods | MODERATE |
| lge-methods-different-extent:supplementary-07 | 30813942 | revision | SUPPORTS | PMC6393997 — Results, LGE extent across quantification methods | MODERATE |
| lge-pattern-characterization:primary | 30231886 | revision | SUPPORTS | PMC6147157 — LGE endpoint interpretation, distribution patterns | HIGH |
| lge-postcontrast-acquisition:primary | 30231886 | revision | SUPPORTS | PMC6147157 — Late gadolinium enhancement endpoint, acquisition description | HIGH |
| lge-sd-thresholds:primary | 21329899 | revision | SUPPORTS | PubMed abstract — Methods, standard-deviation threshold techniques | MODERATE |
| mvo-associated-remodeling:primary | 25212800 | revision | SUPPORTS | PMC4301583 — Results, MVO and LV remodeling | HIGH |
| mvo-associated-remodeling:supplementary-08 | 29712696 | revision | QUALIFIES | PMC5933067 — Review, prognostic interpretation of MVO | HIGH |
| mvo-dark-core-lge:primary | 23021401 | revision | SUPPORTS | PMC3514126 — CMR appearance of late microvascular obstruction | HIGH |
| mvo-no-reflow:primary | 23021401 | revision | SUPPORTS | PMC3514126 — Microvascular obstruction, definition of no-reflow | HIGH |
| myocarditis-threshold-dependent:primary | 30813942 | revision | SUPPORTS | PMC6393997 — Results, fibrosis burden by quantification method | HIGH |
| psir-method-role:primary | 30231886 | revision | SUPPORTS | PMC6147157 — LGE acquisition methods, PSIR | HIGH |
| dect-multiple-implementations:primary | 36828369 | revision | SUPPORTS | PMC9964233 — Dual-energy system architectures | HIGH |
| dual-layer-simultaneous:primary | 28168368 | revision | SUPPORTS | PMC5544802 — Methods, dual-layer system principle | HIGH |
| dual-source-distinct:primary | 36828369 | revision | SUPPORTS | PMC9964233 — System comparison, dual-source and rapid switching | HIGH |
| high-kev-artifact:primary | 30919651 | revision | SUPPORTS | PMC6592074 — High-keV VMI, artifact reduction | HIGH |
| intermanufacturer-variability:primary | 29185902 | revision | SUPPORTS | PubMed abstract — Results, intermanufacturer comparison | MODERATE |
| intermanufacturer-variability:supplementary-09 | 28168368 | revision | SUPPORTS | PMC5544802 — Results, dual-source and dual-layer iodine accuracy | MODERATE |
| iodine-accuracy-system-dependent:primary | 29185902 | revision | SUPPORTS | PubMed abstract — Results, intermanufacturer iodine quantification | MODERATE |
| iodine-concentration-measure:primary | 28168368 | revision | SUPPORTS | PMC5544802 — Methods, iodine quantification from spectral data | HIGH |
| iodine-dose-noise:primary | 31237496 | revision | SUPPORTS | PMC6694721 — Results, dose and iodine detection limits | HIGH |
| iodine-map-not-ct-ecv:primary | 33411614 | revision | REFUTES | PMC7853765 — Material maps and clinical outputs, iodine map definition | HIGH |
| iodine-map-output:primary | 33411614 | revision | SUPPORTS | PMC7853765 — Iodine maps, material decomposition outputs | HIGH |
| iodine-patient-size:primary | 30276672 | revision | SUPPORTS | PubMed abstract — Results, size-dependent detection and precision | MODERATE |
| iodine-unit:primary | 28168368 | revision | SUPPORTS | PMC5544802 — Methods and Results, iodine concentration units | HIGH |
| lod-platform-size:primary | 31237496 | revision | SUPPORTS | PMC6694721 — Results, lower detection limits by scanner and phantom size | HIGH |
| low-kev-iodine-contrast:primary | 30919651 | revision | SUPPORTS | PMC6592074 — Low-keV VMI, iodine contrast | HIGH |
| low-kev-noise:primary | 30919651 | revision | QUALIFIES | PMC6592074 — Low-keV VMI, noise trade-off | HIGH |
| material-basis-dependent:primary | 33411614 | revision | SUPPORTS | PMC7853765 — Material decomposition, basis-material assumptions | HIGH |
| normalization-reduces-not-erases:primary | 38189979 | revision | QUALIFIES | PubMed abstract — Results and Conclusion, normalization across platforms | MODERATE |
| normalization-reduces-not-erases:supplementary-10 | 34668387 | revision | QUALIFIES | PubMed abstract — Results, method for reducing low-iodine intermanufacturer variability | MODERATE |
| pcct-benefits-potential:primary | 36047540 | revision | QUALIFIES | PMC9434736 — Clinical translation and limitations | HIGH |
| pcct-direct-conversion:primary | 36047540 | revision | SUPPORTS | PMC9434736 — Detector principles, direct conversion and energy bins | HIGH |
| pcct-distinct-dect:primary | 36047540 | revision | SUPPORTS | PMC9434736 — Detector principles, PCCT versus energy-integrating CT | HIGH |
| pcct-distinct-dect:supplementary-11 | 36828369 | revision | MENTIONS | PMC9964233 — Discussion, photon-counting as a separate spectral architecture | HIGH |
| rapid-kvp-distinct:primary | 36828369 | revision | SUPPORTS | PMC9964233 — System comparison, source-based and detector-based approaches | HIGH |
| spectral-energy-information:primary | 36828369 | revision | SUPPORTS | PMC9964233 — Introduction, principles of dual-energy CT | HIGH |
| vmi-energy-specific:primary | 30919651 | revision | SUPPORTS | PMC6592074 — Technique, virtual monoenergetic energy selection | HIGH |
| vnc-not-true-noncontrast:primary | 33411614 | revision | QUALIFIES | PMC7853765 — Virtual noncontrast pitfalls | HIGH |

| Domaine | Mesures | Méthodes | Findings | Limitations | Contradictions |
| --- | --- | --- | --- | --- | --- |
| diffusion-adc | 4 | monoexponential-adc, diffusion-gradient-encoding, repeat-measurement-analysis, multisystem-comparison |  | 10 | CONTEXT_DIFFERENCE |
| cerebral-perfusion | 4 | deconvolution, contrast-time-curve-integration, central-volume-model, deconvolution | ischemic-core-segmentation, penumbra-segmentation | 10 | METHOD_DIFFERENCE |
| myocardial-tissue-characterization | 4 | lge-quantification, manual-or-threshold-segmentation, t2-or-t2star-assessment, multi-echo-t2star-fitting | lge-finding, intramyocardial-hemorrhage, microvascular-obstruction, lge-pattern | 5 | METHOD_DIFFERENCE |
| spectral-ct | 4 | material-decomposition, vmi-reconstruction, iodine-subtraction, material-decomposition |  | 11 | PLATFORM_DIFFERENCE |

| Contradiction | Domaine | Classification | Contextes | Décision |
| --- | --- | --- | --- | --- |
| noxia:radiology:p5:contrast:diffusion:phantom-versus-invivo | diffusion-adc | CONTEXT_DIFFERENCE | Tight phantom performance and wider in-vivo regional variability address different objects, anatomy and acquisition conditions. | PRESERVE_SEPARATE_PHANTOM_AND_IN_VIVO_PERFORMANCE_CONTEXTS |
| noxia:radiology:p5:contrast:perfusion:software-agreement | cerebral-perfusion | METHOD_DIFFERENCE | Reported agreement changes with package pair, common versus separate segmentation, cohort and output definition. | PRESERVE_SOFTWARE_AND_WORKFLOW_CONTEXT |
| noxia:radiology:p5:contrast:cardiac:lge-quantification | myocardial-tissue-characterization | METHOD_DIFFERENCE | A method can be more reproducible while producing a systematically different extent; disease context also changes method behavior. | PRESERVE_ACCURACY_REPRODUCIBILITY_AND_DISEASE_CONTEXTS |
| noxia:radiology:p5:contrast:spectral:iodine-platform-variability | spectral-ct | PLATFORM_DIFFERENCE | Normalization can reduce observed variability without establishing platform interchangeability or common detection limits. | PRESERVE_PLATFORM_SIZE_DOSE_AND_NORMALIZATION_CONTEXTS |

## 15–16. Synthèses et projections internes

| Synthèse | Domaine | Assertions | Sources | Contradictions | Confiance | Lacunes |
| --- | --- | --- | --- | --- | --- | --- |
| diffusion-definition-methods | diffusion-adc | 15 | 8 | CONTEXT_DIFFERENCE | MODERATE_TO_HIGH | CLINICAL_THRESHOLDS_EXCLUDED_WITHOUT_COMPLETE_CONTEXT, FIELD_STRENGTH_EFFECT_NOT_SUFFICIENTLY_RESOLVED, VENDOR_AND_RECONSTRUCTION_DETAILS_INCOMPLETELY_REPORTED |
| diffusion-documented-applications | diffusion-adc | 4 | 1 | none | MODERATE | CLINICAL_THRESHOLDS_EXCLUDED_WITHOUT_COMPLETE_CONTEXT, FIELD_STRENGTH_EFFECT_NOT_SUFFICIENTLY_RESOLVED, VENDOR_AND_RECONSTRUCTION_DETAILS_INCOMPLETELY_REPORTED |
| diffusion-technical-limitations | diffusion-adc | 6 | 5 | CONTEXT_DIFFERENCE | MODERATE_TO_HIGH | CLINICAL_THRESHOLDS_EXCLUDED_WITHOUT_COMPLETE_CONTEXT, FIELD_STRENGTH_EFFECT_NOT_SUFFICIENTLY_RESOLVED, VENDOR_AND_RECONSTRUCTION_DETAILS_INCOMPLETELY_REPORTED |
| myocardial-definitions-acquisitions | myocardial-tissue-characterization | 25 | 9 | METHOD_DIFFERENCE | MODERATE_TO_HIGH | NO_UNIFORM_IMH_PROTOCOL, QUANTIFICATION_METHODS_NOT_INTERCHANGEABLE, TIMING_AND_DEFINITION_HETEROGENEITY |
| myocardial-quantification-methods | myocardial-tissue-characterization | 8 | 3 | METHOD_DIFFERENCE | MODERATE_TO_HIGH | NO_UNIFORM_IMH_PROTOCOL, QUANTIFICATION_METHODS_NOT_INTERCHANGEABLE, TIMING_AND_DEFINITION_HETEROGENEITY |
| myocardial-value-limitations | myocardial-tissue-characterization | 5 | 5 | METHOD_DIFFERENCE | MODERATE_TO_HIGH | NO_UNIFORM_IMH_PROTOCOL, QUANTIFICATION_METHODS_NOT_INTERCHANGEABLE, TIMING_AND_DEFINITION_HETEROGENEITY |
| perfusion-parameters-methods | cerebral-perfusion | 24 | 10 | METHOD_DIFFERENCE | MODERATE_TO_HIGH | MR_AND_CT_OUTPUTS_NOT_ASSUMED_EQUIVALENT, NO_UNIVERSAL_SOFTWARE_INDEPENDENT_THRESHOLD, SOFTWARE_GENERATION_AND_VERSION_OFTEN_UNREPORTED |
| perfusion-software-differences | cerebral-perfusion | 8 | 6 | METHOD_DIFFERENCE | MODERATE_TO_HIGH | MR_AND_CT_OUTPUTS_NOT_ASSUMED_EQUIVALENT, NO_UNIVERSAL_SOFTWARE_INDEPENDENT_THRESHOLD, SOFTWARE_GENERATION_AND_VERSION_OFTEN_UNREPORTED |
| perfusion-threshold-variability | cerebral-perfusion | 7 | 5 | METHOD_DIFFERENCE | MODERATE_TO_HIGH | MR_AND_CT_OUTPUTS_NOT_ASSUMED_EQUIVALENT, NO_UNIVERSAL_SOFTWARE_INDEPENDENT_THRESHOLD, SOFTWARE_GENERATION_AND_VERSION_OFTEN_UNREPORTED |
| spectral-quantitative-outputs | spectral-ct | 9 | 5 | PLATFORM_DIFFERENCE | MODERATE_TO_HIGH | CLINICAL_INTERPLATFORM_REPRODUCIBILITY_LIMITED, PLATFORM_VERSION_OFTEN_UNREPORTED, TECHNICAL_CAPABILITY_NOT_CLINICAL_OUTCOME |
| spectral-reproducibility-limitations | spectral-ct | 4 | 6 | PLATFORM_DIFFERENCE | MODERATE | CLINICAL_INTERPLATFORM_REPRODUCIBILITY_LIMITED, PLATFORM_VERSION_OFTEN_UNREPORTED, TECHNICAL_CAPABILITY_NOT_CLINICAL_OUTCOME |
| spectral-technologies | spectral-ct | 24 | 10 | PLATFORM_DIFFERENCE | MODERATE_TO_HIGH | CLINICAL_INTERPLATFORM_REPRODUCIBILITY_LIMITED, PLATFORM_VERSION_OFTEN_UNREPORTED, TECHNICAL_CAPABILITY_NOT_CLINICAL_OUTCOME |

| Projection interne | Domaine | Scientific Ready | Editorial Ready | Public Ready | Blocage |
| --- | --- | --- | --- | --- | --- |
| adc-limitations-state-of-knowledge | diffusion-adc | true | true | false | PUBLICATION_OUT_OF_SCOPE, NO_ROUTE, NO_CANONICAL |
| adc-scientific-sheet | diffusion-adc | true | true | false | PUBLICATION_OUT_OF_SCOPE, NO_ROUTE, NO_CANONICAL |
| cbf-cbv-tmax-documentary-comparison | cerebral-perfusion | true | true | false | PUBLICATION_OUT_OF_SCOPE, NO_ROUTE, NO_CANONICAL |
| iodine-quantification-state-of-knowledge | spectral-ct | true | true | false | PUBLICATION_OUT_OF_SCOPE, NO_ROUTE, NO_CANONICAL |
| lge-mvo-hemorrhage-documentary-comparison | myocardial-tissue-characterization | true | true | false | PUBLICATION_OUT_OF_SCOPE, NO_ROUTE, NO_CANONICAL |
| lge-scientific-sheet | myocardial-tissue-characterization | true | true | false | PUBLICATION_OUT_OF_SCOPE, NO_ROUTE, NO_CANONICAL |
| spectral-ct-scientific-sheet | spectral-ct | true | true | false | PUBLICATION_OUT_OF_SCOPE, NO_ROUTE, NO_CANONICAL |
| tmax-scientific-sheet | cerebral-perfusion | true | true | false | PUBLICATION_OUT_OF_SCOPE, NO_ROUTE, NO_CANONICAL |

## 17. Requêtes disponibles

| Requête | Domaine | Résultats | Contextes | Sources | Données manquantes |
| --- | --- | --- | --- | --- | --- |
| adcDiffusion | diffusion-adc | 1 | 1 | 2 | none |
| adcLimitations | diffusion-adc | 2 | 2 | 2 | none |
| tmaxCtPerfusion | cerebral-perfusion | 1 | 1 | 1 | none |
| cbfDeconvolution | cerebral-perfusion | 2 | 2 | 2 | none |
| lgeQuantification | myocardial-tissue-characterization | 8 | 8 | 3 | none |
| mvoInfarction | myocardial-tissue-characterization | 3 | 3 | 3 | none |
| hemorrhageMr | myocardial-tissue-characterization | 7 | 7 | 5 | none |
| spectralIodineMap | spectral-ct | 3 | 3 | 2 | none |
| spectralReproducibility | spectral-ct | 1 | 1 | 2 | none |
| contradictionsDiffusion | diffusion-adc | 6 | 6 | 5 | none |
| contradictionsPerfusion | cerebral-perfusion | 7 | 7 | 5 | none |
| contradictionsCardiac | myocardial-tissue-characterization | 5 | 5 | 5 | none |
| contradictionsSpectral | spectral-ct | 4 | 4 | 6 | none |

## 18. Readiness par domaine

| Domaine | Catalog | Scientific | Provenance | Synthesis | Editorial | SEO | Public |
| --- | --- | --- | --- | --- | --- | --- | --- |
| diffusion-adc | true | true | true | true | true | false | false |
| cerebral-perfusion | true | true | true | true | true | false | false |
| myocardial-tissue-characterization | true | true | true | true | true | false | false |
| spectral-ct | true | true | true | true | true | false | false |

## 19–21. Invariants et extensions

| Invariant | Domaines utilisateurs | Générique ? | Extension spécifique | Décision |
| --- | --- | --- | --- | --- |
| stable-identity | ecv-t1, diffusion-adc, cerebral-perfusion, myocardial-tissue-characterization, spectral-ct | true | false | CONFIRMED_WITHOUT_CONTRACT_CHANGE |
| versioned-revision | ecv-t1, diffusion-adc, cerebral-perfusion, myocardial-tissue-characterization, spectral-ct | true | false | CONFIRMED_WITHOUT_CONTRACT_CHANGE |
| source-identity | ecv-t1, diffusion-adc, cerebral-perfusion, myocardial-tissue-characterization, spectral-ct | true | false | CONFIRMED_WITHOUT_CONTRACT_CHANGE |
| source-revision | ecv-t1, diffusion-adc, cerebral-perfusion, myocardial-tissue-characterization, spectral-ct | true | false | CONFIRMED_WITHOUT_CONTRACT_CHANGE |
| localized-extraction | ecv-t1, diffusion-adc, cerebral-perfusion, myocardial-tissue-characterization, spectral-ct | true | false | CONFIRMED_WITHOUT_CONTRACT_CHANGE |
| atomic-assertion | ecv-t1, diffusion-adc, cerebral-perfusion, myocardial-tissue-characterization, spectral-ct | true | false | CONFIRMED_WITHOUT_CONTRACT_CHANGE |
| evidence-link | ecv-t1, diffusion-adc, cerebral-perfusion, myocardial-tissue-characterization, spectral-ct | true | false | CONFIRMED_WITHOUT_CONTRACT_CHANGE |
| applicability-context | ecv-t1, diffusion-adc, cerebral-perfusion, myocardial-tissue-characterization, spectral-ct | true | true | CONFIRMED_WITHOUT_CONTRACT_CHANGE |
| measurement-definition | ecv-t1, diffusion-adc, cerebral-perfusion, myocardial-tissue-characterization, spectral-ct | true | true | CONFIRMED_WITHOUT_CONTRACT_CHANGE |
| measurement-method | ecv-t1, diffusion-adc, cerebral-perfusion, myocardial-tissue-characterization, spectral-ct | true | true | CONFIRMED_WITHOUT_CONTRACT_CHANGE |
| observation | ecv-t1, diffusion-adc, cerebral-perfusion, myocardial-tissue-characterization, spectral-ct | true | false | CONFIRMED_WITHOUT_CONTRACT_CHANGE |
| derived-measurement | ecv-t1, diffusion-adc, cerebral-perfusion, myocardial-tissue-characterization, spectral-ct | true | true | CONFIRMED_WITHOUT_CONTRACT_CHANGE |
| metrology-semantics | ecv-t1, diffusion-adc, cerebral-perfusion, myocardial-tissue-characterization, spectral-ct | true | false | CONFIRMED_WITHOUT_CONTRACT_CHANGE |
| contradiction-classification | ecv-t1, diffusion-adc, cerebral-perfusion, myocardial-tissue-characterization, spectral-ct | true | false | CONFIRMED_WITHOUT_CONTRACT_CHANGE |
| structured-synthesis | ecv-t1, diffusion-adc, cerebral-perfusion, myocardial-tissue-characterization, spectral-ct | true | false | CONFIRMED_WITHOUT_CONTRACT_CHANGE |
| multidimensional-readiness | ecv-t1, diffusion-adc, cerebral-perfusion, myocardial-tissue-characterization, spectral-ct | true | false | CONFIRMED_WITHOUT_CONTRACT_CHANGE |
| automated-review | ecv-t1, diffusion-adc, cerebral-perfusion, myocardial-tissue-characterization, spectral-ct | true | false | CONFIRMED_WITHOUT_CONTRACT_CHANGE |
| publication-guards | ecv-t1, diffusion-adc, cerebral-perfusion, myocardial-tissue-characterization, spectral-ct | true | false | CONFIRMED_WITHOUT_CONTRACT_CHANGE |

Contrats génériques modifiés : 0. Extensions propres aux domaines : 13.

## 22–23. Couverture et lacunes

| Domaine | Couverture | Forces | Lacunes |
| --- | --- | --- | --- |
| diffusion-adc | SUBSTANTIAL_PILOT | ADC metrology, multicenter reproducibility, stroke interpretation limits | field-strength effects, vendor-specific reconstruction, non-neurologic clinical applications |
| cerebral-perfusion | SUBSTANTIAL_PILOT | parameter definitions, deconvolution, software variability | software versions, MR-versus-CT equivalence, universal thresholds intentionally absent |
| myocardial-tissue-characterization | SUBSTANTIAL_PILOT | LGE acquisition and finding, MVO and IMH roles, quantification-method differences | uniform IMH protocol, timing harmonization, disease-specific generalization |
| spectral-ct | SUBSTANTIAL_PILOT | technology separation, iodine metrology, VMI and VNC limits | clinical cross-platform reproducibility, software-version effects, outcome validation |

La couverture est exprimée qualitativement : aucun dénominateur scientifique exhaustif n'est défini, donc aucun pourcentage artificiel n'est produit.

## 24. Prochaines vagues proposées

| Domaine futur | Valeur scientifique | Valeur éditoriale | Sources | Dimension nouvelle | Priorité |
| --- | --- | --- | --- | --- | --- |
| oef-cmro2 | HIGH | HIGH | MODERATE | physiological models with multiple derived inputs | 1 |
| t2-mapping | HIGH | HIGH | HIGH | quantitative mapping with distinct confounders | 2 |
| segmentation | HIGH | HIGH | HIGH | algorithm identity and reference standard | 3 |
| quality-control | HIGH | HIGH | HIGH | phantom, acceptance and longitudinal quality concepts | 4 |
| registration | MEDIUM | HIGH | HIGH | transformation models and alignment metrics | 5 |
| photon-counting-ct-applications | HIGH | HIGH | MODERATE | technology maturation and clinical validation | 6 |
| radiomics | HIGH | MEDIUM | HIGH | feature definitions, harmonization and external validation | 7 |
| neuro-oncology | HIGH | HIGH | HIGH | multiparametric application context | 8 |
| hepatic-imaging | HIGH | HIGH | HIGH | organ-specific contrast phases and quantitative fat or iron | 9 |
| nuclear-medicine | HIGH | MEDIUM | HIGH | radiotracer, activity and reconstruction metrology | 10 |

## 25–26. Tests et validations

Tests ajoutés : P5 baseline preservation, domain boundaries, source provenance, assertion and EvidenceLink integrity, metrology, query determinism, synthesis determinism, projection guards, readiness independence, ECV/T1 bias audit, protected surfaces.

Validations prévues/exécutées : validate:knowledge-graph, validate:scientific-assertions, validate:knowledge-graph-scientific, validate:knowledge-graph-provenance, validate:knowledge-graph-competency, validate:scientific-corpus, validate:scientific-readiness, validate:scientific-projections, validate:scientific-sources, validate:scientific-extractions, validate:scientific-review, validate:scientific-generality, validate:scientific-domains, validate:scientific-multidomain, test, typecheck, build, lint, git diff --check.

## 27–28. Fichiers

Créés : `src/knowledge-graph/scientific-multidomain/constants.mjs`, `src/knowledge-graph/scientific-multidomain/baseline.mjs`, `src/knowledge-graph/scientific-multidomain/manifests.mjs`, `src/knowledge-graph/scientific-multidomain/sources.mjs`, `src/knowledge-graph/scientific-multidomain/concepts.mjs`, `src/knowledge-graph/scientific-multidomain/assertions.mjs`, `src/knowledge-graph/scientific-multidomain/measurements.mjs`, `src/knowledge-graph/scientific-multidomain/contradictions.mjs`, `src/knowledge-graph/scientific-multidomain/query.mjs`, `src/knowledge-graph/scientific-multidomain/synthesis.mjs`, `src/knowledge-graph/scientific-multidomain/projections.mjs`, `src/knowledge-graph/scientific-multidomain/readiness.mjs`, `src/knowledge-graph/scientific-multidomain/generality.mjs`, `src/knowledge-graph/scientific-multidomain/validate.mjs`, `src/knowledge-graph/scientific-multidomain/report.mjs`, `src/knowledge-graph/scientific-multidomain/scientific-multidomain.test.mjs`, `scripts/validate-scientific-domains.mjs`, `scripts/validate-scientific-multidomain.mjs`, `scripts/query-scientific-multidomain.mjs`, `scripts/report-scientific-multidomain.mjs`, `scripts/generate-p5-scientific-multidomain-report.mjs`, `docs/p5-scientific-multidomain.md`, `docs/p5-scientific-multidomain-report.md`.

Modifiés : `package.json`, `src/knowledge-graph/index.mjs`.

## Contrats préservés

| Contrat | Préservé ? | Test ou preuve | Remarque |
| --- | --- | --- | --- |
| P4R baseline preserved | true | 7317f0b980c51ddf3b5e0ad403bf30ba14c965c7c1ab473881a8df991a52ac98 | No ECV/T1 data mutation. |
| Four independent domains | true | 4 manifests | Generic contracts only. |
| No public projection | true | 8 guarded projections | No route, canonical or prose. |
| Protected surfaces unchanged | true | [] | Pages, routes, SEO, sitemap, viewers, PACS and Supabase protected. |
| editorial-engine unchanged | true | 335fbbea8d138901f0cdf4f5e2d3b96144880e8b | Separate repository remains untouched. |
| No human review claimed | true | scientificHumanReview=null | Automated review is explicit. |

Validation P5 : PASS.
