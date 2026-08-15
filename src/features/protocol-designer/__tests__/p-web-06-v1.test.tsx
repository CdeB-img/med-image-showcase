import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import { buildScientificSessionContext, assessQuestionChange, deriveRoutingIntent, preservedScientificTerms } from "../intake/journey";
import { createEmptyInterpretation } from "../intake/schema";
import { matchScenarios } from "../intake/scenarios";
import { buildValidatedIntent, createProtocolDesignerSession, invalidateDownstream, persistProtocolDesignerOwnerSessionV2 } from "../intake/session";
import type { HumanFieldReview, InterpretedFieldKey, RoutingIntent } from "../intake/types";

const makeIntent = (question: string, domain: string, purpose: string) => {
  const interpretation = createEmptyInterpretation({ question, language: "fr", schemaVersion: "1.0" });
  interpretation.reformulatedQuestion = question;
  interpretation.scientificDomain = { value: [domain], origin: "EXPLICIT_USER_STATEMENT", confidence: "HIGH", sourceText: domain, userValidated: true };
  interpretation.scientificPurpose = { value: [purpose], origin: "EXPLICIT_USER_STATEMENT", confidence: "HIGH", sourceText: purpose, userValidated: true };
  interpretation.phenomenaOfInterest = { value: [domain], origin: "EXPLICIT_USER_STATEMENT", confidence: "HIGH", sourceText: domain, userValidated: true };
  const reviews = {
    scientificDomain: { state: "CONFIRMED", reviewedAt: "2026-08-08T00:00:00Z" },
    scientificPurpose: { state: "CONFIRMED", reviewedAt: "2026-08-08T00:00:00Z" },
    phenomenaOfInterest: { state: "CONFIRMED", reviewedAt: "2026-08-08T00:00:00Z" },
  } as Partial<Record<InterpretedFieldKey, HumanFieldReview>>;
  return buildValidatedIntent(interpretation, reviews, question, "2026-08-08T00:00:00Z");
};

const storeWorkspace = (routeIntent: RoutingIntent, readyForImaging = false) => {
  const question = readyForImaging
    ? "Comparer l’OEF et le CMRO₂ en imagerie cérébrale."
    : "Quelle différence faut-il conserver entre l’OEF et le CMRO₂ en imagerie cérébrale ?";
  const intent = makeIntent(question, "OEF et CMRO₂", "comprendre");
  if (!readyForImaging) {
    delete intent.reviews.scientificPurpose;
    delete intent.reviews.phenomenaOfInterest;
  }
  const matches = matchScenarios(intent);
  const session = createProtocolDesignerSession("2026-08-08T00:00:00Z");
  const context = {
    ...buildScientificSessionContext(intent),
    routeIntent,
    centralScientificObject: "OEF et CMRO₂",
    workingHypotheses: [],
    activeDesignSurface: readyForImaging ? "IMAGING" as const : "PROJECT_CONSTRUCTION" as const,
  };
  persistProtocolDesignerOwnerSessionV2(window.localStorage, {
    ...session, currentStep: 3, originalQuestion: question, validatedIntent: intent,
    scenarioMatches: matches.map((match) => match.scenarioId === "neuro" ? { ...match, status: "MATCH_CONFIRMED" as const } : match),
    confirmedScenarioId: "neuro", scientificContext: context,
  });
};

const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
const resume = async () => {
  renderDemo();
  await screen.findByTestId("conversational-protocol-designer-shell");
};

describe("P-WEB-06 — Protocol Designer V1", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it("routes an explanatory OEF/CMRO₂ request to UNDERSTAND", () => {
    const intent = makeIntent("Quelle différence physiologique entre l’OEF et le CMRO₂ ?", "OEF et CMRO₂", "comprendre");
    expect(deriveRoutingIntent(intent)).toMatchObject({ routeIntent: "UNDERSTAND", confidence: "HIGH" });
    expect(preservedScientificTerms(intent).map((item) => item.toLocaleLowerCase("fr-FR"))).toEqual(expect.arrayContaining(["oef", "cmro₂"]));
  });

  it("routes a no-reflow idea to FORMALIZE_IDEA without losing the term", () => {
    const intent = makeIntent("Je pense que le no-reflow dépend de plusieurs mécanismes.", "no-reflow", "formaliser une hypothèse");
    expect(deriveRoutingIntent(intent).routeIntent).toBe("FORMALIZE_IDEA");
    expect(preservedScientificTerms(intent)).toContain("no-reflow");
    expect(matchScenarios(intent)[0]?.scenarioId).toBe("cardiac");
  });

  it("routes a CT spectral study request to DESIGN_STUDY", () => {
    const intent = makeIntent("Je veux construire une étude multicentrique en CT spectral.", "CT spectral", "construire une étude");
    expect(deriveRoutingIntent(intent).routeIntent).toBe("DESIGN_STUDY");
    expect(matchScenarios(intent)[0]?.scenarioId).toBe("spectral");
  });

  it("keeps a deliberately vague unsupported request unsupported", () => {
    const intent = makeIntent("Je voudrais faire une recherche en imagerie sans savoir encore sur quoi.", "imagerie", "recherche");
    expect(matchScenarios(intent)).toHaveLength(0);
  });

  it("distinguishes minor and major scientific-question changes", () => {
    expect(assessQuestionChange("Étudier l’OEF en imagerie cérébrale", "Étudier précisément l’OEF en imagerie cérébrale").kind).toBe("MINOR");
    const major = assessQuestionChange("Étudier l’OEF en imagerie cérébrale", "Comparer le T1 mapping et l’ECV en IRM cardiaque");
    expect(major.kind).toBe("MAJOR");
    expect(major.affectedElements).toContain("décision humaine et rapport");
  });

  it("invalidates downstream decisions after a confirmed major change", () => {
    const stored = createProtocolDesignerSession("2026-08-08T00:00:00Z");
    const invalidated = invalidateDownstream({
      ...stored,
      currentStep: 5,
      reportStatus: "FINAL",
      decision: {
        author: "Évaluation précédente",
        outcome: "CONFIRM_ORIENTATION",
        justification: "Décision fondée sur la question initiale.",
        reservations: "",
        decidedAt: "2026-08-08T00:10:00Z",
      },
    }, "Modification majeure confirmée — reconstruction des éléments dépendants");
    expect(invalidated).toMatchObject({ decision: null, reportStatus: "NONE", projectConstruction: null });
    expect(invalidated.invalidatedDownstream).toContain("Modification majeure confirmée — reconstruction des éléments dépendants");
  });

  it("renders the Knowledge Assistant as a specialized workspace", async () => {
    storeWorkspace("UNDERSTAND");
    await resume();
    fireEvent.click(within(screen.getByLabelText("Niveau de détail")).getByRole("button", { name: "Expert" }));
    expect(await screen.findByRole("heading", { name: "Comprendre OEF" })).toBeInTheDocument();
    expect(screen.getByText(/Votre question porte sur OEF/)).toBeInTheDocument();
    expect(screen.getAllByText(/CMRO₂/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Consulter" })).toBeInTheDocument();
  });

  it("preserves the object while the researcher continues from understanding", async () => {
    storeWorkspace("UNDERSTAND");
    await resume();
    fireEvent.click(within(screen.getByLabelText("Niveau de détail")).getByRole("button", { name: "Expert" }));
    expect(await screen.findByRole("heading", { name: "Comprendre OEF" })).toBeInTheDocument();
    expect(screen.getAllByText(/OEF|CMRO₂/).length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Votre question scientifique")).toBeInTheDocument();
  });

  it("exposes all eight Imaging stages when the scientific guard allows the direct Imaging route", async () => {
    storeWorkspace("DESIGN_STUDY", true);
    await resume();
    fireEvent.click(within(screen.getByLabelText("Niveau de détail")).getByRole("button", { name: "Expert" }));
    expect(await screen.findByText("Étape 1 sur environ 8")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "8. Stratégie Imaging" }));
    expect(screen.getByRole("heading", { name: "Stratégie Imaging" })).toBeInTheDocument();
    expect(screen.getByText(/Il exclut dimensionnement, budget, CRF, plan réglementaire et protocole final/)).toBeInTheDocument();
  });

  it("keeps the free-response composer inside the continuous conversation", async () => {
    storeWorkspace("UNDERSTAND");
    await resume();
    expect(await screen.findByTestId("conversation-timeline")).toBeInTheDocument();
    expect(screen.getByLabelText("Votre question scientifique")).toHaveAttribute("maxlength", "4000");
    expect(screen.getByRole("button", { name: "Envoyer" })).toBeInTheDocument();
  });
});
