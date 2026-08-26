import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation";
import { confirmResearchProjectContribution } from "@/features/research-project-construction";
import type { ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import {
  executeProductUnderstandInteraction,
  routeProductEntry,
} from "../product-entry-routing";
import {
  createFunctionalResetSession,
  FUNCTIONAL_RESET_STORAGE_KEY,
  INITIAL_NOXIA_MESSAGE,
  LEGACY_PROJECT_FIRST_NOXIA_MESSAGE,
  loadFunctionalResetSession,
  persistFunctionalResetSession,
  productEntryPromptForIntent,
} from "../session";
import {
  makeFunctionalResetBridgeResponseForRequest,
  makeFunctionalResetContribution,
} from "./functional-reset-fixtures";

const CASE_A = "Je voudrais comprendre la différence entre le no-reflow et l’obstruction microvasculaire après angioplastie avec pose de stent dans un STEMI, et comment on peut les étudier en IRM cardiaque.";
const CASE_B = "Je voudrais comprendre dans quelles situations l’ECV mesuré en IRM cardiaque et l’ECV mesuré en CT cardiaque sont réellement comparables pour étudier une fibrose myocardique diffuse. Je ne souhaite pas créer d’étude ni de protocole.";
const DESIGN_RETURN = "Je veux maintenant construire une étude à partir de cette question.";
const UNSUPPORTED_OBJECTIVE = "Examiner la concordance des seuils rapportés dans la littérature actuelle.";

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/protocol-designer/product-bridge-client", () => ({
  requestProtocolDesignerBridge: runtime.request,
}));

const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);

const submit = (content: string) => {
  fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: content } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
};

const stored = () => JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!);

const seededSession = (input: { project: boolean; query: boolean }) => {
  const session = createFunctionalResetSession("2026-08-27T08:00:00.000Z");
  const projectTurn: ScientificInterpretationTurn = {
    turnId: "turn:01d:seed-project",
    role: "USER",
    content: "Je veux construire une étude multicentrique comparant la colchicine au placebo après infarctus, avec inflammation et lésions en IRM.",
    createdAt: "2026-08-27T08:00:01.000Z",
  };
  const contribution = makeFunctionalResetContribution([projectTurn]);
  const project = confirmResearchProjectContribution({
    contribution,
    current: null,
    projectId: session.projectId,
    authority: session.projectAuthority,
    confirmedAt: "2026-08-27T08:00:02.000Z",
  });
  const queryNavigation = buildFunctionalResetQueryNavigation({
    project,
    recordedAt: "2026-08-27T08:00:03.000Z",
  });
  return {
    ...session,
    runtimeTurns: [projectTurn],
    currentContribution: contribution,
    project: input.project ? project : null,
    queryNavigation: input.query ? queryNavigation : null,
  };
};

const persistScenario = (input: { project: boolean; query: boolean }) => {
  const session = seededSession(input);
  persistFunctionalResetSession(window.localStorage, session);
  return session;
};

const waitForKnowledge = async () => {
  await screen.findByTestId("product-understand-knowledge-response");
  await waitFor(() => expect(stored().bridgeTraces.at(-1)?.provider).toBe("KNOWLEDGE"));
  return stored();
};

describe("PRODUCT-CHECKPOINT-01D — transversal UNDERSTAND Knowledge path", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
    runtime.request.mockRejectedValue(new Error("GENERIC_PRODUCT_BRIDGE_MUST_NOT_HANDLE_UNDERSTAND"));
  });
  afterEach(cleanup);

  it.each([["A", CASE_A], ["B", CASE_B]])("01/02 routes fresh Case %s through UNDERSTAND and local Knowledge only", async (_label, raw) => {
    renderDemo();
    submit(raw);
    const session = await waitForKnowledge();
    expect(runtime.request).not.toHaveBeenCalled();
    expect(session.project).toBeNull();
    expect(session.documents.projections).toEqual([]);
    expect(session.bridgeTraces.at(-1)).toMatchObject({
      provider: "KNOWLEDGE",
      calls: 0,
      projectWriteCount: 0,
      protocolProjectionCount: 0,
      persistentExtractionCalled: false,
      entryRouting: { routeIntent: "UNDERSTAND" },
    });
  });

  it("03 routes existing Project + Case A through Knowledge and preserves the Project byte-identically", async () => {
    persistScenario({ project: true, query: false });
    renderDemo();
    const before = stored();
    const projectBefore = JSON.stringify(before.project);
    submit(CASE_A);
    const after = await waitForKnowledge();
    expect(JSON.stringify(after.project)).toBe(projectBefore);
    expect(after.queryNavigation).toBeNull();
    expect(after.bridgeTraces.at(-1)).toMatchObject({ provider: "KNOWLEDGE", projectWriteCount: 0 });
    expect(runtime.request).not.toHaveBeenCalled();
  });

  it("04 routes existing Project + pending QRY + Case A through Knowledge without capturing QRY", async () => {
    persistScenario({ project: true, query: true });
    renderDemo();
    const before = stored();
    const projectBefore = JSON.stringify(before.project);
    const queryBefore = JSON.stringify(before.queryNavigation);
    const qryPrompt = before.queryNavigation.standardQuestion?.text;
    submit(CASE_A);
    const after = await waitForKnowledge();
    expect(JSON.stringify(after.project)).toBe(projectBefore);
    expect(JSON.stringify(after.queryNavigation)).toBe(queryBefore);
    expect(after.entries.filter((entry: { content?: string }) => entry.content === qryPrompt)).toHaveLength(0);
    expect(after.bridgeTraces.at(-1)).toMatchObject({ provider: "KNOWLEDGE", qryNeedBefore: before.queryNavigation.currentAction.navigationNeedRefs[0], qryNeedAfter: before.queryNavigation.currentAction.navigationNeedRefs[0] });
    expect(runtime.request).not.toHaveBeenCalled();
  });

  it("05 routes pending-QRY-only + Case B through Knowledge and preserves the pending QRY", async () => {
    persistScenario({ project: false, query: true });
    renderDemo();
    const before = stored();
    const queryBefore = JSON.stringify(before.queryNavigation);
    submit(CASE_B);
    const after = await waitForKnowledge();
    expect(after.project).toBeNull();
    expect(JSON.stringify(after.queryNavigation)).toBe(queryBefore);
    expect(after.bridgeTraces.at(-1)).toMatchObject({ provider: "KNOWLEDGE", projectWriteCount: 0, protocolProjectionCount: 0 });
    expect(runtime.request).not.toHaveBeenCalled();
  });

  it("06–11 keeps UNDERSTAND read-only and excludes the generic LLM bridge", async () => {
    persistScenario({ project: true, query: true });
    renderDemo();
    const before = stored();
    submit(CASE_B);
    const after = await waitForKnowledge();
    expect(runtime.request).not.toHaveBeenCalled();
    expect(JSON.stringify(after.project)).toBe(JSON.stringify(before.project));
    expect(JSON.stringify(after.queryNavigation)).toBe(JSON.stringify(before.queryNavigation));
    expect(after.documents).toEqual(before.documents);
    expect(after.pendingContribution).toEqual(before.pendingContribution);
    expect(after.bridgeTraces.at(-1)).toMatchObject({
      provider: "KNOWLEDGE",
      model: "KE-001@1.2.0",
      calls: 0,
      persistentExtractionCalled: false,
      projectWriteCount: 0,
      protocolProjectionCount: 0,
    });
  });

  it("12–16 preserves sources, evidence, applicability, limitations, contradictions, gaps and provenance", () => {
    const decision = routeProductEntry({ raw: CASE_B, sourceTurnRef: "turn:01d:b", routedAt: "2026-08-27T08:10:00.000Z" });
    const interaction = executeProductUnderstandInteraction({ raw: CASE_B, decision, createdAt: "2026-08-27T08:10:00.000Z" });
    const presentation = interaction.presentation!;
    expect(presentation.sources.length).toBeGreaterThan(0);
    expect(presentation.sources.every((item) => item.sourceRef && item.revision)).toBe(true);
    expect(presentation.evidence.every((item) => item.assertionRef && item.sourceRef && item.relation)).toBe(true);
    expect(presentation.assertions.length).toBeGreaterThan(0);
    expect(presentation.assertions.every((item) => item.applicability)).toBe(true);
    expect(presentation.limitations.length).toBeGreaterThan(0);
    expect(presentation.contradictions.length).toBeGreaterThan(0);
    expect(presentation.gaps.length).toBeGreaterThan(0);
    expect(presentation.provenance.length).toBeGreaterThan(0);
    expect(presentation.engineVersion).toBe("1.2.0");
    expect(presentation.freshness.corpusStateDate).toBeTruthy();
  });

  it("renders scientific evidence through progressive disclosure instead of dropping it", async () => {
    renderDemo();
    submit(CASE_B);
    const response = await screen.findByTestId("product-understand-knowledge-response");
    expect(within(response).getByText(/^Sources \([1-9]\d*\)$/)).toBeInTheDocument();
    expect(within(response).getByText("Applicabilité")).toBeInTheDocument();
    expect(within(response).getByText(/^Limites \([1-9]\d*\)$/)).toBeInTheDocument();
    expect(within(response).getByText(/^Contradictions \/ débats \([1-9]\d*\)$/)).toBeInTheDocument();
    expect(within(response).getByText(/^Lacunes \([1-9]\d*\)$/)).toBeInTheDocument();
    expect(within(response).getByText(/^Provenance et versions \([1-9]\d*\)$/)).toBeInTheDocument();
  });

  it("17–19 derives product copy from the active intent", () => {
    expect(productEntryPromptForIntent("UNDERSTAND")).toBe("Que souhaitez-vous comprendre ou comparer ?");
    expect(productEntryPromptForIntent("FORMALIZE_IDEA")).toContain("idée ou l’intuition scientifique");
    expect(productEntryPromptForIntent("FORMALIZE_IDEA")).not.toContain("projet de recherche");
    expect(productEntryPromptForIntent("DESIGN_STUDY")).toContain("projet de recherche");
  });

  it("20 migrates only the obsolete persisted copy while preserving Project, QRY, conversation and decisions", () => {
    const current = seededSession({ project: true, query: true });
    const historical = {
      ...structuredClone(current),
      contractVersion: "1.6.0",
      entries: [
        { ...current.entries[0], content: LEGACY_PROJECT_FIRST_NOXIA_MESSAGE },
        { entryId: "conversation-entry:preserved", kind: "TEXT", role: "USER", content: "Conversation à préserver", createdAt: "2026-08-27T08:00:04.000Z" },
      ],
    };
    delete (historical as { scientificExecutionTraceLedger?: unknown }).scientificExecutionTraceLedger;
    window.localStorage.setItem(FUNCTIONAL_RESET_STORAGE_KEY, JSON.stringify(historical));
    const loaded = loadFunctionalResetSession(window.localStorage);
    expect(loaded.entries[0]).toMatchObject({ content: INITIAL_NOXIA_MESSAGE });
    expect(loaded.entries[1]).toMatchObject({ content: "Conversation à préserver" });
    expect(loaded.project).toMatchObject({ projectId: current.project?.projectId, versionId: current.project?.versionId, projectDigest: current.project?.projectDigest });
    expect(loaded.queryNavigation).toEqual(current.queryNavigation);
    expect(loaded.currentContribution).toEqual(current.currentContribution);
    expect(loaded.project?.confirmationDecision).toEqual(current.project?.confirmationDecision);
  });

  it("21 answers first when Knowledge can answer and never inserts the unsupported objective", () => {
    const decision = routeProductEntry({ raw: CASE_B, sourceTurnRef: "turn:01d:answer", routedAt: "2026-08-27T08:20:00.000Z" });
    const interaction = executeProductUnderstandInteraction({ raw: CASE_B, decision, createdAt: "2026-08-27T08:20:00.000Z" });
    expect(interaction.assistantReply.split("\n")[0]).toBe(interaction.presentation?.projection.answer);
    expect(interaction.assistantReply.trimStart()).not.toMatch(/^(Quel|Quelle|Souhaitez-vous)/u);
    expect(interaction.assistantReply).not.toContain(UNSUPPORTED_OBJECTIVE);
  });

  it("22 reports insufficient internal Knowledge honestly without an LLM or external fallback", () => {
    const raw = "Je voudrais comprendre la relation entre la protéine locale inconnue NX-UNMAPPED-77 et un phénomène scientifique non documenté.";
    const decision = routeProductEntry({ raw, sourceTurnRef: "turn:01d:uncovered", routedAt: "2026-08-27T08:21:00.000Z", forceUnderstand: true });
    const interaction = executeProductUnderstandInteraction({ raw, decision, createdAt: "2026-08-27T08:21:00.000Z" });
    expect(interaction).toMatchObject({ externalCalls: 0, projectWrites: 0, protocolProjections: 0 });
    expect(interaction.presentation?.projection.boundedConclusion).toContain("connaissances internes");
    expect(interaction.presentation?.projection.boundedConclusion).toContain("aucune recherche externe n’a été réalisée");
    expect(interaction.presentation?.gaps.length).toBeGreaterThan(0);
  });

  it("23–25 returns explicitly to DESIGN_STUDY with context while keeping Project and QRY unchanged", async () => {
    persistScenario({ project: true, query: true });
    runtime.request.mockReset();
    runtime.request.mockImplementation(async (request) => makeFunctionalResetBridgeResponseForRequest(request, null));
    renderDemo();
    submit(CASE_A);
    const afterUnderstand = await waitForKnowledge();
    await waitFor(() => expect(screen.queryByText("NOXIA vous répond…")).toBeNull());
    const projectBeforeReturn = JSON.stringify(afterUnderstand.project);
    const queryBeforeReturn = JSON.stringify(afterUnderstand.queryNavigation);
    const callsBeforeReturn = runtime.request.mock.calls.length;

    submit(DESIGN_RETURN);
    await waitFor(() => expect(runtime.request).toHaveBeenCalledTimes(callsBeforeReturn + 1));
    await waitFor(() => expect(stored().bridgeTraces.at(-1)?.entryRouting?.routeIntent).toBe("DESIGN_STUDY"));
    const afterReturn = stored();
    const request = runtime.request.mock.calls.at(-1)![0];
    expect(request.currentProject).toEqual(afterUnderstand.project);
    expect(request.conversation.interactionContext).toMatchObject({
      owner: "QUERY_NAVIGATION",
      projectVersion: afterUnderstand.project.versionId,
      informationNeedRefs: afterUnderstand.queryNavigation.currentAction.navigationNeedRefs,
    });
    expect(afterReturn.bridgeTraces.at(-1).entryRouting.scientificContext.preservedScientificTerms.map((item: string) => item.toLocaleLowerCase("fr-FR"))).toEqual(expect.arrayContaining([
      "no-reflow",
      "obstruction microvasculaire",
      "angioplastie",
      "stent",
      "stemi",
      "irm cardiaque",
    ]));
    expect(JSON.stringify(afterReturn.project)).toBe(projectBeforeReturn);
    expect(JSON.stringify(afterReturn.queryNavigation)).toBe(queryBeforeReturn);
    expect(afterReturn.pendingContribution).toBeNull();
  });
});
