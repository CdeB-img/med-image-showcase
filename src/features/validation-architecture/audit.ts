import { stableValidationStringify, validationDigest } from "./canonical";
import { validateTransformation } from "./engine";
import { VALIDATION_INVARIANT_IDS } from "./invariants";
import { VALIDATION_POLICIES, VALIDATOR_REGISTRY } from "./registry";
import type {
  ValidationArchitectureAuditCode,
  ValidationArchitectureAuditFinding,
  ValidationArchitectureAuditResult,
  ValidationPolicy,
  ValidationRequest,
  ValidationRunner,
  ValidatorDefinition,
} from "./types";

export type ValidationArchitectureAuditInput = {
  validators?: ValidatorDefinition[];
  policies?: ValidationPolicy[];
  probeRequest?: ValidationRequest;
  probeRunners?: Record<string, ValidationRunner>;
};

const makeProbeRequest = (): ValidationRequest => ({
  validationId: "VAL-AUDIT-PROBE",
  validatorType: "PROJECT_CONSISTENCY",
  sourceArtifact: {
    artifactId: "audit-source", artifactType: "RESEARCH_PROJECT_RESULT", version: "1.0.0", digest: "audit-source-digest", owner: "RESEARCH_PROJECT", sourceArtifactRefs: [], boundary: "AUDIT_FIXTURE",
    elements: [{ ref: "object:1", kind: "PROJECT_OBJECT", semanticKey: "object", status: "KNOWN", sourceRefs: [], provenanceRefs: ["source:1"], owner: "RESEARCH_PROJECT" }], relations: [],
  },
  targetArtifact: {
    artifactId: "audit-target", artifactType: "RESEARCH_PROJECT_RESULT", version: "1.0.0", digest: "audit-target-digest", owner: "RESEARCH_PROJECT", sourceArtifactRefs: ["audit-source"], boundary: "AUDIT_FIXTURE",
    elements: [{ ref: "object:1", kind: "PROJECT_OBJECT", semanticKey: "object", status: "KNOWN", sourceRefs: ["object:1"], provenanceRefs: ["source:1"], owner: "RESEARCH_PROJECT" }], relations: [],
  },
  sourceVersion: "1.0.0", targetVersion: "1.0.0", sourceDigest: "audit-source-digest", targetDigest: "audit-target-digest", context: {}, expectedInvariantSet: [...VALIDATION_INVARIANT_IDS], humanDecisions: [], unknowns: [], contradictions: [], limitations: [], provenance: ["VAL-000:AUDIT_PROBE"], requestedAt: "2026-08-11T00:00:00.000Z", validationPolicyVersion: "1.0.0",
});

export const auditValidationArchitecture = (input: ValidationArchitectureAuditInput = {}): ValidationArchitectureAuditResult => {
  const validators = structuredClone(input.validators ?? VALIDATOR_REGISTRY.validators);
  const policies = structuredClone(input.policies ?? VALIDATION_POLICIES);
  const findings: ValidationArchitectureAuditFinding[] = [];
  const invariantIds = new Set(VALIDATION_INVARIANT_IDS);
  const validatorIds = new Set(validators.map((item) => item.validatorId));

  const addFinding = (code: ValidationArchitectureAuditCode, subjectId: string, message: string, evidenceRefs: string[], severity: ValidationArchitectureAuditFinding["severity"] = "ERROR") => {
    const payload = { code, subjectId, message, evidenceRefs: [...evidenceRefs].sort() };
    findings.push({ findingId: `VAL-AUD-${validationDigest(payload).slice(5)}`, code, severity, subjectId, message, evidenceRefs: payload.evidenceRefs, automaticCorrectionAllowed: false });
  };

  for (const validator of validators) {
    if (!validator.version.trim()) addFinding("VALIDATOR_WITHOUT_VERSION", validator.validatorId, "Validator version is missing.", [validator.validatorId]);
    if (!validator.owner.trim()) addFinding("VALIDATOR_WITHOUT_OWNER", validator.validatorId, "Validator owner is missing.", [validator.validatorId]);
    if (validator.supportedInvariantIds.length === 0) addFinding("VALIDATOR_WITHOUT_INVARIANTS", validator.validatorId, "Validator declares no supported invariant.", [validator.validatorId]);
    for (const invariantId of validator.supportedInvariantIds.filter((item) => !invariantIds.has(item))) addFinding("UNKNOWN_INVARIANT", validator.validatorId, `Validator references unknown invariant ${invariantId}.`, [validator.validatorId, invariantId]);
    if (validator.provenance.length === 0) addFinding("MISSING_PROVENANCE", validator.validatorId, "Validator architecture provenance is missing.", [validator.validatorId]);
    if (validator.status === "AVAILABLE" && validator.availability !== "AVAILABLE") addFinding("UNAVAILABLE_VALIDATOR_MARKED_AVAILABLE", validator.validatorId, `Validator status is AVAILABLE while availability is ${validator.availability}.`, [validator.validatorId]);
  }

  for (const policy of policies) {
    if (policy.requiredValidators.length === 0 || policy.requiredValidators.some((item) => !validatorIds.has(item.validatorId))) addFinding("POLICY_WITHOUT_VALIDATOR", policy.policyId, "Policy has no complete registered validator set.", policy.requiredValidators.map((item) => item.validatorId));
    if (policy.blockingSeverities.length === 0) addFinding("POLICY_WITHOUT_BLOCKING_RULE", policy.policyId, "Policy declares no blocking severity.", [policy.policyId]);
    for (const invariantId of policy.invariantIds.filter((item) => !invariantIds.has(item))) addFinding("UNKNOWN_INVARIANT", policy.policyId, `Policy references unknown invariant ${invariantId}.`, [policy.policyId, invariantId]);
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();
  const byId = new Map(validators.map((item) => [item.validatorId, item]));
  const visit = (validatorId: string, path: string[]) => {
    if (visiting.has(validatorId)) {
      addFinding("CIRCULAR_VALIDATION_DEPENDENCY", validatorId, `Circular validator dependency: ${[...path, validatorId].join(" → ")}.`, [...path, validatorId]);
      return;
    }
    if (visited.has(validatorId)) return;
    visiting.add(validatorId);
    for (const dependency of byId.get(validatorId)?.dependencies ?? []) if (byId.has(dependency)) visit(dependency, [...path, validatorId]);
    visiting.delete(validatorId);
    visited.add(validatorId);
  };
  validators.forEach((item) => visit(item.validatorId, []));

  for (const validator of validators.filter((item) => item.availability === "AVAILABLE")) {
    const runner = input.probeRunners?.[validator.validatorId] ?? ((request: ValidationRequest) => validateTransformation({ ...request, validatorType: validator.validatorType }, validator.validatorId));
    const firstRequest = structuredClone(input.probeRequest ?? makeProbeRequest());
    firstRequest.validatorType = validator.validatorType;
    const sourceBefore = stableValidationStringify(firstRequest.sourceArtifact);
    const targetBefore = stableValidationStringify(firstRequest.targetArtifact);
    let firstResult;
    try {
      firstResult = runner(firstRequest, validator);
    } catch {
      addFinding("NON_DETERMINISTIC_VALIDATOR", validator.validatorId, "Validator probe could not be reproduced because execution failed.", [validator.validatorId]);
      continue;
    }
    if (stableValidationStringify(firstRequest.sourceArtifact) !== sourceBefore) addFinding("VALIDATOR_MUTATES_SOURCE", validator.validatorId, "Validator mutated the source artifact during the probe.", [validator.validatorId, firstRequest.sourceArtifact.artifactId]);
    if (stableValidationStringify(firstRequest.targetArtifact) !== targetBefore) addFinding("VALIDATOR_MUTATES_TARGET", validator.validatorId, "Validator mutated the target artifact during the probe.", [validator.validatorId, firstRequest.targetArtifact.artifactId]);
    const secondRequest = structuredClone(input.probeRequest ?? makeProbeRequest());
    secondRequest.validatorType = validator.validatorType;
    let secondResult;
    try {
      secondResult = runner(secondRequest, validator);
    } catch {
      addFinding("NON_DETERMINISTIC_VALIDATOR", validator.validatorId, "Second validator probe failed.", [validator.validatorId]);
      continue;
    }
    if (firstResult.resultDigest !== secondResult.resultDigest) addFinding("NON_DETERMINISTIC_VALIDATOR", validator.validatorId, "Identical probes produced different result digests.", [validator.validatorId, firstResult.resultDigest, secondResult.resultDigest]);
  }

  const unique = [...new Map(findings.map((finding) => [`${finding.code}:${finding.subjectId}:${finding.evidenceRefs.join("|")}`, finding])).values()]
    .sort((left, right) => `${left.code}:${left.subjectId}`.localeCompare(`${right.code}:${right.subjectId}`));
  const counts = {
    ERROR: unique.filter((item) => item.severity === "ERROR").length,
    WARNING: unique.filter((item) => item.severity === "WARNING").length,
    INFORMATION: unique.filter((item) => item.severity === "INFORMATION").length,
  };
  return {
    auditVersion: "VAL-000-AUDIT-1.0.0",
    registryDigest: validationDigest(validators),
    findings: unique,
    counts,
    passed: counts.ERROR === 0,
    boundary: "DETECTION_ONLY_NO_AUTOMATIC_FIX",
  };
};

