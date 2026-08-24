import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import type { ScientificInterpretationTurn } from "@/features/scientific-interpretation/contracts";
import { HYBRID_PRIMARY_RUNTIME_VERSION } from "@/features/scientific-interpretation/hybrid-primary";
import {
  confirmResearchProjectContribution,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
  type ResearchProjectSectionId,
} from "@/features/research-project-construction";
import {
  buildFunctionalResetQueryNavigation,
  presentFunctionalResetQuestion,
  recordFunctionalResetQueryResponse,
  restateFunctionalResetQueryAfterNoChange,
  validateFunctionalResetQueryNavigation,
} from "@/features/query-navigation";
import { FUNCTIONAL_RESET_STORAGE_KEY } from "../session";
import {
  CHANGESET_AGE_TIMING,
  CHANGESET_INITIAL,
  CHANGESET_REMOVE,
  CHANGESET_SCOPE,
  makeFunctionalReset03A1Contribution,
} from "./functional-reset-03a1-fixtures";
import {
  COLCHICINE_03A_INITIAL,
  COLCHICINE_03A_MODIFICATION,
  makeFunctionalResetBridgeResponseForRequest,
  makeFunctionalResetContribution,
} from "./functional-reset-fixtures";

const runtime = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock("@/features/protocol-designer/product-bridge-client", () => ({
  requestProtocolDesignerBridge: runtime.request,
}));

const authority = {
  actorRef: "functional-reset-03b:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const initialTurn: ScientificInterpretationTurn = {
  turnId: "turn:fr03b:initial",
  role: "USER",
  content: CHANGESET_INITIAL,
  createdAt: "2026-08-21T10:00:00.000Z",
};

const turn = (turnId: string, content: string): ScientificInterpretationTurn => ({
  turnId,
  role: "USER",
  content,
  createdAt: "2026-08-21T10:01:00.000Z",
});

const initialProject = () => confirmResearchProjectContribution({
  contribution: makeFunctionalReset03A1Contribution([initialTurn]),
  current: null,
  projectId: "research-project:fr03b",
  authority,
  confirmedAt: "2026-08-21T10:00:30.000Z",
});

const navigationFor = (project = initialProject()) => buildFunctionalResetQueryNavigation({
  project,
  recordedAt: "2026-08-21T10:01:00.000Z",
});

const nextVersion = (project: ResearchProjectOwnerProjection, suffix: string): ResearchProjectOwnerProjection => ({
  ...structuredClone(project),
  versionId: `${project.projectId}:version:${suffix}`,
  previousVersionId: project.versionId,
  projectDigest: `digest:${suffix}`,
  revision: project.revision + 1,
});

const withEvidence = (
  project: ResearchProjectOwnerProjection,
  suffix: string,
  evidence: Array<{ sectionId: ResearchProjectSectionId; content: string; proposedType: string }>,
): ResearchProjectOwnerProjection => {
  const next = nextVersion(project, suffix);
  next.sections = next.sections.map((section) => ({
    ...section,
    elements: [
      ...section.elements,
      ...evidence.filter((item) => item.sectionId === section.sectionId).map((item, index) => ({
        elementId: `evidence:${suffix}:${section.sectionId}:${index + 1}`,
        semanticKey: `${section.sectionId}:EVIDENCE:${suffix}:${index + 1}`,
        content: item.content,
        sourceItemIds: [`source:${suffix}:${index + 1}`],
        sourceTurnIds: [`turn:${suffix}`],
        sourceProposedType: item.proposedType,
        sourceStudyRole: item.proposedType,
        sourcePolarity: "AFFIRMED",
        disposition: "USER_CONFIRMED_PROJECT_INFORMATION" as const,
        canonicalPromotion: "NOT_PERFORMED" as const,
      })),
    ],
  }));
  return next;
};

const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);

const submit = (content: string) => {
  fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: content } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
};

const confirm = () => fireEvent.click(screen.getByRole("button", { name: "Cela correspond à mon projet" }));

const createProjectInUi = async () => {
  submit(COLCHICINE_03A_INITIAL);
  await screen.findByRole("heading", { name: "J’ai suffisamment d’éléments pour vous proposer une première structure d’étude." });
  const callsBefore = runtime.request.mock.calls.length;
  confirm();
  await screen.findByText(/Projet créé\./);
  await waitFor(() => expect(runtime.request.mock.calls.length).toBeGreaterThan(callsBefore));
  await waitFor(() => expect(screen.queryByText("NOXIA vous répond…")).not.toBeInTheDocument());
};

describe("FUNCTIONAL-RESET-03B — QRY-guided conversational progression", () => {
  beforeEach(() => {
    window.localStorage.clear();
    runtime.request.mockReset();
    runtime.request.mockImplementation(async (request) => makeFunctionalResetBridgeResponseForRequest(request));
  });
  afterEach(cleanup);

  it("FR03B-C01 — QRY is the sole owner of the next action", () => {
    const navigation = navigationFor();
    expect(navigation).toMatchObject({
      owner: "QUERY_NAVIGATION",
      boundary: "QRY_001_FUNCTIONAL_RESET_STANDARD_ADAPTER",
      projectionOnly: true,
      projectWriteAuthorized: false,
    });
    expect(navigation.selection.trace.selectedCandidateRef).toBe(navigation.currentAction?.actionCandidateRef);
    expect(validateFunctionalResetQueryNavigation(navigation)).toBe(true);
  });

  it("FR03B-C02 — Standard exposes no QRY internals", async () => {
    renderDemo();
    await createProjectInUi();
    const visible = screen.getByTestId("functional-reset-workspace").textContent ?? "";
    expect(visible).not.toMatch(/InformationNeed|selectedAction|sourceStateDigest|QRY-|PD-009|score|branch|gate/i);
    expect(visible).toMatch(/à quels moments|quels critères|quelle imagerie|quelles mesures/i);
  });

  it("FR03B-C03 — question presentation may reword but cannot widen QRY scope", () => {
    const navigation = navigationFor();
    const action = navigation.currentAction!;
    const presentation = navigation.currentPresentation!;
    const scoped = presentFunctionalResetQuestion(action, presentation, 0, {
      selectedActionRef: action.selectedActionId,
      informationNeedRefs: [...presentation.informationNeedRefs],
      scopeSectionIds: [...navigation.standardQuestion!.scopeSectionIds],
      question: "À quel moment souhaitez-vous réaliser les évaluations ?",
    });
    const widened = presentFunctionalResetQuestion(action, presentation, 0, {
      selectedActionRef: action.selectedActionId,
      informationNeedRefs: [...presentation.informationNeedRefs],
      scopeSectionIds: [...navigation.standardQuestion!.scopeSectionIds],
      question: "À quel moment et avec quelle analyse statistique souhaitez-vous procéder ?",
    });
    expect(scoped).toMatchObject({ presentationSource: "PD004_WORDING", choosesScientificScope: false });
    expect(widened.presentationSource).toBe("DETERMINISTIC_FALLBACK");
    expect(widened.scopeSectionIds).toEqual(navigation.standardQuestion!.scopeSectionIds);
  });

  it("FR03B-C04 — one free-text answer can resolve multiple compatible needs", () => {
    const base = initialProject();
    const project = withEvidence(base, "timed", [{ sectionId: "TEMPORALITY", content: "IRM : J3–J5", proposedType: "TIMEPOINT" }]);
    const previous = navigationFor(project);
    expect(previous.standardQuestion?.scopeSectionIds).toEqual(["POPULATION"]);
    const next = buildFunctionalResetQueryNavigation({
      project: withEvidence(project, "2", [
        { sectionId: "POPULATION", content: "Âge maximal : 75 ans", proposedType: "ELIGIBILITY_CRITERION" },
        { sectionId: "POPULATION", content: "Inclusion dans les 7 jours après l’événement", proposedType: "INCLUSION_CRITERION" },
      ]),
      previous,
      recordedAt: "2026-08-21T10:02:00.000Z",
    });
    const resolvedSections = previous.memory.resolvedNeedRefs.length;
    expect(next.memory.resolvedNeedRefs.length - resolvedSections).toBe(2);
    expect(next.standardQuestion?.scopeSectionIds).toEqual(["POPULATION"]);
    expect(next.standardQuestion?.text).toMatch(/exclusions/i);
  });

  it("FR03B-C05 — a partial response preserves the unresolved need", () => {
    const base = initialProject();
    const project = withEvidence(base, "timed", [{ sectionId: "TEMPORALITY", content: "IRM : J3–J5", proposedType: "TIMEPOINT" }]);
    const previous = navigationFor(project);
    const next = buildFunctionalResetQueryNavigation({
      project: withEvidence(project, "2", [
        { sectionId: "POPULATION", content: "Âge maximal : 75 ans", proposedType: "ELIGIBILITY_CRITERION" },
      ]),
      previous,
      recordedAt: "2026-08-21T10:02:00.000Z",
    });
    expect(next.standardQuestion?.scopeSectionIds).toEqual(["POPULATION"]);
    expect(next.standardQuestion?.informationNeedRefs).toHaveLength(2);
    expect(next.standardQuestion?.text).toMatch(/inclusion|exclusions/i);
  });

  it("FR03B-C06 — an unknown answer remains valid free text routed to Scientific Interpretation", () => {
    const navigation = recordFunctionalResetQueryResponse({
      navigation: navigationFor(),
      rawResponse: "Je ne sais pas encore.",
      actorRef: authority.actorRef,
      actorRole: "RESEARCHER",
      receivedAt: "2026-08-21T10:02:00.000Z",
      responseId: "response:unknown",
    });
    expect(navigation.memory.responses.at(-1)).toMatchObject({
      rawResponse: "Je ne sais pas encore.",
      disposition: "ANSWER",
      responseKind: "FREE_TEXT",
    });
    expect(navigation.lastResponseRoute).toMatchObject({ destination: "SCIENTIFIC_INTERPRETATION", projectWriteAuthorized: false });
  });

  it("FR03B-C07 — a resolved need is not immediately asked again", () => {
    const base = initialProject();
    const project = withEvidence(base, "timed", [{ sectionId: "TEMPORALITY", content: "IRM : J3–J5", proposedType: "TIMEPOINT" }]);
    const previous = navigationFor(project);
    const eligibilityNeed = previous.selection.needs.find((need) => need.sourceRef.endsWith(":eligibility"))?.needId;
    const next = buildFunctionalResetQueryNavigation({
      project: withEvidence(project, "2", [
        { sectionId: "POPULATION", content: "Âge maximal : 75 ans", proposedType: "ELIGIBILITY_CRITERION" },
      ]),
      previous,
      recordedAt: "2026-08-21T10:02:00.000Z",
    });
    expect(eligibilityNeed).toBeTruthy();
    expect(next.memory.resolvedNeedRefs).toContain(eligibilityNeed);
    expect(next.standardQuestion?.informationNeedRefs).not.toContain(eligibilityNeed);
    expect(next.standardQuestion?.text).not.toMatch(/tranche d’âge/i);
  });

  it("FR03B-C08 — a spontaneous correction outside the current question is accepted", () => {
    const project = initialProject();
    const previous = navigationFor(project);
    expect(previous.standardQuestion?.scopeSectionIds).toEqual(["TEMPORALITY"]);
    const next = buildFunctionalResetQueryNavigation({
      project: withEvidence(project, "2", [
        { sectionId: "POPULATION", content: "Âge maximal : 75 ans", proposedType: "ELIGIBILITY_CRITERION" },
      ]),
      previous,
      recordedAt: "2026-08-21T10:02:00.000Z",
    });
    const eligibilityNeed = previous.selection.needs.find((need) => need.sourceRef.endsWith(":eligibility"))?.needId;
    expect(eligibilityNeed).toBeTruthy();
    expect(next.memory.resolvedNeedRefs).toContain(eligibilityNeed);
    expect(next.standardQuestion?.scopeSectionIds).toEqual(["TEMPORALITY"]);
    expect(next.projectVersion).toBe(`${project.projectId}:version:2`);
  });

  it("FR03B-C09 — a confirmed Project update triggers QRY re-evaluation", async () => {
    renderDemo();
    await createProjectInUi();
    const first = JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!).queryNavigation;
    submit(COLCHICINE_03A_MODIFICATION);
    await screen.findByText("J’ai compris deux modifications :");
    confirm();
    await screen.findByText(/Projet mis à jour\./);
    const second = JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!).queryNavigation;
    expect(second.projectVersion).not.toBe(first.projectVersion);
    expect(second.selection.trace.traceId).not.toBe(first.selection.trace.traceId);
    expect(second.memory.previousSelectionTraceRefs).toContain(first.selection.trace.traceId);
  });

  it("FR03B-C10 — Standard keeps one primary free-text interaction and no Continue navigation", async () => {
    renderDemo();
    await createProjectInUi();
    expect(screen.getAllByRole("textbox")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /Continuer/i })).toBeNull();
    expect(screen.getByLabelText("Votre message")).toHaveAttribute("placeholder", "Ajouter ou modifier un élément du projet…");
  });

  it("FR03B-C11 — deterministic fallback works without a wording LLM", () => {
    const question = navigationFor().standardQuestion!;
    expect(question).toMatchObject({ presentationSource: "DETERMINISTIC_FALLBACK", presentationOnly: true, choosesScientificScope: false });
    expect(question.text).toMatch(/\?$/);
    const repeated = restateFunctionalResetQueryAfterNoChange({
      navigation: navigationFor(),
      recordedAt: "2026-08-21T10:03:00.000Z",
    });
    expect(repeated.standardQuestion?.repeatCount).toBe(1);
    expect(repeated.standardQuestion?.text).toMatch(/^Ce point reste important\./);
    expect(repeated.standardQuestion?.text).not.toBe(question.text);
  });

  it("FR03B-C12 — reload restores the same QRY action and question", async () => {
    const firstRender = renderDemo();
    await createProjectInUi();
    const before = JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!).queryNavigation;
    firstRender.unmount();
    renderDemo();
    const after = JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!).queryNavigation;
    expect(after.currentAction.selectedActionId).toBe(before.currentAction.selectedActionId);
    expect(after.standardQuestion.questionId).toBe(before.standardQuestion.questionId);
    expect(screen.getByRole("region", { name: "Conversation" })).toHaveTextContent(before.standardQuestion.text);
  });

  it("FR03B-C13 — reset clears QRY navigation memory", async () => {
    renderDemo();
    await createProjectInUi();
    expect(JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!).queryNavigation).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Recommencer" }));
    await waitFor(() => expect(JSON.parse(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)!).queryNavigation).toBeNull());
    expect(screen.getByText(/Décrivez-moi le projet de recherche/)).toBeInTheDocument();
  });

  it("FR03B-C14 — nominal progression imports no ST, IMG or Knowledge capability", () => {
    const sources = [
      "src/features/query-navigation/functional-reset-progression.ts",
      "src/features/protocol-designer/functional-reset/ProtocolDesignerWorkspace.tsx",
    ].map((path) => readFileSync(resolve(process.cwd(), path), "utf8")).join("\n");
    expect(sources).not.toMatch(/features\/(?:scientific-thinking|imaging-study-designer|knowledge-engine)/);
    expect(sources).not.toMatch(/trigger(?:ScientificThinking|Imaging|Knowledge)|build(?:ScientificThinking|Imaging|Knowledge)/);
  });

  it("FR03B-C15 — existing 03A1 and 03A2 Project changesets remain valid", () => {
    const first = makeFunctionalReset03A1Contribution([initialTurn]);
    const projectV1 = initialProject();
    const ageTimingTurn = turn("turn:fr03b:age-timing", CHANGESET_AGE_TIMING);
    const ageTiming = makeFunctionalReset03A1Contribution([initialTurn, ageTimingTurn]);
    const ageTimingSet = prepareResearchProjectContributionCandidate(ageTiming, projectV1).changeSet;
    const projectV2 = confirmResearchProjectContribution({
      contribution: ageTiming,
      current: projectV1,
      projectId: projectV1.projectId,
      authority,
      confirmedAt: "2026-08-21T10:02:00.000Z",
    });
    const removal = makeFunctionalReset03A1Contribution([
      initialTurn,
      ageTimingTurn,
      turn("turn:fr03b:scope", CHANGESET_SCOPE),
      turn("turn:fr03b:remove", CHANGESET_REMOVE),
    ]);
    const removalSet = prepareResearchProjectContributionCandidate(removal, projectV2).changeSet;
    expect(first.identity.runtimeVersion).toBe(HYBRID_PRIMARY_RUNTIME_VERSION);
    expect(ageTimingSet.changes.filter((change) => change.operation !== "NO_CHANGE").map((change) => change.operation)).toEqual(["ADD", "ADD"]);
    expect(removalSet.changes.filter((change) => change.operation !== "NO_CHANGE")).toEqual([
      expect.objectContaining({ operation: "REMOVE", targetSectionId: "MEASUREMENTS" }),
    ]);
  });
});
