# P4R — Consolidation scientifique du pilote ECV/T1

Rapport interne déterministe. Il ne constitue ni une page publique, ni une validation humaine, ni une recommandation clinique.

## 1. État Git initial

- Branche : `main`
- HEAD : `857e94b6df88289b59de149fe8f77e84dbee9492`
- Travail P4 préservé : true
- Restauration automatique : false

## 2. Snapshot P4

- Digest : `c36be4f3c07a2c8a55f47805667c6ad005397ba3ac86194f0744a2d4f760ef53`
- 27 sources, 58 assertions, 84 EvidenceLinks, 10 synthèses et 12 projections préservés.
- Les timestamps instables sont exclus du contrat de digest.

## 3. Sources P4 réauditées

| Source | État P4 | État P4R | Texte intégral | Métadonnées | Assertions | Limites |
| --- | --- | --- | --- | --- | --- | --- |
| noxia:radiology:source:pubmed:15236377:revision:2 | ABSTRACT_ONLY | ABSTRACT_ONLY | false | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 1 | ["P4R could verify only the PubMed record and structured abstract; every linked assertion remains limited to that content."] |
| noxia:radiology:source:pubmed:21092095:revision:2 | PMC_FULL_TEXT | FULL_TEXT_VERIFIED | true | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 3 | ["Technical validation does not by itself establish clinical diagnostic value."] |
| noxia:radiology:source:pubmed:22771879:revision:2 | PMC_FULL_TEXT | FULL_TEXT_VERIFIED | true | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 2 | ["Small sample.","MR rather than histology was the reference.","Only anterior and anterolateral segments were analyzed.","Additional radiation was required."] |
| noxia:radiology:source:pubmed:22963517:revision:2 | PMC_FULL_TEXT | FULL_TEXT_VERIFIED | true | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 6 | ["The bolus equilibrium assumption may not hold in recently infarcted myocardium."] |
| noxia:radiology:source:pubmed:23553570:revision:2 | ABSTRACT_ONLY | ABSTRACT_ONLY | false | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 3 | ["Histology involved six transplant recipients; the healthy timing cohort involved 30 volunteers.","P4R could verify only the PubMed record and structured abstract; every linked assertion remains limited to that content."] |
| noxia:radiology:source:pubmed:23878282:revision:2 | ABSTRACT_ONLY | ABSTRACT_ONLY | false | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 2 | ["Small cohort restricted to severe aortic stenosis.","Equilibrium infusion protocol is not interchangeable with routine bolus protocols.","P4R could verify only the PubMed record and structured abstract; every linked assertion remains limited to that content."] |
| noxia:radiology:source:pubmed:23881866:revision:2 | ABSTRACT_ONLY | ABSTRACT_ONLY | false | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 2 | ["In-vivo cohort included 29 healthy volunteers and 7 heart-failure patients.","P4R could verify only the PubMed record and structured abstract; every linked assertion remains limited to that content."] |
| noxia:radiology:source:pubmed:24124732:revision:2 | PMC_FULL_TEXT | CONSENSUS_DOCUMENT | true | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 3 | ["Superseded as current guidance by the 2017 SCMR/EACVI position paper."] |
| noxia:radiology:source:pubmed:24387626:revision:2 | PMC_FULL_TEXT | FULL_TEXT_VERIFIED | true | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 6 | ["Several comparisons are simulation-based and should not be generalized directly to clinical outcomes."] |
| noxia:radiology:source:pubmed:24702727:revision:2 | PMC_FULL_TEXT | FULL_TEXT_VERIFIED | true | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 4 | ["The in-vivo reproducibility comparison included seven healthy participants."] |
| noxia:radiology:source:pubmed:25384607:revision:2 | PMC_FULL_TEXT | FULL_TEXT_VERIFIED | true | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 4 | ["Transferability was evaluated under a uniform Philips MOLLI setup and does not establish universal reference ranges."] |
| noxia:radiology:source:pubmed:25411195:revision:2 | PMC_FULL_TEXT | FULL_TEXT_VERIFIED | true | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 3 | ["Findings concern systemic AL amyloidosis and should not be generalized to every amyloid subtype."] |
| noxia:radiology:source:pubmed:27579699:revision:2 | PMC_FULL_TEXT | FULL_TEXT_VERIFIED | true | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 1 | ["Out of ECV/T1 domain; retained only because P3M-Web identified its correction lifecycle."] |
| noxia:radiology:source:pubmed:27771398:revision:2 | PMC_FULL_TEXT | FULL_TEXT_VERIFIED | true | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 2 | ["Single-center cohort of 39 patients; association does not establish a clinical decision rule."] |
| noxia:radiology:source:pubmed:27878700:revision:2 | ABSTRACT_ONLY | ABSTRACT_ONLY | false | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 4 | ["A ten-fold troponin elevation was used as the reference for myocardial damage; results are not a standalone recommendation.","P4R could verify only the PubMed record and structured abstract; every linked assertion remains limited to that content."] |
| noxia:radiology:source:pubmed:27902782:revision:2 | PMC_FULL_TEXT | CORRECTION_NOTICE | true | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 1 | ["Out of ECV/T1 domain; no scientific ECV assertion is derived from it."] |
| noxia:radiology:source:pubmed:28980127:revision:2 | PMC_FULL_TEXT | FULL_TEXT_VERIFIED | true | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 2 | ["Single-center locally derived formula.","Agreement does not establish universal clinical interchangeability."] |
| noxia:radiology:source:pubmed:28992817:revision:2 | PMC_FULL_TEXT | CONSENSUS_DOCUMENT | true | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 13 | ["Evidence and recommendations reflect the literature assessed up to mid-2017."] |
| noxia:radiology:source:pubmed:29415744:revision:2 | PMC_FULL_TEXT | CORRECTION_NOTICE | true | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 1 | [] |
| noxia:radiology:source:pubmed:30089499:revision:2 | PMC_FULL_TEXT | FULL_TEXT_VERIFIED | true | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED","PUBLICATION_DATE_NORMALIZED"] | 3 | ["Single-center 3 T model and center-specific cutoff."] |
| noxia:radiology:source:pubmed:30545455:revision:2 | ABSTRACT_ONLY | GUIDELINE_DOCUMENT | true | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED","ACCESS_STATE_REQUALIFIED"] | 3 | [] |
| noxia:radiology:source:pubmed:31132211:revision:2 | ABSTRACT_ONLY | ABSTRACT_ONLY | false | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 1 | ["P4R could verify only the PubMed record and structured abstract; every linked assertion remains limited to that content."] |
| noxia:radiology:source:pubmed:32089132:revision:2 | PMC_FULL_TEXT | GUIDELINE_DOCUMENT | true | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 3 | ["Protocol guidance does not establish universal numerical reference values."] |
| noxia:radiology:source:pubmed:32160925:revision:2 | PMC_FULL_TEXT | GUIDELINE_DOCUMENT | true | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 2 | ["Post-processing guidance does not replace sequence-specific validation."] |
| noxia:radiology:source:pubmed:32375896:revision:2 | PMC_FULL_TEXT | FULL_TEXT_VERIFIED | true | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED"] | 2 | ["Phantom repeatability is not direct evidence of in-vivo clinical reproducibility.","GE systems were under-represented."] |
| noxia:radiology:source:pubmed:37269267:revision:2 | ABSTRACT_ONLY | OFFICIAL_FULL_TEXT | true | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED","ACCESS_STATE_REQUALIFIED"] | 3 | ["Overall quality of the 13 included studies was rated low by the authors.","Heterogeneous single- and dual-energy methods were pooled."] |
| noxia:radiology:source:pubmed:37749293:revision:2 | PMC_FULL_TEXT | FULL_TEXT_VERIFIED | true | ["AUTHORS_COMPLETED_FROM_PUBMED","VOLUME_ADDED","ISSUE_ADDED","PAGES_OR_ARTICLE_ID_ADDED","TITLE_NORMALIZED_TO_PUBMED"] | 4 | ["Secondary technical review; primary studies remain the evidence for validation claims."] |

## 4. Sources passées au texte intégral

21 sources disposent désormais d’un texte intégral PMC ou éditeur officiel vérifié. Les PMID 30545455 et 37269267 ont été requalifiés depuis `ABSTRACT_ONLY`.

## 5. Sources restant abstract-only

- noxia:radiology:source:pubmed:15236377:revision:2
- noxia:radiology:source:pubmed:23553570:revision:2
- noxia:radiology:source:pubmed:23878282:revision:2
- noxia:radiology:source:pubmed:23881866:revision:2
- noxia:radiology:source:pubmed:27878700:revision:2
- noxia:radiology:source:pubmed:31132211:revision:2

## 6. Métadonnées complétées

- 27 listes d’auteurs complètes issues de PubMed.
- 112 changements bibliographiques explicites au total.
- Volume, numéro et pages ou identifiant d’article présents pour les 27 sources.

## 7. Métadonnées restant inconnues

Aucun champ bibliographique requis par P4R ne reste inconnu. Les informations non nécessaires ou non rapportées dans les études ne sont pas extrapolées.

## 8. Extractions validées

84 extractions conservées ; chaque passage stocké est explicitement marqué comme résumé analytique et non comme citation verbatim.

## 9. Extractions qualifiées

Les extractions dérivées conservent leurs étapes de dérivation. Les six sources abstract-only restent bornées au contenu de leur résumé PubMed.

## 10. Assertions validées automatiquement

42 assertions ont passé la revue automatisée.

## 11. Assertions qualifiées

14 assertions restent qualifiées par leur accès documentaire, leur interprétation ou leur statut.

## 12. Assertions contestées

2 assertions restent contestées.

## 13. Assertions rejetées

0 assertion rejetée ; 0 assertion à source insuffisante.

| Assertion | Source | Extraction | EvidenceLink | Revue automatisée | Décision |
| --- | --- | --- | --- | --- | --- |
| noxia:radiology:scientific-assertion:ecv-t1:accuracy-precision-distinct:revision:2 | ["noxia:radiology:source:pubmed:24387626:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:accuracy-precision-distinct:evidence:24387626:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:blood-roi-excludes-papillary-trabeculae:revision:2 | ["noxia:radiology:source:pubmed:32160925:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:blood-roi-excludes-papillary-trabeculae:evidence:32160925:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:ct-ecv-correlates-histology-aortic-stenosis:revision:2 | ["noxia:radiology:source:pubmed:23878282:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:ct-ecv-correlates-histology-aortic-stenosis:evidence:23878282:qualifies:2:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:ct-ecv-correlates-histology-aortic-stenosis:evidence:23878282:supports:1:p4r:1"] | AUTOMATED_REVIEW_QUALIFIED | QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:ct-ecv-delayed-phase:revision:2 | ["noxia:radiology:source:pubmed:37749293:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:ct-ecv-delayed-phase:evidence:37749293:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:ct-ecv-feasible-vs-mr-small-study:revision:2 | ["noxia:radiology:source:pubmed:22771879:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:ct-ecv-feasible-vs-mr-small-study:evidence:22771879:qualifies:2:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:ct-ecv-feasible-vs-mr-small-study:evidence:22771879:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:ct-ecv-single-energy-formula:revision:2 | ["noxia:radiology:source:pubmed:37749293:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:ct-ecv-single-energy-formula:evidence:37749293:derives:1:p4r:1"] | AUTOMATED_REVIEW_QUALIFIED | QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:ct-evidence-quality-low:revision:2 | ["noxia:radiology:source:pubmed:37269267:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:ct-evidence-quality-low:evidence:37269267:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:ct-mr-ecv-correlation-meta:revision:2 | ["noxia:radiology:source:pubmed:37269267:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:ct-mr-ecv-correlation-meta:evidence:37269267:qualifies:2:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:ct-mr-ecv-correlation-meta:evidence:37269267:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:ct-spectral-formula-distinct:revision:2 | ["noxia:radiology:source:pubmed:37749293:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:ct-spectral-formula-distinct:evidence:37749293:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:early-timing-improves-myocarditis-detection:revision:2 | ["noxia:radiology:source:pubmed:31132211:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:early-timing-improves-myocarditis-detection:evidence:31132211:refutes:1:p4r:1"] | AUTOMATED_REVIEW_CONTESTED | CONTESTED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-associated-functional-recovery-acute-mi:revision:2 | ["noxia:radiology:source:pubmed:27771398:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:ecv-associated-functional-recovery-acute-mi:evidence:27771398:qualifies:2:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:ecv-associated-functional-recovery-acute-mi:evidence:27771398:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-associated-troponin-myocarditis:revision:2 | ["noxia:radiology:source:pubmed:27878700:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:ecv-associated-troponin-myocarditis:evidence:27878700:qualifies:2:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:ecv-associated-troponin-myocarditis:evidence:27878700:supports:1:p4r:1"] | AUTOMATED_REVIEW_QUALIFIED | QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-definition-delta-r1:revision:2 | ["noxia:radiology:source:pubmed:22963517:revision:2","noxia:radiology:source:pubmed:24124732:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:ecv-definition-delta-r1:evidence:22963517:supports:2:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:ecv-definition-delta-r1:evidence:24124732:derives:1:p4r:1"] | AUTOMATED_REVIEW_QUALIFIED | QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-method-dependent:revision:2 | ["noxia:radiology:source:pubmed:24702727:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:ecv-method-dependent:evidence:24702727:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-no-field-difference-uniform-molli:revision:2 | ["noxia:radiology:source:pubmed:25384607:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:ecv-no-field-difference-uniform-molli:evidence:25384607:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-prognostic-al-amyloidosis:revision:2 | ["noxia:radiology:source:pubmed:25411195:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:ecv-prognostic-al-amyloidosis:evidence:25411195:qualifies:2:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:ecv-prognostic-al-amyloidosis:evidence:25411195:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-reproducibility-no-difference-small-study:revision:2 | ["noxia:radiology:source:pubmed:24702727:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:ecv-reproducibility-no-difference-small-study:evidence:24702727:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-requires-four-t1-inputs:revision:2 | ["noxia:radiology:source:pubmed:22963517:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:ecv-requires-four-t1-inputs:evidence:22963517:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-requires-hematocrit:revision:2 | ["noxia:radiology:source:pubmed:22963517:revision:2","noxia:radiology:source:pubmed:24124732:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:ecv-requires-hematocrit:evidence:22963517:supports:1:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:ecv-requires-hematocrit:evidence:24124732:supports:2:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:field-and-site-specific-values:revision:2 | ["noxia:radiology:source:pubmed:32089132:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:field-and-site-specific-values:evidence:32089132:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:heart-rate-can-limit-mapping:revision:2 | ["noxia:radiology:source:pubmed:23881866:revision:2","noxia:radiology:source:pubmed:28992817:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:heart-rate-can-limit-mapping:evidence:23881866:qualifies:2:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:heart-rate-can-limit-mapping:evidence:28992817:supports:1:p4r:1"] | AUTOMATED_REVIEW_QUALIFIED | QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:hematocrit-within-24-hours:revision:2 | ["noxia:radiology:source:pubmed:32089132:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:hematocrit-within-24-hours:evidence:32089132:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:inversion-recovery-underestimation:revision:2 | ["noxia:radiology:source:pubmed:24387626:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:inversion-recovery-underestimation:evidence:24387626:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:isolated-postcontrast-t1-insufficient:revision:2 | ["noxia:radiology:source:pubmed:23553570:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:isolated-postcontrast-t1-insufficient:evidence:23553570:supports:1:p4r:1"] | AUTOMATED_REVIEW_QUALIFIED | QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:local-reference-ranges-required:revision:2 | ["noxia:radiology:source:pubmed:28992817:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:local-reference-ranges-required:evidence:28992817:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:mapping-amyloidosis-information:revision:2 | ["noxia:radiology:source:pubmed:25411195:revision:2","noxia:radiology:source:pubmed:28992817:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:mapping-amyloidosis-information:evidence:25411195:qualifies:2:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:mapping-amyloidosis-information:evidence:28992817:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:mapping-myocarditis-information:revision:2 | ["noxia:radiology:source:pubmed:28992817:revision:2","noxia:radiology:source:pubmed:30545455:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:mapping-myocarditis-information:evidence:28992817:supports:1:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:mapping-myocarditis-information:evidence:30545455:qualifies:2:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:mapping-supported-3t:revision:2 | ["noxia:radiology:source:pubmed:21092095:revision:2","noxia:radiology:source:pubmed:28992817:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:mapping-supported-3t:evidence:21092095:supports:2:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:mapping-supported-3t:evidence:28992817:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:mapping-supported-field-strengths:revision:2 | ["noxia:radiology:source:pubmed:21092095:revision:2","noxia:radiology:source:pubmed:28992817:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:mapping-supported-field-strengths:evidence:21092095:supports:2:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:mapping-supported-field-strengths:evidence:28992817:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:mapping-useful-suspected-disease:revision:2 | ["noxia:radiology:source:pubmed:28992817:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:mapping-useful-suspected-disease:evidence:28992817:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:messroghli-correction-lifecycle:revision:2 | ["noxia:radiology:source:pubmed:29415744:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:messroghli-correction-lifecycle:evidence:29415744:corrects:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:molli-is-inversion-recovery:revision:2 | ["noxia:radiology:source:pubmed:15236377:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:molli-is-inversion-recovery:evidence:15236377:supports:1:p4r:1"] | AUTOMATED_REVIEW_QUALIFIED | QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:molli-more-precise-head-to-head:revision:2 | ["noxia:radiology:source:pubmed:24387626:revision:2","noxia:radiology:source:pubmed:24702727:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:molli-more-precise-head-to-head:evidence:24387626:qualifies:2:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:molli-more-precise-head-to-head:evidence:24702727:supports:1:p4r:1"] | AUTOMATED_REVIEW_QUALIFIED | QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:moon-position-historical:revision:2 | ["noxia:radiology:source:pubmed:24124732:revision:2","noxia:radiology:source:pubmed:28992817:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:moon-position-historical:evidence:24124732:supports:1:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:moon-position-historical:evidence:28992817:qualifies:2:p4r:1"] | AUTOMATED_REVIEW_QUALIFIED | QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:motion-registration-limitation:revision:2 | ["noxia:radiology:source:pubmed:22963517:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:motion-registration-limitation:evidence:22963517:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:mr-ct-ecv-formulas-distinct:revision:2 | ["noxia:radiology:source:pubmed:22963517:revision:2","noxia:radiology:source:pubmed:37749293:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:mr-ct-ecv-formulas-distinct:evidence:22963517:derives:1:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:mr-ct-ecv-formulas-distinct:evidence:37749293:derives:2:p4r:1"] | AUTOMATED_REVIEW_QUALIFIED | QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:mr-ecv-correlates-histology:revision:2 | ["noxia:radiology:source:pubmed:23553570:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:mr-ecv-correlates-histology:evidence:23553570:qualifies:2:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:mr-ecv-correlates-histology:evidence:23553570:supports:1:p4r:1"] | AUTOMATED_REVIEW_QUALIFIED | QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:myocarditis-single-criterion-less-specific:revision:2 | ["noxia:radiology:source:pubmed:30545455:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:myocarditis-single-criterion-less-specific:evidence:30545455:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:myocarditis-t1-t2-combination:revision:2 | ["noxia:radiology:source:pubmed:30545455:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:myocarditis-t1-t2-combination:evidence:30545455:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:native-t1-associated-troponin-myocarditis:revision:2 | ["noxia:radiology:source:pubmed:27878700:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:native-t1-associated-troponin-myocarditis:evidence:27878700:qualifies:2:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:native-t1-associated-troponin-myocarditis:evidence:27878700:supports:1:p4r:1"] | AUTOMATED_REVIEW_QUALIFIED | QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:native-t1-higher-3t-uniform-molli:revision:2 | ["noxia:radiology:source:pubmed:25384607:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:native-t1-higher-3t-uniform-molli:evidence:25384607:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:off-resonance-bias:revision:2 | ["noxia:radiology:source:pubmed:24387626:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:off-resonance-bias:evidence:24387626:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:partial-volume-limits-mapping:revision:2 | ["noxia:radiology:source:pubmed:28992817:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:partial-volume-limits-mapping:evidence:28992817:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:plos-correction-lifecycle:revision:2 | ["noxia:radiology:source:pubmed:27579699:revision:2","noxia:radiology:source:pubmed:27902782:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:plos-correction-lifecycle:evidence:27579699:mentions:2:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:plos-correction-lifecycle:evidence:27902782:corrects:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:protocol-ecv-postcontrast-window:revision:2 | ["noxia:radiology:source:pubmed:32089132:revision:2","noxia:radiology:source:pubmed:32160925:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:protocol-ecv-postcontrast-window:evidence:32089132:supports:1:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:protocol-ecv-postcontrast-window:evidence:32160925:qualifies:2:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:recent-infarct-equilibrium-limitation:revision:2 | ["noxia:radiology:source:pubmed:22963517:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:recent-infarct-equilibrium-limitation:evidence:22963517:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:report-contrast-type-dose:revision:2 | ["noxia:radiology:source:pubmed:28992817:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:report-contrast-type-dose:evidence:28992817:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:report-sequence-identity:revision:2 | ["noxia:radiology:source:pubmed:28992817:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:report-sequence-identity:evidence:28992817:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:routine-ecv-reasonable:revision:2 | ["noxia:radiology:source:pubmed:28992817:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:routine-ecv-reasonable:evidence:28992817:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:sasha-is-saturation-recovery:revision:2 | ["noxia:radiology:source:pubmed:23881866:revision:2","noxia:radiology:source:pubmed:28992817:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:sasha-is-saturation-recovery:evidence:23881866:supports:1:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:sasha-is-saturation-recovery:evidence:28992817:mentions:2:p4r:1"] | AUTOMATED_REVIEW_QUALIFIED | QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:sasha-more-accurate-head-to-head:revision:2 | ["noxia:radiology:source:pubmed:24387626:revision:2","noxia:radiology:source:pubmed:24702727:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:sasha-more-accurate-head-to-head:evidence:24387626:qualifies:2:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:sasha-more-accurate-head-to-head:evidence:24702727:supports:1:p4r:1"] | AUTOMATED_REVIEW_QUALIFIED | QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:saturation-recovery-precision-limitation:revision:2 | ["noxia:radiology:source:pubmed:24387626:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:saturation-recovery-precision-limitation:evidence:24387626:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:shmolli-nine-heartbeat:revision:2 | ["noxia:radiology:source:pubmed:21092095:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:shmolli-nine-heartbeat:evidence:21092095:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:synthetic-hct-3t-misclassification:revision:2 | ["noxia:radiology:source:pubmed:30089499:revision:2"] | 1 | ["noxia:radiology:scientific-assertion:ecv-t1:synthetic-hct-3t-misclassification:evidence:30089499:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:synthetic-hct-acceptable-agreement:revision:2 | ["noxia:radiology:source:pubmed:28980127:revision:2","noxia:radiology:source:pubmed:30089499:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:synthetic-hct-acceptable-agreement:evidence:28980127:supports:1:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:synthetic-hct-acceptable-agreement:evidence:30089499:refutes:2:p4r:1"] | AUTOMATED_REVIEW_CONTESTED | CONTESTED |
| noxia:radiology:scientific-assertion:ecv-t1:synthetic-hct-local-calibration:revision:2 | ["noxia:radiology:source:pubmed:28980127:revision:2","noxia:radiology:source:pubmed:30089499:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:synthetic-hct-local-calibration:evidence:28980127:supports:1:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:synthetic-hct-local-calibration:evidence:30089499:supports:2:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:t1mes-repeatability-system-dependent:revision:2 | ["noxia:radiology:source:pubmed:32375896:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:t1mes-repeatability-system-dependent:evidence:32375896:qualifies:2:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:t1mes-repeatability-system-dependent:evidence:32375896:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |
| noxia:radiology:scientific-assertion:ecv-t1:uniform-molli-intersite-reproducibility:revision:2 | ["noxia:radiology:source:pubmed:25384607:revision:2"] | 2 | ["noxia:radiology:scientific-assertion:ecv-t1:uniform-molli-intersite-reproducibility:evidence:25384607:qualifies:2:p4r:1","noxia:radiology:scientific-assertion:ecv-t1:uniform-molli-intersite-reproducibility:evidence:25384607:supports:1:p4r:1"] | AUTOMATED_REVIEW_PASSED | REVIEWED |

## 14. EvidenceLinks conservés

84 liens conservés avec leur historique de source et d’assertion.

## 15. EvidenceLinks reclassifiés

0 type de relation reclassifié ; 6 localisateurs recalculés après vérification des textes JACC.

| EvidenceLink | Type avant | Type après | Justification | Statut |
| --- | --- | --- | --- | --- |
| noxia:radiology:scientific-assertion:ecv-t1:accuracy-precision-distinct:evidence:24387626:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:blood-roi-excludes-papillary-trabeculae:evidence:32160925:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:ct-ecv-correlates-histology-aortic-stenosis:evidence:23878282:qualifies:2:p4r:1 | QUALIFIES | QUALIFIES | ABSTRACT_ONLY_SOURCE | AUTOMATED_REVIEW_QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:ct-ecv-correlates-histology-aortic-stenosis:evidence:23878282:supports:1:p4r:1 | SUPPORTS | SUPPORTS | ABSTRACT_ONLY_SOURCE | AUTOMATED_REVIEW_QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:ct-ecv-delayed-phase:evidence:37749293:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:ct-ecv-feasible-vs-mr-small-study:evidence:22771879:qualifies:2:p4r:1 | QUALIFIES | QUALIFIES | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:ct-ecv-feasible-vs-mr-small-study:evidence:22771879:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:ct-ecv-single-energy-formula:evidence:37749293:derives:1:p4r:1 | DERIVES | DERIVES | DERIVED_INTERPRETATION | AUTOMATED_REVIEW_QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:ct-evidence-quality-low:evidence:37269267:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:ct-mr-ecv-correlation-meta:evidence:37269267:qualifies:2:p4r:1 | QUALIFIES | QUALIFIES | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:ct-mr-ecv-correlation-meta:evidence:37269267:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:ct-spectral-formula-distinct:evidence:37749293:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:early-timing-improves-myocarditis-detection:evidence:31132211:refutes:1:p4r:1 | REFUTES | REFUTES | ABSTRACT_ONLY_SOURCE; REFUTING_EVIDENCE_REQUIRES_CONTEXT_COMPARISON | AUTOMATED_REVIEW_CONTESTED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-associated-functional-recovery-acute-mi:evidence:27771398:qualifies:2:p4r:1 | QUALIFIES | QUALIFIES | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-associated-functional-recovery-acute-mi:evidence:27771398:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-associated-troponin-myocarditis:evidence:27878700:qualifies:2:p4r:1 | QUALIFIES | QUALIFIES | ABSTRACT_ONLY_SOURCE; AUTHOR_INTERPRETATION | AUTOMATED_REVIEW_QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-associated-troponin-myocarditis:evidence:27878700:supports:1:p4r:1 | SUPPORTS | SUPPORTS | ABSTRACT_ONLY_SOURCE | AUTOMATED_REVIEW_QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-definition-delta-r1:evidence:22963517:supports:2:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-definition-delta-r1:evidence:24124732:derives:1:p4r:1 | DERIVES | DERIVES | DERIVED_INTERPRETATION | AUTOMATED_REVIEW_QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-method-dependent:evidence:24702727:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-no-field-difference-uniform-molli:evidence:25384607:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-prognostic-al-amyloidosis:evidence:25411195:qualifies:2:p4r:1 | QUALIFIES | QUALIFIES | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-prognostic-al-amyloidosis:evidence:25411195:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-reproducibility-no-difference-small-study:evidence:24702727:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-requires-four-t1-inputs:evidence:22963517:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-requires-hematocrit:evidence:22963517:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:ecv-requires-hematocrit:evidence:24124732:supports:2:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:field-and-site-specific-values:evidence:32089132:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:heart-rate-can-limit-mapping:evidence:23881866:qualifies:2:p4r:1 | QUALIFIES | QUALIFIES | ABSTRACT_ONLY_SOURCE | AUTOMATED_REVIEW_QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:heart-rate-can-limit-mapping:evidence:28992817:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:hematocrit-within-24-hours:evidence:32089132:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:inversion-recovery-underestimation:evidence:24387626:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:isolated-postcontrast-t1-insufficient:evidence:23553570:supports:1:p4r:1 | SUPPORTS | SUPPORTS | ABSTRACT_ONLY_SOURCE | AUTOMATED_REVIEW_QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:local-reference-ranges-required:evidence:28992817:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:mapping-amyloidosis-information:evidence:25411195:qualifies:2:p4r:1 | QUALIFIES | QUALIFIES | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:mapping-amyloidosis-information:evidence:28992817:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:mapping-myocarditis-information:evidence:28992817:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:mapping-myocarditis-information:evidence:30545455:qualifies:2:p4r:1 | QUALIFIES | QUALIFIES | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:mapping-supported-3t:evidence:21092095:supports:2:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:mapping-supported-3t:evidence:28992817:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:mapping-supported-field-strengths:evidence:21092095:supports:2:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:mapping-supported-field-strengths:evidence:28992817:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:mapping-useful-suspected-disease:evidence:28992817:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:messroghli-correction-lifecycle:evidence:29415744:corrects:1:p4r:1 | CORRECTS | CORRECTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:molli-is-inversion-recovery:evidence:15236377:supports:1:p4r:1 | SUPPORTS | SUPPORTS | ABSTRACT_ONLY_SOURCE | AUTOMATED_REVIEW_QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:molli-more-precise-head-to-head:evidence:24387626:qualifies:2:p4r:1 | QUALIFIES | QUALIFIES | AUTHOR_INTERPRETATION | AUTOMATED_REVIEW_QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:molli-more-precise-head-to-head:evidence:24702727:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:moon-position-historical:evidence:24124732:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:moon-position-historical:evidence:28992817:qualifies:2:p4r:1 | QUALIFIES | QUALIFIES | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:motion-registration-limitation:evidence:22963517:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:mr-ct-ecv-formulas-distinct:evidence:22963517:derives:1:p4r:1 | DERIVES | DERIVES | DERIVED_INTERPRETATION | AUTOMATED_REVIEW_QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:mr-ct-ecv-formulas-distinct:evidence:37749293:derives:2:p4r:1 | DERIVES | DERIVES | DERIVED_INTERPRETATION | AUTOMATED_REVIEW_QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:mr-ecv-correlates-histology:evidence:23553570:qualifies:2:p4r:1 | QUALIFIES | QUALIFIES | ABSTRACT_ONLY_SOURCE | AUTOMATED_REVIEW_QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:mr-ecv-correlates-histology:evidence:23553570:supports:1:p4r:1 | SUPPORTS | SUPPORTS | ABSTRACT_ONLY_SOURCE | AUTOMATED_REVIEW_QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:myocarditis-single-criterion-less-specific:evidence:30545455:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:myocarditis-t1-t2-combination:evidence:30545455:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:native-t1-associated-troponin-myocarditis:evidence:27878700:qualifies:2:p4r:1 | QUALIFIES | QUALIFIES | ABSTRACT_ONLY_SOURCE | AUTOMATED_REVIEW_QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:native-t1-associated-troponin-myocarditis:evidence:27878700:supports:1:p4r:1 | SUPPORTS | SUPPORTS | ABSTRACT_ONLY_SOURCE | AUTOMATED_REVIEW_QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:native-t1-higher-3t-uniform-molli:evidence:25384607:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:off-resonance-bias:evidence:24387626:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:partial-volume-limits-mapping:evidence:28992817:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:plos-correction-lifecycle:evidence:27579699:mentions:2:p4r:1 | MENTIONS | MENTIONS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:plos-correction-lifecycle:evidence:27902782:corrects:1:p4r:1 | CORRECTS | CORRECTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:protocol-ecv-postcontrast-window:evidence:32089132:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:protocol-ecv-postcontrast-window:evidence:32160925:qualifies:2:p4r:1 | QUALIFIES | QUALIFIES | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:recent-infarct-equilibrium-limitation:evidence:22963517:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:report-contrast-type-dose:evidence:28992817:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:report-sequence-identity:evidence:28992817:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:routine-ecv-reasonable:evidence:28992817:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:sasha-is-saturation-recovery:evidence:23881866:supports:1:p4r:1 | SUPPORTS | SUPPORTS | ABSTRACT_ONLY_SOURCE | AUTOMATED_REVIEW_QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:sasha-is-saturation-recovery:evidence:28992817:mentions:2:p4r:1 | MENTIONS | MENTIONS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:sasha-more-accurate-head-to-head:evidence:24387626:qualifies:2:p4r:1 | QUALIFIES | QUALIFIES | AUTHOR_INTERPRETATION | AUTOMATED_REVIEW_QUALIFIED |
| noxia:radiology:scientific-assertion:ecv-t1:sasha-more-accurate-head-to-head:evidence:24702727:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:saturation-recovery-precision-limitation:evidence:24387626:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:shmolli-nine-heartbeat:evidence:21092095:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:synthetic-hct-3t-misclassification:evidence:30089499:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:synthetic-hct-acceptable-agreement:evidence:28980127:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:synthetic-hct-acceptable-agreement:evidence:30089499:refutes:2:p4r:1 | REFUTES | REFUTES | REFUTING_EVIDENCE_REQUIRES_CONTEXT_COMPARISON | AUTOMATED_REVIEW_CONTESTED |
| noxia:radiology:scientific-assertion:ecv-t1:synthetic-hct-local-calibration:evidence:28980127:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:synthetic-hct-local-calibration:evidence:30089499:supports:2:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:t1mes-repeatability-system-dependent:evidence:32375896:qualifies:2:p4r:1 | QUALIFIES | QUALIFIES | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:t1mes-repeatability-system-dependent:evidence:32375896:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:uniform-molli-intersite-reproducibility:evidence:25384607:qualifies:2:p4r:1 | QUALIFIES | QUALIFIES | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |
| noxia:radiology:scientific-assertion:ecv-t1:uniform-molli-intersite-reproducibility:evidence:25384607:supports:1:p4r:1 | SUPPORTS | SUPPORTS | Relation and localized extraction remain compatible. | AUTOMATED_REVIEW_PASSED |

## 16. Contradictions requalifiées

| Contradiction | Classification initiale | Classification finale | Contextes | Décision |
| --- | --- | --- | --- | --- |
| noxia:radiology:contradiction:ecv-t1:synthetic-hematocrit-transferability:p4r | UNRESOLVED_CONTEXT_DEPENDENT | CONTEXT_DIFFERENCE | {"population":"Different derivation and validation cohorts","modality":"CMR in both sources","fieldStrength":"The adverse transferability result is explicitly limited to 3 T","method":"Locally derived synthetic-hematocrit models are not identical","center":"Both are single-center and do not demonstrate intersite transferability","endpoint":"Agreement in a local cohort versus clinically relevant classification error"} | PRESERVE_DIVERGENCE_WITH_CONTEXT |

## 17. Branche CT-ECV consolidée

- Branches : single-energy attenuation-change ECV, spectral iodine-density ECV.
- Inputs : pre-contrast attenuation, delayed attenuation, iodine density, hematocrit.
- Aucun effet constructeur ou logiciel n’est inféré.

## 18. Lacunes CT-ECV restantes

- Reproductibilité intersite : `NOT_DOCUMENTED_IN_SELECTED_CORPUS`.
- Reproductibilité interscanner générale : `NOT_ESTABLISHED_FOR_GENERAL_TRANSFERABILITY`.
- Trois sources complémentaires ont été examinées sans être ajoutées, car elles ne démontrent pas cette transférabilité.

## 19. Décisions ontologiques résolues

3 décisions résolues par un modèle multi-rôle sans modifier les classes historiques.

## 20. Décisions différées

3 décisions restent différées pour éviter d’enrichir LGE, MVO et l’hémorragie intramyocardique pendant P4R.

| Décision ontologique | Classe historique | Options | Décision | Portée |
| --- | --- | --- | --- | --- |
| noxia:radiology:sequence:t1-mapping | Sequence | ["MeasurementMethod","Sequence"] | MULTI_ROLE_MODEL | The historical sequence identity remains stable while the sourced measurement-method identity carries the metrological role. |
| noxia:radiology:biomarker:t1 | Biomarker | ["Observation","Biomarker"] | MULTI_ROLE_MODEL | The broad biomarker concept cannot replace distinct native, post-contrast, myocardial and blood observations. |
| noxia:radiology:biomarker:ecv | Biomarker | ["DerivedMeasurement","Biomarker"] | MULTI_ROLE_MODEL | The editorial biomarker and modality-specific derived measurements are complementary roles, not competing identities. |
| noxia:radiology:biomarker:lge-quantification | Biomarker | ["FindingOrEndpoint","Finding","Endpoint"] | DEFERRED_WITH_EXPLICIT_REASON | The ECV/T1 pilot does not localize sufficient LGE-specific evidence to select one role across all use cases. |
| noxia:radiology:biomarker:mvo | Biomarker | ["Finding"] | DEFERRED_WITH_EXPLICIT_REASON | MVO is outside P4R; changing its historical identity would constitute real enrichment of another domain. |
| noxia:radiology:biomarker:myocardial-hemorrhage | Biomarker | ["Finding"] | DEFERRED_WITH_EXPLICIT_REASON | Intramyocardial hemorrhage is outside P4R; changing its historical identity would constitute real enrichment of another domain. |

## 21. Invariants génériques

| Élément | Générique | Modalité-spécifique | Domaine-spécifique | Réutilisable |
| --- | --- | --- | --- | --- |
| stable-identity | true | false | false | measurement, standard, method, disease |
| versioned-revision | true | false | false | publication, assertion, concept, method |
| source-identity | true | false | false | journal, standard, guideline, documentation |
| source-revision | true | false | false | full-text, abstract, correction, standard |
| localized-extraction | true | false | false | narrative, numeric, method, limitation |
| atomic-assertion | true | false | false | association, method, compatibility, negative-result |
| evidence-link | true | false | false | primary-study, review, standard, guideline |
| applicability-context | true | false | false | MR, CT, ultrasound, informatics |
| measurement-definition | true | false | false | relaxometry, perfusion, diffusion, dose |
| measurement-method | true | false | false | imaging, segmentation, post-processing, laboratory |
| observation | true | false | false | quantitative, categorical, technical, clinical |
| derived-measurement | true | false | false | ratio, map, index, kinetic-model |
| metrology-semantics | true | false | false | phantom, reader, scanner, site |
| contradiction-classification | true | false | false | clinical, technical, standard, historical |
| structured-synthesis | true | false | false | state-of-knowledge, comparison, limitations, history |
| multidimensional-readiness | true | false | false | concept, synthesis, projection |
| automated-review | true | false | false | assertion, evidence, source, synthesis |
| publication-guards | true | false | false | fixture, projection, preview |
| mr-field-strength | false | true | false | MR |
| mr-relaxation-observations | false | true | false | MR |
| ct-attenuation-observations | false | true | false | CT |
| spectral-ct-iodine-density | false | true | false | SPECTRAL_CT |
| ecv-formula | false | false | true | ECV_T1_PILOT |
| hematocrit-input | false | false | true | ECV_T1_PILOT |
| cardiac-relaxometry-methods | false | false | true | ECV_T1_PILOT |
| post-contrast-equilibrium | false | false | true | ECV_T1_PILOT |
| myocardial-regions | false | false | true | CARDIAC_IMAGING |
| cardiac-pilot-diseases | false | false | true | CARDIAC_IMAGING |

## 22. Extensions propres à ECV/T1

Les formules ECV, l’hématocrite, MOLLI, ShMOLLI, SASHA et le timing post-contraste restent des extensions du pilote, jamais des prérequis génériques.

## 23. Tests de généricité

| Test de généricité | Domaine simulé | Contrat testé | Dépendance ECV/T1 détectée ? | Résultat |
| --- | --- | --- | --- | --- |
| fixture:noxia:scientific-generality:adc-diffusion | adc-diffusion | ["measurement-definition","derived-measurement","applicability-context"] | false | PASS |
| fixture:noxia:scientific-generality:tmax-perfusion | ct-perfusion | ["measurement-method","derived-measurement","metrology-semantics"] | false | PASS |
| fixture:noxia:scientific-generality:lge-multi-role | lge-mvo | ["stable-identity","applicability-context"] | false | PASS |
| fixture:noxia:scientific-generality:segmentation-method | ai-segmentation | ["measurement-method","localized-extraction"] | false | PASS |
| fixture:noxia:scientific-generality:dicom-standard | dicom-standard | ["source-revision","versioned-revision","atomic-assertion"] | false | PASS |
| fixture:noxia:scientific-generality:spectral-ct-technology | spectral-ct | ["stable-identity","applicability-context"] | false | PASS |
| fixture:noxia:scientific-generality:corrected-publication | document-lifecycle | ["source-identity","source-revision","versioned-revision"] | false | PASS |
| fixture:noxia:scientific-generality:contextual-contradiction | evidence-synthesis | ["evidence-link","contradiction-classification"] | false | PASS |
| fixture:noxia:scientific-generality:quantitative-hu | ct-perfusion | ["measurement-definition","observation","metrology-semantics"] | false | PASS |
| fixture:noxia:scientific-generality:concept-without-formula | quality-control | ["stable-identity","atomic-assertion"] | false | PASS |

## 24. Synthèses recalculées

| Synthèse | Sources full text | Sources abstract-only | Assertions | Confiance | Lacunes |
| --- | --- | --- | --- | --- | --- |
| ct-ecv | 4 | 1 | 8 | MODERATE | ["CT_ECV_INTERSITE_REPRODUCIBILITY_NOT_DOCUMENTED"] |
| ecv | 16 | 4 | 35 | CONTEXT_DEPENDENT | [] |
| ecv-1-5t-versus-3t | 2 | 0 | 2 | MODERATE | [] |
| ecv-mr-versus-ct | 2 | 0 | 1 | MODERATE | ["CT_ECV_INTERSITE_REPRODUCIBILITY_NOT_DOCUMENTED"] |
| ecv-myocardial-infarction | 2 | 0 | 2 | MODERATE | [] |
| ecv-myocarditis | 1 | 2 | 4 | CONTEXT_DEPENDENT | [] |
| intersite-reproducibility | 3 | 0 | 3 | MODERATE | [] |
| molli-versus-sasha | 2 | 0 | 4 | MODERATE | [] |
| native-t1-methods | 9 | 2 | 20 | MODERATE | [] |
| t1-technical-limitations | 4 | 1 | 9 | MODERATE | [] |

## 25. Readiness final

| Readiness | Avant | Après | Blocages | Justification |
| --- | --- | --- | --- | --- |
| catalogReady | {"concepts":42,"syntheses":10,"projections":12} | {"concepts":42,"syntheses":10,"projections":12} | ["MISSING_IDENTITY","MISSING_SOURCE"] | État calculé indépendamment des autres dimensions. |
| scientificReady | {"concepts":35,"syntheses":10,"projections":12} | {"concepts":35,"syntheses":10,"projections":12} | ["NO_ASSERTION","NO_EVIDENCE","AUTOMATED_REVIEW_REJECTED","AUTOMATED_REVIEW_INSUFFICIENT_SOURCE"] | État calculé indépendamment des autres dimensions. |
| provenanceReady | {"concepts":42,"syntheses":10,"projections":12} | {"concepts":42,"syntheses":10,"projections":12} | ["NO_SOURCE_REVISION","MISSING_LOCATOR"] | État calculé indépendamment des autres dimensions. |
| synthesisReady | {"concepts":31,"syntheses":10,"projections":12} | {"concepts":31,"syntheses":10,"projections":12} | ["EMPTY_SYNTHESIS","NON_DETERMINISTIC","UNLINKED_ASSERTION"] | État calculé indépendamment des autres dimensions. |
| editorialProjectionReady | {"concepts":0,"syntheses":0,"projections":0} | {"concepts":31,"syntheses":10,"projections":12} | ["SCIENTIFIC_BLOCKER","PROVENANCE_BLOCKER","SYNTHESIS_BLOCKER"] | La revue humaine reste un avertissement, pas le seul blocage ; cela n’autorise aucune publication. |
| seoReady | {"concepts":0,"syntheses":0,"projections":0} | {"concepts":0,"syntheses":0,"projections":0} | ["P4R_SEO_OUT_OF_SCOPE","NO_EDITORIAL_APPROVAL"] | État calculé indépendamment des autres dimensions. |
| publicPublicationReady | {"concepts":0,"syntheses":0,"projections":0} | {"concepts":0,"syntheses":0,"projections":0} | ["P4R_PUBLICATION_FORBIDDEN","NO_PUBLICATION_DECISION","NO_EDITORIAL_APPROVAL"] | État calculé indépendamment des autres dimensions. |

## 26. Protocole générique d’enrichissement

Le protocole versionné accepte un `domainId`, comporte 18 étapes et ne contient aucun concept ECV/T1.

## 27. Domaines prioritaires proposés

| Domaine futur | Valeur | Sources disponibles | Dimension nouvelle testée | Priorité |
| --- | --- | --- | --- | --- |
| adc-diffusion | High | High | Diffusion-derived measurement and b-value context | 1 |
| ct-perfusion | High | High | Dynamic acquisition, kinetic models and perfusion endpoints | 2 |
| dicom-standard | High | High | Versioned technical standards without biomarker assumptions | 3 |
| lge-mvo-intramyocardial-hemorrhage | High | High | Findings, endpoints and multi-role concepts | 4 |
| t2-mapping | High | High | Quantitative mapping with different confounders and units | 5 |
| spectral-photon-counting-ct | High | Moderate | Technology generations, material maps and equipment context | 6 |
| oef-cmro2 | Medium | Moderate | Physiological models with multiple derived inputs | 7 |
| ai-segmentation | High | High | Algorithms, evaluation metrics and external validation as documentary objects | 8 |

## 28. Tests ajoutés

84 tests P4R couvrent le snapshot, les sources, les extractions, les assertions, les preuves, l’ontologie, la généricité, la readiness et les gardes de publication.

## 29. Validations exécutées

| Validation | Résultat | Détail |
| --- | --- | --- |
| Knowledge Graph | PASS | validate:knowledge-graph |
| Assertions scientifiques | PASS | validate:scientific-assertions |
| Couche scientifique | PASS | validate:knowledge-graph-scientific |
| Provenance | PASS | validate:knowledge-graph-provenance |
| Compétence | PASS | validate:knowledge-graph-competency |
| Corpus P4 | PASS | validate:scientific-corpus |
| Readiness P4 | PASS | validate:scientific-readiness |
| Projections P4 | PASS | validate:scientific-projections |
| Sources P4R | PASS | 21 full text, 6 abstract-only |
| Extractions P4R | PASS | 84 EvidenceLinks, 6 localisateurs recalculés |
| Revue P4R | PASS | 42 passées, 14 qualifiées, 2 contestées |
| Généricité P4R | PASS | 18 contrats et 10 fixtures isolées |
| Tests | PASS | 294/294 |
| Typecheck | PASS | 0 erreur |
| Build | PASS | production Vite |
| Lint | PASS | 0 erreur, 7 avertissements historiques |
| git diff --check | PASS | aucune erreur d'espacement |

## 30. Fichiers créés

- `src/knowledge-graph/scientific-consolidation/bibliography.mjs`
- `src/knowledge-graph/scientific-consolidation/constants.mjs`
- `src/knowledge-graph/scientific-consolidation/contradictions.mjs`
- `src/knowledge-graph/scientific-consolidation/corpus.mjs`
- `src/knowledge-graph/scientific-consolidation/generality.mjs`
- `src/knowledge-graph/scientific-consolidation/ontology.mjs`
- `src/knowledge-graph/scientific-consolidation/report.mjs`
- `src/knowledge-graph/scientific-consolidation/review.mjs`
- `src/knowledge-graph/scientific-consolidation/scientific-consolidation.test.mjs`
- `src/knowledge-graph/scientific-consolidation/snapshot.mjs`
- `src/knowledge-graph/scientific-consolidation/sources.mjs`
- `src/knowledge-graph/scientific-consolidation/validate.mjs`
- `scripts/consolidate-scientific-corpus.mjs`
- `scripts/generate-p4r-scientific-consolidation-report.mjs`
- `scripts/validate-scientific-sources.mjs`
- `scripts/validate-scientific-extractions.mjs`
- `scripts/validate-scientific-review.mjs`
- `scripts/validate-scientific-generality.mjs`
- `scripts/report-scientific-consolidation.mjs`
- `scripts/report-scientific-gaps.mjs`
- `scripts/report-scientific-extension-plan.mjs`
- `docs/p4r-scientific-consolidation.md`
- `docs/p4r-scientific-consolidation-report.md`

## 31. Fichiers modifiés

- `package.json`
- `src/knowledge-graph/index.mjs`
- `src/knowledge-graph/scientific-model-schema.mjs`

## 32. Risques et lacunes restants

- Six publications remain limited to their PubMed structured abstract for assertion extraction.
- CT-ECV intersite reproducibility is not demonstrated by the selected corpus.
- Automated scientific review is traceable but is not human expert validation.
- Three non-pilot ontological decisions remain deferred to avoid cross-domain enrichment.
- No public or SEO readiness decision is made in P4R.

## Contrats préservés

| Contrat | Préservé ? | Test ou preuve | Remarque |
| --- | --- | --- | --- |
| 27 sources P4 | true | snapshot + revision history | 27 révisions 1 et 27 révisions 2 |
| 58 assertions P4 | true | registre de revue P4R | 42 passées, 14 qualifiées, 2 contestées |
| 84 EvidenceLinks P4 | true | matrice avant/après | 0 lien perdu |
| Fixtures hors corpus | true | 10 tests de généricité | namespace fixture: et realCorpus=false |
| Pages et routes publiques | true | protected-surface validator | aucune modification |
| SEO et sitemap | true | protected-surface validator | aucune modification |
| Viewers, PACS, Supabase | true | protected-surface validator | aucune modification |
| editorial-engine | true | dépôt externe propre | aucune modification |
| Aucune revue humaine fictive | true | scientificHumanReview=null | revue automatisée explicite |
| Aucune publication | true | 12 projections internes | route et canonical null, indexable=false |

## Métrologie générique

| Terme | Distinct de | Générique |
| --- | --- | --- |
| accuracy | ["precision"] | true |
| precision | ["accuracy"] | true |
| repeatability | ["reproducibility"] | true |
| reproducibility | ["repeatability"] | true |
| interreader reproducibility | ["intersite reproducibility","interscanner reproducibility"] | true |
| correlation | ["agreement"] | true |
| agreement | ["correlation"] | true |
| bias | ["error","biological variability"] | true |
| calibration | ["correlation"] | true |

## Décision

MÉTHODE SCIENTIFIQUE PILOTE CONSOLIDÉE — PASSER À L’EXTENSION MULTIDOMAINE
