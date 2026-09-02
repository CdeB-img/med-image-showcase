import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { logicalDigest } from "@/features/knowledge-engine";
import type {
  ScientificContributionItem,
  ScientificInterpretationContributionEnvelope,
  ScientificInterpretationTurn,
} from "@/features/scientific-interpretation";
import {
  authorizeResearchProjectDocumentHandoff,
  buildProjectContextSnapshot,
  confirmResearchProjectContribution,
  ensureCanonicalProjectState,
  listSpecializedOwnerCapabilities,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation";
import {
  buildStandardProtocolPresentation,
  createEmptyFunctionalResetDocumentPortfolio,
  functionalProtocolProjection,
  projectDocumentSourceFromFunctionalProject,
  refreshFunctionalResetDocumentPortfolio,
  renderProjection,
} from "@/features/document-projection";
import {
  buildStudyDesignRuntimeInput,
  executeStudyDesignRuntime,
  studyDesignScientificOutputIsStable,
} from "@/features/study-design";
import { createProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import {
  invokeStudyDesignForProjectSnapshot,
  readProductStudyDesignOwnerResult,
} from "@/features/protocol-designer/product-study-design-owner-runtime";
import { createScientificExecutionTraceLedger } from "@/features/protocol-designer/scientific-execution-trace";
import DevelopmentDiagnostics from "../DevelopmentDiagnostics";
import StudyDesignStandardCard from "../StudyDesignStandardCard";
import {
  recordArtifactGeneratedTrace,
  recordDocumentProjectionTrace,
  recordProjectAdoptionTrace,
  recordStudyDesignOptionReviewTrace,
} from "../end-to-end-trace-adapter";
import { createFunctionalResetSession } from "../session";
import {
  buildStudyDesignOptionContribution,
  dispatchStudyDesignFromQuery,
  interactionMatchesCurrentProject,
  isStudyDesignQueryDispatch,
  resolveStudyDesignConversation,
} from "../study-design-standard";
import { makeFunctionalReset03A1Contribution } from "./functional-reset-03a1-fixtures";

const AT = "2026-09-02T09:00:00.000Z";
const authority = {
  actorRef: "researcher:p1-rde-03",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const turn = (suffix: string, content: string, createdAt = AT): ScientificInterpretationTurn => ({
  turnId: `turn:p1-rde-03:${suffix}`,
  role: "USER",
  content,
  createdAt,
});

const item = (input: {
  itemId: string;
  proposedType: string;
  content: string;
  sourceTurn: ScientificInterpretationTurn;
  studyRole?: string;
}): ScientificContributionItem => ({
  itemId: input.itemId,
  semanticIdentity: input.itemId,
  proposedType: input.proposedType,
  content: input.content,
  polarity: "AFFIRMED",
  studyRole: input.studyRole ?? input.proposedType,
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

const projectWithoutDesign = (input?: {
  insufficient?: boolean;
  comparatorRequested?: boolean;
  multipleDesigns?: boolean;
}) => {
  const sourceTurn = turn(
    input?.insufficient ? "insufficient" : input?.multipleDesigns ? "multiple" : input?.comparatorRequested ? "comparator" : "strong",
    input?.insufficient
      ? "Quel plan d’étude faut-il retenir ?"
      : input?.multipleDesigns
        ? "Je veux étudier une trajectoire longitudinale avec des données rétrospectives existantes puis un suivi prospectif."
        : input?.comparatorRequested
          ? "Je veux comparer prospectivement les trajectoires longitudinales entre groupes."
          : "Je veux étudier prospectivement l’évolution longitudinale du critère principal avec un suivi répété.",
  );
  const base = makeFunctionalReset03A1Contribution([sourceTurn]);
  const retained = base.scientificContent.candidateObjects.filter((candidate) =>
    !["STUDY_DESIGN", "INTERVENTION", "COMPARATOR"].includes(candidate.proposedType ?? ""));
  const candidateObjects = [
    ...retained,
    item({
      itemId: `question:p1-rde-03:${input?.insufficient ? "insufficient" : "design"}`,
      proposedType: "SCIENTIFIC_QUESTION",
      content: sourceTurn.content,
      sourceTurn,
      studyRole: "SCIENTIFIC_QUESTION",
    }),
    ...(!input?.insufficient ? [item({
      itemId: "objective:p1-rde-03:trajectory",
      proposedType: "OBJECTIVE",
      content: "Caractériser la trajectoire du critère principal",
      sourceTurn,
      studyRole: "PRIMARY",
    })] : []),
  ];
  const material = {
    ...structuredClone(base),
    identity: {
      ...base.identity,
      contributionId: `contribution:p1-rde-03:${input?.insufficient ? "insufficient" : input?.multipleDesigns ? "multiple" : input?.comparatorRequested ? "comparator" : "strong"}`,
      contributionDigest: logicalDigest({ source: sourceTurn.content, candidates: candidateObjects.map((candidate) => candidate.itemId) }),
    },
    source: { ...base.source, originalRequest: sourceTurn.content, turns: [sourceTurn], sourceRefs: [sourceTurn.turnId] },
    scientificContent: {
      ...structuredClone(base.scientificContent),
      explicitStatements: [],
      candidateObjects,
      candidateRelations: [],
    },
  } as ScientificInterpretationContributionEnvelope;
  return confirmResearchProjectContribution({
    contribution: material,
    current: null,
    projectId: "research-project:p1-rde-03",
    authority,
    confirmedAt: AT,
  });
};

const independentRevision = (project: ResearchProjectOwnerProjection) => {
  const sourceTurn = turn("independent-revision", "Ajouter une contrainte logistique explicite.", "2026-09-02T09:01:00.000Z");
  const base = makeFunctionalReset03A1Contribution([sourceTurn]);
  const constraint = item({
    itemId: "constraint:p1-rde-03:logistics",
    proposedType: "CONSTRAINT",
    content: "Contrainte logistique explicite",
    sourceTurn,
  });
  const contribution = {
    ...structuredClone(base),
    identity: {
      ...base.identity,
      contributionId: "contribution:p1-rde-03:independent-revision",
      previousContributionId: project.contributionRef,
      contributionDigest: logicalDigest({ project: project.versionId, constraint: constraint.itemId }),
    },
    source: { ...base.source, originalRequest: sourceTurn.content, turns: [sourceTurn], sourceRefs: [sourceTurn.turnId] },
    scientificContent: {
      ...structuredClone(base.scientificContent),
      explicitStatements: [],
      candidateObjects: [constraint],
      candidateRelations: [],
    },
  } as ScientificInterpretationContributionEnvelope;
  return confirmResearchProjectContribution({
    contribution,
    current: project,
    projectId: project.projectId,
    authority,
    confirmedAt: sourceTurn.createdAt,
  });
};

const dispatch = (
  project: ResearchProjectOwnerProjection,
  ledger = createProductOwnerResultLedger("session:p1-rde-03"),
  traceLedger = createScientificExecutionTraceLedger("session:p1-rde-03"),
) => {
  const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
  return {
    navigation,
    result: dispatchStudyDesignFromQuery({
      project,
      navigation,
      ownerResultLedger: ledger,
      traceLedger,
      sessionId: "session:p1-rde-03",
      conversationId: "conversation:p1-rde-03",
      presentationTurnRef: "turn:p1-rde-03:presentation",
      startedAt: AT,
      completedAt: "2026-09-02T09:00:01.000Z",
    }),
  };
};

const selectionFor = (
  project: ResearchProjectOwnerProjection,
  dispatched: ReturnType<typeof dispatch>["result"],
  optionIndex = 0,
  suffix = "selection",
) => {
  const proposalTurn: ScientificInterpretationTurn = {
    turnId: dispatched.interaction.presentationTurnRef,
    role: "NOXIA",
    content: dispatched.presentation.plainText,
    createdAt: AT,
  };
  const selectionTurn = turn(suffix, `Je retiens l’option ${optionIndex + 1} pour revue.`);
  const contribution = buildStudyDesignOptionContribution({
    conversationId: "conversation:p1-rde-03",
    project,
    proposal: dispatched.proposal,
    optionRef: dispatched.proposal.options[optionIndex]!.optionId,
    proposalTurn,
    selectionTurn,
    createdAt: selectionTurn.createdAt,
  });
  const candidate = prepareResearchProjectContributionCandidate(contribution, project);
  return { proposalTurn, selectionTurn, contribution, candidate };
};

const adoptSelection = (
  project: ResearchProjectOwnerProjection,
  selected: ReturnType<typeof selectionFor>,
  confirmedAt = "2026-09-02T09:02:00.000Z",
) => confirmResearchProjectContribution({
  contribution: selected.contribution,
  current: project,
  projectId: project.projectId,
  authority,
  confirmedAt,
  reviewedProjection: selected.candidate.humanReviewProjection,
});

const handoffFor = (project: ResearchProjectOwnerProjection, confirmedAt: string) => authorizeResearchProjectDocumentHandoff({
  project,
  authority,
  confirmedAt,
});

const sectionValues = (presentation: ReturnType<typeof buildStandardProtocolPresentation>, sectionId: string) => presentation.sections
  .find((section) => section.sectionId === sectionId)?.entries.map((entry) => entry.value) ?? [];

describe("P1-RDE-03 — Study Design end-to-end qualification", () => {
  it("A/B/C/D/F/G/H/W/X — preserves bounded routing, choices, unknowns, handoffs and the single-runtime registry", () => {
    const strongProject = projectWithoutDesign();
    const strong = dispatch(strongProject);
    expect(isStudyDesignQueryDispatch(strong.navigation)).toBe(true);
    expect(strong.result.proposal.options).toHaveLength(1);
    expect(strong.result.proposal).toMatchObject({ selectedOptionId: null, candidateIsAdopted: false, projectWriteAuthorized: false });
    expect(strongProject.versionId).toBe(strong.result.interaction.sourceProjectVersion);

    const multiple = dispatch(projectWithoutDesign({ multipleDesigns: true })).result;
    expect(multiple.proposal.options).toHaveLength(3);
    expect(multiple.proposal.tradeOffs).toHaveLength(1);
    expect(resolveStudyDesignConversation({ raw: "quelle est la différence entre les deux ?", proposal: multiple.proposal })).toMatchObject({ kind: "DISCUSS" });
    expect(resolveStudyDesignConversation({ raw: "Je rejette toutes ces options.", proposal: multiple.proposal })).toMatchObject({ kind: "REJECT_ALL" });
    expect(resolveStudyDesignConversation({ raw: "Je voudrais plutôt une autre stratégie.", proposal: multiple.proposal })).toMatchObject({ kind: "FALLTHROUGH" });

    const insufficient = dispatch(projectWithoutDesign({ insufficient: true })).result;
    expect(insufficient.proposal).toMatchObject({ proposalStatus: "INSUFFICIENT_CONTEXT", options: [] });
    expect(insufficient.navigation.standardQuestion?.text).toBe(insufficient.proposal.informationNeeds[0]?.question);
    expect(insufficient.navigation.standardQuestion?.scopeSectionIds).toEqual(["DESIGN"]);
    expect(insufficient.navigation.standardQuestion?.text).not.toMatch(/intervention.*comparateur/i);

    const comparative = dispatch(projectWithoutDesign({ comparatorRequested: true })).result;
    expect(comparative.proposal.options.every((option) => option.axes.interventionMode === "OBSERVATIONAL")).toBe(true);
    expect(comparative.proposal.options.find((option) => option.family.code === "COMPARATIVE_OBSERVATIONAL")?.axes.comparisonStructure).toBe("UNKNOWN");
    expect(comparative.proposal.downstreamHandoffs.length).toBeGreaterThan(0);
    expect(comparative.proposal.downstreamHandoffs.every((handoff) => handoff.status === "PROPOSED_NOT_EXECUTED")).toBe(true);
    expect(comparative.traceLedger.events.filter((event) => ["BIOSTATISTICS", "IMAGING", "DATA_MANAGEMENT"].includes(event.owner))).toEqual([]);
    expect(comparative.providerCalls).toBe(0);

    const alreadyDesigned = adoptSelection(strongProject, selectionFor(strongProject, strong.result));
    const nextNavigation = buildFunctionalResetQueryNavigation({ project: alreadyDesigned, previous: strong.navigation, recordedAt: AT });
    expect(isStudyDesignQueryDispatch(nextNavigation)).toBe(false);

    const capabilities = listSpecializedOwnerCapabilities().entries.filter((entry) => entry.capabilityId === "STUDY_DESIGN_COHERENCE");
    expect(capabilities).toHaveLength(1);
    expect(capabilities[0]).toMatchObject({
      owner: "STUDY_DESIGN",
      status: "AVAILABLE_WITH_LIMITATIONS",
      implementationVersion: "1.0.0",
      readsProjectSnapshot: true,
      canWriteProject: false,
      externalProvider: "NONE",
    });
    expect(capabilities[0]?.limitations).toEqual(expect.arrayContaining([
      expect.stringContaining("IMPLEMENTED_AND_PRODUCT_WIRED"),
    ]));
  });

  it("K/L/M/N/O/T/U — selection and review do not write; confirmation writes once with exact ownership, provenance and trace", () => {
    const project = projectWithoutDesign();
    const { navigation, result } = dispatch(project);
    const selected = selectionFor(project, result);
    const before = structuredClone(project);

    expect(selected.candidate.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
    expect(selected.contribution.decisionBoundary.projectWriteAuthorized).toBe(false);
    expect(project).toEqual(before);
    expect(ensureCanonicalProjectState(project).objects.some((object) => object.objectType === "STUDY_DESIGN")).toBe(false);

    const reviewTrace = recordStudyDesignOptionReviewTrace({
      ledger: result.traceLedger,
      traceRunId: result.interaction.traceRunId,
      conversationId: "conversation:p1-rde-03",
      recordedAt: AT,
      contribution: selected.contribution,
      candidate: selected.candidate,
      project,
      proposalRef: result.proposal.proposalId,
      proposalDigest: result.proposal.proposalDigest,
      optionRef: result.proposal.options[0]!.optionId,
    });
    const adopted = adoptSelection(project, selected);
    const canonicalDesign = ensureCanonicalProjectState(adopted).objects.find((object) => object.objectType === "STUDY_DESIGN" && object.actuality === "CURRENT")!;
    expect(adopted.versionId).not.toBe(project.versionId);
    expect(canonicalDesign).toMatchObject({ adoptionStatus: "ADOPTED_BY_HUMAN_DECISION", actuality: "CURRENT" });
    expect(canonicalDesign.provenance.evidenceRefs).toEqual(expect.arrayContaining([
      result.proposal.proposalId,
      result.proposal.options[0]!.optionId,
      project.versionId,
      project.projectDigest,
    ]));
    expect(canonicalDesign.decisionRefs).toContain(adopted.confirmationDecision.decisionId);

    const nextNavigation = buildFunctionalResetQueryNavigation({ project: adopted, previous: navigation, recordedAt: AT });
    expect(nextNavigation.currentAction?.affectedDecisionRefs).not.toContain("project-section:DESIGN");
    expect(nextNavigation.standardQuestion?.scopeSectionIds).toEqual(["INTERVENTION"]);

    const adoptionTrace = recordProjectAdoptionTrace({
      ledger: reviewTrace,
      traceRunId: result.interaction.traceRunId,
      conversationId: "conversation:p1-rde-03",
      recordedAt: AT,
      contribution: selected.contribution,
      project: adopted,
      previousProjectExisted: true,
      queryNavigation: nextNavigation,
      documents: createEmptyFunctionalResetDocumentPortfolio(),
    });
    expect(adoptionTrace.events.map((event) => event.eventType)).toEqual(expect.arrayContaining([
      "QRY_ACTION_SELECTED",
      "HANDOFF_ACCEPTED",
      "OWNER_INVOCATION_COMPLETED",
      "PROJECT_CANDIDATE_EXTRACTED",
      "HUMAN_REVIEW_PRESENTED",
      "HUMAN_DECISION_RECORDED",
      "PROJECT_VERSION_REVISED",
    ]));
    expect(adoptionTrace.events.find((event) => event.eventType === "OWNER_INVOCATION_COMPLETED")?.common).toMatchObject({
      responsibilityOwner: "STUDY_DESIGN",
      executor: "STUDY_DESIGN_COHERENCE",
      provider: "NONE",
    });

    const facts: unknown[] = [];
    const nativeInput = buildStudyDesignRuntimeInput(buildProjectContextSnapshot({ project }));
    const withoutTrace = executeStudyDesignRuntime(nativeInput);
    const withTrace = executeStudyDesignRuntime(nativeInput, (fact) => facts.push(fact));
    expect(studyDesignScientificOutputIsStable(withoutTrace, withTrace)).toBe(true);
    expect(facts.length).toBeGreaterThan(0);

    const session = {
      ...createFunctionalResetSession(AT),
      project,
      queryNavigation: navigation,
      studyDesignInteraction: result.interaction,
      knowledgeOwnerLedger: result.ownerResultLedger,
      scientificExecutionTraceLedger: result.traceLedger,
    };
    render(<>
      <StudyDesignStandardCard presentation={result.presentation} interaction={result.interaction} onSelect={() => undefined} onDiscuss={() => undefined} />
      <DevelopmentDiagnostics session={session} />
    </>);
    const standard = screen.getByTestId("standard-study-design-proposal");
    const expert = screen.getByTestId("protocol-designer-development-diagnostics");
    expect(standard).toHaveTextContent(result.proposal.options[0]!.label);
    expect(standard.textContent).not.toMatch(/proposalId|projectDigest|STUDY_DESIGN_COHERENCE|traceRunId/i);
    expect(within(expert).getAllByText(project.versionId).length).toBeGreaterThan(0);
    expect(expert.textContent).toContain(result.proposal.proposalId);
  });

  it("E — replaces an adopted Study Design without overwrite and preserves superseded history", () => {
    const project = projectWithoutDesign();
    const first = dispatch(project).result;
    const adoptedA = adoptSelection(project, selectionFor(project, first));
    const original = ensureCanonicalProjectState(adoptedA).objects.find((object) => object.objectType === "STUDY_DESIGN" && object.actuality === "CURRENT")!;

    const replacementInvocation = invokeStudyDesignForProjectSnapshot({
      projectSnapshot: buildProjectContextSnapshot({ project: adoptedA }),
      ledger: first.ownerResultLedger,
      callerRef: "qry:p1-rde-03:explicit-design-revision",
      purpose: "Réexaminer explicitement le design adopté",
      startedAt: "2026-09-02T09:02:10.000Z",
      completedAt: "2026-09-02T09:02:11.000Z",
    });
    const generatedProposal = replacementInvocation.result!.nativePayload!;
    const baseOption = generatedProposal.options[0]!;
    const changedOption = { ...baseOption, optionId: `${baseOption.optionId}:revision`, label: `${baseOption.label} — stratégie révisée` };
    const replacementProposal = {
      ...generatedProposal,
      proposalId: `${generatedProposal.proposalId}:revision`,
      proposalDigest: logicalDigest({ source: generatedProposal.proposalDigest, option: changedOption.optionId }),
      options: [changedOption],
    };
    const proposalTurn: ScientificInterpretationTurn = {
      turnId: "turn:p1-rde-03:replacement-presentation",
      role: "NOXIA",
      content: changedOption.label,
      createdAt: "2026-09-02T09:02:11.000Z",
    };
    const selectionTurn = turn("replacement-selection", "Je retiens cette stratégie révisée pour revue.", "2026-09-02T09:02:12.000Z");
    const contribution = buildStudyDesignOptionContribution({
      conversationId: "conversation:p1-rde-03",
      project: adoptedA,
      proposal: replacementProposal,
      optionRef: changedOption.optionId,
      proposalTurn,
      selectionTurn,
      createdAt: selectionTurn.createdAt,
    });
    const selected = {
      proposalTurn,
      selectionTurn,
      contribution,
      candidate: prepareResearchProjectContributionCandidate(contribution, adoptedA),
    };
    expect(selected.candidate.canonicalChangeSet.objectChanges).toEqual(expect.arrayContaining([
      expect.objectContaining({ operation: "REPLACE", previousVersionRef: original.objectVersionId }),
    ]));
    const adoptedB = adoptSelection(adoptedA, selected, "2026-09-02T09:03:00.000Z");
    const designs = ensureCanonicalProjectState(adoptedB).objects.filter((object) => object.objectType === "STUDY_DESIGN");
    expect(adoptedB.previousVersionId).toBe(adoptedA.versionId);
    expect(designs).toEqual(expect.arrayContaining([
      expect.objectContaining({ objectVersionId: original.objectVersionId, actuality: "SUPERSEDED" }),
      expect.objectContaining({ content: changedOption.label, actuality: "CURRENT", supersedesVersionRef: original.objectVersionId }),
    ]));
  });

  it("I/J/V — rejects a proposal after an independent Project revision and requires a fresh exact-version invocation", () => {
    const projectV1 = projectWithoutDesign();
    const r1 = dispatch(projectV1).result;
    const projectV2 = independentRevision(projectV1);
    expect(projectV2.versionId).not.toBe(projectV1.versionId);
    expect(interactionMatchesCurrentProject(r1.interaction, projectV2)).toBe(false);

    const retainedR1 = readProductStudyDesignOwnerResult({
      ledger: r1.ownerResultLedger,
      resultId: r1.interaction.ownerResultRef,
      currentProjectSnapshot: buildProjectContextSnapshot({ project: projectV2 }),
    });
    expect(retainedR1.freshness).toMatchObject({ status: "STALE_OWNER_RESULT" });
    expect(retainedR1.freshness.staleReasons).toEqual(expect.arrayContaining(["PROJECT_VERSION_CHANGED", "PROJECT_DIGEST_CHANGED"]));

    const proposalTurn: ScientificInterpretationTurn = {
      turnId: r1.interaction.presentationTurnRef,
      role: "NOXIA",
      content: r1.presentation.plainText,
      createdAt: AT,
    };
    expect(() => buildStudyDesignOptionContribution({
      conversationId: "conversation:p1-rde-03",
      project: projectV2,
      proposal: r1.proposal,
      optionRef: r1.proposal.options[0]!.optionId,
      proposalTurn,
      selectionTurn: turn("stale-selection", "Je retiens la première option."),
      createdAt: AT,
    })).toThrow("STUDY_DESIGN_PROPOSAL_STALE_PROJECT_VERSION");

    const r2 = dispatch(projectV2, r1.ownerResultLedger, r1.traceLedger).result;
    expect(r2.proposal.sourceProject).toMatchObject({
      projectId: projectV2.projectId,
      projectVersion: projectV2.versionId,
      projectDigest: projectV2.projectDigest,
    });
    expect(r2.proposal.proposalId).not.toBe(r1.proposal.proposalId);
  });

  it("P/Q/R — carries the adopted design through Project→TMP→DOC→Standard→HTML and preserves stale protocol history", () => {
    const projectV1 = projectWithoutDesign();
    const p1Decision = handoffFor(projectV1, "2026-09-02T09:00:10.000Z");
    const portfolioP1 = refreshFunctionalResetDocumentPortfolio({
      project: projectV1,
      previous: createEmptyFunctionalResetDocumentPortfolio(),
      handoffDecision: p1Decision,
      requestedAt: "2026-09-02T09:00:10.000Z",
      generateProtocol: true,
    });
    const p1 = portfolioP1.projections.at(-1)!;
    const p1Before = JSON.stringify(p1);

    const dispatched = dispatch(projectV1).result;
    const selected = selectionFor(projectV1, dispatched);
    const projectV2 = adoptSelection(projectV1, selected, "2026-09-02T09:01:00.000Z");
    const adoptedDesign = ensureCanonicalProjectState(projectV2).objects.find((object) => object.objectType === "STUDY_DESIGN" && object.actuality === "CURRENT")!;
    const source = projectDocumentSourceFromFunctionalProject(projectV2, null);
    expect(source.studyDesignCandidates).toEqual([
      expect.objectContaining({ designId: adoptedDesign.objectId, label: adoptedDesign.content, reviewState: "ADOPTED" }),
    ]);
    expect(source.selectedStudyDesignCandidate).toMatchObject({ designId: adoptedDesign.objectId, humanSelected: true });

    const stale = refreshFunctionalResetDocumentPortfolio({
      project: projectV2,
      previous: portfolioP1,
      requestedAt: "2026-09-02T09:01:01.000Z",
    });
    expect(stale.cards.find((card) => card.kind === "PROTOCOL")?.freshness).toBe("STALE");
    expect(stale.projections).toEqual(portfolioP1.projections);
    expect(JSON.stringify(stale.projections[0])).toBe(p1Before);

    const p2Decision = handoffFor(projectV2, "2026-09-02T09:02:00.000Z");
    const regenerated = refreshFunctionalResetDocumentPortfolio({
      project: projectV2,
      previous: stale,
      handoffDecision: p2Decision,
      requestedAt: "2026-09-02T09:02:00.000Z",
      generateProtocol: true,
    });
    const p2 = regenerated.projections.at(-1)!;
    const presentation = buildStandardProtocolPresentation(p2);
    const html = renderProjection(p2, "HTML").content;
    expect(regenerated.projections).toHaveLength(2);
    expect(regenerated.projections[0]).toEqual(p1);
    expect(functionalProtocolProjection(regenerated, p1.projectionId)).toEqual(p1);
    expect(p2.source).toMatchObject({ projectVersion: projectV2.versionId, projectDigest: projectV2.projectDigest });
    expect(sectionValues(presentation, "design")).toEqual([`${adoptedDesign.content}.`]);
    expect(presentation.openItems.map((open) => open.label)).not.toContain("Plan d’étude");
    expect(html).toContain(adoptedDesign.content);
    expect(html).not.toMatch(/study-design-proposal:|study-design-option:|STUDY_DESIGN_COHERENCE|NOXIA_STUDY_DESIGN_FAMILY/);
    dispatched.proposal.options.slice(1).forEach((option) => expect(html).not.toContain(option.label));

    const adoptionTrace = recordProjectAdoptionTrace({
      ledger: dispatched.traceLedger,
      traceRunId: dispatched.interaction.traceRunId,
      conversationId: "conversation:p1-rde-03",
      recordedAt: "2026-09-02T09:01:00.000Z",
      contribution: selected.contribution,
      project: projectV2,
      previousProjectExisted: true,
      queryNavigation: buildFunctionalResetQueryNavigation({ project: projectV2, recordedAt: AT }),
      documents: portfolioP1,
    });
    const documentTrace = recordDocumentProjectionTrace({
      ledger: adoptionTrace,
      traceRunId: dispatched.interaction.traceRunId,
      conversationId: "conversation:p1-rde-03",
      recordedAt: "2026-09-02T09:02:00.000Z",
      project: projectV2,
      decision: p2Decision,
      projection: p2,
      projectionMode: "STANDARD",
    });
    const artifactTrace = recordArtifactGeneratedTrace({
      ledger: documentTrace,
      traceRunId: dispatched.interaction.traceRunId,
      conversationId: "conversation:p1-rde-03",
      generatedAt: "2026-09-02T09:02:01.000Z",
      projection: p2,
      format: "HTML",
    });
    expect(artifactTrace.events.map((event) => event.eventType)).toEqual(expect.arrayContaining([
      "STALE_MARKED",
      "TMP_PROJECTION",
      "DOC_PROJECTION",
      "UI_PROJECTION",
      "ARTIFACT_GENERATED",
    ]));
    expect(artifactTrace.events.every((event) => event.common?.provider !== "GOOGLE_GEMINI" && event.common?.provider !== "OPENAI")).toBe(true);
  });
});
