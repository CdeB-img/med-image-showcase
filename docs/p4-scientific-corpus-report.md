# P4 — Corpus scientifique ECV et mapping T1

Rapport interne déterministe. Il ne constitue ni une page publique, ni une recommandation clinique, ni une méta-analyse.

## 1. État Git initial

- Branche : main
- HEAD : `857e94b6df88289b59de149fe8f77e84dbee9492`
- Arbre de travail : DIRTY_P1_TO_P3M_WEB_WORK_PRESERVED
- `git diff --check` initial : PASS
- Restauration automatique : false

## 2. État scientifique initial

118 concepts, 93 relations (44 actives, 47 différées, 2 désactivées), 9 publications, 13 profils biomarqueurs, 0 assertion réelle et 0 EvidenceLink réel. Les projections publiques étaient bloquées.

## 3. Sources internes auditées

- `src/pages/ECVMappingCardiaque.tsx` — lines 83-105, 155-198, 205-225, 237-267, 280-301, 334-338, 416-480, 533-574 — AUDITED_NOT_USED_AS_PRIMARY_EVIDENCE
- `src/pages/IRMImagerieQuantitative.tsx` — lines 111, 184, 235-236, 296-311, 401-410, 501-523 — AUDITED_NOT_USED_AS_PRIMARY_EVIDENCE
- `src/pages/BiomarqueursIRMCardiaqueEssais.tsx` — lines 187, 223, 418-419, 494-495 — AUDITED_NOT_USED_AS_PRIMARY_EVIDENCE
- `src/pages/BasesMulticentriques.tsx` — lines 154, 238-239, 284-285, 309, 350, 377 — AUDITED_NOT_USED_AS_PRIMARY_EVIDENCE
- `src/pages/CorelabEC.tsx` — lines 334, 375-379, 405 — AUDITED_NOT_USED_AS_PRIMARY_EVIDENCE
- `src/pages/QuantificationTissulaire.tsx` — lines 96, 163, 176, 277 — AUDITED_NOT_USED_AS_PRIMARY_EVIDENCE
- `src/pages/ReferencesPublications.tsx` — lines 9-91 — USED_ONLY_TO_IDENTIFY_LIFECYCLE_CANDIDATE_THEN_EXTERNALLY_VERIFIED
- `docs/editorial-pilot-integration.md` — lines 27-45 — AUDITED_NOT_USED_AS_PRIMARY_EVIDENCE
- `docs/p3m-web-migration-report.md` — sections 8-33 — USED_AS_P4_BASELINE_ONLY

## 4. Sources externes examinées

35 sources externes ont été examinées : 27 retenues et 8 rejetées.

## 5. Sources retenues

| Source | Type | Localisateur | Sujet | Assertions liées | Statut |
| --- | --- | --- | --- | ---: | --- |
| [Modified Look-Locker inversion recovery (MOLLI) for high-resolution T1 mapping of the heart](https://pubmed.ncbi.nlm.nih.gov/15236377/) (15236377) | PROSPECTIVE_STUDY | PubMed record and structured abstract | MOLLI, METHOD_DESCRIPTION | 1 | CURRENT |
| [Shortened Modified Look-Locker Inversion recovery (ShMOLLI) for clinical myocardial T1-mapping at 1.5 and 3 T within a 9 heartbeat breathhold](https://pmc.ncbi.nlm.nih.gov/articles/PMC3001433/) (21092095) | PROSPECTIVE_STUDY | PMC full text | SHMOLLI, FIELD_STRENGTH, METHOD_DESCRIPTION | 3 | CURRENT |
| [Interstitial myocardial fibrosis assessed as extracellular volume fraction with low-radiation-dose cardiac CT](https://pmc.ncbi.nlm.nih.gov/articles/PMC3426854/) (22771879) | PROSPECTIVE_STUDY | PMC full text | CT_ECV, CT_MR_COMPARISON | 2 | CURRENT |
| [Extracellular volume fraction mapping in the myocardium, part 1: evaluation of an automated method](https://pmc.ncbi.nlm.nih.gov/articles/PMC3441905/) (22963517) | PROSPECTIVE_STUDY | PMC full text | ECV_FORMULA, MOTION, TIMING, HEMATOCRIT | 6 | CURRENT |
| [Comprehensive validation of cardiovascular magnetic resonance techniques for the assessment of myocardial extracellular volume](https://pubmed.ncbi.nlm.nih.gov/23553570/) (23553570) | PROSPECTIVE_STUDY | PubMed record and structured abstract | HISTOLOGY, POST_CONTRAST_T1_LIMITATION, ECV_VALIDATION | 3 | CURRENT |
| [Measurement of myocardial extracellular volume fraction by using equilibrium contrast-enhanced CT: validation against histologic findings](https://pubmed.ncbi.nlm.nih.gov/23878282/) (23878282) | PROSPECTIVE_STUDY | PubMed record and structured abstract | CT_ECV, HISTOLOGY, IODINATED_CONTRAST | 2 | CURRENT |
| [Saturation recovery single-shot acquisition (SASHA) for myocardial T1 mapping](https://pubmed.ncbi.nlm.nih.gov/23881866/) (23881866) | PROSPECTIVE_STUDY | PubMed record and structured abstract | SASHA, ACCURACY, HEART_RATE | 2 | CURRENT |
| [Myocardial T1 mapping and extracellular volume quantification: a Society for Cardiovascular Magnetic Resonance (SCMR) and CMR Working Group of the European Society of Cardiology consensus statement](https://pmc.ncbi.nlm.nih.gov/articles/PMC3854458/) (24124732) | CONSENSUS | PMC full text | TERMINOLOGY, ECV_FORMULA, HISTORICAL_CONSENSUS | 3 | SUPERSEDED |
| [T1-mapping in the heart: accuracy and precision](https://pmc.ncbi.nlm.nih.gov/articles/PMC3927683/) (24387626) | SYSTEMATIC_REVIEW | PMC full text | ACCURACY, PRECISION, CONFOUNDERS | 6 | CURRENT |
| [Accuracy, precision, and reproducibility of four T1 mapping sequences: a head-to-head comparison of MOLLI, ShMOLLI, SASHA, and SAPPHIRE](https://pmc.ncbi.nlm.nih.gov/articles/PMC4263641/) (24702727) | PROSPECTIVE_STUDY | PMC full text | MOLLI_SASHA_COMPARISON, REPRODUCIBILITY, ECV_METHOD_DIFFERENCE | 4 | CURRENT |
| [Reference values for healthy human myocardium using a T1 mapping methodology: results from the International T1 Multicenter cardiovascular magnetic resonance study](https://pmc.ncbi.nlm.nih.gov/articles/PMC4203908/) (25384607) | MULTICENTER_STUDY | PMC full text | MULTICENTER, FIELD_STRENGTH, REPRODUCIBILITY | 4 | CURRENT |
| [T1 mapping and survival in systemic light-chain amyloidosis](https://pmc.ncbi.nlm.nih.gov/articles/PMC4301598/) (25411195) | PROSPECTIVE_STUDY | PMC full text | AMYLOIDOSIS, PROGNOSIS | 3 | CURRENT |
| [Shear-Wave Elastography Assessments of Quadriceps Stiffness Changes prior to, during and after Prolonged Exercise: A Longitudinal Study during an Extreme Mountain Ultra-Marathon](https://pmc.ncbi.nlm.nih.gov/articles/PMC5007013/) (27579699) | OBSERVATIONAL_STUDY | PMC full text | DOCUMENT_LIFECYCLE_ONLY | 1 | CORRECTED |
| [Myocardial Extracellular Volume Estimation by CMR Predicts Functional Recovery Following Acute MI](https://pmc.ncbi.nlm.nih.gov/articles/PMC5593809/) (27771398) | PROSPECTIVE_STUDY | PMC full text | MYOCARDIAL_INFARCTION, FUNCTIONAL_RECOVERY | 2 | CURRENT |
| [Performance of native and contrast-enhanced T1 mapping to detect myocardial damage in patients with suspected myocarditis: a head-to-head comparison of different cardiovascular magnetic resonance techniques](https://pubmed.ncbi.nlm.nih.gov/27878700/) (27878700) | OBSERVATIONAL_STUDY | PubMed record and structured abstract | MYOCARDITIS, DIAGNOSTIC_ASSOCIATION | 4 | CURRENT |
| [Correction: Shear-Wave Elastography Assessments of Quadriceps Stiffness Changes prior to, during and after Prolonged Exercise](https://pmc.ncbi.nlm.nih.gov/articles/PMC5130261/) (27902782) | OBSERVATIONAL_STUDY | PMC full text | DOCUMENT_LIFECYCLE_ONLY | 1 | CURRENT |
| [Extracellular volume quantification by cardiac magnetic resonance imaging without hematocrit sampling: Ready for prime time?](https://pmc.ncbi.nlm.nih.gov/articles/PMC5978936/) (28980127) | OBSERVATIONAL_STUDY | PMC full text | SYNTHETIC_HEMATOCRIT, CONTEXTUAL_CONVERGENCE | 2 | CURRENT |
| [Clinical recommendations for cardiovascular magnetic resonance mapping of T1, T2, T2* and extracellular volume: A consensus statement by the SCMR endorsed by the EACVI](https://pmc.ncbi.nlm.nih.gov/articles/PMC5633041/) (28992817) | CONSENSUS | PMC full text | CURRENT_CONSENSUS, IMPLEMENTATION, LIMITATIONS, REFERENCE_RANGES | 13 | CORRECTED |
| [Correction to: Clinical recommendations for cardiovascular magnetic resonance mapping of T1, T2, T2* and extracellular volume](https://pmc.ncbi.nlm.nih.gov/articles/PMC5804075/) (29415744) | CONSENSUS | PMC full text | DOCUMENT_LIFECYCLE | 1 | CURRENT |
| [Extracellular volume fraction measurements derived from the longitudinal relaxation of blood-based synthetic hematocrit may lead to clinical errors in 3 T cardiovascular magnetic resonance](https://pmc.ncbi.nlm.nih.gov/articles/PMC6083590/) (30089499) | OBSERVATIONAL_STUDY | PMC full text | SYNTHETIC_HEMATOCRIT, CONTRADICTION, 3T | 3 | CURRENT |
| [Cardiovascular Magnetic Resonance in Nonischemic Myocardial Inflammation: Expert Recommendations](https://pubmed.ncbi.nlm.nih.gov/30545455/) (30545455) | GUIDELINE | PubMed record and structured abstract | MYOCARDITIS, RECOMMENDATION_TEXT | 3 | CURRENT |
| [Detection of myocarditis using T1 and ECV mapping is not improved by early compared to late post-contrast imaging](https://pubmed.ncbi.nlm.nih.gov/31132211/) (31132211) | OBSERVATIONAL_STUDY | PubMed record and structured abstract | MYOCARDITIS, POST_CONTRAST_TIMING, NEGATIVE_RESULT | 1 | CURRENT |
| [Standardized cardiovascular magnetic resonance imaging (CMR) protocols: 2020 update](https://pmc.ncbi.nlm.nih.gov/articles/PMC7038611/) (32089132) | GUIDELINE | PMC full text | CURRENT_PROTOCOL_GUIDANCE, ECV_TIMING, HEMATOCRIT, LOCAL_VALUES | 3 | CURRENT |
| [Standardized image interpretation and post-processing in cardiovascular magnetic resonance - 2020 update](https://pmc.ncbi.nlm.nih.gov/articles/PMC7066763/) (32160925) | GUIDELINE | PMC full text | CURRENT_POST_PROCESSING_GUIDANCE, ECV_INPUTS, ROI, TIMING | 2 | CURRENT |
| [T1 mapping performance and measurement repeatability: results from the multi-national T1 mapping standardization phantom program (T1MES)](https://pmc.ncbi.nlm.nih.gov/articles/PMC7204222/) (32375896) | MULTICENTER_STUDY | PMC full text | INTERSITE_REPEATABILITY, FIELD_STRENGTH, SOFTWARE, MANUFACTURER | 2 | CURRENT |
| [Cardiac Computed Tomography for Quantification of Myocardial Extracellular Volume Fraction: A Systematic Review and Meta-Analysis](https://pubmed.ncbi.nlm.nih.gov/37269267/) (37269267) | META_ANALYSIS | PubMed record and structured abstract | CT_ECV, CT_MR_COMPARISON, EVIDENCE_LIMITATIONS | 3 | CURRENT |
| [Myocardial extracellular volume quantification with computed tomography—current status and future outlook](https://pmc.ncbi.nlm.nih.gov/articles/PMC10519917/) (37749293) | SYSTEMATIC_REVIEW | PMC full text | CT_ECV_FORMULA, CT_ACQUISITION, CT_LIMITATIONS | 4 | CURRENT |

## 6. Sources rejetées et motifs

- [Cardiac T1 Mapping and Extracellular Volume in clinical practice: a comprehensive review](https://pmc.ncbi.nlm.nih.gov/articles/PMC5129251/) — Secondary narrative review overlapped with selected consensus and primary studies; no unique assertion was needed.
- [Role of cardiac T1 mapping and extracellular volume in the assessment of myocardial infarction](https://pmc.ncbi.nlm.nih.gov/articles/PMC5998858/) — Narrative review; the pilot retained the primary Kidambi cohort instead.
- [Clinical Significance of Extracellular Volume of Myocardium Assessed by Computed Tomography](https://pmc.ncbi.nlm.nih.gov/articles/PMC11942809/) — Recent secondary meta-analysis overlapped with Han 2023 and was not required for a unique atomic assertion.
- [Myocardial extracellular volume measurement using cardiac computed tomography](https://pmc.ncbi.nlm.nih.gov/articles/PMC11561108/) — Recent narrative review overlapped with the selected CT technical review and validation studies.
- [Reference Ranges, Diagnostic and Prognostic Utility of Native T1 Mapping and ECV for Cardiac Amyloidosis](https://pubmed.ncbi.nlm.nih.gov/33274809/) — Meta-analysis examined but not selected because the pilot already retained a directly localized prospective AL amyloidosis cohort and avoids importing pooled thresholds.
- [Detection of acute myocarditis using T1 and T2 mapping: systematic review and meta-analysis](https://pmc.ncbi.nlm.nih.gov/articles/PMC8504590/) — Examined but not selected to avoid creating pooled diagnostic thresholds or an implicit meta-analysis in the pilot corpus.
- [Towards fully automated synthetic ECV quantification](https://pubmed.ncbi.nlm.nih.gov/41807594/) — 2026 proof-of-concept examined but excluded from the stable pilot pending independent review and because deployed AI is outside P4.
- NOXIA public editorial pages — Internal pages lack precise bibliographic provenance and cannot support real scientific assertions.

## 7. Concepts créés

- `noxia:radiology:acquisition-method:molli` — AcquisitionMethod
- `noxia:radiology:acquisition-method:sasha` — AcquisitionMethod
- `noxia:radiology:acquisition-method:shmolli` — AcquisitionMethod
- `noxia:radiology:confounder:cardiac-motion` — Confounder
- `noxia:radiology:confounder:heart-rate-dependence` — Confounder
- `noxia:radiology:confounder:method-dependence` — Confounder
- `noxia:radiology:confounder:off-resonance` — Confounder
- `noxia:radiology:confounder:partial-volume` — Confounder
- `noxia:radiology:contrast-agent-class:gadolinium-based-contrast-agent` — ContrastAgentClass
- `noxia:radiology:contrast-agent-class:iodinated-contrast-agent` — ContrastAgentClass
- `noxia:radiology:derived-measurement:myocardial-ecv-ct` — DerivedMeasurement
- `noxia:radiology:derived-measurement:myocardial-ecv-mr` — DerivedMeasurement
- `noxia:radiology:disease:acute-myocardial-infarction` — Disease
- `noxia:radiology:disease:acute-myocarditis` — Disease
- `noxia:radiology:disease:systemic-al-amyloidosis` — Disease
- `noxia:radiology:finding:diffuse-myocardial-fibrosis` — Finding
- `noxia:radiology:measurement-definition:change-in-longitudinal-relaxation-rate` — MeasurementDefinition
- `noxia:radiology:measurement-definition:hematocrit` — MeasurementDefinition
- `noxia:radiology:measurement-definition:longitudinal-relaxation-rate` — MeasurementDefinition
- `noxia:radiology:measurement-method:myocardial-t1-mapping` — MeasurementMethod
- `noxia:radiology:measurement-method:synthetic-hematocrit` — MeasurementMethod
- `noxia:radiology:observation:delayed-blood-ct-attenuation` — Observation
- `noxia:radiology:observation:delayed-myocardial-ct-attenuation` — Observation
- `noxia:radiology:observation:iodine-density-change` — Observation
- `noxia:radiology:observation:native-blood-t1` — Observation
- `noxia:radiology:observation:native-myocardial-t1` — Observation
- `noxia:radiology:observation:post-contrast-blood-t1` — Observation
- `noxia:radiology:observation:post-contrast-myocardial-t1` — Observation
- `noxia:radiology:observation:pre-contrast-blood-ct-attenuation` — Observation
- `noxia:radiology:observation:pre-contrast-myocardial-ct-attenuation` — Observation
- `noxia:radiology:quality-attribute:interreader-reproducibility` — QualityAttribute
- `noxia:radiology:quality-attribute:interscanner-reproducibility` — QualityAttribute
- `noxia:radiology:quality-attribute:intersite-reproducibility` — QualityAttribute
- `noxia:radiology:quality-attribute:measurement-accuracy` — QualityAttribute
- `noxia:radiology:quality-attribute:measurement-precision` — QualityAttribute
- `noxia:radiology:quality-attribute:repeatability` — QualityAttribute
- `noxia:radiology:quality-attribute:reproducibility` — QualityAttribute
- `noxia:radiology:sequence-family:inversion-recovery-t1-mapping` — SequenceFamily
- `noxia:radiology:sequence-family:saturation-recovery-t1-mapping` — SequenceFamily
- `noxia:radiology:technical-context:field-strength-1-5-t` — TechnicalContext
- `noxia:radiology:technical-context:field-strength-3-t` — TechnicalContext
- `noxia:radiology:technical-context:post-contrast-delay` — TechnicalContext

## 8. Concepts requalifiés

Aucun concept historique n'a été requalifié automatiquement.

## 9. Classifications différées

| Concept | Classe historique | Classe proposée | Classe appliquée | Décision | Source |
| --- | --- | --- | --- | --- | --- |
| noxia:radiology:sequence:t1-mapping | Sequence | MeasurementMethod | Sequence | DEFERRED | noxia:radiology:source:pubmed:28992817:revision:1 |
| noxia:radiology:biomarker:t1 | Biomarker | Observation | Biomarker | DEFERRED | noxia:radiology:source:pubmed:28992817:revision:1 |
| noxia:radiology:biomarker:ecv | Biomarker | DerivedMeasurement | Biomarker | DEFERRED | noxia:radiology:source:pubmed:22963517:revision:1 |
| noxia:radiology:biomarker:lge-quantification | Biomarker | FindingOrEndpoint | Biomarker | DEFERRED | noxia:radiology:source:pubmed:30545455:revision:1 |
| noxia:radiology:biomarker:mvo | Biomarker | Finding | Biomarker | DEFERRED | OUTSIDE_P4 |
| noxia:radiology:biomarker:myocardial-hemorrhage | Biomarker | Finding | Biomarker | DEFERRED | OUTSIDE_P4 |

## 10. Mesures et méthodes

| Mesure | Méthode | Entrées | Unité | Formule sourcée | Limites |
| --- | --- | --- | --- | --- | --- |
| LONGITUDINAL_RELAXATION_TIME | noxia:radiology:measurement-method:myocardial-t1-mapping | — | millisecond | NOT_APPLICABLE | The observed value is method-, field-strength- and context-dependent; this record defines no normal range. |
| LONGITUDINAL_RELAXATION_RATE | RECIPROCAL_TRANSFORMATION | T1 | inverse_second | YES | — |
| CHANGE_IN_LONGITUDINAL_RELAXATION_RATE | POST_MINUS_PRE_CONTRAST_R1 | R1_post_input, R1_pre_input | inverse_second | YES | — |
| ERYTHROCYTE_VOLUME_FRACTION | DIRECT_BLOOD_SAMPLE_UNLESS_EXPLICITLY_STATED_OTHERWISE | — | fraction | NOT_APPLICABLE | No synthetic substitute is assumed by this definition. |
| MYOCARDIAL_T1 | noxia:radiology:measurement-method:myocardial-t1-mapping | — | millisecond | NOT_APPLICABLE | MOLLI, ShMOLLI and SASHA are not interchangeable labels or acquisitions. |
| MYOCARDIAL_EXTRACELLULAR_VOLUME_FRACTION | CMR_PRE_POST_T1_PARTITION_COEFFICIENT_WITH_HEMATOCRIT | — | fraction | NOT_APPLICABLE | The equilibrium assumption may fail in recently infarcted myocardium.; Pre/post maps require adequate spatial correspondence. |
| MYOCARDIAL_EXTRACELLULAR_VOLUME_FRACTION | SINGLE_ENERGY_CT_PRE_DELAYED_ATTENUATION_PARTITION_WITH_HEMATOCRIT | — | fraction | NOT_APPLICABLE | Requires non-contrast and delayed acquisitions and therefore additional radiation exposure.; CT validation evidence remains more limited than CMR evidence in this corpus. |
| MYOCARDIAL_EXTRACELLULAR_VOLUME_FRACTION | SPECTRAL_CT_IODINE_DENSITY_PARTITION_WITH_HEMATOCRIT | — | fraction | NOT_APPLICABLE | Spectral iodine-density and single-energy attenuation methods have different inputs and are not represented as one acquisition. |
| NATIVE_MYOCARDIAL_T1 | noxia:radiology:measurement-method:myocardial-t1-mapping | — | millisecond | NOT_APPLICABLE | — |
| POST_CONTRAST_MYOCARDIAL_T1 | noxia:radiology:measurement-method:myocardial-t1-mapping | — | millisecond | NOT_APPLICABLE | — |
| NATIVE_BLOOD_T1 | noxia:radiology:measurement-method:myocardial-t1-mapping | — | millisecond | NOT_APPLICABLE | — |
| POST_CONTRAST_BLOOD_T1 | noxia:radiology:measurement-method:myocardial-t1-mapping | — | millisecond | NOT_APPLICABLE | — |
| PRE_CONTRAST_MYOCARDIAL_ATTENUATION | SINGLE_ENERGY_CT | — | HU | NOT_APPLICABLE | — |
| DELAYED_MYOCARDIAL_ATTENUATION | SINGLE_ENERGY_CT | — | HU | NOT_APPLICABLE | — |
| PRE_CONTRAST_BLOOD_ATTENUATION | SINGLE_ENERGY_CT | — | HU | NOT_APPLICABLE | — |
| DELAYED_BLOOD_ATTENUATION | SINGLE_ENERGY_CT | — | HU | NOT_APPLICABLE | — |
| MYOCARDIAL_EXTRACELLULAR_VOLUME_FRACTION | CMR_PRE_POST_T1_PARTITION_COEFFICIENT_WITH_HEMATOCRIT | T1_myo_pre, T1_myo_post, T1_blood_pre, T1_blood_post, Hct | fraction | YES | No reference range or threshold is encoded.; Timing, mapping method, field strength and hematocrit measurement remain applicability variables. |
| MYOCARDIAL_EXTRACELLULAR_VOLUME_FRACTION | SINGLE_ENERGY_CT_PRE_DELAYED_ATTENUATION_PARTITION_WITH_HEMATOCRIT | HU_myo_pre, HU_myo_delayed, HU_blood_pre, HU_blood_delayed, Hct | fraction | YES | This formula is not the CMR T1 formula.; No reference range or diagnostic threshold is encoded. |
| MYOCARDIAL_EXTRACELLULAR_VOLUME_FRACTION | SPECTRAL_CT_IODINE_DENSITY_PARTITION_WITH_HEMATOCRIT | iodine_density_myo, iodine_density_blood, Hct | fraction | YES | Spectral CT iodine-density inputs are distinct from single-energy HU differences and from CMR T1 inputs. |

## 11. Modèle quantitatif ECV

- IRM : quatre observations T1, hématocrite, variations de R1 et formule CMR sourcée.
- CT single-energy : variations HU myocardiques et sanguines avec hématocrite.
- CT spectral : ratio de densité iodée avec hématocrite.
- Plages normales créées : 0. Seuils créés : 0.

## 12. Assertions créées

| Assertion | Type | Sujet | Prédicat | Contexte | Polarité | Preuve | Statut |
| --- | --- | --- | --- | --- | --- | --- | --- |
| accuracy-precision-distinct | EntityObjectAssertion | noxia:radiology:quality-attribute:measurement-accuracy | IS_DISTINCT_FROM | noxia:radiology:context:ecv-t1:mr-general | POSITIVE | SUPPORTS | SOURCE_LOCALIZED |
| blood-roi-excludes-papillary-trabeculae | RecommendationAssertion | noxia:radiology:derived-measurement:myocardial-ecv-mr | USES_BLOOD_POOL_ROI_EXCLUDING_STRUCTURES | noxia:radiology:context:ecv-t1:mr-ecv | POSITIVE | SUPPORTS | SOURCE_LOCALIZED |
| ct-ecv-correlates-histology-aortic-stenosis | LiteralValueAssertion | noxia:radiology:derived-measurement:myocardial-ecv-ct | CORRELATED_WITH | noxia:radiology:context:ecv-t1:ct-ecv-equilibrium | POSITIVE | QUALIFIES, SUPPORTS | SOURCE_LOCALIZED |
| ct-ecv-delayed-phase | QuantitativeAssertion | noxia:radiology:derived-measurement:myocardial-ecv-ct | USES_REPORTED_DELAY_RANGE | noxia:radiology:context:ecv-t1:ct-ecv-bolus | QUALIFIED | SUPPORTS | SOURCE_LOCALIZED |
| ct-ecv-feasible-vs-mr-small-study | LiteralValueAssertion | noxia:radiology:derived-measurement:myocardial-ecv-ct | CORRELATED_WITH | noxia:radiology:context:ecv-t1:ct-ecv-bolus | POSITIVE | QUALIFIES, SUPPORTS | SOURCE_LOCALIZED |
| ct-ecv-single-energy-formula | LiteralValueAssertion | noxia:radiology:derived-measurement:myocardial-ecv-ct | HAS_DOCUMENTED_FORMULA | noxia:radiology:context:ecv-t1:ct-ecv-bolus | POSITIVE | DERIVES | SOURCE_LOCALIZED |
| ct-evidence-quality-low | LiteralValueAssertion | noxia:radiology:derived-measurement:myocardial-ecv-ct | HAS_EVIDENCE_LIMITATION | noxia:radiology:context:ecv-t1:ct-ecv-bolus | NEGATIVE | SUPPORTS | SOURCE_LOCALIZED |
| ct-mr-ecv-correlation-meta | LiteralValueAssertion | noxia:radiology:derived-measurement:myocardial-ecv-ct | HAS_REPORTED_AGREEMENT_WITH | noxia:radiology:context:ecv-t1:ct-ecv-bolus | QUALIFIED | QUALIFIES, SUPPORTS | SOURCE_LOCALIZED |
| ct-spectral-formula-distinct | LiteralValueAssertion | noxia:radiology:derived-measurement:myocardial-ecv-ct | HAS_ALTERNATIVE_SPECTRAL_METHOD | noxia:radiology:context:ecv-t1:ct-ecv-bolus | POSITIVE | SUPPORTS | SOURCE_LOCALIZED |
| early-timing-improves-myocarditis-detection | LiteralValueAssertion | noxia:radiology:technical-context:post-contrast-delay | EARLY_IMAGING_IMPROVES_MYOCARDITIS_DETECTION_OVER_LATE | noxia:radiology:context:ecv-t1:myocarditis-mr-timing | NEGATIVE | REFUTES | CONTESTED |
| ecv-associated-functional-recovery-acute-mi | LiteralValueAssertion | noxia:radiology:derived-measurement:myocardial-ecv-mr | ASSOCIATED_WITH | noxia:radiology:context:ecv-t1:acute-mi-mr | POSITIVE | QUALIFIES, SUPPORTS | SOURCE_LOCALIZED |
| ecv-associated-troponin-myocarditis | LiteralValueAssertion | noxia:radiology:derived-measurement:myocardial-ecv-mr | ASSOCIATED_WITH | noxia:radiology:context:ecv-t1:myocarditis-mr | POSITIVE | QUALIFIES, SUPPORTS | SOURCE_LOCALIZED |
| ecv-definition-delta-r1 | LiteralValueAssertion | noxia:radiology:derived-measurement:myocardial-ecv-mr | HAS_DOCUMENTED_FORMULA | noxia:radiology:context:ecv-t1:mr-ecv | POSITIVE | SUPPORTS, DERIVES | SOURCE_LOCALIZED |
| ecv-method-dependent | EntityObjectAssertion | noxia:radiology:confounder:method-dependence | INFLUENCES | noxia:radiology:context:ecv-t1:mr-molli-sasha-comparison | QUALIFIED | SUPPORTS | SOURCE_LOCALIZED |
| ecv-no-field-difference-uniform-molli | NegativeAssertion | noxia:radiology:derived-measurement:myocardial-ecv-mr | NO_SIGNIFICANT_FIELD_STRENGTH_DIFFERENCE_REPORTED | noxia:radiology:context:ecv-t1:multicenter-molli | NEGATIVE | SUPPORTS | SOURCE_LOCALIZED |
| ecv-prognostic-al-amyloidosis | LiteralValueAssertion | noxia:radiology:derived-measurement:myocardial-ecv-mr | ASSOCIATED_WITH | noxia:radiology:context:ecv-t1:al-amyloidosis-mr | POSITIVE | QUALIFIES, SUPPORTS | SOURCE_LOCALIZED |
| ecv-reproducibility-no-difference-small-study | NegativeAssertion | noxia:radiology:derived-measurement:myocardial-ecv-mr | NO_SIGNIFICANT_REPRODUCIBILITY_DIFFERENCE_ACROSS_TESTED_METHODS | noxia:radiology:context:ecv-t1:mr-molli-sasha-comparison | NEGATIVE | SUPPORTS | SOURCE_LOCALIZED |
| ecv-requires-four-t1-inputs | LiteralValueAssertion | noxia:radiology:derived-measurement:myocardial-ecv-mr | REQUIRES_T1_INPUTS | noxia:radiology:context:ecv-t1:mr-ecv | POSITIVE | SUPPORTS | SOURCE_LOCALIZED |
| ecv-requires-hematocrit | EntityObjectAssertion | noxia:radiology:derived-measurement:myocardial-ecv-mr | REQUIRES_INPUT | noxia:radiology:context:ecv-t1:mr-ecv | POSITIVE | SUPPORTS, SUPPORTS | SOURCE_LOCALIZED |
| field-and-site-specific-values | LiteralValueAssertion | noxia:radiology:measurement-method:myocardial-t1-mapping | HAS_CONTEXT_DEPENDENT_VALUES | noxia:radiology:context:ecv-t1:mr-general | QUALIFIED | SUPPORTS | SOURCE_LOCALIZED |
| heart-rate-can-limit-mapping | EntityObjectAssertion | noxia:radiology:confounder:heart-rate-dependence | CAN_LIMIT | noxia:radiology:context:ecv-t1:mr-general | QUALIFIED | QUALIFIES, SUPPORTS | SOURCE_LOCALIZED |
| hematocrit-within-24-hours | RecommendationAssertion | noxia:radiology:measurement-definition:hematocrit | SHOULD_BE_MEASURED_NEAR_CMR | noxia:radiology:context:ecv-t1:mr-ecv | POSITIVE | SUPPORTS | SOURCE_LOCALIZED |
| inversion-recovery-underestimation | LiteralValueAssertion | noxia:radiology:sequence-family:inversion-recovery-t1-mapping | CAN_HAVE_BIAS | noxia:radiology:context:ecv-t1:mr-general | NEGATIVE | SUPPORTS | SOURCE_LOCALIZED |
| isolated-postcontrast-t1-insufficient | NegativeAssertion | noxia:radiology:observation:post-contrast-myocardial-t1 | IS_NOT_SUFFICIENT_AS_STANDALONE_ECV_SURROGATE | noxia:radiology:context:ecv-t1:mr-ecv | NEGATIVE | SUPPORTS | SOURCE_LOCALIZED |
| local-reference-ranges-required | RecommendationAssertion | noxia:radiology:biomarker:t1 | REQUIRES_LOCALLY_VALIDATED_REFERENCE_RANGE | noxia:radiology:context:ecv-t1:mr-general | POSITIVE | SUPPORTS | SOURCE_LOCALIZED |
| mapping-amyloidosis-information | ApplicabilityAssertion | noxia:radiology:measurement-method:myocardial-t1-mapping | PROVIDES_INFORMATION_IN | noxia:radiology:context:ecv-t1:al-amyloidosis-mr | POSITIVE | QUALIFIES, SUPPORTS | SOURCE_LOCALIZED |
| mapping-myocarditis-information | ApplicabilityAssertion | noxia:radiology:measurement-method:myocardial-t1-mapping | PROVIDES_INFORMATION_IN | noxia:radiology:context:ecv-t1:myocarditis-mr | POSITIVE | SUPPORTS, QUALIFIES | SOURCE_LOCALIZED |
| mapping-supported-3t | ApplicabilityAssertion | noxia:radiology:measurement-method:myocardial-t1-mapping | DOCUMENTED_AT_FIELD_STRENGTH | noxia:radiology:context:ecv-t1:mr-3-t | POSITIVE | SUPPORTS, SUPPORTS | SOURCE_LOCALIZED |
| mapping-supported-field-strengths | ApplicabilityAssertion | noxia:radiology:measurement-method:myocardial-t1-mapping | DOCUMENTED_AT_FIELD_STRENGTH | noxia:radiology:context:ecv-t1:mr-1-5-t | POSITIVE | SUPPORTS, SUPPORTS | SOURCE_LOCALIZED |
| mapping-useful-suspected-disease | RecommendationAssertion | noxia:radiology:measurement-method:myocardial-t1-mapping | MAY_BE_CLINICALLY_USEFUL_IN_SUSPECTED_MYOCARDIAL_DISEASE | noxia:radiology:context:ecv-t1:mr-general | QUALIFIED | SUPPORTS | SOURCE_LOCALIZED |
| messroghli-correction-lifecycle | EntityObjectAssertion | noxia:radiology:source:pubmed:29415744 | CORRECTS | noxia:radiology:context:ecv-t1:mr-general | POSITIVE | CORRECTS | SOURCE_LOCALIZED |
| molli-is-inversion-recovery | EntityObjectAssertion | noxia:radiology:acquisition-method:molli | BELONGS_TO_SEQUENCE_FAMILY | noxia:radiology:context:ecv-t1:mr-molli | POSITIVE | SUPPORTS | SOURCE_LOCALIZED |
| molli-more-precise-head-to-head | EntityObjectAssertion | noxia:radiology:acquisition-method:molli | SHOWED_HIGHER_PRECISION_THAN | noxia:radiology:context:ecv-t1:mr-molli-sasha-comparison | POSITIVE | QUALIFIES, SUPPORTS | SOURCE_LOCALIZED |
| moon-position-historical | LiteralValueAssertion | noxia:radiology:source:pubmed:24124732 | HAS_DOCUMENTARY_POSITION | noxia:radiology:context:ecv-t1:mr-general | QUALIFIED | SUPPORTS, QUALIFIES | SUPERSEDED |
| motion-registration-limitation | EntityObjectAssertion | noxia:radiology:confounder:cardiac-motion | CAN_LIMIT | noxia:radiology:context:ecv-t1:mr-ecv | NEGATIVE | SUPPORTS | SOURCE_LOCALIZED |
| mr-ct-ecv-formulas-distinct | EntityObjectAssertion | noxia:radiology:derived-measurement:myocardial-ecv-mr | IS_METHOD_DISTINCT_FROM | noxia:radiology:context:ecv-t1:mr-ecv | POSITIVE | DERIVES, DERIVES | SOURCE_LOCALIZED |
| mr-ecv-correlates-histology | LiteralValueAssertion | noxia:radiology:derived-measurement:myocardial-ecv-mr | CORRELATED_WITH | noxia:radiology:context:ecv-t1:mr-ecv | POSITIVE | QUALIFIES, SUPPORTS | SOURCE_LOCALIZED |
| myocarditis-single-criterion-less-specific | LiteralValueAssertion | noxia:radiology:disease:acute-myocarditis | SINGLE_MAPPING_CRITERION_HAS_LIMITATION | noxia:radiology:context:ecv-t1:myocarditis-mr | NEGATIVE | SUPPORTS | SOURCE_LOCALIZED |
| myocarditis-t1-t2-combination | RecommendationAssertion | noxia:radiology:disease:acute-myocarditis | ASSESSED_WITH_COMBINED_T1_AND_T2_CRITERIA | noxia:radiology:context:ecv-t1:myocarditis-mr | POSITIVE | SUPPORTS | SOURCE_LOCALIZED |
| native-t1-associated-troponin-myocarditis | LiteralValueAssertion | noxia:radiology:observation:native-myocardial-t1 | ASSOCIATED_WITH | noxia:radiology:context:ecv-t1:myocarditis-mr | POSITIVE | QUALIFIES, SUPPORTS | SOURCE_LOCALIZED |
| native-t1-higher-3t-uniform-molli | QuantitativeAssertion | noxia:radiology:observation:native-myocardial-t1 | DIFFERS_BY_FIELD_STRENGTH_IN_UNIFORM_SETUP | noxia:radiology:context:ecv-t1:multicenter-molli | POSITIVE | SUPPORTS | SOURCE_LOCALIZED |
| off-resonance-bias | EntityObjectAssertion | noxia:radiology:confounder:off-resonance | CAN_BIAS | noxia:radiology:context:ecv-t1:mr-general | NEGATIVE | SUPPORTS | SOURCE_LOCALIZED |
| partial-volume-limits-mapping | EntityObjectAssertion | noxia:radiology:confounder:partial-volume | LIMITS | noxia:radiology:context:ecv-t1:mr-general | NEGATIVE | SUPPORTS | SOURCE_LOCALIZED |
| plos-correction-lifecycle | EntityObjectAssertion | noxia:radiology:source:pubmed:27902782 | CORRECTS | NOT_APPLICABLE | POSITIVE | MENTIONS, CORRECTS | SOURCE_LOCALIZED |
| protocol-ecv-postcontrast-window | QuantitativeAssertion | noxia:radiology:derived-measurement:myocardial-ecv-mr | HAS_PROTOCOL_POSTCONTRAST_WINDOW | noxia:radiology:context:ecv-t1:mr-ecv | POSITIVE | SUPPORTS, QUALIFIES | SOURCE_LOCALIZED |
| recent-infarct-equilibrium-limitation | EntityObjectAssertion | noxia:radiology:technical-context:post-contrast-delay | CAN_LIMIT | noxia:radiology:context:ecv-t1:acute-mi-mr | NEGATIVE | SUPPORTS | SOURCE_LOCALIZED |
| report-contrast-type-dose | RecommendationAssertion | noxia:radiology:derived-measurement:myocardial-ecv-mr | REPORTS_CONTRAST_TYPE_AND_DOSE | noxia:radiology:context:ecv-t1:mr-ecv | POSITIVE | SUPPORTS | SOURCE_LOCALIZED |
| report-sequence-identity | RecommendationAssertion | noxia:radiology:measurement-method:myocardial-t1-mapping | REPORTS_ACQUISITION_SEQUENCE | noxia:radiology:context:ecv-t1:mr-general | POSITIVE | SUPPORTS | SOURCE_LOCALIZED |
| routine-ecv-reasonable | RecommendationAssertion | noxia:radiology:derived-measurement:myocardial-ecv-mr | MAY_BE_REASONABLE_FOR_ROUTINE_USE | noxia:radiology:context:ecv-t1:mr-ecv | QUALIFIED | SUPPORTS | SOURCE_LOCALIZED |
| sasha-is-saturation-recovery | EntityObjectAssertion | noxia:radiology:acquisition-method:sasha | BELONGS_TO_SEQUENCE_FAMILY | noxia:radiology:context:ecv-t1:mr-sasha | POSITIVE | SUPPORTS, MENTIONS | SOURCE_LOCALIZED |
| sasha-more-accurate-head-to-head | EntityObjectAssertion | noxia:radiology:acquisition-method:sasha | SHOWED_HIGHER_ACCURACY_THAN | noxia:radiology:context:ecv-t1:mr-molli-sasha-comparison | POSITIVE | QUALIFIES, SUPPORTS | SOURCE_LOCALIZED |
| saturation-recovery-precision-limitation | EntityObjectAssertion | noxia:radiology:sequence-family:saturation-recovery-t1-mapping | CAN_HAVE_LOWER | noxia:radiology:context:ecv-t1:mr-sasha | NEGATIVE | SUPPORTS | SOURCE_LOCALIZED |
| shmolli-nine-heartbeat | LiteralValueAssertion | noxia:radiology:acquisition-method:shmolli | HAS_BREATHHOLD_DURATION | noxia:radiology:context:ecv-t1:mr-shmolli | POSITIVE | SUPPORTS | SOURCE_LOCALIZED |
| synthetic-hct-3t-misclassification | QuantitativeAssertion | noxia:radiology:measurement-method:synthetic-hematocrit | HAD_REPORTED_MISCLASSIFICATION_RANGE | noxia:radiology:context:ecv-t1:synthetic-hct-3-t | NEGATIVE | SUPPORTS | SOURCE_LOCALIZED |
| synthetic-hct-acceptable-agreement | LiteralValueAssertion | noxia:radiology:measurement-method:synthetic-hematocrit | PROVIDES_ACCEPTABLE_ECV_AGREEMENT | noxia:radiology:context:ecv-t1:synthetic-hct-local | QUALIFIED | SUPPORTS, REFUTES | CONTESTED |
| synthetic-hct-local-calibration | EntityObjectAssertion | noxia:radiology:confounder:method-dependence | LIMITS_GENERALIZATION_OF | noxia:radiology:context:ecv-t1:synthetic-hct-local | NEGATIVE | SUPPORTS, SUPPORTS | SOURCE_LOCALIZED |
| t1mes-repeatability-system-dependent | LiteralValueAssertion | noxia:radiology:quality-attribute:repeatability | VARIES_WITH_TECHNICAL_SYSTEM | noxia:radiology:context:ecv-t1:t1mes-phantom | QUALIFIED | QUALIFIES, SUPPORTS | SOURCE_LOCALIZED |
| uniform-molli-intersite-reproducibility | EntityObjectAssertion | noxia:radiology:acquisition-method:molli | HAS_DOCUMENTED | noxia:radiology:context:ecv-t1:multicenter-molli | POSITIVE | QUALIFIES, SUPPORTS | SOURCE_LOCALIZED |

## 13. EvidenceLinks créés

| EvidenceLink | Source | Assertion | Relation | Localisateur | Confiance |
| --- | --- | --- | --- | --- | --- |
| 24387626:supports:1 | 24387626 | accuracy-precision-distinct | SUPPORTS | Background and Methods > definitions of accuracy and precision | HIGH |
| 32160925:supports:1 | 32160925 | blood-roi-excludes-papillary-trabeculae | SUPPORTS | Parametric mapping > T1 mapping and ECV > item j | HIGH |
| 23878282:qualifies:2 | 23878282 | ct-ecv-correlates-histology-aortic-stenosis | QUALIFIES | PubMed > Abstract > Methods | HIGH |
| 23878282:supports:1 | 23878282 | ct-ecv-correlates-histology-aortic-stenosis | SUPPORTS | PubMed > Abstract > Results | HIGH |
| 37749293:supports:1 | 37749293 | ct-ecv-delayed-phase | SUPPORTS | Acquisition protocols > Late-phase acquisition timing | HIGH |
| 22771879:qualifies:2 | 22771879 | ct-ecv-feasible-vs-mr-small-study | QUALIFIES | Discussion > Limitations | HIGH |
| 22771879:supports:1 | 22771879 | ct-ecv-feasible-vs-mr-small-study | SUPPORTS | Results > CT ECV compared with MR ECV | HIGH |
| 37749293:derives:1 | 37749293 | ct-ecv-single-energy-formula | DERIVES | CT-ECV calculation > Single-energy CT > equation | HIGH |
| 37269267:supports:1 | 37269267 | ct-evidence-quality-low | SUPPORTS | PubMed > Abstract > Conclusions | HIGH |
| 37269267:qualifies:2 | 37269267 | ct-mr-ecv-correlation-meta | QUALIFIES | PubMed > Abstract > Conclusions | HIGH |
| 37269267:supports:1 | 37269267 | ct-mr-ecv-correlation-meta | SUPPORTS | PubMed > Abstract > Results | HIGH |
| 37749293:supports:1 | 37749293 | ct-spectral-formula-distinct | SUPPORTS | CT-ECV calculation > Dual-energy and spectral CT | HIGH |
| 31132211:refutes:1 | 31132211 | early-timing-improves-myocarditis-detection | REFUTES | PubMed > Abstract > Results and Conclusions | HIGH |
| 27771398:qualifies:2 | 27771398 | ecv-associated-functional-recovery-acute-mi | QUALIFIES | Methods and Discussion > cohort and study design | HIGH |
| 27771398:supports:1 | 27771398 | ecv-associated-functional-recovery-acute-mi | SUPPORTS | Abstract > Results > ECV and functional recovery | HIGH |
| 27878700:qualifies:2 | 27878700 | ecv-associated-troponin-myocarditis | QUALIFIES | PubMed > Abstract > Conclusions | HIGH |
| 27878700:supports:1 | 27878700 | ecv-associated-troponin-myocarditis | SUPPORTS | PubMed > Abstract > Results | HIGH |
| 22963517:supports:2 | 22963517 | ecv-definition-delta-r1 | SUPPORTS | Methods > ECV measurement > Equation (1) | HIGH |
| 24124732:derives:1 | 24124732 | ecv-definition-delta-r1 | DERIVES | Terminology and methods > ECV definition and equation | HIGH |
| 24702727:supports:1 | 24702727 | ecv-method-dependent | SUPPORTS | Results > In-vivo ECV comparison | HIGH |
| 25384607:supports:1 | 25384607 | ecv-no-field-difference-uniform-molli | SUPPORTS | Results > ECV comparison by field strength | HIGH |
| 25411195:qualifies:2 | 25411195 | ecv-prognostic-al-amyloidosis | QUALIFIES | Methods > Study population | HIGH |
| 25411195:supports:1 | 25411195 | ecv-prognostic-al-amyloidosis | SUPPORTS | Abstract > Results and Conclusions > ECV and mortality | HIGH |
| 24702727:supports:1 | 24702727 | ecv-reproducibility-no-difference-small-study | SUPPORTS | Results > Reproducibility analysis; seven healthy volunteers | HIGH |
| 22963517:supports:1 | 22963517 | ecv-requires-four-t1-inputs | SUPPORTS | Methods > ECV measurement > Equation (1) | HIGH |
| 22963517:supports:1 | 22963517 | ecv-requires-hematocrit | SUPPORTS | Methods > ECV measurement > Equation (1) | HIGH |
| 24124732:supports:2 | 24124732 | ecv-requires-hematocrit | SUPPORTS | Terminology and methods > ECV equation | HIGH |
| 32089132:supports:1 | 32089132 | field-and-site-specific-values | SUPPORTS | Advanced tissue characterization > introductory paragraph | HIGH |
| 23881866:qualifies:2 | 23881866 | heart-rate-can-limit-mapping | QUALIFIES | PubMed > Abstract > Results | HIGH |
| 28992817:supports:1 | 28992817 | heart-rate-can-limit-mapping | SUPPORTS | Technical considerations > Sequence-specific confounders > heart-rate dependence | HIGH |
| 32089132:supports:1 | 32089132 | hematocrit-within-24-hours | SUPPORTS | Advanced tissue characterization > T1 mapping > item h | HIGH |
| 24387626:supports:1 | 24387626 | inversion-recovery-underestimation | SUPPORTS | Inversion-recovery methods > accuracy limitations | HIGH |
| 23553570:supports:1 | 23553570 | isolated-postcontrast-t1-insufficient | SUPPORTS | PubMed > Abstract > Results and Conclusions | HIGH |
| 28992817:supports:1 | 28992817 | local-reference-ranges-required | SUPPORTS | Recommendations part II > Site preparation and normal values > Local reference ranges | HIGH |
| 25411195:qualifies:2 | 25411195 | mapping-amyloidosis-information | QUALIFIES | PubMed > Abstract > Methods and Results | HIGH |
| 28992817:supports:1 | 28992817 | mapping-amyloidosis-information | SUPPORTS | Clinical applications > Cardiac amyloidosis | HIGH |
| 28992817:supports:1 | 28992817 | mapping-myocarditis-information | SUPPORTS | Clinical applications > Myocarditis | HIGH |
| 30545455:qualifies:2 | 30545455 | mapping-myocarditis-information | QUALIFIES | PubMed > Abstract > Expert recommendations, final paragraph | HIGH |
| 21092095:supports:2 | 21092095 | mapping-supported-3t | SUPPORTS | Title and Methods > CMR protocol | HIGH |
| 28992817:supports:1 | 28992817 | mapping-supported-3t | SUPPORTS | Recommendations part II > Site preparation and normal values > CMR systems, item 1 | HIGH |
| 21092095:supports:2 | 21092095 | mapping-supported-field-strengths | SUPPORTS | Title and Methods > CMR protocol | HIGH |
| 28992817:supports:1 | 28992817 | mapping-supported-field-strengths | SUPPORTS | Recommendations part II > Site preparation and normal values > CMR systems, item 1 | HIGH |
| 28992817:supports:1 | 28992817 | mapping-useful-suspected-disease | SUPPORTS | Clinical recommendations > General clinical indications > opening recommendation | HIGH |
| 29415744:corrects:1 | 29415744 | messroghli-correction-lifecycle | CORRECTS | Correction notice > title and corrected article citation | HIGH |
| 15236377:supports:1 | 15236377 | molli-is-inversion-recovery | SUPPORTS | PubMed > Title and Abstract > Methods | HIGH |
| 24387626:qualifies:2 | 24387626 | molli-more-precise-head-to-head | QUALIFIES | Accuracy and precision > inversion- versus saturation-recovery | HIGH |
| 24702727:supports:1 | 24702727 | molli-more-precise-head-to-head | SUPPORTS | Results > In-vivo and phantom precision comparison | HIGH |
| 24124732:supports:1 | 24124732 | moon-position-historical | SUPPORTS | Document identity > publication date and consensus status | HIGH |
| 28992817:qualifies:2 | 28992817 | moon-position-historical | QUALIFIES | Document identity > updated SCMR/EACVI position paper | HIGH |
| 22963517:supports:1 | 22963517 | motion-registration-limitation | SUPPORTS | Methods and Results > automated image registration | HIGH |
| 22963517:derives:1 | 22963517 | mr-ct-ecv-formulas-distinct | DERIVES | Methods > ECV measurement > Equation (1) | HIGH |
| 37749293:derives:2 | 37749293 | mr-ct-ecv-formulas-distinct | DERIVES | CT-ECV calculation > equations | HIGH |
| 23553570:qualifies:2 | 23553570 | mr-ecv-correlates-histology | QUALIFIES | PubMed > Abstract > Methods | HIGH |
| 23553570:supports:1 | 23553570 | mr-ecv-correlates-histology | SUPPORTS | PubMed > Abstract > Results > histologic validation | HIGH |
| 30545455:supports:1 | 30545455 | myocarditis-single-criterion-less-specific | SUPPORTS | PubMed > Abstract > Updated CMR criteria, final sentences | HIGH |
| 30545455:supports:1 | 30545455 | myocarditis-t1-t2-combination | SUPPORTS | PubMed > Abstract > Updated CMR criteria | HIGH |
| 27878700:qualifies:2 | 27878700 | native-t1-associated-troponin-myocarditis | QUALIFIES | PubMed > Abstract > Methods | HIGH |
| 27878700:supports:1 | 27878700 | native-t1-associated-troponin-myocarditis | SUPPORTS | PubMed > Abstract > Methods and Results | HIGH |
| 25384607:supports:1 | 25384607 | native-t1-higher-3t-uniform-molli | SUPPORTS | Results > Native T1 at 1.5 T and 3 T | HIGH |
| 24387626:supports:1 | 24387626 | off-resonance-bias | SUPPORTS | Technical confounders > off-resonance | HIGH |
| 28992817:supports:1 | 28992817 | partial-volume-limits-mapping | SUPPORTS | Technical considerations > Map analysis and confounders > partial-volume effects | HIGH |
| 27579699:mentions:2 | 27579699 | plos-correction-lifecycle | MENTIONS | PLOS article identity > title and DOI | HIGH |
| 27902782:corrects:1 | 27902782 | plos-correction-lifecycle | CORRECTS | PLOS correction notice > title, DOI and original article citation | HIGH |
| 32089132:supports:1 | 32089132 | protocol-ecv-postcontrast-window | SUPPORTS | Advanced tissue characterization > T1 mapping > item g | HIGH |
| 32160925:qualifies:2 | 32160925 | protocol-ecv-postcontrast-window | QUALIFIES | Parametric mapping > T1 mapping and ECV > item i | HIGH |
| 22963517:supports:1 | 22963517 | recent-infarct-equilibrium-limitation | SUPPORTS | Discussion > Contrast equilibrium and recently infarcted myocardium | HIGH |
| 28992817:supports:1 | 28992817 | report-contrast-type-dose | SUPPORTS | Recommendations part II > Reporting recommendations > contrast information | HIGH |
| 28992817:supports:1 | 28992817 | report-sequence-identity | SUPPORTS | Recommendations part II > Reporting recommendations | HIGH |
| 28992817:supports:1 | 28992817 | routine-ecv-reasonable | SUPPORTS | Recommendations part II > ECV mapping > clinical implementation recommendation | HIGH |
| 23881866:supports:1 | 23881866 | sasha-is-saturation-recovery | SUPPORTS | PubMed > Title and Abstract > Methods | HIGH |
| 28992817:mentions:2 | 28992817 | sasha-is-saturation-recovery | MENTIONS | Sequence overview > saturation-recovery methods | HIGH |
| 24387626:qualifies:2 | 24387626 | sasha-more-accurate-head-to-head | QUALIFIES | Accuracy and precision > saturation-recovery trade-off | HIGH |
| 24702727:supports:1 | 24702727 | sasha-more-accurate-head-to-head | SUPPORTS | Results > Phantom accuracy comparison | HIGH |
| 24387626:supports:1 | 24387626 | saturation-recovery-precision-limitation | SUPPORTS | Saturation-recovery methods > precision analysis | HIGH |
| 21092095:supports:1 | 21092095 | shmolli-nine-heartbeat | SUPPORTS | Title; Methods > ShMOLLI scheme | HIGH |
| 30089499:supports:1 | 30089499 | synthetic-hct-3t-misclassification | SUPPORTS | Results > misclassification analysis | HIGH |
| 28980127:supports:1 | 28980127 | synthetic-hct-acceptable-agreement | SUPPORTS | Results > measured versus synthetic ECV agreement | HIGH |
| 30089499:refutes:2 | 30089499 | synthetic-hct-acceptable-agreement | REFUTES | Results and Conclusions > clinical misclassification at 3 T | HIGH |
| 28980127:supports:1 | 28980127 | synthetic-hct-local-calibration | SUPPORTS | Methods and Discussion > local derivation and validation | HIGH |
| 30089499:supports:2 | 30089499 | synthetic-hct-local-calibration | SUPPORTS | Discussion > dependence on field strength and local equation | HIGH |
| 32375896:qualifies:2 | 32375896 | t1mes-repeatability-system-dependent | QUALIFIES | Discussion > Limitations | HIGH |
| 32375896:supports:1 | 32375896 | t1mes-repeatability-system-dependent | SUPPORTS | Results > scanner, sequence, field and software effects | HIGH |
| 25384607:qualifies:2 | 25384607 | uniform-molli-intersite-reproducibility | QUALIFIES | Discussion > Generalizability | HIGH |
| 25384607:supports:1 | 25384607 | uniform-molli-intersite-reproducibility | SUPPORTS | Results and Discussion > intercenter variability under uniform protocol | HIGH |

## 14. Contextes couverts

- noxia:radiology:context:ecv-t1:acute-mi-mr — species, disease, modality
- noxia:radiology:context:ecv-t1:al-amyloidosis-mr — species, disease, modality
- noxia:radiology:context:ecv-t1:ct-ecv-bolus — species, modality, contrastAgent, temporality
- noxia:radiology:context:ecv-t1:ct-ecv-equilibrium — species, disease, modality, contrastAgent, protocol
- noxia:radiology:context:ecv-t1:mr-1-5-t — modality, fieldStrength
- noxia:radiology:context:ecv-t1:mr-3-t — modality, fieldStrength
- noxia:radiology:context:ecv-t1:mr-ecv — modality, measurementMethod, contrastAgent
- noxia:radiology:context:ecv-t1:mr-general — species, modality, clinicalDomain
- noxia:radiology:context:ecv-t1:mr-molli — modality, measurementMethod, sequence
- noxia:radiology:context:ecv-t1:mr-molli-sasha-comparison — modality, sequence, population, study
- noxia:radiology:context:ecv-t1:mr-sasha — modality, measurementMethod, sequence
- noxia:radiology:context:ecv-t1:mr-shmolli — modality, measurementMethod, sequence, fieldStrength
- noxia:radiology:context:ecv-t1:multicenter-molli — species, population, modality, sequence, fieldStrength, center
- noxia:radiology:context:ecv-t1:myocarditis-mr — species, disease, modality
- noxia:radiology:context:ecv-t1:myocarditis-mr-timing — disease, modality, temporality
- noxia:radiology:context:ecv-t1:synthetic-hct-3-t — modality, measurementMethod, fieldStrength, center
- noxia:radiology:context:ecv-t1:synthetic-hct-local — modality, measurementMethod, center
- noxia:radiology:context:ecv-t1:t1mes-phantom — population, modality, fieldStrength, center

## 15. Limitations

- ACCURACY_PRECISION_TRADEOFF
- Center-specific thresholds; not a universal diagnostic range.
- CLINICAL_MISCLASSIFICATION
- LOCAL_CALIBRATION
- LOW_STUDY_QUALITY
- METHOD_HETEROGENEITY
- No significant difference is not proof of universal equivalence across platforms.
- noxia:radiology:confounder:cardiac-motion
- noxia:radiology:confounder:heart-rate-dependence
- noxia:radiology:confounder:method-dependence
- noxia:radiology:confounder:off-resonance
- noxia:radiology:confounder:partial-volume
- noxia:radiology:quality-attribute:measurement-precision
- noxia:radiology:technical-context:post-contrast-delay
- PHANTOM_TO_IN_VIVO_GENERALIZATION
- POST_CONTRAST_T1_CONFOUNDING
- REFERENCE_RANGE_TRANSFERABILITY
- Seven healthy participants; absence of significance is not proof of equivalence.
- SINGLE_CRITERION_SPECIFICITY
- SITE_SPECIFIC_VALUES
- SMALL_SAMPLE
- T1_BIAS
- The estimate is setup-specific and is not a universal field-strength correction.

## 16. Facteurs confondants

- noxia:radiology:confounder:cardiac-motion
- noxia:radiology:confounder:heart-rate-dependence
- noxia:radiology:confounder:method-dependence
- noxia:radiology:confounder:off-resonance
- noxia:radiology:confounder:partial-volume

## 17. Contradictions

- ecv — noxia:radiology:scientific-assertion:ecv-t1:synthetic-hct-acceptable-agreement:revision:1 — résolution : UNRESOLVED_CONTEXT_DEPENDENT

## 18. Convergences

- ct-ecv — CONTEXT_DEPENDENT_CONVERGENCE — P4_CONTEXT_FIRST_CONVERGENCE_V1
- ecv — CONTRADICTION — P4_CONTEXT_FIRST_CONVERGENCE_V1
- ecv-1-5t-versus-3t — CURRENT_CONSENSUS — P4_CONTEXT_FIRST_CONVERGENCE_V1
- ecv-mr-versus-ct — CONTEXT_DEPENDENT_CONVERGENCE — P4_CONTEXT_FIRST_CONVERGENCE_V1
- ecv-myocardial-infarction — PARTIAL_CONVERGENCE — P4_CONTEXT_FIRST_CONVERGENCE_V1
- ecv-myocarditis — CURRENT_CONSENSUS — P4_CONTEXT_FIRST_CONVERGENCE_V1
- intersite-reproducibility — PARTIAL_CONVERGENCE — P4_CONTEXT_FIRST_CONVERGENCE_V1
- molli-versus-sasha — PARTIAL_CONVERGENCE — P4_CONTEXT_FIRST_CONVERGENCE_V1
- native-t1-methods — CURRENT_CONSENSUS — P4_CONTEXT_FIRST_CONVERGENCE_V1
- t1-technical-limitations — CURRENT_CONSENSUS — P4_CONTEXT_FIRST_CONVERGENCE_V1

## 19. Consensus explicites

- ecv — P4_CURRENT_CONSENSUS_V1 — noxia:radiology:source:pubmed:28992817:revision:1, noxia:radiology:source:pubmed:29415744:revision:1, noxia:radiology:source:pubmed:30545455:revision:1, noxia:radiology:source:pubmed:32089132:revision:1, noxia:radiology:source:pubmed:32160925:revision:1
- ecv-1-5t-versus-3t — P4_CURRENT_CONSENSUS_V1 — noxia:radiology:source:pubmed:32089132:revision:1
- ecv-myocarditis — P4_CURRENT_CONSENSUS_V1 — noxia:radiology:source:pubmed:30545455:revision:1
- native-t1-methods — P4_CURRENT_CONSENSUS_V1 — noxia:radiology:source:pubmed:28992817:revision:1, noxia:radiology:source:pubmed:29415744:revision:1, noxia:radiology:source:pubmed:30545455:revision:1, noxia:radiology:source:pubmed:32089132:revision:1
- t1-technical-limitations — P4_CURRENT_CONSENSUS_V1 — noxia:radiology:source:pubmed:28992817:revision:1, noxia:radiology:source:pubmed:32089132:revision:1

## 20. Questions ouvertes

- CONTEXTUAL_CONTRADICTION_REQUIRES_SCIENTIFIC_REVIEW
- SCIENTIFIC_HUMAN_REVIEW_REQUIRED_BEFORE_PUBLIC_PROJECTION

## 21. Cycle de vie documentaire

2 liens CORRECTS ; 0 rétraction identifiée. Le couple PLOS et la correction SCMR/EACVI sont reliés uniquement par leurs notices officielles.

## 22. Requêtes disponibles

| Requête | Résultats | Contextes | Sources | Données manquantes |
| --- | ---: | ---: | ---: | --- |
| ecvGeneral | 35 | 12 | 20 | NONE |
| ecvMr | 28 | 10 | 17 | NONE |
| ecvCt | 8 | 3 | 5 | NONE |
| ecvMyocarditis | 4 | 2 | 3 | NONE |
| ecvInfarction | 2 | 1 | 2 | NONE |
| molli | 2 | 2 | 2 | NONE |
| sasha | 2 | 1 | 3 | NONE |
| molliSasha | 4 | 1 | 2 | NONE |
| ecv15T | 2 | 2 | 2 | NONE |
| ecv3T | 3 | 3 | 3 | NONE |
| limitations | 14 | 9 | 12 | NONE |
| reproducibility | 3 | 3 | 3 | NONE |
| ctReproducibility | 0 | 0 | 0 | NO_APPLICABLE_ASSERTION |
| consensus | 6 | 2 | 4 | NONE |
| contradictions | 3 | 2 | 2 | NONE |

## 23. Synthèses structurées

| Synthèse | Assertions | Sources | Contradictions | Consensus | Confiance | Lacunes |
| --- | ---: | ---: | ---: | --- | --- | --- |
| ct-ecv | 8 | 5 | 0 | NO_EXPLICIT_CURRENT_CONSENSUS | MODERATE | NONE |
| ecv | 35 | 20 | 1 | CURRENT_CONSENSUS | CONTESTED | NONE |
| ecv-1-5t-versus-3t | 2 | 2 | 0 | CURRENT_CONSENSUS | MODERATE | NONE |
| ecv-mr-versus-ct | 1 | 2 | 0 | NO_EXPLICIT_CURRENT_CONSENSUS | MODERATE | NONE |
| ecv-myocardial-infarction | 2 | 2 | 0 | NO_EXPLICIT_CURRENT_CONSENSUS | MODERATE | NONE |
| ecv-myocarditis | 4 | 3 | 0 | CURRENT_CONSENSUS | MODERATE | NONE |
| intersite-reproducibility | 3 | 3 | 0 | NO_EXPLICIT_CURRENT_CONSENSUS | MODERATE | NONE |
| molli-versus-sasha | 4 | 2 | 0 | NO_EXPLICIT_CURRENT_CONSENSUS | MODERATE | NONE |
| native-t1-methods | 20 | 11 | 0 | CURRENT_CONSENSUS | MODERATE | NONE |
| t1-technical-limitations | 9 | 5 | 0 | CURRENT_CONSENSUS | MODERATE | NONE |

## 24. Projections internes

| Projection interne | Scientific Ready | Synthesis Ready | Editorial Ready | Public Ready | Blocage |
| --- | --- | --- | --- | --- | --- |
| comparison-molli-sasha | true | true | false | false | P4_PUBLICATION_FORBIDDEN, NO_SCIENTIFIC_HUMAN_REVIEW, NO_EDITORIAL_APPROVAL |
| comparison-mr-ct-ecv | true | true | false | false | P4_PUBLICATION_FORBIDDEN, NO_SCIENTIFIC_HUMAN_REVIEW, NO_EDITORIAL_APPROVAL |
| knowledge-state-ecv | true | true | false | false | P4_PUBLICATION_FORBIDDEN, NO_SCIENTIFIC_HUMAN_REVIEW, NO_EDITORIAL_APPROVAL |
| knowledge-state-ecv-infarction | true | true | false | false | P4_PUBLICATION_FORBIDDEN, NO_SCIENTIFIC_HUMAN_REVIEW, NO_EDITORIAL_APPROVAL |
| knowledge-state-ecv-myocarditis | true | true | false | false | P4_PUBLICATION_FORBIDDEN, NO_SCIENTIFIC_HUMAN_REVIEW, NO_EDITORIAL_APPROVAL |
| method-card-molli | true | true | false | false | P4_PUBLICATION_FORBIDDEN, NO_SCIENTIFIC_HUMAN_REVIEW, NO_EDITORIAL_APPROVAL |
| method-card-sasha | true | true | false | false | P4_PUBLICATION_FORBIDDEN, NO_SCIENTIFIC_HUMAN_REVIEW, NO_EDITORIAL_APPROVAL |
| reproducibility | true | true | false | false | P4_PUBLICATION_FORBIDDEN, NO_SCIENTIFIC_HUMAN_REVIEW, NO_EDITORIAL_APPROVAL |
| scientific-card-ct-ecv | true | true | false | false | P4_PUBLICATION_FORBIDDEN, NO_SCIENTIFIC_HUMAN_REVIEW, NO_EDITORIAL_APPROVAL |
| scientific-card-ecv | true | true | false | false | P4_PUBLICATION_FORBIDDEN, NO_SCIENTIFIC_HUMAN_REVIEW, NO_EDITORIAL_APPROVAL |
| scientific-card-t1-mapping | true | true | false | false | P4_PUBLICATION_FORBIDDEN, NO_SCIENTIFIC_HUMAN_REVIEW, NO_EDITORIAL_APPROVAL |
| technical-limitations | true | true | false | false | P4_PUBLICATION_FORBIDDEN, NO_SCIENTIFIC_HUMAN_REVIEW, NO_EDITORIAL_APPROVAL |

## 25. Readiness

Sept dimensions indépendantes sont calculées sans score global : catalog, scientific, provenance, synthesis, editorial projection, SEO et public publication. Aucune projection n'est editorialReady, seoReady ou publicPublicationReady.

## 26. Workflow de revue

- automatedStructuralReview : 58
- scientificHumanReview : 0
- assertions automatiquement VERIFIED : 0
- assertions publiques : 0

## 27. Tests ajoutés

`src/knowledge-graph/scientific-corpus/scientific-corpus.test.mjs` couvre le corpus, la provenance, les requêtes, les synthèses, le readiness et les surfaces protégées.

## 28. Validations exécutables

Le validateur P4 rapporte : VALID. Les commandes sont listées dans `package.json` et le rapport final d'exécution doit confirmer leurs statuts.

## 29. Couverture du domaine

- myocardialT1MappingMethods : SUBSTANTIAL_PILOT_COVERAGE
- cmrEcvDefinitionAndTechnicalContext : SUBSTANTIAL_PILOT_COVERAGE
- myocarditis : PARTIAL_CLINICAL_COVERAGE
- myocardialInfarction : LIMITED_SINGLE_COHORT_COVERAGE
- systemicAlAmyloidosis : LIMITED_SINGLE_COHORT_COVERAGE
- ctEcv : PARTIAL_METHOD_AND_VALIDATION_COVERAGE
- intersiteReproducibility : PARTIAL_CMR_COVERAGE
- ctEcvReproducibility : ABSENT
- manufacturerSpecificEffects : PHANTOM_LEVEL_ONLY_NO_PRODUCT_CLAIMS
- softwareVersionSpecificEffects : ABSENT
- coverageEstimateMethod : CATEGORICAL_NO_OPAQUE_SCORE

## 30. Lacunes restantes

- Scientific human review has not occurred.
- Author lists are stored as verified abbreviated citations, not asserted as complete lists.
- Several paywalled sources are localized to PubMed structured abstracts rather than full text.
- CT-ECV intersite reproducibility is absent from the retained corpus.
- Manufacturer, equipment-model and software-version clinical effects are not asserted where sources do not report them.
- No universal reference range, diagnostic threshold or cross-platform equivalence is represented.
- Clinical coverage is selective and is not a systematic review of every cardiomyopathy.

## 31. Éléments généralisables

- SourceIdentity/Revision
- ScientificAssertionIdentity/Revision
- EvidenceLink
- ApplicabilityContext
- MeasurementDefinition/Method
- Observation
- DerivedMeasurement
- DeterministicQuery
- StructuredSynthesis
- MultidimensionalReadiness
- InternalProjection

## 32. Évolutions de schéma nécessaires

- Rattacher une revue scientifique humaine versionnée avant toute projection éditoriale.
- Conserver les branches quantitatives propres aux modalités lors des futurs domaines.
- Résoudre séparément les classifications LGE, MVO et hémorragie intramyocardique.
- Ajouter uniquement les contextes constructeur, modèle et logiciel effectivement publiés.

## 33. Fichiers créés

- `docs/p4-scientific-corpus-report.md`
- `docs/p4-scientific-corpus.md`
- `scripts/enrich-scientific-corpus.mjs`
- `scripts/query-scientific-corpus.mjs`
- `scripts/report-scientific-corpus.mjs`
- `scripts/report-scientific-projections.mjs`
- `scripts/report-scientific-synthesis.mjs`
- `scripts/validate-scientific-corpus.mjs`
- `scripts/validate-scientific-projections.mjs`
- `scripts/validate-scientific-readiness.mjs`
- `src/knowledge-graph/scientific-corpus/assertions.mjs`
- `src/knowledge-graph/scientific-corpus/baseline.mjs`
- `src/knowledge-graph/scientific-corpus/concepts.mjs`
- `src/knowledge-graph/scientific-corpus/constants.mjs`
- `src/knowledge-graph/scientific-corpus/contexts.mjs`
- `src/knowledge-graph/scientific-corpus/measurements.mjs`
- `src/knowledge-graph/scientific-corpus/projections.mjs`
- `src/knowledge-graph/scientific-corpus/protected-surfaces.mjs`
- `src/knowledge-graph/scientific-corpus/query.mjs`
- `src/knowledge-graph/scientific-corpus/readiness.mjs`
- `src/knowledge-graph/scientific-corpus/report.mjs`
- `src/knowledge-graph/scientific-corpus/scientific-corpus.test.mjs`
- `src/knowledge-graph/scientific-corpus/sources.mjs`
- `src/knowledge-graph/scientific-corpus/synthesis.mjs`
- `src/knowledge-graph/scientific-corpus/validate.mjs`

## 34. Fichiers modifiés

- `package.json`
- `src/knowledge-graph/scientific-model-schema.mjs`
- `src/knowledge-graph/scientific-model-factories.mjs`
- `src/knowledge-graph/multilayer-validation.mjs`
- `src/knowledge-graph/index.mjs`

## Contrats préservés

| Contrat | Préservé ? | Test ou preuve | Remarque |
| --- | --- | --- | --- |
| 118 historical concepts | true | validate:knowledge-graph-migration | P4 concepts are additional identities |
| 93 historical relations | true | validate:knowledge-graph-migration | 44 active, 47 deferred, 2 disabled |
| Public pages | true | protected-surface inspection | No P4 page file |
| Public routes | true | protected-surface inspection | No P4 route |
| SEO and sitemap | true | protected-surface inspection | No P4 SEO artifact |
| Viewers | true | protected-surface inspection | No P4 viewer file |
| PACS | true | protected-surface inspection | Outside scope |
| Supabase | true | protected-surface inspection | Outside scope |
| editorial-engine | true | 335fbbea8d138901f0cdf4f5e2d3b96144880e8b | Separate repository clean |
| No public projection | true | validate:scientific-projections | 12 internal fixtures |
| No human-review claim | true | validate:scientific-corpus | Automated structural review only |

## Totaux

- Sources examinées : 35
- Sources retenues : 27
- Sources rejetées : 8
- Concepts ajoutés : 42
- Concepts requalifiés : 0
- Assertions : 58
- EvidenceLinks : 84
- SUPPORTS : 57
- REFUTES : 2
- QUALIFIES : 17
- MENTIONS : 2
- Contextes : 18
- Limitations : 23
- Contradictions : 1
- Consensus explicites : 5
- Questions ouvertes : 2
- Synthèses : 10
- Projections internes : 12

## Décision interne P4

ENRICHISSEMENT PARTIEL SÛR — SOURCES COMPLÉMENTAIRES REQUISES
