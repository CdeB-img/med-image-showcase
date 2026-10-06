import { loadFunctionalResetSession as readPersistedSessionForTest } from "@/features/protocol-designer/functional-reset/session";
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { openWorkspaceDiagnostic, renderDiagnosticWorkspace as render } from "./diagnostic-workspace-test-render";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import type { ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import { FUNCTIONAL_RESET_STORAGE_KEY } from "../session";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import {
  COLCHICINE_INITIAL,
  COLCHICINE_LATER_MODIFICATION,
  COLCHICINE_MODIFICATION,
  makeFunctionalResetBridgeResponseForRequest,
  makeFunctionalResetContribution,
} from "./functional-reset-fixtures";

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/protocol-designer/product-bridge-client", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/features/protocol-designer/product-bridge-client")>(),
  requestProtocolDesignerBridge: runtime.request,
}));

const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);

describe("FUNCTIONAL-RESET-01 — nominal Protocol Designer", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
    runtime.request.mockImplementation(async (request) => makeFunctionalResetBridgeResponseForRequest(request));
  });
  afterEach(cleanup);

  it("starts with the Standard action and retains the internal Project panel in diagnostics", () => {
    renderDemo();
    expect(screen.getByTestId("functional-reset-workspace")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Plus d’options"));
    fireEvent.click(screen.getByRole("button", { name: "Quitter le diagnostic" }));
    expect(screen.getByTestId("functional-reset-workspace")).toHaveAttribute("data-product-mode", "STANDARD");
    expect(screen.queryByTestId("protocol-designer-development-version")).toBeNull();
    expect(screen.getAllByText(/Décrivez votre projet de recherche/).length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Votre message")).toBeInTheDocument();
    // CURRENT_STRUCTURAL_INVARIANT: no internal Project dump in Standard.
    expect(screen.queryByTestId("functional-research-project")).toBeNull();
    expect(screen.getByRole("button", { name: "Générer la version" })).toBeDisabled();
    openWorkspaceDiagnostic();
    const project = screen.getByTestId("functional-research-project");
    for (const label of ["Question", "Population", "Design", "Intervention", "Comparateur", "Imagerie", "Prélèvements / échantillons", "Éléments à observer ou mesurer", "Temporalité", "Analyse", "Documents"]) {
      expect(within(project).getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(screen.queryByTestId("durable-document-history")).toBeNull();
    expect(within(project).getAllByText("À préciser dans la conversation.")).toHaveLength(10);
    expect(within(project).getByTestId("project-global-progress")).toHaveTextContent("Avancement indicatif0 %");

  });

  it("creates and then updates the Project through two explicit confirmations", async () => {
    const firstRender = renderDemo();
    const composer = screen.getByLabelText("Votre message");
    fireEvent.change(composer, { target: { value: COLCHICINE_INITIAL } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));

    expect(await screen.findByTestId("standard-initial-review-summary")).toBeInTheDocument();
    expect(runtime.request).toHaveBeenLastCalledWith(expect.objectContaining({ currentProject: null }));
    expect(readPersistedSessionForTest(window.localStorage, FUNCTIONAL_RESET_STORAGE_KEY, true).project).toBeNull();
    const callsBeforeFirstConfirmation = runtime.request.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Confirmer les choix et enregistrer" }));
    await waitFor(() => expect(readPersistedSessionForTest(window.localStorage, FUNCTIONAL_RESET_STORAGE_KEY, true).project?.revision).toBe(1));
    expect(runtime.request).toHaveBeenCalledTimes(callsBeforeFirstConfirmation);
    await screen.findByText("Choix enregistrés dans le projet.");
    await waitFor(() => expect(screen.queryByText("NOXIA vous répond…")).not.toBeInTheDocument());

    const project = screen.getByTestId("functional-research-project");
    expect(within(project).getByText("Version 1")).toBeInTheDocument();
    const firstProject = readPersistedSessionForTest(window.localStorage, FUNCTIONAL_RESET_STORAGE_KEY, true).project;
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
      expect.objectContaining({ owner: "SCIENTIFIC_THINKING", state: "AVAILABLE_ON_QRY_DEMAND" }),
      expect.objectContaining({ owner: "IMAGING", state: "PENDING_SPECIALIST_CONTRIBUTION" }),
    ]));
    expect(firstProject.sections.flatMap((section: { elements: Array<{ canonicalPromotion: string }> }) => section.elements).every((element: { canonicalPromotion: string }) => element.canonicalPromotion === "NOT_PERFORMED")).toBe(true);
    for (const value of ["colchicine", "placebo", "infarctus du myocarde", "étude multicentrique", "IRM", "inflammation", "lésions myocardiques", "biomarqueurs sanguins", "taille de l’infarctus"]) {
      expect(within(project).getAllByText(value).length).toBeGreaterThan(0);
    }
    const adoptedProgressBeforeCorrection = screen.getByRole("progressbar", { name: /Avancement indicatif du projet/ }).getAttribute("aria-valuenow");
    const adoptedCountsBeforeCorrection = within(project).getByTestId("project-cockpit-counts").textContent;

    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: COLCHICINE_MODIFICATION } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    const updateReview = await screen.findByTestId("standard-update-review-summary");
    expect(within(updateReview).getAllByText(/IRM : J3–J5/).length).toBeGreaterThan(0);
    expect(within(updateReview).getAllByText(/Âge maximal : 75 ans/).length).toBeGreaterThan(0);
    expect(runtime.request).toHaveBeenLastCalledWith(expect.objectContaining({ currentProject: expect.objectContaining({ contributionRef: "contribution:colchicine-v1" }) }));
    expect(within(project).getByText("Version 1")).toBeInTheDocument();
    expect(within(project).queryByText("Âge maximal : 75 ans")).toBeNull();
    expect(screen.getByRole("progressbar", { name: /Avancement indicatif du projet/ })).toHaveAttribute("aria-valuenow", adoptedProgressBeforeCorrection);
    expect(within(project).getByTestId("project-cockpit-counts")).toHaveTextContent(adoptedCountsBeforeCorrection!);
    const callsBeforeSecondConfirmation = runtime.request.mock.calls.length;
    fireEvent.click(screen.getByRole("button", { name: "Confirmer les choix et enregistrer" }));
    await waitFor(() => expect(readPersistedSessionForTest(window.localStorage, FUNCTIONAL_RESET_STORAGE_KEY, true).project?.revision).toBe(2));
    expect(runtime.request).toHaveBeenCalledTimes(callsBeforeSecondConfirmation);
    await waitFor(() => expect(screen.queryByText("NOXIA vous répond…")).not.toBeInTheDocument());

    expect(within(project).getByText("Version 2")).toBeInTheDocument();
    expect(within(project).getByTestId("project-cockpit-counts").textContent).not.toBe(adoptedCountsBeforeCorrection);
    expect(within(project).getByText("IRM : J3–J5")).toBeInTheDocument();
    expect(within(project).getByText("Âge maximal : 75 ans")).toBeInTheDocument();
    expect(within(project).getByText("biomarqueurs sanguins")).toBeInTheDocument();
    expect(within(project).getByText("taille de l’infarctus")).toBeInTheDocument();

    const adoptedProjectBeforeRefusal = JSON.stringify(readPersistedSessionForTest(window.localStorage, FUNCTIONAL_RESET_STORAGE_KEY, true).project);
    const adoptedProgressBeforeRefusal = screen.getByRole("progressbar", { name: /Avancement indicatif du projet/ }).getAttribute("aria-valuenow");
    const adoptedCountsBeforeRefusal = within(project).getByTestId("project-cockpit-counts").textContent;
    fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: COLCHICINE_LATER_MODIFICATION } });
    fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
    await screen.findByText("IRM : J3–J5 → J5–J7");
    fireEvent.click(screen.getByRole("button", { name: "Refuser cette proposition" }));
    await screen.findByText("Proposition refusée. Le projet est inchangé.");
    expect(JSON.stringify(readPersistedSessionForTest(window.localStorage, FUNCTIONAL_RESET_STORAGE_KEY, true).project)).toBe(adoptedProjectBeforeRefusal);
    expect(within(project).getByText("Version 2")).toBeInTheDocument();
    expect(within(project).getByText("IRM : J3–J5")).toBeInTheDocument();
    expect(within(project).queryByText("IRM : J5–J7")).toBeNull();
    expect(screen.getByRole("progressbar", { name: /Avancement indicatif du projet/ })).toHaveAttribute("aria-valuenow", adoptedProgressBeforeRefusal);
    expect(within(project).getByTestId("project-cockpit-counts")).toHaveTextContent(adoptedCountsBeforeRefusal!);

    firstRender.unmount();
    renderDemo();
    const reloaded = screen.getByTestId("functional-research-project");
    expect(within(reloaded).getByText("Version 2")).toBeInTheDocument();
    expect(within(reloaded).getByText("Âge maximal : 75 ans")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Nouveau projet" }));
    openWorkspaceDiagnostic();
    await waitFor(() => expect(within(screen.getByTestId("functional-research-project")).queryByText("Version 2")).toBeNull());
    expect(screen.getAllByText(/Décrivez votre projet de recherche/).length).toBeGreaterThan(0);
    expect(within(screen.getByTestId("functional-research-project")).queryByText("colchicine")).toBeNull();
    // A new workspace no longer deletes the prior Project.
    expect(readPersistedSessionForTest(window.localStorage, FUNCTIONAL_RESET_STORAGE_KEY, true).project.revision).toBe(2);
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
