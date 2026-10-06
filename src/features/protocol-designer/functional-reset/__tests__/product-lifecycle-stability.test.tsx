import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { buildProjectContextSnapshot, type ResearchProjectOwnerProjection } from "@/features/research-project-construction";
import { prepareTerraConversation } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import type { StudyProposalAtom } from "@/features/scientific-thinking/contextual-study-proposal";
import { DRCI_DOCUMENT_KINDS, prepareDrciDraftPack, materializeDrciDraftPack } from "@/features/document-projection/drci-draft-pack";
import { offlineArchiveClient, offlineArchiveRuntime, offlineDocReceipt, resetOfflineArchiveClients } from "@/features/document-projection/__tests__/offline-archive-client";
import type { DocumentGenerationRef } from "@/features/document-projection/generation-persistence";
import type { ProductBridgeRequest } from "../../product-bridge";
import { acceptWorkingDraftUpdate, prepareWorkingDraftRequest, type WorkingDraftUpdate } from "../continuous-project-build";
import { projectPreparationProgress, projectPreparationReview } from "../project-preparation-lifecycle";
import { createFunctionalResetSession, loadFunctionalResetSession, saveFunctionalResetWorkspaceSession, workingDraftRecoveryIdentity } from "../session";
import { prepareTerraConversationRequest } from "../conversation-request";
import { activeScientificDiscussionRetention, type TerraScientificResult } from "../contribution-discussion-retention";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";

const bridge = vi.hoisted(() => vi.fn());
vi.mock("../../product-bridge-client", async original => ({ ...await original<object>(), requestProtocolDesignerBridge: bridge }));
vi.mock("@/features/document-projection/generation-archive-client", async original => ({ ...await original<object>(), createDocumentArchiveClient: offlineArchiveClient }));
afterEach(() => { cleanup(); bridge.mockReset(); resetOfflineArchiveClients(); localStorage.clear(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

// SYNTHETIC_CURRENT_CONTRACT / CURRENT_SEMANTIC_INVARIANT. This is a
// scientifically meaningful controlled proposal, not historical human evidence
// or clinical approval. Histology is only proposed for patients in whom biopsy
// is clinically indicated; eligibility/safety and sample size remain open.
const initialText = "Je veux étudier la fibrose myocardique chez des adultes atteints de cardiomyopathie. "
  + "Il s'agit d'une cohorte observationnelle longitudinale, conduite dans un seul centre, avec un suivi de 12 mois. "
  + "L'objectif est de quantifier la fibrose myocardique ; la méthode de mesure initiale est l'IRM cardiaque. "
  + "L'âge sera décrit en années. Aucun traitement n'est attribué par cette étude. "
  + "Les critères détaillés d'éligibilité, la sécurité des examens, la segmentation, le modèle d'analyse et le dimensionnement restent à définir. "
  + "La biopsie n'est pas adoptée à ce stade et ne pourra être envisagée que si elle est cliniquement indiquée. "
  + "Conservez ces limites et préparez des choix à examiner, sans adoption ni génération documentaire automatique.";
const messages = [initialText,
  "Remplacer la conduite monocentrique par une étude multicentrique. La population, l'objectif, l'IRM et le suivi de 12 mois restent identiques. Les sites et le recrutement restent à définir.",
  "Remplacer le suivi de 12 mois par un suivi de 24 mois. L'étude reste multicentrique, observationnelle, chez des adultes atteints de cardiomyopathie, avec la même méthode de mesure. Ne fixez pas l'effectif.",
  "Remplacer explicitement l'IRM cardiaque par une biopsie myocardique cliniquement indiquée, pour la mesure de fibrose. Ne conservez pas l'IRM comme méthode active concurrente. La population, le design multicentrique et le suivi de 24 mois restent identiques ; sécurité, éligibilité et analyse détaillées restent ouvertes."];

const atomsFor = (step: number): StudyProposalAtom[] => {
  const base = controlledStudyProposal("fixture:unbound", DOMAINS[2]);
  const atom = (ref: string, patch: Partial<StudyProposalAtom>) => ({ ...base.atoms.find(a => a.ref === ref)!, ...patch });
  return [
    atom("question", { content: "Quantifier la fibrose myocardique chez des adultes atteints de cardiomyopathie" }),
    atom("population", { content: "Adultes atteints de cardiomyopathie" }),
    atom("design", { content: "Cohorte observationnelle longitudinale" }),
    atom("design", { ref: "centres", semanticKey: step ? "design.multicenter" : "design.singlecenter", content: step ? "Étude multicentrique" : "Étude monocentrique" }),
    atom("timing", { semanticKey: "timing.followup", content: `Suivi : ${step >= 2 ? 24 : 12} mois`, status: "NOXIA_PROPOSAL" }),
    atom("measurement", { ref: step === 3 ? "biopsy" : "measurement", semanticKey: "measurement.fibrosis", owner: step === 3 ? "OBS" : "IMAGING",
      content: step === 3 ? "Biopsie myocardique cliniquement indiquée" : "IRM cardiaque" }),
    atom("descriptor", { content: "Âge", unit: "ans", plannedSource: "Questionnaire d'inclusion", plannedMethod: "Recueil de l'âge à l'inclusion" }),
    atom("bounds", { semanticKey: "open.design-details", content: "Effectif, sites, éligibilité, sécurité, segmentation et analyse détaillées à définir", status: "OPEN_DECISION" }),
  ];
};

const updateFor = (request: ProductBridgeRequest, step: number): WorkingDraftUpdate => {
  const proposal = controlledStudyProposal(prepareWorkingDraftRequest(request).inputDigest, DOMAINS[2]);
  proposal.atoms = atomsFor(step);
  proposal.arbitrations = [{ ...proposal.arbitrations[1], ref: "open-details", label: "Détails à définir",
    options: [{ ...proposal.arbitrations[1].options[0], ref: "define-details", label: "Définir les détails opérationnels", atomRefs: ["bounds"] }] }];
  proposal.dimensioningScenarios = [];
  proposal.understanding = ["Cohorte de cardiomyopathie ; corrections et inconnues conservées séparément."];
  const users = request.conversation.turns.filter(t => t.role === "USER" && messages.includes(t.content));
  const sourceIndex = (ref: string) => ref === "centres" && step >= 1 ? 1 : ref === "timing" && step >= 2 ? 2 : ref === "biopsy" ? 3 : 0;
  return { requestType: "STUDY_UPDATE", proposal, inferredAtomRefs: [], rejectedAtomRefs: [],
    ...(step === 3 ? { supersededAtomRefs: ["measurement"] } : {}),
    explicitDecisions: proposal.atoms.filter(a => a.status !== "OPEN_DECISION").map(a => {
      const source = users[sourceIndex(a.ref)];
      return { atomRef: a.ref, sourceTurnRef: source.turnId, quote: source.content };
    }),
    // Only a complete represented meaning is bound; the unknown remains active.
    retainedDiscussionBindings: (request.scientificDiscussionContext?.retainedMeaning ?? []).flatMap(e => {
      const meaningId = e.ref;
      const match = proposal.atoms.find(a => a.status !== "OPEN_DECISION" && a.content === e.content);
      return match ? [{ elementRef: meaningId, atomRefs: [match.ref], sourceTurnRef: e.sourceTurnRef }] : [];
    }) };
};

const semanticResult = (step: number): TerraScientificResult => {
  const atoms = atomsFor(step);
  const changed = step === 0 ? atoms.filter(a => a.status !== "OPEN_DECISION")
    : atoms.filter(a => a.ref === (step === 1 ? "centres" : step === 2 ? "timing" : "biopsy"));
  return { reply: `Proposition ${step + 1} à examiner : ${changed.map(a => a.content).join(" ; ")}. Les détails non fournis restent ouverts. Aucune adoption ni génération de documents.`,
    // CURRENT_SEMANTIC_INVARIANT: coverage is complete only because every
    // source clause has a retained meaning. Clauses not bound to adopted atoms
    // remain active residuals; PARTIAL/UNKNOWN eviction is tested separately.
    userContribution: { coverage: "COMPLETE", nonPersistentReason: null, elements: [
      ...changed.map(a => ({ id: a.ref, content: a.content, epistemicState: "USER_STATED" as const,
        polarity: "AFFIRMED" as const, conditions: [], linkedIds: [] })),
      ...messages[step].split(/\.\s*/u).filter(Boolean).map((content, index) => ({ id: `residual-${index}`, content,
        epistemicState: "USER_STATED" as const, polarity: "AFFIRMED" as const, conditions: [], linkedIds: [] }))] },
    assistantContribution: { coverage: "COMPLETE", nonPersistentReason: null, elements: [
      ...changed.map(a => ({ id: `proposed-${a.ref}`, content: a.content, epistemicState: "PROPOSED_NOT_ADOPTED" as const,
        polarity: "AFFIRMED" as const, conditions: [], linkedIds: [] })),
      { id: "details-open", content: atoms.at(-1)!.content,
        epistemicState: "OPEN_UNKNOWN", polarity: "UNKNOWN", conditions: [], linkedIds: [] },
      { id: "authorization", content: "Aucune adoption ni génération de documents", epistemicState: "USER_STATED",
        polarity: "NEGATED", conditions: [], linkedIds: [] }] },
    dispositions: [], candidateBindings: [] };
};

const send = (text: string) => {
  fireEvent.change(screen.getByRole("textbox", { name: "Votre message" }), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
};

const documentaryResult = async (request: ProductBridgeRequest, sessionId: string) => {
  const project = request.currentProject!, source = request.documentDraftRequest!, packet = prepareDrciDraftPack(project, source);
  // CURRENT_STRUCTURAL_INVARIANT for the repeated qualification disclaimer:
  // word envelope/transport/archive, not editorial or clinical quality. The
  // non-repeated scientific facts and unknowns come from the native Project.
  const generated = { documents: DRCI_DOCUMENT_KINDS.map(kind => ({ kind, title: `Qualification ${kind}`,
    sections: [{ title: "Source adoptée", paragraphs: [buildProjectContextSnapshot({ project }).objects.map(o => o.content).join(". ")
      + (kind === "PROTOCOL_SYNOPSIS" ? " Qualification déterministe de la persistance documentaire, sans validation clinique ni réglementaire. ".repeat(60) : "")],
      sourceRefs: packet.sourceFacts.map(f => f.ref) }], missingElements: ["Détails d'éligibilité et de sécurité à définir"] })),
    crfRows: source.crf.fields.map((field, index) => ({ variableRef: field.canonicalVariableId, variableId: `FIELD_${index}`, label: field.label,
      domain: "À préciser", visit: "À préciser", definition: field.label, entryType: "Texte", unit: field.unit, categories: null,
      dataOrigin: "UNSPECIFIED", source: "À préciser", required: "À préciser", condition: null, derivedFrom: [], derivation: null,
      controls: [], analysisImpact: null, specificationStatus: "UNSPECIFIED" })) };
  const pack = materializeDrciDraftPack(generated, { project, packet, generatedAt: source.handoffDecision.timestamp! });
  return { assistantReply: "Documents disponibles.", observability: { providerCalls: [] }, documentDraftPack: pack,
    documentPersistenceReceipt: await offlineDocReceipt(sessionId, project, request.observabilityContext!.clientRequestId, pack) };
};

const conversationalResult = async (request: ProductBridgeRequest, semantic: TerraScientificResult) => {
  const provider = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ id: "SYNTHETIC_STABILITY", model: "gpt-6.1-sol", status: "completed",
    output: [{ content: [{ type: "output_text", text: JSON.stringify(semantic) }] }], usage: { input_tokens: 100, output_tokens: 80, total_tokens: 180 } })));
  const response = await executeProtocolDesignerBridge({ body: request, apiKey: null, openAiApiKey: "OFFLINE_SYNTHETIC", chatRuntime: "TERRA",
    autonomousProjectBuild: true, fetchImpl: provider, providerAttemptPolicy: "SINGLE_ATTEMPT_FAIL_CLOSED" });
  expect(response.status).toBe(200); expect(provider).toHaveBeenCalledOnce();
  return response.body;
};

describe("product lifecycle stability — meaningful controlled science, native owners, no network", () => {
  it("keeps post-checkpoint science pending, confirms only P1, converses during G1, then explicitly prepares V2/G2", async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    let saved = createFunctionalResetSession(), releasePreparation!: () => void, releaseDocuments!: () => void;
    const preparationHeld = new Promise<void>(resolve => { releasePreparation = resolve; });
    const documentsHeld = new Promise<void>(resolve => { releaseDocuments = resolve; });
    const requests: ProductBridgeRequest[] = [], packets: string[] = [];
    let boundaryFailure: unknown = null;
    const raceText = "L'étude reste monocentrique ; l'âge sera recueilli à l'inclusion par questionnaire. Les procédures détaillées et l'effectif restent ouverts.";
    const age = "Âge à l'inclusion, recueilli par questionnaire";
    const raceSemantic: TerraScientificResult = { reply: "Recueil de l'âge à l'inclusion par questionnaire ; procédures détaillées et effectif ouverts.",
      userContribution: { coverage: "COMPLETE", nonPersistentReason: null, elements: [
        { id: "age", content: age, epistemicState: "USER_STATED", polarity: "AFFIRMED", conditions: [], linkedIds: [] },
        { id: "centre", content: "Étude monocentrique", epistemicState: "USER_STATED", polarity: "AFFIRMED", conditions: [], linkedIds: [] },
        { id: "unknown", content: "Procédures détaillées et effectif restent ouverts", epistemicState: "OPEN_UNKNOWN", polarity: "UNKNOWN", conditions: [], linkedIds: [] }] },
      assistantContribution: { coverage: "COMPLETE", nonPersistentReason: null, elements: [
        { id: "age", content: age, epistemicState: "PROPOSED_NOT_ADOPTED", polarity: "AFFIRMED", conditions: [], linkedIds: [] },
        { id: "unknown", content: "Procédures détaillées et effectif restent ouverts", epistemicState: "OPEN_UNKNOWN", polarity: "UNKNOWN", conditions: [], linkedIds: [] }] },
      dispositions: [], candidateBindings: [] };
    const advice: TerraScientificResult = { reply: "Suggestion non adoptée : discuter le dimensionnement avant de fixer l'effectif ; aucune valeur n'est inventée.",
      userContribution: { coverage: "COMPLETE", nonPersistentReason: "PRESENTATION_ONLY", elements: [] },
      assistantContribution: { coverage: "COMPLETE", nonPersistentReason: null, elements: [{ id: "dimensioning", content: "Dimensionnement à discuter avant de fixer l'effectif",
        epistemicState: "PROPOSED_NOT_ADOPTED", polarity: "AFFIRMED", conditions: [], linkedIds: [] }] }, dispositions: [], candidateBindings: [] };
    bridge.mockImplementation(async (raw: ProductBridgeRequest) => {
      const request = { ...raw, apiVersion: "1.0.0" as const }; requests.push(request);
      try {
        if (request.prepareWorkingDraft) {
          const number = requests.filter(r => r.prepareWorkingDraft).length;
          if (number === 1) await preparationHeld;
          const update = updateFor(request, 0);
          if (number === 2) {
            update.proposal!.atoms.find(a => a.ref === "descriptor")!.content = age;
            const source = request.conversation.turns.find(t => t.content === raceText)!;
            update.explicitDecisions = update.explicitDecisions.map(d => d.atomRef === "descriptor"
              ? { atomRef: d.atomRef, sourceTurnRef: source.turnId, quote: source.content } : d);
            update.retainedDiscussionBindings = (request.scientificDiscussionContext?.retainedMeaning ?? []).flatMap(e => {
              const atom = update.proposal!.atoms.find(a => a.status !== "OPEN_DECISION" && a.content === e.content);
              return atom ? [{ elementRef: e.ref, atomRefs: [atom.ref], sourceTurnRef: e.sourceTurnRef }] : [];
            });
          }
          const accepted = acceptWorkingDraftUpdate(update, request);
          return { workingDraftUpdate: accepted.update, workingStudyProposal: accepted.composition, observability: { providerCalls: [] } };
        }
        if (request.documentDraftRequest) {
          if (requests.filter(r => r.documentDraftRequest).length === 1) await documentsHeld;
          return await documentaryResult(request, saved.sessionId);
        }
        packets.push(prepareTerraConversation(request, true).context);
        return await conversationalResult(request, request.conversation.turns.at(-1)!.content === initialText
          ? semanticResult(0) : request.conversation.turns.at(-1)!.content === raceText ? raceSemantic : advice);
      } catch (error) { boundaryFailure = error; throw error; }
    });
    render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={async next => {
      const result = await saveFunctionalResetWorkspaceSession(localStorage, next); saved = next; return result;
    }} /></HelmetProvider>);
    send(initialText); await screen.findByText(semanticResult(0).reply);
    fireEvent.click(screen.getByRole("button", { name: "Revoir les choix du projet" }));
    await waitFor(() => expect(requests.filter(r => r.prepareWorkingDraft)).toHaveLength(1));
    const frozen = JSON.stringify(saved.workingDraftPreparations![0].checkpoint);
    send(raceText); await screen.findByText(raceSemantic.reply);
    const raceTurn = saved.runtimeTurns.find(t => t.content === raceText)!;
    await act(async () => releasePreparation());
    await screen.findByTestId("project-finalization-card");
    expect(projectPreparationProgress(saved).latestPendingScientificTurnRef).toBe(raceTurn.turnId);
    expect(saved.workingDraftPreparations![0].checkpoint!.request.conversation.turns.some(t => t.turnId === raceTurn.turnId)).toBe(false);
    expect(screen.getByRole("button", { name: "Repréparer avec les nouveaux échanges" })).toBeEnabled();
    expect(screen.getByTestId("preparation-newer-conversation")).not.toHaveTextContent("relation avec →");
    // CURRENT_STRUCTURAL_INVARIANT: stale-cutoff partial reconciliation is Expert-only.
    fireEvent.click(screen.getByLabelText("Plus d’options"));
    fireEvent.click(screen.getByRole("button", { name: "Diagnostic technique" }));
    for (const checkbox of screen.getAllByRole("checkbox")) fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: "Valider ces choix" }));
    await waitFor(() => expect(saved.project?.revision).toBe(1));
    fireEvent.click(screen.getByRole("button", { name: "Quitter le diagnostic" }));
    const v1 = JSON.stringify(saved.project);
    expect(projectPreparationProgress(saved).latestPendingScientificTurnRef).toBe(raceTurn.turnId);
    // Reproduce the previous owner branch: the last physical USER is the
    // generated adoption command; its local reply is not a Chat receipt.
    const oldSource = [...saved.runtimeTurns].reverse().find(t => t.role === "USER")!;
    const oldRecovery = workingDraftRecoveryIdentity(saved, oldSource.turnId);
    expect(oldSource.turnId).not.toBe(raceTurn.turnId);
    expect(Boolean(oldRecovery && /^noxia-turn:[a-f\d-]{36}$/iu.test(oldRecovery.sourceResponseRef))).toBe(false);
    expect(screen.queryByTestId("project-finalization-card")).toBeNull();
    expect(screen.getByRole("button", { name: "Revoir les choix du projet" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Protocole / documents" }));
    fireEvent.click(screen.getByRole("button", { name: "Générer les documents" }));
    await waitFor(() => expect(requests.filter(r => r.documentDraftRequest)).toHaveLength(1));
    fireEvent.click(screen.getByRole("button", { name: "Conception" }));
    send("fais des suggestions pour la suite"); await screen.findByText(advice.reply);
    expect(JSON.stringify(saved.project)).toBe(v1);
    const packet = JSON.parse(packets.at(-1)!);
    expect(new TextEncoder().encode(packets.at(-1)!).length).toBeLessThan(80_000);
    expect(packet.WORKING_STUDY_PROPOSAL.atoms).toHaveLength(1);
    expect(packet.CURRENT_DISCUSSION.retainedMeaning.some((e: { content: string }) => e.content === age)).toBe(true);
    for (const privateDocKey of ["documentDraftRequest", "documentDraftPack", "drciDraftPacks", "documents", "documentArchive"])
      expect(packets.at(-1)).not.toContain(`"${privateDocKey}"`);
    expect(requests.filter(r => r.prepareWorkingDraft)).toHaveLength(1); // no eager preparation
    await act(async () => releaseDocuments());
    fireEvent.click(screen.getByRole("button", { name: "Protocole / documents" }));
    await waitFor(() => expect(screen.getByTestId("durable-document-history")).toHaveTextContent("G1 — basée sur le projet V1"));
    const client1 = offlineArchiveClient(saved.sessionId, saved.project!);
    const g1 = (await client1.history()).entries[0];
    const g1Body = JSON.stringify((await client1.body(g1.generationId)).body);
    fireEvent.click(screen.getByRole("button", { name: "Conception" }));
    fireEvent.click(screen.getByRole("button", { name: "Revoir les choix du projet" }));
    await waitFor(() => expect(saved.workingDraftPreparations?.at(-1)?.status, String(boundaryFailure)).toBe("READY_FOR_REVIEW"));
    expect(requests.filter(r => r.prepareWorkingDraft)).toHaveLength(2);
    expect(JSON.stringify(saved.workingDraftPreparations![0].checkpoint)).toBe(frozen);
    expect(saved.project?.revision).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "Valider ces choix" }));
    await waitFor(() => expect(saved.project?.revision).toBe(2));
    expect(saved.project!.canonicalState!.objects.some(o => o.actuality === "CURRENT" && o.content === age)).toBe(true);
    expect(projectPreparationProgress(saved).latestPendingScientificTurnRef).toBeNull();
    expect(screen.getByRole("button", { name: "Revoir les choix du projet" })).toBeDisabled();
    expect(requests.filter(r => r.documentDraftRequest)).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Protocole / documents" }));
    fireEvent.click(screen.getByRole("button", { name: "Générer les documents" }));
    await waitFor(() => expect(screen.getByTestId("durable-document-history")).toHaveTextContent("G2 — basée sur le projet V2"));
    const client2 = offlineArchiveClient(saved.sessionId, saved.project!);
    expect((await client2.history()).entries.map(g => g.displayVersion)).toEqual([2, 1]);
    expect(JSON.stringify((await client2.body(g1.generationId)).body)).toBe(g1Body);
    expect(loadFunctionalResetSession(localStorage).project?.projectDigest).toBe(saved.project?.projectDigest);
    console.info("INTERLEAVED_CONTEXT_BYTES=" + new TextEncoder().encode(packets.at(-1)!).length);
  }, 30_000);
  for (const reload of [false, true]) it(`fresh V1→V4 / G1→G4${reload ? " with reload at every boundary" : " without reload"}`, async () => {
    vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
    let saved = createFunctionalResetSession(), step = 0;
    let boundaryFailure: unknown = null;
    const projects: ResearchProjectOwnerProjection[] = [], frozenProjects: string[] = [];
    const generations: DocumentGenerationRef[] = [], frozenBodies: string[] = [];
    const packetSizes: number[] = [];
    const dispatches = { conversation: 0, workingDraft: 0, doc: 0 };
    bridge.mockImplementation(async (raw: ProductBridgeRequest) => {
      const request = { ...raw, apiVersion: "1.0.0" as const };
      if (request.prepareWorkingDraft) {
        dispatches.workingDraft++;
        let accepted;
        try { accepted = acceptWorkingDraftUpdate(updateFor(request, step), request); }
        catch (error) { boundaryFailure = error; throw error; }
        return { workingDraftUpdate: accepted.update, workingStudyProposal: accepted.composition, observability: { providerCalls: [] } };
      }
      if (request.documentDraftRequest) {
        dispatches.doc++;
        try { return await documentaryResult(request, saved.sessionId); }
        catch (error) { boundaryFailure = error; throw error; }
      }
      dispatches.conversation++;
      const prepared = prepareTerraConversation(request, true);
      packetSizes.push(new TextEncoder().encode(prepared.context).length);
      return conversationalResult(request, semanticResult(step));
    });
    const mount = () => render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={async next => {
      const result = await saveFunctionalResetWorkspaceSession(localStorage, next); saved = next; return result;
    }} /></HelmetProvider>);
    let view = mount();
    const recover = () => {
      if (!reload) return;
      const calls = { ...dispatches }, turns = saved.runtimeTurns, version = saved.project?.versionId;
      view.unmount(); saved = loadFunctionalResetSession(localStorage); view = mount();
      expect(saved.runtimeTurns).toEqual(turns); expect(saved.project?.versionId).toBe(version); expect(dispatches).toEqual(calls);
    };
    expect(saved.project).toBeNull(); expect(saved.runtimeTurns).toEqual([]);
    expect(saved.documents.projections).toEqual([]); expect(bridge).not.toHaveBeenCalled();
    for (step = 0; step < messages.length; step++) {
      send(messages[step]);
      await screen.findByText(semanticResult(step).reply);
      await waitFor(() => expect(screen.getByRole("button", { name: "Revoir les choix du projet" })).toBeEnabled());
      expect(dispatches).toEqual({ conversation: step + 1, workingDraft: step, doc: step });
      expect(saved.project?.revision ?? 0).toBe(step); recover();
      fireEvent.click(screen.getByRole("button", { name: "Revoir les choix du projet" }));
      await waitFor(() => expect(saved.workingDraftPreparations?.at(-1)?.status, String(boundaryFailure)).toBe("READY_FOR_REVIEW"));
      const ready = projectPreparationReview(saved)!;
      expect(ready.applicable).toBe(true);
      expect(saved.workingDraft!.readyReview!.candidate.canonicalChangeSet.conflicts).toEqual([]);
      if (step) {
        const changes = saved.workingDraft!.readyReview!.candidate.canonicalChangeSet.objectChanges;
        expect(changes).toHaveLength(1);
        expect(changes[0].operation).toBe("REPLACE");
      }
      expect(saved.project?.revision ?? 0).toBe(step); recover();
      // Reload must reuse the prepared Review and must not dispatch a WD.
      expect(dispatches.workingDraft).toBe(step + 1);
      const preparedCheckpoint = JSON.stringify(saved.workingDraftPreparations!.at(-1)!.checkpoint);
      fireEvent.click(screen.getByRole("button", { name: "Revoir les choix du projet" }));
      fireEvent.click(screen.getByRole("button", { name: "Revoir les choix du projet" }));
      expect(dispatches.workingDraft).toBe(step + 1);
      expect(JSON.stringify(saved.workingDraftPreparations!.at(-1)!.checkpoint)).toBe(preparedCheckpoint);
      fireEvent.click(screen.getByRole("button", { name: "Valider ces choix" }));
      await waitFor(() => expect(saved.project?.revision).toBe(step + 1));
      expect(saved.workingDraftPreparations!.at(-1)!.decision).toBe("ADOPTED");
      expect(dispatches.doc).toBe(step); // Adoption is not a DOC command.
      const project = saved.project!;
      projects.push(project); frozenProjects.push(JSON.stringify(project));
      const current = project.canonicalState!.objects.filter(o => o.actuality === "CURRENT");
      expect(current.map(o => o.content)).toEqual(expect.arrayContaining(atomsFor(step).filter(a => a.status !== "OPEN_DECISION").map(a => a.content)));
      if (step) for (const unchanged of projects[0].canonicalState!.objects.filter(o => ["POPULATION", "CANONICAL_VARIABLE", "SCIENTIFIC_QUESTION"].includes(o.objectType))) {
        expect(current.find(o => o.objectVersionId === unchanged.objectVersionId)).toEqual(unchanged);
      }
      if (step === 3) {
        const previous = projects[2].canonicalState!.objects.find(o => o.actuality === "CURRENT" && o.content === "IRM cardiaque")!;
        const historical = project.canonicalState!.objects.find(o => o.objectVersionId === previous.objectVersionId)!;
        expect(historical.actuality).toBe("SUPERSEDED");
        expect(current.find(o => o.content === "Biopsie myocardique cliniquement indiquée")!.supersedesVersionRef).toBe(previous.objectVersionId);
        expect(current.some(o => o.content === "IRM cardiaque")).toBe(false);
      }
      recover();
      // Actual second-message preflight, using native session projections.
      const probe = { turnId: `capacity-${step}`, role: "USER" as const, content: "Les paramètres non fournis restent à définir ; poursuivons la discussion.", createdAt: saved.updatedAt };
      const request = { ...prepareTerraConversationRequest(saved, [...saved.runtimeTurns, probe], probe, true, false), apiVersion: "1.0.0" as const };
      const packet = JSON.parse(prepareTerraConversation(request, true).context);
      const bytes = new TextEncoder().encode(JSON.stringify(packet)).length;
      packetSizes.push(bytes); expect(bytes).toBeLessThan(80_000);
      expect(packet.coverage.transcript).toBe("RECENT_WINDOW");
      expect(packet.WORKING_STUDY_PROPOSAL?.atoms.some((a: StudyProposalAtom) => saved.studyProposal!.adoptedAtomRefs.includes(a.ref)) ?? false).toBe(false);
      expect(packet.WORKING_STUDY_PROPOSAL?.atoms.filter((a: StudyProposalAtom) => a.status === "OPEN_DECISION")).toHaveLength(1);
      expect(packet.OPEN_DECISIONS.filter((d: { source?: string }) => d.source === "WORKING_DRAFT_NOT_ADOPTED")).toEqual([{ source: "WORKING_DRAFT_NOT_ADOPTED", ref: "bounds" }]);
      expect(activeScientificDiscussionRetention(saved.scientificDiscussionRetention!, saved.retainedContributionCandidates ?? [], saved.project, saved.studyProposal)
        .every(e => e.status === "NOT_ADOPTED")).toBe(true);
      const client = offlineArchiveClient(saved.sessionId, project);
      expect((await client.history()).entries).toEqual([...generations].reverse());
      fireEvent.click(screen.getByRole("button", { name: "Protocole / documents" }));
      fireEvent.click(screen.getByRole("button", { name: "Générer les documents" }));
      // Ten rapid clicks still represent one explicit command.
      for (let click = 0; click < 10; click++) fireEvent.click(screen.getByRole("button", { name: "Générer les documents" }));
      await waitFor(() => expect(within(screen.getByTestId("durable-document-history")).queryByText(`G${step + 1} — basée sur le projet V${step + 1}`), String(boundaryFailure)).not.toBeNull());
      expect(dispatches.doc).toBe(step + 1);
      expect(screen.getByRole("button", { name: "Générer les documents" })).toBeDisabled();
      expect(screen.queryByRole("complementary", { name: "Projection technique interne" })).toBeNull();
      const history = (await client.history()).entries;
      expect(history).toHaveLength(step + 1); expect(history.every(g => g.family === "DRCI")).toBe(true);
      const newest = history[0];
      expect(newest.displayVersion).toBe(step + 1); expect(newest.project.projectDigest).toBe(project.projectDigest);
      expect(newest.predecessorId).toBe(generations.at(-1)?.generationId ?? null);
      generations.push(newest); frozenBodies.push(JSON.stringify((await client.body(newest.generationId)).body));
      const version = project.versionId, digest = project.projectDigest;
      recover(); expect(saved.project!.versionId).toBe(version); expect(saved.project!.projectDigest).toBe(digest);
      expect(saved.documents.projections).toEqual([]); expect(saved.drciDraftPacks).toEqual([]);
      for (const [index, generation] of generations.entries()) expect(JSON.stringify((await client.body(generation.generationId)).body)).toBe(frozenBodies[index]);
      for (const [index, historical] of projects.entries()) {
        expect(JSON.stringify(historical)).toBe(frozenProjects[index]);
        const restored = loadFunctionalResetSession({ getItem: () => JSON.stringify({ ...saved, project: historical }) });
        expect(buildProjectContextSnapshot({ project: restored.project! })).toEqual(buildProjectContextSnapshot({ project: historical }));
      }
      if (!reload && step < 3) { view.unmount(); view = mount(); }
    }
    expect(projects.at(-1)!.canonicalState!.versionHistory.map(v => v.versionId)).toEqual(projects.map(p => p.versionId));
    expect(new Set(generations.map(g => g.project.projectDigest)).size).toBe(4);
    const archive = await offlineArchiveRuntime(saved.sessionId, saved.project!);
    expect((await archive.store.history(archive.access)).entries.filter(g => g.family === "TEMPLATE")).toHaveLength(4);
    expect((await offlineArchiveClient(saved.sessionId, saved.project!).history()).entries.map(g => g.displayVersion)).toEqual([4, 3, 2, 1]);
    expect(Math.max(...packetSizes)).toBeLessThan(80_000);
    expect(dispatches).toEqual({ conversation: 4, workingDraft: 4, doc: 4 });
    expect(logicalDigest(JSON.parse(frozenProjects[0]))).toBe(logicalDigest(projects[0]));
  }, 30_000);
});
