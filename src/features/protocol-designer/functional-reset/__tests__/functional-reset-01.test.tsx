import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import type { ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import { FUNCTIONAL_RESET_STORAGE_KEY } from "../session";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import {
  COLCHICINE_INITIAL,
  COLCHICINE_MODIFICATION,
  makeFunctionalResetBridgeResponse,
  makeFunctionalResetContribution,
} from "./functional-reset-fixtures";

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/protocol-designer/product-bridge-client", () => ({
  requestProtocolDesignerBridge: runtime.request,
}));

const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);

describe("FUNCTIONAL-RESET-01 — nominal Protocol Designer", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
    runtime.request.mockImplementation(async ({ conversation }: { conversation: { turns: ScientificInterpretationTurn[] } }) => makeFunctionalResetBridgeResponse(conversation.turns));
  });
  afterEach(cleanup);

  it("starts with one conversation, one Project panel and honest document states", () => {
    renderDemo();
    expect(screen.getByTestId("functional-reset-workspace")).toBeInTheDocument();
    expect(screen.getByText(/Décrivez-moi le projet de recherche/)).toHaveTextContent(/Vous pouvez partir d’une idée simple/);
    expect(screen.getByLabelText("Votre message")).toBeInTheDocument();
    const project = screen.getByTestId("functional-research-project");
    for (const label of ["Question", "Population", "Design", "Intervention", "Comparateur", "Imagerie", "Mesures / biomarqueurs", "Temporalité", "Analyse", "Documents"]) {
      expect(within(project).getByText(label)).toBeInTheDocument();
    }
    expect(within(project).getByText("Construction en cours")).toBeInTheDocument();
    expect(within(project).getAllByText("À préciser dans la conversation.")).toHaveLength(9);
    expect(screen.queryByText(/Actor|Mandate|Branch|Gate|Guided Intake|Orientation/)).toBeNull();
  });

  it("creates and then updates the Project through two explicit confirmations", async () => {
    const firstRender = renderDemo();
    const composer = screen.getByLabelText("Votre message");
    fireEvent.change(composer, { target: { value: COLCHICINE_INITIAL } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    expect(await screen.findByRole("heading", { name: "J’ai suffisamment d’éléments pour vous proposer une première structure d’étude." })).toBeInTheDocument();
    expect(runtime.request).toHaveBeenLastCalledWith(expect.objectContaining({ currentProject: null }));
    expect(screen.getByText("lésions myocardiques")).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!).project).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));

    const project = screen.getByTestId("functional-research-project");
    expect(within(project).getByText("Version 1")).toBeInTheDocument();
    const firstProject = JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!).project;
    expect(firstProject).toMatchObject({
      contract: "RESEARCH_PROJECT_CONSTRUCTION_OWNER_PROJECTION",
      boundary: "PRJ_001_CONTRIBUTION_INTAKE_ADAPTER",
      owner: "RESEARCH_PROJECT",
      canonicalV2Status: "NO_SCIENTIFIC_OBJECT_PROMOTION_CLAIMED",
      contractAdaptation: { adaptationScope: "USER_CONFIRMED_PROJECT_INFORMATION_ONLY_NO_DESIGN_FREEZE_NO_PD003_V2_CANONICAL_PROMOTION" },
      llmProjectWrites: 0,
      confirmationDecision: { status: "ADOPTED", actor: expect.any(String), mandate: "PROJECT_OWNER", engineSource: "RESEARCH_PROJECT" },
    });
    expect(firstProject.specializedResponsibilities).toEqual(expect.arrayContaining([
      expect.objectContaining({ owner: "SCIENTIFIC_THINKING", state: "RETAINED_OUTSIDE_NOMINAL_UX" }),
      expect.objectContaining({ owner: "IMAGING", state: "PENDING_SPECIALIST_CONTRIBUTION" }),
    ]));
    expect(firstProject.sections.flatMap((section: { elements: Array<{ canonicalPromotion: string }> }) => section.elements).every((element: { canonicalPromotion: string }) => element.canonicalPromotion === "NOT_PERFORMED")).toBe(true);
    for (const value of ["colchicine", "placebo", "infarctus du myocarde", "étude multicentrique", "IRM", "inflammation", "lésions myocardiques", "biomarqueurs sanguins", "taille de l’infarctus"]) {
      expect(within(project).getByText(value)).toBeInTheDocument();
    }

    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: COLCHICINE_MODIFICATION } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    expect(await screen.findByText("J’ai compris deux modifications :")).toBeInTheDocument();
    expect(screen.getByText("+ IRM : J3–J5")).toBeInTheDocument();
    expect(screen.getByText("+ Âge maximal : 75 ans")).toBeInTheDocument();
    expect(runtime.request).toHaveBeenLastCalledWith(expect.objectContaining({ currentProject: expect.objectContaining({ contributionRef: "contribution:colchicine-v1" }) }));
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));

    expect(within(project).getByText("Version 2")).toBeInTheDocument();
    expect(within(project).getByText("IRM : J3–J5")).toBeInTheDocument();
    expect(within(project).getByText("Âge maximal : 75 ans")).toBeInTheDocument();
    expect(within(project).getByText("biomarqueurs sanguins")).toBeInTheDocument();
    expect(within(project).getByText("taille de l’infarctus")).toBeInTheDocument();

    firstRender.unmount();
    renderDemo();
    const reloaded = screen.getByTestId("functional-research-project");
    expect(within(reloaded).getByText("Version 2")).toBeInTheDocument();
    expect(within(reloaded).getByText("Âge maximal : 75 ans")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Recommencer" }));
    await waitFor(() => expect(within(screen.getByTestId("functional-research-project")).queryByText("Version 2")).toBeNull());
    expect(screen.getByText(/Décrivez-moi le projet de recherche/)).toBeInTheDocument();
    expect(within(screen.getByTestId("functional-research-project")).queryByText("colchicine")).toBeNull();
  });

  it("keeps the product usable when the runtime fails", async () => {
    runtime.request.mockRejectedValueOnce(new Error("Interprétation scientifique indisponible."));
    renderDemo();
    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: "Une idée de projet" } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Interprétation scientifique indisponible");
    expect(screen.getByLabelText("Votre message")).toBeInTheDocument();
    expect(screen.getByTestId("functional-research-project")).toBeInTheDocument();
  });
});
