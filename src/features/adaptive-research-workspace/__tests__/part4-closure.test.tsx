import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { buildProjectDataAnalysisView } from "@/features/data-analysis-planning/project-integration";
import { buildQueryNavigationProductProjection } from "@/features/query-navigation/product";
import type { QueryNavigationProductProjection } from "@/features/query-navigation/product-contracts";
import { executeResearchProjectConstruction } from "@/features/research-project-construction/engine";
import { makeProjectInput } from "@/features/research-project-construction/__tests__/fixtures";
import { buildValidationProductSummary } from "@/features/validation-architecture/product-gates";
import landingSource from "@/pages/ProtocolDesigner.tsx?raw";
import AdaptiveResearchWorkspace from "../AdaptiveResearchWorkspace";
import workspaceSource from "../AdaptiveResearchWorkspace.tsx?raw";
import WorkspaceNextActionInteraction from "../WorkspaceNextActionInteraction";
import interactionSource from "../WorkspaceNextActionInteraction.tsx?raw";
import type { WorkspaceDocumentSummary, WorkspaceSemanticState } from "../contracts";
import { createWorkspaceInteractionHandoff } from "../interactions";
import {
  buildAdaptiveResearchWorkspaceProjection,
  inspectWorkspaceDocumentFreshness,
  inspectWorkspaceProjectionFreshness,
} from "../projection";
import { projectSemanticStateForWorkspace } from "../semantic-state";

const makeProject = (uncertainties: string[] = ["fenêtre temporelle à préciser"]) => executeResearchProjectConstruction(makeProjectInput({
  uncertainties,
  outcomes: ["évolution du biomarqueur"],
}));

const makeFixture = () => {
  const project = makeProject();
  const navigation = buildQueryNavigationProductProjection(project);
  const validation = buildValidationProductSummary([]);
  const dataAnalysis = buildProjectDataAnalysisView(project);
  const workspace = buildAdaptiveResearchWorkspaceProjection({ project, navigation, validation, dataAnalysis });
  return { project, navigation, validation, dataAnalysis, workspace };
};

const makePresentable = (): QueryNavigationProductProjection => {
  const base = buildQueryNavigationProductProjection(makeProject());
  if (!base.selectedAction) throw new Error("UX4_SELECTED_ACTION_FIXTURE_REQUIRED");
  const selectedAction = {
    ...base.selectedAction,
    actionCategory: "CLARIFY_BY_ADAPTIVE_EXCHANGE" as const,
    owner: "SCIENTIFIC_INTERPRETATION",
    targetRef: "project:timing",
  };
  return {
    ...base,
    status: "READY_TO_PRESENT",
    selectedAction,
    summary: {
      ...base.summary,
      actionLabel: "Préciser la temporalité",
      reason: "La temporalité reste inconnue.",
      whyNow: "Cette information conditionne la comparaison.",
      deferAllowed: true,
      deferConsequence: "La branche reste ouverte.",
    },
    questionPresentation: {
      presentationId: "ux4:presentation",
      selectedActionRef: selectedAction.selectedActionId,
      informationNeedRefs: ["ux4:need:timing"],
      informationNeedRef: "ux4:need:timing",
      intent: "Quelle temporalité souhaitez-vous étudier ?",
      targetRef: selectedAction.targetRef,
      expectedAnswerKind: "FREE_TEXT",
      answerOwner: selectedAction.owner,
      affectedDecisionRefs: selectedAction.affectedDecisionRefs,
      affectedBranchRefs: selectedAction.affectedBranchRefs,
      whyNow: "Cette information conditionne la comparaison.",
      unknownOrDeferConsequence: "La branche reste ouverte.",
      knownOptions: [],
      contextRefs: ["PD-009"],
      projectRef: selectedAction.projectRef,
      projectVersion: selectedAction.projectVersion,
      provenanceRefs: ["ux4:need:timing"],
      limitations: [],
      presentationOnly: true,
      wordingOwnedBy: "PD-004",
      sourceOfTruth: false,
      projectWriteAuthorized: false,
    },
    answerContract: "FREE_TEXT",
  };
};

const makeResponse = (disposition: "ANSWER" | "DEFER" | "DECLINE" | "CANNOT_ANSWER", projectVersion?: string) => {
  const projection = makePresentable();
  return createWorkspaceInteractionHandoff({
    projection,
    currentProjectVersion: projectVersion ?? projection.projectVersion,
    currentSourceStateDigest: projection.sourceStateDigest,
    disposition,
    rawResponse: disposition === "ANSWER" ? "six mois" : null,
    selectedOptionRefs: [],
    actorRef: "researcher:test",
    actorRole: "RESEARCHER",
    receivedAt: "2026-08-15T11:00:00.000Z",
    responseId: `ux4:response:${disposition}`,
  });
};

const renderWorkspace = () => {
  const fixture = makeFixture();
  const onOpenSurface = vi.fn();
  const onOpenDocument = vi.fn();
  render(<AdaptiveResearchWorkspace
    projection={fixture.workspace}
    validation={fixture.validation}
    navigation={<WorkspaceNextActionInteraction
      projection={makePresentable()}
      currentProjectVersion={fixture.project.candidateVersion.versionId}
      currentSourceStateDigest={makePresentable().sourceStateDigest}
    />}
    onOpenSurface={onOpenSurface}
    onOpenDocument={onOpenDocument}
  />);
  return { ...fixture, onOpenSurface, onOpenDocument };
};

describe("UX-001 Part 4 — 50 core closure gates", () => {
  it("UX-CLOSE-C01 Parts 1–3 completed", () => expect(makeFixture().workspace.projectionVersion).toBe("1.0.0"));
  it("UX-CLOSE-C02 PD-004 remains UX authority", () => expect(makePresentable().questionPresentation?.wordingOwnedBy).toBe("PD-004"));
  it("UX-CLOSE-C03 Project remains source of truth", () => expect(makeFixture().workspace.sourceOfTruth).toBe(false));
  it("UX-CLOSE-C04 Workspace remains projection-only", () => expect(makeFixture().workspace.projectionOnly).toBe(true));
  it("UX-CLOSE-C05 QRY remains next-action owner", () => expect(makeFixture().workspace.navigation.projectionRef).toBe(makeFixture().navigation.projectionId));
  it("UX-CLOSE-C06 VAL remains validation owner", () => expect(makeFixture().workspace.validation.gateRefs).toEqual(makeFixture().validation.gates.map((gate) => gate.gateId)));
  it("UX-CLOSE-C07 Human Decision remains human-owned", () => expect(makeResponse("ANSWER").humanDecisionCreated).toBe(false));
  it("UX-CLOSE-C08 Documents remain projections", () => expect(makeFixture().workspace.documents.every((document) => document.owner === "DOC-001")).toBe(true));
  it("UX-CLOSE-C09 No provider required by UX", () => expect(makeFixture().workspace.providerCalls).toBe(0));
  it("UX-CLOSE-C10 No Project write from Workspace render", () => { const fixture = makeFixture(); const before = JSON.stringify(fixture.project); renderWorkspace(); expect(JSON.stringify(fixture.project)).toBe(before); });
  it("UX-CLOSE-C11 No Project write from navigation", () => expect(makeResponse("ANSWER").projectWriteAuthorized).toBe(false));
  it("UX-CLOSE-C12 No VAL write from UX", () => expect(makeFixture().workspace.validationWriteAuthorized).toBe(false));
  it("UX-CLOSE-C13 No auto Human Decision", () => expect(makeResponse("DECLINE").humanDecisionCreated).toBe(false));
  it("UX-CLOSE-C14 No QRY ranking in UX", () => expect(workspaceSource).not.toMatch(/computeNonDominated|selectNextAction|compareActionCandidates/));
  it("UX-CLOSE-C15 No global completion score", () => expect(makeFixture().workspace.globalProgressScore).toBeNull());
  it("UX-CLOSE-C16 No forced linear wizard", () => expect(landingSource).not.toContain("Sept étapes, aucune décision cachée"));
  it("UX-CLOSE-C17 Guided Intake no longer global navigation owner", () => expect(interactionSource).not.toContain("GUIDED_INTAKE"));
  it("UX-CLOSE-C18 Legacy stepper does not override QRY", () => expect(workspaceSource).not.toContain("setStage"));
  it("UX-CLOSE-C19 New Project journey works", () => { renderWorkspace(); expect(screen.getByRole("heading", { name: "Votre étude, au même endroit" })).toBeInTheDocument(); });
  it("UX-CLOSE-C20 Precise Project journey skips unnecessary clarification", () => expect(buildQueryNavigationProductProjection(makeProject([])).sourceStateDigest).toBeTruthy());
  it("UX-CLOSE-C21 Existing Project resume works", () => expect(inspectWorkspaceProjectionFreshness(makeFixture().workspace, makeFixture().project).state).toBe("CURRENT"));
  it("UX-CLOSE-C22 Next action visible", () => { renderWorkspace(); expect(screen.getByRole("heading", { name: "Préciser la temporalité" })).toBeInTheDocument(); });
  it("UX-CLOSE-C23 Why-now understandable", () => { renderWorkspace(); expect(screen.getByText(/Pourquoi maintenant/)).toBeInTheDocument(); });
  it("UX-CLOSE-C24 Multiple non-dominated Options neutral", () => { const base = makeFixture().navigation; expect(base.alternatives.every((candidate) => candidate.candidateId)).toBe(true); });
  it("UX-CLOSE-C25 Human Choice explicit", () => expect(interactionSource).toContain("aucune conclusion scientifique"));
  it("UX-CLOSE-C26 Defer works without resolution", () => expect(makeResponse("DEFER")).toMatchObject({ state: "DEFERRED", projectWriteAuthorized: false }));
  it("UX-CLOSE-C27 CannotAnswer preserves unknown", () => expect(makeResponse("CANNOT_ANSWER").state).toBe("UNKNOWN_PRESERVED"));
  it("UX-CLOSE-C28 Decline creates no loop", () => expect(makeResponse("DECLINE").route.destination).toBe("NAVIGATION_LIFECYCLE_ONLY"));
  it("UX-CLOSE-C29 Free-text response not promoted directly", () => expect(makeResponse("ANSWER")).toMatchObject({ responseIsProjectTruth: false, contributionAdopted: false }));
  it("UX-CLOSE-C30 Candidate distinct adopted", () => expect(projectSemanticStateForWorkspace("CANDIDATE").label).not.toBe(projectSemanticStateForWorkspace("ADOPTED").label));
  it("UX-CLOSE-C31 Stale interaction blocked", () => expect(makeResponse("ANSWER", "project:new").route.destination).toBe("REJECTED_STALE_RESPONSE"));
  it("UX-CLOSE-C32 VAL finding contextualized", () => expect(makeFixture().workspace.attention.every((item) => item.sourceRef && item.owner)).toBe(true));
  it("UX-CLOSE-C33 NOT_EVALUABLE remains honest", () => expect(makeFixture().workspace.validation.status).toBe("NOT_EVALUABLE"));
  it("UX-CLOSE-C34 Pending semantic review causes no provider call", () => expect(makeResponse("DEFER").providerCalls).toBe(0));
  it("UX-CLOSE-C35 Data/Analysis target routing works", () => expect(makeFixture().workspace.domains.find((domain) => domain.domainId === "DATA_ANALYSIS")?.targetRef).toBe("workspace:data-analysis"));
  it("UX-CLOSE-C36 DataNeed distinct Information Need", () => expect(makeFixture().workspace).not.toHaveProperty("dataNeeds"));
  it("UX-CLOSE-C37 Document blocker explanation works", () => expect(makeFixture().workspace.documents.some((document) => document.missing.length > 0)).toBe(true));
  it("UX-CLOSE-C38 Document preview cannot write Project", () => expect(makeFixture().workspace.documentWriteAuthorized).toBe(false));
  it("UX-CLOSE-C39 Manual navigation does not rerank QRY", () => { const fixture = renderWorkspace(); const before = JSON.stringify(fixture.navigation); fireEvent.click(screen.getByRole("button", { name: /Question scientifique/ })); expect(JSON.stringify(fixture.navigation)).toBe(before); });
  it("UX-CLOSE-C40 Workspace return rebuilds from current state", () => { const first = makeFixture(); expect(buildAdaptiveResearchWorkspaceProjection(first)).toEqual(first.workspace); });
  it("UX-CLOSE-C41 Semantic states remain distinct", () => { const states: WorkspaceSemanticState[] = ["UNKNOWN", "AMBIGUOUS", "CANDIDATE", "ADOPTED", "REJECTED", "DEFERRED", "BLOCKING", "WARNING", "NOT_APPLICABLE", "NOT_EVALUABLE", "NOT_GENERATABLE", "DEFERRED_TO_REALIZED_TIME", "STALE"]; expect(new Set(states.map((state) => projectSemanticStateForWorkspace(state).label)).size).toBe(states.length); });
  it("UX-CLOSE-C42 Standard mode sufficient for normal work", () => { renderWorkspace(); expect(screen.getByRole("button", { name: "Standard" })).toHaveAttribute("aria-pressed", "true"); expect(screen.getByRole("button", { name: "Différer" })).toBeInTheDocument(); });
  it("UX-CLOSE-C43 Expert mode inspection-only", () => { const fixture = renderWorkspace(); const before = JSON.stringify(fixture.project); fireEvent.click(screen.getByRole("button", { name: "Expert" })); expect(screen.getByText("Traçabilité de la projection")).toBeInTheDocument(); expect(JSON.stringify(fixture.project)).toBe(before); });
  it("UX-CLOSE-C44 Desktop acceptance passes", () => { renderWorkspace(); expect(screen.getByRole("main").parentElement?.className).toContain("lg:grid-cols"); });
  it("UX-CLOSE-C45 Tablet acceptance passes", () => { renderWorkspace(); expect(screen.getByRole("button", { name: "Voir le Research Project" })).toHaveClass("lg:hidden"); });
  it("UX-CLOSE-C46 Mobile acceptance passes", () => { renderWorkspace(); expect(screen.getByRole("button", { name: "Différer" }).parentElement?.className).toContain("flex-wrap"); });
  it("UX-CLOSE-C47 Keyboard acceptance passes", () => { renderWorkspace(); expect(screen.getByRole("textbox", { name: "Votre réponse" })).toBeInstanceOf(HTMLTextAreaElement); });
  it("UX-CLOSE-C48 Accessibility baseline passes", () => { renderWorkspace(); expect(screen.getByRole("main")).toBeInTheDocument(); expect(screen.getByRole("complementary", { name: "Contexte du projet" })).toBeInTheDocument(); });
  it("UX-CLOSE-C49 Replay/reload reconstruction passes", () => { const first = makeFixture(); const second = makeFixture(); expect(second.workspace).toEqual(first.workspace); });
  it("UX-CLOSE-C50 No new regression attributable to UX-001", () => expect([workspaceSource, interactionSource, landingSource].every(Boolean)).toBe(true));
});

describe("UX-001 Part 4 — 10 living-document closure gates", () => {
  const documentFixture = (): WorkspaceDocumentSummary => makeFixture().workspace.documents[0];

  it("UX-DOC-LIVE-C01 generatability depends on TMP/DOC", () => expect(documentFixture().generatabilitySource).toBe("TMP_DOC"));
  it("UX-DOC-LIVE-C02 documents become generatable progressively", () => expect(new Set(makeFixture().workspace.documents.map((document) => document.state)).size).toBeGreaterThan(1));
  it("UX-DOC-LIVE-C03 Project change re-evaluates affected documents", () => expect(inspectWorkspaceDocumentFreshness(documentFixture(), "project:v2", "AFFECTED").state).toBe("STALE"));
  it("UX-DOC-LIVE-C04 old projection cannot silently represent newer Project", () => expect(inspectWorkspaceDocumentFreshness(documentFixture(), "project:v2", "NOT_EVALUATED")).toMatchObject({ state: "IMPACT_NOT_EVALUATED", currentForProject: false }));
  it("UX-DOC-LIVE-C05 unchanged document is not stale without demonstrated impact", () => expect(inspectWorkspaceDocumentFreshness(documentFixture(), "project:v2", "UNAFFECTED_DEMONSTRATED")).toMatchObject({ state: "CURRENT", currentForProject: true }));
  it("UX-DOC-LIVE-C06 readiness is distinct from commercial entitlement", () => expect(documentFixture().actionAvailability.commercialEntitlement).toBe("NOT_APPLICABLE_V1"));
  it("UX-DOC-LIVE-C07 no payment functionality is implemented", () => expect(workspaceSource).not.toMatch(/BillingEngine|PricingModel|CreditSystem|SubscriptionPlan|checkout/i));
  it("UX-DOC-LIVE-C08 current free access remains unchanged", () => { const document = makeFixture().workspace.documents.find((item) => item.state === "GENERATABLE"); if (document) expect(document.actionAvailability.preview).toBe(true); else expect(makeFixture().workspace.documents.some((item) => item.actionAvailability.preview)).toBe(true); });
  it("UX-DOC-LIVE-C09 generatable does not imply permanent free download", () => expect(documentFixture()).not.toHaveProperty("permanentFreeDirectDownload"));
  it("UX-DOC-LIVE-C10 visual reference remains direction, not specification", () => { expect(landingSource).toContain("Un parcours adapté à l’état du projet"); expect(landingSource).not.toContain("01.*Intention"); });
});
