from __future__ import annotations

from pydantic_ai import Agent
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.providers.google import GoogleProvider
from google.genai import types

from contracts.projection import ComparativeCaseInput, ScientificUnderstandingProjection
from baselines.config import MODEL, api_key, load_prompt, render_conversation


BASELINE_ID = "SEM003C1-PYDANTICAI-01"


def run(case: ComparativeCaseInput) -> ScientificUnderstandingProjection:
    model = GoogleModel(
        MODEL,
        provider=GoogleProvider(api_key=api_key(), retry_options=types.HttpRetryOptions(attempts=1)),
    )
    agent = Agent(
        model,
        output_type=ScientificUnderstandingProjection,
        system_prompt=load_prompt(),
        retries=0,
    )
    return agent.run_sync(render_conversation(case)).output
