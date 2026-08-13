export const SIMULATED_REVIEW_AT = "2026-08-13T20:24:00.000Z";

export const SIMULATED_REVIEW_ROLES = Object.freeze([
  {
    reviewerId: "REVIEWER_SIM_1",
    role: "SCIENTIFIC_DOMAIN_SPECIALIST",
    responsibility:
      "Scientific coherence, REQUIRED, PROHIBITED, OPTIONAL_RELEVANT, plausibility and domain ambiguities.",
  },
  {
    reviewerId: "REVIEWER_SIM_2",
    role: "METHODOLOGY_AND_OBS_SPECIALIST",
    responsibility:
      "Method versus measurement, phenomenon versus observable, timing, comparators, clarification and OBS boundaries.",
  },
  {
    reviewerId: "REVIEWER_SIM_3",
    role: "SEMANTIC_BENCHMARK_AND_GOVERNANCE_SPECIALIST",
    responsibility:
      "Epistemic status, ownership, semantic equivalence, parentage, contamination and SEM-002/SEM-003 governance.",
  },
]);

const opinion = (reviewerId, disposition, analysis, reservation = null) => ({
  reviewerId,
  disposition,
  analysis,
  reservation,
});

const calibration = ({
  caseId,
  scientific,
  methodological,
  governance,
  rationale,
  ambiguity = null,
  revision = null,
  disagreements = [],
}) => ({
  caseId,
  candidateSet: "CALIBRATION",
  roleOpinions: [
    opinion("REVIEWER_SIM_1", revision ? "SIMULATED_ACCEPT_WITH_REVISION" : "SIMULATED_ACCEPT", scientific),
    opinion("REVIEWER_SIM_2", revision ? "SIMULATED_ACCEPT_WITH_REVISION" : "SIMULATED_ACCEPT", methodological),
    opinion("REVIEWER_SIM_3", revision ? "SIMULATED_ACCEPT_WITH_REVISION" : "SIMULATED_ACCEPT", governance),
  ],
  disagreements,
  consensus: {
    status: "SIMULATED_EXPERT_CONSENSUS",
    rationale,
    decisions: {
      SCIENTIFIC_REFERENCE: revision ? "SIMULATED_ACCEPT_WITH_REVISION" : "SIMULATED_ACCEPT",
      ...(methodological ? { METHODOLOGICAL_REFERENCE: revision ? "SIMULATED_ACCEPT_WITH_REVISION" : "SIMULATED_ACCEPT" } : {}),
      ...(ambiguity ? { AMBIGUITY: ambiguity } : {}),
      PARENTAGE: "SIMULATED_PARENTAGE_CLEAR",
      CALIBRATION_ADMISSION: "SIMULATED_APPROVE_FOR_CALIBRATION",
    },
    referenceDisposition: "CALIBRATION_VISIBLE",
    referenceReviewBasis: "SIMULATED_PLURALISTIC_EXPERT_REVIEW",
    eligibleForFormalIndependentQualification: false,
    eligibleForBlindQualification: false,
    revision,
  },
});

const equivalence = ({ caseId, scientific, methodological, governance, rationale, disagreements = [] }) => ({
  caseId,
  candidateSet: "DEVELOPMENT",
  roleOpinions: [
    opinion("REVIEWER_SIM_1", "SIMULATED_SEMANTICALLY_EQUIVALENT", scientific),
    opinion("REVIEWER_SIM_2", "SIMULATED_SEMANTICALLY_EQUIVALENT", methodological),
    opinion("REVIEWER_SIM_3", "SIMULATED_SEMANTICALLY_EQUIVALENT", governance),
  ],
  disagreements,
  consensus: {
    status: "SIMULATED_EXPERT_CONSENSUS",
    rationale,
    decisions: {
      SEMANTIC_EQUIVALENCE: "SIMULATED_SEMANTICALLY_EQUIVALENT",
    },
    evaluatorUse: "DEVELOPMENT_ONLY",
    independentQualificationEvidence: false,
  },
});

export const SIMULATED_REVIEW_UNITS = Object.freeze([
  calibration({
    caseId: "SEM3-CAL-ATRIAL-FIBROSIS-ABLATION",
    scientific: "The scenario preserves atrial fibrosis, ablation and the deliberately open scientific role without creating an outcome.",
    methodological: "The competing predictive and response-assessment roles remain non-equivalent and require clarification before Project adoption.",
    governance: "Optional candidates remain non-user facts; parentage assistance reveals no source reuse and blind eligibility stays forbidden.",
    ambiguity: "SIMULATED_AMBIGUITY_CONFIRMED",
    rationale: "The reference is internally coherent and the unresolved role is intentionally represented rather than completed.",
  }),
  calibration({
    caseId: "SEM3-CAL-CARDIO-RHYTHM-REMODELING",
    scientific: "Rhythm, structural remodeling and their longitudinal association remain distinct scientific constructs.",
    methodological: "Timing and measurement ownership are preserved without treating a method as the measured phenomenon.",
    governance: "The envelope forbids causal promotion and Project adoption of contextual candidates; parentage is sufficiently distinct for development calibration.",
    rationale: "The reference separates phenomenon, observation and association with adequate prohibitions.",
  }),
  calibration({
    caseId: "SEM3-CAL-CONGENITAL-FLOW-ELLIPSIS",
    scientific: "The elliptical continuation remains anchored to congenital flow while the missing anatomical and measurement details stay unknown.",
    methodological: "The reference does not infer a specific observable or acquisition and correctly requests clarification only where decisionally useful.",
    governance: "Provenance across turns and ownership boundaries remain reconstructible; no Development source is reused.",
    rationale: "The multi-turn reference is stable because it preserves the ellipse without silently completing it.",
  }),
  calibration({
    caseId: "SEM3-CAL-CORTISOL-SAMPLING-SUMMARY",
    scientific: "The cortisol series and the desire for a quantitative summary are preserved without inventing a biological interpretation.",
    methodological: "Sampling times, summary choice and measurement definition remain separate, with the summary explicitly unresolved.",
    governance: "Candidate summaries are not promoted to user decisions and the case has no material parentage with visible examples.",
    rationale: "The reference is suitable for calibration of under-specification and method-versus-measurement handling.",
  }),
  calibration({
    caseId: "SEM3-CAL-MSK-INFLAMMATION-RESPONSE",
    scientific: "Inflammatory response, musculoskeletal context and longitudinal comparison remain explicit without unsupported treatment effect.",
    methodological: "The response construct and candidate observables remain separated; missing operational measures are visible.",
    governance: "Causal and adoption prohibitions are explicit, while parentage metadata does not indicate derivation.",
    rationale: "The envelope preserves the scientific response question while preventing unsupported measurement and causal promotion.",
  }),
  calibration({
    caseId: "SEM3-CAL-NEURODEGENERATION-PROGRESSION",
    scientific: "Progression is preserved as the scientific phenomenon and is not collapsed into a single imaging or clinical marker.",
    methodological: "Longitudinal timing and the distinction between progression and its observables are correctly represented.",
    governance: "Unknown marker choice and ownership remain open; the scenario is original relative to Development and legacy material.",
    rationale: "The reference is stable for testing phenomenon-versus-observable separation.",
  }),
  calibration({
    caseId: "SEM3-CAL-ORGANOID-LIVE-SIGNAL-MEASUREMENT",
    scientific: "Biological response, live signal and terminal histology are distinct, and the reference avoids claiming that signal directly measures proliferation.",
    methodological: "The pronoun correction, terminal timing and hypothesis-only relation models are methodologically evaluable without selecting a quantitative model.",
    governance: "The specialist relationship remains an explicit downstream unknown; this does not prevent calibration of semantic preservation and ownership boundaries.",
    rationale: "No unresolved biological assertion is required for the benchmark judgment; specialized model selection remains outside the reference.",
    disagreements: [
      {
        subject: "Need for an additional organoid specialist before development calibration",
        positions: {
          REVIEWER_SIM_1: "Useful for future scientific enrichment, but not required to judge the explicit semantic separations.",
          REVIEWER_SIM_2: "Not required because the relation model is deliberately unselected and non-promoted.",
          REVIEWER_SIM_3: "May remain a final-qualification limitation but does not block a simulated calibration reference.",
        },
        resolution: "Admit for development calibration only; preserve the specialist limitation and prohibit formal qualification use.",
      },
    ],
  }),
  calibration({
    caseId: "SEM3-CAL-OVARIAN-ULTRASOUND-AMBIGUITY",
    scientific: "The intended modality is ovarian ultrasound; MRI is an objective documentary error, while detection, characterization and follow-up remain the real ambiguity.",
    methodological: "Correcting the modality does not resolve the scientific-purpose alternatives or alter the expected clarification.",
    governance: "A bounded versioned correction with before/after digests is required; no other reference content may change.",
    ambiguity: "SIMULATED_AMBIGUITY_REVISED",
    revision: {
      revisionId: "SEM3B3-REV-OVARIAN-ULTRASOUND-1-0-1",
      previousVersion: "1.0.0",
      resultingVersion: "1.0.1",
      change: "Replace MRI with ovarian ultrasound in the ambiguity description only.",
    },
    rationale: "After the objective modality correction, the reference is coherent and retains all three admissible scientific-purpose interpretations.",
  }),
  calibration({
    caseId: "SEM3-CAL-PULMONARY-HEMODYNAMICS-FOLLOWUP",
    scientific: "Pulmonary hemodynamics and follow-up remain explicit without presuming a disease mechanism or endpoint hierarchy.",
    methodological: "Partial modality availability and follow-up timing remain reconstructible and do not become inclusion requirements.",
    governance: "The reference preserves conditionality, provenance and ownership; parentage is sufficiently distinct.",
    rationale: "The case is stable for calibration of timing, partial availability and non-promotion.",
  }),
  calibration({
    caseId: "SEM3-CAL-TRIAL-COMPARATOR-DECISION",
    scientific: "The six-month utilization outcome candidate is preserved while the comparator remains genuinely undecided.",
    methodological: "Contemporary usual care and a pre-deployment period imply different designs and temporal references and must remain open.",
    governance: "The benchmark permits data inventory to proceed but forbids adopting a comparator; parentage does not show reuse.",
    ambiguity: "SIMULATED_AMBIGUITY_CONFIRMED",
    rationale: "The reference correctly captures partial progress and a high-value clarification without choosing the comparative design.",
  }),
  equivalence({
    caseId: "SEM3-DEV-CT-FUNCTIONAL-ESTIMATE-ROLE",
    scientific: "Both candidates preserve the distinction between a CT-derived functional estimate, its role and the underlying phenomenon.",
    methodological: "The distributed representation changes topology but not method, measure, unknowns or admissible clarification.",
    governance: "Critical obligations, prohibitions, provenance and ownership consequences are identical.",
    rationale: "The structural difference is non-semantic for the complete obligation vector.",
  }),
  equivalence({
    caseId: "SEM3-DEV-OUTCOME-PRIORITY-CHANGE",
    scientific: "Both candidates retain the active outcome priority and the superseded historical priority.",
    methodological: "The correction chronology and downstream consequence are unchanged despite distributed nodes.",
    governance: "No historical state is reactivated and provenance remains reconstructible in both forms.",
    rationale: "Both representations encode the same corrected active state and history.",
  }),
  equivalence({
    caseId: "SEM3-DEV-PERICARDIAL-FAT-NONCAUSAL",
    scientific: "Both candidates preserve association without converting pericardial fat into a causal determinant.",
    methodological: "Observable and explanatory roles remain distinct and no endpoint or method is added.",
    governance: "The non-causal polarity, ownership and provenance vector is unchanged.",
    rationale: "The alternative structure preserves the same scientific and epistemic consequences.",
  }),
  equivalence({
    caseId: "SEM3-DEV-RETINAL-VASCULAR-OUTCOME-UNKNOWN",
    scientific: "Both candidates keep the retinal vascular outcome unresolved while preserving the explicit scientific context.",
    methodological: "Neither representation invents a measurement definition and both retain the same clarification need.",
    governance: "Unknown status and owner boundaries are identical; extra structure does not promote a candidate.",
    rationale: "The two forms are semantically equivalent across explicit, unknown and ownership obligations.",
  }),
  equivalence({
    caseId: "SEM3-DEV-VALVE-HEMODYNAMICS-MULTIMODAL",
    scientific: "Both candidates preserve valve hemodynamics, multimodal observations and their non-interchangeability.",
    methodological: "Modality-specific observations and temporal relations remain unchanged across topologies.",
    governance: "No modality is promoted to canonical truth and provenance remains reconstructible.",
    rationale: "The distributed representation has the same scientific consequences and ownership constraints.",
  }),
]);

export const SIMULATED_REVIEW_RECORD = Object.freeze({
  schemaVersion: "1.0.0",
  contractType: "SEM003B3_SIMULATED_PLURALISTIC_EXPERT_REVIEW_RECORD",
  reviewId: "SEM3B3-SIMULATED-PLURALISTIC-REVIEW-1",
  recordedAt: SIMULATED_REVIEW_AT,
  roles: SIMULATED_REVIEW_ROLES,
  reviewUnits: SIMULATED_REVIEW_UNITS,
  evidenceClass: "SIMULATED_EXPERT_REVIEW_EVIDENCE",
  simulatedExpertConsensus: true,
  realHumanReviewPerformed: false,
  pd011IndependentReferencePanelSatisfied: false,
  finalQualificationEligibility: false,
  blindEligibility: false,
  calibrationExecutionAuthorized: false,
  semExecutionAuthorized: false,
  status: "FINAL_FOR_DEVELOPMENT_CALIBRATION_REFERENCE_AUTHORING",
});
