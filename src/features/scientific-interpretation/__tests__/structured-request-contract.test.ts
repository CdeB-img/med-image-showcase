import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  GeminiHybridScientificInterpretationProvider,
  buildGeminiHybridProviderPayload,
} from "../../../../api/scientific-interpretation-provider";
import {
  EXPECTED_HYBRID_MODEL_IDENTITY,
  HYBRID_PRIMARY_INTERNAL_JSON_SCHEMA,
  HYBRID_PRIMARY_OUTPUT_FUNCTION_NAME,
  HYBRID_PRIMARY_PROVIDER_TRANSPORT_SCHEMA,
  HYBRID_PRIMARY_RUNTIME_ID,
  HYBRID_PRIMARY_RUNTIME_VERSION,
  HybridScientificInterpretationRuntimeAdapter,
  InMemoryScientificInterpretationRawStore,
  ScientificInterpretationTechnicalError,
  hybridPrimaryInterpretationSchema,
  parseHybridPrimaryProviderOutput,
  validateHybridProviderTransportSchema,
  type ScientificInterpretationConversation,
} from "..";

const ROOT = process.cwd();
const source = (path: string) => readFileSync(resolve(ROOT, path), "utf8");
const conversation: ScientificInterpretationConversation = {
  conversationId: "scr-contract",
  language: "fr",
  turns: [{ turnId: "T0", role: "USER", content: "Comparer deux méthodes sans conclure à une causalité." }],
};
const primary = {
  normalizedUnderstanding: "Comparaison non causale de deux méthodes.",
  scientificGoalCandidates: [], studyIntentCandidates: [], objects: [], relations: [], explicitStatements: [], inferredContext: [],
  contextualCandidates: [], negationsAndConstraints: [], temporalElements: [], ambiguities: [], unknowns: [], missingInformation: [],
  correctionsAndSupersessions: [], ownershipAndEpistemicStates: [], openDecisions: [], clarificationNeeds: [],
};
const execution = (value: unknown) => ({
  operationId: "scr-operation",
  provider: "GOOGLE_GEMINI",
  model: EXPECTED_HYBRID_MODEL_IDENTITY,
  promptDigest: "prompt",
  schemaDigest: "schema",
  configurationDigest: "configuration",
  runtimeId: HYBRID_PRIMARY_RUNTIME_ID,
  runtimeVersion: HYBRID_PRIMARY_RUNTIME_VERSION,
  rawOutput: { rawAttempts: [{ providerBodyText: JSON.stringify({ candidates: [{ content: { parts: [{ functionCall: { name: HYBRID_PRIMARY_OUTPUT_FUNCTION_NAME, args: value } }] } }] }) }] },
});

const directoryDigest = (root: string) => {
  const files = (directory: string): string[] => readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)]);
  const hash = createHash("sha256");
  files(root).sort().forEach((file) => {
    hash.update(relative(root, file));
    hash.update("\0");
    hash.update(readFileSync(file));
    hash.update("\0");
  });
  return hash.digest("hex");
};

describe("SEM-CLOSURE-001R — structured request contract repair", () => {
  it("SCR-C01 binds the product to the prototype frozen model identity", () => {
    const identities = JSON.parse(source("experiments/engine-lab/results/hybrid-runtime-prototype-01/runtime-identities.json"));
    const prototype = identities.runtimes.find((item: { runtimeId: string }) => item.runtimeId === "PYDANTIC_AI_DIRECT");
    expect(prototype.model).toBe(EXPECTED_HYBRID_MODEL_IDENTITY);
    expect(() => new GeminiHybridScientificInterpretationProvider({ apiKey: "key", model: EXPECTED_HYBRID_MODEL_IDENTITY })).not.toThrow();
  });

  it("SCR-C02 builds a deterministic, locally supported provider transport schema", () => {
    expect(validateHybridProviderTransportSchema(HYBRID_PRIMARY_PROVIDER_TRANSPORT_SCHEMA)).toEqual([]);
    expect(JSON.stringify(buildGeminiHybridProviderPayload(conversation))).toBe(JSON.stringify(buildGeminiHybridProviderPayload(conversation)));
  });

  it("SCR-C03 preserves the complete strict internal contract", () => {
    expect(HYBRID_PRIMARY_INTERNAL_JSON_SCHEMA.required).toHaveLength(18);
    expect(HYBRID_PRIMARY_INTERNAL_JSON_SCHEMA.required).toContain("routeProposal");
    expect(hybridPrimaryInterpretationSchema.safeParse({ ...primary, normalizedUnderstanding: "" }).success).toBe(false);
  });

  it("SCR-C04 keeps conditional provenance checks local and blocking", async () => {
    const invalidProvenance = {
      ...primary,
      objects: [{
        elementId: "method", content: "Méthode inventée", semanticIdentity: null, semanticType: "METHOD", studyRole: "METHOD",
        sourceTurnIds: ["T0"], sourceText: "extrait absent", polarity: "AFFIRMED", temporalContext: null, ownership: "USER",
        epistemicStatus: "EXPLICIT_USER_STATED", activeState: true, previousElementIds: [], evidenceRefs: [], confidence: 1,
        adoptionStatus: null, originStatus: null, originType: null, availabilityScope: null, availabilityClaim: null, decisionId: null,
      }],
    };
    const adapter = new HybridScientificInterpretationRuntimeAdapter(
      HYBRID_PRIMARY_RUNTIME_ID,
      HYBRID_PRIMARY_RUNTIME_VERSION,
      async () => execution(invalidProvenance),
      new InMemoryScientificInterpretationRawStore(),
      parseHybridPrimaryProviderOutput,
    );
    const contribution = await adapter.interpret(conversation);
    expect(contribution.audit.unresolvedFindings).toContainEqual(expect.objectContaining({ code: "EXPLICIT_SOURCE_NOT_GROUNDED", severity: "CRITICAL" }));
  });

  it("SCR-C05 rejects unknown internal fields", () => {
    expect(hybridPrimaryInterpretationSchema.safeParse({ ...primary, unexpectedProviderField: true }).success).toBe(false);
  });

  it("SCR-C06 persists raw before internal validation", async () => {
    const order: string[] = [];
    const store = new (class extends InMemoryScientificInterpretationRawStore {
      override async persistAtomically(input: Parameters<InMemoryScientificInterpretationRawStore["persistAtomically"]>[0]) {
        order.push("persist");
        return super.persistAtomically(input);
      }
    })();
    const adapter = new HybridScientificInterpretationRuntimeAdapter(
      HYBRID_PRIMARY_RUNTIME_ID,
      HYBRID_PRIMARY_RUNTIME_VERSION,
      async () => execution({ ...primary, normalizedUnderstanding: "" }),
      store,
      (raw, runtimeExecution, sourceConversation, previous) => {
        order.push("validate");
        return parseHybridPrimaryProviderOutput(raw, runtimeExecution, sourceConversation, previous);
      },
    );
    await expect(adapter.interpret(conversation)).rejects.toMatchObject({ failureClass: "STRUCTURED_CONTRACT_FAILURE" });
    expect(order).toEqual(["persist", "validate"]);
  });

  it("SCR-C07 never projects a transport response rejected by the internal contract", async () => {
    const adapter = new HybridScientificInterpretationRuntimeAdapter(
      HYBRID_PRIMARY_RUNTIME_ID,
      HYBRID_PRIMARY_RUNTIME_VERSION,
      async () => execution({ ...primary, normalizedUnderstanding: "" }),
      new InMemoryScientificInterpretationRawStore(),
      parseHybridPrimaryProviderOutput,
    );
    await expect(adapter.interpret(conversation)).rejects.toBeInstanceOf(ScientificInterpretationTechnicalError);
  });

  it("SCR-C08 adds no repair LLM", () => {
    const implementation = `${source("api/scientific-interpretation-provider.ts")}\n${source("src/features/scientific-interpretation/hybrid-primary.ts")}`;
    expect(implementation).not.toMatch(/repair[_ -]?llm|regenerat/i);
  });

  it("SCR-C09 contains no case-specific transport transformation", () => {
    const implementation = `${source("api/scientific-interpretation-provider.ts")}\n${source("src/features/scientific-interpretation/hybrid-primary.ts")}`;
    expect(implementation).not.toMatch(/caseId|SEM3-BLIND|\bI0[1-8]\b/);
  });

  it("SCR-C10 refuses model drift and exposes no silent alternative model", () => {
    expect(() => new GeminiHybridScientificInterpretationProvider({ apiKey: "key", model: "another-model" })).toThrow(/MODEL_IDENTITY_DRIFT/);
    const modelIds = source("src/features/scientific-interpretation/hybrid-primary.ts").match(/gemini-[a-z0-9.-]+/g) ?? [];
    expect([...new Set(modelIds)]).toEqual([EXPECTED_HYBRID_MODEL_IDENTITY]);
  });

  it("SCR-C11 disables legacy fallback in the live evidence runner", () => {
    const runner = source("scripts/run-sem-closure-001r-live.ts");
    expect(runner).toContain('fallbackPolicy: "LEGACY_FALLBACK_DISABLED_FOR_EVIDENCE"');
    expect(runner).not.toContain("executeLegacySemRollback");
    expect(runner).not.toContain("executeScientificInterpretation({");
  });

  it("SCR-C12 preserves the complete prior live evidence directory", () => {
    expect(directoryDigest(resolve(ROOT, "experiments/engine-lab/results/sem-closure-001-live"))).toBe("59f40177fbccbf093149d1c47364fd7ffaf2f7ab4443c861cbd8599f8b840254");
  });

  it("SCR-C13 cannot attribute an unanswered QRY need to the user as an unknown", () => {
    const contextualConversation: ScientificInterpretationConversation = {
      conversationId: "qry-grounding",
      language: "fr",
      turns: [
        { turnId: "Q1", role: "NOXIA", content: "À quels moments ?" },
        { turnId: "U1", role: "USER", content: "Je n’ai pas défini les exclusions." },
      ],
    };
    const unknown = (missingId: string, sourceTurnIds: string[], sourceText: string) => ({
      missingId, content: sourceText, decisionalImpact: "MEDIUM", blocking: false, owner: "USER",
      sourceTurnIds, sourceText, epistemicStatus: "UNKNOWN",
    });
    const runtimeExecution = execution({
      ...primary,
      unknowns: [
        unknown("user-unknown", ["U1"], "Je n’ai pas défini les exclusions."),
        unknown("qry-unknown", ["Q1"], "À quels moments ?"),
      ],
    });
    const state = parseHybridPrimaryProviderOutput(runtimeExecution.rawOutput, runtimeExecution, contextualConversation);
    expect((state.unknowns as Array<{ missingId: string }>).map((item) => item.missingId)).toEqual(["user-unknown"]);
  });

  it("SCR-C14 keeps the dependent measure unknown when analysis intent has no measured object", () => {
    const analysis = {
      elementId: "analysis", content: "Réduction significative entre les groupes", semanticIdentity: "analysis", semanticType: "ANALYSIS_INTENT", studyRole: "PRIMARY_ANALYSIS",
      sourceTurnIds: ["T0"], sourceText: "Comparer deux méthodes sans conclure à une causalité.", polarity: "AFFIRMED", temporalContext: null, ownership: "USER",
      epistemicStatus: "EXPLICIT_USER_STATED", activeState: true, previousElementIds: [], evidenceRefs: [], confidence: 1,
      adoptionStatus: null, originStatus: null, originType: null, availabilityScope: null, availabilityClaim: null, decisionId: null,
    };
    const runtimeExecution = execution({ ...primary, objects: [analysis] });
    const state = parseHybridPrimaryProviderOutput(runtimeExecution.rawOutput, runtimeExecution, conversation);
    expect(state.unknowns).toContainEqual(expect.objectContaining({ epistemicStatus: "UNKNOWN", sourceTurnIds: ["T0"] }));
  });
});
