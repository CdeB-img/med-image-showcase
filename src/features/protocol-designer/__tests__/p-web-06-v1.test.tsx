import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import { buildScientificSessionContext, assessQuestionChange, deriveRoutingIntent, preservedScientificTerms } from "../intake/journey";
import { createEmptyInterpretation } from "../intake/schema";
import { matchScenarios } from "../intake/scenarios";
import { buildValidatedIntent, createProtocolDesignerSession, persistSession } from "../intake/session";
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

const storeWorkspace = (routeIntent: RoutingIntent) => {
  const question = "Quelle différence faut-il conserver entre l’OEF et le CMRO₂ en imagerie cérébrale ?";
  const intent = makeIntent(question, "OEF et CMRO₂", "comprendre");
  delete intent.reviews.scientificPurpose;
  delete intent.reviews.phenomenaOfInterest;
  const matches = matchScenarios(intent);
  const session = createProtocolDesignerSession("2026-08-08T00:00:00Z");
  const context = { ...buildScientificSessionContext(intent), routeIntent, centralScientificObject: "OEF et CMRO₂", workingHypotheses: [] };
  persistSession(window.localStorage, {
    ...session, currentStep: 3, originalQuestion: question, validatedIntent: intent,
    scenarioMatches: matches.map((match) => match.scenarioId === "neuro" ? { ...match, status: "MATCH_CONFIRMED" as const } : match),
    confirmedScenarioId: "neuro", scientificContext: context,
  });
};

const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
const resume = async () => {
  renderDemo();
  const button = await screen.findByRole("button", { name: "Reprendre" });
  fireEvent.click(button);
};

describe("P-WEB-06 — Protocol Designer V1", () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(cleanup);

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

  it("renders the Knowledge Assistant as a specialized workspace", async () => {
    storeWorkspace("UNDERSTAND");
    await resume();
    expect(screen.getByRole("heading", { name: "Comprendre une question scientifique" })).toBeInTheDocument();
    expect(screen.getByText(/Réponse construite par NOXIA, centrée sur OEF et CMRO₂/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Explorer ce concept" })).toBeInTheDocument();
  });

  it("preserves the object when moving from understanding to formalization", async () => {
    storeWorkspace("UNDERSTAND");
    await resume();
    fireEvent.click(screen.getByRole("button", { name: "Formaliser une question à partir de cette compréhension" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Transformer une idée en question scientifique" })).toBeInTheDocument());
    expect(screen.getByText(/comment étudier OEF et CMRO₂/)).toBeInTheDocument();
  });

  it("exposes all eight project stages without pretending they are complete", async () => {
    storeWorkspace("DESIGN_STUDY");
    await resume();
    expect(screen.getByText("Étape 1 sur 8")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "8. Documents" }));
    expect(screen.getByText("Étape 8 sur 8")).toBeInTheDocument();
    expect(screen.getByText(/Les éléments non générables resteront visibles/)).toBeInTheDocument();
  });

  it("keeps free text, suggestions and an unknown answer in adaptive questions", async () => {
    storeWorkspace("UNDERSTAND");
    await resume();
    expect(screen.getAllByText(/Question \d+ sur environ \d+/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Je ne sais pas encore" }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Ou répondez avec vos propres mots").length).toBeGreaterThan(0);
  });
});
