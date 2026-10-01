/** Exact identifier projection of the existing durable response. No scientific text.
 * These are ALL fields consumed by assertStudyProposalOptionBindings.
 * This replays the rejected binding, not downstream scientific owner validation. */
export const realStudyUpdateClosure = {
  operationId: "58364d47fe727e6e960fc68aa3e4ac35f51a04b11b313bfdfb9a9a227ed58fb7",
  responseDigest: "4cdb7044ac3490cf311075698b8fe511e17d8f6efd1973c6c62fe108702d6d8e",
  previousProposalId: "scientific-study-proposal:ke1-f5c083043dcc44e8",
  atomRefs: ["q_age_ecv", "obj_age_ecv", "model_ecv", "design_cross", "site_single", "pop_adults", "place_fr", "no_pay", "decades",
    "age_limits_open", "recruit_open", "elig_fib", "elig_dm", "elig_htn", "elig_smoke", "smoke_rule_open", "elig_cv", "cv_list_open",
    "dm_test_open", "htn_rule_open", "med_review", "med_list_open", "elig_mri_safety", "elig_contrast_safety", "v_age", "v_decade",
    "v_fib", "v_dm", "v_dm_lab", "v_htn", "v_bp_sys", "v_bp_dia", "v_cv", "v_med", "v_smoke", "v_sport", "v_sex",
    "sport_method_open", "mod_mri", "acq_ecv", "acq_five", "contrast_open", "v_t1_m_pre", "v_t1_m_post", "v_t1_b_pre", "v_t1_b_post",
    "v_hct", "hct_read_open", "v_ecv", "endpoint_ecv", "ecv_region_open", "visit_single", "blood_before_mri", "hct_timing_open",
    "v_mri_done", "v_adverse", "mri_abnormal_action", "v_mri_abnormal", "v_escalation", "anomaly_workflow_open"],
  arbitrations: [
    { ref: "arb_primary_analysis", selection: "ONE" as const, recommendedRefs: ["opt_linear"],
      options: [{ ref: "opt_linear", atomRefs: ["analysis_reg"] }, { ref: "opt_anova", atomRefs: ["analysis_anova"] }] },
    { ref: "arb_sampling", selection: "ONE" as const, recommendedRefs: [],
      options: [{ ref: "opt_quota", atomRefs: ["sample_quota"] }, { ref: "opt_flexible", atomRefs: ["sample_flexible"] }] },
  ],
};
