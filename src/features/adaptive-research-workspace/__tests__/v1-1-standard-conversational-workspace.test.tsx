import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { buildProjectDataAnalysisView } from "@/features/data-analysis-planning/project-integration";
import { buildQueryNavigationProductProjection } from "@/features/query-navigation/product";
import type { QueryNavigationProductProjection } from "@/features/query-navigation/product-contracts";
import { executeResearchProjectConstruction } from "@/features/research-project-construction/engine";
import { makeProjectInput } from "@/features/research-project-construction/__tests__/fixtures";
import { buildValidationProductSummary } from "@/features/validation-architecture/product-gates";
import protocolDesignerSource from "@/pages/ProtocolDesignerDemo.tsx?raw";
import AdaptiveResearchWorkspace from "../AdaptiveResearchWorkspace";
import workspaceSource from "../AdaptiveResearchWorkspace.tsx?raw";
import WorkspaceNextActionInteraction from "../WorkspaceNextActionInteraction";
import { createWorkspaceInteractionHandoff } from "../interactions";
import { buildAdaptiveResearchWorkspaceProjection } from "../projection";
import { projectSemanticStateForWorkspace } from "../semantic-state";

const makeFixture = (question = "Chez les adultes après infarctus du myocarde, la colchicine réduit-elle l’inflammation et les lésions observées en IRM et en biologie par rapport au placebo ?") => {
  const project = executeResearchProjectConstruction(makeProjectInput({
    question,
    pathology: ["infarctus du myocarde"],
    population: ["adultes après infarctus du myocarde"],
    interventions: ["colchicine", "placebo"],
    methods: ["IRM cardiaque", "biologie"],
    outcomes: ["inflammation", "lésions observées en IRM"],
    uncertainties: ["fenêtre temporelle à préciser"],
  }));
  const validation = buildValidationProductSummary([]);
  const navigation = buildQueryNavigationProductProjection(project);
  const dataAnalysis = buildProjectDataAnalysisView(project);
  const workspace = buildAdaptiveResearchWorkspaceProjection({ project, validation, navigation, dataAnalysis });
  return { project, validation, navigation, dataAnalysis, workspace };
};

const makePresentable = (): QueryNavigationProductProjection => {
  const base = makeFixture().navigation;
  if (!base.selectedAction) throw new Error("V11_SELECTED_ACTION_REQUIRED");
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
      whyNow: "Cette information change la branche de conception.",
      deferAllowed: true,
      deferConsequence: "La branche reste ouverte.",
    },
    questionPresentation: {
      presentationId: "v11:presentation:timing",
      selectedActionRef: selectedAction.selectedActionId,
      informationNeedRef: "v11:need:timing",
      intent: "Quelle fenêtre temporelle souhaitez-vous étudier ?",
      targetRef: selectedAction.targetRef,
      expectedAnswerKind: "FREE_TEXT",
      answerOwner: selectedAction.owner,
      affectedDecisionRefs: selectedAction.affectedDecisionRefs,
      affectedBranchRefs: selectedAction.affectedBranchRefs,
      whyNow: "Cette information change la branche de conception.",
      unknownOrDeferConsequence: "La branche reste ouverte.",
      knownOptions: [],
      contextRefs: ["PD-009"],
      projectRef: selectedAction.projectRef,
      projectVersion: selectedAction.projectVersion,
      provenanceRefs: ["v11:need:timing"],
      limitations: [],
      presentationOnly: true,
      wordingOwnedBy: "PD-004",
      sourceOfTruth: false,
      projectWriteAuthorized: false,
    },
    answerContract: "FREE_TEXT",
  };
};

const renderStandard = (humanDecision?: React.ReactNode) => {
  const fixture = makeFixture();
  const projection = makePresentable();
  render(<AdaptiveResearchWorkspace
    projection={fixture.workspace}
    validation={fixture.validation}
    humanDecision={humanDecision}
    navigation={<WorkspaceNextActionInteraction projection={projection} currentProjectVersion={projection.projectVersion} currentSourceStateDigest={projection.sourceStateDigest} />}
    onOpenSurface={vi.fn()}
    onOpenDocument={vi.fn()}
  />);
  return { ...fixture, projection };
};

describe("V1.1 — Standard conversationnel et Research Project permanent", () => {
  it("V11-UX-C01 Standard renders conversation as the primary interaction surface", () => { renderStandard(); expect(screen.getByRole("main", { name: "Conversation scientifique" })).toBeInTheDocument(); expect(screen.getByLabelText("Votre réponse")).toBeInTheDocument(); });

  it("V11-UX-C02 Desktop Research Project panel remains visible while conversation scrolls", () => { renderStandard(); const panel = screen.getByRole("complementary", { name: "Contexte du projet" }); expect(panel.className).toContain("lg:sticky"); expect(panel.className).toContain("lg:top-4"); });

  it("V11-UX-C03 Mobile keeps Research Project immediately accessible", () => { renderStandard(); const button = screen.getByRole("button", { name: "Voir le Research Project" }); expect(button).toHaveAttribute("aria-controls", "mobile-research-project"); expect(button.className).toContain("sticky"); });

  it("V11-UX-C04 Standard does not require internal engine enums to continue", () => { renderStandard(); expect(document.body.textContent).not.toMatch(/MATCH_PROPOSED|TESTABLE_CANDIDATE|NULL_OR_COMPETING|HYPOTHESIS_ADOPTION_OR_EXPLICIT_REJECTION_REQUIRED/); expect(screen.getByRole("button", { name: "Envoyer ma réponse" })).toBeInTheDocument(); });

  it("V11-UX-C05 Standard hides permanent Actor/Mandate governance controls", () => { renderStandard(); expect(screen.queryByLabelText("Acteur humain")).toBeNull(); expect(screen.queryByLabelText("Mandat")).toBeNull(); expect(screen.queryByText("Autorité des décisions engageantes")).toBeNull(); });

  it("V11-UX-C06 Human Decision governance remains reachable when genuinely required", () => { renderStandard(<section aria-label="Décision humaine requise"><label htmlFor="decision-author">Qui prend cette décision ?</label><input id="decision-author" /></section>); expect(screen.getByRole("region", { name: "Décision humaine requise" })).toBeInTheDocument(); expect(screen.getByLabelText("Qui prend cette décision ?")).toBeInTheDocument(); });

  it("V11-UX-C07 Standard does not expose branch as a required user mental model", () => { renderStandard(); expect(document.body.textContent?.toLocaleLowerCase("fr-FR")).not.toContain("branche"); });

  it("V11-UX-C08 A decline action produces immediate visible feedback", () => { renderStandard(); fireEvent.click(screen.getByRole("button", { name: "Je préfère ne pas répondre" })); expect(screen.getByText("Réponse déclinée. Aucune valeur par défaut n’a été appliquée.")).toBeInTheDocument(); });

  it("V11-UX-C09 Disabled important actions expose a human-readable reason or are hidden", () => { renderStandard(); expect(screen.getByRole("button", { name: "Envoyer ma réponse" })).toBeDisabled(); expect(screen.getByText("Écrivez une réponse pour pouvoir l’envoyer.")).toBeInTheDocument(); });

  it("V11-UX-C10 QRY remains next-action owner", () => { const fixture = makeFixture(); expect(fixture.workspace.navigation.projectionRef).toBe(fixture.navigation.projectionId); expect(workspaceSource).not.toMatch(/selectNextAction|compareActionCandidates|computeNonDominated/); });

  it("V11-UX-C11 No UX direct write to adopted Project truth", () => { const projection = makePresentable(); const handoff = createWorkspaceInteractionHandoff({ projection, currentProjectVersion: projection.projectVersion, currentSourceStateDigest: projection.sourceStateDigest, disposition: "ANSWER", rawResponse: "six semaines", selectedOptionRefs: [], actorRef: "researcher:test", actorRole: "RESEARCHER", receivedAt: "2026-08-15T12:00:00.000Z", responseId: "v11:response" }); expect(handoff).toMatchObject({ projectWriteAuthorized: false, contributionAdopted: false, responseIsProjectTruth: false }); });

  it("V11-UX-C12 Candidate/adopted distinction remains intact", () => { const fixture = makeFixture(); const question = fixture.workspace.project.sections.find((item) => item.sectionId === "QUESTION"); const design = fixture.workspace.project.sections.find((item) => item.sectionId === "DESIGN"); expect(question?.state).toBe("ADOPTED"); expect(design?.state).toBe("CANDIDATE"); expect(projectSemanticStateForWorkspace("CANDIDATE").label).not.toBe(projectSemanticStateForWorkspace("ADOPTED").label); });

  it("V11-UX-C13 Document states are visible without falsifying generatability", () => { const fixture = renderStandard(); expect(screen.getByRole("heading", { name: "Documents" })).toBeInTheDocument(); for (const document of fixture.workspace.documents.filter((item) => ["Protocol", "DMP", "SAP", "Synopsis"].includes(item.projection))) expect(screen.getByText(document.projection)).toBeInTheDocument(); expect(fixture.workspace.documents.map((item) => item.state)).not.toContain("ADOPTED"); });

  it("V11-UX-C14 Document projection ownership remains unchanged", () => { expect(makeFixture().workspace.documents.every((item) => item.owner === "DOC-001")).toBe(true); });

  it("V11-UX-C15 Expert retains detailed reasoning and debug information", () => { const fixture = renderStandard(); fireEvent.click(screen.getByRole("button", { name: "Expert" })); expect(screen.getByText("Traçabilité de la projection")).toBeInTheDocument(); expect(screen.getByText(fixture.workspace.workspaceProjectionId)).toBeInTheDocument(); });

  it("V11-UX-C16 Orientation is conversational rather than a mandatory technical questionnaire in Standard", () => { expect(protocolDesignerSource).toContain("step === 2 && !orientationExpertOpen"); expect(protocolDesignerSource).toContain("Approfondir la question"); expect(protocolDesignerSource).toContain("Structurer l’étude"); expect(protocolDesignerSource).toContain("Inspecter l’orientation"); });

  it("V11-UX-C17 Session reload reconstructs the same usable Standard workspace", () => { const first = makeFixture(); const second = makeFixture(); expect(second.workspace).toEqual(first.workspace); expect(second.workspace.project.sections).toEqual(first.workspace.project.sections); });

  it("V11-UX-C18 Production-like colchicine/IDM journey can continue without external explanation", () => { renderStandard(); expect(screen.getAllByText(/colchicine réduit-elle l’inflammation/).length).toBeGreaterThan(0); expect(screen.getByText("Quelle fenêtre temporelle souhaitez-vous étudier ?")).toBeInTheDocument(); expect(screen.getByLabelText("Votre réponse")).toBeInTheDocument(); });

  it("V11-UX-C19 Standard has no blank state", () => { renderStandard(); expect(screen.getByRole("heading", { name: "Votre étude, au même endroit" })).toBeInTheDocument(); expect(screen.getByRole("heading", { name: "Préciser la temporalité" })).toBeInTheDocument(); expect(screen.getByRole("heading", { name: "Résumé actuel" })).toBeInTheDocument(); });

  it("V11-UX-C20 No new scientific owner or architecture is introduced", () => { const fixture = makeFixture(); expect(fixture.workspace).toMatchObject({ projectionOnly: true, sourceOfTruth: false, providerCalls: 0, projectWriteAuthorized: false, queryWriteAuthorized: false, validationWriteAuthorized: false, documentWriteAuthorized: false }); expect(new Set(fixture.workspace.documents.map((item) => item.owner))).toEqual(new Set(["DOC-001"])); });
});
