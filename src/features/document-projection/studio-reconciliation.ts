import { logicalDigest, stableStringify } from "../knowledge-engine/canonical";
import { buildProjectContextSnapshot } from "../research-project-construction/canonical-project-backbone";
import type { ResearchProjectOwnerProjection } from "../research-project-construction/contribution-owner-boundary";
import { prepareStudioScientificHandoff, requireStudioScientificAssessment,
  type StudioScientificAssessment, type StudioScientificAssessmentPort } from "../scientific-thinking/studio-contribution";
import { documentTextSha256, type DocumentArchiveClient } from "./generation-archive-client";
import type { DocumentGenerationBody, DocumentGenerationRef } from "./generation-persistence";
import { assertWorkingRevision, editableArchivedDocument, validateWorkingRevisionContent,
  type DocumentWorkingRevision, type EditableDocumentContent } from "./working-revision";
import { STUDIO_RECONCILIATION_CONTRACT, StudioReconciliationError,
  type StudioNativeDelta, type StudioReconciliationPlan, type StudioReconciliationRequest, type StudioScientificState } from "./studio-reconciliation-contract";

type ArchivedSource = { ref: DocumentGenerationRef; body: DocumentGenerationBody };
const cloneFrozen = <T>(value: T): T => {
  const freeze = (item: unknown) => { if (item && typeof item === "object") {
    Object.values(item).forEach(freeze); Object.freeze(item);
  } };
  const copy = structuredClone(value); freeze(copy); return copy;
};
const projectBinding = (request: StudioReconciliationRequest) => ({ projectId: request.currentProject.sourceProjectRef,
  projectVersion: request.currentProject.sourceProjectVersion, projectDigest: request.currentProject.sourceProjectDigest });
const nativeNodes = (content: EditableDocumentContent) => [
  { nodeId: "document-title", nativeAnchor: "title", field: "TITLE" as const, text: content.title,
    contextDigest: logicalDigest({ field: "TITLE", sections: content.sections.map(s => ({ id: s.nodeId, anchor: s.nativeAnchor })) }), provenanceRefs: [] as string[] },
  ...content.sections.flatMap(section => {
    const contextDigest = logicalDigest(section);
    return [{ nodeId: section.nodeId, nativeAnchor: `${section.nativeAnchor}/title`, field: "SECTION_HEADING" as const,
      text: section.title, contextDigest, provenanceRefs: section.provenanceRefs }, ...section.blocks.map(block => ({
      nodeId: block.nodeId, nativeAnchor: block.nativeAnchor, field: "BLOCK" as const,
      text: block.text, contextDigest, provenanceRefs: block.provenanceRefs,
    }))];
  }),
];
const verifySource = async (source: ArchivedSource) => {
  if (source.ref.persistenceState !== "COMMITTED"
    || source.ref.bodySha256 !== await documentTextSha256(JSON.stringify(source.body))
    || source.ref.bodyBytes !== new TextEncoder().encode(JSON.stringify(source.body)).byteLength)
    throw new StudioReconciliationError("STUDIO_NATIVE_SOURCE_INVALID");
};

/** All native node dispositions are represented; ADDED/REMOVED mean an empty
 * textual slot becoming nonempty/empty, never inserting/deleting protected nodes. */
export const deriveStudioNativeDelta = (base: EditableDocumentContent, saved: EditableDocumentContent): StudioNativeDelta[] => {
  validateWorkingRevisionContent(saved, base);
  const after = nativeNodes(saved);
  return nativeNodes(base).map((before, index) => {
    const next = after[index];
    const change = before.text === next.text ? "UNCHANGED" : !before.text ? "ADDED" : !next.text ? "REMOVED" : "MODIFIED";
    const material = { nodeId: before.nodeId, nativeAnchor: before.nativeAnchor, field: before.field,
      change, beforeText: before.text, afterText: next.text, beforeDigest: logicalDigest(before.text),
      afterDigest: logicalDigest(next.text), contextDigest: before.contextDigest, provenanceRefs: before.provenanceRefs };
    return { ...material, change, editRef: `studio-edit:${logicalDigest(material)}` };
  });
};

export const createStudioReconciliationRequest = async (input: { revision: DocumentWorkingRevision;
  source: ArchivedSource; projectionSource?: ArchivedSource; currentProject: ResearchProjectOwnerProjection;
  scientificState: StudioScientificState }): Promise<StudioReconciliationRequest> => {
  const revision = assertWorkingRevision(input.revision);
  if (revision.status !== "ACTIVE") throw new StudioReconciliationError("STUDIO_REVISION_NOT_ACTIVE");
  await verifySource(input.source);
  if (input.projectionSource) await verifySource(input.projectionSource);
  const base = editableArchivedDocument(input.source, revision.identitySource.nativeDocumentRef, input.projectionSource);
  if (revision.baseGenerationId !== input.source.ref.generationId || revision.baseGenerationBodyDigest !== input.source.ref.bodySha256
    || revision.logicalDocumentRef !== base.logicalDocumentRef || stableStringify(revision.identitySource) !== stableStringify(base.identitySource)
    || stableStringify(revision.project) !== stableStringify(base.project) || input.currentProject.projectId !== revision.project.projectId)
    throw new StudioReconciliationError("STUDIO_REVISION_BASE_INVALID");
  const material = { contract: STUDIO_RECONCILIATION_CONTRACT, origin: "STUDIO" as const,
    logicalDocumentRef: revision.logicalDocumentRef, nativeDocumentRef: revision.identitySource.nativeDocumentRef,
    workingRevisionId: revision.revisionId, workingRevisionSaveSequence: revision.saveSequence,
    workingRevisionContentDigest: revision.contentDigest, baseGenerationId: revision.baseGenerationId,
    baseGenerationBodyDigest: revision.baseGenerationBodyDigest, baseProject: revision.project,
    currentProject: buildProjectContextSnapshot({ project: input.currentProject }), scientificState: input.scientificState,
    delta: deriveStudioNativeDelta(base.content, revision.content), projectWriteAuthorized: false as const };
  const requestDigest = logicalDigest(material);
  return cloneFrozen({ ...material, requestDigest, requestId: `studio-reconciliation:${requestDigest}` });
};
export const readSavedStudioReconciliationRequest = async (input: { client: DocumentArchiveClient; revisionId: string;
  expectedSaveSequence: number; currentProject: ResearchProjectOwnerProjection; scientificState: StudioScientificState }) => {
  if (!input.client.workingRevisions) throw new StudioReconciliationError("STUDIO_REVISION_UNAVAILABLE");
  const { revision } = await input.client.workingRevisions.get(input.revisionId);
  if (revision.saveSequence !== input.expectedSaveSequence) throw new StudioReconciliationError("STUDIO_RECONCILIATION_STALE");
  const source = await input.client.body(revision.baseGenerationId);
  const projectionSource = source.body.native.family === "DRCI" ? await input.client.body(source.body.native.value.protocolProjectionId) : undefined;
  return createStudioReconciliationRequest({ ...input, revision, source, projectionSource });
};
export const assertStudioReconciliationCurrent = (request: StudioReconciliationRequest, revision: DocumentWorkingRevision,
  project: ResearchProjectOwnerProjection, scientificState: StudioScientificState) => {
  const { requestDigest, requestId, ...material } = request;
  const current = assertWorkingRevision(revision);
  if (request.contract !== STUDIO_RECONCILIATION_CONTRACT || requestDigest !== logicalDigest(material)
    || requestId !== `studio-reconciliation:${requestDigest}` || current.status !== "ACTIVE"
    || request.workingRevisionId !== current.revisionId || request.workingRevisionSaveSequence !== current.saveSequence
    || request.workingRevisionContentDigest !== current.contentDigest || request.baseGenerationId !== current.baseGenerationId
    || request.baseGenerationBodyDigest !== current.baseGenerationBodyDigest || request.logicalDocumentRef !== current.logicalDocumentRef
    || stableStringify(request.baseProject) !== stableStringify(current.project)
    || stableStringify(request.currentProject) !== stableStringify(buildProjectContextSnapshot({ project }))
    || stableStringify(request.scientificState) !== stableStringify(scientificState))
    throw new StudioReconciliationError("STUDIO_RECONCILIATION_STALE");
};

/** Planning only. A supplied owner assessment is required for every changed
 * node. This operation has no preparation, adoption, save, provider or commit port. */
export const buildStudioReconciliationPlan = async (input: { request: StudioReconciliationRequest;
  revision: DocumentWorkingRevision; currentProject: ResearchProjectOwnerProjection; scientificState: StudioScientificState;
  assessment?: StudioScientificAssessment; target?: ArchivedSource; targetProjection?: ArchivedSource }): Promise<StudioReconciliationPlan> => {
  const { request } = input;
  assertStudioReconciliationCurrent(request, input.revision, input.currentProject, input.scientificState);
  const changes = request.delta.filter(edit => edit.change !== "UNCHANGED");
  const required = changes.length > 0 || request.scientificState.pendingTurnRef !== null || request.scientificState.pendingPreparationId !== null;
  if (required && !input.assessment) throw new StudioReconciliationError("STUDIO_SCIENTIFIC_ASSESSMENT_REQUIRED");
  const assessment = input.assessment ? requireStudioScientificAssessment(request, input.assessment) : null;
  let targetNodes: ReturnType<typeof nativeNodes> = [];
  if (input.target) {
    await verifySource(input.target);
    if (input.targetProjection) await verifySource(input.targetProjection);
    const target = editableArchivedDocument(input.target, request.nativeDocumentRef, input.targetProjection);
    if (target.logicalDocumentRef !== request.logicalDocumentRef || stableStringify(target.project) !== stableStringify(projectBinding(request)))
      throw new StudioReconciliationError("STUDIO_TARGET_BINDING_INVALID");
    targetNodes = nativeNodes(target.content);
  }
  const edits: StudioReconciliationPlan["edits"] = changes.map(source => {
    const qualified = assessment!.payload.edits.find(edit => edit.editRef === source.editRef)!;
    const target = targetNodes.find(node => node.nativeAnchor === source.nativeAnchor && node.nodeId === source.nodeId);
    const replay = target && logicalDigest(target.text) === source.beforeDigest && target.contextDigest === source.contextDigest;
    return { source, action: qualified.classification === "AMBIGUOUS" ? "REQUIRES_HUMAN_ARBITRATION"
      : qualified.classification === "PROJECT_CHANGE" ? "SCIENTIFIC_CONTRIBUTION"
        : replay ? "REPLAY_EDITORIAL" : "REQUIRES_RECONCILIATION",
    assessmentRef: assessment!.assessmentRef, reason: qualified.reason,
    targetAnchor: replay ? target.nativeAnchor : null, targetContextDigest: replay ? target.contextDigest : null,
    ambiguity: qualified.ambiguity,
    projectCoverage: qualified.projectCoverage?.coverage ?? null };
  });
  const scientificEdits = edits.filter(edit => edit.action === "SCIENTIFIC_CONTRIBUTION" && edit.projectCoverage !== "COMPLETE");
  const pendingScience = assessment?.payload.scientificStateDisposition === "PENDING_HUMAN_CONFIRMATION";
  // Existing conversation checkpoint reuse is valid only for its native scope;
  // a new Studio contribution cannot pretend to be that chat source.
  const reusable = !scientificEdits.length && pendingScience ? request.scientificState.preparations.find(preparation =>
    preparation.valid && preparation.status === "READY_FOR_REVIEW" && preparation.decision === "PENDING"
      && preparation.resultDigest && request.scientificState.pendingTurnRef === null
      && preparation.preparationId === request.scientificState.pendingPreparationId
      && stableStringify(preparation.project) === stableStringify(projectBinding(request))) : null;
  const needsScience = scientificEdits.length > 0 || pendingScience;
  const sameProject = stableStringify(request.baseProject) === stableStringify(projectBinding(request));
  const state = edits.some(edit => edit.action === "REQUIRES_HUMAN_ARBITRATION")
    || assessment?.payload.scientificStateDisposition === "AMBIGUOUS" ? "NEEDS_HUMAN_ARBITRATION"
      : needsScience ? "SCIENTIFIC_PREPARATION_REQUIRED"
        : edits.some(edit => edit.action === "REQUIRES_RECONCILIATION") ? "REQUIRES_RECONCILIATION"
          : !changes.length && sameProject ? "NO_CHANGE" : "READY";
  const material = { contract: STUDIO_RECONCILIATION_CONTRACT, requestId: request.requestId, requestDigest: request.requestDigest,
    targetProject: projectBinding(request), assessmentRef: assessment?.assessmentRef ?? null, assessmentDigest: assessment?.assessmentDigest ?? null,
    scientificStateAmbiguity: assessment?.payload.scientificStateAmbiguity ?? null,
    state, edits, scientificContribution: scientificEdits.length ? { origin: "STUDIO" as const, requestId: request.requestId,
      assessmentRef: assessment!.assessmentRef, logicalDocumentRef: request.logicalDocumentRef, baseGenerationId: request.baseGenerationId,
      targetProject: projectBinding(request), edits: scientificEdits.map(edit => edit.source), projectWriteAuthorized: false as const } : null,
    scientificPreparation: { action: state === "NEEDS_HUMAN_ARBITRATION" || !needsScience ? "NONE" : reusable ? "REUSE_VALID_PREPARATION" : "EXISTING_SCIENTIFIC_PREPARATION_PATH",
      preparationId: state === "NEEDS_HUMAN_ARBITRATION" ? null : reusable?.preparationId ?? null,
      reason: state === "NEEDS_HUMAN_ARBITRATION" ? "Material incompatible interpretations must be clarified by the existing conversation/QRY owner first"
        : !needsScience ? "Current governed Project and scoped owner assessment cover the scientific state"
        : reusable ? "Exact native scientific checkpoint already covers the pending conversation source"
          : "A scientific contribution remains non-adopted; only the existing scientific preparation owner may materialize it" },
    packModel: "COMPLETE_PACK" as const, projectWriteAuthorized: false as const };
  return cloneFrozen({ ...material, planDigest: logicalDigest(material) }) as StudioReconciliationPlan;
};

/** A new editable copy only, never an archived-body mutation or a pack commit.
 * Every eligibility proof is rechecked against the entire unmodified target
 * before applying any text; multiple edits in one section do not invalidate
 * each other's baseline checks. Positional DRCI anchors are not merge IDs. */
export const replayStudioEditorialPlan = (plan: StudioReconciliationPlan, target: EditableDocumentContent): EditableDocumentContent => {
  const { planDigest, ...material } = plan;
  if (planDigest !== logicalDigest(material)) throw new StudioReconciliationError("STUDIO_FINALIZATION_PLAN_INVALID");
  const nodes = nativeNodes(target), replay = plan.edits.filter(edit => edit.action === "REPLAY_EDITORIAL");
  if (replay.some(edit => !nodes.some(node => node.nativeAnchor === edit.targetAnchor && node.nodeId === edit.source.nodeId
    && logicalDigest(node.text) === edit.source.beforeDigest && node.contextDigest === edit.targetContextDigest
    && node.contextDigest === edit.source.contextDigest)))
    throw new StudioReconciliationError("STUDIO_EDITORIAL_REPLAY_COLLISION");
  const copy = structuredClone(target);
  for (const edit of replay) {
    if (edit.source.field === "TITLE") copy.title = edit.source.afterText;
    else for (const section of copy.sections) {
      if (edit.source.field === "SECTION_HEADING" && section.nodeId === edit.source.nodeId) section.title = edit.source.afterText;
      for (const block of section.blocks) if (edit.source.field === "BLOCK" && block.nodeId === edit.source.nodeId) block.text = edit.source.afterText;
    }
  }
  return validateWorkingRevisionContent(copy, target);
};

export const assessSavedStudioRevision = async (input: Omit<Parameters<typeof buildStudioReconciliationPlan>[0], "assessment"> & {
  scientificThinking: StudioScientificAssessmentPort }) => {
  assertStudioReconciliationCurrent(input.request, input.revision, input.currentProject, input.scientificState);
  const required = input.request.delta.some(edit => edit.change !== "UNCHANGED")
    || input.scientificState.pendingTurnRef !== null || input.scientificState.pendingPreparationId !== null;
  if (input.scientificThinking.owner !== "SCIENTIFIC_THINKING") throw new StudioReconciliationError("STUDIO_ASSESSMENT_OWNER_INVALID");
  const assessment = required ? await input.scientificThinking.assess(prepareStudioScientificHandoff(input.request)) : undefined;
  return buildStudioReconciliationPlan({ ...input, assessment });
};
