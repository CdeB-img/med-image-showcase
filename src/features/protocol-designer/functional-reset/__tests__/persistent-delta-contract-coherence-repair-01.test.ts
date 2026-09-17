import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import Ajv from "ajv";
import { describe, expect, it } from "vitest";
import { buildPersistentDeltaPayload } from "../../../../../api/protocol-designer-bridge-provider";
import { buildOpenAIPersistentDeltaPayload } from "../../../../../api/protocol-designer-openai-extraction-provider";
import {
  PERSISTENT_DELTA_MAX_CHANGES, buildPersistentSourceCatalog, contributionFromPersistentDelta,
  constrainPersistentRelationsToCanonicalSignatures, materializePersistentSourceAnchors,
  persistentSourceAnchoredDeltaSchema, validatePersistentProjectDelta, validatePersistentProviderContract,
  type ProductBridgeRequest,
} from "@/features/protocol-designer/product-bridge";
import {
  confirmResearchProjectContribution, ensureCanonicalProjectState, prepareResearchProjectContributionCandidate,
} from "@/features/research-project-construction";
import { presentCanonicalTemporalAnchor } from "@/features/research-project-construction/temporal-presentation";

const requestFor = (raw: string): ProductBridgeRequest => ({
  apiVersion: "1.0.0", evaluatePersistentDelta: true, currentProject: null,
  conversation: { conversationId: "conversation:n1", language: "fr", turns: [{ turnId: "turn:n1", role: "USER", content: raw }] },
});
const setup = (raw = "IRM avant reperfusion") => {
  const request = requestFor(raw);
  const catalog = buildPersistentSourceCatalog(request.conversation);
  const sourceAnchorId = catalog.anchors.find((a) => a.fragmentKind === "FULL_TURN")!.anchorId;
  const change = (candidateRef = "acquisition:irm", proposedType = "ACQUISITION", content = raw) => ({
    operation: "ADD", sourceAnchorId, candidateRef, proposedType, content,
    polarity: "AFFIRMED", epistemicStatus: "EXPLICIT_USER_STATED", epistemicState: "KNOWN", assertionKind: "USER_STATED", evidenceRefs: [],
  });
  const anchor = { kind: "RELATIVE_EVENT", direction: "BEFORE", unit: null, offset: null, lowerBound: null, upperBound: null,
    relativeEventLabel: "reperfusion", tolerance: null, reference: { status: "EXPLICIT", bindingStatus: "PROJECT_REF_UNRESOLVED" } };
  const qualification = { operation: "ADD", sourceAnchorId, subjectProjectRef: "acquisition:irm", temporalRole: "ACQUISITION_TIME", anchor, assertionKind: "USER_STATED", evidenceRefs: [] };
  const input = { changes: [change()], relations: [], temporalQualifications: [qualification], expectedVariableOccasions: [] };
  const materialize = (value: unknown) => materializePersistentSourceAnchors({ value, catalog, currentUserTurn: request.conversation.turns[0] });
  const check = (value: unknown) => validatePersistentProjectDelta(value, raw, null, request.conversation);
  const wire = new Ajv({ allErrors: true }).compile(buildPersistentDeltaPayload(request).tools[0].functionDeclarations[0].parametersJsonSchema);
  return { request, catalog, sourceAnchorId, change, anchor, qualification, input, materialize, check, wire };
};

const recordedRoot = resolve("validation/protocol-designer-v1-human-conversation-causal-audit-02");
const recordedFiles = readdirSync(recordedRoot).filter((f) => f.endsWith("-recorded-provider.json")).sort();

describe("N1 — one effective persistent-delta contract", () => {
  it("uses the same derived input schema for OpenAI and Gemini, including all structural bounds", () => {
    const s = setup();
    const gemini = buildPersistentDeltaPayload(s.request).tools[0].functionDeclarations[0].parametersJsonSchema;
    const openai = buildOpenAIPersistentDeltaPayload(s.request).text.format.schema;
    expect(openai).toEqual(gemini);
    expect(gemini.properties.changes.maxItems).toBe(64);
    expect(gemini.properties.relations.maxItems).toBe(30);
    expect(gemini.properties.temporalQualifications.maxItems).toBe(20);
    expect(gemini.properties.expectedVariableOccasions.maxItems).toBe(30);
    for (const value of [{}, s.input, { changes: [s.change()] }]) {
      expect(Boolean(s.wire(value))).toBe(persistentSourceAnchoredDeltaSchema.safeParse(value).success);
    }
  });

  it("materializes and carries all 64 maximum-length changes to the existing human-decision owner", () => {
    const s = setup("x".repeat(4_000));
    const value = { changes: Array.from({ length: PERSISTENT_DELTA_MAX_CHANGES }, (_, i) => ({ ...s.change(`information:${i}`.padEnd(300, "x"), "PROJECT_INFORMATION", `${i}:`.padEnd(4_000, "x")), evidenceRefs: Array(20).fill("e".repeat(500)) })) };
    expect(s.wire(value)).toBe(true);
    const materialized = s.materialize(value);
    expect(materialized.valid).toBe(true);
    expect(materialized.value.changes).toHaveLength(64);
    const checked = s.check(materialized.value);
    expect(checked.validation.valid).toBe(true);
    expect(checked.validation.acceptedChanges).toHaveLength(64);
    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate, conversation: s.request.conversation, currentProject: null });
    const candidate = prepareResearchProjectContributionCandidate(contribution, null);
    expect(candidate.canonicalChangeSet.objectChanges).toHaveLength(64);
    expect(candidate.canonicalChangeSet.status).toBe("READY_FOR_HUMAN_DECISION");
    expect(candidate.status).toBe("CANDIDATE_PENDING_HUMAN_CONFIRMATION");
    expect(s.request.currentProject).toBeNull();
  });

  it("refuses 65 changes as a whole without slicing or mutating provider JSON", () => {
    const s = setup();
    const value = { changes: Array.from({ length: 65 }, (_, i) => s.change(`acquisition:${i}`)) };
    const before = JSON.stringify(value);
    expect(s.wire(value)).toBe(false);
    expect(validatePersistentProviderContract(value).valid).toBe(false);
    expect(s.materialize(value)).toMatchObject({ valid: false, value: null });
    expect(JSON.stringify(value)).toBe(before);
  });

  it("preserves qualitative BEFORE reperfusion through Contribution, PRJ human adoption and serialization", () => {
    const s = setup();
    expect(s.wire(s.input)).toBe(true);
    const materialized = s.materialize(s.input);
    const checked = s.check(materialized.value);
    expect(checked.validation.valid).toBe(true);
    const contribution = contributionFromPersistentDelta({ candidate: checked.candidate, conversation: s.request.conversation, currentProject: null });
    expect(contribution.scientificContent.temporalQualifications[0].anchor).toEqual(s.anchor);
    const project = confirmResearchProjectContribution({ contribution, current: null, projectId: "project:n1",
      authority: { actorRef: "researcher:n1", mandateRef: "PROJECT_OWNER", authoritySource: "ACTIVE_RESEARCH_WORKSPACE_SESSION", verification: "DEMO_SESSION_NOT_AUTHENTICATED" },
      confirmedAt: "2026-09-16T00:00:00.000Z" });
    const anchor = ensureCanonicalProjectState(JSON.parse(JSON.stringify(project))).temporalQualifications[0].anchor;
    expect(anchor).toMatchObject(s.anchor);
    expect(presentCanonicalTemporalAnchor(anchor)).toBe("avant reperfusion — référentiel à relier au projet");
  });

  it("normalizes only recorded empty unquantified units explicitly, never inventing a quantity", () => {
    const s = setup();
    const value = { ...s.input, temporalQualifications: [{ ...s.qualification, anchor: { ...s.anchor, unit: "" } }] };
    const before = JSON.stringify(value);
    expect(s.wire(value)).toBe(false); // Empty is forbidden for newly produced wire values.
    const result = s.materialize(value);
    expect(result.valid).toBe(true);
    expect(result.normalizations).toContainEqual({ path: "temporalQualifications.0.anchor.unit", reason: "LEGACY_UNQUANTIFIED_EVENT_UNIT_TO_NULL", from: "", to: null });
    expect(result.value.temporalQualifications[0].anchor).toEqual(s.anchor);
    expect(JSON.stringify(value)).toBe(before);
    expect(s.materialize({ ...value, temporalQualifications: [{ ...s.qualification, anchor: { ...s.anchor, unit: "", offset: 1 } }] }).valid).toBe(false);
  });

  it("preserves an unresolved unquantified temporal reference without creating an event", () => {
    const s = setup();
    const anchor = { ...s.anchor, direction: "UNKNOWN", relativeEventLabel: null, reference: { status: "UNKNOWN", unresolvedReason: "REFERENCE_EVENT_NOT_SUPPLIED" } };
    const value = { ...s.input, temporalQualifications: [{ ...s.qualification, anchor }] };
    expect(s.wire(value)).toBe(true);
    expect(s.check(s.materialize(value).value).validation.valid).toBe(true);
  });

  it("assigns missing ADD identities locally, deterministically and independently of array ordering", () => {
    const s = setup();
    const second = { ...s.qualification, anchor: { ...s.anchor, direction: "AFTER" } };
    const one = s.materialize({ ...s.input, temporalQualifications: [s.qualification, second] });
    const two = s.materialize({ ...s.input, temporalQualifications: [second, s.qualification] });
    const ids = one.value.temporalQualifications.map((q) => q.qualificationId);
    expect(ids).toEqual(two.value.temporalQualifications.map((q) => q.qualificationId).reverse());
    expect(new Set(ids).size).toBe(2);
    expect(one.normalizations.filter((n) => n.reason === "LOCAL_ADD_QUALIFICATION_ID")).toHaveLength(2);
    const supplied = s.materialize({ ...s.input, temporalQualifications: [{ ...s.qualification, qualificationId: "historical:qualification" }] });
    expect(supplied.value.temporalQualifications[0].qualificationId).toBe("historical:qualification");
  });

  it.each(["REPLACE", "REMOVE"])("requires the existing qualification ID for %s on both boundaries", (operation) => {
    const s = setup();
    const value = { ...s.input, temporalQualifications: [{ ...s.qualification, operation }] };
    expect(s.wire(value)).toBe(false);
    expect(s.materialize(value).valid).toBe(false);
    const unknown = s.materialize({ ...s.input, temporalQualifications: [{ ...s.qualification, operation, qualificationId: "missing:qualification" }] });
    expect(s.check(unknown.value).validation.valid).toBe(false);
  });

  it.each([["jour", 1], ["jour", 6], ["jour", 7], ["mois", 3], ["minute", 10]])("preserves quantified %s/%i", (unit, offset) => {
    const s = setup();
    const anchor = { ...s.anchor, unit, offset };
    const materialized = s.materialize({ ...s.input, temporalQualifications: [{ ...s.qualification, anchor }] });
    expect(materialized.valid).toBe(true);
    const checked = s.check(materialized.value);
    expect(checked.validation.valid).toBe(true);
    expect(checked.candidate.temporalQualifications[0].anchor).toEqual(anchor);
  });

  it.each([
    { changes: [{ operation: "ADD", sourceAnchorId: "missing", content: "x", proposedType: "NOT_A_TYPE" }] },
    { changes: [{ operation: "ADD", sourceAnchorId: "missing", content: "x", studyRole: "NOT_A_ROLE" }] },
    { changes: [{ operation: "ADD", sourceAnchorId: "missing", content: "x".repeat(4_001) }] },
    { changes: [], unexpected: true },
  ])("rejects invalid structure/types on both schema boundaries (%#)", (value) => {
    const s = setup();
    expect(s.wire(value)).toBe(false);
    expect(persistentSourceAnchoredDeltaSchema.safeParse(value).success).toBe(false);
    expect(s.materialize(value).valid).toBe(false);
  });

  it("retains invalid source, relation endpoint and nonexistent object-reference guards", () => {
    const s = setup();
    expect(s.materialize({ changes: [{ ...s.change(), sourceAnchorId: "missing:anchor" }] }).valid).toBe(false);
    const relation = { relationRef: "relation:n1", sourceAnchorId: s.sourceAnchorId, relationType: "OPERATIONALIZES",
      sourceObjectRef: "acquisition:irm", targetObjectRef: "acquisition:irm", polarity: "AFFIRMED", epistemicStatus: "EXPLICIT_USER_STATED", epistemicState: "KNOWN", assertionKind: "USER_STATED", evidenceRefs: [] };
    const relationResult = s.materialize({ ...s.input, relations: [relation] });
    expect(relationResult.valid).toBe(true);
    expect(s.check(relationResult.value).validation.blocks).toContain("relation:0:PROJECT_RELATION_ENDPOINT_TYPE_MISMATCH");
    const missingSubject = s.materialize({ ...s.input, temporalQualifications: [{ ...s.qualification, subjectProjectRef: "missing:object" }] });
    expect(s.check(missingSubject.value).validation.blocks).toContain("temporalQualification:0:PROJECT_REF_INVALID");
  });

  it("requires the scientifically semantic object type and provenance fields on the live boundary", () => {
    const s = setup();
    for (const key of ["proposedType", "candidateRef", "assertionKind", "epistemicStatus", "epistemicState", "evidenceRefs"]) {
      const change: Record<string, unknown> = { ...s.change() };
      delete change[key];
      expect(s.wire({ changes: [change] })).toBe(false);
      expect(s.materialize({ changes: [change] }).valid).toBe(false);
    }
  });

  it.each([
    { unit: null, offset: 1 }, { kind: "TIMEPOINT", unit: null },
    { kind: "WINDOW", unit: "jour", lowerBound: 7, upperBound: 3 },
    { kind: "TIMEPOINT", unit: "jour", offset: null }, { relativeEventLabel: null },
  ])("retains incoherent temporal-value guards (%#)", (invalid) => {
    const s = setup();
    const materialized = s.materialize({ ...s.input, temporalQualifications: [{ ...s.qualification, anchor: { ...s.anchor, ...invalid } }] });
    expect(s.check(materialized.value).validation.valid).toBe(false);
  });

  it("has exactly the 17 recorded Terra outputs available, without regenerating any", () => expect(recordedFiles).toHaveLength(17));
  it.each(recordedFiles)("replays %s unchanged across N1, retaining genuine content rejection", (file) => {
    const record = JSON.parse(readFileSync(resolve(recordedRoot, file), "utf8"));
    const before = JSON.stringify(record.output);
    const sections: string[] = record.request.input.split("\n\n");
    const catalog = JSON.parse(sections.find((p) => p.startsWith("CATALOGUE D'ANCRAGES")).split("\n").slice(1).join("\n"));
    const raw = catalog.anchors.find((a: { fragmentKind: string }) => a.fragmentKind === "FULL_TURN").exactText;
    expect(validatePersistentProviderContract(record.output).valid).toBe(true);
    const materialized = materializePersistentSourceAnchors({ value: record.output, catalog, currentUserTurn: { turnId: catalog.currentUserTurnId, content: raw } });
    expect(materialized.valid).toBe(true);
    expect(materialized.value.changes).toHaveLength(record.output.changes.length);
    const constrained = constrainPersistentRelationsToCanonicalSignatures(materialized.value, null);
    const assistants = JSON.parse(sections.find((p) => p.startsWith("PROPOSITIONS NOXIA")).split("\n").slice(1).join("\n"));
    const conversation: ProductBridgeRequest["conversation"] = {
      conversationId: "conversation:n1:recorded", language: "fr", turns: [
        ...assistants.map((a: { turnId: string; content: string }) => ({ ...a, role: "NOXIA" })),
        { turnId: catalog.currentUserTurnId, role: "USER", content: raw },
      ],
    };
    const checked = validatePersistentProjectDelta(constrained.value, raw, null, conversation);
    // The post-N1 repair preserves the two source-declared cohort identities;
    // dangling references still fail in the dedicated referential negatives.
    expect(checked.validation.blocks).toEqual([]);
    if (file.startsWith("RHU-T01")) expect(materialized.value.temporalQualifications[1].anchor).toMatchObject({ direction: "BEFORE", unit: null, offset: null, relativeEventLabel: "reperfusion" });
    if (file.startsWith("RHU-T06")) expect(materialized.normalizations.filter((n) => n.reason === "LOCAL_ADD_QUALIFICATION_ID")).toHaveLength(3);
    if (file.startsWith("AVC-T02") || file.startsWith("AVC-T03")) expect(materialized.value.changes.filter((c) => c.proposedType === "ANALYSIS_SPECIFICATION")).toHaveLength(2);
    expect(JSON.stringify(record.output)).toBe(before);
  });
});
