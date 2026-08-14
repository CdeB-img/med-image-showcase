"""Scenario-independent deterministic guards for SEM-AUDIT-D."""

from __future__ import annotations

from typing import Any, Iterable


CANDIDATE_STATUSES = {
    "CANDIDATE",
    "INFERRED_CANDIDATE",
    "SUPPORTED_CANDIDATE",
    "INFERRED_HIGH_CONFIDENCE",
}

ADOPTED_STATUSES = {
    "ADOPTED",
    "PROJECT_ADOPTED",
    "PRIMARY_ENDPOINT_ADOPTED",
    "CONFIRMED",
    "CONFIRMED_BY_USER",
}

PRIMARY_ROLES = {"PRIMARY_ENDPOINT", "PRIMARY_OUTCOME", "PRIMARY_CRITERION"}
CAUSAL_RELATIONS = {"CAUSES", "PREDICTS", "DETERMINES", "PREVENTS"}
NON_CAUSAL_RELATIONS = {"ASSOCIATED_WITH", "RELATED_TO_CANDIDATE", "CORRELATES_WITH"}
INACTIVE_STATUSES = {"REJECTED", "REJECTED_BY_USER", "SUPERSEDED"}

METHOD_CLASSES = {"METHOD", "MEASUREMENT_DEFINITION"}
MEASURE_CLASSES = {"MEASURE", "QUANTITATIVE_IMAGE", "MEASUREMENT_VALUE"}
OBSERVABLE_CLASSES = {"OBSERVABLE", "OBSERVABLE_PROPERTY"}
PHENOMENON_CLASSES = {"PHENOMENON", "SCIENTIFIC_PHENOMENON"}
ROLE_CLASSES = {"BIOMARKER_ROLE", "ENDPOINT_ROLE"}


def has_provenance(value: dict[str, Any]) -> bool:
    """True only when a claimed candidate has a source turn and exact source text."""

    return bool(value.get("sourceTurnIds")) and bool(value.get("sourceText"))


def decision_is_confirmed(value: dict[str, Any], confirmed_decisions: set[str]) -> bool:
    decision_id = value.get("decisionId")
    return isinstance(decision_id, str) and decision_id in confirmed_decisions


def is_candidate_promoted(value: dict[str, Any], confirmed_decisions: set[str]) -> bool:
    origin = value.get("originStatus") or value.get("previousEpistemicStatus")
    current = value.get("adoptionStatus") or value.get("epistemicStatus")
    role = value.get("role")
    promoted = origin in CANDIDATE_STATUSES and (current in ADOPTED_STATUSES or role in PRIMARY_ROLES)
    return promoted and not decision_is_confirmed(value, confirmed_decisions)


def is_local_practice_promoted(value: dict[str, Any], confirmed_decisions: set[str]) -> bool:
    local = value.get("originType") == "LOCAL_PRACTICE" or value.get("ownership") == "LOCAL_PRACTICE"
    project = value.get("ownership") == "PROJECT" or value.get("adoptionStatus") in ADOPTED_STATUSES
    return local and project and not decision_is_confirmed(value, confirmed_decisions)


def is_partial_availability_promoted(value: dict[str, Any], confirmed_decisions: set[str]) -> bool:
    partial = value.get("availabilityScope") in {"PARTIAL", "LOCAL", "SUBSET"}
    systematic = value.get("availabilityClaim") in {"SYSTEMATIC", "UNIVERSAL", "ALL_SITES"}
    return partial and systematic and not decision_is_confirmed(value, confirmed_decisions)


def is_active_historical_state(value: dict[str, Any]) -> bool:
    status = value.get("lifecycleStatus") or value.get("epistemicStatus")
    return status in INACTIVE_STATUSES and value.get("active") is True


def is_self_referential(relation: dict[str, Any]) -> bool:
    source = relation.get("sourceId")
    target = relation.get("targetId")
    return bool(source) and source == target


def relation_is_positive_causal(relation: dict[str, Any]) -> bool:
    return relation.get("relationType") in CAUSAL_RELATIONS and relation.get("polarity", "AFFIRMED") == "AFFIRMED"


def matching_constraint(
    relation: dict[str, Any], constraints: Iterable[dict[str, Any]]
) -> dict[str, Any] | None:
    relation_pair = (relation.get("sourceId"), relation.get("targetId"))
    for constraint in constraints:
        if constraint.get("type") not in {"NON_CAUSAL", "EXPLICIT_NEGATION"}:
            continue
        constraint_pair = (constraint.get("subjectId"), constraint.get("targetId"))
        if relation_pair == constraint_pair:
            return constraint
    return None


def conceptual_collapse(previous_class: str | None, current_class: str | None) -> str | None:
    if not previous_class or not current_class or previous_class == current_class:
        return None
    pair = {previous_class, current_class}
    if pair & METHOD_CLASSES and pair & (MEASURE_CLASSES | OBSERVABLE_CLASSES | ROLE_CLASSES):
        return "METHOD_MEASUREMENT_COLLAPSE"
    if pair & PHENOMENON_CLASSES and pair & OBSERVABLE_CLASSES:
        return "PHENOMENON_OBSERVABLE_COLLAPSE"
    return None


def correction_changes_meaning(correction: dict[str, Any]) -> bool:
    before = correction.get("previousSemanticIdentity")
    after = correction.get("currentSemanticIdentity")
    return bool(before) and bool(after) and before != after


def clarification_is_stale(clarification: dict[str, Any]) -> bool:
    return clarification.get("status") == "OPEN" and bool(clarification.get("answerTurnIds"))


def unknown_promoted_without_source(
    previous: dict[str, Any], candidate: dict[str, Any], confirmed_decisions: set[str]
) -> bool:
    was_unknown = previous.get("epistemicStatus") == "UNKNOWN"
    is_confirmed = candidate.get("epistemicStatus") in {"CONFIRMED", "CONFIRMED_BY_USER", "KNOWN"}
    old_turns = set(previous.get("sourceTurnIds", []))
    new_turns = set(candidate.get("sourceTurnIds", [])) - old_turns
    return was_unknown and is_confirmed and not new_turns and not decision_is_confirmed(candidate, confirmed_decisions)
