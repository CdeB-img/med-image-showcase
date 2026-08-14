from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


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
Polarity = Literal["AFFIRMED", "NEGATED", "UNCERTAIN", "CONDITIONAL"]
Priority = Literal["HIGH", "MEDIUM", "LOW", "UNKNOWN"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ConversationTurn(StrictModel):
    turnId: str
    role: Literal["USER", "ASSISTANT"]
    content: str


class ScientificItem(StrictModel):
    itemId: str
    content: str
    scientificRole: str
    polarity: Polarity
    temporalContext: str | None = None
    epistemicStatus: EpistemicStatus
    ownership: str
    provenanceTurnIds: list[str] = Field(default_factory=list)
    sourceText: str | None = None
    basis: str | None = None


class ScientificRelation(StrictModel):
    relationId: str
    subject: str
    predicate: str
    object: str
    polarity: Polarity
    temporalContext: str | None = None
    epistemicStatus: EpistemicStatus
    ownership: str
    provenanceTurnIds: list[str] = Field(default_factory=list)
    sourceText: str | None = None
    basis: str | None = None


class ScientificAmbiguity(StrictModel):
    ambiguityId: str
    content: str
    interpretations: list[str] = Field(default_factory=list)
    decisionImpact: str
    epistemicStatus: Literal["AMBIGUOUS"] = "AMBIGUOUS"
    provenanceTurnIds: list[str] = Field(default_factory=list)


class MissingInformation(StrictModel):
    missingId: str
    content: str
    priority: Priority
    blocking: bool
    decisionImpact: str
    owner: str
    provenanceTurnIds: list[str] = Field(default_factory=list)


class CorrectionAndSupersession(StrictModel):
    correctionId: str
    previousContent: str
    currentContent: str
    disposition: Literal["MODIFIED", "REJECTED", "SUPERSEDED", "CONFIRMED"]
    provenanceTurnIds: list[str] = Field(default_factory=list)


class OwnershipEpistemicStatement(StrictModel):
    statementId: str
    content: str
    owner: str
    epistemicStatus: EpistemicStatus
    provenanceTurnIds: list[str] = Field(default_factory=list)


class ClarificationCandidate(StrictModel):
    clarificationId: str
    question: str
    targetIds: list[str] = Field(default_factory=list)
    priority: Priority
    blocking: bool
    decisionImpact: str


class CommonScientificState(StrictModel):
    """Experimental comparison contract; it is not a new NOXIA domain model."""

    originalRequest: str
    conversationTurns: list[ConversationTurn]
    normalizedUnderstanding: str
    scientificGoal: str
    explicitUserStatements: list[ScientificItem] = Field(default_factory=list)
    objects: list[ScientificItem] = Field(default_factory=list)
    relations: list[ScientificRelation] = Field(default_factory=list)
    inferredContext: list[ScientificItem] = Field(default_factory=list)
    contextualScientificCandidates: list[ScientificItem] = Field(default_factory=list)
    negationsAndConstraints: list[ScientificItem] = Field(default_factory=list)
    temporalModel: list[ScientificItem] = Field(default_factory=list)
    ambiguities: list[ScientificAmbiguity] = Field(default_factory=list)
    missingInformation: list[MissingInformation] = Field(default_factory=list)
    unknowns: list[MissingInformation] = Field(default_factory=list)
    correctionsAndSupersessions: list[CorrectionAndSupersession] = Field(default_factory=list)
    ownershipAndEpistemicState: list[OwnershipEpistemicStatement] = Field(default_factory=list)
    clarificationCandidates: list[ClarificationCandidate] = Field(default_factory=list)
    contradictions: list[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def preserve_explicit_provenance(self) -> "CommonScientificState":
        for item in self.explicitUserStatements:
            if item.epistemicStatus != "EXPLICIT_USER_STATED":
                raise ValueError("explicitUserStatements require EXPLICIT_USER_STATED")
            if not item.provenanceTurnIds or not (item.sourceText or "").strip():
                raise ValueError("explicitUserStatements require turn provenance and sourceText")
        return self


class CriticResult(StrictModel):
    verdict: Literal["ACCEPT", "REVISE"]
    rationale: str
    correctedState: CommonScientificState


class SimulatorAnswer(StrictModel):
    configurationId: str
    answer: str


class SimulatorBatch(StrictModel):
    answers: list[SimulatorAnswer]


CONFIGURATION_IDS = [
    "SEM_FULL",
    "SEM_SINGLE_PASS",
    "PYDANTIC_COMMON_CONTRACT",
    "PYDANTIC_CONDITIONAL_CRITIC",
    "DSPY_COMMON_CONTRACT",
]

