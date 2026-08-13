from __future__ import annotations

from google import genai
from google.genai import types
import outlines

from contracts.projection import ComparativeCaseInput, ScientificUnderstandingProjection
from baselines.config import MODEL, api_key, load_prompt, render_conversation


BASELINE_ID = "SEM003C1-OUTLINES-01"


def run(case: ComparativeCaseInput) -> ScientificUnderstandingProjection:
    client = genai.Client(
        api_key=api_key(),
        http_options=types.HttpOptions(retry_options=types.HttpRetryOptions(attempts=1)),
    )
    model = outlines.from_gemini(client, model_name=MODEL)
    generator = outlines.Generator(model, ScientificUnderstandingProjection)
    output = generator(f"{load_prompt()}\n\nCONVERSATION_JSON:\n{render_conversation(case)}")
    return ScientificUnderstandingProjection.model_validate(output)
