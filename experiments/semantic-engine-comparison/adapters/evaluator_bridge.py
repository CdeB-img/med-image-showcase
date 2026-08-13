from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from contracts.projection import NormalizedCandidateSemanticRepresentation


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class KeyBinding(StrictModel):
    referenceId: str
    acceptedSemanticKeys: list[str] = Field(default_factory=list)


class OwnershipBinding(StrictModel):
    boundaryId: str
    prohibitedAdoptedSemanticKeys: list[str] = Field(default_factory=list)


class EvaluatorBinding(StrictModel):
    candidateId: str
    caseId: str
    caseVersion: str
    envelopeId: str
    envelopeVersion: str
    purpose: Literal[
        "SCIENTIFIC_UNDERSTANDING_EVALUATOR_DEVELOPMENT",
        "SCIENTIFIC_UNDERSTANDING_EVALUATOR_CALIBRATION",
    ]
    requirements: list[KeyBinding]
    prohibitions: list[KeyBinding]
    optionalCandidates: list[KeyBinding]
    ambiguities: list[KeyBinding]
    ownershipBoundaries: list[OwnershipBinding]


def _refs(values: list[str]) -> list[str]:
    return list(dict.fromkeys(item[:240] for item in values if item))


def _state(element: dict) -> str:
    if element["category"] == "OPTIONAL_CANDIDATE":
        return "OPTIONAL"
    if element["epistemicStatus"] == "REJECTED_BY_USER":
        return "REJECTED"
    return "CURRENT"


def bind_to_sem003_evaluator_1_1_0(
    normalized: NormalizedCandidateSemanticRepresentation,
    binding: EvaluatorBinding,
) -> dict:
    """Create the evaluator-owned final candidate using exact declared key joins only.

    The binding belongs to the trusted evaluator side. Baselines never receive it.
    No fuzzy match, synonym expansion or inferred mapping is performed here.
    """

    source_elements: list[dict] = []
    key_refs: dict[str, list[str]] = {}
    adopted_keys: set[str] = set()

    for element in normalized.semanticElements:
        element_id = element.elementId
        source_refs = _refs([f"{value.messageId}:{value.quote}" for value in element.sourceEvidence])
        source_elements.append({
            "elementId": element_id,
            "semanticKey": element.semanticKey,
            "elementType": "OPTIONAL_CANDIDATE" if element.category == "OPTIONAL_CANDIDATE" else "CONTENT",
            "state": _state(element.model_dump()),
            "epistemicStatus": element.epistemicStatus,
            "adoptionStatus": element.adoptionStatus,
            "owner": normalized.baselineId,
            "sourceRefs": source_refs,
            "provenanceRefs": [f"native:{element.sourceNativeId}"],
        })
        key_refs.setdefault(element.semanticKey, []).append(element_id)
        if element.adoptionStatus == "ADOPTED_BY_HUMAN":
            adopted_keys.add(element.semanticKey)

    for relation in normalized.semanticRelations:
        element_id = f"element-{relation.relationId}"
        source_refs = _refs([f"{value.messageId}:{value.quote}" for value in relation.sourceEvidence])
        source_elements.append({
            "elementId": element_id,
            "semanticKey": relation.semanticKey,
            "elementType": "CORRECTION" if relation.category == "CORRECTION" else "RELATION",
            "state": "CURRENT",
            "epistemicStatus": relation.epistemicStatus,
            "adoptionStatus": relation.adoptionStatus,
            "owner": normalized.baselineId,
            "sourceRefs": source_refs,
            "provenanceRefs": [f"native:{relation.sourceNativeId}"],
        })
        key_refs.setdefault(relation.semanticKey, []).append(element_id)
        if relation.adoptionStatus == "ADOPTED_BY_HUMAN":
            adopted_keys.add(relation.semanticKey)

    for kind, issues, state, epistemic in [
        ("UNKNOWN", normalized.unknowns, "OPEN_UNKNOWN", "UNKNOWN"),
        ("AMBIGUITY", normalized.ambiguities, "OPEN_AMBIGUITY", "AMBIGUOUS"),
    ]:
        for issue in issues:
            element_id = f"element-{issue.issueId}"
            source_elements.append({
                "elementId": element_id,
                "semanticKey": issue.semanticKey,
                "elementType": kind,
                "state": state,
                "epistemicStatus": epistemic,
                "adoptionStatus": "NOT_APPLICABLE",
                "owner": normalized.baselineId,
                "sourceRefs": _refs([f"{value.messageId}:{value.quote}" for value in issue.sourceEvidence]),
                "provenanceRefs": [f"normalized:{issue.issueId}"],
            })
            key_refs.setdefault(issue.semanticKey, []).append(element_id)

    def mapped(keys: list[str]) -> list[str]:
        return list(dict.fromkeys(ref for key in keys for ref in key_refs.get(key, [])))

    explicit_elements = [item for item in normalized.semanticElements if item.epistemicStatus in {"EXPLICIT_USER_STATED", "CONFIRMED_BY_USER"}]
    provenance_ok = all(item.sourceEvidence for item in explicit_elements)
    return {
        "schemaVersion": "1.1.0",
        "contractType": "BENCHMARK_EVALUATION_CANDIDATE",
        "purpose": binding.purpose,
        "candidateId": binding.candidateId,
        "caseId": binding.caseId,
        "caseVersion": binding.caseVersion,
        "envelopeId": binding.envelopeId,
        "envelopeVersion": binding.envelopeVersion,
        "evaluationMode": "FUTURE_SEM_RUNTIME",
        "sourceType": "FUTURE_SEM_RUNTIME_OUTPUT",
        "structureProfile": "CONSOLIDATED",
        "executionStatus": normalized.executionStatus,
        "semanticElements": source_elements,
        "obligationMappings": [
            {
                "obligationId": item.referenceId,
                "status": "PRESERVED" if mapped(item.acceptedSemanticKeys) else "OMITTED",
                "evidenceType": "EXPLICIT_NORMALIZED_MAPPING",
                "candidateElementRefs": mapped(item.acceptedSemanticKeys),
            }
            for item in binding.requirements
        ],
        "prohibitionSignals": [
            {
                "prohibitionId": item.referenceId,
                "status": "PRESENT" if mapped(item.acceptedSemanticKeys) else "ABSENT",
                "evidenceRefs": mapped(item.acceptedSemanticKeys),
            }
            for item in binding.prohibitions
        ],
        "optionalCandidateMappings": [
            {
                "candidateId": item.referenceId,
                "status": "PRESENT" if mapped(item.acceptedSemanticKeys) else "ABSENT",
                "epistemicStatus": "INFERRED_CANDIDATE" if mapped(item.acceptedSemanticKeys) else "NOT_APPLICABLE",
                "evidenceRefs": mapped(item.acceptedSemanticKeys),
            }
            for item in binding.optionalCandidates
        ],
        "ambiguityMappings": [
            {
                "ambiguityId": item.referenceId,
                "status": "PRESERVED_OPEN" if mapped(item.acceptedSemanticKeys) else "NOT_EVALUABLE",
                "evidenceRefs": mapped(item.acceptedSemanticKeys),
            }
            for item in binding.ambiguities
        ],
        "clarificationMapping": {
            "status": "PRESENT" if normalized.clarifications else "ABSENT",
            "decisionImpactMapping": "REQUIRES_HUMAN_ADJUDICATION",
            "evidenceRefs": [f"clarification:{item.clarificationId}" for item in normalized.clarifications],
        },
        "ownershipMappings": [
            {
                "boundaryId": item.boundaryId,
                "status": "VIOLATED" if adopted_keys.intersection(item.prohibitedAdoptedSemanticKeys) else "PRESERVED",
                "evidenceRefs": sorted(adopted_keys.intersection(item.prohibitedAdoptedSemanticKeys)),
            }
            for item in binding.ownershipBoundaries
        ],
        "provenanceSummary": {
            "status": "RECONSTRUCTIBLE" if provenance_ok else "BROKEN",
            "sourceRequestReconstructible": provenance_ok,
            "historyReconstructible": provenance_ok,
            "evidenceRefs": _refs([f"{value.messageId}:{value.quote}" for item in explicit_elements for value in item.sourceEvidence]),
        },
        "adjudicationClaims": [],
    }
