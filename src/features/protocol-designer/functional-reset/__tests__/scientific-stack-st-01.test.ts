import { describe, expect, it } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine";
import type {
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationTurn,
} from "@/features/scientific-interpretation";
import {
  buildProjectContextSnapshot,
  confirmResearchProjectContribution,
  ensureCanonicalProjectState,
  invokeScientificThinkingOwnerFromProject,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation";
import { createProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import { createScientificExecutionTraceLedger } from "@/features/protocol-designer/scientific-execution-trace";
import {
  buildScientificThinkingSelectionContribution,
  dispatchScientificThinkingFromQuery,
  isScientificThinkingQueryDispatch,
  resolveScientificThinkingConversation,
  scientificThinkingInteractionMatchesCurrentProject,
} from "../scientific-thinking-standard";
import { makeFunctionalReset03A1Contribution } from "./functional-reset-03a1-fixtures";

const AT = "2026-09-03T08:00:00.000Z";
const authority = {
  actorRef: "researcher:scientific-stack-st-01",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const turn = (suffix: string, content: string, role: "USER" | "NOXIA" = "USER"): ScientificInterpretationTurn => ({
  turnId: `turn:scientific-stack-st-01:${suffix}`,
  role,
  content,
  createdAt: AT,
});

const item = (input: {
  id: string;
  type: string;
  content: string;
  sourceTurn: ScientificInterpretationTurn;
  role?: string;
}): ScientificContributionItem => ({
  itemId: input.id,
  semanticIdentity: input.id,
  proposedType: input.type,
  content: input.content,
  polarity: "AFFIRMED",
  studyRole: input.role ?? input.type,
  confidence: 1,
  previousItemIds: [],
  epistemicBoundary: {
    ownership: "SCIENTIFIC_INTERPRETATION",
    epistemicStatus: "EXPLICIT_USER_STATED",
    adoptionStatus: "CANDIDATE",
    activeState: true,
    sourceTurnIds: [input.sourceTurn.turnId],
    sourceText: input.sourceTurn.content,
  },
});

const projectFrom = (input: {
  id: string;
  objective?: string;
  question?: string;
  hypotheses?: string[];
  imaging?: boolean;
  analysis?: boolean;
}) => {
  const sourceTurn = turn(input.id, [input.objective, input.question, ...(input.hypotheses ?? [])].filter(Boolean).join(" "));
  const base = makeFunctionalReset03A1Contribution([sourceTurn]);
  const candidateObjects = [
    item({ id: `condition:${input.id}`, type: "CONDITION", content: "infarctus du myocarde", sourceTurn }),
    item({ id: `population:${input.id}`, type: "POPULATION", content: "patients après infarctus du myocarde", sourceTurn }),
    ...(input.objective ? [item({ id: `objective:${input.id}`, type: "OBJECTIVE", content: input.objective, sourceTurn, role: "PRIMARY" })] : []),
    ...(input.question ? [item({ id: `question:${input.id}`, type: "SCIENTIFIC_QUESTION", content: input.question, sourceTurn })] : []),
    ...(input.hypotheses ?? []).map((hypothesis, index) => item({ id: `hypothesis:${input.id}:${index + 1}`, type: "HYPOTHESIS", content: hypothesis, sourceTurn, role: index === 0 ? "PRIMARY" : "ALTERNATIVE" })),
    ...(input.imaging ? [item({ id: `modality:${input.id}`, type: "MODALITY", content: "IRM cardiaque", sourceTurn })] : []),
    ...(input.analysis ? [item({ id: `analysis:${input.id}`, type: "ANALYSIS_SPECIFICATION", content: "distinguer les trajectoires longitudinales concurrentes", sourceTurn })] : []),
  ];
  const contribution = {
    ...structuredClone(base),
    identity: {
      ...base.identity,
      contributionId: `contribution:${input.id}`,
      contributionDigest: logicalDigest({ id: input.id, candidates: candidateObjects.map((candidate) => candidate.itemId) }),
    },
    source: { ...base.source, originalRequest: sourceTurn.content, turns: [sourceTurn], sourceRefs: [sourceTurn.turnId] },
    scientificContent: {
      ...structuredClone(base.scientificContent),
      explicitStatements: [],
      candidateObjects,
      candidateRelations: [],
      temporalElements: [],
    },
  } as ScientificInterpretationContributionEnvelope;
  return confirmResearchProjectContribution({
    contribution,
    current: null,
    projectId: `research-project:${input.id}`,
    authority,
    confirmedAt: AT,
  });
};

const invoke = (project: ResearchProjectOwnerProjection) => invokeScientificThinkingOwnerFromProject({
  project,
  startedAt: AT,
  completedAt: "2026-09-03T08:00:01.000Z",
});

const dispatch = (project: ResearchProjectOwnerProjection) => {
  const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
  return {
    navigation,
    result: dispatchScientificThinkingFromQuery({
      project,
      navigation,
      ownerResultLedger: createProductOwnerResultLedger(`session:${project.projectId}`),
      traceLedger: createScientificExecutionTraceLedger(`session:${project.projectId}`),
      sessionId: `session:${project.projectId}`,
      conversationId: `conversation:${project.projectId}`,
      presentationTurnRef: `turn:${project.projectId}:presentation`,
      startedAt: AT,
      completedAt: "2026-09-03T08:00:01.000Z",
    }),
  };
};

describe("SCIENTIFIC-STACK-ST-01 — governed Scientific Thinking owner", () => {
  it("A/D — preserves an over-broad question as an explicit information need without inventing a mechanism", () => {
    const project = projectFrom({ id: "broad", objective: "étudier le remodelage après infarctus" });
    const result = invoke(project).result!.nativePayload;
    expect(result.status).toBe("CLARIFICATION_REQUIRED");
    expect(result.questions[0]).toMatchObject({ testability: "NEEDS_CLARIFICATION" });
    expect(result.hypotheses).toEqual([]);
    expect(result.mechanisms).toEqual([]);
    expect(result.scientificModels).toEqual([]);
    expect(result.epistemicStatus).toBe("INSUFFICIENT_CONTEXT_UNKNOWN_PRESERVED");
    expect(result.unknowns.length).toBeGreaterThan(0);
  });

  it("B — formulates a valid scientific-question candidate from an explicit longitudinal objective and exact Project binding", () => {
    const project = projectFrom({ id: "longitudinal", objective: "caractériser l’évolution longitudinale du remodelage ventriculaire après infarctus" });
    const { navigation, result } = dispatch(project);
    expect(isScientificThinkingQueryDispatch(navigation)).toBe(true);
    expect(navigation.currentAction).toMatchObject({ owner: "SCIENTIFIC_THINKING" });
    expect(result.output.questions.some((candidate) => candidate.testability === "TESTABLE_CANDIDATE")).toBe(true);
    expect(result.output.sourceProject).toEqual({
      projectId: project.projectId,
      projectVersion: project.versionId,
      projectDigest: project.projectDigest,
      snapshotDigest: buildProjectContextSnapshot({ project }).snapshotDigest,
    });
    expect(result).toMatchObject({ providerCalls: 0, projectWrites: 0, humanDecisionCreated: false });
    expect(result.output).toMatchObject({ projectWriteAuthorized: false, candidateIsAdopted: false, projectOwnershipTransferred: false });
  });

  it("C — retains two Project hypotheses as competing alternatives without selecting a winner", () => {
    const hypotheses = [
      "Le remodelage reflète principalement la taille de la nécrose initiale.",
      "Le remodelage reflète principalement une inflammation persistante indépendante de la taille de la nécrose.",
    ];
    const project = projectFrom({
      id: "alternatives",
      question: "Après infarctus, quels mécanismes expliquent l’évolution longitudinale du remodelage ventriculaire ?",
      objective: "expliquer l’évolution longitudinale du remodelage ventriculaire après infarctus",
      hypotheses,
    });
    const output = invoke(project).result!.nativePayload;
    expect(output.hypotheses.map((candidate) => candidate.text)).toEqual(hypotheses);
    expect(output.hypotheses.map((candidate) => candidate.kind)).toEqual(["PRIMARY", "ALTERNATIVE"]);
    expect(output.hypotheses.every((candidate) => candidate.reviewState === "PENDING")).toBe(true);
    expect(output.selectedQuestionCandidate).toBeNull();
    expect(invoke(project).result?.projectContribution?.scientificContent.candidateObjects.map((candidate) => candidate.content)).toEqual(hypotheses);
  });

  it("E/F/G/H — emits only non-executed owner handoffs and invents no downstream answer", () => {
    const project = projectFrom({
      id: "handoffs",
      question: "L’évolution longitudinale du remodelage en IRM est-elle associée aux lésions après infarctus ?",
      objective: "caractériser et comparer l’évolution longitudinale du remodelage en IRM après infarctus",
      imaging: true,
      analysis: true,
    });
    const output = invoke(project).result!.nativePayload;
    expect(output.downstreamHandoffs.map((handoff) => handoff.targetOwner)).toEqual(expect.arrayContaining([
      "OBSERVABILITY_MEASUREMENT",
      "STUDY_DESIGN",
      "IMAGING",
      "BIOSTATISTICS",
      "KNOWLEDGE",
    ]));
    expect(output.downstreamHandoffs.every((handoff) => handoff.status === "PROPOSED_NOT_EXECUTED"
      && handoff.ownershipTransferred === false
      && handoff.projectWriteAuthorized === false)).toBe(true);
    expect(output.downstreamHandoffs.find((handoff) => handoff.targetOwner === "OBSERVABILITY_MEASUREMENT")?.informationNeeded).not.toContain("MeasurementDefinition");
    expect(output.downstreamHandoffs.find((handoff) => handoff.targetOwner === "IMAGING")?.informationNeeded.join(" ")).not.toMatch(/séquence|protocole d.acquisition/i);
    expect(output.downstreamHandoffs.find((handoff) => handoff.targetOwner === "BIOSTATISTICS")?.informationNeeded.join(" ")).not.toMatch(/régression|modèle statistique/i);
  });

  it("I — explains competing hypotheses without creating a Project write or decision", () => {
    const project = projectFrom({
      id: "discussion",
      question: "Après infarctus, quels mécanismes expliquent l’évolution longitudinale du remodelage ventriculaire ?",
      objective: "expliquer l’évolution longitudinale du remodelage ventriculaire",
      hypotheses: ["Hypothèse nécrotique", "Hypothèse inflammatoire"],
    });
    const output = invoke(project).result!.nativePayload;
    const before = JSON.stringify(project);
    const resolution = resolveScientificThinkingConversation({ raw: "Pourquoi ces deux hypothèses ?", output });
    expect(resolution.kind).toBe("DISCUSS");
    expect(JSON.stringify(project)).toBe(before);
    expect(output.candidateIsAdopted).toBe(false);
  });

  it("J — explicit hypothesis selection creates Human Review and only confirmation increments Project version", () => {
    const project = projectFrom({
      id: "adoption",
      objective: "caractériser l’évolution longitudinale du remodelage",
    });
    const { result } = dispatch(project);
    const resolution = resolveScientificThinkingConversation({ raw: "Je choisis l’hypothèse 1.", output: result.output });
    expect(resolution).toMatchObject({ kind: "SELECT_CANDIDATE" });
    if (resolution.kind !== "SELECT_CANDIDATE") throw new Error("SELECTION_EXPECTED");
    const proposalTurn = turn("proposal", result.presentation.plainText, "NOXIA");
    const selectionTurn = turn("selection", "Je choisis l’hypothèse 1.");
    const contribution = buildScientificThinkingSelectionContribution({
      conversationId: "conversation:adoption",
      project,
      output: result.output,
      candidateRef: resolution.candidateRef,
      proposalTurn,
      selectionTurn,
      createdAt: AT,
    });
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    expect(candidate.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
    expect(project.versionId).toBe(result.interaction.sourceProjectVersion);
    const adopted = confirmResearchProjectContribution({
      contribution,
      current: project,
      projectId: project.projectId,
      authority,
      confirmedAt: "2026-09-03T08:00:02.000Z",
      reviewedProjection: candidate.humanReviewProjection,
    });
    expect(adopted.revision).toBe(project.revision + 1);
    expect(ensureCanonicalProjectState(adopted).objects.some((object) => object.actuality === "CURRENT" && object.objectType === "HYPOTHESIS")).toBe(true);
    expect(scientificThinkingInteractionMatchesCurrentProject(result.interaction, adopted)).toBe(false);
  });

  it("recognizes 'Je retiens' as a proposed selection, never its negation or automatic adoption", () => {
    const project = projectFrom({ id: "retain-selection", objective: "caractériser l’évolution longitudinale du remodelage" });
    const { result } = dispatch(project);
    const before = JSON.stringify(project);
    expect(result.output.questions.length).toBeGreaterThan(0);
    expect(resolveScientificThinkingConversation({ raw: "Je retiens la question 1.", output: result.output }))
      .toEqual({ kind: "SELECT_CANDIDATE", candidateRef: result.output.questions[0]!.questionId });
    for (const raw of ["Je ne retiens pas la question 1.", "Je retiens pas la question 1."]) {
      expect(resolveScientificThinkingConversation({ raw, output: result.output }).kind).not.toBe("SELECT_CANDIDATE");
    }
    expect(JSON.stringify(project)).toBe(before);
    expect(result.output.candidateIsAdopted).toBe(false);
  });

  it("QRY boundary — a non-ST scope does not trigger Scientific Thinking", () => {
    const project = projectFrom({ id: "non-st-scope" });
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
    expect(navigation.currentAction?.owner).not.toBe("SCIENTIFIC_THINKING");
    expect(isScientificThinkingQueryDispatch(navigation)).toBe(false);
    expect(() => dispatchScientificThinkingFromQuery({
      project,
      navigation,
      ownerResultLedger: createProductOwnerResultLedger("session:non-st-scope"),
      traceLedger: createScientificExecutionTraceLedger("session:non-st-scope"),
      sessionId: "session:non-st-scope",
      conversationId: "conversation:non-st-scope",
      presentationTurnRef: "turn:non-st-scope",
      startedAt: AT,
      completedAt: AT,
    })).toThrow("QRY_ACTION_NOT_OWNED_BY_SCIENTIFIC_THINKING");
  });
});
