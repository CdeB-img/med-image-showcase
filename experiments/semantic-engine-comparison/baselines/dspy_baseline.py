from __future__ import annotations

import dspy

from contracts.projection import ComparativeCaseInput, ScientificUnderstandingProjection
from baselines.config import MODEL, load_prompt, render_conversation


BASELINE_ID = "SEM003C1-DSPY-01"


class ScientificProjectionSignature(dspy.Signature):
    """Produce the complete source-grounded scientific projection requested by the instruction."""

    instruction: str = dspy.InputField()
    conversation: str = dspy.InputField()
    projection: ScientificUnderstandingProjection = dspy.OutputField()


def run(case: ComparativeCaseInput) -> ScientificUnderstandingProjection:
    lm = dspy.LM(
        f"gemini/{MODEL}",
        temperature=None,
        cache=False,
        num_retries=0,
    )
    predictor = dspy.Predict(ScientificProjectionSignature)
    with dspy.context(lm=lm):
        result = predictor(instruction=load_prompt(), conversation=render_conversation(case))
    return ScientificUnderstandingProjection.model_validate(result.projection)
