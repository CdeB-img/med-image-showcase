from __future__ import annotations

import langextract as lx

from contracts.projection import ComparativeCaseInput
from baselines.config import MODEL, api_key, load_prompt, render_conversation


BASELINE_ID = "SEM003C1-LANGEXTRACT-01"

LANGEXTRACT_OUTPUT_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["extractions"],
    "properties": {
        "extractions": {
            "type": "array",
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["extraction_class", "extraction_text", "attributes"],
                "properties": {
                    "extraction_class": {
                        "type": "string",
                        "enum": ["concept", "relation", "unknown", "ambiguity", "optional_candidate", "clarification", "correction"],
                    },
                    "extraction_text": {"type": "string"},
                    "attributes": {
                        "type": "object",
                        "additionalProperties": False,
                        "properties": {
                            "item_id": {"type": "string"},
                            "semantic_key": {"type": "string"},
                            "normalized_label": {"type": "string"},
                            "concept_type": {"type": "string"},
                            "study_role": {"type": "string"},
                            "polarity": {"type": "string"},
                            "epistemic_status": {"type": "string"},
                            "adoption_status": {"type": "string"},
                            "inference_reason": {"type": "string"},
                            "requires_confirmation": {"type": "string"},
                            "confidence": {"type": "string"},
                            "source_message_id": {"type": "string"},
                            "source_quote": {"type": "string"},
                            "source_item_id": {"type": "string"},
                            "target_item_id": {"type": "string"},
                            "predicate": {"type": "string"},
                            "description": {"type": "string"},
                            "question": {"type": "string"},
                            "reason": {"type": "string"},
                            "resolves_semantic_keys": {"type": "array", "items": {"type": "string"}},
                        },
                    },
                },
            },
        }
    },
}


def run(case: ComparativeCaseInput):
    # One document, one extraction pass and one worker prevent hidden voting,
    # best-of selection and concurrency differences during the common campaign.
    return lx.extract(
        render_conversation(case),
        prompt_description=load_prompt("langextract-scientific-understanding.txt"),
        examples=[],
        model_id=MODEL,
        api_key=api_key(),
        output_schema=LANGEXTRACT_OUTPUT_SCHEMA,
        temperature=None,
        extraction_passes=1,
        batch_length=1,
        max_workers=1,
        max_char_buffer=20_000,
        show_progress=False,
        fetch_urls=False,
        language_model_params={"max_retries": 0},
    )
