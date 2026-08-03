import fs from "node:fs";
import path from "node:path";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesigner from "@/pages/ProtocolDesigner";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");

const renderPage = (page: React.ReactElement) => render(
  <HelmetProvider>
    <MemoryRouter>{page}</MemoryRouter>
  </HelmetProvider>,
);

const enterSpectralScenario = () => {
  fireEvent.click(screen.getByRole("button", { name: /^Comprendre Clarifier/ }));
  fireEvent.change(screen.getByLabelText(/formulation de l’intention/i), { target: { value: "Comprendre une mesure spectrale interprétable." } });
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
  fireEvent.click(screen.getByRole("button", { name: /^Imagerie spectrale/ }));
};

const reachMissingInformation = () => {
  enterSpectralScenario();
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
};

const reachHumanReview = () => {
  reachMissingInformation();
  screen.getAllByRole("button", { name: "Disponible dans mon contexte" }).forEach((button) => fireEvent.click(button));
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
  fireEvent.click(screen.getAllByRole("button", { name: "Retenir pour la revue" })[0]);
  fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
};

describe("P-WEB-03 — regression and prepublication contracts", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    Object.defineProperty(window, "scrollTo", { configurable: true, value: vi.fn() });
    Object.defineProperty(window, "print", { configurable: true, value: vi.fn() });
  });

  afterEach(() => cleanup());

  it("PWEB03-01 — keeps the first functional screen intention-only", () => {
    renderPage(<ProtocolDesignerDemo />);
    expect(screen.getByRole("heading", { name: "Quelle est votre intention ?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Autre objectif/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Imagerie spectrale/ })).not.toBeInTheDocument();
    expect(screen.getByText(/Aucun Programme, Reasoning Book ou choix de modalité/i)).toBeInTheDocument();
  });

  it("PWEB03-02 — produces an explicit out-of-scope report without substituting a corpus", () => {
    renderPage(<ProtocolDesignerDemo />);
    fireEvent.click(screen.getByRole("button", { name: /^Autre objectif/ }));
    fireEvent.change(screen.getByLabelText(/formulation de l’intention/i), { target: { value: "Explorer un objectif hors des trois territoires préparés." } });
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    fireEvent.click(screen.getByRole("button", { name: /Aucun de ces scénarios/ }));
    fireEvent.click(screen.getByRole("button", { name: "Produire le rapport provisoire" }));
    expect(screen.getByRole("heading", { name: "Rapport provisoire de non-évaluabilité" })).toBeInTheDocument();
    expect(screen.getByText(/Aucun corpus propriétaire n’a été substitué/i)).toBeInTheDocument();
    expect(screen.getByText(/ne constitue pas un protocole validé/i)).toBeInTheDocument();
  });

  it("PWEB03-03 — preserves two sourced positions when a contradiction is opened", () => {
    renderPage(<ProtocolDesignerDemo />);
    enterSpectralScenario();
    fireEvent.click(screen.getByRole("button", { name: "Signaler une contradiction" }));
    expect(screen.getByRole("heading", { name: /Position A — comparabilité conditionnelle/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Position B — non-interchangeabilité/ })).toBeInTheDocument();
    expect(screen.getAllByText(/RB-003 v1.0/).length).toBeGreaterThan(1);
  });

  it("PWEB03-04 — reaches a provisional report when critical information remains unknown", () => {
    renderPage(<ProtocolDesignerDemo />);
    reachMissingInformation();
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    expect(screen.getByText(/Sélection désactivée.*rapport provisoire/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    fireEvent.click(screen.getByRole("button", { name: "Produire un rapport provisoire" }));
    expect(screen.getByRole("heading", { name: "Rapport provisoire de raisonnement" })).toBeInTheDocument();
    expect(screen.getByText(/information\(s\) critique\(s\) restent inconnue\(s\)/i)).toBeInTheDocument();
  });

  it("PWEB03-05 — records a justified human outcome and prints it in the report", () => {
    renderPage(<ProtocolDesignerDemo />);
    reachHumanReview();
    fireEvent.click(screen.getByRole("button", { name: "Retenir" }));
    fireEvent.change(screen.getByLabelText("Justification"), { target: { value: "Les dépendances déclarées sont compatibles avec la portée limitée." } });
    fireEvent.change(screen.getByLabelText("Réserves éventuelles"), { target: { value: "Transférabilité externe non démontrée." } });
    fireEvent.change(screen.getByLabelText("Auteur de la décision"), { target: { value: "Auditeur P-WEB-03" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer cette décision humaine" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    expect(screen.getByText(/Décision humaine « Retenir » enregistrée par Auditeur P-WEB-03/)).toBeInTheDocument();
    expect(screen.getByText(/Transférabilité externe non démontrée/)).toBeInTheDocument();
    expect(screen.getByText(/Ce rapport n’a pas été évalué sous PD-011/)).toBeInTheDocument();
  });

  it("PWEB03-06 — invalidates the report and decision after an upstream edit", () => {
    renderPage(<ProtocolDesignerDemo />);
    reachHumanReview();
    fireEvent.click(screen.getByRole("button", { name: "Différer" }));
    fireEvent.change(screen.getByLabelText("Justification"), { target: { value: "Une information secondaire doit être revue." } });
    fireEvent.change(screen.getByLabelText("Auteur de la décision"), { target: { value: "Auditeur" } });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer cette décision humaine" }));
    fireEvent.click(screen.getByRole("button", { name: "Continuer" }));
    fireEvent.click(screen.getByRole("button", { name: "Intention" }));
    fireEvent.change(screen.getByLabelText(/formulation de l’intention/i), { target: { value: "Intention substantiellement modifiée." } });
    expect(screen.getByText("Impact de la modification")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Rapport/ })).toBeDisabled();
    const stored = JSON.parse(window.sessionStorage.getItem("noxia-protocol-designer-demo-v1")!);
    expect(stored.state.decisionConfirmed).toBe(false);
    expect(stored.state.maxStep).toBe(0);
  });

  it("PWEB03-07 — rejects a forged confirmed decision from session storage", () => {
    window.sessionStorage.setItem("noxia-protocol-designer-demo-v1", JSON.stringify({ schemaVersion: 2, state: { step: 6, maxStep: 6, intentId: "understand", scenarioId: "spectral", formulation: "Texte", decisionConfirmed: true } }));
    renderPage(<ProtocolDesignerDemo />);
    expect(screen.getByRole("heading", { name: "Rapport provisoire de raisonnement" })).toBeInTheDocument();
    expect(screen.getByText(/aucune décision humaine enregistrée/i)).toBeInTheDocument();
  });

  it("PWEB03-08 — exposes exact scientific identity, dates and fixture status", () => {
    const fixtures = read("src/features/protocol-designer/fixtures.ts");
    expect(fixtures).toContain("Reasoning Book 05 — Neuro Perfusion & Metabolism Foundations");
    expect(fixtures).toContain("Cardiac MRI & Quantitative Cardiac Imaging");
    expect(fixtures).not.toContain("Quantitative Myocardial Imaging");
    expect(fixtures.match(/DEMO_FIXTURE_NOT_DYNAMIC/g)).toHaveLength(3);
    expect(fixtures.match(/knowledgeDate: "2026-08-03"/g)).toHaveLength(3);
  });

  it("PWEB03-09 — keeps the report header printable and fixes the mobile foundations panel", () => {
    const css = read("src/index.css");
    const demo = read("src/pages/ProtocolDesignerDemo.tsx");
    expect(css).not.toMatch(/\n\s*header,\n\s*#demo-main/);
    expect(css).toContain("#protocol-designer-report header");
    expect(demo).toContain("fixed inset-x-4 top-24");
    expect(demo).toContain("max-h-[70vh] overflow-y-auto");
  });

  it("PWEB03-10 — provides route-specific social metadata and a useful no-JS fallback", () => {
    const landing = read("src/pages/ProtocolDesigner.tsx");
    const html = read("index.html");
    expect(landing).toContain('<meta property="og:url" content={CANONICAL} />');
    expect(landing).toContain('name="twitter:card"');
    expect(landing).toContain("Ce que cette démonstration ne valide pas");
    expect(landing).toContain("Sept étapes, aucune décision cachée");
    expect(html).toContain("NOXIA — Protocol Designer");
    expect(html).toContain("aucune validation PD-011");
  });

  it("PWEB03-11 — keeps the public route indexable and the demo noindex", () => {
    renderPage(<ProtocolDesigner />);
    expect(screen.getByRole("heading", { name: /De l’intention à une décision explicable/ })).toBeInTheDocument();
    const landing = read("src/pages/ProtocolDesigner.tsx");
    const demo = read("src/pages/ProtocolDesignerDemo.tsx");
    expect(landing).not.toContain('name="robots" content="noindex');
    expect(demo).toContain('<meta name="robots" content="noindex, follow" />');
  });

  it("PWEB03-12 — does not animate away keyboard focus rings on navigational controls", () => {
    renderPage(<ProtocolDesigner />);
    const entryLink = screen.getByRole("link", { name: /Ouvrir le démonstrateur/i });
    expect(entryLink).toHaveClass("transition-colors");
    expect(entryLink).not.toHaveClass("transition");
    expect(entryLink).toHaveClass("focus-visible:ring-2", "focus-visible:ring-primary");
    expect(read("src/pages/ProtocolDesigner.tsx")).not.toContain("transition hover:bg-card focus-visible");
    expect(read("src/pages/ProtocolDesignerDemo.tsx")).not.toContain("transition focus-visible");
    expect(read("src/pages/ProtocolDesignerDemo.tsx")).not.toContain("transition hover:bg-primary/10 focus-visible");
  });
});
