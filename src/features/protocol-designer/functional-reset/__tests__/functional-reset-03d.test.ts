import { describe, expect, it } from "vitest";
import { buildGeminiHybridProviderPayload } from "../../../../../api/scientific-interpretation-provider";
import { buildStandardProtocolPresentation } from "@/features/document-projection";
import type { DocumentProjection, DocumentSectionInstance } from "@/features/document-projection/types";
import {
  HYBRID_PRIMARY_RUNTIME_VERSION,
  HYBRID_PRIMARY_SYSTEM_PROMPT,
  type ContributionEpistemicBoundary,
  type ScientificContributionItem,
  type ScientificInterpretationContributionEnvelope,
  type ScientificInterpretationConversation,
  type ScientificInterpretationTurn,
} from "@/features/scientific-interpretation";
import {
  confirmResearchProjectContribution,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import {
  buildFunctionalResetQueryNavigation,
  buildQuestionPresentationRequest,
  buildSelectedNavigationAction,
  clarifyFunctionalResetQueryAfterMisunderstanding,
  deferFunctionalResetQueryNavigation,
  deferFunctionalResetQueryNeeds,
  isFunctionalResetQueryMisunderstanding,
  presentFunctionalResetQuestion,
  recordFunctionalResetQueryResponse,
} from "@/features/query-navigation";
import { classifyFunctionalResetQueryDeferral, classifyFunctionalResetQueryDeferralScope } from "../query-deferral";
import { makeFunctionalResetContribution } from "./functional-reset-fixtures";

const authority = {
  actorRef: "fr03d:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const turn = (id: string, content: string, role: "USER" | "NOXIA" = "USER"): ScientificInterpretationTurn => ({
  turnId: id,
  role,
  content,
  createdAt: "2026-08-22T12:00:00.000Z",
});

const boundary = (turnId: string, sourceText: string | null = null, epistemicStatus = "EXPLICIT_USER_STATED"): ContributionEpistemicBoundary => ({
  ownership: "SCIENTIFIC_INTERPRETATION",
  epistemicStatus,
  adoptionStatus: "CANDIDATE",
  activeState: true,
  sourceTurnIds: [turnId],
  sourceText,
});

const item = (input: {
  id: string;
  type: string;
  role: string;
  content: string;
  turnId: string;
  identity?: string;
  sourceText?: string | null;
  epistemicStatus?: string;
}): ScientificContributionItem => ({
  itemId: input.id,
  semanticIdentity: input.identity ?? input.id,
  proposedType: input.type,
  content: input.content,
  polarity: "AFFIRMED",
  studyRole: input.role,
  confidence: 1,
  previousItemIds: [],
  epistemicBoundary: boundary(input.turnId, input.sourceText ?? input.content, input.epistemicStatus),
});

const contribution = (input: {
  id: string;
  text: string;
  objects?: ScientificContributionItem[];
  temporal?: ScientificContributionItem[];
  unknowns?: ScientificContributionItem[];
}): ScientificInterpretationContributionEnvelope => {
  const sourceTurn = turn(`turn:${input.id}`, input.text);
  const base = makeFunctionalResetContribution([sourceTurn]);
  return {
    ...structuredClone(base),
    identity: { ...base.identity, contributionId: `contribution:${input.id}`, contributionDigest: `digest:${input.id}`, runtimeVersion: HYBRID_PRIMARY_RUNTIME_VERSION },
    source: { ...base.source, conversationId: `conversation:${input.id}`, originalRequest: input.text, turns: [sourceTurn], sourceRefs: [sourceTurn.turnId] },
    scientificContent: {
      ...structuredClone(base.scientificContent),
      candidateObjects: input.objects ?? [],
      candidateRelations: [],
      explicitStatements: [],
      temporalElements: input.temporal ?? [],
      inferredContext: [],
      contextualCandidates: [],
      negationsAndConstraints: [],
      ambiguities: [],
      unknowns: input.unknowns ?? [],
      missingInformation: [],
      correctionsAndSupersessions: [],
      openDecisions: [],
      clarificationNeeds: [],
    },
  };
};

const confirm = (
  value: ScientificInterpretationContributionEnvelope,
  current: ResearchProjectOwnerProjection | null = null,
) => confirmResearchProjectContribution({
  contribution: value,
  current,
  projectId: "project:fr03d",
  authority,
  confirmedAt: "2026-08-22T12:00:30.000Z",
});

const changeKeys = (value: ScientificInterpretationContributionEnvelope, current: ResearchProjectOwnerProjection | null = null) =>
  prepareResearchProjectContributionCandidate(value, current).changeSet.changes
    .filter((change) => change.operation !== "NO_CHANGE")
    .map((change) => change.semanticKey);

const temporalityContribution = (id: string, text: string, temporal: ScientificContributionItem[]) => contribution({ id, text, temporal });

const completeExceptTemporality = (resolvePopulationRemainder = true) => {
  const id = "complete-except-time";
  const turnId = `turn:${id}`;
  return confirm(contribution({
    id,
    text: "Étude randomisée chez des adultes inclus sans contre-indication, médicament contre placebo, CT avec lecture, mesure principale et comparaison statistique.",
    objects: [
      item({ id: "condition", type: "CONDITION", role: "POPULATION_DEFINITION", content: "plaques carotidiennes", turnId }),
      item({ id: "age", type: "ELIGIBILITY_CRITERION", role: "LOWER_BOUND", content: "Âge minimal : 18 ans", turnId }),
      ...(resolvePopulationRemainder ? [
        item({ id: "include", type: "INCLUSION_CRITERION", role: "INCLUSION", content: "adultes inclus", turnId }),
        item({ id: "exclude", type: "EXCLUSION_CRITERION", role: "EXCLUSION", content: "sans contre-indication", turnId }),
      ] : []),
      item({ id: "design", type: "STUDY_DESIGN", role: "RANDOMIZED", content: "étude randomisée", turnId }),
      item({ id: "drug", type: "INTERVENTION", role: "INTERVENTION", content: "médicament", turnId }),
      item({ id: "placebo", type: "COMPARATOR", role: "COMPARATOR", content: "placebo", turnId }),
      item({ id: "ct", type: "MODALITY", role: "ACQUISITION_MODALITY", content: "CT avec acquisition", turnId }),
      item({ id: "measure", type: "ENDPOINT", role: "PRIMARY_ENDPOINT", content: "mesure principale", turnId }),
      item({ id: "analysis", type: "ANALYSIS_INTENT", role: "STATISTICAL_ANALYSIS", content: "comparaison statistique", turnId }),
    ],
  }));
};

const temporalNavigation = () => buildFunctionalResetQueryNavigation({
  project: completeExceptTemporality(),
  recordedAt: "2026-08-22T12:01:00.000Z",
});

const temporalNavigationWithOpenPopulationRemainder = () => {
  const base = buildFunctionalResetQueryNavigation({
    project: completeExceptTemporality(false),
    recordedAt: "2026-08-22T12:01:00.000Z",
  });
  const candidate = base.selection.candidates.find((value) => value.affectedDecisionRefs.includes("project-section:TEMPORALITY"))!;
  const selection = {
    ...structuredClone(base.selection),
    selected: candidate,
    nonDominated: [candidate],
    trace: { ...structuredClone(base.selection.trace), nonDominatedCandidateRefs: [candidate.candidateId], selectedCandidateRef: candidate.candidateId },
  };
  const action = buildSelectedNavigationAction(selection, candidate);
  const presentation = buildQuestionPresentationRequest(action, candidate);
  return {
    ...base,
    selection,
    currentAction: action,
    currentPresentation: presentation,
    standardQuestion: presentFunctionalResetQuestion(action, presentation, 0),
  };
};

const spontaneousUnknownContribution = () => {
  const id = "spontaneous-population";
  const turnId = `turn:${id}`;
  return contribution({
    id,
    text: "Je voudrais inclure des adultes de 18 à 80 ans avec un événement de moins de 7 jours. Les autres critères d’inclusion et les exclusions ne sont pas encore définis.",
    objects: [
      item({ id: "age-range", type: "ELIGIBILITY_CRITERION", role: "POPULATION_CRITERION", content: "Adultes de 18 à 80 ans", turnId, identity: "population-age-range" }),
      item({ id: "event-window", type: "ELIGIBILITY_CRITERION", role: "POPULATION_CRITERION", content: "événement datant de moins de 7 jours", turnId }),
    ],
    unknowns: [
      item({ id: "unknown-inclusion", type: "UNKNOWN", role: "INCLUSION_CRITERIA", content: "autres critères d’inclusion non définis", turnId, epistemicStatus: "UNKNOWN" }),
      item({ id: "unknown-exclusion", type: "UNKNOWN", role: "EXCLUSION_CRITERIA", content: "exclusions non définies", turnId, epistemicStatus: "UNKNOWN" }),
    ],
  });
};

const fakeTemporalProjection = (value: string) => ({
  projectionId: "projection:fr03d",
  source: { projectVersion: "project:version:1", projectDigest: "digest:project" },
  sections: [{
    sectionId: "visits-temporal",
    applicability: "APPLICABLE",
    statusReasons: [],
    unknowns: [],
    blocks: [{ kind: "CONTENT", items: [`Confirmé — Visit FOLLOW_UP: IRM de suivi : ${value} KNOWN — source`], label: null }],
  } as unknown as DocumentSectionInstance],
} as unknown as DocumentProjection);

describe("FUNCTIONAL-RESET-03D — live semantic completeness and contextual QRY", () => {
  it("FR03D-C01 — Active QRY context is included in Scientific Interpretation input", () => {
    const conversation: ScientificInterpretationConversation = {
      conversationId: "conversation:context",
      language: "fr",
      turns: [turn("q", "À quels moments ?", "NOXIA"), turn("u", "J5-J7")],
      interactionContext: {
        interactionRef: "presentation:1", sourceActionRef: "action:1", owner: "QUERY_NAVIGATION",
        purpose: "Préciser les moments ou fenêtres de mesure utiles.", expectedResponseKind: "QRY_INFORMATION_RESPONSE",
        targetRefs: ["project-section:TEMPORALITY"], informationNeedRefs: ["need:timing"],
        projectRef: "project:1", projectVersion: "version:1", projectDigest: "digest:1",
      },
    };
    const payload = buildGeminiHybridProviderPayload(conversation);
    expect(payload.contents[0].parts[0].text).toContain('"expectedResponseKind":"QRY_INFORMATION_RESPONSE"');
    expect(payload.contents[0].parts[0].text).toContain('"informationNeedRefs":["need:timing"]');
  });

  it("FR03D-C02 — Short answer J5-J7 can resolve temporal QRY context", () => {
    const temporal = item({ id: "time", type: "TIMEPOINT", role: "FOLLOW_UP", content: "J5-J7", turnId: "turn:short-time" });
    const value = contribution({ id: "short-time", text: "J5-J7", objects: [temporal], temporal: [{ ...temporal, itemId: "time-duplicate" }] });
    expect(changeKeys(value)).toEqual(["TEMPORALITY:MEASURE:WINDOW"]);
  });

  it("FR03D-C03 — Temporal short answer does not invent unrelated facts", () => {
    const value = temporalityContribution("short-only", "J5-J7", [item({ id: "time", type: "TIMEPOINT", role: "MEASUREMENT_TIMING", content: "J5-J7", turnId: "turn:short-only" })]);
    const changes = prepareResearchProjectContributionCandidate(value, null).changeSet.changes;
    expect(changes.map((change) => change.targetSectionId)).toEqual(["TEMPORALITY"]);
    expect(changes[0]?.proposedElement?.content).toBe("Mesure : J5–J7");
  });

  it("FR03D-C04 — Age range 18–80 produces both min and max", () => {
    const value = contribution({ id: "age-range", text: "Adultes de 18 à 80 ans", objects: [item({ id: "age", type: "ELIGIBILITY_CRITERION", role: "POPULATION_CRITERION", content: "Adultes de 18 à 80 ans", turnId: "turn:age-range", identity: "population-age-range" })] });
    expect(changeKeys(value)).toEqual(["POPULATION:ELIGIBILITY:AGE:MIN", "POPULATION:ELIGIBILITY:AGE:MAX"]);
  });

  it("FR03D-C05 — Single-sided age limit produces only the stated bound", () => {
    const value = contribution({ id: "age-max", text: "Âge maximal 75 ans", objects: [item({ id: "age", type: "ELIGIBILITY_CRITERION", role: "UPPER_BOUND", content: "Âge maximal 75 ans", turnId: "turn:age-max" })] });
    expect(changeKeys(value)).toEqual(["POPULATION:ELIGIBILITY:AGE:MAX"]);
  });

  it("FR03D-C06 — Event window under seven days coexists with age range", () => {
    const value = spontaneousUnknownContribution();
    value.scientificContent.temporalElements = [item({ id: "event-duration", type: "TEMPORAL_ELEMENT", role: "DURATION_LIMIT", content: "événement datant de moins de 7 jours", turnId: "turn:spontaneous-population" })];
    expect(changeKeys(value)).toEqual([
      "POPULATION:ELIGIBILITY:AGE:MIN",
      "POPULATION:ELIGIBILITY:AGE:MAX",
      "POPULATION:ELIGIBILITY:EVENT_WINDOW:LT:7:DAY",
    ]);
  });

  it("FR03D-C07 — Compound initial plus follow-up sentence produces two occurrences", () => {
    const value = temporalityContribution("two-times", "IRM initiale entre J5 et J7 puis contrôle à 3 mois", [
      item({ id: "initial", type: "TEMPORAL_INTERVAL", role: "ACQUISITION_TIMEPOINT", content: "entre J5 et J7", turnId: "turn:two-times" }),
      item({ id: "follow", type: "TEMPORAL_POINT", role: "ACQUISITION_TIMEPOINT", content: "3 mois", turnId: "turn:two-times" }),
    ]);
    expect(changeKeys(value).filter((key) => key.startsWith("TEMPORALITY:"))).toEqual(["TEMPORALITY:IRM:INITIAL", "TEMPORALITY:IRM:FOLLOW_UP"]);
  });

  it("FR03D-C08 — Initial and follow-up retain distinct semantic identities", () => {
    const value = temporalityContribution("two-identities", "IRM initiale entre J5 et J7 puis contrôle à 3 mois", [
      item({ id: "initial", type: "TIMEPOINT", role: "INITIAL_ACQUISITION", content: "IRM initiale entre J5 et J7", turnId: "turn:two-identities" }),
      item({ id: "follow", type: "TIMEPOINT", role: "FOLLOW_UP_ACQUISITION", content: "contrôle à 3 mois", turnId: "turn:two-identities" }),
    ]);
    expect(changeKeys(value)).toEqual(["TEMPORALITY:IRM:INITIAL", "TEMPORALITY:IRM:FOLLOW_UP"]);
  });

  it("FR03D-C09 — ProjectChangeSet emits both temporal ADDs when Project has neither", () => {
    const value = temporalityContribution("two-adds", "IRM initiale entre J5 et J7 puis contrôle à 3 mois", [
      item({ id: "initial", type: "TIMEPOINT", role: "INITIAL", content: "IRM initiale entre J5 et J7", turnId: "turn:two-adds" }),
      item({ id: "follow", type: "TIMEPOINT", role: "FOLLOW_UP", content: "contrôle IRM à 3 mois", turnId: "turn:two-adds" }),
    ]);
    expect(prepareResearchProjectContributionCandidate(value, null).changeSet.changes.map((change) => change.operation)).toEqual(["ADD", "ADD"]);
  });

  it("FR03D-C10 — Existing initial plus new follow-up preserves both", () => {
    const initial = temporalityContribution("initial-only", "IRM initiale J5-J7", [item({ id: "initial", type: "TIMEPOINT", role: "INITIAL", content: "IRM initiale J5-J7", turnId: "turn:initial-only" })]);
    const project = confirm(initial);
    const follow = temporalityContribution("follow-only", "Contrôle IRM à 3 mois", [item({ id: "follow", type: "TIMEPOINT", role: "FOLLOW_UP", content: "Contrôle IRM à 3 mois", turnId: "turn:follow-only" })]);
    const updated = confirm(follow, project);
    expect(updated.sections.find((section) => section.sectionId === "TEMPORALITY")?.elements.map((element) => element.semanticKey)).toEqual(["TEMPORALITY:IRM:INITIAL", "TEMPORALITY:IRM:FOLLOW_UP"]);
  });

  it("FR03D-C11 — Spontaneous population reply defers its unknown remainder while QRY is temporal", () => {
    const navigation = temporalNavigationWithOpenPopulationRemainder();
    expect(navigation.standardQuestion?.scopeSectionIds).toEqual(["TEMPORALITY"]);
    const scope = classifyFunctionalResetQueryDeferralScope({ contribution: spontaneousUnknownContribution(), sourceTurnId: "turn:spontaneous-population", rawResponse: spontaneousUnknownContribution().source.originalRequest })!;
    const deferred = deferFunctionalResetQueryNeeds({ navigation, reason: scope.reason, targets: scope.targets, recordedAt: "2026-08-22T12:02:00.000Z" });
    expect(deferred.memory.events.at(-1)).toMatchObject({ eventType: "ACTION_DEFERRED" });
    expect(deferred.currentAction?.selectedActionId).toBe(navigation.currentAction?.selectedActionId);
  });

  it("FR03D-C12 — Only explicitly unknown inclusion and exclusion needs are deferred", () => {
    const scope = classifyFunctionalResetQueryDeferralScope({ contribution: spontaneousUnknownContribution(), sourceTurnId: "turn:spontaneous-population", rawResponse: spontaneousUnknownContribution().source.originalRequest })!;
    expect(scope.targets).toEqual([{ sectionId: "POPULATION", facetIds: ["EXCLUSION", "INCLUSION"] }]);
  });

  it("FR03D-C13 — Resolved population needs are not deferred", () => {
    const scope = classifyFunctionalResetQueryDeferralScope({ contribution: spontaneousUnknownContribution(), sourceTurnId: "turn:spontaneous-population", rawResponse: spontaneousUnknownContribution().source.originalRequest })!;
    expect(scope.targets[0]?.facetIds).not.toEqual(expect.arrayContaining(["ELIGIBILITY", "POPULATION_DEFINITION"]));
  });

  it("FR03D-C14 — QRY does not immediately re-ask explicitly deferred inclusion/exclusion needs", () => {
    const navigation = temporalNavigationWithOpenPopulationRemainder();
    const scope = classifyFunctionalResetQueryDeferralScope({ contribution: spontaneousUnknownContribution(), sourceTurnId: "turn:spontaneous-population", rawResponse: spontaneousUnknownContribution().source.originalRequest })!;
    const deferred = deferFunctionalResetQueryNeeds({ navigation, reason: scope.reason, targets: scope.targets, recordedAt: "2026-08-22T12:02:00.000Z" });
    const updated = confirm(spontaneousUnknownContribution(), completeExceptTemporality(false));
    const next = buildFunctionalResetQueryNavigation({ project: updated, previous: deferred, recordedAt: "2026-08-22T12:02:30.000Z" });
    expect(next.standardQuestion?.scopeSectionIds).not.toContain("POPULATION");
  });

  it("FR03D-C15 — French Standard renders normalized three-month duration as 3 mois", () => {
    const presentation = buildStandardProtocolPresentation(fakeTemporalProjection("3 months"));
    expect(presentation.sections.find((section) => section.sectionId === "temporality")?.entries[0]?.value).toBe("3 mois");
  });

  it("FR03D-C16 — Project semantic duration remains language-independent", () => {
    const source = fakeTemporalProjection("3 months");
    buildStandardProtocolPresentation(source);
    expect(source.sections[0]?.blocks[0]?.items[0]).toContain("3 months");
  });

  it("FR03D-C17 — 03B1 multi-timepoint replacement remains PASS", () => {
    const initial = temporalityContribution("replace-before", "IRM initiale J5-J7", [item({ id: "initial", type: "TIMEPOINT", role: "INITIAL", content: "IRM initiale J5-J7", turnId: "turn:replace-before", identity: "mri-initial" })]);
    const replacement = temporalityContribution("replace-after", "IRM initiale J7-J9", [item({ id: "initial-new", type: "TIMEPOINT", role: "INITIAL", content: "IRM initiale J7-J9", turnId: "turn:replace-after", identity: "mri-initial" })]);
    expect(prepareResearchProjectContributionCandidate(replacement, confirm(initial)).changeSet.changes).toContainEqual(expect.objectContaining({ operation: "REPLACE", semanticKey: "TEMPORALITY:IRM:INITIAL" }));
  });

  it("FR03D-C18 — 03B1 explicit current-action defer remains PASS", () => {
    const navigation = temporalNavigation();
    const deferred = deferFunctionalResetQueryNavigation({ navigation, reason: "USER_DOES_NOT_KNOW", recordedAt: "2026-08-22T12:03:00.000Z" });
    expect(deferred.memory.events.at(-1)).toMatchObject({ eventType: "ACTION_DEFERRED", actionRef: navigation.currentAction?.selectedActionId });
  });

  it("FR03D-C19 — 03C human-readable protocol remains PASS", () => {
    const presentation = buildStandardProtocolPresentation(fakeTemporalProjection("3 mois"));
    expect(presentation).toMatchObject({ readOnly: true, projectWriteAuthorized: false, sourceOfTruth: false });
  });

  it("FR03D-C20 — No ST, IMG or Knowledge reasoning is introduced", () => {
    const boundaries = `${HYBRID_PRIMARY_SYSTEM_PROMPT} ${JSON.stringify(temporalNavigation().boundary)}`;
    expect(boundaries).toMatch(/Do not access or assume a Research Project/);
    expect(temporalNavigation()).toMatchObject({ projectWriteAuthorized: false, sourceOfTruth: false });
  });

  it("FR03D-C21 — Natural-language randomization mention is required as a design candidate", () => {
    expect(HYBRID_PRIMARY_SYSTEM_PROMPT).toMatch(/allocation or randomization language as its own STUDY_DESIGN\/DESIGN object/);
  });

  it("FR03D-C22 — Baseline wording is not promoted as a population criterion", () => {
    expect(HYBRID_PRIMARY_SYSTEM_PROMPT).toMatch(/Baseline, initial, origin or starting-evaluation wording is temporal\/acquisition context/);
  });

  it("FR03D-C23 — Significant reduction is not a biomarker or measurement by itself", () => {
    expect(HYBRID_PRIMARY_SYSTEM_PROMPT).toMatch(/statistical significance are analysis intent, not a measured variable or biomarker/);
    const value = contribution({ id: "analysis-intent", text: "Réduction significative entre les groupes", objects: [item({ id: "analysis", type: "ANALYSIS_INTENT", role: "ENDPOINT_ANALYSIS", content: "Réduction significative entre les groupes", turnId: "turn:analysis-intent" })] });
    expect(changeKeys(value)).toEqual([expect.stringMatching(/^ANALYSIS:/)]);
  });

  it("FR03D-C24 — Unknown dependent measure remains unknown rather than invented", () => {
    expect(HYBRID_PRIMARY_SYSTEM_PROMPT).toMatch(/exact dependent measure must also appear in unknowns or missingInformation/);
  });

  it("FR03D-C25 — J0 and M1 coexist as distinct temporal occurrences", () => {
    const value = temporalityContribution("j0-m1", "Évaluation initiale à J0 puis évaluation à M1", [
      item({ id: "j0", type: "TIMEPOINT", role: "BASELINE", content: "évaluation initiale à J0", turnId: "turn:j0-m1" }),
      item({ id: "m1", type: "TIMEPOINT", role: "FOLLOW_UP", content: "évaluation à M1", turnId: "turn:j0-m1" }),
    ]);
    expect(changeKeys(value)).toEqual(["TEMPORALITY:MEASURE:INITIAL", "TEMPORALITY:MEASURE:FOLLOW_UP"]);
  });

  it("FR03D-C26 — I do not understand triggers conversational clarification, not scientific NO_CHANGE", () => {
    expect(isFunctionalResetQueryMisunderstanding("Je ne comprends pas la question")).toBe(true);
    const clarified = clarifyFunctionalResetQueryAfterMisunderstanding({ navigation: temporalNavigation(), rawResponse: "Je ne comprends pas la question", actorRef: authority.actorRef, actorRole: "RESEARCHER", receivedAt: "2026-08-22T12:04:00.000Z", responseId: "response:clarify" });
    expect(clarified.lastResponseRoute).toMatchObject({ destination: "NAVIGATION_LIFECYCLE_ONLY", reason: "REQUEST_CLARIFICATION" });
  });

  it("FR03D-C27 — Clarification preserves the current QRY action", () => {
    const navigation = temporalNavigation();
    const clarified = clarifyFunctionalResetQueryAfterMisunderstanding({ navigation, rawResponse: "Je ne comprends pas", actorRef: authority.actorRef, actorRole: "RESEARCHER", receivedAt: "2026-08-22T12:04:00.000Z", responseId: "response:clarify" });
    expect(clarified.currentAction?.selectedActionId).toBe(navigation.currentAction?.selectedActionId);
  });

  it("FR03D-C28 — Clarification does not mutate Research Project", () => {
    const project = completeExceptTemporality();
    const before = JSON.stringify(project);
    clarifyFunctionalResetQueryAfterMisunderstanding({ navigation: buildFunctionalResetQueryNavigation({ project, recordedAt: "2026-08-22T12:04:00.000Z" }), rawResponse: "Je ne comprends pas", actorRef: authority.actorRef, actorRole: "RESEARCHER", receivedAt: "2026-08-22T12:04:01.000Z", responseId: "response:clarify" });
    expect(JSON.stringify(project)).toBe(before);
  });

  it("FR03D-C29 — Repeated misunderstanding produces a materially clearer explanation", () => {
    const first = clarifyFunctionalResetQueryAfterMisunderstanding({ navigation: temporalNavigation(), rawResponse: "Je ne comprends pas", actorRef: authority.actorRef, actorRole: "RESEARCHER", receivedAt: "2026-08-22T12:05:00.000Z", responseId: "response:first" });
    const second = clarifyFunctionalResetQueryAfterMisunderstanding({ navigation: first, rawResponse: "Je ne comprends toujours pas", actorRef: authority.actorRef, actorRole: "RESEARCHER", receivedAt: "2026-08-22T12:05:01.000Z", responseId: "response:second" });
    expect(second.standardQuestion?.text).not.toBe(first.standardQuestion?.text);
    expect(second.standardQuestion?.text).toMatch(/Plus concrètement/);
  });

  it("FR03D-C30 — Clarification reuses scope but cannot introduce a scientific decision", () => {
    const navigation = temporalNavigation();
    const clarified = clarifyFunctionalResetQueryAfterMisunderstanding({ navigation, rawResponse: "Pouvez-vous reformuler ?", actorRef: authority.actorRef, actorRole: "RESEARCHER", receivedAt: "2026-08-22T12:06:00.000Z", responseId: "response:clarify" });
    expect(clarified.standardQuestion?.scopeSectionIds).toEqual(navigation.standardQuestion?.scopeSectionIds);
    expect(clarified.lastResponseRoute).toMatchObject({ humanDecisionCreated: false, scientificParsingPerformed: false, projectWriteAuthorized: false });
    expect(classifyFunctionalResetQueryDeferral({ contribution: spontaneousUnknownContribution(), sourceTurnId: "turn:absent", rawResponse: "Je ne comprends pas" })).toBeNull();
  });

  it("FR03D-C31 — An active unconfirmed candidate absent from Project remains confirmable on a later turn", () => {
    const value = temporalityContribution("remembered-candidate", "IRM initiale entre J5 et J7 puis contrôle à 3 mois", [
      item({ id: "initial", type: "TIMEPOINT", role: "INITIAL", content: "IRM initiale entre J5 et J7", turnId: "turn:remembered-candidate" }),
      item({ id: "follow", type: "TIMEPOINT", role: "FOLLOW_UP", content: "contrôle IRM à 3 mois", turnId: "turn:remembered-candidate" }),
    ]);
    value.source.turns.push(turn("turn:later-repeat", "Cette information est déjà comprise."));
    expect(changeKeys(value, completeExceptTemporality())).toEqual(["TEMPORALITY:IRM:INITIAL", "TEMPORALITY:IRM:FOLLOW_UP"]);
  });
});
