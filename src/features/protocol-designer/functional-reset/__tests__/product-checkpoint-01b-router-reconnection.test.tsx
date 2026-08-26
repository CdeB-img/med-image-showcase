import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import { FUNCTIONAL_RESET_STORAGE_KEY } from "../session";
import {
  executeProductUnderstandInteraction,
  routeProductEntry,
} from "../product-entry-routing";
import {
  COLCHICINE_03A_INITIAL,
  makeFunctionalResetBridgeResponse,
  makeFunctionalResetBridgeResponseForRequest,
} from "./functional-reset-fixtures";

const CASE_A = "Je voudrais comprendre la différence entre le no-reflow et l’obstruction microvasculaire après angioplastie avec pose de stent dans un STEMI, et comment on peut les étudier en IRM cardiaque.";
const CASE_B = "Je voudrais comprendre dans quelles situations l’ECV mesuré en IRM cardiaque et l’ECV mesuré en CT cardiaque sont réellement comparables pour étudier une fibrose myocardique diffuse. Je ne souhaite pas créer d’étude ni de protocole.";
const TRANSITION = "Je veux maintenant construire une étude à partir de cette question.";
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

const storedSession = () => JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!);

describe("PRODUCT-CHECKPOINT-01B — intent-preserving product entry", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
    runtime.request.mockImplementation(async (request) => makeFunctionalResetBridgeResponseForRequest(request));
  });
  afterEach(cleanup);

  it("routes Case A to UNDERSTAND and preserves its complete scientific focus", () => {
    const decision = routeProductEntry({ raw: CASE_A, sourceTurnRef: "turn:a", routedAt: "2026-08-26T10:00:00.000Z" });
    expect(decision).toMatchObject({ domainGate: "IN_SCOPE", routeIntent: "UNDERSTAND", projectConstructionEligible: false, projectWriteAuthorized: false });
    expect(decision.scientificContext.preservedScientificTerms.map((item) => item.toLocaleLowerCase("fr-FR"))).toEqual(expect.arrayContaining([
      "no-reflow",
      "obstruction microvasculaire",
      "angioplastie",
      "stent",
      "stemi",
      "irm cardiaque",
    ]));
    expect(decision.scientificContext.detectedRelationships).toContain("comparaison explicitement demandée");
  });

  it("routes Case B to UNDERSTAND, retains both explicit negatives and never generates the unsupported objective", () => {
    const decision = routeProductEntry({ raw: CASE_B, sourceTurnRef: "turn:b", routedAt: "2026-08-26T10:01:00.000Z" });
    expect(decision).toMatchObject({ domainGate: "IN_SCOPE", routeIntent: "UNDERSTAND", projectConstructionEligible: false });
    expect(decision.explicitExclusions.map((item) => item.code)).toEqual(["NO_STUDY", "NO_PROTOCOL"]);
    expect(decision.explicitExclusions.every((item) => item.sourceText.includes("Je ne souhaite pas créer d’étude ni de protocole."))).toBe(true);
    expect(decision.scientificContext.preservedScientificTerms.map((item) => item.toLocaleLowerCase("fr-FR"))).toEqual(expect.arrayContaining([
      "ecv",
      "irm cardiaque",
      "ct cardiaque",
      "fibrose myocardique diffuse",
    ]));
    const interaction = executeProductUnderstandInteraction({ raw: CASE_B, decision, createdAt: "2026-08-26T10:01:00.000Z" });
    expect(interaction).toMatchObject({ projectWrites: 0, protocolProjections: 0, externalCalls: 0 });
    expect(interaction.assistantReply).not.toContain(UNSUPPORTED_OBJECTIVE);
  });

  it.each([["A", CASE_A], ["B", CASE_B]])("executes Case %s through local Knowledge with zero Project or protocol creation", async (_label, raw) => {
    renderDemo();
    submit(raw);
    await waitFor(() => expect(storedSession().bridgeTraces).toHaveLength(1));
    const stored = storedSession();
    expect(runtime.request).not.toHaveBeenCalled();
    expect(stored.project).toBeNull();
    expect(stored.pendingContribution).toBeNull();
    expect(stored.documents.projections).toEqual([]);
    expect(stored.bridgeTraces[0]).toMatchObject({
      provider: "KNOWLEDGE",
      calls: 0,
      persistentExtractionCalled: false,
      persistentExtractionStatus: "NOT_REQUESTED",
      projectWriteCount: 0,
      protocolProjectionCount: 0,
      entryRouting: { routeIntent: "UNDERSTAND", projectConstructionEligible: false },
    });
    expect(stored.entries.map((entry: { content?: string }) => entry.content ?? "").join("\n")).not.toContain(UNSUPPORTED_OBJECTIVE);
  });

  it("keeps an explicit DESIGN_STUDY entry eligible for Project construction", async () => {
    renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await waitFor(() => expect(runtime.request).toHaveBeenCalledTimes(1));
    expect(runtime.request).toHaveBeenCalledWith(expect.objectContaining({ currentProject: null, evaluatePersistentDelta: true }));
    await waitFor(() => expect(storedSession().bridgeTraces).toHaveLength(1));
    expect(storedSession().bridgeTraces[0].entryRouting).toMatchObject({ routeIntent: "DESIGN_STUDY", projectConstructionEligible: true });
    expect(storedSession().project).toBeNull();
    expect(storedSession().pendingContribution).not.toBeNull();
  });

  it("keeps FORMALIZE_IDEA conversation-only and ineligible for Project construction", () => {
    const decision = routeProductEntry({
      raw: "Je pense que l’inflammation pourrait dépendre du délai après infarctus et je veux formaliser cette hypothèse.",
      sourceTurnRef: "turn:formalize",
      routedAt: "2026-08-26T10:02:00.000Z",
    });
    expect(decision).toMatchObject({
      domainGate: "IN_SCOPE",
      routeIntent: "FORMALIZE_IDEA",
      projectConstructionEligible: false,
      projectWriteAuthorized: false,
    });
  });

  it("allows an explicit UNDERSTAND to DESIGN_STUDY transition without losing Case A context", async () => {
    runtime.request.mockImplementation(async (request) => makeFunctionalResetBridgeResponse(request.conversation.turns, null, "La construction d’étude est maintenant éligible."));
    renderDemo();
    submit(CASE_A);
    await waitFor(() => expect(storedSession().bridgeTraces).toHaveLength(1));
    expect(runtime.request).not.toHaveBeenCalled();

    submit(TRANSITION);
    await waitFor(() => expect(runtime.request).toHaveBeenCalledTimes(1));
    const request = runtime.request.mock.calls[0]![0];
    expect(request.evaluatePersistentDelta).toBe(true);
    expect(request.conversation.turns.filter((item: { role: string }) => item.role === "USER").map((item: { content: string }) => item.content)).toEqual([CASE_A, TRANSITION]);
    await waitFor(() => expect(storedSession().bridgeTraces).toHaveLength(2));
    const routing = storedSession().bridgeTraces[1].entryRouting;
    expect(routing).toMatchObject({ routeIntent: "DESIGN_STUDY", projectConstructionEligible: true });
    expect(routing.scientificContext.centralScientificObject).toBe("no-reflow et obstruction microvasculaire");
    expect(routing.scientificContext.preservedScientificTerms.map((item: string) => item.toLocaleLowerCase("fr-FR"))).toEqual(expect.arrayContaining([
      "no-reflow",
      "obstruction microvasculaire",
      "angioplastie",
      "stent",
      "stemi",
      "irm cardiaque",
    ]));
    expect(routing.scientificContext.transitions).toContainEqual(expect.objectContaining({ from: "UNDERSTAND", to: "DESIGN_STUDY" }));
  });

  it("fails closed before every owner for a patient-level request", async () => {
    renderDemo();
    submit("J’ai un T2 élevé sur mon examen, que dois-je faire ?");
    expect(await screen.findByRole("alert")).toHaveTextContent("ne peut pas être transmise à un owner scientifique");
    await waitFor(() => expect(storedSession().bridgeTraces).toHaveLength(1));
    expect(runtime.request).not.toHaveBeenCalled();
    expect(storedSession().project).toBeNull();
    expect(storedSession().bridgeTraces[0]).toMatchObject({ provider: "DOMAIN_GATE", calls: 0, entryRouting: { domainGate: "OUT_OF_SCOPE", routeIntent: null } });
  });
});
