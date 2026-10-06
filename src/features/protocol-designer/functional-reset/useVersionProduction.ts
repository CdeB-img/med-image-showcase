import { useEffect, useRef, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import { hardStudyProposalDependencies, studyProposalOptionDecisionRefs } from "@/features/scientific-thinking/contextual-study-proposal";
import { buildStudyProposalSelectionContribution } from "./study-proposal-standard";
import { captureProjectPreparation, canCaptureProjectPreparation, projectPreparationProgress } from "./project-preparation-lifecycle";
import { stageProjectConfirmation, type ProjectProposalSelection } from "./project-review-decision";
import { persistAdoptedProjectSession } from "./project-adoption-effects";
import { createTurnId, type FunctionalResetSession, type SessionSave, type WorkingDraftPreparation } from "./session";
import { recordGovernedAdoptionContextEvent, settleRetainedDiscussionAdoption } from "./contribution-discussion-retention";
import { hasCurrentArchivedGeneration } from "@/features/document-projection/generation-session";

/** The Generate action authorizes the source-backed checkpoint, not a silent
 * choice among competing proposals. Unbound suggestions remain in the working
 * composition; neither this adapter nor DOC turns them into adopted science. */
export function sourceBackedVersionSelection(session: FunctionalResetSession, preparation: WorkingDraftPreparation):
  { selection: ProjectProposalSelection } | { clarification: string } {
  const { composition, workingDraft } = preparation.result!;
  const explicit = new Set(Object.entries(workingDraft.origins).filter(([, origin]) => origin === "EXPLICIT_USER").map(([ref]) => ref));
  const available = composition.proposal.atoms.filter(a => explicit.has(a.ref)
    && a.status !== "OPEN_DECISION" && !composition.adoptedAtomRefs.includes(a.ref));
  const options: string[] = [];
  const optionAtoms = new Set(composition.proposal.arbitrations.flatMap(a => a.options.flatMap(o => o.atomRefs)));
  for (const arbitration of composition.proposal.arbitrations) {
    const matches = arbitration.options.filter(o => !composition.unavailableOptionRefs.includes(o.ref)
      && studyProposalOptionDecisionRefs(composition.proposal, o).length > 0
      && studyProposalOptionDecisionRefs(composition.proposal, o).every(ref => explicit.has(ref) && !composition.adoptedAtomRefs.includes(ref)));
    if (arbitration.selection === "ONE" && matches.length > 1)
      return { clarification: `Quel choix souhaitez-vous retenir pour ${arbitration.label.replace(/[?\s]+$/u, "")} ?` };
    options.push(...matches.map(o => o.ref));
    if (arbitration.material && matches.length === 0
      && arbitration.options.some(o => o.atomRefs.some(ref => available.some(a => a.ref === ref))))
      return { clarification: `Quel choix souhaitez-vous retenir pour ${arbitration.label.replace(/[?\s]+$/u, "")} ?` };
  }
  const atoms = available.filter(a => !optionAtoms.has(a.ref)).map(a => a.ref);
  const selected = new Set([...atoms, ...composition.proposal.arbitrations.flatMap(a => a.options.filter(o => options.includes(o.ref))
    .flatMap(o => studyProposalOptionDecisionRefs(composition.proposal, o)))]);
  const missing = available.flatMap(a => hardStudyProposalDependencies(a)).find(ref => !selected.has(ref) && !composition.adoptedAtomRefs.includes(ref));
  if (missing) {
    const arbitration = composition.proposal.arbitrations.find(a => a.material && a.options.some(o => o.atomRefs.includes(missing)));
    return { clarification: arbitration ? `Quel choix souhaitez-vous retenir pour ${arbitration.label.replace(/[?\s]+$/u, "")} ?`
      : "Quel choix souhaitez-vous retenir pour la dépendance scientifique encore ouverte ?" };
  }
  if (selected.size === 0) throw new Error("VERSION_SOURCE_BACKED_CONTENT_MISSING");
  const cp = preparation.checkpoint!;
  const proposalTurn = cp.request.conversation.turns.find(t => t.turnId === composition.sourceResponseRef)!;
  const selectionTurn = cp.request.conversation.turns.find(t => t.turnId === composition.sourceTurnRef)!;
  const contribution = buildStudyProposalSelectionContribution({ composition, selectedOptionRefs: options, selectedAtomRefs: atoms,
    project: session.project, projectId: session.projectId, conversationId: session.conversationId,
    proposalTurn, selectionTurn, createdAt: cp.capturedAt, preparingReview: true });
  const candidate = prepareResearchProjectContributionCandidate(contribution, session.project);
  if (candidate.status !== "CANDIDATE_PENDING_HUMAN_CONFIRMATION")
    throw new Error("VERSION_SOURCE_BACKED_CANDIDATE_NOT_READY");
  return { selection: { composition, selectedOptions: options, selectedAtoms: atoms,
    expectedDigest: composition.digest, contribution, candidate } };
}

/** One foreground command composed from the existing preparation, PRJ and DOC
 * owners. Conversation stays usable; no effect starts this command on mount. */
export function useVersionProduction(input: {
  session: FunctionalResetSession; latest: MutableRefObject<FunctionalResetSession>;
  setSession: Dispatch<SetStateAction<FunctionalResetSession>>; save?: SessionSave;
  prepare: (captured?: WorkingDraftPreparation) => Promise<void>;
  generateDocuments: (evidence: undefined, source: FunctionalResetSession) => Promise<void>;
  administration: Parameters<typeof stageProjectConfirmation>[0]["administration"];
}) {
  const inFlight = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const progress = projectPreparationProgress(input.session);
  const current = hasCurrentArchivedGeneration(input.session) && !progress.latestPendingScientificTurnRef;
  const unknown = input.session.workingDraftPreparations?.some(p => p.decision === "PENDING"
    && ["PREPARING", "UNKNOWN/INTERRUPTED"].includes(p.status));
  const available = !pending && !unknown && !input.session.documentRetryUnsafe
    && !current && (canCaptureProjectPreparation(input.session) || Boolean(input.session.project && !progress.latestPendingScientificTurnRef));
  const publish = (next: FunctionalResetSession) => { input.latest.current = next; input.setSession(next); };
  const generate = async () => {
    if (inFlight.current || !available) return;
    inFlight.current = true; setPending(true); setError(null);
    const source = input.latest.current;
    const clickedAt = new Date().toISOString();
    const text = source.documentArchive?.currentGenerationId ? "Générer une nouvelle version" : "Générer la version";
    const intent = { turnId: createTurnId(), role: "USER" as const, content: text, createdAt: clickedAt };
    try {
      if (canCaptureProjectPreparation(source)) {
        const captured = captureProjectPreparation(source, clickedAt, true);
        if (!captured.checkpoint) throw new Error("VERSION_CHECKPOINT_MISSING");
        const preparation = { ...captured, checkpoint: { ...captured.checkpoint, presentation: "INTERNAL_VERSION_PRODUCTION" as const } };
        await input.prepare(preparation);
        let latest = input.latest.current;
        if (!mounted.current || latest.sessionId !== source.sessionId) return;
        const ready = latest.workingDraftPreparations?.find(p => p.checkpoint?.preparationId === preparation.checkpoint.preparationId);
        if (ready?.status === "NO_CHANGE" && ready.code === "NO_CANONICAL_CHANGE") {
          if (!hasCurrentArchivedGeneration(latest)) await input.generateDocuments(undefined, latest);
          return;
        }
        if (!ready?.result || ready.status !== "READY_FOR_REVIEW" || ready.decision !== "PENDING")
          throw new Error(ready?.code ?? ready?.status ?? "VERSION_PREPARATION_NOT_READY");
        const chosen = sourceBackedVersionSelection(latest, ready);
        if ("clarification" in chosen) {
          // A question is presentation, not fabricated provider coverage. It is
          // deliberately absent from the scientific runtime/source checkpoint.
          const id = `version-clarification:${ready.checkpoint!.preparationId}`;
          if (!latest.entries.some(e => e.entryId === id)) publish({ ...latest, entries: [...latest.entries,
            { entryId: id, kind: "TEXT", role: "NOXIA", content: chosen.clarification, createdAt: new Date().toISOString() }] });
          return;
        }
        const staged = stageProjectConfirmation({ session: latest, readCurrentSession: () => input.latest.current,
          contributionId: chosen.selection.contribution.identity.contributionId, contribution: chosen.selection.contribution,
          proposalSelection: chosen.selection, now: new Date().toISOString(), administration: input.administration,
          naturalDecision: { userTurn: intent, originalText: text, gatewayState: latest.conversationLanguageGateway,
            traceLedger: latest.scientificExecutionTraceLedger, stylePreference: null,
            materialization: { preparationId: ready.checkpoint!.preparationId, requestDigest: ready.checkpoint!.requestDigest } } });
        const committed = await persistAdoptedProjectSession({ storage: window.localStorage,
          session: { ...staged.nextSession, project: staged.project }, previousProject: staged.previousProject,
          save: input.save, uploadSnapshot: true });
        if (committed.status !== "COMMITTED") throw new Error("VERSION_PROJECT_NOT_COMMITTED");
        // Only the scientific transaction is published. Later turns received
        // during persistence are preserved, never pulled into this checkpoint.
        latest = input.latest.current;
        if (latest.sessionId !== source.sessionId || latest.project?.versionId !== staged.previousProject?.versionId)
          throw new Error("VERSION_PROJECT_BASE_CHANGED");
        const additions = latest.runtimeTurns.filter(t => !staged.nextSession.runtimeTurns.some(old => old.turnId === t.turnId));
        const entryAdditions = latest.entries.filter(e => !staged.nextSession.entries.some(old => old.entryId === e.entryId));
        const next = { ...committed.session, knowledgeOwnerLedger: latest.knowledgeOwnerLedger, sourceLibrary: latest.sourceLibrary,
          bridgeTraces: [...committed.session.bridgeTraces, ...latest.bridgeTraces.filter(t => !committed.session.bridgeTraces.some(old => old.turnId === t.turnId))],
          runtimeTurns: [...staged.nextSession.runtimeTurns, ...additions], entries: [...staged.nextSession.entries, ...entryAdditions],
          scientificDiscussionRetention: settleRetainedDiscussionAdoption(recordGovernedAdoptionContextEvent(
            latest.scientificDiscussionRetention, staged.project, [intent, staged.nextSession.runtimeTurns.at(-1)!]),
          staged.project, staged.nextSession.retainedContributionCandidates ?? [], staged.nextSession.studyProposal) };
        if (!mounted.current) return;
        publish(next);
        await input.generateDocuments(undefined, { ...next, runtimeTurns: [...ready.checkpoint!.request.conversation.turns, intent] });
      } else if (source.project) await input.generateDocuments(undefined, source);
    } catch (cause) {
      // Bounded code only; no private receipt or scientific serialization.
      console.warn("VERSION_PRODUCTION_FAILED", cause instanceof Error && /^[A-Z][A-Z0-9_]+$/.test(cause.message) ? cause.message : "VERSION_PRODUCTION_FAILED");
      if (mounted.current) setError("La production de cette version n’a pas abouti. La conversation, le projet et les documents déjà archivés sont conservés.");
    } finally { inFlight.current = false; if (mounted.current) setPending(false); }
  };
  return { generate, pending, error, available, label: current ? "Documents à jour"
    : input.session.documentArchive?.currentGenerationId ? "Générer une nouvelle version" : "Générer la version" };
}
