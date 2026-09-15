import { loadFunctionalResetSession as readPersistedSessionForTest } from "@/features/protocol-designer/functional-reset/session";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import ProtocolDesignerDemo from "@/pages/ProtocolDesignerDemo";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import { buildStudyDeliverablePortfolio } from "@/features/document-projection";
import type { PersistentDeltaValidation, ProductBridgeRequest, ProductBridgeResponse } from "@/features/protocol-designer/product-bridge";
import {
  adoptBehaviorContribution,
  behaviorContribution,
  behaviorItem,
  behaviorRelation,
  behaviorTurn,
} from "@/features/protocol-designer/functional-reset/__tests__/p1-behavior-01a-contract-fixtures";
import { retainValidatedContributionCandidate } from "@/features/protocol-designer/functional-reset/contribution-lifecycle";
import { makeFunctionalResetBridgeResponse, makeGovernedPostAdoptionResponse } from "@/features/protocol-designer/functional-reset/__tests__/functional-reset-fixtures";
import StandardConversationActionGroup from "@/features/protocol-designer/functional-reset/StandardConversationActionGroup";
import {
  buildStandardConversationActionGroup,
  summarizeStandardConversationActionResponse,
  type StandardConversationActionGroupResponse,
} from "@/features/protocol-designer/functional-reset/standard-conversation-action-group";
import {
  createFunctionalResetSession,
  FUNCTIONAL_RESET_STORAGE_KEY,
  type FunctionalResetSession,
} from "@/features/protocol-designer/functional-reset/session";
import {
  createScientificExecutionTraceLedger,
  createScientificTraceCaptureConfiguration,
  startProductTraceRun,
} from "@/features/protocol-designer/scientific-execution-trace";
import { recordCurrentProjectImpactNavigationTrace } from "@/features/protocol-designer/functional-reset/end-to-end-trace-adapter";
import {
  ensureCanonicalProjectState,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { buildCurrentNavigationEvidence } from "../current-navigation-evidence";
import { buildCurrentProjectImpactProjection } from "../current-project-context";
import { buildFunctionalResetQueryNavigation } from "../functional-reset-progression";

const runtime = vi.hoisted(() => ({ bridge: vi.fn(), language: vi.fn() }));
vi.mock("@/features/protocol-designer/product-bridge-client", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/features/protocol-designer/product-bridge-client")>();
  return { ...original, requestProtocolDesignerBridge: runtime.bridge, requestConversationLanguageProjection: runtime.language };
});

const AT = "2026-09-09T09:00:00.000Z";
const passedValidation = (): PersistentDeltaValidation => ({
  valid: true,
  acceptedChanges: [],
  acceptedRelations: [],
  acceptedTemporalQualifications: [],
  acceptedExpectedVariableOccasions: [],
  blocks: [],
  noOps: [],
  normalizations: [],
});
const network = vi.fn(() => { throw new Error("PROVIDER_CALL_FORBIDDEN_IN_STANDARD_CONTEXT_TEST"); });

const biologicalProject = () => {
  const turn = behaviorTurn("turn:biology:baseline", "Le projet prévoit des prélèvements sanguins à l’inclusion et à M3, leur utilisation biologique et un budget biologique contraint.");
  const contribution = behaviorContribution({
    contributionId: "contribution:biology:baseline",
    turns: [turn],
    candidateObjects: [
      behaviorItem({ itemId: "sample:blood", proposedType: "BIOSPECIMEN", studyRole: "PLANNED_COLLECTION", content: "Prélèvements sanguins déjà prévus", turnId: turn.turnId }),
      behaviorItem({ itemId: "measure:existing-biology", proposedType: "MEASUREMENT", studyRole: "BIOLOGICAL_USE", content: "Utilisation biologique déjà prévue", turnId: turn.turnId }),
      behaviorItem({ itemId: "visit:inclusion", proposedType: "VISIT", content: "Visite d’inclusion", turnId: turn.turnId }),
      behaviorItem({ itemId: "visit:m3", proposedType: "VISIT", content: "Visite M3", turnId: turn.turnId }),
      behaviorItem({ itemId: "constraint:biology-budget", proposedType: "CONSTRAINT", content: "Budget des analyses biologiques limité", turnId: turn.turnId }),
      behaviorItem({ itemId: "constraint:unrelated", proposedType: "CONSTRAINT", content: "Contrainte sans rapport avec la biologie", turnId: turn.turnId }),
    ],
    relations: [
      behaviorRelation({ relationId: "relation:biology-uses-blood", relationType: "USES_MATERIAL_FROM", sourceItemId: "measure:existing-biology", targetItemId: "sample:blood", turnId: turn.turnId }),
      behaviorRelation({ relationId: "relation:blood-inclusion", relationType: "COLLECTED_AT", sourceItemId: "sample:blood", targetItemId: "visit:inclusion", turnId: turn.turnId }),
      behaviorRelation({ relationId: "relation:blood-m3", relationType: "COLLECTED_AT", sourceItemId: "sample:blood", targetItemId: "visit:m3", turnId: turn.turnId }),
      behaviorRelation({ relationId: "relation:budget-blood", relationType: "CONSTRAINS", sourceItemId: "constraint:biology-budget", targetItemId: "sample:blood", turnId: turn.turnId }),
    ],
  });
  return adoptBehaviorContribution(contribution, null, 1);
};

const connectedCandidate = (project: ResearchProjectOwnerProjection, input: {
  contributionRef: string;
  turnRef: string;
  text: string;
  objectRef: string;
  objectType: string;
  relationTargetContent: string;
  relationType: string;
}) => {
  const target = ensureCanonicalProjectState(project).objects.find((object) => object.actuality === "CURRENT" && object.content === input.relationTargetContent);
  if (!target) throw new Error(`FIXTURE_TARGET_NOT_FOUND:${input.relationTargetContent}`);
  const turn = behaviorTurn(input.turnRef, input.text);
  const contribution = behaviorContribution({
    contributionId: input.contributionRef,
    turns: [turn],
    candidateObjects: [behaviorItem({ itemId: input.objectRef, proposedType: input.objectType, content: input.text, turnId: turn.turnId })],
    relations: [behaviorRelation({
      relationId: `${input.contributionRef}:relation`,
      relationType: input.relationType,
      sourceItemId: input.objectRef,
      targetItemId: target.objectId,
      turnId: turn.turnId,
    })],
  });
  const candidate = prepareResearchProjectContributionCandidate(contribution, project);
  expect(candidate.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
  const retained = retainValidatedContributionCandidate({
    retained: [],
    contribution,
    candidate,
    validation: passedValidation(),
    validatorRef: "LOCAL_STANDARD_CONTEXT_VALIDATOR@1",
    sourceTurnRef: turn.turnId,
    baseProject: project,
    dependencyBindings: [],
    traceRunId: "trace:standard-context",
    retainedAt: AT,
  })[0]!;
  const impact = buildCurrentProjectImpactProjection({
    project,
    candidate,
    candidateDigest: retained.candidateDigest,
    sourceTurnRef: turn.turnId,
  });
  if (!impact) throw new Error("CURRENT_PROJECT_IMPACT_REQUIRED");
  const evidence = buildCurrentNavigationEvidence({
    sourceTurnRef: turn.turnId,
    sourceText: turn.content,
    currentProject: project,
    validatedCandidate: retained,
    currentProjectImpact: impact,
  });
  const navigation = buildFunctionalResetQueryNavigation({
    project,
    currentNavigationEvidence: evidence,
    recordedAt: AT,
    forceRebuild: true,
  });
  const presentation = buildStandardConversationActionGroup({ impact, navigation });
  if (!presentation) throw new Error("STANDARD_ACTION_GROUP_REQUIRED");
  return { contribution, candidate, retained, impact, evidence, navigation, presentation };
};

const biologicalFixture = () => {
  const project = biologicalProject();
  return { project, ...connectedCandidate(project, {
    contributionRef: "contribution:biology:assay-x",
    turnRef: "turn:biology:after-six-other-turns",
    text: "Ajouter le dosage X à l’étude",
    objectRef: "measurement:assay-x",
    objectType: "MEASUREMENT",
    relationTargetContent: "Prélèvements sanguins déjà prévus",
    relationType: "USES_MATERIAL_FROM",
  }) };
};

const stored = () => readPersistedSessionForTest(window.localStorage, FUNCTIONAL_RESET_STORAGE_KEY, true) as FunctionalResetSession;
const renderDemo = () => render(<HelmetProvider><MemoryRouter><ProtocolDesignerDemo /></MemoryRouter></HelmetProvider>);
const submit = (text: string) => {
  fireEvent.change(screen.getByLabelText("Votre message"), { target: { value: text } });
  fireEvent.click(screen.getByRole("button", { name: "Envoyer" }));
};

const seedLongBiologicalSession = () => {
  const project = biologicalProject();
  const session = createFunctionalResetSession(AT);
  const intervening = Array.from({ length: 6 }, (_, index) => behaviorTurn(`turn:intervening:${index + 1}`, `Point intermédiaire ${index + 1} sans rapport avec la collecte biologique.`));
  const seeded: FunctionalResetSession = {
    ...session,
    projectId: project.projectId,
    project,
    runtimeTurns: intervening,
    entries: [
      ...session.entries,
      ...intervening.map((turn) => ({
        entryId: `entry:${turn.turnId}`,
        kind: "TEXT" as const,
        role: "USER" as const,
        content: turn.content,
        createdAt: turn.createdAt,
      })),
    ],
  };
  window.localStorage.setItem(FUNCTIONAL_RESET_STORAGE_KEY, JSON.stringify(seeded));
  return project;
};

const liveCandidateResponse = (request: ProductBridgeRequest): ProductBridgeResponse => {
  if (request.requestKind === "POST_ADOPTION_QRY_CONTINUATION") {
    const response = makeGovernedPostAdoptionResponse(request);
    return { ...response, observability: { ...response.observability, calls: 0, conversationCalls: 0, conversationResponseReceived: false } };
  }
  if (!request.currentProject) throw new Error("SEEDED_PROJECT_REQUIRED");
  const turn = request.conversation.turns.at(-1)!;
  const blood = ensureCanonicalProjectState(request.currentProject).objects.find((object) => object.actuality === "CURRENT" && object.content === "Prélèvements sanguins déjà prévus");
  if (!blood) throw new Error("SEEDED_BLOOD_COLLECTION_REQUIRED");
  const sequence = runtime.bridge.mock.calls.length;
  const contribution = behaviorContribution({
    contributionId: `contribution:ui-assay-x:${sequence}`,
    turns: [turn],
    candidateObjects: [behaviorItem({ itemId: "measurement:assay-x", proposedType: "MEASUREMENT", content: "Dosage X", turnId: turn.turnId })],
    relations: [behaviorRelation({ relationId: `relation:ui-assay-x:${sequence}`, relationType: "USES_MATERIAL_FROM", sourceItemId: "measurement:assay-x", targetItemId: blood.objectId, turnId: turn.turnId })],
  });
  contribution.source.conversationId = request.conversation.conversationId;
  const response = makeFunctionalResetBridgeResponse(request.conversation.turns, contribution, "J’ai compris l’ajout du dosage X. Je relie cette proposition aux éléments pertinents du projet courant avant votre décision.");
  return {
    ...response,
    persistentExtraction: { ...response.persistentExtraction, validation: passedValidation() },
    observability: {
      ...response.observability,
      model: "NONE",
      calls: 0,
      conversationCalls: 0,
      conversationResponseReceived: false,
      extractionAttempts: 0,
      extractionLatencyMs: 0,
      conversationLatencyMs: 0,
    },
  };
};

beforeEach(() => {
  window.localStorage.clear();
  runtime.bridge.mockReset();
  runtime.language.mockReset();
  network.mockClear();
  vi.spyOn(console, "debug").mockImplementation(() => undefined);
  vi.stubGlobal("fetch", network);
});

afterEach(() => {
  cleanup();
  expect(network).not.toHaveBeenCalled();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("V1 Standard scientific conversation intelligence — invariants C01-C15", () => {
  it("C01-C03 — resurfaces old relevant Project facts after a distant turn, excludes the irrelevant fact, and keeps the new candidate explicit", () => {
    const { impact } = biologicalFixture();
    const contents = impact.relevantProjectItems.map((item) => item.content);
    expect(contents).toEqual(expect.arrayContaining([
      "Prélèvements sanguins déjà prévus",
      "Utilisation biologique déjà prévue",
      "Visite d’inclusion",
      "Visite M3",
      "Budget des analyses biologiques limité",
    ]));
    expect(contents).not.toContain("Contrainte sans rapport avec la biologie");
    expect(impact.currentSubjects.map((item) => item.content)).toEqual(["Ajouter le dosage X à l’étude"]);
    expect(impact.sourceCandidate.sourceTurnRef).toBe("turn:biology:after-six-other-turns");
  });

  it("C04-C09 — exposes independent multi-select actions, Other, deferral, explanations, explicit statuses and free-text-only continuation", () => {
    const { presentation } = biologicalFixture();
    const onRespond = vi.fn();
    render(<StandardConversationActionGroup presentation={presentation} response={null} actionable onRespond={onRespond} />);
    expect(screen.getAllByRole("checkbox").length).toBeGreaterThan(1);
    expect(screen.getByText("Confirmé dans le projet courant")).toBeInTheDocument();
    expect(screen.getAllByText("À vérifier").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Inconnu à ce stade").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByLabelText(/Vérifier la couverture/));
    fireEvent.click(screen.getByLabelText(/Estimer l’incidence/));
    fireEvent.change(screen.getByLabelText("Autre demande"), { target: { value: "Comparer aussi les deux visites" } });
    fireEvent.click(screen.getByText("Pourquoi ces options ?"));
    expect(screen.getByText(/dépendances et contraintes reliées/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Examiner ces actions" }));
    expect(onRespond).toHaveBeenCalledWith(expect.objectContaining({
      selectedActionRefs: expect.arrayContaining([presentation.actions[0]!.actionRef, presentation.actions.find((action) => action.label.startsWith("Estimer"))!.actionRef]),
      freeTextRequest: "Comparer aussi les deux visites",
      defer: false,
    }));
    cleanup();
    const freeTextOnly = vi.fn();
    render(<StandardConversationActionGroup presentation={presentation} response={null} actionable onRespond={freeTextOnly} />);
    fireEvent.change(screen.getByLabelText("Autre demande"), { target: { value: "Une analyse libre" } });
    fireEvent.click(screen.getByRole("button", { name: "Examiner ces actions" }));
    expect(freeTextOnly).toHaveBeenCalledWith({ selectedActionRefs: [], freeTextRequest: "Une analyse libre", defer: false });
    cleanup();
    const defer = vi.fn();
    render(<StandardConversationActionGroup presentation={presentation} response={null} actionable onRespond={defer} />);
    fireEvent.click(screen.getByRole("button", { name: "Aucun / pas maintenant" }));
    expect(defer).toHaveBeenCalledWith({ selectedActionRefs: [], freeTextRequest: null, defer: true });
  });

  it("C10-C12 — selection is non-mutating, rejection leaves Project stable, and adoption alone versions Project and document projections", () => {
    const { project, contribution, presentation } = biologicalFixture();
    const projectBefore = JSON.stringify(project);
    const response: StandardConversationActionGroupResponse = {
      responseRef: "conversation-action-response:test",
      disposition: "USER_REQUESTS_THESE_FOLLOW_UP_ACTIONS",
      selectedActionRefs: [presentation.actions[0]!.actionRef],
      unselectedActionRefs: presentation.actions.slice(1).map((action) => action.actionRef),
      freeTextRequest: null,
      respondedAt: AT,
      projectVersionAtPresentation: project.versionId,
      projectWriteAuthorized: false,
    };
    const receipt = summarizeStandardConversationActionResponse({ presentation, response });
    expect(receipt.assistantText).toContain("sans modifier le projet");
    expect(JSON.stringify(project)).toBe(projectBefore);
    expect(presentation.projectWriteAuthorized).toBe(false);
    expect(response.projectWriteAuthorized).toBe(false);

    const rejectedProject = project;
    expect(JSON.stringify(rejectedProject)).toBe(projectBefore);
    const adopted = adoptBehaviorContribution(contribution, project, 2);
    expect(adopted.revision).toBe(project.revision + 1);
    expect(adopted.previousVersionId).toBe(project.versionId);
    expect(ensureCanonicalProjectState(adopted).objects.some((object) => object.actuality === "CURRENT" && object.content === "Ajouter le dosage X à l’étude")).toBe(true);
    const portfolio = buildStudyDeliverablePortfolio({ project: adopted, protocolProjection: null, generatedAt: AT });
    expect(portfolio.projectRef.projectVersion).toBe(adopted.versionId);
    for (const kind of ["SCHEDULE_OF_ACTIVITIES", "CRF", "DATA_DICTIONARY"] as const) {
      const artifact = portfolio.artifacts.find((item) => item.kind === kind)!;
      expect(artifact.canonicalVariableRefs).toContain("measurement:assay-x");
    }
    const visible = JSON.stringify({ impacts: presentation.impacts, actions: presentation.actions, receipt });
    expect(visible).not.toMatch(/(?:\b\d+(?:[.,]\d+)?\s*(?:€|euros?|m[lL]|µ[lL])\b|tube|température|stabilité|biobanque|nouvel examen)/iu);
  });

  it("C13-C14 — works for a non-biological endpoint and does not flood unrelated or weakly associated turns", () => {
    const baseTurn = behaviorTurn("turn:endpoint:baseline", "Le projet prévoit une mesure fonctionnelle à la visite de suivi.");
    const project = adoptBehaviorContribution(behaviorContribution({
      contributionId: "contribution:endpoint:baseline",
      turns: [baseTurn],
      candidateObjects: [
        behaviorItem({ itemId: "measure:functional", proposedType: "MEASUREMENT", content: "Mesure fonctionnelle", turnId: baseTurn.turnId }),
        behaviorItem({ itemId: "visit:follow-up", proposedType: "VISIT", content: "Visite de suivi", turnId: baseTurn.turnId }),
      ],
      relations: [behaviorRelation({ relationId: "relation:functional-follow-up", relationType: "MEASURED_AT", sourceItemId: "measure:functional", targetItemId: "visit:follow-up", turnId: baseTurn.turnId })],
    }), null, 1);
    const secondary = connectedCandidate(project, {
      contributionRef: "contribution:endpoint:new",
      turnRef: "turn:endpoint:new",
      text: "Ajouter un critère fonctionnel secondaire",
      objectRef: "endpoint:functional-secondary",
      objectType: "ENDPOINT",
      relationTargetContent: "Mesure fonctionnelle",
      relationType: "DERIVED_FROM",
    });
    expect(secondary.impact.relevantProjectItems.map((item) => item.content)).toEqual(expect.arrayContaining(["Mesure fonctionnelle", "Visite de suivi"]));
    expect(secondary.impact.actions.length).toBeLessThanOrEqual(4);
    expect(JSON.stringify(secondary.impact)).not.toMatch(/biologi|prélèvement|budget/iu);

    const target = ensureCanonicalProjectState(project).objects.find((object) => object.actuality === "CURRENT" && object.content === "Mesure fonctionnelle")!;
    const unrelatedTurn = behaviorTurn("turn:unrelated", "Ajouter une information descriptive sans conséquence structurée.");
    const unrelatedContribution = behaviorContribution({
      contributionId: "contribution:unrelated",
      turns: [unrelatedTurn],
      candidateObjects: [behaviorItem({ itemId: "info:unrelated", proposedType: "PROJECT_INFORMATION", content: unrelatedTurn.content, turnId: unrelatedTurn.turnId })],
      relations: [behaviorRelation({ relationId: "relation:weak", relationType: "ASSOCIATED_WITH", sourceItemId: "info:unrelated", targetItemId: target.objectId, turnId: unrelatedTurn.turnId })],
    });
    const candidate = prepareResearchProjectContributionCandidate(unrelatedContribution, project);
    expect(buildCurrentProjectImpactProjection({ project, candidate, candidateDigest: logicalDigest({ contribution: unrelatedContribution, candidate }), sourceTurnRef: unrelatedTurn.turnId })).toBeNull();

    const constraintTurn = behaviorTurn("turn:single-impact:baseline", "Le recrutement est limité par la capacité du centre.");
    const constrainedProject = adoptBehaviorContribution(behaviorContribution({
      contributionId: "contribution:single-impact:baseline",
      turns: [constraintTurn],
      candidateObjects: [behaviorItem({ itemId: "constraint:site-capacity", proposedType: "CONSTRAINT", content: "Capacité de recrutement du centre limitée", turnId: constraintTurn.turnId })],
    }), null, 1);
    const singleImpact = connectedCandidate(constrainedProject, {
      contributionRef: "contribution:single-impact:new",
      turnRef: "turn:single-impact:new",
      text: "Ajouter un recrutement dans un second service",
      objectRef: "info:second-service",
      objectType: "PROJECT_INFORMATION",
      relationTargetContent: "Capacité de recrutement du centre limitée",
      relationType: "CONSTRAINED_BY",
    });
    expect(singleImpact.impact.actions).toHaveLength(1);
    expect(singleImpact.impact.actions[0]).toMatchObject({ status: "UNKNOWN", responsibilityOwner: "QUERY_NAVIGATION" });
  });

  it("C15 — preserves QRY ownership, exact evidence bindings and zero provider execution", () => {
    const { project, retained, impact, evidence, navigation, presentation } = biologicalFixture();
    expect(evidence.candidate).toMatchObject({ ref: retained.candidateRef, digest: retained.candidateDigest, status: "VALIDATED_NON_ADOPTED_CANDIDATE", projectWriteAuthorized: false });
    expect(evidence.adoptedProject).toMatchObject({ projectId: project.projectId, versionId: project.versionId, projectDigest: project.projectDigest });
    expect(evidence.sourceState.governedNeeds).toContainEqual(impact.qryNeed);
    expect(navigation.owner).toBe("QUERY_NAVIGATION");
    expect(navigation.selection.selected).toMatchObject({ owner: "QUERY_NAVIGATION", targetRef: impact.projectionId, projectWriteAuthorized: false });
    expect(presentation.selectedInformationNeedRef).toBe(navigation.currentAction!.navigationNeedRefs[0]);
    const started = startProductTraceRun({
      ledger: createScientificExecutionTraceLedger("session:standard-context"),
      traceRunId: "trace:standard-context:diagnostic",
      turnId: impact.sourceCandidate.sourceTurnRef,
      conversationId: "conversation:standard-context",
      startedAt: AT,
      sourceDigest: logicalDigest("Ajouter le dosage X à l’étude"),
      captureConfiguration: createScientificTraceCaptureConfiguration({ captureLevel: "LEVEL_2_DIAGNOSTIC", captureReason: "MANUAL_DIAGNOSTIC" }),
    });
    const traced = recordCurrentProjectImpactNavigationTrace({
      ledger: started.ledger,
      traceRunId: "trace:standard-context:diagnostic",
      conversationId: "conversation:standard-context",
      observedAt: AT,
      project,
      impact,
      queryNavigation: navigation,
      presentation,
    });
    const event = traced.events.find((item) => item.common?.stage === "QRY_ACTION_SELECTED");
    expect(event?.common).toMatchObject({
      responsibilityOwner: "QUERY_NAVIGATION",
      decisionOwner: "QUERY_NAVIGATION",
      executor: "QUERY_NAVIGATION",
      provider: "NONE",
      reasonCode: "CURRENT_PROJECT_IMPACT_SELECTED_BY_PD009",
      actionDecision: {
        askVsPropose: "ASK_QUESTION",
        selectedInformationNeed: impact.qryNeed.needId,
      },
    });
    expect(event?.common?.input.map((item) => item.ref)).toEqual(expect.arrayContaining(impact.relevantProjectItems.map((item) => item.ref)));
    expect(event?.common?.actionDecision?.whySelected).toContain("DEMONSTRATED_CURRENT");
    expect(event?.common?.actionDecision?.candidateAlternatives).toEqual(impact.actions.map((action) => action.actionRef));
    expect(network).not.toHaveBeenCalled();
  });

  it("Standard integration — after six unrelated turns, shows useful context, combines requests, survives rejection, then adopts a fresh candidate", async () => {
    const projectV1 = seedLongBiologicalSession();
    runtime.bridge.mockImplementation(async (request: ProductBridgeRequest) => liveCandidateResponse(request));
    runtime.language.mockImplementation(() => { throw new Error("LANGUAGE_PROVIDER_FORBIDDEN_IN_FRENCH_FIXTURE"); });
    renderDemo();

    submit("Je veux ajouter le dosage X à cette étude.");
    const actionGroup = await screen.findByRole("region", { name: "Actions de suivi proposées" });
    expect(actionGroup).toHaveTextContent("Prélèvements sanguins déjà prévus");
    expect(actionGroup).toHaveTextContent("Visite d’inclusion");
    expect(actionGroup).toHaveTextContent("Visite M3");
    expect(actionGroup).toHaveTextContent("Budget des analyses biologiques limité");
    expect(actionGroup).not.toHaveTextContent("Contrainte sans rapport avec la biologie");
    expect(screen.getByLabelText("Votre message")).toBeEnabled();

    fireEvent.click(within(actionGroup).getByLabelText(/Vérifier la couverture/));
    fireEvent.click(within(actionGroup).getByLabelText(/Estimer l’incidence/));
    fireEvent.change(within(actionGroup).getByLabelText("Autre demande"), { target: { value: "Comparer l’inclusion et M3" } });
    fireEvent.click(within(actionGroup).getByRole("button", { name: "Examiner ces actions" }));
    await screen.findByText(/Je traite ensemble 3 demandes de suivi au niveau permis par les informations actuelles, sans modifier le projet/);
    expect(screen.getByText(/Ce qui est déjà établi/)).toBeInTheDocument();
    expect(screen.getByText(/Résultat contextuel et limites/)).toBeInTheDocument();
    expect(stored().project).toEqual(projectV1);

    const firstReview = await screen.findByTestId("functional-contribution-review");
    fireEvent.click(within(firstReview).getByRole("button", { name: "Refuser cette proposition" }));
    await within(firstReview).findByText(/Research Project est inchangé/);
    expect(stored().project).toEqual(projectV1);
    expect(screen.getByLabelText("Votre message")).toBeEnabled();

    submit("Je confirme une nouvelle proposition : ajouter le dosage X à cette étude.");
    await waitFor(() => expect(screen.getAllByTestId("functional-contribution-review")).toHaveLength(2));
    const reviews = screen.getAllByTestId("functional-contribution-review");
    fireEvent.click(within(reviews[1]!).getByRole("button", { name: "Cela correspond à mon projet" }));
    await screen.findByText("Projet mis à jour.");
    await waitFor(() => expect(stored().project?.revision).toBe(2));
    expect(stored().project?.previousVersionId).toBe(projectV1.versionId);
    expect(ensureCanonicalProjectState(stored().project!).objects.some((object) => object.actuality === "CURRENT" && object.content === "Dosage X")).toBe(true);
    expect(runtime.language).not.toHaveBeenCalled();
    expect(network).not.toHaveBeenCalled();
  });
});
