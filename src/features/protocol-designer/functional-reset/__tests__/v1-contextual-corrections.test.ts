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
  rejectResearchProjectContribution,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { executeScientificThinkingEngine } from "@/features/scientific-thinking";
import { buildStandardScientificThinkingPresentation } from "../scientific-thinking-standard";
import { routeProductEntry } from "../product-entry-routing";
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
  const contribution = behaviorContribution({
    contributionId: "contribution:v1-contextual-understanding:base",
    turns: [turn],
    candidateObjects: [
      behaviorItem({ itemId: "objective:reperfusion", proposedType: "OBJECTIVE", content: "Évaluer l'impact des stratégies de reperfusion sur les lésions microvasculaires", turnId: turn.turnId }),
      behaviorItem({ itemId: "condition:post-idm", proposedType: "CONDITION", content: "post IDM", turnId: turn.turnId }),
      behaviorItem({ itemId: "intervention:stent-immediate", proposedType: "INTERVENTION", content: "Mise en place immédiate du stent", turnId: turn.turnId, studyRole: "INTERVENTION_ARM" }),
      behaviorItem({ itemId: "comparator:stent-delayed", proposedType: "COMPARATOR", content: "Mise en place différée du stent", turnId: turn.turnId, studyRole: "COMPARATOR_ARM" }),
      behaviorItem({ itemId: "modality:mri", proposedType: "MODALITY", content: "IRM", turnId: turn.turnId }),
      behaviorItem({ itemId: "acquisition:mri", proposedType: "ACQUISITION", content: "IRM entre J3 et J6", turnId: turn.turnId }),
      behaviorItem({ itemId: "endpoint:microvascular-lesions", proposedType: "ENDPOINT", content: "Taille des lésions microvasculaires", turnId: turn.turnId, studyRole: "PRIMARY_ENDPOINT" }),
      behaviorItem({ itemId: "variable:microvascular-lesions", proposedType: "CANONICAL_VARIABLE", content: "Taille des lésions microvasculaires", turnId: turn.turnId, studyRole: "OUTCOME_ROLE" }),
    ],
    relations: [behaviorRelation({
      relationId: "relation:stent-comparison",
      relationType: "COMPARES_WITH",
      sourceItemId: "intervention:stent-immediate",
      targetItemId: "comparator:stent-delayed",
      turnId: turn.turnId,
    })],
  });
  contribution.scientificContent.expectedVariableOccasions = [{
    operation: "ADD",
    occasionId: "occasion:microvascular-lesions:3-min-post-injection",
    variableProjectRef: "variable:microvascular-lesions",
    anchor: {
      kind: "TIMEPOINT", direction: "AFTER", unit: "minutes", offset: 3,
      lowerBound: null, upperBound: null, relativeEventLabel: "injection", tolerance: null,
      reference: { status: "EXPLICIT", bindingStatus: "PROJECT_REF_UNRESOLVED" },
    },
    studyUnitOrGroupRef: null,
    applicableContext: null,
    sourceText: "taille des lésions microvasculaires à 3 min post-injection",
    assertionKind: "USER_STATED",
    evidenceRefs: [],
  }];
  return adoptBehaviorContribution(contribution, null, 42);
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
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).toContain("ne nomme pas à lui seul une grandeur mesurée");
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).toContain("ne devient donc pas une CANONICAL_VARIABLE autonome");
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).toContain("preuve explicite de pluralité des réalisations");
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
      .toBe("Taille des lésions microvasculaires");
    expect(state.expectedVariableOccasions.find((item) => item.actuality === "CURRENT")?.anchor)
      .toMatchObject({ offset: 3, unit: "minutes", relativeEventLabel: "injection" });
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
    expect(visible).toContain("Taille des lésions microvasculaires");
    expect(visible).toContain("Hypothèse de travail\nLa mise en place du stent à J+3 après reperfusion réduira les lésions microvasculaires");
    expect(visible).not.toMatch(/Quel phénomène relatif à|comparaison entre IRM.*Acquisition|PENDING_VERIFICATION/i);
    expect(visible).not.toContain("Point à préciser");
  });

  it("A — a same-exam addition does not create another acquisition", () => {
    const project = initialImagingProject();
    const raw = "Dans cette même IRM, conserve le rehaussement précoce et tardif, sans examen supplémentaire.";
    const contribution = contributionFromWire({
      raw,
      currentProject: project,
      conversationId: "conversation:v1-contextual:same-exam",
      candidate: wire([add(raw, "project-information:same-mri-enhancement-phases", "PROJECT_INFORMATION", "Rehaussement précoce et tardif dans la même IRM, sans examen supplémentaire")]),
    });
    const revised = adopt(contribution, project, project.projectId);
    expect(acquisitionCount(revised)).toBe(1);
  });

  it("keeps an ellipted phase ambiguity attached to one occurrence and exposes it for clarification", () => {
    const raw = "Je prévois un essai unique évaluant une lecture précoce et tardive, mais la nature exacte de ces phases reste à préciser.";
    const contribution = contributionFromWire({
      raw,
      currentProject: null,
      conversationId: "conversation:v1-contextual:ellipted-phases",
      candidate: wire([
        add("un essai unique", "acquisition:single-test", "ACQUISITION", "Essai unique"),
        add("lecture précoce et tardive, mais la nature exacte de ces phases reste à préciser", "uncertainty:early-late-phases", "UNCERTAINTY", "Dans l’essai unique, la nature des phases précoce et tardive reste à préciser", "UNKNOWN"),
      ]),
    });
    expect(contribution.scientificContent.ambiguities).toContainEqual(expect.objectContaining({
      itemId: "uncertainty:early-late-phases",
      proposedType: "UNCERTAINTY",
      epistemicBoundary: expect.objectContaining({ epistemicState: "UNKNOWN" }),
    }));
    const project = adopt(contribution, null, "project:v1-contextual:ellipted-phases");
    const state = ensureCanonicalProjectState(project);
    expect(acquisitionCount(project)).toBe(1);
    expect(state.objects.filter((item) => item.actuality === "CURRENT" && item.objectType === "CANONICAL_VARIABLE")).toHaveLength(0);
    expect(state.objects).toContainEqual(expect.objectContaining({ objectType: "UNCERTAINTY", epistemicState: "UNKNOWN" }));
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

describe("NPC01 — natural current-Project correction", () => {
  const routed = (raw: string, currentProjectAvailable = true) => routeProductEntry({
    raw,
    sourceTurnRef: `turn:npc01:${raw}`,
    routedAt: "2026-09-10T08:00:00.000Z",
    currentProjectAvailable,
  });

  it.each([
    ["c'est bon mais je préférerais M6", "MODIFY_EXISTING_PROJECT_OBJECT"],
    ["garde le design mais limite la population aux moins de 75 ans", "MODIFY_EXISTING_PROJECT_OBJECT"],
    ["c'est bien, j'ajouterais aussi le strain", "ADD_PROJECT_OBJECT"],
    ["finalement non, garde le critère précédent", "PRESERVE_EXISTING_PROJECT"],
    ["c'est ça mais exprime-la par unité de surface", "MODIFY_EXISTING_PROJECT_OBJECT"],
  ] as const)("routes a domain-neutral Project direction: %s", (raw, expected) => {
    expect(routed(raw)).toMatchObject({
      contractVersion: "1.3.0",
      routeIntent: "DESIGN_STUDY",
      routeConfidence: "HIGH",
      currentProjectDirection: expected,
      projectWriteAuthorized: false,
    });
  });

  it("does not invent a Project correction without an adopted Project or capture an owner candidate selection", () => {
    expect(routed("c'est bon mais je préférerais M6", false).currentProjectDirection).toBe("NONE");
    expect(routed("Je retiens l’hypothèse 2").currentProjectDirection).toBe("NONE");
    expect(routed("Quelle est la limite de détection de cette méthode ?").currentProjectDirection).toBe("NONE");
    expect(routed("Est-ce que la température change après exposition ?").currentProjectDirection).toBe("NONE");
    expect(routeProductEntry({
      raw: "Formule-la autrement.",
      sourceTurnRef: "turn:npc01:correct-again",
      routedAt: "2026-09-10T08:00:00.000Z",
      currentProjectAvailable: true,
      explicitCorrectionMode: true,
      forceUnderstand: true,
    })).toMatchObject({
      currentProjectDirection: "MODIFY_EXISTING_PROJECT_OBJECT",
      projectConstructionEligible: true,
      projectWriteAuthorized: false,
    });
  });

  it("prepares the exact endpoint/variable patch without mutating v1 and preserves role, occasion and provenance", () => {
    const project = initialImagingProject();
    expect(project.revision).toBe(1);
    const state = ensureCanonicalProjectState(project);
    const endpoint = state.objects.find((item) => item.actuality === "CURRENT" && item.scientificRole === "PRIMARY_ENDPOINT")!;
    const variable = state.objects.find((item) => item.actuality === "CURRENT" && item.objectType === "CANONICAL_VARIABLE"
      && item.content === "Taille des lésions microvasculaires")!;
    const raw = "c'est ça mais a la place de taille j'utiliserais peut être % de la masse vg que représentent les lésions microvasculaires afin de pouvoir comparer les sujets entre eux.";
    const proposed = "Pourcentage de la masse VG représenté par les lésions microvasculaires";
    expect(routed(raw)).toMatchObject({
      currentProjectDirection: "MODIFY_EXISTING_PROJECT_OBJECT",
      projectConstructionEligible: true,
    });
    const contribution = contributionFromWire({
      raw,
      currentProject: project,
      conversationId: "conversation:npc01:exact",
      candidate: wire([
        { ...add(raw, "candidate:npc01:endpoint", "ENDPOINT", proposed), operation: "REPLACE", targetProjectRef: endpoint.objectId },
        { ...add(raw, "candidate:npc01:variable", "CANONICAL_VARIABLE", proposed), operation: "REPLACE", targetProjectRef: variable.objectId },
      ]),
    });
    const before = JSON.stringify(project);
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    expect(candidate).toMatchObject({ status: "CANDIDATE_PENDING_HUMAN_CONFIRMATION", projectWriteAuthorized: false });
    expect(JSON.stringify(project)).toBe(before);
    const endpointPatch = candidate.canonicalChangeSet.objectChanges.find((change) => change.objectId === endpoint.objectId)!;
    expect(endpointPatch).toMatchObject({ operation: "REPLACE", previousVersionRef: endpoint.objectVersionId });
    expect(endpointPatch.candidate).toMatchObject({
      objectType: "ENDPOINT", scientificRole: "PRIMARY_ENDPOINT", content: proposed,
      provenance: expect.objectContaining({ sourceText: raw }),
    });
    expect(candidate.canonicalChangeSet.expectedVariableOccasionChanges).toEqual([]);
    const rejected = rejectResearchProjectContribution({ contribution, current: project, authority, rejectedAt: "2026-09-10T08:01:00.000Z" });
    expect(rejected.status).toBe("REJECTED");
    expect(JSON.stringify(project)).toBe(before);

    const revised = adopt(contribution, project, project.projectId);
    const revisedState = ensureCanonicalProjectState(revised);
    expect(revised).toMatchObject({ revision: 2, previousVersionId: project.versionId, llmProjectWrites: 0 });
    expect(revisedState.objects.find((item) => item.actuality === "CURRENT" && item.objectId === endpoint.objectId))
      .toMatchObject({ content: proposed, scientificRole: "PRIMARY_ENDPOINT", version: endpoint.version + 1 });
    expect(revisedState.objects.find((item) => item.objectVersionId === endpoint.objectVersionId))
      .toMatchObject({ actuality: "SUPERSEDED", supersededByVersionRef: expect.any(String) });
    expect(revisedState.expectedVariableOccasions.find((item) => item.actuality === "CURRENT")?.anchor)
      .toMatchObject({ offset: 3, unit: "minutes", relativeEventLabel: "injection" });
  });

  it("A/B/C — patches timing or population and adds a measure without reconstructing unrelated Project state", () => {
    const baseTurn = behaviorTurn("turn:npc01:generic-base", "Essai randomisé chez des adultes, avec une visite à M3 et une mesure initiale.");
    const baseContribution = behaviorContribution({
      contributionId: "contribution:npc01:generic-base",
      turns: [baseTurn],
      candidateObjects: [
        behaviorItem({ itemId: "design:npc01", proposedType: "STUDY_DESIGN", content: "Essai randomisé", turnId: baseTurn.turnId }),
        behaviorItem({ itemId: "population:npc01", proposedType: "POPULATION", content: "Adultes", turnId: baseTurn.turnId }),
        behaviorItem({ itemId: "visit:npc01", proposedType: "VISIT", content: "Visite de suivi", turnId: baseTurn.turnId }),
        behaviorItem({ itemId: "variable:npc01:initial", proposedType: "CANONICAL_VARIABLE", content: "Mesure initiale", turnId: baseTurn.turnId }),
      ],
    });
    baseContribution.scientificContent.temporalQualifications = [{
      operation: "ADD", qualificationId: "timing:npc01:visit", subjectProjectRef: "visit:npc01",
      temporalRole: "COLLECTION_TIME",
      anchor: { kind: "TIMEPOINT", direction: "AFTER", unit: "MONTH", offset: 3, lowerBound: null, upperBound: null, relativeEventLabel: null, tolerance: null, reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" } },
      sourceText: "visite à M3", assertionKind: "USER_STATED", evidenceRefs: [],
    }];
    const base = adoptBehaviorContribution(baseContribution, null, 43);
    const baseState = ensureCanonicalProjectState(base);
    const population = baseState.objects.find((item) => item.objectId === "population:npc01")!;

    const timingRaw = "c'est bon mais je préférerais M6";
    const timingContribution = contributionFromWire({ raw: timingRaw, currentProject: base, candidate: wire([], [{
      operation: "REPLACE", qualificationId: "timing:npc01:visit", sourceText: "M6", subjectProjectRef: "visit:npc01",
      temporalRole: "COLLECTION_TIME",
      anchor: { kind: "TIMEPOINT", direction: "AFTER", unit: "MONTH", offset: 6, lowerBound: null, upperBound: null, relativeEventLabel: null, tolerance: null, reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" } },
      assertionKind: "USER_STATED", evidenceRefs: [],
    }]) });
    const timed = adopt(timingContribution, base, base.projectId);
    expect(ensureCanonicalProjectState(timed).temporalQualifications.find((item) => item.actuality === "CURRENT")?.anchor.offset).toBe(6);
    expect(ensureCanonicalProjectState(timed).objects.find((item) => item.objectId === "design:npc01")?.content).toBe("Essai randomisé");

    const populationRaw = "garde le design mais limite la population aux moins de 75 ans";
    const populationContribution = contributionFromWire({ raw: populationRaw, currentProject: timed, candidate: wire([{
      ...add(populationRaw, "candidate:npc01:population", "POPULATION", "Adultes de moins de 75 ans"),
      operation: "REPLACE", targetProjectRef: population.objectId,
    }]) });
    const restricted = adopt(populationContribution, timed, timed.projectId);
    expect(ensureCanonicalProjectState(restricted).objects.find((item) => item.objectId === "design:npc01" && item.actuality === "CURRENT")?.content).toBe("Essai randomisé");

    const addRaw = "c'est bien, j'ajouterais aussi le strain";
    const measureContribution = contributionFromWire({ raw: addRaw, currentProject: restricted, candidate: wire([
      add(addRaw, "variable:npc01:strain", "CANONICAL_VARIABLE", "Strain"),
    ]) });
    const expanded = adopt(measureContribution, restricted, restricted.projectId);
    const currentMeasures = ensureCanonicalProjectState(expanded).objects
      .filter((item) => item.actuality === "CURRENT" && item.objectType === "CANONICAL_VARIABLE");
    expect(currentMeasures.map((item) => item.content)).toEqual(expect.arrayContaining(["Mesure initiale", "Strain"]));
  });

  it("D/E — preserves the prior state on refusal and rejects an unresolved ambiguous replacement target", () => {
    const project = initialImagingProject();
    const before = JSON.stringify(project);
    const refusal = routed("finalement non, garde le critère précédent");
    expect(refusal).toMatchObject({ currentProjectDirection: "PRESERVE_EXISTING_PROJECT", projectConstructionEligible: false });
    expect(JSON.stringify(project)).toBe(before);

    const raw = "remplace la mesure par un pourcentage";
    const checked = validatePersistentProjectDelta({ changes: [{
      operation: "REPLACE", sourceText: raw, content: "Pourcentage",
    }] }, raw, project, conversation(raw, "conversation:npc01:ambiguous"));
    expect(routed(raw).currentProjectDirection).toBe("MODIFY_EXISTING_PROJECT_OBJECT");
    expect(checked.candidate).toBeNull();
    expect(checked.validation.blocks).toContain("change:0:PROJECT_REF_INVALID");
  });

  it("F — applies the same partial-patch invariant to a non-medical measure", () => {
    const turn = behaviorTurn("turn:npc01:material-base", "Résistance maximale mesurée à 20 °C.");
    const base = adoptBehaviorContribution(behaviorContribution({
      contributionId: "contribution:npc01:material-base", turns: [turn], candidateObjects: [
        behaviorItem({ itemId: "variable:resistance", proposedType: "CANONICAL_VARIABLE", content: "Résistance maximale", turnId: turn.turnId }),
        behaviorItem({ itemId: "condition:temperature", proposedType: "PROJECT_INFORMATION", content: "Température de mesure : 20 °C", turnId: turn.turnId }),
      ],
    }), null, 44);
    const variable = ensureCanonicalProjectState(base).objects.find((item) => item.objectId === "variable:resistance")!;
    const raw = "c'est ça mais exprime-la par unité de surface";
    const contribution = contributionFromWire({ raw, currentProject: base, candidate: wire([{
      ...add(raw, "candidate:resistance-surface", "CANONICAL_VARIABLE", "Résistance maximale par unité de surface"),
      operation: "REPLACE", targetProjectRef: variable.objectId,
    }]) });
    const candidate = prepareResearchProjectContributionCandidate(contribution, base);
    expect(candidate.projectWriteAuthorized).toBe(false);
    const revised = adopt(contribution, base, base.projectId);
    const contents = ensureCanonicalProjectState(revised).objects.filter((item) => item.actuality === "CURRENT").map((item) => item.content);
    expect(contents).toEqual(expect.arrayContaining(["Résistance maximale par unité de surface", "Température de mesure : 20 °C"]));
  });
});
