import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  parseSemanticAtomicCompositionAudit,
  parseSemanticAtomicCompositionTransport,
  SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA,
  type SemanticAtomicCompositionAudit,
} from "../atomic-composition";
import { persistStructuredOutputFailure } from "../manual/structured-output-diagnostics";

const VERSION = "SEM-001-ATOMIC-COMPOSITION-1.1";
const atomicNotApplicable = () => ({
  reportId: "atomic-generic", subjectInventoryItemIds: ["inventory-any"], status: "NOT_APPLICABLE",
  constituents: [], directRelations: [], reason: "The source contains no autonomous constituents.",
});
const compositionNotRequired = () => ({
  reportId: "composition-generic", sourceInventoryItemIds: ["inventory-any"], status: "NOT_REQUIRED",
  composite: null, relations: [], reason: "The source establishes no additional composite.",
});
const correctRoute = () => ({
  status: "CORRECT", proposedRoute: null, confidence: 1, reason: "The current route matches the explicit request.", expectedCapabilities: ["GENERIC_CAPABILITY"],
});
const minimal = () => ({
  auditId: "audit-generic", schemaVersion: VERSION, verdict: "ACCEPT",
  atomicityReports: [atomicNotApplicable()], compositionReports: [compositionNotRequired()],
  routeAssessment: correctRoute(), summary: "No source-grounded repair is required.",
});
const constituent = (id: string) => ({
  constituentId: id, sourceMessageId: "message-any", sourceText: id, normalizedMeaning: id,
  semanticType: "CONSTRAINT", studyRole: "NONE", polarity: "AFFIRMED",
});
const composite = () => ({
  compositeId: "composite-any", sourceMessageId: "message-any", sourceText: "method dynamic",
  normalizedMeaning: "dynamic method", semanticType: "METHOD", studyRole: "MEASUREMENT", polarity: "AFFIRMED",
});
const roundTrip = (value: unknown): SemanticAtomicCompositionAudit => {
  const serialized = JSON.stringify(parseSemanticAtomicCompositionAudit(value));
  const transport = parseSemanticAtomicCompositionTransport(JSON.parse(serialized));
  return parseSemanticAtomicCompositionAudit(transport);
};

describe("SEM-001R3E provider transport and internal semantic contract", () => {
  it("R3E-C01 Valid minimal atomicity response parses.", () => expect(parseSemanticAtomicCompositionAudit(minimal()).verdict).toBe("ACCEPT"));

  it("R3E-C02 Valid complete atomicity response parses.", () => {
    const value = minimal();
    value.atomicityReports = [{ ...atomicNotApplicable(), status: "COMPLETE", constituents: [constituent("alpha"), constituent("beta")] }];
    expect(parseSemanticAtomicCompositionAudit(value).atomicityReports[0].status).toBe("COMPLETE");
  });

  it("R3E-C03 NOT_APPLICABLE does not require fake constituents.", () => {
    expect(parseSemanticAtomicCompositionAudit(minimal()).atomicityReports[0].constituents).toEqual([]);
  });

  it("R3E-C04 Incomplete atomicity requires appropriate diagnostic.", () => {
    const value = minimal();
    value.verdict = "REVISE";
    value.atomicityReports = [{ ...atomicNotApplicable(), status: "INCOMPLETE", constituents: [constituent("only-one")] }];
    expect(() => parseSemanticAtomicCompositionAudit(value)).toThrow(/INCOMPLETE_ATOMICITY_REQUIRES_INDEPENDENT_CONSTITUENTS/);
  });

  it("R3E-C05 NOT_REQUIRED composition does not require fake composite.", () => {
    expect(parseSemanticAtomicCompositionAudit(minimal()).compositionReports[0].composite).toBeNull();
  });

  it("R3E-C06 Required composition validates real composite.", () => {
    const value = minimal();
    value.verdict = "REVISE";
    value.compositionReports = [{ ...compositionNotRequired(), status: "INCOMPLETE", composite: composite() }];
    expect(parseSemanticAtomicCompositionAudit(value).compositionReports[0].composite?.compositeId).toBe("composite-any");
  });

  it("R3E-C07 Correct route does not require invented proposedRoute.", () => {
    expect(parseSemanticAtomicCompositionAudit(minimal()).routeAssessment.proposedRoute).toBeNull();
  });

  it("R3E-C08 Incorrect route requires valid proposedRoute.", () => {
    const invalid = minimal();
    invalid.verdict = "REVISE";
    invalid.routeAssessment = { ...correctRoute(), status: "INCORRECT", proposedRoute: null };
    expect(() => parseSemanticAtomicCompositionAudit(invalid)).toThrow(/INCORRECT_ROUTE_REQUIRES_PROPOSAL/);
    const valid = minimal();
    valid.verdict = "REVISE";
    valid.routeAssessment = { ...correctRoute(), status: "INCORRECT", proposedRoute: "DESIGN_STUDY" };
    expect(parseSemanticAtomicCompositionAudit(valid).routeAssessment.proposedRoute).toBe("DESIGN_STUDY");
  });

  it("R3E-C09 Unknown enum rejected.", () => {
    const value = minimal() as Record<string, unknown>;
    value.verdict = "PASS";
    expect(() => parseSemanticAtomicCompositionTransport(value)).toThrow();
  });

  it("R3E-C10 Missing required structural field rejected.", () => {
    const { routeAssessment: _missing, ...value } = minimal();
    expect(() => parseSemanticAtomicCompositionTransport(value)).toThrow();
  });

  it("R3E-C11 Provider-valid but semantically invalid response rejected internally.", () => {
    const value = minimal();
    value.compositionReports = [{ ...compositionNotRequired(), status: "COMPLETE" }];
    expect(() => parseSemanticAtomicCompositionTransport(value)).not.toThrow();
    expect(() => parseSemanticAtomicCompositionAudit(value)).toThrow(/COMPLETE_COMPOSITION_REQUIRES_EXISTING_COMPOSITE_EVIDENCE/);
  });

  it("R3E-C12 Internal-valid response is representable by provider schema.", () => {
    const internal = parseSemanticAtomicCompositionAudit(minimal());
    expect(parseSemanticAtomicCompositionTransport(internal)).toEqual(internal);
    expect(JSON.stringify(SEMANTIC_ATOMIC_COMPOSITION_AUDIT_JSON_SCHEMA)).toContain("NOT_REQUIRED");
  });

  it("R3E-C13 Round-trip preserves atomicity.", () => {
    const value = minimal();
    value.atomicityReports = [{ ...atomicNotApplicable(), status: "COMPLETE", constituents: [constituent("left"), constituent("right")] }];
    expect(roundTrip(value).atomicityReports).toEqual(parseSemanticAtomicCompositionAudit(value).atomicityReports);
  });

  it("R3E-C14 Round-trip preserves composition.", () => {
    const value = minimal();
    value.compositionReports = [{ ...compositionNotRequired(), status: "COMPLETE", composite: composite() }];
    expect(roundTrip(value).compositionReports).toEqual(parseSemanticAtomicCompositionAudit(value).compositionReports);
  });

  it("R3E-C15 Round-trip preserves route assessment.", () => {
    expect(roundTrip(minimal()).routeAssessment).toEqual(correctRoute());
  });

  it("R3E-C16 No fixture-specific mapping.", () => {
    const value = minimal();
    value.auditId = "arbitrary-case-without-benchmark-identity";
    value.atomicityReports[0].subjectInventoryItemIds = ["arbitrary-inventory-id"];
    expect(roundTrip(value).atomicityReports[0].subjectInventoryItemIds).toEqual(["arbitrary-inventory-id"]);
  });

  it("R3E-C17 Invalid output persists diagnostic payload safely.", async () => {
    const directory = await mkdtemp(join(tmpdir(), "sem-r3e-diagnostic-"));
    const path = await persistStructuredOutputFailure(directory, {
      caseId: "generic-case", stage: "ATOMIC_COMPOSITION_AUDIT", attempt: 1, timestamp: "2026-08-12T10:00:00.000Z",
      model: "gemini-model", promptVersion: "prompt-1", providerSchemaDigest: "provider-digest", internalSchemaDigest: "internal-digest",
      classification: "INTERNAL_INVARIANT_FAILURE", rawProviderStructuredResponse: "{\"status\":\"custom\"}",
      validationIssues: [{ path: "atomicityReports.0.status", code: "custom", message: "invalid" }],
    });
    const persisted = JSON.parse(await readFile(path, "utf8"));
    expect(persisted).toMatchObject({ caseId: "generic-case", classification: "INTERNAL_INVARIANT_FAILURE" });
    expect(persisted.rawProviderStructuredResponse).toContain("custom");
    expect((await stat(path)).mode & 0o777).toBe(0o600);
  });

  it("R3E-C18 Secret material is never persisted.", async () => {
    const directory = await mkdtemp(join(tmpdir(), "sem-r3e-secret-"));
    const secret = "AIzaEXAMPLE_SECRET_MATERIAL_123456789";
    const path = await persistStructuredOutputFailure(directory, {
      caseId: "secret-case", stage: "ATOMIC_COMPOSITION_AUDIT", attempt: 1, timestamp: "2026-08-12T10:00:00.000Z",
      model: "gemini-model", promptVersion: "prompt-1", providerSchemaDigest: "provider-digest", internalSchemaDigest: "internal-digest",
      classification: "PARSER_FAILURE", rawProviderStructuredResponse: `{"apiKey":"${secret}","authorization":"Bearer ${secret}"}`,
      validationIssues: [{ path: "root", code: "invalid_json", message: `token=${secret}` }],
    });
    const persisted = await readFile(path, "utf8");
    expect(persisted).not.toContain(secret);
    expect(persisted).toContain("REDACTED");
  });
});
