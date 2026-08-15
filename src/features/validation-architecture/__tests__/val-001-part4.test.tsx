import { readFileSync } from "node:fs";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { engageHumanDecision } from "@/features/protocol-designer/human-decision";
import ValidationSummaryPanel from "../ValidationSummaryPanel";
import { getValidationProductGate } from "../checkpoint-registry";
import { VAL001_CHECKPOINT_IDS } from "../invariant-registry";
import { buildValidationProductSummary, evaluateValidationProductGate, type ActiveValidationProductGateId } from "../product-gates";
import {
  VAL001_SEMANTIC_REVIEW_SCHEMA_VERSION,
  applySemanticReviewEvidenceToValidationRun,
  buildHumanDecisionTargetFromValidationReviewRequest,
  buildMinimalSemanticReviewPayload,
  buildSemanticReviewObservability,
  canReuseSemanticReviewResult,
  computeSemanticReviewConfigurationDigest,
  executeStructuredSemanticReview,
  inspectSemanticReviewPayloadForExternalUse,
  inspectSemanticReviewExecutionEligibility,
  resolveAfterSemanticReview,
  resolveValidationAfterHumanDecision,
  validateSemanticReviewResult,
  type SemanticReviewConfiguration,
  type SemanticValidationReviewer,
} from "../semantic-review";
import type { SemanticValidationReviewResult, ValidationProductFinding, ValidationRun } from "../product-contracts";
import { makeFinding, makeRun, makeSemanticReviewRequest, makeSnapshot } from "./val-001-part2-fixtures";

const CP = VAL001_CHECKPOINT_IDS;
const request = { ...makeSemanticReviewRequest(), invariantRefs: ["AUDIT-D:CRITICAL_NEGATION_LOST"] };
const sourceSnapshot = makeSnapshot({
  semanticObjects: [{ objectId: "source:concept", objectType: "Concept", label: "concept", status: "KNOWN", owner: "SOURCE", sourceRefs: [], provenanceRefs: ["source:evidence"], semanticKey: "concept", polarity: "NEGATED", role: "SUBJECT", attributes: {} }],
});
const targetSnapshot = makeSnapshot({
  reference: { ...sourceSnapshot.reference, artifactId: "target", artifactType: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION", owner: "TARGET", sourceOfTruth: false, contentDigest: "target-digest" },
  artifactKind: "SCIENTIFIC_INTERPRETATION_CONTRIBUTION",
  semanticObjects: [{ objectId: "target:concept", objectType: "Concept", label: "concept reformulé", status: "KNOWN", owner: "SOURCE", sourceRefs: ["source:concept"], provenanceRefs: ["target:evidence"], semanticKey: "concept", polarity: "NEGATED", role: "SUBJECT", attributes: {} }],
});
const observation = {
  observationId: "fixture-observation", checkpointId: request.checkpointRef.checkpointId, invariantRef: "AUDIT-D:CRITICAL_NEGATION_LOST", plane: "SEMANTIC_FIDELITY" as const,
  sourceRef: "source:concept", targetRef: "target:concept", observationType: "NON_MAPPED" as const, sourcePath: null, targetPath: null, sourceValueRef: "source:concept", targetValueRef: "target:concept", semanticKey: null,
  evidence: [{ evidenceId: "fixture-evidence", kind: "COMPARISON_NOTE" as const, sourcePath: null, targetPath: null, sourceObjectRef: "source:concept", targetObjectRef: "target:concept", exactSourceSpan: null, relationRef: null, decisionRef: null, provenanceRef: "source:evidence", digest: "evidence-digest", auditFindingRef: null, domainValidatorResultRef: null, comparisonNote: "pending" }],
  deterministic: false, confidenceKind: "SEMANTIC_REVIEW_PENDING" as const, technicalStatus: "SUCCESS" as const, limitations: [],
};

const configuration = (patch: Partial<SemanticReviewConfiguration> = {}): SemanticReviewConfiguration => ({
  reviewerId: "fixture-reviewer", reviewerVersion: "1.0.0", providerIdentity: "FIXTURE", modelIdentity: "fixture-model", promptVersion: "VAL-PROMPT-1.0", responseSchemaVersion: VAL001_SEMANTIC_REVIEW_SCHEMA_VERSION,
  canonicalizationVersion: "VAL001-CANONICAL-1.0.0", sourceSnapshotDigest: sourceSnapshot.snapshotDigest, targetSnapshotDigest: targetSnapshot.snapshotDigest, invariantRefs: [...request.invariantRefs], checkpointRef: request.checkpointRef, providerPolicy: "DISABLED_BY_DEFAULT",
  ...patch,
});

const result = (assessment: SemanticValidationReviewResult["invariantAssessments"][number]["assessment"] = "EQUIVALENT", patch: Partial<SemanticValidationReviewResult> = {}): SemanticValidationReviewResult => {
  const cfg = configuration();
  return {
    reviewId: `review:${assessment}`, requestId: request.requestId, status: "COMPLETE",
    invariantAssessments: [{ invariantRef: request.invariantRefs[0], assessment, evidenceRefs: ["source:evidence", "target:evidence"], sourceEvidenceRefs: ["source:evidence"], targetEvidenceRefs: ["target:evidence"], reasoningSummary: "Bounded comparison.", preservedDimensions: ["concept", "polarity"], changedDimensions: [], lostDimensions: [], addedDimensions: [], forbiddenPromotionsDetected: [], ambiguity: assessment === "AMBIGUOUS" ? "two mappings" : null, confidenceKind: "HIGH_SUPPORT", requiresHumanReview: assessment === "AMBIGUOUS", limitations: [] }],
    semanticEquivalenceAssessments: [{ sourceRef: "source:concept", targetRef: "target:concept", identityMatch: "DIFFERENT_ID", assessment, evidenceRefs: ["source:evidence", "target:evidence"] }],
    detectedLosses: [], detectedAdditions: [], detectedPromotions: [], ambiguities: assessment === "AMBIGUOUS" ? ["two mappings"] : [], contradictions: [], evidence: observation.evidence,
    confidenceKind: "SEMANTIC_REVIEW", requiresHumanReview: assessment === "AMBIGUOUS", limitations: [], sourceMutationAuthorized: false, targetMutationAuthorized: false, autoFixAllowed: false, autoDecisionAllowed: false,
    reviewerId: cfg.reviewerId, reviewerVersion: cfg.reviewerVersion, providerIdentity: cfg.providerIdentity, modelIdentity: cfg.modelIdentity, promptVersion: cfg.promptVersion, responseSchemaVersion: cfg.responseSchemaVersion,
    configurationDigest: computeSemanticReviewConfigurationDigest(cfg), sourceSnapshotDigest: cfg.sourceSnapshotDigest, targetSnapshotDigest: cfg.targetSnapshotDigest, rawResponseRef: "raw:1", technicalStatus: "SUCCESS",
    ...patch,
  };
};

const fixtureReviewer = (assessment: SemanticValidationReviewResult["invariantAssessments"][number]["assessment"]): SemanticValidationReviewer => ({
  reviewerId: "fixture-reviewer",
  version: "1.0.0",
  modelProviderIdentity: { provider: "FIXTURE", model: "fixture-model" },
  responseSchemaVersion: VAL001_SEMANTIC_REVIEW_SCHEMA_VERSION,
  promptVersion: "VAL-PROMPT-1.0",
  limitations: ["TEST_ONLY_NOT_A_PRODUCT_PROVIDER"],
  supports: (reviewRequest) => reviewRequest.invariantRefs.every((ref) => ref === "AUDIT-D:CRITICAL_NEGATION_LOST"),
  review: async () => result(assessment),
});

const semanticRun = () => makeRun({ invariantRefs: [...request.invariantRefs], semanticReviewRequests: [request], observations: [observation], sourceSnapshotDigest: sourceSnapshot.snapshotDigest, targetSnapshotDigest: targetSnapshot.snapshotDigest, status: "PENDING_SEMANTIC_REVIEW", historicalValidationStatus: "REVIEW_REQUIRED", semanticStatus: "REVIEW_REQUIRED", disposition: "REQUIRE_REVIEW" });

describe("VAL-001 Part 4 — Human Review boundary", () => {
  const humanRequest = { requestId: "human-review:1", validationRunId: "fixture-run", checkpointId: CP.scientificStateProject, findingRefs: ["fixture-finding"], questionIntent: "choose", reason: "human-owned", alternatives: ["a", "b"], evidence: observation.evidence, domainOwner: "RESEARCH_PROJECT", requiredMandate: "PROJECT_OWNER", blocking: true, limitations: [], boundary: "REVIEW_REQUEST_NOT_HUMAN_DECISION_ENVELOPE" as const };
  it("VAL4-HUM-C01 HumanReviewRequest n’est pas une Decision", () => expect(humanRequest).not.toHaveProperty("decisionId"));
  it("VAL4-HUM-C02 HumanReviewRequest pointe vers findings", () => expect(humanRequest.findingRefs).toEqual(["fixture-finding"]));
  it("VAL4-HUM-C03 HumanDecision reste owner humain", () => expect(buildHumanDecisionTargetFromValidationReviewRequest(humanRequest).engineSource).toBe("RESEARCH_PROJECT"));
  it("VAL4-HUM-C04 Decision sans actor rejetée", () => { const candidate = buildHumanDecisionTargetFromValidationReviewRequest(humanRequest); expect(resolveValidationAfterHumanDecision({ run: makeRun({ humanReviewRequests: [humanRequest] }), request: humanRequest, decision: candidate }).errors).toContain("HUMAN_DECISION_AUTHORITY_MISSING"); });
  it("VAL4-HUM-C05 Decision sans mandate rejetée", () => { const candidate = buildHumanDecisionTargetFromValidationReviewRequest(humanRequest); const incomplete = engageHumanDecision(candidate, { status: "ADOPTED", actor: "Charles", mandate: null, timestamp: "2026-08-15T00:00:00Z" }); expect(resolveValidationAfterHumanDecision({ run: makeRun({ humanReviewRequests: [humanRequest] }), request: humanRequest, decision: incomplete }).accepted).toBe(false); });
  it("VAL4-HUM-C06 Decision pour mauvaise request rejetée", () => { const candidate = buildHumanDecisionTargetFromValidationReviewRequest(humanRequest); const valid = engageHumanDecision(candidate, { status: "ADOPTED", actor: "Charles", mandate: "PROJECT_OWNER", timestamp: "2026-08-15T00:00:00Z" }); expect(resolveValidationAfterHumanDecision({ run: makeRun({ humanReviewRequests: [humanRequest] }), request: { ...humanRequest, requestId: "other" }, decision: valid }).accepted).toBe(false); });
  it("VAL4-HUM-C07 Human resolution référencée sans modifier ancien run", () => { const run = makeRun({ humanReviewRequests: [humanRequest] }); const before = JSON.stringify(run); const valid = engageHumanDecision(buildHumanDecisionTargetFromValidationReviewRequest(humanRequest), { status: "ADOPTED", actor: "Charles", mandate: "PROJECT_OWNER", timestamp: "2026-08-15T00:00:00Z" }); const resolved = resolveValidationAfterHumanDecision({ run, request: humanRequest, decision: valid }); expect(resolved.outcomeReference?.humanDecisionId).toBe(valid.decisionId); expect(JSON.stringify(run)).toBe(before); });
  it("VAL4-HUM-C08 Project change après Human Decision crée nouveau run", () => { const run = makeRun({ humanReviewRequests: [humanRequest] }); const valid = engageHumanDecision(buildHumanDecisionTargetFromValidationReviewRequest(humanRequest), { status: "ADOPTED", actor: "Charles", mandate: "PROJECT_OWNER", timestamp: "2026-08-15T00:00:00Z" }); expect(resolveValidationAfterHumanDecision({ run, request: humanRequest, decision: valid, reasonForRevalidation: "PROJECT_OWNER_NEW_VERSION" }).run.previousRunRef).toBe(run.validationRunId); });
  it("VAL4-HUM-C09 Human override conserve finding historique", () => { const finding = makeFinding(); const run = makeRun({ findings: [finding], humanReviewRequests: [humanRequest] }); const valid = engageHumanDecision(buildHumanDecisionTargetFromValidationReviewRequest(humanRequest), { status: "ADOPTED", actor: "Charles", mandate: "PROJECT_OWNER", timestamp: "2026-08-15T00:00:00Z" }); expect(resolveValidationAfterHumanDecision({ run, request: humanRequest, decision: valid }).run.findings).toEqual([finding]); });
  it("VAL4-HUM-C10 Aucun second Decision system", () => { const code = readFileSync("src/features/validation-architecture/semantic-review.ts", "utf8"); expect(code).not.toMatch(/type\s+(ValidationDecision|VALDecision|ValidationArbitrationDecision)/); });
  it("rejects a decision whose mandate differs from the review requirement", () => { const validShape = engageHumanDecision(buildHumanDecisionTargetFromValidationReviewRequest(humanRequest), { status: "ADOPTED", actor: "Charles", mandate: "OTHER_MANDATE", timestamp: "2026-08-15T00:00:00Z" }); expect(resolveValidationAfterHumanDecision({ run: makeRun({ humanReviewRequests: [humanRequest] }), request: humanRequest, decision: validShape }).errors).toContain("HUMAN_DECISION_MANDATE_MISMATCH"); });
  it("does not resolve findings on a deferred decision", () => { const deferred = engageHumanDecision(buildHumanDecisionTargetFromValidationReviewRequest(humanRequest), { status: "DEFERRED", actor: "Charles", mandate: "PROJECT_OWNER", timestamp: "2026-08-15T00:00:00Z" }); const resolved = resolveValidationAfterHumanDecision({ run: makeRun({ findings: [makeFinding()], humanReviewRequests: [humanRequest] }), request: humanRequest, decision: deferred }); expect(resolved.run.findingLifecycleRefs?.[0]?.status).toBe("REVIEW_REQUIRED"); expect(resolved.run.historicalValidationStatus).toBe("REVIEW_REQUIRED"); });
  it("does not accept a review request absent from the validation run", () => { const valid = engageHumanDecision(buildHumanDecisionTargetFromValidationReviewRequest(humanRequest), { status: "ADOPTED", actor: "Charles", mandate: "PROJECT_OWNER", timestamp: "2026-08-15T00:00:00Z" }); expect(resolveValidationAfterHumanDecision({ run: makeRun(), request: humanRequest, decision: valid }).errors).toContain("HUMAN_REVIEW_REQUEST_NOT_ATTACHED_TO_RUN"); });
});

describe("VAL-001 Part 4 — Semantic Review contract", () => {
  it("VAL4-SEM-C01 Semantic review uniquement après déterministe", () => { const run = semanticRun(); expect(inspectSemanticReviewExecutionEligibility({ run, request, payload: buildMinimalSemanticReviewPayload(request, sourceSnapshot, targetSnapshot, [observation]) }).eligible).toBe(true); expect(inspectSemanticReviewExecutionEligibility({ run: { ...run, deterministicResult: "NOT_RUN" }, request, payload: buildMinimalSemanticReviewPayload(request, sourceSnapshot, targetSnapshot, [observation]) }).reasons).toContain("DETERMINISTIC_VALIDATION_NOT_COMPLETE"); });
  it("VAL4-SEM-C02 Semantic review uniquement si eligible", () => expect(request.invariantRefs).toContain("AUDIT-D:CRITICAL_NEGATION_LOST"));
  it("VAL4-SEM-C03 Semantic review non déclenchée si niveau H direct", () => expect(semanticRun().semanticReviewRequests.every((item) => !item.invariantRefs.includes("PROJECT:HUMAN_DECISION_REQUIRED"))).toBe(true));
  it("VAL4-SEM-C04 Reviewer reçoit snapshots immuables", () => { const payload = buildMinimalSemanticReviewPayload(request, sourceSnapshot, targetSnapshot, [observation]); expect(sourceSnapshot.snapshotDigest).toBe(payload.source.snapshotDigest); expect(targetSnapshot.snapshotDigest).toBe(payload.target.snapshotDigest); });
  it("VAL4-SEM-C05 Reviewer ne reçoit pas Project repository", () => expect(buildMinimalSemanticReviewPayload(request, sourceSnapshot, targetSnapshot, [observation])).not.toHaveProperty("repository"));
  it("VAL4-SEM-C06 Reviewer ne peut pas renvoyer corrected target", () => expect(validateSemanticReviewResult(request, { ...result(), correctedTarget: {} } as unknown as SemanticValidationReviewResult).errors).toContain("SEMANTIC_REVIEW_FORBIDDEN_FIELD:correctedTarget"));
  it("VAL4-SEM-C07 Reviewer ne peut pas renvoyer adoption decision", () => expect(validateSemanticReviewResult(request, { ...result(), adopt: true } as unknown as SemanticValidationReviewResult).errors).toContain("SEMANTIC_REVIEW_FORBIDDEN_FIELD:adopt"));
  it("VAL4-SEM-C08 Evidence refs obligatoires", () => { const invalid = result("EQUIVALENT"); invalid.invariantAssessments[0].evidenceRefs = []; invalid.invariantAssessments[0].sourceEvidenceRefs = []; invalid.invariantAssessments[0].targetEvidenceRefs = []; expect(validateSemanticReviewResult(request, invalid).valid).toBe(false); });
  it("VAL4-SEM-C09 Different ID n’implique pas not equivalent", () => expect(result().semanticEquivalenceAssessments[0]?.assessment).toBe("EQUIVALENT"));
  it("VAL4-SEM-C10 Same label n’implique pas equivalent", () => expect(result("NOT_EQUIVALENT").semanticEquivalenceAssessments[0]?.assessment).toBe("NOT_EQUIVALENT"));
  it("VAL4-SEM-C11 Negation fait partie des dimensions obligatoires", () => expect(result().invariantAssessments[0]?.preservedDimensions).toContain("polarity"));
  it("VAL4-SEM-C12 Causality fait partie des dimensions obligatoires", () => { const value = result(); value.invariantAssessments[0].changedDimensions = ["causality"]; expect(value.invariantAssessments[0].changedDimensions).toContain("causality"); });
  it("VAL4-SEM-C13 Temporal context fait partie des dimensions obligatoires", () => { const value = result(); value.invariantAssessments[0].preservedDimensions = ["temporality"]; expect(value.invariantAssessments[0].preservedDimensions).toContain("temporality"); });
  it("VAL4-SEM-C14 Ownership fait partie des dimensions obligatoires", () => { const value = result(); value.invariantAssessments[0].preservedDimensions = ["ownership"]; expect(value.invariantAssessments[0].preservedDimensions).toContain("ownership"); });
  it("VAL4-SEM-C15 Epistemic status fait partie des dimensions obligatoires", () => { const value = result(); value.invariantAssessments[0].preservedDimensions = ["epistemic-status"]; expect(value.invariantAssessments[0].preservedDimensions).toContain("epistemic-status"); });
  it("VAL4-SEM-C16 Ambiguous reste ambiguous", () => expect(resolveAfterSemanticReview({ run: semanticRun(), request, result: result("AMBIGUOUS"), configuration: configuration() }).humanReviewRequests.length).toBeGreaterThan(0));
  it("VAL4-SEM-C17 Insufficient evidence reste insufficient", () => expect(resolveAfterSemanticReview({ run: semanticRun(), request, result: result("INSUFFICIENT_EVIDENCE"), configuration: configuration() }).disposition).toBe("REQUIRE_HUMAN_DECISION"));
  it("VAL4-SEM-C18 Niveau H reste Human Review malgré semantic support", () => { const hRequest = { ...request, invariantRefs: ["PROJECT:HUMAN_DECISION_REQUIRED"] }; const hResult = result("EQUIVALENT", { requestId: hRequest.requestId, invariantAssessments: [{ invariantRef: "PROJECT:HUMAN_DECISION_REQUIRED", assessment: "EQUIVALENT", evidenceRefs: ["s", "t"], sourceEvidenceRefs: ["s"], targetEvidenceRefs: ["t"] }] }); expect(resolveAfterSemanticReview({ run: semanticRun(), request: hRequest, result: hResult }).humanReviewRequests.length).toBeGreaterThan(0); });
  it("VAL4-SEM-C19 Aucun repair LLM", () => expect(readFileSync("src/features/validation-architecture/semantic-review.ts", "utf8")).not.toMatch(/repairLlm|repairWithModel|regenerateForMeaning/i));
  it("VAL4-SEM-C20 Aucun adjudicator", () => expect(readFileSync("src/features/validation-architecture/semantic-review.ts", "utf8")).not.toMatch(/class\s+.*Adjudicator|createAdjudicator/i));
});

describe("VAL-001 Part 4 — configuration and structured output", () => {
  const fields: Array<[string, Partial<SemanticReviewConfiguration>]> = [
    ["VAL4-CFG-C01 Prompt version incluse", { promptVersion: "v2" }],
    ["VAL4-CFG-C02 Schema version incluse", { responseSchemaVersion: "VAL-001-SEMANTIC-REVIEW-1.1" as typeof VAL001_SEMANTIC_REVIEW_SCHEMA_VERSION }],
    ["VAL4-CFG-C03 Model identity incluse", { modelIdentity: "model-b" }],
    ["VAL4-CFG-C04 Reviewer version incluse", { reviewerVersion: "2" }],
    ["VAL4-CFG-C05 Source digest incluse", { sourceSnapshotDigest: "source-b" }],
    ["VAL4-CFG-C06 Target digest incluse", { targetSnapshotDigest: "target-b" }],
    ["VAL4-CFG-C07 Invariant refs incluses", { invariantRefs: ["VAL-C08", "DOC:NO_WRITE_BACK"] }],
    ["VAL4-CFG-C08 Configuration différente → digest différent", { providerIdentity: "provider-b" }],
  ];
  it.each(fields)("%s", (_name, patch) => expect(computeSemanticReviewConfigurationDigest(configuration(patch))).not.toBe(computeSemanticReviewConfigurationDigest(configuration())));
  it("VAL4-CFG-C09 Raw response préservée avant parse", async () => { const order: string[] = []; const cfg = configuration({ providerPolicy: "EXPLICITLY_ENABLED" }); const output = result("EQUIVALENT", { configurationDigest: computeSemanticReviewConfigurationDigest(cfg) }); const value = await executeStructuredSemanticReview({ request, payload: buildMinimalSemanticReviewPayload(request, sourceSnapshot, targetSnapshot, [observation]), configuration: cfg, transport: { transportId: "fixture", execute: async () => ({ providerStatus: "SUCCESS", rawResponse: JSON.stringify(output), providerRequestId: "p" }) }, rawStore: { persistBeforeParse: async () => { order.push("raw"); return { rawResponseRef: "raw" }; } }, parse: (raw) => { order.push("parse"); return JSON.parse(raw); } }); expect(order).toEqual(["raw", "parse"]); expect(value.rawResponseRef).toBe("raw"); });
  it("VAL4-CFG-C10 Invalid structured output ne déclenche pas semantic repair", async () => { let calls = 0; const cfg = configuration({ providerPolicy: "EXPLICITLY_ENABLED" }); const value = await executeStructuredSemanticReview({ request, payload: buildMinimalSemanticReviewPayload(request, sourceSnapshot, targetSnapshot, [observation]), configuration: cfg, transport: { transportId: "fixture", execute: async () => { calls += 1; return { providerStatus: "SUCCESS", rawResponse: "null", providerRequestId: null }; } }, rawStore: { persistBeforeParse: async () => ({ rawResponseRef: "raw" }) }, parse: JSON.parse }); expect(calls).toBe(1); expect(value.technicalStatus).toBe("INVALID_STRUCTURED_OUTPUT"); });
  it("VAL4-CFG-C11 Model fallback silencieux interdit", () => expect(readFileSync("src/features/validation-architecture/semantic-review.ts", "utf8")).not.toMatch(/fallbackModel|alternateModel/i));
  it("VAL4-CFG-C12 Mixed configuration cache interdit", () => expect(computeSemanticReviewConfigurationDigest(configuration({ modelIdentity: "a" }))).not.toBe(computeSemanticReviewConfigurationDigest(configuration({ modelIdentity: "b" }))));
});

describe("VAL-001 Part 4 — bounded semantic scenarios", () => {
  it("TEST-58 distributed equivalent structure does not create semantic loss", async () => {
    const run = semanticRun();
    const before = JSON.stringify(run);
    const reviewer = fixtureReviewer("EQUIVALENT");
    expect(reviewer.supports(request)).toBe(true);
    const resolved = resolveAfterSemanticReview({ run, request, result: await reviewer.review(request, buildMinimalSemanticReviewPayload(request, sourceSnapshot, targetSnapshot, [observation])), configuration: configuration() });
    expect(resolved.findings).toHaveLength(0);
    expect(resolved.status).toBe("COMPLETE");
    expect(JSON.stringify(run)).toBe(before);
  });

  it("TEST-59 same label with different meaning remains non-equivalent", () => {
    const value = result("NOT_EQUIVALENT");
    value.invariantAssessments[0].changedDimensions = ["ownership", "role"];
    const resolved = resolveAfterSemanticReview({ run: semanticRun(), request, result: value, configuration: configuration() });
    expect(resolved.findings[0]?.findingClass).toBe("SEMANTIC_OWNER_CHANGE");
  });

  it("TEST-60 polarity loss is classified explicitly", () => {
    const value = result("NOT_EQUIVALENT");
    value.invariantAssessments[0].changedDimensions = ["polarity"];
    const resolved = resolveAfterSemanticReview({ run: semanticRun(), request, result: value, configuration: configuration() });
    expect(resolved.findings[0]?.findingClass).toBe("SEMANTIC_POLARITY_CHANGE");
  });

  it("TEST-61 association promoted to causality is a semantic promotion", () => {
    const value = result("NOT_EQUIVALENT");
    value.invariantAssessments[0].changedDimensions = ["causality"];
    value.detectedPromotions = ["association-to-causality"];
    const resolved = resolveAfterSemanticReview({ run: semanticRun(), request, result: value, configuration: configuration() });
    expect(resolved.findings[0]?.findingClass).toBe("SEMANTIC_PROMOTION");
    expect(resolved.findings[0]?.automaticCorrectionAllowed).toBe(false);
  });

  it("TEST-62 composition can be equivalent with qualification", () => {
    const resolved = resolveAfterSemanticReview({ run: semanticRun(), request, result: result("EQUIVALENT_WITH_QUALIFICATION"), configuration: configuration() });
    expect(resolved.findings[0]?.findingClass).toBe("SEMANTIC_EQUIVALENCE_QUALIFIED");
  });

  it("TEST-63 semantic information distributed across fields stays pending before review", () => {
    expect(semanticRun().status).toBe("PENDING_SEMANTIC_REVIEW");
    expect(semanticRun().findings).toHaveLength(0);
  });

  it("TEST-64 ambiguity escalates without selecting a mapping", () => {
    const resolved = resolveAfterSemanticReview({ run: semanticRun(), request, result: result("AMBIGUOUS"), configuration: configuration() });
    expect(resolved.status).toBe("PENDING_HUMAN_REVIEW");
    expect(resolved.humanReviewRequests[0]?.alternatives).toEqual([]);
    expect(resolved.targetMutationAuthorized).toBe(false);
  });

  it("TEST-65 insufficient evidence is never equivalent by default", () => {
    const resolved = resolveAfterSemanticReview({ run: semanticRun(), request, result: result("INSUFFICIENT_EVIDENCE"), configuration: configuration() });
    expect(resolved.semanticStatus).toBe("REVIEW_REQUIRED");
    expect(resolved.humanReviewRequests).toHaveLength(1);
  });

  it("TEST-67 incomplete structured output fails technically without semantic finding", async () => {
    const cfg = configuration({ providerPolicy: "EXPLICITLY_ENABLED" });
    const value = await executeStructuredSemanticReview({ request, payload: buildMinimalSemanticReviewPayload(request, sourceSnapshot, targetSnapshot, [observation]), configuration: cfg, transport: { transportId: "fixture", execute: async () => ({ providerStatus: "SUCCESS", rawResponse: '{"reviewId":"incomplete"}', providerRequestId: "p" }) }, rawStore: { persistBeforeParse: async () => ({ rawResponseRef: "raw:incomplete" }) }, parse: JSON.parse });
    expect(value.technicalStatus).toBe("INVALID_STRUCTURED_OUTPUT");
    expect(value.invariantAssessments).toEqual([]);
  });

  it("TEST-68 provider failure remains technical", async () => {
    const cfg = configuration({ providerPolicy: "EXPLICITLY_ENABLED" });
    const value = await executeStructuredSemanticReview({ request, payload: buildMinimalSemanticReviewPayload(request, sourceSnapshot, targetSnapshot, [observation]), configuration: cfg, transport: { transportId: "fixture", execute: async () => ({ providerStatus: "PROVIDER_UNAVAILABLE", rawResponse: "unavailable", providerRequestId: null }) }, rawStore: { persistBeforeParse: async () => ({ rawResponseRef: "raw:failure" }) }, parse: JSON.parse });
    expect(value.technicalStatus).toBe("PROVIDER_UNAVAILABLE");
    expect(value.invariantAssessments).toEqual([]);
  });

  it("TEST-69 model identity drift makes exact replay ineligible", () => {
    expect(canReuseSemanticReviewResult(result(), configuration({ modelIdentity: "other-model" }))).toBe(false);
  });

  it("TEST-70 changed target digest makes old review stale", () => {
    expect(canReuseSemanticReviewResult(result(), configuration({ targetSnapshotDigest: "new-target" }))).toBe(false);
  });

  it("observability separates avoided, deferred and not-required reviews", () => {
    const metrics = buildSemanticReviewObservability({ runs: [semanticRun()], deterministicAvoidedInvariantRefs: ["VAL-C01", "VAL-C01"], deferredInvariantRefs: ["VAL-C08"], notRequiredInvariantRefs: ["VAL-C02"] });
    expect(metrics.callsAvoidedByDeterministicValidation).toBe(1);
    expect(metrics.deferred).toBe(1);
    expect(metrics.notRequired).toBe(1);
    expect(metrics.semanticReviewCalls).toBe(0);
  });
});

const runsForGate = (gateId: ActiveValidationProductGateId, patch?: (run: ValidationRun, index: number) => Partial<ValidationRun>) => {
  const gate = getValidationProductGate(gateId)!;
  return gate.requiredCheckpoints.map((checkpointId, index) => makeRun({ checkpointRef: { checkpointId, version: "1.0.0" }, ...(patch?.(makeRun(), index) ?? {}) }));
};

describe("VAL-001 Part 4 — product gates", () => {
  it("VAL4-GATE-C01 Candidate preview reste accessible avec blocker", () => { const runs = runsForGate("CANDIDATE_PREVIEW", (_run, index) => index === 0 ? { findings: [makeFinding({ blocking: true, severity: "BLOCKING" })] } : {}); expect(evaluateValidationProductGate("CANDIDATE_PREVIEW", runs).status).toBe("PREVIEW_ONLY"); });
  it("VAL4-GATE-C02 Critical ownership finding bloque adoption", () => { const runs = runsForGate("CONTRIBUTION_ADOPTION", (_run, index) => index === 0 ? { findings: [makeFinding({ blocking: true, severity: "BLOCKING", findingClass: "OWNERSHIP_VIOLATION" })] } : {}); expect(evaluateValidationProductGate("CONTRIBUTION_ADOPTION", runs).status).toBe("BLOCKED"); });
  it("VAL4-GATE-C03 Missing Human Decision bloque adoption", () => { const runs = runsForGate("CONTRIBUTION_ADOPTION", (_run, index) => index === 0 ? { status: "PENDING_HUMAN_REVIEW", humanReviewRequests: [{ requestId: "h", validationRunId: "r", checkpointId: CP.scientificStateProject, findingRefs: [], questionIntent: "q", reason: "r", alternatives: [], evidence: [], domainOwner: "RESEARCH_PROJECT", requiredMandate: "OWNER", blocking: true, limitations: [], boundary: "REVIEW_REQUEST_NOT_HUMAN_DECISION_ENVELOPE" }] } : {}); expect(evaluateValidationProductGate("CONTRIBUTION_ADOPTION", runs).status).toBe("REVIEW_REQUIRED"); });
  it("VAL4-GATE-C04 Warning simple ne bloque pas adoption", () => { const runs = runsForGate("CONTRIBUTION_ADOPTION", (_run, index) => index === 0 ? { findings: [makeFinding()] } : {}); expect(evaluateValidationProductGate("CONTRIBUTION_ADOPTION", runs).status).not.toBe("BLOCKED"); });
  it("VAL4-GATE-C05 Project freeze exige tous checkpoints requis", () => expect(evaluateValidationProductGate("PROJECT_FREEZE", []).status).toBe("BLOCKED"));
  it("VAL4-GATE-C06 Pending required Semantic Review bloque freeze", () => { const runs = runsForGate("PROJECT_FREEZE", (_run, index) => index === 0 ? { status: "PENDING_SEMANTIC_REVIEW", semanticReviewRequests: [request] } : {}); expect(evaluateValidationProductGate("PROJECT_FREEZE", runs).status).toBe("BLOCKED"); });
  it("VAL4-GATE-C07 Pending Human Review bloque freeze", () => { const runs = runsForGate("PROJECT_FREEZE", (_run, index) => index === 0 ? { status: "PENDING_HUMAN_REVIEW", humanReviewRequests: [{ requestId: "h", validationRunId: "r", checkpointId: CP.scientificStateProject, findingRefs: [], questionIntent: "q", reason: "r", alternatives: [], evidence: [], domainOwner: "RESEARCH_PROJECT", requiredMandate: "OWNER", blocking: true, limitations: [], boundary: "REVIEW_REQUEST_NOT_HUMAN_DECISION_ENVELOPE" }] } : {}); expect(evaluateValidationProductGate("PROJECT_FREEZE", runs).status).toBe("BLOCKED"); });
  it("VAL4-GATE-C08 Technical failure requis bloque freeze", () => { const runs = runsForGate("PROJECT_FREEZE", (_run, index) => index === 0 ? { status: "TECHNICAL_FAILURE", technicalStatus: "PROVIDER_UNAVAILABLE", semanticStatus: "NOT_EVALUABLE" } : {}); expect(evaluateValidationProductGate("PROJECT_FREEZE", runs).status).toBe("NOT_EVALUABLE"); });
  it("VAL4-GATE-C09 NOT_APPLICABLE n’empêche pas freeze", () => { const runs = runsForGate("PROJECT_FREEZE", (_run, index) => index === 0 ? { status: "NOT_APPLICABLE", semanticStatus: "NOT_APPLICABLE", disposition: "NOT_APPLICABLE" } : {}); expect(evaluateValidationProductGate("PROJECT_FREEZE", runs).status).toBe("ALLOWED_WITH_LIMITATIONS"); });
  it("VAL4-GATE-C10 Protocol section NOT_GENERATABLE reste non générable", () => { const runs = runsForGate("PROTOCOL_GENERATION", (_run, index) => index === 0 ? { findings: [makeFinding({ invariantRef: "DOC:NOT_GENERATABLE_PRESERVED", severity: "WARNING", blocking: false })] } : {}); expect(evaluateValidationProductGate("PROTOCOL_GENERATION", runs).status).toBe("ALLOWED_WITH_LIMITATIONS"); });
  it("VAL4-GATE-C11 DMP peut rester generatable with limitations", () => { const runs = runsForGate("DMP_GENERATION", (_run, index) => index === 0 ? { limitations: ["UNKNOWN_POLICY"] } : {}); expect(evaluateValidationProductGate("DMP_GENERATION", runs).status).toBe("ALLOWED_WITH_LIMITATIONS"); });
  it("VAL4-GATE-C12 SAP ne devient pas générable si méthode requise UNKNOWN", () => { const runs = runsForGate("SAP_GENERATION", (_run, index) => index === 0 ? { findings: [makeFinding({ severity: "ERROR", blocking: true, invariantRef: "DOC:NOT_GENERATABLE_PRESERVED" })] } : {}); expect(evaluateValidationProductGate("SAP_GENERATION", runs).status).toBe("BLOCKED"); });
  it("VAL4-GATE-C13 V1_READY ≠ PD-011 PASS", () => expect(evaluateValidationProductGate("V1_READY", runsForGate("V1_READY")).limitations.join(" ")).toContain("never a PD-011"));
  it("VAL4-GATE-C14 Gate ne modifie jamais Project", () => { const runs = runsForGate("PROJECT_FREEZE"); const before = JSON.stringify(runs); evaluateValidationProductGate("PROJECT_FREEZE", runs); expect(JSON.stringify(runs)).toBe(before); });
  it("VAL4-GATE-C15 Gate ne modifie jamais DocumentProjection", () => { const runs = runsForGate("PROTOCOL_GENERATION"); expect(evaluateValidationProductGate("PROTOCOL_GENERATION", runs).documentWriteAuthorized).toBe(false); });
});

describe("VAL-001 Part 4 — product UI", () => {
  const blockingFinding: ValidationProductFinding = makeFinding({ findingId: "visible-blocker", blocking: true, severity: "BLOCKING" });
  const summary = buildValidationProductSummary([makeRun({ findings: [blockingFinding], limitations: ["UNKNOWN_METHOD"], status: "COMPLETE_WITH_FINDINGS" })]);
  it("VAL4-UI-C01 Validation summary visible", () => { render(<ValidationSummaryPanel summary={summary} />); expect(screen.getByText("Validation")).toBeInTheDocument(); });
  it("VAL4-UI-C02 Blockers visibles", () => { render(<ValidationSummaryPanel summary={summary} />); expect(screen.getByText("Ce qui bloque")).toBeInTheDocument(); });
  it("VAL4-UI-C03 Review required visible", () => { const reviewSummary = buildValidationProductSummary([semanticRun()]); render(<ValidationSummaryPanel summary={reviewSummary} />); expect(screen.getByText("Votre avis est nécessaire")).toBeInTheDocument(); });
  it("VAL4-UI-C04 Unknowns distingués des failures", () => { render(<ValidationSummaryPanel summary={summary} />); expect(screen.getByText("Informations encore inconnues")).toBeInTheDocument(); });
  it("VAL4-UI-C05 NOT_EVALUABLE distingué de PASS", () => { render(<ValidationSummaryPanel summary={buildValidationProductSummary([])} />); expect(screen.getByText("Validation non évaluable")).toBeInTheDocument(); });
  it("VAL4-UI-C06 Mode standard masque IDs/digests", () => { render(<ValidationSummaryPanel summary={summary} />); expect(screen.queryByText("fixture-run")).not.toBeInTheDocument(); });
  it("VAL4-UI-C07 Mode expert montre checkpoint/invariants/evidence", () => { render(<ValidationSummaryPanel summary={summary} mode="EXPERT" />); expect(screen.getByText(/VAL-REQUEST-INTERPRETATION-001/)).toBeInTheDocument(); });
  it("VAL4-UI-C08 Human Review action disponible", () => { const callback = vi.fn(); const reviewSummary = buildValidationProductSummary([semanticRun()]); render(<ValidationSummaryPanel summary={reviewSummary} onHumanReview={callback} />); fireEvent.click(screen.getByText("Examiner")); expect(callback).toHaveBeenCalled(); });
  it("VAL4-UI-C09 Semantic Review pending visible sans appel automatique", () => { const reviewer = vi.fn(); render(<ValidationSummaryPanel summary={buildValidationProductSummary([semanticRun()])} onHumanReview={reviewer} />); expect(reviewer).not.toHaveBeenCalled(); });
  it("VAL4-UI-C10 Candidate preview marqué NOT_ADOPTED", () => expect(evaluateValidationProductGate("CANDIDATE_PREVIEW", runsForGate("CANDIDATE_PREVIEW")).candidatePreview?.labels).toContain("NOT_ADOPTED"));
  it("VAL4-UI-C11 Historical run consultable sans mutation", () => { const before = JSON.stringify(summary); render(<ValidationSummaryPanel summary={summary} mode="EXPERT" />); expect(JSON.stringify(summary)).toBe(before); });
  it("VAL4-UI-C12 Aucun score global inventé", () => expect(summary.overallScore).toBeNull());
  it("VAL4-UI-C13 Aucun bouton Auto-fix", () => { render(<ValidationSummaryPanel summary={summary} />); expect(screen.queryByText(/Auto-fix/i)).not.toBeInTheDocument(); });
  it("VAL4-UI-C14 Aucun bouton Accept AI Decision", () => { render(<ValidationSummaryPanel summary={summary} />); expect(screen.queryByText(/Accept AI Decision/i)).not.toBeInTheDocument(); });
  it("VAL4-UI-C15 Aucune action provider au simple render", () => expect(summary.providerCallsOnRender).toBe(0));
});

describe("VAL-001 Part 4 — external boundary", () => {
  it("rejects Blind content before external use", () => { const payload = buildMinimalSemanticReviewPayload(request, sourceSnapshot, targetSnapshot, [observation]); const unsafe = { ...payload, blind: true }; expect(inspectSemanticReviewPayloadForExternalUse(unsafe as never).allowed).toBe(false); });
  it("rejects sensitive values even when hidden in ordinary text fields", () => { const payload = buildMinimalSemanticReviewPayload(request, sourceSnapshot, targetSnapshot, [observation]); const unsafe = { ...payload, question: "patientId=12345" }; expect(inspectSemanticReviewPayloadForExternalUse(unsafe).violations.join(" ")).toContain("PATIENT_IDENTIFIER_FORBIDDEN"); });
  it("minimizes unrelated snapshot context", () => { const source = makeSnapshot({ ...sourceSnapshot, unknowns: ["unrelated unknown"], contradictions: ["unrelated contradiction"], limitations: ["unrelated limitation"] }); const payload = buildMinimalSemanticReviewPayload(request, source, targetSnapshot, [observation]); expect(payload.source.unknowns).toEqual([]); expect(payload.source.contradictions).toEqual([]); expect(payload.source.limitations).toEqual([]); });
  it("applies semantic evidence without mutating the prior run", () => { const run = semanticRun(); const before = JSON.stringify(run); expect(applySemanticReviewEvidenceToValidationRun(run, result()).previousRunRef).toBe(run.validationRunId); expect(JSON.stringify(run)).toBe(before); });
});
