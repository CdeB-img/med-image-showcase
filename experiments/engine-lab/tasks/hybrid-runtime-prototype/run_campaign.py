from __future__ import annotations

import argparse
import importlib.metadata
import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any


TASK_ROOT = Path(__file__).resolve().parent
REPOSITORY_ROOT = TASK_ROOT.parents[3]
RESULT_ROOT = TASK_ROOT.parents[1] / "results" / "hybrid-runtime-prototype-01"
SCENARIO_PACK = REPOSITORY_ROOT / "experiments" / "semantic-engine-comparison" / "results" / "common-contract-ablation-02" / "scenario-pack-frozen.json"
LEDGER_PATH = RESULT_ROOT / "provider-ledger.jsonl"
MANIFEST_PATH = RESULT_ROOT / "experiment-manifest.json"
RUNTIME_IDENTITIES_PATH = RESULT_ROOT / "runtime-identities.json"

sys.path.insert(0, str(TASK_ROOT))

from adjudication.pydantic_adjudicator import PydanticTypedAdjudicator  # noqa: E402
from audit.deterministic_adapter import DeterministicSemanticAuditor  # noqa: E402
from audit.semantic_audit_l import SemanticAuditL  # noqa: E402
from contracts.models import CandidateScientificState, ConversationTurn  # noqa: E402
from interpreter.pydantic_primary import PydanticPrimaryInterpreter  # noqa: E402
from pipeline.core import HybridRuntimePipeline  # noqa: E402
from pipeline.ledger import (  # noqa: E402
    MAX_NEW_PROVIDER_REQUESTS,
    MAX_STARTS_PER_ROLLING_60_SECONDS,
    MODEL,
    ProviderLedger,
    utc_now,
)
from pipeline.storage import atomic_write_json, file_digest, logical_digest, read_json  # noqa: E402


def load_environment() -> None:
    path = REPOSITORY_ROOT / ".env.local"
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        if key.strip() and key.strip() not in os.environ:
            os.environ[key.strip()] = value.strip().strip('"').strip("'")


def api_key() -> str:
    load_environment()
    value = os.environ.get("GEMINI_API_KEY", "").strip()
    if not value:
        raise RuntimeError("GEMINI_API_KEY_REQUIRED")
    return value


def git_head() -> str:
    return subprocess.run(
        ["git", "rev-parse", "HEAD"], cwd=REPOSITORY_ROOT, text=True, capture_output=True, check=True
    ).stdout.strip()


def scenario_values() -> list[dict[str, Any]]:
    values = read_json(SCENARIO_PACK)["scenarios"]
    if [item.get("scenarioId") for item in values] != [f"I{index:02d}" for index in range(1, 9)]:
        raise RuntimeError("VISIBLE_SCENARIO_BINDING_INVALID")
    return values


def turns_for(value: dict[str, Any], index: int) -> list[ConversationTurn]:
    turns = [ConversationTurn(turnId="T0", role="USER", content=value["t0"])]
    if index >= 1:
        turns.append(ConversationTurn(turnId="R1", role="USER", content=value["r1"]))
    if index >= 2:
        turns.append(ConversationTurn(turnId="R2", role="USER", content=value["r2"]))
    return turns


def source_files() -> list[Path]:
    files = [
        path for path in TASK_ROOT.rglob("*")
        if path.is_file()
        and "__pycache__" not in path.parts
        and path.suffix in {".py", ".ts", ".json", ".md"}
    ]
    files.extend([
        REPOSITORY_ROOT / "api" / "prompts" / "scientific-semantic-reconstruction-prompt.ts",
        REPOSITORY_ROOT / "src" / "features" / "scientific-semantic-reconstruction" / "schema.ts",
        REPOSITORY_ROOT / "src" / "features" / "scientific-semantic-reconstruction" / "types.ts",
        REPOSITORY_ROOT / "experiments" / "engine-lab" / "tasks" / "semantic-audit" / "semantic_audit.py",
        REPOSITORY_ROOT / "experiments" / "engine-lab" / "tasks" / "semantic-audit" / "guards.py",
        REPOSITORY_ROOT / "experiments" / "engine-lab" / "contracts" / "semantic-audit-finding.schema.json",
        SCENARIO_PACK,
    ])
    return sorted(set(files))


def provider_budget() -> dict[str, Any]:
    plan = {
        "calculationBasis": "ACTUAL_IMPLEMENTED_HARNESS_MAXIMUM",
        "visibleScenarios": 8,
        "statesPerScenario": 3,
        "primaryStates": 24,
        "pydanticPrimaryMaximum": 24,
        "semanticAuditLConditionalMaximum": 24,
        "typedAdjudicatorConditionalMaximum": 24,
        "deterministicAuditProviderCalls": 0,
        "viewsMetricsReportsProviderCalls": 0,
        "nominalConditionalMaximum": 72,
        "transientRetryReserve": 8,
        "absoluteMaximum": 80,
        "maximumStartsPerRolling60Seconds": 10,
        "concurrency": 1,
        "maximumTransientRetryPerOperation": 1,
        "semanticRetry": 0,
        "checkpointRules": [
            "A terminal primary operation is never replayed for P1, P2 or P3.",
            "SEM-AUDIT-D is local and non-mutating.",
            "SEM-AUDIT-L and adjudication are each called at most once per state, except one transport retry.",
            "Reports, metrics and human views are local deterministic operations.",
        ],
    }
    if plan["nominalConditionalMaximum"] + plan["transientRetryReserve"] != MAX_NEW_PROVIDER_REQUESTS:
        raise RuntimeError("PROVIDER_BUDGET_PLAN_MISMATCH")
    return plan


def runtime_identities(primary: PydanticPrimaryInterpreter, semantic: SemanticAuditL, adjudicator: PydanticTypedAdjudicator) -> dict[str, Any]:
    return {
        "experimentId": "HYBRID-RUNTIME-PROTOTYPE-01",
        "createdAt": utc_now(),
        "runtimes": [
            primary.identity.model_dump(mode="json"),
            {
                "runtimeId": "SEM_AUDIT_D",
                "runtimeVersion": "0.1.0",
                "provider": "LOCAL_DETERMINISTIC",
                "model": None,
                "sourceDigest": logical_digest({
                    "audit": file_digest(REPOSITORY_ROOT / "experiments" / "engine-lab" / "tasks" / "semantic-audit" / "semantic_audit.py"),
                    "guards": file_digest(REPOSITORY_ROOT / "experiments" / "engine-lab" / "tasks" / "semantic-audit" / "guards.py"),
                }),
            },
            {
                "runtimeId": semantic.runtimeId,
                "runtimeVersion": semantic.runtimeVersion,
                "provider": "GOOGLE_GEMINI",
                "model": MODEL,
                "temperature": None,
                "promptSource": "NOXIA_SEM_SINGLE_PROMPT_PLUS_FINDINGS_ONLY_ADAPTER",
                "promptIdentityDigest": logical_digest({
                    "semPromptSource": file_digest(REPOSITORY_ROOT / "api" / "prompts" / "scientific-semantic-reconstruction-prompt.ts"),
                    "adapterRunner": file_digest(TASK_ROOT / "audit" / "sem_audit_l_runner.ts"),
                }),
                "schemaDigest": semantic.schemaDigest,
            },
            {
                "runtimeId": adjudicator.runtimeId,
                "runtimeVersion": adjudicator.runtimeVersion,
                "provider": "GOOGLE_GEMINI",
                "model": MODEL,
                "temperature": None,
                "promptDigest": adjudicator.promptDigest,
                "schemaDigest": adjudicator.schemaDigest,
                "configurationDigest": adjudicator.configurationDigest,
            },
            {
                "runtimeId": "HYBRID_RUNTIME_PIPELINE",
                "runtimeVersion": "0.1.0-experimental",
                "writesResearchProject": False,
                "qryImplemented": False,
            },
        ],
    }


def build_components(key: str) -> tuple[PydanticPrimaryInterpreter, SemanticAuditL, PydanticTypedAdjudicator]:
    ledger = ProviderLedger(LEDGER_PATH)
    return (
        PydanticPrimaryInterpreter(ledger=ledger, apiKey=key),
        SemanticAuditL(ledger=ledger, apiKey=key, repositoryRoot=REPOSITORY_ROOT),
        PydanticTypedAdjudicator(ledger=ledger, apiKey=key),
    )


def freeze() -> dict[str, Any]:
    RESULT_ROOT.mkdir(parents=True, exist_ok=True)
    for directory in [
        "raw", "candidate-states", "deterministic-findings", "semantic-audit-findings",
        "adjudication-records", "consolidated-states", "human-review",
    ]:
        (RESULT_ROOT / directory).mkdir(parents=True, exist_ok=True)
    LEDGER_PATH.touch(exist_ok=True)
    if ProviderLedger(LEDGER_PATH).reservations():
        raise RuntimeError("FREEZE_REQUIRES_ZERO_PROVIDER_REQUESTS")
    key = "freeze-only-not-used"
    primary, semantic, adjudicator = build_components(key)
    identities = runtime_identities(primary, semantic, adjudicator)
    atomic_write_json(RUNTIME_IDENTITIES_PATH, identities)
    manifest = {
        "experimentId": "HYBRID-RUNTIME-PROTOTYPE-01",
        "version": "0.1.0-experimental",
        "status": "FROZEN_PRE_PROVIDER_EXECUTION",
        "classification": ["PRODUCT_CANDIDATE", "NON_NORMATIVE", "VISIBLE", "REVERSIBLE"],
        "createdAt": utc_now(),
        "gitCommitAtFreeze": git_head(),
        "provider": "GOOGLE_GEMINI",
        "model": MODEL,
        "temperature": None,
        "providerBudget": provider_budget(),
        "corpus": {
            "source": str(SCENARIO_PACK.relative_to(REPOSITORY_ROOT)),
            "digest": file_digest(SCENARIO_PACK),
            "scenarios": [f"I{index:02d}" for index in range(1, 9)],
            "states": ["T0", "T1", "T2"],
            "primaryStateCount": 24,
            "visibleOnly": True,
        },
        "ablations": [
            "P0_PYDANTIC_DIRECT",
            "P1_PYDANTIC_PLUS_AUDIT_D",
            "P2_PYDANTIC_PLUS_AUDIT_D_PLUS_AUDIT_L",
            "P3_FULL_HYBRID_CANDIDATE",
        ],
        "runtimeIdentitiesDigest": file_digest(RUNTIME_IDENTITIES_PATH),
        "files": {
            str(path.relative_to(REPOSITORY_ROOT)): file_digest(path)
            for path in source_files()
        },
        "blindAccessed": False,
        "knowledgeLoaded": False,
        "researchProjectWritesAllowed": False,
        "normativeDocumentsModified": False,
        "qryImplemented": False,
    }
    manifest["freezeDigest"] = logical_digest(manifest)
    atomic_write_json(MANIFEST_PATH, manifest)
    return manifest


def verify_freeze() -> dict[str, Any]:
    manifest = read_json(MANIFEST_PATH)
    for relative, expected in manifest["files"].items():
        actual = file_digest(REPOSITORY_ROOT / relative)
        if actual != expected:
            raise RuntimeError(f"EXPERIMENT_FREEZE_DRIFT:{relative}:{expected}:{actual}")
    if file_digest(SCENARIO_PACK) != manifest["corpus"]["digest"]:
        raise RuntimeError("VISIBLE_SCENARIO_DIGEST_DRIFT")
    value = {key: item for key, item in manifest.items() if key != "freezeDigest"}
    if logical_digest(value) != manifest["freezeDigest"]:
        raise RuntimeError("FREEZE_MANIFEST_DIGEST_INVALID")
    return manifest


def run() -> None:
    verify_freeze()
    key = api_key()
    primary, semantic, adjudicator = build_components(key)
    pipeline = HybridRuntimePipeline(
        primary=primary,
        deterministicAuditor=DeterministicSemanticAuditor(),
        semanticAuditor=semantic,
        adjudicator=adjudicator,
        resultRoot=RESULT_ROOT,
    )
    for scenario in scenario_values():
        previous: CandidateScientificState | None = None
        for index, turn in enumerate(["T0", "T1", "T2"]):
            result = pipeline.run_state(
                scenario=scenario["scenarioId"],
                turn=turn,
                conversationId=f"HYBRID-{scenario['scenarioId']}",
                turns=turns_for(scenario, index),
                previousState=previous,
                contextInputs=[],
                experimentalFinalState=turn == "T2",
            )
            previous = result.consolidated.candidateState or result.primary
            calls = len(ProviderLedger(LEDGER_PATH).reservations())
            print(
                f"{scenario['scenarioId']} {turn} COMPLETE auditL={result.auditLTriggered} "
                f"adjudicator={result.adjudicatorTriggered} calls={calls}",
                flush=True,
            )


def validate() -> None:
    verify_freeze()
    candidate_files = sorted((RESULT_ROOT / "candidate-states").glob("*.json"))
    consolidated_files = sorted((RESULT_ROOT / "consolidated-states").glob("*.json"))
    if len(candidate_files) not in {0, 24}:
        raise RuntimeError(f"CANDIDATE_CHECKPOINT_COUNT_INVALID:{len(candidate_files)}")
    if len(consolidated_files) not in {0, 24}:
        raise RuntimeError(f"CONSOLIDATED_CHECKPOINT_COUNT_INVALID:{len(consolidated_files)}")
    for path in candidate_files:
        CandidateScientificState.model_validate(read_json(path)["candidateState"])
    reservations = ProviderLedger(LEDGER_PATH).reservations()
    if len(reservations) > MAX_NEW_PROVIDER_REQUESTS:
        raise RuntimeError("PROVIDER_BUDGET_EXCEEDED")
    if MAX_STARTS_PER_ROLLING_60_SECONDS != 10:
        raise RuntimeError("RATE_LIMIT_CONFIGURATION_DRIFT")
    print(json.dumps({
        "candidateStates": len(candidate_files),
        "consolidatedStates": len(consolidated_files),
        "providerCalls": len(reservations),
        "maximumProviderCalls": MAX_NEW_PROVIDER_REQUESTS,
        "status": "VALID",
    }, sort_keys=True))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["freeze", "verify-freeze", "run", "report", "validate"])
    args = parser.parse_args()
    if args.command == "freeze":
        print(json.dumps(freeze()["providerBudget"], indent=2, sort_keys=True))
    elif args.command == "verify-freeze":
        print(verify_freeze()["freezeDigest"])
    elif args.command == "run":
        run()
    elif args.command == "report":
        from reporting import produce_reports
        produce_reports(REPOSITORY_ROOT, RESULT_ROOT, SCENARIO_PACK)
    else:
        validate()


if __name__ == "__main__":
    main()
