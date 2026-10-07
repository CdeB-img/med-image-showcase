import { logicalDigest } from "../knowledge-engine/canonical";
import { createSpecializedOwnerHandoffRequestFromSnapshot, type SpecializedOwnerResult } from "../research-project-construction/specialized-owner-handoff";
import { studioAssessmentPayloadSchema, StudioReconciliationError,
  type StudioAssessmentPayload, type StudioReconciliationRequest } from "../document-projection/studio-reconciliation-contract";

/** Reverse DOC contribution into the existing ST/SPINE ownership boundary.
 * No fabricated conversation, scientific classifier, transport or PRJ write. */
export const prepareStudioScientificHandoff = (request: StudioReconciliationRequest) =>
  createSpecializedOwnerHandoffRequestFromSnapshot({
    handoffId: `studio-scientific-handoff:${request.requestDigest}`, owner: "SCIENTIFIC_THINKING",
    capabilityId: "SCIENTIFIC_THINKING_PROPOSAL", purpose: "Assess exact native Studio delta without adopting it",
    sourceProject: request.currentProject, nativeInputType: "StudioScientificContribution", nativeInputVersion: "1.0.0",
    nativeInput: { origin: request.origin, requestId: request.requestId, requestDigest: request.requestDigest,
      logicalDocumentRef: request.logicalDocumentRef, baseGenerationId: request.baseGenerationId,
      baseGenerationBodyDigest: request.baseGenerationBodyDigest, baseProject: request.baseProject,
      scientificState: request.scientificState, edits: request.delta.filter(edit => edit.change !== "UNCHANGED") },
  });
export type StudioScientificHandoff = ReturnType<typeof prepareStudioScientificHandoff>;
export type StudioScientificAssessment = SpecializedOwnerResult<StudioAssessmentPayload>;
export type StudioScientificAssessmentPort = Readonly<{
  owner: "SCIENTIFIC_THINKING";
  assess(request: StudioScientificHandoff): Promise<StudioScientificAssessment>;
}>;

/** Bind an existing owner result, not a downstream semantic guess. Object refs
 * verify the binding of the ST coverage assertion; refs alone never assert it. */
export const requireStudioScientificAssessment = (request: StudioReconciliationRequest, result: StudioScientificAssessment) => {
  const handoff = prepareStudioScientificHandoff(request), snapshot = request.currentProject;
  const payload = studioAssessmentPayloadSchema.safeParse(result?.nativePayload);
  if (!result || result.owner !== handoff.owner || result.contract !== handoff.contract
    || result.contractVersion !== handoff.contractVersion || result.capabilityId !== handoff.capabilityId
    || result.handoffId !== handoff.handoffId || !result.resultId || !result.resultVersion
    || result.sourceProjectRef !== snapshot.sourceProjectRef || result.sourceProjectVersion !== snapshot.sourceProjectVersion
    || result.sourceProjectDigest !== snapshot.sourceProjectDigest || result.sourceSnapshotDigest !== snapshot.snapshotDigest
    || !["COMPLETED", "COMPLETED_WITH_LIMITATIONS"].includes(result.status)
    || result.resultKind !== "INFORMATIONAL_ONLY" || result.nativePayloadType !== "StudioScientificAssessment"
    || result.nativePayloadVersion !== "1.0.0" || result.projectContribution !== null
    || result.projectWriteAuthorized !== false || result.conversationalLlmExpertFallback !== "FORBIDDEN"
    || !payload.success || payload.data.requestDigest !== request.requestDigest)
    throw new StudioReconciliationError("STUDIO_ASSESSMENT_BINDING_INVALID");
  const edits = request.delta.filter(edit => edit.change !== "UNCHANGED");
  const ids = new Set(payload.data.edits.map(edit => edit.editRef));
  if (ids.size !== payload.data.edits.length || ids.size !== edits.length || edits.some(edit => !ids.has(edit.editRef)))
    throw new StudioReconciliationError("STUDIO_ASSESSMENT_COVERAGE_INVALID");
  const currentVersions = [...snapshot.objects, ...snapshot.relations, ...snapshot.temporalQualifications, ...snapshot.expectedVariableOccasions];
  const validAmbiguity = (value: StudioAssessmentPayload["scientificStateAmbiguity"]) => value
    && new Set(value.alternatives.map(option => option.interpretation)).size === value.alternatives.length
    && new Set(value.alternatives.map(option => option.consequence)).size === value.alternatives.length
    && value.materialProjectRefs.every(ref => currentVersions.some(item => item.stableId === ref || item.versionRef === ref));
  if (payload.data.scientificStateDisposition === "AMBIGUOUS"
    ? !validAmbiguity(payload.data.scientificStateAmbiguity) : payload.data.scientificStateAmbiguity !== null)
    throw new StudioReconciliationError("STUDIO_ASSESSMENT_AMBIGUITY_INVALID");
  for (const edit of payload.data.edits) {
    const source = edits.find(item => item.editRef === edit.editRef)!;
    if (!edit.provenanceRefs.every(ref => ref === source.editRef || source.provenanceRefs.includes(ref)))
      throw new StudioReconciliationError("STUDIO_ASSESSMENT_PROVENANCE_INVALID");
    if (edit.classification === "AMBIGUOUS" ? !validAmbiguity(edit.ambiguity) || edit.projectCoverage !== null : edit.ambiguity !== null)
      throw new StudioReconciliationError("STUDIO_ASSESSMENT_AMBIGUITY_INVALID");
    if (edit.classification !== "PROJECT_CHANGE" && edit.projectCoverage !== null)
      throw new StudioReconciliationError("STUDIO_ASSESSMENT_COVERAGE_INVALID");
    if (edit.projectCoverage && (new Set(edit.projectCoverage.projectVersionRefs).size !== edit.projectCoverage.projectVersionRefs.length
      || edit.projectCoverage.projectVersionRefs.some(ref => !currentVersions.some(object => object.versionRef === ref
        && (edit.projectCoverage!.coverage !== "COMPLETE" || object.decisionRefs.length > 0
          && (!("epistemicState" in object) || object.epistemicState === "KNOWN"))))))
      throw new StudioReconciliationError("STUDIO_ASSESSMENT_PROJECT_COVERAGE_INVALID");
  }
  return { payload: payload.data, assessmentRef: result.resultId, assessmentDigest: logicalDigest(result) };
};
