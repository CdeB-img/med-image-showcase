import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import { buildScientificSessionContext } from "@/features/protocol-designer/intake/journey";
import { createEmptyInterpretation } from "@/features/protocol-designer/intake/schema";
import { confirmScenario, matchScenarios } from "@/features/protocol-designer/intake/scenarios";
import { buildValidatedIntent, createProtocolDesignerSession, persistSession } from "@/features/protocol-designer/intake/session";
import type { HumanFieldReview, InterpretedFieldKey } from "@/features/protocol-designer/intake/types";

const storeUnderstandSession = (question: string, domain: string, confirmedScenarioId?: "spectral" | "cardiac" | "neuro") => {
  const interpretation = createEmptyInterpretation({ question, language: "fr", schemaVersion: "1.0" });
  interpretation.reformulatedQuestion = question;
  interpretation.scientificDomain = { value: [domain], origin: "EXPLICIT_USER_STATEMENT", confidence: "HIGH", sourceText: domain, userValidated: true };
  interpretation.phenomenaOfInterest = { value: [domain], origin: "EXPLICIT_USER_STATEMENT", confidence: "HIGH", sourceText: domain, userValidated: true };
  interpretation.scientificPurpose = { value: ["comprendre"], origin: "EXPLICIT_USER_STATEMENT", confidence: "HIGH", sourceText: "comprendre", userValidated: true };
  const reviews = {
    scientificDomain: { state: "CONFIRMED", reviewedAt: "2026-08-09T00:00:00.000Z" },
    phenomenaOfInterest: { state: "CONFIRMED", reviewedAt: "2026-08-09T00:00:00.000Z" },
    scientificPurpose: { state: "CONFIRMED", reviewedAt: "2026-08-09T00:00:00.000Z" },
  } as Partial<Record<InterpretedFieldKey, HumanFieldReview>>;
  const intent = buildValidatedIntent(interpretation, reviews, question, "2026-08-09T00:00:00.000Z");
  const matches = matchScenarios(intent);
  const session = createProtocolDesignerSession("2026-08-09T00:00:00.000Z");
  persistSession(window.localStorage, {
    ...session,
    currentStep: 3,
    originalQuestion: question,
    validatedIntent: intent,
    scenarioMatches: confirmedScenarioId ? confirmScenario(matches, confirmedScenarioId) : matches,
    confirmedScenarioId: confirmedScenarioId ?? null,
    scientificContext: { ...buildScientificSessionContext(intent), routeIntent: "UNDERSTAND" },
  });
};

const renderStored = async () => {
  render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
  fireEvent.click(await screen.findByRole("button", { name: "Reprendre" }));
};

describe("Knowledge Engine — UNDERSTAND projection", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(cleanup);

  it("renders a covered specialized question from KnowledgeResult sources", async () => {
    storeUnderstandSession("Comprendre le CT spectral et le photon counting CT.", "CT spectral", "spectral");
    await renderStored();
    expect(screen.getByText("SUPPORTED")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Connaissances applicables" })).toBeInTheDocument();
    expect(screen.getByText(/Photon-counting CT uses direct-conversion detectors/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sources et traçabilité" })).toBeInTheDocument();
  });

  it("does not let empty intake fields erase an explicit MRI modality", async () => {
    storeUnderstandSession("Quelle différence entre le T1 mapping et l’ECV en IRM cardiaque ?", "IRM cardiaque", "cardiac");
    await renderStored();
    expect(screen.getByText("SUPPORTED")).toBeInTheDocument();
    expect(screen.queryByText(/ECV_CT =/)).not.toBeInTheDocument();
    expect(screen.queryByText(/myocardial ecv ct/)).not.toBeInTheDocument();
  });

  it("shows partial MRI/CT coverage without dropping either branch", async () => {
    storeUnderstandSession("Comparer IRM vs CT pour étudier la fibrose myocardique.", "fibrose myocardique", "cardiac");
    await renderStored();
    expect(screen.getByText("PARTIAL")).toBeInTheDocument();
    expect(screen.getByText("Branche : IRM")).toBeInTheDocument();
    expect(screen.getByText("Branche : CT")).toBeInTheDocument();
    expect(screen.getByText(/Aucune comparaison générale directe/)).toBeInTheDocument();
  });

  it("shows an honest stop for an uncovered Fourier question without a scenario", async () => {
    storeUnderstandSession("Expliquer la transformée de Fourier en IRM.", "transformée de Fourier");
    await renderStored();
    expect(screen.getByText("NO_PROVIDER")).toBeInTheDocument();
    expect(screen.getByText(/Aucun fournisseur gouverné de cette V1/)).toBeInTheDocument();
    expect(screen.getByText(/Aucune assertion ou déclaration documentaire applicable/)).toBeInTheDocument();
  });

  it("refuses an individual T2 interpretation", async () => {
    render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
    fireEvent.change(screen.getByLabelText("Votre question scientifique"), { target: { value: "J’ai un T2 élevé." } });
    fireEvent.click(screen.getByRole("button", { name: /Commencer la conversation/ }));
    expect(screen.getByText(/NOXIA n’interprète pas une valeur individuelle/)).toBeInTheDocument();
    expect(screen.getByText(/PRIVACY_BLOCKED/)).toBeInTheDocument();
    expect(window.localStorage.length).toBe(0);
  });

  it("keeps a documented contextual divergence visible", async () => {
    storeUnderstandSession("Comprendre l’ECV avec un hématocrite synthétique.", "ECV et hématocrite synthétique", "cardiac");
    await renderStored();
    expect(screen.getByText(/Divergence contextualisée/)).toBeInTheDocument();
  });
});
