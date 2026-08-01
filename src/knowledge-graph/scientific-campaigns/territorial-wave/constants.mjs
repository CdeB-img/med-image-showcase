export const P11_VERSION = "1.0.0";
export const P11_EXECUTED_AT = "2026-08-01T00:00:00.000Z";
export const P11_GIT_SHA = "e733d58041a7f6e1e979d52ae1dba424f6793fb9";
export const P11_ADAPTER_ID = "noxia:scientific-campaign-adapter:territorial-reviewed-package:v2";
export const P11_REVIEWER = "noxia-scientific-review-engine";
export const P11_MIN_CAMPAIGNS = 3;
export const P11_MAX_CAMPAIGNS = 5;

export const P11_CAMPAIGN_IDS = Object.freeze({
  "t2-mapping": "SCIENTIFIC-CAMPAIGN-20260801-002",
  "quality-control": "SCIENTIFIC-CAMPAIGN-20260801-003",
  "neuro-oncology": "SCIENTIFIC-CAMPAIGN-20260801-004",
  "oef-cmro2": "SCIENTIFIC-CAMPAIGN-20260801-005",
});

export const P11_SCIENTIFIC_GOALS = Object.freeze({
  "t2-mapping": Object.freeze([
    "DOCUMENT_MYOCARDIAL_T2_MAPPING_METHODS",
    "PRESERVE_FIELD_AND_SEQUENCE_LIMITATIONS",
    "DISTINGUISH_REPEATABILITY_FROM_REPRODUCIBILITY",
  ]),
  "quality-control": Object.freeze([
    "FORMALIZE_QUANTITATIVE_IMAGING_METROLOGY",
    "DISTINGUISH_BIAS_PRECISION_AGREEMENT_AND_CORRELATION",
    "PRESERVE_APPLICABILITY_AND_UNCERTAINTY_CONDITIONS",
  ]),
  "neuro-oncology": Object.freeze([
    "DOCUMENT_RANO_AND_STANDARDIZED_IMAGING_CONTEXTS",
    "QUALIFY_DSC_RCBV_TECHNICAL_DEPENDENCIES",
    "SEPARATE_RESPONSE_CRITERIA_FROM_ACQUISITION_METHODS",
  ]),
  "oef-cmro2": Object.freeze([
    "DOCUMENT_OEF_AND_CMRO2_MEASUREMENT_METHODS",
    "PRESERVE_PET_AND_MR_METHOD_DIFFERENCES",
    "DISTINGUISH_AGREEMENT_REPRODUCIBILITY_AND_SPATIAL_SCOPE",
  ]),
});

export const P11_PUBLICATION_GUARDS = Object.freeze({
  visibility: "INTERNAL_ONLY",
  targetPath: null,
  route: null,
  canonical: null,
  robots: null,
  indexable: false,
  inSitemap: false,
  rendered: false,
  publicNavigation: false,
  publicPublication: false,
});

