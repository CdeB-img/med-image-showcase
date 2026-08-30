import { describe, expect, it } from "vitest";
import { buildPersistentDeltaPayload } from "../../../../../api/protocol-designer-bridge-provider";
import { buildOpenAIPersistentDeltaPayload } from "../../../../../api/protocol-designer-openai-extraction-provider";
import {
  PERSISTENT_DELTA_SYSTEM_INSTRUCTION,
  PERSISTENT_PROJECT_RELATION_ENDPOINT_CONTRACT,
  contributionFromPersistentDelta,
  persistentProjectRelationEndpointsCompatible,
  validatePersistentProjectDelta,
  type PersistentProjectDeltaChange,
  type PersistentProjectRelation,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import { prepareResearchProjectContributionCandidate } from "@/features/research-project-construction";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";

const CEC_INPUT = "je veux créer une étude se basant sur le principe que suite a circulation extra corporelle la troponine augmente et qu'il y a donc atteinte des myocites. je voudrais étudier cette atteinte à l'irm pour explorer ce domaine afin de voir s'il y a de réelles lésions visibles en rehaussement tardif ou si l'on peut observer une modification de l'ECV ou de la contractilité";

const conversation = (raw: string): ScientificInterpretationConversation => ({
  conversationId: "conversation:p1-ux-restore-01rel",
  language: "fr",
  turns: [{ turnId: "turn:user:01rel", role: "USER", content: raw }],
});

const request = (raw: string): ProductBridgeRequest => ({
  apiVersion: "1.0.0",
  conversation: conversation(raw),
  currentProject: null,
  evaluatePersistentDelta: true,
});

const change = (
  raw: string,
  candidateRef: string,
  proposedType: string,
  content = candidateRef,
  epistemicState: "KNOWN" | "UNKNOWN" = "KNOWN",
): PersistentProjectDeltaChange => ({
  operation: "ADD",
  sourceText: raw,
  candidateRef,
  proposedType,
  content,
  polarity: "AFFIRMED",
  epistemicStatus: "EXPLICIT_USER_STATED",
  epistemicState,
  assertionKind: "USER_STATED",
  evidenceRefs: [],
});

const relation = (
  raw: string,
  relationType: string,
  sourceObjectRef: string,
  targetObjectRef: string,
): PersistentProjectRelation => ({
  relationRef: `relation:${relationType}:${sourceObjectRef}:${targetObjectRef}`,
  sourceText: raw,
  relationType,
  sourceObjectRef,
  targetObjectRef,
  polarity: "AFFIRMED",
  epistemicStatus: "EXPLICIT_USER_STATED",
  epistemicState: "KNOWN",
  assertionKind: "USER_STATED",
  evidenceRefs: [],
});

const validate = (
  raw: string,
  changes: PersistentProjectDeltaChange[],
  relations: PersistentProjectRelation[] = [],
) => validatePersistentProjectDelta({
  changes,
  relations,
  temporalQualifications: [],
  expectedVariableOccasions: [],
}, raw, null, conversation(raw));

describe("P1-UX-RESTORE-01REL — governed relation extraction fidelity", () => {
  it("publishes one machine-readable endpoint contract to both provider transports", () => {
    const body = request("Une variable couvre un besoin de données.");
    const geminiBoundary = buildPersistentDeltaPayload(body);
    const openAiBoundary = buildOpenAIPersistentDeltaPayload(body);
    const operationalizes = PERSISTENT_PROJECT_RELATION_ENDPOINT_CONTRACT.signatures
      .find((signature) => signature.relationTypes.some((relationType) => relationType === "OPERATIONALIZES"));

    expect(geminiBoundary.contents[0]!.parts[0]!.text).toContain("PERSISTENT_PROJECT_RELATION_ENDPOINT_CONTRACT");
    expect(openAiBoundary.input).toContain("PERSISTENT_PROJECT_RELATION_ENDPOINT_CONTRACT");
    expect(operationalizes).toEqual(expect.objectContaining({
      sourceTypes: ["CANONICAL_VARIABLE", "ACQUISITION", "ANALYSIS_SPECIFICATION"],
      targetTypes: ["DATA_NEED"],
    }));
    expect(operationalizes?.sourceTypes).not.toContain("IMAGING_MODALITY");
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).not.toContain("Une modalité ou acquisition utilisée");
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).toContain("Une IMAGING_MODALITY nommée ne devient jamais une ACQUISITION");
  });

  it("accepts a valid signature through the same helper used by deterministic validation", () => {
    const raw = "La variable couvre le besoin de données.";
    expect(persistentProjectRelationEndpointsCompatible("COVERS_DATA_NEED", "CANONICAL_VARIABLE", "DATA_NEED")).toBe(true);
    expect(validate(raw, [
      change(raw, "variable:measure", "CANONICAL_VARIABLE"),
      change(raw, "need:measure", "DATA_NEED"),
    ], [relation(raw, "COVERS_DATA_NEED", "variable:measure", "need:measure")]).validation)
      .toMatchObject({ valid: true, blocks: [] });
  });

  it("does not advertise IMAGING_MODALITY as OPERATIONALIZES and preserves the validator rejection", () => {
    const raw = "L'IRM sert à explorer le besoin de caractérisation.";
    expect(persistentProjectRelationEndpointsCompatible("OPERATIONALIZES", "IMAGING_MODALITY", "DATA_NEED")).toBe(false);
    const checked = validate(raw, [
      change(raw, "modality:mri", "IMAGING_MODALITY", "IRM"),
      change(raw, "need:characterization", "DATA_NEED", "Caractérisation myocardique"),
    ], [relation(raw, "OPERATIONALIZES", "modality:mri", "need:characterization")]);
    expect(checked.validation.blocks).toContain("relation:0:PROJECT_RELATION_ENDPOINT_TYPE_MISMATCH");
    expect(checked.candidate).toBeNull();
  });

  it("keeps invalid targets and unsupported relation types fail-closed", () => {
    const raw = "Une variable et une analyse sont décrites.";
    const changes = [
      change(raw, "variable:measure", "CANONICAL_VARIABLE"),
      change(raw, "analysis:plan", "ANALYSIS_SPECIFICATION"),
    ];
    expect(validate(raw, changes, [relation(raw, "OPERATIONALIZES", "variable:measure", "analysis:plan")]).validation.blocks)
      .toContain("relation:0:PROJECT_RELATION_ENDPOINT_TYPE_MISMATCH");
    expect(validate(raw, changes, [relation(raw, "CONSUMED_BY_ANALYSIS", "variable:measure", "analysis:plan")]).validation.blocks)
      .toContain("relation:0:RELATION_TYPE_OUTSIDE_PROVIDER_VOCABULARY");
  });

  it("keeps explicit objects valid when no authorized relation is available", () => {
    const raw = "L'IRM et le besoin de caractérisation sont envisagés.";
    const checked = validate(raw, [
      change(raw, "modality:mri", "IMAGING_MODALITY", "IRM"),
      change(raw, "need:characterization", "DATA_NEED", "Caractérisation myocardique"),
    ]);
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
    expect(checked.candidate?.relations).toEqual([]);
  });

  it("replays the exact CEC class with the invalid optional relation omitted", () => {
    const checked = validate(CEC_INPUT, [
      change(CEC_INPUT, "context:cec", "PROJECT_INFORMATION", "La circulation extracorporelle constitue le contexte de l'étude."),
      change(CEC_INPUT, "hypothesis:troponin", "HYPOTHESIS", "L'élévation de la troponine après circulation extracorporelle peut refléter une atteinte des myocytes."),
      change(CEC_INPUT, "objective:mri", "OBJECTIVE", "Explorer par IRM cardiaque une atteinte myocardique potentielle."),
      change(CEC_INPUT, "modality:mri", "IMAGING_MODALITY", "IRM cardiaque."),
      change(CEC_INPUT, "need:myocardium", "DATA_NEED", "Caractérisation de l'atteinte myocardique.", "UNKNOWN"),
      change(CEC_INPUT, "variable:lge", "CANONICAL_VARIABLE", "Lésions visibles en rehaussement tardif."),
      change(CEC_INPUT, "variable:ecv", "CANONICAL_VARIABLE", "Volume extracellulaire (ECV)."),
      change(CEC_INPUT, "variable:contractility", "CANONICAL_VARIABLE", "Contractilité."),
    ]);
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
    expect(checked.validation.blocks).not.toContain(expect.stringContaining("PROJECT_RELATION_ENDPOINT_TYPE_MISMATCH"));

    const contribution = contributionFromPersistentDelta({
      candidate: checked.candidate!,
      conversation: conversation(CEC_INPUT),
      currentProject: null,
      createdAt: "2026-08-30T15:00:00.000Z",
    });
    const candidate = prepareResearchProjectContributionCandidate(contribution!, null);
    expect(contribution).not.toBeNull();
    expect(candidate.changeSet.status).toBe("PENDING_HUMAN_CONFIRMATION");
    expect(candidate.humanReviewProjection).toMatchObject({ status: "COMPLETE", missingChangeRefs: [] });
    expect(candidate.canonicalChangeSet.relationChanges).toEqual([]);
  });
});
