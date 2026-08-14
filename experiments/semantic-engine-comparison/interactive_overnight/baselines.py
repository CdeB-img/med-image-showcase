from __future__ import annotations

import json
import os
import re
import subprocess
from pathlib import Path
from typing import Any

import dspy
from google import genai
from google.genai import types
import instructor
import langextract as lx
from langextract.data import ExampleData, Extraction
import outlines
from pydantic_ai import Agent
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.providers.google import GoogleProvider

from .ledger import ProviderLedger
from .models import BASELINE_IDS, GENERIC_SYSTEM_PROMPT, InteractiveCase, InteractiveProjection, render_case


ROOT = Path(__file__).resolve().parents[3]
MODEL = "gemini-3.5-flash-lite"


def api_key() -> str:
    value = os.environ.get("GEMINI_API_KEY", "").strip()
    if not value:
        raise RuntimeError("GEMINI_API_KEY is required")
    return value


def _client():
    return genai.Client(
        api_key=api_key(),
        http_options=types.HttpOptions(timeout=30_000, retry_options=types.HttpRetryOptions(attempts=1)),
    )


def _dump(value: Any) -> Any:
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    if isinstance(value, dict):
        return value
    return repr(value)


def run_instructor(case: InteractiveCase) -> tuple[InteractiveProjection, Any]:
    structured = instructor.from_genai(_client(), mode=instructor.Mode.JSON, model=MODEL)
    output = structured.create(
        response_model=InteractiveProjection,
        messages=[
            {"role": "system", "content": GENERIC_SYSTEM_PROMPT},
            {"role": "user", "content": render_case(case)},
        ],
        max_retries=0,
        strict=True,
    )
    return output, _dump(output)


def run_pydanticai(case: InteractiveCase) -> tuple[InteractiveProjection, Any]:
    model = GoogleModel(MODEL, provider=GoogleProvider(api_key=api_key(), retry_options=types.HttpRetryOptions(attempts=1)))
    agent = Agent(
        model,
        output_type=InteractiveProjection,
        system_prompt=GENERIC_SYSTEM_PROMPT,
        model_settings={"timeout": 30},
        retries=0,
    )
    output = agent.run_sync(render_case(case)).output
    return output, _dump(output)


class InteractiveSignature(dspy.Signature):
    """Return only a JSON object satisfying the instruction."""

    instruction: str = dspy.InputField()
    conversation: str = dspy.InputField()
    projection_json: str = dspy.OutputField(desc="JSON object for the scientific state and dialogue action")


def run_dspy(case: InteractiveCase) -> tuple[InteractiveProjection, Any]:
    lm = dspy.LM(f"gemini/{MODEL}", temperature=None, cache=False, num_retries=0, timeout=30)
    predictor = dspy.Predict(InteractiveSignature)
    schema = json.dumps(InteractiveProjection.model_json_schema(), ensure_ascii=False, sort_keys=True)
    instruction = f"{GENERIC_SYSTEM_PROMPT}\nJSON_SCHEMA:\n{schema}"
    with dspy.context(lm=lm):
        native = predictor(instruction=instruction, conversation=render_case(case))
    raw = native.projection_json
    if isinstance(raw, str):
        text = raw.strip()
        text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.IGNORECASE)
        parsed = json.loads(text)
    else:
        parsed = raw
    return InteractiveProjection.model_validate(parsed), {"projection_json": raw}


LANGEXTRACT_PROMPT = """Extract a source-faithful current scientific state from the complete conversation.
Use extraction classes fact, relation, timing, candidate, unknown_or_ambiguity,
negation_or_constraint, correction, and ownership_note. Preserve negative answers,
corrections, timing, non-causality and uncertainty. Candidates are not user facts.
Do not invent missing content. The dialogue action is selected later by a separate
experimental adapter because LangExtract is an extraction framework."""

LANGEXTRACT_EXAMPLES = [
    ExampleData(
        text="Nous voulons mesurer le signal en imagerie; le temps de mesure n'est pas encore défini.",
        extractions=[
            Extraction(extraction_class="fact", extraction_text="mesurer le signal en imagerie"),
            Extraction(extraction_class="unknown_or_ambiguity", extraction_text="le temps de mesure n'est pas encore défini"),
        ],
    )
]


def run_langextract(case: InteractiveCase) -> tuple[InteractiveProjection, Any]:
    native = lx.extract(
        render_case(case),
        prompt_description=LANGEXTRACT_PROMPT,
        examples=LANGEXTRACT_EXAMPLES,
        model_id=MODEL,
        api_key=api_key(),
        extraction_passes=1,
        batch_length=1,
        max_workers=1,
        max_char_buffer=20_000,
        show_progress=False,
        fetch_urls=False,
        language_model_params={"max_retries": 0, "timeout": 30},
    )
    grouped: dict[str, list[str]] = {}
    native_rows = []
    for item in list(getattr(native, "extractions", None) or []):
        kind = str(getattr(item, "extraction_class", "")).strip().lower()
        text = str(getattr(item, "extraction_text", "")).strip()
        if kind and text:
            grouped.setdefault(kind, []).append(text)
        native_rows.append({"extraction_class": kind, "extraction_text": text, "attributes": getattr(item, "attributes", None) or {}})
    action = "ASK" if grouped.get("unknown_or_ambiguity") else "FINISH"
    question = None
    if action == "ASK":
        unknown = (grouped.get("unknown_or_ambiguity") or ["l'information scientifique principale manquante"])[0]
        question = f"Pouvez-vous préciser {unknown} ?"
    summary_parts = grouped.get("fact", []) + grouped.get("relation", []) + grouped.get("timing", [])
    output = InteractiveProjection(
        state_summary="; ".join(summary_parts) or "Aucune extraction scientifique exploitable.",
        explicit_facts=grouped.get("fact", []),
        relations=grouped.get("relation", []),
        temporal_context=grouped.get("timing", []),
        contextual_candidates=grouped.get("candidate", []),
        missing_or_ambiguous=grouped.get("unknown_or_ambiguity", []),
        negations_or_constraints=grouped.get("negation_or_constraint", []),
        corrected_or_superseded=grouped.get("correction", []),
        ownership_or_epistemic_notes=grouped.get("ownership_note", []),
        action=action,
        next_question=question,
    )
    return output, {"extractions": native_rows}


def run_outlines(case: InteractiveCase) -> tuple[InteractiveProjection, Any]:
    model = outlines.from_gemini(_client(), model_name=MODEL)
    generator = outlines.Generator(model, InteractiveProjection)
    native = generator(f"{GENERIC_SYSTEM_PROMPT}\n\n{render_case(case)}")
    parsed = json.loads(native) if isinstance(native, str) else native
    output = InteractiveProjection.model_validate(parsed)
    return output, _dump(native)


def run_sem(case: InteractiveCase, *, ledger_path: Path, scenario: str, round_id: str, operation_key: str) -> tuple[InteractiveProjection, Any]:
    executable = ROOT / "node_modules" / ".bin" / "vite-node"
    payload = {
        "caseId": case.case_id,
        "language": case.language,
        "conversationTurns": [
            {"messageId": item.message_id, "role": "USER" if item.role == "USER" else "NOXIA", "content": item.content}
            for item in case.conversation_turns
        ],
        "ledgerPath": str(ledger_path),
        "scenario": scenario,
        "roundId": round_id,
        "operationKey": operation_key,
    }
    completed = subprocess.run(
        [str(executable), "experiments/semantic-engine-comparison/interactive_overnight/sem_runner.ts"],
        cwd=ROOT,
        input=json.dumps(payload, ensure_ascii=False),
        text=True,
        capture_output=True,
        check=False,
        env=os.environ.copy(),
    )
    if completed.returncode != 0:
        raise RuntimeError((completed.stderr or completed.stdout or "SEM runner failed")[-3000:])
    lines = [line for line in completed.stdout.splitlines() if line.strip()]
    if not lines:
        raise RuntimeError("SEM runner returned no JSON")
    native = json.loads(lines[-1])
    model = native.get("model") or {}
    snapshot = model.get("executionSnapshot") or {}
    raw = snapshot.get("rawReconstruction") or {}
    clarifications = model.get("clarificationCandidates") or raw.get("clarificationCandidates") or []
    question = None
    if clarifications:
        first = clarifications[0]
        question = first.get("question") if isinstance(first, dict) else str(first)
    elements = model.get("elements") or []
    relations = model.get("relations") or []
    inferred = [str(item.get("canonicalMeaning")) for item in elements if item.get("epistemicStatus") != "EXPLICIT_USER_STATED"]
    explicit = [str(item.get("canonicalMeaning")) for item in elements if item.get("epistemicStatus") == "EXPLICIT_USER_STATED"]
    missing = [str(value) for value in (model.get("unknowns") or [])] + [str(value) for value in (model.get("ambiguities") or [])]
    output = InteractiveProjection(
        state_summary=str(model.get("normalizedMeaning") or raw.get("normalizedMeaning") or "SEM n'a pas produit d'état scientifique exploitable."),
        explicit_facts=explicit,
        relations=[str(item.get("relationType")) for item in relations],
        temporal_context=[str(item.get("canonicalMeaning")) for item in elements if item.get("type") == "TIMING"],
        contextual_candidates=inferred,
        missing_or_ambiguous=missing,
        negations_or_constraints=[str(item.get("canonicalMeaning")) for item in elements if item.get("polarity") in {"NEGATED", "CONDITIONAL"}],
        corrected_or_superseded=[str(item.get("canonicalMeaning")) for item in elements if item.get("supersedesElementIds")],
        ownership_or_epistemic_notes=[f"{item.get('canonicalMeaning')}: {item.get('epistemicStatus')}" for item in elements],
        action="ASK" if question else "FINISH",
        next_question=question,
    )
    return output, native


RUNNERS = {
    "instructor": run_instructor,
    "pydanticai": run_pydanticai,
    "dspy": run_dspy,
    "langextract": run_langextract,
    "outlines": run_outlines,
}


def run_external(slug: str, case: InteractiveCase, *, ledger: ProviderLedger, scenario: str, round_id: str, operation_key: str):
    runner = RUNNERS[slug]
    return ledger.call(
        baseline=BASELINE_IDS[slug], scenario=scenario, round_id=round_id,
        operation="CANDIDATE_SCIENTIFIC_STATE", operation_key=operation_key,
        function=lambda: runner(case),
    )
