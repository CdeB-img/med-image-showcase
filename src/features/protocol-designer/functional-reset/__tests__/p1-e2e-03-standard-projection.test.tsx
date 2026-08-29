import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import { FUNCTIONAL_RESET_STORAGE_KEY, type FunctionalResetSession } from "../session";
import {
  COLCHICINE_03A_INITIAL,
  COLCHICINE_03A_MODIFICATION,
  makeFunctionalResetBridgeResponseForRequest,
} from "./functional-reset-fixtures";

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/protocol-designer/product-bridge-client", () => ({
  requestProtocolDesignerBridge: runtime.request,
}));

const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);

const storedSession = () => JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!) as FunctionalResetSession;

const submit = (content: string) => {
  fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: content } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
};

describe("P1-E2E-03 — PROD/STANDARD projection wiring", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
    runtime.request.mockImplementation(async (request) => makeFunctionalResetBridgeResponseForRequest(request));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("replays the exact deterministic Standard vertical without creating a second governed state", async () => {
    const createObjectURL = vi.fn(() => "blob:p1-e2e-03-protocol");
    const revokeObjectURL = vi.fn();
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);

    renderDemo();
    const workspace = screen.getByTestId("functional-reset-workspace");
    expect(workspace).toHaveAttribute("data-product-mode", "STANDARD");
    expect(screen.getByRole("button", { name: "Standard" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByTestId("protocol-designer-development-version")).toBeNull();
    expect(screen.queryByTestId("protocol-designer-development-diagnostics")).toBeNull();
    expect(workspace.textContent).not.toMatch(/FUNCTIONAL_RESET_PROTOCOL_DESIGNER_SESSION|projectDigest|contractVersion|NOXIA_PRODUCT_BRIDGE_TRACE|DEV\s*·|SHA/i);
    expect(screen.getByTestId("standard-project-details")).not.toHaveAttribute("open");

    submit(COLCHICINE_03A_INITIAL);
    await screen.findByRole("heading", { name: "J’ai suffisamment d’éléments pour vous proposer une première structure d’étude." });
    expect(storedSession().project).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
    await waitFor(() => expect(screen.queryByText("NOXIA vous répond…")).not.toBeInTheDocument());

    const projectPanel = screen.getByTestId("functional-research-project");
    expect(await within(projectPanel).findByText("Version 1")).toBeInTheDocument();
    expect(within(projectPanel).getByText("Dernière version confirmée par vous")).toBeInTheDocument();
    const v1 = storedSession();
    expect(v1.project).toMatchObject({
      revision: 1,
      owner: "RESEARCH_PROJECT",
      llmProjectWrites: 0,
      confirmationDecision: { status: "ADOPTED", mandate: "PROJECT_OWNER" },
    });
    expect(v1.queryNavigation).toMatchObject({
      owner: "QUERY_NAVIGATION",
      projectionOnly: true,
      sourceOfTruth: false,
      projectWriteAuthorized: false,
      projectRef: v1.project!.projectId,
      projectVersion: v1.project!.versionId,
      projectDigest: v1.project!.projectDigest,
    });
    expect(v1.entries.some((entry) => entry.kind === "TEXT" && entry.role === "NOXIA" && entry.content === v1.queryNavigation?.standardQuestion?.text)).toBe(true);

    const projectV1BeforeDocument = JSON.stringify(v1.project);
    fireEvent.click(within(projectPanel).getByRole("button", { name: "Créer l’aperçu" }));
    const previewV1 = await screen.findByTestId("functional-protocol-preview");
    expect(within(previewV1).getByText("Aperçu produit à partir du Research Project version 1.")).toBeInTheDocument();
    fireEvent.click(within(previewV1).getByRole("button", { name: "Télécharger le protocole (.html)" }));
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(JSON.stringify(storedSession().project)).toBe(projectV1BeforeDocument);
    fireEvent.click(within(previewV1).getByRole("button", { name: "Retour à la conversation" }));

    submit(COLCHICINE_03A_MODIFICATION);
    await screen.findByText("J’ai compris deux modifications :");
    expect(screen.getByText("+ IRM : J3–J5")).toBeInTheDocument();
    expect(screen.getByText("+ Âge maximal : 75 ans")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
    await waitFor(() => expect(screen.queryByText("NOXIA vous répond…")).not.toBeInTheDocument());
    expect(await within(projectPanel).findByText("Version 2")).toBeInTheDocument();
    expect(within(projectPanel).getByText("Aperçu à actualiser")).toBeInTheDocument();

    const staleV1 = storedSession();
    expect(staleV1.project).toMatchObject({
      projectId: v1.project!.projectId,
      revision: 2,
      previousVersionId: v1.project!.versionId,
    });
    expect(staleV1.project!.projectDigest).not.toBe(v1.project!.projectDigest);
    expect(staleV1.documents.projections).toHaveLength(1);
    expect(staleV1.documents.projections[0]!.source).toMatchObject({
      projectId: v1.project!.projectId,
      projectVersion: v1.project!.versionId,
      projectDigest: v1.project!.projectDigest,
    });

    const projectV2BeforeDocument = JSON.stringify(staleV1.project);
    fireEvent.click(within(projectPanel).getByRole("button", { name: "Actualiser l’aperçu" }));
    const previewV2 = await screen.findByTestId("functional-protocol-preview");
    expect(within(previewV2).getByText("Aperçu produit à partir du Research Project version 2.")).toBeInTheDocument();
    expect(within(previewV2).getByRole("heading", { name: "Population" }).closest("article")).toHaveTextContent(/âge maximal\s*75 ans/i);
    expect(within(previewV2).getByRole("heading", { name: "Temporalité" }).closest("article")).toHaveTextContent(/IRM\s*J3.?J5/i);
    fireEvent.click(within(previewV2).getByRole("button", { name: "Télécharger le protocole (.html)" }));

    const v2WithDocuments = storedSession();
    expect(JSON.stringify(v2WithDocuments.project)).toBe(projectV2BeforeDocument);
    expect(v2WithDocuments.documents.projections).toHaveLength(2);
    expect(v2WithDocuments.documents.projections[0]).toEqual(staleV1.documents.projections[0]);
    expect(v2WithDocuments.documents.projections[1]!.source).toMatchObject({
      projectId: v2WithDocuments.project!.projectId,
      projectVersion: v2WithDocuments.project!.versionId,
      projectDigest: v2WithDocuments.project!.projectDigest,
    });
    expect(v2WithDocuments.documents.projections[1]!.seriesId).toBe(v2WithDocuments.documents.projections[0]!.seriesId);
    expect(v2WithDocuments.project).not.toHaveProperty("documentProjections");

    fireEvent.click(within(previewV2).getByRole("button", { name: "Retour à la conversation" }));
    const providerRequestsBeforeSwitch = runtime.request.mock.calls.length;
    const stateBeforeSwitch = window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY);
    fireEvent.click(screen.getByRole("button", { name: "Expert" }));
    expect(workspace).toHaveAttribute("data-product-mode", "EXPERT");
    expect(screen.getByTestId("protocol-designer-development-version")).toHaveTextContent(/^DEV · (LOCAL|[0-9a-f]{7})$/);
    expect(screen.getByTestId("protocol-designer-development-diagnostics")).toHaveTextContent(v2WithDocuments.project!.projectId);
    expect(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)).toBe(stateBeforeSwitch);
    expect(runtime.request).toHaveBeenCalledTimes(providerRequestsBeforeSwitch);

    fireEvent.click(screen.getByRole("button", { name: "Standard" }));
    expect(workspace).toHaveAttribute("data-product-mode", "STANDARD");
    expect(screen.queryByTestId("protocol-designer-development-diagnostics")).toBeNull();
    expect(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)).toBe(stateBeforeSwitch);
    expect(runtime.request).toHaveBeenCalledTimes(providerRequestsBeforeSwitch);

    const history = screen.getByTestId("protocol-history-disclosure");
    fireEvent.click(within(history).getByText("Versions précédentes (1)"));
    fireEvent.click(within(history).getByRole("button", { name: "Ouvrir cette version historique" }));
    const historicalPreview = await screen.findByTestId("functional-protocol-preview");
    expect(within(historicalPreview).getByRole("status")).toHaveTextContent("Le projet a changé depuis cette version du protocole");
    expect(within(historicalPreview).getByRole("button", { name: "Télécharger cette version historique (.html)" })).toBeInTheDocument();
    expect(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)).not.toBe(stateBeforeSwitch);
    const afterHistoricalOpen = storedSession();
    expect(afterHistoricalOpen.project).toEqual(v2WithDocuments.project);
    expect(afterHistoricalOpen.documents.projections).toEqual(v2WithDocuments.documents.projections);
    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(anchorClick).toHaveBeenCalledTimes(2);
  });
});
