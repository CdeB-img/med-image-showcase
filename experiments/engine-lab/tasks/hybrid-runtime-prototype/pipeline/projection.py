from __future__ import annotations

import copy
import re
from typing import Iterable

from contracts.models import (
    CandidateIdentity,
    CandidateScientificState,
    CandidateSource,
    CandidateUnderstanding,
    ContextInput,
    ConversationTurn,
    PrimaryScientificInterpretation,
    RuntimeIdentity,
    ScientificElement,
    ScientificRelation,
)
from pipeline.ledger import utc_now
from pipeline.storage import logical_digest


def _semantic_identity(element: ScientificElement) -> str:
    if element.semanticIdentity:
        return element.semanticIdentity
    material = {
        "sourceTurnIds": element.sourceTurnIds,
        "sourceText": element.sourceText,
        "semanticType": element.semanticType,
        "studyRole": element.studyRole,
    }
    return f"semantic:{logical_digest(material)[:20]}"


def _stable_element(element: ScientificElement) -> ScientificElement:
    value = element.model_copy(deep=True)
    value.semanticIdentity = _semantic_identity(value)
    value.elementId = f"element:{logical_digest({'identity': value.semanticIdentity})[:20]}"
    return value


def _stable_elements(values: Iterable[ScientificElement]) -> list[ScientificElement]:
    return [_stable_element(value) for value in values]


def _stable_relations(values: Iterable[ScientificRelation], id_map: dict[str, str]) -> list[ScientificRelation]:
    result: list[ScientificRelation] = []
    for relation in values:
        value = relation.model_copy(deep=True)
        value.sourceElementId = id_map.get(value.sourceElementId, value.sourceElementId)
        value.targetElementId = id_map.get(value.targetElementId, value.targetElementId)
        value.relationId = f"relation:{logical_digest({
            'source': value.sourceElementId,
            'target': value.targetElementId,
            'type': value.relationType,
            'sourceTurnIds': value.sourceTurnIds,
            'sourceText': value.sourceText,
        })[:20]}"
        result.append(value)
    return result


def canonicalize_interpretation(value: PrimaryScientificInterpretation) -> PrimaryScientificInterpretation:
    """Canonicalize identifiers only; never add or remove scientific content."""

    result = value.model_copy(deep=True)
    collections = [
        "objects",
        "explicitStatements",
        "inferredContext",
        "contextualCandidates",
        "negationsAndConstraints",
        "temporalElements",
    ]
    id_map: dict[str, str] = {}
    for name in collections:
        original = list(getattr(result, name))
        stable = _stable_elements(original)
        id_map.update({before.elementId: after.elementId for before, after in zip(original, stable)})
        setattr(result, name, stable)
    result.relations = _stable_relations(result.relations, id_map)
    return result


def interpretation_from_candidate(candidate: CandidateScientificState) -> PrimaryScientificInterpretation:
    return PrimaryScientificInterpretation.model_validate({
        "normalizedUnderstanding": candidate.understanding.normalizedUnderstanding,
        "scientificGoalCandidates": candidate.understanding.scientificGoalCandidates,
        "studyIntentCandidates": candidate.understanding.studyIntentCandidates,
        "objects": [item.model_dump(mode="json") for item in candidate.objects],
        "relations": [item.model_dump(mode="json") for item in candidate.relations],
        "explicitStatements": [item.model_dump(mode="json") for item in candidate.explicitStatements],
        "inferredContext": [item.model_dump(mode="json") for item in candidate.inferredContext],
        "contextualCandidates": [item.model_dump(mode="json") for item in candidate.contextualCandidates],
        "negationsAndConstraints": [item.model_dump(mode="json") for item in candidate.negationsAndConstraints],
        "temporalElements": [item.model_dump(mode="json") for item in candidate.temporalElements],
        "ambiguities": [item.model_dump(mode="json") for item in candidate.ambiguities],
        "unknowns": [item.model_dump(mode="json") for item in candidate.unknowns],
        "missingInformation": [item.model_dump(mode="json") for item in candidate.missingInformation],
        "correctionsAndSupersessions": [item.model_dump(mode="json") for item in candidate.correctionsAndSupersessions],
        "ownershipAndEpistemicStates": [item.model_dump(mode="json") for item in candidate.ownershipAndEpistemicStates],
        "openDecisions": [item.model_dump(mode="json") for item in candidate.openDecisions],
        "clarificationNeeds": [item.model_dump(mode="json") for item in candidate.clarificationNeeds],
    })


def build_candidate_state(
    *,
    conversationId: str,
    turns: list[ConversationTurn],
    previousState: CandidateScientificState | None,
    interpretation: PrimaryScientificInterpretation,
    rawOutputRef: str,
    rawDigest: str,
    runtimeIdentity: RuntimeIdentity,
    contextInputs: list[ContextInput],
    technicalStatus: str = "STRUCTURED_CONTRACT_VALID",
) -> CandidateScientificState:
    stable = canonicalize_interpretation(interpretation)
    identity_material = {
        "conversationId": conversationId,
        "turns": [turn.model_dump(mode="json") for turn in turns],
        "rawDigest": rawDigest,
        "runtimeIdentity": runtimeIdentity.model_dump(mode="json"),
    }
    return CandidateScientificState(
        identity=CandidateIdentity(
            stateId=f"HCS-{logical_digest(identity_material)[:24]}",
            conversationId=conversationId,
            previousStateId=previousState.identity.stateId if previousState else None,
            generatedAt=utc_now(),
            runtimeIdentity=runtimeIdentity,
        ),
        source=CandidateSource(
            originalRequest=turns[0].content,
            turns=copy.deepcopy(turns),
            rawOutputRef=rawOutputRef,
        ),
        understanding=CandidateUnderstanding(
            normalizedUnderstanding=stable.normalizedUnderstanding,
            scientificGoalCandidates=stable.scientificGoalCandidates,
            studyIntentCandidates=stable.studyIntentCandidates,
        ),
        objects=stable.objects,
        relations=stable.relations,
        explicitStatements=stable.explicitStatements,
        inferredContext=stable.inferredContext,
        contextualCandidates=stable.contextualCandidates,
        negationsAndConstraints=stable.negationsAndConstraints,
        temporalElements=stable.temporalElements,
        ambiguities=stable.ambiguities,
        unknowns=stable.unknowns,
        missingInformation=stable.missingInformation,
        correctionsAndSupersessions=stable.correctionsAndSupersessions,
        ownershipAndEpistemicStates=stable.ownershipAndEpistemicStates,
        openDecisions=stable.openDecisions,
        clarificationNeeds=stable.clarificationNeeds,
        contextInputs=contextInputs,
        technicalStatus=technicalStatus,
        auditStatus="NOT_RUN",
        adjudicationStatus="NOT_REQUIRED",
    )


def scientific_text(candidate: CandidateScientificState) -> str:
    values: list[str] = [
        candidate.understanding.normalizedUnderstanding,
        *candidate.understanding.scientificGoalCandidates,
        *candidate.understanding.studyIntentCandidates,
    ]
    for collection in [
        candidate.objects,
        candidate.explicitStatements,
        candidate.inferredContext,
        candidate.contextualCandidates,
        candidate.negationsAndConstraints,
        candidate.temporalElements,
    ]:
        values.extend(item.content for item in collection)
        values.extend(item.sourceText or "" for item in collection)
    values.extend(relation.sourceText or "" for relation in candidate.relations)
    values.extend(item.content for item in candidate.ambiguities)
    values.extend(item.content for item in candidate.unknowns)
    values.extend(item.content for item in candidate.missingInformation)
    values.extend(item.previousContent + " " + item.currentContent for item in candidate.correctionsAndSupersessions)
    return re.sub(r"\s+", " ", " ".join(values)).strip()
