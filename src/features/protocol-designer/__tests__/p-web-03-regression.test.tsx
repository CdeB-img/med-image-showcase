import fs from "node:fs";
import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesigner from "@/pages/ProtocolDesigner";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import { DEMONSTRATOR_SCENARIOS } from "../fixtures";

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), "utf8");
const renderPage = (page: React.ReactElement) => render(<HelmetProvider><MemoryRouter>{page}</MemoryRouter></HelmetProvider>);

describe("P-WEB-03 — public and product boundaries after FUNCTIONAL-RESET-01", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(cleanup);

  it("keeps the public landing indexable", () => {
    renderPage(<ProtocolDesigner />);
    expect(screen.getByRole("heading", { name: /De l’intention à une décision explicable/ })).toBeInTheDocument();
    expect(read("src/pages/ProtocolDesigner.tsx")).not.toContain('name="robots" content="noindex');
  });
  it("keeps exact scientific identities and dates", () => {
    expect(DEMONSTRATOR_SCENARIOS.every((item) => item.knowledgeDate === "2026-08-03")).toBe(true);
    expect(DEMONSTRATOR_SCENARIOS[1].reasoningBook.version).toBe("1.1");
  });
  it("keeps fixture status explicit", () => expect(DEMONSTRATOR_SCENARIOS.every((item) => item.fixtureStatus === "DEMO_FIXTURE_NOT_DYNAMIC")).toBe(true));
  it("keeps Project adoption inside the PRJ owner boundary", () => {
    const workspace = read("src/features/protocol-designer/functional-reset/ProtocolDesignerWorkspace.tsx");
    const ownerBoundary = read("src/features/research-project-construction/contribution-owner-boundary.ts");
    expect(workspace).toContain("confirmResearchProjectContribution");
    expect(workspace).not.toMatch(/createHumanDecisionCandidate|engageHumanDecision|buildSections/);
    expect(ownerBoundary).toContain('engineSource: "RESEARCH_PROJECT"');
    expect(ownerBoundary).toContain('canonicalV2Status: "NO_SCIENTIFIC_OBJECT_PROMOTION_CLAIMED"');
    expect(ownerBoundary).toContain("llmProjectWrites: 0");
  });
  it("does not reintroduce the removed report or print surfaces", () => {
    const workspace = read("src/features/protocol-designer/functional-reset/ProtocolDesignerWorkspace.tsx");
    expect(workspace).not.toMatch(/rapport provisoire|window\.print/);
  });
  it("keeps the continuous free-text composer accessible", () => {
    renderPage(<ProtocolDesignerDemo />);
    expect(screen.getByLabelText("Votre message")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Envoyer" })).toBeDisabled();
  });
  it("keeps responsive two-panel and mobile sheet breakpoints", () => {
    const workspace = read("src/features/protocol-designer/functional-reset/ProtocolDesignerWorkspace.tsx");
    expect(workspace).toContain("lg:grid-cols");
    expect(workspace).toContain("SheetContent");
  });
  it("does not claim publication readiness", () => expect(read("src/features/protocol-designer/functional-reset/ProtocolDesignerWorkspace.tsx")).not.toContain("READY_FOR_PUBLICATION"));
});
