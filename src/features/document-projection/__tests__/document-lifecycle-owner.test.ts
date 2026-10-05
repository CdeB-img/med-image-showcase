import { describe, it, expect } from "vitest";
import { portableDrciFixture } from "./portable-drci-fixture";
import { documentGenerationsForProject, projectDocumentLifecycle, nextDocumentGenerationVersion } from "../history";
import { documentOperationEvidence, markFunctionalResetDocumentFailure, refreshFunctionalResetDocumentPortfolio } from "../functional-reset-boundary";
import { materializeProviderCallRecord, emptyProviderTokenUsage } from "@/features/protocol-designer/provider-call-observability";

// CURRENT_STRUCTURAL_INVARIANT. Reuse a meaningful native ECV fixture;
// assertions here concern lifecycle/identity, never scientific completeness.
describe("DOC owns generation identity and atomic outcome", () => {
  it("preserves identities across reordering, filtering, repeated delivery and reload", () => {
    const { ancestor, polished, cleaned, project } = portableDrciFixture();
    const frozen = JSON.stringify([ancestor, polished, cleaned, project]);
    const ordered = documentGenerationsForProject([ancestor, polished, cleaned], project.projectId);
    const reordered = documentGenerationsForProject([cleaned, ancestor, polished, ancestor], project.projectId);
    expect(reordered).toEqual(ordered);
    expect(documentGenerationsForProject(JSON.parse(JSON.stringify([cleaned, ancestor, polished])), project.projectId)).toEqual(ordered);
    expect(documentGenerationsForProject([cleaned], project.projectId)[0].documentGenerationId).toBe(ordered[2].documentGenerationId);
    expect(nextDocumentGenerationVersion([ancestor, polished, cleaned, ancestor], project.projectId)).toBe(4);
    expect(new Set(ordered.map(item => item.projectVersionId)).size).toBe(1);
    const lifecycle = projectDocumentLifecycle([portableDrciFixture().source.protocolProjection], [cleaned, ancestor, polished], project);
    expect(lifecycle.currentPack).toBe(cleaned);
    expect(lifecycle.generations[1].previousGenerationId).toBe(ordered[0].documentGenerationId);
    expect(lifecycle.generations[0].documents.map(item => item.logicalDocumentId)).toEqual(lifecycle.generations[2].documents.map(item => item.logicalDocumentId));
    expect(lifecycle.projections[0].logicalDocumentId).not.toBe(lifecycle.generations[0].documents[0].logicalDocumentId);
    expect(JSON.stringify([ancestor, polished, cleaned, project])).toBe(frozen);
  });

  it("keeps old generation immutable when Project binding changes; never selects it as current", () => {
    const { ancestor, project } = portableDrciFixture();
    const before = JSON.stringify(ancestor);
    const next = { ...project, versionId: project.versionId + ":next", projectDigest: "different-project" };
    const lifecycle = projectDocumentLifecycle([], [ancestor], next);
    expect(lifecycle.currentPack).toBeNull();
    expect(lifecycle.generations[0].projectVersionId).toBe(project.versionId);
    expect(JSON.stringify(ancestor)).toBe(before);
  });

  it("successful scope plus failed scope is evidence, not a ready pack or persisted generation", () => {
    const record = (status: "SUCCEEDED" | "FAILED", index: number) => materializeProviderCallRecord({
      provider: "OPENAI", modelRequested: "gpt-6-sol", modelReturned: "gpt-6-sol",
      instrumentation: { purpose: "DOCUMENT_PROJECTION", reasoningEffort: "medium", retryIndex: 0, retryReason: null,
      context: { sessionId: "synthetic-session", conversationId: "synthetic-conversation", turnId: "synthetic-turn",
        clientRequestId: "synthetic-doc:" + index, testSessionId: null }, onRecord: () => undefined },
      usage: emptyProviderTokenUsage(), providerRequestId: null, providerResponseId: null,
      startedAt: "2026-10-05T08:00:00Z", completedAt: "2026-10-05T08:00:01Z",
      latencyMs: 1000, status, failureReason: status === "FAILED" ? "PROVIDER_RESULT_FAILED" : null,
    });
    const records = [record("SUCCEEDED", 0), record("FAILED", 1)];
    const before = JSON.stringify(records);
    const outcome = documentOperationEvidence(records);
    expect(outcome).toMatchObject({ succeededCallIds: [records[0].callId], failedCallIds: [records[1].callId],
      packReadiness: "NOT_READY", persistedGeneration: "NONE", automaticRedispatchAllowed: false });
    const { project, source } = portableDrciFixture();
    const documents = refreshFunctionalResetDocumentPortfolio({ project, handoffDecision: source.handoffDecision,
      requestedAt: project.adoptedAt, generateProtocol: true });
    const failed = markFunctionalResetDocumentFailure(project, documents, new Error("DRCI_DRAFT_NOT_GENERATED"), records);
    expect(failed.lastFailure!.operationEvidence).toEqual(outcome);
    expect(failed.projections).toBe(documents.projections);
    expect(JSON.stringify(records)).toBe(before);
  });
});
