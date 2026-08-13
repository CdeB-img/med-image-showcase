from __future__ import annotations

import hashlib
import json

from contracts.projection import (
    ComparativeCaseInput,
    NormalizedCandidateSemanticRepresentation,
    NormalizedSemanticElement,
    NormalizedSemanticRelation,
    ScientificUnderstandingProjection,
)


def canonical_digest(value: object) -> str:
    material = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(material).hexdigest()


def normalize_projection(
    *,
    baseline_id: str,
    run_id: str,
    case: ComparativeCaseInput,
    native: ScientificUnderstandingProjection,
) -> NormalizedCandidateSemanticRepresentation:
    dumped = native.model_dump(mode="json")
    all_concepts = [*native.concepts, *native.optionalCandidates]
    elements = [
        NormalizedSemanticElement(
            elementId=f"element-{item.conceptId}",
            semanticKey=item.semanticKey,
            label=item.label,
            elementType=item.conceptType,
            studyRole=item.studyRole,
            polarity=item.polarity,
            epistemicStatus=item.epistemicStatus,
            adoptionStatus=item.adoptionStatus,
            sourceEvidence=item.sourceEvidence,
            inferenceReason=item.inferenceReason,
            requiresConfirmation=item.requiresConfirmation,
            confidence=item.confidence,
            sourceNativeId=item.conceptId,
            supersedesSourceNativeIds=item.supersedesConceptIds,
            category="OPTIONAL_CANDIDATE" if item in native.optionalCandidates else "CONTENT",
        )
        for item in all_concepts
    ]
    relations = [
        NormalizedSemanticRelation(
            relationId=f"relation-{item.relationId}",
            semanticKey=item.semanticKey,
            sourceElementId=f"element-{item.sourceConceptId}",
            targetElementId=f"element-{item.targetConceptId}",
            predicate=item.predicate,
            polarity=item.polarity,
            epistemicStatus=item.epistemicStatus,
            adoptionStatus=item.adoptionStatus,
            sourceEvidence=item.sourceEvidence,
            inferenceReason=item.inferenceReason,
            requiresConfirmation=item.requiresConfirmation,
            confidence=item.confidence,
            sourceNativeId=item.relationId,
            category="CORRECTION" if item in native.corrections else "RELATION",
        )
        for item in [*native.relations, *native.corrections]
    ]
    return NormalizedCandidateSemanticRepresentation(
        baselineId=baseline_id,
        runId=run_id,
        caseId=case.caseId,
        caseVersion=case.caseVersion,
        language=native.language,
        executionStatus="COMPLETED",
        normalizedMeaning=native.normalizedMeaning,
        semanticElements=elements,
        semanticRelations=relations,
        unknowns=native.unknowns,
        ambiguities=native.ambiguities,
        clarifications=native.clarifications,
        warnings=native.warnings,
        nativeOutputDigest=canonical_digest(dumped),
    )
