import { describe, expect, it } from "vitest";
import { buildPersistentDeltaPayload } from "../../../../../api/protocol-designer-bridge-provider";
import { logicalDigest } from "@/features/knowledge-engine/canonical";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";
import {
  PERSISTENT_DELTA_SYSTEM_INSTRUCTION,
  buildPersistentSourceCatalog,
  contributionFromPersistentDelta,
  materializePersistentSourceAnchors,
  validatePersistentProjectDelta,
  validatePersistentProviderContract,
  type PersistentSourceCatalog,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import {
  confirmResearchProjectContribution,
  ensureCanonicalProjectState,
  prepareResearchProjectContributionCandidate,
} from "@/features/research-project-construction";

const conversation = (raw: string, turnId = "turn:user:04r2", assistant?: string): ScientificInterpretationConversation => ({
  conversationId: "conversation:hands-on-04r2",
  language: "fr",
  turns: [
    ...(assistant ? [{ turnId: "turn:assistant:04r2", role: "NOXIA" as const, content: assistant }] : []),
    { turnId, role: "USER", content: raw },
  ],
});

const fullAnchorId = (catalog: PersistentSourceCatalog) =>
  catalog.anchors.find((anchor) => anchor.fragmentKind === "FULL_TURN")!.anchorId;

const providerChange = (
  sourceAnchorId: string,
  candidateRef: string,
  proposedType: string,
  content: string,
) => ({
  operation: "ADD" as const,
  sourceAnchorId,
  candidateRef,
  semanticIdentity: candidateRef,
  proposedType,
  content,
  polarity: "AFFIRMED" as const,
  epistemicStatus: "EXPLICIT_USER_STATED" as const,
  epistemicState: "KNOWN" as const,
  assertionKind: "USER_STATED" as const,
  evidenceRefs: [],
});

const anchoredCandidate = (input: {
  sourceAnchorId: string;
  changes?: Array<Record<string, unknown>>;
  relations?: Array<Record<string, unknown>>;
  temporalQualifications?: Array<Record<string, unknown>>;
}) => ({
  changes: input.changes ?? [providerChange(input.sourceAnchorId, "condition:one", "CONDITION", "Condition")],
  relations: input.relations ?? [],
  temporalQualifications: input.temporalQualifications ?? [],
  expectedVariableOccasions: [],
});

const materialize = (raw: string, value: unknown, catalog = buildPersistentSourceCatalog(conversation(raw))) =>
  materializePersistentSourceAnchors({
    value,
    catalog,
    currentUserTurn: { turnId: "turn:user:04r2", content: raw },
  });

const recalculateCatalogDigest = (catalog: PersistentSourceCatalog): PersistentSourceCatalog => ({
  ...catalog,
  catalogDigest: logicalDigest({
    contract: catalog.contract,
    contractVersion: catalog.contractVersion,
    currentUserTurnId: catalog.currentUserTurnId,
    rawTextDigest: catalog.rawTextDigest,
    anchors: catalog.anchors,
  }),
});

describe("PROJECT-HANDS-ON-04R2 — deterministic source-anchor ownership", () => {
  it("S01 always exposes the exact full current USER turn", () => {
    const raw = "Une étude avec IRM.";
    const full = buildPersistentSourceCatalog(conversation(raw)).anchors.find((anchor) => anchor.fragmentKind === "FULL_TURN");
    expect(full).toMatchObject({ turnId: "turn:user:04r2", sourceKind: "USER_TURN", startOffset: 0, endOffset: raw.length, exactText: raw });
  });

  it("S02 derives every fragment exactText from RAW offsets", () => {
    const raw = "Premier segment, second segment.";
    const catalog = buildPersistentSourceCatalog(conversation(raw));
    for (const anchor of catalog.anchors) {
      expect(raw.slice(anchor.startOffset, anchor.endOffset)).toBe(anchor.exactText);
    }
  });

  it("S03 preserves ‘des lésions’ exactly", () => {
    const raw = "des lésions";
    const catalog = buildPersistentSourceCatalog(conversation(raw));
    const result = materialize(raw, anchoredCandidate({ sourceAnchorId: fullAnchorId(catalog) }), catalog);
    expect(result.value?.changes[0]?.sourceText).toBe("des lésions");
  });

  it("S04 removes literal source typing from the provider contract", () => {
    const raw = "des lésions";
    const request: ProductBridgeRequest = { apiVersion: "1.0.0", conversation: conversation(raw), currentProject: null, evaluatePersistentDelta: true };
    const schema = buildPersistentDeltaPayload(request).tools[0]!.functionDeclarations[0]!.parametersJsonSchema;
    expect(schema.properties.changes.items.properties).toHaveProperty("sourceAnchorId");
    expect(schema.properties.changes.items.properties).not.toHaveProperty("sourceText");
    expect(schema.properties.relations.items.properties).not.toHaveProperty("sourceText");
    expect(PERSISTENT_DELTA_SYSTEM_INSTRUCTION).toContain("NOXIA matérialise ensuite déterministement");
  });

  it("S05 rejects an invented anchor ID fail-closed", () => {
    const raw = "Une condition explicite.";
    const result = materialize(raw, anchoredCandidate({ sourceAnchorId: "source-anchor:invented" }));
    expect(result).toMatchObject({ valid: false, value: null });
    expect(result.blocks).toContain("change:0:SOURCE_ANCHOR_ID_INVALID");
  });

  it("S06 rejects an assistant anchor for EXPLICIT_USER_STATED provenance", () => {
    const raw = "la première";
    const catalog = buildPersistentSourceCatalog(conversation(raw));
    catalog.anchors[0] = { ...catalog.anchors[0]!, sourceKind: "ASSISTANT_TURN" };
    const altered = recalculateCatalogDigest(catalog);
    const result = materialize(raw, anchoredCandidate({ sourceAnchorId: altered.anchors[0]!.anchorId }), altered);
    expect(result.blocks).toEqual(expect.arrayContaining([expect.stringContaining("SOURCE_ANCHOR_NOT_USER_EVIDENCE")]));
  });

  it("S07 rejects Project context as current-user evidence", () => {
    const raw = "je confirme";
    const catalog = buildPersistentSourceCatalog(conversation(raw));
    catalog.anchors[0] = { ...catalog.anchors[0]!, sourceKind: "PROJECT_CONTEXT" };
    const altered = recalculateCatalogDigest(catalog);
    const result = materialize(raw, anchoredCandidate({ sourceAnchorId: altered.anchors[0]!.anchorId }), altered);
    expect(result.blocks).toEqual(expect.arrayContaining([expect.stringContaining("SOURCE_ANCHOR_NOT_USER_EVIDENCE")]));
  });

  it("S08 allows several scientific objects to share one selected source anchor", () => {
    const raw = "inflammation, œdème et lésions";
    const catalog = buildPersistentSourceCatalog(conversation(raw));
    const anchor = fullAnchorId(catalog);
    const result = materialize(raw, anchoredCandidate({
      sourceAnchorId: anchor,
      changes: [
        providerChange(anchor, "condition:inflammation", "CONDITION", "Inflammation"),
        providerChange(anchor, "condition:edema", "CONDITION", "Œdème"),
        providerChange(anchor, "condition:lesions", "CONDITION", "Lésions"),
      ],
    }), catalog);
    expect(result).toMatchObject({ valid: true });
    expect(result.selections).toHaveLength(3);
    expect(result.value?.changes.every((change) => change.sourceText === raw)).toBe(true);
  });

  it("S09 accepts FULL_TURN as a valid non-minimal provenance fallback", () => {
    const raw = "Un tour riche avec plusieurs conséquences scientifiques.";
    const catalog = buildPersistentSourceCatalog(conversation(raw));
    expect(materialize(raw, anchoredCandidate({ sourceAnchorId: fullAnchorId(catalog) }), catalog).valid).toBe(true);
  });

  it("S10 preserves user typos exactly", () => {
    const raw = "inflamation";
    const catalog = buildPersistentSourceCatalog(conversation(raw));
    expect(materialize(raw, anchoredCandidate({ sourceAnchorId: fullAnchorId(catalog) }), catalog).value?.changes[0]?.sourceText).toBe(raw);
  });

  it("S11 preserves accents exactly", () => {
    const raw = "œdème et lésions";
    const catalog = buildPersistentSourceCatalog(conversation(raw));
    expect(materialize(raw, anchoredCandidate({ sourceAnchorId: fullAnchorId(catalog) }), catalog).value?.changes[0]?.sourceText).toBe(raw);
  });

  it("S12 preserves parenthetical punctuation exactly", () => {
    const raw = "Projet comparatif (randomisé double aveugle) avec IRM.";
    const catalog = buildPersistentSourceCatalog(conversation(raw));
    expect(catalog.anchors.find((anchor) => anchor.fragmentKind === "PARENTHETICAL")?.exactText).toBe("(randomisé double aveugle)");
  });

  it("S13 keeps an elliptical USER source as the exact USER fragment", () => {
    const raw = "la première";
    const catalog = buildPersistentSourceCatalog(conversation(raw, "turn:user:04r2", "Option A ou option B ?"));
    const result = materialize(raw, anchoredCandidate({ sourceAnchorId: fullAnchorId(catalog) }), catalog);
    expect(result.value?.changes[0]?.sourceText).toBe("la première");
  });

  it("S14 keeps contextual referent identity separate from literal USER provenance", () => {
    const raw = "la première";
    const catalog = buildPersistentSourceCatalog(conversation(raw, "turn:user:04r2", "Option A ou option B ?"));
    const anchored = providerChange(fullAnchorId(catalog), "candidate:elliptical", "OBJECTIVE", "Option A");
    const result = materialize(raw, anchoredCandidate({
      sourceAnchorId: fullAnchorId(catalog),
      changes: [{ ...anchored, operation: "REPLACE", targetProjectRef: "project-object:option-a" }],
    }), catalog);
    expect(result.value?.changes[0]).toMatchObject({ sourceText: "la première", targetProjectRef: "project-object:option-a" });
  });

  it("S15 preserves the J5-J7 and M3 temporal corridor", () => {
    const raw = "IRM d'inclusion J5-7 et IRM de suivi M3";
    const catalog = buildPersistentSourceCatalog(conversation(raw));
    const sourceAnchorId = fullAnchorId(catalog);
    const temporal = (qualificationId: string, subjectProjectRef: string, anchor: Record<string, unknown>) => ({
      operation: "ADD",
      qualificationId,
      sourceAnchorId,
      subjectProjectRef,
      temporalRole: "ACQUISITION_TIME",
      anchor,
      assertionKind: "USER_STATED",
      evidenceRefs: [],
    });
    const value = anchoredCandidate({
      sourceAnchorId,
      changes: [
        providerChange(sourceAnchorId, "acquisition:mri-inclusion", "ACQUISITION", "IRM d'inclusion"),
        providerChange(sourceAnchorId, "acquisition:mri-followup", "ACQUISITION", "IRM de suivi"),
      ],
      temporalQualifications: [
        temporal("timing:mri:j5-j7", "acquisition:mri-inclusion", {
          kind: "WINDOW", direction: "UNKNOWN", unit: "DAY", offset: null, lowerBound: 5, upperBound: 7,
          relativeEventLabel: null, tolerance: null,
          reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
        }),
        temporal("timing:mri:m3", "acquisition:mri-followup", {
          kind: "TIMEPOINT", direction: "UNKNOWN", unit: "MONTH", offset: 3, lowerBound: null, upperBound: null,
          relativeEventLabel: null, tolerance: null,
          reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
        }),
      ],
    });
    const materialized = materialize(raw, value, catalog);
    const checked = validatePersistentProjectDelta(materialized.value, raw, null, conversation(raw));
    expect(checked).toMatchObject({ validation: { valid: true, blocks: [] } });
    expect(checked.candidate?.temporalQualifications.map((item) => item.anchor)).toEqual(expect.arrayContaining([
      expect.objectContaining({ lowerBound: 5, upperBound: 7, reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" } }),
      expect.objectContaining({ offset: 3, reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" } }),
    ]));
  });

  it("S16 keeps an absent temporal reference UNKNOWN without J0/M0 invention", () => {
    const raw = "IRM M3";
    const catalog = buildPersistentSourceCatalog(conversation(raw));
    const sourceAnchorId = fullAnchorId(catalog);
    const value = anchoredCandidate({
      sourceAnchorId,
      changes: [providerChange(sourceAnchorId, "acquisition:mri", "ACQUISITION", "IRM")],
      temporalQualifications: [{
        operation: "ADD", qualificationId: "timing:mri:m3", sourceAnchorId,
        subjectProjectRef: "acquisition:mri", temporalRole: "ACQUISITION_TIME",
        anchor: {
          kind: "TIMEPOINT", direction: "UNKNOWN", unit: "MONTH", offset: 3,
          lowerBound: null, upperBound: null, relativeEventLabel: null, tolerance: null,
          reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
        },
        assertionKind: "USER_STATED", evidenceRefs: [],
      }],
    });
    const materialized = materialize(raw, value, catalog);
    expect(materialized.value?.temporalQualifications[0]?.anchor).toMatchObject({
      relativeEventLabel: null,
      reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" },
    });
    expect(JSON.stringify(materialized.value)).not.toContain("J0");
    expect(JSON.stringify(materialized.value)).not.toContain("M0");
  });

  it("S17 preserves a source-grounded comparison relation", () => {
    const raw = "colchicine vs placebo";
    const catalog = buildPersistentSourceCatalog(conversation(raw));
    const sourceAnchorId = fullAnchorId(catalog);
    const value = anchoredCandidate({
      sourceAnchorId,
      changes: [
        providerChange(sourceAnchorId, "intervention:colchicine", "INTERVENTION", "Colchicine"),
        providerChange(sourceAnchorId, "comparator:placebo", "COMPARATOR", "Placebo"),
      ],
      relations: [{
        relationRef: "relation:colchicine-placebo",
        sourceAnchorId,
        relationType: "COMPARES_WITH",
        sourceObjectRef: "intervention:colchicine",
        targetObjectRef: "comparator:placebo",
        polarity: "AFFIRMED",
        epistemicStatus: "EXPLICIT_USER_STATED",
        epistemicState: "KNOWN",
        assertionKind: "USER_STATED",
        evidenceRefs: [],
      }],
    });
    const materialized = materialize(raw, value, catalog);
    expect(validatePersistentProviderContract(value)).toEqual({ valid: true, blocks: [] });
    expect(validatePersistentProjectDelta(materialized.value, raw, null, conversation(raw))).toMatchObject({
      validation: { valid: true },
      candidate: { relations: [expect.objectContaining({ relationType: "COMPARES_WITH" })] },
    });
  });

  it("S18 keeps Human Review structurally complete", () => {
    const raw = "colchicine vs placebo";
    const catalog = buildPersistentSourceCatalog(conversation(raw));
    const sourceAnchorId = fullAnchorId(catalog);
    const materialized = materialize(raw, anchoredCandidate({
      sourceAnchorId,
      changes: [
        providerChange(sourceAnchorId, "intervention:colchicine", "INTERVENTION", "Colchicine"),
        providerChange(sourceAnchorId, "comparator:placebo", "COMPARATOR", "Placebo"),
      ],
      relations: [{
        relationRef: "relation:colchicine-placebo", sourceAnchorId, relationType: "COMPARES_WITH",
        sourceObjectRef: "intervention:colchicine", targetObjectRef: "comparator:placebo", polarity: "AFFIRMED",
        epistemicStatus: "EXPLICIT_USER_STATED", epistemicState: "KNOWN", assertionKind: "USER_STATED", evidenceRefs: [],
      }],
    }), catalog);
    const checked = validatePersistentProjectDelta(materialized.value, raw, null, conversation(raw));
    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation: conversation(raw), currentProject: null })!;
    expect(prepareResearchProjectContributionCandidate(contribution, null).humanReviewProjection).toMatchObject({ status: "COMPLETE", missingChangeRefs: [] });
  });

  it("S19 preserves deterministic literal provenance through adoption and reload", () => {
    const raw = "des lésions";
    const catalog = buildPersistentSourceCatalog(conversation(raw));
    const materialized = materialize(raw, anchoredCandidate({ sourceAnchorId: fullAnchorId(catalog) }), catalog);
    const checked = validatePersistentProjectDelta(materialized.value, raw, null, conversation(raw));
    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate!, conversation: conversation(raw), currentProject: null })!;
    const adopted = confirmResearchProjectContribution({
      contribution,
      current: null,
      projectId: "project:hands-on-04r2",
      authority: {
        actorRef: "hands-on-04r2:researcher", mandateRef: "PROJECT_OWNER",
        authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION", verification: "DEMO_SESSION_NOT_AUTHENTICATED",
      },
      confirmedAt: "2026-08-25T09:00:00.000Z",
    });
    const reloaded = JSON.parse(JSON.stringify(adopted)) as typeof adopted;
    expect(ensureCanonicalProjectState(reloaded).objects[0]?.provenance).toMatchObject({
      sourceTurnRefs: ["turn:user:04r2"], sourceText: "des lésions",
    });
  });

  it("S20 keeps historical sourceText artifacts readable", () => {
    const raw = "Ancienne preuve littérale";
    const historical = {
      changes: [{
        operation: "ADD", sourceText: raw, candidateRef: "legacy:condition", proposedType: "CONDITION", content: "Condition",
        polarity: "AFFIRMED", epistemicStatus: "EXPLICIT_USER_STATED", epistemicState: "KNOWN", assertionKind: "USER_STATED", evidenceRefs: [],
      }],
      relations: [], temporalQualifications: [], expectedVariableOccasions: [],
    };
    expect(validatePersistentProviderContract(historical)).toEqual({ valid: true, blocks: [] });
    expect(validatePersistentProjectDelta(historical, raw, null, conversation(raw))).toMatchObject({ validation: { valid: true } });
  });
});
