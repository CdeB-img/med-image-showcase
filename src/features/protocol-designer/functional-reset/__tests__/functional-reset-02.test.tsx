import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import type { ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import {
  authorizeResearchProjectDocumentHandoff,
  confirmResearchProjectContribution,
} from "@/features/research-project-construction";
import {
  createEmptyFunctionalResetDocumentPortfolio,
  markFunctionalResetDocumentFailure,
  projectDocumentSourceFromFunctionalProject,
  refreshFunctionalResetDocumentPortfolio,
} from "@/features/document-projection";
import { FUNCTIONAL_RESET_STORAGE_KEY } from "../session";
import {
  COLCHICINE_INITIAL,
  COLCHICINE_LATER_MODIFICATION,
  COLCHICINE_MODIFICATION,
  makeFunctionalResetBridgeResponseForRequest,
  makeFunctionalResetContribution,
} from "./functional-reset-fixtures";

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/protocol-designer/product-bridge-client", () => ({
  requestProtocolDesignerBridge: runtime.request,
}));

const authority = {
  actorRef: "functional-reset:test:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const initialTurn: ScientificInterpretationTurn = {
  turnId: "turn:colchicine:1",
  role: "USER",
  content: COLCHICINE_INITIAL,
  createdAt: "2026-08-20T09:00:00.000Z",
};

const buildProject = () => confirmResearchProjectContribution({
  contribution: makeFunctionalResetContribution([initialTurn]),
  current: null,
  projectId: "research-project:functional-reset-02",
  authority,
  confirmedAt: "2026-08-20T09:01:00.000Z",
});

const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);

const submit = (content: string) => {
  fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: content } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
};

describe("FUNCTIONAL-RESET-02 — Project vers documents", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
    runtime.request.mockImplementation(async (request) => makeFunctionalResetBridgeResponseForRequest(request));
  });
  afterEach(cleanup);

  it("FR02-P01/P02/P03/P07/P09/P14/P15 — keeps ownership and produces a real DOC projection", () => {
    const project = buildProject();
    const projectBefore = JSON.stringify(project);
    expect(project).not.toHaveProperty("documentProjections");
    expect(project.llmProjectWrites).toBe(0);

    const inspected = refreshFunctionalResetDocumentPortfolio({
      project,
      previous: createEmptyFunctionalResetDocumentPortfolio(),
      requestedAt: "2026-08-20T09:02:00.000Z",
    });
    expect(inspected.owner).toBe("DOC-001");
    expect(inspected.cards.find((card) => card.kind === "PROTOCOL")).toMatchObject({
      templateStatus: expect.any(String),
      projectionReadiness: null,
      canRequestProjection: true,
    });
    expect(inspected.cards.find((card) => card.kind === "DMP")?.templateStatus).toBe("FUTURE_PROJECTION");
    expect(inspected.cards.find((card) => card.kind === "SAP")?.templateStatus).toBe("FUTURE_PROJECTION");

    const decision = authorizeResearchProjectDocumentHandoff({
      project,
      authority,
      confirmedAt: "2026-08-20T09:03:00.000Z",
    });
    expect(decision).toMatchObject({
      status: "ADOPTED",
      actor: authority.actorRef,
      mandate: "PROJECT_OWNER",
      projectVersion: project.versionId,
      engineSource: "RESEARCH_PROJECT",
    });
    const source = projectDocumentSourceFromFunctionalProject(project, decision);
    expect(source).toMatchObject({
      projectionNotice: "RUNTIME_PROJECT_PROJECTION_DOES_NOT_OWN_CANONICAL_TRUTH",
      candidateVersion: { status: "FROZEN_BY_HUMAN", versionId: project.versionId },
      documentHandoff: { status: "AUTHORIZED", boundary: "NO_DOCUMENT_GENERATED_DOCUMENT_ENGINE_OWNS_PROJECTIONS" },
      provenance: { llmContributionStatus: "NO_LLM_SCIENTIFIC_DECISION" },
    });
    expect(source.imagingContribution.requiredFutureReviews.join(" ")).toContain("Imaging conserve");
    expect(source.biostatisticsRequirements.status).toBe("SPECIALIZED_ENGINE_REQUIRED");

    const generated = refreshFunctionalResetDocumentPortfolio({
      project,
      previous: inspected,
      handoffDecision: decision,
      requestedAt: "2026-08-20T09:04:00.000Z",
      generateProtocol: true,
    });
    const projection = generated.projections.at(-1)!;
    expect(projection).toMatchObject({
      projectionType: "PROTOCOL",
      ownership: {
        structure: "TMP-001",
        content: "RESEARCH_PROJECT_AND_UPSTREAM_OWNERS",
        editorialForm: "DOC-001",
      },
      source: {
        projectId: project.projectId,
        projectVersion: project.versionId,
        projectDigest: project.projectDigest,
        template: expect.objectContaining({ templateInstanceId: expect.any(String) }),
      },
      boundary: "READ_ONLY_PROJECTION_NOT_PROJECT_TRUTH_NOT_CLINICAL_PROTOCOL",
    });
    expect(projection.audit).toMatchObject({ passed: true, counts: { ERROR: 0 } });
    expect(projection.sections.flatMap((section) => section.blocks.flatMap((block) => block.items)).join(" ")).toContain("colchicine");
    expect(projection.sections.flatMap((section) => section.blocks.flatMap((block) => block.items)).join(" ")).toContain("taille de l’infarctus");
    expect(generated.cards.find((card) => card.kind === "PROTOCOL")).toMatchObject({
      projectionReadiness: projection.readiness,
      freshness: "CURRENT",
      canOpen: true,
      projectionId: projection.projectionId,
    });
    expect(JSON.stringify(project)).toBe(projectBefore);
  });

  it("FR02-P04/P05/P06/P08/P10/P11/P12/P13 — completes the colchicine product vertical", async () => {
    const firstRender = renderDemo();
    submit(COLCHICINE_INITIAL);
    await screen.findByRole("heading", { name: "J’ai suffisamment d’éléments pour vous proposer une première structure d’étude." });
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));

    const projectPanel = screen.getByTestId("functional-research-project");
    expect(await within(projectPanel).findByText("Construction en cours")).toBeInTheDocument();
    expect(within(projectPanel).queryByText(/DMP|SAP/)).toBeNull();
    fireEvent.click(within(projectPanel).getByRole("button", { name: "Créer l’aperçu" }));

    const previewV1 = await screen.findByTestId("functional-protocol-preview");
    expect(within(previewV1).getByText("Aperçu produit à partir du Research Project version 1.")).toBeInTheDocument();
    expect(within(previewV1).getAllByText(/colchicine/i).length).toBeGreaterThan(0);
    expect(within(previewV1).getAllByText(/placebo/i).length).toBeGreaterThan(0);
    expect(within(previewV1).getAllByText(/taille de l’infarctus/i).length).toBeGreaterThan(0);
    expect(previewV1.textContent).not.toMatch(/PARTIALLY_GENERATABLE|SOURCE_PROJECT|projectDigest|PROJECTION_STATUS/);
    fireEvent.click(within(previewV1).getByRole("button", { name: "Retour à la conversation" }));

    submit(COLCHICINE_MODIFICATION);
    await screen.findByText("J’ai compris deux modifications :");
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
    expect(await within(projectPanel).findByText("Version 2")).toBeInTheDocument();
    expect(within(projectPanel).getByText("Aperçu à actualiser")).toBeInTheDocument();
    expect(within(projectPanel).getByText("Le projet a évolué depuis le dernier aperçu.")).toBeInTheDocument();
    fireEvent.click(within(projectPanel).getByRole("button", { name: "Actualiser l’aperçu" }));

    const previewV2 = await screen.findByTestId("functional-protocol-preview");
    expect(within(previewV2).getByText("Aperçu produit à partir du Research Project version 2.")).toBeInTheDocument();
    expect(within(previewV2).getByRole("heading", { name: "Population" }).closest("article")).toHaveTextContent(/âge maximal\s*75 ans/i);
    expect(within(previewV2).getByRole("heading", { name: "Temporalité" }).closest("article")).toHaveTextContent(/IRM\s*J3.?J5/i);
    const storedV2 = JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!);
    expect(storedV2.documents.projections).toHaveLength(2);
    expect(storedV2.documents.projections[1].source.projectVersion).toBe(storedV2.project.versionId);

    fireEvent.click(within(previewV2).getByRole("button", { name: "Retour à la conversation" }));
    submit(COLCHICINE_LATER_MODIFICATION);
    await screen.findByText("IRM : J3–J5 → J5–J7");
    fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));
    expect(await within(projectPanel).findByText("Version 3")).toBeInTheDocument();
    expect(within(projectPanel).getByText("IRM : J5–J7")).toBeInTheDocument();
    expect(within(projectPanel).queryByText("IRM : J3–J5")).toBeNull();
    expect(within(projectPanel).getByText("Aperçu à actualiser")).toBeInTheDocument();

    firstRender.unmount();
    renderDemo();
    const reloadedProject = screen.getByTestId("functional-research-project");
    expect(within(reloadedProject).getByText("Version 3")).toBeInTheDocument();
    expect(within(reloadedProject).getByText("Aperçu à actualiser")).toBeInTheDocument();
    expect(screen.getByText(COLCHICINE_LATER_MODIFICATION)).toBeInTheDocument();
    expect(screen.queryByText(/Guided Intake|Orientation|Actor|Mandate|Scientific Reasoning Graph/)).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Recommencer" }));
    await waitFor(() => expect(within(screen.getByTestId("functional-research-project")).queryByText("Version 3")).toBeNull());
    const reset = JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!);
    expect(reset.project).toBeNull();
    expect(reset.documents.projections).toEqual([]);
    expect(reset.runtimeTurns).toEqual([]);
    expect(screen.getByText(/Dites-moi ce que vous souhaitez comprendre/)).toBeInTheDocument();
  });

  it("FR02 error recovery — preserves Project and the prior preview when DOC fails", () => {
    const project = buildProject();
    const decision = authorizeResearchProjectDocumentHandoff({ project, authority, confirmedAt: "2026-08-20T09:03:00.000Z" });
    const current = refreshFunctionalResetDocumentPortfolio({
      project,
      handoffDecision: decision,
      requestedAt: "2026-08-20T09:04:00.000Z",
      generateProtocol: true,
    });
    const changed = { ...project, versionId: `${project.projectId}:version:2`, revision: 2, previousVersionId: project.versionId, projectDigest: "digest:changed" };
    const failed = markFunctionalResetDocumentFailure(changed, current, new Error("TMP_UNAVAILABLE"));
    expect(failed.lastFailure).toMatchObject({ code: "FUNCTIONAL_DOCUMENT_BOUNDARY_ERROR", message: "TMP_UNAVAILABLE" });
    expect(failed.cards.find((card) => card.kind === "PROTOCOL")).toMatchObject({ freshness: "STALE", canOpen: true });
    expect(failed.projections).toEqual(current.projections);
    expect(changed.sections).toEqual(project.sections);
  });
});
