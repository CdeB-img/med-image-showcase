import { validationDigest } from "./canonical";
import { getValidationProductGate } from "./checkpoint-registry";
import type { ValidationProductFinding, ValidationRun } from "./product-contracts";

export const VAL001_PRODUCT_GATE_POLICY_VERSION = "1.0.0" as const;

export const ACTIVE_VALIDATION_PRODUCT_GATES = [
  "CONTRIBUTION_ADOPTION",
  "PROJECT_FREEZE",
  "PROTOCOL_GENERATION",
  "DMP_GENERATION",
  "SAP_GENERATION",
  "V1_READY",
  "CANDIDATE_PREVIEW",
] as const;

export type ActiveValidationProductGateId = (typeof ACTIVE_VALIDATION_PRODUCT_GATES)[number];
export type ValidationProductGateStatus = "ALLOWED" | "ALLOWED_WITH_LIMITATIONS" | "REVIEW_REQUIRED" | "BLOCKED" | "NOT_EVALUABLE" | "PREVIEW_ONLY";

export type ValidationProductGateEvaluation = {
  gateId: ActiveValidationProductGateId;
  policyVersion: typeof VAL001_PRODUCT_GATE_POLICY_VERSION;
  status: ValidationProductGateStatus;
  blockingFindingRefs: string[];
  reviewRequiredRefs: string[];
  nonBlockingFindingRefs: string[];
  missingCheckpointRefs: string[];
  evidence: string[];
  limitations: string[];
  candidatePreview: { available: boolean; labels: ["PREVIEW", "NOT_ADOPTED", "NOT_PROJECT_TRUTH"] } | null;
  projectWriteAuthorized: false;
  documentWriteAuthorized: false;
  activeInProduct: true;
  evaluationDigest: string;
};

const compare = (left: string, right: string) => left < right ? -1 : left > right ? 1 : 0;
const unique = (items: readonly string[]) => [...new Set(items.filter(Boolean))].sort(compare);
const gateContext = (gateId: ActiveValidationProductGateId) => gateId === "CONTRIBUTION_ADOPTION" ? "Adoption" : gateId === "PROJECT_FREEZE" ? "Gel du projet" : gateId === "PROTOCOL_GENERATION" ? "Protocole" : gateId === "DMP_GENERATION" ? "Data Management" : gateId === "SAP_GENERATION" ? "Analyses" : gateId === "V1_READY" ? "Préparation V1" : "Prévisualisation";

const runOrderKey = (run: ValidationRun) => `${run.completedAt ?? run.startedAt}\u0000${run.startedAt}\u0000${run.validationRunId}`;
const latestRunsByCheckpoint = (runs: readonly ValidationRun[]) => runs.reduce<Map<string, ValidationRun>>((map, run) => {
  const previous = map.get(run.checkpointRef.checkpointId);
  if (!previous || runOrderKey(run) > runOrderKey(previous)) map.set(run.checkpointRef.checkpointId, run);
  return map;
}, new Map());

const findingsFor = (runs: readonly ValidationRun[], ids: readonly string[]) => runs.filter((run) => ids.includes(run.checkpointRef.checkpointId)).flatMap((run) => run.findings);

const blocksByPolicy = (finding: ValidationProductFinding, blockingSeverities: readonly string[]) => finding.blocking || blockingSeverities.includes(finding.severity) || ["BLOCK_HANDOFF", "FAIL_CLOSED"].includes(finding.disposition);

export const evaluateValidationProductGate = (gateId: ActiveValidationProductGateId, runs: readonly ValidationRun[]): ValidationProductGateEvaluation => {
  const gate = getValidationProductGate(gateId);
  if (!gate) throw new Error(`VAL_PRODUCT_GATE_UNKNOWN:${gateId}`);
  const latest = latestRunsByCheckpoint(runs);
  const requiredRuns = gate.requiredCheckpoints.map((checkpointId) => latest.get(checkpointId)).filter((run): run is ValidationRun => Boolean(run));
  const missingCheckpointRefs = gate.requiredCheckpoints.filter((checkpointId) => !latest.has(checkpointId));
  const findings = findingsFor(requiredRuns, gate.requiredCheckpoints);
  const blocking = findings.filter((finding) => blocksByPolicy(finding, gate.blockingSeverities));
  const review = requiredRuns.flatMap((run) => [
    ...run.semanticReviewRequests.map((item) => item.requestId),
    ...run.humanReviewRequests.map((item) => item.requestId),
    ...run.findings.filter((item) => item.reviewRequired).map((item) => item.findingId),
  ]);
  const nonBlocking = findings.filter((finding) => !blocksByPolicy(finding, gate.blockingSeverities));
  const technical = requiredRuns.filter((run) => run.status === "TECHNICAL_FAILURE" || run.status === "NOT_EVALUABLE");
  const requiredPendingSemantic = requiredRuns.filter((run) => run.status === "PENDING_SEMANTIC_REVIEW");
  const requiredPendingHuman = requiredRuns.filter((run) => run.status === "PENDING_HUMAN_REVIEW");
  const notApplicable = requiredRuns.filter((run) => run.status === "NOT_APPLICABLE");

  let status: ValidationProductGateStatus;
  const limitations = [...gate.limitations];
  if (gateId === "CANDIDATE_PREVIEW") status = "PREVIEW_ONLY";
  else if (blocking.length) status = "BLOCKED";
  else if (technical.length) status = "NOT_EVALUABLE";
  else if (gateId === "PROJECT_FREEZE" && (missingCheckpointRefs.length || requiredPendingSemantic.length || requiredPendingHuman.length)) status = "BLOCKED";
  else if (gateId === "V1_READY" && missingCheckpointRefs.length) status = "NOT_EVALUABLE";
  else if (missingCheckpointRefs.length) status = "NOT_EVALUABLE";
  else if (review.length) status = gate.unresolvedFindingPolicy === "BLOCK_ON_BLOCKING" ? "REVIEW_REQUIRED" : "REVIEW_REQUIRED";
  else if (nonBlocking.length || notApplicable.length || requiredRuns.some((run) => run.limitations.length || run.findings.some((item) => item.findingClass === "SEMANTIC_EQUIVALENCE_QUALIFIED"))) status = "ALLOWED_WITH_LIMITATIONS";
  else status = "ALLOWED";

  if (["PROTOCOL_GENERATION", "DMP_GENERATION", "SAP_GENERATION"].includes(gateId) && requiredRuns.some((run) => run.findings.some((item) => item.invariantRef === "DOC:NOT_GENERATABLE_PRESERVED" && !item.blocking))) status = "ALLOWED_WITH_LIMITATIONS";
  if (gateId === "V1_READY") limitations.push("V1_READY is an operational gate and never a PD-011 scientific qualification.");
  const material = {
    gateId,
    policyVersion: VAL001_PRODUCT_GATE_POLICY_VERSION,
    status,
    blockingFindingRefs: unique(blocking.map((item) => item.findingId)),
    reviewRequiredRefs: unique(review),
    nonBlockingFindingRefs: unique(nonBlocking.map((item) => item.findingId)),
    missingCheckpointRefs: unique(missingCheckpointRefs),
    evidence: unique(requiredRuns.map((run) => run.resultDigest)),
    limitations: unique(limitations),
    candidatePreview: gateId === "CANDIDATE_PREVIEW" ? { available: true, labels: ["PREVIEW", "NOT_ADOPTED", "NOT_PROJECT_TRUTH"] as ["PREVIEW", "NOT_ADOPTED", "NOT_PROJECT_TRUTH"] } : null,
    projectWriteAuthorized: false as const,
    documentWriteAuthorized: false as const,
    activeInProduct: true as const,
  };
  return { ...material, evaluationDigest: validationDigest(material) };
};

export type ValidationProductSummary = {
  status: "READY" | "COMPLETE_WITH_FINDINGS" | "REVIEW_REQUIRED" | "BLOCKED" | "NOT_EVALUABLE";
  blockers: Array<{ findingRef: string; message: string; context: string }>;
  reviewsRequired: Array<{ requestRef: string; message: string; owner: string }>;
  unknowns: string[];
  incompleteCheckpoints: string[];
  limitations: string[];
  contextualFindings: Array<{ context: "INTERPRETATION" | "RAISONNEMENT" | "PROJECT" | "DONNÉES" | "DATA_MANAGEMENT" | "ANALYSES" | "DOCUMENTS"; finding: ValidationProductFinding }>;
  gates: ValidationProductGateEvaluation[];
  history: Array<{ runId: string; checkpointId: string; status: ValidationRun["status"]; resultDigest: string }>;
  expert: { runs: ValidationRun[] };
  providerCallsOnRender: 0;
  overallScore: null;
};

const contextFor = (checkpointId: string): ValidationProductSummary["contextualFindings"][number]["context"] => checkpointId.includes("REQUEST") ? "INTERPRETATION" : checkpointId.includes("ST-") ? "RAISONNEMENT" : checkpointId.includes("PRJ") ? "PROJECT" : checkpointId.includes("STUDY-DATA") ? "DONNÉES" : checkpointId.includes("DM") ? "DATA_MANAGEMENT" : checkpointId.includes("BIO") ? "ANALYSES" : "DOCUMENTS";

export const buildValidationProductSummary = (runs: readonly ValidationRun[], gateEvaluations?: readonly ValidationProductGateEvaluation[]): ValidationProductSummary => {
  const gates = gateEvaluations ?? ACTIVE_VALIDATION_PRODUCT_GATES.map((gateId) => evaluateValidationProductGate(gateId, runs));
  const findings = runs.flatMap((run) => run.findings);
  const blockers = [
    ...findings.filter((item) => item.blocking).map((item) => ({ findingRef: item.findingId, message: "Une incohérence bloquante doit être traitée par son propriétaire.", context: contextFor(item.checkpointId) })),
    ...gates.filter((gate) => gate.status === "BLOCKED").map((gate) => ({ findingRef: `gate:${gate.gateId}`, message: "Cette action reste bloquée tant que les contrôles requis ne sont pas satisfaits.", context: gateContext(gate.gateId) })),
  ];
  const reviewsRequired = runs.flatMap((run) => [
    ...run.semanticReviewRequests.map((item) => ({ requestRef: item.requestId, message: "La fidélité sémantique doit être examinée avant de poursuivre.", owner: "VALIDATION_REVIEW" })),
    ...run.humanReviewRequests.map((item) => ({ requestRef: item.requestId, message: "Une décision humaine est nécessaire avant de poursuivre.", owner: item.domainOwner })),
  ]).concat(gates.filter((gate) => gate.status === "REVIEW_REQUIRED").map((gate) => ({ requestRef: `gate:${gate.gateId}`, message: "Cette action nécessite une revue avant de poursuivre.", owner: gate.gateId })));
  const incompleteCheckpoints = [
    ...runs.filter((run) => ["NOT_EVALUABLE", "TECHNICAL_FAILURE", "PENDING_SEMANTIC_REVIEW", "PENDING_HUMAN_REVIEW"].includes(run.status)).map((run) => run.checkpointRef.checkpointId),
    ...gates.flatMap((gate) => gate.missingCheckpointRefs),
  ];
  const hasNotEvaluableGate = gates.some((gate) => gate.status === "NOT_EVALUABLE");
  const status: ValidationProductSummary["status"] = !runs.length ? "NOT_EVALUABLE" : blockers.length ? "BLOCKED" : reviewsRequired.length ? "REVIEW_REQUIRED" : hasNotEvaluableGate ? "NOT_EVALUABLE" : findings.length ? "COMPLETE_WITH_FINDINGS" : "READY";
  return {
    status,
    blockers,
    reviewsRequired,
    unknowns: unique(runs.flatMap((run) => run.limitations.filter((item) => /UNKNOWN|NOT_GENERATABLE/.test(item)))),
    incompleteCheckpoints: unique(incompleteCheckpoints),
    limitations: unique(runs.flatMap((run) => run.limitations)),
    contextualFindings: findings.map((finding) => ({ context: contextFor(finding.checkpointId), finding })),
    gates: gates.map((gate) => structuredClone(gate)),
    history: runs.map((run) => ({ runId: run.validationRunId, checkpointId: run.checkpointRef.checkpointId, status: run.status, resultDigest: run.resultDigest })),
    expert: { runs: runs.map((run) => structuredClone(run)) },
    providerCallsOnRender: 0,
    overallScore: null,
  };
};
