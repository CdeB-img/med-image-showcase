import { beforeEach, describe, expect, it } from "vitest";
import type {
  ContributionEpistemicBoundary,
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationTurn,
} from "@/features/scientific-interpretation/contracts";
import {
  confirmResearchProjectContribution,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import {
  buildFunctionalResetQueryNavigation,
  deferFunctionalResetQueryNavigation,
  recordFunctionalResetQueryResponse,
  reopenFunctionalResetQueryDeferral,
} from "@/features/query-navigation";
import { classifyFunctionalResetQueryDeferral } from "../query-deferral";
import {
  CHANGESET_AGE_TIMING,
  CHANGESET_INITIAL,
  CHANGESET_READD,
  CHANGESET_REMOVE,
  CHANGESET_REPEAT_REMOVE,
  CHANGESET_REPLACE_AGE,
  CHANGESET_SCOPE,
  makeFunctionalReset03A1Contribution,
} from "./functional-reset-03a1-fixtures";
import {
  clearFunctionalResetSession,
  createFunctionalResetSession,
  FUNCTIONAL_RESET_STORAGE_KEY,
  loadFunctionalResetSession,
  persistFunctionalResetSession,
} from "../session";

const authority = {
  actorRef: "functional-reset-03b1:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const turn = (turnId: string, content: string): ScientificInterpretationTurn => ({
  turnId,
  role: "USER",
  content,
  createdAt: "2026-08-21T12:00:00.000Z",
});

const initialTurn = turn("turn:fr03b1:initial", CHANGESET_INITIAL);

const boundary = (turnId: string, epistemicStatus = "EXPLICIT_USER_STATED"): ContributionEpistemicBoundary => ({
  ownership: "SCIENTIFIC_INTERPRETATION",
  epistemicStatus,
  adoptionStatus: "CANDIDATE",
  activeState: true,
  sourceTurnIds: [turnId],
  sourceText: null,
});

const item = (input: {
  itemId: string;
  semanticIdentity: string;
  proposedType: string;
  content: string;
  turnId: string;
  studyRole?: string;
  epistemicStatus?: string;
}): ScientificContributionItem => ({
  itemId: input.itemId,
  semanticIdentity: input.semanticIdentity,
  proposedType: input.proposedType,
  content: input.content,
  polarity: "AFFIRMED",
  studyRole: input.studyRole ?? input.proposedType,
  confidence: 1,
  previousItemIds: [],
  epistemicBoundary: boundary(input.turnId, input.epistemicStatus),
});

const contribution = (input: {
  turns: ScientificInterpretationTurn[];
  objects?: ScientificContributionItem[];
  temporal?: ScientificContributionItem[];
  unknowns?: ScientificContributionItem[];
  suffix: string;
}): ScientificInterpretationContributionEnvelope => {
  const base = makeFunctionalReset03A1Contribution([initialTurn]);
  return {
    ...structuredClone(base),
    identity: {
      ...base.identity,
      contributionId: `contribution:fr03b1:${input.suffix}`,
      previousContributionId: base.identity.contributionId,
      contributionDigest: `digest:fr03b1:${input.suffix}`,
    },
    source: {
      ...base.source,
      originalRequest: input.turns.at(-1)!.content,
      turns: input.turns,
      sourceRefs: input.turns.map((candidate) => candidate.turnId),
    },
    scientificContent: {
      ...structuredClone(base.scientificContent),
      candidateObjects: [...base.scientificContent.candidateObjects, ...(input.objects ?? [])],
      temporalElements: [...(input.temporal ?? [])],
      unknowns: [...(input.unknowns ?? [])],
      missingInformation: [],
      clarificationNeeds: [],
      openDecisions: [],
    },
  };
};

const confirm = (
  value: ScientificInterpretationContributionEnvelope,
  current: ResearchProjectOwnerProjection | null,
) => confirmResearchProjectContribution({
  contribution: value,
  current,
  projectId: "research-project:fr03b1",
  authority,
  confirmedAt: "2026-08-21T12:00:30.000Z",
});

const initialProject = () => confirm(makeFunctionalReset03A1Contribution([initialTurn]), null);

const acuteTurn = turn("turn:fr03b1:acute", "L’IRM initiale est prévue en phase aiguë entre J3 et J5.");
const acuteItem = (turnId = acuteTurn.turnId, content = "IRM initiale entre J3 et J5") => item({
  itemId: `timing:acute:${turnId}`,
  semanticIdentity: "mri-initial-acquisition",
  proposedType: "TIMEPOINT",
  content,
  turnId,
  studyRole: "INITIAL_ACQUISITION",
});
const acuteProject = () => confirm(contribution({
  turns: [initialTurn, acuteTurn],
  temporal: [acuteItem()],
  suffix: "acute",
}), initialProject());

const populationNavigation = () => buildFunctionalResetQueryNavigation({
  project: acuteProject(),
  recordedAt: "2026-08-21T12:01:00.000Z",
});

const unknownTurn = turn(
  "turn:fr03b1:unknown",
  "Pour ce point, je ne sais pas encore. On peut avancer sur ce qui est le plus utile ensuite.",
);
const unknownContribution = () => contribution({
  turns: [initialTurn, acuteTurn, unknownTurn],
  unknowns: [item({
    itemId: "unknown:population",
    semanticIdentity: "population-criteria-not-defined",
    proposedType: "UNKNOWN",
    content: "critères de population non encore définis",
    turnId: unknownTurn.turnId,
    epistemicStatus: "UNKNOWN_MISSING_INFORMATION",
  })],
  suffix: "unknown-population",
});

const deferredPopulation = () => {
  const answered = recordFunctionalResetQueryResponse({
    navigation: populationNavigation(),
    rawResponse: unknownTurn.content,
    actorRef: authority.actorRef,
    actorRole: "RESEARCHER",
    receivedAt: "2026-08-21T12:02:00.000Z",
    responseId: "response:fr03b1:unknown",
  });
  return deferFunctionalResetQueryNavigation({
    navigation: answered,
    reason: classifyFunctionalResetQueryDeferral({
      contribution: unknownContribution(),
      sourceTurnId: unknownTurn.turnId,
      rawResponse: unknownTurn.content,
    })!,
    recordedAt: "2026-08-21T12:02:01.000Z",
  });
};

const partialTurn = turn(
  "turn:fr03b1:partial",
  "Adultes de 18 à 75 ans avec un infarctus datant de moins de 7 jours. Les autres critères et exclusions ne sont pas encore définis.",
);
const partialContribution = () => contribution({
  turns: [initialTurn, acuteTurn, partialTurn],
  objects: [
    item({ itemId: "criterion:age:min:18", semanticIdentity: "population-age-lower-bound", proposedType: "ELIGIBILITY_CRITERION", content: "18 ans", turnId: partialTurn.turnId }),
    item({ itemId: "criterion:age:max:75", semanticIdentity: "population-age-upper-bound", proposedType: "ELIGIBILITY_CRITERION", content: "75 ans", turnId: partialTurn.turnId }),
    item({ itemId: "criterion:idm:max:7d", semanticIdentity: "recent-myocardial-infarction-seven-days", proposedType: "INCLUSION_CRITERION", content: "infarctus datant de moins de 7 jours", turnId: partialTurn.turnId }),
  ],
  unknowns: [item({
    itemId: "unknown:remaining-population-criteria",
    semanticIdentity: "remaining-inclusion-and-exclusion-criteria-not-defined",
    proposedType: "UNKNOWN",
    content: "autres critères d’inclusion et exclusions non encore définis",
    turnId: partialTurn.turnId,
    epistemicStatus: "UNKNOWN_MISSING_INFORMATION",
  })],
  suffix: "partial-population",
});

const followUpTurn = turn(
  "turn:fr03b1:follow-up",
  "Pour l’imagerie, l’IRM initiale reste entre J3 et J5, puis un contrôle est prévu à 3 mois.",
);
const followUpItem = (turnId = followUpTurn.turnId) => item({
  itemId: `timing:follow-up:${turnId}`,
  semanticIdentity: "mri-follow-up-acquisition",
  proposedType: "TIMEPOINT",
  content: "contrôle IRM à 3 mois",
  turnId,
  studyRole: "FOLLOW_UP_ACQUISITION",
});
const followUpContribution = () => contribution({
  turns: [initialTurn, acuteTurn, followUpTurn],
  temporal: [acuteItem(followUpTurn.turnId), followUpItem()],
  suffix: "follow-up",
});

const replaceAcuteTurn = turn("turn:fr03b1:replace-acute", "Finalement, je préfère faire l’IRM initiale entre J5 et J7.");
const replaceAcuteContribution = () => contribution({
  turns: [initialTurn, acuteTurn, followUpTurn, replaceAcuteTurn],
  temporal: [acuteItem(replaceAcuteTurn.turnId, "IRM initiale entre J5 et J7")],
  suffix: "replace-acute",
});

const contents = (project: ResearchProjectOwnerProjection, sectionId: string) =>
  project.sections.find((section) => section.sectionId === sectionId)?.elements.map((element) => element.content) ?? [];

describe("FUNCTIONAL-RESET-03B1 — deferral and multi-timepoint completeness", () => {
  beforeEach(() => window.localStorage.clear());

  it("FR03B1-C01 — explicit unknown / move-on defers the current QRY need", () => {
    const deferred = deferredPopulation();
    expect(deferred.memory.events.at(-1)).toMatchObject({
      eventType: "ACTION_DEFERRED",
      reason: "USER_REQUESTED_TO_MOVE_ON",
      actionRef: deferred.currentAction?.selectedActionId,
    });
    expect(classifyFunctionalResetQueryDeferral({
      contribution: unknownContribution(),
      sourceTurnId: "turn:unrelated-correction",
      rawResponse: "Je veux avancer la date de l’IRM à J5.",
    })).toBeNull();
  });

  it("FR03B1-C02 — the deferred need remains scientifically UNKNOWN without Project mutation", () => {
    const project = acuteProject();
    const candidate = prepareResearchProjectContributionCandidate(unknownContribution(), project);
    expect(unknownContribution().scientificContent.unknowns).toHaveLength(1);
    expect(candidate.changeSet).toMatchObject({ status: "NO_NET_CHANGE", effectiveChangeCount: 0 });
    expect(confirm(unknownContribution(), project)).toBe(project);
  });

  it("FR03B1-C03 — QRY selects another eligible action after explicit deferral", () => {
    const before = deferredPopulation();
    expect(before.standardQuestion?.scopeSectionIds).toEqual(["POPULATION"]);
    const after = buildFunctionalResetQueryNavigation({
      project: acuteProject(),
      previous: before,
      recordedAt: "2026-08-21T12:03:00.000Z",
      forceRebuild: true,
    });
    expect(after.standardQuestion?.scopeSectionIds).not.toContain("POPULATION");
    expect(after.currentAction?.selectedActionId).not.toBe(before.currentAction?.selectedActionId);
  });

  it("FR03B1-C04 — a deferred need can become eligible again after another action is treated or explicit reopen", () => {
    const project = acuteProject();
    const deferred = deferredPopulation();
    const next = buildFunctionalResetQueryNavigation({ project, previous: deferred, recordedAt: "2026-08-21T12:03:00.000Z", forceRebuild: true });
    const answeredOther = recordFunctionalResetQueryResponse({
      navigation: next,
      rawResponse: "Je précise cet autre point.",
      actorRef: authority.actorRef,
      actorRole: "RESEARCHER",
      receivedAt: "2026-08-21T12:04:00.000Z",
      responseId: "response:fr03b1:other",
    });
    const later = buildFunctionalResetQueryNavigation({ project, previous: answeredOther, recordedAt: "2026-08-21T12:04:01.000Z", forceRebuild: true });
    expect(later.standardQuestion?.scopeSectionIds).toContain("POPULATION");

    const explicitlyReopened = reopenFunctionalResetQueryDeferral({ navigation: deferred, sectionId: "POPULATION", recordedAt: "2026-08-21T12:05:00.000Z" });
    const reopened = buildFunctionalResetQueryNavigation({ project, previous: explicitlyReopened, recordedAt: "2026-08-21T12:05:01.000Z", forceRebuild: true });
    expect(reopened.standardQuestion?.scopeSectionIds).toContain("POPULATION");
  });

  it("FR03B1-C05 — age range 18–75 preserves both minimum and maximum", () => {
    const candidate = prepareResearchProjectContributionCandidate(partialContribution(), acuteProject());
    const population = candidate.proposedSections.find((section) => section.sectionId === "POPULATION")!;
    expect(population.elements).toEqual(expect.arrayContaining([
      expect.objectContaining({ semanticKey: "POPULATION:ELIGIBILITY:AGE:MIN", content: "Âge minimal : 18 ans" }),
      expect.objectContaining({ semanticKey: "POPULATION:ELIGIBILITY:AGE:MAX", content: "Âge maximal : 75 ans" }),
    ]));
  });

  it("FR03B1-C06 — one multi-information response emits every distinct semantic Project change", () => {
    const changes = prepareResearchProjectContributionCandidate(partialContribution(), acuteProject()).changeSet.changes
      .filter((change) => change.operation !== "NO_CHANGE");
    expect(changes).toHaveLength(3);
    expect(changes.map((change) => change.semanticKey)).toEqual(expect.arrayContaining([
      "POPULATION:ELIGIBILITY:AGE:MIN",
      "POPULATION:ELIGIBILITY:AGE:MAX",
      "POPULATION:ELIGIBILITY:EVENT_WINDOW:LT:7:DAY",
    ]));
  });

  it("FR03B1-C07 — unknown remainder of a partial answer is not immediately re-asked", () => {
    const project = acuteProject();
    const deferred = deferFunctionalResetQueryNavigation({
      navigation: recordFunctionalResetQueryResponse({
        navigation: populationNavigation(),
        rawResponse: partialTurn.content,
        actorRef: authority.actorRef,
        actorRole: "RESEARCHER",
        receivedAt: "2026-08-21T12:06:00.000Z",
        responseId: "response:fr03b1:partial",
      }),
      reason: classifyFunctionalResetQueryDeferral({ contribution: partialContribution(), sourceTurnId: partialTurn.turnId, rawResponse: partialTurn.content })!,
      recordedAt: "2026-08-21T12:06:01.000Z",
    });
    const updated = confirm(partialContribution(), project);
    const next = buildFunctionalResetQueryNavigation({ project: updated, previous: deferred, recordedAt: "2026-08-21T12:06:02.000Z" });
    expect(contents(updated, "POPULATION")).toEqual(expect.arrayContaining([
      "Âge minimal : 18 ans", "Âge maximal : 75 ans", "Infarctus datant de moins de 7 jours",
    ]));
    expect(next.standardQuestion?.scopeSectionIds).not.toContain("POPULATION");
  });

  it("FR03B1-C08 — existing acute timing plus a new three-month follow-up emits ADD, not NO_CHANGE", () => {
    const changes = prepareResearchProjectContributionCandidate(followUpContribution(), acuteProject()).changeSet.changes;
    expect(changes.filter((change) => change.operation !== "NO_CHANGE")).toEqual([
      expect.objectContaining({ operation: "ADD", semanticKey: "TEMPORALITY:IRM:FOLLOW_UP", presentation: "+ IRM de suivi : 3 mois" }),
    ]);
    expect(changes).toContainEqual(expect.objectContaining({ operation: "NO_CHANGE", semanticKey: "TEMPORALITY:IRM:INITIAL" }));
  });

  it("FR03B1-C09 — two imaging timepoints coexist in the Project", () => {
    const project = confirm(followUpContribution(), acuteProject());
    expect(contents(project, "TEMPORALITY")).toEqual(["IRM initiale : J3–J5", "IRM de suivi : 3 mois"]);
  });

  it("FR03B1-C10 — replacing acute timing preserves follow-up timing", () => {
    const withFollowUp = confirm(followUpContribution(), acuteProject());
    const changes = prepareResearchProjectContributionCandidate(replaceAcuteContribution(), withFollowUp).changeSet.changes;
    expect(changes.filter((change) => change.operation !== "NO_CHANGE")).toEqual([
      expect.objectContaining({ operation: "REPLACE", semanticKey: "TEMPORALITY:IRM:INITIAL" }),
    ]);
    const updated = confirm(replaceAcuteContribution(), withFollowUp);
    expect(contents(updated, "TEMPORALITY")).toEqual(["IRM de suivi : 3 mois", "IRM initiale : J5–J7"]);
  });

  it("FR03B1-C11 — repeating an existing follow-up produces NO_CHANGE and no new version", () => {
    const withFollowUp = confirm(followUpContribution(), acuteProject());
    const repeatTurn = turn("turn:fr03b1:repeat-follow-up", "Le contrôle reste prévu à 3 mois.");
    const repeat = contribution({ turns: [initialTurn, acuteTurn, followUpTurn, repeatTurn], temporal: [followUpItem(repeatTurn.turnId)], suffix: "repeat-follow-up" });
    const candidate = prepareResearchProjectContributionCandidate(repeat, withFollowUp);
    expect(candidate.changeSet.changes).toEqual([expect.objectContaining({ operation: "NO_CHANGE", semanticKey: "TEMPORALITY:IRM:FOLLOW_UP" })]);
    expect(confirm(repeat, withFollowUp).versionId).toBe(withFollowUp.versionId);
  });

  it("FR03B1-C12 — spontaneous temporal update outside the active QRY scope is accepted", () => {
    expect(populationNavigation().standardQuestion?.scopeSectionIds).toEqual(["POPULATION"]);
    const candidate = prepareResearchProjectContributionCandidate(followUpContribution(), acuteProject());
    expect(candidate.changeSet.changes.filter((change) => change.operation !== "NO_CHANGE")).toEqual([
      expect.objectContaining({ operation: "ADD", semanticKey: "TEMPORALITY:IRM:FOLLOW_UP" }),
    ]);
    expect(contents(confirm(followUpContribution(), acuteProject()), "TEMPORALITY")).toContain("IRM de suivi : 3 mois");
  });

  it("FR03B1-C13 — reload preserves QRY deferral and multiple temporal occurrences", () => {
    const project = confirm(followUpContribution(), acuteProject());
    const navigation = buildFunctionalResetQueryNavigation({
      project,
      previous: deferredPopulation(),
      recordedAt: "2026-08-21T12:07:00.000Z",
    });
    const session = {
      ...createFunctionalResetSession("2026-08-21T12:00:00.000Z"),
      project,
      queryNavigation: navigation,
      currentContribution: followUpContribution(),
      runtimeTurns: [initialTurn, acuteTurn, followUpTurn],
    };
    persistFunctionalResetSession(window.localStorage, session);
    const loaded = loadFunctionalResetSession(window.localStorage);
    expect(loaded.queryNavigation?.currentAction?.selectedActionId).toBe(navigation.currentAction?.selectedActionId);
    expect(loaded.queryNavigation?.memory.events).toContainEqual(expect.objectContaining({ eventType: "ACTION_DEFERRED" }));
    expect(contents(loaded.project!, "TEMPORALITY")).toEqual(["IRM initiale : J3–J5", "IRM de suivi : 3 mois"]);
    expect(loaded.queryNavigation?.standardQuestion?.scopeSectionIds).not.toContain("POPULATION");
  });

  it("FR03B1-C14 — reset removes Project, QRY deferral and temporal session state", () => {
    const session = createFunctionalResetSession();
    persistFunctionalResetSession(window.localStorage, { ...session, project: acuteProject(), queryNavigation: deferredPopulation() });
    clearFunctionalResetSession(window.localStorage);
    const reset = loadFunctionalResetSession(window.localStorage);
    expect(window.localStorage.getItem(FUNCTIONAL_RESET_STORAGE_KEY)).toBeNull();
    expect(reset.project).toBeNull();
    expect(reset.queryNavigation).toBeNull();
    expect(reset.runtimeTurns).toEqual([]);
  });

  it("FR03B1-C15 — 03A1/03A2 ADD/REMOVE/REPLACE/NO_CHANGE and re-add remain valid", () => {
    const texts = [CHANGESET_INITIAL, CHANGESET_AGE_TIMING, CHANGESET_SCOPE, CHANGESET_REMOVE, CHANGESET_REPEAT_REMOVE, CHANGESET_READD, CHANGESET_REPLACE_AGE];
    const turns = texts.map((text, index) => turn(`turn:fr03b1:regression:${index + 1}`, text));
    let project: ResearchProjectOwnerProjection | null = null;
    const operations: string[] = [];
    for (let stage = 1; stage <= turns.length; stage += 1) {
      const value = makeFunctionalReset03A1Contribution(turns.slice(0, stage));
      const candidate = prepareResearchProjectContributionCandidate(value, project);
      operations.push(...(candidate.changeSet.status === "NO_NET_CHANGE"
        ? ["NO_CHANGE"]
        : candidate.changeSet.changes.map((change) => change.operation)));
      project = confirm(value, project);
    }
    expect(operations).toEqual(expect.arrayContaining(["ADD", "REMOVE", "REPLACE", "NO_CHANGE"]));
    expect(contents(project!, "MEASUREMENTS")).toContain("biomarqueurs sanguins");
    expect(contents(project!, "POPULATION")).toContain("Âge maximal : 80 ans");
  });
});
