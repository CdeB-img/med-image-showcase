from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


Polarity = Literal["AFFIRMED", "NEGATED", "UNCERTAIN", "CONDITIONAL"]
EpistemicStatus = Literal[
    "EXPLICIT_USER_STATED",
    "INFERRED_HIGH_CONFIDENCE",
    "INFERRED_CANDIDATE",
    "SUPPORTED_CANDIDATE",
    "UNSUPPORTED_CANDIDATE",
    "CONFIRMED_BY_USER",
    "REJECTED_BY_USER",
    "UNKNOWN",
    "AMBIGUOUS",
]
AdoptionStatus = Literal["NOT_ADOPTED", "CANDIDATE", "ADOPTED_BY_HUMAN", "REJECTED", "NOT_APPLICABLE"]
ExecutionStatus = Literal["COMPLETED", "SAFE_FAIL_CLOSED", "PROVIDER_FAILURE", "NOT_EVALUABLE"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ConversationTurn(StrictModel):
    messageId: str = Field(min_length=1, max_length=120)
    role: Literal["USER", "NOXIA"]
    content: str = Field(min_length=1, max_length=4_000)


class ComparativeCaseInput(StrictModel):
    schemaVersion: Literal["1.0.0"] = "1.0.0"
    contractType: Literal["COMPARATIVE_SCIENTIFIC_CONVERSATION"] = "COMPARATIVE_SCIENTIFIC_CONVERSATION"
    caseId: str = Field(min_length=1, max_length=128)
    caseVersion: str = Field(pattern=r"^[0-9]+\.[0-9]+\.[0-9]+$")
    language: Literal["fr", "en"]
    conversationTurns: list[ConversationTurn] = Field(min_length=1, max_length=20)


class SourceEvidence(StrictModel):
    messageId: str = Field(min_length=1, max_length=120)
    quote: str = Field(min_length=1, max_length=1_000)


class NativeConcept(StrictModel):
    conceptId: str = Field(pattern=r"^[a-z0-9][a-z0-9-]{0,95}$")
    semanticKey: str = Field(pattern=r"^[a-z0-9][a-z0-9.-]{1,95}$")
    label: str = Field(min_length=1, max_length=500)
    conceptType: str = Field(min_length=1, max_length=100)
    studyRole: str = Field(min_length=1, max_length=100)
    polarity: Polarity
    epistemicStatus: EpistemicStatus
    adoptionStatus: AdoptionStatus = "NOT_ADOPTED"
    sourceEvidence: list[SourceEvidence] = Field(default_factory=list, max_length=20)
    inferenceReason: str | None = Field(default=None, max_length=1_000)
    requiresConfirmation: bool = False
    confidence: float = Field(ge=0, le=1)
    supersedesConceptIds: list[str] = Field(default_factory=list, max_length=20)


class NativeRelation(StrictModel):
    relationId: str = Field(pattern=r"^[a-z0-9][a-z0-9-]{0,95}$")
    semanticKey: str = Field(pattern=r"^[a-z0-9][a-z0-9.-]{1,95}$")
    sourceConceptId: str
    targetConceptId: str
    predicate: str = Field(min_length=1, max_length=160)
    polarity: Polarity
    epistemicStatus: EpistemicStatus
    adoptionStatus: AdoptionStatus = "NOT_ADOPTED"
    sourceEvidence: list[SourceEvidence] = Field(default_factory=list, max_length=20)
    inferenceReason: str | None = Field(default=None, max_length=1_000)
    requiresConfirmation: bool = False
    confidence: float = Field(ge=0, le=1)


class NativeOpenIssue(StrictModel):
    issueId: str = Field(pattern=r"^[a-z0-9][a-z0-9-]{0,95}$")
    semanticKey: str = Field(pattern=r"^[a-z0-9][a-z0-9.-]{1,95}$")
    description: str = Field(min_length=1, max_length=1_000)
    sourceEvidence: list[SourceEvidence] = Field(default_factory=list, max_length=20)


class NativeClarification(StrictModel):
    clarificationId: str = Field(pattern=r"^[a-z0-9][a-z0-9-]{0,95}$")
    question: str = Field(min_length=1, max_length=1_000)
    reason: str = Field(min_length=1, max_length=1_000)
    resolvesSemanticKeys: list[str] = Field(default_factory=list, max_length=30)


class ScientificUnderstandingProjection(StrictModel):
    schemaVersion: Literal["1.0.0"] = "1.0.0"
    contractType: Literal["SCIENTIFIC_UNDERSTANDING_NATIVE_PROJECTION"] = "SCIENTIFIC_UNDERSTANDING_NATIVE_PROJECTION"
    language: Literal["fr", "en"]
    normalizedMeaning: str = Field(min_length=1, max_length=4_000)
    concepts: list[NativeConcept] = Field(default_factory=list, max_length=100)
    relations: list[NativeRelation] = Field(default_factory=list, max_length=150)
    unknowns: list[NativeOpenIssue] = Field(default_factory=list, max_length=50)
    ambiguities: list[NativeOpenIssue] = Field(default_factory=list, max_length=50)
    optionalCandidates: list[NativeConcept] = Field(default_factory=list, max_length=50)
    clarifications: list[NativeClarification] = Field(default_factory=list, max_length=20)
    corrections: list[NativeRelation] = Field(default_factory=list, max_length=50)
    warnings: list[str] = Field(default_factory=list, max_length=50)

    @model_validator(mode="after")
    def references_existing_concepts(self) -> "ScientificUnderstandingProjection":
        concept_ids = {item.conceptId for item in [*self.concepts, *self.optionalCandidates]}
        for relation in [*self.relations, *self.corrections]:
            if relation.sourceConceptId not in concept_ids or relation.targetConceptId not in concept_ids:
                raise ValueError(f"relation {relation.relationId} references an absent concept")
        return self


class NormalizedSemanticElement(StrictModel):
    elementId: str
    semanticKey: str
    label: str
    elementType: str
    studyRole: str
    polarity: Polarity
    epistemicStatus: EpistemicStatus
    adoptionStatus: AdoptionStatus
    sourceEvidence: list[SourceEvidence]
    inferenceReason: str | None
    requiresConfirmation: bool
    confidence: float = Field(ge=0, le=1)
    sourceNativeId: str
    supersedesSourceNativeIds: list[str]
    category: Literal["CONTENT", "OPTIONAL_CANDIDATE"]


class NormalizedSemanticRelation(StrictModel):
    relationId: str
    semanticKey: str
    sourceElementId: str
    targetElementId: str
    predicate: str
    polarity: Polarity
    epistemicStatus: EpistemicStatus
    adoptionStatus: AdoptionStatus
    sourceEvidence: list[SourceEvidence]
    inferenceReason: str | None
    requiresConfirmation: bool
    confidence: float = Field(ge=0, le=1)
    sourceNativeId: str
    category: Literal["RELATION", "CORRECTION"]


class NormalizedCandidateSemanticRepresentation(StrictModel):
    schemaVersion: Literal["1.0.0"] = "1.0.0"
    contractType: Literal["NORMALIZED_CANDIDATE_SEMANTIC_REPRESENTATION"] = "NORMALIZED_CANDIDATE_SEMANTIC_REPRESENTATION"
    baselineId: str
    runId: str
    caseId: str
    caseVersion: str
    language: Literal["fr", "en"]
    executionStatus: ExecutionStatus
    normalizedMeaning: str
    semanticElements: list[NormalizedSemanticElement]
    semanticRelations: list[NormalizedSemanticRelation]
    unknowns: list[NativeOpenIssue]
    ambiguities: list[NativeOpenIssue]
    clarifications: list[NativeClarification]
    warnings: list[str]
    nativeOutputDigest: str = Field(pattern=r"^[a-f0-9]{64}$")
    normalizationPolicy: Literal["LOSSLESS_REFERENCE_BLIND_1.0.0"] = "LOSSLESS_REFERENCE_BLIND_1.0.0"


def schema_documents() -> dict[str, dict]:
    return {
        "comparative-case-input.schema.json": ComparativeCaseInput.model_json_schema(),
        "scientific-understanding-native-projection.schema.json": ScientificUnderstandingProjection.model_json_schema(),
        "normalized-candidate-semantic-representation.schema.json": NormalizedCandidateSemanticRepresentation.model_json_schema(),
    }
