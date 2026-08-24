import { describe, expect, it } from "vitest";
import { buildPersistentDeltaPayload } from "../../../../../api/protocol-designer-bridge-provider";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import {
  PERSISTENT_DELTA_SYSTEM_INSTRUCTION,
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

const conversation = (raw: string, assistant?: string): ScientificInterpretationConversation => ({
  conversationId: "conversation:hands-on-03r1",
  language: "fr",
  turns: [
    ...(assistant ? [{ turnId: "turn:assistant", role: "NOXIA" as const, content: assistant }] : []),
    { turnId: "turn:user", role: "USER", content: raw },
  ],
});

const change = (
  sourceText: string,
  candidateRef: string,
  proposedType: string,
  content: string,
  studyRole?: string,
): PersistentProjectDeltaChange => ({
  operation: "ADD",
  sourceText,
  candidateRef,
  proposedType,
  content,
  polarity: "AFFIRMED",
  ...(studyRole ? { studyRole } : {}),
  epistemicStatus: "EXPLICIT_USER_STATED",
  epistemicState: "KNOWN",
  assertionKind: "USER_STATED",
  evidenceRefs: [],
});

const relation = (
  sourceText: string,
  sourceObjectRef: string,
  targetObjectRef: string,
  assertionKind: "USER_STATED" | "USER_ADOPTED_PROPOSAL" = "USER_STATED",
  proposalSourceText?: string,
): PersistentProjectRelation => ({
  relationRef: `relation:${sourceObjectRef}:${targetObjectRef}`,
  sourceText,
  relationType: "COMPARES_WITH",
  sourceObjectRef,
  targetObjectRef,
  polarity: "AFFIRMED",
  epistemicStatus: assertionKind === "USER_STATED" ? "EXPLICIT_USER_STATED" : "CONFIRMED_BY_USER",
  epistemicState: "KNOWN",
  assertionKind,
  ...(proposalSourceText ? { proposalSourceText } : {}),
  evidenceRefs: [],
});

const validate = (input: {
  raw: string;
  changes: PersistentProjectDeltaChange[];
  relations?: PersistentProjectRelation[];
  temporalQualifications?: PersistentTemporalQualification[];
  project?: ResearchProjectOwnerProjection | null;
  assistant?: string;
}) => validatePersistentProjectDelta({
  changes: input.changes,
  relations: input.relations ?? [],
  temporalQualifications: input.temporalQualifications ?? [],
  expectedVariableOccasions: [],
}, input.raw, input.project ?? null, conversation(input.raw, input.assistant));

const projectWithModalities = () => {
  const raw = "Je compare le scanner et l’IRM.";
  const checked = validate({
    raw,
    changes: [
      change("scanner", "modality:ct", "IMAGING_MODALITY", "Scanner"),
      change("IRM", "modality:mri", "IMAGING_MODALITY", "IRM"),
    ],
    relations: [relation("compare le scanner et l’IRM", "modality:ct", "modality:mri")],
  });
  const contribution = contributionFromPersistentDelta({
    candidate: checked.candidate!,
    conversation: conversation(raw),
    currentProject: null,
    createdAt: "2026-08-24T14:00:00.000Z",
  })!;
  return confirmResearchProjectContribution({
    contribution,
    current: null,
    projectId: "project:hands-on-03r1",
    authority: {
      actorRef: "hands-on-03r1:researcher",
      mandateRef: "PROJECT_OWNER",
      authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION",
      verification: "DEMO_SESSION_NOT_AUTHENTICATED",
    },
    confirmedAt: "2026-08-24T14:01:00.000Z",
  });
};

describe("PROJECT-HANDS-ON-03R1 — provider typing and literal provenance", () => {
  it("T01 exposes IMAGING_MODALITY as the type for an explicit modality, not a variable", () => {
    const request: ProductBridgeRequest = { apiVersion: "1.0.0", conversation: conversation("Une modalité d'imagerie est envisagée."), currentProject: null, evaluatePersistentDelta: true };
    const declaration = buildPersistentDeltaPayload(request).tools[0]!.functionDeclarations[0]!.parametersJsonSchema.properties.changes.items.properties.proposedType;
    expect(declaration.enum).toContain("IMAGING_MODALITY");
    expect(declaration.description).toContain("never a CANONICAL_VARIABLE");
  });

  it("T02 preserves two modality identities", () => {
    const raw = "Je compare l’échographie et la TEP.";
    const checked = validate({ raw, changes: [
      change("échographie", "modality:ultrasound", "IMAGING_MODALITY", "Échographie"),
      change("TEP", "modality:pet", "IMAGING_MODALITY", "TEP"),
    ] });
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
    expect(checked.candidate?.changes.map((item) => item.proposedType)).toEqual(["IMAGING_MODALITY", "IMAGING_MODALITY"]);
  });

  it("T03 resolves a comparison between two modalities", () => {
    const raw = "Je compare l’échographie et la TEP.";
    const checked = validate({ raw, changes: [
      change("échographie", "modality:ultrasound", "IMAGING_MODALITY", "Échographie"),
      change("TEP", "modality:pet", "IMAGING_MODALITY", "TEP"),
    ], relations: [relation("compare l’échographie et la TEP", "modality:ultrasound", "modality:pet")] });
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
    expect(checked.candidate?.relations).toHaveLength(1);
  });

  it("T04 permits a separately stated planned acquisition", () => {
    const raw = "La TEP est retenue et un examen TEP sera réalisé demain.";
    const checked = validate({ raw, changes: [
      change("TEP", "modality:pet", "IMAGING_MODALITY", "TEP"),
      change("un examen TEP sera réalisé demain", "acquisition:pet", "ACQUISITION", "Examen TEP planifié"),
    ] });
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
    expect(checked.candidate?.changes.map((item) => item.proposedType)).toEqual(["IMAGING_MODALITY", "ACQUISITION"]);
  });

  it("T05 does not force an acquisition for a merely considered modality", () => {
    const raw = "La TEP pourrait être intéressante.";
    const checked = validate({ raw, changes: [change("TEP", "modality:pet", "IMAGING_MODALITY", "TEP")] });
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
    expect(checked.candidate?.changes.some((item) => item.proposedType === "ACQUISITION")).toBe(false);
  });

  it("T06 keeps a measurement output distinct from its modality", () => {
    const raw = "L’échographie produira une aire lésionnelle en cm².";
    const checked = validate({ raw, changes: [
      change("échographie", "modality:ultrasound", "IMAGING_MODALITY", "Échographie"),
      change("aire lésionnelle en cm²", "variable:lesion-area", "CANONICAL_VARIABLE", "Aire lésionnelle en cm²"),
    ] });
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
    expect(checked.candidate?.changes.map((item) => item.proposedType)).toEqual(["IMAGING_MODALITY", "CANONICAL_VARIABLE"]);
  });

  it("T07 accepts an exact accented source span", () => {
    const raw = "Nous étudierons les lésions en échographie.";
    expect(validate({ raw, changes: [change("lésions", "condition:lesions", "CONDITION", "Lésions")] }).validation.blocks).toEqual([]);
  });

  it("T08 rejects provider-normalized accents", () => {
    const raw = "Nous étudierons les lésions en échographie.";
    expect(validate({ raw, changes: [change("lesions", "condition:lesions", "CONDITION", "Lésions")] }).validation.blocks)
      .toContain("change:0:SOURCE_TEXT_NOT_IN_USER_TURN");
  });

  it("T09 preserves a user spelling error literally", () => {
    const raw = "Une echograhie sera envisagée.";
    expect(validate({ raw, changes: [change("echograhie", "modality:typo", "IMAGING_MODALITY", "Échographie")] }).validation.blocks).toEqual([]);
  });

  it("T10 rejects a paraphrased source span", () => {
    const raw = "Une modalité par ultrasons est envisagée.";
    expect(validate({ raw, changes: [change("échographie", "modality:ultrasound", "IMAGING_MODALITY", "Échographie")] }).validation.blocks)
      .toContain("change:0:SOURCE_TEXT_NOT_IN_USER_TURN");
  });

  it("T11 keeps an elliptical USER source while resolving Project refs", () => {
    const project = projectWithModalities();
    const state = ensureCanonicalProjectState(project);
    const ct = state.objects.find((item) => item.content === "Scanner" && item.actuality === "CURRENT")!;
    const mri = state.objects.find((item) => item.content === "IRM" && item.actuality === "CURRENT")!;
    const assistant = "Souhaitez-vous comparer le scanner et l’IRM ?";
    const checked = validate({
      raw: "les deux",
      assistant,
      project,
      changes: [],
      relations: [relation("les deux", ct.objectId, mri.objectId, "USER_ADOPTED_PROPOSAL", assistant)],
    });
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
    expect(checked.candidate?.relations[0]?.sourceText).toBe("les deux");
  });

  it("T12 refuses Project context as current USER source", () => {
    const checked = validate({ raw: "d’accord", changes: [change("IRM", "modality:mri", "IMAGING_MODALITY", "IRM")] });
    expect(checked.validation.blocks).toContain("change:0:SOURCE_TEXT_NOT_IN_USER_TURN");
  });

  it("T13 preserves a distinct literal anchor for each object", () => {
    const raw = "Chez le lapin, je comparerai l’échographie à la TEP.";
    const checked = validate({ raw, changes: [
      change("lapin", "population:rabbit", "POPULATION", "Lapin"),
      change("échographie", "modality:ultrasound", "IMAGING_MODALITY", "Échographie"),
      change("TEP", "modality:pet", "IMAGING_MODALITY", "TEP"),
    ] });
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
    expect(checked.candidate?.changes.map((item) => item.sourceText)).toEqual(["lapin", "échographie", "TEP"]);
  });

  it("T14 keeps relation endpoints valid after object acceptance", () => {
    const raw = "Je comparerai l’échographie à la TEP.";
    const checked = validate({ raw, changes: [
      change("échographie", "modality:ultrasound", "IMAGING_MODALITY", "Échographie"),
      change("TEP", "modality:pet", "IMAGING_MODALITY", "TEP"),
    ], relations: [relation("comparerai l’échographie à la TEP", "modality:ultrasound", "modality:pet")] });
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
  });

  it("T15 preserves the reference-standard non-intervention boundary", () => {
    const raw = "L’histologie sera la référence.";
    const checked = validate({ raw, changes: [change("histologie", "reference:histology", "INTERVENTION", "Histologie", "REFERENCE_STANDARD")] });
    expect(checked.validation.blocks).toContain("change:0:REFERENCE_STANDARD_NOT_STUDY_INTERVENTION_OR_ARM");
  });

  it("T16 keeps Human Review coverage complete", () => {
    const raw = "Je comparerai l’échographie à la TEP.";
    const checked = validate({ raw, changes: [
      change("échographie", "modality:ultrasound", "IMAGING_MODALITY", "Échographie"),
      change("TEP", "modality:pet", "IMAGING_MODALITY", "TEP"),
    ], relations: [relation("comparerai l’échographie à la TEP", "modality:ultrasound", "modality:pet")] });
    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation: conversation(raw), currentProject: null })!;
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    expect(candidate.humanReviewProjection).toMatchObject({ status: "COMPLETE", missingChangeRefs: [] });
    expect(candidate.humanReviewProjection.coveredChangeRefs).toEqual(candidate.humanReviewProjection.expectedChangeRefs);
  });

  it("T17 preserves a typed acquisition time without collapsing the modality", () => {
    const raw = "Une IRM sera réalisée à J5.";
    const temporal: PersistentTemporalQualification = {
      operation: "ADD",
      qualificationId: "timing:mri:j5",
      sourceText: "à J5",
      subjectProjectRef: "acquisition:mri",
      temporalRole: "ACQUISITION_TIME",
      anchor: {
        kind: "TIMEPOINT", direction: "AT", unit: "DAY", offset: 5,
        lowerBound: null, upperBound: null, relativeEventLabel: null, tolerance: null,
        reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
      },
      assertionKind: "USER_STATED",
      evidenceRefs: [],
    };
    const checked = validate({ raw, changes: [
      change("IRM", "modality:mri", "IMAGING_MODALITY", "IRM"),
      change("IRM sera réalisée", "acquisition:mri", "ACQUISITION", "Acquisition IRM"),
    ], temporalQualifications: [temporal] });
    expect(checked.validation).toMatchObject({ valid: true, blocks: [], normalizations: [] });
    expect(checked.candidate?.changes.map((item) => item.proposedType)).toEqual(["IMAGING_MODALITY", "ACQUISITION"]);
  });

  it("T18 leaves QRY on the adopted Project version", () => {
    const project = projectWithModalities();
    expect(buildFunctionalResetQueryNavigation({ project, recordedAt: "2026-08-24T14:02:00.000Z" }))
      .toMatchObject({ projectRef: project.projectId, projectVersion: project.versionId, projectDigest: project.projectDigest });
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).toContain("COPIE une sous-chaîne contiguë exacte");
  });

  it("T19 requires a final literal-source audit without weakening fail-closed validation", () => {
    const raw = "Nous suivrons des lésions en IRM.";
    expect(validate({ raw, changes: [change("les lésions", "condition:lesions", "CONDITION", "Lésions")] }).validation.blocks)
      .toContain("change:0:SOURCE_TEXT_NOT_IN_USER_TURN");
    expect(validate({ raw, changes: [change("des lésions", "condition:lesions", "CONDITION", "Lésions")] }).validation.blocks)
      .toEqual([]);

    const request: ProductBridgeRequest = {
      apiVersion: "1.0.0",
      requestKind: "USER_TURN",
      conversation: conversation(raw),
      currentProject: null,
      evaluatePersistentDelta: true,
    };
    const schema = buildPersistentDeltaPayload(request).tools[0]!.functionDeclarations[0]!.parametersJsonSchema;
    const descriptions = [
      schema.properties.changes.items.properties.sourceText.description,
      schema.properties.relations.items.properties.sourceText.description,
      schema.properties.temporalQualifications.items.properties.sourceText.description,
      schema.properties.expectedVariableOccasions.items.properties.sourceText.description,
    ];
    descriptions.forEach((description) => expect(description).toContain("contained unchanged"));
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).toContain("contrôle littéral final sur CHAQUE sourceText");
  });
});
