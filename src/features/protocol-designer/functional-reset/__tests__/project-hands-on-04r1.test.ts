import { describe, expect, it } from "vitest";
import { buildPersistentDeltaPayload } from "../../../../../api/protocol-designer-bridge-provider";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import {
  PERSISTENT_DELTA_SYSTEM_INSTRUCTION,
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  validatePersistentProviderContract,
  type PersistentProjectDeltaChange,
  type PersistentProjectDeltaWireCandidate,
  type PersistentTemporalQualification,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import {
  confirmResearchProjectContribution,
  ensureCanonicalProjectState,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";

const conversation = (
  raw: string,
  assistantQuestion?: string,
): ScientificInterpretationConversation => ({
  conversationId: "conversation:hands-on-04r1",
  language: "fr",
  turns: [
    ...(assistantQuestion ? [{ turnId: "turn:assistant", role: "NOXIA" as const, content: assistantQuestion }] : []),
    { turnId: "turn:user", role: "USER", content: raw },
  ],
});

const change = (
  sourceText: string,
  candidateRef: string,
  proposedType: string,
  content = sourceText,
): PersistentProjectDeltaChange => ({
  operation: "ADD",
  sourceText,
  candidateRef,
  proposedType,
  content,
  polarity: "AFFIRMED",
  epistemicStatus: "EXPLICIT_USER_STATED",
  epistemicState: "KNOWN",
  assertionKind: "USER_STATED",
  evidenceRefs: [],
});

const unknownWindow = (
  sourceText: string,
  subjectProjectRef: string,
): PersistentTemporalQualification => ({
  operation: "ADD",
  qualificationId: `timing:${subjectProjectRef}:j5-j7`,
  sourceText,
  subjectProjectRef,
  temporalRole: "ACQUISITION_TIME",
  anchor: {
    kind: "WINDOW",
    direction: "UNKNOWN",
    unit: "DAY",
    offset: null,
    lowerBound: 5,
    upperBound: 7,
    relativeEventLabel: null,
    tolerance: null,
    reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
  },
  assertionKind: "USER_STATED",
  evidenceRefs: [],
});

const unknownM3 = (
  sourceText: string,
  subjectProjectRef: string,
): PersistentTemporalQualification => ({
  operation: "ADD",
  qualificationId: `timing:${subjectProjectRef}:m3`,
  sourceText,
  subjectProjectRef,
  temporalRole: "ACQUISITION_TIME",
  anchor: {
    kind: "TIMEPOINT",
    direction: "UNKNOWN",
    unit: "MONTH",
    offset: 3,
    lowerBound: null,
    upperBound: null,
    relativeEventLabel: null,
    tolerance: null,
    reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
  },
  assertionKind: "USER_STATED",
  evidenceRefs: [],
});

const candidate = (
  changes: PersistentProjectDeltaChange[],
  temporalQualifications: PersistentTemporalQualification[],
): PersistentProjectDeltaWireCandidate => ({
  changes,
  relations: [],
  temporalQualifications,
  expectedVariableOccasions: [],
});

const checked = (input: {
  raw: string;
  changes: PersistentProjectDeltaChange[];
  temporalQualifications: PersistentTemporalQualification[];
  currentProject?: ResearchProjectOwnerProjection | null;
  assistantQuestion?: string;
}) => validatePersistentProjectDelta(
  candidate(input.changes, input.temporalQualifications),
  input.raw,
  input.currentProject ?? null,
  conversation(input.raw, input.assistantQuestion),
);

const adoptedContext = () => {
  const raw = "Le projet porte sur l'infarctus avec une acquisition IRM.";
  const result = checked({
    raw,
    changes: [
      change("l'infarctus", "condition:infarction", "CONDITION", "Infarctus"),
      change("une acquisition IRM", "acquisition:mri", "ACQUISITION", "Acquisition IRM"),
    ],
    temporalQualifications: [],
  });
  const contribution = contributionFromPersistentDelta({
    candidate: result.candidate!,
    conversation: conversation(raw),
    currentProject: null,
    createdAt: "2026-08-24T22:00:00.000Z",
  })!;
  return confirmResearchProjectContribution({
    contribution,
    current: null,
    projectId: "project:hands-on-04r1-context",
    authority: {
      actorRef: "hands-on-04r1:researcher",
      mandateRef: "PROJECT_OWNER",
      authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION",
      verification: "DEMO_SESSION_NOT_AUTHENTICATED",
    },
    confirmedAt: "2026-08-24T22:01:00.000Z",
  });
};

describe("PROJECT-HANDS-ON-04R1 — source-grounded temporal references", () => {
  it("T01 preserves an explicit J5-J7 window with an UNKNOWN reference", () => {
    const raw = "Une IRM est prévue à J5-J7.";
    const result = checked({
      raw,
      changes: [change("Une IRM est prévue", "acquisition:mri", "ACQUISITION", "Acquisition IRM")],
      temporalQualifications: [unknownWindow("J5-J7", "acquisition:mri")],
    });
    expect(result).toMatchObject({ validation: { valid: true, blocks: [] } });
    expect(result.candidate?.temporalQualifications[0]?.anchor).toMatchObject({
      lowerBound: 5,
      upperBound: 7,
      reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
    });
  });

  it("T02 preserves an explicit M3 timepoint with an UNKNOWN reference", () => {
    const raw = "Une IRM de suivi est prévue à M3.";
    const result = checked({
      raw,
      changes: [change("Une IRM de suivi est prévue", "acquisition:mri-followup", "ACQUISITION", "IRM de suivi")],
      temporalQualifications: [unknownM3("M3", "acquisition:mri-followup")],
    });
    expect(result).toMatchObject({ validation: { valid: true, blocks: [] } });
    expect(result.candidate?.temporalQualifications[0]?.anchor).toMatchObject({
      offset: 3,
      unit: "MONTH",
      reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
    });
  });

  it("T03 makes null the only live-provider label for an UNKNOWN reference", () => {
    const raw = "Une IRM est prévue à J5-J7.";
    const base = unknownWindow("J5-J7", "acquisition:mri");
    const unsafe = candidate(
      [change("Une IRM est prévue", "acquisition:mri", "ACQUISITION", "Acquisition IRM")],
      [{ ...base, anchor: { ...base.anchor!, relativeEventLabel: "conventional event" } }],
    );
    expect(validatePersistentProviderContract(unsafe)).toMatchObject({
      valid: false,
      blocks: ["temporalQualification:0:UNKNOWN_TEMPORAL_REFERENCE_REQUIRES_NULL_LABEL"],
    });
    const request: ProductBridgeRequest = {
      apiVersion: "1.0.0",
      conversation: conversation(raw),
      currentProject: null,
      evaluatePersistentDelta: true,
    };
    const anchorSchema = buildPersistentDeltaPayload(request).tools[0]!.functionDeclarations[0]!
      .parametersJsonSchema.properties.temporalQualifications.items.properties.anchor.anyOf[0] as {
        properties: { relativeEventLabel: { description: string } };
        required: readonly string[];
      };
    expect(anchorSchema.properties.relativeEventLabel.description).toContain("MUST be null whenever reference.status is UNKNOWN");
    expect(anchorSchema.required).toContain("relativeEventLabel");
  });

  it("T04 preserves an explicit event reference through a same-turn candidateRef", () => {
    const raw = "Une IRM sera réalisée cinq jours après l'infarctus.";
    const temporal: PersistentTemporalQualification = {
      operation: "ADD",
      qualificationId: "timing:mri:after-infarction",
      sourceText: "cinq jours après l'infarctus",
      subjectProjectRef: "acquisition:mri",
      temporalRole: "ACQUISITION_TIME",
      anchor: {
        kind: "RELATIVE_EVENT",
        direction: "AFTER",
        unit: "DAY",
        offset: 5,
        lowerBound: null,
        upperBound: null,
        relativeEventLabel: "infarctus",
        tolerance: null,
        reference: { status: "KNOWN", referenceProjectRef: "condition:infarction" },
      },
      assertionKind: "USER_STATED",
      evidenceRefs: [],
    };
    const result = checked({
      raw,
      changes: [
        change("Une IRM sera réalisée", "acquisition:mri", "ACQUISITION", "Acquisition IRM"),
        change("l'infarctus", "condition:infarction", "CONDITION", "Infarctus"),
      ],
      temporalQualifications: [temporal],
    });
    expect(result).toMatchObject({ validation: { valid: true, blocks: [] } });
    expect(validatePersistentProviderContract(candidate(result.candidate!.changes, result.candidate!.temporalQualifications))).toEqual({ valid: true, blocks: [] });
  });

  it("T05 resolves an elliptical answer only to a stable contextual Project reference", () => {
    const project = adoptedContext();
    const state = ensureCanonicalProjectState(project);
    const condition = state.objects.find((item) => item.objectType === "CONDITION" && item.actuality === "CURRENT")!;
    const acquisition = state.objects.find((item) => item.objectType === "ACQUISITION" && item.actuality === "CURRENT")!;
    const raw = "J5-J7";
    const base = unknownWindow(raw, acquisition.objectId);
    const temporal: PersistentTemporalQualification = {
      ...base,
      anchor: {
        ...base.anchor!,
        direction: "AFTER",
        relativeEventLabel: "infarctus",
        reference: { status: "KNOWN", referenceProjectRef: condition.objectId },
      },
    };
    const result = checked({
      raw,
      changes: [],
      temporalQualifications: [temporal],
      currentProject: project,
      assistantQuestion: "À quel délai après l'infarctus l'IRM est-elle prévue ?",
    });
    expect(result).toMatchObject({ validation: { valid: true, blocks: [] } });
    expect(result.candidate?.temporalQualifications[0]?.anchor?.reference).toEqual({
      status: "KNOWN",
      referenceProjectRef: condition.objectId,
    });
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).toContain("réponse elliptique à une question temporelle");
  });

  it("T06 rejects an automatic J0 label at the provider boundary", () => {
    const base = unknownWindow("IRM J5-J7", "acquisition:mri");
    const unsafe = candidate(
      [change("IRM J5-J7", "acquisition:mri", "ACQUISITION", "Acquisition IRM")],
      [{ ...base, anchor: { ...base.anchor!, relativeEventLabel: "J0" } }],
    );
    expect(validatePersistentProviderContract(unsafe).blocks).toContain("temporalQualification:0:UNKNOWN_TEMPORAL_REFERENCE_REQUIRES_NULL_LABEL");
  });

  it("T07 rejects an automatic M0 label at the provider boundary", () => {
    const base = unknownM3("IRM M3", "acquisition:mri");
    const unsafe = candidate(
      [change("IRM M3", "acquisition:mri", "ACQUISITION", "Acquisition IRM")],
      [{ ...base, anchor: { ...base.anchor!, relativeEventLabel: "M0" } }],
    );
    expect(validatePersistentProviderContract(unsafe).blocks).toContain("temporalQualification:0:UNKNOWN_TEMPORAL_REFERENCE_REQUIRES_NULL_LABEL");
  });

  it("T08 shows the timepoint and unresolved reference in complete Human Review", () => {
    const raw = "Une IRM est prévue à J5-J7.";
    const result = checked({
      raw,
      changes: [change("Une IRM est prévue", "acquisition:mri", "ACQUISITION", "Acquisition IRM")],
      temporalQualifications: [unknownWindow("J5-J7", "acquisition:mri")],
    });
    const contribution = contributionFromPersistentDelta({
      candidate: result.candidate!,
      conversation: conversation(raw),
      currentProject: null,
      createdAt: "2026-08-24T22:02:00.000Z",
    })!;
    const prepared = prepareResearchProjectContributionCandidate(contribution, null);
    const reviewText = prepared.humanReviewProjection.sections.flatMap((section) => section.items.map((item) => item.content)).join("\n");
    expect(prepared.humanReviewProjection).toMatchObject({ status: "COMPLETE", missingChangeRefs: [] });
    expect(reviewText).toMatch(/5 à 7 jours.*référentiel à préciser/i);
  });

  it("T09 preserves the UNKNOWN temporal reference after adoption and reload", () => {
    const raw = "Une IRM de suivi est prévue à M3.";
    const result = checked({
      raw,
      changes: [change("Une IRM de suivi est prévue", "acquisition:mri-followup", "ACQUISITION", "IRM de suivi")],
      temporalQualifications: [unknownM3("M3", "acquisition:mri-followup")],
    });
    const contribution = contributionFromPersistentDelta({
      candidate: result.candidate!,
      conversation: conversation(raw),
      currentProject: null,
      createdAt: "2026-08-24T22:03:00.000Z",
    })!;
    const adopted = confirmResearchProjectContribution({
      contribution,
      current: null,
      projectId: "project:hands-on-04r1-reload",
      authority: {
        actorRef: "hands-on-04r1:researcher",
        mandateRef: "PROJECT_OWNER",
        authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION",
        verification: "DEMO_SESSION_NOT_AUTHENTICATED",
      },
      confirmedAt: "2026-08-24T22:04:00.000Z",
    });
    const reloaded = JSON.parse(JSON.stringify(adopted)) as typeof adopted;
    expect(ensureCanonicalProjectState(reloaded).temporalQualifications[0]?.anchor).toMatchObject({
      offset: 3,
      relativeEventLabel: null,
      reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
    });
  });

  it("T10 preserves the 03/03R1/03R2 typed temporal corridor", () => {
    const raw = "Une IRM initiale est prévue à J5-J7 et une IRM de suivi à M3.";
    const result = checked({
      raw,
      changes: [
        change("Une IRM initiale est prévue", "acquisition:mri-initial", "ACQUISITION", "IRM initiale"),
        change("une IRM de suivi", "acquisition:mri-followup", "ACQUISITION", "IRM de suivi"),
      ],
      temporalQualifications: [
        unknownWindow("J5-J7", "acquisition:mri-initial"),
        unknownM3("M3", "acquisition:mri-followup"),
      ],
    });
    expect(result).toMatchObject({ validation: { valid: true, blocks: [], normalizations: [] } });
    expect(result.candidate?.temporalQualifications).toHaveLength(2);
  });
});
