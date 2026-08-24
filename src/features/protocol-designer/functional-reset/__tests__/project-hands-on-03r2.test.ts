import { describe, expect, it } from "vitest";
import { buildPersistentDeltaPayload } from "../../../../../api/protocol-designer-bridge-provider";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import {
  PERSISTENT_DELTA_SYSTEM_INSTRUCTION,
  PERSISTENT_PROJECT_RELATION_TYPES,
  contributionFromPersistentDelta,
  validatePersistentProjectDelta,
  type PersistentProjectDeltaChange,
  type PersistentProjectRelation,
  type PersistentTemporalQualification,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import {
  confirmResearchProjectContribution,
  ensureCanonicalProjectState,
  prepareResearchProjectContributionCandidate,
  type ResearchProjectOwnerProjection,
} from "@/features/research-project-construction";
import { buildFunctionalResetQueryNavigation } from "@/features/query-navigation";

const conversation = (raw: string): ScientificInterpretationConversation => ({
  conversationId: "conversation:hands-on-03r2",
  language: "fr",
  turns: [{ turnId: "turn:user", role: "USER", content: raw }],
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

const relation = (
  sourceText: string,
  relationType: string,
  sourceObjectRef: string,
  targetObjectRef: string,
): PersistentProjectRelation => ({
  relationRef: `relation:${relationType}:${sourceObjectRef}:${targetObjectRef}`,
  sourceText,
  relationType,
  sourceObjectRef,
  targetObjectRef,
  polarity: "AFFIRMED",
  epistemicStatus: "EXPLICIT_USER_STATED",
  epistemicState: "KNOWN",
  assertionKind: "USER_STATED",
  evidenceRefs: [],
});

const validate = (input: {
  raw: string;
  changes: PersistentProjectDeltaChange[];
  relations?: PersistentProjectRelation[];
  temporalQualifications?: PersistentTemporalQualification[];
  project?: ResearchProjectOwnerProjection | null;
}) => validatePersistentProjectDelta({
  changes: input.changes,
  relations: input.relations ?? [],
  temporalQualifications: input.temporalQualifications ?? [],
  expectedVariableOccasions: [],
}, input.raw, input.project ?? null, conversation(input.raw));

const adoptedVariableAndNeed = () => {
  const raw = "La masse lésionnelle couvrira le besoin de quantification.";
  const checked = validate({
    raw,
    changes: [
      change("masse lésionnelle", "variable:lesion-mass", "CANONICAL_VARIABLE", "Masse lésionnelle"),
      change("besoin de quantification", "need:quantification", "DATA_NEED", "Quantification lésionnelle"),
    ],
  });
  const contribution = contributionFromPersistentDelta({
    candidate: checked.candidate!,
    conversation: conversation(raw),
    currentProject: null,
    createdAt: "2026-08-24T15:00:00.000Z",
  })!;
  return confirmResearchProjectContribution({
    contribution,
    current: null,
    projectId: "project:hands-on-03r2",
    authority: {
      actorRef: "hands-on-03r2:researcher",
      mandateRef: "PROJECT_OWNER",
      authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION",
      verification: "DEMO_SESSION_NOT_AUTHENTICATED",
    },
    confirmedAt: "2026-08-24T15:01:00.000Z",
  });
};

describe("PROJECT-HANDS-ON-03R2 — canonical relation signatures", () => {
  it("R01 accepts CANONICAL_VARIABLE -> OPERATIONALIZES -> DATA_NEED", () => {
    const raw = "La masse lésionnelle opérationnalise le besoin de quantification.";
    const checked = validate({ raw, changes: [
      change("masse lésionnelle", "variable:mass", "CANONICAL_VARIABLE"),
      change("besoin de quantification", "need:mass", "DATA_NEED"),
    ], relations: [relation(raw, "OPERATIONALIZES", "variable:mass", "need:mass")] });
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
  });

  it("R02 accepts ACQUISITION -> OPERATIONALIZES -> DATA_NEED", () => {
    const raw = "L’acquisition IRM opérationnalise le besoin de composition.";
    const checked = validate({ raw, changes: [
      change("acquisition IRM", "acquisition:mri", "ACQUISITION"),
      change("besoin de composition", "need:composition", "DATA_NEED"),
    ], relations: [relation(raw, "OPERATIONALIZES", "acquisition:mri", "need:composition")] });
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
  });

  it("R03 replays historical C and still rejects ANALYSIS_SPECIFICATION -> OPERATIONALIZES -> CANONICAL_VARIABLE", () => {
    const raw = "La sortie à conserver sera la masse des lésions en grammes, obtenue après une segmentation dont la méthode reste à définir.";
    const checked = validate({ raw, changes: [
      change("la masse des lésions en grammes", "var_lesion_mass", "CANONICAL_VARIABLE"),
      change("une segmentation dont la méthode reste à définir", "spec_segmentation_tbd", "ANALYSIS_SPECIFICATION"),
    ], relations: [relation(
      "obtenue après une segmentation dont la méthode reste à définir",
      "OPERATIONALIZES",
      "spec_segmentation_tbd",
      "var_lesion_mass",
    )] });
    expect(checked.validation.blocks).toContain("relation:0:PROJECT_RELATION_ENDPOINT_TYPE_MISMATCH");
    expect(checked.candidate).toBeNull();
  });

  it("R04 accepts CANONICAL_VARIABLE -> COVERS_DATA_NEED -> DATA_NEED", () => {
    const raw = "La variable couvre le besoin de mesure.";
    const checked = validate({ raw, changes: [
      change("variable", "variable:measure", "CANONICAL_VARIABLE"),
      change("besoin de mesure", "need:measure", "DATA_NEED"),
    ], relations: [relation(raw, "COVERS_DATA_NEED", "variable:measure", "need:measure")] });
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
  });

  it("R05 records CONSUMED_BY_ANALYSIS as unavailable in the provider/compiler subset", () => {
    expect(PERSISTENT_PROJECT_RELATION_TYPES).not.toContain("CONSUMED_BY_ANALYSIS");
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).toContain("CONSUMED_BY_ANALYSIS est une relation canonique mais n'est pas disponible");
  });

  it("R06 rejects a reversed directed signature", () => {
    const raw = "Le besoin est couvert par la variable.";
    const checked = validate({ raw, changes: [
      change("besoin", "need:measure", "DATA_NEED"),
      change("variable", "variable:measure", "CANONICAL_VARIABLE"),
    ], relations: [relation(raw, "COVERS_DATA_NEED", "need:measure", "variable:measure")] });
    expect(checked.validation.blocks).toContain("relation:0:PROJECT_RELATION_ENDPOINT_TYPE_MISMATCH");
  });

  it("R07 rejects a valid relation name with an invalid source type", () => {
    const raw = "La population opérationnalise le besoin.";
    const checked = validate({ raw, changes: [
      change("population", "population:study", "POPULATION"),
      change("besoin", "need:measure", "DATA_NEED"),
    ], relations: [relation(raw, "OPERATIONALIZES", "population:study", "need:measure")] });
    expect(checked.validation.blocks).toContain("relation:0:PROJECT_RELATION_ENDPOINT_TYPE_MISMATCH");
  });

  it("R08 rejects a valid relation name with an invalid target type", () => {
    const raw = "La variable opérationnalise l’analyse.";
    const checked = validate({ raw, changes: [
      change("variable", "variable:measure", "CANONICAL_VARIABLE"),
      change("analyse", "analysis:plan", "ANALYSIS_SPECIFICATION"),
    ], relations: [relation(raw, "OPERATIONALIZES", "variable:measure", "analysis:plan")] });
    expect(checked.validation.blocks).toContain("relation:0:PROJECT_RELATION_ENDPOINT_TYPE_MISMATCH");
  });

  it("R09 does not require a relation for co-occurring explicit objects", () => {
    const raw = "La masse sera calculée après segmentation.";
    const checked = validate({ raw, changes: [
      change("masse", "variable:mass", "CANONICAL_VARIABLE"),
      change("segmentation", "constraint:segmentation", "CONSTRAINT", "Segmentation, méthode non établie"),
    ] });
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
    expect(checked.candidate?.relations).toEqual([]);
  });

  it("R10 instructs Gemini to omit an optional unsupported relation while preserving objects", () => {
    const request: ProductBridgeRequest = {
      apiVersion: "1.0.0",
      conversation: conversation("Une variable et une analyse sont mentionnées."),
      currentProject: null,
      evaluatePersistentDelta: true,
    };
    const declaration = buildPersistentDeltaPayload(request).tools[0]!.functionDeclarations[0]!
      .parametersJsonSchema.properties.relations.items.properties.relationType;
    expect(declaration.description).toContain("Omit an optional relation");
    expect(declaration.description).toContain("ANALYSIS_SPECIFICATION -> CANONICAL_VARIABLE is invalid");
  });

  it("R11 resolves candidate-local endpoints", () => {
    const raw = "Cette variable couvre ce besoin.";
    const checked = validate({ raw, changes: [
      change("variable", "variable:local", "CANONICAL_VARIABLE"),
      change("besoin", "need:local", "DATA_NEED"),
    ], relations: [relation(raw, "COVERS_DATA_NEED", "variable:local", "need:local")] });
    expect(checked.candidate?.relations[0]).toMatchObject({ sourceObjectRef: "variable:local", targetObjectRef: "need:local" });
  });

  it("R12 resolves exact stable Project endpoints", () => {
    const project = adoptedVariableAndNeed();
    const state = ensureCanonicalProjectState(project);
    const variable = state.objects.find((item) => item.objectType === "CANONICAL_VARIABLE")!;
    const need = state.objects.find((item) => item.objectType === "DATA_NEED")!;
    const raw = "La variable couvre le besoin.";
    const checked = validate({ raw, changes: [], project, relations: [relation(raw, "COVERS_DATA_NEED", variable.objectId, need.objectId)] });
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
  });

  it("R13 rejects an invented endpoint", () => {
    const raw = "La variable couvre le besoin.";
    const checked = validate({ raw, changes: [change("variable", "variable:local", "CANONICAL_VARIABLE")], relations: [
      relation(raw, "COVERS_DATA_NEED", "variable:local", "need:invented"),
    ] });
    expect(checked.validation.blocks).toContain("relation:0:PROJECT_RELATION_ENDPOINT_INVALID");
  });

  it("R14 preserves the R1 modality-comparison corridor", () => {
    const raw = "Je compare le scanner et l’IRM.";
    const checked = validate({ raw, changes: [
      change("scanner", "modality:ct", "IMAGING_MODALITY", "Scanner"),
      change("IRM", "modality:mri", "IMAGING_MODALITY", "IRM"),
    ], relations: [relation(raw, "COMPARES_WITH", "modality:ct", "modality:mri")] });
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
  });

  it("R15 preserves literal source anchoring", () => {
    const raw = "La masse des lésions sera mesurée.";
    const checked = validate({ raw, changes: [change("masse lésionnelle", "variable:mass", "CANONICAL_VARIABLE")] });
    expect(checked.validation.blocks).toContain("change:0:SOURCE_TEXT_NOT_IN_USER_TURN");
  });

  it("R16 keeps every accepted relation visible in Human Review", () => {
    const raw = "La variable couvre le besoin de mesure.";
    const checked = validate({ raw, changes: [
      change("variable", "variable:measure", "CANONICAL_VARIABLE"),
      change("besoin de mesure", "need:measure", "DATA_NEED"),
    ], relations: [relation(raw, "COVERS_DATA_NEED", "variable:measure", "need:measure")] });
    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation: conversation(raw), currentProject: null })!;
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    expect(candidate.humanReviewProjection).toMatchObject({ status: "COMPLETE", missingChangeRefs: [] });
    expect(candidate.humanReviewProjection.sections.flatMap((section) => section.items.map((item) => item.content)).join("\n"))
      .toContain("COVERS_DATA_NEED");
  });

  it("R17 leaves QRY bound to the exact adopted Project version", () => {
    const project = adoptedVariableAndNeed();
    expect(buildFunctionalResetQueryNavigation({ project, recordedAt: "2026-08-24T15:02:00.000Z" }))
      .toMatchObject({ projectRef: project.projectId, projectVersion: project.versionId, projectDigest: project.projectDigest });
  });

  it("R18 preserves the typed temporal corridor", () => {
    const raw = "Une IRM sera réalisée entre J5 et J7.";
    const temporal: PersistentTemporalQualification = {
      operation: "ADD",
      qualificationId: "timing:mri:j5-j7",
      sourceText: "entre J5 et J7",
      subjectProjectRef: "acquisition:mri",
      temporalRole: "ACQUISITION_TIME",
      anchor: {
        kind: "WINDOW",
        direction: "AFTER",
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
    };
    const checked = validate({ raw, changes: [change("IRM sera réalisée", "acquisition:mri", "ACQUISITION", "Acquisition IRM")], temporalQualifications: [temporal] });
    expect(checked.validation).toMatchObject({ valid: true, blocks: [], normalizations: [] });
  });
});
