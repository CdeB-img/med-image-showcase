import { validationDigest } from "./canonical";
import type { ValidationDisposition, ValidationEvaluationLevel, ValidationInvariantReference, ValidationInvariantRegistry, ValidationPlane } from "./product-contracts";
import type { ValidationSeverity } from "./types";

export const VAL001_CHECKPOINT_IDS = {
  requestInterpretation: "VAL-REQUEST-INTERPRETATION-001",
  interpretationThinking: "VAL-INTERPRETATION-ST-001",
  thinkingObservationImaging: "VAL-ST-OBS-IMG-001",
  scientificStateProject: "VAL-SCIENTIFIC-STATE-PRJ-001",
  projectStudyData: "VAL-PRJ-STUDY-DATA-001",
  studyDataDataManagement: "VAL-STUDY-DATA-DM-001",
  scientificStateBiostatistics: "VAL-SCIENTIFIC-STATE-BIO-001",
  dataAnalysisTemplate: "VAL-DATA-ANALYSIS-TMP-001",
  templateDocument: "VAL-TMP-DOC-001",
  projectProductView: "VAL-PRJ-PRODUCT-VIEW-001",
} as const;

const CP = VAL001_CHECKPOINT_IDS;

type RefInput = {
  id: string;
  authority: string;
  owner: string;
  description: string;
  planes: ValidationPlane[];
  checkpoints: string[];
  level: ValidationEvaluationLevel;
  provider: string;
  severity?: ValidationSeverity;
  failure?: string | null;
  disposition?: ValidationDisposition;
  machine?: boolean;
  semantic?: boolean;
  human?: boolean;
};

const ref = (input: RefInput): ValidationInvariantReference => ({
  invariantId: input.id,
  version: null,
  sourceAuthority: input.authority,
  owner: input.owner,
  shortDescription: input.description,
  validationPlanes: input.planes,
  severityDefault: input.severity ?? "BLOCKING",
  applicableCheckpoints: input.checkpoints,
  machineEvaluable: input.machine ?? input.level === "DETERMINISTIC",
  semanticReviewEligible: input.semantic ?? input.level === "SEMANTIC_REVIEW",
  humanArbitrationEligible: input.human ?? input.level === "HUMAN_ARBITRATION",
  evaluationLevel: input.level,
  validatorProvider: input.provider,
  domainFailureClassRef: input.failure ?? input.id,
  defaultDisposition: input.disposition ?? (input.level === "HUMAN_ARBITRATION" ? "REQUIRE_HUMAN_DECISION" : input.level === "SEMANTIC_REVIEW" ? "REQUIRE_REVIEW" : "BLOCK_HANDOFF"),
});

const INVARIANTS: ValidationInvariantReference[] = [
  ref({ id: "AUDIT-D:RELATION_ENDPOINT_MISSING", authority: "SEM-AUDIT-D", owner: "SEM-AUDIT-D", description: "Relation endpoints remain present in the Contribution.", planes: ["STRUCTURAL", "PROVENANCE_LINEAGE"], checkpoints: [CP.requestInterpretation, CP.interpretationThinking], level: "DETERMINISTIC", provider: "SEM-AUDIT-D" }),
  ref({ id: "AUDIT-D:CRITICAL_NEGATION_LOST", authority: "SEM-AUDIT-D", owner: "SEM-AUDIT-D", description: "Explicit negation remains reconstructible.", planes: ["EPISTEMIC", "SEMANTIC_FIDELITY"], checkpoints: [CP.requestInterpretation, CP.interpretationThinking, CP.scientificStateProject], level: "SEMANTIC_REVIEW", provider: "SEM-AUDIT-D", semantic: true }),
  ref({ id: "AUDIT-D:CAUSALITY_ADDED_AGAINST_EXPLICIT_NEGATION", authority: "SEM-AUDIT-D", owner: "SEM-AUDIT-D", description: "Causality is not promoted against source polarity.", planes: ["EPISTEMIC", "SEMANTIC_FIDELITY"], checkpoints: [CP.requestInterpretation, CP.interpretationThinking, CP.scientificStateProject], level: "SEMANTIC_REVIEW", provider: "SEM-AUDIT-D" }),
  ref({ id: "AUDIT-D:CANDIDATE_PROMOTED_TO_PROJECT", authority: "SEM-AUDIT-D", owner: "SEM-AUDIT-D", description: "Runtime candidates remain distinct from Project adoption.", planes: ["EPISTEMIC", "DECISION", "OWNERSHIP"], checkpoints: [CP.requestInterpretation, CP.scientificStateProject], level: "DETERMINISTIC", provider: "SEM-AUDIT-D" }),
  ref({ id: "AUDIT-D:LOCAL_PRACTICE_PROMOTED_TO_PROJECT", authority: "SEM-AUDIT-D", owner: "SEM-AUDIT-D", description: "Local practice is not a Project decision.", planes: ["EPISTEMIC", "DECISION", "OWNERSHIP"], checkpoints: [CP.requestInterpretation, CP.scientificStateProject], level: "DETERMINISTIC", provider: "SEM-AUDIT-D" }),
  ref({ id: "AUDIT-D:REJECTED_OR_SUPERSEDED_STATE_ACTIVE", authority: "SEM-AUDIT-D", owner: "SEM-AUDIT-D", description: "Rejected or superseded state stays inactive.", planes: ["EPISTEMIC", "IDENTITY_VERSION"], checkpoints: [CP.requestInterpretation, CP.interpretationThinking], level: "DETERMINISTIC", provider: "SEM-AUDIT-D" }),
  ref({ id: "AUDIT-D:REJECTED_RELATION_REMAINS_ACTIVE", authority: "SEM-AUDIT-D", owner: "SEM-AUDIT-D", description: "Rejected relations remain inactive.", planes: ["EPISTEMIC", "STRUCTURAL"], checkpoints: [CP.requestInterpretation, CP.interpretationThinking], level: "DETERMINISTIC", provider: "SEM-AUDIT-D" }),
  ref({ id: "AUDIT-D:RELATION_DIRECTION_INVERTED", authority: "SEM-AUDIT-D", owner: "SEM-AUDIT-D", description: "Relation direction remains traceable across corrections.", planes: ["STRUCTURAL", "SEMANTIC_FIDELITY"], checkpoints: [CP.requestInterpretation, CP.interpretationThinking], level: "SEMANTIC_REVIEW", provider: "SEM-AUDIT-D" }),
  ref({ id: "AUDIT-D:SELF_RELATION", authority: "SEM-AUDIT-D", owner: "SEM-AUDIT-D", description: "Self-relations remain diagnostically visible.", planes: ["STRUCTURAL"], checkpoints: [CP.requestInterpretation], level: "DETERMINISTIC", provider: "SEM-AUDIT-D", severity: "ERROR", disposition: "REQUIRE_REVIEW" }),
  ref({ id: "AUDIT-D:NEGATION_NOT_EXPLICITLY_REPRESENTED", authority: "SEM-AUDIT-D", owner: "SEM-AUDIT-D", description: "Negative polarity remains explicitly represented.", planes: ["EPISTEMIC", "SEMANTIC_FIDELITY"], checkpoints: [CP.requestInterpretation, CP.interpretationThinking], level: "SEMANTIC_REVIEW", provider: "SEM-AUDIT-D" }),
  ref({ id: "AUDIT-D:PRIMARY_CANDIDATE_PROMOTED_TO_ADOPTED_ENDPOINT", authority: "SEM-AUDIT-D", owner: "SEM-AUDIT-D", description: "A primary candidate is not adopted as an endpoint without Human Decision.", planes: ["EPISTEMIC", "DECISION", "OWNERSHIP"], checkpoints: [CP.requestInterpretation, CP.scientificStateProject], level: "DETERMINISTIC", provider: "SEM-AUDIT-D" }),
  ref({ id: "AUDIT-D:UNSUPPORTED_DECISION_INVENTION", authority: "SEM-AUDIT-D", owner: "SEM-AUDIT-D", description: "An adopted decision requires source support or Human Decision.", planes: ["DECISION", "PROVENANCE_LINEAGE"], checkpoints: [CP.requestInterpretation, CP.scientificStateProject], level: "DETERMINISTIC", provider: "SEM-AUDIT-D" }),
  ref({ id: "AUDIT-D:EXPLICIT_SOURCE_NOT_GROUNDED", authority: "SEM-AUDIT-D", owner: "SEM-AUDIT-D", description: "Explicit claims retain exact source grounding.", planes: ["PROVENANCE_LINEAGE", "EPISTEMIC"], checkpoints: [CP.requestInterpretation, CP.interpretationThinking], level: "DETERMINISTIC", provider: "SEM-AUDIT-D" }),
  ref({ id: "VAL-C08", authority: "VAL-000 referencing PD-003/RDE", owner: "NOXIA_PRODUCT", description: "Domain ownership remains with the source owner.", planes: ["OWNERSHIP"], checkpoints: Object.values(CP), level: "DETERMINISTIC", provider: "VAL-000" }),

  ref({ id: "VAL-C09", authority: "PD-003/RDE-001", owner: "RESEARCH_PROJECT", description: "Research Project remains the project source of truth.", planes: ["OWNERSHIP", "PROJECTION"], checkpoints: [CP.scientificStateProject, CP.projectStudyData, CP.scientificStateBiostatistics, CP.dataAnalysisTemplate, CP.templateDocument, CP.projectProductView], level: "DETERMINISTIC", provider: "RESEARCH_PROJECT" }),
  ref({ id: "PROJECT:HUMAN_DECISION_REQUIRED", authority: "PD-003/PD-009", owner: "RESEARCH_PROJECT", description: "Engaging changes require an authorized Human Decision.", planes: ["DECISION"], checkpoints: [CP.scientificStateProject, CP.projectStudyData, CP.scientificStateBiostatistics, CP.projectProductView], level: "HUMAN_ARBITRATION", provider: "RESEARCH_PROJECT", human: true }),
  ref({ id: "PROJECT:VERSION_CONTINUITY", authority: "PD-003/PRJ-001", owner: "RESEARCH_PROJECT", description: "Project identity and versions remain continuous.", planes: ["IDENTITY_VERSION", "REPRODUCIBILITY"], checkpoints: [CP.scientificStateProject, CP.projectStudyData, CP.dataAnalysisTemplate, CP.projectProductView], level: "DETERMINISTIC", provider: "RESEARCH_PROJECT" }),
  ref({ id: "PROJECT:STALE_CONTRIBUTION_REJECTED", authority: "PRJ-001/DAI-001", owner: "RESEARCH_PROJECT", description: "Stale contributions cannot be adopted.", planes: ["IDENTITY_VERSION", "DECISION"], checkpoints: [CP.scientificStateProject, CP.projectStudyData, CP.studyDataDataManagement, CP.scientificStateBiostatistics], level: "DETERMINISTIC", provider: "RESEARCH_PROJECT", failure: "STALE_PLANNING_CONTRIBUTION" }),
  ref({ id: "PROJECT:ATOMIC_ADOPTION", authority: "PD-003/DAI-001", owner: "RESEARCH_PROJECT", description: "Adoption is versioned and reconstructible.", planes: ["DECISION", "PROVENANCE_LINEAGE", "REPRODUCIBILITY"], checkpoints: [CP.projectStudyData, CP.studyDataDataManagement, CP.scientificStateBiostatistics], level: "DETERMINISTIC", provider: "RESEARCH_PROJECT" }),
  ref({ id: "PROJECT:FROZEN_VERSION_IMMUTABLE", authority: "PD-003/PRJ-001", owner: "RESEARCH_PROJECT", description: "A frozen Project version is immutable.", planes: ["IDENTITY_VERSION", "DECISION"], checkpoints: [CP.projectStudyData, CP.scientificStateBiostatistics, CP.projectProductView], level: "DETERMINISTIC", provider: "RESEARCH_PROJECT", failure: "FROZEN_PROJECT_IMMUTABLE" }),

  ref({ id: "OBS:OBSERVABLE_PROPERTY_MEASUREMENT_DEFINITION_DISTINCT", authority: "OBS-001", owner: "OBS-001", description: "Observable property and measurement definition remain distinct.", planes: ["STRUCTURAL", "SEMANTIC_FIDELITY"], checkpoints: [CP.thinkingObservationImaging, CP.scientificStateProject, CP.scientificStateBiostatistics], level: "SEMANTIC_REVIEW", provider: "OBS-001" }),
  ref({ id: "OBS:MEASUREMENT_DEFINITION_OWNERSHIP", authority: "OBS-001", owner: "OBS-001", description: "Measurement-definition ownership remains explicit.", planes: ["OWNERSHIP", "PROVENANCE_LINEAGE"], checkpoints: [CP.thinkingObservationImaging, CP.scientificStateProject, CP.projectStudyData, CP.scientificStateBiostatistics], level: "DETERMINISTIC", provider: "OBS-001" }),
  ref({ id: "OBS:MEASURE_MEANING_PRESERVED", authority: "OBS-001", owner: "OBS-001", description: "Measurement meaning remains preserved across handoffs.", planes: ["SEMANTIC_FIDELITY"], checkpoints: [CP.thinkingObservationImaging, CP.scientificStateProject, CP.projectStudyData, CP.scientificStateBiostatistics], level: "SEMANTIC_REVIEW", provider: "OBS-001" }),
  ref({ id: "OBS:QUALITY_COMPARABILITY_PRESERVED", authority: "OBS-001", owner: "OBS-001", description: "Quality and comparability limitations remain visible.", planes: ["SEMANTIC_FIDELITY", "PROVENANCE_LINEAGE"], checkpoints: [CP.thinkingObservationImaging, CP.scientificStateProject], level: "SEMANTIC_REVIEW", provider: "OBS-001", severity: "ERROR", disposition: "REQUIRE_DOMAIN_OWNER" }),

  ref({ id: "CDM-C01", authority: "CDM-001", owner: "CDM-001", description: "CanonicalVariable identity remains stable.", planes: ["IDENTITY_VERSION", "PROVENANCE_LINEAGE"], checkpoints: [CP.projectStudyData, CP.studyDataDataManagement, CP.scientificStateBiostatistics, CP.dataAnalysisTemplate], level: "DETERMINISTIC", provider: "DAI-001/CDM-001" }),
  ref({ id: "CDM:EXPECTED_OCCURRENCE_DISTINCT", authority: "CDM-001", owner: "CDM-001", description: "Expected occasions remain distinct from realized occurrences.", planes: ["STRUCTURAL", "EPISTEMIC"], checkpoints: [CP.projectStudyData, CP.studyDataDataManagement, CP.scientificStateBiostatistics], level: "DETERMINISTIC", provider: "DAI-001/CDM-001" }),
  ref({ id: "CDM:FACTUAL_MISSINGNESS_PRESERVED", authority: "CDM-001", owner: "CDM-001", description: "Factual missingness remains source-owned.", planes: ["EPISTEMIC", "OWNERSHIP"], checkpoints: [CP.projectStudyData, CP.studyDataDataManagement, CP.scientificStateBiostatistics], level: "SEMANTIC_REVIEW", provider: "CDM-001" }),
  ref({ id: "CDM:PROVENANCE_LINEAGE_PRESERVED", authority: "CDM-001", owner: "CDM-001", description: "Variable provenance and lineage remain reconstructible.", planes: ["PROVENANCE_LINEAGE", "REPRODUCIBILITY"], checkpoints: [CP.projectStudyData, CP.studyDataDataManagement, CP.scientificStateBiostatistics, CP.dataAnalysisTemplate, CP.templateDocument], level: "DETERMINISTIC", provider: "DAI-001/CDM-001" }),

  ref({ id: "DM:PLANNED_REALIZED_DISTINCT", authority: "DM-001", owner: "DM-001", description: "Design-time plans remain distinct from realized operations.", planes: ["STRUCTURAL", "EPISTEMIC"], checkpoints: [CP.studyDataDataManagement, CP.scientificStateBiostatistics, CP.dataAnalysisTemplate], level: "DETERMINISTIC", provider: "DAI-001/DM-001" }),
  ref({ id: "DM:QUERY_CORRECTION_DISTINCT", authority: "DM-001", owner: "DM-001", description: "Query and correction remain separate concepts.", planes: ["STRUCTURAL", "SEMANTIC_FIDELITY"], checkpoints: [CP.studyDataDataManagement], level: "SEMANTIC_REVIEW", provider: "DM-001" }),
  ref({ id: "DM:NO_IMPUTATION_EXECUTION", authority: "DM-001/BIOSTATISTICS-001", owner: "DM-001", description: "Planning never executes imputation.", planes: ["STRUCTURAL", "OWNERSHIP"], checkpoints: [CP.studyDataDataManagement, CP.scientificStateBiostatistics], level: "DETERMINISTIC", provider: "DAI-001/DM-001" }),
  ref({ id: "DM:RELEASE_REQUIREMENT_IS_PROJECTION", authority: "DM-001", owner: "DM-001", description: "Release requirements remain design-time projections.", planes: ["PROJECTION", "EPISTEMIC"], checkpoints: [CP.studyDataDataManagement, CP.scientificStateBiostatistics, CP.dataAnalysisTemplate], level: "DETERMINISTIC", provider: "DAI-001/DM-001" }),
  ref({ id: "DM:NO_SCIENTIFIC_REDEFINITION", authority: "DM-001", owner: "DM-001", description: "Data Management does not redefine scientific meaning.", planes: ["OWNERSHIP", "SEMANTIC_FIDELITY"], checkpoints: [CP.studyDataDataManagement, CP.scientificStateBiostatistics], level: "SEMANTIC_REVIEW", provider: "DM-001" }),

  ref({ id: "BIO-C10", authority: "BIOSTATISTICS-001", owner: "BIOSTATISTICS-001", description: "Endpoint and estimand remain distinct.", planes: ["STRUCTURAL", "SEMANTIC_FIDELITY"], checkpoints: [CP.scientificStateBiostatistics, CP.dataAnalysisTemplate, CP.templateDocument], level: "SEMANTIC_REVIEW", provider: "DAI-001/BIOSTATISTICS-001", failure: "ENDPOINT_ESTIMAND_COLLAPSE" }),
  ref({ id: "BIO:ESTIMAND_MODEL_DISTINCT", authority: "BIOSTATISTICS-001", owner: "BIOSTATISTICS-001", description: "Estimand and statistical model remain distinct.", planes: ["STRUCTURAL", "SEMANTIC_FIDELITY"], checkpoints: [CP.scientificStateBiostatistics, CP.dataAnalysisTemplate], level: "SEMANTIC_REVIEW", provider: "DAI-001/BIOSTATISTICS-001", failure: "ESTIMAND_MODEL_COLLAPSE" }),
  ref({ id: "BIO:VARIABLE_ANALYTICAL_ROLE_DISTINCT", authority: "BIOSTATISTICS-001", owner: "BIOSTATISTICS-001", description: "Canonical variable and analytical role remain distinct.", planes: ["STRUCTURAL", "OWNERSHIP"], checkpoints: [CP.scientificStateBiostatistics, CP.dataAnalysisTemplate], level: "DETERMINISTIC", provider: "DAI-001/BIOSTATISTICS-001", failure: "ANALYSIS_COLUMN_PROMOTED_TO_CANONICAL_VARIABLE" }),
  ref({ id: "BIO:ANALYSIS_PROJECT_POPULATION_DISTINCT", authority: "BIOSTATISTICS-001", owner: "BIOSTATISTICS-001", description: "Analysis population does not mutate Project population.", planes: ["STRUCTURAL", "OWNERSHIP"], checkpoints: [CP.scientificStateBiostatistics], level: "DETERMINISTIC", provider: "DAI-001/BIOSTATISTICS-001", failure: "ANALYSIS_POPULATION_MUTATES_PROJECT_POPULATION" }),
  ref({ id: "BIO:FACTUAL_ANALYTICAL_MISSINGNESS_DISTINCT", authority: "BIOSTATISTICS-001", owner: "BIOSTATISTICS-001", description: "Factual missingness and analytical strategy remain distinct.", planes: ["EPISTEMIC", "OWNERSHIP", "SEMANTIC_FIDELITY"], checkpoints: [CP.scientificStateBiostatistics, CP.dataAnalysisTemplate], level: "SEMANTIC_REVIEW", provider: "DAI-001/BIOSTATISTICS-001", failure: "FACTUAL_MISSINGNESS_LOST" }),
  ref({ id: "BIO:SENSITIVITY_PRIMARY_DISTINCT", authority: "BIOSTATISTICS-001", owner: "BIOSTATISTICS-001", description: "Sensitivity analysis never replaces the primary analysis.", planes: ["STRUCTURAL", "EPISTEMIC"], checkpoints: [CP.scientificStateBiostatistics, CP.dataAnalysisTemplate], level: "DETERMINISTIC", provider: "DAI-001/BIOSTATISTICS-001", failure: "SENSITIVITY_REPLACES_PRIMARY" }),
  ref({ id: "BIO:POST_HOC_STATUS_PRESERVED", authority: "BIOSTATISTICS-001", owner: "BIOSTATISTICS-001", description: "Post-hoc status is never promoted to prespecified.", planes: ["EPISTEMIC", "SEMANTIC_FIDELITY"], checkpoints: [CP.scientificStateBiostatistics, CP.dataAnalysisTemplate, CP.templateDocument], level: "DETERMINISTIC", provider: "DAI-001/BIOSTATISTICS-001", failure: "POST_HOC_PROMOTED_TO_PRESPECIFIED" }),
  ref({ id: "BIO:NO_UNSOURCED_DIMENSIONING_ASSUMPTION", authority: "BIOSTATISTICS-001", owner: "BIOSTATISTICS-001", description: "Dimensioning assumptions require explicit sources.", planes: ["PROVENANCE_LINEAGE", "DECISION"], checkpoints: [CP.scientificStateBiostatistics, CP.dataAnalysisTemplate], level: "HUMAN_ARBITRATION", provider: "DAI-001/BIOSTATISTICS-001", failure: "UNSOURCED_SAMPLE_SIZE_ASSUMPTION", human: true }),

  ref({ id: "VAL-C12", authority: "TMP-001", owner: "TMP-001", description: "Template remains structural composition only.", planes: ["OWNERSHIP", "PROJECTION"], checkpoints: [CP.dataAnalysisTemplate, CP.templateDocument], level: "DETERMINISTIC", provider: "TMP-001" }),
  ref({ id: "VAL-C13", authority: "DOC-001", owner: "DOC-001", description: "Document remains a read-only projection.", planes: ["OWNERSHIP", "PROJECTION"], checkpoints: [CP.templateDocument], level: "DETERMINISTIC", provider: "DOC-001" }),
  ref({ id: "DOC:SOURCE_REFERENCES_PRESERVED", authority: "DOC-001/DOC-001B", owner: "DOC-001", description: "Projected content keeps its source references.", planes: ["PROVENANCE_LINEAGE", "PROJECTION"], checkpoints: [CP.templateDocument], level: "DETERMINISTIC", provider: "DOC-001" }),
  ref({ id: "DOC:NOT_GENERATABLE_PRESERVED", authority: "DOC-001/DAI-001", owner: "DOC-001", description: "NOT_GENERATABLE remains visible in projection.", planes: ["READINESS", "PROJECTION", "EPISTEMIC"], checkpoints: [CP.dataAnalysisTemplate, CP.templateDocument, CP.projectProductView], level: "DETERMINISTIC", provider: "DOC-001/DAI-001", failure: "BLOCKED_BYPASSED" }),
  ref({ id: "DOC:NO_WRITE_BACK", authority: "Editorial Engine Manifesto/DOC-001", owner: "DOC-001", description: "Projection never writes back to Project or Template.", planes: ["OWNERSHIP", "PROJECTION"], checkpoints: [CP.templateDocument, CP.projectProductView], level: "DETERMINISTIC", provider: "DOC-001" }),
];

export const VALIDATION_INVARIANT_REFERENCE_REGISTRY: ValidationInvariantRegistry = Object.freeze({
  registryId: "VAL-001-INVARIANT-REFERENCE-REGISTRY",
  version: "1.0.0",
  invariants: INVARIANTS.map((item) => Object.freeze({ ...item, validationPlanes: [...item.validationPlanes], applicableCheckpoints: [...item.applicableCheckpoints] })),
  digest: validationDigest(INVARIANTS),
  boundary: "REFERENCES_ONLY_DOMAIN_AUTHORITIES_REMAIN_OWNERS",
});

export const listValidationInvariantReferences = () => structuredClone(VALIDATION_INVARIANT_REFERENCE_REGISTRY.invariants);
export const getValidationInvariantReference = (invariantId: string) => VALIDATION_INVARIANT_REFERENCE_REGISTRY.invariants.find((item) => item.invariantId === invariantId) ?? null;
