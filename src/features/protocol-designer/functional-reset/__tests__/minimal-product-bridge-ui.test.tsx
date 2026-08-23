import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import type { ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import { FUNCTIONAL_RESET_STORAGE_KEY } from "../session";
import {
  COLCHICINE_03A_INITIAL,
  makeFunctionalResetBridgeResponse,
  makeFunctionalResetContribution,
} from "./functional-reset-fixtures";

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

describe("MINIMAL PRODUCT BRIDGE — real Functional Reset wiring", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
  });
  afterEach(cleanup);

  it("shows the natural reply and creates no Project candidate for a pure conversation turn", async () => {
    runtime.request.mockImplementationOnce(async ({ conversation }: { conversation: { turns: ScientificInterpretationTurn[] } }) => makeFunctionalResetBridgeResponse(
      conversation.turns,
      null,
      "Cette question sert à vérifier si le projet est monocentrique ou multicentrique, ce qui change sa faisabilité.",
    ));
    renderDemo();
    submit("Pourquoi tu me demandes le nombre de centres ?");
    expect(await screen.findByText(/Cette question sert à vérifier/)).toBeInTheDocument();
    expect(screen.queryByTestId("functional-contribution-review")).toBeNull();
    expect(stored().project).toBeNull();
    expect(stored().bridgeTraces.at(-1)).toMatchObject({
      persistentExtractionCalled: false,
      projectChangeSetCandidate: null,
      calls: 1,
      projectVersionBefore: null,
      projectVersionAfter: null,
    });
  });

  it("requires an explicit accept or reject decision and preserves reload", async () => {
    runtime.request.mockImplementation(async ({ conversation }: { conversation: { turns: ScientificInterpretationTurn[] } }) => makeFunctionalResetBridgeResponse(
      conversation.turns,
      makeFunctionalResetContribution(conversation.turns),
      "Je comprends que vous souhaitez comparer la colchicine au placebo après infarctus.",
    ));
    const first = renderDemo();
    submit(COLCHICINE_03A_INITIAL);
    await screen.findByTestId("functional-contribution-review");
    expect(stored().project).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Refuser cette proposition" }));
    expect(await screen.findByText("Proposition refusée. Le Research Project est inchangé.")).toBeInTheDocument();
    expect(stored().project).toBeNull();
    expect(stored().entries.find((entry: { kind: string }) => entry.kind === "REVIEW")).toMatchObject({
      status: "REJECTED",
      decision: { status: "REJECTED", mandate: "PROJECT_OWNER" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Recommencer" }));
    submit(COLCHICINE_03A_INITIAL);
    await screen.findByTestId("functional-contribution-review");
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
    const projectPanel = screen.getByTestId("functional-research-project");
    expect(await within(projectPanel).findByText("Version 1")).toBeInTheDocument();
    expect(stored().project).toMatchObject({ revision: 1, llmProjectWrites: 0, confirmationDecision: { status: "ADOPTED" } });

    first.unmount();
    renderDemo();
    expect(within(screen.getByTestId("functional-research-project")).getByText("Version 1")).toBeInTheDocument();
  });
});
