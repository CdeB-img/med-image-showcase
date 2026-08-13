from __future__ import annotations

import json
import os
from pathlib import Path

from contracts.projection import ComparativeCaseInput


ROOT = Path(__file__).resolve().parents[1]
MODEL = "gemini-3.5-flash-lite"
PROVIDER = "GOOGLE_GEMINI"
TEMPERATURE = None
MAX_PROVIDER_ATTEMPTS = 1


def api_key() -> str:
    value = os.environ.get("GEMINI_API_KEY", "").strip()
    if not value:
        raise RuntimeError("GEMINI_API_KEY is required by an execution campaign")
    return value


def load_prompt(name: str = "scientific-understanding.txt") -> str:
    return (ROOT / "prompts" / name).read_text(encoding="utf-8").strip()


def render_conversation(case: ComparativeCaseInput) -> str:
    return json.dumps(
        {
            "caseId": case.caseId,
            "language": case.language,
            "conversationTurns": [item.model_dump() for item in case.conversationTurns],
        },
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    )
