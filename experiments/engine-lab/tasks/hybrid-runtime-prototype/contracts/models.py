"""Typed, non-normative contracts for the guarded hybrid runtime prototype."""

from __future__ import annotations

from typing import Any, Literal

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
Severity = Literal["INFO", "MINOR", "MAJOR", "CRITICAL"]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class ConversationTurn(StrictModel):
    turnId: str
    role: Literal["USER", "ASSISTANT"]
    content: str


class RuntimeIdentity(StrictModel):
    runtimeId: str
    runtimeVersion: str
    provider: str
    model: str
    promptDigest: str
    schemaDigest: str
    configurationDigest: str


class CandidateIdentity(StrictModel):
    stateId: str
    version: Literal["0.1.0-experimental"] = "0.1.0-experimental"
    conversationId: str
    previousStateId: str | None = None
    generatedAt: str
    runtimeIdentity: RuntimeIdentity


class CandidateSource(StrictModel):
    originalRequest: str
    turns: list[ConversationTurn]
    rawOutputRef: str


class CandidateUnderstanding(StrictModel):
    normalizedUnderstanding: str
    scientificGoalCandidates: list[str] = Field(default_factory=list)
    studyIntentCandidates: list[str] = Field(default_factory=list)


class ScientificElement(StrictModel):
    elementId: str
    content: str
    semanticIdentity: str | None = None
    semanticType: str
    studyRole: str
    sourceTurnIds: list[str] = Field(default_factory=list)
    sourceText: str | None = None
    polarity: Polarity
    temporalContext: str | None = None
    ownership: str
    epistemicStatus: EpistemicStatus
    activeState: bool
    previousElementIds: list[str] = Field(default_factory=list)
    evidenceRefs: list[str] = Field(default_factory=list)
    confidence: float | None = Field(default=None, ge=0, le=1)
    adoptionStatus: str | None = None
    originStatus: str | None = None
    originType: str | None = None
    availabilityScope: str | None = None
    availabilityClaim: str | None = None
    decisionId: str | None = None


class ScientificRelation(StrictModel):
    relationId: str
    sourceElementId: str
    targetElementId: str
    relationType: str
    sourceTurnIds: list[str] = Field(default_factory=list)
    sourceText: str | None = None
    polarity: Polarity
    temporalContext: str | None = None
    ownership: str
    epistemicStatus: EpistemicStatus
    activeState: bool
    previousRelationIds: list[str] = Field(default_factory=list)
    evidenceRefs: list[str] = Field(default_factory=list)
    confidence: float | None = Field(default=None, ge=0, le=1)


class Ambiguity(StrictModel):
    ambiguityId: str
    content: str
    interpretations: list[str] = Field(default_factory=list)
    decisionalImpact: Literal["LOW", "MEDIUM", "HIGH", "UNKNOWN"]
    sourceTurnIds: list[str] = Field(default_factory=list)
    sourceText: str | None = None
    status: Literal["OPEN", "RESOLVED"] = "OPEN"
    decisionId: str | None = None


class MissingInformation(StrictModel):
    missingId: str
    content: str
    decisionalImpact: Literal["LOW", "MEDIUM", "HIGH", "UNKNOWN"]
    blocking: bool
    owner: str
    sourceTurnIds: list[str] = Field(default_factory=list)
    sourceText: str | None = None
    epistemicStatus: Literal["UNKNOWN", "AMBIGUOUS"]


class CorrectionAndSupersession(StrictModel):
    correctionId: str
    previousContent: str
    currentContent: str
    disposition: Literal["MODIFIED", "REJECTED", "SUPERSEDED", "CONFIRMED"]
    previousSemanticIdentity: str | None = None
    currentSemanticIdentity: str | None = None
    sourceTurnIds: list[str] = Field(default_factory=list)
    sourceText: str | None = None


class OwnershipAndEpistemicState(StrictModel):
    statementId: str
    content: str
    ownership: str
    epistemicStatus: EpistemicStatus
    sourceTurnIds: list[str] = Field(default_factory=list)
    sourceText: str | None = None


class OpenDecision(StrictModel):
    decisionId: str
    content: str
    affectedElementIds: list[str] = Field(default_factory=list)
    decisionOwner: str
    status: Literal["OPEN", "CONFIRMED"]
    sourceTurnIds: list[str] = Field(default_factory=list)
    sourceText: str | None = None


class ClarificationNeed(StrictModel):
    clarificationId: str
    targetUnknown: str
    decisionalImpact: Literal["LOW", "MEDIUM", "HIGH", "UNKNOWN"]
    affectedDecisions: list[str] = Field(default_factory=list)
    affectedBranches: list[str] = Field(default_factory=list)
    blocking: bool
    candidateQuestionIntent: str
    resolutionOwner: str


class ContextInput(StrictModel):
    contextId: str
    contextClass: Literal[
        "KNOWLEDGE_EVIDENCE",
        "SOURCE_RESEARCH_DOCUMENT",
        "DOCUMENTARY_PATTERN",
        "REGULATORY_REQUIREMENT",
        "LOCAL_PRACTICE",
        "INSTITUTIONAL_PROCESS",
        "PROJECT_DECISION",
        "HUMAN_EXPERT_INPUT",
    ]
    sourceRef: str
    authorityLevel: str
    applicability: str
    provenance: str
    versionOrDate: str
    generalizationRisk: str
    permittedUse: str


class PrimaryScientificInterpretation(StrictModel):
    """Semantic material returned by the primary interpreter before technical wrapping."""

    normalizedUnderstanding: str
    scientificGoalCandidates: list[str] = Field(default_factory=list)
    studyIntentCandidates: list[str] = Field(default_factory=list)
    objects: list[ScientificElement] = Field(default_factory=list)
    relations: list[ScientificRelation] = Field(default_factory=list)
    explicitStatements: list[ScientificElement] = Field(default_factory=list)
    inferredContext: list[ScientificElement] = Field(default_factory=list)
    contextualCandidates: list[ScientificElement] = Field(default_factory=list)
    negationsAndConstraints: list[ScientificElement] = Field(default_factory=list)
    temporalElements: list[ScientificElement] = Field(default_factory=list)
    ambiguities: list[Ambiguity] = Field(default_factory=list)
    unknowns: list[MissingInformation] = Field(default_factory=list)
    missingInformation: list[MissingInformation] = Field(default_factory=list)
    correctionsAndSupersessions: list[CorrectionAndSupersession] = Field(default_factory=list)
    ownershipAndEpistemicStates: list[OwnershipAndEpistemicState] = Field(default_factory=list)
    openDecisions: list[OpenDecision] = Field(default_factory=list)
    clarificationNeeds: list[ClarificationNeed] = Field(default_factory=list)


class CandidateScientificState(StrictModel):
    identity: CandidateIdentity
    source: CandidateSource
    understanding: CandidateUnderstanding
    objects: list[ScientificElement] = Field(default_factory=list)
    relations: list[ScientificRelation] = Field(default_factory=list)
    explicitStatements: list[ScientificElement] = Field(default_factory=list)
    inferredContext: list[ScientificElement] = Field(default_factory=list)
    contextualCandidates: list[ScientificElement] = Field(default_factory=list)
    negationsAndConstraints: list[ScientificElement] = Field(default_factory=list)
    temporalElements: list[ScientificElement] = Field(default_factory=list)
    ambiguities: list[Ambiguity] = Field(default_factory=list)
    unknowns: list[MissingInformation] = Field(default_factory=list)
    missingInformation: list[MissingInformation] = Field(default_factory=list)
    correctionsAndSupersessions: list[CorrectionAndSupersession] = Field(default_factory=list)
    ownershipAndEpistemicStates: list[OwnershipAndEpistemicState] = Field(default_factory=list)
    openDecisions: list[OpenDecision] = Field(default_factory=list)
    clarificationNeeds: list[ClarificationNeed] = Field(default_factory=list)
    contextInputs: list[ContextInput] = Field(default_factory=list)
    technicalStatus: Literal[
        "STRUCTURED_CONTRACT_VALID",
        "STRUCTURED_CONTRACT_FAILURE",
        "PROVIDER_FAILURE",
        "RAW_PERSISTENCE_FAILURE",
        "NOT_EVALUABLE",
    ]
    auditStatus: Literal["NOT_RUN", "COMPLETE", "INCOMPLETE"]
    adjudicationStatus: Literal["NOT_REQUIRED", "PENDING", "COMPLETE", "FAILED"]


class SourceEvidence(StrictModel):
    turnId: str
    sourceText: str


class AuditFinding(StrictModel):
    findingId: str
    findingClass: str
    sourceEvidence: list[SourceEvidence] = Field(default_factory=list)
    candidatePointer: str
    auditJudgment: Literal["NEW", "CONFIRMED", "REJECTED", "UNRESOLVED"]
    rationale: str
    severity: Severity
    resolutionOwner: str
    confidence: float | None = Field(default=None, ge=0, le=1)
    status: Literal["OPEN", "ACKNOWLEDGED", "REJECTED", "RESOLVED"]
    origin: Literal["SEM_AUDIT_D", "SEM_AUDIT_L"]
    structuralOnly: bool = False
    confirmsFindingIds: list[str] = Field(default_factory=list)


class SemanticAuditLBatch(StrictModel):
    findings: list[AuditFinding] = Field(default_factory=list)


AdjudicationAction = Literal[
    "KEEP_PRIMARY",
    "REMOVE_UNSUPPORTED",
    "RECLASSIFY_EPISTEMIC",
    "CORRECT_POLARITY",
    "CORRECT_RELATION",
    "SPLIT_ELEMENT",
    "MERGE_EQUIVALENT",
    "RESTORE_SUPERSEDED_HISTORY",
    "KEEP_AMBIGUOUS",
    "KEEP_UNKNOWN",
    "ADD_SOURCE_GROUNDED_OMISSION",
    "ADD_CONTEXTUAL_CANDIDATE",
    "REQUEST_QRY",
    "NOT_EVALUABLE",
]


class AdjudicationResolution(StrictModel):
    resolutionId: str
    findingIds: list[str] = Field(default_factory=list)
    action: AdjudicationAction
    sourceTurnIds: list[str] = Field(default_factory=list)
    sourceText: str | None = None
    previousValue: Any = None
    resultingValue: Any = None
    epistemicStatus: EpistemicStatus
    ownership: str
    rationale: str
    remainingUncertainty: str | None = None


class AdjudicationOutput(StrictModel):
    resolutions: list[AdjudicationResolution] = Field(default_factory=list)
    consolidatedInterpretation: PrimaryScientificInterpretation | None = None
    unresolvedFindingIds: list[str] = Field(default_factory=list)
    disposition: Literal[
        "CANDIDATE_ACCEPTABLE",
        "CANDIDATE_ACCEPTABLE_WITH_OPEN_DECISIONS",
        "NEEDS_CLARIFICATION",
        "NEEDS_KNOWLEDGE",
        "NEEDS_SPECIALIST",
        "NOT_EVALUABLE",
        "FAIL_CLOSED",
    ]

    @model_validator(mode="after")
    def forbid_project_adoption(self) -> "AdjudicationOutput":
        material = self.model_dump_json().upper()
        if "PROJECT_ADOPTED" in material:
            raise ValueError("Adjudicator cannot emit PROJECT_ADOPTED")
        return self


class ConsolidatedCandidateState(StrictModel):
    consolidatedStateId: str
    primaryCandidateStateId: str
    rawOutputRef: str
    disposition: Literal[
        "CANDIDATE_ACCEPTABLE",
        "CANDIDATE_ACCEPTABLE_WITH_OPEN_DECISIONS",
        "NEEDS_CLARIFICATION",
        "NEEDS_KNOWLEDGE",
        "NEEDS_SPECIALIST",
        "NOT_EVALUABLE",
        "FAIL_CLOSED",
    ]
    candidateState: CandidateScientificState | None
    deterministicFindingIds: list[str] = Field(default_factory=list)
    semanticAuditFindingIds: list[str] = Field(default_factory=list)
    adjudicationResolutions: list[AdjudicationResolution] = Field(default_factory=list)
    unresolvedFindingIds: list[str] = Field(default_factory=list)
    openDecisions: list[OpenDecision] = Field(default_factory=list)
    clarificationNeeds: list[ClarificationNeed] = Field(default_factory=list)
    pipelineVersion: Literal["0.1.0-experimental"] = "0.1.0-experimental"
    providerCalls: int
    latencyMs: int

    @model_validator(mode="after")
    def forbid_project_adoption(self) -> "ConsolidatedCandidateState":
        material = self.model_dump_json().upper()
        if "PROJECT_ADOPTED" in material:
            raise ValueError("Consolidated candidate cannot emit PROJECT_ADOPTED")
        return self
