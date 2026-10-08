import { logicalDigest, stableStringify } from "../knowledge-engine/canonical.js";
import type { ResearchProjectOwnerProjection } from "../research-project-construction/contribution-owner-boundary.js";
import { requireStudioScientificAssessment } from "../scientific-thinking/studio-contribution.js";
import { applyDrciHumanRevisionEntries, isDrciDraftPackCurrent, materializeDrciDraftPack,
  type DrciDraftPack, type DrciHumanRevisionEntry, type DrciDraftSource, prepareDrciDraftPack } from "./drci-draft-contract.js";
import { editableDrciDocumentContent } from "./working-revision.js";
import { studioNativeTextNodes, replayStudioEditorialPlan } from "./studio-reconciliation.js";
import { assertStudioIntent, studioProjectBinding, StudioFinalizationIntentError, type StudioFinalizationIntent } from "./studio-finalization-intent.js";

export const studioDocumentRequestId = (intent: StudioFinalizationIntent) => `studio-document:${assertStudioIntent(intent).intentDigest}`;
export const studioProviderRequestId = (intent: StudioFinalizationIntent) => `drci-draft:${intent.resolution.resolvedProject?.projectDigest}:studio:${intent.intentDigest}${intent.resolution.documentAttempt ? `:retry:${intent.resolution.documentAttempt}` : ""}`;
export const studioDocumentAdmissionMaterial = (intent: StudioFinalizationIntent) => stableStringify({
  intentDigest: intent.intentDigest, documentSource: intent.resolution.documentSource });
export const studioDocumentProviderRequest = (intent: StudioFinalizationIntent, project: ResearchProjectOwnerProjection,
  sessionId: string): import("../protocol-designer/product-bridge.js").ProductBridgeRequest => {
  if (!intent.resolution.documentSource || stableStringify(intent.resolution.resolvedProject) !== stableStringify(studioProjectBinding(project)))
    throw new StudioFinalizationIntentError("STUDIO_DOCUMENT_SOURCE_INVALID");
  return { apiVersion: "1.0.0", requestKind: "USER_TURN", conversation: { conversationId: `studio:${intent.intentDigest}`, language: "fr", turns: [] },
    currentProject: project, evaluatePersistentDelta: false, documentDraftRequest: intent.resolution.documentSource,
    documentFinalizationIntentId: intent.finalizationIntentId,
    observabilityContext: { sessionId, conversationId: null, turnId: null, clientRequestId: studioProviderRequestId(intent), testSessionId: null } };
};

/** DOC composes only owner-assessed edits. Scientific changes are already
 * adopted in PRJ; no semantic classifier, rewrite or Project writer is here. */
export const composeStudioFinalizationPack = (input: {
  intent: StudioFinalizationIntent; project: ResearchProjectOwnerProjection; target: DrciDraftPack;
  source: DrciDraftSource; ancestorPacks: readonly DrciDraftPack[];
}): DrciDraftPack | null => {
  const { intent, project, target, source } = input;
  assertStudioIntent(intent);
  if (!intent.resolution.assessment || !intent.resolution.resolvedProject
    || stableStringify(intent.resolution.resolvedProject) !== stableStringify(studioProjectBinding(project))
    || !isDrciDraftPackCurrent(target, project)
    || intent.state !== "READY_FOR_DOCUMENT_FINALIZATION" && !(intent.state === "BLOCKED"
      && intent.resolution.reason === "DOCUMENTARY_RECONCILIATION_REQUIRED"))
    throw new StudioFinalizationIntentError("STUDIO_DOCUMENT_NOT_READY");
  const request = intent.frozen.scientificSources.request;
  const { payload, assessmentDigest } = requireStudioScientificAssessment(request, intent.resolution.assessment);
  const plan = intent.resolution.reconciliationPlan;
  if (!plan) throw new StudioFinalizationIntentError("STUDIO_INTENT_PLAN_INVALID");
  const { planDigest, ...planMaterial } = plan;
  if (logicalDigest(planMaterial) !== planDigest || plan.requestDigest !== request.requestDigest
    || plan.assessmentDigest !== assessmentDigest)
    throw new StudioFinalizationIntentError("STUDIO_INTENT_PLAN_INVALID");
  if (payload.edits.some(edit => edit.classification === "AMBIGUOUS"))
    throw new StudioFinalizationIntentError("STUDIO_DOCUMENT_HUMAN_ARBITRATION_REQUIRED");
  const document = target.documents.find(doc => doc.kind === request.nativeDocumentRef);
  if (!document) throw new StudioFinalizationIntentError("STUDIO_DOCUMENT_NOT_FOUND");
  const content = editableDrciDocumentContent(request.logicalDocumentRef, document);
  const nodes = studioNativeTextNodes(content);
  const entries: DrciHumanRevisionEntry[] = [];
  const replay: typeof plan.edits[number][] = [];
  for (const edit of request.delta.filter(edit => edit.change !== "UNCHANGED")) {
    const assessment = payload.edits.find(item => item.editRef === edit.editRef);
    if (!assessment) throw new StudioFinalizationIntentError("STUDIO_DOCUMENT_ASSESSMENT_INCOMPLETE");
    const planned = plan.edits.find(item => item.source.editRef === edit.editRef);
    if (!planned || logicalDigest(planned.source) !== logicalDigest(edit)) throw new StudioFinalizationIntentError("STUDIO_INTENT_PLAN_INVALID");
    if (planned.action === "REQUIRES_HUMAN_ARBITRATION") throw new StudioFinalizationIntentError("STUDIO_DOCUMENT_HUMAN_ARBITRATION_REQUIRED");
    // Science is composed by DOC from the resolved PRJ, never blindly replayed.
    if (assessment.classification === "PROJECT_CHANGE" && assessment.projectCoverage?.coverage !== "COMPLETE") continue;
    const node = nodes.find(node => node.nodeId === edit.nodeId && node.nativeAnchor === edit.nativeAnchor);
    if (!node || logicalDigest(node.text) !== edit.beforeDigest || node.contextDigest !== edit.contextDigest)
      throw new StudioFinalizationIntentError("STUDIO_DOCUMENT_EDITORIAL_COLLISION");
    // Bounded reconciliation is only exact native-context reuse. The existing
    // replay owner remains responsible for applying and checking the text delta.
    replay.push({ ...planned, action: "REPLAY_EDITORIAL", targetAnchor: node.nativeAnchor, targetContextDigest: node.contextDigest });
    const sectionIndex = edit.field === "TITLE" ? null : document.sections.findIndex((_section, index) =>
      edit.nativeAnchor.startsWith(`documents/${document.kind}/sections/${index}/`));
    const paragraphIndex = edit.field === "BLOCK" ? Number(edit.nativeAnchor.split("/").at(-1)) : 0;
    entries.push({ document: document.kind, field: edit.field === "BLOCK" ? "PARAGRAPH" : edit.field,
      sectionIndex, section: sectionIndex === null ? "title" : document.sections[sectionIndex]?.title,
      index: paragraphIndex, originalText: edit.beforeText, revisedText: edit.afterText,
      originalDigest: edit.beforeDigest, revisedDigest: edit.afterDigest, revisionOrigin: "HUMAN_REVIEW",
      reason: `Native Studio assessment ${intent.resolution.assessment.resultId}; ${edit.editRef}`,
      projectBinding: target.project, documentPackBinding: target.packDigest });
  }
  const replayMaterial = { ...planMaterial, targetProject: studioProjectBinding(project), edits: replay };
  replayStudioEditorialPlan({ ...replayMaterial, planDigest: logicalDigest(replayMaterial) }, content);
  const packet = prepareDrciDraftPack(project, source);
  const unchangedProject = stableStringify(intent.frozen.baseProject) === stableStringify(studioProjectBinding(project));
  if (!entries.length && unchangedProject && request.delta.every(edit => edit.change === "UNCHANGED")) return null;
  if (!entries.length) {
    // Re-admit the exact generated pack; never substitute an old Project-only hit.
    const result = materializeDrciDraftPack({ documents: target.documents, crfRows: target.crfRows }, {
      project, packet, generatedAt: target.generatedAt, reusedProtocolEvidenceRef: target.reusedProtocolEvidenceRef,
      reusedScopeEvidenceRefs: target.reusedScopeEvidenceRefs, synopsisRevision: target.synopsisRevision });
    if (result.packDigest !== target.packDigest) throw new StudioFinalizationIntentError("STUDIO_DOCUMENT_TARGET_INVALID");
    return result;
  }
  const record = { kind: "HUMAN_DOCUMENT_REVISION" as const, scientificImpact: "DOCUMENT_ONLY" as const,
    reviewRef: studioDocumentRequestId(intent), createdAt: intent.createdAt, parentPackDigest: target.packDigest,
    projectBinding: target.project, evidenceDigest: logicalDigest(target.evidenceContent ?? null),
    ...(target.synopsisRevision ? { priorSynopsisRevision: target.synopsisRevision } : {}),
    ...(target.humanRevision ? { priorHumanRevision: target.humanRevision } : {}),
    entries: entries.sort((a, b) => Number(a.field !== "PARAGRAPH") - Number(b.field !== "PARAGRAPH")) };
  return materializeDrciDraftPack(applyDrciHumanRevisionEntries(target, record.entries), { project, packet, generatedAt: intent.createdAt,
    reusedProtocolEvidenceRef: target.reusedProtocolEvidenceRef, reusedScopeEvidenceRefs: target.reusedScopeEvidenceRefs,
    humanRevision: { parentPack: target, record, ancestorPacks: input.ancestorPacks } });
};
