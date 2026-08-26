import { describe, expect, it } from "vitest";
import probeRegistry from "../../../../validation/w1-st-repair-02/development-probes.json";
import { executeScientificThinkingEngine } from "../engine";
import type { KnowledgeSupport, ScientificThinkingInput } from "../types";
import { makeThinkingInput } from "./fixtures";

type Probe = (typeof probeRegistry.probes)[number];

const buildInput = (probe: Probe): ScientificThinkingInput => {
  const statements = "reasoningStatements" in probe ? probe.reasoningStatements ?? [] : [];
  const controversies = "controversies" in probe ? probe.controversies ?? [] : [];
  const projectUnknowns = "projectUnknowns" in probe ? probe.projectUnknowns ?? [] : [];
  const knowledgeGaps = "knowledgeGaps" in probe ? probe.knowledgeGaps ?? [] : [];
  return makeThinkingInput({
    requestId: `scientific-thinking-request:${probe.probeId}`,
    originalExpression: `${probe.question} ${probe.purpose}`,
    validatedReformulation: probe.question,
    scientificIntent: {
      intentRef: `scientific-intent:${probe.probeId}`,
      userExpertise: "UNKNOWN",
      sourceJourney: "DESIGN_STUDY",
      semanticModelRef: `project:${probe.probeId}`,
      semanticModelDigest: `project-digest:${probe.probeId}`,
    },
    researchContext: {
      sessionId: `session:${probe.probeId}`,
      contextVersion: 1,
      researchProjectId: `project:${probe.probeId}`,
      previousDecisionIds: [`decision:${probe.probeId}`],
    },
    scientificObjectTerms: [probe.question, probe.domain],
    resolvedConcepts: [{ conceptId: `concept:${probe.probeId}`, label: probe.domain, status: "RESOLVED" }],
    relations: ["RELATION_EXPLICITLY_UNDER_REVIEW"],
    population: [`Population du probe ${probe.probeId}`],
    pathologyOrCondition: [probe.domain],
    phenomena: [probe.question],
    outcomes: [],
    methodsMentioned: [],
    scientificPurpose: [probe.purpose],
    context: [probe.domain],
    missingInformation: projectUnknowns.map((item) => item.text),
    projectUnknowns: projectUnknowns.map((item) => ({ ...item })),
    contradictions: controversies.map((item) => `${item.conflictRef}:${item.state}:${item.explanation}`),
    information: { explicit: [probe.question, probe.purpose], interpreted: [] },
    knowledge: {
      ...makeThinkingInput().knowledge,
      ownerResultRef: `knowledge-result:${probe.probeId}@1`,
      resultId: `knowledge-result:${probe.probeId}`,
      resultRevision: 1,
      resultDigest: `knowledge-digest:${probe.probeId}`,
      coverageStatus: probe.knowledgeSupport,
      support: probe.knowledgeSupport as KnowledgeSupport,
      sourceIds: [`source:${probe.probeId}`],
      assertionRefs: statements.map((_item, index) => `assertion:${probe.probeId}:${index + 1}`),
      evidenceRefs: statements.map((_item, index) => `evidence:${probe.probeId}:${index + 1}`),
      contradictionRefs: controversies.map((item) => item.conflictRef),
      contradictions: [...statements, ...controversies.map((item) => `${item.conflictRef}:${item.state}:${item.explanation}`)],
      gapRefs: knowledgeGaps.map((item) => item.gapRef),
      gapCodes: knowledgeGaps.map((item) => item.code),
      reasoningStatements: statements.map((text, index) => ({
        statementRef: `assertion:${probe.probeId}:${index + 1}`,
        text,
        status: "GOVERNED_DOCUMENTARY",
        applicability: "APPLICABLE_WITH_LIMITATIONS",
        limitations: ["DEVELOPMENT_ONLY_NON_QUALIFYING"],
        evidenceRefs: [`evidence:${probe.probeId}:${index + 1}`],
        sourceRefs: [`source:${probe.probeId}`],
        owner: "KNOWLEDGE",
        ownershipTransferred: false,
      })),
      controversies: controversies.map((item) => ({ ...item, positionRefs: [] })),
      gaps: knowledgeGaps.map((item) => ({ ...item })),
      limitations: ["DEVELOPMENT_ONLY_NON_QUALIFYING"],
    },
  });
};

const probesFor = (defectClass: string) => probeRegistry.probes.filter((probe) => probe.defectClass === defectClass);

describe("W1-ST-REPAIR-02 — frozen fresh development probes", () => {
  for (const probe of probesFor("MECHANISTIC_REASONING_NOT_MATERIALIZED")) {
    it(`${probe.probeId} materializes the exact Knowledge reasoning statement as a mechanism candidate`, () => {
      const output = executeScientificThinkingEngine(buildInput(probe));
      for (const statement of probe.reasoningStatements) {
        expect(output.mechanisms.some((mechanism) => mechanism.text.includes(statement))).toBe(true);
      }
      expect(output.mechanisms.every((mechanism) => mechanism.linkedHypothesisIds.length > 0)).toBe(true);
      expect(output.hypotheses.every((candidate) => candidate.reviewState === "PENDING")).toBe(true);
    });
  }

  for (const probe of probesFor("NAMED_ALTERNATIVES_FLATTENED_TO_GENERIC_COMPETING_BRANCH")) {
    it(`${probe.probeId} retains each named Knowledge alternative as a distinct pending branch`, () => {
      const output = executeScientificThinkingEngine(buildInput(probe));
      for (const statement of probe.reasoningStatements) {
        expect(output.hypotheses.some((hypothesis) => hypothesis.kind === "ALTERNATIVE" && hypothesis.text.includes(statement))).toBe(true);
      }
      expect(output.hypotheses.some((hypothesis) => hypothesis.text.includes("explication concurrente générique"))).toBe(false);
      expect(output.selectedQuestionCandidate).toBeNull();
    });
  }

  for (const probe of probesFor("KNOWLEDGE_CONTRADICTION_NOT_MATERIALIZED_AS_COMPETING_HYPOTHESES")) {
    it(`${probe.probeId} materializes the conflicting Knowledge positions without choosing a winner`, () => {
      const output = executeScientificThinkingEngine(buildInput(probe));
      expect(output.contradictions).toEqual(expect.arrayContaining(probe.controversies.map((item) => expect.stringContaining(item.conflictRef))));
      expect(output.hypotheses.filter((hypothesis) => hypothesis.kind === "ALTERNATIVE")).toHaveLength(probe.reasoningStatements.length);
      for (const statement of probe.reasoningStatements) {
        expect(output.hypotheses.some((hypothesis) => hypothesis.text.includes(statement))).toBe(true);
      }
      expect(output.hypotheses.every((candidate) => candidate.reviewState === "PENDING")).toBe(true);
    });
  }

  for (const probe of probesFor("STRUCTURING_PROJECT_UNKNOWN_NOT_GOVERNING_REASONING_BRANCH")) {
    it(`${probe.probeId} makes the exact Project unknown govern a blocking clarification`, () => {
      const output = executeScientificThinkingEngine(buildInput(probe));
      expect(output.status).toBe("CLARIFICATION_REQUIRED");
      expect(output.proposedNextAction).toBe("CLARIFY");
      expect(output.hypotheses).toHaveLength(0);
      for (const unknown of probe.projectUnknowns) {
        expect(output.unknowns).toContain(unknown.text);
        expect(output.adaptiveQuestions.some((question) => question.blocking && question.label.includes(unknown.text))).toBe(true);
      }
    });
  }

  for (const probe of probesFor("OUT_OF_OWNERSHIP_QUESTION_NOT_REFUSED_OR_ESCALATED")) {
    it(`${probe.probeId} refuses the out-of-owner decision and exposes the restart condition`, () => {
      const output = executeScientificThinkingEngine(buildInput(probe));
      expect(output.status).toBe("REFUSED");
      expect(output.refusal?.code).toBe("OUT_OF_DOMAIN");
      expect(output.refusal?.reason).toContain("ownership");
      expect(output.refusal?.resumeCondition).toContain(probe.knowledgeGaps[0].resumeCondition);
      expect(output.questions).toHaveLength(0);
      expect(output.hypotheses).toHaveLength(0);
      expect(output.objectives).toHaveLength(0);
      expect(output.proposedNextAction).toBe("STOP");
    });
  }

  it("W1STR02-CONTROL-ASSOCIATION-01 does not introduce a false refusal", () => {
    const probe = probesFor("NEGATIVE_CONTROL_NO_FALSE_BLOCK")[0];
    const output = executeScientificThinkingEngine(buildInput(probe));
    expect(output.status).not.toBe("REFUSED");
    expect(output.refusal).toBeNull();
    expect(output.hypotheses.length + output.objectives.length).toBeGreaterThan(0);
    expect([...output.hypotheses, ...output.objectives].every((candidate) => candidate.reviewState === "PENDING")).toBe(true);
  });

  it("W1STR02-CONTROL-GAP-02 distinguishes an evidence gap from owner escalation", () => {
    const probe = probesFor("NEGATIVE_CONTROL_NO_FALSE_OWNER_ESCALATION")[0];
    const output = executeScientificThinkingEngine(buildInput(probe));
    expect(output.status).not.toBe("REFUSED");
    expect(output.refusal).toBeNull();
    expect(output.knowledgeRequest?.gapCodes).toContain("MISSING_SOURCE_ACCESS");
  });

  it("replays one representative probe per repaired class deterministically", () => {
    const representatives = [
      "MECHANISTIC_REASONING_NOT_MATERIALIZED",
      "NAMED_ALTERNATIVES_FLATTENED_TO_GENERIC_COMPETING_BRANCH",
      "KNOWLEDGE_CONTRADICTION_NOT_MATERIALIZED_AS_COMPETING_HYPOTHESES",
      "STRUCTURING_PROJECT_UNKNOWN_NOT_GOVERNING_REASONING_BRANCH",
      "OUT_OF_OWNERSHIP_QUESTION_NOT_REFUSED_OR_ESCALATED",
    ].map((defectClass) => probesFor(defectClass)[0]);
    for (const probe of representatives) {
      const first = executeScientificThinkingEngine(buildInput(probe));
      const replay = executeScientificThinkingEngine(buildInput(probe));
      expect(replay.outputDigest).toBe(first.outputDigest);
      expect(replay.questions).toEqual(first.questions);
      expect(replay.hypotheses).toEqual(first.hypotheses);
      expect(replay.mechanisms).toEqual(first.mechanisms);
      expect(replay.refusal).toEqual(first.refusal);
    }
  });
});
