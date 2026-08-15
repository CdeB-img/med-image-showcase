import { executeResearchProjectConstruction } from "@/features/research-project-construction";
import { makeProjectInput } from "@/features/research-project-construction/__tests__/fixtures";
import {
  buildBiostatisticsPlanningContribution,
  buildDataAnalysisPlanningContext,
  buildDataManagementPlanningContribution,
  buildProjectDataAnalysisView,
  buildStudyDataPlanContribution,
} from "@/features/data-analysis-planning";
import type { ScientificInterpretationContributionEnvelope, ScientificContributionItem } from "@/features/scientific-interpretation/contracts";
import type { StudyTemplateInstance } from "@/features/study-template/types";
import type { DocumentProjection } from "@/features/document-projection/types";
import { validationDigest } from "../canonical";
import { VAL001_CHECKPOINT_IDS } from "../invariant-registry";
import { finalizeValidationArtifactSnapshot, finalizeValidationRun } from "../product-canonical";
import type {
  SemanticValidationReviewRequest,
  SemanticValidationReviewResult,
  ValidationArtifactReference,
  ValidationArtifactSnapshot,
  ValidationEvidence,
  ValidationHumanReviewRequest,
  ValidationProductFinding,
  ValidationRun,
  ValidationRunRequest,
} from "../product-contracts";

const epistemic = (sourceTurnIds: string[], patch: Partial<ScientificContributionItem["epistemicBoundary"]> = {}): ScientificContributionItem["epistemicBoundary"] => ({
  ownership: "SCIENTIFIC_INTERPRETATION",
  epistemicStatus: "USER_STATED",
  adoptionStatus: "CANDIDATE_NOT_ADOPTED",
  activeState: true,
  sourceTurnIds,
  sourceText: null,
  ...patch,
});

const item = (itemId: string, content: string, proposedType: string, patch: Partial<ScientificContributionItem> = {}): ScientificContributionItem => ({
  itemId,
  semanticIdentity: itemId,
  proposedType,
  content,
  polarity: "AFFIRMED",
  studyRole: null,
  confidence: null,
  epistemicBoundary: epistemic(["turn:user:1"]),
  ...patch,
});

export const FIXTURE_A_REQUEST = Object.freeze({
  requestId: "fixture-a-request",
  version: "1.0.0",
  text: "Étudier le marqueur sans supposer de causalité; la méthode reste inconnue.",
  language: "fr",
  provenanceRefs: ["turn:user:1"],
});

export const FIXTURE_A_INTERPRETATION = Object.freeze({
  contract: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE",
  contractNature: "RUNTIME_CONTRIBUTION_NOT_PD003_ROOT",
  identity: { contributionId: "fixture-a-contribution", contractVersion: "1.0.0", runtimeId: "fixture-runtime", runtimeVersion: "1.0.0", createdAt: "2026-08-15T00:00:00.000Z", contributionDigest: "fixture-a-digest" },
  source: { conversationId: "fixture-a-conversation", originalRequest: FIXTURE_A_REQUEST.text, turns: [{ turnId: "turn:user:1", role: "USER", content: FIXTURE_A_REQUEST.text }], sourceRefs: ["turn:user:1"], rawOutputRef: null, rawOutputDigest: null },
  runtimeEvidence: { provider: null, model: null, promptDigest: null, schemaDigest: null, configurationDigest: null, technicalStatus: "SYNTHETIC_VISIBLE_FIXTURE", parseStatus: "NOT_REQUIRED", validationErrors: [] },
  scientificContent: {
    normalizedUnderstanding: FIXTURE_A_REQUEST.text,
    routeProposal: null,
    explicitStatements: [item("fixture-a-explicit", "marqueur", "BIOMARKER")],
    candidateObjects: [item("fixture-a-candidate", "association à examiner", "SCIENTIFIC_CANDIDATE", { epistemicBoundary: epistemic(["turn:user:1"], { epistemicStatus: "INFERRED", adoptionStatus: "CANDIDATE_NOT_ADOPTED" }) })],
    candidateRelations: [],
    inferredContext: [],
    contextualCandidates: [],
    negationsAndConstraints: [item("fixture-a-negation", "aucune causalité supposée", "NEGATION", { polarity: "NEGATED" })],
    temporalElements: [],
    ambiguities: [],
    unknowns: [item("fixture-a-unknown", "méthode inconnue", "UNKNOWN", { epistemicBoundary: epistemic(["turn:user:1"], { epistemicStatus: "UNKNOWN" }) })],
    missingInformation: [],
    correctionsAndSupersessions: [],
    openDecisions: [],
    clarificationNeeds: [],
  },
  epistemicBoundary: { candidateIsAdopted: false, knowledgeSupportIsProjectDecision: false, projectOwnershipTransferred: false, humanDecisionEnvelopeRef: "fixture-b-human-decision" },
  mapping: [],
  audit: { deterministicFindings: [], semanticAuditFindings: [], unresolvedFindings: [] },
  decisionBoundary: { decisionRequired: true, decisionEnvelopeRef: "fixture-b-human-decision", permittedHumanDispositions: ["ACCEPT_WORKING_BASIS", "REJECT", "DEFER"], projectWriteAuthorized: false },
} satisfies ScientificInterpretationContributionEnvelope);

export const FIXTURE_B_PROJECT = executeResearchProjectConstruction(makeProjectInput({ outcomes: ["marqueur quantitatif"], timings: ["T0", "T1"] }));
export const FIXTURE_C_CONTEXT = buildDataAnalysisPlanningContext(FIXTURE_B_PROJECT);
export const FIXTURE_C_STUDY_DATA = buildStudyDataPlanContribution(FIXTURE_C_CONTEXT);
export const FIXTURE_D_DATA_MANAGEMENT = buildDataManagementPlanningContribution(FIXTURE_C_CONTEXT, FIXTURE_C_STUDY_DATA);
const fixtureAnalysisRequirement = FIXTURE_B_PROJECT.analysisRequirements[0];
export const FIXTURE_E_BIOSTATISTICS = buildBiostatisticsPlanningContribution(FIXTURE_C_CONTEXT, FIXTURE_C_STUDY_DATA, FIXTURE_D_DATA_MANAGEMENT, fixtureAnalysisRequirement ? {
  estimands: {
    [fixtureAnalysisRequirement.requirementId]: {
      endpointId: fixtureAnalysisRequirement.endpointIds[0] ?? "UNKNOWN_ENDPOINT",
      variableIds: [...fixtureAnalysisRequirement.variableIds],
      contrast: null,
      summaryMeasure: "UNKNOWN",
    },
  },
} : {});
export const FIXTURE_PROJECT_VIEW = buildProjectDataAnalysisView(FIXTURE_B_PROJECT);

export const FIXTURE_F_TEMPLATE = Object.freeze({
  contractVersion: "1.0.0",
  instanceId: "fixture-f-template",
  digest: "fixture-f-template-digest",
  inputRefs: { researchProjectId: FIXTURE_B_PROJECT.documentHandoff.projectId, researchProjectVersion: FIXTURE_B_PROJECT.candidateVersion.versionId, researchProjectDigest: FIXTURE_B_PROJECT.resultDigest, regulatoryResolutionId: "reg:fixture", regulatoryCorpusVersion: "1.0.0", regulatoryCorpusDigest: "reg:digest", documentaryCatalogId: "doc-catalog:fixture", documentaryCatalogVersion: "1.0.0", documentaryCatalogDigest: "catalog:digest" },
  nodes: [], relations: [], requirementMapping: [], patternMapping: [], unknowns: [], conflicts: [], humanDecisions: [],
  boundary: "LOGICAL_STRUCTURE_ONLY_NOT_A_DOCUMENT_NOT_A_PROTOCOL_NOT_A_DECISION",
  readinessGraph: { overall: "BLOCKED", nodes: [], digest: "readiness:digest" },
  provenance: [FIXTURE_B_PROJECT.resultId], limitations: [{ limitationId: "fixture-f-limit", reason: "Required scientific source is absent.", provenance: [FIXTURE_B_PROJECT.resultId] }],
} as unknown as StudyTemplateInstance);

export const FIXTURE_F_DOCUMENT = Object.freeze({
  contractVersion: "1.0.0",
  projectionId: "fixture-f-document",
  projectionDigest: "fixture-f-document-digest",
  projectionType: "PROTOCOL",
  source: { projectId: FIXTURE_B_PROJECT.documentHandoff.projectId, projectVersion: FIXTURE_B_PROJECT.candidateVersion.versionId, template: { templateInstanceId: FIXTURE_F_TEMPLATE.instanceId } },
  sections: [{ sectionId: "fixture-f-section", contentDigest: "fixture-f-content-digest", status: "NOT_GENERATABLE", projectObjectIds: [], templateNodeIds: [], requirementIds: [], patternIds: [], provenanceRefs: [FIXTURE_F_TEMPLATE.instanceId], templateStatus: "NOT_GENERATABLE" }],
  unknowns: ["required scientific source"], contradictions: [], humanDecisions: [], provenanceRefs: [FIXTURE_F_TEMPLATE.instanceId], limitations: ["Synthetic visible fixture."],
  boundary: "READ_ONLY_PROJECTION_NOT_PROJECT_TRUTH_NOT_CLINICAL_PROTOCOL",
} as unknown as DocumentProjection);

export const makeArtifactReference = (patch: Partial<ValidationArtifactReference> = {}): ValidationArtifactReference => ({
  artifactId: "fixture-reference",
  artifactType: "ORIGINAL_REQUEST",
  version: "1.0.0",
  owner: "USER",
  sourceOfTruth: true,
  contentDigest: "fixture-content-digest",
  schemaVersion: "1.0.0",
  projectId: null,
  projectVersion: null,
  contributionId: null,
  projectionId: null,
  provenanceRefs: ["fixture-source"],
  immutableForRun: true,
  ...patch,
});

export const makeSnapshot = (patch: Partial<Omit<ValidationArtifactSnapshot, "snapshotDigest">> = {}): ValidationArtifactSnapshot => finalizeValidationArtifactSnapshot({
  reference: makeArtifactReference(),
  artifactKind: "ORIGINAL_REQUEST",
  owner: "USER",
  semanticObjects: [{ objectId: "fixture-object", objectType: "ScientificObject", label: "objet", status: "KNOWN", owner: "USER", sourceRefs: ["fixture-source"], provenanceRefs: ["fixture-source"], semanticKey: "objet", polarity: null, role: null, attributes: {} }],
  relations: [], epistemicStates: [], decisions: [], unknowns: [], contradictions: [], limitations: [], provenance: ["fixture-source"], lineage: [], sourceReferences: ["fixture-source"],
  projectionOnly: true, validationProjectionOnly: true, sourceOfTruth: false, projectWriteAuthorized: false, metadata: {},
  ...patch,
});

export const FIXTURE_G_SEMANTIC_REVIEW: SemanticValidationReviewResult = {
  reviewId: "fixture-g-review", requestId: "fixture-g-request", status: "PENDING", invariantAssessments: [],
  semanticEquivalenceAssessments: [{ sourceRef: "fixture-g-composite", targetRef: "fixture-g-split", identityMatch: "DIFFERENT_ID", assessment: "PENDING", evidenceRefs: ["fixture-g-evidence"] }],
  detectedLosses: [], detectedAdditions: [], detectedPromotions: [], ambiguities: ["Two structures may preserve the same scientific obligation."], contradictions: [], evidence: [], confidenceKind: "NOT_ASSESSED", requiresHumanReview: false,
  limitations: ["Part 2 does not resolve semantic equivalence."], sourceMutationAuthorized: false, targetMutationAuthorized: false, autoFixAllowed: false, autoDecisionAllowed: false,
};

export const FIXTURE_H_HUMAN_REVIEW: ValidationHumanReviewRequest = {
  requestId: "fixture-h-review", validationRunId: "fixture-run", checkpointId: VAL001_CHECKPOINT_IDS.scientificStateProject, findingRefs: ["fixture-h-finding"], questionIntent: "Choose between two scientifically plausible mappings.", reason: "Deterministic evidence cannot arbitrate scientific intent.", alternatives: ["mapping-a", "mapping-b"], evidence: [], domainOwner: "RESEARCH_PROJECT", requiredMandate: "SCIENTIFIC_PROJECT_OWNER", blocking: true, limitations: ["No decision is simulated."], boundary: "REVIEW_REQUEST_NOT_HUMAN_DECISION_ENVELOPE",
};

export const makeEvidence = (): ValidationEvidence => ({
  evidenceId: "fixture-evidence", kind: "SOURCE_OBJECT", sourcePath: "semanticObjects[0]", targetPath: null, sourceObjectRef: "fixture-object", targetObjectRef: null, exactSourceSpan: null, relationRef: null, decisionRef: null, provenanceRef: "fixture-source", digest: "fixture-evidence-digest", auditFindingRef: null, domainValidatorResultRef: null, comparisonNote: null,
});

export const makeFinding = (patch: Partial<ValidationProductFinding> = {}): ValidationProductFinding => ({
  findingId: "fixture-finding", checkpointId: VAL001_CHECKPOINT_IDS.requestInterpretation, invariantRef: "VAL-C08", observationRefs: ["fixture-observation"], findingClass: "SYNTHETIC_FINDING", domainFailureClassRef: "VAL-C08", severity: "WARNING", disposition: "CONTINUE_WITH_WARNING", sourceArtifactRef: makeArtifactReference(), targetArtifactRef: makeArtifactReference({ artifactId: "fixture-target", artifactType: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION", owner: "SCIENTIFIC_INTERPRETATION", sourceOfTruth: false }), evidence: [makeEvidence()], owner: "VAL-000", reviewOwner: "SCIENTIFIC_INTERPRETATION", technicalStatus: "SUCCESS", semanticStatus: "FINDINGS_PRESENT", reviewRequired: false, humanDecisionRequired: false, blocking: false, limitations: [], provenance: ["fixture-source"], automaticCorrectionAllowed: false, autoDecisionAllowed: false,
  ...patch,
});

export const makeSemanticReviewRequest = (): SemanticValidationReviewRequest => ({
  requestId: "fixture-semantic-request", validationRunId: "fixture-run", checkpointRef: { checkpointId: VAL001_CHECKPOINT_IDS.requestInterpretation, version: "1.0.0" }, invariantRefs: ["VAL-C08"], sourceSnapshotRef: "fixture-source-snapshot", targetSnapshotRef: "fixture-target-snapshot", observationsNeedingReview: ["fixture-observation"], exactEvidenceRefs: ["fixture-evidence"], semanticQuestion: "Are the scientific obligations preserved?", requiredPreservations: ["explicit object"], forbiddenPromotions: ["candidate to Project"], responseSchemaVersion: "1.0.0", providerPolicy: "DISABLED_BY_DEFAULT", limitations: ["Contract only in Part 2."], sourceMutationAuthorized: false, targetMutationAuthorized: false, autoFixAllowed: false,
});

export const makeRunRequest = (patch: Partial<ValidationRunRequest> = {}): ValidationRunRequest => ({
  checkpointId: VAL001_CHECKPOINT_IDS.requestInterpretation,
  checkpointVersion: "1.0.0",
  sourceArtifact: makeArtifactReference(),
  targetArtifact: makeArtifactReference({ artifactId: "fixture-target", artifactType: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION", owner: "SCIENTIFIC_INTERPRETATION", sourceOfTruth: false }),
  requestedPlanes: ["STRUCTURAL", "SEMANTIC_FIDELITY"], requestedInvariantRefs: ["VAL-C08"], includeSemanticReview: false, includeHumanReviewPreparation: false, caller: "VAL-001-PART2-TEST", purpose: "CONTRACT_VALIDATION", dryRun: true, limitations: [], sourceMutationAuthorized: false, targetMutationAuthorized: false, projectWriteAuthorized: false, documentWriteAuthorized: false, autoFixAllowed: false, autoDecisionAllowed: false,
  ...patch,
});

export const makeRun = (patch: Partial<ValidationRun> = {}): ValidationRun => {
  const base = {
    validationRunId: "fixture-run", schemaVersion: "1.0.0", startedAt: "2026-08-15T00:00:00.000Z", completedAt: "2026-08-15T00:00:01.000Z", status: "COMPLETE", historicalValidationStatus: "VALID_WITH_WARNINGS", checkpointRef: { checkpointId: VAL001_CHECKPOINT_IDS.requestInterpretation, version: "1.0.0" }, sourceArtifactRef: makeArtifactReference(), targetArtifactRef: makeArtifactReference({ artifactId: "fixture-target", artifactType: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION", owner: "SCIENTIFIC_INTERPRETATION", sourceOfTruth: false }), invariantRefs: ["VAL-C08"], adapterVersions: [{ adapterId: "fixture-adapter", version: "1.0.0" }], validatorVersions: [{ validatorId: "fixture-validator", version: "1.0.0" }], semanticReviewPolicy: "DISABLED_BY_DEFAULT", humanReviewPolicy: "PREPARE_REQUEST_ONLY", canonicalizationVersion: "VAL001-CANONICAL-1.0.0", configurationDigest: "", observations: [], findings: [], evidenceRefs: [], deterministicResult: "COMPLETE", semanticReviewRequests: [], humanReviewRequests: [], technicalStatus: "SUCCESS", semanticStatus: "NO_FINDING", disposition: "CONTINUE", limitations: [], resultDigest: "", qualificationAuthority: "PD-011", sourceMutationAuthorized: false, targetMutationAuthorized: false, projectWriteAuthorized: false, documentWriteAuthorized: false, autoFixAllowed: false, autoDecisionAllowed: false, pd011QualificationClaimed: false, boundary: "DIAGNOSTIC_ONLY_NO_SOURCE_OR_TARGET_MUTATION",
  } satisfies ValidationRun;
  return finalizeValidationRun({ ...base, ...patch });
};

export const FIXTURE_DIGEST = validationDigest({ fixture: "VAL-001-Part-2", version: "1.0.0" });
