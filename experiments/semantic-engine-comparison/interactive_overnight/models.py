from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, model_validator


class ConversationTurn(BaseModel):
    message_id: str
    role: Literal["USER", "ASSISTANT"]
    content: str


class InteractiveCase(BaseModel):
    case_id: str
    language: Literal["fr", "en"] = "fr"
    conversation_turns: list[ConversationTurn]


class InteractiveProjection(BaseModel):
    """Provider-compatible experimental projection, not a NOXIA product contract."""

    state_summary: str
    explicit_facts: list[str] = Field(default_factory=list)
    relations: list[str] = Field(default_factory=list)
    temporal_context: list[str] = Field(default_factory=list)
    contextual_candidates: list[str] = Field(default_factory=list)
    missing_or_ambiguous: list[str] = Field(default_factory=list)
    negations_or_constraints: list[str] = Field(default_factory=list)
    corrected_or_superseded: list[str] = Field(default_factory=list)
    ownership_or_epistemic_notes: list[str] = Field(default_factory=list)
    action: Literal["ASK", "FINISH", "STOP"]
    next_question: str | None = None

    @model_validator(mode="after")
    def action_question_consistency(self) -> "InteractiveProjection":
        if self.action == "ASK" and not (self.next_question or "").strip():
            raise ValueError("ASK requires one next_question")
        if self.action != "ASK" and self.next_question is not None:
            raise ValueError("FINISH and STOP require next_question=null")
        return self


BASELINE_IDS = {
    "sem-current": "EXP-SEM-INTERACTIVE-SEM-CURRENT",
    "instructor": "EXP-SEM-INTERACTIVE-INSTRUCTOR",
    "pydanticai": "EXP-SEM-INTERACTIVE-PYDANTICAI",
    "dspy": "EXP-SEM-INTERACTIVE-DSPY",
    "langextract": "EXP-SEM-INTERACTIVE-LANGEXTRACT",
    "outlines": "EXP-SEM-INTERACTIVE-OUTLINES",
}


GENERIC_SYSTEM_PROMPT = """You reconstruct the current scientific intent from the complete conversation.
Return a concise source-faithful scientific state. Preserve explicit facts, relations, timing,
negations, corrections, unknowns, ambiguities, and epistemic ownership. Contextual scientific
candidates may be useful, but label them as candidates and never attribute them to the user or
adopt them into a Project. Do not turn association into causality.

Dialogue control is experimental. Choose ASK only when one answer can materially change the
scientific interpretation or next decision. Ask exactly one short, discriminating question; do
not ask for knowledge the system should supply. Choose FINISH when no further high-value user
clarification is needed. Choose STOP only when the user explicitly asks to stop or abandon the
conversation. A negative answer such as "non" is scientific data, never a stop command. A user
correction supersedes the current state but remains visible in history.

Output only the requested structured object."""


def render_case(case: InteractiveCase) -> str:
    lines = [f"CASE={case.case_id}", f"LANGUAGE={case.language}", "CONVERSATION:"]
    for turn in case.conversation_turns:
        lines.append(f"{turn.message_id} | {turn.role}: {turn.content}")
    return "\n".join(lines)
