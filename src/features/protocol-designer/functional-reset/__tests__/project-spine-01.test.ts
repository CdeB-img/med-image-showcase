import { describe, expect, it } from "vitest";
import { naturalConversationContext } from "../../../../../api/protocol-designer-bridge-provider";
import {
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentProjectDeltaChange,
  type PersistentProjectRelation,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import {
  CANONICAL_PROJECT_OBJECT_TYPES,
  buildProjectContextSnapshot,
  confirmResearchProjectContribution,
  prepareResearchProjectContributionCandidate,
  rejectResearchProjectContribution,
  researchProjectOwnerDigest,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import type {
  ScientificExpectedVariableOccasionCandidate,
  ScientificInterpretationConversation,
  ScientificInterpretationTurn,
  ScientificTemporalAnchorCandidate,
  ScientificTemporalQualificationCandidate,
} from "@/features/scientific-interpretation/contracts";
import {
  createFunctionalResetSession,
  loadFunctionalResetSession,
  persistFunctionalResetSession,
} from "../session";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation";
import { acceptContextualStudyProposal } from "@/features/scientific-thinking/contextual-study-proposal";
import { buildStudyProposalSelectionContribution } from "../study-proposal-standard";
import { controlledStudyProposal } from "./study-proposal-fixtures";
import { canonicalizeScientificContribution } from "@/features/scientific-interpretation/canonical";
import { createElement } from "react";
import { render, within } from "@testing-library/react";
import ContributionReview from "../ContributionReview";

const authority = {
  actorRef: "project-spine:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const turn = (turnId: string, role: "USER" | "NOXIA", content: string): ScientificInterpretationTurn => ({
  turnId,
  role,
  content,
  createdAt: "2026-08-24T09:00:00.000Z",
});

const change = (input: Partial<PersistentProjectDeltaChange> & Pick<PersistentProjectDeltaChange, "candidateRef" | "proposedType" | "content" | "sourceText">): PersistentProjectDeltaChange => ({
  operation: "ADD",
  targetProjectRef: null,
  semanticIdentity: input.candidateRef,
  polarity: "AFFIRMED",
  studyRole: null,
  epistemicStatus: "EXPLICIT_USER_STATED",
  assertionKind: "USER_STATED",
  proposalSourceText: null,
  evidenceRefs: [],
  ...input,
});

const relation = (input: Partial<PersistentProjectRelation> & Pick<PersistentProjectRelation, "relationRef" | "relationType" | "sourceObjectRef" | "targetObjectRef" | "sourceText">): PersistentProjectRelation => ({
  polarity: "AFFIRMED",
  epistemicStatus: "EXPLICIT_USER_STATED",
  assertionKind: "USER_STATED",
  proposalSourceText: null,
  evidenceRefs: [],
  ...input,
});

const contributionFor = (input: {
  raw: string;
  changes: PersistentProjectDeltaChange[];
  relations?: PersistentProjectRelation[];
  current?: ResearchProjectOwnerProjection | null;
  turns?: ScientificInterpretationTurn[];
}) => {
  const conversation: ScientificInterpretationConversation = {
    conversationId: `conversation:${input.raw}`,
    language: "fr",
    turns: input.turns ?? [turn(`user:${input.raw}`, "USER", input.raw)],
  };
  const checked = validatePersistentProjectDelta(
    { changes: input.changes, relations: input.relations ?? [] },
    input.raw,
    input.current ?? null,
    conversation,
  );
  expect(checked.validation.blocks).toEqual([]);
  expect(checked.candidate).not.toBeNull();
  const contribution = contributionFromPersistentDelta({
    candidate: checked.candidate!,
    conversation,
    currentProject: input.current ?? null,
    createdAt: "2026-08-24T09:00:01.000Z",
  });
  expect(contribution).not.toBeNull();
  return contribution!;
};

const adopt = (
  contribution: ReturnType<typeof contributionFor>,
  current: ResearchProjectOwnerProjection | null = null,
  at = "2026-08-24T09:01:00.000Z",
) => confirmResearchProjectContribution({
  contribution,
  current,
  projectId: current?.projectId ?? "project:spine",
  authority,
  confirmedAt: at,
});

describe("PROJECT-SPINE-01 — canonical Research Project backbone", () => {
  it("persists scientific objects and their comparison relation after one Human Decision", () => {
    const raw = "La colchicine est comparée au placebo.";
    const contribution = contributionFor({
      raw,
      changes: [
        change({ candidateRef: "candidate:colchicine", proposedType: "INTERVENTION", content: "Colchicine", sourceText: raw, studyRole: "INTERVENTION_ARM" }),
        change({ candidateRef: "candidate:placebo", proposedType: "COMPARATOR", content: "Placebo", sourceText: raw, studyRole: "COMPARATOR_ARM" }),
      ],
      relations: [relation({ relationRef: "relation:colchicine-vs-placebo", relationType: "COMPARED_WITH", sourceObjectRef: "candidate:colchicine", targetObjectRef: "candidate:placebo", sourceText: raw })],
    });
    const project = adopt(contribution);
    expect(project.canonicalState?.objects.filter((object) => object.actuality === "CURRENT")).toEqual(expect.arrayContaining([
      expect.objectContaining({ objectType: "INTERVENTION_OR_EXPOSURE", content: "Colchicine" }),
      expect.objectContaining({ objectType: "GROUP", content: "Placebo" }),
    ]));
    expect(project.canonicalState?.relations).toEqual([
      expect.objectContaining({ relationType: "COMPARED_WITH", sourceObjectRef: "candidate:colchicine", targetObjectRef: "candidate:placebo" }),
    ]);
    expect(project.canonicalState?.decisionLedger).toHaveLength(1);
  });

  it.each([
    ["hypothesis", "La colchicine réduit la MVO.", change({ candidateRef: "candidate:hypothesis", proposedType: "HYPOTHESIS", content: "La colchicine réduit la MVO", sourceText: "La colchicine réduit la MVO.", studyRole: "DIRECTIONAL_HYPOTHESIS" }), "HYPOTHESIS"],
    ["endpoint role", "La MVO est le critère principal.", change({ candidateRef: "candidate:mvo", proposedType: "ENDPOINT", content: "MVO", sourceText: "La MVO est le critère principal.", studyRole: "PRIMARY_ENDPOINT" }), "ENDPOINT"],
  ])("preserves the %s as canonical scientific meaning", (_label, raw, proposed, expectedType) => {
    const project = adopt(contributionFor({ raw, changes: [proposed] }));
    expect(project.canonicalState?.objects).toEqual(expect.arrayContaining([
      expect.objectContaining({ objectType: expectedType, scientificRole: proposed.studyRole ?? null }),
    ]));
  });

  it("changes endpoint roles without replacing one scientific identity by another", () => {
    const initialRaw = "La taille de l'infarctus est le critère principal et la MVO est également mesurée.";
    const initial = adopt(contributionFor({ raw: initialRaw, changes: [
      change({ candidateRef: "endpoint:infarct-size", proposedType: "ENDPOINT", content: "Taille de l'infarctus", sourceText: initialRaw, studyRole: "PRIMARY_ENDPOINT" }),
      change({ candidateRef: "endpoint:mvo", proposedType: "ENDPOINT", content: "MVO", sourceText: initialRaw, studyRole: null }),
    ] }));
    const raw = "Non, la MVO devient le critère principal à la place de la taille de l'infarctus.";
    const correctedContribution = contributionFor({
      raw,
      current: initial,
      changes: [
        change({
          operation: "REPLACE",
          candidateRef: "candidate:infarct-role-clear",
          semanticIdentity: "endpoint:infarct-size",
          targetProjectRef: "endpoint:infarct-size",
          proposedType: "ENDPOINT",
          content: "Taille de l'infarctus",
          sourceText: raw,
          studyRole: null,
        }),
        change({
          operation: "REPLACE",
          candidateRef: "candidate:mvo-primary",
          semanticIdentity: "endpoint:mvo",
          targetProjectRef: "endpoint:mvo",
          proposedType: "ENDPOINT",
          content: "MVO",
          sourceText: raw,
          studyRole: "PRIMARY_ENDPOINT",
        }),
      ],
    });
    const corrected = adopt(correctedContribution, initial, "2026-08-24T09:02:00.000Z");
    const infarctVersions = corrected.canonicalState?.objects.filter((object) => object.objectId === "endpoint:infarct-size") ?? [];
    const mvoVersions = corrected.canonicalState?.objects.filter((object) => object.objectId === "endpoint:mvo") ?? [];
    expect(infarctVersions).toEqual([
      expect.objectContaining({ version: 1, content: "Taille de l'infarctus", scientificRole: "PRIMARY_ENDPOINT", actuality: "SUPERSEDED" }),
      expect.objectContaining({ version: 2, content: "Taille de l'infarctus", scientificRole: null, actuality: "CURRENT" }),
    ]);
    expect(mvoVersions).toEqual([
      expect.objectContaining({ version: 1, content: "MVO", scientificRole: null, actuality: "SUPERSEDED" }),
      expect.objectContaining({ version: 2, content: "MVO", scientificRole: "PRIMARY_ENDPOINT", actuality: "CURRENT" }),
    ]);
    expect(corrected.canonicalState?.decisionLedger).toHaveLength(2);
    expect(corrected.canonicalState?.versionHistory.map((version) => version.versionId)).toEqual([initial.versionId, corrected.versionId]);
  });

  it("blocks an implicit structural overwrite before creating a Human Decision", () => {
    const raw = "La taille de l'infarctus est le critère principal.";
    const initial = adopt(contributionFor({ raw, changes: [
      change({ candidateRef: "endpoint:infarct-size", proposedType: "ENDPOINT", content: "Taille de l'infarctus", sourceText: raw, studyRole: "PRIMARY_ENDPOINT" }),
    ] }));
    const conflictingRaw = "La MVO est aussi le critère principal.";
    const conflicting = contributionFor({ raw: conflictingRaw, current: initial, changes: [
      change({ candidateRef: "endpoint:mvo", proposedType: "ENDPOINT", content: "MVO", sourceText: conflictingRaw, studyRole: "PRIMARY_ENDPOINT" }),
    ] });
    const candidate = prepareResearchProjectContributionCandidate(conflicting, initial);
    expect(candidate.canonicalChangeSet).toMatchObject({ status: "BLOCKED_BY_STRUCTURAL_CONFLICT", conflicts: [expect.objectContaining({ code: "CONFLICTING_ADOPTED_STATE" })] });
    const before = JSON.stringify(initial);
    expect(() => adopt(conflicting, initial)).toThrow("PRJ_CONFLICTING_ADOPTED_STATE_REQUIRES_EXPLICIT_REPLACEMENT");
    expect(JSON.stringify(initial)).toBe(before);
  });

  it("stages an explicit MRI-to-biopsy supersession without mutating V1", () => {
    const initialRaw = "La méthode retenue est une IRM cardiaque.";
    const initial = adopt(contributionFor({ raw: initialRaw, changes: [change({
      candidateRef: "method:mri", proposedType: "ACQUISITION", content: "IRM cardiaque", sourceText: initialRaw,
    })] }));
    const frozenV1 = JSON.stringify(initial);
    const raw = "Remplacer l'IRM cardiaque par une biopsie myocardique.";
    const contribution = contributionFor({ raw, current: initial, changes: [change({
      operation: "REPLACE", targetProjectRef: "method:mri", candidateRef: "candidate:biopsy",
      semanticIdentity: "method:biopsy", proposedType: "ACQUISITION", content: "Biopsie myocardique", sourceText: raw,
    })] });
    const candidate = prepareResearchProjectContributionCandidate(contribution, initial);
    expect(candidate.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
    expect(candidate.canonicalChangeSet.objectChanges).toEqual([expect.objectContaining({
      operation: "REPLACE", objectId: "method:mri", previousVersionRef: "method:mri:version:1",
    })]);
    expect(candidate.humanReviewProjection.sections.flatMap(section => section.items)[0].content)
      .toContain("IRM cardiaque → Biopsie myocardique");
    expect(JSON.stringify(initial)).toBe(frozenV1);
    const next = confirmResearchProjectContribution({ contribution, current: initial, projectId: initial.projectId,
      authority, confirmedAt: "2026-10-06T10:00:00.000Z", reviewedProjection: candidate.humanReviewProjection });
    expect(next.revision).toBe(2);
    expect(next.canonicalState?.objects).toEqual(expect.arrayContaining([
      expect.objectContaining({ content: "IRM cardiaque", actuality: "SUPERSEDED", supersededByVersionRef: "method:mri:version:2" }),
      expect.objectContaining({ content: "Biopsie myocardique", actuality: "CURRENT", supersedesVersionRef: "method:mri:version:1" }),
    ]));
    expect(next.canonicalState?.versionHistory.map(version => version.versionId)).toEqual([initial.versionId, next.versionId]);
    expect(JSON.stringify(initial)).toBe(frozenV1);
  });

  it("represents one new user-chosen exclusive design as a reviewable update", () => {
    const initialRaw = "L'étude est monocentrique.";
    const initial = adopt(contributionFor({ raw: initialRaw, changes: [change({
      candidateRef: "design:single", proposedType: "STUDY_DESIGN", content: "Étude monocentrique", sourceText: initialRaw,
    })] }));
    const frozenV1 = JSON.stringify(initial);
    const raw = "L'étude sera désormais multicentrique.";
    const contribution = contributionFor({ raw, current: initial, changes: [change({
      candidateRef: "design:multi", proposedType: "STUDY_DESIGN", content: "Étude multicentrique", sourceText: raw,
    })] });
    const candidate = prepareResearchProjectContributionCandidate(contribution, initial);
    expect(candidate.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
    expect(candidate.humanReviewProjection.expectedChangeRefs).toHaveLength(1);
    expect(candidate.humanReviewProjection.sections.flatMap(section => section.items)[0].content)
      .toContain("monocentrique → Étude multicentrique");
    expect(candidate.projectWriteAuthorized).toBe(false);
    expect(JSON.stringify(initial)).toBe(frozenV1);
    const next = adopt(contribution, initial);
    expect(next.canonicalState?.objects.filter(object => object.actuality === "CURRENT").map(object => object.content))
      .toEqual(["Étude multicentrique"]);
    expect(JSON.stringify(initial)).toBe(frozenV1);
  });

  it("stages a natively bound Working Draft design replacement without treating preparation as assent", () => {
    const raw = "L'étude âge–ECV sera monocentrique.";
    const initial = adopt(contributionFor({ raw, changes: [change({ candidateRef: "design:single",
      proposedType: "STUDY_DESIGN", content: "Étude monocentrique", sourceText: raw })] }));
    const frozen = JSON.stringify(initial);
    const proposal = controlledStudyProposal("context:revision");
    Object.assign(proposal.atoms.find(atom => atom.ref === "design")!, {
      semanticKey: "design.multicenter", content: "Étude multicentrique", status: "NOXIA_PROPOSAL",
    });
    const proposalTurn = turn("noxia:design-revision", "NOXIA", "Proposition de conduite multicentrique de l'étude âge–ECV.");
    const selectionTurn = turn("user:prepare-revision", "USER", "Préparer les choix à examiner, sans les adopter.");
    const composition = acceptContextualStudyProposal(proposal, { contextDigest: proposal.contextDigest,
      sourceTurnRef: selectionTurn.turnId, sourceResponseRef: proposalTurn.turnId,
      sourceProject: { projectId: initial.projectId, versionId: initial.versionId, projectDigest: researchProjectOwnerDigest(initial) },
      applicableEvidenceRefs: [], sourceText: raw, scopedAtomRefs: ["design"] });
    const contribution = buildStudyProposalSelectionContribution({ composition, selectedAtomRefs: ["design"], selectedOptionRefs: [],
      project: initial, projectId: initial.projectId, conversationId: "conversation:design-revision",
      proposalTurn, selectionTurn, createdAt: selectionTurn.createdAt, preparingReview: true });
    expect(contribution.scientificContent.candidateObjects[0].epistemicBoundary.epistemicStatus).toBe("OWNER_CANDIDATE");
    const candidate = prepareResearchProjectContributionCandidate(contribution, initial);
    expect(candidate.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
    expect(candidate.projectWriteAuthorized).toBe(false);
    expect(candidate.canonicalChangeSet.objectChanges).toEqual([expect.objectContaining({ operation: "REPLACE",
      previousVersionRef: "design:single:version:1", candidate: expect.objectContaining({ content: "Étude multicentrique" }) })]);
    expect(candidate.humanReviewProjection.expectedChangeRefs).toHaveLength(1);
    expect(JSON.stringify(initial)).toBe(frozen);
    expect(candidate.humanReviewProjection.sections.flatMap(section => section.items)[0].transition).toMatchObject({
      current: "Étude monocentrique (rôle : aucun)", proposed: "Étude multicentrique (rôle : DESIGN)",
      effect: "SUPERSEDE", sourcePlan: "OWNER_CONTRIBUTION",
    });
    let confirmations = 0;
    const view = render(createElement(ContributionReview, { contribution, candidate, currentProject: initial, status: "PENDING",
      onConfirm: () => { confirmations++; }, onCorrect: () => undefined, onReject: () => undefined }));
    const transition = within(view.getByTestId("human-review-proposed-transition"));
    expect(transition.getByText("Actuel :")).toBeTruthy();
    expect(transition.getByText("Étude monocentrique (rôle : aucun)")).toBeTruthy();
    expect(transition.getByText("Proposé :")).toBeTruthy();
    expect(transition.getByText("Étude multicentrique (rôle : DESIGN)")).toBeTruthy();
    expect(transition.getByText("Remplacer l’état courant")).toBeTruthy();
    expect(transition.getByText("Proposition du propriétaire scientifique, à confirmer")).toBeTruthy();
    expect(confirmations).toBe(0);
    view.unmount();
    for (const removedRef of [composition.proposalRef, composition.digest]) {
      const unbound = canonicalizeScientificContribution({ ...contribution, scientificContent: { ...contribution.scientificContent,
        candidateObjects: contribution.scientificContent.candidateObjects.map(item => ({ ...item,
          evidenceRefs: item.evidenceRefs?.filter(ref => ref !== removedRef) })) } });
      expect(prepareResearchProjectContributionCandidate(unbound, initial).status).toBe("BLOCKED_BY_STRUCTURAL_CONFLICT");
    }
    const declined = rejectResearchProjectContribution({ contribution, current: initial, authority, rejectedAt: selectionTurn.createdAt });
    expect(declined.status).toBe("REJECTED");
    expect(JSON.stringify(initial)).toBe(frozen);
    const next = confirmResearchProjectContribution({ contribution, current: initial, projectId: initial.projectId,
      authority, confirmedAt: "2026-10-06T10:00:00.000Z", reviewedProjection: candidate.humanReviewProjection });
    const replacement = next.canonicalState!.objects.find(object => object.actuality === "CURRENT")!;
    expect(replacement).toMatchObject({ content: "Étude multicentrique", supersedesVersionRef: "design:single:version:1" });
    expect(next.canonicalState!.objects).toContainEqual(expect.objectContaining({ objectId: "design:single",
      actuality: "SUPERSEDED", supersededByVersionRef: replacement.objectVersionId }));
    expect(JSON.stringify(initial)).toBe(frozen);
  });

  it("retains unrelated additions alongside a source-bound design supersession", () => {
    const raw = "L'étude âge–ECV est monocentrique, avec une IRM cardiaque.";
    const initial = adopt(contributionFor({ raw, changes: [
      change({ candidateRef: "design:single", proposedType: "STUDY_DESIGN", content: "Étude monocentrique", sourceText: raw }),
      change({ candidateRef: "method:mri", proposedType: "ACQUISITION", content: "IRM cardiaque", sourceText: raw }),
    ] }));
    const frozen = JSON.stringify(initial);
    const revised = "L'étude devient multicentrique ; inclure des adultes sains de 20 à 89 ans et mesurer l'ECV myocardique en pourcentage.";
    const contribution = contributionFor({ raw: revised, current: initial, changes: [
      change({ candidateRef: "design:multi", proposedType: "STUDY_DESIGN", content: "Étude multicentrique", sourceText: revised }),
      change({ candidateRef: "population:adults", proposedType: "POPULATION", content: "Adultes sains de 20 à 89 ans", sourceText: revised }),
      change({ candidateRef: "measurement:ecv", proposedType: "MEASUREMENT", content: "ECV myocardique en pourcentage", sourceText: revised }),
    ] });
    const candidate = prepareResearchProjectContributionCandidate(contribution, initial);
    expect(candidate.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
    expect(candidate.canonicalChangeSet.objectChanges.map(change => change.operation).sort()).toEqual(["ADD", "ADD", "REPLACE"]);
    expect(candidate.humanReviewProjection.expectedChangeRefs).toHaveLength(3);
    expect(candidate.humanReviewProjection.coveredChangeRefs).toEqual(candidate.humanReviewProjection.expectedChangeRefs);
    expect(candidate.projectWriteAuthorized).toBe(false);
    const next = confirmResearchProjectContribution({ contribution, current: initial, projectId: initial.projectId,
      authority, confirmedAt: "2026-10-06T10:00:00.000Z", reviewedProjection: candidate.humanReviewProjection });
    const current = next.canonicalState!.objects.filter(object => object.actuality === "CURRENT");
    expect(current.map(object => object.content).sort()).toEqual([
      "Adultes sains de 20 à 89 ans", "ECV myocardique en pourcentage", "IRM cardiaque", "Étude multicentrique",
    ].sort());
    expect(current.find(object => object.objectId === "method:mri"))
      .toEqual(initial.canonicalState!.objects.find(object => object.objectId === "method:mri"));
    expect(JSON.stringify(initial)).toBe(frozen);
  });

  it("preserves V1 through V4 under successive explicit, source-bound human revisions", () => {
    const initialRaw = "IRM cardiaque, étude monocentrique, suivi 12 mois chez des adultes sains ; analyse de l'association âge et fibrose.";
    const initial = adopt(contributionFor({ raw: initialRaw, changes: [
      change({ candidateRef: "method:mri", proposedType: "ACQUISITION", content: "IRM cardiaque", sourceText: initialRaw }),
      change({ candidateRef: "design:centre", proposedType: "STUDY_DESIGN", content: "Étude monocentrique", sourceText: initialRaw }),
      change({ candidateRef: "timing:followup", proposedType: "VISIT", content: "Suivi : 12 mois", sourceText: initialRaw, studyRole: "FOLLOW_UP" }),
      change({ candidateRef: "population:healthy", proposedType: "POPULATION", content: "Adultes sains", sourceText: initialRaw }),
      change({ candidateRef: "analysis:age", proposedType: "ANALYSIS_SPECIFICATION", content: "Association entre âge et fibrose", sourceText: initialRaw }),
    ] }));
    const states = [initial];
    const frozen = [JSON.stringify(initial)];
    const unrelated = initial.canonicalState!.objects.filter(object => ["POPULATION", "ANALYSIS_SPECIFICATION"].includes(object.objectType));
    const steps = [
      { raw: "Remplacer l'IRM cardiaque par une biopsie myocardique.", target: "method:mri", type: "ACQUISITION", content: "Biopsie myocardique", role: null },
      { raw: "Remplacer le design monocentrique par multicentrique.", target: "design:centre", type: "STUDY_DESIGN", content: "Étude multicentrique", role: null },
      { raw: "Passer le suivi de 12 mois à 24 mois.", target: "timing:followup", type: "VISIT", content: "Suivi : 24 mois", role: "FOLLOW_UP" },
    ];
    for (const [index, step] of steps.entries()) {
      const current = states.at(-1)!;
      const contribution = contributionFor({ raw: step.raw, current, changes: [change({
        operation: "REPLACE", targetProjectRef: step.target, candidateRef: `revision:${index}`,
        proposedType: step.type, content: step.content, sourceText: step.raw, studyRole: step.role,
      })] });
      const review = prepareResearchProjectContributionCandidate(contribution, current);
      expect(review.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
      expect(review.canonicalChangeSet.conflicts).toEqual([]);
      expect(review.humanReviewProjection.expectedChangeRefs).toHaveLength(1);
      expect(review.projectWriteAuthorized).toBe(false);
      states.forEach((state, position) => expect(JSON.stringify(state)).toBe(frozen[position]));
      const next = confirmResearchProjectContribution({ contribution, current, projectId: initial.projectId, authority,
        confirmedAt: `2026-10-06T10:0${index + 1}:00.000Z`, reviewedProjection: review.humanReviewProjection });
      expect(next.revision).toBe(index + 2);
      for (const object of unrelated) expect(next.canonicalState!.objects.find(candidate => candidate.objectVersionId === object.objectVersionId)).toEqual(object);
      const currentObjects = next.canonicalState!.objects.filter(object => object.actuality === "CURRENT");
      expect(currentObjects).toContainEqual(expect.objectContaining({ content: "Biopsie myocardique" }));
      if (index >= 1) expect(currentObjects).toContainEqual(expect.objectContaining({ content: "Étude multicentrique" }));
      if (index < 1) expect(currentObjects).toContainEqual(expect.objectContaining({ content: "Étude monocentrique" }));
      expect(currentObjects).toContainEqual(expect.objectContaining({ objectId: "timing:followup", content: index === 2 ? "Suivi : 24 mois" : "Suivi : 12 mois" }));
      states.push(next); frozen.push(JSON.stringify(next));
    }
    expect(states.map(state => state.revision)).toEqual([1, 2, 3, 4]);
    expect(states.at(-1)!.canonicalState!.versionHistory.map(version => version.versionId)).toEqual(states.map(state => state.versionId));
    states.forEach((state, position) => expect(JSON.stringify(state)).toBe(frozen[position]));
  });

  it("does not choose between two new incompatible designs claiming an adopted owner", () => {
    const raw = "L'étude est observationnelle transversale.";
    const initial = adopt(contributionFor({ raw, changes: [change({ candidateRef: "design:initial", proposedType: "STUDY_DESIGN", content: raw, sourceText: raw })] }));
    const frozen = JSON.stringify(initial);
    const alternatives = "Deux options restent à arbitrer : étude longitudinale ou essai randomisé.";
    const proposal = contributionFor({ raw: alternatives, current: initial, changes: [
      change({ candidateRef: "design:longitudinal", proposedType: "STUDY_DESIGN", content: "Étude longitudinale", sourceText: alternatives }),
      change({ candidateRef: "design:randomized", proposedType: "STUDY_DESIGN", content: "Essai randomisé", sourceText: alternatives }),
    ] });
    expect(prepareResearchProjectContributionCandidate(proposal, initial).status).toBe("BLOCKED_BY_STRUCTURAL_CONFLICT");
    expect(() => adopt(proposal, initial)).toThrow("PRJ_CONFLICTING_ADOPTED_STATE_REQUIRES_EXPLICIT_REPLACEMENT");
    expect(JSON.stringify(initial)).toBe(frozen);
  });

  it("does not silently supersede MRI when the user merely discusses biopsy", () => {
    const raw = "L'IRM cardiaque est retenue.";
    const initial = adopt(contributionFor({ raw, changes: [change({ candidateRef: "method:mri", proposedType: "ACQUISITION", content: "IRM cardiaque", sourceText: raw })] }));
    const frozen = JSON.stringify(initial);
    const question = "La biopsie myocardique serait-elle une alternative ?";
    const conversation = { conversationId: "conversation:biopsy-discussion", language: "fr" as const, turns: [turn("turn:biopsy-question", "USER", question)] };
    const checked = validatePersistentProjectDelta({ changes: [], relations: [] }, question, initial, conversation);
    expect(contributionFromPersistentDelta({ candidate: checked.candidate!, conversation, currentProject: initial })).toBeNull();
    expect(JSON.stringify(initial)).toBe(frozen);
  });

  it("blocks two simultaneous explicit replacements of the same current scientific owner", () => {
    const raw = "L'étude est monocentrique.";
    const initial = adopt(contributionFor({ raw, changes: [change({ candidateRef: "design:centre",
      proposedType: "STUDY_DESIGN", content: raw, sourceText: raw })] }));
    const alternatives = "Conduite multicentrique ou dans un seul centre avec une deuxième plateforme : arbitrage requis.";
    const contribution = contributionFor({ raw: alternatives, current: initial, changes: [
      change({ operation: "REPLACE", targetProjectRef: "design:centre", candidateRef: "design:first",
        proposedType: "STUDY_DESIGN", content: "Étude multicentrique", sourceText: alternatives }),
      change({ operation: "REPLACE", targetProjectRef: "design:centre", candidateRef: "design:second",
        proposedType: "STUDY_DESIGN", content: "Étude monocentrique sur deux plateformes", sourceText: alternatives }),
    ] });
    const frozen = JSON.stringify(initial);
    expect(prepareResearchProjectContributionCandidate(contribution, initial).canonicalChangeSet).toMatchObject({
      status: "BLOCKED_BY_STRUCTURAL_CONFLICT", conflicts: [expect.objectContaining({ code: "CONFLICTING_ADOPTED_STATE" })],
    });
    expect(() => adopt(contribution, initial)).toThrow("PRJ_CONFLICTING_ADOPTED_STATE_REQUIRES_EXPLICIT_REPLACEMENT");
    expect(JSON.stringify(initial)).toBe(frozen);
  });

  it("keeps an unresolved relation endpoint blocked even in a legitimate design revision", () => {
    const raw = "L'étude sera monocentrique.";
    const initial = adopt(contributionFor({ raw, changes: [change({ candidateRef: "design:centre",
      proposedType: "STUDY_DESIGN", content: "Étude monocentrique", sourceText: raw })] }));
    const revised = "Remplacer le design monocentrique par multicentrique, chez des adultes sains.";
    const contribution = contributionFor({ raw: revised, current: initial, changes: [
      change({ candidateRef: "design:multi", proposedType: "STUDY_DESIGN", content: "Étude multicentrique", sourceText: revised }),
      change({ candidateRef: "population:healthy", proposedType: "POPULATION", content: "Adultes sains", sourceText: revised }),
    ] });
    const malformed = canonicalizeScientificContribution({ ...contribution, scientificContent: { ...contribution.scientificContent,
      candidateRelations: [{ relationId: "relation:design-population", relationType: "CONCERNS",
        sourceItemId: contribution.scientificContent.candidateObjects[0].itemId, targetItemId: "population:absent",
        polarity: "AFFIRMED", confidence: null, evidenceRefs: [],
        epistemicBoundary: contribution.scientificContent.candidateObjects[0].epistemicBoundary }] } });
    const frozen = JSON.stringify(initial);
    const candidate = prepareResearchProjectContributionCandidate(malformed, initial);
    expect(candidate.canonicalChangeSet.conflicts).toContainEqual(expect.objectContaining({ code: "PROJECT_RELATION_ENDPOINT_NOT_FOUND" }));
    expect(candidate.status).toBe("BLOCKED_BY_STRUCTURAL_CONFLICT");
    expect(() => adopt(malformed, initial)).toThrow("PRJ_CONFLICTING_ADOPTED_STATE_REQUIRES_EXPLICIT_REPLACEMENT");
    expect(JSON.stringify(initial)).toBe(frozen);
  });

  it.each([
    ["core design", "Étude observationnelle transversale.", "Étude longitudinale avec suivi répété."],
    ["centre setting", "Conduire cette étude dans un seul centre.", "Conduire cette étude dans plusieurs centres."],
  ])("stages a source-bound %s revision for explicit Review in Project v2", (_label, adoptedText, proposedText) => {
    // SUPERSEDED_CONTRACT: disagreement with adopted state alone is not a
    // contradiction. Current product decision permits a reviewed revision;
    // competing alternatives remain covered by the negative test above.
    const initial = adopt(contributionFor({ raw: adoptedText, changes: [
      change({ candidateRef: "design:adopted", proposedType: "STUDY_DESIGN", content: adoptedText, sourceText: adoptedText }),
    ] }));
    const proposal = contributionFor({ raw: proposedText, current: initial, changes: [
      change({ candidateRef: "design:competing", proposedType: "STUDY_DESIGN", content: proposedText, sourceText: proposedText }),
    ] });
    const candidate = prepareResearchProjectContributionCandidate(proposal, initial);
    expect(candidate.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
    expect(candidate.canonicalChangeSet.conflicts).toEqual([]);
    expect(candidate.canonicalChangeSet.objectChanges).toEqual([expect.objectContaining({
      operation: "REPLACE", previousVersionRef: "design:adopted:version:1",
    })]);
    const frozenV1 = JSON.stringify(initial);
    expect(candidate.projectWriteAuthorized).toBe(false);
    const next = confirmResearchProjectContribution({ contribution: proposal, current: initial,
      projectId: initial.projectId, authority, confirmedAt: "2026-10-06T10:00:00.000Z",
      reviewedProjection: candidate.humanReviewProjection });
    expect(next.revision).toBe(2);
    expect(next.canonicalState?.objects.filter(object => object.actuality === "CURRENT").map(object => object.content)).toEqual([proposedText]);
    expect(next.canonicalState?.objects).toContainEqual(expect.objectContaining({ content: adoptedText, actuality: "SUPERSEDED" }));
    expect(JSON.stringify(initial)).toBe(frozenV1);
  });

  it("keeps user-stated, user-adopted proposal and owner-supported provenance distinct", () => {
    const directRaw = "L'étude sera multicentrique.";
    const direct = adopt(contributionFor({ raw: directRaw, changes: [
      change({ candidateRef: "design:multicenter", proposedType: "STUDY_DESIGN", content: "Étude multicentrique", sourceText: directRaw }),
    ] }));
    expect(direct.canonicalState?.objects.at(-1)?.provenance).toMatchObject({ assertionKind: "USER_STATED", sourcePlan: "USER" });

    const proposalText = "Je vous propose une étude randomisée.";
    const adoptionRaw = "Oui, je retiens cette proposition.";
    const adoptedContribution = contributionFor({
      raw: adoptionRaw,
      turns: [turn("proposal:1", "NOXIA", proposalText), turn("adoption:1", "USER", adoptionRaw)],
      changes: [change({
        candidateRef: "design:randomized",
        proposedType: "STUDY_DESIGN",
        content: "Étude randomisée",
        sourceText: adoptionRaw,
        assertionKind: "USER_ADOPTED_PROPOSAL",
        epistemicStatus: "CONFIRMED_BY_USER",
        proposalSourceText: proposalText,
      })],
    });
    const adopted = adopt(adoptedContribution);
    expect(adopted.canonicalState?.objects.at(-1)?.provenance).toMatchObject({
      assertionKind: "USER_ADOPTED_PROPOSAL",
      proposalSourceTurnRefs: ["proposal:1"],
      adoptionSourceTurnRefs: ["adoption:1"],
    });

    const supportedRaw = "Selon la référence DOI 10.1000/example, la MVO est mesurée en IRM.";
    const supported = adopt(contributionFor({ raw: supportedRaw, changes: [change({
      candidateRef: "measurement:mvo",
      proposedType: "MEASUREMENT",
      content: "MVO mesurée en IRM",
      sourceText: supportedRaw,
      assertionKind: "OWNER_SUPPORTED",
      epistemicStatus: "SUPPORTED_CANDIDATE",
      evidenceRefs: ["doi:10.1000/example"],
    })] }));
    expect(supported.canonicalState?.objects.at(-1)?.provenance).toMatchObject({
      assertionKind: "OWNER_SUPPORTED",
      evidenceRefs: ["doi:10.1000/example"],
      evidenceQualification: "REFERENCES_PRESENT_NOT_VERIFIED",
    });
  });

  it("keeps rejection non-mutating and acceptance PRJ-owned", () => {
    const raw = "L'étude sera prospective.";
    const contribution = contributionFor({ raw, changes: [change({ candidateRef: "design:prospective", proposedType: "STUDY_DESIGN", content: "Étude prospective", sourceText: raw })] });
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    expect(candidate).toMatchObject({ projectWriteAuthorized: false });
    const decision = rejectResearchProjectContribution({ contribution, current: null, authority, rejectedAt: "2026-08-24T09:01:00.000Z" });
    expect(decision.status).toBe("REJECTED");
    const accepted = adopt(contribution);
    expect(accepted).toMatchObject({ owner: "RESEARCH_PROJECT", llmProjectWrites: 0, revision: 1 });
  });

  it("reloads the canonical aggregate and migrates an existing persisted projection deterministically", () => {
    const raw = "L'étude sera multicentrique.";
    const project = adopt(contributionFor({ raw, changes: [change({ candidateRef: "design:multicenter", proposedType: "STUDY_DESIGN", content: "Étude multicentrique", sourceText: raw })] }));
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => store.clear(),
      key: (index: number) => [...store.keys()][index] ?? null,
      get length() { return store.size; },
    } satisfies Storage;
    const session = { ...createFunctionalResetSession("2026-08-24T09:00:00.000Z"), project };
    persistFunctionalResetSession(storage, session);
    expect(loadFunctionalResetSession(storage).project).toEqual(project);

    const legacyProject = { ...project, canonicalState: undefined, canonicalBackboneStatus: undefined };
    // LEGACY_COMPATIBILITY: a real legacy representation has its own valid
    // owner digest, not the digest of the newer canonical bytes removed above.
    legacyProject.projectDigest = researchProjectOwnerDigest(legacyProject);
    persistFunctionalResetSession(storage, { ...session, project: legacyProject });
    const migrated = loadFunctionalResetSession(storage).project;
    expect(migrated?.canonicalState).toMatchObject({ owner: "RESEARCH_PROJECT", projectId: project.projectId });
    expect(migrated?.sections).toEqual(project.sections);
  });

  it("builds a deterministic read-only snapshot that survives transcript truncation and feeds QRY", () => {
    const raw = "L'étude sera multicentrique.";
    const project = adopt(contributionFor({ raw, changes: [change({ candidateRef: "design:multicenter", proposedType: "STUDY_DESIGN", content: "Étude multicentrique", sourceText: raw })] }));
    const snapshotA = buildProjectContextSnapshot({ project });
    const snapshotB = buildProjectContextSnapshot({ project });
    expect(snapshotA).toEqual(snapshotB);
    expect(snapshotA).toMatchObject({ readOnly: true, sourceProjectVersion: project.versionId, objects: [expect.objectContaining({ content: "Étude multicentrique" })] });

    const request: ProductBridgeRequest = {
      apiVersion: "1.0.0",
      conversation: { conversationId: "conversation:truncated", language: "fr", turns: [turn("user:latest", "USER", "Que manque-t-il encore ?")] },
      currentProject: project,
      evaluatePersistentDelta: false,
    };
    expect(naturalConversationContext(request)).toContain("Étude multicentrique");
    const navigation = buildFunctionalResetQueryNavigation({ project, recordedAt: "2026-08-24T09:02:00.000Z" });
    expect(navigation.projectVersion).toBe(project.versionId);
    expect(navigation.projectDigest).toBe(project.projectDigest);
  });

  it("does not turn a direct scientific question into Project truth", () => {
    const raw = "Quelles sont les limites d'une étude multicentrique ?";
    const conversation = { conversationId: "conversation:question", language: "fr" as const, turns: [turn("question:1", "USER", raw)] };
    const checked = validatePersistentProjectDelta({ changes: [], relations: [] }, raw, null, conversation);
    expect(checked).toMatchObject({ validation: { valid: true, acceptedChanges: [], acceptedRelations: [] } });
    expect(contributionFromPersistentDelta({ candidate: checked.candidate!, conversation, currentProject: null })).toBeNull();
  });
});

describe("PROJECT-SPINE-01R — persistent operation/reference alignment", () => {
  const projectWithImagingAndEndpoints = (includeMvo = true) => {
    const raw = includeMvo
      ? "Le projet prévoit une IRM, la taille de l'infarctus comme critère principal et une mesure de la MVO."
      : "Le projet prévoit une IRM et la taille de l'infarctus comme critère principal.";
    return adopt(contributionFor({
      raw,
      changes: [
        change({ candidateRef: "acquisition:irm", proposedType: "ACQUISITION", content: "Acquisition IRM", sourceText: raw }),
        change({ candidateRef: "endpoint:infarct-size", proposedType: "ENDPOINT", content: "Taille de l'infarctus", sourceText: raw, studyRole: "PRIMARY_ENDPOINT" }),
        ...(includeMvo ? [change({ candidateRef: "endpoint:mvo", proposedType: "ENDPOINT", content: "MVO", sourceText: raw, studyRole: null })] : []),
      ],
    }));
  };

  const endpointRoleSwap = (project: ResearchProjectOwnerProjection, addMvo: boolean) => {
    const raw = "Finalement, la MVO devient le critère principal à la place de la taille d'infarctus.";
    return contributionFor({
      raw,
      current: project,
      changes: [
        change({
          operation: "REPLACE",
          candidateRef: "role-change:infarct-size-clear",
          semanticIdentity: "endpoint:infarct-size",
          targetProjectRef: "endpoint:infarct-size",
          proposedType: "ENDPOINT",
          content: "Taille de l'infarctus",
          sourceText: raw,
          studyRole: null,
        }),
        change({
          operation: addMvo ? "ADD" : "REPLACE",
          candidateRef: "role-change:mvo-primary",
          semanticIdentity: addMvo ? "endpoint:mvo" : "endpoint:mvo",
          targetProjectRef: addMvo ? null : "endpoint:mvo",
          proposedType: "ENDPOINT",
          content: "MVO",
          sourceText: raw,
          studyRole: "PRIMARY_ENDPOINT",
        }),
      ],
    });
  };

  it("rejects using an existing contextual object as the target of ADD", () => {
    const project = projectWithImagingAndEndpoints();
    const raw = "L'IRM sera réalisée entre J3 et J5.";
    const checked = validatePersistentProjectDelta({ changes: [change({
      candidateRef: "temporal-anchor:invalid",
      proposedType: "TEMPORAL_WINDOW",
      content: "IRM entre J3 et J5",
      sourceText: raw,
      targetProjectRef: "acquisition:irm",
    })], relations: [] }, raw, project);
    expect(checked.validation.blocks).toEqual(["change:0:ADD_MUST_NOT_TARGET_EXISTING_REF"]);
  });

  it("accepts a role-only REPLACE even when content is unchanged", () => {
    const project = projectWithImagingAndEndpoints();
    const raw = "La MVO devient le critère principal.";
    const checked = validatePersistentProjectDelta({ changes: [change({
      operation: "REPLACE",
      candidateRef: "role-change:mvo-primary-only",
      semanticIdentity: "endpoint:mvo",
      targetProjectRef: "endpoint:mvo",
      proposedType: "ENDPOINT",
      content: "MVO",
      sourceText: raw,
      studyRole: "PRIMARY_ENDPOINT",
    })], relations: [] }, raw, project);
    expect(checked.validation).toMatchObject({ valid: true, blocks: [], noOps: [], acceptedChanges: [expect.any(Object)] });
  });

  it("swaps the primary role while preserving both scientific identities and their history", () => {
    const project = projectWithImagingAndEndpoints();
    const updated = adopt(endpointRoleSwap(project, false), project, "2026-08-24T09:04:00.000Z");
    const current = updated.canonicalState?.objects.filter((object) => object.actuality === "CURRENT") ?? [];
    expect(current).toEqual(expect.arrayContaining([
      expect.objectContaining({ objectId: "endpoint:infarct-size", content: "Taille de l'infarctus", scientificRole: null }),
      expect.objectContaining({ objectId: "endpoint:mvo", content: "MVO", scientificRole: "PRIMARY_ENDPOINT" }),
    ]));
    expect(updated.canonicalState?.objects.filter((object) => ["endpoint:infarct-size", "endpoint:mvo"].includes(object.objectId))).toHaveLength(4);
  });

  it("permits an explicit new primary endpoint when the old primary role is released in the same change set", () => {
    const project = projectWithImagingAndEndpoints(false);
    const candidate = prepareResearchProjectContributionCandidate(endpointRoleSwap(project, true), project);
    expect(candidate.canonicalChangeSet).toMatchObject({ status: "READY_FOR_HUMAN_DECISION", conflicts: [] });
    expect(candidate.canonicalChangeSet.objectChanges).toEqual(expect.arrayContaining([
      expect.objectContaining({ operation: "REPLACE", objectId: "endpoint:infarct-size", candidate: expect.objectContaining({ scientificRole: null }) }),
      expect.objectContaining({ operation: "ADD", objectId: "endpoint:mvo", candidate: expect.objectContaining({ scientificRole: "PRIMARY_ENDPOINT" }) }),
    ]));
  });

  it("rejects a mutation reference that is absent from the canonical Project", () => {
    const project = projectWithImagingAndEndpoints();
    const raw = "Retirer ce critère.";
    const checked = validatePersistentProjectDelta({ changes: [change({
      operation: "REMOVE",
      candidateRef: "remove:missing",
      semanticIdentity: "endpoint:missing",
      targetProjectRef: "endpoint:missing",
      proposedType: "ENDPOINT",
      content: "Critère absent",
      sourceText: raw,
    })], relations: [] }, raw, project);
    expect(checked.validation.blocks).toEqual(["change:0:PROJECT_REF_INVALID"]);
  });

  it("resolves a stable canonical ID even when the UI section projection is stale", () => {
    const project = projectWithImagingAndEndpoints();
    const staleProjection = {
      ...project,
      sections: project.sections.map((section) => ({
        ...section,
        elements: section.elements.filter((element) => element.elementId !== "endpoint:mvo"),
      })),
    };
    const raw = "La MVO devient le critère principal.";
    const checked = validatePersistentProjectDelta({ changes: [change({
      operation: "REPLACE",
      candidateRef: "role-change:canonical-over-projection",
      semanticIdentity: "endpoint:mvo",
      targetProjectRef: "endpoint:mvo",
      targetSectionId: "ANALYSIS",
      proposedType: "ENDPOINT",
      content: "MVO",
      sourceText: raw,
      studyRole: "PRIMARY_ENDPOINT",
    })], relations: [] }, raw, staleProjection);
    expect(checked.validation).toMatchObject({ valid: true, blocks: [], acceptedChanges: [expect.any(Object)] });
  });

  it("leaves Project and QRY-facing state unchanged before Human Decision for a pure question", () => {
    const project = projectWithImagingAndEndpoints();
    const before = JSON.stringify(project);
    const raw = "Pourquoi réaliser l'IRM entre J3 et J5 ?";
    const conversation = { conversationId: "conversation:methodology-question", language: "fr" as const, turns: [turn("question:methodology", "USER", raw)] };
    const checked = validatePersistentProjectDelta({ changes: [], relations: [] }, raw, project, conversation);
    expect(contributionFromPersistentDelta({ candidate: checked.candidate!, conversation, currentProject: project })).toBeNull();
    expect(JSON.stringify(project)).toBe(before);
  });
});

describe("PROJECT-SPINE-01R3 — PD-003 temporal runtime conformance", () => {
  const baseProject = () => {
    const raw = "Le projet prévoit une acquisition IRM, une variable troponine et une visite d'inclusion.";
    return adopt(contributionFor({ raw, changes: [
      change({ candidateRef: "acquisition:irm", proposedType: "ACQUISITION", content: "Acquisition IRM", sourceText: raw }),
      change({ candidateRef: "variable:troponin", proposedType: "CANONICAL_VARIABLE", content: "Troponine", sourceText: raw }),
      change({ candidateRef: "visit:inclusion", proposedType: "VISIT", content: "Visite d'inclusion", sourceText: raw }),
    ] }));
  };

  const unknownWindow = (lowerBound: number, upperBound: number): ScientificTemporalAnchorCandidate => ({
    kind: "WINDOW",
    direction: "AFTER",
    unit: "DAY",
    offset: null,
    lowerBound,
    upperBound,
    relativeEventLabel: null,
    tolerance: null,
    reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
  });

  const timepoint = (offset: number): ScientificTemporalAnchorCandidate => ({
    kind: "TIMEPOINT",
    direction: "AT",
    unit: "HOUR",
    offset,
    lowerBound: null,
    upperBound: null,
    relativeEventLabel: null,
    tolerance: null,
    reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
  });

  const temporalContribution = (input: {
    raw: string;
    project: ResearchProjectOwnerProjection;
    temporalQualifications?: ScientificTemporalQualificationCandidate[];
    expectedVariableOccasions?: ScientificExpectedVariableOccasionCandidate[];
  }) => {
    const extractionCarrier = contributionFor({
      raw: input.raw,
      current: input.project,
      changes: [change({
        candidateRef: `temporal-extraction:${input.raw}`,
        proposedType: "TEMPORAL_VALUE",
        targetSectionId: "TEMPORALITY",
        content: input.raw,
        sourceText: input.raw,
      })],
    });
    return {
      ...extractionCarrier,
      scientificContent: {
        ...extractionCarrier.scientificContent,
        temporalElements: [],
        temporalQualifications: input.temporalQualifications ?? [],
        expectedVariableOccasions: input.expectedVariableOccasions ?? [],
      },
    };
  };

  const acquisitionTiming = (
    project: ResearchProjectOwnerProjection,
    lowerBound: number,
    upperBound: number,
    operation: "ADD" | "REPLACE" = "ADD",
  ) => {
    const raw = operation === "ADD"
      ? "L’IRM sera réalisée entre J3 et J5."
      : "Finalement, l’IRM sera réalisée entre J4 et J6.";
    return temporalContribution({
      raw,
      project,
      temporalQualifications: [{
        operation,
        qualificationId: "temporal-qualification:irm-acquisition",
        subjectProjectRef: "acquisition:irm",
        temporalRole: "ACQUISITION_TIME",
        anchor: unknownWindow(lowerBound, upperBound),
        sourceText: raw,
        assertionKind: "USER_STATED",
        evidenceRefs: [],
      }],
    });
  };

  it("T1 — keeps TemporalAnchor as a value object, never a new canonical root", () => {
    const project = baseProject();
    const candidate = prepareResearchProjectContributionCandidate(acquisitionTiming(project, 3, 5), project);
    expect(CANONICAL_PROJECT_OBJECT_TYPES).not.toContain("TEMPORAL_ANCHOR");
    expect(candidate.canonicalChangeSet.objectChanges).toEqual([]);
    expect(candidate.canonicalChangeSet.legacyTemporalChanges).toEqual([]);
    expect(candidate.canonicalChangeSet.temporalQualificationChanges).toEqual([
      expect.objectContaining({ candidate: expect.objectContaining({ anchor: expect.objectContaining({ valueType: "TEMPORAL_ANCHOR_VALUE" }) }) }),
    ]);
  });

  it("T2 — qualifies the same MRI acquisition with J3–J5 and an explicit unknown reference", () => {
    const project = baseProject();
    const adopted = adopt(acquisitionTiming(project, 3, 5), project, "2026-08-24T09:02:00.000Z");
    expect(adopted.canonicalState?.objects.filter((object) => object.objectId === "acquisition:irm")).toHaveLength(1);
    expect(adopted.canonicalState?.objects.some((object) => (object.objectType as string) === "TEMPORAL_ANCHOR")).toBe(false);
    expect(adopted.canonicalState?.temporalQualifications).toEqual([
      expect.objectContaining({
        subjectProjectRef: "acquisition:irm",
        temporalRole: "ACQUISITION_TIME",
        anchor: expect.objectContaining({ lowerBound: 3, upperBound: 5, unit: "DAY", reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" } }),
      }),
    ]);
  });

  it("T3 — versions J3–J5 to J4–J6 under the same acquisition and qualification identities", () => {
    const project = baseProject();
    const first = adopt(acquisitionTiming(project, 3, 5), project, "2026-08-24T09:02:00.000Z");
    const corrected = adopt(acquisitionTiming(first, 4, 6, "REPLACE"), first, "2026-08-24T09:03:00.000Z");
    expect(corrected.canonicalState?.objects.filter((object) => object.objectId === "acquisition:irm")).toHaveLength(1);
    expect(corrected.canonicalState?.temporalQualifications).toEqual([
      expect.objectContaining({ qualificationId: "temporal-qualification:irm-acquisition", version: 1, actuality: "SUPERSEDED", anchor: expect.objectContaining({ lowerBound: 3, upperBound: 5 }) }),
      expect.objectContaining({ qualificationId: "temporal-qualification:irm-acquisition", version: 2, actuality: "CURRENT", anchor: expect.objectContaining({ lowerBound: 4, upperBound: 6 }) }),
    ]);
    expect(corrected.canonicalState?.decisionLedger.at(-1)?.temporalChanges).toEqual([
      expect.objectContaining({ previousVersionRef: "temporal-qualification:irm-acquisition:version:1", candidateAnchor: expect.objectContaining({ lowerBound: 4, upperBound: 6 }), resultingVersionRef: "temporal-qualification:irm-acquisition:version:2" }),
    ]);
  });

  it("rejects a colliding temporal ADD but accepts an explicit REPLACE of that same owner", () => {
    const initial = baseProject();
    const first = adopt(acquisitionTiming(initial, 3, 5), initial);
    const frozen = JSON.stringify(first);
    const collision = prepareResearchProjectContributionCandidate(acquisitionTiming(first, 4, 6, "ADD"), first);
    expect(collision.status).toBe("BLOCKED_BY_STRUCTURAL_CONFLICT");
    const revision = prepareResearchProjectContributionCandidate(acquisitionTiming(first, 4, 6, "REPLACE"), first);
    expect(revision.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
    expect(revision.canonicalChangeSet.temporalQualificationChanges[0].operation).toBe("REPLACE");
    expect(JSON.stringify(first)).toBe(frozen);
  });

  it("T4 — creates three expected occasions for one troponin CanonicalVariable", () => {
    const project = baseProject();
    const raw = "La troponine sera dosée à H0, H6 et H12.";
    const occasions = [0, 6, 12].map((offset): ScientificExpectedVariableOccasionCandidate => ({
      operation: "ADD",
      occasionId: `expected-occasion:troponin-h${offset}`,
      variableProjectRef: "variable:troponin",
      anchor: timepoint(offset),
      studyUnitOrGroupRef: null,
      applicableContext: null,
      sourceText: raw,
      assertionKind: "USER_STATED",
      evidenceRefs: [],
    }));
    const adopted = adopt(temporalContribution({ raw, project, expectedVariableOccasions: occasions }), project, "2026-08-24T09:02:00.000Z");
    expect(adopted.canonicalState?.objects.filter((object) => object.objectId === "variable:troponin")).toHaveLength(1);
    expect(adopted.canonicalState?.expectedVariableOccasions).toHaveLength(3);
    expect(adopted.canonicalState?.expectedVariableOccasions.every((occasion) => occasion.relationType === "EXPECTED_AT")).toBe(true);
  });

  it("T5 — enforces the EXPECTED_AT CanonicalVariable source contract", () => {
    const project = baseProject();
    const raw = "L'IRM est attendue à H6.";
    const candidate = prepareResearchProjectContributionCandidate(temporalContribution({
      raw,
      project,
      expectedVariableOccasions: [{
        operation: "ADD",
        occasionId: "expected-occasion:invalid-acquisition",
        variableProjectRef: "acquisition:irm",
        anchor: timepoint(6),
        studyUnitOrGroupRef: null,
        applicableContext: null,
        sourceText: raw,
        assertionKind: "USER_STATED",
        evidenceRefs: [],
      }],
    }), project);
    expect(candidate.canonicalChangeSet).toMatchObject({ status: "BLOCKED_BY_STRUCTURAL_CONFLICT", conflicts: [expect.objectContaining({ code: "EXPECTED_AT_SOURCE_NOT_CANONICAL_VARIABLE" })] });
  });

  it("T6 — emits ANCHORED_TO only when an actual Project reference is known", () => {
    const project = baseProject();
    const unknown = prepareResearchProjectContributionCandidate(acquisitionTiming(project, 3, 5), project);
    expect(unknown.canonicalChangeSet.temporalQualificationChanges[0]?.candidate?.anchor.reference).toEqual({ status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" });
    const raw = "L’IRM sera réalisée trois jours après la visite d'inclusion.";
    const knownAnchor: ScientificTemporalAnchorCandidate = {
      ...unknownWindow(3, 3),
      kind: "TIMEPOINT",
      offset: 3,
      lowerBound: null,
      upperBound: null,
      reference: { status: "KNOWN", referenceProjectRef: "visit:inclusion" },
    };
    const known = prepareResearchProjectContributionCandidate(temporalContribution({ raw, project, temporalQualifications: [{
      operation: "ADD",
      qualificationId: "temporal-qualification:irm-after-inclusion",
      subjectProjectRef: "acquisition:irm",
      temporalRole: "ACQUISITION_TIME",
      anchor: knownAnchor,
      sourceText: raw,
      assertionKind: "USER_STATED",
      evidenceRefs: [],
    }] }), project);
    expect(known.canonicalChangeSet.temporalQualificationChanges[0]?.candidate?.anchor.reference).toEqual({ status: "KNOWN", referenceProjectRef: "visit:inclusion", relationType: "ANCHORED_TO" });
  });

  it("T7 — preserves an unresolved reference across adoption", () => {
    const project = baseProject();
    const adopted = adopt(acquisitionTiming(project, 3, 5), project);
    expect(adopted.canonicalState?.temporalQualifications[0]?.anchor.reference).toEqual({ status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" });
  });

  it("T8 — does not turn a Visit into an occasion for every variable", () => {
    const project = baseProject();
    expect(project.canonicalState?.objects).toEqual(expect.arrayContaining([expect.objectContaining({ objectId: "visit:inclusion", objectType: "VISIT" })]));
    expect(project.canonicalState?.expectedVariableOccasions).toEqual([]);
  });

  it("T9 — temporal qualification does not mutate scientific content", () => {
    const project = baseProject();
    const before = project.canonicalState?.objects.find((object) => object.objectId === "acquisition:irm");
    const adopted = adopt(acquisitionTiming(project, 3, 5), project);
    expect(adopted.canonicalState?.objects.find((object) => object.objectId === "acquisition:irm")).toEqual(before);
  });

  it("T10 — keeps temporal changes candidate until Human Decision", () => {
    const project = baseProject();
    const before = JSON.stringify(project);
    const candidate = prepareResearchProjectContributionCandidate(acquisitionTiming(project, 3, 5), project);
    expect(candidate).toMatchObject({ projectWriteAuthorized: false, canonicalChangeSet: { status: "READY_FOR_HUMAN_DECISION" } });
    expect(JSON.stringify(project)).toBe(before);
  });

  it("T11 — rejects without changing Project", () => {
    const project = baseProject();
    const before = JSON.stringify(project);
    const decision = rejectResearchProjectContribution({ contribution: acquisitionTiming(project, 3, 5), current: project, authority, rejectedAt: "2026-08-24T09:02:00.000Z" });
    expect(decision.status).toBe("REJECTED");
    expect(JSON.stringify(project)).toBe(before);
  });

  it("T12 — reloads temporal values, unknowns, versions and ledger exactly", () => {
    const project = baseProject();
    const adopted = adopt(acquisitionTiming(project, 3, 5), project);
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => { store.set(key, value); },
      removeItem: (key: string) => { store.delete(key); },
      clear: () => store.clear(),
      key: (index: number) => [...store.keys()][index] ?? null,
      get length() { return store.size; },
    } satisfies Storage;
    persistFunctionalResetSession(storage, { ...createFunctionalResetSession(), project: adopted });
    expect(loadFunctionalResetSession(storage).project).toEqual(adopted);
  });

  it("T13 — serializes an exact deterministic Project Context Snapshot", () => {
    const project = baseProject();
    const adopted = adopt(acquisitionTiming(project, 3, 5), project);
    const snapshot = buildProjectContextSnapshot({ project: adopted });
    expect(snapshot.temporalQualifications).toEqual([
      expect.objectContaining({ subjectProjectRef: "acquisition:irm", temporalRole: "ACQUISITION_TIME", anchor: expect.objectContaining({ lowerBound: 3, upperBound: 5, reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" } }) }),
    ]);
    expect(snapshot).toEqual(buildProjectContextSnapshot({ project: adopted }));
  });

  it("T14 — preserves 01R non-destructive supersession", () => {
    const project = baseProject();
    const first = adopt(acquisitionTiming(project, 3, 5), project);
    const corrected = adopt(acquisitionTiming(first, 4, 6, "REPLACE"), first);
    expect(corrected.canonicalState?.temporalQualifications.map((qualification) => [qualification.version, qualification.actuality])).toEqual([[1, "SUPERSEDED"], [2, "CURRENT"]]);
  });

  it("T15 — creates no mutation for a question-only temporal turn", () => {
    const project = baseProject();
    const before = JSON.stringify(project);
    const raw = "Pourquoi l'IRM serait-elle réalisée entre J3 et J5 ?";
    const conversation = { conversationId: "conversation:temporal-question", language: "fr" as const, turns: [turn("question:temporal", "USER", raw)] };
    const checked = validatePersistentProjectDelta({ changes: [], relations: [] }, raw, project, conversation);
    expect(contributionFromPersistentDelta({ candidate: checked.candidate!, conversation, currentProject: project })).toBeNull();
    expect(JSON.stringify(project)).toBe(before);
  });
});
