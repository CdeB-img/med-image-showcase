import { describe, expect, it } from "vitest";
import { buildPersistentDeltaPayload } from "../../../../../api/protocol-designer-bridge-provider";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import {
  PERSISTENT_DELTA_SYSTEM_INSTRUCTION,
  PERSISTENT_PROJECT_OBJECT_TYPES,
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentProjectDeltaChange,
  type PersistentTemporalQualification,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import {
  confirmResearchProjectContribution,
  ensureCanonicalProjectState,
  prepareResearchProjectContributionCandidate,
} from "@/features/research-project-construction";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation";

const METHOD_RAW = "La masse en grammes sera obtenue par segmentation et quantification, mais la procédure exacte reste à définir.";

const conversation = (raw: string): ScientificInterpretationConversation => ({
  conversationId: "conversation:hands-on-03r3",
  language: "fr",
  turns: [{ turnId: "turn:user", role: "USER", content: raw }],
});

const change = (
  sourceText: string,
  candidateRef: string,
  proposedType: string,
  content = sourceText,
  epistemicState: "KNOWN" | "ASSUMED" | "UNKNOWN" | "WITHHELD" = "KNOWN",
): PersistentProjectDeltaChange => ({
  operation: "ADD",
  sourceText,
  candidateRef,
  proposedType,
  content,
  polarity: "AFFIRMED",
  epistemicStatus: "EXPLICIT_USER_STATED",
  epistemicState,
  assertionKind: "USER_STATED",
  evidenceRefs: [],
});

const faithfulMethodChanges = (): PersistentProjectDeltaChange[] => [
  change("La masse en grammes", "variable:lesion-mass", "CANONICAL_VARIABLE", "Masse du tissu lésé en grammes"),
  change(
    "obtenue par segmentation et quantification, mais la procédure exacte reste à définir",
    "project-information:lesion-mass-method",
    "PROJECT_INFORMATION",
    "La masse du tissu lésé en grammes sera obtenue par segmentation et quantification ; la procédure exacte reste à définir",
    "UNKNOWN",
  ),
];

const validate = (
  raw = METHOD_RAW,
  changes = faithfulMethodChanges(),
  temporalQualifications: PersistentTemporalQualification[] = [],
) => validatePersistentProjectDelta({
  changes,
  relations: [],
  temporalQualifications,
  expectedVariableOccasions: [],
}, raw, null, conversation(raw));

const preparedMethodCandidate = () => {
  const checked = validate();
  const contribution = contributionFromPersistentDelta({
    candidate: checked.candidate!,
    conversation: conversation(METHOD_RAW),
    currentProject: null,
    createdAt: "2026-08-24T18:00:00.000Z",
  })!;
  return {
    contribution,
    prepared: prepareResearchProjectContributionCandidate(contribution, null),
  };
};

describe("PROJECT-HANDS-ON-03R3 — explicit measurement-procedure context", () => {
  it("M01 preserves the lesion quantity and its gram unit", () => {
    const checked = validate();
    expect(checked.candidate?.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ proposedType: "CANONICAL_VARIABLE", content: expect.stringMatching(/grammes/i) }),
    ]));
  });

  it("M02 preserves explicit segmentation and quantification context", () => {
    const checked = validate();
    expect(checked.candidate?.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ proposedType: "PROJECT_INFORMATION", content: expect.stringMatching(/segmentation.*quantification/i) }),
    ]));
  });

  it("M03 does not promote under-specified method context to AnalysisSpecification", () => {
    expect(validate().candidate?.changes.some((item) => item.proposedType === "ANALYSIS_SPECIFICATION")).toBe(false);
  });

  it("M04 does not invent an algorithm", () => {
    expect(JSON.stringify(validate().candidate)).not.toMatch(/algorithme|algorithm/i);
  });

  it("M05 does not invent manual or automatic execution", () => {
    expect(JSON.stringify(validate().candidate)).not.toMatch(/manuel|manual|automatique|automatic/i);
  });

  it("M06 exposes the existing Project Information type to Gemini", () => {
    const request: ProductBridgeRequest = {
      apiVersion: "1.0.0",
      conversation: conversation(METHOD_RAW),
      currentProject: null,
      evaluatePersistentDelta: true,
    };
    const proposedType = buildPersistentDeltaPayload(request).tools[0]!.functionDeclarations[0]!
      .parametersJsonSchema.properties.changes.items.properties.proposedType;
    expect(PERSISTENT_PROJECT_OBJECT_TYPES).toContain("PROJECT_INFORMATION");
    expect(proposedType.enum).toContain("PROJECT_INFORMATION");
  });

  it("M07 keeps the unresolved procedure epistemically UNKNOWN", () => {
    expect(validate().candidate?.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ proposedType: "PROJECT_INFORMATION", epistemicState: "UNKNOWN" }),
    ]));
  });

  it("M08 keeps explicit provenance separate from the unknown qualifier", () => {
    expect(validate().candidate?.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        proposedType: "PROJECT_INFORMATION",
        epistemicStatus: "EXPLICIT_USER_STATED",
        epistemicState: "UNKNOWN",
      }),
    ]));
  });

  it("M09 accepts zero relations for contextual co-occurrence", () => {
    expect(validate()).toMatchObject({ validation: { valid: true, blocks: [] }, candidate: { relations: [] } });
  });

  it("M10 does not fabricate OPERATIONALIZES", () => {
    expect(validate().candidate?.relations.some((item) => item.relationType === "OPERATIONALIZES")).toBe(false);
  });

  it("M11 does not fabricate CONSUMED_BY_ANALYSIS", () => {
    expect(JSON.stringify(validate().candidate)).not.toContain("CONSUMED_BY_ANALYSIS");
  });

  it("M12 shows segmentation and quantification in Human Review", () => {
    const review = preparedMethodCandidate().prepared.humanReviewProjection;
    expect(review.sections.flatMap((section) => section.items.map((item) => item.content)).join("\n"))
      .toMatch(/segmentation.*quantification/i);
  });

  it("M13 shows that the method remains unresolved in Human Review", () => {
    const review = preparedMethodCandidate().prepared.humanReviewProjection;
    expect(review.sections.flatMap((section) => section.items.map((item) => item.content)).join("\n"))
      .toMatch(/reste à définir.*précision encore requise/i);
  });

  it("M14 keeps literal user source anchoring", () => {
    const checked = validate();
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
    expect(METHOD_RAW.includes(checked.candidate!.changes[1]!.sourceText)).toBe(true);
  });

  it("M15 preserves the existing modality/acquisition distinction", () => {
    const raw = "Le scanner sera acquis pour cette mesure.";
    const checked = validate(raw, [
      change("scanner", "modality:ct", "IMAGING_MODALITY", "Scanner"),
      change("Le scanner sera acquis", "acquisition:ct", "ACQUISITION", "Acquisition scanner"),
    ]);
    expect(checked).toMatchObject({ validation: { valid: true, blocks: [] } });
    expect(checked.candidate?.changes.map((item) => item.proposedType)).toEqual(["IMAGING_MODALITY", "ACQUISITION"]);
  });

  it("M16 makes Project Information a bounded under-specification carrier", () => {
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).toContain("PROJECT_INFORMATION");
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).toContain("ne devient ni une méthode qualifiée");
  });

  it("M17 leaves QRY bound to the adopted Project version", () => {
    const { contribution } = preparedMethodCandidate();
    const project = confirmResearchProjectContribution({
      contribution,
      current: null,
      projectId: "project:hands-on-03r3",
      authority: {
        actorRef: "hands-on-03r3:researcher",
        mandateRef: "PROJECT_OWNER",
        authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION",
        verification: "DEMO_SESSION_NOT_AUTHENTICATED",
      },
      confirmedAt: "2026-08-24T18:01:00.000Z",
    });
    expect(buildFunctionalResetQueryNavigation({ project, recordedAt: "2026-08-24T18:02:00.000Z" }))
      .toMatchObject({ projectRef: project.projectId, projectVersion: project.versionId, projectDigest: project.projectDigest });
  });

  it("M18 preserves the typed temporal corridor", () => {
    const raw = "L’IRM sera réalisée entre J5 et J7 après l’induction de l’ischémie.";
    const temporal: PersistentTemporalQualification = {
      operation: "ADD",
      qualificationId: "timing:mri:j5-j7",
      sourceText: "entre J5 et J7 après l’induction de l’ischémie",
      subjectProjectRef: "acquisition:mri",
      temporalRole: "ACQUISITION_TIME",
      anchor: {
        kind: "WINDOW",
        direction: "AFTER",
        unit: "DAY",
        offset: null,
        lowerBound: 5,
        upperBound: 7,
        relativeEventLabel: "induction de l’ischémie",
        tolerance: null,
        reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
      },
      assertionKind: "USER_STATED",
      evidenceRefs: [],
    };
    expect(validate(raw, [change("L’IRM sera réalisée", "acquisition:mri", "ACQUISITION", "Acquisition IRM")], [temporal]))
      .toMatchObject({ validation: { valid: true, blocks: [] } });
  });

  it("M19 creates no Project write before Human Decision", () => {
    const { prepared } = preparedMethodCandidate();
    expect(prepared).toMatchObject({ status: "CANDIDATE_PENDING_HUMAN_CONFIRMATION", projectWriteAuthorized: false });
    expect(prepared.humanReviewProjection.status).toBe("COMPLETE");
  });

  it("M20 adopts and reloads Project Information without semantic loss", () => {
    const { contribution } = preparedMethodCandidate();
    const project = confirmResearchProjectContribution({
      contribution,
      current: null,
      projectId: "project:hands-on-03r3:reload",
      authority: {
        actorRef: "hands-on-03r3:researcher",
        mandateRef: "PROJECT_OWNER",
        authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION",
        verification: "DEMO_SESSION_NOT_AUTHENTICATED",
      },
      confirmedAt: "2026-08-24T18:03:00.000Z",
    });
    const reloaded = JSON.parse(JSON.stringify(project)) as typeof project;
    const state = ensureCanonicalProjectState(reloaded);
    expect(state.objects).toEqual(expect.arrayContaining([
      expect.objectContaining({
        objectType: "PROJECT_INFORMATION",
        content: expect.stringMatching(/segmentation.*quantification/i),
        epistemicState: "UNKNOWN",
      }),
    ]));
  });
});
