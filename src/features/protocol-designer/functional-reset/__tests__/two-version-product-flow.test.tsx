import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import { buildProjectContextSnapshot } from "@/features/research-project-construction";
import { prepareTerraConversation } from "@/features/scientific-thinking/scientific-collaborator-conversation";
import { DRCI_DOCUMENT_KINDS, materializeDrciDraftPack, prepareDrciDraftPack } from "@/features/document-projection/drci-draft-pack";
import { offlineArchiveClient, offlineDocReceipt, resetOfflineArchiveClients } from "@/features/document-projection/__tests__/offline-archive-client";
import type { ProductBridgeRequest } from "../../product-bridge";
import { ProductBridgeClientError } from "../../product-bridge-client";
import { acceptWorkingDraftUpdate, prepareWorkingDraftRequest, type WorkingDraftUpdate } from "../continuous-project-build";
import { createFunctionalResetSession, loadFunctionalResetSession, saveFunctionalResetWorkspaceSession } from "../session";
import { projectPreparationProgress } from "../project-preparation-lifecycle";
import type { TerraScientificResult } from "../contribution-discussion-retention";
import ProtocolDesignerWorkspace from "../ProtocolDesignerWorkspace";
import { controlledStudyProposal, DOMAINS } from "./study-proposal-fixtures";

const bridge = vi.hoisted(() => vi.fn());
vi.mock("../../product-bridge-client", async original => ({ ...await original<object>(), requestProtocolDesignerBridge: bridge,
  ensureServerProjectSnapshot: vi.fn(async () => undefined) }));
vi.mock("@/features/document-projection/generation-archive-client", async original => ({ ...await original<object>(), createDocumentArchiveClient: offlineArchiveClient }));
afterEach(() => { cleanup(); bridge.mockReset(); resetOfflineArchiveClients(); localStorage.clear(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

// SYNTHETIC_CURRENT_CONTRACT / CURRENT_SEMANTIC_INVARIANT. Source-backed
// ECV/healthy adults/France, then an explicit procedure revision. This protects
// authorization/revision and preservation of unresolved science, NOT clinical
// acceptability of biopsy in healthy people nor an ECV-to-histology equivalence.
const initial = "Étudier la relation entre l'âge et l'ECV myocardique chez des adultes sains en France, par IRM cardiaque. "
  + "L'étude est transversale. Sécurité, effectif et analyse détaillée restent ouverts.";
const revision = "Je veux remplacer l’IRM par une biopsie cardiaque.";
const ambiguous = initial.replace("par IRM cardiaque", "par IRM ou biopsie, sans avoir choisi la procédure");
const proposalFor = (request: ProductBridgeRequest) => {
  const p = controlledStudyProposal(prepareWorkingDraftRequest(request).inputDigest, DOMAINS[2]);
  const revised = request.conversation.turns.some(t => t.content === revision);
  const atom = (ref: string, content: string) => ({ ...p.atoms.find(a => a.ref === ref)!, content,
    status: ref === "bounds" ? "OPEN_DECISION" as const : "NOXIA_PROPOSAL" as const });
  p.atoms = [atom("question", "Relation entre l'âge et l'ECV myocardique"), atom("population", "Adultes sains"),
    atom("objective", "Étudier l'association entre l'âge et l'ECV myocardique"), atom("descriptor", "Âge"),
    atom("design", "Étude transversale"), atom("practical", "France"),
    { ...atom("measurement", revised ? "Biopsie cardiaque" : "IRM cardiaque"), semanticKey: "measurement.myocardium", owner: revised ? "OBS" as const : "IMAGING" as const },
    atom("bounds", "Sécurité, effectif, analyse et interprétation du critère après changement de procédure restent ouverts")];
  p.arbitrations = [{ ...p.arbitrations[1], ref: "open-details", material: false, recommendedRefs: [],
    options: [{ ...p.arbitrations[1].options[0], ref: "define-details", atomRefs: ["bounds"] }] }];
  p.dimensioningScenarios = []; p.understanding = ["Choix exprimés et limites non résolues conservés séparément."];
  const source = request.conversation.turns.find(t => t.content === initial || t.content === ambiguous)!;
  const changed = request.conversation.turns.find(t => t.content === revision);
  const update: WorkingDraftUpdate = { requestType: "STUDY_UPDATE", proposal: p, inferredAtomRefs: [], rejectedAtomRefs: [],
    explicitDecisions: p.atoms.filter(a => a.status !== "OPEN_DECISION").map(a => ({ atomRef: a.ref,
      sourceTurnRef: a.ref === "measurement" && changed ? changed.turnId : source.turnId,
      quote: a.ref === "measurement" && changed ? changed.content : source.content })),
    retainedDiscussionBindings: (request.scientificDiscussionContext?.retainedMeaning ?? []).flatMap(e => {
      const a = p.atoms.find(a => a.status !== "OPEN_DECISION" && a.content === e.content);
      return a ? [{ elementRef: e.ref, atomRefs: [a.ref], sourceTurnRef: e.sourceTurnRef }] : [];
    }) };
  return update;
};
const semantic = (text: string): TerraScientificResult => {
  const meanings = text === initial ? ["Relation entre l'âge et l'ECV myocardique", "Adultes sains", "Étude transversale", "France", "IRM cardiaque"]
    : text === revision ? ["Biopsie cardiaque"] : [text];
  return { reply: text === revision ? "La biopsie remplace l’IRM dans votre demande. Sa justification et sa sécurité chez des volontaires sains restent à préciser."
    : text === initial ? "L'étude porte sur l'âge et l'ECV chez des adultes sains en France. Les modalités et la sécurité restent ouvertes."
      : "Ce point reste en discussion, sans changement automatique du projet.",
    userContribution: { coverage: "COMPLETE", nonPersistentReason: null, elements: meanings.map((content, i) => ({ id: `u${i}`, content,
      epistemicState: "USER_STATED", polarity: "AFFIRMED", conditions: [], linkedIds: [] })) },
    assistantContribution: { coverage: "COMPLETE", nonPersistentReason: null, elements: [{ id: "open", content: "Sécurité et analyse détaillée restent ouvertes",
      epistemicState: "OPEN_UNKNOWN", polarity: "UNKNOWN", conditions: [], linkedIds: [] }] }, dispositions: [], candidateBindings: [] };
};
const send = (text: string) => { fireEvent.change(screen.getByRole("textbox", { name: "Votre message" }), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" })); };
const deferred = () => { let release!: () => void; const promise = new Promise<void>(resolve => { release = resolve; }); return { promise, release }; };
const setup = (hold?: { preparation?: ReturnType<typeof deferred>; documents?: ReturnType<typeof deferred>;
  conversation?: ReturnType<typeof deferred>; failPreparationOnce?: boolean }, failDocOnce = false) => {
  vi.spyOn(console, "debug").mockImplementation(() => undefined);
  vi.stubEnv("VITE_PROTOCOL_DESIGNER_CHAT_RUNTIME", "TERRA"); vi.stubEnv("VITE_AUTONOMOUS_PROJECT_BUILD", "ON");
  let saved = createFunctionalResetSession(), failure: unknown;
  const requests: ProductBridgeRequest[] = [], packets: string[] = [];
  bridge.mockImplementation(async (raw: ProductBridgeRequest) => {
    const request = { ...raw, apiVersion: "1.0.0" as const }; requests.push(request);
    try {
      if (request.prepareWorkingDraft) {
        if (requests.filter(r => r.prepareWorkingDraft).length === 1) {
          await hold?.preparation?.promise;
          if (hold?.failPreparationOnce) throw new ProductBridgeClientError("WORKING_DRAFT_FAILED", "Échec déterministe terminal", null);
        }
        const update = proposalFor(request);
        if (request.conversation.turns.some(t => t.content === ambiguous)) {
          const p = update.proposal!, measurement = p.atoms.find(a => a.ref === "measurement")!;
          p.atoms.push({ ...measurement, ref: "biopsy", semanticKey: "alternative.biopsy", content: "Biopsie cardiaque", owner: "OBS" });
          p.atoms.find(a => a.ref === "question")!.dependsOn = ["measurement"];
          p.arbitrations.unshift({ ...p.arbitrations[0], ref: "procedure", label: "la procédure (IRM ou biopsie)", material: true,
            selection: "ONE", recommendedRefs: ["mri"], options: [
              { ...p.arbitrations[0].options[0], ref: "mri", label: "IRM", atomRefs: ["measurement"] },
              { ...p.arbitrations[0].options[0], ref: "histology", label: "Biopsie", atomRefs: ["biopsy"] }] });
          update.explicitDecisions = update.explicitDecisions.filter(d => d.atomRef !== "measurement");
        }
        const accepted = acceptWorkingDraftUpdate(update, request);
        return { workingDraftUpdate: accepted.update, workingStudyProposal: accepted.composition, observability: { providerCalls: [] } };
      }
      if (request.documentDraftRequest) {
        if (requests.filter(r => r.documentDraftRequest).length === 1) {
          await hold?.documents?.promise;
          if (failDocOnce) throw new Error("SYNTHETIC_DOC_FAILED");
        }
        const project = request.currentProject!, source = request.documentDraftRequest, packet = prepareDrciDraftPack(project, source);
        const pack = materializeDrciDraftPack({ documents: DRCI_DOCUMENT_KINDS.map(kind => ({ kind, title: kind,
          sections: [{ title: "Source adoptée", paragraphs: [buildProjectContextSnapshot({ project }).objects.map(o => o.content).join(". ")
            // Structural word envelope only; not a scientific assertion.
            + (kind === "PROTOCOL_SYNOPSIS" ? " Qualification déterministe sans validation clinique ni réglementaire. ".repeat(80) : "")],
          sourceRefs: packet.sourceFacts.map(f => f.ref) }], missingElements: ["Sécurité et interprétation du critère à préciser"] })),
          crfRows: source.crf.fields.map((f, i) => ({ variableRef: f.canonicalVariableId, variableId: `F_${i}`, label: f.label,
            domain: "À préciser", visit: "À préciser", definition: f.label, entryType: "Texte", unit: f.unit, categories: null,
            dataOrigin: "UNSPECIFIED", source: "À préciser", required: "À préciser", condition: null, derivedFrom: [], derivation: null,
            controls: [], analysisImpact: null, specificationStatus: "UNSPECIFIED" })) }, { project, packet, generatedAt: source.handoffDecision.timestamp! });
        return { documentDraftPack: pack, documentPersistenceReceipt: await offlineDocReceipt(saved.sessionId, project,
          request.observabilityContext!.clientRequestId, pack), observability: { providerCalls: [] } };
      }
      packets.push(prepareTerraConversation(request, true).context);
      if (request.conversation.turns.at(-1)!.content === revision) await hold?.conversation?.promise;
      const provider = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ model: "gpt-6.1-sol", status: "completed",
        output: [{ content: [{ type: "output_text", text: JSON.stringify(semantic(request.conversation.turns.at(-1)!.content)) }] }],
        usage: { input_tokens: 100, output_tokens: 80, total_tokens: 180 } })));
      const result = await executeProtocolDesignerBridge({ body: request, apiKey: null, openAiApiKey: "OFFLINE_SYNTHETIC", chatRuntime: "TERRA",
        autonomousProjectBuild: true, fetchImpl: provider, providerAttemptPolicy: "SINGLE_ATTEMPT_FAIL_CLOSED" });
      expect(result.status).toBe(200); return result.body;
    } catch (e) { failure = e; throw e; }
  });
  const mount = () => render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={saved} onSessionChange={async next => {
    const verdict = await saveFunctionalResetWorkspaceSession(localStorage, next); saved = next; return verdict;
  }} /></HelmetProvider>);
  const view = mount();
  return { view, mount, state: () => saved, requests, packets, failure: () => failure };
};
const expectNoInternals = () => {
  for (const text of ["Valider ces choix", "Revoir les choix du projet", "Préparer l’enregistrement", "Voir mon projet"])
    expect(screen.queryByRole("button", { name: text })).toBeNull();
  expect(screen.queryByTestId("project-finalization-card")).toBeNull(); expect(screen.queryAllByRole("checkbox")).toHaveLength(0);
  expect(screen.queryByTestId("project-scroll-panel")).toBeNull();
};
const generate = (name = "Générer la version") => fireEvent.click(screen.getByRole("button", { name }));

describe("Standard single-action two-version scientific flow", () => {
  it("creates V1/G1 then an explicit MRI-to-biopsy V2/G2, preserving immutable history and reload", async () => {
    const h = setup(); expectNoInternals(); send(initial); await screen.findByText(semantic(initial).reply);
    expect(h.requests).toHaveLength(1); expect(h.state().project).toBeNull();
    generate(); generate();
    await screen.findByText("G1 — basée sur le projet V1"); expectNoInternals();
    expect(h.state().project?.revision, String(h.failure())).toBe(1);
    const v1 = JSON.stringify(h.state().project), client = offlineArchiveClient(h.state().sessionId, h.state().project!);
    const g1 = (await client.history()).entries[0], body1 = JSON.stringify((await client.body(g1.generationId)).body);
    expect(screen.getByRole("button", { name: "Documents à jour" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Conception" })); send(revision); await screen.findByText(semantic(revision).reply);
    expect(JSON.stringify(h.state().project)).toBe(v1); expectNoInternals();
    generate("Générer une nouvelle version");
    await screen.findByText("G2 — basée sur le projet V2"); expect(h.state().project?.revision, String(h.failure())).toBe(2);
    const snapshot = buildProjectContextSnapshot({ project: h.state().project! });
    expect(snapshot.objects.some(o => o.content === "Biopsie cardiaque")).toBe(true);
    expect(snapshot.objects.some(o => o.content === "IRM cardiaque")).toBe(false);
    const history = await client.history(); expect(history.entries.map(g => g.displayVersion)).toEqual([2, 1]);
    expect(JSON.stringify((await client.body(g1.generationId)).body)).toBe(body1);
    const body2 = (await client.body(history.entries[0].generationId)).body;
    expect(body2.native.family).toBe("DRCI");
    if (body2.native.family !== "DRCI") throw new Error("Expected native DRCI archive");
    const currentDocumentText = JSON.stringify(body2.native.value.documents);
    expect(currentDocumentText).toContain("Biopsie cardiaque"); expect(currentDocumentText).not.toContain("IRM cardiaque");
    expect(h.state().project!.canonicalState!.versionHistory[0].versionId).toBe(JSON.parse(v1).versionId);
    expect(h.requests.filter(r => r.prepareWorkingDraft)).toHaveLength(2); expect(h.requests.filter(r => r.documentDraftRequest)).toHaveLength(2);
    // An identical complete snapshot certifies no change, not a third version.
    fireEvent.click(screen.getByRole("button", { name: "Conception" }));
    send("Récapitulons sans modifier les choix."); await screen.findByText(semantic("Récapitulons sans modifier les choix.").reply);
    generate("Générer une nouvelle version");
    await waitFor(() => expect(screen.getByRole("button", { name: "Documents à jour" })).toBeDisabled());
    expect(h.state().project?.revision).toBe(2); expect(h.requests.filter(r => r.documentDraftRequest)).toHaveLength(2);
    expect((await client.history()).entries).toHaveLength(2);
    const frozen = loadFunctionalResetSession(localStorage); expect(frozen.project?.projectDigest).toBe(h.state().project?.projectDigest);
    h.view.unmount(); const reload = render(<HelmetProvider><ProtocolDesignerWorkspace initialSession={frozen} /></HelmetProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Protocole / documents" }));
    await within(screen.getByTestId("durable-document-history")).findByText("G2 — basée sur le projet V2");
    expect(screen.getByText("G1 — basée sur le projet V1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Documents à jour" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Conception" })); send("Quelles limites restent à discuter ?");
    await screen.findByText(semantic("Quelles limites restent à discuter ?").reply);
    expect(new TextEncoder().encode(h.packets.at(-1)!).length).toBeLessThan(80_000);
    expect(h.packets.at(-1)).not.toContain("Qualification déterministe sans validation clinique");
    expect(h.packets.at(-1)).not.toContain('"documentDraftPack"'); expectNoInternals(); reload.unmount();
  });
  it("keeps a later turn outside C1 through preparation and DOC and enables the next version", async () => {
    const preparation = deferred(), documents = deferred(), h = setup({ preparation, documents });
    send(initial); await screen.findByText(semantic(initial).reply); generate(); generate();
    await waitFor(() => expect(h.requests.filter(r => r.prepareWorkingDraft)).toHaveLength(1));
    const checkpoint = JSON.stringify(h.state().workingDraftPreparations![0].checkpoint);
    send(revision); await screen.findByText(semantic(revision).reply);
    await act(async () => preparation.release());
    await waitFor(() => expect(h.requests.filter(r => r.documentDraftRequest)).toHaveLength(1));
    expect(buildProjectContextSnapshot({ project: h.state().project! }).objects.some(o => o.content === "IRM cardiaque")).toBe(true);
    expect(h.requests.find(r => r.documentDraftRequest)!.conversation.turns.some(t => t.content === revision)).toBe(false);
    await act(async () => documents.release()); await screen.findByText("G1 — basée sur le projet V1");
    expect(JSON.stringify(h.state().workingDraftPreparations![0].checkpoint)).toBe(checkpoint);
    expect(projectPreparationProgress(h.state()).latestPendingScientificTurnRef).not.toBeNull();
    await waitFor(() => expect(screen.getByRole("button", { name: "Générer une nouvelle version" })).toBeEnabled());
    generate("Générer une nouvelle version"); await screen.findByText("G2 — basée sur le projet V2");
  });
  it("reuses the prepared/adopted checkpoint after a genuine DOC failure without a false Project version", async () => {
    const h = setup(undefined, true); send(initial); await screen.findByText(semantic(initial).reply); generate();
    await waitFor(() => expect(h.state().documents.lastFailure).not.toBeNull());
    expect(h.state().project?.revision).toBe(1); expect(h.requests.filter(r => r.prepareWorkingDraft)).toHaveLength(1);
    await waitFor(() => expect(screen.getByRole("button", { name: "Générer la version" })).toBeEnabled()); generate();
    await screen.findByText("G1 — basée sur le projet V1"); expect(h.state().project?.revision).toBe(1);
    expect(h.requests.filter(r => r.prepareWorkingDraft)).toHaveLength(1);
    expect((await offlineArchiveClient(h.state().sessionId, h.state().project!).history()).entries).toHaveLength(1);
  });
  it("asks one concise question for a required unresolved alternative, without adoption, DOC or repeat preparation", async () => {
    const h = setup(); send(ambiguous); await screen.findByText(semantic(ambiguous).reply); generate();
    await screen.findByText("Quel choix souhaitez-vous retenir pour la procédure (IRM ou biopsie) ?");
    expect(h.state().project, String(h.failure())).toBeNull(); expect(h.requests.filter(r => r.documentDraftRequest)).toHaveLength(0);
    expect(h.requests.filter(r => r.prepareWorkingDraft)).toHaveLength(1); expectNoInternals();
    await waitFor(() => expect(screen.getByRole("button", { name: "Générer la version" })).toBeEnabled()); generate();
    await waitFor(() => expect(screen.getByRole("button", { name: "Générer la version" })).toBeEnabled());
    expect(h.requests.filter(r => r.prepareWorkingDraft)).toHaveLength(1);
    expect(screen.getAllByText("Quel choix souhaitez-vous retenir pour la procédure (IRM ou biopsie) ?")).toHaveLength(1);
    send("Je retiens l'IRM."); await screen.findByText(semantic("Je retiens l'IRM.").reply);
    expect(screen.getByRole("button", { name: "Générer la version" })).toBeEnabled();
    expect(h.state().project).toBeNull();
  });
  it("retains a conversation reply completing after C1 adoption and carries it only into the next version", async () => {
    const preparation = deferred(), documents = deferred(), conversation = deferred(), h = setup({ preparation, documents, conversation });
    send(initial); await screen.findByText(semantic(initial).reply); generate();
    await waitFor(() => expect(h.requests.filter(r => r.prepareWorkingDraft)).toHaveLength(1));
    send(revision); await waitFor(() => expect(h.requests.filter(r => !r.prepareWorkingDraft && !r.documentDraftRequest)).toHaveLength(2));
    await act(async () => preparation.release());
    await waitFor(() => expect(h.state().project?.revision).toBe(1));
    const v1 = JSON.stringify(h.state().project);
    await act(async () => conversation.release()); await screen.findByText(semantic(revision).reply);
    expect(JSON.stringify(h.state().project)).toBe(v1); expect(h.state().workingDraftPreparations![0].decision).toBe("ADOPTED");
    expect(h.state().runtimeTurns.some(t => t.content === "Générer la version")).toBe(true);
    expect(h.state().scientificDiscussionRetention?.sourceCoverage.filter(s => s.classificationOwner === "RESEARCH_PROJECT").length).toBeGreaterThan(0);
    await act(async () => documents.release()); await screen.findByText("G1 — basée sur le projet V1");
    await waitFor(() => expect(screen.getByRole("button", { name: "Générer une nouvelle version" })).toBeEnabled());
    generate("Générer une nouvelle version");
    await waitFor(() => expect(h.state().project?.revision, JSON.stringify({ failure: String(h.failure()),
      preparations: h.state().workingDraftPreparations?.map(p => ({ status: p.status, code: p.code })) })).toBe(2));
    await screen.findByText("G2 — basée sur le projet V2");
  });
  it("retries only on a new explicit click after terminal preparation failure, preserving the failed checkpoint", async () => {
    const h = setup({ failPreparationOnce: true }); send(initial); await screen.findByText(semantic(initial).reply); generate();
    await waitFor(() => expect(h.state().workingDraftPreparations?.[0].status).toBe("FAILED"));
    expect(h.state().project).toBeNull(); expect(h.requests.filter(r => r.prepareWorkingDraft)).toHaveLength(1);
    const failed = JSON.stringify(h.state().workingDraftPreparations![0]);
    await waitFor(() => expect(screen.getByRole("button", { name: "Générer la version" })).toBeEnabled()); generate();
    await screen.findByText("G1 — basée sur le projet V1"); expect(h.state().project?.revision).toBe(1);
    expect(JSON.stringify(h.state().workingDraftPreparations![0])).toBe(failed);
    expect(h.requests.filter(r => r.prepareWorkingDraft)).toHaveLength(2); expect(h.requests.filter(r => r.documentDraftRequest)).toHaveLength(1);
  });
});
