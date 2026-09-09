import { describe, expect, it } from "vitest";
import {
  PERSISTENT_DELTA_SYSTEM_INSTRUCTION,
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentProjectDeltaChange,
  type PersistentProjectDeltaWireCandidate,
  type PersistentTemporalQualification,
} from "@/features/protocol-designer/product-bridge";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation";
import {
  buildProjectContextSnapshot,
  buildScientificThinkingInputFromProjectSnapshot,
  confirmResearchProjectContribution,
  ensureCanonicalProjectState,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { executeScientificThinkingEngine } from "@/features/scientific-thinking";
import { buildStandardScientificThinkingPresentation } from "../scientific-thinking-standard";
import {
  adoptBehaviorContribution,
  behaviorContribution,
  behaviorItem,
  behaviorRelation,
  behaviorTurn,
} from "./p1-behavior-01a-contract-fixtures";

const CORRECTION = "1: je souhaite étudier l'impact des méthodes de reperfusion sur la présence et l'importance des lésions microvasculaire avec pour hypothese que la mise en place a J+3 du stent (post reperfusion) réduira ces lésions. 2: je ne comprends pas la question ca ne veut pas dire grand chose 3 post idm veut dire post reperfusion dans ce contexte 4 viabilité = type d'irm 5: mesure précoce et tardive ne sont pas des mesures ce sont des rehaussements tardifs et précoce.";

const authority = {
  actorRef: "v1-contextual-understanding:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const conversation = (raw: string, conversationId = "conversation:v1-contextual-understanding"): ScientificInterpretationConversation => ({
  conversationId,
  language: "fr",
  turns: [{ turnId: `${conversationId}:turn`, role: "USER", content: raw }],
});

const add = (
  sourceText: string,
  candidateRef: string,
  proposedType: string,
  content: string,
  epistemicState: "KNOWN" | "UNKNOWN" = "KNOWN",
): PersistentProjectDeltaChange => ({
  operation: "ADD",
  sourceText,
  candidateRef,
  proposedType,
  content,
  polarity: "AFFIRMED",
  epistemicStatus: epistemicState === "KNOWN" ? "EXPLICIT_USER_STATED" : "AMBIGUOUS",
  epistemicState,
  assertionKind: "USER_STATED",
  evidenceRefs: [],
});

const wire = (
  changes: PersistentProjectDeltaChange[],
  temporalQualifications: PersistentTemporalQualification[] = [],
): PersistentProjectDeltaWireCandidate => ({
  changes,
  relations: [],
  temporalQualifications,
  expectedVariableOccasions: [],
});

const contributionFromWire = (input: {
  raw: string;
  candidate: PersistentProjectDeltaWireCandidate;
  currentProject: ResearchProjectOwnerProjection | null;
  conversationId?: string;
}) => {
  const context = conversation(input.raw, input.conversationId);
  const checked = validatePersistentProjectDelta(input.candidate, input.raw, input.currentProject, context);
  expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
  const contribution = contributionFromPersistentDelta({
    candidate: checked.candidate!,
    conversation: context,
    currentProject: input.currentProject,
    createdAt: "2026-09-09T18:00:00.000Z",
  });
  expect(contribution).not.toBeNull();
  return contribution!;
};

const initialImagingProject = () => {
  const raw = "Étude post IDM comparant une pose immédiate ou différée du stent, avec une IRM entre J3 et J6 et la taille des lésions microvasculaires à 3 min post-injection comme critère principal.";
  const turn = behaviorTurn("turn:v1-contextual-understanding:base", raw);
  return adoptBehaviorContribution(behaviorContribution({
    contributionId: "contribution:v1-contextual-understanding:base",
    turns: [turn],
    candidateObjects: [
      behaviorItem({ itemId: "objective:reperfusion", proposedType: "OBJECTIVE", content: "Évaluer l'impact des stratégies de reperfusion sur les lésions microvasculaires", turnId: turn.turnId }),
      behaviorItem({ itemId: "condition:post-idm", proposedType: "CONDITION", content: "post IDM", turnId: turn.turnId }),
      behaviorItem({ itemId: "intervention:stent-immediate", proposedType: "INTERVENTION", content: "Mise en place immédiate du stent", turnId: turn.turnId, studyRole: "INTERVENTION_ARM" }),
      behaviorItem({ itemId: "comparator:stent-delayed", proposedType: "COMPARATOR", content: "Mise en place différée du stent", turnId: turn.turnId, studyRole: "COMPARATOR_ARM" }),
      behaviorItem({ itemId: "modality:mri", proposedType: "MODALITY", content: "IRM", turnId: turn.turnId }),
      behaviorItem({ itemId: "acquisition:mri", proposedType: "ACQUISITION", content: "IRM entre J3 et J6", turnId: turn.turnId }),
      behaviorItem({ itemId: "endpoint:microvascular-lesions", proposedType: "ENDPOINT", content: "Taille des lésions microvasculaires à 3 min post-injection", turnId: turn.turnId, studyRole: "PRIMARY_ENDPOINT" }),
    ],
    relations: [behaviorRelation({
      relationId: "relation:stent-comparison",
      relationType: "COMPARES_WITH",
      sourceItemId: "intervention:stent-immediate",
      targetItemId: "comparator:stent-delayed",
      turnId: turn.turnId,
    })],
  }), null, 42);
};

const adopt = (contribution: ReturnType<typeof contributionFromWire>, current: ResearchProjectOwnerProjection | null, projectId: string) => confirmResearchProjectContribution({
  contribution,
  current,
  projectId,
  authority,
  confirmedAt: "2026-09-09T18:01:00.000Z",
  reviewedProjection: prepareResearchProjectContributionCandidate(contribution, current).humanReviewProjection,
});

const acquisitionCount = (project: ResearchProjectOwnerProjection) => ensureCanonicalProjectState(project).objects
  .filter((item) => item.actuality === "CURRENT" && item.objectType === "ACQUISITION").length;

describe("V1 contextual corrections and local referents", () => {
  it("keeps local definitions scoped to the current Project and preserves the human adoption gate", () => {
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).toContain("restent rattachés à cette même occurrence");
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).toContain("reste locale à ce Project");
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).toContain("sans alias global");

    const project = initialImagingProject();
    const comparatorRef = ensureCanonicalProjectState(project).objects.find((item) => item.actuality === "CURRENT"
      && item.scientificRole === "COMPARATOR_ARM")!.objectId;
    const objectiveRef = ensureCanonicalProjectState(project).objects.find((item) => item.actuality === "CURRENT"
      && item.objectType === "OBJECTIVE")!.objectId;
    const candidate = wire([
      {
        ...add("je souhaite étudier l'impact des méthodes de reperfusion sur la présence et l'importance des lésions microvasculaire", "replacement:objective-microvascular-injury", "OBJECTIVE", "Étudier l'impact des méthodes de reperfusion sur la présence et l'importance des lésions microvasculaires"),
        operation: "REPLACE",
        targetProjectRef: objectiveRef,
      },
      add("pour hypothese que la mise en place a J+3 du stent (post reperfusion) réduira ces lésions", "hypothesis:delayed-stent", "HYPOTHESIS", "La mise en place du stent à J+3 après reperfusion réduira les lésions microvasculaires"),
      {
        ...add("mise en place a J+3 du stent (post reperfusion)", "replacement:stent-delayed-j3", "COMPARATOR", "Mise en place du stent à J+3 après reperfusion"),
        operation: "REPLACE",
        targetProjectRef: comparatorRef,
        studyRole: "COMPARATOR_ARM",
      },
      add("post idm veut dire post reperfusion dans ce contexte", "project-information:post-idm-local-definition", "PROJECT_INFORMATION", "Dans ce Project, « post IDM » signifie « post reperfusion »"),
      add("viabilité = type d'irm", "project-information:viability-local-definition", "PROJECT_INFORMATION", "Dans ce Project, « viabilité » désigne le type d'IRM"),
      add("mesure précoce et tardive ne sont pas des mesures ce sont des rehaussements tardifs et précoce", "project-information:enhancement-phases", "PROJECT_INFORMATION", "Les mentions précoce et tardif désignent les rehaussements précoce et tardif dans la même IRM"),
    ]);
    const contribution = contributionFromWire({ raw: CORRECTION, candidate, currentProject: project });
    const before = JSON.stringify(project);
    const review = prepareResearchProjectContributionCandidate(contribution, project);
    expect(JSON.stringify(project)).toBe(before);
    expect(review.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
    expect(review.projectWriteAuthorized).toBe(false);

    const revised = adopt(contribution, project, project.projectId);
    const state = ensureCanonicalProjectState(revised);
    expect(acquisitionCount(revised)).toBe(1);
    expect(state.objects.find((item) => item.actuality === "CURRENT" && item.scientificRole === "COMPARATOR_ARM")?.content)
      .toBe("Mise en place du stent à J+3 après reperfusion");
    expect(state.objects.find((item) => item.actuality === "CURRENT" && item.objectType === "HYPOTHESIS")?.content)
      .toBe("La mise en place du stent à J+3 après reperfusion réduira les lésions microvasculaires");
    expect(state.objects.find((item) => item.actuality === "CURRENT" && item.scientificRole === "PRIMARY_ENDPOINT")?.content)
      .toBe("Taille des lésions microvasculaires à 3 min post-injection");
    expect(state.objects.filter((item) => item.actuality === "CURRENT" && item.objectType === "PROJECT_INFORMATION").map((item) => item.content))
      .toEqual(expect.arrayContaining([
        "Dans ce Project, « post IDM » signifie « post reperfusion »",
        "Dans ce Project, « viabilité » désigne le type d'IRM",
        "Les mentions précoce et tardif désignent les rehaussements précoce et tardif dans la même IRM",
      ]));

    const scientificInput = buildScientificThinkingInputFromProjectSnapshot({
      projectSnapshot: buildProjectContextSnapshot({ project: revised }),
      projectRevision: revised.revision,
      purpose: "Formuler ou préciser la question scientifique à partir du contenu adopté.",
    });
    const scientificOutput = executeScientificThinkingEngine(scientificInput);
    const visible = buildStandardScientificThinkingPresentation(scientificOutput).plainText;
    expect(scientificInput.existingHypotheses).toEqual([
      "La mise en place du stent à J+3 après reperfusion réduira les lésions microvasculaires",
    ]);
    expect(visible).toContain("La question scientifique et l’hypothèse exprimée");
    expect(visible).toContain("Mise en place immédiate du stent");
    expect(visible).toContain("Mise en place du stent à J+3 après reperfusion");
    expect(visible).toContain("Taille des lésions microvasculaires à 3 min post-injection");
    expect(visible).toContain("Hypothèse de travail\nLa mise en place du stent à J+3 après reperfusion réduira les lésions microvasculaires");
    expect(visible).not.toMatch(/Quel phénomène relatif à|comparaison entre IRM.*Acquisition|PENDING_VERIFICATION/i);
    expect(visible).not.toContain("Point à préciser");
  });

  it("A — a same-exam addition does not create another acquisition", () => {
    const project = initialImagingProject();
    const raw = "Garde le rehaussement tardif dans cette même IRM, sans examen supplémentaire.";
    const contribution = contributionFromWire({
      raw,
      currentProject: project,
      conversationId: "conversation:v1-contextual:same-exam",
      candidate: wire([add(raw, "project-information:same-mri-late-enhancement", "PROJECT_INFORMATION", "Rehaussement tardif dans la même IRM, sans examen supplémentaire")]),
    });
    const revised = adopt(contribution, project, project.projectId);
    expect(acquisitionCount(revised)).toBe(1);
  });

  it("B/C — distinguishes two explicit exams from a context-free temporal ambiguity", () => {
    const twoExams = "Je prévois deux IRM distinctes, une à J5 et l’autre à M3.";
    const j5 = add("une à J5", "acquisition:mri:j5", "ACQUISITION", "IRM distincte à J5");
    const m3 = add("l’autre à M3", "acquisition:mri:m3", "ACQUISITION", "IRM distincte à M3");
    const timing = (sourceText: string, qualificationId: string, subjectProjectRef: string, unit: "DAY" | "MONTH", offset: number): PersistentTemporalQualification => ({
      operation: "ADD",
      qualificationId,
      sourceText,
      subjectProjectRef,
      temporalRole: "ACQUISITION_TIME",
      anchor: {
        kind: "TIMEPOINT", direction: "UNKNOWN", unit, offset,
        lowerBound: null, upperBound: null, relativeEventLabel: null, tolerance: null,
        reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
      },
      assertionKind: "USER_STATED",
      evidenceRefs: [],
    });
    const twoExamContribution = contributionFromWire({
      raw: twoExams,
      currentProject: null,
      conversationId: "conversation:v1-contextual:two-exams",
      candidate: wire([j5, m3], [
        timing("une à J5", "timing:mri:j5", "acquisition:mri:j5", "DAY", 5),
        timing("l’autre à M3", "timing:mri:m3", "acquisition:mri:m3", "MONTH", 3),
      ]),
    });
    const twoExamProject = adopt(twoExamContribution, null, "project:v1-contextual:two-exams");
    expect(acquisitionCount(twoExamProject)).toBe(2);
    expect(ensureCanonicalProjectState(twoExamProject).temporalQualifications.filter((item) => item.actuality === "CURRENT")).toHaveLength(2);

    const ambiguous = "Je prévois une mesure précoce et une tardive.";
    const ambiguousContribution = contributionFromWire({
      raw: ambiguous,
      currentProject: null,
      conversationId: "conversation:v1-contextual:ambiguous",
      candidate: wire([add(ambiguous, "project-information:early-late-ambiguous", "PROJECT_INFORMATION", "Mesure précoce et tardive : modalité, occurrences et référentiel à préciser", "UNKNOWN")]),
    });
    const ambiguousProject = adopt(ambiguousContribution, null, "project:v1-contextual:ambiguous");
    expect(acquisitionCount(ambiguousProject)).toBe(0);
    expect(ensureCanonicalProjectState(ambiguousProject).temporalQualifications).toHaveLength(0);
    expect(ensureCanonicalProjectState(ambiguousProject).objects[0]).toMatchObject({ objectType: "PROJECT_INFORMATION", epistemicState: "UNKNOWN" });
  });

  it("D — reuses a non-cardiac local definition without creating a second test", () => {
    const initial = "Nous étudions la résistance d’un matériau. Pendant un même essai de compression, on relève la déformation initiale et finale. Dans ce projet, “après traitement” signifie après le cycle thermique.";
    const initialContribution = contributionFromWire({
      raw: initial,
      currentProject: null,
      conversationId: "conversation:v1-contextual:material",
      candidate: wire([
        add("un même essai de compression", "acquisition:compression-test", "ACQUISITION", "Essai de compression unique"),
        add("déformation initiale", "variable:initial-deformation", "MEASURED_VARIABLE", "Déformation initiale"),
        add("déformation initiale et finale", "variable:final-deformation", "MEASURED_VARIABLE", "Déformation finale"),
        add("Dans ce projet, “après traitement” signifie après le cycle thermique", "project-information:after-treatment", "PROJECT_INFORMATION", "Dans ce Project, « après traitement » signifie après le cycle thermique"),
      ]),
    });
    const project = adopt(initialContribution, null, "project:v1-contextual:material");
    const followUp = "Ajoute une mesure intermédiaire dans ce même essai.";
    const followUpContribution = contributionFromWire({
      raw: followUp,
      currentProject: project,
      conversationId: "conversation:v1-contextual:material",
      candidate: wire([add(followUp, "variable:intermediate-deformation", "MEASURED_VARIABLE", "Déformation intermédiaire dans le même essai de compression")]),
    });
    const revised = adopt(followUpContribution, project, project.projectId);
    const state = ensureCanonicalProjectState(revised);
    expect(acquisitionCount(revised)).toBe(1);
    expect(state.objects.filter((item) => item.actuality === "CURRENT" && item.objectType === "CANONICAL_VARIABLE")).toHaveLength(3);
    expect(state.objects.some((item) => item.actuality === "CURRENT" && /cardia|irm|stent|myocard/i.test(item.content))).toBe(false);
    expect(state.objects.some((item) => item.actuality === "CURRENT" && item.content.includes("après le cycle thermique"))).toBe(true);
  });
});
