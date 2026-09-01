import { describe, expect, it } from "vitest";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import {
  buildPersistentSourceCatalog,
  contributionFromPersistentDelta,
  materializePersistentSourceAnchors,
  validatePersistentProjectDelta,
  type PersistentProjectDeltaWireCandidate,
} from "@/features/protocol-designer/product-bridge";
import {
  confirmResearchProjectContribution,
  ensureCanonicalProjectState,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";

const PROJECT_ID = "research-project:p1-multi-intent-01";
const ACQUISITION_REF = "acquisition:irm-initial";
const IRM_TIMING_REF = "cand-temporal-irm-j7";
const FOLLOW_UP_REF = "cand-visite-suivi-clinique-6-mois";
const authority = {
  actorRef: "p1-multi-intent-01:researcher",
  mandateRef: "PROJECT_OWNER" as const,
  authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION" as const,
  verification: "DEMO_SESSION_NOT_AUTHENTICATED" as const,
};

const conversation = (raw: string, suffix: string): ScientificInterpretationConversation => ({
  conversationId: `conversation:p1-multi-intent-01:${suffix}`,
  language: "fr",
  turns: [{
    turnId: `turn:p1-multi-intent-01:${suffix}`,
    role: "USER",
    content: raw,
    createdAt: "2026-09-01T08:00:00.000Z",
  }],
});

const checkedContribution = (
  current: ResearchProjectOwnerProjection | null,
  raw: string,
  suffix: string,
  wire: PersistentProjectDeltaWireCandidate,
) => {
  const context = conversation(raw, suffix);
  const checked = validatePersistentProjectDelta(wire, raw, current, context);
  expect(checked.validation.blocks).toEqual([]);
  expect(checked.candidate).not.toBeNull();
  const contribution = contributionFromPersistentDelta({
    candidate: checked.candidate!,
    conversation: context,
    currentProject: current,
    createdAt: "2026-09-01T08:01:00.000Z",
  });
  expect(contribution).not.toBeNull();
  return contribution!;
};

const adopt = (
  contribution: ReturnType<typeof checkedContribution>,
  current: ResearchProjectOwnerProjection | null,
  minute: number,
) => confirmResearchProjectContribution({
  contribution,
  current,
  projectId: PROJECT_ID,
  authority,
  confirmedAt: `2026-09-01T08:${String(minute).padStart(2, "0")}:00.000Z`,
});

const acquisitionChange = (raw: string, ref = ACQUISITION_REF, content = "Acquisition IRM initiale") => ({
  operation: "ADD" as const,
  sourceText: raw,
  targetSectionId: "IMAGING" as const,
  candidateRef: ref,
  semanticIdentity: ref,
  proposedType: "ACQUISITION",
  content,
  polarity: "AFFIRMED" as const,
  epistemicStatus: "EXPLICIT_USER_STATED" as const,
  epistemicState: "KNOWN" as const,
  assertionKind: "USER_STATED" as const,
  evidenceRefs: [],
});

const temporalQualification = (input: {
  raw: string;
  operation: "ADD" | "REPLACE";
  qualificationId?: string;
  subjectProjectRef?: string;
  lowerBound: number;
  upperBound: number;
}) => ({
  operation: input.operation,
  qualificationId: input.qualificationId ?? IRM_TIMING_REF,
  sourceText: input.raw,
  subjectProjectRef: input.subjectProjectRef ?? ACQUISITION_REF,
  temporalRole: "ACQUISITION_TIME" as const,
  anchor: {
    kind: input.lowerBound === input.upperBound ? "TIMEPOINT" as const : "WINDOW" as const,
    direction: "AT" as const,
    unit: "DAY",
    offset: input.lowerBound === input.upperBound ? input.lowerBound : null,
    lowerBound: input.lowerBound,
    upperBound: input.upperBound,
    relativeEventLabel: null,
    tolerance: null,
    reference: { status: "UNKNOWN" as const, unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" as const },
  },
  assertionKind: "USER_STATED" as const,
  evidenceRefs: [],
});

const followUpChange = (raw: string, sourceText = raw) => ({
  operation: "ADD" as const,
  sourceText,
  targetSectionId: "TEMPORALITY" as const,
  candidateRef: FOLLOW_UP_REF,
  semanticIdentity: "VISIT:suivi clinique 6 mois",
  proposedType: "VISIT",
  content: "Suivi clinique à 6 mois",
  polarity: "AFFIRMED" as const,
  epistemicStatus: "EXPLICIT_USER_STATED" as const,
  epistemicState: "KNOWN" as const,
  assertionKind: "USER_STATED" as const,
  evidenceRefs: [],
});

const emptyWire = (): PersistentProjectDeltaWireCandidate => ({
  changes: [],
  relations: [],
  temporalQualifications: [],
  expectedVariableOccasions: [],
});

const projectWithInitialIrmAtDay7 = () => {
  const raw = "Une acquisition IRM initiale est prévue à J7.";
  const wire = emptyWire();
  wire.changes = [acquisitionChange(raw)];
  wire.temporalQualifications = [temporalQualification({ raw, operation: "ADD", lowerBound: 7, upperBound: 7 })];
  return adopt(checkedContribution(null, raw, "initial-j7", wire), null, 2);
};

const combinedCandidate = (raw: string) => {
  const wire = emptyWire();
  // Deliberately retain the broad FULL_TURN materialization observed in the
  // historical failure class: semantic isolation must not depend on ordering.
  wire.changes = [followUpChange(raw)];
  wire.temporalQualifications = [temporalQualification({ raw, operation: "REPLACE", lowerBound: 5, upperBound: 8 })];
  return wire;
};

const reviewText = (candidate: ReturnType<typeof prepareResearchProjectContributionCandidate>) => candidate.humanReviewProjection.sections
  .flatMap((section) => section.items.map((item) => item.content))
  .join("\n");

describe("P1-MULTI-INTENT-01 — semantic isolation", () => {
  it("keeps both explicit intent clauses available before Project contribution compilation", () => {
    const raw = "finalement je voudrais que l’IRM de J7 soit réalisée entre J5 et J8\net ajouter un suivi clinique à 6 mois";
    const context = conversation(raw, "source-catalog");
    const catalog = buildPersistentSourceCatalog(context);
    const irmClause = catalog.anchors.find((anchor) => anchor.exactText.includes("IRM de J7"));
    const followUpClause = catalog.anchors.find((anchor) => anchor.exactText.includes("suivi clinique à 6 mois") && anchor.fragmentKind !== "FULL_TURN");
    expect(irmClause).toBeDefined();
    expect(followUpClause).toBeDefined();

    const materialized = materializePersistentSourceAnchors({
      value: {
        changes: [{
          operation: "ADD",
          sourceAnchorId: followUpClause!.anchorId,
          targetSectionId: "TEMPORALITY",
          candidateRef: FOLLOW_UP_REF,
          semanticIdentity: "VISIT:suivi clinique 6 mois",
          proposedType: "VISIT",
          content: "Suivi clinique à 6 mois",
          polarity: "AFFIRMED",
          epistemicStatus: "EXPLICIT_USER_STATED",
          epistemicState: "KNOWN",
          assertionKind: "USER_STATED",
          evidenceRefs: [],
        }],
        relations: [],
        temporalQualifications: [{
          operation: "REPLACE",
          qualificationId: IRM_TIMING_REF,
          sourceAnchorId: irmClause!.anchorId,
          subjectProjectRef: ACQUISITION_REF,
          temporalRole: "ACQUISITION_TIME",
          anchor: {
            kind: "WINDOW",
            direction: "AT",
            unit: "DAY",
            offset: null,
            lowerBound: 5,
            upperBound: 8,
            relativeEventLabel: null,
            tolerance: null,
            reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
          },
          assertionKind: "USER_STATED",
          evidenceRefs: [],
        }],
        expectedVariableOccasions: [],
      },
      catalog,
      currentUserTurn: { turnId: context.turns[0]!.turnId, content: raw },
    });

    expect(materialized).toMatchObject({
      valid: true,
      blocks: [],
      value: {
        changes: [expect.objectContaining({
          candidateRef: FOLLOW_UP_REF,
          content: "Suivi clinique à 6 mois",
          sourceText: expect.stringContaining("suivi clinique à 6 mois"),
        })],
        temporalQualifications: [expect.objectContaining({
          qualificationId: IRM_TIMING_REF,
          sourceText: expect.stringContaining("IRM de J7"),
          anchor: expect.objectContaining({ lowerBound: 5, upperBound: 8 }),
        })],
      },
    });
  });

  it("A — keeps a single temporal correction bound to the existing acquisition", () => {
    const project = projectWithInitialIrmAtDay7();
    const raw = "Déplacer l’acquisition du jour 7 aux jours 5 à 8.";
    const wire = emptyWire();
    wire.temporalQualifications = [temporalQualification({ raw, operation: "REPLACE", lowerBound: 5, upperBound: 8 })];
    const candidate = prepareResearchProjectContributionCandidate(checkedContribution(project, raw, "single-correction", wire), project);

    expect(candidate.canonicalChangeSet.objectChanges).toEqual([]);
    expect(candidate.canonicalChangeSet.temporalQualificationChanges).toEqual([
      expect.objectContaining({
        operation: "REPLACE",
        qualificationId: IRM_TIMING_REF,
        candidate: expect.objectContaining({
          subjectProjectRef: ACQUISITION_REF,
          anchor: expect.objectContaining({ lowerBound: 5, upperBound: 8, unit: "DAY" }),
        }),
      }),
    ]);
  });

  it("B — represents a clinical follow-up at six months as the existing VISIT specialization", () => {
    const project = projectWithInitialIrmAtDay7();
    const raw = "Ajouter un suivi clinique à 6 mois.";
    const wire = emptyWire();
    wire.changes = [followUpChange(raw, "suivi clinique à 6 mois")];
    const candidate = prepareResearchProjectContributionCandidate(checkedContribution(project, raw, "single-follow-up", wire), project);

    expect(candidate.canonicalChangeSet.objectChanges).toEqual([
      expect.objectContaining({
        operation: "ADD",
        objectId: "VISIT:suivi clinique 6 mois",
        candidate: expect.objectContaining({ objectType: "VISIT", content: "Suivi clinique à 6 mois" }),
      }),
    ]);
    expect(reviewText(candidate)).toContain("Suivi clinique à 6 mois");
    expect(reviewText(candidate)).not.toMatch(/IRM de suivi|J5.?J8/iu);
  });

  it("C/G — preserves the exact witness as two independent changes through review and Project v2", () => {
    const project = projectWithInitialIrmAtDay7();
    const raw = "finalement je voudrais que l’IRM de J7 soit réalisée entre J5 et J8\net ajouter un suivi clinique à 6 mois";
    const contribution = checkedContribution(project, raw, "exact-witness", combinedCandidate(raw));
    const candidate = prepareResearchProjectContributionCandidate(contribution, project);
    const visible = reviewText(candidate);

    expect(candidate.canonicalChangeSet.objectChanges).toEqual([
      expect.objectContaining({
        operation: "ADD",
        objectId: "VISIT:suivi clinique 6 mois",
        candidate: expect.objectContaining({ objectType: "VISIT", content: "Suivi clinique à 6 mois" }),
      }),
    ]);
    expect(candidate.canonicalChangeSet.temporalQualificationChanges).toEqual([
      expect.objectContaining({ operation: "REPLACE", qualificationId: IRM_TIMING_REF }),
    ]);
    expect(visible).toContain("Suivi clinique à 6 mois");
    expect(visible).toMatch(/J7.*J5.*J8/isu);
    expect(visible).not.toMatch(/IRM de suivi\s*:\s*J5.?J8/iu);

    const adopted = adopt(contribution, project, 3);
    const state = ensureCanonicalProjectState(adopted);
    expect(adopted).toMatchObject({ revision: 2, previousVersionId: project.versionId, llmProjectWrites: 0 });
    expect(state.objects).toEqual(expect.arrayContaining([
      expect.objectContaining({
        objectId: "VISIT:suivi clinique 6 mois",
        objectType: "VISIT",
        content: "Suivi clinique à 6 mois",
        actuality: "CURRENT",
        provenance: expect.objectContaining({ sourceText: raw }),
      }),
    ]));
    expect(state.temporalQualifications).toEqual(expect.arrayContaining([
      expect.objectContaining({
        qualificationId: IRM_TIMING_REF,
        version: 2,
        actuality: "CURRENT",
        anchor: expect.objectContaining({ lowerBound: 5, upperBound: 8, unit: "DAY" }),
      }),
    ]));
    expect(state.objects.some((object) => object.actuality === "CURRENT" && /IRM de suivi\s*:\s*J5.?J8/iu.test(object.content))).toBe(false);
  });

  it("D — produces the same semantics when the independent clauses are reversed", () => {
    const project = projectWithInitialIrmAtDay7();
    const raw = "Ajouter un suivi clinique à 6 mois et déplacer l’IRM de J7 entre J5 et J8.";
    const candidate = prepareResearchProjectContributionCandidate(checkedContribution(project, raw, "reverse-order", combinedCandidate(raw)), project);

    expect(candidate.canonicalChangeSet.objectChanges[0]?.candidate).toMatchObject({ objectType: "VISIT", content: "Suivi clinique à 6 mois" });
    expect(candidate.canonicalChangeSet.temporalQualificationChanges[0]?.candidate?.anchor).toMatchObject({ lowerBound: 5, upperBound: 8 });
    expect(reviewText(candidate)).not.toMatch(/IRM de suivi\s*:\s*J5.?J8/iu);
  });

  it("E — preserves three independent changes without reusing another candidate payload", () => {
    const project = projectWithInitialIrmAtDay7();
    const raw = "Ajouter un suivi clinique à 6 mois, ajouter un objectif de surveillance de la tolérance et déplacer l’IRM de J7 entre J5 et J8.";
    const wire = combinedCandidate(raw);
    wire.changes.push({
      operation: "ADD",
      sourceText: raw,
      targetSectionId: "ANALYSIS",
      candidateRef: "candidate:objective:tolerance",
      semanticIdentity: "OBJECTIVE:surveillance-tolerance",
      proposedType: "OBJECTIVE",
      content: "Surveiller la tolérance",
      polarity: "AFFIRMED",
      epistemicStatus: "EXPLICIT_USER_STATED",
      epistemicState: "KNOWN",
      assertionKind: "USER_STATED",
      evidenceRefs: [],
    });
    const candidate = prepareResearchProjectContributionCandidate(checkedContribution(project, raw, "three-changes", wire), project);

    expect(candidate.canonicalChangeSet.objectChanges).toEqual(expect.arrayContaining([
      expect.objectContaining({ candidate: expect.objectContaining({ objectType: "VISIT", content: "Suivi clinique à 6 mois" }) }),
      expect.objectContaining({ candidate: expect.objectContaining({ objectType: "OBJECTIVE", content: "Surveiller la tolérance" }) }),
    ]));
    expect(candidate.canonicalChangeSet.temporalQualificationChanges).toHaveLength(1);
    expect(reviewText(candidate)).not.toMatch(/IRM de suivi\s*:\s*J5.?J8/iu);
  });

  it("F — keeps two temporal replacements attached to their respective acquisition subjects", () => {
    const initialRaw = "Les évaluations A et B sont prévues respectivement à J7 et J14.";
    const initial = emptyWire();
    initial.changes = [
      acquisitionChange(initialRaw, "acquisition:a", "Évaluation A"),
      acquisitionChange(initialRaw, "acquisition:b", "Évaluation B"),
    ];
    initial.temporalQualifications = [
      temporalQualification({ raw: initialRaw, operation: "ADD", qualificationId: "timing:a", subjectProjectRef: "acquisition:a", lowerBound: 7, upperBound: 7 }),
      temporalQualification({ raw: initialRaw, operation: "ADD", qualificationId: "timing:b", subjectProjectRef: "acquisition:b", lowerBound: 14, upperBound: 14 }),
    ];
    const project = adopt(checkedContribution(null, initialRaw, "two-subjects-initial", initial), null, 4);
    const raw = "Déplacer l’évaluation A entre J5 et J8 et l’évaluation B entre J12 et J16.";
    const wire = emptyWire();
    wire.temporalQualifications = [
      temporalQualification({ raw, operation: "REPLACE", qualificationId: "timing:a", subjectProjectRef: "acquisition:a", lowerBound: 5, upperBound: 8 }),
      temporalQualification({ raw, operation: "REPLACE", qualificationId: "timing:b", subjectProjectRef: "acquisition:b", lowerBound: 12, upperBound: 16 }),
    ];
    const candidate = prepareResearchProjectContributionCandidate(checkedContribution(project, raw, "two-subjects-replace", wire), project);

    expect(candidate.canonicalChangeSet.temporalQualificationChanges.map((change) => ({
      subject: change.candidate?.subjectProjectRef,
      lower: change.candidate?.anchor.lowerBound,
      upper: change.candidate?.anchor.upperBound,
    }))).toEqual([
      { subject: "acquisition:a", lower: 5, upper: 8 },
      { subject: "acquisition:b", lower: 12, upper: 16 },
    ]);
  });

  it("fails closed when an ADD identity and its content carry incompatible temporal payloads", () => {
    const project = projectWithInitialIrmAtDay7();
    const raw = "finalement je voudrais que l’IRM de J7 soit réalisée entre J5 et J8\net ajouter un suivi clinique à 6 mois";
    const wire = combinedCandidate(raw);
    wire.changes[0] = {
      ...wire.changes[0]!,
      content: "IRM de suivi : J5–J8",
    };
    const checked = validatePersistentProjectDelta(wire, raw, project, conversation(raw, "malformed-provider-candidate"));

    expect(checked.validation.blocks).toContain("change:0:CANDIDATE_IDENTITY_CONTENT_TEMPORAL_MISMATCH");
    expect(checked.candidate).toBeNull();
  });
});
