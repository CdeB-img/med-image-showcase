import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import { createEmptyInterpretation } from "@/features/protocol-designer/intake/schema";
import { buildValidatedIntent, createProtocolDesignerSession, persistSession } from "@/features/protocol-designer/intake/session";
import DocumentProjectionView from "../DocumentProjectionView";
import { projectDocument } from "../projection";
import type { DocumentProjection, DocumentProjectionRequest } from "../types";
import { makeAuthorizedProject, reviseProject } from "./fixtures";

beforeEach(() => window.localStorage.clear());
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const generate = (request: DocumentProjectionRequest): DocumentProjection => {
  const result = projectDocument(request);
  if (!result.ok) throw new Error("PROJECTION_FAILED");
  return result.projection;
};

const baseRequest = (session: ReturnType<typeof makeAuthorizedProject>): DocumentProjectionRequest => ({
  project: session.result,
  decisionRecords: session.decisionHistory,
  projectionType: "PROTOCOL",
  profile: "RESEARCH_PROTOCOL",
  usage: "SCIENTIFIC_REVIEW",
  audience: "RESEARCH_TEAM",
  requestedAt: "2026-08-10T16:00:00.000Z",
});

describe("DOC-001 — surface DOCUMENT", () => {
  it("montre sections, statuts, limites, décisions et provenance sans édition directe", () => {
    const session = makeAuthorizedProject();
    const projection = generate(baseRequest(session));
    render(<DocumentProjectionView projection={projection} history={[projection]} onReturnToProject={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Protocol — projection documentaire" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sections composées" })).toBeInTheDocument();
    expect(screen.getAllByText(/PARTIALLY_GENERATABLE/).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Limitations").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Décisions humaines et provenance" })).toBeInTheDocument();
    expect(screen.getAllByText("Provenance de la section").length).toBe(projection.sections.length);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exporter en Markdown" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exporter en HTML" })).toBeInTheDocument();
  });

  it("compare deux versions structurellement et revient au Research Project", () => {
    const session = makeAuthorizedProject();
    const first = generate(baseRequest(session));
    const revised = reviseProject(session.result, {
      candidateVersion: { ...session.result.candidateVersion, versionId: "project-version:ui-2", priorVersion: session.result.candidateVersion.versionId },
      contradictions: ["Contradiction conservée pour comparaison UI."],
    });
    const second = generate({ ...baseRequest(session), project: revised, requestedAt: "2026-08-10T17:00:00.000Z", priorProjection: first });
    const onReturn = vi.fn();
    render(<DocumentProjectionView projection={second} history={[first, second]} onReturnToProject={onReturn} />);
    expect(screen.getByText(/modifiée\(s\)/)).toBeInTheDocument();
    expect(screen.getByText(/générabilité modifiée/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Revenir au Research Project" }));
    expect(onReturn).toHaveBeenCalledOnce();
  });

  it("déclenche des exports passifs sans modifier la projection", () => {
    const session = makeAuthorizedProject();
    const projection = generate(baseRequest(session));
    const snapshot = JSON.stringify(projection);
    const createObjectURL = vi.fn(() => "blob:doc-001");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    render(<DocumentProjectionView projection={projection} history={[projection]} onReturnToProject={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Exporter en Markdown" }));
    fireEvent.click(screen.getByRole("button", { name: "Exporter en HTML" }));
    expect(createObjectURL).toHaveBeenCalledTimes(2);
    expect(click).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(projection)).toBe(snapshot);
    click.mockRestore();
  });

  it("expose DOCUMENT comme quatrième parcours après handoff autorisé", async () => {
    const projectConstruction = makeAuthorizedProject();
    const now = "2026-08-10T16:00:00.000Z";
    const question = "Décrire un marqueur dans une Population définie pour une étude de recherche.";
    const interpretation = createEmptyInterpretation({ question, language: "fr", schemaVersion: "1.0" });
    interpretation.reformulatedQuestion = question;
    const intent = buildValidatedIntent(interpretation, {}, question, now);
    const session = createProtocolDesignerSession(now);
    persistSession(window.localStorage, {
      ...session,
      originalQuestion: question,
      validatedIntent: intent,
      currentStep: 3,
      projectConstruction,
      scientificContext: {
        ...session.scientificContext,
        routeIntent: "DOCUMENT",
        routeConfidence: "HIGH",
        routeReasons: ["Handoff Document autorisé."],
        centralScientificObject: "marqueur quantitatif",
        activeDesignSurface: "DOCUMENT_PROJECTION",
      },
    });
    render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
    fireEvent.click(await screen.findByRole("button", { name: "Reprendre" }));
    expect(await screen.findByTestId("document-projection-view")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Composer un document de recherche" })).toBeInTheDocument();
  });
});
