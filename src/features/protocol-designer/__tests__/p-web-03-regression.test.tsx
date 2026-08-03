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

describe("P-WEB-03 — preserved validation contracts after P-WEB-04R", () => {
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
  it("keeps the human decision explicit", () => {
    expect(read("src/pages/ProtocolDesignerDemo.tsx")).toContain("NOXIA documente la décision ; il ne la prend pas.");
  });
  it("keeps a provisional report path", () => expect(read("src/pages/ProtocolDesignerDemo.tsx")).toContain("Générer un rapport provisoire"));
  it("keeps PD-011 disclaimer", () => expect(read("src/pages/ProtocolDesignerDemo.tsx")).toContain("ni PASS PD-011"));
  it("keeps print support", () => expect(read("src/pages/ProtocolDesignerDemo.tsx")).toContain("window.print()"));
  it("keeps keyboard-visible focus on the free-text input", () => {
    renderPage(<ProtocolDesignerDemo />);
    expect(screen.getByLabelText("Votre question scientifique")).toHaveClass("focus-visible:ring-2");
  });
  it("keeps responsive grid breakpoints", () => expect(read("src/pages/ProtocolDesignerDemo.tsx")).toMatch(/md:grid-cols|lg:grid-cols/));
  it("does not claim publication readiness", () => expect(read("src/pages/ProtocolDesignerDemo.tsx")).not.toContain("READY_FOR_PUBLICATION"));
});
