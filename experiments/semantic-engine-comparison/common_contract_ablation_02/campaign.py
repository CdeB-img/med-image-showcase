from __future__ import annotations

import argparse
import datetime as dt
import hashlib
import importlib.metadata
import json
import os
import re
import statistics
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Callable

import dspy
from google import genai
from google.genai import types
from pydantic_ai import Agent
from pydantic_ai.models.google import GoogleModel
from pydantic_ai.providers.google import GoogleProvider


PACKAGE_ROOT = Path(__file__).resolve().parent
COMPARISON_ROOT = PACKAGE_ROOT.parent
REPOSITORY_ROOT = COMPARISON_ROOT.parents[1]
RESULT_ROOT = COMPARISON_ROOT / "results" / "common-contract-ablation-02"
SCENARIO_PACK_PATH = RESULT_ROOT / "scenario-pack-frozen.json"
LEDGER_PATH = RESULT_ROOT / "provider-ledger.jsonl"
FREEZE_PATH = RESULT_ROOT / "experiment-freeze-manifest.json"
NATIVE_ROOT = RESULT_ROOT / "native-outputs"
STATE_ROOT = RESULT_ROOT / "common-states"
VIEW_ROOT = RESULT_ROOT / "human-readable"
COMMON_TRANSCRIPT_ROOT = RESULT_ROOT / "common-transcript"
INTERACTIVE_ROOT = RESULT_ROOT / "interactive"
MODEL = "gemini-3.5-flash-lite"
EXPERIMENT_ID = "EXP-SEM-ABLATION-02"

sys.path.insert(0, str(COMPARISON_ROOT))

from common_contract_ablation_02.ledger import (  # noqa: E402
    MAX_NEW_PROVIDER_REQUESTS,
    SOFT_PROVIDER_REQUEST_LIMIT,
    TARGET_PROVIDER_REQUESTS,
    ProviderLedger,
    utc_now,
)
from common_contract_ablation_02.models import (  # noqa: E402
    CONFIGURATION_IDS,
    CommonScientificState,
    ConversationTurn,
    CriticResult,
    SimulatorBatch,
)


COMMON_PROMPT_PATH = PACKAGE_ROOT / "common-state-system.txt"
CRITIC_PROMPT_PATH = PACKAGE_ROOT / "conditional-critic-system.txt"
SIMULATOR_PROMPT_PATH = PACKAGE_ROOT / "researcher-simulator-system.txt"
CONTROLLER_PATH = PACKAGE_ROOT / "dialogue-controller.json"
COMMON_SCHEMA_PATH = PACKAGE_ROOT / "common-scientific-state.schema.json"
CRITIC_SCHEMA_PATH = PACKAGE_ROOT / "conditional-critic-result.schema.json"
SIMULATOR_SCHEMA_PATH = PACKAGE_ROOT / "researcher-simulator.schema.json"
BUDGET_PLAN_PATH = RESULT_ROOT / "provider-budget-plan.json"


def stable_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + "\n"


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(stable_json(value), encoding="utf-8")
    temporary.replace(path)


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def logical_digest(value: Any) -> str:
    material = json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(material).hexdigest()


def load_local_environment() -> None:
    path = REPOSITORY_ROOT / ".env.local"
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        if key.strip() and key.strip() not in os.environ:
            os.environ[key.strip()] = value.strip().strip("\"").strip("'")


def api_key() -> str:
    load_local_environment()
    value = os.environ.get("GEMINI_API_KEY", "").strip()
    if not value:
        raise RuntimeError("GEMINI_API_KEY_REQUIRED")
    return value


def git_head() -> str:
    return subprocess.run(
        ["git", "rev-parse", "HEAD"],
        cwd=REPOSITORY_ROOT,
        text=True,
        capture_output=True,
        check=True,
    ).stdout.strip()


def scenarios() -> list[dict[str, Any]]:
    payload = read_json(SCENARIO_PACK_PATH)
    values = payload.get("scenarios") or []
    if [item.get("scenarioId") for item in values] != [f"I{index:02d}" for index in range(1, 9)]:
        raise RuntimeError("SCENARIO_PACK_IDENTITY_INVALID")
    return values


def conversation_for_common(scenario: dict[str, Any], round_index: int) -> list[ConversationTurn]:
    turns = [ConversationTurn(turnId=f"{scenario['scenarioId']}:T0", role="USER", content=scenario["t0"])]
    if round_index >= 1:
        turns.append(ConversationTurn(turnId=f"{scenario['scenarioId']}:R1", role="USER", content=scenario["r1"]))
    if round_index >= 2:
        turns.append(ConversationTurn(turnId=f"{scenario['scenarioId']}:R2", role="USER", content=scenario["r2"]))
    return turns


def render_conversation(turns: list[ConversationTurn]) -> str:
    return "\n".join(f"{turn.turnId} | {turn.role}: {turn.content}" for turn in turns)


def checkpoint_stem(phase: str, scenario_id: str, round_id: str, configuration_id: str) -> str:
    return f"{phase}-{scenario_id}-{round_id}-{configuration_id}".lower().replace("_", "-")


def state_checkpoint(phase: str, scenario_id: str, round_id: str, configuration_id: str) -> Path:
    return STATE_ROOT / f"{checkpoint_stem(phase, scenario_id, round_id, configuration_id)}.json"


def native_checkpoint(phase: str, scenario_id: str, round_id: str, configuration_id: str) -> Path:
    return NATIVE_ROOT / f"{checkpoint_stem(phase, scenario_id, round_id, configuration_id)}.json"


def load_state(phase: str, scenario_id: str, round_id: str, configuration_id: str) -> CommonScientificState | None:
    path = state_checkpoint(phase, scenario_id, round_id, configuration_id)
    if not path.exists():
        return None
    return CommonScientificState.model_validate(read_json(path)["state"])


def save_state(
    *,
    phase: str,
    scenario_id: str,
    round_id: str,
    configuration_id: str,
    state: CommonScientificState,
    native: Any,
    metadata: dict[str, Any],
) -> None:
    write_json(native_checkpoint(phase, scenario_id, round_id, configuration_id), native)
    write_json(state_checkpoint(phase, scenario_id, round_id, configuration_id), {
        "experimentId": EXPERIMENT_ID,
        "phase": phase,
        "scenarioId": scenario_id,
        "round": round_id,
        "configurationId": configuration_id,
        "normalization": "SOURCE_PRESERVING_EXPERIMENTAL_COMMON_CONTRACT_NO_SCIENTIFIC_ENRICHMENT",
        "metadata": metadata,
        "state": state.model_dump(mode="json"),
    })


def write_schemas() -> None:
    write_json(COMMON_SCHEMA_PATH, CommonScientificState.model_json_schema())
    write_json(CRITIC_SCHEMA_PATH, CriticResult.model_json_schema())
    write_json(SIMULATOR_SCHEMA_PATH, SimulatorBatch.model_json_schema())


def provider_budget_plan() -> dict[str, Any]:
    shared_sem_first_passes = 12
    shared_pydantic_first_passes = 28
    plan = {
        "calculationBasis": "REAL_FROZEN_HARNESS_NOMINAL_MAXIMUM_WITH_ALL_CONDITIONAL_CRITICS_TRIGGERED_AND_MAXIMUM_DIALOGUE_DEPTH",
        "phaseA": {
            "states": 8 * 3 * 5,
            "SEM_FULL_AND_SINGLE_PASS": 88,
            "PYDANTIC_COMMON_AND_CONDITIONAL": 48,
            "DSPY_COMMON_CONTRACT": 24,
            "researcherSimulator": 0,
            "total": 160,
        },
        "phaseB": {
            "statesMaximum": 4 * 3 * 5,
            "SEM_FULL_AND_SINGLE_PASS": 44,
            "PYDANTIC_COMMON_AND_CONDITIONAL": 32,
            "DSPY_COMMON_CONTRACT": 12,
            "researcherSimulatorBatched": 8,
            "total": 96,
        },
        "configurationAttribution": {
            "SEM_FULL": {"exclusiveRequests": 96, "allocatedHalfOfSharedFirstPassPool": 6, "attributedRequests": 102},
            "SEM_SINGLE_PASS": {"exclusiveRequests": 24, "allocatedHalfOfSharedFirstPassPool": 6, "attributedRequests": 30},
            "PYDANTIC_COMMON_CONTRACT": {"exclusiveRequests": 8, "allocatedHalfOfSharedFirstPassPool": 14, "attributedRequests": 22},
            "PYDANTIC_CONDITIONAL_CRITIC": {"exclusiveRequests": 44, "allocatedHalfOfSharedFirstPassPool": 14, "attributedRequests": 58},
            "DSPY_COMMON_CONTRACT": {"exclusiveRequests": 36, "allocatedHalfOfSharedFirstPassPool": 0, "attributedRequests": 36},
            "SIMULATED_RESEARCH_USER": {"exclusiveRequests": 8, "allocatedHalfOfSharedFirstPassPool": 0, "attributedRequests": 8},
        },
        "sharedPools": {
            "SEM_SHARED_FIRST_RECONSTRUCTION": shared_sem_first_passes,
            "PYDANTIC_SHARED_FIRST_OUTPUT": shared_pydantic_first_passes,
        },
        "nominalMaximum": 256,
        "target": TARGET_PROVIDER_REQUESTS,
        "softLimit": SOFT_PROVIDER_REQUEST_LIMIT,
        "hardStop": MAX_NEW_PROVIDER_REQUESTS,
        "transientOrStructuredRepairMarginToSoftLimit": SOFT_PROVIDER_REQUEST_LIMIT - 256,
        "absoluteMarginToHardStop": MAX_NEW_PROVIDER_REQUESTS - 256,
        "dailyQuotaBefore": 0,
        "dailyQuotaLimit": 500,
        "minimumDailyQuotaPreserved": 500 - MAX_NEW_PROVIDER_REQUESTS,
        "assumptions": [
            "SEM full uses at most two critic cycles per scientific state.",
            "SEM branches share T0 first reconstruction; later sharing is reused whenever previous semantic contexts remain identical.",
            "Pydantic branches share every common-transcript first output and interactive T0; later sharing is reused whenever conversations remain identical.",
            "Every conditional Pydantic critic is conservatively counted as triggered.",
            "Every interactive branch is conservatively counted through T2.",
            "Researcher simulator is batched once per scenario and answer round.",
            "Human views, diffs, adjudication and reports consume zero provider requests.",
            "Transient retries and structured-output repair generations consume the 24-call soft margin, then the 64-call absolute margin; the ledger hard-stops at 320.",
        ],
    }
    attributed = sum(row["attributedRequests"] for row in plan["configurationAttribution"].values())
    if attributed != plan["nominalMaximum"]:
        raise RuntimeError(f"PROVIDER_BUDGET_ATTRIBUTION_INVALID:{attributed}")
    return plan


def freeze() -> dict[str, Any]:
    write_schemas()
    write_json(BUDGET_PLAN_PATH, provider_budget_plan())
    ledger = ProviderLedger(LEDGER_PATH)
    if ledger.reservations():
        raise RuntimeError("FREEZE_REQUIRES_ZERO_PROVIDER_REQUESTS")
    files = [
        SCENARIO_PACK_PATH,
        PACKAGE_ROOT / "models.py",
        PACKAGE_ROOT / "ledger.py",
        PACKAGE_ROOT / "campaign.py",
        PACKAGE_ROOT / "reporting.py",
        PACKAGE_ROOT / "sem_pair_runner.ts",
        COMMON_PROMPT_PATH,
        CRITIC_PROMPT_PATH,
        SIMULATOR_PROMPT_PATH,
        CONTROLLER_PATH,
        COMMON_SCHEMA_PATH,
        CRITIC_SCHEMA_PATH,
        SIMULATOR_SCHEMA_PATH,
        BUDGET_PLAN_PATH,
        REPOSITORY_ROOT / "api" / "prompts" / "scientific-semantic-reconstruction-prompt.ts",
        REPOSITORY_ROOT / "src" / "features" / "scientific-semantic-reconstruction" / "schema.ts",
        REPOSITORY_ROOT / "src" / "features" / "scientific-semantic-reconstruction" / "canonical.ts",
        REPOSITORY_ROOT / "src" / "features" / "scientific-semantic-reconstruction" / "coverage.ts",
        REPOSITORY_ROOT / "src" / "features" / "scientific-semantic-reconstruction" / "relation-ownership.ts",
    ]
    manifest = {
        "experimentId": EXPERIMENT_ID,
        "freezeVersion": "1.0.0",
        "createdAt": utc_now(),
        "gitCommitAtFreeze": git_head(),
        "provider": "GOOGLE_GEMINI",
        "model": MODEL,
        "temperature": None,
        "targetProviderRequests": TARGET_PROVIDER_REQUESTS,
        "softProviderRequestLimit": SOFT_PROVIDER_REQUEST_LIMIT,
        "maxNewProviderRequests": MAX_NEW_PROVIDER_REQUESTS,
        "maximumStartsPerRolling60Seconds": 10,
        "concurrency": 1,
        "maximumTransientRetry": 1,
        "semanticRetry": 0,
        "configurations": CONFIGURATION_IDS,
        "frameworkVersions": {
            "google-genai": importlib.metadata.version("google-genai"),
            "pydantic": importlib.metadata.version("pydantic"),
            "pydantic-ai": importlib.metadata.version("pydantic-ai"),
            "dspy": importlib.metadata.version("dspy"),
        },
        "phaseA": {"scenarios": [f"I{index:02d}" for index in range(1, 9)], "rounds": ["T0", "T1", "T2"]},
        "phaseB": {"scenarios": ["I01", "I04", "I06", "I08"], "maximumQuestionsPerBranch": 2},
        "scenarioPackDigest": sha256(SCENARIO_PACK_PATH),
        "files": {
            str(path.relative_to(REPOSITORY_ROOT)): sha256(path)
            for path in files
        },
        "blindAccessed": False,
        "normativeDocumentsModified": False,
        "postObservationScientificTuningAllowed": False,
    }
    manifest["freezeDigest"] = logical_digest(manifest)
    write_json(FREEZE_PATH, manifest)
    return manifest


def verify_freeze() -> dict[str, Any]:
    manifest = read_json(FREEZE_PATH)
    for relative, expected in manifest["files"].items():
        actual = sha256(REPOSITORY_ROOT / relative)
        if actual != expected:
            raise RuntimeError(f"FREEZE_DRIFT:{relative}:{expected}:{actual}")
    if sha256(SCENARIO_PACK_PATH) != manifest["scenarioPackDigest"]:
        raise RuntimeError("SCENARIO_PACK_DIGEST_DRIFT")
    digest_source = {key: value for key, value in manifest.items() if key != "freezeDigest"}
    if logical_digest(digest_source) != manifest["freezeDigest"]:
        raise RuntimeError("FREEZE_MANIFEST_DIGEST_INVALID")
    return manifest


def error_kind(caught: BaseException) -> str:
    material = f"{caught.__class__.__name__}: {caught}".lower()
    if any(token in material for token in ["429", "resource_exhausted", "502", "503", "504", "timeout", "unavailable", "connection reset"]):
        return "TRANSIENT_PROVIDER"
    if any(token in material for token in ["401", "403", "unauthenticated", "permission_denied", "api key"]):
        return "AUTHENTICATION"
    if any(token in material for token in ["invalid model", "model not found", "does not exist"]):
        return "INVALID_MODEL"
    if any(token in material for token in ["400", "invalid_argument", "schema"]):
        return "DETERMINISTIC_CONTRACT"
    return "FRAMEWORK_OR_UNKNOWN"


def call_with_one_transient_retry(
    ledger: ProviderLedger,
    *,
    configuration_id: str,
    phase: str,
    scenario_id: str,
    round_id: str,
    operation: str,
    operation_key: str,
    function: Callable[[], Any],
) -> Any:
    try:
        return ledger.call(
            configuration_id=configuration_id,
            phase=phase,
            scenario_id=scenario_id,
            round_id=round_id,
            operation=operation,
            operation_key=operation_key,
            function=function,
        )
    except Exception as caught:
        if error_kind(caught) != "TRANSIENT_PROVIDER":
            raise
        time.sleep(60)
        return ledger.call(
            configuration_id=configuration_id,
            phase=phase,
            scenario_id=scenario_id,
            round_id=round_id,
            operation=operation,
            operation_key=f"{operation_key}:retry1",
            function=function,
            retry=1,
        )


def pydantic_agent(output_type: Any, prompt: str) -> Agent:
    model = GoogleModel(
        MODEL,
        provider=GoogleProvider(
            api_key=api_key(),
            retry_options=types.HttpRetryOptions(attempts=1),
        ),
    )
    return Agent(
        model,
        output_type=output_type,
        system_prompt=prompt,
        model_settings={"timeout": 30},
        retries=0,
    )


def run_pydantic_first(turns: list[ConversationTurn]) -> CommonScientificState:
    agent = pydantic_agent(CommonScientificState, COMMON_PROMPT_PATH.read_text(encoding="utf-8"))
    return agent.run_sync(render_conversation(turns)).output


def critic_trigger(state: CommonScientificState) -> tuple[bool, list[str]]:
    reasons: list[str] = []
    if state.ambiguities:
        reasons.append("AMBIGUITIES_PRESENT")
    if state.correctionsAndSupersessions:
        reasons.append("CORRECTIONS_OR_SUPERSESSIONS_PRESENT")
    if state.negationsAndConstraints:
        reasons.append("NEGATIONS_OR_CONSTRAINTS_PRESENT")
    if state.contextualScientificCandidates:
        reasons.append("CONTEXTUAL_CANDIDATES_PRESENT")
    if any(item.priority == "HIGH" for item in state.missingInformation):
        reasons.append("HIGH_DECISION_IMPACT_MISSING_INFORMATION")
    if any(relation.polarity in {"UNCERTAIN", "CONDITIONAL"} for relation in state.relations):
        reasons.append("UNCERTAIN_OR_CONDITIONAL_RELATION")
    ownership_conflict = any(
        item.epistemicStatus == "EXPLICIT_USER_STATED" and item.ownership not in {"USER", "RESEARCH_PROJECT_USER_CONTRIBUTION"}
        for item in state.explicitUserStatements
    ) or any(
        item.epistemicStatus != "EXPLICIT_USER_STATED" and item.ownership == "USER"
        for item in [*state.inferredContext, *state.contextualScientificCandidates]
    )
    if ownership_conflict:
        reasons.append("OWNERSHIP_OR_EPISTEMIC_CONFLICT")
    if state.contradictions:
        reasons.append("CONTRADICTION_PRESENT")
    return bool(reasons), reasons


def run_pydantic_critic(turns: list[ConversationTurn], first: CommonScientificState) -> CriticResult:
    agent = pydantic_agent(CriticResult, CRITIC_PROMPT_PATH.read_text(encoding="utf-8"))
    payload = {
        "conversation": [turn.model_dump(mode="json") for turn in turns],
        "stateToReview": first.model_dump(mode="json"),
    }
    return agent.run_sync(stable_json(payload)).output


class CommonContractSignature(dspy.Signature):
    """Return only a JSON object satisfying the supplied common contract."""

    instruction: str = dspy.InputField()
    conversation: str = dspy.InputField()
    common_state_json: str = dspy.OutputField(desc="CommonScientificState JSON object")


def run_dspy(turns: list[ConversationTurn]) -> tuple[CommonScientificState, dict[str, Any]]:
    lm = dspy.LM(f"gemini/{MODEL}", temperature=None, cache=False, num_retries=0, timeout=30)
    predictor = dspy.Predict(CommonContractSignature)
    instruction = (
        COMMON_PROMPT_PATH.read_text(encoding="utf-8")
        + "\nJSON_SCHEMA:\n"
        + json.dumps(CommonScientificState.model_json_schema(), ensure_ascii=False, sort_keys=True)
    )
    with dspy.context(lm=lm):
        native = predictor(instruction=instruction, conversation=render_conversation(turns))
    raw = native.common_state_json
    text = str(raw).strip()
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text, flags=re.IGNORECASE)
    state = CommonScientificState.model_validate(json.loads(text))
    return state, {"common_state_json": raw}


def semantic_context(model: dict[str, Any] | None) -> Any:
    if not model:
        return None
    return {
        "semanticModelId": model.get("semanticModelId"),
        "revision": model.get("revision"),
        "status": model.get("status"),
        "normalizedMeaning": model.get("normalizedMeaning"),
        "elements": model.get("elements"),
        "relations": model.get("relations"),
        "ambiguities": model.get("ambiguities"),
        "unknowns": model.get("unknowns"),
    }


def sem_pair_possible(
    turns_full: list[ConversationTurn],
    turns_single: list[ConversationTurn],
    previous_full: dict[str, Any] | None,
    previous_single: dict[str, Any] | None,
) -> bool:
    return (
        [turn.model_dump(mode="json") for turn in turns_full]
        == [turn.model_dump(mode="json") for turn in turns_single]
        and semantic_context(previous_full) == semantic_context(previous_single)
    )


def run_sem_process(
    *,
    mode: str,
    phase: str,
    scenario_id: str,
    round_id: str,
    turns: list[ConversationTurn],
    previous_full: dict[str, Any] | None,
    previous_single: dict[str, Any] | None,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "mode": mode,
        "phase": phase,
        "scenarioId": scenario_id,
        "roundId": round_id,
        "operationKey": f"{EXPERIMENT_ID}:{phase}:{scenario_id}:{round_id}:{mode}",
        "ledgerPath": str(LEDGER_PATH),
        "sessionId": f"ablation02-{phase.lower()}-{scenario_id.lower()}",
        "conversationTurns": [turn.model_dump(mode="json") for turn in turns],
    }
    if mode in {"PAIR", "FULL"}:
        payload["full"] = {"previousModel": previous_full}
    if mode in {"PAIR", "SINGLE"}:
        payload["single"] = {"previousModel": previous_single}
    executable = REPOSITORY_ROOT / "node_modules" / ".bin" / "vite-node"
    environment = os.environ.copy()
    environment["GEMINI_API_KEY"] = api_key()
    completed = subprocess.run(
        [str(executable), str(PACKAGE_ROOT / "sem_pair_runner.ts")],
        cwd=REPOSITORY_ROOT,
        input=json.dumps(payload, ensure_ascii=False),
        text=True,
        capture_output=True,
        check=False,
        env=environment,
    )
    if completed.returncode != 0:
        raise RuntimeError((completed.stderr or completed.stdout or "SEM_PAIR_RUNNER_FAILED")[-5000:])
    lines = [line for line in completed.stdout.splitlines() if line.strip()]
    if not lines:
        raise RuntimeError("SEM_PAIR_RUNNER_EMPTY_OUTPUT")
    return json.loads(lines[-1])


def sem_to_common(model: dict[str, Any], turns: list[ConversationTurn]) -> CommonScientificState:
    elements = [item for item in model.get("elements", []) if item.get("epistemicStatus") != "REJECTED_BY_USER"]
    by_id = {str(item.get("semanticElementId")): item for item in model.get("elements", [])}

    def ownership(status: str) -> str:
        if status == "EXPLICIT_USER_STATED":
            return "USER"
        if status == "CONFIRMED_BY_USER":
            return "RESEARCH_PROJECT_USER_CONFIRMATION"
        if status == "REJECTED_BY_USER":
            return "HISTORICAL_USER_CONTRIBUTION"
        return "SEM_CANDIDATE"

    def item(value: dict[str, Any]) -> dict[str, Any]:
        span = value.get("sourceSpan") or {}
        message_id = span.get("messageId") or value.get("provenance", {}).get("messageId")
        return {
            "itemId": str(value.get("semanticElementId")),
            "content": str(value.get("canonicalMeaning") or ""),
            "scientificRole": f"{value.get('type')}:{value.get('studyRole')}",
            "polarity": value.get("polarity") or "UNCERTAIN",
            "temporalContext": str(value.get("canonicalMeaning")) if value.get("type") == "TIMING" else None,
            "epistemicStatus": value.get("epistemicStatus") or "UNKNOWN",
            "ownership": ownership(str(value.get("epistemicStatus"))),
            "provenanceTurnIds": [message_id] if message_id else [],
            "sourceText": span.get("text"),
            "basis": value.get("inferenceReason"),
        }

    all_items = [item(value) for value in elements]
    explicit = [value for value in all_items if value["epistemicStatus"] == "EXPLICIT_USER_STATED"]
    inferred = [value for value in all_items if value["epistemicStatus"] == "INFERRED_HIGH_CONFIDENCE"]
    candidates = [
        value for value in all_items
        if value["epistemicStatus"] in {"INFERRED_CANDIDATE", "SUPPORTED_CANDIDATE", "UNSUPPORTED_CANDIDATE"}
    ]
    negations = [value for value in all_items if value["polarity"] in {"NEGATED", "CONDITIONAL"}]
    temporal = [value for value in all_items if value["scientificRole"].startswith("TIMING:")]
    relations = []
    for relation in model.get("relations", []):
        source = by_id.get(str(relation.get("sourceElementId")), {})
        target = by_id.get(str(relation.get("targetElementId")), {})
        relations.append({
            "relationId": str(relation.get("semanticRelationId")),
            "subject": str(source.get("canonicalMeaning") or relation.get("sourceElementId")),
            "predicate": str(relation.get("relationType") or "RELATED_TO"),
            "object": str(target.get("canonicalMeaning") or relation.get("targetElementId")),
            "polarity": relation.get("polarity") or "UNCERTAIN",
            "temporalContext": None,
            "epistemicStatus": relation.get("epistemicStatus") or "UNKNOWN",
            "ownership": ownership(str(relation.get("epistemicStatus"))),
            "provenanceTurnIds": [],
            "sourceText": None,
            "basis": relation.get("inferenceReason"),
        })
    priority = "HIGH" if model.get("status") == "CLARIFICATION_REQUIRED" else "MEDIUM"
    blocking = model.get("status") == "CLARIFICATION_REQUIRED"
    ambiguities = [
        {
            "ambiguityId": f"sem-ambiguity:{logical_digest(value)[:16]}",
            "content": value,
            "interpretations": [],
            "decisionImpact": "SEM reports an unresolved ambiguity; impact requires clarification.",
            "epistemicStatus": "AMBIGUOUS",
            "provenanceTurnIds": [],
        }
        for value in model.get("ambiguities", [])
    ]
    unknown_values = list(dict.fromkeys([*model.get("unknowns", []), *model.get("missingConcepts", []), *model.get("ellipses", [])]))
    unknowns = [
        {
            "missingId": f"sem-missing:{logical_digest(value)[:16]}",
            "content": value,
            "priority": priority,
            "blocking": blocking,
            "decisionImpact": "SEM reports missing or unresolved information.",
            "owner": "USER_OR_SPECIALIZED_OWNER_UNRESOLVED",
            "provenanceTurnIds": [],
        }
        for value in unknown_values
    ]
    corrections = []
    for value in model.get("elements", []):
        superseded = value.get("supersedesElementIds") or []
        if superseded or value.get("epistemicStatus") == "REJECTED_BY_USER":
            previous = [by_id.get(str(identity), {}).get("canonicalMeaning", str(identity)) for identity in superseded]
            corrections.append({
                "correctionId": f"sem-correction:{logical_digest(value)[:16]}",
                "previousContent": "; ".join(previous) or str(value.get("canonicalMeaning") or "historical state"),
                "currentContent": str(value.get("canonicalMeaning") or "rejected"),
                "disposition": "REJECTED" if value.get("epistemicStatus") == "REJECTED_BY_USER" else "SUPERSEDED",
                "provenanceTurnIds": [value.get("provenance", {}).get("messageId")] if value.get("provenance", {}).get("messageId") else [],
            })
    clarifications = [
        {
            "clarificationId": f"sem-clarification:{index + 1}:{logical_digest(value)[:10]}",
            "question": str(value.get("question")),
            "targetIds": [str(item) for item in value.get("resolvesElementIds", [])],
            "priority": priority,
            "blocking": blocking,
            "decisionImpact": str(value.get("reason") or "Clarification candidate produced by SEM."),
        }
        for index, value in enumerate(model.get("clarificationCandidates", []))
    ]
    ownership_rows = [
        {
            "statementId": f"ownership:{value['itemId']}",
            "content": value["content"],
            "owner": value["ownership"],
            "epistemicStatus": value["epistemicStatus"],
            "provenanceTurnIds": value["provenanceTurnIds"],
        }
        for value in all_items
    ]
    goals = [value["content"] for value in all_items if value["scientificRole"].startswith("SCIENTIFIC_INTENT:")]
    return CommonScientificState.model_validate({
        "originalRequest": turns[0].content,
        "conversationTurns": [turn.model_dump(mode="json") for turn in turns],
        "normalizedUnderstanding": str(model.get("normalizedMeaning") or ""),
        "scientificGoal": "; ".join(goals) or str(model.get("normalizedMeaning") or ""),
        "explicitUserStatements": explicit,
        "objects": all_items,
        "relations": relations,
        "inferredContext": inferred,
        "contextualScientificCandidates": candidates,
        "negationsAndConstraints": negations,
        "temporalModel": temporal,
        "ambiguities": ambiguities,
        "missingInformation": unknowns,
        "unknowns": unknowns,
        "correctionsAndSupersessions": corrections,
        "ownershipAndEpistemicState": ownership_rows,
        "clarificationCandidates": clarifications,
        "contradictions": list(model.get("contradictions", [])),
    })


def run_sem_configurations(
    *,
    phase: str,
    scenario_id: str,
    round_id: str,
    turns_full: list[ConversationTurn],
    turns_single: list[ConversationTurn],
    previous_full: dict[str, Any] | None,
    previous_single: dict[str, Any] | None,
) -> tuple[dict[str, Any] | None, dict[str, Any] | None]:
    existing_full = load_state(phase, scenario_id, round_id, "SEM_FULL")
    existing_single = load_state(phase, scenario_id, round_id, "SEM_SINGLE_PASS")
    if existing_full and existing_single:
        return (
            read_json(native_checkpoint(phase, scenario_id, round_id, "SEM_FULL"))["model"],
            read_json(native_checkpoint(phase, scenario_id, round_id, "SEM_SINGLE_PASS"))["model"],
        )
    if existing_full or existing_single:
        raise RuntimeError("PARTIAL_SEM_PAIR_CHECKPOINT_REQUIRES_MANUAL_RECONCILIATION")

    paired = sem_pair_possible(turns_full, turns_single, previous_full, previous_single)
    if paired:
        output = run_sem_process(
            mode="PAIR",
            phase=phase,
            scenario_id=scenario_id,
            round_id=round_id,
            turns=turns_full,
            previous_full=previous_full,
            previous_single=previous_single,
        )
        outputs = output
    else:
        full_output = run_sem_process(
            mode="FULL",
            phase=phase,
            scenario_id=scenario_id,
            round_id=round_id,
            turns=turns_full,
            previous_full=previous_full,
            previous_single=None,
        )
        single_output = run_sem_process(
            mode="SINGLE",
            phase=phase,
            scenario_id=scenario_id,
            round_id=round_id,
            turns=turns_single,
            previous_full=None,
            previous_single=previous_single,
        )
        outputs = {**full_output, **single_output, "pairedFirstReconstruction": False}

    models: dict[str, dict[str, Any] | None] = {}
    for configuration_id, turns in [("SEM_FULL", turns_full), ("SEM_SINGLE_PASS", turns_single)]:
        native = outputs.get(configuration_id) or {}
        if native.get("status") != "SUCCESS":
            write_json(native_checkpoint(phase, scenario_id, round_id, configuration_id), native)
            models[configuration_id] = None
            continue
        model = native["model"]
        state = sem_to_common(model, turns)
        save_state(
            phase=phase,
            scenario_id=scenario_id,
            round_id=round_id,
            configuration_id=configuration_id,
            state=state,
            native={**native, "pairedFirstReconstruction": paired},
            metadata={
                "pairedFirstReconstruction": paired,
                "criticExecuted": configuration_id == "SEM_FULL",
                "adapter": "DETERMINISTIC_SEM_MODEL_TO_COMMON_STATE",
            },
        )
        models[configuration_id] = model
    return models.get("SEM_FULL"), models.get("SEM_SINGLE_PASS")


def run_pydantic_configurations(
    *,
    ledger: ProviderLedger,
    phase: str,
    scenario_id: str,
    round_id: str,
    turns_common: list[ConversationTurn],
    turns_critic: list[ConversationTurn],
) -> None:
    existing_common = load_state(phase, scenario_id, round_id, "PYDANTIC_COMMON_CONTRACT")
    existing_critic = load_state(phase, scenario_id, round_id, "PYDANTIC_CONDITIONAL_CRITIC")
    if existing_common and existing_critic:
        return
    if existing_common or existing_critic:
        raise RuntimeError("PARTIAL_PYDANTIC_PAIR_CHECKPOINT_REQUIRES_MANUAL_RECONCILIATION")
    paired = [turn.model_dump(mode="json") for turn in turns_common] == [turn.model_dump(mode="json") for turn in turns_critic]

    if paired:
        first = call_with_one_transient_retry(
            ledger,
            configuration_id="PYDANTIC_SHARED_FIRST_OUTPUT",
            phase=phase,
            scenario_id=scenario_id,
            round_id=round_id,
            operation="PYDANTIC_COMMON_FIRST_PASS",
            operation_key=f"{EXPERIMENT_ID}:{phase}:{scenario_id}:{round_id}:PYDANTIC_SHARED_FIRST",
            function=lambda: run_pydantic_first(turns_common),
        )
        first_common = first
        first_critic = first
    else:
        first_common = call_with_one_transient_retry(
            ledger,
            configuration_id="PYDANTIC_COMMON_CONTRACT",
            phase=phase,
            scenario_id=scenario_id,
            round_id=round_id,
            operation="PYDANTIC_COMMON_FIRST_PASS",
            operation_key=f"{EXPERIMENT_ID}:{phase}:{scenario_id}:{round_id}:PYDANTIC_COMMON_FIRST",
            function=lambda: run_pydantic_first(turns_common),
        )
        first_critic = call_with_one_transient_retry(
            ledger,
            configuration_id="PYDANTIC_CONDITIONAL_CRITIC",
            phase=phase,
            scenario_id=scenario_id,
            round_id=round_id,
            operation="PYDANTIC_COMMON_FIRST_PASS",
            operation_key=f"{EXPERIMENT_ID}:{phase}:{scenario_id}:{round_id}:PYDANTIC_CRITIC_FIRST",
            function=lambda: run_pydantic_first(turns_critic),
        )

    save_state(
        phase=phase,
        scenario_id=scenario_id,
        round_id=round_id,
        configuration_id="PYDANTIC_COMMON_CONTRACT",
        state=first_common,
        native={"firstOutput": first_common.model_dump(mode="json")},
        metadata={"pairedFirstOutput": paired, "criticExecuted": False, "framework": "PydanticAI"},
    )
    required, reasons = critic_trigger(first_critic)
    if required:
        critic = call_with_one_transient_retry(
            ledger,
            configuration_id="PYDANTIC_CONDITIONAL_CRITIC",
            phase=phase,
            scenario_id=scenario_id,
            round_id=round_id,
            operation="PYDANTIC_CONDITIONAL_CRITIC",
            operation_key=f"{EXPERIMENT_ID}:{phase}:{scenario_id}:{round_id}:PYDANTIC_CONDITIONAL_CRITIC",
            function=lambda: run_pydantic_critic(turns_critic, first_critic),
        )
        final = critic.correctedState
        native = {
            "firstOutput": first_critic.model_dump(mode="json"),
            "criticTrigger": {"required": True, "reasons": reasons},
            "criticOutput": critic.model_dump(mode="json"),
        }
    else:
        final = first_critic
        native = {
            "firstOutput": first_critic.model_dump(mode="json"),
            "criticTrigger": {"required": False, "reasons": []},
            "criticOutput": None,
        }
    save_state(
        phase=phase,
        scenario_id=scenario_id,
        round_id=round_id,
        configuration_id="PYDANTIC_CONDITIONAL_CRITIC",
        state=final,
        native=native,
        metadata={"pairedFirstOutput": paired, "criticExecuted": required, "framework": "PydanticAI"},
    )


def run_dspy_configuration(
    *,
    ledger: ProviderLedger,
    phase: str,
    scenario_id: str,
    round_id: str,
    turns: list[ConversationTurn],
) -> None:
    if load_state(phase, scenario_id, round_id, "DSPY_COMMON_CONTRACT"):
        return
    state, native = call_with_one_transient_retry(
        ledger,
        configuration_id="DSPY_COMMON_CONTRACT",
        phase=phase,
        scenario_id=scenario_id,
        round_id=round_id,
        operation="DSPY_COMMON_FIRST_PASS",
        operation_key=f"{EXPERIMENT_ID}:{phase}:{scenario_id}:{round_id}:DSPY",
        function=lambda: run_dspy(turns),
    )
    save_state(
        phase=phase,
        scenario_id=scenario_id,
        round_id=round_id,
        configuration_id="DSPY_COMMON_CONTRACT",
        state=state,
        native=native,
        metadata={"criticExecuted": False, "framework": "DSPy", "optimizer": None, "scenarioDemonstrations": []},
    )


def select_question(state: CommonScientificState, asked_questions: set[str]) -> dict[str, Any] | None:
    candidates = [
        item for item in state.clarificationCandidates
        if item.question.strip().casefold() not in asked_questions
    ]
    groups = [
        [item for item in candidates if item.blocking and item.priority == "HIGH"],
        [item for item in candidates if item.priority == "HIGH"],
        [item for item in candidates if item.blocking and item.priority == "MEDIUM"],
        [item for item in candidates if item.priority == "MEDIUM"],
    ]
    for group in groups:
        if group:
            return group[0].model_dump(mode="json")
    return None


def simulator_answers(
    *,
    ledger: ProviderLedger,
    scenario: dict[str, Any],
    round_id: str,
    branches: dict[str, dict[str, Any]],
    questions: dict[str, str],
) -> dict[str, str]:
    if not questions:
        return {}
    checkpoint = NATIVE_ROOT / f"interactive-{scenario['scenarioId'].lower()}-{round_id.lower()}-researcher-simulator.json"
    if checkpoint.exists():
        payload = read_json(checkpoint)
        return {item["configurationId"]: item["answer"] for item in payload["answers"]}
    client = genai.Client(
        api_key=api_key(),
        http_options=types.HttpOptions(timeout=30_000, retry_options=types.HttpRetryOptions(attempts=1)),
    )
    payload = {
        "scenarioId": scenario["scenarioId"],
        "round": round_id,
        "hiddenCard": scenario["hiddenCard"],
        "branches": [
            {
                "configurationId": configuration_id,
                "conversation": branches[configuration_id]["turns"],
                "question": question,
            }
            for configuration_id, question in questions.items()
        ],
    }

    def call() -> SimulatorBatch:
        response = client.models.generate_content(
            model=MODEL,
            contents=stable_json(payload),
            config=types.GenerateContentConfig(
                system_instruction=SIMULATOR_PROMPT_PATH.read_text(encoding="utf-8"),
                response_mime_type="application/json",
                response_json_schema=SimulatorBatch.model_json_schema(),
            ),
        )
        return SimulatorBatch.model_validate_json(response.text)

    result = call_with_one_transient_retry(
        ledger,
        configuration_id="SIMULATED_RESEARCH_USER",
        phase="INTERACTIVE",
        scenario_id=scenario["scenarioId"],
        round_id=round_id,
        operation="BATCHED_RESEARCHER_SIMULATOR",
        operation_key=f"{EXPERIMENT_ID}:INTERACTIVE:{scenario['scenarioId']}:{round_id}:SIMULATOR",
        function=call,
    )
    expected = set(questions)
    actual = {item.configurationId for item in result.answers}
    if actual != expected:
        raise RuntimeError(f"SIMULATOR_BRANCH_SET_MISMATCH:{sorted(expected)}:{sorted(actual)}")
    write_json(checkpoint, result.model_dump(mode="json"))
    return {item.configurationId: item.answer for item in result.answers}


def run_phase_a() -> None:
    verify_freeze()
    ledger = ProviderLedger(LEDGER_PATH)
    for scenario in scenarios():
        previous_full: dict[str, Any] | None = None
        previous_single: dict[str, Any] | None = None
        summary = {"scenarioId": scenario["scenarioId"], "rounds": []}
        for index, round_id in enumerate(["T0", "T1", "T2"]):
            turns = conversation_for_common(scenario, index)
            previous_full, previous_single = run_sem_configurations(
                phase="COMMON_TRANSCRIPT",
                scenario_id=scenario["scenarioId"],
                round_id=round_id,
                turns_full=turns,
                turns_single=turns,
                previous_full=previous_full,
                previous_single=previous_single,
            )
            run_pydantic_configurations(
                ledger=ledger,
                phase="COMMON_TRANSCRIPT",
                scenario_id=scenario["scenarioId"],
                round_id=round_id,
                turns_common=turns,
                turns_critic=turns,
            )
            run_dspy_configuration(
                ledger=ledger,
                phase="COMMON_TRANSCRIPT",
                scenario_id=scenario["scenarioId"],
                round_id=round_id,
                turns=turns,
            )
            completed = [
                configuration_id for configuration_id in CONFIGURATION_IDS
                if state_checkpoint("COMMON_TRANSCRIPT", scenario["scenarioId"], round_id, configuration_id).exists()
            ]
            summary["rounds"].append({"round": round_id, "completedConfigurations": completed})
        write_json(COMMON_TRANSCRIPT_ROOT / f"{scenario['scenarioId'].lower()}.json", summary)
        print(f"PHASE_A {scenario['scenarioId']} COMPLETE reservations={len(ledger.reservations())}", flush=True)


def run_configuration_state(
    *,
    ledger: ProviderLedger,
    scenario_id: str,
    round_id: str,
    branches: dict[str, dict[str, Any]],
) -> None:
    full_branch = branches["SEM_FULL"]
    single_branch = branches["SEM_SINGLE_PASS"]
    full_model, single_model = run_sem_configurations(
        phase="INTERACTIVE",
        scenario_id=scenario_id,
        round_id=round_id,
        turns_full=[ConversationTurn.model_validate(turn) for turn in full_branch["turns"]],
        turns_single=[ConversationTurn.model_validate(turn) for turn in single_branch["turns"]],
        previous_full=full_branch.get("previousModel"),
        previous_single=single_branch.get("previousModel"),
    )
    full_branch["previousModel"] = full_model
    single_branch["previousModel"] = single_model
    run_pydantic_configurations(
        ledger=ledger,
        phase="INTERACTIVE",
        scenario_id=scenario_id,
        round_id=round_id,
        turns_common=[ConversationTurn.model_validate(turn) for turn in branches["PYDANTIC_COMMON_CONTRACT"]["turns"]],
        turns_critic=[ConversationTurn.model_validate(turn) for turn in branches["PYDANTIC_CONDITIONAL_CRITIC"]["turns"]],
    )
    run_dspy_configuration(
        ledger=ledger,
        phase="INTERACTIVE",
        scenario_id=scenario_id,
        round_id=round_id,
        turns=[ConversationTurn.model_validate(turn) for turn in branches["DSPY_COMMON_CONTRACT"]["turns"]],
    )


def run_phase_b() -> None:
    verify_freeze()
    ledger = ProviderLedger(LEDGER_PATH)
    scenario_map = {item["scenarioId"]: item for item in scenarios()}
    for scenario_id in ["I01", "I04", "I06", "I08"]:
        scenario = scenario_map[scenario_id]
        transcript_path = INTERACTIVE_ROOT / f"{scenario_id.lower()}.json"
        if transcript_path.exists() and read_json(transcript_path).get("status") == "COMPLETE":
            continue
        remaining_budget = MAX_NEW_PROVIDER_REQUESTS - len(ledger.reservations())
        if remaining_budget < 24:
            raise RuntimeError(f"PHASE_B_SCENARIO_NOT_STARTED_INSUFFICIENT_WORST_CASE_BUDGET:{scenario_id}:{remaining_budget}")
        branches = {
            configuration_id: {
                "configurationId": configuration_id,
                "turns": [{"turnId": f"{scenario_id}:{configuration_id}:T0", "role": "USER", "content": scenario["t0"]}],
                "askedQuestions": [],
                "selectedQuestions": [],
                "status": "ACTIVE",
                "previousModel": None,
            }
            for configuration_id in CONFIGURATION_IDS
        }
        for state_index, round_id in enumerate(["T0", "T1", "T2"]):
            run_configuration_state(
                ledger=ledger,
                scenario_id=scenario_id,
                round_id=round_id,
                branches=branches,
            )
            questions: dict[str, str] = {}
            for configuration_id, branch in branches.items():
                state = load_state("INTERACTIVE", scenario_id, round_id, configuration_id)
                if state is None:
                    branch["status"] = "FAILED_STATE"
                    continue
                selected = select_question(state, set(branch["askedQuestions"]))
                branch["selectedQuestions"].append({"round": round_id, "selection": selected or "FINISH"})
                if selected is None:
                    branch["status"] = "FINISHED"
                elif state_index >= 2:
                    branch["status"] = "MAX_DEPTH_WITH_OPEN_CLARIFICATION"
                else:
                    questions[configuration_id] = selected["question"]
            if state_index >= 2 or not questions:
                break
            answers = simulator_answers(
                ledger=ledger,
                scenario=scenario,
                round_id=f"R{state_index + 1}",
                branches=branches,
                questions=questions,
            )
            for configuration_id, question in questions.items():
                answer = answers[configuration_id]
                branch = branches[configuration_id]
                branch["askedQuestions"].append(question.strip().casefold())
                branch["turns"].append({
                    "turnId": f"{scenario_id}:{configuration_id}:Q{state_index + 1}",
                    "role": "ASSISTANT",
                    "content": question,
                })
                branch["turns"].append({
                    "turnId": f"{scenario_id}:{configuration_id}:R{state_index + 1}",
                    "role": "USER",
                    "content": answer,
                })
                branch["status"] = "ACTIVE"
        for branch in branches.values():
            branch.pop("previousModel", None)
        write_json(transcript_path, {
            "experimentId": EXPERIMENT_ID,
            "scenarioId": scenario_id,
            "status": "COMPLETE",
            "branches": branches,
        })
        print(f"PHASE_B {scenario_id} COMPLETE reservations={len(ledger.reservations())}", flush=True)


def summary() -> dict[str, Any]:
    ledger = ProviderLedger(LEDGER_PATH)
    events = ledger.events()
    reservations = ledger.reservations()
    completions = {event["requestNumber"]: event for event in events if event.get("event") == "COMPLETED"}
    calls_by_configuration: dict[str, int] = {}
    retries = 0
    latencies: dict[str, list[float]] = {}
    for reservation in reservations:
        configuration = reservation["configurationId"]
        calls_by_configuration[configuration] = calls_by_configuration.get(configuration, 0) + 1
        retries += int(reservation.get("retry") or 0) > 0
        completion = completions.get(reservation["requestNumber"])
        if completion:
            start = dt.datetime.fromisoformat(completion["startedAt"].replace("Z", "+00:00"))
            end = dt.datetime.fromisoformat(completion["completedAt"].replace("Z", "+00:00"))
            latencies.setdefault(configuration, []).append((end - start).total_seconds())
    phase_a_states = sum(
        state_checkpoint("COMMON_TRANSCRIPT", f"I{scenario:02d}", f"T{round_id}", configuration).exists()
        for scenario in range(1, 9)
        for round_id in range(3)
        for configuration in CONFIGURATION_IDS
    )
    phase_b_states = len(list(STATE_ROOT.glob("interactive-*.json")))
    return {
        "experimentId": EXPERIMENT_ID,
        "scenarioPackDigest": sha256(SCENARIO_PACK_PATH),
        "freezeVerified": bool(verify_freeze()),
        "providerCalls": len(reservations),
        "callsByConfiguration": dict(sorted(calls_by_configuration.items())),
        "retries": retries,
        "successfulProviderCalls": sum(completions.get(item["requestNumber"], {}).get("success") is True for item in reservations),
        "failedProviderCalls": sum(completions.get(item["requestNumber"], {}).get("success") is False for item in reservations),
        "phaseAStates": phase_a_states,
        "phaseBStates": phase_b_states,
        "latencyByConfiguration": {
            key: {
                "medianSeconds": round(statistics.median(values), 3),
                "meanSeconds": round(statistics.mean(values), 3),
            }
            for key, values in sorted(latencies.items()) if values
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("action", choices=["freeze", "verify-freeze", "phase-a", "phase-b", "summary"])
    args = parser.parse_args()
    if args.action == "freeze":
        print(stable_json(freeze()))
    elif args.action == "verify-freeze":
        print(stable_json(verify_freeze()))
    elif args.action == "phase-a":
        run_phase_a()
    elif args.action == "phase-b":
        run_phase_b()
    else:
        print(stable_json(summary()))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
