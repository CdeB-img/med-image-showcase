from __future__ import annotations

import copy
import importlib.util
import sys
from pathlib import Path
from typing import Any

from contracts.models import AuditFinding, CandidateScientificState, ConversationTurn, SourceEvidence


TASK_ROOT = Path(__file__).resolve().parents[1]
ENGINE_LAB = TASK_ROOT.parents[1]
SEM_AUDIT_DIR = ENGINE_LAB / "tasks" / "semantic-audit"


def _load_auditor() -> Any:
    sys.path.insert(0, str(SEM_AUDIT_DIR))
    spec = importlib.util.spec_from_file_location("engine_lab_semantic_audit", SEM_AUDIT_DIR / "semantic_audit.py")
    if not spec or not spec.loader:
        raise RuntimeError("SEM_AUDIT_D_LOAD_FAILED")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.audit_semantic_integrity


AUDIT = _load_auditor()


def _items(candidate: CandidateScientificState) -> list[dict[str, Any]]:
    values = [
        *candidate.objects,
        *candidate.explicitStatements,
        *candidate.inferredContext,
        *candidate.contextualCandidates,
        *candidate.negationsAndConstraints,
        *candidate.temporalElements,
    ]
    result: list[dict[str, Any]] = []
    seen: set[tuple[str, str]] = set()
    for item in values:
        key = (item.elementId, item.semanticIdentity or "")
        if key in seen:
            continue
        seen.add(key)
        result.append({
            "itemId": item.elementId,
            "semanticIdentity": item.semanticIdentity,
            "label": item.content,
            "conceptClass": item.semanticType.upper(),
            "role": item.studyRole.upper(),
            "sourceTurnIds": item.sourceTurnIds,
            "sourceText": item.sourceText,
            "polarity": item.polarity,
            "ownership": item.ownership,
            "epistemicStatus": item.epistemicStatus,
            "active": item.activeState,
            "lifecycleStatus": item.epistemicStatus if item.epistemicStatus in {"REJECTED_BY_USER"} else None,
            "originStatus": item.originStatus,
            "adoptionStatus": item.adoptionStatus,
            "originType": item.originType,
            "availabilityScope": item.availabilityScope,
            "availabilityClaim": item.availabilityClaim,
            "decisionId": item.decisionId,
        })
    return result


def _relations(candidate: CandidateScientificState) -> list[dict[str, Any]]:
    return [{
        "relationId": value.relationId,
        "sourceId": value.sourceElementId,
        "targetId": value.targetElementId,
        "relationType": value.relationType.upper(),
        "sourceTurnIds": value.sourceTurnIds,
        "sourceText": value.sourceText,
        "polarity": value.polarity,
        "ownership": value.ownership,
        "epistemicStatus": value.epistemicStatus,
        "active": value.activeState,
    } for value in candidate.relations]


def _ambiguities(candidate: CandidateScientificState) -> list[dict[str, Any]]:
    return [{
        "ambiguityId": value.ambiguityId,
        "content": value.content,
        "status": value.status,
        "decisionId": value.decisionId,
        "sourceTurnIds": value.sourceTurnIds,
        "sourceText": value.sourceText,
    } for value in candidate.ambiguities]


def _state(candidate: CandidateScientificState | None) -> dict[str, Any]:
    if not candidate:
        return {"items": [], "relations": [], "ambiguities": [], "clarifications": [], "corrections": []}
    return {
        "items": _items(candidate),
        "relations": _relations(candidate),
        "ambiguities": _ambiguities(candidate),
        "clarifications": [{
            "clarificationId": item.clarificationId,
            "status": "OPEN",
            "answerTurnIds": [],
        } for item in candidate.clarificationNeeds],
        "corrections": [item.model_dump(mode="json") for item in candidate.correctionsAndSupersessions],
    }


def _constraints(candidate: CandidateScientificState) -> list[dict[str, Any]]:
    constraints: list[dict[str, Any]] = []
    non_causal = any(
        any(token in f"{item.content} {item.sourceText or ''}".casefold() for token in ["caus", "ne cause pas", "pas dire"])
        for item in candidate.negationsAndConstraints
    )
    if non_causal:
        for relation in candidate.relations:
            constraints.append({
                "type": "NON_CAUSAL",
                "subjectId": relation.sourceElementId,
                "targetId": relation.targetElementId,
                "sourceTurnIds": [turn for item in candidate.negationsAndConstraints for turn in item.sourceTurnIds],
                "sourceText": "; ".join(filter(None, [item.sourceText for item in candidate.negationsAndConstraints])),
            })
    return constraints


def _source_evidence(finding: dict[str, Any]) -> list[SourceEvidence]:
    text = finding.get("sourceText")
    turn_ids = finding.get("sourceTurnIds") or []
    if not text:
        return []
    return [SourceEvidence(turnId=str(turn_id), sourceText=str(text)) for turn_id in turn_ids]


SEVERITY = {"INFO": "INFO", "WARNING": "MINOR", "ERROR": "MAJOR", "CRITICAL": "CRITICAL"}
STRUCTURAL_ONLY = {"RAW_OUTPUT_NOT_PERSISTED", "PROVENANCE_GAP", "SELF_REFERENTIAL_RELATION"}


class DeterministicSemanticAuditor:
    runtimeId = "SEM_AUDIT_D"
    runtimeVersion = "0.1.0"

    def audit(
        self,
        *,
        turns: list[ConversationTurn],
        previousState: CandidateScientificState | None,
        candidateState: CandidateScientificState,
        confirmedDecisionIds: list[str],
        deterministicFindings: list[AuditFinding] | None = None,
    ) -> list[AuditFinding]:
        del deterministicFindings
        payload = {
            "conversationTurns": [turn.model_dump(mode="json") for turn in turns],
            "previousState": _state(previousState),
            "candidateState": _state(candidateState),
            "confirmedDecisionIds": confirmedDecisionIds,
            "constraints": _constraints(candidateState),
            "rawProviderOutput": {"persisted": Path(candidateState.source.rawOutputRef).exists()},
        }
        before = copy.deepcopy(payload)
        raw_findings = AUDIT(payload)
        if payload != before:
            raise RuntimeError("SEM_AUDIT_D_MUTATED_INPUT")
        return [AuditFinding(
            findingId=finding["findingId"],
            findingClass=finding["findingClass"],
            sourceEvidence=_source_evidence(finding),
            candidatePointer=finding["candidatePointer"],
            auditJudgment="NEW",
            rationale=finding["rationale"],
            severity="CRITICAL" if finding["findingClass"] == "RAW_OUTPUT_NOT_PERSISTED" else SEVERITY[finding["severity"]],
            resolutionOwner=finding["proposedResolutionOwner"],
            confidence=None,
            status="OPEN",
            origin="SEM_AUDIT_D",
            structuralOnly=finding["findingClass"] in STRUCTURAL_ONLY,
            confirmsFindingIds=[],
        ) for finding in raw_findings]


def audit_payload(candidate: CandidateScientificState) -> dict[str, Any]:
    """Exposed for tests and the semantic second-reader request."""
    return {
        "items": _items(candidate),
        "relations": _relations(candidate),
        "ambiguities": _ambiguities(candidate),
        "corrections": [item.model_dump(mode="json") for item in candidate.correctionsAndSupersessions],
        "unknowns": [item.model_dump(mode="json") for item in candidate.unknowns],
        "missingInformation": [item.model_dump(mode="json") for item in candidate.missingInformation],
        "openDecisions": [item.model_dump(mode="json") for item in candidate.openDecisions],
    }
