from __future__ import annotations

import re

from contracts.projection import (
    ComparativeCaseInput,
    NativeClarification,
    NativeConcept,
    NativeOpenIssue,
    NativeRelation,
    NormalizedCandidateSemanticRepresentation,
    ScientificUnderstandingProjection,
    SourceEvidence,
)
from adapters.common import canonical_digest, normalize_projection


BASELINE_ID = "SEM003C1-SEM-CURRENT-01"


def _slug(value: str, fallback: str) -> str:
    text = re.sub(r"[^a-z0-9]+", ".", value.casefold()).strip(".")
    return (text[:95] or fallback).rstrip(".")


def _evidence(element: dict) -> list[SourceEvidence]:
    span = element.get("sourceSpan")
    if not isinstance(span, dict) or not span.get("messageId") or not span.get("text"):
        return []
    return [SourceEvidence(messageId=str(span["messageId"]), quote=str(span["text"]))]


def _relation_evidence(model: dict, relation: dict) -> list[SourceEvidence]:
    snapshot = model.get("executionSnapshot") or {}
    inventory = ((snapshot.get("rawReconstruction") or {}).get("semanticInventory") or {}).get("explicitRelations") or []
    wanted = set(relation.get("inventoryRelationIds") or [])
    return [
        SourceEvidence(messageId=str(item["sourceMessageId"]), quote=str(item["sourceText"]))
        for item in inventory
        if item.get("inventoryRelationId") in wanted and item.get("sourceMessageId") and item.get("sourceText")
    ]


def normalize_sem_response(
    *,
    run_id: str,
    case: ComparativeCaseInput,
    response: dict,
) -> NormalizedCandidateSemanticRepresentation:
    if response.get("mode") != "LIVE_LLM" or response.get("providerStatus") != "AVAILABLE":
        native_digest = canonical_digest(response)
        return NormalizedCandidateSemanticRepresentation(
            baselineId=BASELINE_ID,
            runId=run_id,
            caseId=case.caseId,
            caseVersion=case.caseVersion,
            language=case.language,
            executionStatus="PROVIDER_FAILURE",
            normalizedMeaning="",
            semanticElements=[],
            semanticRelations=[],
            unknowns=[],
            ambiguities=[],
            clarifications=[],
            warnings=["SEM did not return an evaluable LIVE_LLM model."],
            nativeOutputDigest=native_digest,
        )

    model = response["model"]
    native_ids = {item["semanticElementId"]: item for item in model.get("elements", [])}
    concepts: list[NativeConcept] = []
    optional: list[NativeConcept] = []
    for item in native_ids.values():
        native = NativeConcept(
            conceptId=_slug(str(item["semanticElementId"]), "concept"),
            semanticKey=_slug(str(item.get("canonicalMeaning") or item["semanticElementId"]), "concept"),
            label=str(item.get("canonicalMeaning") or item["semanticElementId"]),
            conceptType=str(item.get("type") or "OTHER"),
            studyRole=str(item.get("studyRole") or "NONE"),
            polarity=item.get("polarity", "UNCERTAIN"),
            epistemicStatus=item.get("epistemicStatus", "UNKNOWN"),
            adoptionStatus="NOT_ADOPTED",
            sourceEvidence=_evidence(item),
            inferenceReason=item.get("inferenceReason"),
            requiresConfirmation=bool(item.get("requiresConfirmation", False)),
            confidence=float(item.get("confidence", 0)),
            supersedesConceptIds=[_slug(str(value), "concept") for value in item.get("supersedesElementIds", [])],
        )
        if native.epistemicStatus in {"INFERRED_CANDIDATE", "SUPPORTED_CANDIDATE", "UNSUPPORTED_CANDIDATE"}:
            optional.append(native)
        else:
            concepts.append(native)

    id_map = {key: _slug(str(key), "concept") for key in native_ids}
    relations = [
        NativeRelation(
            relationId=_slug(str(item["semanticRelationId"]), "relation"),
            semanticKey=_slug(
                f"{native_ids.get(item.get('sourceElementId'), {}).get('canonicalMeaning', item.get('sourceElementId', 'source'))}."
                f"{item.get('relationType', 'related')}."
                f"{native_ids.get(item.get('targetElementId'), {}).get('canonicalMeaning', item.get('targetElementId', 'target'))}",
                "relation",
            ),
            sourceConceptId=id_map[str(item["sourceElementId"])],
            targetConceptId=id_map[str(item["targetElementId"])],
            predicate=str(item.get("relationType") or "RELATED_TO"),
            polarity=item.get("polarity", "UNCERTAIN"),
            epistemicStatus=item.get("epistemicStatus", "UNKNOWN"),
            adoptionStatus="NOT_ADOPTED",
            sourceEvidence=_relation_evidence(model, item),
            inferenceReason=item.get("inferenceReason"),
            requiresConfirmation=bool(item.get("requiresConfirmation", False)),
            confidence=float(item.get("confidence", 0)),
        )
        for item in model.get("relations", [])
        if str(item.get("sourceElementId")) in id_map and str(item.get("targetElementId")) in id_map
    ]
    native_projection = ScientificUnderstandingProjection(
        language=case.language,
        normalizedMeaning=str(model.get("normalizedMeaning") or model.get("originalRequest") or "SEM projection"),
        concepts=concepts,
        relations=relations,
        unknowns=[
            NativeOpenIssue(issueId=f"unknown-{index}", semanticKey=_slug(str(value), f"unknown.{index}"), description=str(value))
            for index, value in enumerate(model.get("unknowns", []), start=1)
        ],
        ambiguities=[
            NativeOpenIssue(issueId=f"ambiguity-{index}", semanticKey=_slug(str(value), f"ambiguity.{index}"), description=str(value))
            for index, value in enumerate(model.get("ambiguities", []), start=1)
        ],
        optionalCandidates=optional,
        clarifications=[
            NativeClarification(
                clarificationId=f"clarification-{index}",
                question=str(value.get("question") or "Clarification required"),
                reason=str(value.get("reason") or "SEM marked a clarification candidate"),
                resolvesSemanticKeys=[_slug(str(item), "concept") for item in value.get("resolvesElementIds", [])],
            )
            for index, value in enumerate(model.get("clarificationCandidates", []), start=1)
        ],
        warnings=[str(value) for value in model.get("contradictions", [])],
    )
    return normalize_projection(baseline_id=BASELINE_ID, run_id=run_id, case=case, native=native_projection)
