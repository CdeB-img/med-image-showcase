import { describe, expect, it, vi } from "vitest";
import { executeProtocolDesignerBridge } from "../../../../../api/protocol-designer-bridge";
import {
  buildPersistentSourceCatalog,
  constrainPersistentRelationsToCanonicalSignatures,
  validatePersistentProjectDelta,
  type PersistentProjectDeltaWireCandidate,
  type ProductBridgeRequest,
  type ProductBridgeResponse,
} from "@/features/protocol-designer/product-bridge";
import type { ScientificInterpretationConversation } from "@/features/scientific-interpretation/contracts";

const raw = "Deux populations éligibles sont décrites dans la même étude.";

const conversation = (): ScientificInterpretationConversation => ({
  conversationId: "conversation:fic02-repair-03-relations",
  language: "fr",
  turns: [{
    turnId: "turn:fic02-repair-03-relations",
    role: "USER",
    content: raw,
    createdAt: "2026-09-07T10:00:00.000Z",
  }],
});

const change = (candidateRef: string, proposedType: string, content: string) => ({
  operation: "ADD" as const,
  sourceText: raw,
  candidateRef,
  proposedType,
  content,
  polarity: "AFFIRMED" as const,
  epistemicStatus: "EXPLICIT_USER_STATED" as const,
  epistemicState: "KNOWN" as const,
  assertionKind: "USER_STATED" as const,
  evidenceRefs: [],
});

const relation = (relationType: string, sourceObjectRef: string, targetObjectRef: string) => ({
  relationRef: `relation:${sourceObjectRef}:${targetObjectRef}`,
  sourceText: raw,
  relationType,
  sourceObjectRef,
  targetObjectRef,
  polarity: "AFFIRMED" as const,
  epistemicStatus: "EXPLICIT_USER_STATED" as const,
  epistemicState: "KNOWN" as const,
  assertionKind: "USER_STATED" as const,
  evidenceRefs: [],
});

const candidate = (
  changes: PersistentProjectDeltaWireCandidate["changes"],
  relations: PersistentProjectDeltaWireCandidate["relations"],
): PersistentProjectDeltaWireCandidate => ({
  changes,
  relations,
  temporalQualifications: [],
  expectedVariableOccasions: [],
});

describe("FIC02-BOUNDED-REPAIR-03 — canonical persistent relation constraint", () => {
  it("preserves explicit objects and omits an optional relation with no canonical endpoint signature", () => {
    const wire = candidate([
      change("population:one", "POPULATION", "Première population"),
      change("population:two", "POPULATION", "Deuxième population"),
    ], [relation("COMPARES_WITH", "population:one", "population:two")]);

    const direct = validatePersistentProjectDelta(wire, raw, null, conversation());
    expect(direct.validation.blocks).toContain("relation:0:PROJECT_RELATION_ENDPOINT_TYPE_MISMATCH");
    expect(direct.candidate).toBeNull();

    const constrained = constrainPersistentRelationsToCanonicalSignatures(wire, null);
    expect(constrained.omissions).toEqual([expect.objectContaining({
      relationRef: "relation:population:one:population:two",
      relationType: "COMPARES_WITH",
      sourceType: "POPULATION",
      targetType: "POPULATION",
      reason: "NO_COMPATIBLE_CANONICAL_SIGNATURE",
    })]);
    expect((constrained.value as PersistentProjectDeltaWireCandidate).changes).toHaveLength(2);
    expect((constrained.value as PersistentProjectDeltaWireCandidate).relations).toEqual([]);

    const checked = validatePersistentProjectDelta(constrained.value, raw, null, conversation());
    expect(checked.validation).toMatchObject({ valid: true, blocks: [] });
    expect(checked.candidate?.changes).toHaveLength(2);
    expect(checked.candidate?.relations).toEqual([]);
  });

  it("preserves valid relations and leaves unresolved or unsupported candidates fail-closed", () => {
    const valid = candidate([
      change("arm:treatment", "INTERVENTION", "Groupe traité"),
      change("arm:control", "COMPARATOR", "Groupe contrôle"),
    ], [relation("COMPARES_WITH", "arm:treatment", "arm:control")]);
    expect(constrainPersistentRelationsToCanonicalSignatures(valid, null)).toEqual({
      value: valid,
      omissions: [],
    });

    const unresolved = candidate(valid.changes, [relation("COMPARES_WITH", "arm:treatment", "missing:arm")]);
    const unresolvedConstraint = constrainPersistentRelationsToCanonicalSignatures(unresolved, null);
    expect(unresolvedConstraint.omissions).toEqual([]);
    expect(validatePersistentProjectDelta(unresolvedConstraint.value, raw, null, conversation()).validation.blocks)
      .toContain("relation:0:PROJECT_RELATION_ENDPOINT_INVALID");

    const unsupported = candidate(valid.changes, [relation("NEAREST_RELATION", "arm:treatment", "arm:control")]);
    const unsupportedConstraint = constrainPersistentRelationsToCanonicalSignatures(unsupported, null);
    expect(unsupportedConstraint.omissions).toEqual([]);
    expect(validatePersistentProjectDelta(unsupportedConstraint.value, raw, null, conversation()).validation.blocks)
      .toContain("relation:0:RELATION_TYPE_OUTSIDE_PROVIDER_VOCABULARY");
  });

  it("constrains the provider result before Project validation without a semantic reroll", async () => {
    const request: ProductBridgeRequest = {
      apiVersion: "1.0.0",
      conversation: conversation(),
      currentProject: null,
      evaluatePersistentDelta: true,
    };
    const catalog = buildPersistentSourceCatalog(request.conversation);
    const anchorId = catalog.anchors.find((anchor) => anchor.fragmentKind === "FULL_TURN")!.anchorId;
    const providerValue = {
      changes: [
        { ...change("population:one", "POPULATION", "Première population"), sourceAnchorId: anchorId, sourceText: undefined },
        { ...change("population:two", "POPULATION", "Deuxième population"), sourceAnchorId: anchorId, sourceText: undefined },
      ].map(({ sourceText: _sourceText, ...item }) => item),
      relations: [{ ...relation("COMPARES_WITH", "population:one", "population:two"), sourceAnchorId: anchorId, sourceText: undefined }]
        .map(({ sourceText: _sourceText, ...item }) => item),
      temporalQualifications: [],
      expectedVariableOccasions: [],
    };
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      if (String(url).includes("generativelanguage.googleapis.com")) {
        return new Response(JSON.stringify({
          responseId: "gemini:relation-constraint",
          candidates: [{ content: { parts: [{ text: "Les deux populations sont conservées comme propositions distinctes." }] } }],
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response(JSON.stringify({
        id: "openai:relation-constraint",
        model: "gpt-5.6-terra-test",
        status: "completed",
        output_text: JSON.stringify(providerValue),
      }), { status: 200, headers: { "content-type": "application/json" } });
    }) as unknown as typeof fetch;

    const result = await executeProtocolDesignerBridge({
      body: request,
      apiKey: "test-gemini-key",
      openAiApiKey: "test-openai-key",
      fetchImpl,
      now: () => Date.parse("2026-09-07T10:01:00.000Z"),
    });
    const response = result.body as ProductBridgeResponse;

    expect(response.persistentExtraction).toMatchObject({
      status: "CANDIDATE",
      recovery: null,
      validation: {
        valid: true,
        blocks: [],
        noOps: ["relation:relation:population:one:population:two:OMITTED_NO_COMPATIBLE_CANONICAL_SIGNATURE"],
      },
    });
    expect(response.persistentExtraction.candidate?.changes).toHaveLength(2);
    expect(response.persistentExtraction.candidate?.relations).toEqual([]);
    expect(response.observability).toMatchObject({ calls: 2, extractionAttempts: 1, projectWrites: 0 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});
