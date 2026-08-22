import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SCIENTIFIC_INTERPRETATION_MODE,
  FixtureReplayScientificInterpretationAdapter,
  InMemoryScientificInterpretationRawStore,
  SCIENTIFIC_INTERPRETATION_API_VERSION,
  SEMANTIC_AUDIT_L_STATUS,
  ScientificInterpretationTechnicalError,
  appendScientificInterpretationExecution,
  auditScientificInterpretationContribution,
  contributionToKnowledgeRequest,
  createScientificInterpretationSession,
  executeScientificInterpretation,
  mapHybridStateToContribution,
  migrateLegacySemanticSession,
  projectScientificContributionToV1IfAllowed,
  scientificContributionStableJson,
  type ScientificInterpretationApiResponse,
  type ScientificInterpretationContributionEnvelope,
  type ScientificInterpretationConversation,
  type ScientificInterpretationReplayRecord,
  type ScientificInterpretationRuntime,
} from "..";

const ROOT = process.cwd();
const RESULT_ROOT = resolve(ROOT, "experiments/engine-lab/results/hybrid-runtime-prototype-01");
const source = (path: string) => readFileSync(resolve(ROOT, path), "utf8");

const conversation: ScientificInterpretationConversation = {
  conversationId: "closure-conversation",
  language: "fr",
  turns: [{ turnId: "T0", role: "USER", content: "Comparer la méthode alpha à la méthode beta sans conclure à une causalité." }],
};

const baseState = () => ({
  identity: { stateId: "closure-state", conversationId: conversation.conversationId, generatedAt: "2026-08-14T20:00:00.000Z" },
  source: { originalRequest: conversation.turns[0].content, turns: conversation.turns },
  technicalStatus: "STRUCTURED_CONTRACT_VALID",
  understanding: { normalizedUnderstanding: "Comparaison non causale entre deux méthodes." },
  objects: [
    { elementId: "alpha", content: "méthode alpha", semanticIdentity: "alpha", semanticType: "METHOD", studyRole: "INTERVENTION_ARM", sourceTurnIds: ["T0"], sourceText: "méthode alpha", polarity: "AFFIRMED", ownership: "USER", epistemicStatus: "EXPLICIT_USER_STATED", activeState: true, previousElementIds: [], evidenceRefs: [], confidence: 1, adoptionStatus: null },
    { elementId: "beta", content: "méthode beta", semanticIdentity: "beta", semanticType: "METHOD", studyRole: "COMPARATOR_ARM", sourceTurnIds: ["T0"], sourceText: "méthode beta", polarity: "AFFIRMED", ownership: "USER", epistemicStatus: "EXPLICIT_USER_STATED", activeState: true, previousElementIds: [], evidenceRefs: [], confidence: 1, adoptionStatus: null },
  ],
  relations: [{ relationId: "compare", relationType: "COMPARED_WITH", sourceElementId: "alpha", targetElementId: "beta", sourceTurnIds: ["T0"], sourceText: "Comparer la méthode alpha à la méthode beta", polarity: "AFFIRMED", ownership: "USER", epistemicStatus: "EXPLICIT_USER_STATED", activeState: true, evidenceRefs: [], confidence: 1 }],
  explicitStatements: [], inferredContext: [], contextualCandidates: [], negationsAndConstraints: [
    { elementId: "no-causality", content: "sans conclure à une causalité", semanticIdentity: "no-causality", semanticType: "CONSTRAINT", studyRole: "SCIENTIFIC_CONSTRAINT", sourceTurnIds: ["T0"], sourceText: "sans conclure à une causalité", polarity: "NEGATED", ownership: "USER", epistemicStatus: "EXPLICIT_USER_STATED", activeState: true, previousElementIds: [], evidenceRefs: [], confidence: 1, adoptionStatus: null },
  ], temporalElements: [],
  ambiguities: [], unknowns: [], missingInformation: [], correctionsAndSupersessions: [], openDecisions: [], clarificationNeeds: [],
});

const contribution = () => mapHybridStateToContribution({
  state: baseState(),
  execution: { operationId: "closure", provider: "TEST", model: "test", promptDigest: "prompt", schemaDigest: "schema", configurationDigest: "configuration", runtimeId: "HYBRID_PRIMARY_STRUCTURED", runtimeVersion: "1.0.0" },
  rawOutputRef: "scientific-interpretation-raw:test",
  rawOutputDigest: "raw-test",
  conversation,
});

const withCriticalFinding = (): ScientificInterpretationContributionEnvelope => {
  const value = contribution();
  const critical = { findingId: "audit-d:critical", code: "SELF_RELATION", severity: "CRITICAL" as const, message: "Relation matérielle auto-référentielle.", sourceRefs: ["compare"], status: "OPEN" as const };
  return { ...value, audit: { ...value.audit, deterministicFindings: [critical], unresolvedFindings: [critical] } };
};

const runtime = (value: ScientificInterpretationContributionEnvelope, implementation?: ScientificInterpretationRuntime["interpret"]): ScientificInterpretationRuntime => ({
  runtimeId: value.identity.runtimeId,
  runtimeVersion: value.identity.runtimeVersion,
  interpret: implementation ?? vi.fn(async () => value),
});

const responseFor = (value = contribution()): ScientificInterpretationApiResponse => ({
  apiVersion: SCIENTIFIC_INTERPRETATION_API_VERSION,
  technicalStatus: "AVAILABLE",
  runtimeMode: "HYBRID_ACTIVE_WITH_LEGACY_FALLBACK",
  productDisposition: "SCIENTIFIC_CONTRIBUTION",
  contributionId: value.identity.contributionId,
  fallbackUsed: false,
  fallback: null,
  auditStatus: "COMPLETE",
  reviewRequired: false,
  projectionDisposition: "ACCEPTED_FOR_V1_PROJECTION",
  contribution: value,
  cognitiveBoundary: value.cognitiveBoundary!,
  responseMessage: null,
  v1Projection: projectScientificContributionToV1IfAllowed(value).projection,
  projectWrites: 0,
  semanticAuditLExecuted: false,
  adjudicatorExecuted: false,
  diagnostics: [],
});

const replayRecords = () => {
  const records = new Map<string, ScientificInterpretationReplayRecord>();
  for (const file of readdirSync(resolve(RESULT_ROOT, "candidate-states")).filter((item) => /^i\d\d-t\d\.json$/.test(item)).sort()) {
    const wrapper = JSON.parse(readFileSync(resolve(RESULT_ROOT, "candidate-states", file), "utf8"));
    const runtimeIdentity = wrapper.candidateState.identity.runtimeIdentity;
    const raw = JSON.parse(readFileSync(wrapper.rawOutputRef, "utf8"));
    records.set(file.replace(".json", ""), {
      replayId: file.replace(".json", ""), conversationId: wrapper.candidateState.identity.conversationId,
      state: wrapper.candidateState, rawOutputRef: wrapper.rawOutputRef, rawOutputDigest: raw.rawDigest,
      provider: runtimeIdentity.provider, model: runtimeIdentity.model, promptDigest: runtimeIdentity.promptDigest,
      schemaDigest: runtimeIdentity.schemaDigest, configurationDigest: runtimeIdentity.configurationDigest,
      runtimeId: runtimeIdentity.runtimeId, runtimeVersion: runtimeIdentity.runtimeVersion,
    });
  }
  return records;
};

describe("SEM-CLOSURE-001 — controlled hybrid cutover", () => {
  it("SC-C01 makes the hybrid runtime nominal", () => expect(DEFAULT_SCIENTIFIC_INTERPRETATION_MODE).toBe("HYBRID_ACTIVE_WITH_LEGACY_FALLBACK"));

  it("SC-C02 keeps LEGACY_ACTIVE as explicit rollback", async () => {
    const legacy = { ...contribution(), identity: { ...contribution().identity, contributionId: "legacy", runtimeId: "LEGACY_SEM_FULL" } };
    const hybrid = runtime(contribution(), vi.fn(async () => { throw new Error("must not run"); }));
    const result = await executeScientificInterpretation({ conversation, mode: "LEGACY_ACTIVE", legacyRuntime: runtime(legacy), hybridRuntime: hybrid });
    expect(result.activeContribution.identity.runtimeId).toBe("LEGACY_SEM_FULL");
    expect(hybrid.interpret).not.toHaveBeenCalled();
  });

  it("SC-C03 never falls back on a critical finding", async () => {
    const legacy = runtime({ ...contribution(), identity: { ...contribution().identity, runtimeId: "LEGACY_SEM_FULL" } });
    const result = await executeScientificInterpretation({ conversation, hybridRuntime: runtime(withCriticalFinding()), legacyRuntime: legacy });
    expect(result.fallbackUsed).toBe(false);
    expect(result.activeContribution.audit.unresolvedFindings).toContainEqual(expect.objectContaining({ severity: "CRITICAL" }));
    expect(legacy.interpret).not.toHaveBeenCalled();
  });

  it("SC-C04 falls back once on an allowed provider failure", async () => {
    const legacyContribution = { ...contribution(), identity: { ...contribution().identity, contributionId: "legacy-fallback", runtimeId: "LEGACY_SEM_FULL" } };
    const result = await executeScientificInterpretation({
      conversation,
      hybridRuntime: runtime(contribution(), vi.fn(async () => { throw new ScientificInterpretationTechnicalError("PROVIDER_FAILURE", "provider down", "raw:hybrid", "hybrid-op"); })),
      legacyRuntime: runtime(legacyContribution),
    });
    expect(result.fallbackUsed).toBe(true);
    expect(result.fallback).toMatchObject({ failureClass: "PROVIDER_FAILURE", rawOutputRef: "raw:hybrid", operationId: "hybrid-op" });
  });

  it("SC-C05 never loops hybrid to legacy to hybrid", async () => {
    const hybridCall = vi.fn(async () => { throw new ScientificInterpretationTechnicalError("TRANSPORT_FAILURE", "offline"); });
    const legacyCall = vi.fn(async () => contribution());
    await executeScientificInterpretation({ conversation, hybridRuntime: runtime(contribution(), hybridCall), legacyRuntime: runtime(contribution(), legacyCall) });
    expect(hybridCall).toHaveBeenCalledOnce();
    expect(legacyCall).toHaveBeenCalledOnce();
  });

  it("SC-C06 preserves a distinct legacy fallback identity", async () => {
    const hybrid = contribution();
    const legacy = { ...contribution(), identity: { ...contribution().identity, contributionId: "legacy-distinct", runtimeId: "LEGACY_SEM_FULL" } };
    const result = await executeScientificInterpretation({ conversation, hybridRuntime: runtime(hybrid, vi.fn(async () => { throw new ScientificInterpretationTechnicalError("PARSING_FAILURE", "parse", "raw:attempt"); })), legacyRuntime: runtime(legacy) });
    expect(result.activeContribution.identity.contributionId).toBe("legacy-distinct");
    expect(result.fallback?.rawOutputRef).toBe("raw:attempt");
  });

  it("SC-C07 fails closed when raw persistence fails", async () => {
    const legacy = runtime(contribution());
    const { HybridScientificInterpretationRuntimeAdapter } = await import("../hybrid-adapter");
    const adapter = new HybridScientificInterpretationRuntimeAdapter("HYBRID_PRIMARY_STRUCTURED", "1.0.0", async () => ({
      operationId: "raw-failure", provider: "TEST", model: "test", promptDigest: "p", schemaDigest: "s", configurationDigest: "c", runtimeId: "HYBRID_PRIMARY_STRUCTURED", runtimeVersion: "1.0.0", rawOutput: {},
    }), { persistAtomically: async () => { throw new ScientificInterpretationTechnicalError("RAW_PERSISTENCE_FAILURE", "disk"); }, read: async () => null }, () => baseState());
    await expect(executeScientificInterpretation({ conversation, hybridRuntime: adapter, legacyRuntime: legacy })).rejects.toMatchObject({ failureClass: "RAW_PERSISTENCE_FAILURE" });
    expect(legacy.interpret).not.toHaveBeenCalled();
  });

  it("SC-C08 blocks a critical Contribution from usable V1 projection", () => expect(projectScientificContributionToV1IfAllowed(withCriticalFinding())).toEqual({ disposition: "NEEDS_REVIEW", projection: null }));

  it("SC-C09 workspace consumes only the runtime-neutral Contribution contract", () => {
    const workspace = source("src/features/scientific-interpretation/ScientificInterpretationWorkspace.tsx");
    expect(workspace).toContain("currentContribution");
    expect(workspace).not.toContain("ScientificSemanticModel");
    expect(workspace).not.toContain("currentModel");
  });

  it("SC-C10 browser client targets the runtime-neutral facade", () => {
    const client = source("src/features/scientific-interpretation/client.ts");
    expect(client).toContain('fetch("/api/scientific-interpretation"');
    expect(client).not.toContain("/api/scientific-semantic");
  });

  it("SC-C11 session preserves Contribution identity, raw ref, runtime and findings", () => {
    const updated = appendScientificInterpretationExecution(createScientificInterpretationSession("2026-08-14T20:00:00.000Z"), responseFor());
    expect(updated.currentContribution?.source.rawOutputRef).toBe("scientific-interpretation-raw:test");
    expect(updated.currentContribution?.identity.runtimeId).toBe("HYBRID_PRIMARY_STRUCTURED");
    expect(updated.projectionHistory).toHaveLength(1);
    expect(updated.currentContribution?.audit.unresolvedFindings).toEqual([]);
  });

  it("SC-C12 reads an old SEM session without rewriting its identity", () => {
    const value = { sessionVersion: "SEM-001-WORKSPACE-1.0", sessionId: "old-session", messages: [{ messageId: "m1", role: "USER", content: "ancienne conversation" }], currentModel: { semanticModelId: "old-model", digest: "old-digest" }, modelHistory: [], createdAt: "2026-08-01", updatedAt: "2026-08-02" };
    const migrated = migrateLegacySemanticSession(value, () => ({ ...contribution(), identity: { ...contribution().identity, contributionId: "legacy-contribution", runtimeId: "LEGACY_SEM_FULL" } }));
    expect(migrated?.legacyCompatibilityIdentity).toEqual({ sessionVersion: "SEM-001-WORKSPACE-1.0", semanticModelId: "old-model", semanticModelDigest: "old-digest" });
    expect(migrated?.runtimeMode).toBe("LEGACY_ACTIVE");
  });

  it("SC-C13 Knowledge owns support and cannot write Project", () => expect(contributionToKnowledgeRequest(contribution())).toMatchObject({ ownership: "KNOWLEDGE", projectDecisionAuthorized: false }));

  it("SC-C14 has no nominal product import of ScientificSemanticModel", () => {
    const nominal = ["src/pages/ProtocolDesignerDemo.tsx", "src/features/scientific-interpretation/ScientificInterpretationWorkspace.tsx", "src/features/scientific-interpretation/client.ts", "src/features/scientific-interpretation/session.ts", "api/scientific-interpretation.ts"].map(source).join("\n");
    expect(nominal).not.toContain("ScientificSemanticModel");
  });

  it("SC-C15 nominal API does not directly call the SEM provider or server", () => {
    const api = source("api/scientific-interpretation.ts");
    expect(api).not.toContain("GeminiScientificSemanticProvider");
    expect(api).not.toContain("processScientificSemanticHttp");
  });

  it("SC-C16 adds no page consumer of the legacy SEM module", () => expect(source("src/pages/ProtocolDesignerDemo.tsx")).not.toContain("scientific-semantic-reconstruction"));

  it("SC-C17 deterministically replays all 24 visible states", async () => {
    const records = replayRecords();
    const adapter = new FixtureReplayScientificInterpretationAdapter(records);
    const outputs = await Promise.all([...records].map(([key, item]) => adapter.interpret({ conversationId: key, language: "fr", turns: (item.state.source as { turns: ScientificInterpretationConversation["turns"] }).turns })));
    expect(outputs).toHaveLength(24);
    expect(outputs.every((item) => item.source.rawOutputRef && item.source.rawOutputDigest)).toBe(true);
  });

  it("SC-C18 preserves the three documented prototype limitations", () => {
    const boundary = source("architecture/hybrid-runtime-product-boundary-map.md");
    expect(boundary).toMatch(/two\s+self-relations/i);
    expect(boundary).toMatch(/local-practice/i);
  });

  it("SC-C19 creates no direct Project write", async () => {
    const result = await executeScientificInterpretation({ conversation, hybridRuntime: runtime(contribution()), legacyRuntime: runtime(contribution()) });
    expect(result.projectWrites).toBe(0);
    expect(result.activeContribution.decisionBoundary.projectWriteAuthorized).toBe(false);
  });

  it("SC-C20 makes no PD-003 V2 claim", () => {
    const projected = projectScientificContributionToV1IfAllowed(contribution()).projection;
    expect(projected?.contractNature).toBe("LEGACY_V1_TRANSITIONAL_PROJECTION_NOT_PD003_V2");
    expect(JSON.stringify(projected)).not.toContain("PD003_V2_CONFORMANT");
  });

  it("SC-C21 Audit-D does not mutate the Contribution", () => {
    const value = contribution();
    const before = scientificContributionStableJson(value);
    auditScientificInterpretationContribution(value);
    expect(scientificContributionStableJson(value)).toBe(before);
  });

  it("SC-C21b Audit-D detects an unsourced reversal of an established relation", () => {
    const previous = contribution();
    const current = contribution();
    const established = previous.scientificContent.candidateRelations[0];
    current.scientificContent.candidateRelations = [{ ...established, relationId: "compare-reversed", sourceItemId: established.targetItemId, targetItemId: established.sourceItemId }];
    expect(auditScientificInterpretationContribution(current, previous)).toContainEqual(expect.objectContaining({ code: "RELATION_DIRECTION_INVERTED", severity: "CRITICAL" }));
  });

  it("SC-C22 keeps Audit-L inactive", () => expect(SEMANTIC_AUDIT_L_STATUS).toBe("SHADOW_ONLY_NOT_PRODUCT_ACTIVE"));

  it("SC-C23 keeps the adjudicator absent from nominal product code", () => {
    const nominal = ["src/features/scientific-interpretation/runtime.ts", "src/features/scientific-interpretation/hybrid-adapter.ts", "api/scientific-interpretation.ts"].map(source).join("\n").toLowerCase();
    expect(nominal).not.toContain("adjudicat");
    expect(nominal).not.toContain("auditsemantically(");
  });

  it("SC-C24 leaves historical SEM campaigns, fixtures and tests present", () => {
    expect(readdirSync(resolve(ROOT, "src/features/scientific-semantic-reconstruction/__tests__")).length).toBeGreaterThan(20);
    expect(readdirSync(resolve(RESULT_ROOT, "candidate-states")).filter((item) => item.endsWith(".json"))).toHaveLength(24);
    expect(source("src/features/scientific-semantic-reconstruction/manual/holdout-qualification-r5p.manual.ts")).toContain("R5P");
  });

  it("SC-C25 rollback does not mutate a historical contribution digest", async () => {
    const legacy = { ...contribution(), identity: { ...contribution().identity, contributionId: "legacy-digest", runtimeId: "LEGACY_SEM_FULL", contributionDigest: "historic-digest" } };
    const before = legacy.identity.contributionDigest;
    const result = await executeScientificInterpretation({ conversation, mode: "LEGACY_ACTIVE", hybridRuntime: runtime(contribution()), legacyRuntime: runtime(legacy) });
    expect(result.activeContribution.identity.contributionDigest).toBe(before);
  });

  it("SC-C26 records zero nominal SEM Full closure blockers", () => {
    const burnDown = JSON.parse(source("architecture/hybrid-runtime-dependency-burndown.json"));
    expect(burnDown.BLOCKING_FOR_CLOSURE).toBe(0);
    expect(burnDown.DIRECT_NOMINAL_SEM_FULL_CONSUMERS_AFTER).toBe(0);
    expect(burnDown.migratedFunctionalDependencies).toHaveLength(7);
    expect(burnDown.legacyImportsOutsideLegacyModule).not.toHaveLength(0);
  });

  it("SC-C27 freezes the archive and rollback identities", () => {
    const archive = JSON.parse(source("architecture/sem-archive-manifest.json"));
    expect(archive.closureDecision).toBe("SEM_CLOSURE_001R_COMPLETE");
    expect(archive.runtime).toMatchObject({
      nominalMode: "HYBRID_ACTIVE_WITH_LEGACY_FALLBACK",
      rollbackMode: "LEGACY_ACTIVE",
      diagnosticMode: "HYBRID_SHADOW",
      SEM_FULL_NOMINAL_RUNTIME: "NO",
      SEM_LEGACY_ROLLBACK_AVAILABLE: "YES",
      SEM_AUDIT_L: "SHADOW_ONLY",
      ADJUDICATOR: "ABSENT",
    });
  });

  it("SC-C28 records a complete live technical gate without fallback or Project write", () => {
    const live = JSON.parse(source("experiments/engine-lab/results/sem-closure-001r-live/run-manifest.json"));
    expect(live.decision).toBe("SEM_CLOSURE_001R_LIVE_GATE_PASS");
    expect(live.providerRequests).toBe(8);
    expect(live.transientRetries).toBe(0);
    expect(live.summary).toMatchObject({
      responsesObtained: 8,
      rawPersisted: 8,
      internalValidationsSucceeded: 8,
      explicitContributionsOrScientificDispositions: 8,
      fallbackCount: 0,
      rawPersistenceFailures: 0,
      structurallyInvalidAccepted: 0,
      criticalFindingsIgnored: 0,
      projectWrites: 0,
    });
  });

  it("SC-C29 keeps every live critical finding visible and blocking", () => {
    const live = JSON.parse(source("experiments/engine-lab/results/sem-closure-001r-live/live-results.json"));
    expect(live.records).toHaveLength(8);
    expect(live.records.every((record: { status: string; criticalFindings: unknown[]; fallbackUsed: boolean; projectWrites: number }) =>
      record.status === "NEEDS_REVIEW"
      && record.criticalFindings.length > 0
      && record.fallbackUsed === false
      && record.projectWrites === 0,
    )).toBe(true);
  });

  it("SC-C30 preserves the blocking report as an immutable historical snapshot", () => {
    const archive = JSON.parse(source("architecture/sem-archive-manifest.json"));
    expect(archive.preservation.blockingReport).toBe("docs/sem-closure-001-report.md");
    expect(source(archive.preservation.blockingReport)).toContain("SEM_CLOSURE_BLOCKED_BY_HYBRID_RUNTIME");
    expect(archive.preservation.mutationPolicy).toBe("PRESERVE_WITHOUT_RETROACTIVE_REWRITE");
  });
});
