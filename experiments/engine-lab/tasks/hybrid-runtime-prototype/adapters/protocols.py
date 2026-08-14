from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from contracts.models import (
    AdjudicationOutput,
    AuditFinding,
    CandidateScientificState,
    ContextInput,
    ConversationTurn,
)


@dataclass(frozen=True)
class InterpreterResult:
    candidate: CandidateScientificState
    rawOutputRef: str
    latencyMs: int
    providerCalls: int


class ScientificInterpreterAdapter(Protocol):
    def interpret(
        self,
        *,
        conversationId: str,
        turns: list[ConversationTurn],
        previousCandidateState: CandidateScientificState | None,
        contextInputs: list[ContextInput],
        rawDirectory: Path,
        scenario: str,
        turn: str,
    ) -> InterpreterResult: ...


class SemanticAuditorAdapter(Protocol):
    def audit(
        self,
        *,
        turns: list[ConversationTurn],
        previousState: CandidateScientificState | None,
        candidateState: CandidateScientificState,
        confirmedDecisionIds: list[str],
        deterministicFindings: list[AuditFinding] | None = None,
    ) -> list[AuditFinding]: ...


class SemanticAdjudicatorAdapter(Protocol):
    def adjudicate(
        self,
        *,
        turns: list[ConversationTurn],
        previousState: CandidateScientificState | None,
        primaryCandidate: CandidateScientificState,
        deterministicFindings: list[AuditFinding],
        semanticAuditFindings: list[AuditFinding],
        rawDirectory: Path,
        scenario: str,
        turn: str,
    ) -> tuple[AdjudicationOutput, str, int, int]: ...
