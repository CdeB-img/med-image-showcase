from __future__ import annotations

from google import genai
from google.genai import types
import instructor

from contracts.projection import ComparativeCaseInput, ScientificUnderstandingProjection
from baselines.config import MODEL, api_key, load_prompt, render_conversation


BASELINE_ID = "SEM003C1-INSTRUCTOR-PYDANTIC-01"


def run(case: ComparativeCaseInput) -> ScientificUnderstandingProjection:
    client = genai.Client(
        api_key=api_key(),
        http_options=types.HttpOptions(retry_options=types.HttpRetryOptions(attempts=1)),
    )
    structured = instructor.from_genai(client, mode=instructor.Mode.JSON, model=MODEL)
    return structured.create(
        response_model=ScientificUnderstandingProjection,
        messages=[
            {"role": "system", "content": load_prompt()},
            {"role": "user", "content": render_conversation(case)},
        ],
        max_retries=0,
        strict=True,
    )
