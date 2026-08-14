from __future__ import annotations

import argparse
import dataclasses
import datetime as dt
import enum
import hashlib
import importlib
import json
import os
from pathlib import Path
import re
import statistics
import subprocess
import sys
import time
from typing import Any


CAMPAIGN_ROOT = Path(__file__).resolve().parent
COMPARISON_ROOT = CAMPAIGN_ROOT.parent
REPOSITORY_ROOT = COMPARISON_ROOT.parents[1]
RESULT_ROOT = COMPARISON_ROOT / "results" / "sem-003d-comp"
RUN_ROOT = RESULT_ROOT / "runs"
EVALUATION_ROOT = RESULT_ROOT / "evaluations"
BLIND_ROOT = REPOSITORY_ROOT / "semantic-validation" / "sem-003" / "blind"
INPUT_ROOT = BLIND_ROOT / "input" / "cases"
SEALED_CASE_ROOT = BLIND_ROOT / "sealed-reference" / "cases"
SEALED_ENVELOPE_ROOT = BLIND_ROOT / "sealed-reference" / "envelopes"
EVALUATOR_ROOT = REPOSITORY_ROOT / "semantic-validation" / "sem-003" / "evaluator"
PRECOMMIT_PATH = CAMPAIGN_ROOT / "precommit-manifest.json"
GENERATION_MANIFEST_PATH = RESULT_ROOT / "generation-freeze-manifest.json"
EVALUATION_MANIFEST_PATH = RESULT_ROOT / "evaluation-manifest.json"
SUMMARY_PATH = RESULT_ROOT / "comparative-summary.json"

sys.path.insert(0, str(COMPARISON_ROOT))

from adapters.common import canonical_digest, normalize_projection  # noqa: E402
from adapters.evaluator_bridge import (  # noqa: E402
    EvaluatorBinding,
    KeyBinding,
    OwnershipBinding,
    bind_to_sem003_evaluator_1_1_0,
)
from adapters.langextract import normalize_langextract_document  # noqa: E402
from adapters.sem_current import normalize_sem_response  # noqa: E402
from contracts.projection import (  # noqa: E402
    ComparativeCaseInput,
    ConversationTurn,
    NormalizedCandidateSemanticRepresentation,
)


CAMPAIGN_ID = "SEM003D-COMP-COMMON-BLIND-01"
BLIND_SET_ID = "SEM003C-BLIND-QUALIFICATION-SET-01"
MODEL = "gemini-3.5-flash-lite"
PROVIDER = "GOOGLE_GEMINI"
EVALUATOR_VERSION = "1.3.0"
EVALUATOR_DIGEST = "0d0f48cf1859d3747fd17eeaf75d51a59e6a5d5a48a096beab67cbe32d94665b"
BLIND_PURPOSE = "SCIENTIFIC_UNDERSTANDING_EVALUATOR_BLIND_QUALIFICATION"
TERMINAL_STATUSES = {
    "SUCCESS",
    "PROVIDER_FAILURE",
    "PARSING_FAILURE",
    "NORMALIZATION_FAILURE",
    "FRAMEWORK_FAILURE",
}
MIN_RUN_START_INTERVAL_SECONDS = 6.0

BASELINES = [
    {
        "baselineId": "SEM003C1-SEM-CURRENT-01",
        "slug": "sem-current",
        "kind": "SEM",
        "manifest": "baseline-sem-current.json",
    },
    {
        "baselineId": "SEM003C1-INSTRUCTOR-PYDANTIC-01",
        "slug": "instructor-pydantic",
        "kind": "PROJECTION",
        "module": "baselines.instructor_pydantic",
        "manifest": "baseline-instructor-pydantic.json",
    },
    {
        "baselineId": "SEM003C1-PYDANTICAI-01",
        "slug": "pydanticai",
        "kind": "PROJECTION",
        "module": "baselines.pydantic_ai_baseline",
        "manifest": "baseline-pydanticai.json",
    },
    {
        "baselineId": "SEM003C1-DSPY-01",
        "slug": "dspy",
        "kind": "PROJECTION",
        "module": "baselines.dspy_baseline",
        "manifest": "baseline-dspy.json",
    },
    {
        "baselineId": "SEM003C1-LANGEXTRACT-01",
        "slug": "langextract",
        "kind": "LANGEXTRACT",
        "module": "baselines.langextract_baseline",
        "manifest": "baseline-langextract.json",
    },
    {
        "baselineId": "SEM003C1-OUTLINES-01",
        "slug": "outlines",
        "kind": "PROJECTION",
        "module": "baselines.outlines_baseline",
        "manifest": "baseline-outlines.json",
    },
]

CAPABILITY_PROPERTIES = {
    "C01_EXPLICIT_FIDELITY": ["P01", "P10", "P12"],
    "C02_MULTI_TURN_CONTEXT": ["P04", "P05", "P12", "P17"],
    "C03_CORRECTION_CHANGE_OF_MIND": ["P05"],
    "C04_NEGATION": ["P03"],
    "C05_NON_CAUSALITY": ["P06"],
    "C06_NECESSARY_IMPLICIT_INFORMATION": ["P07", "P10", "P14"],
    "C07_ELLIPSIS_COREFERENCE": ["P02", "P14", "P15"],
    "C08_AMBIGUITY": ["P09", "P14"],
    "C09_MISSING_INFORMATION": ["P09", "P13"],
    "C10_CLARIFICATION": ["P16"],
    "C11_TEMPORAL_REASONING": ["P04"],
    "C12_RELATION_SEMANTICS": ["P02", "P04"],
    "C13_CONCEPTUAL_PLAN_SEPARATION": ["P14"],
    "C14_OWNERSHIP": ["P07", "P08", "P11", "P12"],
    "C15_EPISTEMIC_STATUS": ["P03", "P07", "P09", "P12"],
    "C16_CONTEXTUAL_ENRICHMENT": ["P07", "P10", "P11", "P18"],
    "C17_STRUCTURAL_ROBUSTNESS": ["P15", "P17"],
    "C18_GLOBAL_SCIENTIFIC_STATE_RECONSTRUCTION": [
        "P01",
        "P02",
        "P03",
        "P04",
        "P05",
        "P09",
        "P11",
        "P12",
        "P13",
        "P14",
        "P16",
    ],
}


def utc_now() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat().replace("+00:00", "Z")


def read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def stable_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, indent=2) + "\n"


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(stable_json(value), encoding="utf-8")
    temporary.replace(path)


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    return sha256_bytes(path.read_bytes())


def collection_digest(paths: list[Path]) -> str:
    return sha256_bytes(
        stable_json(
            [
                {
                    "path": str(path.relative_to(REPOSITORY_ROOT)),
                    "sha256": sha256_file(path),
                }
                for path in sorted(paths)
            ]
        ).encode("utf-8")
    )


def sanitize(value: str) -> str:
    result = re.sub(r"AIza[0-9A-Za-z_-]{20,}", "[REDACTED_API_KEY]", value)
    return result[:8_000]


def to_jsonable(value: Any) -> Any:
    if hasattr(value, "model_dump"):
        return value.model_dump(mode="json")
    if dataclasses.is_dataclass(value):
        return to_jsonable(dataclasses.asdict(value))
    if isinstance(value, enum.Enum):
        return value.value
    if isinstance(value, dict):
        return {str(key): to_jsonable(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [to_jsonable(item) for item in value]
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    return repr(value)


def git(*arguments: str, check: bool = True) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["git", *arguments],
        cwd=REPOSITORY_ROOT,
        text=True,
        capture_output=True,
        check=check,
    )


def protected_paths() -> list[str]:
    return [
        "experiments/semantic-engine-comparison/baselines",
        "experiments/semantic-engine-comparison/adapters",
        "experiments/semantic-engine-comparison/contracts",
        "experiments/semantic-engine-comparison/prompts",
        "experiments/semantic-engine-comparison/manifests",
        "experiments/requirements-experiments-lock.txt",
        "src/features/scientific-semantic-reconstruction",
        "api/prompts/scientific-semantic-reconstruction-prompt.ts",
        "api/prompts/scientific-semantic-atomic-composition-prompt.ts",
        "semantic-validation/sem-003/evaluator/contracts",
        "semantic-validation/sem-003/evaluator/core",
        "semantic-validation/sem-003/evaluator/registry/evaluator-identity.json",
        "semantic-validation/sem-003/blind/input",
        "semantic-validation/sem-003/blind/sealed-reference",
    ]


def assert_protected_clean() -> None:
    changed = git("diff", "--name-only", "HEAD", "--", *protected_paths()).stdout.strip()
    if changed:
        raise RuntimeError(f"FROZEN_CAMPAIGN_ARTIFACT_CHANGED:{changed}")


def manifests() -> dict[str, dict[str, Any]]:
    root = COMPARISON_ROOT / "manifests"
    return {
        item["baselineId"]: read_json(root / item["manifest"])
        for item in BASELINES
    }


def case_files() -> list[Path]:
    manifest = read_json(BLIND_ROOT / "artifacts" / "blind-input-manifest.json")
    if manifest["blindSetId"] != BLIND_SET_ID or len(manifest["files"]) != 15:
        raise RuntimeError("BLIND_INPUT_MANIFEST_MISMATCH")
    files = [BLIND_ROOT / entry["path"] for entry in manifest["files"]]
    for file_path, entry in zip(files, manifest["files"], strict=True):
        if sha256_file(file_path) != entry["sha256"]:
            raise RuntimeError(f"BLIND_INPUT_DIGEST_MISMATCH:{file_path.name}")
    return files


def comparative_case(runtime_input: dict[str, Any]) -> ComparativeCaseInput:
    language = str(runtime_input["language"]).split("-", 1)[0]
    return ComparativeCaseInput(
        caseId=runtime_input["caseId"],
        caseVersion=runtime_input["version"],
        language=language,
        conversationTurns=[
            ConversationTurn(
                messageId=entry["turnId"],
                role="USER",
                content=entry["text"],
            )
            for entry in runtime_input["conversationTurns"]
        ],
    )


def schedule() -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for case_ordinal, file_path in enumerate(case_files(), start=1):
        runtime_input = read_json(file_path)
        rotation = (case_ordinal - 1) % len(BASELINES)
        ordered = BASELINES[rotation:] + BASELINES[:rotation]
        for baseline_ordinal, baseline in enumerate(ordered, start=1):
            result.append(
                {
                    "runOrdinal": len(result) + 1,
                    "caseOrdinal": case_ordinal,
                    "baselineOrdinalWithinCase": baseline_ordinal,
                    "runId": f"SEM003D-RUN-{case_ordinal:02d}-{baseline['slug'].upper()}",
                    "caseId": runtime_input["caseId"],
                    "caseFile": str(file_path.relative_to(REPOSITORY_ROOT)),
                    **baseline,
                }
            )
    if len(result) != 90:
        raise RuntimeError(f"EXPECTED_90_RUNS_GOT_{len(result)}")
    return result


def evaluator_identity() -> dict[str, Any]:
    identity = read_json(EVALUATOR_ROOT / "registry" / "evaluator-identity.json")
    if identity["version"] != EVALUATOR_VERSION or identity["configurationDigest"] != EVALUATOR_DIGEST:
        raise RuntimeError("EVALUATOR_IDENTITY_MISMATCH")
    return identity


def preflight(write: bool) -> dict[str, Any]:
    assert_protected_clean()
    evaluator_identity()
    frozen = manifests()
    for baseline in BASELINES:
        manifest = frozen[baseline["baselineId"]]
        if manifest["provider"] != PROVIDER or manifest["model"] != MODEL:
            raise RuntimeError(f"BASELINE_PROVIDER_MODEL_MISMATCH:{baseline['baselineId']}")
    if not os.environ.get("GEMINI_API_KEY", "").strip():
        raise RuntimeError("GEMINI_API_KEY_MISSING")
    RESULT_ROOT.mkdir(parents=True, exist_ok=True)
    if not os.access(RESULT_ROOT, os.W_OK):
        raise RuntimeError("RESULT_DIRECTORY_NOT_WRITABLE")
    case_files()
    freeze_index = read_json(COMPARISON_ROOT / "manifests" / "freeze-index.json")
    binding = read_json(
        EVALUATOR_ROOT / "registry" / "sem003c1r2-comparative-evaluator-binding.json"
    )
    value = {
        "schemaVersion": "1.0.0",
        "contractType": "SEM003D_COMP_PRECOMMIT_MANIFEST",
        "campaignId": CAMPAIGN_ID,
        "status": "PRECOMMITTED_BEFORE_FIRST_BLIND_RUN",
        "sourceHead": git("rev-parse", "HEAD").stdout.strip(),
        "branch": git("branch", "--show-current").stdout.strip(),
        "blindSet": {
            "blindSetId": BLIND_SET_ID,
            "version": "1.0.0",
            "caseCount": 15,
            "inputPackageDigest": read_json(
                BLIND_ROOT / "artifacts" / "blind-input-manifest.json"
            )["inputPackageDigest"],
        },
        "baselineFreezeDigest": freeze_index["freezeDigest"],
        "baselineIds": [entry["baselineId"] for entry in BASELINES],
        "baselineManifestDigests": {
            baseline_id: manifest["manifestDigest"]
            for baseline_id, manifest in sorted(frozen.items())
        },
        "evaluator": {
            "version": EVALUATOR_VERSION,
            "configurationDigest": EVALUATOR_DIGEST,
        },
        "evaluatorBindingDigest": sha256_file(
            EVALUATOR_ROOT / "registry" / "sem003c1r2-comparative-evaluator-binding.json"
        ),
        "bindingId": binding["bindingId"],
        "provider": PROVIDER,
        "model": MODEL,
        "temperature": None,
        "runCount": 90,
        "schedulePolicy": "CASE_MAJOR_WITH_BASELINE_ORDER_ROTATED_BY_CASE_ORDINAL",
        "scheduleDigest": sha256_bytes(stable_json(schedule()).encode("utf-8")),
        "minimumRunStartIntervalSeconds": MIN_RUN_START_INTERVAL_SECONDS,
        "sealedReferenceOpened": False,
        "providerCalls": 0,
        "createdAt": "2026-08-14T00:00:00Z",
    }
    if write:
        write_json(PRECOMMIT_PATH, value)
    return value


def assert_precommit() -> dict[str, Any]:
    if not PRECOMMIT_PATH.exists():
        raise RuntimeError("CAMPAIGN_PRECOMMIT_MISSING")
    recorded = read_json(PRECOMMIT_PATH)
    current = preflight(write=False)
    current["sourceHead"] = recorded["sourceHead"]
    if current != recorded:
        raise RuntimeError("CAMPAIGN_PRECOMMIT_DRIFT")
    tracked = git("ls-files", "--error-unmatch", str(PRECOMMIT_PATH.relative_to(REPOSITORY_ROOT)), check=False)
    if tracked.returncode != 0:
        raise RuntimeError("CAMPAIGN_PRECOMMIT_NOT_COMMITTED")
    campaign_changes = git(
        "diff",
        "--name-only",
        "HEAD",
        "--",
        str(CAMPAIGN_ROOT.relative_to(REPOSITORY_ROOT)),
    ).stdout.strip()
    if campaign_changes:
        raise RuntimeError(f"CAMPAIGN_SOURCE_CHANGED:{campaign_changes}")
    return recorded


def wait_for_pacing() -> None:
    state_path = RESULT_ROOT / "runtime-state.json"
    if state_path.exists():
        state = read_json(state_path)
        last = float(state.get("lastRunStartEpoch", 0))
        delay = MIN_RUN_START_INTERVAL_SECONDS - (time.time() - last)
        if delay > 0:
            time.sleep(delay)
    write_json(state_path, {"lastRunStartEpoch": time.time(), "updatedAt": utc_now()})


def classify_error(caught: BaseException) -> str:
    material = f"{caught.__class__.__name__} {caught}".lower()
    if any(
        marker in material
        for marker in [
            "resource_exhausted",
            "rate limit",
            "quota",
            "429",
            "503",
            "502",
            "504",
            "provider",
            "api key",
            "authentication",
            "modelhttp",
            "unavailable",
            "timeout",
            "connection",
        ]
    ):
        return "PROVIDER_FAILURE"
    if any(marker in material for marker in ["validationerror", "jsondecode", "parsing", "parse"]):
        return "PARSING_FAILURE"
    return "FRAMEWORK_FAILURE"


def sem_provider_call_count(response: dict[str, Any]) -> int | None:
    snapshot = (response.get("model") or {}).get("executionSnapshot") or {}
    reconstruction = snapshot.get("reconstructionAttempts")
    critic = snapshot.get("criticAttempts")
    if isinstance(reconstruction, list) and isinstance(critic, list):
        return len(reconstruction) + len(critic)
    return None


def execute_sem(case: ComparativeCaseInput) -> tuple[Any, int | None, str]:
    executable = REPOSITORY_ROOT / "node_modules" / ".bin" / "vite-node"
    completed = subprocess.run(
        [str(executable), "experiments/semantic-engine-comparison/baselines/sem_current.ts"],
        cwd=REPOSITORY_ROOT,
        input=json.dumps(case.model_dump(mode="json"), ensure_ascii=False),
        text=True,
        capture_output=True,
        check=False,
        env=os.environ.copy(),
    )
    stderr = sanitize(completed.stderr)
    if completed.returncode != 0:
        raise RuntimeError(stderr or f"SEM subprocess exit {completed.returncode}")
    lines = [line for line in completed.stdout.splitlines() if line.strip()]
    if not lines:
        raise ValueError("SEM returned no JSON output")
    response = json.loads(lines[-1])
    return response, sem_provider_call_count(response), stderr


def execute_external(baseline: dict[str, Any], case: ComparativeCaseInput) -> Any:
    module = importlib.import_module(baseline["module"])
    return module.run(case)


def normalize_native_output(
    baseline: dict[str, Any],
    case: ComparativeCaseInput,
    native: Any,
) -> NormalizedCandidateSemanticRepresentation:
    if baseline["kind"] == "LANGEXTRACT":
        return normalize_langextract_document(
            run_id="PENDING",
            case=case,
            annotated_document=native,
        )
    return normalize_projection(
        baseline_id=baseline["baselineId"],
        run_id="PENDING",
        case=case,
        native=native,
    )


def run_directory(entry: dict[str, Any]) -> Path:
    return RUN_ROOT / f"{entry['runOrdinal']:03d}-{entry['caseId'].lower()}-{entry['slug']}"


def execute_run(entry: dict[str, Any], frozen: dict[str, dict[str, Any]]) -> dict[str, Any]:
    directory = run_directory(entry)
    record_path = directory / "run.json"
    if record_path.exists():
        record = read_json(record_path)
        if record.get("terminalStatus") not in TERMINAL_STATUSES:
            raise RuntimeError(f"NON_TERMINAL_EXISTING_RUN:{entry['runId']}")
        return record
    directory.mkdir(parents=True, exist_ok=False)
    runtime_input = read_json(REPOSITORY_ROOT / entry["caseFile"])
    case = comparative_case(runtime_input)
    started_at = utc_now()
    wait_for_pacing()
    monotonic_start = time.monotonic()
    terminal_status = "SUCCESS"
    error: dict[str, Any] | None = None
    native: Any = None
    normalized: NormalizedCandidateSemanticRepresentation | None = None
    provider_calls: int | None = None
    stderr = ""
    try:
        if entry["kind"] == "SEM":
            native, provider_calls, stderr = execute_sem(case)
            try:
                normalized = normalize_sem_response(run_id="PENDING", case=case, response=native)
            except BaseException as caught:
                terminal_status = "NORMALIZATION_FAILURE"
                error = {
                    "class": caught.__class__.__name__,
                    "message": sanitize(str(caught)),
                }
        else:
            native = execute_external(entry, case)
            provider_calls = 1
            try:
                normalized = normalize_native_output(entry, case, native)
            except BaseException as caught:
                terminal_status = "NORMALIZATION_FAILURE"
                error = {
                    "class": caught.__class__.__name__,
                    "message": sanitize(str(caught)),
                }
        if normalized is not None:
            normalized = normalized.model_copy(update={"runId": entry["runId"]})
        if normalized is not None and normalized.executionStatus == "PROVIDER_FAILURE":
            terminal_status = "PROVIDER_FAILURE"
            error = {
                "class": "PROVIDER_EXECUTION_FAILURE",
                "message": "The frozen baseline returned an explicit provider-failure representation.",
            }
    except BaseException as caught:  # every run must reach an explicit terminal state
        terminal_status = classify_error(caught)
        error = {
            "class": caught.__class__.__name__,
            "message": sanitize(str(caught)),
        }
        if provider_calls is None:
            provider_calls = 1 if terminal_status in {"PROVIDER_FAILURE", "PARSING_FAILURE"} else 0
    latency_ms = round((time.monotonic() - monotonic_start) * 1_000, 3)
    completed_at = utc_now()

    native_json = to_jsonable(native)
    native_path = directory / "native-output.json"
    write_json(native_path, native_json)
    normalized_path: Path | None = None
    if normalized is not None:
        normalized_path = directory / "normalized-output.json"
        write_json(normalized_path, normalized.model_dump(mode="json"))
    manifest = frozen[entry["baselineId"]]
    record = {
        "schemaVersion": "1.0.0",
        "contractType": "SEM003D_COMP_RUN_RECORD",
        "campaignId": CAMPAIGN_ID,
        "runId": entry["runId"],
        "runOrdinal": entry["runOrdinal"],
        "caseOrdinal": entry["caseOrdinal"],
        "caseId": entry["caseId"],
        "caseInputDigest": sha256_file(REPOSITORY_ROOT / entry["caseFile"]),
        "baselineId": entry["baselineId"],
        "framework": manifest["framework"],
        "frameworkVersion": manifest["frameworkVersion"],
        "provider": manifest["provider"],
        "model": manifest["model"],
        "configuration": manifest["configuration"],
        "terminalStatus": terminal_status,
        "providerStatus": "SUCCESS" if terminal_status == "SUCCESS" else terminal_status,
        "parsingStatus": "PASS" if native is not None else "FAIL" if terminal_status == "PARSING_FAILURE" else "NOT_AVAILABLE",
        "normalizationStatus": "PASS" if normalized is not None else "FAIL" if native is not None else "NOT_AVAILABLE",
        "startedAt": started_at,
        "completedAt": completed_at,
        "latencyMs": latency_ms,
        "providerCallCount": provider_calls,
        "tokenUsage": {"input": None, "output": None, "total": None, "availability": "NOT_EXPOSED_BY_FROZEN_RUNNER"},
        "nativeOutput": {
            "path": str(native_path.relative_to(REPOSITORY_ROOT)),
            "sha256": sha256_file(native_path),
        },
        "normalizedOutput": None
        if normalized_path is None
        else {
            "path": str(normalized_path.relative_to(REPOSITORY_ROOT)),
            "sha256": sha256_file(normalized_path),
        },
        "stderr": stderr or None,
        "error": error,
        "bestRunSelected": False,
        "retryPerformedByCampaign": False,
        "sealedReferenceAccessed": False,
    }
    write_json(record_path, record)
    return record


def generation_manifest(records: list[dict[str, Any]]) -> dict[str, Any]:
    assert len(records) == 90
    if len({(entry["caseId"], entry["baselineId"]) for entry in records}) != 90:
        raise RuntimeError("DUPLICATE_OR_MISSING_CASE_BASELINE_PAIR")
    if any(entry["terminalStatus"] not in TERMINAL_STATUSES for entry in records):
        raise RuntimeError("NON_TERMINAL_RUN_AT_GENERATION_FREEZE")
    output_files = sorted(
        path
        for path in RUN_ROOT.rglob("*.json")
        if path.is_file()
    )
    return {
        "schemaVersion": "1.0.0",
        "contractType": "SEM003D_COMP_GENERATION_FREEZE_MANIFEST",
        "campaignId": CAMPAIGN_ID,
        "status": "GENERATION_COMPLETE_OUTPUTS_FROZEN",
        "runsExpected": 90,
        "runsTerminal": len(records),
        "uniqueCaseBaselinePairs": len({(entry["caseId"], entry["baselineId"]) for entry in records}),
        "terminalStatusCounts": {
            status: sum(entry["terminalStatus"] == status for entry in records)
            for status in sorted(TERMINAL_STATUSES)
        },
        "providerCallsKnown": sum(
            entry["providerCallCount"]
            for entry in records
            if isinstance(entry["providerCallCount"], int)
        ),
        "providerCallCountUnknownRuns": sum(
            not isinstance(entry["providerCallCount"], int) for entry in records
        ),
        "outputFileCount": len(output_files),
        "outputCollectionDigest": collection_digest(output_files),
        "runRecords": [
            {
                "runId": entry["runId"],
                "caseId": entry["caseId"],
                "baselineId": entry["baselineId"],
                "terminalStatus": entry["terminalStatus"],
                "recordPath": str((run_directory(schedule()[entry["runOrdinal"] - 1]) / "run.json").relative_to(REPOSITORY_ROOT)),
                "recordDigest": sha256_file(run_directory(schedule()[entry["runOrdinal"] - 1]) / "run.json"),
            }
            for entry in sorted(records, key=lambda value: value["runOrdinal"])
        ],
        "referencesOpened": False,
        "outputFreezeAt": utc_now(),
        "baselineMutationAfterFirstRun": False,
        "evaluatorMutationAfterFirstRun": False,
        "tuningAfterObservation": False,
    }


def generate() -> None:
    assert_precommit()
    frozen = manifests()
    records: list[dict[str, Any]] = []
    for entry in schedule():
        assert_protected_clean()
        record = execute_run(entry, frozen)
        records.append(record)
        print(
            f"{entry['runOrdinal']:03d}/090 {entry['caseId']} {entry['baselineId']} {record['terminalStatus']} {record['latencyMs']}ms",
            flush=True,
        )
    assert_protected_clean()
    manifest = generation_manifest(records)
    write_json(GENERATION_MANIFEST_PATH, manifest)
    print(
        f"GENERATION_FROZEN terminal={manifest['runsTerminal']} digest={manifest['outputCollectionDigest']}",
        flush=True,
    )


def assert_generation_frozen() -> dict[str, Any]:
    if not GENERATION_MANIFEST_PATH.exists():
        raise RuntimeError("GENERATION_FREEZE_MANIFEST_MISSING")
    manifest = read_json(GENERATION_MANIFEST_PATH)
    records = [read_json(run_directory(entry) / "run.json") for entry in schedule()]
    current = generation_manifest(records)
    for volatile in ["outputFreezeAt"]:
        current[volatile] = manifest[volatile]
    if current != manifest:
        raise RuntimeError("GENERATION_OUTPUT_FREEZE_DRIFT")
    return manifest


def candidate_id(run_id: str) -> str:
    return f"SEM3-EVAL-CAND-COMP-{sha256_bytes(run_id.encode('utf-8'))[:20].upper()}"


def empty_candidate(
    record: dict[str, Any],
    benchmark_case: dict[str, Any],
    envelope: dict[str, Any],
) -> dict[str, Any]:
    execution_status = (
        "PROVIDER_FAILURE" if record["terminalStatus"] == "PROVIDER_FAILURE" else "NOT_EVALUABLE"
    )
    return {
        "schemaVersion": "1.3.0",
        "contractType": "BENCHMARK_EVALUATION_CANDIDATE",
        "purpose": BLIND_PURPOSE,
        "candidateId": candidate_id(record["runId"]),
        "caseId": benchmark_case["caseId"],
        "caseVersion": benchmark_case["version"],
        "envelopeId": envelope["envelopeId"],
        "envelopeVersion": envelope["version"],
        "evaluationMode": "FUTURE_SEM_RUNTIME",
        "sourceType": "FUTURE_SEM_RUNTIME_OUTPUT",
        "structureProfile": "NOT_AVAILABLE",
        "executionStatus": execution_status,
        "semanticElements": [],
        "obligationMappings": [
            {
                "obligationId": entry["obligationId"],
                "status": "NOT_EVALUABLE",
                "evidenceType": "EXPLICIT_NORMALIZED_MAPPING",
                "candidateElementRefs": [],
            }
            for entry in envelope["required"]
        ],
        "prohibitionSignals": [
            {"prohibitionId": entry["prohibitionId"], "status": "NOT_EVALUABLE", "evidenceRefs": []}
            for entry in envelope["prohibited"]
        ],
        "optionalCandidateMappings": [
            {"candidateId": entry["candidateId"], "status": "NOT_EVALUABLE", "epistemicStatus": "NOT_EVALUABLE", "evidenceRefs": []}
            for entry in envelope["optionalRelevant"]
        ],
        "ambiguityMappings": [
            {"ambiguityId": entry["ambiguityId"], "status": "NOT_EVALUABLE", "evidenceRefs": []}
            for entry in envelope["admissibleAmbiguities"]
        ],
        "clarificationMapping": {"status": "NOT_EVALUABLE", "decisionImpactMapping": "NOT_EVALUABLE", "evidenceRefs": []},
        "ownershipMappings": [
            {"boundaryId": entry["boundaryId"], "status": "NOT_EVALUABLE", "evidenceRefs": []}
            for entry in envelope["ownershipBoundaries"]
        ],
        "provenanceSummary": {"status": "NOT_EVALUABLE", "sourceRequestReconstructible": False, "historyReconstructible": False, "evidenceRefs": []},
        "adjudicationClaims": [],
    }


def bound_candidate(
    record: dict[str, Any],
    benchmark_case: dict[str, Any],
    envelope: dict[str, Any],
) -> dict[str, Any]:
    if record["normalizedOutput"] is None:
        return empty_candidate(record, benchmark_case, envelope)
    normalized = NormalizedCandidateSemanticRepresentation.model_validate(
        read_json(REPOSITORY_ROOT / record["normalizedOutput"]["path"])
    )
    binding = EvaluatorBinding(
        candidateId=candidate_id(record["runId"]),
        caseId=benchmark_case["caseId"],
        caseVersion=benchmark_case["version"],
        envelopeId=envelope["envelopeId"],
        envelopeVersion=envelope["version"],
        purpose="SCIENTIFIC_UNDERSTANDING_EVALUATOR_DEVELOPMENT",
        requirements=[
            KeyBinding(referenceId=entry["obligationId"], acceptedSemanticKeys=[entry["semanticKey"]])
            for entry in envelope["required"]
        ],
        prohibitions=[
            KeyBinding(referenceId=entry["prohibitionId"], acceptedSemanticKeys=[entry["semanticKey"]])
            for entry in envelope["prohibited"]
        ],
        optionalCandidates=[
            KeyBinding(referenceId=entry["candidateId"], acceptedSemanticKeys=[entry["semanticKey"]])
            for entry in envelope["optionalRelevant"]
        ],
        ambiguities=[
            KeyBinding(referenceId=entry["ambiguityId"], acceptedSemanticKeys=[])
            for entry in envelope["admissibleAmbiguities"]
        ],
        ownershipBoundaries=[
            OwnershipBinding(boundaryId=entry["boundaryId"], prohibitedAdoptedSemanticKeys=[])
            for entry in envelope["ownershipBoundaries"]
        ],
    )
    candidate = bind_to_sem003_evaluator_1_1_0(normalized, binding)
    candidate["schemaVersion"] = "1.3.0"
    candidate["purpose"] = BLIND_PURPOSE
    return candidate


def evaluate_with_node(evaluation_input: dict[str, Any]) -> dict[str, Any]:
    completed = subprocess.run(
        ["node", str(CAMPAIGN_ROOT / "evaluate-run.mjs")],
        cwd=REPOSITORY_ROOT,
        input=json.dumps(evaluation_input, ensure_ascii=False),
        text=True,
        capture_output=True,
        check=False,
    )
    if completed.returncode != 0:
        raise RuntimeError(sanitize(completed.stderr or completed.stdout))
    return json.loads(completed.stdout)


def property_aliases() -> tuple[dict[str, str], dict[str, str]]:
    registry = read_json(EVALUATOR_ROOT / "registry" / "property-registry.json")
    by_id = {entry["id"]: entry["alias"] for entry in registry["properties"]}
    by_alias = {entry["alias"]: entry["id"] for entry in registry["properties"]}
    return by_id, by_alias


def capability_status(
    capability_aliases: list[str],
    applicable_aliases: set[str],
    judgments: dict[str, str],
) -> str:
    tested = [alias for alias in capability_aliases if alias in applicable_aliases]
    if not tested:
        return "NOT_TESTED"
    values = [judgments.get(alias, "NOT_EVALUABLE") for alias in tested]
    if "VIOLATED" in values:
        return "FAIL"
    if values and all(value == "SATISFIED" for value in values):
        return "PASS"
    if "SATISFIED" in values:
        return "PARTIAL"
    return "NOT_EVALUABLE"


def evaluate() -> None:
    generation = assert_generation_frozen()
    assert_protected_clean()
    by_id, _ = property_aliases()
    cases = {path.stem.removesuffix(".case"): read_json(path) for path in SEALED_CASE_ROOT.glob("*.case.json")}
    envelopes = {path.stem.removesuffix(".envelope"): read_json(path) for path in SEALED_ENVELOPE_ROOT.glob("*.envelope.json")}
    if len(cases) != 15 or len(envelopes) != 15:
        raise RuntimeError("SEALED_REFERENCE_COUNT_MISMATCH")
    evaluation_rows: list[dict[str, Any]] = []
    for entry in schedule():
        record = read_json(run_directory(entry) / "run.json")
        slug = Path(entry["caseFile"]).name.removesuffix(".input.json")
        benchmark_case = cases[slug]
        envelope = envelopes[slug]
        candidate = bound_candidate(record, benchmark_case, envelope)
        evaluation_input = {
            "schemaVersion": "1.3.0",
            "contractType": "BENCHMARK_EVALUATION_INPUT",
            "evaluationId": f"SEM3-EVAL-COMP-{sha256_bytes(record['runId'].encode('utf-8'))[:20].upper()}",
            "evaluationMode": "FUTURE_SEM_RUNTIME",
            "benchmarkSet": "BLIND",
            "benchmarkCase": benchmark_case,
            "acceptanceEnvelope": envelope,
            "candidateOutput": candidate,
        }
        directory = EVALUATION_ROOT / f"{entry['runOrdinal']:03d}-{entry['caseId'].lower()}-{entry['slug']}"
        write_json(directory / "candidate.json", candidate)
        write_json(directory / "evaluation-input.json", evaluation_input)
        try:
            result = evaluate_with_node(evaluation_input)
            write_json(directory / "evaluator-result.json", result)
            error = None
        except BaseException as caught:
            result = None
            error = {"class": caught.__class__.__name__, "message": sanitize(str(caught))}
            write_json(directory / "evaluation-error.json", error)
        applicable_ids = set(benchmark_case["reference"]["applicableSEM002Properties"])
        applicable_aliases = {by_id[value] for value in applicable_ids if value in by_id}
        judgments = {
            by_id[entry["propertyId"]]: entry["judgment"]
            for entry in (result or {}).get("propertyJudgments", [])
            if entry["propertyId"] in by_id
        }
        p_matrix = {
            f"P{index:02d}": judgments.get(f"P{index:02d}", "NOT_EVALUABLE")
            if f"P{index:02d}" in applicable_aliases
            else "NOT_TESTED"
            for index in range(1, 19)
        }
        c_matrix = {
            capability: capability_status(aliases, applicable_aliases, judgments)
            for capability, aliases in CAPABILITY_PROPERTIES.items()
        }
        row = {
            "runId": record["runId"],
            "caseId": record["caseId"],
            "baselineId": record["baselineId"],
            "terminalStatus": record["terminalStatus"],
            "evaluatorStatus": "PASS" if result is not None else "ERROR",
            "disposition": (result or {}).get("disposition", "NOT_EVALUABLE"),
            "level1": (result or {}).get("level1", {}).get("status", "NOT_EVALUABLE"),
            "level2": (result or {}).get("level2", {}).get("status", "NOT_EVALUABLE"),
            "firstCause": (result or {}).get("firstCause"),
            "P01ToP18": p_matrix,
            "C01ToC18": c_matrix,
            "error": error,
        }
        write_json(directory / "matrix-row.json", row)
        evaluation_rows.append(row)
        print(
            f"EVAL {entry['runOrdinal']:03d}/090 {entry['caseId']} {entry['baselineId']} {row['disposition']}",
            flush=True,
        )
    assert_protected_clean()
    write_json(RESULT_ROOT / "p01-p18-matrix.json", {"campaignId": CAMPAIGN_ID, "rows": [{"runId": row["runId"], "caseId": row["caseId"], "baselineId": row["baselineId"], **row["P01ToP18"]} for row in evaluation_rows]})
    write_json(RESULT_ROOT / "c01-c18-capability-matrix.json", {"campaignId": CAMPAIGN_ID, "derivationRule": "NOT_TESTED when no mapped applicable property; FAIL on any VIOLATED; PASS when all mapped applicable properties are SATISFIED; PARTIAL when SATISFIED coexists with unresolved judgments; otherwise NOT_EVALUABLE.", "mapping": CAPABILITY_PROPERTIES, "rows": [{"runId": row["runId"], "caseId": row["caseId"], "baselineId": row["baselineId"], **row["C01ToC18"]} for row in evaluation_rows]})
    summary = aggregate(evaluation_rows)
    write_json(SUMMARY_PATH, summary)
    evaluation_files = sorted(path for path in EVALUATION_ROOT.rglob("*.json") if path.is_file())
    manifest = {
        "schemaVersion": "1.0.0",
        "contractType": "SEM003D_COMP_EVALUATION_MANIFEST",
        "campaignId": CAMPAIGN_ID,
        "status": "EVALUATION_COMPLETE",
        "generationFreezeDigest": sha256_file(GENERATION_MANIFEST_PATH),
        "outputFreezeAt": generation["outputFreezeAt"],
        "referencesOpenedAt": utc_now(),
        "referencesOpenedOnlyAfterGenerationFreeze": True,
        "referenceCaseCount": len(cases),
        "referenceEnvelopeCount": len(envelopes),
        "evaluationsExpected": 90,
        "evaluationsRecorded": len(evaluation_rows),
        "evaluatorErrors": sum(row["evaluatorStatus"] == "ERROR" for row in evaluation_rows),
        "evaluatorVersion": EVALUATOR_VERSION,
        "evaluatorConfigurationDigest": EVALUATOR_DIGEST,
        "evaluationCollectionDigest": collection_digest(evaluation_files),
        "realHumanReferenceReview": "NOT_PERFORMED",
        "finalPD011ReferenceEligibility": "NO",
        "tuningAfterObservation": False,
        "baselineReplayAfterReferenceOpening": False,
    }
    write_json(EVALUATION_MANIFEST_PATH, manifest)
    print(f"EVALUATION_COMPLETE rows={len(evaluation_rows)}", flush=True)


def aggregate(rows: list[dict[str, Any]]) -> dict[str, Any]:
    records = {
        entry["runId"]: read_json(run_directory(schedule()[entry["runOrdinal"] - 1]) / "run.json")
        for entry in schedule()
    }
    result: list[dict[str, Any]] = []
    for baseline in BASELINES:
        selected = [row for row in rows if row["baselineId"] == baseline["baselineId"]]
        selected_records = [records[row["runId"]] for row in selected]
        latencies = [entry["latencyMs"] for entry in selected_records]
        p_counts = {
            f"P{index:02d}": {
                status: sum(row["P01ToP18"][f"P{index:02d}"] == status for row in selected)
                for status in ["SATISFIED", "VIOLATED", "ADJUDICATION_REQUIRED", "NOT_APPLICABLE", "NOT_EVALUABLE", "NOT_TESTED"]
            }
            for index in range(1, 19)
        }
        c_counts = {
            capability: {
                status: sum(row["C01ToC18"][capability] == status for row in selected)
                for status in ["PASS", "PARTIAL", "FAIL", "NOT_TESTED", "NOT_EVALUABLE"]
            }
            for capability in CAPABILITY_PROPERTIES
        }
        result.append(
            {
                "baselineId": baseline["baselineId"],
                "runs": len(selected),
                "terminalStatusCounts": {
                    status: sum(entry["terminalStatus"] == status for entry in selected_records)
                    for status in sorted(TERMINAL_STATUSES)
                },
                "structurallyValidOutputs": sum(entry["normalizationStatus"] == "PASS" for entry in selected_records),
                "dispositions": {
                    disposition: sum(row["disposition"] == disposition for row in selected)
                    for disposition in sorted({row["disposition"] for row in selected})
                },
                "absoluteP01ToP12Violations": sum(
                    status == "VIOLATED"
                    for row in selected
                    for alias, status in row["P01ToP18"].items()
                    if int(alias[1:]) <= 12
                ),
                "propertyCounts": p_counts,
                "capabilityCounts": c_counts,
                "providerCallsKnown": sum(entry["providerCallCount"] or 0 for entry in selected_records),
                "providerCallUnknownRuns": sum(entry["providerCallCount"] is None for entry in selected_records),
                "latencyTotalMs": round(sum(latencies), 3),
                "latencyMedianMs": round(statistics.median(latencies), 3),
                "tokens": "NOT_EXPOSED_BY_FROZEN_RUNNERS",
            }
        )
    by_case = []
    for case_id in sorted({row["caseId"] for row in rows}):
        selected = [row for row in rows if row["caseId"] == case_id]
        by_case.append(
            {
                "caseId": case_id,
                "dispositions": {row["baselineId"]: row["disposition"] for row in selected},
                "level1": {row["baselineId"]: row["level1"] for row in selected},
                "firstCauses": {row["baselineId"]: row["firstCause"] for row in selected},
                "capabilityDivergences": {
                    capability: {row["baselineId"]: row["C01ToC18"][capability] for row in selected}
                    for capability in CAPABILITY_PROPERTIES
                    if len({row["C01ToC18"][capability] for row in selected}) > 1
                },
            }
        )
    return {
        "schemaVersion": "1.0.0",
        "contractType": "SEM003D_COMP_COMPARATIVE_SUMMARY",
        "campaignId": CAMPAIGN_ID,
        "runs": len(rows),
        "baselines": result,
        "caseComparisons": by_case,
        "noCompositeScore": True,
        "realHumanReferenceReview": "NOT_PERFORMED",
        "finalPD011ReferenceEligibility": "NO",
    }


def validate() -> None:
    generation = assert_generation_frozen()
    if generation["runsTerminal"] != 90:
        raise RuntimeError("GENERATION_NOT_90_TERMINAL")
    assert_protected_clean()
    if EVALUATION_MANIFEST_PATH.exists():
        evaluation = read_json(EVALUATION_MANIFEST_PATH)
        if evaluation["evaluationsRecorded"] != 90 or not SUMMARY_PATH.exists():
            raise RuntimeError("EVALUATION_INCOMPLETE")
        rows = []
        for entry in schedule():
            directory = EVALUATION_ROOT / f"{entry['runOrdinal']:03d}-{entry['caseId'].lower()}-{entry['slug']}"
            rows.append(read_json(directory / "matrix-row.json"))
        if len(rows) != 90:
            raise RuntimeError("MATRIX_ROW_COUNT_MISMATCH")
    print("SEM003D_COMP_VALIDATION PASS", flush=True)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["preflight", "write-precommit", "generate", "evaluate", "validate"])
    arguments = parser.parse_args()
    if arguments.command == "preflight":
        value = preflight(write=False)
        print(f"PREFLIGHT PASS schedule={value['runCount']} evaluator={value['evaluator']['version']}")
    elif arguments.command == "write-precommit":
        value = preflight(write=True)
        print(f"PRECOMMIT WRITTEN scheduleDigest={value['scheduleDigest']}")
    elif arguments.command == "generate":
        generate()
    elif arguments.command == "evaluate":
        evaluate()
    elif arguments.command == "validate":
        validate()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
