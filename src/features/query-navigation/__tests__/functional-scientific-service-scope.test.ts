import { afterEach, describe, expect, it } from "vitest";
import { createElement } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import ImagingStandardCard from "@/features/protocol-designer/functional-reset/ImagingStandardCard";
import BiostatisticsStandardCard from "@/features/protocol-designer/functional-reset/BiostatisticsStandardCard";
import { dispatchImagingFromQuery } from "@/features/protocol-designer/functional-reset/imaging-standard";
import { dispatchBiostatisticsFromQuery } from "@/features/protocol-designer/functional-reset/biostatistics-standard";
import { createProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import { createScientificExecutionTraceLedger } from "@/features/protocol-designer/scientific-execution-trace";
import { buildFunctionalResetQueryNavigation, resolveRequestedScientificScope } from "../functional-reset-progression";
import { buildCurrentProjectDecisionReadback, requestsScientificExplanation } from "../current-navigation-evidence";
import { confirmResearchProjectContribution, buildProjectContextSnapshot } from "@/features/research-project-construction";
import { buildStudyDesignRuntimeInput, executeStudyDesignRuntime } from "@/features/study-design";
import { executeProductUnderstandInteraction, recognizeProductDocumentAction, routeProductEntry } from "@/features/protocol-designer/functional-reset/product-entry-routing";
import { behaviorAuthority, behaviorContribution, behaviorItem, behaviorTurn } from "@/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures";

const at = "2026-09-15T10:00:00Z";
const turn = behaviorTurn("service-scope:source", "Observer la marche ; adultes volontaires ; mesure à vingt semaines.");
const contribution = behaviorContribution({ contributionId: "service-scope:contribution", turns: [turn], candidateObjects: [
  behaviorItem({ itemId: "goal", proposedType: "OBJECTIVE", content: "Observer la marche", turnId: turn.turnId }),
  behaviorItem({ itemId: "population", proposedType: "POPULATION", content: "Adultes volontaires de 45 à 75 ans", turnId: turn.turnId }),
  behaviorItem({ itemId: "endpoint", proposedType: "ENDPOINT", content: "Distance parcourue en mètres", studyRole: "PRIMARY_ENDPOINT", turnId: turn.turnId }),
  behaviorItem({ itemId: "occasion", proposedType: "TEMPORALITY", content: "Recueil à vingt semaines", turnId: turn.turnId }),
] });
const makeProject = () => confirmResearchProjectContribution({ contribution, current: null, projectId: "service-scope:project", authority: behaviorAuthority, confirmedAt: at });

describe("Existing scientific service scope at QRY and read-only owners", () => {
  afterEach(cleanup);
  it.each([
    "Je conserve le projet tel qu’il a été adopté. Je n’ajoute pas les pistes dont nous venons de discuter.",
    "Nous avons discuté des alternatives, sans nouvelle décision.",
    "Ces idées ont été discutées, elles restent des exemples.",
  ])("does not turn a reference to past discussion into a new scientific request: %s", (raw) => {
    expect(requestsScientificExplanation(raw)).toBe(false);
    const project = makeProject(); const before = JSON.stringify(project);
    const decision = routeProductEntry({ raw, sourceTurnRef: "past:discussion", routedAt: at, forceUnderstand: true });
    const result = executeProductUnderstandInteraction({ raw, decision, createdAt: at, currentProject: project });
    expect(result.responsibilityOwner).toBe("QUERY_NAVIGATION");
    expect(result.presentation).toBeNull();
    expect(result.assistantReply).toContain("projet courant est conservé");
    expect(result).toMatchObject({ projectWrites: 0, externalCalls: 0 });
    expect(JSON.stringify(project)).toBe(before);
  });
  it.each([
    "Discutons les limites de cette mesure.",
    "Discutez le choix de population.",
    "Je voudrais discuter du compromis entre précision et faisabilité.",
  ])("keeps an actual invitation to scientific discussion: %s", (raw) => {
    expect(requestsScientificExplanation(raw)).toBe(true);
  });
  it.each([
    ["Proposez des options de recrutement", "STUDY_DESIGN"],
    ["Quelles solutions pour l’instrument ?", "OBSERVABILITY_MEASUREMENT"],
    ["Propose une alternative d’analyse", "BIOSTATISTICS"],
    ["Quelles stratégies d’acquisition IRM ?", "IMAGING"],
    ["Propose différentes hypothèses scientifiques", "SCIENTIFIC_THINKING"],
  ])("selects the requested existing owner independently of missing question: %s", (sourceText, owner) => {
    const project = makeProject(); const before = JSON.stringify(project);
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: at, requestedAction: "ASSISTED_PROPOSAL", requestedServiceInput: { sourceTurnRef: "current:request", sourceText } });
    expect(navigation.currentAction?.owner).toBe(owner);
    expect(navigation.requestedService?.sourceText).toBe(sourceText);
    expect(navigation.currentAction?.projectVersion).toBe(project.versionId);
    expect(navigation.projectDigest).toBe(project.projectDigest);
    expect(JSON.stringify(project)).toBe(before);
  });
  it("does not confuse conversational agreement with the agreement-measurement service", () => {
    expect(resolveRequestedScientificScope("D’accord, proposez une autre approche méthodologique").owner).toBe("STUDY_DESIGN");
    expect(resolveRequestedScientificScope("Proposez une mesure d’accord entre deux appareils").owner).toBe("BIOSTATISTICS");
  });
  it("keeps a recruitment limitation in the native Study Design result with current population and source request", () => {
    const project = makeProject(); const snapshot = buildProjectContextSnapshot({ project });
    const input = buildStudyDesignRuntimeInput(snapshot, { sourceTurnRef: "recruitment:request", purpose: "Comparer des critères d’éligibilité", focusSectionIds: ["POPULATION"] });
    const result = executeStudyDesignRuntime(input);
    expect(result.options).toHaveLength(0);
    expect(result.informationNeeds[0]?.sourceRefs).toContain("recruitment:request");
    expect(result.informationNeeds[0]?.reason).toContain("45 à 75 ans");
    expect(result.informationNeeds[0]?.reason).toContain("faisabilité");
    expect(result.candidateIsAdopted).toBe(false);
    expect(result.sourceProject.projectDigest).toBe(project.projectDigest);
  });
  it("reads the current decision rather than endorsing a contradictory recall", () => {
    const project = makeProject();
    const answer = buildCurrentProjectDecisionReadback({ raw: "La population est-elle toujours de 18 à 30 ans ? Rappelez-moi ce qui est retenu.", project, retained: [] });
    expect(answer?.text).toContain("45 à 75 ans");
    expect(answer?.text).not.toContain("18 à 30");
    expect(answer?.sourceRefs).toContain(project.projectDigest);
  });
  it("returns a scoped, actionable Knowledge limit without inventing scientific support", () => {
    const project = makeProject(); const raw = "Pourquoi ce compromis d’aveugle serait-il préférable ?";
    const decision = routeProductEntry({ raw, sourceTurnRef: "explain:request", routedAt: at, currentProjectAvailable: true });
    const answer = executeProductUnderstandInteraction({ raw, decision, createdAt: at, currentProject: project });
    expect(answer.responsibilityOwner).toBe("KNOWLEDGE");
    expect(answer.assistantReply).toContain(raw);
    expect(answer.assistantReply).toContain("procédures");
    expect(answer.sourceRefs).toContain(project.projectDigest);
    expect(answer.projectWrites).toBe(0); expect(answer.externalCalls).toBe(0);
    expect(answer.assistantReply).not.toBe("Vous avez indiqué les éléments suivants.");
  });
  it("keeps ambiguous references unresolved even when a Project exists", () => {
    const project = makeProject(); const raw = "Non, pas ça.";
    const decision = routeProductEntry({ raw, sourceTurnRef: "ambiguous:request", routedAt: at, currentProjectAvailable: true });
    const answer = executeProductUnderstandInteraction({ raw, decision, createdAt: at, currentProject: project });
    expect(answer.assistantReply).toContain("référent"); expect(answer.projectWrites).toBe(0);
  });
  it.each(["IMAGING", "BIOSTATISTICS"] as const)("renders the native %s scoped abstention in the actual Standard card", (owner) => {
    const project = makeProject();
    const sourceText = owner === "IMAGING" ? "Quelles stratégies d’acquisition IRM ?" : "Propose une alternative d’analyse";
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: at, requestedAction: "ASSISTED_PROPOSAL",
      requestedServiceInput: { sourceTurnRef: "visible:request", sourceText } });
    const input = { project, navigation, ownerResultLedger: createProductOwnerResultLedger("visible:session"),
      traceLedger: createScientificExecutionTraceLedger("visible:session"), sessionId: "visible:session", conversationId: "visible:conversation",
      presentationTurnRef: "visible:response", startedAt: at, completedAt: at };
    const onSelect = () => { throw new Error("ABSTENTION_IS_NOT_A_SELECTABLE_OPTION"); };
    const onDiscuss = () => undefined;
    if (owner === "IMAGING") {
      const dispatched = dispatchImagingFromQuery(input);
      expect(dispatched.result.scopeExplanation).toBeTruthy();
      render(createElement(ImagingStandardCard, { presentation: dispatched.presentation, interaction: dispatched.interaction, onSelect, onDiscuss }));
      expect(screen.getByTestId("standard-imaging-proposal")).toHaveTextContent(dispatched.result.scopeExplanation!.replace(/\s+/gu, " "));
      expect(screen.queryByRole("button", { name: "Retenir cette acquisition pour revue" })).toBeNull();
    } else {
      const dispatched = dispatchBiostatisticsFromQuery(input);
      expect(dispatched.result.scopeExplanation).toBeTruthy();
      render(createElement(BiostatisticsStandardCard, { presentation: dispatched.presentation, interaction: dispatched.interaction, onSelect, onDiscuss }));
      expect(screen.getByTestId("standard-biostatistics-proposal")).toHaveTextContent(dispatched.result.scopeExplanation!.replace(/\s+/gu, " "));
      expect(screen.queryByRole("button", { name: "Retenir cette stratégie pour revue" })).toBeNull();
    }
    expect(screen.queryByText("Informations encore nécessaires")).toBeNull();
  });
  it("recognizes a current document projection with constraints without swallowing a scientific edit", () => {
    expect(recognizeProductDocumentAction("Pouvez-vous me sortir le document disponible à partir du projet actuel ? Laissez les inconnues visibles.")).toBe("REGENERATE_PROTOCOL");
    expect(recognizeProductDocumentAction("Corrige le critère principal, puis génère le protocole actuel.")).toBeNull();
    expect(recognizeProductDocumentAction("Prépare le document actuel puis ajoute un bras traité.")).toBeNull();
  });
});
