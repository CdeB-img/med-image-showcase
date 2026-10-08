import type { DocumentArchiveClient } from "../../document-projection/generation-archive-client";
import type { DocumentWorkingRevision } from "../../document-projection/working-revision";
import type { StudioFinalizationIntent } from "../../document-projection/studio-finalization-intent";
import { StudioFinalizationIntentError } from "../../document-projection/studio-finalization-intent";
import { studioDocumentProviderRequest } from "../../document-projection/studio-finalization-document";
import { freezeStudioFinalizationWork, captureStudioIntentPreparation, restoreStudioIntentPreparation,
  prepareStudioIntentHumanDecision } from "./studio-finalization-lifecycle";
import { requestStudioScientificAssessment } from "../studio-scientific-client";
import { requestProtocolDesignerBridge } from "../product-bridge-client";
import type { FunctionalResetSession } from "./session";
import type { WorkingDraftPreparation } from "./project-preparation-contract";
import { authorizeResearchProjectDocumentHandoff } from "../../research-project-construction";
import { refreshFunctionalResetDocumentPortfolio } from "../../document-projection/functional-reset-boundary";
import { buildCanonicalCrfPackage } from "../../document-projection/study-deliverable-portfolio";
import { prepareDrciDraftSource } from "../../document-projection/drci-draft-contract";
import { freezeDocumentGeneration } from "../../document-projection/generation-exports";
import { documentTextSha256 } from "../../document-projection/document-text-sha256";
import { settleRetainedDiscussionAdoption } from "./contribution-discussion-retention";
import { consumeProjectPreparation } from "./project-preparation-lifecycle";

/** Publish only this native adoption, retaining contributions received while
 * its persistence was awaited, plus the owner's typed confirmation coverage. */
export const retainStudioAdoptionConcurrentWork = (adopted: FunctionalResetSession, before: FunctionalResetSession,
  latest: FunctionalResetSession): FunctionalResetSession => {
  if (!adopted.project || latest.sessionId !== before.sessionId || latest.project?.projectDigest !== before.project?.projectDigest)
    throw new Error("STUDIO_PROJECT_ADOPTION_CONFLICT");
  const retained = [...adopted.retainedContributionCandidates ?? [], ...latest.retainedContributionCandidates?.filter(candidate =>
    !before.retainedContributionCandidates?.some(old => old.candidateRef === candidate.candidateRef)) ?? []];
  const current = latest.scientificDiscussionRetention, owner = adopted.scientificDiscussionRetention;
  const retention = current ? { ...current,
    sourceCoverage: [...current.sourceCoverage, ...owner?.sourceCoverage.filter(source => !current.sourceCoverage.some(old => old.turnRef === source.turnRef)) ?? []],
    elements: [...current.elements, ...owner?.elements.filter(element => !current.elements.some(old => old.ref === element.ref)) ?? []] } : owner;
  return { ...adopted,
    runtimeTurns: [...adopted.runtimeTurns, ...latest.runtimeTurns.filter(turn => !before.runtimeTurns.some(old => old.turnId === turn.turnId))],
    entries: [...adopted.entries, ...latest.entries.filter(entry => !before.entries.some(old => old.entryId === entry.entryId))],
    retainedContributionCandidates: retained,
    scientificDiscussionRetention: settleRetainedDiscussionAdoption(retention, adopted.project, retained, adopted.studyProposal),
    pendingMixedUserTurnRef: latest.pendingMixedUserTurnRef !== before.pendingMixedUserTurnRef ? latest.pendingMixedUserTurnRef : adopted.pendingMixedUserTurnRef,
    sourceLibrary: latest.sourceLibrary, knowledgeOwnerLedger: latest.knowledgeOwnerLedger,
    validationRunLedger: latest.validationRunLedger,
    bridgeTraces: [...adopted.bridgeTraces, ...latest.bridgeTraces.filter(trace => !before.bridgeTraces.some(old => old.turnId === trace.turnId))],
  };
};

export type StudioFinalizationStage = "ASSESSMENT" | "SCIENCE" | "DOCUMENTS" | "ARCHIVE";
export type StudioFinalizationRuntime = {
  run(revision: DocumentWorkingRevision, progress: (stage: StudioFinalizationStage) => void, resumeOnly?: boolean): Promise<StudioFinalizationIntent | null>;
};
type Ports = {
  session(): FunctionalResetSession;
  publish(session: FunctionalResetSession): void;
  client(session: FunctionalResetSession): DocumentArchiveClient;
  prepare(captured: WorkingDraftPreparation): Promise<void>;
  adopt(intent: StudioFinalizationIntent): Promise<void>;
  clarify(intent: StudioFinalizationIntent): void;
  committed(intent: StudioFinalizationIntent): Promise<void>;
  assess?: typeof requestStudioScientificAssessment;
  generate?: typeof requestProtocolDesignerBridge;
};
/** Foreground continuation of a durable operation, not a closure-owned state
 * machine. Every awaited phase is recorded by its existing durable owner. */
export const createStudioFinalizationRuntime = (ports: Ports): StudioFinalizationRuntime => ({
  async run(revision, progress, resumeOnly = false) {
    let session = ports.session(), client = ports.client(session), owner = client.finalizationIntents;
    if (!owner || !session.project) throw new StudioFinalizationIntentError("STUDIO_INTENT_UNAVAILABLE", 503);
    let intent = await owner.recoverActive(revision.revisionId)
      ?? await owner.recoverForSave({ revisionId: revision.revisionId, saveSequence: revision.saveSequence, contentDigest: revision.contentDigest });
    // Opening Studio is observation only, including a previously started intent.
    // No assessment, checkpoint, adoption acknowledgement or archive commit here.
    if (resumeOnly) return intent;
    if (!intent) {
      const source = await client.body(revision.baseGenerationId);
      const projectionSource = source.body.native.family === "DRCI" ? await client.body(source.body.native.value.protocolProjectionId) : undefined;
      intent = await owner.create(await freezeStudioFinalizationWork({ session, revision, source, projectionSource }));
    }
    const publishCommitted = async (completed: StudioFinalizationIntent) => {
      try { await ports.committed(completed); }
      catch (error) {
        if (!completed.resolution.documentReceipt) throw error;
        // Exact archive receipt outranks transient client publication errors.
        const recovered = await owner!.get(completed.finalizationIntentId);
        if (!recovered.resolution.documentReceipt) throw error;
        await ports.committed(recovered).catch(() => undefined);
      }
    };
    if (intent.state === "CLOSED") { await publishCommitted(intent); return intent; }
    // The persisted native decision closes the PRJ-commit / intent-ack gap.
    if (intent.resolution.humanDecision && !intent.resolution.adoptionReceipt
      && session.project.confirmationDecision.provenance.includes(intent.finalizationIntentId)) {
      intent = await owner.resolveAdoption(intent.finalizationIntentId, intent.sequence, intent.resolution.humanDecision);
    }
    if (intent.state === "FROZEN" || intent.state === "WAITING_FOR_SCIENTIFIC_ASSESSMENT") {
      progress("ASSESSMENT");
      if (intent.state === "FROZEN") intent = await owner.waitForAssessment(intent.finalizationIntentId, intent.sequence);
      const assessment = await (ports.assess ?? requestStudioScientificAssessment)(session.sessionId, session.project,
        intent.frozen.scientificSources.request, intent.finalizationIntentId);
      intent = await owner.assess(intent.finalizationIntentId, intent.sequence, assessment);
    }
    if (intent.state === "SCIENTIFIC_PREPARATION_REQUIRED") {
      progress("SCIENCE");
      const exact = await client.workingRevisions?.getSave?.({ revisionId: intent.frozen.workingRevisionId,
        saveSequence: intent.frozen.workingRevisionSaveSequence, contentDigest: intent.frozen.workingRevisionContentDigest });
      if (!exact) throw new StudioFinalizationIntentError("STUDIO_INTENT_SAVE_INVALID");
      let preparation = intent.resolution.preparation;
      if (preparation?.checkpoint) {
        const evidence = await owner.readPreparation(intent.finalizationIntentId);
        if (evidence.state === "IN_PROGRESS") throw new StudioFinalizationIntentError("STUDIO_INTENT_PREPARATION_IN_PROGRESS");
        if (evidence.state === "UNKNOWN") throw new StudioFinalizationIntentError("STUDIO_INTENT_PREPARATION_UNRESOLVED");
        if (evidence.state === "FAILED") throw new StudioFinalizationIntentError("STUDIO_INTENT_PREPARATION_PROVIDER_FAILED");
        session = restoreStudioIntentPreparation(intent, ports.session(), evidence.state);
        if (evidence.state === "COMPLETED") session = consumeProjectPreparation(session,
          preparation.checkpoint.preparationId, evidence.response, "DURABLE_RECOVERY");
        ports.publish(session);
        // NOT_FOUND is not a provider retry. The same native request still goes
        // through admission/idempotence before it can dispatch anything.
        if (evidence.state === "NOT_FOUND") await ports.prepare(preparation);
      } else {
        const captured = captureStudioIntentPreparation(intent, ports.session(), exact.revision);
        if (!captured.preparation) throw new StudioFinalizationIntentError("STUDIO_INTENT_PREPARATION_NOT_READY");
        preparation = captured.preparation;
        intent = await owner.linkPreparation(intent.finalizationIntentId, intent.sequence, preparation);
        if (captured.action !== "REUSE_VALID_PREPARATION") await ports.prepare(preparation);
      }
      const ready = ports.session().workingDraftPreparations?.find(p => p.checkpoint?.preparationId === preparation!.checkpoint?.preparationId);
      if (!ready || ready.status !== "READY_FOR_REVIEW") throw new StudioFinalizationIntentError("STUDIO_INTENT_PREPARATION_PENDING");
      intent = await owner.linkPreparation(intent.finalizationIntentId, intent.sequence, ready);
    }
    if (intent.state === "WAITING_FOR_HUMAN_DECISION") {
      if (!intent.resolution.preparation?.result) { ports.clarify(intent); return intent; }
      session = restoreStudioIntentPreparation(intent, ports.session()); ports.publish(session);
      try {
        const decision = intent.resolution.humanDecision ?? prepareStudioIntentHumanDecision(intent, session);
        if (!intent.resolution.humanDecision) intent = await owner.recordHumanDecision(intent.finalizationIntentId, intent.sequence, decision);
        progress("SCIENCE"); await ports.adopt(intent);
        session = ports.session(); client = ports.client(session); owner = client.finalizationIntents!;
        intent = await owner.resolveAdoption(intent.finalizationIntentId, intent.sequence, decision);
      } catch (error) {
        if (error instanceof Error && error.message === "STUDIO_INTENT_ADDITIONAL_HUMAN_DECISION_REQUIRED") { ports.clarify(intent); return intent; }
        throw error;
      }
    }
    if (intent.state !== "READY_FOR_DOCUMENT_FINALIZATION" && !(intent.state === "BLOCKED"
      && intent.resolution.reason === "DOCUMENTARY_RECONCILIATION_REQUIRED")) { ports.clarify(intent); return intent; }
    progress("DOCUMENTS"); session = ports.session();
    if (!session.project) throw new StudioFinalizationIntentError("STUDIO_INTENT_PROJECT_INVALID");
    if (!intent.resolution.documentSource) {
      const base = await client.body(intent.frozen.baseGenerationId);
      if (base.body.native.family !== "DRCI") throw new StudioFinalizationIntentError("STUDIO_DOCUMENT_PACK_REQUIRED");
      const sameProject = base.ref.project.projectDigest === session.project.projectDigest && base.ref.project.projectVersion === session.project.versionId;
      let projection;
      if (sameProject) {
        const archived = await client.body(base.body.native.value.protocolProjectionId);
        if (archived.body.native.family !== "TEMPLATE") throw new StudioFinalizationIntentError("STUDIO_DOCUMENT_SOURCE_INVALID");
        projection = archived.body.native.value;
      } else {
        const handoffDecision = authorizeResearchProjectDocumentHandoff({ project: session.project,
          authority: session.projectAuthority, confirmedAt: intent.createdAt });
        projection = refreshFunctionalResetDocumentPortfolio({ project: session.project, handoffDecision,
          requestedAt: intent.createdAt, generateProtocol: true }).projections.at(-1);
        if (!projection) throw new StudioFinalizationIntentError("STUDIO_DOCUMENT_SOURCE_INVALID");
        const body = await freezeDocumentGeneration({ native: { family: "TEMPLATE", value: projection }, artifacts: [],
          sha256: documentTextSha256, renderOrigin: "GENERATION_TIME" });
        await client.commit(`studio-source:${intent.intentDigest}`, body);
      }
      const handoffDecision = projection.humanDecisions.find(item => item.gateId === "PRJ-GATE-DOCUMENT-WORKING-PROJECTION");
      if (!handoffDecision) throw new StudioFinalizationIntentError("STUDIO_DOCUMENT_SOURCE_INVALID");
      intent = await owner.prepareDocuments(intent.finalizationIntentId, intent.sequence,
        prepareDrciDraftSource({ handoffDecision, protocolProjection: projection, crf: buildCanonicalCrfPackage(session.project) }));
    }
    progress("ARCHIVE");
    try { intent = await owner.finalizeDocuments(intent.finalizationIntentId); }
    catch (error) {
      const explicitProviderRetry = !resumeOnly && error instanceof Error && error.message === "STUDIO_DOCUMENT_PROVIDER_FAILED";
      if (explicitProviderRetry) intent = await owner.retryDocuments(intent.finalizationIntentId, intent.sequence);
      if (explicitProviderRetry || error instanceof Error && error.message === "STUDIO_DOCUMENT_PROVIDER_REQUIRED") {
        progress("DOCUMENTS");
        try { await (ports.generate ?? requestProtocolDesignerBridge)(studioDocumentProviderRequest(intent, session.project, session.sessionId)); }
        catch (dispatchError) {
          // Retrieval only after transport/client failure; never redispatch.
          try { intent = await owner.finalizeDocuments(intent.finalizationIntentId); }
          catch { throw dispatchError; }
          if (!intent.resolution.documentReceipt) throw dispatchError;
        }
        progress("ARCHIVE"); intent = await owner.finalizeDocuments(intent.finalizationIntentId);
      } else {
        // A client exception cannot override a proven exact archive receipt.
        const recovered = await owner.get(intent.finalizationIntentId);
        if (!recovered.resolution.documentReceipt) throw error;
        intent = await owner.finalizeDocuments(intent.finalizationIntentId);
      }
    }
    await publishCommitted(intent); return intent;
  },
});
