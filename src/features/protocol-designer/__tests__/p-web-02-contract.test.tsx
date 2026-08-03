import fs from "node:fs";
import path from "node:path";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesigner from "@/pages/ProtocolDesigner";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import { DEMONSTRATOR_SCENARIOS, INTENT_CHOICES } from "../fixtures";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const demoSource = read("src/pages/ProtocolDesignerDemo.tsx");
const landingSource = read("src/pages/ProtocolDesigner.tsx");
const fixtureSource = read("src/features/protocol-designer/fixtures.ts");
const appSource = read("src/App.tsx");
const headerSource = read("src/components/Header.tsx");
const footerSource = read("src/components/Footer.tsx");
const sitemapSource = read("public/sitemap.xml");
const fabryFixture = JSON.parse(read("src/features/protocol-designer/fixtures/fabry-p0.fixture.json"));

const renderPage = (page: React.ReactElement) => render(
  <HelmetProvider>
    <MemoryRouter>{page}</MemoryRouter>
  </HelmetProvider>,
);

describe("P-WEB-02 — Protocol Designer demonstrator contracts", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    Object.defineProperty(window, "scrollTo", { configurable: true, value: vi.fn() });
  });

  afterEach(() => cleanup());

  it("PWEB02-01 — opens the demonstrator on the intention-first screen", () => {
    renderPage(<ProtocolDesignerDemo />);
    expect(screen.getByRole("heading", { level: 1, name: /quelle est votre intention/i })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /comprendre|comparer|quantifier|examiner|reproduire/i })).toHaveLength(5);
    expect(screen.getByRole("button", { name: /^Autre objectif/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /NXP-000001|RB-003/ })).not.toBeInTheDocument();
  });

  it("PWEB02-02 — exposes exactly the three admitted deterministic scenarios", () => {
    expect(DEMONSTRATOR_SCENARIOS).toHaveLength(3);
    expect(DEMONSTRATOR_SCENARIOS.map((item) => item.program.id)).toEqual(["NXP-000001", "NXP-000002", "NXP-000003"]);
    expect(DEMONSTRATOR_SCENARIOS.map((item) => item.reasoningBook.id)).toEqual(["RB-003", "RB-004", "RB-005"]);
  });

  it("PWEB02-03 — remains deterministic and performs no scientific network call", () => {
    expect(`${demoSource}\n${fixtureSource}`).not.toMatch(/\bfetch\s*\(|axios|XMLHttpRequest|WebSocket|EventSource|openai/i);
  });

  it("PWEB02-04 — records no strategy or decision by default", () => {
    renderPage(<ProtocolDesignerDemo />);
    expect(window.sessionStorage.getItem("noxia-protocol-designer-demo-v1")).toContain('"strategyId":null');
    expect(window.sessionStorage.getItem("noxia-protocol-designer-demo-v1")).toContain('"decisionConfirmed":false');
  });

  it("PWEB02-05 — keeps critical blockers visible at orientation depth", () => {
    expect(DEMONSTRATOR_SCENARIOS.every((item) => item.missingInformation.some((missing) => missing.critical))).toBe(true);
    expect(demoSource).toContain('role="alert"');
    expect(demoSource).toContain("bloqueur");
    expect(demoSource).toContain("criticalBlockers.length > 0 || state.contradiction");
    expect(demoSource).toContain("Contradiction active");
  });

  it("PWEB02-06 — implements all four progressive-disclosure depths", () => {
    const disclosureSource = read("src/features/protocol-designer/DisclosureStack.tsx");
    expect(disclosureSource).toContain("Niveau 0 · Orientation");
    expect(disclosureSource).toContain("Niveau 1 · Compréhension");
    expect(disclosureSource).toContain("Niveau 2 · Exécution");
    expect(disclosureSource).toContain("Niveau 3 · Traçabilité");
    renderPage(<ProtocolDesignerDemo />);
    fireEvent.click(screen.getByRole("button", { name: /^Comprendre Clarifier/ }));
    fireEvent.change(screen.getByLabelText(/formulation de l’intention/i), { target: { value: "Comprendre un construit neurovasculaire." } });
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    fireEvent.click(screen.getByRole("button", { name: /^Neuro-perfusion/ }));
    expect(screen.getByRole("heading", { name: /comprendre la question/i })).toBeInTheDocument();
    expect(screen.getByText("Niveau 0 · Orientation")).toBeInTheDocument();
    expect(screen.getByText("Niveau 3 · Traçabilité")).toBeInTheDocument();
  });

  it("PWEB02-07 — keeps scientific foundations in a secondary view", () => {
    renderPage(<ProtocolDesignerDemo />);
    expect(screen.getByText("Fondations scientifiques")).toBeInTheDocument();
    expect(headerSource).not.toMatch(/NXP-000001|NXP-000002|NXP-000003|RB-003|RB-004|RB-005/);
  });

  it("PWEB02-08 — makes no visible declaration of formal validation or automatic recommendation", () => {
    expect(`${landingSource}\n${demoSource}`).not.toMatch(/PASS PD-011 accord[eé]|scientifiquement valid[eé]|recommandation clinique automatique|activ[eé] en production/i);
    expect(landingSource).toContain("Aucun PASS PD-011");
  });

  it("PWEB02-09 — encodes no clinical protocol or acquisition parameters", () => {
    expect(fixtureSource).not.toMatch(/\b(TR|TE|flip angle|dose|ml\/kg|bolus)\s*[:=]?\s*\d+/i);
    expect(fixtureSource).not.toMatch(/séquence\s+1|puis\s+(?:la\s+)?séquence|protocole\s+recommandé/i);
  });

  it("PWEB02-10 — displays the exact owner and corpus versions", () => {
    expect(DEMONSTRATOR_SCENARIOS.map((item) => [item.program.version, item.reasoningBook.version])).toEqual([["1.1", "1.0"], ["1.2", "1.1"], ["1.1", "1.0"]]);
    expect(DEMONSTRATOR_SCENARIOS.map((item) => item.program.title)).toEqual(["Spectral Imaging", "Cardiac MRI & Quantitative Cardiac Imaging", "Neuro Perfusion & Metabolism"]);
    expect(DEMONSTRATOR_SCENARIOS.map((item) => item.reasoningBook.title)).toEqual(["Reasoning Book 03 — Spectral Imaging", "Reasoning Book 04 — Cardiac MRI & Quantitative Cardiac Imaging", "Reasoning Book 05 — Neuro Perfusion & Metabolism Foundations"]);
    expect(DEMONSTRATOR_SCENARIOS.every((item) => item.knowledgeDate === "2026-08-03" && item.fixtureStatus === "DEMO_FIXTURE_NOT_DYNAMIC")).toBe(true);
    expect(demoSource).toMatch(/program\.version/);
    expect(demoSource).toMatch(/reasoningBook\.version/);
  });

  it("PWEB02-11 — includes mobile-first and wide-screen responsive layouts", () => {
    expect(`${landingSource}\n${demoSource}`).toMatch(/sm:grid-cols|sm:flex-row/);
    expect(`${landingSource}\n${demoSource}`).toMatch(/lg:grid-cols|lg:flex-col/);
    expect(demoSource).toContain("min-w-0");
    expect(demoSource).toContain("overflow-x-clip");
  });

  it("PWEB02-12 — uses native landmarks, buttons, fieldsets and explicit labels", () => {
    renderPage(<ProtocolDesignerDemo />);
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: /étapes/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/formulation de l’intention/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button").every((button) => button.tagName === "BUTTON")).toBe(true);
  });

  it("PWEB02-13 — applies indexable public SEO and noindex follow to the demo", () => {
    expect(landingSource).toContain('const CANONICAL = "https://noxia-imagerie.fr/protocol-designer"');
    expect(landingSource).not.toMatch(/name="robots"[^>]*noindex/);
    expect(demoSource).toContain('<meta name="robots" content="noindex, follow" />');
    expect(sitemapSource).toContain("https://noxia-imagerie.fr/protocol-designer</loc>");
    expect(sitemapSource).not.toContain("https://noxia-imagerie.fr/protocol-designer/demo");
  });

  it("PWEB02-14 — protects reset with explicit confirmation", () => {
    renderPage(<ProtocolDesignerDemo />);
    fireEvent.click(screen.getByRole("button", { name: /réinitialiser/i }));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
    expect(screen.getByText(/seront effacés/i)).toBeInTheDocument();
  });

  it("PWEB02-15 — integrates both routes, the header entry and the existing footer", () => {
    expect(appSource).toContain('path="/protocol-designer"');
    expect(appSource).toContain('path="/protocol-designer/demo"');
    expect(headerSource).toContain('label: "Protocol Designer"');
    expect(landingSource).toContain("<Footer />");
    expect(footerSource).toContain("siteIdentity");
  });

  it("PWEB02-16 — validates provenance, evidence, limits, controversies and gaps for every fixture", () => {
    for (const item of DEMONSTRATOR_SCENARIOS) {
      expect(item.evidence.length).toBeGreaterThan(0);
      expect(item.evidence.every((evidence) => evidence.locator.includes(item.reasoningBook.id))).toBe(true);
      expect(item.limitations.length).toBeGreaterThan(0);
      expect(item.controversy).toBeTruthy();
      expect(item.openQuestion).toBeTruthy();
    }
  });

  it("PWEB02-17 — leaves the external Editorial Engine outside the implementation", () => {
    expect(`${appSource}\n${landingSource}\n${demoSource}\n${fixtureSource}`).not.toMatch(/@editorial-engine|\.\.\/\.\.\/editorial-engine|runNoxiaPilot/);
  });

  it("PWEB02-18 — preserves and does not activate the Fabry P0 candidate", () => {
    expect(fabryFixture).toEqual({ caseId: "PD-P0-FABRY-INTENT-001", intent: "Je souhaite étudier la fibrose myocardique dans la maladie de Fabry.", implementationStatus: "NOT_IMPLEMENTED" });
    expect(`${appSource}\n${landingSource}\n${demoSource}\n${fixtureSource}`).not.toMatch(/fabry-p0|PD-P0-FABRY-INTENT-001|maladie de Fabry/i);
  });

  it("keeps the PD-004 initial-choice budget", () => {
    expect(INTENT_CHOICES).toHaveLength(5);
    expect(demoSource).toContain("DEMO_SCHEMA_VERSION");
    expect(demoSource).toContain("version_conflict");
    window.sessionStorage.setItem("noxia-protocol-designer-demo-v1", JSON.stringify({ schemaVersion: 0, state: {} }));
    renderPage(<ProtocolDesignerDemo />);
    expect(screen.getByText("Conflit de version locale récupéré")).toBeInTheDocument();
  });
});
