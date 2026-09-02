import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation";
import { createProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import { invokeStudyDesignForProjectSnapshot } from "@/features/protocol-designer/product-study-design-owner-runtime";
import { createScientificExecutionTraceLedger } from "@/features/protocol-designer/scientific-execution-trace";
import { createEmptyFunctionalResetDocumentPortfolio } from "@/features/document-projection";
import StudyDesignStandardCard from "../StudyDesignStandardCard";
import { recordProjectAdoptionTrace, recordStudyDesignOptionReviewTrace } from "../end-to-end-trace-adapter";
import {
  buildStandardStudyDesignPresentation,
  buildStudyDesignOptionContribution,
  dispatchStudyDesignFromQuery,
  interactionMatchesCurrentProject,
  isStudyDesignQueryDispatch,
  resolveStudyDesignConversation,
} from "../study-design-standard";
import { makeFunctionalReset03A1Contribution } from "./functional-reset-03a1-fixtures";

const AT = "2026-09-02T08:00:00.000Z";
const authority = {
  actorRef: "researcher:p1-rde-02",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const turn = (suffix: string, content: string): ScientificInterpretationTurn => ({
  turnId: `turn:p1-rde-02:${suffix}`,
  role: "USER",
  content,
  createdAt: AT,
});

const item = (input: {
  itemId: string;
  semanticIdentity: string;
  proposedType: string;
  content: string;
  studyRole: string;
  sourceTurn: ScientificInterpretationTurn;
}): ScientificContributionItem => ({
  itemId: input.itemId,
  semanticIdentity: input.semanticIdentity,
  proposedType: input.proposedType,
  content: input.content,
  polarity: "AFFIRMED",
  studyRole: input.studyRole,
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

const projectWithoutDesign = (input?: { insufficient?: boolean; comparatorRequested?: boolean; multipleDesigns?: boolean }) => {
  const sourceTurn = turn(
    input?.insufficient ? "insufficient" : "rich",
    input?.insufficient
      ? "Quel plan d’étude faut-il retenir ?"
      : input?.comparatorRequested
        ? "Je veux comparer prospectivement les trajectoires longitudinales entre groupes."
        : input?.multipleDesigns
          ? "Je veux étudier une trajectoire longitudinale avec des données rétrospectives existantes puis un suivi prospectif."
        : "Je veux étudier prospectivement l’évolution longitudinale du critère principal.",
  );
  const base = makeFunctionalReset03A1Contribution([sourceTurn]);
  const retained = base.scientificContent.candidateObjects.filter((candidate) =>
    !["STUDY_DESIGN", "INTERVENTION", "COMPARATOR"].includes(candidate.proposedType ?? ""));
  const additions = [
    item({
      itemId: "question:p1-rde-02",
      semanticIdentity: "question:p1-rde-02",
      proposedType: "SCIENTIFIC_QUESTION",
      content: sourceTurn.content,
      studyRole: "SCIENTIFIC_QUESTION",
      sourceTurn,
    }),
    ...(!input?.insufficient ? [item({
      itemId: "objective:p1-rde-02",
      semanticIdentity: "objective:p1-rde-02",
      proposedType: "OBJECTIVE",
      content: "Caractériser la trajectoire du critère principal",
      studyRole: "PRIMARY",
      sourceTurn,
    })] : []),
  ];
  const material = {
    ...structuredClone(base),
    identity: {
      ...base.identity,
      contributionId: `contribution:p1-rde-02:${input?.insufficient ? "insufficient" : input?.comparatorRequested ? "comparator" : input?.multipleDesigns ? "multiple" : "rich"}`,
      contributionDigest: logicalDigest({ source: sourceTurn.content, retained: retained.map((candidate) => candidate.itemId) }),
    },
    source: { ...base.source, originalRequest: sourceTurn.content, turns: [sourceTurn], sourceRefs: [sourceTurn.turnId] },
    scientificContent: {
      ...structuredClone(base.scientificContent),
      explicitStatements: [],
      candidateObjects: [...retained, ...additions],
      candidateRelations: [],
    },
  } as ScientificInterpretationContributionEnvelope;
  return confirmResearchProjectContribution({
    contribution: material,
    current: null,
    projectId: "research-project:p1-rde-02",
    authority,
    confirmedAt: AT,
  });
};

const dispatch = (project: ResearchProjectOwnerProjection) => {
  const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
  return {
    navigation,
    result: dispatchStudyDesignFromQuery({
      project,
      navigation,
      ownerResultLedger: createProductOwnerResultLedger("session:p1-rde-02"),
      traceLedger: createScientificExecutionTraceLedger("session:p1-rde-02"),
      sessionId: "session:p1-rde-02",
      conversationId: "conversation:p1-rde-02",
      presentationTurnRef: "turn:p1-rde-02:presentation",
      startedAt: AT,
      completedAt: "2026-09-02T08:00:01.000Z",
    }),
  };
};

describe("P1-RDE-02 — Study Design wired into Standard", () => {
  it("A/B/F — QRY dispatches DESIGN to the existing owner and projects bounded non-adopted options", () => {
    const project = projectWithoutDesign();
    const before = structuredClone(project);
    const { navigation, result } = dispatch(project);
    expect(isStudyDesignQueryDispatch(navigation)).toBe(true);
    expect(navigation.currentAction).toMatchObject({ owner: "STUDY_DESIGN" });
    expect(navigation.selection.selected?.capabilityRef).toBe("STUDY_DESIGN_COHERENCE");
    expect(result.proposal.options.length).toBeGreaterThanOrEqual(1);
    expect(result.proposal.options.length).toBeLessThanOrEqual(3);
    expect(result.presentation.options.every((option) => Boolean(option.rationale))).toBe(true);
    expect(result.presentation.options.every((option) => option.mainAdvantage || option.mainLimitation)).toBe(true);
    expect(result.proposal).toMatchObject({ selectedOptionId: null, candidateIsAdopted: false, projectWriteAuthorized: false });
    expect(result).toMatchObject({ providerCalls: 0, projectWrites: 0, humanDecisionCreated: false });
    expect(result.downstreamHandoffRequests.length).toBeGreaterThan(0);
    expect(result.traceLedger.events.filter((event) => ["BIOSTATISTICS", "IMAGING", "DATA_MANAGEMENT"].includes(event.owner))).toEqual([]);
    expect(project).toEqual(before);
    expect(result.interaction).toMatchObject({
      sourceProjectRef: project.projectId,
      sourceProjectVersion: project.versionId,
      sourceProjectDigest: project.projectDigest,
      status: "ACTIVE",
      projectWriteAuthorized: false,
    });
    expect(result.traceLedger.events.map((event) => event.eventType)).toEqual(expect.arrayContaining([
      "QRY_ACTION_SELECTED",
      "HANDOFF_ACCEPTED",
      "OWNER_INVOCATION_COMPLETED",
      "UI_PROJECTION",
    ]));
    expect(result.traceLedger.events.every((event) => event.common?.provider !== "GOOGLE_GEMINI" && event.common?.provider !== "OPENAI")).toBe(true);

    const multiple = dispatch(projectWithoutDesign({ multipleDesigns: true })).result;
    expect(multiple.proposal.options).toHaveLength(3);
    expect(multiple.proposal.selectedOptionId).toBeNull();
    expect(multiple.presentation.majorTradeoff).toBeTruthy();
    expect(multiple.presentation.options.every((option) => option.mainAdvantage && option.mainLimitation)).toBe(true);
  });

  it("scope boundary — non-DESIGN QRY actions never dispatch Study Design", () => {
    const sourceTurn = turn("already-designed", "Étude multicentrique sur l’évolution longitudinale d’un critère.");
    const project = confirmResearchProjectContribution({
      contribution: makeFunctionalReset03A1Contribution([sourceTurn]),
      current: null,
      projectId: "research-project:p1-rde-02:already-designed",
      authority,
      confirmedAt: AT,
    });
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: AT });
    expect(navigation.currentAction?.affectedDecisionRefs).not.toContain("project-section:DESIGN");
    expect(isStudyDesignQueryDispatch(navigation)).toBe(false);
    expect(() => dispatchStudyDesignFromQuery({
      project,
      navigation,
      ownerResultLedger: createProductOwnerResultLedger("session:p1-rde-02:scope"),
      traceLedger: createScientificExecutionTraceLedger("session:p1-rde-02:scope"),
      sessionId: "session:p1-rde-02:scope",
      conversationId: "conversation:p1-rde-02:scope",
      presentationTurnRef: "turn:p1-rde-02:scope",
      startedAt: AT,
      completedAt: AT,
    })).toThrow("QRY_ACTION_NOT_OWNED_BY_STUDY_DESIGN");
  });

  it("C/G/H — insufficient context returns a bounded QRY need and absent intervention/comparator remain unknown", () => {
    const insufficient = dispatch(projectWithoutDesign({ insufficient: true })).result;
    expect(insufficient.proposal).toMatchObject({ proposalStatus: "INSUFFICIENT_CONTEXT", options: [] });
    expect(insufficient.presentation.informationNeed).toBeTruthy();
    expect(insufficient.navigation.standardQuestion?.text).toBe(insufficient.presentation.informationNeed);
    expect(insufficient.navigation.currentPresentation?.informationNeedRefs).toHaveLength(1);
    expect(insufficient.navigation.currentAction?.navigationNeedRefs).toEqual(insufficient.navigation.currentPresentation?.informationNeedRefs);
    expect(insufficient.navigation.currentAction?.owner).toBe("RESEARCH_PROJECT");
    expect(isStudyDesignQueryDispatch(insufficient.navigation)).toBe(false);

    const comparative = dispatch(projectWithoutDesign({ comparatorRequested: true })).result.proposal;
    expect(comparative.options.some((option) => option.family.code === "INTERVENTIONAL_COMPARATIVE_STUDY")).toBe(false);
    expect(comparative.options.every((option) => option.axes.interventionMode === "OBSERVATIONAL")).toBe(true);
    expect(comparative.options.find((option) => option.family.code === "COMPARATIVE_OBSERVATIONAL")?.axes.comparisonStructure).toBe("UNKNOWN");
  });

  it("D — free discussion, deferral and rejection never select or adopt an option", () => {
    const proposal = dispatch(projectWithoutDesign()).result.proposal;
    expect(resolveStudyDesignConversation({ raw: "Pouvez-vous comparer les avantages et les limites ?", proposal }).kind).toBe("DISCUSS");
    expect(resolveStudyDesignConversation({ raw: "Je ne sais pas encore, à discuter plus tard.", proposal }).kind).toBe("DEFER");
    expect(resolveStudyDesignConversation({ raw: "Je rejette toutes ces options.", proposal }).kind).toBe("REJECT_ALL");
    expect(resolveStudyDesignConversation({ raw: "Je voudrais plutôt une autre stratégie.", proposal }).kind).toBe("FALLTHROUGH");
    expect(proposal.selectedOptionId).toBeNull();
  });

  it("E — selection creates only a review candidate; Human confirmation creates vN+1 and adopts STUDY_DESIGN", () => {
    const project = projectWithoutDesign();
    const result = dispatch(project).result;
    const proposalTurn: ScientificInterpretationTurn = {
      turnId: result.interaction.presentationTurnRef,
      role: "NOXIA",
      content: result.presentation.plainText,
      createdAt: AT,
    };
    const selectionTurn = turn("selection", "Je retiens la première option pour revue.");
    const contribution = buildStudyDesignOptionContribution({
      conversationId: "conversation:p1-rde-02",
      project,
      proposal: result.proposal,
      optionRef: result.proposal.options[0]!.optionId,
      proposalTurn,
      selectionTurn,
      createdAt: AT,
    });
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    expect(candidate.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
    expect(candidate.humanReviewProjection.sections.flatMap((section) => section.items)).toEqual(expect.arrayContaining([
      expect.objectContaining({ projectSectionId: "DESIGN" }),
    ]));
    expect(project.versionId).toBe(result.interaction.sourceProjectVersion);
    expect(ensureCanonicalProjectState(project).objects.some((object) => object.objectType === "STUDY_DESIGN")).toBe(false);
    const reviewTrace = recordStudyDesignOptionReviewTrace({
      ledger: result.traceLedger,
      traceRunId: result.interaction.traceRunId,
      conversationId: "conversation:p1-rde-02",
      recordedAt: AT,
      contribution,
      candidate,
      project,
      proposalRef: result.proposal.proposalId,
      proposalDigest: result.proposal.proposalDigest,
      optionRef: result.proposal.options[0]!.optionId,
    });
    expect(reviewTrace.events.slice(-4).map((event) => event.eventType)).toEqual([
      "UI_PROJECTION",
      "PROJECT_CANDIDATE_EXTRACTED",
      "PROJECT_CANDIDATE_VALIDATED",
      "HUMAN_REVIEW_PRESENTED",
    ]);

    const adopted = confirmResearchProjectContribution({
      contribution,
      current: project,
      projectId: project.projectId,
      authority,
      confirmedAt: "2026-09-02T08:01:00.000Z",
      reviewedProjection: candidate.humanReviewProjection,
    });
    expect(adopted.versionId).not.toBe(project.versionId);
    expect(ensureCanonicalProjectState(adopted).objects).toEqual(expect.arrayContaining([
      expect.objectContaining({ objectType: "STUDY_DESIGN", actuality: "CURRENT" }),
    ]));
    const adoptedDesign = ensureCanonicalProjectState(adopted).objects.find((object) => object.objectType === "STUDY_DESIGN" && object.actuality === "CURRENT")!;
    expect(adoptedDesign.provenance.evidenceRefs).toEqual(expect.arrayContaining([
      result.proposal.proposalId,
      result.proposal.options[0]!.optionId,
      project.versionId,
      project.projectDigest,
    ]));
    expect(adoptedDesign.decisionRefs).toContain(adopted.confirmationDecision.decisionId);
    expect(interactionMatchesCurrentProject(result.interaction, adopted)).toBe(false);
    const adoptedNavigation = buildFunctionalResetQueryNavigation({ project: adopted, recordedAt: AT });
    const adoptionTrace = recordProjectAdoptionTrace({
      ledger: reviewTrace,
      traceRunId: result.interaction.traceRunId,
      conversationId: "conversation:p1-rde-02",
      recordedAt: AT,
      contribution,
      project: adopted,
      previousProjectExisted: true,
      queryNavigation: adoptedNavigation,
      documents: createEmptyFunctionalResetDocumentPortfolio(),
    });
    expect(adoptionTrace.events.map((event) => event.eventType)).toEqual(expect.arrayContaining([
      "HUMAN_DECISION_RECORDED",
      "PROJECT_VERSION_REVISED",
    ]));

    const replacementInvocation = invokeStudyDesignForProjectSnapshot({
      projectSnapshot: buildProjectContextSnapshot({ project: adopted }),
      ledger: result.ownerResultLedger,
      callerRef: "qry:replacement",
      purpose: "Réexaminer le design adopté",
      startedAt: AT,
      completedAt: "2026-09-02T08:02:00.000Z",
    });
    const generatedReplacement = replacementInvocation.result!.nativePayload!;
    const changedOption = {
      ...generatedReplacement.options[0]!,
      optionId: `${generatedReplacement.options[0]!.optionId}:revised`,
      label: `${generatedReplacement.options[0]!.label} — version révisée`,
    };
    const changedProposal = {
      ...generatedReplacement,
      proposalId: `${generatedReplacement.proposalId}:revised`,
      proposalDigest: logicalDigest({ proposal: generatedReplacement.proposalId, option: changedOption.optionId }),
      options: [changedOption],
    };
    const replacement = buildStudyDesignOptionContribution({
      conversationId: "conversation:p1-rde-02",
      project: adopted,
      proposal: changedProposal,
      optionRef: changedOption.optionId,
      proposalTurn,
      selectionTurn: turn("replacement", "Je retiens cette nouvelle option pour revue."),
      createdAt: AT,
    });
    const replacementCandidate = prepareResearchProjectContributionCandidate(replacement, adopted);
    expect(replacementCandidate.canonicalChangeSet.objectChanges).toEqual(expect.arrayContaining([
      expect.objectContaining({ operation: "REPLACE", candidate: expect.objectContaining({ objectType: "STUDY_DESIGN" }) }),
    ]));
    const revised = confirmResearchProjectContribution({
      contribution: replacement,
      current: adopted,
      projectId: adopted.projectId,
      authority,
      confirmedAt: "2026-09-02T08:03:00.000Z",
      reviewedProjection: replacementCandidate.humanReviewProjection,
    });
    const designVersions = ensureCanonicalProjectState(revised).objects.filter((object) => object.objectType === "STUDY_DESIGN");
    expect(revised.versionId).not.toBe(adopted.versionId);
    expect(designVersions).toEqual(expect.arrayContaining([
      expect.objectContaining({ actuality: "SUPERSEDED" }),
      expect.objectContaining({ actuality: "CURRENT", content: changedOption.label }),
    ]));
  });

  it("Standard uses progressive disclosure and exposes no technical owner, trace or identifiers", () => {
    const result = dispatch(projectWithoutDesign()).result;
    render(<StudyDesignStandardCard
      presentation={buildStandardStudyDesignPresentation(result.proposal)}
      interaction={result.interaction}
      onSelect={vi.fn()}
      onDiscuss={vi.fn()}
    />);
    const card = screen.getByTestId("standard-study-design-proposal");
    expect(card).toHaveTextContent(/Stratégies d’étude à discuter/);
    expect(screen.getAllByText(/Voir les prérequis et conséquences/).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /Retenir cette option pour revue/ }).length).toBeGreaterThan(0);
    expect(card.textContent).not.toMatch(/STUDY_DESIGN|QUERY_NAVIGATION|traceRunId|proposalId|projectDigest|ownerResult/i);
  });
});
