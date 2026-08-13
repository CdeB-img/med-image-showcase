from __future__ import annotations

import re
from typing import Any

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
from adapters.common import normalize_projection


BASELINE_ID = "SEM003C1-LANGEXTRACT-01"
POLARITIES = {"AFFIRMED", "NEGATED", "UNCERTAIN", "CONDITIONAL"}
EPISTEMIC = {
    "EXPLICIT_USER_STATED", "INFERRED_HIGH_CONFIDENCE", "INFERRED_CANDIDATE", "SUPPORTED_CANDIDATE",
    "UNSUPPORTED_CANDIDATE", "CONFIRMED_BY_USER", "REJECTED_BY_USER", "UNKNOWN", "AMBIGUOUS",
}


def _text(value: Any, fallback: str = "") -> str:
    return value if isinstance(value, str) and value.strip() else fallback


def _slug(value: str, fallback: str) -> str:
    text = re.sub(r"[^a-z0-9]+", ".", value.casefold()).strip(".")
    return (text[:95] or fallback).rstrip(".")


def _evidence(attrs: dict, extraction_text: str) -> list[SourceEvidence]:
    message_id = _text(attrs.get("source_message_id"))
    quote = _text(attrs.get("source_quote"), extraction_text)
    return [SourceEvidence(messageId=message_id, quote=quote)] if message_id and quote else []


def normalize_langextract_document(
    *,
    run_id: str,
    case: ComparativeCaseInput,
    annotated_document: Any,
) -> NormalizedCandidateSemanticRepresentation:
    extractions = list(getattr(annotated_document, "extractions", None) or [])
    concepts: list[NativeConcept] = []
    optional: list[NativeConcept] = []
    pending_relations: list[tuple[str, NativeRelation]] = []
    corrections: list[NativeRelation] = []
    unknowns: list[NativeOpenIssue] = []
    ambiguities: list[NativeOpenIssue] = []
    clarifications: list[NativeClarification] = []

    for index, extraction in enumerate(extractions, start=1):
        kind = _text(getattr(extraction, "extraction_class", None)).lower()
        extraction_text = _text(getattr(extraction, "extraction_text", None), f"extraction-{index}")
        attrs = getattr(extraction, "attributes", None) or {}
        item_id = _slug(_text(attrs.get("item_id"), f"lx-{index}"), f"lx-{index}")
        semantic_key = _slug(_text(attrs.get("semantic_key"), extraction_text), f"item.{index}")
        if kind in {"concept", "optional_candidate"}:
            epistemic = _text(attrs.get("epistemic_status"), "INFERRED_CANDIDATE" if kind == "optional_candidate" else "UNKNOWN")
            if epistemic not in EPISTEMIC:
                raise ValueError(f"invalid LangExtract epistemic_status for {item_id}")
            polarity = _text(attrs.get("polarity"), "UNCERTAIN")
            if polarity not in POLARITIES:
                raise ValueError(f"invalid LangExtract polarity for {item_id}")
            try:
                confidence = max(0.0, min(1.0, float(_text(attrs.get("confidence"), "0"))))
            except ValueError as exc:
                raise ValueError(f"invalid LangExtract confidence for {item_id}") from exc
            concept = NativeConcept(
                conceptId=item_id,
                semanticKey=semantic_key,
                label=_text(attrs.get("normalized_label"), extraction_text),
                conceptType=_text(attrs.get("concept_type"), "UNSPECIFIED"),
                studyRole=_text(attrs.get("study_role"), "UNSPECIFIED"),
                polarity=polarity,
                epistemicStatus=epistemic,
                adoptionStatus="CANDIDATE" if kind == "optional_candidate" else "NOT_ADOPTED",
                sourceEvidence=_evidence(attrs, extraction_text),
                inferenceReason=_text(attrs.get("inference_reason")) or None,
                requiresConfirmation=_text(attrs.get("requires_confirmation"), "false").lower() == "true",
                confidence=confidence,
            )
            (optional if kind == "optional_candidate" else concepts).append(concept)
        elif kind in {"relation", "correction"}:
            polarity = _text(attrs.get("polarity"), "UNCERTAIN")
            epistemic = _text(attrs.get("epistemic_status"), "UNKNOWN")
            if polarity not in POLARITIES or epistemic not in EPISTEMIC:
                raise ValueError(f"invalid LangExtract relation status for {item_id}")
            relation = NativeRelation(
                relationId=item_id,
                semanticKey=semantic_key,
                sourceConceptId=_slug(_text(attrs.get("source_item_id")), "missing-source"),
                targetConceptId=_slug(_text(attrs.get("target_item_id")), "missing-target"),
                predicate=_text(attrs.get("predicate"), "UNSPECIFIED_RELATION"),
                polarity=polarity,
                epistemicStatus=epistemic,
                adoptionStatus="NOT_ADOPTED",
                sourceEvidence=_evidence(attrs, extraction_text),
                inferenceReason=_text(attrs.get("inference_reason")) or None,
                requiresConfirmation=_text(attrs.get("requires_confirmation"), "false").lower() == "true",
                confidence=max(0.0, min(1.0, float(_text(attrs.get("confidence"), "0")))),
            )
            (corrections if kind == "correction" else pending_relations).append(relation if kind == "correction" else (kind, relation))
        elif kind in {"unknown", "ambiguity"}:
            issue = NativeOpenIssue(
                issueId=item_id,
                semanticKey=semantic_key,
                description=_text(attrs.get("description"), extraction_text),
                sourceEvidence=_evidence(attrs, extraction_text),
            )
            (unknowns if kind == "unknown" else ambiguities).append(issue)
        elif kind == "clarification":
            resolves = attrs.get("resolves_semantic_keys")
            clarifications.append(NativeClarification(
                clarificationId=item_id,
                question=_text(attrs.get("question"), extraction_text),
                reason=_text(attrs.get("reason"), "Clarification identified by LangExtract"),
                resolvesSemanticKeys=[str(value) for value in resolves] if isinstance(resolves, list) else [],
            ))
        else:
            raise ValueError(f"unsupported LangExtract extraction_class: {kind}")

    relations = [value for _, value in pending_relations]
    labels = [item.label for item in [*concepts, *optional]] + [item.predicate for item in [*relations, *corrections]]
    native = ScientificUnderstandingProjection(
        language=case.language,
        normalizedMeaning="; ".join(labels) or "No semantic extraction returned",
        concepts=concepts,
        relations=relations,
        unknowns=unknowns,
        ambiguities=ambiguities,
        optionalCandidates=optional,
        clarifications=clarifications,
        corrections=corrections,
    )
    return normalize_projection(baseline_id=BASELINE_ID, run_id=run_id, case=case, native=native)
