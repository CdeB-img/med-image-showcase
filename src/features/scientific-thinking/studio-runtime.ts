import { z } from "zod/v4";
import { logicalDigest, stableStringify } from "../knowledge-engine/canonical.js";
import { buildProjectContextSnapshot } from "../research-project-construction/canonical-project-backbone.js";
import type { ResearchProjectOwnerProjection } from "../research-project-construction/contribution-owner-boundary.js";
import { recordSpecializedOwnerResult } from "../research-project-construction/specialized-owner-handoff.js";
import { studioAssessmentPayloadSchema, StudioReconciliationError,
  type StudioReconciliationRequest, type StudioAssessmentPayload } from "../document-projection/studio-reconciliation-contract.js";
import { prepareStudioScientificHandoff, requireStudioScientificAssessment,
  type StudioScientificAssessment } from "./studio-contribution.js";

/** Native source variant of the existing scientific preparation, never a turn. */
export type StudioPreparationSource = Readonly<{
  request: StudioReconciliationRequest; assessment: StudioScientificAssessment;
  finalizationIntentId?: string;
}>;
export type StudioPreparationProvenance = Readonly<{
  origin: "STUDIO"; requestId: string; requestDigest: string; assessmentRef: string; assessmentDigest: string;
  workingRevisionId: string; saveSequence: number; contentDigest: string; logicalDocumentRef: string;
  baseGenerationId: string; baseGenerationBodyDigest: string;
  baseProject: StudioReconciliationRequest["baseProject"];
  currentProject: StudioReconciliationRequest["baseProject"];
  edits: StudioReconciliationRequest["delta"]; capturedAt: string;
  scientificSourceSet?: import("./preparation-source-set.js").ScientificPreparationSourceSet;
}>;

export const assertStudioScientificInput = (request: StudioReconciliationRequest, project: ResearchProjectOwnerProjection | null) => {
  if (!request || !project) throw new StudioReconciliationError("STUDIO_ASSESSMENT_BINDING_INVALID");
  const { requestId, requestDigest, ...material } = request;
  if (request.contract !== "STUDIO_RECONCILIATION_V1" || request.origin !== "STUDIO"
    || request.projectWriteAuthorized !== false || requestDigest !== logicalDigest(material)
    || requestId !== `studio-reconciliation:${requestDigest}`
    || stableStringify(request.currentProject) !== stableStringify(buildProjectContextSnapshot({ project })))
    throw new StudioReconciliationError("STUDIO_ASSESSMENT_BINDING_INVALID");
};

/** Provider packet on the existing ST transport. No lexical classifier. */
export const prepareStudioAssessmentRequest = (request: StudioReconciliationRequest, project: ResearchProjectOwnerProjection) => {
  assertStudioScientificInput(request, project);
  const handoff = prepareStudioScientificHandoff(request);
  const { $schema: _dialect, ...outputSchema } = z.toJSONSchema(studioAssessmentPayloadSchema, { target: "draft-7", io: "input" });
  return { context: stableStringify(handoff), outputSchema, outputSchemaName: "StudioScientificAssessment",
    instruction: `You are the existing Scientific Thinking owner assessing a native StudioScientificContribution, not a conversation. Assess every changed edit exactly once; copy requestDigest and editRef exactly. DOCUMENT_ONLY requires demonstrated unchanged scientific meaning in the exact Project context. PROJECT_CHANGE covers possible scientific impact, not adoption. COMPLETE projectCoverage requires the entire edited meaning already adopted in the supplied exact known Project versions; references alone do not prove coverage. PARTIAL/UNKNOWN never certify equivalence. AMBIGUOUS requires at least two materially incompatible interpretations and their distinct consequences; an ordinary unresolved operational detail is not blocking. Preserve unknowns, source provenance and user intent; no invented decisions, no Project writes. beforeText is historical context, afterText is user-authored Studio work, not a USER turn. scientificStateDisposition concerns pending governed conversation/preparation state, never raw transcript reconstruction. Pending refs/digests do not supply scientific meaning and cannot certify NO_NET_CHANGE; retain PENDING_HUMAN_CONFIRMATION when pending meaning has not been assessed. Return only the structured assessment, with no Project contribution or adoption.` };
};

/** Exact replay yields the same result identity; completion time is observation only. */
export const acceptStudioAssessment = (request: StudioReconciliationRequest, project: ResearchProjectOwnerProjection,
  raw: unknown, completedAt: string): StudioScientificAssessment => {
  assertStudioScientificInput(request, project);
  const payload = studioAssessmentPayloadSchema.parse(raw);
  const result = recordSpecializedOwnerResult({ request: prepareStudioScientificHandoff(request),
    resultId: `studio-assessment:${logicalDigest({ requestDigest: request.requestDigest, payload })}`,
    resultVersion: "1.0.0", completedAt, status: "COMPLETED", resultKind: "INFORMATIONAL_ONLY",
    nativePayloadType: "StudioScientificAssessment", nativePayloadVersion: "1.0.0", nativePayload: payload,
    provenance: ["STUDIO", request.requestId, request.workingRevisionId, request.workingRevisionContentDigest],
    humanDecisionRequired: payload.scientificStateDisposition !== "NO_NET_CHANGE"
      || payload.edits.some(edit => edit.classification === "AMBIGUOUS"
        || edit.classification === "PROJECT_CHANGE" && edit.projectCoverage?.coverage !== "COMPLETE") });
  requireStudioScientificAssessment(request, result);
  return result;
};

export const studioScientificRoute = (source: StudioPreparationSource, project: ResearchProjectOwnerProjection) => {
  assertStudioScientificInput(source.request, project);
  const { payload } = requireStudioScientificAssessment(source.request, source.assessment);
  if (payload.scientificStateDisposition === "AMBIGUOUS" || payload.edits.some(edit => edit.classification === "AMBIGUOUS"))
    return { action: "EXISTING_QRY_PATH" as const, edits: [], workingDraftRequired: false };
  const refs = new Set(payload.edits.filter(edit => edit.classification === "PROJECT_CHANGE"
    && edit.projectCoverage?.coverage !== "COMPLETE").map(edit => edit.editRef));
  const edits = source.request.delta.filter(edit => refs.has(edit.editRef));
  const pendingScience = payload.scientificStateDisposition === "PENDING_HUMAN_CONFIRMATION";
  return { action: edits.length || pendingScience ? "EXISTING_SCIENTIFIC_PREPARATION_PATH" as const : "PROJECT_REUSE" as const,
    edits, workingDraftRequired: edits.length > 0 || pendingScience };
};

export const studioPreparationProvenance = (source: StudioPreparationSource, project: ResearchProjectOwnerProjection,
  capturedAt: string): StudioPreparationProvenance => {
  const route = studioScientificRoute(source, project);
  if (!route.workingDraftRequired) throw new StudioReconciliationError("STUDIO_SCIENTIFIC_PREPARATION_NOT_REQUIRED");
  return { origin: "STUDIO", requestId: source.request.requestId, requestDigest: source.request.requestDigest,
    assessmentRef: source.assessment.resultId, assessmentDigest: logicalDigest(source.assessment),
    workingRevisionId: source.request.workingRevisionId, saveSequence: source.request.workingRevisionSaveSequence,
    contentDigest: source.request.workingRevisionContentDigest, logicalDocumentRef: source.request.logicalDocumentRef,
    baseGenerationId: source.request.baseGenerationId, baseGenerationBodyDigest: source.request.baseGenerationBodyDigest,
    baseProject: source.request.baseProject, currentProject: { projectId: project.projectId,
      projectVersion: project.versionId, projectDigest: project.projectDigest }, edits: route.edits, capturedAt };
};

export type StudioScientificOperation = Readonly<{
  operation: "STUDIO_SCIENTIFIC_ASSESSMENT"; apiVersion: "1.0.0";
  studioRequest: StudioReconciliationRequest; currentProject: ResearchProjectOwnerProjection | null;
  finalizationIntentId?: string;
  currentProjectRef?: { projectId: string; versionId: string; projectDigest: string };
  observabilityContext: import("../protocol-designer/provider-call-observability.js").ProviderCallObservationContext;
}>;
export const studioHasNoChanges = (request: StudioReconciliationRequest) => request.delta.every(edit => edit.change === "UNCHANGED")
  && request.scientificState.pendingTurnRef === null && request.scientificState.pendingPreparationId === null;
export const noChangeStudioAssessment = (request: StudioReconciliationRequest): StudioAssessmentPayload => ({
  requestDigest: request.requestDigest, scientificStateDisposition: "NO_NET_CHANGE", scientificStateReason: "Exact native no-op",
  scientificStateAmbiguity: null, edits: [] });
