import { stableValidationStringify, validationDigest, validationUniqueSorted } from "./canonical";
import { ERROR_CODE_INVARIANTS, VALIDATION_INVARIANT_IDS, getValidationInvariant } from "./invariants";
import { getValidationPolicy, getValidator, listValidators } from "./registry";
import type {
  ValidationElement,
  ValidationElementChange,
  ValidationErrorCode,
  ValidationFinding,
  ValidationPolicy,
  ValidationRequest,
  ValidationResult,
  ValidationSeverity,
  ValidationStatus,
  ValidationStatusChange,
  ValidatorDefinition,
} from "./types";

const SEVERITY_BY_CODE: Record<ValidationErrorCode, ValidationSeverity> = {
  OBJECT_LOST: "ERROR", RELATION_LOST: "ERROR", OBJECT_ADDED_WITHOUT_SOURCE: "ERROR", RELATION_ADDED_WITHOUT_SOURCE: "ERROR",
  UNKNOWN_STRENGTHENED: "BLOCKING", UNKNOWN_REMOVED: "ERROR", CONTRADICTION_HIDDEN: "BLOCKING", CONTRADICTION_RESOLVED_WITHOUT_DECISION: "BLOCKING",
  DECISION_LOST: "BLOCKING", DECISION_RECREATED: "ERROR", DECISION_STATUS_CHANGED: "ERROR", PROVENANCE_LOST: "ERROR",
  SOURCE_VERSION_MISMATCH: "BLOCKING", DIGEST_MISMATCH: "BLOCKING", OWNERSHIP_VIOLATION: "BLOCKING", NOT_APPLICABLE_STRENGTHENED: "BLOCKING",
  BLOCKED_BYPASSED: "BLOCKING", FUTURE_SIMULATED: "BLOCKING", REQUIREMENT_REINTERPRETED: "BLOCKING", PATTERN_PROMOTED: "BLOCKING",
  TEMPLATE_STRUCTURE_BYPASSED: "BLOCKING", DOCUMENT_CONTENT_INVENTED: "BLOCKING", SEMANTIC_DRIFT: "ERROR", ROUTE_DRIFT: "ERROR",
  DOWNSTREAM_INFORMATION_LOSS: "ERROR", PROJECTION_DIVERGENCE: "BLOCKING",
};

const ACTION_BY_CODE: Record<ValidationErrorCode, string> = {
  OBJECT_LOST: "Restore the explicit source object mapping or document an authorized exclusion.",
  RELATION_LOST: "Restore the source relation mapping before downstream use.",
  OBJECT_ADDED_WITHOUT_SOURCE: "Attach an explicit source reference or remove the unsupported addition.",
  RELATION_ADDED_WITHOUT_SOURCE: "Attach evidence for the relation or keep it as an unadopted candidate.",
  UNKNOWN_STRENGTHENED: "Return the element to UNKNOWN until a valid source or adopted decision is available.",
  UNKNOWN_REMOVED: "Restore the unknown and its downstream impact.",
  CONTRADICTION_HIDDEN: "Restore all contradictory positions and their open status.",
  CONTRADICTION_RESOLVED_WITHOUT_DECISION: "Reopen the contradiction or link the authorized resolution decision.",
  DECISION_LOST: "Restore the original decision envelope and version.",
  DECISION_RECREATED: "Reference the original decision identity instead of recreating it.",
  DECISION_STATUS_CHANGED: "Preserve the decision version or record a new explicit human decision version.",
  PROVENANCE_LOST: "Restore the missing provenance references and source digests.",
  SOURCE_VERSION_MISMATCH: "Use the declared source version or issue a new validation request.",
  DIGEST_MISMATCH: "Recompute the request from immutable artifacts with matching digests.",
  OWNERSHIP_VIOLATION: "Return responsibility to the declared owner and keep the consumer read-only.",
  NOT_APPLICABLE_STRENGTHENED: "Restore NOT_APPLICABLE until an explicit upstream change is traced.",
  BLOCKED_BYPASSED: "Restore the blocking status and its condition of resumption.",
  FUTURE_SIMULATED: "Restore FUTURE or unavailable status until implementation evidence exists.",
  REQUIREMENT_REINTERPRETED: "Use the REG-001 resolution unchanged or request a new REG-001 resolution.",
  PATTERN_PROMOTED: "Restore the DOC-002 pattern status and reference-only boundary.",
  TEMPLATE_STRUCTURE_BYPASSED: "Project from the identified StudyTemplateInstance.",
  DOCUMENT_CONTENT_INVENTED: "Remove unsupported content or link it to an upstream Project object.",
  SEMANTIC_DRIFT: "Preserve the source meaning or request explicit human review of the change.",
  ROUTE_DRIFT: "Restore the validated route or reopen routing through PD-009 governance.",
  DOWNSTREAM_INFORMATION_LOSS: "Restore the lost information and re-evaluate affected downstream artifacts.",
  PROJECTION_DIVERGENCE: "Regenerate projections from the same immutable logical projection.",
};

const IMPACT_BY_CODE: Record<ValidationErrorCode, string> = {
  OBJECT_LOST: "The downstream representation is incomplete.", RELATION_LOST: "The reasoning chain is no longer reconstructible.",
  OBJECT_ADDED_WITHOUT_SOURCE: "Unsupported content may be presented as sourced.", RELATION_ADDED_WITHOUT_SOURCE: "A reasoning link may have been invented.",
  UNKNOWN_STRENGTHENED: "An absent fact may be presented as known.", UNKNOWN_REMOVED: "A documented uncertainty is no longer visible.",
  CONTRADICTION_HIDDEN: "A decision may rely on only one side of an unresolved conflict.", CONTRADICTION_RESOLVED_WITHOUT_DECISION: "A contradiction appears closed without authority.",
  DECISION_LOST: "Human responsibility and replay are broken.", DECISION_RECREATED: "A downstream component appears to own a human decision.",
  DECISION_STATUS_CHANGED: "The effect of a human decision differs from its source version.", PROVENANCE_LOST: "The result cannot be fully reconstructed.",
  SOURCE_VERSION_MISMATCH: "The compared artifact is not the declared source.", DIGEST_MISMATCH: "Artifact integrity cannot be established.",
  OWNERSHIP_VIOLATION: "A consumer may mutate or reinterpret an upstream responsibility.", NOT_APPLICABLE_STRENGTHENED: "An excluded branch may be treated as applicable.",
  BLOCKED_BYPASSED: "A prohibited downstream action may appear available.", FUTURE_SIMULATED: "A missing capability may appear implemented.",
  REQUIREMENT_REINTERPRETED: "Regulatory applicability may be changed outside REG-001.", PATTERN_PROMOTED: "A documentary observation may become an unjustified rule.",
  TEMPLATE_STRUCTURE_BYPASSED: "Document structure no longer derives from TMP-001.", DOCUMENT_CONTENT_INVENTED: "A projection may contain content absent from the project.",
  SEMANTIC_DRIFT: "The target meaning differs from the source meaning.", ROUTE_DRIFT: "The target journey differs from the validated intent.",
  DOWNSTREAM_INFORMATION_LOSS: "One or more protected information classes were lost.", PROJECTION_DIVERGENCE: "Two representations of the same projection differ scientifically.",
};

const statusRank = (status: string) => {
  const normalized = status.toUpperCase();
  if (["UNKNOWN", "UNAVAILABLE", "NOT_EVALUATED_BY_SPECIALIZED_ENGINE", "EXECUTABLE_PROTOCOL_NOT_READY"].includes(normalized)) return 0;
  if (["CANDIDATE", "PENDING", "PARTIAL", "PARTIALLY_SUPPORTED", "CONDITIONAL", "POTENTIALLY_APPLICABLE"].includes(normalized)) return 1;
  if (["KNOWN", "SUPPORTED", "APPLICABLE", "ADOPTED", "APPROVED", "AVAILABLE", "IMPLEMENTED", "REQUIRED"].includes(normalized)) return 2;
  return 1;
};

const change = (sourceRef: string | null, targetRef: string | null, kind: ValidationElementChange["kind"], reason: string): ValidationElementChange => ({ sourceRef, targetRef, kind, reason });

const findTarget = (source: ValidationElement, targetElements: ValidationElement[]) => targetElements.find((target) => target.ref === source.ref || target.sourceRefs.includes(source.ref));
const hasAdoptedDecisionFor = (request: ValidationRequest, refs: string[]) => request.humanDecisions.some((decision) => decision.status === "ADOPTED" && refs.some((ref) => decision.targets.includes(ref)) && Boolean(decision.actor && decision.mandate));

const baseUnavailableResult = (request: ValidationRequest, validator: ValidatorDefinition | null, status: Extract<ValidationStatus, "NOT_EVALUABLE" | "VALIDATOR_UNAVAILABLE">, limitations: string[]): ValidationResult => {
  const trace = request.expectedInvariantSet.map((invariantId, index) => ({ sequence: index + 1, invariantId, outcome: "NOT_EVALUABLE" as const, sourceRefs: [], targetRefs: [], findingIds: [], evidence: limitations.join(" ") }));
  const logical = {
    validationId: request.validationId, validatorType: request.validatorType, status, findings: [], preservedElements: [], lostElements: [], addedElements: [], strengthenedElements: [], weakenedElements: [], unmappedElements: [], statusChanges: [], provenanceBreaks: [], unknownChanges: [], contradictionChanges: [], decisionChanges: [], sourceDigest: request.sourceDigest, targetDigest: request.targetDigest, validatorVersion: validator?.version ?? "UNAVAILABLE", trace, limitations: validationUniqueSorted(limitations), boundary: "DIAGNOSTIC_ONLY_NO_SOURCE_OR_TARGET_MUTATION" as const,
  };
  return { ...logical, resultDigest: validationDigest(logical) };
};

const resultStatus = (findings: ValidationFinding[], policy?: ValidationPolicy): ValidationStatus => {
  if (findings.some((finding) => ["SOURCE_VERSION_MISMATCH", "DIGEST_MISMATCH"].includes(finding.code))) return "NOT_EVALUABLE";
  const blocking = policy?.blockingSeverities ?? ["BLOCKING"];
  if (findings.some((finding) => blocking.includes(finding.severity))) return "INVALID";
  if (findings.some((finding) => finding.severity === "ERROR")) return "REVIEW_REQUIRED";
  if (findings.some((finding) => finding.severity === "WARNING")) return policy?.warningsAccepted ? "VALID_WITH_WARNINGS" : "REVIEW_REQUIRED";
  return "VALID";
};

const executeStructuralValidation = (request: ValidationRequest, validator: ValidatorDefinition, policy?: ValidationPolicy): ValidationResult => {
  const findings: ValidationFinding[] = [];
  const preservedElements: ValidationElementChange[] = [];
  const lostElements: ValidationElementChange[] = [];
  const addedElements: ValidationElementChange[] = [];
  const strengthenedElements: ValidationElementChange[] = [];
  const weakenedElements: ValidationElementChange[] = [];
  const unmappedElements: ValidationElementChange[] = [];
  const statusChanges: ValidationStatusChange[] = [];
  const provenanceBreaks: ValidationElementChange[] = [];
  const unknownChanges: ValidationElementChange[] = [];
  const contradictionChanges: ValidationElementChange[] = [];
  const decisionChanges: ValidationElementChange[] = [];
  const expected = new Set(request.expectedInvariantSet);

  const addFinding = (code: ValidationErrorCode, sourceRefs: string[], targetRefs: string[], observed: string, owner = request.targetArtifact.owner) => {
    const invariantIds = ERROR_CODE_INVARIANTS[code].filter((invariantId) => expected.has(invariantId));
    if (invariantIds.length === 0) return;
    const payload = { code, sourceRefs: validationUniqueSorted(sourceRefs), targetRefs: validationUniqueSorted(targetRefs), observed, invariantIds };
    findings.push({
      findingId: `VAL-F-${validationDigest(payload).slice(5)}`,
      code,
      severity: SEVERITY_BY_CODE[code],
      sourceRefs: payload.sourceRefs,
      targetRefs: payload.targetRefs,
      message: `${code}: ${observed}`,
      evidence: invariantIds.map((invariantId) => ({ invariantId, assertion: getValidationInvariant(invariantId)?.statement ?? invariantId, observed })),
      impact: IMPACT_BY_CODE[code],
      owner,
      recommendedAction: ACTION_BY_CODE[code],
      automaticCorrectionAllowed: false,
    });
  };

  if (request.sourceVersion !== request.sourceArtifact.version || request.targetVersion !== request.targetArtifact.version) {
    addFinding("SOURCE_VERSION_MISMATCH", [request.sourceArtifact.artifactId], [request.targetArtifact.artifactId], `Declared versions ${request.sourceVersion}/${request.targetVersion} differ from artifact versions ${request.sourceArtifact.version}/${request.targetArtifact.version}.`);
  }
  if (request.sourceDigest !== request.sourceArtifact.digest || request.targetDigest !== request.targetArtifact.digest) {
    addFinding("DIGEST_MISMATCH", [request.sourceArtifact.artifactId], [request.targetArtifact.artifactId], "At least one declared digest differs from the immutable artifact digest.");
  }

  for (const source of request.sourceArtifact.elements) {
    const target = findTarget(source, request.targetArtifact.elements);
    if (!target) {
      lostElements.push(change(source.ref, null, source.kind, "No explicit target mapping."));
      if (source.kind === "UNKNOWN") {
        unknownChanges.push(change(source.ref, null, source.kind, "Unknown removed downstream."));
        addFinding("UNKNOWN_REMOVED", [source.ref], [], "A source unknown has no target representation.");
      } else if (source.kind === "CONTRADICTION") {
        contradictionChanges.push(change(source.ref, null, source.kind, "Contradiction hidden downstream."));
        addFinding("CONTRADICTION_HIDDEN", [source.ref], [], "A source contradiction has no target representation.");
      } else if (source.kind === "DECISION") {
        decisionChanges.push(change(source.ref, null, source.kind, "Decision lost downstream."));
        addFinding("DECISION_LOST", [source.ref], [], "A source decision identity has no target representation.");
      } else {
        addFinding("OBJECT_LOST", [source.ref], [], `Source ${source.kind} ${source.ref} has no target mapping.`);
      }
      if (["UNKNOWN", "CONTRADICTION", "DECISION", "PROVENANCE", "ORIGINAL_REQUEST"].includes(source.kind)) addFinding("DOWNSTREAM_INFORMATION_LOSS", [source.ref], [], `${source.kind} information was lost downstream.`);
      continue;
    }

    preservedElements.push(change(source.ref, target.ref, source.kind, "Explicit identity or source mapping preserved."));
    if (source.semanticKey !== target.semanticKey) {
      const code = source.kind === "ROUTE" ? "ROUTE_DRIFT" : "SEMANTIC_DRIFT";
      addFinding(code, [source.ref], [target.ref], `Semantic key changed from ${source.semanticKey} to ${target.semanticKey}.`);
    }
    if (source.status !== target.status) statusChanges.push({ sourceRef: source.ref, targetRef: target.ref, from: source.status, to: target.status });
    if (statusRank(target.status) > statusRank(source.status)) strengthenedElements.push(change(source.ref, target.ref, source.kind, `${source.status} → ${target.status}`));
    if (statusRank(target.status) < statusRank(source.status)) weakenedElements.push(change(source.ref, target.ref, source.kind, `${source.status} → ${target.status}`));

    const missingProvenance = source.provenanceRefs.filter((ref) => !target.provenanceRefs.includes(ref));
    if (source.provenanceRefs.length > 0 && missingProvenance.length > 0) {
      provenanceBreaks.push(change(source.ref, target.ref, source.kind, `Missing provenance: ${missingProvenance.join(", ")}`));
      addFinding("PROVENANCE_LOST", [source.ref, ...missingProvenance], [target.ref], "One or more source provenance references are absent from the target.");
    }

    const expectedOwner = request.context.expectedOwners?.[source.kind] ?? source.owner;
    if (target.owner !== expectedOwner && source.kind !== "ORIGINAL_REQUEST") addFinding("OWNERSHIP_VIOLATION", [source.ref], [target.ref], `Expected owner ${expectedOwner}; target owner is ${target.owner}.`);

    if (source.kind === "UNKNOWN" && target.status.toUpperCase() !== "UNKNOWN" && !hasAdoptedDecisionFor(request, [source.ref, target.ref])) {
      unknownChanges.push(change(source.ref, target.ref, source.kind, `${source.status} → ${target.status}`));
      addFinding("UNKNOWN_STRENGTHENED", [source.ref], [target.ref], "An UNKNOWN source element was strengthened without an adopted human decision.");
    }
    if (source.kind === "CONTRADICTION" && !target.status.toUpperCase().includes("OPEN") && !target.status.toUpperCase().includes("CONFLICT") && !hasAdoptedDecisionFor(request, [source.ref, target.ref])) {
      contradictionChanges.push(change(source.ref, target.ref, source.kind, `${source.status} → ${target.status}`));
      addFinding("CONTRADICTION_RESOLVED_WITHOUT_DECISION", [source.ref], [target.ref], "A contradiction no longer appears open and has no authorized resolution decision.");
    }
    if (source.kind === "DECISION" && (source.status !== target.status || source.version !== target.version)) {
      decisionChanges.push(change(source.ref, target.ref, source.kind, `Decision ${source.status}@${source.version ?? "?"} → ${target.status}@${target.version ?? "?"}.`));
      addFinding("DECISION_STATUS_CHANGED", [source.ref], [target.ref], "Decision status or version changed across the transformation.");
    }
    if (source.status.toUpperCase() === "NOT_APPLICABLE" && target.status.toUpperCase() !== "NOT_APPLICABLE") addFinding("NOT_APPLICABLE_STRENGTHENED", [source.ref], [target.ref], `NOT_APPLICABLE became ${target.status}.`);
    if (source.status.toUpperCase() === "BLOCKED" && target.status.toUpperCase() !== "BLOCKED") addFinding("BLOCKED_BYPASSED", [source.ref], [target.ref], `BLOCKED became ${target.status}.`);
    if ((source.status.toUpperCase() === "FUTURE" || source.kind === "ENGINE_CAPABILITY" && ["NOT_READY", "UNAVAILABLE", "MISSING"].some((value) => source.status.toUpperCase().includes(value))) && ["AVAILABLE", "IMPLEMENTED", "READY", "APPLICABLE"].some((value) => target.status.toUpperCase().includes(value))) addFinding("FUTURE_SIMULATED", [source.ref], [target.ref], `${source.status} capability became ${target.status}.`);
    if (source.kind === "REQUIREMENT" && (source.semanticKey !== target.semanticKey || source.status !== target.status || target.owner !== "REG-001")) addFinding("REQUIREMENT_REINTERPRETED", [source.ref], [target.ref], "Requirement meaning, applicability status, or owner changed downstream.");
    if (source.kind === "PATTERN" && ["VALIDATED", "OFFICIAL", "APPROVED", "REQUIRED", "APPLICABLE"].includes(target.status.toUpperCase()) && source.status !== target.status) addFinding("PATTERN_PROMOTED", [source.ref], [target.ref], `Pattern status ${source.status} was promoted to ${target.status}.`);
  }

  for (const relation of request.sourceArtifact.relations) {
    const target = request.targetArtifact.relations.find((item) => item.ref === relation.ref || item.sourceRefs.includes(relation.ref));
    if (!target) {
      lostElements.push(change(relation.ref, null, "RELATION", "No explicit target relation mapping."));
      addFinding("RELATION_LOST", [relation.ref], [], "A source relation has no target mapping.");
    } else preservedElements.push(change(relation.ref, target.ref, "RELATION", "Relation mapping preserved."));
  }

  const sourceRefs = new Set(request.sourceArtifact.elements.map((item) => item.ref));
  const sourceRelationRefs = new Set(request.sourceArtifact.relations.map((item) => item.ref));
  const allowed = new Set(request.context.allowedTargetElementRefs ?? []);
  for (const target of request.targetArtifact.elements) {
    const mapped = sourceRefs.has(target.ref) || target.sourceRefs.some((ref) => sourceRefs.has(ref));
    if (mapped || allowed.has(target.ref)) continue;
    unmappedElements.push(change(null, target.ref, target.kind, "No source element mapping found."));
    if (target.kind === "DECISION") {
      decisionChanges.push(change(null, target.ref, target.kind, "Decision identity recreated downstream."));
      addFinding("DECISION_RECREATED", [], [target.ref], "A target decision has no source decision identity.");
    } else if (target.kind === "DOCUMENT_CONTENT" && target.sourceRefs.length === 0) {
      addedElements.push(change(null, target.ref, target.kind, "Document content has no Project or Template source."));
      addFinding("DOCUMENT_CONTENT_INVENTED", [], [target.ref], "Document content has no upstream source reference.");
    } else if (target.sourceRefs.length === 0) {
      addedElements.push(change(null, target.ref, target.kind, "Target element has no source reference."));
      addFinding("OBJECT_ADDED_WITHOUT_SOURCE", [], [target.ref], `Target ${target.kind} has no source reference.`);
    }
  }
  for (const target of request.targetArtifact.relations) {
    const mapped = sourceRelationRefs.has(target.ref) || target.sourceRefs.some((ref) => sourceRelationRefs.has(ref));
    if (!mapped && target.sourceRefs.length === 0) {
      addedElements.push(change(null, target.ref, "RELATION", "Target relation has no source reference."));
      addFinding("RELATION_ADDED_WITHOUT_SOURCE", [], [target.ref], "A target relation has no source relation or evidence reference.");
    }
  }

  if (request.sourceArtifact.artifactType === "STUDY_TEMPLATE_INSTANCE" && !request.targetArtifact.sourceArtifactRefs.includes(request.sourceArtifact.artifactId)) addFinding("TEMPLATE_STRUCTURE_BYPASSED", [request.sourceArtifact.artifactId], [request.targetArtifact.artifactId], "The target projection does not reference the source StudyTemplateInstance.");
  if (request.sourceArtifact.artifactType === "COMPOSITE_SOURCE" && request.targetArtifact.artifactType === "DOCUMENT_PROJECTION") {
    const templateRef = request.sourceArtifact.sourceArtifactRefs.find((ref) => ref.toLowerCase().includes("template") || ref.toLowerCase().includes("tmp"));
    if (templateRef && !request.targetArtifact.sourceArtifactRefs.includes(templateRef)) addFinding("TEMPLATE_STRUCTURE_BYPASSED", [templateRef], [request.targetArtifact.artifactId], "The DocumentProjection does not reference the expected template source.");
  }
  if (request.validatorType === "CROSS_PROJECTION" && (lostElements.length > 0 || strengthenedElements.length > 0 || request.context.rendererOnlyChange && request.targetArtifact.sourceArtifactRefs[0] !== request.sourceArtifact.artifactId)) addFinding("PROJECTION_DIVERGENCE", [request.sourceArtifact.artifactId], [request.targetArtifact.artifactId], "Renderer representations do not preserve the same logical projection.");

  const uniqueFindings = [...new Map(findings.map((finding) => [`${finding.code}:${finding.sourceRefs.join("|")}:${finding.targetRefs.join("|")}`, finding])).values()]
    .sort((left, right) => `${left.code}:${left.findingId}`.localeCompare(`${right.code}:${right.findingId}`));
  const trace = request.expectedInvariantSet.map((invariantId, index) => {
    const invariantFindings = uniqueFindings.filter((finding) => finding.evidence.some((evidence) => evidence.invariantId === invariantId));
    return { sequence: index + 1, invariantId, outcome: invariantFindings.length > 0 ? "FAIL" as const : "PASS" as const, sourceRefs: validationUniqueSorted(invariantFindings.flatMap((finding) => finding.sourceRefs)), targetRefs: validationUniqueSorted(invariantFindings.flatMap((finding) => finding.targetRefs)), findingIds: invariantFindings.map((finding) => finding.findingId), evidence: invariantFindings.length > 0 ? `${invariantFindings.length} structured finding(s).` : "No violation detected by the selected validator contract." };
  });
  const limitations = validationUniqueSorted([...request.limitations, ...validator.limitations]);
  const logical = {
    validationId: request.validationId,
    validatorType: request.validatorType,
    status: resultStatus(uniqueFindings, policy),
    findings: uniqueFindings,
    preservedElements,
    lostElements,
    addedElements,
    strengthenedElements,
    weakenedElements,
    unmappedElements,
    statusChanges,
    provenanceBreaks,
    unknownChanges,
    contradictionChanges,
    decisionChanges,
    sourceDigest: request.sourceDigest,
    targetDigest: request.targetDigest,
    validatorVersion: validator.version,
    trace,
    limitations,
    boundary: "DIAGNOSTIC_ONLY_NO_SOURCE_OR_TARGET_MUTATION" as const,
  };
  return { ...logical, resultDigest: validationDigest(logical) };
};

export const validateTransformation = (request: ValidationRequest, validatorId?: string): ValidationResult => {
  const unknownInvariants = request.expectedInvariantSet.filter((invariantId) => !VALIDATION_INVARIANT_IDS.includes(invariantId));
  const validator = validatorId ? getValidator(validatorId) : listValidators().find((item) => item.validatorType === request.validatorType) ?? null;
  if (!validator) return baseUnavailableResult(request, null, "VALIDATOR_UNAVAILABLE", [`No validator registered for ${validatorId ?? request.validatorType}.`]);
  if (validator.availability !== "AVAILABLE") return baseUnavailableResult(request, validator, "VALIDATOR_UNAVAILABLE", [...validator.limitations, `Validator availability: ${validator.availability}.`]);
  if (unknownInvariants.length > 0) return baseUnavailableResult(request, validator, "NOT_EVALUABLE", [`Unknown invariant IDs: ${unknownInvariants.join(", ")}.`]);
  return executeStructuralValidation(request, validator);
};

export const validateWithPolicy = (request: ValidationRequest, policyId: string): ValidationResult => {
  const policy = getValidationPolicy(policyId);
  if (!policy) return baseUnavailableResult(request, null, "NOT_EVALUABLE", [`Unknown validation policy ${policyId}.`]);
  if (request.validationPolicyVersion !== policy.version) return baseUnavailableResult(request, null, "NOT_EVALUABLE", [`Policy version mismatch: request ${request.validationPolicyVersion}; policy ${policy.version}.`]);
  const validator = policy.requiredValidators
    .map((item) => getValidator(item.validatorId))
    .find((item) => item?.validatorType === request.validatorType) ?? null;
  if (!validator) return baseUnavailableResult(request, null, "VALIDATOR_UNAVAILABLE", [`Policy ${policyId} has no validator for ${request.validatorType}.`]);
  if (validator.availability !== "AVAILABLE") return baseUnavailableResult({ ...request, expectedInvariantSet: [...policy.invariantIds] }, validator, "VALIDATOR_UNAVAILABLE", [...validator.limitations, `Validator availability: ${validator.availability}.`]);
  const policyRequest = { ...request, expectedInvariantSet: [...policy.invariantIds] };
  return executeStructuralValidation(policyRequest, validator, policy);
};

export const explainValidationFinding = (finding: ValidationFinding) => ({
  findingId: finding.findingId,
  code: finding.code,
  invariantIds: finding.evidence.map((item) => item.invariantId),
  inspectedSourceRefs: [...finding.sourceRefs],
  inspectedTargetRefs: [...finding.targetRefs],
  evidence: finding.evidence.map((item) => ({ ...item })),
  impact: finding.impact,
  responsibleOwner: finding.owner,
  nextAction: finding.recommendedAction,
  automaticCorrectionAllowed: false as const,
  explanationDigest: validationDigest({ code: finding.code, evidence: finding.evidence, impact: finding.impact, nextAction: finding.recommendedAction }),
});

export const validationResultLogicalEquality = (left: ValidationResult, right: ValidationResult) => left.resultDigest === right.resultDigest && stableValidationStringify(left) === stableValidationStringify(right);
