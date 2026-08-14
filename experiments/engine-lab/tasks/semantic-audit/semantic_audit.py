"""Non-mutating deterministic semantic integrity audit."""

from __future__ import annotations

import copy
import hashlib
import json
from typing import Any

from guards import (
    NON_CAUSAL_RELATIONS,
    conceptual_collapse,
    correction_changes_meaning,
    clarification_is_stale,
    decision_is_confirmed,
    has_provenance,
    is_active_historical_state,
    is_candidate_promoted,
    is_local_practice_promoted,
    is_partial_availability_promoted,
    is_self_referential,
    matching_constraint,
    relation_is_positive_causal,
    unknown_promoted_without_source,
)


def _finding(
    finding_class: str,
    severity: str,
    value: dict[str, Any] | None,
    pointer: str,
    expected_boundary: str,
    rationale: str,
    owner: str,
    source_override: dict[str, Any] | None = None,
) -> dict[str, Any]:
    source = source_override or value or {}
    candidate_value: Any = copy.deepcopy(value)
    identity = {
        "findingClass": finding_class,
        "candidatePointer": pointer,
        "candidateValue": candidate_value,
        "expectedBoundary": expected_boundary,
    }
    digest = hashlib.sha256(
        json.dumps(identity, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()[:16]
    return {
        "findingId": f"SAF-{digest}",
        "findingClass": finding_class,
        "severity": severity,
        "sourceTurnIds": list(dict.fromkeys(source.get("sourceTurnIds", []))),
        "sourceText": source.get("sourceText"),
        "candidatePointer": pointer,
        "candidateValue": candidate_value,
        "expectedBoundary": expected_boundary,
        "rationale": rationale,
        "proposedResolutionOwner": owner,
        "autoFixAllowed": False,
        "status": "OPEN",
    }


def _by_semantic_identity(items: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    return {
        item["semanticIdentity"]: item
        for item in items
        if isinstance(item.get("semanticIdentity"), str) and item.get("semanticIdentity")
    }


def _relation_key(relation: dict[str, Any]) -> tuple[Any, Any]:
    return relation.get("sourceId"), relation.get("targetId")


def audit_semantic_integrity(payload: dict[str, Any]) -> list[dict[str, Any]]:
    """Return findings only; the input object is never mutated."""

    previous_state = payload.get("previousState") or {}
    candidate_state = payload.get("candidateState") or {}
    previous_items = previous_state.get("items") or []
    candidate_items = candidate_state.get("items") or []
    previous_relations = previous_state.get("relations") or []
    candidate_relations = candidate_state.get("relations") or []
    constraints = payload.get("constraints") or []
    confirmed_decisions = set(payload.get("confirmedDecisionIds") or [])
    findings: list[dict[str, Any]] = []

    raw_record = payload.get("rawProviderOutput") or {}
    if raw_record.get("persisted") is not True:
        findings.append(
            _finding(
                "RAW_OUTPUT_NOT_PERSISTED",
                "ERROR",
                raw_record,
                "/rawProviderOutput",
                "Native provider output is persisted before parsing, validation or rejection.",
                "The evidence chain is incomplete; this is a technical traceability failure, not a scientific-understanding judgment.",
                "EXPERIMENT_OPERATOR",
            )
        )

    for index, item in enumerate(candidate_items):
        pointer = f"/candidateState/items/{index}"
        if not has_provenance(item):
            findings.append(
                _finding(
                    "PROVENANCE_GAP",
                    "ERROR",
                    item,
                    pointer,
                    "Every candidate item claiming scientific content retains source turn IDs and exact source text.",
                    "The candidate cannot be traced back to the conversation.",
                    "SEMANTIC_RECONSTRUCTION",
                )
            )
        if is_candidate_promoted(item, confirmed_decisions):
            findings.append(
                _finding(
                    "CANDIDATE_PROMOTED_TO_ADOPTED",
                    "CRITICAL",
                    item,
                    pointer,
                    "Candidate status and primary/adopted Project status remain distinct until an authorized decision is recorded.",
                    "A candidate was represented as adopted or primary without a confirmed decision.",
                    "RESEARCH_PROJECT",
                )
            )
        if is_local_practice_promoted(item, confirmed_decisions) or is_partial_availability_promoted(
            item, confirmed_decisions
        ):
            findings.append(
                _finding(
                    "LOCAL_PRACTICE_PROMOTED_TO_PROJECT",
                    "CRITICAL",
                    item,
                    pointer,
                    "Local practice or partial availability remains contextual evidence until a Project decision establishes scoped adoption.",
                    "A local or partial fact was generalized into Project/systematic state without a confirmed decision.",
                    "RESEARCH_PROJECT",
                )
            )
        if is_active_historical_state(item):
            findings.append(
                _finding(
                    "HISTORICAL_STATE_REMAINS_ACTIVE",
                    "ERROR",
                    item,
                    pointer,
                    "Rejected or superseded state remains in history and is inactive in the current view.",
                    "An inactive historical state is still marked active.",
                    "RESEARCH_PROJECT",
                )
            )

    for index, relation in enumerate(candidate_relations):
        pointer = f"/candidateState/relations/{index}"
        if is_self_referential(relation):
            findings.append(
                _finding(
                    "SELF_REFERENTIAL_RELATION",
                    "ERROR",
                    relation,
                    pointer,
                    "A scientific relation has distinct source and target unless a specific contract explicitly permits reflexivity.",
                    "The candidate relation points from an object to itself.",
                    "SEMANTIC_RECONSTRUCTION",
                )
            )
        if not has_provenance(relation):
            findings.append(
                _finding(
                    "PROVENANCE_GAP",
                    "ERROR",
                    relation,
                    pointer,
                    "Every candidate relation retains source turn IDs and exact source text.",
                    "The relation cannot be reconstructed from its declared evidence.",
                    "SEMANTIC_RECONSTRUCTION",
                )
            )
        conflict = matching_constraint(relation, constraints)
        if relation_is_positive_causal(relation) and conflict:
            findings.append(
                _finding(
                    "CAUSAL_PROMOTION",
                    "CRITICAL",
                    relation,
                    pointer,
                    "An explicit non-causal or negative constraint cannot become a positive causal relation.",
                    "The candidate strengthens an explicitly constrained relation into positive causality.",
                    "SEMANTIC_RECONSTRUCTION",
                    source_override=conflict,
                )
            )

    previous_by_identity = _by_semantic_identity(previous_items)
    candidate_by_identity = _by_semantic_identity(candidate_items)
    for semantic_identity, previous in previous_by_identity.items():
        candidate = candidate_by_identity.get(semantic_identity)
        previous_pointer = f"semanticIdentity:{semantic_identity}"
        if previous.get("active") is True and previous.get("epistemicStatus") == "EXPLICIT_USER_STATED" and not candidate:
            findings.append(
                _finding(
                    "EXPLICIT_OMISSION",
                    "CRITICAL",
                    previous,
                    previous_pointer,
                    "Explicit active scientific content remains reconstructible unless a sourced correction supersedes it.",
                    "An explicit prior-state obligation is absent from candidate state.",
                    "SEMANTIC_RECONSTRUCTION",
                )
            )
            continue
        if not candidate:
            continue
        collapse_class = conceptual_collapse(previous.get("conceptClass"), candidate.get("conceptClass"))
        if collapse_class:
            findings.append(
                _finding(
                    collapse_class,
                    "ERROR",
                    candidate,
                    previous_pointer,
                    "Method, MeasurementDefinition, measure, observable, phenomenon, BiomarkerRole and EndpointRole remain distinct conceptual planes.",
                    "A stable semantic identity changed conceptual plane without an explicit mapping or new identity.",
                    "SPECIALIZED_CAPABILITY",
                )
            )
        if previous.get("polarity") == "NEGATED" and candidate.get("polarity") != "NEGATED":
            findings.append(
                _finding(
                    "POLARITY_CONFLICT",
                    "CRITICAL",
                    candidate,
                    previous_pointer,
                    "An explicit negation remains active until a sourced correction changes it.",
                    "The candidate lost or inverted an explicit negative polarity.",
                    "SEMANTIC_RECONSTRUCTION",
                )
            )
        if unknown_promoted_without_source(previous, candidate, confirmed_decisions):
            findings.append(
                _finding(
                    "UNSUPPORTED_INVENTION",
                    "CRITICAL",
                    candidate,
                    previous_pointer,
                    "UNKNOWN becomes confirmed only through new source evidence or an authorized confirmed decision.",
                    "The candidate confirms previously unknown information without a new source.",
                    "RESEARCH_PROJECT",
                )
            )

    previous_relation_by_pair = {_relation_key(relation): relation for relation in previous_relations}
    candidate_relation_by_pair = {_relation_key(relation): relation for relation in candidate_relations}
    for pair, previous in previous_relation_by_pair.items():
        candidate = candidate_relation_by_pair.get(pair)
        reversed_candidate = candidate_relation_by_pair.get((pair[1], pair[0]))
        pointer = f"relation:{pair[0]}->{pair[1]}"
        if not candidate and reversed_candidate:
            findings.append(
                _finding(
                    "RELATION_DIRECTION_ERROR",
                    "CRITICAL",
                    reversed_candidate,
                    pointer,
                    "Direction of an established relation is preserved unless a sourced correction changes it.",
                    "The candidate contains the same endpoints in the opposite direction.",
                    "SEMANTIC_RECONSTRUCTION",
                )
            )
            continue
        if not candidate:
            continue
        if previous.get("relationType") != candidate.get("relationType"):
            finding_class = (
                "CAUSAL_PROMOTION"
                if previous.get("relationType") in NON_CAUSAL_RELATIONS and relation_is_positive_causal(candidate)
                else "RELATION_MISMATCH"
            )
            findings.append(
                _finding(
                    finding_class,
                    "CRITICAL" if finding_class == "CAUSAL_PROMOTION" else "ERROR",
                    candidate,
                    pointer,
                    "Relation type and scientific force are preserved unless new evidence or a sourced correction supports change.",
                    "The candidate changed the established relation semantics.",
                    "SEMANTIC_RECONSTRUCTION",
                )
            )

    for index, correction in enumerate(candidate_state.get("corrections") or []):
        if correction.get("disposition") in {"SUPERSEDED", "REJECTED"} and not correction_changes_meaning(correction):
            findings.append(
                _finding(
                    "SUPERSESSION_ERROR",
                    "ERROR",
                    correction,
                    f"/candidateState/corrections/{index}",
                    "A correction or supersession exists only when scientific meaning actually changes.",
                    "The recorded correction has identical before/after semantic identity.",
                    "RESEARCH_PROJECT",
                )
            )

    for index, clarification in enumerate(candidate_state.get("clarifications") or []):
        if clarification_is_stale(clarification):
            findings.append(
                _finding(
                    "HISTORICAL_STATE_REMAINS_ACTIVE",
                    "WARNING",
                    clarification,
                    f"/candidateState/clarifications/{index}",
                    "A clarification with a recorded answer is closed or explicitly justified as reopened.",
                    "The candidate keeps an answered clarification open without justification.",
                    "QRY",
                )
            )

    previous_ambiguities = {
        ambiguity.get("ambiguityId"): ambiguity
        for ambiguity in previous_state.get("ambiguities") or []
        if ambiguity.get("ambiguityId")
    }
    candidate_ambiguities = {
        ambiguity.get("ambiguityId"): ambiguity
        for ambiguity in candidate_state.get("ambiguities") or []
        if ambiguity.get("ambiguityId")
    }
    for ambiguity_id, ambiguity in previous_ambiguities.items():
        if ambiguity.get("status") != "OPEN":
            continue
        candidate = candidate_ambiguities.get(ambiguity_id)
        closed_without_decision = candidate and candidate.get("status") == "RESOLVED" and not decision_is_confirmed(
            candidate, confirmed_decisions
        )
        if candidate is None or closed_without_decision:
            findings.append(
                _finding(
                    "AMBIGUITY_SILENTLY_CLOSED",
                    "CRITICAL",
                    candidate or ambiguity,
                    f"ambiguity:{ambiguity_id}",
                    "An open ambiguity remains visible until evidence or an authorized decision resolves it.",
                    "The candidate removed or resolved an open ambiguity without a confirmed decision.",
                    "QRY",
                )
            )

    return findings
