import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { buildProjectDataAnalysisView } from "@/features/data-analysis-planning/project-integration";
import { buildQueryNavigationProductProjection } from "@/features/query-navigation/product";
import type { QueryNavigationProductProjection } from "@/features/query-navigation/product-contracts";
import { executeResearchProjectConstruction } from "@/features/research-project-construction/engine";
import { makeProjectInput } from "@/features/research-project-construction/__tests__/fixtures";
import { buildValidationProductSummary } from "@/features/validation-architecture/product-gates";
import AdaptiveResearchWorkspace from "../AdaptiveResearchWorkspace";
import WorkspaceNextActionInteraction from "../WorkspaceNextActionInteraction";
import { buildAdaptiveResearchWorkspaceProjection } from "../projection";
import { buildWorkspaceHumanDecisionTarget, createWorkspaceInteractionHandoff, deduplicateWorkspaceAttentionBySource, inspectWorkspaceInteractionFreshness } from "../interactions";

const project = () => executeResearchProjectConstruction(makeProjectInput({ uncertainties: ["fenêtre temporelle à préciser"], outcomes: ["évolution du biomarqueur"] }));

const baseProjection = () => buildQueryNavigationProductProjection(project());

const presentable = (kind: "FREE_TEXT" | "SINGLE_OPTION" | "HUMAN_REVIEW_DECISION" = "FREE_TEXT") => {
  const base = baseProjection();
  if (!base.selectedAction) throw new Error("FIXTURE_SELECTED_ACTION_REQUIRED");
  const action = {
    ...base.selectedAction,
    actionCategory: kind === "FREE_TEXT" ? "CLARIFY_BY_ADAPTIVE_EXCHANGE" as const : kind === "SINGLE_OPTION" ? "COMPARE_OPTIONS" as const : "REQUEST_HUMAN_DECISION" as const,
    owner: kind === "FREE_TEXT" ? "SCIENTIFIC_INTERPRETATION" : "RESEARCH_PROJECT",
    targetRef: kind === "FREE_TEXT" ? "project:timing" : "project:design",
    affectedDecisionRefs: ["decision:test"],
    alternativeCandidateRefs: kind === "FREE_TEXT" ? [] : ["option:a", "option:b"],
  };
  return {
    ...base,
    status: "READY_TO_PRESENT" as const,
    selectedAction: action,
    summary: { ...base.summary, actionLabel: kind === "FREE_TEXT" ? "Préciser la fenêtre temporelle" : "Choisir une stratégie", whyNow: "Cette information change la branche de conception.", deferAllowed: true, deferConsequence: "La branche restera ouverte." },
    questionPresentation: {
      presentationId: "presentation:test",
      selectedActionRef: action.selectedActionId,
      informationNeedRef: "need:test",
      intent: kind === "FREE_TEXT" ? "Quelle fenêtre temporelle souhaitez-vous étudier ?" : "Quelle stratégie souhaitez-vous examiner ?",
      targetRef: action.targetRef,
      expectedAnswerKind: kind,
      answerOwner: action.owner,
      affectedDecisionRefs: ["decision:test"],
      affectedBranchRefs: ["branch:test"],
      whyNow: "Cette information change la branche de conception.",
      unknownOrDeferConsequence: "La branche restera ouverte.",
      knownOptions: kind === "FREE_TEXT" ? [] : ["option:a", "option:b"],
      contextRefs: ["PD-009"],
      projectRef: action.projectRef,
      projectVersion: action.projectVersion,
      provenanceRefs: ["need:test"],
      limitations: [],
      presentationOnly: true as const,
      wordingOwnedBy: "PD-004" as const,
      sourceOfTruth: false as const,
      projectWriteAuthorized: false as const,
    },
    answerContract: kind,
  } satisfies QueryNavigationProductProjection;
};

const handoff = (projection = presentable(), overrides: Partial<Parameters<typeof createWorkspaceInteractionHandoff>[0]> = {}) => createWorkspaceInteractionHandoff({
  projection,
  currentProjectVersion: projection.projectVersion,
  currentSourceStateDigest: projection.sourceStateDigest,
  disposition: "ANSWER",
  rawResponse: "six mois",
  selectedOptionRefs: [],
  actorRef: "researcher:1",
  actorRole: "RESEARCHER",
  receivedAt: "2026-08-15T10:00:00.000Z",
  responseId: "response:test",
  ...overrides,
});

describe("UX-001 Part 3 — QRY and response contracts", () => {
  it("UX3-QRY-C01 selected clarification opens the QRY intent", () => expect(presentable().questionPresentation?.intent).toMatch(/fenêtre temporelle/));
  it("UX3-QRY-C02 intent is taken verbatim from QuestionPresentationRequest", () => { const projection = presentable(); render(<WorkspaceNextActionInteraction projection={projection} currentProjectVersion={projection.projectVersion} currentSourceStateDigest={projection.sourceStateDigest} />); expect(screen.getByText(projection.questionPresentation!.intent)).toBeInTheDocument(); });
  it("UX3-QRY-C03 no Guided Intake question list participates", () => expect(JSON.stringify(presentable())).not.toContain("GUIDED_INTAKE"));
  it("UX3-QRY-C04 why-now is shown", () => { const projection = presentable(); render(<WorkspaceNextActionInteraction projection={projection} currentProjectVersion={projection.projectVersion} currentSourceStateDigest={projection.sourceStateDigest} />); expect(screen.getByText(/Cette précision peut modifier plusieurs décisions/)).toBeInTheDocument(); });
  it("UX3-QRY-C05 defer routes only to lifecycle", () => expect(handoff(presentable(), { disposition: "DEFER", rawResponse: null }).route.destination).toBe("NAVIGATION_LIFECYCLE_ONLY"));
  it("UX3-QRY-C06 cannot-answer preserves unknown", () => expect(handoff(presentable(), { disposition: "CANNOT_ANSWER", rawResponse: null }).state).toBe("UNKNOWN_PRESERVED"));
  it("UX3-QRY-C07 decline routes only to lifecycle", () => expect(handoff(presentable(), { disposition: "DECLINE", rawResponse: null }).route.destination).toBe("NAVIGATION_LIFECYCLE_ONLY"));
  it("UX3-QRY-C08 owner state can yield a newly built QRY projection", () => { const first = baseProjection(); const changed = executeResearchProjectConstruction(makeProjectInput({ uncertainties: [] })); const next = buildQueryNavigationProductProjection(changed); expect(next.sourceStateDigest).not.toBe(first.sourceStateDigest); });
  it("UX3-QRY-C09 manual exploration callback does not alter projection", () => { const projection = baseProjection(); const before = JSON.stringify(projection); const open = vi.fn(); render(<WorkspaceNextActionInteraction projection={projection} currentProjectVersion={projection.projectVersion} currentSourceStateDigest={projection.sourceStateDigest} onOpenTarget={open} />); const button = screen.queryByRole("button", { name: /Ouvrir|Comprendre|Examiner/ }); if (button) fireEvent.click(button); expect(JSON.stringify(projection)).toBe(before); });
  it("UX3-QRY-C10 pending action retains source Project version", () => expect(presentable().selectedAction?.projectVersion).toBe(presentable().projectVersion));

  it("UX3-RESP-C01 free text remains exact raw input", () => expect(handoff().response.rawResponse).toBe("six mois"));
  it("UX3-RESP-C02 free text routes to Scientific Interpretation", () => expect(handoff().route.destination).toBe("SCIENTIFIC_INTERPRETATION"));
  it("UX3-RESP-C03 free text has no Project write", () => expect(handoff()).toMatchObject({ responseIsProjectTruth: false, contributionAdopted: false, projectWriteAuthorized: false }));
  it("UX3-RESP-C04 structured selection retains Option identity", () => { const projection = presentable("SINGLE_OPTION"); expect(handoff(projection, { rawResponse: "option:b", selectedOptionRefs: ["option:b"] }).response.selectedOptionRefs).toEqual(["option:b"]); });
  it("UX3-RESP-C05 engaging selection routes to Human Decision", () => expect(handoff(presentable("SINGLE_OPTION"), { rawResponse: "option:a", selectedOptionRefs: ["option:a"] }).route.destination).toBe("HUMAN_DECISION"));
  it("UX3-RESP-C06 response state is honest", () => expect(handoff().state).toBe("INTERPRETATION_PENDING"));
  it("UX3-RESP-C07 unknown is accepted", () => expect(handoff(presentable(), { disposition: "CANNOT_ANSWER", rawResponse: null }).response.disposition).toBe("CANNOT_ANSWER"));
  it("UX3-RESP-C08 decline is accepted", () => expect(handoff(presentable(), { disposition: "DECLINE", rawResponse: null }).response.disposition).toBe("DECLINE"));
  it("UX3-RESP-C09 defer is accepted", () => expect(handoff(presentable(), { disposition: "DEFER", rawResponse: null }).response.disposition).toBe("DEFER"));
  it("UX3-RESP-C10 stale response is blocked", () => expect(handoff(presentable(), { currentProjectVersion: "project:new" }).route.destination).toBe("REJECTED_STALE_RESPONSE"));
});

describe("UX-001 Part 3 — Human Decision, freshness and owner boundaries", () => {
  it("UX3-HUM-C01 uses the existing HumanDecisionNavigationTarget", () => expect(buildWorkspaceHumanDecisionTarget(presentable("HUMAN_REVIEW_DECISION"), "actor:1", "mandate:1").boundary).toBe("TARGET_ONLY_HUMAN_DECISION_NOT_CREATED"));
  it("UX3-HUM-C02 actor participates in target identity", () => expect(buildWorkspaceHumanDecisionTarget(presentable("HUMAN_REVIEW_DECISION"), "actor:1", "mandate:1").targetId).not.toBe(buildWorkspaceHumanDecisionTarget(presentable("HUMAN_REVIEW_DECISION"), "actor:2", "mandate:1").targetId));
  it("UX3-HUM-C03 mandate is required", () => expect(() => buildWorkspaceHumanDecisionTarget(presentable("HUMAN_REVIEW_DECISION"), "actor:1", "")).toThrow(/MANDATE_REQUIRED/));
  it("UX3-HUM-C04 no Option is preselected", () => { const projection = presentable("SINGLE_OPTION"); render(<WorkspaceNextActionInteraction projection={projection} currentProjectVersion={projection.projectVersion} currentSourceStateDigest={projection.sourceStateDigest} />); expect(screen.getAllByRole("radio").every((radio) => !(radio as HTMLInputElement).checked)).toBe(true); });
  it("UX3-HUM-C05 engaging wording is explicit", () => { const projection = presentable("SINGLE_OPTION"); render(<WorkspaceNextActionInteraction projection={projection} currentProjectVersion={projection.projectVersion} currentSourceStateDigest={projection.sourceStateDigest} />); expect(screen.getByRole("button", { name: "Soumettre ce choix à la décision humaine" })).toBeInTheDocument(); });
  it("UX3-HUM-C06 navigation preference is not superiority", () => { const projection = { ...baseProjection(), selectedAction: null, status: "MULTIPLE_OPTIONS" as const, alternatives: baseProjection().selection.candidates.slice(0, 2) }; render(<WorkspaceNextActionInteraction projection={projection} currentProjectVersion={projection.projectVersion} currentSourceStateDigest={projection.sourceStateDigest} />); expect(screen.getAllByText(/Choix de navigation seulement/)).toHaveLength(2); });
  it("UX3-HUM-C07 cancel/decline creates no decision", () => expect(handoff(presentable(), { disposition: "CANCEL", rawResponse: null }).humanDecisionCreated).toBe(false));
  it("UX3-HUM-C08 adoption is never performed by UX", () => expect(handoff(presentable("SINGLE_OPTION"), { rawResponse: "option:a", selectedOptionRefs: ["option:a"] }).humanDecisionCreated).toBe(false));

  it("UX3-STL-C01 editor source Project version is recorded", () => expect(handoff().sourceProjectVersion).toBe(presentable().projectVersion));
  it("UX3-STL-C02 Project version change marks action stale", () => expect(inspectWorkspaceInteractionFreshness(presentable(), "next", presentable().sourceStateDigest).status).toBe("STALE_PROJECT_VERSION"));
  it("UX3-STL-C03 source-state change marks action stale", () => expect(inspectWorkspaceInteractionFreshness(presentable(), presentable().projectVersion, "next").status).toBe("STALE_SOURCE_STATE"));
  it("UX3-STL-C04 stale handoff retains raw user input", () => expect(handoff(presentable(), { currentProjectVersion: "next" }).response.rawResponse).toBe("six mois"));
  it("UX3-STL-C05 stale handoff cannot promote", () => expect(handoff(presentable(), { currentProjectVersion: "next" }).route.expectedOutputContract).toBeNull());
  it("UX3-STL-C06 old VAL sources are not altered by render", () => { const value = buildValidationProductSummary([]); const before = JSON.stringify(value); const p = project(); const nav = buildQueryNavigationProductProjection(p); const projection = buildAdaptiveResearchWorkspaceProjection({ project: p, navigation: nav, validation: value, dataAnalysis: buildProjectDataAnalysisView(p) }); render(<AdaptiveResearchWorkspace projection={projection} validation={value} navigation={<div />} />); expect(JSON.stringify(value)).toBe(before); });
  it("UX3-STL-C07 historical source projection remains immutable", () => { const projection = presentable(); const before = JSON.stringify(projection); inspectWorkspaceInteractionFreshness(projection, "next", projection.sourceStateDigest); expect(JSON.stringify(projection)).toBe(before); });
  it("UX3-STL-C08 stale answer is never Project truth", () => expect(handoff(presentable(), { currentProjectVersion: "next" }).response.rawResponseIsProjectTruth).toBe(false));
});

describe("UX-001 Part 3 — product interaction surface", () => {
  it("UX3-UI-C01 free-text input is labeled", () => { const projection = presentable(); render(<WorkspaceNextActionInteraction projection={projection} currentProjectVersion={projection.projectVersion} currentSourceStateDigest={projection.sourceStateDigest} />); expect(screen.getByLabelText("Votre réponse")).toBeInTheDocument(); });
  it("UX3-UI-C02 free-text submit produces a handoff, not Project write", () => { const projection = presentable(); const callback = vi.fn(); render(<WorkspaceNextActionInteraction projection={projection} currentProjectVersion={projection.projectVersion} currentSourceStateDigest={projection.sourceStateDigest} onOwnerHandoff={callback} />); fireEvent.change(screen.getByLabelText("Votre réponse"), { target: { value: "six mois" } }); fireEvent.click(screen.getByRole("button", { name: "Envoyer ma réponse" })); expect(callback.mock.calls[0][0]).toMatchObject({ projectWriteAuthorized: false, state: "INTERPRETATION_PENDING" }); });
  it("UX3-UI-C03 defer remains visible in Standard", () => { const projection = presentable(); render(<WorkspaceNextActionInteraction projection={projection} currentProjectVersion={projection.projectVersion} currentSourceStateDigest={projection.sourceStateDigest} />); fireEvent.click(screen.getByRole("button", { name: "Différer" })); expect(screen.getByRole("status")).toHaveTextContent(/besoin reste ouvert/); });
  it("UX3-UI-C04 cannot answer is not a form error", () => { const projection = presentable(); render(<WorkspaceNextActionInteraction projection={projection} currentProjectVersion={projection.projectVersion} currentSourceStateDigest={projection.sourceStateDigest} />); fireEvent.click(screen.getByRole("button", { name: "Je ne sais pas" })); expect(screen.getByRole("status")).toHaveTextContent(/inconnue/); expect(screen.queryByRole("alert")).toBeNull(); });
  it("UX3-UI-C05 decline is not retried", () => { const projection = presentable(); render(<WorkspaceNextActionInteraction projection={projection} currentProjectVersion={projection.projectVersion} currentSourceStateDigest={projection.sourceStateDigest} />); fireEvent.click(screen.getByRole("button", { name: "Je préfère ne pas répondre" })); expect(screen.getByRole("status")).toHaveTextContent(/Aucune valeur par défaut/); });
  it("UX3-UI-C06 stale response is disabled and explained", () => { const projection = presentable(); render(<WorkspaceNextActionInteraction projection={projection} currentProjectVersion="next" currentSourceStateDigest={projection.sourceStateDigest} />); const input = screen.getByLabelText("Votre réponse"); fireEvent.change(input, { target: { value: "texte conservé" } }); expect(screen.getByRole("button", { name: "Envoyer ma réponse" })).toBeDisabled(); expect(screen.getByRole("alert")).toHaveTextContent(/projet a changé/); expect(input).toHaveValue("texte conservé"); });
  it("UX3-UI-C07 option comparison is keyboard-native", () => { const projection = presentable("SINGLE_OPTION"); render(<WorkspaceNextActionInteraction projection={projection} currentProjectVersion={projection.projectVersion} currentSourceStateDigest={projection.sourceStateDigest} />); const option = screen.getByRole("radio", { name: "option:b" }); fireEvent.click(option); expect(option).toBeChecked(); });
  it("UX3-UI-C08 no option uses color or position as recommendation", () => { const projection = presentable("SINGLE_OPTION"); render(<WorkspaceNextActionInteraction projection={projection} currentProjectVersion={projection.projectVersion} currentSourceStateDigest={projection.sourceStateDigest} />); expect(screen.getByText(/Aucune option n’est présélectionnée/)).toBeInTheDocument(); expect(screen.queryByText(/recommandée|meilleure/i)).toBeNull(); });
  it("UX3-UI-C09 non-presentable actions deep-link to owner", () => { const projection = baseProjection(); const open = vi.fn(); render(<WorkspaceNextActionInteraction projection={projection} currentProjectVersion={projection.projectVersion} currentSourceStateDigest={projection.sourceStateDigest} onOpenTarget={open} />); fireEvent.click(screen.getByRole("button", { name: /Ouvrir la revue méthodologique|Ouvrir l’objet concerné|Comprendre le refus/ })); expect(open).toHaveBeenCalledWith(projection.selectedAction?.targetRef); });
  it("UX3-UI-C10 conversation is contextual, not a forced pane", () => { const p = project(); const validation = buildValidationProductSummary([]); const navigation = buildQueryNavigationProductProjection(p); const workspace = buildAdaptiveResearchWorkspaceProjection({ project: p, navigation, validation, dataAnalysis: buildProjectDataAnalysisView(p) }); render(<AdaptiveResearchWorkspace projection={workspace} validation={validation} navigation={<WorkspaceNextActionInteraction projection={navigation} currentProjectVersion={navigation.projectVersion} currentSourceStateDigest={navigation.sourceStateDigest} />} />); expect(screen.queryByRole("heading", { name: "Conversation" })).toBeNull(); expect(screen.getByRole("heading", { name: "Votre étude, au même endroit" })).toBeInTheDocument(); });
  it("UX3-UI-C11 document blockers expose exact missing items", () => { const p = project(); const validation = buildValidationProductSummary([]); const navigation = buildQueryNavigationProductProjection(p); const workspace = buildAdaptiveResearchWorkspaceProjection({ project: p, navigation, validation, dataAnalysis: buildProjectDataAnalysisView(p) }); render(<AdaptiveResearchWorkspace projection={workspace} validation={validation} navigation={<div />} onOpenSurface={vi.fn()} onOpenDocument={vi.fn()} />); expect(screen.getAllByText(/Il manque encore/).length).toBeGreaterThan(0); });
  it("UX3-UI-C12 attention deduplication uses exact source identity", () => expect(deduplicateWorkspaceAttentionBySource([{ sourceRef: "same", value: 1 }, { sourceRef: "same", value: 2 }, { sourceRef: "other", value: 3 }])).toEqual([{ sourceRef: "same", value: 1 }, { sourceRef: "other", value: 3 }]));
  it("UX3-UI-C13 rendering performs no provider call", () => { const provider = vi.fn(); const projection = presentable(); render(<WorkspaceNextActionInteraction projection={projection} currentProjectVersion={projection.projectVersion} currentSourceStateDigest={projection.sourceStateDigest} />); expect(provider).not.toHaveBeenCalled(); expect(handoff().providerCalls).toBe(0); });
  it("UX3-UI-C14 interaction controls are mobile-safe stacked/wrapped", () => { const projection = presentable(); render(<WorkspaceNextActionInteraction projection={projection} currentProjectVersion={projection.projectVersion} currentSourceStateDigest={projection.sourceStateDigest} />); expect(screen.getByRole("button", { name: "Différer" }).parentElement?.className).toContain("flex-wrap"); });
  it("UX3-UI-C15 no hidden write occurs on open or mode change", () => { const p = project(); const validation = buildValidationProductSummary([]); const navigation = buildQueryNavigationProductProjection(p); const workspace = buildAdaptiveResearchWorkspaceProjection({ project: p, navigation, validation, dataAnalysis: buildProjectDataAnalysisView(p) }); const before = JSON.stringify(p); render(<AdaptiveResearchWorkspace projection={workspace} validation={validation} navigation={<div />} />); fireEvent.click(screen.getByRole("button", { name: "Expert" })); expect(JSON.stringify(p)).toBe(before); });
});
