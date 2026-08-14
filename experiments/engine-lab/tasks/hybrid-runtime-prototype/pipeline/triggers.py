from __future__ import annotations

from contracts.models import AuditFinding, CandidateScientificState


def semantic_audit_trigger(
    candidate: CandidateScientificState,
    findings: list[AuditFinding],
    *,
    experimentalFinalState: bool,
) -> tuple[bool, list[str]]:
    reasons: list[str] = []
    if any(item.severity == "CRITICAL" for item in findings):
        reasons.append("CRITICAL_DETERMINISTIC_FINDING")
    if any(item.severity == "MAJOR" and not item.structuralOnly for item in findings):
        reasons.append("MAJOR_SEMANTIC_DETERMINISTIC_FINDING")
    if candidate.negationsAndConstraints:
        reasons.append("NEGATION_OR_NON_CAUSALITY")
    if candidate.correctionsAndSupersessions:
        reasons.append("CORRECTION_OR_SUPERSESSION")
    if any(item.ownership not in {"USER", "RESEARCHER", "SEM_CANDIDATE"} for item in [
        *candidate.objects,
        *candidate.explicitStatements,
        *candidate.inferredContext,
        *candidate.contextualCandidates,
    ]):
        reasons.append("NON_TRIVIAL_OWNERSHIP")
    if candidate.contextualCandidates or any(
        item.adoptionStatus or item.originStatus
        for item in [*candidate.objects, *candidate.explicitStatements, *candidate.contextualCandidates]
    ):
        reasons.append("CANDIDATE_VERSUS_ADOPTED")
    if any(item.originType in {"LOCAL_PRACTICE", "INSTITUTIONAL_PROCESS"} for item in [
        *candidate.objects,
        *candidate.explicitStatements,
        *candidate.inferredContext,
        *candidate.contextualCandidates,
    ]) or any(value.contextClass in {"LOCAL_PRACTICE", "INSTITUTIONAL_PROCESS"} for value in candidate.contextInputs):
        reasons.append("LOCAL_OR_INSTITUTIONAL_CONTEXT")
    if any(value.decisionalImpact == "HIGH" for value in candidate.ambiguities):
        reasons.append("HIGH_IMPACT_AMBIGUITY")
    if any(value.blocking for value in candidate.missingInformation):
        reasons.append("BLOCKING_MISSING_INFORMATION")
    if any(
        relation.polarity in {"UNCERTAIN", "CONDITIONAL"}
        or relation.relationType.upper() in {"CAUSES", "PREDICTS", "DETERMINES", "PREVENTS"}
        for relation in candidate.relations
    ):
        reasons.append("CAUSAL_CONDITIONAL_OR_UNCERTAIN_RELATION")
    if any("contrad" in value.content.casefold() for value in candidate.ambiguities):
        reasons.append("EXPLICIT_CONTRADICTION")
    milestone_roles = {
        "PRIMARY_OBJECTIVE",
        "PRIMARY_HYPOTHESIS",
        "POPULATION",
        "INTERVENTION_ARM",
        "COMPARATOR_ARM",
        "PRIMARY_ENDPOINT",
        "PRIMARY_IMAGING_STRATEGY",
        "ADOPTED_MEASUREMENT_DEFINITION",
        "BIOMARKER_ROLE",
        "PRIMARY_TIMING",
        "READY_FOR_PROJECT_SUBMISSION",
    }
    if any(item.studyRole.upper() in milestone_roles for item in [
        *candidate.objects,
        *candidate.explicitStatements,
        *candidate.contextualCandidates,
        *candidate.temporalElements,
    ]):
        reasons.append("CRITICAL_MILESTONE")
    if experimentalFinalState:
        reasons.append("EXPERIMENTAL_FINAL_STATE")
    return bool(reasons), list(dict.fromkeys(reasons))


def adjudication_trigger(
    candidate: CandidateScientificState,
    deterministic: list[AuditFinding],
    semantic: list[AuditFinding],
) -> tuple[bool, list[str]]:
    reasons: list[str] = []
    open_findings = [item for item in [*deterministic, *semantic] if item.status in {"OPEN", "ACKNOWLEDGED"}]
    if any(item.severity in {"CRITICAL", "MAJOR"} for item in open_findings):
        reasons.append("OPEN_CRITICAL_OR_MAJOR_FINDING")
    d_classes = {item.findingClass for item in deterministic if item.status == "OPEN"}
    confirmed = {item.findingClass for item in semantic if item.auditJudgment == "CONFIRMED"}
    rejected = {item.findingClass for item in semantic if item.auditJudgment == "REJECTED"}
    new = {item.findingClass for item in semantic if item.auditJudgment == "NEW"}
    if (d_classes - confirmed - rejected) or rejected or new:
        reasons.append("AUDITOR_DIVERGENCE")
    if any(item.activeState for item in [*candidate.objects, *candidate.explicitStatements] if item.epistemicStatus == "REJECTED_BY_USER"):
        reasons.append("INCOMPATIBLE_ACTIVE_STATE")
    if any(value.decisionalImpact == "HIGH" and value.status == "OPEN" for value in candidate.ambiguities):
        reasons.append("MAJOR_AMBIGUITY_MUST_REMAIN_EXPLICIT")
    if any(item.findingClass in {
        "EXPLICIT_OMISSION",
        "POLARITY_CONFLICT",
        "CAUSAL_PROMOTION",
        "RELATION_DIRECTION_ERROR",
        "LOCAL_PRACTICE_PROMOTED_TO_PROJECT",
        "CANDIDATE_PROMOTED_TO_ADOPTED",
        "HISTORICAL_STATE_REMAINS_ACTIVE",
        "UNSUPPORTED_INVENTION",
    } for item in open_findings):
        reasons.append("SCIENTIFIC_CANDIDATE_CHANGE_REQUIRED")
    return bool(reasons), list(dict.fromkeys(reasons))
