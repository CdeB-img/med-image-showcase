import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { acceptSemanticModel, canonicalizeSemanticReconstruction } from "@/features/scientific-semantic-reconstruction/canonical";
import { acceptedCritic, comparisonCandidate, makeSemanticRequest } from "@/features/scientific-semantic-reconstruction/__tests__/fixtures";
import { semanticModelToScientificSessionContext, semanticModelToValidatedIntent } from "@/features/scientific-semantic-reconstruction/adapters";
import {
  DEFAULT_SCIENTIFIC_INTERPRETATION_MODE,
  SEMANTIC_AUDIT_L_STATUS,
  FixtureReplayScientificInterpretationAdapter,
  HybridScientificInterpretationRuntimeAdapter,
  InMemoryScientificInterpretationRawStore,
  ScientificInterpretationTechnicalError,
  applyDeterministicAudit,
  auditScientificInterpretationContribution,
  executeScientificInterpretation,
  legacySemanticModelToContribution,
  mapHybridStateToContribution,
  projectScientificContributionToV1,
  scientificContributionStableJson,
  type ScientificInterpretationConversation,
  type ScientificInterpretationContributionEnvelope,
  type ScientificInterpretationReplayRecord,
  type ScientificInterpretationRuntime,
} from "..";

const RESULT_ROOT = resolve(process.cwd(), "experiments/engine-lab/results/hybrid-runtime-prototype-01");

const makeLegacyModel = () => acceptSemanticModel(canonicalizeSemanticReconstruction({
  request: makeSemanticRequest(),
  candidate: comparisonCandidate(),
  critic: acceptedCritic(comparisonCandidate()),
  metadata: { provider: "TEST", model: "semantic-test", temperature: 0 },
  reconstructionCallId: "legacy-reconstruction",
  criticCallId: "legacy-critic",
  now: "2026-08-14T12:00:00.000Z",
}), "2026-08-14T12:01:00.000Z");

const syntheticConversation: ScientificInterpretationConversation = {
  conversationId: "synthetic-conversation",
  language: "fr",
  turns: [{ turnId: "T0", role: "USER", content: "Comparer une méthode alpha et une méthode beta sans conclure à une causalité." }],
};

const syntheticState = () => ({
  identity: { stateId: "synthetic-state", conversationId: "synthetic-conversation", generatedAt: "2026-08-14T12:00:00.000Z" },
  source: { originalRequest: syntheticConversation.turns[0].content, turns: syntheticConversation.turns },
  technicalStatus: "STRUCTURED_CONTRACT_VALID",
  understanding: { normalizedUnderstanding: "Comparaison non causale de deux méthodes." },
  explicitStatements: [],
  objects: [
    { elementId: "alpha", semanticIdentity: "alpha", semanticType: "METHOD", content: "méthode alpha", ownership: "USER", epistemicStatus: "EXPLICIT_USER_STATED", adoptionStatus: null, activeState: true, sourceTurnIds: ["T0"], sourceText: "méthode alpha", polarity: "AFFIRMED", studyRole: "INTERVENTION_ARM", availabilityClaim: "disponible seulement au centre local", availabilityScope: "centre local" },
    { elementId: "beta", semanticIdentity: "beta", semanticType: "METHOD", content: "méthode beta", ownership: "USER", epistemicStatus: "EXPLICIT_USER_STATED", adoptionStatus: null, activeState: true, sourceTurnIds: ["T0"], sourceText: "méthode beta", polarity: "AFFIRMED", studyRole: "COMPARATOR_ARM" },
    { elementId: "old", semanticIdentity: "old", semanticType: "OUTCOME", content: "ancienne mesure", ownership: "USER", epistemicStatus: "REJECTED_BY_USER", adoptionStatus: null, activeState: false, sourceTurnIds: ["T0"], sourceText: "ancienne mesure", polarity: "NEGATED", studyRole: "OUTCOME_ROLE", previousElementIds: ["prior"] },
  ],
  relations: [{ relationId: "association", relationType: "ASSOCIATED_WITH", sourceElementId: "alpha", targetElementId: "beta", polarity: "AFFIRMED", ownership: "USER", epistemicStatus: "EXPLICIT_USER_STATED", adoptionStatus: null, activeState: true, sourceTurnIds: ["T0"], sourceText: "alpha et beta" }],
  inferredContext: [], contextualCandidates: [], negationsAndConstraints: [
    { elementId: "old", semanticIdentity: "old", semanticType: "OUTCOME", content: "ancienne mesure", ownership: "USER", epistemicStatus: "REJECTED_BY_USER", adoptionStatus: null, activeState: false, sourceTurnIds: ["T0"], sourceText: "ancienne mesure", polarity: "NEGATED", studyRole: "OUTCOME_ROLE", previousElementIds: ["prior"] },
  ],
  temporalElements: [], ambiguities: [], unknowns: [], missingInformation: [], correctionsAndSupersessions: [
    { correctionId: "correction", currentContent: "ancienne mesure rejetée", previousSemanticIdentity: "old", sourceTurnIds: ["T0"], sourceText: "ancienne mesure" },
  ], openDecisions: [], clarificationNeeds: [],
});

const mapSynthetic = () => mapHybridStateToContribution({
  state: syntheticState(),
  execution: { operationId: "synthetic", provider: null, model: null, promptDigest: "prompt", schemaDigest: "schema", configurationDigest: "config", runtimeId: "HYBRID_TEST", runtimeVersion: "1" },
  rawOutputRef: "memory://raw/synthetic",
  rawOutputDigest: "raw-digest",
  conversation: syntheticConversation,
});

const replayRecords = () => {
  const directory = resolve(RESULT_ROOT, "candidate-states");
  const records = new Map<string, ScientificInterpretationReplayRecord>();
  for (const file of readdirSync(directory).filter((item) => /^i\d\d-t\d\.json$/.test(item)).sort()) {
    const wrapper = JSON.parse(readFileSync(resolve(directory, file), "utf8"));
    const runtime = wrapper.candidateState.identity.runtimeIdentity;
    const raw = JSON.parse(readFileSync(wrapper.rawOutputRef, "utf8"));
    records.set(file.replace(".json", ""), {
      replayId: file.replace(".json", ""),
      conversationId: wrapper.candidateState.identity.conversationId,
      state: wrapper.candidateState,
      rawOutputRef: wrapper.rawOutputRef,
      rawOutputDigest: raw.rawDigest,
      provider: runtime.provider,
      model: runtime.model,
      promptDigest: runtime.promptDigest,
      schemaDigest: runtime.schemaDigest,
      configurationDigest: runtime.configurationDigest,
      runtimeId: runtime.runtimeId,
      runtimeVersion: runtime.runtimeVersion,
    });
  }
  return records;
};

const staticRuntime = (contribution: ScientificInterpretationContributionEnvelope): ScientificInterpretationRuntime => ({
  runtimeId: contribution.identity.runtimeId,
  runtimeVersion: contribution.identity.runtimeVersion,
  interpret: vi.fn(async () => contribution),
});

describe("HYBRID-RUNTIME-INTEGRATION-001 contracts", () => {
  it("HRI-C01 reflects the controlled cutover default", () => expect(DEFAULT_SCIENTIFIC_INTERPRETATION_MODE).toBe("HYBRID_ACTIVE_WITH_LEGACY_FALLBACK"));

  it("HRI-C02 returns a Contribution and never a Research Project", () => {
    const contribution = mapSynthetic();
    expect(contribution.contract).toBe("SCIENTIFIC_INTERPRETATION_CONTRIBUTION_ENVELOPE");
    expect(contribution).not.toHaveProperty("researchProject");
    expect(contribution.decisionBoundary.projectWriteAuthorized).toBe(false);
  });

  it("HRI-C03 product code imports no contract from experiments", () => {
    const root = resolve(process.cwd(), "src/features/scientific-interpretation");
    const sources = readdirSync(root).filter((file) => file.endsWith(".ts")).map((file) => readFileSync(resolve(root, file), "utf8")).join("\n");
    expect(sources).not.toMatch(/from\s+["'][^"']*experiments\//);
  });

  it("HRI-C04 persists raw output before parsing", async () => {
    const order: string[] = [];
    const store = new InMemoryScientificInterpretationRawStore();
    const persist = vi.spyOn(store, "persistAtomically").mockImplementation(async (input) => { order.push("persist"); return { rawOutputRef: "memory://raw/order", rawOutputDigest: "digest", persistedAt: "now", payload: input.payload }; });
    const runtime = new HybridScientificInterpretationRuntimeAdapter("HYBRID", "1", async () => { order.push("execute"); return { operationId: "order", provider: null, model: null, promptDigest: null, schemaDigest: null, configurationDigest: null, runtimeId: "HYBRID", runtimeVersion: "1", rawOutput: syntheticState() }; }, store, (raw) => { order.push("parse"); return raw as Record<string, unknown>; });
    await runtime.interpret(syntheticConversation);
    expect(order).toEqual(["execute", "persist", "parse"]);
    expect(persist).toHaveBeenCalledOnce();
  });

  it("HRI-C05 keeps raw inspectable after schema or parsing failure", async () => {
    const store = new InMemoryScientificInterpretationRawStore();
    const runtime = new HybridScientificInterpretationRuntimeAdapter("HYBRID", "1", async () => ({ operationId: "failed", provider: null, model: null, promptDigest: null, schemaDigest: null, configurationDigest: null, runtimeId: "HYBRID", runtimeVersion: "1", rawOutput: { readable: "evidence" } }), store, () => { throw new Error("invalid schema"); });
    await expect(runtime.interpret(syntheticConversation)).rejects.toMatchObject({ failureClass: "STRUCTURED_CONTRACT_FAILURE", rawOutputRef: "memory://scientific-interpretation/failed" });
    expect(await store.read("memory://scientific-interpretation/failed")).toMatchObject({ payload: { readable: "evidence" } });
  });

  it("HRI-C06 preserves candidate distinct from adopted", () => {
    const contribution = mapSynthetic();
    expect(contribution.epistemicBoundary.candidateIsAdopted).toBe(false);
    expect(contribution.scientificContent.candidateObjects.every((item) => item.epistemicBoundary.adoptionStatus !== "PROJECT_ADOPTED")).toBe(true);
  });

  it("HRI-C07 preserves Knowledge support distinct from Project decision", () => {
    const contribution = legacySemanticModelToContribution(makeLegacyModel());
    expect(contribution.epistemicBoundary.knowledgeSupportIsProjectDecision).toBe(false);
    expect(contribution.decisionBoundary.projectWriteAuthorized).toBe(false);
  });

  it("HRI-C08 keeps critical relations representable in V1", () => {
    const projection = projectScientificContributionToV1(mapSynthetic());
    expect(projection.scientificSessionContext.detectedRelationships).toContain("méthode alpha ASSOCIATED_WITH méthode beta [AFFIRMED]");
    expect(projection.scientificSessionContext.interpretationTrace?.relations).toEqual(projection.scientificSessionContext.detectedRelationships);
  });

  it("HRI-C09 keeps rejected and superseded states reconstructible", () => {
    const projection = projectScientificContributionToV1(mapSynthetic());
    expect(projection.scientificSessionContext.interpretationTrace?.rejectedOrSuperseded).toContain("old");
    expect(projection.losses).toContainEqual(expect.objectContaining({ code: "LEGACY_PROJECTION_LOSS", itemId: "old" }));
  });

  it("HRI-C10 keeps local practice local", () => {
    const contribution = mapSynthetic();
    const local = contribution.scientificContent.candidateObjects.find((item) => item.itemId === "alpha")!;
    expect(local.availabilityScope).toBe("centre local");
    expect(local.epistemicBoundary.adoptionStatus).toBeNull();
    expect(contribution.epistemicBoundary.candidateIsAdopted).toBe(false);
  });

  it("HRI-C11 keeps partial availability explicit", () => {
    const projection = projectScientificContributionToV1(mapSynthetic());
    expect(projection.scientificSessionContext.interpretationTrace?.legacyProjectionLosses).toContainEqual(expect.objectContaining({ itemId: "alpha", reason: expect.stringContaining("availability") }));
    expect(mapSynthetic().scientificContent.candidateObjects.find((item) => item.itemId === "alpha")?.availabilityClaim).toContain("seulement");
  });

  it("HRI-C12 never upgrades association to causality", () => {
    const contribution = mapSynthetic();
    expect(contribution.scientificContent.candidateRelations[0].relationType).toBe("ASSOCIATED_WITH");
    expect(contribution.scientificContent.candidateRelations[0].relationType).not.toMatch(/CAUSE/);
  });

  it("HRI-C13 SEM-AUDIT-D is non-mutating", () => {
    const contribution = mapSynthetic();
    const before = scientificContributionStableJson(contribution);
    auditScientificInterpretationContribution(contribution);
    const audited = applyDeterministicAudit(contribution);
    expect(scientificContributionStableJson(contribution)).toBe(before);
    expect(audited).not.toBe(contribution);
  });

  it("HRI-C14 keeps SEM-AUDIT-L shadow-only", () => expect(SEMANTIC_AUDIT_L_STATUS).toBe("SHADOW_ONLY_NOT_PRODUCT_ACTIVE"));

  it("HRI-C15 never calls an adjudicator", async () => {
    const execute = vi.fn(async () => ({ operationId: "one", provider: null, model: null, promptDigest: null, schemaDigest: null, configurationDigest: null, runtimeId: "HYBRID", runtimeVersion: "1", rawOutput: syntheticState() }));
    const runtime = new HybridScientificInterpretationRuntimeAdapter("HYBRID", "1", execute, new InMemoryScientificInterpretationRawStore(), (raw) => raw as Record<string, unknown>);
    await runtime.interpret(syntheticConversation);
    expect(execute).toHaveBeenCalledOnce();
  });

  it("HRI-C16 HYBRID_SHADOW mutates neither UI nor Project state", async () => {
    const legacy = legacySemanticModelToContribution(makeLegacyModel());
    const hybrid = mapSynthetic();
    const uiState = { step: 2 };
    const projectState = { revision: 4 };
    const result = await executeScientificInterpretation({ conversation: syntheticConversation, legacyRuntime: staticRuntime(legacy), hybridRuntime: staticRuntime(hybrid), mode: "HYBRID_SHADOW" });
    expect(result.activeContribution).toBe(legacy);
    expect(result.projectWrites).toBe(0);
    expect(result.uiStateMutatedByShadow).toBe(false);
    expect(uiState).toEqual({ step: 2 });
    expect(projectState).toEqual({ revision: 4 });
  });

  it("HRI-C17 legacy adapter preserves historic SEM identity", () => {
    const model = makeLegacyModel();
    const contribution = legacySemanticModelToContribution(model);
    const projection = projectScientificContributionToV1(contribution);
    const historicIntent = semanticModelToValidatedIntent(model);
    const historicContext = semanticModelToScientificSessionContext(model);
    expect(contribution.source.conversationId).toBe(model.semanticModelId);
    expect(contribution.runtimeEvidence.configurationDigest).toBe(model.digest);
    expect(projection.validatedIntent.semanticSnapshot?.semanticModelDigest).toBe(model.digest);
    expect(projection.validatedIntent.interpretation).toEqual(historicIntent.interpretation);
    expect(projection.validatedIntent.reviews).toEqual(historicIntent.reviews);
    expect(projection.scientificSessionContext.detectedRelationships).toEqual(historicContext.detectedRelationships);
    expect(projection.scientificSessionContext.missingInformation).toEqual(historicContext.missingInformation);
  });

  it("HRI-C18 V1 projection does not claim PD-003 V2", () => {
    const projection = projectScientificContributionToV1(mapSynthetic());
    expect(projection.contractNature).toBe("LEGACY_V1_TRANSITIONAL_PROJECTION_NOT_PD003_V2");
    expect(JSON.stringify(projection)).not.toContain("PD003_V2_CONFORMANT");
  });

  it("HRI-C19 replay manifest reads no Blind path", () => {
    const records = replayRecords();
    expect(records.size).toBe(24);
    expect([...records.values()].every((item) => !item.rawOutputRef.toLocaleLowerCase().includes("blind"))).toBe(true);
  });

  it("HRI-C20 replays 24/24 states with zero provider call", async () => {
    const records = replayRecords();
    const adapter = new FixtureReplayScientificInterpretationAdapter(records);
    const provider = vi.fn();
    const contributions = [];
    for (const [key, item] of records) {
      const source = item.state.source as { turns: ScientificInterpretationConversation["turns"] };
      contributions.push(await adapter.interpret({ conversationId: key, language: "fr", turns: source.turns }));
    }
    expect(contributions).toHaveLength(24);
    expect(contributions.every((item) => item.source.rawOutputRef && item.source.rawOutputDigest && item.decisionBoundary.projectWriteAuthorized === false)).toBe(true);
    expect(provider).not.toHaveBeenCalled();
  });

  it("HRI-C21 exposes the previous Contribution identity without a parallel history", () => {
    const previous = mapSynthetic();
    const nextState = {
      ...syntheticState(),
      identity: {
        ...syntheticState().identity,
        stateId: "synthetic-state-next",
        previousStateId: previous.identity.contributionId,
      },
    };
    const next = mapHybridStateToContribution({
      state: nextState,
      execution: { operationId: "synthetic-next", provider: null, model: null, promptDigest: "prompt", schemaDigest: "schema", configurationDigest: "config", runtimeId: "HYBRID_TEST", runtimeVersion: "1" },
      rawOutputRef: "memory://raw/synthetic-next",
      rawOutputDigest: "raw-digest-next",
      conversation: syntheticConversation,
      previousContribution: previous,
    });
    expect(next.identity.previousContributionId).toBe(previous.identity.contributionId);
  });

  it("HRI-C22 refuses an active relation whose endpoint is inactive", () => {
    const contribution = structuredClone(mapSynthetic());
    const endpoint = contribution.scientificContent.candidateObjects.find((item) => item.itemId === "beta")!;
    endpoint.epistemicBoundary.activeState = false;
    expect(auditScientificInterpretationContribution(contribution)).toContainEqual(expect.objectContaining({
      code: "ACTIVE_RELATION_ENDPOINT_INACTIVE",
      severity: "CRITICAL",
      sourceRefs: ["association"],
    }));
  });

  it("HRI-C23 accepts one sourced negative constraint as representation of the same negative statement", () => {
    const contribution = structuredClone(mapSynthetic());
    const boundary = {
      ownership: "USER",
      epistemicStatus: "EXPLICIT_USER_STATED",
      adoptionStatus: null,
      activeState: true,
      sourceTurnIds: ["T0"],
      sourceText: "sans conclure à une causalité",
    };
    contribution.scientificContent.explicitStatements.push({
      itemId: "negative-statement", semanticIdentity: "no-causality", proposedType: "STATEMENT", content: "Sans conclure à une causalité.",
      polarity: "NEGATED", studyRole: "CONSTRAINT", confidence: 1, epistemicBoundary: boundary,
    });
    contribution.scientificContent.negationsAndConstraints.push({
      itemId: "negative-constraint", semanticIdentity: "no-causality", proposedType: "CONSTRAINT", content: "Sans conclure à une causalité.",
      polarity: "NEGATED", studyRole: "CONSTRAINT", confidence: 1, epistemicBoundary: boundary,
    });
    expect(auditScientificInterpretationContribution(contribution)).not.toContainEqual(expect.objectContaining({
      code: "NEGATION_NOT_EXPLICITLY_REPRESENTED",
      sourceRefs: ["negative-statement"],
    }));
  });

  it("HRI-C24 accepts ordered exact source fragments separated by an explicit ellipsis only", () => {
    const contribution = structuredClone(mapSynthetic());
    const constraint = contribution.scientificContent.negationsAndConstraints[0];
    constraint.itemId = "elliptical-source";
    constraint.epistemicBoundary.epistemicStatus = "EXPLICIT_USER_STATED";
    constraint.epistemicBoundary.sourceText = "Comparer une méthode alpha […] sans conclure à une causalité.";
    expect(auditScientificInterpretationContribution(contribution)).not.toContainEqual(expect.objectContaining({
      code: "EXPLICIT_SOURCE_NOT_GROUNDED",
      sourceRefs: ["elliptical-source"],
    }));

    constraint.epistemicBoundary.sourceText = "Comparer une méthode alpha […] sans conclure à une supériorité.";
    expect(auditScientificInterpretationContribution(contribution)).toContainEqual(expect.objectContaining({
      code: "EXPLICIT_SOURCE_NOT_GROUNDED",
      sourceRefs: ["elliptical-source"],
    }));
  });
});
