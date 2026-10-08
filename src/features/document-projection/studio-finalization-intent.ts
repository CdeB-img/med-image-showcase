import { logicalDigest, stableStringify } from "../knowledge-engine/canonical.js";
import { assertFrozenScientificSources, resolveFrozenScientificSources,
  type FrozenScientificPreparationSources, type ScientificPreparationSourceSet } from "../scientific-thinking/preparation-source-set.js";
import { requireStudioScientificAssessment, type StudioScientificAssessment } from "../scientific-thinking/studio-contribution.js";
import { studioScientificRoute } from "../scientific-thinking/studio-runtime.js";
import type { ResearchProjectOwnerProjection } from "../research-project-construction/contribution-owner-boundary.js";
import type { WorkingDraftPreparation, ProjectPreparationCheckpoint } from "../protocol-designer/functional-reset/project-preparation-contract.js";
import { workingDraftInputDigest } from "../protocol-designer/functional-reset/continuous-project-build.js";
import type { StudioReconciliationPlan } from "./studio-reconciliation-contract.js";
import { assertWorkingRevision, type DocumentWorkingRevision } from "./working-revision.js";

export class StudioFinalizationIntentError extends Error {
  constructor(public readonly code: string, public readonly status = 409) { super(code); }
}
export const studioProjectBinding = (project: ResearchProjectOwnerProjection) => ({
  projectId: project.projectId, projectVersion: project.versionId, projectDigest: project.projectDigest,
});
export type StudioFinalizationFrozenInput = Readonly<{
  workingRevisionId: string; workingRevisionSaveSequence: number; workingRevisionContentDigest: string;
  logicalDocumentRef: string; baseGenerationId: string; baseGenerationBodyDigest: string;
  baseProject: DocumentWorkingRevision["project"];
  sourceProject: DocumentWorkingRevision["project"];
  scientificSources: FrozenScientificPreparationSources;
  preparationContext: Readonly<{
    // Real source bindings only. Native meaning is in scientificSources, not a
    // reconstructed transcript. Checkpoint creation verifies this exact prefix.
    conversation: readonly { turnId: string; digest: string }[];
    previousDraft: ProjectPreparationCheckpoint["previousDraft"];
  }>;
}>;
export type StudioFinalizationIntent = Readonly<{
  contract: "STUDIO_FINALIZATION_INTENT_V1"; owner: "DOC";
  finalizationIntentId: string; intentDigest: string; frozen: StudioFinalizationFrozenInput;
  state: "FROZEN" | "WAITING_FOR_SCIENTIFIC_ASSESSMENT" | "SCIENTIFIC_PREPARATION_REQUIRED"
    | "WAITING_FOR_HUMAN_DECISION" | "READY_FOR_DOCUMENT_FINALIZATION" | "BLOCKED" | "CLOSED";
  sequence: number; createdAt: string; updatedAt: string;
  resolution: Readonly<{
    assessment: StudioScientificAssessment | null;
    sourceSet: ScientificPreparationSourceSet | null;
    preparation: WorkingDraftPreparation | null;
    humanDecision: StudioFinalizationHumanDecision | null;
    resolvedProject: DocumentWorkingRevision["project"] | null;
    adoptionReceipt: ResearchProjectOwnerProjection["confirmationDecision"] | null;
    reconciliationPlan: StudioReconciliationPlan | null;
    reason: string | null;
  }>;
}>;
export type StudioFinalizationHumanDecision = Readonly<{
  contract: "STUDIO_FINALIZATION_HUMAN_DECISION_V1"; origin: "STUDIO_FINALIZATION";
  actor: "HUMAN_USER"; actorRef: string; decisionRef: string; decisionDigest: string;
  finalizationIntentId: string; intentDigest: string;
  workingRevisionId: string; saveSequence: number; contentDigest: string;
  assessmentRef: string; scientificSourceSetDigest: string;
  preparationId: string; preparationRequestDigest: string; contributionDigest: string;
  sourceRefs: readonly string[]; scope: "EXACT_FROZEN_USER_CHANGES";
}>;
const same = (a: unknown, b: unknown) => stableStringify(a) === stableStringify(b);
const fail = (code: string): never => { throw new StudioFinalizationIntentError(code); };
export const assertStudioIntent = (intent: StudioFinalizationIntent) => {
  if (!intent || intent.contract !== "STUDIO_FINALIZATION_INTENT_V1" || intent.owner !== "DOC"
    || intent.intentDigest !== logicalDigest(intent.frozen)
    || intent.finalizationIntentId !== `studio-finalization-intent:${intent.intentDigest}`
    || !Number.isSafeInteger(intent.sequence) || intent.sequence < 1)
    fail("STUDIO_INTENT_INVALID");
  return intent;
};
export const assertStudioIntentSave = (intent: StudioFinalizationIntent, saved: DocumentWorkingRevision) => {
  assertStudioIntent(intent); const revision = assertWorkingRevision(saved), frozen = intent.frozen;
  if (revision.revisionId !== frozen.workingRevisionId || revision.saveSequence !== frozen.workingRevisionSaveSequence
    || revision.contentDigest !== frozen.workingRevisionContentDigest || revision.logicalDocumentRef !== frozen.logicalDocumentRef
    || revision.baseGenerationId !== frozen.baseGenerationId || revision.baseGenerationBodyDigest !== frozen.baseGenerationBodyDigest
    || !same(revision.project, frozen.baseProject)) fail("STUDIO_INTENT_SAVE_INVALID");
};
export const createStudioFinalizationIntent = (frozen: StudioFinalizationFrozenInput, saved: DocumentWorkingRevision,
  project: ResearchProjectOwnerProjection, now: string): StudioFinalizationIntent => {
  assertFrozenScientificSources(frozen.scientificSources, project);
  if (!same(frozen.sourceProject, studioProjectBinding(project))) fail("STUDIO_INTENT_PROJECT_INVALID");
  const request = frozen.scientificSources.request;
  if (request.workingRevisionId !== frozen.workingRevisionId || request.workingRevisionSaveSequence !== frozen.workingRevisionSaveSequence
    || request.workingRevisionContentDigest !== frozen.workingRevisionContentDigest || request.logicalDocumentRef !== frozen.logicalDocumentRef
    || request.baseGenerationId !== frozen.baseGenerationId || request.baseGenerationBodyDigest !== frozen.baseGenerationBodyDigest
    || !same(request.baseProject, frozen.baseProject)) fail("STUDIO_INTENT_SAVE_INVALID");
  const intentDigest = logicalDigest(frozen);
  const intent: StudioFinalizationIntent = { contract: "STUDIO_FINALIZATION_INTENT_V1", owner: "DOC", frozen: structuredClone(frozen),
    intentDigest, finalizationIntentId: `studio-finalization-intent:${intentDigest}`, sequence: 1, createdAt: now, updatedAt: now,
    state: "FROZEN", resolution: { assessment: null, sourceSet: null, preparation: null, humanDecision: null,
      resolvedProject: null, adoptionReceipt: null, reconciliationPlan: null, reason: null } };
  assertStudioIntentSave(intent, saved); return intent;
};
export const transitionStudioIntent = (intent: StudioFinalizationIntent, state: StudioFinalizationIntent["state"],
  resolution: StudioFinalizationIntent["resolution"], now: string): StudioFinalizationIntent => {
  assertStudioIntent(intent);
  if (intent.state === "CLOSED") fail("STUDIO_INTENT_CLOSED");
  if (same({ state, resolution }, { state: intent.state, resolution: intent.resolution })) return intent;
  return { ...intent, state, resolution: structuredClone(resolution), sequence: intent.sequence + 1, updatedAt: now };
};
export const assessStudioIntent = (intent: StudioFinalizationIntent, project: ResearchProjectOwnerProjection,
  assessment: StudioScientificAssessment, plan: StudioReconciliationPlan, now: string) => {
  assertStudioIntent(intent);
  if (!same(intent.frozen.sourceProject, studioProjectBinding(project))) fail("STUDIO_INTENT_PROJECT_STALE");
  const request = intent.frozen.scientificSources.request;
  const validated = requireStudioScientificAssessment(request, assessment);
  const { planDigest, ...material } = plan;
  if (planDigest !== logicalDigest(material) || plan.requestDigest !== request.requestDigest
    || plan.assessmentDigest !== validated.assessmentDigest || !same(plan.targetProject, intent.frozen.sourceProject))
    fail("STUDIO_INTENT_PLAN_INVALID");
  if (intent.resolution.assessment && !same(intent.resolution.assessment, assessment)) fail("STUDIO_INTENT_ASSESSMENT_DIVERGENCE");
  const route = studioScientificRoute({ request, assessment }, project);
  const sourceSet = route.action === "EXISTING_QRY_PATH" ? null
    : resolveFrozenScientificSources(intent.frozen.scientificSources, project, { request, assessment });
  const state = route.action === "EXISTING_QRY_PATH" ? "WAITING_FOR_HUMAN_DECISION"
    : route.workingDraftRequired ? "SCIENTIFIC_PREPARATION_REQUIRED"
      : plan.state === "READY" || plan.state === "NO_CHANGE" ? "READY_FOR_DOCUMENT_FINALIZATION" : "BLOCKED";
  return transitionStudioIntent(intent, state, { ...intent.resolution, assessment, sourceSet, reconciliationPlan: plan,
    resolvedProject: state === "READY_FOR_DOCUMENT_FINALIZATION" ? studioProjectBinding(project) : null,
    reason: route.action === "EXISTING_QRY_PATH" ? "EXISTING_QRY_PATH"
      : state === "BLOCKED" ? "DOCUMENTARY_RECONCILIATION_REQUIRED" : null }, now);
};
export const linkStudioIntentPreparation = (intent: StudioFinalizationIntent, preparation: WorkingDraftPreparation, now: string) => {
  assertStudioIntent(intent);
  const cp = preparation.checkpoint, resolution = intent.resolution;
  if (!resolution.assessment || !resolution.sourceSet || !cp
    || cp.requestDigest !== logicalDigest(cp.request) || !cp.request.studioPreparationSource
    || cp.inputDigest !== workingDraftInputDigest(cp.request) || cp.previousDraftDigest !== logicalDigest(cp.previousDraft)
    || cp.request.currentProject?.projectDigest !== intent.frozen.sourceProject.projectDigest
    || cp.request.studioPreparationSource.finalizationIntentId !== undefined && cp.request.studioPreparationSource.finalizationIntentId !== intent.finalizationIntentId
    || !same(cp.request.studioPreparationSource.request, intent.frozen.scientificSources.request)
    || !same(cp.request.studioPreparationSource.assessment, resolution.assessment)
    || !same(cp.request.scientificPreparationSourceSet, resolution.sourceSet)) fail("STUDIO_INTENT_PREPARATION_INVALID");
  if (preparation.status === "PREPARING" && preparation.result || preparation.decision !== "PENDING"
    || preparation.status === "READY_FOR_REVIEW" && (!preparation.result?.workingDraft.readyReview
      || preparation.result.workingDraft.inputDigest !== cp.inputDigest
      || preparation.result.composition.proposal.contextDigest !== cp.inputDigest)) fail("STUDIO_INTENT_PREPARATION_INVALID");
  // At most ONE existing checkpoint identity; interruption/failure does not
  // authorize another provider operation or silently reset the intent.
  if (resolution.preparation?.checkpoint?.requestDigest && resolution.preparation.checkpoint.requestDigest !== cp.requestDigest)
    fail("STUDIO_INTENT_PREPARATION_DIVERGENCE");
  const ready = preparation.status === "READY_FOR_REVIEW" && preparation.decision === "PENDING" && preparation.result;
  return transitionStudioIntent(intent, ready ? "WAITING_FOR_HUMAN_DECISION"
    : preparation.status === "PREPARING" ? "SCIENTIFIC_PREPARATION_REQUIRED" : "BLOCKED",
  { ...resolution, preparation, reason: ready ? null : preparation.code }, now);
};
export const createStudioIntentHumanDecision = (intent: StudioFinalizationIntent, actorRef: string,
  contributionDigest = intent.resolution.preparation?.result?.workingDraft.readyReview?.contribution.identity.contributionDigest): StudioFinalizationHumanDecision => {
  assertStudioIntent(intent);
  const { preparation, assessment, sourceSet } = intent.resolution;
  if (intent.state !== "WAITING_FOR_HUMAN_DECISION" || !preparation?.result || preparation.status !== "READY_FOR_REVIEW"
    || preparation.decision !== "PENDING" || !assessment || !sourceSet || !actorRef.trim() || !contributionDigest) fail("STUDIO_INTENT_HUMAN_DECISION_NOT_READY");
  const sources = sourceSet.sources.filter(source => source.status === "PENDING");
  // A residual UNKNOWN or model proposal is not a user confirmation. The
  // existing QRY/human owner must obtain an additional scoped decision.
  if (sources.some(source => source.origin !== "STUDIO" && !(source.origin === "CONVERSATION"
    && "epistemicState" in source.native && source.native.epistemicState === "USER_STATED"
    && "polarity" in source.native && source.native.polarity === "AFFIRMED"
    && "conditions" in source.native && source.native.conditions.length === 0))) fail("STUDIO_INTENT_ADDITIONAL_HUMAN_DECISION_REQUIRED");
  const material = { contract: "STUDIO_FINALIZATION_HUMAN_DECISION_V1" as const, origin: "STUDIO_FINALIZATION" as const,
    actor: "HUMAN_USER" as const, actorRef, finalizationIntentId: intent.finalizationIntentId, intentDigest: intent.intentDigest,
    workingRevisionId: intent.frozen.workingRevisionId, saveSequence: intent.frozen.workingRevisionSaveSequence,
    contentDigest: intent.frozen.workingRevisionContentDigest, assessmentRef: assessment.resultId,
    scientificSourceSetDigest: sourceSet.sourceSetDigest, preparationId: preparation.checkpoint!.preparationId,
    preparationRequestDigest: preparation.checkpoint!.requestDigest,
    contributionDigest,
    sourceRefs: sources.map(source => source.ref).sort(), scope: "EXACT_FROZEN_USER_CHANGES" as const };
  const decisionDigest = logicalDigest(material);
  return { ...material, decisionDigest, decisionRef: `studio-finalization-human-decision:${decisionDigest}` };
};
export const assertStudioIntentHumanDecision = (intent: StudioFinalizationIntent, decision: StudioFinalizationHumanDecision) => {
  if (!same(decision, createStudioIntentHumanDecision(intent, decision.actorRef, decision.contributionDigest))) fail("STUDIO_INTENT_HUMAN_DECISION_INVALID");
};
export const resolveStudioIntentAdoption = (intent: StudioFinalizationIntent, project: ResearchProjectOwnerProjection,
  decision: StudioFinalizationHumanDecision, now: string) => {
  if (intent.resolution.humanDecision) {
    if (!same(intent.resolution.humanDecision, decision) || !same(intent.resolution.resolvedProject, studioProjectBinding(project))
      || !same(intent.resolution.adoptionReceipt, project.confirmationDecision)) fail("STUDIO_INTENT_ADOPTION_BINDING_INVALID");
    return assertStudioIntent(intent);
  }
  assertStudioIntentHumanDecision(intent, decision);
  const receipt = project.confirmationDecision;
  if (project.projectId !== intent.frozen.sourceProject.projectId || project.previousVersionId !== intent.frozen.sourceProject.projectVersion
    || receipt.status !== "ADOPTED" || receipt.actor !== decision.actorRef
    || !receipt.provenance.includes(decision.decisionRef) || !receipt.provenance.includes(intent.finalizationIntentId)
    || !receipt.provenance.includes(decision.contributionDigest)) fail("STUDIO_INTENT_ADOPTION_BINDING_INVALID");
  // Scientific adoption satisfies the scientific gate. Existing editorial
  // collisions still prevent READY; they cannot be certified away by PRJ.
  const blocked = intent.resolution.reconciliationPlan?.edits.some(edit =>
    edit.action === "REQUIRES_RECONCILIATION" || edit.action === "REQUIRES_HUMAN_ARBITRATION" || edit.action === "REPLAY_EDITORIAL");
  return transitionStudioIntent(intent, blocked ? "BLOCKED" : "READY_FOR_DOCUMENT_FINALIZATION",
    { ...intent.resolution, humanDecision: decision, adoptionReceipt: receipt, resolvedProject: studioProjectBinding(project),
      reason: blocked ? "DOCUMENTARY_RECONCILIATION_REQUIRED" : null }, now);
};
export const resumeStudioIntent = (intent: StudioFinalizationIntent, currentProject: ResearchProjectOwnerProjection, now: string) => {
  assertStudioIntent(intent);
  const expected = intent.resolution.resolvedProject ?? intent.frozen.sourceProject;
  if (same(expected, studioProjectBinding(currentProject))) return intent;
  const blocked = transitionStudioIntent(intent, "BLOCKED", { ...intent.resolution, reason: "STUDIO_INTENT_PROJECT_STALE" }, now);
  return { ...blocked, sequence: intent.sequence };
};
