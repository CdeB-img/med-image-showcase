import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import { createEmptyInterpretation } from "../intake/schema";
import { buildValidatedIntent, createProtocolDesignerSession, loadProtocolDesignerOwnerSessionV2, persistSession } from "../intake/session";
import { createProtocolDesignerWorkspaceHandoff, inspectProtocolDesignerWorkspaceTransition } from "../intake/workspace-handoff";
import type { ScientificInterpretationContributionEnvelope, V1ScientificInterpretationProjection } from "@/features/scientific-interpretation";
import { buildConversationalSemanticHandoff, type ConversationalTypedSemanticHandoff } from "../conversation/ConversationalHandoffRouter";
import type { ActiveConversationInteraction } from "../conversation/ActiveConversationInteraction";

const bridge = vi.hoisted(() => ({
  projection: null as V1ScientificInterpretationProjection | null,
  routeContribution: null as ScientificInterpretationContributionEnvelope | null,
  typedHandoff: null as ConversationalTypedSemanticHandoff | null,
  routeOutcome: null as unknown,
}));

vi.mock("@/features/scientific-interpretation/ScientificInterpretationWorkspace", () => ({
  default: ({ activeInteractionRequest, onActiveConversationResponse, onOpenStructuredProject, onResumeStructuredProject, renderContinuation }: { activeInteractionRequest?: ActiveConversationInteraction | null; onActiveConversationResponse?: (request: unknown) => unknown; onOpenStructuredProject: (projection: V1ScientificInterpretationProjection) => void; onResumeStructuredProject?: () => void; renderContinuation?: (onOwnerHandoff: () => void, mode: "STANDARD" | "EXPERT") => React.ReactNode }) => <div data-testid="mock-conversation-shell">
    <button type="button" onClick={() => onOpenStructuredProject(bridge.projection!)}>Poursuivre le raisonnement</button>
    {activeInteractionRequest && bridge.routeContribution && bridge.typedHandoff && <button type="button" onClick={() => {
      bridge.routeOutcome = onActiveConversationResponse?.({
        interaction: activeInteractionRequest,
        rawResponse: "Je souhaite maintenant créer un modèle d’étude autour de cela.",
        contribution: bridge.routeContribution,
        projection: bridge.projection,
        typedHandoff: bridge.typedHandoff,
      });
    }}>Répondre à l’orientation active</button>}
    {onResumeStructuredProject && <button type="button" onClick={onResumeStructuredProject}>Reprendre</button>}
    {renderContinuation?.(() => undefined, "STANDARD")}
  </div>,
}));

const projection = (routeIntent: V1ScientificInterpretationProjection["scientificSessionContext"]["routeIntent"] = null): V1ScientificInterpretationProjection => {
  const question = "Comparer deux méthodes quantitatives sans conclure à une causalité.";
  const interpretation = createEmptyInterpretation({ question, language: "fr", schemaVersion: "1.0" });
  interpretation.reformulatedQuestion = question;
  interpretation.scientificPurpose = { value: ["comparer"], origin: "EXPLICIT_USER_STATEMENT", confidence: "HIGH", sourceText: "Comparer", userValidated: true };
  interpretation.phenomenaOfInterest = { value: ["relation non causale entre deux méthodes"], origin: "EXPLICIT_USER_STATEMENT", confidence: "HIGH", sourceText: "sans conclure à une causalité", userValidated: true };
  const validatedIntent = buildValidatedIntent(interpretation, {
    scientificPurpose: { state: "CONFIRMED", reviewedAt: "2026-08-15T08:00:00.000Z" },
    phenomenaOfInterest: { state: "CONFIRMED", reviewedAt: "2026-08-15T08:00:00.000Z" },
  }, question, "2026-08-15T08:00:00.000Z");
  return {
    contractNature: "LEGACY_V1_TRANSITIONAL_PROJECTION_NOT_PD003_V2",
    validatedIntent,
    scientificSessionContext: {
      routeIntent,
      routeConfidence: routeIntent ? "HIGH" : "UNKNOWN",
      routeReasons: routeIntent ? ["Orientation explicitement disponible dans le handoff."] : [],
      centralScientificObject: "deux méthodes quantitatives",
      preservedScientificTerms: ["méthode alpha", "méthode beta"],
      detectedRelationships: ["comparaison non causale"],
      workingHypotheses: [],
      missingInformation: [],
      contextVersion: 1,
      transitions: [],
      currentProjectStage: 1,
      activeDesignSurface: routeIntent === "DESIGN_STUDY" ? "PROJECT_CONSTRUCTION" : "SCIENTIFIC_THINKING",
      interpretationTrace: {
        contributionId: "contribution:prod-ws",
        relations: ["comparaison non causale"],
        polarities: [],
        corrections: [],
        unknowns: [],
        ambiguities: [],
        rejectedOrSuperseded: [],
        provenanceRefs: ["scientific-interpretation-raw:prod-ws"],
        legacyProjectionLosses: [],
      },
    },
    losses: [],
  };
};

const routeContribution = (): ScientificInterpretationContributionEnvelope => ({
  contract: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE",
  contractNature: "RUNTIME_CONTRIBUTION_NOT_PD003_ROOT",
  identity: { contributionId: "contribution:route-answer", contractVersion: "1.0.0", runtimeId: "HYBRID_PRIMARY_STRUCTURED", runtimeVersion: "1.2.0", createdAt: "2026-08-15T08:02:00.000Z", contributionDigest: "digest:route-answer" },
  source: { conversationId: "conversation:route", originalRequest: "Je souhaite maintenant créer un modèle d’étude autour de cela.", turns: [{ turnId: "turn:route", role: "USER", content: "Je souhaite maintenant créer un modèle d’étude autour de cela.", createdAt: "2026-08-15T08:02:00.000Z" }], sourceRefs: ["turn:route"], rawOutputRef: "raw:route", rawOutputDigest: "raw-digest:route" },
  runtimeEvidence: { provider: "TEST", model: "TEST", promptDigest: "prompt", schemaDigest: "schema", configurationDigest: "config", technicalStatus: "AVAILABLE", parseStatus: "PARSED", validationErrors: [] },
  scientificContent: { normalizedUnderstanding: "Comparer deux méthodes quantitatives sans conclure à une causalité.", routeProposal: { route: "DESIGN_STUDY", confidence: 1, reason: "Demande explicite de construction d’étude." }, explicitStatements: [], candidateObjects: [], candidateRelations: [], inferredContext: [], contextualCandidates: [], negationsAndConstraints: [], temporalElements: [], ambiguities: [], unknowns: [], missingInformation: [], correctionsAndSupersessions: [], openDecisions: [], clarificationNeeds: [] },
  epistemicBoundary: { candidateIsAdopted: false, knowledgeSupportIsProjectDecision: false, projectOwnershipTransferred: false, humanDecisionEnvelopeRef: null },
  mapping: [],
  audit: { deterministicFindings: [], semanticAuditFindings: [], unresolvedFindings: [] },
  decisionBoundary: { decisionRequired: true, decisionEnvelopeRef: null, permittedHumanDispositions: ["ACCEPT_WORKING_BASIS"], projectWriteAuthorized: false },
});

describe("V1-PROD-HOTFIX-002 — workspace transition", () => {
  beforeEach(() => {
    window.localStorage.clear();
    bridge.projection = projection();
    bridge.routeContribution = routeContribution();
    bridge.typedHandoff = buildConversationalSemanticHandoff(bridge.routeContribution);
    bridge.routeOutcome = null;
  });
  afterEach(cleanup);

  it("PROD-WS-C01 Confirm understanding alone does not silently create Project truth", () => {
    const handoff = createProtocolDesignerWorkspaceHandoff(projection(), "2026-08-15T08:01:00.000Z");
    expect(handoff.projectConstruction).toBeNull();
    expect(handoff.currentStep).toBe(2);
    expect(handoff.validatedIntent).not.toBeNull();
  });

  it("PROD-WS-C02 Continue reasoning cannot transition to a blank scientific workspace", () => {
    render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Poursuivre le raisonnement" }));
    expect(screen.getByRole("heading", { name: "Que souhaitez-vous faire maintenant ?" })).toBeInTheDocument();
    expect(screen.getByTestId("mock-conversation-shell")).toContainElement(screen.getByRole("button", { name: "Répondre dans la conversation" }));
  });

  it("PROD-WS-C03 Scientific workspace requires a valid Project/workspace source state", () => {
    const pending = createProtocolDesignerWorkspaceHandoff(projection("DESIGN_STUDY"));
    expect(inspectProtocolDesignerWorkspaceTransition(pending)).toBe("PROJECT_CONSTRUCTION_PENDING");
  });

  it("PROD-WS-C04 Successful handoff produces a visible Project-centric workspace", async () => {
    bridge.projection = projection("DESIGN_STUDY");
    render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Poursuivre le raisonnement" }));
    expect(await screen.findByTestId("adaptive-research-workspace")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Votre étude, au même endroit" })).toBeInTheDocument();
  });

  it("PROD-WS-C05 Missing required state produces explicit failure/recovery UI, never null page", async () => {
    persistSession(window.localStorage, { ...createProtocolDesignerSession(), currentStep: 3 });
    render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
    fireEvent.click(await screen.findByRole("button", { name: "Reprendre" }));
    expect(screen.getByRole("alert")).toHaveTextContent("L’espace scientifique n’est pas disponible");
    expect(screen.getByRole("button", { name: "Préciser dans la conversation" })).toBeInTheDocument();
  });

  it("PROD-WS-C06 Reload cannot restore workspace with unusable Project silently", async () => {
    const stale = createProtocolDesignerWorkspaceHandoff(projection());
    persistSession(window.localStorage, { ...stale, currentStep: 3 });
    render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
    fireEvent.click(await screen.findByRole("button", { name: "Reprendre" }));
    expect(screen.getByRole("heading", { name: "Que souhaitez-vous faire maintenant ?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Répondre dans la conversation" })).toBeInTheDocument();
  });

  it("PROD-WS-C07 QRY remains next-action owner after transition", async () => {
    bridge.projection = projection("DESIGN_STUDY");
    render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Poursuivre le raisonnement" }));
    const nextAction = await screen.findByTestId("workspace-next-action");
    expect(nextAction.closest("[aria-label='Prochaine action scientifique']")).not.toBeNull();
    expect(nextAction.querySelector("h3")?.textContent).toBeTruthy();
    expect(readFileSync(resolve(process.cwd(), "src/features/research-project-construction/ResearchProjectConstructionView.tsx"), "utf8")).toContain("buildQueryNavigationProductProjection(result, navigationMemory)");
  });

  it("PROD-WS-C08 No direct UX to Project write is introduced", () => {
    const page = readFileSync(resolve(process.cwd(), "src/pages/ProtocolDesignerDemo.tsx"), "utf8");
    const handoff = readFileSync(resolve(process.cwd(), "src/features/protocol-designer/intake/workspace-handoff.ts"), "utf8");
    expect(handoff).not.toMatch(/executeResearchProjectConstruction|projectWriteAuthorized\s*:\s*true/);
    expect(page).not.toMatch(/projectWriteAuthorized\s*:\s*true/);
    expect(handoff).toContain("createProtocolDesignerSession");
  });

  it("PROD-WS-C09 Candidate remains distinct from adopted", async () => {
    bridge.projection = projection("DESIGN_STUDY");
    render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Poursuivre le raisonnement" }));
    await screen.findByTestId("adaptive-research-workspace");
    await waitFor(() => expect(loadProtocolDesignerOwnerSessionV2(window.localStorage)?.projectConstruction?.result.candidateVersion.status).toBe("CANDIDATE_NOT_FROZEN"));
    expect(loadProtocolDesignerOwnerSessionV2(window.localStorage)?.decision).toBeNull();
  });

  it("PROD-WS-C10 Existing Scientific Interpretation production path remains functional", () => {
    render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
    expect(screen.getByRole("button", { name: "Poursuivre le raisonnement" })).toBeInTheDocument();
  });

  it("PROD-WS-C11 Active ROUTE_INTENT answer closes the orientation gate and enters the next owner surface", async () => {
    render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Poursuivre le raisonnement" }));
    fireEvent.click(await screen.findByRole("button", { name: "Répondre à l’orientation active" }));
    expect(bridge.routeOutcome).toMatchObject({ status: "RESOLVED", feedbackText: "D’accord. Nous allons construire l’étude à partir de cette question." });
    expect(await screen.findByTestId("adaptive-research-workspace")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Que souhaitez-vous faire maintenant ?" })).not.toBeInTheDocument();
  });
});
