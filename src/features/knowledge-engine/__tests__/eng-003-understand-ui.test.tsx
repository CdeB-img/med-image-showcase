import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import KnowledgeUnderstandView from "../KnowledgeUnderstandView";
import { executeKnowledgeEngine } from "../engine";
import { PUBMED_EXTERNAL_PROVIDER } from "../external-evidence/pubmed-provider";
import type { ExternalProviderSearchOutput, ExternalQueryPlan, ExternalSearchProvider } from "../external-evidence/types";
import { parsedSource, providerOutputFixture } from "./fixtures/pubmed-fixtures";

class SequenceExternalProvider implements ExternalSearchProvider {
  readonly definition = PUBMED_EXTERNAL_PROVIDER;
  calls = 0;

  constructor(private readonly outputs: ExternalProviderSearchOutput[]) {}

  async search(_plan: ExternalQueryPlan) {
    const output = this.outputs[Math.min(this.calls, this.outputs.length - 1)];
    this.calls += 1;
    return output;
  }
}

const renderResult = (question: string, provider?: ExternalSearchProvider, result = executeKnowledgeEngine({ originalQuestion: question })) => {
  render(<KnowledgeUnderstandView result={result} sessionId="eng-003-ui" contextVersion={1} onClarify={vi.fn()} externalProvider={provider} />);
  return result;
};

const currentSource = parsedSource({
  pmid: "43000001",
  doi: "10.1000/eng003.ui",
  title: "Fourier reconstruction in magnetic resonance imaging",
  publicationYear: "2026",
  journal: "Journal of Governed UI Fixtures",
  abstractText: "Fourier reconstruction was evaluated in magnetic resonance imaging.",
  abstractSections: [{ label: "CONCLUSIONS", text: "Fourier reconstruction was evaluated in magnetic resonance imaging." }],
});

const retractedSource = parsedSource({
  pmid: "43000002",
  doi: "10.1000/eng003.retracted",
  title: "Retracted Fourier reconstruction report",
  documentStatus: "RETRACTED",
  eligibility: "RETRACTED",
  publicationTypes: ["Retracted Publication"],
  abstractText: "This content must not support a positive conclusion.",
  abstractSections: [{ label: "CONCLUSIONS", text: "This content must not support a positive conclusion." }],
});

describe("ENG-003 — interface UNDERSTAND et preuve externe progressive", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(cleanup);

  it("ne propose aucune recherche quand le corpus interne couvre la question", () => {
    renderResult("Comprendre le CT spectral et le photon counting CT.");
    expect(screen.getByText("Preuves internes — corpus NOXIA")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Rechercher les publications disponibles" })).not.toBeInTheDocument();
    expect(screen.queryByText("Preuves externes candidates — recherche documentaire")).not.toBeInTheDocument();
  });

  it("expose la recherche comme un contrôle natif focalisable", () => {
    renderResult("Expliquer la transformée de Fourier en IRM.", new SequenceExternalProvider([providerOutputFixture([currentSource])]));
    const button = screen.getByRole("button", { name: "Rechercher les publications disponibles" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toBeEnabled();
    button.focus();
    expect(document.activeElement).toBe(button);
    expect(button.className).toContain("focus");
  });

  it("sépare une source candidate réussie sans remplacer la réponse interne", async () => {
    const provider = new SequenceExternalProvider([providerOutputFixture([currentSource])]);
    renderResult("Expliquer la transformée de Fourier en IRM.", provider);
    expect(screen.getByText("Connaissance interne absente")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Rechercher les publications disponibles" }));
    expect(await screen.findByText("Preuves externes candidates — recherche documentaire")).toBeInTheDocument();
    expect(screen.getByText(currentSource.title)).toBeInTheDocument();
    expect(screen.getByText(/PMID 43000001 · DOI 10.1000\/eng003.ui/)).toBeInTheDocument();
    expect(screen.getByText("Assertion candidate depuis la conclusion structurée")).toBeInTheDocument();
    expect(screen.getByText("Connaissance interne absente")).toBeInTheDocument();
    expect(provider.calls).toBe(1);
  });

  it("distingue une requête sans correspondance d’une absence de connaissance", async () => {
    renderResult("Expliquer la transformée de Fourier en IRM.", new SequenceExternalProvider([providerOutputFixture([], "NO_MATCH")]));
    fireEvent.click(screen.getByRole("button", { name: "Rechercher les publications disponibles" }));
    expect(await screen.findByText(/Aucune correspondance n’a été retournée/)).toBeInTheDocument();
    expect(screen.getByText(/Cela ne prouve pas l’absence de littérature/)).toBeInTheDocument();
  });

  it("rend une indisponibilité réessayable et conserve l’interne pendant le retry", async () => {
    const unavailable = providerOutputFixture([], "SOURCE_UNAVAILABLE");
    const provider = new SequenceExternalProvider([unavailable, providerOutputFixture([currentSource])]);
    renderResult("Expliquer la transformée de Fourier en IRM.", provider);
    fireEvent.click(screen.getByRole("button", { name: "Rechercher les publications disponibles" }));
    expect(await screen.findByText("PubMed est temporairement indisponible.")).toBeInTheDocument();
    expect(screen.getByText("Connaissance interne absente")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Réessayer" }));
    expect(await screen.findByText(currentSource.title)).toBeInTheDocument();
    expect(provider.calls).toBe(2);
  });

  it("conserve une source rétractée uniquement dans les exclusions", async () => {
    renderResult("Expliquer la transformée de Fourier en IRM.", new SequenceExternalProvider([providerOutputFixture([retractedSource])]));
    fireEvent.click(screen.getByRole("button", { name: "Rechercher les publications disponibles" }));
    expect(await screen.findByText("Sources écartées de l’extraction positive")).toBeInTheDocument();
    expect(screen.getByText(retractedSource.title)).toBeInTheDocument();
    expect(screen.getByText(/RETRACTED — La source rétractée/)).toBeInTheDocument();
    expect(screen.queryByText("Assertion candidate depuis la conclusion structurée")).not.toBeInTheDocument();
  });

  it("signale une identité interne rétractée sans modifier silencieusement la conclusion", async () => {
    const internal = executeKnowledgeEngine({ originalQuestion: "Expliquer la transformée de Fourier en IRM." });
    const withMatchingIdentity = {
      ...internal,
      sources: [...internal.sources, {
        sourceId: "internal-source:eng-003-divergence",
        revision: "1",
        title: "Internal documentary identity",
        status: "GOVERNED_DOCUMENTARY",
        pmid: retractedSource.pmid,
        doi: retractedSource.doi,
      }],
    };
    renderResult(withMatchingIdentity.request.originalQuestion, new SequenceExternalProvider([providerOutputFixture([retractedSource])]), withMatchingIdentity);
    fireEvent.click(screen.getByRole("button", { name: "Rechercher les publications disponibles" }));
    expect(await screen.findByText(/Divergence d’identité documentaire/)).toBeInTheDocument();
    expect(screen.getByText(/aucune conclusion interne n’est modifiée automatiquement/)).toBeInTheDocument();
    expect(screen.getByText("Connaissance interne absente")).toBeInTheDocument();
  });
});
