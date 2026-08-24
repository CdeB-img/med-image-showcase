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
