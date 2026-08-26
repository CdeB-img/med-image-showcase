import { describe, expect, it } from "vitest";
import frozenRegistry from "../../../../validation/w1-qual-01h1-st/frozen-input-registry.json";
import { rehydrateProductOwnerResultLedger } from "@/features/protocol-designer/product-owner-result-ledger";
import { invokeScientificThinkingForProject } from "@/features/protocol-designer/product-scientific-thinking-owner-runtime";
import type { ProjectContextSnapshot, ResearchProjectOwnerProjection } from "@/features/research-project-construction";
import { executeScientificThinkingEngine } from "../engine";
import type { ScientificThinkingInput } from "../types";

type FrozenPack = (typeof frozenRegistry.packs)[number];

const packFor = (caseId: string) => {
  const pack = frozenRegistry.packs.find((item) => item.sourceCase === caseId);
  if (!pack) throw new Error(`EXPOSED_CASE_PACK_NOT_FOUND:${caseId}`);
  return pack;
};

const frozenKnowledge = (pack: FrozenPack) => {
  const entry = pack.payload.ledger.entries.find((item) => item.result?.resultId === pack.payload.knowledgeResultId);
  if (!entry?.result?.nativePayload) throw new Error(`EXPOSED_CASE_KNOWLEDGE_NOT_FOUND:${pack.sourceCase}`);
  return entry.result.nativePayload;
};

const replayExactlyOnce = (caseId: string) => {
  const pack = packFor(caseId);
  let ownerInvocations = 0;
  const invocation = invokeScientificThinkingForProject({
    project: structuredClone(pack.payload.project) as unknown as ResearchProjectOwnerProjection,
    projectSnapshot: structuredClone(pack.payload.projectSnapshot) as unknown as Readonly<ProjectContextSnapshot>,
    knowledgeResultId: pack.payload.knowledgeResultId,
    ledger: rehydrateProductOwnerResultLedger(structuredClone(pack.payload.ledger)),
    callerRef: `W1-ST-REPAIR-02:EXPOSED_NON_REGRESSION:${caseId}`,
    purpose: pack.purpose,
    startedAt: "2026-08-26T03:20:00.000Z",
    completedAt: "2026-08-26T03:20:01.000Z",
    retainedAt: "2026-08-26T03:20:01.000Z",
    runtime: (request: ScientificThinkingInput) => {
      ownerInvocations += 1;
      return executeScientificThinkingEngine(request);
    },
    monotonicNow: (() => { let value = 0; return () => ++value; })(),
  });
  expect(ownerInvocations).toBe(1);
  expect(invocation.projectWrites).toBe(0);
  expect(invocation.result?.projectWriteAuthorized).toBe(false);
  expect(invocation.entry.dependencies).toEqual([expect.objectContaining({ owner: "KNOWLEDGE", resultId: pack.payload.knowledgeResultId })]);
  const output = invocation.result?.nativePayload;
  expect(output).toBeDefined();
  expect(output?.knowledgeDependencies).toHaveLength(1);
  expect(output?.knowledgeDependencies[0]).toMatchObject({ owner: "KNOWLEDGE", ownershipTransferred: false });
  return { pack, knowledge: frozenKnowledge(pack), output: output! };
};

describe("W1-ST-REPAIR-02 — exposed Campaign D cases used once as non-regression only", () => {
  it("case 3 materializes the exact frozen Knowledge statement as a mechanism and competing branch", () => {
    const { knowledge, output } = replayExactlyOnce("ST01H1-D-RVPA-EXERCISE-MECHANISM-01");
    for (const assertion of knowledge.applicableAssertions) {
      expect(output.mechanisms.some((mechanism) => mechanism.text === assertion.text)).toBe(true);
      expect(output.hypotheses.some((hypothesis) => hypothesis.kind === "ALTERNATIVE" && hypothesis.text === assertion.text)).toBe(true);
    }
    expect(output.hypotheses.every((hypothesis) => hypothesis.reviewState === "PENDING")).toBe(true);
  });

  it("case 4 keeps explicit alternatives as distinct branches instead of a generic competing sentence", () => {
    const { output } = replayExactlyOnce("ST01H1-D-NEUROMELANIN-ALTERNATIVES-01");
    expect(output.hypotheses.filter((hypothesis) => hypothesis.kind === "ALTERNATIVE").length).toBeGreaterThanOrEqual(2);
    expect(output.hypotheses.some((hypothesis) => hypothesis.text.includes("explication concurrente générique"))).toBe(false);
    expect(output.selectedQuestionCandidate).toBeNull();
  });

  it("case 5 materializes the frozen conflict as competing hypotheses without resolving it", () => {
    const { knowledge, output } = replayExactlyOnce("ST01H1-D-LACTATE-TUMOR-CONTRADICTION-01");
    expect(output.hypotheses.filter((hypothesis) => hypothesis.kind === "ALTERNATIVE").length).toBeGreaterThanOrEqual(2);
    expect(output.contradictions).toEqual(expect.arrayContaining(knowledge.controversies.map((item) => expect.stringContaining(item.conflictId))));
    expect(output.selectedQuestionCandidate).toBeNull();
    expect(output.hypotheses.every((hypothesis) => hypothesis.reviewState === "PENDING")).toBe(true);
  });

  it("case 7 makes the exact frozen Project unknown govern clarification", () => {
    const { pack, output } = replayExactlyOnce("ST01H1-D-SPECTRAL-LUNG-PROJECT-UNKNOWN-01");
    const structuringUnknowns = pack.payload.projectSnapshot.objects.filter((item) => item.type === "UNCERTAINTY" && item.epistemicState === "UNKNOWN");
    expect(structuringUnknowns.length).toBeGreaterThan(0);
    expect(output.status).toBe("CLARIFICATION_REQUIRED");
    expect(output.proposedNextAction).toBe("CLARIFY");
    expect(output.hypotheses).toHaveLength(0);
    for (const unknown of structuringUnknowns) {
      expect(output.unknowns).toContain(unknown.content);
      expect(output.adaptiveQuestions.some((question) => question.blocking && question.label === unknown.content)).toBe(true);
    }
  });

  it("case 9 stops at the specialized owner boundary without reasoning candidates", () => {
    const { knowledge, output } = replayExactlyOnce("ST01H1-D-PREGNANCY-RADIATION-OWNERSHIP-01");
    expect(knowledge.gaps.some((gap) => gap.code.includes("SPECIALIST") && gap.code.includes("REQUIRED"))).toBe(true);
    expect(output.status).toBe("REFUSED");
    expect(output.refusal?.code).toBe("OUT_OF_DOMAIN");
    expect(output.refusal?.reason).toContain("ownership");
    expect(output.questions).toHaveLength(0);
    expect(output.hypotheses).toHaveLength(0);
    expect(output.objectives).toHaveLength(0);
    expect(output.proposedNextAction).toBe("STOP");
  });
});
