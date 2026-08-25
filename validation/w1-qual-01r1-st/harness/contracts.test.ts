import { describe, expect, it } from "vitest";
import {
  adjudicateCase,
  evaluateKnowledgeInputGate,
  evaluateMechanisticObligation,
  evaluateNegativeExpectation,
  evaluateTraceCompleteness,
  FAILURE_TAXONOMY,
  FIRST_DIVERGENT_STAGES,
  type CandidateObservation,
  type KnowledgeGateInput,
  type QualificationTrace,
} from "./contracts";
import { validateHarnessDefinition } from "./validator";

const admissibleKnowledge = (): KnowledgeGateInput => ({
  expectedProject: { projectId: "P", projectVersion: "P:1", projectDigest: "PD" },
  observedProject: { projectId: "P", projectVersion: "P:1", projectDigest: "PD" },
  resultRef: "K@1",
  resultDigest: "KD",
  provenanceRefs: ["RB@1"],
  applicabilityRepresented: true,
  sourceRefs: ["SOURCE"],
  evidenceRefs: ["EVIDENCE"],
  evidenceRequired: true,
  gapsExpected: ["GAP"],
  gapsObserved: ["GAP"],
  limitationsExpected: ["LIMIT"],
  limitationsObserved: ["LIMIT"],
  contradictionsExpected: ["CONFLICT"],
  contradictionsObserved: ["CONFLICT"],
  preEncodedStDecision: false,
  stale: false,
  purposeCoherent: true,
  frozen: true,
  digestValid: true,
});

const completeTrace = (): QualificationTrace => ({
  caseId: "CASE",
  project: { projectId: "P", projectVersion: "P:1", projectDigest: "PD" },
  knowledgeResultRef: "K@1",
  knowledgeResultDigest: "KD",
  stRequestRef: "R",
  stRequestDigest: "RD",
  stVersion: "1.2.1",
  stResultRef: "S@1",
  stResultDigest: "SD",
  status: "COMPLETED",
  candidateStructure: { questions: 1, hypotheses: 2, objectives: 1, mechanisms: 1, alternatives: 1, scientificModels: 0 },
  gaps: [],
  limitations: ["LIMIT"],
  contradictions: [],
  firstDivergentStage: null,
  durationMs: 1,
  replayRefs: [],
});

const observation = (overrides: Partial<CandidateObservation> = {}): CandidateObservation => ({
  status: "CANDIDATES_PROPOSED",
  questions: 1,
  hypotheses: 2,
  objectives: 1,
  mechanisms: 1,
  scientificModels: 0,
  candidatesPending: true,
  conditionsExplicit: true,
  unknownsPreserved: true,
  gapExplicit: false,
  refusalCode: null,
  ...overrides,
});

describe("W1-QUAL-01R1 harness contracts", () => {
  it("blocks a campaign for a harness defect without creating a human or owner verdict", () => {
    const result = adjudicateCase({ harnessDefect: true, referenceDefect: false, frozenInputValid: true, traceComplete: true, scientificConflictRequiresHuman: true, validOwnerCriticalViolation: true, nonCriticalLimitations: false });
    expect(result.caseVerdict).toBe("NON_ADJUDICABLE");
    expect(result.status.ownerCharacterizationStatus).toBe("NOT_ADJUDICATED");
    expect(result.status.campaignStatus).toBe("BLOCKED_BY_CHARACTERIZATION_HARNESS");
  });

  it("makes a reference defect non-adjudicable and never owner repair", () => {
    const result = adjudicateCase({ harnessDefect: false, referenceDefect: true, frozenInputValid: true, traceComplete: true, scientificConflictRequiresHuman: false, validOwnerCriticalViolation: true, nonCriticalLimitations: false });
    expect(result.failureClass).toBe("REFERENCE_ENVELOPE_DEFECT");
    expect(result.status.ownerCharacterizationStatus).toBe("NOT_ADJUDICATED");
  });

  it("uses human arbitration only for a true scientific conflict after technical gates", () => {
    const technical = adjudicateCase({ harnessDefect: false, referenceDefect: false, frozenInputValid: true, traceComplete: true, scientificConflictRequiresHuman: true, validOwnerCriticalViolation: false, nonCriticalLimitations: false });
    const harness = adjudicateCase({ harnessDefect: true, referenceDefect: false, frozenInputValid: true, traceComplete: true, scientificConflictRequiresHuman: true, validOwnerCriticalViolation: false, nonCriticalLimitations: false });
    expect(technical.status.ownerCharacterizationStatus).toBe("HUMAN_ARBITRATION_REQUIRED");
    expect(harness.status.ownerCharacterizationStatus).toBe("NOT_ADJUDICATED");
  });

  it("authorizes owner repair only for a valid owner critical violation", () => {
    const result = adjudicateCase({ harnessDefect: false, referenceDefect: false, frozenInputValid: true, traceComplete: true, scientificConflictRequiresHuman: false, validOwnerCriticalViolation: true, nonCriticalLimitations: false });
    expect(result.status.ownerCharacterizationStatus).toBe("OWNER_REPAIR_REQUIRED");
    expect(result.failureClass).toBe("ST_CRITICAL_REASONING_OMISSION");
  });

  it("makes an incomplete trace non-adjudicable with no owner verdict", () => {
    const trace = completeTrace();
    trace.stResultDigest = null;
    expect(evaluateTraceCompleteness(trace)).toEqual(expect.objectContaining({ traceQualificationComplete: "NO", caseAdjudicable: false, missingFields: ["stResultDigest"] }));
    const result = adjudicateCase({ harnessDefect: false, referenceDefect: false, frozenInputValid: true, traceComplete: false, scientificConflictRequiresHuman: false, validOwnerCriticalViolation: true, nonCriticalLimitations: false });
    expect(result.status.ownerCharacterizationStatus).toBe("NOT_ADJUDICATED");
  });

  it("makes an invalid frozen input non-adjudicable", () => {
    const gate = evaluateKnowledgeInputGate({ ...admissibleKnowledge(), digestValid: false });
    expect(gate.status).toBe("NON_ADJUDICABLE");
    const result = adjudicateCase({ harnessDefect: false, referenceDefect: false, frozenInputValid: false, traceComplete: true, scientificConflictRequiresHuman: false, validOwnerCriticalViolation: true, nonCriticalLimitations: false });
    expect(result.failureClass).toBe("FROZEN_INPUT_DEFECT");
  });

  it("permits a genuinely conditional pending candidate while preserving unknowns", () => {
    expect(evaluateNegativeExpectation("CONDITIONAL_CANDIDATE_ALLOWED", observation()).outcome).toBe("SATISFIED");
    expect(evaluateNegativeExpectation("CONDITIONAL_CANDIDATE_ALLOWED", observation({ conditionsExplicit: false })).outcome).toBe("VIOLATED");
  });

  it("enforces strict no-candidate only as an actual strict stop", () => {
    const stopped = observation({ status: "REFUSED", questions: 0, hypotheses: 0, objectives: 0, mechanisms: 0, refusalCode: "OUT_OF_DOMAIN" });
    expect(evaluateNegativeExpectation("STRICT_NO_CANDIDATE_EXPECTED", stopped).outcome).toBe("SATISFIED");
    expect(evaluateNegativeExpectation("STRICT_NO_CANDIDATE_EXPECTED", observation()).outcome).toBe("VIOLATED");
  });

  it("evaluates a generic linked mechanistic candidate without exact wording or count", () => {
    const result = evaluateMechanisticObligation({ mechanisms: [{ linkedHypothesisIds: ["H"], status: "MECHANISM_TO_DOCUMENT", text: "A relation explicative candidate reste à tester." }], scientificModels: [], hypotheses: [{ hypothesisId: "H" }] });
    expect(result).toEqual(expect.objectContaining({ outcome: "SATISFIED", evidenceKind: "MECHANISM_CANDIDATE" }));
    expect(evaluateMechanisticObligation({ mechanisms: [], scientificModels: [], hypotheses: [{ hypothesisId: "H" }] }).outcome).toBe("VIOLATED");
  });

  it("accepts preserved gaps and contradictions in the Knowledge gate", () => {
    const gate = evaluateKnowledgeInputGate(admissibleKnowledge());
    expect(gate.status).toBe("USABLE");
    expect(gate.usableForStCharacterization).toBe("YES");
    expect(FAILURE_TAXONOMY).toContain("UNKNOWN_FAILURE");
    expect(FIRST_DIVERGENT_STAGES).toContain("ST_SCIENTIFIC_MODEL_CONSTRUCTION");
    expect(evaluateTraceCompleteness(completeTrace()).traceQualificationComplete).toBe("YES");
  });

  it("fails the machine validator when a required taxonomy member is absent", () => {
    const result = validateHarnessDefinition({ taxonomy: FAILURE_TAXONOMY.filter((item) => item !== "UNKNOWN_FAILURE"), stages: FIRST_DIVERGENT_STAGES, unitTestsPassed: 10, unitTestsTotal: 10 });
    expect(result.valid).toBe(false);
    expect(result.findings).toContainEqual(expect.objectContaining({ code: "MISSING_FAILURE_CLASS", evidence: "UNKNOWN_FAILURE" }));
  });
});
